window.lj = lj || {};
(() => {
  lj.util = {};
  lj.util.randomInterval = (from, to) => {
    if (from <= to) {
      return Math.floor(Math.random() * (to - from + 1) + from);
    } else {
      return Math.floor(Math.random() * (from - to + 1) + to);
    }
  };
  lj.util.capitaliseFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
})();
