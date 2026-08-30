const CACHE='teachtrack-shell-v5';
const SHELL=['/offline.html','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  // Never cache Next.js JS/CSS/RSC assets. Cache-first here can mix an old
  // client bundle with fresh server HTML and cause hydration mismatches.
  if(url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(req).catch(()=>new Response('',{status:503,statusText:'Offline'}))
    );
    return;
  }

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        return await fetch(req);
      }catch{
        return (await caches.match('/offline.html')) || new Response('Offline',{
          status:503,
          headers:{'Content-Type':'text/plain; charset=utf-8'}
        });
      }
    })());
    return;
  }

  if(url.pathname.startsWith('/icons/')||url.pathname.endsWith('.webmanifest')){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached) return cached;
      try{
        const response=await fetch(req);
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put(req,response.clone());
        }
        return response;
      }catch{
        return new Response('',{status:503,statusText:'Offline'});
      }
    })());
  }
});
