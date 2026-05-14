/**
 * @fileoverview Spectrogram class for the Harmonicarium Diphonic Pad.
 * This file defines the {@link HUM.DpPad.PadSet.Spectrogram|Spectrogram} class,
 * which renders a live scrolling-waterfall microphone spectrogram behind each
 * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} canvas. The frequency axis
 * matches the visible log-scale range of each pad. Pink tones are used for the FT
 * pad and blue tones for the HT pad. The spectrogram is opt-in and activated via a
 * toggle in the DiphonicPad settings panel.
 *
 * @module diphonicpad-spectrogram
 * @memberof HUM.DpPad.PadSet
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
 * Scrolling-waterfall microphone spectrogram background for a PadSet.
 *
 * @class
 * @memberof HUM.DpPad.PadSet
 * @static
 *
 * @description
 * `HUM.DpPad.PadSet.Spectrogram` renders a live microphone spectrogram onto
 * a pair of off-screen `<canvas>` elements stacked behind the FT and HT
 * {@link HUM.DpPad.PadSet.FrequencyPad|FrequencyPad} canvases. Each frame:
 *
 * - FFT frequency data is read from a Web Audio `AnalyserNode` connected to
 *   the microphone (`MediaStreamSourceNode`). The analyser is **never** connected
 *   to `AudioContext.destination`, so there is no audio feedback risk.
 * - The existing spectrogram image is shifted one pixel along the time axis.
 * - A new column (vertical scale orientation) or row (horizontal scale orientation)
 *   is computed: each pixel is mapped back to a frequency using the same log-scale
 *   formula as the pad (`DpPad.pixToFreq()`), then to the nearest FFT bin.
 * - FT pad uses pink/magenta tones; HT pad uses blue/cyan tones. Both are
 *   alpha-blended so silence is transparent, revealing the pad background.
 *
 * The render loop runs at ≈30 fps via `requestAnimationFrame`, and is only active
 * while the spectrogram is enabled.
 *
 * @example
 * // Instantiated by HUM.DpPad.PadSet constructor
 * const spectrogram = new HUM.DpPad.PadSet.Spectrogram(padSet, ftCanvas, htCanvas);
 */
