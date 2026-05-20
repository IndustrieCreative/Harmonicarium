/**
 * @fileoverview Diphonic Pad touch/mouse interface for the Harmonicarium application.
 * This file defines the top-level {@link HUM.DpPad} IIFE constructor, which implements
 * the primary graphical user interface designed for touch and mobile devices. It
 * renders two canvas-based frequency pads (FT and HT) side-by-side with an SVG
 * toolbar, reacting to pointer and touch events to drive the DHC in real-time.
 * The sub-components are defined in the companion files:
 * - {@link module:diphonicpad-css-font}       — `CssFont` inner helper class
 * - {@link module:diphonicpad-voice-ambitus}  — `VoiceAmbitus` inner helper class
 * - {@link module:diphonicpad-padset}         — `DpPad.PadSet` class
 * - {@link module:diphonicpad-parameters}     — `DpPad.PadSet.prototype.Parameters` class
 * - {@link module:diphonicpad-frequencypad}   — `DpPad.PadSet.FrequencyPad` class
 * - {@link module:diphonicpad-toolbar}        — `DpPad.PadSet.Toolbar` class
 *
 * @module diphonicpad
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

/* "requestAnimationFrame" Fallback method
 * requestAnimFrame shim layer by Paul Irish
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
 * defines and returns the {@link HUM.DpPad~DpPad|DpPad} constructor. The inner
 * helper classes ({@link HUM.DpPad~VoiceAmbitus|VoiceAmbitus},
 * {@link HUM.DpPad~CssFont|CssFont}) and static sub-classes
 * ({@link HUM.DpPad.PadSet|PadSet}, {@link HUM.DpPad.PadSet.Toolbar|Toolbar},
 * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad}) are defined in the
 * companion `diphonicpad-*.js` files and attached to `HUM.DpPad` at load time.
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
                    padsRatio = padSet.parameters.padsRatio,
                    iconQty = padSet.parameters.toolbarIconOrder.value.length;
                // First calculate CSS dimensions
                if (this.settings.orientation === 'vertical') {

                    if (padSet.parameters.toolbarOrientation.value === 'longitudinal') {
                        tbHeight = this.viewportDim.y;
                        tbWidth = Math.min(Math.ceil(tbHeight / iconQty), Math.floor(this.viewportDim.x * 0.1));

                        ftCnvWidth =  Math.floor( ((this.viewportDim.x - tbWidth) * padsRatio.ft) / numberOfSets )-1;
                        ftCnvHeight = Math.floor( this.viewportDim.y )-1;
                        htCnvWidth =  Math.floor( ((this.viewportDim.x - tbWidth)* padsRatio.ht) / numberOfSets )-1;
                        htCnvHeight = Math.floor( this.viewportDim.y )-1;

                    
                    } else if (padSet.parameters.toolbarOrientation.value === 'transversal') {
                        tbWidth = this.viewportDim.x / numberOfSets;
                        tbHeight = Math.min(Math.ceil(tbWidth / iconQty), Math.floor(this.viewportDim.y * 0.1));

                        ftCnvWidth = Math.floor( (this.viewportDim.x * padsRatio.ft) / numberOfSets )-1;
                        ftCnvHeight = Math.floor( this.viewportDim.y - tbHeight )-1;
                        htCnvWidth = Math.floor( (this.viewportDim.x * padsRatio.ht) / numberOfSets )-1;
                        htCnvHeight = Math.floor( this.viewportDim.y - tbHeight )-1;
                    }

                } else if (this.settings.orientation === 'horizontal') {

                    if (padSet.parameters.toolbarOrientation.value === 'longitudinal') {
                        tbWidth = this.viewportDim.x / numberOfSets;
                        tbHeight = Math.min(Math.ceil(tbWidth / iconQty), Math.floor(this.viewportDim.y * 0.1));

                        ftCnvWidth = Math.floor( this.viewportDim.x )-1;
                        ftCnvHeight = Math.floor( ((this.viewportDim.y - tbHeight) * padsRatio.ft) / numberOfSets )-1;
                        htCnvWidth = Math.floor( this.viewportDim.x )-1;
                        htCnvHeight = Math.floor( ((this.viewportDim.y - tbHeight)* padsRatio.ht) / numberOfSets )-1;
                    
                    } else if (padSet.parameters.toolbarOrientation.value === 'transversal') {
                        tbHeight = this.viewportDim.y;
                        tbWidth = Math.min(Math.ceil(tbHeight / iconQty), Math.floor(this.viewportDim.x * 0.1));

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

                // Resize spectrogram canvases to match CSS pad dimensions
                padSet.spectrogram.resize(ftCnvWidth, ftCnvHeight, htCnvWidth, htCnvHeight);

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

    return DpPad;

}();
