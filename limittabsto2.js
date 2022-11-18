// 1.2.3 04May2018. Original version 
// 1.2.4 13Aug2018. Changed options.html to make maxtabs a "number"
// 1.2.5 13Aug2018. Added closenew option
// 1.3.0 13Aug2018. Removed some redundant code
// 1.3.1 14Aug2018. Added sound when blocking tab on right hand side
// 1.3.2 16May2019. Added option to disable sounds; sounds both sides
// 					  Will ignore pinned tabs
// 1.3.3 23Jun2019. Added close lru; converted lru/left/right to radio button
// 1.3.4 27Jun2019. Added close newest; also catered to first run (immediately after
//							install), setting defaults appropriately (see onMaxTabsGot, onCloseNewest)
// 1.4.0 28Sep2019. Removed the need to "Save" preference changes
//		    			  Introduced a validation to ensure "number of tabs" do not go below 2
// 1.4.1 03Mar2020. Modified the "fail" sound to a "gong sound"
//		    			  Modified play_sound to avoid repeat sounds when multiple tabs closed
// 1.4.2 07Mar2020. Fixed some bug (not sure what)
// 1.4.3 10Jun2020. Bug in options.js, where "lru" selection would be overridden by "newest" because
//							"newest_getting.then(setnewest, onError);" was being run AFTER
//							"lru_getting.then(setlru, onError);" in restoreOptions()
// 1.4.4 24Jun2020. Under "Newest", a new tab spawned from an existing page (which is not rightmost)
//		 					causes the right-most tab to be killed (instead of the new spawned tab)
// 1.4.5 24Jun2020. close_newest. Modified to use tab.id instead of tab.lastAccessed
// 2.0.0 25Jun2020. Modified to allow for toolbar icon that toggles addon status between
//							active/inactive. See toggle_enable, limitEnabled, manifest.json:browser_action
//						  Also reintroduced TABLIMIT as a global variable (how was it working before?)	
// 2.0.1 26Jun2020. Added option to disable toggle browser action (Roarke started toggling
//							within a day
// 2.0.2 14Jul2020. Added BadgeText to display percent of used tabs. See updateBadgeCount,
//							updateBadgeOnRemove
// 2.0.3 15Jul2020. Added option for BadgeText: percent or total used tabs
//						  Added addonRemoving to fix issue with tabArray.length: when tab killed by
//							user it shows correctly, but when killed by add-on, it shows 1 greater
// 2.1.0 15Sep2020. Added option "currentonly" (options.html, options.js too) -- earlier, limit
//							would apply to each FF window independent of others. currentonly (default=
//							true) when set to false, would apply the limit globally
// 2.1.1 21Sep2020. Modified Math.round to Math.floor (so that 100% displays only when really at the limit)
// 2.2.0 23May2021. Added windowId to allow badgecount to update correctly. 
// 2.2.1 25May2021. Added sound options -- gong, buzzer, doorbell, beep. Changed lt.js, options.js, options.html
// 2.2.2 27May2021. Modified options.js to play the sound selected
// 2.2.3 29May2021. doToggle-false. Cycle through all windows, using windowId
// 2.2.4 30May2021. close_lru, close_right, close_newest. Fixed bug arising when multiple windows exist
// 2.2.5 31May2021. cleanjs.sh. An FF reviewer suggested that I remove comments to speed js loading
//			created cleanjs.sh, applied it to .js files, then redeployed. No functional changes
// 2.2.6 27Jul2022. Added resetmax. If enabled, resets TABLIMIT to current number when
//			extension is toggled from disabled to enabled


//********************************************
// Use cleanjs.sh to remove comments before submission
//********************************************

var TABLIMIT = 2;
var DEFAULTTABLIMIT = 2;
var SOUND_LAST_PLAYED = Date.now()-2000;
var limitEnabled = true;
var currentonly = true;
var addonRemoving = false;
var windowId = null;
var tabRemoved = false;

function toggle_enable() {
	// console.log ("toggle_enable called...");
	var getting = browser.storage.local.get("notoggle");
	getting.then(doToggle, onError);
}

