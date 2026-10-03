import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {implementations} from './baseline.mjs';
import {createOfficialDirectorExtension} from '../../src/ui/official-director.js';
import {fixture} from './dual-mode.mjs';
export const officialStyles=readFileSync(new URL('../../assets/official-ui.css',import.meta.url),'utf8');
export const approvedIcon='data:image/png;base64,'+readFileSync(new URL('../../assets/icon.png',import.meta.url)).toString('base64');
export function officialFixture(t,options={}) {
  const f=fixture(t,{...options,createExtension:createOfficialDirectorExtension,styles:officialStyles,icon:approvedIcon});
  const matches=f.host.HTMLElement.prototype.matches;
  f.host.HTMLElement.prototype.matches=function(selector){return selector===':popover-open'?!!this.open:matches.call(this,selector);};
  return f;
}
export async function phase4Implementation() {
  const {candidate}=await implementations();return {...candidate,
    document(){
      const dom=new JSDOM('<!doctype html><body></body>',{url:'https://fixture.invalid/'}),w=dom.window;
      // Legacy test observations use Array.map on children; this is test-only.
      w.HTMLCollection.prototype.map=Array.prototype.map;
      for(const name of ['showModal','close','showPopover','hidePopover'])w.HTMLElement.prototype[name]=function(){this.open=name==='showModal'||name==='showPopover';this.toggleAttribute('open',this.open);};
      w.HTMLElement.prototype.matches=function(selector){return selector===':popover-open'?!!this.open:w.Element.prototype.matches.call(this,selector);};
      return w.document;
    },
    mount({host,helpers}) {
      host.MutationObserver=host.document.defaultView.MutationObserver;
      const api={signal:new AbortController().signal,onCleanup(){},attachPanel(node){node.hidden=true;return true;},showPanel(){return true;},closePanel(){return true;}};
      const instance=createOfficialDirectorExtension(api,{host,helpers,assets:{icon:approvedIcon,styles:officialStyles}});
      host.__phase3Fixture={instance:{deactivate(){const done=instance.deactivate();host.document.defaultView.close();return done;}}};instance.activate();
    }};
}
