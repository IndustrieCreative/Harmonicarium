/**
 * @fileoverview Dynamic Harmonics Calculator (DHC) for the Harmonicarium application.
 * This file defines the {@link HUM.DHC} class, which is the computational kernel for
 * all frequency and midicent table calculations, as well as the message routing system
 * that coordinates communication between the other application components. The
 * sub-components are defined in the companion files:
 * - {@link module:dhc-message}    — `DHCmsg` message class
 * - {@link module:dhc-xtone}      — `DHC.Xtone` tone-table entry class
 * - {@link module:dhc-parameters} — `DHC.prototype.Parameters` class
 *
 * @module dhc
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
 * The Dynamic Harmonics Calculator class.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The HUM.DHC class is the computational kernel of the Harmonicarium application.
 * It manages:
 * - Computing frequency and midicent lookup tables for Fundamental Tones (FT) and
 *   Harmonic/Subharmonic Tones (HT) based on the selected tuning system
 * - Routing {@link HUM.DHCmsg} messages to and from all registered app components
 *   (Synth, MIDI, Hancock, Hstack, etc.)
 * - Managing the play queues for FT and HT tone events, including stuck-note prevention
 * - Handling the Piper feature (HT 0) for melody step-sequencer playback
 * - Loading, parsing, and processing controller keymaps from presets or `.hcmap` files
 *
 * @example
 * // DHC is instantiated internally by HUM during initialization
 * const dhc = new HUM.DHC('1-0', 0, harmonicarium);
 */
