window.lj = lj || {};

lj.hero = (function() {
	'use strict'

	var currentDir = null,
		room = null,
		currentTile = [5,9]; // col, row

	var stepModifiers = {
		left: [0, -1],
		right: [0, 1],
		up: [-1, 0],
		down: [1, 0]
	}

	setupListeners();

	// The hero enters the room...
	function enter(door) {
		// Get the starting tile from realm.js (get door tile)
		var currentRoom = lj.realm.getCurrentRoom();
		room = lj.realm.getRoom(currentRoom);
		console.log(currentRoom);
		place(currentTile);
		console.log(currentTile);
	}

	// The hero exits the room...
	function exit(door) {

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
		var spriteImage = lj.getImage('dungeon-sprite.png');
		// Figure out in what direction to face based on tile #
		currentTile = tile;
		lj.context.drawImage(
			spriteImage, 4*32, 2*32,32,32,tile[0]*32,tile[1]*32,32,32);
	}

	function move(tile) {
		var type = room[tile[0]][tile[1]];
		var spriteImage = lj.getImage('dungeon-sprite.png');
		// Find out what type of tile we're moving to
		switch (type) {
			case '#': return; break;
			case ' ':
				currentTile = tile;
				console.log('Hero moved to:', currentTile, currentDir);
				lj.context.drawImage(
					spriteImage, 4*32, 2*32,32,32,tile[0]*32,tile[1]*32,32,32);
				break;
			case 'D':
				currentTile[1] = 0;
				lj.scene.exit(type);
				break;
			case 'U':
				currentTile[1] = 10;
				lj.scene.exit(type);
				break;
			case 'L':
				currentTile[0] = 10;
				lj.scene.exit(type);
				break;
			case 'R':
				currentTile[0] = 0;
				lj.scene.exit(type);
				break;
			default:
				interact(type);
		}
	}

	function interact(type) {
		console.log('Our here will interact with', type);
	}

	// Makes the hero step in a direction
	// Directions: left, right, up, down
	function step(dir) {
		var row, col, nextTile;
		// Is the hero turned in the right direction?
		if (dir !== currentDir) turn(dir);

		// Find new coordinates. Need to relate to the grid
		row = currentTile[1] + stepModifiers[dir][0];
		col = currentTile[0] + stepModifiers[dir][1];

		nextTile = [col, row];

		// Any restrictions, then don't move?
		move(nextTile);
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