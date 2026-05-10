
/**
 * @fileoverview Parameters class for the Harmonicarium user management system.
 * This file defines the {@link HUM.User.prototype.Parameters|Parameters}
 * class, the container for all {@link HUM.Param} objects belonging to a
 * {@link HUM.User} instance (session rename, session display, concurrent
 * sessions display, preset selection, preset management, preset import/export,
 * and database reset). It is split out from the main {@link module:user} module.
 *
 * @module user-parameters
 * @memberof HUM.User
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
 * Container class for all {@link HUM.Param} objects belonging to a {@link HUM.User} instance.
 *
 * @class
 * @memberof HUM.User
 *
 * @description
 * Instantiates and holds the parameters that drive the User session and
 * preset management UI: session rename, current/concurrent session display,
 * preset selection and management (rename, delete), new preset creation,
 * preset import/export with optional reverb IR inclusion, and database reset.
 */
HUM.User.prototype.Parameters = class {
    /**
     * Creates a new Parameters instance for the given User component.
     *
     * @param {HUM.User} user - The User instance that owns this parameter set.
     *
     * @description
     * Instantiates all {@link HUM.Param} objects for the user management panel:
     * - `sessionRename`: Text input and button for renaming the current session.
     * - `sessionDisplayCurrent`: Read-only display of the current session.
     * - `sessionDisplayConcurrent`: Read-only display of sessions open in other tabs.
     * - `preset`: Dropdown and load button for selecting and loading a preset.
     * - `managePreset`: Rename and delete controls for existing presets.
     * - `newPreset`: Name input and save button for creating a new preset.
     * - `presetExport`: Export-to-JSON button with spinner feedback.
     * - `presetImportReverb`: Toggle for including reverb IR data on import.
     * - `presetExportReverb`: Toggle for including reverb IR data on export.
     * - `presetFile`: File picker and import controls for loading a preset JSON file.
     * - `resetDB`: Controls for wiping and resetting the IndexedDB database.
     */
    constructor(user) {
        this.app = user;

        this.sessionRename = new HUM.Param({
            app:user,
            idbKey:'userSessionRename',
            uiElements:{
                'user_session_newName': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'typing',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'text',
                }),
                'user_session_renameBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        // @todo: make a single transaction!!! (risk to rename just one)
                        //        transfer this to adhoc method in presetServiceDB
                        let nameInput = this.sessionRename.uiElements.in.user_session_newName;
                        // If it's NOT an empty string
                        if (this.sessionRename.value) {
                            this.app.presetServiceDB.getAllSessions()
                            .then(sessions => {
                                let sameName = sessions.find(session => session.name === this.sessionRename.value);
                                // If it's NOT unique
                                if (sameName) {
                                    nameInput.classList.add('is-invalid');
                                    return new Promise((resolve, reject)=>reject('There is already a session with the same name.'));
                                // If it's unique
                                } else {
                                    // Rename the session
                                    return this.app.presetServiceDB.updateSession({
                                        sessionID: this.app.session.id,
                                        name: this.sessionRename.value
                                    });
                                }
                            })
                            .then(() => {
                                // Rename the autosave preset
                                return this.app.presetServiceDB.updatePreset({
                                    presetID: this.app.session.id,
                                    description: `${this.app.presetServiceDB.defaults.AUTOSAVE.description} (session ${this.sessionRename.value})`,
                                });
                            })
                            .then(() => {
                                this.updatePresetsOnUI();
                                this.sessionRename.uiElements.in.user_session_newName.classList.remove('is-invalid');
                                this.app.harmonicarium.broadcastChannel.send('presetsChange');
                                this.app._revealThisSession();
                            })
                            .catch(error => {
                                console.error(`An error occurred while trying to rename this Session, "${this.app.session.id}": `, error);
                            });
                        // If it's an empty string
                        } else {
                            nameInput.classList.add('is-invalid');
                            console.error("The name of the session can't be an empty string.");
                        }
                    }
                }),
            },
            dataType:'string',
            initValue:'',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
        });

        this.sessionDisplayCurrent = new HUM.Param({
            app:user,
            idbKey:'userSessionDisplayCurrent',
            uiElements:{
                'user_session_current': new HUM.Param.UIelem({
                    role: 'out',
                    htmlTargetProp:'innerHTML',
                }),
            },
            dataType:'string',
            initValue:'CURRENT1',
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
        });

        this.sessionDisplayConcurrent = new HUM.Param({
            app:user,
            idbKey:'userSessionDisplayConcurrent',
            uiElements:{
                'user_session_concurrent': new HUM.Param.UIelem({
                    role: 'out',
                    htmlTargetProp:'innerHTML',
                    // uiSet
                }),
            },
            dataType:'string',
            initValue: new Set(),
            init:false,
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            preSet: (value, thisParam) => {
                if (value instanceof Set) {
                    return new Promise(async (resolve, reject) => {
                        let ulElem = document.createElement('ul');
                        for (let sessionID of value) {
                            let session,
                                liElem = document.createElement('li');
                            try {
                                session = await this.app.presetServiceDB.getSession(sessionID);
                            } catch (error) {
                                reject(error);
                            }
                            liElem.innerHTML = `<b>${session.name}</b> <small><i>(${sessionID})</i></small>`;
                            ulElem.appendChild(liElem);
                        }
                        resolve(ulElem);
                    })
                    .then(ulElem => {
                        thisParam.value = ulElem.innerHTML;
                    })
                    .catch(error => {
                        console.error(error);
                    });
                } else {
                    return value;
                }
            }
        });

        this.preset = new HUM.Param({
            app:user,
            idbKey:'userPreset',
            uiElements:{
                'user_preset_select': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                    eventListener: evt => {
                        if (this.preset.value === evt.target.value) {
                            this.preset.uiElements.in.user_preset_loadBtn.classList.add('d-none');
                        } else {
                            this.preset.uiElements.in.user_preset_loadBtn.classList.remove('d-none');
                        }
                    }
                }),
                'user_preset_loadBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.preset.valueUI = this.preset.uiElements.in.user_preset_select.value;
                    }
                }),
            },
            dataType:'string',
            initValue: 'default',
            init:false, // true if at the first change, the first thing is to put this to "autosave"
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            initAsync:true,
            preInit: async () => {
                await this.updatePresetsOnUI(); // get an array  of sorted preset objects
            },
            postSet: (value, thisParam, init) => {
                if (!init) {
                    this.app.loadPreset(value, false, true)
                    .catch(error => {
                        if (error === 'not-found') {
                            alert('Preset not found!');
                        }
                    });
                }
                if (value === thisParam.uiElements.in.user_preset_select.value) {
                    this.preset.uiElements.in.user_preset_loadBtn.classList.add('d-none');
                } else {
                    this.preset.uiElements.in.user_preset_loadBtn.classList.remove('d-none');
                }
                this.updatePresetsOnUI();
            }
        });

        this.managePreset = new HUM.Param({
            app:user,
            idbKey:'userManagePreset',
            uiElements:{
                'user_preset_renameBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.managePreset.currentAction = 'rename';
                        // Update the selectioon
                        this.updatePresetsOnUI();
                        this.managePreset.uiElements.in.user_managePreset_select.classList.remove('is-invalid');
                        this.managePreset.uiElements.out.user_managePreset_rename.classList.add('d-none');
                        this.managePreset.uiElements.in.user_managePreset_actionBtn.classList.add('d-none');

                        this.app.harmonicarium.components.backendUtils.parameters.dialogModal.value = {
                            // container,
                            // dialog,
                            // content,
                            // header,
                            hTitle: 'Rename Preset',
                            // hCancel: '',
                            body: this.managePreset.uiElements.out.user_managePreset_controls,
                            // footer,
                            fCancelTxt: 'Close',
                            // fCancel: '',
                            // fOK,
                            visible: true,
                            // reset
                        };
                    }
                }),
                'user_preset_deleteBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.managePreset.currentAction = 'delete';
                        // Update the selectioon
                        this.updatePresetsOnUI();
                        this.managePreset.uiElements.in.user_managePreset_select.classList.remove('is-invalid');
                        this.managePreset.uiElements.out.user_managePreset_rename.classList.add('d-none');
                        this.managePreset.uiElements.in.user_managePreset_actionBtn.classList.add('d-none');

                        this.app.harmonicarium.components.backendUtils.parameters.dialogModal.value = {
                            // container,
                            // dialog,
                            // content,
                            // header,
                            hTitle: 'Delete Preset',
                            // hCancel: '',
                            body: this.managePreset.uiElements.out.user_managePreset_controls,
                            // footer,
                            fCancelTxt: 'Close',
                            // fCancel: '',
                            // fOK,
                            visible: true,
                            // reset
                        };
                    }
                }),
                // MODAL DIALOG CONTROLS
                'user_managePreset_controls': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_toast': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_toastMsg': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_select': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'selection',
                    uiSet: null,
                    eventListener: evt => {
                        evt.target.classList.remove('is-invalid');
                        let uiElements = this.managePreset.uiElements;
                        if (evt.target.value) {
                            uiElements.in.user_managePreset_actionBtn.classList.remove('d-none');
                            if (this.managePreset.currentAction === 'rename') {
                                uiElements.out.user_managePreset_rename.classList.remove('d-none');
                                this.app.presetServiceDB.getPreset(evt.target.value)
                                .then(preset => {
                                    uiElements.in.user_managePreset_newName.value = preset.description;
                                    uiElements.in.user_managePreset_newName.classList.remove('is-invalid');
                                })
                                .catch(error => {
                                    console.error('An error occuurred while trying to read a preset on the database: ', error);
                                });
                                uiElements.in.user_managePreset_actionBtn.innerText = 'Rename the preset';
                           
                            } else if (this.managePreset.currentAction === 'delete') {
                                uiElements.out.user_managePreset_rename.classList.add('d-none');
                                uiElements.in.user_managePreset_actionBtn.innerText = 'Delete the preset';
                            }

                        } else {
                            uiElements.in.user_managePreset_actionBtn.classList.add('d-none');
                        }
                    }
                }),
                'user_managePreset_SelectValidation': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_newNameValidation': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_rename': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_managePreset_newName': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'typing',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    uiSet: null,
                    widget:'text',
                    eventListener: evt => {
                        let nameInput = this.managePreset.uiElements.in.user_managePreset_newName;
                        if (evt.target.value) {
                            nameInput.classList.remove('is-invalid');
                        } else {
                            let validationMsg = 'The name cannot be an empty string.';
                            this.managePreset.uiElements.out.user_managePreset_newNameValidation.innerText = validationMsg;
                            nameInput.classList.add('is-invalid');
                        }
                    }
                }),
                'user_managePreset_actionBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        let selection = this.managePreset.uiElements.in.user_managePreset_select,
                            presetID = selection.value;
                        if (presetID) {

                            // RENAME
                            if (this.managePreset.currentAction === 'rename') {
                                let nameInput = this.managePreset.uiElements.in.user_managePreset_newName,
                                    storedSessions;

                                // Read all sessions (and their current preset)
                                this.app.presetServiceDB.getAllSessions()
                                .then((sessions) => {
                                    storedSessions = sessions;
                                    if (nameInput.value) {
                                        return this.app.presetServiceDB.getAllPresets();
                                    } else {
                                        let validationMsg = 'The name cannot be an empty string.';
                                        this.managePreset.uiElements.out.user_managePreset_newNameValidation.innerText = validationMsg;
                                        nameInput.classList.add('is-invalid');
                                        return new Promise((resolve, reject)=>reject(validationMsg));
                                    }                                    
                                })
                                .then(presets => {
                                    let sameName = presets.find(preset => preset.description === nameInput.value);
                                    if (sameName) {
                                        let validationMsg = 'There is already a preset with the same name. Choose anothe name.';
                                        this.managePreset.uiElements.out.user_managePreset_newNameValidation.innerText = validationMsg;
                                        nameInput.classList.add('is-invalid');
                                        return new Promise((resolve, reject)=>reject(validationMsg));
                                    } else {
                                        // Current, default and autosave presets cannot be deleted
                                        let sessionIDs = storedSessions.map(s => s.sessionID); // === autosave presets
                                        if (['default', ...sessionIDs].includes(presetID)) {
                                            let validationMsg = 'You cannot rename the "Default" preset and the "Auto-save" preset of each session.';
                                            this.managePreset.uiElements.out.user_managePreset_SelectValidation.innerText = validationMsg;
                                            selection.classList.add('is-invalid');
                                            return new Promise((resolve, reject)=>reject(validationMsg));
                                        } else {
                                            nameInput.classList.remove('is-invalid');
                                            return this.app.presetServiceDB.updatePreset({
                                                presetID: presetID,
                                                description: nameInput.value,
                                            });
                                        }
                                    }
                                })
                                .then((result) => {
                                    console.log(`Preset ${presetID} successfully renamed.`);
                                    this.updatePresetsOnUI();
                                    // .then(() => { // avoid concurrent access? 
                                    this.app.harmonicarium.broadcastChannel.send('presetsChange');
                                    // })
                                    nameInput.value = '';

                                    // Show the toast
                                    let msg = `<p>Preset "<b>${result.oldDesc}</b>" has been renamed in "<b><i>${result.newDesc}</i></b>" (id: <small>${presetID}</small>).</p>`;
                                    this.managePreset.uiElements.out.user_managePreset_toastMsg.innerHTML = msg;
                                    this.managePreset.bsToast.show();
                                })
                                .catch(error => {
                                    console.error('An error was occurred when trying to rename the preset: ', error);
                                });

                            
                            // DELETE
                            } else if (this.managePreset.currentAction === 'delete') {
                                let deletingPreset = {};
                                // Read all sessions (and their current preset)
                                this.app.presetServiceDB.getAllSessions()
                                .then((sessions) => {
                                    // Current, default and autosave presets cannot be deleted
                                    let sessionIDs = sessions.map(s => s.sessionID), // === autosave presets
                                        // Get the used preset only for the concurrent sessions
                                        usedPresetIDs = sessions
                                            .filter(s => this.app.session.concurrentSessions.has(s.sessionID) || s.sessionID === this.app.session.id)
                                            .map(s => s.currentPreset);
                                    if (['default', ...sessionIDs, ...usedPresetIDs]
                                        .includes(presetID)) {
                                        let validationMsg = 'You cannot delete the "Default" preset, the "Auto-save" preset of each session and any preset loaded by this session and the concurrent ones.';
                                        this.managePreset.uiElements.out.user_managePreset_SelectValidation.innerText = validationMsg;
                                        selection.classList.add('is-invalid');
                                        return new Promise((resolve, reject)=>reject('You cannot delete the current, "Default" or "Auto-save" preset.'));
                                    } else {
                                        selection.classList.remove('is-invalid');
                                        return this.app.presetServiceDB.getPreset(presetID);
                                    }
                                })
                                .then((result) => {
                                    deletingPreset = result;
                                    return this.app.presetServiceDB.deletePresetParams(presetID);
                                })
                                .then(() => {
                                    console.log(`Preset ${presetID} successfully deleted.`);
                                    this.updatePresetsOnUI();
                                    // .then(() => { // avoid concurrent access? 
                                    this.app.harmonicarium.broadcastChannel.send('presetsChange');
                                    // })

                                    // Show the toast
                                    let msg = `<p>Preset "<b>${deletingPreset.description}</b>" (id: <small>${presetID}</small>) has been deleted.</p>`;
                                    this.managePreset.uiElements.out.user_managePreset_toastMsg.innerHTML = msg;
                                    this.managePreset.bsToast.show();
                                })
                                .catch(error => {
                                    console.error('An error was occurred when trying to delete the preset: ', error);
                                });

                            }
                        } else {
                            // error
                        }
                    }
                }),
            },
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.bsToast = new bootstrap.Toast(thisParam.uiElements.out.user_managePreset_toast, {
                    animation: true,
                    autohide: false,
                    // delay: 3000,
                });
            },
            customProperties: {
                currentAction: false
            }
        });

        this.newPreset = new HUM.Param({
            app:user,
            idbKey:'userNewPreset',
            uiElements:{
                'user_preset_new': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_newName': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'typing',
                    eventType: 'change',
                    htmlTargetProp:'value',
                    widget:'text',
                }),
                'user_preset_saveBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.app.saveNewPreset(this.newPreset.value)
                        .then(() => {
                            this.newPreset.uiElements.in.user_preset_newName.classList.remove('is-invalid');
                        })
                        .catch(errMsg => {
                            if (errMsg === 'invalid') {
                                this.newPreset.uiElements.in.user_preset_newName.classList.add('is-invalid');
                            } else {
                                // ... needed other messages?
                            }
                        });
                    }
                }),
            },
            dataType:'string',
            initValue: this.app.DEFAULT_PRESET_NAME,
            // init:false, // true if at the first change, the first thing is to put this to "autosave"
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            // preSet: (value) => {
            //     if (!value) {
            //         value = '**ERROR**';
            //         this.newPreset.uiElements.in.user_preset_newName.classList.add('is-invalid');
            //     } else {
            //         this.newPreset.uiElements.in.user_preset_newName.classList.remove('is-invalid');
            //     }
            //     return value;
            // },
        });

        this.presetExport = new HUM.Param({
            app:user,
            idbKey:'userExportPreset',
            uiElements:{
                'user_preset_exportBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.app.exportPresets();
                    }
                }),
                'user_preset_exportBtnSpinner': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            // init:false,
        });

        this.presetImportReverb = new HUM.Param({
            app:user,
            idbKey:'userPresetImportReverb',
            uiElements:{
                'user_preset_importReverb': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'toggle',
                    eventType: 'click',
                    htmlTargetProp:'checked',
                    widget:'checkbox',
                }),
            },
            dataType:'boolean',
            initValue:true,
        });

        this.presetExportReverb = new HUM.Param({
            app:user,
            idbKey:'userPresetExportReverb',
            uiElements:{
                'user_preset_exportReverb': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'toggle',
                    eventType: 'click',
                    htmlTargetProp:'checked',
                    widget:'checkbox',

                }),
            },
            dataType:'boolean',
            initValue:true,
        });


        this.presetFile = new HUM.Param({
            app:user,
            idbKey:'userImportPreset',
            uiElements:{
                'user_preset_importFile': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'set',
                    eventType: 'change',
                    htmlTargetProp:'files',
                    widget:'file',
                    eventListener: evt => {
                        // Check for the various File API support.
                        if (window.File && window.FileReader && window.FileList && window.Blob) {
                            // Access to the file and send it to read function
                            this.presetFile.valueUI = evt.target.files[0];
                        } else {
                            alert('The File APIs are not fully supported in this browser.');
                        }
                    }
                }),
                'user_preset_import_options': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_importBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        if (this.presetFile.selectedPresets.size > 0) {
                            // this.presetFile.bsPopover.hide();
                            this.app.importPresets()
                            .then((results) => {
                                // Update the selectioon
                                this.updatePresetsOnUI();

                                // Show the toast
                                let msg = '';
                                for (let preset of results) {
                                    msg += `<p>Imported preset "<b>${preset.oldDesc}</b>" (id: <small>${preset.oldID}</small>) with the new name "<b><i>${preset.newDesc}</i></b>" (id: <small>${preset.newID}</small>).</p>`;
                                }
                                this.presetFile.uiElements.out.user_preset_import_toastMsg.innerHTML = msg;
                                this.presetFile.bsToast.show();
                            })
                            .catch(error => {
                                console.error('Import failed: ', error);
                            });
                        } else {
                            // error or invalid
                        }
                    }
                }),
                'user_preset_import_checks': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_clearBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.presetFile.value = false;
                    }
                }),
                'user_preset_import_toast': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_preset_import_toastMsg': new HUM.Param.UIelem({
                    role: 'out',
                }),
            },
            dataType:'file',
            initValue: false,
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.bsPopover = new bootstrap.Popover(thisParam.uiElements.in.user_preset_importBtn, {
                    title: 'Sorry',
                    content: 'You have to select at least one preset from the checkboxes above.',
                    trigger: 'hover focus',
                    placement: 'left',
                    customClass: 'hum-custom-popover'
                });
                thisParam.bsToast = new bootstrap.Toast(thisParam.uiElements.out.user_preset_import_toast, {
                    animation: true,
                    autohide: false,
                    // delay: 3000,
                });
            },
            postSet: (value, thisParam, init) => {
                let options = thisParam.uiElements.out.user_preset_import_options,
                    file = thisParam.uiElements.in.user_preset_importFile,
                    checkboxes = thisParam.uiElements.out.user_preset_import_checks;
                if (value) {
                    this.app.readPresetFile(value);
                    options.classList.remove('d-none');
                } else {
                    // Remove the checkbox and the import button
                    options.classList.add('d-none');
                    // Empty everything
                    file.value = '';
                    if (!init) {
                        this.presetFile.selectedPresets = new Set();
                        this.presetFile.importedPresets = {};
                    }
                    HUM.BackendUtils.emptyHTMLElement(checkboxes);
                }
            },
            customProperties: {
                selectedPresets: new Set(),
                importedPresets: {},
                importReverb: {},
            }
        });

        this.resetDB = new HUM.Param({
            app:user,
            idbKey:'userResetDB',
            uiElements:{
                'user_resetDB_openBtn': new HUM.Param.UIelem({
                    role: 'fn',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        this.app.harmonicarium.components.backendUtils.parameters.dialogModal.value = {
                            // container,
                            // dialog,
                            // content,
                            // header,
                            hTitle: 'Reset DB',
                            // hCancel: '',
                            body: this.resetDB.uiElements.out.user_resetDB_controls,
                            // footer,
                            fCancelTxt: 'Close',
                            // fCancel: '',
                            // fOKTxt: '',
                            // fOK,
                            visible: true,
                            // reset
                        };
                    }
                }),
                'user_resetDB_controls': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_resetDB_toast': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_resetDB_toastMsg': new HUM.Param.UIelem({
                    role: 'out',
                }),
                'user_resetDB_confirmBtn': new HUM.Param.UIelem({
                    role: 'in',
                    opType:'run',
                    eventType: 'click',
                    widget:'button',
                    eventListener: evt => {
                        if (window.confirm('Are you really, really sure?')) {
                            console.group(`Trying to delete the database "${this.app.dbName}"...`);
                            // let msgData = 'Another session is trying to delete the database.\n' +
                            //      'You must close this session to allow the database to be deleted.\n\n' +
                            //      'Click "OK" to close this tab/window or "Cancel" to postpone the deletion.\n\n' +
                            //      'The database will be deleted after all the sessions will be closed.';
                            
                            // Delete the DB
                            this.app.presetServiceDB._closeDB();
                            this.app.harmonicarium.broadcastChannel.unregisterCommand('releaseSession');
                            console.log('Send broadcast message to ask closing all the concurrent sessions.');
                            this.app.harmonicarium.broadcastChannel.send('closeApp'); // , msgData);
                            setTimeout(() => {
                                this.app.presetServiceDB._deleteDatabase(this.app.dbName)
                                .then(() => {
                                    console.groupEnd();
                                    console.log(`The database "${this.app.dbName}" has been deleted.`);
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.remove('bg-danger');
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.add('bg-success');
                                    this.resetDB.uiElements.out.user_resetDB_toastMsg.innerHTML = 'The database has been successfully deleted.';
                                    this.resetDB.bsToast.show();
                                    console.log('Reloading the app...');
                                    setTimeout(() => window.location.reload(), 1500);
                                    // setTimeout(() => window.close(), 1500);
                                    // @todo: show a spinner on splashscreen and a text
                                    //        saying "close all other concurrent sessions!"
                                })
                                .catch(error => {
                                    console.error(error);
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.remove('bg-success');
                                    this.resetDB.uiElements.out.user_resetDB_toast.children[0].classList.add('bg-danger');
                                    this.resetDB.uiElements.out.user_resetDB_toastMsg.innerHTML = 'An error occurred while trying to delete the database.';
                                    this.resetDB.bsToast.show();
                                });
                            }, 2000);

                        }
                    }
                }),
            },
            presetStore:false,
            presetAutosave:false,
            presetRestore:false,
            postInit: (thisParam) => {
                thisParam.bsToast = new bootstrap.Toast(thisParam.uiElements.out.user_resetDB_toast, {
                    animation: true,
                    autohide: false,
                    // delay: 3000,
                });
            },
        });


    }
    async updatePresetsOnUI() {
        if (this.app.presetServiceDB.available) {
            let results = await this.preset.app.presetServiceDB.getAllPresets(),
                htmlElems = [
                    this.preset.uiElements.in.user_preset_select,
                    this.managePreset.uiElements.in.user_managePreset_select,
                ];
            // Sort the presets alphabetically
            results.sort((a, b) => {
                let strA = a.description.toLowerCase();
                let strB = b.description.toLowerCase();
                return (strA < strB) ? -1 : (strA > strB) ? 1 : 0;
            });
            for (let htmlElem of htmlElems) {
                // Delete pre-existing options
                while (htmlElem.firstChild) {
                    htmlElem.removeChild(htmlElem.firstChild);
                }

                // Create the placeholder hidden option
                let option = document.createElement("option");
                option.text = 'Choose a preset';
                option.disabled = true;
                option.selected = true;
                option.hidden = true;
                htmlElem.add(option);

                // Create one option for each stored preset
                for (const preset of results) {
                    let option = document.createElement("option");
                    option.value = preset.presetID;
                    option.text = preset.description;
                    if (preset.presetID === this.preset.value) {
                        option.text += ' (*)';  
                    }
                    htmlElem.add(option);
                }
                // @todo: better a standard callback provided by parameter
                // this.parameters.preset._objValueModified();
            }
            // Reselect the current preset only on the main preset selector
            if (this.preset.value) {
                this.preset.uiElements.in.user_preset_select.value = this.preset.value;
                this.preset.uiElements.in.user_preset_loadBtn.classList.add('d-none');
            }
        } else {
            alert('IndexedDB service not available!');
        }
    }
    async _init() {
        console.group('USER APP - Initializing Presets management parameters...');
        this.sessionDisplayConcurrent._init();
        await this.preset._initAsync();
        this.newPreset._init();
        console.groupEnd();
        console.log('USER APP - Presets management parameters initialized.');

    }
};

// paramMapLive, paramMapFile:
// 
//         // harmonicarium1_mainDev = {
//         //     'default': {
//         //         harmonicarium: {},
//         //         dpPad: {
//         //             dpPad: {},
//         //             padSet: {
//         //                 0: {}
//         //                 1: {}
//         //                 2: {}
//         //                 // ...
//         //             }
//         //         },
//         //         dhc: {
//         //             0: {
//         //                 dhc: {},
//         //                 hstack: {},
//         //                 synth: {},
//         //                 midi: {},
//         //                 hancock: {},
//         //             }
//         //             1: {}
//         //             2: {}
//         //             // ...
//         //         }
//         //         backendUtils: {},
//         //         pwaManager: {},
//         //     },
//         // }