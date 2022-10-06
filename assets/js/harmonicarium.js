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

"use strict";

/** 
 * The HARMONICARIUM main class
 */
class HUM {
    /**
     * Create an instance of DHC
     * @param {number} id - The id for the new instance of HUM
     */
    constructor(id, context) {
        /**
         * The id of the HUM instance
         *
         * @type {number}
         */
        this.id = id;
        this._id = id;
        this.context = context;
        this.name = 'harmonicarium';
        this.instanceName = this.name+this.id+'_'+this.context;

        /**
         * Namespace for base settings
         *
         * @type {Object}
         * 
         * @property {number}  dhcQty - How many DHCs must be generated
         * @property {boolean} dpPad  - If the Diphonic Pad must be included
         */
        this.settings = {
            dhcQty: 1,
            dpPad: true,
        };

        /**
         * Namespace container for module components
         *
         * @type {Object}
         * 
         * @property {Object.<string, HUM.DHC>} availableDHCs - How many DHCs must be generated
         * @property {HUM.DpPad}                dpPad         - If the Diphonic Pad must be included
         * @property {HUM.BackendUtils}         backendUtils  - If the Backend Utils must be included
         */
        this.components = {
            availableDHCs: {},
            dpPad: null,
            backendUtils: null,
            pwaManager: null,
            user: null
        };

        this.broadcastChannel = {};

        /**
         * The dimensions of the main reference HTML container
         *
         * @type {Object}
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
         * @type {Object}
         * 
         * @property {HTMLElement}                  instancesContainer - The main HTML container of all HUM instances
         * @property {HTMLElement}                  appContainer       - The HTML container of this HUM instance
         * @property {HTMLElement}                  dpPadContainer          - The HTML container of the DpPad instance (just one per harmonicarium)
         * @property {HTMLElement}                  sidePanel          - The main HTML container of the side panel's objects (.logoBox and .sideContents)
         * @property {HTMLElement}                  logTextBox         - The HTML container of the log text box for the BackendUtils instance
         * @property {HTMLElement}                  svgIcons           - The HTML container of the SVG icons palette
         * @property {HTMLElement}                  logoBox            - The HTML container of the logo/menu box
         * @property {HTMLElement}                  sideContents       - The HTML container of the .sideMenu
         * @property {HTMLElement}                  sideMenu           - The HTML container of .dpPadAccordion (just one) and all accordions of each DHC instance
         * @property {HTMLElement}                  dpPadAccordion     - The HTML container of the HTML accordion of the DpPad instance
         * @property {Object.<string, HTMLElement>} hstackTab          - All the DHC's Hstak HTML containers
         * @property {Object.<string, HTMLElement>} pianoTab           - All the DHC's Hancock HTML containers
         * @property {Object.<string, HTMLElement>} dhcTab             - All the DHC's main settings HTML containers
         * @property {Object.<string, HTMLElement>} synthTab           - All the DHC's Synth HTML containers
         * @property {Object.<string, HTMLElement>} midiTab            - All the DHC's Midi HTML containers
         * @property {Object.<string, HTMLElement>} fmTab              - All the DHC's FM settings HTML containers
         * @property {Object.<string, HTMLElement>} ftTab              - All the DHC's FT settings HTML containers
         * @property {Object.<string, HTMLElement>} htTab              - All the DHC's HT settings HTML containers
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
            // sideContents: HUM.tmpl.sideContents(this.id),

            // Side Contents content
            sideMenu: HUM.tmpl.sideMenu(this.id),

            // Side Menu content
            userAccordion: HUM.tmpl.userAccordion(this.id),
            dpPadAccordion: HUM.tmpl.dpPadAccordion(this.id),

            userTab: HUM.tmpl.accordionTab(this.id, 'user', 'Setting presets'),

            // dhc Container contents (DHC-specific Boxes)
            accordion: {},
            hstackTab: {},
            pianoTab: {},
            dhcTab: {},
            synthTab: {},
            midiTab: {},
            fmTab: {},
            ftTab: {},
            htTab: {},
            // visualiserBox: {},
        };

        if (!this.html.instancesContainer) {
            alert('No DIV Html element with ID "harmonicaria" has been found!\n\nApplication loading aborted.');
            return undefined;
        }
    }

    /**
     * Initialize a single instance of HUM
     */
    _init() {
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
     * Inject in the document all the main HTML templates
     */
    _initTemplates() {

        // User accordion tab
        this.html.userTab.children[1].children[0].appendChild(HUM.tmpl.userBox(this.id));
        this.html.userAccordion.children[0].appendChild(this.html.userTab);

        // into Side Menu
        this.html.sideMenu.children[0].appendChild(this.html.userAccordion);
        this.html.sideMenu.children[0].appendChild(this.html.dpPadAccordion);

        // into Side Contents
        // this.html.sideContents.appendChild(this.html.sideMenu);

        // into Side Panel
        this.html.sidePanel.appendChild(this.html.logoBox);
        // this.html.sidePanel.appendChild(this.html.sideContents);
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
     * Initialize all the necessary DHCs
     */
    _initDHCs() {
        let hrmID = this.id;
        // Create the DHCs needed
        for (let id=0; id<this.settings.dhcQty; id++) {
            let dhcID = hrmID+'-'+id;
            
            this.html.accordion[dhcID] = HUM.tmpl.dhcAccordion(dhcID);
            let dhcAccordion = this.html.accordion[dhcID];

            this.html.synthTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'synth', 'Built-in Synth');
            this.html.midiTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'midi', 'MIDI I/O');
            this.html.pianoTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'piano', 'Piano Keymap');
            this.html.dhcTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'dhcSettings', 'DHC Settings');
            this.html.fmTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'fm', 'Fundamental Mother');
            this.html.ftTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'ft', 'Fundamental Tones');
            this.html.htTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'ht', 'Harmonic Tones');
            this.html.hstackTab[dhcID] = HUM.tmpl.accordionTab(dhcID, 'hstack', 'Hstack');

            this.html.hstackTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.hstackBox(dhcID));
            this.html.pianoTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.pianoBox(dhcID));
            this.html.dhcTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.dhcBox(dhcID, hrmID));
            this.html.synthTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.synthBox(dhcID, hrmID));
            this.html.midiTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.midiBox(dhcID, hrmID));

            this.html.appContainer.appendChild(HUM.tmpl.midiModal(dhcID));
            this.html.appContainer.appendChild(HUM.tmpl.keymapModal(dhcID));
            
            this.html.fmTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.fmBox(dhcID));
            this.html.ftTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.ftBox(dhcID));
            this.html.htTab[dhcID].children[1].children[0].appendChild(HUM.tmpl.htBox(dhcID));

            dhcAccordion.children[0].appendChild(this.html.synthTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.midiTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.pianoTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.dhcTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.fmTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.ftTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.htTab[dhcID]);
            dhcAccordion.children[0].appendChild(this.html.hstackTab[dhcID]);

            this.html.sideMenu.children[0].appendChild(dhcAccordion);

            this.components.availableDHCs[id] = new HUM.DHC(dhcID, id, this);

        }       
    }

    /**
     * Recompute the drawn geometries in all the components that need to be resized
     *     accordingly to the reference HTML container's dimensions
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
        //         why -1 andd -7 works ??

        // this.viewportDim.x = window.innerWidth - 1;
        // this.viewportDim.y = window.innerHeight - 1;

        this.viewportDim.x = document.documentElement.clientWidth - 1;
        this.viewportDim.y = document.documentElement.clientHeight - 7;
    }
}

HUM.prototype.Parameters = class {
    constructor(harmonicarium) {
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