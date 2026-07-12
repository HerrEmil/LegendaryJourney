window.lj = lj || {};
lj.enemy = {};

lj.enemy.base = function (type, mod) {
  var realmMod = Math.pow(1 + 0.4, lj.realm.getSize() - 1);
  this.strength = Math.round(type.stats[0] * mod.stats[0] * realmMod);
  this.agility = Math.round(type.stats[1] * mod.stats[1] * realmMod);
  this.hp = Math.round(type.stats[2] * mod.stats[2] * realmMod);
  this.hit = Math.round(type.stats[3] * mod.stats[3] * realmMod);
  this.crit = Math.round(type.stats[4] * mod.stats[4] * realmMod);
  this.armor = Math.round(type.stats[5] * mod.stats[5] * realmMod);
  this.defense = Math.round(type.stats[6] * mod.stats[6] * realmMod);
  this.name = (mod.name + " " + type.name).trim();
};
lj.enemy.get = function (type, grade) {
  var rng = lj.util.randomInterval,
    mon = lj.enemy.types[type][grade],
    mod = lj.enemy.mods[rng(0, lj.enemy.mods.length - 1)];
  if (rng(1, 5) < 5) {
    return new lj.enemy.base(mon, { stats: [1, 1, 1, 1, 1, 1, 1], name: "" });
  }
  return new lj.enemy.base(mon, mod);
};
// Which color family a given realm size spawns. Deeper realms use later
// families; the ladder is built from only the POPULATED families (see below),
// so it clamps to the deepest built tier and never routes to an empty family.
lj.enemy.familyForRealm = function (size) {
  var ladder = lj.enemy.familyLadder;
  var idx = Math.max(0, Math.min(size - 1, ladder.length - 1));
  return ladder[idx];
};
lj.enemy.types = {
  brown: {},
  blue: {},
  green: {},
  red: {},
};
lj.enemy.mods = [];

//Generate monsters

(function () {
  lj.enemy.monster = function (stats, name) {
    this.stats = stats;
    this.name = name;
  };
  var col = lj.enemy.types,
    mon = lj.enemy.monster,
    mod = lj.enemy.mods;
  //Brown
  col["brown"].a = new mon([2, 4, 25, 1, 1, 1, 2], "Wolf");
  col["brown"].b = new mon([3, 2, 20, 0, 1, 2, 0], "Gnoll");
  col["brown"].c = new mon([1, 6, 35, 1, 2, 1, 1], "Swamp Monster");
  col["brown"].d = new mon([3, 4, 40, 1, 1, 5, 0], "Undead Mage");
  col["brown"].B = new mon([7, 7, 80, 1, 1, 5, 0], "Evil Blue Mage");

  //Blue - "The Frostmarch": the Evil Blue Mage's frost-court of cryomancers
  //and ice constructs, seeping up from realm 2 as living cold (realm 2+ tier).
  //Because this tier is clamped across every realm >=2 until green/red exist,
  //it is only a slight step over brown (~1.05-1.1x); the 1.4^(size-1) realm
  //scaling supplies the depth difficulty. Each grade owns a distinct role.
  col["blue"].a = new mon([2, 6, 24, 1, 2, 1, 2], "Frost Wisp"); // glass-cannon striker
  col["blue"].b = new mon([3, 1, 30, 0, 1, 4, 1], "Rime Sentinel"); // slow ice wall
  col["blue"].c = new mon([1, 7, 33, 1, 3, 1, 4], "Frostbite Sprite"); // evasive crit-critter
  col["blue"].d = new mon([3, 4, 44, 1, 1, 6, 1], "Hoarfrost Acolyte"); // armored caster
  col["blue"].B = new mon([7, 7, 85, 1, 2, 5, 2], "Frostlord"); // frost-court boss

  //Set up mods
  mod.push(new mon([1, 2, 1, 1, 1, -1, 1], "Angry"));
  mod.push(new mon([0.5, 0, 2, 1, 1, 1, 1], "Sturdy"));
  mod.push(new mon([1, 1, 0.75, 1, 2, 1, 1], "Rabid"));
  mod.push(new mon([1.5, 1, 1, 1, 1, 1, 1], "Strong"));
  mod.push(new mon([1, 1, 1, 2, 1, 0, 0], "Flaming"));
  mod.push(new mon([1, 1, 1, 0, 1, 1, 1], "Blind"));
  mod.push(new mon([0.1, 0.1, 1, 1, 1, 1, 1], "Pacified"));
  mod.push(new mon([1, 1, 1, -50, 10, 1, 1], "Wildly Flailing"));
})();

// Ordered family ladder for realm depth, kept to only the POPULATED families so
// familyForRealm can never route to an empty tier (green/red are still {}). As
// future tiers are filled they are picked up here automatically; the ladder
// clamps at the deepest built family for all deeper realms.
lj.enemy.familyLadder = ["brown", "blue", "green", "red"].filter(function (
  family
) {
  return Object.keys(lj.enemy.types[family]).length > 0;
});
