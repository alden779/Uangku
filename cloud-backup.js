import {encodeBackup,decodeBackup,backupData} from './backup.js';
const SCOPE='https://www.googleapis.com/auth/drive.appdata';
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
    if(response.error||!response.access_token||!globalThis.google.accounts.oauth2.hasGrantedAllScopes(response,SCOPE)){this.emit('Izin backup belum diberikan. Data tetap tersimpan di perangkat.');return}
    this.token=response.access_token;this.expires=this.now()+Number(response.expires_in)*1000-30000;this.generation++;this.lastFingerprint='';this.state.lastBackup=null;this.pending=null;
    this.emit('Drive tersambung. Backup otomatis aktif selama sesi ini.');
    const generation=this.generation;
    try{await this.list();if(generation===this.generation)this.emit('Drive tersambung. Perubahan berikutnya akan dicadangkan otomatis. Pilih Backup sekarang untuk mencadangkan data saat ini.')}catch(e){if(generation===this.generation)this.emit(e.message)}
  }
  disconnect(){this.generation++;clearTimeout(this.timer);for(const c of this.controllers)c.abort();this.token='';this.expires=0;this.pending=null;this.busy=false;this.files=[];this.lastFingerprint='';this.state.lastBackup=null;this.emit('Backup otomatis dihentikan. Salinan di Drive tetap ada.')}
  requireToken(){if(!this.token||this.now()>=this.expires){this.token='';throw Error('Sesi Google berakhir. Sambungkan ulang untuk melanjutkan backup.')}}
  async request(path,options={},upload=false){
    this.requireToken();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);this.controllers.add(controller);
    try{const r=await this.fetch((upload?'https://www.googleapis.com/upload/drive/v3/':'https://www.googleapis.com/drive/v3/')+path,{...options,signal:controller.signal,headers:{...options.headers,Authorization:'Bearer '+this.token}});if(r.status===401){this.token='';throw Error('Sesi Google berakhir. Sambungkan ulang untuk melanjutkan backup.')}if(!r.ok)throw Error(r.status===403?'Drive menolak backup. Periksa izin, kapasitas, dan aktivasi Drive API.':`Backup cloud gagal (${r.status}). Data lokal tetap aman; coba lagi.`);return r}catch(e){if(e.name==='AbortError')throw Error('Backup cloud terlalu lama. Periksa koneksi lalu coba lagi.');if(e instanceof TypeError)throw Error('Drive tidak dapat dijangkau. Data tetap tersimpan lokal; backup dicoba lagi saat online.');throw e}finally{clearTimeout(timeout);this.controllers.delete(controller)}
  }
  async list(){const generation=this.generation;const q=encodeURIComponent("appProperties has { key='app' and value='uangku' }");const r=await this.request(`files?spaces=appDataFolder&q=${q}&orderBy=createdTime%20desc&pageSize=20&fields=files(id,name,createdTime,size)`);const body=await r.json();if(generation===this.generation){this.files=body.files||[];this.emit(this.state.message)}return body.files||[]}
  schedule(){this.pending=backupData(this.getState());clearTimeout(this.timer);if(!this.token){if(this.clientId)this.emit('Perubahan tersimpan lokal. Sambungkan Drive untuk backup cloud.');return}this.timer=setTimeout(()=>this.flush().catch(()=>{}),this.delay)}
  async flush(force=false){
    if(force)this.pending=backupData(this.getState());
    if(this.busy){this.emit('Backup sedang berjalan. Perubahan terbaru menunggu giliran.');return}
    if(!this.pending)return;
    const snapshot=this.pending,fingerprint=JSON.stringify(snapshot);if(fingerprint===this.lastFingerprint){this.pending=null;this.emit('Semua perubahan sudah dicadangkan.');return}
    const generation=this.generation;this.busy=true;this.emit('Mencadangkan ke Google Drive…');
    try{
      this.requireToken();const now=new Date(this.now()),boundary='uangku_'+crypto.randomUUID();
      const metadata={name:'uangku-'+now.toISOString().replace(/[:.]/g,'-')+'.json',mimeType:'application/json',parents:['appDataFolder'],appProperties:{app:'uangku',schema:'1'}};
      const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${encodeBackup(snapshot,now)}\r\n--${boundary}--\r\n`;
      const response=await this.request('files?uploadType=multipart&fields=id,name,createdTime',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body},true),file=await response.json();
      if(!file.id)throw Error('Drive belum mengonfirmasi backup. Coba lagi.');
      if(generation!==this.generation)return;
      this.lastFingerprint=fingerprint;this.state.lastBackup=now.toISOString();this.files=[file,...this.files].slice(0,20);
      if(JSON.stringify(this.pending)===fingerprint)this.pending=null;
      this.emit('Backup berhasil · '+now.toLocaleString('id-ID'));
    }catch(e){if(generation===this.generation)this.emit(e.message);throw e}finally{if(generation===this.generation){this.busy=false;this.emit(this.state.message);if(this.pending&&this.token&&this.now()<this.expires&&JSON.stringify(this.pending)!==fingerprint){clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(()=>{}),this.delay)}}}
  }
  async restore(id){if(!this.files.some(f=>f.id===id)||!/^[-\w]+$/.test(id))throw Error('Pilih cadangan Drive yang tersedia.');const r=await this.request('files/'+encodeURIComponent(id)+'?alt=media');return decodeBackup(await r.text())}
}
