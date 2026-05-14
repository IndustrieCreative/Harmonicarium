/**
 * @fileoverview Virtual piano keyboard controller for Harmonicarium.
 * This file defines the {@link HUM.Hancock} class which manages the Qwerty
 * Hancock virtual piano keyboard widget, handling key rendering, MIDI output,
 * and keymap-driven display. The sub-components are defined in the companion file:
 * - {@link module:hancock-parameters} — `HUM.Hancock.prototype.Parameters` class
 *
 * @module hancock
 * @memberof HUM
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
 * Virtual piano keyboard controller wrapping the Qwerty Hancock library.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The `HUM.Hancock` class manages the Qwerty Hancock virtual piano keyboard
 * widget. It handles:
 * - Rendering piano keys with keymap-driven colors and labels
 * - Emitting virtual MIDI note-on/off events via the DHC MIDI input
 * - Synchronizing key highlight state with incoming tone-on/off messages
 * - Adapting the keyboard range and offset to match the active keymap
 *
 * The {@link HUM.Hancock.prototype.Parameters|Parameters} inner class is
 * defined in the companion {@link module:hancock-parameters} file and
 * attached to `HUM.Hancock.prototype` at load time.
 *
 * @see {@link https://github.com/stuartmemo/qwerty-hancock}
 */
