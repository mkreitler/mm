mm.scenes.practice = {
	SPACING_FACTOR_Y: 0.05,
	SELECTED_CHAR: '*',
	DRAG_ALPHA: 0.33,
	UI_GROUP_Y_FACTOR: (1.0 / 20.0),
	NUMBER_LINE_MAX_UNIT: 40,
	NUMBER_LINE_MIN_UNIT: 10,
	NUMBER_LINE_HEIGHT: (1 / 7),
	SCENE_BACK_COLOR: "#888888",
	UI_GROUP_COLOR: "#CCCCCC",

	uiGroup: null,
	title: null,
	centerBand: null,
	labels: {value: null, rowFactor: null, colFactor: null},

	roomGroup: null,
	room: null,

	roomTileMap: null,

	adventurerGroup: null,
	adventureTileMap: null,

	bUserDragging: false,
	dragStartRow: -1,
	dragStartCol: -1,
	dragRow: -1,
	dragCol: -1,

	// Scene Interface ////////////////////////////////////////////////////////
	create: function() {
		this.createAdventurerElements();
		this.createRoomElements();
		this.createUiElements();

		this.end();
	},

	start: function() {
		mm.game.stage.backgroundColor = this.SCENE_BACK_COLOR;
		mm.game.input.onTap.add(this.onTap, this);
		this.enable(true);
		this.hideLabels();
		mm.broadcast('addKeyAction', {enter: this.onRegenerate.bind(this)});
	},

	end: function() {
		this.enable(false);
		mm.game.input.onTap.remove(this.onTap, this);
		mm.broadcast('removeKeyAction', {enter: this.onRegenerate.bind(this)});
	},

	update: function() {
		if (this.bUserDragging) {
			this.dragRow = this.room.getRowFromScreen(mm.game.input.activePointer.y);
			this.dragCol = this.room.getColFromScreen(mm.game.input.activePointer.x);

			this.dragRow = Math.min(this.dragRow, this.room.height - 1);
			this.dragRow = Math.max(this.dragRow, 0);

			this.dragCol = Math.min(this.dragCol, this.room.width - 1);
			this.dragCol = Math.max(this.dragCol, 0);

			// this.title.text = "(" +
			// 			 Math.min(this.dragStartCol, this.dragCol) + ", " +
			// 			 Math.min(this.dragStartRow, this.dragRow) + ") to (" +
			// 			 Math.max(this.dragStartCol, this.dragCol) + ", " +
			// 			 Math.max(this.dragStartRow, this.dragRow) + ")";
		}
	},

	render: function(ctxt) {
		if (this.bUserDragging) {
			this.drawDragArea(ctxt);
			this.drawNumberLine(ctxt);
		}
	},

	// Implementation /////////////////////////////////////////////////////////
	drawDragArea: function(ctxt) {
		var minRow = Math.min(this.dragStartRow, this.dragRow);
		var minCol = Math.min(this.dragStartCol, this.dragCol);
		var maxRow = Math.max(this.dragStartRow, this.dragRow);
		var maxCol = Math.max(this.dragStartCol, this.dragCol);
		var cornerX = this.room.cornerX();
		var cornerY = this.room.cornerY();
		var tileSize = this.room.tileSize();

		ctxt.fillStyle = this.room.areaClear(minRow, minCol, maxRow, maxCol) ? "green" : "red";
		ctxt.globalAlpha = this.DRAG_ALPHA;

		ctxt.fillRect(cornerX + minCol * tileSize,
					  cornerY + minRow * tileSize,
					  (maxCol - minCol + 1) * tileSize,
					  (maxRow - minRow + 1) * tileSize);

		ctxt.globalAlpha = 1.0;
	},

	drawNumberLine: function(ctxt) {
		var i = 0;
		var j = 0;
		var x = 0;
		var y = 0;

		var dCol = Math.abs(this.dragStartCol - this.dragCol) + 1;
		var dRow = Math.abs(this.dragStartRow - this.dragRow) + 1;
		var total = dCol * dRow;

		var maxWidth = Math.round(mm.game.width * 8 / 10); // <-- TODO: make this a constant
		var unit = Math.min(unit, this.NUMBER_LINE_MAX_UNIT);

		unit = this.NUMBER_LINE_MIN_UNIT;

		var xRange = total; // Math.floor(total / 10 + 0.9999) * 10;
		var dx = xRange * unit;

		ctxt.fillStyle = "green";
		x = Math.round(mm.game.width / 2 - dx / 2) + Math.round(unit / 2);
		y = Math.round(mm.game.height * this.NUMBER_LINE_HEIGHT);	// <-- TODO: make this a constant
		ctxt.fillRect(x, y - Math.round(unit / 2), dx, unit);

		y -= Math.round(unit / 2);
		this.labels.value.text = " = " + total;
		this.labels.value.y = y + Math.round(unit / 2) - this.uiGroup.position.y;
		this.labels.value.x = x + dx - this.uiGroup.position.x;

		this.labels.colFactor.text = "" + dCol;
		this.labels.colFactor.y = this.labels.value.y - unit;
		this.labels.colFactor.x = x + Math.round(dCol * unit / 2) - this.uiGroup.position.x;

		this.labels.rowFactor.text = "x" + dRow;
		this.labels.rowFactor.y = this.labels.value.y + unit;
		this.labels.rowFactor.x = Math.floor(x + dx / 2 - this.uiGroup.position.x);

		for (i=0; i<dRow; ++i) {
			ctxt.strokeStyle = "#004400";
			for (j=0; j<dCol; ++j) {
				ctxt.strokeRect(x + j * unit, y, unit, unit);
			}

			ctxt.strokeStyle = "white";
			ctxt.strokeRect(x, y, unit * dCol, unit);
			x += unit * dCol;
		}
	},

	onRegenerate: function() {
		mm.assert(this.room, "(regenerate) invalid room");
		this.room.clear();
		this.room.generate();
	},

	createRoomElements: function() {
		var centerImage = null;

		this.roomGroup = mm.game.add.group();

		this.roomGroup.inputEnableChildren = true;
		this.roomGroup.onChildInputUp.add(this.onChildInputUp, this);
		this.roomGroup.onChildInputDown.add(this.onChildInputDown, this);
		this.roomGroup.onChildInputOver.add(this.onChildInputOver, this);
		this.roomGroup.onChildInputOut.add(this.onChildInputOut, this);

		this.centerBand = mm.game.make.bitmapData(mm.width, Math.floor(2 * mm.height / 5));
		this.centerBand.canvas.getContext('2d').fillStyle = this.UI_GROUP_COLOR;
		this.centerBand.canvas.getContext('2d').fillRect(0, 0, this.centerBand.width, this.centerBand.height);
		centerImage = mm.game.add.image(this.centerBand.width, this.centerBand.height, this.centerBand);
		centerImage.anchor.x = 0.5;
		centerImage.anchor.y = 0.5;
		centerImage.position.x = 0; //mm.width / 2;
		centerImage.position.y = 0; // mm.height / 2;
		this.roomGroup.add(centerImage);

		this.roomGroup.position.x = mm.width / 2;
		this.roomGroup.position.y = mm.height - this.centerBand.height;

		this.room = new Room(this.roomGroup);
		this.room.setScale(2.0, 2.0);
	},

	createAdventurerElements: function() {
		this.adventurerGroup = mm.game.add.group();
	},

	createUiElements: function() {
		this.uiGroup = mm.game.add.group();
		this.uiGroup.position.x = mm.width / 2;
		this.uiGroup.position.y = Math.round(mm.height * this.UI_GROUP_Y_FACTOR);

		this.title = mm.game.make.bitmapText(0, 0, 'charybdis_72','Practice Mode', 72);
		this.title.anchor.x = 0.5;
		this.title.anchor.y = 0.5;
		this.uiGroup.add(this.title);

		this.labels.value = mm.game.make.bitmapText(0, 0, 'charybdis_72', '0', 36);
		this.labels.value.anchor.x = 0;
		this.labels.value.anchor.y = 0.5;
		this.uiGroup.add(this.labels.value);

		this.labels.colFactor = mm.game.make.bitmapText(0, 0, 'charybdis_72', '0', 36);
		this.labels.colFactor.anchor.x = 0.5;
		this.labels.colFactor.anchor.y = 1;
		this.uiGroup.add(this.labels.colFactor);

		this.labels.rowFactor = mm.game.make.bitmapText(0, 0, 'charybdis_72', '0', 36);
		this.labels.rowFactor.anchor.x = 0;
		this.labels.rowFactor.anchor.y = 0;
		this.uiGroup.add(this.labels.rowFactor);
	},

	enable: function(bEnable) {
		var i = 0;

		this.uiGroup.visible = bEnable;
		this.uiGroup.exists = bEnable;

		this.roomGroup.visible = bEnable;
		this.roomGroup.exists = bEnable;

		this.adventurerGroup.visible = bEnable;
		this.adventurerGroup.exists = bEnable;
	},

	showLabels: function() {
		var key = null;

		for (key in this.labels) {
			this.labels[key].visible = true;
			this.labels[key].exists = true;
		}
	},

	hideLabels: function() {
		var key = null;

		for (key in this.labels) {
			this.labels[key].visible = false;
			this.labels[key].exists = false;
		}
	},

/////////////////////////////////////////////////////////////////////////////////////////
//   .oooooo.             oooo  oooo   .o8                           oooo                 
//  d8P'  `Y8b            `888  `888  "888                           `888                 
// 888           .oooo.    888   888   888oooo.   .oooo.    .ooooo.   888  oooo   .oooo.o 
// 888          `P  )88b   888   888   d88' `88b `P  )88b  d88' `"Y8  888 .8P'   d88(  "8 
// 888           .oP"888   888   888   888   888  .oP"888  888        888888.    `"Y88b.  
// `88b    ooo  d8(  888   888   888   888   888 d8(  888  888   .o8  888 `88b.  o.  )88b 
//  `Y8bood8P'  `Y888""8o o888o o888o  `Y8bod8P' `Y888""8o `Y8bod8P' o888o o888o 8""888P' 
/////////////////////////////////////////////////////////////////////////////////////////

	// Input Handlers /////////////////////////////////////////////////////////
	onTap: function(image) {
		this.onRegenerate();
	},

	onChildInputUp: function(sprite, pointer) {
		this.bUserDragging = false;
		this.title.text = "Practice Mode";
		this.hideLabels();
	},

	onChildInputDown: function(sprite, pointer) {
		this.bUserDragging = true;

		if (this.room) {
			this.dragStartRow = this.room.getRowFromScreen(pointer.y);
			this.dragStartCol = this.room.getColFromScreen(pointer.x);

			if (this.dragStartRow < 0 ||
				this.dragStartRow >= this.room.height ||
				this.dragStartCol < 0 ||
				this.dragStartCol >= this.room.width) {
				this.bUserDragging = false;
			}
		}

		if (this.bUserDragging) {
			this.showLabels();
		}
	},

	onChildInputOver: function(sprite, pointer) {
	},

	onChildInputOut: function(sprite, pointer) {
	},
};

