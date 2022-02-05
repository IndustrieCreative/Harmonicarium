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
/* globals humPWA */

"use strict";

/** 
 * The BackendUtils class<br>
 *    A toolset to manage the backend UI.
 */
HUM.BackendUtils = class {
     /**
     * @param {HUM} harmonicarium - The HUM instance to which this DHC must refer
     */
    constructor(harmonicarium) {
        /**
        * The HUM instance
        *
        * @member {HUM}
        */
        this.harmonicarium = harmonicarium;
        /**
         * UI HTML elements
         *
         * @member {Object}
         * 
         * @property {Object.<string, HTMLElement>} fn  - Functional UI elements
         * @property {Object.<string, HTMLElement>} out - Output UI elements
         */
        this.uiElements = {
            fn: {
                logBtn: document.getElementById("HTMLf_openLogBtn"+harmonicarium.id),
                logPanel: document.getElementById("HTMLf_logPanel"+harmonicarium.id),
                logTest: document.getElementById("HTMLf_logTest"+harmonicarium.id),

                sidePanel: document.getElementById("HTMLf_sidePanel"+harmonicarium.id),
                sidePanel_content: document.getElementById("HTMLf_sidePanel_content"+harmonicarium.id),
                
                helpObj: document.getElementById("HTMLf_helpObj"+harmonicarium.id),
                creditsObj: document.getElementById("HTMLf_creditsObj"+harmonicarium.id),
                settings: document.getElementById("HTMLf_settingsObj"+harmonicarium.id),

                openHelp: document.getElementById("HTMLf_openHelp"+harmonicarium.id),
                openCredits: document.getElementById("HTMLf_openCredits"+harmonicarium.id),
                openApp: document.getElementById("HTMLf_openApp"+harmonicarium.id),
                closeSidePanel: document.getElementById("HTMLf_closeSidePanel"+harmonicarium.id),
                closeBtn: false,
                backBtn: false,

                appBox: document.getElementById("HTMLf_appBox"+harmonicarium.id),
                appInstall: document.getElementById("HTMLf_appInstall"+harmonicarium.id),
                appUpdateInfo: document.getElementById("HTMLf_appUpdateInfo"+harmonicarium.id),
                appUpdate: document.getElementById("HTMLf_appUpdate"+harmonicarium.id),
                appReset: document.getElementById("HTMLf_appReset"+harmonicarium.id),
                appOpen: document.getElementById("HTMLf_appOpen"+harmonicarium.id),


            },
            out: {
                /**
                 *  The global HTML Log element (common to all dhc instances)
                 *
                 * @type {HTMLElement}
                 */
                logText: document.getElementById("HTMLo_logText"+harmonicarium.id),
            },
        };
        this._initUI();

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Initialize the UI controllers
     */
    _initUI() {

        // LogText listeners
        this.uiElements.out.logText.innerHTML = "<p>>>>>>>>> > Welcome to the Harmonicarium!</p><p>...</p><p>..</p><p>.</p>";
        
        this.uiElements.fn.logBtn.addEventListener("click", () => this.toggleLogPanel() );
        this.uiElements.fn.logTest.addEventListener("click", () => this.tester() );

        // Menu Help & Credits listeners
        this.uiElements.fn.openHelp.addEventListener("click", () => this.showSidebarContent("help") );
        this.uiElements.fn.openCredits.addEventListener("click", () => this.showSidebarContent("credits") );
        this.uiElements.fn.openApp.addEventListener("click", () => this.showSidebarContent("app") );


        this.uiElements.fn.appOpen.setAttribute("style", "display: none;");
        if (window.matchMedia('(display-mode: standalone)').matches) {  // @todo - check also navigator.standalone for iOS (https://web.dev/customize-install/)
            this.uiElements.fn.appInstall.setAttribute("style", "display: none;");
        }  


        this.uiElements.fn.appInstall.addEventListener("click", () => this.appInstall() );
        this.uiElements.fn.appUpdate.addEventListener("click", () => this.appUpdate() );
        this.uiElements.fn.appReset.addEventListener("click", () => this.appReset() );


        this.uiElements.fn.closeBtn = HUM.tmpl.useIcon('closeCross', this.harmonicarium.id, this.uiElements.fn.closeSidePanel, -20, 0);
        this.uiElements.fn.backBtn = HUM.tmpl.useIcon('leftArrow', this.harmonicarium.id, this.uiElements.fn.closeSidePanel, 8, 0);

        this.uiElements.fn.closeBtn.addEventListener("click", () => this.showSidebar() );
        this.uiElements.fn.backBtn.addEventListener("click", () => this.showSidebarContent("settings") );

        this.uiElements.fn.closeBtn.setAttributeNS(null, 'preserveAspectRatio', 'xMinYMin meet');
        this.uiElements.fn.closeBtn.setAttributeNS(null, 'pointer-events', 'bounding-box');
        this.uiElements.fn.closeBtn.setAttributeNS(null, 'width', '100%');
        this.uiElements.fn.closeBtn.setAttributeNS(null, 'height', '100%');
        
        this.uiElements.fn.backBtn.setAttributeNS(null, 'preserveAspectRatio', 'xMinYMin meet');
        this.uiElements.fn.backBtn.setAttributeNS(null, 'pointer-events', 'bounding-box');
        this.uiElements.fn.backBtn.setAttributeNS(null, 'width', '100%');
        this.uiElements.fn.backBtn.setAttributeNS(null, 'height', '100%');

        // Log PC keyboard keypress events
        // Useful to avoid unwanted user inputs...
        // document.addEventListener('keydown', function(event) {
        //     console.log(event.keyCode);
        //     console.log(event.code);
        // });

    }

    appInstall() {
        if (humPWA.deferredPrompt !== false) {

            // Hide the app provided install promotion
            // hideMyInstallPromotion();
            // Show the install prompt
            humPWA.deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            humPWA.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    this.uiElements.fn.appInstall.setAttribute("style", "display: none;");
                } else {
                    console.log('User dismissed the install prompt');
                }
            });
        } else {
            let msg = 'The Harmonicarium App seems to be already installed.';
            
            if (!window.matchMedia('(display-mode: standalone)').matches) { // @todo - check also navigator.standalone for iOS (https://web.dev/customize-install/)
                msg += '\n\nIf you are on a MOBILE environment, try open the App by clicking on the button "Open the App".';
                msg += '\n\nIf you are on a DESKTOP environment, you should find the App in your installed apps list.';
                this.uiElements.fn.appOpen.setAttribute("style", "display: block;");
            }
            alert(msg);
        }

    }
    appUpdate() {
        humPWA.checkUpdates();
    }
    appReset() {
        humPWA.swAppReset();
    }


    /*==============================================================================*
     * UI EVENTS LOG
     *==============================================================================*/
    /**
     * Log into the HTML Log element the infos passed via the argument
     *
     * @param {string} str - Text string describing the event to log
     */
    eventLog(str) {
        let time = new Date();
        let s = time.getSeconds();
        let m = time.getMinutes();
        let h = time.getHours();
        if (h < 10) {h = "0" + h;}
        if (m < 10) {m = "0" + m;}
        if (s < 10) {s = "0" + s;}
        this.uiElements.out.logText.innerHTML = "<p>" + h + ":" + m + ":" + s + " > " + str + "</p>" + this.uiElements.out.logText.innerHTML;
        this.uiElements.out.logText.scrollTop = this.uiElements.out.logText.scrollHeight;
    }

    /**
     * Open the Event Log panel from the bottom and toggle the open/close button
     *
     * @param {Object} element - HTML element of the Event Log open/close button
     */
    toggleLogPanel() {
        //  onclick="icTESTER()"
        if (this.uiElements.fn.logBtn.classList.contains("panelShown")) {
            // Closed %
            this.uiElements.fn.logPanel.style.height = "0%";
        } else {
            // Open %
            this.uiElements.fn.logPanel.style.height = "35%";  
        }
        this.uiElements.fn.logBtn.classList.toggle("panelShown");
    }

    /*==============================================================================*
     * UI HELP/CREDITS
     *==============================================================================*/
    /**
     * Display the desired content in the side panel
     *
     * @param {('settings'|'help'|'credits')} type - The content to display
     */
     showSidebarContent(type) {
        let help = this.uiElements.fn.helpObj,
            credits = this.uiElements.fn.creditsObj,
            settings = this.uiElements.fn.settings,
            app = this.uiElements.fn.appBox;

        switch (type) {
            case "help":
                help.setAttribute("style", "display: block;");
                credits.setAttribute("style", "display: none;");
                settings.setAttribute("style", "display: none;");
                app.setAttribute("style", "display: none;");
                this.uiElements.fn.backBtn.style.display = 'block';
                this.uiElements.fn.sidePanel_content.scrollTo(0,0);
                break;
            case "credits":
                help.setAttribute("style", "display: none;");
                credits.setAttribute("style", "display: block;");
                settings.setAttribute("style", "display: none;");
                app.setAttribute("style", "display: none;");
                this.uiElements.fn.backBtn.style.display = 'block';
                this.uiElements.fn.sidePanel_content.scrollTo(0,0);
                break;
            case "settings":
                help.setAttribute("style", "display: none;");
                credits.setAttribute("style", "display: none;");
                settings.setAttribute("style", "display: block;");
                app.setAttribute("style", "display: none;");
                this.uiElements.fn.backBtn.style.display = 'none';
                this.uiElements.fn.sidePanel_content.scrollTo(0,0);
                break;
            case "app":
                help.setAttribute("style", "display: none;");
                credits.setAttribute("style", "display: none;");
                settings.setAttribute("style", "display: none;");
                app.setAttribute("style", "display: block;");
                this.uiElements.fn.backBtn.style.display = 'block';
                this.uiElements.fn.sidePanel_content.scrollTo(0,0);
                break;
            //default: 
        }
     }

    /**
     * Open the side panel
     */
    // @old icHelp
    showSidebar() {
        let sidePanel = this.uiElements.fn.sidePanel,
            dpPadPage = this.harmonicarium.html.dpPadPage;
        this.showSidebarContent("settings");

        if (sidePanel.classList.contains("panelShown")) {
            // Close %
           sidePanel.style.width = "0%";
           dpPadPage.style.width = "100%";
           // this.animateSidebar('close', 50, 50);
        } else {
            // Open %
            sidePanel.style.width = "50%"; 
            dpPadPage.style.width = '50%';
           // this.animateSidebar('open', 0, 100);
        }
        // this.harmonicarium.windowResize();
        this.harmonicarium.components.dpPad.windowResize();

        sidePanel.classList.toggle("panelShown");
    }

    // animateSidebar(action, counter, decounter) {
    //  if (action === 'open') {
    //      if(counter < 50){
    //          setTimeout( () => {
    //              counter += 4;
    //              decounter -= 4;
    //              this.uiElements.fn.sidePanel.style.width = counter+'%';
    //              this.harmonicarium.html.dpPadPage.style.width = decounter+'%';
    //              // this.harmonicarium.components.dpPad.windowResize();
    //              this.harmonicarium.windowResize();
    //              this.animateSidebar(action, counter, decounter);
    //          }, 18);
    //      } else {
    //          this.uiElements.fn.sidePanel.style.width = '50%';
    //          this.harmonicarium.html.dpPadPage.style.width = '50%';
    //          // this.harmonicarium.components.dpPad.windowResize();
    //          this.harmonicarium.windowResize();
    //      }
    //     } else {
    //      if(counter < 100){
    //          setTimeout( () => {
    //              counter += 4;
    //              decounter -= 4;
    //              this.uiElements.fn.sidePanel.style.width = decounter+'%';
    //              this.harmonicarium.html.dpPadPage.style.width = counter+'%';
    //              this.harmonicarium.components.dpPad.windowResize();
    //              // this.harmonicarium.windowResize();
    //              this.animateSidebar(action, counter, decounter);
    //          }, 18);
    //      } else {
    //          this.uiElements.fn.sidePanel.style.width = '0%';
    //          this.harmonicarium.html.dpPadPage.style.width = '100%';
    //          this.harmonicarium.components.dpPad.windowResize();
    //          // this.harmonicarium.windowResize();
    //      }
    //     }
    // }

    /*==============================================================================*
     * UI FILE READ ERROR HANDLING
     *==============================================================================*/

    /**
     * Handle errors generated by `FileReader` when loading a file.<br>
     * It is meant to be assigned to `FileReader.onerror` handler.
     *
     * @param {Event} errorEvent - The error event
     */
    fileErrorHandler(errorEvent) {
        switch (errorEvent.target.error.code) {
            case errorEvent.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
            case errorEvent.target.error.NOT_READABLE_ERR:
                alert('File is not readable.');
                break;
            case errorEvent.target.error.ABORT_ERR:
                break; // void
            default:
                alert('An error occurred reading this file.');
        }
    }

    /*==============================================================================*
     * TEST/DEBUG SECTION
     *==============================================================================*/
    /**
     * Print the DHC tone tables in the console for test/debug purposes
     */
    tester() {
        this.eventLog("TEST: Full tables printed out. Look at the console of your browser.");
        for (const [id, dhc] of Object.entries(this.harmonicarium.components.availableDHCs)) {
            // this.eventLog(JSON.stringify(dhc.tables.ft, null, 2).replace(/}|{|"|,/g, ''));
            console.log(`DHC ${id} 'ctrl_map' table:`, dhc.tables.ctrl);
            console.log(`DHC ${id} 'ft' table:`, dhc.tables.ft);
            console.log(`DHC ${id} 'ht' table:`, dhc.tables.ht);
            console.log(`DHC ${id} 'reverse ft' table:`, dhc.tables.reverse.ft);
            console.log(`DHC ${id} 'reverse ht' table:`, dhc.tables.reverse.ht);
        }
    }
};
