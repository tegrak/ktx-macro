const playSound = () => {
	if (typeof (audio) != "undefined" && audio) {
		audio.pause();
		document.body.removeChild(audio);
		audio = null;
	}
	audio = document.createElement('audio');
	document.body.appendChild(audio);
	audio.autoplay = true;
	audio.src = chrome.runtime.getURL('tada.mp3');
	audio.play();
};

const sendTelegramMessage = () => {
	chrome.storage.local.get(
		['ktx-macro-bot-token', 'ktx-macro-chat-id'],
		function (result) {
			const msg = encodeURI('예약을 시도하였습니다. 예약을 확인해주세요.');
			const url = `https://api.telegram.org/bot${result['ktx-macro-bot-token']}/sendmessage?chat_id=${result['ktx-macro-chat-id']}&text=${msg}`;

			fetch(url);
		}
	);
}

const removeMacroTab = (tabid) => {
	chrome.storage.local.get(["ktx-macro-tabs"],
		function (result) {
			let tabs = result["ktx-macro-tabs"];
			console.log('remove tab tabs: ' + tabs + ', tabid: ' + tabid);
			if (typeof(tabs) != "object" || !Array.isArray(tabs))
				tabs = [];

			var index = tabs.indexOf(tabid);
			if (index != -1) {
				tabs.splice(index, 1);
				chrome.storage.local.set({"ktx-macro-tabs": tabs});
			}
		}
	);
}

const checkMacroTabs = () => {
	var tabid;
	for (tabid of tabs) {
		chrome.tabs.get(tabid, function (tab) {
			if (chrome.runtime.lastError) {
				console.log(chrome.runtime.lastError);
			}
			if (!tab) {
				removeTab(tabid);
			}
		});
	}
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	//console.log('message: ' + message);
	if (message && message.type == 'successTicketing') {
		//playSound();
		sendTelegramMessage();
		sendResponse(true);
	}
	else if (message && message.type == 'tabId') {
		sendResponse(sender.tab.id);
	}
});

chrome.tabs.onRemoved.addListener(function (tabid, removed) {
	removeMacroTab(tabid);
});