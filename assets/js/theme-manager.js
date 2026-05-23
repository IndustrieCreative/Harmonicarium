/**
 * @fileoverview Light / Dark theme manager for the Harmonicarium UI.
 * Provides {@link HUM.ThemeManager}, a small standalone controller that:
 *  - persists the user's choice (`light` | `dark` | `auto`) in `localStorage`;
 *  - resolves the active theme (`light` | `dark`) taking the OS preference
 *    into account when in `auto` mode;
 *  - applies the theme by toggling Bootstrap 5's `data-bs-theme` attribute on
 *    `<html>` and a companion `hum-theme-{light|dark}` class on `<body>`;
 *  - exposes a tiny pub/sub so canvas-rendering components (DiphonicPad,
 *    spectrogram, etc.) can redraw on theme changes;
 *  - syncs across browser tabs via the `storage` event (and via the
 *    Harmonicarium {@link HUM.BroadcastChannel} when available).
 *
 * The DOM-level attribute is also set very early — before the DOM body is
 * parsed — by an inline bootstrap snippet living in `index.html`, to avoid
 * a flash of unstyled / wrong-themed content (FOUC).
 *
 * @module theme-manager
 * @memberof HUM
 * @version 0.8.2
 * @author Walter G. Mantovani <armonici.it@gmail.com>
 * @copyright (C) 2017-2026 Walter G. Mantovani
 * @license AGPL-3.0-or-later
 */

"use strict";

/**
 * Theme manager: light / dark / auto.
 *
 * @class
 * @memberof HUM
 */
