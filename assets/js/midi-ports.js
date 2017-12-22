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
 * MIDI I/O
 * This part provide the access to the Web MIDI API
 */

"use strict";

/*==============================================================================*
 * MAIN MIDI OBJECTS
 *==============================================================================*/
// Initialize the global MIDIAccess object
var icMidi = null;

// Initialize the global map of selected MIDI outputs
var icSelectedOutputs = new Map();

// Get the UI HTML elements that contain the MIDI I/O checkboxes (need to be global ??)
var icHTMLelementInputs = document.getElementById("HTMLo_inputPorts");
var icHTMLelementOutputs = document.getElementById("HTMLo_outputPorts");

// Variable to check if there is at least some MIDI ports...
var icAtLeastOneMidi = {
    availablePort: {
        input: 0,
        output: 0
    },
    openPort: {
        input: 0,
        output: 0
    }
};

// Request MIDI Access
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(icOnMidiInit, icOnMidiReject);
} else {
    // If MIDIAccess does not exist
    // https://webaudiodemos.appspot.com/namm/#/11
    icEventLog("Unfortunately, your browser does not seem to support Web MIDI API.");
}

// On MIDI Access error, if MIDIAccess exist but there is another kind of problem
function icOnMidiReject(error) {
    icEventLog("Failed to get MIDI access because: " + error);
}

// On MIDI Access, when MIDI is initialized
function icOnMidiInit(MidiAccess) {
    icEventLog("Luckily, your browser seems to support the Web MIDI API!");
    // Store in the global ??(in real usage, would probably keep in an object instance)??
    icMidi = MidiAccess;
    // UI INITIALIZATION
    // Create for the first time the HTML Input and Output ports selection boxes
    // Log the available ports on the Event Log
    icMidi.inputs.forEach((value) => {
        icCreatePortCheckbox(value, icHTMLelementInputs);
        icPortLogger(value);
    });
    icMidi.outputs.forEach((value) => {
        icCreatePortCheckbox(value, icHTMLelementOutputs);
        icPortLogger(value);
    });

    // When the state or an attribute of any port changes
    // Execute the Midi State Refresh function with the Event as argument
    icMidi.onstatechange = icMidiStateRefresh;
    // Check the MIDI input ports available
    icCheckAtLeastOneMidi("io", 0);
}

/*==============================================================================*
 * MIDI PORTS HW/UI HANDLING 
 *==============================================================================*/
// Log on the Event Log the informations about a single input or output port
function icPortLogger(midiPort) {
    // let icPortInfos = icPort.state + " " + icPort.type + " port | id: " + icPort.id + " | name: " + icPort.name + " | manufacturer: " + icPort.manufacturer + " | version:" + icPort.version + " | connection: " + icPort.connection;
    let portInfos = midiPort.type + " port: " + midiPort.name + " | " + midiPort.state + ": " + midiPort.connection;
    icEventLog(portInfos);
}

// Create a single checkbox and its label in a div.
// Assign the onclick event to the the checkbox.
function icCreatePortCheckbox(midiPort, htmlElement) {
    // DIV
    // Create the <div> container
    var portSelectorDiv = document.createElement('div');
    // <div> container: set ID
    portSelectorDiv.id = "div" + midiPort.id;
    // <div> container: set CLASS
    portSelectorDiv.className = 'IOcheckbox';
    // Insert the <div> container into the htmlElement
    htmlElement.appendChild(portSelectorDiv);

    // INPUT
    // Create the <input> element
    var portSelectorInput = document.createElement('input');
    // <input> element: set CHECKBOX TYPE
    portSelectorInput.type = 'checkbox';
    // <input> checkbox: set VALUE
    portSelectorInput.value = midiPort.id;
    // <input> checkbox: set CLASS
    portSelectorInput.className = midiPort.type;
    // <input> checkbox: set the onclick function
    portSelectorInput.addEventListener("click", icPortSelect);
    // <input> checkbox: set ID
    portSelectorInput.id = midiPort.id;
    // Insert the <input> checkbox into the <div> container
    portSelectorDiv.appendChild(portSelectorInput);

    // LABEL
    // Create the <label> element
    var portSelectorLabel = document.createElement("label");
    // <label> element: set FOR
    portSelectorLabel.setAttribute("for", midiPort.id);
    // <label> element: set TEXT CONTENT
    portSelectorLabel.innerHTML = midiPort.name;
    // Insert the <label> element into the <div> container
    portSelectorDiv.appendChild(portSelectorLabel);
}

