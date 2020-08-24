 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2018 by Walter Mantovani (http://armonici.it).
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

/**
 * @fileoverview DYNAMIC HARMONICS CALCULATOR<br>
 *     This is the heart of the program.
 *     All frequency/midi.cent tables are computed here.
 *
 * @author Walter Mantovani < armonici.it [at] gmail [dot] com >
 */

"use strict";

/**
 * MAIN DHC OBJECT
 * Holds settings and other useful data
 * 
 * @namespace icDHC
 */
var icDHC = {
    /**
     * DHC Settings
     * 
     * @namespace icDHC.settings
     * @memberof! icDHC
     */
    settings: {
        /**
         * Global settings
         * 
         * @memberof icDHC.settings
         *
         * @type     {Object}
         *
         * @property {number}                      hz_accuracy   - Number of decimal places (on UI) for numbers expressed in hertz (Hz)
         * @property {number}                      cent_accuracy - Number of decimal places (on UI) for numbers expressed in cents
         * @property {('sharp'|'flat'|'relative')} enharmonic_nn - Enharmonic note naming; 'sharp' for [#], 'flat' for [b] or "relative" for [#/b]
         * @property {number}                      middle_c      - Middle C octave (-1 = from octave -1 >> Middle C = 60) - Starting octave
         */
        global: {
            hz_accuracy: 2,
            cent_accuracy: 0,
            // @todo - Enharmonic note naming
            enharmonic_nn: "sharp",
            middle_c: -1
        },
        /**
         * Controller settings
         * 
         * @memberof icDHC.settings
         *
         * @type     {Object}
         *
         * @property {Object}                                             pb                  - Controller's Pitch Bend settings
         * @property {number}                                             pb.range            - Range value in cents (use hundreds when use MIDI-OUT and the same as the instrument)
         * @property {number}                                             pb.amount           - Current input controller pitchbend amount; default amount is always 0
         * @property {('keymap'|'tsnap-channel'|'tsnap-divider')}         receive_mode        - FT/HT controller note receiving mode
         * @property {Object}                                             tsnap               - Tone snapping receiving mode settings
         * @property {number}                                             tsnap.tolerance     - 
         * @property {number}                                             tsnap.divider       - 
         * @property {Object}                                             tsnap.channel       - 
         * @property {number}                                             tsnap.channel.ft    - 
         * @property {number}                                             tsnap.channel.ht    - 
         * @property {Object}                                             notes_on            - 
         * @property {Object.<number, MIDIinNoteOn>}                      notes_on[0-15]      - 
         */
        controller: {
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
                    ht: 0
                }
            },
            notes_on: {
                /**
                 * @todo: docstings
                 * MIDI note number from external input controller
                 * 
                 * @typedef  {Object} MIDIinNoteOn
                 * 
                 * {
                 *     channel: {
                 *         external: {
                 *             keymapped: <number>,
                 *             midievent: <midievent>
                 *     }
                 * }
                 */
                0: {},
                1: {},
                2: {},
                3: {},
                4: {},
                5: {},
                6: {},
                7: {},
                8: {},
                9: {},
                10: {},
                11: {},
                12: {},
                13: {},
                14: {},
                15: {}
            }
        },
        /**
         * Port settings for MIDI-OUT tuning methods; each out port has its own settings
         * 
         * @typedef  {Object} MIDIoutSettings
         *
         * @property {Object}                       mts                      - MIDI Tuning Standard method settings
         * @property {Object}                       pb                       - Pitch Bend method settings
         * @property {Object}                       pb.channels              - FTs & HTs multichannel polyphony management
         * @property {Object}                       pb.channels.ft           - Multichannel polyphony for FTs
         * @property {Array.<number>}               pb.channels.ft.used      - Sorted array containing the FT used channel numbers
         * @property {Object.<number, HeldChannel>} pb.channels.ft.held      - Object containing the FT busy channel; key is the original Controller MIDI Note number
         * @property {number}                       pb.channels.ft.last      - Number of the last held FT channel
         * @property {Object}                       pb.channels.ht           - Multichannel polyphony for HTs
         * @property {Array.<number>}               pb.channels.ht.used      - Sorted array containing the HT used channel numbers
         * @property {Object.<number, HeldChannel>} pb.channels.ht.held      - Object containing the HT busy channels; keys are the original Controller MIDI Note number
         * @property {Array.<number>}               pb.channels.ht.heldOrder - Array of channel numbers, sorted according to the held order
         * @property {number}                       pb.channels.ht.last      - Number of the last held HT channel
         * @property {Object}                       pb.range                 - PitchBend sensitivity
         * @property {number}                       pb.range.ft              - PitchBend sensitivity for FT channels
         * @property {number}                       pb.range.ht              - PitchBend sensitivity for HT channels
         * @property {Object}                       pb.delay                 - Delay between the PitchBend and Note-ON messages
         * @property {number}                       pb.delay.ft              - Delay for FT channels (milliseconds)
         * @property {number}                       pb.delay.ht              - Delay for HT channels (milliseconds)
         * @property {Object}                       pb.voicestealing         - Voice stealing management ON/OFF (now stealing is always ON)
         * @property {boolean}                      pb.voicestealing.ft      - Voice stealing ON/OFF for FT channels
         * @property {boolean}                      pb.voicestealing.ht      - Voice stealing ON/OFF for HT channels
         * @property {boolean}                      pb.gm                    - General MIDI ON/OFF (when 'true', avoid channel 10)
         * @property {('pb'|'mts')}                 selected                 - Selected MIDI-OUT Tuning Method for this port; 'pb' is PitchBend method, 'mts' is MIDI Tuning Standard method
         */
        /**
         * Default settings for MIDI-OUT tuning methods; Object inside is {{@link MIDIoutSettings}}
         * 
         * @memberof icDHC.settings
         *
         * @type {MIDIoutSettings}
         */
        instrument: {
            mts: {}, // @todo - MIDI Tuning Standard method
            pb: {
                channels: {
                    ft: {
                        used:[0, 1, 2],
                        held: {},
                        last: -1
                    },
                    ht: {
                        used:[3, 4, 5, 6, 7],
                        held: {},
                        heldOrder: [],
                        last: -1
                    }
                },
                range: {
                    ft: 2,
                    ht: 2
                },
                delay: {
                    ft: 5,
                    ht: 5
                },
                voicestealing: { // @todo - Voice stealing management ON/OFF
                    ft: true,
                    ht: true
                },
                gm: undefined
            },
            selected: "pb"
        },
        /**
         * Fundamental Mother (FM) settings
         * 
         * @memberof icDHC.settings
         *
         * @type     {Object}
         *
         * @property {number} hz   - Frequency expressed in hertz (Hz)
         * @property {number} mc   - Frequency expressed in midi.cents (mc)
         * @property {string} init - What unit to use to initialize; 'hz' or 'mc'
         */
        fm: {
            hz: 130.812782650299,
            mc: 48,
            init: "mc"
        },
        /**
         * Fundamental Tones (FTs) scale tuning method settings
         * 
         * @namespace icDHC.settings.ft
         * @memberof! icDHC.settings
         */
        ft: {
            /**
             * Equal Temperament
             * 
             * @memberof icDHC.settings.ft
             *
             * @type     {Object}
             *
             * @property {number} unit     - The ratio to divide
             * @property {number} division - The equal divisions
             */            
            nEDx: {
                unit: 2,
                division: 12
            },
            /**
             * Harmonics and subharmonics
             * 
             * @namespace icDHC.settings.ft.h_s
             * @memberof! icDHC.settings.ft
             */  
            h_s: {
                /**
                 * Natural (no transposition)
                 * 
                 * @memberof icDHC.settings.ft.h_s
                 *
                 * @type     {Object}
                 *
                 * @property {TransposeRatio} h_tr - Transpose ratio in decimal for Harmonics
                 * @property {TransposeRatio} s_tr - Transpose ratio in decimal for Subharmonics
                 */  
                natural: {
                    /**
                     * Transpose ratio
                     * <ul>
                     * <li>2, 4, 8, 16... for octaves up </li>
                     * <li>0.5, 0.25, 0.125, 0.0625... for octaves down </li>
                     * <li>1 to not transpose </li>
                     * </ul>
                     *
                     * @typedef {number} TransposeRatio
                     */
                    h_tr: 1,
                    s_tr: 16
                },
                /**
                 * Same octave transposition
                 * 
                 * @memberof icDHC.settings.ft.h_s
                 *
                 * @type     {Object}
                 *
                 * @property {TransposeRatio} h_tr - Transpose ratio in decimal for Harmonics
                 * @property {TransposeRatio} s_tr - Transpose ratio in decimal for Subharmonics
                 */  
                sameOctave: {
                    h_tr: 1,
                    s_tr: 2
                },
                /**
                 * Default/current sub-method selected
                 * 
                 * @memberof icDHC.settings.ft.h_s
                 *
                 * @type {('natural'|'sameOctave')}
                 */ 
                selected: "sameOctave"
            },
            /**
             * Tuning files (currently not used)
             * 
             * @namespace icDHC.settings.ft.file
             * @memberof! icDHC.settings.ft
             * 
             * @todo - Tuning file formats
             */ 
            file: {
                scl: {},
                tun: {},
                mtx: {},
                lmso: {},
                selected: "scl"
            },
            /**
             * Default/current method selected
             * 
             * @memberof icDHC.settings.ft
             *
             * @type {('nEDx'|'h_s'|'file')}
             */ 
            selected: "nEDx",
            /**
             * +/- Steps for ft_table
             *
             * @example
             * 'steps' to final range: MIDI Note number range considerations<br>
             * 32 = -32 > +32 : (old default: I think +-64 is too wide, but let's try)<br>
             * 64 = -64 > +64 : FM = midi#63 or midi#64 to use the full MIDI note range<br>
             * ( midi#63 out of range on -1  )<br>
             * ( midi#64 out of range on 128 )
             * 
             * @memberof icDHC.settings.ft
             *
             * @type {number}
             */ 
            steps: 64
        },
        /**
         * Harmonic/subharmonic Tones (HTs) scale tuning settings
         * 
         * @namespace icDHC.settings.ht
         * @memberof! icDHC.settings
         */
        ht: {
            /**
             * Harmonics and subharmonics transpose
             * 
             * @memberof icDHC.settings.ht
             *
             * @type {Object}
             * 
             * @property {TransposeRatio} h - Transpose ratio in decimal for Harmonics
             * @property {TransposeRatio} s - Transpose ratio in decimal for Subharmonics
             */
            transpose: {
                h: 1,
                s: 16
            },
            /**
             * The current FT (that generated the last HT table); init value must be 0
             * 
             * @memberof icDHC.settings.ht
             *
             * @type {number}
             */
            curr_ft: 0,
            /**
             * The last pressed HT; init value must be null
             * 
             * @memberof icDHC.settings.ht
             *
             * @type {number}
             */
            curr_ht: null
        }
    },
    /**
     * DHC Tables
     * 
     * @namespace icDHC.tables
     * @memberof! icDHC
     */
    tables: {
        /**
         * The current Controller Keymap
         * 
         * @memberof icDHC.tables
         *
         * @type {CtrlKeymap}
         */
        ctrl_map: {},             // PD {ctrl_fn}

        /**
         * A FT or HT relative tone (used in ft_table ht_table)
         * 
         * @typedef {Object} Xtone
         *
         * @property {number} hz - Frequency expressed in hertz (Hz)
         * @property {number} mc - MIDI note number expressed in midi.cents
         */

        /**
         * The current Fundamental Tones Table
         * 
         * @memberof icDHC.tables
         *
         * @type {Object.<number, Xtone>}
         */
        ft_table: {},             // PD {ff_table}
        /**
         * The current Harmonic/Subharmonic Tones table
         * 
         * @memberof icDHC.tables
         *
         * @type {Object.<number, Xtone>}
         */
        ht_table: {},             // PD {hf_table} & {sf_table}


        /**
         * TODO
         * 
         * @memberof icDHC.tables
         *
         * @type {Object.<number, number>}
         */
        reverse_ft_table: {},
        reverse_ht_table: {},


        // @todo - Tables for MTS MIDI-OUT tuning method
        // inst_map: {},             // PD {inst_fn}
        // inst_table: {},           // PD {inst_table}
        // inst_usedkeys: null,      // PD {used_keys}
        // inst_mtsbank_table: null, // PD {bulk-tuning-dump}

        /**
         * Queue for FT key-press tracking
         * 
         * @memberof icDHC.tables
         *
         * @type {Array.<Array.<number>>}
         */
        ftKeyQueue: []
    }
};

