// Room format legend:
// # - Wall
//   - path
// U - Top hole in wall
// R - Right hole in wall
// D - Bottom hole in wall


var maze = [[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
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



// Draw wall at edge of maze and a grid (making a "bomberman" wall layout)
function outerAndGrid() {
	'use strict';
	var y,
		x,
		height = maze[0].length,
		width = maze.length;

	for (y = 0; y < height; y += 1) {
		for (x = 0; x < width; x += 1) {
			if (y === 0 || x === 0 || y === (height - 1) || x === (width - 1) || (y % 2 === 0 && x % 2 === 0)) {
				maze[x][y] = '#';
			}
		}
	}
}

// The first column of pillars in the bomberman layout is a special case in that it's OK to go left when adding wall
function firstColumn() {
	'use strict';
	var y,
		x,
		height = maze[0].length,
		width = maze.length,
		dx,
		dy;

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
		if (maze[dx][dy] === ' ') {
			maze[dx][dy] = '#';
		} else {
			// If the tile was already a wall, move iterator back to try again
			y -= 2;
		}
	}
}

function allButFirst() {
	'use strict';
	var y,
		x,
		height = maze[0].length,
		width = maze.length,
		dx,
		dy;

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
			if (maze[dx][dy] === ' ') {
				maze[dx][dy] = '#';
			} else {
				// If the tile was already a wall, move iterator back to try again
				y -= 2;
			}
		}
	}
}


function printMaze() {
	'use strict';
	var str = "",
		y,
		x,
		height = maze[0].length,
		width = maze.length;

	for (y = 0; y < height; y += 1) {
		for (x = 0; x < width; x += 1) {
			str += maze[x][y] + " ";
		}
		str += "\r\n";
	}
	console.log(str);
}