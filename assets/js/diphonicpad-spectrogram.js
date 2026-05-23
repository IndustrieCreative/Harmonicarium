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

        // Overlay canvases for trace lines — one per pad, inserted between the
        // spectrogram canvas and the FrequencyPad canvas in DOM order so they
        // appear in front of the waterfall but behind the keys/monitor text.
        // Cleared entirely each frame so lines vanish instantly when detection stops.
        const ftOverlay = document.createElement('canvas');
        ftOverlay.width = 0;
        ftOverlay.height = 0;
        ftOverlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
        ftCanvas.insertAdjacentElement('afterend', ftOverlay);
        const htOverlay = document.createElement('canvas');
        htOverlay.width = 0;
        htOverlay.height = 0;
        htOverlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
        htCanvas.insertAdjacentElement('afterend', htOverlay);
        this.overlayCanvases = { ft: ftOverlay, ht: htOverlay };

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

        // Timestamp (performance.now()) of the last animation frame in which at least
        // one user note (FT or HT) was playing.  Used to enforce a quiet-period
        // before spectrogram pitch tracking is allowed to recompute the HT scale.
        // Initialized to 0 so tracking is enabled immediately on first start.
        this._lastNoteActiveTime = 0;

        // The last Hz value successfully passed to trackFTcontinuum.
        // Persists after silence so the FT trace overlay stays visible at the last
        // computed position. Cleared only when the spectrogram is disabled.
        this._lastTrackedHz = null;

        // Pitch stabilization state (reset on disable; persists across silence gaps)
        this._pitchBuffer     = [];    // sliding window for median filter
        this._lastStablePitch = null;  // hysteresis: last accepted pitch
        this._pendingPitch    = null;  // hysteresis: candidate pitch
        this._pendingCount    = 0;     // hysteresis: consecutive frame count for candidate
        this._emaPitch        = null;  // exponential moving average state

        // Formant detection state (reset on disable)
        this.detectedF1  = null;       // F1 frequency in Hz (or null on silence)
        this.detectedF2  = null;       // F2 frequency in Hz (or null on silence)
        this._f1Buffer   = [];         // sliding median window for F1
        this._f2Buffer   = [];         // sliding median window for F2

        // Display/inertia state — EMA-smoothed frequencies used for all visual
        // output (green trace lines and HT key highlight).  Detection runs at a
        // lower rate (every DETECTION_STRIDE frames); display updates every frame.
        this._detectionFrameCount = 0;    // frame counter for detection-rate throttle
        this._displayPitchHz      = null; // inertia-smoothed FT pitch
        this._displayFormantHz    = null; // inertia-smoothed HT formant
        this._fftAccumulator      = null; // Float32Array sum of FFT frames in the current stride window

        // Re-apply pad backgrounds when the UI theme switches, so the silence
        // colour stays in sync with the (now inverted) palette.
        const tm = this.padSet && this.padSet.dpPadComponent
                   && this.padSet.dpPadComponent.harmonicarium
                   && this.padSet.dpPadComponent.harmonicarium.themeManager;
        if (tm) {
            tm.subscribe(() => {
                if (this.enabled) { this._updatePadBackgrounds(true); }
            });
        }
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
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,   // allow speaker output to be picked up
                    noiseSuppression: false,   // preserve full spectral content
                    autoGainControl:  false,   // keep raw amplitude for RMS gating
                },
                video: false
            });

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
            this._updatePadBackgrounds(true);
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
        this._lastNoteActiveTime = 0;
        this._lastTrackedHz = null;

        // Reset pitch stabilization state
        this._pitchBuffer     = [];
        this._lastStablePitch = null;
        this._pendingPitch    = null;
        this._pendingCount    = 0;
        this._emaPitch        = null;

        // Reset formant detection state
        this.detectedF1 = null;
        this.detectedF2 = null;
        this._f1Buffer  = [];
        this._f2Buffer  = [];

        // Reset display/inertia state
        this._detectionFrameCount = 0;
        this._displayPitchHz      = null;
        this._displayFormantHz    = null;
        this._fftAccumulator      = null;

        // Clear the HT formant key highlight.
        for (let targetPad of this.padSet.parameters.scaleDisplay.ht.value) {
            this.padSet[targetPad].spectrogramHzFormant = null;
            this.padSet[targetPad].drawFreqUI();
        }
        this._clearCanvases();
        this._updatePadBackgrounds(false);
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
        this.overlayCanvases.ft.width  = ftW;
        this.overlayCanvases.ft.height = ftH;
        this.overlayCanvases.ht.width  = htW;
        this.overlayCanvases.ht.height = htH;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Sets or restores the CSS background of the FT and HT pad divs.
     *
     * While the spectrogram is active the CSS gradient is replaced with a solid
     * colour matching the spectrogram's silence colour — i.e. the opaque RGB
     * that `_amplitudeToRGBA(0, type)` produces with the current brightness and
     * contrast settings.  This makes the waterfall emerge seamlessly from the
     * background: silence pixels (alpha = 0) are visually identical to the
     * pad background, so there is no border between "no signal" and "low signal".
     *
     * When the spectrogram is disabled the inline style is cleared so the CSS
     * class gradient takes effect again.
     *
     * @param {boolean} active - `true` to apply the silence colour; `false` to
     *   restore the CSS gradient.
     * @private
     */
    _updatePadBackgrounds(active) {
        const ftDiv = this.padSet.uiElements.fn.ftDiv;
        const htDiv = this.padSet.uiElements.fn.htDiv;
        if (!active) {
            ftDiv.style.background = '';
            htDiv.style.background = '';
            return;
        }
        // Use only the RGB components (ignore alpha) so the background is fully
        // opaque and matches the colour the spectrogram would show at silence.
        const [fR, fG, fB] = this._amplitudeToRGBA(0, 'ft');
        const [hR, hG, hB] = this._amplitudeToRGBA(0, 'ht');
        ftDiv.style.background = `rgb(${fR}, ${fG}, ${fB})`;
        htDiv.style.background = `rgb(${hR}, ${hG}, ${hB})`;
    }

    /**
     * Clears both spectrogram canvases to fully transparent.
     * @private
     */
    _clearCanvases() {
        for (const canvas of Object.values(this.canvases)) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        for (const canvas of Object.values(this.overlayCanvases)) {
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
        // ── Tunable constants ──────────────────────────────────────────────────
        // Run pitch + formant detection once every DETECTION_STRIDE rendered
        // frames (≈30 fps × stride) to reduce CPU load.  The EMA display values
        // update every frame regardless, giving smooth on-screen movement.
        const DETECTION_STRIDE = 1;     // run detection every 3 frames ≈ 100 ms
        // EMA coefficient for display smoothing.  Range (0, 1]:
        // 1 = instant (no inertia), 0.15 ≈ 200 ms time-constant at 30 fps.
        const INERTIA_ALPHA    = 0.75;
        // ──────────────────────────────────────────────────────────────────────

        this.analyser.getByteFrequencyData(this.dataArray);

        // Accumulate FFT magnitudes every frame so that when detection fires it
        // operates on the mean of all DETECTION_STRIDE frames in the window,
        // rather than a single-frame snapshot.  Averaging reduces bin-level noise
        // and produces more stable peak positions for the formant detector.
        // The raw this.dataArray is still used by the waterfall and spectrum line
        // (both stay live at full frame rate).
        if (this._fftAccumulator === null) {
            this._fftAccumulator = new Float32Array(this.dataArray.length);
        }
        for (let i = 0; i < this.dataArray.length; i++) {
            this._fftAccumulator[i] += this.dataArray[i];
        }

        // Run detection only every DETECTION_STRIDE frames.
        if (this._detectionFrameCount % DETECTION_STRIDE === 0) {
            this._detectPitch();

            // Average the accumulated FFT window and pass it to the formant
            // detector, then reset the accumulator for the next window.
            const avgData = new Float32Array(this._fftAccumulator.length);
            for (let i = 0; i < avgData.length; i++) {
                avgData[i] = this._fftAccumulator[i] / DETECTION_STRIDE;
            }
            this._fftAccumulator.fill(0);
            this._detectFormants(avgData);
        }
        this._detectionFrameCount++;

        // ── Notes-active guard (for FT continuum tracking) ────────────────────
        // Suppressed while any user note (FT or HT, from pad/MIDI) is active,
        // and for 1000 ms after the last note stops.
        const _ftNotesActive = this.padSet.dhc.playQueue.ft.length > 0;
        const _notesActive   = _ftNotesActive || this.padSet.dhc.playQueue.ht.length > 0;
        if (_notesActive) {
            this._lastNoteActiveTime = performance.now();
        }
        if (_ftNotesActive) {
            // User is playing FTs — clear the last tracked Hz so the FT trace
            // hides immediately.  HT-only activity does not clear it.
            this._lastTrackedHz = null;
        }

        // ── EMA inertia: smooth raw detected values for visual display ─────────
        // Interpolation in midicent (log-frequency) space: equal cents per frame
        // → linear-looking glide on the log-scale pad.
        // Silence (null) snaps instantly; new detections also snap in immediately.
        const _hzEMA = (target, current) => {
            if (target === null)  return null;
            if (current === null) return target;   // snap on first detection
            const mc_t = 69 + 12 * Math.log2(target  / 440);
            const mc_c = 69 + 12 * Math.log2(current / 440);
            return 440 * Math.pow(2, (mc_c + INERTIA_ALPHA * (mc_t - mc_c) - 69) / 12);
        };
        this._displayPitchHz   = _hzEMA(this.detectedPitch, this._displayPitchHz);
        this._displayFormantHz = _hzEMA(this.detectedF1,    this._displayFormantHz);

        // ── FT continuum tracking ──────────────────────────────────────────────
        if (this._displayPitchHz !== null &&
                this.padSet.parameters.spectrogramPitchTrack.value &&
                !_notesActive &&
                performance.now() - this._lastNoteActiveTime >= 1000) {
            this._lastTrackedHz = this._displayPitchHz;
            this.padSet.dhc.trackFTcontinuum(this._displayPitchHz);
        }

        // ── HT formant key highlight ───────────────────────────────────────────
        for (let targetPad of this.padSet.parameters.scaleDisplay.ht.value) {
            this.padSet[targetPad].spectrogramHzFormant = this._displayFormantHz;
            this.padSet[targetPad].drawFreqUI();
        }

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
        const scaleMode      = this.padSet.parameters.scaleMode[type].value;
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
            const useEdgeA = keysAtFarEnd == inverted;
            const writeX   = useEdgeA ? edgeA : edgeB;
            const dx       = useEdgeA ? 1 : -1;

            const imgData = ctx.createImageData(1, h);
            const pixels  = imgData.data;
            for (let y = 0; y < h; y++) {
                // Mirror freqToPadPix inverse: pxPosition = height - y
                const freq     = dpPad.pixToFreq(h - y, freqRange, h, scaleMode);
                const binIndex = Math.round(freq / binWidth);
                const amp      = (binIndex >= 0 && binIndex < dataLen) ? dataArray[binIndex] : 0;
                const rgba     = this._amplitudeToRGBA(amp, type);
                const i        = y * 4;
                pixels[i]     = rgba[0];
                pixels[i + 1] = rgba[1];
                pixels[i + 2] = rgba[2];
                pixels[i + 3] = rgba[3];
            }
            ctx.save();
            ctx.globalCompositeOperation = 'copy';
            ctx.drawImage(canvas, dx, 0);
            ctx.restore();
            ctx.putImageData(imgData, writeX, 0);
            ctx.clearRect(keyBandX, 0, keyBandW, h);
            this._drawPitchOverlay(canvas, type);
            this._drawFormantOverlay(canvas, type);
            this._drawTraceOverlay(this.overlayCanvases[type], type);

        } else {
            // Horizontal orientation.  Cross-axis = Y.
            const keyBandY = h * (1 - keyRatios.length) * keyRatios.position;
            const keyBandH = h * keyRatios.length;
            const edgeA    = keysAtFarEnd ? 0                           : Math.ceil(keyBandY + keyBandH);
            const edgeB    = keysAtFarEnd ? Math.floor(keyBandY) - 1   : h - 1;
            const useEdgeA = keysAtFarEnd == inverted;
            const writeY   = useEdgeA ? edgeA : edgeB;
            const dy       = useEdgeA ? 1 : -1;

            const imgData = ctx.createImageData(w, 1);
            const pixels  = imgData.data;
            for (let x = 0; x < w; x++) {
                // Mirror freqToPadPix: pxPosition = x
                const freq     = dpPad.pixToFreq(x, freqRange, w, scaleMode);
                const binIndex = Math.round(freq / binWidth);
                const amp      = (binIndex >= 0 && binIndex < dataLen) ? dataArray[binIndex] : 0;
                const rgba     = this._amplitudeToRGBA(amp, type);
                const i        = x * 4;
                pixels[i]     = rgba[0];
                pixels[i + 1] = rgba[1];
                pixels[i + 2] = rgba[2];
                pixels[i + 3] = rgba[3];
            }
            ctx.save();
            ctx.globalCompositeOperation = 'copy';
            ctx.drawImage(canvas, 0, dy);
            ctx.restore();
            ctx.putImageData(imgData, 0, writeY);
            ctx.clearRect(0, keyBandY, w, keyBandH);
            this._drawPitchOverlay(canvas, type);
            this._drawFormantOverlay(canvas, type);
            this._drawTraceOverlay(this.overlayCanvases[type], type);
        }
    }

    /**
     * Estimates the fundamental pitch using the selected stabilization mode.
     *
     * @returns {void}
     *
     * @description
     * Change `PITCH_MODE` to switch algorithms:
     * - **0** Raw ACF (baseline — prone to octave jumps)
     * - **1** ACF + median filter (N = 7 frames, ≈ 230 ms)
     * - **2** ACF + hysteresis / octave continuity guard (K = 4 frames, ≈ 130 ms)
     * - **3** ACF + exponential moving average in midicent space (α = 0.7)
     * - **4** YIN algorithm (CMNDF; far fewer octave errors at source)
     * - **5** ACF + sub-harmonic preference (octave-above guard)
     * - **6** YIN + median filter (recommended combination)
     * @private
     */
    _detectPitch() {
        // ── Change this constant to switch pitch-stabilization modes ──────────
        // 0 = raw ACF         1 = ACF + median     2 = ACF + hysteresis
        // 3 = ACF + EMA       4 = YIN              5 = ACF + subharmonic guard
        // 6 = YIN + median
        const PITCH_MODE = 6;
        // ──────────────────────────────────────────────────────────────────────

        const buf = this.timeDomainArray;
        this.analyser.getFloatTimeDomainData(buf);
        const n  = buf.length;
        const sr = this.audioCtx.sampleRate;

        // RMS gate — suppress output on silence without clearing stabilization buffers
        // so that the first post-silence frame picks up smoothly.
        let rms = 0;
        for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
        if (Math.sqrt(rms / n) < 0.015) { this.detectedPitch = null; return; }

        // Low-pass filter: attenuate frequencies above 500 Hz before pitch detection
        // to suppress harmonics that can bias ACF/YIN toward the wrong octave.
        // First-order causal IIR: y[n] = α·x[n] + (1−α)·y[n−1]
        const LP_CUTOFF = 500;   // Hz
        const lpAlpha   = 1 - Math.exp(-2 * Math.PI * LP_CUTOFF / sr);
        const lpBuf     = new Float32Array(n);
        let   lpState   = 0;
        for (let i = 0; i < n; i++) {
            lpState  = lpAlpha * buf[i] + (1 - lpAlpha) * lpState;
            lpBuf[i] = lpState;
        }

        // Vocal range: 80 Hz (bass) – 500 Hz (aligned with LP filter cutoff)
        const minLag = Math.floor(sr / 500);
        const maxLag = Math.min(Math.ceil(sr / 80), n - 1);

        // Step 1: compute raw candidate pitch via the selected core algorithm
        let raw;
        if      (PITCH_MODE === 4 || PITCH_MODE === 6) raw = this._pitchYIN(lpBuf, n, sr, minLag, maxLag);
        else if (PITCH_MODE === 5)                     raw = this._pitchACFSubHarmGuard(lpBuf, n, sr, minLag, maxLag);
        else                                           raw = this._pitchACF(lpBuf, n, sr, minLag, maxLag);

        if (raw === null) { this.detectedPitch = null; return; }

        // Step 2: apply post-processing filter
        switch (PITCH_MODE) {
            case 0: case 4: case 5:
                this.detectedPitch = raw;
                break;
            case 1: case 6:
                this.detectedPitch = this._pitchMedian(raw, 7);
                break;
            case 2:
                this.detectedPitch = this._pitchHysteresis(raw, 4);
                break;
            case 3:
                this.detectedPitch = this._pitchEMA(raw, 0.7);
                break;
        }
    }

    // ── Pitch core algorithms ─────────────────────────────────────────────────

    /**
     * Raw autocorrelation (ACF) pitch estimator.
     * Baseline: reliable but prone to octave jumps when harmonics are strong.
     * @private
     */
    _pitchACF(buf, n, sr, minLag, maxLag) {
        const len = n - maxLag;
        let r0 = 0;
        for (let i = 0; i < len; i++) r0 += buf[i] * buf[i];
        if (r0 === 0) return null;

        let bestLag = -1, bestCorr = -Infinity;
        for (let lag = minLag; lag <= maxLag; lag++) {
            let c = 0;
            for (let i = 0; i < len; i++) c += buf[i] * buf[i + lag];
            if (c > bestCorr) { bestCorr = c; bestLag = lag; }
        }
        if (bestLag < 0 || bestCorr / r0 < 0.5) return null;

        // Parabolic interpolation for sub-sample accuracy (maximum finding)
        let lagF = bestLag;
        if (bestLag > minLag && bestLag < maxLag) {
            let prev = 0, next = 0;
            for (let i = 0; i < len; i++) prev += buf[i] * buf[i + bestLag - 1];
            for (let i = 0; i < len; i++) next += buf[i] * buf[i + bestLag + 1];
            const denom = 2 * bestCorr - prev - next;    // > 0 at a maximum
            if (denom > 0) lagF += (next - prev) / (2 * denom);
        }
        return sr / lagF;
    }

    /**
     * ACF with sub-harmonic preference — octave-above guard (mode 5).
     * After finding the best ACF peak at lag L, checks lag 2L (one octave
     * lower). If its correlation is ≥ 90 % of L's, 2L is preferred as the
     * true fundamental. This prevents the common error of locking onto the
     * second harmonic instead of the fundamental.
     * @private
     */
    _pitchACFSubHarmGuard(buf, n, sr, minLag, maxLag) {
        const len = n - maxLag;
        let r0 = 0;
        for (let i = 0; i < len; i++) r0 += buf[i] * buf[i];
        if (r0 === 0) return null;

        // Compute and store all correlations to allow non-adjacent comparisons.
        const corrs = new Float32Array(maxLag + 1);
        for (let lag = minLag; lag <= maxLag; lag++) {
            let c = 0;
            for (let i = 0; i < len; i++) c += buf[i] * buf[i + lag];
            corrs[lag] = c;
        }

        let bestLag = minLag;
        for (let lag = minLag + 1; lag <= maxLag; lag++) {
            if (corrs[lag] > corrs[bestLag]) bestLag = lag;
        }
        if (corrs[bestLag] / r0 < 0.5) return null;

        // Prefer the octave-below lag if nearly as strong.
        const doubleLag = bestLag * 2;
        if (doubleLag <= maxLag && corrs[doubleLag] / corrs[bestLag] >= 0.9) {
            bestLag = doubleLag;
        }

        // Parabolic interpolation using stored values (maximum finding)
        let lagF = bestLag;
        if (bestLag > minLag && bestLag < maxLag) {
            const alpha = corrs[bestLag - 1];
            const beta  = corrs[bestLag];
            const gamma = corrs[bestLag + 1];
            const denom = 2 * beta - alpha - gamma;    // > 0 at a maximum
            if (denom > 0) lagF += (gamma - alpha) / (2 * denom);
        }
        return sr / lagF;
    }

    /**
     * YIN pitch detector — de Cheveigné & Kawahara (2002) (mode 4, 6).
     * Uses the Cumulative Mean Normalized Difference Function (CMNDF):
     * a deep zero at the true period is far easier to locate unambiguously
     * than the broad ACF peak, which reduces octave errors significantly.
     * @private
     */
    _pitchYIN(buf, n, sr, minLag, maxLag) {
        const W = n - maxLag;    // fixed window so every tau is fully valid

        // Build the CMNDF in-place: d[tau] = diff(tau) * tau / runningSum(diff)
        const d = new Float32Array(maxLag + 1);
        let runningSum = 0;
        for (let tau = 1; tau <= maxLag; tau++) {
            let diff = 0;
            for (let j = 0; j < W; j++) {
                const delta = buf[j] - buf[j + tau];
                diff += delta * delta;
            }
            runningSum += diff;
            d[tau] = runningSum === 0 ? 0 : (diff * tau) / runningSum;
        }
        d[0] = 1;    // by definition

        // Find the first dip below the threshold (follow the local minimum).
        const threshold = 0.15;
        let bestTau = -1;
        for (let tau = minLag; tau <= maxLag; tau++) {
            if (d[tau] < threshold) {
                while (tau + 1 <= maxLag && d[tau + 1] < d[tau]) tau++;
                bestTau = tau;
                break;
            }
        }

        // Fallback: global minimum with confidence check.
        if (bestTau < 0) {
            let minVal = Infinity;
            for (let tau = minLag; tau <= maxLag; tau++) {
                if (d[tau] < minVal) { minVal = d[tau]; bestTau = tau; }
            }
            if (minVal > 0.35) return null;
        }

        // Parabolic interpolation (minimum finding)
        let tauF = bestTau;
        if (bestTau > minLag && bestTau < maxLag) {
            const alpha = d[bestTau - 1];
            const beta  = d[bestTau];
            const gamma = d[bestTau + 1];
            const denom = alpha - 2 * beta + gamma;    // > 0 at a minimum
            if (denom > 0) tauF += 0.5 * (alpha - gamma) / denom;
        }
        return sr / tauF;
    }

    // ── Pitch post-processing filters ─────────────────────────────────────────

    /**
     * Median filter over the last N detected Hz values (mode 1, 6).
     * Immune to single-frame outlier jumps: a value must persist for > N/2
     * consecutive frames before it affects the median.
     * @private
     */
    _pitchMedian(raw, N) {
        this._pitchBuffer.push(raw);
        if (this._pitchBuffer.length > N) this._pitchBuffer.shift();
        const sorted = this._pitchBuffer.slice().sort((a, b) => a - b);
        const mid    = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Hysteresis / octave continuity guard (mode 2).
     * A new pitch that differs by more than 2 semitones from the current
     * stable value must persist for K consecutive frames before it is
     * accepted. Prevents brief single-frame flips to wrong octaves.
     * @private
     */
    _pitchHysteresis(raw, K) {
        if (this._lastStablePitch === null) {
            this._lastStablePitch = raw;
            return raw;
        }
        const semitones = Math.abs(12 * Math.log2(raw / this._lastStablePitch));
        if (semitones < 2.0) {
            // Small change — accept immediately and reset any pending candidate.
            this._pendingPitch = null;
            this._pendingCount = 0;
            this._lastStablePitch = raw;
            return raw;
        }
        // Large change — accumulate in the pending slot.
        if (this._pendingPitch !== null &&
                Math.abs(12 * Math.log2(raw / this._pendingPitch)) < 2.0) {
            this._pendingCount++;
        } else {
            this._pendingPitch = raw;
            this._pendingCount = 1;
        }
        if (this._pendingCount >= K) {
            this._lastStablePitch = this._pendingPitch;
            this._pendingPitch    = null;
            this._pendingCount    = 0;
            return this._lastStablePitch;
        }
        return this._lastStablePitch;
    }

    /**
     * Exponential moving average in midicent space (mode 3).
     * α controls memory: 0 = instant tracking, 1 = frozen.
     * Blending in midicent (log) space is perceptually uniform — a 1-semitone
     * glide sounds the same at any pitch level.
     * @private
     */
    _pitchEMA(raw, alpha) {
        if (this._emaPitch === null) { this._emaPitch = raw; return raw; }
        // mc = 69 + 12 × log₂(hz / 440)
        const mc       = 69 + 12 * Math.log2(raw             / 440);
        const prevMc   = 69 + 12 * Math.log2(this._emaPitch  / 440);
        const smoothMc = alpha * prevMc + (1 - alpha) * mc;
        this._emaPitch = 440 * Math.pow(2, (smoothMc - 69) / 12);
        return this._emaPitch;
    }

    /**
     * Returns the exact anchor coordinates used by `FrequencyPad.drawFreqMonitor()`
     * for the given pad type, plus the hz-monitor font size.
     *
     * @param {HTMLCanvasElement} canvas      - The spectrogram canvas (same pixel dimensions
     *   as the FrequencyPad canvas's `cssDimensions`).
     * @param {tonetype}          [type='ft'] - `'ft'` or `'ht'`.
     * @returns {{ x:number, y:number, textAlign:string, textBaseline:string, fontSize:number }}
     * @private
     */
    _getMonitorAnchor(canvas, type = 'ft') {
        const w           = canvas.width;
        const h           = canvas.height;
        const scaleOrient = this.padSet.parameters.scaleOrientation[type].value;
        const ratios      = this.padSet.parameters.canvasObjectsRatios[type];
        const fontSize    = this.padSet.parameters.fonts[type].hzMonitor.value.size;

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
        // OSD is now rendered by FrequencyPad.drawFreqMonitor() on the
        // FrequencyPad canvas, which sits above the spectrogram waterfall.
    }

    /**
     * Detects the two most prominent spectral peaks within the visible HT pad
     * frequency range by reading directly from the live FFT `dataArray` — the
     * same buffer rendered by the spectrum line.  This is a purely geometric /
     * amplitude-based approach: the reported frequency is whichever FFT bin has
     * the highest amplitude on screen, not a model-derived envelope peak.
     *
     * @returns {void}
     *
     * @description
     * Pipeline:
     * 1. RMS gate — suppress on silence (threshold 0.015).
     * 2. Constrain the bin search to the visible HT frequency range
     *    (`freqRange['ht'].min.value` … `max.value`) so only peaks that are
     *    actually displayed on the spectrum line are considered.
     * 3. Collect all strict local maxima in `dataArray` within that range.
     * 4. Parabolic interpolation per peak for sub-bin frequency accuracy.
     * 5. Sort by amplitude (loudest first); keep the top two peaks that are
     *    ≥ 50 Hz apart to avoid selecting sidelobe pairs of the same harmonic.
     * 6. Sort the two keepers by frequency ascending (F1 = lower, F2 = higher).
     * 7. Apply a 5-frame sliding median per peak for temporal smoothing.
     * Results stored in `this.detectedF1` / `this.detectedF2` (Hz or null).
     * @private
     */
    _detectFormants(fftData = this.dataArray) {
        const buf = this.timeDomainArray;
        const n   = buf.length;
        const sr  = this.audioCtx.sampleRate;

        // RMS gate — same threshold as pitch detection.
        let rms = 0;
        for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
        if (Math.sqrt(rms / n) < 0.015) {
            this.detectedF1 = null;
            this.detectedF2 = null;
            return;
        }

        const binWidth  = sr / this.analyser.fftSize;
        const dataArray = fftData;
        const dataLen   = dataArray.length;

        // Constrain the search to the visible HT pad frequency range so the
        // reported peak always corresponds to a visible spike on the red line.
        const freqRange = this.padSet.parameters.freqRange['ht'];
        const minBin    = Math.max(1,           Math.round(freqRange.min.value / binWidth));
        const maxBin    = Math.min(dataLen - 2, Math.round(freqRange.max.value / binWidth));

        // Collect all strict local maxima within the visible bin range.
        const peaks = [];
        for (let bin = minBin + 1; bin < maxBin; bin++) {
            if (dataArray[bin] > dataArray[bin - 1] && dataArray[bin] > dataArray[bin + 1]) {
                // Parabolic interpolation for sub-bin frequency accuracy.
                const alpha = dataArray[bin - 1];
                const beta  = dataArray[bin];
                const gamma = dataArray[bin + 1];
                const denom = alpha - 2 * beta + gamma;   // ≤ 0 at a maximum
                const binF  = denom < 0 ? bin + 0.5 * (alpha - gamma) / denom : bin;
                peaks.push({ freq: binF * binWidth, amp: beta });
            }
        }

        // Sort by amplitude (loudest first) and keep the top two peaks that are
        // at least 50 Hz apart, to avoid treating sidelobes as separate peaks.
        peaks.sort((a, b) => b.amp - a.amp);
        const MIN_SEP  = 50;   // Hz
        const formants = [];
        for (const peak of peaks) {
            if (formants.every(f => Math.abs(f.freq - peak.freq) >= MIN_SEP)) {
                formants.push(peak);
                if (formants.length >= 2) break;
            }
        }
        // Use the highest-frequency peak among the candidates.
        formants.sort((a, b) => b.freq - a.freq);   // highest freq first

        const MEDIAN_N = 5;   // 5-frame sliding median ≈ 167 ms at 30 fps
        this.detectedF1 = formants.length >= 1
            ? this._formantMedian(formants[0].freq, this._f1Buffer, MEDIAN_N) : null;
        this.detectedF2 = null;
    }

    /**
     * Computes LPC coefficients using the autocorrelation method and
     * Levinson-Durbin recursion.
     *
     * @param {Float32Array} buf - Windowed, pre-emphasised signal frame.
     * @param {number}       n   - Number of samples to use from `buf`.
     * @param {number}       p   - LPC order.
     * @returns {Float32Array|null} Coefficient array a[0..p] (a[0]=1), or
     *   null if the matrix is singular or numerically unstable.
     * @private
     */
    _lpcCoeffs(buf, n, p) {
        // Step 1: autocorrelation lags 0..p
        const R = new Float32Array(p + 1);
        for (let lag = 0; lag <= p; lag++) {
            let s = 0;
            for (let i = 0; i < n - lag; i++) s += buf[i] * buf[i + lag];
            R[lag] = s;
        }
        if (R[0] <= 0) return null;

        // Step 2: Levinson-Durbin recursion
        const a    = new Float32Array(p + 1);  // a[0] = 1 implicitly
        const aTmp = new Float32Array(p + 1);
        a[0] = 1;
        let E = R[0];

        for (let i = 1; i <= p; i++) {
            // Reflection coefficient k_i
            let lambda = R[i];
            for (let j = 1; j < i; j++) lambda += a[j] * R[i - j];
            const k = -lambda / E;

            // Update: a_new[j] = a_old[j] + k * a_old[i-j], for j=1..i-1
            for (let j = 1; j < i; j++) aTmp[j] = a[j] + k * a[i - j];
            aTmp[i] = k;
            for (let j = 1; j <= i; j++) a[j] = aTmp[j];

            E *= (1 - k * k);
            if (E <= 0) return null;   // numerical instability guard
        }

        return a;
    }

    /**
     * Finds formant frequencies by evaluating the LPC power spectral density
     * and locating prominent local maxima.
     *
     * @param {Float32Array} a  - LPC coefficients a[0..p] (a[0]=1).
     * @param {number}       p  - LPC order.
     * @param {number}       sr - Sample rate in Hz.
     * @returns {number[]} Up to two formant frequencies [F1, F2] in Hz,
     *   sorted ascending.  Array may have 0, 1, or 2 elements.
     * @private
     */
    _formantFromLPC(a, p, sr) {
        // Evaluate |1 / A(e^{jω})|² at nBins frequency points (0 … Nyquist).
        const nBins    = 512;
        const spectrum = new Float32Array(nBins);
        for (let bin = 0; bin < nBins; bin++) {
            const omega = Math.PI * bin / nBins;
            let re = 0, im = 0;
            for (let k = 0; k <= p; k++) {
                re += a[k] * Math.cos(k * omega);
                im -= a[k] * Math.sin(k * omega);
            }
            const mag2    = re * re + im * im;
            spectrum[bin] = mag2 > 0 ? 1 / mag2 : 0;
        }

        // Restrict peak search to the voiced formant range (200–4000 Hz).
        const freqPerBin = sr / (2 * nBins);
        const minBin     = Math.max(1, Math.floor(200  / freqPerBin));
        const maxBin     = Math.min(nBins - 2, Math.ceil(4000 / freqPerBin));

        // Threshold: only peaks above 5 % of the in-range maximum.
        let maxSpec = 0;
        for (let bin = minBin; bin <= maxBin; bin++) {
            if (spectrum[bin] > maxSpec) maxSpec = spectrum[bin];
        }
        const threshold = maxSpec * 0.05;

        // Collect local maxima (strict) above threshold, sorted by frequency.
        const peaks = [];
        for (let bin = minBin + 1; bin < maxBin; bin++) {
            if (spectrum[bin] > spectrum[bin - 1] &&
                spectrum[bin] > spectrum[bin + 1] &&
                spectrum[bin] > threshold) {
                peaks.push(bin * freqPerBin);
            }
        }
        peaks.sort((fa, fb) => fa - fb);

        // Apply 150 Hz minimum separation and keep the first two.
        const formants = [];
        let lastFreq   = -Infinity;
        for (const freq of peaks) {
            if (freq - lastFreq >= 150) {
                formants.push(freq);
                lastFreq = freq;
                if (formants.length >= 2) break;
            }
        }

        return formants;  // [F1] or [F1, F2] or []
    }

    /**
     * Applies an N-frame sliding median filter to an incoming formant value,
     * using a caller-supplied buffer so that F1 and F2 are tracked
     * independently.
     *
     * @param {number}   raw    - The raw formant frequency (Hz) for this frame.
     * @param {number[]} buffer - The caller-owned sliding-window array
     *   (shared state; mutated in place).
     * @param {number}   N      - Maximum window size.
     * @returns {number} The median of the last ≤N valid values.
     * @private
     */
    _formantMedian(raw, buffer, N) {
        buffer.push(raw);
        if (buffer.length > N) buffer.shift();
        const sorted = buffer.slice().sort((fa, fb) => fa - fb);
        const mid    = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Draws the detected F1 and F2 formant frequencies as a two-line text
     * overlay on the HT spectrogram canvas, positioned just above the HT
     * hz-monitor corner.  Mirrors `_drawPitchOverlay` for the FT canvas.
     *
     * @param {HTMLCanvasElement} canvas - The spectrogram canvas to annotate.
     * @param {tonetype}          type   - Only acts when `'ht'`.
     * @private
     *
     * @description
     * Calls `_getMonitorAnchor(canvas, 'ht')` to obtain the exact anchor
     * used by `FrequencyPad.drawFreqMonitor()`, then positions two lines:
     * - **F2** (lower): bottom at `y − fontSize − gap` (above monitor body).
     * - **F1** (upper): bottom at F2 bottom − `pitchFontSize` − `lineGap`.
     * A single `clearRect` spanning both lines is applied every frame.
     */
    _drawFormantOverlay(canvas, type) {
        // OSD is now rendered by FrequencyPad.drawFreqMonitor() on the
        // FrequencyPad canvas, which sits above the spectrogram waterfall.
    }

    /**
     * Renders a real-time FFT spectrum line on the HT pad overlay canvas.
     *
     * For each pixel row (vertical orientation) or column (horizontal
     * orientation) the corresponding frequency is looked up in the live FFT
     * data and the amplitude is mapped to an offset from the key-band boundary
     * into the key-free area.  The baseline of the line is the edge of the
     * free area that borders the key band; high amplitude extends away from it.
     * The line uses the same frequency-to-pixel mapping as `_renderPad` so it
     * is perfectly aligned with the waterfall and the HT key labels.
     *
     * @param {CanvasRenderingContext2D} ctx          - The overlay 2D context.
     * @param {HTMLCanvasElement}        overlayCanvas - The overlay canvas.
     * @param {tonetype}                 type          - Only acts when `'ht'`.
     * @private
     */
    _drawSpectrumLine(ctx, overlayCanvas, type) {
        if (type !== 'ht') return;
        if (!this.dataArray) return;

        const w = overlayCanvas.width;
        const h = overlayCanvas.height;
        if (w <= 0 || h <= 0) return;

        const scaleOrient  = this.padSet.parameters.scaleOrientation[type].value;
        const scaleMode    = this.padSet.parameters.scaleMode[type].value;
        const freqRange    = this.padSet.parameters.freqRange[type];
        const dpPad        = this.padSet.dpPadComponent;
        const sampleRate   = this.audioCtx.sampleRate;
        const binWidth     = sampleRate / this.analyser.fftSize;
        const dataArray    = this.dataArray;
        const dataLen      = dataArray.length;
        const keyRatios    = this.padSet.parameters.canvasObjectsRatios[type].key;
        const keysAtFarEnd = keyRatios.position >= 0.5;

        // Number of pixels to skip between sampled points.
        // 1 = maximum resolution (one point per pixel);
        // higher values produce a coarser, more angular line.
        const STEP = 8;

        ctx.save();
        ctx.strokeStyle = 'rgba(34, 41, 217, 0.9)';
        ctx.lineWidth   = 2;
        ctx.lineJoin    = 'round';
        ctx.beginPath();

        if (scaleOrient === 'vertical') {
            const keyBandX  = w * (1 - keyRatios.length) * keyRatios.position;
            const keyBandW  = w * keyRatios.length;
            const freeStart = keysAtFarEnd ? 0                    : Math.ceil(keyBandX + keyBandW);
            const freeEnd   = keysAtFarEnd ? Math.floor(keyBandX) : w;
            const freeWidth = freeEnd - freeStart;
            // Baseline is the key-band edge; amplitude extends into the free area.
            const baselineX = keysAtFarEnd ? freeEnd  : freeStart;
            const direction = keysAtFarEnd ? -1        : 1;

            let first = true;
            for (let y = 0; y < h; y += STEP) {
                const freq     = dpPad.pixToFreq(h - y, freqRange, h, scaleMode);
                const binIndex = Math.round(freq / binWidth);
                const amp      = (binIndex >= 0 && binIndex < dataLen) ? dataArray[binIndex] : 0;
                const lineX    = baselineX + direction * (amp / 255) * freeWidth;
                if (first) { ctx.moveTo(lineX, y); first = false; } else { ctx.lineTo(lineX, y); }
            }
        } else {
            // Horizontal orientation: frequency axis runs along X.
            const keyBandY   = h * (1 - keyRatios.length) * keyRatios.position;
            const keyBandH   = h * keyRatios.length;
            const freeStart  = keysAtFarEnd ? 0                    : Math.ceil(keyBandY + keyBandH);
            const freeEnd    = keysAtFarEnd ? Math.floor(keyBandY) : h;
            const freeHeight = freeEnd - freeStart;
            const baselineY  = keysAtFarEnd ? freeEnd  : freeStart;
            const direction  = keysAtFarEnd ? -1        : 1;

            let first = true;
            for (let x = 0; x < w; x += STEP) {
                const freq     = dpPad.pixToFreq(x, freqRange, w, scaleMode);
                const binIndex = Math.round(freq / binWidth);
                const amp      = (binIndex >= 0 && binIndex < dataLen) ? dataArray[binIndex] : 0;
                const lineY    = baselineY + direction * (amp / 255) * freeHeight;
                if (first) { ctx.moveTo(x, lineY); first = false; } else { ctx.lineTo(x, lineY); }
            }
        }

        ctx.stroke();
        ctx.restore();
    }

    /**
     * Draws pitch / formant trace lines on the dedicated overlay canvas for the
     * given pad type. The overlay is cleared entirely every frame so lines
     * disappear immediately when detection returns `null` — no scrolling
     * residue accumulates in the waterfall history.
     *
     * @param {HTMLCanvasElement} overlayCanvas - The trace overlay canvas.
     * @param {tonetype}          type          - `'ft'` (pitch) or `'ht'` (F1 + F2).
     * @private
     *
     * @description
     * Lines are drawn as filled rectangles spanning the key-free area of the pad:
     * - **Vertical orientation**: horizontal lines (4 px tall) at the detected
     *   frequency's row position.
     * - **Horizontal orientation**: vertical lines (4 px wide) at the detected
     *   frequency's column position.
     * Frequencies outside the visible pad range are silently skipped.
     */
    _drawTraceOverlay(overlayCanvas, type) {
        const w   = overlayCanvas.width;
        const h   = overlayCanvas.height;
        const ctx = overlayCanvas.getContext('2d');
        // Always clear first so stale pixels don't accumulate across frames.
        // FT trace: uses _lastTrackedHz, which is set only when spectrogram pitch
        // recognition calls trackFTcontinuum, and cleared whenever user plays any FT.
        // This means the trace persists after silence but disappears on user FT play
        // and stays hidden until pitch recognition reactivates it.
        // HT formant traces: driven by live detection — vanish instantly on silence.
        ctx.clearRect(0, 0, w, h);

        // Draw the real-time spectrum line in the HT pad key-free area.
        this._drawSpectrumLine(ctx, overlayCanvas, type);

        const freqs = type === 'ft'
            ? [this._lastTrackedHz]
            : [this._displayFormantHz, this.detectedF2];
        if (freqs.every(f => f === null || f === undefined)) return;

        const scaleOrient = this.padSet.parameters.scaleOrientation[type].value;
        const scaleMode   = this.padSet.parameters.scaleMode[type].value;
        const freqRange   = this.padSet.parameters.freqRange[type];
        const dpPad       = this.padSet.dpPadComponent;
        const keyRatios   = this.padSet.parameters.canvasObjectsRatios[type].key;

        // Key-free area bounds along the cross-axis (X for vertical, Y for
        // horizontal) — mirrors the clearRect geometry used in _renderPad.
        const keysAtFarEnd = keyRatios.position >= 0.5;
        let freeStart, freeEnd;
        if (scaleOrient === 'vertical') {
            const keyBandX = w * (1 - keyRatios.length) * keyRatios.position;
            const keyBandW = w * keyRatios.length;
            freeStart = keysAtFarEnd ? 0                     : Math.ceil(keyBandX + keyBandW);
            freeEnd   = keysAtFarEnd ? Math.floor(keyBandX) : w;
        } else {
            const keyBandY = h * (1 - keyRatios.length) * keyRatios.position;
            const keyBandH = h * keyRatios.length;
            freeStart = keysAtFarEnd ? 0                     : Math.ceil(keyBandY + keyBandH);
            freeEnd   = keysAtFarEnd ? Math.floor(keyBandY) : h;
        }

        ctx.fillStyle = 'rgba(5, 138, 5, 0.85)';
        for (const freq of freqs) {
            if (freq === null || freq === undefined) continue;
            if (scaleOrient === 'vertical') {
                // Frequency axis = Y (bottom = low freq, top = high freq).
                const rawPx = dpPad.freqToPix(freq, freqRange, h, scaleMode);
                const px    = Math.round(h - rawPx);
                if (px < 0 || px >= h) continue;   // outside pad range — skip silently
                // Horizontal line spanning the key-free x-range, 4 pixels tall.
                ctx.fillRect(freeStart, px - 1, freeEnd - freeStart, 4);
            } else {
                // Frequency axis = X (left = low freq, right = high freq).
                const px = Math.round(dpPad.freqToPix(freq, freqRange, w, scaleMode));
                if (px < 0 || px >= w) continue;   // outside pad range — skip silently
                // Vertical line spanning the key-free y-range, 4 pixels wide.
                ctx.fillRect(px - 1, freeStart, 4, freeEnd - freeStart);
            }
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
        // Apply contrast (scale around midpoint 128) then brightness (additive offset).
        const brightness = this.padSet.parameters.spectrogramBrightness.value;
        const contrast   = this.padSet.parameters.spectrogramContrast.value;
        let a = (amp - 128) * contrast + 128 + brightness;
        if (a < 0)   { a = 0; }
        if (a > 255) { a = 255; }
        const alpha = Math.round(a * 0.85);
        // In dark mode the palette ramps *up* from black toward a saturated
        // pink (FT) or blue (HT). Hue stays in the same family as light mode.
        const dark = !!(this.padSet && this.padSet.dpPadComponent
                        && this.padSet.dpPadComponent.harmonicarium
                        && this.padSet.dpPadComponent.harmonicarium.themeManager
                        && this.padSet.dpPadComponent.harmonicarium.themeManager.isDark());
        if (type === 'ft') {
            if (dark) {
                return [
                    Math.round(a),           // R rises with amp
                    Math.round(a * 0.28),    // G stays low for pink hue
                    Math.round(a * 0.55),    // B mid for magenta tint
                    alpha
                ];
            }
            return [
                255,
                Math.round(255 - a * 0.72),
                Math.round(255 - a * 0.45),
                alpha
            ];
        } else {
            if (dark) {
                return [
                    Math.round(a * 0.28),    // R low for blue hue
                    Math.round(a * 0.55),    // G mid for cyan tint
                    Math.round(a),           // B rises with amp
                    alpha
                ];
            }
            return [
                Math.round(255 - a * 0.72),
                Math.round(255 - a * 0.45),
                255,
                alpha
            ];
        }
    }
};
