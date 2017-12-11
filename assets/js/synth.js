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
 * Parts of code in this file was taken or inspired by Chris Wilson's Monosynth & MIDI Synth
 * https://github.com/cwilso/midi-synth
 * https://github.com/cwilso/monosynth
 */

/** 
 * REFERENCE INTERNAL SYNTHESIZER
 * Provide a simple basic synth useful as reference sound.
 */

/* exported icSYNTHinit */
/* exported icVoiceON */
/* exported icVoiceOFF */
/* exported icUpdateSynthFTfrequency */
/* exported icUpdateSynthHTfrequency */
/* exported icPitchBend */

"use strict";

/*==============================================================================*
 * MAIN SYNTH OBJECT and INIT
 *==============================================================================*/
// Initialize the Web Audio "context" object
var icAudioContext = null;

var icSYNTH = {
    // Main Power ON/OFF status
    status: false,
    // Slots for ICvoice objects
    voice: {
        ft: null,
        ht: []
    },
    // Slots for the Gain nodes
    volume: {
        // Final gain out node
        master: null,
        // FT+HT mixer gain 
        mix: null,
        // FT gain
        ft: null,
        // HT gain
        ht: null
    },
    waveform: {
        ft: "sine",
        ht: "sine"
    },
    // ADSR envelope (init) values
    envelope: {
        // time (sec)
        attack: 0.3,
        // time (timeconstant)
        decay: 0.15,
        // gain value amount (0 > 1)
        sustain: 0.68,
        // time (sec)
        release: 0.3
    },
    // Potemanto/Glide for monophonic FT and osc frequency updates
    portamento: {
        amount: 0.03,
        lastFreqFT: null
    },
    reverb: {
        // Slot for convolver node
        convolver: null,
        // Reverbered gain bus/carrier node
        wet: null,
        // Dry gain bus/carrier node
        dry: null,
        // Referb wey/dry mixing amount (for crossfade)
        amount: null
    },
    // Slot for the compressor node
    compressor: null
};

// @TODO: merge icVoices into icSYNTH (?)
var icVoices = {
    ft: null,
    ftKeyQueue: [],  // the stack of actively-pressed keys
    ht: {}
};

//@TODO: finish the visualiser
// Init the analyser element
// var icAnalyser = null;

// INIT THE AUDIO CONTEXT AND SYNTH OUTS
function icSYNTHinit() {
    // Patch up the AudioContext prefixes
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    try {
        icAudioContext = new AudioContext();
    }
    catch(error) {
        alert('The Web Audio API is apparently not supported in this browser.');
    }
    // If the convolver is not supported by the browser, create a normal gain node
    try {
        icSYNTH.reverb.convolver = icAudioContext.createConvolver();
    }
    catch(error) {
        icSYNTH.reverb.convolver = icAudioContext.createGain();
        alert('The reverb is not supported in this browser.');
    }
    // Prepare the MASTER, MIX FT and HT gain out nodes
    icSYNTH.volume.master = icAudioContext.createGain();
    icSYNTH.volume.mix = icAudioContext.createGain();
    icSYNTH.volume.ft = icAudioContext.createGain();
    icSYNTH.volume.ht = icAudioContext.createGain();
    // Prepare the REVERB wet/dry gain nodes
    icSYNTH.reverb.wet = icAudioContext.createGain();
    icSYNTH.reverb.dry = icAudioContext.createGain();
    // Prepare the FINAL COMPRESSOR node
    icSYNTH.compressor = icAudioContext.createDynamicsCompressor();
    
    //@TODO: finish the visualiser
    // Create the VISUALISER
    // icAnalyser = icAudioContext.createAnalyser();
    // icAnalyser.minDecibels = -90;
    // icAnalyser.maxDecibels = -10;
    // icAnalyser.smoothingTimeConstant = 0.85;
    // icVisualize();

    // Conect the FT and HT gains to the MIX
    icSYNTH.volume.ft.connect(icSYNTH.volume.mix);
    icSYNTH.volume.ht.connect(icSYNTH.volume.mix);
    // Connect the MIX to the COMPRESSOR
    icSYNTH.volume.mix.connect(icSYNTH.compressor);
    // Connect the COMPRESSOR to the REVERB and to DRY CARRIER
    icSYNTH.compressor.connect(icSYNTH.reverb.convolver);
    icSYNTH.compressor.connect(icSYNTH.reverb.dry);
    // Connect the REVERB to the WET CARRIER
    icSYNTH.reverb.convolver.connect(icSYNTH.reverb.wet);
    // Connect the WET/DRY CARRIERS to the MASTER
    icSYNTH.reverb.wet.connect(icSYNTH.volume.master);
    icSYNTH.reverb.dry.connect(icSYNTH.volume.master);
    // Connect the MASTER to the final OUT
    icSYNTH.volume.master.connect(icAudioContext.destination);
    //@TODO: finish the visualiser
    // icSYNTH.volume.master.connect(icAnalyser);
    // icAnalyser.connect(icAudioContext.destination);

    // Load the Base64-coded default IR Reverb
    icReadIrFile(icBase64ToBlob(icDefaultReverb));
    //@TODO: Implement XMLHttpRequest() to get IR reverbs from URLs on the net
    //@TODO: https://codepen.io/andremichelle/pen/NPPEPY
    // Init the Synth UI
    icSynthUIinit();
    // Create the WEB AUDIO PEAK METERS (/assets/js/lib/web-audio-peak-meter.min.js)
    var myMeterElement = document.getElementById('HTMLo_synth_meter');
    var meterNode = webAudioPeakMeter.createMeterNode(icSYNTH.volume.master, icAudioContext);
    webAudioPeakMeter.createMeter(myMeterElement, meterNode, {backgroundColor: '#363342', dbTickSize: 4, borderSize: 5, fontSize: 10, maskTransition: '0.1s'});
}

