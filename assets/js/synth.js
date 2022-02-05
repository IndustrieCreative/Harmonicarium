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

/* globals AudioContext */
/* globals HUM */
/* globals webAudioPeakMeter */

"use strict";

// Patch up the AudioContext prefixes
window.AudioContext = window.AudioContext || window.webkitAudioContext;

/** 
 * The Synth class
 *    A tool for listen the tones computed by the DHC.<br>
 *    Provide a simple basic synth useful as reference sound.
 */
// @old icSYNTH
HUM.Synth = class {
    /**
    * @param {HUM.DHC} dhc - The DHC instance to which it belongs
    */
    constructor(dhc) {
        /**
        * The AudioContext instance from Web Audio API
        *
        * @member {AudioContext}
        */
        try {
            // @old icAudioContext
            this.audioContext = new AudioContext();
        }
        catch(error) {
            alert('The Web Audio API is apparently not supported in this browser.');
            return undefined;
        }            
        /**
        * The id of this Synth instance (same as the DHC id)
        *
        * @member {string}
        */
        this.id = dhc.id;
        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;
        /**
         * The state of the Synth (Power ON/OFF); if `false`, it is turned off.
         *
         * @member {boolean}
         */
        this.status = false;
        /**
         * Namespace for FT and HT voices slots
         *
         * @member {Object}
         *
         * @property {HUM.Synth#SynthVoice}                 ft - FT slot for a SynthVoice object
         * @property {Object.<xtnum, HUM.Synth#SynthVoice>} ht - HT slot for a register of SynthVoice objects
         */
        // @old icVoices
        this.voices = {
            ft: null,
            ht: {}
        };
        /**
         * Namespace for Gain nodes
         *
         * @member {Object}
         *
         * @property {GainNode} master       - Final gain out node
         * @property {GainNode} mix          - FT+HT mixer gain
         * @property {GainNode} ft           - FT gain
         * @property {GainNode} ht           - HT gain
         * @property {number}   defaultValue - The default volume value for FT and HT
         */
        this.volume = {
            // Prepare the MASTER, MIX FT and HT gain out nodes
            master: this.audioContext.createGain(),
            mix: this.audioContext.createGain(),
            ft: this.audioContext.createGain(),
            ht: this.audioContext.createGain(),
            defaultValue: 0.8
        };
        /**
         * Namespace for FT and HT waveform
         *
         * @member {Object}
         *
         * @property {('sine'|'square'|'sawtooth'|'triangle')} ft - FTs waveform
         * @property {('sine'|'square'|'sawtooth'|'triangle')} ht - HTs waveform
         */
        this.waveform = {
            ft: "triangle",
            ht: "sine"
        };
        /**
         * Namespace for the ADSR envelope parameters
         *
         * @member {Object}
         *
         * @property {number} attack  - Attack time (seconds)
         * @property {number} decay   - Decay time (time-constant)
         * @property {number} sustain - Sustain gain value (amount from 0.0 to 1.0)
         * @property {number} release - Release time (seconds)
         */
        this.envelope = {
            attack: 0.3,
            decay: 0.15,
            sustain: 0.68,
            release: 0.3
        };
        /**
         * Portamento/Glide parameters for monophonic FT and FT/HT osc frequency updates.
         *
         * @member {Object}
         *
         * @property {number} amount     - Portamento time (time-constant)
         * @property {number} lastFreqFT - Last FT frequency expressed in hertz (Hz); init value should be `null`
         */
        this.portamento = {
            amount: 0.03,
            lastFreqFT: null
        };
        /**
         * Namespace for convolver Reverb and wet/dry mixer gains
         *
         * @member {Object}
         *
         * @property {ConvolverNode} convolver    - Slot for convolver reverb node
         * @property {GainNode}      wet          - Reverberated gain bus/carrier node
         * @property {GainNode}      dry          - Dry gain bus/carrier node
         * @property {GainNode}      amount       - Reverb wey/dry mixing amount (for cross-fade)
         * @property {number}        defaultValue - Default value for the wet/dry mixer gain
         */
        this.reverb = {
            // Prepare the REVERB and the wet/dry gain nodes
            convolver: this.tryCreateConvolver(),
            wet: this.audioContext.createGain(),
            dry: this.audioContext.createGain(),
            amount: null,
            defaultValue: 0.5
        };
        /**
        * The compressor node
        * 
        * @member {DynamicsCompressorNode}
        */
        this.compressor = this.audioContext.createDynamicsCompressor();
        /**
        * The vumeter from "webAudioPeakMeter" lib
        *     NB: the `{@link ScriptProcessorNode}` is deprecated but still working.
        * 
        * @member {ScriptProcessorNode}
        */
        this.vumeter = webAudioPeakMeter.createMeterNode(this.volume.master, this.audioContext);
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
                checkboxSynth: this.dhc.harmonicarium.html.synthTab[dhc.id].children[0],
            },
            in: {
                portamento: document.getElementById('HTMLi_synth_portamento'+dhc.id),
                attack: document.getElementById('HTMLi_synth_attack'+dhc.id),
                decay: document.getElementById('HTMLi_synth_decay'+dhc.id),
                sustain: document.getElementById('HTMLi_synth_sustain'+dhc.id),
                release: document.getElementById('HTMLi_synth_release'+dhc.id),
                waveformFT: document.getElementById('HTMLi_synth_waveformFT'+dhc.id),
                waveformHT: document.getElementById('HTMLi_synth_waveformHT'+dhc.id),
                volumeFT: document.getElementById('HTMLi_synth_volumeFT'+dhc.id),
                volumeHT: document.getElementById('HTMLi_synth_volumeHT'+dhc.id),
                volume: document.getElementById('HTMLi_synth_volume'+dhc.id),
                reverb: document.getElementById('HTMLi_synth_reverb'+dhc.id),
                power: document.getElementById('HTMLi_synth_power'+dhc.id),
                irFile: document.getElementById('HTMLi_synth_irFile'+dhc.id),
            },
            out: {
                synth_meter: document.getElementById('HTMLo_synth_meter'+dhc.id),
            }
        };

        this._init();
        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initialize the new instance of Synth
     */
    _init() {
        // Conect the FT and HT gains to the MIX
        this.volume.ft.connect(this.volume.mix);
        this.volume.ht.connect(this.volume.mix);
        // Split the MIX to the REVERB and to DRY CARRIER
        this.volume.mix.connect(this.reverb.convolver);
        this.volume.mix.connect(this.reverb.dry);
        // Connect the REVERB to the WET CARRIER
        this.reverb.convolver.connect(this.reverb.wet);
        // Connect the WET/DRY CARRIERS to the COMPRESSOR
        this.reverb.wet.connect(this.compressor);
        this.reverb.dry.connect(this.compressor);
        // Connect the COMPRESSOR to the MASTER
        this.compressor.connect(this.volume.master);
        // Connect the MASTER to the final OUT
        this.volume.master.connect(this.audioContext.destination);
            // @todo - finish the visualizer
            // Create the VISUALIZER
            // icAnalyser = icAudioContext.createAnalyser();
            // icAnalyser.minDecibels = -90;
            // icAnalyser.maxDecibels = -10;
            // icAnalyser.smoothingTimeConstant = 0.85;
            // icVisualize();
            // @todo - finish the visualizer
            // this.volume.master.connect(icAnalyser);
            // icAnalyser.connect(icAudioContext.destination);

        // Init the Synth with default values

        // Load the Base64-coded default IR Reverb
        this.readIrFile(this.constructor.base64ToBlob(this.constructor.defaultReverb));
        // @todo - Implement XMLHttpRequest() to get IR reverbs from URLs on the net
        // @todo - https://codepen.io/andremichelle/pen/NPPEPY
        
        this.volume.ft.gain.setValueAtTime(this.volume.defaultValue, 0);
        this.volume.ht.gain.setValueAtTime(this.volume.defaultValue, 0);
        this.volume.master.gain.setValueAtTime(this.volume.defaultValue, 0);
        this.updateReverb(this.reverb.defaultValue);
        this.status = true;
        
        this._initUI();

        // Create the WEB AUDIO PEAK METERS (/assets/js/lib/web-audio-peak-meter.min.js)        
        webAudioPeakMeter.createMeter(this.uiElements.out.synth_meter, this.vumeter, {
            backgroundColor: 'rgb(38, 36, 54)',
            dbTickSize: 4,
            borderSize: 5,
            fontSize: 10,
            maskTransition: '0.1s'
        });
        
        // Start with the analysis suspended
        this.vumeter.onaudioprocess = undefined;

        // Disable the vu-meter analisys & animation if the accordion Synth tab is closed
        this.uiElements.fn.checkboxSynth.addEventListener('change', (e) => {
            if (e.target.checked === true) {
                this.vumeter.onaudioprocess = webAudioPeakMeter.updateMeter;
                webAudioPeakMeter.paintMeter.animate = true;
                webAudioPeakMeter.paintMeter();
            } else {
                this.vumeter.onaudioprocess = undefined;
                webAudioPeakMeter.paintMeter.animate = false;
            }
        });

        // Tell to the DHC that a new app is using it            
        this.dhc.registerApp(this, 'updatesFromDHC', 2);
    }

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
                
                this.updateFTfrequency();

            } else if (msg.type === 'ht') {

                this.updateHTfrequency();

            } else if (msg.type === 'ctrlmap') {

            }

        } else if (msg.cmd === 'tone-on') {
            if (msg.type === 'ft') {

                this.voiceON("ft", msg.xtNum, msg.velocity);

            } else if (msg.type === 'ht') {

                if (msg.xtNum !== 0) {
                    this.voiceON("ht", msg.xtNum, msg.velocity);
                }

            }

        } else if (msg.cmd === 'tone-off') {
            if (msg.type === 'ft') {

                this.voiceOFF("ft", msg.xtNum, msg.panic);

            } else if (msg.type === 'ht') {
                if (msg.xtNum !== 0) {
                    this.voiceOFF("ht", msg.xtNum, msg.panic);
                }

            }

        }
    }

    /**
     * Create a new voice of the synth
     *
     * @param {tonetype} type     - If the voice will be a FTs or HTs
     * @param {xtnum}    toneID   - The ID of the new voice; the FT/HT tone number
     * @param {velocity} velocity - MIDI Velocity amount (from 0 to 127) of the MIDI-IN message from the controller
     */
    // @old icVoiceON
    voiceON(type, toneID, velocity) {
        let freq = this.dhc.tables[type][toneID].hz;
        // If the synth is turned-on
        if (this.status === true) {
            
            // **HT**
            if (type === "ht") {
                // @todo - implement the limit of polyphony
                // If there isn't a voice turned on with the same toneID
                // (prevent duplication in case of stuck note - not turned off)
                if (!this.voices.ht[toneID]) {   // && Object.keys(this.voices.ht).length < 2
                    // Create a new HT voice (POLYPHONIC)
                    this.voices.ht[toneID] = new this.SynthVoice(this, freq, velocity, type);
                } //  else {
                //     this.voiceOFF('ht', toneID);
                //     this.voices.ht[toneID] = new Synth.SynthVoice(this, freq, velocity, type);
                // }

            // **FT**
            } else if (type === "ft") {
                // Manage the monophonic FT voice
                // If the FT voice is active
                if (this.voices.ft) {
                    // Shutdown the voice
                    this.voices.ft.voiceMute();
                }
                // Create a new FT voice (MONOPHONIC)
                this.voices.ft = new this.SynthVoice(this, freq, velocity, type);
                // Update the frequency of all the HT oscillators because the FT is changed
                this.updateHTfrequency();
            }
        }
    }
    /**
     * Destroy a voice of the synth
     *
     * @param {tonetype} type   - If you need to destroy a FT or HT voice
     * @param {xtnum}    toneID - The ID of the voice to be destroy; the FT/HT tone number
     * @param {boolean}  panic  - If `true` tells that the message has been generated by a "hard" All-Notes-Off request.
     */
    // @old icVoiceOFF
    voiceOFF(type, toneID, panic=false) {
        if (this.status === true) {
           
            // **HT**
            if (type === "ht") {
                // Mute the voice only in there are no more HT tones with the same number
                // (in order to manage the pressure of multiple copy of the same HT on the controller eg. HT 8)
                let sameTones = this.dhc.playQueue.ht.findIndex(qt => qt.xtNum === toneID);
                if (sameTones < 0) {
                    // If there is an active voice with ctrlNoteNumber ID
                    if (this.voices.ht[toneID]) {
                        // Shut off the note playing and clear it
                        this.voices.ht[toneID].voiceMute();
                        this.voices.ht[toneID] = null;
                        delete this.voices.ht[toneID];
                    } else {
                        if (panic === false) {
                            console.log("STRANGE: there is NOT an HT active voice with ID:", toneID);
                        }
                    }
                }
            
            // **FT**
            } else {
                // Mute the voice only in there are no more HT tones with the same number
                // (in order to manage the pressure of multiple copy of the same FT on the controller)
                let sameTones = this.dhc.playQueue.ft.findIndex(qt => qt.xtNum === toneID);
                if (sameTones < 0) {
                    // Shut off the active voice and clear it
                    if (this.voices.ft) {
                        if (this.dhc.settings.ht.curr_ft === toneID) {
                            this.voices.ft.voiceMute();
                            this.voices.ft = null;
                        }
                    }
                }
            }
        }
    }
    /**
     * Turns off all the active voices
     */
    allNotesOff() {
        // Prevent HT stuck notes
        for (var i = 0; i < 128; i++) {
            if (this.voices.ht[i]) {
                this.voices.ht[i].voiceMute();
                this.voices.ht[i] = null;
                delete this.voices.ht[i];
            }
        }
        // Prevent FT stuck notes
        if (this.voices.ft) {
            this.voices.ft.voiceMute();
        }
    }
    /**
     * Update the frequency of the current playing FT oscillator
     * (on UI setting changes)
     */
    // @old icUpdateSynthFTfrequency
    updateFTfrequency() {
        if (this.voices.ft !== null) {
            var ftObj = this.dhc.tables.ft[this.dhc.settings.ht.curr_ft];
            this.voices.ft.initFrequency = ftObj.hz;
            this.voices.ft.setFrequency(true);
        }
    }
    /**
     * Update the frequencies of the current playing HT oscillators
     * (when the FT is changing or on other UI setting changes)
     */
    // @old icUpdateSynthHTfrequency
    updateHTfrequency() {
        for (const [toneID, voice] of Object.entries(this.voices.ht)) {
            // Get the data about the HT from the ht table
            var htObj = this.dhc.tables.ht[toneID];
            // Set a new osc frequency and apply the change
            voice.initFrequency = htObj.hz;
            voice.setFrequency(true);
        }
    }
    /**
     * Update the current FT or HT waveform
     *
     * @param {('sine'|'square'|'sawtooth'|'triangle')} type - Waveform type
     */
    // @old icUpdateWaveform
    updateWaveform(type) {
        // **HT**
        if (type === "ht") {
            for (var i=0; i<this.voices.ht.lenght; i++) {
                if (this.voices.ht[i] !== undefined) {
                    this.voices.ht[i].setWaveform( this.waveform[type] );
                }
            }
        // **FT**
        } else if (type === "ft") {
            if (this.voices.ft !== null) {
                this.voices.ft.setWaveform( this.waveform[type] );
            }
        }
    }
    /**
     * Update the Reverb amount mixing the wet and dry lines with an equal-power cross-fade
     *
     * @param {number} value - Reverb (wet) amount (normalized to 0.0 > 1.0)
     */
    // @old icUpdateReverb
    updateReverb(value) {
        // Wet/Dry equal-power cross-fade
        this.reverb.dry.gain.setValueAtTime(Math.cos(value * 0.5 * Math.PI), 0);
        this.reverb.wet.gain.setValueAtTime(Math.cos((1.0 - value) * 0.5 * Math.PI), 0);
    }
    /**
     * Apply the current Pitch Bend amount (from the controller) to every already active synth voices
     */
    // @old icSynthPitchBend
    updatePitchBend() {
        // If the synth is turned-on
        if (this.status === true) {
            for (var i=0; i<255; i++) {
                // For every HT active voice
                if (this.voices.ht[i]) {
                    // If the osc exist
                    if (this.voices.ht[i].osc){
                        // Detune the osc: "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
                        this.voices.ht[i].osc.detune.value = this.dhc.settings.controller.pb.amount * this.dhc.settings.controller.pb.range;
                    }
                }
            }
            // If the FT voice is active
            if (this.voices.ft) {
                // If the osc exist
                if (this.voices.ft.osc){
                    // Detune the osc: "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
                    this.voices.ft.osc.detune.value = this.dhc.settings.controller.pb.amount * this.dhc.settings.controller.pb.range;
                }
            }
        }
    }

    /*==============================================================================*
     * REVERB HANDLING
     *==============================================================================*/
    /**
     * Try to create a convolver node
     *
     * @return {ConvolverNode} - The new instance of a ConvolverNode (from Web Audio API)
     *
     * @throws Open an alert warning that the browser does not support convolution reverberation
     */
    tryCreateConvolver() {
        // If the convolver is not supported by the browser, create a normal gain node
        try {
            return this.audioContext.createConvolver();
        }
        catch(error) {
            alert('The reverb is not supported in this browser.');
            return this.audioContext.createGain();
        }
    }
    /**
     * Manage the event when the user is trying to load a IR Reverb file
     *
     * @param {Event} changeEvent - DOM change event on 'input' element (reverb file uploader)
     */
    // @old icHandleIrFile
    handleIrFile(changeEvent) {
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
            // Access to the file and send it to read function
            this.readIrFile(changeEvent.target.files[0]);
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
    }
    /**
     * Initialize the reading process of the IR Reverb file
     *
     * @param {File} file - The file to be read
     */
    // @old icReadIrFile
    readIrFile(file) {
        let reader = new FileReader();
        // Handle loading errors
        reader.onerror = this.dhc.harmonicarium.components.backendUtils.fileErrorHandler;
        if (file) {
            // Read file into memory as ArrayBuffer     
            reader.readAsArrayBuffer(file);
            // Launch the data processing as soon as the file has been loaded
            reader.onload = (function(e){
                this.loadIrFile(e.target.result, file.name);
            }).bind(this);
        }
    }
    /**
     * Load the IR Reverb wav file on the convolver
     *
     * @param {ArrayBuffer} data     - The raw binary data of the file
     * @param {string}      fileName - The filename
     */
    // @old icProcessIrData
    loadIrFile(data, fileName) {
        this.audioContext.decodeAudioData(data, (function(buffer) {
            if (this.reverb.convolver) {
                this.reverb.convolver.buffer = buffer;
                this.dhc.harmonicarium.components.backendUtils.eventLog("IR Convolution Reverb file loaded.\n| filename: " + fileName + "\n| duration: " + Math.round(buffer.duration * 100)/100 + " sec\n| channels: " + buffer.numberOfChannels + "\n| sample rate: " + buffer.sampleRate + " Hz\n| ---------------------");
            } else {
                console.log("There is no Convolver!");
            }
        }).bind(this));
    }
    /**
     * Convert Base64 data held in a string into raw binary blob
     * 
     * @see {@link https://gist.github.com/fupslot/5015897|Based on this snippet}
     *
     * @param {Object} file      - A File-like object
     * @param {Object} file.name - Filename
     * @param {Object} file.data - Data content in Base64
     *
     * @return {Blob}             - The decoded file in a Blob object
     */
    static base64ToBlob(file) {
        // Note: doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(file.data.split(',')[1]);
        // Separate out the mime component
        var mimeString = file.data.split(',')[0].split(':')[1].split(';')[0];
        // Write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        // Write the ArrayBuffer to a blob
        var bb = new Blob([ab], {type : mimeString});
        // Add the filename to the blob imitating a real file
        if (file.name) {
            bb.name = file.name;
        }
        // Return the decoded blob
        return bb;
    }

    /*==============================================================================*
     * UI CONTROLLERS
     *==============================================================================*/

    /**
     * @todo - finish the visualizer
     * Init the analyser element
     * var icAnalyser = null;
     */

    /**
     * Manage the event when the user clicks on the the status of the synth Power ON/OFF checkbox.<br>
     * Can be used as a sort of PANIC button for stuck synth Voices by the user.
     *
     * @param {Event} clickEvent - Click HTML event on 'input' element (synth  checkbox)
     */
    // @old icSynthState
    synthState(clickEvent) {
        if (clickEvent.target.checked === true) {
            this.status = true;
        } else {
            this.allNotesOff();
            this.status = false;
        }
    }

    /**
     * Initialize the Synth UI controllers  
     */
    // @old icSynthUIinit
    _initUI() {
        // Set default PORTAMENTO on UI slider
        this.uiElements.in.portamento.value = this.portamento.amount;
        this.uiElements.in.portamento.setAttribute("data-tooltip", this.portamento.amount);
        
        // Set default ATTACK and RELEASE on UI sliders
        this.uiElements.in.attack.value = this.envelope.attack;
        this.uiElements.in.attack.setAttribute("data-tooltip", this.envelope.attack + " s");
        this.uiElements.in.decay.value = this.envelope.decay;
        this.uiElements.in.decay.setAttribute("data-tooltip", this.envelope.decay + " tc");
        this.uiElements.in.sustain.value = this.envelope.sustain;
        this.uiElements.in.sustain.setAttribute("data-tooltip", this.envelope.sustain + " gain");
        this.uiElements.in.release.value = this.envelope.release;
        this.uiElements.in.release.setAttribute("data-tooltip", this.envelope.release + " s");
        
        // Set the default UI WAVEFORMS on UI dropdwon selector
        this.uiElements.in.waveformFT.value = this.waveform.ft;
        this.uiElements.in.waveformHT.value = this.waveform.ht;

        // Set the default GAIN amounts on UI sliders
        this.uiElements.in.volumeFT.value = this.volume.defaultValue;
        this.uiElements.in.volumeFT.setAttribute("data-tooltip", this.volume.defaultValue);
        this.uiElements.in.volumeHT.value = this.volume.defaultValue;
        this.uiElements.in.volumeHT.setAttribute("data-tooltip", this.volume.defaultValue);
        this.uiElements.in.volume.value = this.volume.defaultValue;
        this.uiElements.in.volume.setAttribute("data-tooltip", this.volume.defaultValue);
        
        // Set the default reverb dry/wet mix amount on UI
        this.uiElements.in.reverb.setAttribute("data-tooltip", this.reverb.defaultValue);

        // ** UI EVENT LISTENERS **
        // ---------------------

        // EventListener to keep updated the state of the ON/OFF Synth checkbox on UI
        // and prevent stuck notes.
        this.uiElements.in.power.addEventListener("click", (e) => this.synthState(e));
        // Change WAVEFORMS from UI
        this.uiElements.in.waveformFT.addEventListener("change", function(event) {
            this.waveform.ft = event.target.value;
            this.updateWaveform("ft");
        });
        this.uiElements.in.waveformHT.addEventListener("change", function(event) {
            this.waveform.ht = event.target.value;
            this.updateWaveform("ht");
        });
        // Upload a new IR reverb .wav file from UI
        this.uiElements.in.irFile.addEventListener('change', (e) => this.handleIrFile(e), false);

        // Change VOLUME from UI
        this.uiElements.in.volumeFT.addEventListener("input", function(event) {
            this.volume.ft.gain.setValueAtTime(event.target.value, 0);
            this.uiElements.in.volumeFT.setAttribute("data-tooltip", event.target.value);
        });
        this.uiElements.in.volumeHT.addEventListener("input", function(event) {
            this.volume.ht.gain.setValueAtTime(event.target.value, 0);
            this.uiElements.in.volumeHT.setAttribute("data-tooltip", event.target.value);
        });
        this.uiElements.in.volume.addEventListener("input", function(event) {
            this.volume.master.gain.setValueAtTime(event.target.value, 0);
            this.uiElements.in.volume.setAttribute("data-tooltip", event.target.value);
        });
        // Change PORTAMENTO from UI
        this.uiElements.in.portamento.addEventListener("input", function(event) {
            this.portamento.amount = event.target.value;
            this.uiElements.in.portamento.setAttribute("data-tooltip", event.target.value);
        });
        // Change ATTACK from UI
        this.uiElements.in.attack.addEventListener("input", function(event) {
            this.envelope.attack = Number(event.target.value);
            this.uiElements.in.attack.setAttribute("data-tooltip", event.target.value + " s");
        });
        // Change DECAY from UI
        this.uiElements.in.decay.addEventListener("input", function(event) {
            this.envelope.decay = Number(event.target.value);
            this.uiElements.in.decay.setAttribute("data-tooltip", event.target.value + " tc");
        });
        // Change SUSTAIN from UI
        this.uiElements.in.sustain.addEventListener("input", function(event) {
            this.envelope.sustain = Number(event.target.value);
            this.uiElements.in.sustain.setAttribute("data-tooltip", event.target.value + " gain");
        });
        // Change RELEASE from UI
        this.uiElements.in.release.addEventListener("input", function(event) {
            this.envelope.release = Number(event.target.value);
            this.uiElements.in.release.setAttribute("data-tooltip", event.target.value + " s");
        });
        // Change REVERB from UI
        this.uiElements.in.reverb.addEventListener("input", function(event) {
            // Update amount for crossfading
            this.updateReverb(event.target.value);
            this.uiElements.in.reverb.setAttribute("data-tooltip", event.target.value);
        });
        // Set the POWER ON checkbox according to the default state
        this.uiElements.in.power.checked = this.status;
    }

};

