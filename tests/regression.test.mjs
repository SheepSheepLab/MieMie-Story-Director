import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectRoot, readFrozen, sha256} from '../tools/compose-source.mjs';
import {implementations} from './helpers/baseline.mjs';
import {coreScenarios, runtimeScenarios, runCoreScenario, runRuntimeScenario} from './helpers/scenarios.mjs';

const versions = await implementations();
const bytes = await readFile(new URL('tests/fixtures/0.1.22/golden.json', projectRoot));
const golden = JSON.parse(bytes);
const {lock} = await readFrozen();
assert.equal(sha256(bytes), lock.goldenSha256, 'The frozen expected outputs cannot silently be regenerated.');

for (const [kind, scenarios, run] of [
  ['core', coreScenarios, runCoreScenario], ['runtime', runtimeScenarios, runRuntimeScenario],
]) {
  assert.deepEqual(Object.keys(golden[kind]), scenarios.map(([name]) => name));
  for (const [name] of scenarios) {
    test(kind + ' regression / ' + name, async () => {
      const original = await run(versions.frozen, name);
      const candidate = await run(versions.candidate, name);
      assert.deepEqual(original, golden[kind][name], 'Frozen reference no longer reproduces its recorded output.');
      assert.deepEqual(candidate, original, 'New source differs from Owner-supplied 0.1.22; treat as regression.');
    });
  }
}
