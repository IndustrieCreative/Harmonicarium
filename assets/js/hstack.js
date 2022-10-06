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

window.AudioContext = window.AudioContext || window.webkitAudioContext;

/** 
 * The H-Stack class<br>
 *    A tool for visualize the Harmonic Series in the UI
 */
// @old icSYNTH
HUM.Hstack = class {
    /**
    * @param {HUM.DHC} dhc - The DHC instance to which it belongs
    */
    constructor(dhc) {
        this.id = dhc.id;
        this._id = dhc._id;
        this.name = 'hstack';
        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;
        /**
         * An array containing all the used Harmonic/Subharmonic in the controller Keymap
         *
         * @member {Array.<xtnum>}
         */
        this.usedHT = [];

        this.parameters = new this.Parameters(this);

        this.parameters._init();

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 102);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manage and route an incoming message
     *
     * @param {HUM.DHCmsg} msg - The incoming message
     */
    updatesFromDHC(msg) {
        if (msg.cmd === 'init') {
            this.fillin();
            this.ftMonitor(this.dhc.settings.ht.curr_ft);
        }

        if (msg.cmd === 'panic') {
            this.allNotesOff();
        }

        if (msg.cmd === 'update') {
            if (msg.type === 'ft') {

            } else if (msg.type === 'ht' && this.parameters.active.value) {
                
                this.fillin();

            } else if (msg.type === 'ctrlmap') {
                
                this.parameters.hstack._init();
            }

        } else if (msg.cmd === 'tone-on' && this.parameters.active.value) {
            if (msg.type === 'ft') {
                
                // this.fillin();
                this.playFx('ft', 1, msg.xtNum);
            
            } else if (msg.type === 'ht') {
                
                if (msg.xtNum !== 0) {
                    this.playFx("ht", 1, msg.xtNum);
                }

            }

        } else if (msg.cmd === 'tone-off' && this.parameters.active.value) {
            if (msg.type === 'ft') {
                
                this.playFx("ft", 0, msg.xtNum);
            
            } else if (msg.type === 'ht') {

                if (msg.xtNum !== 0) {
                    this.playFx("ht", 0, msg.xtNum);
                }
            }
        }
    }

    /*==============================================================================*
     * UI HSTACK
     *==============================================================================*/
    /**
     * Update the {@link HUM.Hstack#usedHT} property
     */
    updateUsedHT() {
        let usedHT = [];
        for (let key of Object.keys(this.dhc.tables.ctrl)) {
            let ht = this.dhc.tables.ctrl[key].ht;
            if (ht !== 129 && ht !== 0) {
                usedHT.push(ht);
            }
        }
        // Sort the array from max to min
        usedHT.sort( (a, b) => { return b - a; } );
        // Store in the global var the uniquified version of the array useful to this.fillin
        this.usedHT = this.dhc.constructor.uniqArray(usedHT);
    }
    /**
     * Turns off all the rows
     */
    allNotesOff() {
        for (let htNum of this.usedHT) {
            this.playFx("ht", 0, htNum);
        }
        this.playFx("ft", 0, this.dhc.settings.ht.curr_ft);
    }
    /**
     * Fill-in the H-Stack table data 
     */
    // @old icHSTACKfillin
    fillin() {
        // Empty object to store the HTn data
        let htObj = {};
        // For every HT used in the Controller Keymap (this.dhc.tables.ctrl)
        for (let htNum of this.usedHT) {
            // If it's not 0 (piper)
            if (htNum !== 0) {
                // Read 'mc' and 'hz' data of the HTn from 'ht table'
                htObj = this.dhc.tables.ht[htNum];
                // Apply the controller pitchbend (if present) to the array 
                htObj = this.dhc.bendXtone(htObj);
                // Get the array containing the standard note name info and +/- cents
                let notename = this.dhc.mcToName(htObj.mc),
                    name = notename[0],
                    sign = notename[1],
                    cent = notename[2];
                // Print the infos to the UI HStack
                this.parameters.hstack.uiElements.out.rowsHT[htNum].elemHtNum.innerText = htNum;
                this.parameters.hstack.uiElements.out.rowsHT[htNum].elemNote.innerText = name;
                this.parameters.hstack.uiElements.out.rowsHT[htNum].elemCents.innerText = sign + cent;
                this.parameters.hstack.uiElements.out.rowsHT[htNum].elemHz.innerText = htObj.hz.toFixed(this.dhc.settings.global.hz_accuracy);
            }
        }
    }
    /**
     * Print the data about the FT at the bottom of the H-Stack
     * 
     * @param {xtnum} ftNum - The FT number
     */
    ftMonitor(ftNum) {
        let dhcID = this.dhc.id;
        let ftObj = this.dhc.tables.ft[ftNum];
        // Apply the controller pitchbend (if present) to the array 
        ftObj = this.dhc.bendXtone(ftObj);
        let notename = this.dhc.mcToName(ftObj.mc),
            name = notename[0],
            sign = notename[1],
            cent = notename[2],
            hzAccuracy = this.dhc.settings.global.hz_accuracy;
        // Update the log on HSTACK FT info on the UI
        document.getElementById("HTMLo_hstackFT_tone"+dhcID).innerText = ftNum;
        document.getElementById("HTMLo_hstackFT_note"+dhcID).innerText = name;
        document.getElementById("HTMLo_hstackFT_cents"+dhcID).innerText = sign + cent;
        document.getElementById("HTMLo_hstackFT_hz"+dhcID).innerText = ftObj.hz.toFixed(hzAccuracy);
    }
    /**
     * Turn ON or OFF the rows of the H-Stack
     *
     * @param {tonetype} type  - If the note to turn ON/OFF is a FT or HT
     * @param {0|1}      state - Note ON/OFF; 0 is OFF, 1 is ON 
     * @param {xtnum}    xtNum - FT or HT number
     */
    // @old icHSTACKmonitor
    playFx(type, state, xtNum) {
        let dhcID = this.dhc.id;
        if (type === "ft") {
            // Note ON
            if (state === 1) {

                // Recreate the element to force the css animation
                let old = this.parameters.frow.uiElements.out.hstackFTrow;
                let parent = old.parentNode;
                let clone = old.cloneNode(true);
                parent.insertBefore(clone, old);
                old.remove();
                this.parameters.frow.uiElements.out.hstackFTrow = clone;
                this.parameters.frow.uiElements.out.hstackFTrow.classList.add("hum-hstack-ft-on");
                this.parameters.frow.uiElements.out.hstackFTrow.classList.remove("hum-hstack-ft-off");

                // Write the FM at the bottom of the hstack
                this.ftMonitor(xtNum);

            // Note OFF
            } else if (state === 0) {
                if (this.dhc.settings.ht.curr_ft === xtNum) {
                    this.parameters.frow.uiElements.out.hstackFTrow.classList.add("hum-hstack-ft-off");
                    this.parameters.frow.uiElements.out.hstackFTrow.classList.remove("hum-hstack-ft-on");
                }
            }
        } else if (type === "ht") {
            // If is a normal HT (it's not HT0)
            if (xtNum !== 0) {
                // Only if the HT is mapped in the keymap
                if (this.usedHT.includes(xtNum)) {
                    let htmlElem = this.parameters.hstack.uiElements.out.rowsHT[xtNum].elemRow;
                    // let htmlElem = document.getElementById("HTMLf_hstackHTrow_h"+xtNum+"_"+dhcID);
                    // Note ON
                    if (state === 1) {
                        htmlElem.classList.add("hum-hstack-ht-on");
                        htmlElem.classList.remove("hum-hstack-ht-off");
                    // Note OFF
                    } else if (state === 0) {
                        htmlElem.classList.add("hum-hstack-ht-off");
                        htmlElem.classList.remove("hum-hstack-ht-on");
                    }
                }
            }
        }
    }
};


