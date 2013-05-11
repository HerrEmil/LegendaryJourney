window.lj = lj || {};

// ## Setting and updating the current scene of the game

var spriteMap = {
	'#': [18, 42], // wall
	' ': [12, 42],
	' ': [] // floor
}

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
		var spriteImage = lj.getImage('dungeon-sprite.png'),
			room = lj.realm.getCurrentRoom();

		// Paint scene
		for (var rowCtr=0;rowCtr<11;rowCtr++) {
			for (var colCtr=0;colCtr<11;colCtr++){
				var tileId = spriteMap[room[rowCtr][colCtr]];
				var sourceX = Math.floor(tileId % 8) *32;
				var sourceY = Math.floor(tileId / 8) *32;
				lj.context.drawImage(spriteImage, sourceX, sourceY,32,32,colCtr*32,rowCtr*32,32,32);
			}
		}

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