/*==============================================================================*
 * SYNTH VOICE
 *==============================================================================*/
/**
 * Class for a single voice of the Synth
 */
// @old ICvoice
HUM.Synth.prototype.SynthVoice = class {
    /**
     * @param {Synth}    synth    - The Synth instance to which it belongs
     * @param {hertz}    freq     - Frequency expressed in hertz (Hz)
     * @param {velocity} velocity - MIDI Velocity amount (from 0 to 127)
     * @param {tonetype} type     - If the voice will be a FTs or HTs
     */
    constructor(synth, freq, velocity, type) {
        /**
         * The Synth instance
         *
         * @member {Synth}
         */
        this.synth = synth;
        /**
         * The tone type of the SynthVoice
         * Type of the voice; FT or HT
         *
         * @member {Synth}
         */
        this.type = type;
        /**
         * Initial frequency expressed in hertz (Hz)
         *
         * @member {hz}
         */
        this.initFrequency = freq;
        /**
         * The oscillator
         *
         * @member {OscillatorNode}
         */
        this.osc = this.synth.audioContext.createOscillator();
        /**
         * The gain/volume to implement the Envelope Generator
         *
         * @member {OscillatorNode}
         */
        this.envelope = this.synth.audioContext.createGain();
        /**
         * The gain/volume to implement the Velocity
         * A gain to manage the final voice volume if needed (currently not used)
         *
         * @member {OscillatorNode}
         */
        this.volume = this.synth.audioContext.createGain();

        // - - - - - - - - -
        // INIT AUDIO NODES
        // - - - - - - - - -

        // Init the starting frequency to emulate the right portamento
        // for the monophonic FT and all frequency update for all voices (FT & HT)
        if (type === "ft" && this.synth.portamento.lastFreqFT) {
            // If it's an FT and it's not the first played tone:
            // Init the oscillator's start frequency to the last voiced FT
            this.osc.frequency.setValueAtTime(this.synth.portamento.lastFreqFT, 0);
        } else if (type === "ft" && !this.synth.portamento.lastFreqFT) {
            // If it's an FT and it's the first played tone:
            // Init the oscillator's start frequency to the FM (FT0)
            this.osc.frequency.setValueAtTime(this.synth.dhc.settings.fm.hz, 0);
        } // If it's an HT, the frequency is set in "this.setFrequency"
        // Set the oscillator's waveform
        this.osc.type = this.synth.waveform[type];

        // Sensitivity scale for velocity
        this.volume.gain.setValueAtTime((velocity / 127), 0);
        // The final voice volume is connected to the main FT or HT volume
        this.volume.connect( this.synth.volume[type] );
        // The envelope is connected to the volume
        this.envelope.connect( this.volume );
        // The oscillator is connected to the envelope
        this.osc.connect( this.envelope );

        // Set envelope parameters ADS (to avoid oscillator's start/stop clicks)
        // Initialize the envelope with 0 value
        // [Deprecation] .value setter smoothing is deprecated and will be removed in M64, around Jan 2018
        // [Deprecation] .setValueAtTime only does clicks (why?) I leave .value untill clicks are fixed
        this.envelope.gain.value = 0.0; // Repeated ?!
        this.envelope.gain.setValueAtTime(0, this.synth.audioContext.currentTime); // Repeated ?!

        // Call the method to tune the oscillator
        this.setFrequency(false);
        // Start the oscillator
        this.osc.start(0);

        // **ATTACK**
        // Set the time when the Attack must be completed
        var envAttackEnd = this.synth.audioContext.currentTime + this.synth.envelope.attack;
        // Go to the max gain in x seconds with a LINEAR ramp
        this.envelope.gain.linearRampToValueAtTime(1.0, envAttackEnd); // NEW
        // this.envelope.gain.setTargetAtTime(1.0, icAudioContext.currentTime, this.synth.envelope.attack / 10); // OLD
        // **DECAY** + **SUSTAIN**
        // When the Attack is concluded,
        // Decay the gain to the Sustain level > then > maintain the Sustain gain level until a .voiceMute() event
        this.envelope.gain.setTargetAtTime(this.synth.envelope.sustain, envAttackEnd, this.synth.envelope.decay + 0.001 );

        // =======================
    } // end class Constructor
    // ===========================
    
    /**
     * Set/update the voice waveform
     *
     * @param {('sine'|'square'|'sawtooth'|'triangle')} waveform - Waveform type
     */
    setWaveform(waveform) {
        this.osc.type = waveform;
    }
    /**
     * Set/update the voice frequency
     *
     * @param {boolean} update - `false`: The voice must be created.<br>
     *                           `true `: The voice must be updated.
     */
    setFrequency(update) {
        // NEW VOICE
        if (update === false) {
            if (this.type === "ft") {
                this.osc.frequency.setTargetAtTime(this.initFrequency, 0, this.synth.portamento.amount);
                this.synth.portamento.lastFreqFT = this.initFrequency;
            } else if (this.type === "ht") {
                this.osc.frequency.setValueAtTime(this.initFrequency, 0);
            }
        // UPDATE VOICE
        } else if (update === true) {
            // @todo - Apply the normal envelope ADS to the updated voice (like the "new" "ft") or implement a
            this.osc.frequency.setTargetAtTime( this.initFrequency, 0, this.synth.portamento.amount);
        }
        // APPLY CURRENT DETUNING (if present): "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
        this.osc.detune.setValueAtTime((this.synth.dhc.settings.controller.pb.amount * this.synth.dhc.settings.controller.pb.range), 0);
    }
    /**
     * Turn off the sound of the Voice (release)
     */
    // @old noteOff
    voiceMute() {
        // Shutdown the envelope before stopping the oscillator (release)
        // To avoid sound artifact in case the Attack or Release are still running...
        // ...cancel the previous scheduled values (if there are)
        this.envelope.gain.cancelScheduledValues(0);
        // Read the actual gain value and make sure that it stay fixed (this clicks under Firefox)
        const val = this.envelope.gain.value > 0 ? this.envelope.gain.value : 0.0001;
        this.envelope.gain.setValueAtTime(val, 0);
        // **RELEASE**
        // Set the time when the Release must be completed
        let envReleaseEnd = this.synth.audioContext.currentTime + this.synth.envelope.release;
        // Go near to 0 gain with an EXPONENTIAL ramp
        this.envelope.gain.exponentialRampToValueAtTime(0.0001, envReleaseEnd); // NEW
        // this.envelope.gain.setTargetAtTime(0, icAudioContext.currentTime, this.synth.envelope.release / 10); // OLD
        // Stop the oscillator 0.2 second after the Release has been completed
        this.osc.stop(envReleaseEnd + 0.2);
    }
};

