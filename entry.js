// Phase 3 local source entry. No distribution or remote registration is produced.
import {createOfficialDirectorExtension} from './src/ui/official-director.js';
import {withDefaultPrompts} from './src/default-prompts.js';
import {createDirectorDualMode} from './src/adapters/dual-mode.js';
export {DIRECTOR_PRODUCT,DIRECTOR_IDENTITIES} from './product-identity.js';
export {createProductDirectorExtension as createDirectorExtension,createDirectorDualMode};

// Product defaults are supplied only at the configuration boundary. Historical
// library migrations and all planning/generation behavior remain in frozen Core.
function createProductDirectorExtension(api,options) {
  return createOfficialDirectorExtension(api,{...options,protectDefaultPrompts:true,helpers:withDefaultPrompts(options.helpers)});
}

// The local source runner/bundler supplies the manifest and assets explicitly.
// No network-loaded code, eval or filesystem operation occurs in the runtime.
export function startDirector({host,frame,helpers,manifest,icon,launcherStyles='',officialStyles='',onError}) {
  return createDirectorDualMode({host,frame,manifest,icon,launcherStyles,onError,
    factory:api=>createProductDirectorExtension(api,{host,helpers,assets:{icon,styles:officialStyles}})});
}
