
/**
 * @fileoverview Per-port instrument settings for the Harmonicarium MIDI Output handler.
 * This file defines the {@link HUM.midi.MidiOut.prototype.InstrumentSettings|InstrumentSettings}
 * class, which holds all mutable per-port state needed by the PitchBend tuning
 * method (channel assignment arrays, PB sensitivity range, Note-ON delay, and
 * voice-stealing flags). It is split out from the main {@link module:midi-out} module.
 *
 * @module midi-out-instrument-settings
 * @memberof HUM.midi.MidiOut
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

/**
 * Default per-port settings for MIDI-OUT tuning methods.
 *
 * @class
 * @memberof HUM.midi.MidiOut
 *
 * @description
 * Each time a new MIDI output port is encountered, an instance of this class
 * is created and stored in {@link HUM.midi.MidiOut#settings} under the port ID.
 * It holds all mutable state needed by the PitchBend tuning method: channel
 * assignment arrays, Pitch Bend sensitivity range, Note-ON delay, and
 * voice-stealing flags.
 */
HUM.midi.MidiOut.prototype.InstrumentSettings = class {
    /**
     * Creates a new InstrumentSettings instance with factory defaults.
     *
     * @description
     * Initialises the PitchBend method settings (`pb`) with three FT channels
     * (0\u20132) and five HT channels (3\u20137), a 2-semitone PB range, a 5 ms Note-ON
     * delay, and voice stealing enabled for both tone types.
     * Also reserves a namespace for the MIDI Tuning Standard method (`mts`,
     * currently not implemented) and sets the active tuning method to `'pb'`.
     */
    constructor() {
        /**
        * Pitch Bend method settings namespace.
        *
        * @member {Object}
        *
        * @property {Object}                         channels              - FTs & HTs multichannel polyphony management.
        * @property {Object}                         channels.ft           - Multichannel polyphony for FTs.
        * @property {Array.<midichan>}               channels.ft.used      - Sorted array containing the FT used channel numbers.
        * @property {Object.<midinnum, HeldChannel>} channels.ft.held      - Object containing the FT busy channel; key is the original Controller MIDI Note number. Init value must be an empty Object.
        * @property {midichan}                       channels.ft.last      - Number of the last held FT channel. Init value must be a -1.
        * @property {Object}                         channels.ht           - Multichannel polyphony for HTs.
        * @property {Array.<midichan>}               channels.ht.used      - Sorted array containing the HT used channel numbers.
        * @property {Object.<midinnum, HeldChannel>} channels.ht.held      - Object containing the HT busy channels; keys are the original Controller MIDI Note number. Init value must be an empty Object.
        * @property {Array.<midichan>}               channels.ht.heldOrder - Array of channel numbers, sorted according to the held order. Init value must be an empty Array.
        * @property {midichan}                       channels.ht.last      - Number of the last held HT channel. Init value must be a -1.
        * @property {Object}                         range                 - Namespace for pitchBend sensitivity settings.
        * @property {number}                         range.ft              - PitchBend sensitivity for FT channels.
        * @property {number}                         range.ht              - PitchBend sensitivity for HT channels.
        * @property {Object}                         delay                 - Namespace for setting the delay between the PitchBend and Note-ON messages.
        * @property {number}                         delay.ft              - Delay for FT channels (milliseconds).
        * @property {number}                         delay.ht              - Delay for HT channels (milliseconds).
        * @property {Object}                         voicestealing         - Namespace for voice stealing management ON/OFF (now stealing is always ON).
        * @property {boolean}                        voicestealing.ft      - Voice stealing ON/OFF for FT channels.
        * @property {boolean}                        voicestealing.ht      - Voice stealing ON/OFF for HT channels.
        * @property {boolean}                        gm                    - General MIDI ON/OFF (when 'true', avoid channel 10) - `CURRENTLY NOT IMPLEMENTED`.
        */
        this.pb = {
            channels: {
                ft: {
                    used:[0, 1, 2],
                    held: {},
                    last: -1
                },
                ht: {
                    used:[3, 4, 5, 6, 7],
                    held: {},
                    heldOrder: [],
                    last: -1
                }
            },
            range: {
                ft: 2,
                ht: 2
            },
            delay: {
                ft: 5,
                ht: 5
            },
            voicestealing: { // @todo - Voice stealing management ON/OFF
                ft: true,
                ht: true
            },
            gm: undefined
        };
        
        /**
        * MIDI Tuning Standard method settings namespace - `CURRENTLY NOT IMPLEMENTED`.
        *
        * @member {Object}
        */
        this.mts = {}; // @todo - MIDI Tuning Standard method
        
        /**
        * Selected MIDI-OUT Tuning Method for this port;
        *     `'pb'` is PitchBend method, `'mts'` is MIDI Tuning Standard method.
        *
        * @member {('pb'|'mts')}
        */
        this.selected = "pb";
    }
};
