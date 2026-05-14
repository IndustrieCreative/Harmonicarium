/**
 * @fileoverview Parameters class for the Harmonicarium PWA lifecycle manager.
 * This file defines the {@link HUM.PwaManager.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.PwaManager} instance (install, update, reset, and open command
 * buttons, plus the status info text element). It is split out from the
 * main {@link module:pwa-manager} module.
 *
 * @module pwa-manager-parameters
 * @memberof HUM.PwaManager
 * @version 0.8.2
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
     * Creates a new Parameters instance for the given PwaManager component.
     *
     * @param {HUM.PwaManager} pwaManager - The PwaManager instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the PWA management panel:
     * - `appManager`: Proxy for the install, update, reset, and open command
     *   buttons and the status info text element.
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
