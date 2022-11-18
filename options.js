// 2.2.2 27May2021. Play the sound selected. See playsound()

var DEFAULTTABLIMIT = 2;
var currentonly = true;
var resetmax = false;
var SOUND_LAST_PLAYED = Date.now()-1000;

function onError(error) {
	console.log(`Error: ${error}`);
}

function onstart() {
	// console.log ("onstart called...");
	var getting = browser.storage.local.get("firststart");
	getting.then(firststart_options, onError);
}

// When the extension is first installed (firststart is null) and the aim is to
//		set maxtabs (the tab limit) to the current number of tabs
function firststart_options(mt_item) {
	if (mt_item.firststart == null) {

		console.log ("Inside getting.firststart_options = null");
		browser.storage.local.set({ firststart: 1 });

		// First time around, set "enabled" to true (used in other .js)
		// console.log ("firststart_options. Setting limit_enabled to true");
		browser.storage.local.set({ limit_enabled: true });

		// Sets the limit to the current number of tabs. User can subsequently change it
		first_limit_options();
	} else {
		// console.log ("Inside getting.firststart_options = restoring");
		restoreOptions();
	}
}

// Sets the limit to the current number of tabs. User can subsequently change it
async function first_limit_options() {
		// console.log ("Inside first_limit_options");

		let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
		// console.log ("first_limit_options. tabArray.length = " + tabArray.length);

		if (tabArray.length > DEFAULTTABLIMIT ) {
			// console.log ("first_limit_options. Setting maxtabs to " + tabArray.length);
			browser.storage.local.set({ maxtabs: tabArray.length });
		} else {
			// console.log ("first_limit_options. Setting maxtabs to " + DEFAULTTABLIMIT);
			browser.storage.local.set({ maxtabs: DEFAULTTABLIMIT  });
		}
		restoreOptions();
}

function saveMaxTabs() {
	// Don't let tabs reduce below 2
	if (document.querySelector("#maxtabs").value >= 2) {
		browser.storage.local.set({ maxtabs: document.querySelector("#maxtabs").value });
	} else {
		document.querySelector("#maxtabs").value = 2;
	}
}

function saveCurrentOnly() {
	browser.storage.local.set({ currentonly: document.getElementById("currentonly").checked });
	console.log ("saveCurrentOnly() called. currentonly = " + document.getElementById("currentonly").checked);
}

function saveResetMax() {
	browser.storage.local.set({ resetmax: document.getElementById("resetmax").checked });
	console.log ("saveResetMax() called. resetmax = " + document.getElementById("resetmax").checked);
}


function saveSound() {
	browser.storage.local.set({ buzzer: document.getElementById("buzzer").checked });
	browser.storage.local.set({ gong: document.getElementById("gong").checked });
	browser.storage.local.set({ doorbell: document.getElementById("doorbell").checked });
	browser.storage.local.set({ beep: document.getElementById("beep").checked });
	browser.storage.local.set({ nosound: document.getElementById("nosound").checked });
	playsound();
}

async function playsound() {
	var audiofile = "";
	
	var arbit = await browser.storage.local.get("nosound");
	if (arbit.nosound) {
		// Do nothing
		// console.log("Within nosound if stmt");
	} else {
		arbit = await browser.storage.local.get("buzzer");
		if (arbit.buzzer) {
			audiofile = 'buzzer.ogg';
		} 
		arbit = await browser.storage.local.get("gong");
		if (arbit.gong) {
			audiofile = 'gong.ogg';
		}
		arbit = await browser.storage.local.get("doorbell");
		if (arbit.doorbell) {
			audiofile = 'doorbell.ogg';
		} 
		arbit = await browser.storage.local.get("beep");
		if (arbit.beep) {
			audiofile = 'beep.ogg';
		} 

		if ((Date.now() - SOUND_LAST_PLAYED) > 1000) {
			var audio = new Audio(audiofile);
			audio.play();
			SOUND_LAST_PLAYED = Date.now();
		}
	}
}

function saveToggle() {
	browser.storage.local.set({ notoggle: document.getElementById("notoggle").checked });
}

function saveShowTabs() {
	browser.storage.local.set({ showtabs: document.getElementById("showtabs").checked });
}

