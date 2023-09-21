 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2023 by Walter G. Mantovani (http://armonici.it).
 * Written by Walter G. Mantovani.
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
 * The Dynamic Harmonics Calculator class<br>
 *    This is the computational kernel for the frequency/midicent tables.
 *    Manage an route the communications from and to the other App components.
 */
HUM.DHC = class {
    /**
     * @param {string} id            - The DHC full ID, composed by the HUM ID and the DHC ID (eg. '1-0', '1-1', '1-2' etc.)
     * @param {number} idx           - The DHC ID (eg. 0, 1, 2 etc.)
     * @param {HUM}    harmonicarium - The HUM instance to which this DHC must refer.
     */
    constructor(id, idx, harmonicarium) {
        /**
        * The HUM instance.
        *
        * @member {HUM}
        */
        this.harmonicarium = harmonicarium;
        
        /**
        * The id of this DHC instance.
        *
        * @member {string}
        */
        this.id = id;

        this._id = idx;
        
        /**
        * The name of the `HUM.DHC`, useful for group the parameters on the DB.
        * Currently hard-coded as `"dhc"`.
        *
        * @member {string}
        */
        this.name = 'dhc';
        
        /**
         * DHC Tables
         *
         * @member {Object}
         * 
         * @property {CtrlKeymap}                    ctrl       - The current Controller Keymap.
         * @property {Object.<xtnum, HUM.DHC#Xtone>} ft         - The current Fundamental Tones table.
         * @property {Object.<xtnum, HUM.DHC#Xtone>} ht         - The current Harmonic/Subharmonic Tones table.
         * @property {Object}                        reverse    - Namespace for the everse tables.
         * @property {Object.<midinnum, xtnum>}      reverse.ft - Reverse Fundamental Tones table.
         * @property {Object.<midinnum, xtnum>}      reverse.ht - Reverse Harmonic/Subharmonic Tones table.
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
         * Registered Apps<br>
         *     The <em>key</em> of each record is an app Object and the <em>value</em> is the metod that must be invoked
         *     to send messages towards the app.
         * @todo Pass by constructor parameters and if false, no signals will be sent to the component.
         *
         * @member {Map.<Object, string>}
         */
        this.registeredApps = new Map();
        
        /**
         * Queues for FT/HT playing and muting management
         *
         * @member {Object}
         *
         * @property {Array.<HUM.DHCmsg>} ft - Queue for FT key-press tracking
         * @property {Array.<HUM.DHCmsg>} ht - Queue for HT key-press tracking
         */
        this.playQueue = {
            ft: [],
            ht: [],
        };
        
        /**
        * The Backend Utils instance
        *
        * @member {BackendUtils}
        */
        this.backendUtils = this.harmonicarium.components.backendUtils;

        /**
         * DHC Settings
         * @todo Rename "settings" to "parameters".
         *
         * @member {HUM.DHC#Parameters}
         * 
         */
        this.settings = new this.Parameters(this);

        /**
        * The Hancock instance
        *
        * @member {HUM.Hancock}
        */
        this.hancock = new HUM.Hancock(this);

        /**
        * The Synth instance
        *
        * @member {HUM.Synth}
        */
        this.synth = new HUM.Synth(this);

        /**
        * The MidiHub instance
        *
        * @member {HUM.midi.MidiHub}
        */
        this.midi = new HUM.midi.MidiHub(this);

        this.settings._init();

        /**
        * The Hstack instance
        *
        * @member {HUM.Hstack}
        */
        this.hstack = new HUM.Hstack(this);
        // =======================
    } // end class Constructor
    // ===========================
    
    /**
     * Register a new App (module) with a specified method and priority, and rearranges
     * the registered apps by priority.
     * 
     * @param {Object} app      - The instance of the app to be registered.
     * @param {string} method   - The name of the method to use to send messages to the app.
     * @param {number} priority - The priority with which the registered app will receive messages.
     */
    registerApp(app, method, priority) {
        let rA = this.registeredApps;
        rA.set(app, {method: method, priority: priority});
        // Re-arrage the registered apps by priority
        this.registeredApps = new Map([...rA.entries()].sort((a, b) => a[1].priority-b[1].priority));
    }

    /**
     * Send a DHCmsg message to all the registered apps
     * 
     * @param {HUM.DHCmsg} dhcMsg - The message to send
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
     * Recompile FT & HT tables in the right order
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
     * Recompile the Fundamental Tones (FT) table in accordance with the current FT Tuning System
     * and send a message to the other apps.
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
     * Recompile the Harmonic/Subarmonic Tones (HT) table and the reverse one and send a message to the other apps.
     * 
     * @todo Implement custom H/S table length (16>32>64>128) to increase performances if needed.
     * 
     * @param {hertz} fundamental - The tone on which to build the table, expressed in hertz (Hz).
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
     * Print the Fundamental Mother (FM) data to the UI output monitor.
     *
     * @param {hertz}    hz - Frequency expressed in hertz (Hz).
     * @param {midicent} mc - MIDI note number expressed in midicent.
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
     * Update the preset list according to the selected FTs Tuning System
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
     * It performs various actions such as updating global variables, initializing tables,
     * and sending a message to apps.
     *
     * @param {Event} changeEvent - Change HTML event object on 'select' element (ctrl keymap dropdown).
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
     * @param {File} file - The file object that represents the keymap to be read.
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
     * Build the Controller Keymap table on the incoming raw data from .hcmap file.
     * In particular, it splits the data into lines, parses each line into elements, 
     * and writes the parsed elements into a new slot in the settings keymap presets.
     *
     * @param {string} data - The text content of the Controller keymap file. It is expected to
     *                        be in a specific format where each line represents a key and its
     *                        corresponding values. The values can be separated by spaces or tabs.
     * @param {string} name - The filename, that represents the name of the keymap preset.
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
     * Create an HTML table from the controller keymap and write it to the UI under a modal element.
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
     * Play a Fundamental Tone.
     * It recalculates the HT table.
     * It avoids stucking notes by stopping any currently playing FTs with the same xtNum or ctrlNum.
     * It manages the play queue, sends the message to the registered apps and updates the UI monitors.
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the FT to be played.
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
     * Stop playing a Fundamental Tone.
     * It manages the play queue and sends the message to the registered apps.
     * If there are other notes in the play queue, it plays the next note and updates the UI monitors.
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the FT to be muted.
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
     * Play a Harmonic/Subharmonic Tone.
     * It avoids stucking notes by stopping any currently playing FTs with the same xtNum or ctrlNum.
     * It manages the play queue, sends the message to the registered apps and updates the UI monitors.
     * 
     * @param {HUM.DHCmsg} dhcMsg - The message containing the HT to be played.
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
     * Stop playing a Harmonic/Subharmonic Tone
     * It manages the play queue and sends the message to the registered apps.
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the HT to be muted.
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
     * Force to stop playing all Fundamental and Harmonic/Subharmonic Tones.
     * It clears the play queues and sends a message to the registered apps to turn off all notes.
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
     * Store a play-HT message into the Piper's queue.
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the HT to be piped.
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
     * Play or mute the next HT available in the Piper's queue
     * (usually when HT0 is pressed or released).
     *
     * @param {(0|1)} state - Note ON/OFF; 1 is ON (play), 0 is OFF (mute)
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
     * Experimental function for setting a default/preloaded melody into the Piper.
     * It fills the Piper's queue with a sequence of HTs.
     *
     * @todo - The preloaded Pipe must use only the available keys.
     * 
     * @param {('h'|'s'|'hs')} type - The HTs scale type of the current Controller keymap.
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
     * Apply the current controller pitchbend amount (if present) to a Xtone object and return a pitch-bent copy of it.
     *
     * @param {HUM.DHC#Xtone} xtObj - FT or HT object of the tone to bend
     *
     * @return {HUM.DHC#Xtone} - The pitch-bent object
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
     * Update all parts of the UI with the last computed or set values.
     * Send the 'init' message to all the redistered Apps. 
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
     * Parse a note name string to get the MIDI note number in accordance with the specified mode.
     *
     * @example
     * Depending on the mode:
     * - 'hancock' C0 == 0 midicent == 0 midinnum
     * - 'scientific' C0 == 12 midicent == 12 midinnum
     * - 'ui' C0 == // depends on Middle C setting ({@link DHC#Parameters.global.middle_c}) 
     * 
     * @param {('hancock'|'ui'|'scientific')} mode - The method in which the 'note' should be interpreted.
     * @param {string}                        note - The note name in format <code>[A-G]#?-?\d+</code>. E.g. C0, A#4, G-3, D#-1  
     * 
     * @return {midinnum} - MIDI note number (based on the given mode and note).
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
     * Utiity to convert a given MIDI note number to an array containing 'hancock', 'ui' and 'scientific' note name,
     * plus the information if the key on the piano should be black or not.
     *
     * @param {midinnum} midikey - MIDI note number (integer). The standard is from 0 (C-1) to 127 (G9).
     *
     * @return {Array.<string, string, boolean, string>} - An array with Hancock, UI and Scientific note name, and if the key is white or black.
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
     * Utility to convert a given midicent value to an array containing the UI note name +/- cents
     * plus the information if the key on the piano should be black or not.
     * 
     * @param {midicent} mc - Pitch in midicent (float)
     *
     * @return {Array.<string, number, string, boolean>} - Array containing [note name, +/- sign, cents, black key y/n]
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
     * Util to get the full string of UI note name +/- cents.
     *
     * @param {midicent} mc - Pitch in midicent (float).
     *
     * @return {string} - The compliled string; e.g. D#3 -45&cent;.
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
     * From MIDI note number to frequency (Hz).
     * 
     * @param {midicent} mc - MIDI note number expressed in midicents.
     * 
     * @return {hertz} - Frequency expressed in hertz (Hz).
     */
    static mcToFreq(mc) {
        // Use the icCompute_nEDx() function to get frequency
        return this.compute_nEDx(mc - 69, 2, 12, 440);
    }

    /**
     * From frequency (Hz) to MIDI note number.
     * 
     * @param {hertz} freq - Frequency expressed in hertz (Hz).
     * 
     * @return {midicent} - MIDI note number expressed in midicent.
     */
    static freqToMc(freq) {
        let midicent = 69 + 12 * Math.log2(freq / 440);
        // Return full accuracy midicent
        return midicent;
    }

    /**
     * Calculate the n-EDx ("free" equal temperament) of a relative tone.
     *
     * @param  {number} relativeTone - Relative number of the "step" in the scale (should be integer).
     * @param  {number} unit         - Ratio unit (must be greater than zero).
     * @param  {number} division     - Equal divisions of the ratio unit (must be greater than zero).
     * @param  {hertz}  masterTuning - Reference frequency expressed in hertz (Hz).
     * 
     * @return {hertz} - Frequency expressed in hertz (Hz)
     */
    static compute_nEDx(relativeTone, unit, division, masterTuning) {
        let frequency = Math.pow(unit, relativeTone / division) * masterTuning;
        // Return full accuracy frequency
        return frequency;
    }

    /**
     * Remove duplicated values on the array passed via the argument.
     *
     * @param {Array.<number>} arrArg - Array of numbers.
     *
     * @return {Array.<number>} - A new array with only unique elements.
     */
    static uniqArray(arrArg) {
          return arrArg.filter((elem, pos, arr) => arr.indexOf(elem) === pos );
    }

}; // end Class


/**
 * A FT or HT relative tone (used in `HUM.DHC#table.ft` `HUM.DHC#table.ht`).
 * It's a freezed object.
 */
HUM.DHC.prototype.Xtone = class {
    /**
     * @property {hertz}    hz - Frequency expressed in hertz (Hz).
     * @property {midicent} mc - MIDI note number expressed in midicents.
     */
    constructor(hz, mc) {
        this.hz = Number(hz);
        this.mc = Number(mc);
        Object.freeze(this);
    }
};

/** 
 * Instance class-container used to create all the `HUM.Param` objects for the `HUM.DHC` instance.
 */
HUM.DHC.prototype.Parameters = class { 
    /**
     * @param {HUM.DHC} dhc - The DHC instance in which this class is being used.
     */
    constructor(dhc) {
        /**
         * Global settings
         *
         * @member {Object}
         * @namespace
         */
        this.global = {
            /**  
             * This property controls the accuracy for the numbers expressed on hertz (Hz) in the UI
             * and initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - Number of decimal places (on UI) for the numbers expressed in hertz (Hz).
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.dhc_hzAccuracy - The HTML input widget for Hz accuracy.
             */
            hz_accuracy: new HUM.Param({
                app: dhc,
                idbKey: 'dhcHzAccuracy',
                uiElements: {
                    'dhc_hzAccuracy': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'number',
                    })
                },                
                dataType: 'integer',
                initValue: 2,
                postSet: (value, param, init) => {
                    if (!init) {
                        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
                        dhc.initUImonitors();
                    }
                }
            }),

            /**  
             * This property controls the accuracy for the numbers expressed in cents on the UI
             * and initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - Number of decimal places (on UI) for the numbers expressed in cents.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.dhc_mcAccuracy - The HTML input widget for cent accuracy.
             */
            cent_accuracy: new HUM.Param({
                app: dhc,
                idbKey: 'dhcCentAccuracy',
                uiElements: {
                    'dhc_mcAccuracy': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'number',
                    })
                },
                dataType: 'integer',
                initValue: 0,
                postSet: (value, param, init) => {
                    if (!init) {
                        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
                        dhc.initUImonitors();
                    }
                }
            }),

            /**  
             * This property controls the way the enharmonic notes in the UI are displayed: 
             * 'sharp' for [#] or 'flat' for [b] on the UI.
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                          - Enharmonic note naming; 'sharp' or 'flat'.
             * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                  - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.dhc_enharmonicNN - The HTML input widget for enharmonic note naming.
             */
            enharmonic_nn: new HUM.Param({
                app: dhc,
                idbKey: 'dhcEnharmonicNN',
                uiElements: {
                    'dhc_enharmonicNN': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'selection',
                    })
                },
                dataType: 'string',
                initValue: 'sharp',
                allowedValues: ['sharp', 'flat'],
                postSet: (value, param, init) => {
                    if (!init) {
                        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
                        dhc.initUImonitors();
                    }
                }
            }),

            /**  
             * This property controls the way the middle C is named in the UI by setting its octave number.
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                     - Middle C octave number.
             * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in             - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.dhc_middleC - The HTML input widget for the middle C octave.
             */
            middle_c: new HUM.Param({
                app: dhc,
                idbKey: 'dhcMiddleC',
                uiElements: {
                    'dhc_middleC': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'number',
                    })
                },
                dataType: 'integer',
                initValue: 4,
                postSet: (value, param, init) => {
                    if (!init) {
                        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
                        dhc.initUImonitors();
                    }
                }
            }),
            /**  
             * This property is a proxy for the UIelems related to the DHC monitor that shows the last pressed FT and HT.
             * It's not stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                 - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.out.monFT_frequency - The HTML for FT frequency (monitor)
             * @property {HTMLElement} uiElements.out.monFT_midicents - The HTML for FT midicents (monitor)
             * @property {HTMLElement} uiElements.out.monFT_notename  - The HTML for FT note name (monitor)
             * @property {HTMLElement} uiElements.out.monFT_tone      - The HTML for FT relative tone number (monitor)
             * @property {HTMLElement} uiElements.out.monHT_frequency - The HTML for HT frequency (monitor)
             * @property {HTMLElement} uiElements.out.monHT_midicents - The HTML for HT midicents (monitor)
             * @property {HTMLElement} uiElements.out.monHT_notename  - The HTML for HT note name (monitor)
             * @property {HTMLElement} uiElements.out.monHT_tone      - The HTML for HT tone number (monitor)
             */
            monitor: new HUM.Param({
                app: dhc,
                idbKey: 'dhcMonitor',
                uiElements: {
                    'monFT_frequency': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monFT_midicents': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monFT_notename': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monFT_tone': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monHT_frequency': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monHT_midicents': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monHT_notename': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'monHT_tone': new HUM.Param.UIelem({
                        role: 'out',
                    })
                },
                init: false,
                dataType: 'array',
                presetStore: false,
                presetRestore: false,
                postSet: (value, thisParam, init) => {
                    const [type, xtNum] = value;
                    let xtObj = dhc.tables[type][xtNum];
                    // Apply the controller pitchbend (if present) to the array 
                    xtObj = dhc.bendXtone(xtObj);
                    let notename = dhc.mcToName(xtObj.mc),
                        name = notename[0],
                        sign = notename[1],
                        cent = notename[2],
                        hzAccuracy = this.global.hz_accuracy.value,
                        mcAccuracy = this.global.cent_accuracy.value;
                    if (type === "ft") {
                        // Update the log on MONITOR FT info on the UI
                        thisParam.uiElements.out.monFT_tone.innerText = xtNum;
                        thisParam.uiElements.out.monFT_midicents.innerText = xtObj.mc.toFixed(mcAccuracy + 2);
                        thisParam.uiElements.out.monFT_notename.innerText = name + " " + sign + cent + "\u00A2";
                        thisParam.uiElements.out.monFT_frequency.innerText = xtObj.hz.toFixed(hzAccuracy);
                    } else if (type === "ht") {
                        // Update the log on MONITOR HT info on the UI
                        thisParam.uiElements.out.monHT_tone.innerText = xtNum;
                        thisParam.uiElements.out.monHT_midicents.innerText = xtObj.mc.toFixed(mcAccuracy + 2);
                        thisParam.uiElements.out.monHT_notename.innerText = name + " " + sign + cent + "\u00A2";
                        thisParam.uiElements.out.monHT_frequency.innerText = xtObj.hz.toFixed(hzAccuracy);
                    }
                }
            }),
        };

        /**
         * Fundamental Mother (FM) settings
         * 
         * @member {Object}
         * @namespace
         */
        this.fm = {            
            /**  
             * This property allows the FM to be set by a value expressed in hertz (Hz).
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {hertz}       value                        - The FM frequency in hertz (Hz) as float number.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {Object}      uiElements.out               - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.in.fm_hz          - The HTML input widget for FM frequency in hertz.
             * @property {HTMLElement} uiElements.out.fm_hz_monitor - The HTML output that shows the current FM frequency in hertz.
             */
            hz: new HUM.Param({
                app: dhc,
                idbKey: 'dhcFMhz',
                uiElements: {
                    'fm_hz': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'number',
                    }),
                    'fm_hz_monitor': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                },
                dataType: 'float',
                initValue: false, // 130.8127826502993,
                preSet: (value, thisParam) => {
                    if (value <= 0) {
                        value = 1;
                        thisParam.uiElements.in.fm_hz.value = 1;
                    }
                    return value;
                },
                postSet: (value, thisParam, init) => {
                    // Change the 'init' for eventual icDHCinit
                    if (!init) {
                        this.fm.init.value = 'hz';
                    }
                },
            }),

            /**  
             * This property allows the FM to be set by a value expressed in midicents (mc).
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {midicent}    value                        - The FM frequency in midicent as float number.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {Object}      uiElements.out               - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.in.fm_mc          - The HTML input widget for FM frequency in midicent.
             * @property {HTMLElement} uiElements.out.fm_mc_monitor - The HTML output that shows the current FM frequency in midicent.
             */
            mc: new HUM.Param({
                app: dhc,
                idbKey: 'dhcFMmc',
                uiElements: {
                    'fm_mc': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'number',
                    }),
                    'fm_mc_monitor': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                },
                dataType: 'float',
                initValue: 48, // C3
                postSet: (value, thisParam, init) => {
                    // Change the 'init' for eventual icDHCinit
                    if (!init) {
                        this.fm.init.value = 'mc';
                    }
                },
            })
        };

        /**  
         * This property indicates what unit to use for initializing the FM when the app is loaded: 'hz' or 'mc'.
         * It's stored on the DB.
         * @instance
         * @name init
         * @memberof HUM.DHC#Parameters#fm
         * @type {HUM.Param}
         * 
         * @property {('mc'|'hz')} value - What unit to use to initialize the FM, 'hz' or 'mc'.
         */
        this.fm.init = new HUM.Param({
            app: dhc,
            idbKey: 'dhcFMinit',
            dataType: 'string',
            role: 'int',
            initValue: 'mc',
            init: false,
            postSet: (value, thisParam, init) => {
                if (value === 'hz') {
                    let midicents = dhc.constructor.freqToMc(this.fm.hz.value);
                    this.fm.mc._setValue(midicents, true);
                    // if (!init) {
                        // Recreate all tables
                        dhc.initTables();
                    // }
                    this.fm.mc.uiElements.in.fm_mc.value = "";
                } else if (value === 'mc') {
                    let freq = dhc.constructor.mcToFreq(this.fm.mc.value);
                    this.fm.hz._setValue(freq, true);
                    // if (!init) {
                        // Recreate all tables
                        dhc.initTables();
                    // }
                    this.fm.hz.uiElements.in.fm_hz.value = "";
                } else {
                    alert("The 'DHC.settings.fm.init' attribute has an unexpected value: " + this.fm.init.value);
                }
            }
        });

        /**
         * Fundamental Tones (FTs) scale tuning method settings
         * 
         * @member {Object}
         * @namespace
         */
        this.ft = {    
            /**
             * FT "Equal Temperament" tuning method parameters
             * 
             * @member {Object}
             * @namespace
             */
            nEDx: {
                /**  
                 * This property indicates what interval is to be divided into logarithmically equal parts.
                 * It's initialises the eventListener of the UIelem related to it.
                 * It's stored on the DB.
                 * @instance
                 *
                 * @member {HUM.Param}
                 * 
                 * @property {number}      value                     - The ratio (interval) to divide.
                 * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in             - Namespace for the "in" HTML elements.
                 * @property {HTMLElement} uiElements.in.ftNEDX_unit - The HTML input widget for the ratio unit.
                 */
                unit: new HUM.Param({
                    app: dhc,
                    idbKey: 'dhcFTnEDxUnit',
                    uiElements: {
                        'ftNEDX_unit': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'change',
                            htmlTargetProp: 'value',
                            widget: 'number',
                        })
                    },
                    dataType: 'integer',
                    initValue: 2,
                    preSet: (value, thisParam) => {
                        if (value <= 1) {
                            value = 2;
                            thisParam.uiElements.in.ftNEDX_unit.value = 2;
                        }
                        return value;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            // Recreate all tables
                            dhc.initTables();
                        }
                    },
                }),
                /**  
                 * This property indicates how many logarithmically equal parts the unit should be divided into.
                 * It's initialises the eventListener of the UIelem related to it.
                 * It's stored on the DB.
                 * @instance
                 *
                 * @member {HUM.Param}
                 * 
                 * @property {number}      value                         - The number of equal divisions.
                 * @property {Object}      uiElements                    - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                 - Namespace for the "in" HTML elements.
                 * @property {HTMLElement} uiElements.in.ftNEDX_division - The HTML input widget for equal divisions.
                 */
                division: new HUM.Param({
                    app: dhc,
                    idbKey: 'dhcFTnEDxDivision',
                    uiElements: {
                        'ftNEDX_division': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'change',
                            htmlTargetProp: 'value',
                            widget: 'number',
                        })
                    },
                    dataType: 'integer',
                    initValue: 12,
                    preSet: (value, thisParam) => {
                        if (value < 1) {
                            value = 12;
                            thisParam.uiElements.in.ftNEDX_division.value = 12;
                        }
                        return value;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            // Recreate all tables
                            dhc.initTables();
                        }
                    },
                }),
            },

            /**
             * "Harmonics and subharmonics" FT tuning method parameters.
             * 
             * @member {Object}
             * @namespace
             */
            h_s: {
                /**  
                 * This property indicates what sub-method of "Harmonics and subharmonics" (H-S) tuning is selected for FT.
                 * It's stored on the DB.
                 * @instance
                 * 
                 * @member {HUM.Param}
                 * 
                 * @property {('natural'|'sameOctave')} value - The selected H-S tuning sub-method.
                 */
                selected: new HUM.Param({
                    app: dhc,
                    idbKey: 'dhcFThsSelected',
                    dataType: 'string',
                    role: 'int',
                    initValue: 'sameOctave',
                    allowedValues: ['natural', 'sameOctave'],
                }),

                /**
                 * FT tuning method parameters for natural "Harmonics and subharmonics" (no transposition).
                 * 
                 * @member {Object}
                 * @namespace
                 */
                natural: {
                    /**  
                     * This property sets the transpose ratio expressed in decimal value for natural Harmonics.
                     * It's initialises the eventListener of the UIelem related to it.
                     * It's stored on the DB.
                     * @instance
                     *
                     * @member {HUM.Param}
                     * 
                     * @property {tratio}      value                                - Transpose ratio for Harmonics expressed in decimal places.
                     * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
                     * @property {Object}      uiElements.in                        - Namespace for the "in" HTML elements.
                     * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_h_plus   - The HTML input button that doubles the ratio.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_h_minus  - The HTML input button that divides the ratio by two.
                     * @property {HTMLElement} uiElements.out.ftHStranspose_h_ratio - The HTML output that shows the current transpose ratio.
                     */
                    h_tr: new HUM.Param({
                        app: dhc,
                        idbKey: 'dhcFThsNaturalHtr',
                        uiElements: {
                            'ftHStranspose_h_plus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "natural") {
                                        this.ft.h_s.natural.h_tr.value *= 2;
                                    }
                                }
                            }),
                            'ftHStranspose_h_minus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "natural") {
                                        this.ft.h_s.natural.h_tr.value *= 0.5;
                                    }
                                }
                            }),
                            'ftHStranspose_h_ratio': new HUM.Param.UIelem({
                                role: 'out',
                            }),
                        },
                        dataType: 'float',
                        // role: 'int',
                        initValue: 1,
                        // init: false, 
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                if (this.ft.h_s.selected.value === "natural") {
                                    thisParam.uiElements.out.ftHStranspose_h_ratio.innerText = value;
                                }
                                dhc.initTables();
                            }
                        }
                    }),
                    /**  
                     * This property sets the transpose ratio expressed in decimal value for natural Subharmonics.
                     * It's initialises the eventListener of the UIelem related to it.
                     * It's stored on the DB.
                     * @instance
                     *
                     * @member {HUM.Param}
                     * 
                     * @property {tratio}      value                                - Transpose ratio for Subharmonics expressed in decimal places.
                     * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
                     * @property {Object}      uiElements.in                        - Namespace for the "in" HTML elements.
                     * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_s_plus   - The HTML input button that doubles the ratio.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_s_minus  - The HTML input button that divides the ratio by two.
                     * @property {HTMLElement} uiElements.out.ftHStranspose_s_ratio - The HTML output that shows the current transpose ratio.
                     */
                    s_tr: new HUM.Param({
                        app: dhc,
                        idbKey: 'dhcFThsNaturalStr',
                        uiElements: {
                            'ftHStranspose_s_plus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "natural") {
                                        this.ft.h_s.natural.s_tr.value *= 2;
                                    }
                                }
                            }),
                            'ftHStranspose_s_minus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "natural") {
                                        this.ft.h_s.natural.s_tr.value *= 0.5;
                                    }
                                }
                            }),
                            'ftHStranspose_s_ratio': new HUM.Param.UIelem({
                                role: 'out',
                            })
                        },
                        dataType: 'float',
                        initValue: 16,
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                if (this.ft.h_s.selected.value === "natural") {
                                    thisParam.uiElements.out.ftHStranspose_s_ratio.innerText = value;
                                }
                                dhc.initTables();
                            }
                        }
                    })
                },

                /**
                 * FT tuning method parameters for "Harmonics and subharmonics" transposed on the same octave.
                 * 
                 * @member {Object}
                 * @namespace
                 */
                sameOctave: {
                    /**  
                     * This property sets the transpose ratio expressed in decimal value for Harmonics already transposed on the same octave.
                     * It's initialises the eventListener of the UIelem related to it.
                     * It's stored on the DB.
                     * @instance
                     *
                     * @member {HUM.Param}
                     * 
                     * @property {tratio}      value                                - Transpose ratio for Harmonics expressed in decimal places.
                     * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
                     * @property {Object}      uiElements.in                        - Namespace for the "in" HTML elements.
                     * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_h_plus   - The HTML input button that doubles the ratio.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_h_minus  - The HTML input button that divides the ratio by two.
                     * @property {HTMLElement} uiElements.out.ftHStranspose_h_ratio - The HTML output that shows the current transpose ratio.
                     */
                    h_tr: new HUM.Param({
                        app: dhc,
                        idbKey: 'dhcFThsSameOctaveHtr',
                        uiElements: {
                            'ftHStranspose_h_plus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "sameOctave") {
                                        this.ft.h_s.sameOctave.h_tr.value *= 2;
                                    }
                                }
                            }),
                            'ftHStranspose_h_minus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "sameOctave") {
                                        this.ft.h_s.sameOctave.h_tr.value *= 0.5;
                                    }
                                }
                            }),
                            'ftHStranspose_h_ratio': new HUM.Param.UIelem({
                                role: 'out',
                            }),
                        },
                        dataType: 'float',
                        initValue: 1,
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                if (this.ft.h_s.selected.value === "sameOctave") {
                                    thisParam.uiElements.out.ftHStranspose_h_ratio.innerText = value;
                                }
                                dhc.initTables();
                            }
                        }
                    }),
                    /**  
                     * This property sets the transpose ratio expressed in decimal value for Subharmonics already transposed on the same octave.
                     * It's initialises the eventListener of the UIelem related to it.
                     * It's stored on the DB.
                     * @instance
                     *
                     * @member {HUM.Param}
                     * 
                     * @property {tratio}      value                                - Transpose ratio for Subharmonics expressed in decimal places.
                     * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
                     * @property {Object}      uiElements.in                        - Namespace for the "in" HTML elements.
                     * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_s_plus   - The HTML input button that doubles the ratio.
                     * @property {HTMLElement} uiElements.in.ftHStranspose_s_minus  - The HTML input button that divides the ratio by two.
                     * @property {HTMLElement} uiElements.out.ftHStranspose_s_ratio - The HTML output that shows the current transpose ratio.
                     */
                    s_tr: new HUM.Param({
                        app: dhc,
                        idbKey: 'dhcFThsSameOctaveStr',
                        uiElements: {
                            'ftHStranspose_s_plus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "sameOctave") {
                                        this.ft.h_s.sameOctave.s_tr.value *= 2;
                                    }
                                }
                            }),
                            'ftHStranspose_s_minus': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'click',
                                htmlTargetProp: 'checked',
                                widget: 'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    if (this.ft.h_s.selected.value === "sameOctave") {
                                        this.ft.h_s.sameOctave.s_tr.value *= 0.5;
                                    }
                                }
                            }),
                            'ftHStranspose_s_ratio': new HUM.Param.UIelem({
                                role: 'out',
                            })
                        },
                        dataType: 'float',
                        initValue: 2,
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                if (this.ft.h_s.selected.value === "sameOctave") {
                                    thisParam.uiElements.out.ftHStranspose_s_ratio.innerText = value;
                                }
                                dhc.initTables();
                            }
                        }
                    })
                },
            },
 
            /**
             * FT Tuning files method (currently not used).
             * @todo Implement the loading of tuning file formats.
             * 
             * @member {Object}
             * @namespace
             */
            file: {
                scl: {},
                tun: {},
                mtx: {},
                lmso: {},
                selected: "scl"
            },

            /**  
             * This property indicates what tuning method is selected for FT.
             * It's stored on the DB.
             * @todo {('file')}
             * @instance
             * 
             * @member {HUM.Param}
             * 
             * @property {('nEDx'|'h_s')} value                                - The selected tuning method.
             * @property {Object}         uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}         uiElements.fn                        - Namespace for the "fn" HTML elements.
             * @property {Object}         uiElements.out                       - Namespace for the "out" HTML elements.
             * @property {HTMLElement}    uiElements.fn.ftSys_NEDX             - The HTML radio button for selecting the NEDX tuning method.
             * @property {HTMLElement}    uiElements.fn.ftSys_HSnat            - The HTML radio button for selecting the HSnat tuning method.
             * @property {HTMLElement}    uiElements.fn.ftSys_HStrans          - The HTML radio button for selecting the HStrans tuning method.
             * @property {HTMLElement}    uiElements.out.ftNEDX                - The HTML output that shows the controls for NEDX tuning method.
             * @property {HTMLElement}    uiElements.out.ftHS                  - The HTML output that shows the controls for Harmonics/Subharmonics tuning method.
             * @property {HTMLElement}    uiElements.out.ftHStranspose_h_ratio - The HTML output that shows the current transpose ratio for Harmonics.
             * @property {HTMLElement}    uiElements.out.ftHStranspose_s_ratio - The HTML output that shows the current transpose ratio for Subharmonics.
             */
            selected: new HUM.Param({
                app: dhc,
                idbKey: 'dhcFTselected',
                uiElements: {
                    'ftSys_NEDX': new HUM.Param.UIelem({
                        role: 'fn',
                        opType: 'set',
                        eventType: 'click',
                        htmlTargetProp: 'checked',
                        widget: 'number',
                        uiSet: (value, thisParam, init) => {
                            if (value === 'nEDx') {
                                thisParam.uiElements.fn.ftSys_NEDX.checked = true;
                            }
                        },
                        eventListener: (evt) => {
                            if (event.target.checked) {
                                dhc.settings.ft.selected.valueUI = 'nEDx';
                            }
                        }
                    }),
                    'ftSys_HSnat': new HUM.Param.UIelem({
                        role: 'fn',
                        opType: 'set',
                        eventType: 'click',
                        htmlTargetProp: 'checked',
                        widget: 'number',
                        uiSet: (value, thisParam, init) => {
                            if (value === 'h_s') {
                                if (this.ft.h_s.selected.value === 'natural') {
                                    thisParam.uiElements.fn.ftSys_HSnat.checked = true;
                                }
                            }
                        },
                        eventListener: (evt) => {
                            if (event.target.checked) {
                                dhc.settings.ft.h_s.selected.valueUI = 'natural';
                                dhc.settings.ft.selected.valueUI = 'h_s';
                            }
                        }
                    }),
                    'ftSys_HStrans': new HUM.Param.UIelem({
                        role: 'fn',
                        opType: 'set',
                        eventType: 'click',
                        htmlTargetProp: 'checked',
                        widget: 'number',
                        uiSet: (value, thisParam, init) => {
                            if (value === 'h_s') {
                                if (this.ft.h_s.selected.value === 'sameOctave') {
                                    thisParam.uiElements.fn.ftSys_HStrans.checked = true;
                                }
                            }
                        },
                        eventListener: (evt) => {
                            if (event.target.checked) {
                                dhc.settings.ft.h_s.selected.valueUI = 'sameOctave';
                                dhc.settings.ft.selected.valueUI = 'h_s';
                            }
                        }
                    }),
                    'ftNEDX': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'ftHS': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'ftHStranspose_h_ratio': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'ftHStranspose_s_ratio': new HUM.Param.UIelem({
                        role: 'out',
                    })
                },
                dataType: 'string',
                initValue: 'nEDx',
                init: false,
                allowedValues: ['nEDx', 'h_s'],
                // restoreStage: 'pre',
                // restoreSequence: 32,
                postSet: (value, thisParam, init) => {
                    if (value === 'nEDx') {
                        thisParam.uiElements.out.ftNEDX.style.display = "initial";
                        thisParam.uiElements.out.ftHS.style.display = "none";
                    } else if (value === 'h_s') {
                        thisParam.uiElements.out.ftNEDX.style.display = "none";
                        thisParam.uiElements.out.ftHS.style.display = "initial";
                        if (dhc.settings.ft.h_s.selected.value === 'natural') {
                            thisParam.uiElements.out.ftHStranspose_h_ratio.innerText = this.ft.h_s.natural.h_tr.value;
                            thisParam.uiElements.out.ftHStranspose_s_ratio.innerText = this.ft.h_s.natural.s_tr.value;
                        }
                        if (dhc.settings.ft.h_s.selected.value === 'sameOctave') {
                            thisParam.uiElements.out.ftHStranspose_h_ratio.innerText = this.ft.h_s.sameOctave.h_tr.value;
                            thisParam.uiElements.out.ftHStranspose_s_ratio.innerText = this.ft.h_s.sameOctave.s_tr.value;
                        }
                    }
                    // if (!init) {
                        dhc.updateKeymapPreset();
                    // }
                },
            }),
                                              
            /**
             * +/- Steps for the complete range of {HUM.DHC#tables.ft}.
             * The default is 64 (that is 129 steps).
             * 
             * Some considerations about the MIDI Note number range: <br>
             * 
             * - 32 = from -32 to +32 = 65 steps<br>
             * 
             * - 64 = from -64 to +64 = 129 steps
             *   To use the full MIDI note range, FM should be midi#63 or midi#64.
             *   ( midi#63 out of MIDI range on -1  )
             *   ( midi#64 out of MIDI range on 128 )
             * 
             * Maybe a range of 129 steps is too wide, but let's try.
             * @instance
             * 
             * @member {number}
             */
            steps: 64
        };
        
        /**
         * Harmonic/Subharmonic Tones (HTs) scale tuning method settings
         * 
         * @member {Object}
         * @namespace
         */
        this.ht = {
            /**
             * Harmonics and subharmonics transposition parameters
             * 
             * @member {Object}
             * @namespace
             */
            transpose: {
                /**
                 * This property indicates the transpose ratio in decimal places for Harmonics.
                 * It's stored on the DB.
                 * @instance
                 * 
                 * @member {HUM.Param}
                 * 
                 * @property {tratio}      value                             - The transpose ratio in decimal places for Harmonics.
                 * @property {Object}      uiElements                        - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                     - Namespace for the "in" HTML elements.
                 * @property {Object}      uiElements.out                    - Namespace for the "out" HTML elements.
                 * @property {HTMLElement} uiElements.in.htTranspose_h_plus  - The HTML input button that doubles the ratio.
                 * @property {HTMLElement} uiElements.in.htTranspose_h_minus - The HTML input button that divides the ratio by two.
                 * @property {HTMLElement} uiElements.in.htTranspose_h_ratio - The HTML input text box for inserting a custom ratio.
                 */
                h: new HUM.Param({
                    app: dhc,
                    idbKey: 'dhcHTtransposeH',
                    uiElements: {
                        'htTranspose_h_plus': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'click',
                            htmlTargetProp: 'checked',
                            widget: 'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                this.ht.transpose.h.value *= 2;
                                // dhc.transposeHT(2, "h", true);
                            }
                        }),
                        'htTranspose_h_minus': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'click',
                            htmlTargetProp: 'checked',
                            widget: 'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                this.ht.transpose.h.value *= 0.5;
                                // dhc.transposeHT(0.5, "h", true);
                            }
                        }),
                        'htTranspose_h_ratio': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'change',
                            htmlTargetProp: 'value',
                            widget: 'number',
                        })
                    },     
                    dataType: 'float',
                    initValue: 1,
                    restoreStage: 'pre',
                    preSet: (value) => {
                        // Check if the ratio is > 0
                        return value > 0 ? value : 1;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            // Recreate the HT table on the last FT
                            dhc.createHTtable(dhc.tables.ft[this.ht.curr_ft].hz);
                        }
                        // dhc.transposeHT(value, "h", false);
                    }
                }),

                /**
                 * This property indicates the transpose ratio in decimal places for Subharmonics.
                 * It's stored on the DB.
                 * @instance
                 * 
                 * @member {HUM.Param}
                 * 
                 * @property {tratio}      value                             - The transpose ratio in decimal places for Subharmonics.
                 * @property {Object}      uiElements                        - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                     - Namespace for the "in" HTML elements.
                 * @property {Object}      uiElements.out                    - Namespace for the "out" HTML elements.
                 * @property {HTMLElement} uiElements.in.htTranspose_h_plus  - The HTML input button that doubles the ratio.
                 * @property {HTMLElement} uiElements.in.htTranspose_h_minus - The HTML input button that divides the ratio by two.
                 * @property {HTMLElement} uiElements.in.htTranspose_h_ratio - The HTML input text box for inserting a custom ratio.
                 */
                s: new HUM.Param({
                    app: dhc,
                    idbKey: 'dhcHTtransposeS',
                    uiElements: {
                        'htTranspose_s_plus': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'click',
                            htmlTargetProp: 'checked',
                            widget: 'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                // Multiply the current transpose ratio by 2
                                this.ht.transpose.s.value *= 2;
                                // dhc.transposeHT(2, "s", true);
                            }
                        }),
                        'htTranspose_s_minus': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'click',
                            htmlTargetProp: 'checked',
                            widget: 'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                this.ht.transpose.s.value *= 0.5;
                                // dhc.transposeHT(0.5, "s", true);
                            }
                        }),
                        'htTranspose_s_ratio': new HUM.Param.UIelem({
                            role: 'in',
                            opType: 'set',
                            eventType: 'change',
                            htmlTargetProp: 'value',
                            widget: 'number',
                        })

                    },    
                    dataType: 'float',
                    initValue: 1, // 16,
                    restoreStage: 'pre',
                    preSet: (value) => {
                        // Check if the ratio is > 0
                        return value > 0 ? value : 1;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            // Recreate the HT table on the last FT
                            dhc.createHTtable(dhc.tables.ft[this.ht.curr_ft].hz);
                        }
                        // dhc.transposeHT(value, "s", false);
                    }
                }),
            },

            /**  
             * This property indicates the last pressed FT (or released if there are no more pressed FTs),
             * that generated the last HT table; init value must be 0.
             * @instance
             * 
             * @member {xtnum}
             */
            curr_ft: 0,
            /**  
             * This property indicates the last pressed HT (or released if there are no more pressed HTs);
             * init value should be null.
             * @instance
             * 
             * @member {xtnum}
             */
            curr_ht: null
        };

        /**
         * @property {Array.<HUM.DHCmsg>} queue     - Last HT MIDI Note-ON messages received
         * @property {Array.<HUM.DHCmsg>} pipe      - MIDI Note-ON messages stored into the Pipe
         * @property {number}             currStep  - Last step played by the Piper
         * @property {HUM.DHCmsg}         currTone  - Last fake MIDI Note-ON message send
         */


        /**
         * Piper's settings
         * 
         * @member {Object}
         * @namespace
         */
        this.piper = {

            /**  
             * This property is the number of steps of the Piper's pipe.
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - How many steps has the pipe.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.dhc_piperSteps - The HTML input text box for the pipe's steps number.
             */
            maxLength: new HUM.Param({
                app: dhc,
                idbKey: 'dhcPiperMaxLength',
                uiElements: {
                    'dhc_piperSteps': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'number',
                    })
                },
                dataType: 'integer',
                initValue: 5,
            }),
            /**  
             * This property is the Piper's queue, an array storing the last HT MIDI Note-ON messages received.
             * @instance
             * 
             * @member {Array.<HUM.DHCmsg>}
             */
            queue: [],
            /**  
             * This property is the actual Pipe, an array MIDI Note-ON messages coming from the Piper's queue.
             * @instance
             * 
             * @member {Array.<HUM.DHCmsg>}
             */
            pipe: [],
            /**  
             * This property is the number of last pipe's step played by the Piper.
             * @instance
             * 
             * @member {number}
             */
            currStep: 5,
            /**  
             * This property is the last "fake" MIDI Note-ON message send by the Piper.
             * @instance
             * 
             * @member {HUM.DHCmsg}
             */
            currTone: null
        };

        /**
         * Keymap's settings
         * 
         * @member {Object}
         * @namespace
         */
        this.keymap = {
            /**  
             * This property contains the current selected controller keymap for each peculiar DHC configuration, as the
             * tuning method (nEDX or H-S), and all the current available keymaps.
             * It's stored on the DB.
             * @todo Auto-keymap for Tsnap MIDI input configuration, that requires a special keymap.
             * 
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {Object}                value                                 - A register that stores the selected keymap IDs
             * @property {number}                value.nEDx                            - The ID key of the selected keymap on nEDx tuning.
             * @property {number}                value.h_s                             - The ID key of the selected keymap on H-S tuning.
             * @property {HUM.CtrlKeymapPresets} ctrlKeymapPreset                      - All the keympas available.
             * @property {Object}                uiElements                            - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}                uiElements.in                         - Namespace for the "in" HTML elements.
             * @property {HTMLElement}           uiElements.in.controllerKeymapPresets - The HTML input dropdown for selecting the keymap. 
             */
            presets: new HUM.Param({
                app: dhc,
                idbKey: 'dhcCtrlKeymapPresets',
                uiElements: {
                    'controllerKeymapPresets': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'value',
                        widget: 'selection',
                        uiSet: (value, thisParam) => {
                            thisParam.uiElements.in.controllerKeymapPresets.value = value[this.ft.selected.value];
                        },
                        eventListener: evt => {
                            dhc.loadKeymapPreset(evt);
                        }
                    })
                },
                dataType: 'object',
                restoreStage: 'pre',
                // restoreSequence: 64,
                initValue: {
                    nEDx: 0,
                    h_s: 0,
                    // tsnap: 0
                },
                // postSet: (value, param, init) => {
                //     if (!init) {
                //         // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
                //         dhc.initUImonitors();
                //     }
                // },
                // postInit: () => {
                //     dhc.updateKeymapPreset();
                // },
                customProperties: {        
                    /**
                     * The container for all the Controller keymap presets
                     *
                     * @member {HUM.CtrlKeymapPresets}
                     */
                    ctrlKeymapPreset: new HUM.CtrlKeymapPresets()
                }
            }),

            /**  
             * This property is just a proxy to the HTML widget for the keymap file loading.
             * It's initialises the eventListener of the UIelem related to it.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {Object}      uiElements                         - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                      - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.controllerKeymapFile - The HTML input file widget.
             */
            keymapFile: new HUM.Param({
                app: dhc,
                idbKey: 'dhcCtrlKeymapFile',
                uiElements: {
                    'controllerKeymapFile': new HUM.Param.UIelem({
                        role: 'in',
                        opType: 'set',
                        eventType: 'change',
                        htmlTargetProp: 'files',
                        widget: 'file',
                        eventListener: evt => {
                            // Check for the various File API support.
                            if (window.File && window.FileReader && window.FileList && window.Blob) {
                                // Access to the file and send it to read function
                                dhc.readKeymapFile(evt.target.files[0]);
                            } else {
                                alert('The File APIs are not fully supported in this browser.');
                            }
                        }
                    })
                },
                dataType: 'file',
                // initValue: 'default', // NOTE: 'default' is a special value
                presetStore: false,
                presetRestore: false,
            }),

            /**  
             * This property is just a proxy to the HTML modal keymap table.
             * It's initialises the eventListener of the UIelem related to it.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.out.controllerKeymapTable - The HTML modal dialog for the keymap table.
             * @property {HTMLElement} uiElements.out.controllerKeymapModal - The HTML keymap table.
             */
            modalTable: new HUM.Param({
                app: dhc,
                idbKey: 'dhcCtrlKeymapModalTable',
                uiElements: {
                    'controllerKeymapTable': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'controllerKeymapModal': new HUM.Param.UIelem({
                        role: 'out',
                        eventType: 'show.bs.modal',
                        eventListener: evt => {
                            dhc.keymap2Html();
                        }
                    }),
                },
                presetStore: false,
                presetRestore: false,
            }),
        };

        /**  
         * This property is just a proxy to the HTML accordion for all the DHC tabs.
         * It's initialises the eventListener of the UIelem related to it.
         * @instance
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out               - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.accordion_dhc - The HTML DHC accordion.
         */
        this.bsAccordion = new HUM.Param({
            app: dhc,
            idbKey: 'dhcAccordion',
            uiElements: {
                'accordion_dhc': new HUM.Param.UIelem({
                    role: 'out',
                    htmlID: dhc.harmonicarium.html.dhcAccordions[dhc.id].children[0].id,
                    eventType: 'shown.bs.collapse',
                    eventListener: evt => {
                        // @todo: TO-FIX! Temporary harcoded behaviour for auto-scrolling
                        //        when open accordion tab. First test.
                        //        @see: https://www.codeply.com/p/wTY0TBuliy
                        let tmp = evt.target.offsetTop - evt.target.previousElementSibling.offsetTop,
                            margin = parseInt(getComputedStyle(evt.target.parentElement).marginTop, 10);
                        dhc.harmonicarium.html.sideMenu.scroll({
                            top: evt.target.previousElementSibling.offsetTop - tmp*2 + margin*2,
                            left: 0, 
                            behavior: 'smooth'
                        });
                    }
                }),
            },
            init: false,
            presetStore: false,
            presetRestore: false,
        });
        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initializes the parameters of the FT tuning method and the FM.
     */
    _init() {
        this.ft.selected._init();
        this.fm.init._init();
        // this.ft.nEDx.unit._init();
        // this.ft.nEDx.division._init();
    }
};

