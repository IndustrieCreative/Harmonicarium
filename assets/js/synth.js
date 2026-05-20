 /**
 * @fileoverview Built-in reference synthesizer for the Harmonicarium application.
 * This file defines the {@link HUM.Synth} class which manages a simple Web Audio API–based
 * polyphonic synthesizer that plays the tones computed by the DHC, including
 * ADSR envelope, portamento, convolution reverb, and VU meter support.
 * The sub-components are defined in companion files:
 * - {@link module:synth-parameters} — `HUM.Synth.prototype.Parameters` class
 * - {@link module:synth-voice} — `HUM.Synth.prototype.SynthVoice` class
 * - {@link module:synth-ir-default} — default IR reverb data
 *
 * @module synth
 * @memberof HUM
 * @version 0.8.2
 * @author Walter G. Mantovani <armonici.it@gmail.com>
 * @copyright (C) 2017-2026 Walter G. Mantovani
 * @license AGPL-3.0-or-later
 *
 * @description
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
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
 * Built-in reference synthesizer for the Harmonicarium application.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The `HUM.Synth` class provides a simple Web Audio API–based polyphonic synthesizer
 * that plays the tones computed by the DHC in real-time. It manages:
 * - Polyphonic HT voices and a monophonic FT voice
 * - ADSR envelope, portamento, waveform, and volume controls
 * - Convolver-based reverb with wet/dry mixing and a dynamics compressor
 * - VU meter visualization via the webAudioPeakMeter library
 *
 * The {@link HUM.Synth.prototype.Parameters|Parameters} and
 * {@link HUM.Synth.prototype.SynthVoice|SynthVoice} inner classes are defined
 * in the companion {@link module:synth-parameters} and {@link module:synth-voice}
 * files and attached to `HUM.Synth.prototype` at load time.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API|Web Audio API}
 */
