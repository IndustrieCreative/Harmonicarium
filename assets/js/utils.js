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
 * @fileoverview USER INTERFACE UTILITIES<br>
 *     Provide some useful functions to the UI interaction
 */

/* exported icEventLog */
/* exported icDHCmonitor */
/* exported icMIDImonitor */
/* exported icHSTACKfillin */
/* exported icHSTACKmonitor */
/* exported icToggleOpenLogBtn */
/* exported icTESTER */
/* exported icHSTACKcreate */
/* exported icUTILSinit */

"use strict";

/**
 * Initialize the UI Utilities
 */
function icUTILSinit() {
    // Get the button that opens the modal controller keymap table
    document.getElementById("HTMLf_controllerKeymapTableShow").addEventListener("click", icCtrlKeymap2HTML);
    
    // Menu Help & Credits listeners
    document.getElementById("HTMLf_help").addEventListener("click", function() { icHelp("help"); } );
    document.getElementById("HTMLf_credits").addEventListener("click", function() { icHelp("credits"); } );
    
    // Init H Stack font-size zoom
    let hstack_zoom = document.getElementById("HTMLf_hstack_zoom");
    let hstack_fontsize = document.getElementById("HTMLo_hstack_fontsize");
    // Init H Stack zoom with default value
    hstack_zoom.value = 20;
    hstack_fontsize.style.fontSize = hstack_zoom.value + "px";
    hstack_zoom.setAttribute("data-tooltip", hstack_zoom.value + "px" );
    // Add an EventListener to the zoom slider
    hstack_zoom.addEventListener("input", function(event) {
        hstack_fontsize.style.fontSize = event.target.value + "px";
        hstack_zoom.setAttribute("data-tooltip", event.target.value + "px");
    });
}

/*==============================================================================*
 * UI HELP/CREDITS
 *==============================================================================*/

/**
 * Open the Help/Credits panel from the right side.
 * Toggle help/credits depending on the command pressed on the menu.
 *
 * @param {('credits'|'help')} type - If it must open the 'credits' or 'help' panel
 */
function icHelp(type) {
    let element = document.getElementById("HTMLf_helpPanel");
    let help = document.getElementById("HTML_helpObj");
    let credits = document.getElementById("HTML_creditsObj");
    if (type === "help") {
        help.setAttribute("style", "display: inline;");
        credits.setAttribute("style", "display: none;");
    } else if (type === "credits") {
        help.setAttribute("style", "display: none;");
        credits.setAttribute("style", "display: inline;");
    }
    if (element.classList.contains("panelShown")) {
        // Closed %
       element.style.width = "0%";
    } else {
        // Open %
        element.style.width = "50%";  
    }
    element.classList.toggle("panelShown");
}

/*==============================================================================*
 * UI EVENTS LOG
 *==============================================================================*/

/**
 *  The HTML Log element
 *
 * @type {Object}
 */
var icEventLogText = document.getElementById("HTMLo_logText");
icEventLogText.innerHTML = "<p>>>>>>>>> > Welcome to the Harmonicarium!</p><p>...</p><p>..</p><p>.</p>";

/**
 * Log into the HTML Log element the infos passed via the argument
 *
 * @param {string} str - Text string describing the event to log
 */
function icEventLog(str) {
    let time = new Date();
    let s = time.getSeconds();
    let m = time.getMinutes();
    let h = time.getHours();
    if (h < 10) {h = "0" + h;}
    if (m < 10) {m = "0" + m;}
    if (s < 10) {s = "0" + s;}
    icEventLogText.innerHTML = "<p>" + h + ":" + m + ":" + s + " > " + str + "</p>" + icEventLogText.innerHTML;
    icEventLogText.scrollTop = icEventLogText.scrollHeight;
}

/**
 * Open the Event Log panel from the bottom and toggle the open/close button
 *
 * @param {Object} element - HTML element of the Event Log open/close button
 */
function icToggleOpenLogBtn(element) {
    if (element.classList.contains("panelShown")) {
        // Closed %
        document.getElementById("HTMLf_logPanel").style.height = "0%";
    } else {
        // Open %
        document.getElementById("HTMLf_logPanel").style.height = "35%";  
    }
    element.classList.toggle("panelShown");
}

