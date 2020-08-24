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
// Button to open the MIDI settings
document.getElementById("HTMLf_motPanelModalShow").addEventListener("click", icOpenMidiPanel);

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
    icCreatePortCheckbox(icWebSYNTH[0], icHTMLelementOutputs);
    icCreatePortCheckbox(icWebSYNTH[1], icHTMLelementOutputs);
    icPortLogger(icWebSYNTH[0]);
    icPortLogger(icWebSYNTH[1]);

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
                if (elem.value === "webmidilink_out0") {
                    icSelectedOutputs.set(elem.value, icWebSYNTH[0]);
                    document.getElementById("HTMLf_webMidiLinkLoader0").style.display = "table";
                    icWebSYNTH[0].startStateCheck();
                } else if (elem.value === "webmidilink_out1") {
                    icSelectedOutputs.set(elem.value, icWebSYNTH[1]);
                    document.getElementById("HTMLf_webMidiLinkLoader1").style.display = "table";
                    icWebSYNTH[1].startStateCheck();
                } else {
                    icSelectedOutputs.set(icMidi.outputs.get(elem.value).id, icMidi.outputs.get(elem.value));
                }
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
                if (elem.value === "webmidilink_out0") {
                    icSelectedOutputs.get(elem.value).unload();
                    icSelectedOutputs.delete(elem.value);
                    document.getElementById("HTMLf_webMidiLinkLoader0").style.display = "none";
                    icWebSYNTH[0].stopStateCheck();
                } else if (elem.value === "webmidilink_out1") {
                    icSelectedOutputs.get(elem.value).unload();
                    icSelectedOutputs.delete(elem.value);
                    document.getElementById("HTMLf_webMidiLinkLoader1").style.display = "none";
                    icWebSYNTH[1].stopStateCheck();
                } else {
                    icSelectedOutputs.delete(icMidi.outputs.get(elem.value).id);
                }
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

/*==============================================================================*
 * WEB-MIDI-LINK MESSAGES HANDLER 
 * https://www.g200kg.com/en/docs/webmidilink/index.html
 * (implementation: experimental - work in progress)
 *==============================================================================*/

window.addEventListener("message", icWebMidiLinkInput, false);

function icWebMidiLinkInput(event) {
   if (typeof event.data === 'string') {
        var msg = event.data.split(",");
        switch (msg[0]) {
            // Level 1 messages
            case "link":
                let synthNum = 0
                if (event.source === icWebSYNTH[1].synthWindow) {
                    synthNum = 1
                }

                // https://www.g200kg.com/en/docs/webmidilink/spec.html @ Link Level 1
                switch (msg[1]) {
                    // -------------------------------------------------
                    // Host<=Synth : if Harmonicarium is used as HOST
                    case "ready":
                        icWebSYNTH[synthNum].becomeReady(msg[1]);
                        break;
                    case "progress":
                        icWebSYNTH[synthNum].becomeReady(msg[1]);
                        break;
                    case "patch":
                        console.log("WebMidiLink Level 1 message (link) 'patch' is not implemented yet!");
                        // ReceivePatchStringFromSynth(msg[2]);
                        break;
                    // -------------------------------------------------
                    // Host=>Synth : if Harmonicarium is used as INSTRUMENT/SYNTH
                    case "reqpatch":
                        console.log("WebMidiLink Level 1 message (link) 'reqpatch' is not implemented yet!");
                        // event.source.postMessage("link,patch," + ReqPatchString(),"*");
                        break;
                    case "setpatch":
                        console.log("WebMidiLink Level 1 message (link) 'setpatch' is not implemented yet!");
                        // ReceivePatchStringFromHost(msg[2]);
                        break;
                    // -------------------------------------------------
                    default:
                        console.error("Unknown WebMidiLink Level 1 message (link): '"+ msg[1] +"'");
                        break;
                }
                break;
            // Level 0 messages
            case "midi":
                // Create a MIDI message
                let midievent = {
                    data: [parseInt(msg[1], 16), parseInt(msg[2], 16), parseInt(msg[3], 16), false, false],
                    srcElement: {
                        id: "webmidilink_in",
                        manufacturer : "Industrie Creative",
                        name: "WebMidiLink Port",
                        type: "input"
                    }
                };
                // Re-send the MIDI generated message
                icMidiMessageReceived(midievent);
                break;
        }
    }
}


