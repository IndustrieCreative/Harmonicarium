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
 * DYNAMIC HARMONICS CALCULATOR
 * This is the heart of the program.
 * All frequency/midi.cent tables are computed here.
 */

"use strict";

/*==============================================================================*
 * MAIN DHC OBJECT
 *==============================================================================*/
// Build the global object
var icDHC = {
    settings: {
        // Global settings
        global: {
            // UI Master decimal precision for frequencies in Hertz
            hz_accuracy: 100,
            // UI Master decimal precision for midi note numbers: 0.01 is precision of 1 cent / 0.0001 is precision of 1 cent of cent
            midicents_accuracy: 100,
            // @TODO: Enharmonic note naming: "sharp", "flat" or "relative"
            enharmonic_nn: "sharp",
            // @REMOVE: Variable for avoid to reinit things that shouldn't reinitiate 
            firstinit: 0,
            // Middle C octave (-1 = from octave -1 >> Middle C = 60)
            // Starting octave
            middle_c: -1
        },
        // Controller Keymap
        controller: {
            pitchbend: {
                // Range value in cents (use hundreds when use MIDI out and the same as the instrument)
                range: 100,
                amount: 0.0
            },
            // @REMOVE: Cannot load a local default file? JSON?
            file: null
        },
        // Fundamental Mother frequency (Hz)
        fm: {
            hz: 130.812782650299,
            midicents: 48,
            init: "midicents"
        },
        // FT scale tuning method
        ft: {
            // Equal Temperament
            nEDx: {
                unit: 2,
                division: 12
            },
            // Harmonics and subharmonics
            h_s: {
                natural: {
                    // Transpose ratio in decimal for Harmonics and Subharmonics
                    // 0.5, 0.25, 0.125, 0.0625... for octaves down – 2, 4, 8, 16... for octaves up – 1 to not transpose
                    h_tr: 1,
                    s_tr: 2
                },
                transposed: {
                    // Transpose ratio in decimal for Harmonics and Subharmonics
                    // 0.5, 0.25, 0.125, 0.0625... for octaves down – 2, 4, 8, 16... for octaves up – 1 to not transpose
                    h_tr: 1,
                    s_tr: 2
                },
                // Set value
                selected: "transposed"
            },
            // @TODO: Tuning file formats
            file: {
                scl: {},
                tun: {},
                mtx: {},
                lmso: {},
                // Set value
                selected: "scl",
                steps: 128
            },
            // Set value
            selected: "nEDx",
            // Step for ft_base table
            // -32 > +32 : default
            // -64 > +64 : FM = 63 or 64 to use the full MIDI note range
            // (63 out of range on -1)
            // (64 out of range on 128)
            steps: 32
        },
        ht: {
            transpose: {
                // Transpose ratio in decimal for Harmonics and Subharmonics
                // 0.5, 0.25, 0.125, 0.0625... for octaves down – 2, 4, 8, 16... for octaves up – 1 to not transpose
                h: 1,
                s: 1
            },
            // The current FT (that generated the last HT table)
            curr_ft: 0,
            // 'last_ht' init value must be null
            last_ht: null
        }
    },
    tables: {
        // PD {ff_base_table}
        ft_base: null,
        // PD {ff_table}
        ft_table: null,
        // PD {hf_table} & {sf_table}
        ht_table: null,
        // PD {ctrl_fn}
        // Default ctrl_map
        ctrl_map: {
            41: { ft: -7, ht: 129 },
            42: { ft: -6, ht: 129 },
            43: { ft: -5, ht: 129 },
            44: { ft: -4, ht: 129 },
            45: { ft: -3, ht: 129 },
            46: { ft: -2, ht: 129 },
            47: { ft: -1, ht: 129 },
            48: { ft: 0, ht: 129 },
            49: { ft: 1, ht: 129 },
            50: { ft: 2, ht: 129 },
            51: { ft: 3, ht: 129 },
            52: { ft: 4, ht: 129 },
            53: { ft: 5, ht: 129 },
            54: { ft: 6, ht: 129 },
            55: { ft: 7, ht: 129 },
            56: { ft: 129, ht: 0 },
            57: { ft: 129, ht: 1 },
            58: { ft: 129, ht: 2 },
            59: { ft: 129, ht: 3 },
            60: { ft: 129, ht: 4 },
            61: { ft: 129, ht: 5 },
            62: { ft: 129, ht: 6 },
            63: { ft: 129, ht: 7 },
            64: { ft: 129, ht: 8 },
            65: { ft: 129, ht: 8 },
            66: { ft: 129, ht: 9 },
            67: { ft: 129, ht: 10 },
            68: { ft: 129, ht: 11 },
            69: { ft: 129, ht: 12 },
            70: { ft: 129, ht: 13 },
            71: { ft: 129, ht: 14 },
            72: { ft: 129, ht: 16 },
            73: { ft: 129, ht: 15 }
        },
        // PD {inst_fn}
        inst_map: null,
        // PD {inst_table}
        inst_table: null,
        // PD {used_keys}
        inst_usedkeys: null,
        // PD {bulk-tuning-dump}
        inst_mtsbank_table: null,
        // Queue for FT key-press tracking
        ftKeyQueue: []
    }
};

