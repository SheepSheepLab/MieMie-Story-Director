import {createExtensionPackageManager,parseExtensionRepository} from '../fixtures/hub-api2/src/extension-packages.js';
import {jsonBytes,EXPECTED} from '../../tools/package-v1.mjs';
import {sha256} from '../../tools/compose-source.mjs';
// Controlled GitHub HTTP boundary only. The official package manager is unmodified;
// no network, credential, running extension evaluation or server persistence claim.
export function releaseFixture(bundle,{alterRelease,alterBytes,trees:initial=[]}={}){
  const repo=parseExtensionRepository(EXPECTED.repository),metadataName='MieMie-Extension-update.json';
  const bytes=new Map([[101,bundle.files.get(bundle.metadata.asset.name)],[102,bundle.files.get(metadataName)]]);
  const asset=(id,name)=>({id,name,state:'uploaded',size:bytes.get(id).length,digest:'sha256:'+sha256(bytes.get(id)),url:repo.api+'/releases/assets/'+id,browser_download_url:repo.url+'/releases/download/'+bundle.metadata.tag+'/'+name});
  const release={id:100,tag_name:bundle.metadata.tag,draft:false,prerelease:true,assets:[asset(101,bundle.metadata.asset.name),asset(102,metadataName)]};alterRelease?.(release);
  let trees=structuredClone(initial),writes=0;const requests=[];
  const fetch=async(url,init)=>{
    requests.push({url,init});let body;
    if(url===repo.api)body=jsonBytes({private:false,full_name:'SheepSheepLab/MieMie-Story-Director'});
    else if(url===repo.api+'/releases?per_page=100&page=1')body=jsonBytes([release]);
    else if(url===repo.api+'/releases/100')body=jsonBytes(release);
    else{const id=Number(String(url).split('/').at(-1));if(!bytes.has(id))throw Error('Unexpected test request');body=alterBytes?.(id,bytes.get(id))??bytes.get(id);}
    const response=new Response(body,{status:200,headers:{'Content-Length':String(body.length)}});Object.defineProperty(response,'url',{value:url});return response;
  };
  const manager=createExtensionPackageManager({fetch,getScriptTrees:()=>structuredClone(trees),updateScriptTreesWith(fn){writes++;trees=fn(structuredClone(trees));return structuredClone(trees);},randomUUID:()=> '11111111-1111-4111-8111-111111111111'});
  return {manager,release,requests,get trees(){return trees;},get writes(){return writes;}};
}
