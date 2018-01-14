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
 * @fileoverview MIDI I/O<br>
 *     This part provide the access to the Web MIDI API
 *               
 * @author Walter Mantovani < armonici.it [at] gmail [dot] com >
 */

"use strict";

/*==============================================================================*
 * MAIN MIDI OBJECTS
 *==============================================================================*/
/**
 * The global MIDIAccess object
 * 
 * @see {@link https://webaudio.github.io/web-midi-api/#MIDIAccess|Web MIDI API specs} for 'MIDIAccess'
 *
 * @type {MIDIAccess}
 */
var icMidi = null;

/**
 * The global map of selected MIDI outputs
 *
 * @type {Map}
 */
var icSelectedOutputs = new Map();

/**
 * The UI HTML elements that contain the MIDI-IN checkboxes (need to be global ??)
 *
 * @type {Object}
 */
var icHTMLelementInputs = document.getElementById("HTMLo_inputPorts");

/**
 * The UI HTML elements that contain the MIDI-OUT checkboxes (need to be global ??)
 *
 * @type {Object}
 */
var icHTMLelementOutputs = document.getElementById("HTMLo_outputPorts");

/**
 * Data structure to keep track of how many ports are available and how many are used
 *
 * @type {Object}
 */
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
    // @see - https://webaudiodemos.appspot.com/namm/#/11
    icEventLog("Unfortunately, your browser does not seem to support Web MIDI API.");
}

/**
 * What to do on MIDI Access error, if MIDIAccess exist but there is another kind of problem
 *
 * @see {@link https://webaudio.github.io/web-midi-api/#extensions-to-the-navigator-interface|Web MIDI API specs}
 *
 * @param  {DOMException} error - Possible error
 */
function icOnMidiReject(error) {
    icEventLog("Failed to get MIDI access because: " + error);
}

/**
 * What to do on MIDI Access, when MIDI is initialized
 *
 * @param  {MIDIAccess} MidiAccess - The MIDIAccess object; see the {@link https://webaudio.github.io/web-midi-api/#MIDIAccess|Web MIDI API specs}
 */
function icOnMidiInit(midiAccess) {
    icEventLog("Luckily, your browser seems to support the Web MIDI API!");
    // Store in the global ??(in real usage, would probably keep in an object instance)??
    icMidi = midiAccess;
    // UI INITIALIZATION
    // Button to open the MIDI settings
    document.getElementById("HTMLf_motPanelModalShow").addEventListener("click", icOpenMidiPanel);
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
    // Check the MIDI-IN ports available
    icCheckAtLeastOneMidi("io", false);
}

/*==============================================================================*
 * MIDI PORTS HW/UI HANDLING 
 *==============================================================================*/
/**
 * Log on the Event Log the informations about a single input or output port
 *
 * @param {MIDIPort} midiPort - The MIDI port; see the {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
 */
function icPortLogger(midiPort) {
    // let icPortInfos = icPort.state + " " + icPort.type + " port | id: " + icPort.id + " | name: " + icPort.name + " | manufacturer: " + icPort.manufacturer + " | version:" + icPort.version + " | connection: " + icPort.connection;
    let portInfos = midiPort.type + " port: " + midiPort.name + " | " + midiPort.state + ": " + midiPort.connection;
    icEventLog(portInfos);
}

/**
 * Create a single checkbox and its label in a div.
 * Assign the onclick event to the the checkbox.
 *
 * @param {MIDIPort} midiPort    - The MIDI port; see the {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
 * @param {Object}   htmlElement - The 'div' containers of the ports on UI ('icHTMLelementInputs' or 'icHTMLelementOutputs')
 */
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
    // <input> checkbox: set NAME (useful to avoid port loops in icPortSelect())
    portSelectorInput.name = midiPort.name;
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

/**
 * If an Input port has been selected, open that port and start to listen from it.
 * If an Output port has been selected, start to send MIDI messages to that port.
 * The function is invoked when a HTML checkbox has been clicked.
 * 
 * @param {Event}   event                - OnClick event on the MIDI I/O Ports checkboxes
 * @param {boolean} event.target.checked - Checkbox checked or not
 */
