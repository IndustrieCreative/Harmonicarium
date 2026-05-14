/**
 * @fileoverview MIDI Hub coordinator for the Harmonicarium application.
 * This file defines the HUM.midi namespace and the HUM.midi.MidiHub class,
 * which serves as the central coordinator for all MIDI input, output, and
 * port management within a DHC instance.
 *
 * @module midi-hub
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

/**
 * Namespace for all the components that manage MIDI I/O ports and messages.
 *
 * @namespace HUM.midi
 * @memberof HUM
 */
HUM.midi = {};

/**
 * Central MIDI coordinator for a DHC instance.
 *
 * @class
 * @memberof HUM.midi
 *
 * @description
 * The HUM.midi.MidiHub class acts as the single entry point for all MIDI
 * functionality within a DHC instance. It instantiates and exposes three
 * sub-components:
 * - {@link HUM.midi.MidiPorts} (`port`): Manages Web MIDI API port discovery and selection.
 * - {@link HUM.midi.MidiOut}   (`out`):  Handles outgoing MIDI messages.
 * - {@link HUM.midi.MidiIn}    (`in`):   Receives and routes incoming MIDI messages to the DHC.
 */
HUM.midi.MidiHub = class {
    /**
     * Creates a new MidiHub instance and wires up all MIDI sub-components.
     *
     * @param {HUM.DHC} dhc - The DHC instance to which this MidiHub belongs.
     *
     * @description
     * Instantiates {@link HUM.midi.MidiPorts}, {@link HUM.midi.MidiOut}, and
     * {@link HUM.midi.MidiIn}, each bound to the same DHC instance, and
     * exposes them as `port`, `out`, and `in` respectively.
     */
	constructor(dhc) {
        /**
         * The parent DHC instance.
         *
         * @member {HUM.DHC}
         */
		this.dhc = dhc;
        /**
         * The MidiPorts instance responsible for port discovery and selection.
         *
         * @member {HUM.midi.MidiPorts}
         */
		this.port = new HUM.midi.MidiPorts(dhc, this);
        /**
         * The MidiOut instance responsible for sending outgoing MIDI messages.
         *
         * @member {HUM.midi.MidiOut}
         */
		this.out = new HUM.midi.MidiOut(dhc, this);
        /**
         * The MidiIn instance responsible for receiving and routing incoming MIDI messages.
         *
         * @member {HUM.midi.MidiIn}
         */
		this.in = new HUM.midi.MidiIn(dhc, this);
	}
};
