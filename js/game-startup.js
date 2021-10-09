(() => {
  window.lj = new Game({
    nrOfRows: 11,
    nrOfCols: 11,
    tileSize: 32,
    realmSize: 2,
    assetsPath: "assets/",
  });

  function checkRestartButton({ target }) {
    const eleClass = target.getAttribute("class");

    if (eleClass === "btn restart") {
      lj.scene.reset();
      lj.battleLog.clear();
      lj.hero.gear.clear();
    }
  }

  const intro = document.getElementById("gameIntro");
  const startBtn = intro.querySelector(".btn-start");
  const battleLog = document.getElementById("battleLog");

  startBtn.addEventListener("click", loadGame);
  battleLog.addEventListener("click", checkRestartButton);

  function loadGame() {
    loadImages();
  }

  function loadImages() {
    const progress = intro.querySelector("#progress");
    const progressBar = progress.querySelector(".progress-bar");
    let images;
    let interval;

    startBtn.style.display = "none";
    progress.style.display = "block";

    images = ["sprite.png"];

    images.forEach((image) => {
      lj.queueImage(image);
    });

    interval = setInterval(() => {
      const completed = lj.loadImages();
      progressBar.style.width = `${completed * 2}px`;
      if (completed === 100) {
        clearInterval(interval);
        setTimeout(() => {
          intro.setAttribute("class", "faded");
          startGame();
          setTimeout(() => {
            intro.style.display = "none";
          }, 500);
        }, 1000);
      }
    }, 16);
  }

  function startGame() {
    lj.realm.makeRealm(1);
    lj.scene.enter("DOWN");
    document.getElementById("healthBarBox").className = "";
    document.getElementById("charPane").className = "";
    document.getElementById("battleLog").className = "";
    lj.hero.updateCharPane();
  }
})();