/*==============================================================================*
 * CORE INITS
 *==============================================================================*/
 
// Init the app
window.onload = icInit;

/**
 * Inits each section of the app
 */
function icInit() {
    // Set defaults value on the UI
    icUIinit();
    // Init the Keyboard UI controllers
    icKeyboardUIinit();
    // Initialize the controller keymap presets
    icKeymapsUIinit();
    // Create the HStack
    icHSTACKcreate();
    // Initialize the DHC
    icDHCinit();
    // Initialize the synth
    icSYNTHinit();
    icUTILSinit();
}

/**
 * Init function for (re)initialize the tables
 */
function icDHCinit() {
    // If the FM 'init' value is 'mc'
    if (icDHC.settings.fm.init === "mc") {
        // Init th FM from the MIDI FM value on the UI
        icDHC.settings.fm.hz = icGetFM("mc");
     // If the FM 'init' value is 'hz'
    } else if (icDHC.settings.fm.init === "hz") {
        // Init th FM from the Hz FM value on the UI
        icDHC.settings.fm.hz = icGetFM("hz");
    }
    // Create FT & HT tables
    icTablesCreate();
}

/**
 * (Re)create FT & HT tables in the right order
 */
function icTablesCreate() {
    // Create the FT tables
    let ft_tables = icFTtableCreate();
    icDHC.tables.ft_table = ft_tables['table'];
    icDHC.tables.reverse_ft_table = ft_tables['reverse_table'];
    // Create the HT tables on the current FT
    let ht_tables = icHTtableCreate(icDHC.tables.ft_table[icDHC.settings.ht.curr_ft].hz);
    icDHC.tables.ht_table = ht_tables['table'];
    icDHC.tables.reverse_ht_table = ht_tables['reverse_table'];
    // Update the frequency on the internal reference Synth
    icUpdateSynthFTfrequency();
    icUpdateSynthHTfrequency();
    // Resend (repress) all the MIDI Note-ON currently pending
    icUpdateMIDInoteON("ft");
    icUpdateMIDInoteON("ht");
    // Update the UI Monitors
    icMONITORSinit();
}

