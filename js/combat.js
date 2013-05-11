window.lj = lj || {};

lj.hero = (function() {
	'use strict'

	var currentDir = null,
		currentTile = [0,0]; // row, col

	var stepModifiers = {
		left: [0, -1],
		right: [0, 1],
		up: [-1, 0],
		down: [1, 0]
	}

	// The hero enters the room...
	function enter(door) {
		// Get the starting tile from realm.js (get door tile)
		var tile = [0, 0];
		place(tile);
		setupListeners();
	}

	// The hero exits the room...
	function exit() {

	}

	function setupListeners() {
		lj.addKeyListener('left arrow', function() { step('left') });
		lj.addKeyListener('right arrow', function() { step('right') });
		lj.addKeyListener('up arrow', function() { step('up') });
		lj.addKeyListener('down arrow', function() { step('down') });
	}

	// Is step in dir restriced
	function isRestricted(dir) {
		// Need room info from realm.js

		return false;
	}

	// PRIVATE: place the hero in the room
	function place(tile) {
		// Figure out in what direction to face based on tile #
		currentTile = tile;
	}

	// Makes the hero step in a direction
	// Directions: left, right, up, down
	function step(dir) {
		var row, col;
		// Is the hero turned in the right direction?
		if (dir !== currentDir) turn(dir);

		// Any restrictions, then don't move?
		if (isRestricted(dir)) return;

		// Make the step. Need to relate to the grid
		row = currentTile[0] + stepModifiers[dir][0];
		col = currentTile[1] + stepModifiers[dir][1];
		currentTile = [row, col];

		console.log('Hero moved to:', currentTile, currentDir);
	}

	// Turn the hero into the direction
	function turn(dir) {
		// Update the hero sprite
		currentDir = dir;
	}

	// Public API
	return {
		enter: enter,
		step: step,
		exit: exit
	}
}());