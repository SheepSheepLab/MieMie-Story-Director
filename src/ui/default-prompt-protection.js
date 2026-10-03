import {protectedDefault} from '../default-prompts.js';

// Product-only library controls. No change to planning, request routing or Core.
export function mountDefaultPromptProtection({panel:window,host,resources}) {
  const panel=window.querySelector('.sp-panel'),q=n=>panel.querySelector(`[data-sp-${n}]`);
  const libraries=[['requirement','requirements'],['writer','writers']];
  const protectedRow=row=>libraries.some(([,key])=>q(key).contains(row)&&!!protectedDefault(key,row.dataset.entryId));
  const menus=new Map();
  const fields=new WeakSet(),buttons=new WeakSet(),grips=new WeakSet(),lockedRows=new WeakSet();
  function editor(kind,locked) {
    for(const field of [q(kind+'-name'),q(kind+'-content')]) {
      field.readOnly=locked;field.title=locked?'默认条目只读，可以选择并复制':'';
      if(!fields.has(field)){fields.add(field);const input=field.oninput;field.oninput=resources.guard(function(...args){if(!this.readOnly)return input?.apply(this,args);});}
    }
    q(kind+'-editor').setAttribute('aria-label',locked?'查看默认条目（只读，可复制）':kind==='writer'?'编辑主 API 提示词':'编辑最高指令');
  }
  function enhance() {
    for(const[kind,key]of libraries) {
      for(const row of q(key).querySelectorAll('.sp-requirement')) {
        const name=row.children[1];
        if(!grips.has(name)){grips.add(name);const keys=name.onkeydown;name.onkeydown=resources.guard(function(e){const rows=[...q(key).querySelectorAll('.sp-requirement')],index=rows.indexOf(this.parentElement),target=rows[index+(e.key==='ArrowUp'?-1:1)];if(['ArrowUp','ArrowDown'].includes(e.key)&&target&&protectedRow(target)){e.preventDefault();return;}return keys?.call(this,e);});const move=name.onpointermove;name.onpointermove=resources.guard(function(e){const blocked=[...q(key).querySelectorAll('.sp-requirement')].filter(protectedRow).some(item=>{const r=item.getBoundingClientRect();return r.height>0&&e.clientY>=r.top&&e.clientY<=r.bottom;});if(blocked){e.preventDefault?.();return;}return move?.call(this,e);});}
        if(!protectedRow(row))continue;
        if(!lockedRows.has(row)){lockedRows.add(row);
        row.draggable=false;name.draggable=false;name.style.cursor='default';name.title='默认条目固定位置，不可排序';name.setAttribute('aria-label',name.textContent+'，默认条目，固定位置');
        row.ondragstart=name.ondragstart=row.ondrop=row.ondragover=resources.guard(e=>{e.preventDefault?.();e.stopPropagation?.();});
        name.onpointerdown=name.onpointerup=name.onpointercancel=null;
        name.onkeydown=resources.guard(e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation?.();}});}
        const edit=row.children[2];edit.title='查看默认条目（只读，可复制）';edit.setAttribute('aria-label','查看 '+row.children[1].textContent+'（只读，可复制）');
      }
      if(q(kind+'-editor').open){const selected=q(key).querySelector('[data-selected=true]');editor(kind,!!selected&&protectedRow(selected));}
    }
    for(const[menu,locked]of menus) {
      const remove=menu.querySelectorAll('button')[1];if(!remove)continue;
      remove.disabled=locked;remove.title=locked?'默认条目不能删除；可关闭后新建自定义条目':'删除此条目';
      if(!buttons.has(remove)){buttons.add(remove);const action=remove.onclick;remove.onclick=resources.guard(function(...args){if(!this.disabled)return action?.apply(this,args);});}
    }
  }
  resources.listen(panel,'click',event=>{
    const button=event.target.closest?.('button'),row=button?.closest('.sp-requirement');
    for(const[kind,key]of libraries) {
      if(button===q(kind+'-add'))editor(kind,false);
      if(!row||!q(key).contains(row))continue;
      if(button===row.children[2])editor(kind,protectedRow(row));
      if(button===row.children[3]) {
        const label=kind==='writer'?'主 API 提示词条目操作':'最高指令条目操作';
        const menu=[...panel.querySelectorAll('.sp-entry-menu')].find(m=>m.getAttribute('aria-label')===label);
        if(menu)menus.set(menu,protectedRow(row));
      }
    }
    const menu=button?.closest('.sp-entry-menu');
    if(menu&&menus.get(menu)&&button===menu.querySelectorAll('button')[1]){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  const observer=new host.MutationObserver(resources.guard(enhance));observer.observe(panel,{childList:true,subtree:true});
  resources.add(()=>{observer.disconnect();menus.clear();});enhance();
}
