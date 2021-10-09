window.lj = lj || {};

lj.hero.gear = {
  equipped: {
    head: null,
    shoulder: null,
    chest: null,
    cloak: null,
    gloves: null,
    pants: null,
    boots: null,
    ring: null,
    weapon: null,
  },
  inventory: [],
  equip(item) {
    //Store the currently equipped item
    this.unequip(item.slot);
    //equip the new
    this.equipped[item.slot] = item;

    //and remove from inventory
    this.drop(item);
    lj.hero.stats.updateHealth();
    if (item.quality == "legendary") {
      this.legendary.add(item);
    }
  },
  unequip(item) {
    let old;
    //Store the currently equipped item
    if (typeof item == "string") {
      old = this.equipped[item];
    } else {
      old = this.equipped[item.slot];
    }
    if (old != null) {
      this.equipped[old.slot] = null;
    }
    lj.hero.stats.updateHealth();
  },
  pickup(item) {
    const current = this.equipped[item.slot];
    let curVal;
    let newVal;

    if (current != null) {
      curVal = this.gScore(current);
      newVal = this.gScore(item);
    } else {
      lj.battleLog.autoEquip(item.name, item.quality);
      this.equip(item);
      lj.hero.updateCharPane();
      return true;
    }
    if (newVal >= curVal) {
      lj.battleLog.autoEquip(item.name, item.quality);
      this.equip(item);
      lj.hero.updateCharPane();
      return true;
    } else {
      lj.battleLog.acquire(item.name, item.quality);
      lj.hero.updateCharPane();
      return false;
    }
  },
  drop(item) {
    let inventoryIndex;
    //Find it
    inventoryIndex = this.inventory.indexOf(item);
    if (inventoryIndex != -1) {
      //Nuke it
      this.inventory.splice(inventoryIndex, 1);
    }
  },
  gScore(item) {
    //quick and dirty gear evaluator.
    let i;

    const attrs = [
      "strength",
      "agility",
      "hp",
      "hit",
      "crit",
      "armor",
      "defense",
      "magicFind",
    ];
    let score = 0;
    let cur;
    for (i = 0; i < 8; i++) {
      cur = attrs[i];
      score += item[cur];
    }
    if (item.quality === "legendary") {
      score += 1000; //Inflate legendary values
    }
    return score;
  },
  clear() {
    lj.hero.gear.equipped = {
      head: null,
      shoulder: null,
      chest: null,
      cloak: null,
      gloves: null,
      pants: null,
      boots: null,
      ring: null,
      weapon: null,
    };
    lj.hero.gear.legendary.slots = {
      head: null,
      shoulder: null,
      chest: null,
      cloak: null,
      gloves: null,
      pants: null,
      boots: null,
      ring: null,
      weapon: null,
    };
    lj.hero.gear.inventory = [];
    lj.hero.stats.health = 100;
    lj.hero.stats.updateHealth();
    lj.hero.updateCharPane();
  },
  legendary: {
    slots: {
      head: null,
      shoulder: null,
      chest: null,
      cloak: null,
      gloves: null,
      pants: null,
      boots: null,
      ring: null,
      weapon: null,
    },
    fullLegendarySet() {
      return !Object.values(this.slots).some((slot) => slot === null);
    },
    add(item) {
      this.slots[item.slot] = item;
      if (this.fullLegendarySet() == 9) {
        lj.battleLog.gameComplete();
        setTimeout(() => {
          lj.scene.paintWin();
          lj.hero.ascend();
        }, 300);
      }
    },
  },
};
lj.hero.stats = {
  self: {
    strength: 5,
    agility: 5,
    luck: 0,
    hp: 0,
    hit: 5,
    crit: 0,
    armor: 0,
    defense: 0,
    magicFind: 0,
  },
  health: 100,
  updateHealth() {
    let percent;
    const current = Math.floor(this.health);
    const max = 100 + lj.hero.stats.get().hp * 5;
    percent = Math.round((current / max) * 100);
    document.getElementById("healthBar").style.width = `${2 * percent}px`;
    if (current == 0) {
      document.getElementById("stay").innerHTML = "DEAD";
    } else {
      document.getElementById("stay").innerHTML = `${current}/${max}`;
    }
  },
  heal(amount) {
    const maxHP = 100 + lj.hero.stats.get().hp * 5;
    //Number based heal
    this.health += amount;
    if (this.health > maxHP) {
      this.health = maxHP;
    }

    this.updateHealth();
  }, //Remember to keep track of decimals and keep pretty numbers
  hurt(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
    }
    this.updateHealth();
  },
  buff(stat, value) {
    this.self[stat] += value;
  },
  get() {
    const statObj = JSON.parse(JSON.stringify(this.self));
    const slots = [
      "head",
      "shoulder",
      "chest",
      "cloak",
      "gloves",
      "pants",
      "boots",
      "ring",
      "weapon",
    ];
    const attrs = [
      "strength",
      "agility",
      "luck",
      "hp",
      "hit",
      "crit",
      "armor",
      "defense",
      "magicFind",
    ];
    let i;
    let j;

    for (i = 0; i < slots.length; i++) {
      for (j = 0; j < attrs.length; j++) {
        if (lj.hero.gear.equipped[slots[i]] != null) {
          statObj[attrs[j]] += lj.hero.gear.equipped[slots[i]][attrs[j]];
        }
      }
    }
    return statObj;
  },
};
lj.hero.fight = (enemy) => {
  //Lets meet the contenders:
  let enemyHealth = enemy["hp"];

  let heroHealth = Math.floor(lj.hero.stats.health);

  const // Snap shotting hero's stats so changing gear between strikes won't work
    heroStats = lj.hero.stats.get();

  let herosTurn = true;
  let lastAction;
  const log = [];
  let heroDamageTaken = 0;

  while (enemyHealth > 0 && heroHealth > 0) {
    lastAction = null;
    if (herosTurn) {
      lastAction = lj.hero.duel(enemy, heroStats);
      lastAction.actor = "hero";
      log.push(lastAction);
      enemyHealth -= lastAction.damage;
    } else {
      lastAction = lj.hero.duel(heroStats, enemy);
      lastAction.actor = "enemy";
      log.push(lastAction);
      heroHealth -= lastAction.damage;
      heroDamageTaken += lastAction.damage;
    }
    herosTurn = !herosTurn;
  }
  //this.stats.hurt(heroDamageTaken); (Handled by the combat)
  return {
    outcome: {
      actor: lastAction.actor,
      damage: heroDamageTaken,
      type: "victory",
    },
    log,
  };
};
lj.hero.duel = (enemy, friend) => {
  //Perform an attack, evaluate the damage and return the results
  const rng = lj.util.randomInterval;

  const netHit = rng(1, 1000) + friend["hit"] - enemy["defense"];
  let damage;
  let type;
  //Will you even hit?
  if (netHit < 100) {
    damage = 0;
    type = "miss";
    return { damage, type };
  }
  //Alright, the hero connects. Damage time
  //Strength first (both min and max base damage)
  damage = friend["strength"];
  //Agility gives double max damage, but no min damage
  damage += rng(0, friend["agility"] * 2);
  //Will you crit?
  if (rng(1, 1000) > 900) {
    damage = Math.round((damage * (150 + friend["crit"])) / 100);
    type = "crit";
  }
  //Enemy has armor :(
  //damage -= enemy["armor"]; //Flat reduction was too strong
  damage = Math.round((damage * (100 - enemy["armor"])) / 100);
  if (!type) {
    type = "hit";
  }
  //stalemate protection
  if (damage <= 0) {
    damage = 1;
  }
  return { damage, type };
};

