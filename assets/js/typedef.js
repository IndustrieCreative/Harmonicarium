/*==============================================================================*
 * INTERNAL PRIMITIVES
 *==============================================================================*/

/**
 * Transpose ratio<br>
 *     A positive floating point number.
 *     <em>Examples:</em>
 *     <ul>
 *     <li>2, 4, 8, 16... for octaves up </li>
 *     <li>0.5, 0.25, 0.125, 0.0625... for octaves down </li>
 *     <li>1 to not transpose </li>
 *     </ul>
 *
 * @global
 * @typedef {number} tratio
 */

/**
 * Midicent<br>
 * A midicent is one floating points MIDI-note-number unit.<br>
 *     It can be a positive or negative floating point number.<br>
 *     Considering the description of midicent proposed in the following links, our midicent should be called <em>hecto-midicent</em>.<br>
 * <ul>
 * <li>{@link https://fr.wikipedia.org/wiki/Midicent}</li>
 * <li>{@link http://support.ircam.fr/docs/om/om6-manual/co/Score-Objects-Intro.html#zdN1d7}</li>
 * </ul>
 *
 * @example <caption>How to convert a given frequency in hertz to midicent.</caption>
 * // Variables description:
 * midiA4 = 69;    // The A4 note in MIDI note number notation
 * semitones = 12; // The number of semitones of the 12-EDO
 * hzA4 = 440;     // The A4 note in hertz
 * // Math.log2()     Because we are dividing the octave (frequency ratio 2)
 * 
 * midicent = midiA4 + semitones * Math.log2(frequency / hzA4)
 * //                                        ^^^^^^^^^          
 * //                                        Input freq.
 * 
 * @global
 * @typedef {number} midicent
 */

/**
 * Tone Type<br>
 *     A string composed by two lowercase characters, representing one of the two tone types:
 *     Fundamental Tones (FT `-> 'ft'`) and Harmonic Tones (HT `-> 'ht'`).
 * 
 * @global
 * @typedef {('ft'|'ht')} tonetype
 */

/**
 * MIDI note number<br>
 *     A integer number, officially it must be a 8-bit unsigned integer (between 0 and 127 included).<br>
 *     Negative numbers and number greater than 127 still mean a certain frequency, 
 *     but you cannot send them to MIDI devices.
 * 
 * @global
 * @typedef {number} midinnum
 */

/**
 * Hertz<br>
 *     A positive floating point number, greater than zero.
 * 
 * @global
 * @typedef {number} hertz
 */

/**
 * Xtone number<br>
 *     An integer number, representing a FT or HT relative tone.<br>
 *     If it represents an FT, it is relative to FT0, alias the FM (Fundamental Mother).
 *     If it represents an HT, it is relative to HT1, alias the fundamental of the harmonic/subharmonic series.
 * 
 * @global
 * @typedef {number} xtnum
 */

/**
 * Velocity<br>
 *     8-bit unsigned integer (between 0 and 127 included)
 * 
 * @global
 * @typedef {number} velocity
 */

/**
 * MIDI Channel<br>
 *     4-bit unsigned integer (between 0 and 15 included)
 * 
 * @global
 * @typedef {number} midichan
 */

/**
 * DHC Message Command
 * 
 * @global
 * @typedef {('init'|'panic'|'update'|'tone-on'|'tone-off')} msgcmd
 */

/**
 * WebMidiLink Message Link 0
 * 
 * - `'midi,nn[,nn...]'`: "midi" is a ID string and following "nn"s are comma-separated MIDI message bytes represented in hexadecimal. Do not use the MIDI running status abbreviation.
 * 
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/spec.html}
 * 
 * @global
 * @typedef {string} wmlmsg0
 */

/**
 * WebMidiLink Message Link 1
 *
 *  In the Harmonicarium terms:
 *  - "Synth" or "Synthesizer" means Instrument
 *  - "Host" means Controller
 *  
 *  Harmonicarium can act:
 *  - as Host if you load a Synth from WebMidiLink Out;
 *  - as Synth if you load Harmonicarium from a Host;
 *  - as both, Host and Synth, if you load Harmonicarium from a Host and then you load a Synth from WebMidiLink Out.
 *
 *  Host=>Synth | The messages from Host to Synth are:
 *  - `'link,reqpatch'`:        The Host request the current configuration data to Synth. The Synth should send following "link,patch" message.
 *  - `'link,setpatch,<data>'`: The Host send configuration data to Synth with this message. This <data> is a data acquired with "link,patch,<data>". The Synth should set-up the sound patch with this message.
 *  
 *  Synth=>Host | The messages from Synth to Host are:
 *  - `'link,progress'`:     The Synth should send this message to Host when is loading, just after its window or its iframe has been opened.
 *  - `'link,ready'`:        The Synth should send this message to Host when ready after start up. The host may be window.opener or window.parent depends on popup or iframe. Host noticed the Synth is LinkLevel 1 with this message and enable following LinkLevel 1 messages.
 *  - `'link,patch,<data>'`: The Synth send current configuration data to Host with this message when received the "link,reqpatch". <data> is a proprietary data of this Synth but should be represented as a string and should not use comma (,). For example, it may be a url-encoded query string (a=00&b=11&c=33), or a Base64 / Base64url encoded binary-data.
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/spec.html}
 * 
 * @global
 * @typedef {string} wmlmsg1
 */

