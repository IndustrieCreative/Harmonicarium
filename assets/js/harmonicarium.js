/**
 * @fileoverview Main HUM (HarmonicariUM) top-level class for the Harmonicarium web application.
 * This file defines the {@link HUM} class that manages Harmonic Series manipulation,
 * component coordination, and multi-instance support. The sub-components are defined
 * in the companion file:
 * - {@link module:harmonicarium-parameters} — `HUM.prototype.Parameters` class
 *
 * @module harmonicarium
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

 * @note Implementation Decision: 
 * No ES6 modules are used to maintain compatibility with the file:// protocol.
 * This allows the application to run locally without requiring a web server,
 * avoiding CORS errors that would occur with module imports.
 */

"use strict";

/**
 * Main HUM (HarmonicariUM) top-level class for the Harmonicarium application.
 *
 * @class
 *
 * @description
 * The `HUM` class is the core of the Harmonicarium application. It manages:
 * - Multiple DHC (Dynamic Harmonics Calculator) instances
 * - Audio synthesis and MIDI communication
 * - UI components and user interactions
 * - Data persistence and preset management
 * - Multi-instance coordination via BroadcastChannel
 *
 * The {@link HUM.prototype.Parameters|Parameters} inner class is
 * defined in the companion {@link module:harmonicarium-parameters} file and
 * attached to `HUM.prototype` at load time.
 *
 * @example
 * // Create and initialize a new Harmonicarium instance
 * const harmonicarium = new HUM(1, 'mainDev');
 * harmonicarium.init().then(() => {
 *     console.log('Harmonicarium ready!');
 * });
 *
 * @example
 * // Multiple instances coordination
 * const hum1 = new HUM(1, 'context1');
 * const hum2 = new HUM(2, 'context1');
 * // Both instances can communicate via BroadcastChannel
 */
