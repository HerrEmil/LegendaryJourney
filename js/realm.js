window.lj = lj || {};

lj.realm = (function () {
	"use strict";
	var rooms = [], // 1D array read from top left
		size,
		x,
		y,
		doors = [];

	doors = [{
		U : 4,
		R : 3,
		D : 5,
		L : 3
	},{}];

	function getRoom() {}
	function makeRoom(room) {}
	function spawnChestsAndMonsters() {}
	function makeBoss(room) {}
	function placeDoors() {
		for (x = 0; x < size; x += 1) {
			for (y = 0; y < size; y += 1) {
				
			}
		}
	}

	function makeRealm(size) {
		// Clear previous realm including all chests, monsters and door positions
		// Make new realm of specified size
		for (x = 0; x < size; x += 1) {
			rooms[x] = [];
			for (y = 0; y < size; y += 1) {
				rooms[x][y] = [];
			}
		}
		// Place doors
		placeDoors();
		// Place boss
		// Make first room
	}
	function prepareNextRoom(room) {}
	function copyRoom() {}
	function getChestsAndMonsters() {}
	function clearTile(x, y) {}

	return {
		makeRealm : makeRealm, // Call to initialize
		prepareNextRoom : prepareNextRoom,
		copyRoom : copyRoom,
		getChestsAndMonsters : getChestsAndMonsters,
		clearTile : clearTile
	};
}());