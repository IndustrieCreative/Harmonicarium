 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2022 by Walter G. Mantovani (http://armonici.it).
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

// MessageType: userSession
// Ask if there is another session
// if yes
    // read the sessionID
    // update concurrent sessions
    // 
// if no
    // 

HUM.BroadcastChannel = class {
    /**
    * @param {HUM} harmonicarium - ...
    */
    constructor(harmonicarium){
        this.harmonicarium = harmonicarium;
        this.name = this.harmonicarium.instanceName;
        // this.sessionID = this.harmonicarium.components.user.session.id;
        this.channel = new window.BroadcastChannel(this.name);
        this.commands = {};

        this.channel.addEventListener('message', (evt) => {
            this._receive(evt);
        });

        // =======================
    } // end class Constructor
    // ===========================
    get sessionID() {
        return this.harmonicarium.components.user.session.id;
    }
    registerCommand(command, fn) {
        this.commands[command] = fn;
    }
    unregisterCommand(command) {
        delete this.commands[command];
    }
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
    _receive(evt) {
        let msg = evt.data;
        if (['broadcast', this.sessionID].includes(msg.destination)) {
            if (this.commands[msg.command]) {
                msg.mode = 'in';
                msg.broadcastChannel = this;
                msg.postInfo = { // from original message event
                    origin: event.origin,
                    lastEventId: event.lastEventId,
                    source: event.source,
                    ports: event.ports,
                };
                this.commands[msg.command](new HUM.BroadcastChannel.Msg(msg));
            }
        }
    }
};

HUM.BroadcastChannel.Msg = class {
    /**
    * @param {HUM.DHC} dhc - ...
    */
    constructor(
        {
            mode,
            broadcastChannel,
            msgID, // message ID
            source, // 'sessionID'
            destination, // 'sessionID' or 'broadcast'
            command, // specific command for the app es. session
            data, // the message
            reqMsgID, // the original message (inbound) that make the request
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
    reply(command, data) {
        this.broadcastChannel.send(command, data, this.source, this.msgID);
    }
};
