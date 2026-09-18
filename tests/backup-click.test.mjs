import {test} from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM surface for exercising the app's real delegated click listener.
class Element {
  constructor(){this.dataset={};this.children=new Map();this.textContent='';this.value='';this.open=false;this.hidden=false;this.innerHTML=''}
  querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element());return this.children.get(selector)}
  setAttribute(){}
  append(element){this.children.set('#'+element.id,element)}
  showModal(){this.open=true}
  close(){this.open=false}
}
test('Rendered Drive buttons trigger loading, confirmed success, errors and restore',async()=>{
  const nodes=new Map(),listeners=new Map(),body=new Element();
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector)};
  globalThis.document={body,querySelector:node,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener:(name,fn)=>listeners.set(name,fn)};
  globalThis.window={addEventListener(){}};
  const stored=new Map();globalThis.localStorage={getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)};
  globalThis.confirm=()=>true;
  const {DriveBackup}=await import('../cloud-backup.js?v=20260918-drive3');
  const original={prepare:DriveBackup.prototype.prepare,flush:DriveBackup.prototype.flush,restore:DriveBackup.prototype.restore,schedule:DriveBackup.prototype.schedule};
  let resolveUpload,rejectUpload,backupCalls=0,restoredId;
  DriveBackup.prototype.prepare=function(){this.state.ready=true;this.state.connected=true;this.files=[{id:'saved-json',name:'backup.json',createdTime:'2026-09-18'}];this.emit('Drive tersambung.')};
  DriveBackup.prototype.flush=function(force){assert.equal(force,true);backupCalls++;return new Promise((resolve,reject)=>{resolveUpload=resolve;rejectUpload=reject})};
  DriveBackup.prototype.restore=async function(id){restoredId=id;return {budget:123,goals:[],transactions:[]}};
  DriveBackup.prototype.schedule=function(){};
  try{
    await import('../app.js');
    node('#settings').onclick();
    const markup=node('#cloud-panel').innerHTML;
    // Browser DOMStringMap converts data-cloud-backup to dataset.cloudBackup.
    const click=attribute=>{assert.ok(markup.includes(attribute));const key=attribute.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());return listeners.get('click')({target:{closest:()=>({dataset:{[key]:''}})}})};
    const feedback=body.children.get('#backup-feedback');
    const successful=click('data-cloud-backup');
    assert.equal(backupCalls,1);assert.equal(feedback.open,true);assert.equal(feedback.dataset.kind,'loading');assert.equal(feedback.querySelector('.feedback-done').hidden,true);
    resolveUpload({file:{id:'json'},report:{id:'excel'},folderUrl:'https://drive.google.com/drive/folders/test',month:'2026-09'});
    await successful;
    assert.equal(feedback.dataset.kind,'success');assert.equal(feedback.querySelector('.feedback-done').hidden,false);assert.equal(feedback.querySelector('.feedback-folder').hidden,false);
    const failed=click('data-cloud-backup');assert.equal(feedback.dataset.kind,'loading');rejectUpload(Error('Drive menolak backup'));await failed;
    assert.equal(feedback.dataset.kind,'error');assert.match(feedback.querySelector('.feedback-message').textContent,/Drive menolak/);
    node('#cloud-file').value='saved-json';await click('data-cloud-restore');assert.equal(restoredId,'saved-json');assert.equal(JSON.parse(stored.get('uangku-v1')).budget,123);
  }finally{Object.assign(DriveBackup.prototype,original)}
});
