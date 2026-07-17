window.lj = lj || {};

lj.battleLog = (() => {
  const battleLog = document.getElementById("battleLog");

  function printMessage(message) {
    const messageContainer = document.createElement("span");
    const br = document.createElement("br");

    // Put message in message container
    messageContainer.innerHTML = message;

    // Add message and break to HTML
    battleLog.appendChild(messageContainer);
    battleLog.appendChild(br);
    // Scroll to bottom of scrollbox
    battleLog.scrollTop = battleLog.scrollHeight - battleLog.clientHeight;
  }

  function clear() {
    battleLog.innerHTML = "";
  }

  function acquire(item, quality) {
    const message = `Found <span class="${quality}">${item}</span>.`;
    printMessage(message);
  }

  function autoEquip(item, quality) {
    const message = `You equipped the <span class="${quality}">${item}</span>!`;
    printMessage(message);
  }

  function monsterKilled(monster) {
    const message = `Slayed the ${monster}!`;
    printMessage(message);
  }

  function heroKilled(monster) {
    const message1 = `You were killed by the ${monster} :(`;
    printMessage(message1);
    printMessage('<br/><div class="btn restart">Try again!</div>');
  }

  function levelComplete(level) {
    const message = `You finished level ${level}! :)`;
    printMessage(message);
  }

  function gameComplete() {
    printMessage("You completed the game! :D");
    printMessage("You are AWESOME! Congratulations!");
    printMessage('<br/><div class="btn restart">Play again!</div>');
  }

  // The apex mechanics fire silently: a warded blow just reads 0, a sundered
  // cleave just lands harder, and thorns drains the hero on the hero's OWN
  // strike. Keyed by the flag lj.hero.fight stamps on the log entry, these name
  // what the boss actually did so the player can read the fight.
  const telegraphs = {
    enraged: (monster) => `The ${monster} is wounded — and enrages!`,
    executed: (monster) => `The ${monster} smells blood and moves to finish you!`,
    warded: (monster) => `A ward flares — the ${monster} absorbs your blow!`,
    reflected: (monster) => `The ${monster}'s searing hide sears your blow back!`,
    sundered: (monster) => `The ${monster} cleaves through your armor!`,
    flurried: (monster) => `The ${monster} blurs into a flurry of blows!`,
  };

  // hasOwnProperty, not a truthiness check: a plain `telegraphs[kind]` reaches
  // Object.prototype, so an unknown kind like "constructor" would resolve to an
  // inherited function and print junk instead of staying quiet.
  function known(table, key) {
    return Object.prototype.hasOwnProperty.call(table, key);
  }

  function mechanic(kind, monster) {
    if (!known(telegraphs, kind)) return;
    printMessage(`<span class="telegraph">${telegraphs[kind](monster)}</span>`);
  }

  // Display titles for the biome slugs lj.realm.getBiomeName() returns. An
  // unmapped biome falls back to its slug, so a new one added to realm.js still
  // announces itself (just unprettified) instead of printing "undefined".
  const biomeTitles = {
    halls: "The Hollow Halls",
    frost: "The Frostmarch",
    blight: "The Blightwood",
    ember: "The Emberdeep",
  };

  function realmArrival(level, biome) {
    const title = known(biomeTitles, biome) ? biomeTitles[biome] : biome;
    printMessage(`<span class="banner">Realm ${level} — ${title}</span>`);
  }

  function customMessage(message) {
    printMessage(message);
  }

  return {
    acquire,
    autoEquip,
    monsterKilled,
    heroKilled,
    levelComplete,
    gameComplete,
    mechanic,
    realmArrival,
    customMessage,
    clear,
  };
})();
