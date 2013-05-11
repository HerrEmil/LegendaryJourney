window.lj = lj || {};

// ## Setting and updating the current scene of the game

lj.scene = (function() {

	// Get the opposite door (for when entering and exiting)
	function oppositeDoor(door) {
		var opposites = {
			LEFT: 'RIGHT',
			RIGHT: 'LEFT',
			UP: 'DOWN',
			DOWN: 'UP'
		}

		return opposites[door];
	}

	// Enter a room
	function enter(door) {
		// Paint scene

		// Animate hero entering from door
		lj.hero.enter(door);
	}

	// Exit the current room through a door
	// Door can be "UP", "DOWN", "LEFT", "RIGHT"
	function exit(door) {

		lj.hero.exit();

		// Fade scene

		// When exiting hero is also entering the next room (or realm)
		enter(oppositeDoor(door));
	}

}());