/*==============================================================================*
 * CORE INITS
 *==============================================================================*/
// Init start for all the app
window.onload = icInit;

function icInit() {
    // Set defaults value on the UI
    let init = icUIinit ();
    // Create the HStack
    icHSTACKcreate();
    // Initialize the DHC
    icDHCinit();
    // Initialize the synth
    icSYNTHinit();
    icUTILSinit();
}

// Init function for (re)initialize the tables
function icDHCinit() {
    // If the FM 'init' value is 'midicents'
    if (icDHC.settings.fm.init === "midicents") {
        // Init th FM from the MIDI FM value on the UI
        icDHC.settings.fm.hz = icGetFM("midicents");
     // If the FM 'init' value is 'hz'
    } else if (icDHC.settings.fm.init === "hz") {
        // Init th FM from the Hz FM value on the UI
        icDHC.settings.fm.hz = icGetFM("hz");
    }
    // Create FT & HT tables
    let init = icTablesCreate();
}

// (Re)create FT & HT tables in the right order
function icTablesCreate() {
    // Create the FT base table
    icDHC.tables.ft_base = icFTbaseCreate();
    // Create the FT table
    icDHC.tables.ft_table = icFTtableCreate();
    // Create the HT table on the current FT
    icDHC.tables.ht_table = icHTtableCreate(icDHC.tables.ft_table[icDHC.settings.ht.curr_ft].hz);
    // icDHC.tables.ht_table = icHTtableCreate(icDHC.settings.fm.hz);
    // Update the frequency on the internal reference Synth
    icUpdateSynthFTfrequency();
    icUpdateSynthHTfrequency();
    // Update the UI Monitors
    icMONITORSinit();
    return true;
}

// Update the UI with default FT0 (FM), its HStack and the last HT pressed (if present)
function icMONITORSinit() {
    // Compile the FM monitors
    icPrintFundamentalMother(icDHC.settings.fm.hz, icDHC.settings.fm.mc);
    // Compile the FT monitors
    icDHCmonitor(icDHC.settings.ht.curr_ft, icDHC.tables.ft_table[icDHC.settings.ht.curr_ft], "ft");
    // If a HT has been already pressed
    if (icDHC.settings.ht.last_ht) {
        // Compile the HT monitor
        icDHCmonitor(icDHC.settings.ht.last_ht, icDHC.tables.ht_table[icDHC.settings.ht.last_ht], "ht");
    }
    // Compile the HStack (in utils.js)
    icHSTACKfillin();
}

/*==============================================================================*
 * DHC TABLES CREATION
 *==============================================================================*/
// Build the Fundamentals reference base table (-32 > +32) {ff_base_table}
// @REMOVE
function icFTbaseCreate() {
    var tempArray = [];
    // var value = -32;
    var value = icDHC.settings.ft.steps * -1;
    var length = icDHC.settings.ft.steps * 2 + 1;
    for (var id = 0; id < length; id++) {
        tempArray[id] = value++;
    }
    return tempArray;
}

