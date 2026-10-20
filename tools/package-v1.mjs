import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {parse} from 'acorn';
import {DIRECTOR_PRODUCT,DIRECTOR_IDENTITIES} from '../product-identity.js';
import {projectRoot,sha256} from './compose-source.mjs';
import {composeDualMode} from './compose-dual-mode.mjs';
import {EXTENSION_PACKAGE_LIMIT,EXTENSION_PACKAGE_METADATA,EXTENSION_PACKAGE_IDENTITY_PREFIX,
  validateExtensionManifest,validateExtensionPackageMetadata,validateExtensionPackage,parseExtensionBuildIdentity}
  from '../tests/fixtures/hub-api2/src/extension-packages.js';

export const PACKAGE_REFERENCE='36aaec46282e67bd01b87035165977a40d23acc9';
export const EXPECTED=Object.freeze({productId:'miemie.story-director',scriptId:'fc2d2ead-68af-43fc-904d-a72ece07277b',
  repository:'https://github.com/SheepSheepLab/MieMie-Story-Director',name:'咩咩故事导演',englishName:'MieMie Story Director',launcherName:'咩咩导演',entry:'entry.js',icon:'assets/icon.png'});
export const jsonBytes=value=>Buffer.from(JSON.stringify(value,null,2)+'\n','utf8');
const fail=(message)=>{throw Error(message);};
const same=(a,b,message)=>{if(a!==b)fail(message);};
export async function verifyReferences(){
  const pin=JSON.parse(await readFile(new URL('tests/fixtures/phase5-references.json',projectRoot),'utf8'));
  same(pin.commit,PACKAGE_REFERENCE,'Hub package reference commit mismatch');same(pin.version,'0.8.1','Hub version mismatch');
  for(const [file,hash] of Object.entries(pin.files))same(sha256(await readFile(new URL('tests/fixtures/hub-package-0.8.1/'+file,projectRoot))),hash,'Hub reference hash mismatch: '+file);
  same(JSON.parse(await readFile(new URL('tests/fixtures/hub-package-0.8.1/package.json',projectRoot))).version,'0.8.1','Hub package version mismatch');
}
export function verifyPNG(icon,hash){
  if(!Buffer.isBuffer(icon)||icon.length<33||icon.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||icon.readUInt32BE(8)!==13||icon.toString('ascii',12,16)!=='IHDR')fail('Invalid PNG asset');
  if(icon.readUInt32BE(16)!==1254||icon.readUInt32BE(20)!==1254||icon[24]!==8||icon[25]!==6)fail('Approved PNG must remain 1254x1254 RGBA with alpha');
  let offset=8,idat=false,iend=false;
  while(offset+12<=icon.length){const size=icon.readUInt32BE(offset),end=offset+12+size;if(end>icon.length)fail('Truncated PNG');const kind=icon.toString('ascii',offset+4,offset+8);if(kind==='IDAT')idat=true;offset=end;if(kind==='IEND'){if(size!==0||offset!==icon.length)fail('Invalid PNG end');iend=true;break;}}
  if(!idat||!iend)fail('Missing PNG image data');same(sha256(icon),hash,'Approved icon byte hash mismatch');
  return {width:1254,height:1254,colorType:'RGBA',alphaPreserved:true,sha256:hash};
}
export function scanPublicContent(content){
  // The sole literal apiKey exception below is the frozen public storage key,
  // never a credential value. Unknown nonempty literal credentials still fail.
  const patterns=[['local path',/(?:\/Users\/|\/private\/(?:tmp|var)\/|\/var\/folders\/|file:\/\/|[A-Za-z]:\\(?:Users|Documents)\\)/i],
    ['credential',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{20,}|\bgh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9_-]{20,}/],
    ['literal credential',/\b(?:api[_-]?key|secret|password)\s*[:=]\s*['"](?!(?:meeme_story_director_api_key_v1)['"])[^'"\n]{8,}['"]/i],
    ['development fixture',/fixture\.invalid|demo\.invalid|SECRET-HISTORY|BOTTOM_CHAIN|__phase3Fixture|Owner Review 编辑示例|private-test-key|page-secret/]];
  for(const[label,pattern]of patterns)if(pattern.test(content))fail('Public package contains '+label);
  return {credentialPatterns:'PASS',localPaths:'PASS',developmentFixtures:'PASS'};
}
// Remove only parsed JS comments. Preserve line breaks for ASI and all literal
// strings (including frozen prompts). Source/UI files themselves are untouched.
export function releaseCode(code){const comments=[];parse(code,{ecmaVersion:'latest',onComment:comments});let cursor=0,out='';
  for(const c of comments){out+=code.slice(cursor,c.start)+code.slice(c.start,c.end).replace(/[^\r\n]/g,' ');cursor=c.end;}out+=code.slice(cursor);new vm.Script(out);return out;
}
export async function loadInputs(){
  const read=async file=>JSON.parse(await readFile(new URL(file,projectRoot),'utf8'));
  const [manifest,pkg,lock,template,baseline,icon,runtime]=await Promise.all([read('manifest.json'),read('package.json'),read('package-lock.json'),read('packaging/script-template.json'),read('tests/fixtures/0.1.22/baseline-lock.json'),readFile(new URL('assets/icon.png',projectRoot)),composeDualMode()]);
  return {manifest,pkg,lock,template,baseline,icon,runtime,product:DIRECTOR_PRODUCT,identities:DIRECTOR_IDENTITIES};
}
export async function createBundle(input){
  input ||= await loadInputs();
  await verifyReferences();
  const {manifest,pkg,lock,template,baseline,icon,runtime,product,identities}=input;
  validateExtensionManifest(manifest,EXPECTED.repository);
  if(manifest.apiVersion!==2||manifest.hubApi?.min!==2||manifest.hubApi?.max!==2)fail('Expected API2 declaration');
  for(const[key,value]of Object.entries({id:EXPECTED.productId,name:EXPECTED.name,repository:EXPECTED.repository,entry:EXPECTED.entry,icon:EXPECTED.icon}))same(manifest[key],value,'Manifest identity/entry mismatch: '+key);
  same(manifest.contributes?.launcher?.title,EXPECTED.launcherName,'Launcher name mismatch');same(manifest.license,'GPL-3.0-or-later','License mismatch');
  for(const value of [pkg.version,lock.version,lock.packages?.['']?.version,product.version])same(value,manifest.version,'Version mismatch');
  for(const[key,value]of Object.entries({name:EXPECTED.name,englishName:EXPECTED.englishName,launcherName:EXPECTED.launcherName,repository:EXPECTED.repository}))same(product[key],value,'Product identity mismatch: '+key);
  same(identities.productId,EXPECTED.productId,'productId mismatch');same(identities.scriptId,EXPECTED.scriptId,'scriptId mismatch');same(template.id,EXPECTED.scriptId,'Template scriptId mismatch');same(template.name,EXPECTED.name+' '+manifest.version,'Template version mismatch');
  if(template.content!==''||Object.keys(template.data||{}).length)fail('Template must contain empty content/data');
  await readFile(new URL(manifest.entry,projectRoot)); // Entry existence, in addition to actual compilation.
  const png=verifyPNG(icon,baseline.approvedIconSha256);
  if(!runtime.includes(JSON.stringify(manifest,null,2)))fail('Compiled entry Manifest mismatch');
  if(!runtime.includes('data:image/png;base64,'+icon.toString('base64')))fail('Approved icon not embedded in compiled entry');
  const identity={schemaVersion:1,productId:manifest.id,version:manifest.version,scriptId:template.id,repository:manifest.repository};
  const content=EXTENSION_PACKAGE_IDENTITY_PREFIX+JSON.stringify(identity)+'\n'+releaseCode(runtime);
  const script={...template,name:manifest.name+' '+manifest.version,content};
  const artifactName='MieMie-Story-Director-Extension-'+manifest.version+'.json',artifact=jsonBytes(script);
  if(artifact.length>EXTENSION_PACKAGE_LIMIT)fail('Package exceeds 16 MiB limit');
  const metadata={schemaVersion:1,format:'tavern-helper-script',productId:manifest.id,version:manifest.version,tag:'v'+manifest.version,scriptId:script.id,manifest,
    asset:{name:artifactName,size:artifact.length,sha256:sha256(artifact)},contentSha256:sha256(content)};
  const metadataBytes=jsonBytes(metadata),manifestBytes=jsonBytes(manifest);
  const files=new Map([[artifactName,artifact],[EXTENSION_PACKAGE_METADATA,metadataBytes],['manifest.json',manifestBytes]]);
  files.set('SHA256SUMS',Buffer.from([...files].map(([name,bytes])=>sha256(bytes)+'  '+name).join('\n')+'\n'));
  const report=await validateBundle({files,metadata,icon,png});return {files,metadata,script,report};
}
export async function validateBundle({files,metadata,icon,png}){
  await verifyReferences();
  const update=files.get(EXTENSION_PACKAGE_METADATA);if(!update||update.length>64*1024)fail('Missing/oversized update metadata');
  const actual=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(update));
  if(metadata&&JSON.stringify(actual)!==JSON.stringify(metadata))fail('Update metadata mismatch');metadata=actual;
  validateExtensionPackageMetadata(metadata,EXPECTED.repository,{tag_name:metadata.tag,draft:false});
  same(metadata.productId,EXPECTED.productId,'Package productId mismatch');same(metadata.scriptId,EXPECTED.scriptId,'Package scriptId mismatch');same(metadata.version,DIRECTOR_PRODUCT.version,'Package/source version mismatch');
  same(metadata.asset.name,'MieMie-Story-Director-Extension-'+metadata.version+'.json','Artifact filename mismatch');
  const sourceManifest=JSON.parse(await readFile(new URL('manifest.json',projectRoot),'utf8'));
  same(JSON.stringify(metadata.manifest),JSON.stringify(sourceManifest),'Package/source Manifest mismatch');
  const artifact=files.get(metadata.asset.name);if(!artifact)fail('Missing artifact');
  const script=await validateExtensionPackage(artifact,metadata);
  same(script.name,EXPECTED.name+' '+metadata.version,'Artifact name mismatch');
  same(script.export_with.data,true,'export_with.data mismatch');same(script.export_with.button,true,'export_with.button mismatch');
  const manifestBytes=files.get('manifest.json');if(!manifestBytes||!manifestBytes.equals(jsonBytes(metadata.manifest)))fail('Manifest asset mismatch');
  for(const [key,value] of Object.entries({id:EXPECTED.productId,name:EXPECTED.name,repository:EXPECTED.repository,entry:EXPECTED.entry}))same(metadata.manifest[key],value,'Package Manifest mismatch: '+key);same(metadata.manifest.icon,EXPECTED.icon,'Package icon mismatch');
  const sums=files.get('SHA256SUMS'),expectedSums=[...files].filter(([name])=>name!=='SHA256SUMS').map(([name,bytes])=>sha256(bytes)+'  '+name).join('\n')+'\n';
  if(!sums||sums.toString()!==expectedSums)fail('SHA256SUMS mismatch');
  const approved=JSON.parse(await readFile(new URL('tests/fixtures/0.1.22/baseline-lock.json',projectRoot),'utf8')).approvedIconSha256;
  icon ||= await readFile(new URL('assets/icon.png',projectRoot));png=verifyPNG(icon,approved);
  if(!script.content.includes('data:image/png;base64,'+icon.toString('base64')))fail('Embedded icon mismatch');
  const scan=scanPublicContent(script.info+'\n'+script.content+'\n'+JSON.stringify(script)+'\n'+update+'\n'+manifestBytes);
  new vm.Script(script.content);const identity=parseExtensionBuildIdentity(script.content);
  same(script.content.slice(script.content.indexOf('\n')+1),releaseCode(await composeDualMode()),'Compiled production entry mismatch');
  return {version:metadata.version,artifact:metadata.asset.name,size:artifact.length,sha256:sha256(artifact),contentSha256:sha256(script.content),identity,png,scan,hub:'0.8.1',reference:PACKAGE_REFERENCE};
}
export async function writeBundle(bundle,directory=new URL('build/',projectRoot)){await mkdir(directory,{recursive:true});for(const[name,bytes]of bundle.files)await writeFile(new URL(name,directory),bytes);}
