/**
 * @fileoverview WebMidiLink synthesizer list data for the Harmonicarium application.
 * This file defines the synth list data structures used by the
 * {@link HUM.midi.WebMidiLinkOut} component: the JSONP callback that populates
 * the original g200kg synthesizer list, and the Harmonicarium-curated ad-hoc
 * list of polyphonic, multichannel, and multitimbral synthesizers compatible
 * with its microtonal playback model.
 *
 * @module midi-wml-synthlist
 * @memberof HUM.midi
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
 * The original g200kg's WebMidiLink Synth List.
 * In order to use the original synthlist from g200kg, uncomment one of the
 * following `<script>` in "./index.html" file:
 * - "./assets/js/lib/synthlist.js" for the "local copy" version;
 * - "{@link http://www.g200kg.com/webmidilink/synthlist.js}" for the "live" version.
 * 
 * @type {Array.<WmlSynth>}
 */
HUM.midi.WebMidiLinkOut.g200kgSynthList = [];

/**
 * Global JSONP callback defined by the original WebMidiLink `synthlist.js` script.
 * When the external script loads, it calls this function to populate
 * {@link HUM.midi.WebMidiLinkOut.g200kgSynthList} with the full g200kg synth catalog.
 *
 * @name SynthListCallback
 * @function
 * @global
 *
 * @param {Array.<WmlSynth>} synthlist - The synthesizer list data provided by the JSONP script.
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/index.html}
 */
window.SynthListCallback = function(synthlist) {
        HUM.midi.WebMidiLinkOut.g200kgSynthList = synthlist;
};

    //------------------------|
    // MIDI Chanel Modes      |
    // Mode 1: OMNI ON,  POLY |
    // Mode 2: OMNI ON,  MONO |
    // Mode 3: OMNI OFF, POLY |
    // Mode 4: OMNI OFF, MONO |
    //------------------------|

/**
 * The Harmonicarium's ad-hoc WebMidiLink Synth List.
 * A curated sub-selection of the original g200kg WebMidiLink Synth List,
 * extended with additional metadata. Only synthesizers that support
 * MIDI Channel Mode 3: OMNI OFF, POLY (aka guitar mode)  — i.e. polyphonic,
 * multichannel, and multitimbral instruments — are included, as this is the
 * mode required for Harmonicarium's per-channel microtonal pitch-bend playback
 * model.
 *
 * @type {Array.<WmlSynthHum>}
 *
 * @see {@link WmlSynthHum}
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/index.html}
 */