// Build the fundamental frequencies table {ff_table}
// Called on Init and FM update
function icFTtableCreate() {
    let fundamentalsTable = {};
    switch (icDHC.settings.ft.selected) {
        // n-EDx EQUAL TEMPERAMENT
        case "nEDx":
            // @TODO: remove ft_base table and compute all with this FOR cycle
            for (let i = 0; i < icDHC.tables.ft_base.length; i++) {
                let freq = icCompute_nEDx(icDHC.tables.ft_base[i], icDHC.settings.ft.nEDx.unit, icDHC.settings.ft.nEDx.division, icDHC.settings.fm.hz);
                let midicents = icFtoM(freq);
                fundamentalsTable[icDHC.tables.ft_base[i]] = { hz: freq, mc: midicents } ;
            }
            return fundamentalsTable;
        // @TODO: HARMONICS / SUBHARMONICS FT
        case "h_s":
            // icCompute_harmonic(relativeTone, trasposition, masterTuning)
            // icDHC.tables.ft_base
            break;
        // @TODO: TUNING FILES FT
        case "file":
            break;
    }
}

// Build the (Sub)Harmonic tones table {hf_table} & {sf_table}
// fundamental unit is Hz
// icDHC.tables.ht_table
function icHTtableCreate(fundamental) {
    // @TODO: implement custom H/S table lenght (16>32>64>128) to increase performances if needed
    let harmonicsTable = {};
    for (let i = -128; i < 0; i++) {
        let freq = fundamental / -i * icDHC.settings.ht.transpose.s;
        let midicents = icFtoM(freq);
        harmonicsTable[i] = { hz: freq, mc: midicents };
    }
    for (let i = 1; i < 129; i++) {
        let freq = fundamental * i * icDHC.settings.ht.transpose.h;
        let midicents = icFtoM(freq);
        harmonicsTable[i] = { hz: freq, mc: midicents };
    }
    return harmonicsTable;
}

//-----------------------------------------------
// @TODO: BUILD THE INSTRUMENT TABLE {inst_table}
// icDHC.tables.inst_table
// function icINSTtableCreate(fundamental) {
// }

/*==============================================================================*
 * GENERAL DHC COMPUTING TOOLS
 *==============================================================================*/
// From MIDI note number to frequency (Hz)
function icMtoF(midikey) {
    // Use the icCompute_nEDx() function to get frequency
    return icCompute_nEDx(midikey - 69, 2, 12, 440);
}

// From frequency (Hz) to MIDI note number
function icFtoM(freq) {
    // Return the midi.cent rounded to two decimals
    let midicent = 69 + 12 * Math.log2(freq / 440);
    // Return full accuracy midicent
    return midicent;
}

// Calculate the n-EDx ("free" equal temperament) of a relative tone
function icCompute_nEDx(relativeTone, unit, division, masterTuning) {
    let frequency = Math.pow(unit, relativeTone / division) * masterTuning;
    // Return full accuracy frequency
    return frequency;
}

// UI Util to get the note name +/- cents from midi.cents
function icGetNoteNameCents(midicents) {
    let notenumber = Math.trunc(midicents);
    let notecents = midicents - notenumber;
    let centsign = "+";
    if (notecents > 0.5) {
        notenumber = notenumber + 1;
        notecents = 1 - notecents;
        centsign = "–";
    }
    notecents = Math.round(notecents * icDHC.settings.global.midicents_accuracy) / (icDHC.settings.global.midicents_accuracy / 100);
    return [icMidiToHancock(notenumber)[1], notecents, centsign];
}

/*==============================================================================*
 * FM UI tools
 *==============================================================================*/
// Get the Fundamental Mother (FM) in Hz from the UI
function icGetFM(method) {
    var fm = null;
    var freq = null;
    var midicents = null;
    switch (method) {
        case "midicents":
            fm = document.getElementById("HTMLi_fm_mc").value;
            midicents = fm;
            freq = icMtoF(fm);
            // Store the midi.cents value
            icDHC.settings.fm.mc = fm;
            break;
        case "hz":
            fm = document.getElementById("HTMLi_fm_hz").value;
            midicents = icFtoM(fm);
            // Store the midi.cents value
            icDHC.settings.fm.mc = midicents;
            freq = fm;
            break;
    }
    // Change the 'init' for eventual icDHCinit
    icDHC.settings.fm.init = method;
    // Return the frequency on the FM (Hz)
    return freq;
}

