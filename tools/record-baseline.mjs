import {readFile, writeFile, access} from 'node:fs/promises';
import {projectRoot, sha256, readFrozen} from './compose-source.mjs';
import {implementations} from '../tests/helpers/baseline.mjs';
import {coreScenarios, runtimeScenarios, runCoreScenario, runRuntimeScenario} from '../tests/helpers/scenarios.mjs';

// One-time Phase 1 recording from the pinned Owner artifact, never from candidate.
// npm test does not run this tool. Existing outputs cannot be overwritten.
if (process.argv.length !== 3 || process.argv[2] !== '--record-once') throw Error('Use --record-once only for initial baseline establishment.');
const {lock} = await readFrozen();
const target = new URL('tests/fixtures/0.1.22/golden.json', projectRoot);
let exists = false;try {await access(target);exists = true;} catch (error) {if (error.code !== 'ENOENT') throw error;}
if (exists || lock.goldenSha256) throw Error('Baseline already frozen; refusing to replace expected outputs.');
const {frozen} = await implementations();
const golden = {core: {}, runtime: {}};
for (const [name] of coreScenarios) golden.core[name] = await runCoreScenario(frozen, name);
for (const [name] of runtimeScenarios) golden.runtime[name] = await runRuntimeScenario(frozen, name);
const bytes = JSON.stringify(golden, null, 2) + '\n';
await writeFile(target, bytes, {flag: 'wx'});
const lockPath = new URL('tests/fixtures/0.1.22/baseline-lock.json', projectRoot);
const current = JSON.parse(await readFile(lockPath, 'utf8'));
if (current.contentSha256 !== lock.contentSha256 || current.goldenSha256) throw Error('Baseline lock changed during recording.');
await writeFile(lockPath, JSON.stringify({...lock, goldenSha256: sha256(bytes),
  coreScenarios: coreScenarios.length, runtimeScenarios: runtimeScenarios.length}, null, 2) + '\n');
console.log('Recorded frozen-only golden outputs:', coreScenarios.length, 'Core,', runtimeScenarios.length, 'runtime.');
