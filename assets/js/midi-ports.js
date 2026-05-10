 /**
 * @fileoverview MIDI Ports manager for the Harmonicarium application.
 * This file defines the {@link HUM.midi.MidiPorts} class which manages Web MIDI API
 * access, port discovery, hot-plugging, and port selection for both input and
 * output MIDI devices, as well as WebMidiLink virtual output ports. The sub-components
 * are defined in the companion file:
 * - {@link module:midi-ports-parameters} — `HUM.midi.MidiPorts.prototype.Parameters` class
 *
 * @module midi-ports
 * @memberof HUM.midi
 * @version 0.8.1
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
 * MIDI Ports manager for the Harmonicarium application.
 *
 * @class
 * @memberof HUM.midi
 *
 * @description
 * The `HUM.midi.MidiPorts` class handles all Web MIDI API interactions:
 * - Requesting and managing the global MIDIAccess object
 * - Discovering and listing available input and output MIDI ports
 * - Creating and managing WebMidiLink virtual output ports
 * - Rendering per-port checkboxes in the MIDI settings UI
 * - Reacting to hot-plug events when ports are connected or disconnected
 * - Tracking selected (open) ports and routing messages accordingly
 *
 * The {@link HUM.midi.MidiPorts.prototype.Parameters|Parameters} inner class is
 * defined in the companion {@link module:midi-ports-parameters} file and
 * attached to `HUM.midi.MidiPorts.prototype` at load time.
 */
