import {createDirectorExtension} from '../director.js';
import {mountDefaultPromptProtection} from './default-prompt-protection.js';
import {mountOfficialDirectorPresentation} from './official-presentation.js';

// Production entry opts into the official UI. The original Phase 3 presentation
// remains a frozen comparison fixture; both use the exact same Business Runtime.
export function createOfficialDirectorExtension(api,options) {
  let view;
  const instance=createDirectorExtension(api,{...options,presentation:args=>{
    view=mountOfficialDirectorPresentation(args);if(options.protectDefaultPrompts)mountDefaultPromptProtection(args);return view;
  }});
  // Presentation-only, transient page selection travels with an existing host
  // handoff. Business's session fields and persistent settings are untouched.
  return {...instance,
    open(surfaceLease){view?.refreshHeader();return instance.open(surfaceLease);},
    captureSession(){const state=instance.captureSession();return state?{...state,presentationPage:view?.capturePage()}:state;},
    restoreSession(state){instance.restoreSession(state);view?.restorePage(state?.presentationPage||state?.tab||'expert',state?.debugPage);},
  };
}
