/**
 * @fileoverview Parameters class for the Harmonicarium DHC.
 * This file defines the {@link HUM.DHC.prototype.Parameters|Parameters} class,
 * the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.DHC|DHC} instance (global display, FM, FT tuning systems, HT
 * transpositions, Piper, keymap, and accordion UI). It is split out from the
 * main {@link module:dhc} module.
 *
 * @module dhc-parameters
 * @memberof HUM.DHC
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

/**
 * Parameter container class for a {@link HUM.DHC} instance.
 *
 * @class
 * @memberof HUM.DHC
 *
 * @description
 * Instantiates and exposes all {@link HUM.Param} objects used by a
 * {@link HUM.DHC} instance. Parameters are grouped into namespaces:
 * - `global`: Display preferences (Hz/cent accuracy, enharmonic notation, middle C).
 * - `fm`: Fundamental Mother frequency input (Hz and midicent) and initialization mode.
 * - `ft`: Fundamental Tones tuning system selection and its sub-parameters
 *   (`nEDx`, `h_s.natural`, `h_s.sameOctave`, `file`).
 * - `ht`: Harmonic/Subharmonic Tones transposition ratios and last-played state.
 * - `piper`: Piper feature configuration (pipe length, queue, pipe, step counter).
 * - `keymap`: Controller keymap preset selection, file loading, and modal table display.
 * - `bsAccordion`: Bootstrap accordion scroll behaviour proxy.
 */
