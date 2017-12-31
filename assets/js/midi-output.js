 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * Copyright (C) 2017 by Walter Mantovani (http://armonici.it).
 * Written by Walter Mantovani < armonici.it [*at*] gmail [*dot*] com >.
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
 * MIDI OUTPUT HANDLER
 * Prepare the MIDI output message and send them to the MIDI-OUT ports.
 */

/* exported icUpdateMOT */
/* exported icOpenMidiPanel */
/* exported icUpdateMIDInoteON */
/* exported icMIDIout */
/* exported icSendMiddleC */
"use strict";

// Init the temporary MIDI out ports settings cache (a little DB where to store the user's settings about the port)
var icMIDIoutSettings = {};
// Get the "MIDI Out Tuning" HTML element and store to global
var icHTMLmotModalContent = document.getElementById("HTMLf_motPanelContent");

function icUpdateMOT() {
    // Init the container
    icHTMLmotModalContent.innerHTML = "";
    icSelectedOutputs.forEach((value, key, map) => {
        // If it's a new port in this broswer section
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

// OnClick event on the channel checkboxes of the MIDI-Out PitchBend Method
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
    // @TODO: Send all Note-OFF and re-init the last channel in order to avoit stuck notes
    icEventLog("MIDI multichannel polyphony assigment:\n| Output port = " + icMidi.outputs.get(chanSet.port).name + "\n| " + chanSet.fn.toUpperCase() + " selected channels = " + icMIDIoutSettings[chanSet.port].pb.channels[chanSet.fn].used + "\n| " + chanSet.not.toUpperCase() + " selected channels = " + icMIDIoutSettings[chanSet.port].pb.channels[chanSet.not].used + "\n| ---------------------------------------");
}

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
                for (let k in outMsgsQueue) {
                    midiOutput.send(outMsgsQueue[k]);
                }
            }
        }
        icEventLog("MIDI Control Change message:\n| Output Port = " + icMidi.outputs.get(portID).name + "\n| " + type.toUpperCase() + " Channels = " + chansEventLog + "\n| Pitch Bend Sensitivity = " + icMIDIoutSettings[portID].pb.range[type] + " semitones e.t. (12-EDO)\n| ---------------------------------------------------");
    // Else, an alert message
    } else {
        alert("Do not play when sending the message!\nTry again.");
    }
}

function icMakeMIDIoutNoteMsg(ch, state, note, velocity) {
    let msg = [];
    if (state === 1) {
        msg = [0x90 + ch, note, velocity];
    } else if (state === 0) {
        msg = [0x80 + ch, note, velocity];
    }
    return msg;
}

function icMakeMIDIoutPitchBendMsg(ch, amount) {
    let lsb = amount & 0x7F;
    let msb = amount >> 7;
    let msg = [0xE0 + ch, lsb, msb];
    return msg;
}

// @TODO: The voice stealing implementation of the MIDI out has not the same results of the DHC/Synth
//        When voices are overloaded on HT and you release a key on the controller there is a different behaviour

