/**
 * @fileoverview Backend utilities and UI management for the Harmonicarium application.
 * This file defines the {@link HUM.BackendUtils} class which provides a toolset for
 * managing backend UI components including side panels, log panels, and modal
 * dialogs. The sub-components are defined in the companion file:
 * - {@link module:backend-utils-parameters} — `HUM.BackendUtils.prototype.Parameters` class
 *
 * @module backend-utils
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
 * Backend utilities and UI management class for the Harmonicarium application.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * The `HUM.BackendUtils` class provides a general-purpose toolset for managing
 * backend UI components. It handles:
 * - Side panel visibility and layout transitions
 * - Log panel toggling and event logging
 * - Modal dialog creation and lifecycle management
 * - File error handling for FileReader operations
 * - Debug utilities for inspecting DHC tone tables
 *
 * The {@link HUM.BackendUtils.prototype.Parameters|Parameters} inner class is
 * defined in the companion {@link module:backend-utils-parameters} file and
 * attached to `HUM.BackendUtils.prototype` at load time.
 */
HUM.BackendUtils = class {
    /**
     * Creates a new BackendUtils instance bound to the given HUM instance.
     *
     * @param {HUM} harmonicarium - The parent HUM instance that owns this backend utilities manager.
     *
     * @description
     * Initializes the backend utilities system by:
     * - Storing a reference to the parent HUM instance and its ID
     * - Assigning the component name for database parameter grouping
     * - Instantiating the parameter management system
     */
    constructor(harmonicarium) {
        /**
         * The id of this `HUM.BackendUtils`. It's the same of the HUM instance passed to the constructor.
         *
         * @member {number}
         */
        this.id = harmonicarium.id;
        this._id = harmonicarium.id;
        /**
         * The name of the `HUM.BackendUtils`, useful for group the parameters on the DB.
         * Currently hard-coded as `"backendUtils"`.
         *
         * @member {string}
         */
        this.name = 'backendUtils';
        /**
         * The HUM instance passed to the constructor.
         *
         * @member {HUM}
         */
        this.harmonicarium = harmonicarium;
        /**
         * Instance of `HUM.BackendUtils#Parameters`.
         *
         * @member {HUM.BackendUtils.prototype.Parameters}
         */
        this.parameters = new this.Parameters(this);

        // =======================
    } // end class Constructor
    // ===========================

    /**
     * Appends a timestamped entry to the HTML log panel.
     *
     * @param {string} str - Text string describing the event to log.
     *
     * @returns {void}
     *
     * @description
     * Prepends a new `<p>` element containing the current time (HH:MM:SS) and
     * the provided message to the log panel's innerHTML, then scrolls the
     * container to show the latest entry.
     */
    eventLog(str) {
        let time = new Date();
        let s = time.getSeconds();
        let m = time.getMinutes();
        let h = time.getHours();
        if (h < 10) {h = "0" + h;}
        if (m < 10) {m = "0" + m;}
        if (s < 10) {s = "0" + s;}
        let logText = this.parameters.logText.uiElements.out.logText;
        logText.innerHTML = "<p>" + h + ":" + m + ":" + s + " > " + str + "</p>" + logText.innerHTML;
        logText.parentElement.scrollTop = logText.scrollHeight;
    }

    /**
     * Toggles the visibility of the log panel between open and closed states.
     *
     * @returns {void}
     *
     * @description
     * Checks the current CSS state of the log close button to determine
     * whether the log panel is open or closed, then sets the `logPanel`
     * parameter value accordingly.
     */
    toggleLogPanel() {
        let logCloseBtn = this.parameters.logPanel.uiElements.fn.logCloseBtn;
        if (logCloseBtn.classList.contains('hum-modal-shown')) {
            // Closed %
            this.parameters.logPanel.value = 'closed';
        } else {
            // Open %
            this.parameters.logPanel.value = 'open';
        }
    }

    /**
     * Toggles the visibility of the side panel between shown and hidden states.
     *
     * @returns {void}
     *
     * @description
     * Determines the current side panel state and toggles it:
     * - For viewports smaller than 768 px in width, the panel alternates between
     *   `"full"` (covers the entire screen) and `"closed"`.
     * - For viewports bigger than 768 px in width, the panel alternates between
     *   `"half"` (occupies half the screen) and `"closed"`.
     */
    toggleSidebar() {
        let sidePanel = this.parameters.sidePanel.uiElements.out.sidePanel;
        if (sidePanel.classList.contains('hum-modal-shown')) {
            this.parameters.sidePanel.value = 'closed';
        } else {
            if (window.matchMedia("(min-width: 768px)").matches) {
                this.parameters.sidePanel.value = 'half';
            } else {
                this.parameters.sidePanel.value = 'full';
            }
        }
    }

    /**
     * Handles errors generated by `FileReader` when loading a file.
     *
     * @param {ProgressEvent} errorEvent - The error event fired by the `FileReader`.
     *
     * @returns {void}
     *
     * @description
     * Inspects `errorEvent.target.error.code` and dispatches the appropriate
     * user-facing alert or console message for the following error conditions:
     * file not found, file not readable, operation aborted, and any other
     * unexpected error.
     *
     * Intended to be assigned directly to `FileReader.onerror` handler.
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
                console.log('FILE: ABORT_ERR');
                break; // void
            default:
                alert('An error occurred reading this file.');
        }
    }

    /**
     * Prints all DHC tone tables to the browser console for test/debug purposes.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all available DHC instances and logs their internal
     * tables — `ctrl`, `ft`, `ht`, `reverse.ft`, and `reverse.ht` — as
     * collapsed console groups using `console.table()`. Also appends a
     * notification entry to the event log panel.
     */
    tester() {
        this.eventLog("TEST: Full tables printed out. Look at the console of your browser.");
        for (const [id, dhc] of Object.entries(this.harmonicarium.components.availableDHCs)) {
            // this.eventLog(JSON.stringify(dhc.tables.ft, null, 2).replace(/}|{|"|,/g, ''));
            console.groupCollapsed(`DHC ${id} 'ctrl_map' table (midi#, FTn, HTn):`);
            console.table(dhc.tables.ctrl);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'ft' table (FTn, Hz, midi#.cent):`);
            console.table(dhc.tables.ft);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'ht' table (HTn, Hz, midi#.cent):`);
            console.table(dhc.tables.ht);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'reverse ft' table (midi#.cent, FTn):`);
            console.table(dhc.tables.reverse.ft);
            console.groupEnd();
            console.groupCollapsed(`DHC ${id} 'reverse ht' table (midi#.cent, HTn):`);
            console.table(dhc.tables.reverse.ht);
            console.groupEnd();
        }
    }

    /**
     * Removes all child nodes from the given HTML element.
     *
     * @static
     *
     * @param {HTMLElement} htmlElem - The HTML element to empty.
     *
     * @returns {void}
     *
     * @description
     * Iteratively removes `firstChild` nodes until none remain, effectively
     * clearing the element's content without replacing its `innerHTML`.
     */
    static emptyHTMLElement(htmlElem) {
        while (htmlElem.firstChild) {
            htmlElem.removeChild(htmlElem.firstChild);
        }
    }
};
