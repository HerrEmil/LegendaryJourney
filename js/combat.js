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
		lj.hero.stats.updateHealth();
	},
	unequip : function(item){
		var old;
		//Store the currently equipped item
		if(typeof item == 'string'){
			old = this.equipped[item]
		} else{
			old = this.equipped[item.slot];
		}
		if(old != null){
			this.inventory.push(old);
			this.equipped[old.slot] = null;
		}
		lj.hero.stats.updateHealth();
	},
	pickup : function(item){
		var current = this.equipped[item.slot],
			curVal,
			newVal;

		if(current != null){
			curVal = this.gscore(current);
			newVal = this.gscore(item);
		} else {
			this.equip(item);
			lj.battleLog.autoEquip(item.name, item.quality);
			lj.hero.updateCharPane()
			return true;
		}
		if(newVal >= curVal){
			this.equip(item);
			lj.battleLog.autoEquip(item.name, item.quality);
			lj.hero.updateCharPane()
			return true;
		} else {
			this.inventory.push(item);	
			lj.battleLog.acquire(item.name, item.quality);
			lj.hero.updateCharPane()
			return false;
		}
	},
	drop : function(item){
		var inventoryIndex;
		//Find it
		inventoryIndex = this.inventory.indexOf(item);
		if(inventoryIndex != -1){
			//Nuke it
			this.inventory.splice(inventoryIndex, 1);
		} else {
			//console.log("Item not in inventory Probably because you just picked it up");	
		}
	},
	gscore : function(item){
		//quick and dirty gear evaluator.
		var i,
			attrs = ["strength","agility","hp","hit","crit","armor","defense","magicfind"],
			score = 0;
		for(i=0;i<8;i++){
			score += item[attrs[i]];
		}
		return score;
	},
	clear : function(){
		lj.hero.gear.equipped = {
			"head" : null,
			"shoulder" : null,
			"chest" : null,
			"cloak" : null,
			"gloves" : null,
			"pants" : null,
			"boots" : null,
			"ring" : null,
			"weapon" : null
		};
		lj.hero.gear.inventory = [];
		lj.hero.stats.health = 100;
		lj.hero.stats.updateHealth();
		lj.hero.updateCharPane()
	}
}
lj.hero.stats = {
	self : {
		"strength" : 5,
		"agility" : 5,
		"luck" : 0,
		"hp" : 0,
		"hit" : 5,
		"crit" : 0,
		"armor" : 0,
		"defense" : 0,
		"magicfind" : 0
	},
	health : 100,
	updateHealth : function (){
		var percent,
			current =Math.floor(this.health),
			max = 100+(lj.hero.stats.get().hp)*5;
		percent = Math.round((current / max)*100)
		document.getElementById("healthBar").style.width=2*percent+"px";
		if(current==0){
			document.getElementById("stay").innerHTML = "DEAD";
		} else {
			document.getElementById("stay").innerHTML = current+"/"+max;
		}
	},
	heal : function(amount){
		var maxhp = 100+(lj.hero.stats.get().hp)*5;
		//Percentage based heal
		// this.health += maxhp * (amount)/100;
		// if(this.health > maxhp){
		// 	this.health = maxhp;
		// } 

		//Number based heal
		this.health += amount;
		if(this.health > maxhp){
			this.health = maxhp;
		} 

		this.updateHealth();
	}, //Rememer to keep track of decimals and keep pretty numbers
	hurt : function(amount){
		this.health -= amount;
		if(this.health <= 0){
			this.health = 0;
		};
		this.updateHealth();
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
lj.hero.fight = function (enemy){
	//Lets meet the contenders:
	var enemyHealth = enemy["hp"],
		heroHealth = Math.floor(lj.hero.stats.health),
		heroStats = lj.hero.stats.get(), //Snapshotting hero's stats so changing gear between strikes won't work
		herosTurn = true,
		lastAction,
		log = [],
		heroDamageTaken = 0;

	while(enemyHealth > 0 && heroHealth > 0){
		lastAction = null;
		if(herosTurn){
			lastAction = lj.hero.duel(enemy, heroStats);
			lastAction.actor = "hero";
			log.push(lastAction);
			enemyHealth -= lastAction.damage;
		} else {
			lastAction = lj.hero.duel(heroStats, enemy);
			lastAction.actor = "enemy";
			log.push(lastAction);
			heroHealth -= lastAction.damage;
			heroDamageTaken += lastAction.damage;
		}
		herosTurn = !herosTurn;
	};
	//this.stats.hurt(heroDamageTaken); (Handled by the combat)
	return {
		outcome: {actor:lastAction.actor,damage:heroDamageTaken,type:"victory"},
		log: log
	}
}
lj.hero.duel = function (enemy,friend){
	//Perform an attack, evaluate the damage and return the results
	var rng = lj.util.randomInterval,
		netHit = rng(1,1000)+friend["hit"]-enemy["defense"],
		damage,
		type;
	//Will you even hit?
	if(netHit<100){
		damage = 0;
		type = "miss";
		return {damage:damage,type:type};
	}
	//Alrighty, the hero connects. Damage time
	//Strength first (both min and max base damage)
	damage = friend["strength"];
	//Agility gives double max damage, but no min damage
	damage += rng(0,friend["agility"]*2);
	//Will you crit?
	if(rng(1,1000)>900){
		damage = Math.round(damage*(150+friend["crit"])/100);
		type = "crit"
	}
	//Enemy has armor :(
	//damage -= enemy["armor"]; //Flat reduction was too strong
	damage = Math.round(damage*(100-enemy["armor"])/100);
	if(!type){
		type = "hit";
	}
	//stalemate protection
	if(damage <= 0){damage=1};
	return {damage:damage,type:type};
}
//For lack of better, charPane goes here
lj.hero.updateCharPane = function(){
	
	var statStr = '',
		gearStr = '',
		gear = lj.hero.gear.equipped,
		hero = lj.hero.stats.get();
	//Update the Stat pane
	statStr += '<div class="header">Your current stats</div>';
	statStr += '<span class="stat">Strength:</span>'+hero.strength+'&nbsp&nbsp';
	statStr += '<span class="stat">Agility:</span>'+hero.agility+'&nbsp&nbsp<br>';
	//statStr += '<span class="stat">Luck:  &nbsp&nbsp'+hero.luck+'</span>';
	statStr += '<span class="stat">Hit Points:</span>'+hero.hp+'&nbsp&nbsp';
	statStr += '<span class="stat">Hit Increase:</span>'+hero.hit+'&nbsp&nbsp<br>';
	statStr += '<span class="stat">Crit Increase:</span>'+hero.crit+'&nbsp&nbsp';
	statStr += '<span class="stat">Armor:</span>'+hero.armor+'&nbsp&nbsp<br>';
	statStr += '<span class="stat">Defense:</span>'+hero.defense+'&nbsp&nbsp';
	statStr += '<span class="stat">Magic Find:</span>'+hero.magicfind+'&nbsp&nbsp';
	document.getElementById("stats").innerHTML = statStr;

	//Update the gear pane
	
	gearStr += '<span class="header">Your current gear</span><br>';
	if(gear.head !== null){
		gearStr += '<span class="slot head">Head:</span><span class="'+gear.head.quality+'">'+gear.head.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Head:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.shoulder !== null){
		gearStr += '<span class="slot shoulder">Shoulders:</span><span class="'+gear.shoulder.quality+'">'+gear.shoulder.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Shoulders:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.cloak !== null){
		gearStr += '<span class="slot back">Back:</span><span class="'+gear.cloak.quality+'">'+gear.cloak.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Back:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.chest !== null){
		gearStr += '<span class="slot chest">Chest:</span><span class="'+gear.chest.quality+'">'+gear.chest.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Chest:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.gloves !== null){
		gearStr += '<span class="slot gloves">Gloves:</span><span class="'+gear.gloves.quality+'">'+gear.gloves.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Gloves:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.pants !== null){
		gearStr += '<span class="slot pants">Pants:</span><span class="'+gear.pants.quality+'">'+gear.pants.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Pants:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.boots !== null){
		gearStr += '<span class="slot boots">Boots:</span><span class="'+gear.boots.quality+'">'+gear.boots.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Boots:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.ring !== null){
		gearStr += '<span class="slot ring">Ring:</span><span class="'+gear.ring.quality+'">'+gear.ring.name+'</span><br>';
	} else {
		gearStr += '<span class="slot">Ring:</span>&nbsp&nbsp&nbsp&nbsp&nbsp<br>';
	}
	if(gear.weapon !== null){
		gearStr += '<span class="slot weapon">Weapon:</span><span class="'+gear.weapon.quality+'">'+gear.weapon.name+'</span>';
	} else {
		gearStr += '<span class="slot">Weapon:</span>&nbsp&nbsp&nbsp&nbsp&nbsp';
	}

	document.getElementById("gear").innerHTML = gearStr;
}