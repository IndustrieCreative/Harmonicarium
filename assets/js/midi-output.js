 /**
 * MIDI OUTPUT HANDLER
 * Prepare the MIDI output message and send them to the MIDI-OUT ports.
 * @TODO: Implement MIDI OUT
 */

"use strict";

//===========A BASIC EXAMPLE to start (from Web MIDI API specs)==========
// This example sends a middle C note on message immediately on MIDI channel 1
// (MIDI channels are 0-indexed, but generally referred to as channels 1-16),
// and queues a corresponding note off message for 1 second later.

function sendMiddleC(midiAccess, portID) {
	 // note on, middle C, full velocity
    var noteOnMessage = [0x90, 60, 0x7f];
    var output = midiAccess.outputs.get(portID);
    //omitting the timestamp means send immediately.
    output.send(noteOnMessage);
    // Inlined array creation- note off, middle C, release velocity = 64, timestamp = now + 1000ms
    output.send([0x80, 60, 0x40], window.performance.now() + 1000.0);
}
