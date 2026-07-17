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
// "Emberdeep" tier — the exit is held by one of SIX apex bosses that rotate on
// a size % 6 cycle, so a single deep run faces every apex identity: the enraging
// Cinderwyrm (grade "T", realms 5, 11, 17…), the warding Obsidian Warden (grade
// "W", realms 6, 12, 18…), the searing/retaliating Searing Colossus (grade "S",
// realms 7, 13, 19…), the armor-sundering Molten Reaver (grade "M", realms 8,
// 14, 20…), the executing Pyre Headsman (grade "H", realms 9, 15, 21…) and the
// flurrying Flarebrand Duelist (grade "F", realms 10, 16, 22…). All six grades
// are populated only on red, which is exactly the family every realm >= 5
// resolves to. realm.js places the tile and hero.js routes it, so each boss is
// genuinely reachable in play; the selfplay harness fights the same grade, so
// all six mechanics are measured in the decisive realm-5+ band.
lj.enemy.bossGradeForRealm = function (size) {
  if (size < 5) {
    return "B";
  }
  switch (size % 6) {
    case 5:
      return "T"; // realms 5, 11, 17… — the Cinderwyrm (enrage)
    case 0:
      return "W"; // realms 6, 12, 18… — the Obsidian Warden (ward)
    case 1:
      return "S"; // realms 7, 13, 19… — the Searing Colossus (thorns)
    case 2:
      return "M"; // realms 8, 14, 20… — the Molten Reaver (sunder)
    case 3:
      return "H"; // realms 9, 15, 21… — the Pyre Headsman (execute)
    default:
      return "F"; // realms 10, 16, 22… — the Flarebrand Duelist (tempo)
  }
};
// All apex boss grades trigger the level-up on kill and the boss render sprite.
lj.enemy.isBoss = function (grade) {
  return (
    grade === "B" ||
    grade === "T" ||
    grade === "W" ||
    grade === "S" ||
    grade === "M" ||
    grade === "H" ||
    grade === "F"
  );
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
// A sundering boss's white-hot cleaves melt through the hero's plate, ignoring a
// fraction of its armor on the boss's own swing. Armor is %-damage-mitigation
// that compounds hardest at depth (the deep game is attrition/mitigation-
// limited), so stripping part of it makes each boss blow land harder — the
// FOURTH boss mechanic and a deliberate foil to the patient, armored hero (where
// thorns punishes the burst hero, sunder punishes the turtle). Return the hero's
// stat snapshot with reduced EFFECTIVE armor for this swing — a shallow copy, so
// the shared per-fight snapshot the other strikes read is untouched — or the
// snapshot unchanged for enemies without the mechanic (zero allocation on the
// common path). The reduced armor can never go negative (fraction in [0,1],
// armor >= 0), so it only lowers mitigation, never flips into a damage amplifier.
lj.enemy.sundered = function (enemy, heroStats) {
  var m = enemy.mechanic;
  if (!m || m.type !== "sunder") {
    return heroStats;
  }
  var reduced = Object.assign({}, heroStats);
  reduced.armor = Math.round(heroStats.armor * (1 - m.fraction));
  return reduced;
};
// An EXECUTING boss smells blood: once the HERO is wounded past a threshold of
// its max HP the boss's swings spike, racing to finish a bloodied hero before it
// can recover on cleared floor. This is the FIFTH boss mechanic and the deliberate
// MIRROR of enrage — enrage keys its offense ramp to the BOSS's own dwindling HP
// (scarier as it dies), execute keys the same ramp to the HERO's (scarier as the
// hero dies). Return a lightweight boosted attack snapshot (only offensive stats
// matter when swinging) once currentHp <= maxHp * threshold, or the enemy
// unchanged on the common path (no mechanic / hero still healthy), so the extra
// damage flows through the normal duel math with zero allocation. Like sunder it
// fires ONLY on the boss's own swing, so the hero still dies only on the boss's
// turn and the shared outcome.actor health-check needs no killing-blow special
// case (unlike thorns). It never adds boss HP nor eats hero blows, so fights stay
// SHORT — it just ends a losing fight faster, punishing the razor-thin boss-
// attrition near-miss (half of all boss deaths already land with the hero low).
lj.enemy.executes = function (enemy, currentHp, maxHp) {
  var m = enemy.mechanic;
  if (!m || m.type !== "execute" || currentHp > maxHp * m.threshold) {
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
// A boss with the TEMPO mechanic fights at a blistering cadence: it sometimes
// FOLLOWS its blow with a second strike on the same turn (a flurry). Return true
// when this turn's follow-up connects — a per-mille chance roll (m.chance out of
// 1000). This is the SIXTH boss mechanic and the offensive MIRROR of the ward:
// the ward DENIES the hero every Nth landed blow, tempo GRANTS the boss an extra
// blow — a genuinely new AXIS (swing FREQUENCY), where the five before it each
// altered a single swing's magnitude (enrage/execute), negation (ward),
// reflection (thorns) or the hero's mitigation (sunder). The follow-up runs
// through the normal duel math and fires only on the boss's OWN turn, so the
// hero still dies only on the boss's turn and the shared outcome.actor
// health-check needs no killing-blow special case (like sunder/execute, unlike
// thorns); it adds no boss HP and eats no hero blows, so fights stay SHORT — the
// boss just lands more, faster. Non-tempo / no-mechanic enemies return false
// BEFORE the rng roll, so they consume no randomness and their fights stay
// byte-identical to a pre-tempo codebase.
lj.enemy.flurries = function (enemy) {
  var m = enemy.mechanic;
  if (!m || m.type !== "tempo") {
    return false;
  }
  return lj.util.randomInterval(1, 1000) <= m.chance;
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

  //Red apex #4 — "The Molten Reaver": the FOURTH boss mechanic and a foil to the
  //patient, armored hero. The Cinderwyrm ramps its offense as it dies; the Warden
  //eats every third blow; the Colossus reflects the hero's burst; the Reaver
  //instead SUNDERS the hero's defense — its white-hot cleaves melt through plate,
  //ignoring a fraction of the hero's armor on every swing (see lj.enemy.sundered).
  //That attacks the exact stat the deep game is decided on: armor is
  //%-damage-mitigation that compounds hardest at depth (the game is now
  //attrition/mitigation-limited, ~70%+ of losses are boss attrition), so a boss
  //that claws part of it back makes each of its blows land harder. It is the
  //OPPOSITE target from the Colossus: thorns punishes the hero who hits HARD,
  //sunder punishes the hero who turtles behind armor — the more mitigation the
  //hero stacked, the more the Reaver melts. Unlike enrage/ward it neither ramps
  //nor lengthens the duel (it never adds boss HP or eats hero blows), so fights
  //stay SHORT (kind to the 400ms/step animation); and it touches only the boss's
  //OWN swing, so the hero can still die only on the boss's turn — the shared
  //outcome.actor health-check stays valid with no killing-blow special-case
  //(unlike thorns). Balanced as a clean fourth sibling by the established method:
  //it REUSES the Warden/Colossus modest defensive block [str 5, agi 7, hp 82,
  //hit 1, crit 3, armor 5, def 2] EXACTLY, differing only in its mechanic — no HP
  //trim was needed because sunder's amplification self-limits (once most of the
  //hero's armor is stripped there is little left to melt), so the sibling HP lands
  //the isolated Reaver squarely at the siblings' ~38-39% with the fraction as the
  //single tuning knob (0.70 = melts through ~70% of the hero's plate). The sunder
  //is LOAD-BEARING and the boss a PEER, both sim-measured (isolated A/B, all deep
  //bosses = Reaver, sunder off vs on): OFF 45.7% -> ON 38.97% at 10000 runs
  //(-6.7pt swing, ~9.6 sigma, far beyond noise), and the isolated ON rate 38.97%
  //is dead level with the Cinderwyrm 38.9% / Warden 38.5% / Colossus 38.2%, so
  //rotating all four by size % 4 (deep runs meet every apex) leaves the shipped
  //--check ~38%. See scripts/balance-baseline.json.
  col["red"].M = new mon([5, 7, 82, 1, 3, 5, 2], "The Molten Reaver", {
    type: "sunder",
    fraction: 0.7, // ignores 70% of the hero's armor on each of its swings
  });

  //Red apex #5 — "The Pyre Headsman": the FIFTH boss mechanic and the deliberate
  //MIRROR of the very first one. The Cinderwyrm ENRAGES — it hits harder once its
  //OWN HP falls past a threshold (scarier as it dies). The Headsman EXECUTES — it
  //hits harder once the HERO's HP falls past a threshold (scarier as the hero
  //dies). It is a genuinely 5th combat AXIS distinct from the four before it:
  //enrage (offense ramp keyed to the boss), ward (hit negation), thorns (reflect)
  //and sunder (armor penetration) — execute is an offense ramp keyed to the HERO,
  //a conditional lethality that turns the closing stretch of a losing fight into a
  //death sentence. It targets EXACTLY the loss mode selfplay keeps surfacing: the
  //deep game is boss-attrition-bound and HALF of all boss deaths already land with
  //the hero under ~20% HP, a hair short — the Headsman makes that bloodied back
  //half far deadlier, so a hero who cannot burst it down before dropping low is
  //finished. Distinct SHAPE from enrage even though both are ramps: enrage's
  //trigger (the boss's bar) is something the hero DRIVES DOWN by attacking, so
  //racing the boss down is the counter; the Headsman's trigger (the hero's own
  //bar) is something the boss drives down, so there is no "burst through the
  //window" — the only counter is to win the fight outright while still healthy, or
  //to bring enough effective-HP that the boosted swings still don't finish you.
  //Like sunder it fires only on the boss's OWN swing (never the hero's), so the
  //hero still dies only on the boss's turn and the shared outcome.actor
  //health-check stays valid with NO killing-blow special-case; and it never adds
  //boss HP nor eats hero blows, so fights stay SHORT (kind to the 400ms/step
  //animation) — it merely ends a losing fight sooner. Balanced as a clean fifth
  //SIBLING by the established method: it REUSES the Warden/Colossus/Reaver modest
  //defensive block [str 5, agi 7, hp 82, hit 1, crit 3, armor 5, def 2] EXACTLY
  //(armor/defense untouched per the depth-philosophy — never touch the compounding
  //stats; the mechanic carries the threat), differing only in its mechanic, with
  //the threshold (how low the hero must drop to trigger, 0.55) and damageMult
  //(how much harder the boss then swings, 2.0 = double str+agi) as the two tuning
  //knobs. The execute is LOAD-BEARING and the boss a Cinderwyrm/Warden/Colossus/
  //Reaver PEER, both sim-measured against selfplay: an isolated A/B (all deep
  //bosses = Headsman, execute off vs on) swings the win rate OFF 45.24% -> ON
  //38.88% (-6.36pt, ~10 sigma => load-bearing), and the isolated ON rate 38.88%
  //(12000 runs) is dead level with the Cinderwyrm 38.9% / Warden 38.5% / Colossus
  //38.2% / Reaver 38.97% (an all-Reaver control on this same codebase read 38.35%)
  //=> PEER. An easy first draft (threshold 0.35, damageMult 1.6) read 42.5%
  //isolated (only -2.8pt swing, ~4pt too soft): execute firing only below 35% HP
  //barely bit, since by then the hero was usually dead anyway — raising the window
  //to the bottom HALF of the bar (0.55) and doubling the boosted blows (2.0) is
  //what makes the back half genuinely lethal. Rotating all five by size % 5 (deep
  //runs meet every apex) leaves the shipped --check ~37% (essentially the
  //pre-Headsman baseline ~37.15%, within noise). See scripts/balance-baseline.json.
  col["red"].H = new mon([5, 7, 82, 1, 3, 5, 2], "The Pyre Headsman", {
    type: "execute",
    threshold: 0.55, // executes while the hero is below 55% of its max HP
    damageMult: 2.0, // doubles strength & agility while executing (the kill blow)
  });

  //Red apex #6 — "The Flarebrand Duelist": the SIXTH boss mechanic, TEMPO, and a
  //genuinely new combat AXIS. The five before it each reshaped a SINGLE swing —
  //enrage/execute ramp its magnitude, ward negates it, thorns reflects it, sunder
  //strips the hero's mitigation against it — while every boss still swung exactly
  //ONCE per turn. The Duelist attacks that last constant: it fights at a blistering
  //cadence and sometimes FOLLOWS its blow with a second strike on the same turn (a
  //flurry, see lj.enemy.flurries), so the axis it moves is swing FREQUENCY, not a
  //swing's damage. It is the deliberate offensive MIRROR of the Obsidian Warden —
  //the ward DENIES the hero every Nth landed blow (fewer hero swings land); tempo
  //GRANTS the boss an extra blow (more boss swings land). Each follow-up is a full,
  //independent duel roll (its own hit/crit/armor mitigation), so it is not the same
  //as a bigger single hit: it is a second chance to crit and a second armor-checked
  //blow, and it stacks flat across the whole fight rather than gating on an HP
  //window. Like sunder/execute it fires only on the boss's OWN turn, so the hero
  //still dies only on the boss's turn and the shared outcome.actor health-check
  //needs NO killing-blow special case (the flurry's second swing is skipped once
  //the hero is down); and it adds no boss HP and eats no hero blows, so fights stay
  //SHORT (kind to the 400ms/step animation) — the boss just lands more, faster.
  //Balanced as a clean sixth SIBLING by the established method: it REUSES the
  //Warden/Colossus/Reaver/Headsman modest defensive block [str 5, agi 7, hp 82,
  //hit 1, crit 3, armor 5, def 2] EXACTLY (armor/defense untouched per the
  //depth-philosophy — never touch the compounding stats; the mechanic carries the
  //threat), differing only in its mechanic, with the per-mille flurry CHANCE the
  //single tuning knob. A finely-tunable probability (not a coarse fixed cadence) is
  //what lets the isolated all-Duelist rate land dead on the siblings' ~38-39% peer.
  //The tempo is LOAD-BEARING and the boss a peer, both sim-measured against
  //selfplay (isolated A/B, all deep bosses = Duelist, flurry off vs on): see
  //scripts/balance-baseline.json / scripts/content-backlog.json for the numbers.
  //Rotating all six by size % 6 (deep runs meet every apex) leaves the shipped
  //--check ~37% (essentially the pre-Duelist baseline, within noise).
  col["red"].F = new mon([5, 7, 82, 1, 3, 5, 2], "The Flarebrand Duelist", {
    type: "tempo",
    chance: 300, // per-mille (of 1000) chance to follow a blow with a 2nd strike
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

  //ELITE MODIFIERS — "depth-themed" batch (elite-mods-batch, ladder id 15). A mod
  //is a 7-stat MULTIPLIER array [str, agi, hp, hit, crit, armor, defense] that
  //lj.enemy.get rolls onto ~1-in-5 enemies (name prepends), INCLUDING apex bosses
  //(the boss's own .mechanic survives — lj.enemy.base only copies type.mechanic,
  //never a mod's). So a mod that leans offensive can land on an ENRAGING or
  //EXECUTING apex and stack with its damage ramp — the worst case the A/B must
  //cover. Two rules the whole batch honors: (1) ARMOR mult <= 1 ALWAYS — armor is
  //%-mitigation that compounds hardest at depth (base * mult * realmMod), so an
  //armor buff would balloon into a near-unkillable deep enemy; every entry keeps
  //armor at 1 or below. (2) mods MULTIPLY the realm-scaled stats, so each is a
  //genuine risk/reward TRADE (a real upside paid for with a real downside), never
  //a flat power-add — mirroring the legacy pool above (Angry/Strong buff, Pacified/
  //Sturdy nerf) and keeping the batch AVERAGE near the legacy average so the 1-in-5
  //overlay barely shifts the win rate (measured neutral by the isolated A/B; see
  //scripts/balance-baseline.json). The load-bearing levers for an ENEMY are just
  //str/agi (offense: avg swing ~= str + agi) and hp (durability); armor is capped
  //<=1 per the rule above. The other three barely move an enemy: hit is base 0-1 so
  //a x1.4/x0.7 rounds back to 1; crit only ADDS to a fixed 150-base multiplier on a
  //10% proc over a tiny base crit (1-3), worth well under ~1% average damage; and
  //defense only nudges the hero's miss chance (~0.1%/point). So crit/defense here
  //ride along as THEME/flavor, not power — every glass-cannon's real bite is its
  //str/agi, and each survivability buff is paid for in str/agi.
  //Three family/depth THEMES pair a survivability buff with an offense cut; three
  //glass-cannons/jokers pair an offense buff with a fragility cut — a balanced
  //spread of trade-offs, not six buffs.
  //Frost tank ("The Frostmarch"): glacier-clad — far tougher, but slowed.
  mod.push(new mon([1, 0.6, 1.5, 1, 1, 1, 1], "Glacial"));
  //Depth bulwark (apex/ancient): a weathered wall — high HP + guard, weak blows.
  mod.push(new mon([0.7, 1, 1.3, 1, 1, 1, 1.5], "Adamantine"));
  //Blight glass-cannon ("The Blightwood"): venom-mad offense that rots itself.
  mod.push(new mon([1.4, 1, 0.65, 1, 1.5, 1, 1], "Plagueridden"));
  //Ember frenzy ("The Emberdeep"): all molten fury, no guard — fast, critty, frail.
  mod.push(new mon([1, 1.5, 0.7, 1, 1.4, 0.5, 1], "Volcanic"));
  //Bruiser joker: huge and ponderous — a big slow bag of HP with a heavy, wild arm.
  mod.push(new mon([1.25, 0.5, 1.6, 1, 1, 1, 1], "Colossal"));
  //Swarm joker: skittering and reckless — blinding speed on paper-thin, unarmored HP.
  mod.push(new mon([1, 1.6, 0.5, 1, 1, 0, 1], "Skittering"));
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