// onclick event from the port checkbox
// Listen for any MIDI input from the selected MIDI port on the HTML checkbox
function icPortSelect(event) {
    let elem = event.target;
    // If the port is selected
    if (elem.checked) {
        switch (elem.className) {
            // If the port is an input, open that port and listen from it
            case "input":
                icMidi.inputs.get(elem.value).onmidimessage = icMidiMessageReceived;
                icAtLeastOneMidi.openPort.input++;
                break;
            // If the port is an output, map it on the icSelectedOutputs global object/map
            case "output":
                icSelectedOutputs.set(icMidi.outputs.get(elem.value).id, icMidi.outputs.get(elem.value));
                icAtLeastOneMidi.openPort.output++;
                break;
            // Debug
            default:
                console.log("The 'class' attribute of the I/O checkbox on the UI has an unexpected value: " + elem.className);
                break;
        }
    // If the port in unselected
    } else {
        switch (elem.className) {
            // If the port is an input, close that port
            case "input":
                icMidi.inputs.get(elem.value).close();
                icAtLeastOneMidi.openPort.input--;
                break;
            // If the port is an output, remove it on the icSelectedOutputs global object/map
            case "output":
                icSelectedOutputs.delete(icMidi.outputs.get(elem.value).id);
                icAtLeastOneMidi.openPort.output--;
                break;
            // Debug
            default:
                console.log("The 'class' attribute of the I/O checkbox on the UI has an unexpected value: " + elem.className);
                break;
        }
    }
}

// Midi State Refresh for hot (un)plugging - Event from MidiAccess.onstatechange
// Update the informations about the state of the MIDI devices in the HTML UI
function icMidiStateRefresh(event) {
    var midiPort = event.port;
    var htmlElement = null;
    var inputPortSelectorDiv = document.getElementById("div" + midiPort.id);
    var inputPortSelector = document.getElementById(midiPort.id);
    // Print information about the (dis)connected MIDI controller
    icPortLogger(midiPort);
    switch (midiPort.state) {
        // If the port that generated the event is disconnected: delete port
        case "disconnected":
            if (midiPort.type === "input") {
                if (inputPortSelector.checked === true) {
                    icAtLeastOneMidi.openPort.input--;
                }
                // Check the available MIDI input ports
                icCheckAtLeastOneMidi("i", 0);
            } else if (midiPort.type === "output") {
                if (inputPortSelector.checked === true) {
                    icAtLeastOneMidi.openPort.output--;
                }
                // Check the available MIDI output ports
                icCheckAtLeastOneMidi("o", 0);
            }
            // Remove the checkbox
            inputPortSelectorDiv.remove();
            break;
        // If the port that generated the event is connected: add port
        case "connected":
            // If the checkbox does not exist already
            if (!inputPortSelectorDiv) {
                switch (midiPort.type) {
                    // If the port is an input
                    case "input":
                        // Select the element containing the input checkboxes
                        htmlElement = icHTMLelementInputs;
                        break;
                    // If the port is an output
                    case "output":
                        // Select the element containing the output checkboxes
                        htmlElement = icHTMLelementOutputs;
                        break;
                    // Debug
                    default:
                        console.log("The '.type' of the port has an unexpected value: " + midiPort.type);
                        break;
                }
                // Add the new checkbox to the HTML UI using the global function
                icCreatePortCheckbox(midiPort, htmlElement);
            }
            break;
        // Debug
        default:
            console.log("The '.state' of the port has an unexpected value: " + midiPort.state);
            break;
    }
}

// Check if there is at least one MIDI ports available (I or O)
// Check if there is at least one MIDI ports open (I or O)
// (xPut: "i/o/io", isOpen: 0/1)
function icCheckAtLeastOneMidi(xPut, isOpen) {
    icAtLeastOneMidi.availablePort.input = icMidi.inputs.size;
    icAtLeastOneMidi.availablePort.output = icMidi.outputs.size;
    let msg = "";
    if (isOpen === 0) {
        switch (xPut) {
            case "io":
                if (icAtLeastOneMidi.availablePort.input === 0 && icAtLeastOneMidi.availablePort.output === 0) {
                    msg = "NO MIDI INPUT/OUTPUT PORTS AVAILABLE.\nTo best use this software, connect:\n– MIDI Controller >> incoming MIDI port\n– MIDI Instrument >> outgoing MIDI port";
                    icEventLog(msg);
                    alert(msg);
                    break;
                }
                // Fall through
            case "i":
                if (icAtLeastOneMidi.availablePort.input === 0) {
                    msg = "NO MIDI INPUT PORTS AVAILABLE!\nTo best use this software, an Input MIDI Controller is recommended.\nIn order to connect a MIDI Controller, at least one MIDI input port is required.";
                    icEventLog(msg);
                    alert(msg);
                    break;
                }
                // Fall through
            case "o":
                if (icAtLeastOneMidi.availablePort.output === 0) {
                    msg = "NO MIDI OUTPUT PORTS AVAILABLE!\nIn order to retune and play a MIDI Instrument, an Output MIDI Port is required.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
        }
    //@TODO: isOpen NOT USED YET
    //Use isOpen to check if the user selected an output port
    } else if (isOpen === 1) {
        switch (xPut) {
            case "i":
                if (icAtLeastOneMidi.openPort.input === 0) {
                    msg = "You have to select at least one MIDI INPUT port.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
            case "o":
                if (icAtLeastOneMidi.openPort.output === 0) {
                    msg = "You have to select at least one MIDI OUTPUT port.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
            case "io":
                if (icAtLeastOneMidi.openPort.input === 0 && icAtLeastOneMidi.openPort.output === 0) {
                    msg = "You have to select at least one MIDI INPUT and one MIDI OUTPUT port.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
        }
    }
}