window.lj = lj || {};
(() => {
  lj.stats = {};
  const iStats = lj.stats;
  iStats.raw = {
    strength: 0, // 0
    agility: 0, // 1
    luck: 0, // 2
    hp: 0, // 3
    hit: 0, // 4
    crit: 0, // 5
    armor: 0, // 6
    defense: 0, // 7
    magicFind: 0, // 8
  };
  iStats.init = (obj) => {
    Object.assign(obj, lj.stats.raw);
  };
  iStats.fix = function (stats, name) {
    this.name = name;
    lj.stats.init(this);
    this.strength = stats[0];
    this.agility = stats[1];
    this.luck = stats[2];
    this.hp = stats[3];
    this.hit = stats[4];
    this.crit = stats[5];
    this.armor = stats[6];
    this.defense = stats[7];
    this.magicFind = stats[8];
  };
  iStats.vary = (value, level) => {
    const rng = lj.util.randomInterval;
    let lowerBound;
    let upperBound;
    lowerBound = value * level;
    upperBound = Math.round(lowerBound * 1.5);
    return rng(lowerBound, upperBound);
  };

  //------------
  //*Fix creation
  //------------
  const pre = (iStats.prefixes = []);
  const suf = (iStats.suffixes = []);

  //Prefix creation
  pre.push(new iStats.fix([1, 1, 0, 0, 0, 1, 0, 0, 0], "Burning"));
  pre.push(new iStats.fix([3, 0, 0, 1, 0, 0, 0, 0, 0], "Strong"));
  pre.push(new iStats.fix([1, 0, 0, 1, 0, 0, 0, 1, 0], "Heavy"));
  pre.push(new iStats.fix([0, 3, 0, 0, 1, 0, 0, 0, 0], "Nimble"));
  pre.push(new iStats.fix([0, 0, 1, 3, 0, 0, 0, 0, 0], "Crafty"));
  pre.push(new iStats.fix([2, 2, 0, 0, 0, 0, 0, 0, 0], "Sharp"));
  pre.push(new iStats.fix([0, 1, 0, 0, 3, 0, 0, 0, 0], "Thin"));
  pre.push(new iStats.fix([0, 0, 0, 0, 0, 3, 0, 0, 0], "Grim"));
  pre.push(new iStats.fix([0, 0, 0, 3, 0, 0, 1, 1, 0], "Stalwart"));
  pre.push(new iStats.fix([0, 0, 2, 0, 2, 0, 0, 0, 0], "Bendy"));
  pre.push(new iStats.fix([1, 1, 1, 1, 1, 1, 1, 1, 1], "Balanced"));
  pre.push(new iStats.fix([1, 0, 0, 0, 0, 0, 0, 0, 0], "Weak"));
  pre.push(new iStats.fix([2, 2, 0, 1, 0, 0, 0, 0, 0], "Grand"));
  pre.push(new iStats.fix([1, 0, 0, 3, 0, 0, 0, 1, 0], "Broad"));
  pre.push(new iStats.fix([0, 4, 0, 0, 0, 2, 0, 1, 0], "Pointy"));
  pre.push(new iStats.fix([0, 0, 0, 0, 0, 0, 2, 2, 0], "Immovable"));
  pre.push(new iStats.fix([1, 1, 0, 0, 0, 0, 0, 0, 2], "Glorious"));

  //Suffix creation
  suf.push(new iStats.fix([0, 1, 2, 1, 0, 0, 0, 0, 0], "of the Phoenix"));
  suf.push(new iStats.fix([5, 0, 0, 0, 0, 0, 0, 0, 0], "of Strength"));
  suf.push(new iStats.fix([0, 5, 0, 0, 0, 0, 0, 0, 0], "of Agility"));
  suf.push(new iStats.fix([0, 0, 5, 0, 0, 0, 0, 0, 0], "of Luck"));
  suf.push(new iStats.fix([0, 0, 0, 5, 0, 0, 0, 0, 0], "of Health"));
  suf.push(new iStats.fix([0, 0, 0, 0, 5, 0, 0, 0, 0], "of Precision"));
  suf.push(new iStats.fix([0, 0, 0, 0, 0, 5, 0, 0, 0], "of Heart-Seeking"));
  suf.push(new iStats.fix([0, 0, 0, 0, 0, 0, 5, 0, 0], "of Armor"));
  suf.push(new iStats.fix([0, 0, 0, 0, 0, 0, 0, 8, 0], "of Defense"));
  suf.push(
    new iStats.fix([0, 0, 0, 0, 0, 0, 0, 0, 7], "of Magical Attraction")
  );
  suf.push(new iStats.fix([0, 0, 0, 1, 0, 0, 2, 2, 0], "of the Heavy"));
  suf.push(new iStats.fix([0, 3, 0, 0, 1, 0, 0, 0, 0], "of the Thief"));
  suf.push(new iStats.fix([0, 2, 0, 0, 0, 0, 0, 0, -1], "of the Coward"));
  suf.push(new iStats.fix([1, 2, 0, 0, 1, 0, 0, 0, 0], "of Blades"));
  suf.push(new iStats.fix([0, -1, 0, 7, 0, 0, 0, 0, 0], "of the Golem"));
  suf.push(new iStats.fix([0, 3, 0, 0, 0, 3, 0, 0, 0], "of the Ninja"));
  suf.push(new iStats.fix([2, 2, 0, 0, 1, 0, 0, 0, 0], "of the Lion"));
  suf.push(new iStats.fix([0, 0, 2, 0, 2, 0, 0, 0, 3], "of the Bounty Hunter"));
  suf.push(
    new iStats.fix([-1, -1, -1, -1, -1, -1, -1, -1, -1], "of the Loser")
  );
  suf.push(new iStats.fix([0, 1, 2, 1, 0, 0, 0, 0, 0], "of the Hermit"));
  suf.push(new iStats.fix([1, 1, 1, 1, 1, 1, 1, 1, 1], "of Kings"));
  suf.push(new iStats.fix([0, 0, 0, 0, 2, 2, 0, 0, 0], "of Ill Intent"));
  suf.push(
    new iStats.fix([-1, 4, 0, 0, 0, 3, 0, 0, 0], "of the Praying Mantis")
  );

  //Getters
  pre.get = function (id, level) {
    const rng = lj.util.randomInterval;
    const statArray = [];
    const vary = lj.stats.vary;
    if (!level) {
      this.itemLevel = 1;
    } else {
      this.itemLevel = level;
    }
    if (!id) {
      this.prefix = rng(0, lj.stats.prefixes.length - 1);
    } else {
      this.prefix = id;
    }
    //Generate some stats
    statArray[0] = vary(pre[this.prefix].strength, this.itemLevel);
    statArray[1] = vary(pre[this.prefix].agility, this.itemLevel);
    statArray[2] = vary(pre[this.prefix].luck, this.itemLevel);
    statArray[3] = vary(pre[this.prefix].hp, this.itemLevel);
    statArray[4] = vary(pre[this.prefix].hit, this.itemLevel);
    statArray[5] = vary(pre[this.prefix].crit, this.itemLevel);
    statArray[6] = vary(pre[this.prefix].armor, this.itemLevel);
    statArray[7] = vary(pre[this.prefix].defense, this.itemLevel);
    statArray[8] = vary(pre[this.prefix].magicFind, this.itemLevel);
    statArray.name = pre[this.prefix].name;
    statArray.id = this.prefix;
    statArray.itemLevel = this.itemLevel;
    return statArray;
  };
  suf.get = function (id, level) {
    const rng = lj.util.randomInterval;
    const statArray = [];
    const vary = lj.stats.vary;
    if (!level) {
      this.itemLevel = 1;
    } else {
      this.itemLevel = level;
    }
    if (!id) {
      this.suffix = rng(0, lj.stats.suffixes.length - 1);
    } else {
      this.suffix = id;
    }
    //Generate some stats
    statArray[0] = vary(suf[this.suffix].strength, this.itemLevel);
    statArray[1] = vary(suf[this.suffix].agility, this.itemLevel);
    statArray[2] = vary(suf[this.suffix].luck, this.itemLevel);
    statArray[3] = vary(suf[this.suffix].hp, this.itemLevel);
    statArray[4] = vary(suf[this.suffix].hit, this.itemLevel);
    statArray[5] = vary(suf[this.suffix].crit, this.itemLevel);
    statArray[6] = vary(suf[this.suffix].armor, this.itemLevel);
    statArray[7] = vary(suf[this.suffix].defense, this.itemLevel);
    statArray[8] = vary(suf[this.suffix].magicFind, this.itemLevel);
    statArray.name = suf[this.suffix].name;
    statArray.id = this.suffix;
    statArray.itemLevel = this.itemLevel;
    return statArray;
  };
})();