// Update the frequency of every sill pending Note-ON
function icUpdateMIDInoteON(whatToUpdate) {
    // For each selected MIDI Output ports
    icSelectedOutputs.forEach((value, key, map) => {
        // PitchBend method
        if (icMIDIoutSettings[key].selected === "pb") {
            let heldChsFT = icMIDIoutSettings[key].pb.channels.ft.held;
            let heldChsHT = icMIDIoutSettings[key].pb.channels.ht.held;
            let heldChsKeysFT = Object.keys(heldChsFT);
            let heldChsKeysHT = Object.keys(heldChsHT);
            if (whatToUpdate === "ft") {
                if (heldChsKeysFT.length > 0) {
                    for (let k in heldChsKeysFT) {
                        let ft = heldChsFT[heldChsKeysFT[k]].xt;
                        let ftArr = icDHC.tables.ft_table[ft];
                        let velocity = heldChsFT[heldChsKeysFT[k]].vel;
                        icSendMIDIoutPB(heldChsKeysFT[k], ft, ftArr, 64, 0, "ft", key);
                        icSendMIDIoutPB(heldChsKeysFT[k], ft, ftArr, velocity, 1, "ft", key);
                    }
                }
                if (heldChsKeysHT.length > 0) {
                    for (let k in heldChsKeysHT) {
                        let ht = heldChsHT[heldChsKeysHT[k]].xt;
                        let htArr = icDHC.tables.ht_table[ht];
                        let velocity = heldChsHT[heldChsKeysHT[k]].vel;
                        icSendMIDIoutPB(heldChsKeysHT[k], ht, htArr, 64, 0, "ht", key);
                        icSendMIDIoutPB(heldChsKeysHT[k], ht, htArr, velocity, 1, "ht", key);
                    }
                }
            } else if (whatToUpdate === "ht") {
                if (heldChsKeysHT.length > 0) {
                    for (let k in heldChsKeysHT) {
                        let ht = heldChsHT[heldChsKeysHT[k]].xt;
                        let htArr = icDHC.tables.ht_table[ht];
                        let velocity = heldChsHT[heldChsKeysHT[k]].vel;
                        icSendMIDIoutPB(heldChsKeysHT[k], ht, htArr, 64, 0, "ht", key);
                        icSendMIDIoutPB(heldChsKeysHT[k], ht, htArr, velocity, 1, "ht", key);
                    }
                }
            }
        // MIDI Tuning Standard method
        } else if (icMIDIoutSettings[key].selected === "mts") {

        }
    });
}

function icMIDIout(statusByte, ctrlNoteNumber, xt, xtArr, velocity, state, type) {
    // For each selected MIDI Output ports
    icSelectedOutputs.forEach((value, key, map) => {
        // PitchBend method
        if (icMIDIoutSettings[key].selected === "pb") {
            // Check the if Instrument MIDI Note Number is in the range 0-127
            if (Math.trunc(xtArr.mc) <= 127 && Math.trunc(xtArr.mc) >= 0) {
                // Check if another note with the same ctrlNoteNumber came before its respective Note-OFF
                // @TODO: Manage in different way the Double Note-ON: change index ??
                if (icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] && state === 1) {
                    icSendMIDIoutPB(ctrlNoteNumber, xt, xtArr, 64, 0, type, key);                
                    icSendMIDIoutPB(ctrlNoteNumber, xt, xtArr, velocity, state, type, key);                
                    console.log(type + " MIDI event: Double Note-ON");
                } else {
                    icSendMIDIoutPB(ctrlNoteNumber, xt, xtArr, velocity, state, type, key);                
                }
            }
        // @TODO: MIDI Tuning Standard method
        } else if (icMIDIoutSettings[key].selected === "mts") {

        }
    });
}

