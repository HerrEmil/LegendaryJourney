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
		"trinket" : [],
		"swords" : [],
		"hammers" : [],
		"axes" : []
	};

	iItems.item = function (slot, type, prefix, suffix, pstats) {
		'use strict';
		this.slot = slot;
		this.type = type;
		this.prefix = prefix;
		this.suffix = suffix;
		this.stats = pstats || [0,0,0,0,0,0,0,0,0];
		this.name = window.stats.prefixes[this.prefix].name +' '+type.name+' '+window.stats.suffixes[this.suffix].name;
	};
	iItems.makeItem = function(slot,stats){
		var rng = window.util.randomInterval,
			itemSlot,
			itemType,
			itemPrefix,
			itemSuffix,
			statArray,
			slotArray,
			slotIndex,
			typeArray,
			typeIndex;
		//If no specific slot is requested, get a random one.
		if(!slot){
			slotArray = _.keys(iItems.types);
			slotIndex = rng(0,slotArray.length-1);
			this.itemSlot = slotArray[slotIndex];
		} else {
			this.itemSlot = slot;
		}
		//console.log(this.itemSlot);
		
		// Check if a stat array was passed, else give an empty
		if(stats){
			this.statArray = stats;
		} else {
			this.statArray = [0,0,0,0,0,0,0,0,0];
		}
		//Based on the slot picked, get a random type
		typeArray = iItems.types[this.itemSlot];
		typeIndex = rng(0,iItems.types[this.itemSlot].length-1);
		this.itemType = typeArray[typeIndex];
		//console.log(this.itemType.name);

		//Getting prefix
		this.itemPrefix = rng(0,window.stats.prefixes.length-1);
		//console.log(window.stats.prefixes[this.itemPrefix].name);

		//Getting Suffix
		this.itemSuffix = rng(0,window.stats.suffixes.length-1);
		//console.log(window.stats.suffixes[this.itemSuffix].name);

		console.log(window.stats.prefixes[this.itemPrefix].name + ' ' +this.itemType.name+' '+window.stats.suffixes[this.itemSuffix].name);
		return new iItems.item(this.itemSlot,this.itemType,this.itemPrefix,this.itemSuffix,this.statArray);
	};

	//------------
//Item types
//------------
//------------
//Base Items
//------------
	//Head
	items.types.head.push(new iStats.fix([0,0,0,0,0,0,1,0,0],"Cap",1));
	items.types.head.push(new iStats.fix([0,1,0,1,0,1,0,0,0],"Hood",1));
	items.types.head.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Helmet",1));
	items.types.head.push(new iStats.fix([1,1,0,1,0,0,0,0,0],"Bandana",1));
	items.types.head.push(new iStats.fix([0,0,2,0,0,0,0,0,2],"Top Hat",1));
	//Shoulder
	items.types.shoulder.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Pauldrons",1));
	items.types.shoulder.push(new iStats.fix([0,0,0,0,2,2,0,0,0],"Shoulder Spikes",1));
	items.types.shoulder.push(new iStats.fix([2,0,0,0,0,0,1,1,0],"Pads",1));
	items.types.shoulder.push(new iStats.fix([0,0,0,0,0,0,0,0,1],"Parrot",1));
	//Chest
	items.types.chest.push(new iStats.fix([0,1,0,3,0,0,0,0,0],"Robe",1));
	items.types.chest.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Breastplate",1));
	items.types.chest.push(new iStats.fix([1,0,0,1,0,0,1,1,0],"Vest",1));
	items.types.chest.push(new iStats.fix([0,0,0,0,0,0,0,4,0],"Chainmail",1));
	//Cloak
	items.types.cloak.push(new iStats.fix([0,0,3,0,0,0,0,0,0],"Cape",1));
	items.types.cloak.push(new iStats.fix([0,0,0,0,0,0,0,0,2],"Backpack",1));
	items.types.cloak.push(new iStats.fix([0,2,0,0,0,2,0,0,0],"Scarf",1));
	//Gloves
	items.types.gloves.push(new iStats.fix([0,0,0,0,0,0,2,2,0],"Gauntlets",1));
	items.types.gloves.push(new iStats.fix([0,2,0,0,0,0,1,1,0],"Gloves",1));
	items.types.gloves.push(new iStats.fix([3,0,0,0,0,2,0,0,0],"Brass Knuckles",1));
	//Pants
	items.types.pants.push(new iStats.fix([1,1,1,1,0,0,0,0,0],"Slacks",1));
	items.types.pants.push(new iStats.fix([0,2,0,0,0,1,0,0,1],"Dress Pants",1));
	items.types.pants.push(new iStats.fix([1,0,0,0,2,0,0,0,0],"Kilt",1));
	items.types.pants.push(new iStats.fix([0,0,0,0,0,0,2,3,0],"Legplates",1));
	//Boots
	items.types.boots.push(new iStats.fix([0,1,0,0,2,1,0,0,0],"Jaki-tabis",1));
	items.types.boots.push(new iStats.fix([0,2,0,0,0,0,0,1,0],"Sneakers",1));
	items.types.boots.push(new iStats.fix([0,0,0,1,0,0,2,2,0],"Greaves",1));
	items.types.boots.push(new iStats.fix([0,1,0,1,0,0,2,3,1],"Dress shoes",1));
	//Ring
	items.types.ring.push(new iStats.fix([0,0,0,3,0,0,1,0,0],"Bronze Ring",1));
	items.types.ring.push(new iStats.fix([1,2,0,0,0,0,0,1,0],"Silver Ring",1));
	items.types.ring.push(new iStats.fix([0,0,1,0,0,1,0,0,1],"Gold Ring",1));
	items.types.ring.push(new iStats.fix([0,0,0,1,0,0,2,3,0],"Stone Band",1));
	//Trinket

//------------
//Weapons
//------------
	//Swords
	items.types.swords.push(new iStats.fix([3,4,0,0,2,0,0,0,0],"Dagger",1));
	items.types.swords.push(new iStats.fix([6,1,0,0,2,0,0,0,0],"Claymore",1));
	items.types.swords.push(new iStats.fix([0,6,0,0,2,0,0,0,0],"Katana",1));
	items.types.swords.push(new iStats.fix([3,3,0,0,2,1,0,0,0],"Schimitar",1));
	//Hammers
	items.types.hammers.push(new iStats.fix([9,-1,0,0,0,0,0,-1,0],"Stone Maul",1));
	items.types.hammers.push(new iStats.fix([7,0,0,1,0,0,0,0,0],"Mace",1));
	items.types.hammers.push(new iStats.fix([3,2,0,0,0,0,0,0,2],"Cane",1));
	//Axes
	items.types.axes.push(new iStats.fix([2,5,0,0,0,2,0,0,0],"Hatchet",1));
	items.types.axes.push(new iStats.fix([3,3,0,0,1,2,0,0,0],"Cleaver",1));
	items.types.axes.push(new iStats.fix([5,2,0,0,0,2,0,0,0],"Double Axe",1));
}());