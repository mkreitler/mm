mm.scenes.practice = {
	SPACING_FACTOR_Y: 0.05,
	SELECTED_CHAR: '*',

	uiGroup: null,
	title: null,
	centerBand: null,

	roomGroup: null,
	room: null,

	roomTileMap: null,

	adventurerGroup: null,
	adventureTileMap: null,

	// Scene Interface ////////////////////////////////////////////////////////
	create: function() {
		this.createUiElements();
		this.createAdventurerElements();
		this.createRoomElements();

		this.end();
	},

	start: function() {
		mm.game.stage.backgroundColor = "#AAAAAA";
		this.enable(true);
		mm.broadcast('addKeyAction', {enter: this.onRegenerate.bind(this)});
	},

	end: function() {
		this.enable(false);
		mm.broadcast('removeKeyAction', {enter: this.onRegenerate.bind(this)});
	},

	// Implementation /////////////////////////////////////////////////////////
	onRegenerate: function() {
		mm.assert(this.room, "(regenerate) invalid room");
		this.room.clear();
		this.room.generate();
	},

	createRoomElements: function() {
		var centerImage = null;

		this.roomGroup = mm.game.add.group();
		this.roomGroup.position.x = mm.width / 2;
		this.roomGroup.position.y = mm.height / 2;

		this.centerBand = mm.game.make.bitmapData(mm.width, Math.floor(2 * mm.height / 5));
		this.centerBand.canvas.getContext('2d').fillStyle = 'black';
		this.centerBand.canvas.getContext('2d').fillRect(0, 0, this.centerBand.width, this.centerBand.height);
		centerImage = mm.game.add.image(this.centerBand.width, this.centerBand.height, this.centerBand);
		centerImage.anchor.x = 0.5;
		centerImage.anchor.y = 0.5;
		centerImage.position.x = 0; //mm.width / 2;
		centerImage.position.y = 0; // mm.height / 2;
		this.roomGroup.add(centerImage);

		this.room = new Room(this.roomGroup);
	},

	createAdventurerElements: function() {
		this.adventurerGroup = mm.game.add.group();
	},

	createUiElements: function() {
		this.uiGroup = mm.game.add.group();
		this.uiGroup.position.x = mm.width / 2;
		this.uiGroup.position.y = 1 * mm.height / 6;

		this.title = mm.game.make.bitmapText(0, 0, 'charybdis_72','Practice Mode', 72);
		this.title.anchor.x = 0.5;
		this.title.anchor.y = 0.5;

		this.uiGroup.add(this.title);
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

	// Input Handlers /////////////////////////////////////////////////////////
};

// TODO: move these into their own classes.
// ROOM CARD //////////////////////////////////////////////////////////////////
function Room(group) {
	var key = null;
	var iRow = 0;
	var iCol = 0;

	this.group 	= group;
//	this.map 	= mm.game.make.tilemap();
	this.map 	= mm.game.add.tilemap();
	this.layers = {floor: null,
				   shadows: null,
				   occupants: null,
				   walls: null};

	// iType is the index into the row of terrain tiles
	// displayed by this card.
	this.iType	= 0;

	this.width  = 0;
	this.height = 0;

	this.map.addTilesetImage('world', 'world', mm.TILE_SIZE, mm.TILE_SIZE);

	for (key in this.layers) {
		this.layers[key] = this.map.create(key,
										   this.MAX_SIZE,
										   this.MAX_SIZE,
										   mm.TILE_SIZE,
										   mm.TILE_SIZE);
		this.layers[key].anchor.x = 0.5;
		this.layers[key].anchor.y = 0.5;
		this.group.add(this.layers[key]);
	}

	this.generate();

	this.enable(false);
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

Room.prototype.FLOOR_TILES = [3, 4, 5, 6];

// ADVENTURER CARD ////////////////////////////////////////////////////////////
function Adventurer() {

};