HUM.DpPad.PadSet.Spectrogram = class {
    /**
     * Creates a Spectrogram instance.
     *
     * @param {HUM.DpPad.PadSet} padSet     - The parent PadSet instance.
     * @param {HTMLCanvasElement} ftCanvas  - The spectrogram canvas for the FT pad.
     * @param {HTMLCanvasElement} htCanvas  - The spectrogram canvas for the HT pad.
     */
    constructor(padSet, ftCanvas, htCanvas) {
        this.padSet = padSet;
        this.canvases = { ft: ftCanvas, ht: htCanvas };

        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.micStream = null;
        this.micSource = null;

        this.enabled = false;
        this.rafId = null;
        this._lastTimestamp = 0;
        this.detectedPitch = null;
        this.timeDomainArray = null;
    }

    /**
     * Requests microphone access and starts the spectrogram render loop.
     *
     * @returns {Promise<void>}
     *
     * @description
     * Calls `navigator.mediaDevices.getUserMedia({ audio: true })`. On success,
     * creates a fresh `AudioContext` and `AnalyserNode` (fftSize 32768,
     * smoothingTimeConstant 0.8), connects the `MediaStreamSourceNode` to the
     * analyser only — **not** to `destination` — and starts the rAF loop.
     * On failure, logs the error and reverts the `spectrogramEnabled` parameter
     * to `false`.
     */
    async enable() {
        if (this.enabled) {
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            this.audioCtx = new AudioContext();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = this.padSet.parameters.spectrogramFftSize.value;
            this.analyser.smoothingTimeConstant = 0.8;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDomainArray = new Float32Array(2048);

            this.micSource = this.audioCtx.createMediaStreamSource(stream);
            // Connect to analyser only — NOT to destination (prevents feedback)
            this.micSource.connect(this.analyser);

            this.micStream = stream;
            this.enabled = true;
            this._startLoop();

        } catch (err) {
            console.error('[Spectrogram] Microphone access failed:', err);
            // Revert parameter without triggering postSet again
            this.padSet.parameters.spectrogramEnabled._setValue(false, { postSet: false });
        }
    }

    /**
     * Stops the render loop, releases the microphone, and clears both canvases.
     *
     * @returns {void}
     */
    disable() {
        this._stopLoop();

        if (this.micSource) {
            this.micSource.disconnect();
            this.micSource = null;
        }
        if (this.micStream) {
            for (const track of this.micStream.getTracks()) {
                track.stop();
            }
            this.micStream = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }

        this.analyser = null;
        this.dataArray = null;
        this.timeDomainArray = null;
        this.detectedPitch = null;
        this._clearCanvases();
        this.enabled = false;
    }

    /**
     * Resizes both spectrogram canvases to match the current pad pixel dimensions.
     *
     * @param {number} ftW - FT canvas width in CSS pixels.
     * @param {number} ftH - FT canvas height in CSS pixels.
     * @param {number} htW - HT canvas width in CSS pixels.
     * @param {number} htH - HT canvas height in CSS pixels.
     *
     * @returns {void}
     *
     * @description
     * Called by `DpPad.windowResize()` after the main pad canvas dimensions are
     * updated. Resizing a canvas clears its contents, which is the desired behaviour
     * since the spectrogram history is no longer valid after a layout change.
     */
    resize(ftW, ftH, htW, htH) {
        this.canvases.ft.width  = ftW;
        this.canvases.ft.height = ftH;
        this.canvases.ht.width  = htW;
        this.canvases.ht.height = htH;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Clears both spectrogram canvases to fully transparent.
     * @private
     */
    _clearCanvases() {
        for (const canvas of Object.values(this.canvases)) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * Starts the `requestAnimationFrame` render loop.
     * @private
     */
    _startLoop() {
        this._lastTimestamp = 0;
        this.rafId = requestAnimationFrame(this._loop.bind(this));
    }

    /**
     * Cancels the active `requestAnimationFrame` loop.
     * @private
     */
    _stopLoop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /**
     * The rAF callback. Throttles drawing to ≈30 fps.
     *
     * @param {DOMHighResTimeStamp} timestamp - The rAF timestamp.
     * @private
     */
    _loop(timestamp) {
        if (!this.enabled) {
            return;
        }
        if (timestamp - this._lastTimestamp >= 33) {
            this._lastTimestamp = timestamp;
            this._drawFrame();
        }
        this.rafId = requestAnimationFrame(this._loop.bind(this));
    }

    /**
     * Reads the current FFT data and renders one frame on both pad canvases.
     * @private
     */
    _drawFrame() {
        this.analyser.getByteFrequencyData(this.dataArray);
        this._detectPitch();
        this._renderPad(this.canvases.ft, 'ft');
        this._renderPad(this.canvases.ht, 'ht');
    }

    /**
     * Scrolls the spectrogram image by one pixel and paints a new edge
     * column (vertical orientation) or row (horizontal orientation).
     *
     * @param {HTMLCanvasElement} canvas - The spectrogram canvas to render.
     * @param {tonetype}          type   - `'ft'` or `'ht'`.
     * @private
     *
     * @description
     * The frequency-to-pixel mapping mirrors `FrequencyPad.freqToPadPix()`:
     * - **vertical**: Y=0 is the top (high frequencies), Y=height is the bottom
     *   (low frequencies). The canvas is shifted left (time scrolls right-to-left)
     *   and a new column is written at `canvas.width − 1`.
     *   Each pixel row `y` maps to `freq = pixToFreq(height − y, range, height)`.
     * - **horizontal**: X=0 is the left (low frequencies), X=width is the right
     *   (high frequencies). The canvas is shifted up (time scrolls bottom-to-top)
     *   and a new row is written at `canvas.height − 1`.
     *   Each pixel column `x` maps to `freq = pixToFreq(x, range, width)`.
     *
     * After writing the new edge data, the key band is erased with `clearRect`
     * using the same geometry as `drawLinKey`/`drawFreqKeyHT` (`canvasObjectsRatios[type].key`),
     * so the spectrogram is only ever visible in the key-free area of the pad —
     * regardless of key position, pad orientation, or scale orientation.
     */
    _renderPad(canvas, type) {
        const w = canvas.width,
              h = canvas.height;
        if (w <= 0 || h <= 0) {
            return;
        }

        const ctx            = canvas.getContext('2d');
        const scaleOrient    = this.padSet.parameters.scaleOrientation[type].value;
        const freqRange      = this.padSet.parameters.freqRange[type];
        const dpPad          = this.padSet.dpPadComponent;
        const sampleRate     = this.audioCtx.sampleRate;
        const binWidth       = sampleRate / this.analyser.fftSize;
        const dataArray      = this.dataArray;
        const dataLen        = dataArray.length;

        // Key band geometry — mirrors the formula in drawLinKey() / drawFreqKeyHT().
        // customProperties are spread onto the Param via Object.assign, so
        // canvasObjectsRatios[type].key is directly accessible.
        const keyRatios = this.padSet.parameters.canvasObjectsRatios[type].key;

        // New data must always land in the key-free area.
        // keysAtFarEnd: true  → keys are at the high-coordinate side (e.g. HT, position 1).
        //               false → keys are at the low-coordinate side (e.g. FT, position 0).
        // For each case the free area has two edges: edgeA (low-coordinate end)
        // and edgeB (high-coordinate end).  Normally we write at the "natural" edge
        // so the waterfall scrolls away from the keys.  The `spectrogramInverted` flag
        // writes at the opposite edge instead, reversing the scroll direction while
        // keeping the new pixel inside the visible free area.
        const keysAtFarEnd = keyRatios.position >= 0.5;
        const inverted     = this.padSet.parameters.spectrogramInverted.value;

        if (scaleOrient === 'vertical') {
            // Cross-axis = X.
            const keyBandX = w * (1 - keyRatios.length) * keyRatios.position;
            const keyBandW = w * keyRatios.length;
            // edgeA = lowest free-area pixel, edgeB = highest free-area pixel
            const edgeA    = keysAtFarEnd ? 0                           : Math.ceil(keyBandX + keyBandW);
            const edgeB    = keysAtFarEnd ? Math.floor(keyBandX) - 1   : w - 1;
            // Normally write at edgeA when keys are at far end (scroll →),
            // and at edgeB when keys are at near end (scroll ←). Invert flips this.
            const useEdgeA = keysAtFarEnd !== inverted;
            const writeX   = useEdgeA ? edgeA : edgeB;
            const dx       = useEdgeA ? 1 : -1;

            const imgData = ctx.createImageData(1, h);
            const pixels  = imgData.data;
            for (let y = 0; y < h; y++) {
                // Mirror freqToPadPix inverse: pxPosition = height - y
                const freq     = dpPad.pixToFreq(h - y, freqRange, h);
                const binIndex = Math.round(freq / binWidth);
                const amp      = (binIndex >= 0 && binIndex < dataLen) ? dataArray[binIndex] : 0;
                const rgba     = this._amplitudeToRGBA(amp, type);
                const i        = y * 4;
                pixels[i]     = rgba[0];
                pixels[i + 1] = rgba[1];
                pixels[i + 2] = rgba[2];
                pixels[i + 3] = rgba[3];
            }
            ctx.drawImage(canvas, dx, 0);
            ctx.putImageData(imgData, writeX, 0);
            ctx.clearRect(keyBandX, 0, keyBandW, h);
            this._drawPitchOverlay(canvas, type);

        } else {
            // Horizontal orientation.  Cross-axis = Y.
            const keyBandY = h * (1 - keyRatios.length) * keyRatios.position;
            const keyBandH = h * keyRatios.length;
            const edgeA    = keysAtFarEnd ? 0                           : Math.ceil(keyBandY + keyBandH);
            const edgeB    = keysAtFarEnd ? Math.floor(keyBandY) - 1   : h - 1;
            const useEdgeA = keysAtFarEnd !== inverted;
            const writeY   = useEdgeA ? edgeA : edgeB;
            const dy       = useEdgeA ? 1 : -1;

            const imgData = ctx.createImageData(w, 1);
            const pixels  = imgData.data;
            for (let x = 0; x < w; x++) {
                // Mirror freqToPadPix: pxPosition = x
                const freq     = dpPad.pixToFreq(x, freqRange, w);
                const binIndex = Math.round(freq / binWidth);
                const amp      = (binIndex >= 0 && binIndex < dataLen) ? dataArray[binIndex] : 0;
                const rgba     = this._amplitudeToRGBA(amp, type);
                const i        = x * 4;
                pixels[i]     = rgba[0];
                pixels[i + 1] = rgba[1];
                pixels[i + 2] = rgba[2];
                pixels[i + 3] = rgba[3];
            }
            ctx.drawImage(canvas, 0, dy);
            ctx.putImageData(imgData, 0, writeY);
            ctx.clearRect(0, keyBandY, w, keyBandH);
            this._drawPitchOverlay(canvas, type);
        }
    }

    /**
     * Estimates the fundamental frequency of the microphone input using
     * time-domain autocorrelation (ACF).
     *
     * @returns {void}
     *
     * @description
     * Fills `timeDomainArray` with the latest 2048 samples via
     * `getFloatTimeDomainData()`. Skips detection when RMS < 0.015 (silence).
     * Searches for the autocorrelation peak in the lag range corresponding
     * to 50–1500 Hz, requiring a normalised correlation ≥ 0.5. Applies
     * parabolic interpolation around the peak for sub-sample accuracy.
     * The result is stored in `this.detectedPitch` (Hz) or `null` when
     * no confident pitch is found.
     * @private
     */
    _detectPitch() {
        const buf = this.timeDomainArray;
        this.analyser.getFloatTimeDomainData(buf);
        const n  = buf.length;
        const sr = this.audioCtx.sampleRate;

        // RMS check — skip silence or near-silence
        let rms = 0;
        for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / n);
        if (rms < 0.015) { this.detectedPitch = null; return; }

        // Lag search range: 80 Hz – 1000 Hz
        const minLag = Math.floor(sr / 1000);
        const maxLag = Math.min(Math.ceil(sr / 80), n - 1);
        // Fixed inner-loop length (only the overlap valid for every lag in range)
        const len = n - maxLag;

        // Zero-lag energy (denominator for normalised correlation)
        let r0 = 0;
        for (let i = 0; i < len; i++) r0 += buf[i] * buf[i];
        if (r0 === 0) { this.detectedPitch = null; return; }

        // Find the lag with the highest normalised autocorrelation
        let bestLag = -1, bestCorr = -Infinity;
        for (let lag = minLag; lag <= maxLag; lag++) {
            let corr = 0;
            for (let i = 0; i < len; i++) corr += buf[i] * buf[i + lag];
            if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
        }

        if (bestLag < 0 || bestCorr / r0 < 0.5) { this.detectedPitch = null; return; }

        // Parabolic interpolation around the peak for sub-sample accuracy
        if (bestLag > minLag && bestLag < maxLag) {
            let prev = 0, next = 0;
            for (let i = 0; i < len; i++) prev += buf[i] * buf[i + bestLag - 1];
            for (let i = 0; i < len; i++) next += buf[i] * buf[i + bestLag + 1];
            const denom = 2 * bestCorr - prev - next;
            if (denom > 0) bestLag += (prev - next) / (2 * denom);
        }

        this.detectedPitch = sr / bestLag;
    }

    /**
     * Returns the exact anchor coordinates used by `FrequencyPad.drawFreqMonitor()`
     * for the FT pad, plus the hz-monitor font size.
     *
     * @param {HTMLCanvasElement} canvas - The spectrogram canvas (same pixel dimensions
     *   as the FrequencyPad canvas's `cssDimensions`).
     * @returns {{ x:number, y:number, textAlign:string, textBaseline:string, fontSize:number }}
     * @private
     */
    _getMonitorAnchor(canvas) {
        const w           = canvas.width;
        const h           = canvas.height;
        const scaleOrient = this.padSet.parameters.scaleOrientation.ft.value;
        const ratios      = this.padSet.parameters.canvasObjectsRatios.ft;
        const fontSize    = this.padSet.parameters.fonts.ft.hzMonitor.value.size;

        let x, y, textAlign, textBaseline;

        if (scaleOrient === 'vertical') {
            x             = w * ratios.hzMonitor.width;
            y             = h * ratios.hzMonitor.height;
            textBaseline  = 'bottom';
            if (ratios.key.position > 0.5) {
                x         = w * (1 - ratios.hzMonitor.width);
                textAlign = 'left';
            } else {
                textAlign = 'right';
            }
        } else {
            // horizontal
            x             = w * ratios.hzMonitor.height;
            y             = h * ratios.hzMonitor.width;
            textAlign     = 'right';
            textBaseline  = 'bottom';
            if (ratios.key.position > 0.5) {
                y             = h * (1 - ratios.hzMonitor.width);
                textBaseline  = 'top';
            }
        }

        return { x, y, textAlign, textBaseline, fontSize };
    }

    /**
     * Draws the detected fundamental pitch as a fixed-position text overlay
     * on the FT spectrogram canvas, just above the hz-monitor corner.
     *
     * @param {HTMLCanvasElement} canvas - The spectrogram canvas to annotate.
     * @param {tonetype}          type   - Only acts when `'ft'`.
     * @private
     *
     * @description
     * Calls `_getMonitorAnchor()` to obtain the exact (x, y, textAlign,
     * textBaseline, fontSize) used by `FrequencyPad.drawFreqMonitor()`, then
     * positions the pitch label adjacent to the monitor's bounding-box edge
     * (never inside it):
     * - When the monitor baseline is `'bottom'`: the monitor body spans
     *   `[y − fontSize, y]`; pitch text is drawn with `textBaseline='bottom'`
     *   at `pitchY = y − fontSize − gap`.
     * - When the monitor baseline is `'top'` (horizontal, key at top): the
     *   monitor body spans `[y, y + fontSize]`; pitch text is drawn with
     *   `textBaseline='bottom'` at `pitchY = y − gap` (baseline just above the
     *   monitor's top anchor, scrolling upward away from it).
     * The text area is cleared each frame so the label stays pinned despite
     * the waterfall scrolling beneath it.
     */
    _drawPitchOverlay(canvas, type) {
        if (type !== 'ft') return;

        const ctx           = canvas.getContext('2d');
        const pitchFontSize = 13;
        const gap           = 4;

        const { x, y, textAlign, textBaseline, fontSize } = this._getMonitorAnchor(canvas);

        // Place pitch label just above the hz-monitor bounding box.
        const pitchY = textBaseline === 'top'
            ? y - gap               // monitor grows downward; place above its top edge
            : y - fontSize - gap;   // monitor grows upward; place above its top edge

        // Set font now so measureText uses the correct metrics for clearRect sizing.
        ctx.save();
        ctx.font = pitchFontSize + 'px monospace';

        // Read accuracy settings to derive fixed field widths.
        const centAcc   = this.padSet.dhc.settings.global.cent_accuracy.value;
        const hzAcc     = this.padSet.dhc.settings.global.hz_accuracy.value;
        // Widths per field (character counts):
        //  note  : 3 chars (max "C#4") + 1 space = 4
        //  sign  : 1 ('+' or '-', always present)
        //  cents : 2 + optional ".N..." for centAcc decimal places
        //  unit  : 1 ('c', ASCII substitute for ¢)
        //  sep   : 2 spaces
        //  hz    : 4 integer digits + 1 dot + hzAcc decimal digits ("1500.00" = 7 with hzAcc=2)
        //  hz unit: 3 (' Hz')
        const centWidth  = 2 + (centAcc > 0 ? 1 + centAcc : 0);
        const hzWidth    = 4 + 1 + hzAcc;
        const totalChars = 4 + 1 + centWidth + 1 + 2 + hzWidth + 3;

        // Measure using 'X' — a standard single-width monospace reference character.
        // This avoids metric variation from special glyphs ('+', 'c', '.', etc.).
        const totalW = ctx.measureText('X'.repeat(totalChars)).width + 4;
        const clearX = textAlign === 'left' ? x : x - totalW;
        ctx.clearRect(clearX, pitchY - pitchFontSize - 2, totalW, pitchFontSize + 4);

        if (!this.detectedPitch) {
            ctx.restore();
            return;
        }

        const mc   = this.padSet.dhc.constructor.freqToMc(this.detectedPitch);
        const note = this.padSet.dhc.mcToName(mc);

        // Replace U+2212 (unicode minus) with ASCII '-' to guarantee monospace width.
        const sign      = (note[1] === '' ? '+' : note[1]).replace('\u2212', '-');
        const notePart  = note[0].padEnd(3) + ' ';
        const centPart  = sign + String(note[2]).padStart(centWidth, '0') + 'c  ';
        const hzPart    = this.detectedPitch.toFixed(hzAcc).padStart(hzWidth) + ' Hz';
        const noteTxt   = notePart + centPart + hzPart;

        ctx.textBaseline = 'bottom';
        ctx.textAlign    = textAlign;
        ctx.strokeStyle  = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth    = 2.5;
        ctx.strokeText(noteTxt, x, pitchY);
        ctx.fillStyle    = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(noteTxt, x, pitchY);
        ctx.restore();
    }

    /**
     * Converts a normalised FFT amplitude (0–255) to an RGBA colour tuple.
     *
     * @param {number}   amp  - The FFT bin amplitude in the range [0, 255].
     * @param {tonetype} type - `'ft'` (pink/magenta) or `'ht'` (blue/cyan).
     *
     * @returns {[number, number, number, number]} RGBA tuple, each component 0–255.
     *
     * @description
     * At `amp = 0` the alpha channel is 0 (fully transparent), so the pad
     * background gradient shows through at silence. At full amplitude the
     * colour is a saturated pink (FT) or blue (HT) tint.
     *
     * - **FT** (pink/magenta): R=255, G and B decrease with amplitude.
     * - **HT** (blue/cyan):    B=255, R and G decrease with amplitude.
     * @private
     */
    _amplitudeToRGBA(amp, type) {
        // Apply contrast (scale around midpoint 128) then brightness (additive offset).
        const brightness = this.padSet.parameters.spectrogramBrightness.value;
        const contrast   = this.padSet.parameters.spectrogramContrast.value;
        let a = (amp - 128) * contrast + 128 + brightness;
        if (a < 0)   { a = 0; }
        if (a > 255) { a = 255; }
        const alpha = Math.round(a * 0.85);
        if (type === 'ft') {
            return [
                255,
                Math.round(255 - a * 0.72),
                Math.round(255 - a * 0.45),
                alpha
            ];
        } else {
            return [
                Math.round(255 - a * 0.72),
                Math.round(255 - a * 0.45),
                255,
                alpha
            ];
        }
    }
};
