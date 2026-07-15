window.lj = lj || {};
lj.enemy = {};

lj.enemy.base = function (type, mod) {
  // REALM DIFFICULTY SCALING — the single most load-bearing balance knob. Every
  // enemy stat is multiplied by (1 + this)^(size-1), so it compounds hardest at
  // depth, exactly where the decisive fights happen (selfplay: realms 5-7 own
  // nearly every win and death, and ~70%+ of losses are boss attrition). At
  // size 1 the exponent is inert (x^0 = 1), so realm 1 is untouched; it only
  // eases realm 2+. TARGETED REBALANCE (2026-07-14): the win rate had drifted to
  // the low band edge (~28%, a thin ~3pt margin over the 25% floor) with HALF of
  // all boss deaths landing with the boss already under 20% HP — near-misses a
  // hair short on damage. Easing 0.40 -> 0.375 recenters the shipped --check win
  // rate to ~38% (~37-39% across 5k-6k runs, a healthy ~13pt floor margin,
  // still a sub-40% "hard"
  // roguelike) while preserving every tier's RELATIVE step, since all families
  // scale by the same factor. See scripts/balance-baseline.json.
  var realmMod = Math.pow(1 + 0.375, lj.realm.getSize() - 1);
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
// family's standard boss (grade "B"). From realm 5 on — always the clamped red
// "Emberdeep" tier — the exit is held by one of THREE apex bosses that rotate on
// a size % 3 cycle, so a single deep run faces every apex identity: the enraging
// Cinderwyrm (grade "T", realms 5, 8, 11…), the warding Obsidian Warden (grade
// "W", realms 6, 9, 12…) and the searing/retaliating Searing Colossus (grade
// "S", realms 7, 10, 13…). All three grades are populated only on red, which is
// exactly the family every realm >= 5 resolves to. realm.js places the tile and
// hero.js routes it, so each boss is genuinely reachable in play; the selfplay
// harness fights the same grade, so all three mechanics are measured in the
// decisive realm-5+ band.
lj.enemy.bossGradeForRealm = function (size) {
  if (size < 5) {
    return "B";
  }
  switch (size % 3) {
    case 2:
      return "T"; // realms 5, 8, 11… — the Cinderwyrm (enrage)
    case 0:
      return "W"; // realms 6, 9, 12… — the Obsidian Warden (ward)
    default:
      return "S"; // realms 7, 10, 13… — the Searing Colossus (thorns)
  }
};
// All apex boss grades trigger the level-up on kill and the boss render sprite.
lj.enemy.isBoss = function (grade) {
  return grade === "B" || grade === "T" || grade === "W" || grade === "S";
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
// A warding boss raises a barrier on a fixed cadence that fully absorbs an
// incoming hero blow: given the running count of the hero's LANDED strikes,
// return true when this one lands on the ward (every `interval`-th connecting
// hit) so the fight loop can zero its damage. This is the second boss mechanic
// (a defensive foil to enrage): it changes the fight's SHAPE — the hero must
// land extra blows to break the boss, which drags the duel out and hands the
// boss more swings, feeding boss-attrition (the dominant deep-realm loss mode).
// No-mechanic / non-ward enemies always return false (zero overhead).
lj.enemy.warded = function (enemy, strikeCount) {
  var m = enemy.mechanic;
  if (!m || m.type !== "ward") {
    return false;
  }
  return strikeCount % m.interval === 0;
};
// A searing/thorned boss reflects part of every blow the hero lands against its
// molten hide straight back at the hero: given the damage the hero's landed
// strike just dealt, return how much is seared back (0 for enemies without the
// mechanic, or a whiffed strike). This is the THIRD boss mechanic and a
// RETALIATION threat — distinct from enrage (an offense ramp) and ward (hit
// negation on a cadence): it does NOT touch the boss's own bar, so it never
// drags the duel out; instead the hero's OWN offense becomes the liability,
// punishing the very burst that beats the wyrm and the warden. The reflected
// damage scales with the hero's hit, so it stays a threat at every gear level.
// The fight loop skips it on the killing blow (a dead boss can't retaliate).
// Non-thorns / whiffed cases return 0 (zero overhead).
lj.enemy.thorns = function (enemy, heroDamage) {
  var m = enemy.mechanic;
  if (!m || m.type !== "thorns" || heroDamage <= 0) {
    return 0;
  }
  return Math.round(heroDamage * m.fraction);
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
  //(~1.05-1.1x); the 1.375^(size-1) realm scaling supplies the depth difficulty.
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
  //1.375^(size-1) scaling. So the step over green is deliberately gentle: armor
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

  //Red apex #2 — "The Obsidian Warden": the SECOND boss carrying a real combat
  //mechanic, and a deliberate DEFENSIVE foil to the Cinderwyrm's offense. Where
  //the wyrm gets scarier as it dies, the Warden is scary because it will not die
  //on schedule: it raises a slag WARD on a fixed cadence that fully absorbs every
  //third blow the hero lands (see lj.enemy.warded). That changes the fight's
  //SHAPE, not just its numbers — the hero must sink EXTRA strikes to break it, so
  //the duel drags and the Warden banks more swings, feeding boss-attrition (the
  //dominant deep-realm loss mode). Balanced as a genuine trade, not a flat bump:
  //because ~1/3 of the hero's landed hits are wasted, its raw HP is set LOW (82,
  //vs the Emberlord's 93 / Cinderwyrm's 95) so EFFECTIVE HP lands in apex range
  //(~123 — the hero must land ~1.5 blows per point removed) WITHOUT an oversized
  //bar; base offense [str 5, agi 7] matches the
  //Cinderwyrm's calm phase and is held FLAT (no enrage) so the danger is purely
  //the extra swings the ward buys it. Armor/defense stay at the tier's [5,2] per
  //the depth-philosophy (never touch the compounding stats; let the mechanic
  //carry the threat). The ward is LOAD-BEARING and the boss is a Cinderwyrm PEER,
  //both measured against selfplay: an isolated A/B (all deep bosses = Warden,
  //ward off vs on) swings the win rate ~6-9pt (49%->42% at HP 70), far beyond
  //noise; at HP 82 the isolated Warden reads ~39%, dead level with the
  //Cinderwyrm's ~38.5%, so alternating the two by realm parity (deep runs meet
  //both) leaves the shipped --check ~39% — essentially the pre-Warden baseline.
  //See scripts/balance-baseline.json.
  col["red"].W = new mon([5, 7, 82, 1, 3, 5, 2], "The Obsidian Warden", {
    type: "ward",
    interval: 3, // raises a barrier that absorbs every 3rd landed hero blow
  });

  //Red apex #3 — "The Searing Colossus": the THIRD boss mechanic and a
  //RETALIATION foil to both predecessors. The Cinderwyrm gets scarier as it
  //dies (offense ramp); the Warden refuses to die on schedule (it eats every
  //third blow); the Colossus makes the hero PAY for killing it — its white-hot
  //slag hide SEARS back a fraction of every blow the hero lands (see
  //lj.enemy.thorns), so the hero's own offense becomes the danger: the harder it
  //hits, the harder it is hit back. It is the deliberate OPPOSITE lever from the
  //other two — where enrage/ward make the boss survive LONGER (more boss swings,
  //feeding boss-attrition), thorns never touches the boss's bar and never drags
  //the duel out; it converts the hero's burst into self-damage, so bursting it
  //down FAST (the answer to the wyrm) is exactly what stings most, while a
  //patient, armored, chip-damage hero is punished least. The recoil SCALES with
  //the hero's hit, so it stays a threat at every gear level (a self-scaling
  //mechanic, unlike a flat stat bump). Balanced as a genuine trade and per the
  //tier's depth-philosophy: it reuses the Warden's exact modest defensive block
  //[str 5, agi 7, hp 82, hit 1, crit 3, armor 5, def 2] — a clean "third sibling"
  //differing ONLY in its mechanic — with HP held LOW (82, the Warden's bar, not
  //an oversized one) and offense FLAT, so the retaliation, not raw stats, carries
  //the danger (armor/defense untouched: never touch the depth-compounding stats).
  //The thorns are LOAD-BEARING and the boss is a Cinderwyrm/Warden PEER, both
  //measured against selfplay: an isolated A/B (all deep bosses = Colossus, thorns
  //off vs on) swings the win rate ~7pt far beyond noise (OFF 45.4% -> ON 38.4%
  //at 4000 runs), and at HP 82 / fraction 0.20 the isolated Colossus reads ~38.4%,
  //dead level with the Cinderwyrm's ~38.5% and the Warden's ~39%, so rotating all
  //three by size % 3 (deep runs meet every apex) leaves the shipped --check ~38%
  //(37.7% at 6000 runs) — essentially the pre-Colossus baseline. See
  //scripts/balance-baseline.json.
  col["red"].S = new mon([5, 7, 82, 1, 3, 5, 2], "The Searing Colossus", {
    type: "thorns",
    fraction: 0.2, // sears back 20% of every blow the hero lands (min-blow safe)
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
