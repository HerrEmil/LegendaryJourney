window.lj = lj || {};
(function(){
	lj.stats = {};
	var iStats = lj.stats;
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
	iStats.init = function (obj) {
		'use strict';
		_.extend(obj, lj.stats.raw);
	};
	iStats.fix = function (iStats, name, level) {
		this.name = name;
		lj.stats.init(this);
		this.strength = iStats[0];
		this.agility = iStats[1];
		this.luck = iStats[2];
		this.hp = iStats[3];
		this.hit = iStats[4];
		this.crit = iStats[5];
		this.armor = iStats[6];
		this.defense = iStats[7];
		this.magicfind = iStats[8];
	};
	iStats.vary = function (value, level) {
		var rng = lj.util.randomInterval,
			lowerBound,
			upperBound;
		lowerBound = value * level;
		upperBound = Math.round(lowerBound * 1.5);
		return rng(lowerBound,upperBound);
	};


//------------
//*Fix creation
//------------
	var pre = iStats.prefixes = [];
	var suf = iStats.suffixes = [];

	//Prefix creation
	pre.push(new iStats.fix([1,1,0,0,0,1,0,0,0],"Burning"));
	pre.push(new iStats.fix([3,0,0,1,0,0,0,0,0],"Strong"));
	pre.push(new iStats.fix([1,0,0,1,0,0,0,1,0],"Heavy"));
	pre.push(new iStats.fix([0,3,0,0,1,0,0,0,0],"Nimble"));
	pre.push(new iStats.fix([0,0,1,3,0,0,0,0,0],"Crafty"));
	pre.push(new iStats.fix([2,2,0,0,0,0,0,0,0],"Sharp"));
	pre.push(new iStats.fix([0,1,0,0,3,0,0,0,0],"Thin"));
	pre.push(new iStats.fix([0,0,0,0,0,3,0,0,0],"Grim"));
	pre.push(new iStats.fix([0,0,0,3,0,0,1,1,0],"Stalwart"));
	pre.push(new iStats.fix([0,0,2,0,2,0,0,0,0],"Bendy"));
	pre.push(new iStats.fix([1,1,1,1,1,1,1,1,1],"Balanced"));
	pre.push(new iStats.fix([1,0,0,0,0,0,0,0,0],"Weak"));
	pre.push(new iStats.fix([2,2,0,1,0,0,0,0,0],"Grand"));
	pre.push(new iStats.fix([1,0,0,3,0,0,0,1,0],"Broad"));
	pre.push(new iStats.fix([0,4,0,0,0,2,0,1,0],"Pointy"));
	pre.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Immovable"));

	//Suffix creation
	suf.push(new iStats.fix([0,1,2,1,0,0,0,0,0],"of the Phoenix"));
	suf.push(new iStats.fix([5,0,0,0,0,0,0,0,0],"of Strength"));
	suf.push(new iStats.fix([0,5,0,0,0,0,0,0,0],"of Agility"));
	suf.push(new iStats.fix([0,0,5,0,0,0,0,0,0],"of Luck"));
	suf.push(new iStats.fix([0,0,0,5,0,0,0,0,0],"of Health"	));
	suf.push(new iStats.fix([0,0,0,0,5,0,0,0,0],"of Precision"));
	suf.push(new iStats.fix([0,0,0,0,0,5,0,0,0],"of Heartseeking"));
	suf.push(new iStats.fix([0,0,0,0,0,0,8,0,0],"of Armor"));
	suf.push(new iStats.fix([0,0,0,0,0,0,0,8,0],"of Defense"));
	suf.push(new iStats.fix([0,0,0,0,0,0,0,0,7],"of Magical Attraction"));
	suf.push(new iStats.fix([0,0,0,1,0,0,2,2,0],"of the Heavy"));
	suf.push(new iStats.fix([0,3,0,0,1,0,0,0,0],"of the Thief"));
	suf.push(new iStats.fix([0,2,0,0,0,0,0,0,-1],"of the Not-So-Brave"));
	suf.push(new iStats.fix([1,2,0,0,1,0,0,0,0],"of Blades"));
	suf.push(new iStats.fix([0,-1,0,7,0,0,0,0,0],"of the Golem"));
	suf.push(new iStats.fix([0,3,0,0,0,3,0,0,0],"of the Ninja"));
	suf.push(new iStats.fix([2,2,0,0,1,0,0,0,0],"of the Lion"));
	suf.push(new iStats.fix([0,0,2,0,2,0,0,0,3],"of the Bounty Hunter"));
	suf.push(new iStats.fix([-1,-1,-1,-1,-1,-1,-1,-1,-1],"of the Loser"));
	suf.push(new iStats.fix([0,1,2,1,0,0,0,0,0],"of the Hermit"));
	suf.push(new iStats.fix([1,1,1,1,1,1,1,1,1],"of Kings"));
	suf.push(new iStats.fix([0,0,0,0,2,2,0,0,0],"of Excessive Exaggeration"));

	//Getters
	pre.get = function(id, level){
		var ilvl,
			prefix,
			rng = lj.util.randomInterval,
			statArray = [],
			vary = lj.stats.vary;
		if(!level){
			this.ilvl = 1
		} else{
			this.ilvl = level;
		}
		if(!id){
			this.prefix = rng(0,lj.stats.prefixes.length-1);
		} else {
			this.prefix = id;
		}
		//Generate some stats
		statArray[0] = vary(pre[this.prefix].strength,this.ilvl);
		statArray[1] = vary(pre[this.prefix].agility,this.ilvl);
		statArray[2] = vary(pre[this.prefix].luck,this.ilvl);
		statArray[3] = vary(pre[this.prefix].hp,this.ilvl);
		statArray[4] = vary(pre[this.prefix].hit,this.ilvl);
		statArray[5] = vary(pre[this.prefix].crit,this.ilvl);
		statArray[6] = vary(pre[this.prefix].armor,this.ilvl);
		statArray[7] = vary(pre[this.prefix].defense,this.ilvl);
		statArray[8] = vary(pre[this.prefix].magicfind,this.ilvl);
		statArray.name = pre[this.prefix].name;
		statArray.id = this.prefix;
		statArray.ilvl = this.ilvl;
		return statArray;
	};
	suf.get = function(id, level){
		var ilvl,
			suffix,
			rng = lj.util.randomInterval,
			statArray = [],
			vary = lj.stats.vary;
		if(!level){
			this.ilvl = 1
		} else{
			this.ilvl = level;
		}
		if(!id){
			this.suffix = rng(0,lj.stats.suffixes.length-1);
		} else {
			this.suffix = id;
		}
		//Generate some stats
		statArray[0] = vary(suf[this.suffix].strength,this.ilvl);
		statArray[1] = vary(suf[this.suffix].agility,this.ilvl);
		statArray[2] = vary(suf[this.suffix].luck,this.ilvl);
		statArray[3] = vary(suf[this.suffix].hp,this.ilvl);
		statArray[4] = vary(suf[this.suffix].hit,this.ilvl);
		statArray[5] = vary(suf[this.suffix].crit,this.ilvl);
		statArray[6] = vary(suf[this.suffix].armor,this.ilvl);
		statArray[7] = vary(suf[this.suffix].defense,this.ilvl);
		statArray[8] = vary(suf[this.suffix].magicfind,this.ilvl);
		statArray.name = suf[this.suffix].name;
		statArray.id = this.suffix;
		statArray.ilvl = this.ilvl;
		return statArray;
	};
}());
