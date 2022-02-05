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
 * The MidiIn class.<br>
 *     Manage MIDI input messages.
 */
HUM.midi.MidiIn = class {
    /**
    * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs
    * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs
    */
    constructor(dhc, midi) {
        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;
        /**
        * The MidiHub instance
        *
        * @member {HUM.midi.MidiHub}
        */
        this.midi = midi;
        /**
         * Output queue buffer for MIDI messages that must pass through and go out
         *     (used as logger at the moment)
         *
         * @todo - Pass through for most of the MIDI messages
         *
         * @member {Array.<OtherMidiMsg>}
         */
        // @old icMidiPassThrough
        this.midiPassThrough = [];
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
                receiveModeTsnapTolerance: document.getElementById("HTMLf_midiReceiveModeTsnapTolerance"+dhc.id),
                receiveModeTsnapChan: document.getElementById("HTMLf_midiReceiveModeTsnapChan"+dhc.id),
                receiveModeTsnapDivider: document.getElementById("HTMLf_midiReceiveModeTsnapDivider"+dhc.id),
            },
            in: {
                receiveMode: document.getElementById("HTMLi_midiReceiveMode"+dhc.id),
                receiveModeTsnapTolerance: document.getElementById("HTMLi_midiReceiveModeTsnapTolerance"+dhc.id),
                receiveModeTsnapDivider: document.getElementById("HTMLi_midiReceiveModeTsnapDivider"+dhc.id),
                receiveModeTsnapChanFT: document.getElementById("HTMLi_midiReceiveModeTsnapChanFT"+dhc.id),
                receiveModeTsnapChanHT: document.getElementById("HTMLi_midiReceiveModeTsnapChanHT"+dhc.id),
                receiveModeTsnapChanDivider: document.getElementById("HTMLi_midiReceiveModeTsnapChanDivider"+dhc.id),
            },
            out: {
                monitor0_note: document.getElementById(`HTMLo_midiMonitor0_note${dhc.id}`),
                monitor0_velocity: document.getElementById(`HTMLo_midiMonitor0_velocity${dhc.id}`),
                monitor0_channel: document.getElementById(`HTMLo_midiMonitor0_channel${dhc.id}`),
                monitor0_port: document.getElementById(`HTMLo_midiMonitor0_port${dhc.id}`),
                monitor1_note: document.getElementById(`HTMLo_midiMonitor1_note${dhc.id}`),
                monitor1_velocity: document.getElementById(`HTMLo_midiMonitor1_velocity${dhc.id}`),
                monitor1_channel: document.getElementById(`HTMLo_midiMonitor1_channel${dhc.id}`),
                monitor1_port: document.getElementById(`HTMLo_midiMonitor1_port${dhc.id}`),
            },
        };
        /**
         * Register of the MIDI Note-On inputs by channel.
         *     Actually it's common to all input ports. 
         *
         * @member {Object.<number, Object.<midinnum, MidiInNoteOn>>}
         * 
         * @example
         * // An example of structure of .notes_on[0]
         * 0: {                                   // MIDI Channel
         *     39: {                              // External MIDI note number (on the instrument)
         *         keymapped: 56,                 // Internal MIDI note number (on the keymap)
         *         midievent: {MIDIMessageEvent}  // The original `MIDIMessageEvent`
         *     }
         * }
         * 
         * @todo Dynamic, one for each imput port.
         *       Now two in ports can conflicts if use the same channels.
         */
        this.notes_on = {
            /**
             * MIDI note number from external input controller
             * @typedef {Object} MidiInNoteOn
             * 
             * @property {midinnum}         keymapped - The MIDI Note Number on the keymap (internal)
             * @property {MIDIMessageEvent} midievent - The original MIDI event containing the note-on message
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
        };

        this._initUI();

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 0);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manage and route an incoming message
     * @param {HUM.DHCmsg} msg - The incoming message
     */
    updatesFromDHC(msg) {

        if (msg.cmd === 'panic') {
            this.allNotesOff();
        }

        if (msg.cmd === 'update') {
            if (msg.type === 'ft') {
                
                // this.tsnapUpdateFT();
                return;

            } else if (msg.type === 'ht') {

                this.tsnapUpdateHT();

            } else if (msg.type === 'ctrlmap') {
                return;
            }

        }
    }
    /**
     * Clear the {@link HUM.midi.MidiIn#notes_on} register 
     */
    allNotesOff() {
        for (var ch = 0; ch < 16; ch++) {
            this.notes_on[ch] = {};
        }
    }
    /*==============================================================================*
     * MAIN MIDI MESSAGE HANDLER
     *==============================================================================*/
    /**
     * Handle the incoming MIDI messages
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#MIDIMessageEvent|Web MIDI API specs}
     * 
     * @param {MIDIMessageEvent} midievent           - The MIDI message from {@link HUM.midi.MidiPorts#midiAccess}
     * @param {Uint8Array}       midievent.data      - The data array (each entry is a 8bit integer)
     * @param {number}           midievent.timeStamp - The Time-stamp of the message in milliseconds (floating-point number)
     * @param {boolean=}         deSnapped=false     - If the Note-Off comes from de-snapping action, by the T-Snap receive mode.<br>
     *                                                 `false`: (default) The note will be turned-off deleted from the {@link HUM.midi.MidiIn#notes_on} register
     *                                                 `true`: (default) The note will be turned-off but still remains in the {@link HUM.midi.MidiIn#notes_on} register
     */
    // @old icMidiMessageReceived
    midiMessageReceived(midievent, deSnapped=false) {
        // Divide the informations contained in the first byte (Status byte)
        // 4 bits bitwise shift to the right to get the remaining 4 bits representing
        // the command (the type of MIDI message)
        let cmd = midievent.data[0] >> 4;
        // Set to zero the first 4 bits from left and get the channel
        let channel = midievent.data[0] & 0xf;
        // Set the timestamp
        let timestamp = midievent.timeStamp;

        // Handle Piper feature (fake midievent)
        // Default: is not a Piper midievent
        let piper = false;
        let hancock = false;
        let tSnapped = false;
        // Special 4th & 5th bytes in the 'midievent' containing 'hancock' and 'piper' tags
        if (midievent.data[3] === "hancock") {
            // If it's a Hancock midievent
            hancock = true;
        }
        if (midievent.data[4] === "piper") {
            // If it's a Piper's fake midievent
            piper = true;
        }

        // this.logMidiEvent(midievent);

        // Check 'cmd' (the first 4 bits of the 1st byte of the message)
        //     If >= 0x80 it's a Status byte
        //     Filter the Active Sensing messages (254 = 0xFE = 11111110)
        if (cmd > 7 && midievent.data[0] !== 254) {

            // @todo - implement RUNNING STATUS (status byte not repeated on every message)
            // If the message has at least 3 bytes
            // if (midievent.data.length > 2) {
            //     // Read the velocity from the 3rd byte
            //     velocity = midievent.data[2];
            // }

            // @todo - implement TRANSMISSION ERRORS HANDLING

            if (cmd === 8 || (cmd === 9)) {
                let ctrlNum = false;
                let monitorNotes = midievent.data[1];
                
                // MIDI NOTE NUMBER PREPARE (in case of Tsnap)
                if (this.dhc.settings.controller.receive_mode === 'keymap') {
                    ctrlNum = midievent.data[1];
                } else {
                    // Find the controller (internal and keymapped) note number from the incoming midi message
                    // if the midi receiving mode is Tone snap
                    if (this.dhc.settings.controller.receive_mode === 'tsnap-channel') {
                        ctrlNum = this.tsnapChannel(midievent.data[1], channel, hancock);
                    } else if (this.dhc.settings.controller.receive_mode === 'tsnap-divider') {
                        ctrlNum = this.tsnapDivider(midievent.data[1], channel, hancock);
                    }
                    if (hancock === false) {
                        // Mark that's a Hancock internal generated message
                        // (it is currently fixed on the keymap receiving mode)
                        tSnapped = ctrlNum !== false ? true : false;
                        // MIDI-IN MONITOR translation
                        let monintorNoteTo = ctrlNum === false ? 'ND' : ctrlNum;
                        monitorNotes = midievent.data[1] +'>'+ monintorNoteTo;
                    }
                }
                
                // NOTE OFF (MIDI note-on with velocity=0 is the same as note-off)
                if (cmd === 8 || ((cmd === 9) && (midievent.data[2] === 0))) {
                    // if (ctrlNum !== false) {
                    if (hancock === true) {
                        ctrlNum = midievent.data[1];
                    } else {
                        // If the ctrlNum note is in the 'notes_on' register
                        if (this.notes_on[channel][midievent.data[1]] !== undefined) {
                            ctrlNum = this.notes_on[channel][midievent.data[1]].keymapped;
                            if (!deSnapped) {
                                delete this.notes_on[channel][midievent.data[1]];
                            }
                        }
                    }
                    this.muteTone(ctrlNum, midievent.data[2], midievent.data[0], midievent.timeStamp);
                    // }
                
                // NOTE ON
                } else if (cmd === 9) {
                    // Call note on function
                    // Pass the 'piper' argument to avoid loop of Piper's fake midievents
                    // 'statusByte' is useful to the Piper, and with 'timestamp' will be used for MIDI-OUT
                    this.playTone(ctrlNum, midievent.data[2], midievent.data[0], midievent.timeStamp, piper, tSnapped);
                    // If it's not a message from Hancock, store the message
                    // (because the internal virtual midi controller is mapped with the keymap also if Tsnap is active)
                    if (hancock === false) {
                        this.notes_on[channel][midievent.data[1]] = {'keymapped': ctrlNum, 'midievent': midievent};
                    }
                    // Do not MIDI monitor if it's a Piper's fake midievent (FT0)
                    if (piper === false) {
                        this.monitorMidiIN(monitorNotes, midievent.data[2], channel, midievent.srcElement.name);
                    }
            }
            // Control Change message or Selects Channel Mode message (0xBn)
            } else if (cmd === 11) {
                if (midievent.data[1] >= 0 && midievent.data[1] <= 119) {
                    // console.log("Incoming MIDI > type: CHANNEL VOICE message");
                } else {
                    // All Notes Off message
                    if (midievent.data[1] === 123) {
                        // console.log("Incoming MIDI > type: ALL NOTES OFF message");
                        for (var mnn = 0; mnn <= 127; mnn++) {
                            this.muteTone(mnn, 80, midievent.data[0], midievent.timeStamp, true);
                            if (this.notes_on[channel][mnn]) {
                                delete this.notes_on[channel][mnn];
                            }
                        }
                    } else {
                        // console.log("Incoming MIDI > type: CHANNEL MODE message");
                    }
                }
            // Pitch Bend Change message
            } else if (cmd === 14) {
                // Handle pitchbend message
                let pitchbendValue = ((midievent.data[2] * 128 + midievent.data[1]) - 8192) / 8192;
                // Store the pitchbend value into global slot: value normalized to [-1 > 0,99987792968750]
                this.dhc.settings.controller.pb.amount = pitchbendValue;
                // Update the Synth voices frequencies
                this.dhc.synth.updatePitchBend();
                // Update the UI Monitors
                this.dhc.initUImonitors();
            // Other type of MIDI message
            } else {
                console.log("Incoming MIDI > type: Other message...");
                // @todo - Any other type of message pass through and go out
                // this.midiPassThrough.push( [midievent.data, timestamp] );
            }
        // Filter the Active Sensing messages (254 = 0xFE = 11111110)
        } else if (midievent.data[0] !== 254) {
            // @todo - implement RUNNING STATUS and interpret a message starting with a Data byte
            // as part of the last received Status byte - Check if the browser do this for us
            
            // Debug
            console.log("Incoming MIDI > NON-STANDARD MIDI Message (maybe RUNNING STATUS). The first 4 bits of the 1st byte of the message (Status byte) has an unexpected value: " + cmd + " = " + cmd.toString(2));
        }
    }

    /*==============================================================================*
     * MIDI NOTE ON/OFF HANDLING
     *==============================================================================*/
    /**
     * Send a Note-ON over the app
     *
     * @param {midinnum} ctrlNum    - MIDI note number of the incoming MIDI message
     * @param {velocity} velocity   - Velocity of the incoming MIDI message
     * @param {number}   statusByte - Status Byte of the incoming MIDI message
     * @param {number}   timestamp  - Timestamp of the incoming MIDI message (currently not used)
     * @param {boolean}  piper      - If is a note generated by the Piper feature:
     *                                `false`: it's not Piper;
     *                                `true`: it's Piper.
     * @param {boolean}  tsnap      - If is a note translated by the T-Snap receive mode:
     *                                 `false`: it's not T-snapped;
     *                                 `true`: it's T-snapped.
     */
    // @old icNoteON
    playTone(ctrlNum, velocity, statusByte, timestamp, piper, tsnap) {
        // Get frequency and midi.cents assigned to the incoming MIDI key (ctrlNum)
        // If the input MIDI key is in the ctrl_map, proceed
        if (this.dhc.tables.ctrl[ctrlNum]) {
            
            // Vars for a better reading
            let ftNumber = this.dhc.tables.ctrl[ctrlNum].ft,
                htNumber = this.dhc.tables.ctrl[ctrlNum].ht;

            // **FT**
            // If the key is mapped to a Fundamental Tone 
            if (ftNumber !== 129) {
                // Play the DHC
                this.dhc.playFT(HUM.DHCmsg.ftON('midi', ftNumber, velocity, ctrlNum, tsnap));
            }

            // **HT**
            // If the key is mapped to a Harmonic Tone (or subharmonic) 
            if (htNumber !== 129) {
                // Play the DHC
                this.dhc.playHT(HUM.DHCmsg.htON('midi', htNumber, velocity, ctrlNum, piper, tsnap));
            }
        
        // If the input MIDI key is NOT in the ctrl_map, the message stop here
        } // else {
        //     this.dhc.harmonicarium.components.backendUtils.eventLog("The pressed KEY on the CONTROLLER is not assigned on the current KEYMAP.");
        // }
    }

    /**
     * Send a Note-OFF over the app
     *
     * @param {midinnum} ctrlNum    - MIDI note number of the incoming MIDI message
     * @param {velocity} velocity   - Velocity of the incoming MIDI message
     * @param {number}   statusByte - Status Byte of the incoming MIDI message
     * @param {number}   timestamp  - Timestamp of the incoming MIDI message (currently not used)
     * @param {boolean=} panic      - It tells that the message has been generated by a "hard" All-Notes-Off request.
     */
    // @old icNoteOFF
    muteTone(ctrlNum, velocity, statusByte, timestamp, panic=false) {
        // If the input MIDI key is in the ctrl_map, proceed
        if (this.dhc.tables.ctrl[ctrlNum]) {
            
            // Vars for a better reading
            let ftNumber = this.dhc.tables.ctrl[ctrlNum].ft,
                htNumber = this.dhc.tables.ctrl[ctrlNum].ht;
            
            // **FT**
            // If the key is mapped to a Fundamental Tone
            if (ftNumber !== 129) {
                this.dhc.muteFT(HUM.DHCmsg.ftOFF('midi', ftNumber, velocity, ctrlNum, panic));
            }

            // **HT**
            // If the key is mapped to a Harmonic Tone
            if (htNumber !== 129) {
                this.dhc.muteHT(HUM.DHCmsg.htOFF('midi', htNumber, velocity, ctrlNum, panic));
            }
        }
    }

    /*==============================================================================*
     * TONE SNAPPING - RECEIVING MODE FEATURE
     *==============================================================================*/
    /**
     * Updates the status of the keys pressed on the controller when the T-Snap is active.
     * It should be invoked when the HTs table at {@link HUM.DHC#tables} changes. 
     * Allows you to play only the keys that match the HTs frequencies.
     * If a key on the controller remains pressed, it will be dynamically switched on or off when the HTs table is updated.
     */
     // @old icTsnapUpdateHT
    tsnapUpdateHT() {
        // Handle the change of FT on TSNAP RECEIVING MODE
        // Ignore handling if 'keymap' receiving mode
        if (this.dhc.settings.controller.receive_mode === 'keymap') {
            return;
        } else if (this.dhc.settings.controller.receive_mode === 'tsnap-channel') {
            let ht_channel = this.dhc.settings.controller.tsnap.channel.ht;
            let ht_notes_on = this.notes_on[ht_channel];

            // Mute or Re-play the current HT playng notes
            // For every HT notes-on
            for (let external of Object.keys(ht_notes_on)) {

                let newCtrlNoteNumber = this.tsnapChannel(external, ht_channel, false);
                let midievent = ht_notes_on[external].midievent;
                // If the new note in NOT on the keymap
                if (newCtrlNoteNumber === false) {
                    // Remove the note:
                    // Turn the note off (fake midievent)
                    let midievent_noteoff = {
                        data: [midievent.data[0], midievent.data[1], 0, midievent.data[3], midievent.data[4]],
                        srcElement: midievent.srcElement
                    };
                    this.midiMessageReceived(midievent_noteoff, true);
                // If the new note is on the keymap
                } else {
                    // Update the note:
                    // Turn the note off (fake midievent)
                    let midievent_noteoff = {
                        data: [midievent.data[0], midievent.data[1], 0, midievent.data[3], midievent.data[4]],
                        srcElement: midievent.srcElement
                    };
                    // Turn the note on (fake midievent)
                    let midievent_noteon = {
                        data: [midievent.data[0], midievent.data[1], midievent.data[2], midievent.data[3], midievent.data[4]],
                        srcElement: midievent.srcElement
                    };
                    this.midiMessageReceived(midievent_noteoff, false);
                    this.midiMessageReceived(midievent_noteon);
                }
            }

        } else if (this.dhc.settings.controller.receive_mode === 'tsnap-divider') {
            // @todo - to fix: ht_channel is from tsnap-channel mode!!! (no more omni!)
            let divider_channel = this.dhc.settings.controller.tsnap.channel.divider;
            let notes_on = this.notes_on[divider_channel];

            // For every notes-on
            for (let external of Object.keys(notes_on)) {
                // If it's HT
                if (this.dhc.settings.controller.tsnap.divider < external) {
                    let newCtrlNoteNumber = this.tsnapDivider(external, divider_channel, false);
                    let midievent = notes_on[external].midievent;
                    // If the new note in NOT on the keymap
                    if (newCtrlNoteNumber === false) {
                        // Remove the note:
                        // Turn the note off (fake midievent)
                        let midievent_noteoff = {
                            data: [midievent.data[0], midievent.data[1], 0, midievent.data[3], midievent.data[4]],
                            srcElement: midievent.srcElement
                        };
                        this.midiMessageReceived(midievent_noteoff, true);
                    // If the new note is on the keymap
                    } else {
                        // Update the note:
                        // Turn the note off (fake midievent)
                        let midievent_noteoff = {
                            data: [midievent.data[0], midievent.data[1], 0, midievent.data[3], midievent.data[4]],
                            srcElement: midievent.srcElement
                        };
                        // Turn the note on (fake midievent)
                        let midievent_noteon = {
                            data: [midievent.data[0], midievent.data[1], midievent.data[2], midievent.data[3], midievent.data[4]],
                            srcElement: midievent.srcElement
                        };
                        this.midiMessageReceived(midievent_noteoff, false);
                        this.midiMessageReceived(midievent_noteon);
                    }
                }
            }
        }
    }
    /**
     * Check if a frequency of a MIDI Note Number corresponds to a Harmonic (or Subharmonic) in the HT table under {@link HUM.DHC#tables}
     * @param {midinnum} midi_note_number - The MIDI Note Number to be found in the reverse table
     * @param {tonetype} type             - The type of tone (FT or HT)
     *
     * @returns {(false|midinnum)} - Returns the keymapped MIDI Note Number that match the nearest HT to the incoming Note; if nothing is found, returns `false`
     */
    // @old icTsnapFindCtrlNoteNumber
    tsnapFindCtrlNoteNumber(midi_note_number, type) {  
        let table_keys_array =  Object.keys(this.dhc.tables.reverse[type]); 
        let closest_mc = table_keys_array.reduce((prev, curr) => {
            // @todo: snap to a different tone if two tones are at the same distance
            let result = (Math.abs(curr - midi_note_number) < Math.abs(prev - midi_note_number) ? curr : prev);
            if (Math.abs(result - midi_note_number) > this.dhc.settings.controller.tsnap.tolerance) {
                return false;
            } else {
                return result;
            }
        });
        if (closest_mc !== false) {
            if (type === "ft") {
                let relative_tone = this.dhc.tables.reverse.ft[closest_mc];
                for (const [key, value] of Object.entries(this.dhc.tables.ctrl)) {
                    if (value.ft === relative_tone) {
                        return Number(key);
                    }
                }
            } else if (type === "ht") {
                let relative_tone = this.dhc.tables.reverse.ht[closest_mc];
                for (const [key, value] of Object.entries(this.dhc.tables.ctrl)) {
                    if (value.ht === relative_tone) {
                        return Number(key);
                    }
                }
            } else {
                return false;
            }
        }
        // If nothing found, return false
        return false;
    }
    /**
     * Tone Snap Channel receive mode router. Route messages accordingly to the MIDI Channel.
     * @param {midinnum} midi_note_number - The MIDI Note Number to be found in the reverse table
     * @param {midichan} channel          - The MIDI Channel from which the message is coming from
     * @param {boolean}  hancock          - If the message comes from the Hancock virtual MIDI input (if it's `true` ignore and don't apply T-Snap)
     *
     * @returns {(false|midinnum)} - Returns the keymapped MIDI Note Number that match the nearest HT to the incoming Note; if nothing is found, returns `false`
     */
    // @old icTsnapChannel
    tsnapChannel(midi_note_number, channel, hancock) {
        if (hancock === true) {
            return midi_note_number;
        } else {
            if (this.dhc.settings.controller.tsnap.channel.ft == channel) {
                return this.tsnapFindCtrlNoteNumber(midi_note_number, 'ft');
            }
            else if (this.dhc.settings.controller.tsnap.channel.ht == channel) {
                return this.tsnapFindCtrlNoteNumber(midi_note_number, 'ht');
            } else {
                return false;
            }
        }
    }
    /**
     * Tone Snap Divider receive mode router.  Route messages accordingly to the divider MIDI Note Number.
     * @param {midinnum} midi_note_number - The MIDI Note Number to be found in the reverse table
     * @param {midichan} channel          - The MIDI Channel from which the message is coming from
     * @param {boolean}  hancock          - If the message comes from the Hancock virtual MIDI input (if it's `true` ignore and don't apply T-Snap)
     *
     * @returns {(false|midinnum)} - Returns the keymapped MIDI Note Number that match the nearest HT to the incoming Note; if nothing is found, returns `false`
     */
    // @old icTsnapDivider
    tsnapDivider(midi_note_number, channel, hancock) {
        if (hancock === true) {
            return midi_note_number;
        } else {
            if (this.dhc.settings.controller.tsnap.channel.divider == channel) {
                if (this.dhc.settings.controller.tsnap.divider >= midi_note_number) {
                    return this.tsnapFindCtrlNoteNumber(midi_note_number, 'ft');
                }
                else if (this.dhc.settings.controller.tsnap.divider < midi_note_number) {
                    return this.tsnapFindCtrlNoteNumber(midi_note_number, 'ht');
                } else {
                    return false;
                }
            }
        }
    }

    /*==============================================================================*
     * MIDI UI tools
     *==============================================================================*/

    /**
     * Switch the MIDI INPUT RECEIVING MODE (called when UI is updated)
     *
     * @param {('keymap'|'tsnap-channel'|'tsnap-divider')} receive_mode - FT/HT controller note receiving mode
     */
    // @old icSwitchMidiReceiveMode
    switchReceiveModeUI(receive_mode) {
        let tsnap_tolerance = this.uiElements.fn.receiveModeTsnapTolerance,
            tsnap_chan = this.uiElements.fn.receiveModeTsnapChan,
            tsnap_divider = this.uiElements.fn.receiveModeTsnapDivider;
        
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

    /**
     * MIDI-IN MONITOR
     *
     * @param {midinnum} noteNumber - MIDI Note number (or conversion string if the Tone snapping receiving mode is active)
     * @param {velocity} velocity   - MIDI Velocity amount
     * @param {midichan} channel    - MIDI Channel number
     * @param {string}   portName   - MIDI Port name
     */
    // @old icMIDImonitor
    monitorMidiIN(noteNumber, velocity, channel, portName) {
        let dhcID = this.dhc.id;
        // Update the log on MIDI MONITOR on the UI
        for (let x of [0,1]) {
            this.uiElements.out[`monitor${x}_note`].innerText = noteNumber;
            this.uiElements.out[`monitor${x}_velocity`].innerText = velocity;
            this.uiElements.out[`monitor${x}_channel`].innerText = channel + 1;
            this.uiElements.out[`monitor${x}_port`].innerText = portName;
        }
    }
    /**
     * MIDI event log for debug purposes
     *
     * @param  {MIDIMessageEvent} midievent - The MIDI message event
     */
    logMidiEvent(midievent) {
        // @debug - Parsing log
        // Filter the Active Sensing messages (254 = 0xFE = 11111110)
        if (midievent.data[0] !== 254) {
            var str = "** Incoming MIDI message [" + midievent.data.length + " bytes]: ";
            for (var i = 0; i < midievent.data.length; i++) {
                str += "0x" + midievent.data[i].toString(16) + " ";
            }
            str += " | received at timestamp: " + timestamp;
            console.log(str);
            console.log("cmd:      " + cmd + " = " + cmd.toString(2));
            console.log("channel:  " + channel + " = " + channel.toString(2));
            console.log("1st byte: " + midievent.data[0] + " = 0x" + midievent.data[0].toString(16).toUpperCase() + " = " + midievent.data[0].toString(2));
            console.log("2nd byte: " + midievent.data[1] + " = 0x" + midievent.data[1].toString(16).toUpperCase() + " = " + midievent.data[1].toString(2));
            console.log("3rd byte: " + midievent.data[2] + " = 0x" + midievent.data[2].toString(16).toUpperCase() + " = " + midievent.data[2].toString(2));
        }
    }
    /**
     * Initialize the UI of the MidiIn instance
     */
    _initUI() {
        //------------------------
        // UI MIDI settings
        //------------------------

        // Default MIDI SETTINGS on UI textboxes
        this.uiElements.in.receiveMode.value = this.dhc.settings.controller.receive_mode;
        this.uiElements.in.receiveModeTsnapTolerance.value = this.dhc.settings.controller.tsnap.tolerance;
        this.uiElements.in.receiveModeTsnapDivider.value = this.dhc.settings.controller.tsnap.divider;
        this.uiElements.in.receiveModeTsnapChanFT.value = this.dhc.settings.controller.tsnap.channel.ft;
        this.uiElements.in.receiveModeTsnapChanHT.options[this.dhc.settings.controller.tsnap.channel.ft].disabled = true;
        this.uiElements.in.receiveModeTsnapChanHT.value = this.dhc.settings.controller.tsnap.channel.ht;
        this.uiElements.in.receiveModeTsnapChanFT.options[this.dhc.settings.controller.tsnap.channel.ht].disabled = true;
        this.uiElements.in.receiveModeTsnapChanDivider.value = this.dhc.settings.controller.tsnap.channel.divider;

        // Set the FT/HT NUMBER RECEIVING MODE from UI HTML inputs
        this.uiElements.in.receiveMode.addEventListener("change", (event) => {
            this.dhc.settings.controller.receive_mode = event.target.value;
            this.switchReceiveModeUI(event.target.value);
        });
        this.uiElements.in.receiveModeTsnapTolerance.addEventListener("input", (event) => {
            this.dhc.settings.controller.tsnap.tolerance = event.target.value;
        });
        this.uiElements.in.receiveModeTsnapDivider.addEventListener("input", (event) => {
            this.dhc.settings.controller.tsnap.divider = event.target.value;
        });
        this.uiElements.in.receiveModeTsnapChanFT.addEventListener("change", (event) => {
            if (event.target.value == this.dhc.settings.controller.tsnap.channel.ht) {
                throw "FT and HT cannot share the same MIDI channel!";
            } else {
                let ht_channels = this.uiElements.in.receiveModeTsnapChanHT;
                for (let opt of ht_channels) { 
                    opt.disabled = false;
                }
                ht_channels.options[event.target.value].disabled = true;
                this.dhc.settings.controller.tsnap.channel.ft = event.target.value;
            }
        });
        this.uiElements.in.receiveModeTsnapChanHT.addEventListener("change", (event) => {
            if (event.target.value == this.dhc.settings.controller.tsnap.channel.ft) {
                throw "FT and HT cannot share the same MIDI channel!";
            } else {
                let ft_channels = this.uiElements.in.receiveModeTsnapChanFT;
                for (let opt of ft_channels) { 
                    opt.disabled = false;
                }
                ft_channels.options[event.target.value].disabled = true;
                this.dhc.settings.controller.tsnap.channel.ht = event.target.value;
            }
        });
        this.uiElements.in.receiveModeTsnapChanDivider.addEventListener("change", (event) => {
            this.dhc.settings.controller.tsnap.channel.divider = event.target.value;
        });
        // Set default FT/HT NUMBER RECEIVING MODE after the UI widgets are set-up
        this.switchReceiveModeUI(this.dhc.settings.controller.receive_mode);
    }   

};
