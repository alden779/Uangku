const CACHE='uangku-shell-v5';const assets=['./','./index.html','./app.js','./app.js?v=20260918-drive3','./finance.js','./exports.js','./backup.js','./cloud-backup.js','./cloud-backup.js?v=20260918-drive3','./backup-feedback.js','./cloud-config.js','./cloud-config.js?v=20260918-drive2','./style.css','./style.css?v=20260918-drive3','./manifest.json','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(assets))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('uangku-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request,{cache:'no-cache'}).catch(()=>caches.match(e.request).then(r=>r||new Response('Offline',{status:503}))))});

