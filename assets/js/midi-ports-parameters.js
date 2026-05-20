/**
 * @fileoverview Parameters class for the Harmonicarium MIDI Ports manager.
 * This file defines the {@link HUM.midi.MidiPorts.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.midi.MidiPorts} instance (DOM container proxies for the MIDI-IN
 * and MIDI-OUT port checkbox lists). It is split out from the main
 * {@link module:midi-ports} module.
 *
 * @module midi-ports-parameters
 * @memberof HUM.midi.MidiPorts
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
 * Parameter container for the `HUM.midi.MidiPorts` instance.
 *
 * @class
 * @memberof HUM.midi.MidiPorts
 *
 * @description
 * Container class that instantiates and exposes all `HUM.Param` objects used
 * by a `HUM.midi.MidiPorts` instance. Each parameter holds a reference to the
 * corresponding DOM container element used to render MIDI port checkboxes.
 */
HUM.midi.MidiPorts.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given MidiPorts controller.
     *
     * @param {HUM.midi.MidiPorts} midiports - The MidiPorts instance that owns this parameter set.
     *
     * @description
     * Instantiates all `HUM.Param` objects for the MidiPorts controller:
     * - `inputPorts`: Proxy for the DOM container that holds MIDI-IN port checkboxes.
     * - `outputPorts`: Proxy for the DOM container that holds MIDI-OUT port checkboxes.
     */
    constructor(midiports) {
        /**
         * DOM proxy holding the container element for MIDI-IN port checkboxes.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         *
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.inputPorts  - The HTML container element for MIDI-IN port checkboxes.
         */
        this.inputPorts = new HUM.Param({
            app: midiports,
            idbKey:'midiportsInputPorts',
            uiElements:{
                'inputPorts': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            init:false,
            presetStore:false,
            presetRestore:false,
        });
        /**
         * DOM proxy holding the container element for MIDI-OUT port checkboxes.
         * It's not stored on the DB.
         *
         * @member {HUM.Param}
         *
         * @property {Object}      uiElements                  - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out              - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.outputPorts  - The HTML container element for MIDI-OUT port checkboxes.
         */
        this.outputPorts = new HUM.Param({
            app: midiports,
            idbKey:'midiportsOutputPorts',
            uiElements:{
                'outputPorts': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            init:false,
            presetStore:false,
            presetRestore:false,
        });
        /**
         * Controls whether native Web MIDI API access is enabled.
         * Not stored on the DB; always starts as `false` (disabled) to avoid
         * requesting MIDI permission at startup.
         *
         * @member {HUM.Param}
         *
         * @property {boolean}     value                          - `true` = MIDI enabled, `false` = disabled.
         * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                  - Namespace for the "in" HTML elements.
         * @property {HTMLElement} uiElements.in.midiPorts_status - The HTML element of the MIDI enable toggle checkbox.
         */
        this.status = new HUM.Param({
            app: midiports,
            idbKey: 'midiPortsStatus',
            uiElements: {
                'midiPorts_status': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'toggle',
                    eventType: 'click',
                    htmlTargetProp: 'checked',
                    widget: 'checkbox',
                }),
            },
            dataType: 'boolean',
            initValue: false,
            init: false,
            presetStore: true,
            presetRestore: true,
            postSet: function(val) { val ? midiports.enableMidi() : midiports.disableMidi(); },
        });
    }
};
