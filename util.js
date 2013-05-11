(function(){
	window.util = {};
	window.util.randomInterval = function (from,to) {
		return Math.floor(Math.random()*(to-from+1)+from);
	};
}());