/**
 * @fileoverview PadSet class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.PadSet|PadSet} class, which manages
 * the complete set of UI elements for one playable Diphonic Pad instance: an FT
 * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad}, an HT
 * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad}, and an SVG
 * {@link HUM.DpPad.PadSet.Toolbar|Toolbar}. It is split out from the main
 * {@link module:diphonicpad} module.
 *
 * @module diphonicpad-padset
 * @memberof HUM.DpPad
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
 * A single Diphonic Pad set, consisting of two canvas pads and an SVG toolbar.
 *
 * @class
 * @memberof HUM.DpPad
 * @static
 *
 * @description
 * `HUM.DpPad.PadSet` manages the complete set of UI elements for one
 * playable instance:
 * - An FT {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} that shows
 *   Fundamental Tones on a logarithmic canvas.
 * - An HT {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} that shows
 *   Harmonic Tones on a logarithmic canvas.
 * - A {@link HUM.DpPad.PadSet.Toolbar|Toolbar} rendered in an SVG element.
 *
 * It also registers itself with the DHC so it receives real-time update
 * callbacks (`updatesFromDHC`) whenever the fundamental or harmonic tone
 * data changes.
 *
 * @example
 * // PadSet is instantiated internally by HUM.DpPad.init()
 * const padSet = new HUM.DpPad.PadSet('1-0', 0, dpPadComponent, dhc);
 */
