/**
 * @fileoverview Diphonic Pad touch/mouse interface for the Harmonicarium application.
 * This file defines the HUM.DpPad class, which implements the primary graphical
 * user interface designed for touch and mobile devices. It renders two canvas-based
 * frequency pads (FT and HT) side-by-side with an SVG toolbar, reacting to pointer
 * and touch events to drive the DHC in real-time.
 *
 * @module diphonicpad
 * @memberof HUM
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

/* "requestAnimationFrame" Fallback method
   requestAnimFrame shim layer by Paul Irish
 */
// var requestAnimFrame = (function(){
//     return  window.requestAnimationFrame       || 
//             window.webkitRequestAnimationFrame || 
//             window.mozRequestAnimationFrame    || 
//             window.oRequestAnimationFrame      || 
//             window.msRequestAnimationFrame     || 
//             function(callback, element){
//                 window.setTimeout(callback, 1000 / 60);
//             };
// })();


/**
 * Diphonic Pad component for the Harmonicarium application.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * `HUM.DpPad` is an immediately-invoked function expression (IIFE) that
 * defines and returns the {@link HUM.DpPad~DpPad|DpPad} constructor together
 * with its inner helper classes ({@link HUM.DpPad~VoiceAmbitus|VoiceAmbitus},
 * {@link HUM.DpPad~CssFont|CssFont}) and static sub-classes
 * ({@link HUM.DpPad.PadSet|PadSet}, {@link HUM.DpPad.PadSet.Toolbar|Toolbar},
 * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad}).
 *
 * It provides a full-screen, logarithmic-frequency canvas interface where the
 * left pad represents Fundamental Tones (FT) and the right pad represents
 * Harmonic Tones (HT). Pointer and touch events are mapped to note-on/off
 * messages dispatched to the DHC.
 *
 * @example
 * // Instantiated internally by HUM during initialization
 * harmonicarium.components.dpPad = new HUM.DpPad(harmonicarium, dhc);
 * harmonicarium.components.dpPad.init();
 */
