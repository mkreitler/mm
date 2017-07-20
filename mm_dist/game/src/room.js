// ROOM CARD //////////////////////////////////////////////////////////////////
// ooooooooo.                                         
// `888   `Y88.                                       
//  888   .d88'  .ooooo.   .ooooo.  ooo. .oo.  .oo.   
//  888ooo88P'  d88' `88b d88' `88b `888P"Y88bP"Y88b  
//  888`88b.    888   888 888   888  888   888   888  
//  888  `88b.  888   888 888   888  888   888   888  
// o888o  o888o `Y8bod8P' `Y8bod8P' o888o o888o o888o 
//
// Models a single room in the dungeon.
//
///////////////////////////////////////////////////////////////////////////////                                                   

function Room(group, offsetX, offsetY) {
	// iType is the index into the row of terrain tiles
	// displayed by this card.
	this.iType	= 0;

	this.width  = 0;
	this.height = 0;

	this.parentGroup = group;
	this.group = mm.game.add.group();
	this.parentGroup.add(this.group);

	this.group.position.x = offsetX;
	this.group.position.y = offsetY;

	this.group.inputEnableChildren = true;
	this.group.onChildInputUp.add(mm.scenes.practice.onRoomInputUp, this);
	this.group.onChildInputDown.add(mm.scenes.practice.onRoomInputDown, this);
	this.group.onChildInputOver.add(mm.scenes.practice.onRoomInputOver, this);
	this.group.onChildInputOut.add(mm.scenes.practice.onRoomInputOut, this);

	this.scaleUpTween = null;
	this.scaleDownTween = null;
	this.bHasFocus = false;
	this.bUserDragging = false;

	this.initObjectsMap();
	this.initCreaturesMap();

	this.generate();


//	this.enable(false);
};

Room.prototype.initObjectsMap = function() {
	var key = null;
	var iRow = 0;
	var iCol = 0;

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

		this.layers[key].data = this;

		this.layers[key].anchor.x = 0.5;
		this.layers[key].anchor.y = 0.5;
		this.layers[key].position.x = Math.round(this.group.width / 2);
		this.layers[key].position.y = Math.round(this.group.height / 2);
		this.group.add(this.layers[key]);

	    this.scaleDownTween = mm.game.add.tween(this.group.scale).to({x: this.SCALE_SMALL, y: this.SCALE_SMALL}, this.TWEEN_TIME, Phaser.Easing.Cubic.InOut, false);
	    this.scaleDownTween.onComplete.add(this.onScaleDownComplete, this);

	    this.scaleUpTween = mm.game.add.tween(this.group.scale).to({x: this.SCALE_FULL, y: this.SCALE_FULL}, this.TWEEN_TIME, Phaser.Easing.Cubic.InOut, false);
	    this.scaleUpTween.onComplete.add(this.onScaleUpComplete, this);

	    this.moveTween = mm.game.add.tween(this.group.position);
	    this.defaultY = this.group.position.y;
	    this.moveTween.to({x: 0, y: this.defaultY}, this.TWEEN_TIME, Phaser.Easing.Cubic.InOut, true);
	}
};

Room.prototype.scaleDown = function() {
    this.scaleDownTween.start();
    Room.prototype.INPUT_ENABLED = false;
    this.onLostFocus();
};

Room.prototype.scaleUp = function() {
	this.parentGroup.bringToTop(this.group);
    this.scaleUpTween.start();
};

Room.prototype.setX = function(newX) {
	this.group.position.x = newX;
};

Room.prototype.getPixelWidth = function(bSmall) {
	return bSmall ? Math.round(this.width * this.SCALE_SMALL * mm.TILE_SIZE) : Math.round(this.width * this.SCALE_FULL * mm.TILE_SIZE);
};

Room.prototype.tweenToX = function(x, bCenterVertically) {
	this.moveTween.stop();
	this.moveTween.updateTweenData('vEnd', {x: x, y: bCenterVertically ? Math.round(mm.game.height / 2) : this.defaultY});
	this.moveTween.start();
};

Room.prototype.onScaleDownComplete = function() {
};

