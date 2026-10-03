import {mkdir,writeFile} from 'node:fs/promises';
import {composeDualMode} from './compose-dual-mode.mjs';
import {projectRoot} from './compose-source.mjs';
// Local Owner Review only. Actual production entry + a wholly synthetic host.
// No installer, package, real chat, provider key or network transport.
export async function writeOfficialUIPreview(outputDirectory='review/phase4/'){
 const code=await composeDualMode();
 const fixture=`
 const fixturePreset={prompts:[
  {id:'init',name:'初始化',enabled:true,content:'{{addvar::story_think_ini::[初始化]: 核对本回合输入。}}'},
  {id:'time',name:'时空锚定',enabled:true,content:'{{addvar::story_think_ini::[时空锚定]: 锁定当前时间与地点。}}'},
  {id:'info',name:'人物认知边界',enabled:true,content:'{{addvar::story_think_ini::[认知边界]: 区分已知事实与猜测。}}'},
  {id:'20f5f445-aba9-42aa-a1f4-927e28384f84',enabled:true,content:'<story_driver_format>{{getvar::story_think_ini}}</story_driver_format>'},
  {id:'72ffe882-e589-4382-933e-fd6c30fc77ec',enabled:true,content:'<story_driver>摘要</story_driver><story_scene>正文</story_scene><memory_log>归档</memory_log>'}
 ]};
 let fixtureSettings={plannings:[{id:'preview-p1',name:'本轮节奏与停点',content:'[本轮节奏]: 保留玩家回应空间。',enabled:true},{id:'preview-p2',name:'平行事件安排',content:'[平行事件]: 按当前时间安排。',enabled:false}]};
 const fixtureEvents=new Map();
 const getVariables=()=>structuredClone(fixtureSettings),replaceVariables=value=>{fixtureSettings=structuredClone(value);},getPreset=()=>structuredClone(fixturePreset),getLoadedPresetName=()=> '咩咩预设 · 本地演示';
 const eventOn=(name,fn)=>{let set=fixtureEvents.get(name);if(!set)fixtureEvents.set(name,set=new Set());set.add(fn);return {stop:()=>set.delete(fn)};};
 const fixtureEmit=(name,...args)=>{for(const f of fixtureEvents.get(name)||[])f(...args);};
 const fixtureContext={mainApi:'openai',characterId:0,groupId:null,chatId:'ui-review',name1:'演示玩家',characters:[{name:'演示角色'}],chat:[{is_user:true,mes:'我推开书房的门。'},{is_user:false,mes:'清晨的书房很安静。',swipe_id:0}],eventTypes:new Proxy({},{get:(_,k)=>k}),substituteParams:s=>s.replace(/\\{\\{.*?\\}\\}/g,'已展开规则'),stopGeneration(){fixtureEmit('GENERATION_STOPPED');}};
 window.SillyTavern={getContext:()=>fixtureContext};
 window.fetch=async(input,init)=>({ok:true,status:200,body:'synthetic-stream',text:async()=>JSON.stringify(String(input).endsWith('/models')?{data:[{id:'demo-director'},{id:'demo-writer'}]}:{choices:[{finish_reason:'stop',message:{content:'<story_scene>【本回合锚定】清晨，书房。\\n【人物行动】老师邀请演示玩家入内。\\n【停点】停在玩家回应之前。</story_scene>'}}],usage:{prompt_tokens:1200,completion_tokens:150,total_tokens:1350}})});
 window.reviewRound=async()=>{
  const root=document.querySelector('#meeme-story-director'),q=n=>root.querySelector('[data-sp-'+n+']');
  if(q('toggle').dataset.on!=='true'){q('base').value='https://demo.invalid/v1';q('model').value='demo-director';q('toggle').click();}
  const body={model:'demo-writer',stream:true,messages:[{role:'system',content:'<story_driver_format>已展开规则</story_driver_format><story_driver>规划</story_driver>\\n'+fixturePreset.prompts.at(-1).content+'\\n底部写作规则'},{role:'user',content:fixtureContext.chat[0].mes}]};
  fixtureEmit('GENERATION_STARTED','normal',{},false);fixtureEmit('CHAT_COMPLETION_SETTINGS_READY',body);
  await window.fetch('/api/backends/chat-completions/generate',{method:'POST',body:JSON.stringify(body)});fixtureEmit('GENERATION_ENDED');
 };
 `;
 const html=`<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>咩咩故事导演 · Phase 4 外观检查</title><style>
 body{margin:0;min-height:100vh;color:#91a9c9;background:radial-gradient(ellipse at 50% 0,#102944,#040b17 60%);font:14px/1.6 system-ui}.review-note{max-width:360px;padding:24px}.review-note strong{color:#e3efff}.review-note p{font-size:12px}.review-note button{font:inherit;margin:12px 8px 0 0;border:1px solid #245996;border-radius:10px;background:#0c203e;color:#e3efff;padding:10px;cursor:pointer}@media(max-width:700px){.review-note{padding:14px;font-size:12px}}
 </style><body><aside class="review-note"><strong>Phase 4 · 本地外观检查</strong><p>此页面运行实际正式 UI，并使用虚构预设与模拟接口。所有请求在页面内完成，不连接服务商。</p><button onclick="window.__meemeStoryPlanner.open()">打开导演</button><button onclick="reviewRound()">模拟一轮</button></aside><script>${fixture}\n${code.replace(/<\/script/gi,'<\\/script')}\nwindow.__MieMieDirectorSource.ready.then(()=>window.__meemeStoryPlanner.open());</script></body></html>`;
 await mkdir(new URL(outputDirectory,projectRoot),{recursive:true});
 const target=new URL(outputDirectory+'official-ui.html',projectRoot);await writeFile(target,html);return target;
}
if(process.argv[1]===new URL(import.meta.url).pathname)console.log((await writeOfficialUIPreview()).pathname);
