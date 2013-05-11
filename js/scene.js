window.lj = lj || {};

// ## Setting and updating the current scene of the game

var floor = [14, 49]

var spriteMap = {
	'#': [18, 44], // wall
	' ': floor, // floor
	'L': floor, // Door leading Left
	'U': floor, // Door leading Up
	'R': floor, // Door leading Right
	'D': floor, // Door leading Down

	'a': floor, // Monster type a
	'b': floor, // Monster type b
	'c': floor, // Monster type c
	'd': floor, // ...
	'z': floor, // Monster type z

	'1': floor, // Chest type 1
	'2': floor, // Chest type 2
	'3': floor, // ...

	'9': floor // Chest type 9 
}

var roomModifier = {
	'D': 3,
	'U': -3,
	'L': -1,
	'R': 1
}

lj.scene = (function() {

	var currentRoom = null;

	// Get the opposite door (for when entering and exiting)
	function oppositeDoor(door) {
		var opposites = {
			L: 'R',
			R: 'L',
			U: 'D',
			D: 'U'
		}

		return opposites[door];
	}

	// Enter a room
	function enter(door) {
		var spriteImage = lj.getImage('dungeon-sprite.png'),
			room = null;

		if (!currentRoom) currentRoom = lj.realm.getCurrentRoom();

		room = lj.realm.getRoom(currentRoom);

		// Paint scene
		for (var rowCtr = 0; rowCtr < 11; rowCtr++) {
			for (var colCtr = 0; colCtr < 11; colCtr++) {
				var tileId = spriteMap[room[colCtr][rowCtr]],
					sourceX = Math.floor(tileId[1]) * 32,
					sourceY = Math.floor(tileId[0]) * 32;
				lj.context.drawImage(spriteImage, sourceX, sourceY,32,32,colCtr*32,rowCtr*32,32,32);
			}
		}

		// Animate hero entering from door
		lj.hero.enter(door);
	}

	// Exit the current room through a door
	// Door can be "U", "D", "L", "R"
	function exit(door) {

		currentRoom = currentRoom + roomModifier[door];
		console.log(currentRoom);
		lj.realm.makeRoom(currentRoom);

		lj.hero.exit();

		// Fade scene

		// When exiting hero is also entering the next room (or realm)
		enter(oppositeDoor(door));
	}

	return {
		enter: enter,
		exit: exit
	}

}());