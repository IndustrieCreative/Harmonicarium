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

/**
 * KEYMAP READERS
 * To open, parse and handle the Keymap tables.
 */

"use strict";

// Add an EventListener to the (on)change event of the Controller Keymap File <input> tag
document.getElementById('HTMLi_controllerKeymapFile').addEventListener('change', icHandleKeymapFile , false);

// On loading the Controller Keymap file
function icHandleKeymapFile(changeEvent) {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        // Access to the file and send it to read function
        icReadKeymapFile(changeEvent.target.files[0]);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

// Initialize the file reading process
function icReadKeymapFile(file) {
    var reader = new FileReader();
    // Read file into memory as UTF-8      
    reader.readAsText(file);
    // Launch the data processing as soon as the file has been loaded
    reader.onload = function(event){
        icProcessKeymapData(event.target.result);
    };
    // Handle loading errors
    reader.onerror = icFileErrorHandler;
}

// Build the Controller Keymap table {ctrl_fn}
// Incoming raw data from .hcmap file
function icProcessKeymapData(data) { 
    // Split by lines
    var allTextLines = data.split(/\r\n|\n/);
    var lines = {};
    // For every line
    for (var i = 0; i < allTextLines.length; i++) {
        // Split the line by spaces or tabs
        var elements = allTextLines[i].split(/\s\s*/);
        // lines.push( { midikey: parseInt(elements[0]), ft: parseInt(elements[1]), ht: parseInt(elements[2]) } );
        lines[parseInt(elements[0])] = { ft: parseInt(elements[1]), ht: parseInt(elements[2]) };
    }
    // Write the Controller Keymap into the global object
    icDHC.tables.ctrl_map = lines;
    // Update the HStack
    icHSTACKcreate();
    icHSTACKfillin();
    // Update the offset of the Qwerty Hancock on UI
    icHancockChangeOffset(Object.keys(icDHC.tables.ctrl_map)[0]);
}

// Handle errors on loading the file
function icFileErrorHandler(errorEvent) {
    switch (errorEvent.target.error.code) {
        case errorEvent.target.error.NOT_FOUND_ERR:
            alert('File Not Found!');
            break;
        case errorEvent.target.error.NOT_READABLE_ERR:
            alert('File is not readable.');
            break;
        case errorEvent.target.error.ABORT_ERR:
            break; // noop
        default:
            alert('An error occurred reading this file.');
    }
}