class HUM {
    /**
     * Creates a new HUM (Harmonicarium) instance.
     * 
     * @param {number} id - Unique identifier for this HUM instance (e.g., 1, 2, 3...)
     * @param {string} context - Context identifier for grouping instances (used for IndexedDB naming and BroadcastChannel coordination)
     * 
     * @description
     * The constructor initializes the core properties and sets up the foundation
     * for the Harmonicarium instance. It does not perform heavy initialization -
     * call the `init()` method after construction to fully initialize the instance.
     * 
     * @example
     * // Create a new instance
     * const hum = new HUM(1, 'mainApp');
     * 
     * @example
     * // Multiple instances in the same context
     * const hum1 = new HUM(1, 'multiInstance');
     * const hum2 = new HUM(2, 'multiInstance');
     */
    constructor(id, context) {
        /**
         * Unique identifier for this HUM instance.
         * Used for DOM element IDs, IndexedDB naming, and instance coordination.
         * 
         * @type {number}
         * @readonly
         */
        this.id = id;
        
        /**
         * Internal reference to the instance ID.
         * 
         * @type {number}
         * @private
         */
        this._id = id;
        
        /**
         * Context identifier for grouping related instances.
         * Used for IndexedDB database naming and BroadcastChannel coordination.
         * Multiple instances can share the same context to enable communication.
         * 
         * @type {string}
         * @readonly
         * @example
         * // Instances with same context can communicate
         * const hum1 = new HUM(1, 'sharedContext');
         * const hum2 = new HUM(2, 'sharedContext');
         */
        this.context = context;
        
        /**
         * Application name identifier.
         * Used as base name for IndexedDB database naming.
         * 
         * @type {string}
         * @readonly
         * @default 'harmonicarium'
         */
        this.name = 'harmonicarium';
        
        /**
         * Full instance name combining name, id, and context.
         * Used as the actual database name in IndexedDB operations.
         * 
         * @type {string}
         * @readonly
         * @example
         * // For HUM(1, 'mainDev') results in: "harmonicarium1_mainDev"
         */
        this.instanceName = this.name+this.id+'_'+this.context;
        
        /**
         * Base application settings and configuration.
         * 
         * @type {Object}
         * 
         * @property {number} dhcQty - Number of DHC (Dynamic Harmonics Calculator) instances to generate
         * @property {boolean} dpPad - Whether to include the Diphonic Pad component
         */
        this.settings = {
            dhcQty: 1,
            dpPad: true,
        };

        /**
         * Instance of the Parameters management system.
         * Handles all application parameters, their validation, and persistence.
         * Initialized during the `init()` method execution.
         * 
         * @type {HUM.Parameters|null}
         * @see {@link HUM.Parameters}
         */
        this.parameters = null;

        /**
         * Container for all major application components.
         * Each component is initialized during the `init()` method execution.
         * 
         * @type {Object}
         * 
         * @property {Object.<string, HUM.DHC>} availableDHCs - All generated DHC (Dynamic Harmonics Calculator) instances, keyed by their ID
         * @property {HUM.DpPad|null} dpPad - The Diphonic Pad component instance for main UI control
         * @property {HUM.BackendUtils|null} backendUtils - Backend utilities for file operations and UI management
         * @property {HUM.PwaManager|null} pwaManager - Progressive Web App management component
         * @property {HUM.User|null} user - User data and preset management component
         * 
         * @example
         * // Access a DHC instance
         * const dhc1 = harmonicarium.components.availableDHCs['1'];
         * 
         * @example
         * // Access the main pad
         * const pad = harmonicarium.components.dpPad;
         */
        this.components = {
            availableDHCs: {},
            dpPad: null,
            backendUtils: null,
            pwaManager: null,
            user: null
        };
        
        /**
         * BroadcastChannel instance for inter-instance communication.
         * Enables coordination between multiple HUM instances in the same context.
         * Initialized during the `init()` method execution.
         * 
         * @type {HUM.BroadcastChannel|Object}
         * @see {@link HUM.BroadcastChannel}
         */
        this.broadcastChannel = {};

        /**
         * Viewport dimensions of the main application container.
         * Updated dynamically during window resize events.
         * 
         * @type {Object}
         * 
         * @property {number} x - Container width in pixels
         * @property {number} y - Container height in pixels
         * 
         * @example
         * // Check current viewport size
         * console.log(`Viewport: ${hum.viewportDim.x}x${hum.viewportDim.y}`);
         */
        this.viewportDim = {
            x: 0,
            y: 0
        };

        /**
         * HTML template elements and DOM containers for the application.
         * All HTML templates are injected and managed through this object.
         * Elements are created during the `init()` method execution.
         * 
         * @type {Object}
         * 
         * @property {HTMLElement}                  instancesContainer  - The main HTML container of all HUM instances (shared across instances)
         * @property {HTMLElement}                  appContainer        - The HTML container of this HUM instance
         * @property {HTMLElement}                  dpPadContainer      - The HTML container of the DpPad instance (just one per HUM)
         * @property {HTMLElement}                  sidePanel           - The main HTML container of the side panel's objects (.logoBox and .sideMenu)
         * @property {HTMLElement}                  logTextBox          - The HTML container of the log text box for the BackendUtils instance
         * @property {HTMLElement}                  svgIcons            - The HTML container of the SVG icons palette
         * @property {HTMLElement}                  modalDialogContents - The HTML container of the modal dialog tool (reusable)
         * @property {HTMLElement}                  logoBox             - The HTML container of the logo/menu box
         * @property {HTMLElement}                  sideMenu            - The HTML container of one .userAccordion, one .dpPadAccordion and all accordions of each DHC instance (.dhcAccordions)
         * @property {HTMLElement}                  userAccordion       - The HTML container of the accordion of the User instance
         * @property {HTMLElement}                  dpPadAccordion      - The HTML container of the accordion of the DpPad instance
         * @property {Object.<string, HTMLElement>} dhcAccordions       - Namespace for all the DHC's HTML accordion's containers, keyed by DHC ID
         * @property {HTMLElement}                  userTab             - The HTML container of the tab for the User instance
         * @property {Object.<string, HTMLElement>} hstackTabs          - Namespace for all the DHC's Hstak HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} pianoTabs           - Namespace for all the DHC's Hancock HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} dhcTabs             - Namespace for all the DHC's main settings HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} synthTabs           - Namespace for all the DHC's Synth HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} midiTabs            - Namespace for all the DHC's Midi HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} fmTabs              - Namespace for all the DHC's FM settings HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} ftTabs              - Namespace for all the DHC's FT settings HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} htTabs              - Namespace for all the DHC's HT settings HTML accordion's tabs
         * 
         * @example
         * // Access the main app container
         * const container = harmonicarium.html.appContainer;
         * 
         * @example
         * // Access a specific DHC's accordion
         * const dhcAccordion = harmonicarium.html.dhcAccordions['1'];
         */
        this.html = {
            // Body content
            instancesContainer: document.getElementById('harmonicaria'),

            // This Harmonicarium Instance content
            appContainer: HUM.tmpl.appContainer(this.id),
            // App contents
            dpPadContainer: HUM.tmpl.dpPadContainer(this.id),
            sidePanel: HUM.tmpl.sidePanel(this.id),
            logTextBox: HUM.tmpl.logTextBox(this.id),
            svgIcons: HUM.tmpl.dpIcons(this.id),
            modalDialogContents: HUM.tmpl.dialogModalContents(this.id),

            // Side Panel contents
            logoBox: HUM.tmpl.logoBox(this.id),
            sideMenu: HUM.tmpl.sideMenu(this.id),

            // Side Menu accordions
            userAccordion: HUM.tmpl.userAccordion(this.id),
            dpPadAccordion: HUM.tmpl.dpPadAccordion(this.id),
            dhcAccordions: {},  // All the DHCs' accordions

            // Tab for User accordion
            userTab: HUM.tmpl.accordionTab(this.id, 'user', 'Setting presets', 'user'),

            // Tab for the DHC-specific accordions
            hstackTabs: {},
            pianoTabs: {},
            dhcTabs: {},
            synthTabs: {},
            midiTabs: {},
            fmTabs: {},
            ftTabs: {},
            htTabs: {},
            // visualiserBox: {},
        };

        // Validate that the main container element exists
        if (!this.html.instancesContainer) {
            alert('No DIV Html element with ID "harmonicaria" has been found!\n\nApplication loading aborted.');
            return undefined;
        }
    }

