mm.scenes.practice = {
	SPACING_FACTOR_Y: 0.05,
	SELECTED_CHAR: '*',
	DRAG_ALPHA: 0.33,
	UI_GROUP_Y_FACTOR: (68.0 / 80.0),
	NUMBER_LINE_MAX_UNIT: 40,
	NUMBER_LINE_MIN_UNIT: 10,
	NUMBER_LINE_HEIGHT: (1 / 7),
	SCENE_BACK_COLOR: "#888888",
	UI_GROUP_COLOR: "#CCCCCC",
	DARK_GREEN: "#004400",
	ROW_FACTOR_STROKE_COLOR: "#FFFFFF",
	MAP_HEIGHT_FACTOR: 1 / 15,
	ROOM_MARGIN: 20,
	MAX_SPACING: 30,
	SPELL_MENU_FACTOR: {X: 3/10, Y: 1/20},
	BEAST_MENU_FACTOR: {X: -3/10, Y: 1/20},
	TRAP_MENU_FACTOR: {X: 0, Y: 1/20},
	ROOM_AREA_Y_FACTOR: 16 / 20,
	MICRO_MAP_ROOM_SPACING: 5,

	// UI
	uiGroup: null,
	title: null,
	centerBand: null,
	labels: {value: null, rowFactor: null, colFactor: null},
	focusSpell: {tile: null, row: -1, col: -1},

	// Rooms
	mapGroup: null,
	roomsGroup: null,
	rooms: [null, null, null, null, null],
	focusRoom: null,
	roomTileMap: null,

	adventurerGroup: null,
	adventureTileMap: null,
	focusMap: null,

	dragInfo: null,

	// Scene Interface ////////////////////////////////////////////////////////
	create: function() {
		this.createAdventurerElements();
		this.createRoomElements();
		this.createUiElements();

		this.end();
	},

	start: function() {
		var i = 0;

		mm.game.stage.backgroundColor = this.SCENE_BACK_COLOR;
		this.enable(true);
		this.hideLabels();
		mm.broadcast('addKeyAction', {enter: this.onRegenerate.bind(this)});
		this.enableRoomInput(true);

		this.focusRoom = null;

		for (i=0; i<this.rooms.length; ++i) {
			this.rooms[i].setScale(this.rooms[i].SCALE_SMALL, this.rooms[i].SCALE_SMALL);
			this.rooms[i].setX(this.getRoomX(i, -1));
		}

		this.roomsGroup.position.x = 0;

		mm.listenFor("RoomSelected", this);
		mm.listenFor("RoomGainedFocus", this);
		mm.listenFor("StartUserDrag", this);
		mm.listenFor("EndUserDrag", this);
	},

	end: function() {
		this.enable(false);
		mm.broadcast('removeKeyAction', {enter: this.onRegenerate.bind(this)});
		mm.unlistenFor("RoomSelected", this);
		mm.unlistenFor("RoomGainedFocus", this);
		mm.unlistenFor("StartUserDrag", this);
		mm.unlistenFor("EndUserDrag", this);
	},

	update: function() {
		if (this.spellMap) this.spellMap.update();
		if (this.trapMap) this.trapMap.update();
		if (this.beastMap) this.beastMap.update();

		if (this.dragInfo && this.focusRoom) {
			this.dragInfo.dragRow = this.focusRoom.getRowFromScreen(mm.game.input.activePointer.y);
			this.dragInfo.dragCol = this.focusRoom.getColFromScreen(mm.game.input.activePointer.x);

			this.dragInfo.dragRow = Math.min(this.dragInfo.dragRow, this.focusRoom.height - 1);
			this.dragInfo.dragRow = Math.max(this.dragInfo.dragRow, 0);

			this.dragInfo.dragCol = Math.min(this.dragInfo.dragCol, this.focusRoom.width - 1);
			this.dragInfo.dragCol = Math.max(this.dragInfo.dragCol, 0);

			// this.title.text = "(" +
			// 			 Math.min(this.dragStartCol, this.dragCol) + ", " +
			// 			 Math.min(this.dragStartRow, this.dragRow) + ") to (" +
			// 			 Math.max(this.dragStartCol, this.dragCol) + ", " +
			// 			 Math.max(this.dragStartRow, this.dragRow) + ")";
		}
	},

	render: function(ctxt) {
		if (this.dragInfo) {
			this.drawVisualizer(ctxt);
		}

		if (this.spellMap) {
			this.spellMap.draw(ctxt);
		}

		if (this.trapMap) {
			this.trapMap.draw(ctxt);
		}

		if (this.beastMap) {
			this.beastMap.draw(ctxt);
		}
	},

	// Implementation /////////////////////////////////////////////////////////
	drawVisualizer: function(ctxt) {
		var minRow = Math.min(this.dragInfo.dragStartRow, this.dragInfo.dragRow);
		var minCol = Math.min(this.dragInfo.dragStartCol, this.dragInfo.dragCol);
		var maxRow = Math.max(this.dragInfo.dragStartRow, this.dragInfo.dragRow);
		var maxCol = Math.max(this.dragInfo.dragStartCol, this.dragInfo.dragCol);
		var cornerX = this.focusRoom.cornerX();
		var cornerY = this.focusRoom.cornerY();
		var tileSize = this.focusRoom.tileSize();
		var iRow = 0;
		var iCol = 0;
		var bRoomAreaIsClear = this.focusRoom.areaClear(minRow, minCol, maxRow, maxCol);

		ctxt.fillStyle = bRoomAreaIsClear ? "green" : "red";
		ctxt.globalAlpha = this.DRAG_ALPHA;

		ctxt.fillRect(cornerX + minCol * tileSize,
					  cornerY + minRow * tileSize,
					  (maxCol - minCol + 1) * tileSize,
					  (maxRow - minRow + 1) * tileSize);

		ctxt.globalAlpha = 1.0;

		if (bRoomAreaIsClear) {
			this.showLabels();

			for (iRow=0; iRow<maxRow - minRow + 1; ++iRow) {
				ctxt.strokeStyle = "#000000"; // this.DARK_GREEN;
				for (iCol=0; iCol<maxCol - minCol + 1; ++iCol) {
					ctxt.strokeRect(cornerX + (minCol + iCol) * tileSize,
									cornerY + (minRow + iRow) * tileSize,
									tileSize,
									tileSize);
				}

				ctxt.strokeStyle = this.ROW_FACTOR_STROKE_COLOR;
				ctxt.strokeRect(cornerX + minCol * tileSize,
								cornerY + (minRow + iRow) * tileSize,
								(maxCol - minCol + 1) * tileSize,
								tileSize);
			}

			this.drawNumberLine(ctxt);
		}
		else {
			this.hideLabels();
		}
	},

	drawNumberLine: function(ctxt) {
		var i = 0;
		var j = 0;
		var x = 0;
		var y = 0;

		var dCol = Math.abs(this.dragInfo.dragStartCol - this.dragInfo.dragCol) + 1;
		var dRow = Math.abs(this.dragInfo.dragStartRow - this.dragInfo.dragRow) + 1;
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
			ctxt.strokeStyle = this.DARK_GREEN;
			for (j=0; j<dCol; ++j) {
				ctxt.strokeRect(x + j * unit, y, unit, unit);
			}

			ctxt.strokeStyle = this.ROW_FACTOR_STROKE_COLOR;
			ctxt.strokeRect(x, y, unit * dCol, unit);
			x += unit * dCol;
		}
	},

	onRegenerate: function() {
		mm.assert(this.room, "(regenerate) invalid room");
		this.focusRoom.clear();
		this.focusRoom.generate();
	},

	createRoomElements: function() {
		var centerImage = null;
		var centerBandY = 0;
		var i = 0;

		this.mapGroup = mm.game.add.group();
		this.mapGroup.position.x = Math.round(mm.width / 2);
		this.mapGroup.position.y = 0;

		this.roomsGroup = mm.game.add.group();
		this.roomsGroup.position.x = 0;
		this.roomsGroup.position.y = centerBandY;

		this.centerBand = mm.game.make.bitmapData(mm.width, Math.round(mm.height * this.ROOM_AREA_Y_FACTOR));
		this.centerBand.canvas.getContext('2d').fillStyle = this.UI_GROUP_COLOR;
		this.centerBand.canvas.getContext('2d').fillRect(0, 0, this.centerBand.width, this.centerBand.height);

		centerImage = mm.game.add.image(this.centerBand.width, this.centerBand.height, this.centerBand);
		centerImage.anchor.x = 0.5;
		centerImage.anchor.y = 0;
		centerImage.position.x = 0;
		centerImage.position.y = centerBandY;

		this.mapGroup.add(centerImage);
		this.mapGroup.add(this.roomsGroup);

		for (i=0; i<this.rooms.length; ++i) {
			this.rooms[i] = new Room(this.roomsGroup, 0, Math.round(mm.game.height * this.MAP_HEIGHT_FACTOR));
		}

		for (i=0; i<this.rooms.length; ++i) {
			this.rooms[i].setX(this.getRoomX(i, -1));
		}
	},

	createAdventurerElements: function() {
		this.adventurerGroup = mm.game.add.group();
	},

	createUiElements: function() {
		this.uiGroup = mm.game.add.group();
		this.uiGroup.position.x = mm.width / 2;
		this.uiGroup.position.y = Math.round(mm.height * this.UI_GROUP_Y_FACTOR);

		this.createMenus(this.uiGroup);

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

	createMenus: function(parentGroup) {
		var i = 0;
		var tiles = [];

		for (i=0; i<mm.tileMenu.prototype.MAX_ACTIONS_PER_MENU; ++i) {
			tiles.push({tileIndex: mm.tileMenu.prototype.MAX_ACTIONS_PER_MENU - 1});
		}

		var tileData = {
						tileSet: 'items',
						tiles: tiles,
						tileSize: mm.TILE_SIZE_16,
						onUp: mm.scenes.practice.onTileMapUp.bind(this),
						onDown: mm.scenes.practice.onTileMapDown.bind(this),
						onOver: mm.scenes.practice.onTileMapOver.bind(this),
						onOut: mm.scenes.practice.onTileMapOut.bind(this)
					};
		var titleData = {font: 'charybdis_72', text: mm.strings.SPELLS, fontSize: 72};
		var locationData = {parentGroup: this.uiGroup, localX: Math.round(mm.width * this.SPELL_MENU_FACTOR.X), localY: Math.round(mm.height * this.SPELL_MENU_FACTOR.Y), scale: 3}
		this.spellMap = new mm.tileMenu(locationData, titleData, tileData);

		titleData.text = mm.strings.TRAPS;
		locationData.localX = Math.round(mm.width * this.TRAP_MENU_FACTOR.X);
		this.trapMap = new mm.tileMenu(locationData, titleData, tileData);

		titleData.text = mm.strings.BEASTS;
		locationData.localX = Math.round(mm.width * this.BEAST_MENU_FACTOR.X);
		this.beastMap = new mm.tileMenu(locationData, titleData, tileData);

		this.beastMap.select();
		this.focusMap = this.beastMap;
	},

	enable: function(bEnable) {
		var i = 0;

		this.uiGroup.visible = bEnable;
		this.uiGroup.exists = bEnable;

		this.mapGroup.visible = bEnable;
		this.mapGroup.exists = bEnable;

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

	enableRoomInput: function(bEnable) {
		Room.prototype.INPUT_ENABLED = bEnable;
	},

	getRoomX: function(iRoom, iSelectedRoom) {
		var i = 0;
		var dungeonWidth = 0;
		var roomAccumWidth = 0;
		var roomX = 0;

		if (iRoom !== iSelectedRoom) {
			for (i=0; i<this.rooms.length; ++i) {
				dungeonWidth += this.rooms[i].getPixelWidth(true);
			}
			dungeonWidth += this.MICRO_MAP_ROOM_SPACING * (this.rooms.length - 1);

			roomX = -Math.floor(dungeonWidth / 2);
			for (i=0; i<this.rooms.length; ++i) {
				if (i === iRoom) {
					roomX += Math.round(this.rooms[i].getPixelWidth(true) / 2);
					break;
				}
				else {
					roomX += this.rooms[i].getPixelWidth(true);
				}

				roomX += this.MICRO_MAP_ROOM_SPACING;
			}
		}

		return roomX;
	},

	getSelectedRoomIndex: function(newSelectedRoom) {
		var i = 0;

		for (i=0; i<this.rooms.length; ++i) {
			if (this.rooms[i] === newSelectedRoom) {
				break;
			}
		}

		return i >= this.rooms.length ? -1 : i;
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
	onTileMapUp: function(child, pointer) {
		if (child && child.data) {
			child.data.onPointerUp(pointer, child);
		}
	}, 

	onTileMapDown: function(child, pointer) {
		if (child && child.data) {
			child.data.onPointerDown(pointer, child);
		}
	},

	onTileMapOver: function(child, pointer) {
		var newFocusMap = null;

		if (child && child.data) {
			child.data.onPointerOver(pointer, child);

			if (child.data !== this.focusMap && this.focusMap) {
				this.focusMap.unselect();
			}

			this.focusMap = child.data;
		}
	},

	onTileMapOut: function(child, pointer) {
		if (child && child.data) {
			if (child.data.onPointerOut(pointer, child)) {
				if (child.data === this.focusMap) {
					this.focusMap = null;
				}
			}
		}
	},

	StartUserDrag: function(dragInfo) {
		this.dragInfo = dragInfo;
	},

	EndUserDrag: function(dragInfo) {
		this.hideLabels();
		this.dragInfo = null;
	},

	RoomSelected: function(newRoom) {
		var i = 0;
		var iSelected = -1;

		if (newRoom != this.focusRoom) {
			iSelected = this.getSelectedRoomIndex(newRoom);

			for (i=0; i<this.rooms.length; ++i) {
				this.rooms[i].tweenToX(this.getRoomX(i, iSelected), this.rooms[i] === newRoom ? true : false);
			}

			if (this.focusRoom) {
				this.focusRoom.scaleDown();
			}

			this.focusRoom = null;

			if (newRoom) {
				newRoom.scaleUp();
			}
		}
	},

	RoomGainedFocus: function(focusRoom) {
		this.focusRoom = focusRoom;
	},

	// NOTE: Called in the context of 'Room'!
	onRoomInputUp: function(child, pointer) {
		if (Room.prototype.INPUT_ENABLED) {
			if (this.bUserDragging) {
				this.bUserDragging = false;
				mm.broadcast("EndUserDrag", null);
			}
			else {
				if (this.contains(mm.game.input.activePointer.x, mm.game.input.activePointer.y)) {
					mm.broadcast("RoomSelected", this);
				}
			}
		}
	},

	// NOTE: Called in the context of 'Room'!
	onRoomInputDown: function(child, pointer) {
		if (Room.prototype.INPUT_ENABLED && this.bHasFocus) {
			this.USER_DRAG_INFO.dragStartRow = this.getRowFromScreen(pointer.y);
			this.USER_DRAG_INFO.dragStartCol = this.getColFromScreen(pointer.x);

			if (this.USER_DRAG_INFO.dragStartRow < 0 ||
				this.USER_DRAG_INFO.dragStartRow >= this.height ||
				this.USER_DRAG_INFO.dragStartCol < 0 ||
				this.USER_DRAG_INFO.dragStartCol >= this.width) {

				// Abort the operation.
				mm.broadcast("EndUserDrag", null);
				this.bUserDragging = false;
			}
			else {
				this.bUserDragging = true;
				mm.broadcast("StartUserDrag", this.USER_DRAG_INFO);
			}
		}
	},

	// NOTE: Called in the context of 'Room'!
	onRoomInputOver: function(child, pointer) {
		if (Room.prototype.INPUT_ENABLED) {
		}
	},

	// NOTE: Called in the context of 'Room'!
	onRoomInputOut: function(child, pointer) {
		if (Room.prototype.INPUT_ENABLED) {
		}
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

// Spell Card /////////////////////////////////////////////////////////////////
//  .oooooo..o ooooooooo.   oooooooooooo ooooo        ooooo        
// d8P'    `Y8 `888   `Y88. `888'     `8 `888'        `888'        
// Y88bo.       888   .d88'  888          888          888         
//  `"Y8888o.   888ooo88P'   888oooo8     888          888         
//      `"Y88b  888          888    "     888          888         
// oo     .d8P  888          888       o  888       o  888       o 
// 8""88888P'  o888o        o888ooooood8 o888ooooood8 o888ooooood8 
///////////////////////////////////////////////////////////////////////////////
function Spell() {

};                                          

// ADVENTURER CARD ////////////////////////////////////////////////////////////
function Adventurer() {

};
