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

/** 
 * The Dynamic Harmonics Calculator class<br>
 *    This is the computational kernel for the frequency/midicent tables.
 *    Manage an route the communications from and to the other App components.
 */
HUM.DHC = class {
     /**
     * @param {string} id            - The DHC id, in format harmonicariumID-dhcID (eg. '1-0')
     * @param {HUM}    harmonicarium - The HUM instance to which the this DHC must refer
     */
    constructor(id, harmonicarium) {
        /**
        * The HUM instance
        *
        * @member {HUM}
        */
        this.harmonicarium = harmonicarium;
        /**
        * The id of this DHC instance
        *
        * @member {string}
        */
        this.id = id;
        /**
         * DHC Settings
         *
         * @member {HUM.DHC#DHCsettings}
         * 
         */
        this.settings = new this.DHCsettings();
        /**
         * DHC Tables
         *
         * @member {Object}
         * 
         * @property {CtrlKeymap}                    ctrl       - The current Controller Keymap
         * @property {Object.<xtnum, HUM.DHC#Xtone>} ft         - The current Fundamental Tones table
         * @property {Object.<xtnum, HUM.DHC#Xtone>} ht         - The current Harmonic/Subharmonic Tones table
         * @property {Object}                        reverse    - Reverse tables namespace
         * @property {Object.<midinnum, xtnum>}      reverse.ft - Reverse Fundamental Tones table
         * @property {Object.<midinnum, xtnum>}      reverse.ht - Reverse Harmonic/Subharmonic Tones table
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
         * UI HTML elements
         *
         * @member {Object}
         * 
         * @property {Object.<string, HTMLElement>} fn  - Functional UI elements
         * @property {Object.<string, HTMLElement>} in  - Input UI elements
         * @property {Object.<string, HTMLElement>} out - Output UI elements
         */
        this.uiElements = {
            fn: {
                controllerKeymapClose: document.getElementById("HTMLf_controllerKeymapClose"+id),
                controllerKeymapTableShow: document.getElementById("HTMLf_controllerKeymapTableShow"+id),
                controllerKeymapModal: document.getElementById('HTMLf_controllerKeymapModal'+id),
                ftHS: document.getElementById("HTMLf_ftHS"+id),
                ftNEDX: document.getElementById("HTMLf_ftNEDX"+id),
                ftSys_HSnat: document.getElementById("HTMLf_ftSys_HSnat"+id),
                ftSys_HStrans: document.getElementById("HTMLf_ftSys_HStrans"+id),
                ftSys_NEDX: document.getElementById("HTMLf_ftSys_NEDX"+id),
                keymapTableShow: document.getElementById("HTMLf_keymapTableShow"+id),
                motPanelClose: document.getElementById("HTMLf_motPanelClose"+id),
                // checkboxMidi: this.harmonicarium.html.midiTab[id].children[0],
                // checkboxDHC: this.harmonicarium.html.dhcTab[id].children[0],
                // checkboxFM: this.harmonicarium.html.fmTab[id].children[0],
                // checkboxFT: this.harmonicarium.html.ftTab[id].children[0],
                // checkboxHT: this.harmonicarium.html.htTab[id].children[0],

            },
            in: {
                controllerKeymapFile: document.getElementById('HTMLi_controllerKeymapFile'+id),
                controllerKeymapPresets: document.getElementById('HTMLi_controllerKeymapPresets'+id),
                dhc_hzAccuracy: document.getElementById("HTMLi_dhc_hzAccuracy"+id),
                dhc_mcAccuracy: document.getElementById("HTMLi_dhc_mcAccuracy"+id),
                dhc_middleC: document.getElementById("HTMLi_dhc_middleC"+id),
                dhc_piperSteps: document.getElementById("HTMLi_dhc_piperSteps"+id),
                dhc_pitchbendRange: document.getElementById("HTMLi_dhc_pitchbendRange"+id),
                fm_hz: document.getElementById("HTMLi_fm_hz"+id),
                fm_mc: document.getElementById("HTMLi_fm_mc"+id),
                ftHStranspose_h_minus: document.getElementById("HTMLi_ftHStranspose_h_minus"+id),
                ftHStranspose_h_plus: document.getElementById("HTMLi_ftHStranspose_h_plus"+id),
                ftHStranspose_s_minus: document.getElementById("HTMLi_ftHStranspose_s_minus"+id),
                ftHStranspose_s_plus: document.getElementById("HTMLi_ftHStranspose_s_plus"+id),
                ftNEDX_division: document.getElementById("HTMLi_ftNEDX_division"+id),
                ftNEDX_ok: document.getElementById("HTMLi_ftNEDX_ok"+id),
                ftNEDX_unit: document.getElementById("HTMLi_ftNEDX_unit"+id),
                htTranspose_h_minus: document.getElementById("HTMLi_htTranspose_h_minus"+id),
                htTranspose_h_plus: document.getElementById("HTMLi_htTranspose_h_plus"+id),
                htTranspose_h_ratio: document.getElementById("HTMLi_htTranspose_h_ratio"+id),
                htTranspose_s_minus: document.getElementById("HTMLi_htTranspose_s_minus"+id),
                htTranspose_s_plus: document.getElementById("HTMLi_htTranspose_s_plus"+id),
                htTranspose_s_ratio: document.getElementById("HTMLi_htTranspose_s_ratio"+id),
            },
            out: {
                controllerKeymapTable: document.getElementById("HTMLo_controllerKeymapTable"+id),
                fm_hz: document.getElementById("HTMLo_fm_hz"+id),
                fm_mc: document.getElementById("HTMLo_fm_mc"+id),
                ftHStranspose_h_ratio: document.getElementById("HTMLo_ftHStranspose_h_ratio"+id),
                ftHStranspose_s_ratio: document.getElementById("HTMLo_ftHStranspose_s_ratio"+id),
                toneMonitorFT_frequency: document.getElementById("HTMLo_toneMonitorFT_frequency"+id),
                toneMonitorFT_midicents: document.getElementById("HTMLo_toneMonitorFT_midicents"+id),
                toneMonitorFT_notename: document.getElementById("HTMLo_toneMonitorFT_notename"+id),
                toneMonitorFT_tone: document.getElementById("HTMLo_toneMonitorFT_tone"+id),
                toneMonitorHT_frequency: document.getElementById("HTMLo_toneMonitorHT_frequency"+id),
                toneMonitorHT_midicents: document.getElementById("HTMLo_toneMonitorHT_midicents"+id),
                toneMonitorHT_notename: document.getElementById("HTMLo_toneMonitorHT_notename"+id),
                toneMonitorHT_tone: document.getElementById("HTMLo_toneMonitorHT_tone"+id),
            }
        };
        /**
         * Registered Apps<br>
         *     The <em>key</em> of each record is an app Object and the <em>value</em> is the metod that must be invoked
         *     to send messages towards the app. 
         *
         * @member {Map.<Object, string>}
         */
        this.registeredApps = new Map();
        // @todo: Pass by constructor parameters
        //        and if false, no signals will be sent to the component
        /**
        * The Hstack instance
        *
        * @member {HUM.Hstack}
        */
        this.hstack = new HUM.Hstack(this);
        /**
        * The Synth instance
        *
        * @member {HUM.Synth}
        */
        this.synth = {}; // see this.init()
        /**
        * The MidiHub instance
        *
        * @member {HUM.midi.MidiHub}
        */
        this.midi = {}; // see this.init()
        /**
        * The Hstack instance
        *
        * @member {HUM.Hancock}
        */
        this.hancock = {}; // see this.init()
        /**
         * Piper's default settings
         *
         * @member {Object}
         *
         * @property {number}             maxLenght - How many steps has the Pipe
         * @property {Array.<HUM.DHCmsg>} queue     - Last HT MIDI Note-ON messages received
         * @property {Array.<HUM.DHCmsg>} pipe      - MIDI Note-ON messages stored into the Pipe
         * @property {number}             currStep  - Last step played by the Piper
         * @property {HUM.DHCmsg}         currTone  - Last fake MIDI Note-ON message send
         */
        this.pipe = {
            maxLenght: 5,
            queue: [],
            pipe: [],
            currStep: 5,
            currTone: null
        };
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
         * The container for all the Controller keymap presets
         *
         * @member {HUM.CtrlKeymapPreset}
         */
        this.ctrlKeymapPreset = new HUM.CtrlKeymapPreset(this);
        /**
        * The Backend Utils instance
        *
        * @member {BackendUtils}
        */
        this.backendUtils = this.harmonicarium.components.backendUtils;
        this.backendUtils.uiElements.fn.settings[this.id] = document.getElementById("HTMLf_dhc_container"+this.id);

        this._init();
        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initialize the new instance of DHC
     */
    _init() {
        
        this._initUI();
        
        this.settings.fm.hz = this.getFM(this.settings.fm.init);

        this.synth = new HUM.Synth(this);
        
        this.hancock = new HUM.Hancock(this);

        this.switchFTsys(this.settings.ft.selected, false, true); // initTables() + updateKeymapPreset()

        this.midi = new HUM.midi.MidiHub(this);
        
    }
    /**
     * Register a new App (module)
     * 
     * @param {Object} app      - The instance of the app to be registered
     * @param {string} method   - The name of the method to use to send messages
     * @param {number} priority - The priority with which the registered app will receive messages
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
    // @old icTablesCreate
    initTables() {
        // Create the FT tables
        this.createFTtable();

        // Create the HT tables on the current FT
        this.createHTtable(this.tables.ft[this.settings.ht.curr_ft].hz);
        
        // Update the UI Monitors
        this.initUImonitors();
    }

    /**
     * Recompile the Fundamental Tones (FT) table 
     */
    // @old icFTtableCreate
    createFTtable() {
        // Temp object
        let fundamentalsTable = {},
            fundamentalsReverseTable = {};
        // Select current FT Tuning Systems
        switch (this.settings.ft.selected) {
            // n-EDx EQUAL TEMPERAMENT
            case "nEDx":
                for (let i = -this.settings.ft.steps; i <= this.settings.ft.steps; i++) {
                    let freq = this.constructor.compute_nEDx(i, this.settings.ft.nEDx.unit, this.settings.ft.nEDx.division, this.settings.fm.hz);
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
                if (this.settings.ft.h_s.selected === "natural") {
                    // Compute the sub/harmonics naturally (NOT transposed to the Same Octave)
                    for (let i = 1; i <= this.settings.ft.steps; i++) {
                        let sFreq = this.settings.fm.hz / i * this.settings.ft.h_s.natural.s_tr;
                        let hFreq = this.settings.fm.hz * i * this.settings.ft.h_s.natural.h_tr;
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
                    fundamentalsTable[0] = new this.Xtone(this.settings.fm.hz, this.settings.fm.mc);
                    fundamentalsReverseTable[Number(this.settings.fm.mc)] = 0;
                }
                if (this.settings.ft.h_s.selected === "sameOctave") {
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
                        let hFreq = this.settings.fm.hz * h_so_tr * this.settings.ft.h_s.sameOctave.h_tr;
                        let sFreq = this.settings.fm.hz * s_so_tr * this.settings.ft.h_s.sameOctave.s_tr;
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
                    fundamentalsTable[0] = new this.Xtone(this.settings.fm.hz, this.settings.fm.mc); 
                    fundamentalsReverseTable[Number(this.settings.fm.mc)] = 0;
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
     * Recompile the Harmonic/Subarmonic Tones (HT) table
     * 
     * @param {hertz} fundamental - The tone on which to build the table, expressed in hertz (Hz)
     */
    // @old icHTtableCreate
    createHTtable(fundamental) {
        // @todo - Implement custom H/S table length (16>32>64>128) to increase performances if needed
        let harmonicsTable = {},
            harmonicsReverseTable = {};
        for (let i = -128; i < 0; i++) {
            let freq = fundamental / -i * this.settings.ht.transpose.s;
            let midicents = this.constructor.freqToMc(freq);
            harmonicsTable[i] = new this.Xtone(freq, midicents);
            harmonicsReverseTable[midicents] = i;
        }
        for (let i = 1; i < 129; i++) {
            let freq = fundamental * i * this.settings.ht.transpose.h;
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
     * Get the Fundamental Mother (FM) from the UI input
     *
     * @param {('mc'|'hz')} method - Method to use to get the FM
     *
     * @return {hertz} - Frequency expressed in hertz (Hz)
     */
    // @old icGetFM
    getFM(method) {
        let freq = null,
            midicents = null;
        switch (method) {
            case "mc":
                let fmMC = this.uiElements.in.fm_mc.value;
                midicents = fmMC;
                freq = this.constructor.mcToFreq(fmMC);
                // Store the midi.cents value
                this.settings.fm.mc = fmMC;
                break;
            case "hz":
                if (this.uiElements.in.fm_hz.value <= 0) {
                    this.uiElements.in.fm_hz.value = 1;
                }
                let fmHZ = this.uiElements.in.fm_hz.value;
                midicents = this.constructor.freqToMc(fmHZ);
                // Store the midi.cents value
                this.settings.fm.mc = midicents;
                freq = fmHZ;
                break;
        }
        // Change the 'init' for eventual icDHCinit
        this.settings.fm.init = method;
        // Return the frequency on the FM (Hz)
        return freq;
    }

    /**
     * Set the Fundamental Mother (FM) and re-init the tone tables
     *
     * @param {hertz} hz - Frequency expressed in hertz (Hz)
     */
    // @old icSetFM
    setFM(hz) {
        // Store the FM to the global variable
        this.settings.fm.hz = hz;
        // Recreate all tables
        this.initTables();
    }

    /**
     * Print the Fundamental Mother (FM) data to the UI output
     *
     * @param {hertz}    hz - Frequency expressed in hertz (Hz)
     * @param {midicent} mc - MIDI note number expressed in midicent
     */
    // @old icPrintFundamentalMother
    printFundamentalMother(hz, mc){
        let xtObj = new this.Xtone(hz, mc);
        // Apply the controller pitchbend (if present) to the xtObj
        let bent_xtObj = this.bendXtone(xtObj);
        // Print the FM infos on the UI
        let notename = this.mcToName(bent_xtObj.mc),
            name = notename[0],
            sign = notename[1],
            cent = notename[2];
        this.uiElements.out.fm_mc.innerText = bent_xtObj.mc.toFixed(this.settings.global.cent_accuracy + 2) + " = " + name + " " + sign + cent + "\u00A2";
        this.uiElements.out.fm_hz.innerText = bent_xtObj.hz.toFixed(this.settings.global.hz_accuracy);
    }

    /*==============================================================================*
     * FT UI tools
     *==============================================================================*/

    /**
     * Switch the FT TUNING SYSTEM (called when UI is updated)
     *
     * @param {('nedx'|'hs')}             sys    - FTs tuning method; 'nedx' (equal temperament) or 'hs' (harm/subharm)
     * @param {('natural'|'sameOctave')=} sys_hs - FTs Harm/Subharm tuning method; 'natural' (no transposition) or 'sameOctave' (to the same octave)
     * @param {boolean}                   init   - If the method has been called by the ._init() method
     */
    // @old icSwitchFTsys
    switchFTsys(sys, sys_hs=false, init=false) {
        if (sys === "nEDx") {
            if (init) {
                this.uiElements.fn.ftSys_NEDX.checked = true;
            }
            this.uiElements.fn.ftNEDX.style.display = "initial";
            this.uiElements.fn.ftHS.style.display = "none";
            this.settings.ft.selected = "nEDx";
        } else if (sys === "h_s") {
            this.uiElements.fn.ftNEDX.style.display = "none";
            this.uiElements.fn.ftHS.style.display = "initial";
            this.settings.ft.selected = "h_s";
            if (sys_hs === "natural") {
                if (init) {
                    this.uiElements.fn.ftSys_HSnat.checked = true;                        
                }
                this.settings.ft.h_s.selected = "natural";
                this.uiElements.out.ftHStranspose_h_ratio.innerText = this.settings.ft.h_s.natural.h_tr;
                this.uiElements.out.ftHStranspose_s_ratio.innerText = this.settings.ft.h_s.natural.s_tr;
            } else if (sys_hs === "sameOctave") {
                if (init) {
                    this.uiElements.fn.ftSys_HStrans.checked = true;                        
                }
                this.settings.ft.h_s.selected = "sameOctave";
                this.uiElements.out.ftHStranspose_h_ratio.innerText = this.settings.ft.h_s.sameOctave.h_tr;
                this.uiElements.out.ftHStranspose_s_ratio.innerText = this.settings.ft.h_s.sameOctave.s_tr;
            }
        }
        this.updateKeymapPreset();
    }

    /**
     * Set the nEDx (called when UI is updated)
     */
    // @old icSetNEDX
    setNEDX() {
        if (this.uiElements.in.ftNEDX_unit.value < 1) {
            this.uiElements.in.ftNEDX_unit.value = 1;
        }
        if (this.uiElements.in.ftNEDX_division.value < 1) {
            this.uiElements.in.ftNEDX_division.value = 1;
        }
        this.settings.ft.nEDx.unit = Number(this.uiElements.in.ftNEDX_unit.value);
        this.settings.ft.nEDx.division = Number(this.uiElements.in.ftNEDX_division.value);
        // Recreate all tables
        this.initTables();

    }
    /**
     * Transpose FT under harmonics/subharmonics Tuning System (called when UI is updated)
     *
     * @param {tratio}   ratio - The ratio for the transposition
     * @param {tonetype} type  - The tone type
     */
     // @old icFThsTranspose
    transposeFThs(ratio, type) {
        if (this.settings.ft.h_s.selected === "natural") {
            this.settings.ft.h_s.natural[type+"_tr"] *= ratio;
            this.uiElements.out[`ftHStranspose_${type}_ratio`].innerText = this.settings.ft.h_s.natural[type+"_tr"];
        } else if (this.settings.ft.h_s.selected === "sameOctave") {
            this.settings.ft.h_s.sameOctave[type+"_tr"] *= ratio;
            this.uiElements.out[`ftHStranspose_${type}_ratio`].innerText = this.settings.ft.h_s.sameOctave[type+"_tr"];
        }
        this.initTables();
    }

    /*==============================================================================*
     * HT UI tools
     *==============================================================================*/

    /**
     * Transpose HT (sub)harmonics (called when UI is updated)
     *
     * @param  {tratio}    ratio  - The ratio with which to compute the transposition
     * @param  {('h'|'s')} type   - Type of transposition; 'h' for harmonics or 's' for subharmonics
     * @param  {boolean}   octave - If it's an octave transposition or not.<br>
     *                              If it's true, the 'ratio' should be 2 (for octave up) or 0.5 (for octave down).
     */
     // @old icHTtranspose
    transposeHT(ratio, type, octave) {
        // If it's an octave transpose
        if (octave === true) {
            // Multiply the current transpose ratio by the input ratio
            this.settings.ht.transpose[type] *= ratio;
            // Update the new computed transpose ratio to the UI
            this.uiElements.in[`htTranspose_${type}_ratio`].value = this.settings.ht.transpose[type];
        } else if (octave === false) {
            // Check if the ratio is > 0
            if (ratio > 0) {
                // Set the new transpose ratio
                this.settings.ht.transpose[type] = ratio;
            // If it's not, restore the last valid ratio
            } else {
                this.uiElements.in[`htTranspose_${type}_ratio`].value = this.settings.ht.transpose[type];
                // Stop executing the rest of the function
                return;
            }
        }
        // Recreate the HT table on the last FT
        this.createHTtable(this.tables.ft[this.settings.ht.curr_ft].hz);
    }

    /*==============================================================================*
     * KEYMAP HANDLING METHODS
     *==============================================================================*/

    /**
     * Update the preset list according to the selected FTs Tuning System
     */
    // @old icUpdateKeymapPreset
    updateKeymapPreset() {
        let htmlElem = this.uiElements.in.controllerKeymapPresets;
        let lastValue = this.ctrlKeymapPreset.current[this.settings.ft.selected];
        let changeEvent = {target: {value: lastValue}};
        let keymaps = Object.keys(this.ctrlKeymapPreset[this.settings.ft.selected]);
        let optionFile = document.createElement("option");
        htmlElem.innerHTML = "";
        for (let key of keymaps) {
            let option = document.createElement("option");
            option.value = key;
            option.text = this.ctrlKeymapPreset[this.settings.ft.selected][key].notes;
            htmlElem.add(option);
        }
        optionFile.text = "Load from file...";
        optionFile.value = 99;
        htmlElem.add(optionFile);
        htmlElem.value = lastValue;
        this.loadKeymapPreset(changeEvent);
    }

    /**
     * Load a Controller keymap from 'ctrlKeymapPreset' according to the selection on UI
     *
     * @param {Event} changeEvent - Change HTML event on 'select' element (ctrl keymap dropdown)
     */
    // @old icLoadKeymapPreset
    loadKeymapPreset(changeEvent) {
        let indexValue = changeEvent.target.value;
        if (indexValue != 99) {
            let keymap = this.ctrlKeymapPreset[this.settings.ft.selected][indexValue].map;
            
            // Store the current Keymap <option> value in a global slot
            this.ctrlKeymapPreset.current[this.settings.ft.selected] = indexValue;
            // Write the Controller Keymap into the global object
            this.tables.ctrl = keymap;

            this.initPipeQueue('h');
            
            // re-Create FT & HT tables (necessary for reverse-tables on tsnap midi receivig mode)
            this.initTables();

            this.sendMessageToApps(HUM.DHCmsg.ctrlmapUpd('dhc'));

            this.uiElements.in.controllerKeymapFile.style.visibility = "hidden";
        } else {
            this.uiElements.in.controllerKeymapFile.style.visibility = "initial";
        }
    }

    /**
     * On loading the Controller Keymap file
     *
     * @param {Event} changeEvent - HTML change event on 'input' element (ctrl keymap file uploader)
     */
    // @old icHandleKeymapFile
    handleKeymapFile(changeEvent) {
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
            // Access to the file and send it to read function
            this.readKeymapFile(changeEvent.target.files[0]);
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
    }

    /**
     * Initialize the reading process of the Controller Keymap file
     *
     * @param {File} file - The file to be read
     */
    // @old icReadKeymapFile
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
     * Build the Controller Keymap table on the incoming raw data from .hcmap file
     *
     * @param {string} data - The text content of the Controller keymap file
     * @param {string} name - The filename
     */
    // @old icProcessKeymapData
    processKeymapData(data, name) {
        // Get the key for the new slot
        let optionValue = this.uiElements.in.controllerKeymapPresets.length;
        // Split by lines
        let allTextLines = data.split(/\r\n|\n/);
        let lines = {};
        // For every line
        for (let i = 0; i < allTextLines.length; i++) {
            // Split the line by spaces or tabs
            let elements = allTextLines[i].split(/\s\s*/);
            lines[parseInt(elements[0])] = { ft: parseInt(elements[1]), ht: parseInt(elements[2]) };
        }
        // Write the Controller Keymap into a new slot in this.ctrlKeymapPreset
        this.ctrlKeymapPreset[this.settings.ft.selected][optionValue] = {};
        this.ctrlKeymapPreset[this.settings.ft.selected][optionValue].map = lines;
        this.ctrlKeymapPreset[this.settings.ft.selected][optionValue].name = name;
        this.ctrlKeymapPreset[this.settings.ft.selected][optionValue].notes = "FILE: " + name;
        this.ctrlKeymapPreset.current[this.settings.ft.selected] = optionValue;
        // Update the dropdown (and the UI monitors)
        this.updateKeymapPreset();
    }

    /**
     * Create an HTML table from the controller keymap and write it to the UI under a modal element
     */
    // @old icCtrlKeymap2HTML
    keymap2Html() {
        let txt = "";
        let map = this.tables.ctrl;
        txt += '<table class="dataTable"><tr><th>MIDI #</th><th>FT</th><th>HT</th></tr>';
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
        this.uiElements.out.controllerKeymapTable.innerHTML = txt;

        // Get the modal element
        let modal = this.uiElements.fn.controllerKeymapModal;
        // Get the <span> element that closes the modal element
        let close = this.uiElements.fn.controllerKeymapClose;
        // When the user clicks the button, open the modal element
        modal.style.display = "block";
        // When the user clicks on <span> (x), close the modal element
        close.onclick = function() {
            modal.style.display = "none";
        };
        // window.addEventListener("click", function(event) {
        //     if (event.target == modal) {
        //         modal.style.display = "none";
        //     }
        // });
        // When the user clicks anywhere outside of the modal element, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    }

    /*==============================================================================*
     * DHC PLAYING METHODS
     *==============================================================================*/
    
    /**
     * Play a Fundamental Tone
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the FT to be played
     */
    playFT(dhcMsg) {
        // Recalculate the ht table passing the frequency (Hz)
        this.createHTtable(this.tables.ft[dhcMsg.xtNum].hz);

        // - - - - - - - - - - - - - -
        // ANTI NOTES STUCKING
        if (dhcMsg.ctrlNum === false) {
            // Search by xtNum
            let remPos = false;
            // If there is ONE FT is already pressed, stop it before playing it again
            this.playQueue.ft.forEach( (queueTone, position) => {
                // If the key is already pressed
                if (queueTone.xtNum === dhcMsg.xtNum) {
                    this.sendMessageToApps(HUM.DHCmsg.ftOFF(queueTone.source, queueTone.xtNum, queueTone.velocity, queueTone.ctrlNum));
                    // this.playQueue.ft.splice(position, 1);
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
                    // this.playQueue.ft.splice(position, 1);
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
        this.dhcMonitor("ft", dhcMsg.xtNum);
    }

    /**
     * Stop playing a Fundamental Tone
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the FT to be muted
     */
    muteFT(dhcMsg) {            
        // Search the FT number in the playQueue array
        let position = this.playQueue.ft.findIndex(qt => qt.xtNum === dhcMsg.xtNum);
        // If the FTn exist
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
                    this.dhcMonitor("ft", nextTone.xtNum);

                }
            }

        // If the FTn does not exist
        }
        // else {
        //     // if (dhcMsg.panic === false) {
        //     //     console.log("STRANGE: there is NOT a FT pressed key #:", dhcMsg.xtNum);
        //     // }
        // }

    }

    /**
     * Play a Harmonic/Subharmonic Tone
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the HT to be played
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
            this.dhcMonitor("ht", dhcMsg.xtNum);
        
        // If HT0 is pressed, it's the Piper feature!
        } else if (dhcMsg.xtNum === 0) {
            // Note ON the next piped HT
            this.piping(1);
        }

        this.sendMessageToApps(dhcMsg);

    }

    /**
     * Stop playing a Harmonic/Subharmonic Tone
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the HT to be muted
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

            // If the FTn does not exist
            } 
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
     * Force to stop playing all Fundamental and Harmonic/Subharmonic Tones
     */
    panic() {
        this.playQueue.ft = [];
        this.playQueue.ht = [];
        this.sendMessageToApps(HUM.DHCmsg.allNotesOff('dhc'));
    }

    /*==============================================================================*
     * PIPER HT0 FEATURE
     * The Piper store the last N pressed HTs and repeat them when HT0 is pressed
     * simulating a special fake MIDI message
     *==============================================================================*/

    /**
     * Store a play-HT message into the Piper's queue
     *
     * @param {HUM.DHCmsg} dhcMsg - The message containing the HT to be piped
     */
    piper(dhcMsg) { // statusByte, ctrlNum, velocity, type) {
        // Prepare the fake MIDI message
        // let pack = [statusByte, ctrlNum, velocity];
        // If the pipe is not full
        if (this.pipe.queue.length < this.pipe.maxLenght) {
            // Insert the message at the beginning of the queue
            this.pipe.queue.push(dhcMsg);
        // Else, if the pipe is full
        } else {
            // Remove the oldest message in the pipe
            this.pipe.queue.shift();
            // Insert in the pipe a new message
            this.pipe.queue.push(dhcMsg);
        }
    }

    /**
     * Play or mute the next HT available in the piper's queue.<br>
     *     Usually when HT0 is pressed (or released).
     *
     * @param {(0|1)} state - Note ON/OFF; 1 is ON (play), 0 is OFF (mute)
     */
    piping(state) {
        // Get the index (current step)
        let i = this.pipe.currStep;
        // If there are notes in the queue
        if (this.pipe.queue.length > 0) {
            // Inject the queue into the pipe at the current step position
            this.pipe.pipe.splice.apply(this.pipe.pipe, [i, this.pipe.queue.length].concat(this.pipe.queue));
            // If the final pipe is longer than the maxLenght
            if (this.pipe.pipe.length > this.pipe.maxLenght) {
                // Cut the pipe according to the maxLenght
                this.pipe.pipe.splice(0, (this.pipe.pipe.length - this.pipe.maxLenght));
            }
            // Increase current step and index in order to start playing
            // after the notes that have just been inserted
            this.pipe.currStep += this.pipe.queue.length;
            i += this.pipe.queue.length;
            // Empty the queue
            this.pipe.queue = [];
        }
        // If there are notes in the pipe
        if (this.pipe.pipe.length > 0) {
            // If step count is not at the end of the pipe
            if (i < this.pipe.maxLenght) {
                // Note ON
                if (state === 1) {
                    // If there is some message at the current step in the pipe
                    if (this.pipe.pipe[i]) {
                        // Create the special-marked fake MIDI message
                        // in order to not to be confused with a normal MIDI message
                        // let hancock = this.pipe.pipe[i][3];
                        // if (this.settings.controller.receive_mode !== 'keymap') {
                        //     hancock = 'hancock';
                        // }
                        // let midievent = {
                        //     data: [this.pipe.pipe[i][0], this.pipe.pipe[i][1], this.pipe.pipe[i][2], hancock, "piper"]
                        // };
                        this.pipe.pipe[i].piper = true;
                        this.playHT(this.pipe.pipe[i]);
                        
                        // Send the fake MIDI message
                        // this.midi.in.midiMessageReceived(midievent);
                        // Store the last sent MIDI message in 'currTone'
                        this.pipe.currTone = this.pipe.pipe[i];
                    } else {
                        this.pipe.currTone = null;
                    }
                // Note OFF
                } else if (state === 0) {
                    // If there is a stored MIDI message in 'currTone'
                    if (this.pipe.currTone) {
                        let currToneOFF = HUM.DHCmsg.copyOFF(this.pipe.currTone);
                        // this.pipe.currTone.cmd = "tone-off";
                        // Set the velocity to zero (Note OFF)
                        // this.pipe.currTone.data[2] = 0;
                        // Send the fake MIDI message
                        // this.midi.in.midiMessageReceived(this.pipe.currTone);
                        this.muteHT(currToneOFF);
                    }
                    // Go to the next step in the pipe
                    this.pipe.currStep++;
                }
            // If step count is at the end (or out) of the pipe
            } else {
                // Reset the step counter                
                this.pipe.currStep = 0;
                // Retry to execute the icPiping (itself) again
                this.piping(state);
            }
        }
    }

    /**
     * Experimental function for dynamic default/preloaded piper melody.<br>
     *     Fill the Piper's queue with a sequence of HTs.
     *
     * @todo - The preloaded Pipe must use only available keys
     * 
     * @param {('h'|'s'|'hs')} type - The HTs scale type of the current Controller keymap
     */
    initPipeQueue(type) {
        // let ctrlMap = this.tables.ctrl;
        let melodies = {
            h: [9, 10, 8, 4, 6],
            s: [-6, -5, -4, -3, -4, -5],
            hs: [6, -6, 6, -6, 6, -6]
        };
        let msgsQueue = [];
        for (let tone of melodies[type]) {
            msgsQueue.push(HUM.DHCmsg.htON('dhc', tone, 120, false, true));
        }
        this.pipe.maxLenght = this.uiElements.in.dhc_piperSteps.value = msgsQueue.length;
        this.pipe.queue = msgsQueue;
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
    // @old icArrayPitchbender
    bendXtone(xtObj) {
        // Compute the Controller Pitchbend amount in cents
        let pitchbend = this.settings.controller.pb.amount * this.settings.controller.pb.range,
        // Apply the controller pitchbend if present
            hz = Math.pow(2, pitchbend / 1200) * xtObj.hz,
            mc = (xtObj.mc + pitchbend / 100);
        return new this.Xtone(hz, mc);
    }

    /**
     * Update all parts of the UI with the last computed or set values.
     * Send the 'init' message to all the redistered Apps. 
     */
    // @old icMONITORSinit
    initUImonitors() {
        // Compile the FM monitors
        this.printFundamentalMother(this.settings.fm.hz, this.settings.fm.mc);
        // Compile the FT monitors
        this.dhcMonitor("ft", this.settings.ht.curr_ft);
        // If a HT has been already pressed
        if (this.settings.ht.curr_ht) {
            // Compile the HT monitor
            this.dhcMonitor("ht", this.settings.ht.curr_ht);
        }
        this.sendMessageToApps(HUM.DHCmsg.init('dhc'));
    }

    /**
     * Monitor UI
     *
     * @param  {tonetype} type  - If the tone is a FT or HT
     * @param  {xtnum}    xtNum - FT or HT relative tone number
     */
    // @old icDHCmonitor
    dhcMonitor(type, xtNum) {
        let xtObj = this.tables[type][xtNum];
        // Apply the controller pitchbend (if present) to the array 
        xtObj = this.bendXtone(xtObj);
        let notename = this.mcToName(xtObj.mc),
            name = notename[0],
            sign = notename[1],
            cent = notename[2],
            hzAccuracy = this.settings.global.hz_accuracy,
            mcAccuracy = this.settings.global.cent_accuracy;
        if (type === "ft") {
            // Update the log on MONITOR FT info on the UI
            this.uiElements.out.toneMonitorFT_tone.innerText = xtNum;
            this.uiElements.out.toneMonitorFT_midicents.innerText = xtObj.mc.toFixed(mcAccuracy + 2);
            this.uiElements.out.toneMonitorFT_notename.innerText = name + " " + sign + cent + "\u00A2";
            this.uiElements.out.toneMonitorFT_frequency.innerText = xtObj.hz.toFixed(hzAccuracy);
        } else if (type === "ht") {
            // Update the log on MONITOR HT info on the UI
            this.uiElements.out.toneMonitorHT_tone.innerText = xtNum;
            this.uiElements.out.toneMonitorHT_midicents.innerText = xtObj.mc.toFixed(mcAccuracy + 2);
            this.uiElements.out.toneMonitorHT_notename.innerText = name + " " + sign + cent + "\u00A2";
            this.uiElements.out.toneMonitorHT_frequency.innerText = xtObj.hz.toFixed(hzAccuracy);
        }
    }

    /*==============================================================================*
     * DHC UI INIT
     *==============================================================================*/

    /**
     * Initialize the DHC UI controllers
     */
    // @old icUIinit
    _initUI() {
        /*  UI DEFAULT SETTINGS
         * ====================*/

        // Default UI FM
        if (this.settings.fm.init === "mc") {
            // If the FM 'init' value is 'mc'
            // Set UI midicents FM from this.settings.fm.mc
            this.uiElements.in.fm_mc.value = this.settings.fm[this.settings.fm.init];
        } else if (this.settings.fm.init === "hz") {
            // If the FM 'init' value is 'hz'
            // Set UI Hz FM from this.settings.fm.hz
            this.uiElements.in.fm_hz.value = this.settings.fm[this.settings.fm.init];
        } else {
            console.log("The 'DHC.settings.fm.init' attribute has an unexpected value: " + this.settings.fm.init);
        }
        // Default FT nED-x on UI textboxes
        this.uiElements.in.ftNEDX_unit.value = this.settings.ft.nEDx.unit;
        this.uiElements.in.ftNEDX_division.value = this.settings.ft.nEDx.division;
        // Default HT TRANSPOSE on UI textboxes
        this.uiElements.in.htTranspose_h_ratio.value = this.settings.ht.transpose.h;
        this.uiElements.in.htTranspose_s_ratio.value = this.settings.ht.transpose.s;
        // Default DHC SETTINGS on UI textboxes
        this.uiElements.in.dhc_hzAccuracy.value = this.settings.global.hz_accuracy;
        this.uiElements.in.dhc_mcAccuracy.value = this.settings.global.cent_accuracy;
        this.uiElements.in.dhc_middleC.value = this.settings.global.middle_c + 5;
        this.uiElements.in.dhc_pitchbendRange.value = this.settings.controller.pb.range;
        this.uiElements.in.dhc_piperSteps.value = this.pipe.maxLenght;

        /*  UI EVENT LISTENERS
         * ====================*/

        //------------------------
        // UI GENERAL DHC settings
        //------------------------
        // Set the UI HZ DECIMAL PRECISION from UI HTML inputs
        this.uiElements.in.dhc_hzAccuracy.addEventListener("change", (event) => {
            // Store the Hz accuracy in the global slot
            this.settings.global.hz_accuracy = Number(event.target.value);
            // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
            this.initUImonitors();
            // icDHCinit();
        });
        // Set the UI MIDI.CENTS DECIMAL PRECISION from UI HTML inputs
        this.uiElements.in.dhc_mcAccuracy.addEventListener("change", (event) => {
            // Store the mc accuracy in the global slot
            this.settings.global.cent_accuracy = Number(event.target.value);
            // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
            this.initUImonitors();
            // icDHCinit();
        });
        // Set the MIDDLE C OCTAVE from UI HTML inputs
        this.uiElements.in.dhc_middleC.addEventListener("change", (event) => {
            // Beginning octave = Middle C octave - 5   (-1 => C4)
            this.settings.global.middle_c = event.target.value - 5;
            // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
            this.initUImonitors();
            // icDHCinit();
        });
        // Set the CONTROLLER PITCHBEND RANGE from UI HTML inputs
        this.uiElements.in.dhc_pitchbendRange.addEventListener("change", (event) => {
            this.settings.controller.pb.range = event.target.value;
        });
        // Set the PIPER HT0 FEATURE from UI HTML inputs
        this.uiElements.in.dhc_piperSteps.addEventListener("change", (event) => {
            this.pipe.maxLenght = event.target.value;
        });

        //-------------------
        // UI FM DHC settings
        //-------------------
        // Set the Fundamental Mother (FM) from UI HTML inputs
        this.uiElements.in.fm_mc.addEventListener("change", () => {
            this.setFM(this.getFM("mc"));
            this.uiElements.in.fm_hz.value = "";
        });
        this.uiElements.in.fm_hz.addEventListener("change", () => {
            this.setFM(this.getFM("hz"));
            this.uiElements.in.fm_mc.value = "";
        });

        //-------------------
        // UI FT DHC settings
        //-------------------
        // Set the RADIO BUTTONS for FT TUNING SYSTEM
        // Radio NEDX system
        this.uiElements.fn.ftSys_NEDX.addEventListener("click", (event) => {
            if (event.target.checked) {
                this.switchFTsys("nEDx");
            }
        });
        // Radio HS Natural system
        this.uiElements.fn.ftSys_HSnat.addEventListener("click", (event) => {
            if (event.target.checked) {
                this.switchFTsys("h_s", "natural");
            }
        });
        // Radio HS Transposed Same Octave system
        this.uiElements.fn.ftSys_HStrans.addEventListener("click", (event) => {
            if (event.target.checked) {
                this.switchFTsys("h_s", "sameOctave");
            }
        });
        // Set default FT Tuning System after the radio buttons are set-up
        // this.uiElements.fn.ftSys_NEDX.click();
        // Get and set the FT NEDX UI HTML inputs
        this.uiElements.in.ftNEDX_unit.addEventListener("change", this.setNEDX.bind(this));
        this.uiElements.in.ftNEDX_division.addEventListener("change", this.setNEDX.bind(this));
        this.uiElements.in.ftNEDX_ok.addEventListener("click", this.setNEDX.bind(this));

        // Get and set the FT HARM/SUBHARM UI HTML inputs
        // Harmonic Tones transposition
        // + Octave
        this.uiElements.in.ftHStranspose_h_plus.addEventListener("click", () => {
            this.transposeFThs(2, "h");
        });
        // - Octave
        this.uiElements.in.ftHStranspose_h_minus.addEventListener("click", () => {
            this.transposeFThs(0.5, "h");
        });

        // Subharmonic Tones transposition
        // + Octave
        this.uiElements.in.ftHStranspose_s_plus.addEventListener("click", () => {
            this.transposeFThs(2, "s");
        });
        // - Octave
        this.uiElements.in.ftHStranspose_s_minus.addEventListener("click", () => {
            this.transposeFThs(0.5, "s");
        });

        //-------------------
        // UI HT DHC settings
        //-------------------
        // Get and set the HT UI HTML inputs
        // Harmonic Tones transposition
        // + Octave
        this.uiElements.in.htTranspose_h_plus.addEventListener("click", () => {
            this.transposeHT(2, "h", true);
        });
        // – Octave
        this.uiElements.in.htTranspose_h_minus.addEventListener("click", () => {
            this.transposeHT(0.5, "h", true);
        });
        // Free ratio
        this.uiElements.in.htTranspose_h_ratio.addEventListener("change", (e) => {
            this.transposeHT(e.target.value, "h", false);
        });

        // Subharmonic Tones transposition
        // + Octave
        this.uiElements.in.htTranspose_s_plus.addEventListener("click", () => {
            this.transposeHT(2, "s", true);
        });
        // – Octave
        this.uiElements.in.htTranspose_s_minus.addEventListener("click", () => {
            this.transposeHT(0.5, "s", true);
        });
        // Free ratio
        this.uiElements.in.htTranspose_s_ratio.addEventListener("change", (e) => {
            this.transposeHT(e.target.value, "s", false);
        });
        //-------------------
        // UI of the Controller KEYMAP readers
        //-------------------
        // @old icKeymapsUIinit
        // Add an EventListener to the (on)change event of the Controller Keymap File <input> tag
        this.uiElements.in.controllerKeymapFile.addEventListener('change', this.handleKeymapFile.bind(this), false);
        // Add an EventListener to the (on)change event of the Controller Keymap File <select> tag
        this.uiElements.in.controllerKeymapPresets.addEventListener('change', this.loadKeymapPreset.bind(this));

        // Get the button that opens the modal controller keymap table
        this.uiElements.fn.controllerKeymapTableShow.addEventListener("click", this.keymap2Html.bind(this));

    }

    /*==============================================================================*
     * NOTE NAMING CONVERSION TOOLS
     *==============================================================================*/

    /**
     * Parse a note name string to get the MIDI note number
     *
     * @example
     * 'hancock' C0 == 0 midicent == 0 midinnum
     * 'scientific' C0 == 12 midicent == 12 midinnum
     * 'ui' C0 == // depends on Middle C setting ({@link DHCsettings.global.middle_c}) 
     * 
     * @param {('hancock'|'ui'|'scientific')} mode - The method in which the 'note' should be interpreted.
     * @param {string}                        note - The note name in format <em>[A-G]#?-?\d+</em>. E.g. C0, A#4, G-3, D#-1  
     * 
     * @return {midinnum} - MIDI note number
     */
    // @old icHancockToMidi
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
                return ref[note] + (12 * (octave + (this.settings.global.middle_c * -1)));
            } else if (mode === 'scientific') {
                return ref[note] + (12 * (octave + 1));
            }
        } else {
            return undefined;
        }
    }
    /**
     * Convert a MIDI note number to an array containing 'hancock', 'ui' and 'scientific' note name,
     *     plus the information if the key on the piano should be black or white.
     *
     * @param {midinnum} midikey - MIDI note number (integer)
     *
     * @return {Array.<string, string, boolean, string>} - An array with Hancock, UI and Scientific note name, and if the key is white or black
     */
    // @old icMidiToHancock
    midiNumberToNames(midikey) {
        let ref = {
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
        // If positive - Higher than midikey 0 / 8.1758 Hz (C-1 in scientific pitch notation)
        if (midikey >= 0) {
            // Compute the quotient and remainder of the MIDI note number
            let quotient = Math.trunc(midikey/12);
            let remainder = midikey % 12;
            
            // String concatenation: Hancock note name
            let hancockNotename = ref[remainder][0] + quotient;
            // String concatenation: UI note name 
            let uiNotename = ref[remainder][0] + (quotient + this.settings.global.middle_c);
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
            let uiNotename = ref[remainder][0] + (quotient + this.settings.global.middle_c);
            let sciNotename = ref[remainder][0] + (quotient - 1);
            let isBlack = ref[remainder][1];
            // Return an array with both, Hancock and UI note name
            return [hancockNotename, uiNotename, isBlack, sciNotename];

        }
    }
    /**
     * UI Util to get the UI note name +/- cents from given midicent
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
        noteCents = (noteCents.toFixed(this.settings.global.cent_accuracy + 2) * 100).toFixed(this.settings.global.cent_accuracy); 
        let noteCentsUI = Number(noteCents, 10);
        // Remove the centSign if cents are zero
        centSign = (noteCentsUI === 0) ? "" : centSign;
        //       note name,   +/- sign,    cents,    black key y/n
        return [noteNames[1], centSign, noteCentsUI, noteNames[2]];
    }
    /**
     * Util to get the full string of UI note name +/- cents
     *
     * @param {midicent} mc - Pitch in midicent (float)
     *
     * @return {string} - The compliled string; e.g. D#3 -45&cent;;
     */
    mcToNameString(mc) {
        let result = this.mcToName(mc);
        return result[0] + " " + result[1] + result[2] + "\u00A2";
    }

/*==============================================================================*
 * GENERAL DHC COMPUTING TOOLS
 *==============================================================================*/

    /**
     * From MIDI note number to frequency (Hz)
     * 
     * @param {midicent} mc - MIDI note number expressed in midi.cents
     * 
     * @return {hertz} - Frequency expressed in hertz (Hz)
     */
    // @old icMtoF
    static mcToFreq(mc) {
        // Use the icCompute_nEDx() function to get frequency
        return this.compute_nEDx(mc - 69, 2, 12, 440);
    }

    /**
     * From frequency (Hz) to MIDI note number
     * 
     * @param {hertz} freq - Frequency expressed in hertz (Hz)
     * 
     * @return {midicent} - MIDI note number expressed in midicent
     */
    // @old icFtoM
    static freqToMc(freq) {
        let midicent = 69 + 12 * Math.log2(freq / 440);
        // Return full accuracy midicent
        return midicent;
    }
    /**
     * Calculate the n-EDx ("free" equal temperament) of a relative tone
     *
     * @param  {number} relativeTone - Relative number of the "step" in the scale (should be integer)
     * @param  {number} unit         - Ratio unit (must be greater than zero)
     * @param  {number} division     - Equal divisions of the ratio unit (must be greater than zero)
     * @param  {hertz}  masterTuning - Reference frequency expressed in hertz (Hz)
     * 
     * @return {hertz} - Frequency expressed in hertz (Hz)
     */
    // @old icCompute_nEDx
    static compute_nEDx(relativeTone, unit, division, masterTuning) {
        let frequency = Math.pow(unit, relativeTone / division) * masterTuning;
        // Return full accuracy frequency
        return frequency;
    }

    /**
     * Remove duplicated values on the array passed via the argument
     *
     * @param {Array.<number>} arrArg - Array of numbers
     *
     * @return {Array.<number>} - Uniquified array
     */
    static uniqArray(arrArg) {
          return arrArg.filter((elem, pos, arr) => arr.indexOf(elem) === pos );
    }

    // end class Prototype

}; // end Class


/**
 * A FT or HT relative tone (used in ft_table ht_table)
 */
HUM.DHC.prototype.Xtone = class {
    /**
     * @property {hertz}    hz - Frequency expressed in hertz (Hz)
     * @property {midicent} mc - MIDI note number expressed in midi.cents
     */
    constructor(hz, mc) {
        this.hz = Number(hz);
        this.mc = Number(mc);
        Object.freeze(this);
    }
};

/** 
 * The main Dynamic Harmonics Calculator class
 */
HUM.DHC.prototype.DHCsettings = class {
     /**
     * @param {string} preset - A JSON string containing...
     */
    constructor(preset=false) {
        /**
         * Global settings
         *
         * @member {Object}
         * 
         * @property {number}                      hz_accuracy   - Number of decimal places (on UI) for numbers expressed in hertz (Hz)
         * @property {number}                      cent_accuracy - Number of decimal places (on UI) for numbers expressed in cents
         * @property {('sharp'|'flat'|'relative')} enharmonic_nn - Enharmonic note naming; 'sharp' for [#], 'flat' for [b] or "relative" for [#/b]
         * @property {number}                      middle_c      - Middle C octave (-1 = from octave -1 >> Middle C = 60) - Starting octave
         */
        this.global = {
            hz_accuracy: 2,
            cent_accuracy: 0,
            // @todo - Enharmonic note naming
            enharmonic_nn: "sharp",
            middle_c: -1,
        };
        /**
         * Controller settings
         *
         * @todo - Move to midi-in (one per input channel?)
         * 
         * @member {Object}
         *
         * @property {Object}                                             pb                  - Controller's Pitch Bend settings
         * @property {cent}                                               pb.range            - Range value in cents (use hundreds when use MIDI-OUT and possibly the same as the instrument)
         * @property {number}                                             pb.amount           - Current input controller pitchbend amount.
         *                                                                                      Value from -8192 to +8191, normalized to the ratio from -1 to 0,99987792968750 
         *                                                                                      Init amount is always 0.
         * @property {('keymap'|'tsnap-channel'|'tsnap-divider')}         receive_mode        - FT/HT controller note receiving mode
         * @property {Object}                                             tsnap               - Tone snapping receiving mode settings
         * @property {midicent}                                           tsnap.tolerance     - Snap tolerance in midicent; it's the maximum difference within which you can consider
         *                                                                                      two frequencies as the same note
         * @property {midinnum}                                           tsnap.divider       - The note, on a MIDI piano keyboard, that divides the FTs from HTs;
         *                                                                                      the notes smaller or equal to the divider will be considered FT, the greater ones will be considered HT
         * @property {Object}                                             tsnap.channel       - Namesapace for tone snapping Channel Mode settings
         * @property {midichan}                                           tsnap.channel.ft    - The MIDI channel assigned to FTs; all notes received on this channel will be considered as FT
         * @property {midichan}                                           tsnap.channel.ht    - The MIDI channel assigned to HTs; all notes received on this channel will be considered as HT
         */
        this.controller = {
            pb: {
                range: 100,
                amount: 0.0
            },
            receive_mode: "keymap",
            tsnap: {
                tolerance: 0.5,
                divider: 56,
                channel: {
                    ft: 1,
                    ht: 0,
                    divider: 0
                }
            },
        };
        /**
         * Fundamental Mother (FM) settings
         * 
         * @member {Object}
         *
         * @property {hertz}       hz   - Frequency expressed in hertz (Hz)
         * @property {midicent}    mc   - Frequency expressed in midi.cents (mc)
         * @property {('mc'|'hz')} init - What unit to use to initialize, 'hz' or 'mc'
         */
        this.fm = {
            hz: false, // 130.8127826502993,
            mc: 48,
            init: "mc"
        };
        /**
         * Fundamental Tones (FTs) scale tuning method settings
         * 
         * @member {Object}
         * 
         * @property {Object}                   nEDx                - "Equal Temperament" tuning method parameters
         * @property {number}                   nEDx.unit           - The ratio to divide
         * @property {number}                   nEDx.division       - The equal divisions
         * @property {Object}                   h_s                 - "Harmonics and subharmonics" tuning method parameters
         * @property {Object}                   h_s.natural         - Natural (no transposition)
         * @property {tratio}                   h_s.natural.h_tr    - Transpose ratio in decimal for Harmonics
         * @property {tratio}                   h_s.natural.s_tr    - Transpose ratio in decimal for Subharmonics
         * @property {Object}                   h_s.sameOctave      - Same octave transposition
         * @property {tratio}                   h_s.sameOctave.h_tr - Transpose ratio in decimal for Harmonics
         * @property {tratio}                   h_s.sameOctave.s_tr - Transpose ratio in decimal for Subharmonics
         * @property {('natural'|'sameOctave')} h_s.selected        - Default/current sub-method selected
         * @property {Object}                   file                - Tuning files method (currently not used)
         * @property {('nEDx'|'h_s'|'file')}    selected            - Default/current method selected
         * @property {number}                   steps               - +/- Steps for {DHC#tables.ft}<br>
         *                                                            'steps' to final range: MIDI Note number range considerations<br>
         *                                                            32 = -32 > +32 : (old default: I think +-64 is too wide, but let's try)<br>
         *                                                            64 = -64 > +64 : FM = midi#63 or midi#64 to use the full MIDI note range<br>
         *                                                            ( midi#63 out of range on -1  )<br>
         *                                                            ( midi#64 out of range on 128 )
         */
        this.ft = {           
            nEDx: {
                unit: 2,
                division: 12
            },
            h_s: {
                natural: {
                    h_tr: 1,
                    s_tr: 16
                },
                sameOctave: {
                    h_tr: 1,
                    s_tr: 2
                },
                selected: "sameOctave"
            },
            /** @todo - Tuning file formats */ 
            file: {
                scl: {},
                tun: {},
                mtx: {},
                lmso: {},
                selected: "scl"
            },
            selected: "nEDx",
            steps: 64
        };
        /**
         * Harmonic/subharmonic Tones (HTs) scale tuning settings
         * 
         * @member {Object}
         *
         * @property {Object} transpose   - Harmonics and subharmonics transpose
         * @property {tratio} transpose.h - Transpose ratio in decimal for Harmonics
         * @property {tratio} transpose.s - Transpose ratio in decimal for Subharmonics
         * @property {xtnum}  curr_ft     - The current FT (that generated the last HT table); init value must be 0
         * @property {xtnum}  curr_ft     - The last pressed HT; init value should be null
         */
        this.ht = {
            transpose: {
                h: 1,
                s: 1 // 16
            },
            curr_ft: 0,
            curr_ht: null
        };

    }
};

/**
 * DHC Message class
 *
 * @property {string}                                         #source   - Name of the App component that generated the message
 * @property {('init'|'panic'|'update'|'tone-on'|'tone-off')} #cmd      - Command code of the message
 * @property {tonetype}                                       #type     - The tone typeto which the message is directed; FT or HT
 * @property {xtnum}                                          #xtNum    - The FT or HT number
 * @property {velocity}                                       #velocity - The intensity of the sound to be generated in MIDI velocity format
 * @property {midinnum}                                       #ctrlNum  - The MIDI Note Number corresponding to the FT or HT on the keymap (if present)
 * @property {boolean}                                        #piper    - If the message is generated by the Piper feature
 * @property {boolean}                                        #panic    - Only in case of `cmd` 'note-off', it tells that the message has been generated by a "hard" All-Notes-Off request
 * @property {boolean}                                        #tsnap    - If the message has been converted by the Tone-Snap receiving mode
 * 
 */
HUM.DHCmsg = class {
     /**
     * @param {string}                                         source   - Name of the App component that generated the message
     * @param {('init'|'panic'|'update'|'tone-on'|'tone-off')} cmd      - Command code of the message
     * @param {tonetype=}                                      type     - The tone typeto which the message is directed; FT or HT
     * @param {xtnum=}                                         xtNum    - The FT or HT number
     * @param {velocity=}                                      velocity - The intensity of the sound to be generated in MIDI velocity format.<br>
     *                                                                    If the `cmd` is 'tone-on' , the values must be from 1 to 127.<br>
     *                                                                    If the `cmd` is 'tone-off' , the values must be from 0 to 127.<br>
     * @param {midinnum=}                                      ctrlNum  - The MIDI Note Number corresponding to the FT or HT on the keymap (if present).<br>
     *                                                                    If it is not provided, the Apps that need this information should ignore the message.
     * @param {boolean=}                                       piper    - If the message is generated by the Piper feature
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
     * @return {Array.<number>} - A new instance of DHCmsg
     */
    static init(source) {
        return new HUM.DHCmsg(source, 'init');
    }
    /**
     * Create a new 'panic' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {Array.<number>} - A new instance of DHCmsg
     */
    static allNotesOff(source) {
        return new HUM.DHCmsg(source, 'panic');
    }
    /**
     * Create a new 'update FT' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {Array.<number>} - A new instance of DHCmsg
     */
    static ftUpd(source) {
        return new HUM.DHCmsg(source, 'update', 'ft');
    }
    /**
     * Create a new 'update HT' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {Array.<number>} - A new instance of DHCmsg
     */
    static htUpd(source) {
        return new HUM.DHCmsg(source, 'update', 'ht');
    }
    /**
     * Create a new 'update Controller Keymap' DHCmsg
     *
     * @param {string} source - Name of the App component that generated the message
     *
     * @return {Array.<number>} - A new instance of DHCmsg
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
     * @return {Array.<number>} - A new instance of DHCmsg
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
     * @param {string}    source   - Name of the App component that generated the message
     * @param {xtnum}    xtNum    - The HT number
     * @param {velocity} velocity - The intensity of the sound to be generated in MIDI velocity format, from 1 to 127.<br>
     * @param {midinnum=} ctrlNum  - The MIDI Note Number corresponding to the HT on the keymap (if present)
     * @param {boolean=}  piper    - If the message is generated by the Piper feature
     * @param {boolean=}  tsnap    - If the message has been converted by the Tone-Snap receiving mode
     * 
     * @return {Array.<number>} - A new instance of DHCmsg
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
     * @return {Array.<number>} - A new instance of DHCmsg
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
     * @return {Array.<number>} - A new instance of DHCmsg
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
     * @return {Array.<number>} - A copy of the original DHCmsg
     */
    static copyOFF(dhcMsg) {
        return new HUM.DHCmsg(dhcMsg.source, 'tone-off', dhcMsg.type,
            dhcMsg.xtNum,
            dhcMsg.velocity,
            dhcMsg.ctrlNum,
            dhcMsg.piper,
            dhcMsg.panic);
    }
};
