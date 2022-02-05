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
/* jshint -W009 */

"use strict";

// "requestAnimationFrame" Fallback method
// requestAnimFrame shim layer by Paul Irish
// var requestAnimFrame = (function(){
//     return  window.requestAnimationFrame       || 
//             window.webkitRequestAnimationFrame || 
//             window.mozRequestAnimationFrame    || 
//             window.oRequestAnimationFrame      || 
//             window.msRequestAnimationFrame     || 
//             function(callback, element){
//                 window.setTimeout(callback, 1000 / 60);
//             };
// })();

HUM.DpPad = function() {

    /*  __      __   _                             _     _ _             
     *  \ \    / /  (_)            /\             | |   (_) |            
     *   \ \  / /__  _  ___ ___   /  \   _ __ ___ | |__  _| |_ _   _ ___ 
     *    \ \/ / _ \| |/ __/ _ \ / /\ \ | '_ ` _ \| '_ \| | __| | | / __|
     *     \  / (_) | | (_|  __// ____ \| | | | | | |_) | | |_| |_| \__ \
     *      \/ \___/|_|\___\___/_/    \_\_| |_| |_|_.__/|_|\__|\__,_|___/
     */
    class VoiceAmbitus {
        constructor(type, name, mode, min, max, dhc) {
            this.type = type;
            this.dhc = dhc;
            this.name = '';
            this.hz = {
                min: 0,
                max: 0
            };
            this.mc = {
                min: 0,
                max: 0
            };
            // Note name in scientific pitch notation (cents offset is omitted)
            this.note = {
                min: '',
                max: ''
            };
            this.setRange(name, mode, min, max);
        }
        setRange(name, mode, min, max) {
            this.name = name;
            if (mode === 'hz') {
                this.hz.min = min;
                this.hz.max = max;
                this.mc.min = HUM.DHC.freqToMc(min);
                this.mc.max = HUM.DHC.freqToMc(max);
                this.note.min = this.dhc.midiNumberToNames(Math.round(this.mc.min))[3];
                this.note.max = this.dhc.midiNumberToNames(Math.round(this.mc.max))[3]; 
            } else if (mode === 'mc') {
                this.mc.min = min;
                this.mc.max = max;
                this.hz.min = HUM.DHC.mcToFreq(min);
                this.hz.max = HUM.DHC.mcToFreq(max);
                this.note.min = this.dhc.midiNumberToNames(Math.round(min))[3];
                this.note.max = this.dhc.midiNumberToNames(Math.round(max))[3]; 
            } else if ( ['scientific', 'ui'].includes(mode)) {
                this.note.min = min;
                this.note.max = max; 
                this.mc.min = this.dhc.nameToMidiNumber(mode, min);
                this.mc.max = this.dhc.nameToMidiNumber(mode, max);
                this.hz.min = HUM.DHC.mcToFreq(this.mc.min);
                this.hz.max = HUM.DHC.mcToFreq(this.mc.max);
            } 
        }
        get noteUI() {
            return {
                min: this.dhc.midiNumberToNames(Math.round(this.mc.min))[1],
                max: this.dhc.midiNumberToNames(Math.round(this.mc.min))[1]
            }
        }
    }

    class CssFont {
        constructor(style, weight, size, unit, family, color) {
            this.style = style || ''; // italic
            this.weight = weight || ''; // bold
            this.size = size || 12;
            this.unit = unit || 'px';
            this.family = family || 'Arial';
            this.color = color || 'black';
        }
        get getCss() {
            return [this.style, this.weight, this.getSize, this.family].filter(Boolean).join(' ');
        }
        get getSize() {
            return this.size ? this.size + this.unit : '';
        }
    }


    /*    _____          _  _____      _   _____        __            _ _       
     *   |  __ \        | |/ ____|    | | |  __ \      / _|          | | |      
     *   | |__) |_ _  __| | (___   ___| |_| |  | | ___| |_ __ _ _   _| | |_ ___ 
     *   |  ___/ _` |/ _` |\___ \ / _ \ __| |  | |/ _ \  _/ _` | | | | | __/ __|
     *   | |  | (_| | (_| |____) |  __/ |_| |__| |  __/ || (_| | |_| | | |_\__ \
     *   |_|   \__,_|\__,_|_____/ \___|\__|_____/ \___|_| \__,_|\__,_|_|\__|___/
     */
    class PadSetDefaults {
        constructor(key, dhc) {
            // If the 'key' does not exist, use preset 0 as default
            let presetKey = key;
            if (!PadSetDefaults.presets[key]) {
                presetKey = 0;
            }
            // Just create a copy of the preset object
            let preset = JSON.parse(JSON.stringify(PadSetDefaults.presets[presetKey]));
            Object.assign(this, preset);

            this.voiceAmbitus = {
                ft: {
                    soprano: new VoiceAmbitus(...this.voiceAmbitus.ft.soprano, dhc),
                    mezzosoprano: new VoiceAmbitus(...this.voiceAmbitus.ft.mezzosoprano, dhc),
                    contralto: new VoiceAmbitus(...this.voiceAmbitus.ft.contralto, dhc),
                    controtenore: new VoiceAmbitus(...this.voiceAmbitus.ft.controtenore, dhc),
                    tenore: new VoiceAmbitus(...this.voiceAmbitus.ft.tenore, dhc),
                    baritono: new VoiceAmbitus(...this.voiceAmbitus.ft.baritono, dhc),
                    basso: new VoiceAmbitus(...this.voiceAmbitus.ft.basso, dhc),
                    bassoprofondo: new VoiceAmbitus(...this.voiceAmbitus.ft.bassoprofondo, dhc),
                },
                ht: {
                    beginner: new VoiceAmbitus(...this.voiceAmbitus.ht.beginner, dhc),
                    normal: new VoiceAmbitus(...this.voiceAmbitus.ht.normal, dhc),
                    extreme: new VoiceAmbitus(...this.voiceAmbitus.ht.extreme, dhc),
                }
            };

            this.fonts = {
                ft: {
                    // PAD
                    hzMonitor: new CssFont(...this.fonts.ft.hzMonitor),
                    // noteMonitor: new CssFont(false, false, '10px', false, false),
                    // SCALE
                    // lineLabel: new CssFont(...this.fonts.ft.lineLabel),
                    keyLabel: new CssFont(...this.fonts.ft.keyLabel),
                },
                ht: {
                    // PAD
                    hzMonitor: new CssFont(...this.fonts.ht.hzMonitor),
                    // noteMonitor: new CssFont(false, false, '10px', false, false),
                    // SCALE
                    lineLabel: new CssFont(...this.fonts.ht.lineLabel),
                    keyLabel: new CssFont(...this.fonts.ht.keyLabel),
                }
            };

        }
    }
    PadSetDefaults.presets = {
        0: {
            /*   __   ____  ____ 
             *  / _\ (  _ \(  _ \
             * /    \ ) __/ ) __/
             * \_/\_/(__)  (__)
             */
            // 'classic' or 'hidpi'
            renderMode: 'hidpi',
            /*  ____  ____  ____ 
             * / ___)(  __)(_  _)
             * \___ \ ) _)   )(  
             * (____/(____) (__)
            */
            // @todo: other sets' pads as target (eg. ft0, ft3, ht2) ??
            // scaleType: targetPad array
            scaleDisplay: {
                ft: ['ft'],
                ht: ['ht']
            },
            padOrder: ['ft', 'ht'],
            showToolbar: true,
            // 'longitudinal' or 'transversal' (related to this.settings.orientation)
            toolbarOrientation: 'longitudinal',
            toolbarPosition: {
                longitudinal: 1, // 0, 1, 2 (pre, mid, post)
                transversal: 2 // 0, 2 (pre, post)
            },
            toolbarIconOrder: [
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
            ],
            // @todo canvas FH/HT ratio calculator
            padsRatio: {
                    ft: 0.5,
                    ht: 0.5,
                    tbLong: 0.1,
                    tbTran: 0.1
            },
            /*  ____   __   ____ 
             * (  _ \ / _\ (    \
             *  ) __//    \ ) D (
             * (__)  \_/\_/(____/
             */
            canvasObjectsRatios: {
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
                },
            },
            freqRange: {
                ft: { // 4 octaves + 3 tones
                    ambitus: 'tenore',
                    max: 340, // 460, // 460,// 1200,
                    min: 85 //62,
                },
                ht: { // 3 octaves + 1 tone
                    ambitus: 'normal',
                    max: 2700, // 3000
                    min: 350  // 300
                }
            },
            scaleOrientation: {
                ft: 'vertical',
                ht: 'vertical'
            },
            voiceAmbitus: {
                ft: {
                    soprano: ['ft', 'Soprano', 'scientific', 'C4', 'C6'],
                    mezzosoprano: ['ft', 'Mezzo-soprano', 'scientific', 'A3', 'A5'],
                    contralto: ['ft', 'Alto', 'scientific', 'F3', 'F5'],
                    controtenore: ['ft', 'Countertenor', 'scientific', 'E3', 'E5'],
                    tenore: ['ft', 'Tenor', 'scientific', 'C3', 'C5'],
                    baritono: ['ft', 'Baritone', 'scientific', 'A2', 'A4'],
                    basso: ['ft', 'Bass', 'scientific', 'E2', 'E4'],
                    bassoprofondo: ['ft', 'Basso profondo', 'scientific', 'C2', 'C4'],
                },
                ht: {
                    beginner: ['ht', 'Beginner', 'hz', 400, 2500],
                    normal: ['ht', 'Normal', 'hz', 350, 2700],
                    extreme: ['ht', 'Extreme', 'hz', 300, 3000],
                }
            },
            colors: {
                ft: {
                    ftKeyWhite: 'white',
                    ftKeyBlack: 'rgb(38 35 54)',
                    ftKeyPlay: '',
                    ftKeyLast: '',
                    ftLine: '',
                    ftLinePlay: '',
                    ftLineLast: '',
                },
                ht: {
                    htKey: 'spectrum', // @todo - spectrum or fixed color code (to implement)
                    htKeyPlay: '',
                    htKeyLast: '',
                    htLine: '',
                    htLinePlay: '',
                    htLineLast: '',
                }  
            },
            // Font sizes are relative to refDimensions
            // Expressed in pixles
            fonts: {
                ft: {
                    // PAD
                    hzMonitor: ['italic', 'bold', 30, 'px', false, false],
                    // noteMonitor: new CssFont(false, false, '10px', false, false),
                    // SCALE
                    // lineLabel: [false, 'bold', 10, false, false],
                    keyLabel: [false, 'bold', 100, '%', false, false],
                },
                ht: {
                    // PAD
                    hzMonitor: ['italic', 'bold', 30, 'px', false, false],
                    // noteMonitor: new CssFont(false, false, '10px', false, false),
                    // SCALE
                    lineLabel: ['italic', 'bold', 90, '%', false, false],
                    keyLabel: [false, 'bold', 100, '%', false, false],
                }
            },
        }
    };

    /*  _____        _____          _ 
     * |  __ \      |  __ \        | |
     * | |  | |_ __ | |__) |_ _  __| |
     * | |  | | '_ \|  ___/ _` |/ _` |
     * | |__| | |_) | |  | (_| | (_| |
     * |_____/| .__/|_|   \__,_|\__,_|
     *        | |                     
     *        |_|                     
     */
    class DpPad {
        constructor(harmonicarium, dhc=false) {
            this.harmonicarium = harmonicarium;
            this.dhc = dhc; // 'dhc' === false is meant for stand-alone distributions of the Diphonic Pad
            this.padSets = new Array();
            this.toolbars = new Array();
            this.settings = {
                orientation: 'vertical',
                numberOfSets: 1, // Multi-sets implementation is working progress (leave 1)
                refDimensions: {
                    // X and Y are to be intended at VERTICAL 'orientation'
                    // 16:9 aspect ratio @ 4K UHD
                    x: 768, // 2160,
                    y: 1366 // 3840
                }
            };
            this.viewportDim = {
                    x: 0,
                    y: 0
            };
            // Variables to keep track of the mouse position and left-button status 
            this.mouse = {
                x: null,
                y: null,
                down: false,
                // Keep track of the old/last position when drawing a line
                // We set it to false at the start to indicate that we don't have a good value for it yet
                last: { 
                    x: false,
                    y: false
                }
            };
        }
        
        // Set-up the canvas and add our event handlers after the page has loaded
        init() {
            // Since we are listening to the entire window for the mouseup, it only needs to be done once per page,
            // and not once per canvas
            window.addEventListener('mouseup', this.mouseUp.bind(this), false);
            // window.addEventListener('resize', this.windowResize.bind(this), false);

            // todo: delete and redraw all (if new set is added)
            let existingPads = this.padSets.length;
            let padsToAdd = this.settings.numberOfSets - existingPads;
            for (let n=existingPads; n<padsToAdd; n++) {
                // Provides the "dhc" parameter only if the dpPad parent component (this) has one
                this.padSets[n] = new DpPad.PadSet(n, this, (!this.dhc ? false : this.dhc));
            }
        }

        // Keep track of the mouse button being released
        mouseUp(e) {
            this.updateMousePosition(e);
            for (let padSet of this.padSets) {
                padSet.ft.mouseUp();
                padSet.ht.mouseUp();
                padSet.toolbar.mouseUp(e);
            }
            // Reset the mouse AFTER the single pad mouseUp
            // So that if you have to do something with the last mouse position, you can do it before you lose the data.
            this.mouse.down = false;
            // Reset lastX and lastY to false to indicate that they are now invalid, since we have lifted the "pen"
            this.mouse.last.x = false;
            this.mouse.last.y = false;

        }

        // Get the current mouse position relative to the top-left of the canvas
        updateMousePosition(e) {
            if (e.offsetX) {
                this.mouse.x = e.offsetX;
                this.mouse.y = e.offsetY;
            }
            else if (e.layerX) {
                this.mouse.x = e.layerX;
                this.mouse.y = e.layerY;
            }
        }
        updateViewportSize() {
            this.viewportDim.x = this.harmonicarium.html.dpPadPage.clientWidth;
            this.viewportDim.y = this.harmonicarium.html.dpPadPage.clientHeight;
        }
        rotateView(value=false) {
            // Set
            if (value) {
                if (this.settings.orientation !== value) {
                    this.settings.orientation = value;
                } else {
                    return;
                }
            // Switch
            } else {
                this.settings.orientation = this.settings.orientation === 'vertical' ? 'horizontal' : 'vertical';
                for (let padSet of this.padSets) {
                    padSet.uiElements.in.main_orientation.value = this.settings.orientation;
                }
            }
            for (let padSet of this.padSets) {
                padSet.ft.switchScaleOrientation();
                padSet.ht.switchScaleOrientation();
                padSet.arrangePads();
            }
            this.windowResize();
        }

        windowResize() {
            this.updateViewportSize();
            let pixScale = window.devicePixelRatio;

            let tbWidth, tbHeight,
                ftCnvWidth, ftCnvHeight,
                htCnvWidth, htCnvHeight;

            for (let padSet of this.padSets) { 
                let numberOfSets = this.settings.numberOfSets,
                    padsRatio = padSet.settings.padsRatio;
                // First calculate CSS dimensions
                if (this.settings.orientation === 'vertical') {

                    if (padSet.settings.toolbarOrientation === 'longitudinal') {
                        tbWidth = (this.viewportDim.x * padsRatio.tbLong) / numberOfSets;
                        tbHeight = this.viewportDim.y;

                        ftCnvWidth =  Math.floor( ((this.viewportDim.x - tbWidth) * padsRatio.ft) / numberOfSets )-1;
                        ftCnvHeight = Math.floor( this.viewportDim.y )-1;
                        htCnvWidth =  Math.floor( ((this.viewportDim.x - tbWidth)* padsRatio.ht) / numberOfSets )-1;
                        htCnvHeight = Math.floor( this.viewportDim.y )-1;

                    
                    } else if (padSet.settings.toolbarOrientation === 'transversal') {
                        tbWidth = this.viewportDim.x / numberOfSets;
                        tbHeight = this.viewportDim.y * padsRatio.tbLong;

                        ftCnvWidth = Math.floor( (this.viewportDim.x * padsRatio.ft) / numberOfSets )-1;
                        ftCnvHeight = Math.floor( this.viewportDim.y - tbHeight )-1;
                        htCnvWidth = Math.floor( (this.viewportDim.x * padsRatio.ht) / numberOfSets )-1;
                        htCnvHeight = Math.floor( this.viewportDim.y - tbHeight )-1;
                    }

                } else if (this.settings.orientation === 'horizontal') {

                    if (padSet.settings.toolbarOrientation === 'longitudinal') {
                        tbWidth = this.viewportDim.x / numberOfSets;
                        tbHeight = this.viewportDim.y * padsRatio.tbLong;

                        ftCnvWidth = Math.floor( this.viewportDim.x )-1;
                        ftCnvHeight = Math.floor( ((this.viewportDim.y - tbHeight) * padsRatio.ft) / numberOfSets )-1;
                        htCnvWidth = Math.floor( this.viewportDim.x )-1;
                        htCnvHeight = Math.floor( ((this.viewportDim.y - tbHeight)* padsRatio.ht) / numberOfSets )-1;
                    
                    } else if (padSet.settings.toolbarOrientation === 'transversal') {
                        tbWidth = (this.viewportDim.x * padsRatio.tbLong) / numberOfSets;
                        tbHeight = this.viewportDim.y;

                        ftCnvWidth = Math.floor( this.viewportDim.x - tbWidth )-1;
                        ftCnvHeight = Math.floor( (this.viewportDim.y * padsRatio.ft) / numberOfSets )-1;
                        htCnvWidth = Math.floor( this.viewportDim.x - tbWidth )-1;
                        htCnvHeight = Math.floor( (this.viewportDim.y * padsRatio.ht) / numberOfSets )-1;
                    }
                }

                padSet.toolbar.svg.setAttributeNS(null, 'width',  Math.floor(tbWidth) );
                padSet.toolbar.svg.setAttributeNS(null, 'height', Math.floor(tbHeight));
                // padSet.toolbar.svg.setAttributeNS(null, 'viewBox', `0 0 ${Math.floor(tbWidth)} ${Math.floor(tbHeight)}`);
                padSet.toolbar.cssDimensions.width = Math.floor(tbWidth);
                padSet.toolbar.cssDimensions.height = Math.floor(tbHeight);
                
                // Then write CSS dimensions and HIDPI scale reolution
                if (padSet.settings.renderMode === 'classic') {

                    padSet.ft.canvas.width = ftCnvWidth;
                    padSet.ft.canvas.height = ftCnvHeight;
                    padSet.ht.canvas.width = htCnvWidth;
                    padSet.ht.canvas.height = htCnvHeight;

                    padSet.ft.cssDimensions.width = ftCnvWidth;
                    padSet.ft.cssDimensions.height = ftCnvHeight;
                    padSet.ht.cssDimensions.width = htCnvWidth;
                    padSet.ht.cssDimensions.height = htCnvHeight;

                } else if (padSet.settings.renderMode === 'hidpi') {

                    padSet.ft.canvas.style.width = ftCnvWidth + 'px';
                    padSet.ft.canvas.style.height = ftCnvHeight + 'px';
                    padSet.ht.canvas.style.width = htCnvWidth + 'px';
                    padSet.ht.canvas.style.height = htCnvHeight + 'px';

                    padSet.ft.canvas.width = Math.floor((padSet.ft.canvas.clientWidth * pixScale) / numberOfSets);
                    padSet.ft.canvas.height = Math.floor(padSet.ft.canvas.clientHeight * pixScale);
                    padSet.ht.canvas.width = Math.floor((padSet.ht.canvas.clientWidth * pixScale) / numberOfSets);
                    padSet.ht.canvas.height =  Math.floor(padSet.ht.canvas.clientHeight * pixScale);

                    padSet.ft.ctx.scale(pixScale, pixScale);
                    padSet.ht.ctx.scale(pixScale, pixScale);

                    padSet.ft.cssDimensions.width = padSet.ft.canvas.clientWidth;
                    padSet.ft.cssDimensions.height = padSet.ft.canvas.clientHeight;
                    padSet.ht.cssDimensions.width = padSet.ht.canvas.clientWidth;
                    padSet.ht.cssDimensions.height = padSet.ht.canvas.clientHeight;
                }
            
            }

            // For every padSet created
            for (let padSet of this.padSets) {
                // If the DHC is connected, initialize the Scales
                if (padSet.dhc) {
                    for (let type of ['ft', 'ht']) {
                        padSet[type].refillFreqArrays();
                        padSet[type].drawFreqUI();
                    }
                    padSet.toolbar.drawIcons();
                } else {
                    alert('The padSet [ '+ padSet.id +' ] has no DHC connected!\n\nPlease, verify the code.');
                }
            }
        }

        freqToPix(frequency, rangePreset, pxMaxLength) {
            let freqMin = Math.log(rangePreset.min) / Math.log(10),
                freqMax = Math.log(rangePreset.max) / Math.log(10),
                range = freqMax - freqMin,
                pxPosition = (Math.log(frequency) / Math.log(10) - freqMin) / range * pxMaxLength;
            return pxPosition;
        }
        pixToFreq(pxPosition, rangePreset, pxMaxLength){
            let freqMin = Math.log(rangePreset.min) / Math.log(10),
                freqMax = Math.log(rangePreset.max) / Math.log(10),
                range = freqMax - freqMin,
                frequency = Math.pow(10, pxPosition * (range / pxMaxLength) + freqMin);
            return frequency;
        }
    }

    /*   _____          _  _____      _   
     *  |  __ \        | |/ ____|    | |  
     *  | |__) |_ _  __| | (___   ___| |_ 
     *  |  ___/ _` |/ _` |\___ \ / _ \ __|
     *  | |  | (_| | (_| |____) |  __/ |_ 
     *  |_|   \__,_|\__,_|_____/ \___|\__|
     */
    DpPad.PadSet = class {
        constructor(setKey, dpPadComponent, dhc=false) {
            let appDiv = dpPadComponent.harmonicarium.html.dpPadPage,
                
                setDiv = document.createElement('div'),
                ftDiv = document.createElement('div'),
                htDiv = document.createElement('div'),
                tbarDiv = document.createElement('div'),
                
                ftCanvas = document.createElement('canvas'),
                htCanvas = document.createElement('canvas'),
                tbarSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            
            setDiv.id = 'dpSet'+setKey;
            ftDiv.id = 'padFT'+setKey;
            htDiv.id = 'padHT'+setKey;
            tbarDiv.id = 'toolbar'+setKey;
            
            ftCanvas.id = 'canvasFT'+setKey;
            htCanvas.id = 'canvaspadHT'+setKey;
            tbarSvg.id = 'svgToolbar'+setKey;
            
            setDiv.className = 'padSet';
            ftDiv.className = 'padFT';
            htDiv.className = 'padHT';
            tbarDiv.className = 'toolbar';
            ftCanvas.className = 'canvasPad ';
            htCanvas.className = 'canvasPad';
            tbarSvg.setAttributeNS(null, 'class', 'toolbarPad');
            
            appDiv.appendChild(setDiv);
            setDiv.appendChild(ftDiv);
            setDiv.appendChild(htDiv);
            setDiv.appendChild(tbarDiv);
            ftDiv.appendChild(ftCanvas);
            htDiv.appendChild(htCanvas);
            tbarDiv.appendChild(tbarSvg);
            
            // Create a new HTML element with UI backend and append it into the document
            let accordionTab = HUM.tmpl.accordionTab(setKey, 'dppad', 'Diphonic Pad ' + (dpPadComponent.padSets.length > 1 ? setKey : ''));
            accordionTab.children[2].appendChild(HUM.tmpl.dpPadBox(setKey));
            dpPadComponent.harmonicarium.html.dpPadAccordion.children[0].children[0].appendChild(accordionTab);

            this.uiElements = {
                fn: {
                    accordionTab: accordionTab,
                    appDiv: appDiv,
                    setDiv: setDiv,
                    ftDiv: ftDiv,
                    htDiv: htDiv,
                    tbarDiv: tbarDiv
                },
                in: {
                    main_orientation: document.getElementById("HTMLi_dppad_main_orientation"+setKey),
                    
                    render_mode: document.getElementById("HTMLi_dppad_render_mode"+setKey),

                    scale_display_ft: document.getElementById("HTMLi_dppad_scale_display_ft"+setKey),
                    scale_display_ht: document.getElementById("HTMLi_dppad_scale_display_ht"+setKey),
                    
                    pads_order: document.getElementById("HTMLi_dppad_pads_order"+setKey),
                    toolbar_orientation: document.getElementById("HTMLi_dppad_toolbar_orientation"+setKey),
                    toolbar_position: document.getElementById("HTMLi_dppad_toolbar_position"+setKey),

                    fontsize_hzMonitor_ft: document.getElementById("HTMLi_dppad_fontsize_hzMonitor_ft"+setKey),
                    // fontsize_noteMonitor_ft: document.getElementById("HTMLi_dppad_fontsize_noteMonitor_ft"+setKey),
                    // fontsize_lineLabel_ft: document.getElementById("HTMLi_dppad_fontsize_lineLabel_ft"+setKey),
                    fontsize_keyLabel_ft: document.getElementById("HTMLi_dppad_fontsize_keyLabel_ft"+setKey),
                    
                    fontsize_hzMonitor_ht: document.getElementById("HTMLi_dppad_fontsize_hzMonitor_ht"+setKey),
                    // fontsize_noteMonitor_ht: document.getElementById("HTMLi_dppad_fontsize_noteMonitor_ht"+setKey),
                    fontsize_lineLabel_ht: document.getElementById("HTMLi_dppad_fontsize_lineLabel_ht"+setKey),
                    fontsize_keyLabel_ht: document.getElementById("HTMLi_dppad_fontsize_keyLabel_ht"+setKey),
                    
                    scale_orientation_ft: document.getElementById("HTMLi_dppad_scale_orientation_ft"+setKey),
                    scale_orientation_ht: document.getElementById("HTMLi_dppad_scale_orientation_ht"+setKey),
                    
                    freq_range_ft: document.getElementById("HTMLi_dppad_freq_range_ft"+setKey),
                    freq_range_custom_min_ft: document.getElementById("HTMLi_dppad_freq_range_custom_min_ft"+setKey),
                    freq_range_custom_max_ft: document.getElementById("HTMLi_dppad_freq_range_custom_max_ft"+setKey),
                    freq_range_custom_save_ft: document.getElementById("HTMLi_dppad_freq_range_custom_save_ft"+setKey),
                    
                    freq_range_ht: document.getElementById("HTMLi_dppad_freq_range_ht"+setKey),
                    freq_range_custom_min_ht: document.getElementById("HTMLi_dppad_freq_range_custom_min_ht"+setKey),
                    freq_range_custom_max_ht: document.getElementById("HTMLi_dppad_freq_range_custom_max_ht"+setKey),
                    freq_range_custom_save_ht: document.getElementById("HTMLi_dppad_freq_range_custom_save_ht"+setKey),
                
                    freq_range_copy_to_ht: document.getElementById("HTMLi_dppad_freq_range_copy_to_ht"+setKey),
                    freq_range_copy_to_ft: document.getElementById("HTMLi_dppad_freq_range_copy_to_ft"+setKey),

                },
                out: {
                    freq_range_custom_min_trad_ft: document.getElementById("HTMLo_dppad_freq_range_custom_min_trad_ft"+setKey),
                    freq_range_custom_max_trad_ft: document.getElementById("HTMLo_dppad_freq_range_custom_max_trad_ft"+setKey),
                    freq_range_custom_min_trad_ht: document.getElementById("HTMLo_dppad_freq_range_custom_min_trad_ht"+setKey),
                    freq_range_custom_max_trad_ht: document.getElementById("HTMLo_dppad_freq_range_custom_max_trad_ht"+setKey),
                },
            };

            this.id = setKey;
            this.dpPadComponent = dpPadComponent;
            // If a dhc is passed, use that, else create its own dhc
            // @todo: have to check empty/available keys in "harmonicarium.availableDHCs" the setKey
            //        currently, it can create conflicts with the main app if the "dhc" is not provided
            this.dhc = !dhc ? new HUM.DHC(setKey) : dhc;
            this.settings = new PadSetDefaults(setKey, this.dhc);
            this.ft = new DpPad.PadSet.FrequencyPad('ft', this, ftCanvas);
            this.ht = new DpPad.PadSet.FrequencyPad('ht', this, htCanvas);
            this.toolbar = new DpPad.PadSet.Toolbar(this, tbarSvg);

            this.arrangePads();
            // Tell to the DHC that a new app is using it
            this.dhc.registerApp(this, 'updatesFromDHC', 101);
            this.initUI();
            this.updatePadRangeUI('ft');
            this.updatePadRangeUI('ht');
        }

        initUI() {

            /*  CREATE PAD RANGE PRESETS OPTS
             * ==============================*/
            for (let type of ['ft', 'ht']) {
                for (const [id, ambitus] of Object.entries(this.settings.voiceAmbitus[type])) {
                    let option = document.createElement("option");
                    option.value = id;
                    option.text = ambitus.name;
                    this.uiElements.in['freq_range_'+type].add(option);
                }
                let optCustom = document.createElement("option");
                optCustom.value = 'custom';
                optCustom.text = 'Custom';
                this.uiElements.in['freq_range_'+type].add(optCustom);
            }

            /*  UI DEFAULT SETTINGS
             * ====================*/
            this.uiElements.in.main_orientation.value = this.dpPadComponent.settings.orientation;
            this.uiElements.in.render_mode.value = this.settings.renderMode ;
            
            this.uiElements.in.scale_display_ft.checked = this.settings.scaleDisplay.ft.includes('ht') ? true : false;
            this.uiElements.in.scale_display_ht.checked = this.settings.scaleDisplay.ht.includes('ft') ? true : false;
            
            this.uiElements.in.pads_order.value = this.settings.padOrder[0] === 'ft' ? 'ftht' : 'htft';

            this.uiElements.in.toolbar_orientation.value = this.settings.toolbarOrientation;
            this.uiElements.in.toolbar_position.value = this.settings.toolbarPosition[this.settings.toolbarOrientation];
            
            this.uiElements.in.fontsize_hzMonitor_ft.value = this.settings.fonts.ft.hzMonitor.size;
            // this.uiElements.in.fontsize_noteMonitor_ft.value = this.settings.fonts.ft.noteMonitor.size;
            // this.uiElements.in.fontsize_lineLabel_ft.value = this.settings.fonts.ft.lineLabel.size;
            this.uiElements.in.fontsize_keyLabel_ft.value = this.settings.fonts.ft.keyLabel.size;
            
            this.uiElements.in.fontsize_hzMonitor_ht.value = this.settings.fonts.ht.hzMonitor.size;
            // this.uiElements.in.fontsize_noteMonitor_ht.value = this.settings.fonts.ht.noteMonitor.size;
            this.uiElements.in.fontsize_lineLabel_ht.value = this.settings.fonts.ht.lineLabel.size;
            this.uiElements.in.fontsize_keyLabel_ht.value = this.settings.fonts.ht.keyLabel.size;
            
            this.uiElements.in.scale_orientation_ft.value = this.settings.scaleOrientation.ft;
            this.uiElements.in.scale_orientation_ht.value = this.settings.scaleOrientation.ht;

            /*  UI EVENT LISTENERS
             * ====================*/
            this.uiElements.in.fontsize_hzMonitor_ft.addEventListener("change", (e) => {
                this.ft.changeFontsize('hzMonitor', Number(e.target.value));
            });
            this.uiElements.in.fontsize_hzMonitor_ht.addEventListener("change", (e) => {
                this.ht.changeFontsize('hzMonitor', Number(e.target.value));
            });
            // this.uiElements.in.fontsize_noteMonitor_ft.addEventListener("change", (e) => {
            //     this.ft.changeFontsize('noteMonitor', Number(e.target.value));
            // });
            // this.uiElements.in.fontsize_noteMonitor_ht.addEventListener("change", (e) => {
            //     this.ht.changeFontsize('noteMonitor', Number(e.target.value));
            // });
            // this.uiElements.in.fontsize_lineLabel_ft.addEventListener("change", (e) => {
            //     this.ft.changeFontsize('lineLabel', Number(e.target.value));
            // });
            this.uiElements.in.fontsize_lineLabel_ht.addEventListener("change", (e) => {
                this.ht.changeFontsize('lineLabel', Number(e.target.value));
            });
            this.uiElements.in.fontsize_keyLabel_ft.addEventListener("change", (e) => {
                this.ft.changeFontsize('keyLabel', Number(e.target.value));
            });
            this.uiElements.in.fontsize_keyLabel_ht.addEventListener("change", (e) => {
                this.ht.changeFontsize('keyLabel', Number(e.target.value));
            });

            this.uiElements.in.main_orientation.addEventListener("change", (e) => {
                this.dpPadComponent.rotateView(e.target.value);
            });
            this.uiElements.in.render_mode.addEventListener("change", (e) => {
                this.settings.renderMode = e.target.value;
                this.dpPadComponent.windowResize();
            });
            this.uiElements.in.scale_display_ft.addEventListener("change", (e) => {
                if (e.target.checked) {
                    this.settings.scaleDisplay.ft = ['ft', 'ht'];
                } else {
                    this.settings.scaleDisplay.ft = ['ft'];
                }
                this.ht.refillFreqArrays();
                this.ht.drawFreqUI();
            });
            this.uiElements.in.scale_display_ht.addEventListener("change", (e) => {
                if (e.target.checked) {
                    this.settings.scaleDisplay.ht = ['ht', 'ft'];
                } else {
                    this.settings.scaleDisplay.ht = ['ht'];
                }
                this.ft.refillFreqArrays();
                this.ft.drawFreqUI();
            });
            this.uiElements.in.pads_order.addEventListener("change", (e) => {
                if (this.settings.padOrder.join('') !== e.target.value) {
                this.invertPads();
                // this.settings.padOrder = e.target.value === 'ftht' ? ['ft', 'ht'] : ['ht', 'ft'];                
                // this.arrangePads();
                }
            });
            this.uiElements.in.toolbar_orientation.addEventListener("change", (e) => {
                this.setToolbarOrientation(e.target.value);
            });
            this.uiElements.in.toolbar_position.addEventListener("change", (e) => {
                this.settings.toolbarPosition[this.settings.toolbarOrientation] = e.target.value;
                this.arrangePads();
            });

            this.uiElements.in.scale_orientation_ft.addEventListener("change", (e) => {
                this.settings.scaleOrientation.ft = e.target.value;
                this.ft.drawFreqUI();
            });
            this.uiElements.in.scale_orientation_ht.addEventListener("change", (e) => {
                this.settings.scaleOrientation.ht = e.target.value;
                this.ht.drawFreqUI();
            });

            this.uiElements.in.freq_range_ft.addEventListener("change", (e) => {
                this.updatePadRangeUI('ft', e.target.value);
            });
            this.uiElements.in.freq_range_ht.addEventListener("change", (e) => {
                this.updatePadRangeUI('ht', e.target.value);
            });
            
            this.uiElements.in.freq_range_custom_min_ft.addEventListener("change", (e) => {
                this.updatePadRangeUI('ft', 'custom', 'min', e.target.value);
            });
            this.uiElements.in.freq_range_custom_max_ft.addEventListener("change", (e) => {
                this.updatePadRangeUI('ft', 'custom', 'max', e.target.value);
            });
            
            this.uiElements.in.freq_range_custom_min_ht.addEventListener("change", (e) => {
                this.updatePadRangeUI('ht', 'custom', 'min', e.target.value);
            });
            this.uiElements.in.freq_range_custom_max_ht.addEventListener("change", (e) => {
                this.updatePadRangeUI('ht', 'custom', 'max', e.target.value);
            });
            
            this.uiElements.in.freq_range_custom_save_ft.addEventListener("click", () => {
                let min = Number(this.uiElements.in.freq_range_custom_min_ft.value),
                    max = Number(this.uiElements.in.freq_range_custom_max_ft.value);
                this.settings.voiceAmbitus.ft.custom = new VoiceAmbitus('ft', 'Custom', 'mc', min, max, this.dhc);
            });
            this.uiElements.in.freq_range_custom_save_ht.addEventListener("click", () => {
                let min = Number(this.uiElements.in.freq_range_custom_min_ht.value),
                    max = Number(this.uiElements.in.freq_range_custom_max_ht.value);
                this.settings.voiceAmbitus.ht.custom = new VoiceAmbitus('ht', 'Custom', 'hz', min, max, this.dhc);
            });

            this.uiElements.in.freq_range_copy_to_ht.addEventListener("click", () => {
                this.updatePadRangeUI('ht', 'custom', 'min', this.settings.freqRange.ft.min);
                this.updatePadRangeUI('ht', 'custom', 'max', this.settings.freqRange.ft.max);
            });
            this.uiElements.in.freq_range_copy_to_ft.addEventListener("click", () => {
                this.updatePadRangeUI('ft', 'custom', 'min', HUM.DHC.freqToMc(this.settings.freqRange.ht.min));
                this.updatePadRangeUI('ft', 'custom', 'max',  HUM.DHC.freqToMc(this.settings.freqRange.ht.max));
            });
        }
        //                                     'min'|'max'
        updatePadRangeUI(type, ambitus=false, target=false, value=false) {
            if (ambitus) {
                this.settings.freqRange[type].ambitus = ambitus;
            } else {
                // Init
                ambitus = this.settings.freqRange[type].ambitus;
                this.uiElements.in['freq_range_'+type].value = ambitus;
            }
            
            // Modify MAX or MIN range of the Custom preset slot
            if (ambitus === 'custom' && !this.settings.voiceAmbitus[type].custom && target) {
                this.uiElements.in['freq_range_'+type].value = 'custom';
                this.uiElements.in['freq_range_custom_save_'+type].style.display = 'initial';
                if (type === 'ft') {
                    let mcFT = Number(value);
                
                    let ftStep = Math.round((mcFT % 1) * 10000000000) / 10000000000,
                        fmStep = Math.round((this.dhc.settings.fm.mc % 1) * 10000000000) / 10000000000;
                    // FIT PAD RANGE: WORKS ONLY For 12-EDO
                    // @todo - make ET universal (different unit ad divisions)
                    if (this.dhc.settings.ft.selected === 'nEDx' &&
                        this.dhc.settings.ft.nEDx.unit === 2 &&
                        this.dhc.settings.ft.nEDx.division === 12 &&
                        ftStep === fmStep) {
                        // If the FT System is ET and the decimal part of the FM is the same as the
                        // input midicent value
                        let nEDxFixStepCent = (this.dhc.tables.ft[1].mc - this.dhc.tables.ft[0].mc) / 2;
                        // Add or remove 50 cents to draw the first/last FT key entirely
                        let mcFix = target === 'min' ? -nEDxFixStepCent : nEDxFixStepCent;
                        this.settings.freqRange.ft[target] = this.addCentToHertz(HUM.DHC.mcToFreq(mcFT), mcFix);
                    
                    }  else {
                        this.settings.freqRange.ft[target] = HUM.DHC.mcToFreq(mcFT);
                    }

                    this.uiElements.out['freq_range_custom_'+target+'_trad_ft'].innerText = this.dhc.mcToNameString(mcFT);
                

                } else if (type === 'ht') {
                    let hzHT = Number(value);
                    
                    this.settings.freqRange.ht[target] = hzHT;
                    
                    this.uiElements.out['freq_range_custom_'+target+'_trad_ht'].innerText = this.dhc.mcToNameString(HUM.DHC.freqToMc(hzHT));
                }
            // If the CUSTOM ambitus PRESET is not saved/stored
            } else if (ambitus === 'custom' && !this.settings.voiceAmbitus[type].custom && !target) {
                this.uiElements.in['freq_range_custom_save_'+type].style.display = 'initial';
            // Load STORED ambitus PRESET (also the Custom, if it has been saved)
            } else {
                let xtRange = this.settings.voiceAmbitus[type][ambitus];
                this.uiElements.in['freq_range_custom_save_'+type].style.display = ambitus === 'custom' ? 'initial' : 'none';
                
                for (let presetTarget of ['min', 'max']) {
                    let ftStep = Math.round((xtRange.mc[presetTarget] % 1) * 10000000000) / 10000000000,
                        fmStep = Math.round((this.dhc.settings.fm.mc % 1) * 10000000000) / 10000000000;
                    // FIT PAD RANGE: WORKS ONLY For 12-EDO
                    // @todo - make ET universal (different unit ad divisions)
                    if (type === 'ft' &&
                        this.dhc.settings.ft.selected === 'nEDx' &&
                        this.dhc.settings.ft.nEDx.unit === 2 &&
                        this.dhc.settings.ft.nEDx.division === 12 &&
                        ftStep === fmStep) {
                        
                            // If the FT System is ET and the decimal part of the FM is the same as the
                            // input midicent value
                            let nEDxFixStepCent = (this.dhc.tables.ft[1].mc - this.dhc.tables.ft[0].mc) / 2;
                            // Add or remove 50 cents to draw the first/last FT key entirely
                            let mcFix = presetTarget === 'min' ? -nEDxFixStepCent : nEDxFixStepCent;
                            this.settings.freqRange.ft[presetTarget] = this.addCentToHertz(xtRange.hz[presetTarget], mcFix);

                    }  else {
                            this.settings.freqRange[type].min = xtRange.hz.min;
                            this.settings.freqRange[type].max = xtRange.hz.max;
                            // this.settings.freqRange.ft[target] = HUM.DHC.mcToFreq(mcFT);
                    }

                    let unit = type === 'ft' ? 'mc' : 'hz';
                    this.uiElements.in[`freq_range_custom_${presetTarget}_${type}`].value = xtRange[unit][presetTarget];
                    // this.uiElements.in[`freq_range_custom_${presetTarget}_+${type}`].value = xtRange[unit][presetTarget];
                    this.uiElements.out[`freq_range_custom_${presetTarget}_trad_${type}`].innerText = this.dhc.mcToNameString(xtRange.mc[presetTarget]);
                    // this.uiElements.out[`freq_range_custom_${presetTarget}_trad_+${type}`].innerText = this.dhc.mcToNameString(xtRange.mc[presetTarget]);
                }
            }
            this[type].refillFreqArrays();
            this[type].drawFreqUI();
        }

        addCentToHertz(initFreq, addCents) {
            let resCents = HUM.DHC.freqToMc(initFreq);
            resCents += addCents;
            return HUM.DHC.mcToFreq(resCents);
        }

        updatesFromDHC(msg) {
            if (msg.cmd === 'init') {
                for (let type of ['ft', 'ht']) {
                    this.updatePadRangeUI(type);
                }
            }

            if (msg.cmd === 'panic') {
                this.ft.allNotesOff();
                this.ht.allNotesOff();
            }

            if (msg.cmd === 'update') {
                if (msg.type === 'ft') {

                    // For each target pad of the FT scale
                    for (let targetPad of this.settings.scaleDisplay.ft) {
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
                    for (let targetPad of this.settings.scaleDisplay.ht) {
                        // Do stuff for HT changes
                        this[targetPad].refillFreqArrays();
                        this[targetPad].drawFreqUI();
                    }
                
                } else if (msg.type === 'ctrlmap') {
                    // Do nothing at the moment
                }
           
            } else if (msg.cmd === 'tone-on') {
                if (msg.type === 'ft') {

                    this.ft.currentFreq = this.dhc.tables.ft[msg.xtNum].hz;
                    // this.ht.currentFreq = this.dhc.tables.ht[this.dhc.settings.ht.curr_ht].hz;
                    // this.ht.drawFreqMonitor();

                    for (let targetPad of this.settings.scaleDisplay.ft) {
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

                    for (let targetPad of this.settings.scaleDisplay.ht) {
                        // Do stuff for HT changes
                        // this[targetPad].canvasObjects.key.current.ht = data;
                        this[targetPad].drawFreqUI();
                    }

                }

            } else if (msg.cmd === 'tone-off') {
                if (msg.type === 'ft') {

                    for (let targetPad of this.settings.scaleDisplay.ft) {
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

                    for (let targetPad of this.settings.scaleDisplay.ht) {
                        // Do stuff for HT changes
                        // this[targetPad].canvasObjects.key.current.ht = false;
                        this[targetPad].drawFreqUI();
                    }
                }
            }
        }
        
        arrangePads() {
            let setDiv = this.uiElements.fn.setDiv,
                padsDiv = {
                    ft: this.uiElements.fn.ftDiv,
                    ht: this.uiElements.fn.htDiv
                },

            tbarDiv = this.uiElements.fn.tbarDiv,

            padOrder = this.settings.padOrder, // ['ft', 'ht']
            tbOrientation = this.settings.toolbarOrientation,
            tbPosition = this.settings.toolbarPosition[tbOrientation];
                         //   longitudinal: 1, // 0, 1, 2 (pre, mid, post)
                         //   transversal: 0, // 0, 2 (pre, post)
            
            let currentOrder = [ padsDiv[padOrder[0]], padsDiv[padOrder[1]] ];
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
        
        invertPads() {
            this.settings.padOrder = this.settings.padOrder[0] === 'ft' ? ['ht', 'ft'] : ['ft', 'ht'];
            this.uiElements.in.pads_order.value = this.settings.padOrder[0] === 'ft' ? 'ftht' : 'htft';
            for (let type of ['ft', 'ht']) {
                this.settings.canvasObjectsRatios[type].key.position = 1 - this.settings.canvasObjectsRatios[type].key.position;
                this[type].drawFreqUI();
            }
            this.arrangePads();
        }

        setToolbarOrientation(value) {
            if (value !== this.settings.toolbarOrientation) {
                this.settings.toolbarOrientation = value;
                // Disable the 'mid' value if orientation is 'transversal'
                this.uiElements.in.toolbar_position.options[1].disabled = value === 'transversal' ? true : false;
                this.uiElements.in.toolbar_position.value = this.settings.toolbarPosition[value];
                this.dpPadComponent.windowResize();
                this.arrangePads();
            } else {
                return;
            }
        }

        switchToolbarPosition() {
            let tbPosLong = this.settings.toolbarPosition.longitudinal,
                tbPosTras = this.settings.toolbarPosition.transversal;
            if (this.settings.toolbarOrientation === 'longitudinal') {
                if (tbPosLong < 2) {
                    this.settings.toolbarPosition.longitudinal++;
                } else {
                    this.settings.toolbarOrientation = 'transversal';
                    this.settings.toolbarPosition.transversal = 0;
                }
            } else if (this.settings.toolbarOrientation === 'transversal') {

                if (tbPosTras === 0) {
                    this.settings.toolbarPosition.transversal = 2;
                } else {
                    this.settings.toolbarOrientation = 'longitudinal';
                    this.settings.toolbarPosition.longitudinal = 0;
                }
            }
            this.uiElements.in.toolbar_orientation.value = this.settings.toolbarOrientation;
            // Disable the 'mid' value if orientation is 'transversal'
            this.uiElements.in.toolbar_position.options[1].disabled = this.settings.toolbarOrientation === 'transversal' ? true : false;
            this.uiElements.in.toolbar_position.value = this.settings.toolbarPosition[this.settings.toolbarOrientation];
            this.dpPadComponent.windowResize();
            this.arrangePads();
        }
    
    };

    /*   _______          _ _                
     *  |__   __|        | | |               
     *     | | ___   ___ | | |__   __ _ _ __ 
     *     | |/ _ \ / _ \| | '_ \ / _` | '__|
     *     | | (_) | (_) | | |_) | (_| | |   
     *     |_|\___/ \___/|_|_.__/ \__,_|_|   
     */
    DpPad.PadSet.Toolbar = class {
        constructor(padSet, svg) { 
            this.svg = svg;
            this.padSet = padSet;
            this.cssDimensions = {
                width: 0,
                height: 0
            };

            this.icons = {};
            
            this.touchDown = false;

            this.svg.addEventListener('touchstart', (e) => e.preventDefault(), false);
            // this.svg.addEventListener('touchend', (e) => e.preventDefault(), false);
            // this.svg.addEventListener('touchmove', (e) => e.preventDefault(), false);
            this.drawIcons(true);
        }

        drawIcons(init=false) {
            // while (this.svg.lastElementChild) {
            //     this.svg.removeChild(this.svg.lastElementChild);
            // }

            let hrmID = this.padSet.dpPadComponent.harmonicarium.id,
                iconQty = this.padSet.settings.toolbarIconOrder.length,
                tbLenghtX = 0,
                tbLenghtY = 0,
                useWidth = 0,
                useHeight = 0,
                preserveAspectRatio = '',
                iconRotated = false;

            if (this.padSet.dpPadComponent.settings.orientation === 'vertical') {
                if (this.padSet.settings.toolbarOrientation === 'longitudinal') {
                    tbLenghtX = 0;
                    tbLenghtY = this.cssDimensions.height;
                    // Manual fix for the allignment  (started from 100% and 10%)
                    useWidth = '90%';
                    useHeight = '8%';
                    preserveAspectRatio = 'xMidYMin meet';
                    iconRotated = 0;
                } else if (this.padSet.settings.toolbarOrientation === 'transversal') {
                    tbLenghtX = this.cssDimensions.width;
                    tbLenghtY = 0;
                    useWidth = '8%';
                    useHeight = '90%';
                    preserveAspectRatio = 'xMinYMid meet';
                    iconRotated = 0;
                }
            } else if (this.padSet.dpPadComponent.settings.orientation === 'horizontal') {
                if (this.padSet.settings.toolbarOrientation === 'longitudinal') {
                    tbLenghtX = this.cssDimensions.width;
                    tbLenghtY = 0;
                    useWidth = '8%';
                    useHeight = '90%';
                    preserveAspectRatio = 'xMinYMid meet';
                    iconRotated = 90;
                } else if (this.padSet.settings.toolbarOrientation === 'transversal') {
                    tbLenghtX = 0;
                    tbLenghtY = this.cssDimensions.height;
                    useWidth = '90%';
                    useHeight = '8%';
                    preserveAspectRatio = 'xMidYMin meet';
                    iconRotated = 90;
                }
            }

            let spaceBetweenX = tbLenghtX / iconQty,
                spaceBetweenY = tbLenghtY / iconQty,
                // Manual fix for the allignment (started from 0, 0)
                currentSpaceX = 3,
                currentSpaceY = 5;

            if (init) {
                for (let iconName of this.padSet.settings.toolbarIconOrder) {
                    let useSvg = HUM.tmpl.useIcon(iconName, hrmID, this.svg, currentSpaceX, currentSpaceY);

                    useSvg.addEventListener('mousedown', (e) => this.playProxy(e), false);
                    // useSvg.addEventListener('mousemove', (e) => this.playProxy(e));
                    // useSvg.addEventListener('mouseleave', (e) => this.playProxy(e), false);
                    useSvg.addEventListener('touchstart', (e) => this.playProxy(e), false);
                    // useSvg.addEventListener('touchmove', (e) => this.playProxy(e));
                    useSvg.addEventListener('touchend', (e) => this.playProxy(e), false);
                
                    useSvg.setAttributeNS(null, 'pointer-events', 'bounding-box');
                    useSvg.setAttributeNS(null, 'width', useWidth);
                    useSvg.setAttributeNS(null, 'height', useHeight);
                    useSvg.setAttributeNS(null, 'preserveAspectRatio', preserveAspectRatio);
                    
                    if ( ['rotateView', 'invertPads', 'toolbarPos'].includes(iconName) && iconRotated) {
                        let useBox = useSvg.getBBox(),
                            rotX = useBox.x + useBox.width / 2,
                            rotY = useBox.y + useBox.height / 2;
                        useSvg.setAttributeNS(null, 'transform', `rotate(${iconRotated}, ${rotX}, ${rotY})`);
                    }

                    this.icons[iconName] = useSvg;

                    currentSpaceX += spaceBetweenX;
                    currentSpaceY += spaceBetweenY;
                }
            } else {
                for (const [iconName, useSvg] of Object.entries(this.icons)) {
                    useSvg.setAttributeNS(null, 'x', currentSpaceX);
                    useSvg.setAttributeNS(null, 'y', currentSpaceY);
                    useSvg.setAttributeNS(null, 'width', useWidth);
                    useSvg.setAttributeNS(null, 'height', useHeight);
                    useSvg.setAttributeNS(null, 'preserveAspectRatio', preserveAspectRatio);
                    if ( ['rotateView', 'invertPads', 'toolbarPos'].includes(iconName) && iconRotated) {
                        let useBox = useSvg.getBBox(),
                            rotX = useBox.x + useBox.width / 2,
                            rotY = useBox.y + useBox.height / 2;
                        useSvg.setAttributeNS(null, 'transform', `rotate(${iconRotated}, ${rotX}, ${rotY})`);
                    } else {
                        useSvg.setAttributeNS(null, 'transform', '');
                    }
                    currentSpaceX += spaceBetweenX;
                    currentSpaceY += spaceBetweenY;
                }
            }
        }

        playProxy(e) {
            let icon = this.icons[e.target.dpIcon];

            switch (e.type) {
                // #########
                // # MOUSE #
                // #########
                case 'mousedown':
                    this.padSet.dpPadComponent.mouse.down = icon;
                    this.playIcon(this.padSet.dpPadComponent.mouse.down, 1, icon);
                    break;
                // case 'mousemove':
                //     // Do nothing
                //     break;
                // case 'mouseleave':
                //     if (e.target === this.padSet.dpPadComponent.mouse.down) {
                //         // note off ??
                //     }
                //     break;
                // #########
                // # TOUCH #
                // #########
                case 'touchstart':
                    this.touchDown = icon;
                    this.playIcon(this.touchDown, 1, icon);
                    window.event.preventDefault();
                    break;
                // case 'touchmove':
                //     window.event.preventDefault();
                //     break;
                case 'touchend':
                    for (let i=0; i < e.changedTouches.length; i++) {
                        if (icon.dpIcon === 'piper') {
                            this.touchDown = false;
                            this.playIcon(this.touchDown, 0, icon);
                        } else {
                            // Since the target element of a TouchEvent is the element where the touch started,
                            // we need to know if the touch ends outside the first element in order to simulate
                            // a click style beheviour on touching buttons
                            // (if you click-up outside the button, the action-clickUP is cancelleed)
                            let realTarget = document.elementFromPoint(e.changedTouches[i].pageX, e.changedTouches[i].pageY);
                            if (this.touchDown === realTarget) {
                                this.touchDown = false;
                                this.playIcon(this.touchDown, 0, icon);
                            }
                        }
                    }
                    window.event.preventDefault();
                    break;
            }
        }
        mouseUp(e) {
            // This IF statement implements hold feature by de-click (mouseUp) outside the icon
            // if (this.padSet.dpPadComponent.mouse.down === e.target) {
                if (this.padSet.dpPadComponent.mouse.down.dpIcon) {
                    let icon = this.icons[this.padSet.dpPadComponent.mouse.down.dpIcon];
                    this.playIcon(this.padSet.dpPadComponent.mouse.down, 0, icon);
                }
            // }

        }
        playIcon(pointerDown, state, icon) {
            switch (icon.dpIcon) {
                case 'piper':
                    // state is mouseUp
                    if (state === 1 && pointerDown !== false) {
                        this.padSet.dhc.playHT(HUM.DHCmsg.htON('dppad', 0, 120));
                    } else {                            
                        this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', 0));
                    }
                    break;
                case 'menu':
                    if (state === 0 ) {
                        this.padSet.dhc.harmonicarium.components.backendUtils.showSidebar('settings', this.padSet.dhc.id);
                    }
                    break;
                case 'rotateView':
                    if (state === 0) {
                        this.padSet.dpPadComponent.rotateView();
                    }
                    break;
                case 'openLog':
                    if (state === 0) {
                        this.padSet.dhc.harmonicarium.components.backendUtils.toggleLogPanel();
                    }
                    break;
                case 'toolbarPos':
                    if (state === 0) {
                        this.padSet.switchToolbarPosition();
                    }
                    break;
                case 'rotateFT':
                    if (state === 0) {
                        this.padSet.ft.switchScaleOrientation();
                    }
                    break;
                case 'rotateHT':
                    if (state === 0) {
                        this.padSet.ht.switchScaleOrientation();
                    }
                    break;
                case 'invertPads':
                    if (state === 0) {
                        this.padSet.invertPads();
                    }
                    break;
                case 'panic':
                    if (state === 0) {
                        this.padSet.dhc.panic();
                    }
                    break;
                case 'textIncrease':
                    if (state === 0) {
                        this.textIncrease();
                    }
                    break;
                case 'textDecrease':
                    if (state === 0) {
                        this.textDecrease();
                    }
                    break;
            }
        }
        textIncrease() {
            this.padSet.ft.increaseFontsize();
            this.padSet.ht.increaseFontsize();
        }
        textDecrease() {
            this.padSet.ft.decreaseFontsize();
            this.padSet.ht.decreaseFontsize();
        }


    };

    /*   ______                                          _____          _ 
     *  |  ____|                                        |  __ \        | |
     *  | |__ _ __ ___  __ _ _   _  ___ _ __   ___ _   _| |__) |_ _  __| |
     *  |  __| '__/ _ \/ _` | | | |/ _ \ '_ \ / __| | | |  ___/ _` |/ _` |
     *  | |  | | |  __/ (_| | |_| |  __/ | | | (__| |_| | |  | (_| | (_| |
     *  |_|  |_|  \___|\__, |\__,_|\___|_| |_|\___|\__, |_|   \__,_|\__,_|
     *                    | |                       __/ |                 
     *                    |_|                      |___/                  
     */
    DpPad.PadSet.FrequencyPad = class {
        constructor(type, padSet, canvas) { 
            // Get the specific canvas element from the HTML document passed
            this.canvas = canvas;
            this.type = type;
            this.padSet = padSet;
            this.cssDimensions = {
                width: 0,
                height: 0
            };
            this.freqArrays = {
                ft: new Array(),
                ht: new Array() // Sorted by HT number ascending
            };
            this.canvasObjPos = {
                keys: new Array(),
                // keyTexts: new Array(),
            };
            // ft & ht are the Scales, not the Pads!
            this.activeKeys = {
                ft: false,
                ht: false
            };
            this.currentFreq = 0;
            this.touch = {
                // Variables to keep track of the touch position
                x: null,
                y: null,
                down: false,
                last: { 
                    x: false,
                    y: false
                }
            };
            // If the browser supports the canvas tag, get the 2d drawing context for this canvas,
            // and also store it with the canvas as "ctx" for convenience
            if (this.canvas.getContext) {
                this.ctx = this.canvas.getContext('2d');

                // Add event handlers
                // Check that we have a valid context to draw on/with before adding event handlers
                // React to mouse events on the canvas, and mouseup on the entire document
                this.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
                this.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
                this.canvas.addEventListener('mouseleave', this.mouseLeave.bind(this), false);

                // React to touch events on the canvas
                this.canvas.addEventListener('touchstart', this.touchStart.bind(this), false);
                this.canvas.addEventListener('touchmove', this.touchMove.bind(this), false);
                this.canvas.addEventListener('touchend', this.touchEnd.bind(this), false);
            }
            else {
                alert("Your browser seems to not support the Canvas HTML5 element.\n\nYou cannot use this app.");
                return undefined;
            }

        }
        switchScaleOrientation() {
            this.padSet.settings.scaleOrientation[this.type] = this.padSet.settings.scaleOrientation[this.type] === 'vertical' ? 'horizontal' : 'vertical';
            this.padSet.uiElements.in['scale_orientation_'+this.type].value = this.padSet.settings.scaleOrientation[this.type];
            this.drawFreqUI();
        }
        // ====================================================
        // MOUSE EVENTS
        // ====================================================
        // Note that the sketcphad_mouseUp function is not included here, since it's not 
        // specific to a certain canvas - we're listening to the entire window for mouseup
        // events.

        // Keep track of the mouse button being pressed and draw a dot at current location
        mouseDown() {
            // Down parameter points to the target canvas on mouse down
            this.padSet.dpPadComponent.mouse.down = this.canvas;
            this.play(this.padSet.dpPadComponent.mouse, 'mouse');
            // this.drawLine(this.padSet.dpPadComponent.mouse, 12);

        }
        // Keep track of the mouse position and draw a dot if mouse button is currently pressed
        mouseMove(e) {
            if (this.padSet.dpPadComponent.mouse.down === false) {
                // Update the mouse co-ordinates when moved
                this.padSet.dpPadComponent.updateMousePosition(e);
            } else if (this.padSet.dpPadComponent.mouse.down === this.canvas) {
                // Update the mouse co-ordinates when moved
                this.padSet.dpPadComponent.updateMousePosition(e);
                // Draw a dot if the mouse button is currently being pressed
                this.play(this.padSet.dpPadComponent.mouse, 'mouse');
                // this.drawLine(this.padSet.dpPadComponent.mouse, 12);
            }
        }
        mouseLeave(e) {
            if (e.target === this.padSet.dpPadComponent.mouse.down) {
                // Reset lastX and lastY to false to indicate that they are now invalid, since we have lifted the "pen"
                this.padSet.dpPadComponent.mouse.last.x = false;
                this.padSet.dpPadComponent.mouse.last.y = false;
            }
        }
        mouseUp() {
            // let frequency = this.PadPixToFreq(this.padSet.dpPadComponent.mouse);
            if (this.activeKeys.ft !== false) {
                // console.log('MOUSEUP FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                this.activeKeys.ft = false;
            }
            if (this.activeKeys.ht !== false) {
                // console.log('MOUSEUP HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                this.activeKeys.ht = false;
            }
            // this.drawFreqUI();
        }

        // ====================================================
        // TOUCH EVENTS
        // ====================================================
        // Get the touch position relative to the top-left of the canvas
        // When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
        // but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
        // "target.offsetTop" to get the correct values in relation to the top left of the canvas.
        updateTouchPosition(e) {
            if(e.targetTouches) {
                if (e.targetTouches.length === 1) { // Only deal with one finger
                    let thisTouch = e.targetTouches[0]; // Get the information for finger #1
                    this.touch.x = thisTouch.pageX - thisTouch.target.offsetLeft;
                    this.touch.y = thisTouch.pageY - thisTouch.target.offsetTop;
                }
            }
        }
        // Draw something when a touch start is detected
        touchStart(e) {
            // Update the touch co-ordinates
            this.updateTouchPosition(e);
            this.touch.down = this.canvas;

            this.play(this.touch, 'touch');
            // this.drawLine(this.touch, 12);

            // Prevents an additional mousedown event being triggered
            window.event.preventDefault();
        }
        // Draw something and prevent the default scrolling when touch movement is detected
        touchMove(e) { 
            // Update the touch co-ordinates
            this.updateTouchPosition(e);

            // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
            this.play(this.touch, 'touch');
            // this.drawLine(this.touch, 12);

            // Prevent a scrolling action as a result of this touchmove triggering.
            // window.event.preventDefault();
        }
        touchEnd(e) {
            this.updateTouchPosition(e);
            this.touch.down = false;

            // let frequency = this.PadPixToFreq(this.touch);

            if (this.activeKeys.ft !== false) {
                // console.log('TOUCHEND FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                this.activeKeys.ft = false;
            }
            if (this.activeKeys.ht !== false) {
                // console.log('TOUCHEND HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                this.activeKeys.ht = false;
            }
            // this.drawFreqUI();


            // Reset lastX and lastY to false to indicate that they are now invalid, since we have lifted the "pen"
            this.touch.last.x = false;
            this.touch.last.y = false;
            window.event.preventDefault();
        }
        // ====================================================
        // PLAYING ACTIONS
        // ====================================================

        play(pointer, type) {
            // Fallback method
            // requestAnimFrame((function() {}).bind(this));
            window.requestAnimationFrame( () => {
                // Get the frequecny from the coordinate
                let frequency = this.PadPixToFreq(pointer);
                // Let's assume the pointer didn't touch any key
                // let ft_keyFound = false, ft_noteON = false, ft_noteOFF = false,
                //     ht_keyFound = false, ht_noteON = false, ht_noteOFF = false;
                let keyFound = {ft: false, ht: false},
                    noteON = {ft: false, ht: false},
                    noteOFF = {ft: false, ht: false};

                // - - - - - - COLLISION DETECTION - - - - - -
                let pntX = pointer.x,
                    pntY = pointer.y,
                    foundKeys = this.canvasObjPos.keys.filter( (obj) => {
                    let objX0 = obj.begin[0],
                        objY0 = obj.begin[1],
                        objX1 = obj.end[0],
                        objY1 = obj.end[1];
                    if (pntX > objX0 && pntX < objX1 && pntY > objY0 && pntY < objY1) {
                        return true;
                    }   else {
                        return false;
                    }
                });
                foundKeys.sort((a, b) => b.zindex-a.zindex);
                let objectFound = foundKeys[0];
                if (objectFound) {
                    for (let type of ['ft', 'ht']) {
                        if (objectFound.type === type) {
                            keyFound[type] = objectFound;
                            // If there isn't a key alreadypressed 
                            if (this.activeKeys[type] === false ) {
                                // note on the pressed
                                noteON[type] = objectFound;
                            // If there is a pressed key
                            } else {
                                // If the new pressed key is different from the previous
                                if (this.activeKeys[type].toneNumber !== objectFound.toneNumber) {
                                    // note off the previous
                                    noteOFF[type] = this.activeKeys[type];
                                    // note on the pressed
                                    noteON[type] = objectFound;
                                } else {
                                    // do nothing
                                }
                            }
                        }
                    }
                }

                // Check if a Key is touched
                // For every Key
                // for (let obj of this.canvasObjPos.keys) {
                //     let objX0 = obj.begin[0],
                //         objY0 = obj.begin[1],
                //         objX1 = obj.end[0],
                //         objY1 = obj.end[1];
                //     // If the Pointer is in the X-range and Y-range of the Key
                //     if (pntX > objX0 && pntX < objX1 && pntY > objY0 && pntY < objY1) {
                //         // For every scale type (ft and ht) 
                //         for (let type of ['ft', 'ht']) {
                //             if (obj.type === type) {
                //                 keyFound[type] = obj;
                //                 // If there isn't a key alreadypressed 
                //                 if (this.activeKeys[type] === false ) {
                //                     // note on the pressed
                //                     noteON[type] = obj;
                //                 // If there is a pressed key
                //                 } else {
                //                     // If the new pressed key is different from the previous
                //                     if (this.activeKeys[type].toneNumber !== obj.toneNumber) {
                //                         // note off the previous
                //                         noteOFF[type] = this.activeKeys[type];
                //                         // note on the pressed
                //                         noteON[type] = obj;
                //                     } else {
                //                         // do nothing
                //                     }
                //                 }
                //             }
                //         }
                //     }
                // }
                // - - - - - - - - - - - - - - - - - - - - - -

                if (keyFound.ft || keyFound.ht) {

                    // ====== FT ======
                    if (noteOFF.ft !== false) {
                        // console.log('PLAY FT NOTE OFF: ' + noteOFF.ft.toneNumber);
                        this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', noteOFF.ft.toneNumber));
                        this.activeKeys.ft = false;
                    }
                    if (noteON.ft !== false && pointer.down !== false) {
                    // if (noteON.ft !== false) {
                        // console.log('PLAY FT NOTE ON: ' + noteON.ft.toneNumber);
                        this.activeKeys.ft = noteON.ft;
                        this.padSet.dhc.playFT(HUM.DHCmsg.ftON('dppad', noteON.ft.toneNumber, 120));
                    }

                    // ====== HT ======
                    if (noteOFF.ht !== false) {
                        // console.log('PLAY HT NOTE OFF: ' + noteOFF.ht.toneNumber);
                        this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', noteOFF.ht.toneNumber));
                        this.activeKeys.ht = false;
                    }
                    if (noteON.ht !== false && pointer.down !== false) {
                        // console.log('PLAY HT NOTE ON: ' + noteON.ht.toneNumber);
                        this.activeKeys.ht = noteON.ht;
                        this.padSet.dhc.playHT(HUM.DHCmsg.htON('dppad', noteON.ht.toneNumber, 120));
                    }

                    // ====== REFRESHES ======
                    if (this.type === 'ft') {
                        // [ Now, all the target Pads of the HT scale are re-drawn ]
                        // If this FT Pad shouldn't show the HT scale (if the HT scale doesn't have to be shown in the FT Pads)
                        if (!this.padSet.settings.scaleDisplay.ht.includes('ft')) {
                            // Redraw the UI of this Pad...
                            // because the 'PadSet.updatesFromDHC' method only updates the target Pads of the HT scale
                            // this.drawFreqUI();
                        }

                    } else if (this.type === 'ht') {
                        if (!this.padSet.settings.scaleDisplay.ht.includes('ht')) {

                        }
                        // this.drawFreqUI();
                    }


                    if (keyFound.ft) {
                        this.currentFreq = this.padSet.dhc.tables.ft[keyFound.ft.toneNumber].hz;
                    }
                    if (keyFound.ht) {
                        this.currentFreq = this.padSet.dhc.tables.ht[keyFound.ht.toneNumber].hz;
                    }
                    // this.drawFreqUI();
                    // this.drawFreqMonitor();

                } else {

                    if (!keyFound.ft) {
                        if (this.activeKeys.ft !== false) {
                            // console.log('PLAY FT NOTE OFF: ' + this.activeKeys.ft.toneNumber);
                            this.padSet.dhc.muteFT(HUM.DHCmsg.ftOFF('dppad', this.activeKeys.ft.toneNumber));
                            this.activeKeys.ft = false;
                        }
                    }
                    if (!keyFound.ht) {
                        if (this.activeKeys.ht !== false) {
                            // console.log('PLAY HT NOTE OFF: ' + this.activeKeys.ht.toneNumber);
                            this.padSet.dhc.muteHT(HUM.DHCmsg.htOFF('dppad', this.activeKeys.ht.toneNumber));
                            this.activeKeys.ht = false;
                        }
                    }

                    this.currentFreq = frequency;
                    // Update the frequency monintor
                    this.drawFreqUI();
                    // this.drawFreqMonitor();
                }

            });
        }

        allNotesOff() {
            this.activeKeys.ft = false;
            this.activeKeys.ht = false;
            this.drawFreqUI();
        }

        // ====================================================
        // DRAWING ACTIONS
        // ====================================================
        getHTcolor(htNumber) {
            let colRatio = (Math.log(Math.abs(htNumber))/Math.log(this.padSet.dhc.settings.ft.nEDx.unit)) % 1,
                colorH = 360 * colRatio,
                colorS = this.padSet.settings.canvasObjectsRatios.ht.key.saturation,
                colorL = this.padSet.settings.canvasObjectsRatios.ht.key.lightness;
            return [
             `hsl(${colorH}, ${colorS}%, ${colorL*1.6}%)`, // lighter
             `hsl(${colorH}, ${colorS}%, ${colorL}%)`, // color
             `hsl(${colorH}, ${colorS*1.5}%, ${colorL/1.5}%)`, // darker
            ];
        }

        // Clear the canvas context using the canvas width and height
        clearCanvas() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.beginPath();
        }
        changeFontsize(target, value) {
            this.padSet.settings.fonts[this.type][target].size = value;
            this.drawFreqUI();
        }
        increaseFontsize() {
            for (const [target, font] of Object.entries(this.padSet.settings.fonts[this.type])) {
                let newValue = Math.round(this.padSet.settings.fonts[this.type][target].size / 0.9);
                this.padSet.settings.fonts[this.type][target].size = newValue;
                this.padSet.uiElements.in[`fontsize_${target}_${this.type}`].value = newValue;
            }
            this.drawFreqUI();
        }
        decreaseFontsize() {
            for (const [target, font] of Object.entries(this.padSet.settings.fonts[this.type])) {
                let newValue = Math.round(this.padSet.settings.fonts[this.type][target].size * 0.9);
                this.padSet.settings.fonts[this.type][target].size = newValue;
                this.padSet.uiElements.in[`fontsize_${target}_${this.type}`].value = newValue;
            }
            this.drawFreqUI();
        }
        drawFreqLine(pxPosition, close=true) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type];

            if (scaleOrientation === 'vertical') {
                ctx.moveTo(0, pxPosition);
                ctx.lineTo(this.cssDimensions.width, pxPosition);
            } else if (scaleOrientation === 'horizontal') {
                ctx.moveTo(pxPosition, 0);
                ctx.lineTo(pxPosition, this.cssDimensions.height);
            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            if (close) {
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
        }

        drawLinKey(pxPosition, type=false, xtNum=false, thickness=false, grdColors=false, zindex=false) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type],
                keyRatios = this.padSet.settings.canvasObjectsRatios.ft.key;
            let keyWidth, keyHeight, middleOffset, xBegin, yBegin, xEnd, yEnd = 0;

            if (scaleOrientation === 'vertical') {
                keyWidth = thickness ? this.cssDimensions.width : this.cssDimensions.width * keyRatios.length;
                keyHeight = thickness || this.cssDimensions.height / this.freqArrays.ft.length;
                middleOffset = keyHeight / 2;
                xBegin = (this.cssDimensions.width - keyWidth) * keyRatios.position;
                yBegin = pxPosition-middleOffset;
                xEnd = keyWidth+xBegin;
                yEnd = keyHeight+yBegin;
                if (grdColors) {
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    // Reverse the gradient in accordance with the key position
                    if(keyRatios.position > 0.5) {
                        grd.addColorStop(0, grdColors[0]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[2]);
                    } else {
                        grd.addColorStop(0, grdColors[2]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[0]);
                    }
                    ctx.fillStyle = grd;
                }
                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
            } else if (scaleOrientation === 'horizontal') {
                keyWidth = thickness || this.cssDimensions.width / this.freqArrays.ft.length;
                keyHeight = thickness ? this.cssDimensions.height : this.cssDimensions.height * keyRatios.length;
                middleOffset = keyWidth / 2;
                xBegin = pxPosition-middleOffset;
                yBegin = (this.cssDimensions.height - keyHeight) * keyRatios.position;
                xEnd = keyWidth+xBegin;
                yEnd = keyHeight+yBegin;
                if (grdColors) {
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    // Reverse the gradient in accordance with the key position
                    if(keyRatios.position > 0.5) {
                        grd.addColorStop(0, grdColors[0]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[2]);
                    } else {
                        grd.addColorStop(0, grdColors[2]);
                        grd.addColorStop(0.5, grdColors[1]);
                        grd.addColorStop(1, grdColors[0]);
                    }
                    ctx.fillStyle = grd;
                }
                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            // If it's a key and not a line
            if (!thickness) {
                this.canvasObjPos.keys.push(Object.freeze({
                    type: type,
                    toneNumber: xtNum,
                    //                      x0       y0
                    begin: Object.freeze([xBegin, yBegin]),
                    //                   x1     y1
                    end: Object.freeze([xEnd, yEnd]),
                    zindex: zindex
                }));
            }
        }

        // drawFreqKeyFT(pxPosition, ftNumber) {
        //     let ctx = this.ctx,
        //         scaleOrientation = this.padSet.settings.scaleOrientation[this.type],
        //         keyRatios = this.padSet.settings.canvasObjectsRatios.ft.key;
        //     let keyWidth, keyHeight, middleOffset, xBegin, yBegin = 0;

        //     if (scaleOrientation === 'vertical') {
        //         keyWidth = this.cssDimensions.width * keyRatios.length;
        //         keyHeight = this.cssDimensions.height / this.freqArrays.ft.length;
        //         middleOffset = keyHeight / 2;
        //         xBegin = (this.cssDimensions.width - keyWidth) * keyRatios.position;
        //         yBegin = pxPosition-middleOffset;
        //         ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
        //         ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
        //     } else if (scaleOrientation === 'horizontal') {
        //         keyWidth = this.cssDimensions.width / this.freqArrays.ft.length;
        //         keyHeight = this.cssDimensions.height * keyRatios.length;
        //         middleOffset = keyWidth / 2;
        //         xBegin = pxPosition-middleOffset;
        //         yBegin = (this.cssDimensions.height - keyHeight) * keyRatios.position;
        //         ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
        //         ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
        //     } else {
        //         alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
        //     }
        //     this.canvasObjPos.keys.push(Object.freeze({
        //         type: 'ft',
        //         toneNumber: ftNumber,
        //         //                      x0       y0
        //         begin: Object.freeze([xBegin, yBegin]),
        //         //                          x1               y1
        //         end: Object.freeze([keyWidth+xBegin, keyHeight+yBegin])
        //     }));
        // }

        drawFreqKeyHT(thisFreq, htNumber, arrIdx, grdColors, zindex) {
            let ctx = this.ctx,
                freqRange = this.padSet.settings.freqRange[this.type],
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type],
                keyRatios = this.padSet.settings.canvasObjectsRatios.ht.key;
            // let thisPix = this.freqToPadPix(thisFreq);
            let keyWidth, keyHeight,
                xBegin, yBegin, xEnd, yEnd,
                follFreq, prevFreq,
                middleOffsetFreq = 0;

                if (arrIdx === 0) {
                    follFreq = this.freqArrays.ht[arrIdx+1][1].hz;
                    prevFreq = freqRange.min;
                } else if (arrIdx === this.freqArrays.ht.length-1){
                    follFreq = freqRange.max;
                    prevFreq = this.freqArrays.ht[arrIdx-1][1].hz;
                } else {
                    follFreq = this.freqArrays.ht[arrIdx+1][1].hz;
                    prevFreq = this.freqArrays.ht[arrIdx-1][1].hz;
                }

            if (scaleOrientation === 'vertical') {

                let follHeighFreq = ((follFreq - thisFreq) / 3),
                    prevHeighFreq = ((thisFreq - prevFreq) / 3),
                    keyHeightFreq = follHeighFreq + prevHeighFreq;
                middleOffsetFreq = keyHeightFreq / 2;
                let yBeginFreq = thisFreq - middleOffsetFreq;
                
                keyWidth = this.cssDimensions.width * keyRatios.length;
                xBegin = (this.cssDimensions.width - keyWidth) * keyRatios.position;

                yBegin = this.freqToPadPix(yBeginFreq+keyHeightFreq);
                yEnd = this.freqToPadPix(yBeginFreq);
                keyHeight = yEnd - yBegin;
                xEnd = keyWidth+xBegin;

                // TEST METHOD
                // keyWidth = this.canvas.height; //  * keyRatio.length;
                // keyHeight =  (this.canvas.width / this.freqArrays.ht.length) / (htNumber*0.5);
                // let middleOffset = keyHeight / 2;
                // xBegin = 0
                // yBegin = thisPix-middleOffset;;

                if (grdColors) {
                    // Set the middle color where there is the key label
                    // (the middle color is supposed to be the best to contrast with the key label)
                    let ratios = this.padSet.settings.canvasObjectsRatios.ht;
                    let labelColorStop = ratios.key.position > 0.5 ? 1-ratios.keyText.position : ratios.keyText.position;
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    grd.addColorStop(0, grdColors[0]);
                    grd.addColorStop(labelColorStop, grdColors[1]);
                    grd.addColorStop(1, grdColors[2]);
                    ctx.fillStyle = grd;
                }

                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);

            // @todo FIX !!!!
            } else if (scaleOrientation === 'horizontal') {

                let follWidthFreq = ((follFreq - thisFreq) / 3),
                    prevWidthFreq = ((thisFreq - prevFreq) / 3),
                    keyWidthFreq = follWidthFreq + prevWidthFreq;
                middleOffsetFreq = keyWidthFreq / 2;
                let xBeginFreq = thisFreq - middleOffsetFreq;
                
                keyHeight = this.cssDimensions.height * keyRatios.length;
                yBegin = (this.cssDimensions.height - keyHeight) * keyRatios.position;       
                xBegin = this.freqToPadPix(xBeginFreq);
                xEnd = this.freqToPadPix(xBeginFreq+keyWidthFreq);
                keyWidth = xEnd - xBegin;
                yEnd = keyHeight + yBegin;

                if (grdColors) {
                    // Set the middle color where there is the key label
                    // (the middle color is supposed to be the best to contrast with the key label)
                    let ratios = this.padSet.settings.canvasObjectsRatios.ht;
                    let labelColorStop = ratios.key.position > 0.5 ? 1-ratios.keyText.position : ratios.keyText.position;
                    let grd = ctx.createLinearGradient(xBegin, yBegin, xEnd, yEnd);
                    grd.addColorStop(0, grdColors[0]);
                    grd.addColorStop(labelColorStop, grdColors[1]);
                    grd.addColorStop(1, grdColors[2]);
                    ctx.fillStyle = grd;
                }

                ctx.fillRect(xBegin, yBegin, keyWidth, keyHeight);
                ctx.strokeRect(xBegin, yBegin, keyWidth, keyHeight);

            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            this.canvasObjPos.keys.push(Object.freeze({
                type: 'ht',
                toneNumber: htNumber,
                //                      x0       y0
                begin: Object.freeze([xBegin, yBegin]),
                //                   x1     y1
                // end: Object.freeze([xEnd, yEnd])
                end: Object.freeze([xEnd, yEnd]),
                zindex: zindex
            }));
        }

        drawKeyLabelFT(pxPosition, note) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type],
                ratios = this.padSet.settings.canvasObjectsRatios.ft,
                font = this.padSet.settings.fonts.ft.keyLabel;
            //        note name
            let text = note[0];
            if (note[2] !== 0.0) {
                //             +/-       cents   cent symbol
                text += " " + note[1] + note[2] + "\u00A2";
            }
            if (scaleOrientation === 'vertical') {
                let keyWidth = this.cssDimensions.width * ratios.key.length,
                    xBegin = (this.cssDimensions.width - keyWidth) * ratios.key.position,
                    y = pxPosition,
                    // If the key switch side, mirrorize the keyText position
                    x = ratios.key.position > 0.5 ? (keyWidth * 2) - (keyWidth * ratios.keyText.position)
                                                  : xBegin + (keyWidth * ratios.keyText.position);
                ctx.textBaseline = "middle";
                ctx.font = font.getCss;
                ctx.fillText(text, x, y);
            } else if (scaleOrientation === 'horizontal') {
                let keyHeight = this.cssDimensions.height * ratios.key.length,
                    yBegin = (this.cssDimensions.height - keyHeight) * ratios.key.position,
                    // If the key switch side, mirrorize the keyText position
                    y = ratios.key.position > 0.5 ? (keyHeight * 2) - (keyHeight * ratios.keyText.position)
                                                  : yBegin + (keyHeight * ratios.keyText.position),
                    x = pxPosition;
                if (ratios.keyText.rotation) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI * ratios.keyText.rotation);
                    ctx.font = font.getCss;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                } else {
                    ctx.font = font.getCss;
                    ctx.textAlign = "center";
                    ctx.fillText(text, x, y);
                }
            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            if (close) {
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
        }
        
        drawKeyLabelHT(pxPosition, note, htNumber) {
            let ctx = this.ctx,
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type],
                ratios = this.padSet.settings.canvasObjectsRatios.ht,
                fontKey = this.padSet.settings.fonts.ht.keyLabel,
                fontLine = this.padSet.settings.fonts.ht.lineLabel,
                x, y;
            //            note name
            let textNote = note[0];
            if (note[2] !== 0.0) {
                //                 +/-       cents   cent symbol
                textNote += " " + note[1] + note[2] + "\u00A2";
            }
            let textHT = "H " + htNumber;

            if (scaleOrientation === 'vertical') {
                // LINE TEXT
                y = pxPosition;
                // If the key switch side, mirrorize the lineText position
                x = ratios.key.position > 0.5 ? this.cssDimensions.width * ratios.lineText.position
                                              : this.cssDimensions.width * (1 - ratios.lineText.position);
                ctx.font = fontLine.getCss;
                ctx.textBaseline = "middle";
                ctx.textAlign = "left";
                ctx.fillText(textNote, x, y);

                // KEY TEXT
                let keyWidth = this.cssDimensions.width * ratios.key.length,
                    xBegin = (this.cssDimensions.width - keyWidth) * ratios.key.position;
                y = pxPosition;
                // If the key switch side, mirrorize the keyText position
                x = ratios.key.position > 0.5 ? (keyWidth * 2) - (keyWidth * ratios.keyText.position)
                                              : xBegin + (keyWidth * ratios.keyText.position);

                ctx.font = fontKey.getCss;
                ctx.textBaseline = "middle";
                ctx.textAlign = "right";
                ctx.fillText(textHT, x, y);
            
            } else if (scaleOrientation === 'horizontal') {
                // LINE TEXT
                x = pxPosition;
                y = ratios.key.position > 0.5 ? this.cssDimensions.height * ratios.lineText.position
                                              :  this.cssDimensions.height * (1 - ratios.lineText.position);
                // y = this.cssDimensions.height * ratios.lineText.position;
                if (ratios.lineText.rotation) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI * ratios.lineText.rotation);
                    ctx.font = fontLine.getCss;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillText(textNote, 0, 0);
                    ctx.restore();
                } else {
                    ctx.font = fontLine.getCss;
                    ctx.textAlign = "center";
                    ctx.fillText(textNote, x, y);
                }

                // KEY TEXT
                let keyHeight = this.cssDimensions.height * ratios.key.length,
                    yBegin = (this.cssDimensions.height - keyHeight) * ratios.key.position;
                // If the key switch side, mirrorize the keyText position
                y = ratios.key.position > 0.5 ? (keyHeight * 2) - (keyHeight * ratios.keyText.position)
                                              : yBegin + (keyHeight * ratios.keyText.position);
                x = pxPosition;
                if (ratios.lineText.rotation) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI * ratios.lineText.rotation);
                    ctx.font = fontLine.getCss;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "right";
                    ctx.fillText(textHT, 0, 0);
                    ctx.restore();
                } else {
                    ctx.font = fontLine.getCss;
                    ctx.textAlign = "center";
                    ctx.fillText(textNote, x, y);
                }

            } else {
                alert('A "scaleOrientation" parameter for the [ '+ this.type + this.padSet.id +' ] Pad is invalid: '+ scaleOrientation);
            }
            if (close) {
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
        }

        drawFreqUI() {
            let ctx = this.ctx,
                zindex = 0;
            const findIdxFn = function(queueTone) {
                return queueTone.xtNum === this;
            };
            this.canvasObjPos.keys = new Array();

            // Canvas init
            this.clearCanvas();
            ctx.lineWidth = 1;
            
            // =================
            //        FT
            // =================

            // - - - - - - - - -
            // FT LINES
            ctx.save();
            ctx.beginPath();
            for (let ft of this.freqArrays.ft) {
                let pxPosition = this.freqToPadPix(ft[1].hz);
                if (this.padSet.dhc.settings.ht.curr_ft === ft[0]) {
                    ctx.save();
                    ctx.fillStyle = '#db5757';                    
                    ctx.strokeStyle = '#db5757';
                    ctx.shadowColor = '#db5757';
                    // ctx.shadowOffsetX = 25;
                    ctx.shadowBlur = 15;
                    this.drawLinKey(pxPosition, false, false, 1);
                    // this.drawFreqLine(pxPosition, false);
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'gray';                    
                    ctx.strokeStyle = 'gray';                    
                    // this.drawFreqLine(pxPosition, false);
                    this.drawLinKey(pxPosition, false, false, 0.3);

                }
            }
            ctx.strokeStyle = 'grey';
            ctx.stroke();
            ctx.restore();
            
            // - - - - - - - - -
            // FT KEYS
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'grey';
            let curr_ft = false;
            zindex = 0;
            for (let ft of this.freqArrays.ft) {
                ctx.save();
                let pxPosition = this.freqToPadPix(ft[1].hz);
                let note = this.padSet.dhc.mcToName(ft[1].mc);
                if (this.padSet.dhc.settings.ht.curr_ft === ft[0]) {
                    // Draw the curr_ft as the last key
                    curr_ft = [pxPosition, ft[0]];
                    continue;
                }
                if (this.padSet.dhc.playQueue.ft.findIndex(findIdxFn, ft[0]) > -1) {
                    // this.drawLinKey(pxPosition, 'ft', ft[0], false, ['#DarkSalmon', 'DarkSalmon', '#110e23']);
                    this.drawLinKey(pxPosition, 'ft', ft[0], false, ['darksalmon', 'darksalmon', '#db9c57'], zindex);
                    // this.drawLinKey(pxPosition, 'ft', ft[0]);
                } else {
                    if (note[3]) {
                        this.drawLinKey(pxPosition, 'ft', ft[0], false, ['#28272d', '#514e5f', '#110e23'], zindex);
                        // this.drawFreqKeyFT(pxPosition, ft[0]);
                    } else {
                        ctx.fillStyle = 'white';
                        this.drawLinKey(pxPosition, 'ft', ft[0], false, ['white', 'white', '#cdcade'], zindex);
                        // this.drawFreqKeyFT(pxPosition, ft[0]);
                    }
                }
                zindex++;
                ctx.restore();
            }
            ctx.restore();
            // Draw the curr_ft as the last key
            // (it's shadow must cover the adjacent keys)
            if (curr_ft) {
                ctx.save();
                ctx.shadowColor = 'red';
                if (this.padSet.settings.scaleOrientation.ft === 'vertical') {
                    ctx.shadowOffsetX = this.padSet.settings.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                } else if (this.padSet.settings.scaleOrientation.ft === 'horizontal') {
                    ctx.shadowOffsetY = this.padSet.settings.canvasObjectsRatios.ft.key.position > 0.5 ? -20 : 20;
                }
                ctx.shadowBlur = 20;
                this.drawLinKey(curr_ft[0], 'ft', curr_ft[1], false, ['darksalmon', 'darksalmon', '#db9c57'], this.freqArrays.ft.length);
                ctx.restore();
            }

            // - - - - - - - - -
            // FT KEY LABELS
            ctx.save();
            ctx.beginPath();
            for (let ft of this.freqArrays.ft) {
                let pxPosition2 = this.freqToPadPix(ft[1].hz);
                let note = this.padSet.dhc.mcToName(ft[1].mc);
                if (note[3]) {
                    ctx.fillStyle = 'white';
                    this.drawKeyLabelFT(pxPosition2, note);
                } else {
                    ctx.fillStyle = 'black';
                    this.drawKeyLabelFT(pxPosition2, note);
                }
            }
            ctx.restore();
            // =================
            //        HT
            // =================

            // - - - - - - - - -
            // HT LINES
            ctx.save();
            ctx.beginPath();
            for (let ht of this.freqArrays.ht) {
                let pxPosition = this.freqToPadPix(ht[1].hz);
                let color = this.getHTcolor(ht[0]);

                if (this.padSet.dhc.settings.ht.curr_ht === ht[0]) {
                    ctx.save();
                    ctx.fillStyle = color[2];                    
                    ctx.strokeStyle = color[2];
                    ctx.shadowColor = color[2];
                    // ctx.shadowOffsetX = 25;
                    ctx.shadowBlur = 15;
                    this.drawLinKey(pxPosition, false, false, 1);
                    // this.drawFreqLine(pxPosition, false);
                    ctx.restore();
                } // else 
                if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) {
                    ctx.save();
                    ctx.fillStyle = color[2];                    
                    ctx.strokeStyle = color[2];
                    ctx.shadowColor = color[2];
                    // ctx.shadowOffsetX = 25;
                    ctx.shadowBlur = 15;
                    this.drawLinKey(pxPosition, false, false, 1);
                    // this.drawFreqLine(pxPosition, false);
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'gray';                    
                    ctx.strokeStyle = 'gray';
                    // this.drawFreqLine(pxPosition, false);
                    this.drawLinKey(pxPosition, false, false, 0.3);

                }
                // this.drawFreqLine(pxPosition, false);
            }
            ctx.strokeStyle = 'grey';
            ctx.stroke();
            ctx.restore();

            // - - - - - - - - -
            // HT KEYS
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'grey';
            zindex = 0;
            for (const [arrIdx, ht] of this.freqArrays.ht.entries()) {
                ctx.save();
                let color = this.getHTcolor(ht[0]);
                // if (this.padSet.dhc.settings.ht.curr_ht === ht[0]) { // Only the last played HT
                //     ctx.shadowColor = color[2];
                //     ctx.shadowOffsetX = this.padSet.settings.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                //     ctx.shadowBlur = 20;
                // } // else if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) { // All the played HTs
                //     ctx.shadowColor = color[2];
                //     ctx.shadowOffsetX = this.padSet.settings.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                //     ctx.shadowBlur = 20;
                // }
                // if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) { // All the played HTs
                if (this.padSet.dhc.settings.ht.curr_ht === ht[0]) { // Only the last played HT
                    ctx.shadowColor = color[2];
                    if (this.padSet.settings.scaleOrientation.ht === 'vertical') {
                        ctx.shadowOffsetX = this.padSet.settings.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    } else if (this.padSet.settings.scaleOrientation.ht === 'horizontal') {
                        ctx.shadowOffsetY = this.padSet.settings.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    }
                    ctx.shadowBlur = 20;
                }
                if (this.padSet.dhc.playQueue.ht.findIndex(findIdxFn, ht[0]) > -1) {
                    ctx.shadowColor = color[2];
                    if (this.padSet.settings.scaleOrientation.ht === 'vertical') {
                        ctx.shadowOffsetX = this.padSet.settings.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    } else if (this.padSet.settings.scaleOrientation.ht === 'horizontal') {
                        ctx.shadowOffsetY = this.padSet.settings.canvasObjectsRatios.ht.key.position > 0.5 ? -20 : 20;
                    }
                    ctx.shadowBlur = 20;
                    // The 2nd color of the passed array is supposed to be the best to contrast with the key label
                    this.drawFreqKeyHT(ht[1].hz, ht[0], arrIdx, [color[2], color[0], color[2]], zindex);
                } else {
                    ctx.fillStyle = this.getHTcolor(ht[0]);
                    this.drawFreqKeyHT(ht[1].hz, ht[0], arrIdx, [color[0], color[0], color[0]], zindex);
                }
                ctx.restore();
                zindex++;
            }
            ctx.restore();

            // - - - - - - - - -
            // HT KEY & LINE LABELS
            ctx.save();
            ctx.beginPath();
            for (let ht of this.freqArrays.ht) {
                let pxPosition = this.freqToPadPix(ht[1].hz);
                let note = this.padSet.dhc.mcToName(ht[1].mc);
                ctx.fillStyle = 'black';
                this.drawKeyLabelHT(pxPosition, note, ht[0]);
            }
            ctx.restore();

            this.drawFreqMonitor();

        }
        // drawVolumeLines: function(dist, width) {
        //     for(var x=0; x<width; x+=dist) {
        //         ctx.moveTo(x,0);
        //         ctx.lineTo(x,width);
        //     }
        //     ctx.strokeStyle='grey';
        //     ctx.stroke();
        // },
        drawFreqMonitor() {
            if (this.currentFreq) {
                let ctx = this.ctx,
                    font = this.padSet.settings.fonts[this.type].hzMonitor.getCss,
                    scaleOrientation = this.padSet.settings.scaleOrientation[this.type],
                    ratios = this.padSet.settings.canvasObjectsRatios[this.type],
                    text = this.currentFreq.toFixed(this.padSet.dhc.settings.global.hz_accuracy) + ' Hz',
                    x, y;

                ctx.save();
                ctx.font = font;
                if (scaleOrientation === 'vertical') {
                    x = this.cssDimensions.width * ratios.hzMonitor.width;
                    y = this.cssDimensions.height * ratios.hzMonitor.height;
                    if (ratios.key.position > 0.5) {
                        ctx.textBaseline = "bottom";
                        ctx.textAlign = "left";
                        x = this.cssDimensions.width * (1 - ratios.hzMonitor.width);
                    } else {
                        ctx.textBaseline = "bottom";
                        ctx.textAlign = "right";
                    }
                    ctx.textBaseline = "bottom";
                } else if (scaleOrientation === 'horizontal') {
                    x = this.cssDimensions.width * ratios.hzMonitor.height;            
                    y = this.cssDimensions.height * ratios.hzMonitor.width;
                    if (ratios.key.position > 0.5) {
                        ctx.textBaseline = "top";
                        ctx.textAlign = "right";
                        y = this.cssDimensions.height * (1 - ratios.hzMonitor.width);
                    } else {
                        ctx.textBaseline = "bottom";
                        ctx.textAlign = "right";
                    }
                }
                ctx.fillStyle = 'black';
                ctx.fillText(text, x, y);
                
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                // ctx.miterLimit = 3;
                ctx.strokeText(text, x, y);
                ctx.restore();
            }
        }

        refillFreqArrays() {
            this.freqArrays.ft = new Array();
            this.freqArrays.ht = new Array();
            let freqRange = this.padSet.settings.freqRange[this.type];
            if (this.padSet.settings.scaleDisplay.ft.includes(this.type)) {
                // Takes only the frequencies inside the pad Hz range
                for (const [ftNum, xtone] of Object.entries(this.padSet.dhc.tables.ft)) {
                    if (xtone.hz >= freqRange.min && xtone.hz <= freqRange.max) {
                        this.freqArrays.ft.push(Object.freeze([Number(ftNum), xtone]));                
                    }
                }
                // Sort ascending by Frequancy
                this.freqArrays.ft.sort((a, b) => a[1].hz-b[1].hz);
            }
            if (this.padSet.settings.scaleDisplay.ht.includes(this.type)) {
                // Takes only the frequencies inside the pad Hz range
                for (const [htNum, xtone] of Object.entries(this.padSet.dhc.tables.ht)) {
                    if (xtone.hz >= freqRange.min && xtone.hz <= freqRange.max) {
                        if (htNum !== '-1') {
                            this.freqArrays.ht.push(Object.freeze([Number(htNum), xtone]));
                        }               
                    }
                }
                // Sort ascending by Frequancy
                this.freqArrays.ht.sort((a, b) => a[1].hz-b[1].hz);
            }
            Object.freeze(this.freqArrays.ft);
            Object.freeze(this.freqArrays.ht);
        }

        freqToPadPix(frequency) {
            let freqRange = this.padSet.settings.freqRange[this.type],
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type];
            if (scaleOrientation === 'vertical') {
                // Reverse the y coordinate (we need from bottom to top)
                return (this.cssDimensions.height - this.padSet.dpPadComponent.freqToPix(frequency, freqRange, this.cssDimensions.height));
            } else if (scaleOrientation === 'horizontal') {
                // x coordinate is ok (from left to right)
                return this.padSet.dpPadComponent.freqToPix(frequency, freqRange, this.cssDimensions.width);
            } else {
                alert('A "scaleOrientation" parameter is invalid: ' + scaleOrientation);
            }
        }
        PadPixToFreq(pointer) {
            let freqRange = this.padSet.settings.freqRange[this.type],
                scaleOrientation = this.padSet.settings.scaleOrientation[this.type];
            if (scaleOrientation === 'vertical') {
                // Reverse the y coordinate (we need from bottom to top)
                let pxPosition = this.cssDimensions.height - pointer.y;
                return (this.padSet.dpPadComponent.pixToFreq(pxPosition, freqRange, this.cssDimensions.height));
            } else if (scaleOrientation === 'horizontal') {
                // x coordinate is ok (from left to right)
                return this.padSet.dpPadComponent.pixToFreq(pointer.x, freqRange, this.cssDimensions.width);
            } else {
                alert('A "scaleOrientation" parameter is invalid: ' + scaleOrientation);
            }
        }

        // Draws a dot at a specific position on the supplied canvas name
        // Parameters are: A canvas context, the x position, the y position, the size of the dot
        drawDot(pointer, size) {
            let ctx = this.ctx;
            // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
            let r=0, g=0, b=0, a=255;
            // Select a fill style
            ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
            // Draw a filled circle
            ctx.beginPath();
            ctx.arc(pointer.x, pointer.y, size, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fill();
        }
        // Draws a line between the specified position on the supplied canvas name
        // Parameters are: A canvas context, the x position, the y position, the size of the dot
        drawLine(pointer, size) {
            // If pointer.last.x is not set, set pointer.last.x and pointer.last.y to the current position 
            if (pointer.last.x === false) {
                pointer.last.x = pointer.x;
                pointer.last.y = pointer.y;
            }
            // =============================================
            let ctx = this.ctx;
            // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
            let r=0, g=0, b=0, a=255;
            // Select a fill style
            ctx.strokeStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
            // Set the line "cap" style to round, so lines at different angles can join into each other
            ctx.lineCap = "round";
            //ctx.lineJoin = "round";
            // Draw a filled line
            ctx.beginPath();
            // First, move to the old (previous) position
            ctx.moveTo(pointer.last.x, pointer.last.y);
            // Now draw a line to the current touch/pointer position
            ctx.lineTo(pointer.x, pointer.y);
            // Set the line thickness and draw the line
            ctx.lineWidth = size;
            ctx.stroke();
            ctx.closePath();
            // =============================================
            // Update the last position to reference the current position
            pointer.last.x = pointer.x;
            pointer.last.y = pointer.y;
        }
    };

    return DpPad;

}();
