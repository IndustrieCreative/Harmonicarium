 /**
 * @fileoverview User management system for Harmonicarium application.
 * This file defines the HUM.User class which handles user sessions,
 * preset management, and database operations. It manages user preferences,
 * session persistence, and multi-tab coordination.
 * 
 * @module user
 * @memberof HUM
 * @version 0.8.1
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
 * Handles user sessions, preset management, database operations, and
 * multi-tab coordination. This class provides the complete user experience
 * infrastructure including data persistence and session management.
 * 
 * @class
 * @memberof HUM
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
                            this.parameters.preset._setValue(key, true);
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
                                paramObjLive._setValue(value, true, false, true, true, true);

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
                    this.parameters.preset._setValue(presetID, true);
                    // this.parameters.preset._setValue(presetID, false, false, true, false);
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

/**
 * IndexedDB Preset Service for managing user presets and sessions.
 * @class
 * @memberof HUM.User
 * 
 * @description
 * This class provides IndexedDB database operations for storing and retrieving
 * user presets, parameters, and session data. It defines the database schema,
 * handles version upgrades, and offers CRUD operations with proper transaction
 * management and error handling for persistent user settings.
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API|IndexedDB API}
 */
HUM.User.IDBPresetService = class {
    /**
     * Creates an instance of the IDBPresetService.
     * 
     * @param {HUM.User} user - The parent user management instance.
     * @constructor
     * 
     * @description
     * Initializes the IDBPresetService with the provided user instance.
     * Sets up database connection parameters, schema definitions, and
     * prepares for database operations.
     */
    constructor(user) {
        /**
         * @type {HUM.User}
         * @description Reference to the parent User management instance.
         */
        this.user = user;

        // DB identifiers slots
        // this.dbName = user.dbName; 
        // this.dbVersion = user.dbVersion;

        /**
         * @type {IDBDatabase|false}
         * @description The IndexedDB database instance or false if not initialized.
         */
        this.database = false;

        /**
         * @type {boolean}
         * @description Indicates if the database is available for operations.
         */
        this.available = false;

        /**
         * @type {string}
         * @description The access mode for database transactions ('readonly' or 'readwrite').
         */
        this.accessMode = user.readonly ? 'readonly' : 'readwrite';

        /**
         * @type {Object}
         * @description Definitions of the object stores in the database.
         * Each store includes its name, key path, schema, and indexes.
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore|IDBObjectStore}
         */
        this.stores = {
            PARAMETER: {
                name: 'parameter',
                constSlug: 'paramObjStore', // name for arguments of nuclear and composed CRUD op-methods
                options: {
                    keyPath: ['paramID', 'presetID'], //, 'dbVersion'],
                    autoIncrement: false
                },
                schema: { // @todo: implement check structure and typeof
                    // PRIMARY KEY (composite)
                    paramID: 'string',
                    presetID: 'string', // -> PRESET
                    // INFO FOR UPGRADER FN
                    dbVersion: 'integer',
                    // INFO FOR USER/DEVELOPER
                    componentName: 'string',
                    componentIndex: 'integer',
                    // INFO FOR USER
                    presetGetValue: 'string',
                    presetSetValue: 'string',
                    dataType: 'string',
                    // EDITABLE BY USER (depending on presetSetValue & dataType)
                    customProperties: 'object',
                    _value: undefined,
                    value: undefined,
                },
                indexes: {
                    // FOR CRUD OPS
                    PRESET: {
                        name: 'byPreset',
                        keyPath: 'presetID',
                        options: {
                            unique: false,
                            multientry: false
                        }
                    },
                    // FOR UPGRADER FN
                    VERSION: {
                        name: 'byVersion',
                        keyPath: 'dbVersion',
                        options: {
                            unique: false,
                            multientry: false
                        }
                    },
                    // FOR DEVELOPER
                    COMPONENT: {
                        name: 'byComponent',
                        keyPath: ['componentName', 'componentIndex'],
                        options: {
                            unique: false,
                            multientry: false
                        }
                    },
                    DATATYPE: {
                        name: 'byDataType',
                        keyPath: 'dataType',
                        options: {
                            unique: false,
                            multientry: false
                        }
                    }
                }
            },
            PRESET: {
                name: 'preset',
                constSlug: 'presetObjStore', // name for arguments of nuclear and composed CRUD op-methods
                options: {
                    keyPath: 'presetID', //, 'dbVersion'],
                    autoIncrement: false
                },
                schema: {
                    presetID: 'string',
                    description: 'string',
                    dbVersion: 'integer',
                },
                indexes: {

                }
            },
            HISTORY: {
                name: 'history',
                constSlug: 'historyObjStore', // name for arguments of nuclear and composed CRUD op-methods
                options: {
                    keyPath: 'sequence',
                    autoIncrement: true,
                },
                schema: {
                    sequence: 'integer',
                    sessionID: 'integer', // -> SESSION 
                    paramID: 'string',
                    dbVersion: 'integer',
                    value: undefined,
                    _value: undefined,
                },
                indexes: {
                    SESSION: {
                        name: 'bySession',
                        keyPath: 'sessionID',
                        options: {
                            unique: false,
                            multientry: false
                        }
                    },
                }
            },
            SESSION: {
                name: 'session',
                constSlug: 'sessionObjStore', // name for arguments of nuclear and composed CRUD op-methods
                options: {
                    keyPath: 'sessionID',
                    autoIncrement: false,
                },
                schema: {
                    sessionID: 'string', // <-> autosave PRESET / HISTORY
                    name: 'string',
                    currentPreset: 'string', // -> PRESET (useful for page re-load/open)
                    createdOn: 'date',
                    // lastAccessOn: 'date',
                    lastEditOn: 'date', // when currentPreset (by init or user) or name change
                },
                indexes: {

                }
            },
        };

        /**
         * @type {Object}
         * @description Default preset definitions for quick access and initialization.
         * Includes the two main presets: DEFAULT and AUTOSAVE.
         */
        this.defaults = {
            DEFAULT: {
                presetID: 'default',
                description: 'Default',
            },
            AUTOSAVE: {
                presetID: 'autosave', // this.user.session.id UUID
                description: 'Auto-save',
            }
        };

        /**
         * @type {Array<string>}
         * @description List of object store names for easy reference and iteration.
         * e.g. ['parameter', 'preset', 'history', 'session']
         */
        this.objectStoreNames = Object.values(this.stores).map(store => store.name);
    }

    /*
     * ========================================================================
     *  DATABASE CONNECTION METHODS
     * ========================================================================
     */

    /**
     * Opens a connection to the IndexedDB database.
     * 
     * @returns {Promise<IDBDatabase>} Promise that resolves with the opened database instance.
     * 
     * @description
     * This method initiates the opening of the IndexedDB database:
     * 1. Handles version upgrades and schema initialization
     * 2. Sets up event listeners for database events (success, error, blocked)
     * 3. Manages the database instance and its availability state
     * 4. Provides error handling and user notifications for issues
     * 
     * The method ensures that the database is properly initialized
     * and ready for operations, resolving with the database instance
     * upon successful connection.
     */
    _openDB() {
        return new Promise((resolve, reject) => {
            console.group('USER IDB - START: Initializing...');

            let openDBRequest = window.indexedDB.open(this.user.dbName, this.user.dbVersion);
            
            openDBRequest.onblocked = (evt) => { // IDBVersionChangeEvent
                console.error('[IDBOpenDBRequest] ONBLOCKED');
                alert('A version change transaction on the IndexedDB database has been blocked. Maybe you are running Harmonicarium also in a differennt window or tab with a lower DB version number.');
                reject(openDBRequest);
            };

            openDBRequest.onerror = (evt) => {
                console.error('[IDBOpenDBRequest] ONERROR');
                alert('An error occurred when opening the IndexedDB database: ' + evt.target.error);
                reject(openDBRequest);
            };

            // On first run or on changing DB version
            openDBRequest.onupgradeneeded = (evt) => { // IDBVersionChangeEvent
                console.log('[IDBOpenDBRequest] ONUPGRADENEEDED');
                // alert('The IndexedDB database has been upgraded or created.');
                this._upgradeDB(evt, reject);
            };

            openDBRequest.onsuccess = (evt) => {
                console.log('[IDBOpenDBRequest] ONSUCCESS');
                
                // Get the DB
                this.database = evt.target.result;
                
                // Handle DB errors
                this.database.onerror = (evt) => {
                    console.error('[IDBDatabase] ONERROR: ', evt.target.error);
                    alert('An IndexedDB databese error has been occurred.');
                };
                this.database.onabort = (evt) => {
                    console.error('[IDBDatabase] ONABORT: ', evt.target);
                    alert('An IndexedDB transaction has been aborted.');
                };
                this.database.onclose = (evt) => {
                    console.error('[IDBDatabase] ONCLOSE: ', evt.target);
                    alert('The connection to the IndexedDB stores has been closed!');
                    this.available = false;
                };
                this.database.onversionchange = (evt) => {
                    console.error('[IDBDatabase] ONVERSIONCHANGE: ', evt.target);
                    alert('The structure of the IndexedDB database has been changed and/or the version is increased or it was asked for its deletion.');
                    // this.available = false;
                };
                
                this.available = true;
                console.log(`[IDBFactory] OPEN DATABASE "${this.user.dbName}" with version ${this.user.dbVersion}.`);
                console.groupEnd();
                console.log('USER IDB - STOP: Initialization completed.');
                resolve(this.database);
            };
        });
    }

    /**
     * Closes the connection to the IndexedDB database.
     * 
     * @returns {void}
     * 
     * @description
     * This method closes the active connection to the IndexedDB database:
     * 1. Calls the close method on the database instance
     * 2. Updates the availability state of the database
     * 3. Logs the closure event for debugging purposes
     * 
     * The method ensures that the database connection is properly
     * terminated and resources are released.
     */
    _closeDB() {
        this.database.close();
        console.log(`[IDBFactory] CLOSED DATABASE "${this.user.dbName}".`);
        this.available = false;
    }

    /**
     * Handles database version upgrades and schema initialization.
     * 
     * @param {IDBVersionChangeEvent} versionChangeEvent - The version change event.
     * @param {Function} reject - The reject function from the Promise.
     * 
     * @returns {void}
     * 
     * @description
     * This method manages the upgrade process when the database version changes:
     * 1. Deletes existing object stores if upgrading from version 1
     * 2. Creates new object stores and indexes for version 2 and above
     * 3. Populates the database with initial data if necessary
     * 4. Provides error handling and user notifications for issues during upgrade
     * 
     * The method ensures that the database schema is updated correctly
     * and that any necessary data is initialized for the new version.
     */
    _upgradeDB(versionChangeEvent, reject) {
        this.database = versionChangeEvent.target.result;
        const oldVersion = versionChangeEvent.oldVersion,
              newVersion = versionChangeEvent.newVersion;
        console.log(`ONUPGRADENEEDED: Database version upgrade from v${oldVersion} to v${newVersion}.`);

        // Erase the existing stores if you have v1
        if (oldVersion === 1) {
        // if ([1].includes(oldVersion)) {
            for (let storeName of this.database.objectStoreNames) {
                this.database.deleteObjectStore(storeName);
            }
            console.error('ONUPGRADENEEDED: Pass to the first dev public version. Erase all stores and reinintialize them...');
        }

        if (oldVersion < 2 ) {
        // if ([0,1].includes(oldVersion)) {
            // Store obj with "var/const slugs" as keys
            let stores = {};
            // Create the DB Stores
            for (let storeSettings of Object.values(this.stores)) {
                stores[storeSettings.constSlug] = this.database.createObjectStore(storeSettings.name, storeSettings.options);
                for (let indexSetting of Object.values(storeSettings.indexes)) {
                    stores[storeSettings.constSlug].createIndex(indexSetting.name, indexSetting.keyPath, indexSetting.options);
                }
            }
            this._initPopulateDB(stores)
            .then(() => {
                console.log('ONUPGRADENEEDED: The database has been initialized with default data.');
            })
            .catch(error => { // IDBRequest
                alert(`ONUPGRADENEEDED: An error occurred when upgrading the DB from v${oldVersion} to v${newVersion}.`);
                reject(error);
            });

        }
        // if (oldVersion < 3) {
        //     // do 1->2 upgrade
        //     let store = this.db.createObjectStore('better_users');
        //     store.createIndex('some_index', '...');
        //     this.db.deleteObjectStore('users'); // migrating data would be better
        // }
        // if (oldVersion < 4) {
        //     // do 2->3 upgrade
        //     this.dbRequest.transaction.objectStore('better_users').createIndex('index2', '...');
        // }
        // if (oldVersion < 5) {
        //     // do 3->4 upgrade
        //     this.db.createObjectStore('messages', '...');
        // }
        // if (oldVersion < 6) {
        //     // do 4->5 upgrade
        //     // ...
        // }
    }

    /**
     * Initializes and populates the database with default data.
     * 
     * @param {Object}         stores                 - The object stores to populate.
     * @param {IDBObjectStore} stores.paramObjStore   - The parameter object store.
     * @param {IDBObjectStore} stores.presetObjStore  - The preset object store.
     * @param {IDBObjectStore} stores.sessionObjStore - The session object store.
     * 
     * @returns {Promise} Promise that resolves when the database is populated.
     * 
     * @description
     * This method populates the database with initial data:
     * 1. Creates a new session with a unique ID
     * 2. Stores the session ID in sessionStorage for persistence
     * 3. Adds default presets and parameters to the respective object stores
     * 4. Uses transactions to ensure atomicity of operations
     * 
     * The method ensures that the database is initialized with
     * necessary default data for proper functionality.
     */
    _initPopulateDB({paramObjStore, presetObjStore, sessionObjStore}) {
        // Create a new "first" session
        this.user.session.id = crypto.randomUUID();
        // Write down to use this new session by setting it into sessionStorage.
        // NOTE: Create a new entry or update the existing one, so it's ok
        //       also if the user deletes the IndexedDB database and then reloads.
        sessionStorage.setItem(this.user.session.sessionStorageKey, this.user.session.id);

        // Deconstruct store obj
        // const { paramObjStore, presetObjStore, sessionObjStore } = stores;

        // Init data
        const requestArray = [
            this.addSession(
                this.user.session.id,
                undefined,
                {sessionObjStore}),
            // Poluplate the DB Stores whith the default preset
            this.addPresetParams(
                this.defaults.DEFAULT.presetID,
                this.defaults.DEFAULT.description,
                'live',
                {paramObjStore, presetObjStore}
            ),
            // Create and initialize the autosave preset too
            this.addPresetParams(
                this.user.session.id,
                `${this.defaults.AUTOSAVE.description} (session ${this.user.session.id.slice(0,3)+this.user.session.id.slice(-3)})`,
                'live',
                {paramObjStore, presetObjStore}
            )
        ];
        return Promise.all(requestArray);
    }

    /*
     * ========================================================================
     * TRANSACTION METHODS
     * ========================================================================
     */

    /**
     * Creates and returns a new IndexedDB transaction.
     * @param {string|Array<string>} objectStoreNames - The name(s) of the object store(s) for the transaction.
     * 
     * @returns {IDBTransaction} The created IndexedDB transaction.
     * 
     * @description
     * This method creates a new transaction for the specified object store(s):
     * 1. Initializes the transaction with the defined access mode (readonly or readwrite)
     * 2. Sets up event listeners for transaction events (error, abort, complete)
     * 3. Provides error handling and user notifications for issues during the transaction
     * 
     * The method ensures that the transaction is properly configured
     * and ready for database operations.
     */
    _getTransaction(objectStoreNames) {
        let transaction = this.database.transaction(objectStoreNames, this.accessMode);
        console.info('[IDBTransaction] STARTED');
        transaction.onerror = (evt) => { 
            console.error('[IDBTransaction] ONERROR');
            alert('An error occurred during the IndexedDB transaction: ' + evt.target.error);
        };
        transaction.onabort = (evt) => { 
            console.error('[IDBTransaction] ONABORT');
            alert('The IndexedDB transaction has been aborted');
        };
        transaction.oncomplete = (evt) => {
            // console.info('IDBTransaction ONCOMPLETE');
            // this.database.close();
        };
        return transaction;
    }

    /**
     * Retrieves object stores for the specified names within a transaction.
     * @param {Array<string>} objectStoreNames - The names of the object stores to retrieve.
     * 
     * @returns {Object} An object containing the requested object stores.
     * 
     * @throws {Error} If any of the provided store names are invalid.
     * 
     * @description
     * This method retrieves the specified object stores within a transaction:
     * 1. Validates the provided store names against the defined schema
     * 2. Creates a transaction for the valid store names
     * 3. Returns an object containing the requested object stores
     * 4. Provides error handling and user notifications for invalid store names
     * 
     * The method ensures that only valid object stores are accessed
     * and that they are properly managed within a transaction.
     */
    _getStores(objectStoreNames=[]) {
        // Check if is the store names are valid
        // If there is an invalid name
        if (!objectStoreNames.some(name=>this.objectStoreNames.includes(name))) {
            let wrongArray = JSON.stringify(objectStoreNames);
            alert('Ivalid IndexedDB store name/s: ' + wrongArray);
            throw new Error('HUM.User.IDBProxy._getStores() received an/some unexpected store name/s in the "objectStoreNames" argument: ' + wrongArray);
        // If all names are valid
        } else {
            let transaction = this._getTransaction(objectStoreNames);
            let stores = {};
            for (let reqStoreName of objectStoreNames) {
                for (let value of Object.values(this.stores)) {
                    if (value.name === reqStoreName) {
                        stores[value.constSlug] = transaction.objectStore(reqStoreName);
                    }
                }
            }
            return stores;
        }
    }

    /*
     * ========================================================================
     * COMPOSED CRUD INDEXEDDB OPS
     * ========================================================================
     */

    // - - - - - - - - - - - - - - - - - - - - - 
    // CREATE / UPDATE
    // - - - - - - - - - - - - - - - - - - - - - 

    /**
     * Creates a new session with the specified ID and name.
     * 
     * @param {string} sessionID - The unique identifier for the session.
     * @param {string} [name]    - Optional name for the session.
     * @param {Object} [stores]  - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.sessionObjStore] - The session object store.
     * @param {IDBObjectStore} [stores.paramObjStore]   - The parameter object store.
     * @param {IDBObjectStore} [stores.presetObjStore]  - The preset object store.
     * 
     * @returns {Promise} Promise that resolves when the session is created.
     * 
     * @description
     * This method creates a new session in the database:
     * 1. Initializes a new session object with the provided ID and name
     * 2. Sets creation and last edit timestamps
     * 3. Stores the session in the session object store
     * 4. Optionally creates and initializes an autosave preset for the session
     * 5. Uses transactions to ensure atomicity of operations
     * 
     * The method ensures that the new session is properly created
     * and stored in the database, along with its associated autosave preset.
     */
    newSession(sessionID, name, {sessionObjStore, paramObjStore, presetObjStore}=this._getStores([this.stores.PARAMETER.name, this.stores.SESSION.name, this.stores.PRESET.name])) {
        return new Promise((resolve, reject) => {
            const transaction = sessionObjStore.transaction;
            let requestArray = [
                // Create the session
                this.addSession(
                    sessionID,
                    name,
                    {sessionObjStore}),
                // Create and initialize the autosave preset too
                this.addPresetParams(
                    sessionID,
                    `${this.defaults.AUTOSAVE.description} (session ${sessionID.slice(0,3)+sessionID.slice(-3)})`,
                    'live',
                    {paramObjStore, presetObjStore}
                )
            ];
            Promise.all(requestArray)
            .then(resultsArray => {
                resolve(resultsArray);
            })
            .catch(evt => { // IDBRequest
                transaction.abort();
                console.error(`An error occurred while creating the new Session "${sessionID}": `, evt);
                reject(evt);
            });
        });
    }

    /**
     * Adds a new preset and its parameters to the database.
     * 
     * @param {string} presetID   - The unique identifier for the new preset.
     * @param {string} presetDesc - The description of the new preset.
     * @param {string} source     - The source of the preset parameters ('live' or 'file').
     * @param {Object} [stores]   - The object stores to use for the operation.
     * @param {IDBObjectStore} [stores.paramObjStore]  - The parameter object store.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise<Array>} Promise that resolves with results array when both preset and parameters are created.
     * 
     * @description
     * This method creates a new preset and adds its parameters in a single transaction:
     * 1. Creates a new preset entry in the preset object store
     * 2. Adds all parameters for the preset based on the specified source
     * 3. Uses Promise.all to ensure both operations complete successfully
     * 4. Aborts the transaction if any operation fails
     */
    addPresetParams(presetID, presetDesc, source, {paramObjStore, presetObjStore}=this._getStores(this.objectStoreNames)) {
        return new Promise((resolve, reject) => {
            const transaction = paramObjStore.transaction;
            const requestArray = [
                this.addPreset(presetID, presetDesc, {presetObjStore}),
                this.addParams(presetID, source, {paramObjStore})
            ];
            Promise.all(requestArray)
            .then(resultsArray => {
                console.info(`A new preset has been created with id "${presetID}" and name "${presetDesc}" from "${source}".`);
                resolve(resultsArray);
            })
            .catch(evt => { // IDBRequest
                transaction.abort();
                console.error(`An error occurred while storing the new Preset "${presetID}" : `, evt);
                reject(evt);
            });
        });
    }

    /**
     * Adds a new preset and its parameters from imported JSON data.
     * 
     * @param {Object} preset - The preset object containing the original description.
     * @param {string} preset.description - The original preset description.
     * @param {Object} parameters - An object containing parameter objects to be added.
     * @param {Object} [stores] - The object stores to use for the operation.
     * @param {IDBObjectStore} [stores.paramObjStore]  - The parameter object store.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise<{newPresetID: string, newDescription: string}>} Promise that resolves with the new preset ID and description.
     * 
     * @description
     * This method imports a preset from JSON data:
     * 1. Generates a new unique preset ID using crypto.randomUUID()
     * 2. Creates a modified description with import identifier
     * 3. Processes each parameter, updating the preset ID reference
     * 4. Handles audio file parameters (base64 encoded WAV files):
     *    - Converts back to File object if import reverb option is enabled
     *    - Sets to 'default' if import reverb option is disabled
     * 5. Creates preset and all parameters in a single transaction
     * 6. Aborts transaction on any failure
     */
    addFilePresetParams(preset, parameters, {paramObjStore, presetObjStore}=this._getStores(this.objectStoreNames)) {
        return new Promise((resolve, reject) => {
            const transaction = paramObjStore.transaction;
            let newPresetID=crypto.randomUUID(),
                newDescription = preset.description+' (import '+newPresetID.slice(0,3)+newPresetID.slice(-3)+')';
            // Create one request for each parameter
            let paramsReqArray = Object.values(parameters).map(param => {
                param.presetID = newPresetID;
                // If it's a wave file
                if (param.value && param.valueFileName && param.value.slice(0, 21) === 'data:audio/wav;base64') {
                    // If the reverb file must be restored (by option)
                    if (this.user.parameters.presetImportReverb.value) {
                        // Restore the file from base64 encoding
                        param.value = HUM.Synth.base64ToFile({
                            name: param.valueFileName,
                            data: param.value
                        });
                    } else {
                        param.value = 'default';
                    }
                } 
                return this._storeidbParamObj(param, 'add', {paramObjStore});
            });
            // Create the final squence of requests, prepending the preset creation
            const requestArray = [
                this.addPreset(newPresetID, newDescription, {presetObjStore}),
                ...paramsReqArray
            ];
            Promise.all(requestArray)
            .then(resultsArray => {
                console.info(`A new preset has been created with id "${newPresetID}" and name "${newDescription}" from JSON file.`);
                resolve({newPresetID, newDescription});
            })
            .catch(evt => { // IDBRequest
                transaction.abort();
                console.error(`An error occurred while storing the Preset "${preset.description}" coming from the JSON file: `, evt);
                reject(evt);
            });
        });
    }

    /**
     * Updates an existing session with new data.
     * 
     * @param {Object} newData  - The new data to update the session with.
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.sessionObjStore] - The session object store.
     * 
     * @returns {Promise} Promise that resolves when the session is updated.
     * 
     * @description
     * This method updates an existing session in the database:
     * 1. Retrieves the existing session by its ID
     * 2. Merges the new data into the existing session object
     * 3. Updates the last edit timestamp if not provided
     * 4. Stores the updated session back in the session object store
     * 5. Uses transactions to ensure atomicity of operations
     * 6. Aborts the transaction if any operation fails
     * 
     * The method ensures that the session is properly updated and stored
     * in the database.
    */
    updateSession(newData, {sessionObjStore}=this._getStores([this.stores.SESSION.name])) {
        if (!newData.lastEditOn) {
            newData.lastEditOn = new Date();
        }
        return this.getSession(newData.sessionID, {sessionObjStore})
        .then(session => {
            Object.assign(session, newData);
            return(this._storeSession(session, 'put', {sessionObjStore}));
        })
        .catch((evt, request) => {
            if (request) {
                request.transaction.abort();
            }
            console.error(`An error occurred while trying to update the Session "${newData.sessionID}": `, evt);
        });
    }

    /**
     * Updates an existing preset with new data.
     * 
     * @param {Object} newData - The new data to update the preset with.
     * @param {string} newData.presetID - The unique identifier for the preset to update.
     * @param {string} [newData.description] - The new description for the preset.
     * @param {number} [newData.dbVersion] - The new database version for the preset.
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise<{newDesc: string, newVers: number, oldDesc: string, oldVers: number}>} Promise that resolves with an object containing old and new values.
     * 
     * @description
     * This method updates an existing preset in the database:
     * 1. Retrieves the existing preset by its ID
     * 2. Merges the new data into the existing preset object
     * 3. Stores the updated preset back in the preset object store
     * 4. Uses transactions to ensure atomicity of operations
     * 5. Aborts the transaction if any operation fails
     * 6. Returns an object containing both old and new values for description and database version
     * 
     * The method ensures that the preset is properly updated and stored
     * in the database, while also providing feedback on the changes made.
     */
    updatePreset(newData, {presetObjStore}=this._getStores([this.stores.PRESET.name])) {
        return new Promise((resolve, reject) => {
            // Create result obj to keep track of old and new values
            // Notes new values
            let res = {
                newDesc: newData.description,
                newVers: newData.dbVersion,
            };
            return this.getPreset(newData.presetID, {presetObjStore})
            .then(preset => {
                // Notes old values
                res.oldDesc = preset.description;
                res.oldVers = preset.dbVersions;
                // Apply changes
                Object.assign(preset, newData);
                // Perform the preset update
                return(this._storePreset(preset, 'put', {presetObjStore}));
            })
            .then(result => {
                resolve(res); // resolve the obj with old and new value
            })
            .catch((evt, request) => {
                if (request) {
                    request.transaction.abort();
                }
                console.error(`An error occurred while trying to update the Preset "${newData.presetID}": `, evt);
                reject(evt);
            });
        });
    }

    /**
     * Updates multiple parameters for a given preset.
     * 
     * @param {string} presetID - The unique identifier for the preset whose parameters are to be updated.
     * @param {string} source   - The source of the parameters to update ('live' or 'file').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * @returns {Promise<Array>} Promise that resolves with an array of results when all parameters are updated.
     * 
     * @description
     * This method is a wrapper to {@link _storeParams} using the 'put' operation type.
     */
    updateParams(presetID, source, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return this._storeParams(presetID, source, 'put', {paramObjStore});
    }

    /**
     * Adds multiple parameters for a given preset.
     * 
     * @param {string} presetID - The unique identifier for the preset whose parameters are to be added.
     * @param {string} source   - The source of the parameters to add ('live' or 'file').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * @returns {Promise<Array>} Promise that resolves with an array of results when all parameters are added.
     * 
     * @description
     * This method is a wrapper to {@link _storeParams} using the 'add' operation type.
    */
    addParams(presetID, source, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return this._storeParams(presetID, source, 'add', {paramObjStore});
    }

    /**
     * Stores multiple parameters for a given preset using the specified operation type.
     * 
     * @param {string} presetID - The unique identifier for the preset whose parameters are to be stored.
     * @param {string} source   - The source of the parameters to store ('live' or 'file').
     * @param {string} opType   - The operation type ('add' or 'put').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * @returns {Promise<Array>} Promise that resolves with an array of results when all parameters are stored.
     * 
     * @description
     * This method stores multiple parameters for a given preset:
     * 1. Retrieves the list of parameter IDs from the specified source ('live' or 'file')
     * 2. Creates a request for each parameter to store it using the specified operation type ('add' or 'put')
     * 3. Uses Promise.all to ensure all parameter storage operations complete successfully
     * 4. Aborts the transaction if any operation fails
     * 
     * The method ensures that all parameters are properly stored in the database
     * for the specified preset.
     */
    _storeParams(presetID, source, opType, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return new Promise((resolve, reject) => {
            const transaction = paramObjStore.transaction;
            let keysArray = [];
            if (source === 'live') {
                keysArray = Object.keys(this.user.paramListLive);
            } else if (source === 'file') {
                keysArray = Object.keys(this.user.paramListFile);
            } else {
                reject('error');
            }
            const requestArray = keysArray.map((paramID) =>
                this._storeParam(presetID, paramID, source, opType, {paramObjStore})
            );
            Promise.all(requestArray)
            .then(resultsArray => {
                resolve(resultsArray);
            })
            .catch(evt => { // IDBRequest
                transaction.abort();
                console.error(`An error occurred while storing the Params of the Preset "${presetID}": `, evt);
                reject(evt);
            });
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - 
    // DELETE
    // - - - - - - - - - - - - - - - - - - - - - 

    /**
     * Deletes a preset and all its associated parameters from the database.
     * 
     * @param {string} presetID - The unique identifier for the preset to be deleted.
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore]  - The parameter object store.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise} Promise that resolves when the preset and its parameters are deleted.
     * 
     * @description
     * This method deletes a preset and all its associated parameters in a single transaction:
     * 1. Retrieves all parameters associated with the specified preset ID
     * 2. Creates a deletion request for each parameter
     * 3. Creates a deletion request for the preset itself
     * 4. Uses Promise.all to ensure all deletion operations complete successfully
     * 5. Aborts the transaction if any operation fails
     * 
     * The method ensures that the preset and its parameters are properly deleted from the database.
     */
    deletePresetParams(presetID, {paramObjStore, presetObjStore}=this._getStores(this.objectStoreNames)) {
        return new Promise((resolve, reject) => {
            const transaction = paramObjStore.transaction;
            // Get all parameters of the passed preset
            this.getPresetParameters(presetID, {paramObjStore})
            .then(presetParams => {
                // Request deletion of all these parameters
                let delReqArray = presetParams.map(param => 
                    this._deleteParam([param.paramID, presetID], {paramObjStore})
                );
                // At last, request deletion of the preset
                delReqArray.push(this._deletePreset(presetID, {presetObjStore}));
                return Promise.all(delReqArray);
            })
            .then(() => {
                resolve();
            })
            .catch((evt) => {
                transaction.abort();
                console.error(`An error occurred while deleting the Preset "${presetID}": `, evt);
                reject(evt);
            });
        });
    }

    /*
     * ========================================================================
     * NUCLEAR CRUD INDEXEDDB OPS
     * ========================================================================
     */

    // - - - - - - - - - - - - - - - - - - - - - 
    // CREATE / UPDATE
    // - - - - - - - - - - - - - - - - - - - - - 

    /**
     * Adds a new session to the database.
     * @param {string} [sessionID=this.user.session.id] - The unique identifier for the session. Defaults to the current user's session ID.
     * @param {string} [sessionName] - The name of the session. If not provided, defaults to "New session" followed by the first 3 and last 3 characters of the session ID.
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.sessionObjStore] - The session object store.
     * 
     * @returns {Promise} Promise that resolves when the session is added.
     * 
     * @description
     * This method adds a new session to the database:
     * 1. Initializes a new session object with the provided ID and name
     * 2. Sets creation and last edit timestamps
     * 3. Stores the session in the session object store
     * 
     * The method ensures that the new session is properly created
     * and stored in the database.
     */
    addSession(sessionID=this.user.session.id,
               sessionName='New session '+sessionID.slice(0,3)+sessionID.slice(-3),
               {sessionObjStore}=this._getStores([this.stores.SESSION.name])) {
        let dateTime = new Date(),
            data = {
                sessionID: sessionID,
                name: sessionName,
                currentPreset: 'default', // -> PRESET (useful for page re-load/open)
                createdOn: dateTime,
                // lastAccessOn: dateTime,
                lastEditOn: dateTime,
            };
        return this._storeSession(data, 'add', {sessionObjStore});
    }

    /**
     * Stores a session in the database using the specified operation type.
     * @param {Object} data - The session data to store.
     * @param {string} opType - The operation type ('add' or 'put').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.sessionObjStore] - The session object store.
     * 
     * @returns {Promise} Promise that resolves when the session is stored.
     * 
     * @description
     * This method stores a session in the database:
     * 1. Uses the specified operation type ('add' or 'put') to store the session
     * 2. Handles success and error events for the storage operation
     * 3. Provides error handling and user notifications for issues during the storage
     * 
     * The method ensures that the session is properly stored in the database.
     */
    _storeSession(data, opType, {sessionObjStore}=this._getStores([this.stores.SESSION.name])) {
        return new Promise((resolve, reject) => {
            let request = sessionObjStore[opType](data);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('_storeSession ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Adds a new preset to the database.
     * @param {string} presetID - The unique identifier for the new preset.
     * @param {string} presetDesc - The description of the new preset.
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise} Promise that resolves when the preset is added.
     * 
     * @description
     * This method adds a new preset to the database:
     * 1. Initializes a new preset object with the provided ID and description
     * 2. Sets the database version for the preset
     * 3. Stores the preset in the preset object store
     * 
     * The method ensures that the new preset is properly created
     * and stored in the database.
     */
    addPreset(presetID, presetDesc, {presetObjStore}=this._getStores([this.stores.PRESET.name])) {
        let data = {
            presetID: presetID,
            dbVersion: this.user.dbVersion,
            description: presetDesc,
        };
        return this._storePreset(data, 'add', {presetObjStore});
    }

    /**
     * Stores a preset in the database using the specified operation type.
     * @param {Object} data - The preset data to store.
     * @param {string} opType - The operation type ('add' or 'put').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise} Promise that resolves when the preset is stored.
     * 
     * @description
     * This method stores a preset in the database:
     * 1. Uses the specified operation type ('add' or 'put') to store the preset
     * 2. Handles success and error events for the storage operation
     * 3. Provides error handling and user notifications for issues during the storage
     * 
     * The method ensures that the preset is properly stored in the database.
     */
    _storePreset(data, opType, {presetObjStore}=this._getStores([this.stores.PRESET.name])) {
        return new Promise((resolve, reject) => {
            let request = presetObjStore[opType](data);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('_storePreset ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Updates an existing parameter for a given preset.
     *
     * @param {string} presetID - The unique identifier for the preset whose parameter is to be updated.
     * @param {string} paramID  - The unique identifier for the parameter to update.
     * @param {string} source   - The source of the parameter to update ('live' or 'file').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * 
     * @returns {Promise} Promise that resolves when the parameter is updated.
     * 
     * @description
     * This method is a wrapper to {@link _storeParam} using the 'put' operation type.
     */
    updateParam(presetID, paramID, source, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return this._storeParam(presetID, paramID, source, 'put', {paramObjStore});
    }

    /**
     * Adds a new parameter for a given preset.
     *
     * @param {string} presetID - The unique identifier for the preset whose parameter is to be added.
     * @param {string} paramID  - The unique identifier for the parameter to add.
     * @param {string} source   - The source of the parameter to add ('live' or 'file').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * 
     * @returns {Promise} Promise that resolves when the parameter is added.
     * 
     * @description
     * This method is a wrapper to {@link _storeParam} using the 'add' operation type.
     */
    addParam(presetID, paramID, source, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return this._storeParam(presetID, paramID, source, 'add', {paramObjStore});
    }

    /**
     * Stores a parameter for a given preset using the specified operation type.
     *
     * @param {string} presetID - The unique identifier for the preset whose parameter is to be stored.
     * @param {string} paramID  - The unique identifier for the parameter to store.
     * @param {string} source   - The source of the parameter to store ('live' or 'file').
     * @param {string} opType   - The operation type ('add' or 'put').
     * @param {Object} [stores] - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * 
     * @returns {Promise} Promise that resolves when the parameter is stored.
     * 
     * @description
     * This method stores a parameter for a given preset:
     * 1. Retrieves the parameter object from the specified source ('live' or 'file')
     * 2. Checks if the parameter can be stored
     * 3. Prepares the parameter data for storage, including custom properties
     * 4. Uses the specified operation type ('add' or 'put') to store the parameter
     * 5. Handles success and error events for the storage operation
     * 6. Provides error handling and user notifications for issues during the storage
     * 
     * The method ensures that the parameter is properly stored in the database
     * for the specified preset.
     */
    _storeParam(presetID, paramID, source, opType, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        let paramObj = false;
        if (source === 'live') {
            paramObj = this.user.paramListLive[paramID];
        } else if (source === 'file') {
            paramObj = this.user.paramListFile[paramID];
        } else {
            return new Promise((resolve, reject)=>reject());
        }
        // If the param can be stored
        if (paramObj._presetStore) {
            let value = paramObj._presetGetValue ? 
                paramObj[paramObj._presetGetValue] :
                paramObj.value;
            
            let _value = paramObj._value;

            // If it's an audio, keeps just the "value" and discard "_value"
            if (value && value === _value && value.type === 'audio/wav') {
                _value = undefined;
            }

            //  Prepare the customProperties object
            let customProperties = {};
            if (paramObj._customPropertiesStore) {
                customProperties = paramObj._customPropertiesStore();
            } else {
                for (let customPropName of Object.keys(paramObj._customProperties)) {
                    customProperties[customPropName] = paramObj[customPropName];
                }
            }
            let idbParamObj = {
                paramID: paramID,
                dbVersion: this.user.dbVersion,
                presetID: presetID,
                componentName: paramObj.app.name,
                componentIndex: paramObj.app._id,
                value: value,
                _value: _value,
                dataType: paramObj.dataType,
                customProperties: customProperties,
                presetGetValue: paramObj._presetGetValue,
                presetSetValue: paramObj._presetSetValue,
            };

            return this._storeidbParamObj(idbParamObj, opType, {paramObjStore});
        } else {
            // Return a resolved promise
            return new Promise((resolve, reject)=>resolve());
        }
    }

    /**
     * Stores a full parameter object in the database using the specified operation type.
     *
     * @param {Object} idbParamObj - The parameter object to store.
     * @param {string} opType      - The operation type ('add' or 'put').
     * @param {Object} [stores]    - The object stores to use for the operation. If not provided, they will be retrieved automatically from the default names.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * 
     * @returns {Promise} Promise that resolves when the parameter object is stored.
     * 
     * @description
     * This method stores a full parameter object in the database:
     * 1. Uses the specified operation type ('add' or 'put') to store the parameter object
     * 2. Handles success and error events for the storage operation
     * 3. Provides error handling and user notifications for issues during the storage
     * 
     * The method ensures that the parameter object is properly stored in the database.
     */
    _storeidbParamObj(idbParamObj, opType, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return new Promise((resolve, reject) => {
            let request = paramObjStore[opType](idbParamObj);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('_storeParamObj ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - 
    // READ
    // - - - - - - - - - - - - - - - - - - - - - 

    /**
     * Retrieves all user Sessions from the database.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Session name.
     * @param {IDBObjectStore} [stores.sessionObjStore] - The Session object store.
     * 
     * @returns {Promise<Array>} Promise that resolves with an array of all sessions.
     * 
     * @description
     * This method retrieves all Sessions from the database:
     * 1. Uses the getAll() method of the Session object store to fetch all Sessions
     * 2. Handles success and error events for the retrieval operation
     * 3. Provides error handling and user notifications for issues during the retrieval
     * 
     * The method ensures that all Sessions are properly retrieved from the database.
     */
    getAllSessions({sessionObjStore}=this._getStores([this.stores.SESSION.name])) {
        return new Promise((resolve, reject) => {
            let request = sessionObjStore.getAll();
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('getAllSessions ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Retrieves a specific user Session from the database by it ID.
     * @param {string} sessionID - The unique identifier for the Session to retrieve.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Session name.
     * @param {IDBObjectStore} [stores.sessionObjStore] - The session object store.
     * 
     * @returns {Promise<Object>} Promise that resolves with the session object.
     * 
     * @description
     * This method retrieves a specific session from the database:
     * 1. Uses the get() method of the session object store to fetch the session by its ID
     * 2. Handles success and error events for the retrieval operation
     * 3. Provides error handling and user notifications for issues during the retrieval
     * 
     * The method ensures that the specified session is properly retrieved from the database.
     */
    getSession(sessionID, {sessionObjStore}=this._getStores([this.stores.SESSION.name])) {
        return new Promise((resolve, reject) => {
            let request = sessionObjStore.get(sessionID);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('getSession ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Retrieves all user Presets from the database.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Preset name.
     * @param {IDBObjectStore} [stores.presetObjStore] - The Preset object store.
     * 
     * @returns {Promise<Array>} Promise that resolves with an array of all presets.
     * 
     * @description
     * This method retrieves all Presets from the database:
     * 1. Uses the getAll() method of the Preset object store to fetch all Presets
     * 2. Handles success and error events for the retrieval operation
     * 3. Provides error handling and user notifications for issues during the retrieval
     * 
     * The method ensures that all Presets are properly retrieved from the database.
     */
    getAllPresets({presetObjStore}=this._getStores([this.stores.PRESET.name])) {
        return new Promise((resolve, reject) => {
            let request = presetObjStore.getAll();
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('getAllPresets ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Retrieves a specific user Preset from the database by its ID.
     * @param {string} presetID - The unique identifier for the Preset to retrieve.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Preset name.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise<Object>} Promise that resolves with the preset object.
     * 
     * @description
     * This method retrieves a specific preset from the database:
     * 1. Uses the get() method of the preset object store to fetch the preset by its ID
     * 2. Handles success and error events for the retrieval operation
     * 3. Provides error handling and user notifications for issues during the retrieval
     * 
     * The method ensures that the specified preset is properly retrieved from the database.
     */
    getPreset(presetID, {presetObjStore}=this._getStores([this.stores.PRESET.name])) {
        return new Promise((resolve, reject) => {
            let request = presetObjStore.get(presetID);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('getPreset ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Retrieves all Parameters associated with a specific Preset from the database.
     * @param {string} presetID - The unique identifier for the Preset whose Parameters are to be retrieved.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Parameter name.
     * @param {IDBObjectStore} [stores.paramObjStore] - The Parameter object store.
     * 
     * @returns {Promise<Array>} Promise that resolves with an array of Parameter objects.
     * 
     * @description
     * This method retrieves all parameters associated with a specific preset from the database:
     * 1. Uses the preset index of the parameter object store to fetch all parameters for the given preset ID
     * 2. Handles success and error events for the retrieval operation
     * 3. Provides error handling and user notifications for issues during the retrieval
     * 
     * The method ensures that all parameters for the specified preset are properly retrieved from the database.
     */
    getPresetParameters(presetID, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return new Promise((resolve, reject) => {
            let presetIndex = paramObjStore.index(this.stores.PARAMETER.indexes.PRESET.name),
                request = presetIndex.getAll(presetID);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('getPresetParameters ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - 
    // DELETE
    // - - - - - - - - - - - - - - - - - - - - - 

    /**
     * Deletes the entire IndexedDB database.
     * @param {string} dbName - The name of the database to delete.
     * 
     * @returns {Promise} Promise that resolves when the database is deleted.
     * 
     * @description
     * This method deletes the entire IndexedDB database:
     * 1. Uses the indexedDB.deleteDatabase() method to delete the specified database
     * 2. Handles success and error events for the deletion operation
     * 3. Provides error handling and user notifications for issues during the deletion
     * 
     * The method ensures that the specified database is properly deleted.
     */
    _deleteDatabase(dbName) {
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.deleteDatabase(dbName );
            request.onsuccess = (evt) => {
                resolve();
            };
            request.onerror = (evt) => {
                console.error('_deleteDatabase ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Deletes a specific preset from the database.
     * @param {string} presetID - The unique identifier for the preset to delete.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Preset name.
     * @param {IDBObjectStore} [stores.presetObjStore] - The preset object store.
     * 
     * @returns {Promise} Promise that resolves when the preset is deleted.
     * 
     * @description
     * This method deletes a specific preset from the database:
     * 1. Uses the delete() method of the preset object store to remove the preset by its ID
     * 2. Handles success and error events for the deletion operation
     * 3. Provides error handling and user notifications for issues during the deletion
     * 
     * The method ensures that the specified preset is properly deleted from the database.
     */
    _deletePreset(presetID, {presetObjStore}=this._getStores([this.stores.PRESET.name])) {
        return new Promise((resolve, reject) => {
            // @todo: check, cannot delete preset if its parameters are still stored
            //        (You have to delete the preset's params first!)
            let request = presetObjStore.delete(presetID);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('_deletePreset ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }

    /**
     * Deletes a specific parameter from the database.
     * @param {string} paramID - The unique identifier for the parameter to delete.
     * @param {Object} [stores] - The object store to use for the operation. If not provided,
     *                            it will be retrieved automatically from the default Parameter name.
     * @param {IDBObjectStore} [stores.paramObjStore] - The parameter object store.
     * 
     * @returns {Promise} Promise that resolves when the parameter is deleted.
     * 
     * @description
     * This method deletes a specific parameter from the database:
     * 1. Uses the delete() method of the parameter object store to remove the parameter by its ID
     * 2. Handles success and error events for the deletion operation
     * 3. Provides error handling and user notifications for issues during the deletion
     * 
     * The method ensures that the specified parameter is properly deleted from the database.
     */
    _deleteParam(paramID, {paramObjStore}=this._getStores([this.stores.PARAMETER.name])) {
        return new Promise((resolve, reject) => {
            let request = paramObjStore.delete(paramID);
            request.onsuccess = (evt) => {
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.error('_deleteParam ERROR: ', request.error);
                reject(evt, request); // IDBRequest
            };
        });
    }
};


/**
 * Class representing user parameters.
 * @class
 * @memberof HUM.User
 * 
 * @description
 * This class defines specific parameters for managing user related stuff like
 * sessions and presets. It includes parameters for renaming sessions,
 * displaying the current session, displaying concurrent sessions, and
 * selecting presets.
 */
HUM.User.prototype.Parameters = class {
    constructor(user) {
        this.app = user;

        this.sessionRename = new HUM.Param({
            app:user,
            idbKey:'userSessionRename',
            uiElements:{
                'user_session_newName': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'typing',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'text',
                }),
                'user_session_renameBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        // @todo: make a single transaction!!! (risk to rename just one)
                        //        transfer this to adhoc method in presetServiceDB
                        let nameInput = this.sessionRename.uiElements.in.user_session_newName;
                        // If it's NOT an empty string
                        if (this.sessionRename.value) {
                            this.app.presetServiceDB.getAllSessions()
                            .then(sessions => {
                                let sameName = sessions.find(session => session.name === this.sessionRename.value);
                                // If it's NOT unique
                                if (sameName) {
                                    nameInput.classList.add('is-invalid');
                                    return new Promise((resolve, reject)=>reject('There is already a session with the same name.'));
                                // If it's unique
                                } else {
                                    // Rename the session
                                    return this.app.presetServiceDB.updateSession({
                                        sessionID: this.app.session.id,
                                        name: this.sessionRename.value
                                    });
                                }
                            })
                            .then(() => {
                                // Rename the autosave preset
                                return this.app.presetServiceDB.updatePreset({
                                    presetID: this.app.session.id,
                                    description: `${this.app.presetServiceDB.defaults.AUTOSAVE.description} (session ${this.sessionRename.value})`,
                                });
                            })
                            .then(() => {
                                this.updatePresetsOnUI();
                                this.sessionRename.uiElements.in.user_session_newName.classList.remove('is-invalid');
                                this.app.harmonicarium.broadcastChannel.send('presetsChange');
                                this.app._revealThisSession();
                            })
                            .catch(error => {
                                console.error(`An error occurred while trying to rename this Session, "${this.app.session.id}": `, error);
                            });
                        // If it's an empty string
                        } else {
                            nameInput.classList.add('is-invalid');
                            console.error("The name of the session can't be an empty string.");
                        }
                    }
                }),
            },
            dataType:'string',
            initValue:'',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
        });

        this.sessionDisplayCurrent = new HUM.Param({
            app:user,
            idbKey:'userSessionDisplayCurrent',
            uiElements:{
                'user_session_current': new HUM.Param.UIelem({
                    role: 'out',
                    htmlTargetProp:'innerHTML',
                }),
            },
            dataType:'string',
            initValue:'CURRENT1',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
        });

        this.sessionDisplayConcurrent = new HUM.Param({
            app:user,
            idbKey:'userSessionDisplayConcurrent',
            uiElements:{
                'user_session_concurrent': new HUM.Param.UIelem({
                    role: 'out',
                    htmlTargetProp:'innerHTML',
                    // uiSet
                }),
            },
            dataType:'string',
            initValue: new Set(),
            init:false,
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            preSet: (value, thisParam) => {
                if (value instanceof Set) {
                    return new Promise(async (resolve, reject) => {
                        let ulElem = document.createElement('ul');
                        for (let sessionID of value) {
                            let session,
                                liElem = document.createElement('li');
                            try {
                                session = await this.app.presetServiceDB.getSession(sessionID);
                            } catch (error) {
                                reject(error);
                            }
                            liElem.innerHTML = `<b>${session.name}</b> <small><i>(${sessionID})</i></small>`;
                            ulElem.appendChild(liElem);
                        }
                        resolve(ulElem);
                    })
                    .then(ulElem => {
                        thisParam.value = ulElem.innerHTML;
                    })
                    .catch(error => {
                        console.error(error);
                    });
                } else {
                    return value;
                }
            }
        });

        this.preset = new HUM.Param({
            app:user,
            idbKey:'userPreset',
            uiElements:{
                'user_preset_select': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                    eventListener: evt => {
                        if (this.preset.value === evt.target.value) {
                            this.preset.uiElements.in.user_preset_loadBtn.classList.add('d-none');
                        } else {
                            this.preset.uiElements.in.user_preset_loadBtn.classList.remove('d-none');
                        }
                    }
                }),
                'user_preset_loadBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.preset.valueUI = this.preset.uiElements.in.user_preset_select.value;
                    }
                }),
            },
            dataType:'string',
            initValue: 'default',
            init:false, // true if at the first change, the first thing is to put this to "autosave"
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            initAsync:true,
            preInit: async () => {
                await this.updatePresetsOnUI(); // get an array  of sorted preset objects
            },
            postSet: (value, thisParam, init) => {
                if (!init) {
                    this.app.loadPreset(value, false, true)
                    .catch(error => {
                        if (error === 'not-found') {
                            alert('Preset not found!');
                        }
                    });
                }
                if (value === thisParam.uiElements.in.user_preset_select.value) {
                    this.preset.uiElements.in.user_preset_loadBtn.classList.add('d-none');
                } else {
                    this.preset.uiElements.in.user_preset_loadBtn.classList.remove('d-none');
                }
                this.updatePresetsOnUI();
            }
        });

        this.managePreset = new HUM.Param({
            app:user,
            idbKey:'userManagePreset',
            uiElements:{
                'user_preset_renameBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.managePreset.currentAction = 'rename';
                        // Update the selectioon
                        this.updatePresetsOnUI();
                        this.managePreset.uiElements.in.user_managePreset_select.classList.remove('is-invalid');
                        this.managePreset.uiElements.out.user_managePreset_rename.classList.add('d-none');
                        this.managePreset.uiElements.in.user_managePreset_actionBtn.classList.add('d-none');

                        this.app.harmonicarium.components.backendUtils.parameters.dialogModal.value = {
                            // container,
                            // dialog,
                            // content,
                            // header,
                            hTitle: 'Rename Preset',
                            // hCancel: '',
                            body: this.managePreset.uiElements.out.user_managePreset_controls,
                            // footer,
                            fCancelTxt: 'Close',
                            // fCancel: '',
                            // fOK,
                            visible: true,
                            // reset
                        };
                    }
                }),
                'user_preset_deleteBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.managePreset.currentAction = 'delete';
                        // Update the selectioon
                        this.updatePresetsOnUI();
                        this.managePreset.uiElements.in.user_managePreset_select.classList.remove('is-invalid');
                        this.managePreset.uiElements.out.user_managePreset_rename.classList.add('d-none');
                        this.managePreset.uiElements.in.user_managePreset_actionBtn.classList.add('d-none');

                        this.app.harmonicarium.components.backendUtils.parameters.dialogModal.value = {
                            // container,
                            // dialog,
                            // content,
                            // header,
                            hTitle: 'Delete Preset',
                            // hCancel: '',
                            body: this.managePreset.uiElements.out.user_managePreset_controls,
                            // footer,
                            fCancelTxt: 'Close',
                            // fCancel: '',
                            // fOK,
                            visible: true,
                            // reset
                        };
                    }
                }),
                // MODAL DIALOG CONTROLS
                'user_managePreset_controls': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_toast': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_toastMsg': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_select': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                    uiSet: null,
                    eventListener: evt => {
                        evt.target.classList.remove('is-invalid');
                        let uiElements = this.managePreset.uiElements;
                        if (evt.target.value) {
                            uiElements.in.user_managePreset_actionBtn.classList.remove('d-none');
                            if (this.managePreset.currentAction === 'rename') {
                                uiElements.out.user_managePreset_rename.classList.remove('d-none');
                                this.app.presetServiceDB.getPreset(evt.target.value)
                                .then(preset => {
                                    uiElements.in.user_managePreset_newName.value = preset.description;
                                    uiElements.in.user_managePreset_newName.classList.remove('is-invalid');
                                })
                                .catch(error => {
                                    console.error('An error occuurred while trying to read a preset on the database: ', error);
                                });
                                uiElements.in.user_managePreset_actionBtn.innerText = 'Rename the preset';
                           
                            } else if (this.managePreset.currentAction === 'delete') {
                                uiElements.out.user_managePreset_rename.classList.add('d-none');
                                uiElements.in.user_managePreset_actionBtn.innerText = 'Delete the preset';
                            }

                        } else {
                            uiElements.in.user_managePreset_actionBtn.classList.add('d-none');
                        }
                    }
                }),
                'user_managePreset_SelectValidation': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_newNameValidation': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_rename': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_newName': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'typing',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    uiSet: null,
                    widget:'text',
                    eventListener: evt => {
                        let nameInput = this.managePreset.uiElements.in.user_managePreset_newName;
                        if (evt.target.value) {
                            nameInput.classList.remove('is-invalid');
                        } else {
                            let validationMsg = 'The name cannot be an empty string.';
                            this.managePreset.uiElements.out.user_managePreset_newNameValidation.innerText = validationMsg;
                            nameInput.classList.add('is-invalid');
                        }
                    }
                }),
                'user_managePreset_actionBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        let selection = this.managePreset.uiElements.in.user_managePreset_select,
                            presetID = selection.value;
                        if (presetID) {

                            // RENAME
                            if (this.managePreset.currentAction === 'rename') {
                                let nameInput = this.managePreset.uiElements.in.user_managePreset_newName,
                                    storedSessions;

                                // Read all sessions (and their current preset)
                                this.app.presetServiceDB.getAllSessions()
                                .then((sessions) => {
                                    storedSessions = sessions;
                                    if (nameInput.value) {
                                        return this.app.presetServiceDB.getAllPresets();
                                    } else {
                                        let validationMsg = 'The name cannot be an empty string.';
                                        this.managePreset.uiElements.out.user_managePreset_newNameValidation.innerText = validationMsg;
                                        nameInput.classList.add('is-invalid');
                                        return new Promise((resolve, reject)=>reject(validationMsg));
                                    }                                    
                                })
                                .then(presets => {
                                    let sameName = presets.find(preset => preset.description === nameInput.value);
                                    if (sameName) {
                                        let validationMsg = 'There is already a preset with the same name. Choose anothe name.';
                                        this.managePreset.uiElements.out.user_managePreset_newNameValidation.innerText = validationMsg;
                                        nameInput.classList.add('is-invalid');
                                        return new Promise((resolve, reject)=>reject(validationMsg));
                                    } else {
                                        // Current, default and autosave presets cannot be deleted
                                        let sessionIDs = storedSessions.map(s => s.sessionID); // === autosave presets
                                        if (['default', ...sessionIDs].includes(presetID)) {
                                            let validationMsg = 'You cannot rename the "Default" preset and the "Auto-save" preset of each session.';
                                            this.managePreset.uiElements.out.user_managePreset_SelectValidation.innerText = validationMsg;
                                            selection.classList.add('is-invalid');
                                            return new Promise((resolve, reject)=>reject(validationMsg));
                                        } else {
                                            nameInput.classList.remove('is-invalid');
                                            return this.app.presetServiceDB.updatePreset({
                                                presetID: presetID,
                                                description: nameInput.value,
                                            });
                                        }
                                    }
                                })
                                .then((result) => {
                                    console.log(`Preset ${presetID} successfully renamed.`);
                                    this.updatePresetsOnUI();
                                    // .then(() => { // avoid concurrent access? 
                                    this.app.harmonicarium.broadcastChannel.send('presetsChange');
                                    // })
                                    nameInput.value = '';

                                    // Show the toast
                                    let msg = `<p>Preset "<b>${result.oldDesc}</b>" has been renamed in "<b><i>${result.newDesc}</i></b>" (id: <small>${presetID}</small>).</p>`;
                                    this.managePreset.uiElements.out.user_managePreset_toastMsg.innerHTML = msg;
                                    this.managePreset.bsToast.show();
                                })
                                .catch(error => {
                                    console.error('An error was occurred when trying to rename the preset: ', error);
                                });

                            
                            // DELETE
                            } else if (this.managePreset.currentAction === 'delete') {
                                let deletingPreset = {};
                                // Read all sessions (and their current preset)
                                this.app.presetServiceDB.getAllSessions()
                                .then((sessions) => {
                                    // Current, default and autosave presets cannot be deleted
                                    let sessionIDs = sessions.map(s => s.sessionID), // === autosave presets
                                        // Get the used preset only for the concurrent sessions
                                        usedPresetIDs = sessions
                                            .filter(s => this.app.session.concurrentSessions.has(s.sessionID) || s.sessionID === this.app.session.id)
                                            .map(s => s.currentPreset);
                                    if (['default', ...sessionIDs, ...usedPresetIDs]
                                        .includes(presetID)) {
                                        let validationMsg = 'You cannot delete the "Default" preset, the "Auto-save" preset of each session and any preset loaded by this session and the concurrent ones.';
                                        this.managePreset.uiElements.out.user_managePreset_SelectValidation.innerText = validationMsg;
                                        selection.classList.add('is-invalid');
                                        return new Promise((resolve, reject)=>reject('You cannot delete the current, "Default" or "Auto-save" preset.'));
                                    } else {
                                        selection.classList.remove('is-invalid');
                                        return this.app.presetServiceDB.getPreset(presetID);
                                    }
                                })
                                .then((result) => {
                                    deletingPreset = result;
                                    return this.app.presetServiceDB.deletePresetParams(presetID);
                                })
                                .then(() => {
                                    console.log(`Preset ${presetID} successfully deleted.`);
                                    this.updatePresetsOnUI();
                                    // .then(() => { // avoid concurrent access? 
                                    this.app.harmonicarium.broadcastChannel.send('presetsChange');
                                    // })

                                    // Show the toast
                                    let msg = `<p>Preset "<b>${deletingPreset.description}</b>" (id: <small>${presetID}</small>) has been deleted.</p>`;
                                    this.managePreset.uiElements.out.user_managePreset_toastMsg.innerHTML = msg;
                                    this.managePreset.bsToast.show();
                                })
                                .catch(error => {
                                    console.error('An error was occurred when trying to delete the preset: ', error);
                                });

                            }
                        } else {
                            // error
                        }
                    }
                }),
            },
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.bsToast = new bootstrap.Toast(thisParam.uiElements.out.user_managePreset_toast, {
                    animation: true,
                    autohide: false,
                    // delay: 3000,
                });
            },
            customProperties: {
                currentAction: false
            }
        });

        this.newPreset = new HUM.Param({
            app:user,
            idbKey:'userNewPreset',
            uiElements:{
                'user_preset_new': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_newName': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'typing',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'text',
                }),
                'user_preset_saveBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.app.saveNewPreset(this.newPreset.value)
                        .then(() => {
                            this.newPreset.uiElements.in.user_preset_newName.classList.remove('is-invalid');
                        })
                        .catch(errMsg => {
                            if (errMsg === 'invalid') {
                                this.newPreset.uiElements.in.user_preset_newName.classList.add('is-invalid');
                            } else {
                                // ... needed other messages?
                            }
                        });
                    }
                }),
            },
            dataType:'string',
            initValue: this.app.DEFAULT_PRESET_NAME,
            // init:false, // true if at the first change, the first thing is to put this to "autosave"
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            // preSet: (value) => {
            //     if (!value) {
            //         value = '**ERROR**';
            //         this.newPreset.uiElements.in.user_preset_newName.classList.add('is-invalid');
            //     } else {
            //         this.newPreset.uiElements.in.user_preset_newName.classList.remove('is-invalid');
            //     }
            //     return value;
            // },
        });

        this.presetExport = new HUM.Param({
            app:user,
            idbKey:'userExportPreset',
            uiElements:{
                'user_preset_exportBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.app.exportPresets();
                    }
                }),
                'user_preset_exportBtnSpinner': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            // init:false,
        });

        this.presetImportReverb = new HUM.Param({
            app:user,
            idbKey:'userPresetImportReverb',
            uiElements:{
                'user_preset_importReverb': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'toggle',
                    eventType: 'click',
                    htmlTargetProp:'checked',
                    widget:'checkbox',
                }),
            },
            dataType:'boolean',
            initValue:true,
        });

        this.presetExportReverb = new HUM.Param({
            app:user,
            idbKey:'userPresetExportReverb',
            uiElements:{
                'user_preset_exportReverb': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'toggle',
                    eventType: 'click',
                    htmlTargetProp:'checked',
                    widget:'checkbox',

                }),
            },
            dataType:'boolean',
            initValue:true,
        });


        this.presetFile = new HUM.Param({
            app:user,
            idbKey:'userImportPreset',
            uiElements:{
                'user_preset_importFile': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'files',
                    widget:'file',
                    eventListener: evt => {
                        // Check for the various File API support.
                        if (window.File && window.FileReader && window.FileList && window.Blob) {
                            // Access to the file and send it to read function
                            this.presetFile.valueUI = evt.target.files[0];
                        } else {
                            alert('The File APIs are not fully supported in this browser.');
                        }
                    }
                }),
                'user_preset_import_options': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_importBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        if (this.presetFile.selectedPresets.size > 0) {
                            // this.presetFile.bsPopover.hide();
                            this.app.importPresets()
                            .then((results) => {
                                // Update the selectioon
                                this.updatePresetsOnUI();

                                // Show the toast
                                let msg = '';
                                for (let preset of results) {
                                    msg += `<p>Imported preset "<b>${preset.oldDesc}</b>" (id: <small>${preset.oldID}</small>) with the new name "<b><i>${preset.newDesc}</i></b>" (id: <small>${preset.newID}</small>).</p>`;
                                }
                                this.presetFile.uiElements.out.user_preset_import_toastMsg.innerHTML = msg;
                                this.presetFile.bsToast.show();
                            })
                            .catch(error => {
                                console.error('Import failed: ', error);
                            });
                        } else {
                            // error or invalid
                        }
                    }
                }),
                'user_preset_import_checks': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_clearBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.presetFile.value = false;
                    }
                }),
                'user_preset_import_toast': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_import_toastMsg': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            dataType:'file',
            initValue: false,
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.bsPopover = new bootstrap.Popover(thisParam.uiElements.in.user_preset_importBtn, {
                    title: 'Sorry',
                    content: 'You have to select at least one preset from the checkboxes above.',
                    trigger: 'hover focus',
                    placement: 'left',
                    customClass: 'hum-custom-popover'
                });
                thisParam.bsToast = new bootstrap.Toast(thisParam.uiElements.out.user_preset_import_toast, {
                    animation: true,
                    autohide: false,
                    // delay: 3000,
                });
            },
            postSet: (value, thisParam, init) => {
                let options = thisParam.uiElements.out.user_preset_import_options,
                    file = thisParam.uiElements.in.user_preset_importFile,
                    checkboxes = thisParam.uiElements.out.user_preset_import_checks;
                if (value) {
                    this.app.readPresetFile(value);
                    options.classList.remove('d-none');
                } else {
                    // Remove the checkbox and the import button
                    options.classList.add('d-none');
                    // Empty everything
                    file.value = '';
                    if (!init) {
                        this.presetFile.selectedPresets = new Set();
                        this.presetFile.importedPresets = {};
                    }
                    HUM.BackendUtils.emptyHTMLElement(checkboxes);
                }
            },
            customProperties: {
                selectedPresets: new Set(),
                importedPresets: {},
                importReverb: {},
            }
        });

        this.resetDB = new HUM.Param({
            app:user,
            idbKey:'userResetDB',
            uiElements:{
                'user_resetDB_openBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.app.harmonicarium.components.backendUtils.parameters.dialogModal.value = {
                            // container,
                            // dialog,
                            // content,
                            // header,
                            hTitle: 'Reset DB',
                            // hCancel: '',
                            body: this.resetDB.uiElements.out.user_resetDB_controls,
                            // footer,
                            fCancelTxt: 'Close',
                            // fCancel: '',
                            // fOKTxt: '',
                            // fOK,
                            visible: true,
                            // reset
                        };
                    }
                }),
                'user_resetDB_controls': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_resetDB_toast': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_resetDB_toastMsg': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_resetDB_confirmBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        if (window.confirm('Are you really, really sure?')) {
                            console.group(`Trying to delete the database "${this.app.dbName}"...`);
                            // let msgData = 'Another session is trying to delete the database.\n' +
                            //      'You must close this session to allow the database to be deleted.\n\n' +
                            //      'Click "OK" to close this tab/window or "Cancel" to postpone the deletion.\n\n' +
                            //      'The database will be deleted after all the sessions will be closed.';
                            
                            // Delete the DB
                            this.app.presetServiceDB._closeDB();
                            this.app.harmonicarium.broadcastChannel.unregisterCommand('releaseSession');
                            console.log('Send broadcast message to ask closing all the concurrent sessions.');
                            this.app.harmonicarium.broadcastChannel.send('closeApp'); // , msgData);
                            setTimeout(() => {
                                this.app.presetServiceDB._deleteDatabase(this.app.dbName)
                                .then(() => {
                                    console.groupEnd();
                                    console.log(`The database "${this.app.dbName}" has been deleted.`);
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.remove('bg-danger');
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.add('bg-success');
                                    this.resetDB.uiElements.out.user_resetDB_toastMsg.innerHTML = 'The database has been successfully deleted.';
                                    this.resetDB.bsToast.show();
                                    console.log('Reloading the app...');
                                    setTimeout(() => window.location.reload(), 1500);
                                    // setTimeout(() => window.close(), 1500);
                                    // @todo: show a spinner on splashscreen and a text
                                    //        saying "close all other concurrent sessions!"
                                })
                                .catch(error => {
                                    console.error(error);
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.remove('bg-success');
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.add('bg-danger');
                                    this.resetDB.uiElements.out.user_resetDB_toastMsg.innerHTML = 'An error occurred while trying to delete the database.';
                                    this.resetDB.bsToast.show();
                                });
                            }, 2000);

                        }
                    }
                }),
            },
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.bsToast = new bootstrap.Toast(thisParam.uiElements.out.user_resetDB_toast, {
                    animation: true,
                    autohide: false,
                    // delay: 3000,
                });
            },
        });


    }
    async updatePresetsOnUI() {
        if (this.app.presetServiceDB.available) {
            let results = await this.preset.app.presetServiceDB.getAllPresets(),
                htmlElems = [
                    this.preset.uiElements.in.user_preset_select,
                    this.managePreset.uiElements.in.user_managePreset_select,
                ];
            // Sort the presets alphabetically
            results.sort((a, b) => {
                let strA = a.description.toLowerCase();
                let strB = b.description.toLowerCase();
                return (strA < strB) ? -1 : (strA > strB) ? 1 : 0;
            });
            for (let htmlElem of htmlElems) {
                // Delete pre-existing options
                while (htmlElem.firstChild) {
                    htmlElem.removeChild(htmlElem.firstChild);
                }

                // Create the placeholder hidden option
                let option = document.createElement("option");
                option.text = 'Choose a preset';
                option.disabled = true;
                option.selected = true;
                option.hidden = true;
                htmlElem.add(option);

                // Create one option for each stored preset
                for (const preset of results) {
                    let option = document.createElement("option");
                    option.value = preset.presetID;
                    option.text = preset.description;
                    if (preset.presetID === this.preset.value) {
                        option.text += ' (*)';  
                    }
                    htmlElem.add(option);
                }
                // @todo: better a standard callback provided by parameter
                // this.parameters.preset._objValueModified();
            }
            // Reselect the current preset only on the main preset selector
            if (this.preset.value) {
                this.preset.uiElements.in.user_preset_select.value = this.preset.value;
                this.preset.uiElements.in.user_preset_loadBtn.classList.add('d-none');
            }
        } else {
            alert('IndexedDB service not available!');
        }
    }
    async _init() {
        console.group('USER APP - Initializing Presets management parameters...');
        this.sessionDisplayConcurrent._init();
        await this.preset._initAsync();
        this.newPreset._init();
        console.groupEnd();
        console.log('USER APP - Presets management parameters initialized.');

    }
};

// paramMapLive, paramMapFile:
// 
//         // harmonicarium1_mainDev = {
//         //     'default': {
//         //         harmonicarium: {},
//         //         dpPad: {
//         //             dpPad: {},
//         //             padSet: {
//         //                 0: {}
//         //                 1: {}
//         //                 2: {}
//         //                 // ...
//         //             }
//         //         },
//         //         dhc: {
//         //             0: {
//         //                 dhc: {},
//         //                 hstack: {},
//         //                 synth: {},
//         //                 midi: {},
//         //                 hancock: {},
//         //             }
//         //             1: {}
//         //             2: {}
//         //             // ...
//         //         }
//         //         backendUtils: {},
//         //         pwaManager: {},
//         //     },
//         // }