// The main function to manage the multichannel poly-assigment
// This is to implement the "MIDI Channel Mode 4" aka "Guitar Mode"
function icSendMIDIoutPB(ctrlNoteNumber, xt, xtArr, velocity, state, type, key) {
    // @TODO: Some functional Note-OFF must be sent without delay?
    let usedChs = icMIDIoutSettings[key].pb.channels[type].used;
    let heldChs = icMIDIoutSettings[key].pb.channels[type].held;
    if (usedChs.length > 0 || Object.keys(heldChs).length > 0) {
        // Init local variables
        let heldOrder = icMIDIoutSettings[key].pb.channels[type].heldOrder;
        let lastCh = icMIDIoutSettings[key].pb.channels[type].last;
        let currCh =  null;
        let instNoteNumber = Math.trunc(xtArr.mc);
        let cents = xtArr.mc - Math.trunc(xtArr.mc);
        let midiOutput = icMidi.outputs.get(key);
        if (cents > 0.5) {
            instNoteNumber = Math.trunc(xtArr.mc + 0.5);
            cents -= 1;
        }
        let pbAmount = cents * (8192 / icMIDIoutSettings[key].pb.range[type]) + 8192;
        let outMsgsQueue = [];
        // let noteMsg = [];
        // let pbMsg = [];

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
                                // console.log("RESTORE CH: " + heldChs[heldChsKey[0]].ch);
                                // Restore the held-on-hold channel to the used channel array
                                icMIDIoutSettings[key].pb.channels[type].used.push(heldChs[heldChsKey[0]].ch);
                                // Make the Note-Off to close the previous note on the last channel
                                outMsgsQueue.push(icMakeMIDIoutNoteMsg(heldChs[heldChsKey[0]].ch, 0, heldChs[heldChsKey[0]].note, 64));
                                // Delete the held channel
                                delete icMIDIoutSettings[key].pb.channels[type].held[heldChsKey[0]];
                            } // else {
                            // }
                            // Remove the found channel from the used channel array in order to avoid over-assignment
                            icMIDIoutSettings[key].pb.channels[type].used.splice(index, 1);
                            // Sort the array
                            icMIDIoutSettings[key].pb.channels[type].used.sort((a, b) => {
                                return a - b;
                            });
                            // Store the current channel to the held-on-hold channel var in order to avoid over-assignment
                            icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
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
                            // console.log("reRESTORE CH: " + heldChs[heldChsKey[0]].ch);
                            // Restore the held-on-hold channel to the used channel array
                            icMIDIoutSettings[key].pb.channels[type].used.push(heldChs[heldChsKey[0]].ch);
                            // Make the Note-Off to close the previous note on the last channel
                            outMsgsQueue.push(icMakeMIDIoutNoteMsg(heldChs[heldChsKey[0]].ch, 0, heldChs[heldChsKey[0]].note, 64));
                            // Delete the held channels
                            delete icMIDIoutSettings[key].pb.channels[type].held[heldChsKey[0]];
                        }
                        // Remove the first channel from the used channel array in order to avoid over-assignment
                        icMIDIoutSettings[key].pb.channels[type].used.splice(0, 1);
                        // Sort the array
                        icMIDIoutSettings[key].pb.channels[type].used.sort((a, b) => {
                            return a - b;
                        });
                        // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                        icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
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
                    for (let k in icMIDIoutSettings[key].pb.channels[type].held) {
                        // If the held channel is the current channel needed
                        if (icMIDIoutSettings[key].pb.channels[type].held[k].ch === currCh) {
                            // Make the Note-Off to close the previous Note-On this channel
                            outMsgsQueue.push(icMakeMIDIoutNoteMsg(icMIDIoutSettings[key].pb.channels[type].held[k].ch, 0, icMIDIoutSettings[key].pb.channels[type].held[k].note, 64));
                            // Remove the current channel from the held-channels array
                            delete icMIDIoutSettings[key].pb.channels[type].held[k];
                        }
                    }
                    // Re-store the current channel to the held-on-hold channels array in order to avoid over-assignment
                    icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                }
                // Store the current channel on the global slot for polypony handling
                icMIDIoutSettings[key].pb.channels[type].last = currCh;
                
                // Make the PitchBend
                outMsgsQueue.push(icMakeMIDIoutPitchBendMsg(currCh, pbAmount));
                // Make the Note-On
                outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 1, instNoteNumber, velocity));

            // Note OFF
            } else if (state === 0) {
                if (icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber]) {
                    // console.log("== Note OFF == : " + ctrlNoteNumber);
                    // Get the current channel to close (to send Note OFF)
                    currCh = icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber].ch;
                    // Restore the held-on-hold channel to the used channel array
                    icMIDIoutSettings[key].pb.channels[type].used.push(currCh);
                    // Sort the array
                    icMIDIoutSettings[key].pb.channels[type].used.sort((a, b) => {
                        return a - b;
                    });
                    // Make the Note-Off to close the channel
                    outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 0, icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber].note, velocity));
                    // Remove the current channel from the held-channels array
                    delete icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber];
                }                
            }
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
                            icMIDIoutSettings[key].pb.channels[type].used.splice(index, 1);
                            // Add the current channel at the end of the heldOrder to maintain the assignment order
                            icMIDIoutSettings[key].pb.channels[type].heldOrder.push(currCh);
                            // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                            icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
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
                        icMIDIoutSettings[key].pb.channels[type].used.splice(0, 1);
                        // Add the current channel at the end of the heldOrder to maintain the assignment order
                        icMIDIoutSettings[key].pb.channels[type].heldOrder.push(currCh); 
                        // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                        icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
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
                    icMIDIoutSettings[key].pb.channels[type].heldOrder.splice(0, 1);
                    icMIDIoutSettings[key].pb.channels[type].heldOrder.push(currCh);
                    // Remove the current channel from the held-channels array
                    for (let k in icMIDIoutSettings[key].pb.channels[type].held) {
                        if (icMIDIoutSettings[key].pb.channels[type].held[k].ch === currCh) {
                            // Make the Note-Off to close the previous Note-On this channel
                            outMsgsQueue.push(icMakeMIDIoutNoteMsg(icMIDIoutSettings[key].pb.channels[type].held[k].ch, 0, icMIDIoutSettings[key].pb.channels[type].held[k].note, 64));
                            delete icMIDIoutSettings[key].pb.channels[type].held[k];
                        }
                    }
                    // Re-store the current channel to the held-on-hold channels array in order to avoid over-assignment
                    icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt};
                }
                // Store the current channel on the global slot for polypony handling
                icMIDIoutSettings[key].pb.channels[type].last = currCh;

                // Make the PitchBend
                outMsgsQueue.push(icMakeMIDIoutPitchBendMsg(currCh, pbAmount));
                // Make the Note-On
                outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 1, instNoteNumber, velocity));

            // Note OFF
            } else if (state === 0) {
                if (icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber]) {
                    // Get the current channel to close (to send Note OFF)
                    currCh = icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber].ch;
                    // Restore the held-on-hold channel to the used channel array
                    icMIDIoutSettings[key].pb.channels[type].used.push(currCh);
                    // Sort the array
                    icMIDIoutSettings[key].pb.channels[type].used.sort((a, b) => {
                        return a - b;
                    });
                    // Make the Note-Off to close the channel
                    outMsgsQueue.push(icMakeMIDIoutNoteMsg(currCh, 0, icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber].note, velocity));
                    // Remove the current channel from the held-channels array
                    delete icMIDIoutSettings[key].pb.channels[type].held[ctrlNoteNumber];
                    let index = icMIDIoutSettings[key].pb.channels[type].heldOrder.indexOf(currCh);
                    icMIDIoutSettings[key].pb.channels[type].heldOrder.splice(index, 1);
                }                
            }
        }
        // Send the outgoing MIDI messages
        for (let i in outMsgsQueue) {
            // If it's a Note-OFF
            if ((outMsgsQueue[i][0] >> 4 === 9 && outMsgsQueue[i][2] === 0) || (outMsgsQueue[i][0] >> 4 === 8)) {
                document.getElementById(key + "_" + (outMsgsQueue[i][0] & 0xf) + "_ft").disabled = false;
                document.getElementById(key + "_" + (outMsgsQueue[i][0] & 0xf) + "_ht").disabled = false;
            // If it's a Note-ON
            } else if (outMsgsQueue[i][0] >> 4 === 9) {
                document.getElementById(key + "_" + (outMsgsQueue[i][0] & 0xf) + "_ft").disabled = true;
                document.getElementById(key + "_" + (outMsgsQueue[i][0] & 0xf) + "_ht").disabled = true;
            }
            // If is a Note-ON or Note-OFF message
            if (outMsgsQueue[i][0] >> 4 === 9 || outMsgsQueue[i][0] >> 4 === 8) {
                // @TODO: Check this native delay method
                // outputPort.send(msg, timestamp)
                // midiOutput.send(outMsgsQueue[i], window.performance.now() + icMIDIoutSettings[key].pb.delay[type]);
                setTimeout(() => {
                    midiOutput.send(outMsgsQueue[i]);
                }, icMIDIoutSettings[key].pb.delay[type]);
            // Else, if it's a PitchBend message 
            } else {
                midiOutput.send(outMsgsQueue[i]);
            }
        }
    }
}