    /**
     * Initializes the Harmonicarium application components and sets up the UI.
     * 
     * @async
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     * 
     * @description
     * The init() method performs the complete application initialization sequence:
     * 1. Creates and configures all major components (Parameters, User, BackendUtils, etc.)
     * 2. Renders HTML templates and injects them into the DOM
     * 3. Initializes the specified number of DHC instances
     * 4. Sets up event listeners for UI interactions
     * 5. Establishes BroadcastChannel communication for multi-instance coordination
     * 6. Checks IndexedDB availability for preset management
     * 7. Loads the settings and user preferences
     * 
     * @throws {Error} Throws error if critical components fail to initialize
     * 
     * @example
     * // Basic initialization
     * const harmonicarium = new HUM(1, 'mainApp');
     * await harmonicarium.init();
     * 
     * @example
     * // With error handling
     * try {
     *     await harmonicarium.init();
     *     console.log('Harmonicarium ready!');
     * } catch (error) {
     *     console.error('Failed to initialize:', error);
     * }
     */
    init() {
        console.log('****** WELCOME TO HARMONICARIUM *****');
        console.group('HARMONICARIUM - START: Initializing...');

        // Prevent QWERTY Hancock to play sounds instead typing chars in input widgets
        this.html.instancesContainer.addEventListener('keydown', evt => {
            if (['INPUT', 'SELECT'].includes(evt.target.tagName)) {
                evt.stopImmediatePropagation();
            }
        });
        this.html.instancesContainer.addEventListener('keyup', evt => {
            if (['INPUT', 'SELECT'].includes(evt.target.tagName)) {
                evt.stopImmediatePropagation();
            }
        });

        this._initTemplates();
        console.log('HARMONICARIUM: Document and Templates initialized.');
        // Create the "Preset/Patch" service
        this.components.user = new HUM.User(this);
        this.broadcastChannel = new HUM.BroadcastChannel(this);
        this.parameters = new this.Parameters(this);
        // Show splash screen
        this.parameters.splashModal.bsModal.show();
        document.getElementsByClassName('modal-backdrop')[0].classList.add('hum-black-backdrop');
        // Disable the autosave function
        this.components.user.autosave = false;

        // Create all the other components (apps) and their Params
        console.group('HARMONICARIUM: Initialization of the Main components (apps).');

        // Create the common apps
        this.components.backendUtils = new HUM.BackendUtils(this);

        this.components.pwaManager = new HUM.PwaManager(this);
        // Create the DHCs
        this._initDHCs();
        // Create the DiphonicPad if required and initiaize it
        // (for now, use the first DHC available)
        if (this.settings.dpPad) {
            this.components.dpPad = new HUM.DpPad(this, this.components.availableDHCs[0]);
            this.components.dpPad.init();
        }

            this.html.dpPadContainer.style.width = "100%";
            this.html.dpPadContainer.style.height = "100%";

            // Initialize the backend parameters
            this.components.backendUtils.parameters._init();

        console.groupEnd();
        console.log('HARMONICARIUM: Main components (apps) initialized.');

        // Initialize the "Preset/Patch" service and the IndexedDB provider
        console.group('HARMONICARIUM: Initialization of the User component (Preset feature and IndexedDB provider)...');
        this.components.user._init()
        .then(() => {
            // Enable the autosave function
            if (this.components.user.presetServiceDB.available) {
                this.components.user.autosave = true;
                let msg = 'The User component initialization was completed and the IndexedDB provider is available. The Preset "save", "autosave" and "load" features are now enabled.';
                console.groupEnd();
                console.info('HARMONICARIUM: '+msg);
                this.components.backendUtils.eventLog(msg);
            } else {
                let msg = 'The User component initialization was succesful but the IndexedDB provider seems unavailable. The Preset "save", "autosave" and "load" features are disabled.';
                console.groupEnd();
                console.error('HARMONICARIUM: '+msg);
                this.components.backendUtils.eventLog(msg);
            }
        })
        .catch((request, evt) => {
            console.error(request, evt);
            let msg = 'The User component initialization failed and the IndexedDB provider is unavailable. The Preset "save", "autosave" and "load" features are disabled.';
            console.groupEnd();
            console.error('HARMONICARIUM: '+ msg, request.error);
            this.components.backendUtils.eventLog(msg);
        })
        .finally(() => {
            window.addEventListener('resize', () => this.windowResize());
            window.addEventListener('orientationchange', () => this.windowResize());
            this.windowResize();
            
            console.groupEnd();
            console.log('HARMONICARIUM - STOP: Initialization completed.');
            // Close the splash screen
            setTimeout(() => {
                this.parameters.splashModal.bsModal.hide();
            }, 500);
        });
    }

