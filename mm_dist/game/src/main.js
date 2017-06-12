var mm = {
	width: 1024,
	height: 768,
	scenes: {mainMenu: null, practice: null},
	scene: null,
	switchboard: {},

	listenFor: function(message, listener) {
		var listeners = null;

		this.assert(message && listener, "(listenFor) invalid message or listener");

		listeners = this.switchboard[message];

		if (!listeners) {
			listeners = [];
		}

		if (listeners.indexOf(listener) < 0) {
			listeners.push(listener);
			this.switchboard[message] = listeners;
		}
	},

	unlistenFor: function(message, listener) {
		var listeners = null;

		this.assert(message && listener, "(listenFor) invalid message or listener");

		listeners = this.switchboard[message];

		if (listeners) {
			this.removeElementFromArray(listener, listeners);
		}
	},

	unlistenForAll: function(listener) {
		this.assert(listener, "(unlistenForAll) invalid listener");

		var listeners = null;
		var key = null;

		for (key in this.switchboard) {
			this.unlistenFor(key, listener);
		}
	},

	broadcast: function(message, data) {
		this.assert(message, "(broadcast) invalid message");

		var listeners = null;
		var i = 0;

		listeners = this.switchboard(message);

		for (i=0; listeners && i<listeners.length; ++i) {
			this.assert(listener && listener.hasOwnProperty(message), "(broadcast) invalid listener or missing handler");
			listener[message](data);			
		}
	},

	removeElementFromArray: function(element, array bPreserveOrder) {
		this.assert(array, "(removeElementFromArray) invalid array");

		var index = array.indexOf(element);
		var i = 0;

		if (index >= 0) {
			if (index != array.length - 1) {
				if (bPreserveOrder) {
					for (i=index; i<array.length - 1; ++i) {
						array[i] = array[i + 1];
					}
				}
				else {
					array[index] = array[array.length - 1];
				}
			}

			array.length = array.length - 1;
		}
	},

	assert: function(test, msg) {
		if (!test) {
			console.log("ASSERT FAILED: " + msg);
			debugger;
		}
	},

	preload: function() {
	    mm.game.load.spritesheet('world', 		'./game/res/bitmaps/world.png',		24, 24);
	    mm.game.load.spritesheet('creatures', 	'./game/res/bitmaps/creatures.png', 24, 24);

	    mm.game.load.bitmapFont('charybdis_72', './game/res/fonts/charybdis_72/font.png', './game/res/fonts/charybdis_72/font.fnt');
	},

	create: function() {
		var key = null;
		var ctxt = null;

		mm.game.stage.backgroundColor = "#0077ff";

		for (key in mm.scenes) {
			mm.assert(mm.scenes[key], "undefined scene (" + key + ")");
			if (mm.scenes[key].hasOwnProperty('create')) {
				mm.scenes[key].create();
			}
		}

		// Display the main menu.
		mm.startScene(mm.scenes.mainMenu);
	},

	update :function() {
		if (mm.scene && mm.scene.hasOwnProperty('update')) {
			mm.scene.update();
		}
	},

	render: function() {
		if (mm.scene && mm.scene.hasOwnProperty('render')) {
			mm.scene.render(mm.game.canvas.getContext('2d'));
		}
	},

	startScene: function(newScene) {
		if (newScene) {
			if (mm.scene != newScene) {
				if (mm.scene && mm.scene.hasOwnProperty('end')) {
					mm.scene.end();
				}

				if (newScene && newScene.hasOwnProperty('start')) {
					newScene.start();
				}

				mm.scene = newScene;
			}
		}
	}
};


