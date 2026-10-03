import {clone, capture, coreFor, createHarness, observe} from './baseline.mjs';

const DRIVER = '20f5f445-aba9-42aa-a1f4-927e28384f84';
const FORMAT = '72ffe882-e589-4382-933e-fd6c30fc77ec';
const player = '*固定玩家输入：推开门，等待回应*';
const report = '标签外判定\n<story_scene>\n老师邀请玩家进教室；停在自我介绍之前。\n</story_scene>\n标签外备注';
const entry = (id, content, enabled = true) => ({id, name: id, content, enabled});

function preset() {
  return {prompts: [
    {id: 'discard', name: '被覆盖规则', enabled: true, content: '{{addvar::story_think_ini::不应保留}}'},
    {id: 'reset', name: '初始化', enabled: true, content: '{{setvar::story_think_ini::[初始化]: 固定规则}}'},
    {id: 'anchor', name: '任意名称的锚定', enabled: true, content: '{{addvar::story_think_ini::[时空]: {{getvar::time}}}}'},
    {id: 'off', name: '未启用', enabled: false, content: '{{addvar::story_think_ini::关闭规则}}'},
    {id: 'combat', name: '战斗规划', enabled: true, content: '{{addvar::story_combat_think::[战斗]: 不发生战斗}}'},
    {id: DRIVER, name: '故事模式', enabled: true, content: '<story_driver_format>{{getvar::story_think_ini}}\n{{getvar::story_combat_think}}\n{{getvar::zishu}}\n{{getvar::user_gender}}\n{{getvar::language_think}}</story_driver_format>'},
    {id: FORMAT, name: '格式', role: 'system', enabled: true, content: 'FORMAT_START\n<story_driver>摘要</story_driver>\n<story_scene>正文</story_scene>\n{{getvar::status_format}}\nFORMAT_END'},
    {id: '2dbedec0-437d-4e62-836c-8fb94237747c', name: '单语言', enabled: true, content: '正式正文采用日文'},
  ]};
}
const values = {
  story_think_ini: '[初始化]: 已展开\n[时空]: 固定时间线',
  story_combat_think: '[战斗]: 不发生战斗',
  zishu: '1500', user_gender: '固定称呼', language_think: '语言规则',
  language: 'BILINGUAL_FORMAT', status_format: 'STATUS_FORMAT', option: 'OPTIONS_FORMAT',
};
const resolve = text => text.replace(/\{\{getvar::([^{}]+)\}\}/g, (_, name) => values[name] ?? '')
  .replace(/\{\{user\}\}/g, '测试玩家').replace(/\{\{char\}\}/g, '测试角色');

function messages(p) {
  return [
    {role: 'system', name: 'preset', content: 'WORLD_FACT\n' + resolve(p.prompts.find(x => x.id === DRIVER).content) +
      '\n' + resolve(p.prompts.find(x => x.id === FORMAT).content) + '\nBILINGUAL_FORMAT\nOPTIONS_FORMAT'},
    {role: 'assistant', content: '<status>历史状态</status> BILINGUAL_FORMAT'},
    {role: 'user', content: player},
    {role: 'system', name: 'tail', content: 'BOTTOM_CHAIN'},
  ];
}

