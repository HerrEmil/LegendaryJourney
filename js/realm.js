window.lj = lj || {};

lj.realm = (function () {
	"use strict";
	var rooms = [],
		size,
		x,
		y,
		i,
		doors = [],
		currentRoom,
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
			length = rooms[0].length;
		for (x = 0; x < length; x += 1) {
			copy[x] = rooms[room][x].slice(0);
		}
		return copy;
	}
	function spawnChestsAndMonsters() {}

	// Generate a new room with doors according to doors array and fill with 
	function makeRoom(room) {
		var x,
			y,
			dx,
			dy,
			height,
			width;

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

		// Place enemies

		// If boss room, replace one enemy with boss
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

	function makeRealm(size) {
		// Clear previous realm
		rooms.length = 0;


		// Make new realm of specified size
		for (x = 0; x < size; x += 1) {
			rooms[x] = [];
			for (y = 0; y < size; y += 1) {
				rooms[x][y] = [];
			}
		}
		// set door positions
		placeDoors();

		// Place boss
		placeBoss();

		// Start in one of the bottom rooms
		currentRoom = rooms.length - Math.floor(Math.random() * size);

		// Make first room
		makeRoom(currentRoom);
	}
	function prepareNextRoom(room) {}
	function copyRoom() {}
	function copyRealm() {}
	function getChestsAndMonsters() {}
	function clearTile(x, y) {}
	// Should be superseeded by copyRoom later
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

	// Just for testing
	function setSize(newSize) {
		size = newSize;
	}

	function checkTile() {}

	return {
		// temporarily expose everything to test
		getRoomNumberFromPosition : getRoomNumberFromPosition,
		randomDoorPosition : randomDoorPosition,
		getRoom : getRoom,
		spawnChestsAndMonsters : spawnChestsAndMonsters,
		makeRoom : makeRoom,
		placeBoss : placeBoss,
		placeDoors : placeDoors,
		printRoom : printRoom,
		setSize : setSize,
		doors : doors,
		rooms : rooms,

		// These should stay exposed after testing
		makeRealm : makeRealm, // Call to initialize
		prepareNextRoom : prepareNextRoom,
		copyRoom : copyRoom,
		copyRealm : copyRealm,
		getChestsAndMonsters : getChestsAndMonsters,
		clearTile : clearTile,
		checkTile : checkTile
	};
}());