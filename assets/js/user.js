 /**
 * @fileoverview User management system for the Harmonicarium application.
 * This file defines the {@link HUM.User} class which handles user sessions,
 * preset management, and database operations. It manages user preferences,
 * session persistence, and multi-tab coordination. The sub-components are
 * defined in companion files:
 * - {@link module:user-parameters} — `HUM.User.prototype.Parameters` class
 * - {@link module:user-idb-preset-service} — `HUM.User.IDBPresetService` class
 *
 * @module user
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
 * User management class for the Harmonicarium application.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The `HUM.User` class handles user sessions, preset management, database
 * operations, and multi-tab coordination. It provides the complete user
 * experience infrastructure including data persistence and session management.
 *
 * The {@link HUM.User.prototype.Parameters|Parameters} and
 * {@link HUM.User.IDBPresetService|IDBPresetService} companion classes are
 * defined in the {@link module:user-parameters} and
 * {@link module:user-idb-preset-service} files respectively and attached to
 * `HUM.User` at load time.
 */
HUM.User = class {
    /**
     * Creates a new User instance for managing user Sessions and Presets.
     * 
     * @param {HUM} harmonicarium - The parent Harmonicarium instance that owns this user manager.
     * 
     * @description
     * Initializes the user management system with:
     * - Session tracking and multi-tab coordination
     * - Database connections for Presets and backups
     * - Parameter management for user preferences
     * - Autosave functionality for Session persistence
     * 
     * The user system maintains separate parameter lists for live values
     * (current session) and file values (saved presets), enabling efficient
     * preset management and session recovery. NOTE: The management of the file
     * parameters is still under development and maybe, if not useful, will
     * be removed.
     */
    constructor(harmonicarium) {
        this.DEFAULT_PRESET_NAME = 'New preset';
        
        /**
         * The unique identifier for this User instance (same as the HUM id).
         * @type {string}
         */
        this.id = harmonicarium.id;

        /**
         * The internal (private) ID for this User instance.
         * @type {number}
         */
        this._id = harmonicarium.id;
        
        /**
         * The component name identifier.
         * @type {string}
         */
        this.name = 'user';
        
        /**
         * Reference to the parent Harmonicarium instance.
         * @type {HUM}
         */
        this.harmonicarium = harmonicarium;
        
        /**
         * IndexedDB database name for this instance.
         * @type {string}
         */
        this.dbName = harmonicarium.instanceName;
        
        /**
         * IndexedDB schema version number.
         * @type {number}
         */
        this.dbVersion = 2;

        /**
         * Session management object containing current session data.
         * @type {Object}
         * @property {string|boolean} id - Current session ID or false if none
         * @property {string|boolean} name - Current session name or false if none
         * @property {string} sessionStorageKey - Key for session storage
         * @property {Set} concurrentSessions - Set of concurrent session IDs
         */
        this.session = {
            id: false,
            name: false,
            sessionStorageKey: harmonicarium.instanceName,
            concurrentSessions: new Set()
        };

        /**
         * Whether the user system is in read-only mode.
         * @type {boolean}
         */
        this.readonly = false;

        /**
         * Autosave functionality status.
         * @type {boolean}
         */
        this.autosave = false;
        
        /**
         * Queue for autosave params modified after the
         * _setValue() action that trigger an "autosave init".
         * (it happens for the first Param modified after a Preset loading)
         * @type {boolean|Array}
         */
        this.autosaveQueue = false;
        
        /**
         * Object containing parameter values from live data
         * @type {Object}
         */
        this.paramListLive = {};
        
        /**
         * Object containing parameter values from saved preset
         * @type {Object}
         */
        this.paramListFile = {};

        // DEBUG PARAMETERS MAPS
        // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        /**
         * Object containing parameter values from live data, organized by stage.
         * @type {Object}
         * @property {Object} pre - Parameters for the 'pre' stage
         * @property {Object} mid - Parameters for the 'mid' stage
         * @property {Object} post - Parameters for the 'post' stage
         */
        this.paramListLivebyStage = {
            'pre': {},
            'mid': {},
            'post': {}
        };
        /**
         * Object containing parameter values from saved preset, organized by stage.
         * @type {Object}
         * @property {Object} pre - Parameters for the 'pre' stage
         * @property {Object} mid - Parameters for the 'mid' stage
         * @property {Object} post - Parameters for the 'post' stage
         */
        this.paramListFilebyStage = {
            'pre': {},
            'mid': {},
            'post': {}
        };

        /**
         * Object containing the map of live parameter values.
         * The structure is [componentName] > [componentId] > [paramKey]
         * 
         * @type {Object}
         */
        this.paramMapLive = {};
        /**
         * Object containing the map of preset file parameter values.
         * NOTE: Actually not used... but kept for symmetry with paramMapLive
         * @type {Object}
         */
        this.paramMapFile = {};

        // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        /**
         * Parameter management system instance for the user module.
         * @type {HUM.User.prototype.Parameters}
         * 
         * @description
         * This object provides the complete parameter interface for User
         * Session and Preset management functionality. It is initialized
         * in the _init() method.
         */
        this.parameters = {};

        /**
         * Preset service database instance
         * @type {HUM.User.IDBPresetService}
         * 
         * @description
         * This object manages the IndexedDB connection and operations
         * for user presets. It is initialized in the _init() method.
         */
        this.presetServiceDB = {};

        // this.backupServiceDB = {};
    }

    /**
     * Initializes the user management system and database connections.
     * 
     * @returns {Promise<void>} Promise that resolves when initialization is complete.
     * 
     * @description
     * This method performs the complete initialization sequence:
     * 1. Creates parameter management system and preset service instances
     * 2. Opens IndexedDB database connection
     * 3. Initializes UI preset management widgets
     * 4. Reads existing sessions from database
     * 5. Registers BroadcastChannel message handlers for multi-tab coordination
     * 6. Discovers and manages concurrent sessions across browser tabs
     * 7. Restores or creates appropriate session based on availability
     * 8. Loads the last selected preset for the active session
     * 
     * The method handles session discovery, concurrent session management,
     * and ensures proper coordination between multiple browser tabs/windows
     * through BroadcastChannel communication.
     */
    _init() {
        console.group('USER APP - START: Initializing...');
        // @todo: Read URL page path parameters to get params to force after init
        this.parameters = new this.Parameters(this);
        this.presetServiceDB = new HUM.User.IDBPresetService(this);
        // this.backupServiceDB = new HUM.User.IDBBackupService(this);

        // Register the autosave callback on the HUM instance.
        // HUM.Param._setValue() calls this after every value change.
        this.harmonicarium._onParamChange = (param, init, fromRestore) => {
            // @todo: if (now() - param.last_autosave > 1second) {update the 'autosave' idb store}
            if (!init && (param._presetStore && param._presetAutosave) && (!fromRestore && this.autosave)) {
                if (this.parameters.preset.value !== this.session.id) {
                    console.group(`PARAM AUTOSAVE - START: Param "${param.idbKeyPath}" changed. The selected preset has been modified. The "Auto-save" preset will be initialized and set as the active one...`);

                    // Inits
                    this.autosave = false;
                    this.autosaveQueue = [];

                    this.presetServiceDB.updateParams(this.session.id, 'live')
                    .then(() => {
                        console.log('PARAM AUTOSAVE: The "Auto-save" preset has been initialized.');
                        return this.presetServiceDB.updateSession({
                            sessionID: this.session.id,
                            currentPreset: this.session.id
                        });
                    })
                    .then(() => {
                        // Update the select option on the html elem
                        this.parameters.preset._setValue(this.session.id, { init: true });
                        console.groupEnd();
                        console.log('PARAM AUTOSAVE - STOP: "Auto-save" has been set as current preset of the active session.');

                        // Restore the autosave
                        this.autosave = true;

                        // If other Params changed during the autosave preset initialisation, store them too.
                        if (this.autosaveQueue.length > 0) {
                            console.group(`PARAM AUTOSAVE (queue) - START: There are ${this.autosaveQueue.length} Params changed during the initialization of the "Auto-save" preset.`);
                            for (let p of this.autosaveQueue) {
                                console.log(`PARAM AUTOSAVE (queue) - Param "${p.idbKeyPath}" changed. Post-autosave.`);
                                this.presetServiceDB.updateParam(this.session.id, p.idbKeyPath, 'live')
                                .then(() => {
                                    // ... @todo: ? return this somewhere to chain or "await" for this changes?
                                });
                            }
                            console.groupEnd();
                            console.log(`PARAM AUTOSAVE (queue) - STOP: The Params changed during the initialization of the "Auto-save" preset have been saved.`);
                        }
                        // Close the queue
                        this.autosaveQueue = false;
                    });
                } else {
                    console.log(`PARAM AUTOSAVE: Param "${param.idbKeyPath}" changed. Autosave.`);
                    this.presetServiceDB.updateParam(this.session.id, param.idbKeyPath, 'live')
                    .then(() => {
                        // ... @todo: ? return this somewhere to chain or "await" for this changes?
                    });
                }
            // If the autosaveQueue is active (is an array)
            } else if (param._presetStore && param._presetAutosave && this.autosaveQueue && this.autosaveQueue.push) {
                this.autosaveQueue.push(param);
            }
        };

        let storedSessions;

        // @todo: Check if the system date is after 2000
        //        if not, probably is wrong set and alert the user
        //        that the history can have strange behaviours if the
        //        date change frequently.

        // Initialize the database
        return this.presetServiceDB._openDB()
        .then(() => {
            // Init the UI preset management widgets
            return this.parameters._init();
        })
        .then(() => {
            console.group('USER APP - Reading Sessions from IndexedDB...');
            // Read all sessions stored in the DB
            return this.presetServiceDB.getAllSessions();
        })
        .then((sessions) => {
            storedSessions = sessions;
            console.groupEnd();
            console.log('USER APP - Sessions retrived successfully from IndexedDB.');

            // Register this app for BroadcastChannel communications
            this.harmonicarium.broadcastChannel.registerCommand(
                'ask_discoverSessions', msg => {
                    msg.reply('reply_discoverSessions', this.session.id);
                }
            );
            this.harmonicarium.broadcastChannel.registerCommand(
                'reply_discoverSessions', msg => {
                    // Note down the other session
                    this.session.concurrentSessions.add(msg.source);
                    this.parameters.sessionDisplayConcurrent.value = this.session.concurrentSessions;
                }
            );
            this.harmonicarium.broadcastChannel.registerCommand(
                'releaseSession', msg => {
                    this.session.concurrentSessions.delete(msg.source);
                    this.parameters.sessionDisplayConcurrent.value = this.session.concurrentSessions;
                }
            );
            this.harmonicarium.broadcastChannel.registerCommand(
                'presetsChange', msg => {
                    this.parameters.updatePresetsOnUI();
                }
            );
            this.harmonicarium.broadcastChannel.registerCommand(
                'closeApp', msg => {
                    // @todo: make bs dialog
                    // if (window.confirm(msg.data)) {
                    this.presetServiceDB._closeDB();
                    window.close();
                    // }
                }
            );

            window.addEventListener('beforeunload', evt => {
                this.harmonicarium.broadcastChannel.send('releaseSession', this.session.id);
            });
            window.addEventListener('pagehide', evt => {
                this.harmonicarium.broadcastChannel.send('releaseSession', this.session.id);
            });


            console.log('USER APP - Checking for concurrent sessions on other tabs/windows...');
            // Ask on the BroadcastChannel if there are another instances of HUM
            return this._askDiscoverSession();
        })
        // Restore (or init) the right session
        .then(() => {
            return new Promise((resolve, reject) => {
                console.log(`USER APP - Check for concurrent sessions completed. ${this.session.concurrentSessions.size} other active sessions have been found.`);
                // Exclude the concurrentSessions from the storedSessions
                let freeStoredSessions = storedSessions.filter(ss => !this.session.concurrentSessions.has(ss.sessionID)),
                    chosenSession;

                // First, check on the sessionStorage (if it's a page reload, restore... ¿bfcache?)
                console.group('USER APP - Checking sessionStorage for a sessionID...');
                let cachedSessionID = sessionStorage.getItem(this.session.sessionStorageKey);

                if (cachedSessionID) {
                    console.log(`USER APP - Session ${cachedSessionID} found in the sessionStorage.`);
                    // Check if the cached session is in the free sessions
                    chosenSession = freeStoredSessions.find(sess => sess.sessionID === cachedSessionID);
                    if (chosenSession) {
                        // Set the client Session ID
                        this.session.id = chosenSession.sessionID;
                        console.log(`USER APP - Taken the session stored in sessionStorage, that is "${chosenSession.name}" with ID "${chosenSession.sessionID}".`);
                        // FINISH
                        resolve(chosenSession);
                    } else {
                        console.log(`USER APP - The session ${cachedSessionID} has been taken by another tab/windows.`);
                    }
                } else {
                    console.log('USER APP - No session found in the sessionStorage.');
                }
                console.groupEnd();

                // If the sessionStorage recover was failed and there are free sessions
                if (!chosenSession && freeStoredSessions.length) {
                    // Get the last created/accessed/modified session
                    // chosenSession = freeStoredSessions.reduce((a, b) => (a.createdOn > b.createdOn ? a : b));
                    // chosenSession = freeStoredSessions.reduce((a, b) => (a.lastAccessOn > b.lastAccessOn ? a : b));
                    chosenSession = freeStoredSessions.reduce((a, b) => (a.lastEditOn > b.lastEditOn ? a : b));
                    
                    // Set the client Session ID
                    this.session.id = chosenSession.sessionID;
                    sessionStorage.setItem(this.session.sessionStorageKey, chosenSession.sessionID);                        
                    console.log(`USER APP - Taken the most recent used/edited session on the IndexedDB database, that is "${chosenSession.name}" with ID "${chosenSession.sessionID}".`);
                    // FINISH
                    resolve(chosenSession);
                // If the sessionStorage recover was failed and there are NOT free sessions
                } else if (!chosenSession && !freeStoredSessions.length) {
                    console.log(`USER APP - There are no free sessions available. Creating a new one...`);
                    // A new session must be created
                    this.session.id = crypto.randomUUID();
                    this.presetServiceDB.newSession(this.session.id)
                    .then(() => {
                        console.log(`USER APP - New session created with ID ${this.session.id}`);
                        this.harmonicarium.broadcastChannel.send('presetsChange');
                        sessionStorage.setItem(this.session.sessionStorageKey, this.session.id);
                        resolve({currentPreset: 'default'});
                    })
                    .catch((error) => {
                        console.error(error);
                        reject();
                    });
                } else {
                    reject();
                }          

            });
        })
        .then(chosenSession => {
            console.log('USER APP - Reveal this session to the other ones.');
            this._revealThisSession();

            console.groupEnd();
            console.log('USER APP - STOP: Initialization completed.');
            
            // Restore the last selected preset
            return this.loadPreset(chosenSession.currentPreset, true)
            .then(() => {return;})
            .catch(error => {
                if (error === 'not-found') {
                    return this.loadPreset('default', true);
                }
            });
        });
    }

    /**
     * Discovers concurrent sessions by sending a broadcast message.
     * 
     * @returns {Promise} Promise that resolves after discovery timeout.
     * 
     * @description
     * Sends a broadcast message to other browser tabs/windows to discover
     * active sessions. Used for session coordination and preventing conflicts.
     */
    _askDiscoverSession() {
        return new Promise((resolve, reject) => {
            this.harmonicarium.broadcastChannel.send('ask_discoverSessions');
            setTimeout(resolve, 2000);
        });
    }
    
    /**
     * Reveals this session to other concurrent sessions.
     * 
     * @description
     * Broadcasts this session's ID to other tabs/windows and updates
     * the session display in the UI with current session information.
     */
    _revealThisSession() {
        this.harmonicarium.broadcastChannel.send('reply_discoverSessions', this.session.id);
        this.presetServiceDB.getSession(this.session.id)
        .then(session => {
            this.parameters.sessionDisplayCurrent.value = `<b>${session.name}</b> <small><i>(${session.sessionID})</i></small>`;
            this.parameters.sessionRename.value = session.name;
        });
    }

    /**
     * Reads and parses a preset file uploaded by the user.
     * 
     * @param {File} file - The File object representing the uploaded preset file.
     * 
     * @returns {void}
     * 
     * @description
     * This method handles the import process for preset files:
     * 1. Reads the file content using FileReader
     * 2. Parses JSON data and validates format
     * 3. Populates the import interface with available presets
     * 4. Creates checkboxes for preset selection
     * 5. Handles file reading errors and validation
     * 
     * The method supports selective import, allowing users to choose
     * which presets to import from the file. It also handles reverb
     * IR data import options.
     */
    readPresetFile(file) {
        let reader = new FileReader();
        // Handle loading errors
        reader.onerror = this.harmonicarium.components.backendUtils.fileErrorHandler;
        if (file) {
            // Read file into memory as UTF-8 text
            reader.readAsText(file);
            // Launch the data processing as soon as the file has been loaded
            reader.onload = evt => {
                let checksContiner = this.parameters.presetFile.uiElements.out.user_preset_import_checks;
                // Initialize the custom properties slots (cache)
                this.parameters.presetFile.selectedPresets = new Set();
                this.parameters.presetFile.importedPresets = {};
                HUM.BackendUtils.emptyHTMLElement(checksContiner);

                // Put the "param-stored" objects in a chache
                this.parameters.presetFile.importedPresets = JSON.parse(evt.target.result);
                
                for (let preset of Object.values(this.parameters.presetFile.importedPresets)){
                    
                    // Create one checkboxes for each preset in the JSON file
                    let div = document.createElement('div'),
                        checkbox = document.createElement('input'),
                        label = document.createElement('label'),
                        htmlId = 'filePreset_'+preset.presetID+'_'+this.id;

                    div.classList.add('form-check');
                    checkbox.classList.add('form-check-input');
                    label.classList.add('form-check-label');

                    checkbox.setAttribute('type', 'checkbox');
                    checkbox.setAttribute('id', htmlId);
                    checkbox.setAttribute('value', preset.presetID);
                    label.setAttribute('for', htmlId);

                    label.innerText = preset.description;

                    div.appendChild(checkbox);
                    div.appendChild(label);
                    checksContiner.appendChild(div);

                    checkbox.addEventListener('change', evt => {
                        if (evt.target.checked) {
                            this.parameters.presetFile.selectedPresets.add(evt.target.value);
                        } else {
                            this.parameters.presetFile.selectedPresets.delete(evt.target.value);
                        }

                        if (this.parameters.presetFile.selectedPresets.size > 0) {
                            this.parameters.presetFile.bsPopover.disable();
                        } else {
                            this.parameters.presetFile.bsPopover.enable();
                        }
                    });
                }
            };
        }
    }

    /**
     * Imports selected presets from the loaded preset file into the database.
     * 
     * @returns {Promise<Array>} Promise that resolves with array of import results.
     * 
     * @description
     * This method processes the presets selected for import and:
     * 1. Creates preset objects from the selected file data
     * 2. Handles preset ID conflicts and renaming
     * 3. Manages parameter data and reverb IR import
     * 4. Saves presets to the IndexedDB database
     * 5. Updates UI feedback with import results
     * 
     * The method preserves the original preset structure while ensuring
     * compatibility with the current database schema. It handles both
     * regular parameters and optional reverb IR data based on user preference.
     */
    importPresets() {
        return new Promise((resolve, reject) => {
            let res = [];
            if (this.parameters.presetFile.selectedPresets.size > 0) {
                let selectedPresets = [...this.parameters.presetFile.selectedPresets];
                let presetsReqArray = selectedPresets.map(presetID => {
                    let preset = this.parameters.presetFile.importedPresets[presetID],
                        parameters = preset.PARAMETERS;
                    // Create result obj to keep track of old and new values
                    // Notes the values of the original preset
                    res.push({
                        oldDesc: preset.description,
                        oldID: preset.presetID
                    });

                    // Recreate the preset object without the PARAMETERS property
                    preset = {
                        dbVersion: preset.dbVersion, 
                        description: preset.description, 
                        presetID: preset.presetID, 
                    };
                    // delete preset.PARAMETERS; // ******
                    console.log(preset);
                    return this.presetServiceDB.addFilePresetParams(preset, parameters);
                });
                Promise.all(presetsReqArray)
                .then(results => {
                    // Notes the new values of the imported (new) presets
                    results.map((newRes, idx) => {
                        res[idx].newDesc = newRes.newDescription;
                        res[idx].newID = newRes.newPresetID;
                    });
                    console.log('All selected preset have been imported.');
                    resolve(res);
                })
                .catch(evt => {
                    console.error('An error occurred when importing the presets: ', evt);
                    reject();
                });

            } else {
                alert('You have launched the import-file function whithout selecting any preset to import!');
                reject();
            }
        });
    }

    /**
     * Exports all stored presets from the database to a downloadable JSON file.
     * 
     * @returns {void}
     * 
     * @description
     * This method creates a comprehensive export of all user presets:
     * 1. Retrieves all presets from the IndexedDB database
     * 2. Collects all associated parameters for each preset
     * 3. Optionally includes reverb IR data if user preference is set
     * 4. Converts ArrayBuffer data to base64 for JSON serialization
     * 5. Creates and triggers automatic download of the JSON file
     * 6. Provides UI feedback during the export process
     * 
     * The exported file contains complete preset data including:
     * - Preset metadata (name, description, timestamps)
     * - All parameter values and configurations
     * - Optional reverb impulse response data
     * - Database version information for compatibility
     */
    exportPresets() {
        // Activate the spinner on button
        this.parameters.presetExport.uiElements.out.user_preset_exportBtnSpinner.classList.add('spinner-border');

        let exportObject = {},
            storedPresets;
        // Get the presets
        this.presetServiceDB.getAllPresets()
        .then(presets => {
            storedPresets = presets;
            // For each preset
            return Promise.all(Object.values(storedPresets).map(sp => 
                // Get the params
                this.presetServiceDB.getPresetParameters(sp.presetID)
            ));
        })
        // Get an array with the parameters
        .then(presetParamsArray => {
            console.log(presetParamsArray);
            // Container for reading file requests
            let convertPromiseArray = [];
            // Put each object containing the params inside the corresponging preset
            // inside the special property PARAMETERS
            
            // For each preset
            for (let [idx, preset] of Object.entries(storedPresets)) {
                exportObject[preset.presetID] = preset;
                exportObject[preset.presetID].PARAMETERS = presetParamsArray[idx];
                // Check the params
                for (let param of exportObject[preset.presetID].PARAMETERS) {
                    // If it's a wave file
                    if (param.value && (param.value.type === 'audio/wav')) {
                        // If the reverb file must be exported (by option)
                        if (this.parameters.presetExportReverb.value) {
                            // Note the filename
                            param.valueFileName = param.value.name;
                            // Add the request to the array
                            convertPromiseArray.push(
                                new Promise((resolve, reject) => {
                                    let reader = new FileReader();
                                    reader.readAsDataURL(param.value);
                                    reader.onload = function () {
                                        param.value = reader.result;
                                        resolve();
                                    };
                                    reader.onerror = function (error) {
                                        param.value = 'Error';
                                        reject();
                                    };   
                                })
                            );
                        // If the reverb file must NOT be exported (by option)
                        } else {
                            param.value = 'default';
                            param._value = 'default';
                        }
                    }
                }
            }
            return Promise.all(convertPromiseArray);
        })
        .then(() => {
            let json = JSON.stringify(exportObject, (k, v) => v === undefined ? null : v, 4),
            // let json = JSON.stringify(exportObject, null, 4),
                file = new File([json], 'harmonicarium.json', {type: 'text/json'}),
                link = document.createElement('a'),
                url = URL.createObjectURL(file);

            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.parameters.presetExport.uiElements.out.user_preset_exportBtnSpinner.classList.remove('spinner-border');
        })
        .catch(error => {
            console.error('An error occurred while trying to export the presets: ', error);
        });
    }

    /**
     * Saves the current live parameters as a new preset in the database.
     * 
     * @param {string} name                      - The name for the new preset.
     * @param {string} [key=crypto.randomUUID()] - Optional unique key for the preset.
     * 
     * @returns {Promise} Promise that resolves when the preset is saved.
     * 
     * @description
     * This method creates a new preset from the current live parameters:
     * 1. Validates the preset name and checks for duplicates
     * 2. Generates a unique key if not provided
     * 3. Saves all current live parameters to the new preset in IndexedDB
     * 4. Updates the current session to use the new preset
     * 5. Broadcasts changes to other tabs/windows
     * 
     * The method ensures that preset names are unique and handles
     * session updates to reflect the newly created preset.
     */
    saveNewPreset(name, key=crypto.randomUUID()) {
        return new Promise((resolve, reject) => {
            if (name) {
                this.presetServiceDB.getAllPresets()
                .then(presets => {
                    let sameName = presets.find(preset => preset.description === name);
                    if (sameName) {
                        console.error('There is already a preset with the same name. No preset saved.');
                        reject('invalid');
                    } else {
                        if (name === this.DEFAULT_PRESET_NAME) {
                            name += ' '+key.slice(0,3)+key.slice(-3);
                        }
                        // Create a new preset and save all params from live
                        return this.presetServiceDB.addPresetParams(key, name, 'live')
                        .then(async () => {
                            // Update the session with the current preset
                            await this.presetServiceDB.updateSession({
                                sessionID: this.session.id,
                                currentPreset: key
                            });
                            // Select the new preset just created
                            this.parameters.preset._setValue(key, { init: true });
                            this.harmonicarium.broadcastChannel.send('presetsChange');
                            resolve();
                        })
                        .catch(error => {
                            console.error(error);
                            reject('error', error);
                        });
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject('error', error);
                });
            } else {
                console.info('Invalid preset name. No preset saved.');
                reject('invalid');
            }
        });
    }

    get paramSequence() {
        let resSeq = [],
            sortFn = (a, b) => {
                if (a._restoreSequence < b._restoreSequence) {return -1;}
                if (a._restoreSequence > b._restoreSequence) {return 1;}
                return 0;
            };
        for (let stage of ['pre', 'mid', 'post']) {
            let resStage = Object.values(this.paramListLive).map(param => {
                if (param._restoreStage === stage) {
                    return param;
                }
            })
            .filter(param => param); // Remove undefined entries
            resStage.sort(sortFn);
            resSeq.push(...resStage);
        }
        return resSeq;
    }
    
    /**
     * Loads a preset by its ID and applies it to the current session.
     * 
     * @param {string}  presetID          - The unique identifier of the preset to load.
     * @param {boolean} [init=false]      - Whether this is during initialization (disables autosave).
     * @param {boolean} [fromParam=false] - Whether the load was triggered by a parameter change.
     * 
     * @returns {Promise} Promise that resolves when the preset is loaded.
     * 
     * @description
     * This method retrieves and applies a preset from the database:
     * 1. Fetches preset parameters from IndexedDB
     * 2. Applies parameter values to live parameters
     * 3. Handles custom property restoration and pre/post hooks
     * 4. Updates the current session with the selected preset
     * 5. Manages autosave state based on context
     * 6. Updates the preset parameter value if not triggered by parameter change
     * 
     * The method ensures that all applicable parameters are restored
     * according to their defined restoration logic and updates the
     * session state accordingly.
     */
    loadPreset(presetID, init=false, fromParam=false) {
        return new Promise((resolve, reject) => {
            console.group(`PRESET LOADING - START: The preset "${presetID}" is loading...`);
            if (!init) {
                // Disable the autosave feature
                this.autosave = false;
            }
            let presetFound = false;
            this.presetServiceDB.getPresetParameters(presetID)
            .then(results => {
                if (results.length) {
                    presetFound = true;
                    let presetSequence = this.paramSequence;

                    for (let paramObjLive of presetSequence) {
                        let paramObjStored = results.find(strParam => 
                            (strParam.paramID === paramObjLive.idbKeyPath)
                        );
                        if (paramObjStored) {
                            // let paramObjLive = this.paramListLive[paramObjStored.paramID];
                            // If the param can be restored
                            if (paramObjLive._presetRestore) {
                                // Apply (and set) custom properties
                                let customProps = {};
                                if (paramObjLive._customPropertiesRestore) {
                                    customProps = paramObjLive._customPropertiesRestore(paramObjStored.customProperties);
                                } else {
                                    customProps = paramObjStored.customProperties;
                                }
                                Object.assign(paramObjLive, customProps);

                                // Get the right the value to restore
                                let value;
                                if (['value', '_value'].includes(paramObjLive._presetSetValue)) {
                                    value = paramObjStored[paramObjLive._presetSetValue];
                                } else {
                                    value = paramObjStored.customProperties[paramObjLive._presetSetValue];
                                }
                                
                                // Run optional preRestore
                                if (paramObjLive._preRestore) {
                                    value = paramObjLive._preRestore(value);
                                }

                                // Set the value to the Param
                                paramObjLive._setValue(value, { init: true, fromUI: false, preSet: true, postSet: true, fromRestore: true });

                                // Run optional postRestore
                                if (paramObjLive._postRestore) {
                                    paramObjLive._postRestore(value);
                                }
                            }

                        } else {
                            if (paramObjLive._presetRestore) {
                                console.error(`The parameter ${paramObjLive.idbKeyPath} with index ${paramObjLive.app._id} was not found on the preset ${presetID}.`);
                            }
                            continue;
                        }
                    }
                    // Update the session with the current preset
                    return this.presetServiceDB.updateSession({
                        sessionID: this.session.id,
                        currentPreset: presetID
                    });
                } else {
                    reject('not-found');
                }
            })
            .then(request => {
                console.groupEnd();
                if (presetFound) { 
                    console.log(`PRESET LOADING - FINISH: The preset "${presetID}" has been loaded and set as current preset of the active session.`);
                } else {
                    console.error(`PRESET LOADING - FINISH: The preset "${presetID}" was not found.`);
                }

            })
            .catch((evt, request) => {
                // @todo: re-load the previous preset?
                // request.transaction.abort();
                reject(evt, request);
            })
            .finally(() => {
                if (!fromParam) {
                    // Set the current preset on the Param
                    this.parameters.preset._setValue(presetID, { init: true });
                    // this.parameters.preset._setValue(presetID, { fromUI: false, preSet: true, postSet: false });
                }
                if (this.presetServiceDB.available && !init) {
                    // Re-enable the autosave feature
                    this.autosave = true;
                }
                resolve();
            });
        });
    }

};

// HUM.User.IDBBackupService = class {
//     constructor(user) {}
// };

