
/**
 * @fileoverview Parameters class for the Harmonicarium H-Stack visualizer.
 * This file defines the {@link HUM.Hstack.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to an
 * {@link HUM.Hstack} instance (active state, font size, FT row proxy, and HT
 * table proxy). It is split out from the main {@link module:hstack} module.
 *
 * @module hstack-parameters
 * @memberof HUM.Hstack
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
 * Container class for all {@link HUM.Param} objects belonging to an {@link HUM.Hstack} instance.
 *
 * @class
 * @memberof HUM.Hstack
 *
 * @description
 * Instantiates and holds the parameters that control the H-Stack panel:
 * visibility state (`active`), table font size (`fontSize`), and proxy
 * references to the FT row (`frow`) and HT table (`hstack`) DOM elements.
 */
HUM.Hstack.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given Hstack component.
     *
     * @param {HUM.Hstack} hstack - The Hstack instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the H-Stack panel:
     * - `active`: Tracks whether the H-Stack accordion tab is open.
     * - `fontSize`: Controls the font size of the H-Stack table rows.
     * - `frow`: Proxy for the FT monitor row DOM element.
     * - `hstack`: Proxy for the HT table and its dynamically built row elements.
     */
    constructor(hstack) {
        /**
         * This property controls the state of the H-Stack; if `false`, it is turned off in order to avoid
         * unuseful computations and uptates of the UI when the panel is closed.
         * It also initialises the eventListener of the UIelems related to it.
         * It's not stored on the DB.
         * NOTE: These uiElements are the same object because, given the current implementation of
         * Param.UIelem, it's not possible to set more event listeners using a single UIelem.
         *
         * @type {HUM.Param}
         *
         * @property {boolean}     value                         - The visibility one wants to achieve. If `false` the tab will be collapsed.
         * @property {Object}      uiElements                    - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn                 - Namespace for the "fn" HTML elements.
         * @property {HTMLElement} uiElements.fn.hstackTabShown  - The HTML of the H-Stack tab.
         * @property {HTMLElement} uiElements.fn.hstackTabHidden - The HTML of the H-Stack tab.
         */
        this.active = new HUM.Param({
            app: hstack,
            idbKey: 'hstackActive',
            uiElements: {
                'hstackTabShown': new HUM.Param.UIelem({
                    htmlID: hstack.dhc.harmonicarium.html.hstackTabs[hstack.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'collapse',
                    eventType: 'show.bs.collapse',
                    uiSet: (value) => {
                        if (value) {
                            this.active.bsCollapse.show();
                        } else {
                            this.active.bsCollapse.hide();
                        }
                    },
                    eventListener: evt => {
                        this.active.valueUI = true;
                    }
                }),
                'hstackTabHidden': new HUM.Param.UIelem({
                    htmlID: hstack.dhc.harmonicarium.html.hstackTabs[hstack.dhc.id].children[1].id,
                    role: 'fn',
                    opType: 'toggle',
                    widget: 'collapse',
                    eventType: 'hidden.bs.collapse',
                    uiSet: null,
                    eventListener: evt => {
                        this.active.valueUI = false;
                    }
                }),
            },
            init: false,
            dataType: 'boolean',
            initValue: false,
            presetStore: false,
            presetRestore: false,
            preInit: () => {
                // Create a Bootstrap collapsible controller
                this.active.bsCollapse = new bootstrap.Collapse('#'+hstack.dhc.harmonicarium.html.hstackTabs[hstack.dhc.id].children[1].id, {
                    toggle: this.active.value
                });
            },
            postSet: (value, thisParam, init) => {
                if (value) {
                    hstack.fillin();
                    hstack.ftMonitor(hstack.dhc.settings.ht.curr_ft);
                } else {
                    // Turn off all the tones currently active, if there are
                    for (let htNum of hstack.usedHT) {
                        hstack.playFx("ht", 0, htNum);
                    }
                    hstack.playFx("ft", 0, hstack.dhc.settings.ht.curr_ft);
                }

            }
        });
        /**
         * This property controls the font size of the H-Stack table and initialises the
         * eventListener of the UIelems related to it.
         * It's stored on the DB.
         *
         * @type {HUM.Param}
         *
         * @property {number}      value                          - The font size in pixels.
         * @property {Object}      uiElements                     - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.fn                  - Namespace for the "fn" HTML elements.
         * @property {Object}      uiElements.out                 - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.fn.hstack_zoom      - The HTML of the input slider widget for setting the font size.
         * @property {HTMLElement} uiElements.out.hstack_fontsize - The HTML of the output text showing the current font size.
         */
        this.fontSize = new HUM.Param({
            app: hstack,
            idbKey: 'hstackZoom',
            uiElements: {
                'hstack_zoom': new HUM.Param.UIelem({
                    role: 'fn',
                    opType: 'set',
                    eventType: 'input',
                    htmlTargetProp: 'value',
                    widget: 'range',
                }),
                'hstack_fontsize': new HUM.Param.UIelem({
                    role: 'out',
                })
            },
            dataType: 'float',
            initValue: 20,
            postSet: (value, thisParam) => {
                thisParam.uiElements.out.hstack_fontsize.style.fontSize = value + "px";
                thisParam.uiElements.fn.hstack_zoom.setAttribute("data-tooltip", value + "px");
            }
        });

        /**
         * This property is just a proxy for the HTML container of the FT row of the H-Stack.
         * It's not stored on the DB.
         *
         * @type {HUM.Param}
         *
         * @property {Object}      uiElements                 - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out             - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.hstackFTrow - The HTML of the H-Stack FT row.
         */
        this.frow = new HUM.Param({
            app: hstack,
            idbKey: 'hstackFtable',
            uiElements: {
                'hstackFTrow': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            init: false,
            dataType: 'array',
            presetStore: false,
            presetRestore: false,
        });

        /**
         * This property is just a proxy for the HTML containers of HT table and its rows.
         * It's not stored on the DB.
         *
         * @type {HUM.Param}
         *
         * @property {Object}      uiElements              - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}      uiElements.out          - Namespace for the "out" HTML elements.
         * @property {HTMLElement} uiElements.out.hstackHT - The HTML of the H-Stack HT table.
         * @property {HTMLElement} uiElements.out.rowsHT   - The HTML of the H-Stack HT rows.
         */
        this.hstack = new HUM.Param({
            app: hstack,
            idbKey: 'hstackHtable',
            uiElements: {
                'hstackHT': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'rowsHT': new HUM.Param.UIelem({
                    role: 'out',
                    namespace: true,
                }),
            },
            init: false,
            dataType: 'array',
            presetStore: false,
            presetRestore: false,
            postInit: (thisParam) => {
                /**
                 * Create the H-Stack HTML table 
                 */
                let dhcID = hstack.dhc.id,
                    hstackContainer = thisParam.uiElements.out.hstackHT,
                    hstackTable = document.createElement("table");
                
                hstackTable.className = "table table-sm";
                hstackTable.innerHTML = `
                    <thead class="table-light">
                        <tr>
                            <th colspan="4">Harmonics</th>
                        </tr>
                        <tr>
                            <th width="12%">HT</th>
                            <th width="20%">note</th>
                            <th width="25%">cents</th>
                            <th width="43%">Hz</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Here the HT rows -->
                    </tbody>`;
                // Store references to the column header cells for polyrhythm mode toggling.
                const htHeaderRow = hstackTable.querySelector('thead').rows[1];
                hstack._htNoteHead  = htHeaderRow.cells[1];
                hstack._htCentsHead = htHeaderRow.cells[2];
                hstack._htHzHead    = htHeaderRow.cells[3];
                hstack.updateUsedHT();
                
                thisParam.uiElements.out.rowsHT = {};
                for (let htNum of hstack.usedHT) {
                    let newRow = new hstack.HstackRow(htNum, dhcID);
                    thisParam.uiElements.out.rowsHT[htNum] = newRow;
                    hstackTable.children[1].appendChild(newRow.elemRow);
                }
                if (hstackContainer.firstChild) {
                    hstackContainer.removeChild(hstackContainer.firstChild);
                }
                hstackContainer.appendChild(hstackTable);
                
                hstack.fillin();
                hstack._syncPolyrhythmColumns();

            },
        });
    }
    /**
     * Initializes the `active` and `hstack` parameters.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on the `active` parameter to set up the Bootstrap
     * collapsible and its event listeners, then calls `_init()` on the
     * `hstack` parameter to build the HT table and populate it with rows.
     */
    _init() {
        this.active._init();
        this.hstack._init();
    }

};
