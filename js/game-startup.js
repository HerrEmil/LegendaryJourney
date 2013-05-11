(function() {
	'use strict'

	var config = {
		nrOfRows: 11,
		nrOfCols: 11,
		tileSize: 32,
		realmSize: 2,
		assetsPath: 'assets/'
	}

	var intro = document.getElementById('gameIntro'),
		start = intro.querySelector('.btn-start');

	start.addEventListener('click', startGame);

	function startGame() {

		window.lj = new Game(config);
		lj.realm = new Realm(config);

		loadImages();

	}

	function loadImages() {
		var progress = intro.querySelector('#progress'),
			progressBar = progress.querySelector('.progress-bar'),
			images,
			interval;

		start.style.display = 'none';
		progress.style.display = 'block';

		images = [
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

		interval = setInterval(function() {
			var completed = lj.loadImages();
			progressBar.style.width = completed * 2 + 'px';
			if (completed === 100) {
				clearInterval(interval);
				setTimeout(function() {
					intro.setAttribute('class', 'faded');
					setTimeout(function() {
						intro.style.display = 'none';
					},500);
				},1000);
			}
		},16);
	}

}());