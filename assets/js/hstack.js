/**
 * @fileoverview Harmonic Stack visualizer for the Harmonicarium application.
 * This file defines the {@link HUM.Hstack} class which renders the active harmonics
 * and fundamental tone in a tabular UI panel, updating in real-time as notes are
 * played or the keymap changes. The sub-components are defined in the companion file:
 * - {@link module:hstack-parameters} — `HUM.Hstack.prototype.Parameters` class
 *
 * @module hstack
 * @memberof HUM
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

window.AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * The Hstack class, a tool for visualizing the Harmonic Series in the UI in a tabular format.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The `HUM.Hstack` class manages the H-Stack panel, a live table that shows all
 * Harmonic Tones (HTs) mapped in the current controller keymap alongside their
 * note name, cent deviation, and frequency in Hz. It also tracks the active
 * Fundamental Tone (FT) at the bottom of the table. The panel can be
 * collapsed to suspend rendering and save resources.
 *
 * The {@link HUM.Hstack.prototype.Parameters|Parameters} inner class is
 * defined in the companion {@link module:hstack-parameters} file and
 * attached to `HUM.Hstack.prototype` at load time.
 *
 * @example
 * // Hstack is instantiated internally by HUM.DHC
 * const hstack = new HUM.Hstack(dhc);
 */
HUM.Hstack = class {
    /**
     * Creates an instance of the {@link HUM.Hstack} class.
     *
     * @param {HUM.DHC} dhc - The DHC instance to which it belongs.
     *
     * @description
     * Initializes the H-Stack component by:
     * 1. Storing a reference to the parent DHC instance and its ID.
     * 2. Initializing the list of used Harmonic Tones to an empty array.
     * 3. Creating the Parameters management system.
     * 4. Running parameter initialization.
     * 5. Registering this component with the DHC for real-time update callbacks.
     */
    constructor(dhc) {
        /**
         * The id of this Hstack instance (same as the DHC id).
         *
         * @type {string}
         */
        this.id = dhc.id;
        this._id = dhc._id;

        /**
         * The name of the `HUM.Hstack`, useful for group the parameters on the DB.
         * Currently hard-coded as `"hstack"`.
         *
         * @type {string}
         */
        this.name = 'hstack';
        /**
         * The DHC instance.
         *
         * @type {HUM.DHC}
         */
        this.dhc = dhc;
        /**
         * An array containing all the used Harmonic/Subharmonic in the controller Keymap.
         *
         * @type {Array.<xtnum>}
         */
        this.usedHT = [];

        /**
         * Instance of `HUM.Hstack#Parameters`.
         *
         * @type {HUM.Hstack.prototype.Parameters}
         */
        this.parameters = new this.Parameters(this);

        this.parameters._init();

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 102);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manages and routes an incoming message from the DHC.
     *
     * @param {HUM.DHCmsg} msg - The incoming DHC message to process.
     *
     * @returns {void}
     *
     * @description
     * Handles the following message commands:
     * - `init`: Fills in the HT table and updates the FT monitor row.
     * - `panic`: Turns off all active note rows.
     * - `update/ht`: Re-fills the HT table if the panel is active.
     * - `update/ctrlmap`: Re-initializes the HT table rows to reflect the new keymap.
     * - `tone-on`: Highlights the corresponding FT or HT row.
     * - `tone-off`: Removes the highlight from the corresponding FT or HT row.
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

                if (msg.continuum === true) {
                    // Spectrogram pitch-tracking: update the FT row display silently.
                    this.ftMonitorHz(msg.hz, msg.mc);
                }

            } else if (msg.type === 'ht' && this.parameters.active.value) {
                
                this.fillin();

            } else if (msg.type === 'ctrlmap') {
                
                this.parameters.hstack._init();
            }

        } else if (msg.cmd === 'tone-on' && this.parameters.active.value) {
            if (msg.type === 'ft') {
                
                if (msg.continuum === true) {
                    // Continuum FT: display Hz/mc directly; no row to flash in the HT table.
                    this.ftMonitorHz(msg.hz, msg.mc);
                } else {
                    // this.fillin();
                    this.playFx('ft', 1, msg.xtNum);
                }
            
            } else if (msg.type === 'ht') {
                
                if (msg.xtNum !== 0) {
                    this.playFx("ht", 1, msg.xtNum);
                }

            }

        } else if (msg.cmd === 'tone-off' && this.parameters.active.value) {
            if (msg.type === 'ft') {
                
                if (msg.continuum === true) {
                    // Continuum FT tone-off: just clear the FT row highlight.
                    this.parameters.frow.uiElements.out.hstackFTrow.classList.add("hum-hstack-ft-off");
                    this.parameters.frow.uiElements.out.hstackFTrow.classList.remove("hum-hstack-ft-on");
                } else {
                    this.playFx("ft", 0, msg.xtNum);
                }
            
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
     * Updates the {@link HUM.Hstack#usedHT} property from the current controller keymap.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all entries in the DHC controller table, collects the HT
     * numbers that are actually mapped (excluding HT 0 and 129), sorts them
     * in descending order, and stores the de-duplicated result in
     * {@link HUM.Hstack#usedHT}.
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
     * Turns off all active rows in the H-Stack table.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all currently used HT numbers and calls {@link HUM.Hstack#playFx}
     * with state `0` (off) for each one, then also turns off the FT row for
     * the currently active fundamental tone.
     */
    allNotesOff() {
        for (let htNum of this.usedHT) {
            this.playFx("ht", 0, htNum);
        }
        this.playFx("ft", 0, this.dhc.settings.ht.curr_ft);
    }
    /**
     * Fills in the H-Stack table with the current harmonic tone data.
     *
     * @returns {void}
     *
     * @description
     * For each HT number in {@link HUM.Hstack#usedHT}:
     * 1. Reads the tone data (MIDI cents and Hz) from the DHC HT table.
     * 2. Applies any active controller pitchbend offset.
     * 3. Converts MIDI cents to a human-readable note name with cent deviation.
     * 4. Writes the HT number, note name, cent deviation, and Hz value into
     *    the corresponding table row UI elements.
     */
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
     * Updates the Fundamental Tone row at the bottom of the H-Stack table.
     *
     * @param {xtnum} ftNum - The FT number to display.
     *
     * @returns {void}
     *
     * @description
     * Reads the frequency data for the given FT from the DHC FT table,
     * applies any active pitchbend, converts the MIDI cent value to a note
     * name, and writes the tone number, note name, cent deviation, and Hz
     * value into the FT monitor row DOM elements.
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
     * Updates the Fundamental Tone row using absolute Hz/mc values from a
     * continuum message (no DHC table lookup is performed).
     *
     * @param {hertz}    hz - Absolute frequency in Hz.
     * @param {midicent} mc - Frequency in midicents.
     *
     * @returns {void}
     */
    ftMonitorHz(hz, mc) {
        let dhcID = this.dhc.id;
        let hzAccuracy = this.dhc.settings.global.hz_accuracy;
        // Apply the controller pitchbend (if present)
        let xtObj = this.dhc.bendXtone(new this.dhc.Xtone(hz, mc));
        let notename = this.dhc.mcToName(xtObj.mc),
            name = notename[0],
            sign = notename[1],
            cent = notename[2];
        // Recreate the element to force the css animation
        let old = this.parameters.frow.uiElements.out.hstackFTrow;
        let parent = old.parentNode;
        let clone = old.cloneNode(true);
        parent.insertBefore(clone, old);
        old.remove();
        this.parameters.frow.uiElements.out.hstackFTrow = clone;
        this.parameters.frow.uiElements.out.hstackFTrow.classList.add("hum-hstack-ft-on");
        this.parameters.frow.uiElements.out.hstackFTrow.classList.remove("hum-hstack-ft-off");
        // Display "~" in the tone-number field to indicate a continuum (non-discrete) FT
        document.getElementById("HTMLo_hstackFT_tone"+dhcID).innerText = "~";
        document.getElementById("HTMLo_hstackFT_note"+dhcID).innerText = name;
        document.getElementById("HTMLo_hstackFT_cents"+dhcID).innerText = sign + cent;
        document.getElementById("HTMLo_hstackFT_hz"+dhcID).innerText = xtObj.hz.toFixed(hzAccuracy);
    }
    /**
     * Turns ON or OFF a row in the H-Stack table.
     *
     * @param {tonetype} type  - Whether the target row is a FT (`"ft"`) or HT (`"ht"`).
     * @param {0|1}      state - `1` for note-on, `0` for note-off.
     * @param {xtnum}    xtNum - The FT or HT number identifying the row to update.
     *
     * @returns {void}
     *
     * @description
     * For FT rows: on note-on, clones the FT row element to restart its CSS
     * animation, applies the active CSS class, and calls {@link HUM.Hstack#ftMonitor}.
     * On note-off, removes the active CSS class if the row belongs to the
     * current fundamental tone.
     * For HT rows: toggles the active/inactive CSS classes on the matching
     * table row, provided the HT is present in {@link HUM.Hstack#usedHT}.
     */
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
                        htmlElem.classList.add("hum-hstack-ht-on", "bg-warning");
                        htmlElem.classList.remove("hum-hstack-ht-off");
                    // Note OFF
                    } else if (state === 0) {
                        htmlElem.classList.add("hum-hstack-ht-off");
                        htmlElem.classList.remove("hum-hstack-ht-on", "bg-warning");
                    }
                }
            }
        }
    }
};