    /**
     * Injects HTML templates into their respective DOM containers.
     * 
     * @private
     * 
     * @description
     * This method performs the DOM injection of all pre-created HTML templates:
     * - Injects user and pad accordions into the side menu
     * - Assembles the side panel with logo and menu components
     * - Adds modal dialogs and hidden elements to the app container
     * - Attaches the complete app container to the main instances container
     * 
     * Called internally during the initialization process.
     */
    _initTemplates() {
        // User accordion tab
        this.html.userTab.children[1].children[0].appendChild(HUM.tmpl.userBox(this.id));
        this.html.userAccordion.children[0].appendChild(this.html.userTab);

        // into Side Menu
        this.html.sideMenu.children[0].appendChild(this.html.userAccordion);
        this.html.sideMenu.children[0].appendChild(this.html.dpPadAccordion);

        // into Side Panel
        this.html.sidePanel.appendChild(this.html.logoBox);
        this.html.sidePanel.appendChild(this.html.sideMenu);

        // into App Container
        this.html.appContainer.appendChild(this.html.dpPadContainer);
        this.html.appContainer.appendChild(this.html.sidePanel);
        this.html.appContainer.appendChild(this.html.logTextBox);
        // Hidden:
            // Icons
            this.html.appContainer.appendChild(this.html.svgIcons);
            // Modals stuff
            this.html.modalDialogContents.appendChild(HUM.tmpl.userManagePresets(this.id));
            this.html.modalDialogContents.appendChild(HUM.tmpl.userResetDB(this.id));
            this.html.appContainer.appendChild(this.html.modalDialogContents);
            this.html.appContainer.appendChild(HUM.tmpl.dialogModal(this.id));
            this.html.appContainer.appendChild(HUM.tmpl.splashModal(this.id));



        // into Instances Container
        this.html.instancesContainer.appendChild(this.html.appContainer);
    }

