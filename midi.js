MIDI.init = function() {
  var context = null;
  var instrument = null;
  var noteList = [];
  if (typeof(MIDI) === "undefined") window.MIDI = {};
  MIDI.pianoKeyOffset = 21;
  MIDI.soundBuffer = {};
  MIDI.instruments = [];
  // note conversions
  MIDI.keyToNote = {}; // C8  == 108
  MIDI.noteToKey = {}; // 108 ==  C8
  var soundFont = MIDI.soundFont;
  var total = 0;
  var count = 0;
  var startTime = 0;
  var tempo = 80; // BPM (beats per minute)
  var fouthNoteTime = 60 / tempo;

  var triggerEvent = function(el, eventName, detail) {
    var event = document.createEvent("CustomEvent");
    event.initCustomEvent(eventName, true, true, detail);
    el.dispatchEvent(event);
  };
  
  // init
  (function () {
	try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch (e) {
      alert('Web Audio API is not supported in this browser. Chrome is strongly recommended!');
    }
	
    startTime = context.currentTime + 0.100;
    var A0 = 0x15; // first note
	var C8 = 0x6C; // last note
	var number2key = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
	for (var n = A0; n <= C8; n++) {
	  var octave = (n - 12) / 12 >> 0;
	  var name = number2key[n % 12] + octave;
	  MIDI.keyToNote[name] = n;
	  MIDI.noteToKey[n] = name;
	}
    for (var type in soundFont) {
      var notes = soundFont[type];
      MIDI.soundBuffer[type] = {};
      if (instrument == null)
        instrument = MIDI.soundBuffer[type];
      MIDI.instruments.push(type);
      for (var key in notes) {
        var base64 = notes[key].split(',')[1];
        var data = Base64Binary.decodeArrayBuffer(base64);
	    (function(note) {
          total ++;
          context.decodeAudioData(data, function(buffer) {
            MIDI.soundBuffer[type][note] = buffer;
            // trigger event;
	  	    count ++;
		    if(count == total)
              triggerEvent(document, "midi:init");
          })
        })(MIDI.keyToNote[key]);
      }
  }
  })();
  
  MIDI.playSound = function(note, time) {
	if(callback)
	  setTimeout(callback, time * 1000);
    if(note == null || note < MIDI.pianoKeyOffset )
	  return;
    var buffer = instrument[note];
    var source = context.createBufferSource(); 
    source.buffer = buffer; 
    source.connect(context.destination); 
    source.start(time);
  }
  
  MIDI.setInstrument = function(type) {
    instrument = MIDI.soundBuffer[type];
    return MIDI;
  }

  MIDI.push = function(note, level) {
    if(typeof level == "undefined")
	  level = 1;
    noteList.push([note, level]);
	return MIDI;
  }
  
  MIDI.pushNotes = function(notes) {
    for(var i in notes){
	  var item = notes[i];
	  if(item instanceof Array){
	    noteList.push(item);
	  } else {
	    noteList.push([item, 1]);
	  }
	}
	return MIDI;
  }
  
  var timer;
  MIDI.start = function(note) {
	var time = startTime;
	var pre;
	for(var i in noteList){
	  var note = noteList[i];
	  if(i!=0)
	    time += fouthNoteTime * pre[1]
	  MIDI.playSound(note[0], time);
	  pre = note;
	}
	return MIDI;
  }
  
  var callback = null;
  MIDI.setCallback = function(value){
    callback = value;
	return MIDI;
  }
  
  MIDI.pause = function(){
    if(timer)
      clearTimeout(timer);
	return MIDI;
  }
  
  MIDI.stop = function(){
    if(timer)
      clearTimeout(timer);
	noteList = [];
	return MIDI;
  }
  
  // set beats per minute
  MIDI.setTempo = function(newTempo){
    fouthNoteTime = 60 / newTempo;
	return MIDI;
  }
  
};

window.addEventListener('load', MIDI.init, false);