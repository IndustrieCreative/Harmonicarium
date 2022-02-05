/* globals self */
/* globals caches */

// version: 0.26

"use strict";

var keepOldCache = false;

const appCacheName = 'kepler-cache-v23';

const deprecatedCaches = [
    'kepler-cache',
    'kepler-cache-v1',
    'kepler-cache-v21',
    'kepler-cache-v22',
    'the-magic-cache'
];

const staticAssets = [
    // # find /.../appdir -type f
    './',
    './index.html',
    './pwa.js',
    './manifest.webmanifest',
    './favicon.png',

    './assets/',

    './assets/css/',
    './assets/css/styles.css',

    './assets/js/',
    './assets/js/backend.js',
    './assets/js/dhc.js',
    './assets/js/diphonicpad.js',
    './assets/js/hancock.js',
    './assets/js/harmonicarium.js',
    './assets/js/hstack.js',
    './assets/js/keymap-preset.js',
    './assets/js/midi-hub.js',
    './assets/js/midi-in.js',
    './assets/js/midi-out.js',
    './assets/js/midi-ports.js',
    './assets/js/midi-wml-synthlist.js',
    './assets/js/midi-wml.js',
    './assets/js/synth-ir-default.js',
    './assets/js/synth.js',
    './assets/js/templates.js',

    './assets/js/lib/',
    './assets/js/lib/web-audio-peak-meter_v2.js',
    './assets/js/lib/qwerty-hancock-dist.js',
    './assets/js/lib/synthlist.js',

    './assets/img/',
    './assets/img/agpl.png',
    './assets/img/n-edx.png',
    './assets/img/logo.png',

    './assets/img/appicons/',
    './assets/img/appicons/favicon-16x16.png',
    './assets/img/appicons/favicon-128x128.png',
    './assets/img/appicons/apple-touch-icon-120x120.png',
    './assets/img/appicons/android-chrome-192x192.png',
    './assets/img/appicons/favicon-196x196.png',
    './assets/img/appicons/apple-touch-icon-152x152.png',
    './assets/img/appicons/apple-touch-icon-114x114.png',
    './assets/img/appicons/apple-touch-icon-76x76.png',
    './assets/img/appicons/favicon-96x96.png',
    './assets/img/appicons/apple-touch-icon-57x57.png',
    './assets/img/appicons/apple-touch-icon-72x72.png',
    './assets/img/appicons/apple-touch-icon-60x60.png',
    './assets/img/appicons/apple-touch-icon-144x144.png',
    './assets/img/appicons/favicon-32x32.png',

    './assets/font/',
    './assets/font/IMfellDWpica.woff2',
    './assets/font/SourceCodePro.woff2',
];

self.addEventListener('message', messageEvent => {
    switch (messageEvent.data.action) {
        case 'skipWaiting':
            self.skipWaiting();
            console.log('SKIP WAITING!');
            break;
        case 'appCacheNameRequest':
            messageEvent.source.postMessage({
                action: 'setAppCacheName',
                value: keepOldCache || appCacheName
            });
            break;
        case 'keepOldCache':
            // caches.open(appCacheName).then(cache => cache.add('./sw.js'));
            keepOldCache = messageEvent.data.value;
    }
});


self.addEventListener('fetch', evt => {
    evt.respondWith(
        caches
            .open(appCacheName)
            .then( cache => {
                return cache
                    .match(evt.request)
                    .then( cachedResponse => {
                        if ( /manifest.webmanifest$/.test(evt.request.url) ) {
                            return cachedResponse || fetch(evt.request);
                        } else {
                            // console.log(`Fetched from CACHE: ${evt.request.url}`);
                            return cachedResponse; // || fetch(evt.request); // No fallback on network. Fetch only from cache. The app files are all-in-one thing.
                        }
                    });
            })
    );
});


self.addEventListener('install', evt => {
    console.info('New ServiceWorker installing...');
    // self.skipWaiting();
    evt.waitUntil(
        caches
            .open(appCacheName)
            .then( cache => {
                console.info(`New ServiceWorker install - Stored all the static assets to the cache: ${appCacheName}`);
                return cache.addAll(staticAssets);
            })
            .catch( () => {
                console.error('New ServiceWorker INSTALL ERROR!');
                })
    );
    console.info('New ServiceWorker installed.');
});


self.addEventListener('activate', evt => {
    if (keepOldCache) {
        console.info('New ServiceWorker activeted (because it could not be avoided), but THE APP HAS NOT BEEN UPDATED because the user disabled automatic upgrades.');
        if (keepOldCache !== appCacheName) {
            caches.delete(appCacheName);
        }
    } else {
        evt.waitUntil(
            caches
                .keys()
                .then( cacheNamesKeys => cacheNamesKeys.filter(cacheName => deprecatedCaches.includes(cacheName)))
                .then( cacheNamesKeys => { 
                    Promise.all(
                        cacheNamesKeys.map( cacheName => {
                            // if (deprecatedCaches.includes(cacheName)) {
                            console.log(`New ServiceWorker is deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                            // }
                        })
                    );
                })
                .then( () => {
                    // clients.claim() // Unuseful (https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim)
                    console.log(`New ServiceWorker activated. The new cache "${appCacheName}" is ready to handle fetches.`);
                })
        );
    }
});
