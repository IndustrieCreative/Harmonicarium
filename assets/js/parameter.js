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

/* globals HUM */

"use strict";

/* The above code is defining a JavaScript class called "Param" with various properties and methods.
The class is used to create instances of parameters that can be used in an application. The
parameters can be stored in a preset on a database, have UI elements associated with them, have a
specific data type, and have various initialization and manipulation functions. The class provides
flexibility and customization options for creating and managing parameters in an application. */
HUM.Param = class {
    constructor(
        {
            app, // object - The component (app) that uses this param
            presetStore=true, // boolean - If the Param instance must be stored in a Preset on the DB (presetRestore can be false for "un-restorable" parameters).
            presetAutosave=true, // boolean - If the Param instance must be stored using the "autosave" feature (presetStore must be true).
            presetRestore=true, // boolean - If the Param instance must be restored from a Preset on the DB (presetStore can be false for "un-storable" parameters).
            presetGetValue='value', // string - 'value', '_value' or any other customProperties // The property to be read as "the value". This value will be stored in the "value" property.
            presetSetValue='value', // string - 'value', '_value' or any other customProperties // The property to be set as "the value". This value will be set in the "value" property.
            presetSetValueInit=true, // 
            idbKey, // string - The keyPath for IndexedDB
            uiElements, // object - The definitions of html elements related to this param
            dataType, // string - The type of data (js primitives or generic "object")
            role, // string - int | fn // If 'int' the uiElements won't be registered
            allowedValues, // array - Optional array of allowed values (it depends o the dataType, currently works only with strings)
            initValue, // any - The init value that will be set as "value" during the Param's "init" process.
            init=true, // boolean - If the Param must be initialized (if false, the Param should be init later calling its _init() method)
            initAsync=false, // boolean - If "init" is true, this argument tell if the Param must be initialized using an async function (needed if preInit or postInit are async functions).
            preInit, // function - Function to be executed just before the Param is initialized.
            postInit, // function - Function to be executed just after the Param has been initialized.
            preSet, // function - Function to be executed just before the Param'value is set.
            postSet, // function - Function to be executed just after the Param'value has been set.
            customSetGet={}, // object - Custom setter and getter funtions.
            customProperties={}, // object - Custom properties to assign to the Param that must be stored in the Preset (on the DB).
            customPropertiesStore, // function - Custom function to manipulate the customProperties before storing them into the DB.
            customPropertiesRestore, // function - Custom function to manipulate the customProperties before restoring them into the "live" Param instance.
            restoreStage='mid', // string - 'pre' | 'mid' | 'post' // When restore the Parameter.
            restoreSequence=64, // integer|float - from 0 to 127. Use ingeger first.
            preRestore, // function - Function to be executed just before the Param'value is restored.
            postRestore, // function - Function to be executed just after the Param'value has been restored.
        }={}
    ){
        // @todo: cerca in indexedDB se c'è questo parametro nel preset "autosave",
        //        se lo trova lo crea da quel dizionario,
        //        altrimenti lo prende da quello che arriva hardcoded dal codice della app.
        //        In caso di indexedDB, l'initValue è il _value registrato al momento del dump.
    	this.app = app;
        this.harmonicarium = app.harmonicarium ? app.harmonicarium : app.dhc ? app.dhc.harmonicarium : app;
    	this.idbKey = idbKey;
        this.idbKeyPath = idbKey+'_'+app.id;
        this._presetStore = presetStore;
        this._presetAutosave = presetAutosave; // evaluated only if presetStore
        this._presetRestore = presetRestore; // evaluated only if presetStore
        this._presetGetValue = presetGetValue;
        this._presetSetValue = presetSetValue;
        this._presetSetValueInit = presetSetValueInit;
        this._customPropertiesStore = customPropertiesStore;
        this._customPropertiesRestore = customPropertiesRestore;
        this._restoreStage = restoreStage;
        this._restoreSequence = restoreSequence;
        this._preRestore = preRestore;
        this._postRestore = postRestore;
        this.dataType = dataType; // 'integer'|'float'|'boolean'|'string'|'other'
    	this.role = role; // 'int'|'fn'
        this._value = null;
        let setGet = {
            value: {
                set: this._setValue,
                get: this._getValue,
            },
            valueUI: {
                set: this._setUI2Value, // Set the Param's value from UI. Meant to be used in uiElement's EventListeners to avoid loops UI->value->UI->value...
                get: this._getValue2UI, // Get the Param's value for using on the UI. Meant to be used in uiElement's uiSet() (instead of postSet()) if the value displayed on the UI must be different from the _value.
            }
        };
        Object.assign(setGet, customSetGet);
        Object.defineProperties(this, setGet);
        Object.assign(this, customProperties);
        this._customProperties = customProperties;
        this.initValue = initValue;
        this._allowedValues = allowedValues;
        this._preInit = preInit;
        this._postInit = postInit;
        this.preSet = preSet;
        this.postSet = postSet;
        this._uiElements = uiElements;
        this.last_autosave = null;
        // Object.assign(this._uiElements, uiElements);

        if (role !== 'int') {
            if (uiElements) {
                this.uiElements = this._registerUiElements(uiElements);
            }
        }

        if (init && !initAsync) {
            this._init();
        } else if (init && initAsync) {
            this._initAsync();
        }

        this._compileParamList();
        this._compileParamMap();

        // =======================
    } // end class Constructor
    // ===========================

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
        } else if (['dhc', 'hstack', 'synth', 'midi', 'hancock'].includes(name)) {
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
        }
    }

    _errorIdbKeyUniq(idbKey, appName, appID) {
        let msg = `The idbKey "${idbKey}" is already defined for the component "${appName}" with ID "${appID}". Use a different key for the parameter.`;
        alert(msg);
        throw new Error(msg);
    }

    _checkParams(params) {
        if (params['']) {}
    }
    _init() { // @todo: pass a context!
        if (this._preInit) {
            this._preInit(this); // @todo: pass a context!
        }

        this._setValue(this.initValue, true); // @todo: pass a context!
        
        if (this._postInit) {
            this._postInit(this); // @todo: pass a context!
        }
    }
    async _initAsync() {
        if (this._preInit) {
            await this._preInit(this); // @todo: pass a context!
        }

        this._setValue(this.initValue, true); // @todo: pass a context!
        
        if (this._postInit) {
            await this._postInit(this); // @todo: pass a context!
        }
    }

    _setUI2Value(value) {
        this._setValue(value, false, true);
    }
    _setValue(value, init=false, fromUI=false, preSet=true, postSet=true, fromRestore=false, fromQueue=false) {  // @todo: pass a context!
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

        // @todo: if (now() - this.last_autosave > 1second) {update the "autosave" idb store}
        if (!init && (this._presetStore && this._presetAutosave) && (!fromRestore && this.harmonicarium.components.user.autosave)) {
            if (this.harmonicarium.components.user.parameters.preset.value !== this.harmonicarium.components.user.session.id) {
                console.group(`PARAM AUTOSAVE - START: Param "${this.idbKeyPath}" changed. The selected preset has been modified. The "Auto-save" preset will be initialized and set as the active one...`);
            
                // Inits
                this.harmonicarium.components.user.autosave = false;    
                this.harmonicarium.components.user.autosaveQueue = [];    

                this.harmonicarium.components.user.presetServiceDB.updateParams(this.harmonicarium.components.user.session.id, 'live')
                .then(() => {
                    // this.harmonicarium.components.user.parameters.preset._setValue(this.harmonicarium.components.user.session.id, false, false, true, false);
                    console.log('PARAM AUTOSAVE: The "Auto-save" preset has been initialized.');
                    return this.harmonicarium.components.user.presetServiceDB.updateSession({
                        sessionID: this.harmonicarium.components.user.session.id,
                        currentPreset: this.harmonicarium.components.user.session.id
                    });
                })
                .then(() => {
                    // Update the select option on the html elem
                    this.harmonicarium.components.user.parameters.preset._setValue(this.harmonicarium.components.user.session.id, true);
                    // this.harmonicarium.components.user.parameters.updatePresetsOnUI();
                    console.groupEnd();
                    console.log('PARAM AUTOSAVE - STOP: "Auto-save" has been set as current preset of the active session.');
                    
                    // Restore the autosave
                    this.harmonicarium.components.user.autosave = true;
                    
                    // If there are other changes to other Params fired during the initialization
                    // of the autosave preset, store them too.
                    if (this.harmonicarium.components.user.autosaveQueue.length > 0) {
                        console.group(`PARAM AUTOSAVE (queue) - START: There are ${this.harmonicarium.components.user.autosaveQueue.length} Params changed during the initialization of the "Auto-save" preset.`);
                        for (let param of this.harmonicarium.components.user.autosaveQueue) {
                            console.log(`PARAM AUTOSAVE (queue) - Param "${param.idbKeyPath}" changed. Post-autosave.`);
                            this.harmonicarium.components.user.presetServiceDB.updateParam(this.harmonicarium.components.user.session.id, param.idbKeyPath, 'live')
                            .then(() => {
                                // ... @todo: ? return this somehere to chain or "await" for this changes?
                            });
                        }
                        console.groupEnd();
                        console.log(`PARAM AUTOSAVE (queue) - STOP: The Params changed during the initialization of the "Auto-save" preset have been saved.`);
                    }
                    // Close the queue
                    this.harmonicarium.components.user.autosaveQueue = false;
                });
            } else {
                console.log(`PARAM AUTOSAVE: Param "${this.idbKeyPath}" changed. Autosave.`);
                this.harmonicarium.components.user.presetServiceDB.updateParam(this.harmonicarium.components.user.session.id, this.idbKeyPath, 'live')
                .then(() => {
                    // ... @todo: ? return this somehere to chain or "await" for this changes?
                });
            }
        // If the autosaveQueue is active (is an array)
        } else if (this._presetStore && this._presetAutosave && this.harmonicarium.components.user.autosaveQueue.push) {
            this.harmonicarium.components.user.autosaveQueue.push(this);
        }

    }
    _getValue() {
        return this._value;
    }
    _getValue2UI() {

    }

    _objValueModified() {
        this.value = this.value;
    }

    _getAppID() {
        return this.app.id || this.app.id===0 ? this.app.id : this.app.dhc ? this.app.dhc.id : this.app.harmonicarium.id;
    }
    _registerUiElements(uiElements) {
        let res = {};
        if (uiElements) {
            for (const [uiName, props] of Object.entries(uiElements)) {
                if (!['in', 'fn', 'out'].includes(props.role)) {
                    alert(`The "role" key is missing for the uiElement "${uiName}" during the parameter definition.`);
                } else if (!(props.role in res)) {
                    res[props.role] = {};
                }

                if (props.namespace) {
                    res[props.role][uiName] = {};
                } else {
                    props.htmlID = props.htmlID || `HTML${props.role[0]}_${uiName}${this._getAppID()}`;
                    res[props.role][uiName] = document.getElementById(props.htmlID);

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


/* The above code is defining a class called `UIelem` in JavaScript. The class has a constructor
function that takes in an object `settings` as a parameter. The `settings` object contains various
properties that define the behavior and attributes of the UI element. */
HUM.Param.UIelem = class {
    /**
    * @param {object} settings - ...
    */
    constructor(
        {
            htmlID, // string - The HTML ID of the element
            namespace=false, // boolean - If the element is just a funtional namespace for structuring the Param's uiElements object.
            role, // string - The role of the element
            opType, // string - Type of operation
            widget, // string - The type of widget used to render the element
            htmlTargetProp, // string - The property of the HTML element that contains the "value" of the Param. Used for read/write out-of-the-box. Set custom "eventListener" and/or "uiSet" if you need a customized behaviour.
            paramTargetProp='value', // string - The property of the Param where to store the "value" coming from the HTML element. Used for read/write out-of-the-box. Should be used in conjunction with some uiElement's customSetGet. Set custom "eventListener" and/or "uiSet" if you need a customized behaviour.
            eventType, // string - Type of event to be used on addEventListener()
            eventListener, // function - Function to be executed when an Event "eventType" is triggered on the element. 
            eventListeners, // object - ...
            uiSet, // function - Function to be executed just after the value of the Praram is changed and just before the Param's postSet(), to correctly adapt the "value" or any other property of this element or any other element in the DOM.
        }={}
    ){
        this.htmlID = htmlID;
        this.namespace = namespace;
        this.role = role;
        this.opType = opType;
        this.widget = widget;
        this.htmlTargetProp = htmlTargetProp;
        this.paramTargetProp = paramTargetProp;
        this.eventType = eventType;
        this.eventListener = eventListener;
        this.eventListeners = eventListeners;
        this.uiSet = uiSet;

        this._checkParams();
        // =======================
    } // end class Constructor
    // ===========================
    _errorMsg(argument) {
        let msg = `"HUM.Param.UIelem" parameter error. The "${argument}" argument has un unexpected value. Click "OK" and then check the console in the error stack trace for more details.`;
        alert(msg);
        throw new Error(msg);
        // window.stop();
    }
    _checkParams() {
        this._checkHtmlID();
        this._checkNamespace();
        this._checkUiSet();
        this._checkEventListener();

        if (!(this.uiSet===null || typeof this.uiSet === 'function') || !this.eventListener) {
            this._checkHtmlTargetProp();
        } else {
            if (this.htmlTargetProp) {this._checkHtmlTargetProp();}
        }
        
        if (!['in', 'fn', 'out', 'prompt'].includes(this.role)) {
            this._errorMsg('role');
        }

        if (['out', 'prompt'].includes(this.role)) {
            if (this.opType) {this._checkOpType();}
            if (this.eventType) {this._checkEventType();}
            if (this.widget) {this._checkWidget();}
        } else {
            this._checkOpType();
            this._checkEventType();
            this._checkWidget();
        }
    }
    _checkHtmlID() {
        if (!['string', 'undefined'].includes(typeof this.opType)) {
            this._errorMsg('htmlID');
        }
    }
    _checkNamespace() {
        if (typeof this.namespace !== 'boolean') {
            this._errorMsg('namespace');
        }
    }
    _checkOpType() {
        if (!['set', 'toggle', 'delta', 'run', 'typing'].includes(this.opType)) {
            this._errorMsg('opType');
        }
    }
    _checkEventType() {
        if (![
            'input',
            'change',
            'click',
            'show.bs.modal',
            'shown.bs.tab',
            'show.bs.collapse',
            'shown.bs.collapse',
            'hidden.bs.collapse'
        ].includes(this.eventType)) {
            this._errorMsg('eventType');
        }
    }
    _checkHtmlTargetProp() {
        if (this.role !== 'out' && this.widget !== 'button' &&  this.opType !== 'run') { // @todo: remove htmlTargetProp on action button
            if (!['value', 'checked', 'files'].includes(this.htmlTargetProp)) {
                this._errorMsg('htmlTargetProp');
            }
        }
        if (this.role === 'out' && this.htmlTargetProp) {
            if (!['innerText', 'innerHTML'].includes(this.htmlTargetProp)) {
                this._errorMsg('htmlTargetProp');
            }
        }

    }
    _checkWidget() {
        if (![
            'selection',
            'range',
            'checkbox',
            'file',
            'button',
            'number',
            'text',
            'collapse'
        ].includes(this.widget)) {
            this._errorMsg('widget');
        }
    }
    _checkUiSet() {
        if (this.uiSet !== null) {
            if (!['function', 'undefined'].includes(typeof this.uiSet)) {
                this._errorMsg('uiSet');
            }
        }
    }
    _checkEventListener() {
        if (!['function', 'undefined'].includes(typeof this.eventListener)) {
            this._errorMsg('eventListener');
        }
    }
};
