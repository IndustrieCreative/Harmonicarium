/**
 * @fileoverview VoiceAmbitus helper class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.VoiceAmbitus} class,
 * a value object that stores a named frequency ambitus (range) expressed in hertz,
 * midicents, and scientific pitch notation simultaneously. It is split out from
 * the main {@link module:diphonicpad} module.
 *
 * @module diphonicpad-voice-ambitus
 * @memberof HUM.DpPad
 * @version 0.8.1
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

/**
 * Defines a named frequency ambitus (range) for one pad type.
 *
 * @class
 * @alias HUM.DpPad.VoiceAmbitus
 *
 * @description
 * A `VoiceAmbitus` stores the same frequency range expressed in three
 * parallel representations — hertz, midicent, and scientific pitch
 * notation — so that any part of the application can read whichever unit
 * it needs without re-converting. Instances are created for every named
 * range preset (e.g. `'tenore'`, `'soprano'`, `'normal'`) and stored on
 * the ambitus parameter's `presets` object.
 */
HUM.DpPad.VoiceAmbitus = class {
    /**
     * @constructs HUM.DpPad.VoiceAmbitus
     * 
     * @param {tonetype}                      type - If the ambitus is intended for FTs or HTs.
     * @param {string}                        name - The name of the new ambitus.
     * @param {('hz'|'mc'|'scientific'|'ui')} mode - The measurement mode by which `min` and `max` parameters are expressed.
     * @param {(string|number)}               min  - The minimum frequency, expressed as number if the `mode` is `'hz'` or `'mc'`, 
     *                                               or expressed as note-name string if the `mode` is `'scientific'` or `'ui'`.
     * @param {(string|number)}               max  - The maximum frequency, expressed as number if the `mode` is `'hz'` or `'mc'`, 
     *                                               or expressed as note-name string if the `mode` is `'scientific'` or `'ui'`.
     * @param {HUM}                           dhc  - The DHC instance to which this VoiceAmbitus must refer.
     */
    constructor(type, name, mode, min, max, dhc) {
        /**
         * The voice/tone type of this ambitus.
         *
         * @member {tonetype}
         */
        this.type = type;
        /**
         * The DHC instance
         *
         * @member {HUM.DHC}
         */
        this.dhc = dhc;
        /**
         * The name of this ambitus. Useful to identificate it on the UI.
         *
         * @member {string}
         */
        this.name = '';
        /**
          * The ambitus range, expressed in hertz.
          *
          * @member {Object}
          *
          * @property {hertz} min - The minimum frequency of the ambius, in hertz.
          * @property {hertz} max - The maximum frequency of the ambius, in hertz.
          */
        this.hz = {
            min: 0,
            max: 0
        };
        /**
         * The ambitus range, expressed in midicent.
         *
         * @member {Object}
         *
         * @property {hertz} min - The minimum frequency of the ambius, in midicent.
         * @property {hertz} max - The maximum frequency of the ambius, in midicent.
         */
        this.mc = {
            min: 0,
            max: 0
        };
        /**
         * The ambitus range, expressed as note-name in scientific pitch notation.
         * NOTE: the cents offset is omitted.
         *
         * @member {Object}
         *
         * @property {string} min - The minimum frequency of the ambius, in scientific pitch notation.
         * @property {string} max - The maximum frequency of the ambius, in scientific pitch notation.
         */
        this.note = {
            min: '',
            max: ''
        };
        this._setRange(name, mode, min, max);
    }
    /**
     * This method sets the range expressed in any mode.
     * 
     * @param {string}                        name - The name of the new ambitus.
     * @param {('hz'|'mc'|'scientific'|'ui')} mode - The measurement mode by which `min` and `max` parameters are expressed.
     * @param {(string|number)}               min  - The minimum frequency, expressed as number if the `mode` is `'hz'` or `'mc'`, 
     *                                               or expressed as note-name string if the `mode` is `'scientific'` or `'ui'`.
     * @param {(string|number)}               max  - The maximum frequency, expressed as number if the `mode` is `'hz'` or `'mc'`, 
     *                                               or expressed as note-name string if the `mode` is `'scientific'` or `'ui'`.
     */
    _setRange(name, mode, min, max) {
        this.name = name;
        if (mode === 'hz') {
            this.hz.min = min;
            this.hz.max = max;
            this.mc.min = HUM.DHC.freqToMc(min);
            this.mc.max = HUM.DHC.freqToMc(max);
            this.note.min = this.dhc.midiNumberToNames(Math.round(this.mc.min))[3];
            this.note.max = this.dhc.midiNumberToNames(Math.round(this.mc.max))[3]; 
        } else if (mode === 'mc') {
            this.mc.min = min;
            this.mc.max = max;
            this.hz.min = HUM.DHC.mcToFreq(min);
            this.hz.max = HUM.DHC.mcToFreq(max);
            this.note.min = this.dhc.midiNumberToNames(Math.round(min))[3];
            this.note.max = this.dhc.midiNumberToNames(Math.round(max))[3]; 
        } else if ( ['scientific', 'ui'].includes(mode)) {
            this.note.min = min;
            this.note.max = max; 
            this.mc.min = this.dhc.nameToMidiNumber(mode, min);
            this.mc.max = this.dhc.nameToMidiNumber(mode, max);
            this.hz.min = HUM.DHC.mcToFreq(this.mc.min);
            this.hz.max = HUM.DHC.mcToFreq(this.mc.max);
        } 
    }
    /**
     * This is a getter property that returns, the ambitus range expressed as note-name in "UI notation".
     * (currently not used - deprecate it?)
     *
     * @member {Object}
     *
     * @property {string} min - The minimum frequency of the ambius, in UI notation.
     * @property {string} max - The maximum frequency of the ambius, in UI notation.
     */
    get noteUI() {
        return {
            min: this.dhc.midiNumberToNames(Math.round(this.mc.min))[1],
            max: this.dhc.midiNumberToNames(Math.round(this.mc.min))[1]
        };
    }
};