async function doToggle (result) {
	if (! result.notoggle) {
		if (limitEnabled) {
			// console.log ("limitEnabled set to true");
			limitEnabled = false;
			browser.storage.local.set({ limit_enabled: false });
			browser.browserAction.setIcon({path: "icons/disabled.png"});

			// 29May21. Cycle through all windows
    			var gettingAll = browser.windows.getAll();
    			gettingAll.then((windows) => {
      			for (var item of windows) {
				browser.browserAction.setBadgeText({text: "", windowId: item.id});
      				}
    			});

			
		} else {
			limitEnabled = true;
			browser.storage.local.set({ limit_enabled: true });
			browser.browserAction.setIcon({path: "icons/enabled.png"});


			var totalTabs = 0;
			// First get the number of tabs in other windows
			if (! currentonly) {
				let tabArray = await browser.tabs.query({currentWindow: false, pinned: false});
				totalTabs = tabArray.length;
			}

			// Now retrieve the number of tabs in the current window
			let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
			totalTabs = totalTabs + tabArray.length;

			// 27Jul22. If setmax enabled, set TABLIMIT to current number of tabs
			let result = await browser.storage.local.get("resetmax");

			if (result.resetmax) {
				TABLIMIT = totalTabs;
				browser.storage.local.set({ maxtabs: TABLIMIT });
				
			}

			updateBadgeCount(totalTabs, TABLIMIT);

		}
	}
}

function onError(error) {
	console.log(`Error: ${error}`);
}

async function updateBadgeCount(actualCount, limitTabs) {
			
	let myWindow = await browser.windows.getCurrent();
	windowId = myWindow.id;

	// 21Sep2020. Modified next line
	// let percent = Math.round(actualCount * 100 / limitTabs);
	let percent = Math.floor(actualCount * 100 / limitTabs);

	let result = await browser.storage.local.get("showtabs");
	// console.log ("updateBadgeCount. actualCount = " + actualCount);

	// console.log ("updateBadgeCount. windowId = " + windowId);
	// Need to show %, rather than "tabs/limit" as max. of 4 characters
	//		appear to be allowed in BadgeText

	// 24May21. In theory, setBadgeText with windowId = null (or windowId excluded) should update all windows;
	//	in practice, it's flaky. Consequently, irrespective of whether the limit is currentonly or across
	//	all windows, only the current window is updated. Switching to the other window would show an incorrect
	//	number (when limit is global) until a tab is added/deleted
	if (result.showtabs) {
		browser.browserAction.setBadgeText({text: actualCount.toString(), windowId: windowId });
	} else {
		browser.browserAction.setBadgeText({text: percent.toString() + "%", windowId: windowId});
	}
	if (percent >= 90) {
		browser.browserAction.setBadgeTextColor({color: "red", windowId});
		browser.browserAction.setBadgeBackgroundColor({color: "lightgray", windowId: windowId});
	} else {
		browser.browserAction.setBadgeTextColor({color: "black", windowId});
		browser.browserAction.setBadgeBackgroundColor({color: "lightgray", windowId: windowId});
	}
	
}

function onTabsChanged() {
	if (tabRemoved) {
		var getting = browser.storage.local.get("limit_enabled");
		getting.then(isEnabled, onError);
	} else {
		var getting = browser.storage.local.get("firststart");
		getting.then(firststart, onError);
	}
}

function firststart(mt_item) {
	// When the extension is first installed (firststart is null) and the aim is to
	//		set maxtabs (the tab limit) to the current number of tabs

	if (mt_item.firststart == null) {

		// 31May2021. Added code to set all defaults the first time

		browser.storage.local.set({ firststart: 1 });

		browser.storage.local.set({ currentonly: true });

		browser.storage.local.set({ buzzer: true });
		browser.storage.local.set({ gong: false });
		browser.storage.local.set({ doorbell: false });
		browser.storage.local.set({ nosound: false });

		browser.storage.local.set({ newest: true });
		browser.storage.local.set({ lru: false });
		browser.storage.local.set({ left: false });
		browser.storage.local.set({ right: false });

		browser.storage.local.set({ limit_enabled: true });

		browser.storage.local.set({ showtabs: false });

		browser.storage.local.set({ notoggle: false });

		// Sets the limit to the current number of tabs. User can subsequently change it
		first_limit();
	} else {
		var getting = browser.storage.local.get("limit_enabled");
		getting.then(isEnabled, onError);
	}
}

