window.lj = lj || {};
lj.enemy = {};

lj.enemy.base = function(type,mod){
	this.strength = Math.round(type.stats[0]*mod.stats[0]);
	this.agility = Math.round(type.stats[1]*mod.stats[1]);
	this.hp = Math.round(type.stats[2]*mod.stats[2]);
	this.hit = Math.round(type.stats[3]*mod.stats[3]);
	this.crit = Math.round(type.stats[4]*mod.stats[4]);
	this.armor = Math.round(type.stats[5]*mod.stats[5]);
	this.defense = Math.round(type.stats[6]*mod.stats[6]);
	this.name = (mod.name+' '+type.name).trim();
}
lj.enemy.get = function(type,boss){
	var rng = lj.util.randomInterval,
		mon = lj.enemy.types[type][rng(0,lj.enemy.types[type].length-1)],
		mod = lj.enemy.mods[rng(0,lj.enemy.mods.length-1)];
	if(boss){
		return new lj.enemy.base(mon,{stats:[3,3,3,3,3,1,1],name:"Big Bad Boss"})
	};
	// console.log(mon);
	// console.log(mod);
	return new lj.enemy.base(mon,mod);
};
lj.enemy.types = {
	brown : [],
	blue : [],
	green : [],
	red : []
};
lj.enemy.mods = [];


//Generate monsters

(function (){
	lj.enemy.monster = function(stats,name){
		this.stats = stats;
		this.name = name;
	}
	var col = lj.enemy.types,
		mon = lj.enemy.monster,
		mod = lj.enemy.mods;
	//Brown
	col["brown"].push(new mon([2,2,25,1,1,1,2],"Wolf"));
	col["brown"].push(new mon([3,1,20,0,1,2,0],"Goblin"));
	col["brown"].push(new mon([1,4,35,1,2,1,1],"Troll"));
	col["brown"].push(new mon([3,1,40,1,1,5,0],"Earth Elemental"));
	//TODO: Blue, green and red

	//Set up mods
	mod.push(new mon([1,2,1,1,1,-1,1],"Angry"));
	mod.push(new mon([0.5,0,2,1,1,1,1],"Sturdy"));
	mod.push(new mon([1,1,0.75,1,2,1,1],"Rabid"));
	mod.push(new mon([1.5,1,1,1,1,1,1],"Strong"));
	mod.push(new mon([1,1,1,2,1,0,0],"Flaming"));
	mod.push(new mon([1,1,1,0,1,1,1],"Blind"));
	mod.push(new mon([0.1,0.1,1,1,1,1,1],"Pacified"));
	mod.push(new mon([1,1,1,-50,10,1,1],"Wildly Flailing"));
}());