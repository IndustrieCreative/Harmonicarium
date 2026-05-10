/**
 * @fileoverview Toolbar class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.PadSet.Toolbar|Toolbar} class, the
 * SVG-based icon toolbar that sits alongside the frequency pads inside a
 * {@link HUM.DpPad.PadSet|PadSet}. It is split out from the main
 * {@link module:diphonicpad} module.
 *
 * @module diphonicpad-toolbar
 * @memberof HUM.DpPad.PadSet
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

{
    const DpPad = HUM.DpPad;

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

}