HUM.midi.WebMidiLinkOut.adhocSynthList = [{
    "name": "Yamaha XG Sound Set.sf2",
    "url": "https://logue.dev/sf2synth.js/",
    // &ui=false
    "author": "Logue",
    "authorurl": "http://logue.be/",
    "description": "SoundFont player",
    "latency": {
        "win-ch": 10,
        "win-ff": 140,
        "mac-sa": 40,
        "mac-ch": 40,
        "mac-ff": 40,
        "*-*": 40
    },
    "pbRange": "2",
    "chVoices": "16",
    "chMode": "3",
    "chModeDesc": "OMNI OFF, POLY",
    "note": "Polyphonic - Multichannel - Multitimbral",
    "status": "OK"
},
{
    "name": "SpessaSynth",
    "url": "https://spessasus.github.io/SpessaSynth",
    "author": "Spessasus",
    "authorurl": "https://github.com/spessasus",
    "description": "SoundFont player",
    "latency": {
        "win-ch": 40,
        "win-ff": 80,
        "*-*": 40
    },
    "pbRange": "2",
    "chVoices": "16",
    "chMode": "3",
    "chModeDesc": "OMNI OFF, POLY",
    "note": "Polyphonic - Multichannel - Multitimbral",
    "status": "OK"
},
{
    "name": "GMPlayer",
    "url": "https://www.g200kg.com/webmidilink/gmplayer/",
    "author": "g200kg",
    "authorurl": "https://www.g200kg.com/",
    "description": "GM mapped Multi-timbre Synth",
    "latency": {
        "win-ch": 40,
        "win-ff": 140,
        "mac-ch": 40,
        "mac-ff": 140,
        "*-*": 140
    },
    "pbRange": "2",
    "chVoices": "16",
    "chMode": "3",
    "chModeDesc": "OMNI OFF, POLY",
    "note": "Polyphonic - Multichannel - Multitimbral",
    "status": "OK"
},
{
    "name": "sf2synth.js",
    "url": "http://imaya.github.io/demo/sf2.js/wml.html",
    "author": "Yuuta Imaya",
    "authorurl": "http://blog.livedoor.jp/imayjs/",
    "description": "SoundFont player",
    "latency": {
        "win-ch": 10,
        "win-ff": 140,
        "mac-sa": 40,
        "mac-ch": 40,
        "mac-ff": 40,
        "*-*": 40
    },
    "pbRange": "2",
    "chVoices": "16",
    "chMode": "3",
    "chModeDesc": "OMNI OFF, POLY",
    "note": "Polyphonic - Multichannel - Multitimbral",
    "status": "OK"
},
// {
//     "name": "WebModular",
//     "url": "https://www.g200kg.com/webmidilink/webmodular/",
//     "author": "g200kg",
//     "authorurl": "https://www.g200kg.com/",
//     "description": "Modular synthesizer",
//     "latency": {
//         "win-ch": 120,
//         "win-ff": 190,
//         "mac-sa": 140,
//         "mac-ch": 140,
//         "mac-ff": 190,
//         "*-*": 120
//     },
//     "pbRange": none,
//     "chVoices": "1",
//     "chMode": "2",
//     "chModeDesc": "OMNI ON, MONO",
//     "note": "Monophonic - Omni",
//     "status": "Since it not supports the pitchbend, is useful only for 12-TET FTs."
// },
// {
//     "name": "RenoidPlayer",
//     "url": "https://www.g200kg.com/renoid/",
//     "author": "g200kg",
//     "authorurl": "https://www.g200kg.com/",
//     "description": "Virtual singer",
//     "latency": {
//         "win-ch": 160,
//         "win-ff": 160,
//         "mac-ch": 160,
//         "mac-ff": 160,
//         "*-*": 160
//     },
//     "pbRange": "2",  // ??
//     "chVoices": "1",
//     "chMode": "4",
//     "chModeDesc": "OMNI OFF, MONO",
//     "note": "Monophoic - Only channel 1, the other channels change the phoneme.",
//     "status": "OK"
// }, 
// {
//     "name": "BitMaker",
//     "url": "http://aikelab.net/bitmaker/",
//     "author": "aike",
//     "authorurl": "http://d.hatena.ne.jp/aike/",
//     "description": "Virtual 8bit synthesizer",
//     "latency": {
//         "win-ch": 50,
//         "mac-sa": 30,
//         "mac-ch": 30,
//         "*-*": 50
//     },
//     "pbRange": none,
//     "chVoices": "16",
//     "chMode": "1",
//     "chModeDesc": "OMNI ON, POLY",
//     "note": "Polyphonic - Omni",
//     "status": "Since it not supports the pitchbend, is useful only for 12-TET FTs."
// },
// {
//     "name": "WebFMsynthesizer",
//     "url": "http://www.taktech.org/takm/WebFMSynth/",
//     "author": "Takashi Mizuhiki",
//     "authorurl": "http://http://www.taktech.org/takm/",
//     "description": "FM synthesizer",
//     "latency": {
//         "win-ch": 80,
//         "mac-sa": 70,
//         "mac-ch": 90,
//         "*-*": 80
//     },
//     "pbRange": none,
//     "chVoices": "1",
//     "chMode": "2",
//     "chModeDesc": "OMNI ON, MONO",
//     "note": "Monophonic - Omni",
//     "status": "Since it not supports the pitchbend, is useful only for 12-TET FTs."
// },
];
