const StoryPlannerCore = (() => {
  const DEFAULT_RULES = `读取当前上下文与预设规划规则，向执笔者提供完整导演报告。说明本轮判定结果、必要依据、NPC动机与行动、事件结果、时间推进及本轮停点。报告的分节与格式可以按需要安排，不需要固定JSON结构。
以世界书和已发生事实为依据；预测、猜测和未来计划不要写成已发生事实。区分各NPC已知信息、来源与未知信息，避免把玩家心声或原著未来当成NPC知识。
主API负责正式正文、数值结算与面板输出。请传递其所需的历史状态基线、本轮变化事实和背景，不要求执笔者猜测缺失资料。资料不足时明确说明。`;
  const SYSTEM='你是本轮的故事导演。';
  function defaultRequirements(){return [
    {id:'director-rules',name:'导演职责与认知边界',enabled:true,content:DEFAULT_RULES},
    {id:'director-format',name:'导演报告参考要求',enabled:true,content:'输出可供执笔者直接使用的完整报告。可按时空判定、角色状态与认知、本轮执行安排、状态变化及注意事项分节，也可自行设计格式。提供最终采用的安排与必要依据；不要求展开内部推理过程。未确定事项单独注明，避免混入已否决方案。将交给主API扩写的大纲完整放在唯一一组 <story_scene> 与 </story_scene> 中；标签外可以写判定说明，但不会交给主API。'}
  ];}
  function upgradeRequirements(entries){
    const legacy={"director-rules": {"name": "导演职责与认知边界", "fingerprint": "532:3058631672"}, "director-format": {"name": "任务包输出格式", "fingerprint": "1231:2430808695"}};const defaults=defaultRequirements();let changed=false;
    const result=entries.map(e=>{const old=legacy[e.id];if(!old||e.name!==old.name||typeof e.content!=='string')return e;let h=2166136261;for(let i=0;i<e.content.length;i++)h=Math.imul(h^e.content.charCodeAt(i),16777619)>>>0;if(e.content.length+':'+h!==old.fingerprint)return e;changed=true;const replacement=defaults.find(d=>d.id===e.id);return {...e,name:replacement.name,content:replacement.content};});return {entries:result,changed};
  }
  function importRequirements(data){
    if(!data||data.type!=='meeme-director-requirements'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>200)throw Error('不是兼容的导演要求文件。');
    return data.entries.map(e=>{if(!e||typeof e.name!=='string'||typeof e.content!=='string'||typeof e.enabled!=='boolean'||e.name.length>200||e.content.length>200000)throw Error('导演要求条目格式无效。');return {name:e.name,content:e.content,enabled:e.enabled};});
  }
  function promptVariables(text,resolve){
    const pattern=/\{\{(?:getvar::([^{}]+)|(user|char))\}\}|<(user|char|bot)>/gi;
    if(text.replace(pattern,'').includes('{{'))throw Error('自定义提示词支持 {{getvar::变量名}}、{{user}}、{{char}} 和 <user>/<char>/<bot>，不支持写入或其他宏。');
    const values=new Map();return text.replace(pattern,(token,name,builtin,alias)=>{
      if(!resolve)throw Error('尚未取得本轮预设变量与人设信息。');
      const identity=(builtin||alias||'').toLowerCase(),macro=name!==undefined?'{{getvar::'+name+'}}':'{{'+(identity==='bot'?'char':identity)+'}}';
      if(!values.has(macro)){const value=resolve(macro);if(typeof value!=='string'||value.includes('{{')||(!name&&!value.trim()))throw Error('提示词变量或姓名未完全展开：'+macro);values.set(macro,value);}
      return values.get(macro);
    });
  }
  function requirementText(entries,planning,customPlanning=[],resolve){
    if(!planning)throw Error('缺少本轮预设规划规则。');
    return '【导演规划】\n'+planning.variables.map(v=>'变量 '+v.name+'：\n'+v.content).join('\n\n')+'\n\n'+customPlanning.filter(e=>e.enabled).map(e=>promptVariables(e.content,resolve)).join('\n\n')+'\n\n【最高指令】\n'+entries.filter(e=>e.enabled).map(e=>promptVariables(e.content,resolve)).join('\n\n');
  }
  function plainMessages(messages){
    if(!Array.isArray(messages)||!messages.length)throw Error('主请求没有消息。');
    return messages.map(m=>{
      if(!['system','user','assistant','developer'].includes(m.role)||m.tool_calls||m.function_call)throw Error('实验版暂不处理工具调用历史。');
      let content=m.content;
      if(Array.isArray(content)){if(content.some(p=>p.type!=='text'||typeof p.text!=='string'))throw Error('实验版暂不处理图片、音频或视频消息。');content=content.map(p=>p.text).join('\n');}
      if(typeof content!=='string')throw Error('发现无法识别的消息内容。');
      return {role:m.role,content,...(m.name?{name:m.name}:{})};
    });
  }
  function validateReport(raw){if(typeof raw!=='string'||!raw.trim())throw Error('导演未返回报告正文；主请求未发送。');return raw;}
  const DEFAULT_WRITER='<story_driver_format>\n<story_driver>\n将本轮用户输入视为待扩写的故事大纲，依据大纲生成完整小说正文。保持大纲的主要事件、人物行动、因果和停点，遵守预设写作、语言与面板输出规则。此处只输出简明执行摘要。\n</story_driver>\n</story_driver_format>';
  function writerContent(text){
    let content=String(text??'');
    for(const tag of ['story_driver_format','story_driver']){const re=new RegExp('^\\s*<'+tag+'>[\\s\\S]*</'+tag+'>\\s*$','i');if(re.test(content)){content=content.replace(new RegExp('^\\s*<'+tag+'>\\s*','i'),'').replace(new RegExp('\\s*</'+tag+'>\\s*$','i'),'');}}
    return content;
  }
  function writerPrompt(entries,resolve){const content=entries.filter(e=>e.enabled).map(e=>promptVariables(writerContent(e.content),resolve)).filter(t=>t.trim()).join('\n\n');if(!content.trim())throw Error('请至少启用一条非空的主API提示词。');return '<story_driver_format>\n<story_driver>\n'+content+'\n</story_driver>\n</story_driver_format>';}
  function extractScene(report){
    validateReport(report);const tags=[...report.matchAll(/<\/?story_scene\b[^>]*>/gi)];
    if(tags.length!==2||!/^<story_scene\s*>$/i.test(tags[0][0])||!/^<\/story_scene\s*>$/i.test(tags[1][0]))throw Error('导演报告需要且只能包含一组完整的 <story_scene> 标签；未发送主请求。');
    const scene=report.slice(tags[0].index+tags[0][0].length,tags[1].index);if(!scene.trim())throw Error('导演的 story_scene 内容为空；未发送主请求。');return scene;
  }
  function writerMessages(original,report,driverText,instruction,player){
    if(!driverText?.trim())throw Error('缺少故事模式定位内容。');if(!instruction?.trim())throw Error('请填写主API提示词。');
    plainMessages(original);const messages=JSON.parse(JSON.stringify(original));let hits=0,driverIndex=-1;
    for(let i=0;i<messages.length;i++){const m=messages[i];if(!['system','developer'].includes(m.role)||typeof m.content!=='string')continue;if(m.content.includes(driverText)){hits+=m.content.split(driverText).length-1;driverIndex=i;m.content=m.content.split(driverText).join(instruction);}}
    if(hits!==1)throw Error('无法唯一定位原 story_driver 提示词，未发送主请求。');
    const candidates=[];for(let i=0;i<messages.length;i++)if(messages[i].role==='user'&&messages[i].content===player)candidates.push(i);
    if(candidates.length!==1)throw Error('无法唯一匹配本轮玩家输入原位置（可能被包装或重复），未发送主请求。');
    const playerIndex=candidates[0],scene=extractScene(report);messages[playerIndex].content=scene;
    return {messages,scene,driverIndex,playerIndex};
  }
  function planningSources(preset){
    const active=preset.prompts.filter(p=>p.enabled);
    const driver=active.find(p=>p.id==='20f5f445-aba9-42aa-a1f4-927e28384f84');
    if(!driver)throw Error('请启用咩咩预设的“思维链-故事模式”。');
    const refs=[...String(driver.content||'').matchAll(/\{\{getvar::([\w.-]+)\}\}/g)].map(m=>m[1]);
    const names=[...new Set(refs.filter(n=>!['zishu','user_gender','language_think'].includes(n)))];
    if(!names.includes('story_think_ini'))throw Error('故事模式未读取story_think_ini，无法确认规划规则入口。');
    const variables=names.map(name=>({name,sources:[]}));
    let afterDriver=false;
    for(const p of active){
      if(p===driver){afterDriver=true;continue;}
      const text=p.content||'';
      // Identify balanced macro blocks, including writes containing nested getvar macros.
      for(let i=0;i<text.length;i++){
        if(text.slice(i,i+2)!=='{{')continue;
        const head=/^\{\{(setvar|addvar)::([\w.-]+)::/.exec(text.slice(i));if(!head)continue;
        let depth=1,end=i+2;while(end<text.length&&depth){if(text.slice(end,end+2)==='{{'){depth++;end+=2}else if(text.slice(end,end+2)==='}}'){depth--;end+=2}else end++;}
        const v=variables.find(v=>v.name===head[2]);if(!v)continue;if(afterDriver)throw Error('规划变量在故事模式之后仍被写入，无法确认读取时点：'+p.name);if(depth)throw Error('规划变量宏未闭合：'+p.name);
        const raw=text.slice(i+head[0].length,end-2);
        if(head[1]==='setvar')v.sources=[];
        if(raw.trim())v.sources.push({id:p.id,name:p.name,operation:head[1],raw});
        i=end-1;
      }
    }
    if(!variables.find(v=>v.name==='story_think_ini')?.sources.length)throw Error('没有找到启用的故事规划规则。');
    return variables;
  }
  function planningFromPreset(preset,resolve){
    const variables=planningSources(preset);
    for(const v of variables){const value=resolve('{{getvar::'+v.name+'}}');if(typeof value!=='string'||/\{\{/.test(value))throw Error('规划变量未完全展开：'+v.name);v.content=value;if(v.sources.length&&!value.trim())throw Error('规划变量展开为空：'+v.name);}
    return {variables,instruction:'变量内容来自本轮酒馆展开结果；sources只标示写入来源，不要重复执行或累加。'};
  }
  const EXCLUDED_VARIABLES=['input_punctuation','input_chronological','zhuanshu','input_finish','language','special_status_format','guidang','wlog_drive_begin','wlog_parallel_line','wlog_drive','status_format','affinity_format','npc_log','option','acg角色心理模型_思维链'];
  // Strip only macro write blocks before resolving an output template; never replay mutations.
  function withoutWrites(text){
    let out='',last=0;
    const re=/\{\{(?:setvar|addvar)::/g;let m;
    while((m=re.exec(text))){let depth=1,end=m.index+2;while(end<text.length&&depth){if(text.slice(end,end+2)==='{{'){depth++;end+=2;}else if(text.slice(end,end+2)==='}}'){depth--;end+=2;}else end++;}if(depth)throw Error('输出模板变量未闭合，停止过滤。');out+=text.slice(last,m.index);last=end;re.lastIndex=end;}
    return out+text.slice(last);
  }
  function expertFilterFromPreset(preset,resolve){
    const fragments=[];
    const add=(label,raw)=>{if(/\{\{\s*(?:setvar|addvar|setglobalvar|addglobalvar|random|roll)\b/i.test(raw))throw Error('过滤模板包含不可重复执行的宏：'+label);const value=resolve(raw);if(typeof value!=='string'||value.includes('{{'))throw Error('过滤模板未展开：'+label);if(value.trim()){const fragment={label,text:value.trim()};fragments.push(fragment);return fragment;}};
    const active=preset.prompts.filter(p=>p.enabled);
    // Remove the current system templates, not historical assistant output with similar tags.
    const ids=['eeb2fe7b-8902-4678-ac58-1bcb91cdbfa9','72ffe882-e589-4382-933e-fd6c30fc77ec','20f5f445-aba9-42aa-a1f4-927e28384f84'];
    for(const p of active)if(ids.includes(p.id)){
      if(p.role&&!['system','developer'].includes(p.role))throw Error('格式条目身份已改变，无法安全区分历史：'+p.name);
      const fragment=add(p.name||p.id,withoutWrites(p.content||''));if(fragment)fragment.sourceId=p.id;if(p.id==='72ffe882-e589-4382-933e-fd6c30fc77ec'){if(!fragment)throw Error('预设【格式】展开为空。');fragment.anchor=true;}
    }
    for(const name of EXCLUDED_VARIABLES)add(name,'{{getvar::'+name+'}}');
    return fragments.sort((a,b)=>b.text.length-a.text.length);
  }
  function filterExpertContext(messages,fragments,insertion=null){
    let anchorCount=0;const marker='\u0000MEEME_DIRECTOR_REQUIREMENTS\u0000';
    if(messages.some(m=>typeof m.content==='string'&&m.content.includes(marker)))throw Error('请求包含保留标记。');
    const removed=[];const result=plainMessages(messages).map(m=>{
      if(!['system','developer'].includes(m.role))return m;
      let content=m.content;
      for(const f of [...fragments].sort((a,b)=>Number(!!b.anchor)-Number(!!a.anchor)||b.text.length-a.text.length)){if(content.includes(f.text)){if(f.anchor&&insertion!==null){anchorCount+=content.split(f.text).length-1;content=content.split(f.text).join(marker);}else content=content.split(f.text).join('');removed.push(f.label);}}
      return {...m,content};
    }).filter(m=>m.content.trim());
    // If a known template occurs under a different role, fail rather than deleting user/history data.
    for(const m of result)if(m.role==='user'&&fragments.some(f=>f.text.length>80&&m.content.includes(f.text)))throw Error('格式模板出现在用户身份消息中，无法安全过滤；未发送副API。');
    if(insertion!==null){if(anchorCount!==1)throw Error('无法唯一定位预设【格式】条目，未发送副API；不会改为底部追加。');for(const m of result)m.content=m.content.replace(marker,()=>insertion);}
    return {messages:result,placement:insertion!==null?'预设【格式】原位置':null,removed:[...new Set(removed)],excludedVariables:[...EXCLUDED_VARIABLES]};
  }
  function expertMessages(messages){return [{role:'system',content:SYSTEM},...plainMessages(messages)];}
  // Resolve only read-only getvar expressions after Tavern has assembled the prompt.
  function contractFromPreset(preset,resolve){
    if(preset.settings?.enable_web_search||preset.settings?.enable_function_calling||preset.settings?.reply_count>1)throw Error('实验版请关闭搜索、函数调用和多候选同时生成。');
    const active=preset.prompts.filter(p=>p.enabled);
    if(!active.some(p=>p.id==='20f5f445-aba9-42aa-a1f4-927e28384f84'))throw Error('请启用咩咩预设的“思维链-故事模式”。');
    const format=active.find(p=>p.id==='72ffe882-e589-4382-933e-fd6c30fc77ec');if(!format)throw Error('未找到咩咩预设的格式模块。');
    const selected=['54fdfb2e-6982-4c1c-8ae7-27cda229f641','eeb2fe7b-8902-4678-ac58-1bcb91cdbfa9','72ffe882-e589-4382-933e-fd6c30fc77ec','2dbedec0-437d-4e62-836c-8fb94237747c'];
    const read=s=>{if(/\{\{\s*(?:setvar|addvar|setglobalvar|addglobalvar|roll|random)\b/i.test(s))throw Error('输出模块含有写入或随机宏，无法安全重复展开。');const v=resolve(s);if(typeof v!=='string'||/\{\{/.test(v))throw Error('输出规则有未展开的宏，请检查当前预设。');return v;};
    const rules=['<writing_guidelines>\n'+read('{{getvar::wenfeng}}\n{{getvar::writing}}\n{{getvar::rencheng}}\n正文字数要求：{{getvar::zishu}}')+'\n</writing_guidelines>',read('{{getvar::combat_driver}}')];
    for(const p of active)if(selected.includes(p.id)||/^🪄/.test(p.name||''))rules.push(read(p.content||''));
    const out=rules.join('\n\n');if(!out.includes('<story_scene>')||!out.includes('<story_driver>'))throw Error('缺少story_scene/story_driver输出格式，停止实验请求。');return out;
  }
  return {SYSTEM,plainMessages,validateReport,extractScene,DEFAULT_WRITER,writerContent,writerPrompt,writerMessages,expertMessages,planningSources,planningFromPreset,contractFromPreset,expertFilterFromPreset,filterExpertContext,EXCLUDED_VARIABLES,defaultRequirements,upgradeRequirements,importRequirements,requirementText,promptVariables};
})();