/*==============================================================================*
 * SYNTH VOICES 
 *==============================================================================*/
//---------------------------------
// ICvoice constructor –– START
//- - - - - - - - - - - - - - - - -
function ICvoice(freq, velocity, type) {
    // Store the initial frequency (Hz)
    this.initFrequency = freq;
    // Create the oscillator
    this.osc = icAudioContext.createOscillator();
    // Init the starting frequency to emulate the right portamento
    // for the monophonic FT and all frequency update for all voices (FT & HT)
    if (type === "ft" && icSYNTH.portamento.lastFreqFT) {
        // If it's an FT and it's not the first played tone:
        // Init the oscillator's start frequency to the last voiced FT
        this.osc.frequency.setValueAtTime(icSYNTH.portamento.lastFreqFT, 0);
    } else if (type === "ft" && !icSYNTH.portamento.lastFreqFT) {
        // If it's an FT and it's the first played tone:
        // Init the oscillator's start frequency to the FM (FT0)
        this.osc.frequency.setValueAtTime(icDHC.settings.fm.hz, 0);
    } // If it's an HT, the frequency is set in "this.setFrequency"
    // Set the oscillator's waveform
    this.osc.type = icSYNTH.waveform[type];
    // Create a gain/volume for the Envelope Generator
    this.envelope = icAudioContext.createGain();
    // Create a gain/volume to implement the velocity
    this.volume = icAudioContext.createGain();
    // Sensitivity scale for velocity
    this.volume.gain.setValueAtTime((velocity / 127), 0);
    // The final voice volume is connected to the main FT or HT volume
    this.volume.connect( icSYNTH.volume[type] );
    // The envelope is connected to the volume
    this.envelope.connect( this.volume );
    // The oscillator is connected to the envelope
    this.osc.connect( this.envelope );

    // Set envelope parameters ADS (to avoid oscillator's start/stop clicks)
    // Initialize the envelope with 0 value
    // [Deprecation] .value setter smoothing is deprecated and will be removed in M64, around Jan 2018
    // [Deprecation] .setValueAtTime only does clicks (why?) I leave .value untill clicks are fixed
    this.envelope.gain.value = 0.0; // Repeated ?!
    this.envelope.gain.setValueAtTime(0, icAudioContext.currentTime); // Repeated ?!

    // Call the method to tune the oscillator
    this.setFrequency("new", type);
    // Start the oscillator
    this.osc.start(0);

    // **ATTACK**
    // Set the time when the Attack must be completed
    var envAttackEnd = icAudioContext.currentTime + icSYNTH.envelope.attack;
    // Go to the max gain in x seconds with a LINEAR ramp
    this.envelope.gain.linearRampToValueAtTime(1.0, envAttackEnd); // NEW
    // this.envelope.gain.setTargetAtTime(1.0, icAudioContext.currentTime, icSYNTH.envelope.attack / 10); // OLD
    // **DECAY** + **SUSTAIN**
    // When the Attack is concluded,
    // Decay the gain to the Sustain level > then > maintain the Sustain gain level until a .noteOff() event
    this.envelope.gain.setTargetAtTime(icSYNTH.envelope.sustain, envAttackEnd, icSYNTH.envelope.decay + 0.001 );
}
ICvoice.prototype.setWaveform = function(waveform) {
    this.osc.type = waveform;
};
ICvoice.prototype.setFrequency = function(operation, type) {
    // NEW VOICE
    if (operation === "new") {
        if (type === "ft") {
            this.osc.frequency.setTargetAtTime( this.initFrequency, 0, icSYNTH.portamento.amount);
            icSYNTH.portamento.lastFreqFT = this.initFrequency;
        } else if (type === "ht") {
            this.osc.frequency.setValueAtTime(this.initFrequency, 0);
        }
    // UPDATE VOICE
    } else if (operation === "update") {
        // @TODO: Apply the normal envelope ADS to the updated voice (like the "new" "ft") or implement a
        this.osc.frequency.setTargetAtTime( this.initFrequency, 0, icSYNTH.portamento.amount);
    }
    // APPLY CURRENT DETUNING (if present): "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
    this.osc.detune.setValueAtTime((icDHC.settings.controller.pitchbend.amount * icDHC.settings.controller.pitchbend.range), 0);
};
ICvoice.prototype.noteOff = function() {
    // Shutdown the envelope before stopping the oscillator (release)
    // To avoid sound artifact in case the Attack or Release are still running...
    // ...cancel the previous scheduled values (if there are)
    this.envelope.gain.cancelScheduledValues(0);
    // Read the actual gain value and make sure that it stay fixed (this clicks under Firefox)
    const val = this.envelope.gain.value > 0 ? this.envelope.gain.value : 0.0001;
    this.envelope.gain.setValueAtTime(val, 0);
    // **RELEASE**
    // Set the time when the Release must be completed
    let envReleaseEnd = icAudioContext.currentTime + icSYNTH.envelope.release;
    // Go near to 0 gain with an EXPONENTIAL ramp
    this.envelope.gain.exponentialRampToValueAtTime(0.0001, envReleaseEnd); // NEW
    // this.envelope.gain.setTargetAtTime(0, icAudioContext.currentTime, icSYNTH.envelope.release / 10); // OLD
    // Stop the oscillator 0.2 second after the Release has been completed
    this.osc.stop(envReleaseEnd + 0.2);
};
//- - - - - - - - - - - - - - - - -
// ICvoice constructor –– END
//---------------------------------

