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
  // Some monster types carry a combat mechanic (see lj.enemy.enraged). Copy the
  // descriptor onto the instance so the fight loop can react to it. Mods never
  // define one, so the boss's mechanic survives even when a modifier is rolled.
  if (type.mechanic) {
    this.mechanic = type.mechanic;
  }
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
// Which boss grade guards a realm's exit. Realms 1-4 are sealed by their
// family's standard boss (grade "B"); from realm 5 on — always the clamped red
// "Emberdeep" tier — the exit is instead held by the apex Cinderwyrm (grade
// "T"), a distinct boss with the enrage mechanic. realm.js places this tile and
// hero.js routes it, so the boss is genuinely reachable in play; the selfplay
// harness fights the same grade so the mechanic is measured. Grade "T" is only
// populated on red, which is exactly the family every realm >= 5 resolves to.
lj.enemy.bossGradeForRealm = function (size) {
  return size >= 5 ? "T" : "B";
};
// Both boss grades trigger the level-up on kill and the boss render sprite.
lj.enemy.isBoss = function (grade) {
  return grade === "B" || grade === "T";
};
// When a mechanic-carrying enemy is wounded past its enrage threshold it hits
// harder: return a lightweight attack snapshot with its offensive stats scaled
// so the extra damage flows through the normal duel math. The common no-mechanic
// / not-yet-enraged path returns the enemy unchanged (zero allocation). Only
// offensive stats are boosted — armor/defense are irrelevant when attacking.
lj.enemy.enraged = function (enemy, currentHp, maxHp) {
  var m = enemy.mechanic;
  if (!m || m.type !== "enrage" || currentHp > maxHp * m.threshold) {
    return enemy;
  }
  return {
    strength: Math.round(enemy.strength * m.damageMult),
    agility: Math.round(enemy.agility * m.damageMult),
    hit: enemy.hit,
    crit: enemy.crit,
    name: enemy.name,
  };
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
  lj.enemy.monster = function (stats, name, mechanic) {
    this.stats = stats;
    this.name = name;
    // Optional combat mechanic descriptor (e.g. { type:"enrage", ... }).
    if (mechanic) {
      this.mechanic = mechanic;
    }
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
  //and ice constructs. Now that green fills realm 3+, blue owns realm 2 alone
  //(familyForRealm(2) -> idx 1), so it is only a slight step over brown
  //(~1.05-1.1x); the 1.4^(size-1) realm scaling supplies the depth difficulty.
  //Each grade owns a distinct role that its green counterpart escalates.
  col["blue"].a = new mon([2, 6, 24, 1, 2, 1, 2], "Frost Wisp"); // glass-cannon striker
  col["blue"].b = new mon([3, 1, 30, 0, 1, 4, 1], "Rime Sentinel"); // slow ice wall
  col["blue"].c = new mon([1, 7, 33, 1, 3, 1, 4], "Frostbite Sprite"); // evasive crit-critter
  col["blue"].d = new mon([3, 4, 44, 1, 1, 6, 1], "Hoarfrost Acolyte"); // armored caster
  col["blue"].B = new mon([7, 7, 85, 1, 2, 5, 2], "Frostlord"); // frost-court boss

  //Green - "The Blightwood": past the frozen court the realm rots into a
  //poisoned overgrowth of venom-beasts and plague-druids. Green now owns realm
  //3 alone (red clamps 4+ below), the way blue owns realm 2. When green was the
  //deepest tier it clamped every realm >=3, so its step over blue was kept tiny
  //(<=1.17x on agility/HP, armor untouched) — selfplay showed a full ~1.2x bump
  //dropped the win rate below the 25% floor. Left as-is: realm 3 is a brief
  //waypoint and re-tuning it is out of scope for the red run. Roles mirror blue,
  //each dialed one notch meaner.
  col["green"].a = new mon([2, 7, 26, 1, 2, 1, 2], "Venomfang Adder"); // glass-cannon striker
  col["green"].b = new mon([3, 1, 32, 0, 1, 4, 1], "Bramble Golem"); // slow thorn wall
  col["green"].c = new mon([1, 8, 35, 1, 3, 1, 4], "Sporeling"); // evasive crit-critter
  col["green"].d = new mon([3, 4, 47, 1, 1, 6, 1], "Blight Druid"); // armored caster
  col["green"].B = new mon([7, 7, 90, 1, 2, 5, 2], "Rotbark Ancient"); // blightwood boss

  //Red - "The Emberdeep": below the rotting Blightwood the realm sinks into a
  //molten underworld of magma constructs, fire-imps and ash-cultists. Red is
  //now the deepest built tier, so familyForRealm CLAMPS it across every realm
  //>=4 — and selfplay shows realm 4+ is essentially the whole decisive game
  //(nearly every win and death happens there), on top of already-deep
  //1.4^(size-1) scaling. So the step over green is deliberately gentle: armor
  //(the % damage-reduction that compounds hardest with depth) is left UNTOUCHED
  //on every grade, and the escalation is +1 HP per grade plus ONE offensive
  //touch — +1 agility on the striker and the boss, +1 boss crit. A fuller
  //"notch" (flat +1 strength on striker+boss, as green added over blue) cratered
  //the sim to ~24%, under the 25% floor; this block holds it near ~28% (a clean
  //~4pt step below green, mirroring blue->green). Roles mirror green, one
  //notch meaner.
  col["red"].a = new mon([2, 8, 27, 1, 2, 1, 2], "Ember Imp"); // glass-cannon striker
  col["red"].b = new mon([3, 1, 33, 0, 1, 4, 1], "Magma Golem"); // slow molten wall
  col["red"].c = new mon([1, 8, 36, 1, 3, 1, 4], "Cinder Sprite"); // evasive crit-critter
  col["red"].d = new mon([3, 4, 48, 1, 1, 6, 1], "Ashen Warlock"); // armored caster
  col["red"].B = new mon([7, 8, 93, 1, 3, 5, 2], "The Emberlord"); // emberdeep boss

  //Red apex — "The Cinderwyrm": the first NEW boss carrying an ACTUAL combat
  //mechanic rather than a bigger stat block. From realm 5 on (always the clamped
  //red tier) the Emberlord gives way to a molten wyrm that ENRAGES: while healthy
  //it fights lazily, but once its HP drops past the threshold it lashes out like
  //a cornered dragon and its offense spikes — so the closing stretch of every
  //deep boss fight becomes a race: burst it down through the enrage window or the
  //back half turns lethal. The balance is a genuine risk/reward trade, not a flat
  //bump: its BASE offense [str 5, agi 7] is GENTLER than the Emberlord's [7, 8]
  //(the calm opening), while ENRAGED it hits ~[8, 11] — harder than the old boss
  //ever did. HP is a touch higher (95 vs 93) for an apex-feeling bar, and
  //armor/defense are left exactly at the Emberlord's values: the depth-compounding
  //stats stay untouched per the tier philosophy, and the mechanic supplies the
  //danger. The base-offense trim plus threshold/damageMult were tuned against
  //selfplay so the NET win rate lands ~29% — essentially the pre-boss 29.4%
  //baseline, with wide margin above the 25% floor. That the number barely moves
  //is deliberate, not a no-op: an A/B (same boss, enrage off vs on) swings the
  //win rate ~5pt (33.5% -> 28.4% at 8000 runs), so the mechanic is load-bearing
  //and merely balanced against the gentler base (see scripts/balance-baseline.json).
  col["red"].T = new mon([5, 7, 95, 1, 3, 5, 2], "The Cinderwyrm", {
    type: "enrage",
    threshold: 0.4, // enrages below 40% HP
    damageMult: 1.5, // +50% strength & agility while enraged
  });

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
// familyForRealm can never route to an empty tier. All four families are now
// filled (brown r1, blue r2, green r3, red r4+); the filter still guards
// against any future empty tier, and the ladder clamps at the deepest built
// family for all deeper realms.
lj.enemy.familyLadder = ["brown", "blue", "green", "red"].filter(function (
  family
) {
  return Object.keys(lj.enemy.types[family]).length > 0;
});
