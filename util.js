(function(){
	window.util = {};
	window.util.randomInterval = function (from,to) {
		if(from<=to){
			return Math.floor(Math.random()*(to-from+1)+from);	
		} else {
			return Math.floor(Math.random()*(from-to+1)+to);
		}
		
	};
}());