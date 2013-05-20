window.lj = lj || {};

// ## Setting and updating the current scene of the game

var floor = [0, 4]; //[14, 49];

var spriteMap = {
	'!': [0, 8], //[2, 4], // hero
	'#': [0, 0], // wall
	' ': floor, // floor
	'L': floor, // Door leading Left
	'U': floor, // Door leading Up
	'R': floor, // Door leading Right
	'D': floor, // Door leading Down

	'B': [0, 9], // Boss
	'a': [0, 11], // Wolf
	'b': [0, 12], // Gnoll
	'c': [0, 13], // Troll
	'd': [0, 14], // Mage ghost
	'C': [0, 10], // Chest

	'1': floor, // Chest type 1
	'2': floor, // Chest type 2
	'3': floor, // ...

	'9': floor // Chest type 9 
}

// Used to navigate rooms in 2 and 3 realms
var roomModifier = {
	'D': 1,
	'U': -1,
	'L': -1,
	'R': 1
}

lj.scene = (function() {

	var currentRoom = null,
		room = null,
		creaturesAndItems = null;

	function reset() {
		lj.hero.reset();
		lj.realm.makeRealm(1);
		currentRoom = null;
		room = null;
		creaturesAndItems = null;
		enter('D');
	}

	function levelUp() {
		var currentLevel = lj.realm.getSize();
		// if (currentLevel === 3) {
			// console.log('You win!');
			// return;
		// }
		// else {
			lj.realm.makeRealm(currentLevel + 1);
		// }
		lj.hero.reset();
		currentRoom = null;
		room = null;
		creaturesAndItems = null;
		enter('D');
		lj.battleLog.levelComplete(currentLevel);
	}

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

	function paint(tile, isDead) {
		var spriteImage = lj.getImage('dungeon-sprite.png');

		// Paint scene
		for (var rowCtr = 0; rowCtr < 11; rowCtr++) {
			for (var colCtr = 0; colCtr < 11; colCtr++) {
				lj.context.save();
				var tileId = spriteMap[room[colCtr][rowCtr]],
					sourceX = Math.floor(tileId[1]) * 32,
					sourceY = Math.floor(tileId[0]) * 32;
				lj.context.drawImage(spriteImage, sourceX, sourceY,32,32,colCtr*32,rowCtr*32,32,32);
				lj.context.restore();
				lj.context.save();
				var itemSymbol = creaturesAndItems[colCtr][rowCtr],
					itemId = spriteMap[itemSymbol],
					itmX = Math.floor(itemId[1]) * 32,
					itmY = Math.floor(itemId[0]) * 32;
				if (itemSymbol !== '#' && itemSymbol !== ' ') {
					lj.context.save();
					lj.context.drawImage(spriteImage, itmX, itmY,32,32,colCtr*32,rowCtr*32,32,32);
					lj.context.restore();
				}
			}
		}

		// Paint hero
		if (!isDead) {
			lj.context.save();
			lj.context.drawImage(spriteImage, 8*32, 0*32,32,32,tile[0]*32,tile[1]*32,32,32);
			lj.context.restore();
		}

	}

	function paintWin() {
		var room =  [['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'], //
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'], //
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'], //
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'], //
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
					['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'], //
					['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']];

		var spriteImage = lj.getImage('dungeon-sprite.png');

		var tile = [5,2];

		// Paint scene
		for (var rowCtr = 0; rowCtr < 11; rowCtr++) {
			for (var colCtr = 0; colCtr < 11; colCtr++) {
				lj.context.save();
				var tileId = spriteMap[room[colCtr][rowCtr]],
					sourceX = Math.floor(tileId[1]) * 32,
					sourceY = Math.floor(tileId[0]) * 32;
				lj.context.drawImage(spriteImage, sourceX, sourceY,32,32,colCtr*32,rowCtr*32,32,32);
				lj.context.restore();
			}
		}

		lj.context.save();
		lj.context.drawImage(spriteImage, 8*32, 0*32,32,32,tile[0]*32,tile[1]*32,32,32);
		lj.context.restore();

		lj.context.font = "50px serif";
		lj.context.fillStyle = "#FFA500";
		lj.context.fillText('You win!', 80, 150);
		lj.context.font = "14px serif";
		lj.context.fillStyle = "#FFFFFF";
		lj.context.fillText('You are a LEGENDARY warrior', 80, 200);
	}

	function paintGameOver(tile) {
		var spriteImage = lj.getImage('dungeon-sprite.png');

		// Paint scene
		for (var rowCtr = 0; rowCtr < 11; rowCtr++) {
			for (var colCtr = 0; colCtr < 11; colCtr++) {
				lj.context.save();
				var tileId = spriteMap[room[colCtr][rowCtr]],
					sourceX = Math.floor(tileId[1]) * 32,
					sourceY = Math.floor(tileId[0]) * 32;
				lj.context.drawImage(spriteImage, sourceX, sourceY,32,32,colCtr*32,rowCtr*32,32,32);
				lj.context.restore();
			}
		}

		// Paint dead hero
		lj.context.save();
		lj.context.drawImage(spriteImage, 15*32, 0*32,32,32,tile[0]*32,tile[1]*32,32,32);
		lj.context.restore();
	}

	// Called to remove monster or chest, when hero is standing on it
	function eraseTileItem(tile, isDead) {
		creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
		paint(tile, isDead);

		if (isDead) {
			setTimeout(function() {
				paintGameOver(tile);
			},1000);
		}

	}

	// Enter a room
	function enter(door) {
		if (!currentRoom) currentRoom = lj.realm.getCurrentRoom();

		room = lj.realm.getRoom(currentRoom);
		creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);

		// Animate hero entering from door
		lj.hero.enter(door);
	}

	// Exit the current room through a door
	// Door can be "U", "D", "L", "R"
	function exit(door) {

		var verticalOffset = 1;

		if (door === 'U' || door === 'D') verticalOffset = lj.realm.getSize();

		currentRoom = currentRoom + (roomModifier[door] * verticalOffset);

		lj.realm.enterRoom(currentRoom);

		lj.hero.exit();

		// Fade scene

		// When exiting hero is also entering the next room (or realm)
		enter(oppositeDoor(door));
	}

	return {
		enter: enter,
		exit: exit,
		paint: paint,
		paintWin: paintWin,
		eraseTileItem: eraseTileItem,
		levelUp: levelUp,
		reset: reset
	}

}());