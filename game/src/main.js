var canvas = document.getElementById("gameCanvas");
var ctxt = canvas ? canvas.getContext('2d') : null;

if (ctxt) {
	ctxt.fillStyle = "#00ff00";
	ctxt.fillRect(0, 0, canvas.width, canvas.height);

	ctxt.fillStyle = "#000000";
	ctxt.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
}
else {
	console.log(">>> Canvas not found!");
}