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
    customMessage,
    clear,
  };
})();
