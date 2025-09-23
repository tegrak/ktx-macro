let CHECKBOX_COLUMN = [0, 1];
let CHECKBOX_COLUMN_NAME = ["일반실", "특실"];
const MAIN_PAGE = 0;
const FAMILY_PAGE = 1;
let RESERVE_BUTTON = {};
let PAGE = MAIN_PAGE;
let checkboxLastClickPos = {"row": -1, "column": -1};

const getTableResult = () => {
	return document.querySelectorAll(".tckList:not(#ktx-macro-header):not(.ktx-macro-control)");
};

const getTableResultColumn = (row, column) => {
	return getTableResult()[row].querySelectorAll(".price_box")[column];
};

const getTableResultCheckbox = (objRow, column) => {
	return objRow.querySelectorAll(".price_box")[column].querySelector(`.ktx-macro-checkbox`);
};

const createHeaderCheckbox = () => {
	const ul = document.querySelector(".tckWrap > ul");
	let header = `
		<li id="ktx-macro-header" class="tckList">
			<div class="tck_inner">
				<div class="info_inner"></div>
	`;
	for (let col of CHECKBOX_COLUMN) {
		header += `
				<div class="price_box">
					<div class="inner">
						<label>
							<input type="checkbox" class="ktx-macro-header-checkbox" data-column="${col}">${CHECKBOX_COLUMN_NAME[col]}
						</label>
					</div>
				</div>
		`;
	}
	header += `
			</div>
		</li>
	`;
	ul.insertAdjacentHTML("afterbegin", header);
};

const setHeaderCheckboxEvent = () => {
	const headerCheckBoxes = document.querySelectorAll("#ktx-macro-header .ktx-macro-header-checkbox");
	//console.log("headerCheckBoxes: ", headerCheckBoxes);
	for (let checkbox of headerCheckBoxes) {
		checkbox.addEventListener('change', changeHeaderCheckbox);
	}
};

const changeHeaderCheckbox = (event) => {
	const rows = getTableResult();
	const child_num = event.target.dataset.column;
	
	if (!rows || !rows.length) {
		return;
	}

	rows.forEach((o, row) => {
		const priceBoxes = o.querySelectorAll(".price_box");
		if (priceBoxes == null || priceBoxes.length < child_num) {
			return;
		}
		const item = priceBoxes[child_num].querySelector(".ktx-macro-checkbox");
		item.checked = event.target.checked;
	});
	saveCheckboxState();
};

const createCheckbox = () => {
	const rows = getTableResult();

	if (!rows || !rows.length) {
		return;
	}

	rows.forEach((o, row) => {
		const priceBoxes = o.querySelectorAll(".price_box");
		if (priceBoxes == null || priceBoxes.length == 0) {
			return;
		}
		for (var col of CHECKBOX_COLUMN) {
			const item = priceBoxes[col].querySelector(".inner")
			if (!item) {
				continue;
			}
			const available = priceBoxes[col].querySelector(".txt_price");
			const soldOut = priceBoxes[col].querySelector(".tck_etc_use");
			if (!available && !soldOut) {
				continue;
			}
			item.insertAdjacentHTML("beforeend", getCheckboxTemplate(uid++, row, col));
		}
	});
};

const isChecked = uid => {
	const checkedItemsStr = getTabStorageItem("checkedItems");
	const checkedItems = checkedItemsStr ? checkedItemsStr.split(",") : [];

	if (!checkedItems.length) {
		return false;
	}

	return checkedItems.includes(String(uid));
};

const isLogin = () => !!document.querySelectorAll(".btnGoLogout").length;

const getCheckboxTemplate = (uid, row, column) => {
	if (!uid) {
		return;
	}

	return `
		<input type="checkbox" class="ktx-macro-checkbox" 
			value="${uid}" ${isChecked(uid) && "checked"}
			data-row="${row}" data-column="${column}">
	`;
};

const setCheckboxEvent = () => {
	const $checkboxes = document.querySelectorAll(".ktx-macro-checkbox");

	for (let i = 0; i < $checkboxes.length; i++) {
		$checkboxes[i].addEventListener("click", clickCheckbox);
	}
};

const setEscapeEvent = () => {
	window.addEventListener("keydown", e => {
		if (e.key === "Escape") {
			macroStop();
		}
	});
};

const macroStart = () => {
	if (!isLogin()) {
		if (confirm("로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?")) {
			location.href = LOGIN_PAGE_URI;
		}
		return;
	}

	if (!getTabStorageItem("checkedItems")) {
		alert("선택 된 항목이 없습니다.\n1개 이상 선택해주세요.");
		return;
	}

	alert(
		"자동 예매를 시작합니다.\n" +
			"예매 성공 후 20분내에 결제하지 않을 경우 자동으로 예매가 취소됩니다.\n" +
			"자동 예매 종료는 '자동 예매 정지' 혹은 esc키를 눌러주세요."
	);

	setTabStorageItem("macro", "on");

	reload();
};

