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
 * @fileoverview MIDI-OUT HANDLER<br>
 *     Prepare the MIDI-OUT message and send them to the MIDI-OUT ports.
 *               
 * @author Walter Mantovani < armonici.it [at] gmail [dot] com >
 */

/* exported icUpdateMOT */
/* exported icOpenMidiPanel */
/* exported icUpdateMIDInoteON */
/* exported icMIDIout */
/* exported icSendMiddleC */

"use strict";

/**
 * Temporary MIDI-OUT ports settings cache; keys are the output port IDs
 * (a little DB where to store the user's settings about the port)
 *
 * @type {Object.<number, MIDIoutSettings>}
 */
var icMIDIoutSettings = {};

/**
 * Get the "MIDI-OUT Tuning" HTML element and store to global
 *
 * @type {Object}
 */
var icHTMLmotModalContent = document.getElementById("HTMLf_motPanelContent");

/**
 * Update the MIDI-OUT Tuning UI
 * Create the UI to manage the MIDI port channels
 */
function icUpdateMOT() {
    // Init the container
    icHTMLmotModalContent.innerHTML = "";
    icSelectedOutputs.forEach((value, key) => {
        // If it's a new port in this browser section
        if (!icMIDIoutSettings[key]) {
            // Initialize the port with default settings
            icMIDIoutSettings[key] = JSON.parse(JSON.stringify(icDHC.settings.instrument));
        }
        // **CONTAINER**
        // Create the main <div> container
        let divPort = document.createElement('div');
        let divPortSettings = document.createElement('div');
        let tablePort = document.createElement('table');
        let tablePortRowHeader = document.createElement('tr');
        let tablePortRowHeaderBottom = document.createElement('tr');
        let tablePortRowFT = document.createElement('tr');
        let tablePortRowHT = document.createElement('tr');
        let tdLabFT = document.createElement('th');
        let tdLabHT = document.createElement('th');
        // Set ids
        divPort.id = "HTMLf_motPort" + key;
        // Set classes
        divPort.className = "mot-port";
        divPortSettings.className = "mot-pb-settings";
        tablePortRowHeader.className = "mot-pb-row1";
        tablePortRowHT.className = "mot-pb-row2";
        tablePortRowFT.className = "mot-pb-row3";
        tablePortRowHeaderBottom.className = "mot-pb-row4";
        tdLabFT.className = tdLabHT.className = "mot-pb-typeHeader";
        // Write the title (Port Name)
        divPort.innerHTML = "<h2>" + value.name + "</h2>";
        tdLabFT.innerHTML = "FTs";
        tdLabHT.innerHTML = "HTs";
        tdLabFT.rowSpan = "2";
        tdLabHT.rowSpan = "2";
        // First Column
        tablePortRowHeader.appendChild(tdLabHT);
        tablePortRowFT.appendChild(tdLabFT);
        // **CHANNEL CHECKBOXES**
        // Create the single channel checkboxes
        for (let ch = 0; ch < 16; ch++) {
            // Create the HTML elements
            let tdChFT = document.createElement('td');
            let tdChHT = document.createElement('td');
            let tdLabChFT = document.createElement('td');
            let tdLabChHT = document.createElement('td');
            let checkboxFT = document.createElement('input');
            let checkboxHT = document.createElement('input');
            let labelFT = document.createElement("label");
            let labelHT = document.createElement("label");
            // Set the htmlElements
            tdChFT.className = "mot-pb-portChannel_ft";
            tdChHT.className = "mot-pb-portChannel_ht";
            labelFT.setAttribute("for", key + "_" + ch + "_ft");
            labelHT.setAttribute("for", key + "_" + ch + "_ht");
            labelFT.innerHTML = labelHT.innerHTML = ch + 1  ;
            checkboxFT.type = checkboxHT.type = 'checkbox';
            /**
             * MIDI Channel assignment event-data
             * 
             * @typedef {Object} ChanAssignment
             *
             * @property {number}     1 - A floating point number, the time-stamp
             * @property {number}     1 - A floating point number, the time-stamp
             * @property {number}     1 - A floating point number, the time-stamp
             * @property {number}     1 - A floating point number, the time-stamp
             */
            checkboxFT.value = '{ "port": "' + key + '", "chan": '+ ch + ', "fn": "ft", "not": "ht" }';
            checkboxHT.value = '{ "port": "' + key + '", "chan": '+ ch + ', "fn": "ht", "not": "ft" }';
            checkboxFT.name = checkboxHT.name = key + "_" + ch;
            checkboxFT.addEventListener("click", icChanSelect);
            checkboxHT.addEventListener("click", icChanSelect);
            checkboxFT.id = key + "_" + ch + "_ft";
            checkboxHT.id = key + "_" + ch + "_ht";
            if (ch === 9) {
                tdChFT.className = "mot-pb-portChannel_ft gmCh10";
                tdChHT.className = "mot-pb-portChannel_ht gmCh10";
                tdLabChFT.className = "gmCh10";
                tdLabChHT.className = "gmCh10";
            }
            //Inputs and labels in cells
            tdLabChHT.appendChild(labelHT);
            tdLabChFT.appendChild(labelFT);
            tdChHT.appendChild(checkboxHT);
            tdChFT.appendChild(checkboxFT);
            // Cells in rows
            tablePortRowHeader.appendChild(tdLabChHT);
            tablePortRowHeaderBottom.appendChild(tdLabChFT);
            tablePortRowHT.appendChild(tdChHT);
            tablePortRowFT.appendChild(tdChFT);
            // Check the checkboxes if the channel is used
            if (icMIDIoutSettings[key].pb.channels.ft.used.indexOf(ch) > -1) {
                checkboxFT.checked = true;
            }
            if (icMIDIoutSettings[key].pb.channels.ht.used.indexOf(ch) > -1) {
                checkboxHT.checked = true;
            }
        }
        // **PORT PARAMETERS**
        // Create the HTML elements
        let tdPortPBrangeHeader = document.createElement('th');
        let tdPortPBdelayHeader = document.createElement('th');
        let tdPortPBrangeFT = document.createElement('td');
        let tdPortPBrangeHT = document.createElement('td');
        let tdPortPBdelayFT = document.createElement('td');
        let tdPortPBdelayHT = document.createElement('td');
        let btnRangeFT = document.createElement('button');
        let btnRangeHT = document.createElement('button');
        let inputRangeFT = document.createElement('input');
        let inputRangeHT = document.createElement('input');
        let inputDelayFT = document.createElement('input');
        let inputDelayHT = document.createElement('input');
        // Set the htmlElements
        tablePort.className = "invisibleTable";
        tdPortPBrangeFT.className = "mot-pb-rangeFT";
        tdPortPBrangeHT.className = "mot-pb-rangeHT";
        tdPortPBdelayFT.className = "mot-pb-delayFT";
        tdPortPBdelayHT.className = "mot-pb-delayHT";
        tdPortPBrangeHeader.innerHTML = "PitchBend Range";
        tdPortPBdelayHeader.innerHTML = "Delay (ms)";
        btnRangeFT.innerHTML = ">Send";
        btnRangeHT.innerHTML = ">Send";
        inputRangeFT.type = inputRangeHT.type = inputDelayFT.type = inputDelayHT.type = "number";
        inputRangeFT.min = inputRangeHT.min = "1";
        inputRangeFT.max = inputRangeHT.max = "12";
        inputRangeFT.step = inputRangeHT.step = "1";
        inputDelayFT.min = inputDelayHT.min = "0";
        inputDelayFT.max = inputDelayHT.max = "20";
        inputDelayFT.step = inputDelayHT.step = "1";
        inputRangeFT.value = icMIDIoutSettings[key].pb.range.ft;
        inputRangeHT.value = icMIDIoutSettings[key].pb.range.ht;
        inputDelayFT.value = icMIDIoutSettings[key].pb.delay.ft;
        inputDelayHT.value = icMIDIoutSettings[key].pb.delay.ht;
        inputRangeFT.addEventListener("input", (event) => {
            icMIDIoutSettings[key].pb.range.ft = event.target.value;
        });
        inputRangeHT.addEventListener("input", (event) => {
            icMIDIoutSettings[key].pb.range.ht = event.target.value;
        });
        inputDelayFT.addEventListener("input", (event) => {
            icMIDIoutSettings[key].pb.delay.ft = event.target.value;
        });
        inputDelayHT.addEventListener("input", (event) => {
            icMIDIoutSettings[key].pb.delay.ht = event.target.value;
        });
        btnRangeFT.addEventListener("click", () => {
            icSendMIDIoutPBrange(key, "ft");
        });
        btnRangeHT.addEventListener("click", () => {
            icSendMIDIoutPBrange(key, "ht");
        });
        inputRangeFT.id = "HTMLi_MIDIoutPortPBrangeFT_" + key;
        inputRangeHT.id = "HTMLi_MIDIoutPortPBrangeHT_" + key;
        inputDelayFT.id = "HTMLi_MIDIoutPortPBdelayFT_" + key;
        inputDelayHT.id = "HTMLi_MIDIoutPortPBdelayHT_" + key;
        // **FINAL COMPOSE**
        // Insert each element into its respective htmlNode
        //Inputs in cells
        tdPortPBrangeFT.appendChild(inputRangeFT);
        tdPortPBrangeFT.appendChild(btnRangeFT);
        tdPortPBdelayFT.appendChild(inputDelayFT);
        tdPortPBrangeHT.appendChild(inputRangeHT);
        tdPortPBrangeHT.appendChild(btnRangeHT);
        tdPortPBdelayHT.appendChild(inputDelayHT);
        // Cells in rows
        tablePortRowHeader.appendChild(tdPortPBrangeHeader);
        tablePortRowHeader.appendChild(tdPortPBdelayHeader);
        tablePortRowFT.appendChild(tdPortPBrangeFT);
        tablePortRowFT.appendChild(tdPortPBdelayFT);
        tablePortRowHT.appendChild(tdPortPBrangeHT);
        tablePortRowHT.appendChild(tdPortPBdelayHT);
        tablePortRowHeaderBottom.appendChild(tdPortPBrangeHeader.cloneNode(true));
        tablePortRowHeaderBottom.appendChild(tdPortPBdelayHeader.cloneNode(true));
        // Final Column
        tablePortRowHeader.appendChild(tdLabHT.cloneNode(true));
        tablePortRowFT.appendChild(tdLabFT.cloneNode(true));
        // Rows in <table>
        tablePort.appendChild(tablePortRowHeader);
        tablePort.appendChild(tablePortRowHT);
        tablePort.appendChild(tablePortRowFT);
        tablePort.appendChild(tablePortRowHeaderBottom);
        // Insert each <div> container into its respective htmlNode
        divPortSettings.appendChild(tablePort);
        divPort.appendChild(divPortSettings);
        icHTMLmotModalContent.appendChild(divPort);
    });
}

