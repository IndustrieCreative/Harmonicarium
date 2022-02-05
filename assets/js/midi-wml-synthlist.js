/* globals HUM */

"use strict";

/**
 * The original g200kg's synthlist
 * 
 * @type {Array.<WmlSynth>}
 */
HUM.midi.WebMidiLinkOut.g200kgSynthList = [];

/**
 * Set a global function for WebMidiLink JSONP script (`synthlist.js`)
 * In order to use the original synthlist from g200kg, uncomment one of the following `<script>` in "./index.html" file:
 * - "./assets/js/lib/synthlist.js" for the "local copy" version;
 * - "http://www.g200kg.com/webmidilink/synthlist.js" for the "live" version.
 * 
 * @name SynthListCallback
 * @function
 * @global
 * @param {Array.<WmlSynth>} synthlist - The search term to highlight.
 */
window.SynthListCallback = function(synthlist) {
        HUM.midi.WebMidiLinkOut.g200kgSynthList = synthlist;
};

    // MIDI Chanel Modes
    // Mode 1: OMNI ON,  POLY
    // Mode 2: OMNI ON,  MONO
    // Mode 3: OMNI OFF, POLY
    // Mode 4: OMNI OFF, MONO

/**
 * The Harmonicarium's adhoc synthlist (internal)
 * 
 * @type {Array.<WmlSynthHum>}
 */
HUM.midi.WebMidiLinkOut.adhocSynthList = [{
    "name": "Yamaha XG Sound Set.sf2",
    "url": "http://logue.github.io/smfplayer.js/wml.html",
    // https://logue.dev/smfplayer.js/wml.html?soundfont=Yamaha%20XG%20Sound%20Set%20Ver.2.0.sf2
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
}, {
    "name": "Mabinogi MSXSprit.sf2",
    "url": "https://logue.dev/smfplayer.js/wml.html?soundfont=https://logue.be/mabinogi/mml/MSXspirit.sf2",
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
}, {
    "name": "WebModular",
    "url": "https://www.g200kg.com/webmidilink/webmodular/",
    "author": "g200kg",
    "authorurl": "https://www.g200kg.com/",
    "description": "Modular synthesizer",
    "latency": {
        "win-ch": 120,
        "win-ff": 190,
        "mac-sa": 140,
        "mac-ch": 140,
        "mac-ff": 190,
        "*-*": 120
    },
    "pbRange": "2",
    "chVoices": "1",
    "chMode": "2",
    "chModeDesc": "OMNI ON, MONO",
    "note": "Monophonic - Omni",
    "status": "Sometimes no sound"
}, {
    "name": "WebFMsynthesizer",
    "url": "http://www.taktech.org/takm/WebFMSynth/",
    "author": "Takashi Mizuhiki",
    "authorurl": "http://http://www.taktech.org/takm/",
    "description": "FM synthesizer",
    "latency": {
        "win-ch": 80,
        "mac-sa": 70,
        "mac-ch": 90,
        "*-*": 80
    },
    "pbRange": "?",
    "chVoices": "1",
    "chMode": "1",
    "chModeDesc": "OMNI ON, POLY",
    "note": "Monophonic - Omni",
    "status": "Pitchbend receiving to test"
}, {
    "name": "RenoidPlayer",
    "url": "https://www.g200kg.com/renoid/",
    "author": "g200kg",
    "authorurl": "https://www.g200kg.com/",
    "description": "Virtual Singer",
    "latency": {
        "win-ch": 160,
        "win-ff": 160,
        "mac-ch": 160,
        "mac-ff": 160,
        "*-*": 160
    },
    "pbRange": "2",
    "chVoices": "1",
    "chMode": "4",
    "chModeDesc": "OMNI OFF, MONO",
    "note": "Monophoic - Only channel 1",
    "status": "OK"
}, {
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
    "status": "No sound on Chrome (user gesture issue)"
}, {
    "name": "sf2synth.js",
    "url": "http://imaya.github.io/demo/sf2.js/wml.html",
    "author": "Yuuta Imaya",
    "authorurl": "http://blog.livedoor.jp/imayjs/",
    "description": "SoundFont Player",
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
}];
