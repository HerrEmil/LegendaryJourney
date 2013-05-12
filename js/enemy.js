window.lj = lj || {};
lj.enemy = {};

lj.enemy.base = function(type,mod){
	var realmMod = (lj.realm.getSize()+9)/10;
	this.strength = Math.round(type.stats[0]*mod.stats[0]*realmMod);
	this.agility = Math.round(type.stats[1]*mod.stats[1]*realmMod);
	this.hp = Math.round(type.stats[2]*mod.stats[2]*realmMod);
	this.hit = Math.round(type.stats[3]*mod.stats[3]*realmMod);
	this.crit = Math.round(type.stats[4]*mod.stats[4]*realmMod);
	this.armor = Math.round(type.stats[5]*mod.stats[5]*realmMod);
	this.defense = Math.round(type.stats[6]*mod.stats[6]*realmMod);
	this.name = (mod.name+' '+type.name).trim();
}
lj.enemy.get = function(type,grade){
	var rng = lj.util.randomInterval,
		mon = lj.enemy.types[type][grade],
		mod = lj.enemy.mods[rng(0,lj.enemy.mods.length-1)];
	if(rng(1,5)<5){
		return new lj.enemy.base(mon,{stats:[1,1,1,1,1,1,1],name:""});
	}
	// console.log(mon);
	// console.log(mod);
	return new lj.enemy.base(mon,mod);
};
lj.enemy.types = {
	brown : {},
	blue : {},
	green : {},
	red : {}
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
	col["brown"].a = new mon([2,4,25,1,1,1,2],"Wolf");
	col["brown"].b = new mon([3,2,20,0,1,2,0],"Gnoll");
	col["brown"].c = new mon([1,6,35,1,2,1,1],"Troll");
	col["brown"].d = new mon([3,4,40,1,1,5,0],"Ghost Mage");
	col["brown"].B = new mon([7,7,80,1,1,5,0],"Evil Blue Mage");
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