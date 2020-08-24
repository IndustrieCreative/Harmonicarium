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
 * @fileoverview QWERTY HANCOCK KEYBOARD WRAPPER<br>
 *     Bypass the default style of the Qwerty Hancock keyboard (./lib/)
 *     to provide custom key colors and events.
 * 
 * @author Walter Mantovani < armonici.it [at] gmail [dot] com >
 */

/* exported icKeyON */
/* exported icKeyOFF */
/* exported icKeyboardUIinit */

"use strict";

/*==============================================================================*
 * MAIN HANCOCK KEYBOARD OBJECTS
 *==============================================================================*/

/**
 * Note name to MIDI number conversion reference
 *
 * @type {Object}
 *
 * @property {Object.<string, number>} toMidi    - Note name to number
 * @property {Object.<number, string>} toHancock - Number to note name
 */
var icHancockRef = {
    toMidi: {
        "C": 0,
        "C#": 1,
        "D": 2,
        "D#": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "G": 7,
        "G#": 8,
        "A": 9,
        "A#": 10,
        "B": 11,
    },
    toHancock: {
        0: "C",
        1: "C#",
        2: "D",
        3: "D#",
        4: "E",
        5: "F",
        6: "F#",
        7: "G",
        8: "G#",
        9: "A",
        10: "A#",
        11: "B",
    }
};

/**
 * Default Qwerty Hancock settings
 *
 * @type {Object}
 *
 * @property {string} id               - Id of the htmlElement in which to put the keyboard
 * @property {number} width            - Width of the keyboard in pixels
 * @property {number} height           - Height of the keyboard in pixels
 * @property {number} octaves          - How many octaves to show
 * @property {string} startNote        - The note name (hancock numbering) of the first key to show
 * @property {string} whiteNotesColour - Default released key color for white keys (bypassed by classes & css)
 * @property {string} blackNotesColour - Default released key color for black keys (bypassed by classes & css)
 * @property {string} hoverColour      - Default pressed key color for all the keys (bypassed by classes & css)
 */
var icHancockCurrSets = {
    id: 'HTMLo_pianoContainer',
    width: 600,
    height: 80,
    octaves: 4,
    startNote: 'F3',
    whiteNotesColour: 'white',
    blackNotesColour: 'black',
    hoverColour: '#f3e939'
};

/**
 * Get the default current Velocity from the default value on UI slider
 *
 * @type {number}
 */
var icHancockCurrentVelocity = Number(document.getElementById("HTMLi_piano_velocity").value);

/**
 * Get the default current Channel from the default value on UI slider
 *
 * @type {number}
 */
var icHancockCurrentChannel = Number(document.getElementById("HTMLi_piano_channel").value);

/**
 * Initialize a new Qwerty Hancock keyboard
 *
 * @type {QwertyHancock}
 */
var icKeyboard = new QwertyHancock(icHancockCurrSets);

/**
 * Send a fake MIDI Note-ON (key press)
 * 
 * @param {string} note - Hancock note name (e.g. G#5)
 */
icKeyboard.keyDown = function (note) {
    icFakeMidiNote(note, 1);
};
/**
 * Send a fake MIDI Note-OFF (key release)
 * 
 * @param {string} note - Hancock note name (e.g. G#5)
 */
icKeyboard.keyUp = function (note) {
    icFakeMidiNote(note, 0);
};

/*==============================================================================*
 * MIDI < > HANCOCK TOOLS AND UTILS
 *==============================================================================*/

/**
 * Parse the output note name from Qwerty Hancock to get the MIDI note number
 *
 * @param  {string} note - Hancock note name (e.g. G#5)
 *
 * @return {number}      - MIDI note number
 */