/*==============================================================================*
 * INTERNAL OBJECTS
 *==============================================================================*/

/**
 * The original g200kg's Synth object definition
 *
 * @see {@link https://www.g200kg.com/en/docs/webmidilink/synthlist.html}
 * @see {@link http://www.g200kg.com/webmidilink/synthlist.js}
 * 
 * @typedef {Object} WmlSynth
 * 
 * @property {string} name             - Name of the Synth
 * @property {string} url              - URL to the Synth
 * @property {string} author           - Author of the Synth
 * @property {string} authorurl        - URL to the author
 * @property {string} description      - Description of the Synth
 * @property {Object} latency          - Typical latency (in milliseconds) in each "platform-browser" environment.
 *                                       Platform is 'win' or 'mac' and the browser is one of the 'ch' (Chrome), 'ff' (Firefox) or 'sa' (Safari).
 *                                       The key, "*-*" is a default value that used when key is not found.
 * @property {number} latency."win-ch" - Chrome on Windows
 * @property {number} latency."win-ff" - Firefox on Windows
 * @property {number} latency."mac-sa" - Safari on macOS
 * @property {number} latency."mac-ch" - Chrome on macOS
 * @property {number} latency."mac-ff" - Firefox on macOS
 * @property {number} latency."*-*"    - Default/fallback value
 */

/**
 * The Harmonicarium (internal) Synth object definition, that extends the {@link WmlSynth|g200kg's one}.
 * 
 * @typedef {Object} WmlSynthHum
 * 
 * @extends WmlSynth
 * 
 * @property {string} pbRange    - Default pitchbend range
 * @property {string} chVoices   - Number of available voices
 * @property {string} chMode     - MIDI Channel Mode compatibility
 * @property {string} chModeDesc - MIDI Channel Mode description
 * @property {string} note       - Useful notes about Channel Mode implementation
 * @property {string} status     - Notes about possible issues
 */

/**
 * A MIDI message (data + timestamp)
 * 
 * @typedef {Array<{2}>} OtherMidiMsg
 *
 * @property {Uint8Array} 0 - Message; an array of 8-bit unsigned integers
 * @property {number}     1 - Time-stamp; a floating point number
 */

/*==============================================================================*
 * EXTERNAL OBJECTS
 *==============================================================================*/

/**
 * @name HTMLElement
 * @typedef HTMLElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement}
 */

/**
 * @name File
 * @typedef File
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/File}
 */

/**
 * @name MIDIMessageEvent
 * @typedef MIDIMessageEvent
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MIDIMessageEvent}
 */

/**
 * @name AudioContext
 * @typedef AudioContext
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext}
 */

/**
 * @name GainNode
 * @typedef GainNode
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GainNode}
 */

/**
 * @name DynamicsCompressorNode
 * @typedef DynamicsCompressorNode
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode}
 */

/**
 * @name ConvolverNode
 * @typedef ConvolverNode
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode}
 */

/**
 * @deprecated WARNING: As of the August 29 2014 Web Audio API spec publication,
 *     this feature has been marked as deprecated, and was replaced by AudioWorklet (see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode|AudioWorkletNode})
 * 
 * @name ScriptProcessorNode
 * @typedef ScriptProcessorNode
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode}
 */

/**
 * @name MIDIAccess
 * @typedef MIDIAccess
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess}
 * @see {@link https://www.w3.org/TR/webmidi/#midiaccess-interface}
 */

/**
 * @name MIDIConnectionEvent
 * @typedef MIDIConnectionEvent
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MIDIConnectionEvent}
 * @see {@link https://www.w3.org/TR/webmidi/#midiconnectionevent-interface}
 */

/**
 * @name MIDIPort
 * @typedef MIDIPort
 * @see {@link https://www.w3.org/TR/webmidi/#midiport-interface}
 */

/**
 * @name ArrayBuffer
 * @typedef ArrayBuffer
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer}
 */

/**
 * @name Uint8Array
 * @typedef Uint8Array
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array}
 */

/**
 * @name DOMException
 * @typedef DOMException
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException}
 */
