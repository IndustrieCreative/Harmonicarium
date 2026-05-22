/**
 * @fileoverview MIDI file player for the Harmonicarium.
 * This module defines the {@link HUM.midi.MidiPlayer} class which loads a
 * Standard MIDI File (SMF) via the bundled JZZ.js library and routes its
 * events either to a virtual internal MIDI-In port (re-using the regular
 * Harmonicarium MIDI pipeline) or to any selected hardware MIDI-Out port.
 *
 * Dependencies (must be loaded before this file):
 *   - assets/js/lib/JZZ.js            (exposes the global `JZZ`)
 *   - assets/js/lib/JZZ.midi.SMF.js   (patches `JZZ.MIDI.SMF`)
 *   - assets/js/midi-hub.js + sub-modules (`HUM.midi` namespace)
 *
 * @module midi-player
 * @memberof HUM.midi
 * @version 0.8.2
 * @author Walter G. Mantovani <armonici.it@gmail.com>
 * @copyright (C) 2017-2026 Walter G. Mantovani
 * @license AGPL-3.0-or-later
 */

"use strict";

/**
 * MIDI file player that can route SMF events to the internal Harmonicarium
 * MIDI-In pipeline (through a virtual input port) or to any selected
 * hardware MIDI-Out port.
 *
 * @class
 * @memberof HUM.midi
 */
