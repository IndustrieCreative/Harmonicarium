 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2020 by Walter Mantovani (http://armonici.it).
 * Written by Walter Mantovani.
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

/* globals HUM */

"use strict";

/**
 * Namespace for all the apps that manage MIDI I/O ports and messages.
 * @namespace HUM.midi
 */
HUM.midi = {};

/** The MidiHub class */
HUM.midi.MidiHub = class {
    /**
    * @param {DHC} dhc - The DHC instance to which it belongs
    */
	constructor(dhc) {
        /**
        * The DHC instance
        * @member {HUM.DHC}
        */
		this.dhc = dhc;
        /**
        * The MidiPorts instance
        * @member {HUM.midi.MidiPorts}
        */
		this.port = new HUM.midi.MidiPorts(dhc, this);
        /**
        * The MidiOut instance
        * @member {HUM.midi.MidiOut}
        */
		this.out = new HUM.midi.MidiOut(dhc, this);
        /**
        * The MidiIn instance
        * @member {HUM.midi.MidiIn}
        */
		this.in = new HUM.midi.MidiIn(dhc, this);
	}
};
