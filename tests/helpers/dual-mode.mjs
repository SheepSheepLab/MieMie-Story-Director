import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {createDirectorExtension} from '../../src/director.js';
import {createDirectorDualMode} from '../../src/adapters/dual-mode.js';

const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
export const manifest=JSON.parse(read('../../manifest.json'));
const styles=read('../../assets/native-launcher.css');
const clone=x=>JSON.parse(JSON.stringify(x));
export const flush=()=>new Promise(r=>setImmediate(r));
const preset={prompts:[{id:'rule',name:'时空锚定',enabled:true,content:'{{addvar::story_think_ini::当轮规划规则}}'},
  {id:'20f5f445-aba9-42aa-a1f4-927e28384f84',enabled:true,content:'<story_driver_format>{{getvar::story_think_ini}}</story_driver_format>'},
  {id:'72ffe882-e589-4382-933e-fd6c30fc77ec',enabled:true,content:'<story_driver>摘要</story_driver><story_scene>正文</story_scene><memory_log>归档</memory_log>'}]};

export function fixture(t,options={}) {
  const dom=new JSDOM('<!doctype html><body></body>',{url:'https://fixture.invalid/',runScripts:'outside-only'}),host=dom.window,doc=host.document;
  const frame=new host.EventTarget(),eventListeners=new Map(),errors=[],storage=[],nativeCalls=[],history=[];
  let stored=options.saved||{},seq=0,reply=async()=>({ok:true,status:200,text:async()=>JSON.stringify({choices:[{finish_reason:'stop',message:{content:'<story_scene>老师邀请玩家入内，停在回应前。</story_scene>'}}]})});
  host.crypto.randomUUID=()=>`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`;
  host.matchMedia=()=>({matches:true});
  for(const name of ['showModal','close','showPopover','hidePopover'])host.HTMLElement.prototype[name]=function(){
    if(name==='showModal'||name==='showPopover'){this.open=true;this.setAttribute('open','');}
    else{this.open=false;this.removeAttribute('open');}
  };
  const context={mainApi:'openai',characterId:0,groupId:null,chatId:'chat1',chat:[{is_user:true,mes:'我推开教室门。'},{is_user:false,mes:'旧消息',swipe_id:0}],
    eventTypes:new Proxy({},{get:(_,k)=>k}),substituteParams:s=>s.replace(/\{\{.*?\}\}/g,'已展开规则'),stopGeneration(){emit('GENERATION_STOPPED');}};
  host.SillyTavern={getContext:()=>context};
  host.fetch=async(input,init)=>{nativeCalls.push({input,init});return String(input).startsWith('https://expert.example')?reply(input,init):{ok:true,status:200,body:'original-stream'};};
  const nativeFetch=host.fetch;
  const helpers={getVariables:()=>clone(stored),replaceVariables(value){stored=clone(value);storage.push(clone(value));},getPreset:()=>clone(preset),getLoadedPresetName:()=> '咩咩预设 - ver 5.8.2',
    eventOn(name,fn){let set=eventListeners.get(name);if(!set)eventListeners.set(name,set=new Set());set.add(fn);return {stop(){set.delete(fn);if(!set.size)eventListeners.delete(name);}};}};
  function emit(name,...args){for(const fn of [...(eventListeners.get(name)||[])])fn(...args);}
  const count={active:0,peak:0,activated:0,deactivated:0,attached:0};let last,source;
  function factory(api) {
    const instance=(options.createExtension||createDirectorExtension)(api,{host,helpers,assets:{icon:options.icon||'data:image/png;base64,AA==',styles:options.styles}});
    let live=false;
    last={instance,api};
    return {...instance,
      activate(){const result=instance.activate();if(result&&!live){live=true;count.active++;count.activated++;count.peak=Math.max(count.peak,count.active);history.push('activate');}return result;},
      async deactivate(){if(live){await options.deactivateDelay?.();await instance.deactivate();live=false;count.active--;count.deactivated++;history.push('deactivate');}else await instance.deactivate();},
    };
  }
  const make=()=>{source=createDirectorDualMode({host,frame,manifest,factory,icon:options.icon||'data:image/png;base64,AA==',launcherStyles:styles,onError:e=>errors.push(String(e))});return source;};
  const el=name=>doc.querySelector(`[data-sp-${name}]`);
  function enable(){el('base').value='https://expert.example/v1';el('model').value='expert';el('key').value='page-secret';el('toggle').click();}
  const payload=()=>({model:'main',stream:true,temperature:.8,messages:[{role:'system',content:'<story_driver_format>已展开规则</story_driver_format><story_driver>规划</story_driver>历史SECRET-HISTORY\n'+preset.prompts[2].content+'\nBOTTOM_CHAIN'},{role:'user',content:context.chat[0].mes}]});
  function dispatch(body=payload()) {emit('GENERATION_STARTED','normal',{},false);emit('CHAT_COMPLETION_SETTINGS_READY',body);return host.fetch('/api/backends/chat-completions/generate',{method:'POST',headers:{'X-CSRF':'keep'},body:JSON.stringify(body)});}
  t.after(async()=>{await source?.dispose();dom.window.close();});
  return {dom,host,frame,doc,helpers,context,emit,eventListeners,errors,storage,nativeCalls,nativeFetch,count,history,make,el,enable,payload,dispatch,
    get last(){return last;},get stored(){return stored;},setReply(fn){reply=fn;},get source(){return source;}};
}

