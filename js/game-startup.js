(function() {
	'use strict'

	window.lj = new Game(config);

	var config = {
		nrOfRows: 11,
		nrOfCols: 11,
		tileSize: 32,
		realmSize: 2,
		assetsPath: 'assets/'
	}

	function checkRestartButton(event) {
		var eleClass = event.target.getAttribute('class');

		if (eleClass === 'btn restart') {
			lj.scene.reset();
			lj.battleLog.clear();
			lj.hero.gear.clear();
		}
	}

	var intro = document.getElementById('gameIntro'),
		startBtn = intro.querySelector('.btn-start'),
		battleLog = document.getElementById('battleLog');

	startBtn.addEventListener('click', loadGame);
	battleLog.addEventListener('click', checkRestartButton);

	function loadGame() {
		loadImages();
	}

	function loadImages() {
		var progress = intro.querySelector('#progress'),
			progressBar = progress.querySelector('.progress-bar'),
			images,
			interval;

		startBtn.style.display = 'none';
		progress.style.display = 'block';

		images = [
			'dungeon-sprite.png',
			'hero-walk.png',
			// 'armor-sprite.png',
			// 'camp-fire.png',
			// 'crystal-blue.png',
			// 'crystal-green.png',
			// 'crystal-grey.png',
			// 'crystal-orange.png',
			// 'crystal-pink.png',
			// 'crystal-yellow.png',
			// 'orc-sprite.png'
			'splatter.jpg'
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
					startGame();
					setTimeout(function() {
						intro.style.display = 'none';
					},500);
				},1000);
			}
		},16);
	}

	function startGame() {
		lj.realm.makeRealm(1);
		lj.scene.enter('DOWN');
		document.getElementById("healthBarBox").className = "";
	}

}());