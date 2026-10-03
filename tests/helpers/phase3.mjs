import {createDirectorExtension} from '../../src/director.js';
import {implementations} from './baseline.mjs';

export async function phase3Implementation() {
  const {candidate}=await implementations();
  return {...candidate,mount({host,helpers}) {
    // Historical fake DOM lacks native removal. Add only its missing API.
    const create=host.document.createElement;
    host.document.createElement=(...args)=>{
      const node=create(...args), proto=Object.getPrototypeOf(node);
      proto.removeEventListener??=function(name,fn){if(this.listeners[name]===fn)delete this.listeners[name];};
      return node;
    };
    const controller=new AbortController(),cleanups=[];
    let panel,opens=0,closes=0;
    const api={signal:controller.signal,onCleanup:fn=>cleanups.push(fn),
      attachPanel(node){panel=node;panel.hidden=true;panel.inert=true;return true;},
      showPanel(){++opens;panel.hidden=false;panel.inert=false;return true;},
      closePanel(){++closes;panel.hidden=true;panel.inert=true;return true;},
    };
    const instance=createDirectorExtension(api,{host,helpers,assets:{icon:'approved-icon-fixture'}});
    host.__phase3Fixture={instance,api,controller,cleanups,get panel(){return panel;},get opens(){return opens;},get closes(){return closes;}};
    instance.activate();
  }};
}
