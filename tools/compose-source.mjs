import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

export const projectRoot = new URL('../', import.meta.url);
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const read = file => readFile(new URL(file, projectRoot), 'utf8');

// Phase 1/2 source reconstruction only: no package metadata, file writes or release.
// Function replacements preserve literal $ sequences in prompts and CSS.
export async function composeSource() {
  let source = await read('src/host/standalone-runtime.js');
  const pieces = [
    ['/* @miemie:core */', await read('src/core.js')],
    ['/* @miemie:libraries */', await read('src/prompt-libraries.js')],
    ['/* @miemie:panel */', await read('src/ui/panel.html')],
    ['/* @miemie:legacy-icon */', 'data:image/png;base64,' +
      (await readFile(new URL('assets/legacy-icon.png', projectRoot))).toString('base64')],
  ];
  for (const [marker, content] of pieces) {
    if (source.split(marker).length !== 2) throw Error('Missing or repeated source marker: ' + marker);
    source = source.replace(marker, () => content);
  }
  new vm.Script(source, {filename: 'miemie-story-director-phase2.js'});
  return source;
}

export async function readFrozen() {
  const lock = JSON.parse(await read('tests/fixtures/0.1.22/baseline-lock.json'));
  const bytes = await readFile(new URL(lock.artifact, projectRoot));
  if (sha256(bytes) !== lock.artifactSha256) throw Error('Frozen artifact bytes changed.');
  const script = JSON.parse(bytes);
  if (sha256(script.content) !== lock.contentSha256) throw Error('Frozen content changed.');
  if (script.id !== lock.scriptId) throw Error('Frozen script identity changed.');
  return {lock, script};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== '--check') {
    throw Error('Only --check is supported at Phase 2; no distributable is produced.');
  }
  const {script, lock} = await readFrozen();
  const source = await composeSource();
  if (source !== script.content) throw Error('Phase 2 reconstruction differs from the Owner baseline.');
  console.log('PASS byte-identical 0.1.22 reconstruction · ' + lock.contentSha256);
}
