/**
 * @fileoverview UI Element configuration class for the Harmonicarium parameter system.
 * This file defines the {@link HUM.Param.UIelem} class, which configures the HTML
 * elements bound to a {@link HUM.Param} instance (role, operation type, widget
 * type, event handling, and UI synchronization callbacks). It is split out from
 * the main {@link module:param} module.
 *
 * @module param-uielem
 * @memberof HUM.Param
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
 * UI Element configuration class for parameter-UI binding.
 *
 * @class
 * @memberof HUM.Param
 *
 * @description
 * `HUM.Param.UIelem` defines the configuration for an HTML element bound to a
 * {@link HUM.Param} instance. It provides a structured way to:
 * - Define how an HTML element interacts with the parameter value
 * - Configure event handling for user interactions
 * - Set up automatic synchronization between UI and parameter state
 * - Validate UI element configurations
 */
HUM.Param.UIelem = class {
    /**
     * Creates a new UI element configuration.
     * 
     * @param {Object}    config                          - UI element configuration object.
     * @param {string}   [config.htmlID]                  - HTML ID of the element (auto-generated if not provided).
     * @param {boolean}  [config.namespace=false]         - Whether the element is just a funtional namespace for structuring the Param's uiElements object.
     * @param {string}    config.role                     - Role of the element ('in'|'fn'|'out'|'prompt')
     * @param {string}   [config.opType]                  - Operation type ('set'|'toggle'|'delta'|'run'|'typing')
     * @param {string}   [config.widget]                  - The type of widget used to render the element ('selection'|'range'|'checkbox'|'file'|'button'|'number'|'text'|'collapse')
     * @param {string}   [config.htmlTargetProp]          - The property of the HTML element that contains the "value" of the Param. Used for read/write out-of-the-box. Set custom "eventListener" and/or "uiSet" if you need a customized behaviour ('value'|'checked'|'files'|'innerText'|'innerHTML').
     * @param {string}   [config.paramTargetProp='value'] - The property of the Param where to store the "value" coming from the HTML element. Used for read/write out-of-the-box. Should be used in conjunction with some uiElement's customSetGet. Set custom "eventListener" and/or "uiSet" if you need a customized behaviour.
     * @param {string}   [config.eventType]               - Type of event type to be used on addEventListener() ('input'|'change'|'click'|etc.)
     * @param {Function} [config.eventListener]           - Function to be executed when an Event "eventType" is triggered on the element. 
     * @param {Object}   [config.eventListeners]          - Additional event listeners configuration
     * @param {Function} [config.uiSet]                   - Function to be executed just after the value of the Praram is changed and just before the Param's postSet(), to correctly adapt the "value" or any other property of this element or any other element in the DOM.
     * 
     * @description
     * The constructor validates all configuration parameters and sets up the UI element
     * definition that will be used by the parameter system for automatic UI binding.
     * 
     * **Configuration Validation:**
     * - Validates role against allowed values
     * - Checks operation type compatibility with role
     * - Ensures required properties are set for each widget type
     * - Validates event types and HTML target properties
     * 
     * **Automatic Features:**
     * - HTML ID generation if not provided
     * - Default event listeners for standard input patterns
     * - Automatic type conversion for numeric widgets
     * - Built-in validation for configuration consistency
     */
    constructor(
        {
            htmlID,
            namespace=false,
            role,
            opType,
            widget,
            htmlTargetProp,
            paramTargetProp='value',
            eventType,
            eventListener,
            eventListeners,
            uiSet,
        }={}
    ){
        /**
         * HTML ID of the element (auto-generated if not provided).
         * @type {string|undefined}
         */
        this.htmlID = htmlID;
        
        /**
         * Whether this element is a functional namespace for structuring.
         * @type {boolean}
         */
        this.namespace = namespace;
        
        /**
         * Role of the element in parameter interaction.
         * @type {string}
         */
        this.role = role;
        
        /**
         * Type of operation this element performs.
         * @type {string|undefined}
         */
        this.opType = opType;
        
        /**
         * Widget type for this element.
         * @type {string|undefined}
         */
        this.widget = widget;
        
        /**
         * HTML property that contains the parameter value.
         * @type {string|undefined}
         */
        this.htmlTargetProp = htmlTargetProp;
        
        /**
         * Parameter property to store the value from HTML element.
         * @type {string}
         */
        this.paramTargetProp = paramTargetProp;
        
        /**
         * Event type for addEventListener.
         * @type {string|undefined}
         */
        this.eventType = eventType;
        
        /**
         * Custom event handler function.
         * @type {Function|undefined}
         */
        this.eventListener = eventListener;
        
        /**
         * Additional event listeners configuration.
         * @type {Object|undefined}
         */
        this.eventListeners = eventListeners;
        
        /**
         * Custom function for updating UI when parameter value changes.
         * @type {Function|undefined}
         */
        this.uiSet = uiSet;

        // Validate configuration parameters
        this._checkParams();
        // =======================
    } // end class Constructor
    // ===========================
    
    /**
     * Displays an error message and throws an error for invalid configuration.
     * 
     * @param {string} argument - Name of the invalid argument
     * @private
     * @throws {Error} Always throws an error with details about the invalid argument
     */
    _errorMsg(argument) {
        let msg = `"HUM.Param.UIelem" parameter error. The "${argument}" argument has un unexpected value. Click "OK" and then check the console in the error stack trace for more details.`;
        alert(msg);
        throw new Error(msg);
        // window.stop();
    }
    
    /**
     * Validates all configuration parameters for this UI element.
     * 
     * @private
     * 
     * @description
     * This method performs comprehensive validation of the UI element configuration:
     * - Validates basic properties (htmlID, namespace, role)
     * - Checks function configurations (uiSet, eventListener)
     * - Validates HTML target properties based on role and widget
     * - Ensures operation types and event types are valid
     * - Applies role-specific validation rules
     */
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
    
    /**
     * Validates the htmlID property.
     * 
     * @private
     * @throws {Error} If htmlID is not a string or undefined
     */
    _checkHtmlID() {
        if (!['string', 'undefined'].includes(typeof this.htmlID)) {
            this._errorMsg('htmlID');
        }
    }
    
    /**
     * Validates the namespace property.
     * 
     * @private
     * @throws {Error} If namespace is not a boolean
     */
    _checkNamespace() {
        if (typeof this.namespace !== 'boolean') {
            this._errorMsg('namespace');
        }
    }
    
    /**
     * Validates the operation type.
     * 
     * @private
     * @throws {Error} If opType is not one of the allowed values
     * 
     * @description
     * Valid operation types:
     * - `set`: Direct value setting
     * - `toggle`: Boolean value toggling
     * - `delta`: Incremental value changes
     * - `run`: Function execution
     * - `typing`: Text input operations
     */
    _checkOpType() {
        if (!['set', 'toggle', 'delta', 'run', 'typing'].includes(this.opType)) {
            this._errorMsg('opType');
        }
    }
    
    /**
     * Validates the event type.
     * 
     * @private
     * @throws {Error} If eventType is not one of the allowed values
     * 
     * @description
     * Valid event types include:
     * - Standard DOM events: `input`, `change`, `click`
     * - Bootstrap events: `show.bs.modal`, `shown.bs.tab`, `show.bs.collapse`, `shown.bs.collapse`, `hidden.bs.collapse`
     */
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
    
    /**
     * Validates the HTML target property.
     * 
     * @private
     * @throws {Error} If htmlTargetProp is not appropriate for the role and widget
     * 
     * @description
     * Valid HTML target properties depend on role:
     * - For input roles: `value`, `checked`, `files`
     * - For output roles: `innerText`, `innerHTML`
     * - Special cases for buttons and run operations
     */
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
    
    /**
     * Validates the widget type.
     * 
     * @private
     * @throws {Error} If widget is not one of the allowed values
     * 
     * @description
     * Valid widget types:
     * - `selection`: Dropdown/select/radio elements
     * - `range`: Slider/range inputs  
     * - `checkbox`: Boolean checkbox inputs
     * - `file`: File upload inputs
     * - `button`: Action buttons
     * - `number`: Numeric inputs
     * - `text`: Text inputs
     * - `collapse`: Collapsible sections
     */
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
    
    /**
     * Validates the uiSet function.
     * 
     * @private
     * @throws {Error} If uiSet is not a function, null, or undefined
     * 
     * @description
     * The uiSet property can be:
     * - `undefined`: Use default UI updating behavior
     * - `null`: Explicitly disable UI updates
     * - `Function`: Custom UI update function
     */
    _checkUiSet() {
        if (this.uiSet !== null) {
            if (!['function', 'undefined'].includes(typeof this.uiSet)) {
                this._errorMsg('uiSet');
            }
        }
    }
    
    /**
     * Validates the eventListener function.
     * 
     * @private
     * @throws {Error} If eventListener is not a function or undefined
     * 
     * @description
     * The eventListener property can be:
     * - `undefined`: Use default event handling behavior
     * - `Function`: Custom event handler function
     * 
     * Custom event listeners receive the event object and should handle
     * parameter value updates appropriately for their specific use case.
     */
    _checkEventListener() {
        if (!['function', 'undefined'].includes(typeof this.eventListener)) {
            this._errorMsg('eventListener');
        }
    }
};
