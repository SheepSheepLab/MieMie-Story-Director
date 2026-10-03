  // Page UI state is separate from persisted activation. Selecting a row does not toggle it.
  const newId=()=>host.crypto?.randomUUID?.()||('req-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const migrated=!Array.isArray(config.requirements);
  if(migrated){config.requirements=StoryPlannerCore.defaultRequirements();if(config.custom?.trim())config.requirements.push({id:newId(),name:'原导演补充要求',content:config.custom,enabled:true});}
  const upgraded=StoryPlannerCore.upgradeRequirements(config.requirements);config.requirements=upgraded.entries;
  if(!Array.isArray(config.plannings))config.plannings=[];
  const writerMigrated=!Array.isArray(config.writers);if(writerMigrated){const content=StoryPlannerCore.writerContent(config.writerPrompt??StoryPlannerCore.DEFAULT_WRITER);config.writers=content.trim()?[{id:newId(),name:'大纲扩写要求',enabled:true,content}]:[];}
  delete config.writerPrompt;
  delete config.custom;
  const persistRequirements=()=>{replaceVariables(config,STORE);};
  if((writerMigrated&&Object.prototype.hasOwnProperty.call(saved,'writerPrompt'))||upgraded.changed||(migrated&&saved.custom?.trim()))persistRequirements();
  const rootEl=el;
  function mountLibrary(kind,key,label){
  const el=n=>rootEl(kind==='requirement'?n:n.replace('requirements',kind+'s').replace('requirement',kind));
  let selectedRequirement=null,draggedRequirement=null,touchDrag=null,menuInvoker=null;
  const menu=doc.createElement('div');menu.className='sp-entry-menu';menu.setAttribute('popover','auto');menu.setAttribute('aria-label',label+'条目操作');box.appendChild(menu);
  menu.close=()=>{if(menu.matches?.(':popover-open'))menu.hidePopover();menu.open=false;menuInvoker=null;};
  function openMenu(button,exp,remove){
    menu.replaceChildren();for(const item of [exp,remove])menu.appendChild(item);
    menu.showPopover();menu.open=true;menuInvoker=button;const anchor=button.getBoundingClientRect(),size=menu.getBoundingClientRect();
    const width=host.innerWidth||doc.documentElement.clientWidth,height=host.innerHeight||doc.documentElement.clientHeight;
    menu.style.left=Math.max(8,Math.min(anchor.right-size.width,width-size.width-8))+'px';
    menu.style.transformOrigin=anchor.bottom+size.height+8>height?'bottom right':'top right';
    menu.style.top=Math.max(8,Math.min(anchor.bottom+size.height+8>height?anchor.top-size.height-6:anchor.bottom+6,height-size.height-8))+'px';

  }

  const selectedEntry=()=>config[key].find(e=>e.id===selectedRequirement);
  function closeRequirementEditor(){el('requirement-editor').close?.();}
  function selectRequirement(id){selectedRequirement=id;paintRequirements();const entry=selectedEntry();if(entry){el('requirement-name').value=entry.name;el('requirement-content').value=entry.content;if(!el('requirement-editor').open)el('requirement-editor').showModal();}else closeRequirementEditor();}
  function clearDrag(){if(touchDrag){touchDrag.row.style.transform='';delete touchDrag.row.dataset.touchDrag;touchDrag=null;}draggedRequirement=null;for(const row of el('requirements').children){delete row.dataset.dragging;delete row.dataset.dropTarget;}}
  function moveRequirement(fromId,toId){const from=config[key].findIndex(e=>e.id===fromId),to=config[key].findIndex(e=>e.id===toId);if(from<0||to<0||from===to)return;const [item]=config[key].splice(from,1);config[key].splice(to,0,item);persistRequirements();paintRequirements(fromId);}
  function exportRequirements(entries){
    const data={type:'meeme-director-requirements',version:1,library:kind,entries:entries.map(({name,content,enabled})=>({name,content,enabled}))};
    const url=host.URL.createObjectURL(new host.Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=doc.createElement('a');link.href=url;link.download='咩咩'+label+'.json';doc.body.appendChild(link);link.click();link.remove();host.setTimeout(()=>host.URL.revokeObjectURL(url),1000);
  }
  function paintRequirements(replayId=null){
    menu.close?.();const list=el('requirements');list.replaceChildren();el('requirement-export').disabled=!config[key].length;
    if(!config[key].length){const empty=doc.createElement('p');empty.textContent='暂无'+label+'，点击 + 新建。';list.appendChild(empty);}
    for(const entry of config[key]){
      const row=doc.createElement('div');row.className='sp-requirement';row.draggable=true;row.dataset.selected=String(selectedRequirement===entry.id);row.dataset.active=String(entry.enabled);row.setAttribute('role','listitem');
      const startDrag=e=>{e.stopPropagation?.();draggedRequirement=entry.id;const rect=row.getBoundingClientRect?.()||{left:0,top:0,width:240,height:48};if(e.dataTransfer){e.dataTransfer.setData('text/plain',entry.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setDragImage?.(row,Math.max(0,Math.min(rect.width,(e.clientX||rect.left)-rect.left)),Math.max(0,Math.min(rect.height,(e.clientY||rect.top)-rect.top)));}row.dataset.dragging='true';};
      row.ondragstart=startDrag;row.ondragend=clearDrag;
      row.ondragover=e=>{if(!draggedRequirement||draggedRequirement===entry.id)return;e.preventDefault();for(const item of list.children)delete item.dataset.dropTarget;row.dataset.dropTarget='true';if(e.dataTransfer)e.dataTransfer.dropEffect='move';};
      row.ondragleave=()=>{delete row.dataset.dropTarget;};row.ondrop=e=>{e.preventDefault();if(draggedRequirement)moveRequirement(draggedRequirement,entry.id);clearDrag();};
      const moveWithKeys=e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const index=config[key].findIndex(x=>x.id===entry.id),target=config[key][index+(e.key==='ArrowUp'?-1:1)];if(target)moveRequirement(entry.id,target.id);};
      const active=doc.createElement('input');active.type='checkbox';active.checked=entry.enabled;active.setAttribute('aria-label','启用 '+entry.name);active.onchange=()=>{entry.enabled=active.checked;row.dataset.active=String(entry.enabled);check.dataset.animate=String(entry.enabled);persistRequirements();};
      const check=doc.createElement('label');check.className='sp-jelly-check';if(replayId===entry.id)check.dataset.animate='true';const face=doc.createElement('span');face.className='sp-jelly-face';face.setAttribute('aria-hidden','true');const tick=doc.createElement('span');tick.className='sp-jelly-tick';face.appendChild(tick);check.appendChild(active);check.appendChild(face);
      const name=doc.createElement('button');name.type='button';name.className='sp-requirement-name';name.textContent=entry.name||'未命名要求';name.setAttribute('aria-label',entry.name+'，可拖拽或用上下方向键排序');name.draggable=true;name.ondragstart=startDrag;name.ondragend=clearDrag;name.onkeydown=moveWithKeys;
      for(const grip of [name]){
        grip.onpointerdown=e=>{if(e.pointerType==='mouse'||e.button>0)return;clearDrag();touchDrag={row,id:entry.id,startY:e.clientY,target:entry.id,moved:false};grip.setPointerCapture?.(e.pointerId);};
        grip.onpointermove=e=>{if(!touchDrag||touchDrag.id!==entry.id)return;const dy=e.clientY-touchDrag.startY;if(!touchDrag.moved&&Math.abs(dy)<6)return;e.preventDefault();touchDrag.moved=true;row.dataset.touchDrag='true';row.style.transform='translateY('+dy+'px)';const bounds=list.getBoundingClientRect();if(e.clientY<bounds.top+30)list.scrollTop-=12;if(e.clientY>bounds.bottom-30)list.scrollTop+=12;for(const item of list.children){delete item.dataset.dropTarget;const r=item.getBoundingClientRect();if(item!==row&&e.clientY>=r.top&&e.clientY<=r.bottom){touchDrag.target=item.dataset.entryId;item.dataset.dropTarget='true';}}};
        grip.onpointerup=()=>{if(!touchDrag)return;const {id,target,moved}=touchDrag;clearDrag();if(moved)moveRequirement(id,target);};grip.onpointercancel=clearDrag;
      }
      row.dataset.entryId=entry.id;
      const edit=doc.createElement('button');edit.type='button';edit.textContent='✎';edit.title='编辑';edit.setAttribute('aria-label','编辑 '+entry.name);edit.onclick=()=>selectRequirement(entry.id);
      const exp=doc.createElement('button');exp.type='button';exp.textContent='↥ 导出';exp.title='导出此条目';exp.setAttribute('aria-label','导出 '+entry.name);exp.onclick=()=>{menu.close();exportRequirements([entry]);};
      const remove=doc.createElement('button');remove.type='button';remove.textContent='× 删除';remove.title='删除此条目';remove.setAttribute('aria-label','删除 '+entry.name);remove.onclick=()=>{menu.close();config[key]=config[key].filter(e=>e.id!==entry.id);persistRequirements();if(selectedRequirement===entry.id)selectRequirement(null);else paintRequirements();};
      const more=doc.createElement('button');more.type='button';more.textContent='···';more.title='更多操作';more.setAttribute('aria-label','更多操作 '+entry.name);let dismissOnClick=false;more.onpointerdown=()=>{dismissOnClick=menuInvoker===more&&menu.matches(':popover-open');};more.onclick=()=>{const dismiss=dismissOnClick||(menuInvoker===more&&menu.matches(':popover-open'));dismissOnClick=false;if(dismiss)menu.close();else openMenu(more,exp,remove);};more.onpointercancel=()=>{dismissOnClick=false;};
      for(const node of [check,name,edit,more])row.appendChild(node);list.appendChild(row);
    }
  }
  function addEntry(content=''){const entry={id:newId(),name:'新建'+label,enabled:true,content};config[key].unshift(entry);persistRequirements();selectRequirement(entry.id);el('requirement-name').focus?.();}
  el('requirement-add').onclick=()=>{if(kind==='planning'){rootEl('planning-template').showModal();rootEl('planning-template-heading').focus?.({preventScroll:true});}else addEntry();};
  if(kind==='planning'){
    const templates={single:'[输入标题]: (规则内容)',multi:'[输入标题]:(**逐条列出本回合将如何执行以下规则，不得改写或省略原规则内容。**)\n- 【输入标题】: 规则内容\n- 【输入标题】: 规则内容\n- 【输入标题】: 规则内容',custom:''};
    for(const [type,content] of Object.entries(templates))rootEl('planning-'+type).onclick=()=>{rootEl('planning-template').close();addEntry(content);};
    rootEl('planning-template-close').onclick=()=>rootEl('planning-template').close();
  }

  el('requirement-close').onclick=closeRequirementEditor;
  el('requirement-editor').oncancel=e=>{e.preventDefault();closeRequirementEditor();};
  for(const [field,key] of [['requirement-name','name'],['requirement-content','content']])el(field).oninput=()=>{const entry=selectedEntry();if(!entry)return;entry[key]=el(field).value;persistRequirements();if(key==='name')paintRequirements();};
  el('requirement-export').onclick=()=>exportRequirements(config[key]);
  el('requirement-import').onclick=()=>el('requirement-file').click();
  el('requirement-file').onchange=async()=>{try{const file=el('requirement-file').files?.[0];if(!file)return;if(file.size>4000000)throw Error('文件过大，请分批导入。');const entries=StoryPlannerCore.importRequirements(JSON.parse(await file.text()));if(disposed)return;const added=entries.map(e=>({...e,id:newId()}));config[key].unshift(...added);persistRequirements();selectRequirement(added[0]?.id||selectedRequirement);say('已导入 '+added.length+' 条'+label+'。');}catch(e){say(e.message);}finally{el('requirement-file').value='';}};
  paintRequirements();

  return {close:()=>{menu.close?.();clearDrag();closeRequirementEditor();if(kind==='planning')rootEl('planning-template').close?.();},clearDrag};
  }
  const requirementLibrary=mountLibrary('requirement','requirements','最高指令');
  const planningLibrary=mountLibrary('planning','plannings','导演规划');
  const writerLibrary=mountLibrary('writer','writers','主 API 提示词');
  function closeRequirementEditor(){requirementLibrary.close();planningLibrary.close();writerLibrary.close();}
  function clearDrag(){requirementLibrary.clearDrag();planningLibrary.clearDrag();writerLibrary.clearDrag();}
