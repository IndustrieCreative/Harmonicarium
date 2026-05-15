/**
 * @fileoverview FrequencyPad class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} class,
 * a single canvas-based frequency pad that renders and plays FT or HT tones. It
 * handles all drawing (logarithmic scale, keys, labels, Hz monitor) and pointer/touch
 * interaction (hit-testing, note-on/off dispatch). It is split out from the main
 * {@link module:diphonicpad} module.
 *
 * @module diphonicpad-frequencypad
 * @memberof HUM.DpPad.PadSet
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
HUM.DpPad.PadSet.FrequencyPad = class {
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
        // Keys currently held (ringing without physical pointer press).
        // Set when a key is released in the spectrogram zone; cleared on
        // normal in-key-area release or panic.
        this.holdKeys = {
            ft: false,
            ht: false
        };
        // Tracks whether a continuum (fretless, between-keys) tone is currently active.
        this.activeContinuum = {
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
    /**
     * Returns `true` if `pointer` is in the spectrogram (non-key) zone of
     * this pad canvas.
     *
     * @param {{x:number, y:number}} pointer - Object with canvas-relative x/y.
     *
     * @returns {boolean}
     *
     * @description
     * The key zone occupies one side of the canvas (left/right in vertical
     * orientation, top/bottom in horizontal orientation) as determined by
     * `canvasObjectsRatios[type].key.position`.  The spectrogram zone is the
     * opposite side.  When `position <= 0.5` the keys are on the
     * left/top, so the spectrogram zone is to the right/below; when
     * `position > 0.5` the keys are on the right/bottom and the spectrogram
     * zone is to the left/above.
     */
    _isInSpectrogramZone(pointer) {
        const scaleOrientation = this.padSet.parameters.scaleOrientation[this.type].value;
        const keyRatios = this.padSet.parameters.canvasObjectsRatios[this.type].key;
        if (scaleOrientation === 'vertical') {
            const keyWidth = this.cssDimensions.width * keyRatios.length;
            const keyLeft  = (this.cssDimensions.width - keyWidth) * keyRatios.position;
            const keyRight = keyLeft + keyWidth;
            return keyRatios.position <= 0.5
                ? pointer.x > keyRight    // keys on left  → spectrogram is to the right
                : pointer.x < keyLeft;    // keys on right → spectrogram is to the left
        } else {
            const keyHeight = this.cssDimensions.height * keyRatios.length;
            const keyTop    = (this.cssDimensions.height - keyHeight) * keyRatios.position;
            const keyBottom = keyTop + keyHeight;
            return keyRatios.position <= 0.5
                ? pointer.y > keyBottom   // keys on top    → spectrogram is below
                : pointer.y < keyTop;     // keys on bottom → spectrogram is above
        }
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
        const mouse = this.padSet.dpPadComponent.mouse;
        const inSpectrogramZone = this._isInSpectrogramZone(mouse);

        // Mute any active continuum tone on pointer-up.
        if (this.activeContinuum.ft) {
            this.padSet.dhc.muteFTcontinuum(HUM.DHCmsg.ftOFFcontinuum('dppad', 0, 0));
            this.activeContinuum.ft = false;
        }
        if (this.activeContinuum.ht) {
            this.padSet.dhc.muteHTcontinuum(HUM.DHCmsg.htOFFcontinuum('dppad', 0, 0));
            this.activeContinuum.ht = false;
        }

        if (this.activeKeys.ft !== false) {
            if (inSpectrogramZone) {
                // Hold gesture: transfer the active key to hold; note keeps ringing.
                this.holdKeys.ft = this.activeKeys.ft;
                this.activeKeys.ft = false;
            } else {
                // Normal release: mute the active key and cancel any existing hold.
                // console.log('MOUSEUP FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                this.activeKeys.ft = false;
                if (this.holdKeys.ft !== false) {
                    this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.holdKeys.ft.toneNumber));
                    this.holdKeys.ft = false;
                }
            }
        }
        if (this.activeKeys.ht !== false) {
            if (inSpectrogramZone) {
                this.holdKeys.ht = this.activeKeys.ht;
                this.activeKeys.ht = false;
            } else {
                // console.log('MOUSEUP HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                this.activeKeys.ht = false;
                if (this.holdKeys.ht !== false) {
                    this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.holdKeys.ht.toneNumber));
                    this.holdKeys.ht = false;
                }
            }
        }
        // Redraw to reflect the updated hold state (no DHC message fires when
        // hold is activated, so we must trigger the redraw manually).
        this.drawFreqUI();
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
     * Uses `getBoundingClientRect()` to compute the canvas-relative position,
     * which remains correct regardless of the CSS positioning context of
     * ancestor elements (e.g. `position: relative` on the pad container).
     * Only single-finger touches are processed; multi-touch is ignored.
     */
    updateTouchPosition(e) {
        if(e.targetTouches) {
            if (e.targetTouches.length === 1) { // Only deal with one finger
                let thisTouch = e.targetTouches[0]; // Get the information for finger #1
                const rect = thisTouch.target.getBoundingClientRect();
                this.touch.x = thisTouch.clientX - rect.left;
                this.touch.y = thisTouch.clientY - rect.top;
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
        this.touch.down = false;

        // Mute any active continuum tone on touch-end.
        if (this.activeContinuum.ft) {
            this.padSet.dhc.muteFTcontinuum(HUM.DHCmsg.ftOFFcontinuum('dppad', 0, 0));
            this.activeContinuum.ft = false;
        }
        if (this.activeContinuum.ht) {
            this.padSet.dhc.muteHTcontinuum(HUM.DHCmsg.htOFFcontinuum('dppad', 0, 0));
            this.activeContinuum.ht = false;
        }

        // Determine final touch position from changedTouches (the lifted finger).
        // e.targetTouches would already omit it, so we must use changedTouches.
        let finalX = this.touch.x;
        let finalY = this.touch.y;
        if (e.changedTouches && e.changedTouches.length > 0) {
            const ct = e.changedTouches[0];
            const rect = ct.target.getBoundingClientRect();
            finalX = ct.clientX - rect.left;
            finalY = ct.clientY - rect.top;
        }
        const finalPos = { x: finalX, y: finalY };
        const inSpectrogramZone = this._isInSpectrogramZone(finalPos);

        // let frequency = this.PadPixToFreq(this.touch);

        if (this.activeKeys.ft !== false) {
            if (inSpectrogramZone) {
                // Hold gesture: transfer the active key to hold; note keeps ringing.
                this.holdKeys.ft = this.activeKeys.ft;
                this.activeKeys.ft = false;
            } else {
                // Normal release: mute the active key and cancel any existing hold.
                // console.log('TOUCHEND FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                this.activeKeys.ft = false;
                if (this.holdKeys.ft !== false) {
                    this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.holdKeys.ft.toneNumber));
                    this.holdKeys.ft = false;
                }
            }
        }
        if (this.activeKeys.ht !== false) {
            if (inSpectrogramZone) {
                this.holdKeys.ht = this.activeKeys.ht;
                this.activeKeys.ht = false;
            } else {
                // console.log('TOUCHEND HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                this.activeKeys.ht = false;
                if (this.holdKeys.ht !== false) {
                    this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.holdKeys.ht.toneNumber));
                    this.holdKeys.ht = false;
                }
            }
        }
        // Redraw to reflect the updated hold state.
        this.drawFreqUI();

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
                        // Determine the currently sounding key: actively pressed, or held.
                        const currentSounding = this.activeKeys[type] !== false
                            ? this.activeKeys[type]
                            : this.holdKeys[type];
                        if (currentSounding === false) {
                            // Nothing is sounding: just play the pressed key
                            noteON[type] = objectFound;
                        } else if (currentSounding.toneNumber !== objectFound.toneNumber) {
                            // A different key is sounding: switch to the pressed key
                            noteOFF[type] = currentSounding;
                            noteON[type] = objectFound;
                        } else {
                            // Same key already sounding.
                            // If it's a held note (no pointer actively pressing it),
                            // tapping it cancels the hold and silences the voice.
                            if (this.activeKeys[type] === false && this.holdKeys[type] !== false) {
                                noteOFF[type] = currentSounding;
                            }
                            // If activeKeys[type] is set, pointer is still down on the
                            // same key — do nothing (natural re-press while sliding).
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

                // If a continuum tone is playing and the pointer just hit a discrete key,
                // mute the continuum voice first so they don't overlap.
                if (this.activeContinuum.ft) {
                    this.padSet.dhc.muteFTcontinuum(HUM.DHCmsg.ftOFFcontinuum('dppad', 0, 0));
                    this.activeContinuum.ft = false;
                }
                if (this.activeContinuum.ht) {
                    this.padSet.dhc.muteHTcontinuum(HUM.DHCmsg.htOFFcontinuum('dppad', 0, 0));
                    this.activeContinuum.ht = false;
                }

                // ====== FT ======
                if (noteOFF.ft !== false) {
                    // console.log('PLAY FT NOTE OFF: ' + noteOFF.ft.toneNumber);
                    this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', noteOFF.ft.toneNumber));
                    this.activeKeys.ft = false;
                    // Also clear the hold if it was the held key that got displaced
                    if (this.holdKeys.ft !== false && this.holdKeys.ft.toneNumber === noteOFF.ft.toneNumber) {
                        this.holdKeys.ft = false;
                    }
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
                    // Also clear the hold if it was the held key that got displaced
                    if (this.holdKeys.ht !== false && this.holdKeys.ht.toneNumber === noteOFF.ht.toneNumber) {
                        this.holdKeys.ht = false;
                    }
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
                        if (this._isInSpectrogramZone(pointer)) {
                            // Pointer is sliding in the spectrogram zone: keep the note
                            // ringing so the hold gesture can complete on pointer-up.
                        } else {
                            // console.log('PLAY FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                            this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                            this.activeKeys.ft = false;
                        }
                    }
                    // ====== FT CONTINUUM ======
                    if (this.type === 'ft') {
                        if (pointer.down !== false) {
                            // Pointer is pressed in free (between-keys) area: glide continuously.
                            this.padSet.dhc.playFTcontinuum(HUM.DHCmsg.ftONcontinuum('dppad', frequency, HUM.DHC.freqToMc(frequency), 120));
                            this.activeContinuum.ft = true;
                        } else if (this.activeContinuum.ft) {
                            // Pointer was released in free area: stop the continuum tone.
                            this.padSet.dhc.muteFTcontinuum(HUM.DHCmsg.ftOFFcontinuum('dppad', frequency, HUM.DHC.freqToMc(frequency)));
                            this.activeContinuum.ft = false;
                        }
                    }
                }
                if (!keyFound.ht) {
                    if (this.activeKeys.ht !== false) {
                        if (this._isInSpectrogramZone(pointer)) {
                            // Same pre-hold logic for HT
                        } else {
                            // console.log('PLAY HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                            this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                            this.activeKeys.ht = false;
                        }
                    }
                    // ====== HT CONTINUUM ======
                    if (this.type === 'ht') {
                        if (pointer.down !== false) {
                            // Pointer is pressed in free (between-keys) area: glide continuously.
                            this.padSet.dhc.playHTcontinuum(HUM.DHCmsg.htONcontinuum('dppad', frequency, HUM.DHC.freqToMc(frequency), 120));
                            this.activeContinuum.ht = true;
                        } else if (this.activeContinuum.ht) {
                            // Pointer was released in free area: stop the continuum tone.
                            this.padSet.dhc.muteHTcontinuum(HUM.DHCmsg.htOFFcontinuum('dppad', frequency, HUM.DHC.freqToMc(frequency)));
                            this.activeContinuum.ht = false;
                        }
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
        // Silence any held notes (they are still sending audio even though
        // no pointer is down).
        if (this.holdKeys.ft !== false) {
            this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.holdKeys.ft.toneNumber));
            this.holdKeys.ft = false;
        }
        if (this.holdKeys.ht !== false) {
            this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.holdKeys.ht.toneNumber));
            this.holdKeys.ht = false;
        }
        // Silence any active continuum tone.
        if (this.activeContinuum.ft) {
            this.padSet.dhc.muteFTcontinuum(HUM.DHCmsg.ftOFFcontinuum('dppad', 0, 0));
            this.activeContinuum.ft = false;
        }
        if (this.activeContinuum.ht) {
            this.padSet.dhc.muteHTcontinuum(HUM.DHCmsg.htOFFcontinuum('dppad', 0, 0));
            this.activeContinuum.ht = false;
        }
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
            if (this.holdKeys.ft !== false && this.holdKeys.ft.toneNumber === ft[0]) {
                // Held key: draw with cyan glow toward the spectrogram side
                ctx.shadowColor = '#00e5ff';
                if (this.padSet.parameters.scaleOrientation.ft.value === 'vertical') {
                    ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                } else if (this.padSet.parameters.scaleOrientation.ft.value === 'horizontal') {
                    ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                }
                ctx.shadowBlur = 20;
                this.drawLinKey(pxPosition, 'ft', ft[0], false, ['#00e5ff', '#80f0ff', '#00e5ff'], zindex);
            } else if (this.padSet.dhc.playQueue.ft.findIndex(findIdxFn, ft[0]) > -1) {
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
            if (this.holdKeys.ft !== false && this.holdKeys.ft.toneNumber === curr_ft[1]) {
                // curr_ft is held: override with cyan hold visual
                ctx.shadowColor = '#00e5ff';
                if (this.padSet.parameters.scaleOrientation.ft.value === 'vertical') {
                    ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                } else if (this.padSet.parameters.scaleOrientation.ft.value === 'horizontal') {
                    ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                }
                ctx.shadowBlur = 20;
                this.drawLinKey(curr_ft[0], 'ft', curr_ft[1], false, ['#00e5ff', '#80f0ff', '#00e5ff'], this.freqArrays.ft.length);
            } else {
                ctx.shadowColor = 'red';
                if (this.padSet.parameters.scaleOrientation.ft.value === 'vertical') {
                    ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                } else if (this.padSet.parameters.scaleOrientation.ft.value === 'horizontal') {
                    ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                }
                ctx.shadowBlur = 20;
                this.drawLinKey(curr_ft[0], 'ft', curr_ft[1], false, ['darksalmon', 'darksalmon', '#db9c57'], this.freqArrays.ft.length);
            }
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
            if (this.holdKeys.ht !== false && this.holdKeys.ht.toneNumber === ht[0]) {
                // Held key: draw with cyan glow toward the spectrogram side
                ctx.shadowColor = '#00e5ff';
                if (this.padSet.parameters.scaleOrientation.ht.value === 'vertical') {
                    ctx.shadowOffsetX = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                } else if (this.padSet.parameters.scaleOrientation.ht.value === 'horizontal') {
                    ctx.shadowOffsetY = this.padSet.parameters.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                }
                ctx.shadowBlur = 20;
                this.drawFreqKeyHT(ht[1].hz, ht[0], arrIdx, ['#00e5ff', '#80f0ff', '#00e5ff'], zindex);
            } else if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) {
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