HUM.DpPad = function() {

    /*  __      __   _                             _     _ _             
     *  \ \    / /  (_)            /\             | |   (_) |            
     *   \ \  / /__  _  ___ ___   /  \   _ __ ___ | |__  _| |_ _   _ ___ 
     *    \ \/ / _ \| |/ __/ _ \ / /\ \ | '_ ` _ \| '_ \| | __| | | / __|
     *     \  / (_) | | (_|  __// ____ \| | | | | | |_) | | |_| |_| \__ \
     *      \/ \___/|_|\___\___/_/    \_\_| |_| |_|_.__/|_|\__|\__,_|___/
     */
    /**
     * Defines a named frequency ambitus (range) for one pad type.
     *
     * @class
     * @alias HUM.DpPad~VoiceAmbitus
     * @inner
     *
     * @description
     * A `VoiceAmbitus` stores the same frequency range expressed in three
     * parallel representations — hertz, midicent, and scientific pitch
     * notation — so that any part of the application can read whichever unit
     * it needs without re-converting. Instances are created for every named
     * range preset (e.g. `'tenore'`, `'soprano'`, `'normal'`) and stored on
     * the ambitus parameter's `presets` object.
     */
    class VoiceAmbitus {
        /**
         * @constructs HUM.DpPad~VoiceAmbitus
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
    }

    /*    _____         ______          _   
     *   / ____|       |  ____|        | |  
     *  | |     ___ ___| |__ ___  _ __ | |_ 
     *  | |    / __/ __|  __/ _ \| '_ \| __|
     *  | |____\__ \__ \ | | (_) | | | | |_ 
     *   \_____|___/___/_|  \___/|_| |_|\__|
     */
    /**
     * A simple value object that bundles all CSS font properties for canvas text.
     *
     * @class
     * @alias HUM.DpPad~CssFont
     * @inner
     *
     * @description
     * `CssFont` groups the six CSS font properties needed to draw text on a
     * `CanvasRenderingContext2D`. The {@link HUM.DpPad~CssFont#getCss} getter
     * assembles them into the shorthand string accepted by
     * `CanvasRenderingContext2D.font`. Instances are stored as parameter values
     * inside {@link HUM.DpPad.PadSet.prototype.Parameters#fonts}.
     */
    class CssFont {
        /**
         * @constructs HUM.DpPad~CssFont
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
    }

    /*  _____        _____          _ 
     * |  __ \      |  __ \        | |
     * | |  | |_ __ | |__) |_ _  __| |
     * | |  | | '_ \|  ___/ _` |/ _` |
     * | |__| | |_) | |  | (_| | (_| |
     * |_____/| .__/|_|   \__,_|\__,_|
     *        | |                     
     *        |_|                     
     */
    /**
     * The Diphonic Pad main class.
     *
     * @class
     * @exports HUM.DpPad
     * @inner
     *
     * @description
     * `DpPad` is the top-level controller for the Diphonic Pad interface. It
     * owns one or more {@link HUM.DpPad.PadSet|PadSet} instances and handles
     * application-wide concerns:
     * - Viewport dimension tracking and canvas resize propagation.
     * - Global mouse-up event handling shared across all pad canvases.
     * - Logarithmic frequency↔pixel conversion used by all pads.
     * - View rotation between portrait and landscape orientations.
     *
     * @example
     * const dpPad = new HUM.DpPad(harmonicarium, dhc);
     * dpPad.init();
     */
    class DpPad {
        /**
         * Creates a new DpPad instance bound to a HUM instance.
         *
         * @param {HUM}      harmonicarium - The HUM instance to which this DpPad must refer.
         * @param {HUM.DHC=} dhc           - A DHC. If the argument is not passed to the constructor, a new DHC will be created.
         *                                   (untested, work in progress).
         *
         * @description
         * Initializes all instance properties to their default values.
         * Does not create the canvas elements or register event listeners;
         * call {@link HUM.DpPad~DpPad#init|init()} after construction.
         */
        constructor(harmonicarium, dhc=false) {
            /**
            * The id of this `HUM.DpPad`. It's the same of the HUM instance passed to the constructor.
            *
            * @member {number}
            */
            this.id = harmonicarium.id;
            this._id = harmonicarium.id;
            /**
             * The name of the `HUM.DpPad`, useful for group the parameters on the DB.
             * Currently hard-coded as `"dpPad"`.
             *
             * @member {string}
             */
            this.name = 'dpPad';
            /**
             * The HUM instance passed to the constructor.
             *
             * @member {HUM}
             */
            this.harmonicarium = harmonicarium;
            /**
             * The DHC instance.
             * NOTE: 'dhc' === false is meant for stand-alone distributions of the Diphonic Pad
             *
             * @member {HUM.DHC}
             */
            this.dhc = dhc;
            /**
             * The container of the PadSets.
             *
             * @member {Array.<HUM.DpPad~PadSet>}
             */
            this.padSets = new Array();
            /**
             * DpPad main hard-coded parameters namespace.
             *
             * @member {Object}
             *
             * @property {string} orientation     - The main orientation.
             * @property {number} numberOfSets    - The number of PadSet. Multi-sets implementation is work in progress (leave 1)
             * @property {Object} refDimensions   - The standard reference dimension namespace. X and Y are to be intended at 
             *                                      VERTICAL 'orientation' 16:9 aspect ratio @ 4K UHD.
             * @property {number} refDimensions.x - The width reference, in pixels.
             * @property {number} refDimensions.y - The height reference, in pixels.
             */
            this.settings = {
                orientation: 'vertical',
                numberOfSets: 1,
                refDimensions: {
                    x: 768, // 2160,
                    y: 1366 // 3840
                }
            };
            /**
             * Current viewport dimension namespace.
             *
             * @member {Object}
             *
             * @property {number} x - The width of the viewport, in pixels.
             * @property {number} y - The height of the viewport, in pixels.
             */
            this.viewportDim = {
                x: 0,
                y: 0
            };
            /**
             * A namespace for the parameters useful to keep track of the mouse position and its left-button status.
             *
             * @member {Object}
             *
             * @property {number}  x      - The current horizontal position.
             * @property {number}  y      - The current vertical position.
             * @property {boolean} down   - If the left button of the mouse is pressed.
             * @property {number}  last   - Coordinates namespace to keep track of the old/last position when drawing a line.
             *                              They are set to false at the start to indicate that we don't have a good value for it yet.
             * @property {number}  last.x - The last horizontal position.
             * @property {number}  last.y - The last vertical position.
             */
            this.mouse = {
                x: null,
                y: null,
                down: false,
                last: { 
                    x: false,
                    y: false
                }
            };
        }
        /**
         * Sets up canvases and registers event handlers after the page has loaded.
         *
         * @returns {void}
         *
         * @description
         * Registers the global `mouseup` listener on `window` (needed because
         * the mouseup may fire outside the canvas). Then creates all
         * {@link HUM.DpPad.PadSet|PadSet} instances up to `settings.numberOfSets`,
         * injecting them into the DOM and binding them to the DHC.
         */
        init() {
            // Since we are listening to the entire window for the mouseup, it only needs to be done once per page,
            // and not once per canvas
            window.addEventListener('mouseup', this.mouseUp.bind(this), false);
            // window.addEventListener('resize', this.windowResize.bind(this), false);

            // todo: delete and redraw all (if new set is added)
            let existingPads = this.padSets.length;
            let padsToAdd = this.settings.numberOfSets - existingPads;
            for (let n=existingPads; n<padsToAdd; n++) {
                let hrmID = this.harmonicarium.id;
                let padSetID = hrmID+'-'+n;
                // Provides the "dhc" parameter only if the dpPad parent component (this) has one
                this.padSets[n] = new DpPad.PadSet(padSetID, n, this, (!this.dhc ? false : this.dhc));
            }
        }
        /**
         * Handles the global `mouseup` event and delegates note-off to all pads.
         *
         * @param {MouseEvent} evt - The mouse-up event.
         *
         * @returns {void}
         *
         * @description
         * Updates the shared mouse position, then calls `mouseUp()` on the FT
         * pad, HT pad, and toolbar of every PadSet. Resets `mouse.down` and
         * the last-position coordinates after all pads have had a chance to
         * process the final pointer location.
         */
        mouseUp(evt) {
            this.updateMousePosition(evt);
            for (let padSet of this.padSets) {
                padSet.ft.mouseUp();
                padSet.ht.mouseUp();
                padSet.toolbar.mouseUp(evt);
            }
            // Reset the mouse AFTER the single pad mouseUp
            // So that if you have to do something with the last mouse position, you can do it before you lose the data.
            this.mouse.down = false;
            // Reset lastX and lastY to false to indicate that they are now invalid, since we have lifted the "pen"
            this.mouse.last.x = false;
            this.mouse.last.y = false;

        }
        /**
         * Updates the shared mouse coordinates from a DOM mouse/pointer event.
         *
         * @param {MouseEvent} evt - The moving mouse event.
         *
         * @returns {void}
         *
         * @description
         * Reads `offsetX`/`offsetY` (or falls back to `layerX`/`layerY`) and
         * writes the values into {@link HUM.DpPad~DpPad#mouse|mouse.x / mouse.y}.
         * Called before any hit-testing logic so that the stored coordinates
         * are always up-to-date.
         */
        updateMousePosition(evt) {
            if (evt.offsetX) {
                this.mouse.x = evt.offsetX;
                this.mouse.y = evt.offsetY;
            }
            else if (evt.layerX) {
                this.mouse.x = evt.layerX;
                this.mouse.y = evt.layerY;
            }
        }
        /**
         * Reads the DpPad HTML container's current pixel dimensions and caches them.
         * Update the viewport size of the DpPad HTML container.
         *
         * @returns {void}
         *
         * @description
         * Queries `clientWidth` and `clientHeight` of the
         * `harmonicarium.html.dpPadContainer` element and stores the result
         * in {@link HUM.DpPad~DpPad#viewportDim}. Called by
         * {@link HUM.DpPad~DpPad#windowResize|windowResize()} before
         * recomputing canvas dimensions.
         */
        updateViewportSize() {
            this.viewportDim.x = this.harmonicarium.html.dpPadContainer.clientWidth;
            this.viewportDim.y = this.harmonicarium.html.dpPadContainer.clientHeight;
        }
        /**
         * Switches the pad layout between portrait (vertical) and landscape (horizontal).
         *
         * @param {('horizontal'|'vertical')=} [value] - Target orientation. Omit to toggle.
         *
         * @returns {void}
         *
         * @description
         * When called without an argument the orientation alternates between
         * `'vertical'` and `'horizontal'` and the change is propagated to all
         * PadSet parameter stores. Regardless of the call mode, each PadSet's
         * FT and HT scale orientations are switched via
         * {@link HUM.DpPad.PadSet.FrequencyPad#switchScaleOrientation} and the
         * pads are re-arranged, followed by a full
         * {@link HUM.DpPad~DpPad#windowResize|windowResize()}.
         */
        rotateView(value=false) {
            // Set
            if (value) {
                if (this.settings.orientation !== value) {
                    this.settings.orientation = value;
                } else {
                    return;
                }
            // Switch
            } else {
                this.settings.orientation = this.settings.orientation === 'vertical' ? 'horizontal' : 'vertical';
                for (let padSet of this.padSets) {
                    padSet.parameters.main_orientation.value = this.settings.orientation;
                    // padSet.parameters.main_orientation.uiElements.in.dppad_main_orientation.value = this.settings.orientation;
                }
            }
            for (let padSet of this.padSets) {
                padSet.ft.switchScaleOrientation();
                padSet.ht.switchScaleOrientation();
                padSet.arrangePads();
            }
            this.windowResize();
        }
        /**
         * Handles a window resize event by recomputing all canvas dimensions.
         *
         * @returns {void}
         *
         * @description
         * Calls {@link HUM.DpPad~DpPad#updateViewportSize|updateViewportSize()}
         * to refresh the cached container size, then recalculates and applies
         * the CSS and pixel dimensions of every toolbar SVG and FT/HT canvas
         * for each PadSet — accounting for the current orientation, toolbar
         * placement, pad ratio, and HiDPI pixel ratio. Finally, triggers a full
         * redraw of all pads by calling `refillFreqArrays()` and `drawFreqUI()`.
         */
        windowResize() {
            this.updateViewportSize();
            let pixScale = window.devicePixelRatio;

            let tbWidth, tbHeight,
                ftCnvWidth, ftCnvHeight,
                htCnvWidth, htCnvHeight;

            for (let padSet of this.padSets) { 
                let numberOfSets = this.settings.numberOfSets,
                    padsRatio = padSet.parameters.padsRatio;
                // First calculate CSS dimensions
                if (this.settings.orientation === 'vertical') {

                    if (padSet.parameters.toolbarOrientation.value === 'longitudinal') {
                        tbWidth = (this.viewportDim.x * padsRatio.tbLong) / numberOfSets;
                        tbHeight = this.viewportDim.y;

                        ftCnvWidth =  Math.floor( ((this.viewportDim.x - tbWidth) * padsRatio.ft) / numberOfSets )-1;
                        ftCnvHeight = Math.floor( this.viewportDim.y )-1;
                        htCnvWidth =  Math.floor( ((this.viewportDim.x - tbWidth)* padsRatio.ht) / numberOfSets )-1;
                        htCnvHeight = Math.floor( this.viewportDim.y )-1;

                    
                    } else if (padSet.parameters.toolbarOrientation.value === 'transversal') {
                        tbWidth = this.viewportDim.x / numberOfSets;
                        tbHeight = this.viewportDim.y * padsRatio.tbLong;

                        ftCnvWidth = Math.floor( (this.viewportDim.x * padsRatio.ft) / numberOfSets )-1;
                        ftCnvHeight = Math.floor( this.viewportDim.y - tbHeight )-1;
                        htCnvWidth = Math.floor( (this.viewportDim.x * padsRatio.ht) / numberOfSets )-1;
                        htCnvHeight = Math.floor( this.viewportDim.y - tbHeight )-1;
                    }

                } else if (this.settings.orientation === 'horizontal') {

                    if (padSet.parameters.toolbarOrientation.value === 'longitudinal') {
                        tbWidth = this.viewportDim.x / numberOfSets;
                        tbHeight = this.viewportDim.y * padsRatio.tbLong;

                        ftCnvWidth = Math.floor( this.viewportDim.x )-1;
                        ftCnvHeight = Math.floor( ((this.viewportDim.y - tbHeight) * padsRatio.ft) / numberOfSets )-1;
                        htCnvWidth = Math.floor( this.viewportDim.x )-1;
                        htCnvHeight = Math.floor( ((this.viewportDim.y - tbHeight)* padsRatio.ht) / numberOfSets )-1;
                    
                    } else if (padSet.parameters.toolbarOrientation.value === 'transversal') {
                        tbWidth = (this.viewportDim.x * padsRatio.tbLong) / numberOfSets;
                        tbHeight = this.viewportDim.y;

                        ftCnvWidth = Math.floor( this.viewportDim.x - tbWidth )-1;
                        ftCnvHeight = Math.floor( (this.viewportDim.y * padsRatio.ft) / numberOfSets )-1;
                        htCnvWidth = Math.floor( this.viewportDim.x - tbWidth )-1;
                        htCnvHeight = Math.floor( (this.viewportDim.y * padsRatio.ht) / numberOfSets )-1;
                    }
                }

                padSet.toolbar.svg.setAttributeNS(null, 'width',  Math.floor(tbWidth) );
                padSet.toolbar.svg.setAttributeNS(null, 'height', Math.floor(tbHeight));
                // padSet.toolbar.svg.setAttributeNS(null, 'viewBox', `0 0 ${Math.floor(tbWidth)} ${Math.floor(tbHeight)}`);
                padSet.toolbar.cssDimensions.width = Math.floor(tbWidth);
                padSet.toolbar.cssDimensions.height = Math.floor(tbHeight);
                
                // Then write CSS dimensions and HIDPI scale resolution
                if (padSet.parameters.renderMode.value === 'classic') {

                    padSet.ft.canvas.width = ftCnvWidth;
                    padSet.ft.canvas.height = ftCnvHeight;
                    padSet.ht.canvas.width = htCnvWidth;
                    padSet.ht.canvas.height = htCnvHeight;

                    padSet.ft.cssDimensions.width = ftCnvWidth;
                    padSet.ft.cssDimensions.height = ftCnvHeight;
                    padSet.ht.cssDimensions.width = htCnvWidth;
                    padSet.ht.cssDimensions.height = htCnvHeight;

                } else if (padSet.parameters.renderMode.value === 'hidpi') {

                    padSet.ft.canvas.style.width = ftCnvWidth + 'px';
                    padSet.ft.canvas.style.height = ftCnvHeight + 'px';
                    padSet.ht.canvas.style.width = htCnvWidth + 'px';
                    padSet.ht.canvas.style.height = htCnvHeight + 'px';

                    padSet.ft.canvas.width = Math.floor((padSet.ft.canvas.clientWidth * pixScale) / numberOfSets);
                    padSet.ft.canvas.height = Math.floor(padSet.ft.canvas.clientHeight * pixScale);
                    padSet.ht.canvas.width = Math.floor((padSet.ht.canvas.clientWidth * pixScale) / numberOfSets);
                    padSet.ht.canvas.height =  Math.floor(padSet.ht.canvas.clientHeight * pixScale);

                    padSet.ft.ctx.scale(pixScale, pixScale);
                    padSet.ht.ctx.scale(pixScale, pixScale);

                    padSet.ft.cssDimensions.width = padSet.ft.canvas.clientWidth;
                    padSet.ft.cssDimensions.height = padSet.ft.canvas.clientHeight;
                    padSet.ht.cssDimensions.width = padSet.ht.canvas.clientWidth;
                    padSet.ht.cssDimensions.height = padSet.ht.canvas.clientHeight;
                }
            
            }

            // For every padSet created
            for (let padSet of this.padSets) {
                // If the DHC is connected, initialize the Scales
                if (padSet.dhc) {
                    for (let type of ['ft', 'ht']) {
                        padSet[type].refillFreqArrays();
                        padSet[type].drawFreqUI();
                    }
                    padSet.toolbar.drawIcons();
                } else {
                    alert('The padSet [ '+ padSet.id +' ] has no DHC connected!\n\nPlease, verify the code.');
                }
            }
        }
        /**
         * Converts a frequency value to a pixel position using a logarithmic scale.
         *
         * @param {hertz}  frequency       - The frequency to be converted to a pixel length.
         * @param {Object} rangePreset     - The frequency range represented by the `pxMaxLength` parameter.
         * @param {hertz}  rangePreset.min - Minimum frequency of the range.
         * @param {hertz}  rangePreset.max - Maximum frequency of the range.
         * @param {number} pxMaxLength     - The length of the range in pixels.
         *
         * @returns {number} The pixel position within `[0, pxMaxLength]` for the given frequency.
         */
        freqToPix(frequency, rangePreset, pxMaxLength) {
            let freqMin = Math.log(rangePreset.min.value) / Math.log(10),
                freqMax = Math.log(rangePreset.max.value) / Math.log(10),
                range = freqMax - freqMin,
                pxPosition = (Math.log(frequency) / Math.log(10) - freqMin) / range * pxMaxLength;
            return pxPosition;
        }
        /**
         * Converts a pixel position back to a frequency value using a logarithmic scale.
         *
         * @param {number} pxPosition      - The pixel position within the range.
         * @param {Object} rangePreset     - The frequency range represented by the `pxMaxLength` parameter.
         * @param {hertz}  rangePreset.min - Minimum frequency of the range.
         * @param {hertz}  rangePreset.max - Maximum frequency of the range.
         * @param {number} pxMaxLength     - The length of the range in pixels.
         *
         * @returns {hertz} The frequency corresponding to the given pixel position.
         */
        pixToFreq(pxPosition, rangePreset, pxMaxLength){
            let freqMin = Math.log(rangePreset.min.value) / Math.log(10),
                freqMax = Math.log(rangePreset.max.value) / Math.log(10),
                range = freqMax - freqMin,
                frequency = Math.pow(10, pxPosition * (range / pxMaxLength) + freqMin);
            return frequency;
        }
    }

    /*   _____          _  _____      _   
     *  |  __ \        | |/ ____|    | |  
     *  | |__) |_ _  __| | (___   ___| |_ 
     *  |  ___/ _` |/ _` |\___ \ / _ \ __|
     *  | |  | (_| | (_| |____) |  __/ |_ 
     *  |_|   \__,_|\__,_|_____/ \___|\__|
     */
    /**
     * A single Diphonic Pad set, consisting of two canvas pads and an SVG toolbar.
     *
     * @class
     * @memberof HUM.DpPad
     * @static
     *
     * @description
     * `DpPad.PadSet` manages the complete set of UI elements for one
     * playable instance:
     * - An FT {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} that shows
     *   Fundamental Tones on a logarithmic canvas.
     * - An HT {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} that shows
     *   Harmonic Tones on a logarithmic canvas.
     * - A {@link HUM.DpPad.PadSet.Toolbar|Toolbar} rendered in an SVG element.
     *
     * It also registers itself with the DHC so it receives real-time update
     * callbacks (`updatesFromDHC`) whenever the fundamental or harmonic tone
     * data changes.
     *
     * @example
     * // PadSet is instantiated internally by DpPad.init()
     * const padSet = new DpPad.PadSet('1-0', 0, dpPadComponent, dhc);
     */
    DpPad.PadSet = class {
        /**
         * Creates a new PadSet, builds all DOM/SVG elements, and initializes sub-components.
         *
         * @param {string}    setKey         - The ID key of the PadSet (e.g. `'1-0'`).
         * @param {number}    idx            - The sequential index of this PadSet within its DpPad.
         * @param {HUM.DpPad} dpPadComponent - The `HUM.DpPad` instance to which this PadSet must refer.
         * @param {HUM.DHC=}  dhc            - The DHC instance to be used by this PadSet.
         *                                     NOTE: If a DHC is passed, use that, else create its own DHC.
         *
         * @description
         * During construction this method:
         * 1. Creates and appends all container `<div>` and `<canvas>` elements
         *    to the DpPad container in the DOM.
         * 2. Creates the accordion tab HTML via `HUM.tmpl` and injects the
         *    Diphonic Pad settings box into the side panel.
         * 3. Instantiates the {@link HUM.DpPad.PadSet.prototype.Parameters|Parameters},
         *    FT and HT {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad}, and
         *    {@link HUM.DpPad.PadSet.Toolbar|Toolbar} objects.
         * 4. Calls `parameters._init()` and `arrangePads()` to finalize layout.
         * 5. Registers itself with the DHC for real-time callbacks at priority 101.
         *
         * @todo For `dhc` parameters, it's needed to check empty/available keys in
         *       `harmonicarium.availableDHCs`. The `setKey` currently can create
         *       conflicts with the main app if `dhc` is not provided.
         */
        constructor(setKey, idx, dpPadComponent, dhc=new HUM.DHC(setKey)) {
            let appDiv = dpPadComponent.harmonicarium.html.dpPadContainer,
                
                setDiv = document.createElement('div'),
                ftDiv = document.createElement('div'),
                htDiv = document.createElement('div'),
                tbarDiv = document.createElement('div'),
                
                ftCanvas = document.createElement('canvas'),
                htCanvas = document.createElement('canvas'),
                tbarSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            
            setDiv.id = 'dpSet'+setKey;
            ftDiv.id = 'padFT'+setKey;
            htDiv.id = 'padHT'+setKey;
            tbarDiv.id = 'toolbar'+setKey;
            
            ftCanvas.id = 'canvasFT'+setKey;
            htCanvas.id = 'canvaspadHT'+setKey;
            tbarSvg.id = 'svgToolbar'+setKey;
            
            setDiv.className = 'padSet';
            ftDiv.className = 'padFT';
            htDiv.className = 'padHT';
            tbarDiv.className = 'toolbar';
            ftCanvas.className = 'canvasPad ';
            htCanvas.className = 'canvasPad';
            tbarSvg.setAttributeNS(null, 'class', 'toolbarPad');
            
            appDiv.appendChild(setDiv);
            setDiv.appendChild(ftDiv);
            setDiv.appendChild(htDiv);
            setDiv.appendChild(tbarDiv);
            ftDiv.appendChild(ftCanvas);
            htDiv.appendChild(htCanvas);
            tbarDiv.appendChild(tbarSvg);
            
            // Create a new HTML element with UI backend and append it into the document
            let humID = dpPadComponent.harmonicarium.id;
            let accordionTab = HUM.tmpl.accordionTab(setKey, 'dppad', 'Diphonic Pad ' + (dpPadComponent.padSets.length > 1 ? setKey : ''), 'dppad', humID);
            accordionTab.children[1].children[0].appendChild(HUM.tmpl.dpPadBox(setKey, dhc.harmonicarium.id));
            dpPadComponent.harmonicarium.html.dpPadAccordion.children[0].appendChild(accordionTab);

            this.id = setKey;
            this._id = idx;
            this.name = 'padSet';
            this.dpPadComponent = dpPadComponent;

            this.dhc = !dhc ? new HUM.DHC(setKey) : dhc;

            this.uiElements = {
                fn: {
                    accordionTab: accordionTab,
                    appDiv: appDiv,
                    setDiv: setDiv,
                    ftDiv: ftDiv,
                    htDiv: htDiv,
                    tbarDiv: tbarDiv
                }
            };

            this.parameters = new this.Parameters(this);

            this.ft = new DpPad.PadSet.FrequencyPad('ft', this, ftCanvas);
            this.ht = new DpPad.PadSet.FrequencyPad('ht', this, htCanvas);
            this.toolbar = new DpPad.PadSet.Toolbar(this, tbarSvg);
            
            this.parameters._init();

            this.arrangePads();
            // Tell to the DHC that a new app is using it
            this.dhc.registerApp(this, 'updatesFromDHC', 101);
        }

        /**
         * Updates the frequency range of a pad type and refreshes its display.
         *
         * @param {tonetype}            type         - The pad type to update: `'ft'` or `'ht'`.
         * @param {string|false}        [ambitus]    - The ambitus preset key (e.g. `'tenore'`, `'custom'`) or
         *                                             `false` to keep the current preset and just re-apply it.
         * @param {('min'|'max'|false)} [target]     - Which range bound to modify when editing the custom preset.
         * @param {number|false}        [value]      - The new raw value (midicent for FT, hertz for HT) for `target`.
         * @param {boolean}             [copy=false] - When `true`, copies the range from the opposite pad type
         *                                             instead of applying a value directly.
         * @returns {void}
         *
         * @description
         * Depending on the combination of arguments this method:
         * - Loads and applies a named preset from `freqRange[type].ambitus.presets`.
         * - Modifies and temporarily stores a custom min or max value (FT in
         *   midicents, HT in hertz), with a special half-step correction for
         *   12-EDO layouts so the first/last key is fully visible.
         * - Shows or hides the "Save custom" button accordingly.
         * Always finalises by calling `refillFreqArrays()` and `drawFreqUI()`
         * on the affected pad.
         */
        updatePadRangeUI(type, ambitus=false, target=false, value=false, copy=false) {
            if (ambitus) {
                this.parameters.freqRange[type].ambitus._setValue(ambitus, false, false, true, false);
            } else {
                // Init
                ambitus = this.parameters.freqRange[type].ambitus.value;
            }
            
            // Modify MAX or MIN range of the Custom preset slot
            if ((ambitus === 'custom' && !this.parameters.freqRange[type].ambitus.presets.custom && target) || (ambitus === 'custom' && target)) {
                this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_'+type].value = 'custom';
                this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = 'initial';
                if (type === 'ft') {
                    let mcFT = Number(value);
                
                    let ftStep = Math.round((mcFT % 1) * 10000000000) / 10000000000,
                        fmStep = Math.round((this.dhc.settings.fm.mc.value % 1) * 10000000000) / 10000000000;
                    // FIT PAD RANGE: WORKS ONLY For 12-EDO
                    // @todo - make ET universal (different unit ad divisions)
                    if (this.dhc.settings.ft.selected.value === 'nEDx' &&
                        this.dhc.settings.ft.nEDx.unit.value === 2 &&
                        this.dhc.settings.ft.nEDx.division.value === 12 &&
                        ftStep === fmStep) {
                        // If the FT System is ET and the decimal part of the FM is the same as the
                        // input midicent value
                        let nEDxFixStepCent = (this.dhc.tables.ft[1].mc - this.dhc.tables.ft[0].mc) / 2;
                        // Add or remove 50 cents to draw the first/last FT key entirely
                        let mcFix = target === 'min' ? -nEDxFixStepCent : nEDxFixStepCent;

                        this.parameters.freqRange.ft[target]._setValue(this.addCentToHertz(HUM.DHC.mcToFreq(mcFT), mcFix), false, !copy, true, false);
                    
                    }  else {
                        this.parameters.freqRange.ft[target]._setValue(HUM.DHC.mcToFreq(mcFT), false, !copy, true, false);
                    }
                    
                    this.parameters.freqRange.ft[target].mcValue = mcFT;
                    this.parameters.freqRange.ft[target].uiElements.out['dppad_freq_range_custom_'+target+'_trad_ft'].innerText = this.dhc.mcToNameString(mcFT);
                

                } else if (type === 'ht') {
                    let hzHT = Number(value);
                    
                    this.parameters.freqRange.ht[target]._setValue(hzHT, false, false, true, false);
                    
                    this.parameters.freqRange.ht[target].uiElements.out['dppad_freq_range_custom_'+target+'_trad_ht'].innerText = this.dhc.mcToNameString(HUM.DHC.freqToMc(hzHT));
                }
            // If the CUSTOM ambitus PRESET is not saved/stored
            } else if (ambitus === 'custom' && !this.parameters.freqRange[type].ambitus.presets.custom && !target) {
                this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = 'initial';
            // Load STORED ambitus PRESET (also the Custom, if it has been saved)
            } else {
                let xtRange = this.parameters.freqRange[type].ambitus.presets[ambitus];
                this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = 'none';
                // this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = ambitus === 'custom' ? 'initial' : 'none';
                
                for (let presetTarget of ['min', 'max']) {
                    let ftStep = Math.round((xtRange.mc[presetTarget] % 1) * 10000000000) / 10000000000,
                        fmStep = Math.round((this.dhc.settings.fm.mc.value % 1) * 10000000000) / 10000000000;
                    // FIT PAD RANGE: WORKS ONLY For 12-EDO
                    // @todo - make ET universal (different unit ad divisions)
                    if (type === 'ft' &&
                        this.dhc.settings.ft.selected.value === 'nEDx' &&
                        this.dhc.settings.ft.nEDx.unit.value === 2 &&
                        this.dhc.settings.ft.nEDx.division.value === 12 &&
                        ftStep === fmStep) {
                        
                            // If the FT System is ET and the decimal part of the FM is the same as the
                            // input midicent value
                            let nEDxFixStepCent = (this.dhc.tables.ft[1].mc - this.dhc.tables.ft[0].mc) / 2;
                            // Add or remove 50 cents to draw the first/last FT key entirely
                            let mcFix = presetTarget === 'min' ? -nEDxFixStepCent : nEDxFixStepCent;
                            
                            this.parameters.freqRange.ft[presetTarget]._setValue(this.addCentToHertz(xtRange.hz[presetTarget], mcFix), false, true, true, false);

                    }  else {
                            this.parameters.freqRange[type][presetTarget]._setValue(xtRange.hz[presetTarget], false, true, true, false);
                            // this.parameters.freqRange[type].min._setValue(xtRange.hz.min, false, true, true, false);
                            // this.parameters.freqRange[type].max._setValue(xtRange.hz.max, false, true, true, false);

                            // this.parameters.freqRange.ft[target].value = HUM.DHC.mcToFreq(mcFT);
                    }
                    
                    if (type === 'ft') {
                        this.parameters.freqRange.ft[presetTarget].mcValue = xtRange.mc[presetTarget];
                    }

                    let unit = type === 'ft' ? 'mc' : 'hz';
                    this.parameters.freqRange[type][presetTarget].uiElements.in[`dppad_freq_range_custom_${presetTarget}_${type}`].value = xtRange[unit][presetTarget];
                    this.parameters.freqRange[type][presetTarget].uiElements.out[`dppad_freq_range_custom_${presetTarget}_trad_${type}`].innerText = this.dhc.mcToNameString(xtRange.mc[presetTarget]);
                }
            }
            this[type].refillFreqArrays();
            this[type].drawFreqUI();
        }

        /**
         * Shifts a frequency by a given number of cents and returns the new frequency.
         *
         * @param {hertz}  initFreq  - The starting frequency in hertz.
         * @param {number} addCents  - The number of cents to add (positive or negative).
         *
         * @returns {hertz} The frequency resulting from adding `addCents` to `initFreq`.
         *
         * @description
         * Converts `initFreq` to midicents, adds `addCents`, then converts back
         * to hertz. Used internally by
         * {@link HUM.DpPad.PadSet#updatePadRangeUI|updatePadRangeUI()} to widen
         * the pad range by half a step so the boundary keys are fully rendered.
         */
        addCentToHertz(initFreq, addCents) {
            let resCents = HUM.DHC.freqToMc(initFreq);
            resCents += addCents;
            return HUM.DHC.mcToFreq(resCents);
        }

        /**
         * Manages and routes an incoming message from the DHC.
         *
         * @param {HUM.DHCmsg} msg - The incoming DHC message to process.
         *
         * @returns {void}
         *
         * @description
         * Handles the following message commands:
         * - `init`: Re-fills all frequency arrays and redraws both pads.
         * - `panic`: Calls `allNotesOff()` on both FT and HT pads.
         * - `update/ft`: Redraws all pads targeted by the FT scale display setting.
         * - `update/ht`: Updates `currentFreq` from the play queue and redraws
         *   all pads targeted by the HT scale display setting.
         * - `tone-on/ft`: Sets `ft.currentFreq` and redraws the targeted FT pads.
         * - `tone-on/ht`: Sets `ht.currentFreq` (single note) and redraws HT pads.
         * - `tone-off/ft`: Redraws the targeted FT pads.
         * - `tone-off/ht`: Restores `ht.currentFreq` from the remaining play queue
         *   and redraws the targeted HT pads.
         */
        updatesFromDHC(msg) {
            if (msg.cmd === 'init') {
                for (let type of ['ft', 'ht']) {
                    // @todo "updatePadRangeUI" is now commented because starts writing on parameters
                    // of the pads ranges and this triggers the update of the value on the DB
                    // eg. on changing the mc/hz accuracy or there is an incomin pitchbend message
                    // However, it would be good to be able to update the frequency/monitor printed
                    // at the bottom of the two pads, which doesn't happen anyway, when we 
                    // execute "updatePadRangeUI".
                    // this.updatePadRangeUI(type);
                    
                    // For now, we only execute the two methods already present at the
                    // "updatePadRangeUI" bottom:
                    this[type].refillFreqArrays();
                    this[type].drawFreqUI();
                }
            }

            if (msg.cmd === 'panic') {
                this.ft.allNotesOff();
                this.ht.allNotesOff();
            }

            if (msg.cmd === 'update') {
                if (msg.type === 'ft') {

                    // For each target pad of the FT scale
                    for (let targetPad of this.parameters.scaleDisplay.ft.value) {
                        // Do stuff for FT changes
                        this[targetPad].refillFreqArrays();
                        this[targetPad].drawFreqUI();
                    }
               
                } else if (msg.type === 'ht') {

                    // this.ht.currentFreq = this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz;
                    
                    // this.ht.currentFreq = this.dhc.playQueue.ht.length === 1 ?
                    //     this.dhc.tables.ht[msg.xtNum].hz : 0;

                    if (this.dhc.playQueue.ht.length <= 1) {
                        this.ht.currentFreq = this.dhc.settings.ht.curr_ht ? this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz : 0;
                    } else if (this.dhc.playQueue.ht.length > 1) {
                       this.ht.currentFreq = 0; 
                    }


                    // For each target pad of the HT scale
                    for (let targetPad of this.parameters.scaleDisplay.ht.value) {
                        // Do stuff for HT changes
                        this[targetPad].refillFreqArrays();
                        this[targetPad].drawFreqUI();
                    }
                
                } else if (msg.type === 'ctrlmap') {
                    // Do nothing at the moment
                }
           
            } else if (msg.cmd === 'tone-on') {
                if (msg.type === 'ft') {

                    this.ft.currentFreq = this.dhc.tables.ft[msg.xtNum].hz;
                    // this.ht.currentFreq = this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz;
                    // this.ht.drawFreqMonitor();

                    for (let targetPad of this.parameters.scaleDisplay.ft.value) {
                        // Do stuff for HT changes
                        // this[targetPad].canvasObjects.key.current.ht = data;
                        this[targetPad].drawFreqUI();
                    }

                } else if (msg.type === 'ht') {
                    
                    if (msg.xtNum !== 0) {
                        this.ht.currentFreq = this.dhc.playQueue.ht.length === 1 ?
                            this.dhc.tables.ht[msg.xtNum].hz : 0;
                    }
                    
                    // if (msg.xtNum !== 0) {
                    //     this.ht.currentFreq = this.dhc.tables.ht[msg.xtNum].hz;
                    // }

                    for (let targetPad of this.parameters.scaleDisplay.ht.value) {
                        // Do stuff for HT changes
                        // this[targetPad].canvasObjects.key.current.ht = data;
                        this[targetPad].drawFreqUI();
                    }

                }

            } else if (msg.cmd === 'tone-off') {
                if (msg.type === 'ft') {

                    for (let targetPad of this.parameters.scaleDisplay.ft.value) {
                        // Do stuff for HT changes
                        // this[targetPad].canvasObjects.key.current.ht = false;
                        this[targetPad].drawFreqUI();
                    }

                } else if (msg.type === 'ht') {

                    // if (msg.xtNum !== 0) {
                    //     this.ht.currentFreq = this.dhc.playQueue.ht.length === 1 ?
                    //         this.dhc.tables.ht[this.dhc.playQueue.ht[0].xtNum].hz : 0;
                    // }

                    if (this.dhc.playQueue.ht.length === 1) {
                        this.ht.currentFreq = this.dhc.tables.ht[this.dhc.playQueue.ht[0].xtNum].hz;
                    } else if (this.dhc.playQueue.ht.length > 1) {
                       this.ht.currentFreq = 0; 
                    }

                    for (let targetPad of this.parameters.scaleDisplay.ht.value) {
                        // Do stuff for HT changes
                        // this[targetPad].canvasObjects.key.current.ht = false;
                        this[targetPad].drawFreqUI();
                    }
                }
            }
        }
        
        /**
         * Re-inserts the FT, HT, and toolbar elements into the set container in
         * the correct order for the current layout configuration.
         *
         * @returns {void}
         *
         * @description
         * Reads `padsOrder`, `toolbarOrientation`, and `toolbarPosition` from the
         * PadSet parameters and re-appends the three child `<div>` elements
         * (`ftDiv`, `htDiv`, `tbarDiv`) to `setDiv` in the computed order.
         * Also adjusts the toolbar `float` style for the edge case where the
         * layout is horizontal-transversal with the toolbar at the bottom.
         */
        arrangePads() {
            let setDiv = this.uiElements.fn.setDiv,
                padsDiv = {
                    ft: this.uiElements.fn.ftDiv,
                    ht: this.uiElements.fn.htDiv
                },

            tbarDiv = this.uiElements.fn.tbarDiv,

            padsOrder = this.parameters.padsOrder.value, // ['ft', 'ht']
            tbOrientation = this.parameters.toolbarOrientation.value,
            tbPosition = this.parameters.toolbarPosition.value[tbOrientation];
                         //   longitudinal: 1, // 0, 1, 2 (pre, mid, post)
                         //   transversal: 0, // 0, 2 (pre, post)
            
            let currentOrder = [ padsDiv[padsOrder[0]], padsDiv[padsOrder[1]] ];
            currentOrder.splice(tbPosition, 0, tbarDiv);

            for (let elem of currentOrder) {
                setDiv.appendChild(elem);
            }

            if (this.dpPadComponent.settings.orientation === 'horizontal' && tbOrientation === 'transversal' && tbPosition === 2) {
                tbarDiv.style.float = 'none';
            } else {
                tbarDiv.style.float = 'left';
            }
        }
        
        /**
         * Inverts the visual order of the FT and HT pads and mirrors key positions.
         *
         * @param {boolean} [alreadyInverted=false] - Pass `true` when the parameter
         *   has already been updated externally, to skip the value toggle and only
         *   apply the visual changes.
         *
         * @returns {void}
         *
         * @description
         * Toggles `padsOrder` between `['ft','ht']` and `['ht','ft']`, mirrors
         * the `key.position` ratio for both pads (so keys appear on the opposite
         * edge), forces a parameter-changed notification to persist the new
         * ratios, redraws both pads, and calls `arrangePads()` to update the DOM.
         */
        invertPads(alreadyInverted) {
            if (!alreadyInverted) {
                let newValue = this.parameters.padsOrder.value[0] === 'ft' ? ['ht', 'ft'] : ['ft', 'ht'];
                this.parameters.padsOrder._setValue(newValue, false, false, true, false);
            }
            // this.uiElements.in.pads_order.value = this.parameters.padsOrder.value[0] === 'ft' ? 'ftht' : 'htft';
            for (let type of ['ft', 'ht']) {
                this.parameters.canvasObjectsRatios[type].key.position = 1 - this.parameters.canvasObjectsRatios[type].key.position;
                // Workaround to save the ObjectsRatios registry
                this.parameters.canvasObjectsRatios._objValueModified();
                this[type].drawFreqUI();
            }
            this.arrangePads();
        }

        // setToolbarOrientation(value) {
        //     if (value !== this.parameters.toolbarOrientation.value) {
        //         this.parameters.toolbarOrientation.value = value;
        //         // Disable the 'mid' value if orientation is 'transversal'
        //         this.uiElements.in.toolbar_position.options[1].disabled = value === 'transversal' ? true : false;
        //         this.uiElements.in.toolbar_position.value = this.parameters.toolbarPosition.value[value];
        //         this.dpPadComponent.windowResize();
        //         this.arrangePads();
        //     } else {
        //         return;
        //     }
        // }

        /**
         * Cycles the toolbar through all valid positions and orientations in sequence.
         *
         * @returns {void}
         *
         * @description
         * The toolbar can be longitudinal (side) at positions 0, 1, 2 or transversal
         * (top/bottom) at positions 0 or 2. This method advances the position by one
         * step in the current orientation; when the last longitudinal position is
         * reached it switches to transversal, and vice-versa. Forces a
         * parameter-changed notification, triggers a full resize, and calls
         * `arrangePads()` to update the DOM order.
         */
        switchToolbarPosition() {
            let tbPosLong = this.parameters.toolbarPosition.value.longitudinal,
                tbPosTras = this.parameters.toolbarPosition.value.transversal;
            if (this.parameters.toolbarOrientation.value === 'longitudinal') {
                if (tbPosLong < 2) {
                    this.parameters.toolbarPosition.value.longitudinal++;
                } else {
                    this.parameters.toolbarOrientation.value = 'transversal';
                    this.parameters.toolbarPosition.value.transversal = 0;
                }
            } else if (this.parameters.toolbarOrientation.value === 'transversal') {

                if (tbPosTras === 0) {
                    this.parameters.toolbarPosition.value.transversal = 2;
                } else {
                    this.parameters.toolbarOrientation.value = 'longitudinal';
                    this.parameters.toolbarPosition.value.longitudinal = 0;
                }
            }
            // Force the set method on the param since the value is an object
            // that has just been modified above directly.
            this.parameters.toolbarPosition._objValueModified();
            this.dpPadComponent.windowResize();
            this.arrangePads();
        }
    
    };

    /*  _____                               _                
     * |  __ \                             | |               
     * | |__) |_ _ _ __ __ _ _ __ ___   ___| |_ ___ _ __ ___ 
     * |  ___/ _` | '__/ _` | '_ ` _ \ / _ \ __/ _ \ '__/ __|
     * | |  | (_| | | | (_| | | | | | |  __/ ||  __/ |  \__ \
     * |_|   \__,_|_|  \__,_|_| |_| |_|\___|\__\___|_|  |___/
     */
    /**
     * Container class for all {@link HUM.Param} objects belonging to a
     * {@link HUM.DpPad.PadSet|PadSet} instance.
     *
     * @class
     * @memberof HUM.DpPad.PadSet
     *
     * @description
     * Instantiates and holds every configurable parameter of the PadSet:
     * - **Layout**: `main_orientation`, `renderMode`, `padsOrder`, `toolbarOrientation`,
     *   `toolbarPosition`, `toolbarIconOrder`, `padsRatio`, `tbLong`.
     * - **Scale display**: `scaleDisplay.ft`, `scaleDisplay.ht`.
     * - **Frequency ranges**: `freqRange.ft.{ambitus,min,max}`,
     *   `freqRange.ht.{ambitus,min,max}`.
     * - **Canvas object ratios**: `canvasObjectsRatios` (key length/position,
     *   label positions, HZ-monitor anchor).
     * - **Fonts**: `fonts.{ft,ht}.{hzMonitor,keyLabel}`,
     *   `fonts.ht.lineLabel`.
     * - **Scale orientations**: `scaleOrientation.ft`, `scaleOrientation.ht`.
     */
    DpPad.PadSet.prototype.Parameters = class {
        /**
         * Creates all parameters for the given PadSet.
         *
         * @param {HUM.DpPad.PadSet} padSet - The parent PadSet instance.
         *
         * @description
         * Every `HUM.Param` is constructed here with its IDB key, allowed
         * values, initial value, and the UI element descriptors that wire it
         * to the DOM. Heavy initialisation (Bootstrap collapsible setup, initial
         * DOM writes) is deferred to `_init()`.
         */
        constructor(padSet) {
            this.padSet = padSet;
            /*   __   ____  ____ 
             *  / _\ (  _ \(  _ \
             * /    \ ) __/ ) __/
             * \_/\_/(__)  (__)
             */
            // NOTE: this is just a copy of the value on DpPad.PadSet.settings.orientation
            this.main_orientation = new HUM.Param({
                app:padSet,
                idbKey:'padsetMainOrientation',
                // restoreStage:'pre',
                uiElements:{
                    'dppad_main_orientation': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue: padSet.dpPadComponent.settings.orientation,
                allowedValues: ['horizontal', 'vertical'],
                postSet: (value) => {
                    // Set the value on the dpPadComponent, that is where the
                    // setting is actually read
                    padSet.dpPadComponent.rotateView(value);
                    return value;
                }
            });
            this.renderMode = new HUM.Param({
                app:padSet,
                idbKey:'padsetRenderMode',
                uiElements:{
                    'dppad_render_mode': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue: 'hidpi',
                allowedValues: ['classic', 'hidpi'],
                postSet: (value) => {
                    padSet.dpPadComponent.windowResize();
                }
            });
            /*  ____  ____  ____ 
             * / ___)(  __)(_  _)
             * \___ \ ) _)   )(  
             * (____/(____) (__)
            */
            // @todo: other sets' pads as target (eg. ft0, ft3, ht2) ??
            this.scaleDisplay = {
                ft: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetScaleDisplayFT',
                    uiElements:{
                        'dppad_scale_display_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'toggle',
                            eventType: 'change',
                            htmlTargetProp:'checked',
                            widget:'checkbox',
                            uiSet: (value, thisParam) => {
                                thisParam.uiElements.in.dppad_scale_display_ft.checked = value.includes('ht') ? true : false;
                            },
                            eventListener: (evt) => {
                                if (evt.target.checked) {
                                    this.scaleDisplay.ft.valueUI = ['ft', 'ht'];
                                } else {
                                    this.scaleDisplay.ft.valueUI = ['ft'];
                                }
                            }
                        })
                    },
                    dataType:'array',
                    initValue:['ft'],
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ht.refillFreqArrays();
                            padSet.ht.drawFreqUI();
                        }
                    }
                }),
                ht: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetScaleDisplayHT',
                    uiElements:{
                        'dppad_scale_display_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'toggle',
                            eventType: 'change',
                            htmlTargetProp:'checked',
                            widget:'checkbox',
                            uiSet: (value, thisParam) => {
                                thisParam.uiElements.in.dppad_scale_display_ht.checked = value.includes('ft') ? true : false;
                            },
                            eventListener: (evt) => {
                                if (evt.target.checked) {
                                    this.scaleDisplay.ht.valueUI = ['ht', 'ft'];
                                } else {
                                    this.scaleDisplay.ht.valueUI = ['ht'];
                                }
                            }
                        })
                    },
                    dataType:'array',
                    initValue:['ht'],
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ft.refillFreqArrays();
                            padSet.ft.drawFreqUI();
                        }
                    }
                }),
            };
            this.padsOrder = new HUM.Param({
                app:padSet,
                idbKey:'padsetPadsOrder',
                uiElements:{
                    'dppad_pads_order': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                        uiSet: (value, thisParam) => {
                            thisParam.uiElements.in.dppad_pads_order.value = thisParam.value[0] === 'ft' ? 'ftht' : 'htft';
                        },
                        eventListener: (evt) => {
                            this.padsOrder.valueUI = evt.target.value === 'ftht' ? ['ft', 'ht'] : ['ht', 'ft'];
                        }
                    })
                },
                dataType:'array',
                initValue: ['ft', 'ht'],
                // allowedValues: (['ft', 'ht'], ['ht', 'ft']),
                postSet: (value, thisParam, init, fromUI, oldValue) => {
                    if (!init && (value[0] !== oldValue[0])) {
                        padSet.invertPads(true);
                    }
                }
            });
            // @todo canvas FH/HT ratio calculator
            this.padsRatio = {
                    ft: 0.5,
                    ht: 0.5,
                    tbLong: 0.1,
                    tbTran: 0.1
            };

            /* ____  __    __   __    ____   __   ____ 
             *(_  _)/  \  /  \ (  )  (  _ \ / _\ (  _ \
             *  )( (  O )(  O )/ (_/\ ) _ (/    \ )   /
             * (__) \__/  \__/ \____/(____/\_/\_/(__\_)
             */
            this.toolbarPosition = new HUM.Param({
                app:padSet,
                idbKey:'padsetToolbarPosition',
                uiElements:{
                    'dppad_toolbar_position': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                        uiSet: (value) => {
                            this.toolbarPosition.uiElements.in.dppad_toolbar_position.value = value[this.toolbarOrientation.value];
                        },
                        eventListener: (evt) => {
                            this.toolbarPosition.value[this.toolbarOrientation.value] = Number(evt.target.value);
                            this.toolbarPosition.valueUI = this.toolbarPosition.value;
                        }
                    })
                },
                dataType:'object',
                initValue: {
                    longitudinal: 1, // 0, 1, 2 (pre, mid, post)
                    transversal: 2 // 0, 2 (pre, post)
                },
                init: false,
                // allowedValues: [],
                postSet: (value) => {
                    // if (!init) {
                        padSet.arrangePads();
                    // }
                }
            });

            // 'longitudinal' or 'transversal' (related to this.settings.orientation)
            this.toolbarOrientation = new HUM.Param({
                app:padSet,
                idbKey:'padsetToolbarOrientation',
                uiElements:{
                    'dppad_toolbar_orientation': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue: 'longitudinal',
                init: false,
                allowedValues: ['longitudinal', 'transversal'],
                postSet: (value, thisParam, init) => {
                    // if (!init) {
                        // Disable the 'mid' value if orientation is 'transversal'
                        this.toolbarPosition.uiElements.in.dppad_toolbar_position.options[1].disabled = value === 'transversal' ? true : false;
                        this.toolbarPosition.uiElements.in.dppad_toolbar_position.value = this.toolbarPosition.value[value];
                        padSet.dpPadComponent.windowResize();
                        padSet.arrangePads();
                    // }
                }
            });
            this.toolbarDefaultIcons = [
                'menu',
                'rotateView',
                'toolbarPos',
                'invertPads',
                'rotateFT',
                'rotateHT',
                'textIncrease',
                'textDecrease',
                'piper',
                'panic',
                'openLog'
            ];
            this.toolbarIconOrder = new HUM.Param({
                app:padSet,
                idbKey:'padsetToolbarIconOrder',
                uiElements: (() => {
                    let res = {};
                    this.toolbarDefaultIcons.forEach((iconName, iconIndex) => {
                        res['toolbar_icon_'+iconName+'_switch'] = new HUM.Param.UIelem({
                            role: 'in',
                            opType:'toggle',
                            eventType: 'change',
                            htmlTargetProp:'checked',
                            widget:'checkbox',
                            uiSet: (value, thisParam) => {
                                thisParam.uiElements.in['toolbar_icon_'+iconName+'_switch'].checked = value.includes(iconName) ? true : false;
                            },
                            eventListener: (evt) => {
                                if (evt.target.checked) {
                                    let hiddenIcons = this.toolbarDefaultIcons.filter(x => !this.toolbarIconOrder.value.includes(x));
                                    hiddenIcons = hiddenIcons.filter(str => str !== iconName);
                                    let newIcons = this.toolbarDefaultIcons.filter(x => !hiddenIcons.includes(x));
                                    this.toolbarIconOrder.valueUI = newIcons;
                                } else {
                                    this.toolbarIconOrder.valueUI = this.toolbarIconOrder.value.filter(str => str !== iconName);
                                }
                            },
                        });
                    });
                    return res;
                })(),
                dataType:'array',
                initValue: JSON.parse(JSON.stringify(this.toolbarDefaultIcons)),
                postSet: (value, thisParam, init) => {
                    if (!init) {
                        padSet.toolbar.drawIcons(true);
                    }
                },
            });
            /*  ____   __   ____ 
             * (  _ \ / _\ (    \
             *  ) __//    \ ) D (
             * (__)  \_/\_/(____/
             */
            this.fonts = {
                ft: {
                    // PAD
                    hzMonitor: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFontFTHzMonitor',
                        uiElements:{
                            'dppad_fontsize_hzMonitor_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                paramTargetProp:'size',
                                widget:'number',
                                uiSet: null
                            })
                        },
                        dataType:'object',
                        initValue: new CssFont('italic', 'bold', 30, 'px', false, false),
                        init:false,
                        postInit: (thisParam) => {
                            thisParam.size = thisParam.value.size;
                        },
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.ft.drawFreqUI();
                            }
                        },
                        preRestore: value => {
                            return new CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                        },
                        postRestore: value => {
                            this.fonts.ft.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ft.value = value.size;
                        },
                        customSetGet: {
                            size: {
                                set: (value) => {
                                    this.fonts.ft.hzMonitor.value.size = value;
                                    this.fonts.ft.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ft.value = value;
                                    this.fonts.ft.hzMonitor._objValueModified();
                                },
                                get: (value) => {
                                    return this.fonts.ft.hzMonitor.value.size;
                                },
                            },
                        }
                    }),
                    // noteMonitor: new HUM.Param({}),
                    // SCALE
                    // lineLabel: new HUM.Param({}),
                    keyLabel: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFontFTKeyLabel',
                        uiElements:{
                            'dppad_fontsize_keyLabel_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                paramTargetProp:'size',
                                widget:'number',
                                uiSet: null
                            })
                        },
                        dataType:'object',
                        initValue: new CssFont(false, 'bold', 100, '%', false, false),
                        init:false,
                        postInit: (thisParam) => {
                            thisParam.size = thisParam.value.size;
                        },
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.ft.drawFreqUI();
                            }
                        },
                        preRestore: value => {
                            return new CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                        },
                        postRestore: value => {
                            this.fonts.ft.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ft.value = value.size;
                        },
                        customSetGet: {
                            size: {
                                set: (value) => {
                                    this.fonts.ft.keyLabel.value.size = value;
                                    this.fonts.ft.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ft.value = value;
                                    this.fonts.ft.keyLabel._objValueModified();
                                },
                                get: (value) => {
                                    return this.fonts.ft.keyLabel.value.size;
                                },
                            },
                        }
                    }),
                },
                ht: {
                    // PAD
                    hzMonitor: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFontHTHzMonitor',
                        uiElements:{
                            'dppad_fontsize_hzMonitor_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                paramTargetProp:'size',
                                widget:'number',
                                uiSet: null
                            })
                        },
                        dataType:'object',
                        initValue: new CssFont('italic', 'bold', 30, 'px', false, false),
                        init:false,
                        postInit: (thisParam) => {
                            thisParam.size = thisParam.value.size;
                        },
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.ht.drawFreqUI();
                            }
                        },
                        preRestore: value => {
                            return new CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                        },
                        postRestore: value => {
                            this.fonts.ht.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ht.value = value.size;
                        },
                        customSetGet: {
                            size: {
                                set: (value) => {
                                    this.fonts.ht.hzMonitor.value.size = value;
                                    this.fonts.ht.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ht.value = value;
                                    this.fonts.ht.hzMonitor._objValueModified();
                                },
                                get: (value) => {
                                    return this.fonts.ht.hzMonitor.value.size;
                                },
                            },
                        }
                    }),
                    // noteMonitor: new HUM.Param({}),
                    // SCALE
                    lineLabel: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFontHTLineLabel',
                        uiElements:{
                            'dppad_fontsize_lineLabel_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                paramTargetProp:'size',
                                widget:'number',
                                uiSet: null
                            })
                        },
                        dataType:'object',
                        initValue: new CssFont('italic', 'bold', 90, '%', false, false),
                        init:false,
                        postInit: (thisParam) => {
                            thisParam.size = thisParam.value.size;
                        },
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.ht.drawFreqUI();
                            }
                        },
                        preRestore: value => {
                            return new CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                        },
                        postRestore: value => {
                            this.fonts.ht.lineLabel.uiElements.in.dppad_fontsize_lineLabel_ht.value = value.size;
                        },
                        customSetGet: {
                            size: {
                                set: (value) => {
                                    this.fonts.ht.lineLabel.value.size = value;
                                    this.fonts.ht.lineLabel.uiElements.in.dppad_fontsize_lineLabel_ht.value = value;
                                    this.fonts.ht.lineLabel._objValueModified();
                                },
                                get: (value) => {
                                    return this.fonts.ht.lineLabel.value.size;
                                },
                            },
                        }
                    }),
                    keyLabel: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFontHTKeyLabel',
                        uiElements:{
                            'dppad_fontsize_keyLabel_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                widget:'number',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                paramTargetProp:'size',
                                uiSet: null
                            })
                        },
                        dataType:'object',
                        initValue: new CssFont(false, 'bold', 100, '%', false, false),
                        init:false,
                        postInit: (thisParam) => {
                            thisParam.size = thisParam.value.size;
                        },
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.ht.drawFreqUI();
                            }
                        },
                        preRestore: value => {
                            return new CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                        },
                        postRestore: value => {
                            this.fonts.ht.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ht.value = value.size;
                        },
                        customSetGet: {
                            size: {
                                set: (value) => {
                                    this.fonts.ht.keyLabel.value.size = value;
                                    this.fonts.ht.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ht.value = value;
                                    this.fonts.ht.keyLabel._objValueModified();
                                },
                                get: (value) => {
                                    return this.fonts.ht.keyLabel.value.size;
                                },
                            },
                        }
                    }),
                },
            };
            this.scaleOrientation = {
                ft: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetScaleOrientationFT',
                    uiElements:{
                        'dppad_scale_orientation_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        })
                    },
                    dataType:'string',
                    initValue: 'vertical',
                    allowedValues: ['horizontal', 'vertical'],
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ft.drawFreqUI();
                        }
                    }
                }),
                ht: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetScaleOrientationHT',
                    uiElements:{
                        'dppad_scale_orientation_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        })
                    },
                    dataType:'string',
                    initValue: 'vertical',
                    allowedValues: ['horizontal', 'vertical'],
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ht.drawFreqUI();
                        }
                    }
                }),
            };
            this.freqRange = {
                ft: {
                    ambitus: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFreqRangeFTAmbitus',
                        uiElements:{
                            'dppad_freq_range_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                widget:'selection',
                            }),
                           'dppad_freq_range_custom_save_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'click',
                                htmlTargetProp:'checked',
                                widget:'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    let min = this.freqRange.ft.min.value,
                                        max = this.freqRange.ft.max.value;
                                    this.freqRange.ft.ambitus.presets.custom = new VoiceAmbitus('ft', 'Custom', 'hz', min, max, padSet.dhc);
                                    this.freqRange.ft.ambitus.uiElements.in.dppad_freq_range_custom_save_ft.style.display = 'none';
                                    // Force the DB to store the param
                                    this.padSet.dhc.harmonicarium.components.user.presetServiceDB.updateParam(
                                        this.padSet.dhc.harmonicarium.components.user.session.id,
                                        this.freqRange.ft.ambitus.idbKeyPath,
                                        'live');
                                }
                            }),
                           'dppad_freq_range_copy_to_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'click',
                                htmlTargetProp:'checked',
                                widget:'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    padSet.updatePadRangeUI('ft', 'custom', 'min', HUM.DHC.freqToMc(this.freqRange.ht.min.value), true);
                                    padSet.updatePadRangeUI('ft', 'custom', 'max',  HUM.DHC.freqToMc(this.freqRange.ht.max.value), true);
                                    this.freqRange.ft.max.uiElements.in.dppad_freq_range_custom_max_ft.value = HUM.DHC.freqToMc(this.freqRange.ht.max.value);
                                    this.freqRange.ft.min.uiElements.in.dppad_freq_range_custom_min_ft.value = HUM.DHC.freqToMc(this.freqRange.ht.min.value);
                                }
                            })
                        },
                        dataType:'string',
                        restoreStage:'post',
                        initValue: 'tenore', // 4 octaves + 3 tones
                        init:false,
                        allowedValues: ['soprano', 'mezzosoprano', 'contralto', 'controtenore', 'tenore', 'baritono', 'basso', 'bassoprofondo', 'custom'],
                        preInit: (thisParam) => {
                            this._freqRangeInit('ft', thisParam.uiElements.in.dppad_freq_range_ft);
                        },
                        postSet: (value, thisParam, init, fromUI) => {
                            // if (!fromUI) {
                                padSet.updatePadRangeUI('ft', value);
                            // }
                        },
                        customPropertiesStore: () => {
                            let customProperties = {presets:{}};
                            for( const [vName, vAmb] of Object.entries(this.freqRange.ft.ambitus.presets)) {
                                customProperties.presets[vName] = [vAmb.type, vAmb.name, 'scientific', vAmb.note.min, vAmb.note.max];
                            }
                            return customProperties;

                        },
                        customPropertiesRestore: (storedCustomProps) => {
                            let customProperties = {presets:{}};
                            for( const [vName, vAmb] of Object.entries(storedCustomProps.presets)) {
                                customProperties.presets[vName] = new VoiceAmbitus(...vAmb, this.padSet.dhc);
                            }
                            return customProperties;
                        },
                        customProperties: {
                            presets: {
                                soprano: new VoiceAmbitus('ft', 'Soprano', 'scientific', 'C4', 'C6', padSet.dhc),
                                mezzosoprano: new VoiceAmbitus('ft', 'Mezzo-soprano', 'scientific', 'A3', 'A5', padSet.dhc),
                                contralto: new VoiceAmbitus('ft', 'Alto', 'scientific', 'F3', 'F5', padSet.dhc),
                                controtenore: new VoiceAmbitus('ft', 'Countertenor', 'scientific', 'E3', 'E5', padSet.dhc),
                                tenore: new VoiceAmbitus('ft', 'Tenor', 'scientific', 'C3', 'C5', padSet.dhc),
                                baritono: new VoiceAmbitus('ft', 'Baritone', 'scientific', 'A2', 'A4', padSet.dhc),
                                basso: new VoiceAmbitus('ft', 'Bass', 'scientific', 'E2', 'E4', padSet.dhc),
                                bassoprofondo: new VoiceAmbitus('ft', 'Basso profondo', 'scientific', 'C2', 'C4', padSet.dhc),
                            }
                        }
                    }),
                    max: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFreqRangeFTMax',
                        uiElements:{
                            'dppad_freq_range_custom_max_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                widget:'number',
                            }),
                            'dppad_freq_range_custom_max_trad_ft': {
                                role: 'out'
                            }
                        },
                        dataType:'float',
                        // initValue: 340, // 460, // 460,// 1200,
                        // preSet: (value) => {
                        //     value = 
                        // },
                        postSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                            if (!init || fromRestore) {
                                padSet.updatePadRangeUI('ft', 'custom', 'max', value);
                            }
                        },
                        presetGetValue: 'mcValue',
                        presetSetValue: 'value',
                        customProperties: {
                            mcValue: false
                        }
                    }),
                    min: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFreqRangeFTMin',
                        uiElements:{
                            'dppad_freq_range_custom_min_ft': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                widget:'number',
                            }),
                            'dppad_freq_range_custom_min_trad_ft': {
                                role: 'out'
                            }
                        },
                        dataType:'float',
                        // initValue: 85, //62,
                        postSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                            if (!init || fromRestore) {
                                padSet.updatePadRangeUI('ft', 'custom', 'min', value);
                            }
                        },
                        presetGetValue: 'mcValue',
                        presetSetValue: 'value',
                        customProperties: {
                            mcValue: false
                        }
                    }),
                },
                ht: {
                    ambitus: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFreqRangeHTAmbitus',
                        uiElements:{
                            'dppad_freq_range_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                widget:'selection',
                            }),
                           'dppad_freq_range_custom_save_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'click',
                                htmlTargetProp:'checked',
                                widget:'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    let min = this.freqRange.ht.min.value,
                                        max = this.freqRange.ht.max.value;
                                    this.freqRange.ht.ambitus.presets.custom = new VoiceAmbitus('ht', 'Custom', 'hz', min, max, padSet.dhc);
                                    this.freqRange.ht.ambitus.uiElements.in.dppad_freq_range_custom_save_ht.style.display = 'none';
                                    // Force the DB to store the param
                                    this.padSet.dhc.harmonicarium.components.user.presetServiceDB.updateParam(
                                        this.padSet.dhc.harmonicarium.components.user.session.id,
                                        this.freqRange.ht.ambitus.idbKeyPath,
                                        'live');

                                }
                            }),
                           'dppad_freq_range_copy_to_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'click',
                                htmlTargetProp:'checked',
                                widget:'button', // "button" is like uiSet===null
                                eventListener: (evt) => {
                                    padSet.updatePadRangeUI('ht', 'custom', 'min', this.freqRange.ft.min.value, true);
                                    padSet.updatePadRangeUI('ht', 'custom', 'max', this.freqRange.ft.max.value, true);
                                }
                            })
                        },
                        dataType:'string',
                        initValue: 'normal', // 3 octaves + 1 tone
                        init:false,
                        restoreStage:'post',
                        allowedValues: ['beginner', 'normal', 'extreme', 'custom'],
                        preInit: (thisParam) => {
                            this._freqRangeInit('ht', thisParam.uiElements.in.dppad_freq_range_ht);
                        },
                        postSet: (value, thisParam, init) => {
                            // if (!init) {
                                padSet.updatePadRangeUI('ht', value);
                            // }
                        },
                        customPropertiesStore: () => {
                            let customProperties = {presets:{}};
                            for( const [vName, vAmb] of Object.entries(this.freqRange.ht.ambitus.presets)) {
                                customProperties.presets[vName] = [vAmb.type, vAmb.name, 'hz', vAmb.hz.min, vAmb.hz.max];
                            }
                            return customProperties;
                        },
                        customPropertiesRestore: (storedCustomProps) => {
                            let customProperties = {presets:{}};
                            for( const [vName, vAmb] of Object.entries(storedCustomProps.presets)) {
                                customProperties.presets[vName] = new VoiceAmbitus(...vAmb, this.padSet.dhc);
                            }
                            return customProperties;
                        },
                        customProperties: {
                            presets: {
                                beginner: new VoiceAmbitus('ht', 'Beginner', 'hz', 400, 2500, padSet.dhc),
                                normal: new VoiceAmbitus('ht', 'Normal', 'hz', 350, 2700, padSet.dhc),
                                extreme: new VoiceAmbitus('ht', 'Extreme', 'hz', 300, 3000, padSet.dhc),
                            }
                        }
                    }),
                    max: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFreqRangeHTMax',
                        uiElements:{
                            'dppad_freq_range_custom_max_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                widget:'number',
                            }),
                            'dppad_freq_range_custom_max_trad_ht': {
                                role: 'out'
                            }
                        },
                        dataType:'float',
                        // initValue: 2700, // 3000
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.updatePadRangeUI('ht', 'custom', 'max', value);
                            }
                        }
                    }),
                    min: new HUM.Param({
                        app:padSet,
                        idbKey:'padsetFreqRangeHTMin',
                        uiElements:{
                            'dppad_freq_range_custom_min_ht': new HUM.Param.UIelem({
                                role: 'in',
                                opType:'set',
                                eventType: 'change',
                                htmlTargetProp:'value',
                                widget:'number',
                            }),
                            'dppad_freq_range_custom_min_trad_ht': {
                                role: 'out'
                            }
                        },
                        dataType:'float',
                        // initValue: 350, // 300
                        postSet: (value, thisParam, init) => {
                            if (!init) {
                                padSet.updatePadRangeUI('ht', 'custom', 'min', value);
                            }
                        }
                    })
                }
            };
            this.canvasObjectsRatios = new HUM.Param({
                app:padSet,
                idbKey:'padsetCanvasObjectsRatios',
                dataType:'boolean',
                role:'int',
                restoreStage: 'pre',
                // init:false,
                initValue: true,
                customProperties: {
                    ft: {
                        key: {
                            // 0=0%, 0.5=50%, 1=100%
                            length: 0.5,
                            // 0=pre, 0.5=mid, 1=post
                            position: 0,
                        },
                        keyText: {
                            position: 0.6, // inside the key
                            rotation: 0.5, // 0.5=90deg 1=180deg 
                        },
                        // lineText: {
                        //     position: 0.5, // inside the canvas dimension
                        //     rotation: 0.5, // 0.5=90deg 1=180deg 
                        // }
                        hzMonitor: {
                            width: 1,
                            height: 1
                        }
                    },
                    ht: {
                        key: {
                            length: 0.5,
                            position: 1,
                            saturation: 65, // % hsl color
                            lightness: 50, // % hsl color
                        },
                        keyText: {
                            position: 0.7, // inside the key
                            rotation: 0.5, // 0.5=90deg 1=180deg 
                        },
                        lineText: {
                            position: 0.2, // inside the canvas dimension
                            rotation: 0.5, // 0.5=90deg 1=180deg 
                        },
                        hzMonitor: {
                            width: 1,
                            height: 1
                        }
                    }
                }
            });
        }
        /**
         * Triggers deferred initialisation for parameters that require live DOM elements.
         *
         * @returns {void}
         *
         * @description
         * Calls `_init()` on each font parameter and on the toolbar position,
         * toolbar orientation, and both frequency-range ambitus parameters.
         * These inits populate select menus and establish Bootstrap-collapsible
         * listeners that must run after the DOM has been fully built.
         */
        _init() {
            this.fonts.ft.hzMonitor._init();
            this.fonts.ft.keyLabel._init();
            this.fonts.ht.hzMonitor._init();
            this.fonts.ht.keyLabel._init();
            this.fonts.ht.lineLabel._init();

            this.toolbarPosition._init();
            this.toolbarOrientation._init();
            this.freqRange.ft.ambitus._init();
            this.freqRange.ht.ambitus._init();
        }

        /**
         * Populates a frequency-range `<select>` element with the available preset options.
         *
         * @param {tonetype}     type - The pad type (`'ft'` or `'ht'`) whose presets to enumerate.
         * @param {HTMLElement}  elem - The `<select>` DOM element to populate.
         *
         * @returns {void}
         *
         * @description
         * Iterates over all entries in `freqRange[type].ambitus.presets`, appending
         * one `<option>` per preset with its human-readable `name` as the label.
         * Finally appends a fixed `'Custom'` option that is always present.
         */
        _freqRangeInit(type, elem) {
            for (const [id, ambitus] of Object.entries(this.freqRange[type].ambitus.presets)) {
                let option = document.createElement("option");
                option.value = id;
                option.text = ambitus.name;
                elem.add(option);
            }
            let optCustom = document.createElement("option");
            optCustom.value = 'custom';
            optCustom.text = 'Custom';
            elem.add(optCustom);
        }

    };

    /*   _______          _ _                
     *  |__   __|        | | |               
     *     | | ___   ___ | | |__   __ _ _ __ 
     *     | |/ _ \ / _ \| | '_ \ / _` | '__|
     *     | | (_) | (_) | | |_) | (_| | |   
     *     |_|\___/ \___/|_|_.__/ \__,_|_|   
     */
    /**
     * The SVG-based icon toolbar that sits alongside the frequency pads.
     *
     * @class
     * @memberof HUM.DpPad.PadSet
     *
     * @description
     * `Toolbar` manages an `<svg>` element containing a row or column of
     * `<use>` icons defined in the page's SVG sprite. Each icon dispatches
     * pointer and touch events through
     * {@link HUM.DpPad.PadSet.Toolbar#playProxy|playProxy()} which routes to
     * the appropriate DHC or UI action via
     * {@link HUM.DpPad.PadSet.Toolbar#playIcon|playIcon()}.
     *
     * Supported icons: `piper`, `menu`, `rotateView`, `openLog`, `toolbarPos`,
     * `rotateFT`, `rotateHT`, `invertPads`, `panic`, `textIncrease`, `textDecrease`.
     */
    DpPad.PadSet.Toolbar = class {
        /**
         * Creates a Toolbar bound to the given PadSet and SVG element.
         *
         * @param {HUM.DpPad.PadSet} padSet - The parent PadSet instance.
         * @param {SVGSVGElement}    svg    - The `<svg>` element that will host the icons.
         *
         * @description
         * Initialises the dimension cache and icon map, registers the
         * `touchstart` passive-prevention listener on the SVG, and immediately
         * calls {@link HUM.DpPad.PadSet.Toolbar#drawIcons|drawIcons(true)} to
         * populate the SVG with icon elements.
         */
        constructor(padSet, svg) { 
            this.svg = svg;
            this.padSet = padSet;
            this.cssDimensions = {
                width: 0,
                height: 0
            };
            this.icons = {};
            
            this.touchDown = false;

            this.svg.addEventListener('touchstart', (e) => e.preventDefault(), false);
            // this.svg.addEventListener('touchend', (e) => e.preventDefault(), false);
            // this.svg.addEventListener('touchmove', (e) => e.preventDefault(), false);
            this.drawIcons(true);
        }

        /**
         * Renders or repositions all toolbar icons inside the SVG element.
         *
         * @param {boolean} [init=false] - When `true`, clears the SVG and creates
         *   all `<use>` elements from scratch; when `false`, only updates the
         *   position and size attributes of existing elements.
         *
         * @returns {void}
         *
         * @description
         * Calculates icon spacing, size strings, and `preserveAspectRatio` values
         * based on the current pad orientation (`vertical`/`horizontal`) and
         * toolbar placement (`longitudinal`/`transversal`). On init, each icon
         * `<use>` element receives `mousedown`, `touchstart`, and `touchend`
         * listeners wired to `playProxy()` and a `pointer-events` attribute.
         * Icons that should appear rotated (e.g. `rotateView`, `invertPads`)
         * receive a `transform="rotate(...)"` attribute.
         */
        drawIcons(init=false) {
            // while (this.svg.lastElementChild) {
            //     this.svg.removeChild(this.svg.lastElementChild);
            // }

            let hrmID = this.padSet.dpPadComponent.harmonicarium.id,
                iconQty = this.padSet.parameters.toolbarIconOrder.value.length,
                tbLengthX = 0,
                tbLengthY = 0,
                useWidth = 0,
                useHeight = 0,
                preserveAspectRatio = '',
                iconRotated = false;

            if (this.padSet.dpPadComponent.settings.orientation === 'vertical') {
                if (this.padSet.parameters.toolbarOrientation.value === 'longitudinal') {
                    tbLengthX = 0;
                    tbLengthY = this.cssDimensions.height;
                    // Manual fix for the allignment  (started from 100% and 10%)
                    useWidth = '90%';
                    useHeight = '8%';
                    preserveAspectRatio = 'xMidYMin meet';
                    iconRotated = 0;
                } else if (this.padSet.parameters.toolbarOrientation.value === 'transversal') {
                    tbLengthX = this.cssDimensions.width;
                    tbLengthY = 0;
                    useWidth = '8%';
                    useHeight = '90%';
                    preserveAspectRatio = 'xMinYMid meet';
                    iconRotated = 0;
                }
            } else if (this.padSet.dpPadComponent.settings.orientation === 'horizontal') {
                if (this.padSet.parameters.toolbarOrientation.value === 'longitudinal') {
                    tbLengthX = this.cssDimensions.width;
                    tbLengthY = 0;
                    useWidth = '8%';
                    useHeight = '90%';
                    preserveAspectRatio = 'xMinYMid meet';
                    iconRotated = 90;
                } else if (this.padSet.parameters.toolbarOrientation.value === 'transversal') {
                    tbLengthX = 0;
                    tbLengthY = this.cssDimensions.height;
                    useWidth = '90%';
                    useHeight = '8%';
                    preserveAspectRatio = 'xMidYMin meet';
                    iconRotated = 90;
                }
            }

            let spaceBetweenX = tbLengthX / iconQty,
                spaceBetweenY = tbLengthY / iconQty,
                // Manual fix for the allignment (started from 0, 0)
                currentSpaceX = 3,
                currentSpaceY = 5;

            if (init) {
                // Reset the svg container and the icons
                while (this.svg.firstChild) {
                    this.svg.removeChild(this.svg.firstChild);
                }
                this.icons = {};

                for (let iconName of this.padSet.parameters.toolbarIconOrder.value) {
                    let useSvg = HUM.tmpl.useIcon(iconName, hrmID, this.svg, currentSpaceX, currentSpaceY);

                    useSvg.addEventListener('mousedown', (e) => this.playProxy(e), false);
                    // useSvg.addEventListener('mousemove', (e) => this.playProxy(e));
                    // useSvg.addEventListener('mouseleave', (e) => this.playProxy(e), false);
                    useSvg.addEventListener('touchstart', (e) => this.playProxy(e), false);
                    // useSvg.addEventListener('touchmove', (e) => this.playProxy(e));
                    useSvg.addEventListener('touchend', (e) => this.playProxy(e), false);
                
                    useSvg.setAttributeNS(null, 'pointer-events', 'bounding-box');
                    useSvg.setAttributeNS(null, 'width', useWidth);
                    useSvg.setAttributeNS(null, 'height', useHeight);
                    useSvg.setAttributeNS(null, 'preserveAspectRatio', preserveAspectRatio);
                    
                    if ( ['rotateView', 'invertPads', 'toolbarPos'].includes(iconName) && iconRotated) {
                        let useBox = useSvg.getBBox(),
                            rotX = useBox.x + useBox.width / 2,
                            rotY = useBox.y + useBox.height / 2;
                        useSvg.setAttributeNS(null, 'transform', `rotate(${iconRotated}, ${rotX}, ${rotY})`);
                    }

                    this.icons[iconName] = useSvg;

                    currentSpaceX += spaceBetweenX;
                    currentSpaceY += spaceBetweenY;
                }
            } else {
                for (const [iconName, useSvg] of Object.entries(this.icons)) {
                    useSvg.setAttributeNS(null, 'x', currentSpaceX);
                    useSvg.setAttributeNS(null, 'y', currentSpaceY);
                    useSvg.setAttributeNS(null, 'width', useWidth);
                    useSvg.setAttributeNS(null, 'height', useHeight);
                    useSvg.setAttributeNS(null, 'preserveAspectRatio', preserveAspectRatio);
                    if ( ['rotateView', 'invertPads', 'toolbarPos'].includes(iconName) && iconRotated) {
                        let useBox = useSvg.getBBox(),
                            rotX = useBox.x + useBox.width / 2,
                            rotY = useBox.y + useBox.height / 2;
                        useSvg.setAttributeNS(null, 'transform', `rotate(${iconRotated}, ${rotX}, ${rotY})`);
                    } else {
                        useSvg.setAttributeNS(null, 'transform', '');
                    }
                    currentSpaceX += spaceBetweenX;
                    currentSpaceY += spaceBetweenY;
                }
            }
        }

        /**
         * Routes a mouse or touch event from an icon to `playIcon()`.
         *
         * @param {MouseEvent|TouchEvent} e - The DOM event fired by an icon `<use>` element.
         *
         * @returns {void}
         *
         * @description
         * Reads `e.type` to determine the interaction phase (`mousedown`,
         * `touchstart`, or `touchend`) and resolves the icon object via
         * `e.target.dpIcon`. For `mousedown` and `touchstart` it records the
         * pressed icon and calls `playIcon()` with state `1`. For `touchend`
         * it checks whether the finger lifted inside the same element
         * (simulating a button-click style behaviour) and calls `playIcon()`
         * with state `0` when appropriate. `window.event.preventDefault()` is
         * called on touch events to suppress scroll interference.
         */
        playProxy(e) {
            let icon = this.icons[e.target.dpIcon];

            switch (e.type) {
                // #########
                // # MOUSE #
                // #########
                case 'mousedown':
                    this.padSet.dpPadComponent.mouse.down = icon;
                    this.playIcon(this.padSet.dpPadComponent.mouse.down, 1, icon);
                    break;
                // case 'mousemove':
                //     // Do nothing
                //     break;
                // case 'mouseleave':
                //     if (e.target === this.padSet.dpPadComponent.mouse.down) {
                //         // note off ??
                //     }
                //     break;
                // #########
                // # TOUCH #
                // #########
                case 'touchstart':
                    this.touchDown = icon;
                    this.playIcon(this.touchDown, 1, icon);
                    window.event.preventDefault();
                    break;
                // case 'touchmove':
                //     window.event.preventDefault();
                //     break;
                case 'touchend':
                    for (let i=0; i < e.changedTouches.length; i++) {
                        if (icon.dpIcon === 'piper') {
                            this.touchDown = false;
                            this.playIcon(this.touchDown, 0, icon);
                        } else {
                            // Since the target element of a TouchEvent is the element where the touch started,
                            // we need to know if the touch ends outside the first element in order to simulate
                            // a click style beheviour on touching buttons
                            // (if you click-up outside the button, the action-clickUP is cancelleed)
                            let realTarget = document.elementFromPoint(e.changedTouches[i].pageX, e.changedTouches[i].pageY);
                            if (this.touchDown === realTarget) {
                                this.touchDown = false;
                                this.playIcon(this.touchDown, 0, icon);
                            }
                        }
                    }
                    window.event.preventDefault();
                    break;
            }
        }
        /**
         * Handles the global `mouseup` event on behalf of the toolbar.
         *
         * @param {MouseEvent} e - The `mouseup` event forwarded from `DpPad.mouseUp()`.
         *
         * @returns {void}
         *
         * @description
         * If `mouse.down` references a toolbar icon (detected via `dpIcon`), calls
         * `playIcon()` with state `0` (release) to trigger the icon's deactivation
         * logic (e.g. releasing the Piper HT note).
         */
        mouseUp(e) {
            // This IF statement implements hold feature by de-click (mouseUp) outside the icon
            // if (this.padSet.dpPadComponent.mouse.down === e.target) {
                if (this.padSet.dpPadComponent.mouse.down.dpIcon) {
                    let icon = this.icons[this.padSet.dpPadComponent.mouse.down.dpIcon];
                    this.playIcon(this.padSet.dpPadComponent.mouse.down, 0, icon);
                }
            // }

        }
        /**
         * Executes the action associated with a toolbar icon.
         *
         * @param {SVGUseElement|false} pointerDown - The currently pressed icon element, or `false` if none.
         * @param {0|1}                 state       - `1` for press, `0` for release.
         * @param {SVGUseElement}       icon        - The icon element whose `dpIcon` property identifies the action.
         *
         * @returns {void}
         *
         * @description
         * Dispatches to the appropriate DHC or UI call based on `icon.dpIcon`:
         * - `piper`: Plays HT 0 (the Piper note) on press; mutes it on release.
         * - `menu`: Toggles the sidebar on release.
         * - `rotateView`: Rotates the pad layout on release.
         * - `openLog`: Toggles the event log panel on release.
         * - `toolbarPos`: Cycles the toolbar position on release.
         * - `rotateFT`: Switches the FT scale orientation on release.
         * - `rotateHT`: Switches the HT scale orientation on release.
         * - `invertPads`: Swaps FT and HT pad positions on release.
         * - `panic`: Triggers a DHC panic (all notes off) on release.
         * - `textIncrease`: Increases font sizes on release.
         * - `textDecrease`: Decreases font sizes on release.
         */
        playIcon(pointerDown, state, icon) {
            switch (icon.dpIcon) {
                case 'piper':
                    // state is mouseUp
                    if (state === 1 && pointerDown !== false) {
                        this.padSet.dhc.playHT(HUM.DHCmsg.htON('dppad', 0, 120));
                    } else {                            
                        this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', 0));
                    }
                    break;
                case 'menu':
                    if (state === 0 ) {
                        this.padSet.dhc.harmonicarium.components.backendUtils.toggleSidebar();
                    }
                    break;
                case 'rotateView':
                    if (state === 0) {
                        this.padSet.dpPadComponent.rotateView();
                    }
                    break;
                case 'openLog':
                    if (state === 0) {
                        this.padSet.dhc.harmonicarium.components.backendUtils.toggleLogPanel();
                    }
                    break;
                case 'toolbarPos':
                    if (state === 0) {
                        this.padSet.switchToolbarPosition();
                    }
                    break;
                case 'rotateFT':
                    if (state === 0) {
                        this.padSet.ft.switchScaleOrientation();
                    }
                    break;
                case 'rotateHT':
                    if (state === 0) {
                        this.padSet.ht.switchScaleOrientation();
                    }
                    break;
                case 'invertPads':
                    if (state === 0) {
                        this.padSet.invertPads();
                    }
                    break;
                case 'panic':
                    if (state === 0) {
                        this.padSet.dhc.panic();
                    }
                    break;
                case 'textIncrease':
                    if (state === 0) {
                        this.textIncrease();
                    }
                    break;
                case 'textDecrease':
                    if (state === 0) {
                        this.textDecrease();
                    }
                    break;
            }
        }
        /**
         * Increases the font size of all text labels on both pads.
         *
         * @returns {void}
         *
         * @description
         * Delegates to `increaseFontsize()` on the FT and HT
         * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} instances.
         */
        textIncrease() {
            this.padSet.ft.increaseFontsize();
            this.padSet.ht.increaseFontsize();
        }
        /**
         * Decreases the font size of all text labels on both pads.
         *
         * @returns {void}
         *
         * @description
         * Delegates to `decreaseFontsize()` on the FT and HT
         * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} instances.
         */
        textDecrease() {
            this.padSet.ft.decreaseFontsize();
            this.padSet.ht.decreaseFontsize();
        }


    };

    /*   ______                                          _____          _ 
     *  |  ____|                                        |  __ \        | |
     *  | |__ _ __ ___  __ _ _   _  ___ _ __   ___ _   _| |__) |_ _  __| |
     *  |  __| '__/ _ \/ _` | | | |/ _ \ '_ \ / __| | | |  ___/ _` |/ _` |
     *  | |  | | |  __/ (_| | |_| |  __/ | | | (__| |_| | |  | (_| | (_| |
     *  |_|  |_|  \___|\__, |\__,_|\___|_| |_|\___|\__, |_|   \__,_|\__,_|
     *                    | |                       __/ |                 
     *                    |_|                      |___/                  
     */
    /**
     * A single canvas-based frequency pad that renders and plays FT or HT tones.
     *
     * @class
     * @memberof HUM.DpPad.PadSet
     *
     * @description
     * `FrequencyPad` owns one `<canvas>` element and all the drawing and
     * interaction logic needed to:
     * - Display a logarithmic frequency scale with FT key rectangles and
     *   HT key rectangles, each annotated with note names and HT numbers.
     * - Respond to mouse and touch events, performing hit-testing against
     *   pre-computed key bounding boxes and dispatching `playFT`/`muteFT`
     *   and `playHT`/`muteHT` calls to the DHC.
     * - Render a live frequency monitor (Hz readout) in a corner of the canvas.
     *
     * One `FrequencyPad` is created for the FT scale and one for the HT scale
     * within every {@link HUM.DpPad.PadSet|PadSet}.
     */
    DpPad.PadSet.FrequencyPad = class {
        /**
         * Creates a FrequencyPad and registers all canvas event listeners.
         *
         * @param {tonetype}          type   - Whether this pad shows FT (`'ft'`) or HT (`'ht'`) tones.
         * @param {HUM.DpPad.PadSet}  padSet - The parent PadSet instance.
         * @param {HTMLCanvasElement} canvas - The `<canvas>` element to draw on.
         * 
         * @description
         * Initialises all instance properties (dimension cache, frequency arrays,
         * canvas object positions, active-key tracking, touch state) and
         * obtains the 2D rendering context. Registers `mousedown`, `mousemove`,
         * `mouseleave`, `touchstart`, `touchmove`, and `touchend` listeners on
         * the canvas. Alerts the user if the browser lacks canvas support.
         */
        constructor(type, padSet, canvas) { 
            // Get the specific canvas element from the HTML document passed
            this.canvas = canvas;
            this.type = type;
            this.padSet = padSet;
            this.cssDimensions = {
                width: 0,
                height: 0
            };
            this.freqArrays = {
                ft: new Array(),
                ht: new Array() // Sorted by HT number ascending
            };
            this.canvasObjPos = {
                keys: new Array(),
                // keyTexts: new Array(),
            };
            // ft & ht are the Scales, not the Pads!
            this.activeKeys = {
                ft: false,
                ht: false
            };
            this.currentFreq = 0;
            this.touch = {
                // Variables to keep track of the touch position
                x: null,
                y: null,
                down: false,
                last: { 
                    x: false,
                    y: false
                }
            };
            // If the browser supports the canvas tag, get the 2d drawing context for this canvas,
            // and also store it with the canvas as "ctx" for convenience
            if (this.canvas.getContext) {
                this.ctx = this.canvas.getContext('2d');

                // Add event handlers
                // Check that we have a valid context to draw on/with before adding event handlers
                // React to mouse events on the canvas, and mouseup on the entire document
                this.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
                this.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
                this.canvas.addEventListener('mouseleave', this.mouseLeave.bind(this), false);

                // React to touch events on the canvas
                this.canvas.addEventListener('touchstart', this.touchStart.bind(this), false);
                this.canvas.addEventListener('touchmove', this.touchMove.bind(this), false);
                this.canvas.addEventListener('touchend', this.touchEnd.bind(this), false);
            }
            else {
                alert("Your browser seems to not support the Canvas HTML5 element.\n\nYou cannot use this app.");
                return undefined;
            }

        }
        /**
         * Toggles the scale drawing orientation between vertical and horizontal.
         *
         * @returns {void}
         *
         * @description
         * Flips the `scaleOrientation` parameter for this pad type and immediately
         * redraws the pad with {@link HUM.DpPad.PadSet.FrequencyPad#drawFreqUI|drawFreqUI()}.
         */
        switchScaleOrientation() {
            this.padSet.parameters.scaleOrientation[this.type].value = this.padSet.parameters.scaleOrientation[this.type].value === 'vertical' ? 'horizontal' : 'vertical';
            // this.padSet.uiElements.in['scale_orientation_'+this.type].value = this.padSet.parameters.scaleOrientation[this.type].value;
            this.drawFreqUI();
        }
        // ====================================================
        // MOUSE EVENTS
        // ====================================================
        // Note that the sketcphad_mouseUp function is not included here, since it's not 
        // specific to a certain canvas - we're listening to the entire window for mouseup
        // events.

        /**
         * Handles a `mousedown` event on the canvas.
         *
         * @returns {void}
         *
         * @description
         * Records this canvas as the currently pressed element in
         * `dpPadComponent.mouse.down`, then calls
         * {@link HUM.DpPad.PadSet.FrequencyPad#play|play()} to perform
         * hit-testing and dispatch note events.
         */
        mouseDown() {
            // Down parameter points to the target canvas on mouse down
            this.padSet.dpPadComponent.mouse.down = this.canvas;
            this.play(this.padSet.dpPadComponent.mouse, 'mouse');
            // this.drawLine(this.padSet.dpPadComponent.mouse, 12);

        }
        /**
         * Handles a `mousemove` event on the canvas.
         *
         * @param {MouseEvent} e - The mouse-move event.
         *
         * @returns {void}
         *
         * @description
         * Updates the shared mouse position. If the left button is held down
         * on this canvas, also calls
         * {@link HUM.DpPad.PadSet.FrequencyPad#play|play()} so that sliding
         * the pointer across the scale triggers new note-on/off events.
         */
        mouseMove(e) {
            if (this.padSet.dpPadComponent.mouse.down === false) {
                // Update the mouse co-ordinates when moved
                this.padSet.dpPadComponent.updateMousePosition(e);
            } else if (this.padSet.dpPadComponent.mouse.down === this.canvas) {
                // Update the mouse co-ordinates when moved
                this.padSet.dpPadComponent.updateMousePosition(e);
                // Draw a dot if the mouse button is currently being pressed
                this.play(this.padSet.dpPadComponent.mouse, 'mouse');
                // this.drawLine(this.padSet.dpPadComponent.mouse, 12);
            }
        }
        /**
         * Handles a `mouseleave` event on the canvas.
         *
         * @param {MouseEvent} e - The mouse-leave event.
         *
         * @returns {void}
         *
         * @description
         * Resets the "last position" coordinates when the pointer exits the
         * canvas while still pressed, so that the next re-entry starts a fresh
         * stroke rather than drawing a long line from the previous position.
         */
        mouseLeave(e) {
            if (e.target === this.padSet.dpPadComponent.mouse.down) {
                // Reset lastX and lastY to false to indicate that they are now invalid, since we have lifted the "pen"
                this.padSet.dpPadComponent.mouse.last.x = false;
                this.padSet.dpPadComponent.mouse.last.y = false;
            }
        }
        /**
         * Handles the `mouseup` event forwarded by the global DpPad handler.
         *
         * @returns {void}
         *
         * @description
         * Sends `muteFT` / `muteHT` to the DHC for any currently active FT or
         * HT key and resets the `activeKeys` references to `false`.
         */
        mouseUp() {
            // let frequency = this.PadPixToFreq(this.padSet.dpPadComponent.mouse);
            if (this.activeKeys.ft !== false) {
                // console.log('MOUSEUP FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                this.activeKeys.ft = false;
            }
            if (this.activeKeys.ht !== false) {
                // console.log('MOUSEUP HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                this.activeKeys.ht = false;
            }
            // this.drawFreqUI();
        }

        // ====================================================
        // TOUCH EVENTS
        // ====================================================
        /**
         * Updates the cached touch coordinates from a `TouchEvent`.
         *
         * @param {TouchEvent} e - The touch event to read.
         *
         * @returns {void}
         *
         * @description
         * Reads the first touch point in `e.targetTouches` and stores its
         * canvas-relative position in `this.touch.x` and `this.touch.y`.
         * When we get the raw values of pageX and pageY below, they take into
         * account the scrolling on the page but not the position relative to our 
         * target div. We'll adjust them using "target.offsetLeft" and
         * "target.offsetTop" to get the correct values in relation to the top
         * left of the canvas.
         * Only single-finger touches are processed; multi-touch is ignored.
         */
        updateTouchPosition(e) {
            if(e.targetTouches) {
                if (e.targetTouches.length === 1) { // Only deal with one finger
                    let thisTouch = e.targetTouches[0]; // Get the information for finger #1
                    this.touch.x = thisTouch.pageX - thisTouch.target.offsetLeft;
                    this.touch.y = thisTouch.pageY - thisTouch.target.offsetTop;
                }
            }
        }
        /**
         * Handles a `touchstart` event on the canvas.
         *
         * @param {TouchEvent} e - The touch-start event.
         *
         * @returns {void}
         *
         * @description
         * Updates the touch coordinates, marks the canvas as the active touch
         * target, and calls {@link HUM.DpPad.PadSet.FrequencyPad#play|play()}
         * to dispatch note events. Calls `window.event.preventDefault()` to
         * suppress the subsequent synthetic `mousedown` event.
         */
        touchStart(e) {
            // Update the touch co-ordinates
            this.updateTouchPosition(e);
            this.touch.down = this.canvas;

            this.play(this.touch, 'touch');
            // this.drawLine(this.touch, 12);

            // Prevents an additional mousedown event being triggered
            window.event.preventDefault();
        }
        /**
         * Handles a `touchmove` event on the canvas.
         *
         * @param {TouchEvent} e - The touch-move event.
         *
         * @returns {void}
         *
         * @description
         * Updates the touch coordinates and calls
         * {@link HUM.DpPad.PadSet.FrequencyPad#play|play()} so that sliding
         * a finger across the scale continuously fires note-on/off events.
         */
        touchMove(e) { 
            // Update the touch co-ordinates
            this.updateTouchPosition(e);

            // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
            this.play(this.touch, 'touch');
            // this.drawLine(this.touch, 12);

            // Prevent a scrolling action as a result of this touchmove triggering.
            // window.event.preventDefault();
        }
        /**
         * Handles a `touchend` event on the canvas.
         *
         * @param {TouchEvent} e - The touch-end event.
         *
         * @returns {void}
         *
         * @description
         * Marks the touch as no longer active, sends `muteFT`/`muteHT` to the
         * DHC for any currently active keys, resets `activeKeys`, and clears
         * the last-touch coordinates. Calls `window.event.preventDefault()`
         * to suppress scroll behaviour.
         */
        touchEnd(e) {
            this.updateTouchPosition(e);
            this.touch.down = false;

            // let frequency = this.PadPixToFreq(this.touch);

            if (this.activeKeys.ft !== false) {
                // console.log('TOUCHEND FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                this.activeKeys.ft = false;
            }
            if (this.activeKeys.ht !== false) {
                // console.log('TOUCHEND HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                this.activeKeys.ht = false;
            }
            // this.drawFreqUI();


            // Reset lastX and lastY to false to indicate that they are now invalid, since we have lifted the "pen"
            this.touch.last.x = false;
            this.touch.last.y = false;
            window.event.preventDefault();
        }
        // ====================================================
        // PLAYING ACTIONS
        // ====================================================

        /**
         * Performs hit-testing and dispatches note-on/off events for a pointer position.
         *
         * @param {{x:number, y:number, down:*}} pointer - The pointer state object
         *   (`mouse` or `touch`) providing the current coordinates and press status.
         * @param {('mouse'|'touch')} type - The input device type (currently unused
         *   internally but preserved for future device-specific handling).
         *
         * @returns {void}
         *
         * @description
         * Wrapped in `requestAnimationFrame` for smooth rendering. Filters
         * `canvasObjPos.keys` to find all key rectangles that contain the current
         * pointer position, selects the one with the highest z-index, then:
         * - Sends `muteFT`/`mutHT` for the previously active key if it differs.
         * - Sends `playFT`/`playHT` for the newly hit key while the pointer is down.
         * - Sends note-off for both types if no key is hit.
         * Updates `currentFreq` and triggers a redraw.
         */
        play(pointer, type) {
            // Fallback method
            // requestAnimFrame((function() {}).bind(this));
            window.requestAnimationFrame( () => {
                // Get the frequecny from the coordinate
                let frequency = this.PadPixToFreq(pointer);
                // Let's assume the pointer didn't touch any key
                // let ft_keyFound = false, ft_noteON = false, ft_noteOFF = false,
                //     ht_keyFound = false, ht_noteON = false, ht_noteOFF = false;
                let keyFound = {ft: false, ht: false},
                    noteON = {ft: false, ht: false},
                    noteOFF = {ft: false, ht: false};

                // - - - - - - COLLISION DETECTION - - - - - -
                let pntX = pointer.x,
                    pntY = pointer.y,
                    foundKeys = this.canvasObjPos.keys.filter( (obj) => {
                    let objX0 = obj.begin[0],
                        objY0 = obj.begin[1],
                        objX1 = obj.end[0],
                        objY1 = obj.end[1];
                    if (pntX > objX0 && pntX < objX1 && pntY > objY0 && pntY < objY1) {
                        return true;
                    }   else {
                        return false;
                    }
                });
                foundKeys.sort((a, b) => b.zindex-a.zindex);
                let objectFound = foundKeys[0];
                if (objectFound) {
                    for (let type of ['ft', 'ht']) {
                        if (objectFound.type === type) {
                            keyFound[type] = objectFound;
                            // If there isn't a key alreadypressed 
                            if (this.activeKeys[type] === false ) {
                                // note on the pressed
                                noteON[type] = objectFound;
                            // If there is a pressed key
                            } else {
                                // If the new pressed key is different from the previous
                                if (this.activeKeys[type].toneNumber !== objectFound.toneNumber) {
                                    // note off the previous
                                    noteOFF[type] = this.activeKeys[type];
                                    // note on the pressed
                                    noteON[type] = objectFound;
                                } else {
                                    // do nothing
                                }
                            }
                        }
                    }
                }

                // Check if a Key is touched
                // For every Key
                // for (let obj of this.canvasObjPos.keys) {
                //     let objX0 = obj.begin[0],
                //         objY0 = obj.begin[1],
                //         objX1 = obj.end[0],
                //         objY1 = obj.end[1];
                //     // If the Pointer is in the X-range and Y-range of the Key
                //     if (pntX > objX0 && pntX < objX1 && pntY > objY0 && pntY < objY1) {
                //         // For every scale type (ft and ht) 
                //         for (let type of ['ft', 'ht']) {
                //             if (obj.type === type) {
                //                 keyFound[type] = obj;
                //                 // If there isn't a key alreadypressed 
                //                 if (this.activeKeys[type] === false ) {
                //                     // note on the pressed
                //                     noteON[type] = obj;
                //                 // If there is a pressed key
                //                 } else {
                //                     // If the new pressed key is different from the previous
                //                     if (this.activeKeys[type].toneNumber !== obj.toneNumber) {
                //                         // note off the previous
                //                         noteOFF[type] = this.activeKeys[type];
                //                         // note on the pressed
                //                         noteON[type] = obj;
                //                     } else {
                //                         // do nothing
                //                     }
                //                 }
                //             }
                //         }
                //     }
                // }
                // - - - - - - - - - - - - - - - - - - - - - -

                if (keyFound.ft || keyFound.ht) {

                    // ====== FT ======
                    if (noteOFF.ft !== false) {
                        // console.log('PLAY FT NOTE OFF: ' + noteOFF.ft.toneNumber);
                        this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', noteOFF.ft.toneNumber));
                        this.activeKeys.ft = false;
                    }
                    if (noteON.ft !== false && pointer.down !== false) {
                    // if (noteON.ft !== false) {
                        // console.log('PLAY FT NOTE ON: ' + noteON.ft.toneNumber);
                        this.activeKeys.ft = noteON.ft;
                        this.padSet.dhc.playFT(HUM.DHCmsg.ftON('dppad', noteON.ft.toneNumber, 120));
                    }

                    // ====== HT ======
                    if (noteOFF.ht !== false) {
                        // console.log('PLAY HT NOTE OFF: ' + noteOFF.ht.toneNumber);
                        this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', noteOFF.ht.toneNumber));
                        this.activeKeys.ht = false;
                    }
                    if (noteON.ht !== false && pointer.down !== false) {
                        // console.log('PLAY HT NOTE ON: ' + noteON.ht.toneNumber);
                        this.activeKeys.ht = noteON.ht;
                        this.padSet.dhc.playHT(HUM.DHCmsg.htON('dppad', noteON.ht.toneNumber, 120));
                    }

                    // ====== REFRESHES ======
                    if (this.type === 'ft') {
                        // [ Now, all the target Pads of the HT scale are re-drawn ]
                        // If this FT Pad shouldn't show the HT scale (if the HT scale doesn't have to be shown in the FT Pads)
                        if (!this.padSet.parameters.scaleDisplay.ht.value.includes('ft')) {
                            // Redraw the UI of this Pad...
                            // because the 'PadSet.updatesFromDHC' method only updates the target Pads of the HT scale
                            // this.drawFreqUI();
                        }

                    } else if (this.type === 'ht') {
                        if (!this.padSet.parameters.scaleDisplay.ht.value.includes('ht')) {

                        }
                        // this.drawFreqUI();
                    }


                    if (keyFound.ft) {
                        this.currentFreq = this.padSet.dhc.tables.ft[keyFound.ft.toneNumber].hz;
                    }
                    if (keyFound.ht) {
                        this.currentFreq = this.padSet.dhc.tables.ht[keyFound.ht.toneNumber].hz;
                    }
                    // this.drawFreqUI();
                    // this.drawFreqMonitor();

                } else {

                    if (!keyFound.ft) {
                        if (this.activeKeys.ft !== false) {
                            // console.log('PLAY FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                            this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                            this.activeKeys.ft = false;
                        }
                    }
                    if (!keyFound.ht) {
                        if (this.activeKeys.ht !== false) {
                            // console.log('PLAY HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                            this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                            this.activeKeys.ht = false;
                        }
                    }

                    this.currentFreq = frequency;
                    // Update the frequency monintor
                    this.drawFreqUI();
                    // this.drawFreqMonitor();
                }

            });
        }

        /**
         * Silences all active notes on this pad and redraws it.
         *
         * @returns {void}
         *
         * @description
         * Resets both `activeKeys.ft` and `activeKeys.ht` to `false` and calls
         * `drawFreqUI()`. Used as a local panic handler by
         * {@link HUM.DpPad.PadSet#updatesFromDHC|PadSet.updatesFromDHC()} when
         * a `panic` message arrives from the DHC.
         */
        allNotesOff() {
            this.activeKeys.ft = false;
            this.activeKeys.ht = false;
            this.drawFreqUI();
        }

        // ====================================================
        // DRAWING ACTIONS
        // ====================================================
        /**
         * Computes a three-stop HSL colour gradient for a given HT number.
         *
         * @param {xtnum} htNumber - The harmonic tone number to colourise.
         *
         * @returns {string[]} A three-element array of CSS HSL colour strings:
         *   `[lighter, base, darker]`.
         *
         * @description
         * Maps the harmonic number to a hue by computing the logarithm of
         * `abs(htNumber)` in the base of the current nEDx unit, then wraps
         * the result to `[0, 360)` degrees. Saturation and lightness are
         * taken from `canvasObjectsRatios.ht.key`.
         */
        getHTcolor(htNumber) {
            let colRatio = (Math.log(Math.abs(htNumber))/Math.log(this.padSet.dhc.settings.ft.nEDx.unit.value)) % 1,
                colorH = 360 * colRatio,
                colorS = this.padSet.parameters.canvasObjectsRatios.ht.key.saturation,
                colorL = this.padSet.parameters.canvasObjectsRatios.ht.key.lightness;
            return [
             `hsl(${colorH}, ${colorS}%, ${colorL*1.6}%)`, // lighter
             `hsl(${colorH}, ${colorS}%, ${colorL}%)`, // color
             `hsl(${colorH}, ${colorS*1.5}%, ${colorL/1.5}%)`, // darker
            ];
        }

        /**
         * Clears the entire canvas to a transparent state.
         *
         * @returns {void}
         *
         * @description
         * Calls `clearRect()` covering the full canvas dimensions, then begins
         * a new path. Called at the start of every
         * {@link HUM.DpPad.PadSet.FrequencyPad#drawFreqUI|drawFreqUI()} cycle.
         */
        clearCanvas() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.beginPath();
        }
        // changeFontsize(target, value) {
        //     this.padSet.parameters.fonts[this.type][target].size = value;
        //     this.padSet.parameters.fonts[this.type][target]._objValueModified();
        //     this.drawFreqUI();
        // }
        /**
         * Increases the size of all font parameters for this pad type by ~11%.
         *
         * @returns {void}
         *
         * @description
         * Iterates over `padSet.parameters.fonts[this.type]` and multiplies
         * each font's `size` property by `1/0.9`, rounding to the nearest
         * integer. Triggers `drawFreqUI()` to redraw with the new sizes.
         */
        increaseFontsize() {
            for (const [target, font] of Object.entries(this.padSet.parameters.fonts[this.type])) {
                let newValue = Math.round(this.padSet.parameters.fonts[this.type][target].size / 0.9);
                this.padSet.parameters.fonts[this.type][target].size = newValue;
                // this.padSet.uiElements.in[`fontsize_${target}_${this.type}`].value = newValue;
            }
            this.drawFreqUI();
        }
        /**
         * Decreases the size of all font parameters for this pad type by ~10%.
         *
         * @returns {void}
         *
         * @description
         * Iterates over `padSet.parameters.fonts[this.type]` and multiplies
         * each font's `size` property by `0.9`, rounding to the nearest
         * integer. Triggers `drawFreqUI()` to redraw with the new sizes.
         */
        decreaseFontsize() {
            for (const [target, font] of Object.entries(this.padSet.parameters.fonts[this.type])) {
                let newValue = Math.round(this.padSet.parameters.fonts[this.type][target].size * 0.9);
                this.padSet.parameters.fonts[this.type][target].size = newValue;
                // this.padSet.uiElements.in[`fontsize_${target}_${this.type}`].value = newValue;
            }
            this.drawFreqUI();
        }
        /**
         * Draws a thin reference line across the canvas at a given pixel position.
         *
         * @param {number}  pxPosition     - The position in pixels along the scale axis.
         * @param {boolean} [close=true]   - When `true`, immediately strokes the path
         *   in grey and closes it. Pass `false` to accumulate the line segment in an
         *   existing open path for batch rendering.
         *
         * @returns {void}
         *
         * @description
         * Draws a full-width (vertical orientation) or full-height (horizontal
         * orientation) line at `pxPosition`. Used to mark FT and HT tone
         * positions before keys are drawn on top of them.
         */
        drawFreqLine(pxPosition, close=true) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value;

            if (scaleOrientation === 'vertical') {
                ctx.moveTo(0, pxPosition);
                ctx.lineTo(this.cssDimensions.width, pxPosition);
            } else if (scaleOrientation === 'horizontal') {
                ctx.moveTo(pxPosition, 0);
                ctx.lineTo(pxPosition, this.cssDimensions.height);
            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            if (close) {
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
        }

        /**
         * Draws a rectangular key (or thin line) centred on a scale position.
         *
         * @param {number}          pxPosition        - Pixel position along the scale axis (centre of the key).
         * @param {tonetype|false}  [type=false]      - Tone type (`'ft'` or `'ht'`) used when recording the bounding box. Pass `false` for non-interactive lines.
         * @param {xtnum|false}     [xtNum=false]     - Tone number used when recording the bounding box.
         * @param {number|false}    [thickness=false] - Explicit thickness in pixels; when `false` the key dimensions are derived from the canvas size and FT key ratios.
         * @param {string[]|false}  [grdColors=false] - Three-stop gradient colour array `[lighter, mid, darker]`; `false` means no gradient fill is applied.
         * @param {number|false}    [zindex=false]    - Z-index stored in the bounding-box registry for hit-test ordering.
         *
         * @returns {void}
         *
         * @description
         * Computes the key rectangle from the scale orientation and canvas
         * object ratios, optionally applies a linear gradient fill, then draws
         * and strokes the rectangle. If `thickness` is falsy (i.e. it is a
         * real key, not just a line) the bounding box is pushed into
         * `canvasObjPos.keys` for collision detection.
         */
        drawLinKey(pxPosition, type=false, xtNum=false, thickness=false, grdColors=false, zindex=false) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value,
                keyRatios = this.padSet.parameters.canvasObjectsRatios.ft.key;
            let keyWidth, keyHeight, middleOffset, xBegin, yBegin, xEnd, yEnd = 0;

            if (scaleOrientation === 'vertical') {
                keyWidth = thickness ? this.cssDimensions.width : this.cssDimensions.width * keyRatios.length;
                keyHeight = thickness || this.cssDimensions.height / this.freqArrays.ft.length;
                middleOffset = keyHeight / 2;
                xBegin = (this.cssDimensions.width - keyWidth) * keyRatios.position;
                yBegin = pxPosition-middleOffset;
                xEnd = keyWidth+xBegin;
                yEnd = keyHeight+yBegin;
                if (grdColors) {
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    // Reverse the gradient in accordance with the key position
                    if(keyRatios.position > 0.5) {
                        grd.addColorStop(0, grdColors[0]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[2]);
                    } else {
                        grd.addColorStop(0, grdColors[2]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[0]);
                    }
                    ctx.fillStyle = grd;
                }
                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
            } else if (scaleOrientation === 'horizontal') {
                keyWidth = thickness || this.cssDimensions.width / this.freqArrays.ft.length;
                keyHeight = thickness ? this.cssDimensions.height : this.cssDimensions.height * keyRatios.length;
                middleOffset = keyWidth / 2;
                xBegin = pxPosition-middleOffset;
                yBegin = (this.cssDimensions.height - keyHeight) * keyRatios.position;
                xEnd = keyWidth+xBegin;
                yEnd = keyHeight+yBegin;
                if (grdColors) {
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    // Reverse the gradient in accordance with the key position
                    if(keyRatios.position > 0.5) {
                        grd.addColorStop(0, grdColors[0]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[2]);
                    } else {
                        grd.addColorStop(0, grdColors[2]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[0]);
                    }
                    ctx.fillStyle = grd;
                }
                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            // If it's a key and not a line
            if (!thickness) {
                this.canvasObjPos.keys.push(Object.freeze({
                    type: type,
                    toneNumber: xtNum,
                    //                      x0       y0
                    begin: Object.freeze([xBegin, yBegin]),
                    //                   x1     y1
                    end: Object.freeze([xEnd, yEnd]),
                    zindex: zindex
                }));
            }
        }

        // drawFreqKeyFT(pxPosition, ftNumber) {
        //     let ctx = this.ctx,
        //         scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value,
        //         keyRatios = this.padSet.parameters.canvasObjectsRatios.ft.key;
        //     let keyWidth, keyHeight, middleOffset, xBegin, yBegin = 0;

        //     if (scaleOrientation === 'vertical') {
        //         keyWidth = this.cssDimensions.width * keyRatios.length;
        //         keyHeight = this.cssDimensions.height / this.freqArrays.ft.length;
        //         middleOffset = keyHeight / 2;
        //         xBegin = (this.cssDimensions.width - keyWidth) * keyRatios.position;
        //         yBegin = pxPosition-middleOffset;
        //         ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
        //         ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
        //     } else if (scaleOrientation === 'horizontal') {
        //         keyWidth = this.cssDimensions.width / this.freqArrays.ft.length;
        //         keyHeight = this.cssDimensions.height * keyRatios.length;
        //         middleOffset = keyWidth / 2;
        //         xBegin = pxPosition-middleOffset;
        //         yBegin = (this.cssDimensions.height - keyHeight) * keyRatios.position;
        //         ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
        //         ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
        //     } else {
        //         alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
        //     }
        //     this.canvasObjPos.keys.push(Object.freeze({
        //         type: 'ft',
        //         toneNumber: ftNumber,
        //         //                      x0       y0
        //         begin: Object.freeze([xBegin, yBegin]),
        //         //                          x1               y1
        //         end: Object.freeze([keyWidth+xBegin, keyHeight+yBegin])
        //     }));
        // }

        /**
         * Draws a variable-width HT key rectangle whose size is proportional to
         * the spacing between neighbouring harmonics.
         *
         * @param {hertz}     thisFreq   - Frequency in hertz of the harmonic tone to draw.
         * @param {xtnum}     htNumber   - The HT number, used for bounding-box registration.
         * @param {number}    arrIdx     - Index of this entry within `freqArrays.ht`; used to
         *   look up the neighbouring frequencies for computing key height/width.
         * @param {string[]}  grdColors  - Three-stop gradient colour array `[c0, cMid, c1]`.
         * @param {number}    zindex     - Z-index stored in the bounding-box registry.
         *
         * @returns {void}
         *
         * @description
         * The key height (vertical) or width (horizontal) is calculated as one
         * third of the gap to each neighbour (or to the range boundary at the
         * edges of the array), giving a visually proportional touch target. A
         * linear gradient is applied with its midpoint at the key-text position
         * so the label always contrasts against the middle colour. The bounding
         * box is pushed into `canvasObjPos.keys` for collision detection.
         */
        drawFreqKeyHT(thisFreq, htNumber, arrIdx, grdColors, zindex) {
            let ctx = this.ctx,
                freqRange = this.padSet.parameters.freqRange[this.type],
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value,
                keyRatios = this.padSet.parameters.canvasObjectsRatios.ht.key;
            // let thisPix = this.freqToPadPix(thisFreq);
            let keyWidth, keyHeight,
                xBegin, yBegin, xEnd, yEnd,
                follFreq, prevFreq,
                middleOffsetFreq = 0;

                if (arrIdx === 0) {
                    follFreq = this.freqArrays.ht[arrIdx+1][1].hz;
                    prevFreq = freqRange.min.value;
                } else if (arrIdx === this.freqArrays.ht.length-1){
                    follFreq = freqRange.max.value;
                    prevFreq = this.freqArrays.ht[arrIdx-1][1].hz;
                } else {
                    follFreq = this.freqArrays.ht[arrIdx+1][1].hz;
                    prevFreq = this.freqArrays.ht[arrIdx-1][1].hz;
                }

            if (scaleOrientation === 'vertical') {

                let follHeighFreq = ((follFreq - thisFreq) / 3),
                    prevHeighFreq = ((thisFreq - prevFreq) / 3),
                    keyHeightFreq = follHeighFreq + prevHeighFreq;
                middleOffsetFreq = keyHeightFreq / 2;
                let yBeginFreq = thisFreq - middleOffsetFreq;
                
                keyWidth = this.cssDimensions.width * keyRatios.length;
                xBegin = (this.cssDimensions.width - keyWidth) * keyRatios.position;

                yBegin = this.freqToPadPix(yBeginFreq+keyHeightFreq);
                yEnd = this.freqToPadPix(yBeginFreq);
                keyHeight = yEnd - yBegin;
                xEnd = keyWidth+xBegin;

                // TEST METHOD
                // keyWidth = this.canvas.height; //  * keyRatio.length;
                // keyHeight =  (this.canvas.width / this.freqArrays.ht.length) / (htNumber*0.5);
                // let middleOffset = keyHeight / 2;
                // xBegin = 0
                // yBegin = thisPix-middleOffset;;

                if (grdColors) {
                    // Set the middle color where there is the key label
                    // (the middle color is supposed to be the best to contrast with the key label)
                    let ratios = this.padSet.parameters.canvasObjectsRatios.ht;
                    let labelColorStop = ratios.key.position > 0.5 ? 1-ratios.keyText.position : ratios.keyText.position;
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    grd.addColorStop(0, grdColors[0]);
                    grd.addColorStop(labelColorStop, grdColors[1]);
                    grd.addColorStop(1, grdColors[2]);
                    ctx.fillStyle = grd;
                }

                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);

            // @todo FIX !!!!
            } else if (scaleOrientation === 'horizontal') {

                let follWidthFreq = ((follFreq - thisFreq) / 3),
                    prevWidthFreq = ((thisFreq - prevFreq) / 3),
                    keyWidthFreq = follWidthFreq + prevWidthFreq;
                middleOffsetFreq = keyWidthFreq / 2;
                let xBeginFreq = thisFreq - middleOffsetFreq;
                
                keyHeight = this.cssDimensions.height * keyRatios.length;
                yBegin = (this.cssDimensions.height - keyHeight) * keyRatios.position;       
                xBegin = this.freqToPadPix(xBeginFreq);
                xEnd = this.freqToPadPix(xBeginFreq+keyWidthFreq);
                keyWidth = xEnd - xBegin;
                yEnd = keyHeight + yBegin;

                if (grdColors) {
                    // Set the middle color where there is the key label
                    // (the middle color is supposed to be the best to contrast with the key label)
                    let ratios = this.padSet.parameters.canvasObjectsRatios.ht;
                    let labelColorStop = ratios.key.position > 0.5 ? 1-ratios.keyText.position : ratios.keyText.position;
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    grd.addColorStop(0, grdColors[0]);
                    grd.addColorStop(labelColorStop, grdColors[1]);
                    grd.addColorStop(1, grdColors[2]);
                    ctx.fillStyle = grd;
                }

                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);

            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            this.canvasObjPos.keys.push(Object.freeze({
                type: 'ht',
                toneNumber: htNumber,
                //                      x0       y0
                begin: Object.freeze([xBegin, yBegin]),
                //                   x1     y1
                // end: Object.freeze([xEnd, yEnd])
                end: Object.freeze([xEnd, yEnd]),
                zindex: zindex
            }));
        }

        /**
         * Draws the text label for an FT key at the given scale position.
         *
         * @param {number}   pxPosition  - Pixel position along the scale axis (centre of the key).
         * @param {mcname}   note        - Tone name array `[noteName, sign, cents, isBlack]` as
         *   returned by `DHC.mcToName()`.
         *
         * @returns {void}
         *
         * @description
         * Formats the note-name string (appending a cent offset when non-zero) then
         * draws it inside the FT key rectangle. The text x-position mirrors the key
         * side when `canvasObjectsRatios.ft.key.position` is greater than 0.5; in
         * horizontal orientation a canvas rotation transform is applied when the
         * ratio's `rotation` property is set.
         */
        drawKeyLabelFT(pxPosition, note) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value,
                ratios = this.padSet.parameters.canvasObjectsRatios.ft,
                font = this.padSet.parameters.fonts.ft.keyLabel.value;
            //        note name
            let text = note[0];
            if (note[2] !== 0.0) {
                //             +/-       cents   cent symbol
                text += " " + note[1] + note[2] + "\u00A2";
            }
            if (scaleOrientation === 'vertical') {
                let keyWidth = this.cssDimensions.width * ratios.key.length,
                    xBegin = (this.cssDimensions.width - keyWidth) * ratios.key.position,
                    y = pxPosition,
                    // If the key switch side, mirrorize the keyText position
                    x = ratios.key.position > 0.5 ? (keyWidth * 2) - (keyWidth * ratios.keyText.position)
                                                  : xBegin + (keyWidth * ratios.keyText.position);
                ctx.textBaseline = "middle";
                ctx.font = font.getCss;
                ctx.fillText(text, x, y);
            } else if (scaleOrientation === 'horizontal') {
                let keyHeight = this.cssDimensions.height * ratios.key.length,
                    yBegin = (this.cssDimensions.height - keyHeight) * ratios.key.position,
                    // If the key switch side, mirrorize the keyText position
                    y = ratios.key.position > 0.5 ? (keyHeight * 2) - (keyHeight * ratios.keyText.position)
                                                  : yBegin + (keyHeight * ratios.keyText.position),
                    x = pxPosition;
                if (ratios.keyText.rotation) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI * ratios.keyText.rotation);
                    ctx.font = font.getCss;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                } else {
                    ctx.font = font.getCss;
                    ctx.textAlign = "center";
                    ctx.fillText(text, x, y);
                }
            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            if (close) {
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
        }
        
        /**
         * Draws both the line-label and the key-label for an HT tone.
         *
         * @param {number}   pxPosition  - Pixel position along the scale axis (centre of the line).
         * @param {mcname}   note        - Tone name array `[noteName, sign, cents, isBlack]` as
         *   returned by `DHC.mcToName()`.
         * @param {xtnum}    htNumber    - The HT number shown inside the key rectangle.
         *
         * @returns {void}
         *
         * @description
         * Renders two independent text items:
         * - **Line label**: the note name (with optional cent offset), positioned
         *   on the open side of the pad using `canvasObjectsRatios.ht.lineText`.
         * - **Key label**: the HT number string (`"H N"`), positioned inside the
         *   key rectangle using `canvasObjectsRatios.ht.keyText`.
         * Mirroring and canvas rotation transforms are applied according to key
         * position and orientation.
         */
        drawKeyLabelHT(pxPosition, note, htNumber) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value,
                ratios = this.padSet.parameters.canvasObjectsRatios.ht,
                fontKey = this.padSet.parameters.fonts.ht.keyLabel.value,
                fontLine = this.padSet.parameters.fonts.ht.lineLabel.value,
                x, y;
            //            note name
            let textNote = note[0];
            if (note[2] !== 0.0) {
                //                 +/-       cents   cent symbol
                textNote += " " + note[1] + note[2] + "\u00A2";
            }
            let textHT = "H " + htNumber;

            if (scaleOrientation === 'vertical') {
                // LINE TEXT
                y = pxPosition;
                // If the key switch side, mirrorize the lineText position
                x = ratios.key.position > 0.5 ? this.cssDimensions.width * ratios.lineText.position
                                              : this.cssDimensions.width * (1 - ratios.lineText.position);
                ctx.font = fontLine.getCss;
                ctx.textBaseline = "middle";
                ctx.textAlign = "left";
                ctx.fillText(textNote, x, y);

                // KEY TEXT
                let keyWidth = this.cssDimensions.width * ratios.key.length,
                    xBegin = (this.cssDimensions.width - keyWidth) * ratios.key.position;
                y = pxPosition;
                // If the key switch side, mirrorize the keyText position
                x = ratios.key.position > 0.5 ? (keyWidth * 2) - (keyWidth * ratios.keyText.position)
                                              : xBegin + (keyWidth * ratios.keyText.position);

                ctx.font = fontKey.getCss;
                ctx.textBaseline = "middle";
                ctx.textAlign = "right";
                ctx.fillText(textHT, x, y);
            
            } else if (scaleOrientation === 'horizontal') {
                // LINE TEXT
                x = pxPosition;
                y = ratios.key.position > 0.5 ? this.cssDimensions.height * ratios.lineText.position
                                              :  this.cssDimensions.height * (1 - ratios.lineText.position);
                // y = this.cssDimensions.height * ratios.lineText.position;
                if (ratios.lineText.rotation) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI * ratios.lineText.rotation);
                    ctx.font = fontLine.getCss;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillText(textNote, 0, 0);
                    ctx.restore();
                } else {
                    ctx.font = fontLine.getCss;
                    ctx.textAlign = "center";
                    ctx.fillText(textNote, x, y);
                }

                // KEY TEXT
                let keyHeight = this.cssDimensions.height * ratios.key.length,
                    yBegin = (this.cssDimensions.height - keyHeight) * ratios.key.position;
                // If the key switch side, mirrorize the keyText position
                y = ratios.key.position > 0.5 ? (keyHeight * 2) - (keyHeight * ratios.keyText.position)
                                              : yBegin + (keyHeight * ratios.keyText.position);
                x = pxPosition;
                if (ratios.lineText.rotation) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI * ratios.lineText.rotation);
                    ctx.font = fontLine.getCss;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "right";
                    ctx.fillText(textHT, 0, 0);
                    ctx.restore();
                } else {
                    ctx.font = fontLine.getCss;
                    ctx.textAlign = "center";
                    ctx.fillText(textNote, x, y);
                }

            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            if (close) {
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
        }

        /**
         * Full redraw of the frequency canvas.
         *
         * @returns {void}
         *
         * @description
         * Clears the canvas then renders all visual layers in the following order:
         * 1. FT reference lines (thin strokes at each FT frequency, highlighting `curr_ft`).
         * 2. FT keys (rectangles sized by key-ratio parameters; `curr_ft` drawn last
         *    so its drop-shadow covers adjacent keys).
         * 3. FT key labels (note names inside each FT key rectangle).
         * 4. HT reference lines (thin strokes at each HT frequency, highlighting `curr_ht`
         *    and any tones in `playQueue.ht`).
         * 5. HT keys (proportional rectangles coloured by HT colour, with drop-shadow
         *    on `curr_ht` and played tones).
         * 6. HT key and line labels (note names and HT numbers).
         * 7. Frequency monitor overlay (current pointer frequency).
         *
         * `canvasObjPos.keys` is reset to an empty array at the start so that
         * hit-testing always reflects the current render.
         */
        drawFreqUI() {
            let ctx = this.ctx,
                zindex = 0;
            const findIdxFn = function(queueTone) {
                return queueTone.xtNum === this;
            };
            this.canvasObjPos.keys = new Array();

            // Canvas init
            this.clearCanvas();
            ctx.lineWidth = 1;
            
            // =================
            //        FT
            // =================

            // - - - - - - - - -
            // FT LINES
            ctx.save();
            ctx.beginPath();
            for (let ft of this.freqArrays.ft) {
                let pxPosition = this.freqToPadPix(ft[1].hz);
                if (this.padSet.dhc.settings.ht.curr_ft === ft[0]) {
                    ctx.save();
                    ctx.fillStyle = '#db5757';                    
                    ctx.strokeStyle = '#db5757';
                    ctx.shadowColor = '#db5757';
                    // ctx.shadowOffsetX = 25;
                    ctx.shadowBlur = 15;
                    this.drawLinKey(pxPosition, false, false, 1);
                    // this.drawFreqLine(pxPosition, false);
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'gray';                    
                    ctx.strokeStyle = 'gray';                    
                    // this.drawFreqLine(pxPosition, false);
                    this.drawLinKey(pxPosition, false, false, 0.3);

                }
            }
            ctx.strokeStyle = 'grey';
            ctx.stroke();
            ctx.restore();
            
            // - - - - - - - - -
            // FT KEYS
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'grey';
            let curr_ft = false;
            zindex = 0;
            for (let ft of this.freqArrays.ft) {
                ctx.save();
                let pxPosition = this.freqToPadPix(ft[1].hz);
                let note = this.padSet.dhc.mcToName(ft[1].mc);
                if (this.padSet.dhc.settings.ht.curr_ft === ft[0]) {
                    // Draw the curr_ft as the last key
                    curr_ft = [pxPosition, ft[0]];
                    continue;
                }
                if (this.padSet.dhc.playQueue.ft.findIndex(findIdxFn, ft[0]) > -1) {
                    // this.drawLinKey(pxPosition, 'ft', ft[0], false, ['#DarkSalmon', 'DarkSalmon', '#110e23']);
                    this.drawLinKey(pxPosition, 'ft', ft[0], false, ['darksalmon', 'darksalmon', '#db9c57'], zindex);
                    // this.drawLinKey(pxPosition, 'ft', ft[0]);
                } else {
                    if (note[3]) {
                        this.drawLinKey(pxPosition, 'ft', ft[0], false, ['#28272d', '#514e5f', '#110e23'], zindex);
                        // this.drawFreqKeyFT(pxPosition, ft[0]);
                    } else {
                        ctx.fillStyle = 'white';
                        this.drawLinKey(pxPosition, 'ft', ft[0], false, ['white', 'white', '#cdcade'], zindex);
                        // this.drawFreqKeyFT(pxPosition, ft[0]);
                    }
                }
                zindex++;
                ctx.restore();
            }
            ctx.restore();
            // Draw the curr_ft as the last key
            // (it's shadow must cover the adjacent keys)
            if (curr_ft) {
                ctx.save();
                ctx.shadowColor = 'red';
                if (this.padSet.parameters.scaleOrientation.ft.value === 'vertical') {
                    ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                } else if (this.padSet.parameters.scaleOrientation.ft.value === 'horizontal') {
                    ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                }
                ctx.shadowBlur = 20;
                this.drawLinKey(curr_ft[0], 'ft', curr_ft[1], false, ['darksalmon', 'darksalmon', '#db9c57'], this.freqArrays.ft.length);
                ctx.restore();
            }

            // - - - - - - - - -
            // FT KEY LABELS
            ctx.save();
            ctx.beginPath();
            for (let ft of this.freqArrays.ft) {
                let pxPosition2 = this.freqToPadPix(ft[1].hz);
                let note = this.padSet.dhc.mcToName(ft[1].mc);
                if (note[3]) {
                    ctx.fillStyle = 'white';
                    this.drawKeyLabelFT(pxPosition2, note);
                } else {
                    ctx.fillStyle = 'black';
                    this.drawKeyLabelFT(pxPosition2, note);
                }
            }
            ctx.restore();
            // =================
            //        HT
            // =================

            // - - - - - - - - -
            // HT LINES
            ctx.save();
            ctx.beginPath();
            for (let ht of this.freqArrays.ht) {
                let pxPosition = this.freqToPadPix(ht[1].hz);
                let color = this.getHTcolor(ht[0]);

                if (this.padSet.dhc.settings.ht.curr_ht === ht[0]) {
                    ctx.save();
                    ctx.fillStyle = color[2];                    
                    ctx.strokeStyle = color[2];
                    ctx.shadowColor = color[2];
                    // ctx.shadowOffsetX = 25;
                    ctx.shadowBlur = 15;
                    this.drawLinKey(pxPosition, false, false, 1);
                    // this.drawFreqLine(pxPosition, false);
                    ctx.restore();
                } // else 
                if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) {
                    ctx.save();
                    ctx.fillStyle = color[2];                    
                    ctx.strokeStyle = color[2];
                    ctx.shadowColor = color[2];
                    // ctx.shadowOffsetX = 25;
                    ctx.shadowBlur = 15;
                    this.drawLinKey(pxPosition, false, false, 1);
                    // this.drawFreqLine(pxPosition, false);
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'gray';                    
                    ctx.strokeStyle = 'gray';
                    // this.drawFreqLine(pxPosition, false);
                    this.drawLinKey(pxPosition, false, false, 0.3);

                }
                // this.drawFreqLine(pxPosition, false);
            }
            ctx.strokeStyle = 'grey';
            ctx.stroke();
            ctx.restore();

            // - - - - - - - - -
            // HT KEYS
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'grey';
            zindex = 0;
            for (const [arrIdx, ht] of this.freqArrays.ht.entries()) {
                ctx.save();
                let color = this.getHTcolor(ht[0]);
                // if (this.padSet.dhc.settings.ht.curr_ht === ht[0]) { // Only the last played HT
                //     ctx.shadowColor = color[2];
                //     ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                //     ctx.shadowBlur = 20;
                // } // else if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) { // All the played HTs
                //     ctx.shadowColor = color[2];
                //     ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                //     ctx.shadowBlur = 20;
                // }
                // if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) { // All the played HTs
                if (this.padSet.dhc.settings.ht.curr_ht === ht[0]) { // Only the last played HT
                    ctx.shadowColor = color[2];
                    if (this.padSet.parameters.scaleOrientation.ht.value === 'vertical') {
                        ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    } else if (this.padSet.parameters.scaleOrientation.ht.value === 'horizontal') {
                        ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    }
                    ctx.shadowBlur = 20;
                }
                if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) {
                    ctx.shadowColor = color[2];
                    if (this.padSet.parameters.scaleOrientation.ht.value === 'vertical') {
                        ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    } else if (this.padSet.parameters.scaleOrientation.ht.value === 'horizontal') {
                        ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    }
                    ctx.shadowBlur = 20;
                    // The 2nd color of the passed array is supposed to be the best to contrast with the key label
                    this.drawFreqKeyHT(ht[1].hz, ht[0], arrIdx, [color[2], color[0], color[2]], zindex);
                } else {
                    ctx.fillStyle = this.getHTcolor(ht[0]);
                    this.drawFreqKeyHT(ht[1].hz, ht[0], arrIdx, [color[0], color[0], color[0]], zindex);
                }
                ctx.restore();
                zindex++;
            }
            ctx.restore();

            // - - - - - - - - -
            // HT KEY & LINE LABELS
            ctx.save();
            ctx.beginPath();
            for (let ht of this.freqArrays.ht) {
                let pxPosition = this.freqToPadPix(ht[1].hz);
                let note = this.padSet.dhc.mcToName(ht[1].mc);
                ctx.fillStyle = 'black';
                this.drawKeyLabelHT(pxPosition, note, ht[0]);
            }
            ctx.restore();

            this.drawFreqMonitor();

        }
        // drawVolumeLines: function(dist, width) {
        //     for(var x=0; x<width; x+=dist) {
        //         ctx.moveTo(x,0);
        //         ctx.lineTo(x,width);
        //     }
        //     ctx.strokeStyle='grey';
        //     ctx.stroke();
        // },
        /**
         * Draws the current-frequency text overlay on the canvas corner.
         *
         * @returns {void}
         *
         * @description
         * Renders `currentFreq` (in Hz, formatted to the DHC `hz_accuracy` decimal
         * places) as a filled-and-stroked text string. The corner position is
         * controlled by `canvasObjectsRatios[type].hzMonitor` and mirrors to the
         * correct corner based on `key.position` and scale orientation. The stroke
         * is white so the label remains readable against any background. Does
         * nothing when `currentFreq` is falsy.
         */
        drawFreqMonitor() {
            if (this.currentFreq) {
                let ctx = this.ctx,
                    font = this.padSet.parameters.fonts[this.type].hzMonitor.value.getCss,
                    scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value,
                    ratios = this.padSet.parameters.canvasObjectsRatios[this.type],
                    text = this.currentFreq.toFixed(this.padSet.dhc.settings.global.hz_accuracy.value) + ' Hz',
                    x, y;

                ctx.save();
                ctx.font = font;
                if (scaleOrientation === 'vertical') {
                    x = this.cssDimensions.width * ratios.hzMonitor.width;
                    y = this.cssDimensions.height * ratios.hzMonitor.height;
                    if (ratios.key.position > 0.5) {
                        ctx.textBaseline = "bottom";
                        ctx.textAlign = "left";
                        x = this.cssDimensions.width * (1 - ratios.hzMonitor.width);
                    } else {
                        ctx.textBaseline = "bottom";
                        ctx.textAlign = "right";
                    }
                    ctx.textBaseline = "bottom";
                } else if (scaleOrientation === 'horizontal') {
                    x = this.cssDimensions.width * ratios.hzMonitor.height;            
                    y = this.cssDimensions.height * ratios.hzMonitor.width;
                    if (ratios.key.position > 0.5) {
                        ctx.textBaseline = "top";
                        ctx.textAlign = "right";
                        y = this.cssDimensions.height * (1 - ratios.hzMonitor.width);
                    } else {
                        ctx.textBaseline = "bottom";
                        ctx.textAlign = "right";
                    }
                }
                ctx.fillStyle = 'black';
                ctx.fillText(text, x, y);
                
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                // ctx.miterLimit = 3;
                ctx.strokeText(text, x, y);
                ctx.restore();
            }
        }

        /**
         * Rebuilds the cached FT and HT frequency arrays for the current pad range.
         *
         * @returns {void}
         *
         * @description
         * Iterates `DHC.tables.ft` and `DHC.tables.ht`, keeping only those tones
         * whose frequency falls within the current `freqRange.min` / `freqRange.max`
         * bounds. Whether each tone-type is included is controlled by the
         * `scaleDisplay.ft` and `scaleDisplay.ht` parameters. Both arrays are
         * sorted ascending by frequency and then frozen with `Object.freeze()` so
         * that callers can rely on their immutability until the next call.
         * The HT entry for `htNum === '-1'` (the FT reference marker) is always
         * excluded from the HT array.
         */
        refillFreqArrays() {
            this.freqArrays.ft = new Array();
            this.freqArrays.ht = new Array();
            let freqRange = this.padSet.parameters.freqRange[this.type];
            if (this.padSet.parameters.scaleDisplay.ft.value.includes(this.type)) {
                // Takes only the frequencies inside the pad Hz range
                for (const [ftNum, xtone] of Object.entries(this.padSet.dhc.tables.ft)) {
                    if (xtone.hz >= freqRange.min.value && xtone.hz <= freqRange.max.value) {
                        this.freqArrays.ft.push(Object.freeze([Number(ftNum), xtone]));                
                    }
                }
                // Sort ascending by Frequancy
                this.freqArrays.ft.sort((a, b) => a[1].hz-b[1].hz);
            }
            if (this.padSet.parameters.scaleDisplay.ht.value.includes(this.type)) {
                // Takes only the frequencies inside the pad Hz range
                for (const [htNum, xtone] of Object.entries(this.padSet.dhc.tables.ht)) {
                    if (xtone.hz >= freqRange.min.value && xtone.hz <= freqRange.max.value) {
                        if (htNum !== '-1') {
                            this.freqArrays.ht.push(Object.freeze([Number(htNum), xtone]));
                        }               
                    }
                }
                // Sort ascending by Frequancy
                this.freqArrays.ht.sort((a, b) => a[1].hz-b[1].hz);
            }
            Object.freeze(this.freqArrays.ft);
            Object.freeze(this.freqArrays.ht);
        }

        /**
         * Converts a frequency value to a canvas pixel position.
         *
         * @param {hertz} frequency  - The frequency to convert.
         *
         * @returns {number} Pixel offset from the canvas origin (top-left).
         *
         * @description
         * Delegates to the parent `DpPad.freqToPix()` logarithmic converter, then
         * adjusts for scale orientation:
         * - `'vertical'`: the y-axis is inverted so that low frequencies appear at
         *   the bottom (`height − raw pixel`).
         * - `'horizontal'`: the x-axis is used directly (left = low, right = high).
         */
        freqToPadPix(frequency) {
            let freqRange = this.padSet.parameters.freqRange[this.type],
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value;
            if (scaleOrientation === 'vertical') {
                // Reverse the y coordinate (we need from bottom to top)
                return (this.cssDimensions.height - this.padSet.dpPadComponent.freqToPix(frequency, freqRange, this.cssDimensions.height));
            } else if (scaleOrientation === 'horizontal') {
                // x coordinate is ok (from left to right)
                return this.padSet.dpPadComponent.freqToPix(frequency, freqRange, this.cssDimensions.width);
            } else {
                alert('A "scaleOrientation" parameter is invalid: ' + scaleOrientation);
            }
        }
        /**
         * Converts a pointer position to a frequency.
         *
         * @param {mousestate|touchstate} pointer  - The mouse or touch state object
         *   whose `x` / `y` coordinates are used.
         *
         * @returns {hertz} The frequency corresponding to the pointer position.
         *
         * @description
         * The inverse of `freqToPadPix()`. Delegates to `DpPad.pixToFreq()` after
         * adjusting the pixel coordinate for scale orientation:
         * - `'vertical'`: `height − pointer.y` restores the bottom-to-top mapping.
         * - `'horizontal'`: `pointer.x` is used directly.
         */
        PadPixToFreq(pointer) {
            let freqRange = this.padSet.parameters.freqRange[this.type],
                scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value;
            if (scaleOrientation === 'vertical') {
                // Reverse the y coordinate (we need from bottom to top)
                let pxPosition = this.cssDimensions.height - pointer.y;
                return (this.padSet.dpPadComponent.pixToFreq(pxPosition, freqRange, this.cssDimensions.height));
            } else if (scaleOrientation === 'horizontal') {
                // x coordinate is ok (from left to right)
                return this.padSet.dpPadComponent.pixToFreq(pointer.x, freqRange, this.cssDimensions.width);
            } else {
                alert('A "scaleOrientation" parameter is invalid: ' + scaleOrientation);
            }
        }

        /**
         * Draws a filled circle at the pointer position (debug/utility helper).
         *
         * @param {mousestate|touchstate} pointer  - Object with `x` and `y` canvas coordinates.
         * @param {number}                size     - Radius of the dot in pixels.
         *
         * @returns {void}
         */
        drawDot(pointer, size) {
            let ctx = this.ctx;
            // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
            let r=0, g=0, b=0, a=255;
            // Select a fill style
            ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
            // Draw a filled circle
            ctx.beginPath();
            ctx.arc(pointer.x, pointer.y, size, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fill();
        }
        /**
         * Draws a line segment from the last pointer position to the current one
         * (debug/utility helper).
         *
         * @param {mousestate|touchstate} pointer  - Object with `x`, `y`, and `last`
         *   (`{x, y}`) canvas coordinates. `pointer.last` is updated to the current
         *   position after the line is drawn.
         * @param {number}                size     - Line width in pixels.
         *
         * @returns {void}
         *
         * @description
         * If `pointer.last.x` is `false` (first call) the start point is
         * initialised to the current position so no stray line is drawn.
         */
        drawLine(pointer, size) {
            // If pointer.last.x is not set, set pointer.last.x and pointer.last.y to the current position 
            if (pointer.last.x === false) {
                pointer.last.x = pointer.x;
                pointer.last.y = pointer.y;
            }
            // =============================================
            let ctx = this.ctx;
            // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
            let r=0, g=0, b=0, a=255;
            // Select a fill style
            ctx.strokeStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
            // Set the line "cap" style to round, so lines at different angles can join into each other
            ctx.lineCap = "round";
            //ctx.lineJoin = "round";
            // Draw a filled line
            ctx.beginPath();
            // First, move to the old (previous) position
            ctx.moveTo(pointer.last.x, pointer.last.y);
            // Now draw a line to the current touch/pointer position
            ctx.lineTo(pointer.x, pointer.y);
            // Set the line thickness and draw the line
            ctx.lineWidth = size;
            ctx.stroke();
            ctx.closePath();
            // =============================================
            // Update the last position to reference the current position
            pointer.last.x = pointer.x;
            pointer.last.y = pointer.y;
        }
    };

    return DpPad;

}();
