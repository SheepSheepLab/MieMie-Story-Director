import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {projectRoot} from './compose-source.mjs';
import {composeRuntime} from './compose-runtime.mjs';

// Local validation runner only. Returns code in memory: no package/release writes.
export async function composeDualMode() {
  const modules=['product-identity.js','src/host/resources.js','src/ui/native-floating-presentation.js','src/ui/native-launcher.js',
    'src/host/business-runtime.generated.js','src/director.js','src/ui/official-presentation.js','src/ui/default-prompt-protection.js','src/ui/official-director.js','src/adapters/dual-mode.js','src/default-prompts.js','entry.js'];
  const read=file=>readFile(new URL(file,projectRoot),'utf8');
  const runtime=await composeRuntime();
  if(await read('src/host/business-runtime.generated.js')!==runtime)throw Error('Generated runtime is stale.');
  const parts=await Promise.all(modules.map(read));
  const bodies=parts.map(source=>source.replace(/^import .*;$/gm,'').replace(/^export \{.*\}.*;$/gm,'').replace(/\bexport (const|function)/g,'$1'));
  const manifest=await read('manifest.json'),icon=(await readFile(new URL('assets/icon.png',projectRoot))).toString('base64'),styles=await read('assets/native-launcher.css'),officialStyles=await read('assets/official-ui.css');
  const code=`(() => {\n'use strict';\n${bodies.join('\n')}\nstartDirector({host:window.parent,frame:window,
    helpers:{getVariables,replaceVariables,getPreset,getLoadedPresetName,eventOn},
    manifest:${manifest},icon:${JSON.stringify('data:image/png;base64,'+icon)},launcherStyles:${JSON.stringify(styles)},officialStyles:${JSON.stringify(officialStyles)}});\n})();\n`;
  new vm.Script(code);return code;
}
if(process.argv[1]===new URL(import.meta.url).pathname&&process.argv.includes('--check')) {
  await composeDualMode();console.log('Official entry and approved assets compile (memory only; Phase 3 host behavior unchanged).');
}
