 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2023 by Walter G. Mantovani (http://armonici.it).
 * Written by Walter G. Mantovani.
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
 * The BroadcastChannel interface class<br>
 *    A tool for managing the sent/received messages through the `window.BroadcastChannel`.
 */
HUM.BroadcastChannel = class {
    /**
     * @param {HUM} harmonicarium - The HUM instance to which this BroadcastChannel must refer.
     */
    constructor(harmonicarium) {
        /**
        * The HUM instance.
        *
        * @member {HUM}
        */
        this.harmonicarium = harmonicarium;
        /**
        * The full name of the HUM instance.
        * 
        * @member {string}
        */
        this.name = this.harmonicarium.instanceName;
        /**
        * The BroadcastChannel of this instance.
        * 
        * @member {BroadcastChannel}
        */
        this.channel = new window.BroadcastChannel(this.name);
        /**
        * The commands' register.
        * 
        * @member {Object}
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
    * @member {string}
    */
    get sessionID() {
        return this.harmonicarium.components.user.session.id;
    }
    /**
     * Register a BroadcastChannel command.
     * 
     * @param {string}   command - The name of the command that is to be registered.
     * @param {Function} fn      - The callback function to be run for executing the command.
     */
    registerCommand(command, fn) {
        this.commands[command] = fn;
    }
    /**
     * Remove a BroadcastChannel command.
     * 
     * @param {string} command - The name of the command that is to be unregistered.
     */
    unregisterCommand(command) {
        delete this.commands[command];
    }
    /**
     * Send a BroadcastChannel command.
     * 
     * @param {string}                   command                   - The specific command for the app es. session.
     * @param {any}                      data                      - The message to be sent.
     * @param {string}                   [destination='broadcast'] - The destination of the message: a sessionID for communicating
     *                                                               to a specific session or 'broadcast' for communicating with all sessions.
     *                                                               It's optional and the default is 'broadcast'.
     * @param {HUM.BroadcastChannel.Msg} [reqMsgID=null]           - The original message (inbound) that make the request. Optional.
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
     * Receive a BroadcastChannel command.
     * 
     * @param {MessageEvent} evt      - The message event from BroadcastChannel.
     * @param {any}          evt.data - The actual message.
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
 * The BroadcastChannel Message class.
 */
HUM.BroadcastChannel.Msg = class {
    /**
     * @param {Object}               [obj]                - Destructuring parameter containing the message.
     * @param {string}               obj.mode             - The message mode: 'in' or 'out'.
     * @param {HUM.BroadcastChannel} obj.broadcastChannel - The `HUM.BroadcastChannel` instance.
     * @param {string}               obj.msgID            - The message UUID.
     * @param {string}               obj.source           - The session UUID.
     * @param {string}               obj.destination      - A session UUID or 'broadcast'.
     * @param {string}               obj.command          - Specific command for the app.
     * @param {any}                  obj.data             - The message.
     * @param {string}               obj.reqMsgID         - The UUID of the original incoming message that make the request.
     * @param {Object}               obj.postInfo         - The infos from the original incoming message.
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
     * Reply to this BroadcastChannel Message.
     * 
     * @param {string} command - The reply command.
     * @param {any} data       - The reply data.
     */
    reply(command, data) {
        this.broadcastChannel.send(command, data, this.source, this.msgID);
    }
};