function icVoiceON(freq, ctrlNoteNumber, velocity, type) {
    // If the synth is turned-on
    if (icSYNTH.status === true) {
        // **HT**
        if (type === "ht") {
            // @TODO: implement the limit of polyphony
            // If there isn't a voice turned on with the same note number
            // (prevent duplication in case of stuck note - not turned off)
            if (!icVoices.ht[ctrlNoteNumber]) {   // && Object.keys(icVoices.ht).length < 2
                // Create a new HT voice (POLYPHONIC)
                icVoices.ht[ctrlNoteNumber] = new ICvoice(freq, velocity, type);
            }
        // **FT**
        } else {
            // Manage the monophonic FT voice
            // If the FT voice is active
            if (icVoices.ft) {
                // Shutdown the voice
                icVoices.ft.noteOff();
            }
            // Create a new FT voice (MONOPHONIC)
            icVoices.ft = new ICvoice(freq, velocity, type);
            // Update the frequency of all the HT oscillators because the FT is changed
            icUpdateSynthHTfrequency();
        }
    }
}

function icVoiceOFF(ctrlNoteNumber, type) {
    if (icSYNTH.status === true) {
        // **HT**
        if (type === "ht") {
            // If there is an active voice with ctrlNoteNumber ID
            if (icVoices.ht[ctrlNoteNumber]) {
                // Shut off the note playing and clear it
                icVoices.ht[ctrlNoteNumber].noteOff();
                icVoices.ht[ctrlNoteNumber] = null;
                delete icVoices.ht[ctrlNoteNumber];
            } else {
                console.log("STRANGE: there is NOT an HT active voice with ID:", ctrlNoteNumber);
            }
        // **FT**
        } else {
            // Shut off the active voice and clear it
            if (icVoices.ft) {
                icVoices.ft.noteOff();
                icVoices.ft = null;
            }
        }
    }
}

