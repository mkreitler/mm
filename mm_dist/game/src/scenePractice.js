mm.scenes.practice = {
	SPACING_FACTOR_Y: 0.05,
	SELECTED_CHAR: '*',

	uiGroup: null,
	title: null,

	// Scene Interface ////////////////////////////////////////////////////////
	create: function() {
		this.uiGroup = mm.game.add.group();
		this.uiGroup.position.x = mm.width / 2;
		this.uiGroup.position.y = 1 * mm.height / 6;

		this.title = mm.game.make.bitmapText(0, 0, 'charybdis_72','Practice Mode', 72);
		this.title.anchor.x = 0.5;
		this.title.anchor.y = 0.5;

		this.uiGroup.add(this.title);
		this.end();
	},

	render: function(stageCtxt) {
	},

	start: function() {
		this.enable(true);
	},

	end: function() {
		this.enable(false);
	},

	// Implementation /////////////////////////////////////////////////////////


	enable: function(bEnable) {
		var i = 0;

		this.uiGroup.visible = bEnable;
		this.uiGroup.exists = bEnable;
	},

	// Input Handlers /////////////////////////////////////////////////////////
};