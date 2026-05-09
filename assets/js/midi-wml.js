/**
 * @fileoverview WebMidiLink port classes for the Harmonicarium application.
 * This file defines the HUM.midi.WebMidiLinkIn and HUM.midi.WebMidiLinkOut
 * classes, which implement the WebMidiLink protocol for bidirectional
 * communication between the Harmonicarium host and external web-based
 * synthesizer instruments opened in popup windows.
 *
 * @module midi-wml
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
 * Incoming WebMidiLink port class.
 *
 * @class
 * @memberof HUM.midi
 *
 * @description
 * The HUM.midi.WebMidiLinkIn class manages the WebMidiLink input side.
 * It listens for incoming `window.message` events and routes them to the
 * appropriate handlers:
 * - **Link Level 0** (`midi`): Converts WebMidiLink MIDI strings into
 *   synthetic MIDI events and forwards them to the DHC MIDI input.
 * - **Link Level 1** (`link`): Handles handshake messages (`ready`,
 *   `progress`, `patch`, `reqpatch`, `setpatch`) for synth-lifecycle
 *   coordination.
 *
 * When Harmonicarium is embedded as a hosted synthesizer, this class also
 * provides `sendReadyMessage()` to notify the host that it is ready.
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/index.html}
 */
HUM.midi.WebMidiLinkIn = class {
    /**
     * Creates a new WebMidiLinkIn instance.
     *
     * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
     * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
     *
     * @description
     * Initializes the WebMidiLink input port by:
     * 1. Storing references to the parent DHC and MidiHub instances.
     * 2. Determining the host window (via `window.opener` or `window.parent`).
     * 3. Registering a `message` event listener on the global `window` object
     *    to receive incoming WebMidiLink messages.
     */
    constructor(dhc, midi) {
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
         * The Window-like object of the page that opened or embedded the URL to this HUM instance.
         * Resolved to `window.opener` if available, otherwise `window.parent`.
         *
         * @member {Window}
         */
        this.hostWindow = undefined;
        if (window.opener) {
            this.hostWindow = window.opener;
        }
        else{
            this.hostWindow = window.parent;
        }

        // WebMidiLink INCOMING MESSAGES
        window.addEventListener("message", (e) => this.receiveMessage(e) );

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manages and routes an incoming WebMidiLink `message` event.
     *
     * @param {MessageEvent}    evt      - The incoming window message event.
     * @param {wmlmsg0|wmlmsg1} evt.data - A WebMidiLink Message Level 0 or Level 1 string.
     *
     * @returns {void}
     *
     * @description
     * Parses the comma-separated string payload of the `MessageEvent` and
     * dispatches it by its first token:
     * - `"midi"` (Level 0): Parses the three hex-encoded MIDI bytes, wraps
     *   them in a synthetic MIDI event object, and forwards them to
     *   `midi.in.midiMessageReceived()`.
     * - `"link"` (Level 1): Identifies the originating `WebMidiLinkOut` port
     *   by comparing `evt.source` against known synth windows, then
     *   dispatches the sub-command (`ready`, `progress`, `patch`,
     *   `reqpatch`, `setpatch`) to the appropriate handler or logs a warning
     *   for unimplemented commands.
     *
     * Non-string payloads are silently ignored.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
     * @see {@link https://www.g200kg.com/en/docs/webmidilink/spec.html}
     */
    receiveMessage(evt) {
       if (typeof evt.data === 'string') {
            var msg = evt.data.split(",");
            switch (msg[0]) {
                // Level 1 messages
                case "link":
                    // Try to determinate which window sent the message
                    let synthNum = 0;
                    for (const [key, webMidiOut] of Object.entries(this.midi.port.webMidi.outputs)) {
                        if (evt.source === webMidiOut.synthWindow) {
                            synthNum = key;
                        } 
                    }
                    // https://www.g200kg.com/en/docs/webmidilink/spec.html @ Link Level 1
                    switch (msg[1]) {
                        // -------------------------------------------------
                        // Host<=Synth : if Harmonicarium is used as HOST
                        case "ready":
                            this.midi.port.webMidi.outputs[synthNum].becomeReady(msg[1]);
                            break;
                        case "progress":
                            this.midi.port.webMidi.outputs[synthNum].becomeReady(msg[1]);
                            break;
                        case "patch":
                            console.log("WebMidiLink Level 1 message (link) 'patch' is not implemented yet!");
                            // ReceivePatchStringFromSynth(msg[2]);
                            break;
                        // -------------------------------------------------
                        // Host=>Synth : if Harmonicarium is used as INSTRUMENT/SYNTH
                        case "reqpatch":
                            console.log("WebMidiLink Level 1 message (link) 'reqpatch' is not implemented yet!");
                            // evt.source.postMessage("link,patch," + ReqPatchString(),"*");
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
                    this.midi.in.midiMessageReceived(midievent);
                    break;
            }
        }
    }
    /**
     * Sends a `"link,ready"` message to the host WebMidiLink window.
     *
     * @returns {void}
     *
     * @description
     * Posts the Level 1 `"link,ready"` message to `this.hostWindow`,
     * signalling that this Harmonicarium instance (acting as a synthesizer)
     * has finished loading and is ready to receive MIDI data.
     * Should be called once the application is fully initialized.
     *
     * Direction: **Synth → Host**
     *
     * @see {@link https://www.g200kg.com/en/docs/webmidilink/spec.html}
     */
    sendReadyMessage() {
        // Send message to the host web app.
        this.hostWindow.postMessage("link,ready", "*");
    }
};

/**
 * Outgoing WebMidiLink port class.
 *
 * @class
 * @memberof HUM.midi
 *
 * @description
 * The HUM.midi.WebMidiLinkOut class manages one WebMidiLink output port.
 * Each instance represents a virtual output connection to a web-based
 * synthesizer instrument running in a separate popup window. It handles:
 * - Opening, loading, and closing the external synth window.
 * - Sending MIDI messages via the WebMidiLink Level 0 protocol.
 * - Monitoring the synth window state and updating the UI accordingly.
 * - Populating the synth selector dropdown from the configured synth list.
 *
 * Multiple `WebMidiLinkOut` instances can be created to connect to
 * multiple synth instruments simultaneously.
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/index.html}
 */
HUM.midi.WebMidiLinkOut = class {
    /**
     * Creates a new WebMidiLinkOut instance.
     *
     * @param {number}           key  - The internal index for this virtual MIDI port (0-based integer).
     *                                  Displayed as `key + 1` in the UI.
     * @param {string}           id   - The unique ID string for this virtual MIDI port.
     *                                  Should follow the pattern `"webmidilink_out_{key}"`.
     * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
     * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
     *
     * @description
     * Initializes the WebMidiLink output port by:
     * 1. Setting up identification, state, and metadata properties.
     * 2. Creating the port's UI fragment from the HTML template and appending
     *    it to the ports container element.
     * 3. Collecting references to all relevant DOM elements into `uiElements`.
     * 4. Calling `_initUI()` to attach event listeners and populate the synth list.
     */
    constructor(key, id, dhc, midi) {
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
         * The unique ID string of this virtual MIDI port.
         *
         * @member {string}
         */
        this.id = id;
        /**
         * The manufacturer label of this virtual MIDI port.
         *
         * @member {string}
         */
        this.manufacturer = "Industrie Creative";
        /**
         * The human-readable name of this virtual MIDI port, including the 1-based port number.
         *
         * @member {string}
         */
        this.name = `WebMidiLink OUT Port (${key+1})`;
        /**
         * The connection state of this virtual MIDI port.
         * Set to `"connected"` when a synth window is open, `"disconnected"` otherwise.
         *
         * @member {string}
         */
        this.state = "disconnected";
        /**
         * The port type identifier. Always `"output"` for `WebMidiLinkOut`.
         *
         * @member {string}
         */
        this.type = "output";
        /**
         * The 0-based internal index of this virtual MIDI port, also used as the UI port number offset.
         *
         * @member {number}
         */
        this.key = key;
        /**
         * A globally unique key for this port, combining the DHC id and the port `key`.
         * Used as a suffix in HTML element IDs.
         *
         * @member {string}
         */
        this.uniqKey = `${dhc.id}_${key}`;
        /**
         * A reference to the popup window of the currently loaded WebMidiLink synth.
         * Initialized with `{closed: true}` to represent a closed/absent window.
         *
         * @member {Window|{closed: boolean}}
         */
        this.synthWindow = {closed: true};
        /**
         * The current state of the "Synth" application that has been opened.
         * `true` if the "Synth" app sent the "ready" message.
         * (not used yet)
         *
         * @member {boolean}
         */
        this.isReady = false;
        /**
         * The synth list source to use for populating the synth selector dropdown.
         * - `'adhocSynthList'`: A curated, reordered list with unreachable apps removed.
         *   Includes extra properties for re-tuning guidance.
         * - `'g200kgSynthList'`: The original synthlist from the g200kg site.
         *   Requires uncommenting the appropriate script tag in `index.html`
         *   as explained here: {@link SynthListCallback}
         *
         * @member {('adhocSynthList'|'g200kgSynthList')}
         *
         * @see {@link https://www.g200kg.com/en/docs/webmidilink/synthlist.html}
         */
        this.synthList = 'adhocSynthList'; // or 'g200kgSynthList'

        let portsContainer = document.getElementById(`HTMLf_webMidiLinkPorts${dhc.id}`),
            newPortUI = HUM.tmpl.webMidiLinkPorts(this.uniqKey, this.key+1, dhc.harmonicarium.id);
        portsContainer.appendChild(newPortUI);

        /**
         * UI HTML elements.
         *
         * @member {Object}
         * 
         * @property {Object.<string, HTMLElement>} fn  - Functional UI elements.
         * @property {Object.<string, HTMLElement>} in  - Input UI elements.
         * @property {Object.<string, HTMLElement>} out - Output UI elements.
         */
        this.uiElements = {
            fn: {
                webMidiLinkPorts: portsContainer,
                
                webMidiLinkLoader: document.getElementById(`HTMLf_webMidiLinkLoader${this.uniqKey}`),

                webMidiLinkUrl: document.getElementById(`HTMLf_webMidiLinkUrl${this.uniqKey}`),
                webMidiLinkStatus: document.getElementById(`HTMLf_webMidiLinkStatus${this.uniqKey}`),
                webMidiLinkSynthSelect: document.getElementById(`HTMLf_webMidiLinkSynthSelect${this.uniqKey}`),
                webMidiLinkSynthLoad: document.getElementById(`HTMLf_webMidiLinkSynthLoad${this.uniqKey}`),
            },
            in: {

            },
            out: {

            },
        };

        this._initUI();

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initialize the UI of the WebMidiLinkOut instance.
     */
    _initUI() {
        // Add event listeners on <select> and <button> elements
        this.uiElements.fn.webMidiLinkSynthSelect.addEventListener("change", (e) => {
            this.uiElements.fn.webMidiLinkUrl.value = e.target[e.target.selectedIndex].value;
        } );
        this.uiElements.fn.webMidiLinkSynthLoad.addEventListener("click", () => {
            this.load(this.uiElements.fn.webMidiLinkUrl.value);
        } );

        let sl = HUM.midi.WebMidiLinkOut[this.synthList];
        this.uiElements.fn.webMidiLinkUrl.value = sl[0].url;
        for (let i = 0; i < sl.length; ++i) {
            let optTxt = `${sl[i].description}: ${sl[i].name} (by ${sl[i].author})`;
            this.uiElements.fn.webMidiLinkSynthSelect.options[i] = new Option(optTxt, sl[i].url);
        }
    }
    /**
     * Show the port's URL loader to the user and start check for the "Synth" window state.
     * To be used when the user check the port checkbox.
     */
    openPort() {
        this.uiElements.fn.webMidiLinkLoader.style.display = "table";
        this.startStateCheck();
    }
    /**
     * Hide the port's URL loader to the user, close the "Synth" window (if open), stop check for
     * its state and and change the status on the UI to "NOT LOADED". 
     * To be used when the user uncheck the port checkbox.
     */
    closePort() {
        this.unload();
        this.stopStateCheck();
        this.uiElements.fn.webMidiLinkLoader.style.display = "none";
    }
    /**
     * Show an alert to the user, load the given URL in a new window and start check for
     * the "Synth" window state.
     * 
     * @param {string} url - The URL of the "Synth" instrument.
     */
    load(url) {
        alert("A new popup-window containing a web-app instrument is about to be opened and may end up behind the current browser window.\n\nMake sure you interact at least once with the User Interface of the instrument that opened in the new popup-window before you start sending WebMidiLink signals from Harmonicarium.\n\nFor security reasons, the browser may suspend the AudioContext status until the user interacts with that window.\n\nClick OK to continue.");
        this.synthWindow = window.open(url, (this.id +"_window"), "width=900,height=670,scrollbars=yes,resizable=yes");
        this.state = "connected";
        let uiStatus = this.uiElements.fn.webMidiLinkStatus;
        uiStatus.innerText = "LOADED";
        uiStatus.classList.remove("webmidilinkNotLoaded", "webmidilinkProgress");
        uiStatus.classList.add("webmidilinkLoaded");
        this.startStateCheck();
    }
    /**
     * Close the "Synth" window (if open) and change the status on the UI to "NOT LOADED".
     */
    unload() {
        if (this.synthWindow.window){
            this.synthWindow.close();
        }
        let uiStatus = this.uiElements.fn.webMidiLinkStatus;
        uiStatus.innerText = "NOT LOADED";
        uiStatus.classList.remove("webmidilinkLoaded", "webmidilinkProgress");
        uiStatus.classList.add("webmidilinkNotLoaded");
    }
    /**
     * Send a "Link Level 0" WebMidiLink message to the "Synth" instrument window.
     * "Link Level 0" means a simple MIDI message.
     *
     * @see {@link https://www.g200kg.com/en/docs/webmidilink/spec.html} 
     * 
     * @param {Uint8Array} msg - The message, an array of integers between 0 and 127.
     */
    send(msg) {
         this.sendMessage("midi," + msg.map(e => e.toString(16)));
    }

    // allSoundOff() {
    //     this.SendMessage("midi,b0,78,0");
    // }
    
    /**
     * Send a complete WebMidiLink message to the "Synth" instrument window.
     *
     * @see {@link https://www.g200kg.com/en/docs/webmidilink/spec.html} 
     * 
     * @param {wmlmsg0|wmlmsg1} fullMsg - The message
     */
    sendMessage(fullMsg) {
        if (this.synthWindow.window) {
            this.synthWindow.postMessage(fullMsg, "*");
        } else {
            // let uiStatus = this.uiElements.fn.webMidiLinkStatus;
            // uiStatus.innerText = "NOT LOADED";
            // uiStatus.classList.remove("webmidilinkLoaded", "webmidilinkProgress");
            // uiStatus.classList.add("webmidilinkNotLoaded");
        }
    }
    /**
     * Start check for the "Synth" window state every 1500ms. If the windows Synth is close,
     * change the status on the UI to "NOT LOADED".
     */
    startStateCheck() {
        this.stateCheckTimer = setInterval( () => {
            if (this.synthWindow.closed) {
                clearInterval(this.stateCheckTimer);
                this.unload();
            }
        }, 1500);
    }
    /**
     * Start check for the "Synth" window state.
     */
    stopStateCheck() {
        clearInterval(this.stateCheckTimer);
    }
    /**
     * Change the status on the UI if the Synth is loading or is ready (and Link Level 1 compliant).
     * 
     * @param {('ready'|'progress')} msg - The second part of a Link Level 1 message.
     */
    becomeReady(msg) {
        let uiStatus = this.uiElements.fn.webMidiLinkStatus;
        if (msg === "ready") {
            this.isReady = true;
            uiStatus.innerText = "LOADED (ready)";
            uiStatus.classList.remove("webmidilinkNotLoaded", "webmidilinkProgress");
            uiStatus.classList.add("webmidilinkLoaded");
        } else if (msg === "progress") {
            this.isReady = false;
            uiStatus.innerText = "LOADING IN PROGRESS...";
            uiStatus.classList.remove("webmidilinkNotLoaded", "webmidilinkLoaded");
            uiStatus.classList.add("webmidilinkProgress");
        }
    }
};
