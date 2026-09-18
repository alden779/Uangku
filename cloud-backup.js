import {encodeBackup,decodeBackup,backupData} from './backup.js';
import {exportExcel} from './exports.js';
const SCOPES=['https://www.googleapis.com/auth/drive.appdata','https://www.googleapis.com/auth/drive.file'];
const SCOPE=SCOPES.join(' ');
export class DriveBackup{
  constructor({clientId='',getState,onStatus=()=>{},fetchFn=globalThis.fetch?.bind(globalThis),now=()=>Date.now(),delay=1800}){
    this.clientId=clientId;this.getState=getState;this.onStatus=onStatus;this.fetch=fetchFn;this.now=now;this.delay=delay;this.token='';this.expires=0;this.pending=null;this.timer=null;this.busy=false;this.controllers=new Set();this.generation=0;this.lastFingerprint='';this.files=[];this.state={configured:!!clientId,ready:false,connected:false,busy:false,message:clientId?'Hubungkan Google Drive untuk backup.':'Backup cloud belum diaktifkan. Setup Google Drive diperlukan.',files:[],lastBackup:null};
  }
  emit(message){this.state={...this.state,connected:!!this.token&&this.now()<this.expires,busy:this.busy,files:this.files,message};this.onStatus(this.state)}
  async prepare(){
    if(!this.clientId||this.client)return;
    if(this.preparing)return this.preparing;
    this.preparing=(async()=>{if(!globalThis.google?.accounts?.oauth2){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;const timeout=setTimeout(()=>{s.remove();reject(Error('Google belum dapat dimuat. Periksa internet lalu coba lagi.'))},15000);s.onload=()=>{clearTimeout(timeout);resolve()};s.onerror=()=>{clearTimeout(timeout);s.remove();reject(Error('Google tidak dapat dimuat. Periksa koneksi internet.'))};document.head.append(s)})}this.client=google.accounts.oauth2.initTokenClient({client_id:this.clientId,scope:SCOPE,include_granted_scopes:false,callback:r=>this.authorized(r),error_callback:()=>{this.busy=false;this.emit('Koneksi dibatalkan atau popup Google diblokir. Coba sambungkan lagi.')}});this.state.ready=true;this.emit('Google siap. Sambungkan akun untuk backup.');})().catch(e=>{this.preparing=null;this.emit(e.message)});return this.preparing;
  }
  connect(){if(!this.client||this.busy)return;this.busy=true;this.emit('Menunggu koneksi akun Google…');this.client.requestAccessToken({prompt:'select_account'})}
  async authorized(response){
    this.busy=false;
    if(response.error||!response.access_token||!globalThis.google.accounts.oauth2.hasGrantedAllScopes(response,...SCOPES)){this.emit('Izinkan data aplikasi dan file yang dibuat Uangku, lalu sambungkan ulang. Data tetap tersimpan di perangkat.');return}
    this.token=response.access_token;this.expires=this.now()+Number(response.expires_in)*1000-30000;this.generation++;this.folderId='';this.folderPromise=null;this.state.folderUrl='';this.lastFingerprint='';this.state.lastBackup=null;this.pending=null;
    this.emit('Drive tersambung. Backup otomatis aktif selama sesi ini.');
    const generation=this.generation;
    try{await this.list();if(generation===this.generation)this.emit('Drive tersambung. Perubahan berikutnya akan dicadangkan otomatis. Pilih Backup sekarang untuk mencadangkan data saat ini.')}catch(e){if(generation===this.generation)this.emit(e.message)}
  }
  disconnect(){this.generation++;clearTimeout(this.timer);for(const c of this.controllers)c.abort();this.token='';this.expires=0;this.pending=null;this.busy=false;this.files=[];this.folderId='';this.folderPromise=null;this.state.folderUrl='';this.lastFingerprint='';this.state.lastBackup=null;this.emit('Backup otomatis dihentikan. Salinan di Drive tetap ada.')}
  requireToken(){if(!this.token||this.now()>=this.expires){this.token='';throw Error('Sesi Google berakhir. Sambungkan ulang untuk melanjutkan backup.')}}
  async request(path,options={},upload=false){
    this.requireToken();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);this.controllers.add(controller);
    try{const r=await this.fetch((upload?'https://www.googleapis.com/upload/drive/v3/':'https://www.googleapis.com/drive/v3/')+path,{...options,signal:controller.signal,headers:{...options.headers,Authorization:'Bearer '+this.token}});if(r.status===401){this.token='';throw Error('Sesi Google berakhir. Sambungkan ulang untuk melanjutkan backup.')}if(!r.ok)throw Error(r.status===403?'Drive menolak backup. Periksa izin, kapasitas, dan aktivasi Drive API.':`Backup cloud gagal (${r.status}). Data lokal tetap aman; coba lagi.`);return r}catch(e){if(e.name==='AbortError')throw Error('Backup cloud terlalu lama. Periksa koneksi lalu coba lagi.');if(e instanceof TypeError)throw Error('Drive tidak dapat dijangkau. Data tetap tersimpan lokal; backup dicoba lagi saat online.');throw e}finally{clearTimeout(timeout);this.controllers.delete(controller)}
  }
  async ensureFolder(){
    if(this.folderId)return this.folderId;
    if(this.folderPromise)return this.folderPromise;
    const generation=this.generation;
    this.folderPromise=(async()=>{const q=encodeURIComponent("trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='app' and value='uangku-backups' }");const r=await this.request('files?spaces=drive&q='+q+'&fields=files(id)&pageSize=1'),body=await r.json();let id=body.files?.[0]?.id;
      if(!id){const created=await this.request('files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Uangku Backups',mimeType:'application/vnd.google-apps.folder',appProperties:{app:'uangku-backups'}})});id=(await created.json()).id}
      if(!id||generation!==this.generation)throw Error('Koneksi Drive berubah. Sambungkan ulang.');this.folderId=id;this.state.folderUrl='https://drive.google.com/drive/folders/'+encodeURIComponent(id);return id;
    })().finally(()=>{if(generation===this.generation)this.folderPromise=null});return this.folderPromise;
  }
  async list(){const generation=this.generation;await this.ensureFolder();const q=encodeURIComponent("trashed = false and mimeType = 'application/json' and appProperties has { key='app' and value='uangku' }");const results=await Promise.all(['drive','appDataFolder'].map(async space=>{const r=await this.request(`files?spaces=${space}&q=${q}&orderBy=createdTime%20desc&pageSize=20&fields=files(id,name,createdTime,size)`);return (await r.json()).files||[]}));const files=results.flat().sort((a,b)=>String(b.createdTime).localeCompare(String(a.createdTime))).slice(0,20);if(generation===this.generation){this.files=files;this.emit(this.state.message)}return files}
  async upload(metadata,content){const boundary='uangku_'+crypto.randomUUID();const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`,content,`\r\n--${boundary}--\r\n`]);const response=await this.request('files?uploadType=multipart&fields=id,name,createdTime,webViewLink',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body},true),file=await response.json();if(!file.id)throw Error('Drive belum mengonfirmasi file. Coba lagi.');return file}
  schedule(){this.pending=backupData(this.getState());clearTimeout(this.timer);if(!this.token){if(this.clientId)this.emit('Perubahan tersimpan lokal. Sambungkan Drive untuk backup cloud.');return}this.timer=setTimeout(()=>this.flush().catch(()=>{}),this.delay)}
  async flush(force=false){
    if(force)this.pending=backupData(this.getState());
    if(this.busy){this.emit('Backup sedang berjalan. Perubahan terbaru menunggu giliran.');return}
    if(!this.pending)return;
    const snapshot=this.pending,fingerprint=JSON.stringify(snapshot);if(!force&&fingerprint===this.lastFingerprint){this.pending=null;this.emit('Semua perubahan sudah dicadangkan.');return {skipped:true}}
    const generation=this.generation;this.busy=true;this.emit('Mencadangkan ke Google Drive…');
    try{
      this.requireToken();const now=new Date(this.now()),folder=await this.ensureFolder();if(generation!==this.generation)throw Error('Backup dibatalkan.');
      const stamp=now.toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8),month=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
      const file=await this.upload({name:'uangku-backup-'+stamp+'.json',mimeType:'application/json',parents:[folder],appProperties:{app:'uangku',schema:'1'}},encodeBackup(snapshot,now));
      if(generation!==this.generation)return;
      this.files=[file,...this.files].slice(0,20);
      this.emit('Backup JSON tersimpan. Mengunggah laporan Excel…');let report;
      try{report=await this.upload({name:'uangku-laporan-'+month+'-'+stamp+'.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',parents:[folder],appProperties:{app:'uangku',kind:'report'}},exportExcel(snapshot,month,now))}catch(e){throw Error('Backup JSON sudah tersimpan, tetapi laporan Excel gagal: '+e.message)}
      if(generation!==this.generation)return;
      this.lastFingerprint=fingerprint;this.state.lastBackup=now.toISOString();
      if(JSON.stringify(this.pending)===fingerprint)this.pending=null;
      this.emit('Backup berhasil · '+now.toLocaleString('id-ID'));
      return {file,report,folderUrl:this.state.folderUrl,month};
    }catch(e){if(generation===this.generation)this.emit(e.message);throw e}finally{if(generation===this.generation){this.busy=false;this.emit(this.state.message);if(this.pending&&this.token&&this.now()<this.expires&&JSON.stringify(this.pending)!==fingerprint){clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(()=>{}),this.delay)}}}
  }
  async restore(id){if(!this.files.some(f=>f.id===id)||!/^[-\w]+$/.test(id))throw Error('Pilih cadangan Drive yang tersedia.');const r=await this.request('files/'+encodeURIComponent(id)+'?alt=media');return decodeBackup(await r.text())}
}