// Execute unmodified official 0.8.1 Runtime and the actual provide/ready/release
// bootstrap block. Only its UI Surface boundary is represented by a DOM fixture.
const runtimeSource=read('../fixtures/hub-0.8.1/extension-runtime.js').replace(/^import .*;$/gm,'').replace('export function ','function ');
const createExtensionRuntime=new Function('HUB_PRODUCT',runtimeSource+'\nreturn createExtensionRuntime;')({englishName:'MieMie Hub'});
const bootstrapSource=read('../fixtures/hub-0.8.1/bootstrap.js');
const protocolBlock=bootstrapSource.slice(0,bootstrapSource.indexOf('// Capture the iframe-bound API'));
export function hubFixture(f,{disabled=false,legacy=false}={}) {
  const {host,doc}=f,panels=new Map(),providers=new Map();let shortcut=null,shortcutEnabled=false,origin='honeycomb',motion={honeycomb:0,native:0},closed=false;
  if(disabled)host.localStorage.setItem('miemie_hub_extensions_v1',JSON.stringify({version:1,extensions:{[manifest.id]:{registered:true,enabled:false}}}));
  const ui={refresh(){},runtimeChanged(){},report(e){f.errors.push(e);},closeMessage(){},
    attachPanel(id,_title,panel,presentation){
      if(panel.ownerDocument!==doc||!panel.isConnected||panels.has(id))throw Error('Invalid panel');
      panel.hidden=true;panel.inert=true;panels.set(id,{panel,presentation});f.count.attached++;
      return ()=>{panel.hidden=true;panel.inert=true;panels.delete(id);};
    },
    registerShortcut(id,mount){providers.set(id,mount);return ()=>{shortcut?.dispose();shortcut=null;providers.delete(id);};},
    async showPanel(id){const item=panels.get(id);if(!item)return false;const {panel}=item;panel.hidden=false;panel.inert=true;
      if(origin==='shortcut'&&shortcut){motion.native++;await shortcut.presentation.run(panel,true);}else motion.honeycomb++;
      panel.inert=false;return true;},
    async closePanel(id){const item=panels.get(id);if(!item)return false;if(origin==='shortcut'&&shortcut){await shortcut.presentation.run(item.panel,false);shortcut.presentation.release();}item.panel.hidden=true;item.panel.inert=true;return true;},
  };
  const protocol=new Function('h','createExtensionRuntime','BUNDLED_EXTENSIONS','bundledClassificationResolver','fixtureUI',protocolBlock+
    '\nhubUI=fixtureUI;return {provide,extensionRuntime,dispose(){hubDisposed=true;return extensionRuntime.dispose();}};')(host,createExtensionRuntime,[],()=>()=> 'community',ui);
  let finish;const whenDisposed=new Promise(r=>finish=r);
  const runtime=protocol.extensionRuntime;
  const hub={apiVersion:1,version:'0.8.1',...(legacy?{}:{whenDisposed}),extensions:{provide:protocol.provide,open:runtime.open,disable:runtime.disable,enable:runtime.enable,uninstall:runtime.uninstall}};
  return {hub,runtime,panels,motion,
    start(){host.__MieMieHub=hub;host.dispatchEvent(new host.CustomEvent('miemie:hub-ready',{detail:hub}));},
    async stop(){if(closed)return whenDisposed;closed=true;const pending=protocol.dispose();shortcut?.dispose();shortcut=null;if(host.__MieMieHub===hub)delete host.__MieMieHub;host.dispatchEvent(new host.CustomEvent('miemie:hub-disposed',{detail:hub}));await pending;finish();},
    preference(enabled){shortcutEnabled=enabled;shortcut?.dispose();shortcut=null;
      if(enabled&&providers.has(manifest.id))shortcut=providers.get(manifest.id)({open:async()=>{origin='shortcut';await runtime.open(manifest.id);}});},
    async openHoneycomb(){origin='honeycomb';return runtime.open(manifest.id);},
    get shortcut(){return shortcut;},get shortcutEnabled(){return shortcutEnabled;},
  };
}