Room.prototype.onScaleUpComplete = function() {
	Room.prototype.INPUT_ENABLED = true;
	this.onGainedFocus();
};

Room.prototype.tileSize = function() {
	return mm.TILE_SIZE * this.group.scale.x
};

Room.prototype.contains = function(x, y) {
	var row = this.getRowFromScreen(y);
	var col = this.getColFromScreen(x);
	var bContains = this.map.getTile(col, row, this.layers['floor']) !== null;

	return bContains;
};

Room.prototype.initCreaturesMap = function() {
	this.creatureMap = mm.game.add.tilemap();

	this.creatureMap.addTilesetImage('creatures', 'creatures', mm.TILE_SIZE, mm.TILE_SIZE);

	this.creatureLayer = this.creatureMap.create('creatures',
												 this.MAX_SIZE,
												 this.MAX_SIZE,
												 mm.TILE_SIZE,
												 mm.TILE_SIZE);
	this.creatureLayer.data = this;

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
	return this.parentGroup.position.x + this.group.position.x - Math.floor(this.layers.floor.anchor.x * this.width) * this.tileSize() + Math.floor(mm.width / 2);
};

Room.prototype.cornerY = function() {
	return this.parentGroup.position.y + this.group.position.y - Math.floor(this.layers.floor.anchor.y * this.height) * this.tileSize();
};

Room.prototype.getRowFromScreen = function(screenY) {
	var rowOffset = Math.round((this.map.height - this.height) / 2);

	mm.assert(this.layers.floor, "Room::getRowFromScreen: no floor layer");

	var yCorner = this.cornerY();

	return this.layers.floor.getTileY(Math.floor((screenY - yCorner) / this.group.scale.y)) + rowOffset;
};

Room.prototype.getColFromScreen = function(screenX) {
	var colOffset = Math.round((this.map.width - this.width) / 2);

	mm.assert(this.layers.floor, "Room::getColFromScreen: no floor layer");

	var xCorner = this.cornerX();

	return this.layers.floor.getTileX(Math.floor((screenX - xCorner) / this.group.scale.x)) + colOffset;
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

Room.prototype.debugDraw = function(ctxt) {
	ctxt.fillStyle = "red";
	ctxt.fillRect(this.cornerX(), this.cornerY(), 5, 5);
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

// Input Handlers /////////////////////////////////////////////////////////
Room.prototype.onGainedFocus = function() {
	mm.broadcast("RoomGainedFocus", this);
	this.bHasFocus = true;
};

Room.prototype.onLostFocus = function() {
	this.bHasFocus = false;
};

Room.prototype.INPUT_ENABLED = true;

Room.prototype.USER_DRAG_INFO = {
	dragStartCol: -1,
	dragStartRow: -1,
	dragCol: -1,
	dragRow: -1
};

// Constants //////////////////////////////////////////////////////////////////
//   .oooooo.                                      .                             .            
//  d8P'  `Y8b                                   .o8                           .o8            
// 888           .ooooo.  ooo. .oo.    .oooo.o .o888oo  .oooo.   ooo. .oo.   .o888oo  .oooo.o 
// 888          d88' `88b `888P"Y88b  d88(  "8   888   `P  )88b  `888P"Y88b    888   d88(  "8 
// 888          888   888  888   888  `"Y88b.    888    .oP"888   888   888    888   `"Y88b.  
// `88b    ooo  888   888  888   888  o.  )88b   888 . d8(  888   888   888    888 . o.  )88b 
//  `Y8bood8P'  `Y8bod8P' o888o o888o 8""888P'   "888" `Y888""8o o888o o888o   "888" 8""888P' 
//
///////////////////////////////////////////////////////////////////////////////

Room.prototype.MAX_SIZE = 12;	// Why do multiplication tables go up to 12?
Room.prototype.MIN_SIZE = 3;

Room.prototype.MAX_SPELLS_PER_ROOM = 8;

Room.prototype.SCALE_SMALL = 0.33;
Room.prototype.SCALE_FULL = 2.0;

Room.prototype.TWEEN_TIME = 500;

Room.prototype.NUM_TYPES = 20;

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
