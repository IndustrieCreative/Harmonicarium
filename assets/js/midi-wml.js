 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2022 by Walter G. Mantovani (http://armonici.it).
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

/* globals HUM */

"use strict";

/** 
 * The WebMidiLinkIn port class.<br>
 *     Manage WebMidiLink input messages.
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/index.html}
 */
HUM.midi.WebMidiLinkIn = class {
    /**
    * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs
    * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs
    */
    constructor(dhc, midi) {
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
        * The Window-like object of the page that opened or embedded the URL to this HUM instace
        *
        * @member {Object}
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
     * Manage and route an incoming message
     * @param {HUM.DHCmsg} msg - The incoming message
     */
    // @old icWebMidiLinkInput
    receiveMessage(e) {
       if (typeof e.data === 'string') {
            var msg = e.data.split(",");
            switch (msg[0]) {
                // Level 1 messages
                case "link":
                    // Try to determinate which window sent the message
                    let synthNum = 0;
                    for (const [key, webMidiOut] of Object.entries(this.midi.port.webMidi.outputs)) {
                        if (e.source === webMidiOut.synthWindow) {
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
                            // e.source.postMessage("link,patch," + ReqPatchString(),"*");
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
     * Send "ready" message to the Host WebMidiLink window.
     *     Should be called when Harmonicarium (hosted) is ready and listening.
     *     [ Synth=>Host ]
     * 
     * @param {HUM.DHCmsg} msg - The incoming message
     */
    // @old icWebMidiLinkReady
    sendReadyMessage() {
        // Send message to the host web app
        this.hostWindow.postMessage("link,ready", "*");
    }
};

/** 
 * The WebMidiLinkOut port class.<br>
 *     Manage WebMidiLink output messages.
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/index.html}
 */
HUM.midi.WebMidiLinkOut = class {
    /**
    * @param {number}           key  - The internal number for the new virtual MIDI port (integer). It will be the port number on the UI.
    * @param {string}           id   - The id for the new virtual MIDI port.
    *                                  The prefix should be like `"webmidilink_out_"`, ending with the `key` number.
    * @param {HUM.DHC}          dhc  - The DHC instance to which it belongs.
    * @param {HUM.midi.MidiHub} midi - The MidiHub instance to which it belongs.
    */
    constructor(key, id, dhc, midi) {
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
        * The id of this virtual MIDI port.
        *     
        *
        * @member {string}
        */
        this.id = id;
        /**
        * The manufacturer of this virtual MIDI port.
        *
        * @member {string}
        */
        this.manufacturer = "Industrie Creative";
        /**
        * The name of this virtual MIDI port with the `key` number.
        *
        * @member {string}
        */
        this.name = `WebMidiLink OUT Port (${key+1})`;
        /**
        * The state of this virtual MIDI port.
        *
        * @member {string}
        */
        this.state = "disconnected";
        /**
        * The type of this virtual MIDI port.
        *
        * @member {string}
        */
        this.type = "output";
        /**
        * The internal (and UI) number this virtual MIDI port (integer).
        *
        * @member {number}
        */
        this.key = key;
        /**
        * The external id this virtual MIDI port. It must be unique.
        *     It should contain the DHC id and the `key`.
        *
        * @member {string}
        */
        this.uniqKey = `${dhc.id}_${key}`;
        /**
        * The Window-like object of the page that has been opened by this HUM instace
        *
        * @member {Object}
        */
        this.synthWindow = {closed: true};
        /**
        * The current state of the "Synth" application that has been opened
        *     `true` if the "Synth" app sent the "ready" message
        *     (not used yet)
        *
        * @member {boolean}
        */
        this.isReady = false;
        /**
        * What synthlist to use.
        * - `'adhocSynthList'`: An updated and reordered list; apps no longer reachable have been removed.
        *   In this list there are some extra properties that indicate some useful information for re-tuning.
        * - `'g200kgSynthList'`: The original synthlist from g200kg site (see: {@link https://www.g200kg.com/en/docs/webmidilink/synthlist.html|SynthList - JSONP})
        * To use the `'g200kgSynthList'`, uncomment one of the two scripts in the "./index.html" file, as explained here: {@link SynthListCallback}
        *
        * @member {('adhocSynthList'|'g200kgSynthList')}
        */
        this.synthList = 'adhocSynthList'; // or 'g200kgSynthList'

        let portsContainer = document.getElementById(`HTMLf_webMidiLinkPorts${dhc.id}`),
            newPortUI = HUM.tmpl.webMidiLinkPorts(this.uniqKey, this.key+1);
        portsContainer.appendChild(newPortUI);
        /**
         * UI HTML elements
         *
         * @member {Object}
         * 
         * @property {Object.<string, HTMLElement>} fn  - Functional UI elements
         * @property {Object.<string, HTMLElement>} in  - Input UI elements
         * @property {Object.<string, HTMLElement>} out - Output UI elements
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
     * Initialize the UI of the WebMidiLinkOut instance
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
     *     To be used when the user check the port checkbox.
     */
    openPort() {
        this.uiElements.fn.webMidiLinkLoader.style.display = "table";
        this.startStateCheck();
    }
    /**
     * Hide the port's URL loader to the user, close the "Synth" window (if open), stop check for its state and and change the status on the UI to "NOT LOADED". 
     *     To be used when the user uncheck the port checkbox.
     */
    closePort() {
        this.unload();
        this.stopStateCheck();
        this.uiElements.fn.webMidiLinkLoader.style.display = "none";
    }
    /**
     * Show an alert to the user, load the given URL in a new window and start check for the "Synth" window state.
     * 
     * @param {string} url - The URL of the "Synth" instrument
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
     * Close the "Synth" window (if open) and change the status on the UI to "NOT LOADED"
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
     *     "Link Level 0" means a simple MIDI message.
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
     * Start check for the "Synth" window state every 1500ms. If the windows Synth is close, change the status on the UI to "NOT LOADED".
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
     * Change the status on the UI if the Synth is loading or is ready (and Link Level 1 enabled).
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
