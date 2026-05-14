/**
 * @fileoverview CssFont helper class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.CssFont} class, a simple
 * value object that bundles all CSS font properties needed to draw text on a
 * `CanvasRenderingContext2D`. It is split out from the main
 * {@link module:diphonicpad} module.
 *
 * @module diphonicpad-css-font
 * @memberof HUM.DpPad
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

/**
 * A simple value object that bundles all CSS font properties for canvas text.
 *
 * @class
 * @alias HUM.DpPad.CssFont
 *
 * @description
 * `CssFont` groups the six CSS font properties needed to draw text on a
 * `CanvasRenderingContext2D`. The {@link HUM.DpPad.CssFont#getCss} getter
 * assembles them into the shorthand string accepted by
 * `CanvasRenderingContext2D.font`. Instances are stored as parameter values
 * inside {@link HUM.DpPad.PadSet.prototype.Parameters#fonts}.
 */
    HUM.DpPad.CssFont = class {
    /**
     * @constructs HUM.DpPad.CssFont
     * 
     * @param {string} [style='']       - The CSS font-style.
     * @param {string} [weight='']      - The CSS font-weight.
     * @param {number} [size=12]        - The CSS font-size.
     * @param {string} [unit=px]        - The CSS font-size unit.
     * @param {string} [family='Arial'] - The CSS font-family.
     * @param {string} [color='black']  - The CSS color.
     */
    constructor(style, weight, size, unit, family, color) {
        this.style = style || ''; // italic
        this.weight = weight || ''; // bold
        this.size = size || 12;
        this.unit = unit || 'px';
        this.family = family || 'Arial';
        this.color = color || 'black';
    }
    /**
     * This is a getter property that returns the font definition string for applying it
     * to the `font` property of the `CanvasRenderingContext2D` objects.
     * This string uses the same syntax as the {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font|CSS font} specifier.
     * 
     * @member {string}
     */
    get getCss() {
        return [this.style, this.weight, this.getSize, this.family].filter(Boolean).join(' ');
    }
    /**
     * This is a getter property that returns the font-size definition string for using it
     * the `getCss` getter.
     * 
     * @member {string}
     */
    get getSize() {
        return this.size ? this.size + this.unit : '';
    }
};
