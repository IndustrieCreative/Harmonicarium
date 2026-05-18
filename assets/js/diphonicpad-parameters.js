/**
 * @fileoverview Parameters class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.PadSet.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.DpPad.PadSet|PadSet} instance (layout, scale display, frequency
 * ranges, canvas object ratios, fonts, and scale orientations). It is split out
 * from the main {@link module:diphonicpad} module.
 *
 * @module diphonicpad-parameters
 * @memberof HUM.DpPad.PadSet
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
 * Container class for all {@link HUM.Param} objects belonging to a
 * {@link HUM.DpPad.PadSet|PadSet} instance.
 *
 * @class
 * @memberof HUM.DpPad.PadSet
 *
 * @description
 * Instantiates and holds every configurable parameter of the PadSet:
 * - **Layout**: `main_orientation`, `renderMode`, `padsOrder`, `toolbarOrientation`,
 *   `toolbarPosition`, `toolbarIconOrder`, `padsRatio`, `tbLong`.
 * - **Scale display**: `scaleDisplay.ft`, `scaleDisplay.ht`.
 * - **Frequency ranges**: `freqRange.ft.{ambitus,min,max}`,
 *   `freqRange.ht.{ambitus,min,max}`.
 * - **Canvas object ratios**: `canvasObjectsRatios` (key length/position,
 *   label positions, HZ-monitor anchor).
 * - **Fonts**: `fonts.{ft,ht}.{hzMonitor,keyLabel}`,
 *   `fonts.ht.lineLabel`.
 * - **Scale orientations**: `scaleOrientation.ft`, `scaleOrientation.ht`.
 */
