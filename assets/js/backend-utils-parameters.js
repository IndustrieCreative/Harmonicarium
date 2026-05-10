/**
 * @fileoverview Parameters class for the Harmonicarium BackendUtils.
 * This file defines the {@link HUM.BackendUtils.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.BackendUtils} instance (side panel, log panel, log text, side
 * navigation, side menu, and modal dialog management). It is split out from
 * the main {@link module:backend-utils} module.
 *
 * @module backend-utils-parameters
 * @memberof HUM.BackendUtils
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
 * Container class for all {@link HUM.Param} objects belonging to a {@link HUM.BackendUtils} instance.
 *
 * @class
 * @memberof HUM.BackendUtils
 *
 * @description
 * Instantiates and holds the parameters that control the backend UI components:
 * side panel visibility (`sidePanel`), log panel visibility (`logPanel`),
 * log text display (`logText`), side navigation behavior (`sideNav`),
 * side menu proxy (`sideMenu`), and modal dialog management (`dialogModal`).
 */
HUM.BackendUtils.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given BackendUtils controller.
     *
     * @param {HUM.BackendUtils} backendUtils - The BackendUtils instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the backend UI:
     * - `sidePanel`: Controls side panel visibility with `"closed"`, `"half"`, and `"full"` states.
     * - `logPanel`: Controls log panel visibility with `"closed"` and `"open"` states.
     * - `logText`: Proxy for the log textbox DOM element.
     * - `sideNav`: Registers the Bootstrap tab event listener for the side navigation.
     * - `sideMenu`: Proxy for the side menu and its sub-page DOM elements.
     * - `dialogModal`: Tool for creating and controlling Bootstrap modal dialogs.
     */
    constructor(backendUtils) {
        /**  
         * This property controls the visibility of the side panel (settings) and initialises the
         * eventListener of the UIelems related to it.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {('closed'|'half'|'full')} value                      - The visibility one wants to achieve.
         * @property {Object}                   uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}                   uiElements.out             - Namespace for the "out" HTML elements.
         * @property {Object}                   uiElements.fn              - Namespace for the "fn" HTML elements.
         * @property {HTMLElement}              uiElements.out.sidePanel   - The HTML side panel.
         * @property {HTMLElement}              uiElements.fn.sideCloseBtn - The HTML close button of the side panel.
         * @property {HTMLElement}              uiElements.fn.sideHalfBtn  - The HTML half button of the side panel.
         * @property {HTMLElement}              uiElements.fn.sideFullBtn  - The HTML full button of the side panel.
         */
        this.sidePanel = new HUM.Param({
            app: backendUtils,
            idbKey: 'backendSidePanel',
            uiElements: {
                'sidePanel': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'sideCloseBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'button',
                    htmlTargetProp: 'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.sidePanel.valueUI = 'closed';
                    }
                }),
                'sideHalfBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'button',
                    htmlTargetProp: 'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.sidePanel.valueUI = 'half';
                    }
                }),
                'sideFullBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'button',
                    htmlTargetProp: 'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.sidePanel.valueUI = 'full';
                    }
                }),
            },
            init: false,
            dataType: 'string',
            initValue: 'closed',
            presetStore: false,
            presetRestore: false,
            restoreStage: 'pre',
            allowedValues: ['closed', 'half', 'full'],
            postSet: (value, thisParam, init) => {
                // backendUtils.showSidebar(value);
                let sidePanel = thisParam.uiElements.out.sidePanel,
                    dpPadContainer = backendUtils.harmonicarium.html.dpPadContainer;
    
                if (value === 'full') {
                    sidePanel.style.width = "100%"; 
                    dpPadContainer.style.width = '1%';
                    dpPadContainer.classList.add('d-none');
                    sidePanel.classList.add('hum-modal-full', 'hum-modal-shown');
                    sidePanel.classList.remove('hum-modal-half');
                } else if (value === 'half') {
                    sidePanel.style.width = "50%"; 
                    dpPadContainer.style.width = '50%';
                    dpPadContainer.classList.remove('d-none');
                    sidePanel.classList.add('hum-modal-half', 'hum-modal-shown');
                    sidePanel.classList.remove('hum-modal-full');
                } else if (value === 'closed') {
                    sidePanel.style.width = "0%";
                    dpPadContainer.style.width = "100%";
                    dpPadContainer.classList.remove('d-none');
                    sidePanel.classList.remove('hum-modal-half', 'hum-modal-full', 'hum-modal-shown');
                }
                backendUtils.harmonicarium.components.dpPad.windowResize();
            }
        });
        /**  
         * This property controls the visibility of the log panel and initialises the
         * eventListener of the UIelems related to it.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {('closed'|'open')} value                     - The visibility one wants to achieve.
         * @property {Object}            uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}            uiElements.out            - Namespace for the "out" HTML elements.
         * @property {Object}            uiElements.fn             - Namespace for the "fn" HTML elements.
         * @property {HTMLElement}       uiElements.out.logPanel   - The HTML log panel.
         * @property {HTMLElement}       uiElements.fn.logCloseBtn - The HTML close button of the log panel.
         * @property {HTMLElement}       uiElements.fn.logTestBtn  - The HTML test button of the log panel.
         */
        this.logPanel = new HUM.Param({
            app: backendUtils,
            idbKey: 'backendLogPanel',
            uiElements: {
                'logPanel': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'logCloseBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'button',
                    htmlTargetProp: 'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.logPanel.valueUI = 'closed';
                    }
                }),
                'logTestBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'button',
                    htmlTargetProp: 'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        backendUtils.tester();
                    }
                }),
            },
            init: false,
            dataType: 'string',
            initValue: 'closed',
            presetStore: false,
            presetRestore: false,
            restoreStage: 'pre',
            allowedValues: ['closed', 'open'],
            postSet: (value, thisParam, init) => {
                let logPanel = thisParam.uiElements.out.logPanel,
                    logCloseBtn = thisParam.uiElements.fn.logCloseBtn;
            
                if (value === 'closed') {
                    logPanel.style.height = "0%";
                    logCloseBtn.classList.remove('hum-modal-shown');
                } else if (value === 'open') {
                    logPanel.style.height = "35%";  
                    logCloseBtn.classList.add('hum-modal-shown');
                }
            }
        });
        /**
         * This property is a proxy for the UIelem of the textbox of the log panel (common to all dhc instances).
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements             - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out         - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.logText - The HTML log textbox.
         */
        this.logText = new HUM.Param({
            app: backendUtils,
            idbKey: 'backendLogText',
            uiElements: {
                'logText': new HUM.Param.UIelem({
                    role: 'out',
                })
            },
            postInit: (thisParam) => {
                thisParam.uiElements.out.logText.innerHTML = 
                "<p>>>>>>>>> > Welcome to the Harmonicarium!</p><p>...</p><p>..</p><p>.</p>";
            },
            presetStore: false,
            presetRestore: false,
        });
        /**  
         * This property initialises the eventListener of the sideNav UIelem.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements             - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out         - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.sideNav - The HTML side navigation (top).
         */
        this.sideNav = new HUM.Param({
            app: backendUtils,
            idbKey: 'backendSideNav',
            uiElements: {
                'sideNav': new HUM.Param.UIelem({
                    role: 'out',
                    eventType: 'shown.bs.tab',
                    eventListener: evt => {
                        this.sideMenu.uiElements.out.sideMenu.scroll({
                            top: 0,
                            left: 0, 
                            behavior: 'smooth'
                        });
                    }
                }),
            },
            presetStore: false,
            presetRestore: false,
        });
        /**  
         * This property is a proxy for the UIelems related to the side menu.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.sideMenu    - The HTML side menu (accordions' container).
         * @property {HTMLElement} uiElements.out.helpObj     - The HTML help page.
         * @property {HTMLElement} uiElements.out.creditsObj  - The HTML credits page.
         * @property {HTMLElement} uiElements.out.settingsObj - The HTML settings page.
         * @property {HTMLElement} uiElements.out.appObj      - The HTML PWA page.
         */
        this.sideMenu = new HUM.Param({
            app: backendUtils,
            idbKey: 'backendSideMenu',
            uiElements: {
                'sideMenu': new HUM.Param.UIelem({
                    htmlID: backendUtils.harmonicarium.html.sideMenu.id,
                    role: 'out',
                }),
                    'helpObj': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'creditsObj': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'settingsObj': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'appObj': new HUM.Param.UIelem({
                        role: 'out',
                    }),
            },
            presetStore: false,
            presetRestore: false,
        });
        // 
        /**
         * This property is a tool for creating a modal dialog by setting the `value` property with an object
         * containing the right properties. It's also a proxy for the UIelems related to the modal dialog.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}          value                                  - Object containing the arguments useful for modal dialog customization.
         * @property {string}          value.hTitle                           - The modal dialog title text.
         * @property {function(Event)} value.hCancel                          - The function to be executed when the dialog header cancel button is clicked.
         * @property {HTMLElement}     value.body                             - The HTML of the modal dialog header.
         * @property {string}          value.fCancelTxt                       - The cancel button text of the modal dialog. 
         * @property {function(Event)} value.fCancel                          - The function to be executed when the dialog footer cancel button is clicked.
         * @property {string}          value.fOKTxt                           - The OK button text of the modal dialog. 
         * @property {function(Event)} value.fOK                              - The function to be executed when the dialog footer OK button is clicked.
         * @property {boolean}         value.visible                          - Whether the dialog should be visible or not.
         * @property {Object}          uiElements                             - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}          uiElements.out                         - Namespace for the "out" HTML elements.
         * @property {HTMLElement}     uiElements.out.dialogModalContainer    - The HTML modal dialog container.
         * @property {HTMLElement}     uiElements.out.dialogModal             - The HTML modal dialog box.
         * @property {HTMLElement}     uiElements.out.dialogModalContent      - The HTML modal dialog content.
         * @property {HTMLElement}     uiElements.out.dialogModalHeader       - The HTML modal dialog header.
         * @property {HTMLElement}     uiElements.out.dialogModalHeaderTitle  - The HTML modal dialog title.
         * @property {HTMLElement}     uiElements.out.dialogModalHeaderCancel - The HTML modal dialog header cancel button.
         * @property {HTMLElement}     uiElements.out.dialogModalBody         - The HTML modal dialog body.
         * @property {HTMLElement}     uiElements.out.dialogModalFooter       - The HTML modal dialog footer.
         * @property {HTMLElement}     uiElements.out.dialogModalFooterCancel - The HTML modal dialog footer cancel button.
         * @property {HTMLElement}     uiElements.out.dialogModalFooterOK     - The HTML modal dialog footer OK button.
         * @property {HTMLElement}     uiElements.out.dialogModalContents     - The HTML modal dialog container for body contents.
         */
        this.dialogModal = new HUM.Param({
            app: backendUtils,
            idbKey: 'backendDialogModal',
            uiElements: {
                'dialogModalContainer': new HUM.Param.UIelem({role: 'out'}),
                    'dialogModal': new HUM.Param.UIelem({role: 'out'}),
                        'dialogModalContent': new HUM.Param.UIelem({role: 'out'}),
                            'dialogModalHeader': new HUM.Param.UIelem({role: 'out'}),
                                'dialogModalHeaderTitle': new HUM.Param.UIelem({role: 'out'}),
                                'dialogModalHeaderCancel': new HUM.Param.UIelem({role: 'out'}),
                            'dialogModalBody': new HUM.Param.UIelem({role: 'out'}),
                            'dialogModalFooter': new HUM.Param.UIelem({role: 'out'}),
                                'dialogModalFooterCancel': new HUM.Param.UIelem({role: 'out'}),
                                'dialogModalFooterOK': new HUM.Param.UIelem({role: 'out'}),
                'dialogModalContents': new HUM.Param.UIelem({role: 'out'})
            },
            init: false,
            presetStore: false,
            presetRestore: false,
            postInit: (thisParam) => {
                let modal = thisParam.uiElements.out;
                thisParam.bsModal = new bootstrap.Modal(modal.dialogModalContainer, {
                    keyboard: false,
                    backdrop: 'static'
                });
            },
            postSet: ({
                container,
                dialog,
                content,
                header,
                  hTitle,
                  hCancel,
                  body,
                footer,
                fCancelTxt,
                  fCancel,
                  fOKTxt,
                  fOK,
                  visible,
                reset
            }={}, thisParam=false, init=false) => {
                if (!init) {
                    let modal = thisParam.uiElements.out;
                    thisParam.bsModal = new bootstrap.Modal(modal.dialogModalContainer, {
                        keyboard: false,
                        backdrop: 'static'
                    });

                    if (hTitle) {
                        modal.dialogModalHeaderTitle.innerText = hTitle;
                    }

                    if (body) {
                        modal.dialogModalBody.appendChild(body);
                    }

                    if (hCancel) {
                        modal.dialogModalHeaderCancel.addEventListener('click', evt => {
                            hCancel(evt);
                            if (body) {
                                thisParam.uiElements.out.dialogModalContents.appendChild(body);
                            }
                        });
                    } else {
                        modal.dialogModalHeaderCancel.addEventListener('click', () => {
                            thisParam.bsModal.hide();
                            if (body) {
                                thisParam.uiElements.out.dialogModalContents.appendChild(body);
                            }
                        });
                    }

                    if (fOKTxt) {
                        modal.dialogModalFooterOK.innerText = fOKTxt;
                    } else {
                        modal.dialogModalFooterOK.innerText = 'OK';
                    }

                    if (fCancelTxt) {
                        modal.dialogModalFooterCancel.innerText = fCancelTxt;
                    } else {
                        modal.dialogModalFooterCancel.innerText = 'Cancel';
                    }

                    if (fOK) {
                        modal.dialogModalFooterOK.classList.remove('d-none');
                        modal.dialogModalFooterOK.addEventListener('click', fOK);
                        // modal.dialogModalFooterOK.innerText = fOK.label;
                    } else {
                        modal.dialogModalFooterOK.classList.add('d-none');
                    }

                    if (fCancel) {
                        modal.dialogModalFooterCancel.addEventListener('click', evt => {
                            fCancel(evt);
                            if (body) {
                                thisParam.uiElements.out.dialogModalContents.appendChild(body);
                            }
                        });
                    } else {
                        modal.dialogModalFooterCancel.addEventListener('click', () => {
                            thisParam.bsModal.hide();
                            if (body) {
                                thisParam.uiElements.out.dialogModalContents.appendChild(body);
                            }
                        });
                    }

                    if (visible) {
                        thisParam.bsModal.show();
                    } else {
                        thisParam.bsModal.hide();
                    }
                }
            },
        });

    }
    /**
     * Initializes the parameters that require deferred setup.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on the `sidePanel`, `logPanel`, and `dialogModal`
     * parameters to register their event listeners and complete their
     * Bootstrap widget setup.
     */
    _init() {
        this.sidePanel._init();
        this.logPanel._init();
        this.dialogModal._init();
    }

};
