 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2020 by Walter Mantovani (http://armonici.it).
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
/* globals QwertyHancock */

"use strict";

/** 
 * The Hancock class<br>
 *    A tool to manage and override the Qwerty Hancock lib
 * 
 * @see {@link https://github.com/stuartmemo/qwerty-hancock}
 */
HUM.Hancock = class {
    /**
    * @param {HUM.DHC} dhc - The DHC instance to which it belongs
    */
    constructor(dhc) {
        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;
        /**
         * The state of the Hancock; if `false`, it is turned off.
         *
         * @member {boolean}
         */
        this.active = false;
        /**
         * Default Qwerty Hancock settings
         *
         * @see {@link https://stuartmemo.com/qwerty-hancock/}
         *
         * @member {Object}
         *
         * @property {string}   id               - Id of the htmlElement in which to put the keyboard
         * @property {number}   width            - Width of the keyboard in pixels
         * @property {number}   height           - Height of the keyboard in pixels
         * @property {number}   octaves          - How many octaves to show
         * @property {string}   startNote        - The note name (hancock numbering) of the first key to show
         * @property {string}   whiteNotesColour - Default released key color for white keys (bypassed by classes & css)
         * @property {string}   blackNotesColour - Default released key color for black keys (bypassed by classes & css)
         * @property {string}   hoverColour      - Default pressed-key color for all the keys (bypassed by classes & css)
         * @property {velocity} velocity         - The velocity value to be used when sending messages; an integer between 1 and 127
         * @property {midichan} channel          - The Channel to be used when sending messages; an integer between 0 and 15
         */
        // @old icHancockCurrSets
        this.settings = {
            id: 'HTMLo_hancockContainer'+dhc.id,
            width: 600,
            height: 80,
            // octaves: 4, // default 3
            // startNote: 'F3', // default 'A3'
            // whiteNotesColour: 'white', // default '#fff'
            // blackNotesColour: 'black', // default '#000'
            // hoverColour: '#f3e939', // default 'yellow'
            // borderColour: 'black', // default '#000'
            
            // Added properties (non Hancock natives)
            velocity: 120,
            channel: 1
        };
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
                checkboxPiano: this.dhc.harmonicarium.html.pianoTab[dhc.id].children[0],
            },
            in: {
                velocity: document.getElementById("HTMLi_piano_velocity"+dhc.id),
                channel: document.getElementById("HTMLi_piano_channel"+dhc.id),
                keyboardOffset: document.getElementById("HTMLi_piano_offset"+dhc.id),
                keyboardRange: document.getElementById("HTMLi_piano_range"+dhc.id),
                keyboardWidth: document.getElementById("HTMLi_piano_width"+dhc.id),
                keyboardHeight: document.getElementById("HTMLi_piano_height"+dhc.id),
            },
            out: {
                pianoContainer: document.getElementById(this.settings.id),
            },
        };
        /**
         * The instance of Qwerty Hancock piano keyboard
         *
         * @member {QwertyHancock}
         */
        // @old icKeyboard
        this.keyboard = new QwertyHancock(this.settings);
        /**
         * The method invoked when a key is pressed on Hanckock
         *
         * @param {string} note - Hancock note name (e.g. G#5)
         */
        // @old icKeyboard.keyDown
        this.keyboard.keyDown = (note) => this.sendMidiNote(note, 1);
        /**
         * The method invoked when a key is released on Hanckock
         * 
         * @function
         * @param {string} note - Hancock note name (e.g. G#5)
         */
        // @old icKeyboard.keyUp
        this.keyboard.keyUp = (note) => this.sendMidiNote(note, 0);            

        this._initUI();

        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 100);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manage and route an incoming message
     *
     * @param {HUM.DHCmsg} msg - The incoming message
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
        } else if ( (['tone-on', 'tone-off']).includes(msg.cmd) && this.active) {
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
     * Send a fake MIDI event note ON/OFF directly to midi.in
     * in order to input Qwerty Hancock as a virtual MIDI device
     *
     * @param {string} note  - Hancock note name (e.g. G#5)
     * @param {(0|1)}  state - 0 is Note-OFF | 1 is Note-ON
     */
    // @old icFakeMidiNote
    sendMidiNote(note, state) {
        // Note ON
        let cmd = 9;
        // Channel (change offset to 0-15)
        let channel = this.settings.channel - 1;
        // Compose the Status Byte
        // Bitwise shift to the left 0x9 for 4 bits to get 0x90 (Note ON)
        // Add the channel (0-15) to complete the byte (0x90, 0x91... 0x9F)
        let statusbyte = (cmd << 4) + channel;
        // Create a fake MIDI event for midiMessageReceived
        let midievent = {
            data: [statusbyte, this.dhc.nameToMidiNumber('hancock', note), this.settings.velocity * state, "hancock", false],
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
     * Bypass the Qwerty Hancock default key colors (released).
     *     Write the key-numbers according to the keymap.
     */
    // @old icHancockKeymap
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
                        if (note.match(/#/)) {
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
                        if (note.match(/#/)) {
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
                        if (note.match(/#/)) {
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
                    if (note.match(/#/)) {
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
     * Adapt the Hancock UI parameters in order to fit the keymap to the piano width.
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
        this.changeRange(keyOctaves);
        this.uiElements.in.keyboardRange.value = keyOctaves;
        // Update the offset
        this.changeOffset(keysArray[0]);
        this.uiElements.in.keyboardOffset.value = keysArray[0];
    }
    /**
     * Bypass the Qwerty Hancock default key colors and set the right color for Note-ON message.
     *
     * @param {midinnum} ctrlNum - MIDI note number
     */
    // @old icKeyON
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
     * Bypass the Qwerty Hancock default key colors and set the right color for Note-OFF message.
     *
     * @param {midinnum} ctrlNum - MIDI note number
     */
    // @old icKeyOFF
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
     * Turns off all the keys (from `{@link midinnum}` 0 to 127)
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
     * Update the Qwerty Hancock keyboard on UI setting changes
     */
    // @old icHancockUpdate
    update() {
        this.uiElements.out.pianoContainer.innerHTML = "";
        this.keyboard = new QwertyHancock(this.settings);
        // @todo - Why it work without reset 'this.keyboard.keyDown' 'this.keyboard.keyUp' ??
        // Start the style wrapper
        this.drawKeymap();
    }
    /**
     * Set the offset of the Qwerty Hancock and update the UI.
     *     The piano keyboard will start from the given note to the right.
     *
     * @param {midinnum} midikey - MIDI note number representing a piano key
     */
    // @old icHancockChangeOffset
    changeOffset(midikey) {
        let note =  this.dhc.midiNumberToNames(midikey)[0];
        if (!note.match(/#/)) {
            this.settings.startNote = note;
            this.update();
        }
    }
    /**
     * Set the octave-range of Qwerty Hancock and update the UI
     *
     * @param  {number} octaves - Number of octaves to show
     */
    // @old icHancockChangeRange
    changeRange(octaves) {
            this.settings.octaves = octaves;
            this.update();
    }
    /**
     * Modify the size of Qwerty Hancock and update the UI
     *
     * @param {number}    pixels - Number of pixels
     * @param {('w'|'h')} dim    - The dimension to change; 'w' is for weight, 'h' is for height 
     */
    // @old icHancockChangeSize
    changeSize(pixels, dim) {
        if (dim === "w") {
            this.settings.width = pixels;
        } else if (dim === "h") {
            this.settings.height = pixels;
        } else {
            console.log("Hancock changeSize: wrong 'dim' parameter: " + dim);
        }
        this.update();
    }

    /*==============================================================================*
     * KEYBOARD UI INITS
     *==============================================================================*/
    /**
     * Initialize the UI of the Hancock instance
     */
    // @old icKeyboardUIinit
    _initUI() {

        this.uiElements.in.velocity.value = this.settings.velocity;
        this.uiElements.in.channel.value = this.settings.channel;
        this.uiElements.in.keyboardWidth.value = this.settings.width;
        this.uiElements.in.keyboardHeight.value = this.settings.height;

        // @todo - set the "min", "max", "step" using a config file, like the user settings file...
        // this.uiElements.in.keyboardOffset.value = 
        // this.uiElements.in.keyboardRange.value = 

        // Disable the keyboard animation if the accordion Piano tab is closed
        this.uiElements.fn.checkboxPiano.addEventListener('change', (e) => {
            if (e.target.checked === true) {
                this.active = true;

            } else {
                this.active = false;
                // Turn off all the tones currently active, if there are
                this.allNotesOff();
            }
        });

        // Update the channel of the Qwerty Hancock on UI changes
        this.uiElements.in.channel.addEventListener("input", (e) => {
            this.settings.channel = Number(e.target.value);
        });
        // Update the velocity of the Qwerty Hancock on UI changes
        this.uiElements.in.velocity.addEventListener("input", (e) => {
            this.settings.velocity = e.target.value;
        });
        // Update the offset of the Qwerty Hancock on UI changes
        this.uiElements.in.keyboardOffset.addEventListener("input", (e) => {
            this.changeOffset(e.target.value);
        });

        // Update the octave range of the Qwerty Hancock on UI changes
        this.uiElements.in.keyboardRange.addEventListener("input", (e) => {
            this.changeRange(e.target.value);
        });

        // Update the width of the Qwerty Hancock on UI changes
        this.uiElements.in.keyboardWidth.addEventListener("input", (e) => {
            this.changeSize(e.target.value, "w");
        });

        // Update the height of the Qwerty Hancock on UI changes
        this.uiElements.in.keyboardHeight.addEventListener("input", (e) => {
            this.changeSize(e.target.value, "h");
        });
    }

};