HUM.DHC = class {
    /**
     * Creates a new DHC instance and binds it to the given HUM instance.
     *
     * @param {string} id            - The DHC full ID, composed of the HUM ID and the DHC index (e.g. `'1-0'`, `'1-1'`).
     * @param {number} idx           - The DHC index within the parent HUM instance (e.g. `0`, `1`).
     * @param {HUM}    harmonicarium - The HUM instance to which this DHC belongs.
     *
     * @description
     * Initializes the core tables, play queues, and all sub-component instances
     * (Hancock, Synth, MidiHub, Hstack) in the correct dependency order.
     * Parameter initialization (`settings._init()`) is called after the sub-components
     * are constructed so that UI bindings and table computations have all
     * required objects in place.
     */
    constructor(id, idx, harmonicarium) {
        /**
         * The HUM instance.
         *
         * @type {HUM}
         */
        this.harmonicarium = harmonicarium;

        /**
         * The full ID of this DHC instance (e.g. `'1-0'`).
         *
         * @type {string}
         */
        this.id = id;

        /**
         * The numeric index of this DHC instance within the parent HUM instance.
         *
         * @type {number}
         * @private
         */
        this._id = idx;
        
        /**
         * The name of the `HUM.DHC`, useful for grouping parameters in the DB.
         * Currently hard-coded as `"dhc"`.
         *
         * @type {string}
         */
        this.name = 'dhc';
        
        /**
         * DHC lookup tables.
         *
         * @type {Object}
         *
         * @property {CtrlKeymap}                    ctrl       - The current Controller Keymap.
         * @property {Object.<xtnum, HUM.DHC#Xtone>} ft         - The current Fundamental Tones table.
         * @property {Object.<xtnum, HUM.DHC#Xtone>} ht         - The current Harmonic/Subharmonic Tones table.
         * @property {Object}                        reverse    - Namespace for the reverse tables.
         * @property {Object.<midinnum, xtnum>}      reverse.ft - Reverse Fundamental Tones table (midicent → FT number).
         * @property {Object.<midinnum, xtnum>}      reverse.ht - Reverse Harmonic/Subharmonic Tones table (midicent → HT number).
         */
        this.tables = {
            ctrl: {},
            ft: {},
            ht: {},
            reverse: {
                ft: {},
                ht: {},
            },
        };
        
        /**
         * Map of registered app components.
         * Each key is an app instance and each value is an object containing the
         * method name used to dispatch messages and the numeric priority.
         *
         * @todo Pass registrations via constructor parameters; a `false` value should suppress message delivery.
         *
         * @type {Map.<Object, {method: string, priority: number}>}
         */
        this.registeredApps = new Map();
        
        /**
         * Active note queues for stuck-note prevention and monophonic FT logic.
         *
         * @type {Object}
         *
         * @property {Array.<HUM.DHCmsg>} ft - Queue of currently pressed FT events.
         * @property {Array.<HUM.DHCmsg>} ht - Queue of currently pressed HT events.
         */
        this.playQueue = {
            ft: [],
            ht: [],
        };
        
        /**
         * The BackendUtils instance shared by the parent HUM.
         *
         * @type {HUM.BackendUtils}
         */
        this.backendUtils = this.harmonicarium.components.backendUtils;

        /**
         * DHC parameters container.
         *
         * @todo Rename `settings` to `parameters` for consistency with other components.
         *
         * @type {HUM.DHC.prototype.Parameters}
         */
        this.settings = new this.Parameters(this);

        /**
         * The Hancock (virtual keyboard) instance.
         *
         * @type {HUM.Hancock}
         */
        this.hancock = new HUM.Hancock(this);

        /**
         * The built-in synthesizer instance.
         *
         * @type {HUM.Synth}
         */
        this.synth = new HUM.Synth(this);

        /**
         * The MIDI hub instance (manages all MIDI I/O ports).
         *
         * @type {HUM.midi.MidiHub}
         */
        this.midi = new HUM.midi.MidiHub(this);

        this.settings._init();

        /**
         * The Hstack visualizer instance.
         *
         * @type {HUM.Hstack}
         */
        this.hstack = new HUM.Hstack(this);
        // =======================
    } // end class Constructor
    // ===========================
    
    /**
     * Registers a new app component as a DHC subscriber and re-sorts all subscribers by priority.
     *
     * @param {Object} app      - The app component instance to register.
     * @param {string} method   - The name of the method on `app` that will receive {@link HUM.DHCmsg} messages.
     * @param {number} priority - Dispatch priority; lower values receive messages first.
     *
     * @returns {void}
     *
     * @description
     * Adds `app` to {@link HUM.DHC#registeredApps} keyed by `{method, priority}`, then
     * rebuilds the Map in ascending priority order so that `sendMessageToApps` always
     * iterates subscribers in the correct sequence.
     */
    registerApp(app, method, priority) {
        let rA = this.registeredApps;
        rA.set(app, {method: method, priority: priority});
        // Re-arrage the registered apps by priority
        this.registeredApps = new Map([...rA.entries()].sort((a, b) => a[1].priority-b[1].priority));
    }

    /**
     * Dispatches a DHC message to all registered app components in priority order.
     *
     * @param {HUM.DHCmsg} dhcMsg - The message to broadcast.
     *
     * @returns {void}
     *
     * @description
     * Iterates over {@link HUM.DHC#registeredApps} and calls the registered handler
     * method on each subscriber, passing `dhcMsg` as the sole argument.
     */
    sendMessageToApps(dhcMsg) {
        for (const [app, handler] of this.registeredApps) {
            app[handler.method](dhcMsg);
        }
    }

    /*==============================================================================*
     * DHC TABLES CREATION
     *==============================================================================*/

    /**
     * Recompiles the FT and HT lookup tables in the correct dependency order and
     * refreshes the UI monitors.
     *
     * @returns {void}
     *
     * @description
     * Calls {@link HUM.DHC#createFTtable} first, then {@link HUM.DHC#createHTtable}
     * using the currently active FT frequency, and finally {@link HUM.DHC#initUImonitors}
     * to push the updated values to all UI output elements.
     */
    initTables() {
        // Create the FT tables
        this.createFTtable();

        // Create the HT tables on the current FT
        this.createHTtable(this.tables.ft[this.settings.ht.curr_ft].hz);
        
        // Update the UI Monitors
        this.initUImonitors();
    }

    /**
     * Recompiles the Fundamental Tones (FT) lookup table according to the currently
     * selected FT tuning system and broadcasts the result to all registered apps.
     *
     * @returns {void}
     *
     * @description
     * Supports three tuning systems controlled by `settings.ft.selected.value`:
     * - `'nEDx'`: n-EDx equal temperament, computing each step via {@link HUM.DHC.compute_nEDx}.
     * - `'h_s'`: Harmonics/Subharmonics, in either `'natural'` or `'sameOctave'` sub-mode.
     * - `'file'`: Tuning file import (not yet implemented).
     *
     * In each case the reverse table (midicent → FT number) is populated only for
     * tones that appear in the current controller keymap. After building both tables,
     * an `'update/ft'` {@link HUM.DHCmsg} is sent to all registered apps.
     */
    createFTtable() {
        // Temp object
        let fundamentalsTable = {},
            fundamentalsReverseTable = {};
        // Select current FT Tuning Systems
        switch (this.settings.ft.selected.value) {
            // n-EDx EQUAL TEMPERAMENT
            case "nEDx":
                for (let i = -this.settings.ft.steps; i <= this.settings.ft.steps; i++) {
                    let freq = this.constructor.compute_nEDx(i, this.settings.ft.nEDx.unit.value, this.settings.ft.nEDx.division.value, this.settings.fm.hz.value);
                    let midicents = this.constructor.freqToMc(freq);
                    let ok_rev = false;
                    fundamentalsTable[i] = new this.Xtone(freq, midicents);
                    // Insert in the reverse table only if present on the keymap
                    for (let key of Object.keys(this.tables.ctrl)) {
                        if (this.tables.ctrl[key].ft === i) {
                            ok_rev = true;
                        }
                    }
                    if (ok_rev === true) {
                        fundamentalsReverseTable[midicents] = i;
                    }
                }
                break;
            // HARMONICS / SUBHARMONICS FT
            case "h_s":
                if (this.settings.ft.h_s.selected.value === "natural") {
                    // Compute the sub/harmonics naturally (NOT transposed to the Same Octave)
                    for (let i = 1; i <= this.settings.ft.steps; i++) {
                        let sFreq = this.settings.fm.hz.value / i * this.settings.ft.h_s.natural.s_tr.value;
                        let hFreq = this.settings.fm.hz.value * i * this.settings.ft.h_s.natural.h_tr.value;
                        let sMidicents = this.constructor.freqToMc(sFreq);
                        let hMidicents = this.constructor.freqToMc(hFreq);
                        let ok_rev_h = false;
                        let ok_rev_s = false;
                        fundamentalsTable[-i] = new this.Xtone(sFreq, sMidicents); 
                        fundamentalsTable[i] = new this.Xtone(hFreq, hMidicents);
                        // Insert in the reverse table only if present on the keymap
                        for (let key of Object.keys(this.tables.ctrl)) {
                            if (this.tables.ctrl[key].ft === i) {
                                ok_rev_h = true;
                            }
                            if (this.tables.ctrl[key].ft === -i) {
                                ok_rev_s = true;
                            }
                        }
                        if (ok_rev_h === true) {
                            fundamentalsReverseTable[hMidicents] = i;
                        }
                        if (ok_rev_s === true) {
                            fundamentalsReverseTable[sMidicents] = -i;
                        }
                    }
                    // FT0 is always the FM 
                    fundamentalsTable[0] = new this.Xtone(this.settings.fm.hz.value, this.settings.fm.mc.value);
                    fundamentalsReverseTable[Number(this.settings.fm.mc.value)] = 0;
                }
                if (this.settings.ft.h_s.selected.value === "sameOctave") {
                    // Compute the sub/harmonics all transposed to the Same Octave
                    for (let i = 1; i <= this.settings.ft.steps; i++) {
                        let h_so_tr = null;
                        let s_so_tr = null;
                        if (i <= 2) {
                            h_so_tr = 1;
                            s_so_tr = 1;
                        } else if (i < 4) {
                            h_so_tr = i / 2;
                            s_so_tr = 1 / i * 2;
                        } else if (i < 8) {
                            h_so_tr = i / 4;
                            s_so_tr = 1 / i * 4;
                        } else if (i < 16) {
                            h_so_tr = i / 8;
                            s_so_tr = 1 / i * 8;
                        } else if (i < 32) {
                            h_so_tr = i / 16;
                            s_so_tr = 1 / i * 16;
                        } else if (i <= 64) {
                            h_so_tr = i / 32;
                            s_so_tr = 1 / i * 32;
                        }
                        let hFreq = this.settings.fm.hz.value * h_so_tr * this.settings.ft.h_s.sameOctave.h_tr.value;
                        let sFreq = this.settings.fm.hz.value * s_so_tr * this.settings.ft.h_s.sameOctave.s_tr.value;
                        let sMidicents = this.constructor.freqToMc(sFreq);
                        let hMidicents = this.constructor.freqToMc(hFreq);
                        let ok_rev_h = false;
                        let ok_rev_s = false;
                        fundamentalsTable[-i] = new this.Xtone(sFreq, sMidicents);
                        fundamentalsTable[i] = new this.Xtone(hFreq, hMidicents);
                        // Insert in the reverse table only if present on the keymap
                        for (let key of Object.keys(this.tables.ctrl)) {
                            if (this.tables.ctrl[key].ft === i) {
                                ok_rev_h = true;
                            }
                            if (this.tables.ctrl[key].ft === -i) {
                                ok_rev_s = true;
                            }
                        }
                        if (ok_rev_h === true) {
                            fundamentalsReverseTable[hMidicents] = i;
                        }
                        if (ok_rev_s === true){
                            fundamentalsReverseTable[sMidicents] = -i;
                        }
                    }
                    // FT0 is always the FM
                    fundamentalsTable[0] = new this.Xtone(this.settings.fm.hz.value, this.settings.fm.mc.value); 
                    fundamentalsReverseTable[Number(this.settings.fm.mc.value)] = 0;
                }
                break;
            // @todo - TUNING FILES FT
            case "file":
                break;
        }
        this.tables.ft = fundamentalsTable;
        this.tables.reverse.ft = fundamentalsReverseTable;
        
        this.sendMessageToApps(HUM.DHCmsg.ftUpd('dhc'));
    }

    /**
     * Recompiles the Harmonic/Subharmonic Tones (HT) lookup table for a given
     * fundamental frequency and broadcasts the result to all registered apps.
     *
     * @todo Implement configurable table length (16/32/64/128 tones) for performance tuning.
     *
     * @param {hertz} fundamental - The reference frequency (in Hz) on which to build the series.
     *
     * @returns {void}
     *
     * @description
     * Computes 256 tones: subharmonics from −128 to −1 (`fundamental / |i| × s_transpose`)
     * and harmonics from 1 to 128 (`fundamental × i × h_transpose`). Both the forward
     * table and the reverse (midicent → HT number) table are stored, and an
     * `'update/ht'` {@link HUM.DHCmsg} is sent to all registered apps.
     */
    createHTtable(fundamental) {
        let harmonicsTable = {},
            harmonicsReverseTable = {};
        for (let i = -128; i < 0; i++) {
            let freq = fundamental / -i * this.settings.ht.transpose.s.value;
            let midicents = this.constructor.freqToMc(freq);
            harmonicsTable[i] = new this.Xtone(freq, midicents);
            harmonicsReverseTable[midicents] = i;
        }
        for (let i = 1; i < 129; i++) {
            let freq = fundamental * i * this.settings.ht.transpose.h.value;
            let midicents = this.constructor.freqToMc(freq);
            harmonicsTable[i] = new this.Xtone(freq, midicents);
            harmonicsReverseTable[midicents] = i;
        }
        this.tables.ht = harmonicsTable;
        this.tables.reverse.ht = harmonicsReverseTable;

        this.sendMessageToApps(HUM.DHCmsg.htUpd('dhc'));
    }

    /*==============================================================================*
     * FM UI tools
     *==============================================================================*/
    /**
     * Writes the current Fundamental Mother (FM) data to the UI output monitor.
     *
     * @param {hertz}    hz - Frequency expressed in hertz (Hz).
     * @param {midicent} mc - MIDI note number expressed in midicent.
     *
     * @returns {void}
     *
     * @description
     * Constructs a temporary {@link HUM.DHC#Xtone}, applies any active controller
     * pitch-bend via {@link HUM.DHC#bendXtone}, then converts the result to a
     * human-readable note name with {@link HUM.DHC#mcToName} and writes the
     * formatted midicent and hertz values to their respective UI output elements.
     */
    printFundamentalMother(hz, mc){
        let xtObj = new this.Xtone(hz, mc);
        // Apply the controller pitchbend (if present) to the xtObj
        let bent_xtObj = this.bendXtone(xtObj);
        // Print the FM infos on the UI
        let notename = this.mcToName(bent_xtObj.mc),
            name = notename[0],
            sign = notename[1],
            cent = notename[2];
        this.settings.fm.mc.uiElements.out.fm_mc_monitor.innerText = bent_xtObj.mc.toFixed(this.settings.global.cent_accuracy.value + 2) + " = " + name + " " + sign + cent + "\u00A2";
        this.settings.fm.hz.uiElements.out.fm_hz_monitor.innerText = bent_xtObj.hz.toFixed(this.settings.global.hz_accuracy.value);
    }

    /*==============================================================================*
     * KEYMAP HANDLING METHODS
     *==============================================================================*/
    /**
     * Refreshes the controller keymap preset dropdown to match the currently
     * selected FT tuning system, then loads the last-selected preset.
     *
     * @returns {void}
     *
     * @description
     * Clears the HTML `<select>` element, repopulates it with the presets
     * available for the current `settings.ft.selected` tuning system, appends
     * a "Load from file…" option, restores the previously chosen option, and
     * calls {@link HUM.DHC#loadKeymapPreset} to apply it.
     */
    updateKeymapPreset() {
        let htmlElem = this.settings.keymap.presets.uiElements.in.controllerKeymapPresets;
        let lastValue = this.settings.keymap.presets.value[this.settings.ft.selected.value];
        let changeEvent = {target: {value: lastValue}};
        let keymaps = Object.keys(this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value]);
        let optionFile = document.createElement("option");

        while (htmlElem.firstChild) {
            htmlElem.removeChild(htmlElem.firstChild);
        }
        for (let key of keymaps) {
            let option = document.createElement("option");
            option.value = key;
            option.text = this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value][key].notes;
            htmlElem.add(option);
        }
        optionFile.text = "Load from file...";
        optionFile.value = 99;
        htmlElem.add(optionFile);
        htmlElem.value = lastValue;
        this.loadKeymapPreset(changeEvent);
    }

    /**
     * Load a Controller keymap from 'ctrlKeymapPreset' according to the selection on UI.
     *
     * @param {Event} changeEvent - The `change` event from the `<select>` element.
     *
     * @returns {void}
     *
     * @description
     * Reads the selected `<option>` value from `changeEvent.target.value`.
     * If the value is not `99` (the "Load from file…" sentinel), the corresponding
     * preset is written to `tables.ctrl`, the stored selection index is updated,
     * the Piper queue is reinitialised, all tables are recompiled via
     * {@link HUM.DHC#initTables}, and a `'update/ctrlmap'` {@link HUM.DHCmsg}
     * is sent to all registered apps. If the value is `99`, the file input widget
     * is revealed instead.
     */
    loadKeymapPreset(changeEvent) {
        let indexValue = changeEvent.target.value;
        if (indexValue != 99) {
            let keymap = this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value][indexValue].map;
            
            // Store the current Keymap <option> value in a global slot
            this.settings.keymap.presets.value[this.settings.ft.selected.value] = indexValue;
            this.settings.keymap.presets._objValueModified();

            // Write the Controller Keymap into the global object
            this.tables.ctrl = keymap;

            this.initPipeQueue('h');
            
            // re-Create FT & HT tables (necessary for reverse-tables on tsnap midi receivig mode)
            this.initTables();

            this.sendMessageToApps(HUM.DHCmsg.ctrlmapUpd('dhc'));

            this.settings.keymap.keymapFile.uiElements.in.controllerKeymapFile.style.visibility = "hidden";
        } else {
            this.settings.keymap.keymapFile.uiElements.in.controllerKeymapFile.style.visibility = "initial";
        }
    }

    /**
     * Initialize the reading process of the Controller Keymap file.
     *
     * @param {File} file - The `File` object representing the `.hcmap` file to read.
     *
     * @returns {void}
     *
     * @description
     * Creates a `FileReader`, attaches an error handler from the backend utilities,
     * and reads the file as UTF-8 text. Once the read completes, delegates to
     * {@link HUM.DHC#processKeymapData} with the raw text content and filename.
     */
    readKeymapFile(file) {
        let reader = new FileReader();
        // Handle loading errors
        reader.onerror = this.backendUtils.fileErrorHandler;
        if (file) {
            // Read file into memory as UTF-8 text
            reader.readAsText(file);
            // Launch the data processing as soon as the file has been loaded
            reader.onload = (function(e){
                this.processKeymapData(e.target.result, file.name);
            }).bind(this);
        }
    }

    /**
     * Parses the raw text of a `.hcmap` file and registers it as a new keymap preset.
     *
     * @param {string} data - The UTF-8 text content of the controller keymap file.
     *                        Each non-empty line must contain three whitespace-separated
     *                        integers: `<midiNoteNumber> <ftNum> <htNum>`.
     * @param {string} name - The filename, used as the display label in the preset dropdown.
     *
     * @returns {void}
     *
     * @description
     * Splits `data` into lines, parses each line into a `{ft, ht}` mapping keyed by
     * MIDI note number, stores the result as a new entry in
     * `settings.keymap.presets.ctrlKeymapPreset` for the current tuning system,
     * and calls {@link HUM.DHC#updateKeymapPreset} to refresh the UI dropdown
     * and apply the newly loaded keymap.
     */
    processKeymapData(data, name) {
        // Get the key for the new slot
        let optionValue = this.settings.keymap.presets.uiElements.in.controllerKeymapPresets.length;
        // Split by lines
        let allTextLines = data.split(/\r\n|\n/);
        let lines = {};
        // For every line
        for (let i = 0; i < allTextLines.length; i++) {
            // Split the line by spaces or tabs
            let elements = allTextLines[i].split(/\s\s*/);
            lines[parseInt(elements[0])] = { ft: parseInt(elements[1]), ht: parseInt(elements[2]) };
        }
        // Write the Controller Keymap into a new slot in this.settings.keymap.presets.ctrlKeymapPreset
        this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value][optionValue] = {};
        this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value][optionValue].map = lines;
        this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value][optionValue].name = name;
        this.settings.keymap.presets.ctrlKeymapPreset[this.settings.ft.selected.value][optionValue].notes = "FILE: " + name;
        this.settings.keymap.presets.value[this.settings.ft.selected.value] = optionValue;
        // Update the dropdown (and the UI monitors)
        this.updateKeymapPreset();
    }

    /**
     * Renders the current controller keymap as an HTML table and injects it into
     * the keymap modal dialog.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all entries in `tables.ctrl`, formats FT/HT values of `129`
     * as `"N/A"`, and builds a Bootstrap-styled `<table>` string. The resulting
     * HTML is written to the `controllerKeymapTable` UI output element so it is
     * displayed when the modal is opened.
     */
    keymap2Html() {
        let txt = "";
        let map = this.tables.ctrl;
        txt += '<table class="table table-sm table-striped table-hover"><tr><th>MIDI #</th><th>FT</th><th>HT</th></tr>';
        for (let key of Object.keys(map)) {
            let ft, ht = "";
            if (map[key].ft === 129) {
                ft = "N/A";
            } else {
                ft = map[key].ft;
            }
            if (map[key].ht === 129) {
                ht = "N/A";
            } else {
                ht = map[key].ht;
            }
            txt += "<tr><td>" + key + "</td><td>" + ft + "</td><td>" + ht + "</td></tr>";
        }
        txt += "<tr><th>MIDI #</th><th>FT</th><th>HT</th></tr></table>";
        this.settings.keymap.modalTable.uiElements.out.controllerKeymapTable.innerHTML = txt;
    }

    /*==============================================================================*
     * DHC PLAYING METHODS
     *==============================================================================*/
    
    /**
     * Plays a Fundamental Tone: recomputes the HT table, prevents stuck notes,
     * updates the play queue, and dispatches the message to all registered apps.
     *
     * @param {HUM.DHCmsg} dhcMsg - A `'tone-on'` message for the FT to play.
     *
     * @returns {void}
     *
     * @description
     * 1. Recomputes the HT table using the new FT's frequency.
     * 2. Searches the play queue for any already-sounding note with the same
     *    `xtNum` (if `ctrlNum` is absent) or the same `ctrlNum` (if present),
     *    sends a `'tone-off'` for it, and removes it from the queue.
     * 3. Pushes `dhcMsg` onto `playQueue.ft` and stores the new FT in `settings.ht.curr_ft`.
     * 4. Broadcasts `dhcMsg` to all registered apps and updates the UI monitor.
     */
    playFT(dhcMsg) {
        // Recalculate the ht table passing the frequency (Hz)
        this.createHTtable(this.tables.ft[dhcMsg.xtNum].hz);

        // - - - - - - - - - - - - - -
        // ANTI NOTES STUCKING
        if (dhcMsg.ctrlNum === false) {
            // Search by xtNum
            let remPos = false;
            // If there is ONE FT already pressed, stop it before playing it again
            this.playQueue.ft.forEach( (queueTone, position) => {
                // If the key is already pressed
                if (queueTone.xtNum === dhcMsg.xtNum) {
                    this.sendMessageToApps(HUM.DHCmsg.ftOFF(queueTone.source, queueTone.xtNum, queueTone.velocity, queueTone.ctrlNum));
                    remPos = position;
                }
            });
            if (remPos !== false) {
                this.playQueue.ft.splice(remPos, 1);
            }
        } else {
            // Search by ctrlNum
            let remPos = false;
            // If there is ONE FT is already pressed, stop it before playing it again
            this.playQueue.ft.forEach( (queueTone, position) => {
                // If the key is already pressed
                if (queueTone.ctrlNum === dhcMsg.ctrlNum) {
                    this.sendMessageToApps(HUM.DHCmsg.ftOFF(queueTone.source, queueTone.xtNum, queueTone.velocity, queueTone.ctrlNum));
                    remPos = position;
                }
            });
            if (remPos !== false) {
                this.playQueue.ft.splice(remPos, 1);
            }
        }
        // - - - - - - - - - - - - - -

        this.playQueue.ft.push(dhcMsg);

        // Store the current FT into the global slot for future HT table re-computations and UI monitor updates
        this.settings.ht.curr_ft = dhcMsg.xtNum;

        this.sendMessageToApps(dhcMsg);

        // Update the UI
        this.settings.global.monitor.value = ["ft", dhcMsg.xtNum];
    }

    /**
     * Stops a playing Fundamental Tone: removes it from the play queue and
     * dispatches the message to all registered apps.
     *
     * @param {HUM.DHCmsg} dhcMsg - A `'tone-off'` message for the FT to mute.
     *
     * @returns {void}
     *
     * @description
     * Finds the matching entry in `playQueue.ft` by `xtNum`, removes it, and
     * broadcasts `dhcMsg`. If other FTs remain in the queue, the most recently
     * added one is promoted: the HT table is recomputed for its frequency,
     * `curr_ft` is updated, the promoting `'tone-on'` message is re-sent, and
     * the UI monitor is refreshed.
     */
    muteFT(dhcMsg) {            
        // Search the FT number in the playQueue array
        let position = this.playQueue.ft.findIndex(qt => qt.xtNum === dhcMsg.xtNum);
        // If the FTn exists in the playQueue
        if (position !== -1) {
            // Remove the FTn from the playQueue array
            this.playQueue.ft.splice(position, 1);

            this.sendMessageToApps(dhcMsg);

            // If there are other notes, read and play the next note on the playQueue array
            if (this.playQueue.ft.length > 0) {
                // Read the next FT
                let nextIndex = this.playQueue.ft.length - 1;
                let nextTone = this.playQueue.ft[nextIndex];
                // If the next tone is NOT the active one
                if (nextTone.xtNum !== this.settings.ht.curr_ft) {
                    
                    // Recalculate the ht table passing the frequency (Hz)
                    this.createHTtable(this.tables.ft[nextTone.xtNum].hz);
                    // Store the current FT into the global slot for future HT table re-computations and UI monitor updates
                    this.settings.ht.curr_ft = nextTone.xtNum;
                    
                    this.sendMessageToApps(nextTone);

                    // Update the UI
                    this.settings.global.monitor.value = ["ft", nextTone.xtNum];

                }
            }
        }
        // If the FTn does not exist in the playQueue
        // else {
        //     // if (dhcMsg.panic === false) {
        //     //     console.log("STRANGE: there is NOT a FT pressed key #:", dhcMsg.xtNum);
        //     // }
        // }
    }

    /**
     * Plays a Harmonic/Subharmonic Tone: prevents stuck notes, updates the play
     * queue, handles the Piper feature, and dispatches the message to all
     * registered apps.
     *
     * @param {HUM.DHCmsg} dhcMsg - A `'tone-on'` message for the HT to play.
     *
     * @returns {void}
     *
     * @description
     * - Searches the play queue for any already-sounding note matching by
     *   `xtNum` or `ctrlNum` and sends a `'tone-off'` for it before proceeding.
     * - For a normal HT (`xtNum !== 0`): updates `curr_ht`, pushes the message
     *   onto `playQueue.ht`, adds it to the Piper queue (unless already piper-marked),
     *   and refreshes the UI monitor.
     * - For HT 0 (Piper trigger): calls {@link HUM.DHC#piping} with state `1`
     *   to advance and play the next step in the Piper's pipe.
     * - Finally broadcasts `dhcMsg` to all registered apps.
     */
    playHT(dhcMsg) {
        // - - - - - - - - - - - - - -
        // ANTI NOTES STUCKING
        if (dhcMsg.ctrlNum === false) {
            // Search by xtNum
            let remPos = false;
            // If there is ONE HT is already pressed, stop it before playing it again
            this.playQueue.ht.forEach( (queueTone, position) => {
                // If the key is already pressed
                if (queueTone.xtNum === dhcMsg.xtNum) {
                    this.sendMessageToApps(HUM.DHCmsg.htOFF(queueTone.source, queueTone.xtNum, queueTone.velocity, queueTone.ctrlNum));
                    // this.playQueue.ht.splice(position, 1);
                    remPos = position;
                }
            });
            if (remPos !== false) {
                this.playQueue.ht.splice(remPos, 1);
            }
        } else {
            // Search by ctrlNum
            let remPos = false;
            // If there is ONE HT is already pressed, stop it before playing it again
            this.playQueue.ht.forEach( (queueTone, position) => {
                // If the key is already pressed
                if (queueTone.ctrlNum === dhcMsg.ctrlNum) {
                    this.sendMessageToApps(HUM.DHCmsg.htOFF(queueTone.source, queueTone.xtNum, queueTone.velocity, queueTone.ctrlNum));
                    // this.playQueue.ft.splice(position, 1);
                    remPos = position;
                }
            });
            if (remPos !== false) {
                this.playQueue.ht.splice(remPos, 1);
            }
        }
        // - - - - - - - - - - - - - -

        // If it's a normal HT
        if (dhcMsg.xtNum !== 0) {
            // Store the current HT into the global slot for future UI monitor updates
            this.settings.ht.curr_ht = dhcMsg.xtNum;
            
            this.playQueue.ht.push(dhcMsg);
            
            // If the Note ON is not a Piper's fake midievent (FT0)
            if (dhcMsg.piper === false) {
                // Add the HT to the Pipe
                this.piper(dhcMsg);
            }
            
            // Update the UI
            this.settings.global.monitor.value = ["ht", dhcMsg.xtNum];
        
        // If HT0 is pressed, it's the Piper feature!
        } else if (dhcMsg.xtNum === 0) {
            // Note ON the next piped HT
            this.piping(1);
        }

        this.sendMessageToApps(dhcMsg);

    }

    /**
     * Stops a playing Harmonic/Subharmonic Tone: removes it from the play queue
     * and dispatches the message to all registered apps.
     *
     * @param {HUM.DHCmsg} dhcMsg - A `'tone-off'` message for the HT to mute.
     *
     * @returns {void}
     *
     * @description
     * - For a normal HT (`xtNum !== 0`): finds and removes the entry from
     *   `playQueue.ht` by `xtNum`, updates `curr_ht` to the most recently
     *   queued HT (if any), and broadcasts `dhcMsg`.
     * - For HT 0 (Piper trigger, non-panic only): calls {@link HUM.DHC#piping}
     *   with state `0` to release the current Piper step, then broadcasts `dhcMsg`.
     */
    muteHT(dhcMsg) {
        // If it's a normal HT
        if (dhcMsg.xtNum !== 0) {

            // Search the HT number in the queue array
            let position = this.playQueue.ht.findIndex(qt => qt.xtNum === dhcMsg.xtNum);
            // If the HTn exist
            if (position !== -1) {
                // Remove the HTn from the queue array
                this.playQueue.ht.splice(position, 1);
                // Update the curr_ht
                if (this.playQueue.ht.length > 0) {
                    this.settings.ht.curr_ht = this.playQueue.ht[this.playQueue.ht.length-1].xtNum;
                }

                this.sendMessageToApps(dhcMsg);
            } 
            // If the FTn does not exist
            // else {
            //     // if (dhcMsg.panic === false) {
            //     //     console.log("STRANGE: there is NOT a HT pressed key #:", dhcMsg.xtNum);
            //     // }
            // }

        // If HT0 is pressed, it's the Piper feature
        } else if (dhcMsg.xtNum === 0 && dhcMsg.panic === false) {
            // Note OFF the active piped HT
            this.piping(0);
            this.sendMessageToApps(dhcMsg);
        }
    }

    /**
     * Forces all Fundamental and Harmonic/Subharmonic Tones to stop immediately.
     *
     * @returns {void}
     *
     * @description
     * Clears both `playQueue.ft` and `playQueue.ht`, then broadcasts a
     * `'panic'` {@link HUM.DHCmsg} to all registered apps so that every
     * component can silence its active voices.
     */
    panic() {
        this.playQueue.ft = [];
        this.playQueue.ht = [];
        this.sendMessageToApps(HUM.DHCmsg.allNotesOff('dhc'));
    }

    /*==============================================================================*
     * PIPER (HT0) FEATURE
     * The Piper stores the last N pressed HTs and repeats them when HT0 is pressed
     * simulating a special fake MIDI message
     *==============================================================================*/

    /**
     * Stores a `'tone-on'` HT message into the Piper's queue.
     *
     * @param {HUM.DHCmsg} dhcMsg - The HT play message to enqueue.
     *
     * @returns {void}
     *
     * @description
     * If the queue has not yet reached `settings.piper.maxLength`, `dhcMsg` is
     * appended. Otherwise the oldest entry is dropped (`shift()`) before
     * the new message is appended, keeping the queue at a fixed maximum length.
     */
    piper(dhcMsg) {
        // Prepare the fake MIDI message
        // If the pipe is not full
        if (this.settings.piper.queue.length < this.settings.piper.maxLength.value) {
            // Insert the message at the beginning of the queue
            this.settings.piper.queue.push(dhcMsg);
        // Else, if the pipe is full
        } else {
            // Remove the oldest message in the pipe
            this.settings.piper.queue.shift();
            // Insert in the pipe a new message
            this.settings.piper.queue.push(dhcMsg);
        }
    }

    /**
     * Plays or mutes the next step in the Piper's pipe (triggered by HT 0).
     *
     * @param {0|1} state - `1` to play the next step (note-on), `0` to release it (note-off).
     *
     * @returns {void}
     *
     * @description
     * When a new batch of HT messages exists in the Piper queue, they are first
     * spliced into the pipe at the current step position before playback proceeds.
     * - `state === 1` (note-on): Plays the message at the current step by calling
     *   {@link HUM.DHC#playHT} with a piper-marked copy, advancing `currStep`.
     * - `state === 0` (note-off): Releases the `currTone` via {@link HUM.DHC#muteHT}
     *   and advances `currStep` to prepare the next step.
     * - When `currStep` reaches or exceeds `maxLength`, the counter wraps to `0`
     *   and this method calls itself recursively to restart the cycle.
     */
    piping(state) {
        // Get the index (current step)
        let i = this.settings.piper.currStep;
        // If there are notes in the queue
        if (this.settings.piper.queue.length > 0) {
            // Inject the queue into the pipe at the current step position
            this.settings.piper.pipe.splice.apply(this.settings.piper.pipe, [i, this.settings.piper.queue.length].concat(this.settings.piper.queue));
            // If the final pipe is longer than the maxLength
            if (this.settings.piper.pipe.length > this.settings.piper.maxLength.value) {
                // Cut the pipe according to the maxLength
                this.settings.piper.pipe.splice(0, (this.settings.piper.pipe.length - this.settings.piper.maxLength.value));
            }
            // Increase current step and index in order to start playing
            // after the notes that have just been inserted
            this.settings.piper.currStep += this.settings.piper.queue.length;
            i += this.settings.piper.queue.length;
            // Empty the queue
            this.settings.piper.queue = [];
        }
        // If there are notes in the pipe
        if (this.settings.piper.pipe.length > 0) {
            // If step count is not at the end of the pipe
            if (i < this.settings.piper.maxLength.value) {
                // Note ON
                if (state === 1) {
                    // If there is some message at the current step in the pipe
                    if (this.settings.piper.pipe[i]) {
                        // Create the special-marked fake MIDI message
                        // in order to not to be confused with a normal MIDI message
                        // let hancock = this.settings.piper.pipe[i][3];
                        // if (this.settings.controller.receive_mode !== 'keymap') {
                        //     hancock = 'hancock';
                        // }
                        // let midievent = {
                        //     data: [this.settings.piper.pipe[i][0], this.settings.piper.pipe[i][1], this.settings.piper.pipe[i][2], hancock, "piper"]
                        // };
                        this.settings.piper.pipe[i].piper = true;
                        this.playHT(this.settings.piper.pipe[i]);
                        
                        // Send the fake MIDI message
                        // this.midi.in.midiMessageReceived(midievent);
                        // Store the last sent MIDI message in 'currTone'
                        this.settings.piper.currTone = this.settings.piper.pipe[i];
                    } else {
                        this.settings.piper.currTone = null;
                    }
                // Note OFF
                } else if (state === 0) {
                    // If there is a stored MIDI message in 'currTone'
                    if (this.settings.piper.currTone) {
                        let currToneOFF = HUM.DHCmsg.copyOFF(this.settings.piper.currTone);
                        // this.settings.piper.currTone.cmd = "tone-off";
                        // Set the velocity to zero (Note OFF)
                        // this.settings.piper.currTone.data[2] = 0;
                        // Send the fake MIDI message
                        // this.midi.in.midiMessageReceived(this.settings.piper.currTone);
                        this.muteHT(currToneOFF);
                    }
                    // Go to the next step in the pipe
                    this.settings.piper.currStep++;
                }
            // If step count is at the end (or out) of the pipe
            } else {
                // Reset the step counter                
                this.settings.piper.currStep = 0;
                // Retry to execute the icPiping (itself) again
                this.piping(state);
            }
        }
    }

    /**
     * Seeds the Piper's queue with a built-in default melody.
     *
     * @todo The preloaded pipe should only reference HT numbers present in the active controller keymap.
     *
     * @param {('h'|'s'|'hs')} type - The HT scale type of the current controller keymap:
     *                                `'h'` for harmonics, `'s'` for subharmonics, `'hs'` for both.
     *
     * @returns {void}
     *
     * @description
     * Selects a short pre-defined HT sequence for the given scale type, wraps each
     * tone number in a `'tone-on'` {@link HUM.DHCmsg}, stores the array in
     * `settings.piper.queue`, and sets `settings.piper.maxLength` to match the
     * sequence length.
     */
    initPipeQueue(type) {
        let melodies = {
            h: [9, 10, 8, 4, 6],
            s: [-6, -5, -4, -3, -4, -5],
            hs: [6, -6, 6, -6, 6, -6]
        };
        let msgsQueue = [];
        for (let tone of melodies[type]) {
            msgsQueue.push(HUM.DHCmsg.htON('dhc', tone, 120, false, true));
        }
        this.settings.piper.maxLength.value = msgsQueue.length;
        this.settings.piper.queue = msgsQueue;
    }

    /*==============================================================================*
     * UI TONE MONITORS
     *==============================================================================*/

    /**
     * Apply the current controller pitchbend amount (if present) to a Xtone object and return
     * a pitch-bent copy of it.
     *
     * @param {HUM.DHC#Xtone} xtObj - The FT or HT tone object to bend.
     *
     * @returns {HUM.DHC#Xtone} A new frozen {@link HUM.DHC#Xtone} with the
     *   pitch-bend offset applied to both `hz` and `mc`.
     *
     * @description
     * Reads `midi.in.parameters.pitchbend.amount` (normalised −1…+1) and
     * `midi.in.parameters.pitchbend.range.value` (in cents), multiplies them
     * to obtain the pitch-bend offset in cents, then computes the bent frequency
     * and midicent values.
     */
    bendXtone(xtObj) {
        // Compute the Controller Pitchbend amount in cents
        let pitchbend = this.midi.in.parameters.pitchbend.amount * this.midi.in.parameters.pitchbend.range.value,
        // Apply the controller pitchbend if present
            hz = Math.pow(2, pitchbend / 1200) * xtObj.hz,
            mc = (xtObj.mc + pitchbend / 100);
        return new this.Xtone(hz, mc);
    }

    /**
     * Refreshes all UI monitor outputs with the latest computed values and
     * sends an `'init'` message to all registered apps.
     *
     * @returns {void}
     *
     * @description
     * Updates the FM monitor via {@link HUM.DHC#printFundamentalMother}, sets
     * the FT monitor to `curr_ft`, conditionally sets the HT monitor to
     * `curr_ht` if a tone has previously been pressed, and finally broadcasts
     * an `'init'` {@link HUM.DHCmsg} so that all subscribers can refresh
     * their own UI elements.
     */
    initUImonitors() {
        // Compile the FM monitors
        this.printFundamentalMother(this.settings.fm.hz.value, this.settings.fm.mc.value);
        // Compile the FT monitors
        this.settings.global.monitor.value = ["ft", this.settings.ht.curr_ft];
        // If a HT has been already pressed
        if (this.settings.ht.curr_ht) {
            // Compile the HT monitor
            this.settings.global.monitor.value = ["ht", this.settings.ht.curr_ht];
        }
        this.sendMessageToApps(HUM.DHCmsg.init('dhc'));
    }

    /*==============================================================================*
     * NOTE NAMING CONVERSION TOOLS
     *==============================================================================*/

    /**
     * Parses a note-name string into a MIDI note number under one of three
     * octave-numbering conventions.
     *
     * @example
     * // Octave conventions (C0 = MIDI note number):
     * // 'hancock'    C0 == 0
     * // 'scientific' C0 == 12
     * // 'ui'         C0 depends on settings.global.middle_c
     *
     * @param {('hancock'|'ui'|'scientific')} mode - The octave-numbering convention to apply.
     * @param {string}                        note - Note name in the format `[A-G]#?-?\d+`
     *                                               (e.g. `'C0'`, `'A#4'`, `'G-3'`, `'D#-1'`).
     *
     * @returns {midinnum|undefined} The corresponding MIDI note number, or `undefined`
     *   if `note` cannot be parsed.
     *
     * @description
     * Extracts the chromatic pitch class and octave number from `note` using
     * regular expressions, looks up the semitone offset in a fixed reference
     * table, and applies the octave offset appropriate for the chosen `mode`.
     */
    nameToMidiNumber(mode, note) {
        let ref = {
            "C": 0,
            "C#": 1,
            "D": 2,
            "D#": 3,
            "E": 4,
            "F": 5,
            "F#": 6,
            "G": 7,
            "G#": 8,
            "A": 9,
            "A#": 10,
            "B": 11,
        };
        // Get the number of the octave
        let num = note.match(/-?\d+/g);
        // Get the note name
        let char = note.match(/[A-Z]+#*/);
        if (num && char) {
            let octave = Number(num[0]);
            let note = char[0];
            if (mode === 'hancock') {
                // Return the MIDI note number 
                return ref[note] + (12 * octave);
            } else if (mode === 'ui') {
                                                     // middle C octave - 5 -> starting octave
                return ref[note] + (12 * (octave + ((this.settings.global.middle_c.value-5) * -1)));
            } else if (mode === 'scientific') {
                return ref[note] + (12 * (octave + 1));
            }
        } else {
            return undefined;
        }
    }

    /**
     * Converts a MIDI note number to its note names under all three octave
     * conventions, plus a flag indicating whether the key is black.
     *
     * @param {midinnum} midikey - Integer MIDI note number. Negative values and
     *                             values above 127 are accepted (out-of-MIDI-range pitches).
     *
     * @returns {Array.<string, string, boolean, string>} A four-element array:
     *   `[hancockName, uiName, isBlack, scientificName]`.
     *
     * @description
     * Uses the enharmonic preference from `settings.global.enharmonic_nn` (`'sharp'`
     * or `'flat'`) to select the appropriate note-name lookup table, then computes
     * the quotient and remainder of `midikey / 12` to determine the octave and
     * pitch class. Negative MIDI numbers are handled separately to ensure correct
     * floor division.
     */
    midiNumberToNames(midikey) {
        let ref = {};
        if (this.settings.global.enharmonic_nn.value === 'sharp') {
            ref = {
                0: ['C', false],
                1: ['C#', true],
                2: ['D', false],
                3: ['D#', true],
                4: ['E', false],
                5: ['F', false],
                6: ['F#', true],
                7: ['G', false],
                8: ['G#', true],
                9: ['A', false],
                10:['A#', true],
                11:['B', false],
            };
        } else if (this.settings.global.enharmonic_nn.value === 'flat') {
            ref = {
                0: ['C', false],
                1: ['Db', true],
                2: ['D', false],
                3: ['Eb', true],
                4: ['E', false],
                5: ['F', false],
                6: ['Gb', true],
                7: ['G', false],
                8: ['Ab', true],
                9: ['A', false],
                10:['Bb', true],
                11:['B', false],
            };
        } else {
            alert('The parameter "DHC.settings.global.enharmonic_nn" has unexpected value!');
        }
        // If positive - Higher than midikey 0 / 8.1758 Hz (C-1 in scientific pitch notation)
        if (midikey >= 0) {
            // Compute the quotient and remainder of the MIDI note number
            let quotient = Math.trunc(midikey/12);
            let remainder = midikey % 12;
            
            // String concatenation: Hancock note name
            let hancockNotename = ref[remainder][0] + quotient;
            // String concatenation: UI note name 
            let uiNotename = ref[remainder][0] + (quotient + this.settings.global.middle_c.value - 5);
            let sciNotename = ref[remainder][0] + (quotient - 1);
            let isBlack = ref[remainder][1];
            // Return an array with both, Hancock and UI note name
            return [hancockNotename, uiNotename, isBlack, sciNotename];
        // If negative - Lower than midikey 0 / 8.1758 Hz (C-1 in scientific pitch notation)
        } else {
            // Compute the quotient and remainder of the MIDI note number
            let quotient = Math.trunc(midikey/12)-1;
            let remainder = midikey % 12;
            remainder = (remainder === 0) ? remainder : (12 + remainder);
            
            // String concatenation: Hancock note name
            let hancockNotename = ref[remainder][0] + quotient;
            // String concatenation: UI note name 
            let uiNotename = ref[remainder][0] + (quotient + this.settings.global.middle_c.value - 5);
            let sciNotename = ref[remainder][0] + (quotient - 1);
            let isBlack = ref[remainder][1];
            // Return an array with both, Hancock and UI note name
            return [hancockNotename, uiNotename, isBlack, sciNotename];

        }
    }
 
    /**
     * Converts a midicent value to a human-readable UI note name with cent deviation.
     *
     * @param {midicent} mc - Pitch expressed in midicent (float).
     *
     * @returns {Array.<string, string, number, boolean>} A four-element array:
     *   `[noteName, sign, cents, isBlack]` where `sign` is `'+'`, `'−'`, or `''`.
     *
     * @description
     * Rounds `mc` to the nearest semitone by splitting it into an integer MIDI
     * note number and a fractional cent offset. If the offset exceeds ±0.5
     * semitones, the note number is nudged up or down and the sign is inverted.
     * Calls {@link HUM.DHC#midiNumberToNames} for the note name, then scales
     * the fractional part to cents according to `settings.global.cent_accuracy`.
     */
    mcToName(mc) {
        let noteNumber = Math.trunc(mc),
            noteCents = mc - noteNumber,
            centSign;
        // If positive - Higher than 0mc / 8.1758 Hz (C-1 in scientific pitch notation)
        if (mc >= 0) {
            centSign = "\u002B"; // &plus;
            if (noteCents > 0.5) {
                noteNumber = noteNumber + 1;
                noteCents = 1 - noteCents;
                centSign = "\u2212"; // &minus;
            }
        // If negative - Lower than 0mc / 8.1758 Hz (C-1 in scientific pitch notation)
        } else {
            centSign = "\u2212"; // &minus;
            noteCents = Math.abs(noteCents);
            if (noteCents > 0.5) {
                noteNumber = noteNumber - 1;
                noteCents = 1 - noteCents;
                centSign = "\u002B"; // &plus;
            }
        }
        // Get the note names
        let noteNames = this.midiNumberToNames(noteNumber);
        // Convert the cents in decimal notation to unit
        noteCents = (noteCents.toFixed(this.settings.global.cent_accuracy.value + 2) * 100).toFixed(this.settings.global.cent_accuracy.value); 
        let noteCentsUI = Number(noteCents, 10);
        // Remove the centSign if cents are zero
        centSign = (noteCentsUI === 0) ? "" : centSign;
        //       note name,   +/- sign,    cents,    black key y/n
        return [noteNames[1], centSign, noteCentsUI, noteNames[2]];
    }
 
    /**
     * Returns a formatted string of the UI note name with cent deviation.
     *
     * @param {midicent} mc - Pitch expressed in midicent (float).
     *
     * @returns {string} A human-readable string such as `'D#3 −45¢'`.
     *
     * @description
     * Delegates to {@link HUM.DHC#mcToName} and concatenates its components
     * into a single display string.
     */
    mcToNameString(mc) {
        let result = this.mcToName(mc);
        return result[0] + " " + result[1] + result[2] + "\u00A2";
    }

    // end class Prototype

    /*==============================================================================*
    * GENERAL DHC COMPUTING TOOLS
    *==============================================================================*/

    /**
     * Converts a MIDI note number (in midicent) to a frequency in hertz.
     *
     * @param {midicent} mc - MIDI note number expressed in midicent.
     *
     * @returns {hertz} The corresponding frequency in hertz (Hz).
     *
     * @description
     * Delegates to {@link HUM.DHC.compute_nEDx} using the standard 12-EDO
     * reference (`unit = 2`, `division = 12`, `masterTuning = 440 Hz`).
     */
    static mcToFreq(mc) {
        // Use the icCompute_nEDx() function to get frequency
        return this.compute_nEDx(mc - 69, 2, 12, 440);
    }

    /**
     * Converts a frequency in hertz to a MIDI note number in midicent.
     *
     * @param {hertz} freq - Frequency expressed in hertz (Hz).
     *
     * @returns {midicent} The corresponding MIDI note number in midicent (full floating-point accuracy).
     *
     * @description
     * Uses the standard formula: `midicent = 69 + 12 × log₂(freq / 440)`,
     * where 69 is the MIDI note number of A4 and 440 Hz is the reference pitch.
     */
    static freqToMc(freq) {
        let midicent = 69 + 12 * Math.log2(freq / 440);
        // Return full accuracy midicent
        return midicent;
    }

    /**
     * Computes the frequency of a relative tone step in an n-EDx equal-temperament scale.
     *
     * @param  {number} relativeTone - The step number relative to the reference tone
     *                                 (should be an integer; 0 returns `masterTuning`).
     * @param  {number} unit         - The interval ratio to subdivide (must be > 0;
     *                                 e.g. `2` for an octave in 12-TET).
     * @param  {number} division     - Number of equal divisions of `unit` (must be > 0;
     *                                 e.g. `12` for semitones).
     * @param  {hertz}  masterTuning - Reference frequency in hertz (Hz) for step 0.
     *
     * @returns {hertz} The frequency of the requested step in hertz (Hz), at full
     *   floating-point accuracy.
     *
     * @description
     * Implements the formula: `f = unit^(relativeTone / division) × masterTuning`.
     * Passing `unit = 2`, `division = 12`, and `masterTuning = 440` reproduces
     * standard 12-TET.
     */
    static compute_nEDx(relativeTone, unit, division, masterTuning) {
        let frequency = Math.pow(unit, relativeTone / division) * masterTuning;
        // Return full accuracy frequency
        return frequency;
    }

    /**
     * Returns a new array containing only the unique elements of the input.
     *
     * @param {Array.<number>} arrArg - Array of numbers potentially containing duplicates.
     *
     * @returns {Array.<number>} A new array with duplicate values removed, preserving
     *   the original order of first occurrence.
     */
    static uniqArray(arrArg) {
          return arrArg.filter((elem, pos, arr) => arr.indexOf(elem) === pos );
    }

}; // end Class
