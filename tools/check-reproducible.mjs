import {mkdtemp,cp,rm,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {projectRoot,sha256} from './compose-source.mjs';
const temp=await mkdtemp(join(tmpdir(),'miemie-director-repro-'));
const exec=(cmd,args,cwd)=>execFileSync(cmd,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,TZ:'UTC',LC_ALL:'C',GIT_CONFIG_NOSYSTEM:'1'}});
const excluded=new Set(['.git','node_modules','build','review','coverage','.DS_Store']);
const files=async dir=>(await readdir(dir,{withFileTypes:true})).filter(e=>!excluded.has(e.name)&&!e.name.endsWith('.log')).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>[e]);
async function sourceDigest(dir,prefix=''){const result=[];for(const e of await files(dir)){const relative=prefix+e.name,p=join(dir,e.name);if(e.isDirectory())result.push(...await sourceDigest(p,relative+'/'));else if(e.isFile())result.push([relative,sha256(await readFile(p))]);else throw Error('Source snapshot contains unsupported symlink: '+relative);}return result;}
try{
  const source=fileURLToPath(projectRoot),snapshot=join(temp,'snapshot'),before=await sourceDigest(source);
  await cp(source,snapshot,{recursive:true,filter:p=>!excluded.has(basename(p))&&!p.endsWith('.log')});
  if(JSON.stringify(await sourceDigest(snapshot))!==JSON.stringify(before))throw Error('Snapshot differs from source');
  exec('git',['init','-q'],snapshot);exec('git',['add','.'],snapshot);
  exec('git',['-c','user.name=Local Reproducibility Test','-c','user.email=repro@example.invalid','-c','core.hooksPath=/dev/null','commit','-qm','Ephemeral local source snapshot; not a release'],snapshot);
  const outputs=[],runs=[],fileBytes=[];
  for(let i=1;i<=2;i++){
    const cwd=join(temp,'clean-'+i);exec('git',['worktree','add','--detach','-q',cwd,'HEAD'],snapshot);
    if(exec('git',['status','--porcelain'],cwd).trim())throw Error('Checkout not clean');
    exec('npm',['ci','--ignore-scripts','--offline','--no-audit','--no-fund'],cwd);
    exec(process.execPath,['tools/build.mjs'],cwd);exec(process.execPath,['tools/validate-package.mjs'],cwd);
    if(exec('git',['status','--porcelain'],cwd).trim())throw Error('Build modified checkout');
    const names=(await readdir(join(cwd,'build'))).sort(),out=await Promise.all(names.map(async name=>[name,sha256(await readFile(join(cwd,'build',name)))]));
    fileBytes.push(await Promise.all(names.map(async name=>[name,await readFile(join(cwd,'build',name))])));
    outputs.push(out);runs.push({run:i,cleanBefore:true,install:'npm ci --ignore-scripts --offline',cleanAfter:true,files:Object.fromEntries(out)});
  }
  if(JSON.stringify(outputs[0])!==JSON.stringify(outputs[1]))throw Error('Clean build hashes differ');
  for(let i=0;i<fileBytes[0].length;i++){const [name,bytes]=fileBytes[0][i],[otherName,otherBytes]=fileBytes[1][i];if(name!==otherName||!bytes.equals(otherBytes))throw Error('Clean build bytes differ: '+name);}
  if(JSON.stringify(await sourceDigest(source))!==JSON.stringify(before))throw Error('Original source changed during test');
  console.log(JSON.stringify({pass:true,method:'Two detached clean checkouts of a temporary local source snapshot; original repository history unchanged',sourceSha256:sha256(JSON.stringify(before)),runs,byteIdentical:true,variableBuildFields:[]},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
