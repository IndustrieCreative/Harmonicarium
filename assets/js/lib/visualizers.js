 /**
 * WEB AUDIO VISUALIZERS
 * Mod from Voice-change-o-matic by MDN
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
 * https://github.com/mdn/voice-change-o-matic
 * original license CC0 1.0 Universal (Public Domain)
 */
 
"use strict";

// Set up visualizer context for visualizer
var icVisCanvas = document.querySelector('.visualizer');
var icVisCanvasCtx = icVisCanvas.getContext("2d");

// Get the container width
var intendedWidth = document.querySelector('.synthVisualiser').clientWidth;
icVisCanvas.setAttribute('width', intendedWidth);

// Get the visualiser type selector
var icVisSelect = document.getElementById("HTMLi_visualiser");

// ??
var drawVisual = null;

// The visualiser
function icVisualize() {
    var WIDTH = icVisCanvas.width;
    var HEIGHT = icVisCanvas.height;

    var visualSetting = icVisSelect.value;
    console.log(visualSetting);

    if (visualSetting === "sinewave") {
        icAnalyser.fftSize = 2048;
        var bufferLength = icAnalyser.fftSize;
        console.log(bufferLength);
        var dataArray = new Uint8Array(bufferLength);

        icVisCanvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        var draw = function() {

            drawVisual = requestAnimationFrame(draw);

            icAnalyser.getByteTimeDomainData(dataArray);

            icVisCanvasCtx.fillStyle = 'rgb(200, 200, 200)';
            icVisCanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            icVisCanvasCtx.lineWidth = 2;
            icVisCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            icVisCanvasCtx.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {

                var v = dataArray[i] / 128.0;
                var y = v * HEIGHT / 2;

                if (i === 0) {
                    icVisCanvasCtx.moveTo(x, y);
                } else {
                    icVisCanvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            icVisCanvasCtx.lineTo(icVisCanvas.width, icVisCanvas.height / 2);
            icVisCanvasCtx.stroke();
        };

        draw();

    } else if (visualSetting === "frequencybars") {
        icAnalyser.fftSize = 512;
        var bufferLengthAlt = icAnalyser.frequencyBinCount;
        console.log(bufferLengthAlt);
        var dataArrayAlt = new Uint8Array(bufferLengthAlt);

        icVisCanvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        var drawAlt = function() {
            drawVisual = requestAnimationFrame(drawAlt);

            icAnalyser.getByteFrequencyData(dataArrayAlt);

            icVisCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
            icVisCanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLengthAlt) / 1.5;
            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLengthAlt; i++) {
                barHeight = dataArrayAlt[i];

                icVisCanvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
                icVisCanvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }
        };

        drawAlt();

    } else if (visualSetting === "off") {
        icVisCanvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        icVisCanvasCtx.fillStyle = "rgb(54, 51, 66)";
        icVisCanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }
}

// Add an event listener to change visualize
icVisSelect.onchange = function() {
    window.cancelAnimationFrame(drawVisual);
    icVisualize();
};