HUM.midi.MidiPlayer = class {
    /**
     * @param {HUM.DHC}          dhc  - The owning DHC instance.
     * @param {HUM.midi.MidiHub} midi - The parent MidiHub.
     */
    constructor(dhc, midi) {
        this.id = dhc.id;
        this._id = dhc._id;
        this.name = 'midi_player';
        this.dhc = dhc;
        this.midi = midi;

        /** @type {?Object} JZZ SMF object */
        this.smf = null;
        /** @type {?Object} JZZ player (SMF.player()) */
        this.player = null;
        /** @type {?string} Loaded file name */
        this.loadedFileName = null;
        /** @type {boolean} Transport flags */
        this.isPlaying = false;
        this.isPaused = false;
        /** @type {boolean} Set by MidiPorts when the virtual-input checkbox is toggled */
        this.virtualInputEnabled = false;
        /** @type {string} Stable id of the synthetic input port */
        this.virtualPortId = 'midiplayer_in_virtual';
        /** @type {string} Display name of the synthetic input port */
        this.virtualPortName = 'MIDI Player (internal)';

        this._uiRafId = null;
        this._userSeeking = false;
        this._prefsKey = `hum.midiPlayer.prefs.${this.id}`;
        this.prefs = this._loadPrefs();

        // Register with the DHC pub/sub bus (mainly to react to panic).
        this.dhc.registerApp(this, 'updatesFromDHC', 5);

        // Bind UI: the side-panel template has already been injected by
        // HUM._initDHCs() before the DHC (and therefore this MidiPlayer)
        // is constructed.
        this._bindUI();
        this.refreshDestinations();
        this._applyPrefsToUI();
        this._updateTransportUI();
        this._updatePositionUI();
    }

    /* ===================================================================
     * DHC message bus
     * ================================================================ */

    /**
     * Handler invoked by the DHC pub/sub.
     * @param {HUM.DHCmsg} msg
     */
    updatesFromDHC(msg) {
        if (msg && msg.cmd === 'panic') {
            if (this.player) {
                try { this.player.stop(); } catch (e) { /* noop */ }
            }
            this.isPlaying = false;
            this.isPaused = false;
            this._stopUiLoop();
            this._updateTransportUI();
            this._updatePositionUI();
        }
    }

    /* ===================================================================
     * Preferences (simple localStorage; not part of the HUM preset system)
     * ================================================================ */

    _defaultPrefs() {
        return { speed: 1.0, loop: false, destination: 'internal' };
    }

    _loadPrefs() {
        try {
            const raw = (typeof localStorage !== 'undefined')
                ? localStorage.getItem(this._prefsKey) : null;
            if (!raw) { return this._defaultPrefs(); }
            return Object.assign(this._defaultPrefs(), JSON.parse(raw));
        } catch (e) {
            return this._defaultPrefs();
        }
    }

    _savePrefs() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this._prefsKey, JSON.stringify(this.prefs));
            }
        } catch (e) { /* noop */ }
    }

    /* ===================================================================
     * UI binding
     * ================================================================ */

    _bindUI() {
        const fileInput = document.getElementById(`HTMLi_midiPlayer_file${this.id}`);
        const playBtn   = document.getElementById(`HTMLi_midiPlayer_play${this.id}`);
        const pauseBtn  = document.getElementById(`HTMLi_midiPlayer_pause${this.id}`);
        const stopBtn   = document.getElementById(`HTMLi_midiPlayer_stop${this.id}`);
        const destSel   = document.getElementById(`HTMLi_midiPlayer_dest${this.id}`);
        const speedIn   = document.getElementById(`HTMLi_midiPlayer_speed${this.id}`);
        const loopChk   = document.getElementById(`HTMLi_midiPlayer_loop${this.id}`);
        const seekIn    = document.getElementById(`HTMLi_midiPlayer_seek${this.id}`);

        if (fileInput) { fileInput.addEventListener('change', (e) => this._onFileChosen(e)); }
        if (playBtn)   { playBtn.addEventListener('click', () => this.play()); }
        if (pauseBtn)  { pauseBtn.addEventListener('click', () => this.togglePause()); }
        if (stopBtn)   { stopBtn.addEventListener('click', () => this.stop()); }
        if (destSel)   { destSel.addEventListener('change', (e) => this.setDestination(e.target.value)); }
        if (speedIn) {
            speedIn.addEventListener('change', (e) => {
                const v = parseFloat(e.target.value);
                this.setSpeed(isFinite(v) && v > 0 ? v : 1.0);
            });
        }
        if (loopChk) {
            loopChk.addEventListener('change', (e) => this.setLoop(e.target.checked));
        }
        if (seekIn) {
            seekIn.addEventListener('input', () => { this._userSeeking = true; });
            seekIn.addEventListener('change', (e) => {
                const ms = parseFloat(e.target.value);
                if (isFinite(ms)) { this.seek(ms); }
                this._userSeeking = false;
            });
        }
    }

    _applyPrefsToUI() {
        const destSel = document.getElementById(`HTMLi_midiPlayer_dest${this.id}`);
        const speedIn = document.getElementById(`HTMLi_midiPlayer_speed${this.id}`);
        const loopChk = document.getElementById(`HTMLi_midiPlayer_loop${this.id}`);
        if (destSel) { destSel.value = this.prefs.destination; }
        if (speedIn) { speedIn.value = String(this.prefs.speed); }
        if (loopChk) { loopChk.checked = !!this.prefs.loop; }
        // If default destination is internal, make sure the virtual input port
        // checkbox starts checked too.
        if (this.prefs.destination === 'internal') {
            this._autoCheckVirtualInputPort();
        }
    }

    _updateTransportUI() {
        const playBtn  = document.getElementById(`HTMLi_midiPlayer_play${this.id}`);
        const pauseBtn = document.getElementById(`HTMLi_midiPlayer_pause${this.id}`);
        const stopBtn  = document.getElementById(`HTMLi_midiPlayer_stop${this.id}`);
        const status   = document.getElementById(`HTMLo_midiPlayer_status${this.id}`);
        const hasFile  = !!this.player;
        if (playBtn)  { playBtn.disabled  = !hasFile || (this.isPlaying && !this.isPaused); }
        if (pauseBtn) {
            pauseBtn.disabled    = !hasFile || !this.isPlaying;
            pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
        if (stopBtn)  { stopBtn.disabled  = !hasFile || (!this.isPlaying && !this.isPaused); }
        if (status) {
            if (!hasFile)             { status.textContent = 'No file loaded'; }
            else if (this.isPaused)   { status.textContent = 'Paused'; }
            else if (this.isPlaying)  { status.textContent = 'Playing'; }
            else                      { status.textContent = 'Ready'; }
        }
    }

    _updatePositionUI() {
        const cur  = document.getElementById(`HTMLo_midiPlayer_curTime${this.id}`);
        const tot  = document.getElementById(`HTMLo_midiPlayer_totTime${this.id}`);
        const seek = document.getElementById(`HTMLi_midiPlayer_seek${this.id}`);
        if (!this.player) {
            if (cur)  { cur.textContent = '00:00'; }
            if (tot)  { tot.textContent = '00:00'; }
            if (seek) { seek.max = '0'; seek.value = '0'; seek.disabled = true; }
            return;
        }
        const pos = (typeof this.player.positionMS === 'function') ? this.player.positionMS() : 0;
        const dur = (typeof this.player.durationMS === 'function') ? this.player.durationMS() : 0;
        if (cur) { cur.textContent = HUM.midi.MidiPlayer._formatMS(pos); }
        if (tot) { tot.textContent = HUM.midi.MidiPlayer._formatMS(dur); }
        if (seek && !this._userSeeking) {
            seek.max      = String(Math.max(1, Math.round(dur)));
            seek.value    = String(Math.round(pos));
            seek.disabled = false;
        }
    }

    static _formatMS(ms) {
        if (!isFinite(ms) || ms < 0) { ms = 0; }
        const totalSeconds = Math.floor(ms / 1000);
        const mm = Math.floor(totalSeconds / 60);
        const ss = totalSeconds % 60;
        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }

    _startUiLoop() {
        if (this._uiRafId) { return; }
        const tick = () => {
            this._uiRafId = null;
            this._updatePositionUI();
            if (this.isPlaying && !this.isPaused) {
                this._uiRafId = requestAnimationFrame(tick);
            }
        };
        this._uiRafId = requestAnimationFrame(tick);
    }

    _stopUiLoop() {
        if (this._uiRafId) {
            cancelAnimationFrame(this._uiRafId);
            this._uiRafId = null;
        }
    }

    /* ===================================================================
     * Destination dropdown
     * ================================================================ */

    /**
     * Rebuilds the destination dropdown to include "internal" and every
     * currently-available hardware MIDI-Out port. WebMidiLink ports are
     * excluded. Called on initialization and on every MIDI port hot-plug.
     */
    refreshDestinations() {
        const sel = document.getElementById(`HTMLi_midiPlayer_dest${this.id}`);
        if (!sel) { return; }
        const prevValue = sel.value || this.prefs.destination || 'internal';
        sel.innerHTML = '';

        const internalOpt = document.createElement('option');
        internalOpt.value = 'internal';
        internalOpt.textContent = 'Harmonicarium (internal)';
        sel.appendChild(internalOpt);

        const access = this.midi.port.midiAccess;
        if (access) {
            access.outputs.forEach((port) => {
                if (typeof port.id === 'string' && port.id.indexOf('webmidilink') > -1) { return; }
                const opt = document.createElement('option');
                opt.value = port.id;
                opt.textContent = port.name || port.id;
                sel.appendChild(opt);
            });
        }

        let found = false;
        for (const opt of sel.options) {
            if (opt.value === prevValue) { found = true; break; }
        }
        if (found) {
            sel.value = prevValue;
        } else {
            sel.value = 'internal';
            if (this.prefs.destination !== 'internal') {
                this.prefs.destination = 'internal';
                this._savePrefs();
                if (this.player) { this._rewirePlayerConnections(); }
            }
        }
    }

    /**
     * Selects the destination for the player output.
     * @param {string} value 'internal' or a MIDIOutput.id
     */
    setDestination(value) {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) { this.stop(); }
        this.prefs.destination = value || 'internal';
        this._savePrefs();
        if (this.player) { this._rewirePlayerConnections(); }
        if (this.prefs.destination === 'internal') {
            this._autoCheckVirtualInputPort();
        }
    }

    /**
     * Programmatically check the virtual MIDI-In port checkbox so the user
     * does not need to do it manually when picking the "internal" destination.
     */
    _autoCheckVirtualInputPort() {
        const chk = document.getElementById(`${this.virtualPortId}_${this.id}`);
        if (chk && !chk.checked) {
            chk.checked = true;
            // Dispatch the same event MidiPorts listens for.
            chk.dispatchEvent(new Event('click', { bubbles: true }));
            // dispatchEvent of a synthetic 'click' won't toggle the checkbox
            // back, but MidiPorts.portSelect reads elem.checked which we set
            // to true above, so the routing is properly engaged.
        }
    }

    /* ===================================================================
     * File loading
     * ================================================================ */

    _onFileChosen(evt) {
        const file = evt.target && evt.target.files && evt.target.files[0];
        if (!file) { return; }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const bytes = new Uint8Array(reader.result);
                this.loadBytes(bytes, file.name);
            } catch (err) {
                this._logError('Failed to read MIDI file: ' + (err && err.message ? err.message : err));
            }
        };
        reader.onerror = () => this._logError('Could not read file.');
        reader.readAsArrayBuffer(file);
    }

    /**
     * Loads SMF bytes and prepares the player.
     * @param {Uint8Array} bytes
     * @param {string}     [name='untitled.mid']
     */
    loadBytes(bytes, name) {
        if (typeof JZZ === 'undefined' || !JZZ.MIDI || !JZZ.MIDI.SMF) {
            this._logError('JZZ library is not loaded.');
            return;
        }
        if (this.isPlaying || this.isPaused) { this.stop(); }
        this._teardownPlayer();

        try {
            this.smf = new JZZ.MIDI.SMF(bytes);
        } catch (err) {
            this.smf = null;
            this._logError('Invalid MIDI file: ' + (err && err.message ? err.message : err));
            this._updateTransportUI();
            this._updatePositionUI();
            return;
        }

        this.loadedFileName = name || 'untitled.mid';
        this.player = this.smf.player();
        if (this.player) {
            this.player.onEnd = () => this._onEnd();
            try { this.player.speed(this.prefs.speed); } catch (e) { /* noop */ }
            try { this.player.loop(!!this.prefs.loop); } catch (e) { /* noop */ }
        }
        this._rewirePlayerConnections();

        const fileLabel = document.getElementById(`HTMLo_midiPlayer_fileName${this.id}`);
        if (fileLabel) { fileLabel.textContent = this.loadedFileName; }

        this._updatePositionUI();
        this._updateTransportUI();

        const dur = (this.player && typeof this.player.durationMS === 'function')
            ? HUM.midi.MidiPlayer._formatMS(this.player.durationMS()) : '?';
        this._log(`MIDI Player: loaded "${this.loadedFileName}" (${dur}).`);
    }

    _teardownPlayer() {
        if (this.player) {
            try { this.player.stop(); }       catch (e) { /* noop */ }
            try { this.player.disconnect(); } catch (e) { /* noop */ }
        }
        this.player = null;
        this.smf = null;
        this.isPlaying = false;
        this.isPaused = false;
        this._stopUiLoop();
    }

    _rewirePlayerConnections() {
        if (!this.player) { return; }
        try { this.player.disconnect(); } catch (e) { /* noop */ }
        if (this.prefs.destination === 'internal') {
            this.player.connect((msg) => this._sendToInternal(msg));
            return;
        }
        const access = this.midi.port.midiAccess;
        const port = access ? access.outputs.get(this.prefs.destination) : null;
        if (!port) {
            this._logError(`MIDI-Out port "${this.prefs.destination}" not found; falling back to internal.`);
            this.prefs.destination = 'internal';
            this._savePrefs();
            const destSel = document.getElementById(`HTMLi_midiPlayer_dest${this.id}`);
            if (destSel) { destSel.value = 'internal'; }
            this.player.connect((msg) => this._sendToInternal(msg));
            return;
        }
        this.player.connect((msg) => this._sendToHardware(msg, port));
    }

    /* ===================================================================
     * Output routing
     * ================================================================ */

    _isSmfMeta(jzzMsg) {
        if (!jzzMsg) { return true; }
        if (typeof jzzMsg.isSMF === 'function' && jzzMsg.isSMF()) { return true; }
        // Defensive: JZZ wraps SMF events; the raw bytes never start with 0xFF
        // on a wire-level MIDI stream, but the SMF player may surface them.
        const b0 = jzzMsg[0];
        return (b0 === 0xFF);
    }

    _sendToInternal(jzzMsg) {
        if (!this.virtualInputEnabled) { return; }
        if (this._isSmfMeta(jzzMsg)) { return; }
        const bytes = Array.prototype.slice.call(jzzMsg, 0, 3);
        if (bytes.length === 0) { return; }
        const midievent = {
            data: [
                bytes[0] & 0xFF,
                (bytes[1] !== undefined ? bytes[1] & 0xFF : 0),
                (bytes[2] !== undefined ? bytes[2] & 0xFF : 0),
                false,
                false
            ],
            srcElement: {
                id: this.virtualPortId,
                manufacturer: 'Industrie Creative',
                name: this.virtualPortName,
                type: 'input'
            },
            timeStamp: (typeof performance !== 'undefined' && performance.now)
                ? performance.now() : Date.now()
        };
        try {
            this.midi.in.midiMessageReceived(midievent);
        } catch (e) {
            // Avoid breaking the player loop on a single bad message.
        }
    }

    _sendToHardware(jzzMsg, port) {
        if (this._isSmfMeta(jzzMsg)) { return; }
        try {
            port.send(Array.prototype.slice.call(jzzMsg));
        } catch (e) {
            // Hardware ports may reject e.g. sysex; ignore.
        }
    }

    /* ===================================================================
     * Transport
     * ================================================================ */

    play() {
        if (!this.player) { return; }
        if (this.isPaused) { this.resume(); return; }
        if (this.isPlaying) { return; }
        this.isPlaying = true;
        this.isPaused  = false;
        this._rewirePlayerConnections();
        try {
            this.player.play();
        } catch (e) {
            this._logError('Cannot start playback: ' + (e && e.message ? e.message : e));
            this.isPlaying = false;
        }
        this._updateTransportUI();
        this._startUiLoop();
    }

    togglePause() {
        if (!this.player || !this.isPlaying) { return; }
        if (this.isPaused) { this.resume(); } else { this.pause(); }
    }

    pause() {
        if (!this.player || !this.isPlaying || this.isPaused) { return; }
        try { this.player.pause(); } catch (e) { /* noop */ }
        this.isPaused = true;
        this._updateTransportUI();
        this._stopUiLoop();
    }

    resume() {
        if (!this.player || !this.isPaused) { return; }
        try { this.player.resume(); } catch (e) { /* noop */ }
        this.isPaused = false;
        this._updateTransportUI();
        this._startUiLoop();
    }

    stop() {
        if (!this.player) { return; }
        try { this.player.stop(); } catch (e) { /* noop */ }
        const wasActive = this.isPlaying || this.isPaused;
        this.isPlaying = false;
        this.isPaused  = false;
        this._stopUiLoop();
        this._updateTransportUI();
        this._updatePositionUI();
        if (wasActive) { this._allNotesOff(); }
    }

    _allNotesOff() {
        if (this.prefs.destination === 'internal') {
            // Use the DHC panic to silence anything that came through.
            try { this.dhc.panic('soft'); } catch (e) { /* noop */ }
        } else {
            const access = this.midi.port.midiAccess;
            const port = access ? access.outputs.get(this.prefs.destination) : null;
            if (port) {
                for (let ch = 0; ch < 16; ch++) {
                    try { port.send([0xB0 | ch, 123, 0]); } catch (e) { /* noop */ }
                }
            }
        }
    }

    seek(ms) {
        if (!this.player) { return; }
        try {
            if (typeof this.player.jumpMS === 'function') {
                this.player.jumpMS(ms);
            } else if (typeof this.player.jump === 'function') {
                this.player.jump(ms);
            }
        } catch (e) { /* noop */ }
        this._updatePositionUI();
    }

    setSpeed(x) {
        if (!isFinite(x) || x <= 0) { x = 1.0; }
        this.prefs.speed = x;
        this._savePrefs();
        if (this.player) {
            try { this.player.speed(x); } catch (e) { /* noop */ }
        }
    }

    setLoop(on) {
        this.prefs.loop = !!on;
        this._savePrefs();
        if (this.player) {
            try { this.player.loop(!!on); } catch (e) { /* noop */ }
        }
    }

    _onEnd() {
        if (this.prefs.loop) {
            // JZZ will re-trigger; nothing to do here.
            return;
        }
        this.isPlaying = false;
        this.isPaused  = false;
        this._stopUiLoop();
        this._updateTransportUI();
        this._updatePositionUI();
        this._allNotesOff();
    }

    /* ===================================================================
     * MidiPorts callback
     * ================================================================ */

    /**
     * Called by `HUM.midi.MidiPorts` when the synthetic input-port checkbox
     * is toggled in the UI.
     * @param {boolean} enabled
     */
    setVirtualInputEnabled(enabled) {
        this.virtualInputEnabled = !!enabled;
    }

    /* ===================================================================
     * Logging
     * ================================================================ */

    _log(message) {
        try {
            this.dhc.harmonicarium.components.backendUtils.eventLog(message);
        } catch (e) {
            console.log(message);
        }
    }

    _logError(message) {
        this._log('MIDI Player: ' + message);
        console.warn('[MIDI Player]', message);
    }
};
