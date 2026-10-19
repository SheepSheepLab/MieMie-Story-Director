import {readFile, writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parse} from 'acorn';
import {composeSource, projectRoot} from './compose-source.mjs';

// This is the complete, audited Phase 3 patch surface. The frozen fragments,
// reconstruction tool and expected outputs remain untouched. No business rewrite.
export async function composeRuntime() {
  let source=await composeSource();
  function once(before,after) {
    if(source.split(before).length!==2)throw Error('Lifecycle patch no longer matches exactly once: '+before.slice(0,90));
    source=source.replace(before,()=>after);
  }
  once("\n(() => {\n  'use strict';", "\nexport function mountDirectorRuntime(options) {\n  'use strict';\n  const {host,api,resources,helpers}=options;");
  once("  const host=window.parent,doc=host.document,ctx=()=>host.SillyTavern.getContext(),ID='__meemeStoryPlanner';",
    "  const {getVariables,replaceVariables,getPreset,getLoadedPresetName,eventOn}=helpers;\n  const doc=resources.document(host.document),ctx=()=>host.SillyTavern.getContext(),ID='__meemeStoryPlanner';");
  once("  if(host[ID]){if(host[ID].open)host[ID].open();else host.alert('请先停用工具箱内的导演实验版并刷新，再启用独立导演。');return;}",
    "  if(host[ID])throw Error('检测到旧版或重复的故事导演；请停用旧脚本并刷新。');");
  once('(doc.documentElement||doc.body).appendChild(directorRoot);', '(doc.documentElement||doc.body).appendChild(directorRoot);resources.add(()=>directorRoot.remove());');
  once('const open=()=>{directorWindow.hidden=false;inspectRules();};','let presentationLease;const open=lease=>{if(disposed)return false;presentationLease=lease;inspectRules();return api.showPanel(lease);};');
  once("  directorRoot.querySelector('[data-director-launch]').onclick=()=>{directorWindow.hidden=!directorWindow.hidden;if(!directorWindow.hidden)inspectRules();};",
    "  directorRoot.querySelector('[data-director-launch]').remove();");
  once("directorRoot.querySelector('[data-director-close]').onclick=()=>{directorWindow.hidden=true;};",
    "directorRoot.querySelector('[data-director-close]').onclick=()=>api.closePanel(presentationLease);");
  source=source.replaceAll('host.setTimeout(', 'resources.timeout(').replaceAll('host.clearTimeout(', 'resources.clear(');
  source=source.replaceAll('new host.AbortController()', 'resources.trackController(new host.AbortController())');
  source=source.replaceAll('host.URL.createObjectURL(', 'resources.objectURL(').replaceAll('host.URL.revokeObjectURL(', 'resources.revokeURL(');
  once("subs.push(eventOn(key,fn))", "subs.push(eventOn(key,resources.guard(fn)))");
  once('button.disabled=false;button.textContent=label;', 'if(!disposed){button.disabled=false;button.textContent=label;}');
  once("finally{el('requirement-file').value='';}", "finally{if(!disposed)el('requirement-file').value='';}");
  once("return {close:()=>{menu.close?.();", "return {refresh:paintRequirements,close:()=>{menu.close?.();");
  once("const subs=[];function on(name,fn){const key=ctx().eventTypes[name];if(key)subs.push(eventOn(key,resources.guard(fn)));}",
    "const subs=[];function on(name,fn){const key=ctx().eventTypes[name];if(key){const subscription=eventOn(key,resources.guard(fn));let stopped=false;const stop=()=>{if(!stopped){stopped=true;subscription.stop();}};subs.push({stop});resources.add(stop);}}");
  once("for(const e of ['click','keydown','submit'])host.addEventListener(e,block,true);",
    "for(const e of ['click','keydown','submit']){host.addEventListener(e,block,true);resources.add(()=>host.removeEventListener(e,block,true));}");
  once('function cleanup(){disposed=true;', 'function cleanup(){if(disposed)return;disposed=true;');
  once('if(host.fetch===directorFetch)host.fetch=originalFetch;', '');
  once("  host.fetch=directorFetch;host[ID]={dispatch,open};window.addEventListener('pagehide',cleanup,{once:true});paint();debug();inspectRules();say('实验版默认关闭；仅适配咩咩预设的故事模式。');",
    `  resources.add(cleanup);resources.add(installDirectorFetchHook(host,directorFetch,originalFetch));
  host[ID]={dispatch,open};resources.add(()=>{if(host[ID]?.dispatch===dispatch)delete host[ID];});paint();debug();inspectRules();say('实验版默认关闭；仅适配咩咩预设的故事模式。');
  const clone=value=>JSON.parse(JSON.stringify(value));
  return {panel:directorWindow,open,
    captureSession(){if(disposed)return null;return {config:clone(config),secret,secrets:[...secrets],enabled,modelOptions:[...el('model-list').children].map(o=>({value:o.value,text:o.textContent})),diagnostic:diagnostic&&clone(diagnostic),debugPage,
      fields:Object.fromEntries(['base','model','tokens','timeout','key','model-list'].map(n=>[n,el(n).value])),remember:el('remember').checked,
      tab:tabKeys.find(n=>el('tab-'+n).getAttribute?.('aria-selected')==='true'||el('tab-'+n)['aria-selected']==='true')||'expert'};},
    restoreSession(state){if(disposed||!state)return;config=clone(state.config);secret=state.secret;for(const key of state.secrets||[secret])secrets.add(key);enabled=state.enabled;
      el('model-list').replaceChildren();for(const item of state.modelOptions||[]){const option=doc.createElement('option');option.value=item.value;option.textContent=item.text;el('model-list').appendChild(option);}
      diagnostic=state.diagnostic;debugPage=state.debugPage;for(const[n,v]of Object.entries(state.fields))el(n).value=v;el('remember').checked=state.remember;
      requirementLibrary.refresh();planningLibrary.refresh();writerLibrary.refresh();selectTab(state.tab);paint();debug();}
  };`);
  if(!source.endsWith('\n})();\n'))throw Error('Unexpected runtime terminator');
  source=source.slice(0,-7)+'}\n';
  source="// GENERATED by tools/compose-runtime.mjs; edit the explicit lifecycle patch list.\nimport {installDirectorFetchHook} from './resources.js';\n"+source;
  // Syntax-aware UI callback revocation and lifetime-only awaits. These wrappers
  // act only at whole-extension disposal; active request signals, cancellation,
  // transport, planning and message construction retain the frozen semantics.
  const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'}),edits=[];
  function walk(node,context) {
    if(!node||typeof node!=='object')return;
    if(node.type==='FunctionDeclaration')context=node.id?.name;
    if(node.type==='AwaitExpression'&&['callExpert','probe','dispatch'].includes(context)&&node.argument.type==='CallExpression') {
      const call=node.argument,callee=call.callee,receiver=callee.type==='MemberExpression'?source.slice(callee.object.start,callee.object.end):'';
      if((context==='callExpert'&&(receiver==='nativeFetch'||receiver==='response'))||(context==='probe'&&(receiver==='host'||receiver==='response'))||(context==='dispatch'&&receiver==='nativeFetch')) {
        const message=context==='probe'?'请求已取消或超过 30 秒。':'规划已取消或超时；未发送主请求。';
        edits.push([call.start,'resources.wait('],[call.end,','+JSON.stringify(message)+')']);
      }
    }
    if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&!node.left.computed&&/^on[a-z]+$/.test(node.left.property.name)) {
      edits.push([node.right.start,'resources.guard('],[node.right.end,')']);
    }
    if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.property.name==='addEventListener'&&node.callee.object.type==='CallExpression'&&node.callee.object.callee.name==='el') {
      const receiver=source.slice(node.callee.object.start,node.callee.object.end);
      // Replace receiver + method + opening paren, retaining all arguments.
      edits.push([node.start,'resources.listen('+receiver+',',node.callee.end+1]);
    }
    for(const value of Object.values(node)) {if(Array.isArray(value)){for(const item of value)walk(item,context);}else if(value&&typeof value==='object')walk(value,context);}
  }
  walk(ast);
  for(const[start,text,end=start]of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+text+source.slice(end);
  new vm.Script(source.replace(/^import .*;$/gm,'').replace('export function ','function '));
  return source;
}
if(process.argv[1]===new URL(import.meta.url).pathname) {
  const source=await composeRuntime(), file=new URL('src/host/business-runtime.generated.js',projectRoot);
  if(process.argv.includes('--write')) {await writeFile(file,source);console.log('Generated Phase 3 runtime from the frozen fragments.');}
  else if(process.argv.includes('--check')) {if(await readFile(file,'utf8')!==source)throw Error('Generated runtime is stale.');console.log('Phase 3 runtime derivation verified.');}
}