/**
 * Update the UI with default FT0 (FM), its HStack and the last HT pressed (if present)
 */
function icMONITORSinit() {
    // Compile the FM monitors
    icPrintFundamentalMother(icDHC.settings.fm.hz, icDHC.settings.fm.mc);
    // Compile the FT monitors
    icDHCmonitor(icDHC.settings.ht.curr_ft, icDHC.tables.ft_table[icDHC.settings.ht.curr_ft], "ft");
    // If a HT has been already pressed
    if (icDHC.settings.ht.curr_ht) {
        // Compile the HT monitor
        icDHCmonitor(icDHC.settings.ht.curr_ht, icDHC.tables.ht_table[icDHC.settings.ht.curr_ht], "ht");
    }
    // Compile the HStack (in utils.js)
    icHSTACKfillin();
}

/*==============================================================================*
 * DHC TABLES CREATION
 *==============================================================================*/

/**
 * Build the fundamental frequencies table; called on Init and FM update
 *
 * @return {Object.<number, Xtone>} - The Fundamental Tone table
 */
function icFTtableCreate() {
    // Temp object
    let fundamentalsTable = {};
    let fundamentalsReverseTable = {};
    // Select current FT Tuning Systems
    switch (icDHC.settings.ft.selected) {
        // n-EDx EQUAL TEMPERAMENT
        case "nEDx":
            for (let i = -icDHC.settings.ft.steps; i <= icDHC.settings.ft.steps; i++) {
                let freq = icCompute_nEDx(i, icDHC.settings.ft.nEDx.unit, icDHC.settings.ft.nEDx.division, icDHC.settings.fm.hz);
                let midicents = icFtoM(freq);
                let ok_rev = false;
                fundamentalsTable[i] = { hz: freq, mc: midicents} ;
                // Insert in the reverse table only if present on the keymap
                for (let key of Object.keys(icDHC.tables.ctrl_map)) {
                    if (icDHC.tables.ctrl_map[key].ft === i) {
                        ok_rev = true;
                    }
                }
                if (ok_rev === true) {
                    fundamentalsReverseTable[midicents] = i;
                }
            }
            return {
                'table': fundamentalsTable,
                'reverse_table': fundamentalsReverseTable
            };
        // HARMONICS / SUBHARMONICS FT
        case "h_s":
            if (icDHC.settings.ft.h_s.selected === "natural") {
                // Compute the sub/harmonics naturally (NOT transposed to the Same Octave)
                for (let i = 1; i <= icDHC.settings.ft.steps; i++) {
                    let sFreq = icDHC.settings.fm.hz / i * icDHC.settings.ft.h_s.natural.s_tr;
                    let hFreq = icDHC.settings.fm.hz * i * icDHC.settings.ft.h_s.natural.h_tr;
                    let sMidicents = icFtoM(sFreq);
                    let hMidicents = icFtoM(hFreq);
                    let ok_rev_h = false;
                    let ok_rev_s = false;
                    fundamentalsTable[-i] = { hz: sFreq, mc: sMidicents } ;
                    fundamentalsTable[i] = { hz: hFreq, mc: hMidicents } ;
                    // Insert in the reverse table only if present on the keymap
                    for (let key of Object.keys(icDHC.tables.ctrl_map)) {
                        if (icDHC.tables.ctrl_map[key].ft === i) {
                            ok_rev_h = true;
                        }
                        if (icDHC.tables.ctrl_map[key].ft === -i) {
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
                fundamentalsTable[0] = { hz: icDHC.settings.fm.hz, mc: Number(icDHC.settings.fm.mc) };
                fundamentalsReverseTable[Number(icDHC.settings.fm.mc)] = 0;
            }
            if (icDHC.settings.ft.h_s.selected === "sameOctave") {
                // Compute the sub/harmonics all transposed to the Same Octave
                for (let i = 1; i <= icDHC.settings.ft.steps; i++) {
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
                    let hFreq = icDHC.settings.fm.hz * h_so_tr * icDHC.settings.ft.h_s.sameOctave.h_tr;
                    let sFreq = icDHC.settings.fm.hz * s_so_tr * icDHC.settings.ft.h_s.sameOctave.s_tr;
                    let sMidicents = icFtoM(sFreq);
                    let hMidicents = icFtoM(hFreq);
                    let ok_rev_h = false;
                    let ok_rev_s = false;
                    fundamentalsTable[-i] = { hz: sFreq, mc: sMidicents } ;
                    fundamentalsTable[i] = { hz: hFreq, mc: hMidicents } ;
                    // Insert in the reverse table only if present on the keymap
                    for (let key of Object.keys(icDHC.tables.ctrl_map)) {
                        if (icDHC.tables.ctrl_map[key].ft === i) {
                            ok_rev_h = true;
                        }
                        if (icDHC.tables.ctrl_map[key].ft === -i) {
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
                fundamentalsTable[0] = { hz: icDHC.settings.fm.hz, mc: Number(icDHC.settings.fm.mc) };
                fundamentalsReverseTable[Number(icDHC.settings.fm.mc)] = 0;
            }
            return {
                'table': fundamentalsTable,
                'reverse_table': fundamentalsReverseTable
            };
        // @todo - TUNING FILES FT
        case "file":
            break;
    }
}

/**
 * Build the (Sub)Harmonic tones table
 * Destination is 'icDHC.tables.ht_table'
 * 
 * @param  {number} fundamental     - The tone on which to build the table expressed in hertz (Hz)
 * 
 * @return {Object.<number, Xtone>} - The Harmonic Tone table
 */
function icHTtableCreate(fundamental) {
    // @todo - Implement custom H/S table length (16>32>64>128) to increase performances if needed
    let harmonicsTable = {};
    let harmonicsReverseTable = {};
    for (let i = -128; i < 0; i++) {
        let freq = fundamental / -i * icDHC.settings.ht.transpose.s;
        let midicents = icFtoM(freq);
        harmonicsTable[i] = { hz: freq, mc: midicents };
        harmonicsReverseTable[midicents] = i;
    }
    for (let i = 1; i < 129; i++) {
        let freq = fundamental * i * icDHC.settings.ht.transpose.h;
        let midicents = icFtoM(freq);
        harmonicsTable[i] = { hz: freq, mc: midicents };
        harmonicsReverseTable[midicents] = i;
    }
    return {
        'table': harmonicsTable,
        'reverse_table': harmonicsReverseTable,
    };
}

/**
 * @todo - BUILD THE INSTRUMENT TABLE {inst_table} for MTS
 * Destination is 'icDHC.tables.inst_table'
 */

/*==============================================================================*
 * GENERAL DHC COMPUTING TOOLS
 *==============================================================================*/

/**
 * From MIDI note number to frequency (Hz)
 * @param  {number} midicent - MIDI note number expressed in midi.cents
 * 
 * @return {number}          - Frequency expressed in hertz (Hz)
 */
function icMtoF(midicent) {
    // Use the icCompute_nEDx() function to get frequency
    return icCompute_nEDx(midicent - 69, 2, 12, 440);
}

/**
 * From frequency (Hz) to MIDI note number
 * @param  {number} freq - Frequency expressed in hertz (Hz)
 * 
 * @return {number}      - MIDI note number expressed in midi.cents
 */
function icFtoM(freq) {
    let midicent = 69 + 12 * Math.log2(freq / 440);
    // Return full accuracy midicent
    return midicent;
}

/**
 * Calculate the n-EDx ("free" equal temperament) of a relative tone
 *
 * @param  {number} relativeTone - Relative number of the "step" in the scale
 * @param  {number} unit         - Ratio unit
 * @param  {number} division     - Equal divisions of the ratio unit
 * @param  {number} masterTuning - Reference frequency expressed in hertz (Hz)
 * 
 * @return {number}              - Frequency expressed in hertz (Hz)
 */
function icCompute_nEDx(relativeTone, unit, division, masterTuning) {
    let frequency = Math.pow(unit, relativeTone / division) * masterTuning;
    // Return full accuracy frequency
    return frequency;
}

/*==============================================================================*
 * FM UI tools
 *==============================================================================*/

/**
 * Get the Fundamental Mother (FM) from the UI
 *
 * @param  {('midicents'|'hz')} method - Method to use to get the FM
 *
 * @return {number}                    - Frequency expressed in hertz (Hz)
 */
function icGetFM(method) {
    var fm = null;
    var freq = null;
    var midicents = null;
    switch (method) {
        case "mc":
            fm = document.getElementById("HTMLi_fm_mc").value;
            midicents = fm;
            freq = icMtoF(fm);
            // Store the midi.cents value
            icDHC.settings.fm.mc = fm;
            break;
        case "hz":
            fm = document.getElementById("HTMLi_fm_hz").value;
            midicents = icFtoM(fm);
            // Store the midi.cents value
            icDHC.settings.fm.mc = midicents;
            freq = fm;
            break;
    }
    // Change the 'init' for eventual icDHCinit
    icDHC.settings.fm.init = method;
    // Return the frequency on the FM (Hz)
    return freq;
}

/**
 * Print the Fundamental Mother (FM) data to the UI (monitor)
 *
 * @param {number} freq      - Frequency expressed in hertz (Hz)
 * @param {number} midicents - MIDI note number expressed in midi.cents
 */
function icPrintFundamentalMother(freq, midicents){
    // Prepare the array to pass to the icArrayPitchbender
    let arr = {
        hz: Number(freq),
        mc: Number(midicents)
    };
    // Apply the controller pitchbend (if present) to the array
    let bentArray = icArrayPitchbender(arr);
    // Print the FM infos on the UI
    var notename = icGetNoteNameCents(bentArray.mc);
    document.getElementById("HTMLo_fm_mc").innerHTML = bentArray.mc.toFixed(icDHC.settings.global.cent_accuracy + 2) + " = " + notename[0] + " " + notename[2] + notename[1] + "&cent;";
    document.getElementById("HTMLo_fm_hz").innerHTML = bentArray.hz.toFixed(icDHC.settings.global.hz_accuracy);
}

/**
 * Set the Fundamental Mother (FM) got from the UI
 *
 * @param {number} freq - Frequency expressed in hertz (Hz)
 */
function icSetFM(freq) {
    // Store the FM to the global variable
    icDHC.settings.fm.hz = freq;
    // Recreate all tables
    icTablesCreate();
}

/*==============================================================================*
 * FT UI tools
 *==============================================================================*/

/**
 * Switch the FT TUNING SYSTEM (called when UI is updated)
 *
 * @param {('nedx'|'hs')}             sys    - FTs tuning method; 'nedx' (equal temperament) or 'hs' (harm/subharm)
 * @param {('natural'|'sameOctave')=} sys_hs - FTs Harm/Subharm tuning method; 'natural' (no transposition) or 'sameOctave' (to the same octave)
 */
function icSwitchFTsys(sys, sys_hs) {
    let nedx = document.getElementById("HTMLf_ftNEDX");
    let hs = document.getElementById("HTMLf_ftHS");
        if (sys === "nedx") {
            nedx.style.display = "initial";
            hs.style.display = "none";
            icDHC.settings.ft.selected = "nEDx";
        } else if (sys === "hs") {
            nedx.style.display = "none";
            hs.style.display = "initial";
            icDHC.settings.ft.selected = "h_s";
            if (sys_hs === "natural") {
                icDHC.settings.ft.h_s.selected = "natural";
                document.getElementById("HTMLo_ftHStranspose_h_ratio").innerHTML = icDHC.settings.ft.h_s.natural.h_tr;
                document.getElementById("HTMLo_ftHStranspose_s_ratio").innerHTML = icDHC.settings.ft.h_s.natural.s_tr;
            } else if (sys_hs === "sameOctave") {
                icDHC.settings.ft.h_s.selected = "sameOctave";
                document.getElementById("HTMLo_ftHStranspose_h_ratio").innerHTML = icDHC.settings.ft.h_s.sameOctave.h_tr;
                document.getElementById("HTMLo_ftHStranspose_s_ratio").innerHTML = icDHC.settings.ft.h_s.sameOctave.s_tr;
            }
        }
    icTablesCreate();
    icUpdateKeymapPreset();
}

/**
 * Set the nEDx (called when UI is updated)
 */
function icSetNEDX() {
    icDHC.settings.ft.nEDx.unit = document.getElementById("HTMLi_ftNEDX_unit").value;
    icDHC.settings.ft.nEDx.division = document.getElementById("HTMLi_ftNEDX_division").value;
    // Recreate all tables
    icTablesCreate();
}

/**
 * Transpose FT (sub)harmonics (called when UI is updated)
 *
 * @param {number} ratio - The ratio
 * @param {string} type  - The type
 */
function icFThsTranspose(ratio, type) {
    if (icDHC.settings.ft.h_s.selected === "natural") {
        icDHC.settings.ft.h_s.natural[type+"_tr"] *= ratio;
        document.getElementById("HTMLo_ftHStranspose_"+type+"_ratio").innerHTML = icDHC.settings.ft.h_s.natural[type+"_tr"];
    } else if (icDHC.settings.ft.h_s.selected === "sameOctave") {
        icDHC.settings.ft.h_s.sameOctave[type+"_tr"] *= ratio;
        document.getElementById("HTMLo_ftHStranspose_"+type+"_ratio").innerHTML = icDHC.settings.ft.h_s.sameOctave[type+"_tr"];
    }
    icTablesCreate();
}

/*==============================================================================*
 * HT UI tools
 *==============================================================================*/

/**
 * Transpose HT (sub)harmonics (called when UI is updated)
 *
 * @param  {number}    ratio  - The ratio with which to compute the transposition
 * @param  {('h'|'s')} type   - Type of transposition; 'h' for harmonics or 's' for subharmonics
 * @param  {boolean}   octave - If it's an octave transposition or not
 */
function icHTtranspose(ratio, type, octave) {
    // If it's an octave transpose
    if (octave === true) {
        // Multiply the current transpose ratio by the input ratio
        icDHC.settings.ht.transpose[type] *= ratio;
        // Update the new computed transpose ratio to the UI
        document.getElementById("HTMLi_htTranspose_"+type+"_ratio").value = icDHC.settings.ht.transpose[type];
    } else if (octave === false) {
        // Check if the ratio is > 0
        if (ratio > 0) {
            // Set the new transpose ratio
            icDHC.settings.ht.transpose[type] = ratio;
        // If it's not, restore the last valid ratio
        } else {
            document.getElementById("HTMLi_htTranspose_"+type+"_ratio").value = icDHC.settings.ht.transpose[type];
            // Stop executing the rest of the function
            return;
        }
    }
    // Recreate the HT table on the last FT
    let ht_tables = icHTtableCreate(icDHC.tables.ft_table[icDHC.settings.ht.curr_ft].hz);
    icDHC.tables.ht_table = ht_tables['table'];
    icDHC.tables.reverse_ht_table = ht_tables['reverse_table'];
    // Update the current HTs osc frequencies on Synth
    icUpdateSynthHTfrequency();
    // Resend (repress) all the MIDI Note-ON currently pending
    icUpdateMIDInoteON("ht");
    // Update the UI: Compile the HStack
    icHSTACKfillin();
}

/*==============================================================================*
 * MIDI UI tools
 *==============================================================================*/

/**
 * Switch the MIDI INPUT RECEIVING MODE (called when UI is updated)
 *
 * @param {('keymap'|'tsnap-channel'|'tsnap-divider')}      receive_mode    - FT/HT controller note receiving mode
 */
function icSwitchMidiReceiveMode(receive_mode) {
    let tsnap_tolerance = document.getElementById("HTMLf_midiReceiveModeTsnapTolerance");
    let tsnap_chan = document.getElementById("HTMLf_midiReceiveModeTsnapChan");
    let tsnap_divider = document.getElementById("HTMLf_midiReceiveModeTsnapDivider");
    if (receive_mode === "keymap") {
        tsnap_tolerance.style.display = "none";
        tsnap_chan.style.display = "none";
        tsnap_divider.style.display = "none";
    } else if (receive_mode === "tsnap-channel") {
        tsnap_tolerance.style.display = "table-row";
        tsnap_chan.style.display = "table-row";
        tsnap_divider.style.display = "none";
    } else if (receive_mode === "tsnap-divider") {
        tsnap_tolerance.style.display = "table-row";
        tsnap_chan.style.display = "none";
        tsnap_divider.style.display = "table-row";
    } else {
        let error = "The 'HTMLi_midiReceiveMode' HTML element has an unexpected value: " + receive_mode;
        throw error;
    }
}

/*==============================================================================*
 * DHC UI INITS
 *==============================================================================*/

/**
 * Initialize the DHC UI
 */
function icUIinit() {

    /*  UI DEFAULT SETTINGS
     * ====================*/

    // Default UI FM
    if (icDHC.settings.fm.init === "mc") {
        // If the FM 'init' value is 'mc'
        // Set UI midicents FM from icDHC.settings.fm.mc
        document.getElementById("HTMLi_fm_mc").value = icDHC.settings.fm[icDHC.settings.fm.init];
    } else if (icDHC.settings.fm.init === "hz") {
        // If the FM 'init' value is 'hz'
        // Set UI Hz FM from icDHC.settings.fm.hz
        document.getElementById("HTMLi_fm_hz").value = icDHC.settings.fm[icDHC.settings.fm.init];
    } else {
        console.log("The 'icDHC.settings.fm.init' attribute has an unexpected value: " + icDHC.settings.fm.init);
    }
    // Default FT nED-x on UI textboxes
    document.getElementById("HTMLi_ftNEDX_unit").value = icDHC.settings.ft.nEDx.unit;
    document.getElementById("HTMLi_ftNEDX_division").value = icDHC.settings.ft.nEDx.division;
    // Default HT TRANSPOSE on UI textboxes
    document.getElementById("HTMLi_htTranspose_h_ratio").value = icDHC.settings.ht.transpose.h;
    document.getElementById("HTMLi_htTranspose_s_ratio").value = icDHC.settings.ht.transpose.s;
    // Default DHC SETTINGS on UI textboxes
    document.getElementById("HTMLi_dhc_hzAccuracy").value = icDHC.settings.global.hz_accuracy;
    document.getElementById("HTMLi_dhc_mcAccuracy").value = icDHC.settings.global.cent_accuracy;
    document.getElementById("HTMLi_dhc_middleC").value = icDHC.settings.global.middle_c + 5;
    document.getElementById("HTMLi_dhc_pitchbendRange").value = icDHC.settings.controller.pb.range;
    document.getElementById("HTMLi_dhc_piperSteps").value = icPipe.maxLenght;
    // Default MIDI SETTINGS on UI textboxes
    document.getElementById("HTMLi_midiReceiveMode").value = icDHC.settings.controller.receive_mode;
    document.getElementById("HTMLi_midiReceiveModeTsnapTolerance").value = icDHC.settings.controller.tsnap.tolerance;
    document.getElementById("HTMLi_midiReceiveModeTsnapDivider").value = icDHC.settings.controller.tsnap.divider;
    document.getElementById("HTMLi_midiReceiveModeTsnapChanFT").value = icDHC.settings.controller.tsnap.channel.ft;
    document.getElementById("HTMLi_midiReceiveModeTsnapChanHT").options[icDHC.settings.controller.tsnap.channel.ft].disabled = true;
    document.getElementById("HTMLi_midiReceiveModeTsnapChanHT").value = icDHC.settings.controller.tsnap.channel.ht;
    document.getElementById("HTMLi_midiReceiveModeTsnapChanFT").options[icDHC.settings.controller.tsnap.channel.ht].disabled = true;

    /*  UI EVENT LISTENERS
     * ====================*/

    //------------------------
    // UI GENERAL DHC settings
    //------------------------
    // Set the UI HZ DECIMAL PRECISION from UI HTML inputs
    document.getElementById("HTMLi_dhc_hzAccuracy").addEventListener("input", (event) => {
        // Store the Hz accuracy in the global slot
        icDHC.settings.global.hz_accuracy = Number(event.target.value);
        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
        icDHCinit();
    });
    // Set the UI MIDI.CENTS DECIMAL PRECISION from UI HTML inputs
    document.getElementById("HTMLi_dhc_mcAccuracy").addEventListener("input", (event) => {
        // Store the mc accuracy in the global slot
        icDHC.settings.global.cent_accuracy = Number(event.target.value);
        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
        icDHCinit();
    });
    // Set the MIDDLE C OCTAVE from UI HTML inputs
    document.getElementById("HTMLi_dhc_middleC").addEventListener("input", (event) => {
        // Beginning octave = Middle C octave - 5   (-1 => C4)
        icDHC.settings.global.middle_c = event.target.value - 5;
        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
        icDHCinit();
    });
    // Set the CONTROLLER PITCHBEND RANGE from UI HTML inputs
    document.getElementById("HTMLi_dhc_pitchbendRange").addEventListener("input", (event) => {
        icDHC.settings.controller.pb.range = event.target.value;
    });
    // Set the PIPER HT0 FEATURE from UI HTML inputs
    document.getElementById("HTMLi_dhc_piperSteps").addEventListener("input", (event) => {
        icPipe.maxLenght = event.target.value;
    });

    //------------------------
    // UI MIDI settings
    //------------------------
    // Set the FT/HT NUMBER RECEIVING MODE from UI HTML inputs
    document.getElementById("HTMLi_midiReceiveMode").addEventListener("change", (event) => {
        icDHC.settings.controller.receive_mode = event.target.value;
        icSwitchMidiReceiveMode(event.target.value);
    });
    document.getElementById("HTMLi_midiReceiveModeTsnapTolerance").addEventListener("input", (event) => {
        icDHC.settings.controller.tsnap.tolerance = event.target.value;
    });
    document.getElementById("HTMLi_midiReceiveModeTsnapDivider").addEventListener("input", (event) => {
        icDHC.settings.controller.tsnap.divider = event.target.value;
    });
    document.getElementById("HTMLi_midiReceiveModeTsnapChanFT").addEventListener("change", (event) => {
        if (event.target.value == icDHC.settings.controller.tsnap.channel.ht) {
            throw "FT and HT cannot share the same MIDI channel!"
        } else {
            let ht_channels = document.getElementById("HTMLi_midiReceiveModeTsnapChanHT");
            for (let opt of ht_channels) { 
                opt.disabled = false;
            }
            ht_channels.options[event.target.value].disabled = true;
            icDHC.settings.controller.tsnap.channel.ft = event.target.value;
        }
    });
    document.getElementById("HTMLi_midiReceiveModeTsnapChanHT").addEventListener("change", (event) => {
        if (event.target.value == icDHC.settings.controller.tsnap.channel.ft) {
            throw "FT and HT cannot share the same MIDI channel!"
        } else {
            let ft_channels = document.getElementById("HTMLi_midiReceiveModeTsnapChanFT");
            for (let opt of ft_channels) { 
                opt.disabled = false;
            }
            ft_channels.options[event.target.value].disabled = true;
            icDHC.settings.controller.tsnap.channel.ht = event.target.value;
        }
    });
    // Set default FT/HT NUMBER RECEIVING MODE after the UI widgets are set-up
    icSwitchMidiReceiveMode(icDHC.settings.controller.receive_mode);

    //-------------------
    // UI FM DHC settings
    //-------------------
    // Set the Fundamental Mother (FM) from UI HTML inputs
    document.getElementById("HTMLi_fm_mc").addEventListener("change", () => {
        icSetFM(icGetFM("mc"));
        document.getElementById("HTMLi_fm_hz").value = "";
    });
    document.getElementById("HTMLi_fm_hz").addEventListener("change", () => {
        icSetFM(icGetFM("hz"));
        document.getElementById("HTMLi_fm_mc").value = "";
    });

    //-------------------
    // UI FT DHC settings
    //-------------------
    // Set the RADIO BUTTONS for FT TUNING SYSTEM
    // Radio NEDX system
    document.getElementById("HTMLf_ftSys_NEDX").addEventListener("click", (event) => {
        if (event.target.checked) {
            icSwitchFTsys("nedx");
        }
    });
    // Radio HS Natural system
    document.getElementById("HTMLf_ftSys_HSnat").addEventListener("click", (event) => {
        if (event.target.checked) {
            icSwitchFTsys("hs", "natural");
        }
    });
    // Radio HS Transposed Same Octave system
    document.getElementById("HTMLf_ftSys_HStrans").addEventListener("click", (event) => {
        if (event.target.checked) {
            icSwitchFTsys("hs", "sameOctave");
        }
    });
    // Set default FT Tuning System after the radio buttons are set-up
    document.getElementById("HTMLf_ftSys_NEDX").click();
    // Get and set the FT NEDX UI HTML inputs
    document.getElementById("HTMLi_ftNEDX_unit").addEventListener("change", icSetNEDX);
    document.getElementById("HTMLi_ftNEDX_division").addEventListener("change", icSetNEDX);
    document.getElementById("HTMLi_ftNEDX_ok").addEventListener("click", icSetNEDX);

    // Get and set the FT HARM/SUBHARM UI HTML inputs
    // Harmonic Tones transposition
    // + Octave
    document.getElementById("HTMLi_ftHStranspose_h_plus").addEventListener("click", () => {
        icFThsTranspose(2, "h");
    });
    // - Octave
    document.getElementById("HTMLi_ftHStranspose_h_minus").addEventListener("click", () => {
        icFThsTranspose(0.5, "h");
    });

    // Subharmonic Tones transposition
    // + Octave
    document.getElementById("HTMLi_ftHStranspose_s_plus").addEventListener("click", () => {
        icFThsTranspose(2, "s");
    });
    // - Octave
    document.getElementById("HTMLi_ftHStranspose_s_minus").addEventListener("click", () => {
        icFThsTranspose(0.5, "s");
    });

    //-------------------
    // UI HT DHC settings
    //-------------------
    // Get and set the HT UI HTML inputs
    // Harmonic Tones transposition
    // + Octave
    document.getElementById("HTMLi_htTranspose_h_plus").addEventListener("click", () => {
        icHTtranspose(2, "h", true);
    });
    // – Octave
    document.getElementById("HTMLi_htTranspose_h_minus").addEventListener("click", () => {
        icHTtranspose(0.5, "h", true);
    });
    // Free ratio
    document.getElementById("HTMLi_htTranspose_h_ratio").addEventListener("change", (event) => {
        icHTtranspose(event.target.value, "h", false);
    });

    // Subharmonic Tones transposition
    // + Octave
    document.getElementById("HTMLi_htTranspose_s_plus").addEventListener("click", () => {
        icHTtranspose(2, "s", true);
    });
    // – Octave
    document.getElementById("HTMLi_htTranspose_s_minus").addEventListener("click", () => {
        icHTtranspose(0.5, "s", true);
    });
    // Free ratio
    document.getElementById("HTMLi_htTranspose_s_ratio").addEventListener("change", (event) => {
        icHTtranspose(event.target.value, "s", false);
    });
}