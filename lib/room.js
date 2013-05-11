'use strict'

var defaults = {
	nrOfRows: 10,
	nrOfCols: 10,
	tileSize: 16
}

var Room = function(config) {
	var config = config || {};

	this.nrOfRows = config.nrOfRows || defaults.nrOfRows;
	this.nrOfColumns = config.nrOfCols || defaults.nrOfCols;
	this.tileSize = config.tileSize || defaults.tileSize;
}

Room.prototype.generate = function() {
	
}