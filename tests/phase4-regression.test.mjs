import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtimeScenarios,runRuntimeScenario} from './helpers/scenarios.mjs';
import {phase4Implementation} from './helpers/phase4.mjs';
const implementation=await phase4Implementation();
const golden=JSON.parse(await readFile(new URL('./fixtures/0.1.22/golden.json',import.meta.url),'utf8'));
for(const[name]of runtimeScenarios)test('Phase 4 real DOM + official UI / frozen business output / '+name,async()=>{
  const actual=await runRuntimeScenario(implementation,name);
  // The historical fake DOM leaves untouched textContent undefined; a real DOM
  // represents the same empty API status as ''. No request/data normalization.
  if(actual.observation.apiStatus==='')delete actual.observation.apiStatus;
  assert.deepEqual(actual,golden.runtime[name]);
});
