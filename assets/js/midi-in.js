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
 * The MidiIn class.
 *     Manage MIDI Input messages coming from.
 */
HUM.midi.MidiIn = class {
    /**
    * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
    * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
    */
    constructor(dhc, midi) {
        /**
        * The id of this MidiIn instance (same as the DHC id).
        *
        * @member {string}
        */
        this.id = dhc.id;
        this._id = dhc._id;
        /**
        * The name of the `HUM.MidiIn`, useful for group the parameters on the DB.
        * Currently hard-coded as `"midiIn"`.
        *
        * @member {string}
        */
        this.name = 'midiIn';
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
         * Output queue buffer for MIDI messages that must pass through and go out.
         * (currently can be used for logging/debugging)
         *
         * @todo - Pass through for most of the MIDI messages
         *
         * @member {Array.<OtherMidiMsg>}
         */
        this.midiPassThrough = [];

        /**
        * Instance of `HUM.MidiIn#Parameters`.
        *
        * @member {HUM.MidiIn#Parameters}
        */
        this.parameters = new this.Parameters(this);

        this.parameters._init();

        /**
         * Register of the MIDI Note-On inputs by channel.
         * Actually it's common to all input ports. 
         *
         * @member {Object.<number, Object.<midinnum, MidiInNoteOn>>}
         * 
         * @example
         * // An example of structure of .notes_on[0]
         * 0: {                                   // MIDI Channel.
         *     39: {                              // External MIDI note number (on the instrument).
         *         keymapped: 56,                 // Internal MIDI note number (on the keymap).
         *         midievent: {MIDIMessageEvent}  // The original `MIDIMessageEvent`.
         *     }
         * }
         * 
         * @todo Dynamic, one for each input port,
         *       because currently, two input ports can conflict if they use the same channel.
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

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 0);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manage and route an incoming DHC message.
     * 
     * @param {HUM.DHCmsg} msg - The incoming message.
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
     * Clear the {@link HUM.midi.MidiIn#notes_on} register.
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
     * @param {MIDIMessageEvent} midievent           - The MIDI message from {@link HUM.midi.MidiPorts#midiAccess}.
     * @param {Uint8Array}       midievent.data      - The data array (each entry is a 8bit integer).
     * @param {number}           midievent.timeStamp - The Time-stamp of the message in milliseconds (floating-point number).
     * @param {boolean=}         [deSnapped=false]   - If the Note-Off comes from de-snapping action, by the T-Snap receive mode.<br>
     *                                                 `false`: (default) The note will be turned-off and deleted from the {@link HUM.midi.MidiIn#notes_on} register.
     *                                                 `true`: The note will be turned-off but still remains in the {@link HUM.midi.MidiIn#notes_on} register.
     */
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

        // NOTE: Logging the midievents slows down all the app!
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
                if (this.parameters.receiveMode.value === 'keymap') {
                    ctrlNum = midievent.data[1];
                } else {
                    // Find the controller (internal and keymapped) note number from the incoming midi message
                    // if the midi receiving mode is Tone snap
                    if (this.parameters.receiveMode.value === 'tsnap-channel') {
                        ctrlNum = this.tsnapChannel(midievent.data[1], channel, hancock);
                    } else if (this.parameters.receiveMode.value === 'tsnap-divider') {
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
                this.parameters.pitchbend.amount = pitchbendValue;
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
     * Send a Note-ON over the app.
     *
     * @param {midinnum} ctrlNum    - MIDI note number of the incoming MIDI message.
     * @param {velocity} velocity   - Velocity of the incoming MIDI message.
     * @param {number}   statusByte - Status Byte of the incoming MIDI message (currently not used).
     * @param {number}   timestamp  - Timestamp of the incoming MIDI message (currently not used).
     * @param {boolean}  piper      - If is a note generated by the Piper feature:
     *                                `false`: it's not Piper;
     *                                `true`: it's Piper.
     * @param {boolean}  tsnap      - If is a note translated by the T-Snap receive mode:
     *                                 `false`: it's not T-snapped;
     *                                 `true`: it's T-snapped.
     */
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
     * @param {midinnum} ctrlNum       - MIDI note number of the incoming MIDI message
     * @param {velocity} velocity      - Velocity of the incoming MIDI message
     * @param {number}   statusByte    - Status Byte of the incoming MIDI message
     * @param {number}   timestamp     - Timestamp of the incoming MIDI message (currently not used)
     * @param {boolean=} [panic=false] - It tells that the message has been generated by a "hard" All-Notes-Off request.
     */
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
    tsnapUpdateHT() {
        // Handle the change of FT on TSNAP RECEIVING MODE
        // Ignore handling if 'keymap' receiving mode
        if (this.parameters.receiveMode.value === 'keymap') {
            return;
        } else if (this.parameters.receiveMode.value === 'tsnap-channel') {
            let ht_channel = this.parameters.tsnap.channelMode.chanHT.value;
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

        } else if (this.parameters.receiveMode.value === 'tsnap-divider') {
            // @todo - to fix: ht_channel is from tsnap-channel mode!!! (no more omni!)
            let divider_channel = this.parameters.tsnap.dividerMode.chan.value;
            let notes_on = this.notes_on[divider_channel];

            // For every notes-on
            for (let external of Object.keys(notes_on)) {
                // If it's HT
                if (this.parameters.tsnap.dividerMode.divKey.value < external) {
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
     * Check if a frequency of a MIDI Note Number corresponds to a Harmonic (or Subharmonic) in the HT table under {@link HUM.DHC#tables}.
     * 
     * @param {midinnum} midiNoteNum - The MIDI Note Number to be found in the reverse table.
     * @param {tonetype} type        - The type of tone (FT or HT).
     *
     * @returns {(false|midinnum)} - Returns the keymapped MIDI Note Number that match the nearest HT to the incoming Note; if nothing is found, returns `false`
     */
    tsnapFindCtrlNoteNumber(midiNoteNum, type) {  
        let table_keys_array =  Object.keys(this.dhc.tables.reverse[type]); 
        let closest_mc = table_keys_array.reduce((prev, curr) => {
            // @todo: snap to a different tone if two tones are at the same distance
            let result = (Math.abs(curr - midiNoteNum) < Math.abs(prev - midiNoteNum) ? curr : prev);
            if (Math.abs(result - midiNoteNum) > this.parameters.tsnap.tolerance.value) {
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
     * 
     * @param {midinnum} midiNoteNum - The MIDI Note Number to be found in the reverse table.
     * @param {midichan} channel     - The MIDI Channel from which the message is coming from.
     * @param {boolean}  hancock     - If the message comes from the Hancock virtual MIDI input (if it's `true` ignore and don't apply T-Snap).
     *
     * @returns {(false|midinnum)} - Returns the keymapped MIDI Note Number that match the nearest HT to the incoming Note; if nothing is found, returns `false`.
     */
    tsnapChannel(midiNoteNum, channel, hancock) {
        if (hancock === true) {
            return midiNoteNum;
        } else {
            if (this.parameters.tsnap.channelMode.chanFT.value == channel) {
                return this.tsnapFindCtrlNoteNumber(midiNoteNum, 'ft');
            }
            else if (this.parameters.tsnap.channelMode.chanHT.value == channel) {
                return this.tsnapFindCtrlNoteNumber(midiNoteNum, 'ht');
            } else {
                return false;
            }
        }
    }
    /**
     * Tone Snap Divider receive mode router. Route messages accordingly to the divider MIDI Note Number.
     * 
     * @param {midinnum} midiNoteNum - The MIDI Note Number to be found in the reverse table.
     * @param {midichan} channel     - The MIDI Channel from which the message is coming from.
     * @param {boolean}  hancock     - If the message comes from the Hancock virtual MIDI input (if it's `true` ignore and don't apply T-Snap).
     *
     * @returns {(false|midinnum)} - Returns the keymapped MIDI Note Number that match the nearest HT to the incoming Note; if nothing is found, returns `false`.
     */
    tsnapDivider(midiNoteNum, channel, hancock) {
        if (hancock === true) {
            return midiNoteNum;
        } else {
            if (this.parameters.tsnap.dividerMode.chan.value == channel) {
                if (this.parameters.tsnap.dividerMode.divKey.value >= midiNoteNum) {
                    return this.tsnapFindCtrlNoteNumber(midiNoteNum, 'ft');
                }
                else if (this.parameters.tsnap.dividerMode.divKey.value < midiNoteNum) {
                    return this.tsnapFindCtrlNoteNumber(midiNoteNum, 'ht');
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
     * Switch the MIDI INPUT RECEIVING MODE (called when UI is updated).
     *
     * @param {('keymap'|'tsnap-channel'|'tsnap-divider')} receive_mode - FT/HT controller note receiving mode.
     */
    switchReceiveModeUI(receiveMode) {
        let tsnap_tolerance = this.parameters.tsnap.tolerance.uiElements.out.midiTsnapTolerance_box,
            tsnap_chanFT = this.parameters.tsnap.channelMode.chanFT.uiElements.out.midiTsnapChanFT_box,
            tsnap_chanHT = this.parameters.tsnap.channelMode.chanHT.uiElements.out.midiTsnapChanHT_box,
            tsnap_divider_key = this.parameters.tsnap.dividerMode.divKey.uiElements.out.midiTsnapDividerKey_box,
            tsnap_divider_chan = this.parameters.tsnap.dividerMode.chan.uiElements.out.midiTsnapDividerChan_box;
        
        if (receiveMode === "keymap") {
            tsnap_tolerance.style.display = "none";
            tsnap_chanFT.style.display = "none";
            tsnap_chanHT.style.display = "none";
            tsnap_divider_key.style.display = "none";
            tsnap_divider_chan.style.display = "none";
        } else if (receiveMode === "tsnap-channel") {
            tsnap_tolerance.style.display = "flex";
            tsnap_chanFT.style.display = "flex";
            tsnap_chanHT.style.display = "flex";
            tsnap_divider_key.style.display = "none";
            tsnap_divider_chan.style.display = "none";
        } else if (receiveMode === "tsnap-divider") {
            tsnap_tolerance.style.display = "flex";
            tsnap_chanFT.style.display = "none";
            tsnap_chanHT.style.display = "none";
            tsnap_divider_key.style.display = "flex";
            tsnap_divider_chan.style.display = "flex";
        } else {
            let error = "The 'HTMLi_midiReceiveMode' HTML element has an unexpected value: " + receiveMode;
            throw error;
        }
    }

    /**
     * MIDI-IN MONITOR
     *
     * @param {midinnum} noteNumber - MIDI Note number (or conversion string if the Tone snapping receiving mode is active).
     * @param {velocity} velocity   - MIDI Velocity amount.
     * @param {midichan} channel    - MIDI Channel number.
     * @param {string}   portName   - MIDI Port name.
     */
    monitorMidiIN(noteNumber, velocity, channel, portName) {
        let dhcID = this.dhc.id;
        // Update the log on MIDI MONITOR on the UI
        for (let x of [0,1]) {
            this.parameters.monitor.note.value = noteNumber;
            this.parameters.monitor.velocity.value = velocity;
            this.parameters.monitor.channel.value = channel + 1;
            this.parameters.monitor.port.value = portName;
        }
    }

    // /**
    //  * MIDI event log for debug purposes,
    //  *
    //  * @param  {MIDIMessageEvent} midievent - The MIDI message event.
    //  */
    // logMidiEvent(midievent) {
    //     // @debug - Parsing log
    //     // Filter the Active Sensing messages (254 = 0xFE = 11111110)
    //     if (midievent.data[0] !== 254) {
    //         var str = "** Incoming MIDI message [" + midievent.data.length + " bytes]: ";
    //         for (var i = 0; i < midievent.data.length; i++) {
    //             str += "0x" + midievent.data[i].toString(16) + " ";
    //         }
    //         str += " | received at timestamp: " + timestamp;
    //         console.log(str);
    //         console.log("cmd:      " + cmd + " = " + cmd.toString(2));
    //         console.log("channel:  " + channel + " = " + channel.toString(2));
    //         console.log("1st byte: " + midievent.data[0] + " = 0x" + midievent.data[0].toString(16).toUpperCase() + " = " + midievent.data[0].toString(2));
    //         console.log("2nd byte: " + midievent.data[1] + " = 0x" + midievent.data[1].toString(16).toUpperCase() + " = " + midievent.data[1].toString(2));
    //         console.log("3rd byte: " + midievent.data[2] + " = 0x" + midievent.data[2].toString(16).toUpperCase() + " = " + midievent.data[2].toString(2));
    //     }
    // }

};

/** 
 * Instance class-container used to create all the `HUM.Param` objects for the `HUM.midi.MidiIn` instance.
 */
HUM.midi.MidiIn.prototype.Parameters = class {
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
             * It's initialises the eventListener of the UIelem related to it.
             * It's stored on the DB.
             * @todo - Move to midi-in (one per input channel?)
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {cent}        value                            - Pitchbend range value in cents (use hundreds when use MIDI-OUT and possibly the same as the instrument).
             * @property {Object}      uiElements                       - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                    - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.midiPitchbendRange - The HTML input text box for the pitchbend range number.
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
                 * @property {HTMLElement} uiElements.in.midiTsnapDividerChan     - The HTML input box widget for the Divider key.
                 * @property {HTMLElement} uiElements.in.midiTsnapDividerChan_box - The HTML box container for the Divider key.
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
                            widget:'number',
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
                 * @property {HTMLElement} uiElements.in.midiTsnapChanFT     - The HTML input box widget for the Divider key.
                 * @property {HTMLElement} uiElements.in.midiTsnapChanFT_box - The HTML box container for the Divider key.
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
                            widget:'number',
                        }),
                        'midiTsnapChanFT_box': new HUM.Param.UIelem({
                            role: 'out',
                        }),
                    },
                    dataType:'integer',
                    initValue: 1,
                    allowedValues: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
                    init:false,
                    postSet: (value, thisParam) => {
                        if (value == this.tsnap.channelMode.chanHT.value) {
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
                 * @property {HTMLElement} uiElements.in.midiTsnapChanHT     - The HTML input box widget for the Divider key.
                 * @property {HTMLElement} uiElements.in.midiTsnapChanHT_box - The HTML box container for the Divider key.
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
                            widget:'number',
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
                        if (value == this.tsnap.channelMode.chanFT.value) {
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
             * @property {midichan}    value                            - The MIDI number of the channel for HTs.
             * @property {Object}      uiElements                       - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                   - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_note - The HTML input box widget for the Divider key.
             * @property {HTMLElement} uiElements.out.midiMonitor1_note - The HTML box container for the Divider key.
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
             * @property {midichan}    value                                - The MIDI number of the channel for HTs.
             * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                       - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_velocity - The HTML input box widget for the Divider key.
             * @property {HTMLElement} uiElements.out.midiMonitor1_velocity - The HTML box container for the Divider key.
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
             * @property {midichan}    value                                - The MIDI number of the channel for HTs.
             * @property {Object}      uiElements                           - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                       - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_channel - The HTML input box widget for the Divider key.
             * @property {HTMLElement} uiElements.out.midiMonitor1_channel - The HTML box container for the Divider key.
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
             * @property {midichan}    value                            - The MIDI number of the channel for HTs.
             * @property {Object}      uiElements                       - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.out                   - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.out.midiMonitor0_port - The HTML input box widget for the Divider key.
             * @property {HTMLElement} uiElements.out.midiMonitor1_port - The HTML box container for the Divider key.
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
     * Initializes the parameters of the Tone Snap note-receiving mode.
     */
    _init() {
        this.tsnap.channelMode.chanFT._init();
        this.tsnap.channelMode.chanHT._init();
        this.receiveMode._init();
    }
};