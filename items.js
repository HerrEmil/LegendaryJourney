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

	iItems.item = function (slot, type, prefix, suffix) {
		'use strict';
		this.slot = slot;
		this.type = type;
		this.prefix = prefix;
		this.suffix = suffix;
		this.name = prefix.name +' '+type.name+' '+suffix.name;
		//Set the stats of the item based on type, prefix and affix
		window.stats.init(this);
		this.strength = this.prefix[0] + this.type[0] + this.suffix[0];
		this.agility = this.prefix[1] + this.type[1] + this.suffix[1];
		this.luck = this.prefix[2] + this.type[2] + this.suffix[2];
		this.hp = this.prefix[3] + this.type[3] + this.suffix[3];
		this.hit = this.prefix[4] + this.type[4] + this.suffix[4];
		this.crit = this.prefix[5] + this.type[5] + this.suffix[5];
		this.armor = this.prefix[6] + this.type[6] + this.suffix[6];
		this.defense = this.prefix[7] + this.type[7] + this.suffix[7];
		this.magicfind = this.prefix[8] + this.type[8] + this.suffix[8];

	};
	iItems.makeItem = function(level,slot){
		var rng = window.util.randomInterval,
			itemSlot,
			itemType,
			itemPrefix,
			itemSuffix,
			slotArray,
			slotIndex,
			typeArray,
			typeIndex,
			ilvl;
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
		//console.log(this.itemSlot);
		
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
		return new iItems.item(this.itemSlot,this.itemType,this.itemPrefix,this.itemSuffix);
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