/* globals caches */

"use strict";

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
        var humPWA = {
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
                    promptMsg1 = 'New version available!\nINSTALL NOW ?\n\n',
                    promptMsg2 = '';
                promptMsg1 += 'Click OK to refresh the page and install the new version.\n';
                promptMsg1 += 'or\n';

                if (localStorageOK) {
                    promptMsg1 += 'Click CANCEL to freeze the installation and choose whether to do it later or keep the current version.';

                    promptMsg2 += 'Installation has been suspended.\nDO YOU WANT TO KEEP THIS VERISION ?\n\n';
                    
                    promptMsg2 += 'Click OK to stop installing the new version and keep the current version. ';
                    promptMsg2 += 'Update notifications will be hidden until the next available update. ';
                    promptMsg2 += 'To update the app before the next update, you will need to proceed manually by clicking on the appropriate button in the "APP" section.\n';
                    promptMsg1 += 'or\n';

                    promptMsg2 += 'Click CANCEL to postpone/delay the install when all windows of the app will be closed. ';
                    promptMsg2 += 'The new version will be available when you reopen the app.\n\n';
                    promptMsg2 += 'WARNING: If you close this windows now the update could apply!';
                } else {
                    promptMsg1 += 'Click CANCEL to postpone/delay the install when all windows of the app will be closed. ';
                    promptMsg1 += 'The new version will be available when you reopen the app.\n\n';
                    promptMsg1 += 'WARNING: If you close this windows now the update could apply!';
                }

                // INSTALL
                if (window.confirm(promptMsg1 +'\n\n'+ trigger)) {
                    console.info('The app UPDATE has been ACCEPTED by the user.');
                    if (getLocalStorageStatus().write) {
                        localStorage.removeItem('keepOldCache');
                    }
                    swRegistration.waiting.postMessage({
                        action: 'keepOldCache',
                        value: false
                    });
                    swRegistration.waiting.postMessage({action: 'skipWaiting'});
                // SKIP INSTALL
                } else {
                    if (localStorageOK) {
                        // ABORT INSTALL - KEEP CURRET VERSION
                        if (window.confirm(promptMsg2)) {
                            console.info('The app UPDATE has been ABOTED by the user. The current version of the app is preserved.');

                            let oldCacheName = localStorage.getItem('keepOldCache');
                                if (!oldCacheName) {
                                    localStorage.setItem('keepOldCache', humPWA.appCacheName);
                                }
                            
                            swRegistration.waiting.postMessage({
                                action: 'keepOldCache',
                                value: localStorage.getItem('keepOldCache')
                            });
                            
                            swRegistration.waiting.postMessage({action: 'skipWaiting'});
                        
                        // POSTPONE UPDATE
                        } else {
                            console.info('The app UPDATE has been POSTPONED by the user.');
                            localStorage.removeItem('keepOldCache');
                        }
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
        link.setAttribute('href', '/app/manifest.webmanifest');
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
    }
}