/**
 * What to do if a MIDI channel is selected in the MIDI-OUT PitchBend Method UI
 *
 * @param {Event}  event              - OnClick event on the MIDI-OUT PitchBend Method channel checkboxes
 * @param {string} event.target.value - Stringified JSON version of the {@link ChanAssignment} type
 */
function icChanSelect(event) {
    // Parse the JSON from the checkbox value
    let chanSet = JSON.parse(event.target.value);
    // Find and index the current channel in the arrays
    let index = icMIDIoutSettings[chanSet.port].pb.channels[chanSet.fn].used.indexOf(chanSet.chan);
    let indexOther = icMIDIoutSettings[chanSet.port].pb.channels[chanSet.not].used.indexOf(chanSet.chan);
    // Get the other channel checkbox
    let targetOther = document.getElementById(chanSet.port + "_" + chanSet.chan + "_" + chanSet.not);

    // If the checkbox is checked
    if (event.target.checked) {
        // Add current channel to the right array
        if (index === -1) {
            icMIDIoutSettings[chanSet.port].pb.channels[chanSet.fn].used.push(chanSet.chan);
        }
        // Remove the current channel from the other array
        if (indexOther > -1) {
            icMIDIoutSettings[chanSet.port].pb.channels[chanSet.not].used.splice(indexOther, 1);
        }
        // Uncheck the other channel checkbox
        if (targetOther.checked) {
            targetOther.checked = false;
        }
    // If the checkbox is not checked
    } else {
        // Remove the current channel from the right array
        if (index > -1) {
            icMIDIoutSettings[chanSet.port].pb.channels[chanSet.fn].used.splice(index, 1);
        }
    }
    icMIDIoutSettings[chanSet.port].pb.channels.ft.used.sort((a, b) => {
        return a - b;
    });
    icMIDIoutSettings[chanSet.port].pb.channels.ht.used.sort((a, b) => {
        return a - b;
    });
    // @todo - Send all Note-OFF and re-init the last channel in order to avoid stuck notes
    icEventLog("MIDI multichannel polyphony assignment:\n| Output port = " + icMidi.outputs.get(chanSet.port).name + "\n| " + chanSet.fn.toUpperCase() + " selected channels = " + icMIDIoutSettings[chanSet.port].pb.channels[chanSet.fn].used + "\n| " + chanSet.not.toUpperCase() + " selected channels = " + icMIDIoutSettings[chanSet.port].pb.channels[chanSet.not].used + "\n| ---------------------------------------");
}

