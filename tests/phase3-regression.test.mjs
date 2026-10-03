import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectRoot} from '../tools/compose-source.mjs';
import {composeRuntime} from '../tools/compose-runtime.mjs';
import {runtimeScenarios,runRuntimeScenario} from './helpers/scenarios.mjs';
import {phase3Implementation} from './helpers/phase3.mjs';

const implementation=await phase3Implementation();
const golden=JSON.parse(await readFile(new URL('tests/fixtures/0.1.22/golden.json',projectRoot),'utf8'));
test('Phase 3 generated runtime is exactly the audited derivation',async()=>{
  assert.equal(await readFile(new URL('src/host/business-runtime.generated.js',projectRoot),'utf8'),await composeRuntime());
});
for(const[name]of runtimeScenarios)test('Phase 3 actual factory / frozen business output / '+name,async()=>{
  assert.deepEqual(await runRuntimeScenario(implementation,name),golden.runtime[name]);
});