/////////////////////////////////////////////////////////////////////////////////////////////
// ooooo   ooooo oooooooooooo ooooo        ooooooooo.   oooooooooooo ooooooooo.    .oooooo..o 
// `888'   `888' `888'     `8 `888'        `888   `Y88. `888'     `8 `888   `Y88. d8P'    `Y8 
//  888     888   888          888          888   .d88'  888          888   .d88' Y88bo.      
//  888ooooo888   888oooo8     888          888ooo88P'   888oooo8     888ooo88P'   `"Y8888o.  
//  888     888   888    "     888          888          888    "     888`88b.         `"Y88b 
//  888     888   888       o  888       o  888          888       o  888  `88b.  oo     .d8P 
// o888o   o888o o888ooooood8 o888ooooood8 o888o        o888ooooood8 o888o  o888o 8""88888P'  
/////////////////////////////////////////////////////////////////////////////////////////////
// TODO: move these into their own classes.
// ROOM CARD //////////////////////////////////////////////////////////////////
function Room(group) {
	// iType is the index into the row of terrain tiles
	// displayed by this card.
	this.iType	= 0;

	this.width  = 0;
	this.height = 0;

	this.initObjectsMap(group);
	this.initCreaturesMap(group);

	this.generate();

	this.enable(false);
};

