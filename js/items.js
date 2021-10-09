window.lj = lj || {};
(() => {
  lj.items = {};
  const iItems = lj.items;
  const iStats = lj.stats;
  iItems.util = {
    capFirst(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
  };
  iItems.types = {
    head: [],
    shoulder: [],
    chest: [],
    cloak: [],
    gloves: [],
    pants: [],
    boots: [],
    ring: [],
    weapon: [],
  };
  iItems.qualities = {
    poor: { mod: 0.5, chance: 100 },
    normal: { mod: 1, chance: 750 },
    rare: { mod: 1.5, chance: 100 },
    epic: { mod: 2.5, chance: 40 },
    legendary: { mod: 5, chance: 10 },
    get() {
      let total =
        this.poor.chance +
        this.normal.chance +
        this.rare.chance +
        this.epic.chance +
        this.legendary.chance;
      let roll;
      const baseMF =
        lj.hero.stats.get()["magicFind"] >= 0
          ? lj.hero.stats.get()["magicFind"]
          : 1;
      const mf = baseMF * 2 ** (lj.realm.getSize() - 1);
      roll = lj.util.randomInterval(mf, total);
      total -= this.legendary.chance;
      if (total < roll) {
        return "legendary";
      }
      total -= this.epic.chance;
      if (total < roll) {
        return "epic";
      }
      total -= this.rare.chance;
      if (total < roll) {
        return "rare";
      }
      total -= this.normal.chance;
      if (total < roll) {
        return "normal";
      }
      return "poor";
    },
  };

  iItems.item = function (slot, type, prefix, suffix, quality) {
    this.slot = slot;
    this.type = type;
    if (Math.floor(Math.random() * 10 + 1) <= 3) {
      this.prefix = prefix;
    } else {
      this.prefix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.prefix.name = "";
    }
    if (Math.floor(Math.random() * 10 + 1) <= 3) {
      this.suffix = suffix;
    } else {
      this.suffix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.suffix.name = "";
    }

    if (!quality) {
      this.quality = lj.items.qualities.get();
    } else {
      this.quality = quality;
    }

    //Set the stats of the item based on type, prefix, affix and apply the quality multiplier
    lj.stats.init(this);
    this.strength = Math.round(
      (this.prefix[0] + this.type[0] + this.suffix[0]) *
        lj.items.qualities[this.quality].mod
    );
    this.agility = Math.round(
      (this.prefix[1] + this.type[1] + this.suffix[1]) *
        lj.items.qualities[this.quality].mod
    );
    this.luck = Math.round(
      (this.prefix[2] + this.type[2] + this.suffix[2]) *
        lj.items.qualities[this.quality].mod
    );
    this.hp = Math.round(
      (this.prefix[3] + this.type[3] + this.suffix[3]) *
        lj.items.qualities[this.quality].mod
    );
    this.hit = Math.round(
      (this.prefix[4] + this.type[4] + this.suffix[4]) *
        lj.items.qualities[this.quality].mod
    );
    this.crit = Math.round(
      (this.prefix[5] + this.type[5] + this.suffix[5]) *
        lj.items.qualities[this.quality].mod
    );
    this.armor = Math.round(
      (this.prefix[6] + this.type[6] + this.suffix[6]) *
        lj.items.qualities[this.quality].mod
    );
    this.defense = Math.round(
      (this.prefix[7] + this.type[7] + this.suffix[7]) *
        lj.items.qualities[this.quality].mod
    );
    this.magicFind = Math.round(
      (this.prefix[8] + this.type[8] + this.suffix[8]) *
        lj.items.qualities[this.quality].mod
    );

    //Finally, give it a pretty name
    this.name = `${this.prefix.name} ${type.name} ${this.suffix.name}`;
    this.name = this.name.trim();
    if (this.quality != "normal") {
      this.name = `${lj.util.capitaliseFirstLetter(this.quality)} ${this.name}`;
    }

    //Some housework
    delete this.prefix;
    delete this.suffix;
    delete this.type;
  };
  iItems.makeItem = function (level, slot, quality) {
    const rng = lj.util.randomInterval;
    let slotArray;
    let slotIndex;
    let itemLevel;
    if (!level) {
      this.itemLevel = 1;
    } else {
      this.itemLevel = level;
    }
    //If no specific slot is requested, get a random one.
    if (!slot) {
      slotArray = [
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
      slotIndex = rng(0, slotArray.length - 1);
      this.itemSlot = slotArray[slotIndex];
    } else {
      this.itemSlot = slot;
    }
    if (quality) {
      this.quality = quality;
    } else {
      this.quality = null;
    }
    //Based on the slot picked, get a random type
    this.itemType = lj.items.types.get(itemLevel, this.itemSlot);

    //Getting prefix
    this.itemPrefix = lj.stats.prefixes.get(
      rng(0, lj.stats.prefixes.length - 1)
    );

    //Getting Suffix
    this.itemSuffix = lj.stats.suffixes.get(
      rng(0, lj.stats.suffixes.length - 1)
    );

    return new iItems.item(
      this.itemSlot,
      this.itemType,
      this.itemPrefix,
      this.itemSuffix,
      this.quality
    );
  };

  //------------
  //Item types
  //------------
  //------------
  //Base Items
  //------------
  //Head
  lj.items.types.head.push(new iStats.fix([0, 0, 0, 0, 0, 0, 1, 0, 0], "Cap"));
  lj.items.types.head.push(new iStats.fix([0, 1, 0, 1, 0, 1, 0, 0, 0], "Hood"));
  lj.items.types.head.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 2, 2, 0], "Helmet")
  );
  lj.items.types.head.push(
    new iStats.fix([1, 1, 0, 1, 0, 0, 0, 0, 0], "Bandana")
  );
  lj.items.types.head.push(
    new iStats.fix([0, 0, 2, 0, 0, 0, 0, 0, 2], "Top Hat")
  );
  //Shoulder
  lj.items.types.shoulder.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 2, 2, 0], "Pauldrons")
  );
  lj.items.types.shoulder.push(
    new iStats.fix([0, 0, 0, 0, 2, 2, 0, 0, 0], "Shoulder Spikes")
  );
  lj.items.types.shoulder.push(
    new iStats.fix([2, 0, 0, 0, 0, 0, 1, 1, 0], "Pads")
  );
  lj.items.types.shoulder.push(
    new iStats.fix([0, 2, 0, 0, 0, 0, 0, 0, 1], "Spaulders")
  );
  //Chest
  lj.items.types.chest.push(
    new iStats.fix([0, 1, 0, 3, 0, 0, 0, 0, 0], "Robe")
  );
  lj.items.types.chest.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 2, 2, 0], "Breastplate")
  );
  lj.items.types.chest.push(
    new iStats.fix([1, 0, 0, 1, 0, 0, 1, 1, 0], "Vest")
  );
  lj.items.types.chest.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 0, 4, 0], "Chainmail")
  );
  //Cloak
  lj.items.types.cloak.push(
    new iStats.fix([0, 0, 3, 0, 0, 0, 0, 0, 0], "Cape")
  );
  lj.items.types.cloak.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 0, 0, 2], "Backpack")
  );
  lj.items.types.cloak.push(
    new iStats.fix([0, 2, 0, 0, 0, 2, 0, 0, 0], "Cloak")
  );
  //Gloves
  lj.items.types.gloves.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 2, 2, 0], "Gauntlets")
  );
  lj.items.types.gloves.push(
    new iStats.fix([0, 2, 0, 0, 0, 0, 1, 1, 0], "Gloves")
  );
  lj.items.types.gloves.push(
    new iStats.fix([3, 0, 0, 0, 0, 2, 0, 0, 0], "Brass Knuckles")
  );
  //Pants
  lj.items.types.pants.push(
    new iStats.fix([1, 1, 1, 1, 0, 0, 0, 0, 0], "Slacks")
  );
  lj.items.types.pants.push(
    new iStats.fix([0, 2, 0, 0, 0, 1, 0, 0, 1], "Dress Pants")
  );
  lj.items.types.pants.push(
    new iStats.fix([1, 0, 0, 0, 2, 0, 0, 0, 0], "Kilt")
  );
  lj.items.types.pants.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 2, 3, 0], "Legplates")
  );
  //Boots
  lj.items.types.boots.push(
    new iStats.fix([0, 1, 0, 0, 2, 1, 0, 0, 0], "Jaki-tabis")
  );
  lj.items.types.boots.push(
    new iStats.fix([0, 2, 0, 0, 0, 0, 0, 1, 0], "Sneakers")
  );
  lj.items.types.boots.push(
    new iStats.fix([0, 0, 0, 1, 0, 0, 2, 2, 0], "Greaves")
  );
  lj.items.types.boots.push(
    new iStats.fix([0, 1, 0, 1, 0, 0, 2, 3, 1], "Stilettos")
  );
  //Ring
  lj.items.types.ring.push(
    new iStats.fix([0, 0, 0, 3, 0, 0, 1, 0, 0], "Bronze Ring")
  );
  lj.items.types.ring.push(
    new iStats.fix([1, 2, 0, 0, 0, 0, 0, 1, 0], "Silver Ring")
  );
  lj.items.types.ring.push(
    new iStats.fix([0, 0, 1, 0, 0, 1, 0, 0, 1], "Gold Ring")
  );
  lj.items.types.ring.push(
    new iStats.fix([0, 0, 0, 1, 0, 0, 2, 3, 0], "Stone Band")
  );
  //Trinket

  //------------
  //Weapons
  //------------
  //Swords
  lj.items.types.weapon.push(
    new iStats.fix([3, 4, 0, 0, 2, 0, 0, 0, 0], "Dagger")
  );
  lj.items.types.weapon.push(
    new iStats.fix([6, 1, 0, 0, 2, 0, 0, 0, 0], "Claymore")
  );
  lj.items.types.weapon.push(
    new iStats.fix([1, 6, 0, 0, 2, 0, 0, 0, 0], "Katana")
  );
  lj.items.types.weapon.push(
    new iStats.fix([3, 3, 0, 0, 2, 1, 0, 0, 0], "Schimitar")
  );
  //Hammers
  lj.items.types.weapon.push(
    new iStats.fix([9, -1, 0, 0, 0, 0, 0, -1, 0], "Stone Maul")
  );
  lj.items.types.weapon.push(
    new iStats.fix([7, 0, 0, 1, 0, 0, 0, 0, 0], "Mace")
  );
  lj.items.types.weapon.push(
    new iStats.fix([3, 2, 0, 0, 0, 0, 0, 0, 2], "Cane")
  );
  //Axes
  lj.items.types.weapon.push(
    new iStats.fix([2, 5, 0, 0, 0, 2, 0, 0, 0], "Hatchet")
  );
  lj.items.types.weapon.push(
    new iStats.fix([3, 3, 0, 0, 1, 2, 0, 0, 0], "Cleaver")
  );
  lj.items.types.weapon.push(
    new iStats.fix([5, 2, 0, 0, 0, 2, 0, 0, 0], "Double Axe")
  );

  lj.items.types.get = function (level, slot, type) {
    const rng = lj.util.randomInterval;
    const statArray = [];
    const vary = lj.stats.vary;
    let typeArray;
    let typeIndex;
    //Deal with level
    if (!level) {
      this.itemLevel = 1;
    } else {
      this.itemLevel = level;
    }
    //Deal with slot
    if (!slot) {
      this.slotArray = [
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
      this.slotIndex = rng(0, this.slotArray.length - 1);
      this.itemSlot = this.slotArray[this.slotIndex];
    } else {
      this.itemSlot = slot;
    }
    if (!type) {
      typeArray = lj.items.types[this.itemSlot];
      typeIndex = rng(0, lj.items.types[this.itemSlot].length - 1);
      this.itemType = typeArray[typeIndex];
    } else {
      this.itemType = type;
    }
    //Generate some stats
    statArray[0] = vary(this.itemType.strength, this.itemLevel);
    statArray[1] = vary(this.itemType.agility, this.itemLevel);
    statArray[2] = vary(this.itemType.luck, this.itemLevel);
    statArray[3] = vary(this.itemType.hp, this.itemLevel);
    statArray[4] = vary(this.itemType.hit, this.itemLevel);
    statArray[5] = vary(this.itemType.crit, this.itemLevel);
    statArray[6] = vary(this.itemType.armor, this.itemLevel);
    statArray[7] = vary(this.itemType.defense, this.itemLevel);
    statArray[8] = vary(this.itemType.magicFind, this.itemLevel);
    statArray.name = this.itemType.name;
    statArray.itemLevel = this.itemLevel;
    return statArray;
  };
})();
lj.items.lots = (num, bool) => {
  let i;
  let obj;
  let str = "";
  if (!bool) {
    for (i = 0; i < num; i++) {
      obj = lj.items.makeItem();
      console.log(obj.name);
    }
  } else {
    for (i = 0; i < num; i++) {
      obj = lj.items.makeItem();
      str = `${str + obj.name}\n`;
    }
    return str;
  }
};
