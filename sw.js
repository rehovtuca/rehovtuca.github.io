const CACHE='rehovtu-v3';
const ASSETS=['/','/index.html','https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(c2=>c2.put(e.request,c));}return res;}).catch(()=>caches.match('/index.html'))));});
