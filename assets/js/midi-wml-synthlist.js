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
 * Define the global function for the original WebMidiLink JSONP script (`synthlist.js`).
 * It populate the {@link HUM.midi.WebMidiLinkOut.g200kgSynthList}.
 * @name SynthListCallback
 * @function
 * @global
 * 
 * @param {Array.<WmlSynth>} synthlist - The search term to highlight.
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
 * The Harmonicarium's adhoc WebMidiLink Synth List.
 * It is a sub-selection from the original g200kg's WebMidiLink Synth List
 * with some extra infos. Only Polyphonic, Multichannel and Multitimbral
 * instruments with MIDI Channel mode 3: OMNI OFF, POLY (aka guitar mode).
 * 
 * @type {Array.<WmlSynthHum>}
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