HUM.DHC.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given DHC.
     *
     * @param {HUM.DHC} dhc - The DHC instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects, configures their UI element
     * bindings, initial values, pre/post hooks, and IndexedDB keys.
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
         * Toggles the visibility of the FM mc row and BPM row in the UI to
         * match the current mode ('overtones' shows mc, 'polyrhythms' shows BPM).
         * Null-guarded so it is safe to call before the DOM is ready.
         *
         * @param {('overtones'|'polyrhythms')} mode - The target mode.
         */
        const _applyModeVisibility = (mode) => {
            const mcRow  = document.getElementById('HTMLf_fm_mc_row'  + dhc.id);
            const bpmRow = document.getElementById('HTMLf_fm_bpm_row' + dhc.id);
            if (!mcRow || !bpmRow) return;
            mcRow.style.display  = mode === 'polyrhythms' ? 'none' : '';
            bpmRow.style.display = mode === 'polyrhythms' ? ''     : 'none';
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
                    // Polyrhythm Mode allows FM down to 0.05 Hz (≈ 3 BPM).
                    const minHz = 0.05;
                    if (!Number.isFinite(value) || value < minHz) {
                        value = minHz;
                        thisParam.uiElements.in.fm_hz.value = minHz;
                    }
                    return value;
                },
                postSet: (value, thisParam, init) => {
                    // Detect a transition across the Polyrhythm Mode threshold
                    // (5 Hz). When crossing in either direction, silence all
                    // active voices and notify subscribers so they can re-render
                    // UI / swap output engines.
                    if (!init) {
                        const threshold = HUM.DHC.POLYRHYTHM_THRESHOLD_HZ;
                        const wasPoly = typeof thisParam._prevPolyrhythm === 'boolean'
                            ? thisParam._prevPolyrhythm
                            : false;
                        const isPoly = value < threshold;
                        if (wasPoly !== isPoly) {
                            dhc.panic();
                            dhc.sendMessageToApps(HUM.DHCmsg.modeUpd('dhc'));
                            // Sync the mode switch when the user crosses the
                            // threshold by typing Hz directly (not via the switch).
                            if (this.fm.mode) {
                                const newMode = isPoly ? 'polyrhythms' : 'overtones';
                                this.fm.mode._setValue(newMode, { postSet: false });
                                _applyModeVisibility(newMode);
                            }
                        }
                        thisParam._prevPolyrhythm = isPoly;
                        // Change the 'init' for eventual icDHCinit
                        this.fm.init.value = 'hz';
                    } else {
                        thisParam._prevPolyrhythm = value < HUM.DHC.POLYRHYTHM_THRESHOLD_HZ;
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
         * Selects the DHC operating mode: 'overtones' for harmonic/melodic use,
         * 'polyrhythms' for low-frequency rhythmic use (FM < 5 Hz).
         * Switching applies canonical FM defaults and loads matching DiphonicPad
         * range presets.
         *
         * @instance
         * @name mode
         * @memberof HUM.DHC#Parameters#fm
         * @type {HUM.Param}
         */
        this.fm.mode = new HUM.Param({
            app: dhc,
            idbKey: 'dhcFMmode',
            uiElements: {
                'fm_mode': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'change',
                    htmlTargetProp: 'value',
                    widget: 'selection',
                }),
            },
            dataType: 'string',
            initValue: 'overtones',
            allowedValues: ['overtones', 'polyrhythms'],
            postSet: (value, thisParam, init) => {
                // Always apply row visibility (also handles DB-restore case).
                _applyModeVisibility(value);
                if (!init) {
                    if (value === 'overtones') {
                        // Silence any active polyrhythm voices before switching.
                        if (dhc.polyrhythmMode) {
                            dhc.panic();
                        }
                        // Set FM to C3 (48 mc).
                        this.fm.mc._setValue(48);
                        // hz.postSet runs with init:true through the mc→hz chain
                        // and will NOT detect the threshold crossing, so we must
                        // explicitly notify subscribers.
                        dhc.sendMessageToApps(HUM.DHCmsg.modeUpd('dhc'));
                    } else { // polyrhythms
                        // Set FM to 2.5 Hz — threshold detection in hz.postSet
                        // handles panic + modeUpd when crossing from overtones.
                        this.fm.hz._setValue(2.5);
                        // Explicitly send modeUpd to guarantee DiphonicPad loads
                        // polyrhythm presets even when already in polyrhythm mode
                        // (no threshold crossing → hz.postSet won't send it).
                        dhc.sendMessageToApps(HUM.DHCmsg.modeUpd('dhc'));
                    }
                }
            },
        });

        /**
         * Allows the FM to be set by a value expressed in beats per minute (BPM).
         * Non-persistent: the BPM is always derived from fm.hz on load.
         *
         * @instance
         * @name bpm
         * @memberof HUM.DHC#Parameters#fm
         * @type {HUM.Param}
         */
        this.fm.bpm = new HUM.Param({
            app: dhc,
            idbKey: 'dhcFMbpm',
            uiElements: {
                'fm_bpm': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'change',
                    htmlTargetProp: 'value',
                    widget: 'number',
                }),
                'fm_bpm_monitor': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            dataType: 'float',
            initValue: false,
            presetStore: false,
            presetAutosave: false,
            presetRestore: false,
            postSet: (value, thisParam, init) => {
                if (!init && value > 0) {
                    this.fm.hz._setValue(value / 60);
                }
            },
        });

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
                    this.fm.mc._setValue(midicents, { init: true });
                    // if (!init) {
                        // Recreate all tables
                        dhc.initTables();
                    // }
                    this.fm.mc.uiElements.in.fm_mc.value = "";
                } else if (value === 'mc') {
                    let freq = dhc.constructor.mcToFreq(this.fm.mc.value);
                    this.fm.hz._setValue(freq, { init: true });
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
             * FT Tuning files method.
             *
             * Currently supports Scala `.scl` only; `.tun`, `.mtx`, `.lmso` are reserved
             * placeholders for future file-format parsers.
             *
             * @member {Object}
             * @namespace
             *
             * @property {string}   selected   - Sub-format identifier (`"scl"` for now).
             * @property {Object}   scl        - Scala (.scl) sub-container.
             * @property {HUM.Param} scl.data  - The parsed Scala scale object
             *                                   (`{description, noteCount, cents,
             *                                   period, sourceName, sourceText}`), or
             *                                   `null` when no file has been loaded.
             *                                   Stored in IndexedDB so the scale
             *                                   survives a session reload.
             * @property {HUM.Param} scl.file  - HTML proxy for the `<input type="file">`
             *                                   widget. Not persisted.
             * @property {Object}   tun        - Reserved for AnaMark `.tun` files.
             * @property {Object}   mtx        - Reserved for `.mtx` files.
             * @property {Object}   lmso       - Reserved for `.lmso` files.
             */
            file: {
                selected: "scl",
                scl: {
                    /**
                     * Parsed Scala scale object, or `null` when no file is loaded.
                     * Setting this property triggers a full FT-table rebuild via
                     * {@link HUM.DHC#initTables} and refreshes the info panel.
                     *
                     * @instance
                     * @member {HUM.Param}
                     */
                    data: new HUM.Param({
                        app: dhc,
                        idbKey: 'dhcFTfileSclData',
                        uiElements: {
                            'ftFileSclInfo': new HUM.Param.UIelem({
                                role: 'out',
                            })
                        },
                        dataType: 'object',
                        initValue: null,
                        init: false,
                        presetStore: true,
                        presetRestore: true,
                        postSet: (value, thisParam, init) => {
                            // Refresh the info panel in the FT accordion.
                            let infoElem = thisParam.uiElements.out.ftFileSclInfo;
                            if (infoElem) {
                                if (value && Array.isArray(value.cents) && value.cents.length > 0) {
                                    let desc = value.description ? value.description : '(no description)';
                                    infoElem.innerHTML =
                                        '<div><strong>File:</strong> ' + (value.sourceName || '—') + '</div>' +
                                        '<div><strong>Description:</strong> ' + desc + '</div>' +
                                        '<div><strong>Notes:</strong> ' + value.noteCount +
                                        ' &nbsp; <strong>Period:</strong> ' + value.period.toFixed(4) + ' ¢</div>';
                                } else {
                                    infoElem.innerText = 'No scale loaded.';
                                }
                            }
                            if (!init) {
                                dhc.initTables();
                            }
                        }
                    }),
                    /**
                     * Proxy `HUM.Param` for the Scala-file `<input type="file">` widget.
                     * Forwards the selected file to {@link HUM.DHC#readSclFile}.
                     *
                     * @instance
                     * @member {HUM.Param}
                     */
                    file: new HUM.Param({
                        app: dhc,
                        idbKey: 'dhcFTfileSclFile',
                        uiElements: {
                            'ftFileSclFile': new HUM.Param.UIelem({
                                role: 'in',
                                opType: 'set',
                                eventType: 'change',
                                htmlTargetProp: 'files',
                                widget: 'file',
                                eventListener: evt => {
                                    if (window.File && window.FileReader && window.FileList && window.Blob) {
                                        if (evt.target.files && evt.target.files[0]) {
                                            dhc.readSclFile(evt.target.files[0]);
                                        }
                                    } else {
                                        alert('The File APIs are not fully supported in this browser.');
                                    }
                                }
                            })
                        },
                        dataType: 'file',
                        presetStore: false,
                        presetRestore: false,
                    })
                },
                tun: {},
                mtx: {},
                lmso: {}
            },

            /**  
             * This property indicates what tuning method is selected for FT.
             * It's stored on the DB.
             * @instance
             * 
             * @member {HUM.Param}
             * 
             * @property {('nEDx'|'h_s'|'file')} value                          - The selected tuning method.
             * @property {Object}         uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}         uiElements.fn                        - Namespace for the "fn" HTML elements.
             * @property {Object}         uiElements.out                       - Namespace for the "out" HTML elements.
             * @property {HTMLElement}    uiElements.fn.ftSys_NEDX             - The HTML radio button for selecting the NEDX tuning method.
             * @property {HTMLElement}    uiElements.fn.ftSys_HSnat            - The HTML radio button for selecting the HSnat tuning method.
             * @property {HTMLElement}    uiElements.fn.ftSys_HStrans          - The HTML radio button for selecting the HStrans tuning method.
             * @property {HTMLElement}    uiElements.fn.ftSys_File             - The HTML radio button for selecting the Tuning File method.
             * @property {HTMLElement}    uiElements.out.ftNEDX                - The HTML output that shows the controls for NEDX tuning method.
             * @property {HTMLElement}    uiElements.out.ftHS                  - The HTML output that shows the controls for Harmonics/Subharmonics tuning method.
             * @property {HTMLElement}    uiElements.out.ftFile                - The HTML output that shows the controls for the Tuning File method.
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
                    'ftSys_File': new HUM.Param.UIelem({
                        role: 'fn',
                        opType: 'set',
                        eventType: 'click',
                        htmlTargetProp: 'checked',
                        widget: 'number',
                        uiSet: (value, thisParam, init) => {
                            if (value === 'file') {
                                thisParam.uiElements.fn.ftSys_File.checked = true;
                            }
                        },
                        eventListener: (evt) => {
                            if (event.target.checked) {
                                dhc.settings.ft.selected.valueUI = 'file';
                            }
                        }
                    }),
                    'ftNEDX': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'ftHS': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'ftFile': new HUM.Param.UIelem({
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
                allowedValues: ['nEDx', 'h_s', 'file'],
                // restoreStage: 'pre',
                // restoreSequence: 32,
                postSet: (value, thisParam, init) => {
                    if (value === 'nEDx') {
                        thisParam.uiElements.out.ftNEDX.style.display = "initial";
                        thisParam.uiElements.out.ftHS.style.display = "none";
                        thisParam.uiElements.out.ftFile.style.display = "none";
                    } else if (value === 'h_s') {
                        thisParam.uiElements.out.ftNEDX.style.display = "none";
                        thisParam.uiElements.out.ftHS.style.display = "initial";
                        thisParam.uiElements.out.ftFile.style.display = "none";
                        if (dhc.settings.ft.h_s.selected.value === 'natural') {
                            thisParam.uiElements.out.ftHStranspose_h_ratio.innerText = this.ft.h_s.natural.h_tr.value;
                            thisParam.uiElements.out.ftHStranspose_s_ratio.innerText = this.ft.h_s.natural.s_tr.value;
                        }
                        if (dhc.settings.ft.h_s.selected.value === 'sameOctave') {
                            thisParam.uiElements.out.ftHStranspose_h_ratio.innerText = this.ft.h_s.sameOctave.h_tr.value;
                            thisParam.uiElements.out.ftHStranspose_s_ratio.innerText = this.ft.h_s.sameOctave.s_tr.value;
                        }
                    } else if (value === 'file') {
                        thisParam.uiElements.out.ftNEDX.style.display = "none";
                        thisParam.uiElements.out.ftHS.style.display = "none";
                        thisParam.uiElements.out.ftFile.style.display = "initial";
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
                    file: 0,
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
     * Initializes the FT tuning system selection parameter and the FM initialization parameter.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on `ft.selected` to wire up the FT tuning-system radio
     * buttons and apply the stored tuning selection, then calls `_init()` on
     * `fm.init` to determine whether to initialise the Fundamental Mother from
     * an Hz or midicent value and recompute all tables accordingly.
     */
    _init() {
        this.ft.file.scl.data._init();
        this.ft.selected._init();
        this.fm.init._init();
        // this.ft.nEDx.unit._init();
        // this.ft.nEDx.division._init();
    }
};