Room.prototype.initObjectsMap = function(group) {
	var key = null;
	var iRow = 0;
	var iCol = 0;

	this.group 	= group;
	this.map 	= mm.game.add.tilemap();
	this.layers = {floor: null,
				   shadows: null,
				   objects: null,
				   walls: null};

	this.map.addTilesetImage('world', 'world', mm.TILE_SIZE, mm.TILE_SIZE);

	for (key in this.layers) {
		if (key === 'floor') {
			this.layers[key] = this.map.create(key,
											   this.MAX_SIZE,
											   this.MAX_SIZE,
											   mm.TILE_SIZE,
											   mm.TILE_SIZE);
		}
		else {
			this.layers[key] = this.map.createBlankLayer(key,
											   			 this.MAX_SIZE,
											   			 this.MAX_SIZE,
											   			 mm.TILE_SIZE,
											   			 mm.TILE_SIZE);
		}

		this.layers[key].anchor.x = 0.5;
		this.layers[key].anchor.y = 0.5;
		this.group.add(this.layers[key]);
	}
};

Room.prototype.tileSize = function() {
	return mm.TILE_SIZE * this.group.scale.x
};

Room.prototype.initCreaturesMap = function(group) {
	this.creatureMap = mm.game.add.tilemap();

	this.creatureMap.addTilesetImage('creatures', 'creatures', mm.TILE_SIZE, mm.TILE_SIZE);

	this.creatureLayer = this.creatureMap.create('creatures',
												 this.MAX_SIZE,
												 this.MAX_SIZE,
												 mm.TILE_SIZE,
												 mm.TILE_SIZE);

	this.creatureLayer.anchor.x = 0.5;
	this.creatureLayer.anchor.y = 0.5;
	this.group.add(this.creatureLayer);
};