lj.hero.updateStatsPane = () => {
  const hero = lj.hero.stats.get();
  //Update the Stat pane
  let statStr = `<div class="header">Your current stats</div>`;
  statStr += `<span class="stat">Strength:</span><span class="right">${hero.strength}</span>`;
  statStr += `<span class="stat">Agility:</span><span class="right">${hero.agility}</span><br>`;
  statStr += `<span class="stat">Hit Points:</span><span class="right">${hero.hp}</span>`;
  statStr += `<span class="stat">Hit Increase:</span><span class="right">${hero.hit}</span><br>`;
  statStr += `<span class="stat">Crit Increase:</span><span class="right">${hero.crit}</span>`;
  statStr += `<span class="stat">Armor:</span><span class="right">${hero.armor}</span><br>`;
  statStr += `<span class="stat">Defense:</span><span class="right">${hero.defense}</span>`;
  statStr += `<span class="stat">Magic Find:</span><span class="right">${hero.magicFind}</span>`;
  document.getElementById("stats").innerHTML = statStr;
};

//For lack of better, charPane goes here
lj.hero.updateCharPane = () => {
  lj.hero.updateStatsPane();
  //Update the gear pane
  const gear = lj.hero.gear.equipped;
  let gearStr = '<span class="header">Your current gear</span><br>';
  gearStr +=
    gear.head !== null
      ? `<span class="slot head">Head:</span><span class="${gear.head.quality}">${gear.head.name}</span><br>`
      : '<span class="slot">Head:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';

  gearStr +=
    gear.shoulder !== null
      ? `<span class="slot shoulder">Shoulders:</span><span class="${gear.shoulder.quality}">${gear.shoulder.name}</span><br>`
      : '<span class="slot">Shoulders:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';

  gearStr +=
    gear.cloak !== null
      ? `<span class="slot back">Back:</span><span class="${gear.cloak.quality}">${gear.cloak.name}</span><br>`
      : '<span class="slot">Back:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';

  if (gear.chest !== null) {
    gearStr += `<span class="slot chest">Chest:</span><span class="${gear.chest.quality}">${gear.chest.name}</span><br>`;
  } else {
    gearStr += '<span class="slot">Chest:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
  }
  if (gear.gloves !== null) {
    gearStr += `<span class="slot gloves">Gloves:</span><span class="${gear.gloves.quality}">${gear.gloves.name}</span><br>`;
  } else {
    gearStr += '<span class="slot">Gloves:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
  }
  if (gear.pants !== null) {
    gearStr += `<span class="slot pants">Pants:</span><span class="${gear.pants.quality}">${gear.pants.name}</span><br>`;
  } else {
    gearStr += '<span class="slot">Pants:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
  }
  if (gear.boots !== null) {
    gearStr += `<span class="slot boots">Boots:</span><span class="${gear.boots.quality}">${gear.boots.name}</span><br>`;
  } else {
    gearStr += '<span class="slot">Boots:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
  }
  if (gear.ring !== null) {
    gearStr += `<span class="slot ring">Ring:</span><span class="${gear.ring.quality}">${gear.ring.name}</span><br>`;
  } else {
    gearStr += '<span class="slot">Ring:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
  }
  if (gear.weapon !== null) {
    gearStr += `<span class="slot weapon">Weapon:</span><span class="${gear.weapon.quality}">${gear.weapon.name}</span>`;
  } else {
    gearStr += '<span class="slot">Weapon:</span>&nbsp&nbsp&nbsp&nbsp&nbsp';
  }

  document.getElementById("gear").innerHTML = gearStr;
};
