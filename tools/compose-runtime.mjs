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
  once("\n(() => {\n  'use strict';", "\nexport function mountDirectorRuntime(options) {\n  'use strict';\n  const {host,api,resources,helpers,onProgress,editorPresentation}=options;");
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
  once("function block(e){if(e.type==='keydown'&&e.key==='Escape'",
    "function block(e){if(e.type==='keydown'&&(e.isComposing||e.keyCode===229))return;if(e.type==='keydown'&&e.key==='Escape'");
  once("e.key==='Escape'&&(el('requirement-editor').open", "e.key==='Escape'&&!editorPresentation&&(el('requirement-editor').open");
  once("  const rootEl=el;", `  function showLibraryDialog(dialog,opener,entryId) {
    if(editorPresentation)editorPresentation.open(dialog,opener,entryId);
    else if(!dialog.open)dialog.showModal();
  }
  function closeLibraryDialog(dialog,restore=true) {
    if(editorPresentation)editorPresentation.close(dialog,restore);
    else dialog.close?.();
  }
  const rootEl=el;`);
  once("el('requirement-editor').close?.();", "closeLibraryDialog(el('requirement-editor'));");
  once("function selectRequirement(id){", "function selectRequirement(id,opener=el('requirement-add')){");
  once("if(!el('requirement-editor').open)el('requirement-editor').showModal();", "showLibraryDialog(el('requirement-editor'),opener,id);");
  once("edit.onclick=()=>selectRequirement(entry.id);", "edit.onclick=()=>selectRequirement(entry.id,edit);");
  once("rootEl('planning-template').showModal();", "showLibraryDialog(rootEl('planning-template'),el('requirement-add'));");
  once("rootEl('planning-template').close();addEntry(content);", "closeLibraryDialog(rootEl('planning-template'),false);addEntry(content);");
  once("()=>rootEl('planning-template').close();", "()=>closeLibraryDialog(rootEl('planning-template'));");
  once("if(kind==='planning')rootEl('planning-template').close?.();", "if(kind==='planning')closeLibraryDialog(rootEl('planning-template'));");
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
  once('  const fingerprint=()=>JSON.stringify(ctx().chat.map(m=>[m.is_user,m.mes,m.swipe_id]));', `  const captureChat=()=>ctx().chat.map(m=>[m.is_user??null,m.mes??null,m.swipe_id??null]);
  function chatMatches(snapshot){
    const chat=ctx().chat;
    if(chat.length!==snapshot.length)return false;
    return chat.every((m,i)=>{
      const [user,text,swipe]=snapshot[i];
      return (m.is_user??null)===user&&(m.mes??null)===text&&(m.swipe_id??null)===swipe;
    });
  }`);
  once('fingerprint:fingerprint()', 'chatSnapshot:captureChat()');
  once('r.fingerprint!==fingerprint()', '!chatMatches(r.chatSnapshot)');
  once('fingerprint()!==run.fingerprint', '!chatMatches(run.chatSnapshot)');
  once("const player=[...ctx().chat].reverse().find(m=>m.is_user)?.mes||'';", "const player=ctx().chat.findLast(m=>m.is_user)?.mes||'';");
  once("const record=[...records].reverse().find(x=>!x.used&&JSON.stringify(x.payload)===sourceBody);", "const record=records.findLast(x=>!x.used&&JSON.stringify(x.payload)===sourceBody);");
  once("  function renderRules(variables){\n    const list=el('rules-preview');list.replaceChildren();", `  let renderedRules;
  function renderRules(variables){
    const signature=JSON.stringify(variables.flatMap(v=>v.sources.map(source=>[source.name,v.name])));
    if(signature===renderedRules)return;
    renderedRules=signature;
    const list=el('rules-preview');list.replaceChildren();`);
  once("catch(e){el('rules-preview').textContent=e.message;}", "catch(e){renderedRules=undefined;el('rules-preview').textContent=e.message;}");
  once('  function cancel(reason){if(run)run.controller.abort();say(reason);}', `  function cancel(reason){
    if(run){
      if(run.planning&&!run.sent&&!run.cancelled&&!disposed)onProgress?.('cancelled','本轮规划已取消');
      run.cancelled=true;run.controller.abort();
    }
    say(reason);
  }`);
  once('timer=resources.timeout(abort,config.timeout*1000);', 'timer=resources.timeout(()=>{r.timedOut=true;abort();},config.timeout*1000);');
  once('      const report=await Promise.race([callExpert(expert,r,nativeFetch),interrupted]);guard(r);', `      r.planning=true;onProgress?.('waiting','正在规划 · 等待副 API');
      const report=await Promise.race([callExpert(expert,r,nativeFetch),interrupted]);guard(r);`);
  once('      r.sent=true;const response=await nativeFetch.call', `      r.sent=true;onProgress?.('done','规划完成 · 交给主 API');
      const response=await nativeFetch.call`);
  once("    }catch(e){r.diagnostic.status=e.message||'故事规划失败';", `    }catch(e){
      if(r.planning&&!r.sent&&!r.cancelled){
        const cancelled=r.controller.signal.aborted&&!r.timedOut;
        onProgress?.(cancelled?'cancelled':'failed',cancelled?'本轮规划已取消':r.timedOut?'规划超时':'规划失败 · 主 API 未发送');
      }
      r.diagnostic.status=e.message||'故事规划失败';`);
  once("cancel('聊天已切换，旧规划已取消。');generation=null;", "cancel('聊天已切换，旧规划已取消。');onProgress?.();generation=null;");
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
