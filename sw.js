/* ================================================================
KENVEN HUB - SERVICE WORKER (v2 - Always Fresh)
================================================================ */
const CACHE_VERSION = 'kenven-hub-v5';
const CACHE_NAME = `kenven-hub-${CACHE_VERSION}`;
const CORE_ASSETS = ['./','./index.html','./style.css','./app.js','./manifest.json'];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()).catch((error)=>console.error('[SW] Install failed:',error)))});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((cacheNames)=>Promise.all(cacheNames.filter((name)=>name!==CACHE_NAME).map((oldCache)=>caches.delete(oldCache)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',(event)=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET')return;if(url.hostname.includes('firebase')||url.hostname.includes('googleapis')||url.hostname.includes('gstatic'))return;if(url.origin===self.location.origin){event.respondWith(fetch(request).then((response)=>{const clone=response.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(request,clone));return response}).catch(()=>caches.match(request).then((cached)=>cached||caches.match('./index.html'))));return}event.respondWith(caches.match(request).then((cached)=>{const fetchPromise=fetch(request).then((networkResponse)=>{if(networkResponse&&(networkResponse.status===200||networkResponse.type==='opaque')){const clone=networkResponse.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(request,clone))}return networkResponse}).catch(()=>cached);return cached||fetchPromise}))});
self.addEventListener('message',(event)=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
