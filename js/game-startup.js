
(function() {

	window.lj = new Game();

	var images = [
		'dungeon-sprite.png',
		'hero-walk.png',
		'armor-sprite.png',
		'camp-fire.png',
		'crystal-blue.png',
		'crystal-green.png',
		'crystal-grey.png',
		'crystal-orange.png',
		'crystal-pink.png',
		'crystal-yellow.png',
		'orc-sprite.png'
	];

	images.forEach(function(image) {
		lj.queueImage(image);
	});

	var interval = setInterval(function() {
		var completed = lj.loadImages();
		if (completed === 100) {
			clearInterval(interval);
			console.log('Complete! All images loaded.');
			document.body.appendChild(lj.getImage('hero-walk.png'));
		}
		console.log(completed);
	},16);

}());