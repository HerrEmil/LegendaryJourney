'use strict'

var Game = function() {
	var canvas = document.getElementById('game');

	this.context = canvas.getContext('2d');
	this.lapsedTime = 0;
	this.sprites = [];

	// Preloading images
	this.imageLoadingProgressCB = null;
	this.images = {};
	this.imageUrls = [];
	this.imagesLoaded = 0;
	this.imagesFailedToLoad = 0;
	this.imagesIndex = 0;

	// Keyboard events
	this.keyListeners = {};

	this.start();
}

// Paint initial screen and setup event listeners
Game.prototype.start = function() {
	var self = this;

	document.addEventListener('keydown', function(event) {
		self.keyPressed(event.keyCode);
	});
}

// ## Image loading
/* ================================================== */

Game.prototype.getImage = function(imageUrl) {
	return this.images[imageUrl];
}

// Game.prototype.imageLoaded = function(event) {
// 	this.imagesLoaded += 1;
// }

// Game.prototype.imageLoadedError = function(event) {
// 	this.imagesFailedToLoad += 1;
// }

Game.prototype.loadImage = function(imageUrl) {
	var image = new Image(),
		self = this;

	image.src = imageUrl;

	image.addEventListener('load', function(event) { self.imagesLoaded += 1 });

	image.addEventListener('error', function(event) { self.imagesFailedToLoad += 1 });

	this.images[imageUrl] = image;
}

Game.prototype.loadImages = function() {

	var percent;

	// Any more images left to load?
	if (this.imagesIndex < this.imageUrls.length) {
		this.loadImage(this.imageUrls[this.imagesIndex]);
		this.imagesIndex += 1;
	}

	// How many percentages complete?
	percent = (this.imagesLoaded + this.imagesFailedToLoad) / this.imageUrls.length * 100;

	return percent;
}

Game.prototype.queueImage = function(imageUrl) {
	this.imageUrls.push(imageUrl);
}

// ## Keyboard Event Listeners
/* ================================================== */

Game.prototype.addKeyListener = function(key, listener) {
	if (!this.keyListeners[key]) this.keyListeners[key] = [];
	this.keyListeners[key].push(listener);
}

Game.prototype.findKeyListeners = function(key) {
	var listener = null;

	// If the key has listeners, return them
	if (this.keyListeners[key]) {
		return this.keyListeners[key];
	}
}

Game.prototype.keyPressed = function(keyCode) {
	var listeners = null,
		key = null;

	switch (keyCode) {
		case 32: key = 'space';			break;
		case 37: key = 'left arrow';	break;
		case 38: key = 'up arrow';		break;
		case 39: key = 'right arrow';	break;
		case 40: key = 'down arrow';	break;
	}

	console.log(key);

	if (key) { listeners = this.findKeyListeners(key) }

	if (listeners) {
		for(var ln = listeners.length, i=0; i<ln; i++) {
			listeners[i]();
		}
	}
}
