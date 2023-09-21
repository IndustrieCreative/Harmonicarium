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

/** 
 * The Hancock class<br>
 *    A tool to manage and override the Qwerty Hancock lib
 * 
 * @see {@link https://github.com/stuartmemo/qwerty-hancock}
 */
HUM.Hancock = class {
    /**
    * @param {HUM.DHC} dhc - The DHC instance to which this Hancock belongs
    */
    constructor(dhc) {
        /**
        * The id of the DHC instance.
        *
        * @member {string}
        */
        this.id = dhc.id;
        this._id = dhc._id;

        /**
        * The name of the `HUM.Hancock`, useful for group the parameters on the DB.
        * Currently hard-coded as `"hancock"`.
        *
        * @member {string}
        */
        this.name = 'hancock';

        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;

        /**
        * Instance of `HUM.Hancock#Parameters`.
        *
        * @member {HUM.BackendUtils.prototype.Parameters}
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
         * The method invoked when a key is pressed on Hanckock.
         * @function
         * @instance
         * @name keyDown
         * @memberof QwertyHancock
         *
         * @param {string} note - Hancock note name (e.g. G#5).
         */
        this.keyboard.keyDown = (note) => this.sendMidiNote(note, 1);

        /**
         * The method invoked when a key is released on Hanckock.
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
     * Create a Qwerty Hancock settings object
     *
     * @see {@link https://stuartmemo.com/qwerty-hancock/}
     *
     * @member {Object}
     *
     * @property {string} id        - Id of the htmlElement in which to put the keyboard
     * @property {number} width     - Width of the keyboard in pixels
     * @property {number} height    - Height of the keyboard in pixels
     * @property {number} octaves   - How many octaves to show
     * @property {string} startNote - The note name (hancock numbering) of the first key to show
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
     * Manage and route an incoming message.
     *
     * @param {HUM.DHCmsg} msg - The incoming message.
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
     * Send a fake MIDI event note ON/OFF directly to `midi.in`
     * in order to input Qwerty Hancock as a virtual MIDI device.
     *
     * @param {string} note  - Hancock note name (e.g. G#5)
     * @param {(0|1)}  state - 0 is Note-OFF | 1 is Note-ON
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
     * Bypass the Qwerty Hancock default key colors (released).
     * Write the key-numbers according to the keymap.
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
        this.parameters.range.value = keyOctaves;
        // Update the offset
        this.parameters.offset.value = keysArray[0];
    }
    /**
     * Bypass the Qwerty Hancock default key colors and set the right color for Note-ON message.
     *
     * @param {midinnum} ctrlNum - MIDI note number
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
     * Bypass the Qwerty Hancock default key colors and set the right color for Note-OFF message.
     *
     * @param {midinnum} ctrlNum - MIDI note number
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

/** 
 * Instance class-container used to create all the `HUM.Param` objects for the `HUM.Hancock` instance.
 */
HUM.Hancock.prototype.Parameters = class {
    /**
     * @param {HUM.Hancock} hancock - The Hancock instance in which this class is being used.
     */
    constructor(hancock) {
        /**  
         * This property controls the state of the Hancock; if `false`, it's turned off in order to avoid
         * unuseful computations and uptates of the UI when the panel is closed.
         * It also initialises the eventListener of the UIelems related to it.
         * It's not stored on the DB.
         * NOTE: These uiElements are the same object because, given the current implementation of
         * Param.UIelem, it's not possible to set more event listeners using a single UIelem.
         *
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                          - The visibility one wants to achieve. If `false` the tab will be collapsed.
         * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn                  - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.fn.hancockTabShown  - The HTML of the Hancock tab.
         * @property {HTMLElement} uiElements.fn.hancockTabHidden - The HTML of the Hancock tab.
         */
        this.active = new HUM.Param({
            app:hancock,
            idbKey:'hancockActive',
            uiElements:{
                'hancockTabShown': new HUM.Param.UIelem({
                    htmlID: hancock.dhc.harmonicarium.html.pianoTabs[hancock.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget:'collapse',
                    eventType: 'show.bs.collapse',
                    uiSet: (value) => {
                        if (value) {
                            this.active.bsCollapse.show();
                        } else {
                            this.active.bsCollapse.hide();
                        }
                    },
                    eventListener: evt => {
                        this.active.valueUI = true;
                    }
                }),
                'hancockTabHidden': new HUM.Param.UIelem({
                    htmlID: hancock.dhc.harmonicarium.html.pianoTabs[hancock.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget:'collapse',
                    eventType: 'hidden.bs.collapse',
                    uiSet: null,
                    eventListener: evt => {
                        this.active.valueUI = false;
                    }
                }),
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            presetStore:false,
            presetRestore:false,
            preInit: () => {
                // Create a Bootstrap collapsible controller
                this.active.bsCollapse = new bootstrap.Collapse('#'+hancock.dhc.harmonicarium.html.pianoTabs[hancock.dhc.id].children[1].id, {
                    toggle: this.active.value
                });
            },
            postSet: (value, thisParam, init) => {
                if (!value) {
                    // Turn off all the tones currently active, if there are
                    hancock.allNotesOff();
                }
            }
        });
        /**  
         * This property it's just a proxy for the HTML container of the Hancock piano.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements                      - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out                  - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.hancockContainer - The HTML Hancock piano container.
         */
        this.pianoContainer = new HUM.Param({
            app:hancock,
            idbKey:'hancockPianoContainer',
            uiElements:{
                'hancockContainer': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
        });
        /**  
         * This property controls the velocity amount for the Hancock piano and initialises the
         * eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {velocity}    value                        - The velocity value to be used when sending messages; an integer between 1 and 127.
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_velocity - The HTML of the input slider widget for setting the velocity amount.
         */
        this.velocity = new HUM.Param({
            app:hancock,
            idbKey:'hancockVelocity',
            uiElements:{
                'piano_velocity': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            initValue:120,
            postSet: (value, thisParam, init) => {
                thisParam.uiElements.in.piano_velocity.setAttribute('data-tooltip', value);
            }
        });
        /**  
         * This property controls the Channel to be used when sending messages through the Hancock piano
         * and initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {midichan}    value                       - The Channel to be used when sending messages; an integer between 0 and 15.
         * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in               - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_channel - The HTML of the input slider widget for setting the output channel.
         */
        this.channel = new HUM.Param({
            app:hancock,
            idbKey:'hancockChannel',
            uiElements:{
                'piano_channel': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'number',
                    htmlTargetProp:'value',
                    eventType: 'change',
                }),
            },
            dataType:'integer',
            initValue:1,
        });
        
        /**  
         * This property sets the offset of the Qwerty Hancock and update the UI.
         * The piano keyboard will start from the given note to the right.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {midinnum}    value                      - MIDI note number representing a piano key.
         * @property {string}      startNote                 - The effective note name of the key set in the "value".
         *                                                      Do not set it directly because it's for internal use only.
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in              - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_offset - The HTML of the input slider widget for setting the offset.
         */
        this.offset = new HUM.Param({
            app:hancock,
            idbKey:'hancockOffset',
            uiElements:{
                'piano_offset': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            init:false, // NOTE: It will be initialized when the keymap is loaded
            // initValue:120,
            restoreStage: 'post',
            postSet: (value, thisParam, init) => {
                let note =  hancock.dhc.midiNumberToNames(value)[0];
                if (!note.match(/[#b]/)) {
                    thisParam.startNote = note;
                    hancock.update();
                }
                thisParam.uiElements.in.piano_offset.setAttribute('data-tooltip', value);
            },
            customProperties: {startNote:''}
        });
        /**  
         * This property sets the octave-range of Qwerty Hancock and update the UI.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {number}      value                     - Number of octaves to show.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_range - The HTML of the input slider widget for setting the range number.
         */
        this.range = new HUM.Param({
            app:hancock,
            idbKey:'hancockRange',
            uiElements:{
                'piano_range': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            // initValue:120,
            init:false, // NOTE: It will be initialized when the keymap is loaded
            restoreStage: 'post',
            postSet: (value, thisParam, init) => {
                hancock.update();
                thisParam.uiElements.in.piano_range.setAttribute('data-tooltip', value);
            },
        });
        /**  
         * This property sets the width of the Qwerty Hancock and update the UI.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {number}      value                     - The width expressed in pixels.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_width - The HTML of the input slider widget for setting the width.
         */
        this.width = new HUM.Param({
            app:hancock,
            idbKey:'hancockWidth',
            uiElements:{
                'piano_width': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            initValue:600,
            restoreStage: 'mid',
            postSet: (value, thisParam, init) => {
                if (!init) {
                    hancock.update();
                }
                thisParam.uiElements.in.piano_width.setAttribute('data-tooltip', value);
            },
        });
        /**  
         * This property sets the height of the Qwerty Hancock and update the UI.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {number}      value                     - The height expressed in pixels.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_width - The HTML of the input slider widget for setting the height.
         */
        this.height = new HUM.Param({
            app:hancock,
            idbKey:'hancockHeight',
            uiElements:{
                'piano_height': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            initValue:80,
            restoreStage: 'mid',
            postSet: (value, thisParam, init) => {
                if (!init) {
                    hancock.update();
                }
                thisParam.uiElements.in.piano_height.setAttribute('data-tooltip', value);
            },
        });
    }
    /**
     * Initializes the parameter "active".
     */
    _init() {
        this.active._init();
    }

};