// Should be called when Harmonicarium (hosted) is ready
// Synth=>Host
function icWebMidiLinkReady() {
    // Send message to the host web app
    if (window.opener)
        window.opener.postMessage("link,ready", "*");
    else
        window.parent.postMessage("link,ready", "*");
}


// class ICwebMidiLinkSynth {

// }
 

function ICwebMidiLinkSynth(key) {
    this.synthWindow = {closed: true};

    this.id = "webmidilink_out" + key;
    this.manufacturer = "Industrie Creative";
    this.name = "WebMidiLink OUT Port " + (key+1);
    this.state = "disconnected";
    this.type = "output";
    this.uiStatus = document.getElementById("HTMLf_webMidiLinkStatus"+key);

    this.load = function(url) {
        alert("A new popup-window containing a web-app instrument is about to be opened and may end up behind the current browser window.\n\nMake sure you interact at least once with the User Interface of the instrument that opened in the new popup-window before you start sending WebMidiLink signals from Harmonicarium.\n\nFor security reasons, the browser may suspend the AudioContext status until the user interacts with that window.\n\nClick OK to continue.");
        this.synthWindow = window.open(url, (this.id +"_window"), "width=900,height=670,scrollbars=yes,resizable=yes");
        this.state = "connected";
        this.uiStatus.innerText = "LOADED";
        this.uiStatus.classList.remove("webmidilinkNotLoaded", "webmidilinkProgress");
        this.uiStatus.classList.add("webmidilinkLoaded");
    }
    this.unload = function() {
        if (this.synthWindow.window){
            this.synthWindow.close();
        }
        this.uiStatus.innerText = "NOT LOADED";
        this.uiStatus.classList.remove("webmidilinkLoaded", "webmidilinkProgress");
        this.uiStatus.classList.add("webmidilinkNotLoaded");
    }
    this.send = function(msg) {
         this.sendMessage(this.synthWindow, "midi," + msg.map(function(e){return e.toString(16)}));
    }
    // this.AllSoundOff = function() {
    //     this.SendMessage(this.synthWindow, "midi,b0,78,0");
    // }
    this.sendMessage = function(synthWindow, msg) {
        if (this.synthWindow.window) {
            this.synthWindow.postMessage(msg, "*");
        }
        else {
            this.uiStatus.innerText = "NOT LOADED";
            this.uiStatus.classList.remove("webmidilinkLoaded", "webmidilinkProgress");
            this.uiStatus.classList.add("webmidilinkNotLoaded");
        }
    }
    this.startStateCheck = function() {
        let parent = this;
        this.stateCheckTimer = setInterval(function() {
            if (parent.synthWindow.closed) {
                clearInterval(this.stateCheckTimer);
                parent.unload();
            }
        }, 1500);
    }
    this.stopStateCheck = function() {
        clearInterval(this.stateCheckTimer);
    }
    this.becomeReady = function(msg) {
        if (msg === "ready") {
            this.isReady = true;
            this.uiStatus.innerText = "LOADED (ready)";
            this.uiStatus.classList.remove("webmidilinkNotLoaded", "webmidilinkProgress");
            this.uiStatus.classList.add("webmidilinkLoaded");
        } else if (msg === "progress") {
            this.isReady = false;
            this.uiStatus.innerText = "LOADING IN PROGRESS...";
            this.uiStatus.classList.remove("webmidilinkNotLoaded", "webmidilinkLoaded");
            this.uiStatus.classList.add("webmidilinkProgress");
        }
    }
    this.isReady = false;
}

// var icWebSYNTH = new ICwebMidiLinkSynth("webmidilink_out");


var icWebSYNTH = {
    0: new ICwebMidiLinkSynth(0),
    1: new ICwebMidiLinkSynth(1)
};

function SynthListCallback(synthlist) {
    var sel0 = document.getElementById("HTMLf_webMidiLinkSynthSelect0");
    var sel1 = document.getElementById("HTMLf_webMidiLinkSynthSelect1");
    for (var i = 0; i < synthlist.length; ++i) {
        sel0.options[i] = new Option(synthlist[i].author+": "+synthlist[i].name, synthlist[i].url);
        sel1.options[i] = new Option(synthlist[i].author+": "+synthlist[i].name, synthlist[i].url);
    }
}

function icWebMidiLinkSetUrl(id, url) {
  var obj = document.getElementById(id);
  obj.value = url;
}
