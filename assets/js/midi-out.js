 /**
 * @fileoverview MIDI Output message preparation and routing for Harmonicarium.
 * This file defines the {@link HUM.midi.MidiOut} class which manages MIDI output
 * ports, multichannel polyphony assignment, and outgoing MIDI message construction.
 * The sub-components are defined in the companion file:
 * - {@link module:midi-out-instrument-settings} — `HUM.midi.MidiOut.prototype.InstrumentSettings` class
 *
 * @module midi-out
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
 * MIDI Output message router and port manager for Harmonicarium.
 *
 * @class
 * @memberof HUM.midi
 *
 * @description
 * The `HUM.midi.MidiOut` class manages all outgoing MIDI operations. It handles:
 * - Routing outgoing MIDI messages to the selected output ports
 * - Multichannel polyphony assignment via the PitchBend tuning method
 * - Construction of Note-ON/OFF and Pitch Bend MIDI messages
 * - Retiming active notes when the tuning changes (FT or HT update)
 * - Building the MIDI-OUT Tuning UI for per-port channel assignment
 *
 * The {@link HUM.midi.MidiOut.prototype.InstrumentSettings|InstrumentSettings} inner class is
 * defined in the companion {@link module:midi-out-instrument-settings} file and
 * attached to `HUM.midi.MidiOut.prototype` at load time.
 */
