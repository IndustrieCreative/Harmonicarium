/**
 * @fileoverview Parameters class for the Harmonicarium HUM top-level class.
 * This file defines the {@link HUM.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM} instance (splash screen modal management). It is split out
 * from the main {@link module:harmonicarium} module.
 *
 * @module harmonicarium-parameters
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

"use strict";

/**
 * Container class for all {@link HUM.Param} objects belonging to a {@link HUM} instance.
 *
 * @class
 * @memberof HUM
 *
 * @description
 * Instantiates and holds the parameters that control the top-level HUM UI:
 * splash screen modal management (`splashModal`).
 */
HUM.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given HUM instance.
     *
     * @param {HUM} harmonicarium - The HUM instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the Harmonicarium:
     * - `splashModal`: Controls the Bootstrap modal displayed during initialization.
     */
    constructor(harmonicarium) {
        /**
         * This property controls the splash screen modal displayed during application
         * initialization. It's not stored on the DB.
         *
         * @member {HUM.Param}
         *
         * @property {Object}          uiElements                    - Namespace for the "in", "out" and "fn" objects.
         * @property {Object}          uiElements.out                - Namespace for the "out" HTML elements.
         * @property {HTMLElement}     uiElements.out.splashModal    - The HTML splash screen modal element.
         * @property {bootstrap.Modal} bsModal                       - Bootstrap Modal controller instance attached by `postInit`.
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
