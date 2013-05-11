(function(){
	window.items = {};
	var iItems = window.items;
	var iStats = window.stats;
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
				roll = window.util.randomInterval(1,total),
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
			this.quality = window.items.qualities.get();
		} else {
			this.quality = quality;
		}

		//Set the stats of the item based on type, prefix, affix and apply the quality multiplier
		window.stats.init(this);
		this.strength = Math.round((this.prefix[0] + this.type[0] + this.suffix[0])*items.qualities[this.quality].mod);
		this.agility = Math.round((this.prefix[1] + this.type[1] + this.suffix[1])*items.qualities[this.quality].mod);
		this.luck = Math.round((this.prefix[2] + this.type[2] + this.suffix[2])*items.qualities[this.quality].mod);
		this.hp = Math.round((this.prefix[3] + this.type[3] + this.suffix[3])*items.qualities[this.quality].mod);
		this.hit = Math.round((this.prefix[4] + this.type[4] + this.suffix[4])*items.qualities[this.quality].mod);
		this.crit = Math.round((this.prefix[5] + this.type[5] + this.suffix[5])*items.qualities[this.quality].mod);
		this.armor = Math.round((this.prefix[6] + this.type[6] + this.suffix[6])*items.qualities[this.quality].mod);
		this.defense = Math.round((this.prefix[7] + this.type[7] + this.suffix[7])*items.qualities[this.quality].mod);
		this.magicfind = Math.round((this.prefix[8] + this.type[8] + this.suffix[8])*items.qualities[this.quality].mod);


		//Finally, give it a pretty name
		this.name = this.prefix.name +' '+type.name+' '+this.suffix.name;
		this.name = this.name.trim();
		if(this.quality != "normal"){
			this.name = window.util.capitaliseFirstLetter(this.quality) +' '+ this.name;
		}
		
		// console.log(this.name);

	};
	iItems.makeItem = function(level,slot, quality){
		var rng = window.util.randomInterval,
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
		this.itemType = items.types.get(ilvl,this.itemSlot);
		// console.log(this.itemType.name);

		//Getting prefix
		this.itemPrefix = window.stats.prefixes.get(rng(0,window.stats.prefixes.length-1));
		// console.log(this.itemPrefix);

		//Getting Suffix
		this.itemSuffix = window.stats.suffixes.get(rng(0,window.stats.suffixes.length-1));
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
	items.types.head.push(new iStats.fix([0,0,0,0,0,0,1,0,0],"Cap"));
	items.types.head.push(new iStats.fix([0,1,0,1,0,1,0,0,0],"Hood"));
	items.types.head.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Helmet"));
	items.types.head.push(new iStats.fix([1,1,0,1,0,0,0,0,0],"Bandana"));
	items.types.head.push(new iStats.fix([0,0,2,0,0,0,0,0,2],"Top Hat"));
	//Shoulder
	items.types.shoulder.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Pauldrons"));
	items.types.shoulder.push(new iStats.fix([0,0,0,0,2,2,0,0,0],"Shoulder Spikes"));
	items.types.shoulder.push(new iStats.fix([2,0,0,0,0,0,1,1,0],"Pads"));
	items.types.shoulder.push(new iStats.fix([0,0,0,0,0,0,0,0,1],"Parrot"));
	//Chest
	items.types.chest.push(new iStats.fix([0,1,0,3,0,0,0,0,0],"Robe"));
	items.types.chest.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Breastplate"));
	items.types.chest.push(new iStats.fix([1,0,0,1,0,0,1,1,0],"Vest"));
	items.types.chest.push(new iStats.fix([0,0,0,0,0,0,0,4,0],"Chainmail"));
	//Cloak
	items.types.cloak.push(new iStats.fix([0,0,3,0,0,0,0,0,0],"Cape"));
	items.types.cloak.push(new iStats.fix([0,0,0,0,0,0,0,0,2],"Backpack"));
	items.types.cloak.push(new iStats.fix([0,2,0,0,0,2,0,0,0],"Scarf"));
	//Gloves
	items.types.gloves.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Gauntlets"));
	items.types.gloves.push(new iStats.fix([0,2,0,0,0,0,1,1,0],"Gloves"));
	items.types.gloves.push(new iStats.fix([3,0,0,0,0,2,0,0,0],"Brass Knuckles"));
	//Pants
	items.types.pants.push(new iStats.fix([1,1,1,1,0,0,0,0,0],"Slacks"));
	items.types.pants.push(new iStats.fix([0,2,0,0,0,1,0,0,1],"Dress Pants"));
	items.types.pants.push(new iStats.fix([1,0,0,0,2,0,0,0,0],"Kilt"));
	items.types.pants.push(new iStats.fix([0,0,0,0,0,0,2,3,0],"Legplates"));
	//Boots
	items.types.boots.push(new iStats.fix([0,1,0,0,2,1,0,0,0],"Jaki-tabis"));
	items.types.boots.push(new iStats.fix([0,2,0,0,0,0,0,1,0],"Sneakers"));
	items.types.boots.push(new iStats.fix([0,0,0,1,0,0,2,2,0],"Greaves"));
	items.types.boots.push(new iStats.fix([0,1,0,1,0,0,2,3,1],"Dress shoes"));
	//Ring
	items.types.ring.push(new iStats.fix([0,0,0,3,0,0,1,0,0],"Bronze Ring"));
	items.types.ring.push(new iStats.fix([1,2,0,0,0,0,0,1,0],"Silver Ring"));
	items.types.ring.push(new iStats.fix([0,0,1,0,0,1,0,0,1],"Gold Ring"));
	items.types.ring.push(new iStats.fix([0,0,0,1,0,0,2,3,0],"Stone Band"));
	//Trinket

//------------
//Weapons
//------------
	//Swords
	items.types.weapon.push(new iStats.fix([3,4,0,0,2,0,0,0,0],"Dagger"));
	items.types.weapon.push(new iStats.fix([6,1,0,0,2,0,0,0,0],"Claymore"));
	items.types.weapon.push(new iStats.fix([0,6,0,0,2,0,0,0,0],"Katana"));
	items.types.weapon.push(new iStats.fix([3,3,0,0,2,1,0,0,0],"Schimitar"));
	//Hammers
	items.types.weapon.push(new iStats.fix([9,-1,0,0,0,0,0,-1,0],"Stone Maul"));
	items.types.weapon.push(new iStats.fix([7,0,0,1,0,0,0,0,0],"Mace"));
	items.types.weapon.push(new iStats.fix([3,2,0,0,0,0,0,0,2],"Cane"));
	//Axes
	items.types.weapon.push(new iStats.fix([2,5,0,0,0,2,0,0,0],"Hatchet"));
	items.types.weapon.push(new iStats.fix([3,3,0,0,1,2,0,0,0],"Cleaver"));
	items.types.weapon.push(new iStats.fix([5,2,0,0,0,2,0,0,0],"Double Axe"));

	items.types.get = function(level,slot,type){
		var ilvl,
			gear,
			rng = window.util.randomInterval,
			statArray = [],
			vary = window.stats.vary,
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
			typeArray = window.items.types[this.itemSlot];
			typeIndex = rng(0,window.items.types[this.itemSlot].length-1);
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
var tonsofitems = function(num){
	var num, i,obj;
	for(i=0;i<num;i++){
		obj = items.makeItem();
		console.log(obj.name);
	}
}