/**
 * @fileoverview Parameters class for the Harmonicarium built-in synthesizer.
 * This file defines the {@link HUM.Synth.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.Synth} instance (VU meter, tab visibility, power state, volume,
 * ADSR envelope, waveform, portamento, and reverb controls). It is split
 * out from the main {@link module:synth} module.
 *
 * @module synth-parameters
 * @memberof HUM.Synth
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
 * Parameter container for the {@link HUM.Synth} instance.
 *
 * @class
 * @memberof HUM.Synth
 *
 * @description
 * Container class that instantiates and exposes all {@link HUM.Param} objects used
 * by a {@link HUM.Synth} instance. Parameters are grouped into namespaces:
 * - `synthMeter` / `synthTab` / `status`: VU meter, tab visibility, and power state.
 * - `volume`: Master, FT, and HT gain levels.
 * - `envelope`: ADSR parameters (attack, decay, sustain, release).
 * - `waveform`: Oscillator waveform for FT and HT voices.
 * - `portamento`: Glide time-constant for FT frequency transitions.
 * - `reverb`: Wet/dry amount and IR wave file selection.
 */
HUM.Synth.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given Synth.
     *
     * @param {HUM.Synth} synth - The parent `Synth` instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the synthesizer panel:
     * - `synthMeter`: Controls VU meter animation state.
     * - `synthTab`: Tracks whether the Synth accordion tab is open.
     * - `status`: Power ON/OFF for the synthesizer.
     * - `volume.master` / `volume.ft` / `volume.ht`: Master, FT, and HT gain levels.
     * - `envelope.attack` / `decay` / `sustain` / `release`: ADSR envelope parameters.
     * - `waveform.ft` / `waveform.ht`: Oscillator waveform type for FT and HT voices.
     * - `portamento`: Glide time-constant for FT frequency transitions.
     * - `reverb.amount`: Wet/dry reverb level.
     * - `reverb.irFile`: IR wave file selection and loading.
     */
    constructor(synth) {
        /**  
         * This property controls the state of the VU Meter animation (Web Audio Peak Meters).
         * It's not stored on the DB.
         * 
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                      - VU Meter meter ON/OFF. If `false` the meter is disabled.
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.synth_meter - The HTML element of the VU Meter.
         */
        this.synthMeter = new HUM.Param({
            app:synth,
            idbKey:'synthMeter',
            uiElements: {
                'synth_meter': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            postSet: (value, thisParam, init) => {
                // Only if the peakMeter hasn't been created yet
                if (!thisParam.uiElements.out.synth_meter.hasChildNodes()) {
                    // Only if the bootstrap collapsible tab is shown
                    if (this.synthTab.value) {
                        // Create the WEB AUDIO PEAK METERS (/assets/js/lib/web-audio-peak-meter.min.js)        
                        webAudioPeakMeter.createMeter(thisParam.uiElements.out.synth_meter, synth.vumeter, {
                            backgroundColor: 'rgb(38, 36, 54)',
                            dbTickSize: 4,
                            borderSize: 5,
                            fontSize: 10,
                            maskTransition: '0.1s'
                        });
                    } else {
                        if (value) {
                            alert("You cannot create and activate the peakMeter if the accordion's tab is hidden.");
                        }
                    }
                }
                if (value) {
                    synth.vumeter.onaudioprocess = webAudioPeakMeter.updateMeter;
                    webAudioPeakMeter.paintMeter.animate = true;
                    webAudioPeakMeter.paintMeter();
                } else {
                    synth.vumeter.onaudioprocess = undefined;
                    webAudioPeakMeter.paintMeter.animate = false;
                }
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            restoreStage: 'mid',
            presetStore:false,
            presetRestore:false,
        });
        /**  
         * This property controls the visibility of the Synth tab; if `false`, it's the VU Meter is
         * turned off in order to avoid unuseful computations and uptates of the UI when the panel is closed.
         * It also initialises the eventListener of the UIelems related to it.
         * It's not stored on the DB.
         * NOTE: These uiElements are the same object because, given the current implementation of
         * Param.UIelem, it's not possible to set more event listeners using a single UIelem.
         *
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                        - The visibility one wants to achieve. If `false` the tab will be collapsed.
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn                - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.fn.synthTabShown  - The Synth accordion collapse element (listens for `shown.bs.collapse` event).
         * @property {HTMLElement} uiElements.fn.synthTabHidden - The Synth accordion collapse element (listens for `hidden.bs.collapse` event).
         */
        this.synthTab = new HUM.Param({
            app:synth,
            idbKey:'synthTab',
            uiElements:{
                'synthTabShown': new HUM.Param.UIelem({
                    htmlID: synth.dhc.harmonicarium.html.synthTabs[synth.dhc.id].children[1].id,
                    role: 'fn',
                    eventType: 'shown.bs.collapse',
                    opType: 'toggle',
                    widget:'collapse',
                    uiSet: (value) => {
                        if (value) {
                            this.synthTab.bsCollapse.show();
                        } else {
                            this.synthTab.bsCollapse.hide();
                        }
                    },
                    eventListener: evt => {
                        this.synthTab.valueUI = true;
                    }
                }),
                'synthTabHidden': new HUM.Param.UIelem({
                    htmlID: synth.dhc.harmonicarium.html.synthTabs[synth.dhc.id].children[1].id,
                    role: 'fn',
                    eventType: 'hidden.bs.collapse',
                    opType: 'toggle',
                    widget:'collapse',
                    uiSet: null,
                    eventListener: evt => {
                        this.synthTab.valueUI = false;
                    }
                }),
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            restoreStage: 'pre',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            preInit: () => {
                // Create a Bootstrap collapsible controller
                this.synthTab.bsCollapse = new bootstrap.Collapse('#'+synth.dhc.harmonicarium.html.synthTabs[synth.dhc.id].children[1].id, {
                    toggle: this.synthTab.value
                });
            },
            postSet: (value, thisParam, init) => {
                // Start stop the peakMeter accordingly to the tab visibility
                if (value) {
                    this.synthMeter.value = true;
                } else {
                    this.synthMeter.value = false;
                }
            }
        });
        /**  
         * This property controls the state of the Synth (Power ON/OFF); if `false`, it is turned off.
         * It's stored on the DB.
         * 
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                     - Power ON/OFF. If `false` the synth is disabled.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "in" HTML elements.
         * @property {HTMLElement} uiElements.in.synth_power - The HTML element of the power ON/OFF toggle checkbox.
         */
        this.status = new HUM.Param({
            app:synth,
            idbKey:'synthStatus',
            uiElements:{
                'synth_power': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'toggle',
                    eventType: 'click',
                    htmlTargetProp:'checked',
                    widget:'checkbox',
                })
            },
            dataType:'boolean',
            initValue:true,
            // Manage the event when the user clicks on the the status of the synth Power ON/OFF checkbox.
            // NOTE: The user can use the "On/Off" toggle as a sort of PANIC button for stuck synth Voices.
            postSet:synth.allNotesOff
        });
        /**
         * Namespace for the Volume controls for the the MASTER, MIX FT and HT gain out nodes.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.volume = {
            /**  
             * This property controls the volume of the final gain out node of the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                       - The main out volume; a float-point number from 0 to 1.
             * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in               - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_volume - The HTML of the input slider widget for setting the volume.
             */
            master: new HUM.Param({
                app:synth,
                idbKey:'synthVolumeMaster',
                uiElements:{
                    'synth_volume': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        widget:'range',
                        htmlTargetProp:'value',
                        eventType: 'input',
                        // eventListeners: {
                        //     tooltip: {
                        //         eventType: 'input',
                        //         function: evt => {
                        //             this.volume.master.uiElements.in.synth_volume.setAttribute('data-tooltip', evt.target.value);
                        //         }
                        //     }
                        // }
                    })
                },
                dataType:'float',
                initValue:0.8,
                preInit: () => {
                    // Connect the MASTER to the final OUT
                    synth.gains.master.connect(synth.audioContext.destination);
                },
                postSet: (value, thisParam) => {
                    // Set volume amount on Master GAIN node from UI slider
                    synth.gains.master.gain.setValueAtTime(value, 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_volume.setAttribute('data-tooltip', value);
                }
            }),
            /**  
             * This property controls the volume of the FT gain out node of the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - The FT out volume; a float-point number from 0 to 1.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_volumeFT - The HTML of the input slider widget for setting the volume.
             */
            ft: new HUM.Param({
                app:synth,
                idbKey:'synthVolumeFT',
                uiElements: {
                    'synth_volumeFT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                        // eventListeners: {
                        //     tooltip: {
                        //         eventType: 'input',
                        //         function: evt => {
                        //             this.volume.master.uiElements.in.synth_volume.setAttribute('data-tooltip', evt.target.value);
                        //         }
                        //     }
                        // }
                    })
                },
                dataType:'float',
                initValue:0.8,
                preInit: () => {
                    // Connect the FT gain to the MIX
                    synth.gains.ft.connect(synth.gains.mix);
                },
                postSet: (value, thisParam) => {
                    // Set volume amount on FT GAIN node from UI slider
                    synth.gains.ft.gain.setValueAtTime(value, 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_volumeFT.setAttribute('data-tooltip', value);
                }
            }),
            /**  
             * This property controls the volume of the HT gain out node of the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - The HT out volume; a float-point number from 0 to 1.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_volumeHT - The HTML element of the input slider widget for setting the HT volume.
             */
            ht: new HUM.Param({
                app:synth,
                idbKey:'synthVolumeHT',
                uiElements:{
                    'synth_volumeHT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.8,
                preInit: () => {
                    // Connect the HT gain to the MIX
                    synth.gains.ht.connect(synth.gains.mix);
                },
                postSet: (value, thisParam) => {
                    // Set volume amount on HT GAIN node from UI slider
                    synth.gains.ht.gain.setValueAtTime(value, 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_volumeHT.setAttribute('data-tooltip', value);
                }
            })
        };
        /**
         * Namespace for the ADSR envelope parameters.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.envelope = {
            /**  
             * This property controls the Attack amount the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                      - Attack time (seconds).
             * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in              - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_attack - The HTML of the input slider widget for setting the Attack.
             */
            attack: new HUM.Param({
                app:synth,
                idbKey:'synthAttack',
                uiElements:{
                    'synth_attack': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.3,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_attack.setAttribute('data-tooltip', value + ' s');
                },
            }),
            /**  
             * This property controls the Decay amount the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                     - Decay time (time-constant).
             * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in             - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_decay - The HTML of the input slider widget for setting the Decay.
             */
            decay: new HUM.Param({
                app:synth,
                idbKey:'synthDecay',
                uiElements:{
                    'synth_decay': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.15,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_decay.setAttribute('data-tooltip', value + ' s(tc)');
                }
            }),
            /**  
             * This property controls the Sustain gain amount the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                       - Sustain gain value (amount from 0.0 to 1.0).
             * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in               - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_sustain - The HTML of the input slider widget for setting the Sustain.
             */
            sustain: new HUM.Param({
                app:synth,
                idbKey:'synthSustain',
                uiElements:{
                    'synth_sustain': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.68,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_sustain.setAttribute('data-tooltip', value + ' gain');
                }
            }),
            /**  
             * This property controls the Release time the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                       - Release time (seconds).
             * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in               - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_release - The HTML of the input slider widget for setting the Release.
             */
            release: new HUM.Param({
                app:synth,
                idbKey:'synthRelease',
                uiElements:{
                    'synth_release': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.3,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_release.setAttribute('data-tooltip', value + ' s');
                }
            })
        };
        /**
         * Namespace for FT and HT waveform parameters.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.waveform = {
            /**  
             * This property controls waveform for the FTs
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {('sine'|'square'|'sawtooth'|'triangle')} value                          - FTs waveform.
             * @property {Object}                                  uiElements                     - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}                                  uiElements.in                  - Namespace for the "in" HTML elements.
             * @property {HTMLElement}                             uiElements.in.synth_waveformFT - The HTML of the input selection widget for setting the FT waveform.
             */
            ft: new HUM.Param({
                app:synth,
                idbKey:'synthWaveformFT',
                uiElements:{
                    'synth_waveformFT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue:'triangle',
                allowedValues: ['sine', 'sawtooth', 'square', 'triangle'],
                // Update also the current running voices
                postSet: (value) => {
                    if (synth.voices.ft !== null) {
                        synth.voices.ft.setWaveform(value);
                    }

                }
            }),
            /**  
             * This property controls waveform for the HTs
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {('sine'|'square'|'sawtooth'|'triangle')} value                          - HTs waveform.
             * @property {Object}                                  uiElements                     - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}                                  uiElements.in                  - Namespace for the "in" HTML elements.
             * @property {HTMLElement}                             uiElements.in.synth_waveformHT - The HTML of the input selection widget for setting the HT waveform.
             */
            ht: new HUM.Param({
                app:synth,
                idbKey:'synthWaveformHT',
                uiElements:{
                    'synth_waveformHT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue:'sine',
                allowedValues: ['sine', 'sawtooth', 'square', 'triangle'],
                // Update also the current running voices
                postSet: (value) => {
                    for (var i=0; i<synth.voices.ht.length; i++) {
                        if (synth.voices.ht[i] !== undefined) {
                            synth.voices.ht[i].setWaveform(value);
                        }
                    }
                }
            })
        };
        /**  
         * This property controls the Portamento/Glide parameters for monophonic FT and FT/HT osc frequency updates.
         * It initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         * 
         * @member {HUM.Param}
         * 
         * @property {number}      value                          - Portamento time (time-constant).
         * @property {number}      lastFreqFT                     - Last FT frequency expressed in hertz (Hz); init value should be `null`.
         * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                  - Namespace for the "in" HTML elements.
         * @property {HTMLElement} uiElements.in.synth_portamento - The HTML element of the input slider widget for setting the Portamento.
         */
        this.portamento = new HUM.Param({
            app:synth,
            idbKey:'synthPortamento',
            uiElements:{
                'synth_portamento': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'input',
                    htmlTargetProp:'value',
                    widget:'range',
                })
            },
            dataType:'float',
            initValue:0.03,
            postSet: (value, thisParam) => {
                // Update the UI slider's tooltip
                thisParam.uiElements.in.synth_portamento.setAttribute('data-tooltip', value + ' s(tc)');
            },
            customProperties: {lastFreqFT: null}
        });
        /**
         * Namespace for reverb parameters.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.reverb = {
            /**  
             * This property controls the Reverb amount.
             * It initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             * 
             * @member {HUM.Param}
             * 
             * @property {number}      value                      - Reverb (wet) amount, normalized to 0.0 (dry) > 1.0 (wet).
             * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in              - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_reverb - The HTML element of the input slider widget for setting the Reverb amount.
             */
            amount: new HUM.Param({
                app:synth,
                idbKey:'synthReverb',
                uiElements:{
                    'synth_reverb': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.5,
                preInit: () => {
                    // Split the MIX to the REVERB and to DRY CARRIER
                    synth.gains.mix.connect(synth.reverb.convolver);
                    synth.gains.mix.connect(synth.reverb.dry);
                    // Connect the REVERB to the WET CARRIER
                    synth.reverb.convolver.connect(synth.reverb.wet);
                    // Connect the WET/DRY CARRIERS to the COMPRESSOR
                    synth.reverb.wet.connect(synth.compressor);
                    synth.reverb.dry.connect(synth.compressor);
                    // Connect the COMPRESSOR to the MASTER
                    synth.compressor.connect(synth.gains.master);
                },
                postSet: (value, thisParam) => {
                    // Update the Reverb amount mixing the Wet and Dry lines with an equal-power cross-fade
                    synth.reverb.dry.gain.setValueAtTime(Math.cos(value * 0.5 * Math.PI), 0);
                    synth.reverb.wet.gain.setValueAtTime(Math.cos((1.0 - value) * 0.5 * Math.PI), 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_reverb.setAttribute('data-tooltip', value);
                }
            }),
            /**  
             * This property sets the IR Reverb wave file.
             * It initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             * 
             * @member {HUM.Param}
             * 
             * @property {(File|'default')} value                               - The reverb wave file object.
             * @property {Object}           uiElements                          - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}           uiElements.in                      - Namespace for the "in" HTML elements.
             * @property {Object}           uiElements.out                     - Namespace for the "out" HTML elements.
             * @property {HTMLElement}      uiElements.in.synth_irFile         - The HTML element of the input file widget for uploading the reverb wave file.
             * @property {HTMLElement}      uiElements.out.synth_irFileName    - The HTML element of the output text element for displaying the reverb file name.
             * @property {HTMLElement}      uiElements.in.synth_irFileClearBtn - The HTML element of the button for restoring the default reverb.
             */
            irFile: new HUM.Param({
                app:synth,
                idbKey:'synthIrFile',
                uiElements:{
                    'synth_irFile': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'files',
                        widget:'file',
                        // Manage the event when the user is trying to load a IR Reverb file with the UI input
                        eventListener: evt => {
                            // Check for the various File API support.
                            if (window.File && window.FileReader && window.FileList && window.Blob) {
                                // Access to the file and send it to the setter method
                                synth.parameters.reverb.irFile.value = evt.target.files[0];
                            } else {
                                alert('The File APIs are not fully supported in this browser.');
                            }
                        }
                    }),
                    'synth_irFileName': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'synth_irFileClearBtn': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'run',
                        eventType: 'click',
                        widget:'button',
                        eventListener: evt => {
                            this.reverb.irFile.value = 'default';
                            this.reverb.irFile.uiElements.in.synth_irFile.value = '';
                        }
                    })
                },
                dataType:'file',
                initValue:'default', // NOTE: 'default' is a special value in order to avoid the default                                     //        hardcoded reverb from being stored in the IndexedDB.
                preSet: (value, thisParam, init, fromUI, oldValue) => {
                    let fileNameElem = thisParam.uiElements.out.synth_irFileName;
                    if (value === 'default') {
                        // Load the Base64-coded default IR Reverb
                        synth.readIrFile(synth.constructor.base64ToFile(synth.constructor.defaultReverb));
                        // fileNameElem.innerText = synth.constructor.defaultReverb.name;
                        fileNameElem.innerText = 'Default reverb';
                    } else if (value) {
                        // Load the file from the UI file input 
                        synth.readIrFile(value);
                        if (value.name) {
                            fileNameElem.innerText = value.name;
                        }
                    } else {
                        value = oldValue;
                        fileNameElem.innerText = oldValue.name;
                    }
                    return value;
                },
            })
        };
        // =======================
    } // end class Constructor
    // ===========================
    /**
     * Initializes the `synthTab` parameter.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on the `synthTab` parameter to set up its Bootstrap
     * Collapse controller and attach the related event listeners.
     */
    _init() {
        this.synthTab._init();
    }
};
