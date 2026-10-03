import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {composeDualMode} from '../tools/compose-dual-mode.mjs';
import {projectRoot,readFrozen,sha256} from '../tools/compose-source.mjs';
import {fixture,hubFixture,flush} from './helpers/dual-mode.mjs';
import {createDirectorExtension} from '../src/director.js';

const code=await composeDualMode();
function boot(f,t) {
  Object.assign(f.host,f.helpers);f.host.eval(code);
  const source=f.host.__MieMieDirectorSource;t.after(()=>source.dispose());return source;
}
test('Executable local entry boots the actual factory and approved embedded PNG',async t=>{
  const f=fixture(t),s=boot(f,t);await s.ready;assert.equal(s.mode,'standalone');
  const img=f.doc.querySelector('[data-miemie-director-native] img'),approved=await readFile(new URL('assets/icon.png',projectRoot));
  assert.equal(sha256(Buffer.from(img.src.split(',')[1],'base64')),sha256(approved));
  f.enable();await f.dispatch();assert.equal(f.nativeCalls.length,2);await s.dispose();assert.equal(f.host.fetch,f.nativeFetch);
});
test('Executable local entry registers with official Hub protocol without standalone UI',async t=>{
  const references=JSON.parse(await readFile(new URL('tests/fixtures/phase3-references.json',projectRoot),'utf8'));
  assert.equal(references.hub.commit,'36aaec46282e67bd01b87035165977a40d23acc9');
  for(const[file,hash]of Object.entries(references.hub.files))assert.equal(sha256(await readFile(new URL('tests/fixtures/hub-0.8.1/'+file,projectRoot))),hash);
  const f=fixture(t),h=hubFixture(f);h.start();const s=boot(f,t);await s.ready;assert.equal(s.mode,'hub');assert.equal(f.doc.querySelector('[data-miemie-director-native]'),null);
  await h.openHoneycomb();assert.equal(f.doc.querySelector('[data-director-window]').hidden,false);f.enable();await f.dispatch();assert.equal(f.nativeCalls.length,2);await s.dispose();await h.stop();
});
test('Original 0.1.22 loaded after the formal entry opens the same runtime instead of creating another',async t=>{
  const f=fixture(t),s=boot(f,t);await s.ready;const marker=f.host.__meemeStoryPlanner,fetch=f.host.fetch,{script}=await readFrozen();f.host.eval(script.content);await flush();
  assert.equal(f.host.__meemeStoryPlanner,marker);assert.equal(f.host.fetch,fetch);assert.equal(f.doc.querySelectorAll('[data-director-window]').length,1);await s.dispose();
});
test('Factory rolls back an attachPanel failure without leaving partial resources',async t=>{
  const f=fixture(t),cleanups=[],api={signal:new AbortController().signal,onCleanup:fn=>cleanups.push(fn),attachPanel(){throw Error('fixture attach failure');}};
  const x=createDirectorExtension(api,{host:f.host,helpers:f.helpers});assert.throws(()=>x.activate(),/fixture attach failure/);await x.deactivate();
  assert.equal(f.eventListeners.size,0);assert.equal(f.host.fetch,f.nativeFetch);assert.equal(f.doc.querySelector('#meeme-story-director'),null);assert.equal(f.host.__meemeStoryPlanner,undefined);assert.equal(f.host.__MieMieStoryDirectorRuntime,undefined);
});
test('Factory rolls back a partial subscription failure',async t=>{
  const f=fixture(t),original=f.helpers.eventOn;let calls=0;f.helpers.eventOn=(...args)=>{if(++calls===3)throw Error('fixture event failure');return original(...args);};
  const api={signal:new AbortController().signal,onCleanup(){},attachPanel(){return true;}},x=createDirectorExtension(api,{host:f.host,helpers:f.helpers});
  assert.throws(()=>x.activate(),/fixture event failure/);await x.deactivate();assert.equal(f.eventListeners.size,0);assert.equal(f.doc.querySelector('#meeme-story-director'),null);assert.equal(f.host.fetch,f.nativeFetch);
});
test('Lifetime revocation detaches pending expert completion before it can consume a late body',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();let finish,reads=0;f.setReply(()=>new Promise(r=>finish=r));const pending=f.dispatch(),rejected=assert.rejects(pending);
  await s.dispose();await rejected;finish({ok:true,status:200,text:async()=>{reads++;return '{}';}});await flush();assert.equal(reads,0);assert.equal(f.nativeCalls.length,1);
});
test('Lifetime revocation stops pending expert body reads from changing dead state',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();let finish;f.setReply(async()=>({ok:true,status:200,text:()=>new Promise(r=>finish=r)}));
  const pending=f.dispatch(),rejected=assert.rejects(pending);await flush();await s.dispose();await rejected;finish(JSON.stringify({choices:[{message:{content:'<story_scene>late</story_scene>'}}]}));await flush();assert.equal(f.nativeCalls.length,1);assert.equal(f.doc.querySelector('#meeme-story-director'),null);
});
test('Extension teardown aborts its already-dispatched stream without changing active D-001 semantics',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();await f.dispatch();const signal=f.nativeCalls[1].init.signal;assert.equal(signal.aborted,false);await s.dispose();assert.equal(signal.aborted,true);
});
test('Extension teardown settles its pending main request even when transport ignores abort',async t=>{
  const f=fixture(t),native=f.host.fetch;let mainStarted=false,finish;
  f.host.fetch=(input,init)=>String(input).startsWith('https://expert.example')?native(input,init):(mainStarted=true,new Promise(r=>finish=r));
  const s=f.make();await s.ready;f.enable();const pending=f.dispatch(),rejected=assert.rejects(pending);await flush();assert.equal(mainStarted,true);await s.dispose();await rejected;
  finish({ok:true,status:200,body:'late'});await flush();assert.equal(f.doc.querySelector('#meeme-story-director'),null);
});
test('Original panel markup, all existing styles and editor geometry remain frozen',async t=>{
  const old=fixture(t),f=fixture(t),{script}=await readFrozen();Object.assign(old.host,old.helpers);old.host.eval(script.content);
  const s=f.make();await s.ready;assert.deepEqual([...f.doc.querySelectorAll('#meeme-story-director style')].map(n=>n.textContent),[...old.doc.querySelectorAll('#meeme-story-director style')].map(n=>n.textContent));
  assert.equal(f.doc.querySelector('.sp-panel').innerHTML,old.doc.querySelector('.sp-panel').innerHTML);
  assert.equal(f.doc.querySelector('.director-heading').innerHTML,old.doc.querySelector('.director-heading').innerHTML);
  old.host.dispatchEvent(new old.host.Event('pagehide'));await s.dispose();
});
test('A failing dialog cleanup cannot strand runtime identity, fetch or owned roots',async t=>{
  const f=fixture(t),api={signal:new AbortController().signal,onCleanup(){},attachPanel(){return true;}},instance=createDirectorExtension(api,{host:f.host,helpers:f.helpers});instance.activate();
  f.el('dialog').close=()=>{throw Error('fixture dialog failure');};await assert.rejects(instance.deactivate(),AggregateError);
  assert.equal(f.host.__meemeStoryPlanner,undefined);assert.equal(f.host.__MieMieStoryDirectorRuntime,undefined);assert.equal(f.host.fetch,f.nativeFetch);assert.equal(f.eventListeners.size,0);assert.equal(f.doc.querySelector('#meeme-story-director'),null);
  await assert.rejects(instance.deactivate(),AggregateError);
});
