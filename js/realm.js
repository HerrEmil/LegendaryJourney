/*
Room structure legend:
' ' = Path
'#' = Wall

'L' = Door leading Left
'U' = Door leading Up
'R' = Door leading Right
'D' = Door leading Down

'B' = Boss

'E' = Generic Enemy
'C' = Generic Chest

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

	function pickRandomEnemyType() {
		var randomNumber = Math.floor(Math.random() * 4);
		switch (randomNumber) {
		case 0:
			return 'a';
		case 1:
			return 'b';
		case 2:
			return 'c';
		case 3:
			return 'd';
		default:
			return 'E';
		}
	}

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
			length = rooms[room].length;
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
		length = rooms[room].length;
		for (x = 1; x < length; x += 1) {
			for (y = 1; y < length; y += 1) {
				if ((rooms[room][x][y] === ' ') && (x !== 5 || y !== 9)) {
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

		// Loop through enemies
		for (i = 0; i < enemies; i += 1) {
			// Pick a random spawn point and grab its x and y values
			randomPosition = Math.floor(Math.random() * numberOfSpawns);
			roomX = spawnPoints[randomPosition].x;
			roomY = spawnPoints[randomPosition].y;

			chestsAndMonsters[room][roomX][roomY] = pickRandomEnemyType();
			// If boss room, replace last placed enemy with boss
			if ((room === bossRoom) && (i === enemies - 1)) {
				chestsAndMonsters[room][roomX][roomY] = 'B';
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
		if (doors[room].L) {
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

	function getSize() {
		return size;
	}

	function makeRealm(realmSize) {
		var i,
			roomNumber;
		// Clear previous realm
		rooms.length = 0;
		size = realmSize;

		// Make empty maps for rooms and monsters
		for (x = 0; x < size; x += 1) {
			for (y = 0; y < size; y += 1) {
				roomNumber = getRoomNumberFromPosition(x, y);
				rooms[roomNumber] = [];
				chestsAndMonsters[roomNumber] = [];
			}
		}

		// Set door positions
		placeDoors();

		// Pick one of the top rooms for the boss
		bossRoom = Math.floor(Math.random() * size);

		// Start in one of the bottom rooms
		currentRoom = (rooms.length - 1) - Math.floor(Math.random() * size);

		// Make first room
		makeRoom(currentRoom);
	}

	// Remove a monster or chest from current room
	function clearTile(tile) {
		chestsAndMonsters[currentRoom][tile[0]][tile[1]] = ' ';
	}

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
		for (y = 0; y < chestsAndMonsters[room][0].length; y += 1) {
			for (x = 0; x < chestsAndMonsters[room].length; x += 1) {
				str += chestsAndMonsters[room][x][y] + " ";
			}
			str += "\r\n";
		}
		console.log(str);
	}

	function getChestsAndMonsters(room) {
		var copy = [],
			x,
			length = chestsAndMonsters[room].length;
		for (x = 0; x < length; x += 1) {
			copy[x] = chestsAndMonsters[room][x].slice(0);
		}
		return copy;
	}

	function enterRoom(room) {
		currentRoom = room;
		if (!rooms[currentRoom].length) {
			makeRoom(room);
		}
	}

	return {
		// Exposed for testing
		printRoom : printRoom,
		printChestsAndMonsters : printChestsAndMonsters,

		// Call when starting a quest to create the dungeon
		makeRealm : makeRealm,

		// Call to get a copy of the wall layout or monster/pickups layout
		getRoom : getRoom,
		getChestsAndMonsters : getChestsAndMonsters,

		// Check which room you currently are in (room number needed for other functions)
		getCurrentRoom : getCurrentRoom,

		// Get realm size (1, two, or three)
		getSize: getSize,

		// Call when entering a door
		enterRoom : enterRoom,

		// Call to remove monster or chest
		clearTile : clearTile
	};
}());