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
 * @fileoverview MIDI-IN HANDLER<br>
 *     Parse the MIDI-IN message and do the consequent action.
 * 
 * @author Walter Mantovani < armonici.it [at] gmail [dot] com >
 */

/* exported icMidiMessageReceived */

"use strict";

/*==============================================================================*
 * MAIN MIDI MESSAGE HANDLER
 *==============================================================================*/

/**
 * Output queue buffer for MIDI messages that must pass through and go out
 *     (used as logger at the moment)
 *
 * @todo - Pass through for most of the MIDI messages
 *
 * @type {Array.<OtherMidiMsg>}
 */
var icMidiPassThrough = [];

/**
 * Handle the incoming MIDI messages
 *
 * @param {MIDIMessageEvent} midievent           - The MIDI message from {@link icMidi}; see {@link https://webaudio.github.io/web-midi-api/#MIDIMessageEvent|Web MIDI API specs}
 * @param {Uint8Array}       midievent.data      - The data array (each entry is a 8bit integer)
 * @param {number}           midievent.timeStamp - The Time-stamp of the message in milliseconds (floating-point number)
 */
function icMidiMessageReceived(midievent) {
    // Divide the informations contained in the first byte (Status byte)
    // 4 bits bitwise shift to the right to get the remaining 4 bits representing
    // the command (the type of MIDI message)
    var cmd = midievent.data[0] >> 4;
    // Set to zero the first 4 bits from left and get the channel
    var channel = midievent.data[0] & 0xf;
    // Set the timestamp
    var timestamp = midievent.timeStamp;

    // Handle Piper feature (fake midievent)
    // Default: is not a Piper midievent
    var piper = false;
    // Special 4th byte in the 'midievent' containing 'piper' tag
    if (midievent.data[3] === "piper") {
        // If it's a Piper's fake midievent
        piper = true;
    }

    // @debug - Parsing log
    // Filter the Active Sensing messages (254 = 0xFE = 11111110)
    // if (midievent.data[0] !== 254) {
    //     var str = "** Incoming MIDI message [" + midievent.data.length + " bytes]: ";
    //     for (var i = 0; i < midievent.data.length; i++) {
    //         str += "0x" + midievent.data[i].toString(16) + " ";
    //     }
    //     str += " | received at timestamp: " + timestamp;
    //     console.log(str);
    //     console.log("cmd:      " + cmd + " = " + cmd.toString(2));
    //     console.log("channel:  " + channel + " = " + channel.toString(2));
    //     console.log("1st byte: " + midievent.data[0] + " = 0x" + midievent.data[0].toString(16).toUpperCase() + " = " + midievent.data[0].toString(2));
    //     console.log("2nd byte: " + midievent.data[1] + " = 0x" + midievent.data[1].toString(16).toUpperCase() + " = " + midievent.data[1].toString(2));
    //     console.log("3rd byte: " + midievent.data[2] + " = 0x" + midievent.data[2].toString(16).toUpperCase() + " = " + midievent.data[2].toString(2));
    // }

    // Check 'cmd' (the first 4 bits of the 1st byte of the message)
    // If >= 0x80 it's a Status byte
    // Filter the Active Sensing messages (254 = 0xFE = 11111110)
    if (cmd > 7 && midievent.data[0] !== 254) {

        // @todo - implement RUNNING STATUS (status byte not repeated on every message)
        // If the message has at least 3 bytes
        // if (midievent.data.length > 2) {
        //     // Read the velocity from the 3rd byte
        //     velocity = midievent.data[2];
        // }

        // @todo - implement TRANSMISSION ERRORS HANDLING

        // Note OFF (MIDI note-on with velocity=0 is the same as note-off)
        if (cmd === 8 || ((cmd === 9) && (midievent.data[2] === 0))) {
            icNoteOFF(midievent.data[1], midievent.data[2], midievent.data[0], midievent.timeStamp);
        // Note ON
        } else if (cmd === 9) {
            // Call note on function
            // Pass the 'piper' argument to avoid loop of Piper's fake midievents
            // 'statusByte' is useful to the Piper, and with 'timestamp' will be used for MIDI-OUT
            icNoteON(midievent.data[1], midievent.data[2], midievent.data[0], midievent.timeStamp, piper);
            // Do not MIDI monitor if it's a Piper's fake midievent (FT0)
            if (piper === false) {
                icMIDImonitor(midievent.data[1], midievent.data[2], channel, midievent.srcElement.name);
            }
        // Control Change message or Selects Channel Mode message
        } else if (cmd === 11) {
            // controller(noteNumber, velocity);
            console.log("Incoming MIDI > type: Controller message");
        // Pitch Bend Change message
        } else if (cmd === 14) {
            // Handle pitchbend message
            let pitchbendValue = ((midievent.data[2] * 128 + midievent.data[1]) - 8192) / 8192;
            // Store the pitchbend value into global slot: value normalized to [-1 > 0,99987792968750]
            icDHC.settings.controller.pb_amount = pitchbendValue;
            // Update the Synth voices frequencies
            icSynthPitchBend();
            // Update the UI Monitors
            icMONITORSinit();
        // Other type of MIDI message
        } else {
            console.log("Incoming MIDI > type: Other message...");
            // @todo - Any other type of message pass through and go out
            /**
             * A MIDI message (data + timestamp)
             * 
             * @typedef {Array} OtherMidiMsg
             *
             * @property {Uint8Array} 0 - Message; an array of 8-bit unsigned integers
             * @property {number}     1 - Time-stamp; a floating point number
             */
            icMidiPassThrough.push( [midievent.data, timestamp] );
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
 * @param {number}   ctrlNoteNumber - MIDI note number of the incoming MIDI message
 * @param {number}   velocity       - Velocity of the incoming MIDI message
 * @param {number}   statusByte     - Status Byte of the incoming MIDI message
 * @param {number}   timestamp      - Timestamp of the incoming MIDI message (currently not used)
 * @param {boolean}  piper          - If is a note generated by the Piper feature; 'false' it's not Piper, 'true' it's Piper
 */
function icNoteON(ctrlNoteNumber, velocity, statusByte, timestamp, piper) {
    // Get frequency and midi.cents assigned to the incoming MIDI key (ctrlNoteNumber)
    // If the input MIDI key is in the ctrl_map, proceed
    if (icDHC.tables.ctrl_map[ctrlNoteNumber]) {
        
        // Vars for a better reading
        var ft = icDHC.tables.ctrl_map[ctrlNoteNumber].ft;
        var ht = icDHC.tables.ctrl_map[ctrlNoteNumber].ht;

        // **FT**
        // If the key is mapped to a Fundamental Tone 
        if (ft !== 129) {
            // Get its frequency and midi.cents 
            var ftObj = icDHC.tables.ft_table[ft];
            // Recalculate the ht_table passing the frequency (Hz)
            icDHC.tables.ht_table = icHTtableCreate(ftObj.hz);
            for (let t in icDHC.tables.ftKeyQueue) {
                // If the key is already pressed
                if (icDHC.tables.ftKeyQueue[t][ft]) {
                    // Search the FT number in the ftKeyQueue array
                    var position = icDHC.tables.ftKeyQueue.findIndex(p => p[ft]);
                    // If the FTn exist
                    if (position !== -1) {
                        // Send VoiceOFF to the Synth
                        icVoiceOFF(icDHC.tables.ftKeyQueue[t][ft][1], "ft");
                        icMIDIout(statusByte, ctrlNoteNumber, ft, ftObj, velocity, 0, "ft");
                        // Remove the FTn from the ftKeyQueue array
                        icDHC.tables.ftKeyQueue.splice(position, 1);
                    // If the FTn does not exist
                    } else {
                        console.log("STRANGE: there is NOT a FT pressed key #:", ft);
                    }
                }
            }
            // Send VoiceON to the Synth
            icVoiceON(ftObj.hz, ctrlNoteNumber, velocity, "ft");
            icMIDIout(statusByte, ctrlNoteNumber, ft, ftObj, velocity, 1, "ft");
            if (icDHC.settings.ht.curr_ft !== ft) {
                icUpdateMIDInoteON("ht");
            }
            // Store the current FT into the global slot for future HT table re-computations and UI monitor updates
            icDHC.settings.ht.curr_ft = ft;
            // Add to the Key Queue the infos about the current pressed FT key (to manage monophony)
            icDHC.tables.ftKeyQueue.push( { [ft]: [ftObj.hz, ctrlNoteNumber, velocity] } );
            // Update the UI
            icDHCmonitor(ft, ftObj, "ft");
            icHSTACKfillin();
            icHSTACKmonitor("ft", 1);
        }

        // **HT**
        // If the key is mapped to a Harmonic Tone (or subharmonic) 
        if (ht !== 129) {
            // If it's a normal HT
            if (ht !== 0) {
                var htObj = icDHC.tables.ht_table[ht];
                // Store the current HT into the global slot for future UI monitor updates
                icDHC.settings.ht.curr_ht = ht;
                // Send VoiceON to the Synth
                icVoiceON(htObj.hz, ctrlNoteNumber, velocity, "ht");
                icMIDIout(statusByte, ctrlNoteNumber, ht, htObj, velocity, 1, "ht");
                // If the Note ON is not a Piper's fake midievent (FT0)
                if (piper === false) {
                    // Add the HT to the Pipe
                    icPiper(statusByte, ctrlNoteNumber, velocity, "ht");
                }
                // Update the UI
                icDHCmonitor(ht, htObj, "ht");
                icHSTACKmonitor("ht", 1, ht);
            // If HT0 is pressed, it's the Piper feature!
            } else if (ht === 0) {
                // Note ON the next piped HT
                icPiping(1);
            }
        }

        // **FT+HT**
        // @todo - Implement the controller-key mapped both to an FT and HT
        
    // If the input MIDI key is NOT in the ctrl_map, the message stop here
    } else {
        icEventLog("The pressed KEY on the CONTROLLER is not assigned on the current KEYMAP.");
    }
    // Turn on the key on the virtual piano
    icKeyON(ctrlNoteNumber);
}

/**
 * Send a Note-OFF over the app
 *
 * @param {number} ctrlNoteNumber - MIDI note number of the incoming MIDI message
 * @param {number} velocity       - Velocity of the incoming MIDI message
 * @param {number} statusByte     - Status Byte of the incoming MIDI message
 * @param {number} timestamp      - Timestamp of the incoming MIDI message (currently not used)
 */
function icNoteOFF(ctrlNoteNumber, velocity, statusByte, timestamp) {
       // If the input MIDI key is in the ctrl_map, proceed
    if (icDHC.tables.ctrl_map[ctrlNoteNumber]) {
        
        // Vars for a better reading
        let ft = icDHC.tables.ctrl_map[ctrlNoteNumber].ft;
        let ht = icDHC.tables.ctrl_map[ctrlNoteNumber].ht;

        // **FT**
        // If the key is mapped to a Fundamental Tone
        if (ft !== 129) {
            // Get frequency and midi.cents for MIDI-OUT polyphony handling
            var ftObj = icDHC.tables.ft_table[ft];
            // Search the FT number in the ftKeyQueue array
            var position = icDHC.tables.ftKeyQueue.findIndex(p => p[ft]);
            // If the FTn exist
            if (position !== -1) {
                // Remove the FTn from the ftKeyQueue array
                icDHC.tables.ftKeyQueue.splice(position, 1);
            // If the FTn does not exist
            } else {
                console.log("STRANGE: there is NOT a FT pressed key #:", ft);
            }
            // If there are no more notes in the ftKeyQueue array
            if (icDHC.tables.ftKeyQueue.length === 0) {
                // Send VoiceOFF to the Synth
                icVoiceOFF(ctrlNoteNumber, "ft");
                icMIDIout(statusByte, ctrlNoteNumber, ft, ftObj, velocity, 0, "ft");
                icHSTACKmonitor("ft", 0);
            // Else (if there are other notes) read and play the next note on the ftKeyQueue array
            } else {
                let nextIndex = icDHC.tables.ftKeyQueue.length - 1;
                let nextTone = [];
                // Read the next FT
                // @todo - remove this "for...in"
                for( let t in icDHC.tables.ftKeyQueue[nextIndex]) {
                    nextTone = icDHC.tables.ftKeyQueue[nextIndex][t];
                    nextTone.ft = t;
                }
                // If the next tone is NOT the active one
                if (nextTone.ft != icDHC.settings.ht.curr_ft) {
                    // Send VoiceOFF to the Synth
                    icVoiceOFF(ctrlNoteNumber, "ft");
                    icMIDIout(statusByte, ctrlNoteNumber, ft, ftObj, velocity, 0, "ft");
                    // Get frequency and midi.cents for MIDI-OUT polyphony handling
                    var ftNextArr = icDHC.tables.ft_table[nextTone.ft];
                    // Recalculate the ht_table passing the frequency (Hz)
                    icDHC.tables.ht_table = icHTtableCreate(nextTone[0]);
                    // Store the current FT into the global slot for future HT table re-computations and UI monitor updates
                    icDHC.settings.ht.curr_ft = nextTone.ft;
                    // Send VoiceON to the Synth
                    icVoiceON(nextTone[0], nextTone[1], nextTone[2], "ft");
                    icMIDIout(statusByte, nextTone[1], nextTone.ft, ftNextArr, nextTone[2], 1, "ft");
                    // Update the UI
                    icDHCmonitor(nextTone.ft, ftObj, "ft");
                    icHSTACKfillin();
                    icHSTACKmonitor("ft", 1);
                }
            }
        }
        
        // **HT**
        // If the key is mapped to a Harmonic Tone
        if (ht !== 129) {
            // If it's a normal HT
            if (ht !== 0) {
                var htObj = icDHC.tables.ht_table[ht];
                // Send VoiceOFF to the Synth
                icVoiceOFF(ctrlNoteNumber, "ht");
                icMIDIout(statusByte, ctrlNoteNumber, ht, htObj, velocity, 0, "ht");
                // Update the UI
                icHSTACKmonitor("ht", 0, ht);
            // If HT0 is pressed, it's the Piper feature
            } else if (ht === 0) {
                // Note OFF the active piped HT
                icPiping(0);
            }
        }
    }
    // Turn off the key on the virtual piano
    icKeyOFF(ctrlNoteNumber);
}

/*==============================================================================*
 * PIPER HT0 FEATURE
 * The Piper store the last N pressed HTs and repeat them when HT0 is pressed
 * simulating a special fake MIDI message
 *==============================================================================*/

/**
 * Piper's default settings
 *
 * @namespace
 *
 * @property {number} maxLenght - How many steps has the Pipe
 * @property {Array}  queue     - Last HT MIDI Note-ON messages received
 * @property {Array}  pipe      - MIDI Note-ON messages stored into the Pipe
 * @property {number} currStep  - Last step played by the Piper
 * @property {Array}  currTone  - Last fake MIDI Note-ON message send
 */
var icPipe = {
    maxLenght: 5,
    queue: [ [144, 66, 120], [144, 67, 120], [144, 65, 120], [144, 60, 120], [144, 62, 120] ],
    pipe: [],
    currStep: 5,
    currTone: null
};

/**
 * Store the last HTs MIDI messages into the Piper's queue
 *
 * @param {number}      statusByte     - Status Byte of the incoming MIDI message
 * @param {number}      ctrlNoteNumber - MIDI note number of the incoming MIDI message
 * @param {number}      velocity       - Velocity of the incoming MIDI message
 * @param {('ft'|'ht')} type           - If the MIDI note number of the incoming message is assigned to FTs or HTs
 */
function icPiper(statusByte, ctrlNoteNumber, velocity, type) {
    // Prepare the fake MIDI message
    let pack = [statusByte, ctrlNoteNumber, velocity];
    // If the pipe is not full
    if (icPipe.queue.length < icPipe.maxLenght) {
        // Insert the message at the beginning of the queue
        icPipe.queue.push(pack);
    // Else, if the pipe is full
    } else {
        // Remove the oldest message in the pipe
        icPipe.queue.shift();
        // Insert in the pipe a new message
        icPipe.queue.push(pack);
    }
}

/**
 * When HT0 is pressed (or released)
 *
 * @param {(0|1)} state - Note ON/OFF; 1 is ON, 0 is OFF
 */
function icPiping(state) {
    // Get the index (current step)
    let i = icPipe.currStep;
    // If there are notes in the queue
    if (icPipe.queue.length > 0) {
        // Inject the queue into the pipe at the current step position
        icPipe.pipe.splice.apply(icPipe.pipe, [i, icPipe.queue.length].concat(icPipe.queue));
        // If the final pipe is longer than the maxLenght
        if (icPipe.pipe.length > icPipe.maxLenght) {
            // Cut the pipe according to the maxLenght
            icPipe.pipe.splice(0, (icPipe.pipe.length - icPipe.maxLenght));
        }
        // Increase current step and index in order to start playing
        // after the notes that have just been inserted
        icPipe.currStep += icPipe.queue.length;
        i += icPipe.queue.length;
        // Empty the queue
        icPipe.queue = [];
    }
    // If there are notes in the pipe
    if (icPipe.pipe.length > 0) {
        // If step count is not at the end of the pipe
        if (i < icPipe.maxLenght) {
            // Note ON
            if (state === 1) {
                // If there is some message at the current step in the pipe
                if (icPipe.pipe[i]) {
                    // Create the special-marked fake MIDI message
                    // in order to not to be confused with a normal MIDI message
                    let midievent = {
                        data: [icPipe.pipe[i][0], icPipe.pipe[i][1], icPipe.pipe[i][2], "piper"]
                    };
                    // Send the fake MIDI message
                    icMidiMessageReceived(midievent);
                    // Store the last sent MIDI message in 'currTone'
                    icPipe.currTone = midievent;
                } else {
                    icPipe.currTone = null;
                }
            // Note OFF
            } else if (state === 0) {
                // If there is a stored MIDI message in 'currTone'
                if (icPipe.currTone) {
                    // Set the velocity to zero (Note OFF)
                    icPipe.currTone.data[2] = 0;
                    // Send the fake MIDI message
                    icMidiMessageReceived(icPipe.currTone);
                }
                // Go to the next step in the pipe
                icPipe.currStep++;
            }
        // If step count is at the end (or out) of the pipe
        } else {
            // Reset the step counter                
            icPipe.currStep = 0;
            // Retry to execute the icPiping (itself) again
            icPiping(state);
        }
    }
}

/**
 * Experimental function for dynamic preloaded piper melody (...)
 *
 * @todo - The preloaded Pipe must use only available keys
 * 
 * @param {('h'|'s'|'hs')} type - The HTs scale type of the current Controller keymap
 */
function icPipeQueueGen(type) {
    let ctrlMap = icDHC.tables.ctrl_map;
    let melodies = {
        h: [9, 10, 8, 4, 6],
        s: [-6, -5, -4, -3, -4, -5],
        hs: [6, -6, 6, -6, 6, -6]
    };
    let msgsQueue = [];
    for (let tone of melodies[type]) {
        let once = 0;
        for (let key of Object.keys(ctrlMap)) {
            for (let m = 1; m < 128; m *= 2) {
                if (ctrlMap[key].ht === tone * m && once === 0) {
                    msgsQueue.push([144, Number(key), 120]);
                    once++;
                }            
            }
        }
    }
    icPipe.maxLenght = document.getElementById("HTMLi_dhc_piperSteps").value = msgsQueue.length;
    icPipe.queue = msgsQueue;
}