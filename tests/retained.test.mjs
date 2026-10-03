import test from 'node:test';
import {implementations, runRetainedSuite} from './helpers/baseline.mjs';

const versions = await implementations();
for (const [name, implementation] of Object.entries(versions)) {
  test(name + ' / 70 retained 0.1.22 assertions', async t => {
    await runRetainedSuite(implementation, (label, fn) => t.test(label, fn));
  });
}
