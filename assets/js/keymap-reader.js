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
 * @fileoverview KEYMAP READERS<br>
 *     To open, parse and handle the Keymap tables.
 * 
 * @author Walter Mantovani < armonici.it [at] gmail [dot] com >
 */

/* exported icKeymapsUIinit */
/* exported icUpdateKeymapPreset */

"use strict";

/**
 * Initialize the UI of the Controller keymap readers
 */
function icKeymapsUIinit() {
    // Add an EventListener to the (on)change event of the Controller Keymap File <input> tag
    document.getElementById('HTMLi_controllerKeymapFile').addEventListener('change', icHandleKeymapFile, false);
    // Add an EventListener to the (on)change event of the Controller Keymap File <select> tag
    document.getElementById('HTMLi_controllerKeymapPresets').addEventListener('change', icLoadKeymapPreset);
}

/**
 * Update the preset list according to the selected FTs Tuning System
 */
function icUpdateKeymapPreset() {
    let htmlElem = document.getElementById('HTMLi_controllerKeymapPresets');
    let lastValue = icCtrlKeymapPreset.current[icDHC.settings.ft.selected];
    let event = {target: {value: lastValue}};
    let keymaps = Object.keys(icCtrlKeymapPreset[icDHC.settings.ft.selected]);
    let optionFile = document.createElement("option");
    htmlElem.innerHTML = "";
    for (let key of keymaps) {
        let option = document.createElement("option");
        option.value = key;
        option.text = icCtrlKeymapPreset[icDHC.settings.ft.selected][key].notes;
        htmlElem.add(option);
    }
    optionFile.text = "Load from file...";
    optionFile.value = 99;
    htmlElem.add(optionFile);
    htmlElem.value = lastValue;
    icLoadKeymapPreset(event);
}

/**
 * Load a Controller keymap from icCtrlKeymapPreset according to the selection on UI
 *
 * @param {Event} changeEvent - Change HTML event on 'select' element (ctrl keymap dropdown)
 */
function icLoadKeymapPreset(changeEvent) {
    let indexValue = changeEvent.target.value;
    if (indexValue != 99) {
        let keymap = icCtrlKeymapPreset[icDHC.settings.ft.selected][indexValue].map;
        let keysArray = Object.keys(keymap);
        let keyMin = Math.min.apply(null, keysArray);
        let keyMax = Math.max.apply(null, keysArray);
        let keysNum = keyMax - keyMin;
        let keyOctaves = Math.ceil(keysNum/12);
        let keyRemainder = keysNum % 12;
        if (keyRemainder < 2) {
            keyOctaves++;
        }
        // Store the current Keymap <option> value in a global slot
        icCtrlKeymapPreset.current[icDHC.settings.ft.selected] = indexValue;
        // Write the Controller Keymap into the global object
        icDHC.tables.ctrl_map = keymap;
        // Update the range of the Qwerty Hancock on UI
        icHancockChangeRange(keyOctaves);
        document.getElementById("HTMLi_piano_range").value = keyOctaves;
        // Update the offset of the Qwerty Hancock on UI
        icHancockChangeOffset(keysArray[0]);
        document.getElementById("HTMLi_piano_offset").value = keysArray[0];
        // Update the HStack
        icHSTACKcreate();
        icHSTACKfillin();
        document.getElementById('HTMLi_controllerKeymapFile').style.visibility = "hidden";
    } else {
        document.getElementById('HTMLi_controllerKeymapFile').style.visibility = "initial";
    }
}

/**
 * On loading the Controller Keymap file
 *
 * @param {Event} changeEvent - Change HTML event on 'input' element (ctrl keymap file uploader)
 */
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

/**
 * Initialize the reading process of the Controller Keymap file
 *
 * @param {File} file - The file to be read
 */
function icReadKeymapFile(file) {
    var reader = new FileReader();
    // Handle loading errors
    reader.onerror = icFileErrorHandler;
    if (file) {
        // Read file into memory as UTF-8      
        reader.readAsText(file);
        // Launch the data processing as soon as the file has been loaded
        reader.onload = function(event){
            icProcessKeymapData(event.target.result, file.name);
        };
    }
}

/**
 * Build the Controller Keymap table on the incoming raw data from .hcmap file
 *
 * @param {string} data - The text of the Controller keymap file
 * @param {string} name - The filename
 */
function icProcessKeymapData(data, name) {
    let optionValue = document.getElementById('HTMLi_controllerKeymapPresets').length;
    // Split by lines
    let allTextLines = data.split(/\r\n|\n/);
    let lines = {};
    // For every line
    for (let i = 0; i < allTextLines.length; i++) {
        // Split the line by spaces or tabs
        let elements = allTextLines[i].split(/\s\s*/);
        lines[parseInt(elements[0])] = { ft: parseInt(elements[1]), ht: parseInt(elements[2]) };
    }
    // Write the Controller Keymap into a new slot in icCtrlKeymapPreset
    icCtrlKeymapPreset[icDHC.settings.ft.selected][optionValue] = {};
    icCtrlKeymapPreset[icDHC.settings.ft.selected][optionValue].map = lines;
    icCtrlKeymapPreset[icDHC.settings.ft.selected][optionValue].name = name;
    icCtrlKeymapPreset[icDHC.settings.ft.selected][optionValue].notes = "FILE: " + name;
    icCtrlKeymapPreset.current[icDHC.settings.ft.selected] = optionValue;
    // Update the dropdown (and the UI monitors)
    icUpdateKeymapPreset();
}

/**
 * Handle errors in loading the Controller Keymap file
 *
 * @param {Event} errorEvent - The error event
 */
function icFileErrorHandler(errorEvent) {
    switch (errorEvent.target.error.code) {
        case errorEvent.target.error.NOT_FOUND_ERR:
            alert('File Not Found!');
            break;
        case errorEvent.target.error.NOT_READABLE_ERR:
            alert('File is not readable.');
            break;
        case errorEvent.target.error.ABORT_ERR:
            break; // void
        default:
            alert('An error occurred reading this file.');
    }
}