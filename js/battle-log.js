window.lj = lj || {};

lj.battleLog = (function () {
	"use strict";

	var div = document.getElementById('battleLog');

	function scrollDown() {
		div.scrollTop = div.scrollHeight - div.clientHeight;
	}

	function addText(text) {
		// Insert text in HTML
		scrollDown();
	}

	return {
		addText : addText,
		scrollDown : scrollDown
	};
}());