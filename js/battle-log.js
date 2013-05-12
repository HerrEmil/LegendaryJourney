window.lj = lj || {};

lj.battleLog = (function () {
	"use strict";

	var battleLog = document.getElementById('battleLog');

	function printMessage(message) {
		var messageContainer = document.createElement("span"),
			br = document.createElement("br");

		// Put message in message container
		messageContainer.innerHTML = message;

		// Add message and break to HTML
		battleLog.appendChild(messageContainer);
		battleLog.appendChild(br);
		// Scroll to bottom of scrollbox
		battleLog.scrollTop = battleLog.scrollHeight - battleLog.clientHeight;
	}

	function clear() {
		console.log("clear");
		battleLog.innerHTML = "";
	}

	function acquire(item, quality) {
		var message = 'You found <span class="' + quality + '">' + item + '</span>!';
		printMessage(message);
	}

	function autoEquip(item, quality) {
		var message = 'You found and equipped <span class="' + quality + '">' + item + '</span>!';
		printMessage(message);
	}

	function monsterKilled(monster) {
		var message = "Slayed " + monster + "!";
		printMessage(message);
	}

	function heroKilled(monster) {
		var message1 = "You were killed by " + monster + " :(",
			message2 = '<br/><div class="btn restart">Try again!</div>';
		printMessage(message1);
		printMessage(message2);
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
		customMessage : customMessage,
		clear : clear
	};
}());