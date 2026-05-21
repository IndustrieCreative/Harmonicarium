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
         * The current scroll offset. Bottom row shows HT `_scrollOffset + 1`.
         *
         * @type {number}
         */
        this._scrollOffset = 0;
        /**
         * The current number of rows in the HT table.
         *
         * @type {number}
         */
        this._rowCount = 0;

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
     * Shows or hides the note/cents columns and updates the Hz/BPM heading
     * based on the current polyrhythm mode state.
     *
     * @returns {void}
     */
    _syncPolyrhythmColumns() {
        const dhcID = this.dhc.id;
        const poly = this.dhc.polyrhythmMode;
        const hideNoteCents = poly ? 'none' : '';
        const hideBpm       = poly ? '' : 'none';

        // HT table column headers
        if (this._htNoteHead)  { this._htNoteHead.style.display  = hideNoteCents; }
        if (this._htCentsHead) { this._htCentsHead.style.display = hideNoteCents; }
        if (this._htBpmHead)   { this._htBpmHead.style.display   = hideBpm; }

        // FT table column headers
        const ftNoteHead  = document.getElementById('HTMLo_hstackFT_noteHead'  + dhcID);
        const ftCentsHead = document.getElementById('HTMLo_hstackFT_centsHead' + dhcID);
        const ftBpmHead   = document.getElementById('HTMLo_hstackFT_bpmHead'   + dhcID);
        if (ftNoteHead)  { ftNoteHead.style.display  = hideNoteCents; }
        if (ftCentsHead) { ftCentsHead.style.display = hideNoteCents; }
        if (ftBpmHead)   { ftBpmHead.style.display   = hideBpm; }

        // FT row data cells
        const ftNoteTd  = document.getElementById('HTMLo_hstackFT_noteTd'  + dhcID);
        const ftCentsTd = document.getElementById('HTMLo_hstackFT_centsTd' + dhcID);
        const ftBpmTd   = document.getElementById('HTMLo_hstackFT_bpmTd'   + dhcID);
        if (ftNoteTd)  { ftNoteTd.style.display  = hideNoteCents; }
        if (ftCentsTd) { ftCentsTd.style.display = hideNoteCents; }
        if (ftBpmTd)   { ftBpmTd.style.display   = hideBpm; }

        // HT row data cells
        const rows = this.parameters.hstack.uiElements.out.rowsHT;
        if (rows) {
            for (const row of Object.values(rows)) {
                row.elemNote.style.display  = hideNoteCents;
                row.elemCents.style.display = hideNoteCents;
                row.elemBpm.style.display   = hideBpm;
            }
        }
    }

    /**
     * Rebuilds the HT table rows for the given row count, then calls {@link HUM.Hstack#fillin}.
     *
     * @param {number} n - The number of rows to create.
     * @returns {void}
     */
    _rebuildRows(n) {
        this._rowCount = n;
        const dhcID = this.dhc.id;
        const tbody = document.getElementById('HTMLo_hstackHTbody' + dhcID);
        if (!tbody) { return; }
        // Clear existing rows
        while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }
        // Reset the rowsHT namespace
        this.parameters.hstack.uiElements.out.rowsHT = {};
        const rowsHT = this.parameters.hstack.uiElements.out.rowsHT;
        // Build rows: pos (n-1) appended first = top of table; pos 0 = bottom
        for (let pos = n - 1; pos >= 0; pos--) {
            const newRow = new this.HstackRow(pos, dhcID);
            rowsHT[pos] = newRow;
            tbody.appendChild(newRow.elemRow);
        }
        this.fillin();
        this._syncPolyrhythmColumns();
    }

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
            this._syncPolyrhythmColumns();
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
                if (this.parameters.active.value) { this.fillin(); }

            } else if (msg.type === 'mode') {
                // Polyrhythm Mode toggled: re-render the Hstack so Hz columns become BPM (and vice-versa).
                this._syncPolyrhythmColumns();
                if (this.parameters.active.value) { this.fillin(); }
                this.ftMonitor(this.dhc.settings.ht.curr_ft);
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
        const rows = this.parameters.hstack.uiElements.out.rowsHT;
        if (rows) {
            for (const row of Object.values(rows)) {
                row.elemRow.classList.add("hum-hstack-ht-off");
                row.elemRow.classList.remove("hum-hstack-ht-on", "bg-warning");
            }
        }
        this.playFx("ft", 0, this.dhc.settings.ht.curr_ft);
    }
    /**
     * Fills in the H-Stack table with the current harmonic tone data.
     *
     * @returns {void}
     *
     * @description
     * For each row position in the visible window (0 = bottom, _rowCount-1 = top):
     * 1. Computes the displayed HT number as `_scrollOffset + 1 + pos`.
     * 2. Reads the tone data (MIDI cents and Hz) from the DHC HT table.
     * 3. Applies any active controller pitchbend offset.
     * 4. Converts MIDI cents to a human-readable note name with cent deviation.
     * 5. Writes the HT number, note name, cent deviation, and Hz value into
     *    the corresponding table row UI elements.
     */
    fillin() {
        const rowsHT = this.parameters.hstack.uiElements.out.rowsHT;
        if (!rowsHT) { return; }
        for (let pos = 0; pos < this._rowCount; pos++) {
            const displayHtNum = this._scrollOffset + 1 + pos;
            const row = rowsHT[pos];
            if (!row) { continue; }
            if (displayHtNum === 0 || displayHtNum < -128 || displayHtNum > 128) {
                row.elemHtNum.innerText = displayHtNum;
                row.elemNote.innerText  = '\u2014';
                row.elemCents.innerText = '\u2014';
                row.elemHz.innerText    = '\u2014';
                row.elemBpm.innerText   = '\u2014';
                continue;
            }
            let htObj = this.dhc.tables.ht[displayHtNum];
            htObj = this.dhc.bendXtone(htObj);
            let notename = this.dhc.mcToName(htObj.mc),
                name = notename[0],
                sign = notename[1],
                cent = notename[2];
            row.elemHtNum.innerText = displayHtNum;
            row.elemNote.innerText  = name;
            row.elemCents.innerText = sign + cent;
            row.elemHz.innerText    = htObj.hz.toFixed(this.dhc.settings.global.hz_accuracy.value);
            row.elemBpm.innerText   = HUM.DHC.hzToBpm(htObj.hz);
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
            hzAccuracy = this.dhc.settings.global.hz_accuracy.value;
        document.getElementById("HTMLo_hstackFT_tone"+dhcID).innerText = ftNum;
        document.getElementById("HTMLo_hstackFT_note"+dhcID).innerText = name;
        document.getElementById("HTMLo_hstackFT_cents"+dhcID).innerText = sign + cent;
        document.getElementById("HTMLo_hstackFT_hz"+dhcID).innerText = ftObj.hz.toFixed(hzAccuracy);
        document.getElementById("HTMLo_hstackFT_bpm"+dhcID).innerText = HUM.DHC.hzToBpm(ftObj.hz);
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
        let hzAccuracy = this.dhc.settings.global.hz_accuracy.value;
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
        document.getElementById("HTMLo_hstackFT_bpm"+dhcID).innerText = HUM.DHC.hzToBpm(xtObj.hz);
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
     * For HT rows: toggles the active/inactive CSS classes on the row at the
     * position derived from `xtNum` and the current scroll offset.
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
                const pos = xtNum - this._scrollOffset - 1;
                const row = this.parameters.hstack.uiElements.out.rowsHT[pos];
                if (row) {
                    const htmlElem = row.elemRow;
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
 * A single HTML table row in the H-Stack, keyed by position in the visible window.
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
     * Creates an HstackRow instance for the given row position.
     *
     * @param {number} pos   - The row position index (0 = bottom, rowCount-1 = top).
     * @param {string} dhcID - The ID of the parent DHC instance.
     *
     * @description
     * Creates and configures the `<tr>` and four `<td>` elements, assigns
     * the appropriate CSS classes and element IDs, and appends all cells
     * to the row.
     */
    constructor(pos, dhcID) {
        this.pos = pos;
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
        /**
         * The HTML cell for the BPM amount.
         *
         * @type {HTMLElement}
         */
        this.elemBpm = document.createElement("td");

        this.elemRow.className = "hum-hstack-ht-off";
        
        this.elemRow.id = `HTMLf_hstackHTrow_p${pos}_${dhcID}`;
        this.elemHtNum.id = `HTMLo_hstackHT_p${pos}_${dhcID}`;
        this.elemNote.id = `HTMLo_hstackHT_note_p${pos}_${dhcID}`;
        this.elemCents.id = `HTMLo_hstackHT_cents_p${pos}_${dhcID}`;
        this.elemHz.id = `HTMLo_hstackHT_hz_p${pos}_${dhcID}`;
        this.elemBpm.id = `HTMLo_hstackHT_bpm_p${pos}_${dhcID}`;
        this.elemHtNum.innerText = pos;

        this.elemRow.append(this.elemHtNum, this.elemNote, this.elemCents, this.elemBpm, this.elemHz);
    }
};
