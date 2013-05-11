'use strict'

var defaults = {
	nrOfRows: 10,
	nrOfCols: 10,
	tileSize: 16,
	realmSize: 1
}

var Realm = function(config) {
	var config = config || {};

	this.size = config.realmSize || defaults.realmSize;

	this.nrOfRows = config.nrOfRows || defaults.nrOfRows;
	this.nrOfColumns = config.nrOfCols || defaults.nrOfCols;
	this.tileSize = config.tileSize || defaults.tileSize;

	this.rooms = [];
	this.doors = [];
	this.currentRoom = null;

	this.init();
}

Realm.prototype.init = function() {
	var x, y;

	// Clear previous realm including all chests, monsters and door positions
	// Make new realm of specified size
	for (x = 0; x < this.size; x += 1) {
		this.rooms[x] = [];
		for (y = 0; y < this.size; y += 1) {
			this.rooms[x][y] = [];
		}
	}
	// set door positions
	this.placeDoors();

	// Place boss
	this.placeBoss();

	// Start in one of the bottom rooms
	this.currentRoom = this.rooms.length - Math.floor(Math.random() * this.size);

	// Make first room
	this.makeRoom(this.currentRoom);
}

Realm.prototype.getRoomNumberFromPosition = function(x, y) {
	return (x * this.size) + y;
}

Realm.prototype.getRoomNumberFromPosition = function(x, y) {
	console.log((x * this.size) + y);
	return (x * this.size) + y;
}

Realm.prototype.randomDoorPosition = function() {
	// Note that this only works with our 11 x 11 room size
	return Math.floor(Math.random() * 5 + 1) * 2;
}

Realm.prototype.getRoom = function() {}
Realm.prototype.spawnChestsAndMonsters = function() {}

	// Generate a new room with doors according to doors array and fill with 
Realm.prototype.makeRoom = function(room) {
	var y,
		x,
		height,
		width;

	// Add empty room
	this.rooms[room] =  [[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
					[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']];

	// Save height and width of room
	width = this.rooms[room].length;
	height = this.rooms[room][0].length;
}

// Place boss in one of the top rooms
Realm.prototype.placeBoss = function(room) {
	this.bossRoom = Math.floor(Math.random() * this.size);
}

Realm.prototype.placeDoors = function() {
	var roomNumber,
		x,
		y;

	// Clear previous door positions
	this.doors.length = 0;

	// Go through rooms from top left to bottom right and add doors in separate structure similar to rooms
	for (x = 0; x < this.size; x += 1) {
		for (y = 0; y < this.size; y += 1) {
			roomNumber = this.getRoomNumberFromPosition(x, y);
			// Create new empty door position structure in the same position as a room in rooms array
			this.doors[roomNumber] = {};

			// Left door should be placed in all column but the first
			if (x > 0) {
				// Left door is always placed on the same position as right door in the room to the left
				this.doors[roomNumber].L = this.doors[roomNumber - 1].R;
			}

			// Top door should be placed in all rows but the first
			if (y > 0) {
				// Top door is always placed on the same position as the bottom door in the room above
				console.log(roomNumber, this.size);
				this.doors[roomNumber].U = this.doors[roomNumber - this.size].D;
			}

			// Right door should be placed in all columns except the last
			if ((x % this.size) < this.size - 1) {
				// Right door is placed at random position
				this.doors[roomNumber].R = this.randomDoorPosition();
			}

			// Bottom door should be placed in all rows but the last
			if ((y % this.size) < this.size - 1) {
				// Bottom door is placed at random position
				this.doors[roomNumber].D = this.randomDoorPosition();
			}
		}
	}

}

Realm.prototype.prepareNextRoom = function(room) {}
Realm.prototype.copyRoom = function() {}
Realm.prototype.copyRealm = function() {}
Realm.prototype.getChestsAndMonsters = function() {}
Realm.prototype.clearTile = function(x, y) {}
