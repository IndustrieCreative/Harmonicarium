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

/** The MidiPorts class */
HUM.midi.MidiPorts = class {
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
        this.name = 'midiPorts';
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
         * The global MIDIAccess object.
         * 
         * @see {@link https://webaudio.github.io/web-midi-api/#MIDIAccess|Web MIDI API specs} for 'MIDIAccess'.
         *
         * @member {MIDIAccess}
         */
        this.midiAccess = null;

        /**
         * Namespace for WebMidiLink.
         *
         * @member {Object}
         * 
         * @property {HUM.midi.WebMidiLinkIn}                   input   - The WebMidiLinkIn instance.
         * @property {Object.<string, HUM.midi.WebMidiLinkOut>} outputs - An array containing all the WebMidiLinkOut instances; the <em>key</em> is the {@link HUM.midi.WebMidiLinkOut#id}.
         * @property {number}                                   outQty  - How many WebMidiLinkOut instances must be created (integer).
         */
        this.webMidi = {
            input: new HUM.midi.WebMidiLinkIn(this.dhc, this.midi),
            outputs: {},
            outQty: 3,
        };

        /**
         * The global map of selected MIDI outputs.
         *
         * @member {Map.<string, MIDIPort>}
         */
        this.selectedOutputs = new Map();

        /**
         * Data structure to keep track of how many ports are available and how many are used.
         *     Just used to inform the user about the current MIDI port situation and give the right advices.
         *
         * @member {Object}
         * 
         * @property {Object} availablePort        - Available ports namespace
         * @property {number} availablePort.input  - Number of available input ports
         * @property {number} availablePort.output - Number of available output ports
         * @property {Object} openPort             - Open ports namespace
         * @property {number} openPort.input       - Number of open input ports
         * @property {number} openPort.output      - Number of open output ports
         */
        this.atLeastOneMidi = {
            availablePort: {
                input: 0,
                output: 0
            },
            openPort: {
                input: 0,
                output: 0
            }
        };

        this.parameters = new this.Parameters(this);

        // Request MIDI Access
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(this._onMidiInit.bind(this), this._onMidiReject.bind(this));
        } else {
            // If MIDIAccess does not exist
            // @see - https://webaudiodemos.appspot.com/namm/#/11
            this.dhc.harmonicarium.components.backendUtils.eventLog("Unfortunately, your browser does not seem to support Web MIDI API.");
            this._postRequestMIDI();
        }

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Inintialize the WebMidiLink Output and make accessible the UI modal panel 
     */
    _postRequestMIDI() {
        this._initWebMidiLinkOut();
        // Button to open the MIDI settings (deplrecated since using Bootstrap)
        // this.uiElements.fn.motPanelModalShow.addEventListener("click", () => this.openMidiPanel() );
    }

    /**
     * Inintialize the WebMidiLink Output
     */
    _initWebMidiLinkOut() {
        for (let key = 0; key < this.webMidi.outQty; key++) {
            // Create a new WebMidiLink output port
            let id = `webmidilink_out_${key}`;
            let webMidiLinkPort = new HUM.midi.WebMidiLinkOut(key, id, this.dhc, this.midi);
            this.webMidi.outputs[id] = webMidiLinkPort;
            
            // Create the checkbox for the new port
            this.createPortCheckbox(webMidiLinkPort, this.parameters.outputPorts.uiElements.out.outputPorts);
            this.portLogger(webMidiLinkPort);
        }
    }

    /**
     * What to do on MIDI Access error, if MIDIAccess exist but there is another kind of problem.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#extensions-to-the-navigator-interface|Web MIDI API specs}
     *
     * @param  {DOMException} error - Possible error.
     */
    _onMidiReject(error) {
        this.dhc.harmonicarium.components.backendUtils.eventLog("Failed to get MIDI access because: " + error);
        this._postRequestMIDI();
    }

    /**
     * What to do on MIDI Access, when MIDI is initialized
     *
     * @param {MIDIAccess} midiAccess - The MIDIAccess object; see the {@link https://webaudio.github.io/web-midi-api/#MIDIAccess|Web MIDI API specs}
     */
    _onMidiInit(midiAccess) {
        this.dhc.harmonicarium.components.backendUtils.eventLog("Luckily, your browser seems to support the Web MIDI API!");
        // Store in the global ??(in real usage, would probably keep in an object instance)??
        this.midiAccess = midiAccess;
        // UI INITIALIZATION
        // Create for the first time the HTML Input and Output ports selection boxes
        // Log the available ports on the Event Log
        this.midiAccess.inputs.forEach((value) => {
            this.createPortCheckbox(value, this.parameters.inputPorts.uiElements.out.inputPorts);
            this.portLogger(value);
        });
        this.midiAccess.outputs.forEach((value) => {
            this.createPortCheckbox(value, this.parameters.outputPorts.uiElements.out.outputPorts);
            this.portLogger(value);
        });

        // When the state or an attribute of any port changes
        // Execute the Midi State Refresh function with the Event as argument
        this.midiAccess.onstatechange = (e) => this.midiStateRefresh(e);
        // Check the MIDI-IN ports available
        this.checkAtLeastOneMidi("io", false);

        this._postRequestMIDI();
    }

    /**
     * Log on the Event Log the informations about a single input or output port.
     *
     * @param {MIDIPort} midiPort - The MIDI port.
     */
    portLogger(midiPort) {
        // let icPortInfos = icPort.state + " " + icPort.type + " port | id: " + icPort.id + " | name: " + icPort.name + " | manufacturer: " + icPort.manufacturer + " | version:" + icPort.version + " | connection: " + icPort.connection;
        let portInfos = midiPort.type + " port: " + midiPort.name + " | " + midiPort.state + ": " + midiPort.connection;
        this.dhc.harmonicarium.components.backendUtils.eventLog(portInfos);
    }

    /**
     * Create a single checkbox and its label in a div.
     * Assign the onclick event to the the checkbox.
     *
     * @param {MIDIPort}    midiPort    - The MIDI port; see the {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
     * @param {HTMLElement} htmlElement - The 'div' containers of the ports on UI ('this.parameters.inputPorts.uiElements.out.inputPorts' or 'this.parameters.outputPorts.uiElements.out.outputPorts')
     */
    createPortCheckbox(midiPort, htmlElement) {
        let dhcID = this.dhc.id;
        // DIV
        // Create the <div> container
        let portSelectorDiv = document.createElement('div');
        // <div> container: set ID
        portSelectorDiv.id = `midiPortDiv${midiPort.id}_${dhcID}`;
        // <div> container: set CLASS
        portSelectorDiv.className = 'IOcheckbox';
        // Insert the <div> container into the htmlElement
        htmlElement.appendChild(portSelectorDiv);

        // INPUT
        // Create the <input> element
        let portSelectorInput = document.createElement('input');
        // <input> element: set CHECKBOX TYPE
        portSelectorInput.type = 'checkbox';
        // <input> checkbox: set VALUE
        portSelectorInput.value = midiPort.id;
        // <input> checkbox: set CLASS
        portSelectorInput.className = midiPort.type;
        // <input> checkbox: set NAME (useful to avoid port loops in this.portSelect())
        portSelectorInput.name = midiPort.name;
        // <input> checkbox: set the onclick function
        portSelectorInput.addEventListener("click", (e) => this.portSelect(e) );
        // <input> checkbox: set ID
        portSelectorInput.id = midiPort.id + "_" + dhcID;
        // Insert the <input> checkbox into the <div> container
        portSelectorDiv.appendChild(portSelectorInput);

        // LABEL
        // Create the <label> element
        let portSelectorLabel = document.createElement("label");
        // <label> element: set FOR
        portSelectorLabel.setAttribute("for", midiPort.id + "_" + dhcID);
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
     * @param {Object}  event.target         - The event's target HTML element (could be just a namespace)
     * @param {boolean} event.target.value   - The ID of the port
     * @param {boolean} event.target.checked - Checkbox checked or not
     */
    portSelect(event) {
        let elem = event.target;
        let portID = elem.value;
        // let alterPortType = elem.className === "input" ? "outputs" : "inputs";
        // If the port is selected
        if (elem.checked) {
            switch (elem.className) {
                // If the port is an input, open that port and listen from it
                case "input":
                    this.midiAccess.inputs.get(portID).onmidimessage = (midievent) => this.midi.in.midiMessageReceived(midievent);
                    this.atLeastOneMidi.openPort.input++;
                    break;
                // If the port is an output, map it on the this.selectedOutputs global object/map
                case "output":
                    // WebMidiLink MIDI ports
                    if (portID.indexOf('webmidilink') > -1) {
                        this.selectedOutputs.set(portID, this.webMidi.outputs[portID]);
                        this.webMidi.outputs[portID].openPort();
                    // System MIDI ports
                    } else {
                        this.selectedOutputs.set(this.midiAccess.outputs.get(portID).id, this.midiAccess.outputs.get(portID));
                    }
                    this.atLeastOneMidi.openPort.output++;
                    this.midi.out.updateMidiOutUI();
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
                    // << ALL NOTES OFF TO DHC >>
                    this.dhc.panic();
                    // Close port
                    this.midiAccess.inputs.get(portID).close();
                    this.atLeastOneMidi.openPort.input--;
                    break;
                // If the port is an output, remove it on the this.selectedOutputs global object/map
                case "output":
                    // << ALL NOTES OFF TO MIDI OUT >>
                    this.midi.out.allNotesOffPort(portID, 'soft');
                    // WebMidiLink MIDI ports
                    if (portID.indexOf('webmidilink') > -1) {
                        this.webMidi.outputs[portID].closePort();
                        this.selectedOutputs.delete(portID);
                    // System MIDI ports
                    } else {
                        this.selectedOutputs.delete(this.midiAccess.outputs.get(portID).id);
                    }
                    this.atLeastOneMidi.openPort.output--;
                    this.midi.out.updateMidiOutUI();
                    break;
                // Debug
                default:
                    console.log("The 'class' attribute of the I/O checkbox on the UI has an unexpected value: " + elem.className);
                    break;
            }
        }
        // Prevent set input<>output on the same port in order to avoid MIDI loops
        // this.midiAccess[alterPortType].forEach((value, key, map) => {
        //     if (value.name === elem.name) {
        //         // Disable the other chackbox with same Port Name
        //         document.getElementById(key).disabled = elem.checked;
        //     }
        // });
    }
    /**
     * Midi State Refresh for hot (un)plugging.
     * Update the informations about the state of the MIDI ports/devices in the HTML UI.
     *
     * @param  {MIDIConnectionEvent} event      - Event from MidiAccess.onstatechange; see the {@link https://webaudio.github.io/web-midi-api/#MIDIConnectionEvent|Web MIDI API specs}
     * @param  {MIDIPort}            event.port - The MIDI Port; see the {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
     */
    midiStateRefresh(event) {
        let dhcID = this.dhc.id,
            midiPort = event.port,
            htmlElement = null,
            inputPortSelectorDiv = document.getElementById(`midiPortDiv${midiPort.id}_${dhcID}`),
            inputPortSelector = document.getElementById(midiPort.id + "_" + dhcID);
        // Print information about the (dis)connected MIDI controller
        this.portLogger(midiPort);
        switch (midiPort.state) {
            // If the port that generated the event is disconnected: delete port
            case "disconnected":
                if (midiPort.type === "input") {
                    // << ALL NOTES OFF TO DHC >>
                    this.dhc.panic();
                    if (inputPortSelector.checked === true) {
                        this.atLeastOneMidi.openPort.input--;
                    }
                    // Check the available MIDI-IN ports
                    this.checkAtLeastOneMidi("i", false);
                } else if (midiPort.type === "output") {
                    if (inputPortSelector.checked === true) {
                        this.atLeastOneMidi.openPort.output--;
                    }
                    // Check the available MIDI-OUT ports
                    this.checkAtLeastOneMidi("o", false);
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
                            htmlElement = this.parameters.inputPorts.uiElements.out.inputPorts;
                            break;
                        // If the port is an output
                        case "output":
                            // Select the element containing the output checkboxes
                            htmlElement = this.parameters.outputPorts.uiElements.out.outputPorts;
                            break;
                        // Debug
                        default:
                            console.log("The '.type' of the port has an unexpected value: " + midiPort.type);
                            break;
                    }
                    // Add the new checkbox to the HTML UI using the global function
                    this.createPortCheckbox(midiPort, htmlElement);
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
     * @param  {('i'|'o'|'io')} xPut   - Check for Input ('i'), Output port ('o') or both ('io')
     * @param  {boolean}        isOpen - false: Check if there are ports selected and used by the user
     *                                   true:  Check if there are available ports
     */
     checkAtLeastOneMidi(xPut, isOpen) {
        this.atLeastOneMidi.availablePort.input = this.midiAccess.inputs.size;
        this.atLeastOneMidi.availablePort.output = this.midiAccess.outputs.size;
        let msg = "";
        if (isOpen === false) {
            switch (xPut) {
                case "io":
                    if (this.atLeastOneMidi.availablePort.input === 0 && this.atLeastOneMidi.availablePort.output === 0) {
                        msg = "NO MIDI-IN/OUT PORTS AVAILABLE.\nTo best use this software, connect:\n– MIDI Controller >> incoming MIDI port\n– MIDI Instrument >> outgoing MIDI port";
                        this.dhc.harmonicarium.components.backendUtils.eventLog(msg);
                        // alert(msg);
                        break;
                    }
                    /* falls through */
                case "i":
                    if (this.atLeastOneMidi.availablePort.input === 0) {
                        msg = "NO MIDI-IN PORTS AVAILABLE!\nTo best use this software, an Input MIDI Controller is recommended.\nIn order to connect a MIDI Controller, at least one MIDI-IN port is required.";
                        this.dhc.harmonicarium.components.backendUtils.eventLog(msg);
                        // alert(msg);
                        break;
                    }
                    /* falls through */
                case "o":
                    if (this.atLeastOneMidi.availablePort.output === 0) {
                        msg = "NO MIDI-OUT PORTS AVAILABLE!\nIn order to retune and play a MIDI Instrument, an Output MIDI Port is required.";
                        this.dhc.harmonicarium.components.backendUtils.eventLog(msg);
                        // alert(msg);
                    }
                    break;
            }
        // @todo - isOpen NOT USED YET
        //Use isOpen to check if the user selected an output port
        } else if (isOpen === true) {
            switch (xPut) {
                case "i":
                    if (this.atLeastOneMidi.openPort.input === 0) {
                        msg = "You have to select at least one MIDI-IN port.";
                        this.dhc.harmonicarium.components.backendUtils.eventLog(msg);
                        alert(msg);
                    }
                    break;
                case "o":
                    if (this.atLeastOneMidi.openPort.output === 0) {
                        msg = "You have to select at least one MIDI-OUT port.";
                        this.dhc.harmonicarium.components.backendUtils.eventLog(msg);
                        alert(msg);
                    }
                    break;
                case "io":
                    if (this.atLeastOneMidi.openPort.input === 0 && this.atLeastOneMidi.openPort.output === 0) {
                        msg = "You have to select at least one MIDI-IN and one MIDI-OUT port.";
                        this.dhc.harmonicarium.components.backendUtils.eventLog(msg);
                        alert(msg);
                    }
                    break;
            }
        }
    }
};


HUM.midi.MidiPorts.prototype.Parameters = class {
    constructor(midiports) {
        this.inputPorts = new HUM.Param({
            app: midiports,
            idbKey:'midiportsInputPorts',
            uiElements:{
                /**
                 * The UI HTML elements that contain the MIDI-IN checkboxes (need to be global ??)
                 *
                 * @type {Object}
                 */
                'inputPorts': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            init:false,
            presetStore:false,
            presetRestore:false,
        });
        this.outputPorts = new HUM.Param({
            app: midiports,
            idbKey:'midiportsOutputPorts',
            uiElements:{
                /**
                 * The UI HTML elements that contain the MIDI-OUT checkboxes (need to be global ??)
                 *
                 * @type {Object}
                 */
                'outputPorts': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            init:false,
            presetStore:false,
            presetRestore:false,
        });

    }

};