const macroStop = () => {
	alert("자동 예매를 종료합니다.");
	removeTabStorageItem("macro");
	removeTabStorageItem("checkedItems");

	reload();
};

const macro = () => {
	let uid = 0;
	let $row;
	const $rows = getTableResult();
	const len = $rows.length;
	let succeeded = false;
	let $td, $a;

	if (!len) {
		return;
	}

	for (let i = 0; i < len && !succeeded; i++) {
		$row = $rows[i];
		for (let col of CHECKBOX_COLUMN) {
			if (!isChecked(++uid)) {
				continue;
			}
			$td = getTableResultColumn(i, col);
			$td.style.backgroundColor = "#f03e3e";
			const available = $td.querySelector(".txt_price");
			if (available == null) {
				continue;
			}
			$a = $td.querySelector(`a`);
			let $button;
			for (let img of RESERVE_BUTTON[col]) {
				//console.log(img);
				//src starts with img
				$button = $td.querySelector('[src^="' + img + '"]');
				if ($button) {
					break;
				}
			}

			if ($a) {
				new Audio(chrome.runtime.getURL("tada.mp3")).play();
				removeTabStorageItem("macro");
				chrome.runtime.sendMessage({ type: "successTicketing" });
				//inject_click($button.closest("a"));
				inject_click($a);
				succeeded = true;
				break;
			}
		}
		if (succeeded) {
			break;
		}
	}

	if (!succeeded)
		setTimeout(reload, 1200);
};

const reload = () => {
	inject_click(document.querySelector(".tab_container .ktx button"));
	initialize();
};

const inject_click = (obj) => {
	console.log('inject_click: ' + obj);
	var s = document.createElement('script');
	obj.id = 'ktx-macro-click';

	s.src = chrome.runtime.getURL('inject_click.js');
	s.onload = function () {
		this.remove();
	};
	(document.head || document.documentElement).appendChild(s);
};

//nonstop 팝업 자동 닫기
const closeNonstopPopup = () => {

	if (!document.querySelector(".btn_blue_ang"))
		return;

	var s = document.createElement('script');
	s.innerHTML = `
		var btn_blue_ang = document.querySelector('.btn_blue_ang');
		if (btn_blue_ang.text.indexOf('예매 계속 진행하기') != -1) {
			console.log('close popup');
			setTimeout(f_close, 1000);
		};
	`;
	document.body.appendChild(s);
};

//nonstop 팝업 무시
const ignoreNonstopPopup = () => {
	var s = document.createElement('script');
	s.innerHTML = `
		if (typeof(Nopeople2) == 'function') {
			console.log('disable Nopeople2');
			const originNopeople2 = Nopeople2;
			Nopeople2 = function (intPsrm, intIdxNo, iAddInfo4, callback) {
				console.log('remove h_nonstop_msg. ' + train[intIdxNo].h_nonstop_msg);
				train[intIdxNo].h_nonstop_msg = '';
				return originNopeople2(intPsrm, intIdxNo, iAddInfo4, callback);
			}
		}
	`;
	document.body.appendChild(s);
}

//인원 확인 컨펌 무시
const ignoreConfirmPeople = () => {
	var s = document.createElement('script');
	s.innerHTML = `
		const origin_confirm = confirm;
		confirm = function (message) {
			console.log('confirm: ' + message);
			if (message.indexOf('맞습니까') != -1) {
				return true;
			}
			return origin_confirm(message);
		}
	`;
	document.body.appendChild(s);
}

//일일 팝업 무시
const ignoreDailyPopup = () => {
	var s = document.createElement('script');
	s.innerHTML = `
		if (typeof(openGwangjuShuttleDialog) == 'function') {
			console.log('disable openGwangjuShuttleDialog');
			openGwangjuShuttleDialog = function () {};
		}
	`;
	document.body.appendChild(s);
}

const clickCheckbox = (event) => {
	var multi_check = false;
	const curr_row = Number(event.target.dataset.row);
	const curr_col = Number(event.target.dataset.column);
	const prev_row = Number(checkboxLastClickPos.row);
	const prev_col = Number(checkboxLastClickPos.column);
	console.log('checkbox row=' + event.target.dataset.row + ' column=' + event.target.dataset.column);
	do {
		if (!event.shiftKey || event.ctrlKey || event.altKey)
			break;
		if (prev_row == -1 || prev_col == -1)
			break;
		if (curr_col != prev_col)
			break;
		if (curr_row == prev_row)
			break;

		const objRows = getTableResult();
		var objCol;
		var start, end;
		multi_check = true;

		if (curr_row > prev_row) {
			start = prev_row;
			end = curr_row - 1;
		}
		else {
			start = curr_row + 1;
			end = prev_row;
		}

		for (var i = start; i <= end; i++) {
			//console.log('row=' + i + ', column=' + event.target.dataset.column);
			objCol = getTableResultCheckbox(objRows[i], curr_col);
			objCol.checked = event.target.checked;
		}
	}
	while (0);

	if (!multi_check) {
		checkboxLastClickPos.row = curr_row;
		checkboxLastClickPos.column = curr_col;
		if (prev_row != -1 && prev_col != -1)
			getTableResultColumn(prev_row, prev_col).style.backgroundColor = "";
		getTableResultColumn(curr_row, curr_col).style.backgroundColor = "#ccccff";
	}
	saveCheckboxState();
};

