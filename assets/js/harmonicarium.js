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
 * The HUM (HarmonicariUM) main class.
 * 
 * Please note: I chose not to use a development paradigm using JavaScript modules because
 * I want this application to be usable by anyone locally (under the file:// protocol) without
 * needing to use a web server. Currently, it is not possible to import modules under the
 * file:// protocol as this generates a CORS error.
 */
class HUM {
    /**
     * @param {number} id - The id for the new instance of HUM
     * @param {string} context - The id for the new instance of HUM
     */
    constructor(id, context) {
        /**
        * The id of this HUM instance (eg. 0, 1, 2...)
        *
        * @member {number}
        */
        this.id = id;
        this._id = id;
        /**
        * The name of the context where this app is instantiated.
        *   Useful for composing the name of the DB in IndexedDB.
        *
        * @member {string}
        */
        this.context = context;
        /**
        * The name of this app.
        *   Useful for composing the name of the DB in IndexedDB.
        *
        * @member {string}
        */
        this.name = 'harmonicarium';
        /**
        * The full name of the instance.
        *   Used as name of the DB in IndexedDB.
        *
        * @member {string}
        */
        this.instanceName = this.name+this.id+'_'+this.context;
        /**
         * Namespace for base settings
         *
         * @member {Object}
         * 
         * @property {number}  dhcQty - How many DHCs must be generated
         * @property {boolean} dpPad  - If the Diphonic Pad must be included
         */
        this.settings = {
            dhcQty: 1,
            dpPad: true,
        };

        /**
        * Instance of `HUM#Parameters`.
        *
        * @member {HUM#Parameters}
        */
        this.parameters = null

        /**
         * Namespace container for module components
         *
         * @member {Object}
         * 
         * @property {Object.<string, HUM.DHC>} availableDHCs - The generated DHC instances
         * @property {HUM.DpPad}                dpPad         - The Diphonic Pad instance
         * @property {HUM.BackendUtils}         backendUtils  - The Backend Utils instance
         * @property {HUM.PwaManager}           pwaManager    - The PWA Manager instance
         * @property {HUM.User}                 user          - The User instance
         */
        this.components = {
            availableDHCs: {},
            dpPad: null,
            backendUtils: null,
            pwaManager: null,
            user: null
        };
        /**
        * The full name of the instance.
        *   Used as name of the DB in IndexedDB.
        *
        * @member {HUM.BroadcastChannel}
        */
        this.broadcastChannel = {};

        /**
         * The dimensions of the main reference HTML container
         *
         * @member {Object}
         * 
         * @property {number} x - Width in pixel
         * @property {number} y - Height in pixel
         */
        this.viewportDim = {
            x: 0,
            y: 0
        };

        /**
         * Namespace container for all the injected HTML templates
         *
         * @member {Object}
         * 
         * @property {HTMLElement}                  instancesContainer  - The main HTML container of all HUM instances
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
         * @property {Object.<string, HTMLElement>} dhcAccordions       - All the DHC's HTML accordion's containers
         * @property {HTMLElement}                  userTab             - The HTML container of the tab for the User instance
         * @property {Object.<string, HTMLElement>} hstackTabs          - Container for all the DHC's Hstak HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} pianoTabs           - Container for all the DHC's Hancock HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} dhcTabs             - Container for all the DHC's main settings HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} synthTabs           - Container for all the DHC's Synth HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} midiTabs            - Container for all the DHC's Midi HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} fmTabs              - Container for all the DHC's FM settings HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} ftTabs              - Container for all the DHC's FT settings HTML accordion's tabs
         * @property {Object.<string, HTMLElement>} htTabs              - Container for all the DHC's HT settings HTML accordion's tabs
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

        if (!this.html.instancesContainer) {
            alert('No DIV Html element with ID "harmonicaria" has been found!\n\nApplication loading aborted.');
            return undefined;
        }
    }

    /**
     * The `init()` method initializes the Harmonicarium app by creating the various components, rendering the
     * HTML templates, setting up the event listeners, and checking the availability of the IndexedDB provider 
     * for saving and loading presets.
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
     * The method `_initTemplates()` injects various HTML elements (templates) to their respective
     * containers in the DOM.
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
     * The `_initDHCs` function creates and initializes all the necessary DHCs and injects the
     * HTML elements to their respective tabs and boxes in the DOM.
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
     * The function `windowResize()` updates the viewport size and adjusts the width and height of the
     * app container accordingly, and then calls the `windowResize()` function of the `dpPad`
     * component in order to recompute the drawn geometries in all the sub-components that need to be
     * resized accordingly to the reference HTML container's dimensions
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
     * Update the reference HTML container's dimensions (currently the browser viewport)
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


/** 
 * Instance class-container used to create all the `HUM.Param` objects for the Harmonicarium (HUM) instance.
 */
HUM.prototype.Parameters = class {
    /**
     * @param {HUM} harmonicarium - The HUM instance in which this class is being used.
     */
    constructor(harmonicarium) {
        /**  
         * This property is a `HUM.Param` to control the initial splash screen by Bootstrap API.
         * It's not stored in the DB.
         *
         * @member {HUM.Param}
         * 
         * @property {bootstrap.Modal} bsModal - The Bootstrap controller for the initial loading HTML modal splash screen.
         */
        this.splashModal = new HUM.Param({
            app:harmonicarium,
            idbKey:'humSplashModal',
            uiElements:{
                'splashModal': new HUM.Param.UIelem({
                    role: 'out',
                })
            },
            // role: 'fn',
            presetStore: false,
            presetAutosave: false,
            presetRestore: false,
            postInit: (thisParam) => {
                thisParam.bsModal = new bootstrap.Modal(thisParam.uiElements.out.splashModal, {
                    keyboard: false,
                    backdrop: 'static'
                });
            }
        });
    }
};