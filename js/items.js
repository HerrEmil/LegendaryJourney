window.lj = lj || {};
(function(){
	lj.items = {};
	var iItems = lj.items;
	var iStats = lj.stats;
	iItems.util = {
		capFirst : function (string) {
			'use strict';
			return string.charAt(0).toUpperCase() + string.slice(1);
		},
	};
	iItems.types = {
		"head" : [],
		"shoulder" : [],
		"chest" : [],
		"cloak" : [],
		"gloves" : [],
		"pants" : [],
		"boots" : [],
		"ring" : [],
		"weapon" : []
	};
	iItems.qualities = {
		"poor" : 		{"mod" :0.5, 	"chance":10},
		"normal" : 		{"mod" :1, 		"chance":74},
		"rare" : 		{"mod" :1.5, 	"chance":10},
		"epic" : 		{"mod" :2.5,	"chance":4},
		"legendary" : 	{"mod" :4, 		"chance":2},
		get : function(){
			var total = this.poor.chance + this.normal.chance + this.rare.chance + this.epic.chance + this.legendary.chance,
				roll = lj.util.randomInterval(1,total),
				rolling = true;
			// console.log("total: "+total+"\nroll: "+roll);
			total -= this.legendary.chance;
			if(total < roll){
				return "legendary";
			}
			total -= this.epic.chance
			if(total < roll){
				return "epic";
			}
			total -= this.rare.chance
			if(total < roll){
				return "rare";
			}
			total -= this.normal.chance
			if(total < roll){
				return "normal";
			}
			return "poor";
		}
	};

	iItems.item = function (slot, type, prefix, suffix, quality) {
		'use strict';
		this.slot = slot;
		this.type = type;
		if(Math.floor((Math.random()*10)+1)<=3){
			this.prefix = prefix;
		} else {
			this.prefix = [0,0,0,0,0,0,0,0,0];
			this.prefix.name = "";
		}
		if(Math.floor((Math.random()*10)+1)<=3){
			this.suffix = suffix;
		} else {
			this.suffix = [0,0,0,0,0,0,0,0,0];
			this.suffix.name = "";
		}
		
		if(!quality){
			this.quality = lj.items.qualities.get();
		} else {
			this.quality = quality;
		}

		//Set the stats of the item based on type, prefix, affix and apply the quality multiplier
		lj.stats.init(this);
		this.strength = Math.round((this.prefix[0] + this.type[0] + this.suffix[0])*lj.items.qualities[this.quality].mod);
		this.agility = Math.round((this.prefix[1] + this.type[1] + this.suffix[1])*lj.items.qualities[this.quality].mod);
		this.luck = Math.round((this.prefix[2] + this.type[2] + this.suffix[2])*lj.items.qualities[this.quality].mod);
		this.hp = Math.round((this.prefix[3] + this.type[3] + this.suffix[3])*lj.items.qualities[this.quality].mod);
		this.hit = Math.round((this.prefix[4] + this.type[4] + this.suffix[4])*lj.items.qualities[this.quality].mod);
		this.crit = Math.round((this.prefix[5] + this.type[5] + this.suffix[5])*lj.items.qualities[this.quality].mod);
		this.armor = Math.round((this.prefix[6] + this.type[6] + this.suffix[6])*lj.items.qualities[this.quality].mod);
		this.defense = Math.round((this.prefix[7] + this.type[7] + this.suffix[7])*lj.items.qualities[this.quality].mod);
		this.magicfind = Math.round((this.prefix[8] + this.type[8] + this.suffix[8])*lj.items.qualities[this.quality].mod);


		//Finally, give it a pretty name
		this.name = this.prefix.name +' '+type.name+' '+this.suffix.name;
		this.name = this.name.trim();
		if(this.quality != "normal"){
			this.name = lj.util.capitaliseFirstLetter(this.quality) +' '+ this.name;
		}
		
		// console.log(this.name);

	};
	iItems.makeItem = function(level,slot, quality){
		var rng = lj.util.randomInterval,
			itemSlot,
			itemType,
			itemPrefix,
			itemSuffix,
			slotArray,
			slotIndex,
			typeArray,
			typeIndex,
			ilvl,
			quality;
		if(!level){
			this.ilvl = 1;
		} else {
			this.ilvl = level;
		}
		//If no specific slot is requested, get a random one.
		if(!slot){
			slotArray = ["head", "shoulder", "chest", "cloak", "gloves", "pants", "boots", "ring", "weapon"];
			slotIndex = rng(0,slotArray.length-1);
			this.itemSlot = slotArray[slotIndex];
		} else {
			this.itemSlot = slot;
		}
		if(quality){
			this.quality = quality;
		} else {
			this.quality = null;
		}
		//Based on the slot picked, get a random type
		this.itemType = lj.items.types.get(ilvl,this.itemSlot);
		// console.log(this.itemType.name);

		//Getting prefix
		this.itemPrefix = lj.stats.prefixes.get(rng(0,lj.stats.prefixes.length-1));
		// console.log(this.itemPrefix);

		//Getting Suffix
		this.itemSuffix = lj.stats.suffixes.get(rng(0,lj.stats.suffixes.length-1));
		// console.log(this.itemSuffix);

		//console.log(window.stats.prefixes[this.itemPrefix].name + ' ' +this.itemType.name+' '+window.stats.suffixes[this.itemSuffix].name);
		return new iItems.item(this.itemSlot,this.itemType,this.itemPrefix,this.itemSuffix,this.quality);
	};

	//------------
//Item types
//------------
//------------
//Base Items
//------------
	//Head
	lj.items.types.head.push(new iStats.fix([0,0,0,0,0,0,1,0,0],"Cap"));
	lj.items.types.head.push(new iStats.fix([0,1,0,1,0,1,0,0,0],"Hood"));
	lj.items.types.head.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Helmet"));
	lj.items.types.head.push(new iStats.fix([1,1,0,1,0,0,0,0,0],"Bandana"));
	lj.items.types.head.push(new iStats.fix([0,0,2,0,0,0,0,0,2],"Top Hat"));
	//Shoulder
	lj.items.types.shoulder.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Pauldrons"));
	lj.items.types.shoulder.push(new iStats.fix([0,0,0,0,2,2,0,0,0],"Shoulder Spikes"));
	lj.items.types.shoulder.push(new iStats.fix([2,0,0,0,0,0,1,1,0],"Pads"));
	lj.items.types.shoulder.push(new iStats.fix([0,0,0,0,0,0,0,0,1],"Mantle"));
	//Chest
	lj.items.types.chest.push(new iStats.fix([0,1,0,3,0,0,0,0,0],"Robe"));
	lj.items.types.chest.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Breastplate"));
	lj.items.types.chest.push(new iStats.fix([1,0,0,1,0,0,1,1,0],"Vest"));
	lj.items.types.chest.push(new iStats.fix([0,0,0,0,0,0,0,4,0],"Chainmail"));
	//Cloak
	lj.items.types.cloak.push(new iStats.fix([0,0,3,0,0,0,0,0,0],"Cape"));
	lj.items.types.cloak.push(new iStats.fix([0,0,0,0,0,0,0,0,2],"Backpack"));
	lj.items.types.cloak.push(new iStats.fix([0,2,0,0,0,2,0,0,0],"Scarf"));
	//Gloves
	lj.items.types.gloves.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Gauntlets"));
	lj.items.types.gloves.push(new iStats.fix([0,2,0,0,0,0,1,1,0],"Gloves"));
	lj.items.types.gloves.push(new iStats.fix([3,0,0,0,0,2,0,0,0],"Brass Knuckles"));
	//Pants
	lj.items.types.pants.push(new iStats.fix([1,1,1,1,0,0,0,0,0],"Slacks"));
	lj.items.types.pants.push(new iStats.fix([0,2,0,0,0,1,0,0,1],"Dress Pants"));
	lj.items.types.pants.push(new iStats.fix([1,0,0,0,2,0,0,0,0],"Kilt"));
	lj.items.types.pants.push(new iStats.fix([0,0,0,0,0,0,2,3,0],"Legplates"));
	//Boots
	lj.items.types.boots.push(new iStats.fix([0,1,0,0,2,1,0,0,0],"Jaki-tabis"));
	lj.items.types.boots.push(new iStats.fix([0,2,0,0,0,0,0,1,0],"Sneakers"));
	lj.items.types.boots.push(new iStats.fix([0,0,0,1,0,0,2,2,0],"Greaves"));
	lj.items.types.boots.push(new iStats.fix([0,1,0,1,0,0,2,3,1],"Dress Shoes"));
	//Ring
	lj.items.types.ring.push(new iStats.fix([0,0,0,3,0,0,1,0,0],"Bronze Ring"));
	lj.items.types.ring.push(new iStats.fix([1,2,0,0,0,0,0,1,0],"Silver Ring"));
	lj.items.types.ring.push(new iStats.fix([0,0,1,0,0,1,0,0,1],"Gold Ring"));
	lj.items.types.ring.push(new iStats.fix([0,0,0,1,0,0,2,3,0],"Stone Band"));
	//Trinket

//------------
//Weapons
//------------
	//Swords
	lj.items.types.weapon.push(new iStats.fix([3,4,0,0,2,0,0,0,0],"Dagger"));
	lj.items.types.weapon.push(new iStats.fix([6,1,0,0,2,0,0,0,0],"Claymore"));
	lj.items.types.weapon.push(new iStats.fix([0,6,0,0,2,0,0,0,0],"Katana"));
	lj.items.types.weapon.push(new iStats.fix([3,3,0,0,2,1,0,0,0],"Schimitar"));
	//Hammers
	lj.items.types.weapon.push(new iStats.fix([9,-1,0,0,0,0,0,-1,0],"Stone Maul"));
	lj.items.types.weapon.push(new iStats.fix([7,0,0,1,0,0,0,0,0],"Mace"));
	lj.items.types.weapon.push(new iStats.fix([3,2,0,0,0,0,0,0,2],"Cane"));
	//Axes
	lj.items.types.weapon.push(new iStats.fix([2,5,0,0,0,2,0,0,0],"Hatchet"));
	lj.items.types.weapon.push(new iStats.fix([3,3,0,0,1,2,0,0,0],"Cleaver"));
	lj.items.types.weapon.push(new iStats.fix([5,2,0,0,0,2,0,0,0],"Double Axe"));

	lj.items.types.get = function(level,slot,type){
		var ilvl,
			gear,
			rng = lj.util.randomInterval,
			statArray = [],
			vary = lj.stats.vary,
			slotArray,
			slotIndex,
			itemSlot,
			typeArray,
			typeIndex,
			itemType;
		//Deal with level
		if(!level){
			this.ilvl = 1
		} else{
			this.ilvl = level;
		}
		//Deal with slot
		if(!slot){
			this.slotArray = ["head", "shoulder", "chest", "cloak", "gloves", "pants", "boots", "ring", "weapon"];
			this.slotIndex = rng(0,this.slotArray.length-1);
			this.itemSlot = this.slotArray[this.slotIndex];
		} else {
			this.itemSlot = slot;
		}
		//console.log(this.itemSlot);
		if(!type){
			typeArray = lj.items.types[this.itemSlot];
			typeIndex = rng(0,lj.items.types[this.itemSlot].length-1);
			this.itemType = typeArray[typeIndex];
		} else {
			this.itemType = type;
		}
		//console.log(this.itemType);
		//Generate some stats
		statArray[0] = vary(this.itemType.strength,this.ilvl);
		statArray[1] = vary(this.itemType.agility,this.ilvl);
		statArray[2] = vary(this.itemType.luck,this.ilvl);
		statArray[3] = vary(this.itemType.hp,this.ilvl);
		statArray[4] = vary(this.itemType.hit,this.ilvl);
		statArray[5] = vary(this.itemType.crit,this.ilvl);
		statArray[6] = vary(this.itemType.armor,this.ilvl);
		statArray[7] = vary(this.itemType.defense,this.ilvl);
		statArray[8] = vary(this.itemType.magicfind,this.ilvl);
		statArray.name = this.itemType.name;
		statArray.ilvl = this.ilvl;
		return statArray;
	};
}());
lj.items.lots = function(num){
	var num, i,obj;
	for(i=0;i<num;i++){
		obj = lj.items.makeItem();
		console.log(obj.name);
	}
}