Room.prototype.setScale = function(scaleX, scaleY) {
	this.group.scale.set(scaleX, scaleY);
};

Room.prototype.areaClear = function(minRow, minCol, maxRow, maxCol) {
	var key = null;
	var layer = null;
	var iRow = -1;
	var iCol = -1;
	var bClear = true;
	var rowOffset = Math.round((this.map.height - this.height) / 2);
	var colOffset = Math.round((this.map.width - this.width) / 2);

	for (key in this.layers) {
		layer = this.layers[key];

		mm.assert(layer, "Room::areaClear: empty layer");

		for (iRow=minRow; bClear && iRow<=maxRow; ++iRow) {
			for (iCol=minCol; iCol<=maxCol; ++iCol) {
				if (key !== "floor") {
					if (this.map.getTile(iCol + colOffset, iRow + rowOffset, this.layers[key])) {
						bClear = false;
						break;
					}
				}
			}
		}
	}

	return bClear;
};

Room.prototype.cornerX = function() {
	return this.group.position.x - Math.floor(this.layers.floor.anchor.x * this.width) * this.tileSize();
};

Room.prototype.cornerY = function() {
	return this.group.position.y - Math.floor(this.layers.floor.anchor.y * this.height) * this.tileSize();
};

Room.prototype.getRowFromScreen = function(screenY) {
	mm.assert(this.layers.floor, "Room::getRowFromScreen: no floor layer");

	var yCorner = this.cornerY();

	return Math.floor(this.layers.floor.getTileY(screenY - yCorner) / this.group.scale.y);
};

Room.prototype.getColFromScreen = function(screenX) {
	mm.assert(this.layers.floor, "Room::getColFromScreen: no floor layer");

	var xCorner = this.cornerX();

	return Math.floor(this.layers.floor.getTileX(screenX - xCorner) / this.group.scale.x);
};

Room.prototype.clear = function() {
	var iRow = 0;
	var iCol = 0;
	var key = 0;

	for (iRow=0; iRow<this.MAX_SIZE; ++iRow) {
		for (iCol=0; iCol<this.MAX_SIZE; ++iCol) {
			for (key in this.layers) {
				this.map.removeTile(iRow, iCol, this.layers[key]);
			}
		}
	}
};

Room.prototype.generate = function() {
	var nTilesPerRow = 0;
	var tileX = 0;
	var tileY = 0;
	var iTile = 0;

	this.iType 	= Math.floor(Math.random() * this.NUM_TYPES);
	this.width 	= Math.floor(Math.random() * (this.MAX_SIZE - this.MIN_SIZE)) + this.MIN_SIZE;
	this.height = Math.floor(Math.random() * (this.MAX_SIZE - this.MIN_SIZE)) + this.MIN_SIZE;

	nTilesPerRow = mm.game.cache.getImage('world').width / mm.TILE_SIZE;
	mm.assert(nTilesPerRow === Math.round(nTilesPerRow), "(Room.generate) invalid tileImage");

	for (iRow=0; iRow<this.height; ++iRow) {
		tileY = this.MAX_SIZE / 2 - Math.floor(this.height / 2) + iRow;

		for (iCol=0; iCol<this.width; ++iCol) {
			tileX = this.MAX_SIZE / 2 - Math.floor(this.width / 2) + iCol;

			// Lay floor tiles.
			iTile = this.FLOOR_TILES[Math.floor(Math.random() * this.FLOOR_TILES.length)];
			this.map.putTile(this.iType * nTilesPerRow + iTile, tileX, tileY, this.layers.floor);

			// Finally, place the walls.
			if (iRow === 0) {
				// Top...
				if (iCol === 0) {
					// ...left corner.
					iTile = this.WALL_TILES[0][0];
				}
				else if (iCol === this.width - 1) {
					// ...right corner.
					iTile = this.WALL_TILES[0][2];
				}
				else {
					// ...row, mid.
					iTile = this.WALL_TILES[0][1];
				}
			}
			else if (iRow === this.height - 1) {
				if (iCol === 0) {
					// ...left corner.
					iTile = this.WALL_TILES[2][0];
				}
				else if (iCol === this.width - 1) {
					// ...right corner.
					iTile = this.WALL_TILES[2][2];
				}
				else {
					// ...row, mid.
					iTile = this.WALL_TILES[2][1];
				}
			}
			else {
				if (iCol === 0) {
					// ...left corner.
					iTile = this.WALL_TILES[1][0];
				}
				else if (iCol === this.width - 1) {
					// ...right corner.
					iTile = this.WALL_TILES[1][2];
				}
				else {
					// ...row, mid.
					iTile = -1;
				}
			}

			if (iTile >= 0) {
				this.map.putTile(this.iType * nTilesPerRow + iTile, tileX, tileY, this.layers.walls);
			}

			if (tileX > 0 && tileX < this.width - 1 &&
				tileY > 0 && tileY < this.height - 1) {
				if (iTile < 0 && Math.floor(Math.random() * 100) < this.OBJECT_SPAWN_PERCENT) {
					iTile = this.OBJECT_TILES[Math.floor(Math.random() * this.OBJECT_TILES.length)];
					this.map.putTile(iTile.row * nTilesPerRow + iTile.col, tileX, tileY, this.layers.objects);
				}
			}
		}
	}
};