HUM.midi.MidiPorts = class {
    /**
     * Creates a new MidiPorts instance bound to the given DHC and MidiHub.
     *
     * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
     * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
     *
     * @description
     * Initializes the MIDI port management system by:
     * 1. Setting up identification and references to the parent DHC and MidiHub instances
     * 2. Creating the parameter management system for port UI elements
     * 3. Requesting Web MIDI API access and registering the success and error callbacks
     * 4. Initializing WebMidiLink virtual output ports after the MIDI request completes
     */
    constructor(dhc, midi) {
        /**
         * The id of this MidiPorts instance (same as the DHC id).
         *
         * @type {string}
         */
        this.id = dhc.id;
        this._id = dhc._id;
        /**
         * The name of the `HUM.midi.MidiPorts`, useful for grouping the parameters on the DB.
         * Currently hard-coded as `"midiPorts"`.
         *
         * @type {string}
         */
        this.name = 'midiPorts';
        /**
         * The DHC instance.
         *
         * @type {HUM.DHC}
         */
        this.dhc = dhc;
        /**
         * The MidiHub instance.
         *
         * @type {HUM.midi.MidiHub}
         */
        this.midi = midi;
        /**
         * The global MIDIAccess object.
         *
         * @type {MIDIAccess}
         * @see {@link https://webaudio.github.io/web-midi-api/#MIDIAccess|Web MIDI API specs}
         */
        this.midiAccess = null;

        /**
         * Namespace for WebMidiLink.
         *
         * @type {Object}
         *
         * @property {HUM.midi.WebMidiLinkIn}                   input   - The WebMidiLinkIn instance.
         * @property {Object.<string, HUM.midi.WebMidiLinkOut>} outputs - Map of all WebMidiLinkOut instances; the key is the {@link HUM.midi.WebMidiLinkOut#id}.
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
         * @type {Map.<string, MIDIPort>}
         */
        this.selectedOutputs = new Map();

        /**
         * Data structure to keep track of how many ports are available and how many are used.
         * Used to inform the user about the current MIDI port situation and provide appropriate guidance.
         *
         * @type {Object}
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
     * Initializes the WebMidiLink output ports and makes the UI MIDI panel accessible.
     *
     * @private
     *
     * @returns {void}
     *
     * @description
     * Called after the Web MIDI API request completes (both on success and failure)
     * to ensure WebMidiLink virtual ports are always available regardless of
     * native MIDI API support.
     */
    _postRequestMIDI() {
        this._initWebMidiLinkOut();
        // Button to open the MIDI settings (deplrecated since using Bootstrap)
        // this.uiElements.fn.motPanelModalShow.addEventListener("click", () => this.openMidiPanel() );
    }

    /**
     * Initializes all WebMidiLink virtual output ports.
     *
     * @private
     *
     * @returns {void}
     *
     * @description
     * Creates the number of WebMidiLink output ports defined by `webMidi.outQty`,
     * registers each in `webMidi.outputs`, creates the corresponding UI checkbox,
     * and logs the port information to the event log.
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
     * Handles a Web MIDI API access error.
     *
     * @private
     *
     * @param  {DOMException} error - The error thrown when MIDI access was denied or failed.
     *
     * @returns {void}
     *
     * @description
     * Called when `navigator.requestMIDIAccess()` rejects. Logs the error message
     * to the event log and falls back to WebMidiLink-only mode via `_postRequestMIDI()`.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#extensions-to-the-navigator-interface|Web MIDI API specs}
     */
    _onMidiReject(error) {
        this.dhc.harmonicarium.components.backendUtils.eventLog("Failed to get MIDI access because: " + error);
        this._postRequestMIDI();
    }

    /**
     * Handles a successful Web MIDI API access grant.
     *
     * @private
     *
     * @param {MIDIAccess} midiAccess - The MIDIAccess object.
     *
     * @returns {void}
     *
     * @description
     * Called when `navigator.requestMIDIAccess()` resolves. Stores the
     * MIDIAccess instance, iterates over all available input and output ports
     * to create their UI checkboxes, registers the `onstatechange` handler for
     * hot-plug events, checks port availability, and finalizes initialization.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#MIDIAccess|Web MIDI API specs}
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
     * Logs information about a single MIDI port to the event log.
     *
     * @param {MIDIPort} midiPort - The MIDI port to log.
     *
     * @returns {void}
     *
     * @description
     * Formats a human-readable string containing the port type, name, state,
     * and connection status, then forwards it to the application event log.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
     */
    portLogger(midiPort) {
        // let icPortInfos = icPort.state + " " + icPort.type + " port | id: " + icPort.id + " | name: " + icPort.name + " | manufacturer: " + icPort.manufacturer + " | version:" + icPort.version + " | connection: " + icPort.connection;
        let portInfos = midiPort.type + " port: " + midiPort.name + " | " + midiPort.state + ": " + midiPort.connection;
        this.dhc.harmonicarium.components.backendUtils.eventLog(portInfos);
    }

    /**
     * Creates a checkbox UI element for a MIDI port and appends it to the given container.
     *
     * @param {MIDIPort}    midiPort    - The MIDI port to represent.
     * @param {HTMLElement} htmlElement - The container element for the port checkboxes
     *                                   (e.g. `this.parameters.inputPorts.uiElements.out.inputPorts`
     *                                   or `this.parameters.outputPorts.uiElements.out.outputPorts`).
     *
     * @returns {void}
     *
     * @description
     * Builds a `<div>` containing a labeled `<input type="checkbox">` for the given
     * MIDI port. The checkbox value is set to the port's ID and its `click` event
     * is wired to `portSelect()`. The constructed element is appended to
     * `htmlElement`.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#MIDIPort|Web MIDI API specs}
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
     * Handles a MIDI port checkbox click event, opening or closing the port accordingly.
     *
     * @param {Event}   event                - The `click` event fired on a MIDI I/O port checkbox.
     * @param {Object}  event.target         - The checkbox element that was clicked.
     * @param {string}  event.target.value   - The ID of the MIDI port.
     * @param {boolean} event.target.checked - Whether the checkbox is now checked or not.
     *
     * @returns {void}
     *
     * @description
     * When a checkbox is checked:
     * - Input ports: attaches `onmidimessage` and increments the open input counter.
     * - Output ports: adds the port to `selectedOutputs`, opens WebMidiLink ports
     *   as needed, and triggers a MIDI out UI update.
     *
     * When a checkbox is unchecked:
     * - Input ports: sends an all-notes-off panic, closes the port, and decrements
     *   the open input counter.
     * - Output ports: sends an all-notes-off on the port, removes it from
     *   `selectedOutputs`, closes WebMidiLink ports as needed, and triggers
     *   a MIDI out UI update.
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
     * Handles MIDI port hot-plug events, updating the UI when ports are connected or disconnected.
     *
     * @param  {MIDIConnectionEvent} event      - The connection event from `MIDIAccess.onstatechange`.
     * @param  {MIDIPort}            event.port - The MIDI port that triggered the event.
     *
     * @returns {void}
     *
     * @description
     * Logs the port state change, then:
     * - On `"disconnected"`: sends all-notes-off if it was an input port, decrements
     *   the relevant open-port counter, checks minimum port availability, and removes
     *   the port's checkbox from the UI.
     * - On `"connected"`: if no checkbox for that port already exists, creates a new
     *   one in the appropriate input or output container.
     *
     * @see {@link https://webaudio.github.io/web-midi-api/#MIDIConnectionEvent|Web MIDI API specs}
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
     * Checks whether at least one MIDI port is available or open and logs a warning if not.
     *
     * @param  {('i'|'o'|'io')} xPut   - Which direction to check: input (`'i'`), output (`'o'`), or both (`'io'`).
     * @param  {boolean}        isOpen - `false` to check available (detected) ports;
     *                                   `true` to check currently selected (open) ports.
     *
     * @returns {void}
     *
     * @description
     * Refreshes the available port counts from the MIDIAccess object, then
     * evaluates the requested combination. If the condition is not met, an
     * advisory message is written to the event log (and, for the `isOpen` path,
     * also displayed in an alert dialog). The `isOpen === true` path is not yet
     * fully integrated into the call flow.
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
