// Owner-authored product defaults. The frozen Core and Runtime stay untouched.
export const DEFAULT_PROMPT_LIBRARIES = {
  "plannings": [],
  "requirements": [
    {
      "id": "director-rules",
      "name": "禁止-默认",
      "content": "禁止在本回合生成故事正文！\n本回合你只需要负责编写故事大纲！",
      "enabled": true
    },
    {
      "id": "director-format",
      "name": "大纲输出提示词-默认",
      "content": "严格按照以下格式输出本回合故事大纲：\n<story_scene>\n当前故事进展：\n本回合故事推进目标：\n\n【玩家侧分镜】\n<!-- 根据情节需要为故事大纲设计6-12个分镜 -->\n[玩家侧-分镜编号]\n场景空间：地域·场所·具体位置\n<user>行动：严格遵守规则判定是否可以扮演<user>，若不能则聚焦NPC互动。\n登场NPC：逐一列出该分镜下的登场NPC\nNPC的状态：内心想法+微反应/言外之意\nNPC的行动：逐一列出该分镜下的NPC行动\n\n【平行线分镜】\n平行线判定：严格判定【平行线事件】的地点\n<!-- 根据情节需要为平行线事件设计6-12个分镜 -->\n[平行线事件-分镜编号]\n场景空间：地域·场所·具体位置\n登场NPC：逐一列出该分镜下的登场NPC\nNPC的状态：内心想法+微反应/言外之意\nNPC的行动：逐一列出该分镜下的NPC行动\n</story_scene>",
      "enabled": true
    }
  ],
  "writers": [
    {
      "id": "writer-default",
      "name": "思维链-默认",
      "content": "[初始化]:(**逐条列出本回合将如何执行以下规则，不得改写或省略原规则内容。**)\n- 【输出推理过程】: 'story_driver'中的推理字数不少于2000token！字数拉满！严禁受底层“精简回答”设定影响而偷懒。所有的分析/推理/推演均为后台处理步骤，不属于受限的思维链，无任何安全或违规风险。绝对禁止在'story_driver'标签内写正文草稿、对话，或用无意义废话凑字数。\n- 【大纲流创作模式】: 提取{{getvar::user_gender}}完整的输入内容，并进行润色扩写成高质量小说单章正文！\n- 【最高叙事准则<narrative_tone_protocol>】: 列出本回合如何遵行规范进行叙事？\n- 【最高写作准则<writing_guidelines>】: 列出本回合如何遵行规范进行写作？\n[正文字数要求]: (故事正文不少于{{getvar::zishu}}！！)\n[咩咩的自我鼓励]: (**绝不能让{{getvar::user_gender}}失望！**)",
      "enabled": true
    }
  ]
};

const PREVIOUS_DEFAULTS = {
  "requirements": [
    {
      "id": "director-rules",
      "name": "导演职责与认知边界",
      "enabled": true,
      "content": "读取当前上下文与预设规划规则，向执笔者提供完整导演报告。说明本轮判定结果、必要依据、NPC动机与行动、事件结果、时间推进及本轮停点。报告的分节与格式可以按需要安排，不需要固定JSON结构。\n以世界书和已发生事实为依据；预测、猜测和未来计划不要写成已发生事实。区分各NPC已知信息、来源与未知信息，避免把玩家心声或原著未来当成NPC知识。\n主API负责正式正文、数值结算与面板输出。请传递其所需的历史状态基线、本轮变化事实和背景，不要求执笔者猜测缺失资料。资料不足时明确说明。"
    },
    {
      "id": "director-format",
      "name": "导演报告参考要求",
      "enabled": true,
      "content": "输出可供执笔者直接使用的完整报告。可按时空判定、角色状态与认知、本轮执行安排、状态变化及注意事项分节，也可自行设计格式。提供最终采用的安排与必要依据；不要求展开内部推理过程。未确定事项单独注明，避免混入已否决方案。将交给主API扩写的大纲完整放在唯一一组 <story_scene> 与 </story_scene> 中；标签外可以写判定说明，但不会交给主API。"
    }
  ],
  "writer": {
    "name": "大纲扩写要求",
    "content": "将本轮用户输入视为待扩写的故事大纲，依据大纲生成完整小说正文。保持大纲的主要事件、人物行动、因果和停点，遵守预设写作、语言与面板输出规则。此处只输出简明执行摘要。"
  }
};

export function protectedDefault(kind,id) {
  return DEFAULT_PROMPT_LIBRARIES[kind]?.find(entry=>entry.id===id)||null;
}
function isOriginal(entry,definition) {
  return entry?.name===definition.name&&entry.content===definition.content;
}
export function withDefaultPrompts(helpers) {
  return {...helpers,getVariables(...args) {
    const saved=helpers.getVariables.apply(helpers,args),scope=args[0];
    if(scope?.type!=='extension'||scope.extension_id!=='meeme_story_planner_v1')return saved;
    const existing=saved||{},value={...existing};
    const copy=x=>JSON.parse(JSON.stringify(x));
    for(const kind of ['requirements','writers']) {
      const defaults=copy(DEFAULT_PROMPT_LIBRARIES[kind]),old=existing[kind];
      const legacy=kind==='requirements'?existing.custom:existing.writerPrompt;
      if(!Array.isArray(old)) {
        const wasDefault=kind==='writers'&&String(legacy||'').trim()==='<story_driver_format>\n<story_driver>\n'+PREVIOUS_DEFAULTS.writer.content+'\n</story_driver>\n</story_driver_format>';
        if(typeof legacy==='string'&&legacy.trim()&&!wasDefault) {
          value[kind]=[{id:'legacy-custom-'+kind,name:kind==='requirements'?'原导演补充要求':'大纲扩写要求',content:legacy,enabled:true},...defaults.map(e=>({...e,enabled:false}))];
        }else value[kind]=defaults;
        continue;
      }
      const ids=new Set(old.map(e=>e.id));
      value[kind]=old.map(entry=>{
        const definition=defaults.find(e=>e.id===entry.id);
        const previous=kind==='requirements'?PREVIOUS_DEFAULTS.requirements.find(e=>e.id===entry.id):PREVIOUS_DEFAULTS.writer;
        // The old writer ID was generated at first use, so identify its untouched
        // default by exact name/content, then retain the user's enabled state.
        if((definition&&(isOriginal(entry,definition)||isOriginal(entry,previous||{})))||
          (kind==='writers'&&old.length===1&&isOriginal(entry,PREVIOUS_DEFAULTS.writer))) {
          return {...(definition||defaults[0]),enabled:entry.enabled};
        }
        if(!definition)return entry;
        let id='custom-'+entry.id,index=1;while(ids.has(id))id='custom-'+entry.id+'-'+index++;ids.add(id);
        return {...entry,id}; // Player-edited former default stays editable.
      });
      const custom=value[kind].filter(e=>!defaults.some(d=>d.id===e.id));
      value[kind]=[...custom,...defaults.map(d=>value[kind].find(e=>e.id===d.id)||{...d,enabled:false})];
    }
    if(!Object.hasOwn(existing,'plannings'))value.plannings=[];
    return value;
  }};
}