HUM.Hancock = class {
    /**
     * Creates a new Hancock instance and binds it to the given DHC.
     *
     * @param {HUM.DHC} dhc - The DHC instance to which this Hancock belongs.
     *
     * @description
     * Initializes the Hancock controller by:
     * 1. Setting up identification and references to the parent DHC instance
     * 2. Creating and initializing the parameter management system
     * 3. Instantiating the Qwerty Hancock keyboard widget with current settings
     * 4. Registering key-press handlers that emit virtual MIDI events
     * 5. Registering this instance as a DHC subscriber for updates
     */
    constructor(dhc) {
        /**
         * The id of the DHC instance.
         *
         * @member {string}
         */
        this.id = dhc.id;
        /**
         * Internal reference to the DHC instance ID.
         *
         * @member {string}
         * @private
         */
        this._id = dhc._id;

        /**
         * The name of the `HUM.Hancock`, useful for grouping the parameters on the DB.
         * Currently hard-coded as `"hancock"`.
         *
         * @member {string}
         */
        this.name = 'hancock';

        /**
         * The parent DHC instance.
         *
         * @member {HUM.DHC}
         */
        this.dhc = dhc;

        /**
         * Instance of `HUM.Hancock#Parameters`.
         *
         * @member {HUM.Hancock.prototype.Parameters}
         */
        this.parameters = new this.Parameters(this);
        this.parameters._init();

        /**
         * The instance of Qwerty Hancock piano keyboard.
         *
         * @member {QwertyHancock}
         */
        this.keyboard = new QwertyHancock(this._getSettings());

        /**
         * The method invoked when a key is pressed on Hancock.
         * @function
         * @instance
         * @name keyDown
         * @memberof QwertyHancock
         *
         * @param {string} note - Hancock note name (e.g. G#5).
         */
        this.keyboard.keyDown = (note) => this.sendMidiNote(note, 1);

        /**
         * The method invoked when a key is released on Hancock.
         * @function
         * @instance
         * @name keyUp
         * @memberof QwertyHancock
         * 
         * @param {string} note - Hancock note name (e.g. G#5).
         */
        this.keyboard.keyUp = (note) => this.sendMidiNote(note, 0);            

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 100);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Creates a settings object for the Qwerty Hancock keyboard widget.
     *
     * @private
     *
     * @returns {Object} Configuration object for the QwertyHancock constructor
     *   containing: `id` (HTML element ID), `width` and `height` (pixels),
     *   `octaves` (octave count), `startNote` (first visible key's note name).
     * 
     * @SEE *
     * @property {string} id        - Id of the htmlElement in which to put the keyboard
     * @property {number} width     - Width of the keyboard in pixels
     * @property {number} height    - Height of the keyboard in pixels
     * @property {number} octaves   - How many octaves to show
     * @property {string} startNote - The note name (hancock numbering) of the first key to show
     *
     * @description
     * Reads current parameter values and composes the configuration object
     * consumed by `new QwertyHancock(...)`. Appearance properties
     * (whiteNotesColour, blackNotesColour, hoverColour, borderColour) are
     * intentionally omitted and controlled via CSS classes instead.
     *
     * @see {@link https://stuartmemo.com/qwerty-hancock/}
     */
     // * @property {string} whiteNotesColour - Default released key color for white keys (bypassed by classes & css)
     // * @property {string} blackNotesColour - Default released key color for black keys (bypassed by classes & css)
     // * @property {string} hoverColour      - Default pressed-key color for all the keys (bypassed by classes & css)
     // * @property {string} borderColour     - Default border color for all the keys (bypassed by classes & css)
    _getSettings() {
        return {
            id: this.parameters.pianoContainer._uiElements.hancockContainer.htmlID,
            width: this.parameters.width.value,
            height: this.parameters.height.value,
            octaves: this.parameters.range.value,
            startNote: this.parameters.offset.startNote,
            // whiteNotesColour: 'white', // default '#fff'
            // blackNotesColour: 'black', // default '#000'
            // hoverColour: '#f3e939', // default 'yellow'
            // borderColour: 'black', // default '#000'
        }
    }

    /**
     * Manages and routes an incoming DHC message to the appropriate handler.
     *
     * @param {HUM.DHCmsg} msg - The incoming message from the DHC.
     *
     * @description
     * Processes DHC messages according to their command type:
     * - `panic`: Calls `allNotesOff()` to silence all keys immediately.
     * - `update` / `ctrlmap`: Calls `fitToKeymap()` to adapt the keyboard to the new mapping.
     * - `tone-on` / `tone-off`: Highlights or un-highlights the corresponding piano key,
     *   but only when the Piano accordion tab is currently open (`active` is `true`).
     */
    updatesFromDHC(msg) {

        if (msg.cmd === 'panic') {
            this.allNotesOff();
        }

        if (msg.cmd === 'update') {
            if (msg.type === 'ft') {

            } else if (msg.type === 'ht') {

            } else if (msg.type === 'ctrlmap') {
                this.fitToKeymap();
            }
        // Play keys only if the accordion Piano tab is open
        } else if ( (['tone-on', 'tone-off']).includes(msg.cmd) && this.parameters.active.value) {
            let ctrlNum = msg.ctrlNum,
                mcXT;
            if (ctrlNum === false) {
                if (msg.type === 'ht' && msg.xtNum === 0) {

                } else {
                    mcXT = Math.round(this.dhc.tables[msg.type][msg.xtNum].mc);
                    ctrlNum = this.dhc.midi.in.tsnapFindCtrlNoteNumber(mcXT, msg.type);
                }
            }
            if (msg.cmd === 'tone-on') {
                this.keyON(ctrlNum);
            } else {
                this.keyOFF(ctrlNum);
            }
        }
    }
    /**
     * Sends a virtual MIDI Note-ON or Note-OFF event to `midi.in`.
     *
     * @param {string} note  - Hancock note name (e.g. `G#5`).
     * @param {(0|1)}  state - `1` for Note-ON, `0` for Note-OFF.
     *
     * @returns {void}
     *
     * @description
     * Constructs a synthetic MIDI message and forwards it directly to
     * `dhc.midi.in.midiMessageReceived()`, making Hancock behave as a
     * virtual MIDI input device. The status byte is built by combining
     * the Note-ON command nibble (0x9) and the configured MIDI channel.
     */
    sendMidiNote(note, state) {
        // Note ON
        let cmd = 9;
        // Channel (change offset to 0-15)
        let channel = this.parameters.channel.value - 1;
        // Compose the Status Byte
        // Bitwise shift to the left 0x9 for 4 bits to get 0x90 (Note ON)
        // Add the channel (0-15) to complete the byte (0x90, 0x91... 0x9F)
        let statusbyte = (cmd << 4) + channel;
        // Create a fake MIDI event for midiMessageReceived
        let midievent = {
            data: [statusbyte, this.dhc.nameToMidiNumber('hancock', note), this.parameters.velocity.value * state, "hancock", false],
            srcElement: {
                id: "952042271",
                manufacturer : "Industrie Creative",
                name: "Virtual MIDI Controller",
                type: "input"
            }
        };
        this.dhc.midi.in.midiMessageReceived(midievent);
    }    

    /*==============================================================================*
     * HANCOCK STYLE WRAPPER
     *==============================================================================*/
    /**
     * Renders keymap labels and colors on the Qwerty Hancock piano keys.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all 128 MIDI note numbers and, for each key present in the
     * Qwerty Hancock DOM, applies CSS classes and inner label text based on the
     * current control map (`dhc.tables.ctrl`):
     * - **FT key**: colored as a Fundamental Tone key; labeled with its FT number.
     * - **HT key**: colored as a Harmonic Tone key; labeled with its HT number.
     * - **HT0 (Piper)**: colored as the Piper key; labeled with `"P"`.
     * - **Unmapped key**: styled with the default black/white key classes.
     */
    drawKeymap() {
        for (var i = 0; i < 128; i++) {
            let note = this.dhc.midiNumberToNames(i)[0];
            if (document.getElementById(note)) {
                let key = document.getElementById(note);
                // If the input MIDI key is in the ctrl map, proceed
                if (this.dhc.tables.ctrl[i]) {
                    // Vars for a better reading
                    var ft = this.dhc.tables.ctrl[i].ft;
                    var ht = this.dhc.tables.ctrl[i].ht;
                    // **FT**
                    // If the key is mapped to a Fundamental Tone only
                    if (ft !== 129 && ht === 129) {
                        // If is a sharp key
                        if (note.match(/[#b]/)) {
                            // Use a darker color
                            key.classList.add("FTbKey", "releasedKey");
                            // Write the key-number
                            key.innerHTML = "<div class='FTbKeyFn unselectableText'>" + ft + "</div>";
                        // Else is a normal key
                        } else {
                            // Use a lighter color
                            key.classList.add("FTwKey", "releasedKey");
                            // Write the key-number
                            key.innerHTML = "<div class='FTwKeyFn unselectableText'>" + ft + "</div>";
                        }
                    }
                    // **HT**
                    // If the key is mapped to a Harmonic Tone only
                    else if (ht !== 129 && ht !== 0 && ft === 129) {
                        // If is a sharp key
                        if (note.match(/[#b]/)) {
                            // Use a darker color
                            key.classList.add("HTbKey", "releasedKey");
                            // Write the key-number
                            key.innerHTML = "<div class='HTbKeyFn unselectableText'>" + ht + "</div>";
                        // Else is a normal key
                        } else {
                            // Use a lighter color
                            key.classList.add("HTwKey", "releasedKey");
                            // Write the key-number
                            key.innerHTML = "<div class='HTwKeyFn unselectableText'>" + ht + "</div>";
                        }
                    // **HT0 (Piper)**
                    // If is HT0
                    } else if (ht === 0 && ft === 129) {                    
                        // If is a sharp key
                        if (note.match(/[#b]/)) {
                            // Use a darker color
                            key.classList.add("HT0bKey", "releasedKey");
                            // Write a "P"
                            key.innerHTML = "<div class='FTbKeyFn unselectableText'>P</div>";
                        } else {
                            // Use a lighter color
                            key.classList.add("HT0wKey", "releasedKey");
                            // Write a "P"
                            key.innerHTML = "<div class='FTwKeyFn unselectableText'>P</div>";
                        }
                    }
                // **Normal Key**
                // If the key is not mapped
                } else {
                    // If is a sharp key
                    if (note.match(/[#b]/)) {
                        // Use a darker color
                        key.classList.add("bKey", "releasedKey");
                    // Else is a normal key
                    } else {
                        // Use a lighter color
                        key.classList.add("wKey", "releasedKey");
                    }
                }
            }
        }
    }
    /**
     * Adapts the keyboard range and offset to encompass the active keymap.
     *
     * @returns {void}
     *
     * @description
     * Reads the MIDI note numbers present in `dhc.tables.ctrl`, computes the
     * minimum and maximum keys, and updates the `range` and `offset` parameters
     * so that the Qwerty Hancock widget displays exactly the octaves needed to
     * show the full keymap. An extra octave is added when the remainder is
     * fewer than 2 semitones.
     */
    fitToKeymap() {
        let keysArray = Object.keys(this.dhc.tables.ctrl),
            keyMin = Math.min.apply(null, keysArray),
            keyMax = Math.max.apply(null, keysArray),
            keysNum = keyMax - keyMin,
            keyOctaves = Math.ceil(keysNum/12),
            keyRemainder = keysNum % 12;
        
        if (keyRemainder < 2) {
            keyOctaves++;
        }
        
        // Update the range
        this.parameters.range.value = keyOctaves;
        // Update the offset
        this.parameters.offset.value = keysArray[0];
    }
    /**
     * Highlights a piano key to indicate Note-ON state.
     *
     * @param {midinnum} ctrlNum - MIDI note number of the key to highlight.
     *
     * @returns {void}
     *
     * @description
     * Looks up the DOM element for the given MIDI note number and swaps its
     * CSS class from `releasedKey` to `pressedKey`, overriding the Qwerty
     * Hancock default key color.
     */
    keyON(ctrlNum) {
        if (ctrlNum !== false) {
            let key = this.dhc.midiNumberToNames(ctrlNum)[0];
            if (document.getElementById(key)){
                document.getElementById(key).classList.remove('releasedKey');
                document.getElementById(key).classList.add('pressedKey');
            }
        }
    }
    /**
     * Restores a piano key to its released visual state after Note-OFF.
     *
     * @param {midinnum} ctrlNum - MIDI note number of the key to restore.
     *
     * @returns {void}
     *
     * @description
     * Looks up the DOM element for the given MIDI note number and swaps its
     * CSS class from `pressedKey` back to `releasedKey`, overriding the
     * Qwerty Hancock default key color.
     */
    keyOFF(ctrlNum) {
        if (ctrlNum !== false) {
            let key = this.dhc.midiNumberToNames(ctrlNum)[0];
            if (document.getElementById(key)){
                document.getElementById(key).classList.remove('pressedKey');
                document.getElementById(key).classList.add('releasedKey');
            }
        }
    }
    /**
     * Restores all 128 piano keys to their released visual state.
     *
     * @returns {void}
     *
     * @description
     * Calls `keyOFF()` for every MIDI note number from `{@link midinnum}` 0 to 127,
     * ensuring no key remains visually stuck in a pressed state.
     */
    allNotesOff() {
        for (let ctrlNum = 0; ctrlNum < 128; ctrlNum++) {
            this.keyOFF(ctrlNum);
        }
    }

    /*==============================================================================*
     * UI KEYBOARD SETTINGS TOOLS
     *==============================================================================*/
    /**
     * Rebuilds the Qwerty Hancock keyboard widget after a settings change.
     *
     * @returns {void}
     *
     * @description
     * Clears the current keyboard DOM and re-instantiates a `QwertyHancock`
     * object with the latest parameter values, then re-applies the keymap
     * styling by calling `drawKeymap()`.
     */
    update() {
        let htmlElem = this.parameters.pianoContainer.uiElements.out.hancockContainer;
        while (htmlElem.firstChild) {
            htmlElem.removeChild(htmlElem.firstChild);
        }
        // this.parameters.pianoContainer.uiElements.out.hancockContainer.innerHTML = "";
        this.keyboard = new QwertyHancock(this._getSettings());
        // @todo - Why it work without reset 'this.keyboard.keyDown' 'this.keyboard.keyUp' ??
        // Start the style wrapper
        this.drawKeymap();
    }
};
