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

// Patch up the AudioContext prefixes
window.AudioContext = window.AudioContext || window.webkitAudioContext;

/** 
 * The Synth class.
 *    A tool for listen the tones computed by the DHC.
 *    Provide a simple basic synth useful as reference sound.
 */
HUM.Synth = class {
    /**
    * @param {HUM.DHC} dhc - The DHC instance to which it belongs.
    */
    constructor(dhc) {
        try {
            /**
            * The AudioContext instance from Web Audio API.
            *
            * @member {AudioContext}
            */
            this.audioContext = new AudioContext();
        }
        catch(error) {
            alert('The Web Audio API is apparently not supported in this browser.');
            return undefined;
        }            
        /**
        * The id of this Synth instance (same as the DHC id).
        *
        * @member {string}
        */
        this.id = dhc.id;
        this._id = dhc._id;
        /**
        * The name of the `HUM.PwaManager`, useful for group the parameters on the DB.
        * Currently hard-coded as `"synth"`.
        *
        * @member {string}
        */
        this.name = 'synth';
        /**
        * The DHC instance
        *
        * @member {HUM.DHC}
        */
        this.dhc = dhc;

        /**
         * Namespace for FT and HT voices slots.
         *
         * @member {Object}
         *
         * @property {HUM.Synth#SynthVoice}                 ft - FT slot for a SynthVoice object.
         * @property {Object.<xtnum, HUM.Synth#SynthVoice>} ht - HT slot for a register of SynthVoice objects.
         */
        this.voices = {
            ft: null,
            ht: {}
        };

        /**
         * Namespace for Gain nodes.
         *
         * @member {Object}
         *
         * @property {GainNode} master - Final gain out node.
         * @property {GainNode} mix    - FT+HT mixer gain.
         * @property {GainNode} ft     - FT gain.
         * @property {GainNode} ht     - HT gain.
         */
        this.gains = {
            // Prepare the MASTER, MIX FT and HT gain out nodes
            master: this.audioContext.createGain(),
            mix: this.audioContext.createGain(),
            ft: this.audioContext.createGain(),
            ht: this.audioContext.createGain(),
        };

        /**
         * Namespace for convolver Reverb and wet/dry mixer gains.
         *
         * @member {Object}
         *
         * @property {ConvolverNode} convolver - Slot for convolver reverb node.
         * @property {GainNode}      wet       - Reverberated gain bus/carrier node.
         * @property {GainNode}      dry       - Dry gain bus/carrier node.
         */
        this.reverb = {
            // Prepare the REVERB and the wet/dry gain nodes
            convolver: this.tryCreateConvolver(),
            wet: this.audioContext.createGain(),
            dry: this.audioContext.createGain(),
        };

        /**
        * The compressor node.
        * 
        * @member {DynamicsCompressorNode}
        */
        this.compressor = this.audioContext.createDynamicsCompressor();
        
        /**
        * The vumeter from "webAudioPeakMeter" lib.
        * NB: the `{@link ScriptProcessorNode}` is deprecated but still working.
        * @todo Use AudioWorkletNode {@link https://bit.ly/audio-worklet}.
        * 
        * @member {ScriptProcessorNode}
        */
        this.vumeter = webAudioPeakMeter.createMeterNode(this.gains.master, this.audioContext);

        /**
        * Instance of `HUM.Synth#Parameters`.
        *
        * @member {HUM.Synth.prototype.Parameters}
        */
        this.parameters = new this.Parameters(this);
        this.parameters._init();

        // Tell to the DHC that a new app is using it            
        this.dhc.registerApp(this, 'updatesFromDHC', 2);

        // =======================
    } // end class Constructor
    // ===========================

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
     * Create a new voice of the synth.
     *
     * @param {tonetype} type     - If the voice will be a FTs or HTs.
     * @param {xtnum}    toneID   - The ID of the new voice; the FT/HT tone number.
     * @param {velocity} velocity - MIDI Velocity amount (from 0 to 127) of the MIDI-IN message from the controller.
     */
    voiceON(type, toneID, velocity) {
        let freq = this.dhc.tables[type][toneID].hz;
        // If the synth is turned-on
        if (this.parameters.status.value === true) {
            
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
     * Destroy a voice of the synth.
     *
     * @param {tonetype} type   - If you need to destroy a FT or HT voice.
     * @param {xtnum}    toneID - The ID of the voice to be destroy; the FT/HT tone number.
     * @param {boolean}  panic  - If `true` tells that the message has been generated by a "hard" All-Notes-Off request.
     */
    voiceOFF(type, toneID, panic=false) {
        if (this.parameters.status.value === true) {
           
            // **HT**
            if (type === "ht") {
                // Mute the voice only in there are no more HT tones with the same number
                // (in order to manage the pressure of multiple copy of the same HT on the controller eg. HT 8)
                let sameTones = this.dhc.playQueue.ht.findIndex(qt => qt.xtNum === toneID);
                if (sameTones === -1) {
                    // If there is an active voice with ctrlNoteNumber ID
                    if (this.voices.ht[toneID]) {
                        // Shut off the note playing and clear it
                        this.voices.ht[toneID].voiceMute();
                        this.voices.ht[toneID] = null;
                        delete this.voices.ht[toneID];
                    }
                    // else {
                    //     // if (panic === false) {
                    //     //     console.log("STRANGE: there is NOT an HT active voice with ID:", toneID);
                    //     // }
                    // }
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
     * Turns off all the active voices.
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
     * (on UI setting changes).
     */
    updateFTfrequency() {
        if (this.voices.ft !== null) {
            var ftObj = this.dhc.tables.ft[this.dhc.settings.ht.curr_ft];
            this.voices.ft.initFrequency = ftObj.hz;
            this.voices.ft.setFrequency(true);
        }
    }
    /**
     * Update the frequencies of the current playing HT oscillators
     * (when the FT is changing or on other UI setting changes).
     */
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
     * Apply the current Pitch Bend amount (from the controller) to every already active synth voices.
     */
    updatePitchBend() {
        // If the synth is turned-on
        if (this.parameters.status.value === true) {
            for (var i=0; i<255; i++) {
                // For every HT active voice
                if (this.voices.ht[i]) {
                    // If the osc exist
                    if (this.voices.ht[i].osc){
                        // Detune the osc: "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
                        this.voices.ht[i].osc.detune.value = this.dhc.midi.in.parameters.pitchbend.amount * this.dhc.midi.in.parameters.pitchbend.range.value;
                    }
                }
            }
            // If the FT voice is active
            if (this.voices.ft) {
                // If the osc exist
                if (this.voices.ft.osc){
                    // Detune the osc: "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
                    this.voices.ft.osc.detune.value = this.dhc.midi.in.parameters.pitchbend.amount * this.dhc.midi.in.parameters.pitchbend.range.value;
                }
            }
        }
    }

    /*==============================================================================*
     * REVERB HANDLING
     *==============================================================================*/
    /**
     * Try to create a convolver node.
     *
     * @return {ConvolverNode} - The new instance of a ConvolverNode (from Web Audio API).
     *
     * @throws Open an alert warning that the browser does not support convolution reverberation.
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
     * Initialize the reading process of the IR Reverb file.
     *
     * @param {File} file - The file to be read.
     */
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
     * Load the IR Reverb wav file on the convolver.
     *
     * @param {ArrayBuffer} data     - The raw binary data of the file.
     * @param {string}      fileName - The filename.
     */
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
     * Convert Base64 data held in a string into raw binary blob.
     * 
     * @see {@link https://gist.github.com/fupslot/5015897|Based on this snippet.}
     * 
     * @todo Rewrite lookin here: {@link https://stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f}
     *       Way 2: Maybe make it works with standard url to wave files too.
     *
     * @param {Object} file      - A File-like object.
     * @param {string} file.name - Filename.
     * @param {string} file.data - Data content in Base64.
     *
     * @return {Blob} - The decoded file in a Blob object.
     */  
    static base64ToFile(file) {
        // Note: doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        let byteString = atob(file.data.split(',')[1]);
        // Separate out the mime component
        let mimeString = file.data.split(',')[0].split(':')[1].split(';')[0];
        // Write the bytes of the string to an ArrayBuffer
        let ab = new ArrayBuffer(byteString.length);
        let ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        // Write the ArrayBuffer to a blob
        let bb = new File([ab], file.name, {type : mimeString});
        // var bb = new Blob([ab], {type : mimeString});
        // Add the filename to the blob imitating a real file
        // if (file.name) {
        //     bb.name = file.name;
        // }
        // Return the decoded blob
        return bb;
    }

    /**
     * @todo - finish the visualizer
     * Init the analyser element
     * var icAnalyser = null;
     */

};

/*==============================================================================*
 * SYNTH VOICE
 *==============================================================================*/
/**
 * Class for a single voice of the Synth.
 */
HUM.Synth.prototype.SynthVoice = class {
    /**
     * @param {Synth}    synth    - The Synth instance to which it belongs.
     * @param {hertz}    freq     - Frequency expressed in hertz (Hz).
     * @param {velocity} velocity - MIDI Velocity amount (from 0 to 127).
     * @param {tonetype} type     - If the voice will be a FTs or HTs.
     */
    constructor(synth, freq, velocity, type) {
        /**
         * The Synth instance.
         *
         * @member {Synth}
         */
        this.synth = synth;
        /**
         * The tone type of the SynthVoice.
         * Type of the voice; FT or HT
         *
         * @member {tonetype}
         */
        this.type = type;
        /**
         * Initial frequency expressed in hertz (Hz).
         *
         * @member {hertz}
         */
        this.initFrequency = freq;
        /**
         * The oscillator.
         *
         * @member {OscillatorNode}
         */
        this.osc = this.synth.audioContext.createOscillator();
        /**
         * The gain/volume to implement the Envelope Generator.
         *
         * @member {GainNode}
         */
        this.envelope = this.synth.audioContext.createGain();
        /**
         * The gain/volume to implement the Velocity.
         * A gain to manage the final voice volume if needed (currently not used).
         *
         * @member {GainNode}
         */
        this.volume = this.synth.audioContext.createGain();

        // - - - - - - - - -
        // INIT AUDIO NODES
        // - - - - - - - - -

        // Init the starting frequency to emulate the right portamento
        // for the monophonic FT and all frequency update for all voices (FT & HT)
        if (type === "ft" && this.synth.parameters.portamento.lastFreqFT) {
            // If it's an FT and it's not the first played tone:
            // Init the oscillator's start frequency to the last voiced FT
            this.osc.frequency.setValueAtTime(this.synth.parameters.portamento.lastFreqFT, 0);
        } else if (type === "ft" && !this.synth.parameters.portamento.lastFreqFT) {
            // If it's an FT and it's the first played tone:
            // Init the oscillator's start frequency to the FM (FT0)
            this.osc.frequency.setValueAtTime(this.synth.dhc.settings.fm.hz.value, 0);
        } // If it's an HT, the frequency is set in "this.setFrequency"
        // Set the oscillator's waveform
        this.osc.type = this.synth.parameters.waveform[type].value;

        // Sensitivity scale for velocity
        this.volume.gain.setValueAtTime((velocity / 127), 0);
        // The final voice volume is connected to the main FT or HT volume
        this.volume.connect( this.synth.gains[type] );
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
        var envAttackEnd = this.synth.audioContext.currentTime + this.synth.parameters.envelope.attack.value;
        // Go to the max gain in x seconds with a LINEAR ramp
        this.envelope.gain.linearRampToValueAtTime(1.0, envAttackEnd); // NEW
        // this.envelope.gain.setTargetAtTime(1.0, icAudioContext.currentTime, this.synth.parameters.envelope.attack.value / 10); // OLD
        // **DECAY** + **SUSTAIN**
        // When the Attack is concluded,
        // Decay the gain to the Sustain level > then > maintain the Sustain gain level until a .voiceMute() event
        this.envelope.gain.setTargetAtTime(this.synth.parameters.envelope.sustain.value, envAttackEnd, this.synth.parameters.envelope.decay.value + 0.001 );

        // =======================
    } // end class Constructor
    // ===========================
    
    /**
     * Set/update the voice waveform.
     *
     * @param {('sine'|'square'|'sawtooth'|'triangle')} waveform - Waveform type.
     */
    setWaveform(waveform) {
        this.osc.type = waveform;
    }
    /**
     * Set/update the voice frequency
     *
     * @param {boolean} update - `false`: The voice must be created.
     *                           `true `: The voice must be updated.
     */
    setFrequency(update) {
        // NEW VOICE
        if (update === false) {
            if (this.type === "ft") {
                this.osc.frequency.setTargetAtTime(this.initFrequency, 0, this.synth.parameters.portamento.value);
                this.synth.parameters.portamento.lastFreqFT = this.initFrequency;
            } else if (this.type === "ht") {
                this.osc.frequency.setValueAtTime(this.initFrequency, 0);
            }
        // UPDATE VOICE
        } else if (update === true) {
            // @todo - Apply the normal envelope ADS to the updated voice (like the "new" "ft") or implement a
            this.osc.frequency.setTargetAtTime( this.initFrequency, 0, this.synth.parameters.portamento.value);
        }
        // APPLY CURRENT DETUNING (if present): "value" and "range" are in cents, "amount" is normalized to -1 > 0 > 0.99987792968750
        this.osc.detune.setValueAtTime((this.synth.dhc.midi.in.parameters.pitchbend.amount * this.synth.dhc.midi.in.parameters.pitchbend.range.value), 0);
    }
    /**
     * Turn off the sound of the Voice (release).
     */
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
        let envReleaseEnd = this.synth.audioContext.currentTime + this.synth.parameters.envelope.release.value;
        // Go near to 0 gain with an EXPONENTIAL ramp
        this.envelope.gain.exponentialRampToValueAtTime(0.0001, envReleaseEnd); // NEW
        // this.envelope.gain.setTargetAtTime(0, icAudioContext.currentTime, this.synth.parameters.envelope.release.value / 10); // OLD
        // Stop the oscillator 0.2 second after the Release has been completed
        this.osc.stop(envReleaseEnd + 0.2);
    }
};

/** 
 * Instance class-container used to create all the `HUM.Param` objects for the `HUM.Synth` instance.
 */
HUM.Synth.prototype.Parameters = class {
    /**
     * @param {HUM.Synth} synth - The Synth instance in which this class is being used.
     */
    constructor(synth) {
        /**  
         * This property controls the state of the VU Meter animation (Web Audio Peak Meters).
         * It's not stored on the DB.
         * 
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                      - VU Meter meter ON/OFF. If `false` the meter is disabled.
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out             - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.out.synth_meter - The HTML of the VU Meter.
         */
        this.synthMeter = new HUM.Param({
            app:synth,
            idbKey:'synthMeter',
            uiElements: {
                'synth_meter': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            postSet: (value, thisParam, init) => {
                // Only if the peakMeter hasn't been created yet
                if (!thisParam.uiElements.out.synth_meter.hasChildNodes()) {
                    // Only if the bootstrap collapsible tab is shown
                    if (this.synthTab.value) {
                        // Create the WEB AUDIO PEAK METERS (/assets/js/lib/web-audio-peak-meter.min.js)        
                        webAudioPeakMeter.createMeter(thisParam.uiElements.out.synth_meter, synth.vumeter, {
                            backgroundColor: 'rgb(38, 36, 54)',
                            dbTickSize: 4,
                            borderSize: 5,
                            fontSize: 10,
                            maskTransition: '0.1s'
                        });
                    } else {
                        if (value) {
                            alert("You cannot create and activate the peakMeter if the accordion's tab is hidden.");
                        }
                    }
                }
                if (value) {
                    synth.vumeter.onaudioprocess = webAudioPeakMeter.updateMeter;
                    webAudioPeakMeter.paintMeter.animate = true;
                    webAudioPeakMeter.paintMeter();
                } else {
                    synth.vumeter.onaudioprocess = undefined;
                    webAudioPeakMeter.paintMeter.animate = false;
                }
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            restoreStage: 'mid',
            presetStore:false,
            presetRestore:false,
        });
        /**  
         * This property controls the visibility of the Synth tab; if `false`, it's the VU Meter is
         * turned off in order to avoid unuseful computations and uptates of the UI when the panel is closed.
         * It also initialises the eventListener of the UIelems related to it.
         * It's not stored on the DB.
         * NOTE: These uiElements are the same object because, given the current implementation of
         * Param.UIelem, it's not possible to set more event listeners using a single UIelem.
         *
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                        - The visibility one wants to achieve. If `false` the tab will be collapsed.
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn                - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.fn.synthTabShown  - The HTML of the Synth tab.
         * @property {HTMLElement} uiElements.fn.synthTabHidden - The HTML of the Synth tab.
         */
        this.synthTab = new HUM.Param({
            app:synth,
            idbKey:'synthTab',
            uiElements:{
                'synthTabShown': new HUM.Param.UIelem({
                    htmlID: synth.dhc.harmonicarium.html.synthTabs[synth.dhc.id].children[1].id,
                    role: 'fn',
                    eventType: 'shown.bs.collapse',
                    opType: 'toggle',
                    widget:'collapse',
                    uiSet: (value) => {
                        if (value) {
                            this.synthTab.bsCollapse.show();
                        } else {
                            this.synthTab.bsCollapse.hide();
                        }
                    },
                    eventListener: evt => {
                        this.synthTab.valueUI = true;
                    }
                }),
                'synthTabHidden': new HUM.Param.UIelem({
                    htmlID: synth.dhc.harmonicarium.html.synthTabs[synth.dhc.id].children[1].id,
                    role: 'fn',
                    eventType: 'hidden.bs.collapse',
                    opType: 'toggle',
                    widget:'collapse',
                    uiSet: null,
                    eventListener: evt => {
                        this.synthTab.valueUI = false;
                    }
                }),
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            restoreStage: 'pre',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            preInit: () => {
                // Create a Bootstrap collapsible controller
                this.synthTab.bsCollapse = new bootstrap.Collapse('#'+synth.dhc.harmonicarium.html.synthTabs[synth.dhc.id].children[1].id, {
                    toggle: this.synthTab.value
                });
            },
            postSet: (value, thisParam, init) => {
                // Start stop the peakMeter accordingly to the tab visibility
                if (value) {
                    this.synthMeter.value = true;
                } else {
                    this.synthMeter.value = false;
                }
            }
        });
        /**  
         * This property controls the state of the Synth (Power ON/OFF); if `false`, it is turned off.
         * It's stored on the DB.
         * 
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                     - Power ON/OFF. If `false` the synth is disabled.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.in.synth_power - The HTML of the VU Meter.
         */
        this.status = new HUM.Param({
            app:synth,
            idbKey:'synthStatus',
            uiElements:{
                'synth_power': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'toggle',
                    eventType: 'click',
                    htmlTargetProp:'checked',
                    widget:'checkbox',
                })
            },
            dataType:'boolean',
            initValue:true,
            // Manage the event when the user clicks on the the status of the synth Power ON/OFF checkbox.
            // NOTE: The user can use the "On/Off" toggle as a sort of PANIC button for stuck synth Voices.
            postSet:synth.allNotesOff
        });
        /**
         * Namespace for the Volume controls for the the MASTER, MIX FT and HT gain out nodes.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.volume = {
            /**  
             * This property controls the volume of the final gain out node of the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                       - The main out volume; a float-point number from 0 to 1.
             * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in               - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_volume - The HTML of the input slider widget for setting the volume.
             */
            master: new HUM.Param({
                app:synth,
                idbKey:'synthVolumeMaster',
                uiElements:{
                    'synth_volume': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        widget:'range',
                        htmlTargetProp:'value',
                        eventType: 'input',
                        // eventListeners: {
                        //     tooltip: {
                        //         eventType: 'input',
                        //         function: evt => {
                        //             this.volume.master.uiElements.in.synth_volume.setAttribute('data-tooltip', evt.target.value);
                        //         }
                        //     }
                        // }
                    })
                },
                dataType:'float',
                initValue:0.8,
                preInit: () => {
                    // Connect the MASTER to the final OUT
                    synth.gains.master.connect(synth.audioContext.destination);
                },
                postSet: (value, thisParam) => {
                    // Set volume amount on Master GAIN node from UI slider
                    synth.gains.master.gain.setValueAtTime(value, 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_volume.setAttribute('data-tooltip', value);
                }
            }),
            /**  
             * This property controls the volume of the FT gain out node of the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - The FT out volume; a float-point number from 0 to 1.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_volumeFT - The HTML of the input slider widget for setting the volume.
             */
            ft: new HUM.Param({
                app:synth,
                idbKey:'synthVolumeFT',
                uiElements: {
                    'synth_volumeFT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                        // eventListeners: {
                        //     tooltip: {
                        //         eventType: 'input',
                        //         function: evt => {
                        //             this.volume.master.uiElements.in.synth_volume.setAttribute('data-tooltip', evt.target.value);
                        //         }
                        //     }
                        // }
                    })
                },
                dataType:'float',
                initValue:0.8,
                preInit: () => {
                    // Connect the FT gain to the MIX
                    synth.gains.ft.connect(synth.gains.mix);
                },
                postSet: (value, thisParam) => {
                    // Set volume amount on FT GAIN node from UI slider
                    synth.gains.ft.gain.setValueAtTime(value, 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_volumeFT.setAttribute('data-tooltip', value);
                }
            }),
            /**  
             * This property controls the volume of the HT gain out node of the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                        - The HT out volume; a float-point number from 0 to 1.
             * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_volumeFT - The HTML of the input slider widget for setting the volume.
             */
            ht: new HUM.Param({
                app:synth,
                idbKey:'synthVolumeHT',
                uiElements:{
                    'synth_volumeHT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.8,
                preInit: () => {
                    // Connect the HT gain to the MIX
                    synth.gains.ht.connect(synth.gains.mix);
                },
                postSet: (value, thisParam) => {
                    // Set volume amount on HT GAIN node from UI slider
                    synth.gains.ht.gain.setValueAtTime(value, 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_volumeHT.setAttribute('data-tooltip', value);
                }
            })
        };
        /**
         * Namespace for the ADSR envelope parameters.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.envelope = {
            /**  
             * This property controls the Attack amount the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                      - Attack time (seconds).
             * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in              - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_attack - The HTML of the input slider widget for setting the Attack.
             */
            attack: new HUM.Param({
                app:synth,
                idbKey:'synthAttack',
                uiElements:{
                    'synth_attack': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.3,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_attack.setAttribute('data-tooltip', value + ' s');
                },
            }),
            /**  
             * This property controls the Decay amount the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                     - Decay time (time-constant).
             * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in             - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_decay - The HTML of the input slider widget for setting the Decay.
             */
            decay: new HUM.Param({
                app:synth,
                idbKey:'synthDecay',
                uiElements:{
                    'synth_decay': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.15,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_decay.setAttribute('data-tooltip', value + ' s(tc)');
                }
            }),
            /**  
             * This property controls the Sustain gain amount the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                       - Sustain gain value (amount from 0.0 to 1.0).
             * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in               - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_sustain - The HTML of the input slider widget for setting the Sustain.
             */
            sustain: new HUM.Param({
                app:synth,
                idbKey:'synthSustain',
                uiElements:{
                    'synth_sustain': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.68,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_sustain.setAttribute('data-tooltip', value + ' gain');
                }
            }),
            /**  
             * This property controls the Release time the Synth
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {number}      value                       - Release time (seconds).
             * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in               - Namespace for the "in" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_release - The HTML of the input slider widget for setting the Release.
             */
            release: new HUM.Param({
                app:synth,
                idbKey:'synthRelease',
                uiElements:{
                    'synth_release': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.3,
                postSet: (value, thisParam) => {
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_release.setAttribute('data-tooltip', value + ' s');
                }
            })
        };
        /**
         * Namespace for FT and HT waveform parameters.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.waveform = {
            /**  
             * This property controls waveform for the FTs
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {('sine'|'square'|'sawtooth'|'triangle')} value                          - FTs waveform.
             * @property {Object}                                  uiElements                     - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}                                  uiElements.in                  - Namespace for the "in" HTML elements.
             * @property {HTMLElement}                             uiElements.in.synth_waveformFT - The HTML of the input selection widget for setting the FT waveform.
             */
            ft: new HUM.Param({
                app:synth,
                idbKey:'synthWaveformFT',
                uiElements:{
                    'synth_waveformFT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue:'triangle',
                allowedValues: ['sine', 'sawtooth', 'square', 'triangle'],
                // Update also the current running voices
                postSet: (value) => {
                    if (synth.voices.ft !== null) {
                        synth.voices.ft.setWaveform(value);
                    }

                }
            }),
            /**  
             * This property controls waveform for the HTs
             * and initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             *
             * @member {HUM.Param}
             * 
             * @property {('sine'|'square'|'sawtooth'|'triangle')} value                          - HTs waveform.
             * @property {Object}                                  uiElements                     - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}                                  uiElements.in                  - Namespace for the "in" HTML elements.
             * @property {HTMLElement}                             uiElements.in.synth_waveformHT - The HTML of the input selection widget for setting the HT waveform.
             */
            ht: new HUM.Param({
                app:synth,
                idbKey:'synthWaveformHT',
                uiElements:{
                    'synth_waveformHT': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue:'sine',
                allowedValues: ['sine', 'sawtooth', 'square', 'triangle'],
                // Update also the current running voices
                postSet: (value) => {
                    for (var i=0; i<synth.voices.ht.length; i++) {
                        if (synth.voices.ht[i] !== undefined) {
                            synth.voices.ht[i].setWaveform(value);
                        }
                    }
                }
            })
        };
        /**  
         * This property controls the Portamento/Glide parameters for monophonic FT and FT/HT osc frequency updates.
         * It initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         * 
         * @member {HUM.Param}
         * 
         * @property {number}      value                          - Portamento time (time-constant).
         * @property {number}      lastFreqFT                     - Last FT frequency expressed in hertz (Hz); init value should be `null`.
         * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                  - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.in.synth_portamento - The HTML of the input slider widget for setting the Portamento.
         */
        this.portamento = new HUM.Param({
            app:synth,
            idbKey:'synthPortamento',
            uiElements:{
                'synth_portamento': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'input',
                    htmlTargetProp:'value',
                    widget:'range',
                })
            },
            dataType:'float',
            initValue:0.03,
            postSet: (value, thisParam) => {
                // Update the UI slider's tooltip
                thisParam.uiElements.in.synth_portamento.setAttribute('data-tooltip', value + ' s(tc)');
            },
            customProperties: {lastFreqFT: null}
        });
        /**
         * Namespace for reverb parameters.
         * @instance
         * 
         * @member {Object}
         * @namespace
         */
        this.reverb = {
            /**  
             * This property controls the Reverb amount.
             * It initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             * 
             * @member {HUM.Param}
             * 
             * @property {number}      value                      - Reverb (wet) amount, normalized to 0.0 (dry) > 1.0 (wet).
             * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}      uiElements.in              - Namespace for the "fn" HTML elements.
             * @property {HTMLElement} uiElements.in.synth_reverb - The HTML of the input slider widget for setting the Reverb amount.
             */
            amount: new HUM.Param({
                app:synth,
                idbKey:'synthReverb',
                uiElements:{
                    'synth_reverb': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'input',
                        htmlTargetProp:'value',
                        widget:'range',
                    })
                },
                dataType:'float',
                initValue:0.5,
                preInit: () => {
                    // Split the MIX to the REVERB and to DRY CARRIER
                    synth.gains.mix.connect(synth.reverb.convolver);
                    synth.gains.mix.connect(synth.reverb.dry);
                    // Connect the REVERB to the WET CARRIER
                    synth.reverb.convolver.connect(synth.reverb.wet);
                    // Connect the WET/DRY CARRIERS to the COMPRESSOR
                    synth.reverb.wet.connect(synth.compressor);
                    synth.reverb.dry.connect(synth.compressor);
                    // Connect the COMPRESSOR to the MASTER
                    synth.compressor.connect(synth.gains.master);
                },
                postSet: (value, thisParam) => {
                    // Update the Reverb amount mixing the Wet and Dry lines with an equal-power cross-fade
                    synth.reverb.dry.gain.setValueAtTime(Math.cos(value * 0.5 * Math.PI), 0);
                    synth.reverb.wet.gain.setValueAtTime(Math.cos((1.0 - value) * 0.5 * Math.PI), 0);
                    // Update the UI slider's tooltip
                    thisParam.uiElements.in.synth_reverb.setAttribute('data-tooltip', value);
                }
            }),
            /**  
             * This property sets the IR Reverb wave file.
             * It initialises the eventListener of the UIelems related to it.
             * It's stored on the DB.
             * @instance
             * 
             * @member {HUM.Param}
             * 
             * @property {(File|'default')} value                               - The reverb wave file object.
             * @property {Object}           uiElements                          - Namespace for the "in", "out" and "fn" objects.
             * @property {Object}           uiElements.in                       - Namespace for the "fn" HTML elements.
             * @property {Object}           uiElements.out                      - Namespace for the "fn" HTML elements.
             * @property {HTMLElement}      uiElements.in.synth_irFile          - The HTML of the input file widget for uploading the reverb wave file.
             * @property {HTMLElement}      uiElements.in.synth_irFileName      - The HTML of the output text box for showing the reverb file name.
             * @property {HTMLElement}      uiElements.out.synth_irFileClearBtn - The HTML of the input button that restores the default reverb.
             */
            irFile: new HUM.Param({
                app:synth,
                idbKey:'synthIrFile',
                uiElements:{
                    'synth_irFile': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'files',
                        widget:'file',
                        // Manage the event when the user is trying to load a IR Reverb file with the UI input
                        eventListener: evt => {
                            // Check for the various File API support.
                            if (window.File && window.FileReader && window.FileList && window.Blob) {
                                // Access to the file and send it to the setter method
                                synth.parameters.reverb.irFile.value = evt.target.files[0];
                            } else {
                                alert('The File APIs are not fully supported in this browser.');
                            }
                        }
                    }),
                    'synth_irFileName': new HUM.Param.UIelem({
                        role: 'out',
                    }),
                    'synth_irFileClearBtn': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'run',
                        eventType: 'click',
                        widget:'button',
                        eventListener: evt => {
                            this.reverb.irFile.value = 'default';
                            this.reverb.irFile.uiElements.in.synth_irFile.value = '';
                        }
                    })
                },
                dataType:'file',
                initValue:'default', // NOTE: 'default' is a special value in order to avoid the default                                     //        hardcoded reverb from being stored in the IndexedDB.
                preSet: (value, thisParam, init, fromUI, oldValue) => {
                    let fileNameElem = thisParam.uiElements.out.synth_irFileName;
                    if (value === 'default') {
                        // Load the Base64-coded default IR Reverb
                        synth.readIrFile(synth.constructor.base64ToFile(synth.constructor.defaultReverb));
                        // fileNameElem.innerText = synth.constructor.defaultReverb.name;
                        fileNameElem.innerText = 'Default reverb';
                    } else if (value) {
                        // Load the file from the UI file input 
                        synth.readIrFile(value);
                        if (value.name) {
                            fileNameElem.innerText = value.name;
                        }
                    } else {
                        value = oldValue;
                        fileNameElem.innerText = oldValue.name;
                    }
                    return value;
                },
            })
        };
        // =======================
    } // end class Constructor
    // ===========================
    /**
     * Initializes the parameter "synthTab".
     */
    _init() {
        this.synthTab._init();
    }
};

