import {DIRECTOR_PRODUCT} from '../../product-identity.js';
import {mountRequestProgress} from './request-progress.js';

// Presentation only: relocate the already-bound controls, never clone their
// handlers, rewrite config, call a provider or rebuild business state.
export function mountOfficialDirectorPresentation({panel:window,host,resources,icon,styles}) {
  const panel=window.querySelector('.sp-panel');
  const doc=panel.ownerDocument, root=window.closest('#meeme-story-director');
  root.dataset.miemieDirectorUi='official';
  for(const old of root.querySelectorAll('style'))old.remove();
  const theme=doc.createElement('style');theme.dataset.directorTheme='official';theme.textContent=styles;root.prepend(theme);
  const q=name=>panel.querySelector(`[data-sp-${name}]`);
  const make=(tag,className,text)=>{const node=doc.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
  const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const icons={add:svg('<path d="M12 5v14M5 12h14"/>'),import:svg('<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>'),export:svg('<path d="M12 15V3m-4 4 4-4 4 4M4 16v4h16v-4"/>'),
    edit:svg('<path d="m14 5 5 5M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15l-1 5z"/>'),more:svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
    delete:svg('<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>'),close:svg('<path d="m6 6 12 12M18 6 6 18"/>')};
  function iconButton(button,key,label,withText=false) {
    button.classList.add('md-icon-button');button.title=label;button.setAttribute('aria-label',label);
    button.innerHTML=icons[key]+(withText?`<span>${label}</span>`:'');
  }
  const heading=root.querySelector('.director-heading');
  const image=heading.querySelector('img');image.src=icon;image.alt=DIRECTOR_PRODUCT.name;image.dataset.toolIcon='story-director';
  heading.querySelector('strong').textContent=`${DIRECTOR_PRODUCT.name} ${DIRECTOR_PRODUCT.version}`;
  function paintCharacter() {
    const c=host.SillyTavern.getContext(),character=!c.groupId&&c.characters?.[c.characterId];
    const subtitle=heading.querySelector('small');
    const text=character?`当前角色：${character.name||c.characterId}`:'请打开单人角色聊天';
    if(subtitle.textContent!==text)subtitle.textContent=text;
  }
  paintCharacter();
  const returnButton=root.querySelector('[data-director-close]');
  returnButton.textContent='返回';returnButton.title='返回';returnButton.setAttribute('aria-label','返回');
  const controls=make('div','md-director-controls');
  controls.append(q('toggle'));panel.prepend(controls);
  const oldCancelRow=panel.querySelector(':scope > .sp-row');
  const footer=make('footer','md-director-footer'),runtimeStatus=make('div','md-runtime-status');runtimeStatus.append(q('status'),q('cancel'));footer.append(runtimeStatus,returnButton);panel.append(footer);
  const progress=mountRequestProgress({doc,resources,panelAnchor:runtimeStatus,label:DIRECTOR_PRODUCT.name,
    palette:{bg:'#0b1b30',border:'#254767',text:'#d4e9ff',accent:'#81bcff',offset:'46px'}});
  if(oldCancelRow&&!oldCancelRow.children.length)oldCancelRow.remove();
  q('status').setAttribute('aria-live','polite');q('api-status').setAttribute('aria-live','polite');
  function state() {
    const busy=!q('cancel').hidden, enabled=q('toggle').dataset.on==='true';
    const value=busy?'planning':enabled?'enabled':'disabled';controls.dataset.state=value;
    controls.setAttribute('aria-busy',String(busy));
    q('toggle').setAttribute('aria-pressed',String(enabled));
  }
  const sidebar=panel.querySelector('.sp-sidebar');sidebar.setAttribute('aria-orientation','vertical');
  // The original Debug controls and data renderer move into an ordinary page.
  // Retain only an inert legacy dialog shell for the frozen cleanup callback;
  // there is no launch control and no way to open a Debug modal in this UI.
  const debugDialog=q('dialog'),debugPage=make('section','md-debug-page');
  debugPage.setAttribute('data-sp-page-debug','');debugPage.setAttribute('role','tabpanel');debugPage.setAttribute('aria-label','导演调试');debugPage.hidden=true;
  debugPage.append(make('h3','sp-page-heading','导演调试'));
  debugPage.append(make('p','md-debug-privacy','隐私提醒：Debug 可能包含完整聊天上下文、角色资料及其他私人内容。分享或截图前请检查并删除敏感信息。'));
  const note=debugDialog.querySelector(':scope > p');note.classList.add('md-caption');debugPage.append(note,debugDialog.querySelector('.sp-row'),q('debug'));
  debugDialog.hidden=true;debugDialog.setAttribute('aria-hidden','true');q('open-debug').remove();
  panel.querySelector('.sp-tab-content').append(debugPage);
  q('debug').tabIndex=0;q('debug').setAttribute('aria-label','检测日志');
  const debugTab=make('button','');debugTab.type='button';debugTab.setAttribute('data-sp-tab-debug','');debugTab.setAttribute('role','tab');debugTab.setAttribute('aria-selected','false');debugTab.tabIndex=-1;debugTab.title='导演调试';debugTab.setAttribute('aria-label','导演调试');
  debugTab.innerHTML=svg('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 8 3 3-3 3M13 16h3"/>');sidebar.append(debugTab);
  const tabKeys=['expert','writer','api','debug'];
  const originalSelect=Object.fromEntries(tabKeys.slice(0,3).map(name=>[name,q('tab-'+name).onclick]));
  let selectedPage='expert';
  function selectPage(name,focus=false) {
    if(!tabKeys.includes(name))return;
    // Original navigation closes editors/menus and keeps its existing refresh.
    originalSelect[name==='debug'?(selectedPage==='debug'?'api':selectedPage):name]();
    selectedPage=name;
    for(const key of tabKeys){const tab=q('tab-'+key);tab.setAttribute('aria-selected',String(key===name));tab.tabIndex=key===name?0:-1;q('page-'+key).hidden=key!==name;}
    panel.querySelector('.sp-tab-content').dataset.page=name;
    if(name==='debug')q('debug-page').onchange();
    if(focus)q('tab-'+name).focus({preventScroll:true});
  }
  for(const [index,name] of tabKeys.entries()) {
    const tab=q('tab-'+name),page=q('page-'+name);tab.id='md-tab-'+name;page.id='md-page-'+name;
    tab.setAttribute('aria-controls',page.id);page.setAttribute('aria-labelledby',tab.id);page.tabIndex=0;
    tab.onclick=resources.guard(()=>selectPage(name));
    tab.onkeydown=resources.guard(e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowUp'?-1:1)+4)%4;selectPage(tabKeys[next],true);});
  }
  // One shared library card presentation for all three independent libraries.
  for(const kind of ['planning','requirement','writer']) {
    for(const action of ['add','import','export']) {
      const label=action==='add'?'新建':action==='import'?'导入':'导出全部';
      const button=q(kind+'-'+action),accessible=button.getAttribute('aria-label');
      iconButton(button,action,label,action!=='add');if(accessible)button.setAttribute('aria-label',accessible);
    }
  }
  const readonly=panel.querySelector('[data-sp-rules-preview]').closest('.sp-library-box');readonly.classList.add('md-preset-library');
  readonly.querySelector('header').append(make('small','md-readonly','只读 · 来自当前预设'));
  // Move native labelled fields into visual groups. Values, controls and handlers
  // (including password and opt-in key policy) remain the same objects.
  const apiPage=q('page-api');
  const group=(title,subtitle)=>{const box=make('section','md-api-group'),h=make('h4','',title);box.append(h);if(subtitle)box.append(make('p','md-caption',subtitle));apiPage.append(box);return box;};
  const connection=group('连接','接口地址与密钥');connection.append(q('base').closest('label'),q('key').closest('label'),panel.querySelector('.sp-key-row'));
  const risk=panel.querySelector('.sp-model-row small');risk.classList.add('md-key-policy');connection.append(risk);
  const model=group('模型');model.append(q('models'),q('model-list').closest('label'),q('model').closest('label'));
  const generation=group('生成参数');generation.append(q('tokens').closest('.sp-row'));
  const actions=make('div','md-api-actions');actions.append(q('save'),q('test'));apiPage.append(actions,q('api-status'));
  for(const empty of apiPage.querySelectorAll('.sp-model-row,.sp-row'))if(!empty.children.length)empty.remove();
  const editorLayer=make('div','md-editor-layer');editorLayer.hidden=true;panel.append(editorLayer);
  for(const kind of ['planning','requirement','writer']) {
    const dialog=q(kind+'-editor'),title=dialog.querySelector('strong');
    dialog.classList.add('md-dialog','md-editor');dialog.setAttribute('aria-modal','true');
    const header=make('header','md-editor-head');title.tabIndex=-1;header.append(title);dialog.prepend(header);
    editorLayer.append(dialog);
    q(kind+'-name').setAttribute('aria-label','名称');
    const content=q(kind+'-content');content.setAttribute('aria-label','内容');content.closest('label').classList.add('md-editor-content');
  }
  const template=q('planning-template'),templateTitle=q('planning-template-heading');
  template.classList.add('md-dialog','md-template');template.setAttribute('aria-modal','true');
  const templateHead=make('header','md-editor-head'),templateBody=make('div','sp-editor-body'),templateFooter=make('footer','sp-editor-footer');
  templateTitle.removeAttribute('autofocus');
  templateHead.append(templateTitle);
  templateBody.append(template.querySelector('p'),template.querySelector('.sp-template-options'));
  templateFooter.append(q('planning-template-close'));
  template.append(templateHead,templateBody,templateFooter);editorLayer.append(template);
  let activeEditor=null,covered=[];
  function openEditor(dialog,opener,entryId) {
    if(activeEditor?.dialog===dialog && activeEditor.entryId===entryId)return;
    if(activeEditor)closeEditor(activeEditor.dialog,false);
    activeEditor={dialog,opener,entryId};
    // Keep the host chrome and other windows outside the editor's inert scope.
    for(let node=editorLayer;node!==window;node=node.parentElement) {
      for(const sibling of node.parentElement.children) {
        if(sibling===node||sibling.inert||sibling.hasAttribute('inert'))continue;
        sibling.setAttribute('inert','');covered.push(sibling);
      }
    }
    editorLayer.hidden=false;dialog.open=true;
    dialog.querySelector('.sp-editor-body').scrollTop=0;
    dialog.querySelector('.md-editor-head strong').focus({preventScroll:true});
  }
  function closeEditor(dialog,restore=true) {
    if(activeEditor?.dialog!==dialog)return false;
    const {opener,entryId}=activeEditor;
    activeEditor=null;dialog.open=false;editorLayer.hidden=true;
    for(const node of covered)node.removeAttribute('inert');
    covered=[];
    if(restore&&!window.hidden&&!window.inert) {
      const pencil=entryId&&[...panel.querySelectorAll('.sp-requirement')].find(row=>row.dataset.entryId===entryId)?.children[2];
      (opener?.isConnected?opener:pencil)?.focus({preventScroll:true});
    }
    return true;
  }
  function dismissEditor(){return activeEditor?closeEditor(activeEditor.dialog):false;}
  resources.listen(editorLayer,'keydown',e=>{
    if(e.key!=='Tab'||e.defaultPrevented||!activeEditor)return;
    const dialog=activeEditor.dialog,controls=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)')];
    const edge=e.shiftKey?controls[0]:controls.at(-1);
    if(doc.activeElement!==edge&&doc.activeElement!==dialog.querySelector('.md-editor-head strong'))return;
    e.preventDefault();(e.shiftKey?controls.at(-1):controls[0])?.focus();
  });
  const editorObserver=new host.MutationObserver(()=>{
    if(activeEditor&&(window.hidden||window.inert))closeEditor(activeEditor.dialog,false);
  });
  editorObserver.observe(window,{attributes:true,attributeFilter:['hidden','inert']});
  resources.add(()=>{editorObserver.disconnect();if(activeEditor)closeEditor(activeEditor.dialog,false);});
  const done=new WeakSet();
  function enhance(node) {
    if(node.nodeType!==1||!panel.contains(node))return;
    const rows=node.matches('.sp-requirement')?[node]:node.querySelectorAll('.sp-requirement');
    for(const row of rows) {
      if(done.has(row))continue;done.add(row);
      const name=row.querySelector('.sp-requirement-name');name.title='拖动排序；也可用上下方向键';
      const buttons=[...row.querySelectorAll(':scope > button')];
      iconButton(buttons[1],'edit','编辑 '+name.textContent);iconButton(buttons[2],'more','更多操作 '+name.textContent);buttons[2].setAttribute('aria-haspopup','true');
    }
    const menus=node.matches('.sp-entry-menu')?[node]:node.querySelectorAll('.sp-entry-menu');
    for(const menu of menus) {
      const buttons=menu.querySelectorAll('button');if(buttons.length!==2||done.has(buttons[0]))continue;done.add(buttons[0]);
      const labels=[...buttons].map(b=>b.getAttribute('aria-label'));
      iconButton(buttons[0],'export','导出',true);iconButton(buttons[1],'delete','删除',true);
      buttons.forEach((button,index)=>button.setAttribute('aria-label',labels[index]));
    }
  }
  // Escape dismisses a menu or editor before reaching the host's window-close shortcut.
  resources.listen(doc,'keydown',e=>{
    if(e.key!=='Escape'||e.isComposing||e.keyCode===229)return;
    const menu=[...panel.querySelectorAll('.sp-entry-menu')].find(m=>m.matches(':popover-open'));
    if(menu){e.preventDefault();e.stopImmediatePropagation();menu.close();}
    else if(activeEditor&&!window.hidden&&!window.inert&&(window.contains(e.target)||e.target===doc)){
      e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)dismissEditor();
    }
  },true);
  // Chromium hands a mouse pointer over to HTML drag-and-drop by emitting
  // pointercancel (sometimes on the destination name). Do not let the touch
  // drag's cancellation handler discard an already-active HTML drag. Genuine
  // touch/pen cancellation and the unchanged drop/reorder handlers still run.
  resources.listen(doc,'pointercancel',e=>{
    if(e.pointerType!=='mouse')return;
    const name=e.target.closest?.('.sp-requirement-name');
    if(name&&panel.contains(name)&&name.parentElement.parentElement.querySelector('[data-dragging=true]'))e.stopImmediatePropagation();
  },true);
  enhance(panel);state();paintCharacter();
  const observer=new host.MutationObserver(records=>{
    state();paintCharacter();
    for(const record of records){
      if(record.target.matches?.('.sp-entry-menu'))enhance(record.target);
      for(const node of record.addedNodes)enhance(node);
    }
  });
  observer.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['data-on','hidden'],characterData:true});
  resources.add(()=>observer.disconnect());
  // Keep controls that pass behind the persistent right-docked native orb
  // reachable on narrow screens. Only card padding changes: docking, launcher
  // position, panel geometry, motion and Host ownership stay untouched.
  let orbObserver=null,observedOrb=null,frame=null,scheduled=false,disposed=false;
  const clearance=new Map();
  function clearOrbOverlap() {
    const orb=doc.querySelector('[data-miemie-director-native]');
    if(orb!==observedOrb){
      orbObserver?.disconnect();observedOrb=orb;
      if(orb){orbObserver=new host.MutationObserver(scheduleOrbOverlap);orbObserver.observe(orb,{attributes:true,attributeFilter:['style']});}
    }
    const next=new Map(),o=!window.hidden&&orb?.getBoundingClientRect();
    if(o&&o.left>(host.innerWidth||doc.documentElement.clientWidth)/2){
      for(const node of panel.querySelectorAll('.sp-library-tools,.sp-requirement')) {
        const r=node.getBoundingClientRect();
        if(r.width&&r.top<o.bottom&&r.bottom>o.top&&r.right>o.left&&r.left<o.right)next.set(node,Math.min(80,r.right-o.left+4)+'px');
      }
    }
    for(const node of clearance.keys())if(!next.has(node)){node.style.removeProperty('--md-orb-clearance');clearance.delete(node);}
    for(const [node,space] of next)if(clearance.get(node)!==space){node.style.setProperty('--md-orb-clearance',space);clearance.set(node,space);}
  }
  function scheduleOrbOverlap(){
    if(disposed||scheduled)return;
    scheduled=true;
    const update=()=>{scheduled=false;frame=null;if(!disposed)clearOrbOverlap();};
    if(host.requestAnimationFrame)frame=host.requestAnimationFrame(update);else queueMicrotask(update);
  }
  const surfaceObserver=new host.MutationObserver(scheduleOrbOverlap);surfaceObserver.observe(doc.documentElement,{childList:true});
  resources.listen(panel,'scroll',scheduleOrbOverlap,true);resources.listen(host,'resize',scheduleOrbOverlap);
  const windowObserver=new host.MutationObserver(scheduleOrbOverlap);windowObserver.observe(window,{attributes:true,attributeFilter:['hidden','style']});
  const overlapObserver=new host.MutationObserver(scheduleOrbOverlap);overlapObserver.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  function dispose(){
    if(disposed)return;
    disposed=true;if(frame!==null)host.cancelAnimationFrame(frame);clearance.clear();
    observer.disconnect();surfaceObserver.disconnect();windowObserver.disconnect();orbObserver?.disconnect();overlapObserver.disconnect();
  }
  resources.add(dispose);
  scheduleOrbOverlap();
  const viewport=host.visualViewport;
  const fit=()=>root.style.setProperty('--md-viewport-height',viewport.height+'px');
  if(viewport){resources.listen(viewport,'resize',fit);fit();}
  return {capturePage:()=>selectedPage,restorePage:(name,debugSelection)=>{if(debugSelection)q('debug-page').value=debugSelection;selectPage(name);},refreshHeader:paintCharacter,
    openEditor,closeEditor,dismissEditor,
    updateProgress(state,text){if(state)progress.show(state,text);else progress.clear();},
    dispose};
}