HUM.DpPad.PadSet = class {
    /**
     * Creates a new PadSet, builds all DOM/SVG elements, and initializes sub-components.
     *
     * @param {string}    setKey         - The ID key of the PadSet (e.g. `'1-0'`).
     * @param {number}    idx            - The sequential index of this PadSet within its DpPad.
     * @param {HUM.DpPad} dpPadComponent - The `HUM.DpPad` instance to which this PadSet must refer.
     * @param {HUM.DHC=}  dhc            - The DHC instance to be used by this PadSet.
     *                                     NOTE: If a DHC is passed, use that, else create its own DHC.
     *
     * @description
     * During construction this method:
     * 1. Creates and appends all container `<div>` and `<canvas>` elements
     *    to the DpPad container in the DOM.
     * 2. Creates the accordion tab HTML via `HUM.tmpl` and injects the
     *    Diphonic Pad settings box into the side panel.
     * 3. Instantiates the {@link HUM.DpPad.PadSet.prototype.Parameters|Parameters},
     *    FT and HT {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad}, and
     *    {@link HUM.DpPad.PadSet.Toolbar|Toolbar} objects.
     * 4. Calls `parameters._init()` and `arrangePads()` to finalize layout.
     * 5. Registers itself with the DHC for real-time callbacks at priority 101.
     *
     * @todo For `dhc` parameters, it's needed to check empty/available keys in
     *       `harmonicarium.availableDHCs`. The `setKey` currently can create
     *       conflicts with the main app if `dhc` is not provided.
     */
    constructor(setKey, idx, dpPadComponent, dhc=new HUM.DHC(setKey)) {
        let appDiv = dpPadComponent.harmonicarium.html.dpPadContainer,
            
            setDiv = document.createElement('div'),
            ftDiv = document.createElement('div'),
            htDiv = document.createElement('div'),
            tbarDiv = document.createElement('div'),
            
            ftSpectrogramCanvas = document.createElement('canvas'),
            htSpectrogramCanvas = document.createElement('canvas'),

            ftCanvas = document.createElement('canvas'),
            htCanvas = document.createElement('canvas'),
            tbarSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        setDiv.id = 'dpSet'+setKey;
        ftDiv.id = 'padFT'+setKey;
        htDiv.id = 'padHT'+setKey;
        tbarDiv.id = 'toolbar'+setKey;
        
        ftSpectrogramCanvas.id = 'spectrogramFT'+setKey;
        htSpectrogramCanvas.id = 'spectrogramHT'+setKey;

        ftCanvas.id = 'canvasFT'+setKey;
        htCanvas.id = 'canvaspadHT'+setKey;
        tbarSvg.id = 'svgToolbar'+setKey;
        
        setDiv.className = 'padSet';
        ftDiv.className = 'padFT';
        htDiv.className = 'padHT';
        tbarDiv.className = 'toolbar';
        ftSpectrogramCanvas.className = 'spectrogramPad';
        htSpectrogramCanvas.className = 'spectrogramPad';
        ftCanvas.className = 'canvasPad ';
        htCanvas.className = 'canvasPad';
        tbarSvg.setAttributeNS(null, 'class', 'toolbarPad');
        
        appDiv.appendChild(setDiv);
        setDiv.appendChild(ftDiv);
        setDiv.appendChild(htDiv);
        setDiv.appendChild(tbarDiv);
        // Spectrogram canvases go first (behind the main pad canvases in z-order).
        // Start at 0×0 so they take no space before resize() sets the correct dimensions.
        ftSpectrogramCanvas.width = 0;
        ftSpectrogramCanvas.height = 0;
        htSpectrogramCanvas.width = 0;
        htSpectrogramCanvas.height = 0;
        ftDiv.appendChild(ftSpectrogramCanvas);
        htDiv.appendChild(htSpectrogramCanvas);
        ftDiv.appendChild(ftCanvas);
        htDiv.appendChild(htCanvas);
        tbarDiv.appendChild(tbarSvg);
        
        // Create a new HTML element with UI backend and append it into the document
        let humID = dpPadComponent.harmonicarium.id;
        let accordionTab = HUM.tmpl.accordionTab(setKey, 'dppad', 'Diphonic Pad ' + (dpPadComponent.padSets.length > 1 ? setKey : ''), 'dppad', humID);
        accordionTab.children[1].children[0].appendChild(HUM.tmpl.dpPadBox(setKey, dhc.harmonicarium.id));
        dpPadComponent.harmonicarium.html.dpPadAccordion.children[0].appendChild(accordionTab);

        this.id = setKey;
        this._id = idx;
        this.name = 'padSet';
        this.dpPadComponent = dpPadComponent;

        this.dhc = !dhc ? new HUM.DHC(setKey) : dhc;

        this.uiElements = {
            fn: {
                accordionTab: accordionTab,
                appDiv: appDiv,
                setDiv: setDiv,
                ftDiv: ftDiv,
                htDiv: htDiv,
                tbarDiv: tbarDiv
            }
        };

        this.parameters = new this.Parameters(this);

        this.ft = new HUM.DpPad.PadSet.FrequencyPad('ft', this, ftCanvas);
        this.ht = new HUM.DpPad.PadSet.FrequencyPad('ht', this, htCanvas);
        this.toolbar = new HUM.DpPad.PadSet.Toolbar(this, tbarSvg);
        this.spectrogram = new HUM.DpPad.PadSet.Spectrogram(this, ftSpectrogramCanvas, htSpectrogramCanvas);
        
        this.parameters._init();

        this.arrangePads();
        // Tell to the DHC that a new app is using it
        this.dhc.registerApp(this, 'updatesFromDHC', 101);
        // Subscribe to BeatVoice pulse events so held pad keys flash in sync.
        this._boundPulseListener = (type, xtNum) => this[type].triggerPulseFlash(xtNum);
        this.dhc.synth.addPulseListener(this._boundPulseListener);
    }

    /**
     * Updates the frequency range of a pad type and refreshes its display.
     *
     * @param {tonetype}            type         - The pad type to update: `'ft'` or `'ht'`.
     * @param {string|false}        [ambitus]    - The ambitus preset key (e.g. `'tenore'`, `'custom'`) or
     *                                             `false` to keep the current preset and just re-apply it.
     * @param {('min'|'max'|false)} [target]     - Which range bound to modify when editing the custom preset.
     * @param {number|false}        [value]      - The new raw value (midicent for FT, hertz for HT) for `target`.
     * @param {boolean}             [copy=false] - When `true`, copies the range from the opposite pad type
     *                                             instead of applying a value directly.
     * @returns {void}
     *
     * @description
     * Depending on the combination of arguments this method:
     * - Loads and applies a named preset from `freqRange[type].ambitus.presets`.
     * - Modifies and temporarily stores a custom min or max value (FT in
     *   midicents, HT in hertz), with a special half-step correction for
     *   12-EDO layouts so the first/last key is fully visible.
     * - Shows or hides the "Save custom" button accordingly.
     * Always finalises by calling `refillFreqArrays()` and `drawFreqUI()`
     * on the affected pad.
     */
    updatePadRangeUI(type, ambitus=false, target=false, value=false, copy=false) {
        if (ambitus) {
            this.parameters.freqRange[type].ambitus._setValue(ambitus, { postSet: false });
        } else {
            // Init
            ambitus = this.parameters.freqRange[type].ambitus.value;
        }
        
        // Modify MAX or MIN range of the Custom preset slot
        if ((ambitus === 'custom' && !this.parameters.freqRange[type].ambitus.presets.custom && target) || (ambitus === 'custom' && target)) {
            this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_'+type].value = 'custom';
            this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = 'initial';
            if (type === 'ft') {
                let mcFT = Number(value);
            
                let ftStep = Math.round((mcFT % 1) * 10000000000) / 10000000000,
                    fmStep = Math.round((this.dhc.settings.fm.mc.value % 1) * 10000000000) / 10000000000;
                // FIT PAD RANGE: WORKS ONLY For 12-EDO
                // @todo - make ET universal (different unit ad divisions)
                if (this.dhc.settings.ft.selected.value === 'nEDx' &&
                    this.dhc.settings.ft.nEDx.unit.value === 2 &&
                    this.dhc.settings.ft.nEDx.division.value === 12 &&
                    ftStep === fmStep) {
                    // If the FT System is ET and the decimal part of the FM is the same as the
                    // input midicent value
                    let nEDxFixStepCent = (this.dhc.tables.ft[1].mc - this.dhc.tables.ft[0].mc) / 2;
                    // Add or remove 50 cents to draw the first/last FT key entirely
                    let mcFix = target === 'min' ? -nEDxFixStepCent : nEDxFixStepCent;

                    this.parameters.freqRange.ft[target]._setValue(this.addCentToHertz(HUM.DHC.mcToFreq(mcFT), mcFix), { fromUI: !copy, postSet: false });
                
                }  else {
                    this.parameters.freqRange.ft[target]._setValue(HUM.DHC.mcToFreq(mcFT), { fromUI: !copy, postSet: false });
                }
                
                this.parameters.freqRange.ft[target].mcValue = mcFT;
                this.parameters.freqRange.ft[target].uiElements.out['dppad_freq_range_custom_'+target+'_trad_ft'].innerText = this.dhc.mcToNameString(mcFT);
            

            } else if (type === 'ht') {
                let hzHT = Number(value);
                
                this.parameters.freqRange.ht[target]._setValue(hzHT, { postSet: false });
                
                this.parameters.freqRange.ht[target].uiElements.out['dppad_freq_range_custom_'+target+'_trad_ht'].innerText = this.dhc.mcToNameString(HUM.DHC.freqToMc(hzHT));
            }
        // If the CUSTOM ambitus PRESET is not saved/stored
        } else if (ambitus === 'custom' && !this.parameters.freqRange[type].ambitus.presets.custom && !target) {
            this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = 'initial';
        // Load STORED ambitus PRESET (also the Custom, if it has been saved)
        } else {
            let xtRange = this.parameters.freqRange[type].ambitus.presets[ambitus];
            this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = 'none';
            // this.parameters.freqRange[type].ambitus.uiElements.in['dppad_freq_range_custom_save_'+type].style.display = ambitus === 'custom' ? 'initial' : 'none';
            
            for (let presetTarget of ['min', 'max']) {
                let ftStep = Math.round((xtRange.mc[presetTarget] % 1) * 10000000000) / 10000000000,
                    fmStep = Math.round((this.dhc.settings.fm.mc.value % 1) * 10000000000) / 10000000000;
                // FIT PAD RANGE: WORKS ONLY For 12-EDO
                // @todo - make ET universal (different unit ad divisions)
                if (type === 'ft' &&
                    this.dhc.settings.ft.selected.value === 'nEDx' &&
                    this.dhc.settings.ft.nEDx.unit.value === 2 &&
                    this.dhc.settings.ft.nEDx.division.value === 12 &&
                    ftStep === fmStep) {
                    
                        // If the FT System is ET and the decimal part of the FM is the same as the
                        // input midicent value
                        let nEDxFixStepCent = (this.dhc.tables.ft[1].mc - this.dhc.tables.ft[0].mc) / 2;
                        // Add or remove 50 cents to draw the first/last FT key entirely
                        let mcFix = presetTarget === 'min' ? -nEDxFixStepCent : nEDxFixStepCent;
                        
                        this.parameters.freqRange.ft[presetTarget]._setValue(this.addCentToHertz(xtRange.hz[presetTarget], mcFix), { fromUI: true, postSet: false });

                }  else {
                        this.parameters.freqRange[type][presetTarget]._setValue(xtRange.hz[presetTarget], { fromUI: true, postSet: false });
                        // this.parameters.freqRange[type].min._setValue(xtRange.hz.min, { fromUI: true, postSet: false });
                        // this.parameters.freqRange[type].max._setValue(xtRange.hz.max, { fromUI: true, postSet: false });

                        // this.parameters.freqRange.ft[target].value = HUM.DHC.mcToFreq(mcFT);
                }
                
                if (type === 'ft') {
                    this.parameters.freqRange.ft[presetTarget].mcValue = xtRange.mc[presetTarget];
                }

                let unit = type === 'ft' ? 'mc' : 'hz';
                this.parameters.freqRange[type][presetTarget].uiElements.in[`dppad_freq_range_custom_${presetTarget}_${type}`].value = xtRange[unit][presetTarget];
                this.parameters.freqRange[type][presetTarget].uiElements.out[`dppad_freq_range_custom_${presetTarget}_trad_${type}`].innerText = this.dhc.mcToNameString(xtRange.mc[presetTarget]);
            }
        }
        this[type].refillFreqArrays();
        this[type].drawFreqUI();
    }

    /**
     * Shifts a frequency by a given number of cents and returns the new frequency.
     *
     * @param {hertz}  initFreq  - The starting frequency in hertz.
     * @param {number} addCents  - The number of cents to add (positive or negative).
     *
     * @returns {hertz} The frequency resulting from adding `addCents` to `initFreq`.
     *
     * @description
     * Converts `initFreq` to midicents, adds `addCents`, then converts back
     * to hertz. Used internally by
     * {@link HUM.DpPad.PadSet#updatePadRangeUI|updatePadRangeUI()} to widen
     * the pad range by half a step so the boundary keys are fully rendered.
     */
    addCentToHertz(initFreq, addCents) {
        let resCents = HUM.DHC.freqToMc(initFreq);
        resCents += addCents;
        return HUM.DHC.mcToFreq(resCents);
    }

    /**
     * Manages and routes an incoming message from the DHC.
     *
     * @param {HUM.DHCmsg} msg - The incoming DHC message to process.
     *
     * @returns {void}
     *
     * @description
     * Handles the following message commands:
     * - `init`: Re-fills all frequency arrays and redraws both pads.
     * - `panic`: Calls `allNotesOff()` on both FT and HT pads.
     * - `update/ft`: Redraws all pads targeted by the FT scale display setting.
     * - `update/ht`: Updates `currentFreq` from the play queue and redraws
     *   all pads targeted by the HT scale display setting.
     * - `tone-on/ft`: Sets `ft.currentFreq` and redraws the targeted FT pads.
     * - `tone-on/ht`: Sets `ht.currentFreq` (single note) and redraws HT pads.
     * - `tone-off/ft`: Redraws the targeted FT pads.
     * - `tone-off/ht`: Restores `ht.currentFreq` from the remaining play queue
     *   and redraws the targeted HT pads.
     */
    updatesFromDHC(msg) {
        if (msg.cmd === 'init') {
            for (let type of ['ft', 'ht']) {
                // @todo "updatePadRangeUI" is now commented because starts writing on parameters
                // of the pads ranges and this triggers the update of the value on the DB
                // eg. on changing the mc/hz accuracy or there is an incomin pitchbend message
                // However, it would be good to be able to update the frequency/monitor printed
                // at the bottom of the two pads, which doesn't happen anyway, when we 
                // execute "updatePadRangeUI".
                // this.updatePadRangeUI(type);
                
                // For now, we only execute the two methods already present at the
                // "updatePadRangeUI" bottom:
                this[type].refillFreqArrays();
                this[type].drawFreqUI();
            }
        }

        if (msg.cmd === 'panic') {
            this.ft.spectrogramHz = null;
            this.ht.spectrogramHzFormant = null;
            this.ft.allNotesOff();
            this.ht.allNotesOff();
        }

        if (msg.cmd === 'update') {
            if (msg.type === 'ft') {

                // When the spectrogram is silently driving the FT (continuum tracking),
                // clear the FT monitor so the pad looks fully "off" — no active frequency
                // shown, no key highlighted (curr_ft is already -1 at this point).
                if (msg.continuum === true) {
                    this.ft.currentFreq = 0;
                    this.ft.spectrogramHz = msg.hz;
                } else {
                    this.ft.spectrogramHz = null;
                }

                // For each target pad of the FT scale
                for (let targetPad of this.parameters.scaleDisplay.ft.value) {
                    // Do stuff for FT changes
                    this[targetPad].refillFreqArrays();
                    this[targetPad].drawFreqUI();
                }
            
            } else if (msg.type === 'ht') {

                // this.ht.currentFreq = this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz;
                
                // this.ht.currentFreq = this.dhc.playQueue.ht.length === 1 ?
                //     this.dhc.tables.ht[msg.xtNum].hz : 0;

                if (this.dhc.playQueue.ht.length <= 1) {
                    this.ht.currentFreq = this.dhc.settings.ht.curr_ht ? this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz : 0;
                } else if (this.dhc.playQueue.ht.length > 1) {
                    this.ht.currentFreq = 0; 
                }


                // For each target pad of the HT scale
                for (let targetPad of this.parameters.scaleDisplay.ht.value) {
                    // Do stuff for HT changes
                    this[targetPad].refillFreqArrays();
                    this[targetPad].drawFreqUI();
                }
            
            } else if (msg.type === 'ctrlmap') {
                // Do nothing at the moment
            } else if (msg.type === 'mode') {
                // Polyrhythm Mode toggled: re-render both pads so monitor labels switch Hz↔BPM.
                // When entering Polyrhythm Mode, also auto-apply the dedicated range presets.
                if (this.dhc.polyrhythmMode) {
                    this.updatePadRangeUI('ft', 'polyrhythm');
                    this.updatePadRangeUI('ht', 'polyrhythm');
                } else {
                    // Returning to Overtones mode: load the canonical voice presets.
                    this.updatePadRangeUI('ft', 'tenore');
                    this.updatePadRangeUI('ht', 'normal');
                }
            }
        
        } else if (msg.cmd === 'tone-on') {
            if (msg.type === 'ft') {

                this.ft.spectrogramHz = null;
                this.ft.currentFreq = this.dhc.tables.ft[msg.xtNum].hz;
                // this.ht.currentFreq = this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz;
                // this.ht.drawFreqMonitor();

                for (let targetPad of this.parameters.scaleDisplay.ft.value) {
                    // Do stuff for HT changes
                    // this[targetPad].canvasObjects.key.current.ht = data;
                    this[targetPad].drawFreqUI();
                }

            } else if (msg.type === 'ht') {
                
                if (msg.xtNum !== 0) {
                    this.ht.currentFreq = this.dhc.playQueue.ht.length === 1 ?
                        this.dhc.tables.ht[msg.xtNum].hz : 0;
                }
                
                // if (msg.xtNum !== 0) {
                //     this.ht.currentFreq = this.dhc.tables.ht[msg.xtNum].hz;
                // }

                for (let targetPad of this.parameters.scaleDisplay.ht.value) {
                    // Do stuff for HT changes
                    // this[targetPad].canvasObjects.key.current.ht = data;
                    this[targetPad].drawFreqUI();
                }

            }

        } else if (msg.cmd === 'tone-off') {
            if (msg.type === 'ft') {

                this.ft.spectrogramHz = null;
                for (let targetPad of this.parameters.scaleDisplay.ft.value) {
                    // Do stuff for HT changes
                    // this[targetPad].canvasObjects.key.current.ht = false;
                    this[targetPad].drawFreqUI();
                }

            } else if (msg.type === 'ht') {

                // if (msg.xtNum !== 0) {
                //     this.ht.currentFreq = this.dhc.playQueue.ht.length === 1 ?
                //         this.dhc.tables.ht[this.dhc.playQueue.ht[0].xtNum].hz : 0;
                // }

                if (this.dhc.playQueue.ht.length === 1) {
                    this.ht.currentFreq = this.dhc.tables.ht[this.dhc.playQueue.ht[0].xtNum].hz;
                } else if (this.dhc.playQueue.ht.length > 1) {
                    this.ht.currentFreq = 0; 
                }

                for (let targetPad of this.parameters.scaleDisplay.ht.value) {
                    // Do stuff for HT changes
                    // this[targetPad].canvasObjects.key.current.ht = false;
                    this[targetPad].drawFreqUI();
                }
            }
        }
    }
    
    /**
     * Re-inserts the FT, HT, and toolbar elements into the set container in
     * the correct order for the current layout configuration.
     *
     * @returns {void}
     *
     * @description
     * Reads `padsOrder`, `toolbarOrientation`, and `toolbarPosition` from the
     * PadSet parameters and re-appends the three child `<div>` elements
     * (`ftDiv`, `htDiv`, `tbarDiv`) to `setDiv` in the computed order.
     * Also adjusts the toolbar `float` style for the edge case where the
     * layout is horizontal-transversal with the toolbar at the bottom.
     */
    arrangePads() {
        let setDiv = this.uiElements.fn.setDiv,
            padsDiv = {
                ft: this.uiElements.fn.ftDiv,
                ht: this.uiElements.fn.htDiv
            },

        tbarDiv = this.uiElements.fn.tbarDiv,

        padsOrder = this.parameters.padsOrder.value, // ['ft', 'ht']
        tbOrientation = this.parameters.toolbarOrientation.value,
        tbPosition = this.parameters.toolbarPosition.value[tbOrientation];
                        //   longitudinal: 1, // 0, 1, 2 (pre, mid, post)
                        //   transversal: 0, // 0, 2 (pre, post)
        
        let currentOrder = [ padsDiv[padsOrder[0]], padsDiv[padsOrder[1]] ];
        currentOrder.splice(tbPosition, 0, tbarDiv);

        for (let elem of currentOrder) {
            setDiv.appendChild(elem);
        }

        if (this.dpPadComponent.settings.orientation === 'horizontal' && tbOrientation === 'transversal' && tbPosition === 2) {
            tbarDiv.style.float = 'none';
        } else {
            tbarDiv.style.float = 'left';
        }
    }
    
    /**
     * Inverts the visual order of the FT and HT pads and mirrors key positions.
     *
     * @param {boolean} [alreadyInverted=false] - Pass `true` when the parameter
     *   has already been updated externally, to skip the value toggle and only
     *   apply the visual changes.
     *
     * @returns {void}
     *
     * @description
     * Toggles `padsOrder` between `['ft','ht']` and `['ht','ft']`, mirrors
     * the `key.position` ratio for both pads (so keys appear on the opposite
     * edge), forces a parameter-changed notification to persist the new
     * ratios, redraws both pads, and calls `arrangePads()` to update the DOM.
     */
    invertPads(alreadyInverted) {
        if (!alreadyInverted) {
            let newValue = this.parameters.padsOrder.value[0] === 'ft' ? ['ht', 'ft'] : ['ft', 'ht'];
            this.parameters.padsOrder._setValue(newValue, { postSet: false });
        }
        // this.uiElements.in.pads_order.value = this.parameters.padsOrder.value[0] === 'ft' ? 'ftht' : 'htft';
        for (let type of ['ft', 'ht']) {
            this.parameters.canvasObjectsRatios[type].key.position = 1 - this.parameters.canvasObjectsRatios[type].key.position;
            // Workaround to save the ObjectsRatios registry
            this.parameters.canvasObjectsRatios._objValueModified();
            this[type].drawFreqUI();
        }
        this.arrangePads();
    }

    // setToolbarOrientation(value) {
    //     if (value !== this.parameters.toolbarOrientation.value) {
    //         this.parameters.toolbarOrientation.value = value;
    //         // Disable the 'mid' value if orientation is 'transversal'
    //         this.uiElements.in.toolbar_position.options[1].disabled = value === 'transversal' ? true : false;
    //         this.uiElements.in.toolbar_position.value = this.parameters.toolbarPosition.value[value];
    //         this.dpPadComponent.windowResize();
    //         this.arrangePads();
    //     } else {
    //         return;
    //     }
    // }

    /**
     * Cycles the toolbar through all valid positions and orientations in sequence.
     *
     * @returns {void}
     *
     * @description
     * The toolbar can be longitudinal (side) at positions 0, 1, 2 or transversal
     * (top/bottom) at positions 0 or 2. This method advances the position by one
     * step in the current orientation; when the last longitudinal position is
     * reached it switches to transversal, and vice-versa. Forces a
     * parameter-changed notification, triggers a full resize, and calls
     * `arrangePads()` to update the DOM order.
     */
    switchToolbarPosition() {
        let tbPosLong = this.parameters.toolbarPosition.value.longitudinal,
            tbPosTras = this.parameters.toolbarPosition.value.transversal;
        if (this.parameters.toolbarOrientation.value === 'longitudinal') {
            if (tbPosLong < 2) {
                this.parameters.toolbarPosition.value.longitudinal++;
            } else {
                this.parameters.toolbarOrientation.value = 'transversal';
                this.parameters.toolbarPosition.value.transversal = 0;
            }
        } else if (this.parameters.toolbarOrientation.value === 'transversal') {

            if (tbPosTras === 0) {
                this.parameters.toolbarPosition.value.transversal = 2;
            } else {
                this.parameters.toolbarOrientation.value = 'longitudinal';
                this.parameters.toolbarPosition.value.longitudinal = 0;
            }
        }
        // Force the set method on the param since the value is an object
        // that has just been modified above directly.
        this.parameters.toolbarPosition._objValueModified();
        this.dpPadComponent.windowResize();
        this.arrangePads();
    }

};
