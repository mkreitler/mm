m.scenes.playing = {
	ePos: {TOP: 0, MID: 1, LOW: 2},
	bmpBuffer: [],

	create: function() {
		var key = null;
		var ctxt = null;

		for (key in mm.ePos) {
			this.bmpBuffer.push(mm.game.add.bitmapData(mm.width, mm.height / 3, key.toLowerCase() + "canvasBufferture"));
		}

		// TODO: replace with proper initialization.
		ctxt = this.bmpBuffer[mm.ePos.top].canvas.getContext('2d');
		ctxt.fillStyle = 'green';
		ctxt.fillRect(0, 0, this.bmpBuffer[mm.ePos.top].width, this.bmpBuffer[mm.ePos.top].height);

		ctxt = this.bmpBuffer[mm.ePos.mid].canvas.getContext('2d'); 
		ctxt.fillStyle = '#00FFFF';
		ctxt.fillRect(0, 0, this.bmpBuffer[mm.ePos.mid].width, this.bmpBuffer[mm.ePos.mid].height);

		ctxt = this.bmpBuffer[mm.ePos.low].canvas.getContext('2d');
		ctxt.fillStyle = 'blue';
		ctxt.fillRect(0, 0, this.bmpBuffer[mm.ePos.low].width, this.bmpBuffer[mm.ePos.low].height);
	},	

	render: function(stageCtxt) {
		var key = null;
		var bufferY = 0;
		var bufferCtxt = null;

		// TODO: render into bmpBuffers...
	
		for (key in mm.ePos) {
			stageCtxt.drawImage(this.bmpBuffer[mm.ePos[key]].canvas, 0, bufferY);
			bufferY += this.bmpBuffer[mm.ePos[key]].height;
		}		
	},

}