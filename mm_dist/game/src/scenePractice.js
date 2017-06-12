mm.scenes.practice = {
	SPACING_FACTOR_Y: 0.05,
	SELECTED_CHAR: '*',

	uiGroup: null,
	title: null,
	menuChoiceText: ["Instructions", "Practice", "Play"],
	menuItems: [],
	selectedItem: 0,

	// Scene Interface ////////////////////////////////////////////////////////
	create: function() {
		var i = 0;
		var totalHeight = 0;

		this.uiGroup = mm.game.add.group();
		this.uiGroup.position.x = mm.width / 2;
		this.uiGroup.position.y = 1 * mm.height / 6;

		this.title = mm.game.make.bitmapText(0, 0, 'charybdis_72','Practice Mode', 72);
		this.title.anchor.x = 0.5;
		this.title.anchor.y = 0.5;

		totalHeight = 3 * this.title.getBounds().height;
		this.uiGroup.add(this.title);

		for (i=0; i<this.menuChoiceText.length; ++i) {
			this.menuItems.push(mm.game.make.bitmapText(0, 0, 'charybdis_72', this.menuChoiceText[i], 48));
			this.menuItems[i].anchor.x = 0.5;
			this.menuItems[i].anchor.y = 0.5;
			this.menuItems[i].position.y = totalHeight * (1.0 + this.SPACING_FACTOR_Y);

			this.menuItems[i].events.onInputOver.add(this.onMouseOver, this);
			this.menuItems[i].events.onInputDown.add(this.onPress, this);
			this.menuItems[i].events.onInputUp.add(this.onRelease, this);

			totalHeight += this.menuItems[i].getBounds().height;
			this.uiGroup.add(this.menuItems[i]);
			this.menuItems[i].inputEnabled = true;
		}

		this.selectedItem = -1;
	},

	render: function(stageCtxt) {
	},

	start: function() {
		this.selectedItem = 0;
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

		for (i=0; i<this.menuItems.length; ++i) {
			if (bEnable) {
				this.menuItems[i].text = this.selectText(this.menuItems[i].text, i === this.selectedItem);
			}
			this.menuItems[i].inputEnabled = bEnable;
		}
	},

	selectText: function(text, bSelect) {
		if (bSelect) {
			text = this.SELECTED_CHAR + ' ' + text + ' ' + this.SELECTED_CHAR;
		}
		else {
			text = text.replace(this.SELECTED_CHAR + ' ', '');
			text = text.replace(' ' + this.SELECTED_CHAR, '');
		}

		return text;
	},

	// Input Handlers /////////////////////////////////////////////////////////
	onMouseOver: function(menuItem) {
		var index = this.menuItems.indexOf(menuItem);

		if (this.selectedItem != index) {
			this.menuItems[this.selectedItem].text = this.selectText(this.menuItems[this.selectedItem].text, false);
			this.selectedItem = index;
			menuItem.text = this.selectText(menuItem.text, true);
		}
	},

	onPress: function(menuItem) {
		var index = this.menuItems.indexOf(menuItem);

		// TODO: play a sound.
	},

	onRelease: function(menuItem) {
		var index = this.selectedItem < 0 ? this.menuItems.indexOf(menuItem) : this.selectedItem;

		if (index >= 0) {
			switch(this.selectText(this.menuItems[index].text).toLowerCase()) {
				case 'instructions':
					console.log("<<< INSTRUCTIONS >>>");
				break;

				case 'practice':
					console.log("<<< PRACTICE >>>");
				break;

				case 'play':
					console.log("<<< PLAY >>>");
				break;
			}			
		}
	}
};