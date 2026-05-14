
/**
 * @fileoverview Parameters class for the Harmonicarium Hancock virtual keyboard.
 * This file defines the {@link HUM.Hancock.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.Hancock} instance (active state, piano container, velocity, MIDI
 * channel, key offset, octave range, and display dimensions). It is split out
 * from the main {@link module:hancock} module.
 *
 * @module hancock-parameters
 * @memberof HUM.Hancock
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
 * Parameter container for the `HUM.Hancock` instance.
 *
 * @class
 * @memberof HUM.Hancock
 *
 * @description
 * Container class that instantiates and exposes all `HUM.Param` objects used
 * by a `HUM.Hancock` instance. Each property corresponds to a configurable
 * aspect of the virtual piano keyboard, such as velocity, MIDI channel,
 * keyboard range, key offset, and display dimensions.
 */
HUM.Hancock.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given Hancock controller.
     *
     * @param {HUM.Hancock} hancock - The Hancock instance that owns this parameter set.
     *
     * @description
     * Instantiates all `HUM.Param` objects for the Hancock controller:
     * - `active`: Tracks whether the Piano accordion tab is open.
     * - `pianoContainer`: Proxy for the Hancock piano DOM container.
     * - `velocity`: MIDI velocity sent with each key event (1–127).
     * - `channel`: MIDI channel used for key events (1–16).
     * - `offset`: Starting MIDI note number of the leftmost visible key.
     * - `range`: Number of octaves displayed by the keyboard.
     * - `width`: Keyboard width in pixels.
     * - `height`: Keyboard height in pixels.
     */
    constructor(hancock) {
        /**  
         * This property controls the state of the Hancock; if `false`, it's turned off in order to avoid
         * unnecessary computations and updates of the UI when the panel is closed.
         * It also initialises the eventListener of the UIelems related to it.
         * It's not stored on the DB.
         * NOTE: These uiElements are the same object because, given the current implementation of
         * Param.UIelem, it's not possible to set more event listeners using a single UIelem.
         *
         * @member {HUM.Param}
         * 
         * @property {boolean}     value                          - The visibility one wants to achieve. If `false` the tab will be collapsed.
         * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn                  - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.fn.hancockTabShown  - The HTML of the Hancock tab.
         * @property {HTMLElement} uiElements.fn.hancockTabHidden - The HTML of the Hancock tab.
         */
        this.active = new HUM.Param({
            app:hancock,
            idbKey:'hancockActive',
            uiElements:{
                'hancockTabShown': new HUM.Param.UIelem({
                    htmlID: hancock.dhc.harmonicarium.html.pianoTabs[hancock.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget:'collapse',
                    eventType: 'show.bs.collapse',
                    uiSet: (value) => {
                        if (value) {
                            this.active.bsCollapse.show();
                        } else {
                            this.active.bsCollapse.hide();
                        }
                    },
                    eventListener: evt => {
                        this.active.valueUI = true;
                    }
                }),
                'hancockTabHidden': new HUM.Param.UIelem({
                    htmlID: hancock.dhc.harmonicarium.html.pianoTabs[hancock.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget:'collapse',
                    eventType: 'hidden.bs.collapse',
                    uiSet: null,
                    eventListener: evt => {
                        this.active.valueUI = false;
                    }
                }),
            },
            init:false,
            dataType:'boolean',
            initValue:false,
            presetStore:false,
            presetRestore:false,
            preInit: () => {
                // Create a Bootstrap collapsible controller
                this.active.bsCollapse = new bootstrap.Collapse('#'+hancock.dhc.harmonicarium.html.pianoTabs[hancock.dhc.id].children[1].id, {
                    toggle: this.active.value
                });
            },
            postSet: (value, thisParam, init) => {
                if (!value) {
                    // Turn off all the tones currently active, if there are
                    hancock.allNotesOff();
                }
            }
        });
        /**  
         * This property it's just a proxy for the HTML container of the Hancock piano.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {Object}      uiElements                      - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out                  - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.hancockContainer - The HTML Hancock piano container.
         */
        this.pianoContainer = new HUM.Param({
            app:hancock,
            idbKey:'hancockPianoContainer',
            uiElements:{
                'hancockContainer': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
        });
        /**  
         * This property controls the velocity amount for the Hancock piano and initialises the
         * eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {velocity}    value                        - The velocity value to be used when sending messages; an integer between 1 and 127.
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_velocity - The HTML of the input slider widget for setting the velocity amount.
         */
        this.velocity = new HUM.Param({
            app:hancock,
            idbKey:'hancockVelocity',
            uiElements:{
                'piano_velocity': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            initValue:120,
            postSet: (value, thisParam, init) => {
                thisParam.uiElements.in.piano_velocity.setAttribute('data-tooltip', value);
            }
        });
        /**  
         * This property controls the Channel to be used when sending messages through the Hancock piano
         * and initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {midichan}    value                       - The Channel to be used when sending messages; an integer between 0 and 15.
         * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in               - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_channel - The HTML of the input slider widget for setting the output channel.
         */
        this.channel = new HUM.Param({
            app:hancock,
            idbKey:'hancockChannel',
            uiElements:{
                'piano_channel': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'number',
                    htmlTargetProp:'value',
                    eventType: 'change',
                }),
            },
            dataType:'integer',
            initValue:1,
        });
        
        /**  
         * This property sets the offset of the Qwerty Hancock and update the UI.
         * The piano keyboard will start from the given note to the right.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {midinnum}    value                      - MIDI note number representing a piano key.
         * @property {string}      startNote                 - The effective note name of the key set in the "value".
         *                                                      Do not set it directly because it's for internal use only.
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in              - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_offset - The HTML of the input slider widget for setting the offset.
         */
        this.offset = new HUM.Param({
            app:hancock,
            idbKey:'hancockOffset',
            uiElements:{
                'piano_offset': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            init:false, // NOTE: It will be initialized when the keymap is loaded
            // initValue:120,
            restoreStage: 'post',
            postSet: (value, thisParam, init) => {
                let note =  hancock.dhc.midiNumberToNames(value)[0];
                if (!note.match(/[#b]/)) {
                    thisParam.startNote = note;
                    hancock.update();
                }
                thisParam.uiElements.in.piano_offset.setAttribute('data-tooltip', value);
            },
            customProperties: {startNote:''}
        });
        /**  
         * This property sets the octave-range of Qwerty Hancock and update the UI.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {number}      value                     - Number of octaves to show.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_range - The HTML of the input slider widget for setting the range number.
         */
        this.range = new HUM.Param({
            app:hancock,
            idbKey:'hancockRange',
            uiElements:{
                'piano_range': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            // initValue:120,
            init:false, // NOTE: It will be initialized when the keymap is loaded
            restoreStage: 'post',
            postSet: (value, thisParam, init) => {
                hancock.update();
                thisParam.uiElements.in.piano_range.setAttribute('data-tooltip', value);
            },
        });
        /**  
         * This property sets the width of the Qwerty Hancock and update the UI.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {number}      value                     - The width expressed in pixels.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_width - The HTML of the input slider widget for setting the width.
         */
        this.width = new HUM.Param({
            app:hancock,
            idbKey:'hancockWidth',
            uiElements:{
                'piano_width': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            initValue:600,
            restoreStage: 'mid',
            postSet: (value, thisParam, init) => {
                if (!init) {
                    hancock.update();
                }
                thisParam.uiElements.in.piano_width.setAttribute('data-tooltip', value);
            },
        });
        /**  
         * This property sets the height of the Qwerty Hancock and update the UI.
         * It also initialises the eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {number}      value                     - The height expressed in pixels.
         * @property {Object}      uiElements                - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.in.piano_width - The HTML of the input slider widget for setting the height.
         */
        this.height = new HUM.Param({
            app:hancock,
            idbKey:'hancockHeight',
            uiElements:{
                'piano_height': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget:'range',
                    htmlTargetProp:'value',
                    eventType: 'input',
                }),
            },
            dataType:'integer',
            initValue:80,
            restoreStage: 'mid',
            postSet: (value, thisParam, init) => {
                if (!init) {
                    hancock.update();
                }
                thisParam.uiElements.in.piano_height.setAttribute('data-tooltip', value);
            },
        });
    }
    /**
     * Initializes parameters that require deferred setup.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on the `active` parameter to set up its Bootstrap
     * Collapse controller and attach the related event listeners.
     */
    _init() {
        this.active._init();
    }

};
