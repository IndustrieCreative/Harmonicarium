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

"use strict";

HUM.tmpl = {
    // parser: new DOMParser(),
    // arguments (id, cl=false, label=false, title=false, help=false)

    appContainer(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="harmonicarium${id}" class="appContainer">

            </div>`;
        return template.firstElementChild;
    },

    dpPadPage(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLf_dpPad${id}" class="dpPadPage">

            </div>`;
        return template.firstElementChild;
    },

    dpIcons(id) {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS('http://www.w3.org/2000/svg', 'id', `HTMLf_dpToolbarIcons${id}`);
        svg.style.display = 'none';

        let icons = {
            menu: {
                d: "M512.5 390.6c-29.9 0-57.9 11.6-79.1 32.8c-21.1 21.2-32.8 49.2-32.8 79.1c0 29.9 11.7 57.9 32.8 79.1c21.2 21.1 49.2 32.8 79.1 32.8c29.9 0 57.9-11.7 79.1-32.8c21.1-21.2 32.8-49.2 32.8-79.1c0-29.9-11.7-57.9-32.8-79.1a110.96 110.96 0 0 0-79.1-32.8zm412.3 235.5l-65.4-55.9c3.1-19 4.7-38.4 4.7-57.7s-1.6-38.8-4.7-57.7l65.4-55.9a32.03 32.03 0 0 0 9.3-35.2l-.9-2.6a442.5 442.5 0 0 0-79.6-137.7l-1.8-2.1a32.12 32.12 0 0 0-35.1-9.5l-81.2 28.9c-30-24.6-63.4-44-99.6-57.5l-15.7-84.9a32.05 32.05 0 0 0-25.8-25.7l-2.7-.5c-52-9.4-106.8-9.4-158.8 0l-2.7.5a32.05 32.05 0 0 0-25.8 25.7l-15.8 85.3a353.44 353.44 0 0 0-98.9 57.3l-81.8-29.1a32 32 0 0 0-35.1 9.5l-1.8 2.1a445.93 445.93 0 0 0-79.6 137.7l-.9 2.6c-4.5 12.5-.8 26.5 9.3 35.2l66.2 56.5c-3.1 18.8-4.6 38-4.6 57c0 19.2 1.5 38.4 4.6 57l-66 56.5a32.03 32.03 0 0 0-9.3 35.2l.9 2.6c18.1 50.3 44.8 96.8 79.6 137.7l1.8 2.1a32.12 32.12 0 0 0 35.1 9.5l81.8-29.1c29.8 24.5 63 43.9 98.9 57.3l15.8 85.3a32.05 32.05 0 0 0 25.8 25.7l2.7.5a448.27 448.27 0 0 0 158.8 0l2.7-.5a32.05 32.05 0 0 0 25.8-25.7l15.7-84.9c36.2-13.6 69.6-32.9 99.6-57.5l81.2 28.9a32 32 0 0 0 35.1-9.5l1.8-2.1c34.8-41.1 61.5-87.4 79.6-137.7l.9-2.6c4.3-12.4.6-26.3-9.5-35zm-412.3 52.2c-97.1 0-175.8-78.7-175.8-175.8s78.7-175.8 175.8-175.8s175.8 78.7 175.8 175.8s-78.7 175.8-175.8 175.8z",
                viewBox: "0 0 1024 1024"
            },
            rotateView: {
                d: "M 19.5 9.5 L 22.5 9.5 L 18.5 13.5 L 14.5 9.5 L 17.5 9.5 C 17.5 6.186 14.814 3.5 11.5 3.5 L 10.5 3.58 L 10.5 1.56 L 11.5 1.5 C 15.918 1.5 19.5 5.082 19.5 9.5 M 21.5 16.5 L 21.5 19.5 C 21.5 20.605 20.605 21.5 19.5 21.5 L 3.5 21.5 C 2.395 21.5 1.5 20.605 1.5 19.5 L 1.5 16.5 C 1.5 15.395 2.395 14.5 3.5 14.5 L 19.5 14.5 C 20.605 14.5 21.5 15.395 21.5 16.5 M 8.5 3.5 L 8.5 12.5 L 1.5 12.5 L 1.5 3.5 C 1.5 2.395 2.395 1.5 3.5 1.5 L 6.5 1.5 C 7.605 1.5 8.5 2.395 8.5 3.5 Z",
                viewBox: "0 0 24 24"
            },
            piper: {
                d: "M45.971 44.396c0-1.994-3.638-7.567-3.638-7.567s-3.693 5.573-3.693 7.567c0 1.99 1.642 3.604 3.666 3.604c2.023 0 3.665-1.614 3.665-3.604zM19.666 13.171h-7.331V5.944h1.999V2H1v3.944h2v11.17c0 2.904 2.388 5.257 5.333 5.257h11.333v1.972h4.001V11.201h-4.001v1.97zm27.332 16.428v-11.17c0-2.903-2.387-5.257-5.329-5.257H30.334v-1.97h-4.001v13.143h4.001v-1.973h7.332v7.227h-1.997v3.944H49v-3.944h-2.002z",
                viewBox: "0 0 50 50"
            },
            textIncrease: {
                d: "M 10.5 16.494 L 8.092 9.27 L 5.91 9.27 L 3 17.995 L 4.968 17.995 L 5.537 16.068 L 8.503 16.068 L 9.146 17.995 L 9.999 17.995 L 9.997 18 L 12.704 18 L 13.486 15.35 L 17.566 15.35 L 18.45 18 L 21 18 L 17 6 L 14 6 L 10.5 16.494 Z M 17 13 L 14 13 L 15.504 9 L 17 13 Z M 8.092 14.36 L 5.91 14.36 L 7.004 11.451 L 8.092 14.36 Z",
                viewBox: "0 0 24 24"
            },
            textDecrease: {
                d: "M13.5 16.494l2.408-7.224h2.182L21 17.995h-1.968l-.569-1.927h-2.966l-.643 1.927h-.853l.002.005h-2.707l-.782-2.65h-4.08L5.55 18H3L7 6h3l3.5 10.494zM7 13h3L8.496 9L7 13zm8.908 1.36h2.182l-1.094-2.909l-1.088 2.909z",
                viewBox: "0 0 24 24"
            },
            rotateFT: {
                d: "M 16.48 2.52 C 19.75 4.07 22.09 7.24 22.45 11 L 23.95 11 C 23.44 4.84 18.29 0 12 0 L 11.34 0.03 L 15.15 3.84 L 16.48 2.52 Z M 10.23 1.75 C 9.647 1.16 8.693 1.16 8.11 1.75 L 1.75 8.11 C 1.16 8.693 1.16 9.647 1.75 10.23 L 13.77 22.25 C 14.36 22.84 15.31 22.84 15.89 22.25 L 22.25 15.89 C 22.84 15.3 22.84 14.35 22.25 13.77 L 10.23 1.75 Z M 14.83 21.19 L 2.81 9.17 L 9.17 2.81 L 21.19 14.83 L 14.83 21.19 Z M 7.52 21.48 C 4.174 19.904 1.905 16.682 1.55 13 L 0.05 13 C 0.56 19.16 5.71 24 12 24 L 12.66 23.97 L 8.85 20.16 L 7.52 21.48 Z M 11.6 10.383 L 9.06 10.383 L 9.06 11.873 L 11.52 11.873 L 11.52 12.653 L 9.06 12.653 L 9.06 14.423 L 8.05 14.423 L 8.05 9.603 L 11.6 9.603 L 11.6 10.383 Z M 16.056 10.383 L 14.496 10.383 L 14.496 14.423 L 13.486 14.423 L 13.486 10.383 L 11.936 10.383 L 11.936 9.603 L 16.056 9.603 L 16.056 10.383 Z",
                viewBox: "0 0 24 24"
            },
            rotateHT: {
                d: "M 11.797 14.423 L 10.883 14.423 L 10.883 12.363 L 8.963 12.363 L 8.963 14.423 L 8.039 14.423 L 8.039 9.603 L 8.963 9.603 L 8.963 11.523 L 10.883 11.523 L 10.883 9.603 L 11.797 9.603 L 11.797 14.423 Z M 16.071 10.383 L 14.645 10.383 L 14.645 14.423 L 13.722 14.423 L 13.722 10.383 L 12.304 10.383 L 12.304 9.603 L 16.071 9.603 L 16.071 10.383 Z M 16.48 2.52 C 19.75 4.07 22.09 7.24 22.45 11 L 23.95 11 C 23.44 4.84 18.29 0 12 0 L 11.34 0.03 L 15.15 3.84 L 16.48 2.52 Z M 10.23 1.75 C 9.647 1.16 8.693 1.16 8.11 1.75 L 1.75 8.11 C 1.16 8.693 1.16 9.647 1.75 10.23 L 13.77 22.25 C 14.36 22.84 15.31 22.84 15.89 22.25 L 22.25 15.89 C 22.84 15.3 22.84 14.35 22.25 13.77 L 10.23 1.75 Z M 14.83 21.19 L 2.81 9.17 L 9.17 2.81 L 21.19 14.83 L 14.83 21.19 Z M 7.52 21.48 C 4.174 19.904 1.905 16.682 1.55 13 L 0.05 13 C 0.56 19.16 5.71 24 12 24 L 12.66 23.97 L 8.85 20.16 L 7.52 21.48 Z",
                viewBox: "0 0 24 24"
            },
            invertPads: {
                d: "M 21.71 9.29 L 17.71 5.29 C 17.163 4.743 16.23 4.994 16.03 5.74 C 15.937 6.087 16.036 6.456 16.29 6.71 L 18.59 9 L 7 9 C 6.23 9 5.749 9.833 6.134 10.5 C 6.313 10.809 6.643 11 7 11 L 21 11 C 21.404 10.998 21.767 10.753 21.92 10.38 C 22.077 10.008 21.994 9.578 21.71 9.29 Z M 17 13 L 3 13 C 2.596 13.002 2.233 13.247 2.08 13.62 C 1.923 13.992 2.006 14.422 2.29 14.71 L 6.29 18.71 C 6.681 19.104 7.319 19.104 7.71 18.71 C 8.104 18.319 8.104 17.681 7.71 17.29 L 5.41 15 L 17 15 C 17.77 15 18.251 14.167 17.866 13.5 C 17.687 13.191 17.357 13 17 13 Z M 10.545 4.44 L 8.005 4.44 L 8.005 5.93 L 10.465 5.93 L 10.465 6.71 L 8.005 6.71 L 8.005 8.48 L 6.995 8.48 L 6.995 3.66 L 10.545 3.66 L 10.545 4.44 Z M 15.001 4.44 L 13.441 4.44 L 13.441 8.48 L 12.431000000000001 8.48 L 12.431000000000001 4.44 L 10.881 4.44 L 10.881 3.66 L 15.001 3.66 L 15.001 4.44 Z M 13.268 20.467 L 12.268 20.467 L 12.268 18.407 L 10.168 18.407 L 10.168 20.467 L 9.158 20.467 L 9.158 15.647 L 10.168 15.647 L 10.168 17.567 L 12.268 17.567 L 12.268 15.647 L 13.268 15.647 L 13.268 20.467 Z M 17.943 16.427 L 16.383 16.427 L 16.383 20.467 L 15.373 20.467 L 15.373 16.427 L 13.823 16.427 L 13.823 15.647 L 17.943 15.647 L 17.943 16.427 Z",
                viewBox: "0 0 24 24"
            },
            openLog: {
                d: "M18 7c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4h-2v4h-2V9h4V7h-4M2 7v10h6v-2H4V7H2m9 0c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-2m0 2h2v6h-2V9z",
                viewBox: "0 0 24 24"
            },
            panic: {
                d: "M11 15h2v2h-2v-2m0-8h2v6h-2V7m1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8z",
                viewBox: "0 0 24 24"
            },
            toolbarPos: {
                d: "M 20.141 19.781 L 3.861 19.781 C 3.165 19.781 2.73 20.537 3.078 21.142 C 3.239 21.423000000000002 3.537 21.596 3.861 21.596 L 20.141 21.596 C 20.837 21.596 21.272 20.84 20.924 20.235 C 20.763 19.954 20.465 19.781 20.141 19.781 Z M 20.14 2.404 L 3.8600000000000003 2.404 C 3.164 2.404 2.729 3.16 3.077 3.765 C 3.238 4.046 3.536 4.219 3.8600000000000003 4.219 L 20.14 4.219 C 20.836 4.219 21.271 3.463 20.923000000000002 2.858 C 20.762 2.577 20.464 2.404 20.14 2.404 Z M 5.128 16.923000000000002 L 5.128 7.077 C 5.128 6.654 4.375 6.392 3.771 6.602 C 3.492 6.7 3.32 6.881 3.32 7.077 L 3.32 16.923000000000002 C 3.32 17.346 4.073 17.608 4.676 17.398 C 4.955 17.3 5.128 17.119 5.128 16.923000000000002 Z M 12.904 16.923000000000002 L 12.904 7.077 C 12.904 6.654 12.151 6.392 11.548 6.602 C 11.269 6.7 11.096 6.881 11.096 7.077 L 11.096 16.923000000000002 C 11.096 17.346 11.849 17.608 12.452 17.398 C 12.731 17.3 12.904 17.119 12.904 16.923000000000002 Z M 18.87 7.077 L 18.87 16.923000000000002 C 18.87 17.346 19.623 17.608 20.227 17.398 C 20.506 17.3 20.679 17.119 20.679 16.923000000000002 L 20.679 7.077 C 20.679 6.654 19.926 6.392 19.323 6.602 C 19.043 6.7 18.87 6.881 18.87 7.077 Z",
                viewBox: "0 0 24 24"
            },
            midi: {
                d: "M21.775 7.517H24v8.966h-2.225zm-8.562 0h6.506c.66 0 1.045.57 1.045 1.247v6.607c0 .84-.35 1.112-1.112 1.112h-6.439v-5.696h2.225v3.505h3.135V9.54h-5.36zm-3.235 0h2.19v8.966h-2.19zM0 7.517h7.854c.66 0 1.045.57 1.045 1.247v7.72H6.708v-6.71H5.427v6.708H3.438V9.775H2.191v6.708H0z",
                viewBox: "0 0 24 24"
            },
            closeCross: {
                d: "M 19.865 4.419 C 20.567 5.122 20.567 6.262 19.865 6.962 L 14.505 12.321 L 19.314 17.129 C 20.294 18.109 19.846 19.781 18.509 20.139 C 17.889 20.306 17.226 20.127 16.77 19.673 L 11.962 14.862 L 7.153 19.673 C 6.176 20.653 4.503 20.205 4.145 18.868 C 3.978 18.248 4.157 17.585 4.609 17.129 L 9.42 12.321 L 4.059 6.962 C 3.082 5.983 3.529 4.312 4.869 3.954 C 5.489 3.788 6.152 3.964 6.605 4.419 L 11.962 9.781 L 17.321 4.421 C 18.024 3.718 19.164 3.718 19.865 4.421 Z",
                viewBox: "0 0 24 24"
            },
            leftArrow: {
                d: "M 11.868 17.133 L 9.327 19.675 L 1.698 12.048 L 9.325 4.421 L 11.867 6.965 L 8.583 10.25 L 22.132 10.25 L 22.132 13.845 L 8.583 13.845 L 11.868 17.133 Z",
                viewBox: "0 0 24 24"
            },
        };

        for (const name of Object.keys(icons)) {
            let symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol'),
                path = document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                boundingRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            symbol.setAttributeNS(null, 'id', `dpIcon-${name}${id}`);
            symbol.setAttributeNS(null, 'viewBox', icons[name].viewBox);
            boundingRect.setAttributeNS(null, 'width', '100%');
            boundingRect.setAttributeNS(null, 'height', '100%');
            boundingRect.setAttributeNS(null, 'fill', 'transparent');
            path.setAttributeNS(null, 'd', icons[name].d);
            
            symbol.appendChild(path);
            symbol.appendChild(boundingRect);
            svg.appendChild(symbol);
        }

        return svg;
    },

    useIcon(iconName, id, svg, x, y) {
        let use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        svg.appendChild(use);

        use.setAttributeNS(null, 'href', `#dpIcon-${iconName}${id}`);
        use.setAttributeNS(null, 'x', x);
        use.setAttributeNS(null, 'y', y);
        use.setAttributeNS(null, 'fill', '#c5c5c5');
        use.setAttributeNS(null, 'class', `dpToolbarIcon dpIcon-${iconName}`);
        use.dpIcon = iconName;
        
        return use;
    },

    logTextBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLf_logPanel${id}" class="panelOverlay bottomPanel">
                <div id="HTMLf_openLogBtn${id}" class="panelBtnContainer">
                    <div class="panelBtnBar1"></div>
                    <div class="panelBtnBar2"></div>
                    <div class="panelBtnBar3"></div>
                </div>
                <div class="panelOverlay_content">
                    <h1>Events Log</h1>
                    <button type="button" id="HTMLf_logTest${id}" style="margin-bottom: 10px; position: absolute; right: 20px; top: 80px;">TEST</button>
                    <div class="logText" id="HTMLo_logText${id}"></div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    sidePanel(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLf_sidePanel${id}" class="panelOverlay rightPanel">

            </div>`;
        return template.firstElementChild;
    },

    // - - - - - - - - - - - - - - - - - - - - 

    logoBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="sideTopBar" id="HTML_logo${id}">
                <svg id="HTMLf_closeSidePanel${id}" class="panelBtnContainer" viewBox="0 0 60 24" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                </svg> 
                <div class="logoContainer">
                    <img src="assets/img/logo.png" alt="The Harmonicarium logo">
                    <div class="menuContainer">
                        <span class="menuElement" id="HTMLf_openHelp${id}">HELP</span> &nbsp;&ndash; &nbsp;
                        <span class="menuElement" id="HTMLf_openCredits${id}">Credits</span> &nbsp;&ndash; &nbsp;
                        <span class="menuElement" id="HTMLf_openApp${id}">APP</span> &nbsp;&ndash; &nbsp;
                        <span class="menuElement"><a href="https://github.com/IndustrieCreative/Harmonicarium" target="_blank">Source code</a></span>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    sideContents(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLf_sidePanel_content${id}" class="panelOverlay_content">

            </div>`;
        return template.firstElementChild;
    },

    // - - - - - - - - - - - - - - - - - - - - 

    sideMenu(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTML_side_menu${id}" class="sideMenu">
                
                <div id="HTMLf_settingsObj${id}" class="settingsContainer"></div>
                
                <div id="HTMLf_helpObj${id}" class="help">
                    <h1>Short Help</h1>
                    <h2>This program currently under development.</h2>
                    <h3>Tested only in Chromium (Google Chrome) browsers. With Opera it seems to work as well, but untested.</h3>
                    <p>Since this program is still in beta, I cannot write an exhaustive guide at the moment. The functioning in a few words is as follows.</p>
                    <h3>OVERVIEW</h3>
                    <p>You have two pads (or keyboard layers):</p>
                    <ul>
                        <li>Fundamental Tones (FT): the<span class="monospace"> red pad</span>.</li>
                        <li>Harmonic Tones (HT): the<span class="monospace"> blue pad</span>.</li>
                    </ul>
                    <p>You can play the Harmonic Series on the blue pad.</p>
                    <p>You can change their fundamental by pressing  key onn the red pad; the harmonics on blue pad are instantly recalculated.</p>

                    <p>The program starts with the Harmonic Series of a <span class="monospace">C3</span> (<span class="monospace">130.81Hz</span>). This is the Fundamental Mother</p>
                    <h3>KEYMAPS</h3>
                    <p>If you want to use an external MIDI keyboard to play this app, you can also choice the position of the FTs and HTs on the keyboard. Under the Piano Keymap” tab in the Settings panel you can select one of the preset keymaps or create your own one.</p>
                    <p>In the  <a href="https://github.com/IndustrieCreative/Harmonicarium/tree/master/keymaps/_mapping-tools" target="_blank">/keymaps/_mapping-tools/</a> folder there is the "<a href="https://github.com/IndustrieCreative/Harmonicarium/raw/master/keymaps/_mapping-tools/keymapping-tool.xlsx" target="_blank">keymapping-tool.xlsx</a>" that can be used to generate keymaps. Other maps can be found on the <a href="https://github.com/IndustrieCreative/Harmonicarium/tree/master/keymaps/n-edx" target="_blank">/keymaps/n-edx/</a> .</p>
                    <p>You can also <a href="https://github.com/IndustrieCreative/Harmonicarium/zipball/master" target="_blank">download the "offline" app</a>.</p>
                    <h3>FUNDAMENTAL TONES</h3>
                    <p>The FT are like a palette of frequencies available to generate harmonics. The default FT are <span class="monospace">12</span> tone equally tempered (<span class="monospace">12-TET</span> or <span class="monospace">12-EDO</span>). In the Fundamental Tones box you can edit the FT tuning by choosing between equal temperaments and harmonics/subharmonics tones.</p>
                    <p>Since at the moment I'm writing documentation on the <a href="http://harmonicarium.org/" target="_blank">project site</a> and many options are the same of the old Harmonync, you can read <a href="http://harmonync.harmonicarium.org" target="_blank">the old site project</a> to better understand the purpose and the functioning of this program.</p>
                </div>
                
                <div id="HTMLf_creditsObj${id}" class="credits">
                    <h1>Credits</h1>
                    <img src="assets/img/agpl.png">
                    <h2>License</h2>
                    <h3 style="margin-bottom: 0;">Harmonicarium</h2>
                    <p style="margin-top: 0; margin-bottom: 0;">a Dynamic Harmonics Calculator</p>
                    <p style="margin-top: 0;"><span class="monospace">ver. 0.7.0 (Kepler)</span></p>
                    <h3>Copyright (C) 2017-2022 by Walter Mantovani</h3>
                    <p>This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>
                    <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.</p>
                    <p>You should have received a copy of the GNU Affero General Public License along with this program. If not, see <a href="https://www.gnu.org/licenses/agpl.txt" target="_blank">http://www.gnu.org/licenses/</a>.</p>
                    <p>armonici.it [at] gmail [dot] com</p>
                    <h2>Acknowledgements</h2>
                    <p>Thanks to the Internet Global Community.</p>
                    <p>For their support and the long talks about sound, music and ICT, a special thanks goes to:</p>
                    <ul>
                        <li>Stefano Bersanetti (Sound & electrical engineer – Euterpe Synthesizer Laboratories)</li>
                        <li>Giovanni Bortoluzzi (Overtone singer – Sherden Overtone Singing School)</li>
                        <li>Alberto Ezzu (Musicoterapist)</li>
                        <li>Marco Groppo (Software developer)</li>
                        <li>Alessio Gerace (Software developer)</li>
                    </ul>
                    <p>To let me know about the <a href="http://harmonicarium.org/similar-works/#Amelia_Rosselli" target="_blank">work</a> of the young Amelia Rosselli, thanks to Deborah Ricetti.</p>
                    <p>Thanks to the following people for their works across the music theory and technology:</p>
                    <ul>
                        <li>Carlo Serafini (thesis: Tecnologia e Sistemi di Accordatura)</li>
                        <li>Jeff X. Scott (LMSO – Li’l Miss’ Scale Oven)</li>
                        <li>Aaron Andrew Hunt (H-Pi Instruments)</li>
                        <li>Manuel Op de Coul (SCALA)</li>
                        <li>Miller S. Puckette (Pure Data)</li>
                        <li>Victor Cerullo (Max Magic Microtuner)</li>
                        <li>Benjamin Frederick Denckla (thesis: Dynamic Intonation for Synthesizer Performance)</li>
                        <li>Jacky Ligon (Xen-Arts)</li>
                        <li>Robert Walker (Tune Smithy)</li>
                        <li>Mark Henning (TUN file format)</li>
                        <li>Joe Monzo and Chris Wittmann (Tonescape / Tonalsoft Encyclopedia of Microtonal Music-theory)</li>
                        <li>Bill Gannon and Shelly Kantrow (Justonic)</li>
                    </ul>
                    <p>For their works around the Web Audio and MIDI API, thanks to:</p>
                    <ul>
                        <li>Chris Wilson (Google, W3C – Web Audio/MIDI API evangelist)</li>
                        <li>Stuart Memo (Qwerty Hancock)</li>
                        <li>Evan Sonderegger (Web Audio Peak Meter)</li>
                    </ul>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    // - - - - - - - - - - - - - - - - - - - - 

    appBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLf_appBox${id}" class="appBox">
                <div>

                    <button id="HTMLf_appInstall${id}">Install this app</button>
                    <a id="HTMLf_appOpen${id}" href="https://harmonicarium.org/app/" target="_blank">
                        <button>Try to open the App</button>
                    </a>
                    <div id="HTMLf_appUpdateInfo${id}"></div>
                    <button id="HTMLf_appUpdate${id}">Update the app</button>
                    <button id="HTMLf_appReset${id}">Reset & Update the app</button>


                </div>
            </div>`;
        return template.firstElementChild;
    },

    dpPadAccordion(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dpPadSideContainer" id="HTMLf_dppad_container${id}">

                <div class="accordion">
                    <div id="HTMLf_accordion_dppad${id}" class="accordionTabs">

                    </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },
    
    dhcAccordion(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dhcSideContainer" id="HTMLf_dhc_container${id}">

                <div class="accordion">
                    <div id="HTMLf_accordion_dhc${id}" class="accordionTabs">

                    </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },

    // accordion(id) {
    //     let template = document.createElement('div');
    //     template.innerHTML = `
    //         <div class="accordion">
    //             <div id="HTMLf_accordion_dhc${id}" class="accordionTabs">

    //             </div>
    //         </div>`;
    //     return template.firstElementChild;
    // },

    accordionTab(id, idName, title) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="accordionTab">
                <input type="checkbox" id="HTML_accordionChkBox_${idName}${id}" class="accordionChkBox">
                <label class="accordionTabLabel" for="HTML_accordionChkBox_${idName}${id}">${title}</label>
                <div id="HTML_accordionTab_${idName}${id}" class="accordionTabContent">

                </div>
            </div>`;
        return template.firstElementChild;
    },

    // - - - - - - - - - - - - - - - - - - - - 

    hstackBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="hstack" id="HTML_hstack${id}">
                <div class="UIbox">
                    <!-- <h1>H Stack</h1> -->
                    <div class="hstack_zoom">
                        <label for="HTMLi_hstack_fontsize${id}">Zoom</label>
                        <input type="range" min="14" max="30" step="0.1" id="HTMLf_hstack_zoom${id}">
                    </div>
                    <button class="TODO" id="HTMLi_hstackDuplicate${id}">Add another H Stack</button>
                    <div id="HTMLo_hstack_fontsize${id}">
                        <div class="hstackHT" id="HTMLo_hstackHT${id}"></div>
                        <div class="hstackFT">
                            <table class="dataTable">
                                <tr>
                                    <th class="hstackDivisor" colspan="4"></th>
                                </tr>
                                <tr id="HTMLf_hstackFTrow${id}" class="FToff">
                                    <td width="12%"><span id="HTMLo_hstackFT_tone${id}"></span></td>
                                    <td width="20%"><span id="HTMLo_hstackFT_note${id}"></span></td>
                                    <td width="25%"><span id="HTMLo_hstackFT_cents${id}"></span></td>
                                    <td width="43%"><span id="HTMLo_hstackFT_hz${id}"></span></td>
                                </tr>
                                <tr class="hstackHeader">
                                    <th class="hstackFT_h">FT</th>
                                    <th class="hstackFT_note">note</th>
                                    <th class="hstackFT_cents">cents</th>
                                    <th class="hstackFT_hz">Hz</th>
                                </tr>
                                <tr>
                                    <th colspan="4">Fundamental</th>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    pianoBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="piano" id="HTML_piano${id}">
                <div class="UIbox">
                    <div class="controllerKeymap">
                        <div class="keymapParam">
                            <label for="HTMLi_controllerKeymapPresets${id}">Keymap</label>&nbsp;
                            <select id="HTMLi_controllerKeymapPresets${id}" class="controllerKeymapSelect"></select>
                        </div>
                        <div class="keymapParam">
                        <!-- Open the modal content-->
                        <button id="HTMLf_controllerKeymapTableShow${id}">Show Keymap</button>
                        <input type="file" accept=".hcmap" id="HTMLi_controllerKeymapFile${id}" class="controllerKeymapFileInput">
                        </div>
                        
                        <!-- The Modal -->
                        <div id="HTMLf_controllerKeymapModal${id}" class="modalOverlay">
                        <!-- Modal content -->
                            <div class="modalOverlay_content">
                                <span id="HTMLf_controllerKeymapClose${id}" class="modalOverlay_close">&times;</span>
                                <h1>Controller Keymap</h1>
                                <div class="controllerKeymapTable" id="HTMLo_controllerKeymapTable${id}"></div>
                            </div>
                        </div>
                    </div>
                    <!-- <h1>Virtual MIDI Controller</h1> -->
                    <div class="pianoSettings1">
                        <label for="HTMLi_piano_offset${id}">Offset</label>
                        <!-- 119 (B9) is max startNote for Qwerty Hancock-->
                        <input type="range" min="0" max="119" step="1" id="HTMLi_piano_offset${id}"><br>
                        <label for="HTMLi_piano_range${id}">Range</label>
                        <input type="range" min="1" max="10" step="1" id="HTMLi_piano_range${id}">
                    </div>
                    <details>
                        <summary>Settings</summary>
                        <div class="pianoSettings2">
                            <table class="invisibleTable">
                                <tr>
                                    <td>
                                        <label for="HTMLi_piano_velocity${id}">Velocity</label><br>
                                        <input type="range" min="1" max="127" step="1" id="HTMLi_piano_velocity${id}">
                                    </td>
                                    <td>
                                        <label for="HTMLi_piano_channel${id}">Channel</label><br>
                                        <input type="number" min="1" max="16" step="1" id="HTMLi_piano_channel${id}">
                                    </td>
                                    <td>
                                        <label for="HTMLi_piano_height${id}">Height</label><br>
                                        <input type="range" min="40" max="400" step="20" id="HTMLi_piano_height${id}">
                                    </td>
                                    <td>
                                        <label for="HTMLi_piano_width${id}">Width</label><br>
                                        <input type="range" min="300" max="1000" step="50" id="HTMLi_piano_width${id}">
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </details>
                    <div id="HTMLo_hancockContainer${id}" class="hmHancockContainer"></div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    dhcBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dhc" id="HTML_dhc${id}">
                <div class="UIbox">
                    <!-- <h1>DHC Settings</h1> -->
                    <div class="dhcSettings">
                        <div class="dhcParam">
                            <label for="HTMLi_dhc_hzAccuracy${id}" title="Places of decimal precision">UI Hz accuracy</label>
                            <input type="number" min="0" max="50" step="1" id="HTMLi_dhc_hzAccuracy${id}" title="Places of decimal precision">
                        </div>
                        <div class="dhcParam">
                            <label for="HTMLi_dhc_mcAccuracy${id}" title="Places of decimal precision">UI Cents accuracy</label>
                            <input type="number" min="0" max="50" step="1" id="HTMLi_dhc_mcAccuracy${id}" title="Places of decimal precision">
                        </div>
                        <div class="dhcParam">
                            <label>Middle C octave</label>
                            <label for="HTMLi_dhc_middleC${id}" class="dhcMiddleC">C
                                <input type="number" id="HTMLi_dhc_middleC${id}">
                            </label>
                        </div>
                        <div class="dhcParam">
                            <label for="HTMLi_dhc_pitchbendRange${id}" title="Cents">Ctrl PitchBend range</label>
                            <input type="number" min="0" step="100" id="HTMLi_dhc_pitchbendRange${id}" title="Cents">
                        </div>
                        <div class="dhcParam">
                            <label for="HTMLi_dhc_piperSteps${id}">Piper (HT0) steps</label>
                            <input type="number" min="1" id="HTMLi_dhc_piperSteps${id}">
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    dpPadBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dpPadBackend" id="HTMLf_dpPadSettings${id}">
                <div class="UIbox">
 
                    <div class="dpPadSettings">                        
                        <details open>
                            <summary>SCALES RANGE</summary>
                            <div class="dpPadParam">
                                <!-- freqRange -->
                                <label for="HTMLi_dppad_freq_range_ft${id}">FT note range</label>
                                <select id="HTMLi_dppad_freq_range_ft${id}"></select>
                                <button id="HTMLi_dppad_freq_range_custom_save_ft${id}" style="display:none;">Save</button>
                            </div>
                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_freq_range_custom_min_ft${id}" title="Notes in scientific pitch nontation">Custom FT note range</label>
                                mc Max: <input type="number" min="0" max="127" step="1" id="HTMLi_dppad_freq_range_custom_max_ft${id}" title="Note in midicents notation">&nbsp;
                                        <span id="HTMLo_dppad_freq_range_custom_max_trad_ft${id}"></span><br/>
                                mc Min: <input type="number" min="0" max="127" step="1" id="HTMLi_dppad_freq_range_custom_min_ft${id}" title="Note in midicents notation">&nbsp;
                                        <span id="HTMLo_dppad_freq_range_custom_min_trad_ft${id}"></span>
                            </div>

                            <button id="HTMLi_dppad_freq_range_copy_to_ht${id}" class="dpPadCopyFreqRange">HT same as FT</button>
                            <button id="HTMLi_dppad_freq_range_copy_to_ft${id}" class="dpPadCopyFreqRange">FT same as HT</button>
                            
                            <div class="dpPadParam">
                                <!-- freqRange -->
                                <label for="HTMLi_dppad_freq_range_ht${id}">HT frequency range</label>
                                <select id="HTMLi_dppad_freq_range_ht${id}"></select>
                                <button id="HTMLi_dppad_freq_range_custom_save_ht${id}" style="display:none;">Save</button>
                            </div>
                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_freq_range_custom_min_ht${id}" title="Frequencies in Hz">Custom HT frequecy range</label>
                                Hz Max: <input type="number" min="1" step="1" id="HTMLi_dppad_freq_range_custom_max_ht${id}" title="Frequency in hertz">&nbsp;
                                        <span id="HTMLo_dppad_freq_range_custom_max_trad_ht${id}"></span><br/>
                                Hz Min: <input type="number" min="1" step="1" id="HTMLi_dppad_freq_range_custom_min_ht${id}" title="Frequency in hertz">&nbsp;
                                        <span id="HTMLo_dppad_freq_range_custom_min_trad_ht${id}"></span>
                            </div>
                        </details>
                    </div>

                    <div class="dpPadSettings">
                        <details>
                            <summary>PADS</summary>
                            <div class="dpPadParam">
                                <!-- orientation -->
                                <label for="HTMLi_dppad_main_orientation${id}">Pads orientation</label>
                                <select id="HTMLi_dppad_main_orientation${id}">
                                    <option value="vertical">Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                </select>
                            </div>
                            <div class="dpPadParam">
                                <!-- scaleOrientation -->
                                <label for="HTMLi_dppad_scale_orientation_ft${id}">FT scale orientation</label>
                                <select id="HTMLi_dppad_scale_orientation_ft${id}">
                                    <option value="vertical">Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                </select>
                            </div>
                            <div class="dpPadParam">
                                <!-- scaleOrientation -->
                                <label for="HTMLi_dppad_scale_orientation_ht${id}">HT scale orientation</label>
                                <select id="HTMLi_dppad_scale_orientation_ht${id}">
                                    <option value="vertical">Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                </select>
                            </div>

                            <div class="dpPadParam">
                                <!-- padOrder -->
                                <label for="HTMLi_dppad_pads_order${id}">Pads order</label>
                                <select id="HTMLi_dppad_pads_order${id}">
                                    <option value="ftht">FT - HT</option>
                                    <option value="htft">HT - FT</option>
                                </select>
                            </div>

                        </details>
                    </div>

                    <div class="dpPadSettings">
                        <details>
                            <summary>TOOLBAR</summary>
                            <div class="dpPadParam">
                                <!-- toolbarOrientation -->
                                <label for="HTMLi_dppad_toolbar_orientation${id}">Toolbar orient.</label>
                                <select id="HTMLi_dppad_toolbar_orientation${id}">
                                    <option value="longitudinal">Longitudinal</option>
                                    <option value="transversal">Transversal</option>
                                </select>
                            </div>
                            <div class="dpPadParam">
                                <!-- toolbarPosition -->
                                <label for="HTMLi_dppad_toolbar_position${id}">Toolbar position</label>
                                <select id="HTMLi_dppad_toolbar_position${id}">
                                    <option value="0">Pre</option>
                                    <option value="1">Mid</option>
                                    <option value="2">Post</option>
                                </select>
                            </div>
                        </details>
                    </div>

                   <div class="dpPadSettings">
                        <!-- FONTSIZE -->
                        <details>
                            <summary>FONTS</summary>

                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_hzMonitor_ft${id}" title="Pixels">FT Font size freq. monitor</label>
                                <input type="number" min="1" step="1" id="HTMLi_dppad_fontsize_hzMonitor_ft${id}" title="Pixels">
                            </div>
                            <!-- <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_noteMonitor_ft${id}" title="Pixels">FT Font size note monitor</label>
                                <input type="number" min="1" max="100" step="1" id="HTMLi_dppad_fontsize_noteMonitor_ft${id}" title="Pixels">
                            </div> -->
                            <!-- <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_lineLabel_ft${id}" title="Pixels">FT Font size Lines labels</label>
                                <input type="number" min="1" max="100" step="1" id="HTMLi_dppad_fontsize_lineLabel_ft${id}" title="Pixels">
                            </div> -->
                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_keyLabel_ft${id}" title="Pixels">FT Font size Keys labels</label>
                                <input type="number" min="1" step="1" id="HTMLi_dppad_fontsize_keyLabel_ft${id}" title="Pixels">
                            </div>


                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_hzMonitor_ht${id}" title="Pixels">HT Font size freq. monitor</label>
                                <input type="number" min="1" step="1" id="HTMLi_dppad_fontsize_hzMonitor_ht${id}" title="Pixels">
                            </div>
                            <!-- <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_noteMonitor_ht${id}" title="Pixels">HT Font size note monitor</label>
                                <input type="number" min="1" max="100" step="1" id="HTMLi_dppad_fontsize_noteMonitor_ht${id}" title="Pixels">
                            </div> -->
                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_lineLabel_ht${id}" title="Pixels">HT Font size Lines labels</label>
                                <input type="number" min="1" step="1" id="HTMLi_dppad_fontsize_lineLabel_ht${id}" title="Pixels">
                            </div>
                            <div class="dpPadParam">
                                <label for="HTMLi_dppad_fontsize_keyLabel_ht${id}" title="Pixels">HT Font size Keys labels</label>
                                <input type="number" min="1" step="1" id="HTMLi_dppad_fontsize_keyLabel_ht${id}" title="Pixels">
                            </div>
                        </details>

                    </div>

                    <div class="dpPadSettings">

                        <details>
                            <summary>Experimental</summary>

                            <div class="dpPadParam">
                                <!-- scaleDisplay -->
                                <label for="HTMLi_dppad_scale_display_ft${id}">FT scale on HT pad</label>
                                <input type="checkbox" id="HTMLi_dppad_scale_display_ft${id}">
                            </div>
                            <div class="dpPadParam">
                                <!-- scaleDisplay -->
                                <label for="HTMLi_dppad_scale_display_ht${id}">HT scale on FT pad</label>
                                <input type="checkbox" id="HTMLi_dppad_scale_display_ht${id}">
                            </div>
                            
                            <div class="dpPadParam">
                                <!-- renderMode -->
                                <label for="HTMLi_dppad_render_mode${id}">Render quality</label>
                                <select id="HTMLi_dppad_render_mode${id}">
                                    <option value="classic">Low resolution</option>
                                    <option value="hidpi">High resolution</option>
                                </select>
                            </div>

                            <!-- canvasesRatio
                            canvasObjectsRatio (keys width) -->
                        </details>

                    </div>

                </div>
            </div>`;
        return template.firstElementChild;
    },

    synthBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="synth" id="HTML_synth${id}">
                <div class="UIbox">
                    <div class="synthColumn">
                        <div class="synthRxPanel">
                            <div class="synthParam">
                                <label for="HTMLi_synth_attack${id}">&minus; &nbsp;&nbsp;Attack &nbsp;&nbsp;&plus;</label>
                                <!-- time (sec) -->
                                <input type="range" min="0.02" max="5" step="0.01" id="HTMLi_synth_attack${id}" data-tooltip="">
                            </div>
                            <div class="synthParam">
                                <label for="HTMLi_synth_sustain${id}">&minus; &nbsp;&nbsp;Sustain &nbsp;&nbsp;&plus;</label>
                                <!-- gain value amount (0 > 1) -->
                                <input type="range" min="0.018" max="1" step="0.001" id="HTMLi_synth_sustain${id}">
                            </div>
                        </div>
                        <!-- <h1>Built-in Synth</h1> -->
                        <div class="synthSxPanel">
                            <div class="synthParam">
                                <label for="HTMLi_synth_power${id}">ON/OFF</label>
                                <input type="checkbox" name="synt" id="HTMLi_synth_power${id}">
                            </div>
                            <div class="synthParam">
                                <label for="HTMLi_synth_portamento${id}">&minus; &nbsp;&nbsp;Portamento &nbsp;&nbsp;&plus;</label>
                                <input type="range" min="0" max="0.20" step="0.01" id="HTMLi_synth_portamento${id}">
                            </div>
                        </div>
                        <div class="synthTonePanel">
                            <table class="invisibleTable">
                                <tr>
                                    <th>Fundamental Tone</th>
                                    <th>Harmonic Tones</th>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="HTMLi_synth_volumeFT${id}">&minus; &nbsp;&nbsp;FT Volume &nbsp;&nbsp;&plus;</label>
                                        <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_volumeFT${id}">
                                    </td>
                                    <td>
                                        <label for="HTMLi_synth_volumeHT${id}">&minus; &nbsp;&nbsp;HTs Volume &nbsp;&nbsp;&plus;</label>
                                        <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_volumeHT${id}">
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="HTMLi_synth_waveformFT${id}">FT Waveform</label>
                                        <select id="HTMLi_synth_waveformFT${id}">
                                            <option value="sine">Sine</option>
                                            <option value="sawtooth">Sawtooth</option>
                                            <option value="square">Square</option>
                                            <option value="triangle">Triangle</option>
                                        </select>
                                    </td>
                                    <td>
                                        <label for="HTMLi_synth_waveformHT${id}">HTs Waveform</label>
                                        <select id="HTMLi_synth_waveformHT${id}">
                                            <option value="sine">Sine</option>
                                            <option value="sawtooth">Sawtooth</option>
                                            <option value="square">Square</option>
                                            <option value="triangle">Triangle</option>
                                        </select>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div class="synthReverbPanel">
                            <label for="HTMLi_synth_reverb${id}">DRY &nbsp;&ndash; &nbsp;Convolution Reverb &nbsp;&ndash; &nbsp;WET</label>
                            <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_reverb${id}">
                            <p></p>
                            <input type="file" id="HTMLi_synth_irFile${id}" accept=".wav">
                        </div>
                    </div>
                    <div class="synthColumn synthOut">
                        <div class="synthParam">
                            <label for="HTMLi_synth_decay${id}">&minus; &nbsp;&nbsp;Decay &nbsp;&nbsp;&plus;</label>
                            <!-- time (timeconstant) -->
                            <input type="range" min="0.001" max="1" step="0.001" id="HTMLi_synth_decay${id}">
                        </div>
                        <div class="synthParam">
                            <label for="HTMLi_synth_release${id}">&minus; &nbsp;&nbsp;Release &nbsp;&nbsp;&plus;</label>
                            <!-- time (sec) -->
                            <input type="range" min="0.02" max="5" step="0.01" id="HTMLi_synth_release${id}">
                        </div>
                        <div id="HTMLo_synth_meter${id}" class="hmVUmeter"></div>
                        <div class="rotatedElement">
                            <label for="HTMLi_synth_volume${id}">&minus; &nbsp;&nbsp;MASTER &nbsp;VOLUME &nbsp;&nbsp;&plus;</label>
                            <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_volume${id}" class="hmMasterVolume">
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    midiBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="io" id="HTML_io${id}">
                <div class="UIbox">
                    <div class="midiPorts unselectableText">
                        <!-- <h1>MIDI &nbsp;I/O</h1> -->
                        <!-- Open the modal content-->
                        <button id="HTMLf_motPanelModalShow${id}" style="margin-top:10px;">MIDI Settings...</button>
                        <!-- The Modal -->
                        <div id="HTMLf_motPanelModal${id}" class="modalOverlay">
                        <!-- Modal content -->
                            <div class="modalOverlay_content">
                                <span id="HTMLf_motPanelClose${id}" class="modalOverlay_close">&times;</span>
                                <div class="midiContainer">
                                    <div class="midiColumn midiContainerLeft">
                                        <h1>MIDI &nbsp;I/O</h1>
                                        <div class="midiMonitor">
                                            <table class="monitorTable">
                                                <tr>
                                                    <td class="monitorTableTitle" colspan="3">MIDI-Input monitor</td>
                                                </tr>
                                                <tr>
                                                    <th>Channel</th>
                                                    <th>Note #</th>
                                                    <th>Velocity</th>
                                                </tr>
                                                <tr>
                                                    <td><span id="HTMLo_midiMonitor0_channel${id}"></span></td>
                                                    <td><span id="HTMLo_midiMonitor0_note${id}"></span></td>
                                                    <td><span id="HTMLo_midiMonitor0_velocity${id}"></span></td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3"><span id="HTMLo_midiMonitor0_port${id}"></span></td>
                                                </tr>
                                            </table>
                                        </div>
                                        <h2>Input ports (controllers):</h2>
                                        <div id="HTMLo_inputPorts${id}"></div>

                                        <table class="invisibleTable midiParam">

                                            <tr>
                                                <td>
                                                    <h3>Receiving mode</h3>
                                                    <select id="HTMLi_midiReceiveMode${id}">
                                                        <option value="keymap">Controller Keymapped MIDI note #</option>
                                                        <option value="tsnap-channel">Tone snapping – Channel</option>
                                                        <option value="tsnap-divider">Tone snapping – Divider</option>
                                                        <!-- <option value="velocity1-1">Encoded into Velocity: 1-1</option> -->
                                                        <!-- <option value="velocity_lin">Encoded into Velocity: Full range linear</option> -->
                                                        <!-- <option value="velocity_log">Encoded into Velocity: Full range logarithmic</option> -->
                                                    </select>
                                                </td>
                                            </tr>

                                            <tr id="HTMLf_midiReceiveModeTsnapTolerance${id}">
                                                <td>
                                                    <div class="midiSubParam">
                                                        <label for="HTMLi_midiReceiveModeTsnapTolerance${id}" title="Cents">Harmoninc snap tolerance</label>
                                                        <input type="number" min="0" max="100" step="1" id="HTMLi_midiReceiveModeTsnapTolerance${id}" title="Cents">
                                                    </div>
                                                </td>
                                            </tr>

                                            <tr id="HTMLf_midiReceiveModeTsnapChan${id}">
                                                <td>
                                                    <div class="midiSubParam">
                                                        <label for="HTMLi_midiReceiveModeTsnapChanFT${id}">FT channel</label>
                                                        <select id="HTMLi_midiReceiveModeTsnapChanFT${id}">
                                                            <option value="0">1</option>
                                                            <option value="1">2</option>
                                                            <option value="2">3</option>
                                                            <option value="3">4</option>
                                                            <option value="4">5</option>
                                                            <option value="5">6</option>
                                                            <option value="6">7</option>
                                                            <option value="7">8</option>
                                                            <option value="8">9</option>
                                                            <option value="9">10</option>
                                                            <option value="10">11</option>
                                                            <option value="11">12</option>
                                                            <option value="12">13</option>
                                                            <option value="13">14</option>
                                                            <option value="14">15</option>
                                                            <option value="15">16</option>
                                                        </select>

                                                        <label for="HTMLi_midiReceiveModeTsnapChanHT${id}">HT channel</label>
                                                        <select id="HTMLi_midiReceiveModeTsnapChanHT${id}">
                                                            <option value="0">1</option>
                                                            <option value="1">2</option>
                                                            <option value="2">3</option>
                                                            <option value="3">4</option>
                                                            <option value="4">5</option>
                                                            <option value="5">6</option>
                                                            <option value="6">7</option>
                                                            <option value="7">8</option>
                                                            <option value="8">9</option>
                                                            <option value="9">10</option>
                                                            <option value="10">11</option>
                                                            <option value="11">12</option>
                                                            <option value="12">13</option>
                                                            <option value="13">14</option>
                                                            <option value="14">15</option>
                                                            <option value="15">16</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>

                                            <tr id="HTMLf_midiReceiveModeTsnapDivider${id}">
                                                <td>
                                                    <div class="midiSubParam">
                                                        <label for="HTMLi_midiReceiveModeTsnapDivider${id}" title="MIDI note number">Divider key</label>
                                                        <input type="number" min="0" max="127" step="1" id="HTMLi_midiReceiveModeTsnapDivider${id}" title="MIDI note number">
                                                        <label for="HTMLi_midiReceiveModeTsnapChanDivider${id}">Channel</label>
                                                        <select id="HTMLi_midiReceiveModeTsnapChanDivider${id}">
                                                            <option value="0">1</option>
                                                            <option value="1">2</option>
                                                            <option value="2">3</option>
                                                            <option value="3">4</option>
                                                            <option value="4">5</option>
                                                            <option value="5">6</option>
                                                            <option value="6">7</option>
                                                            <option value="7">8</option>
                                                            <option value="8">9</option>
                                                            <option value="9">10</option>
                                                            <option value="10">11</option>
                                                            <option value="11">12</option>
                                                            <option value="12">13</option>
                                                            <option value="13">14</option>
                                                            <option value="14">15</option>
                                                            <option value="15">16</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>

                                        </table>

                                        <h2>Output ports (instruments):</h2>
                                        <div id="HTMLo_outputPorts${id}"></div>
                                        <div id="HTMLf_webMidiLinkPorts${id}"></div>
                                    </div>
                                    <div class="midiColumn midiContainerRight">
                                        <h1>MIDI-Out Tuning &nbsp;&ndash; &nbsp;PitchBend method</h1>
                                        <div id="HTMLf_motPanelContent${id}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="monitors">
                        <table class="monitorTable">
                            <tr>
                                <td class="monitorTableTitle" colspan="5">Last pressed keys</td>
                            </tr>
                            <tr>
                                <th width="10%"></th>
                                <th width="10%">#</th>
                                <th width="30%">Note</th>
                                <th width="30%">Hz</th>
                                <th width="20%" title="MIDI.cent">m.&cent;</th>
                            </tr>
                            <tr>
                                <td>HT</td>
                                <td><span id="HTMLo_toneMonitorHT_tone${id}"></span></td>
                                <td><span id="HTMLo_toneMonitorHT_notename${id}"></span></td>
                                <td><span id="HTMLo_toneMonitorHT_frequency${id}"></span></td>
                                <td><span id="HTMLo_toneMonitorHT_midicents${id}"></span></td>
                            </tr>
                            <tr>
                                <td>FT</td>
                                <td><span id="HTMLo_toneMonitorFT_tone${id}"></span></td>
                                <td><span id="HTMLo_toneMonitorFT_notename${id}"></span></td>
                                <td><span id="HTMLo_toneMonitorFT_frequency${id}"></span></td>
                                <td><span id="HTMLo_toneMonitorFT_midicents${id}"></span></td>
                            </tr>
                        </table>
                        <table class="monitorTable">
                            <tr>
                                <td class="monitorTableTitle" colspan="3">MIDI-Input monitor</td>
                            </tr>
                            <tr>
                                <th>Channel</th>
                                <th>Note #</th>
                                <th>Velocity</th>
                            </tr>
                            <tr>
                                <td><span id="HTMLo_midiMonitor1_channel${id}"></span></td>
                                <td><span id="HTMLo_midiMonitor1_note${id}"></span></td>
                                <td><span id="HTMLo_midiMonitor1_velocity${id}"></span></td>
                            </tr>
                            <tr>
                                <td colspan="3"><span id="HTMLo_midiMonitor1_port${id}"></span></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    visualiserBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="visualiser TODO" id="HTML_visualiser${id}">
                <div class="UIbox">
                    <div class="synthVisualiser">
                        <select id="HTMLi_visualiser${id}" name="visual">
                          <option value="sinewave">Sinewave</option>
                          <option value="frequencybars" selected>Frequency bars</option>
                          <option value="off">Off</option>
                        </select>
                        <canvas class="visualizer" width="640" height="100"></canvas>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    fmBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="fm" id="HTML_fm${id}">
                <div class="UIbox">
                    <!-- <h1>Fundamental Mother</h1> -->
                    <table class="invisibleTable">
                        <tr>
                            <td>MIDI Note 0-127
                                <br> (midi#.cents)</td>
                            <td></td>
                            <td>Frequency
                                <br>(Hz)</td>
                        </tr>
                        <tr>
                            <td>
                                <span id="HTMLo_fm_mc${id}" class="hmFMout"></span>
                            </td>
                            <td></td>
                            <td>
                                <span id="HTMLo_fm_hz${id}" class="hmFMout"></span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <input type="number" id="HTMLi_fm_mc${id}">
                            </td>
                            <td>
                                <!-- Fake button. Useless due to 'onchange' on input textboxes but user-friendl -->
                                <button>Set</button>
                            </td>
                            <td>
                                <input type="number" min="1" id="HTMLi_fm_hz${id}">
                            </td>
                        </tr>
                    </table>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    ftBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="ft" id="HTML_ft${id}">
                <div class="UIbox">
                    <!-- <h1>Fundamental Tones</h1> -->
                    <div class="ftSettings">
                        <h2><input type="radio" name="ftTuningSystem" value="n-edx" id="HTMLf_ftSys_NEDX${id}">n-EDx (ET)</h2>
                        <div class="ftNEDX" id="HTMLf_ftNEDX${id}">
                            <table class="invisibleTable">
                                <tr>
                                    <td width="40%">Ratio Unit</td>
                                    <td width="20%"><span class="ftNEDX"><img src="assets/img/n-edx.png" alt="nth root of x"></span></td>
                                    <td width="40%">Equal Divisions</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="ftNEDX_VarsTxt"> x = </span><input type="number" id="HTMLi_ftNEDX_unit${id}">
                                    </td>
                                    <td>
                                        <button id="HTMLi_ftNEDX_ok${id}" class="hmSetButton">Set</button>
                                    </td>
                                    <td>
                                        <span class="ftNEDX_VarsTxt"> n = </span><input type="number" id="HTMLi_ftNEDX_division${id}">
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <h2><input type="radio" name="ftTuningSystem" value="h_s-nat" id="HTMLf_ftSys_HSnat${id}">Harm./Sub. Natural</h2>
                        <h2><input type="radio" name="ftTuningSystem" value="h_s-trans" id="HTMLf_ftSys_HStrans${id}">Harm./Sub. Same Octave</h2>
                        <div class="ftHS" id="HTMLf_ftHS${id}">
                            <table class="invisibleTable">
                                <tr>
                                    <td valign="top" width="50%" style="text-align: right;"><h2>Transpose</h2></td>
                                    <td width="20%"><span class="htSettingsLabel">&divide;2</span></td>
                                    <td width="10%">Octave</td>
                                    <td width="20%"><span class="htSettingsLabel">&times;2</span></td>
                                </tr>
                                <tr>
                                    <td style="text-align: right;">Harmonics</td>
                                    <td>
                                        <button id="HTMLi_ftHStranspose_h_minus${id}">&minus;</button>
                                    </td>
                                    <td>
                                        <span id="HTMLo_ftHStranspose_h_ratio${id}"></span>
                                    </td>
                                    <td>
                                        <button id="HTMLi_ftHStranspose_h_plus${id}">&plus;</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: right;">Subharmonics</td>
                                    <td>
                                        <button id="HTMLi_ftHStranspose_s_minus${id}">&minus;</button>
                                    </td>
                                    <td>
                                        <span id="HTMLo_ftHStranspose_s_ratio${id}"></span>
                                    </td>
                                    <td>
                                        <button id="HTMLi_ftHStranspose_s_plus${id}">&plus;</button>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    htBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="ht" id="HTML_ht${id}">
                <div class="UIbox">
                    <!-- <h1>Harmonic Tones</h1> -->
                    <div class="htSettings">
                        <table class="invisibleTable">
                            <tr>
                                <td valign="top">
                                    <h2>Transpose</h2>
                                </td>
                                <td>Octave
                                    <br><span class="htSettingsLabel">&divide;2</span></td>
                                <td>Ratio
                                    <br><span class="htSettingsLabel">&times;r</span></td>
                                <td>Octave
                                    <br><span class="htSettingsLabel">&times;2</span></td>
                            </tr>
                            <tr>
                                <td style="text-align: right;">Harmonics</td>
                                <td>
                                    <button id="HTMLi_htTranspose_h_minus${id}">&minus;</button>
                                </td>
                                <td>
                                    <input type="number" min="0" id="HTMLi_htTranspose_h_ratio${id}">
                                </td>
                                <td>
                                    <button id="HTMLi_htTranspose_h_plus${id}">&plus;</button>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: right;">Subharmonics</td>
                                <td>
                                    <button id="HTMLi_htTranspose_s_minus${id}">&minus;</button>
                                </td>
                                <td>
                                    <input type="number" min="0" id="HTMLi_htTranspose_s_ratio${id}">
                                </td>
                                <td>
                                    <button id="HTMLi_htTranspose_s_plus${id}">&plus;</button>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    webMidiLinkPorts(id, key) {
        let template = document.createElement('div');
        template.innerHTML = `
            <table id="HTMLf_webMidiLinkLoader${id}" class="invisibleTable midiParam" style="display:none;">
                <tr>
                    <td colspan="2">
                        <h3>WebMidiLink synth @ Port ${key}: &nbsp;&nbsp;<span id="HTMLf_webMidiLinkStatus${id}" class="webmidilinkNotLoaded">NOT LOADED</span></h3>
                    </td>
                </tr>

                <tr>
                    <td rowspan="2">URL</td>
                    <td colspan="2">
                        <input id="HTMLf_webMidiLinkUrl${id}" type="text" class="webMidiLinkUrl" size="48" />
                    </td>
                </tr>
                <tr>
                    <td>
                        <select id="HTMLf_webMidiLinkSynthSelect${id}" class="webMidiLinkSelect"></select>
                    </td>
                    <td align="right">
                        <button id="HTMLf_webMidiLinkSynthLoad${id}">Load</button>
                    </td>
                </tr>
            </table>`;
        return template.firstElementChild;
    },

};