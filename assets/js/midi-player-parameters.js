/**
 * @fileoverview Parameters class for the Harmonicarium MIDI Player.
 * This file defines the {@link HUM.midi.MidiPlayer.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.midi.MidiPlayer} instance (destination, speed, and loop). It is
 * split out from the main {@link module:midi-player} module.
 *
 * @module midi-player-parameters
 * @memberof HUM.midi.MidiPlayer
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
 * Parameter container for the {@link HUM.midi.MidiPlayer} instance.
 *
 * @class
 * @memberof HUM.midi.MidiPlayer
 *
 * @description
 * Container class that instantiates and exposes all {@link HUM.Param} objects
 * used by a {@link HUM.midi.MidiPlayer} instance:
 * - `speed`: Playback speed multiplier (0.25–4.0, default 1.0).
 * - `loop`: Whether to loop playback continuously (default false).
 * - `destination`: Output routing — `'internal'` (virtual MIDI-In pipeline)
 *   or any available hardware MIDI-Out port ID (default `'internal'`).
 */
HUM.midi.MidiPlayer.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given MidiPlayer.
     *
     * @param {HUM.midi.MidiPlayer} player - The MidiPlayer instance that owns this parameter set.
     *
     * @description
     * Instantiates all `HUM.Param` objects for the MIDI Player panel:
     * - `speed`: Bound to the speed `<input type="number">` widget.
     * - `loop`: Bound to the loop `<input type="checkbox">` widget.
     * - `destination`: Bound to the destination `<select>` dropdown.
     *
     * All three parameters are persisted in IndexedDB via the preset/autosave
     * system and restored automatically on startup.
     */
    constructor(player) {
        /**
         * Playback speed multiplier.
         * Stored on the DB. Bound to the speed number input.
         *
         * @member {HUM.Param}
         *
         * @property {number}      value                         - Speed multiplier (float, > 0). Default 1.0.
         * @property {Object}      uiElements                    - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                 - Namespace for the "in" HTML elements.
         * @property {HTMLElement} uiElements.in.midiPlayer_speed - The speed `<input type="number">` element.
         */
        this.speed = new HUM.Param({
            app: player,
            idbKey: 'midiPlayerSpeed',
            uiElements: {
                'midiPlayer_speed': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget: 'number',
                    htmlTargetProp: 'value',
                    eventType: 'change',
                }),
            },
            dataType: 'float',
            initValue: 1.0,
            postSet: (value, thisParam, init) => {
                if (player.player) {
                    try { player.player.speed(value); } catch (e) { /* noop */ }
                }
            },
        });

        /**
         * Loop playback flag.
         * Stored on the DB. Bound to the loop checkbox.
         *
         * @member {HUM.Param}
         *
         * @property {boolean}     value                        - Whether to loop. Default false.
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
         * @property {HTMLElement} uiElements.in.midiPlayer_loop - The loop `<input type="checkbox">` element.
         */
        this.loop = new HUM.Param({
            app: player,
            idbKey: 'midiPlayerLoop',
            uiElements: {
                'midiPlayer_loop': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'toggle',
                    widget: 'checkbox',
                    htmlTargetProp: 'checked',
                    eventType: 'click',
                }),
            },
            dataType: 'boolean',
            initValue: false,
            postSet: (value, thisParam, init) => {
                if (player.player) {
                    try { player.player.loop(!!value); } catch (e) { /* noop */ }
                }
            },
        });

        /**
         * Output destination for MIDI Player events.
         * Stored on the DB. Bound to the destination `<select>` dropdown.
         * Value is `'internal'` for the virtual MIDI-In pipeline, or a hardware
         * `MIDIOutput.id` string for direct hardware routing.
         *
         * When switching away from a destination while playing, the `preSet`
         * hook stops playback first (unless called programmatically via restore
         * or internal fallback — see `_rewirePlayerConnections`).
         *
         * @member {HUM.Param}
         *
         * @property {string}      value                        - Destination port ID or `'internal'`. Default `'internal'`.
         * @property {Object}      uiElements                   - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.in                - Namespace for the "in" HTML elements.
         * @property {HTMLElement} uiElements.in.midiPlayer_dest - The destination `<select>` element.
         */
        this.destination = new HUM.Param({
            app: player,
            idbKey: 'midiPlayerDestination',
            uiElements: {
                'midiPlayer_dest': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    widget: 'selection',
                    htmlTargetProp: 'value',
                    eventType: 'change',
                }),
            },
            dataType: 'string',
            initValue: 'internal',
            preSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                // Stop playback when the user changes destination at runtime.
                // Skip during init and during internal fallback (fromRestore flag).
                if (!init && !fromRestore && player.isPlaying) { player.stop(); }
                return value || 'internal';
            },
            postSet: (value, thisParam, init) => {
                if (player.player) { player._rewirePlayerConnections(); }
                if (value === 'internal') { player._autoCheckVirtualInputPort(); }
            },
        });

        // =======================
    } // end class Constructor
    // ===========================
};
