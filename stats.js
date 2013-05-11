(function(){
	window.stats = {};
	var iStats = window.stats;
	iStats.raw = {
		"strength" : 0, // 0
		"agility" : 0,  // 1
		"luck" : 0,     // 2
		"hp" : 0,       // 3
		"hit" : 0,      // 4
		"crit" : 0,     // 5
		"armor" : 0,    // 6
		"defense" : 0,  // 7
		"magicfind" : 0 // 8
	};
	window.stats.init = function (obj) {
		'use strict';
		_.extend(obj, window.stats.raw);
	}
	iStats.fix = function (iStats, name, level) {
		this.name = name;
		window.stats.init(this);
		this.strength = iStats[0];
		this.agility = iStats[1];
		this.luck = iStats[2];
		this.hp = iStats[3];
		this.hit = iStats[4];
		this.crit = iStats[5];
		this.armor = iStats[6];
		this.defense = iStats[7];
		this.magicfind = iStats[8];
		this.level = level;
	};


//------------
//*Fix creation
//------------
	var pre = iStats.prefixes = [];
	var suf = iStats.suffixes = [];

	//Prefix creation
	pre.push(new iStats.fix([1,1,0,0,0,1,0,0,0],"Burning",1));
	pre.push(new iStats.fix([3,0,0,1,0,0,0,0,0],"Strong",1));
	pre.push(new iStats.fix([1,0,0,1,0,0,0,1,0],"Heavy",1));
	pre.push(new iStats.fix([0,3,0,0,1,0,0,0,0],"Nimble",1));
	pre.push(new iStats.fix([0,0,1,3,0,0,0,0,0],"Crafty",1));
	pre.push(new iStats.fix([2,2,0,0,0,0,0,0,0],"Sharp",1));
	pre.push(new iStats.fix([0,1,0,0,3,0,0,0,0],"Thin",1));
	pre.push(new iStats.fix([0,0,0,0,0,3,0,0,0],"Grim",1));
	pre.push(new iStats.fix([0,0,0,3,0,0,1,1,0],"Stalwart",1));
	pre.push(new iStats.fix([0,0,2,0,2,0,0,0,0],"Bendy",1));
	pre.push(new iStats.fix([window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1)],"Weird",1));
	pre.push(new iStats.fix([1,0,0,0,0,0,0,0,0],"Weak",1));
	pre.push(new iStats.fix([2,2,0,1,0,0,0,0,0],"Great",1));
	pre.push(new iStats.fix([1,0,0,3,0,0,0,1,0],"Broad",1));
	pre.push(new iStats.fix([0,4,0,0,0,2,0,1,0],"Pointy",1));
	pre.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Immovable",1));

	//Suffix creation
	suf.push(new iStats.fix([0,1,2,1,0,0,0,0,0],"of the Phoenix",1));
	suf.push(new iStats.fix([window.util.randomInterval(3,5),0,0,0,0,0,0,0,0],"of Strength"	,1));
	suf.push(new iStats.fix([0,window.util.randomInterval(3,5),0,0,0,0,0,0,0],"of Agility"		,1));
	suf.push(new iStats.fix([0,0,window.util.randomInterval(3,5),0,0,0,0,0,0],"of Luck"		,1));
	suf.push(new iStats.fix([0,0,0,window.util.randomInterval(6,9),0,0,0,0,0],"of Health"		,1));
	suf.push(new iStats.fix([0,0,0,0,window.util.randomInterval(3,5),0,0,0,0],"of Precision"	,1));
	suf.push(new iStats.fix([0,0,0,0,0,window.util.randomInterval(3,5),0,0,0],"of Heartseeking",1));
	suf.push(new iStats.fix([0,0,0,0,0,0,window.util.randomInterval(6,9),0,0],"of Armor"		,1));
	suf.push(new iStats.fix([0,0,0,0,0,0,0,window.util.randomInterval(6,9),0],"of Defense"		,1));
	suf.push(new iStats.fix([0,0,0,0,0,0,0,0,window.util.randomInterval(6,9)],"of Magical Attraction",1));
	suf.push(new iStats.fix([0,0,0,1,0,0,2,2,0],"of the Heavy",1));
	suf.push(new iStats.fix([0,3,0,0,1,0,0,0,0],"of the Thief",1));
	suf.push(new iStats.fix([0,2,0,0,0,0,0,0,-1],"of the Not-So-Brave",1));
	suf.push(new iStats.fix([1,2,0,0,1,0,0,0,0],"of Blades",1));
	suf.push(new iStats.fix([0,-1,0,7,0,0,0,0,0],"of the Golem",1));
	suf.push(new iStats.fix([0,3,0,0,0,3,0,0,0],"of the Ninja",1));
	suf.push(new iStats.fix([2,2,0,0,1,0,0,0,0],"of the Lion",1));
	suf.push(new iStats.fix([0,0,2,0,2,0,0,0,3],"of the Bounty Hunter",1));
	suf.push(new iStats.fix([window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1),window.util.randomInterval(0,1)],"of the Jester",1));
	suf.push(new iStats.fix([0,1,2,1,0,0,0,0,0],"of the Secondborn",1));
	suf.push(new iStats.fix([1,1,1,1,1,1,1,1,1],"of Kings",1));
}());
