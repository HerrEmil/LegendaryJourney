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

  //--- "Spoils of the Realms" affix batch --------------------------------
  // A coherent set of loot affixes themed to the four enemy families the hero
  // fights down the realms (blue Frostmarch, green Blightwood, red Emberdeep,
  // apex Cinderwyrm). Each theme contributes ONE prefix and ONE suffix whose
  // stat identity mirrors that realm's combat archetype: frost = sturdy
  // bruiser (hp-led), blight = evasive crit striker, ember = raw aggression,
  // wyrm = the elite all-rounder crown.
  //
  // BALANCE: the gScore auto-equip (combat.js) weights every stat equally, so
  // an armor/defense-heavy affix is picked over an equal-scored offensive one
  // and quietly DILUTES the hero's damage. Since ~70% of losses are to the
  // realm boss and the enrage apex punishes slow kills, offense (str/agi/crit)
  // and effective HP are what actually convert to wins — not raw armor. An
  // earlier armor-tilted draft grazed the 25% floor (~24-26%; a 500-run pulse
  // hit 24.4%); this offense/HP-weighted set is balance-neutral vs the
  // pre-batch ~29% baseline (isolated A/B: 29.1% vs 29.6% at 3000 runs each),
  // a comfortable margin clear of the floor (see
  // scripts/balance-baseline.json). luck (index 2) is
  // inert in combat and gScore, so it stays 0 here — nonzero luck would pad.
  // No new tile symbols: affixes only ride items, never the map, so scene.js
  // spriteMap / hero.js creaturesAndItemsMap need no changes.
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  pre.push(new iStats.fix([1, 0, 0, 3, 0, 0, 1, 1, 0], "Frostforged")); // sturdy bruiser
  pre.push(new iStats.fix([0, 4, 0, 0, 1, 2, 0, 0, 0], "Venomous")); // evasive crit striker
  pre.push(new iStats.fix([4, 0, 0, 0, 1, 1, 0, 0, 0], "Emberforged")); // raw aggression
  pre.push(new iStats.fix([2, 2, 0, 2, 0, 1, 0, 0, 0], "Wyrmscaled")); // apex all-rounder

  //--- "Trophies of the Arena" affix batch (batch 2) --------------------
  // A second coherent loot set, themed to the HERO's own gladiatorial prowess
  // rather than the enemy families the "Spoils of the Realms" batch above
  // mirrors. Eight arena archetypes: the pit-fighter, berserker, duelist and
  // armored murmillo (prefixes), and the arena's honours (suffixes below).
  //
  // BALANCE — composition-matched, NOT pure-offense. The obvious move was
  // "offense/HP-first, zero armor/defense" (the older loot heuristic). It fails
  // post-rebalance: an isolated 10k-run A/B of two different pure-offense drafts
  // BOTH measured ~1.9pt LOW (z~3.9 pooled), and an equipped-gear probe showed
  // why. With the win rate now boss-attrition-bound (~72% of losses) and armor
  // being %-mitigation that compounds hardest at depth, the loot pool sits near
  // an offense/defense SWEET SPOT. Pure-offense affixes out-gScore the hero's
  // defensive items and strip ~4 pts of armor+defense off its boss-fight gear
  // (str/crit +5-6 each, but armor -1.5 / defense -2.6), turning it glass-cannon
  // and costing that ~1.9pt. So this batch MIRRORS the pool's own budget mix
  // (~61% offense / ~24% hp / ~15% armor+defense): it stays offense/HP-LED (6 of
  // 8 affixes), but two thematic defensive archetypes (Ironbound, of the
  // Bulwark) carry the pool's ~15% armor/defense share so the batch adds "more
  // of the same" and doesn't shift what the hero equips. Verified balance-
  // neutral in a fresh isolated A/B (see scripts/balance-baseline.json). luck
  // (index 2) is combat- and gScore-inert so it stays 0 (nonzero would pad).
  // No new tile symbols — affixes only ride items, never the map, so scene.js
  // spriteMap / hero.js creaturesAndItemsMap need no changes.
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  pre.push(new iStats.fix([2, 1, 0, 2, 1, 0, 0, 0, 0], "Gladiatorial")); // balanced pit-fighter
  pre.push(new iStats.fix([4, 1, 0, 0, 0, 2, 0, 0, 0], "Bloodthirsty")); // reckless berserker
  pre.push(new iStats.fix([0, 2, 0, 0, 1, 3, 0, 0, 0], "Undaunted")); // fearless duelist
  pre.push(new iStats.fix([1, 0, 0, 1, 0, 0, 2, 3, 0], "Ironbound")); // armored murmillo

  //--- "Relics of the Apex" affix batch (batch 3) ----------------------
  // A third coherent loot set, themed to the three APEX MECHANICS the deep
  // hero now faces on the red-family bosses — enrage (the Cinderwyrm's growing
  // fury), ward (the Obsidian Warden's absorbing barrier) and thorns (the
  // Searing Colossus's searing recoil) — plus an apex CROWN archetype. This is
  // a fresh motif distinct from "Spoils of the Realms" (the enemy families) and
  // "Trophies of the Arena" (the hero's own prowess): each relic echoes the
  // combat identity of the titan it was torn from. Fury = raw reckless power
  // (str-led), Barbed/Recoil = the agile burst-striker who lives by the very
  // burst that thorns punishes (agi/crit), Ward/Aegis = the barrier turned to
  // worn armor+defense, Titan = the all-rounder crown.
  //
  // BALANCE — this batch discovered that composition-matching (the batch-2 rule)
  // is NECESSARY BUT NOT SUFFICIENT for a neutral loot batch. A first draft that
  // matched the pool's ~60/25/15 offense/hp/armor+def mix EXACTLY still eased the
  // win rate +1.46pt (z=3.3 over a 24k-run isolated A/B) — a real stealth-
  // rebalance in the "too easy" direction. Root cause, found via an equipped-
  // gear probe: at realms 6-7 the draft inflated the hero's equipped HP by ~+3.7
  // (=+18 max HP, pure survivability in the boss-attrition-bound deep game). The
  // ENABLER is that CRIT is nearly inert in combat (only ~10% of hits crit, for a
  // small multiplier bump) yet FULL-WEIGHT in gScore (combat.js weights every
  // stat equally for auto-equip). So affixes that pair crit WITH hp get over-
  // equipped on gScore and quietly smuggle survivability HP onto the hero. The
  // neutral sibling "Trophies of the Arena" avoids this: it caps crit at 8 and
  // pairs its hp with str/agi (honest combat stats), and re-measured at 24k it is
  // dead neutral (0.00pt, z=-0.01). So this batch copies that proven profile:
  // crit total 8 (not 11), hp paired with str/agi or the defensive block (never
  // crit-heavy), def >= armor, and hp kept lean/unconcentrated. Two thematic
  // defensive archetypes (Bastioned, of the Aegis — the Warden's ward made into
  // worn plate) carry the ~15% armor+defense share so it stays offense/HP-LED,
  // not pure-offense (pure-offense drifts ~2pt LOW — see batch 2). RESULT:
  // balance-NEUTRAL — isolated 24k A/B baseline 38.58% vs batch 38.79% (+0.21pt,
  // z=0.48, within noise); see scripts/balance-baseline.json. luck (index 2) is
  // combat- and gScore-inert so it stays 0 (nonzero would pad); magicFind (idx 8)
  // stays 0 to match the two prior batches. No new tile symbols — affixes only
  // ride items, never the map, so scene.js spriteMap / hero.js
  // creaturesAndItemsMap need no changes.
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  pre.push(new iStats.fix([5, 0, 0, 1, 1, 1, 0, 0, 0], "Furious")); // enrage: reckless fury
  pre.push(new iStats.fix([0, 2, 0, 0, 1, 3, 0, 0, 0], "Barbed")); // thorns: the burst striker
  pre.push(new iStats.fix([0, 0, 0, 2, 0, 0, 1, 3, 0], "Bastioned")); // ward: worn barrier
  pre.push(new iStats.fix([3, 2, 0, 2, 0, 0, 0, 0, 0], "Titanic")); // apex crown

  //--- "Craft of the Forgemasters" affix batch (batch 5) ----------------
  // A fifth coherent loot set, themed to the legendary SMITHS and FORGES that
  // craft the greatest gear — a fresh motif distinct from "Spoils of the
  // Realms" (the enemy families), "Trophies of the Arena" (the hero's own
  // prowess) and "Relics of the Apex" (the boss mechanics). Where those name
  // WHO the loot was torn from or WHO wields it, this names HOW a legendary
  // artifact is MADE — fitting for a game whose win is a full legendary set.
  // Each prefix is a smithing technique (runework, a whetted edge, a resilience
  // temper, a flawless masterwork) and each suffix a legendary forge/smith.
  //
  // BALANCE — this copies the proven-neutral profile of "Relics of the Apex"
  // (batch 3, re-measured dead-neutral) rather than re-deriving it, because the
  // two batch-3 findings are load-bearing: (1) COMPOSITION-MATCH the loot pool's
  // ~60/25/15 offense/hp/armor+def budget mix — a pure-offense batch drifts ~2pt
  // LOW because the deep game is mitigation-limited (~70% of losses are boss
  // attrition and armor is %-mitigation that compounds at depth); (2) matching
  // the mix is NECESSARY BUT NOT SUFFICIENT — CRIT is nearly inert in combat
  // (~10% of hits, small multiplier bump) yet FULL-WEIGHT in the gScore auto-
  // equip, so an affix pairing crit WITH concentrated hp gets over-equipped and
  // quietly smuggles survivability HP onto the hero (~+1.5pt easy). So this batch
  // holds crit total to 8 (spread across offense affixes only), never co-locates
  // crit with concentrated hp (only Runeworked carries a token hp1), keeps
  // def >= armor, and pairs its hp with str/agi or the defensive block. Two
  // defensive archetypes (Tempered, of the Quenching) carry the pool's ~15%
  // armor+def share so the set stays offense/HP-LED, not pure-offense. Category
  // totals str16/agi7/hp15/hit3/crit8/armor3/def6 (comp 59/26/16) mirror the
  // neutral "Trophies of the Arena" profile (59/25/16); gScore peaks at 9
  // (Runeworked), below the pool's 10 ceiling.
  // luck (index 2) is combat- and gScore-inert so it stays 0 (nonzero would
  // pad); magicFind (index 8) stays 0 to match the four prior batches.
  // A NOTE ON THE CROWN: a first draft gave the crown suffix (of the Grand Smith)
  // an inert crit2 where the proven-neutral Relics crown (of the Titan) carries a
  // real hp3 — an isolated 24k A/B measured that draft -1.05pt / z=-2.39 (mildly
  // HARDER, just outside neutral) because the frequently-equipped gScore-8 crown
  // delivered ~hp3 less survivability per equip. Swapping the crown's crit2 -> hp3
  // (and relocating the 2 crit onto no-hp offense affixes to keep crit total 8)
  // recentred it: the shipped design measures base 37.31% vs batch 37.57%
  // (+0.27pt, z=0.60 at 24k runs/arm) — NEUTRAL. VERIFIED in that isolated A/B off
  // a clean origin/main worktree + an equipped-gear probe at realms 6-7 (which
  // showed the crown fix restored ~+2.6 equipped HP with a neutral win rate) — see
  // scripts/balance-baseline.json. No new tile symbols — affixes only ride items,
  // never the map, so scene.js spriteMap / hero.js creaturesAndItemsMap need no
  // changes (zero symbol-crash risk).
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  pre.push(new iStats.fix([5, 0, 0, 1, 1, 2, 0, 0, 0], "Runeworked")); // etched power runes
  pre.push(new iStats.fix([0, 2, 0, 0, 1, 3, 0, 0, 0], "Keen-Edged")); // whetted crit edge
  pre.push(new iStats.fix([0, 0, 0, 2, 0, 0, 1, 3, 0], "Tempered")); // heat-treated plate
  pre.push(new iStats.fix([3, 2, 0, 2, 0, 0, 0, 0, 0], "Masterforged")); // flawless all-rounder

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

  //--- "Spoils of the Realms" suffix half (paired with the prefixes above) ---
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  suf.push(new iStats.fix([0, 0, 0, 5, 0, 0, 1, 2, 0], "of the Frostmarch")); // hp-led warding
  suf.push(new iStats.fix([0, 4, 0, 0, 1, 3, 0, 0, 0], "of the Blightwood")); // hunter's edge
  suf.push(new iStats.fix([5, 0, 0, 0, 1, 1, 0, 0, 0], "of the Emberdeep")); // molten fury
  suf.push(new iStats.fix([3, 3, 0, 2, 0, 2, 0, 0, 0], "of the Cinderwyrm")); // apex crown

  //--- "Trophies of the Arena" suffix half (the arena's honours) ----------
  // of the Champion (gScore 10) holds the high-end ceiling alongside of Kings /
  // of Defense / of the Cinderwyrm; of the Bulwark carries defense so the batch
  // matches the pool's ~15% armor/defense share (see the prefix comment).
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  suf.push(new iStats.fix([1, 1, 0, 6, 0, 0, 0, 0, 0], "of the Arena")); // endurance of the pit
  suf.push(new iStats.fix([6, 0, 0, 0, 2, 0, 0, 0, 0], "of Conquest")); // raw dominance
  suf.push(new iStats.fix([3, 2, 0, 2, 0, 3, 0, 0, 0], "of the Champion")); // apex crown (Cinderwyrm's peer)
  suf.push(new iStats.fix([0, 0, 0, 3, 0, 0, 1, 3, 0], "of the Bulwark")); // the shield-wall

  //--- "Relics of the Apex" suffix half (the titans' echoes) --------------
  // of the Titan is the crown all-rounder (str/agi/hp, gScore 8 — sits below the
  // pool's gScore-10 ceiling held by of the Cinderwyrm / of the Champion); its hp
  // rides str/agi, not crit, per the neutrality lesson in the prefix comment. of
  // the Aegis carries the second armor+defense share (def >= armor) so the batch
  // matches the pool's ~15% armor/def composition.
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  suf.push(new iStats.fix([4, 0, 0, 1, 1, 2, 0, 0, 0], "of Fury")); // enrage: molten wrath
  suf.push(new iStats.fix([2, 2, 0, 0, 0, 2, 0, 0, 0], "of Recoil")); // thorns: the counter-strike
  suf.push(new iStats.fix([0, 0, 0, 3, 0, 0, 2, 3, 0], "of the Aegis")); // ward: the raised barrier
  suf.push(new iStats.fix([3, 2, 0, 3, 0, 0, 0, 0, 0], "of the Titan")); // apex crown

  //--- "Craft of the Forgemasters" suffix half (the legendary forges) -----
  // of the Grand Smith is the crown all-rounder (str3/agi2/hp3, gScore 8 — sits
  // below the pool's gScore-10 ceiling); it mirrors the proven-neutral Relics
  // crown "of the Titan" exactly, carrying honest hp on str/agi with NO crit (an
  // earlier crit-bearing crown drifted the batch mildly harder — see the prefix
  // comment). of the Forge is the crit-bearing offense suffix (str4/hit1/crit3, no
  // hp). of the Quenching carries the second armor+def share (def >= armor) so the
  // batch matches the pool's ~15% armor/def composition; of the Anvil is the hp-led
  // endurance suffix (hp paired with str/agi, never crit).
  //           [str, agi, luk, hp, hit, crt, arm, def, mf]
  suf.push(new iStats.fix([4, 0, 0, 0, 1, 3, 0, 0, 0], "of the Forge")); // raw forged might
  suf.push(new iStats.fix([1, 1, 0, 5, 0, 0, 0, 0, 0], "of the Anvil")); // endurance of the anvil
  suf.push(new iStats.fix([0, 0, 0, 2, 0, 0, 2, 3, 0], "of the Quenching")); // hardened in the quench
  suf.push(new iStats.fix([3, 2, 0, 3, 0, 0, 0, 0, 0], "of the Grand Smith")); // mastersmith's crown

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
