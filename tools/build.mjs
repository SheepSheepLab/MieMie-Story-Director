import {createBundle,writeBundle} from './package-v1.mjs';
const bundle=await createBundle();await writeBundle(bundle);console.log(JSON.stringify(bundle.report,null,2));