HUM.ThemeManager = class {
    /**
     * The localStorage key that stores the user's choice.
     * @type {string}
     */
    static STORAGE_KEY = 'hum.theme';

    /**
     * Allowed user-facing mode values.
     * @type {ReadonlyArray<string>}
     */
    static MODES = Object.freeze(['auto', 'light', 'dark']);

    /**
     * Reads the persisted user choice from `localStorage`, falling back to
     * `'auto'` when nothing is stored or the value is invalid. This is also
     * used by the inline pre-paint snippet in `index.html` (kept in sync by
     * convention — see {@link HUM.ThemeManager.resolveInitial}).
     *
     * @returns {'auto'|'light'|'dark'} The stored mode.
     */
    static readStoredMode() {
        try {
            const v = window.localStorage.getItem(HUM.ThemeManager.STORAGE_KEY);
            if (HUM.ThemeManager.MODES.includes(v)) {
                return v;
            }
        } catch (e) { /* localStorage disabled */ }
        return 'auto';
    }

    /**
     * Resolves the effective theme (`light` | `dark`) from a mode value.
     * In `'auto'` mode, defers to `prefers-color-scheme`.
     *
     * @param {'auto'|'light'|'dark'} mode
     * @returns {'light'|'dark'}
     */
    static resolve(mode) {
        if (mode === 'light' || mode === 'dark') {
            return mode;
        }
        if (window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Applies a resolved theme to the document root. Safe to call before
     * `DOMContentLoaded`; used by the inline pre-paint snippet too.
     *
     * @param {'light'|'dark'} resolved
     */
    static applyToDocument(resolved) {
        const html = document.documentElement;
        html.setAttribute('data-bs-theme', resolved);
        if (document.body) {
            document.body.classList.remove('hum-theme-light', 'hum-theme-dark');
            document.body.classList.add('hum-theme-' + resolved);
        }
    }

    /**
     * Creates a ThemeManager. The constructor immediately re-applies the
     * stored mode (idempotent with the inline pre-paint snippet) and starts
     * listening for OS preference changes.
     *
     * @param {HUM} harmonicarium - The owning {@link HUM} instance.
     */
    constructor(harmonicarium) {
        /** @type {HUM} */
        this.harmonicarium = harmonicarium;

        /** @type {'auto'|'light'|'dark'} */
        this.mode = HUM.ThemeManager.readStoredMode();

        /** @type {'light'|'dark'} */
        this.resolved = HUM.ThemeManager.resolve(this.mode);

        /** @type {Set<function('light'|'dark', 'auto'|'light'|'dark'):void>} */
        this._subscribers = new Set();

        // Apply now (no-op if the inline bootstrap already did it).
        HUM.ThemeManager.applyToDocument(this.resolved);

        // Listen to OS preference changes (only matters in 'auto' mode).
        this._mql = (window.matchMedia)
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : null;
        if (this._mql) {
            this._osListener = () => {
                if (this.mode === 'auto') {
                    this._recompute();
                }
            };
            // Modern browsers support addEventListener on MediaQueryList.
            if (typeof this._mql.addEventListener === 'function') {
                this._mql.addEventListener('change', this._osListener);
            } else if (typeof this._mql.addListener === 'function') {
                // Safari < 14 fallback.
                this._mql.addListener(this._osListener);
            }
        }

        // Cross-tab sync via storage event.
        this._storageListener = (evt) => {
            if (evt.key === HUM.ThemeManager.STORAGE_KEY) {
                const next = HUM.ThemeManager.readStoredMode();
                if (next !== this.mode) {
                    this.mode = next;
                    this._recompute();
                }
            }
        };
        window.addEventListener('storage', this._storageListener);
    }

    /**
     * Sets the user-selected mode, persists it, and re-applies the resolved
     * theme. Notifies all subscribers when the resolved theme changes.
     *
     * @param {'auto'|'light'|'dark'} mode
     */
    setMode(mode) {
        if (!HUM.ThemeManager.MODES.includes(mode)) {
            return;
        }
        this.mode = mode;
        try {
            window.localStorage.setItem(HUM.ThemeManager.STORAGE_KEY, mode);
        } catch (e) { /* localStorage disabled */ }
        this._recompute();
    }

    /**
     * Subscribes to theme changes. The callback is invoked synchronously
     * whenever the resolved theme changes (not on every `setMode()` call
     * when the resolved value is unchanged).
     *
     * @param {function('light'|'dark', 'auto'|'light'|'dark'):void} cb
     * @returns {function():void} Unsubscribe function.
     */
    subscribe(cb) {
        if (typeof cb !== 'function') { return () => {}; }
        this._subscribers.add(cb);
        return () => this._subscribers.delete(cb);
    }

    /**
     * Recomputes the resolved theme from the current mode, applies it, and
     * notifies subscribers if it changed.
     * @private
     */
    _recompute() {
        const next = HUM.ThemeManager.resolve(this.mode);
        const changed = next !== this.resolved;
        this.resolved = next;
        HUM.ThemeManager.applyToDocument(next);
        if (changed) {
            for (const cb of this._subscribers) {
                try { cb(next, this.mode); }
                catch (e) { console.error('[ThemeManager] subscriber error:', e); }
            }
        }
    }

    /**
     * Returns `true` if the current resolved theme is dark.
     * @returns {boolean}
     */
    isDark() {
        return this.resolved === 'dark';
    }

    /**
     * Binds the theme switch radio group in the User accordion to this
     * manager. Safe to call after `_initTemplates()` has rendered the DOM.
     *
     * @param {number|string} humID - The HUM instance ID used in element IDs.
     */
    attachUI(humID) {
        const group = document.getElementById('HTMLi_theme_switch' + humID);
        if (!group) { return; }
        const radios = group.querySelectorAll('input[type="radio"]');
        // Reflect current mode in the UI.
        radios.forEach((r) => {
            r.checked = (r.value === this.mode);
            r.addEventListener('change', (evt) => {
                if (evt.target.checked) {
                    this.setMode(evt.target.value);
                }
            });
        });
        // Keep the radio group in sync if the mode changes elsewhere
        // (e.g. cross-tab via storage event).
        this.subscribe(() => {
            radios.forEach((r) => { r.checked = (r.value === this.mode); });
        });
    }
};