/**
 * A HTML table's row for the H-Stack
 */
HUM.Hstack.prototype.HstackRow = class {
    /**
     * @property {xtnum}  htNum - The number of HT
     * @property {string} dhcID - The DHC instance id
     */
    constructor(htNum, dhcID) {
        this.htNum = htNum;
        this.dhcID = dhcID;
        /**
        * The HTML row element
        *
        * @member {HTMLElement}
        */
        this.elemRow = document.createElement("tr");
        this.elemHtNum = document.createElement("td");
        this.elemNote = document.createElement("td");
        this.elemCents = document.createElement("td");
        this.elemHz = document.createElement("td");

        this.elemRow.className = "hum-hstack-ht-off";
        
        this.elemRow.id = `HTMLf_hstackHTrow_h${htNum}_${dhcID}`;
        this.elemHtNum.id = `HTMLo_hstackHT_h${htNum}_${dhcID}`;
        this.elemNote.id = `HTMLo_hstackHT_note${htNum}_${dhcID}`;
        this.elemCents.id = `HTMLo_hstackHT_cents${htNum}_${dhcID}`;
        this.elemHz.id = `HTMLo_hstackHT_hz${htNum}_${dhcID}`;
        this.elemHtNum.innerText = "htNum";

        this.elemRow.append(this.elemHtNum, this.elemNote, this.elemCents, this.elemHz);
    }
};


