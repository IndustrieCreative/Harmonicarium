// 2018 GOOGLE REQUIRES AN ON-SWITCH
window.onload=function(){
	document.querySelector('#userInitA').addEventListener('click', function() {
	  context.resume().then(() => {
	    console.log('Playback resumed successfully');
	  });
	  $('#userInit').slideUp();
	});
}


myAudio.addEventListener('play', function() {
	audioCtx.resume();
});

// IOS9 FIX
$( "#ios9fix" ).on( "touchend mousedown", "#ios9touch", function(e) {
	e.stopPropagation(); e.preventDefault();
	keyNum = 1;
	wsPitch = patch.trig_p[keyNum];
	var voice = new Voice(wsPitch);
    active_voices[keyNum] = voice;
    voice.start();
    active_voices[keyNum].stop();
    delete active_voices[keyNum];
    $("#ios9fix").hide();
});