HUM.defaults = {
    harmonincarium: {
        dhcQty: 1,
        dpPad: true
    },
    synth: {    
        status: true,
        volumeMaster: 0.8,
        volumeFT: 0.8,
        volumeHT: 0.8,
        waveformFT: 'triangle',
        waveformHT: 'sine',
        attack: 0.3,
        decay: 0.15,
        sustain: 0.68,
        release: 0.3,
        portamento: 0.03,
        reverb: 0.5
    },
    hancock: {
        // The other params are overwritten automatically just after a Keymap is loaded
        width: 600,
        height: 80,
        velocity: 120,
        channel: 1
    },
    hstack: {
        fontSize: 20
    },
    keymap: {
        nEDx: 0,
        h_s: 0
    },
    midiports: {
        wmlOutPorts: 3
    },
    wmlout: {
        synthlist: 'adhocSynthList'
    },
    dhc: {
        DHCsettings
        piperMaxLenght: 5,
        piperPreQueue: [9, 10, 8, 4, 6]
    },
    midiout: {
        InstrumentSettings
    },
    dppad: {

    }
};