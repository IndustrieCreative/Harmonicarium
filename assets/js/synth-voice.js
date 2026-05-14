/**
 * @fileoverview SynthVoice class for the Harmonicarium built-in synthesizer.
 * This file defines the {@link HUM.Synth.prototype.SynthVoice|SynthVoice} class,
 * which encapsulates a single Web Audio API oscillator voice with its ADSR
 * envelope, velocity gain, portamento, and pitch-bend support. It is split
 * out from the main {@link module:synth} module.
 *
 * @module synth-voice
 * @memberof HUM.Synth
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

/*==============================================================================*
 * SYNTH VOICE
 *==============================================================================*/
/**
 * A single synthesizer voice for the {@link HUM.Synth} engine.
 *
 * @class
 * @memberof HUM.Synth
 *
 * @description
 * Encapsulates a single Web Audio API oscillator together with its envelope
 * and volume gain nodes. Each `SynthVoice` instance represents one played note
 * (either an FT or HT tone) and manages its own:
 * - Oscillator frequency with optional portamento
 * - ADSR envelope (Attack + Decay/Sustain at creation; Release on mute)
 * - Per-voice gain for MIDI velocity scaling
 * - Current pitch-bend detuning
 */
HUM.Synth.prototype.SynthVoice = class {
    /**
     * Creates and immediately starts a new synthesizer voice.
     *
     * @param {HUM.Synth} synth    - The parent `Synth` instance.
     * @param {hertz}     freq     - Initial frequency in hertz (Hz).
     * @param {velocity}  velocity - MIDI velocity (0–127) used to scale the voice gain.
     * @param {tonetype}  type     - Tone type: `"ft"` for Fundamental Tone, `"ht"` for Harmonic Tone.
     *
     * @description
     * Initializes and wires up the audio node graph for the voice:
     * 1. Sets the oscillator waveform from the synth parameters.
     * 2. Scales the volume gain node by the normalized velocity.
     * 3. Connects the node chain: oscillator → envelope → volume → gains[type].
     * 4. Applies portamento via `setFrequency()` (FT) or sets a direct value (HT).
     * 5. Applies any active pitch-bend detuning.
     * 6. Starts the oscillator and ramps the envelope through Attack and Decay/Sustain.
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
     * Updates the oscillator waveform type.
     *
     * @param {('sine'|'square'|'sawtooth'|'triangle')} waveform - The new waveform type.
     *
     * @returns {void}
     */
    setWaveform(waveform) {
        this.osc.type = waveform;
    }
    /**
     * Sets or updates the oscillator frequency, applying portamento when appropriate.
     *
     * @param {boolean} update - `false` to initialize a newly created voice;
     *                           `true` to retune an already-playing voice.
     *
     * @returns {void}
     *
     * @description
     * For new voices (`update === false`):
     * - FT: Ramps to the target frequency with the configured portamento time-constant
     *   and records `lastFreqFT` for the next voice's portamento start point.
     * - HT: Sets the frequency immediately with no portamento.
     * For playing voices (`update === true`):
     * - Both FT and HT ramp to the new frequency using the portamento time-constant.
     * In both cases the current pitch-bend detuning is applied to the oscillator.
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
     * Initiates the Release phase and schedules the oscillator to stop.
     *
     * @returns {void}
     *
     * @description
     * Cancels any scheduled envelope values, reads the current gain level, and
     * ramps it exponentially to near-zero over the configured release time.
     * The oscillator is stopped 200 ms after the release completes to avoid
     * audible clicks at the end of the note.
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
