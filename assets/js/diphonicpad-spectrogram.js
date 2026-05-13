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
    }

    /**
     * Requests microphone access and starts the spectrogram render loop.
     *
     * @returns {Promise<void>}
     *
     * @description
     * Calls `navigator.mediaDevices.getUserMedia({ audio: true })`. On success,
     * creates a fresh `AudioContext` and `AnalyserNode` (fftSize 4096,
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
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = 0.8;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

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

        // New data must be written into the key-free area.
        // When keys are at the far end (position >= 0.5), the free area is at the
        // near end — so we scroll *toward* the far end and write at edge 0.
        // When keys are at the near end (position < 0.5), we scroll toward 0 and
        // write at the far edge (original behaviour, e.g. FT default).
        const keysAtFarEnd = keyRatios.position >= 0.5;

        if (scaleOrient === 'vertical') {
            // Cross-axis = X.
            // keys left  (position 0) → free area right  → scroll left,  write at x = w-1
            // keys right (position 1) → free area left   → scroll right, write at x = 0
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

            if (keysAtFarEnd) {
                ctx.drawImage(canvas, 1, 0);
                ctx.putImageData(imgData, 0, 0);
            } else {
                ctx.drawImage(canvas, -1, 0);
                ctx.putImageData(imgData, w - 1, 0);
            }

            // Erase key band (cross-axis = X) so spectrogram stays in the free area.
            // Formula: xBegin = width * (1 - length) * position
            const keyBandX = w * (1 - keyRatios.length) * keyRatios.position;
            const keyBandW = w * keyRatios.length;
            ctx.clearRect(keyBandX, 0, keyBandW, h);

        } else {
            // Horizontal orientation.  Cross-axis = Y.
            // keys top    (position 0) → free area bottom → scroll up,   write at y = h-1
            // keys bottom (position 1) → free area top    → scroll down, write at y = 0
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

            if (keysAtFarEnd) {
                ctx.drawImage(canvas, 0, 1);
                ctx.putImageData(imgData, 0, 0);
            } else {
                ctx.drawImage(canvas, 0, -1);
                ctx.putImageData(imgData, 0, h - 1);
            }

            // Erase key band (cross-axis = Y) so spectrogram stays in the free area.
            // Formula: yBegin = height * (1 - length) * position
            const keyBandY = h * (1 - keyRatios.length) * keyRatios.position;
            const keyBandH = h * keyRatios.length;
            ctx.clearRect(0, keyBandY, w, keyBandH);
        }
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
        const alpha = Math.round(amp * 0.85);
        if (type === 'ft') {
            return [
                255,
                Math.round(255 - amp * 0.72),
                Math.round(255 - amp * 0.45),
                alpha
            ];
        } else {
            return [
                Math.round(255 - amp * 0.72),
                Math.round(255 - amp * 0.45),
                255,
                alpha
            ];
        }
    }
};
