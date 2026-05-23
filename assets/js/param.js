/**
 * @fileoverview Parameter management system for Harmonicarium components.
 * This file defines the {@link HUM.Param} class for creating reactive parameters
 * with database persistence and UI binding. The sub-components are defined in
 * the companion file:
 * - {@link module:param-uielem} — `HUM.Param.UIelem` class
 *
 * @module param
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

/* globals HUM */

"use strict";

/**
 * Parameter management class for creating reactive parameters with UI binding and database persistence.
 * 
 * @class
 * @memberof HUM
 * 
 * @description
 * The `HUM.Param` class provides a comprehensive parameter management system that:
 * - Binds JavaScript values to HTML UI elements with automatic synchronization
 * - Manages parameter persistence in IndexedDB for preset save/load functionality
 * - Provides validation and type checking for parameter values
 * - Supports custom getter/setter functions and lifecycle hooks
 * - Handles parameter restoration during application initialization
 * - Enables automatic save functionality for user preferences
 *
 * The {@link HUM.Param.UIelem|UIelem} companion class is defined in the
 * companion {@link module:param-uielem} file and attached to `HUM.Param`
 * at load time.
 * 
 * @example
 * // Basic parameter with UI binding
 * const volumeParam = new HUM.Param({
 *     app: this,
 *     idbKey: 'masterVolume',
 *     dataType: 'float',
 *     initValue: 0.8,
 *     uiElements: {
 *         'volumeSlider': new HUM.Param.UIelem({
 *             role: 'in',
 *             type: 'range'
 *         })
 *     }
 * });
 * 
 * @example
 * // Parameter with custom validation
 * const noteParam = new HUM.Param({
 *     app: this,
 *     idbKey: 'currentNote',
 *     dataType: 'string',
 *     allowedValues: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
 *     postSet: (newValue) => {
 *         console.log(`Note changed to: ${newValue}`);
 *     }
 * });
 */