HUM.midi.MidiOut = class MidiOut {
    /**
     * Creates a new MidiOut instance and binds it to the given DHC and MidiHub.
     *
     * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
     * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
     *
     * @description
     * Initializes the MidiOut controller by:
     * 1. Storing references to the parent DHC and MidiHub instances.
     * 2. Setting up the per-port instrument settings cache.
     * 3. Obtaining the MIDI-OUT Tuning modal container from the DOM.
     * 4. Registering this instance as a DHC subscriber for real-time updates.
     */
    constructor(dhc, midi) {
        /**
        * The id of this MidiOut instance (same as the DHC id).
        *
        * @member {string}
        */
        this.id = dhc.id;
        this._id = dhc._id;
        /**
        * The name of the `HUM.MidiOut`, useful for group the parameters on the DB.
        * Currently hard-coded as `"midiOut"`.
        *
        * @member {string}
        */
        this.name = 'midiOut';
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
         * Temporary MIDI-OUT ports settings cache; <em>keys</em> are the output port IDs
         * (a little DB where to store the user's settings about the port)
         *
         * @member {Object.<string, HUM.midi.MidiOut#InstrumentSettings>}
         */
        this.settings = {};
        /**
         * The HTML container element for the MIDI-OUT Tuning modal panel content.
         * Used by {@link HUM.midi.MidiOut#updateMidiOutUI} to inject the per-port
         * channel assignment UI.
         *
         * @member {HTMLElement}
         */
        this.htmlMotModalContent = document.getElementById("HTMLf_motPanelContent"+dhc.id);

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 1);

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
     * Processes DHC messages according to their command type:
     * - `panic`: Calls `allNotesOff('soft')` to silence all active notes immediately.
     * - `update/ft`: Calls `updateMIDInoteON('ft')` to retune all held FT notes.
     * - `update/ht`: Calls `updateMIDInoteON('ht')` to retune all held HT notes.
     * - `tone-on/ft`: Sends a Note-ON via `midiOut()` for the given FT.
     * - `tone-on/ht`: Sends a Note-ON via `midiOut()` for the given HT (HT 0 / Piper is skipped).
     * - `tone-off/ft`: Sends a Note-OFF via `midiOut()` for the given FT.
     * - `tone-off/ht`: Sends a Note-OFF via `midiOut()` for the given HT (HT 0 / Piper is skipped).
     */
    updatesFromDHC(msg) {

        if (msg.cmd === 'panic') {
            this.allNotesOff('soft');
        }

        if (msg.cmd === 'update') {
            if (msg.type === 'ft') {

                this.updateMIDInoteON('ft');

            } else if (msg.type === 'ht') {

                this.updateMIDInoteON('ht');

            } else if (msg.type === 'ctrlmap') {

            }

        } else if (msg.cmd === 'tone-on') {
            if (msg.type === 'ft') {

                this.midiOut(msg.ctrlNum, msg.xtNum, msg.velocity, 1, "ft", msg.tsnap);
                
                // if (this.dhc.settings.ht.curr_ft !== msg.xtNum) {
                //     this.updateMIDInoteON("ht");
                // }

            } else if (msg.type === 'ht') {
            
                if (msg.xtNum !== 0) {
                    this.midiOut(msg.ctrlNum, msg.xtNum, msg.velocity, 1, "ht", msg.tsnap);
                }
            
            }

        } else if (msg.cmd === 'tone-off') {
            if (msg.type === 'ft') {

                this.midiOut(msg.ctrlNum, msg.xtNum, msg.velocity, 0, "ft");

            } else if (msg.type === 'ht') {

                if (msg.xtNum !== 0) {
                    this.midiOut(msg.ctrlNum, msg.xtNum, msg.velocity, 0, "ht");
                }
            }

        }
    }

    /**
     * Rebuilds the MIDI-OUT Tuning UI for all currently selected output ports.
     *
     * @returns {void}
     *
     * @description
     * Clears the MIDI-OUT Tuning modal content area, then iterates over all
     * selected output ports and, for each one:
     * 1. Initialises per-port settings with defaults if the port is new.
     * 2. Creates a channel assignment table with checkboxes for FT and HT rows,
     *    allowing the user to map MIDI channels to Fundamental or Harmonic Tones.
     * 3. Adds number inputs for PitchBend sensitivity range (in semitones) and
     *    Note-ON delay (in milliseconds), together with a "Send" button that
     *    transmits the RPN Pitch Bend Sensitivity message to the instrument.
     * 4. Appends the composed port block to the modal container.
     *
     * Channel 10 (index 9) is visually marked as the General MIDI percussion
     * channel.
     */
    updateMidiOutUI() {
        let dhcID = this.dhc.id;
        // Init the container
        while (this.htmlMotModalContent.firstChild) {
            this.htmlMotModalContent.removeChild(this.htmlMotModalContent.firstChild);
        }
        
        this.midi.port.selectedOutputs.forEach((value, key) => {
            // If it's a new port in this browser section
            if (!this.settings[key]) {
                // Initialize the port with default settings
                this.settings[key] = new this.InstrumentSettings();
                // this.settings[key] = JSON.parse(JSON.stringify(this.dhc.settings.instrument));
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
            let tdLabFT = document.createElement('td');
            let tdLabHT = document.createElement('td');
            // Set ids
            divPort.id = "HTMLf_motPort" + key + "_" + dhcID;
            // Set classes
            divPort.className = "mot-port";
            divPortSettings.className = "mot-pb-settings";
            tablePortRowHeader.className = "mot-pb-row1";
            tablePortRowHT.className = "mot-pb-row2";
            tablePortRowFT.className = "mot-pb-row3";
            tablePortRowHeaderBottom.className = "mot-pb-row4";
            tdLabFT.className = tdLabHT.className = "mot-pb-typeHeader";
            // Write the title (Port Name)
            divPort.innerHTML = '<h4 class="mb-0">' + value.name + "</h4>";
            tdLabFT.innerHTML = "FTs";
            tdLabHT.innerHTML = "HTs";
            tdLabFT.rowSpan = 2;
            tdLabHT.rowSpan = 2;
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
                tdChFT.className = "mot-pb-portChannel_ft text-center";
                tdChHT.className = "mot-pb-portChannel_ht text-center";
                labelFT.setAttribute("for", key + "_" + ch + "_ft" + "_" + dhcID);
                labelHT.setAttribute("for", key + "_" + ch + "_ht" + "_" + dhcID);
                tdLabChFT.className = "text-center align-top";
                tdLabChHT.className = "text-center align-bottom";
                labelFT.innerHTML = labelHT.innerHTML = ch + 1  ;
                checkboxFT.type = checkboxHT.type = 'checkbox';
                /**
                 * A JSON string containing data about the assignment of a MIDI Channel useful on DOM events.
                 * 
                 * @typedef {string} ChanAssignment
                 *
                 * @property {string}   port - MIDI port
                 * @property {midichan} chan - MIDI channel on that port
                 * @property {tonetype} fn   - Tone type (FT or HT)
                 * @property {tonetype} not  - The opposite tone type (HT or FT) ... don't ask ;)
                 */
                checkboxFT.value = '{ "port": "' + key + '", "chan": '+ ch + ', "fn": "ft", "not": "ht" }';
                checkboxHT.value = '{ "port": "' + key + '", "chan": '+ ch + ', "fn": "ht", "not": "ft" }';
                checkboxFT.name = checkboxHT.name = key + "_" + ch;
                checkboxFT.addEventListener("click", (e) => this.chanSelect(e) );
                checkboxHT.addEventListener("click", (e) => this.chanSelect(e) );
                checkboxFT.id = key + "_" + ch + "_ft"+ "_" + dhcID;
                checkboxHT.id = key + "_" + ch + "_ht"+ "_" + dhcID;
                if (ch === 9) {
                    tdChFT.className = "mot-pb-portChannel_ft gmCh10 text-center";
                    tdChHT.className = "mot-pb-portChannel_ht gmCh10 text-center";
                    tdLabChFT.className = "gmCh10 text-center align-top";
                    tdLabChHT.className = "gmCh10 text-center align-bottom";
                }
                tdLabChHT.style.width = '23px';

                // Inputs and labels in cells
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
                if (this.settings[key].pb.channels.ft.used.indexOf(ch) > -1) {
                    checkboxFT.checked = true;
                }
                if (this.settings[key].pb.channels.ht.used.indexOf(ch) > -1) {
                    checkboxHT.checked = true;
                }
            }
            // **PORT PARAMETERS**
            // Create the HTML elements
            let tdPortPBrangeHeader = document.createElement('td');
            let tdPortPBdelayHeader = document.createElement('td');
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
            tablePort.className = "table table-sm";
            tdPortPBrangeFT.className = "input-group input-group-sm justify-content-end flex-nowrap";
            tdPortPBrangeHT.className = "input-group input-group-sm justify-content-end flex-nowrap";
            tdPortPBdelayFT.className = "text-end";
            tdPortPBdelayHT.className = "text-end";
            inputRangeFT.className = "form-control";
            inputRangeHT.className = "form-control";
            inputRangeFT.style.minWidth = '50px';
            inputRangeFT.style.maxWidth = '54px';
            inputRangeHT.style.minWidth = '50xpx';
            inputRangeHT.style.maxWidth = '54px';
            tdPortPBrangeHeader.className = "text-md-end text-sm-center fw-semibold";
            tdPortPBdelayHeader.className = "text-end fw-semibold";

            btnRangeFT.className = "btn btn-outline-secondary";
            btnRangeHT.className = "btn btn-outline-secondary";
            inputDelayFT.className = "btn btn-outline-secondary";
            inputDelayHT.className = "btn btn-outline-secondary";
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
            inputRangeFT.value = this.settings[key].pb.range.ft;
            inputRangeHT.value = this.settings[key].pb.range.ht;
            inputDelayFT.value = this.settings[key].pb.delay.ft;
            inputDelayHT.value = this.settings[key].pb.delay.ht;
            inputRangeFT.addEventListener("input", (e) => {
                this.settings[key].pb.range.ft = e.target.value;
            });
            inputRangeHT.addEventListener("input", (e) => {
                this.settings[key].pb.range.ht = e.target.value;
            });
            inputDelayFT.addEventListener("input", (e) => {
                this.settings[key].pb.delay.ft = e.target.value;
            });
            inputDelayHT.addEventListener("input", (e) => {
                this.settings[key].pb.delay.ht = e.target.value;
            });
            btnRangeFT.addEventListener("click", () => {
                this.sendMIDIoutPBrange(key, "ft");
            });
            btnRangeHT.addEventListener("click", () => {
                this.sendMIDIoutPBrange(key, "ht");
            });
            inputRangeFT.id = "HTMLi_MIDIoutPortPBrangeFT_" + key + "_" + dhcID;
            inputRangeHT.id = "HTMLi_MIDIoutPortPBrangeHT_" + key + "_" + dhcID;
            inputDelayFT.id = "HTMLi_MIDIoutPortPBdelayFT_" + key + "_" + dhcID;
            inputDelayHT.id = "HTMLi_MIDIoutPortPBdelayHT_" + key + "_" + dhcID;
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
            // tablePortRowHeader.appendChild(tdLabHT.cloneNode(true));
            // tablePortRowFT.appendChild(tdLabFT.cloneNode(true));
            // Rows in <table>
            tablePort.appendChild(tablePortRowHeader);
            tablePort.appendChild(tablePortRowHT);
            tablePort.appendChild(tablePortRowFT);
            tablePort.appendChild(tablePortRowHeaderBottom);
            // Insert each <div> container into its respective htmlNode
            divPortSettings.appendChild(tablePort);
            divPort.appendChild(divPortSettings);
            this.htmlMotModalContent.appendChild(divPort);
        });
    }

    /**
     * Handles a channel selection change in the MIDI-OUT PitchBend Method UI.
     *
     * @param {Event}          event              - `click` event fired by a channel assignment checkbox.
     * @param {Object}         event.target       - The checkbox element that was clicked.
     * @param {ChanAssignment} event.target.value - JSON string with the channel assignment data.
     *
     * @returns {void}
     *
     * @description
     * Parses the {@link ChanAssignment} JSON from the clicked checkbox, then:
     * - **On check**: adds the channel to the selected tone-type's `used` array,
     *   removes it from the opposite tone-type's array, and unchecks the
     *   corresponding checkbox on the other row to prevent double-assignment.
     * - **On uncheck**: calls `allNotesOffChannel()` to silence any active notes,
     *   then removes the channel from the `used` array.
     *
     * Both FT and HT `used` arrays are sorted numerically after every change.
     */
    chanSelect(event) {
        // console.log(event);
        // Parse the JSON from the checkbox value
        let chanSet = JSON.parse(event.target.value);
        // Find and index the current channel in the arrays
        let index = this.settings[chanSet.port].pb.channels[chanSet.fn].used.indexOf(chanSet.chan);
        let indexOther = this.settings[chanSet.port].pb.channels[chanSet.not].used.indexOf(chanSet.chan);
        // Get the other channel checkbox
        let targetOther = document.getElementById(chanSet.port + "_" + chanSet.chan + "_" + chanSet.not + "_" + this.dhc.id);

        // If the checkbox is checked
        if (event.target.checked) {
            // Add current channel to the right array
            if (index === -1) {
                this.settings[chanSet.port].pb.channels[chanSet.fn].used.push(chanSet.chan);
            }
            // Remove the current channel from the other array
            if (indexOther > -1) {
                this.settings[chanSet.port].pb.channels[chanSet.not].used.splice(indexOther, 1);
            }
            // Uncheck the other channel checkbox
            if (targetOther.checked) {
                targetOther.checked = false;
            }
        // If the checkbox is not checked
        } else {
            // << ALL NOTES OFF >>
            this.allNotesOffChannel(chanSet.port, chanSet.chan, 'soft');
            // Remove the current channel from the right array
            if (index > -1) {
                this.settings[chanSet.port].pb.channels[chanSet.fn].used.splice(index, 1);
            }
        }
        this.settings[chanSet.port].pb.channels.ft.used.sort((a, b) => {
            return a - b;
        });
        this.settings[chanSet.port].pb.channels.ht.used.sort((a, b) => {
            return a - b;
        });
        // @todo - Send all Note-OFF and re-init the last channel in order to avoid stuck notes
        this.dhc.harmonicarium.components.backendUtils.eventLog("MIDI multichannel polyphony assignment:\n| Output port = " + this.midi.port.selectedOutputs.get(chanSet.port).name + "\n| " + chanSet.fn.toUpperCase() + " selected channels = " + this.settings[chanSet.port].pb.channels[chanSet.fn].used + "\n| " + chanSet.not.toUpperCase() + " selected channels = " + this.settings[chanSet.port].pb.channels[chanSet.not].used + "\n| ---------------------------------------");
    }
    /**
     * Sends All Notes Off across every selected MIDI output port.
     *
     * @param {('soft'|'hard')} mode - Execution mode: `'soft'` sends a MIDI CC 123
     *   (All Notes Off) on each channel; `'hard'` sends an explicit Note-OFF for
     *   every MIDI note number (0–127) on each channel.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all ports in `midi.port.selectedOutputs` and delegates
     * to {@link HUM.midi.MidiOut#allNotesOffPort} for each one.
     */
    allNotesOff(mode) {
        this.midi.port.selectedOutputs.forEach((port, portID) => {
            this.allNotesOffPort(portID, mode);
        });
    }
    /**
     * Sends All Notes Off on every active channel of the given MIDI output port.
     *
     * @param {string}          portID - The ID of the MIDI output port.
     * @param {('soft'|'hard')} mode   - Execution mode passed through to
     *   {@link HUM.midi.MidiOut#allNotesOffChannel}.
     *
     * @returns {void}
     *
     * @description
     * Collects all channels that are either in the `used` or `held` arrays for
     * both FT and HT tone types, de-duplicates them, and calls
     * {@link HUM.midi.MidiOut#allNotesOffChannel} for each one.
     */
    allNotesOffPort(portID, mode) {
        // Get all used ports (used + held)
        let ftUsed = this.settings[portID].pb.channels.ft.used,
            htUsed = this.settings[portID].pb.channels.ht.used,
            ftHeld = [],
            htHeld = [];
        for (let held of Object.values(this.settings[portID].pb.channels.ft.held)) {
            ftHeld.push(held.ch);
        }
        for (let held of Object.values(this.settings[portID].pb.channels.ht.held)) {
            htHeld.push(held);
        }
        let channels = [...ftUsed, ...ftHeld, ...htUsed, ...htHeld];
        
        // Send message
        for (let ch of channels) {
            this.allNotesOffChannel(portID, ch, mode);
        }
        
        // // Restore the channel-management arrays
        // this.settings[portID].pb.channels.ft.used = [...ftUsed, ...ftHeld];
        // this.settings[portID].pb.channels.ht.used = [...htUsed, ...htHeld];
        // this.settings[portID].pb.channels.ft.held = [];
        // this.settings[portID].pb.channels.ht.held = [];
    }
    /**
     * Sends All Notes Off on a single channel of the given MIDI output port.
     *
     * @param {string}          portID  - The ID of the MIDI output port.
     * @param {midichan}        channel - The MIDI channel number (0–15) to silence.
     * @param {('soft'|'hard')} mode    - Execution mode: `'soft'` sends CC 123
     *   (All Notes Off); `'hard'` sends an explicit Note-OFF for every note 0–127.
     *
     * @returns {void}
     *
     * @description
     * After sending the MIDI silencing message, cleans up internal state by
     * moving any entries in the `held` object whose channel matches back into
     * the `used` array for both FT and HT tone types.
     */
    allNotesOffChannel(portID, channel, mode) {
        let midiOutput = this.midi.port.selectedOutputs.get(portID),
            msg;

        if (mode === 'soft') {
            msg = [0xB0 + channel, 0x7B, 0];
            midiOutput.send(msg);

        } else if (mode === 'hard') {
            for (let mnn = 0; mnn <= 127; mnn++) {
                msg = this.makeMIDIoutNoteMsg(channel, 0, mnn, 0);
                midiOutput.send(msg);
            }
        }

        for (let type of ['ft', 'ht']) {
            for (const [ctrlNum, held] of Object.entries(this.settings[portID].pb.channels[type].held)) {
                if (held.ch === channel) {
                    delete this.settings[portID].pb.channels[type].held[ctrlNum];
                    this.settings[portID].pb.channels[type].used.push(held.ch);
                }
            }
        }
    }

    /**
     * Sends a MIDI Pitch Bend Sensitivity (RPN 0) message to all assigned channels
     * of a given tone type on the specified output port.
     *
     * @param {string}   portID - The ID of the MIDI-OUT port to target.
     * @param {tonetype} type   - The tone type (`'ft'` or `'ht'`) whose assigned
     *   channels should receive the message.
     *
     * @returns {void}
     *
     * @description
     * Iterates over the `used` channel array for the given `type` and sends the
     * standard RPN sequence that sets Pitch Bend Sensitivity on each channel:
     * CC 100 (RPN LSB = 0), CC 101 (RPN MSB = 0), CC 6 (Data Entry MSB = range
     * in semitones), CC 100 (RPN LSB = 127 / null), CC 101 (RPN MSB = 127 / null).
     *
     * If any notes are currently held on that port/type, an alert is shown asking
     * the user to stop playing before retrying, since sending RPN messages while
     * notes are active can cause stuck notes on some instruments.
     */
    sendMIDIoutPBrange(portID, type) {
        let midiOutput = this.midi.port.selectedOutputs.get(portID);
        // If the user is not playing
        if (Object.keys(this.settings[portID].pb.channels[type].held).length === 0) {
            let chansEventLog = []; 
            for (let i = 0; i < 16; i++) {
                let outMsgsQueue = [];
                if (this.settings[portID].pb.channels[type].used[i] !== undefined) {
                    let ch = this.settings[portID].pb.channels[type].used[i];
                    chansEventLog.push(ch + 1);
                    outMsgsQueue.push([0xB0 + ch, 0x64, 0x00]); // [CC+CHANNEL, CC RPN LSB (100), value (RPN 00)]
                    outMsgsQueue.push([0xB0 + ch, 0x65, 0x00]);  // [CC+CHANNEL, CC RPN MSB (101), value (RPN 00)]
                    // outMsgsQueue.push([0xB0 + ch, 0x26, 0x00]); // [CC+CHANNEL, CC DATA ENTRY LSB, value (not used)]
                    outMsgsQueue.push([0xB0 + ch, 0x06, this.settings[portID].pb.range[type]]); // [CC+CHANNEL, CC DATA ENTRY MSB, value (1-24 semitones)]
                    outMsgsQueue.push([0xB0 + ch, 0x64, 0x7F]); // [CC+CHANNEL, CC RPN LSB (100), value (null == 127)]
                    outMsgsQueue.push([0xB0 + ch, 0x65, 0x7F]); // [CC+CHANNEL, CC RPN MSB (101), value (null == 127)]
                    for (let msg of outMsgsQueue) {
                        midiOutput.send(msg);
                    }
                }
            }
            this.dhc.harmonicarium.components.backendUtils.eventLog("MIDI Control Change message:\n| Output Port = " + midiOutput.name + "\n| " + type.toUpperCase() + " Channels = " + chansEventLog + "\n| Pitch Bend Sensitivity = " + this.settings[portID].pb.range[type] + " semitones e.t. (12-EDO)\n| ---------------------------------------------------");
        // Else, an alert message
        } else {
            alert("Do not play when sending the message!\nTry again.");
        }
    }

    /**
     * Creates a MIDI Note-ON or Note-OFF message.
     *
     * @param {midichan} ch       - MIDI channel (0–15) on which to send the message.
     * @param {(0|1)}    state    - `1` for Note-ON, `0` for Note-OFF.
     * @param {midinnum} note     - MIDI note number (0–127).
     * @param {velocity} velocity - MIDI velocity amount (0–127).
     *
     * @returns {Array.<number>} A three-byte MIDI message array
     *   (`[statusByte, noteNumber, velocity]`).
     *
     * @description
     * Builds a standard three-byte MIDI Note-ON (`0x9n`) or Note-OFF (`0x8n`)
     * message where `n` is the zero-based channel number.
     */
    makeMIDIoutNoteMsg(ch, state, note, velocity) {
        let msg = [];
        if (state === 1) {
            msg = [0x90 + ch, note, velocity];
        } else if (state === 0) {
            msg = [0x80 + ch, note, velocity];
        }
        return msg;
    }

    /**
     * Creates a MIDI Pitch Bend Change message.
     *
     * @param {midichan} ch     - MIDI channel (0–15) on which to send the message.
     * @param {number}   amount - Pitch Bend amount (0–16383; centre value 8192 = no bend).
     *
     * @returns {Array.<number>} A three-byte MIDI message array
     *   (`[statusByte, lsb, msb]`).
     *
     * @description
     * Builds a standard three-byte MIDI Pitch Bend Change (`0xEn`) message where
     * `n` is the zero-based channel number. The 14-bit `amount` is split into a
     * 7-bit LSB and a 7-bit MSB.
     */
    makeMIDIoutPitchBendMsg(ch, amount) {
        let lsb = amount & 0x7F;
        let msb = amount >> 7;
        let msg = [0xE0 + ch, lsb, msb];
        return msg;
    }

    /**
     * Retunes every still-pending Note-ON by sending a Note-OFF/Note-ON pair
     * with the updated pitch data.
     *
     * @param {tonetype} type - The tone type (`'ft'` or `'ht'`) whose held notes
     *   should be retuned.
     *
     * @returns {void}
     *
     * @description
     * For each selected output port using the PitchBend tuning method, iterates
     * over the currently held channels and re-sends each active note as a
     * Note-OFF (velocity 64) followed by a new Note-ON with the fresh pitch
     * data from the DHC tables. Notes that were originally placed by Tsnap are
     * skipped, as their pitch is managed independently.
     *
     * When `type` is `'ft'`, both FT-held and HT-held notes are retuned,
     * because changing the Fundamental Tone also shifts all derived Harmonic Tones.
     * When `type` is `'ht'`, only HT-held notes are retuned.
     *
     * @todo The voice-stealing implementation of the MIDI-OUT does not produce
     *   the same result as the DHC/Synth: when voices are overloaded on HT and a
     *   key is released on the controller, the behaviour differs.
     */
    updateMIDInoteON(type) {
        // For each selected MIDI-OUT ports
        this.midi.port.selectedOutputs.forEach((value, portID) => {
            // PitchBend method
            if (this.settings[portID].selected === "pb") {
                let heldChsFT = this.settings[portID].pb.channels.ft.held;
                let heldChsHT = this.settings[portID].pb.channels.ht.held;
                let heldChsKeysFT = Object.keys(heldChsFT);
                let heldChsKeysHT = Object.keys(heldChsHT);
                if (type === "ft") {
                    if (heldChsKeysFT.length > 0) {
                        for (let key of heldChsKeysFT) {
                            // Update only if the original note is not Tsnapped
                            if (!heldChsFT[key].tsnap) {
                                console.log('updateMIDIout ft>ft');
                                let ft = heldChsFT[key].xt;
                                let ftObj = this.dhc.tables.ft[ft];
                                let velocity = heldChsFT[key].vel;
                                this.sendMIDIoutPB(key, ft, ftObj, 64, 0, "ft", portID);
                                this.sendMIDIoutPB(key, ft, ftObj, velocity, 1, "ft", portID);
                            }
                        }
                    }
                    if (heldChsKeysHT.length > 0) {
                        for (let key of heldChsKeysHT) {
                            // Update only if the original note is not Tsnapped
                            if (!heldChsHT[key].tsnap) {
                                console.log('updateMIDIout ft>ht');
                                let ht = heldChsHT[key].xt;
                                let htObj = this.dhc.tables.ht[ht];
                                let velocity = heldChsHT[key].vel;
                                this.sendMIDIoutPB(key, ht, htObj, 64, 0, "ht", portID);
                                this.sendMIDIoutPB(key, ht, htObj, velocity, 1, "ht", portID);
                            }
                        }
                    }
                } else if (type === "ht") {
                    if (heldChsKeysHT.length > 0) {
                        for (let key of heldChsKeysHT) {
                            // Update only if the original note is not Tsnapped
                            if (!heldChsHT[key].tsnap) {
                                console.log('updateMIDIout ht>ht');
                                let ht = heldChsHT[key].xt;
                                let htObj = this.dhc.tables.ht[ht];
                                let velocity = heldChsHT[key].vel;
                                this.sendMIDIoutPB(key, ht, htObj, 64, 0, "ht", portID);
                                this.sendMIDIoutPB(key, ht, htObj, velocity, 1, "ht", portID);
                            }
                        }
                    }
                }
            // MIDI Tuning Standard method
            } else if (this.settings[portID].selected === "mts") {

            }
        });
    }

    /**
     * Prepares and dispatches a MIDI-OUT message to every selected output port
     * for the given tone event.
     *
     * @param {midinnum} ctrlNum  - MIDI note number of the original MIDI-IN message from the controller.
     * @param {xtnum}    xtNum    - Outgoing FT or HT relative tone number.
     * @param {velocity} velocity - MIDI velocity (0\u2013127) of the original MIDI-IN message.
     * @param {(0|1)}    state    - `1` for Note-ON, `0` for Note-OFF.
     * @param {tonetype} type     - Whether the message is for FTs (`'ft'`) or HTs (`'ht'`).
     * @param {boolean=} tsnap    - `true` if the note is managed by Tsnap.
     *
     * @returns {void}
     *
     * @description
     * Looks up the tone object from the DHC tables and iterates over all selected
     * output ports. For each port using the PitchBend tuning method, checks that
     * the computed MIDI note number is in the valid 0\u2013127 range, then delegates
     * to {@link HUM.midi.MidiOut#sendMIDIoutPB}.
     *
     * If a Note-ON arrives for a `ctrlNum` that already has a held entry (Double
     * Note-ON), a Note-OFF is sent first to avoid stuck notes before the new
     * Note-ON.
     */
    midiOut(ctrlNum, xtNum, velocity, state, type, tsnap=false) {
        let xtObj = this.dhc.tables[type][xtNum];
        // For each selected MIDI-OUT ports
        this.midi.port.selectedOutputs.forEach((value, portID) => {
            // PitchBend method
            if (this.settings[portID].selected === "pb") {
                // Check the if Instrument MIDI Note Number is in the range 0-127
                if (Math.trunc(xtObj.mc) <= 127 && Math.trunc(xtObj.mc) >= 0) {
                    // Check if another note with the same ctrlNum came before its respective Note-OFF
                    // @todo - Manage in different way the Double Note-ON: change index ??
                    if (this.settings[portID].pb.channels[type].held[ctrlNum] && state === 1) {
                        this.sendMIDIoutPB(ctrlNum, xtNum, xtObj, 64, 0, type, portID);                
                        this.sendMIDIoutPB(ctrlNum, xtNum, xtObj, velocity, state, type, portID, tsnap);                
                        console.log(type + " MIDI event: Double Note-ON");
                    } else {
                        this.sendMIDIoutPB(ctrlNum, xtNum, xtObj, velocity, state, type, portID, tsnap);                
                    }
                }
            // @todo - MIDI Tuning Standard method
            } else if (this.settings[portID].selected === "mts") {

            }
        });
    }

    /**
     * Core of the PitchBend tuning method: manages multichannel polyphony
     * assignment and sends the outgoing MIDI messages for a single port.
     *
     * This implements "MIDI Channel Mode 4" (aka "Guitar Mode") for outgoing
     * messages: each simultaneously active note is assigned its own MIDI channel
     * so that per-note Pitch Bend can be applied without affecting other voices.
     *
     * @param {midinnum}      ctrlNum  - MIDI note number of the original MIDI-IN message from the controller.
     * @param {xtnum}         xt       - Outgoing FT or HT relative tone number.
     * @param {HUM.DHC#Xtone} xtObj    - FT or HT tone object containing `mc` (midicent) and `hz`.
     * @param {velocity}      velocity - MIDI velocity (0\u2013127) of the original MIDI-IN message.
     * @param {(0|1)}         state    - `1` for Note-ON, `0` for Note-OFF.
     * @param {tonetype}      type     - Whether the message is for FTs (`'ft'`) or HTs (`'ht'`).
     * @param {string}        portID   - ID of the MIDI-OUT port to send the message to.
     * @param {boolean=}      tsnap    - `true` if the note is managed by Tsnap.
     *
     * @returns {void}
     *
     * @description
     * Converts the midicent value of the tone object into an integer MIDI note
     * number and a fractional cent offset, then scales the offset into a 14-bit
     * Pitch Bend value.
     *
     * **Note-ON** — Finds the next available channel (round-robin from the last
     * used one). If all channels are occupied (overload), the oldest held channel
     * is stolen. The selected channel is moved from `used` to `held`, and a
     * Pitch Bend message followed by a Note-ON message are queued.
     *
     * FT polyphony is monophonic by design (only one FT channel is typically
     * active at a time); when a new FT Note-ON arrives while a channel is held,
     * the previous note is closed first.
     *
     * HT polyphony is truly multi-voice; `heldOrder` tracks the assignment
     * sequence to enable oldest-first voice stealing.
     *
     * **Note-OFF** — Retrieves the channel stored in `held` for `ctrlNum`,
     * queues a Note-OFF, and returns the channel to the `used` pool.
     *
     * The outgoing message queue is sent with a configurable delay between the
     * Pitch Bend and Note-ON messages to avoid timing issues on some instruments.
     * Channel checkboxes in the UI are enabled/disabled to reflect the
     * current hold state of each channel.
     */
    sendMIDIoutPB(ctrlNum, xt, xtObj, velocity, state, type, portID, tsnap=false) {
        // @todo - Some functional Note-OFF must be sent without delay?!?
        let usedChs = this.settings[portID].pb.channels[type].used;
        let heldChs = this.settings[portID].pb.channels[type].held;
        if (usedChs.length > 0 || Object.keys(heldChs).length > 0) {
            // Init local variables
            let heldOrder = this.settings[portID].pb.channels[type].heldOrder;
            let lastCh = this.settings[portID].pb.channels[type].last;
            let currCh =  null;
            let instNoteNumber = Math.trunc(xtObj.mc);
            let cents = xtObj.mc - Math.trunc(xtObj.mc);
            let midiOutput = this.midi.port.selectedOutputs.get(portID);
            if (cents > 0.5) {
                instNoteNumber = Math.trunc(xtObj.mc + 0.5);
                cents -= 1;
            }
            // @todo - Check 8192 or 8191 depending on the +/-amount (since +amount is up to 8191)
            let pbAmount = cents * (8192 / this.settings[portID].pb.range[type]) + 8192;
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
                                    this.settings[portID].pb.channels[type].used.push(heldChs[heldChsKey[0]].ch);
                                    // Make the Note-Off to close the previous note on the last channel
                                    outMsgsQueue.push(this.makeMIDIoutNoteMsg(heldChs[heldChsKey[0]].ch, 0, heldChs[heldChsKey[0]].note, 64));
                                    // Delete the held channel
                                    delete this.settings[portID].pb.channels[type].held[heldChsKey[0]];
                                } // else {
                                // }
                                // Remove the found channel from the used channel array in order to avoid over-assignment
                                this.settings[portID].pb.channels[type].used.splice(index, 1);
                                // Sort the array
                                this.settings[portID].pb.channels[type].used.sort((a, b) => {
                                    return a - b;
                                });
                                /**
                                 * Held channel' infos during the multi-channel polyphony routing;
                                 *     a Held Channel is a currently busy channel already occupied by an outgoing tone
                                 * 
                                 * @typedef  {Object} HeldChannel
                                 *
                                 * @property {midichan} ch    - MIDI Channel Number (from 0 to 15)
                                 * @property {midinnum} note  - Final MIDI Note Number on the Instrument
                                 * @property {velocity} vel   - MIDI velocity amount (from 0 to 127)
                                 * @property {xtnum}    xt    - Relative tone number (FT or HT)
                                 * @property {boolean}  tsnap - If the note is managed by Tsnap
                                 */
                                // Store the current channel to the held-on-hold channel var in order to avoid over-assignment
                                this.settings[portID].pb.channels[type].held[ctrlNum] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt, tsnap:tsnap};
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
                                this.settings[portID].pb.channels[type].used.push(heldChs[heldChsKey[0]].ch);
                                // Make the Note-Off to close the previous note on the last channel
                                outMsgsQueue.push(this.makeMIDIoutNoteMsg(heldChs[heldChsKey[0]].ch, 0, heldChs[heldChsKey[0]].note, 64));
                                // Delete the held channels
                                delete this.settings[portID].pb.channels[type].held[heldChsKey[0]];
                            }
                            // Remove the first channel from the used channel array in order to avoid over-assignment
                            this.settings[portID].pb.channels[type].used.splice(0, 1);
                            // Sort the array
                            this.settings[portID].pb.channels[type].used.sort((a, b) => {
                                return a - b;
                            });
                            // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                            this.settings[portID].pb.channels[type].held[ctrlNum] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt, tsnap:tsnap};
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
                        for (let key of Object.keys(this.settings[portID].pb.channels[type].held)) {
                            let heldChan = this.settings[portID].pb.channels[type].held[key];
                            // If the held channel is the current channel needed
                            if (heldChan.ch === currCh) {
                                // Make the Note-Off to close the previous Note-On this channel
                                outMsgsQueue.push(this.makeMIDIoutNoteMsg(heldChan.ch, 0, heldChan.note, 64));
                                // Remove the current channel from the held-channels array
                                delete this.settings[portID].pb.channels[type].held[key];
                            }
                        }
                        // Re-store the current channel to the held-on-hold channels array in order to avoid over-assignment
                        this.settings[portID].pb.channels[type].held[ctrlNum] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt, tsnap:tsnap};
                    }
                    // Store the current channel on the global slot for polyphony handling
                    this.settings[portID].pb.channels[type].last = currCh;
                    // Make the PitchBend
                    outMsgsQueue.push(this.makeMIDIoutPitchBendMsg(currCh, pbAmount));
                    // Make the Note-On
                    outMsgsQueue.push(this.makeMIDIoutNoteMsg(currCh, 1, instNoteNumber, velocity));
                // Note OFF
                } else if (state === 0) {
                    if (this.settings[portID].pb.channels[type].held[ctrlNum]) {
                        // console.log("== Note OFF == : " + ctrlNum);
                        // Get the current channel to close (to send Note OFF)
                        currCh = this.settings[portID].pb.channels[type].held[ctrlNum].ch;
                        // Restore the held-on-hold channel to the used channel array
                        this.settings[portID].pb.channels[type].used.push(currCh);
                        // Sort the array
                        this.settings[portID].pb.channels[type].used.sort((a, b) => {
                            return a - b;
                        });
                        // Make the Note-Off to close the channel
                        outMsgsQueue.push(this.makeMIDIoutNoteMsg(currCh, 0, this.settings[portID].pb.channels[type].held[ctrlNum].note, velocity));
                        // Remove the current channel from the held-channels array
                        delete this.settings[portID].pb.channels[type].held[ctrlNum];
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
                                this.settings[portID].pb.channels[type].used.splice(index, 1);
                                // Add the current channel at the end of the heldOrder to maintain the assignment order
                                this.settings[portID].pb.channels[type].heldOrder.push(currCh);
                                // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                                this.settings[portID].pb.channels[type].held[ctrlNum] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt, tsnap:tsnap};
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
                            this.settings[portID].pb.channels[type].used.splice(0, 1);
                            // Add the current channel at the end of the heldOrder to maintain the assignment order
                            this.settings[portID].pb.channels[type].heldOrder.push(currCh); 
                            // Store the current channel to the held-on-hold channels array in order to avoid over-assignment
                            this.settings[portID].pb.channels[type].held[ctrlNum] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt, tsnap:tsnap};
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
                        this.settings[portID].pb.channels[type].heldOrder.splice(0, 1);
                        this.settings[portID].pb.channels[type].heldOrder.push(currCh);
                        // Remove the current channel from the held-channels array
                        for (let key of Object.keys(this.settings[portID].pb.channels[type].held)) {
                            let heldChan = this.settings[portID].pb.channels[type].held[key];
                            if (heldChan.ch === currCh) {
                                // Make the Note-Off to close the previous Note-On this channel
                                outMsgsQueue.push(this.makeMIDIoutNoteMsg(heldChan.ch, 0, heldChan.note, 64));
                                delete this.settings[portID].pb.channels[type].held[key];
                            }
                        }
                        // Re-store the current channel to the held-on-hold channels array in order to avoid over-assignment
                        this.settings[portID].pb.channels[type].held[ctrlNum] = {ch: currCh, note: instNoteNumber, vel: velocity, xt: xt, tsnap:tsnap};
                    }
                    // Store the current channel on the global slot for polyphony handling
                    this.settings[portID].pb.channels[type].last = currCh;
                    // Make the PitchBend
                    outMsgsQueue.push(this.makeMIDIoutPitchBendMsg(currCh, pbAmount));
                    // Make the Note-On
                    outMsgsQueue.push(this.makeMIDIoutNoteMsg(currCh, 1, instNoteNumber, velocity));
                // Note OFF
                } else if (state === 0) {
                    if (this.settings[portID].pb.channels[type].held[ctrlNum]) {
                        // Get the current channel to close (to send Note OFF)
                        currCh = this.settings[portID].pb.channels[type].held[ctrlNum].ch;
                        // Restore the held-on-hold channel to the used channel array
                        this.settings[portID].pb.channels[type].used.push(currCh);
                        // Sort the array
                        this.settings[portID].pb.channels[type].used.sort((a, b) => {
                            return a - b;
                        });
                        // Make the Note-Off to close the channel
                        outMsgsQueue.push(this.makeMIDIoutNoteMsg(currCh, 0, this.settings[portID].pb.channels[type].held[ctrlNum].note, velocity));
                        // Remove the current channel from the held-channels array
                        delete this.settings[portID].pb.channels[type].held[ctrlNum];
                        let index = this.settings[portID].pb.channels[type].heldOrder.indexOf(currCh);
                        this.settings[portID].pb.channels[type].heldOrder.splice(index, 1);
                    }                
                }
            }
            // Send the outgoing MIDI messages
            for (let msg of outMsgsQueue) {
                // If it's a Note-OFF
                if ((msg[0] >> 4 === 9 && msg[2] === 0) || (msg[0] >> 4 === 8)) {
                    document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ft" + "_" + this.dhc.id).disabled = false;
                    document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ht" + "_" + this.dhc.id).disabled = false;
                // If it's a Note-ON
                } else if (msg[0] >> 4 === 9) {
                    document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ft" + "_" + this.dhc.id).disabled = true;
                    document.getElementById(portID + "_" + (msg[0] & 0xf) + "_ht" + "_" + this.dhc.id).disabled = true;
                }
                // If is a Note-ON or Note-OFF message
                if (msg[0] >> 4 === 9 || msg[0] >> 4 === 8) {
                    // @todo - Check native delay method
                    // midiOutput.send(msg, window.performance.now() + this.settings[portID].pb.delay[type]);
                    setTimeout(() => {
                        midiOutput.send(msg);
                    }, this.settings[portID].pb.delay[type]);
                // Else, if it's a PitchBend message 
                } else {
                    midiOutput.send(msg);
                }
            }
        }
    }

};
