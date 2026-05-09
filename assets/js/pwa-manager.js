 /**
 * @fileoverview PWA (Progressive Web App) lifecycle management for the Harmonicarium application.
 * This file defines the HUM.PwaManager class which provides install, update, and
 * reset controls for the Progressive Web App lifecycle.
 * 
 * @module pwa-manager
 * @memberof HUM
 * @version 0.8.1
 * @author Walter G. Mantovani <armonici.it@gmail.com>
 * @copyright (C) 2017-2026 Walter G. Mantovani
 * @license AGPL-3.0-or-later
 * 
 * @description
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

/**
 * PWA lifecycle manager for the Harmonicarium application.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The HUM.PwaManager class manages the Progressive Web App lifecycle, exposing
 * install, update, and reset commands that delegate to the global `humPWA`
 * service-worker controller. It also checks whether the PWA feature is
 * available and disables irrelevant UI controls accordingly.
 */
HUM.PwaManager = class {
    /**
     * Creates a new PwaManager instance bound to the given HUM instance.
     *
     * @param {HUM} harmonicarium - The parent HUM instance that owns this manager.
     *
     * @description
     * Initializes the PwaManager by:
     * 1. Storing the instance ID and a reference to the parent HUM instance.
     * 2. Creating the parameter management system.
     * 3. Performing an initial PWA availability check.
     */
    constructor(harmonicarium) {
        /**
        * The id of the DHC instance.
        *
        * @member {string}
        */
        this.id = harmonicarium.id;
        this._id = harmonicarium.id;
        /**
        * The name of the `HUM.PwaManager`, useful for group the parameters on the DB.
        * Currently hard-coded as `"pwaManager"`.
        *
        * @member {string}
        */
        this.name = 'pwaManager';
        /**
        * The HUM instance
        *
        * @member {HUM}
        */
        this.harmonicarium = harmonicarium;

        /**
        * Instance of `HUM.PwaManager#Parameters`.
        *
        * @member {HUM.PwaManager.prototype.Parameters}
        */
        this.parameters = new this.Parameters(this);

        this._checkHumPWA();
    }

    /**
     * Attempts to install the Harmonicarium app as a PWA.
     *
     * @returns {void}
     *
     * @description
     * Checks whether the PWA feature is available, then triggers the deferred
     * browser install prompt. If the user accepts, the install button is hidden.
     * If no deferred prompt is available (app already installed), an informational
     * alert is shown and, on mobile environments, the "Open App" button is revealed.
     */
    appInstall() {
        if (this._checkHumPWA()) {
            if (humPWA.deferredPrompt !== false) {
                // Hide the app provided install promotion
                // hideMyInstallPromotion();
                
                // Show the install prompt
                humPWA.deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                humPWA.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                        this.parameters.appManager.uiElements.fn.appInstall.setAttribute("style", "display: none;");
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                });
            } else {
                let msg = 'The Harmonicarium App seems to be already installed.';
                
                if (!window.matchMedia('(display-mode: standalone)').matches) { // @todo - check also navigator.standalone for iOS (https://web.dev/customize-install/)
                    msg += '\n\nIf you are on a MOBILE environment, try open the App by clicking on the button "Try to open the App".';
                    msg += "\n\nIf you are on a DESKTOP environment, you should find the App in your OS'sinstalled apps list.";
                    this.parameters.appManager.uiElements.fn.appOpen.setAttribute("style", "display: block;");
                }
                alert(msg);
            }
        }
    }
    /**
     * Attempts to apply a pending service-worker update for the PWA.
     *
     * @returns {void}
     *
     * @description
     * Delegates to `humPWA.checkUpdates()` after verifying that the PWA
     * feature is available via `_checkHumPWA()`.
     */
    appUpdate() {
        if (this._checkHumPWA()) {
            humPWA.checkUpdates();
        }
    }
    /**
     * Resets the PWA by unregistering the current service worker.
     *
     * @returns {void}
     *
     * @description
     * Delegates to `humPWA.swAppReset()` after verifying that the PWA
     * feature is available via `_checkHumPWA()`.
     */
    appReset() {
        if (this._checkHumPWA()) {
            humPWA.swAppReset();
        }
    }
    /**
     * Checks whether the global `humPWA` PWA controller is available.
     *
     * @returns {boolean} `true` if `humPWA` is a valid object, `false` otherwise.
     *
     * @description
     * Inspects the global `humPWA` variable:
     * - If it is an object, the PWA feature is considered available and the
     *   status info text is updated accordingly.
     * - If it is a string, it is treated as an existing error message and
     *   displayed as-is.
     * - If it is `undefined`, a warning is logged and `humPWA` is set to the
     *   error message string to prevent repeated checks.
     * - Any other type causes an error to be logged.
     * When unavailable, all PWA action buttons are hidden via the `d-none` class.
     */
    _checkHumPWA() {
        let msg = '';
        if (typeof humPWA === 'object') {
            msg = 'The PWA feature seems to be available.';
            this.parameters.appManager.uiElements.out.appUpdateInfo.innerText = msg;
            return true;
        } else {
            if (typeof humPWA === 'string') {
                msg = humPWA;
                // do nothing
            } else if (typeof humPWA === 'undefined') {
                msg = 'It seems that the pwa.js file has not been loaded.';
                window.humPWA = msg;
                console.warn('HARMONICARIUM: '+msg);
            } else {
                msg = 'The "humPWA" global variable has an unexpected value.';
                console.error(msg);
                // throw new Error('HARMONICARIUM: '+msg);
            }
            this.parameters.appManager.uiElements.out.appUpdateInfo.innerText = msg;
            this.parameters.appManager.uiElements.fn.appInstall.classList.add('d-none');
            this.parameters.appManager.uiElements.fn.appUpdate.classList.add('d-none');
            this.parameters.appManager.uiElements.fn.appReset.classList.add('d-none');
            this.parameters.appManager.uiElements.fn.appOpen.classList.add('d-none');
            return false;
        }
    }

};

