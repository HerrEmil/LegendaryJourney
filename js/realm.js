/*
Room structure legend:
' ' = Path
'#' = Wall

'L' = Door leading Left
'U' = Door leading Up
'R' = Door leading Right
'D' = Door leading Down

'B' = Boss

'E' = Generic Enemy
'C' = Generic Chest

'a' = Monster type a
'b' = Monster type b
'c' = Monster type c
[...]
'z' = Monster type z

'1' = Chest type 1
'2' = Chest type 2
'3' = Chest type 3
[...]
'9' = Chest type 9
*/

window.lj = lj || {};

lj.realm = (() => {
  const rooms = [];
  const chestsAndMonsters = [];
  let size;
  const doors = [];
  let currentRoom = 90;
  let bossRoom;
  let biome;

  // Biomes — depth-themed dungeon architecture. Every realm's rooms share one
  // biome, chosen to MIRROR the enemy-family ladder (brown Halls, blue
  // Frostmarch, green Blightwood, red Emberdeep) so the ARCHITECTURE reads the
  // same way the enemies do as you descend. Biomes only ever emit '#'/' ' — the
  // sprite sheet is a single 16-tile row with no spare art (see js/scene.js
  // spriteMap) — so they change how a room is SHAPED and navigated, never its
  // combat. Each biome just RE-WEIGHTS the base "bomberman" offshoot rule
  // (makeRoom below): every interior pillar still sprouts AT MOST ONE wall and
  // pass-2 walls never grow back "west", which is exactly what makes the base
  // layout provably connected, so re-weighting the direction (or skipping the
  // sprout entirely) preserves full traversability. scripts/selfplay.mjs
  // --rooms flood-fills thousands of rooms per biome to prove it.
  //
  // Direction candidates are [dCol, dRow, weight]; the west/east cell is the
  // "escape" fallback that placeOffshoot uses if the weighted picks are blocked
  // (that cell is never pre-walled when a pillar is processed — see makeRoom).
  const WEST = [-1, 0];
  const EAST = [1, 0];
  const biomes = {
    // The reference layout: an even pillar-grid with a random offshoot on every
    // pillar. Uniform weights reproduce the original generator's behaviour (a
    // uniform-random offshoot per pillar); placeOffshoot's bounded-retry +
    // escape fallback only differs from the old retry-until-free loop by a
    // negligible bias toward the escape cell in the rare all-blocked case.
    halls: {
      name: "halls",
      sprout: 1,
      pass1: [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1]],
      pass2: [[1, 0, 1], [0, 1, 1], [0, -1, 1]],
    },
    // Frostmarch — vertical colonnades: offshoots lean up/down, carving long
    // north-south corridors between orderly columns (a frozen-cathedral feel).
    frost: {
      name: "frost",
      sprout: 1,
      pass1: [[0, 1, 3], [0, -1, 3], [1, 0, 1], [-1, 0, 1]],
      pass2: [[0, 1, 3], [0, -1, 3], [1, 0, 1]],
    },
    // Blightwood — lateral warren: offshoots lean east/west, growing twisty
    // horizontal thickets that break the room into overgrown side-passages.
    blight: {
      name: "blight",
      sprout: 1,
      pass1: [[1, 0, 3], [-1, 0, 3], [0, 1, 1], [0, -1, 1]],
      pass2: [[1, 0, 3], [0, 1, 1], [0, -1, 1]],
    },
    // Emberdeep — open caverns: only some pillars sprout at all, leaving wide
    // molten halls with scattered lone pillars. Strictly fewer walls than the
    // reference layout, so connectivity is guaranteed by inclusion.
    ember: {
      name: "ember",
      sprout: 0.55,
      pass1: [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1]],
      pass2: [[1, 0, 1], [0, 1, 1], [0, -1, 1]],
    },
  };

  // Realm-depth -> biome, clamped at the deepest biome for all deeper realms —
  // the same shape as lj.enemy.familyForRealm, so architecture and enemies stay
  // in lockstep (r1 halls, r2 frost, r3 blight, r4+ ember).
  const biomeLadder = ["halls", "frost", "blight", "ember"];
  function biomeForRealm(realmSize) {
    const idx = Math.max(0, Math.min(realmSize - 1, biomeLadder.length - 1));
    return biomes[biomeLadder[idx]];
  }

  // Wall off ONE cell next to the pillar at (col,row), chosen from the biome's
  // weighted candidate directions. Retries a bounded number of times if the
  // picked cell is already a wall, then falls back to the guaranteed-free escape
  // cell so generation always terminates and every pillar sprouts at most one
  // wall (preserving the base layout's connectivity).
  function placeOffshoot(room, col, row, candidates, escape) {
    let totalWeight = 0;
    for (let i = 0; i < candidates.length; i += 1) {
      totalWeight += candidates[i][2];
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      let pick = Math.random() * totalWeight;
      let chosen = candidates[candidates.length - 1];
      for (let i = 0; i < candidates.length; i += 1) {
        pick -= candidates[i][2];
        if (pick < 0) {
          chosen = candidates[i];
          break;
        }
      }
      const tCol = col + chosen[0];
      const tRow = row + chosen[1];
      if (room[tCol][tRow] === " ") {
        room[tCol][tRow] = "#";
        return;
      }
    }
    const eCol = col + escape[0];
    const eRow = row + escape[1];
    if (room[eCol][eRow] === " ") {
      room[eCol][eRow] = "#";
    }
  }

  function pickRandomEnemyType() {
    const randomNumber = Math.floor(Math.random() * 4);
    switch (randomNumber) {
      case 0:
        return "a";
      case 1:
        return "b";
      case 2:
        return "c";
      case 3:
        return "d";
      default:
        return "E";
    }
  }

  function getRoomNumberFromPosition(x, y) {
    return y * size + x;
  }

  function randomDoorPosition() {
    // Note that this only works with our 11 x 11 room size
    return Math.floor(Math.random() * 5 + 1) * 2 - 1;
  }

  function getRoom(room) {
    const copy = [];
    let x;
    const length = rooms[room].length;
    for (x = 0; x < length; x += 1) {
      copy[x] = rooms[room][x].slice(0);
    }
    return copy;
  }
  function spawnChestsAndMonsters(room) {
    const spawnPoints = []; // Between 4 and 6 chests
    let x;
    let y;
    let i;
    let length;
    let randomPosition;
    let numberOfSpawns;
    let roomX;
    let roomY;

    const // Pick a semi-random number or enemies and chests
      // Between 4 and 8 enemies
      enemies = Math.floor(Math.random() * 4 + 1) + 4;

    const chests = Math.floor(Math.random() * 2 + 1) + 4;

    // Create a map of all possible spawn points
    length = rooms[room].length;
    for (x = 1; x < length; x += 1) {
      for (y = 1; y < length; y += 1) {
        if (rooms[room][x][y] === " " && (x !== 5 || y !== 9)) {
          spawnPoints.push({ x, y });
        }
      }
    }

    chestsAndMonsters[room] = [
      ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"], //
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"],
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"], //
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"],
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"], //
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"],
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"], //
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"],
      ["#", " ", " ", " ", " ", " ", " ", " ", " ", " ", "#"], //
      ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ];

    numberOfSpawns = spawnPoints.length;

    for (i = 0; i < chests; i += 1) {
      // Pick a random spawn point and grab its x and y values
      randomPosition = Math.floor(Math.random() * numberOfSpawns);
      roomX = spawnPoints[randomPosition].x;
      roomY = spawnPoints[randomPosition].y;

      // Add an chest in chest and monster structure, as long as it's not in the character's spawn point
      if (roomX !== 5 || roomY !== 9) {
        chestsAndMonsters[room][roomX][roomY] = "C";
      }
    }

    // Loop through enemies
    for (i = 0; i < enemies; i += 1) {
      // Pick a random spawn point and grab its x and y values
      randomPosition = Math.floor(Math.random() * numberOfSpawns);
      roomX = spawnPoints[randomPosition].x;
      roomY = spawnPoints[randomPosition].y;

      chestsAndMonsters[room][roomX][roomY] = pickRandomEnemyType();
      // If boss room, replace last placed enemy with the realm's boss. Which
      // boss guards the exit is depth-dependent (grade "B" normally; from realm 5
      // on one of the six apex bosses T/W/S/M/H/F rotating on size % 6) — see
      // lj.enemy.bossGradeForRealm.
      if (room === bossRoom && i === enemies - 1) {
        chestsAndMonsters[room][roomX][roomY] =
          lj.enemy.bossGradeForRealm(size);
      }
    }
  }

  // Generate a new room with doors according to doors array and fill with
  function makeRoom(room) {
    let x;
    let y;
    let height;
    let width;

    // Add empty room
    rooms[room] = [
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], //
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], //
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], //
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], //
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], //
      [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
    ];

    // Save height and width of room
    width = rooms[room].length;
    height = rooms[room][0].length;

    // The realm's BOSS ROOM is a distinct ARENA: it keeps the outer bomberman
    // colonnade but clears its four central pillars into an open plaza and skips
    // the biome offshoots entirely, so you step from the cluttered warren of the
    // realm into a wide, deliberate lair. The arena is PURELY SUBTRACTIVE from
    // the reference grid (strictly fewer walls than any biome room), so it is
    // fully traversable by inclusion — connectivity can only IMPROVE when walls
    // are removed. scripts/selfplay.mjs --rooms flood-fills it to prove it and
    // asserts the plaza was actually carved. It emits only '#'/' ' (no new tile
    // symbol => no paint risk), and playthrough() never calls makeRoom, so the
    // win rate is untouched by construction — a pure structure/UX change.
    const isBossRoom = room === bossRoom;

    // Draw wall at edge of room and a grid (making a "bomberman" wall layout)
    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        const isPillar = y % 2 === 0 && x % 2 === 0;
        // Boss arena: the four central pillars (cols/rows 4 & 6) are left open,
        // framing the fight in the middle of the ring of remaining pillars.
        const isCentralPillar =
          isBossRoom && (x === 4 || x === 6) && (y === 4 || y === 6);
        if (
          y === 0 ||
          x === 0 ||
          y === height - 1 ||
          x === width - 1 ||
          (isPillar && !isCentralPillar)
        ) {
          rooms[room][x][y] = "#";
        }
      }
    }

    // Sprout the pillar offshoots that give the room its shape. The direction
    // weights and sprout chance come from the realm's biome (set in makeRealm);
    // the leftmost column may sprout WEST (its escape cell), the rest may not
    // — pass-2 walls only grow east/vertical so they can never close a loop.
    // The boss arena above skips this entirely: its lair stays an open plaza.
    if (!isBossRoom) {
      // Leftmost column of pillars — WEST is a legal (and guaranteed-free) target.
      for (y = 2; y < height - 1; y += 2) {
        if (Math.random() < biome.sprout) {
          placeOffshoot(rooms[room], 2, y, biome.pass1, WEST);
        }
      }

      // All other pillar columns — EAST is the guaranteed-free escape target.
      for (x = 4; x < width - 1; x += 2) {
        for (y = 2; y < height - 1; y += 2) {
          if (Math.random() < biome.sprout) {
            placeOffshoot(rooms[room], x, y, biome.pass2, EAST);
          }
        }
      }
    }

    // Place doors in room
    // If left, place 'L' in x0 at y where doors says y should be
    if (doors[room].L) {
      rooms[room][0][doors[room].L] = "L";
    }
    // If up, place 'U' in y0 at X where doors says X should be
    if (doors[room].U) {
      rooms[room][doors[room].U][0] = "U";
    }
    // If right, place 'R' in x(size-1) where doors says y should
    if (doors[room].R) {
      rooms[room][width - 1][doors[room].R] = "R";
    }
    // If down, place 'D' in y(size-1) where doors says x
    if (doors[room].D) {
      rooms[room][doors[room].D][height - 1] = "D";
    }

    spawnChestsAndMonsters(room);
  }

  function placeDoors() {
    let roomNumber;
    let x;
    let y;

    // Clear previous door positions
    doors.length = 0;

    // Go through rooms from top left to bottom right and add doors in separate structure similar to rooms
    for (y = 0; y < size; y += 1) {
      for (x = 0; x < size; x += 1) {
        roomNumber = getRoomNumberFromPosition(x, y);

        // Create new empty door position structure in the same position as a room in rooms array
        doors[roomNumber] = {
          L: 0,
          U: 0,
          R: 0,
          D: 0,
        };

        // Left door should be placed in all column but the first
        if (x > 0) {
          // Left door is always placed on the same position as right door in the room to the left
          doors[roomNumber].L = doors[roomNumber - 1].R;
        }

        // Top door should be placed in all rows but the first
        if (y > 0) {
          // Top door is always placed on the same position as the bottom door in the room above
          doors[roomNumber].U = doors[roomNumber - size].D;
        }

        // Right door should be placed in all columns except the last
        if (x % size < size - 1) {
          // Right door is placed at random position
          doors[roomNumber].R = randomDoorPosition();
        }

        // Bottom door should be placed in all rows but the last
        if (y % size < size - 1) {
          // Bottom door is placed at random position
          doors[roomNumber].D = randomDoorPosition();
        }
      }
    }
  }

  function getCurrentRoom() {
    return currentRoom;
  }

  function getSize() {
    return size;
  }

  // Name of the current realm's biome (or the biome a given realm size would
  // use). Pure/read-only — used by the self-play room validator and for debug.
  function getBiomeName() {
    return biome ? biome.name : null;
  }

  // Room number of the current realm's boss room (the one makeRoom lays out as
  // the open-plaza arena). Pure/read-only — the self-play room validator uses it
  // to confirm boss rooms were sampled and their arena actually carved.
  function getBossRoom() {
    return bossRoom;
  }

  function makeRealm(realmSize) {
    let roomNumber;
    // Clear previous realm
    rooms.length = 0;
    size = realmSize;
    // Lock in this realm's architecture; every room generated below shares it.
    biome = biomeForRealm(size);

    // Make empty maps for rooms and monsters
    for (let x = 0; x < size; x += 1) {
      for (let y = 0; y < size; y += 1) {
        roomNumber = getRoomNumberFromPosition(x, y);
        rooms[roomNumber] = [];
        chestsAndMonsters[roomNumber] = [];
      }
    }

    // Set door positions
    placeDoors();

    // Pick one of the top rooms for the boss
    bossRoom = Math.floor(Math.random() * size);

    // Start in one of the bottom rooms
    currentRoom = rooms.length - 1 - Math.floor(Math.random() * size);

    // Make first room
    makeRoom(currentRoom);
  }

  // Remove a monster or chest from current room
  function clearTile(tile) {
    chestsAndMonsters[currentRoom][tile[0]][tile[1]] = " ";
  }

  function getChestsAndMonsters(room) {
    return [...chestsAndMonsters[room]];
  }

  function enterRoom(room) {
    currentRoom = room;
    if (!rooms[currentRoom].length) {
      makeRoom(room);
    }
  }

  return {
    // Call when starting a quest to create the dungeon
    makeRealm,

    // Call to get a copy of the wall layout or monster/pickups layout
    getRoom,
    getChestsAndMonsters,

    // Check which room you currently are in (room number needed for other functions)
    getCurrentRoom,

    // Get realm size (1, two, or three)
    getSize,

    // Name of the current realm's depth-themed architecture (read-only)
    getBiomeName,

    // Room number of the current realm's boss room (read-only)
    getBossRoom,

    // Call when entering a door
    enterRoom,

    // Call to remove monster or chest
    clearTile,
  };
})();
