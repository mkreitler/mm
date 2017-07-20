// TileMenu /////////////////////////////////////////////////////////////////////////////////////////////////////
// ooooooooooooo ooooo ooooo        oooooooooooo      ooo        ooooo oooooooooooo ooooo      ooo ooooo     ooo 
// 8'   888   `8 `888' `888'        `888'     `8      `88.       .888' `888'     `8 `888b.     `8' `888'     `8' 
//      888       888   888          888               888b     d'888   888          8 `88b.    8   888       8  
//      888       888   888          888oooo8          8 Y88. .P  888   888oooo8     8   `88b.  8   888       8  
//      888       888   888          888    "          8  `888'   888   888    "     8     `88b.8   888       8  
//      888       888   888       o  888       o       8    Y     888   888       o  8       `888   `88.    .8'  
//     o888o     o888o o888ooooood8 o888ooooood8      o8o        o888o o888ooooood8 o8o        `8     `YbodP'    
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Creates a menu of selectable tiles with a text label.

// locationData: parentGroup, localX, localY, groupScale
// labelData: font, fontSize, text
// tileData: tileSet, tileSize, tiles, onSelected callbacks
mm.tileMenu = function(locationData, labelData, tileData) {
	var i = 0;

	this.parentGroup = locationData.parentGroup;
	this.tileGroup = mm.game.add.group();

	this.title = mm.game.make.bitmapText(0, 0, labelData.font, labelData.text, Math.round(labelData.fontSize / locationData.scale));
	this.title.anchor.x = 0.5;
	this.title.anchor.y = 1.0;
	this.title.position.x = 0;
	this.title.position.y = 0;
	this.tileGroup.add(this.title);

	this.tileMap = mm.game.add.tilemap();
	this.tileMap.addTilesetImage(tileData.tileSet, tileData.tileSet, tileData.tileSize, tileData.tileSize);
	this.tileLayer = this.tileMap.create('tileLayer', tileData.tiles.length, 1, tileData.tileSize, tileData.tileSize);
	this.tileLayer.anchor.x = 0.5;
	this.tileLayer.anchor.y = 0.0;
	this.tileLayer.position.x = 0;
	this.tileLayer.position.y = 0;
	this.tileLayer.inputEnabled = true;
	for (i=0; i<tileData.tiles.length; ++i) {
		if (tileData.tiles[i].tileIndex >= 0) {
			this.tileMap.putTile(tileData.tiles[i].tileIndex, i, 0, this.tileLayer);
			this.tileMap.getTile(i, 0, this.tileLayer).data = i;
		}
	}

	this.tileGroup.scale.x = locationData.scale;
	this.tileGroup.scale.y = locationData.scale;
	this.tileGroup.position.x = locationData.localX;
	this.tileGroup.position.y = locationData.localY;
	locationData.parentGroup.add(this.tileGroup);
	locationData.parentGroup.bringToTop(this.tileGroup);

	// Add focus highlight.
	var focusHeight = this.tileLayer.height + this.title.height;
	focusHeight = Math.round(focusHeight / this.FOCUS_PIXEL_MODULUS) * this.FOCUS_PIXEL_MODULUS;
	var focusBitmap = mm.game.make.bitmapData(this.tileLayer.width, focusHeight);
	focusBitmap.canvas.getContext('2d').fillStyle = this.FOCUS_COLOR;
	focusBitmap.canvas.getContext('2d').fillRect(0, 0, focusBitmap.width, focusBitmap.height);
	this.focusImage = mm.game.add.image(focusBitmap.width, focusBitmap.height, focusBitmap);
	this.focusImage.anchor.x = 0.5;
	this.focusImage.anchor.y = 0.5;
	this.focusImage.position.x = 0;
	this.focusImage.position.y = 0;
	this.tileGroup.add(this.focusImage);
	this.tileGroup.sendToBack(this.focusImage);

	this.focusImage.inputEnabled = true;
	this.tileLayer.inputEnabled = true;
	this.title.inputEnabled = true;

	this.title.data = this;
	this.tileLayer.data = this;
	this.focusImage.data = this;

	this.tileGroup.add(this.tileLayer);

	if (tileData.onUp) {
		this.tileGroup.inputEnableChildren = true;
		this.tileGroup.onChildInputUp.add(tileData.onUp, this);
	}

	if (tileData.onDown) {
		this.tileGroup.inputEnableChildren = true;
		this.tileGroup.onChildInputDown.add(tileData.onDown, this);
	}

	if (tileData.onOver) {
		this.tileGroup.inputEnableChildren = true;
		this.tileGroup.onChildInputOver.add(tileData.onOver, this);
	}

	if (tileData.onOut) {
		this.tileGroup.inputEnableChildren = true;
		this.tileGroup.onChildInputOut.add(tileData.onOut, this);
	}


	this.focusTile = null;
	this.focusTileRow = -1;
	this.focusTileCol = -1;

	this.unselect();
};