/**
 * A single HTML table row representing one Harmonic Tone in the H-Stack.
 *
 * @class
 * @memberof HUM.Hstack
 *
 * @description
 * Encapsulates the four `<td>` cells that make up one HT row in the H-Stack
 * table: the HT number, the note name, the cent deviation, and the frequency
 * in Hz. Also holds the wrapping `<tr>` element used for note-on/off
 * CSS class toggling.
 */
HUM.Hstack.prototype.HstackRow = class {
    /**
     * Creates an HstackRow instance for the given harmonic tone number.
     *
     * @param {xtnum}  htNum - The harmonic tone number this row represents.
     * @param {string} dhcID - The ID of the parent DHC instance.
     *
     * @description
     * Creates and configures the `<tr>` and four `<td>` elements, assigns
     * the appropriate CSS classes and element IDs, and appends all cells
     * to the row.
     */
    constructor(htNum, dhcID) {
        this.htNum = htNum;
        this.dhcID = dhcID;
        /**
         * The HTML row element.
         *
         * @type {HTMLElement}
         */
        this.elemRow = document.createElement("tr");
        /**
         * The HTML cell for the HT number.
         *
         * @type {HTMLElement}
         */
        this.elemHtNum = document.createElement("td");
        /**
         * The HTML cell for the note name.
         *
         * @type {HTMLElement}
         */
        this.elemNote = document.createElement("td");
        /**
         * The HTML cell for the +/- cent amount.
         *
         * @type {HTMLElement}
         */
        this.elemCents = document.createElement("td");
        /**
         * The HTML cell for the hertz amount.
         *
         * @type {HTMLElement}
         */
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
