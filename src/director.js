import {createDirectorResources} from './host/resources.js';
import {mountDirectorRuntime} from './host/business-runtime.generated.js';
import {DIRECTOR_IDENTITIES} from '../product-identity.js';

const ownershipMarker='__MieMieStoryDirectorRuntime';
export function createDirectorExtension(api,{host,helpers,assets={},presentation}) {
  let tool=null,resources=null,deactivation=null;
  const instance={
    activate() {
      if(api.signal.aborted)return false;
      if(tool&&!resources.closed)return true;
      if(deactivation)throw Error('故事导演生命周期已结束，请使用新的宿主会话。');
      if(host[ownershipMarker]||host[DIRECTOR_IDENTITIES.runtimeMarker])throw Error('检测到旧版或重复的故事导演；请停用旧脚本并刷新。');
      host[ownershipMarker]=instance;
      resources=createDirectorResources(api,host);
      // Ownership is released last, after UI/events/fetch links have been revoked.
      resources.add(()=>{if(host[ownershipMarker]===instance)delete host[ownershipMarker];});
      try {
        tool=mountDirectorRuntime({host,helpers,resources,api});
        if(api.attachPanel(tool.panel,{icon:assets.icon})===false)throw Error('故事导演面板挂载失败。');
        if(presentation){const view=presentation({panel:tool.panel,host,resources,icon:assets.icon,styles:assets.styles});if(view?.dispose)resources.add(()=>view.dispose());}
        return true;
      } catch(error) {void instance.deactivate()?.catch(()=>{});throw error;}
    },
    open(surfaceLease){return tool&&!resources.closed?tool.open(surfaceLease):false;},
    captureSession(){return tool?.captureSession()||null;},
    restoreSession(state){tool?.restoreSession(state);},
    deactivate(){
      if(deactivation)return deactivation;
      tool=null;
      deactivation=resources?.dispose()||Promise.resolve();
      return deactivation;
    },
  };
  return instance;
}
