/* globals caches, humPWA, harmonicarium1 */

"use strict";

/*
 * NOTE: The "keepOldCache" feature is currently not working.
 *       A lot of code here about this feature is unused in "production".
 *       Trying to give to the user the chance to decide if upgrade or not.
 */

// @see https://dev.to/zigabrencic/web-browser-local-storage-16jh
function getLocalStorageStatus() {
    let test = 'test';
    try {
        // Try setting an item
        localStorage.setItem('test', test);
        localStorage.removeItem('test');
    }
    catch (err) {   
        // Browser specific checks if local storage was exceeded
        //                  Chrome                               Firefox/Safari
        if (err.name === 'QUATA_EXCEEDED_ERR' || err.name === 'NS_ERROR_DOM_QUATA_REACHED') {
            // Local storage is full
            return {
                status: 'full',
                read: true,
                write: false
            };
        } else {
            try {
                //        Internet Explorer
                if (localStorage.remainingSpace === 0) {
                    // Local storage is full
                    return {
                        status: 'full',
                        read: true,
                        write: false
                    };
                }
            } catch (e) {
                // "localStorage.remainingSpace" doesn't exist
            }
            // Local storage might not be available
            return {
                status: 'unavailable',
                read: false,
                write: false
            };
        }
    }   
    return {
        status: 'available',
        read: true,
        write: true
    };
}


