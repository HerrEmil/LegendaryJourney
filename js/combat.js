window.lj = lj || {};

lj.hero.gear = {
	equipped : {
		"head" : null,
		"shoulder" : null,
		"chest" : null,
		"cloak" : null,
		"gloves" : null,
		"pants" : null,
		"boots" : null,
		"ring" : null,
		"weapon" : null
	},
	inventory : [],
	equip : function(item){
		//Store the currently equipped item
		this.unequip(item.slot);
		//equip the new
		this.equipped[item.slot] = item;

		//and remove from inventory
		this.drop(item);
	},
	unequip : function(item){
		var old;
		//Store the currently equipped item
		if(typeof item == 'string'){
			old = this.equipped[item]
		} else{
			old = this.equipped[item.slot];
		}
		if(old != null){this.pickup(old);
		this.equipped[old.slot] = null;}
	},
	pickup : function(item){
		this.inventory.push(item);
	},
	drop : function(item){
		var inventoryIndex;
		//Find it
		inventoryIndex = this.inventory.indexOf(item);
		if(inventoryIndex != -1){
			//Nuke it
			this.inventory.splice(inventoryIndex, 1);
		} else {
			console.log("Item not in inventory");	
		}
	},
	fill : function(j){
		var i;
		for(i=0;i<j;i++){
			this.pickup(lj.items.makeItem());
		}
	},
	test : function(j){
		this.fill(j);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		lj.hero.gear.equip(lj.hero.gear.inventory[0]);
		console.log(lj.hero.gear.inventory);
		console.log(lj.hero.gear.equipped);
	}
}
lj.hero.stats = {
	self : {
		"strength" : 10,
		"agility" : 10,
		"luck" : 0,
		"hp" : 100,
		"hit" : 5,
		"crit" : 10,
		"armor" : 0,
		"defense" : 0,
		"magicfind" : 0
	},
	buff : function(stat, value){
		this.self[stat] += value;
	},
	get : function(){
		var statObj = JSON.parse(JSON.stringify(this.self)),
			slots = ["head","shoulder","chest","cloak","gloves","pants","boots","ring","weapon"],
			attrs = ["strength","agility","luck","hp","hit","crit","armor","defense","magicfind"],
			i,
			j;

		for (i = 0; i<slots.length;i++){
			for(j = 0;j<attrs.length;j++){
				if(lj.hero.gear.equipped[slots[i]] != null){
					statObj[attrs[j]] += lj.hero.gear.equipped[slots[i]][attrs[j]];
					// console.log(statObj[attrs[j]]);
				};
			};
		};
		return statObj;
	}
}