HUM.Synth = class {
    /**
     * Creates a new Synth instance and binds it to the given DHC.
     *
     * @param {HUM.DHC} dhc - The DHC instance to which this Synth belongs.
     *
     * @description
     * Initializes the synthesizer by:
     * 1. Creating the Web Audio API AudioContext.
     * 2. Setting up the voice slots for FT and HT tones.
     * 3. Creating and routing the gain, reverb, and compressor nodes.
     * 4. Attaching the VU meter.
     * 5. Creating and initializing the parameter management system.
     * 6. Registering this instance as a DHC subscriber for real-time updates.
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
         * The name of the `HUM.Synth`, useful for grouping the parameters on the DB.
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
         * Decoded `AudioBuffer`s for the FT and HT beat samples used by
         * Polyrhythm Mode. The FT slot is `null` until the user uploads a
         * sample. The HT slot is an array of up to 3 buffers (`null` when
         * empty) that are cycled in round-robin order across successive HT
         * key presses. Samples are session-only and are not persisted in
         * IndexedDB.
         *
         * @member {Object}
         *
         * @property {?AudioBuffer}    ft - FT beat sample.
         * @property {Array<?AudioBuffer>} ht - Up to 3 HT beat samples (slots 0–2).
         */
        this.beatBuffer = {
            ft: null,
            ht: [null, null, null],
        };

        /**
         * Monotonically-increasing counter of HT voices created in the current
         * session. Used to assign each new HT key press a beat-sample slot in
         * round-robin order. Resets to 0 on `allNotesOff()`.
         *
         * @member {number}
         */
        this.htPressCount = 0;

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
        // Sync the Synth panel visibility with the current Polyrhythm Mode state.
        this.parameters._applyPolyrhythmMode(this.dhc.polyrhythmMode);

        // Tell to the DHC that a new app is using it            
        this.dhc.registerApp(this, 'updatesFromDHC', 2);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Manages and routes an incoming DHC message to the appropriate handler.
     *
     * @param {HUM.DHCmsg} msg - The incoming message from the DHC.
     *
     * @description
     * Handles the following message commands:
     * - `panic`: Calls `allNotesOff()` to silence all active voices immediately.
     * - `update/ft`: Calls `updateFTfrequency()` to retune the active FT voice.
     * - `update/ht`: Calls `updateHTfrequency()` to retune all active HT voices.
     * - `tone-on`: Creates a new FT or HT voice via `voiceON()`.
     * - `tone-off`: Destroys the matching FT or HT voice via `voiceOFF()`.
     * HT 0 (Piper) tone-on/off events are silently ignored.
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

            } else if (msg.type === 'mode') {
                // Polyrhythm Mode toggled: re-apply panel visibility.
                this.parameters._applyPolyrhythmMode(this.dhc.polyrhythmMode);
            }

        } else if (msg.cmd === 'tone-on') {
            if (msg.type === 'ft') {

                this.voiceON("ft", msg.xtNum, msg.velocity, msg.continuum ? msg.hz : null);

            } else if (msg.type === 'ht') {

                if (msg.xtNum !== 0) {
                    this.voiceON("ht", msg.xtNum, msg.velocity, msg.continuum ? msg.hz : null);
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
     * Creates and starts a new synthesizer voice.
     *
     * @param {tonetype} type          - Whether the new voice is a Fundamental Tone (`"ft"`) or Harmonic Tone (`"ht"`).
     * @param {xtnum}    toneID        - The FT or HT tone number identifying the voice.
     * @param {velocity} velocity      - MIDI velocity (0–127) received from the controller.
     * @param {hertz}    [directHz=null] - Absolute frequency in Hz, used by continuum messages
     *                                    instead of a DHC table lookup. Pass `null` for discrete tones.
     *
     * @returns {void}
     *
     * @description
     * Creates a new {@link HUM.Synth#SynthVoice} for the given tone:
     * - **HT**: Adds a polyphonic voice keyed by `toneID`. Duplicate voices for
     *   the same `toneID` are skipped to prevent stuck-note duplication.
     * - **FT**: Mutes any existing FT voice, creates a new monophonic FT voice,
     *   then calls `updateHTfrequency()` to keep all HT oscillators in tune.
     * Does nothing if the synth power is off.
     */
    voiceON(type, toneID, velocity, directHz = null) {
        // For continuum tones the Hz is carried in the message; for discrete tones look up the table.
        let freq = directHz !== null ? directHz : this.dhc.tables[type][toneID].hz;
        // If the synth is turned-on
        if (this.parameters.status.value === true) {
            // In Polyrhythm Mode each tone becomes a recurring pulse instead of a sustained oscillator.
            const VoiceClass = this.dhc.polyrhythmMode ? this.BeatVoice : this.SynthVoice;
            
            // **HT**
            if (type === "ht") {
                // @todo - implement the limit of polyphony
                // If there isn't a voice turned on with the same toneID
                // (prevent duplication in case of stuck note - not turned off)
                if (!this.voices.ht[toneID]) {   // && Object.keys(this.voices.ht).length < 2
                    // Assign a beat-sample slot in round-robin order (Polyrhythm Mode only).
                    // In Overtones Mode slotIndex is ignored by SynthVoice.
                    let slotIndex = 0;
                    if (this.dhc.polyrhythmMode) {
                        const loadedSlots = this.beatBuffer.ht.filter(b => b !== null).length;
                        if (loadedSlots > 1) {
                            slotIndex = this.htPressCount % loadedSlots;
                        }
                        this.htPressCount++;
                    }
                    // Create a new HT voice (POLYPHONIC)
                    this.voices.ht[toneID] = new VoiceClass(this, freq, velocity, type, slotIndex);
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
                this.voices.ft = new VoiceClass(this, freq, velocity, type);
                // Update the frequency of all the HT oscillators because the FT is changed
                this.updateHTfrequency();
            }
        }
    }
    /**
     * Stops and destroys an active synthesizer voice.
     *
     * @param {tonetype} type   - Whether the voice to destroy is a FT (`"ft"`) or HT (`"ht"`).
     * @param {xtnum}    toneID - The FT or HT tone number identifying the voice.
     * @param {boolean}  panic  - If `true`, the message was generated by a hard All-Notes-Off request.
     *
     * @returns {void}
     *
     * @description
     * Mutes and removes the active voice identified by `type` and `toneID`:
     * - **HT**: Only mutes the voice if no other controller notes with the same
     *   HT number remain in the DHC play queue (handles multiple keys mapped to
     *   the same harmonic).
     * - **FT**: Only mutes the voice if there are no remaining FT notes with the
     *   same tone number in the play queue and the tone matches the current FT.
     * Does nothing if the synth power is off.
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
     * Silences all active synthesizer voices immediately.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all 128 possible HT voice slots and calls `voiceMute()` on
     * any active voice, then also mutes the FT voice if one is playing.
     * Used as a panic handler to clear stuck notes.
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
        // Prevent continuum HT stuck note (sentinel -1, outside the 0–127 loop above)
        if (this.voices.ht[HUM.DHCmsg.CONTINUUM_XTNUM]) {
            this.voices.ht[HUM.DHCmsg.CONTINUUM_XTNUM].voiceMute();
            this.voices.ht[HUM.DHCmsg.CONTINUUM_XTNUM] = null;
            delete this.voices.ht[HUM.DHCmsg.CONTINUUM_XTNUM];
        }
        // Prevent FT stuck notes
        if (this.voices.ft) {
            this.voices.ft.voiceMute();
        }
        // Reset the HT sample-slot round-robin counter so the next session
        // starts from sample 1 again.
        this.htPressCount = 0;
    }
    /**
     * Retunes the currently playing FT oscillator to its updated frequency.
     *
     * @returns {void}
     *
     * @description
     * Called when the Fundamental Tone frequency changes due to a UI setting
     * change. Reads the current FT frequency from the DHC tables and applies it
     * to the active FT voice via `setFrequency()`. Does nothing if no FT voice
     * is currently playing.
     */
    updateFTfrequency() {
        // A continuum FT has no table entry; the voice frequency was already set
        // when the tone-on was received, so no retune is needed here.
        if (this.dhc.settings.ht.curr_ft < 0) { return; }
        if (this.voices.ft !== null) {
            var ftObj = this.dhc.tables.ft[this.dhc.settings.ht.curr_ft];
            this.voices.ft.initFrequency = ftObj.hz;
            this.voices.ft.setFrequency(true);
        }
    }
    /**
     * Retunes all currently playing HT oscillators to their updated frequencies.
     *
     * @returns {void}
     *
     * @description
     * Called when the Fundamental Tone changes or on other UI setting changes
     * that affect the harmonic series. Iterates over all active HT voices and
     * updates each oscillator's frequency from the current DHC HT tables.
     */
    updateHTfrequency() {
        for (const [toneID, voice] of Object.entries(this.voices.ht)) {
            // Skip only the continuum HT voice (xtNum === CONTINUUM_XTNUM = -1);
            // subharmonics use negative indices too (-2…-128) but must retune.
            if (Number(toneID) === HUM.DHCmsg.CONTINUUM_XTNUM) { continue; }
            // Get the data about the HT from the ht table
            var htObj = this.dhc.tables.ht[toneID];
            // Set a new osc frequency and apply the change
            voice.initFrequency = htObj.hz;
            voice.setFrequency(true);
        }
    }

    /**
     * Applies the current pitch-bend amount (from the controller) to all active synthesizer voices.
     *
     * @returns {void}
     *
     * @description
     * Reads the current pitch-bend `amount` and `range` from the MIDI input
     * parameters and updates the `detune` property of every active HT and FT
     * oscillator. Detuning is expressed in cents: `amount` is normalized to
     * −1…+0.9999, `range` is in cents. Does nothing if the synth power is off.
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
     * Attempts to create a `ConvolverNode` for convolution reverb.
     *
     * @returns {ConvolverNode|GainNode} The new `ConvolverNode`, or a `GainNode`
     *   fallback if the browser does not support convolution reverb.
     *
     * @throws {Error} If the browser does not support `ConvolverNode`, an error is
     * 
     * @description
     * Tries to instantiate a `ConvolverNode` on the current `AudioContext`.
     * If the browser throws (no convolution support), shows an alert and returns
     * a plain `GainNode` as a transparent bypass.
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
     * Initiates reading an IR reverb file from disk.
     *
     * @param {File} file - The `File` object representing the IR wave file to load.
     *
     * @returns {void}
     *
     * @description
     * Creates a `FileReader` and reads the file as an `ArrayBuffer`. Once the
     * read completes, delegates to `loadIrFile()` to decode and apply the impulse
     * response to the convolver node. File-read errors are forwarded to the
     * backend utilities error handler.
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
     * Decodes and loads an IR reverb buffer onto the convolver node.
     *
     * @param {ArrayBuffer} data     - Raw binary audio data of the IR wave file.
     * @param {string}      fileName - Display name of the loaded file, used for the event log.
     *
     * @returns {void}
     *
     * @description
     * Decodes the raw `ArrayBuffer` using `AudioContext.decodeAudioData()` and
     * assigns the resulting `AudioBuffer` to `reverb.convolver.buffer`. After a
     * successful load, logs the file name, duration, channel count, and sample
     * rate to the backend event log.
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
     * Reads a beat-sample audio file (WAV or MP3) from disk and decodes it into
     * the `beatBuffer` slot for the given tone type. Used by Polyrhythm Mode.
     *
     * @param {tonetype} type - `"ft"` or `"ht"`: which beat slot to load into.
     * @param {File}     file - The `File` object representing the audio file.
     *
     * @returns {void}
     *
     * @description
     * Reads the file as `ArrayBuffer`, decodes it with
     * `AudioContext.decodeAudioData()`, and stores the resulting `AudioBuffer`
     * in `this.beatBuffer[type]`. Buffers are session-only (not persisted in
     * IndexedDB). Decode/read errors are logged via the backend event log.
     */
    readBeatSampleFile(type, file, slot = 0) {
        if (!file) { return; }
        if (type !== 'ft' && type !== 'ht') { return; }
        const reader = new FileReader();
        reader.onerror = this.dhc.harmonicarium.components.backendUtils.fileErrorHandler;
        reader.onload = (e) => {
            this.audioContext.decodeAudioData(e.target.result,
                (buffer) => {
                    if (type === 'ht') {
                        this.beatBuffer.ht[slot] = buffer;
                    } else {
                        this.beatBuffer.ft = buffer;
                    }
                    const slotLabel = type === 'ht' ? ' (slot ' + (slot + 1) + ')' : '';
                    this.dhc.harmonicarium.components.backendUtils.eventLog(
                        "Beat sample loaded (" + type.toUpperCase() + slotLabel + ").\n| filename: " + file.name +
                        "\n| duration: " + Math.round(buffer.duration * 1000) / 1000 + " sec" +
                        "\n| channels: " + buffer.numberOfChannels +
                        "\n| sample rate: " + buffer.sampleRate + " Hz" +
                        "\n| ---------------------");
                },
                (err) => {
                    this.dhc.harmonicarium.components.backendUtils.eventLog(
                        "Beat sample decode failed (" + type.toUpperCase() + "): " + file.name);
                    console.error("Beat sample decode failed:", err);
                }
            );
        };
        reader.readAsArrayBuffer(file);
    }
    /**
     * Converts a Base64-encoded data URI into a `File` object.
     *
     * @param {Object} file      - A file-like descriptor object.
     * @param {string} file.name - Filename for the resulting `File`.
     * @param {string} file.data - Data URI with a Base64-encoded payload (e.g. `"data:audio/wav;base64,..."`).
     *
     * @returns {File} A `File` object containing the decoded binary data.
     *
     * @see {@link https://gist.github.com/fupslot/5015897}
     *
     * @todo Rewrite looking here: {@link https://stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f}
     *       Way 2: Consider supporting plain URL references to wave files as well.
     *
     * @description
     * Splits the data URI into its MIME type and Base64 content, decodes the
     * Base64 string byte-by-byte into an `ArrayBuffer`, then wraps it in a
     * `File` with the provided filename and inferred MIME type. URLEncoded data
     * URIs are not handled by this method.
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