/*==============================================================================*
 * UI CONTROLLER KEYMAP TABLE
 *==============================================================================*/

/**
 * Create an HTML table from the controller keymap and write it to the UI under a modal element
 */
function icCtrlKeymap2HTML() {
    var txt = "";
    var map = icDHC.tables.ctrl_map;
    txt += '<table class="dataTable"><tr><th>MIDI #</th><th>FT</th><th>HT</th></tr>';
    for (let key of Object.keys(map)) {
        let ft, ht = "";
        if (map[key].ft === 129) {
            ft = "N/A";
        } else {
            ft = map[key].ft;
        }
        if (map[key].ht === 129) {
            ht = "N/A";
        } else {
            ht = map[key].ht;
        }
        txt += "<tr><td>" + key + "</td><td>" + ft + "</td><td>" + ht + "</td></tr>";
    }
    txt += "<tr><th>MIDI #</th><th>FT</th><th>HT</th></tr></table>";
    document.getElementById("HTMLo_controllerKeymapTable").innerHTML = txt;

    // Get the modal element
    var modal = document.getElementById('HTMLf_controllerKeymapModal');
    // Get the <span> element that closes the modal element
    var span = document.getElementsByClassName("modalOverlay_close")[0];
    // When the user clicks the button, open the modal element
    modal.style.display = "block";
    // When the user clicks on <span> (x), close the modal element
    span.onclick = function() {
        modal.style.display = "none";
    };
    // When the user clicks anywhere outside of the modal element, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

/*==============================================================================*
 * UI TONE MONITORS
 *==============================================================================*/

/**
 * Monitor UI
 *
 * @param  {number}      xt    - FT or HT relative tone number
 * @param  {Xtone}       xtObj - FT or HT object of the tone
 * @param  {('ft'|'ht')} type  - If the tone is a FT or HT
 */
function icDHCmonitor(xt, xtObj, type) {
    // Apply the controller pitchbend (if present) to the array 
    xtObj = icArrayPitchbender(xtObj);
    let notename = icGetNoteNameCents(xtObj.mc);
    let hzAccuracy = icDHC.settings.global.hz_accuracy;
    let mcAccuracy = icDHC.settings.global.cent_accuracy;
    if (type === "ft") {
        // Update the log on MONITOR FT info on the UI
        document.getElementById("HTMLo_toneMonitorFT_tone").innerHTML = xt;
        document.getElementById("HTMLo_toneMonitorFT_midicents").innerHTML = xtObj.mc.toFixed(mcAccuracy + 2);
        document.getElementById("HTMLo_toneMonitorFT_notename").innerHTML = notename[0] + " " + notename[2] + notename[1] + "&cent;";
        document.getElementById("HTMLo_toneMonitorFT_frequency").innerHTML = xtObj.hz.toFixed(hzAccuracy);
        // Update the log on HSTACK FT info on the UI
        document.getElementById("HTMLo_hstackFT_tone").innerHTML = xt;
        document.getElementById("HTMLo_hstackFT_note").innerHTML = notename[0];
        document.getElementById("HTMLo_hstackFT_cents").innerHTML = notename[2] + notename[1];
        document.getElementById("HTMLo_hstackFT_hz").innerHTML = xtObj.hz.toFixed(hzAccuracy);
    } else if (type === "ht") {
        // Update the log on MONITOR HT info on the UI
        document.getElementById("HTMLo_toneMonitorHT_tone").innerHTML = xt;
        document.getElementById("HTMLo_toneMonitorHT_midicents").innerHTML = xtObj.mc.toFixed(mcAccuracy + 2);
        document.getElementById("HTMLo_toneMonitorHT_notename").innerHTML = notename[0] + " " + notename[2] + notename[1] + "&cent;";
        document.getElementById("HTMLo_toneMonitorHT_frequency").innerHTML = xtObj.hz.toFixed(hzAccuracy);
    }
}

/**
 * MIDI-IN MONITOR
 *
 * @param  {string} noteNumber     - MIDI Note number (or conversion string if the Tone snapping receiving mode is active)
 * @param  {number} velocity       - MIDI Velocity amount
 * @param  {number} channel        - MIDI Channel number
 * @param  {string} portName       - MIDI Port name
 */
function icMIDImonitor(noteNumber, velocity, channel, portName) {

    // Update the log on MIDI MONITOR on the UI
    for (var x = 0; x < 2; x++) {
        document.getElementById("HTMLo_midiMonitor"+x+"_note").innerHTML = noteNumber;
        document.getElementById("HTMLo_midiMonitor"+x+"_velocity").innerHTML = velocity;
        document.getElementById("HTMLo_midiMonitor"+x+"_channel").innerHTML = channel + 1;
        document.getElementById("HTMLo_midiMonitor"+x+"_port").innerHTML = portName;
    }
}

/**
 * UI Util to get the note name +/- cents from midi.cents
 *
 * @param  {number} midicents - Pitch in midi.cents
 *
 * @return {Array.<string, number, string>} - Array containing [note name, cents, +/- sign]
 */
function icGetNoteNameCents(midicents) {
    let notenumber = Math.trunc(midicents);
    let notecents = midicents - notenumber;
    let centsign = "&plus;";
    if (notecents > 0.5) {
        notenumber = notenumber + 1;
        notecents = 1 - notecents;
        centsign = "&minus;";
    }
    notecents = (notecents.toFixed(icDHC.settings.global.cent_accuracy + 2) * 100).toFixed(icDHC.settings.global.cent_accuracy); 
    return [icMidiToHancock(notenumber)[1], notecents, centsign];
}

/*==============================================================================*
 * UI H STACK
 *==============================================================================*/
/**
 * Global var useful to 'icHSTACKfillin'
 *
 * @type {Array.<number>}
 */
var icUsedHT = [];

/**
 * H Stack table create
 */
function icHSTACKcreate() {
    let usedHT = [];
    let hstackHTML = `<table class="dataTable">
                        <tr>
                            <th colspan="4">Harmonics</th>
                        </tr>
                        <tr class="hstackHeader">
                            <th width="13%" class="hstackHT_h">HT</th>
                            <th width="15%" class="hstackHT_note">note</th>
                            <th width="30%" class="hstackHT_cents">cents</th>
                            <th width="42%" class="hstackHT_hz">Hz</th>
                        </tr>`;
    for (let key of Object.keys(icDHC.tables.ctrl_map)) {
        let ht = icDHC.tables.ctrl_map[key].ht;
        if (ht !== 129 && ht !== 0) {
            usedHT.push(ht);
        }
    }
    // Sort the array from max to min
    usedHT.sort( (a, b) => { return b - a; } );
    // Store in the global var the uniquified version of the array useful to icHSTACKfillin
    icUsedHT = icUniqArray(usedHT);
    for (let htn of icUsedHT) {
        hstackHTML += '<tr id="HTMLf_hstackHTrow_h'+htn+'" class="HToff">';
        hstackHTML += '<td class="hstackHT_h" id="HTMLo_hstackHT_h'+htn+'">'+htn+'</td>';
        hstackHTML += '<td class="hstackHT_note" id="HTMLo_hstackHT_note'+htn+'"></td>';
        hstackHTML += '<td class="hstackHT_cents" id="HTMLo_hstackHT_cents'+htn+'"></td>';
        hstackHTML += '<td class="hstackHT_hz" id="HTMLo_hstackHT_hz'+htn+'"></td></tr>';
    }
    hstackHTML += "</table>";

    document.getElementById("HTMLo_hstackHT").innerHTML = hstackHTML;

}

/**
 * Remove duplicated values on the array passed via the argument
 *
 * @param  {Array.<number>} arrArg - Array of HT numbers
 *
 * @return {Array.<number>}        - Uniquified array
 */
function icUniqArray(arrArg) {
      return arrArg.filter(function(elem, pos, arr) {
        return arr.indexOf(elem) == pos;
    });
}

/**
 * H Stack table fill-in
 */
function icHSTACKfillin() {
    // Empty object to store the HTn data
    var htObj = {};
    // For every HT used in the Controller Keymap (icDHC.tables.ctrl_map)
    for (let htn of icUsedHT) {
        // If it's not 0
        if (htn !== 0) {
            // Read 'mc' and 'hz' data of the HTn from 'ht_table'
            htObj = icDHC.tables.ht_table[htn];
            // Apply the controller pitchbend (if present) to the array 
            htObj = icArrayPitchbender(htObj);
            // Get the array containing the standard note name info and +/- cents
            let notename = icGetNoteNameCents(htObj.mc);
            // Print the infos to the UI HStack
            document.getElementById("HTMLo_hstackHT_h"+htn).innerHTML = htn;
            document.getElementById("HTMLo_hstackHT_note"+htn).innerHTML = notename[0];
            document.getElementById("HTMLo_hstackHT_cents"+htn).innerHTML = notename[2] + notename[1];
            document.getElementById("HTMLo_hstackHT_hz"+htn).innerHTML = htObj.hz.toFixed(icDHC.settings.global.hz_accuracy);
        }
    }
}

/**
 * Apply the controller pitchbend (if present) to the incoming object
 *
 * @param  {Xtone} xtObj - FT or HT object of the tone to bend
 *
 * @return {Object}      - The bent object
 */
function icArrayPitchbender(xtObj) {
    // Compute the Controller Pitchbend amount in cents
    let pitchbend = icDHC.settings.controller.pb.amount * icDHC.settings.controller.pb.range;
    // Apply the controller pitchbend if present
    let bentObj = {
        hz: Math.pow(2, pitchbend / 1200) * xtObj.hz,
        mc: (xtObj.mc + pitchbend / 100)
    };
    return bentObj;
}

/**
 * H Stack note on/off Monitor
 *
 * @param {('ft'|'ht')} type  - If the note to turn ON/OFF is a FT or HT
 * @param {0|1}         state - Note ON/OFF; 0 is OFF, 1 is ON 
 * @param {number=}     ht    - HT number (required if type=='ht')
 */
function icHSTACKmonitor(type, state, ht) {
    if (type === "ht") {
        // If is a normal HT (it's not HT0)
        if (ht !== 0) {
            // Note ON
            if (state === 1) {
                document.getElementById("HTMLf_hstackHTrow_h"+ht).classList.add("HTon");
                document.getElementById("HTMLf_hstackHTrow_h"+ht).classList.remove("HToff");
            // Note OFF
            } else if (state === 0) {
                document.getElementById("HTMLf_hstackHTrow_h"+ht).classList.add("HToff");
                document.getElementById("HTMLf_hstackHTrow_h"+ht).classList.remove("HTon");
            }
        }
    } else if (type === "ft") {
        // Note ON
        if (state === 1) {
            // Recreate the element to force the css animation
            let old = document.getElementById("HTMLf_hstackFTrow");
            let parent = old.parentNode;
            let clone = old.cloneNode(true);
            parent.insertBefore(clone, old);
            old.remove();
            document.getElementById("HTMLf_hstackFTrow").classList.add("FTon");
            document.getElementById("HTMLf_hstackFTrow").classList.remove("FToff");
        // Note OFF
        } else if (state === 0) {
            document.getElementById("HTMLf_hstackFTrow").classList.add("FToff");
            document.getElementById("HTMLf_hstackFTrow").classList.remove("FTon");
        }
    }
}

/*==============================================================================*
 * TEST/DEBUG SECTION
 *==============================================================================*/

// Log PC keyboard keypress events
// Useful to avoid unwanted user inputs...
// document.addEventListener('keydown', function(event) {
//     console.log(event.keyCode)
// });

/**
 * Button for test/debug purposes
 */
function icTESTER() {
    // icEventLog(JSON.stringify(icDHC.tables.ft_table, null, 2).replace(/}|{|"|,/g, ''));
    icEventLog("TEST: Full tables printed out. Look at the console of your browser.");
    console.log("ctrl_map:", icDHC.tables.ctrl_map);
    console.log("ft_table:", icDHC.tables.ft_table);
    console.log("ht_table:", icDHC.tables.ht_table);
}