// If it's not on file:// local protocol
if (window.location.protocol !== 'file:') {
    // If it's on https:// protocol
    if (window.location.protocol === 'https:') {


        // GLOBAL PWA tools container/namespace
        window.humPWA = {
            deferredPrompt: false,
            justInstalled: false,
            appCacheName: false,

            swPostRegistration: function(reg) {
                console.info('ServiceWorker registered with scope: ', reg.scope);
                // reg.installing; // the installing worker, or undefined
                // reg.waiting; // the waiting worker, or undefined
                // reg.active; // navigator.serviceWorker.controller // the active worker, or undefined
                
                if (!reg) {
                    return;
                }

                // if (reg.installing) {
                //     reg.installing.addEventListener('statechange', (evt) => {
                //         if (evt.target.state === 'installed') {
                //             humPWA.promptUserToRefresh(reg, 28);
                //         }
                //     });
                // }
                
                if (reg.waiting) {
                    humPWA.promptUserToRefresh(reg, 34);
                }

                reg.addEventListener('updatefound', () => {
                    // A wild service worker has appeared in reg.installing!
                    const newWorker = reg.installing;
                    console.info(`A new version of the ServiceWorker has been detected. Its current state is: ${newWorker.state}`);

                    // newWorker.state;
                        // "installing" - the install event has fired, but not yet complete
                        // "installed"  - install complete
                        // "activating" - the activate event has fired, but not yet complete
                        // "activated"  - fully active
                        // "redundant"  - discarded. Either failed install, or it's been
                        //                replaced by a newer version

                    newWorker.addEventListener('statechange', (evt) => {
                        // newWorker.state has changed
                        console.info(`The new version of the ServiceWorker has changed its state in: ${evt.target.state}`);
                        
                        if (evt.target.state === 'installed') {
                            // Ask to the user only if there is an active ServiceWorker
                            if (navigator.serviceWorker.controller) {
                                humPWA.promptUserToRefresh(reg, 55);
                            }
                        }

                        if (evt.target.state === 'activating') {
                            if (localStorage.getItem('keepOldCache')) {
                                evt.target.postMessage({
                                    action: 'keepOldCache',
                                    value: localStorage.getItem('keepOldCache')
                                });
                            }
                        }

                    });
                });
            },

            checkUpdates: function() {
                console.info('Checking for updates...');
                navigator.serviceWorker.getRegistration('./')
                .then( oldReg => {
                    oldReg
                        .update()
                        .then( newReg => {
                            if (newReg !== oldReg) {
                                console.info('Update found! Installing the new ServiceWorker.');
                                humPWA.swPostRegistration(newReg);
                            } else {
                                if (oldReg.waiting) {
                                    humPWA.promptUserToRefresh(oldReg, 78);
                                } else {
                                    console.info('Nothing to update.');
                                }
                            }
                        });
                });
            },
            // unregister: function() {
            //     humPWA.registrationSW
            //         .uregister()
            //         .then( bool => {
            //             if (bool) {
            //                 console.info('The registered ServiceWorker has been unregistred.');
            //             }
            //         });
            // },
            swAppReset: function() {
                if (getLocalStorageStatus().write) {
                    localStorage.removeItem('keepOldCache');
                }
                navigator.serviceWorker.getRegistration('./')
                .then( swRegistration => {
                    if (swRegistration) {
                        swRegistration.unregister()
                        .then( bool => {
                            if (bool) {
                                caches
                                .delete(humPWA.appCacheName)
                                .then( () => {
                                    alert('The ServiceWorker has been unregistered and the Cache deleted.\n\nClick OK to reload the app and install the last version.');
                                    window.location.reload();
                                })
                                .catch( () => {
                                    alert('The ServiceWorker has been unregistered but DELETING CACHE FAILED!\n\nClick OK to reload the app and install the last version.');
                                    window.location.reload();
                                });
                            }
                        });
                    } else {
                        alert("Couldn't get ServiceWorker... Is it installed?");
                    }
                });
            },            

            promptUserToRefresh: function(swRegistration, trigger) {
                let localStorageOK = getLocalStorageStatus().status === 'available',
                    promptMsg1 = '*** New version available! INSTALL NOW ? ***\n\n' +
                                 "Click [OK] to refresh this page and all the app sessions' windows/tabs and INSTALL THE NEW VERSION.\n" +
                                 'or\n' +
                                 "Click [CANCEL] to POSTPONE/DELAY THE INSTALL when all the app sessions' windows/tabs will be closed. " +
                                 'The new version will be available when you reopen the app.\n\n' +
                                 'WARNING: If this is the only active session and you close this window/tab now, the update could apply.';

                // [...]     promptMsg2 = '';

                // [...] if (localStorageOK) {
                // [...]     promptMsg1 += 'Click CANCEL to freeze the installation and choose whether to do it later or keep the current version.';

                // [...]     promptMsg2 += 'Installation has been suspended.\nDO YOU WANT TO KEEP THIS VERISION ?\n\n' +

                // [...]                   'Click OK to stop installing the new version and KEEP THE CURRENT VERSION. ' +
                // [...]                   'Update notifications will be hidden until the next available update. ' +
                // [...]                   'To update the app before the next update, you will need to proceed manually by clicking on the appropriate button in the "APP" section.\n' +
                // [...]                   'or\n' +

                // [...]                   'Click CANCEL to POSTPONE/DELAY THE INSTALL when all windows of the app will be closed. ' +
                // [...]                   'The new version will be available when you reopen the app.\n\n' +
                // [...]                   'WARNING: If you close this windows now the update could apply!';
                // [...] } else {
                // [...]     promptMsg1 += 'Click CANCEL to POSTPONE/DELAY THE INSTALL when all windows of the app will be closed. ' +
                // [...]                   'The new version will be available when you reopen the app.\n\n' +
                // [...]                   'WARNING: If you close this windows now the update could apply!';
                // [...] }

                // INSTALL
                if (window.confirm(promptMsg1 +'\n\n'+ trigger)) {
                    console.info('The app UPDATE has been ACCEPTED by the user.');

                    // @todo: Implement registration!!
                    //        (no hardcoded instance name!! argh...) 
                    if (harmonicarium1 && harmonicarium1.broadcastChannel) {
                        // Try to close all other concurrent sessions
                        harmonicarium1.broadcastChannel.send('closeApp'); // , msgData);
                    }
                    setTimeout(() => {
                        if (getLocalStorageStatus().write) {
                            localStorage.removeItem('keepOldCache');
                        }
                        swRegistration.waiting.postMessage({
                            action: 'keepOldCache',
                            value: false
                        });
                        swRegistration.waiting.postMessage({action: 'skipWaiting'});
                    }, 2000);

                // SKIP INSTALL
                } else {
                    if (localStorageOK) {
                        // [...] ABORT INSTALL - KEEP CURRENT VERSION
                        // [...] if (window.confirm(promptMsg2)) {
                        // [...]     console.info('The app UPDATE has been ABOTED by the user. The current version of the app is preserved.');

                        // [...]     let oldCacheName = localStorage.getItem('keepOldCache');
                        // [...]         if (!oldCacheName) {
                        // [...]             localStorage.setItem('keepOldCache', humPWA.appCacheName);
                        // [...]         }
                             
                        // [...]     swRegistration.waiting.postMessage({
                        // [...]         action: 'keepOldCache',
                        // [...]         value: localStorage.getItem('keepOldCache')
                        // [...]     });
                             
                        // [...]     swRegistration.waiting.postMessage({action: 'skipWaiting'});
                        
                        // POSTPONE UPDATE
                        // [...] } else {
                            console.info('The app UPDATE has been POSTPONED by the user.');
                            localStorage.removeItem('keepOldCache');
                        // [...] }
                    }

                    // swRegistration.waiting.postMessage({action: 'cacheServiceWorkerFile'});
                    // console.log(getLocalStorageStatus().write);
                    // console.log(swRegistration);
                    // console.log(swRegistration.waiting);
                    // swRegistration.waiting.terminate();

                }
            }

        };

        // DEFERRED INSTALL notice
        window.addEventListener('beforeinstallprompt', (evt) => {
            // Prevent the mini-infobar from appearing on mobile
            // evt.preventDefault();
            // Stash the event so it can be triggered later.
            humPWA.deferredPrompt = evt;
            // Update UI notify the user they can install the PWA
            // showInstallPromotion();
        });

        // POST INSTALL
        window.addEventListener('appinstalled', (evt) => {
            humPWA.justInstalled = true;
            console.info('The installation of the app was successful!');
        });


        // Add PWA MANIFEST meta element
        let link = document.createElement('link');
        link.setAttribute('rel', 'manifest');
        link.setAttribute('href', '/apps/0.7.0-dev/manifest.webmanifest');
        link.setAttribute('type', 'application/manifest+json');
        document.getElementsByTagName('head')[0].appendChild(link);


        // Register the SERVICEWORKER
        if ('serviceWorker' in navigator && 'caches' in window) {
            // window.addEventListener('load', function() { 

            navigator.serviceWorker.addEventListener('message', messageEvent => {
                switch (messageEvent.data.action) {
                    case 'setAppCacheName':
                        humPWA.appCacheName = messageEvent.data.value;
                        break;
                }
            });

            navigator.serviceWorker
                .register('sw.js')
                .then( reg => {
                    humPWA.swPostRegistration(reg);
                })
                .catch( err => {
                    console.error('ServiceWorker registration failed: ', err);
                });

            navigator.serviceWorker
                .ready
                .then( reg => {
                    console.info('The registered ServiceWorker is ready.');
                    reg.active.postMessage({action: 'appCacheNameRequest'});

                    // **** new start ****
                    // if (localStorage.getItem('keepOldCache')) {
                    //     reg.active.postMessage({
                    //         action: 'keepOldCache',
                    //         value: localStorage.getItem('keepOldCache')
                    //     });
                    // }
                    // **** new stop ****

                });


            // navigator.serviceWorker
            //     .getRegistration('./')
            //     .then( registration => {
            //         if(registration){
            //             document.querySelector('#status').textContent = 'ServiceWorkerRegistration found.';  
            //         }
            //     });


            var refreshing; // Avoid infinite loop when using the Chrome Dev Tools “Update on Reload” feature
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.info('A new ServiceWorker has become the active one.');
                if (refreshing) {
                    return;
                }
                refreshing = true;
                if (!localStorage.getItem('keepOldCache') ) {
                    window.location.reload(); // In conjunction with skipWaiting(), to activate the new SW
                }
                // This fires when the service worker controlling this page
                // changes, eg a new worker has skipped waiting and become
                // the new active worker.
            });

            if (!navigator.serviceWorker.controller) {
                console.info('The page has been loaded from the network, not using the ServiceWorker.');
            }

            // });
        }
    } else {
        let msg = 'The PWA feature is available only on https:// protocol.';
        window.humPWA = msg;
        console.warn('HARMONICARIUM PWA: '+msg);
    }
} else {
    let msg = 'You are under file:/// protocol. The PWA feature is available only when the app is hosted on a web server and accessed by https:// protocol.';
    window.humPWA = msg;
    console.warn('HARMONICARIUM PWA: '+msg);
}