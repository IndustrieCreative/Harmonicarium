/**
 * @fileoverview Parameters class for the Harmonicarium MIDI Input handler.
 * This file defines the {@link HUM.midi.MidiIn.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.midi.MidiIn} instance (pitch-bend settings, receive mode, T-Snap
 * configuration, and monitor display proxies). It is split out from the main
 * {@link module:midi-in} module.
 *
 * @module midi-in-parameters
 * @memberof HUM.midi.MidiIn
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
 * Parameter container for the {@link HUM.midi.MidiIn} instance.
 *
 * @class
 * @memberof HUM.midi.MidiIn
 *
 * @description
 * Container class that instantiates and exposes all {@link HUM.Param} objects used
 * by a {@link HUM.midi.MidiIn} instance. It manages:
 * - `pitchbend`: Pitchbend range setting and current normalized amount.
 * - `receiveMode`: Active note-receiving mode (`keymap`, `tsnap-channel`, or `tsnap-divider`).
 * - `tsnap`: Tone-Snap settings, including tolerance, divider mode, and channel mode parameters.
 * - `monitor`: Read-only proxy parameters feeding the MIDI Input monitor display.
 */
HUM.midi.MidiIn.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given MidiIn handler.
     *
     * @param {HUM.midi.MidiIn} midiin - The MidiIn instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the MidiIn handler:
     * - `pitchbend.range`: Pitchbend range in cents.
     * - `pitchbend.amount`: Current normalized pitchbend value (plain number, not a Param).
     * - `receiveMode`: Note-receiving mode selector.
     * - `tsnap.tolerance`: Maximum snap tolerance in midicents.
     * - `tsnap.dividerMode.divKey`: Divider note number separating FTs from HTs.
     * - `tsnap.dividerMode.chan`: Divider mode MIDI channel.
     * - `tsnap.channelMode.chanFT`: FT-dedicated MIDI channel.
     * - `tsnap.channelMode.chanHT`: HT-dedicated MIDI channel.
     * - `monitor.note/velocity/channel/port`: MIDI input monitor display proxies.
     */
    constructor(midiin) {
        /**
         * Controller's Pitch Bend settings.
         * 
         * @member {Object}
         * @namespace
         */
        this.pitchbend = {
            /**  
             * This property is the MIDI input pitchbend range value in cents.
             * Initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @todo - Move to midi-in (one per input channel?)
             * @instance
             *
             * @member {HUM.Param}
             *
             * @property {number}      value                            - Pitchbend range value in cents (use hundreds when using MIDI-OUT and ideally match the instrument setting).
             * @property {Object}      uiElements                       - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                    - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.midiPitchbendRange - The HTML input number box for the pitchbend range.
             */
            range: new HUM.Param({
                app:midiin,
                idbKey:'midiInPitchbendRange',
                uiElements:{
                    'midiPitchbendRange': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'number',
                    })
                },
                dataType:'integer',
                initValue:100,
            }),

            /**
             * Current input controller pitchbend amount.
             * Value from -8192 to +8191, normalized to the ratio from -1 to 0,99987792968750
             * No pitchbend is 0.
             * @instance
             * 
             * @member {number}
             */
            amount: 0.0
        };

        /**  
         * This property sets the note-receiving mode for the controller (MIDI input).
         * It's initialises the eventListener of the UIelem related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {('keymap'|'tsnap-channel'|'tsnap-divider')} value - The note-receiving mode for the FT/HT controller.
         * @property {Object}             uiElements                    - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}             uiElements.in                 - Namespace for the "in" HTML elements.
         * @property {HTMLElement}        uiElements.in.midiReceiveMode - The HTML input selection widget for the note-receiving mode.
         */
        this.receiveMode = new HUM.Param({
            app: midiin,
            idbKey: 'midiInReceiveMode',
            uiElements:{
                'midiReceiveMode': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                })
            },
            init:false,
            dataType:'string',
            initValue: 'keymap',
            allowedValues: ['keymap', 'tsnap-channel', 'tsnap-divider'],
            postSet: (value) => {
                midiin.switchReceiveModeUI(value);
            }
        });
        /**
         * "Tone snapping" note-receiving mode settings.
         * 
         * @member {Object}
         * @namespace
         */
        this.tsnap = {
            /**  
             * This property sets the "Snap tolerance" in midicent; that is the maximum
             * difference within which you can consider two frequencies as the same note.
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {midicent}    value                                - Snap tolerance in midicent.
             * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                        - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.midiTsnapTolerance     - The HTML input box widget for the Snap tolerance.
             * @property {HTMLElement} uiElements.in.midiTsnapTolerance_box - The HTML box container for the Snap tolerance.
             */
            // this.receiveModeTsnapTolerance = new HUM.Param({
            tolerance: new HUM.Param({
                app: midiin,
                idbKey: 'midiInTsnapTolerance',
                uiElements:{
                    'midiTsnapTolerance': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'number',
                    }),
                    'midiTsnapTolerance_box': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                },
                dataType:'float',
                initValue: 0.5,
            }),
            /**
             * Divider Mode settings for the Tone snapping.
             * @instance
             * 
             * @member {Object}
             * @namespace
             */
            dividerMode: {
                /**  
                 * This property sets the "Divider Key" when the "Tone Snap" is set on "Divider Mode".
                 * This is the note, on a MIDI piano keyboard, to be used as the divider between FTs and HTs.
                 * The notes smaller or equal to the divider will be considered FTs, the greater ones will be considered HTs.
                 * It's initialises the eventListener of the UIelem related to it.
                 * It's stored on the DB.
                 * @instance
                 *
                 * @member {HUM.Param}
                 * 
                 * @property {midinnum}    value                                 - The MIDI number of the note to be used as divider.
                 * @property {Object}      uiElements                            - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                         - Namespace for the "in" HTML elements.
                 * @property {HTMLElement} uiElements.in.midiTsnapDividerKey     - The HTML input box widget for the Divider key.
                 * @property {HTMLElement} uiElements.in.midiTsnapDividerKey_box - The HTML box container for the Divider key.
                 */
                // this.receiveModeTsnapDividerKey = new HUM.Param({
                divKey: new HUM.Param({
                    app: midiin,
                    idbKey: 'midiInTsnapDividerKey',
                    uiElements:{
                        'midiTsnapDividerKey': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'number',
                        }),
                        'midiTsnapDividerKey_box': new HUM.Param.UIelem({
                            role: 'out',
                        }),
                    },
                    dataType:'integer',
                    initValue: 56,
                }),
                /**  
                 * This property sets the "Divider Channel", that is the channel from which input notes are taken
                 * when the "Tone Snap" is set on "Divider Mode".
                 * It's initialises the eventListener of the UIelem related to it.
                 * It's stored on the DB.
                 * @instance
                 *
                 * @member {HUM.Param}
                 * 
                 * @property {midichan}    value                                  - The MIDI number of the channel from which the notes are received.
                 * @property {Object}      uiElements                             - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                          - Namespace for the "in" HTML elements.
                 * @property {HTMLElement} uiElements.in.midiTsnapDividerChan     - The HTML input selection widget for the Divider channel.
                 * @property {HTMLElement} uiElements.in.midiTsnapDividerChan_box - The HTML box container for the Divider channel selector.
                 */
                // receiveModeTsnapDividerChan: new HUM.Param({
                chan: new HUM.Param({
                    app: midiin,
                    idbKey: 'midiInTsnapDividerChan',
                    uiElements:{
                        'midiTsnapDividerChan': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        }),
                        'midiTsnapDividerChan_box': new HUM.Param.UIelem({
                            role: 'out',
                        }),
                    },
                    dataType:'integer',
                    initValue: 0,
                }),
            },
            /**
             * Channel Mode settings for the Tone snapping.
             * @instance
             * 
             * @member {Object}
             * @namespace
             */
            channelMode: {
                /**  
                 * This property sets the MIDI channel assigned to FTs, that is the channel from which input notes are considered FTs.
                 * when the "Tone Snap" is set on "Channel Mode".
                 * All notes received on this channel will be considered as FTs.
                 * It's initialises the eventListener of the UIelem related to it.
                 * It's stored on the DB.
                 * @instance
                 *
                 * @member {HUM.Param}
                 * 
                 * @property {midichan}    value                             - The MIDI number of the channel for FTs.
                 * @property {Object}      uiElements                        - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                     - Namespace for the "in" HTML elements.
                 * @property {HTMLElement} uiElements.in.midiTsnapChanFT     - The HTML input selection widget for the FT channel.
                 * @property {HTMLElement} uiElements.in.midiTsnapChanFT_box - The HTML box container for the FT channel selector.
                 */
                // receiveModeTsnapChanFT: new HUM.Param({
                chanFT: new HUM.Param({
                    app: midiin,
                    idbKey: 'midiInTsnapChanFT',
                    uiElements:{
                        'midiTsnapChanFT': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        }),
                        'midiTsnapChanFT_box': new HUM.Param.UIelem({
                            role: 'out',
                        }),
                    },
                    dataType:'integer',
                    initValue: 1,
                    allowedValues: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
                    init:false,
                    postSet: (value, thisPara, init) => {
                        if (!init && value === this.tsnap.channelMode.chanHT.value) {
                            throw "FT and HT cannot share the same MIDI channel!";
                        } else {
                            let ht_channels = this.tsnap.channelMode.chanHT.uiElements.in.midiTsnapChanHT;
                            for (let opt of ht_channels) { 
                                opt.disabled = false;
                            }
                            ht_channels.options[value].disabled = true;                    
                        }
                    }
                }),
                /**  
                 * This property sets the MIDI channel assigned to HTs, that is the channel from which input notes are considered HTs.
                 * when the "Tone Snap" is set on "Channel Mode".
                 * All notes received on this channel will be considered as HTs.
                 * It's initialises the eventListener of the UIelem related to it.
                 * It's stored on the DB.
                 * @instance
                 *
                 * @member {HUM.Param}
                 * 
                 * @property {midichan}    value                             - The MIDI number of the channel for HTs.
                 * @property {Object}      uiElements                        - Namespace for the "in", "out" and "fn" objects.
                 * @property {Object}      uiElements.in                     - Namespace for the "in" HTML elements.
                 * @property {HTMLElement} uiElements.in.midiTsnapChanHT     - The HTML input selection widget for the HT channel.
                 * @property {HTMLElement} uiElements.in.midiTsnapChanHT_box - The HTML box container for the HT channel selector.
                 */
                // receiveModeTsnapChanHT: new HUM.Param({
                chanHT: new HUM.Param({
                    app: midiin,
                    idbKey: 'midiInTsnapChanHT',
                    uiElements:{
                        'midiTsnapChanHT': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        }),
                        'midiTsnapChanHT_box': new HUM.Param.UIelem({
                            role: 'out',
                        }),
                    },
                    dataType:'integer',
                    initValue: 0,
                    allowedValues: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
                    init:false,
                    postSet: (value, thisParam) => {
                        if (value === this.tsnap.channelMode.chanFT.value) {
                            throw "FT and HT cannot share the same MIDI channel!";
                        } else {
                            let ft_channels = this.tsnap.channelMode.chanFT.uiElements.in.midiTsnapChanFT;
                            for (let opt of ft_channels) { 
                                opt.disabled = false;
                            }
                            ft_channels.options[value].disabled = true;                    
                        }
                    }
                })
            }
        };
        /**
         * Namespace for UI params of the MIDI Input monitor.
         * 
         * @member {Object}
         * @namespace
         */
        this.monitor = {
            /**  
             * This property is a proxy for the UIelems related to the MIDI Input monitor
             * that shows the NOTE info of the last incoming note-message.
             * It's not stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {(midinnum|string)} value                            - The note number (or T-Snap conversion string, e.g. `"39>56"`) of the last received note-on message.
             * @property {Object}            uiElements                       - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}            uiElements.out                   - Namespace for the "out" HTML elements.
             * @property {HTMLElement}       uiElements.out.midiMonitor0_note - The primary HTML output element showing the note number.
             * @property {HTMLElement}       uiElements.out.midiMonitor1_note - The secondary HTML output element showing the note number.
             */
            note: new HUM.Param({
                app: midiin,
                idbKey: 'midiInMonitorNote',
                uiElements:{
                    'midiMonitor0_note': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                    'midiMonitor1_note': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                },
                init:false,
                presetStore:false,
                presetAutosave:false,
                presetRestore:false,
            }),
            /**  
             * This property is a proxy for the UIelems related to the MIDI Input monitor
             * that shows the VELOCITY info of the last incoming note-message.
             * It's not stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {velocity}    value                                - The velocity of the last received note-on message.
             * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_velocity - The primary HTML output element showing the velocity.
             * @property {HTMLElement} uiElements.out.midiMonitor1_velocity - The secondary HTML output element showing the velocity.
             */
            velocity: new HUM.Param({
                app: midiin,
                idbKey: 'midiInMonitorVelocity',
                uiElements:{
                    'midiMonitor0_velocity': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                    'midiMonitor1_velocity': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                },
                init:false,
                presetStore:false,
                presetAutosave:false,
                presetRestore:false,
            }),
            /**  
             * This property is a proxy for the UIelems related to the MIDI Input monitor
             * that shows the CHANNEL info of the last incoming note-message.
             * It's not stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {midichan}    value                                - The MIDI channel number (1-based) of the last received note-on message.
             * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                       - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_channel  - The primary HTML output element showing the channel number.
             * @property {HTMLElement} uiElements.out.midiMonitor1_channel  - The secondary HTML output element showing the channel number.
             */
            channel: new HUM.Param({
                app: midiin,
                idbKey: 'midiInMonitorChannel',
                uiElements:{
                    'midiMonitor0_channel': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                    'midiMonitor1_channel': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                },
                init:false,
                presetStore:false,
                presetAutosave:false,
                presetRestore:false,
            }),
            /**  
             * This property is a proxy for the UIelems related to the MIDI Input monitor
             * that shows the PORT info of the last incoming note-message.
             * It's not stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {string}      value                            - The name of the MIDI input port from which the last note-on message was received.
             * @property {Object}      uiElements                       - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                   - Namespace for the "out" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_port - The primary HTML output element showing the port name.
             * @property {HTMLElement} uiElements.out.midiMonitor1_port - The secondary HTML output element showing the port name.
             */
            port: new HUM.Param({
                app: midiin,
                idbKey: 'midiInMonitorPort',
                uiElements:{
                    'midiMonitor0_port': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                    'midiMonitor1_port': new HUM.Param.UIelem({
                        role: 'out',
                        htmlTargetProp:'innerText',
                    }),
                },
                init:false,
                presetStore:false,
                presetAutosave:false,
                presetRestore:false,
            }),
        }
        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initializes parameters that require deferred setup.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on the T-Snap channel mode parameters (`chanFT`, `chanHT`) to
     * attach their event listeners and mutual-exclusion logic, then calls `_init()` on
     * `receiveMode` to apply the initial UI visibility state via
     * {@link HUM.midi.MidiIn#switchReceiveModeUI}.
     */
    _init() {
        this.tsnap.channelMode.chanFT._init();
        this.tsnap.channelMode.chanHT._init();
        this.receiveMode._init();
    }
};