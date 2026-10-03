// The forwarding closure deliberately has no reference to an activation scope.
// A downstream wrapper may keep forward forever: its business link is severed.
export function installDirectorFetchHook(host, handler, previous = host.fetch) {
  const link = {handler, previous};
  handler = null;
  function forward(input, init) {return (link.handler || link.previous).call(host, input, init);}
  host.fetch = forward;
  return () => {link.handler = null; if (host.fetch === forward) host.fetch = previous;};
}

// Promise completions retained by an abort-ignoring provider retain only this
// severable link, never the Runtime or its panel after lifetime revocation.
function deliver(link,ok,value) {
  if(!link.resolve)return;
  const resolve=link.resolve,reject=link.reject,release=link.release;
  link.resolve=null;link.reject=null;link.release=null;release?.();
  (ok?resolve:reject)(value);
}
function makeCompletion(link,ok) {return value=>deliver(link,ok,value);}

export function createDirectorResources(api, host) {
  let closed = false, completion;
  const cleanups = [], timers = new Map(), nodes = new WeakSet(), urls = new Set();
  const report = error => {try {console.warn('[MieMie Story Director]', error);} catch (_) {}};
  function add(fn) {
    if (closed) {try {Promise.resolve(fn()).catch(report);} catch (e) {report(e);}}
    else cleanups.push(fn);
    return fn;
  }
  function dispose() {
    if (closed) return completion;
    closed = true;
    const errors = [], pending = [];
    // All synchronous revocation happens before awaiting asynchronous disposers.
    for (const fn of cleanups.splice(0).reverse()) try {pending.push(Promise.resolve(fn()).catch(e => errors.push(e)));} catch (e) {errors.push(e);}
    for (const id of timers.keys()) host.clearTimeout(id);
    timers.clear();
    for (const url of urls) host.URL.revokeObjectURL(url);
    urls.clear();
    completion = Promise.all(pending).then(() => {if (errors.length) throw new AggregateError(errors, '故事导演清理失败');});
    return completion;
  }
  const abort = () => {void dispose()?.catch(report);};
  api.signal.addEventListener('abort', abort, {once:true});
  add(() => api.signal.removeEventListener('abort', abort));
  api.onCleanup(dispose);
  // Preserve active callback return values and exception semantics exactly.
  function guard(fn) {const link={fn};fn=null;add(()=>{link.fn=null;});return function (...args) {return link.fn?.apply(this,args);};}
  function timeout(fn, delay) {
    if (closed) return null;
    const id = host.setTimeout(guard(() => {timers.delete(id); fn();}), delay);
    timers.set(id, true); return id;
  }
  function clear(id) {if (timers.delete(id)) host.clearTimeout(id);}
  function trackController(controller) {
    const revoke = () => controller.abort();
    add(revoke);
    return controller;
  }
  function objectURL(blob) {const url=host.URL.createObjectURL(blob);urls.add(url);return url;}
  function revokeURL(url) {urls.delete(url);host.URL.revokeObjectURL(url);}
  // Only Director-owned nodes are managed. No Document/Element prototype patch.
  // Revoked callbacks no longer retain the business closure even if someone
  // retained an old button or listener. Native event property setters still run.
  function manageNode(node) {
    if (!node || nodes.has(node)) return node;
    nodes.add(node);
    add(()=>{for(const key of ['onclick','oninput','onchange','onkeydown','ondragstart','ondragend','ondragover','ondrop','onpointerdown','onpointermove','onpointerup','onpointercancel','onpointerleave','ontoggle','oncancel'])node[key]=null;});
    const query=node.querySelector;
    if (query) {node.querySelector=function(...args){return manageNode(query.apply(this,args));};add(()=>{node.querySelector=query;});}
    return node;
  }
  function wait(promise,message='故事导演已停用。') {
    if(closed)return Promise.reject(Error(message));
    return new Promise((resolve,reject)=>{
      const link={resolve,reject,release:null};
      const cancel=()=>deliver(link,false,Error(message));
      add(cancel);
      link.release=()=>{const index=cleanups.indexOf(cancel);if(index>=0)cleanups.splice(index,1);};
      Promise.resolve(promise).then(makeCompletion(link,true),makeCompletion(link,false));
    });
  }
  function listen(node,name,fn,options) {
    const callback=guard(fn);node.addEventListener(name,callback,options);
    add(()=>node.removeEventListener?.(name,callback,options));
  }
  const managedDocument=doc=>new Proxy(doc,{get(target,key){
    if(key==='createElement')return (...args)=>manageNode(target.createElement(...args));
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  return {add,dispose,guard,timeout,clear,trackController,objectURL,revokeURL,listen,wait,document:managedDocument,get closed(){return closed;}};
}
