/*
Room structure legend:
' ' = Path
'#' = Wall

'L' = Door leading Left
'U' = Door leading Up
'R' = Door leading Right
'D' = Door leading Down

'B' = Boss

'a' = Monster type a
'b' = Monster type b
'c' = Monster type c
[...]
'z' = Monster type z

'1' = Chest type 1
'2' = Chest type 2
'3' = Chest type 3
[...]
'9' = Chest type 9
*/

window.lj = lj || {};

lj.realm = (function () {
	"use strict";
	var rooms = [],
		chestsAndMonsters = [],
		size,
		x,
		y,
		i,
		doors = [],
		currentRoom = 90,
		bossRoom;

	function getRoomNumberFromPosition(x, y) {
		return (y * size) + x;
	}

	function randomDoorPosition() {
		// Note that this only works with our 11 x 11 room size
		return Math.floor(Math.random() * 5 + 1) * 2 - 1;
	}

	function getRoom(room) {
		var copy = [],
			x,
			length = rooms[currentRoom].length;
		for (x = 0; x < length; x += 1) {
			copy[x] = rooms[room][x].slice(0);
		}
		return copy;
	}
	function spawnChestsAndMonsters(room) {
		var spawnPoints = [],
			x,
			y,
			i,
			length,
			randomPosition,
			numberOfSpawns,
			roomX,
			roomY,
			// Pick a semi-random number or enemies and chests
			enemies = Math.floor(Math.random() * 6 + 1) + 8, // Between 8 and 12 enemies
			chests = Math.floor(Math.random() * 2 + 1) + 4; // Between 4 and 6 chests

		// Create a map of all possible spawn points
		length = rooms.length;
		for (x = 1; x <= length; x += 1) {
			for (y = 1; y <= length; y += 1) {
				if (rooms[room][x][y] === ' ') {
					spawnPoints.push({x : x, y : y});
				}
			}
		}

		chestsAndMonsters[room] =  [['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
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

		numberOfSpawns = spawnPoints.length;
		// Loop through enemies
		for (i = 0; i < enemies; i += 1) {
			// Pick a random spawn point and grab its x and y values
			randomPosition = Math.floor(Math.random() * numberOfSpawns);
			roomX = spawnPoints[randomPosition].x;
			roomY = spawnPoints[randomPosition].y;

			// Add an enemy in chest and monster structure, as long as it's not in the character's spawn point
			if (roomX !== 5 || roomY !== 9) {
				chestsAndMonsters[room][roomX][roomY] = 'E';
			}

			// If boss room, replace last placed enemy with boss
			if ((room === bossRoom) && (i === enemies - 1)) {
				console.log('Creating boss room!');
				console.log('Boss room before placing boss:');
				printChestsAndMonsters(room);
				chestsAndMonsters[room][roomX][roomY] = 'B';
				console.log('Boss room after placing boss:');
				printChestsAndMonsters(room);
			}
		}

		for (i = 0; i < chests; i += 1) {
			// Pick a random spawn point and grab its x and y values
			randomPosition = Math.floor(Math.random() * numberOfSpawns);
			roomX = spawnPoints[randomPosition].x;
			roomY = spawnPoints[randomPosition].y;

			// Add an chest in chest and monster structure, as long as it's not in the character's spawn point
			if (roomX !== 5 || roomY !== 9) {
				chestsAndMonsters[room][roomX][roomY] = 'C';
			}
		}
	}

	// Generate a new room with doors according to doors array and fill with 
	function makeRoom(room) {
		var x,
			y,
			dx,
			dy,
			height,
			width,
			enemyPosition = 0;

		// Add empty room
		rooms[room] =  [[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], //
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], //
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], //
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], //
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], //
						[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']];

		// Save height and width of room
		width = rooms[room].length;
		height = rooms[room][0].length;

		// Draw wall at edge of room and a grid (making a "bomberman" wall layout)
		for (y = 0; y < height; y += 1) {
			for (x = 0; x < width; x += 1) {
				if (y === 0 || x === 0 || y === (height - 1) || x === (width - 1) || (y % 2 === 0 && x % 2 === 0)) {
					rooms[room][x][y] = '#';
				}
			}
		}

		// Loop through the leftmost column of pillars
		for (y = 2; y < height - 1; y += 2) {
			dx = 2;
			dy = y;

			// Pick a direction at random
			switch (Math.floor(Math.random() * 4)) {
			case 0:
				dx += 1;
				break;
			case 1:
				dx -= 1;
				break;
			case 2:
				dy += 1;
				break;
			case 3:
				dy -= 1;
				break;
			}

			// If the tile in the direction chosen is empty, make wall
			if (rooms[room][dx][dy] === ' ') {
				rooms[room][dx][dy] = '#';
			} else {
				// If the tile was already a wall, move iterator back and try again
				y -= 2;
			}
		}

		// Loop through all but leftmost column of pillars
		for (x = 4; x < (width - 1); x += 2) {
			for (y = 2; y < height - 1; y += 2) {
				dx = x;
				dy = y;

				// Pick a direction at random (but not to the left!)
				switch (Math.floor(Math.random() * 3)) {
				case 0:
					dx += 1;
					break;
				case 1:
					dy += 1;
					break;
				case 2:
					dy -= 1;
					break;
				}

				// If the tile in the direction chosen is empty, make wall
				if (rooms[room][dx][dy] === ' ') {
					rooms[room][dx][dy] = '#';
				} else {
					// If the tile was already a wall, move iterator back to try again
					y -= 2;
				}
			}
		}

		// Place doors in room
		// If left, place 'L' in x0 at y where doors says y should be
		// console.log('in makeRoom room: ' + room);
		// console.log('doors[room]: ' + doors[room]);
		if (doors[room].L) {
			// console.log('Placing left door in room ' + room + ' at position 0, ' + doors[room].L);
			rooms[room][0][doors[room].L] = 'L';
		}
		// If up, place 'U' in y0 at X where doors says X should be
		if (doors[room].U) {
			rooms[room][doors[room].U][0] = 'U';
		}
		// If right, place 'R' in x(size-1) where doors says y should
		if (doors[room].R) {
			rooms[room][width - 1][doors[room].R] = 'R';
		}
		// If down, place 'D' in y(size-1) where doors says x
		if (doors[room].D) {
			rooms[room][doors[room].D][height - 1] = 'D';
		}

		spawnChestsAndMonsters(room);
	}

	// Place boss in one of the top rooms
	function placeBoss(room) {
		bossRoom = Math.floor(Math.random() * size);
	}
	function placeDoors() {
		var roomNumber,
			x,
			y;

		// Clear previous door positions
		doors.length = 0;

		// Go through rooms from top left to bottom right and add doors in separate structure similar to rooms
		for (y = 0; y < size; y += 1) {
			for (x = 0; x < size; x += 1) {
				roomNumber = getRoomNumberFromPosition(x, y);
				// console.log('roomNumber: ' + roomNumber);
				// console.log('x: ' + x);
				// console.log('y: ' + y);
				// Create new empty door position structure in the same position as a room in rooms array
				doors[roomNumber] = {
					L : 0,
					U : 0,
					R : 0,
					D : 0
				};

				// Left door should be placed in all column but the first
				if (x > 0) {
					// Left door is always placed on the same position as right door in the room to the left
					doors[roomNumber].L = doors[roomNumber - 1].R;
				}

				// Top door should be placed in all rows but the first
				if (y > 0) {
					// Top door is always placed on the same position as the bottom door in the room above
					// console.log('doors[roomNumber - size] = doors[' + roomNumber + ' - ' + size + ']');
					doors[roomNumber].U = doors[roomNumber - size].D;
				}

				// Right door should be placed in all columns except the last
				if ((x % size) < size - 1) {
					// Right door is placed at random position
					doors[roomNumber].R = randomDoorPosition();
				}

				// Bottom door should be placed in all rows but the last
				if ((y % size) < size - 1) {
					// Bottom door is placed at random position
					doors[roomNumber].D = randomDoorPosition();
				}
			}
		}

	}

	function getCurrentRoom() {
		return currentRoom;
	}

	function makeRealm(realmSize) {
		var i,
			roomNumber;
		// Clear previous realm
		rooms.length = 0;
		size = realmSize;

		// Make new realm of specified size
		for (x = 0; x < size; x += 1) {
			for (y = 0; y < size; y += 1) {
				roomNumber = getRoomNumberFromPosition(x, y);
				rooms[roomNumber] = [];
				chestsAndMonsters[roomNumber] = [];
			}
		}

		// set door positions
		placeDoors();

		// Place boss
		placeBoss();

		// Start in one of the bottom rooms
		currentRoom = (rooms.length - 1) - Math.floor(Math.random() * size);
		// console.log('In makeRealm, currentRoom: ' + currentRoom);

		// Make first room
		makeRoom(currentRoom);
	}
	function prepareNextRoom(room) {}
	function clearTile(x, y) {}


	function printRoom(room) {
		var str = "";
		for (y = 0; y < rooms[room][0].length; y += 1) {
			for (x = 0; x < rooms[room].length; x += 1) {
				str += rooms[room][x][y] + " ";
			}
			str += "\r\n";
		}
		console.log(str);
	}

	function printChestsAndMonsters(room) {
		var str = "";
		console.log(chestsAndMonsters);
		for (y = 0; y < chestsAndMonsters[room][0].length; y += 1) {
			for (x = 0; x < chestsAndMonsters[room].length; x += 1) {
				str += chestsAndMonsters[room][x][y] + " ";
			}
			str += "\r\n";
		}
		console.log(str);
	}

	// Just for testing
	function setSize(newSize) {
		size = newSize;
	}

	function checkTile() {}

	function getChestsAndMonstersArray() {
		return chestsAndMonsters;
	}

	function enterRoom(room) {
		currentRoom = room;
		if (!rooms[currentRoom].length) {
			makeRoom(room);
		}
	}

	return {
		// temporarily expose everything to test
		getRoomNumberFromPosition : getRoomNumberFromPosition,
		randomDoorPosition : randomDoorPosition,
		spawnChestsAndMonsters : spawnChestsAndMonsters,
		makeRoom : makeRoom,
		placeBoss : placeBoss,
		placeDoors : placeDoors,
		printRoom : printRoom,
		setSize : setSize,
		doors : doors,
		rooms : rooms,
		getChestsAndMonstersArray : getChestsAndMonstersArray,
		printChestsAndMonsters : printChestsAndMonsters,
		chestsAndMonsters : chestsAndMonsters,
		bossRoom : bossRoom,
		enterRoom : enterRoom,

		// These should stay exposed after testing
		makeRealm : makeRealm,
		prepareNextRoom : prepareNextRoom, // To do
		clearTile : clearTile, // To do
		checkTile : checkTile, // To do
		getRoom : getRoom,
		getCurrentRoom : getCurrentRoom
	};
}());