HUM.Hstack.prototype.Parameters = class {
    constructor(hstack) {
        /**
         * The state of the H-Stack; if `false`, it is turned off.
         *
         * @member {boolean}
         */
        this.active = new HUM.Param({
            app:hstack,
            idbKey:'hstackActive',
            uiElements:{
                'hstackTabShown': new HUM.Param.UIelem({
                    htmlID: hstack.dhc.harmonicarium.html.hstackTab[hstack.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget:'collapse',
                    eventType: 'show.bs.collapse',
                    uiSet: (value) => {
                        if (value) {
                            this.active.bsCollapse.show();
                        } else {
                            this.active.bsCollapse.hide();
                        }
                    },
                    eventListener: evt => {
                        this.active.valueUI = true;
                    }
                }),
                'hstackTabHidden': new HUM.Param.UIelem({
                    htmlID: hstack.dhc.harmonicarium.html.hstackTab[hstack.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget:'collapse',
                    eventType: 'hidden.bs.collapse',
                    uiSet: null,
                    eventListener: evt => {
                        this.active.valueUI = false;
                    }
                }),
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            preInit: () => {
                // Create a Bootstrap collapsible controller
                this.active.bsCollapse = new bootstrap.Collapse('#'+hstack.dhc.harmonicarium.html.hstackTab[hstack.dhc.id].children[1].id, {
                    toggle: this.active.value
                });
            },
            postSet: (value, thisParam, init) => {
                if (value) {
                    hstack.fillin();
                    hstack.ftMonitor(hstack.dhc.settings.ht.curr_ft);
                } else {
                    // Turn off all the tones currently active, if there are
                    for (let htNum of hstack.usedHT) {
                        hstack.playFx("ht", 0, htNum);
                    }
                    hstack.playFx("ft", 0, hstack.dhc.settings.ht.curr_ft);
                }

            }
        });
        /**
        * H-Stack table font size
        *
        * @member {integer}
        */
        this.fontSize = new HUM.Param({
            app:hstack,
            idbKey:'hstackZoom',
            uiElements:{
                'hstack_zoom': new HUM.Param.UIelem({
                    role: 'fn',
                    opType:'set',
                    eventType: 'input',
                    htmlTargetProp:'value',
                    widget:'range',
                }),
                'hstack_fontsize': new HUM.Param.UIelem({
                    role: 'out',
                })
            },
            dataType:'float',
            initValue:20,
            postSet: (value, thisParam) => {
                thisParam.uiElements.out.hstack_fontsize.style.fontSize = value + "px";
                thisParam.uiElements.fn.hstack_zoom.setAttribute("data-tooltip", value + "px");
            }
        });

        this.frow = new HUM.Param({
            app:hstack,
            idbKey:'hstackFtable',
            uiElements:{
                'hstackFTrow': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            init:false,
            dataType:'array',
            // initValue:4,
            postInit: (thisParam) => {

            },
            postSet: (value, thisParam, init) => {

            }
        });

        this.hstack = new HUM.Param({
            app:hstack,
            idbKey:'hstackHtable',
            uiElements:{
                'hstackHT': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'rowsHT': new HUM.Param.UIelem({
                    role: 'out',
                    namespace: true,
                }),
            },
            init:false,
            dataType:'array',
            // initValue:4,
            postInit: (thisParam) => {
                /**
                 * Create the H-Stack HTML table 
                 */
                let dhcID = hstack.dhc.id,
                    hstackContainer = thisParam.uiElements.out.hstackHT,
                    hstackTable = document.createElement("table");
                
                hstackTable.className = "table table-sm";
                hstackTable.innerHTML = `
                    <thead class="table-light">
                        <tr>
                            <th colspan="4">Harmonics</th>
                        </tr>
                        <tr>
                            <th width="12%">HT</th>
                            <th width="20%">note</th>
                            <th width="25%">cents</th>
                            <th width="43%">Hz</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Here the HT rows -->
                    </tbody>`;
                hstack.updateUsedHT();
                
                thisParam.uiElements.out.rowsHT = {};
                for (let htNum of hstack.usedHT) {
                    let newRow = new hstack.HstackRow(htNum, dhcID);
                    thisParam.uiElements.out.rowsHT[htNum] = newRow;
                    hstackTable.children[1].appendChild(newRow.elemRow);
                }
                if (hstackContainer.firstChild) {
                    hstackContainer.removeChild(hstackContainer.firstChild);
                }
                hstackContainer.appendChild(hstackTable);
                
                hstack.fillin();

            },
            postSet: (value, thisParam, init) => {

            }
        });
    }
    _init() {
        this.active._init();
        this.hstack._init();
    }

};