const saveCheckboxState = () => {
	let checkedItems = [];
	const $checkboxes = document.querySelectorAll(".ktx-macro-checkbox");

	for (let i = 0; i < $checkboxes.length; i++) {
		if ($checkboxes[i].checked) {
			checkedItems.push($checkboxes[i].value);
		}
	}

	if (checkedItems.length) {
		setTabStorageItem("checkedItems", checkedItems.join(","));
	} else {
		removeTabStorageItem("checkedItems");
	}
};

const checkAllCheckbox = () => {
	var i;
	var list = document.querySelectorAll(".ktx-macro-checkbox");
	for (i = 0; i < list.length; i++) {
		list[i].checked = true;
	}
	saveCheckboxState();
};

const inject = () => {
	var s= document.createElement('script');
	s.src = chrome.runtime.getURL('inject.js');
	s.setAttribute('value', 'passed?');
	s.onload = function () {
		console.log('inject onload');
		this.remove();
	};
	(document.head || document.documentElement).appendChild(s);
};

const inject_nonstop_popup = () => {
	var s= document.createElement('script');
	s.src = chrome.runtime.getURL('inject_nonstop_popup.js');
	s.onload = function () {
		console.log('inject_nonstop_popup onload');
		this.remove();
	};
	(document.head || document.documentElement).appendChild(s);
};


const initialize = () => {
	console.log("tabId: " + tabId);

	const ticketList = getTableResult();

	if (ticketList == null || ticketList.length == 0) {
		window.setTimeout(initialize, 1000);
		return;
	}

	const isStarted = getTabStorageItem("macro") == "on";

	if (isStarted) {
		if (reloadTimeoutID) {
			console.log('stop reload timer ' + reloadTimeoutID);
			window.clearTimeout(reloadTimeoutID);
			reloadTimeoutID = null;
		}
		macro();
		setEscapeEvent();
	} else {
		removeTabStorageItem("checkedItems");
	}
	
	document.querySelector(".tckWrap > ul").insertAdjacentHTML(
		"beforeend",
		`
			<li class="tckList ktx-macro-control">
				<button type="button" class="ktx-macro-button">
					${isStarted ? "자동 예매 정지" : "자동 예매 시작"}
				</button>
				<button type="button" class="check-all-button">
					전체 선택
				</button>
			</li>
		`
	);
	
	document
		.querySelector(".ktx-macro-button")
		.addEventListener("click", isStarted ? macroStop : macroStart);

	document
		.querySelector(".check-all-button")
		.addEventListener("click", checkAllCheckbox);

	createHeaderCheckbox();
	createCheckbox();
	setHeaderCheckboxEvent();
	setCheckboxEvent();
	inject();
};

(() => {
	console.log("initialize content.js");
	disableEventListners();

	if (location.href.startsWith(POPUP_URI)) {
		inject_nonstop_popup();
		return;
	}
	else if (!document.querySelector(".tckWrap")) {
		return;
	}

	if (location.href.startsWith(MAIN_URI)) {
		PAGE = MAIN_PAGE;
		CHECKBOX_COLUMN = [0, 1];
		CHECKBOX_COLUMN_NAME = ["일반실", "특실"];
		RESERVE_BUTTON[5] = [
			"/docs/2007/img/common/icon_apm_bl.gif", 
			"/docs/2007/img/common/icon_apm_rd.gif"
		];
		RESERVE_BUTTON[6] = [
			"/docs/2007/img/common/icon_apm_bl.gif", 
			"/docs/2007/img/common/icon_apm_rd.gif"
		];
		RESERVE_BUTTON[10] = [
			"/docs/2007/img/common/icon_wait.gif"
		];
	} 
	else if (location.href.startsWith(FAMILY_URI)) {
		PAGE = FAMILY_PAGE;
		CHECKBOX_COLUMN = [5];
		RESERVE_BUTTON[5] = [
			"/docs/2007/img/persent/btn"
		];
	}
	else {
		return;
	}

	chrome.runtime.sendMessage(
		{type: 'tabId'}, 
		function (result) {
			tabId = result;
			addMacroTab(tabId);
			initialize();
		}
	);
})();
