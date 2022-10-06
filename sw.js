/* globals self */
/* globals caches */

// version: 0.28

"use strict";

/*
 * NOTE: The "keepOldCache" feature is currently not working.
 *       A lot of code here about this feature is unused in "production".
 *       Trying to give to the user the chance to decide if upgrade or not.
 */

var keepOldCache = false;

const appCacheName = 'kepler-cache-beta-v28';

const deprecatedCaches = [
    // 'kepler-cache',
    // 'kepler-cache-v1',
    // 'kepler-cache-v21',
    // 'kepler-cache-v22',
    // 'kepler-cache-v23',
    // 'kepler-cache-v24',
    // 'kepler-cache-v25',
    // 'kepler-cache-v26',
    // 'kepler-cache-v27',
    // 'kepler-cache-v28',
    // 'kepler-cache-v29',
    // 'kepler-cache-v30',
    // 'kepler-cache-v31',
    'kepler-cache-beta-v1',
    'kepler-cache-beta-v2',
    'kepler-cache-beta-v3',
    'kepler-cache-beta-v4',
    'kepler-cache-beta-v5',
    'kepler-cache-beta-v6',
    'kepler-cache-beta-v7',
    'kepler-cache-beta-v8',
    'kepler-cache-beta-v9',
    'kepler-cache-beta-v10',
    'kepler-cache-beta-v11',
    'kepler-cache-beta-v12',
    'kepler-cache-beta-v13',
    'kepler-cache-beta-v14',
    'kepler-cache-beta-v15',
    'kepler-cache-beta-v16',
    'kepler-cache-beta-v17',
    'kepler-cache-beta-v18',
    'kepler-cache-beta-v19',
    'kepler-cache-beta-v20',
    'kepler-cache-beta-v21',
    'kepler-cache-beta-v22',
    'kepler-cache-beta-v23',
    'kepler-cache-beta-v24',
    'kepler-cache-beta-v25',
    'kepler-cache-beta-v26',
    'kepler-cache-beta-v27',
];

const staticAssets = [
    // # find /.../appdir -type f
    './',
    './index.html',
    './pwa.js',
    './manifest.webmanifest',
    './favicon.png',

    // './assets/',

    // './assets/css/',
    './assets/css/styles.css',
    './assets/css/lib/bootstrap.min.css',
    './assets/css/lib/bootstrap.min.css.map',

    // './assets/js/',
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
    './assets/js/parameter.js',
    './assets/js/message.js',
    './assets/js/pwa-manager.js',
    './assets/js/synth-ir-default.js',
    './assets/js/synth.js',
    './assets/js/templates.js',
    './assets/js/user.js',

    // './assets/js/lib/',
    './assets/js/lib/web-audio-peak-meter_v2.js',
    './assets/js/lib/qwerty-hancock-dist.js',
    './assets/js/lib/synthlist.js',
    './assets/js/lib/bootstrap.bundle.min.js.map',
    './assets/js/lib/bootstrap.bundle.min.js',

    // './assets/img/',
    './assets/img/agpl.png',
    './assets/img/pwa_logo_inverse.png',
    './assets/img/n-edx.png',
    './assets/img/n-edx_light.png',
    './assets/img/logo.png',

    // './assets/img/appicons/',
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

    // './assets/font/',
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
            .catch( err => {
                console.error('New ServiceWorker INSTALL ERROR! – ' + err);
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