    /**
     * Creates and initializes all DHC (Dynamic Harmonics Calculator) instances.
     * 
     * @private
     * 
     * @description
     * This method:
     * 1. Creates the specified number of DHC instances based on `settings.dhcQty`
     * 2. Generates unique IDs for each DHC using the pattern `{humId}-{dhcIndex}`
     * 3. Creates HTML templates for each DHC's accordion tabs and content boxes
     * 4. Injects all DHC templates into the DOM structure
     * 5. Instantiates the actual DHC component objects
     * 
     * Each DHC gets its own set of tabs:
     * - Synth: Built-in synthesizer controls
     * - MIDI: Input/Output configuration
     * - Piano: Virtual keyboard and keymap settings
     * - DHC Settings: Core DHC parameters
     * - FM: Fundamental Mother controls
     * - FT: Fundamental Tones settings
     * - HT: Harmonic Tones settings
     * - Hstack: Harmonic stack visualization
     * 
     * @example
     * // For settings.dhcQty = 2 and HUM id = 1, creates:
     * // DHC IDs: "1-0", "1-1"
     * // Available at: harmonicarium.components.availableDHCs[0], [1]
     */
    _initDHCs() {
        let hrmID = this.id;
        // Create the DHCs needed
        for (let id=0; id<this.settings.dhcQty; id++) {
            let dhcID = hrmID+'-'+id;
            
            this.html.dhcAccordions[dhcID] = HUM.tmpl.dhcAccordion(dhcID);
            let dhcAccordions = this.html.dhcAccordions[dhcID];

            this.html.synthTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'synth', 'Built-in Synth', 'audio', hrmID);
            this.html.midiTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'midi', 'MIDI I/O', 'midi', hrmID);
            this.html.pianoTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'piano', 'Piano Keymap', 'piano', hrmID);
            this.html.dhcTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'dhcSettings', 'DHC Settings', 'dhcSettings', hrmID);
            this.html.fmTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'fm', 'Fundamental Mother', 'fm', hrmID);
            this.html.ftTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'ft', 'Fundamental Tones', 'ft', hrmID);
            this.html.htTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'ht', 'Harmonic Tones', 'ht', hrmID);
            this.html.hstackTabs[dhcID] = HUM.tmpl.accordionTab(dhcID, 'hstack', 'Hstack', 'table', hrmID);

            this.html.hstackTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.hstackBox(dhcID));
            this.html.pianoTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.pianoBox(dhcID));
            this.html.dhcTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.dhcBox(dhcID, hrmID));
            this.html.synthTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.synthBox(dhcID, hrmID));
            this.html.midiTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.midiBox(dhcID, hrmID));

            this.html.appContainer.appendChild(HUM.tmpl.midiModal(dhcID));
            this.html.appContainer.appendChild(HUM.tmpl.keymapModal(dhcID));
            
            this.html.fmTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.fmBox(dhcID));
            this.html.ftTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.ftBox(dhcID));
            this.html.htTabs[dhcID].children[1].children[0].appendChild(HUM.tmpl.htBox(dhcID));

            dhcAccordions.children[0].appendChild(this.html.synthTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.midiTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.pianoTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.dhcTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.fmTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.ftTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.htTabs[dhcID]);
            dhcAccordions.children[0].appendChild(this.html.hstackTabs[dhcID]);

            this.html.sideMenu.children[0].appendChild(dhcAccordions);

            this.components.availableDHCs[id] = new HUM.DHC(dhcID, id, this);
        }
    }

    /**
     * Handles window resize events and updates component layouts in order to
     * recompute the drawn geometries in all the sub-components that need to be
     * resized accordingly to the reference HTML container's dimensions
     * 
     * @description
     * This method is called whenever the browser window is resized or the device
     * orientation changes. It:
     * 1. Updates the stored viewport dimensions
     * 2. Adjusts the app container size to match the new viewport
     * 3. Triggers resize handling in the DpPad component for canvas redraws
     * 
     * @example
     * // Manually trigger resize handling
     * harmonicarium.windowResize();
     */
    windowResize() {
        // window.requestAnimationFrame( () => {
        this.updateViewportSize();
        this.html.appContainer.style.width = this.viewportDim.x+'px';
        this.html.appContainer.style.height = this.viewportDim.y+'px';
        this.components.dpPad.windowResize();
        // });
    }

    /**
     * Updates the stored viewport dimensions from the current document size.
     * 
     * @description
     * Calculates and stores the current viewport dimensions using
     * `document.documentElement.clientWidth/Height`. Small adjustments (-1, -7)
     * are applied to account for browser rendering differences.
     * 
     * @todo Investigate why the -1 and -7 pixel adjustments are necessary
     * @todo Consider handling scrollbar visibility impact on dimensions
     */
    updateViewportSize() {
        // @todo - no difference if hiding scrollbar ?!
        //         why -1 and -7 works ??

        // this.viewportDim.x = window.innerWidth - 1;
        // this.viewportDim.y = window.innerHeight - 1;

        this.viewportDim.x = document.documentElement.clientWidth - 1;
        this.viewportDim.y = document.documentElement.clientHeight - 7;
    }
}
