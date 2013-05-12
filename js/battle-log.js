window.lj = lj || {};

lj.battleLog = (function () {
	"use strict";

	var battleLog = document.getElementById('battleLog');

	function printMessage(text) {
		// Create text node and break tag
		var newMessage = document.createTextNode(text),
			br = document.createElement("br");
		// Add new text and tag to HTML
		battleLog.appendChild(newMessage);
		battleLog.appendChild(br);
		// Scroll to bottom of scrollbox
		battleLog.scrollTop = battleLog.scrollHeight - battleLog.clientHeight;
	}

	function acquire(item) {
		var message = "You found " + item + "!";
		printMessage(message);
	}

	function autoEquip(item) {
		var message1 = "It's better than what you have!",
			message2 = "You equipped " + item + "!";
		acquire(item);
		printMessage(message1);
		printMessage(message2);
	}

	function monsterKilled(monster) {
		var message = "Slayed " + monster + "!";
		printMessage(message);
	}

	function heroKilled(monster) {
		var message = "You were killed by " + monster + ":(";
		printMessage(message);
	}

	function levelComplete(level) {
		var message = "You finished level " + level + "! :D";
		printMessage(message);
	}

	function gameComplete() {
		printMessage("You completed the game!");
		printMessage("You are AWESOME! Congratulations!");
	}

	function customMessage(message) {
		printMessage(message);
	}

	return {
		acquire : acquire,
		autoEquip : autoEquip,
		monsterKilled : monsterKilled,
		heroKilled : heroKilled,
		levelComplete : levelComplete,
		gameComplete : gameComplete,
		customMessage : customMessage
	};
}());