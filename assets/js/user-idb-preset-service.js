/**
 * @fileoverview IndexedDB Preset Service for the Harmonicarium user management system.
 * This file defines the {@link HUM.User.IDBPresetService} class, which provides
 * all IndexedDB database operations for storing and retrieving user presets,
 * parameters, and session data. It is split out from the main
 * {@link module:user} module.
 *
 * @module user-idb-preset-service
 * @memberof HUM.User
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
 * IndexedDB Preset Service for managing user presets and sessions.
 *
 * @class
 * @memberof HUM.User
 *
 * @description
 * The `HUM.User.IDBPresetService` class provides IndexedDB database operations
 * for storing and retrieving user presets, parameters, and session data. It
 * defines the database schema, handles version upgrades, and offers CRUD
 * operations with proper transaction management and error handling for
 * persistent user settings.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API|IndexedDB API}
 */
HUM.User.IDBPresetService = class {
    /**
     * Creates a new IDBPresetService instance bound to the given User.
     *
     * @param {HUM.User} user - The parent User instance that owns this service.
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