/**
 * DHC Message class.
 * 
 * This class is used to create instances of messages that can be sent between the different
 * registered app components. The class has various static methods to facilitate the creation of
 * different types of messages with different parameters.
 */
HUM.DHCmsg = class {
     /**
     * 
     * @param {string}                                         source   - Name of the App component that generated the message.
     * @param {('init'|'panic'|'update'|'tone-on'|'tone-off')} cmd      - Command code of the message.
     * @param {tonetype=}                                      type     - The tone typeto which the message is directed; FT or HT.
     * @param {xtnum=}                                         xtNum    - The FT or HT number.
     * @param {velocity=}                                      velocity - The intensity of the sound to be generated in MIDI velocity format.<br>
     *                                                                    If the `cmd` is 'tone-on' , the values must be from 1 to 127.<br>
     *                                                                    If the `cmd` is 'tone-off' , the values must be from 0 to 127.<br>
     * @param {midinnum=}                                      ctrlNum  - The MIDI Note Number corresponding to the FT or HT on the keymap (if present).<br>
     *                                                                    If it is not provided, the Apps that need this information should ignore the message.
     * @param {boolean=}                                       piper    - If the message is generated by the Piper feature.
     * @param {boolean=}                                       panic    - Only in case of `cmd` 'note-off', it tells that the message has been generated by a "hard" All-Notes-Off request.
     * @param {boolean=}                                       tsnap    - If the message has been converted by the Tone-Snap receiving mode.<br>
     *                                                                    If `true`, the `ctrlNum` may not be the same as the MIDI Note Number pressed on the controller.
     */
    constructor(source, cmd, type=false, xtNum=false, velocity=false, ctrlNum=false, piper=false, panic=false, tsnap=false) {
        this.source = source;
        this.cmd = cmd;
        this.type = type;
        this.xtNum = xtNum;
        this.velocity = velocity;
        this.ctrlNum = ctrlNum;
        this.piper = piper;
        this.panic = panic;
        this.tsnap = tsnap;
    }
    /**
     * Create a new 'init' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static init(source) {
        return new HUM.DHCmsg(source, 'init');
    }
    /**
     * Create a new 'panic' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static allNotesOff(source) {
        return new HUM.DHCmsg(source, 'panic');
    }
    /**
     * Create a new 'update FT' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static ftUpd(source) {
        return new HUM.DHCmsg(source, 'update', 'ft');
    }
    /**
     * Create a new 'update HT' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static htUpd(source) {
        return new HUM.DHCmsg(source, 'update', 'ht');
    }
    /**
     * Create a new 'update Controller Keymap' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static ctrlmapUpd(source) {
        return new HUM.DHCmsg(source, 'update', 'ctrlmap');
    }
    /**
     * Create a new 'FT Note-ON' DHCmsg
     *
     * @param {string}    source   - Name of the App component that generated the message
     * @param {xtnum}     xtNum    - The FT number
     * @param {velocity}  velocity - The intensity of the sound to be generated in MIDI velocity format, from 1 to 127.<br>
     * @param {midinnum=} ctrlNum  - The MIDI Note Number corresponding to the FT on the keymap (if present)
     * @param {boolean=}  tsnap    - If the message has been converted by the Tone-Snap receiving mode
     * 
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static ftON(source, xtNum, velocity, ctrlNum=false, tsnap=false) {
        return new HUM.DHCmsg(source, 'tone-on', 'ft', 
            Number(xtNum),
            (velocity ? Number(velocity) : false),
            (ctrlNum ? Number(ctrlNum) : false),
            false,
            false,
            tsnap);
    }
    /**
     * Create a new 'HT Note-ON' DHCmsg
     *
     * @param {string}    source   - Name of the App component that generated the message.
     * @param {xtnum}     xtNum    - The HT number.
     * @param {velocity}  velocity - The intensity of the sound to be generated in MIDI velocity format, from 1 to 127.<br>
     * @param {midinnum=} ctrlNum  - The MIDI Note Number corresponding to the HT on the keymap (if present)
     * @param {boolean=}  piper    - If the message is generated by the Piper feature
     * @param {boolean=}  tsnap    - If the message has been converted by the Tone-Snap receiving mode
     * 
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static htON(source, xtNum, velocity, ctrlNum=false, piper=false, tsnap=false) {
        return new HUM.DHCmsg(source, 'tone-on', 'ht',
            Number(xtNum),
            (velocity ? Number(velocity) : false),
            (ctrlNum ? Number(ctrlNum) : false),
            piper,
            false,
            tsnap);
    }
    /**
     * Create a new 'FT Note-OFF' DHCmsg
     *
     * @param {string}    source   - Name of the App component that generated the message
     * @param {xtnum}     xtNum    - The FT number
     * @param {velocity=} velocity - The intensity of the sound to be generated in MIDI velocity format, from 1 to 127.<br>
     * @param {midinnum=} ctrlNum  - The MIDI Note Number corresponding to the FT on the keymap (if present)
     * @param {boolean=}  panic    - If `true`, it tells that the message has been generated by a "hard" All-Notes-Off request.
     * 
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static ftOFF(source, xtNum, velocity=false, ctrlNum=false, panic=false) {
        return new HUM.DHCmsg(source, 'tone-off', 'ft',
            Number(xtNum),
            (velocity ? Number(velocity) : false),
            (ctrlNum ? Number(ctrlNum) : false),
            false,
            panic);
    }
    /**
     * Create a new 'HT Note-OFF' DHCmsg
     *
     * @param {string}    source   - Name of the App component that generated the message
     * @param {xtnum}     xtNum    - The HT number
     * @param {velocity=} velocity - The intensity of the sound to be generated in MIDI velocity format, from 1 to 127.<br>
     * @param {midinnum=} ctrlNum  - The MIDI Note Number corresponding to the HT on the keymap (if present)
     * @param {boolean=}  panic    - If `true`, it tells that the message has been generated by a "hard" All-Notes-Off request.
     * 
     * @return {HUM.DHCmsg} - A new instance of DHCmsg
     */
    static htOFF(source, xtNum, velocity=false, ctrlNum=false, panic=false) {
        return new HUM.DHCmsg(source, 'tone-off', 'ht',
            Number(xtNum),
            (velocity ? Number(velocity) : false),
            (ctrlNum ? Number(ctrlNum) : false),
            false,
            panic);
    }
    /**
     * Create a copy of a 'Note-OFF' DHCmsg
     *
     * @param {HUM.DHCmsg} dhcMsg - The original DHCmsg to be copied
     *
     * @return {HUM.DHCmsg} - A copy of the original DHCmsg
     */
    static copyOFF(dhcMsg) {
        return new HUM.DHCmsg(dhcMsg.source, 'tone-off',
            dhcMsg.type,
            dhcMsg.xtNum,
            dhcMsg.velocity,
            dhcMsg.ctrlNum,
            dhcMsg.piper,
            dhcMsg.panic
        );
    }
};
