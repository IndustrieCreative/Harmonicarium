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
 * USER INTERFACE UTILITIES 
 * Provide some useful functions to the UI interaction
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


function icUTILSinit() {
    // Get the button that opens the modal controller keymap table
    document.getElementById("HTMLf_controllerKeymapTableShow").addEventListener("click", icCtrlMap2HTML);
    
    // Menu Help & Credits listeners
    document.getElementById("HTMLf_help").addEventListener("click", function() { icHelp("help"); } );
    document.getElementById("HTMLf_credits").addEventListener("click", function() { icHelp("credits"); } );
    
    // Init H Stack fontsize zoom
    let hstack_zoom = document.getElementById("HTMLf_hstack_zoom");
    let hstack_fontsize = document.getElementById("HTMLo_hstack_fontsize");
    // Init Hstack zoom with defaul value
    hstack_zoom.value = 22;
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
// Open the Help/Credits panel from the right side
// Toggle help/credits depending on the command pressed on the menu
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
// Get the HTML Log element and store it to global
var icEventLogText = document.getElementById("HTMLo_logText");
// Log passed infos into the HTML Log element
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

// EVENTS LOG
// Open the Event Log panel from the bottom and toggle the open/close button
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
// Create an HTML table from the controller keymap and write it to the UI under a modal element
function icCtrlMap2HTML() {
    var txt = "";
    var map = icDHC.tables.ctrl_map;
    txt += '<table class="dataTable"><tr><th>MIDI #</th><th>FT</th><th>HT</th></tr>';
    for (let key in map) {
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
//MONITOR UI
function icDHCmonitor(tone, arr, type) {
    // Apply the controller pitchbend (if present) to the array 
    arr = icArrayPitchbender(arr);
    let notename = icGetNoteNameCents(arr.mc);
    if (type === "ft") {
        // Update the log on MONITOR FT info on the UI
        document.getElementById("HTMLo_toneMonitorFT_tone").innerHTML = tone;
        document.getElementById("HTMLo_toneMonitorFT_midicents").innerHTML = Math.round(arr.mc * icDHC.settings.global.midicents_accuracy) / icDHC.settings.global.midicents_accuracy;
        document.getElementById("HTMLo_toneMonitorFT_notename").innerHTML = notename[0] + " " + notename[2] + notename[1] + "¢";
        document.getElementById("HTMLo_toneMonitorFT_frequency").innerHTML = Math.round(arr.hz * icDHC.settings.global.hz_accuracy) / icDHC.settings.global.hz_accuracy;

        // Update the log on HSTACK FT info on the UI
        document.getElementById("HTMLo_hstackFT_tone").innerHTML = tone;
        document.getElementById("HTMLo_hstackFT_note").innerHTML = notename[0];
        document.getElementById("HTMLo_hstackFT_cents").innerHTML = notename[2] + notename[1] + "¢";
        document.getElementById("HTMLo_hstackFT_hz").innerHTML = Math.round(arr.hz * icDHC.settings.global.hz_accuracy) / icDHC.settings.global.hz_accuracy;
    } else if (type === "ht") {
        // Update the log on MONITOR HT info on the UI
        document.getElementById("HTMLo_toneMonitorHT_tone").innerHTML = tone;
        document.getElementById("HTMLo_toneMonitorHT_midicents").innerHTML = Math.round(arr.mc * icDHC.settings.global.midicents_accuracy) / icDHC.settings.global.midicents_accuracy;
        document.getElementById("HTMLo_toneMonitorHT_notename").innerHTML = notename[0] + " " + notename[2] + notename[1] + "¢";
        document.getElementById("HTMLo_toneMonitorHT_frequency").innerHTML = Math.round(arr.hz * icDHC.settings.global.hz_accuracy) / icDHC.settings.global.hz_accuracy;
    }
}

// MIDI INPUT MONITOR
function icMIDImonitor(number, velocity, channel, srcElement) {
    // Update the log on MIDI MONITOR on the UI
    document.getElementById("HTMLo_midiMonitor_port").innerHTML = srcElement.name;
    document.getElementById("HTMLo_midiMonitor_note").innerHTML = number;
    document.getElementById("HTMLo_midiMonitor_velocity").innerHTML = velocity;
    document.getElementById("HTMLo_midiMonitor_channel").innerHTML = channel + 1;
}

/*==============================================================================*
 * UI H STACK
 *==============================================================================*/
// Global var useful to icHSTACKfillin
var icUsedHT = [];
// HSTACK TABLE CREATE
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
    for (let key in icDHC.tables.ctrl_map) {
        let ht = icDHC.tables.ctrl_map[key].ht;
        if (ht !== 129 && ht !== 0) {
            usedHT.push(ht);
        }
    }
    usedHT.sort(icSortNumericArray);
    // Store in the global var the uniquifized version of the array useful to icHSTACKfillin
    icUsedHT = icUniqArray(usedHT);
    for (let ht in icUsedHT) {
        let htn = icUsedHT[ht];
        hstackHTML += '<tr id="HTMLo_hstackHTrow_h'+htn+'">';
        hstackHTML += '<td class="hstackHT_h" id="HTMLo_hstackHT_h'+htn+'">'+htn+'</td>';
        hstackHTML += '<td class="hstackHT_note" id="HTMLo_hstackHT_note'+htn+'"></td>';
        hstackHTML += '<td class="hstackHT_cents" id="HTMLo_hstackHT_cents'+htn+'"></td>';
        hstackHTML += '<td class="hstackHT_hz" id="HTMLo_hstackHT_hz'+htn+'"></td></tr>';
    }
    hstackHTML += "</table>";

    document.getElementById("HTMLo_hstackHT").innerHTML = hstackHTML;

}
function icSortNumericArray(a,b) {
    return b - a;
}
function icUniqArray(arrArg) {
    return arrArg.filter(function(elem, pos,arr) {
        return arr.indexOf(elem) == pos;
    });
}

// HSTACK TABLE FILL-IN
function icHSTACKfillin() {
    // Empty object to store the HTn data
    var htArr = {};
    // For every HT used in the Controller Keymap (icDHC.tables.ctrl_map)
    for (let ht in icUsedHT) {
        // Get the HT number
        var htn = icUsedHT[ht];
        // If it's not 0
        if (htn !== 0) {
            // Read 'mc' and 'hz' data of the HTn from 'ht_table'
            htArr = icDHC.tables.ht_table[htn];
            // Apply the controller pitchbend (if present) to the array 
            htArr = icArrayPitchbender(htArr);
            // Get the array containing the standard note name info and +/- cents
            let notename = icGetNoteNameCents(htArr.mc);
            // Print the infos to the UI HStack
            document.getElementById("HTMLo_hstackHT_h"+htn).innerHTML = htn;
            document.getElementById("HTMLo_hstackHT_note"+htn).innerHTML = notename[0];
            document.getElementById("HTMLo_hstackHT_cents"+htn).innerHTML = notename[2] + notename[1] + "¢";
            document.getElementById("HTMLo_hstackHT_hz"+htn).innerHTML = Math.round(htArr.hz * icDHC.settings.global.hz_accuracy) / icDHC.settings.global.hz_accuracy;
        }
    }
}

// Apply the controller pitchbend (if present) to the incoming array
function icArrayPitchbender(arr) {
    // Compute the Controller Pitchbend amount in cents
    let pitchbend = icDHC.settings.controller.pitchbend.amount * icDHC.settings.controller.pitchbend.range;
    // Apply the controller pitchbend if present
    let bentArr = {
        hz: Math.pow(2, pitchbend / 1200) * arr.hz,
        mc: (arr.mc + pitchbend / 100)
    };
    return bentArr;
}

// HSTACK NOTE ON/OFF MONITOR
function icHSTACKmonitor(ht, state) {
    if (ht !== 0) {
        if (state === 1) {
            document.getElementById("HTMLo_hstackHTrow_h"+ht).style.backgroundColor = "rgb(255, 249, 164)";
            document.getElementById("HTMLo_hstackHTrow_h"+ht).style.color = "#2A2838";
            document.getElementById("HTMLo_hstackHTrow_h"+ht).style.fontWeight = "bold";
        } else if (state === 0) {
            document.getElementById("HTMLo_hstackHTrow_h"+ht).style.backgroundColor = "#383749";
            document.getElementById("HTMLo_hstackHTrow_h"+ht).style.color = "#DDD";
            document.getElementById("HTMLo_hstackHTrow_h"+ht).style.fontWeight = "normal";
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

// Button for test purposes
function icTESTER() {
    // icEventLog(JSON.stringify(icDHC.tables.ft_table, null, 2).replace(/}|{|"|,/g, ''));
    icEventLog("TEST: Full tables printed out. Look at the console of your browser.");
    console.log("ctrl_map:", icDHC.tables.ctrl_map);
    console.log("ft_base:", icDHC.tables.ft_base);
    console.log("ft_table:", icDHC.tables.ft_table);
    console.log("ht_table:", icDHC.tables.ht_table);
}