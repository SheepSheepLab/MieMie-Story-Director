import test from 'node:test';
import assert from 'node:assert/strict';
import {createBundle,EXPECTED} from '../tools/package-v1.mjs';
import {protectedDefault} from '../src/default-prompts.js';
import {readFrozen} from '../tools/compose-source.mjs';
import {fixture,hubFixture,flush} from './helpers/dual-mode.mjs';
import {releaseFixture} from './helpers/package-release.mjs';
const bundle=await createBundle(),key='synthetic-migration-preference',store={type:'extension',extension_id:'meeme_story_planner_v1'},KEY='meeme_story_director_api_key_v1';
const withoutDefaults=value=>({...value,requirements:value.requirements.filter(e=>!protectedDefault('requirements',e.id)),writers:value.writers.filter(e=>!protectedDefault('writers',e.id))});
const saved={base:'https://expert.example/v1',model:'retained-model',maxTokens:4096,timeout:180,
  plannings:[{id:'p-old',name:'旧导演规划',content:'旧规划内容',enabled:true},{id:'p-disabled',name:'已关闭规划',content:'保留关闭',enabled:false}],
  requirements:[{id:'r-old',name:'旧最高指令',content:'旧指令内容',enabled:true}],writers:[{id:'w-old',name:'旧主 API 提示词',content:'旧执笔内容',enabled:true}]};
function boot(f,t,content=bundle.script.content){const reads=[],writes=[],originalRead=f.helpers.getVariables,originalWrite=f.helpers.replaceVariables;f.helpers.getVariables=options=>{reads.push(options);return originalRead(options);};f.helpers.replaceVariables=(value,options)=>{writes.push(options);return originalWrite(value,options);};Object.assign(f.host,f.helpers);f.host.eval(content);const source=f.host.__MieMieDirectorSource;if(source)t.after(()=>source.dispose());return {source,reads,writes};}
test('Original 0.1.22 and final package read identical existing libraries and API configuration',async t=>{
  const old=fixture(t,{saved}),f=fixture(t,{saved}),{script}=await readFrozen();const baseline=boot(old,t,script.content);t.after(()=>old.host.dispatchEvent(new old.host.Event('pagehide')));const final=boot(f,t);await final.source.ready;
  for(const name of ['base','model','tokens','timeout'])assert.equal(f.el(name).value,old.el(name).value);
  for(const name of ['plannings','requirements','writers']){const entries=host=>[...host.el(name).querySelectorAll('.sp-requirement')].filter(row=>!protectedDefault(name,row.dataset.entryId)).map(row=>({name:row.querySelector('.sp-requirement-name').textContent,enabled:row.querySelector('input[type=checkbox]').checked}));assert.deepEqual(entries(f),entries(old));}
  assert.deepEqual(f.stored,saved);assert.ok(final.reads.length>0);assert.ok(final.reads.every(value=>JSON.stringify(value)===JSON.stringify(store)));assert.deepEqual(final.reads.map(x=>JSON.stringify(x)),baseline.reads.map(x=>JSON.stringify(x)));
});
test('Final package saves edits back to historical extension storage without losing other libraries',async t=>{
  const f=fixture(t,{saved}),{source,writes}=boot(f,t);await source.ready;const row=f.el('plannings').querySelector('.sp-requirement');row.querySelector('.sp-row-icon')?.click();
  // Use the preserved library editor control; modify only its content.
  if(!f.el('planning-editor').open){const buttons=[...row.querySelectorAll('button')];buttons.find(b=>/编辑/.test(b.getAttribute('aria-label')||''))?.click();}
  f.el('planning-content').value='修改后的规划';f.el('planning-content').dispatchEvent(new f.host.Event('input',{bubbles:true}));
  assert.equal(f.stored.plannings[0].content,'修改后的规划');assert.deepEqual(withoutDefaults(f.stored).requirements,saved.requirements);assert.deepEqual(withoutDefaults(f.stored).writers,saved.writers);assert.equal(f.stored.base,saved.base);assert.ok(writes.length);assert.ok(writes.every(options=>JSON.stringify(options)===JSON.stringify(store)));
});
test('Remembered API Key preference uses historical storage and matching endpoint',async t=>{
  const f=fixture(t,{saved});f.host.localStorage.setItem(KEY,JSON.stringify({base:saved.base,key}));const {source}=boot(f,t);await source.ready;assert.equal(f.el('key').value,key);assert.equal(f.el('remember').checked,true);f.el('save').click();assert.deepEqual(withoutDefaults(f.stored),saved);assert.equal(JSON.parse(f.host.localStorage.getItem(KEY)).key,key);assert.ok(!JSON.stringify(f.stored).includes(key));assert.ok(!bundle.script.content.includes(key));
});
test('Unremembered Key stays page-only; explicit clear preserves settings and libraries',async t=>{
  const f=fixture(t,{saved}),{source}=boot(f,t);await source.ready;f.el('key').value=key;f.el('remember').checked=false;f.el('save').click();assert.equal(f.host.localStorage.getItem(KEY),null);assert.ok(!JSON.stringify(f.stored).includes(key));f.el('clear-key').click();assert.equal(f.el('key').value,'');assert.deepEqual(withoutDefaults(f.stored),saved);
});
test('Historical remembered Key for another endpoint is not reused',async t=>{const f=fixture(t,{saved});f.host.localStorage.setItem(KEY,JSON.stringify({base:'https://other.example/v1',key}));const {source}=boot(f,t);await source.ready;assert.equal(f.el('key').value,'');assert.equal(f.el('remember').checked,false);});
test('Hub installed artifact boots actual entry, retains old storage and hands off generation',async t=>{
  const release=releaseFixture(bundle);t.after(()=>release.manager.dispose());const candidate=await release.manager.inspect(EXPECTED.repository);await release.manager.install(candidate);const f=fixture(t,{saved}),h=hubFixture(f);h.start();const {source}=boot(f,t,release.trees[0].content);await source.ready;assert.equal(source.mode,'hub');await h.openHoneycomb();assert.deepEqual(f.stored,saved);f.el('toggle').click();await f.dispatch();assert.equal(f.nativeCalls.length,2);assert.equal(JSON.parse(f.nativeCalls[1].init.body).messages.at(-1).content,'老师邀请玩家入内，停在回应前。');await source.dispose();await h.stop();
});
test('Final single-script artifact keeps normal main/sub API routing and Debug report data',async t=>{const f=fixture(t),{source}=boot(f,t);await source.ready;f.enable();await f.dispatch();assert.equal(f.nativeCalls.length,2);f.el('tab-debug').click();f.el('debug-page').value='writer';f.el('debug-page').dispatchEvent(new f.host.Event('change'));const debug=JSON.parse(f.el('debug').textContent);assert.equal(debug.messages.at(-1).content,'老师邀请玩家入内，停在回应前。');f.el('tab-api').click();f.el('tab-debug').click();assert.deepEqual(JSON.parse(f.el('debug').textContent),debug);});
test('Formal package and original loaded together still use original duplicate guard',async t=>{const f=fixture(t),{source}=boot(f,t);await source.ready;const marker=f.host.__meemeStoryPlanner,fetch=f.host.fetch,{script}=await readFrozen();Object.assign(f.host,f.helpers);f.host.eval(script.content);await flush();assert.equal(f.host.__meemeStoryPlanner,marker);assert.equal(f.host.fetch,fetch);assert.equal(f.doc.querySelectorAll('[data-director-window]').length,1);});
