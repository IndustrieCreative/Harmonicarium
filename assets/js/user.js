 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2020 by Walter Mantovani (http://armonici.it).
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

HUM.User = class {
    /**
    * @param {HUM.DHC} dhc - The DHC instance to which it belongs
    */
    constructor(harmonicarium) {
    	this.harmonicarium = harmonicarium;
    	this.dbAvailable = false;
        this.dbName = 'keplerBeta'+harmonicarium.id;
        
        this.dbStores = {

	        harmonicarium: {
	        	['harmonicarium'+harmonicarium.id]: {}
	        },

			dppad: {
				['dppad'+harmonicarium.id]: {}
		    },

	        dhc: {},
	        synth: {},
			hancock: {},
			hstack: {},
			keymap: {},
			midiports: {},
			wmlout: {},
			midiout: {},
	    };

	    this.db = {};
		this.dbRequest = {};
    }

    _genStoreNames() {
    	for (let dhc of Object.values(this.harmonicarium.components.availableDHCs)) {
			this.dbStores.dhc[dhc.id] = {};
			this.dbStores.synth[dhc.id] = {};
			this.dbStores.hancock[dhc.id] = {};
			this.dbStores.hstack[dhc.id] = {};
			this.dbStores.keymap[dhc.id] = {};
			this.dbStores.midiports[dhc.id] = {};
			this.dbStores.wmlout[dhc.id] = {};
			this.dbStores.midiout[dhc.id] = {};
    	}
    }

    _openDb() {
		this.dbRequest = window.indexedDB.open(this.dbName, 1);

		this.dbRequest.onerror = function(evt) {
		  alert('An error occurred when opening IndexedDB: ' + evt.target.errorCode);
		};

		this.dbRequest.onupgradeneeded = function(evt) {

			this.db = evt.target.result;

			for ( let storeContainer of Object.values(this.dbStores)) {
				for ( let [dbStoreName, dbStore] of Object.entries(storeContainer)) {

					dbStore = this.db.createObjectStore(dbStoreName, {autoIncrement: true});
			    
			    }
			}

			this.dbAvailable = true;
		};

		this.dbRequest.onsuccess = function(evt) {
		  this.db = evt.target.result;
		};



    }



};