HUM.DpPad.PadSet.prototype.Parameters = class {
    /**
     * Creates all parameters for the given PadSet.
     *
     * @param {HUM.DpPad.PadSet} padSet - The parent PadSet instance.
     *
     * @description
     * Every `HUM.Param` is constructed here with its IDB key, allowed
     * values, initial value, and the UI element descriptors that wire it
     * to the DOM. Heavy initialisation (Bootstrap collapsible setup, initial
     * DOM writes) is deferred to `_init()`.
     */
    constructor(padSet) {
        this.padSet = padSet;
        /*   __   ____  ____ 
            *  / _\ (  _ \(  _ \
            * /    \ ) __/ ) __/
            * \_/\_/(__)  (__)
            */
        // NOTE: this is just a copy of the value on HUM.DpPad.PadSet.settings.orientation
        this.main_orientation = new HUM.Param({
            app:padSet,
            idbKey:'padsetMainOrientation',
            // restoreStage:'pre',
            uiElements:{
                'dppad_main_orientation': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                })
            },
            dataType:'string',
            initValue: padSet.dpPadComponent.settings.orientation,
            allowedValues: ['horizontal', 'vertical'],
            postSet: (value) => {
                // Set the value on the dpPadComponent, that is where the
                // setting is actually read
                padSet.dpPadComponent.rotateView(value);
                return value;
            }
        });
        this.renderMode = new HUM.Param({
            app:padSet,
            idbKey:'padsetRenderMode',
            uiElements:{
                'dppad_render_mode': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                })
            },
            dataType:'string',
            initValue: 'hidpi',
            allowedValues: ['classic', 'hidpi'],
            postSet: (value) => {
                padSet.dpPadComponent.windowResize();
            }
        });
        /*  ____  ____  ____ 
            * / ___)(  __)(_  _)
            * \___ \ ) _)   )(  
            * (____/(____) (__)
        */
        // @todo: other sets' pads as target (eg. ft0, ft3, ht2) ??
        this.scaleDisplay = {
            ft: new HUM.Param({
                app:padSet,
                idbKey:'padsetScaleDisplayFT',
                uiElements:{
                    'dppad_scale_display_ft': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'toggle',
                        eventType: 'change',
                        htmlTargetProp:'checked',
                        widget:'checkbox',
                        uiSet: (value, thisParam) => {
                            thisParam.uiElements.in.dppad_scale_display_ft.checked = value.includes('ht') ? true : false;
                        },
                        eventListener: (evt) => {
                            if (evt.target.checked) {
                                this.scaleDisplay.ft.valueUI = ['ft', 'ht'];
                            } else {
                                this.scaleDisplay.ft.valueUI = ['ft'];
                            }
                        }
                    })
                },
                dataType:'array',
                initValue:['ft'],
                postSet: (value, thisParam, init) => {
                    if (!init) {
                        padSet.ht.refillFreqArrays();
                        padSet.ht.drawFreqUI();
                    }
                }
            }),
            ht: new HUM.Param({
                app:padSet,
                idbKey:'padsetScaleDisplayHT',
                uiElements:{
                    'dppad_scale_display_ht': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'toggle',
                        eventType: 'change',
                        htmlTargetProp:'checked',
                        widget:'checkbox',
                        uiSet: (value, thisParam) => {
                            thisParam.uiElements.in.dppad_scale_display_ht.checked = value.includes('ft') ? true : false;
                        },
                        eventListener: (evt) => {
                            if (evt.target.checked) {
                                this.scaleDisplay.ht.valueUI = ['ht', 'ft'];
                            } else {
                                this.scaleDisplay.ht.valueUI = ['ht'];
                            }
                        }
                    })
                },
                dataType:'array',
                initValue:['ht'],
                postSet: (value, thisParam, init) => {
                    if (!init) {
                        padSet.ft.refillFreqArrays();
                        padSet.ft.drawFreqUI();
                    }
                }
            }),
        };
        this.padsOrder = new HUM.Param({
            app:padSet,
            idbKey:'padsetPadsOrder',
            uiElements:{
                'dppad_pads_order': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                    uiSet: (value, thisParam) => {
                        thisParam.uiElements.in.dppad_pads_order.value = thisParam.value[0] === 'ft' ? 'ftht' : 'htft';
                    },
                    eventListener: (evt) => {
                        this.padsOrder.valueUI = evt.target.value === 'ftht' ? ['ft', 'ht'] : ['ht', 'ft'];
                    }
                })
            },
            dataType:'array',
            initValue: ['ft', 'ht'],
            // allowedValues: (['ft', 'ht'], ['ht', 'ft']),
            postSet: (value, thisParam, init, fromUI, oldValue) => {
                if (!init && (value[0] !== oldValue[0])) {
                    padSet.invertPads(true);
                }
            }
        });
        // @todo canvas FH/HT ratio calculator
        this.padsRatio = {
                ft: 0.5,
                ht: 0.5,
                tbLong: 0.1,
                tbTran: 0.1
        };

        /* ____  __    __   __    ____   __   ____ 
            *(_  _)/  \  /  \ (  )  (  _ \ / _\ (  _ \
            *  )( (  O )(  O )/ (_/\ ) _ (/    \ )   /
            * (__) \__/  \__/ \____/(____/\_/\_/(__\_)
            */
        this.toolbarPosition = new HUM.Param({
            app:padSet,
            idbKey:'padsetToolbarPosition',
            uiElements:{
                'dppad_toolbar_position': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                    uiSet: (value) => {
                        this.toolbarPosition.uiElements.in.dppad_toolbar_position.value = value[this.toolbarOrientation.value];
                    },
                    eventListener: (evt) => {
                        this.toolbarPosition.value[this.toolbarOrientation.value] = Number(evt.target.value);
                        this.toolbarPosition.valueUI = this.toolbarPosition.value;
                    }
                })
            },
            dataType:'object',
            initValue: {
                longitudinal: 1, // 0, 1, 2 (pre, mid, post)
                transversal: 2 // 0, 2 (pre, post)
            },
            init: false,
            // allowedValues: [],
            postSet: (value) => {
                // if (!init) {
                    padSet.arrangePads();
                // }
            }
        });

        // 'longitudinal' or 'transversal' (related to this.settings.orientation)
        this.toolbarOrientation = new HUM.Param({
            app:padSet,
            idbKey:'padsetToolbarOrientation',
            uiElements:{
                'dppad_toolbar_orientation': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                })
            },
            dataType:'string',
            initValue: 'longitudinal',
            init: false,
            allowedValues: ['longitudinal', 'transversal'],
            postSet: (value, thisParam, init) => {
                // if (!init) {
                    // Disable the 'mid' value if orientation is 'transversal'
                    this.toolbarPosition.uiElements.in.dppad_toolbar_position.options[1].disabled = value === 'transversal' ? true : false;
                    this.toolbarPosition.uiElements.in.dppad_toolbar_position.value = this.toolbarPosition.value[value];
                    padSet.dpPadComponent.windowResize();
                    padSet.arrangePads();
                // }
            }
        });
        this.toolbarDefaultIcons = [
            'menu',
            'rotateView',
            'toolbarPos',
            'invertPads',
            'rotateFT',
            'rotateHT',
            'textIncrease',
            'textDecrease',
            'piper',
            'panic',
            'openLog'
        ];
        this.toolbarIconOrder = new HUM.Param({
            app:padSet,
            idbKey:'padsetToolbarIconOrder',
            uiElements: (() => {
                let res = {};
                this.toolbarDefaultIcons.forEach((iconName, iconIndex) => {
                    res['toolbar_icon_'+iconName+'_switch'] = new HUM.Param.UIelem({
                        role: 'in',
                        opType:'toggle',
                        eventType: 'change',
                        htmlTargetProp:'checked',
                        widget:'checkbox',
                        uiSet: (value, thisParam) => {
                            thisParam.uiElements.in['toolbar_icon_'+iconName+'_switch'].checked = value.includes(iconName) ? true : false;
                        },
                        eventListener: (evt) => {
                            if (evt.target.checked) {
                                let hiddenIcons = this.toolbarDefaultIcons.filter(x => !this.toolbarIconOrder.value.includes(x));
                                hiddenIcons = hiddenIcons.filter(str => str !== iconName);
                                let newIcons = this.toolbarDefaultIcons.filter(x => !hiddenIcons.includes(x));
                                this.toolbarIconOrder.valueUI = newIcons;
                            } else {
                                this.toolbarIconOrder.valueUI = this.toolbarIconOrder.value.filter(str => str !== iconName);
                            }
                        },
                    });
                });
                return res;
            })(),
            dataType:'array',
            initValue: JSON.parse(JSON.stringify(this.toolbarDefaultIcons)),
            postSet: (value, thisParam, init) => {
                if (!init) {
                    padSet.toolbar.drawIcons(true);
                }
            },
        });
           /*  ____   __   ____ 
            * (  _ \ / _\ (    \
            *  ) __//    \ ) D (
            * (__)  \_/\_/(____/
            */
        this.fonts = {
            ft: {
                // PAD
                hzMonitor: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFontFTHzMonitor',
                    uiElements:{
                        'dppad_fontsize_hzMonitor_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            paramTargetProp:'size',
                            widget:'number',
                            uiSet: null
                        })
                    },
                    dataType:'object',
                    initValue: new HUM.DpPad.CssFont('italic', 'bold', 20, 'px', false, false),
                    init:false,
                    postInit: (thisParam) => {
                        thisParam.size = thisParam.value.size;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ft.drawFreqUI();
                        }
                    },
                    preRestore: value => {
                        return new HUM.DpPad.CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                    },
                    postRestore: value => {
                        this.fonts.ft.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ft.value = value.size;
                    },
                    customSetGet: {
                        size: {
                            set: (value) => {
                                this.fonts.ft.hzMonitor.value.size = value;
                                this.fonts.ft.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ft.value = value;
                                this.fonts.ft.hzMonitor._objValueModified();
                            },
                            get: (value) => {
                                return this.fonts.ft.hzMonitor.value.size;
                            },
                        },
                    }
                }),
                // noteMonitor: new HUM.Param({}),
                // SCALE
                // lineLabel: new HUM.Param({}),
                keyLabel: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFontFTKeyLabel',
                    uiElements:{
                        'dppad_fontsize_keyLabel_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            paramTargetProp:'size',
                            widget:'number',
                            uiSet: null
                        })
                    },
                    dataType:'object',
                    initValue: new HUM.DpPad.CssFont(false, 'bold', 100, '%', false, false),
                    init:false,
                    postInit: (thisParam) => {
                        thisParam.size = thisParam.value.size;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ft.drawFreqUI();
                        }
                    },
                    preRestore: value => {
                        return new HUM.DpPad.CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                    },
                    postRestore: value => {
                        this.fonts.ft.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ft.value = value.size;
                    },
                    customSetGet: {
                        size: {
                            set: (value) => {
                                this.fonts.ft.keyLabel.value.size = value;
                                this.fonts.ft.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ft.value = value;
                                this.fonts.ft.keyLabel._objValueModified();
                            },
                            get: (value) => {
                                return this.fonts.ft.keyLabel.value.size;
                            },
                        },
                    }
                }),
            },
            ht: {
                // PAD
                hzMonitor: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFontHTHzMonitor',
                    uiElements:{
                        'dppad_fontsize_hzMonitor_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            paramTargetProp:'size',
                            widget:'number',
                            uiSet: null
                        })
                    },
                    dataType:'object',
                    initValue: new HUM.DpPad.CssFont('italic', 'bold', 20, 'px', false, false),
                    init:false,
                    postInit: (thisParam) => {
                        thisParam.size = thisParam.value.size;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ht.drawFreqUI();
                        }
                    },
                    preRestore: value => {
                        return new HUM.DpPad.CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                    },
                    postRestore: value => {
                        this.fonts.ht.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ht.value = value.size;
                    },
                    customSetGet: {
                        size: {
                            set: (value) => {
                                this.fonts.ht.hzMonitor.value.size = value;
                                this.fonts.ht.hzMonitor.uiElements.in.dppad_fontsize_hzMonitor_ht.value = value;
                                this.fonts.ht.hzMonitor._objValueModified();
                            },
                            get: (value) => {
                                return this.fonts.ht.hzMonitor.value.size;
                            },
                        },
                    }
                }),
                // noteMonitor: new HUM.Param({}),
                // SCALE
                lineLabel: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFontHTLineLabel',
                    uiElements:{
                        'dppad_fontsize_lineLabel_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            paramTargetProp:'size',
                            widget:'number',
                            uiSet: null
                        })
                    },
                    dataType:'object',
                    initValue: new HUM.DpPad.CssFont('italic', 'bold', 90, '%', false, false),
                    init:false,
                    postInit: (thisParam) => {
                        thisParam.size = thisParam.value.size;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ht.drawFreqUI();
                        }
                    },
                    preRestore: value => {
                        return new HUM.DpPad.CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                    },
                    postRestore: value => {
                        this.fonts.ht.lineLabel.uiElements.in.dppad_fontsize_lineLabel_ht.value = value.size;
                    },
                    customSetGet: {
                        size: {
                            set: (value) => {
                                this.fonts.ht.lineLabel.value.size = value;
                                this.fonts.ht.lineLabel.uiElements.in.dppad_fontsize_lineLabel_ht.value = value;
                                this.fonts.ht.lineLabel._objValueModified();
                            },
                            get: (value) => {
                                return this.fonts.ht.lineLabel.value.size;
                            },
                        },
                    }
                }),
                keyLabel: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFontHTKeyLabel',
                    uiElements:{
                        'dppad_fontsize_keyLabel_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            widget:'number',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            paramTargetProp:'size',
                            uiSet: null
                        })
                    },
                    dataType:'object',
                    initValue: new HUM.DpPad.CssFont(false, 'bold', 100, '%', false, false),
                    init:false,
                    postInit: (thisParam) => {
                        thisParam.size = thisParam.value.size;
                    },
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.ht.drawFreqUI();
                        }
                    },
                    preRestore: value => {
                        return new HUM.DpPad.CssFont(...['style', 'weight', 'size', 'unit', 'family', 'color'].map(k => value[k]));
                    },
                    postRestore: value => {
                        this.fonts.ht.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ht.value = value.size;
                    },
                    customSetGet: {
                        size: {
                            set: (value) => {
                                this.fonts.ht.keyLabel.value.size = value;
                                this.fonts.ht.keyLabel.uiElements.in.dppad_fontsize_keyLabel_ht.value = value;
                                this.fonts.ht.keyLabel._objValueModified();
                            },
                            get: (value) => {
                                return this.fonts.ht.keyLabel.value.size;
                            },
                        },
                    }
                }),
            },
        };
        this.scaleOrientation = {
            ft: new HUM.Param({
                app:padSet,
                idbKey:'padsetScaleOrientationFT',
                uiElements:{
                    'dppad_scale_orientation_ft': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue: 'vertical',
                allowedValues: ['horizontal', 'vertical'],
                postSet: (value, thisParam, init) => {
                    if (!init) {
                        padSet.ft.drawFreqUI();
                    }
                }
            }),
            ht: new HUM.Param({
                app:padSet,
                idbKey:'padsetScaleOrientationHT',
                uiElements:{
                    'dppad_scale_orientation_ht': new HUM.Param.UIelem({
                        role: 'in',
                        opType:'set',
                        eventType: 'change',
                        htmlTargetProp:'value',
                        widget:'selection',
                    })
                },
                dataType:'string',
                initValue: 'vertical',
                allowedValues: ['horizontal', 'vertical'],
                postSet: (value, thisParam, init) => {
                    if (!init) {
                        padSet.ht.drawFreqUI();
                    }
                }
            }),
        };
        this.freqRange = {
            ft: {
                ambitus: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFreqRangeFTAmbitus',
                    uiElements:{
                        'dppad_freq_range_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        }),
                        'dppad_freq_range_custom_save_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'click',
                            htmlTargetProp:'checked',
                            widget:'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                let min = this.freqRange.ft.min.value,
                                    max = this.freqRange.ft.max.value;
                                this.freqRange.ft.ambitus.presets.custom = new HUM.DpPad.VoiceAmbitus('ft', 'Custom', 'hz', min, max, padSet.dhc);
                                this.freqRange.ft.ambitus.uiElements.in.dppad_freq_range_custom_save_ft.style.display = 'none';
                                // Force the DB to store the param
                                this.padSet.dhc.harmonicarium.components.user.presetServiceDB.updateParam(
                                    this.padSet.dhc.harmonicarium.components.user.session.id,
                                    this.freqRange.ft.ambitus.idbKeyPath,
                                    'live');
                            }
                        }),
                        'dppad_freq_range_copy_to_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'click',
                            htmlTargetProp:'checked',
                            widget:'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                padSet.updatePadRangeUI('ft', 'custom', 'min', HUM.DHC.freqToMc(this.freqRange.ht.min.value), true);
                                padSet.updatePadRangeUI('ft', 'custom', 'max',  HUM.DHC.freqToMc(this.freqRange.ht.max.value), true);
                                this.freqRange.ft.max.uiElements.in.dppad_freq_range_custom_max_ft.value = HUM.DHC.freqToMc(this.freqRange.ht.max.value);
                                this.freqRange.ft.min.uiElements.in.dppad_freq_range_custom_min_ft.value = HUM.DHC.freqToMc(this.freqRange.ht.min.value);
                            }
                        })
                    },
                    dataType:'string',
                    restoreStage:'post',
                    initValue: 'tenore', // 4 octaves + 3 tones
                    init:false,
                    allowedValues: ['soprano', 'mezzosoprano', 'contralto', 'controtenore', 'tenore', 'baritono', 'basso', 'bassoprofondo', 'custom'],
                    preInit: (thisParam) => {
                        this._freqRangeInit('ft', thisParam.uiElements.in.dppad_freq_range_ft);
                    },
                    postSet: (value, thisParam, init, fromUI) => {
                        // if (!fromUI) {
                            padSet.updatePadRangeUI('ft', value);
                        // }
                    },
                    customPropertiesStore: () => {
                        let customProperties = {presets:{}};
                        for( const [vName, vAmb] of Object.entries(this.freqRange.ft.ambitus.presets)) {
                            customProperties.presets[vName] = [vAmb.type, vAmb.name, 'scientific', vAmb.note.min, vAmb.note.max];
                        }
                        return customProperties;

                    },
                    customPropertiesRestore: (storedCustomProps) => {
                        let customProperties = {presets:{}};
                        for( const [vName, vAmb] of Object.entries(storedCustomProps.presets)) {
                            customProperties.presets[vName] = new HUM.DpPad.VoiceAmbitus(...vAmb, this.padSet.dhc);
                        }
                        return customProperties;
                    },
                    customProperties: {
                        presets: {
                            soprano: new HUM.DpPad.VoiceAmbitus('ft', 'Soprano', 'scientific', 'C4', 'C6', padSet.dhc),
                            mezzosoprano: new HUM.DpPad.VoiceAmbitus('ft', 'Mezzo-soprano', 'scientific', 'A3', 'A5', padSet.dhc),
                            contralto: new HUM.DpPad.VoiceAmbitus('ft', 'Alto', 'scientific', 'F3', 'F5', padSet.dhc),
                            controtenore: new HUM.DpPad.VoiceAmbitus('ft', 'Countertenor', 'scientific', 'E3', 'E5', padSet.dhc),
                            tenore: new HUM.DpPad.VoiceAmbitus('ft', 'Tenor', 'scientific', 'C3', 'C5', padSet.dhc),
                            baritono: new HUM.DpPad.VoiceAmbitus('ft', 'Baritone', 'scientific', 'A2', 'A4', padSet.dhc),
                            basso: new HUM.DpPad.VoiceAmbitus('ft', 'Bass', 'scientific', 'E2', 'E4', padSet.dhc),
                            bassoprofondo: new HUM.DpPad.VoiceAmbitus('ft', 'Basso profondo', 'scientific', 'C2', 'C4', padSet.dhc),
                        }
                    }
                }),
                max: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFreqRangeFTMax',
                    uiElements:{
                        'dppad_freq_range_custom_max_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'number',
                        }),
                        'dppad_freq_range_custom_max_trad_ft': {
                            role: 'out'
                        }
                    },
                    dataType:'float',
                    // initValue: 340, // 460, // 460,// 1200,
                    // preSet: (value) => {
                    //     value = 
                    // },
                    postSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                        if (!init || fromRestore) {
                            padSet.updatePadRangeUI('ft', 'custom', 'max', value);
                        }
                    },
                    presetGetValue: 'mcValue',
                    presetSetValue: 'value',
                    customProperties: {
                        mcValue: false
                    }
                }),
                min: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFreqRangeFTMin',
                    uiElements:{
                        'dppad_freq_range_custom_min_ft': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'number',
                        }),
                        'dppad_freq_range_custom_min_trad_ft': {
                            role: 'out'
                        }
                    },
                    dataType:'float',
                    // initValue: 85, //62,
                    postSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                        if (!init || fromRestore) {
                            padSet.updatePadRangeUI('ft', 'custom', 'min', value);
                        }
                    },
                    presetGetValue: 'mcValue',
                    presetSetValue: 'value',
                    customProperties: {
                        mcValue: false
                    }
                }),
            },
            ht: {
                ambitus: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFreqRangeHTAmbitus',
                    uiElements:{
                        'dppad_freq_range_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'selection',
                        }),
                        'dppad_freq_range_custom_save_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'click',
                            htmlTargetProp:'checked',
                            widget:'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                let min = this.freqRange.ht.min.value,
                                    max = this.freqRange.ht.max.value;
                                this.freqRange.ht.ambitus.presets.custom = new HUM.DpPad.VoiceAmbitus('ht', 'Custom', 'hz', min, max, padSet.dhc);
                                this.freqRange.ht.ambitus.uiElements.in.dppad_freq_range_custom_save_ht.style.display = 'none';
                                // Force the DB to store the param
                                this.padSet.dhc.harmonicarium.components.user.presetServiceDB.updateParam(
                                    this.padSet.dhc.harmonicarium.components.user.session.id,
                                    this.freqRange.ht.ambitus.idbKeyPath,
                                    'live');

                            }
                        }),
                        'dppad_freq_range_copy_to_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'click',
                            htmlTargetProp:'checked',
                            widget:'button', // "button" is like uiSet===null
                            eventListener: (evt) => {
                                padSet.updatePadRangeUI('ht', 'custom', 'min', this.freqRange.ft.min.value, true);
                                padSet.updatePadRangeUI('ht', 'custom', 'max', this.freqRange.ft.max.value, true);
                            }
                        })
                    },
                    dataType:'string',
                    initValue: 'normal', // 3 octaves + 1 tone
                    init:false,
                    restoreStage:'post',
                    allowedValues: ['beginner', 'normal', 'extreme', 'custom'],
                    preInit: (thisParam) => {
                        this._freqRangeInit('ht', thisParam.uiElements.in.dppad_freq_range_ht);
                    },
                    postSet: (value, thisParam, init) => {
                        // if (!init) {
                            padSet.updatePadRangeUI('ht', value);
                        // }
                    },
                    customPropertiesStore: () => {
                        let customProperties = {presets:{}};
                        for( const [vName, vAmb] of Object.entries(this.freqRange.ht.ambitus.presets)) {
                            customProperties.presets[vName] = [vAmb.type, vAmb.name, 'hz', vAmb.hz.min, vAmb.hz.max];
                        }
                        return customProperties;
                    },
                    customPropertiesRestore: (storedCustomProps) => {
                        let customProperties = {presets:{}};
                        for( const [vName, vAmb] of Object.entries(storedCustomProps.presets)) {
                            customProperties.presets[vName] = new HUM.DpPad.VoiceAmbitus(...vAmb, this.padSet.dhc);
                        }
                        return customProperties;
                    },
                    customProperties: {
                        presets: {
                            beginner: new HUM.DpPad.VoiceAmbitus('ht', 'Beginner', 'hz', 400, 2500, padSet.dhc),
                            normal: new HUM.DpPad.VoiceAmbitus('ht', 'Normal', 'hz', 350, 2700, padSet.dhc),
                            extreme: new HUM.DpPad.VoiceAmbitus('ht', 'Extreme', 'hz', 300, 3000, padSet.dhc),
                        }
                    }
                }),
                max: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFreqRangeHTMax',
                    uiElements:{
                        'dppad_freq_range_custom_max_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'number',
                        }),
                        'dppad_freq_range_custom_max_trad_ht': {
                            role: 'out'
                        }
                    },
                    dataType:'float',
                    // initValue: 2700, // 3000
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.updatePadRangeUI('ht', 'custom', 'max', value);
                        }
                    }
                }),
                min: new HUM.Param({
                    app:padSet,
                    idbKey:'padsetFreqRangeHTMin',
                    uiElements:{
                        'dppad_freq_range_custom_min_ht': new HUM.Param.UIelem({
                            role: 'in',
                            opType:'set',
                            eventType: 'change',
                            htmlTargetProp:'value',
                            widget:'number',
                        }),
                        'dppad_freq_range_custom_min_trad_ht': {
                            role: 'out'
                        }
                    },
                    dataType:'float',
                    // initValue: 350, // 300
                    postSet: (value, thisParam, init) => {
                        if (!init) {
                            padSet.updatePadRangeUI('ht', 'custom', 'min', value);
                        }
                    }
                })
            }
        };
        this.canvasObjectsRatios = new HUM.Param({
            app:padSet,
            idbKey:'padsetCanvasObjectsRatios',
            dataType:'boolean',
            role:'int',
            restoreStage: 'pre',
            // init:false,
            initValue: true,
            customProperties: {
                ft: {
                    key: {
                        // 0=0%, 0.5=50%, 1=100%
                        length: 0.5,
                        // 0=pre, 0.5=mid, 1=post
                        position: 0,
                    },
                    keyText: {
                        position: 0.6, // inside the key
                        rotation: 0.5, // 0.5=90deg 1=180deg 
                    },
                    // lineText: {
                    //     position: 0.5, // inside the canvas dimension
                    //     rotation: 0.5, // 0.5=90deg 1=180deg 
                    // }
                    hzMonitor: {
                        width: 1,
                        height: 1
                    }
                },
                ht: {
                    key: {
                        length: 0.5,
                        position: 1,
                        saturation: 65, // % hsl color
                        lightness: 50, // % hsl color
                    },
                    keyText: {
                        position: 0.7, // inside the key
                        rotation: 0.5, // 0.5=90deg 1=180deg 
                    },
                    lineText: {
                        position: 0.2, // inside the canvas dimension
                        rotation: 0.5, // 0.5=90deg 1=180deg 
                    },
                    hzMonitor: {
                        width: 1,
                        height: 1
                    }
                }
            }
        });
        /*  ____  ____  ____  ___  ____  ____  __  ___  ____  __   __  _  _ 
         * / ___)(  _ \( ___)(  _)(_  _)(  _ \(  )/ __)(_  _)(  ) /  \( \( )
         * \___ \ )___/ ) _)  ) _)  )(   )   / )(( (_-. _)(_  )(_ ( ()) )  (
         * (____/(__)  (____)(___) (__) (_)\_)(__)\___)(____)(____)_\__/(_)\_)
         */
        this.spectrogramEnabled = new HUM.Param({
            app: padSet,
            idbKey: 'padsetSpectrogramEnabled',
            uiElements: {
                'dppad_spectrogram_enabled': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'change',
                    htmlTargetProp: 'checked',
                    widget: 'checkbox',
                })
            },
            dataType: 'boolean',
            initValue: false,
            restoreStage: 'post',
            postSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                if (!init || fromRestore) {
                    if (value) {
                        padSet.spectrogram.enable();
                    } else {
                        padSet.spectrogram.disable();
                    }
                }
            }
        });
        this.spectrogramInverted = new HUM.Param({
            app: padSet,
            idbKey: 'padsetSpectrogramInverted',
            uiElements: {
                'dppad_spectrogram_inverted': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'change',
                    htmlTargetProp: 'checked',
                    widget: 'checkbox',
                })
            },
            dataType: 'boolean',
            initValue: false,
            restoreStage: 'post',
        });
        this.spectrogramFftSize = new HUM.Param({
            app: padSet,
            idbKey: 'padsetSpectrogramFftSize',
            uiElements: {
                'dppad_spectrogram_fftsize': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'change',
                    htmlTargetProp: 'value',
                    widget: 'selection',
                })
            },
            dataType: 'integer',
            initValue: 16384,
            restoreStage: 'post',
            postSet: (value, thisParam, init, fromUI, oldValue, fromRestore) => {
                if ((!init || fromRestore) && padSet.spectrogram.enabled) {
                    padSet.spectrogram.analyser.fftSize = value;
                    padSet.spectrogram.dataArray = new Uint8Array(padSet.spectrogram.analyser.frequencyBinCount);
                }
            },
        });
        this.spectrogramBrightness = new HUM.Param({
            app: padSet,
            idbKey: 'padsetSpectrogramBrightness',
            uiElements: {
                'dppad_spectrogram_brightness': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'input',
                    htmlTargetProp: 'value',
                    widget: 'range',
                })
            },
            dataType: 'integer',
            initValue: 32,
            restoreStage: 'post',
            postSet: (value, thisParam) => {
                // Update the UI slider's tooltip
                thisParam.uiElements.in.dppad_spectrogram_brightness.setAttribute('data-tooltip', value);
                // Re-apply the silence background colour if the spectrogram is running
                // if (thisParam.app.spectrogram && thisParam.app.spectrogram.enabled) {
                //     thisParam.app.spectrogram._updatePadBackgrounds(true);
                // }
            },
        });
        this.spectrogramContrast = new HUM.Param({
            app: padSet,
            idbKey: 'padsetSpectrogramContrast',
            uiElements: {
                'dppad_spectrogram_contrast': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'input',
                    htmlTargetProp: 'value',
                    widget: 'range',
                })
            },
            dataType: 'float',
            initValue: 3.3,
            restoreStage: 'post',
            postSet: (value, thisParam) => {
                // Update the UI slider's tooltip
                thisParam.uiElements.in.dppad_spectrogram_contrast.setAttribute('data-tooltip', value);
                // Re-apply the silence background colour if the spectrogram is running
                // if (thisParam.app.spectrogram && thisParam.app.spectrogram.enabled) {
                //     thisParam.app.spectrogram._updatePadBackgrounds(true);
                // }
            },
        });

        this.spectrogramPitchTrack = new HUM.Param({
            app: padSet,
            idbKey: 'padsetSpectrogramPitchTrack',
            uiElements: {
                'dppad_spectrogram_pitchtrack': new HUM.Param.UIelem({
                    role: 'in',
                    opType: 'set',
                    eventType: 'change',
                    htmlTargetProp: 'checked',
                    widget: 'checkbox',
                })
            },
            dataType: 'boolean',
            initValue: true,
            restoreStage: 'post',
        });
    }
    /**
     * Triggers deferred initialisation for parameters that require live DOM elements.
     *
     * @returns {void}
     *
     * @description
     * Calls `_init()` on each font parameter and on the toolbar position,
     * toolbar orientation, and both frequency-range ambitus parameters.
     * These inits populate select menus and establish Bootstrap-collapsible
     * listeners that must run after the DOM has been fully built.
     */
    _init() {
        this.fonts.ft.hzMonitor._init();
        this.fonts.ft.keyLabel._init();
        this.fonts.ht.hzMonitor._init();
        this.fonts.ht.keyLabel._init();
        this.fonts.ht.lineLabel._init();

        this.toolbarPosition._init();
        this.toolbarOrientation._init();
        this.freqRange.ft.ambitus._init();
        this.freqRange.ht.ambitus._init();
    }

    /**
     * Populates a frequency-range `<select>` element with the available preset options.
     *
     * @param {tonetype}     type - The pad type (`'ft'` or `'ht'`) whose presets to enumerate.
     * @param {HTMLElement}  elem - The `<select>` DOM element to populate.
     *
     * @returns {void}
     *
     * @description
     * Iterates over all entries in `freqRange[type].ambitus.presets`, appending
     * one `<option>` per preset with its human-readable `name` as the label.
     * Finally appends a fixed `'Custom'` option that is always present.
     */
    _freqRangeInit(type, elem) {
        for (const [id, ambitus] of Object.entries(this.freqRange[type].ambitus.presets)) {
            let option = document.createElement("option");
            option.value = id;
            option.text = ambitus.name;
            elem.add(option);
        }
        let optCustom = document.createElement("option");
        optCustom.value = 'custom';
        optCustom.text = 'Custom';
        elem.add(optCustom);
    }

};