HUM.Param = class {
    /**
     * Creates a new parameter instance with UI binding and database persistence capabilities.
     * 
     * @param {Object} config - Configuration object for the parameter.
     * @param {Object} config.app - The component (app) that uses this param.
     * @param {boolean} [config.presetStore=true] - If the Param instance must be stored in a Preset on the DB (presetRestore can be false for "un-restorable" parameters).
     * @param {boolean} [config.presetAutosave=true] - If the Param instance must be stored using the "autosave" feature (presetStore must be true).
     * @param {boolean} [config.presetRestore=true] - If the Param instance must be restored from a Preset on the DB (presetStore can be false for "un-storable" parameters).
     * @param {string} [config.presetGetValue='value'] - 'value', '_value' or any other customProperties // The property to be read as "the value". This value will be stored in the "value" property.
     * @param {string} [config.presetSetValue='value'] - 'value', '_value' or any other customProperties // The property to be set as "the value". This value will be set in the "value" property.
     * @param {boolean} [config.presetSetValueInit=true] - 
     * @param {string} config.idbKey - The keyPath for IndexedDB.
     * @param {Object} [config.uiElements] - The definitions of html elements related to this Param.
     * @param {string} [config.dataType] - The type of data (js primitives or generic "object": 'integer'|'float'|'boolean'|'string'|'object')
     * @param {string} [config.role] - Parameter role ('int'|'fn') - if 'int', the uiElements won't be registered.
     * @param {Array} [config.allowedValues] - Optional array of allowed values (it depends o the dataType, currently works only with strings)
     * @param {*} [config.initValue] - The init value that will be set as "value" during the Param's "init" process.
     * @param {boolean} [config.init=true] - If the Param must be initialized (if false, the Param should be init later calling its _init() method)
     * @param {boolean} [config.initAsync=false] - If "init" is true, this argument tell if the Param must be initialized using an async function (needed if preInit or postInit are async functions).
     * @param {Function} [config.preInit] - Function to be executed just before the Param is initialized.
     * @param {Function} [config.postInit] - Function to be executed just after the Param has been initialized.
     * @param {Function} [config.preSet] - Function to be executed just before the Param'value is set.
     * @param {Function} [config.postSet] - Function to be executed just after the Param'value has been set.
     * @param {Object} [config.customSetGet={}] - Custom setter and getter functions.
     * @param {Object} [config.customProperties={}] - Custom properties to assign to the Param that must be stored in the Preset (on the DB).
     * @param {Function} [config.customPropertiesStore] - Custom function to manipulate the customProperties before storing them into the DB.
     * @param {Function} [config.customPropertiesRestore] - Custom function to manipulate the customProperties before restoring them into the "live" Param instance.
     * @param {string} [config.restoreStage='mid'] - When to restore parameter ('pre'|'mid'|'post')
     * @param {number} [config.restoreSequence=64] - Restoration sequence order (0-127, use ingeger first)
     * @param {Function} [config.preRestore] - Function to be executed just before the Param'value is restored.
     * @param {Function} [config.postRestore] - Function to be executed just after the Param'value has been restored.
     * 
     * @description
     * The constructor sets up a parameter with comprehensive configuration options:
     * 
     * **Database Persistence**: Parameters can be automatically saved to and restored from
     * IndexedDB using preset functionality. The presetStore, presetAutosave, and presetRestore
     * options control this behavior.
     * 
     * **UI Binding**: Parameters can be bound to HTML elements for automatic synchronization
     * between JavaScript values and DOM state. UI elements are registered and managed automatically.
     * 
     * **Lifecycle Hooks**: Various hooks (preInit, postInit, preSet, postSet, preRestore, postRestore)
     * allow custom logic to be executed during parameter operations.
     * 
     * **Custom Properties**: Additional properties can be attached to parameters and persisted
     * in the database along with the main value.
     * 
     * @todo Implement automatic parameter lookup in IndexedDB during construction
     */
    constructor(
        {
            app,
            presetStore=true,
            presetAutosave=true,
            presetRestore=true,
            presetGetValue='value',
            presetSetValue='value',
            presetSetValueInit=true,
            idbKey,
            uiElements,
            dataType,
            role,
            allowedValues,
            initValue,
            init=true,
            initAsync=false,
            preInit,
            postInit,
            preSet,
            postSet,
            customSetGet={},
            customProperties={},
            customPropertiesStore,
            customPropertiesRestore,
            restoreStage='mid',
            restoreSequence=64,
            preRestore,
            postRestore,
        }={}
    ){
        // @todo: cerca in indexedDB se c'è questo parametro nel preset "autosave",
        //        se lo trova lo crea da quel dizionario,
        //        altrimenti lo prende da quello che arriva hardcoded dal codice della app.
        //        In caso di indexedDB, l'initValue è il _value registrato al momento del dump.
        
        /**
         * Reference to the parent application/component that owns this parameter.
         * @type {Object}
         */
    	this.app = app;
    	
        /**
         * Reference to the main Harmonicarium instance for global operations.
         * Automatically resolved from app hierarchy (app.harmonicarium or app.dhc.harmonicarium).
         * @type {HUM}
         */
        this.harmonicarium = app.harmonicarium ? app.harmonicarium : app.dhc ? app.dhc.harmonicarium : app;
        
        /**
         * IndexedDB key identifier for this parameter.
         * @type {string}
         */
    	this.idbKey = idbKey;
    	
        /**
         * Complete IndexedDB key path including app ID for uniqueness.
         * Format: "{idbKey}_{app.id}"
         * @type {string}
         */
        this.idbKeyPath = idbKey+'_'+app.id;
        
        /**
         * Whether this parameter should be stored in database presets.
         * @type {boolean}
         * @private
         */
        this._presetStore = presetStore;
        
        /**
         * Whether this parameter should use autosave functionality.
         * Only evaluated if _presetStore is true.
         * @type {boolean}
         * @private
         */
        this._presetAutosave = presetAutosave;
        
        /**
         * Whether this parameter should be restored from database presets.
         * Only evaluated if _presetStore is true.
         * @type {boolean}
         * @private
         */
        this._presetRestore = presetRestore;
        
        /**
         * Property name to read as "the value" for database operations.
         * @type {string}
         * @private
         */
        this._presetGetValue = presetGetValue;
        
        /**
         * Property name to set as "the value" for database operations.
         * @type {string}
         * @private
         */
        this._presetSetValue = presetSetValue;
        
        /**
         * Whether to set initial value during preset operations.
         * @type {boolean}
         * @private
         */
        this._presetSetValueInit = presetSetValueInit;
        
        /**
         * Custom function to manipulate customProperties before database storage.
         * @type {Function|undefined}
         * @private
         */
        this._customPropertiesStore = customPropertiesStore;
        
        /**
         * Custom function to manipulate customProperties before restoration.
         * @type {Function|undefined}
         * @private
         */
        this._customPropertiesRestore = customPropertiesRestore;
        
        /**
         * Stage when this parameter should be restored ('pre'|'mid'|'post').
         * @type {string}
         * @private
         */
        this._restoreStage = restoreStage;
        
        /**
         * Sequence order for parameter restoration (0-127, integers preferred).
         * @type {number}
         * @private
         */
        this._restoreSequence = restoreSequence;
        
        /**
         * Function executed before parameter value restoration.
         * @type {Function|undefined}
         * @private
         */
        this._preRestore = preRestore;
        
        /**
         * Function executed after parameter value restoration.
         * @type {Function|undefined}
         * @private
         */
        this._postRestore = postRestore;
        
        /**
         * Data type validation for this parameter ('integer'|'float'|'boolean'|'string'|'object').
         * @type {string}
         */
        this.dataType = dataType;
        
        /**
         * Parameter role ('int'|'fn'). If 'int', UI elements won't be registered.
         * @type {string}
         */
    	this.role = role;
    	
        /**
         * Internal storage for the parameter value.
         * @type {*}
         * @private
         */
        this._value = null;
        
        // Set up custom getter/setter properties for value access
        let setGet = {
            /**
             * Main value property with automatic validation and UI synchronization.
             * @type {*}
             */
            value: {
                set: this._setValue,
                get: this._getValue,
            },
            /**
             * UI-specific value property to prevent UI feedback loops.
             * @type {*}
             */
            valueUI: {
                set: this._setUI2Value, // Set the Param's value from UI. Meant to be used in uiElement's EventListeners to avoid loops UI->value->UI->value...
                get: this._getValue2UI, // Get the Param's value for using on the UI. Meant to be used in uiElement's uiSet() (instead of postSet()) if the value displayed on the UI must be different from the _value.
            }
        };
        
        // Merge with any custom getter/setter functions
        Object.assign(setGet, customSetGet);
        Object.defineProperties(this, setGet);
        
        // Assign custom properties that will be persisted with presets
        Object.assign(this, customProperties);
        
        /**
         * Backup of the original custom properties configuration.
         * @type {Object}
         * @private
         */
        this._customProperties = customProperties;
        
        /**
         * Initial value to set during parameter initialization.
         * @type {*}
         */
        this.initValue = initValue;
        
        /**
         * Array of allowed values for validation (works with string dataType).
         * @type {Array|undefined}
         * @private
         */
        this._allowedValues = allowedValues;
        
        /**
         * Function executed before parameter initialization.
         * @type {Function|undefined}
         * @private
         */
        this._preInit = preInit;
        
        /**
         * Function executed after parameter initialization.
         * @type {Function|undefined}
         * @private
         */
        this._postInit = postInit;
        
        /**
         * Function executed before parameter value is set.
         * @type {Function|undefined}
         */
        this.preSet = preSet;
        
        /**
         * Function executed after parameter value is set.
         * @type {Function|undefined}
         */
        this.postSet = postSet;
        
        /**
         * Raw UI elements configuration before registration.
         * @type {Object|undefined}
         * @private
         */
        this._uiElements = uiElements;
        
        /**
         * Timestamp of the last autosave operation for this parameter.
         * @type {number|null}
         */
        this.last_autosave = null;
        // Object.assign(this._uiElements, uiElements);

        // Register UI elements if this parameter has a functional role
        if (role !== 'int') {
            if (uiElements) {
                /**
                 * Registered and processed UI elements for this parameter.
                 * Only available if role !== 'int' and uiElements were provided.
                 * @type {Object}
                 */
                this.uiElements = this._registerUiElements(uiElements);
            }
        }

        // Register this parameter in global parameter tracking first,
        // so postInit hooks can safely look it up in the registry.
        this._compileParamList();
        this._compileParamMap();

        // Initialize the parameter if requested
        if (init && !initAsync) {
            this._init();
        } else if (init && initAsync) {
            this._initAsync();
        }

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Compiles and registers this parameter in the global parameter tracking system.
     * 
     * @param {string} [mode='parameterObject'] - Mode for compilation ('parameterObject'|'parameterValue')
     * @private
     * 
     * @description
     * This method registers the parameter in the harmonicarium's parameter tracking systems:
     * - paramListLive: Global list of all live parameters
     * - paramListLivebyStage: Parameters organized by restoration stage and sequence
     * 
     * The registration enables:
     * - Parameter restoration during application startup
     * - Preset save/load functionality
     * - Parameter debugging and introspection
     * - Autosave operations
     */
    _compileParamList(mode='parameterObject') {
        let harmonicarium = this.harmonicarium,
            name = this.app.name,
            id = this.app.id,
            idbKey = this.idbKey,
            idbKeyPath = this.idbKeyPath,
            store = harmonicarium.components.user.paramListLive,
            storeByStage = harmonicarium.components.user.paramListLivebyStage,
            value;

        if (mode === 'parameterObject') {
            value = this;
        } else if (mode === 'parameterValue') {
            // @todo: check somewhere if there is another place where to read the value
            value = this.value;
        }

        if (store[idbKeyPath] && mode === 'parameterObject') {
            this._errorIdbKeyUniq(idbKey, name, id);
        } else {
            store[idbKeyPath] = value;
            if (!storeByStage[this._restoreStage][this._restoreSequence]) {
                storeByStage[this._restoreStage][this._restoreSequence] = {};
            }
            storeByStage[this._restoreStage][this._restoreSequence][idbKeyPath] = value;
        }
    }
    
    /**
     * Compiles and registers this parameter in the component-based parameter mapping system.
     * 
     * @param {string} [mode='parameterObject'] - Mode for compilation ('parameterObject'|'parameterValue')
     * @private
     * 
     * @description
     * This method organizes parameters by component hierarchy for easier access:
     * - Allows parameter lookup by component name and ID
     * - Enables component-specific parameter operations
     * - Facilitates debugging and development tools
     * 
     * The resulting structure allows access like:
     * `harmonicarium.components.user.paramMapLive[componentName][componentId][paramKey]`
     */
    _compileParamMap(mode='parameterObject') {
        let harmonicarium = this.harmonicarium,
            // humID = this.harmonicarium.id,
            name = this.app.name,
            id = this.app.id,
            idx = this.app._id,
            idbKey = this.idbKey,
            store = harmonicarium.components.user.paramMapLive,
            value;

        if (mode === 'parameterObject') {
            value = this;
        } else if (mode === 'parameterValue') {
            // @todo: check somewhere if there is another place where to read the value
            value = this.value;
        }

        if (['harmonicarium', 'backendUtils', 'pwaManager', 'user'].includes(name)) {
            if (!store[name]) {
                store[name] = {};
            }
            if (store[name][idbKey] && mode === 'parameterObject') {
                this._errorIdbKeyUniq(idbKey, name, id);
            } else {
                store[name][idbKey] = value;
            }
        } else if (['dpPad', 'padSet'].includes(name)) {
            if (!store.dpPad) {
                store.dpPad = {};
            }
            if (!store.dpPad[name]) {
                store.dpPad[name] = {};
            }
            if (name === 'dpPad') {
                if (store.dpPad[name][idbKey] && mode === 'parameterObject') {
                    this._errorIdbKeyUniq(idbKey, name, id);
                } else {
                    store.dpPad[name][idbKey] = value;
                }
            } else if (name === 'padSet') {
                if (!store.dpPad[name][idx]) {
                    store.dpPad[name][idx] = {};
                }
                if (store.dpPad[name][idx][idbKey] && mode === 'parameterObject') {
                    this._errorIdbKeyUniq(idbKey, name, id);
                } else {
                    store.dpPad[name][idx][idbKey] = value;
                }
            }
        } else if (['dhc', 'hstack', 'synth', 'hancock'].includes(name)) {
            if (!store.dhc) {
                store.dhc = {};
            }
            if (!store.dhc[idx]) {
                store.dhc[idx] = {};
            }
            if (!store.dhc[idx][name]) {
                store.dhc[idx][name] = {};
            }
            if (store.dhc[idx][name][idbKey] && mode === 'parameterObject') {
                this._errorIdbKeyUniq(idbKey, name, id);
            } else {
                store.dhc[idx][name][idbKey] = value;
            }
        } else if (['midiPorts', 'midiIn', 'midiOut', 'midiPlayer'].includes(name)) {
            if (!store.dhc) {
                store.dhc = {};
            }
            if (!store.dhc[idx]) {
                store.dhc[idx] = {};
            }
            if (!store.dhc[idx].midi) {
                store.dhc[idx].midi = {};
            }
            if (!store.dhc[idx].midi[name]) {
                store.dhc[idx].midi[name] = {};
            }
            if (store.dhc[idx].midi[name][idbKey] && mode === 'parameterObject') {
                this._errorIdbKeyUniq(idbKey, name, id);
            } else {
                store.dhc[idx].midi[name][idbKey] = value;
            }
        }
    }

    /**
     * Handles IndexedDB key uniqueness validation errors.
     * 
     * @param {string} idbKey - The conflicting IndexedDB key
     * @param {string} appName - Name of the component
     * @param {string} appID - ID of the component
     * @private
     * @throws {Error} Always throws an error describing the key conflict
     * 
     * @description
     * This method is called when a parameter attempts to register with an
     * IndexedDB key that's already in use by another parameter in the same
     * component context. This ensures parameter uniqueness and prevents
     * database conflicts.
     */
    _errorIdbKeyUniq(idbKey, appName, appID) {
        let msg = `The idbKey "${idbKey}" is already defined for the component "${appName}" with ID "${appID}". Use a different key for the parameter.`;
        alert(msg);
        throw new Error(msg);
    }

    
    /**
     * Initializes the parameter with its initial value and lifecycle hooks.
     * 
     * @description
     * This method performs the synchronous initialization sequence:
     * 1. Executes preInit hook if defined
     * 2. Sets the parameter to its initial value
     * 3. Executes postInit hook if defined
     * 
     * The initialization process triggers value validation, UI updates,
     * and any custom logic defined in the lifecycle hooks.
     * 
     * @example
     * // Manual initialization of a parameter
     * const param = new HUM.Param({
     *     app: this,
     *     idbKey: 'myParam',
     *     init: false  // Prevent automatic initialization
     * });
     * // Later...
     * param._init();
     * 
     * @todo Add context parameter for better lifecycle hook support
     */
    _init() {
        if (this._preInit) {
            this._preInit(this);
        }

        this._setValue(this.initValue, { init: true });
        
        if (this._postInit) {
            this._postInit(this);
        }
    }
    
    /**
     * Initializes the parameter asynchronously with its initial value and lifecycle hooks.
     * 
     * @async
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     * 
     * @description
     * This method performs the asynchronous initialization sequence:
     * 1. Awaits preInit hook if defined
     * 2. Sets the parameter to its initial value
     * 3. Awaits postInit hook if defined
     * 
     * Use this method when preInit or postInit hooks contain asynchronous operations
     * that need to complete before the parameter is considered fully initialized.
     * 
     * @todo Add context parameter for better lifecycle hook support
     */
    async _initAsync() {
        if (this._preInit) {
            await this._preInit(this);
        }

        this._setValue(this.initValue, { init: true });
        
        if (this._postInit) {
            await this._postInit(this);
        }
    }

    /**
     * Sets the parameter value from UI elements to prevent feedback loops.
     * 
     * @param {*} value - The new value from the UI
     * 
     * @description
     * This method is specifically designed to be used in UI element event listeners
     * to set parameter values without triggering UI updates that would create
     * infinite feedback loops (UI -> value -> UI -> value...).
     */
    _setUI2Value(value) {
        this._setValue(value, { fromUI: true });
    }
    
    /**
     * Core method for setting parameter values with comprehensive validation and lifecycle support.
     * 
     * @param {*}       value                   - The new value to set.
     * @param {Object}  [ctx={}]                - Context object controlling set behaviour.
     * @param {boolean} [ctx.init=false]        - Whether this is being called during initialization.
     * @param {boolean} [ctx.fromUI=false]      - Whether the value comes from a UI element.
     * @param {boolean} [ctx.preSet=true]       - Whether to execute the preSet hook.
     * @param {boolean} [ctx.postSet=true]      - Whether to execute the postSet hook.
     * @param {boolean} [ctx.fromRestore=false] - Whether this is being called during preset restoration.
     * @param {boolean} [ctx.fromQueue=false]   - Whether this is being called from a queued operation.
     * 
     * @description
     * This is the central value-setting method that:
     * 1. Performs data type conversion and validation
     * 2. Executes preSet lifecycle hook if enabled
     * 3. Validates against allowed values if defined
     * 4. Updates the internal value storage
     * 5. Synchronizes with UI elements if not from UI
     * 6. Executes postSet lifecycle hook if enabled
     * 7. Notifies the autosave system via harmonicarium._onParamChange
     * 
     * The method handles various scenarios including initialization, UI updates,
     * preset restoration, and queued operations with appropriate behavior for each.
     * 
     * @example
     * // Direct value setting
     * param._setValue(42);
     * 
     * @example
     * // Value setting during initialization without triggering hooks
     * param._setValue(initialValue, { init: true, preSet: false, postSet: false });
     */
    _setValue(value, { init=false, fromUI=false, preSet=true, postSet=true, fromRestore=false, fromQueue=false }={}) {
        let oldValue;
        if (this.dataType === 'object') {
            oldValue = JSON.parse(JSON.stringify(this.value));
        }  else {
            oldValue = this.value;
        }
        if (['integer', 'float'].includes(this.dataType)) {
            value = Number(value);
        }

        if (preSet && this.preSet) {
            value = this.preSet.bind(this.app)(value, this, init, fromUI, oldValue, fromRestore); // @todo: pass a context!
            if (value === '**ERROR**') {
                console.info(`The _preSet() function of the parameter ${this.idbKey} has discarded the input value.`);
                return;
            }
        }

        if (this._allowedValues) {
            if (this.dataType === 'string') {
                if (!this._allowedValues.includes(value)) {
                    console.trace();
                    alert(`The value "${value}" is not allowed for the parameter ${this.idbKey}.`);
                }
            }
        }

        this._value = value;

        if (!fromUI) {
            if (this.uiElements) {
                let entrties_array = []; 
                if (this.uiElements.in) {
                    entrties_array.push(...Object.entries(this.uiElements.in));
                }
                if (this.uiElements.fn) {
                    entrties_array.push(...Object.entries(this.uiElements.fn));
                }
                if (this.uiElements.out) {
                    entrties_array.push(...Object.entries(this.uiElements.out)
                        .filter(ent => 
                            ['innerText', 'innerHTML'].includes(this._uiElements[ent[0]].htmlTargetProp)
                        )
                    );
                }

                for (const [uiName, elem] of entrties_array) {
                    if (this._uiElements[uiName].uiSet === null) {
                        // do nothing
                        // (put uiSet=null to force bypass the UI update for some reason)
                    } else if (this._uiElements[uiName].uiSet) {
                        // @todo: value is unuseful since this._value has been set (we are in postSet)
                        this._uiElements[uiName].uiSet.bind(this.app)(value, this, init); // @todo: pass a context!
                    } else { // default uiSet, only if htmlTargetProp is set
                        if (this._uiElements[uiName].htmlTargetProp) {
                            if (!['button', 'file'].includes(this._uiElements[uiName].widget)) {
                                elem[this._uiElements[uiName].htmlTargetProp] = value;
                            }
                        }
                    }
                }
            }
        }
        if (postSet && this.postSet) {
            this.postSet.bind(this.app)(value, this, init, fromUI, oldValue, fromRestore); // @todo: pass a context!
        }

        // Notify the autosave system about this parameter change.
        // The handler is registered by HUM.User._init() and lives in user.js.
        if (this.harmonicarium._onParamChange) {
            this.harmonicarium._onParamChange(this, init, fromRestore);
        }

    }
    
    /**
     * Gets the current parameter value.
     * 
     * @returns {*} The current parameter value
     * 
     * @description
     * This is the getter method for the parameter's value property.
     * It simply returns the internal _value storage without any processing.
     * This method is used by the value property getter defined in the constructor.
     */
    _getValue() {
        return this._value;
    }
    
    /**
     * Gets the parameter value formatted for UI display.
     * 
     * @returns {*} The parameter value formatted for UI elements
     * 
     * @description
     * This method is intended to return the parameter value in a format
     * suitable for UI display. It can be overridden to provide custom
     * formatting logic when the displayed value needs to differ from
     * the internal value.
     * 
     * Returns {@link HUM.Param#_value|_value} by default. Override via `customSetGet`
     * to format the value differently for UI display.
     * 
     * @example
     * // Custom implementation for percentage display
     * param._getValue2UI = function() {
     *     return Math.round(this._value * 100) + '%';
     * };
     */
    _getValue2UI() {
        return this._value;
    }

    /**
     * Triggers value modification handling for object-type parameters.
     * 
     * @description
     * This method is used to signal that an object-type parameter value
     * has been modified externally (e.g., by direct property manipulation).
     * It forces re-evaluation of the value by reassigning it to itself,
     * which triggers the setter logic including validation, UI updates,
     * and lifecycle hooks.
     * 
     * This is particularly useful for object parameters where internal
     * properties may be modified without going through the normal
     * setter mechanism.
     * 
     * @example
     * // Modify object property directly
     * param.value.someProperty = newValue;
     * // Signal that the object has been modified
     * param._objValueModified();
     */
    _objValueModified() {
        this.value = this.value;
    }

    /**
     * Gets the application ID for this parameter's owner.
     * 
     * @returns {string|number} The application ID
     * @private
     * 
     * @description
     * This method resolves the ID of the application/component that owns
     * this parameter by checking various possible locations in the
     * application hierarchy:
     * 1. Direct app.id (including 0)
     * 2. app.dhc.id (for DHC components)
     * 3. app.harmonicarium.id (fallback to main instance)
     * 
     * The ID is used for generating unique HTML element IDs and
     * ensuring parameter uniqueness across multiple instances.
     */
    _getAppID() {
        return this.app.id || this.app.id===0 ? this.app.id : this.app.dhc ? this.app.dhc.id : this.app.harmonicarium.id;
    }
    
    /**
     * Registers and configures UI elements for this parameter.
     * 
     * @param {Object} uiElements - UI elements configuration object
     * @returns {Object} Processed UI elements organized by role
     * @private
     * 
     * @description
     * This method processes the raw UI elements configuration and:
     * 1. Validates UI element roles ('in', 'fn', 'out')
     * 2. Generates unique HTML IDs if not provided
     * 3. Finds and stores references to DOM elements
     * 4. Sets up appropriate event listeners for each element
     * 5. Configures automatic parameter-UI synchronization
     * 6. Returns organized UI elements grouped by role
     * 
     * **UI Element Roles:**
     * - `in`: Input elements that can change the parameter value
     * - `fn`: Functional elements that trigger parameter operations
     * - `out`: Output elements that display the parameter value
     * 
     * **Automatic Event Listeners:**
     * - For input elements: Automatically updates parameter value
     * - For numeric elements: Converts values to numbers
     * - For custom elements: Uses provided event listeners
     * 
     * **HTML ID Generation:**
     * Format: `HTML{role_first_letter}_{elementName}{appId}`
     * Example: `HTMLi_volumeSlider1-0` for input element
     */
    _registerUiElements(uiElements) {
        let res = {};
        if (uiElements) {
            for (const [uiName, props] of Object.entries(uiElements)) {
                if (!['in', 'fn', 'out', 'prompt'].includes(props.role)) {
                    alert(`The "role" key is missing for the uiElement "${uiName}" during the parameter definition.`);
                } else if (!(props.role in res)) {
                    res[props.role] = {};
                }

                if (props.namespace) {
                    res[props.role][uiName] = {};
                } else {
                    props.htmlID = props.htmlID || `HTML${props.role[0]}_${uiName}${this._getAppID()}`;
                    res[props.role][uiName] = document.getElementById(props.htmlID);
                    if (res[props.role][uiName] === null) {
                        let msg = `HUM.Param (idbKey: "${this.idbKey}"): DOM element not found: id="${props.htmlID}" (uiElement "${uiName}").`;
                        console.error(msg);
                        throw new Error(msg);
                    }

                    let eventListeners = [];

                    let mainEventListener = false;
                    if (props.eventListener) {
                        mainEventListener = props.eventListener;
                        // mainEventListener = evt => {
                        //     props.eventListener.bind(this.app)(evt, this);  // @todo: pass a context!
                        // };
                    } else {
                        if (['in', 'fn'].includes(props.role)) {
                            // If the HTML target property is set
                            if (props.htmlTargetProp) {
                                // Standard Param target
                                if (props.paramTargetProp === 'value') {
                                    mainEventListener = evt => {
                                        this.valueUI = evt.target[props.htmlTargetProp];
                                    };
                                // Custom param target (should be used in conjunction with some uiElement's customSetGet)
                                } else if (props.paramTargetProp) {
                                    if (['number', 'range'].includes(props.widget)) {
                                        mainEventListener = evt => {
                                            this[props.paramTargetProp] = Number(evt.target[props.htmlTargetProp]);
                                        };
                                    } else {
                                        mainEventListener = evt => {
                                            this[props.paramTargetProp] = evt.target[props.htmlTargetProp];
                                        };
                                    }
                                }
                            }
                        }
                    }
                    if (mainEventListener) {
                        eventListeners.push([props.eventType, mainEventListener]);
                        // res[props.role][uiName].addEventListener(props.eventType, mainEventListener);
                    }

                    if (props.eventListeners) {
                        for (let evtLstnr1 of Object.values(props.eventListeners)) {
                            eventListeners.push([evtLstnr1.eventType, evtLstnr1.function]);
                        }
                    }
                    if (eventListeners.length > 0) {
                        for (let evtLstnr2 of eventListeners) {
                            res[props.role][uiName].addEventListener(...evtLstnr2);
                        }
                    }
                }
            }
        }
        return res;
    }
};
