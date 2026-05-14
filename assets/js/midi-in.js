/**
 * @fileoverview MIDI Input handler for the Harmonicarium application.
 * This file defines the {@link HUM.midi.MidiIn} class which receives and processes
 * all incoming MIDI messages, routing note events to the DHC and handling
 * receive modes including direct keymap mapping and Tone Snap (T-Snap).
 * The sub-components are defined in the companion file:
 * - {@link module:midi-in-parameters} — `HUM.midi.MidiIn.prototype.Parameters` class
 *
 * @module midi-in
 * @memberof HUM.midi
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
 * MIDI Input message handler for a DHC instance.
 *
 * @class
 * @memberof HUM.midi
 *
 * @description
 * The `HUM.midi.MidiIn` class processes all MIDI messages arriving from physical
 * or virtual input devices. It handles:
 * - Parsing raw MIDI status bytes to extract command, channel, and data
 * - Routing Note-On/Off messages to the DHC via {@link HUM.midi.MidiIn#playTone} and {@link HUM.midi.MidiIn#muteTone}
 * - Supporting three receive modes: `keymap` (direct mapping), `tsnap-channel` (channel-based tone snapping), and `tsnap-divider` (key-divider tone snapping)
 * - Tracking active notes per channel in the {@link HUM.midi.MidiIn#notes_on} register
 * - Processing Pitch Bend and Control Change messages
 * - Updating the MIDI input monitor display
 *
 * The {@link HUM.midi.MidiIn.prototype.Parameters|Parameters} inner class is
 * defined in the companion {@link module:midi-in-parameters} file and
 * attached to `HUM.midi.MidiIn.prototype` at load time.
 *
 * @see {@link https://webaudio.github.io/web-midi-api/|Web MIDI API}
 */
