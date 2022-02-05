 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2020 by Walter Mantovani (http://armonici.it).
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
        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;
        /**
        * H-Stack table font size
        *
        * @member {integer}
        */
        this.fontSize = 20;
        /**
         * An array containing all the used Harmonic/Subharmonic in the controller Keymap
         *
         * @member {Array.<xtnum>}
         */
        this.usedHT = [];
        /**
         * The state of the H-Stack; if `false`, it is turned off.
         *
         * @member {boolean}
         */
        this.active = false;
        /**
         * UI HTML elements
         *
         * @member {Object}
         * 
         * @property {Object.<string, HTMLElement>} fn  - Functional UI elements
         * @property {Object.<string, HTMLElement>} out - Output UI elements
         */
        this.uiElements = {
            fn: {
                checkboxHstack: this.dhc.harmonicarium.html.hstackTab[dhc.id].children[0],
                hstackFTrow: document.getElementById("HTMLf_hstackFTrow"+dhc.id),
                hstack_zoom: document.getElementById("HTMLf_hstack_zoom"+dhc.id),
            },
            out: {
                hstack_fontsize: document.getElementById("HTMLo_hstack_fontsize"+dhc.id),
                hstackHT: document.getElementById("HTMLo_hstackHT"+dhc.id),
                rowsHT: {}
            }
        };
        this._initUI();

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 102);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initialize the UI elements
     */
    _initUI() {
        let zoomVal = this.fontSize;
        // Init H Stack zoom with default value
        this.uiElements.fn.hstack_zoom.value = zoomVal;
        this.uiElements.out.hstack_fontsize.style.fontSize = zoomVal + "px";
        this.uiElements.fn.hstack_zoom.setAttribute("data-tooltip", zoomVal + "px" );

        // Add an EventListener to the zoom slider
        this.uiElements.fn.hstack_zoom.addEventListener("input", (e) => {
            window.requestAnimationFrame( () => {
                this.fontSize = e.target.value;
                this.uiElements.out.hstack_fontsize.style.fontSize = e.target.value + "px";
                this.uiElements.fn.hstack_zoom.setAttribute("data-tooltip", e.target.value + "px");
            });
        });

        // Disable the hstack fill & animation if the accordion Synth tab is closed
        this.uiElements.fn.checkboxHstack.addEventListener('change', (e) => {
            if (e.target.checked === true) {
                this.active = true;
                this.fillin();
                this.ftMonitor(this.dhc.settings.ht.curr_ft);
            } else {
                this.active = false;
                // Turn off all the tones currently active, if there are
                for (let htNum of this.usedHT) {
                    this.playFx("ht", 0, htNum);
                }
                this.playFx("ft", 0, this.dhc.settings.ht.curr_ft);
            }
        });

    }
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

            } else if (msg.type === 'ht' && this.active) {
                
                this.fillin();

            } else if (msg.type === 'ctrlmap') {
                
                this.create();
            }

        } else if (msg.cmd === 'tone-on' && this.active) {
            if (msg.type === 'ft') {
                
                // this.fillin();
                this.playFx('ft', 1, msg.xtNum);
            
            } else if (msg.type === 'ht') {
                
                if (msg.xtNum !== 0) {
                    this.playFx("ht", 1, msg.xtNum);
                }

            }

        } else if (msg.cmd === 'tone-off' && this.active) {
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
     * Create the H-Stack HTML table 
     */
    // @old icHSTACKcreate
    create() {
        let dhcID = this.dhc.id,
            hstackContainer = this.uiElements.out.hstackHT,
            hstackTable = document.createElement("table");
        
        hstackTable.className = "dataTable";
        hstackTable.innerHTML = `
                    <tr>
                        <th colspan="4">Harmonics</th>
                    </tr>
                    <tr class="hstackHeader">
                        <th width="13%" class="hstackHT_h">HT</th>
                        <th width="15%" class="hstackHT_note">note</th>
                        <th width="30%" class="hstackHT_cents">cents</th>
                        <th width="42%" class="hstackHT_hz">Hz</th>
                    </tr>
                    <!-- Here the HT rows -->`;
        this.updateUsedHT();
        
        this.uiElements.out.rowsHT = {};
        for (let htNum of this.usedHT) {
            let newRow = new this.HstackRow(htNum, dhcID);
            this.uiElements.out.rowsHT[htNum] = newRow;
            hstackTable.append(newRow.elemRow);
        }
        if (hstackContainer.firstChild) {
            hstackContainer.removeChild(hstackContainer.firstChild);
        }
        hstackContainer.appendChild(hstackTable);
        
        this.fillin();
    }
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
                this.uiElements.out.rowsHT[htNum].elemHtNum.innerText = htNum;
                this.uiElements.out.rowsHT[htNum].elemNote.innerText = name;
                this.uiElements.out.rowsHT[htNum].elemCents.innerText = sign + cent;
                this.uiElements.out.rowsHT[htNum].elemHz.innerText = htObj.hz.toFixed(this.dhc.settings.global.hz_accuracy);
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
                let old = this.uiElements.fn.hstackFTrow;
                let parent = old.parentNode;
                let clone = old.cloneNode(true);
                parent.insertBefore(clone, old);
                old.remove();
                this.uiElements.fn.hstackFTrow = clone;
                this.uiElements.fn.hstackFTrow.classList.add("FTon");
                this.uiElements.fn.hstackFTrow.classList.remove("FToff");

                // Write the FM at the bottom of the hstack
                this.ftMonitor(xtNum);

            // Note OFF
            } else if (state === 0) {
                if (this.dhc.settings.ht.curr_ft === xtNum) {
                    this.uiElements.fn.hstackFTrow.classList.add("FToff");
                    this.uiElements.fn.hstackFTrow.classList.remove("FTon");
                }
            }
        } else if (type === "ht") {
            // If is a normal HT (it's not HT0)
            if (xtNum !== 0) {
                // Only if the HT is mapped in the keymap
                if (this.usedHT.includes(xtNum)) {
                    let htmlElem = this.uiElements.out.rowsHT[xtNum].elemRow;
                    // let htmlElem = document.getElementById("HTMLf_hstackHTrow_h"+xtNum+"_"+dhcID);
                    // Note ON
                    if (state === 1) {
                        htmlElem.classList.add("HTon");
                        htmlElem.classList.remove("HToff");
                    // Note OFF
                    } else if (state === 0) {
                        htmlElem.classList.add("HToff");
                        htmlElem.classList.remove("HTon");
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

        this.elemRow.className = "HToff";
        this.elemHtNum.className = "hstackHT_h";
        this.elemNote.className = "hstackHT_note";
        this.elemCents.className = "hstackHT_cents";
        this.elemHz.className = "hstackHT_hz";
        
        this.elemRow.id = `HTMLf_hstackHTrow_h${htNum}_${dhcID}`;
        this.elemHtNum.id = `HTMLo_hstackHT_h${htNum}_${dhcID}`;
        this.elemNote.id = `HTMLo_hstackHT_note${htNum}_${dhcID}`;
        this.elemCents.id = `HTMLo_hstackHT_cents${htNum}_${dhcID}`;
        this.elemHz.id = `HTMLo_hstackHT_hz${htNum}_${dhcID}`;
        this.elemHtNum.innerText = "htNum";

        this.elemRow.append(this.elemHtNum, this.elemNote, this.elemCents, this.elemHz);
    }
};