export const coreScenarios = [
  ['planning / reset, disabled sources and nested provenance', C => C.planningFromPreset(preset(), resolve)],
  ['planning / dynamically referenced variable', C => {
    const p = preset();p.prompts.splice(5, 0, {id: 'extra', name: '额外规划', enabled: true, content: '{{addvar::extra_plan::新增规划}}'});
    p.prompts.find(x => x.id === DRIVER).content += '{{getvar::extra_plan}}';
    return C.planningFromPreset(p, text => text === '{{getvar::extra_plan}}' ? '已展开额外规划' : resolve(text));
  }],
  ['planning / missing story mode', C => {const p = preset();p.prompts = p.prompts.filter(x => x.id !== DRIVER);return C.planningSources(p);}],
  ['planning / missing ini reference', C => {const p = preset();p.prompts.find(x => x.id === DRIVER).content = '{{getvar::zishu}}';return C.planningSources(p);}],
  ['planning / late writer', C => {const p = preset();p.prompts.push({id: 'late', name: '晚写入', enabled: true, content: '{{addvar::story_think_ini::晚写入}}'});return C.planningSources(p);}],
  ['planning / unclosed macro', C => {const p = preset();p.prompts[1].content = '{{setvar::story_think_ini::未闭合';return C.planningSources(p);}],
  ['planning / unresolved value', C => C.planningFromPreset(preset(), text => text)],
  ['planning / empty value with source', C => C.planningFromPreset(preset(), () => '')],
  ['prompt / ordered enabled libraries and read-only names', C => C.requirementText([
    entry('highest-a', '<user> {{getvar::user_gender}}'), entry('highest-off', 'DISABLED', false), entry('highest-b', '<char>'),
  ], C.planningFromPreset(preset(), resolve), [entry('plan-a', '[DIY]: 固定规划'), entry('plan-off', 'OFF', false)], resolve)],
  ['prompt / writer wrapper and empty getvar', C => C.writerPrompt([
    entry('writer-a', '<story_driver_format><story_driver>扩写 {{user}}</story_driver></story_driver_format>'),
    entry('writer-off', '关闭', false), entry('writer-b', '字数 {{getvar::zishu}} / {{getvar::empty}}'),
  ], resolve)],
  ['prompt / empty writer library', C => C.writerPrompt([], resolve)],
  ['prompt / forbidden mutation', C => C.promptVariables('{{getvar::x}}{{setvar::x::y}}', resolve)],
  ['prompt / unresolved identity', C => C.promptVariables('<user>', () => '')],
  ['filter / preset fragments', C => C.expertFilterFromPreset(preset(), resolve)],
  ['filter / planning insertion preserves history and tail', C => {
    const p = preset(), planning = C.planningFromPreset(p, resolve);
    const prompt = C.requirementText([entry('highest', '最高要求')], planning, [entry('diy', '玩家规划')], resolve);
    const filtered = C.filterExpertContext(messages(p), C.expertFilterFromPreset(p, resolve), prompt);
    return {filtered, expert: C.expertMessages(filtered.messages)};
  }],
  ['filter / missing anchor', C => {
    const p = preset();return C.filterExpertContext([{role: 'system', content: 'WORLD_FACT'}], C.expertFilterFromPreset(p, resolve), 'INSERT');
  }],
  ['filter / duplicate anchor', C => {
    const p = preset(), m = messages(p);m[0].content += '\n' + resolve(p.prompts.find(x => x.id === FORMAT).content);
    return C.filterExpertContext(m, C.expertFilterFromPreset(p, resolve), 'INSERT');
  }],
  ['filter / reserved marker', C => C.filterExpertContext([{role: 'system', content: '\u0000MEEME_DIRECTOR_REQUIREMENTS\u0000'}], [], 'INSERT')],
  ['filter / long template in user role', C => C.filterExpertContext([{role: 'user', content: 'x'.repeat(81)}], [{label: 'format', text: 'x'.repeat(81)}])],
  ['scene / preserved interior', C => C.extractScene(report)],
  ['scene / no tag', C => C.extractScene('无标签')],
  ['scene / multiple pairs', C => C.extractScene('<story_scene>A</story_scene><story_scene>B</story_scene>')],
  ['scene / nested tags', C => C.extractScene('<story_scene><story_scene>A</story_scene></story_scene>')],
  ['scene / empty', C => C.extractScene('<story_scene> \n </story_scene>')],
  ['scene / attributes', C => C.extractScene('<story_scene id="a">A</story_scene>')],
  ['scene / unclosed', C => C.extractScene('<story_scene>A')],
  ['writer / same positions, roles, metadata and untouched source', C => {
    const p = preset(), original = messages(p), before = clone(original);
    const driver = C.expertFilterFromPreset(p, resolve).find(x => x.sourceId === DRIVER).text;
    return {handoff: C.writerMessages(original, report, driver, C.writerPrompt([entry('w', '扩写大纲 {{user}}')], resolve), player), original, before};
  }],
  ['writer / duplicated player input', C => {
    const p = preset(), m = messages(p);m.push({role: 'user', content: player});
    return C.writerMessages(m, report, resolve(p.prompts.find(x => x.id === DRIVER).content), C.DEFAULT_WRITER, player);
  }],
  ['writer / missing driver location', C => C.writerMessages(messages(preset()), report, 'MISSING', C.DEFAULT_WRITER, player)],
  ['contract / original output and language validations', C => C.contractFromPreset(preset(), resolve)],
  ['contract / search rejected', C => {const p = preset();p.settings = {enable_web_search: true};return C.contractFromPreset(p, resolve);}],
  ['messages / text parts', C => C.plainMessages([{role: 'assistant', name: 'npc', content: [{type: 'text', text: 'A'}, {type: 'text', text: 'B'}]}])],
  ['messages / media rejected', C => C.plainMessages([{role: 'user', content: [{type: 'image_url', image_url: {url: 'fixture'}}]}])],
  ['messages / tool history rejected', C => C.plainMessages([{role: 'tool', content: 'fixture'}])],
  ['library / import export shape', C => C.importRequirements({type: 'meeme-director-requirements', version: 1, library: 'planning', entries: [entry('ignored', '自定义'), entry('off', '', false)]})],
  ['library / invalid import', C => C.importRequirements({type: 'meeme-director-requirements', version: 1, entries: [{name: 'broken'}]})],
  ['library / deleted defaults remain deleted', C => C.upgradeRequirements([])],
  ['library / modified default preserved', C => C.upgradeRequirements([entry('director-format', '我的格式', false)])],
];