/**
 * Open the MIDI I/O modal panel on UI
 */
function icOpenMidiPanel() {
    // Get the modal element
    var modal = document.getElementById('HTMLf_motPanelModal');
    // Get the <span> element that closes the modal element
    var span = document.getElementsByClassName("modalOverlay_close")[0];
    // When the user clicks the button, open the modal element
    modal.style.display = "block";
    // When the user clicks on <span> (x), close the modal element
    span.onclick = () => {
        modal.style.display = "none";
    };
    // When the user clicks anywhere outside of the modal element, close it
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

/**
 * Send the MIDI Pitch Bend Sensitivity (range) message
 *
 * @param {number}      portID - The MIDI-OUT port on which to send the message
 * @param {('ft'|'ht')} type   - If the ports to which the message should be sent are assigned to FTs or HTs
 */
function icSendMIDIoutPBrange(portID, type) {
    let midiOutput = icMidi.outputs.get(portID);
    // If the user is not playing
    if (Object.keys(icMIDIoutSettings[portID].pb.channels[type].held).length === 0) {
        let chansEventLog = []; 
        for (let i = 0; i < 16; i++) {
            let outMsgsQueue = [];
            if (icMIDIoutSettings[portID].pb.channels[type].used[i] !== undefined) {
                let ch = icMIDIoutSettings[portID].pb.channels[type].used[i];
                chansEventLog.push(ch + 1);
                outMsgsQueue.push([0xB0 + ch, 0x64, 0x00]); // [CC+CHANNEL, CC RPN LSB (100), value (RPN 00)]
                outMsgsQueue.push([0xB0 + ch, 0x65, 0x00]);  // [CC+CHANNEL, CC RPN MSB (101), value (RPN 00)]
                // outMsgsQueue.push([0xB0 + ch, 0x26, 0x00]); // [CC+CHANNEL, CC DATA ENTRY LSB, value (not used)]
                outMsgsQueue.push([0xB0 + ch, 0x06, icMIDIoutSettings[portID].pb.range[type]]); // [CC+CHANNEL, CC DATA ENTRY MSB, value (1-24 semitones)]
                outMsgsQueue.push([0xB0 + ch, 0x64, 0x7F]); // [CC+CHANNEL, CC RPN LSB (100), value (null == 127)]
                outMsgsQueue.push([0xB0 + ch, 0x65, 0x7F]); // [CC+CHANNEL, CC RPN MSB (101), value (null == 127)]
                for (let msg of outMsgsQueue) {
                    midiOutput.send(msg);
                }
            }
        }
        icEventLog("MIDI Control Change message:\n| Output Port = " + icMidi.outputs.get(portID).name + "\n| " + type.toUpperCase() + " Channels = " + chansEventLog + "\n| Pitch Bend Sensitivity = " + icMIDIoutSettings[portID].pb.range[type] + " semitones e.t. (12-EDO)\n| ---------------------------------------------------");
    // Else, an alert message
    } else {
        alert("Do not play when sending the message!\nTry again.");
    }
}

/**
 * Create a MIDI Note ON/OFF message
 *
 * @param  {number} ch       - MIDI Channel to which the message should be sent
 * @param  {(0|1)}  state    - Note ON or OFF; 1 is Note-ON, 0 is Note-OFF
 * @param  {number} note     - MIDI Note number (from 0 to 127)
 * @param  {number} velocity - MIDI Velocity amount (from 0 to 127)
 *
 * @return {Array}           - The MIDI Note ON/OFF message
 */
function icMakeMIDIoutNoteMsg(ch, state, note, velocity) {
    let msg = [];
    if (state === 1) {
        msg = [0x90 + ch, note, velocity];
    } else if (state === 0) {
        msg = [0x80 + ch, note, velocity];
    }
    return msg;
}

/**
 * Create a MIDI Pitch Bend Change message
 *
 * @param  {number} ch     - MIDI Channel to which the message should be sent (from 0 to 15)
 * @param  {number} amount - Pitch Bend amount (from 0 to 16383)
 *
 * @return {Array}         - The MIDI Pitch Bend Change message
 */
function icMakeMIDIoutPitchBendMsg(ch, amount) {
    let lsb = amount & 0x7F;
    let msb = amount >> 7;
    let msg = [0xE0 + ch, lsb, msb];
    return msg;
}

/**
 * @todo - The voice stealing implementation of the MIDI-OUT has not the same results of the DHC/Synth.
 *         When voices are overloaded on HT and you release a key on the controller there is a different behavior.
 */

/**
 * Update the frequency of every sill pending Note-ON
 *
 * @param {('ft'|'ht')} whatToUpdate - If the notes/channels to be updated are assigned to FTs or HTs
 */
function icUpdateMIDInoteON(whatToUpdate) {
    // For each selected MIDI-OUT ports
    icSelectedOutputs.forEach((value, portID) => {
        // PitchBend method
        if (icMIDIoutSettings[portID].selected === "pb") {
            let heldChsFT = icMIDIoutSettings[portID].pb.channels.ft.held;
            let heldChsHT = icMIDIoutSettings[portID].pb.channels.ht.held;
            let heldChsKeysFT = Object.keys(heldChsFT);
            let heldChsKeysHT = Object.keys(heldChsHT);
            if (whatToUpdate === "ft") {
                if (heldChsKeysFT.length > 0) {
                    for (let key of heldChsKeysFT) {
                        let ft = heldChsFT[key].xt;
                        let ftObj = icDHC.tables.ft_table[ft];
                        let velocity = heldChsFT[key].vel;
                        icSendMIDIoutPB(key, ft, ftObj, 64, 0, "ft", portID);
                        icSendMIDIoutPB(key, ft, ftObj, velocity, 1, "ft", portID);
                    }
                }
                if (heldChsKeysHT.length > 0) {
                    for (let key of heldChsKeysHT) {
                        let ht = heldChsHT[key].xt;
                        let htObj = icDHC.tables.ht_table[ht];
                        let velocity = heldChsHT[key].vel;
                        icSendMIDIoutPB(key, ht, htObj, 64, 0, "ht", portID);
                        icSendMIDIoutPB(key, ht, htObj, velocity, 1, "ht", portID);
                    }
                }
            } else if (whatToUpdate === "ht") {
                if (heldChsKeysHT.length > 0) {
                    for (let key of heldChsKeysHT) {
                        let ht = heldChsHT[key].xt;
                        let htObj = icDHC.tables.ht_table[ht];
                        let velocity = heldChsHT[key].vel;
                        icSendMIDIoutPB(key, ht, htObj, 64, 0, "ht", portID);
                        icSendMIDIoutPB(key, ht, htObj, velocity, 1, "ht", portID);
                    }
                }
            }
        // MIDI Tuning Standard method
        } else if (icMIDIoutSettings[portID].selected === "mts") {

        }
    });
}

/**
 * For each selected MIDI-OUT Port,
 * prepare the MIDI-OUT message according to the selected MIDI-OUT Tuning Method of the port
 *
 * @param {number}      statusByte     - Status Byte of the original MIDI-IN message from the controller
 * @param {number}      ctrlNoteNumber - MIDI Note number of the original MIDI-IN message from the controller
 * @param {number}      xt             - Outgoing FT or HT relative tone number
 * @param {Xtone}       xtObj          - FT or HT object of the outgoing tone 
 * @param {number}      velocity       - MIDI Velocity amount (from 0 to 127) of the original MIDI-IN message from the controller
 * @param {(0|1)}       state          - Note ON or OFF; 1 is Note-ON, 0 is Note-OFF
 * @param {('ft'|'ht')} type           - If the outgoing MIDI message is for FTs or HTs
 */
function icMIDIout(statusByte, ctrlNoteNumber, xt, xtObj, velocity, state, type) {
    // For each selected MIDI-OUT ports
    icSelectedOutputs.forEach((value, portID) => {
        // PitchBend method
        if (icMIDIoutSettings[portID].selected === "pb") {
            // Check the if Instrument MIDI Note Number is in the range 0-127
            if (Math.trunc(xtObj.mc) <= 127 && Math.trunc(xtObj.mc) >= 0) {
                // Check if another note with the same ctrlNoteNumber came before its respective Note-OFF
                // @todo - Manage in different way the Double Note-ON: change index ??
                if (icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] && state === 1) {
                    icSendMIDIoutPB(ctrlNoteNumber, xt, xtObj, 64, 0, type, portID);                
                    icSendMIDIoutPB(ctrlNoteNumber, xt, xtObj, velocity, state, type, portID);                
                    console.log(type + " MIDI event: Double Note-ON");
                } else {
                    icSendMIDIoutPB(ctrlNoteNumber, xt, xtObj, velocity, state, type, portID);                
                }
            }
        // @todo - MIDI Tuning Standard method
        } else if (icMIDIoutSettings[portID].selected === "mts") {

        }
    });
}