function icHancockToMidi(note) {
    // Get the number of the octave
    let num = note.match(/\d+/);
    // Get the note name
    let char = note.match(/[A-Z]+#*/);
    if (num && char) {
        // Return the MIDI note number 
        return icHancockRef.toMidi[char[0]] + (12 * num[0]);
    }
}

/**
 * Transform a MIDI note number to a Qwerty Hancock note name
 *
 * @param  {number} midikey - MIDI note number
 *
 * @return {Array}          - An array with Hancock note name and Standard note name
 */
function icMidiToHancock(midikey) {
    // Compute the quotient and remainder of the MIDI note number
    let quotient = Math.trunc(midikey/12);
    let remainder = midikey % 12;
    // String concatenation: Qwerty Hancock note name
    let hancock = icHancockRef.toHancock[remainder] + quotient;
    // String concatenation: Standard note name 
    let notename = icHancockRef.toHancock[remainder] + (quotient + icDHC.settings.global.middle_c);
    // Return an array with both, hancock and standard note name
    return [hancock, notename];
}

/**
 * Send a fake MIDI event note ON/OFF
 * in order to input Qwerty Hancock as a virtual MIDI device
 *
 * @param  {string} note  - Hancock note name (e.g. G#5)
 * @param  {(0|1)}  state - 0 is Note-OFF | 1 is Note-ON
 */
function icFakeMidiNote(note, state) {
    // Note ON
    let cmd = 9;
    // Channel (change offset to 0-15)
    let channel = icHancockCurrentChannel - 1;
    // Compose the Status Byte
    // Bitwise shift to the left 0x9 for 4 bits to get 0x90 (Note ON)
    // Add the channel (0-15) to complete the byte (0x90, 0x91... 0x9F)
    let statusbyte = (cmd << 4) + channel;
    // Create a fake MIDI event for icMidiMessageReceived
    let midievent = {
        data: [statusbyte, icHancockToMidi(note), icHancockCurrentVelocity * state, "hancock", false],
        srcElement: {
            id: "952042271",
            manufacturer : "Industrie Creative",
            name: "Virtual MIDI Controller",
            type: "input"
        }
    };
    icMidiMessageReceived(midievent);
}

/*==============================================================================*
 * HANCOCK STYLE WRAPPER
 *==============================================================================*/

/**
 * Bypass the Qwerty Hancock default key colors (released)
 * Write the key-numbers according to the keymap
 */
function icHancockKeymap() {
    for (var i = 0; i < 128; i++) {
        let note = icMidiToHancock(i)[0];
        if (document.getElementById(note)) {
            let key = document.getElementById(note);
            // If the input MIDI key is in the ctrl_map, proceed
            if (icDHC.tables.ctrl_map[i]) {
                // Vars for a better reading
                var ft = icDHC.tables.ctrl_map[i].ft;
                var ht = icDHC.tables.ctrl_map[i].ht;
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
 * Bypass the Qwerty Hancock default key colors (key pressed)
 * Used on MIDI Note-ON
 *
 * @param  {number} ctrlNoteNumber - MIDI note number
 */
function icKeyON(ctrlNoteNumber) {
    var key = icMidiToHancock(ctrlNoteNumber)[0];
    if (document.getElementById(key)){
        document.getElementById(key).classList.remove('releasedKey');
        document.getElementById(key).classList.add('pressedKey');
    }
}

/**
 * Bypass the Qwerty Hancock default key colors (back to released again)
 * Used on MIDI Note-OFF
 *
 * @param  {number} ctrlNoteNumber - MIDI note number
 */
function icKeyOFF(ctrlNoteNumber) {
    var key = icMidiToHancock(ctrlNoteNumber)[0];
    if (document.getElementById(key)){
        document.getElementById(key).classList.remove('pressedKey');
        document.getElementById(key).classList.add('releasedKey');
    }
}

/*==============================================================================*
 * UI KEYBOARD SETTINGS TOOLS
 *==============================================================================*/

/**
 * To update the Qwerty Hancock keyboard on UI setting changes
 */
function icHancockUpdate() {
    document.getElementById("HTMLo_pianoContainer").innerHTML = "";
    icKeyboard = new QwertyHancock(icHancockCurrSets);
    // @todo - Why it work without reset 'icKeyboard.keyDown' 'icKeyboard.keyUp' ??
    // Start the style wrapper
    icHancockKeymap();
}

/**
 * Update the offset of the Qwerty Hancock
 *
 * @param  {number} midikey - MIDI note number
 */
function icHancockChangeOffset(midikey) {
    let note = icMidiToHancock(midikey)[0];
    if (!note.match(/#/)) {
        icHancockCurrSets.startNote = note;
        icHancockUpdate();
    }
}

/**
 * Modify the octave-range of Qwerty Hancock and update the UI
 *
 * @param  {number} octaves - Number of octaves to show
 */
function icHancockChangeRange(octaves) {
        icHancockCurrSets.octaves = octaves;
        icHancockUpdate();
}

/**
 * Modify the size of Qwerty Hancock and update the UI
 *
 * @param  {number}    pixels - Number of pixels
 * @param  {('w'|'h')} dim    - The dimension to change; 'w' is for weight, 'h' is for height 
 */
function icHancockChangeSize(pixels, dim) {
    if (dim === "w") {
        icHancockCurrSets.width = pixels;
    } else if (dim === "h") {
        icHancockCurrSets.height = pixels;
    } else {
        console.log("icHancockChangeSize: wrong 'dim' parameter: " + dim);
    }
    icHancockUpdate();
}

/*==============================================================================*
 * KEYBOARD UI INITS
 *==============================================================================*/

/**
 * Initialize the UI of the MIDI Virtual Controller
 */
function icKeyboardUIinit() {
    // Update the channel of the Qwerty Hancock on UI changes
    document.getElementById("HTMLi_piano_channel").addEventListener("input", function(event) {
        icHancockCurrentChannel = Number(event.target.value);
    });
    // Update the velocity of the Qwerty Hancock on UI changes
    document.getElementById("HTMLi_piano_velocity").addEventListener("input", function(event) {
        icHancockCurrentVelocity = event.target.value;
    });
    // Update the offset of the Qwerty Hancock on UI changes
    document.getElementById("HTMLi_piano_offset").addEventListener("input", function(event) {
        icHancockChangeOffset(event.target.value);
    });

    // Update the octave range of the Qwerty Hancock on UI changes
    document.getElementById("HTMLi_piano_range").addEventListener("input", function(event) {
        icHancockChangeRange(event.target.value);
    });

    // Update the width of the Qwerty Hancock on UI changes
    document.getElementById("HTMLi_piano_width").addEventListener("input", function(event) {
        icHancockChangeSize(event.target.value, "w");
    });

    // Update the height of the Qwerty Hancock on UI changes
    document.getElementById("HTMLi_piano_height").addEventListener("input", function(event) {
        icHancockChangeSize(event.target.value, "h");
    });
}