// Update the frequency of the current playng FT's osc
// on UI setting changes
function icUpdateSynthFTfrequency() {
    if (icVoices.ft != null) {
        var ftArr = icDHC.tables.ft_table[icDHC.settings.ht.curr_ft];
        icVoices.ft.initFrequency = ftArr.hz;
        icVoices.ft.setFrequency("update", "ft");
    }
    return;
}

// Update the frequncies of the current playng HTs' oscs
// when the FT is changing or on other UI setting changes
function icUpdateSynthHTfrequency() {
    for (var i = 0; i < 255; i++) {
        // For every active voice
        if (icVoices.ht[i] != null) {
            // Get the number of the HT from the controller keymap
            var harmonic = icDHC.tables.ctrl_map[i].ht;
            // Get the data about the HT from the ht_table
            var htArr = icDHC.tables.ht_table[harmonic];
            // Set a new osc frequency and apply the change
            icVoices.ht[i].initFrequency = htArr.hz;
            icVoices.ht[i].setFrequency("update", "ht");
        }
    }
    return;
}

// Update the current FT or HT waveform
function icUpdateWaveform(type) {
    // **HT**
    if (type === "ht") {
        for (var i=0; i<255; i++) {
            if (icVoices.ht[i] != null) {
                icVoices.ht[i].setWaveform( icSYNTH.waveform[type] );
            }
        }
    // *FT**
    } else {
        if (icVoices.ft != null) {
            icVoices.ft.setWaveform( icSYNTH.waveform[type] );
        }
    }
}

// Update REVERB amount
// "value" is normalized to 0.0 > 1.0
function icUpdateReverb(value) {
    // Wet/Dry equal-power crossfade
    icSYNTH.reverb.dry.gain.setValueAtTime(Math.cos(value * 0.5 * Math.PI), 0);
    icSYNTH.reverb.wet.gain.setValueAtTime(Math.cos((1.0 - value) * 0.5 * Math.PI), 0);
}

// PITCHBEND MANAGEMENT FOR EVERY ALREADY ACTIVE SYNTH VOICES
function icPitchBend() {
    // If the synth is turned-on
    if (icSYNTH.status === true) {
        for (var i=0; i<255; i++) {
            // For every HT active voice
            if (icVoices.ht[i]) {
                // If the osc exist
                if (icVoices.ht[i].osc){
                    // Detune the osc: "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
                    icVoices.ht[i].osc.detune.value = icDHC.settings.controller.pitchbend.amount * icDHC.settings.controller.pitchbend.range;
                }
            }
        }
        // If the FT voice is active
        if (icVoices.ft) {
            // If the osc exist
            if (icVoices.ft.osc){
                // Detune the osc: "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
                icVoices.ft.osc.detune.value = icDHC.settings.controller.pitchbend.amount * icDHC.settings.controller.pitchbend.range;
            }
        }
    }
}

/*==============================================================================*
 * REVERB IR FILE HANDLING
 *==============================================================================*/