/**
 * MIDI-OUT Tuning - PITCHBEND METHOD
 * The main function to manage the multichannel poly-assignment and send the MIDI messages
 * This is to implement the "MIDI Channel Mode 4" aka "Guitar Mode" for outgoing messages
 *
 * @param {number}      ctrlNoteNumber - MIDI Note number of the original MIDI-IN message from the controller
 * @param {number}      xt             - Outgoing FT or HT relative tone number
 * @param {Xtone}       xtObj          - FT or HT object of the outgoing tone
 * @param {number}      velocity       - MIDI Velocity amount (from 0 to 127) of the original MIDI-IN message from the controller
 * @param {(0|1)}       state          - Note ON or OFF; 1 is Note-ON, 0 is Note-OFF
 * @param {('ft'|'ht')} type           - If the outgoing MIDI message is for FTs or HTs
 * @param {number}      key            - ID of the MIDI-OUT Port to send the message to
 */
function icSendMIDIoutPB(ctrlNoteNumber, xt, xtObj, velocity, state, type, portID) {
    // @todo - Some functional Note-OFF must be sent without delay?!?
    let usedChs = icMIDIoutSettings[portID].pb.channels[type].used;
    let heldChs = icMIDIoutSettings[portID].pb.channels[type].held;
    if (usedChs.length > 0 || Object.keys(heldChs).length > 0) {
        // Init local variables
        let heldOrder = icMIDIoutSettings[portID].pb.channels[type].heldOrder;
        let lastCh = icMIDIoutSettings[portID].pb.channels[type].last;
        let currCh =  null;
        let instNoteNumber = Math.trunc(xtObj.mc);
        let cents = xtObj.mc - Math.trunc(xtObj.mc);
        let midiOutput = icMidi.outputs.get(portID);
        if (cents > 0.5) {
            instNoteNumber = Math.trunc(xtObj.mc + 0.5);
            cents -= 1;
        }
        // @todo - Check 8192 or 8191 depending on the +/-amount (since +amount is up to 8191)
        let pbAmount = cents * (8192 / icMIDIoutSettings[portID].pb.range[type]) + 8192;
        let outMsgsQueue = [];
        // ** FTs **
        if (type === "ft") {
            // Note ON
            if (state === 1) {
                // Get the key array of the held channels
                let heldChsKey = Object.keys(heldChs);
                // If there are available used channels
                if (usedChs.length > 0 ) {
                    // Find the first available used channel bigger than the lastChan
                    for (let ch = lastCh + 1; ch < 17; ch++) {
                        let index = usedChs.indexOf(ch);
                        if (index > -1 ) {
                            // Set the current channel
                            currCh = ch;
                            // If there are held channels
                            if (heldChsKey.length > 0) {
                                // Restore the held-on-hold channel to the used channel array
                                icMIDIoutSettings[portID].pb.channels[type].used.push(heldChs[heldChsKey[0]].ch);
                                // Make the Note-Off to close the previous note on the last channel
                                outMsgsQueue.push(icMakeMIDIoutNoteMsg(heldChs[heldChsKey[0]].ch, 0, heldChs[heldChsKey[0]].note, 64));
                                // Delete the held channel
                                delete icMIDIoutSettings[portID].pb.channels[type].held[heldChsKey[0]];
                            } // else {
                            // }
                            // Remove the found channel from the used channel array in order to avoid over-assignment
                            icMIDIoutSettings[portID].pb.channels[type].used.splice(index, 1);
                            // Sort the array
                            icMIDIoutSettings[portID].pb.channels[type].used.sort((a, b) => {
                                return a - b;
                            });
                            /**
                             * Held channel' infos during the multi-channel polyphony routing;
                             *     a Held Channel is a currently busy channel already occupied by an outgoing tone
                             * 
                             * @typedef  {Object} HeldChannel
                             *
                             * @property {number} ch   - MIDI Channel Number (from 0 to 15)
                             * @property {number} note - Final MIDI Note Number on the Instrument
                             * @property {number} vel  - MIDI velocity amount (from 0 to 127)
                             * @property {number} xt   - Relative tone number (FT or HT)
                             */
                            // Store the current channel to the held-on-hold channel var in order to avoid over-assignment
                            icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                            break;
                        } else {
                            currCh = undefined;
                        }
                    }
                    // If the channel hasn't been found
                    // Restart to find the first available used channel from the beginning to the lastChan
                    if (currCh === undefined) {
                        // Set the current channel
                        currCh = usedChs[0];
                        // If there are held channels
                        if (heldChsKey.length > 0) {
                            // Restore the held-on-hold channel to the used channel array
                            icMIDIoutSettings[portID].pb.channels[type].used.push(heldChs[heldChsKey[0]].ch);
                            // Make the Note-Off to close the previous note on the last channel
                            outMsgsQueue.push(icMakeMIDIoutNoteMsg(heldChs[heldChsKey[0]].ch, 0, heldChs[heldChsKey[0]].note, 64));
                            // Delete the held channels
                            delete icMIDIoutSettings[portID].pb.channels[type].held[heldChsKey[0]];
                        }
                        // Remove the first channel from the used channel array in order to avoid over-assignment
                        icMIDIoutSettings[portID].pb.channels[type].used.splice(0, 1);
                        // Sort the array
                        icMIDIoutSettings[portID].pb.channels[type].used.sort((a, b) => {
                            return a - b;
                        });
                        // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                        icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                    }
                    // STRANGE: If there aren't available channels
                    if (currCh === undefined) {
                        console.log(type + " MIDI event: Strange event #1");
                    }
                // If there are NO available used channels
                } else {
                    console.log(type + " MIDI event: Channels overload");
                    // Use the held channel
                    currCh = heldChs[heldChsKey[0]].ch;
                    // For every held channels
                    for (let key of Object.entries(icMIDIoutSettings[portID].pb.channels[type].held)) {
                        // If the held channel is the current channel needed
                        if (key[1].ch === currCh) {
                            // Make the Note-Off to close the previous Note-On this channel
                            outMsgsQueue.push(icMakeMIDIoutNoteMsg(key[1].ch, 0, key[1].note, 64));
                            // Remove the current channel from the held-channels array
                            delete icMIDIoutSettings[portID].pb.channels[type].held[key[0]];
                        }
                    }
                    // Re-store the current channel to the held-on-hold channels array in order to avoid over-assignment
                    icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                }
                // Store the current channel on the global slot for polyphony handling
                icMIDIoutSettings[portID].pb.channels[type].last = currCh;
                // Make the PitchBend
                outMsgsQueue.push(icMakeMIDIoutPitchBendMsg(currCh, pbAmount));
                // Make the Note-On
                outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 1, instNoteNumber, velocity));
            // Note OFF
            } else if (state === 0) {
                if (icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber]) {
                    // console.log("== Note OFF == : " + ctrlNoteNumber);
                    // Get the current channel to close (to send Note OFF)
                    currCh = icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber].ch;
                    // Restore the held-on-hold channel to the used channel array
                    icMIDIoutSettings[portID].pb.channels[type].used.push(currCh);
                    // Sort the array
                    icMIDIoutSettings[portID].pb.channels[type].used.sort((a, b) => {
                        return a - b;
                    });
                    // Make the Note-Off to close the channel
                    outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 0, icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber].note, velocity));
                    // Remove the current channel from the held-channels array
                    delete icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber];
                }                
            }
        // ** HTs **
        } else if (type === "ht") {
            // Note ON
            if (state === 1) {
                // If there are available used channels
                if (usedChs.length > 0 ) {
                    // Find the first available used channel bigger than the lastChan
                    for (let ch = lastCh + 1; ch < 17; ch++) {
                        let index = usedChs.indexOf(ch);
                        // If there are held channels
                        if (index > -1 ) {
                            // Set the current channel
                            currCh = ch;
                            // Remove the found channel from the used channel array in order to avoid over-assignment
                            icMIDIoutSettings[portID].pb.channels[type].used.splice(index, 1);
                            // Add the current channel at the end of the heldOrder to maintain the assignment order
                            icMIDIoutSettings[portID].pb.channels[type].heldOrder.push(currCh);
                            // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                            icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                            break;
                        } else {
                            currCh = undefined;
                        }
                    }
                    // If the channel hasn't been found
                    // Restart to find the first available used channel from the beginning to the lastChan
                    if (currCh === undefined) {
                        // Set the current channel
                        currCh = usedChs[0];
                        // Remove the first channel from the used channel array in order to avoid over-assignment
                        icMIDIoutSettings[portID].pb.channels[type].used.splice(0, 1);
                        // Add the current channel at the end of the heldOrder to maintain the assignment order
                        icMIDIoutSettings[portID].pb.channels[type].heldOrder.push(currCh); 
                        // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                        icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                    }
                    // STRANGE: If there aren't available channels
                    if (currCh === undefined) {
                        console.log(type + " MIDI event: Strange event #1");
                    }
                // If there are NO available used channels
                } else {
                    console.log(type + " MIDI event: Channels overload");
                    // Use the oldest held channel
                    currCh = heldOrder[0];
                    // Put the current channel at the end of heldOrder array to maintain the assignment order
                    icMIDIoutSettings[portID].pb.channels[type].heldOrder.splice(0, 1);
                    icMIDIoutSettings[portID].pb.channels[type].heldOrder.push(currCh);
                    // Remove the current channel from the held-channels array
                    for (let key of Object.entries(icMIDIoutSettings[portID].pb.channels[type].held)) {
                        if (key[1].ch === currCh) {
                            // Make the Note-Off to close the previous Note-On this channel
                            outMsgsQueue.push(icMakeMIDIoutNoteMsg(key[1].ch, 0, key[1].note, 64));
                            delete icMIDIoutSettings[portID].pb.channels[type].held[key[0]];
                        }
                    }
                    // Re-store the current channel to the held-on-hold channels array in order to avoid over-assignment
                    icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                }
                // Store the current channel on the global slot for polyphony handling
                icMIDIoutSettings[portID].pb.channels[type].last = currCh;
                // Make the PitchBend
                outMsgsQueue.push(icMakeMIDIoutPitchBendMsg(currCh, pbAmount));
                // Make the Note-On
                outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 1, instNoteNumber, velocity));
            // Note OFF
            } else if (state === 0) {
                if (icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber]) {
                    // Get the current channel to close (to send Note OFF)
                    currCh = icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber].ch;
                    // Restore the held-on-hold channel to the used channel array
                    icMIDIoutSettings[portID].pb.channels[type].used.push(currCh);
                    // Sort the array
                    icMIDIoutSettings[portID].pb.channels[type].used.sort((a, b) => {
                        return a - b;
                    });
                    // Make the Note-Off to close the channel
                    outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 0, icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber].note, velocity));
                    // Remove the current channel from the held-channels array
                    delete icMIDIoutSettings[portID].pb.channels[type].held[ctrlNoteNumber];
                    let index = icMIDIoutSettings[portID].pb.channels[type].heldOrder.indexOf(currCh);
                    icMIDIoutSettings[portID].pb.channels[type].heldOrder.splice(index, 1);
                }                
            }
        }
        // Send the outgoing MIDI messages
        for (let msg of outMsgsQueue) {
            // If it's a Note-OFF
            if ((msg[0] >> 4 === 9 && msg[2] === 0) || (msg[0] >> 4 === 8)) {
                document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ft").disabled = false;
                document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ht").disabled = false;
            // If it's a Note-ON
            } else if (msg[0] >> 4 === 9) {
                document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ft").disabled = true;
                document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ht").disabled = true;
            }
            // If is a Note-ON or Note-OFF message
            if (msg[0] >> 4 === 9 || msg[0] >> 4 === 8) {
                // @todo - Check native delay method
                // midiOutput.send(msg, window.performance.now() + icMIDIoutSettings[key].pb.delay[type]);
                setTimeout(() => {
                    midiOutput.send(msg);
                }, icMIDIoutSettings[portID].pb.delay[type]);
            // Else, if it's a PitchBend message 
            } else {
                midiOutput.send(msg);
            }
        }
    }
}