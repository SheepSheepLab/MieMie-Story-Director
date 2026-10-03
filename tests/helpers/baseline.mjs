import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';
import {createRequire} from 'node:module';
import {projectRoot, composeSource, readFrozen, sha256} from '../../tools/compose-source.mjs';

const require = createRequire(import.meta.url);
const read = file => fs.readFileSync(new URL(file, projectRoot), 'utf8');
export const clone = value => JSON.parse(JSON.stringify(value));

export async function implementations() {
  const {script, lock} = await readFrozen();
  const frozenCore = read('tests/fixtures/0.1.22/core.js');
  const suite = read('tests/fixtures/0.1.22/legacy-suite.cjs');
  assert.equal(sha256(frozenCore), lock.coreFixtureSha256);
  assert.equal(sha256(suite), lock.retainedSuiteSha256);
  return {
    frozen: {source: script.content, core: frozenCore, suite},
    candidate: {source: await composeSource(), core: read('src/core.js'), suite},
  };
}

// The historical assertion suite is retained unchanged on disk. Its two file reads
// are redirected to the selected implementation; it never reads the old workspace.
function scopedRequire(implementation) {
  return name => {
    if (name === 'fs') return {
      readFileSync(file) {
        if (file === '/frozen-suite/core.js') return implementation.core;
        if (file === '/frozen-suite/../../outputs/咩咩故事导演-0.1.22-独立测试版/咩咩故事导演-0.1.22.js') return implementation.source;
        throw Error('Unexpected historical fixture read: ' + file);
      },
    };
    if (['vm', 'assert'].includes(name)) return require(name);
    throw Error('Unexpected test dependency: ' + name);
  };
}

export function createHarness(implementation, saved = {}) {
  const prefix = implementation.suite.slice(0, implementation.suite.indexOf('(async()=>{'));
  // Deterministic generated entry IDs only in the synthetic host; runtime is unchanged.
  const needle = ' host.fetch=(input,init)=>native(input,init);';
  assert.equal(prefix.split(needle).length, 2);
  let deterministic = prefix.replace(needle, ' let fixtureId=0;host.crypto={randomUUID:()=>"00000000-0000-4000-8000-"+String(++fixtureId).padStart(12,"0")};' + needle);
  if(implementation.document)deterministic=deterministic.replace('doc={createElement:()=>new E,documentElement:new E,body:new E}', 'doc=createDocument()').replace('const shell=doc.documentElement.children[0]', 'const shell=doc.querySelector("#meeme-story-director")');
  if(implementation.mount) {
    const start=deterministic.indexOf(' vm.runInNewContext(standalone?');
    const end=deterministic.indexOf(',sandbox);',start)+10;
    assert.ok(start>=0&&end>start);
    deterministic=deterministic.slice(0,start)+' boot({host,helpers:sandbox});cleanup=()=>host.__phase3Fixture.instance.deactivate();'+deterministic.slice(end);
  }
  const fixture = new Function('require', '__dirname', 'process', 'boot', 'createDocument', deterministic + '\nreturn {harness,preset};')(
    scopedRequire(implementation), '/frozen-suite', {argv: ['--standalone']}, implementation.mount, implementation.document,
  );
  const h = fixture.harness(saved);
  h.getPresetFixture = () => fixture.preset;
  return h;
}

export function coreFor(implementation) {
  return vm.runInNewContext(implementation.core + '\nStoryPlannerCore');
}

export async function runRetainedSuite(implementation, subtest) {
  const needle = "const test=async(n,f)=>{await f();count++;console.log('PASS '+n)};";
  assert.equal(implementation.suite.split(needle).length, 2);
  const suite = implementation.suite.replace(needle,
    'const test=async(n,f)=>{await subtest(n,f);count++;};').replace('(async()=>{', 'return (async()=>{');
  const processState = {argv: ['--standalone'], exitCode: 0};
  await new Function('require', '__dirname', 'process', 'console', 'subtest', suite)(
    scopedRequire(implementation), '/frozen-suite', processState,
    {log() {}, error(error) {throw error;}}, subtest,
  );
  assert.equal(processState.exitCode, 0);
}

export function observe(h) {
  const calls = h.nativeCalls.map(({input, init}) => ({
    input: String(input),
    init: {
      ...init,
      ...(init?.body ? {body: JSON.parse(init.body)} : {}),
      ...(init?.signal ? {signal: {aborted: init.signal.aborted}} : {}),
    },
  }));
  const debug = {};
  for (const page of ['overview', 'rules', 'expert', 'task', 'writer']) {
    h.el('debug-page').value = page;
    h.el('debug-page').onchange?.();
    const text = h.el('debug').textContent;
    try {debug[page] = JSON.parse(text);} catch {debug[page] = text;}
  }
  return clone({calls, storage: h.storage, debug, chat: h.context.chat,
    status: h.el('status').textContent, apiStatus: h.el('api-status').textContent,
    cancelHidden: h.el('cancel').hidden});
}

export async function capture(fn) {
  try {return {ok: true, value: clone(await fn())};}
  catch (error) {return {ok: false, error: error.message};}
}
