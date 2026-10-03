import {readFile} from 'node:fs/promises';
import {projectRoot} from './compose-source.mjs';
import {validateBundle} from './package-v1.mjs';
const root=new URL('build/',projectRoot),metadata=JSON.parse(await readFile(new URL('MieMie-Extension-update.json',root),'utf8'));
const names=[metadata.asset.name,'MieMie-Extension-update.json','manifest.json','SHA256SUMS'];
const files=new Map(await Promise.all(names.map(async name=>[name,await readFile(new URL(name,root))])));
console.log(JSON.stringify(await validateBundle({files}),null,2));
