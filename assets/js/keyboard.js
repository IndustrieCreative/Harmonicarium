/**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * Copyright (C) 2017 by Walter Mantovani (http://armonici.it).
 * Written by Walter Mantovani < armonici.it [*at*] gmail [*dot*] com >.
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

/* exported icKeyON */
/* exported icKeyOFF */

/**
 * QWERTY HANCOCK KEYBOARD WRAPPER
 * Bypass the default style of the Qwerty Hancock keyboard (./lib/)
 * to provide custom key colors and events.
 */

"use strict";

/*==============================================================================*
 * MAIN HANCOCK KEYBOARD OBJECTS
 *==============================================================================*/
// Note conversion reference
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

// Default Qwerty Hancock settings
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

// Initialize and get the default Current Velocity from the default value on UI slider
var icHancockCurrentVelocity = document.getElementById("HTMLi_piano_velocity").value;
var icHancockCurrentChannel = Number(document.getElementById("HTMLi_piano_channel").value);

// Initialize the Qwerty Hancock keyboard
var icKeyboard = new QwertyHancock(icHancockCurrSets);
// Start the style wrapper
icHancockKeymap();
// Init the Keyboard UI controllers
icKeyboardUIinit();

// Qwerty Hancock on UI key-press
icKeyboard.keyDown = function (note) {
    icFakeMidiNote(note, 1);
};
// Qwerty Hancock on UI key-release
icKeyboard.keyUp = function (note) {
    icFakeMidiNote(note, 0);
};

/*==============================================================================*
 * MIDI < > HANCOCK TOOLS AND UTILS
 *==============================================================================*/
// Parse the output from Qwerty Hancock to get the MIDI note number
function icHancockToMidi(note) {
    // Get the number of the octave
    let num = note.match(/\d+/);
    // Get the note name
    let char = note.match(/[A-Z]+#*/);
    if (num && char){
        // Return the MIDI note number 
        return icHancockRef.toMidi[char[0]] + (12 * num[0]);
    }
}

// Transform a MIDI note number to a Qwerty Hancock note name
function icMidiToHancock(midikey) {
    // Compute the quotient and remainder of the MIDI note number
    let quotient = Math.trunc(midikey/12);
    let remainder = midikey % 12;
    // String concatenation: Qwerty Hancock note name
    let hancock = icHancockRef.toHancock[remainder] + quotient;
    // String concatenation: Standard note name 
    let notename = icHancockRef.toHancock[remainder] + (quotient + icDHC.settings.global.middle_c);
    // Return an array with both, hancock and standard note name)
    return [hancock, notename];
}

// FAKE MIDI EVENT NOTE ON/OFF
// To input Qwerty Hancock as a MIDI device
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
        data: [statusbyte, icHancockToMidi(note), icHancockCurrentVelocity * state],
        srcElement: {
            id: "952042271",
            manufacturer : "Industrie Creative",
            name: "Virtual MIDI Controller",
            type: "builtin-input"
        }
    };
    icMidiMessageReceived(midievent);
}

/*==============================================================================*
 * HANCOCK STYLE WRAPPER
 *==============================================================================*/
// Bypass the Qwerty Hancock default key colors (released)
function icHancockKeymap() {
    for (var i = 0; i < 128; i++) {
        var key = icMidiToHancock(i)[0];
        if (document.getElementById(key)){
            // If the input MIDI key is in the ctrl_map, proceed
            if (icDHC.tables.ctrl_map[i]) {
                // Vars for a better reading
                var ft = icDHC.tables.ctrl_map[i].ft;
                var ht = icDHC.tables.ctrl_map[i].ht;
                // If the key is in the DOM (..?)
                    // **FT**
                    // If the key is mapped to a Fundamental Tone only
                    if (ft !== 129 && ht === 129) {
                        // If is a sharp key
                        if (key.match(/#/)) {
                            // Use a darker color
                            document.getElementById(key).classList.add("FTbKey", "releasedKey");
                        // Else is a normal key
                        } else {
                            // Use a lighter color
                            document.getElementById(key).classList.add("FTwKey", "releasedKey");
                        }
                    }
                    // **HT**
                    // If the key is mapped to a Harmonic Tone only
                    else if (ht !== 129 && ft === 129) {
                        // If is a sharp key
                        if (key.match(/#/)) {
                            // Use a darker color
                            document.getElementById(key).classList.add("HTbKey", "releasedKey");
                        // Else is a normal key
                        } else {
                            // Use a lighter color
                            document.getElementById(key).classList.add("HTwKey", "releasedKey");
                        }
                    }
            // **Normal Key**
            // If the key is not mapped
            } else {
                // If is a sharp key
                if (key.match(/#/)) {
                    // Use a darker color
                    document.getElementById(key).classList.add("bKey", "releasedKey");
                // Else is a normal key
                } else {
                    // Use a lighter color
                    document.getElementById(key).classList.add("wKey", "releasedKey");
                }
            }
        }
    }
}

// (On MIDI note ON)
// Bypass the Qwerty Hancock default key colors (pressed)
function icKeyON(ctrlNoteNumber) {
    var key = icMidiToHancock(ctrlNoteNumber)[0];
    if (document.getElementById(key)){
        document.getElementById(key).classList.remove('releasedKey');
        document.getElementById(key).classList.add('pressedKey');
    }
}

// (On MIDI note OFF)
// Bypass the Qwerty Hancock default key colors (back to released again)
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
// To update the Qwerty Hancock keyboard on UI setting changes
function icHancockUpdate() {
    document.getElementById("HTMLo_pianoContainer").innerHTML = "";
    icKeyboard = new QwertyHancock(icHancockCurrSets);
    // Start the style wrapper
    icHancockKeymap();
}

// Update the offset of the Qwerty Hancock
function icHancockChangeOffset(midikey) {
    let note = icMidiToHancock(midikey)[0];
    if (!note.match(/#/)) {
        icHancockCurrSets.startNote = note;
        icHancockUpdate();
    }
    document.getElementById("HTMLi_piano_offset").value = midikey;
}

// Modify the octave-range of Qwerty Hancock
function icHancockChangeRange(octaves) {
        icHancockCurrSets.octaves = octaves;
        icHancockUpdate();
}

// Modify the size of Qwerty Hancock
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