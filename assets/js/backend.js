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

"use strict";

/** 
 * The BackendUtils class<br>
 *    A toolset to manage the backend UI.
 */
HUM.BackendUtils = class {
     /**
     * @param {HUM} harmonicarium - The HUM instance to which this DHC must refer
     */
    constructor(harmonicarium) {
        this.id = harmonicarium.id;
        this._id = harmonicarium.id;
        this.name = 'backendUtils';
        /**
        * The HUM instance
        *
        * @member {HUM}
        */
        this.harmonicarium = harmonicarium;
        /**
        * The HUM instance
        *
        * @member {HUM.BackendUtils.prototype.Parameters}
        */
        this.parameters = new this.Parameters(this);

        // =======================
    } // end class Constructor
    // ===========================

    /*==============================================================================*
     * UI EVENTS LOG
     *==============================================================================*/
    /**
     * Log into the HTML Log element the infos passed via the argument
     *
     * @param {string} str - Text string describing the event to log
     */
    eventLog(str) {
        let time = new Date();
        let s = time.getSeconds();
        let m = time.getMinutes();
        let h = time.getHours();
        if (h < 10) {h = "0" + h;}
        if (m < 10) {m = "0" + m;}
        if (s < 10) {s = "0" + s;}
        let logText = this.parameters.logText.uiElements.out.logText;
        logText.innerHTML = "<p>" + h + ":" + m + ":" + s + " > " + str + "</p>" + logText.innerHTML;
        logText.parentElement.scrollTop = logText.scrollHeight;
    }

    showLogPanel(mode='toggle') {
        let logPanel = this.parameters.logPanel.uiElements.out.logPanel,
            logCloseBtn = this.parameters.logPanel.uiElements.fn.logCloseBtn;
        
        if (mode === 'closed') {
            logPanel.style.height = "0%";
            logCloseBtn.classList.remove('hum-modal-shown');
        } else if (mode === 'open') {
            logPanel.style.height = "35%";  
            logCloseBtn.classList.add('hum-modal-shown');
        } else if (mode === 'toggle') {
            if (logCloseBtn.classList.contains('hum-modal-shown')) {
                // Closed %
                this.parameters.logPanel.value = 'closed';
            } else {
                // Open %
                this.parameters.logPanel.value = 'open';
            }
        }
    }

    /*==============================================================================*
     * UI HELP/CREDITS
     *==============================================================================*/
    /**
     * Open the side panel
     */
    // @old icHelp
    showSidebar(mode='toggle') {
        let sidePanel = this.parameters.sidePanel.uiElements.out.sidePanel,
            dpPadContainer = this.harmonicarium.html.dpPadContainer;

        if (mode === 'full') {
            sidePanel.style.width = "100%"; 
            dpPadContainer.style.width = '1%';
            dpPadContainer.classList.add('d-none');
            sidePanel.classList.add('hum-modal-full', 'hum-modal-shown');
            sidePanel.classList.remove('hum-modal-half');
        } else if (mode === 'half') {
            sidePanel.style.width = "50%"; 
            dpPadContainer.style.width = '50%';
            dpPadContainer.classList.remove('d-none');
            sidePanel.classList.add('hum-modal-half', 'hum-modal-shown');
            sidePanel.classList.remove('hum-modal-full');
        } else if (mode === 'closed') {
            sidePanel.style.width = "0%";
            dpPadContainer.style.width = "100%";
            dpPadContainer.classList.remove('d-none');
            sidePanel.classList.remove('hum-modal-half', 'hum-modal-full', 'hum-modal-shown');
        } else if (mode === 'toggle') {
            if (sidePanel.classList.contains('hum-modal-shown')) {
                this.parameters.sidePanel.value = 'closed';
            } else {
                if (window.matchMedia("(min-width: 768px)").matches) {
                    this.parameters.sidePanel.value = 'half';
                } else {
                    this.parameters.sidePanel.value = 'full';
                }
            }
        }
        // this.harmonicarium.windowResize();
        this.harmonicarium.components.dpPad.windowResize();
    }

    /*==============================================================================*
     * UI FILE READ ERROR HANDLING
     *==============================================================================*/
    /**
     * Handle errors generated by `FileReader` when loading a file.<br>
     * It is meant to be assigned to `FileReader.onerror` handler.
     *
     * @param {Event} errorEvent - The error event
     */
    fileErrorHandler(errorEvent) {
        switch (errorEvent.target.error.code) {
            case errorEvent.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
            case errorEvent.target.error.NOT_READABLE_ERR:
                alert('File is not readable.');
                break;
            case errorEvent.target.error.ABORT_ERR:
                console.log('FILE: ABORT_ERR');
                break; // void
            default:
                alert('An error occurred reading this file.');
        }
    }

    /*==============================================================================*
     * TEST/DEBUG SECTION
     *==============================================================================*/
    /**
     * Print the DHC tone tables in the console for test/debug purposes
     */
    tester() {
        this.eventLog("TEST: Full tables printed out. Look at the console of your browser.");
        for (const [id, dhc] of Object.entries(this.harmonicarium.components.availableDHCs)) {
            // this.eventLog(JSON.stringify(dhc.tables.ft, null, 2).replace(/}|{|"|,/g, ''));
            console.groupCollapsed(`DHC ${id} 'ctrl_map' table (midi#, FTn, HTn):`);
            console.table(dhc.tables.ctrl);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'ft' table (FTn, Hz, midi#.cent):`);
            console.table(dhc.tables.ft);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'ht' table (HTn, Hz, midi#.cent):`);
            console.table(dhc.tables.ht);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'reverse ft' table (midi#.cent, FTn):`);
            console.table(dhc.tables.reverse.ft);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'reverse ht' table (midi#.cent, HTn):`);
            console.table(dhc.tables.reverse.ht);
            console.groupEnd();
        }
    }

    static emptyHTMLElement(htmlElem) {
        while (htmlElem.firstChild) {
            htmlElem.removeChild(htmlElem.firstChild);
        }
    }
};


HUM.BackendUtils.prototype.Parameters = class {
    constructor(backendUtils) {

        this.sidePanel = new HUM.Param({
            app:backendUtils,
            idbKey:'backendSidePanel',
            uiElements:{
                'sidePanel': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'sideCloseBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget:'button',
                    htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.sidePanel.valueUI = 'closed';
                    }
                }),
                'sideHalfBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget:'button',
                    htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.sidePanel.valueUI = 'half';
                    }
                }),
                'sideFullBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget:'button',
                    htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.sidePanel.valueUI = 'full';
                    }
                }),
            },
            init:false,
            dataType:'string',
            initValue:'closed',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            restoreStage: 'pre',
            allowedValues: ['closed', 'half', 'full'],
            postSet: (value, thisParam, init) => {
                backendUtils.showSidebar(value);
            }
        });

        this.logPanel = new HUM.Param({
            app:backendUtils,
            idbKey:'backendLogPanel',
            uiElements:{
                'logPanel': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'logCloseBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget:'button',
                    htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        this.logPanel.valueUI = 'closed';
                    }
                }),
                'logTestBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'toggle',
                    widget:'button',
                    htmlTargetProp:'checked',
                    eventType: 'click',
                    eventListener: evt => {
                        backendUtils.tester();
                    }
                }),
            },
            init:false,
            dataType:'string',
            initValue:'closed',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            restoreStage: 'pre',
            allowedValues: ['closed', 'open'],
            postSet: (value, thisParam, init) => {
                backendUtils.showLogPanel(value);
            }
        });

        this.sideNav = new HUM.Param({
            app:backendUtils,
            idbKey:'backendSideNav',
            uiElements:{
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
            init:false,
        });

        this.sideMenu = new HUM.Param({
            app:backendUtils,
            idbKey:'backendSideMenu',
            uiElements:{
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
            init:false,
        });

        /**
         *  The global HTML Log element (common to all dhc instances)
         *
         * @type {HTMLElement}
         */
        this.logText = new HUM.Param({
            app:backendUtils,
            idbKey:'backendLogText',
            uiElements:{
                'logText': new HUM.Param.UIelem({
                    role: 'out',
                })
            },
            postInit: (thisParam) => {
                thisParam.uiElements.out.logText.innerHTML = 
                "<p>>>>>>>>> > Welcome to the Harmonicarium!</p><p>...</p><p>..</p><p>.</p>";
            },
        });

        this.dialogModal = new HUM.Param({
            app:backendUtils,
            idbKey:'backendDialogModal',
            uiElements:{
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
            presetStore: false,
            presetAutosave: false,
            presetRestore: false,
            init:false,
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
                        modal.dialogModalFooterOK.addEventListener('click', fOK); // .fn);
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
    _init() {
        this.sidePanel._init();
        this.logPanel._init();
        this.dialogModal._init();
    }

};