// Sets the limit to the current number of tabs. User can subsequently change it
async function first_limit() {
	// console.log ("Inside first_limit");

	let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
	if (tabArray.length > DEFAULTTABLIMIT ) {
		browser.storage.local.set({ maxtabs: tabArray.length });
		TABLIMIT=tabArray.length;

	} else {
		browser.storage.local.set({ maxtabs: DEFAULTTABLIMIT  });
		TABLIMIT=DEFAULTTABLIMIT;
	}

// 	console.log ("first_limit. tabArray.length= " + tabArray.length);
	updateBadgeCount(tabArray.length, TABLIMIT);
}

function isEnabled(result) {
	// console.log ("isEnabled called...");
	limitEnabled = result.limit_enabled;

	// console.log ("isEnabled.limitEnabled = " + limitEnabled);

	if (limitEnabled == null) {
		// console.log ("isEnabled. Setting limit_enabled ");

		browser.storage.local.set({ limit_enabled: true});
		limitEnabled = true;
	}
	if (limitEnabled) {
		var getting = browser.storage.local.get("currentonly");
		getting.then(setCurrentOnly, onError);
	}
}

function setCurrentOnly(result) {
	// console.log ("setCurrentOnly. result.currentonly = " + result.currentonly);
	currentonly = result.currentonly;
	if (currentonly == null) {
		// console.log ("setCurrentOnly. Setting currentonly ");

		browser.storage.local.set({ currentonly: true});
		currentonly = true;
	}
 	
	// console.log ("setCurrentOnly. currentonly = " + currentonly);
	// if (currentonly) {
		// set window Id
		var gettingCurrent = browser.windows.getCurrent();
		gettingCurrent.then(setCurrentId, onError);
}

function setCurrentId (result) {
	windowId = result.id;
	// console.log ("setCurrentId. windowId = " + result.id);
	doStuff();
}

async function doStuff() {
	let resultTabs = await browser.storage.local.get("maxtabs");
	TABLIMIT = resultTabs.maxtabs;

	if (TABLIMIT < 1) {
		TABLIMIT = 2;
	}

	// console.log ("doStuff. currentonly = " + currentonly);

	var totalTabs = 0;
	// First get the number of tabs in other windows
	if (! currentonly) {
		let tabArray = await browser.tabs.query({currentWindow: false, pinned: false});
		totalTabs = tabArray.length;
		// console.log ("doStuff. totalTabs (false) = " + totalTabs);
	}

	// Now retrieve the number of tabs in the current window
	let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
	totalTabs = totalTabs + tabArray.length;
	// console.log ("doStuff. totalTabs (all) = " + totalTabs);
	
	if (totalTabs > TABLIMIT) {
		var getting = browser.storage.local.get("newest" || true);
		getting.then(onCloseNewest, onError);
	} else {
		// For some reason, when manually removing a tab, the function gets called
		//		before the tab is removed, hence need to subtract 1
		if (tabRemoved) {

			// For some reason, when manually removing a tab, the function gets called
			//		before the tab is removed, hence need to subtract 1
			if (! addonRemoving) {
				totalTabs = totalTabs-1
			}
			addonRemoving = false;
		} 
		updateBadgeCount(totalTabs, TABLIMIT);
	}
}

function onCloseNewest(result) {
	var myResult = result.newest;
	if (typeof result.newest == "undefined") {
		myResult = true;
	}
	// console.log ("onCloseNewest.myResult = " + myResult );

	if (myResult) {
		close_newest();
	} else { 
		var getting = browser.storage.local.get("lru");
		getting.then(onCloseLru, onError);
	}
}

function onCloseLru(result) {
	if (result.lru) {
		close_lru();
	} else { 
		var getting = browser.storage.local.get("right");
		getting.then(onCloseRight, onError);
	}
}

function onCloseRight(result) {
	if (result.right) {
		right_close();
	} else { 
		left_close();
	}

}