mm.tileMenu.prototype.update = function() {
	if (this.uiUpdate) {
		this.uiUpdate();
	}
};

mm.tileMenu.prototype.selectTile = function() {
	var pointer = mm.game.input.activePointer;

	var xLocal = Math.floor((pointer.x - this.originX(true)) / this.tileGroup.scale.x);
	var yLocal = Math.floor((pointer.y - this.originY(true)) / this.tileGroup.scale.y);
	var col = this.tileLayer.getTileX(xLocal);
	var row = this.tileLayer.getTileY(yLocal);

	this.focusTile = this.tileMap.getTile(col, row, this.tileLayer);
	if (this.focusTile) {
		this.focusTileRow = row;
		this.focusTileCol = col;
	}
};

mm.tileMenu.prototype.unselect = function () {
	this.focusImage.visible = false;
	// this.tileLayer.visible = false;	
};

mm.tileMenu.prototype.select = function() {
	this.focusImage.visible = true;
	// this.tileLayer.visible = true;	
};

mm.tileMenu.prototype.onPointerOver = function(pointer, uiElement) {
	this.select();

	if (uiElement === this.tileLayer || uiElement === this.title) {
		this.uiUpdate = this.selectTile;
	}
};

mm.tileMenu.prototype.onPointerOut = function(pointer, uiElement) {
	var bUnselected = false;

	if (uiElement === this.focusImage) {
		this.unselect();
		this.uiUpdate = null;
		this.focusTile = null;
		bUnselected = true;
	}

	return bUnselected;
};

mm.tileMenu.prototype.onPointerUp = function(pointer, uiElement) {
};

mm.tileMenu.prototype.onPointerDown = function(pointer, uiElement) {
};

mm.tileMenu.prototype.draw = function(ctxt) {
	var scale =  this.tileGroup.scale.x;
	var originX = this.originX(true);
	var originY = this.originY(true);

	if (this.focusTile) {
		ctxt.beginPath();
		ctxt.strokeStyle = this.MAX_ACTIONS_PER_MENU_SELECT_COLOR;
		ctxt.rect(Math.floor(originX + this.tileMap.tileWidth * this.focusTileCol * scale),
				  Math.floor(originY + this.tileMap.tileHeight * this.focusTileRow * scale),
				  this.tileMap.tileWidth * scale,
				  this.tileMap.tileHeight * scale);
		ctxt.closePath();
		ctxt.stroke();
	}
};

mm.tileMenu.prototype.originX = function(scaled) {
	var scale = scaled ? this.tileGroup.scale.x : 1.0;
	return Math.floor(this.parentGroup.position.x + this.tileGroup.position.x - this.tileLayer.anchor.x * this.tileLayer.width * scale);
};

mm.tileMenu.prototype.originY = function(scaled) {
	var scale = scaled ? this.tileGroup.scale.x : 1.0;
	return Math.floor(this.parentGroup.position.y + this.tileGroup.position.y - this.tileLayer.anchor.y * this.tileLayer.height * scale);
};

mm.tileMenu.prototype.MAX_ACTIONS_PER_MENU = 6;
mm.tileMenu.prototype.FOCUS_COLOR = "#00ffff";
mm.tileMenu.prototype.ACTION_SELECT_COLOR = "#000055";
mm.tileMenu.prototype.FOCUS_PIXEL_MODULUS = 50;
