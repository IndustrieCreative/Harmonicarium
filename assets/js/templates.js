 /**
 * This file is part of HARMONICARIUM, a web app which allows users to play
 * the Harmonic Series dynamically by changing its fundamental tone in real-time.
 * It is available in its latest version from:
 * https://github.com/IndustrieCreative/Harmonicarium
 * 
 * @license
 * Copyright (C) 2017-2023 by Walter G. Mantovani (http://armonici.it).
 * Written by Walter G. Mantovani.
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
 * Namespace for all the functions those return a rendered HTML template.
 * @namespace HUM.tmpl
 */
HUM.tmpl = {
    /**
     * Get the full SVG iconset.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<svg>` element.
     */
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

            edit: {
                d: "M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z",
                viewBox: "0 0 16 16"
            },
            trash: {
                d: "M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z",
                viewBox: "0 0 16 16"
            },
            clear: {
                d: "M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z",
                viewBox: "0 0 16 16"
            },
            upload: {
                d: "M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z",
                viewBox: "0 0 16 16"
            },
            download: {
                d: "M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z",
                viewBox: "0 0 16 16"
            },
            save: {
                d: "M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5z M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z",
                viewBox: "0 0 16 16"
            },
            load: {
                d: "M8 11a.5.5 0 0 0 .5-.5V6.707l1.146 1.147a.5.5 0 0 0 .708-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 .708.708L7.5 6.707V10.5a.5.5 0 0 0 .5.5z M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z",
                viewBox: "0 0 16 16"
            },
            sessions: {
                d: "M4.5 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM6 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z M12 1a2 2 0 0 1 2 2 2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10ZM2 12V5a2 2 0 0 1 2-2h9a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1Zm1-4v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8H3Zm12-1V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2h12Z",
                viewBox: "0 0 16 16"
            },
            link: {
                d: "M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z",
                viewBox: "0 0 16 16"
            },
            piano: {
                d: "M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h130v-180h-10q-17 0-28.5-11.5T280-420v-340h-80v560Zm430 0h130v-560h-80v340q0 17-11.5 28.5T640-380h-10v180Zm-240 0h180v-180h-10q-17 0-28.5-11.5T520-420v-340h-80v340q0 17-11.5 28.5T400-380h-10v180Z",
                viewBox: "0 -960 960 960"
            },
            user: {
                d: "M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z",
                viewBox: "0 0 16 16"
            },
            dppad: {
                d: "m 579.999,-733.334 v 506.668 h 233.335 v -506.668 z m -66.666,0 q 0,-27 19.833,-46.833 Q 553,-800 579.999,-800 h 233.335 q 27,0 46.833,19.833 19.833,19.833 19.833,46.833 v 506.668 q 0,27 -19.833,46.833 Q 840.334,-160 813.334,-160 H 579.999 q -26.999,0 -46.833,-19.833 -19.833,-19.833 -19.833,-46.833 z m -366.667,0 v 506.668 h 233.335 v -506.668 z m -66.666,0 q 0,-27 19.833,-46.833 Q 119.666,-800 146.666,-800 h 233.335 q 26.999,0 46.833,19.833 19.833,19.833 19.833,46.833 v 506.668 q 0,27 -19.833,46.833 Q 407,-160 380.001,-160 H 146.666 q -27,0 -46.833,-19.833 Q 80,-199.666 80,-226.666 Z m 499.999,0 h 233.335 z m -433.333,0 h 233.335 z",
                viewBox: "0 -960 960 960"
            },
            dppad: {
                d: "m 579.999,-733.334 v 506.668 h 233.335 v -506.668 z m -66.666,0 q 0,-27 19.833,-46.833 Q 553,-800 579.999,-800 h 233.335 q 27,0 46.833,19.833 19.833,19.833 19.833,46.833 v 506.668 q 0,27 -19.833,46.833 Q 840.334,-160 813.334,-160 H 579.999 q -26.999,0 -46.833,-19.833 -19.833,-19.833 -19.833,-46.833 z m -366.667,0 v 506.668 h 233.335 v -506.668 z m -66.666,0 q 0,-27 19.833,-46.833 Q 119.666,-800 146.666,-800 h 233.335 q 26.999,0 46.833,19.833 19.833,19.833 19.833,46.833 v 506.668 q 0,27 -19.833,46.833 Q 407,-160 380.001,-160 H 146.666 q -27,0 -46.833,-19.833 Q 80,-199.666 80,-226.666 Z m 499.999,0 h 233.335 z m -433.333,0 h 233.335 z",
                viewBox: "0 -960 960 960"
            },
            audio: {
                d: "M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z",
                viewBox: "0 0 16 16"
            },
            dhcSettings: {
                d: "M641.961-160q-48.628 0-82.628-34.039t-34-82.667q0-48.627 33.445-82.627 33.444-34 81.222-34 14.312 0 27.323 2.5 13.011 2.5 24.677 8.833v-338h188v74H758.667v370q0 48.333-34.04 82.167Q690.588-160 641.961-160ZM120-320v-66.666h310.666V-320H120Zm0-166.667v-66.666h475.333v66.666H120Zm0-166.667V-720h475.333v66.666H120Z",
                viewBox: "0 -960 960 960"
            },
            table: {
                d: "M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z",
                viewBox: "0 0 16 16"
            },
            ft: {
                d: "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-84.333 32.167-157.333 32.166-73 87.666-127t129.834-84.834Q404-880 488.667-880 568-880 639-853.167q71 26.834 124.5 74.334t85 112.666Q880-601 880-524q0 110.333-65.333 172.5-65.333 62.166-168 62.166H572q-15 0-24.833 11.001-9.834 11-9.834 24.333 0 22.001 14.667 42.167 14.666 20.167 14.666 46.5 0 42-23.166 63.666Q520.333-80 480-80Zm0-400Zm-228.667 30.666q22 0 37.667-15.666 15.666-15.667 15.666-37.667T289-540.333Q273.333-556 251.333-556t-37.666 15.667Q198-524.667 198-502.667q0 22 15.667 37.667 15.666 15.666 37.666 15.666Zm124-166.666q22 0 37.667-15.667 15.666-15.667 15.666-37.667 0-21.999-15.666-37.666-15.667-15.667-37.667-15.667T337.667-707Q322-691.333 322-669.334q0 22 15.667 37.667Q353.333-616 375.333-616Zm209.334 0q22 0 37.666-15.667Q638-647.334 638-669.334q0-21.999-15.667-37.666-15.666-15.667-37.666-15.667-22 0-37.667 15.667-15.666 15.667-15.666 37.666 0 22 15.666 37.667Q562.667-616 584.667-616ZM712-449.334q22 0 37.667-15.666 15.666-15.667 15.666-37.667t-15.666-37.666Q734-556 712-556t-37.666 15.667q-15.667 15.666-15.667 37.666 0 22 15.667 37.667Q690-449.334 712-449.334ZM480-146.666q10.333 0 15.167-4.667Q500-156 500-165.333q0-14-14.667-28.333-14.666-14.333-14.666-54.333 0-44.667 29.666-76.334Q530-356 574.667-356h72q72.667 0 119.667-42.5t47-125.5q0-128.334-97.5-208.834-97.501-80.5-227.167-80.5-142.667 0-242.334 96.667T146.666-480q0 138.333 97.5 235.834 97.501 97.5 235.834 97.5Z",
                viewBox: "0 -960 960 960"
            },
            ht: {
                d: "m120-800v33.333h720v-33.333zm0 99.999v66.667h720v-66.667zm0 133.33v99.999h720v-99.999zm0 166.67v240h720v-240z",
                viewBox: "0 -960 960 960"
            },
            fm: {
                d: "m839.76-862.04 4.5581 191.32 87.788-13.396v319.95h-100.2l2.1824 245.16h-83.5l-2.1824-245.16h-225.45l2.1824 245.16h-83.5l-2.1824-245.16h-225.45l2.1824 245.16h-83.5l-2.1824-245.16h-100.2v-319.95l100.2 13.396 2.535-198.12",
                viewBox: "0 -960 960 960"
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

    /**
     * Use a SVG icon.
     *
     * @param {number} iconName - Icon name.
     * @param {number} humID    - The HUM instance ID.
     * @param {number} svg      - The `<svg>` HTML element.
     * @param {number} x        - The horizontal position.
     * @param {number} y        - The vertical position.
     * 
     * @returns {HTMLElement} - A `<use>` element.
     */
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

    /**
     * Get the main App container for one Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    appContainer(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="harmonicarium${id}">

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the main DiphonicPad container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dpPadContainer(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLf_dpPad${id}" class="hum-dppad-container">

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Log text box container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    logTextBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLo_logPanel${id}" class="panelOverlay bottomPanel text-bg-dark" style="--bs-bg-opacity: .9;">
                <!-- <div id="HTMLf_logCloseBtn${id}" class="panelBtnContainer">
                    <div class="panelBtnBar1"></div>
                    <div class="panelBtnBar2"></div>
                    <div class="panelBtnBar3"></div>
                </div> -->
                <button id="HTMLf_logCloseBtn${id}" type="button" class="panelBtnContainer btn-close btn-close-white hum-circle-x mt-auto" aria-label="Close"></button>
                <div class="panelOverlay_content h-100 logText">
                    <h3>Events Log</h3>

                    <button type="button" id="HTMLf_logTestBtn${id}" class="btn btn-secondary" style="margin-bottom: 10px; position: absolute; right: 20px; top: 80px;">TEST</button>
                    <div class="logText h-100 overflow-scroll" id="HTMLo_logText${id}"></div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Side Panel box container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    sidePanel(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLo_sidePanel${id}" class="panelOverlay rightPanel container-fluid p-0 d-flex flex-column">

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Side Panel Top Logo box container, one per Harmonicarium.
     * Ti contains also the Top Navigation menu items.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    logoBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="row m-0" id="HTML_logo${id}">
                <div class="sidePanelBtn col-auto h-100">
                    <div class="vstack gap-1 h-100">
                        <button id="HTMLf_sideCloseBtn${id}" type="button" class="btn-close btn-close-white hum-circle-x mt-auto" aria-label="Close"></button>
                        <button id="HTMLf_sideHalfBtn${id}" type="button" class="btn-close btn-close-white hum-arrow-bar-right mb-auto" aria-label="Half screen"></button>
                        <button id="HTMLf_sideFullBtn${id}" type="button" class="btn-close btn-close-white hum-arrow-bar-left mb-auto" aria-label="Full screen"></button>
                    </div>
                </div>
                <div class="col px-1 px-sm-3">
                    <div class="row hum-logo-container">
                        <img src="assets/img/logo.png" alt="The Harmonicarium logo">
                    </div>
                    <div class="row">
                          <ul class="nav nav-pills nav-fill flex-column flex-sm-row" role="tablist" id="HTMLo_sideNav${id}">
                            <li class="nav-item border border-secondary rounded mx-1 mb-1">
                              <a class="nav-link hum-nav-link active px-1 p-sm-2" data-bs-toggle="tab" href="#HTMLo_settingsObj${id}">SETTINGS</a>
                            </li>
                            <li class="nav-item dropdown border border-secondary rounded mx-1 mb-1">
                                <a class="nav-link dropdown-toggle hum-nav-link px-1 p-sm-2" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Info</a>
                                <ul class="dropdown-menu dropdown-menu-dark w-100">
                                    <li class="nav-item">
                                      <a class="dropdown-item py-2" data-bs-toggle="tab" href="#HTMLo_helpObj${id}">Help</a>
                                    </li>
                                    <li class="nav-item">
                                      <a class="dropdown-item py-2" data-bs-toggle="tab" href="#HTMLo_creditsObj${id}">Credits</a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li class="nav-item">
                                      <a class="dropdown-item py-2" data-bs-toggle="tab" href="#HTMLo_appObj${id}">App</a>
                                    </li>
                                    <li class="nav-item">
                                      <a class="dropdown-item py-2 bi bi-box-arrow-up-right" href="https://github.com/IndustrieCreative/Harmonicarium" target="_blank" rel="noopener noreferrer">Source code</a>
                                    </li>
                                </ul>
                            </li>
                          </ul>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Side Panel Menu Contents container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    sideMenu(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTML_side_menu${id}" class="tab-content overflow-scroll">
                
                <div id="HTMLo_settingsObj${id}" class="hum-settings tab-pane fade show active"></div>
                
                <div id="HTMLo_helpObj${id}" class="hum-help tab-pane fade">
                    <div class="container p-0 mt-3">
                        <h1>Short Help</h1>
                        <h2>This program currently under development.</h2>
                        <h3>Tested only in Chromium (Google Chrome) browsers. With Opera it seems to work as well, but untested.</h3>
                        <p>Since this program is still in beta, I cannot write an exhaustive guide at the moment. The functioning in a few words is as follows.</p>
                        <h3 class="mt-3">OVERVIEW</h3>
                        <p>You have two pads (or keyboard layers):</p>
                        <ul>
                            <li>Fundamental Tones (FT): the<span class="monospace"> red pad</span>.</li>
                            <li>Harmonic Tones (HT): the<span class="monospace"> blue pad</span>.</li>
                        </ul>
                        <p>You can play the Harmonic Series on the blue pad.</p>
                        <p>You can change their fundamental by pressing  key onn the red pad; the harmonics on blue pad are instantly recalculated.</p>

                        <p>The program starts with the Harmonic Series of a <span class="monospace">C3</span> (<span class="monospace">130.81Hz</span>). This is the Fundamental Mother</p>
                        <h3 class="mt-3">KEYMAPS</h3>
                        <p>If you want to use an external MIDI keyboard to play this app, you can also choice the position of the FTs and HTs on the keyboard. Under the Piano Keymap” tab in the Settings panel you can select one of the preset keymaps or create your own one.</p>
                        <p>In the  <a href="https://github.com/IndustrieCreative/Harmonicarium/tree/master/keymaps/_mapping-tools" target="_blank" rel="noopener noreferrer">/keymaps/_mapping-tools/</a> folder there is the "<a href="https://github.com/IndustrieCreative/Harmonicarium/raw/master/keymaps/_mapping-tools/keymapping-tool.xlsx" target="_blank" rel="noopener noreferrer">keymapping-tool.xlsx</a>" that can be used to generate keymaps. Other maps can be found on the <a href="https://github.com/IndustrieCreative/Harmonicarium/tree/master/keymaps/n-edx" target="_blank" rel="noopener noreferrer">/keymaps/n-edx/</a> .</p>
                        <p>You can also <a href="https://github.com/IndustrieCreative/Harmonicarium/zipball/master" target="_blank" rel="noopener noreferrer">download the "offline" app</a>.</p>
                        <h3 class="mt-3">FUNDAMENTAL TONES</h3>
                        <p>The FT are like a palette of frequencies available to generate harmonics. The default FT are <span class="monospace">12</span> tone equally tempered (<span class="monospace">12-TET</span> or <span class="monospace">12-EDO</span>). In the Fundamental Tones box you can edit the FT tuning by choosing between equal temperaments and harmonics/subharmonics tones.</p>
                        <p>Since at the moment I'm writing documentation on the <a href="http://harmonicarium.org/" target="_blank" rel="noopener noreferrer">project site</a> and many options are the same of the old Harmonync, you can read <a href="http://harmonync.harmonicarium.org" target="_blank" rel="noopener noreferrer">the old site project</a> to better understand the purpose and the functioning of this program.</p>
                    </div>
                </div>
                
                <div id="HTMLo_creditsObj${id}" class="hum-credits tab-pane fade">
                    <div class="container p-0 mt-3">
                        <img src="assets/img/agpl.png">
                        <h1>Credits</h1>
                        <h2>License</h2>
                        <h3 style="margin-bottom: 0;">Harmonicarium</h2>
                        <p style="margin-top: 0; margin-bottom: 0;">a Dynamic Harmonics Calculator</p>
                        <p style="margin-top: 0;"><span class="monospace">ver. 0.8.1-beta (Mersenne)</span></p>
                        <h3>Copyright (C) 2017-2023 by Walter G. Mantovani</h3>
                        <p>This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>
                        <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.</p>
                        <p>You should have received a copy of the GNU Affero General Public License along with this program. If not, see <a href="https://www.gnu.org/licenses/agpl.txt" target="_blank" rel="noopener noreferrer">http://www.gnu.org/licenses/</a>.</p>
                        <p>armonici.it [at] gmail [dot] com</p>
                        <h2 class="mt-3">Acknowledgements</h2>
                        <p>Thanks to the Internet Global Community.</p>
                        <p>For their support and the long talks about sound, music and ICT, a special thanks goes to:</p>
                        <ul>
                            <li>Stefano Bersanetti (Sound & electrical engineer – Euterpe Synthesizer Laboratories)</li>
                            <li>Giovanni Bortoluzzi (Overtone singer and musician)</li>
                            <li>Simone Righini (goatseo.com)</li>
                            <li>Alberto Ezzu (Musicoterapist and musician)</li>
                            <li>Marco Groppo (Software developer)</li>
                            <li>Alessio Gerace (Software developer)</li>
                        </ul>
                        <p>To let me know about the <a href="http://harmonicarium.org/similar-works/#Amelia_Rosselli" target="_blank" rel="noopener noreferrer">work</a> of the young Amelia Rosselli, thanks to Deborah Ricetti.</p>
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
                            <li>g200kg (WebMidiLink - g200kg.com)</li>
                            <li>Stuart Memo (Qwerty Hancock)</li>
                            <li>Evan Sonderegger (Web Audio Peak Meter)</li>
                        </ul>
                    </div>
                </div>

                <div id="HTMLo_appObj${id}" class="appBox tab-pane fade">
                    <div class="container text-center mt-3 px-xl-5">
                        <p class="text-light mb-0">Under Chrome this App can be installed as a <a class="link-warning" href="https://en.wikipedia.org/wiki/Progressive_web_app" target="_blank" rel="noopener noreferrer">Progressive Web App (PWA)</a> for having a cleaner interface and using it offline.</p>
                    </div>
                    <div class="vstack gap-4 col-xl-6 mx-auto mt-2 mb-4">
                        <button type="button" id="HTMLf_appInstall${id}" class="btn btn-success mx-3">Install this app</button>
                        <a role="button" id="HTMLf_appOpen${id}" class="btn btn-info"
                           href="${window.location.href}" target="_blank">Try to open the App</a>
                        <div class="opacity-75 alert alert-dark text-dark mx-3 logText" role="alert">
                            <h6 class="alert-heading">PWA status:</h6>
                            <div id="HTMLo_appUpdateInfo${id}" style="font-size: 0.8em;"></div>
                        </div>
                        <img src="assets/img/pwa_logo_inverse.png" alt="PWA logo" class="w-50 mx-auto">
                        <button type="button" id="HTMLf_appUpdate${id}" class="btn btn-outline-warning mx-3">
                            Update the App
                        </button>
                        <button type="button"id="HTMLf_appReset${id}" class="btn btn-outline-danger mx-3">
                            Reset the Cache &amp; Update the App
                        </button>
                    
                        <div class="card text-bg-danger bg-opacity-50 mx-3 mt-5">
                          <div class="card-header">Data factory reset</div>
                          <div class="card-body">
                            <h5 class="card-title">DELETE DATABASE</h5>
                            <p class="card-text">If you delete the database, all the PRESETS (and sessions) will be erased.</p>
                            <p class="card-text">The operation cannot be undone.</p>
                            <p class="card-text">Make sure you BACKUP the presets before proceeding!</p>
                          
                            <button type="button"id="HTMLf_user_resetDB_openBtn${id}" class="btn btn-danger w-100">
                                FACTORY RESET...
                            </button>

                          </div>
                        </div>

                    </div>

                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the User Accordion container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    userAccordion(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="userSideContainer" id="HTMLf_user_container${id}">

                <div class="accordion" id="HTMLf_accordion_user${id}">

                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the DiphonicPad Accordion container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dpPadAccordion(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dpPadSideContainer" id="HTMLf_dppad_container${id}">

                <div class="accordion" id="HTMLf_accordion_dppad${id}">

                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the DHC Accordion container, one per DHC.
     *
     * @param {number} id - The DHC instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dhcAccordion(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dhcSideContainer" id="HTMLf_dhc_container${id}">

                <div class="accordion" id="HTMLf_accordion_dhc${id}">

                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get an Accordion Item container.
     *
     * @param {number} id     - The HUM or DHC instance ID.
     * @param {number} idName - The app name.
     * @param {number} title  - The title of the Accordion Item Tab.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    accordionTab(id, idName, title, iconName, humID=false) {
        let template = document.createElement('div');
        if (humID === false) {humID = id}
        template.innerHTML = `
            <div class="accordion-item border-0 mt-2">

                <h2 class="accordion-header" id="HTML_accordionHeading_${idName}${id}">
                  <button class="accordion-button collapsed fw-bold hum-accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#HTML_accordionTab_${idName}${id}" aria-expanded="false" aria-controls="HTML_accordionTab_${idName}${id}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                    <use fill-rule="evenodd" href="#dpIcon-${iconName}${humID}"/>
                  </svg>
                  ${title}
                  </button>
                </h2>

                <!-- <input type="checkbox" id="HTML_accordionChkBox_${idName}${id}" class="accordionChkBox">
                <label class="accordionTabLabel" for="HTML_accordionChkBox_${idName}${id}">${title}</label> -->
                
                <div id="HTML_accordionTab_${idName}${id}" class="accordion-collapse collapse" aria-labelledby="HTML_accordionHeading_${idName}${id}">
                    <!-- data-bs-parent="#accordionExample"> -->
                    <div class="accordion-body p-1 p-sm-2 p-md-3">
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the User Preset Management controls for modal, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    userManagePresets(id) {
        let template = document.createElement('div');
        template.innerHTML = `
        <div id="HTMLo_user_managePreset_controls${id}">
            <div class="position-relative">
                <label for="HTMLi_user_managePreset_select${id}" class="form-label">Stored presets</label>
                <select id="HTMLi_user_managePreset_select${id}" class="form-select" title="Choose a template" aria-label="Select the preset" required></select>
                <div id="HTMLo_user_managePreset_SelectValidation${id}" class="invalid-feedback">
                    *You cannot perform the operation on the "Default" or "Auto-save" presets.
                </div>
            </div>
            <div id="HTMLo_user_managePreset_rename${id}" class="position-relative mt-3 d-none">
                <label for="HTMLi_user_managePreset_newName${id}" class="form-label">New name</label>
                <input id="HTMLi_user_managePreset_newName${id}" type="text" class="form-control" placeholder="Input the preset's new name" aria-label="Inputbox to type the name of the new preset." required>
                <div id="HTMLo_user_managePreset_newNameValidation${id}" class="invalid-feedback">
                    *Please choose a unique and valid name.
                </div>
            </div>
            <button id="HTMLi_user_managePreset_actionBtn${id}" class="btn btn-outline-secondary mt-3 d-none" placeholder="Click to save the new preset" type="button">Perform action</button>
            <div id="HTMLo_user_managePreset_toast${id}" class="toast hum-toast" role="alert" aria-live="assertive" aria-atomic="true" style="position:fixed; bottom:10px; left:10px;">
                <div class="toast-header bg-success bg-gradient text-light">
                    <strong class="me-auto">Action result</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div id="HTMLo_user_managePreset_toastMsg${id}" class="toast-body">
                    Action performed...
                </div>
            </div>

        </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the User DB Reset controls for modal, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    userResetDB(id) {
        let template = document.createElement('div');
        template.innerHTML = `
        <div id="HTMLo_user_resetDB_controls${id}" class="text-center">
            <div class="mb-2">Are you really sure?</div>
            <button id="HTMLi_user_resetDB_confirmBtn${id}" class="btn btn-outline-danger my-3" placeholder="Click to delete the database" type="button">
                OK, RESET THE DB
            </button>
            <div id="HTMLo_user_resetDB_toast${id}" class="toast hum-toast" role="alert" aria-live="assertive" aria-atomic="true" style="position:fixed; bottom:10px; left:10px;">
                <div class="toast-header bg-success bg-gradient text-light">
                    <strong class="me-auto">Action result</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div id="HTMLo_user_resetDB_toastMsg${id}" class="toast-body">
                    Action performed?
                </div>
            </div>
            <!-- <div class="mt-2">This session will be closed automatically at the end of the porcess.</div> -->
            <div class="mt-2 text-danger"><b>WARNING</b>: If you proceed, all the concurrent sessions on different tabs/windows will be closed automatically. This session will be reloaded.</div>
            <!-- <div class="mt-2">The database will be deleted after all active sessions are closed.</div> -->
            <!-- <div class="mt-2">A request to close will appear in the other currently open sessions.</div> -->
        </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the User controls container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    userBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTML_user${id}">
                
                <div class="list-group">

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-xl">
                                <strong class="mb-2">Load</strong>
                                <div><small class="text-muted">Select a preset and click "Load".</small></div>
                            </div>
                            <div class="col-auto">
                                <div class="input-group">
                                    <select id="HTMLi_user_preset_select${id}" class="form-select" aria-label="Select the preset">
                                    </select>
                                    <button id="HTMLi_user_preset_loadBtn${id}" class="btn btn-outline-secondary" aria-label="Click to load the selected preset" type="button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                            <use fill-rule="evenodd" href="#dpIcon-load${id}"/>
                                        </svg>
                                        Load
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="list-group-item" id="HTMLo_user_preset_new${id}">
                        <div class="row align-items-center">
                            <div class="col col-12 col-xl">
                                <strong class="mb-2">Save new</strong>
                                <div><small class="text-muted">Input the name and click "Save new".</small></div>
                            </div>
                            <div class="col">
                                <div class="input-group has-validation">
                                    <input id="HTMLi_user_preset_newName${id}" type="text" class="form-control" placeholder="Input the new preset's name" aria-label="Inputbox to type the name of the new preset.">
                                    <button id="HTMLi_user_preset_saveBtn${id}" class="btn btn-outline-secondary" placeholder="Click to save the new preset" type="button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                            <use fill-rule="evenodd" href="#dpIcon-save${id}"/>
                                        </svg>
                                        Save new
                                    </button>
                                    <div class="invalid-feedback">
                                        The name must be unique and not empty.
                                    </div>
                                    <!-- <button id="HTMLi_user_preset_clearName${id}" class="btn btn-outline-secondary" type="button">Button</button> -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="list-group-item" id="HTMLo_user_preset_manage${id}">
                        <div class="row align-items-center">
                            <div class="col">
                                <strong class="mb-2">Manage</strong>
                                <div><small class="text-muted">Rename or delete a preset.</small></div>
                            </div>
                            <div class="col-auto">
                                <div class="vstack gap-2 mx-auto">
                                    <button id="HTMLi_user_preset_renameBtn${id}" class="btn btn-secondary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                            <use fill-rule="evenodd" href="#dpIcon-edit${id}"/>
                                        </svg>
                                        Rename a preset
                                    </button>
                                    <button id="HTMLi_user_preset_deleteBtn${id}" class="btn btn-secondary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                            <use fill-rule="evenodd" href="#dpIcon-trash${id}"/>
                                        </svg>
                                        Delete a preset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="list-group-item" id="HTMLo_user_preset_import${id}">
                        <div class="row align-items-center">
                            <div class="col col-12 col-xl">
                                <strong class="mb-2">Import</strong>
                                <div><small class="text-muted">Upload a presets file.</small></div>
                            </div>
                            <div class="col-auto">
                                
                                <div class="form-label" id="HTMLi_user_preset_importFileName${id}">
                                    Import a JSON preset file
                                </div>
                                <input type="file" id="HTMLi_user_preset_importFile${id}" accept=".json" class="form-control" aria-label="Select and upload a JSON preset file">
                                
                                <div id="HTMLo_user_preset_import_options${id}" class="d-none">

                                    <div id="HTMLo_user_preset_import_checks${id}" class="mt-2"></div>
                                    <button id="HTMLi_user_preset_importBtn${id}" class="btn btn-outline-secondary mt-2" type="button" aria-label="Click to import the selected presets from JSON file">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                            <use fill-rule="evenodd" href="#dpIcon-upload${id}"/>
                                        </svg>
                                        Import selected presets
                                    </button>

                                    <button id="HTMLi_user_preset_clearBtn${id}" class="btn btn-outline-secondary mt-2" type="button" aria-label="Click to clear and reset the import tool.">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                            <use fill-rule="evenodd" href="#dpIcon-clear${id}"/>
                                        </svg>
                                        Clear
                                    </button>

                                    <!-- TOAST NOTIFICATION -->
                                    <div id="HTMLo_user_preset_import_toast${id}" class="toast hum-toast" role="alert" aria-live="assertive" aria-atomic="true" style="position:fixed; bottom:10px; left:10px;">
                                        <div class="toast-header bg-success bg-gradient text-light">
                                            <strong class="me-auto">Import results</strong>
                                            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                                        </div>
                                        <div id="HTMLo_user_preset_import_toastMsg${id}" class="toast-body">
                                            Presets imported...
                                        </div>
                                    </div>

                                    <div class="form-check form-control-lg form-switch pb-0">
                                        <label for="HTMLi_user_preset_importReverb${id}" class="form-label fs-6" style="vertical-align: text-top;">
                                            Import IR reverb <small>(use device memory)</small>
                                        </label>
                                        <input type="checkbox" id="HTMLi_user_preset_importReverb${id}"
                                               class="form-check-input" role="switch">
                                    </div>
                                
                                </div>

                            </div>
                        </div>
                    </div>
                    <div class="list-group-item" id="HTMLo_user_preset_import${id}">
                        <div class="row align-items-center">
                            <div class="col col-12 col-lg">
                                <strong class="mb-2">Export</strong>
                                <div><small class="text-muted">Download the current presets on a file.</small></div>
                            </div>
                            <div class="col-auto">
                                <div class="row mx-0">
                                    <button id="HTMLi_user_preset_exportBtn${id}" class="btn btn-secondary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-download${id}"/>
                                        </svg>
                                        <span id="HTMLo_user_preset_exportBtnSpinner${id}" class="spinner-border-sm mx-2" role="status" aria-hidden="true"></span>
                                        Export JSON preset file
                                    </button>
                                </div>
                                <div class="row mx-0">
                                    <div class="form-check form-control-lg form-switch pb-0">
                                        <label for="HTMLi_user_preset_exportReverb${id}" class="form-label fs-6" style="vertical-align: text-top;">
                                            Export IR reverb <small>(larger file)</small>
                                        </label>
                                        <input type="checkbox" id="HTMLi_user_preset_exportReverb${id}"
                                               class="form-check-input" role="switch">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

               <div class="accordion mt-3">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="accordionSessionHeading${id}">
                          <button class="accordion-button collapsed hum-section-title" type="button" data-bs-toggle="collapse" data-bs-target="#accordionSession${id}" aria-expanded="false" aria-controls="accordionSession${id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                <use fill-rule="evenodd" href="#dpIcon-sessions${id}"/>
                            </svg>
                            Sessions
                          </button>
                        </h2>

                        <div id="accordionSession${id}" class="accordion-collapse collapse" aria-labelledby="accordionSessionHeading${id}">
                          <div class="accordion-body p-1 p-sm-2 p-md-3">
                            
                            <ul class="list-group">
                                
                                <li class="list-group-item">
                                    <div class="row align-items-center">
                                        <div class="col col-12 col-xl">
                                            <strong class="mb-2">Current session</strong>
                                            <div><small class="text-muted">The session of this window/tab.</small></div>
                                        </div>
                                        <div class="col">
                                            <div id="HTMLo_user_session_current${id}"></div>
                                        </div>
                                    </div>
                                </li>

                                <li class="list-group-item">
                                    <div class="row align-items-center">
                                        <div class="col col-12 col-xxl">
                                            <strong class="mb-2">Rename current session</strong>
                                            <div><small class="text-muted">Change the name of this session.</small></div>
                                        </div>
                                        <div class="col">
                                            <div class="input-group has-validation">
                                                <input id="HTMLi_user_session_newName${id}" type="text" class="form-control" placeholder="Input the new session's name" aria-label="Inputbox to type the new name of the session.">
                                                <button id="HTMLi_user_session_renameBtn${id}" class="btn btn-outline-secondary" placeholder="Click to save the new name" type="button">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                                        <use fill-rule="evenodd" href="#dpIcon-edit${id}"/>
                                                    </svg>
                                                    Rename
                                                </button>
                                                <div class="invalid-feedback">
                                                    The name must be unique and not empty.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                    
                                <li class="list-group-item">
                                    <div class="row align-items-center">
                                        <div class="col col-12 col-xl">
                                            <strong class="mb-2">Concurrent session</strong>
                                            <div><small class="text-muted">Sessions currently open in another windows/tabs.</small></div>
                                        </div>
                                        <div class="col">
                                            <div id="HTMLo_user_session_concurrent${id}"></div>
                                        </div>
                                    </div>
                                </li>

                            </ul>

                          </div>
                        </div>
                    </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Hstack controls container, one per DHC.
     *
     * @param {number} id - The DHC instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    hstackBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTML_hstack${id}">

                <div class="list-group mb-3">

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-sm">
                                <strong class="mb-2">Zoom</strong>
                                <div><small class="text-muted">The table font size.</small></div>
                            </div>
                            <div class="col-auto">
                                <input type="range" min="14" max="30" step="0.1"
                                       id="HTMLf_hstack_zoom${id}"
                                       class="form-range">
                            </div>
                        </div>
                    </div>

                </div>

                <button class="TODO" id="HTMLi_hstackDuplicate${id}">Add another H Stack</button>

                <div id="HTMLo_hstack_fontsize${id}">
                    <div id="HTMLo_hstackHT${id}" class="table-responsive"></div>
                    
                    <hr/>
                    
                    <div class="table-responsive">
                        <table class="table table-sm monospaced">
                            <tbody>
                                <tr id="HTMLo_hstackFTrow${id}" class="hum-hstack-ft-off">
                                    <td width="12%"><span id="HTMLo_hstackFT_tone${id}"></span></td>
                                    <td width="20%"><span id="HTMLo_hstackFT_note${id}"></span></td>
                                    <td width="25%"><span id="HTMLo_hstackFT_cents${id}"></span></td>
                                    <td width="43%"><span id="HTMLo_hstackFT_hz${id}"></span></td>
                                </tr>
                            </tbody>
                            <tfoot class="table-light">
                                <tr>
                                    <th>FT</th>
                                    <th>note</th>
                                    <th>cents</th>
                                    <th>Hz</th>
                                </tr>
                                <tr>
                                    <th colspan="4">Fundamental</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Piano/Keymap controls container, one per DHC.
     *
     * @param {number} id - The DHC instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    pianoBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTML_piano${id}">
    
                <div>The <b>Keymap</b> is used to map FTs and HTs to the <b><i>MIDI controller</i></b>'s keys (input).
                     There are some pre-built maps but you can write your own and upload them.</div>
                <div>The <b>Virtual Piano</b> represents and emulates the current active keymap.</div>
                
                <div class="list-group mb-1 mt-3">

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-lg">
                                <strong class="mb-2">Keymap</strong>
                                <div><small class="text-muted">The controller's tones "palette".</small></div>
                            </div>
                            <div class="col-auto">
                                <div class="input-group">
                                    <select id="HTMLi_controllerKeymapPresets${id}" class="form-select"></select>
                                    <button id="HTMLf_controllerKeymapTableShow${id}" data-bs-toggle="modal" data-bs-target="#HTMLo_controllerKeymapModal${id}" class="btn btn-secondary">Show</button>
                                </div>
                                <input type="file" accept=".hcmap" id="HTMLi_controllerKeymapFile${id}" class="form-control mt-2">
                            </div>
                        </div>
                    </div>

                    <div class="list-group-item">
                        <div class="mb-2">
                            <strong>Virtual Controller piano keyboard</strong>
                        </div>

                        <div class="list-group">

                            <div class="list-group-item p-0 border-0 overflow-scroll">
                                <div id="HTMLo_hancockContainer${id}" class="hmHancockContainer mb-5"></div>
                            </div>

                            <div class="list-group-item border-top">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-lg">
                                        <strong class="mb-2">Keys interval</strong>
                                        <div><small class="text-muted">Which notes to show.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group mb-2">
                                            <label for="HTMLi_piano_offset${id}" class="input-group-text bg-transparent border-0">Offset:</label>
                                            <input type="range" min="0" max="119" step="1"
                                                   id="HTMLi_piano_offset${id}"
                                                   class="form-range h-auto"
                                                   aria-label="...">
                                            <!-- NOTE: 119 (B9) is max startNote for Qwerty Hancock-->
                                        </div>

                                        <div class="input-group">
                                            <label for="HTMLi_piano_range${id}" class="input-group-text bg-transparent border-0">Range:</label>
                                            <input type="range" min="1" max="10" step="1"
                                                   id="HTMLi_piano_range${id}"
                                                   class="form-range h-auto"
                                                   aria-label="...">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-lg">
                                        <strong class="mb-2">Dimensions</strong>
                                        <div><small class="text-muted">How big is the virtual piano.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group mb-2">
                                            <label for="HTMLi_piano_height${id}" class="input-group-text bg-transparent border-0">Height</label>
                                            <input type="range" min="40" max="400" step="20"
                                                   id="HTMLi_piano_height${id}" class="form-range h-auto">
                                        </div>
                                        <div class="input-group">
                                            <label for="HTMLi_piano_width${id}" class="input-group-text bg-transparent border-0">Width</label>
                                            <input type="range" min="300" max="2000" step="50"
                                                   id="HTMLi_piano_width${id}" class="form-range h-auto">
                                            <output name="ageOutputName" id="ageOutputId"></output>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-lg">
                                        <strong class="mb-2">MIDI options</strong>
                                        <div><small class="text-muted">For the notes generated by the virtual piano.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group mb-2">
                                            <label for="HTMLi_piano_velocity${id}" class="input-group-text bg-transparent border-0">Velocity</label>
                                            <input type="range" min="1" max="127" step="1"
                                                   id="HTMLi_piano_velocity${id}" class="form-range h-auto">
                                        </div>
                                        <div class="input-group">
                                            <label for="HTMLi_piano_channel${id}" class="input-group-text bg-transparent border-0">Channel</label>
                                            <input type="number" min="1" max="16" step="1"
                                                   id="HTMLi_piano_channel${id}" class="form-control">
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the DHC controls container, one per DHC.
     *
     * @param {number} id - The DHC instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dhcBox(id, humID) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dhc" id="HTML_dhc${id}">
                <div>DHC stands for <b><i>Dynamic Harmonics Calculator</i></b>,
                that is the computational engine that compiles the frequency tables.
                These are the settings for the UI appearance and other features.</div>
                <div class="list-group mt-3">
                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <strong class="mb-2">UI Hz accuracy</strong>
                                <div><small class="text-muted">Places of decimal precision.</small></div>
                            </div>
                            <div class="col-auto">
                                <input type="number" min="0" max="50" step="1"
                                       id="HTMLi_dhc_hzAccuracy${id}"
                                       class="form-control"
                                       aria-label="Places of decimal precision">
                            </div>
                        </div>
                    </div>
                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <strong class="mb-2">UI Cents accuracy</strong>
                                <div><small class="text-muted">Places of decimal precision.</small></div>
                            </div>
                            <div class="col-auto">
                                <input type="number" min="0" max="50" step="1"
                                       id="HTMLi_dhc_mcAccuracy${id}"
                                       class="form-control"
                                       aria-label="Places of decimal precision">
                            </div>
                        </div>
                    </div>
                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <strong class="mb-2">Enharmonic note naming</strong>
                                <div><small class="text-muted"># or <i>b</i>.</small></div>
                            </div>
                            <div class="col-auto">
                                <select id="HTMLi_dhc_enharmonicNN${id}" class="form-select">
                                    <option value="sharp">Sharp</option>
                                    <option value="flat">Flat</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <strong class="mb-2">Middle C octave</strong>
                                <div><small class="text-muted">In which MIDI octave is the Middle C.</small></div>
                            </div>
                            <div class="col-auto">
                                <div class="input-group">

                                    <label for="HTMLi_dhc_middleC${id}"
                                           class="input-group-text">C</label>
                                    <input type="number" min="-100" max="100" step="1"
                                           id="HTMLi_dhc_middleC${id}"
                                           class="form-control"
                                           aria-label="In which MIDI octave is the Middle C">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" fill="currentColor" viewBox="0 0 16 16">
                                    <use fill-rule="evenodd" href="#dpIcon-piper${humID}"/>
                                </svg>
                                <strong class="mb-2">Piper (HT0) steps</strong>
                                <div><small class="text-muted">Number of HTs the "manual arpeggiator" can store.</small></div>
                            </div>
                            <div class="col-auto">
                                <input type="number" min="1" max=9999 step="1"
                                       id="HTMLi_dhc_piperSteps${id}"
                                       class="form-control"
                                       aria-label="HTs stored">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the DiphonicPad controls container, one per DHC.
     *
     * @param {number} id    - The DHC instance ID.
     * @param {number} humID - The DHC instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dpPadBox(id, humID) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="dpPadBackend" id="HTMLf_dpPadSettings${id}">

                <div class="list-group mb-3">
                    <div class="list-group-item hum-section-title p-2 ps-3">
                        FT Pad
                    </div>
                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-lg">
                                <strong class="mb-2">FT note range</strong>
                                <div><small class="text-muted">The ambitus of your voice.</small></div>
                            </div>
                            <div class="col-auto">

                                <div class="input-group">
                                    <select id="HTMLi_dppad_freq_range_ft${id}" class="form-select"></select>
                                    <button id="HTMLi_dppad_freq_range_custom_save_ft${id}" class="btn btn-secondary" style="display:none;">Save</button>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-lg">
                                <strong class="mb-2">Custom FT note range</strong>
                                <div><small class="text-muted">Frequency expressed in MIDI units with decimals.</small></div>
                            </div>
                            <div class="col-auto">

                                <div class="input-group mb-3">
                                    <label for="HTMLi_dppad_freq_range_custom_max_ft${id}" class="input-group-text bg-transparent border-0">Max:</label>
                                    <input type="number" min="0" max="127" step="1"
                                           id="HTMLi_dppad_freq_range_custom_max_ft${id}"
                                           class="form-control"
                                           aria-label="Note in midicents notation">
                                    <span class="input-group-text">midi#.&cent;</span>
                                    <span id="HTMLo_dppad_freq_range_custom_max_trad_ft${id}" class="input-group-text bg-transparent border-0"></span>
                                </div>

                                <div class="input-group mb-3">
                                    <label for="HTMLi_dppad_freq_range_custom_min_ft${id}" class="input-group-text bg-transparent border-0">Min:</label>
                                    <input type="number" min="0" max="127" step="1"
                                           id="HTMLi_dppad_freq_range_custom_min_ft${id}"
                                           class="form-control"
                                           aria-label="Note in midicents notation"
                                           title="Note in midicents notation">
                                    <span class="input-group-text">midi#.&cent;</span>
                                    <span id="HTMLo_dppad_freq_range_custom_min_trad_ft${id}" class="input-group-text bg-transparent border-0"></span>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <strong class="mb-2">Range copy</strong>
                                <div><small class="text-muted">Copy the range of HT pad to the FT one.</small></div>
                            </div>
                            <div class="col-auto">
                                <button id="HTMLi_dppad_freq_range_copy_to_ft${id}" class="btn btn-secondary">FT same as HT</button>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="list-group mb-3">

                    <div class="list-group-item hum-section-title p-2 ps-3" style="--bs-bg-opacity: .1;">
                        HT Pad
                    </div>

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-lg">
                                <strong class="mb-2">HT frequency range</strong>
                                <div><small class="text-muted">The range you can cover with the formant of your oral cavity..</small></div>
                            </div>
                            <div class="col-auto">

                                <div class="input-group">
                                    <select id="HTMLi_dppad_freq_range_ht${id}" class="form-select"></select>
                                    <button id="HTMLi_dppad_freq_range_custom_save_ht${id}" class="btn btn-secondary" style="display:none;">Save</button>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-lg">
                                <strong class="mb-2">Custom HT frequecy range</strong>
                                <div><small class="text-muted">Notes in scientific pitch nontation (midicents).</small></div>
                            </div>
                            <div class="col-auto">

                                <div class="input-group mb-3">
                                    <label for="HTMLi_dppad_freq_range_custom_max_ht${id}" class="input-group-text bg-transparent border-0">Max:</label>
                                    <input type="number" min="1" max="99999" step="1"
                                           id="HTMLi_dppad_freq_range_custom_max_ht${id}"
                                           class="form-control"
                                           aria-label="Frequency in hertz"
                                           title="Frequency in hertz">
                                    <span class="input-group-text">Hz</span>
                                    <span id="HTMLo_dppad_freq_range_custom_max_trad_ht${id}" class="input-group-text bg-transparent border-0"></span>
                                </div>

                                <div class="input-group mb-3">
                                    <label for="HTMLi_dppad_freq_range_custom_min_ht${id}" class="input-group-text bg-transparent border-0">Min:</label>
                                    <input type="number" min="1" max="99999" step="1"
                                           id="HTMLi_dppad_freq_range_custom_min_ht${id}"
                                           class="form-control"
                                           aria-label="Frequency in hertz"
                                           title="Frequency in hertz">
                                    <span class="input-group-text">Hz</span>
                                    <span id="HTMLo_dppad_freq_range_custom_min_trad_ht${id}" class="input-group-text bg-transparent border-0"></span>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col col-12 col-md">
                                <strong class="mb-2">Range copy</strong>
                                <div><small class="text-muted">Copy the range of FT pad to the HT one.</small></div>
                            </div>
                            <div class="col-auto">

                                <button id="HTMLi_dppad_freq_range_copy_to_ht${id}" class="btn btn-secondary">HT same as FT</button>

                            </div>
                        </div>
                    </div>

                </div>

                <div class="accordion">

                  <div class="accordion-item">
                    <h2 class="accordion-header" id="panelsStayOpen-headingTwo">
                      <button class="accordion-button collapsed hum-section-title" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo">
                        Pads position
                      </button>
                    </h2>

                    <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingTwo">
                      <div class="accordion-body p-1 p-sm-2 p-md-3">
                        <div class="list-group mb-2">

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-rotateView${humID}"/>
                                        </svg>
                                        <strong class="mb-2">Pads orientation</strong>
                                        <div><small class="text-muted">Rotate the entire viewport.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_main_orientation${id}" class="form-select">
                                            <option value="vertical">Vertical</option>
                                            <option value="horizontal">Horizontal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-rotateFT${humID}"/>
                                        </svg>
                                        <strong class="mb-2">FT scale orientation</strong>
                                        <div><small class="text-muted">Rotate only the FT pad.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_scale_orientation_ft${id}" class="form-select">
                                            <option value="vertical">Vertical</option>
                                            <option value="horizontal">Horizontal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-rotateHT${humID}"/>
                                        </svg>
                                        <strong class="mb-2">HT scale orientation</strong>
                                        <div><small class="text-muted">Rotate only the HT pad.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_scale_orientation_ht${id}" class="form-select">
                                            <option value="vertical">Vertical</option>
                                            <option value="horizontal">Horizontal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.3em" height="1.3em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-invertPads${humID}"/>
                                        </svg>
                                        <strong class="mb-2">Pads order</strong>
                                        <div><small class="text-muted">Swap the pads.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_pads_order${id}" class="form-select">
                                            <option value="ftht">FT - HT</option>
                                            <option value="htft">HT - FT</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                        </div>
                      
                      </div>
                    </div>
                  </div>

                  <div class="accordion-item">
                    <h2 class="accordion-header" id="panelsStayOpen-headingThree">
                      <button class="accordion-button collapsed hum-section-title" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseThree" aria-expanded="false" aria-controls="panelsStayOpen-collapseThree">
                        Toolbar
                      </button>
                    </h2>
                    <div id="panelsStayOpen-collapseThree" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingThree">
                      <div class="accordion-body">

                        <div class="list-group mb-2">

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-toolbarPos${humID}"/>
                                        </svg>
                                        <strong class="mb-2">Toolbar orientation</strong>
                                        <div><small class="text-muted">Rotate the toolbar.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_toolbar_orientation${id}" class="form-select">
                                            <option value="longitudinal">Longitudinal</option>
                                            <option value="transversal">Transversal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" fill="currentColor" viewBox="0 0 16 16">
                                            <use fill-rule="evenodd" href="#dpIcon-toolbarPos${humID}"/>
                                        </svg>
                                        <strong class="mb-2">Toolbar position</strong>
                                        <div><small class="text-muted">Place the toolbar before, in between or after the pads.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_toolbar_position${id}" class="form-select">
                                            <option value="0">Pre</option>
                                            <option value="1">Mid</option>
                                            <option value="2">Post</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-lg">
                                        <strong class="mb-2">Toolbar icons</strong>
                                        <div><small class="text-muted">Activate and deactivate the icons in the toolbar.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <ul class="list-group">
                                            <li id="HTMLf_toolbar_icon_menu${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-menu${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Settings</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input disabled id="HTMLi_toolbar_icon_menu_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_rotateView${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-rotateView${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Rotate viewport</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_rotateView_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_toolbarPos${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-toolbarPos${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Toolbar position</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_toolbarPos_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_invertPads${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-invertPads${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Swap/invert pads</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_invertPads_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_rotateFT${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-rotateFT${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Rotate FT pad</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_rotateFT_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_rotateHT${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-rotateHT${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Rotate HT pad</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_rotateHT_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_textIncrease${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-textIncrease${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Increase fonts size</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_textIncrease_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_textDecrease${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-textDecrease${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Decrease fonts size</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_textDecrease_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_piper${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-piper${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Piper button</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_piper_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_panic${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-panic${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Panic (all notes off)</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_panic_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                            <li id="HTMLf_toolbar_icon_openLog${id}" class="list-group-item d-flex justify-content-between">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                    <use fill-rule="evenodd" href="#dpIcon-openLog${humID}"/>
                                                </svg>
                                                <div class="ms-1 me-auto">Open/close the log</div>
                                                <div class="form-check form-switch ms-3">
                                                    <input id="HTMLi_toolbar_icon_openLog_switch${id}" class="form-check-input" type="checkbox" role="switch"/>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>


                        </div>

                      </div>
                    </div>
                  </div>

                  <div class="accordion-item">
                    <h2 class="accordion-header" id="panelsStayOpen-headingFour">
                      <button class="accordion-button collapsed hum-section-title" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseFour" aria-expanded="false" aria-controls="panelsStayOpen-collapseThree">
                        Fonts size
                      </button>
                    </h2>
                    <div id="panelsStayOpen-collapseFour" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingFour">
                      <div class="accordion-body">

                        <div class="list-group mb-2">

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">FT Font size freq. monitor</strong>
                                        <div><small class="text-muted">The frequency at the bottom of the FT pad.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group">
                                            <input type="number" min="1" max="9999" step="1"
                                                   id="HTMLi_dppad_fontsize_hzMonitor_ft${id}"
                                                   class="form-control"
                                                   aria-label="Size in Pixels"
                                                   title="Size in Pixels">
                                            <span class="input-group-text">px</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">FT Font size Keys labels</strong>
                                        <div><small class="text-muted">The note names on the FT keys.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group">
                                            <input type="number" min="1" max="9999" step="1"
                                                   id="HTMLi_dppad_fontsize_keyLabel_ft${id}"
                                                   class="form-control"
                                                   aria-label="Size in percentage"
                                                   title="Size in &percnt;">
                                            <span class="input-group-text">&percnt;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">HT Font size freq. monitor</strong>
                                        <div><small class="text-muted">The note names on the FT keys.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group">
                                            <input type="number" min="1" max="9999" step="1"
                                                   id="HTMLi_dppad_fontsize_hzMonitor_ht${id}"
                                                   class="form-control"
                                                   aria-label="Size in Pixels"
                                                   title="Size in Pixels">
                                            <span class="input-group-text">px</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">HT Font size Keys labels</strong>
                                        <div><small class="text-muted">The note names on the FT keys.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group">
                                            <input type="number" min="1" max="9999" step="1"
                                                   id="HTMLi_dppad_fontsize_keyLabel_ht${id}"
                                                   class="form-control"
                                                   aria-label="Size in percentage"
                                                   title="Size in &percnt;">
                                            <span class="input-group-text">&percnt;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">HT Font size Lines labels</strong>
                                        <div><small class="text-muted">The note names on the FT keys.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="input-group">
                                            <input type="number" min="1" max="9999" step="1"
                                                   id="HTMLi_dppad_fontsize_lineLabel_ht${id}"
                                                   class="form-control"
                                                   aria-label="Size in percentage"
                                                   title="Size in &percnt;">
                                            <span class="input-group-text">&percnt;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                      </div>
                    </div>
                  </div>

                    <!-- <div>
                        <label for="HTMLi_dppad_fontsize_noteMonitor_ft${id}" title="Pixels">FT Font size note monitor</label>
                        <input type="number" min="1" max="100" step="1" id="HTMLi_dppad_fontsize_noteMonitor_ft${id}" title="Pixels">
                    </div> -->
                    <!-- <div>
                        <label for="HTMLi_dppad_fontsize_lineLabel_ft${id}" title="Pixels">FT Font size Lines labels</label>
                        <input type="number" min="1" max="100" step="1" id="HTMLi_dppad_fontsize_lineLabel_ft${id}" title="Pixels">
                    </div> -->
                    <!-- <div>
                        <label for="HTMLi_dppad_fontsize_noteMonitor_ht${id}" title="Pixels">HT Font size note monitor</label>
                        <input type="number" min="1" max="100" step="1" id="HTMLi_dppad_fontsize_noteMonitor_ht${id}" title="Pixels">
                    </div> -->

                  <div class="accordion-item">
                    <h2 class="accordion-header" id="panelsStayOpen-headingFive">
                      <button class="accordion-button collapsed hum-section-title" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseFive" aria-expanded="false" aria-controls="panelsStayOpen-collapseThree">
                        Experimental
                      </button>
                    </h2>
                    <div id="panelsStayOpen-collapseFive" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingFive">
                      <div class="accordion-body">

                        <div class="list-group mb-2">

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">FT scale on HT pad</strong>
                                        <div><small class="text-muted">Show the piano keys along the harmonic series.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="form-check form-control-lg form-switch">
                                            <input type="checkbox" id="HTMLi_dppad_scale_display_ft${id}"
                                                   class="form-check-input" role="switch">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-md">
                                        <strong class="mb-2">HT scale on FT pad</strong>
                                        <div><small class="text-muted">Show the harmonics series along the piano keys.</small></div>
                                    </div>
                                    <div class="col-auto">
                                        <div class="form-check form-control-lg form-switch">
                                            <input type="checkbox" id="HTMLi_dppad_scale_display_ht${id}"
                                                   class="form-check-input" role="switch">
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col col-12 col-lg">
                                        <strong class="mb-2">Render quality</strong>
                                        <div><small class="text-muted">The resolution mode for rendering the HTML Canvas.</small></div>
                                        <div><small class="text-muted"><i>NOTE: It applies only on HiDPI displays.</i></small></div>
                                    </div>
                                    <div class="col-auto">
                                        <select id="HTMLi_dppad_render_mode${id}" class="form-select">
                                            <option value="classic">Low resolution</option>
                                            <option value="hidpi">High resolution</option>
                                        </select>

                                    </div>
                                </div>
                            </div>

                        </div>

                      </div>
                    </div>
                  </div>

                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Synth controls container, one per DHC.
     *
     * @param {number} id    - The DHC instance ID.
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    synthBox(id, humID) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="synth" id="HTML_synth${id}">

                <div class="container-fluid px-0">
                    <div class="row g-2">

                        <div class="col-lg-4">

                            <div class="card h-100">
                              <div class="card-header">
                                Main
                              </div>
                              <div class="card-body">
                                <div class="row">
                                    <div class="col-lg-12 d-flex">
                                        <div class="form-check form-control-lg form-switch mx-auto">
                                            <label for="HTMLi_synth_power${id}" class="form-label">ON/OFF</label>
                                            <input type="checkbox" name="synt" id="HTMLi_synth_power${id}" class="form-check-input" role="switch">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-lg-12 hum-range-param">
                                        <label for="HTMLi_synth_volume${id}" class="hum-justify">&minus; &nbsp;&nbsp;MASTER &nbsp;VOLUME &nbsp;&nbsp;&plus;</label>
                                        <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_volume${id}" class="form-range">
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-lg-12">
                                        <div id="HTMLo_synth_meter${id}" class="hmVUmeter mx-auto"></div>
                                    </div>
                                </div>
                              </div>
                            </div>
                        
                        </div>

                        <div class="col-lg-8">

                            <div class="row g-2">
                                <div class="col-lg-12">
                                    <div class="card mb-2">
                                      <div class="card-header">
                                        ADSR
                                      </div>
                                      <div class="card-body">

                                        <div class="row">
                                            <div class="col-lg-6 hum-range-param">
                                                <label for="HTMLi_synth_attack${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;Attack &nbsp;&nbsp;&plus;</label>
                                                <!-- time (sec) -->
                                                <input type="range" min="0.02" max="5" step="0.01" id="HTMLi_synth_attack${id}" class="form-range">
                                            </div>
                                            <div class="col-lg-6 hum-range-param">
                                                <label for="HTMLi_synth_decay${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;Decay &nbsp;&nbsp;&plus;</label>
                                                <!-- time (timeconstant) -->
                                                <input type="range" min="0.001" max="1" step="0.001" id="HTMLi_synth_decay${id}" class="form-range">
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-6 hum-range-param">
                                                <label for="HTMLi_synth_sustain${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;Sustain &nbsp;&nbsp;&plus;</label>
                                                <!-- gain value amount (0 > 1) -->
                                                <input type="range" min="0.018" max="1" step="0.001" id="HTMLi_synth_sustain${id}" class="form-range">
                                            </div>
                                            <div class="col-lg-6 hum-range-param">
                                                <label for="HTMLi_synth_release${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;Release &nbsp;&nbsp;&plus;</label>
                                                <!-- time (sec) -->
                                                <input type="range" min="0.02" max="5" step="0.01" id="HTMLi_synth_release${id}" class="form-range">
                                            </div>
                                        </div>

                                      </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row g-2">
                                <div class="col-lg-6">

                                    <div class="card">
                                      <div class="card-header">
                                        Fundamental Tone
                                      </div>
                                      <div class="card-body">

                                        <div class="row">
                                            <div class="col-lg-12 hum-range-param">
                                                <label for="HTMLi_synth_volumeFT${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;FT Volume &nbsp;&nbsp;&plus;</label>
                                                <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_volumeFT${id}" class="form-range">
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <label for="HTMLi_synth_waveformFT${id}" class="form-label">FT Waveform</label>
                                                <select id="HTMLi_synth_waveformFT${id}" class="form-select">
                                                    <option value="sine">Sine</option>
                                                    <option value="sawtooth">Sawtooth</option>
                                                    <option value="square">Square</option>
                                                    <option value="triangle">Triangle</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-12 hum-range-param">
                                                <label for="HTMLi_synth_portamento${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;Portamento &nbsp;&nbsp;&plus;</label>
                                                <input type="range" min="0" max="0.20" step="0.01" id="HTMLi_synth_portamento${id}" class="form-range">
                                            </div>
                                        </div>
                                      </div>
                                    </div>

                                </div>
                                <div class="col-lg-6">

                                    <div class="card h-100">
                                      <div class="card-header">
                                        Harmonic Tones
                                      </div>
                                      <div class="card-body">

                                        <div class="row">
                                            <div class="col-lg-12 hum-range-param">
                                                <label for="HTMLi_synth_volumeHT${id}" class="form-label hum-justify">&minus; &nbsp;&nbsp;HTs Volume &nbsp;&nbsp;&plus;</label>
                                                <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_volumeHT${id}" class="form-range">
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <label for="HTMLi_synth_waveformHT${id}" class="form-label">HTs Waveform</label>
                                                <select id="HTMLi_synth_waveformHT${id}" class="form-select">
                                                    <option value="sine">Sine</option>
                                                    <option value="sawtooth">Sawtooth</option>
                                                    <option value="square">Square</option>
                                                    <option value="triangle">Triangle</option>
                                                </select>
                                            </div>
                                        </div>

                                      </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="row g-2">

                        <div class="col-lg-12">

                            <div class="card mt-2">
                              <div class="card-header">
                                Convolution Reverb
                              </div>
                              <div class="card-body">

                                <div class="row">
                                    <div class="col-lg-4 hum-range-param">
                                        <label for="HTMLi_synth_reverb${id}" class="form-label hum-justify">DRY &nbsp;&ndash; &nbsp;Reverb &nbsp;&ndash; &nbsp;WET</label>
                                        <input type="range" min="0" max="1" step="0.01" id="HTMLi_synth_reverb${id}" class="form-range">
                                    </div>
                                    <div class="col-lg-8">
                                      <div class="form-label d-flex align-items-center">IR wave file:&nbsp;
                                        <span id="HTMLo_synth_irFileName${id}" class="fw-bold fst-italic"></span>
                                        <button type="button" id="HTMLi_synth_irFileClearBtn${id}" class="btn btn-sm btn-outline-secondary ms-auto" title="Clear (restore the default reverb)" aria-label="Clear and restore the default reverb.">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                                <use fill-rule="evenodd" href="#dpIcon-clear${humID}"/>
                                            </svg>
                                            <!-- <span class="align-middle">&nbsp;Settings...</span> -->
                                        </button>
                                    </div>
                                      <input type="file" id="HTMLi_synth_irFile${id}" accept=".wav" class="form-control">
                                    </div>
                                </div>

                              </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the MIDI controls container, one per DHC.
     *
     * @param {number} id    - The DHC instance ID.
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    midiBox(id, humID) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="io" id="HTML_io${id}">

                <div class="list-group px-0">
                    
                    <button type="button" data-bs-toggle="modal" data-bs-target="#HTMLf_motPanelModal${id}" class="btn btn-secondary mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" fill="currentColor" viewBox="0 0 24 24">
                            <use fill-rule="evenodd" href="#dpIcon-midi${humID}"/>
                        </svg>
                        <span class="align-middle">&nbsp;Settings...</span>
                    </button>

                    <div class="card mt-3">
                        <div class="card-header">
                            MIDI-Input monitor
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-sm monospaced">
                                    <tr>
                                        <th>Port</th>
                                        <th>Channel</th>
                                        <th>Note #</th>
                                        <th>Velocity</th>
                                    </tr>
                                    <tr>
                                        <td><span id="HTMLo_midiMonitor1_port${id}"></span></td>
                                        <td><span id="HTMLo_midiMonitor1_channel${id}"></span></td>
                                        <td><span id="HTMLo_midiMonitor1_note${id}"></span></td>
                                        <td><span id="HTMLo_midiMonitor1_velocity${id}"></span></td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-3">
                        <div class="card-header">
                            Last pressed keys
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-sm table-hover monospaced">
                                    <tr>
                                        <th width="33%"></th>
                                        <th width="33%">FT</th>
                                        <th width="33%">HT</th>
                                    </tr>
                                    <tr>
                                        <th scope="row">#</th>
                                        <td><span id="HTMLo_monFT_tone${id}"></span></td>
                                        <td><span id="HTMLo_monHT_tone${id}"></span></td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Note</th>
                                        <td><span id="HTMLo_monFT_notename${id}"></span></td>
                                        <td><span id="HTMLo_monHT_notename${id}"></span></td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Hz</th>
                                        <td><span id="HTMLo_monFT_frequency${id}"></span></td>
                                        <td><span id="HTMLo_monHT_frequency${id}"></span></td>
                                    </tr>
                                    <tr>
                                        <th scope="row" title="MIDI.cent">m#.&cent;</th>
                                        <td><span id="HTMLo_monFT_midicents${id}"></span></td>
                                        <td><span id="HTMLo_monHT_midicents${id}"></span></td>
                                    </tr>
                                </table>

                            </div>
                        </div>
                    </div>
                
                </div>

            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Splash modal container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    splashModal(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <!-- The Modal -->
            <div id="HTMLo_splashModal${id}" class="modal fade hum-splash-modal" tabindex="-1"
                     aria-labelledby="Loading..." aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered d-flex justify-content-center">
                    <div class="spinner-border text-light" role="status" style="width: 5rem; height: 5rem;">
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Dialog modal container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dialogModal(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div id="HTMLo_dialogModalContainer${id}" class="modal fade" data-bs-backdrop="static" tabindex="-1" aria-hidden="true">
                <div id="HTMLo_dialogModal${id}" class="modal-dialog modal-dialog-centered d-flex justify-content-center">
                    <div class="modal-content" id="HTMLo_dialogModalContent${id}">
                        <div class="modal-header" id="HTMLo_dialogModalHeader${id}">
                            <h5 class="modal-title" id="HTMLo_dialogModalHeaderTitle${id}">Modal title</h5>
                            <button type="button" class="btn-close" id="HTMLo_dialogModalHeaderCancel${id}" data-bs-dismiss="modal" aria-label="Cancel"></button>
                        </div>
                        <div class="modal-body" id="HTMLo_dialogModalBody${id}"></div>
                        <div class="modal-footer" id="HTMLo_dialogModalFooter${id}">
                            <button type="button" class="btn btn-secondary" id="HTMLo_dialogModalFooterCancel${id}" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="HTMLo_dialogModalFooterOK${id}">OK</button>
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    /**
     * Get the Dialog modal content container, one per Harmonicarium.
     *
     * @param {number} humID - The HUM instance ID.
     * 
     * @returns {HTMLElement} - A `<div>` element.
     */
    dialogModalContents(id) {
        let template = document.createElement('div');
        template.innerHTML = `
        <div id="HTMLo_dialogModalContents${id}" class="d-none">
        </div>`;
        return template.firstElementChild;
    },

    keymapModal(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <!-- The Modal -->
            <div id="HTMLo_controllerKeymapModal${id}" class="modal fade" tabindex="-1"
                 aria-labelledby="Current Keymap table" aria-hidden="true">
                <!-- Modal content -->
                <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
                    <!-- <span id="HTMLf_controllerKeymapClose${id}" class="modalOverlay_close">&times;</span> -->
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Current Controller Keymap table</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="container-fluid" id="HTMLo_controllerKeymapTable${id}">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    midiModal(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <!-- The Modal -->
            <div id="HTMLf_motPanelModal${id}" class="modal fade" tabindex="-1"
                 aria-labelledby="MIDI Settings panel" aria-hidden="true">
                <!-- Modal content -->
                <div class="modal-dialog modal-xl modal-fullscreen-xl-down modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">

                        <div class="modal-header">
                            <h5 class="modal-title">MIDI Input/Output Settings</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div class="modal-body">
                            <div class="container-fluid">
                                <div class="row g-3">
                                    <div class="col-lg-4">
                                        <h4>MIDI IN (controllers)</h4>

                                        <div class="row">
                                            <div class="col-md-12">
                                                
                                                <div class="card mb-3">
                                                  <div class="card-header">
                                                    Input ports
                                                  </div>
                                                  <div class="card-body">
                                                    <div id="HTMLo_inputPorts${id}"></div>
                                                  </div>
                                                </div>

                                                <div class="card mb-3">
                                                  <div class="card-header">
                                                    Receiving options
                                                  </div>

                                                    <div class="list-group list-group-flush">

                                                        <label class="list-group-item">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">Controller's PitchBend range</strong>
                                                                    <div><small class="text-muted mb-0">Sensitivity for MIDI Pitch Bend Change inputs.</small></div>
                                                                </div>
                                                                <div class="col mt-2">
                                                                    <div class="input-group">
                                                                        <input type="number" min="0" max=9600 step="100"
                                                                                id="HTMLi_midiPitchbendRange${id}"
                                                                                class="form-control"
                                                                                aria-label="Pitch Bend input sensitivity">
                                                                        <label for="HTMLi_dhc_middleC${id}"
                                                                                class="input-group-text">cents</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </label>

                                                        <label class="list-group-item">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">Note-Receiving mode</strong>
                                                                    <div><small class="text-muted mb-0">How is it determined whether an input note should play as FT or HT.</small></div>
                                                                </div>
                                                                <div class="col mt-2">

                                                                    <select id="HTMLi_midiReceiveMode${id}" class="form-select">
                                                                        <option value="keymap">Controller Keymapped MIDI note #</option>
                                                                        <option value="tsnap-channel">Tone snapping – Channel</option>
                                                                        <option value="tsnap-divider">Tone snapping – Divider</option>
                                                                        <!-- <option value="velocity1-1">Encoded into Velocity: 1-1</option> -->
                                                                        <!-- <option value="velocity_lin">Encoded into Velocity: Full range linear</option> -->
                                                                        <!-- <option value="velocity_log">Encoded into Velocity: Full range logarithmic</option> -->
                                                                    </select>

                                                                </div>
                                                            </div>
                                                        </label>

                                                        <label class="list-group-item" id="HTMLo_midiTsnapTolerance_box${id}">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">HT snap tolerance</strong>
                                                                    <div><small class="text-muted mb-0">Maximum deviation from the frequency of a HT within which the incoming MIDI note is "snapped" to that HT.</small></div>
                                                                </div>
                                                                <div class="col">

                                                                    <div class="input-group">
                                                                        <input type="number" min="0" max="100" step="1" id="HTMLi_midiTsnapTolerance${id}"
                                                                               class="form-control"
                                                                               aria-label="MIDI cents delta (1 mc = 100 c)">
                                                                        <span class="input-group-text">mc delta</span>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </label>

                                                        <label class="list-group-item" id="HTMLo_midiTsnapChanFT_box${id}">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">FT channel</strong>
                                                                    <div><small class="text-muted mb-0">Channel for receiving FT.</small></div>
                                                                </div>
                                                                <div class="col">

                                                                    <select id="HTMLi_midiTsnapChanFT${id}" class="form-select"
                                                                            aria-label="Channel for receiving FT">
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
                                                            </div>
                                                        </label>

                                                        <label class="list-group-item" id="HTMLo_midiTsnapChanHT_box${id}">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">HTs channel</strong>
                                                                    <div><small class="text-muted mb-0">Channel for receiving HTs.</small></div>
                                                                </div>
                                                                <div class="col">

                                                                    <select id="HTMLi_midiTsnapChanHT${id}" class="form-select"
                                                                            aria-label="Channel for receiving HTs">
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
                                                            </div>
                                                        </label>

                                                        <label class="list-group-item" id="HTMLo_midiTsnapDividerKey_box${id}">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">Divider key</strong>
                                                                    <div><small class="text-muted mb-0">The MIDI note you want to use as divider. Below is taken as FT; equal or above is taken as HT.</small></div>
                                                                </div>
                                                                <div class="col">

                                                                    <input type="number" min="0" max="127" step="1" class="form-control" id="HTMLi_midiTsnapDividerKey${id}"
                                                                           aria-label="MIDI note number">

                                                                </div>
                                                            </div>
                                                        </label>

                                                        <label class="list-group-item" id="HTMLo_midiTsnapDividerChan_box${id}">
                                                            <div class="row row-cols-1 align-items-center">
                                                                <div class="col">
                                                                    <strong class="mb-2">Channel</strong>
                                                                    <div><small class="text-muted mb-0">Channel to use for note-receiving in "divider" mode.</small></div>
                                                                </div>
                                                                <div class="col">

                                                                    <select id="HTMLi_midiTsnapDividerChan${id}" class="form-select"
                                                                            aria-label="Channel to use for receiving">
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
                                                            </div>
                                                        </label>

                                                    </div>

                                                </div>

                                                <div class="card">
                                                  <div class="card-header">
                                                    Input Monitor
                                                  </div>
                                                  <div class="card-body">
                                                    <div class="table-responsive">
                                                        <table class="table table-sm table-hover monospaced">
                                                            <tr>
                                                                <th>Port</th>
                                                                <td><span id="HTMLo_midiMonitor0_port${id}"></span></td>
                                                            </tr>
                                                            <tr>
                                                                <th>Channel</th>
                                                                <td><span id="HTMLo_midiMonitor0_channel${id}"></span></td>
                                                            </tr>

                                                            <tr>
                                                                <th>Note #</th>
                                                                <td><span id="HTMLo_midiMonitor0_note${id}"></span></td>
                                                            </tr>

                                                            <tr>
                                                                <th>Velocity</th>
                                                                <td><span id="HTMLo_midiMonitor0_velocity${id}"></span></td>
                                                            </tr>

                                                        </table>
                                                    </div>
                                                  </div>
                                                </div>

                                            </div>
                                        </div>

                                    </div>

                                    <div class="col-lg-8">
                                        <h4>MIDI OUT (instruments)</h4>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="card mb-3">
                                                  <div class="card-header">
                                                    Output ports
                                                  </div>
                                                  <div class="card-body">
                                                    <div id="HTMLo_outputPorts${id}"></div>
                                                    <div class="list-group" id="HTMLf_webMidiLinkPorts${id}"></div>
                                                  </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="card">
                                                  <div class="card-header">
                                                    MIDI-Out Tuning &nbsp;&ndash; &nbsp;PitchBend method
                                                  </div>
                                                  <div class="card-body">
                                                    <div id="HTMLf_motPanelContent${id}">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>

                </div>
            </div>`;
        return template.firstElementChild;
    },

    visualiserBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="visualiser TODO" id="HTML_visualiser${id}">
                <div>
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
                <div>This is the <b><i>main root</i></b> tone on which all other tones are calculated.</div>
                <div>You can set the FM by <b>MIDI note number</b> (with decimals, that are the cents) OR by <b>frequency</b>.</div>
                <div class="list-group mt-3">

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col-12 col-md">
                                <strong class="mb-2">MIDI Note 0-127</strong>
                            </div>
                            <div class="col-12 col-md-auto">
                                <div class="row align-items-center">
                                    <div class="col-12 col-lg">
                                        <span id="HTMLo_fm_mc_monitor${id}" class="hmFMout"></span>
                                    </div>
                                    <div class="col-12 col-lg-auto">
                                        <div class="input-group">
                                            <input type="number" min="-9999" max="9999" step="1"
                                                   id="HTMLi_fm_mc${id}"
                                                   class="form-control"
                                                   aria-label="Frequency expressed in MIDI units with decimals">
                                            <span class="input-group-text">midi#.&cent;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="list-group-item">
                        <div class="row align-items-center">
                            <div class="col-12 col-md">
                                <strong class="mb-2">Frequency</strong>
                            </div>
                            <div class="col-12 col-md-auto">
                                <div class="row align-items-center">
                                    <div class="col-12 col-lg hmFMout">
                                        <span id="HTMLo_fm_hz_monitor${id}"></span> Hz
                                    </div>
                                    <div class="col-12 col-lg-auto">
                                        <div class="input-group">
                                            <input type="number" min="1" max="99999" step="1"
                                                   id="HTMLi_fm_hz${id}"
                                                   class="form-control"
                                                   aria-label="Note in hertz">
                                            <span class="input-group-text">Hz</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        return template.firstElementChild;
    },

    ftBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="ft" id="HTML_ft${id}">
                <div>This is the <b><i>tuning system</i></b> on which the Fundamental Tones (FTs) "palette" is calculated.</div>
                <div>You can calculate the FTs by <b>Equal Temperaments</b> method or by <b>Harmonic/Subharmonic</b> tones.</div>
                <div>Remember that all computation are based on the <i>Fundamental Mother</i> (FM) frequency.</div>
                <div class="card mt-3">
                  <label class="card-header" for="HTMLf_ftSys_NEDX${id}">
                    <h6 class="d-flex">
                        <input class="me-2" type="radio" name="ftTuningSystem" value="n-edx" id="HTMLf_ftSys_NEDX${id}">
                        <div class="fw-bold">n-EDx (Equal Temperaments)</div>
                    </h6>
                  </label>
                  <div class="card-body" id="HTMLo_ftNEDX${id}">

                    <div class="row align-items-center">

                        <div class="col-md-4 mb-3 text-center">
                            <img src="assets/img/n-edx_light.png" alt="nth root of x" style="width:70px;">
                        </div>
                        <div class="col-md-8">

                            <div class="list-group">

                                <div class="list-group-item">
                                    <div class="row align-items-center">
                                        <div class="col">
                                            <strong class="mb-2">Ratio Unit</strong>
                                        </div>
                                        <div class="col-auto">
                                            <div class="input-group">
                                                <span class="ftNEDX_VarsTxt input-group-text"> x = </span>
                                                <input type="number" min="0" max="9999" step="1"
                                                       id="HTMLi_ftNEDX_unit${id}"
                                                       class="form-control"
                                                       aria-label="...">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="list-group-item">
                                    <div class="row align-items-center">
                                        <div class="col">
                                            <strong class="mb-2">Equal Divisions</strong>
                                        </div>
                                        <div class="col-auto">
                                            <div class="input-group">
                                                <span class="ftNEDX_VarsTxt input-group-text"> n = </span>
                                                <input type="number" min="0" max="9999" step="1"
                                                       id="HTMLi_ftNEDX_division${id}"
                                                       class="form-control"
                                                       aria-label="...">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                            </div>

                        </div>
                    </div>

                  </div>
                </div>

                <div class="card">
                  <label class="card-header" for="HTMLf_ftSys_HSnat${id}">
                    <h6 class="d-flex">
                        <input class="me-2" type="radio" name="ftTuningSystem" value="h_s-nat" id="HTMLf_ftSys_HSnat${id}">
                        <span class="fw-bold">Harm./Sub. Natural (for Diphonic Pad)</span>
                    </h6>
                  </label>
                  <label class="card-header" for="HTMLf_ftSys_HStrans${id}">
                    <h6 class="d-flex">
                        <input class="me-2" type="radio" name="ftTuningSystem" value="h_s-trans" id="HTMLf_ftSys_HStrans${id}">
                        <span class="fw-bold">Harm./Sub. Same Octave (for Keymap)</span>
                    </h6>
                  </label>
                  <div class="card-body" id="HTMLo_ftHS${id}">

                    <div class="row align-items-center">
                        <div class="col col-md col-12 text-center text-md-start">
                            <div class="form-label h6">Transpose</div>
                        </div>
                        <div class="col">
                            <div class="input-group mb-3 align-items-center">
                                <div><span>&divide;2</span></div>
                                <div class="mx-auto">Octave (ratio)</div>
                                <div><span>&times;2</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row align-items-center">
                        <div class="col col-md col-12 text-center text-md-start">
                            <div class="form-label h6">Harmonics</div>
                        </div>
                        <div class="col">
                            <div class="input-group mb-3 align-items-center">
                                <button id="HTMLi_ftHStranspose_h_minus${id}" class="btn btn-secondary">&minus;</button>
                                <span id="HTMLo_ftHStranspose_h_ratio${id}" class="form-control mx-auto text-center"></span>
                                <button id="HTMLi_ftHStranspose_h_plus${id}" class="btn btn-secondary">&plus;</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row align-items-center">
                        <div class="col col-md col-12 text-center text-md-start">
                            <div class="form-label h6">Subharmonics</div>
                        </div>
                        <div class="col">
                            <div class="input-group mb-3 align-items-center">
                                <button id="HTMLi_ftHStranspose_s_minus${id}" class="btn btn-secondary">&minus;</button>
                                <span id="HTMLo_ftHStranspose_s_ratio${id}" class="form-control mx-auto text-center"></span>
                                <button id="HTMLi_ftHStranspose_s_plus${id}" class="btn btn-secondary">&plus;</button>
                            </div>
                        </div>
                    </div>

                  </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },

    htBox(id) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="ht overflow-scroll" id="HTML_ht${id}">
                <div>With this <b><i>transposition tool</i></b> you can move the Harmonic Tones (HTs) up or down by octaves.</div>
                <div>The HTs table includes both <b>Harmonics</b> and <b>Subharmonics</b> tones
                     (note that you may have to transpose up the subharmonics in order to hear them).
                </div>
                <div class="card mt-3">
                    <div class="card-body">

                        <div class="row align-items-center">
                            <div class="col col-md col-12 text-center text-md-start">
                                <div class="form-label h6">Transpose</div>
                            </div>
                            <div class="col">
                                <div class="input-group mb-3 align-items-center">
                                    <div>
                                        <div>Octave</div>
                                        <div>&divide;2</div>
                                    </div>
                                    <div class="mx-auto">
                                        <div>Ratio</div>
                                        <div>&times;r</div>
                                    </div>
                                    <div>
                                        <div>Octave</div>
                                        <div>&times;2</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row align-items-center">
                            <div class="col col-md col-12 text-center text-md-start">
                                <label for="HTMLi_htTranspose_h_ratio${id}" class="form-label h6">Harmonics</label>
                            </div>
                            <div class="col">
                                <div class="input-group mb-3 align-items-center flex-nowrap">
                                    <button id="HTMLi_htTranspose_h_minus${id}" class="btn btn-secondary">&minus;</button>
                                    <input type="number" min="0" max="9999" step="1" id="HTMLi_htTranspose_h_ratio${id}"
                                           class="form-control w-auto m-auto text-center" aria-label="...">
                                    <button id="HTMLi_htTranspose_h_plus${id}" class="btn btn-secondary">&plus;</button>
                                </div>
                            </div>
                        </div>

                        <div class="row align-items-center">
                            <div class="col col-md col-12 text-center text-md-start">
                                <label for="HTMLi_htTranspose_s_ratio${id}" class="form-label h6">Subharmonics</label>
                            </div>
                            <div class="col">
                                <div class="input-group mb-3 align-items-center flex-nowrap">
                                    <button id="HTMLi_htTranspose_s_minus${id}" class="btn btn-secondary">&minus;</button>
                                    <input type="number" min="0" max="9999" step="1" id="HTMLi_htTranspose_s_ratio${id}"
                                           class="form-control w-auto m-auto text-center" aria-label="...">
                                    <button id="HTMLi_htTranspose_s_plus${id}" class="btn btn-secondary">&plus;</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>`;
        return template.firstElementChild;
    },

    webMidiLinkPorts(id, key, humID) {
        let template = document.createElement('div');
        template.innerHTML = `
            <div class="list-group-item p-0 mt-2 rounded-0" id="HTMLf_webMidiLinkLoader${id}" style="display:none;">
                
                    <div class="card border-0 border-bottom border-top border-dark-subtle rounded-0" id="HTMLo_user_preset_new${id}">
                        <div class="card-header px-2 py-0 border-0">
                            <strong class="mb-2">WebMidiLink synth @ Port ${key}: &nbsp;&nbsp;<span id="HTMLf_webMidiLinkStatus${id}" class="webmidilinkNotLoaded">NOT LOADED</span></strong>
                            <div><small class="text-muted mb-0 text-s">Select or type an instrument URL and click "Load".</small></div>
                        </div>
                        <div class="card-body px-2 py-2">
                            <div class="input-group input-group-sm mb-2">
                                <select id="HTMLf_webMidiLinkSynthSelect${id}" class="form-select" aria-label="Select the instrument from the list.">
                                </select>
                            </div>
                            <div class="input-group input-group-sm has-validation">
                                <input id="HTMLf_webMidiLinkUrl${id}" type="text" class="form-control" size="48" placeholder="Input an URL of a WebMidiLink instrument" aria-label="Inputbox to type the instrument URL."/>
                                <button id="HTMLf_webMidiLinkSynthLoad${id}" class="btn btn-outline-secondary" placeholder="Click to load the URL" type="button">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" fill="currentColor" viewBox="0 0 16 16" class="me-2">
                                        <use fill-rule="evenodd" href="#dpIcon-link${humID}"/>
                                    </svg>
                                    Load
                                </button>
                                <div class="invalid-feedback">
                                    It must be a valid URL.
                                </div>
                            </div>
                        </div>
                    </div>

            </div>`;
        return template.firstElementChild;
    },

};