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
         * Unified sample registry for Polyrhythm Mode.
         * Each entry: `{ id, name, color, buffer, isDefault }`.
         * The 4 default entries (kick/snare/hat/tom) are pre-loaded from
         * {@link HUM.Synth.defaultBeats}. User-uploaded samples are appended.
         * Samples are session-only and are not persisted in IndexedDB.
         *
         * @member {Array<{id:string, name:string, color:string, buffer:?AudioBuffer, isDefault:boolean}>}
         */
        this.sampleRegistry = [];

        /**
         * Color palette for auto-assigning colors to user-added samples.
         *
         * @member {string[]}
         * @private
         */
        this._colorPalette = ['#9b59b6', '#e67e22', '#1abc9c', '#e91e63', '#ff5722', '#00bcd4', '#cddc39'];

        /**
         * Index into `_colorPalette` for the next user-uploaded sample.
         *
         * @member {number}
         * @private
         */
        this._nextPaletteIdx = 0;

        /**
         * Round-robin counter for assigning samples to successive HT key presses
         * in Polyrhythm Mode. Each press increments this value; the sample index
         * is `_htPressCount % registry.length`. Resets to 0 on `allNotesOff()`.
         *
         * @member {number}
         * @private
         */
        this._htPressCount = 0;

        /**
         * Maps an active HT tone-ID to its `sampleRegistry` index so
         * `getColorForTone()` can return the color assigned at press time.
         * Entries are added in `voiceON` and deleted in `voiceOFF` / `allNotesOff`.
         *
         * @member {Object.<number, number>}
         * @private
         */
        this._voiceSlotMap = {};

        // Pre-load the 4 default beat samples from the bundled Base64 data.
        this._loadDefaultSamples();

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

        /**
         * Registered listeners that receive pulse-fire notifications in polyrhythm
         * mode. Each entry is a function `(type, xtNum)` called synchronously
         * (via a wall-clock `setTimeout`) when a BeatVoice pulse fires.
         *
         * @member {Function[]}
         */
        this._pulseListeners = [];

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
    /**
     * Registers a callback to be notified when a BeatVoice pulse fires.
     *
     * @param {Function} fn - `(type: tonetype, xtNum: xtnum) => void`
     * @returns {void}
     */
    addPulseListener(fn) {
        this._pulseListeners.push(fn);
    }

    /**
     * Removes a previously-registered pulse callback.
     *
     * @param {Function} fn - The same function reference passed to `addPulseListener`.
     * @returns {void}
     */
    removePulseListener(fn) {
        const idx = this._pulseListeners.indexOf(fn);
        if (idx !== -1) { this._pulseListeners.splice(idx, 1); }
    }

    /**
     * Calls all registered pulse listeners with the given tone type and number.
     *
     * @param {tonetype} type   - `'ft'` or `'ht'`
     * @param {xtnum}    xtNum  - The FT or HT tone number whose pulse just fired.
     * @returns {void}
     * @private
     */
    _dispatchPulse(type, xtNum) {
        for (const fn of this._pulseListeners) { fn(type, xtNum); }
    }

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

        } else if (msg.cmd === 'init') {
            // DHC has finished a full re-init (e.g. after IDB preset restore).
            // Re-sync the synth panel visibility with the now-correct mode.
            this.parameters._applyPolyrhythmMode(this.dhc.polyrhythmMode);

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
                    // Assign a sample slot round-robin so successive key presses cycle
                    // through the registry. The slot is stored in _voiceSlotMap so
                    // getColorForTone() can return the correct colour while the voice
                    // is active. In Overtones Mode slotIndex is ignored by SynthVoice.
                    let slotIndex = 0;
                    if (this.dhc.polyrhythmMode && this.sampleRegistry.length > 0) {
                        slotIndex = this._htPressCount % this.sampleRegistry.length;
                        this._htPressCount++;
                    }
                    this._voiceSlotMap[toneID] = slotIndex;
                    if (this.parameters) { this.parameters._renderSampleList(); }
                    // Create a new HT voice (POLYPHONIC)
                    const htVoice = new VoiceClass(this, freq, velocity, type, slotIndex);
                    // Wire pulse callback for visual sync (BeatVoice only; SynthVoice ignores it).
                    if (this.dhc.polyrhythmMode) {
                        htVoice.onPulse = () => this._dispatchPulse(type, toneID);
                    }
                    this.voices.ht[toneID] = htVoice;
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
                // Assign a sample slot round-robin (same logic as HT).
                let ftSlotIndex = 0;
                if (this.dhc.polyrhythmMode && this.sampleRegistry.length > 0) {
                    ftSlotIndex = this._htPressCount % this.sampleRegistry.length;
                    this._htPressCount++;
                }
                this._voiceSlotMap[toneID] = ftSlotIndex;
                if (this.parameters) { this.parameters._renderSampleList(); }
                // Create a new FT voice (MONOPHONIC)
                const ftVoice = new VoiceClass(this, freq, velocity, type, ftSlotIndex);
                // Wire pulse callback for visual sync (BeatVoice only; SynthVoice ignores it).
                if (this.dhc.polyrhythmMode) {
                    ftVoice.onPulse = () => this._dispatchPulse(type, toneID);
                }
                this.voices.ft = ftVoice;
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
                        delete this._voiceSlotMap[toneID];
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
                            delete this._voiceSlotMap[toneID];
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
        // Silence every active HT voice (harmonics 1–128, subharmonics −2 to −128,
        // and the continuum sentinel −1) by iterating the live keys of voices.ht.
        for (const key of Object.keys(this.voices.ht)) {
            if (this.voices.ht[key]) {
                this.voices.ht[key].voiceMute();
                delete this.voices.ht[key];
            }
        }
        // Prevent FT stuck notes
        if (this.voices.ft) {
            this.voices.ft.voiceMute();
        }
        // Reset sample-slot state so the next session starts fresh.
        this._htPressCount = 0;
        this._voiceSlotMap = {};
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
    /*==============================================================================*
     * SAMPLE REGISTRY (POLYRHYTHM MODE)
     *==============================================================================*/

    /**
     * Fixed default colors for the 4 built-in beat samples.
     *
     * @returns {{kick:string, snare:string, hat:string, tom:string}}
     * @private
     */
    static get _DEFAULT_SAMPLE_COLORS() {
        return { kick: '#e74c3c', snare: '#3498db', hat: '#f1c40f', tom: '#2ecc71' };
    }

    /**
     * Returns the sample registry color for a given tone in Polyrhythm Mode,
     * or `null` when outside Polyrhythm Mode or the registry is empty.
     *
     * In Polyrhythm Mode each HT tone number deterministically maps to a
     * registry entry via `Math.abs(xtNum) % registry.length`, guaranteeing
     * the DiphonicPad key color always matches the sample that will play.
     * FT always uses the first sample (index 0).
     *
     * @param {tonetype} type  - `'ft'` or `'ht'`
     * @param {xtnum}    xtNum - The FT or HT tone number.
     * @returns {string|null} CSS color string, or `null`.
     */
    getColorForTone(type, xtNum) {
        if (!this.dhc.polyrhythmMode || !this.sampleRegistry.length) { return null; }
        // Both FT and HT: look up the slot assigned at press time.
        // Returns null if the voice is not currently active.
        const slotIndex = this._voiceSlotMap[xtNum];
        if (slotIndex === undefined) { return null; }
        return this.sampleRegistry[slotIndex] ? this.sampleRegistry[slotIndex].color : null;
    }

    /**
     * Converts a CSS hex color (e.g. `'#e74c3c'`) to a 3-element HSL gradient
     * array `[lighter, base, darker]` compatible with the canvas drawing methods.
     *
     * @param {string} hex - A 6-digit hex CSS color string (`#rrggbb`).
     * @returns {string[]} Three HSL color strings.
     */
    static hexToGradient(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        const hD = Math.round(h * 360);
        const sD = Math.round(s * 100);
        const lD = Math.round(l * 100);
        return [
            `hsl(${hD}, ${sD}%, ${Math.min(95, Math.round(lD * 1.6))}%)`,
            `hsl(${hD}, ${sD}%, ${lD}%)`,
            `hsl(${hD}, ${Math.min(100, Math.round(sD * 1.5))}%, ${Math.max(5, Math.round(lD / 1.5))}%)`,
        ];
    }

    /**
     * Pre-loads the 4 default beat samples (kick/snare/hat/tom) from
     * `HUM.Synth.defaultBeats` into the beginning of `sampleRegistry`.
     *
     * @returns {void}
     * @private
     */
    _loadDefaultSamples() {
        if (!HUM.Synth.defaultBeats) { return; }
        const colors = HUM.Synth._DEFAULT_SAMPLE_COLORS;
        for (const [id, beat] of Object.entries(HUM.Synth.defaultBeats)) {
            this.sampleRegistry.push({ id, name: beat.name, color: colors[id] || '#888888', buffer: null, isDefault: true });
            this._decodeRegistrySample(beat.data, id);
        }
    }

    /**
     * Decodes a Base64 data-URI audio string and stores the resulting
     * `AudioBuffer` in the matching `sampleRegistry` entry.
     *
     * @param {string} base64DataUri - The `data:audio/wav;base64,…` string.
     * @param {string} id            - The `sampleRegistry` entry id to update.
     * @returns {void}
     * @private
     */
    _decodeRegistrySample(base64DataUri, id) {
        const file = HUM.Synth.base64ToFile({ name: id + '.wav', data: base64DataUri });
        const reader = new FileReader();
        reader.onload = (e) => {
            this.audioContext.decodeAudioData(e.target.result, (buffer) => {
                const entry = this.sampleRegistry.find(s => s.id === id);
                if (entry) { entry.buffer = buffer; }
            });
        };
        reader.readAsArrayBuffer(file);
    }

    /**
     * Decodes and appends a user-uploaded audio file to `sampleRegistry`,
     * assigns it the next palette color, then fires `'update/samples'`.
     *
     * @param {File} file - The audio file to add.
     * @returns {void}
     */
    addUserSample(file) {
        if (!file) { return; }
        const color = this._colorPalette[this._nextPaletteIdx % this._colorPalette.length];
        this._nextPaletteIdx++;
        const id = 'user_' + Date.now();
        const entry = { id, name: file.name, color, buffer: null, isDefault: false };
        this.sampleRegistry.push(entry);
        // Render immediately to show the loading placeholder.
        if (this.parameters) { this.parameters._renderSampleList(); }
        const reader = new FileReader();
        reader.onerror = this.dhc.harmonicarium.components.backendUtils.fileErrorHandler;
        reader.onload = (e) => {
            this.audioContext.decodeAudioData(
                e.target.result,
                (buffer) => {
                    entry.buffer = buffer;
                    this.dhc.harmonicarium.components.backendUtils.eventLog(
                        'Beat sample added: ' + file.name + '\n| ---------------------');
                    if (this.parameters) { this.parameters._renderSampleList(); }
                    this.dhc.sendMessageToApps(HUM.DHCmsg.samplesUpd('synth'));
                },
                () => {
                    // Decode failed: remove the pending entry.
                    const idx = this.sampleRegistry.indexOf(entry);
                    if (idx !== -1) { this.sampleRegistry.splice(idx, 1); this._nextPaletteIdx--; }
                    if (this.parameters) { this.parameters._renderSampleList(); }
                    this.dhc.harmonicarium.components.backendUtils.eventLog(
                        'Beat sample decode failed: ' + file.name);
                }
            );
        };
        reader.readAsArrayBuffer(file);
    }

    /**
     * Removes a user-added sample from the registry by its `id`.
     * Built-in default samples cannot be removed.
     * Fires `'update/samples'` after removal.
     *
     * @param {string} id - The sample id to remove.
     * @returns {void}
     */
    removeSample(id) {
        const idx = this.sampleRegistry.findIndex(s => s.id === id && !s.isDefault);
        if (idx === -1) { return; }
        this.sampleRegistry.splice(idx, 1);
        if (this.parameters) { this.parameters._renderSampleList(); }
        this.dhc.sendMessageToApps(HUM.DHCmsg.samplesUpd('synth'));
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