// Print the Fundamental Mother (FM) data to the UI (monitor)
function icPrintFundamentalMother(freq, midicents){
    // Prepare the array to pass to the icArrayPitchbender
    let arr = {
        hz: Number(freq),
        mc: Number(midicents)
    };
    // Apply the controller pitchbend (if present) to the array
    let bentArray = icArrayPitchbender(arr);
    // Print the FM infos on the UI
    var notename = icGetNoteNameCents(bentArray.mc);
    midicents = Math.round(bentArray.mc * icDHC.settings.global.midicents_accuracy) / icDHC.settings.global.midicents_accuracy;
    document.getElementById("HTMLo_fm_mc").innerHTML = midicents + " = " + notename[0] + " " + notename[2] + notename[1] + "¢";
    document.getElementById("HTMLo_fm_hz").innerHTML = Math.round(bentArray.hz * icDHC.settings.global.hz_accuracy) / icDHC.settings.global.hz_accuracy;
}

// Set the Fundamental Mother (FM) got from the UI
function icSetFM(freq) {
    // Store the FM to the global variable
    icDHC.settings.fm.hz = freq;
    // Rereate all tables
    icTablesCreate();
}

/*==============================================================================*
 * FT UI tools
 *==============================================================================*/
function icSetNEDX() {
    icDHC.settings.ft.nEDx.unit = document.getElementById("HTMLi_ftNEDX_unit").value;
    icDHC.settings.ft.nEDx.division = document.getElementById("HTMLi_ftNEDX_division").value;
    // Rereate all tables
    icTablesCreate();
}

/*==============================================================================*
 * HT UI tools
 *==============================================================================*/
function icHTtranspose(ratio, type, octave) {
    // If it's an ovtave transpose
    if (octave === true) {
        // Multiply the current transpose ratio by the input ratio
        icDHC.settings.ht.transpose[type] *= ratio;
        // Update the new computed transpose ratio to the UI
        document.getElementById("HTMLi_htTranspose_"+type+"_ratio").value = icDHC.settings.ht.transpose[type];
    } else if (octave === false) {
        // Check if the ratio is > 0
        if (ratio > 0) {
            // Set the new transpose ratio
            icDHC.settings.ht.transpose[type] = ratio;
        // If it's not, restore the last valid ratio
        } else {
            document.getElementById("HTMLi_htTranspose_"+type+"_ratio").value = icDHC.settings.ht.transpose[type];
            // Stop executing the rest of the function
            return;
        }
    }
    // Recreate the HT table on the last FT
    icDHC.tables.ht_table = icHTtableCreate(icDHC.tables.ft_table[icDHC.settings.ht.curr_ft].hz);
    // Update the current HTs osc frequncies on Synth
    let init = icUpdateSynthHTfrequency();
    // Update the UI: Compile the HStack
    icHSTACKfillin();
}

/*==============================================================================*
 * DHC UI INITS
 *==============================================================================*/
