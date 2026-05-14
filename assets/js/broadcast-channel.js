/**
 * @fileoverview BroadcastChannel messaging interface for the Harmonicarium application.
 * This file defines the HUM.BroadcastChannel and HUM.BroadcastChannel.Msg classes,
 * which manage inter-instance and multi-tab communication via the Web BroadcastChannel API.
 *
 * @module broadcast-channel
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
 * BroadcastChannel messaging interface for a HUM instance.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The HUM.BroadcastChannel class wraps the Web BroadcastChannel API to provide
 * a structured command-based messaging system between multiple HUM instances
 * and browser tabs sharing the same context. It manages:
 * - Sending typed command messages to all tabs or a specific session
 * - Receiving and dispatching incoming messages to registered command handlers
 * - Routing reply messages back to their originating session
 */
HUM.BroadcastChannel = class {
    /**
     * Creates a new BroadcastChannel instance for the given HUM instance.
     *
     * @param {HUM} harmonicarium - The HUM instance to which this BroadcastChannel belongs.
     *
     * @description
     * Initializes the BroadcastChannel by:
     * 1. Storing a reference to the parent HUM instance
     * 2. Deriving the channel name from the instance name
     * 3. Opening the native BroadcastChannel with that name
     * 4. Preparing an empty command registry
     * 5. Attaching the message event listener to route incoming messages
     */
    constructor(harmonicarium) {
        /**
         * The HUM instance.
         *
         * @member {HUM}
         */
        this.harmonicarium = harmonicarium;
        /**
         * The full name of the HUM instance, used as the BroadcastChannel name.
         *
         * @member {string}
         */
        this.name = this.harmonicarium.instanceName;
        /**
         * The underlying native BroadcastChannel for this instance.
         *
         * @member {BroadcastChannel}
         */
        this.channel = new window.BroadcastChannel(this.name);
        /**
         * Registry of command handlers keyed by command name.
         * Populated via {@link HUM.BroadcastChannel#registerCommand}.
         *
         * @member {Object.<string, Function>}
         */
        this.commands = {};

        this.channel.addEventListener('message', (evt) => {
            this._receive(evt);
        });

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * The session ID of the current browser tab.
     *
     * @type {string}
     * @readonly
     */
    get sessionID() {
        return this.harmonicarium.components.user.session.id;
    }
    /**
     * Registers a command handler in this BroadcastChannel instance.
     *
     * @param {string}   command - The name of the command to register.
     * @param {Function} fn      - The callback function to invoke when the command is received.
     *
     * @returns {void}
     *
     * @description
     * Stores the provided callback function in the command registry under the
     * given command name. When an incoming message carries that command, the
     * function will be called with the parsed {@link HUM.BroadcastChannel.Msg}.
     */
    registerCommand(command, fn) {
        this.commands[command] = fn;
    }
    /**
     * Removes a previously registered command handler from this BroadcastChannel instance.
     *
     * @param {string} command - The name of the command to unregister.
     *
     * @returns {void}
     *
     * @description
     * Deletes the command entry from the internal registry. Incoming messages
     * carrying this command will be silently ignored after removal.
     */
    unregisterCommand(command) {
        delete this.commands[command];
    }
    /**
     * Sends a command message via this BroadcastChannel.
     *
     * @param {string} command                   - The command name for the receiving handler (e.g. `'session'`).
     * @param {any}    data                      - The payload to transmit.
     * @param {string} [destination='broadcast'] - Target of the message: a session UUID to address a specific
     *                                             tab/window, or `'broadcast'` to address all listeners.
     * @param {string} [reqMsgID=null]            - UUID of the inbound message this send is replying to, if any.
     *
     * @returns {void}
     *
     * @description
     * Constructs a new {@link HUM.BroadcastChannel.Msg} with a freshly generated UUID,
     * stamps it with the current session ID as the source, and posts it through
     * the native BroadcastChannel. All tabs sharing the same channel name will
     * receive the message; only those whose session ID matches `destination`
     * (or that accept `'broadcast'`) will act on it.
     */
    send(command, data, destination='broadcast', reqMsgID=null) {
        this.channel.postMessage(new HUM.BroadcastChannel.Msg({
            mode: 'out',
            msgID: crypto.randomUUID(),
            source: this.harmonicarium.components.user.session.id,
            destination: destination,
            command: command,
            data: data,
            reqMsgID: reqMsgID
        }));
    }
    /**
     * Handles an incoming BroadcastChannel message event.
     *
     * @param {MessageEvent} evt      - The native message event from the BroadcastChannel.
     * @param {any}          evt.data - The raw message payload (a serialized {@link HUM.BroadcastChannel.Msg}).
     *
     * @returns {void}
     *
     * @description
     * Filters the incoming message by destination: only messages addressed to
     * `'broadcast'` or to this session's ID are processed. If a registered
     * command handler exists for the message's command, the method augments the
     * message object with routing metadata (`mode`, `broadcastChannel`,
     * `postInfo`) and invokes the handler with a new {@link HUM.BroadcastChannel.Msg}.
     */
    _receive(evt) {
        let msg = evt.data;
        if (['broadcast', this.sessionID].includes(msg.destination)) {
            if (this.commands[msg.command]) {
                msg.mode = 'in';
                msg.broadcastChannel = this;
                msg.postInfo = { // from original message event
                    origin: evt.origin,
                    lastEventId: evt.lastEventId,
                    source: evt.source,
                    ports: evt.ports,
                };
                // Executes the command specified in the message.
                this.commands[msg.command](new HUM.BroadcastChannel.Msg(msg));
            }
        }
    }
};

/**
 * A structured message exchanged over a {@link HUM.BroadcastChannel}.
 *
 * @class
 * @memberof HUM.BroadcastChannel
 *
 * @description
 * Encapsulates all metadata and payload for a single BroadcastChannel
 * transmission. Inbound messages additionally carry a reference to the
 * originating channel and native post metadata, enabling replies through
 * the {@link HUM.BroadcastChannel.Msg#reply} method.
 */
HUM.BroadcastChannel.Msg = class {
    /**
     * Creates a new BroadcastChannel message.
     *
     * @param {Object}               [obj]                - Destructured message properties.
     * @param {string}               obj.mode             - Direction of the message: `'in'` for received, `'out'` for sent.
     * @param {HUM.BroadcastChannel} obj.broadcastChannel - The {@link HUM.BroadcastChannel} instance (inbound only).
     * @param {string}               obj.msgID            - The UUID identifying this message.
     * @param {string}               obj.source           - Session UUID of the sender.
     * @param {string}               obj.destination      - Session UUID of the target, or `'broadcast'`.
     * @param {string}               obj.command          - Command name used to look up the registered handler.
     * @param {any}                  obj.data             - The message payload.
     * @param {string}               obj.reqMsgID         - UUID of the inbound message this is a response to, if any.
     * @param {Object}               obj.postInfo         - Native {@link MessageEvent} metadata (inbound only).
     *
     * @description
     * Assigns all message fields and, for inbound messages (`mode === 'in'`),
     * additionally stores the channel reference and native post metadata to
     * support reply routing.
     */
    constructor(
        {
            mode,
            broadcastChannel,
            msgID,
            source,
            destination,
            command,
            data,
            reqMsgID,
            postInfo,
        }={}
    ){
        this.msgID = msgID;
        this.source = source;
        this.destination = destination;
        this.command = command;
        this.data = data;
        this.reqMsgID = reqMsgID;
        if (mode === 'in') {
            this.broadcastChannel = broadcastChannel;
            this.postInfo = postInfo;
        }
        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Sends a reply to the originating session of this inbound message.
     *
     * @param {string} command - The command name for the reply.
     * @param {any}    data    - The payload to include in the reply.
     *
     * @returns {void}
     *
     * @description
     * Calls {@link HUM.BroadcastChannel#send} with `this.source` as the
     * destination and `this.msgID` as the request message ID, so the recipient
     * can correlate the reply with the original request.
     */
    reply(command, data) {
        this.broadcastChannel.send(command, data, this.source, this.msgID);
    }
};
