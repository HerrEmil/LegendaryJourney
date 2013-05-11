'use strict'

var Room = function(rows, cols, tileSize) {
	this.nrOfRows = rows || 11;
	this.nrOfColumns = cols || 11;
	this.tileSize = tileSize || 32;
}

Room.prototype.generate = function() {}