function saveWhichTab() {
	browser.storage.local.set({ lru: document.getElementById("lru").checked });
	browser.storage.local.set({ newest: document.getElementById("newest").checked });
	browser.storage.local.set({ left: document.getElementById("left").checked });
	browser.storage.local.set({ right: document.getElementById("right").checked });
}

function restoreOptions() {
	// console.log ("restoreOptions() called ");

	function setmaxtabs(result) {
		// console.log ("restoreOptions().setmaxtabs() called " + result.maxtabs);
		document.querySelector("#maxtabs").value = result.maxtabs || 2;
	}

	function setcurrentonly(result) {
		document.getElementById("currentonly").checked = result.currentonly || true;
	}

	function setresetmax(result) {
		document.getElementById("resetmax").checked = result.resetmax || false;
	}

	function setnewest(result) {
		document.getElementById("newest").checked = result.newest || true;
	}

	function setlru(result) {
		document.getElementById("lru").checked = result.lru;
	}

	function setleft(result) {
		document.getElementById("left").checked = result.left;
	}

	function setright(result) {
		document.getElementById("right").checked = result.right;
	}

	function setbuzzer(result) {
		document.getElementById("buzzer").checked = result.buzzer || true;
	}

	function setdoorbell(result) {
		document.getElementById("doorbell").checked = result.doorbell;
	}

	function setgong(result) {
		document.getElementById("gong").checked = result.gong;
	}

	function setbeep(result) {
		document.getElementById("beep").checked = result.beep;
	}

	function setnosound(result) {
		document.getElementById("nosound").checked = result.nosound;
	}

	function setToggle(result) {
		document.getElementById("notoggle").checked = result.notoggle;
	}

	function setShowTabs(result) {
		document.getElementById("showtabs").checked = result.showtabs;
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	mt_getting = browser.storage.local.get("maxtabs");
	mt_getting.then(setmaxtabs, onError);

	currentonly_getting = browser.storage.local.get("currentonly");
	currentonly_getting.then(setcurrentonly, onError);

	resetmax_getting = browser.storage.local.get("resetmax");
	resetmax_getting.then(setresetmax, onError);

	newest_getting = browser.storage.local.get("newest");
	newest_getting.then(setnewest, onError);

	lru_getting = browser.storage.local.get("lru");
	lru_getting.then(setlru, onError);

	left_getting = browser.storage.local.get("left");
	left_getting.then(setleft, onError);

	right_getting = browser.storage.local.get("right");
	right_getting.then(setright, onError);

	doorbell_getting = browser.storage.local.get("doorbell");
	doorbell_getting.then(setdoorbell, onError);

	gong_getting = browser.storage.local.get("gong");
	gong_getting.then(setgong, onError);

	beep_getting = browser.storage.local.get("beep");
	beep_getting.then(setbeep, onError);

	buzzer_getting = browser.storage.local.get("buzzer");
	buzzer_getting.then(setbuzzer, onError);

	nosound_getting = browser.storage.local.get("nosound");
	nosound_getting.then(setnosound, onError);

	cs_getting = browser.storage.local.get("notoggle");
	cs_getting.then(setToggle, onError);

	cs_getting = browser.storage.local.get("showtabs");
	cs_getting.then(setShowTabs, onError);

}

document.addEventListener("DOMContentLoaded", onstart);

document.getElementById("currentonly").addEventListener("change", saveCurrentOnly);
document.getElementById("resetmax").addEventListener("change", saveResetMax);
document.getElementById("buzzer").addEventListener("change", saveSound);
document.getElementById("doorbell").addEventListener("change", saveSound);
document.getElementById("gong").addEventListener("change", saveSound);
document.getElementById("beep").addEventListener("change", saveSound);
document.getElementById("nosound").addEventListener("change", saveSound);
document.getElementById("notoggle").addEventListener("change", saveToggle);
document.getElementById("showtabs").addEventListener("change", saveShowTabs);
document.getElementById("maxtabs").addEventListener("change", saveMaxTabs);
document.getElementById("lru").addEventListener("change", saveWhichTab);
document.getElementById("newest").addEventListener("change", saveWhichTab);
document.getElementById("left").addEventListener("change", saveWhichTab);
document.getElementById("right").addEventListener("change", saveWhichTab);