const reply = (content = report, extra = {}) => ({ok: true, status: 200,
  text: async () => JSON.stringify({choices: [{message: {content}, finish_reason: 'stop', ...extra}], usage: {prompt_tokens: 12, completion_tokens: 8, total_tokens: 20}})});

async function dispatch(h, type = 'normal', options = {}) {
  h.enable();h.setReply(async () => reply());
  return capture(() => h.dispatch(h.mark(undefined, type), options).then(response => ({ok: response.ok, status: response.status, body: response.body})));
}

export const runtimeScenarios = [
  ['route / director disabled', async h => capture(() => h.dispatch(h.payload()).then(r => r.body))],
  ...['normal', 'swipe', 'regenerate', 'continue', 'quiet', 'impersonate'].map(type => ['route / ' + type, h => dispatch(h, type)]),
  ['route / missing request mark', async h => {h.enable();return capture(() => h.dispatch(h.payload()));}],
  ['route / unsupported main API', async h => {h.context.mainApi = 'textgenerationwebui';h.enable();return capture(() => h.dispatch(h.mark()).then(r => r.body));}],
  ['handoff / metadata and tail', async h => {
    h.enable();h.setReply(async () => reply());const p = h.payload();p.messages[0].name = 'preset';p.messages.push({role: 'developer', name: 'tail', content: 'END_TAIL'});
    return capture(() => h.dispatch(h.mark(p)).then(r => r.body));
  }],
  ['snapshot / prompt edits apply next turn', async h => {
    h.enable();h.setReply(async () => reply());const p = h.mark();h.el('planning-add').onclick();h.el('planning-custom').onclick();
    h.el('planning-content').value = 'NEXT_TURN_ONLY';h.el('planning-content').oninput();await h.dispatch(p);
    h.events.GENERATION_ENDED();await h.dispatch(h.mark());return {ok: true};
  }],
  ['scene / no tag blocks main', async h => {h.enable();h.setReply(async () => reply('无标签'));return capture(() => h.dispatch(h.mark()));}],
  ['scene / duplicate blocks main', async h => {h.enable();h.setReply(async () => reply('<story_scene>A</story_scene><story_scene>B</story_scene>'));return capture(() => h.dispatch(h.mark()));}],
  ['scene / empty blocks main', async h => {h.enable();h.setReply(async () => reply('<story_scene> </story_scene>'));return capture(() => h.dispatch(h.mark()));}],
  ['response / malformed protocol JSON', async h => {h.enable();h.setReply(async () => ({ok: true, status: 200, text: async () => 'not JSON'}));return capture(() => h.dispatch(h.mark()));}],
  ['response / HTTP failure', async h => {h.enable();h.setReply(async () => ({ok: false, status: 401, text: async () => 'fixture unauthorized'}));return capture(() => h.dispatch(h.mark()));}],
  ['response / truncated', async h => {h.enable();h.setReply(async () => reply(report, {finish_reason: 'length'}));return capture(() => h.dispatch(h.mark()));}],
  ['response / reasoning only', async h => {h.enable();h.setReply(async () => reply(null, {message: {reasoning_content: 'fixture'}}));return capture(() => h.dispatch(h.mark()));}],
  ['request / tools rejected', async h => {h.enable();const p = h.payload();p.tools = [{type: 'function'}];return capture(() => h.dispatch(h.mark(p)));}],
  ['request / multiple candidates rejected', async h => {h.enable();const p = h.payload();p.n = 2;return capture(() => h.dispatch(h.mark(p)));}],
  ['request / missing format anchor', async h => {h.enable();const p = h.payload();p.messages[0].content = '<story_driver>仍有标记</story_driver>';return capture(() => h.dispatch(h.mark(p)));}],
  ['lifecycle / timeout even if abort ignored', async h => {
    h.enable();h.setReply(() => new Promise(() => {}));const pending = capture(() => h.dispatch(h.mark()));[...h.timers.values()][0]();return pending;
  }],
  ['lifecycle / explicit cancel', async h => {
    h.enable();h.setReply(() => new Promise(() => {}));const pending = capture(() => h.dispatch(h.mark()));h.el('cancel').onclick();return pending;
  }],
  ['lifecycle / chat changed', async h => {
    h.enable();h.setReply(() => new Promise(() => {}));const pending = capture(() => h.dispatch(h.mark()));h.context.chatId = 'fixture-other';h.events.CHAT_CHANGED();return pending;
  }],
  ...['MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_SWIPED', 'MESSAGE_UPDATED'].map(event => ['lifecycle / pending ' + event, async h => {
    h.enable();h.setReply(() => new Promise(() => {}));const pending = capture(() => h.dispatch(h.mark()));h.context.chat[1].mes = 'changed fixture';h.events[event]();return pending;
  }]),
  ['lifecycle / preset changed while awaiting', async h => {
    h.enable();let resolveReply;h.setReply(() => new Promise(resolve => {resolveReply = resolve;}));
    const pending = capture(() => h.dispatch(h.mark()));h.el('rules-preview');
    // Change the context's current preset through the helper-owned synthetic fixture.
    const original = h.getPresetFixture();original.prompts[0].name += ' changed';
    resolveReply(reply());return pending;
  }],
  ['lifecycle / already aborted host signal', async h => {const controller = new AbortController();controller.abort();return dispatch(h, 'normal', {signal: controller.signal});}],
  ['lifecycle / cleanup during planning', async h => {
    h.enable();h.setReply(() => new Promise(() => {}));const pending = capture(() => h.dispatch(h.mark()));h.cleanup();return pending;
  }],
  ['api / model list', async h => {h.setReply(async () => ({ok: true, text: async () => JSON.stringify({data: [{id: 'b'}, {id: 'a'}, {id: 'b'}]})}));await h.el('models').onclick();return {models: h.el('model-list').children.map(x => ({value: x.value, text: x.textContent}))};}],
  ['api / connection test', async h => {h.setReply(async () => reply('OK'));await h.el('test').onclick();return {ok: true};}],
  ['api / invalid base and parameter range', async h => {h.el('base').value = 'https://fixture.example/v1?token=fixture';h.el('save').onclick();h.el('base').value = 'https://fixture.example/v1';h.el('tokens').value = '1';h.el('save').onclick();return {ok: true};}],
  ['deferred / response-header cancel listener is currently removed', async h => {
    const controller = new AbortController();await dispatch(h, 'normal', {signal: controller.signal});controller.abort();
    return {hostAborted: controller.signal.aborted, mainSignalAborted: h.nativeCalls[1].init.signal.aborted};
  }],
  ['deferred / message edit before dispatch currently proceeds', async h => {
    h.enable();h.setReply(async () => reply());const p = h.mark();h.context.chat[1].mes = 'edited after ready';h.events.MESSAGE_EDITED();
    await h.dispatch(p);return {mainSent: h.nativeCalls.length === 2};
  }],
  ['deferred / rewritten request body fails exact mark match', async h => {
    h.enable();const marked = h.mark();const rewritten = clone(marked);rewritten.messages[0].content += ' fixture upstream rewrite';
    return capture(() => h.dispatch(rewritten));
  }],
];

export async function runCoreScenario(implementation, name) {
  const scenario = coreScenarios.find(([key]) => key === name);
  return capture(() => scenario[1](coreFor(implementation)));
}

export async function runRuntimeScenario(implementation, name) {
  const scenario = runtimeScenarios.find(([key]) => key === name);
  const h = createHarness(implementation);
  try {const result = await scenario[1](h);return {result: clone(result), observation: observe(h)};}
  finally {h.cleanup();}
}
