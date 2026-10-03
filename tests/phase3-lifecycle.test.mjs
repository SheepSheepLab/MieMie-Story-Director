import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,hubFixture,flush,manifest} from './helpers/dual-mode.mjs';
import {createDirectorExtension} from '../src/director.js';
import {installDirectorFetchHook} from '../src/host/resources.js';

const countEvents=f=>[...f.eventListeners.values()].reduce((n,set)=>n+set.size,0);
const panel=f=>f.doc.querySelector('[data-director-window]');
const orb=f=>f.doc.querySelector('[data-miemie-director-native]');
function unique(f) {
  assert.equal(f.count.active,1);assert.equal(f.count.peak,1);
  assert.equal(f.doc.querySelectorAll('#meeme-story-director').length,1);
  assert.equal(f.doc.querySelectorAll('[data-director-window]').length,1);
  assert.ok([...f.eventListeners].every(([name,set])=>set.size===(name==='CHAT_CHANGED'?2:1)));assert.equal(countEvents(f),12);
  assert.ok(f.host.__meemeStoryPlanner);assert.ok(f.host.__MieMieStoryDirectorRuntime);
}

test('Standalone once: one active Runtime, one panel, one formal icon entry',async t=>{
  const f=fixture(t),source=f.make();await source.ready;unique(f);assert.equal(source.mode,'standalone');
  assert.equal(f.doc.querySelector('[data-director-launch]'),null);assert.equal(orb(f).querySelector('img').src,'data:image/png;base64,AA==');
  assert.equal(panel(f).hidden,true);assert.deepEqual(f.errors,[]);
});
test('Repeated activate and open never mount or subscribe again',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const fetch=f.host.fetch,p=panel(f),events=countEvents(f),storage=f.storage.length;
  for(let i=0;i<10;i++){f.last.instance.activate();await f.last.instance.open();}
  unique(f);assert.equal(panel(f),p);assert.equal(f.host.fetch,fetch);assert.equal(countEvents(f),events);assert.equal(f.storage.length,storage);
});
test('Close button hides presentation, keeps enabled business and prompt state',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();await f.last.instance.open();const snapshot=JSON.stringify(f.stored),fetch=f.host.fetch;
  f.doc.querySelector('[data-director-close]').click();await flush();assert.equal(panel(f).hidden,true);assert.equal(panel(f).inert,true);
  assert.equal(f.count.active,1);assert.equal(JSON.stringify(f.stored),snapshot);assert.equal(f.host.fetch,fetch);
  await f.dispatch();assert.equal(f.nativeCalls.length,2);
});
test('Escape closes standalone unless a business dialog owns Escape',async t=>{
  const f=fixture(t),s=f.make();await s.ready;await f.last.instance.open();f.el('open-debug').click();
  f.doc.dispatchEvent(new f.host.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  assert.equal(panel(f).hidden,false);assert.equal(f.el('dialog').open,false);
  f.doc.dispatchEvent(new f.host.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await flush();assert.equal(panel(f).hidden,true);
});
test('Deactivate repeatedly removes listeners, global markers, roots and hook',async t=>{
  const f=fixture(t),s=f.make();await s.ready;await s.dispose();await s.dispose();assert.equal(countEvents(f),0);
  assert.equal(f.host.fetch,f.nativeFetch);assert.equal(panel(f),null);assert.equal(orb(f),null);assert.equal(f.host.__meemeStoryPlanner,undefined);assert.equal(f.host.__MieMieStoryDirectorRuntime,undefined);
});
test('Factory activate → deactivate → activate uses a new valid host lifecycle session',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const old=f.last;await s.dispose();assert.equal(countEvents(f),0);
  const next=f.make();await next.ready;unique(f);assert.notEqual(f.last.api,old.api);assert.notEqual(f.last.instance,old.instance);
  assert.equal(old.instance.open(),false);assert.equal(old.instance.activate(),false);await f.last.instance.open();assert.equal(panel(f).hidden,false);
});
test('New lifecycle restores saved settings/libraries and remembered key unchanged',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();f.el('remember').checked=true;f.el('save').click();
  const cfg=JSON.stringify(f.stored),key=f.host.localStorage.getItem('meeme_story_director_api_key_v1');await s.dispose();const next=f.make();await next.ready;
  assert.equal(JSON.stringify(f.stored),cfg);assert.equal(f.el('key').value,'page-secret');assert.equal(f.host.localStorage.getItem('meeme_story_director_api_key_v1'),key);unique(f);
});
test('Hub only uses factory/attachPanel and no standalone entry',async t=>{
  const f=fixture(t),h=hubFixture(f);h.start();const s=f.make();await s.ready;unique(f);assert.equal(s.mode,'hub');assert.equal(orb(f),null);assert.equal(h.panels.size,1);
  await h.openHoneycomb();assert.equal(panel(f).hidden,false);assert.equal(h.motion.honeycomb,1);assert.equal(h.motion.native,0);await f.last.api.closePanel();assert.equal(panel(f).hidden,true);await h.stop();await s.settled();
});
test('Standalone → Hub completes teardown before mounting Hub',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const old=panel(f),h=hubFixture(f);h.start();await s.settled();unique(f);
  assert.equal(old.isConnected,false);assert.equal(s.mode,'hub');assert.equal(orb(f),null);assert.deepEqual(f.history,['activate','deactivate','activate']);await h.stop();await s.settled();
});
test('Hub → Standalone waits for full Hub disposal and restores page-only credentials',async t=>{
  const f=fixture(t),h=hubFixture(f);h.start();const s=f.make();await s.ready;f.enable();f.el('tab-writer').click();f.el('model').value='unsaved-model';
  await h.stop();await s.settled();unique(f);assert.equal(s.mode,'standalone');assert.ok(orb(f));assert.equal(f.el('key').value,'page-secret');assert.equal(f.el('model').value,'unsaved-model');
  assert.equal(f.el('tab-writer').getAttribute('aria-selected'),'true');assert.equal(f.el('toggle').dataset.on,'true');assert.equal(f.host.localStorage.getItem('meeme_story_director_api_key_v1'),null);
});
test('Repeated Hub loss/restoration/reload never overlaps runtime or prompt state',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();const before=JSON.stringify(f.stored),events=countEvents(f);
  for(let i=0;i<4;i++){const h=hubFixture(f);h.start();await s.settled();unique(f);assert.equal(countEvents(f),events);await h.stop();await s.settled();unique(f);}
  assert.equal(JSON.stringify(f.stored),before);assert.equal(f.el('toggle').dataset.on,'true');assert.deepEqual(f.errors,[]);
});
test('Hub reload with immediate new Hub announcement stays serial',async t=>{
  const f=fixture(t),h1=hubFixture(f);h1.start();const s=f.make();await s.ready;
  const stopping=h1.stop(),h2=hubFixture(f);h2.start();await stopping;await s.settled();unique(f);assert.equal(s.mode,'hub');assert.equal(h2.panels.size,1);await h2.stop();await s.settled();
});
test('Disabled Hub preference registers source without activating or fallback',async t=>{
  const f=fixture(t),h=hubFixture(f,{disabled:true});h.start();const s=f.make();await s.ready;
  assert.equal(s.mode,'hub');assert.equal(f.count.active,0);assert.equal(panel(f),null);assert.equal(orb(f),null);await h.runtime.enable(manifest.id);unique(f);await h.stop();await s.settled();
});
test('Hub disable/enable preserves data and never restores standalone while Hub exists',async t=>{
  const f=fixture(t),h=hubFixture(f);h.start();const s=f.make();await s.ready;f.enable();const saved=JSON.stringify(f.stored);
  await h.runtime.disable(manifest.id);assert.equal(f.count.active,0);assert.equal(orb(f),null);assert.equal(panel(f),null);assert.equal(f.host.fetch,f.nativeFetch);
  h.start();await s.settled();assert.equal(f.count.active,0);await h.runtime.enable(manifest.id);unique(f);assert.equal(JSON.stringify(f.stored),saved);assert.equal(f.el('toggle').dataset.on,'true');await h.stop();await s.settled();
});
test('Shortcut preference controls presentation only, with no business activation',async t=>{
  const f=fixture(t),h=hubFixture(f);h.start();const s=f.make();await s.ready;const marker=f.host.__meemeStoryPlanner,p=panel(f),fetch=f.host.fetch;
  assert.equal(orb(f),null);h.preference(true);assert.ok(orb(f));orb(f).click();await flush();await flush();assert.equal(p.hidden,false);assert.equal(h.motion.native,1);
  assert.equal(h.motion.honeycomb,0);h.preference(false);assert.equal(orb(f),null);assert.equal(f.host.__meemeStoryPlanner,marker);assert.equal(f.host.fetch,fetch);unique(f);await h.stop();await s.settled();
});
test('Hub disable revokes mounted Shortcut immediately',async t=>{
  const f=fixture(t),h=hubFixture(f);h.start();const s=f.make();await s.ready;h.preference(true);const oldOrb=orb(f);
  const disabling=h.runtime.disable(manifest.id);assert.equal(oldOrb.isConnected,false);await disabling;oldOrb.click();await flush();assert.equal(f.count.active,0);assert.equal(orb(f),null);await h.stop();await s.settled();
});
test('Multiple READY events and repeated open do not duplicate handling',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();for(let i=0;i<6;i++)await f.last.instance.open();await f.dispatch();assert.equal(f.nativeCalls.length,2);unique(f);
});
test('Deactivate rejects pending planning even when provider ignores abort; late result cannot dispatch',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();let finish;f.setReply(()=>new Promise(r=>finish=r));const pending=f.dispatch();const rejected=assert.rejects(pending);await s.dispose();await rejected;
  finish({ok:true,status:200,text:async()=>JSON.stringify({choices:[{message:{content:'<story_scene>late</story_scene>'}}]})});await flush();assert.equal(f.nativeCalls.length,1);assert.equal(panel(f),null);assert.equal(f.count.active,0);
});
test('Deactivate model probe drops late DOM writes and does not save preferences',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.el('base').value='https://expert.example/v1';let finish;f.setReply(()=>new Promise(r=>finish=r));const button=f.el('models'),pending=button.onclick(),before=f.storage.length;
  await s.dispose();await pending;finish({ok:true,text:async()=>JSON.stringify({data:[{id:'late'}]})});await flush();assert.equal(button.textContent,'请求中…');assert.equal(f.storage.length,before);assert.equal(panel(f),null);
});
test('Stale async library import cannot write or repopulate a deactivated panel',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const input=f.el('planning-file');let finish;
  Object.defineProperty(input,'files',{value:[{size:50,text:()=>new Promise(r=>finish=r)}]});const pending=input.onchange(),before=f.storage.length;await s.dispose();finish(JSON.stringify({type:'meeme-director-requirements',version:1,entries:[{name:'late',content:'x',enabled:true}]}));await pending;
  assert.equal(f.storage.length,before);assert.equal(panel(f),null);assert.equal(f.host.__meemeStoryPlanner,undefined);
});
test('Retained old UI callback is inert after deactivate',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const old=f.el('requirement-add').onclick,before=f.storage.length;await s.dispose();old();assert.equal(f.storage.length,before);assert.equal(panel(f),null);
});
test('Legacy runtime conflict is reported and neither existing marker nor hook is overwritten',async t=>{
  const f=fixture(t),legacy={dispatch(){},open(){}};f.host.__meemeStoryPlanner=legacy;const fetch=f.host.fetch,s=f.make();await s.ready;
  assert.equal(f.host.__meemeStoryPlanner,legacy);assert.equal(f.host.fetch,fetch);assert.equal(f.count.active,0);assert.equal(panel(f),null);assert.match(f.errors.join(' '),/旧版或重复/);
});
test('Existing formal marker blocks a second factory independently of source adapter',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const duplicate=createDirectorExtension(f.last.api,{host:f.host,helpers:f.helpers});assert.throws(()=>duplicate.activate(),/旧版或重复/);unique(f);await duplicate.deactivate();unique(f);
});
test('Duplicated source does not disturb existing runtime, panel or third party entry',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const marker=f.host.__meemeStoryPlanner,third=f.doc.createElement('button');f.doc.body.append(third);
  const duplicate=f.make();await duplicate.ready;unique(f);assert.equal(f.host.__meemeStoryPlanner,marker);assert.ok(third.isConnected);await duplicate.dispose();unique(f);await s.dispose();
});
test('Source replacement waits for asynchronous teardown',async t=>{
  let finish,delay=false;const f=fixture(t,{deactivateDelay:()=>delay?new Promise(r=>finish=r):null}),old=f.make();await old.ready;delay=true;
  const stopping=old.dispose(),next=f.make();await flush();assert.equal(f.count.activated,1);finish();delay=false;await stopping;await next.ready;unique(f);assert.equal(next.mode,'standalone');
});
test('Hub loss waits for old Runtime final cleanup even without whenDisposed',async t=>{
  let finish,delay=false;const f=fixture(t,{deactivateDelay:()=>delay?new Promise(r=>finish=r):null}),h=hubFixture(f,{legacy:true});h.start();const s=f.make();await s.ready;delay=true;
  const stopping=h.stop();await flush();assert.equal(f.count.activated,1);finish();delay=false;await stopping;await s.settled();unique(f);assert.equal(s.mode,'standalone');
});
for(const event of ['pagehide','unload'])test(event+' removes source listeners; later Hub events cannot reactivate',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.frame.dispatchEvent(new f.host.Event(event));await s.settled();assert.equal(f.count.active,0);const h=hubFixture(f);h.start();await flush();assert.equal(f.count.active,0);assert.equal(panel(f),null);await h.stop();
});
test('Abort-invalid API does not activate, even if called repeatedly',async t=>{
  const f=fixture(t),controller=new AbortController();controller.abort();const instance=createDirectorExtension({signal:controller.signal},{host:f.host,helpers:f.helpers});assert.equal(instance.activate(),false);assert.equal(instance.activate(),false);await instance.deactivate();assert.equal(f.host.fetch,f.nativeFetch);
});
test('Owned export object URL is revoked during extension teardown',async t=>{
  const f=fixture(t),s=f.make();await s.ready;let created=0,revoked=0;f.host.URL.createObjectURL=()=>{created++;return 'blob:fixture';};f.host.URL.revokeObjectURL=()=>revoked++;f.host.HTMLAnchorElement.prototype.click=function(){};
  f.el('requirement-export').click();assert.equal(created,1);await s.dispose();assert.equal(revoked,1);
});
for(const order of ['director-first','third-first'])test('Later third party wrapper survives '+order+' cleanup',async t=>{
  const f=fixture(t),s=f.make();await s.ready;const director=f.host.fetch;let hits=0;const third=function(...args){hits++;return director(...args);};f.host.fetch=third;
  if(order==='third-first')f.host.fetch=director;await s.dispose();if(order==='director-first'){assert.equal(f.host.fetch,third);f.host.fetch=director;}
  await f.host.fetch('/untouched',{body:'{}'});assert.equal(f.nativeCalls.length,1);assert.equal(hits,0); // restored retained Director wrapper forwards natively
});
test('Retained later wrapper forwards after Director cleanup without re-entering business',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();const previous=f.host.fetch;let hits=0;const third=(...args)=>{hits++;return previous(...args);};f.host.fetch=third;await s.dispose();await f.host.fetch('/api/backends/chat-completions/generate',{body:'{}'});
  assert.equal(f.host.fetch,third);assert.equal(hits,1);assert.equal(f.nativeCalls.length,1);assert.equal(panel(f),null);
});
test('Wrapper installed before Director remains in the chain',async t=>{
  const f=fixture(t);let hits=0;const third=(...args)=>{hits++;return f.nativeFetch(...args);};f.host.fetch=third;const s=f.make();await s.ready;await f.host.fetch('/untouched',{body:'{}'});assert.equal(hits,1);await s.dispose();assert.equal(f.host.fetch,third);
});
test('Fetch hook arbitrary chain disposal order always forwards once',async()=>{
  for(const order of [[0,1,2],[2,1,0],[1,0,2]]){const seen=[],host={fetch:()=>{seen.push('native');return 7;}};const remove=[];
    for(let i=0;i<3;i++){const prev=host.fetch;remove.push(installDirectorFetchHook(host,function(...args){seen.push(i);return prev(...args);}));}
    for(const i of order)remove[i]();assert.equal(await host.fetch('x'),7);assert.deepEqual(seen,['native']);}
});
test('Handoff preserves model dropdown options and selection without re-fetching',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();f.setReply(async()=>({ok:true,status:200,text:async()=>JSON.stringify({data:[{id:'a'},{id:'b'}]})}));await f.el('models').onclick();
  f.el('model-list').value='b';f.el('model-list').onchange();const before=f.nativeCalls.length,h=hubFixture(f);h.start();await s.settled();
  assert.deepEqual([...f.el('model-list').options].map(o=>o.value),['','a','b']);assert.equal(f.el('model-list').value,'b');assert.equal(f.el('model').value,'b');assert.equal(f.nativeCalls.length,before);await h.stop();await s.settled();
});
test('Handoff preserves historical secret redaction in restored diagnostics',async t=>{
  const f=fixture(t),s=f.make();await s.ready;f.enable();f.setReply(async()=>({ok:false,status:401,text:async()=> 'server echoed page-secret'}));await assert.rejects(f.dispatch());
  f.el('key').value='second-secret';f.el('save').click();const h=hubFixture(f);h.start();await s.settled();
  f.el('debug-page').value='overview';f.el('debug-page').onchange();assert.ok(f.el('debug').textContent.includes('[密钥已隐藏]'));assert.ok(!f.el('debug').textContent.includes('page-secret'));await h.stop();await s.settled();
});