Room.prototype.enable = function(bEnable) {
	this.group.visible = bEnable;
	this.group.exists  = bEnable;
};

Room.prototype.moveTo = function(x, y) {
	this.group.position.x = x;
	this.group.position.y = y;
};

Room.prototype.moveBy = function(dx, dy) {
	this.group.position.x += dx;
	this.group.position.y += dy;
};

Room.prototype.MAX_SIZE = 12;	// Why do multiplication tables go up to 12?
Room.prototype.MIN_SIZE = 3;

Room.prototype.NUM_TYPES = 23;

Room.prototype.WALL_TILES = [
	[16, 11, 17],
	[14, 00, 14],
	[18, 11, 19]
];

Room.prototype.OBJECT_SPAWN_PERCENT = 1;

Room.prototype.FLOOR_TILES = [3, 4, 5, 6];

Room.prototype.OBJECT_TILES = [
	{name: "tombstone", 	row: 0, 	col: 28},
	{name: "chest", 		row: 3, 	col: 31},
	{name: "bookcase", 		row: 4, 	col: 30},
	{name: "table", 		row: 4, 	col: 32},
	{name: "chair", 		row: 4, 	col: 34},
	{name: "throne", 		row: 4, 	col: 35},
	{name: "weaponRack",	row: 4, 	col: 37},
	{name: "cauldron",		row: 5, 	col: 30},
	{name: "statue01",		row: 5, 	col: 31},
	{name: "statue02",		row: 5, 	col: 32},
	{name: "statue03",		row: 5, 	col: 33},
	{name: "statue04",		row: 5, 	col: 34},
	{name: "urn01",			row: 5, 	col: 39},
	{name: "urn02",			row: 6, 	col: 36},
	{name: "urn03",			row: 6, 	col: 39},
	{name: "urn04",			row: 7, 	col: 36},
	{name: "urn05",			row: 7, 	col: 39},
	{name: "altar01",		row: 7, 	col: 28},
	{name: "altar02",		row: 7, 	col: 30},
	{name: "altar03",		row: 7, 	col: 31},
	{name: "altar04",		row: 7, 	col: 32},
	{name: "altar05",		row: 7, 	col: 33},
	{name: "altar06",		row: 7, 	col: 34},
	{name: "altar07",		row: 7, 	col: 35},
	{name: "spikes",		row: 6, 	col: 28},
	{name: "cage",			row: 8, 	col: 28},
	{name: "pool",			row: 8, 	col: 32},
	{name: "well",			row: 8, 	col: 33},
	{name: "tome01",		row: 8, 	col: 36},
	{name: "tome02",		row: 8, 	col: 37},
	{name: "tome03",		row: 8, 	col: 38},
	{name: "tome03",		row: 8, 	col: 39},
	{name: "coffin01",		row: 3, 	col: 35},
	{name: "coffin02",		row: 3, 	col: 37},
	{name: "barrel",		row: 3, 	col: 38},
	{name: "bucket",		row: 3, 	col: 40},
];

// ADVENTURER CARD ////////////////////////////////////////////////////////////
function Adventurer() {

};