// On loading the Controller Keymap file
function icHandleIrFile(changeEvent) {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        // Access to the file and send it to read function
        icReadIrFile(changeEvent.target.files[0]);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

// Initialize the file reading process
function icReadIrFile(file) {
    var reader = new FileReader();
    //@TODO: ERROR WHEN CANCEL A FILE UPLOAD WINDOW
    // Read file into memory as UTF-8      
    reader.readAsArrayBuffer(file);
    // Launch the data processing as soon as the file has been loaded
    reader.onload = function(event){
        icProcessIrData(event.target.result, file.name);
    };
    // Handle loading errors
    reader.onerror = icFileErrorHandler;
}

function icProcessIrData(data, fileName) {
    icAudioContext.decodeAudioData(data, function(buffer) {
        if (icSYNTH.reverb.convolver) {
            icSYNTH.reverb.convolver.buffer = buffer;
            icEventLog("IR Convolution Reverb file loaded.\n| filename: " + fileName + "\n| duration: " + Math.round(buffer.duration * 100)/100 + " sec\n| channels: " + buffer.numberOfChannels + "\n| sample rate: " + buffer.sampleRate + " Hz\n| ---------------------");
        } else {
            console.log("There is no Convolver!");
        }
    });
}

/*==============================================================================*
 * UI CONTROLLERS
 *==============================================================================*/
// Check the status of the synth Power ON/OFF checkbox
// Also use as a sort of PANIC button for stuck synth Voices
function icSynthState(clickEvent) {
    if (clickEvent.target.checked === true) {
        icSYNTH.status = true;
    } else {
        icSYNTH.status = false;

        // Prevent HT stuck notes
        for (var i = 0; i < 128; i++) {
            if (icVoices.ht[i]) {
                icVoices.ht[i].noteOff();
                icVoices.ht[i] = null;
                delete icVoices.ht[i];
            }
        }
        // Prevent FT stuck notes
        if (icVoices.ft) {
            icVoices.ft.noteOff();
        }
        //@REMOVE: pass on midi-input panic
        icVoices.ftKeyQueue = [];
    }
}

// Initialize the DHC UI controllers
function icSynthUIinit() {
    // ** UI DEFAULT VALUES **
    // --------------------------

    // Set default PORTAMENTO on UI slider
    document.getElementById("HTMLi_synth_portamento").value = icSYNTH.portamento.amount;
    document.getElementById("HTMLi_synth_portamento").setAttribute("data-tooltip", icSYNTH.portamento.amount);
    
    // Set default ATTACK and RELEASE on UI sliders
    document.getElementById("HTMLi_synth_attack").value = icSYNTH.envelope.attack;
    document.getElementById("HTMLi_synth_attack").setAttribute("data-tooltip", icSYNTH.envelope.attack + " s");
    document.getElementById("HTMLi_synth_decay").value = icSYNTH.envelope.decay;
    document.getElementById("HTMLi_synth_decay").setAttribute("data-tooltip", icSYNTH.envelope.decay + " tc");
    document.getElementById("HTMLi_synth_sustain").value = icSYNTH.envelope.sustain;
    document.getElementById("HTMLi_synth_sustain").setAttribute("data-tooltip", icSYNTH.envelope.sustain + " gain");
    document.getElementById("HTMLi_synth_release").value = icSYNTH.envelope.release;
    document.getElementById("HTMLi_synth_release").setAttribute("data-tooltip", icSYNTH.envelope.release + " s");
    
    // Set the default UI WAVEFORMS on UI dropdwon selector
    document.getElementById("HTMLi_synth_waveformFT").value = icSYNTH.waveform.ft;
    document.getElementById("HTMLi_synth_waveformHT").value = icSYNTH.waveform.ht;

    // Set the default GAIN amounts on UI sliders
    let defUIvolume = 0.8;
    icSYNTH.volume.ft.gain.setValueAtTime(defUIvolume, 0);
    document.getElementById("HTMLi_synth_volumeFT").value = defUIvolume;
    document.getElementById("HTMLi_synth_volumeFT").setAttribute("data-tooltip", defUIvolume);
    icSYNTH.volume.ht.gain.setValueAtTime(0.8, 0);
    document.getElementById("HTMLi_synth_volumeHT").value = defUIvolume;
    document.getElementById("HTMLi_synth_volumeHT").setAttribute("data-tooltip", defUIvolume);
    icSYNTH.volume.master.gain.setValueAtTime(0.8, 0);
    document.getElementById("HTMLi_synth_volume").value = defUIvolume;
    document.getElementById("HTMLi_synth_volume").setAttribute("data-tooltip", defUIvolume);
    
    // Set the default reverb dry/wet mix amount on UI
    icUpdateReverb(0.5);
    document.getElementById("HTMLi_synth_reverb").setAttribute("data-tooltip", 0.5);

    // ** UI EVENT LISTENERS **
    // ---------------------

    // EventListener to keep updated the state of the ON/OFF Synth checkbox on UI
    // and prevent stuck notes.
    document.getElementById("HTMLi_synth_power").addEventListener("click", icSynthState);
    // Change WAVEFORMS from UI
    document.getElementById("HTMLi_synth_waveformFT").addEventListener("change", function(event) {
        icSYNTH.waveform.ft = event.target.value;
        icUpdateWaveform("ft");
    });
    document.getElementById("HTMLi_synth_waveformHT").addEventListener("change", function(event) {
        icSYNTH.waveform.ht = event.target.value;
        icUpdateWaveform("ht");
    });
    // Upload a new IR reverb .wav file from UI
    document.getElementById('HTMLi_synth_irFile').addEventListener('change', icHandleIrFile , false);

    // Change VOLUME from UI
    document.getElementById("HTMLi_synth_volumeFT").addEventListener("input", function(event) {
        icSYNTH.volume.ft.gain.setValueAtTime(event.target.value, 0);
        document.getElementById("HTMLi_synth_volumeFT").setAttribute("data-tooltip", event.target.value);
    });
    document.getElementById("HTMLi_synth_volumeHT").addEventListener("input", function(event) {
        icSYNTH.volume.ht.gain.setValueAtTime(event.target.value, 0);
        document.getElementById("HTMLi_synth_volumeHT").setAttribute("data-tooltip", event.target.value);
    });
    document.getElementById("HTMLi_synth_volume").addEventListener("input", function(event) {
        icSYNTH.volume.master.gain.setValueAtTime(event.target.value, 0);
        document.getElementById("HTMLi_synth_volume").setAttribute("data-tooltip", event.target.value);
    });
    // Change PORTAMENTO from UI
    document.getElementById("HTMLi_synth_portamento").addEventListener("input", function(event) {
        icSYNTH.portamento.amount = event.target.value;
        document.getElementById("HTMLi_synth_portamento").setAttribute("data-tooltip", event.target.value);
    });
    // Change ATTACK from UI
    document.getElementById("HTMLi_synth_attack").addEventListener("input", function(event) {
        icSYNTH.envelope.attack = Number(event.target.value);
        document.getElementById("HTMLi_synth_attack").setAttribute("data-tooltip", event.target.value + " s");
    });
    // Change DECAY from UI
    document.getElementById("HTMLi_synth_decay").addEventListener("input", function(event) {
        icSYNTH.envelope.decay = Number(event.target.value);
        document.getElementById("HTMLi_synth_decay").setAttribute("data-tooltip", event.target.value + " tc");
    });
    // Change SUSTAIN from UI
    document.getElementById("HTMLi_synth_sustain").addEventListener("input", function(event) {
        icSYNTH.envelope.sustain = Number(event.target.value);
        document.getElementById("HTMLi_synth_sustain").setAttribute("data-tooltip", event.target.value + " gain");
    });
    // Change RELEASE from UI
    document.getElementById("HTMLi_synth_release").addEventListener("input", function(event) {
        icSYNTH.envelope.release = Number(event.target.value);
        document.getElementById("HTMLi_synth_release").setAttribute("data-tooltip", event.target.value + " s");
    });
    // Change REVERB from UI
    document.getElementById("HTMLi_synth_reverb").addEventListener("input", function(event) {
        // Update amount for crossfading
        icUpdateReverb(event.target.value);
        document.getElementById("HTMLi_synth_reverb").setAttribute("data-tooltip", event.target.value);
    });
    // When all the UI has been set-up, AUTO POWER ON the SYNTH
    document.getElementById("HTMLi_synth_power").click();
}
