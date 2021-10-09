window.lj = lj || {};

const fightEl = document.getElementById("fight");
const damageEl = fightEl.querySelector(".damage");
const hitEl = fightEl.querySelector(".hit");

lj.hero = (() => {
  let currentDir = null;
  let room = null;
  let creaturesAndItems = null;

  let // col, row
    currentTile = [5, 9];

  let isBusy = false;

  const stepModifiers = {
    left: [0, -1],
    right: [0, 1],
    up: [-1, 0],
    down: [1, 0],
  };

  const creaturesAndItemsMap = {
    B: "Enemy",
    C: "Chest",
    E: "Enemy",
    a: "Enemy",
    b: "Enemy",
    c: "Enemy",
    d: "Enemy",
  };

  setupListeners();

  function reset() {
    currentTile = [5, 9];
    isBusy = false;
    lj.hero.stats.heal(1000);
  }

  // The hero enters the room...
  function enter(door) {
    // Get the starting tile from realm.js (get door tile)
    const currentRoom = lj.realm.getCurrentRoom();
    room = lj.realm.getRoom(currentRoom);
    creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
    place(currentTile);
  }

  function setupListeners() {
    lj.addKeyListener("left arrow", () => {
      step("left");
    });
    lj.addKeyListener("right arrow", () => {
      step("right");
    });
    lj.addKeyListener("up arrow", () => {
      step("up");
    });
    lj.addKeyListener("down arrow", () => {
      step("down");
    });
  }

  // PRIVATE: place the hero on a tile
  function place(tile) {
    currentTile = tile;
    lj.scene.paint(tile);
    checkTile(tile);
  }

  function move(tile) {
    let type;

    try {
      type = room[tile[0]][tile[1]];
    } catch (err) {
      move(currentTile);
      return;
    }

    // Find out what type of tile we're moving to
    switch (type) {
      case "#":
        return;
      case " ":
        lj.hero.stats.heal(0.5);
        place(tile);
        break;
      case "D":
        currentTile[1] = 0;
        lj.scene.exit(type);
        break;
      case "U":
        currentTile[1] = 10;
        lj.scene.exit(type);
        break;
      case "L":
        currentTile[0] = 10;
        lj.scene.exit(type);
        break;
      case "R":
        currentTile[0] = 0;
        lj.scene.exit(type);
        break;
      default:
        move(currentTile);
        break;
    }
  }

  function checkTile(tile) {
    const item = creaturesAndItems[tile[0]][tile[1]];

    if (creaturesAndItemsMap[item]) {
      isBusy = true;
      interact(item, tile);
    }
  }

  function interact(item, tile) {
    const currentRoom = lj.realm.getCurrentRoom();
    const type = creaturesAndItemsMap[item];

    function outcome(timeout) {
      setTimeout(() => {
        fightEl.setAttribute("class", "");
        if (fight.outcome.actor === "hero") {
          lj.battleLog.monsterKilled(enemy.name);
          lj.realm.clearTile(tile);
          lj.scene.eraseTileItem(tile);
          if (item === "B") {
            setTimeout(() => {
              lj.scene.levelUp();
              isBusy = false;
            }, 1000);
          } else {
            isBusy = false;
          }
        } else {
          lj.battleLog.heroKilled(enemy.name);
          lj.scene.eraseTileItem(tile, true);
          lj.hero.updateCharPane();
        }
        creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
      }, timeout);
    }

    if (type === "Chest") {
      lj.hero.gear.pickup(lj.items.makeItem());
      lj.realm.clearTile(tile);
      lj.scene.eraseTileItem(tile);
      isBusy = false;
      creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom);
    } else if (type === "Enemy") {
      var enemy = lj.enemy.get("brown", item);
      var fight = lj.hero.fight(enemy);
      const position = [tile[0] * 32, (tile[1] - 1) * 32];

      fightEl.style.top = `${position[1] + 150}px`;
      fightEl.style.left = `${position[0] + 50}px`;

      fight.log.forEach((log, index) => {
        showFightStat(log, index * 400);
      });

      outcome((fight.log.length + 0.3) * 400);
    }
  }

  // Our Hero is Legendary
  function ascend() {
    isBusy = true;
  }

  function showFightStat({ actor, damage }, timeout) {
    setTimeout(() => {
      if (actor === "hero") {
        hitEl.innerHTML = damage;
        fightEl.setAttribute("class", "dealing");
      } else {
        lj.hero.stats.hurt(damage);
        damageEl.innerHTML = damage;
        fightEl.setAttribute("class", "taking");
      }
    }, timeout);
  }

  // Makes the hero step in a direction
  // Directions: left, right, up, down
  function step(dir) {
    let row;
    let col;
    let nextTile;

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
    enter,
    step,
    reset,
    ascend,
  };
})();
