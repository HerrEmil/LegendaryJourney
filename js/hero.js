window.lj = lj || {};

var fightEl = document.getElementById('fight'),
	damageEl = fightEl.querySelector('.damage'),
	hitEl = fightEl.querySelector('.hit');

lj.hero = (function() {
	'use strict'

	var currentDir = null,
		room = null,
		creaturesAndItems = null,
		currentTile = [5,9], // col, row
		isBusy = false;

	var stepModifiers = {
		left: [0, -1],
		right: [0, 1],
		up: [-1, 0],
		down: [1, 0]
	}

	var creaturesAndItemsMap = {
		'B': 'Enemy',
		'C': 'Chest',
		'E': 'Enemy',
		'a': 'Enemy',
		'b': 'Enemy',
		'c': 'Enemy',
		'd': 'Enemy'
	}

	setupListeners();

	function reset() {
		currentTile = [5,9];
		isBusy = false;
		lj.hero.stats.heal(1000);
	}

	// The hero enters the room...
	function enter(door) {
		// Get the starting tile from realm.js (get door tile)
		var currentRoom = lj.realm.getCurrentRoom();
		room = lj.realm.getRoom(currentRoom);
		creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
		// console.log(currentRoom);
		place(currentTile);
		// console.log(currentTile);
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

	// PRIVATE: place the hero on a tile
	function place(tile) {
		currentTile = tile;
		lj.scene.paint(tile);
		checkTile(tile);
	}

	function move(tile) {
		var type;

		try {
			type = room[tile[0]][tile[1]];
		}
		catch (err) {
			move(currentTile);
			return;
		}

		// Find out what type of tile we're moving to
		switch (type) {
			case '#': return; break;
			case ' ':
				lj.hero.stats.heal(0.25);
				place(tile);
				// console.log('Hero moved to:', currentTile, currentDir);
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
				move(currentTile);
				break;
		}
	}

	function checkTile(tile) {
		var item = creaturesAndItems[tile[0]][tile[1]];
			
		// console.log('Our hero will interact with', type);
		if (creaturesAndItemsMap[item]) {
			isBusy = true;
			interact(item, tile);
		}
	}

	function interact(item, tile) {
		var currentRoom = lj.realm.getCurrentRoom(),
			type = creaturesAndItemsMap[item];


		function outcome(timeout) {
			setTimeout(function() {
				fightEl.setAttribute('class', '');
				if (fight.outcome.actor === 'hero') {
						lj.battleLog.monsterKilled(enemy.name);
						lj.realm.clearTile(tile);
						lj.scene.eraseTileItem(tile);
						if (item === 'B') {
							setTimeout(function() {
								lj.scene.levelUp();
								isBusy = false;
							},1000)
						}
						else {
							isBusy = false;
						}
				}
				else {
					lj.battleLog.heroKilled(enemy.name);
					lj.scene.eraseTileItem(tile, true);
				}
				creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
			},timeout);
		}

		if (type === 'Chest') {
			var item = lj.items.makeItem();
			lj.hero.gear.pickup(item);
			lj.realm.clearTile(tile);
			lj.scene.eraseTileItem(tile);		
			isBusy = false;
			creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
		}
		else if (type === 'Enemy') {
			var enemy = lj.enemy.get("brown", item),
				fight = lj.hero.fight(enemy),
				position = [tile[0] * 32, (tile[1] - 1) * 32];

			fightEl.style.top = position[1] + 150 + 'px';
			fightEl.style.left = position[0] + 50 + 'px';

			fight.log.forEach(function(log, index) {
				showFightStat(log, index * 400);
			});

			outcome(fight.log.length * 400)
			
		}
	}

	function showFightStat(log, timeout) {
		setTimeout(function() {
			if (log.actor === 'hero') {
				hitEl.innerHTML = log.damage;
				fightEl.setAttribute('class', 'dealing');
			}
			else {
				lj.hero.stats.hurt(log.damage);
				damageEl.innerHTML = log.damage;
				fightEl.setAttribute('class', 'taking');
			}
		},timeout);
	}

	// Makes the hero step in a direction
	// Directions: left, right, up, down
	function step(dir) {
		var row, col, nextTile;

		// We ain't going anywhere if busy looting or fighting
		if (isBusy) return;

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
		exit: exit,
		reset: reset
	}
}());