function icPortSelect(event) {
    let elem = event.target;
    // let alterPortType = elem.className === "input" ? "outputs" : "inputs";
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
                icUpdateMOT();
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
                icUpdateMOT();
                break;
            // Debug
            default:
                console.log("The 'class' attribute of the I/O checkbox on the UI has an unexpected value: " + elem.className);
                break;
        }
    }
    // Prevent set input<>output on the same port in order to avoid MIDI loops
    // icMidi[alterPortType].forEach((value, key, map) => {
    //     if (value.name === elem.name) {
    //         // Disable the other chackbox with same Port Name
    //         document.getElementById(key).disabled = elem.checked;
    //     }
    // });
}

/**
 * Midi State Refresh for hot (un)plugging
 * Update the informations about the state of the MIDI ports/devices in the HTML UI
 *
 * @param  {MIDIConnectionEvent} event      - Event from MidiAccess.onstatechange; see the {@link https://webaudio.github.io/web-midi-api/#MIDIConnectionEvent|Web MIDI API specs}
 * @param  {MIDIPort}            event.port - The MIDI Port; see the {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
 */
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
                // Check the available MIDI-IN ports
                icCheckAtLeastOneMidi("i", false);
            } else if (midiPort.type === "output") {
                if (inputPortSelector.checked === true) {
                    icAtLeastOneMidi.openPort.output--;
                }
                // Check the available MIDI-OUT ports
                icCheckAtLeastOneMidi("o", false);
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

/**
 * Check if there is at least one available MIDI port (Input or Output)
 * Check if there is at least one open MIDI port (Input or Output)
 *
 * @param  {('i'|'o'|'io')}  xPut   - Check for Input ('i'), Output port ('o') or both ('io')
 * @param  {Boolean}         isOpen - false: Check if there are ports selected and used by the user
 *                                    true:  Check if there are available ports
 */
function icCheckAtLeastOneMidi(xPut, isOpen) {
    icAtLeastOneMidi.availablePort.input = icMidi.inputs.size;
    icAtLeastOneMidi.availablePort.output = icMidi.outputs.size;
    let msg = "";
    if (isOpen === false) {
        switch (xPut) {
            case "io":
                if (icAtLeastOneMidi.availablePort.input === 0 && icAtLeastOneMidi.availablePort.output === 0) {
                    msg = "NO MIDI-IN/OUT PORTS AVAILABLE.\nTo best use this software, connect:\n– MIDI Controller >> incoming MIDI port\n– MIDI Instrument >> outgoing MIDI port";
                    icEventLog(msg);
                    // alert(msg);
                    break;
                }
                // Fall through
            case "i":
                if (icAtLeastOneMidi.availablePort.input === 0) {
                    msg = "NO MIDI-IN PORTS AVAILABLE!\nTo best use this software, an Input MIDI Controller is recommended.\nIn order to connect a MIDI Controller, at least one MIDI-IN port is required.";
                    icEventLog(msg);
                    // alert(msg);
                    break;
                }
                // Fall through
            case "o":
                if (icAtLeastOneMidi.availablePort.output === 0) {
                    msg = "NO MIDI-OUT PORTS AVAILABLE!\nIn order to retune and play a MIDI Instrument, an Output MIDI Port is required.";
                    icEventLog(msg);
                    // alert(msg);
                }
                break;
        }
    // @todo - isOpen NOT USED YET
    //Use isOpen to check if the user selected an output port
    } else if (isOpen === true) {
        switch (xPut) {
            case "i":
                if (icAtLeastOneMidi.openPort.input === 0) {
                    msg = "You have to select at least one MIDI-IN port.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
            case "o":
                if (icAtLeastOneMidi.openPort.output === 0) {
                    msg = "You have to select at least one MIDI-OUT port.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
            case "io":
                if (icAtLeastOneMidi.openPort.input === 0 && icAtLeastOneMidi.openPort.output === 0) {
                    msg = "You have to select at least one MIDI-IN and one MIDI-OUT port.";
                    icEventLog(msg);
                    alert(msg);
                }
                break;
        }
    }
}