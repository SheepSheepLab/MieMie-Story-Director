import test from 'node:test';
import assert from 'node:assert/strict';
import {implementations} from './helpers/baseline.mjs';
import {runCoreScenario, runRuntimeScenario} from './helpers/scenarios.mjs';

const versions = await implementations();

test('regression sensitivity / appended outline instead of in-place replacement is detected', async () => {
  const needle = 'messages[playerIndex].content=scene;';
  assert.equal(versions.candidate.core.split(needle).length, 2);
  const mutant = {...versions.candidate, core: versions.candidate.core.replace(needle, "messages.push({role:'user',content:scene});")};
  const scenario = 'writer / same positions, roles, metadata and untouched source';
  assert.notDeepEqual(await runCoreScenario(mutant, scenario), await runCoreScenario(versions.frozen, scenario));
});

test('regression sensitivity / changed main transport stream flag is detected', async () => {
  const needle = 'body:JSON.stringify({...payload,messages:writer})';
  assert.equal(versions.candidate.source.split(needle).length, 2);
  const mutant = {...versions.candidate, source: versions.candidate.source.replace(needle, 'body:JSON.stringify({...payload,messages:writer,stream:false})')};
  assert.notDeepEqual(await runRuntimeScenario(mutant, 'route / normal'), await runRuntimeScenario(versions.frozen, 'route / normal'));
});
