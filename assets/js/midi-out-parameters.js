
"use strict";

// /** 
//  * Instance class-container used to create all the `HUM.Param` objects for each MIDI-OUT Port.
//  */
// HUM.midi.MidiOut.prototype.Parameters = class {
//     constructor(midiin) {
//         /**
//          * Controller's Pitch Bend settings.
//          * 
//          * @member {Object}
//          * @namespace
//          */
//         this.pitchbend = {
//             /**  
//              * This property is the MIDI input pitchbend range value in cents.
//              * It's initialises the eventListener of the UIelem related to it.
//              * It's stored on the DB.
//              * @todo - Move to midi-in (one per input channel?)
//              * @instance
//              *
//              * @member {HUM.Param}
//              * 
//              * @property {cent}        value                            - Pitchbend range value in cents (use hundreds when use MIDI-OUT and possibly the same as the instrument).
//              * @property {Object}      uiElements                       - Namespace for the "in", "out" and "fn" objects.
//              * @property {Object}      uiElements.in                    - Namespace for the "in" HTML elements.
//              * @property {HTMLElement} uiElements.in.midiPitchbendRange - The HTML input text box for the pitchbend range number.
//              */
//             range: new HUM.Param({
//                 app:midiin,
//                 idbKey:'midiInPitchbendRange',
//                 uiElements:{
//                     'midiPitchbendRange': new HUM.Param.UIelem({
//                         role: 'in',
//                         opType:'set',
//                         eventType: 'change',
//                         htmlTargetProp:'value',
//                         widget:'number',
//                     })
//                 },
//                 dataType:'integer',
//                 initValue:100,
//             }),

//             /**
//              * Current input controller pitchbend amount.
//              * Value from -8192 to +8191, normalized to the ratio from -1 to 0,99987792968750
//              * No pitchbend is 0.
//              * @instance
//              * 
//              * @member {number}
//              */
//             amount: 0.0
//         };
//         // =======================
//     } // end class Constructor
//     // ===========================

//     /**
//      * Initializes the parameters of the Tone Snap note-receiving mode.
//      */
//     _init() {
//         this.tsnap.channelMode.chanFT._init();
//         this.tsnap.channelMode.chanHT._init();
//         this.receiveMode._init();
//     }
// };