HUM.midi.MidiIn = class {
    /**
     * Creates a new MidiIn instance and binds it to the given DHC and MidiHub.
     *
     * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
     * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
     *
     * @description
     * Initializes the MidiIn handler by:
     * 1. Setting up identification and references to the parent DHC and MidiHub instances
     * 2. Initializing the MIDI pass-through output buffer
     * 3. Creating and initializing the parameter management system
     * 4. Initializing the {@link HUM.midi.MidiIn#notes_on} register for all 16 MIDI channels
     * 5. Registering this instance as a DHC subscriber for real-time updates
     */
    constructor(dhc, midi) {
        /**
         * The id of this MidiIn instance (same as the DHC id).
         *
         * @member {string}
         */
        this.id = dhc.id;
        /**
         * Internal reference to the DHC instance ID.
         *
         * @member {string}
         * @private
         */
        this._id = dhc._id;
        /**
         * The name of the `HUM.midi.MidiIn`, useful for grouping the parameters on the DB.
         * Currently hard-coded as `"midiIn"`.
         *
         * @member {string}
         */
        this.name = 'midiIn';
        /**
         * The DHC instance.
         *
         * @member {HUM.DHC}
         */
        this.dhc = dhc;
        /**
         * The MidiHub instance.
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
         * Instance of `HUM.midi.MidiIn#Parameters`.
         *
         * @member {HUM.MidiIn#Parameters}
         * @member {HUM.midi.MidiIn.prototype.Parameters}
         */
        this.parameters = new this.Parameters(this);

        this.parameters._init();

        /**
         * @typedef {Object} MidiInNoteOn
         *
         * @description
         * An entry in the {@link HUM.midi.MidiIn#notes_on} register tracking an active Note-On input.
         *
         * @property {midinnum}         keymapped - The MIDI note number on the keymap (internal).
         * @property {MIDIMessageEvent} midievent - The original MIDI event containing the note-on message.
         */

        /**
         * Register of active MIDI Note-On inputs, indexed by channel then by external MIDI note number.
         * Currently shared across all input ports.
         *
         * @member {Object.<number, Object.<midinnum, MidiInNoteOn>>}
         *
         * @example
         * // Structure of .notes_on[0]
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
     * Manages and routes an incoming DHC message to the appropriate handler.
     *
     * @param {HUM.DHCmsg} msg - The incoming message from the DHC.
     *
     * @returns {void}
     *
     * @description
     * Handles the following message commands:
     * - `panic`: Calls {@link HUM.midi.MidiIn#allNotesOff} to clear the notes-on register.
     * - `update/ft`: Reserved for future FT-change handling; currently a no-op.
     * - `update/ht`: Calls {@link HUM.midi.MidiIn#tsnapUpdateHT} to re-evaluate T-Snap mappings when the HT table changes.
     * - `update/ctrlmap`: No action; keymap changes do not require MIDI-In reconfiguration.
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
     * Clears all active Note-On entries from the {@link HUM.midi.MidiIn#notes_on} register.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all 16 MIDI channels and resets their entry in the notes-on
     * register to an empty object, effectively forgetting all currently pressed notes.
     * Called in response to a `panic` DHC message.
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
     * Handles and dispatches an incoming MIDI message.
     *
     * @param {MIDIMessageEvent} midievent           - The MIDI message from {@link HUM.midi.MidiPorts#midiAccess}.
     * @param {Uint8Array}       midievent.data      - The data array (each entry is an 8-bit integer).
     * @param {number}           midievent.timeStamp - The timestamp of the message in milliseconds (floating-point number).
     * @param {boolean}          [deSnapped=false]   - If the Note-Off originates from a T-Snap de-snapping action:
     *                                                 `false` (default): the note is turned off and deleted from the {@link HUM.midi.MidiIn#notes_on} register.
     *                                                 `true`: the note is turned off but its entry is retained in the register.
     *
     * @returns {void}
     *
     * @description
     * Parses the MIDI status byte to extract the command nibble and channel, then
     * dispatches accordingly:
     * - **Note-On / Note-Off** (cmd `0x8` / `0x9`): Applies the active receive mode
     *   (keymap, tsnap-channel, or tsnap-divider) to resolve the controller note number,
     *   then calls {@link HUM.midi.MidiIn#muteTone} or {@link HUM.midi.MidiIn#playTone}.
     * - **Control Change** (cmd `0xB`): Handles All-Notes-Off (CC 123).
     * - **Pitch Bend** (cmd `0xE`): Updates the pitchbend amount and refreshes synth voices.
     * - Active Sensing messages (0xFE) are silently discarded.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#MIDIMessageEvent|Web MIDI API specs}
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
     * Sends a Note-ON event through the DHC for the given controller key.
     *
     * @param {midinnum} ctrlNum    - MIDI note number of the incoming MIDI message.
     * @param {velocity} velocity   - Velocity of the incoming MIDI message.
     * @param {number}   statusByte - Status Byte of the incoming MIDI message (currently not used).
     * @param {number}   timestamp  - Timestamp of the incoming MIDI message (currently not used).
     * @param {boolean}  piper      - Whether the note was generated by the Piper feature:
     *                                `false` — not a Piper note;
     *                                `true` — generated by Piper (prevents looping).
     * @param {boolean}  tsnap      - Whether the note was translated by the T-Snap receive mode:
     *                                `false` — not T-snapped;
     *                                `true` — T-snapped.
     *
     * @returns {void}
     *
     * @description
     * Looks up `ctrlNum` in the controller keymap (`dhc.tables.ctrl`). If found,
     * calls {@link HUM.DHC#playFT} for any assigned FT and {@link HUM.DHC#playHT}
     * for any assigned HT. Keys not present in the keymap are silently ignored.
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
     * Sends a Note-OFF event through the DHC for the given controller key.
     *
     * @param {midinnum} ctrlNum      - MIDI note number of the incoming MIDI message.
     * @param {velocity} velocity     - Velocity of the incoming MIDI message.
     * @param {number}   statusByte   - Status Byte of the incoming MIDI message.
     * @param {number}   timestamp    - Timestamp of the incoming MIDI message (currently not used).
     * @param {boolean}  [panic=false] - Whether the note-off was triggered by a "hard" All-Notes-Off request.
     *
     * @returns {void}
     *
     * @description
     * Looks up `ctrlNum` in the controller keymap (`dhc.tables.ctrl`). If found,
     * calls {@link HUM.DHC#muteFT} for any assigned FT and {@link HUM.DHC#muteHT}
     * for any assigned HT. Keys not present in the keymap are silently ignored.
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
     * Re-evaluates all currently pressed keys against the updated HT table when T-Snap is active.
     *
     * @returns {void}
     *
     * @description
     * Should be called whenever the HT table at {@link HUM.DHC#tables} changes.
     * For each note currently held in {@link HUM.midi.MidiIn#notes_on}, the method
     * re-runs the T-Snap routing to find the new controller note number:
     * - If the new mapping resolves to `false` (no matching HT within tolerance),
     *   the note is silently turned off and removed from the register.
     * - If a valid mapping is found, the note is turned off and immediately
     *   re-triggered with the updated pitch assignment.
     *
     * This ensures that physically held keys seamlessly follow changes to the
     * Harmonic Series in real-time. Has no effect when `receiveMode` is `'keymap'`.
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
     * Finds the controller note number whose frequency is closest to a given MIDI note number.
     *
     * @param {midinnum} midiNoteNum - The incoming MIDI note number (in midicents) to match against the reverse table.
     * @param {tonetype} type        - The type of tone to search: `'ft'` for Fundamental Tones or `'ht'` for Harmonic Tones.
     *
     * @returns {(false|midinnum)} The keymapped MIDI note number for the nearest matching tone within the snap tolerance,
     *                             or `false` if no tone is close enough.
     *
     * @description
     * Searches the DHC reverse table (`dhc.tables.reverse[type]`) for the entry
     * whose midicent value is closest to `midiNoteNum`. If the nearest entry is
     * within the configured {@link HUM.midi.MidiIn.prototype.Parameters#tsnap} tolerance,
     * the corresponding keymap entry is returned; otherwise `false` is returned.
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
     * Routes an incoming note through the T-Snap Channel receive mode.
     *
     * @param {midinnum} midiNoteNum - The incoming MIDI note number to resolve against the reverse table.
     * @param {midichan} channel     - The MIDI channel on which the message arrived.
     * @param {boolean}  hancock     - Whether the message originates from the Hancock virtual MIDI input;
     *                                 if `true`, T-Snap is bypassed and `midiNoteNum` is returned as-is.
     *
     * @returns {(false|midinnum)} The keymapped MIDI note number for the nearest matching tone within the snap tolerance,
     *                             or `false` if the channel does not match either the FT or HT channel.
     *
     * @description
     * Determines whether `channel` corresponds to the configured FT channel or HT channel
     * and delegates to {@link HUM.midi.MidiIn#tsnapFindCtrlNoteNumber} with the appropriate
     * tone type. Returns `false` for any channel that matches neither.
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
     * Routes an incoming note through the T-Snap Divider receive mode.
     *
     * @param {midinnum} midiNoteNum - The incoming MIDI note number to resolve against the reverse table.
     * @param {midichan} channel     - The MIDI channel on which the message arrived.
     * @param {boolean}  hancock     - Whether the message originates from the Hancock virtual MIDI input;
     *                                 if `true`, T-Snap is bypassed and `midiNoteNum` is returned as-is.
     *
     * @returns {(false|midinnum)} The keymapped MIDI note number for the nearest matching tone within the snap tolerance,
     *                             or `false` if no match is found.
     *
     * @description
     * Uses the configured divider key (`tsnap.dividerMode.divKey`) to split the MIDI note
     * range: notes at or below the divider are treated as FTs, and notes above it are treated
     * as HTs. Delegates to {@link HUM.midi.MidiIn#tsnapFindCtrlNoteNumber} with the appropriate
     * tone type. Only processes messages on the configured divider channel.
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
     * Updates the UI visibility of T-Snap settings panels when the receive mode changes.
     *
     * @param {('keymap'|'tsnap-channel'|'tsnap-divider')} receiveMode - The newly selected note-receiving mode.
     *
     * @returns {void}
     *
     * @description
     * Shows or hides the tolerance, channel, and divider UI boxes to match the
     * active receive mode:
     * - `keymap`: hides all T-Snap controls.
     * - `tsnap-channel`: shows tolerance, FT channel, and HT channel selectors.
     * - `tsnap-divider`: shows tolerance, divider key, and divider channel selectors.
     *
     * @throws {string} Throws an error string if `receiveMode` is not one of the expected values.
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
     * Updates the MIDI Input monitor display with data from the latest received note message.
     *
     * @param {(midinnum|string)} noteNumber - MIDI note number, or a conversion string (e.g. `"39>56"`) when T-Snap is active.
     * @param {velocity}          velocity   - MIDI velocity of the note.
     * @param {midichan}          channel    - MIDI channel number (0-based).
     * @param {string}            portName   - Name of the MIDI input port.
     *
     * @returns {void}
     *
     * @description
     * Writes the note, velocity, channel, and port values to the corresponding
     * {@link HUM.Param} output elements, updating both monitor instances in the UI.
     * Piper-generated messages are excluded from the monitor upstream in
     * {@link HUM.midi.MidiIn#midiMessageReceived}.
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