function icUIinit() {

    /*  UI DEFAULT SETTINGS
     * ====================*/

    // Default UI FM
    if (icDHC.settings.fm.init === "midicents") {
        // If the FM 'init' value is 'midicents'
        // Set UI midicents FM from icDHC.settings.fm.mc
        document.getElementById("HTMLi_fm_mc").value = icDHC.settings.fm[icDHC.settings.fm.init];
    } else if (icDHC.settings.fm.init === "hz") {
        // If the FM 'init' value is 'hz'
        // Set UI Hz FM from icDHC.settings.fm.hz
        document.getElementById("HTMLi_fm_hz").value = icDHC.settings.fm[icDHC.settings.fm.init];
    } else {
        console.log("The 'icDHC.settings.fm.init' attribute has an unexpected value: " + icDHC.settings.fm.init);
    }
    // Default FT nED-x on UI textboxes
    document.getElementById("HTMLi_ftNEDX_unit").value = icDHC.settings.ft.nEDx.unit;
    document.getElementById("HTMLi_ftNEDX_division").value = icDHC.settings.ft.nEDx.division;
    // Default HT TRANSPOSE on UI textboxes
    document.getElementById("HTMLi_htTranspose_h_ratio").value = icDHC.settings.ht.transpose.h;
    document.getElementById("HTMLi_htTranspose_s_ratio").value = icDHC.settings.ht.transpose.s;
    // Default DHC SETTINGS on UI textboxes
    document.getElementById("HTMLi_dhc_hzAccuracy").value = 1 / icDHC.settings.global.hz_accuracy;
    document.getElementById("HTMLi_dhc_mcAccuracy").value = 1 / icDHC.settings.global.midicents_accuracy * 100;
    document.getElementById("HTMLi_dhc_middleC").value = icDHC.settings.global.middle_c + 5;
    document.getElementById("HTMLi_dhc_pitchbendRange").value = icDHC.settings.controller.pitchbend.range;
    document.getElementById("HTMLi_dhc_piperSteps").value = icPipe.maxLenght;


    /*  UI EVENT LISTENERS
     * ====================*/

    //------------------------
    // UI GENERAL DHC settings
    //------------------------
    // Set the UI HZ DECIMAL PRECISION from UI HTML inputs
    document.getElementById("HTMLi_dhc_hzAccuracy").addEventListener("input", function(event) {
        // Store the Hz accuracy in the global slot
        // Invert the number to get the multiplier factor and round it to avoid JS "0.999999..." shit
        icDHC.settings.global.hz_accuracy = Math.round(1/event.target.value);
        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
        icDHCinit();
    });
    // Set the UI MIDI.CENTS DECIMAL PRECISION from UI HTML inputs
    document.getElementById("HTMLi_dhc_mcAccuracy").addEventListener("input", function(event) {
        icDHC.settings.global.midicents_accuracy = Math.round(1/event.target.value) * 100;
        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
        icDHCinit();
    });
    // Set the MIDDLE C OCTAVE from UI HTML inputs
    document.getElementById("HTMLi_dhc_middleC").addEventListener("input", function(event) {
        // Beginning octave = Middle C octave -5   (-1 = C4)
        icDHC.settings.global.middle_c = event.target.value - 5;
        // Reinitialize the DHC to apply also to the Monitors on the FM MIDI/Hz UI Input
        icDHCinit();
    });
    // Set the CONTROLLER PITCHBEND RANGE from UI HTML inputs
    document.getElementById("HTMLi_dhc_pitchbendRange").addEventListener("input", function(event) {
        icDHC.settings.controller.pitchbend.range = event.target.value;
    });
    // Set the PIPER HT0 FEATURE from UI HTML inputs
    document.getElementById("HTMLi_dhc_piperSteps").addEventListener("input", function(event) {
        icPipe.maxLenght = event.target.value;
    });

    //-------------------
    // UI FM DHC settings
    //-------------------
    // Set the Fundamental Mother (FM) from UI HTML inputs
    document.getElementById("HTMLi_fm_mc").addEventListener("change", function() {
        icSetFM(icGetFM("midicents"));
        document.getElementById("HTMLi_fm_hz").value = "";
    });
    document.getElementById("HTMLi_fm_hz").addEventListener("change", function() {
        icSetFM(icGetFM("hz"));
        document.getElementById("HTMLi_fm_mc").value = "";
    });

    //-------------------
    // UI FT DHC settings
    //-------------------
    // Get and set the Fundamental Tones (FT) UI HTML inputs
    document.getElementById("HTMLi_ftNEDX_unit").addEventListener("change", icSetNEDX);
    document.getElementById("HTMLi_ftNEDX_division").addEventListener("change", icSetNEDX);
    document.getElementById("HTMLi_ftNEDX_ok").addEventListener("click", icSetNEDX);

    //-------------------
    // UI HT DHC settings
    //-------------------
    // Get and set the Harmonic Tones (FT) UI HTML inputs
    // Harmonic Tones transposition
    // + Octave
    document.getElementById("HTMLi_htTranspose_h_plus").addEventListener("click", function() {
        icHTtranspose(2, "h", true);
    });
    // – Octave
    document.getElementById("HTMLi_htTranspose_h_minus").addEventListener("click", function() {
        icHTtranspose(0.5, "h", true);
    });
    // Free ratio
    document.getElementById("HTMLi_htTranspose_h_ratio").addEventListener("change", function(event) {
        icHTtranspose(event.target.value, "h", false);
    });

    // Get and set the Harmonic Tones (FT) UI HTML inputs
    // Subharmonic Tones transposition
    // + Octave
    document.getElementById("HTMLi_htTranspose_s_plus").addEventListener("click", function() {
        icHTtranspose(2, "s", true);
    });
    // – Octave
    document.getElementById("HTMLi_htTranspose_s_minus").addEventListener("click", function() {
        icHTtranspose(0.5, "s", true);
    });
    // Free ratio
    document.getElementById("HTMLi_htTranspose_s_ratio").addEventListener("change", function(event) {
        icHTtranspose(event.target.value, "s", false);
    });
}
