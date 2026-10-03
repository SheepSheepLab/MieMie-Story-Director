// 咩咩故事导演 · 独立测试版 0.1.22
(() => {
  'use strict';
/* @miemie:core */
  const host=window.parent,doc=host.document,ctx=()=>host.SillyTavern.getContext(),ID='__meemeStoryPlanner';
  if(host[ID]){if(host[ID].open)host[ID].open();else host.alert('请先停用工具箱内的导演实验版并刷新，再启用独立导演。');return;}
  const STORE={type:'extension',extension_id:'meeme_story_planner_v1'};const secrets=new Set();
  let saved={};try{saved=getVariables(STORE)||{}}catch(_){}
  let config={base:'',model:'',maxTokens:10000,timeout:300,custom:'',writerPrompt:StoryPlannerCore.DEFAULT_WRITER,...saved},secret='',enabled=false,disposed=false,run=null,generation=null,records=[],diagnostic=null,debugPage='overview';
  const box=doc.createElement('section');box.className='sp-panel';box.innerHTML=`/* @miemie:panel */`;
  const originalFetch=host.fetch;
  const directorRoot=doc.createElement('div');directorRoot.id='meeme-story-director';
  directorRoot.innerHTML=`<style>
#meeme-story-director{position:fixed;inset:0;pointer-events:none;z-index:2147483600;color:#eee8ff;font:14px/1.55 system-ui;color-scheme:dark}
#meeme-story-director *{box-sizing:border-box}#meeme-story-director [hidden]{display:none!important}
#meeme-story-director button,#meeme-story-director input,#meeme-story-director textarea,#meeme-story-director select{font:inherit;color:#eee8ff;background:#131728;border:1px solid #62759e;border-radius:9px;padding:9px 12px}
#meeme-story-director button{cursor:pointer;transition:background .16s,border-color .16s}#meeme-story-director button:hover{background:#293552;border-color:#a7b8e5}#meeme-story-director button[data-on=true]{background:#16433f;border-color:#36c6b5}
#meeme-story-director button:focus-visible{outline:2px solid #a9bfff;outline-offset:2px}
#meeme-story-director [data-director-launch]{pointer-events:auto;position:fixed;left:16px;bottom:calc(76px + env(safe-area-inset-bottom,0px));box-shadow:0 5px 24px #0008}
#meeme-story-director [data-director-window]{pointer-events:auto;position:fixed;left:16px;top:20px;width:min(600px,calc(100vw - 32px));max-height:calc(100dvh - 116px);display:flex;flex-direction:column;background:#111c2f;border:1px solid #6f82b0;border-radius:16px;box-shadow:0 15px 60px #0009;overflow:hidden}
#meeme-story-director .director-brand{display:flex;align-items:center;gap:13px}#meeme-story-director .director-brand img{width:52px;height:52px}#meeme-story-director .director-brand strong{font-size:18px;color:#e5eeff}#meeme-story-director .director-brand small{display:block;color:#92a8c8;font-size:12px;margin-top:4px}
#meeme-story-director .director-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #3c4a6b;flex-shrink:0}
#meeme-story-director [data-director-content]{overflow:auto;overscroll-behavior:contain;padding:0 14px 14px;min-height:0}
#meeme-story-director .sp-panel{margin:12px 0 0}#meeme-story-director dialog{pointer-events:auto}
</style><section data-director-window aria-label="咩咩故事导演"><header class="director-heading"><div class="director-brand"><img src="/* @miemie:legacy-icon */" alt="咩咩"><div><strong>咩咩故事导演</strong><small>独立测试 · 0.1.22</small></div></div><button type="button" data-director-close>收起</button></header><div data-director-content></div></section><button type="button" data-director-launch aria-label="打开故事导演">🎬 故事导演</button>`;
  (doc.documentElement||doc.body).appendChild(directorRoot);
  const directorWindow=directorRoot.querySelector('[data-director-window]');
  const open=()=>{directorWindow.hidden=false;inspectRules();};
  directorRoot.querySelector('[data-director-launch]').onclick=()=>{directorWindow.hidden=!directorWindow.hidden;if(!directorWindow.hidden)inspectRules();};
  directorRoot.querySelector('[data-director-close]').onclick=()=>{directorWindow.hidden=true;};
  directorRoot.querySelector('[data-director-content]').appendChild(box);

  const el=n=>box.querySelector('[data-sp-'+n+']'),say=s=>{if(!disposed)el('status').textContent=s;};
  const scope=()=>JSON.stringify([ctx().characterId,ctx().groupId,ctx().chatId]);
  const fingerprint=()=>JSON.stringify(ctx().chat.map(m=>[m.is_user,m.mes,m.swipe_id]));
  function paint(){if(disposed)return;el('toggle').textContent='故事导演：'+(enabled?'开启':'关闭');el('toggle').dataset.on=String(enabled);el('cancel').hidden=!run;}
  function redact(text){for(const key of secrets)if(key)text=text.split(key).join('[密钥已隐藏]');return text;}
  function debug(){if(disposed)return;
    let data='还没有故事规划请求。';
    if(diagnostic){
      const d=diagnostic;
      if(debugPage==='rules')data={planningRules:d.planningRules||null,contextFilter:d.contextFilter||null};
      else if(debugPage==='expert')data=d.expertRequest||'副API尚未发送';
      else if(debugPage==='task')data={rawResponse:d.expertResponse??null,report:d.report??null,handoff:d.handoff??null};
      else if(debugPage==='writer')data=d.writerMessages?{status:d.status,messages:d.writerMessages}:'主API尚未发送';
      else data={status:d.status,preset:d.preset,generationType:d.generationType,httpStatus:d.httpStatus,usage:d.usage,finishReason:d.finishReason,contextCharacters:d.contextCharacters,writerCharacters:d.writerCharacters,responsePreview:d.responsePreview};
    }
    el('debug').textContent=redact(typeof data==='string'?data:JSON.stringify(data,null,2));
  }
  function closeDebug(){el('dialog').close?.();}
  el('open-debug').onclick=()=>{const dialog=el('dialog');if(!dialog.open)dialog.showModal?.();debug();};
  el('close-debug').onclick=closeDebug;
  el('debug-page').onchange=()=>{debugPage=el('debug-page').value;debug();};
  function renderRules(variables){
    const list=el('rules-preview');list.replaceChildren();
    for(const v of variables)for(const source of v.sources){const row=doc.createElement('div');row.className='sp-rule';row.setAttribute('role','listitem');const title=doc.createElement('div');title.textContent=source.name;const meta=doc.createElement('small');meta.textContent=v.name;row.appendChild(title);row.appendChild(meta);list.appendChild(row);}
    if(!list.children.length)list.textContent='当前没有启用的规划条目。';
  }
  function inspectRules(){if(disposed)return;try{renderRules(StoryPlannerCore.planningSources(getPreset('in_use')));}catch(e){el('rules-preview').textContent=e.message;}}
  const tabKeys=['expert','writer','api'];
  function selectTab(key,focus=false){
    closeDebug();
    for(const item of tabKeys){const button=el('tab-'+item);button.setAttribute('aria-selected',String(item===key));button.tabIndex=item===key?0:-1;el('page-'+item).hidden=item!==key;}
    if(key==='expert')inspectRules();if(focus)el('tab-'+key).focus?.();
  }
  for(const [index,key] of tabKeys.entries()){
    el('tab-'+key).onclick=()=>{closeRequirementEditor();selectTab(key);};
    el('tab-'+key).onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowUp'?-1:1)+3)%3;closeRequirementEditor();selectTab(tabKeys[next],true);};
  }
  selectTab('expert');

/* @miemie:libraries */
  function save(){
    if(run||probeRun)throw Error('请等待当前请求完成或取消后，再修改接口配置。');
    const next={base:el('base').value.trim().replace(/\/+$/,''),model:el('model').value.trim(),maxTokens:Number(el('tokens').value),timeout:Number(el('timeout').value),requirements:config.requirements,plannings:config.plannings,writers:config.writers};
    if(next.base){let u;try{u=new URL(next.base)}catch(_){throw Error('导演接口地址无效。')}if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('接口需为HTTP(S)基础地址，不能包含账号、查询参数或片段。');}
    if(!Number.isInteger(next.maxTokens)||next.maxTokens<512||next.maxTokens>131072)throw Error('输出上限需为512—131072的整数。');
    if(!Number.isInteger(next.timeout)||next.timeout<30||next.timeout>1800)throw Error('超时需为30—1800秒。');
    secret=el('key').value;secrets.add(secret);config=next;replaceVariables(config,STORE);
    if(el('remember').checked&&secret)host.localStorage.setItem(KEY_STORE,JSON.stringify({base:config.base,key:secret}));else host.localStorage?.removeItem(KEY_STORE);
  }
  function assertSetup(){if(!config.base||!config.model)throw Error('先填写故事导演接口地址与模型。');if(ctx().mainApi!=='openai')throw Error('实验版仅支持酒馆聊天补全主接口。');if(ctx().groupId||ctx().characterId==null||!ctx().chatId)throw Error('实验版请打开单人角色聊天。');if(typeof getPreset!=='function'||typeof getLoadedPresetName!=='function'||typeof ctx().substituteParams!=='function')throw Error('需要支持预设读取的酒馆助手。');if(!/咩咩预设/.test(getLoadedPresetName()))throw Error('实验版只适配咩咩预设。');}
  const KEY_STORE='meeme_story_director_api_key_v1';let probeRun=null;
  const apiSay=s=>{if(!disposed)el('api-status').textContent=redact(s);};
  el('save').onclick=()=>{try{save();apiSay(el('remember').checked?'接口已保存，密钥已记在此浏览器。':'接口已保存；密钥仅在当前页面使用。')}catch(e){say(e.message)}};
  el('toggle').onclick=()=>{try{if(!enabled){save();assertSetup();}else cancel('已关闭故事导演。');enabled=!enabled;paint();say(enabled?'已开启。下次普通发送或重roll会先规划，再由主API输出完整消息。':'已关闭，后续使用原单API流程。');}catch(e){say(e.message)}};
  el('base').addEventListener('input',()=>{secret='';el('key').value='';el('remember').checked=false;probeRun?.abort();el('model-list').replaceChildren();});
  el('cancel').onclick=()=>{cancel(run?.sent?'已取消主请求。':'已取消本轮规划；未发送主请求。');ctx().stopGeneration();};
  el('clear').onclick=()=>{diagnostic=null;debug()};
  for(const [field,key] of [['base','base'],['model','model'],['tokens','maxTokens'],['timeout','timeout']])el(field).value=config[key];
  try{const record=JSON.parse(host.localStorage?.getItem(KEY_STORE)||'null');if(record?.base===config.base&&typeof record.key==='string'){secret=record.key;secrets.add(secret);el('key').value=secret;el('remember').checked=true;}}catch(_){}
  el('remember').onchange=()=>{try{if(!el('remember').checked)host.localStorage?.removeItem(KEY_STORE);apiSay(el('remember').checked?'保存接口后记住密钥。':'已取消本地保存；本页仍可使用。');}catch(e){apiSay('浏览器无法访问本地存储。');}};
  el('clear-key').onclick=()=>{if(run||probeRun){apiSay('请先完成或取消当前请求。');return;}try{host.localStorage?.removeItem(KEY_STORE);secret='';el('key').value='';el('remember').checked=false;apiSay('已清除本页及浏览器保存的密钥。');}catch(e){apiSay('浏览器无法访问本地存储。');}};
  el('model-list').onchange=()=>{if(el('model-list').value)el('model').value=el('model-list').value;};
  async function probe(kind){
    if(run||probeRun){apiSay('请等待当前请求完成。');return;}
    try{save();if(!config.base)throw Error('请填写接口地址。');if(kind==='test'&&!config.model)throw Error('请先选择模型，或手动填写模型名称。');}catch(e){apiSay(e.message);return;}
    const controller=new host.AbortController();probeRun=controller;const button=el(kind),label=kind==='test'?'连接测试':'获取模型列表';button.disabled=true;button.textContent='请求中…';
    const base=config.base,model=config.model,headers=secret?{Authorization:'Bearer '+secret}:{};
    const timer=host.setTimeout(()=>controller.abort(),30000);apiSay('正在'+label+'…');
    try{
      const request=async()=>{const response=await host.fetch(base+(kind==='test'?'/chat/completions':'/models'),{method:kind==='test'?'POST':'GET',headers:kind==='test'?{...headers,'Content-Type':'application/json'}:headers,...(kind==='test'?{body:JSON.stringify({model,messages:[{role:'user',content:'请仅回复 OK。'}],max_tokens:64,stream:false})}:{}),signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error(label+' HTTP '+response.status);return JSON.parse(await response.text());};
      const data=await Promise.race([request(),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('请求已取消或超过 30 秒。')),{once:true}))]);
      if(disposed||controller.signal.aborted)return;
      if(kind==='test'){if(!data.choices?.[0]?.message?.content)throw Error('服务没有返回测试文本。');apiSay('连接成功：模型已返回文本。');}
      else{if(!Array.isArray(data.data))throw Error('模型列表格式不兼容，可手动填写模型。');const ids=[...new Set(data.data.map(x=>x?.id).filter(x=>typeof x==='string'&&x.trim()))].sort();const select=el('model-list');select.replaceChildren();for(const id of ['',...ids]){const option=doc.createElement('option');option.value=id;option.textContent=id||'请选择模型';select.appendChild(option);}select.value=ids.includes(model)?model:'';apiSay(ids.length?'已获取 '+ids.length+' 个模型，请选择后保存接口。':'模型列表为空，可手动填写模型。');}
    }catch(e){apiSay(e.message);}finally{host.clearTimeout(timer);if(probeRun===controller)probeRun=null;button.disabled=false;button.textContent=label;}
  }
  el('models').onclick=()=>probe('models');el('test').onclick=()=>probe('test');
  function cancel(reason){if(run)run.controller.abort();say(reason);}
  function guard(r){if(disposed||r.controller.signal.aborted||r.scope!==scope()||r.fingerprint!==fingerprint()||generation!==r.generation||generation?.stopped||r.generation.scope!==scope()||(r.presetStamp&&JSON.stringify(getPreset('in_use'))!==r.presetStamp))throw Error('规划已取消，或聊天/消息/分支发生变化；未发送主请求。');}
  async function callExpert(messages,r,nativeFetch){
    const d=r.diagnostic;const body={model:config.model,messages,max_tokens:config.maxTokens,stream:false};d.expertRequest=body;debug();
    const response=await nativeFetch.call(host,config.base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})},body:JSON.stringify(body),signal:r.controller.signal,credentials:'omit'});
    const text=await response.text();d.httpStatus=response.status;
    // Response content is page-local only; credentials and authorization headers are never recorded.
    if(!response.ok){d.responsePreview=text.slice(0,3000);throw Error('导演接口HTTP '+response.status+'；未发送主请求。');}
    let data;try{data=JSON.parse(text)}catch(_){d.responsePreview=text.slice(0,3000);throw Error('导演接口未返回JSON响应；实验版需要非流式聊天补全。');}
    const choice=data.choices?.[0];d.usage=data.usage??null;d.finishReason=choice?.finish_reason??null;d.expertResponse=choice?.message?.content??'';
    if(choice?.finish_reason==='length')throw Error('导演输出被截断，请提高输出上限或缩短要求；未发送主请求。');
    if(typeof choice?.message?.content!=='string'||!choice.message.content.trim())throw Error('导演未返回报告正文；未发送主请求。');
    return StoryPlannerCore.validateReport(choice.message.content);
  }
  async function dispatch(input,init,nativeFetch,sourceBody){
    let url;try{url=new URL(typeof input==='string'?input:input.url,host.location.href)}catch(_){return nativeFetch.call(host,input,init)}
    if(disposed||!enabled||url.origin!==host.location.origin||url.pathname!=='/api/backends/chat-completions/generate'||typeof init?.body!=='string')return nativeFetch.call(host,input,init);
    // Other generation types retain their original flow; only marked normal/swipe requests enter planning.
    if(generation&&!['normal','swipe','regenerate',undefined].includes(generation.type))return nativeFetch.call(host,input,init);
    const record=[...records].reverse().find(x=>!x.used&&JSON.stringify(x.payload)===sourceBody);
    if(!record||record.generation!==generation||generation?.stopped)throw Error('故事导演：缺少有效的本轮请求标记，请重新发送。');
    record.used=true;if(run)throw Error('故事导演仍在工作，已阻止重复请求。');
    const r={controller:new host.AbortController(),scope:scope(),fingerprint:fingerprint(),generation,presetStamp:record.presetStamp};run=r;paint();
    const abort=()=>r.controller.abort();init.signal?.addEventListener('abort',abort,{once:true});if(init.signal?.aborted)abort();
    let timer;diagnostic={status:'规划中',generationType:generation.type||'normal',preset:record.presetName,planningRules:record.planningRules};r.diagnostic=diagnostic;debug();say('故事导演正在规划；主请求尚未发送。');
    try{
      assertSetup();guard(r);if(record.error)throw Error(record.error);
      const payload=JSON.parse(init.body);if(payload.tools?.length||payload.functions?.length||Number(payload.n||1)>1)throw Error('实验版暂不支持工具调用或一次生成多个候选。');
      const originalMessages=StoryPlannerCore.plainMessages(payload.messages);
      if(!originalMessages.some(m=>m.content.includes('<story_driver>')))throw Error('实际请求没有story_driver，无法确认预设适配。');
      const filtered=StoryPlannerCore.filterExpertContext(originalMessages,record.expertFilter,record.directorPrompt);const messages=filtered.messages;r.diagnostic.contextFilter={placement:filtered.placement,activePlanning:record.plannings.filter(e=>e.enabled).map(e=>e.name),activeHighestInstructions:record.requirements.filter(e=>e.enabled).map(e=>e.name),removed:filtered.removed,excludedVariables:filtered.excludedVariables,beforeCharacters:JSON.stringify(originalMessages).length,afterCharacters:JSON.stringify(messages).length};
      const expert=StoryPlannerCore.expertMessages(messages);
      const interrupted=new Promise((_,reject)=>{r.controller.signal.addEventListener('abort',()=>reject(Error('规划已取消或超时；未发送主请求。')),{once:true});timer=host.setTimeout(abort,config.timeout*1000);});
      const report=await Promise.race([callExpert(expert,r,nativeFetch),interrupted]);guard(r);
      const handoff=StoryPlannerCore.writerMessages(payload.messages,report,record.expertFilter.find(f=>f.sourceId==='20f5f445-aba9-42aa-a1f4-927e28384f84')?.text,record.writerPrompt,record.player);const writer=handoff.messages;r.diagnostic.handoff={scene:handoff.scene,driverIndex:handoff.driverIndex,playerIndex:handoff.playerIndex};
      r.diagnostic.report=report;r.diagnostic.writerMessages=writer;r.diagnostic.contextCharacters=JSON.stringify(messages).length;r.diagnostic.writerCharacters=JSON.stringify(writer).length;
      r.diagnostic.status='规划完成，正在发送主API';debug();say('规划完成，主API开始生成完整回复。');
      host.clearTimeout(timer);timer=null;
      // Keep every transport/model/stream setting from Tavern, changing only this request's messages.
      r.sent=true;const response=await nativeFetch.call(host,input,{...init,signal:r.controller.signal,body:JSON.stringify({...payload,messages:writer})});
      r.diagnostic.status=response.ok?'主API已响应，完整回复由酒馆继续接收':'主API返回HTTP '+response.status;debug();return response;
    }catch(e){r.diagnostic.status=e.message||'故事规划失败';if(diagnostic===r.diagnostic){debug();say(r.diagnostic.status+' 已解除等待；可重试，或关闭故事导演后继续。');}throw e;}
    finally{if(timer)host.clearTimeout(timer);init.signal?.removeEventListener('abort',abort);if(run===r)run=null;paint();}
  }
  const subs=[];function on(name,fn){const key=ctx().eventTypes[name];if(key)subs.push(eventOn(key,fn));}
  function block(e){if(e.type==='keydown'&&e.key==='Escape'&&(el('requirement-editor').open||el('planning-editor').open||el('writer-editor').open)){e.preventDefault();e.stopImmediatePropagation();closeRequirementEditor();return;}if(e.type==='keydown'&&e.key==='Escape'&&el('dialog').open){e.preventDefault();e.stopImmediatePropagation();closeDebug();return;}if(!run||run.controller.signal.aborted||run.scope!==scope())return;const t=e.target;const hit=e.type==='click'&&t?.closest?.('#send_but')||e.type==='submit'&&t?.matches?.('#send_form')||e.type==='keydown'&&t?.closest?.('#send_textarea')&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229;if(hit){e.preventDefault();e.stopImmediatePropagation();say('故事导演正在工作，请等待或取消本轮规划。');}}
  for(const event of ['OAI_PRESET_CHANGED_AFTER','PRESET_CHANGED','CHAT_CHANGED'])on(event,inspectRules);
  on('GENERATION_STARTED',(type,options,dry)=>{if(dry)return;if(run)cancel('新的生成取代了旧规划。');generation={type,scope:scope(),stopped:false};records=[];});
  on('CHAT_COMPLETION_SETTINGS_READY',payload=>{
    if(!enabled||!generation)return;let contract='',error='',presetName='',presetStamp='',planningRules=null,expertFilter=[],writerPrompt='',directorPrompt='';
    try{assertSetup();writerPrompt=StoryPlannerCore.writerPrompt(config.writers,s=>ctx().substituteParams(s));presetName=getLoadedPresetName();const preset=getPreset('in_use');presetStamp=JSON.stringify(preset);contract=StoryPlannerCore.contractFromPreset(preset,s=>ctx().substituteParams(s));planningRules=StoryPlannerCore.planningFromPreset(preset,s=>ctx().substituteParams(s));expertFilter=StoryPlannerCore.expertFilterFromPreset(preset,s=>ctx().substituteParams(s));directorPrompt=StoryPlannerCore.requirementText(config.requirements,planningRules,config.plannings,s=>ctx().substituteParams(s));renderRules(planningRules.variables);}catch(e){error=e.message;}
    const player=[...ctx().chat].reverse().find(m=>m.is_user)?.mes||'';
    records.push({payload,generation,contract,error,presetName,presetStamp,planningRules,expertFilter,requirements:JSON.parse(JSON.stringify(config.requirements)),plannings:JSON.parse(JSON.stringify(config.plannings)),writerPrompt,directorPrompt,player,used:false});records=records.slice(-4);
  });
  on('GENERATION_STOPPED',()=>{if(generation)generation.stopped=true;cancel('本轮生成已停止。');});
  on('GENERATION_ENDED',()=>{generation=null;records=[];});
  on('CHAT_CHANGED',()=>{cancel('聊天已切换，旧规划已取消。');generation=null;records=[];diagnostic=null;debug();});
  for(const name of ['MESSAGE_SWIPED','MESSAGE_EDITED','MESSAGE_DELETED','MESSAGE_UPDATED'])on(name,()=>{if(run&&fingerprint()!==run.fingerprint)cancel('消息或候选已变化，旧规划已取消。');});
  for(const e of ['click','keydown','submit'])host.addEventListener(e,block,true);
  function cleanup(){disposed=true;probeRun?.abort();cancel('脚本已关闭。');subs.forEach(s=>s.stop());for(const e of ['click','keydown','submit'])host.removeEventListener(e,block,true);closeDebug();closeRequirementEditor();clearDrag();box.remove();directorRoot.remove();if(host.fetch===directorFetch)host.fetch=originalFetch;if(host[ID]?.dispatch===dispatch)delete host[ID];}
  async function directorFetch(input,init){return dispatch(input,init,originalFetch,init?.body);}
  host.fetch=directorFetch;host[ID]={dispatch,open};window.addEventListener('pagehide',cleanup,{once:true});paint();debug();inspectRules();say('实验版默认关闭；仅适配咩咩预设的故事模式。');
})();