/**
 * Container class for all {@link HUM.Param} objects belonging to a {@link HUM.PwaManager} instance.
 *
 * @class
 * @memberof HUM.PwaManager
 *
 * @description
 * Instantiates and holds the parameter that provides proxy access to the PWA
 * management UI controls: install, update, reset, and open buttons, plus the
 * status info text element.
 */
HUM.PwaManager.prototype.Parameters = class {
    /**
     * Creates a Parameters instance for the given PwaManager.
     *
     * @param {HUM.PwaManager} pwaManager - The parent PwaManager instance.
     */
    constructor(pwaManager) {
        /**  
         * This property is a proxy for the PWA management command buttons on the UI.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn               - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.fn.appInstall    - The HTML of the PWA install button.
         * @property {HTMLElement} uiElements.fn.appUpdate     - The HTML of the PWA update button.
         * @property {HTMLElement} uiElements.fn.appReset      - The HTML of the PWA reset button.
         * @property {HTMLElement} uiElements.fn.appOpen        - The HTML of the PWA open button.
         * @property {HTMLElement} uiElements.out.appUpdateInfo - The HTML of the PWA status info text box.
         */
        this.appManager = new HUM.Param({
            app:pwaManager,
            idbKey:'pwaAppManager',
            uiElements:{
                'appInstall': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    eventType: 'click',
                    eventListener: evt => {
                        pwaManager.appInstall();
                    }
                }),
                'appUpdate': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    eventType: 'click',
                    eventListener: evt => {
                        pwaManager.appUpdate();
                    }
                }),
                'appReset': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    eventType: 'click',
                    eventListener: evt => {
                        pwaManager.appReset();
                    }
                }),
                'appOpen': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    eventType: 'click',
                }),
                'appUpdateInfo': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            presetStore:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.uiElements.fn.appOpen.setAttribute("style", "display: none;");
                if (window.matchMedia('(display-mode: standalone)').matches) {  // @todo - check also navigator.standalone for iOS (https://web.dev/customize-install/)
                    thisParam.uiElements.fn.appInstall.setAttribute("style", "display: none;");
                }  
            }
        });
    }
};
