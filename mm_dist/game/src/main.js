var mm = {
	ePos: {TOP: 0, MID: 1, LOW: 2},
	width: 1024,
	height: 768,
	canvasBuffer: [null, null, null],

	preload: function() {
	    mm.game.load.image('world', 		'./game/res/bitmaps/world.png');
	    mm.game.load.image('creatures', 	'./game/res/bitmaps/creatures.png');
	},

	create: function() {
		var key = null;
		var ctxt = null;

		for (key in mm.ePos) {
			mm.canvasBuffer[mm.ePos[key]] = mm.game.add.bitmapData(mm.width, mm.height / 3, key.toLowerCase() + "canvasBufferture");
		}

		ctxt = mm.canvasBuffer[mm.ePos.TOP].canvas.getContext('2d');
		ctxt.fillStyle = 'green';
		ctxt.fillRect(0, 0, mm.canvasBuffer[mm.ePos.TOP].width, mm.canvasBuffer[mm.ePos.TOP].height);

		ctxt = mm.canvasBuffer[mm.ePos.MID].canvas.getContext('2d'); 
		ctxt.fillStyle = '#00FFFF';
		ctxt.fillRect(0, 0, mm.canvasBuffer[mm.ePos.MID].width, mm.canvasBuffer[mm.ePos.MID].height);

		ctxt = mm.canvasBuffer[mm.ePos.LOW].canvas.getContext('2d');
		ctxt.fillStyle = 'blue';
		ctxt.fillRect(0, 0, mm.canvasBuffer[mm.ePos.LOW].width, mm.canvasBuffer[mm.ePos.LOW].height);
	},

	update :function() {

	},

	render: function() {
		var key = null;
		var bufferY = 0;
		var stageCtxt = mm.game.canvas.getContext('2d');

		for (key in mm.ePos) {
			stageCtxt.drawImage(mm.canvasBuffer[mm.ePos[key]].canvas, 0, bufferY);
			bufferY += mm.canvasBuffer[mm.ePos[key]].height;
		}
	}
};

mm.game = new Phaser.Game(mm.width, mm.height, Phaser.CANVAS, 'Monster Multiplier', { preload: mm.preload, create: mm.create, update: mm.update, render: mm.render });


