/**
 * @fileoverview Xtone class for the Harmonicarium DHC.
 * This file defines the {@link HUM.DHC.prototype.Xtone|Xtone} class, a frozen
 * value object that stores one computed pitch as both a frequency in hertz and
 * a MIDI note number in midicent. It is split out from the main
 * {@link module:dhc} module.
 *
 * @module dhc-xtone
 * @memberof HUM.DHC
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
 * A frozen tone object representing one entry in the FT or HT lookup tables.
 *
 * @class
 * @memberof HUM.DHC
 *
 * @description
 * Encapsulates the two representations of a single computed pitch — its
 * frequency in hertz and its MIDI note number in midicent. Instances are
 * immediately frozen via `Object.freeze()` to guarantee immutability once
 * created.
 *
 * @example
 * // Instantiated internally when building FT/HT tables
 * const tone = new dhc.Xtone(440, 69); // A4
 * tone.hz; // 440
 * tone.mc; // 69
 */
HUM.DHC.prototype.Xtone = class {
    /**
     * Creates a new frozen Xtone instance.
     *
     * @param {hertz}    hz - Frequency expressed in hertz (Hz).
     * @param {midicent} mc - MIDI note number expressed in midicent.
     */
    constructor(hz, mc) {
        this.hz = Number(hz);
        this.mc = Number(mc);
        Object.freeze(this);
    }
};