async function close_newest () {
	var totalTabs = 0;
	// First get the number of tabs in other windows
	if (! currentonly) {
		let tabArray = await browser.tabs.query({currentWindow: false, pinned: false});
		totalTabs = tabArray.length;
	}

	// console.log ("close_newest. totalTabs (other) =" + totalTabs);

	// Now retrieve the number of tabs in the current window
	let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
	totalTabs = totalTabs + tabArray.length;

	// console.log ("close_newest. totalTabs (all) =" + totalTabs);
	
	if (totalTabs > TABLIMIT) {
		// var getting = browser.storage.local.get("nosound");
		// getting.then(play_sound, onError);
		play_sound();

		// Code to close the newest, based on tab.id
		var index=0, i;
		var newestid=tabArray[0].id;

		for (i = 0; i < tabArray.length; i++) { 
 			// console.log ("close_newest. i=" + i 
 			//  	+ "  lastAccessed=" + tabArray[i].lastAccessed 
 			//  	+ "  Id =" + tabArray[i].id);

			if (tabArray[i].id > newestid) {
				index = i;
				newestid = tabArray[i].id;

				// console.log ("close_newest. index changed to =" + i);
			}
		}

		await browser.tabs.remove(tabArray[index].id);
		close_newest();
		addonRemoving = true;
		// console.log ("close_newest. Inside for. tabArray.length =" + tabArray.length);
	} 
}

async function close_lru () {
	var totalTabs = 0;
	// First get the number of tabs in other windows
	if (! currentonly) {
		let tabArray = await browser.tabs.query({currentWindow: false, pinned: false});
		totalTabs = tabArray.length;
	}

	// Now retrieve the number of tabs in the current window
	let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
	totalTabs = totalTabs + tabArray.length;
	
	if (totalTabs > TABLIMIT) {
		// var getting = browser.storage.local.get("nosound");
		// getting.then(play_sound, onError);
		play_sound();


		// Code to close the least recently used
		var oldesttime=tabArray[0].lastAccessed, index=0, i;

		for (i = 0; i < tabArray.length-1; i++) { 

			//console.log ("close_lru. i=" + i + "  lastAccessed=" + tabArray[i].lastAccessed);

			if (tabArray[i].lastAccessed < oldesttime) {
				index = i;
				oldesttime = tabArray[i].lastAccessed;
				
				// console.log ("close_lru. index changed to =" + i);
			}
		}

		await browser.tabs.remove(tabArray[index].id);
		close_lru();
		addonRemoving = true;
	} 
}

async function right_close () {
	var totalTabs = 0;
	// First get the number of tabs in other windows
	if (! currentonly) {
		let tabArray = await browser.tabs.query({currentWindow: false, pinned: false});
		totalTabs = tabArray.length;
	}

	// Now retrieve the number of tabs in the current window
	let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
	totalTabs = totalTabs + tabArray.length;
	
	if (totalTabs > TABLIMIT) {
		// var getting = browser.storage.local.get("nosound");
		// getting.then(play_sound, onError);
		play_sound();

		await browser.tabs.remove(tabArray[tabArray.length-1].id);
		right_close();
		addonRemoving = true;
	} 
}

async function left_close () {
	var totalTabs = 0;
	// First get the number of tabs in other windows
	if (! currentonly) {
		let tabArray = await browser.tabs.query({currentWindow: false, pinned: false});
		totalTabs = tabArray.length;
	}

	// Now retrieve the number of tabs in the current window
	let tabArray = await browser.tabs.query({currentWindow: true, pinned: false});
	totalTabs = totalTabs + tabArray.length;
	
	if (totalTabs > TABLIMIT) {
		// var getting = browser.storage.local.get("nosound");
		// getting.then(play_sound, onError);
		play_sound();

		await browser.tabs.remove(tabArray[0].id);
		left_close();
		addonRemoving = true;
	} 
}

async function play_sound () {
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

		if ((Date.now() - SOUND_LAST_PLAYED) > 2000) {
			var audio = new Audio(audiofile);
			audio.play();
			SOUND_LAST_PLAYED = Date.now();
		}
	}
	// console.log("audiofile = " + audiofile);
	
}

browser.browserAction.setTitle({title: "Toggle Limit Tabs"});
browser.browserAction.onClicked.addListener(toggle_enable);
browser.tabs.onCreated.addListener(function (tab) {
  tabRemoved = false;
  onTabsChanged ();
});
// browser.tabs.onRemoved.addListener(updateBadgeOnRemove);
browser.tabs.onRemoved.addListener(function (tab) {
  tabRemoved = true;
  onTabsChanged ();
});
