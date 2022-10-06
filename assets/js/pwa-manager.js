 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2022 by Walter G. Mantovani (http://armonici.it).
 * Written by Walter Mantovani.
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

/* globals HUM */
/* globals humPWA */

"use strict";

/** 
 * The PWA management app<br>
 *    Some commands to manage the Progressive Web App.
 */
HUM.PwaManager = class {

     /**
     * @param {HUM} harmonicarium - The HUM instance to which this DHC must refer
     */
    constructor(harmonicarium) {
        /**
        * The HUM instance
        *
        * @member {HUM}
        */
       
        this.id = harmonicarium.id;
        this._id = harmonicarium.id;
        this.name = 'pwaManager';
        this.harmonicarium = harmonicarium;

        this.parameters = new this.Parameters(this);

        this._checkHumPWA();
    }

    /*==============================================================================*
     * UI PWA MANAGEMENT
     *==============================================================================*/
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
    appUpdate() {
        if (this._checkHumPWA()) {
            humPWA.checkUpdates();
        }
    }
    appReset() {
        if (this._checkHumPWA()) {
            humPWA.swAppReset();
        }
    }
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

HUM.PwaManager.prototype.Parameters = class {
    constructor(pwaManager) {

        this.appManager = new HUM.Param({
            app:pwaManager,
            idbKey:'pwaAppManager',
            uiElements:{
                'appInstall': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    // htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        pwaManager.appInstall();
                    }
                }),
                'appUpdate': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    // htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        pwaManager.appUpdate();
                    }
                }),
                'appReset': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    // htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        pwaManager.appReset();
                    }
                }),
                'appOpen': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'run',
                    widget:'button',
                    // htmlTargetProp:'checked',
                    eventType: 'click',
                }),
                'appUpdateInfo': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            // init:false,
            // dataType:'string',
            // initValue:'closed',
            // allowedValues: ['installed', 'deferred', 'running'],
            postInit: (thisParam) => {
                thisParam.uiElements.fn.appOpen.setAttribute("style", "display: none;");
                if (window.matchMedia('(display-mode: standalone)').matches) {  // @todo - check also navigator.standalone for iOS (https://web.dev/customize-install/)
                    thisParam.uiElements.fn.appInstall.setAttribute("style", "display: none;");
                }  
            }
        });
    }
    // _init() {

    // }
};
