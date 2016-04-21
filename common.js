"use strict";

var Game = {};
var gebId    = document.getElementById.bind(document),
    gesbName = document.getElementsByName.bind(document);

var taptile = (...rest) => {
	(Game.forHTML.taptile || (()=>{}))(...rest);
};

Game.coordinate_to_string = (c) => {
	return c.join('_');
};

Game.forHTML = {};

Game.forHTML.taped = null;

Game.forHTML.succeed = (orig, vect) => {
	var clearEffect = (orig, vect, time) => {
		var n = Game.fielddata.hider.split('').length;
		while (n--) {
			gebId("board").rows[orig[0]].cells[orig[1]].classList.add('correct');
			orig = orig.map((e, i) => (e + vect[i]));
		}
	};

	var resulttime = new Date() - Game.starttime;
	// console.log(resulttime);
	clearEffect(orig, vect, resulttime);
};

Game.forHTML.fail = () => {
	if (!Game.failed) Game.failed = 0;

	Game.failed++;

	gebId("board").classList.add('failed');
	// console.log(gebId("board").className);
	setTimeout(() => {gebId("board").classList.remove('failed');}, 500);
};

Game.submitAnswer = (origin, vector) => {
	var n = Game.fielddata.hider.split('');
	var field = Game.fielddata.field;

	while (n.length) {
		var char = n.shift();

		if (field[Game.coordinate_to_string(origin)] !== char) return false;

		origin = origin.map((e, i) => (e + vector[i]));
	}

	return true;
};

Game.forHTML.writeTable = (h, w, field) => {
	var table = gebId("board");
	var html = "";

	for (var i = 0; i < h; i++) {
		html += "<tr>";

		for(var j = 0; j < w; j++) {
			html += `<th onclick="taptile(${i}, ${j})">${field[Game.coordinate_to_string([i,j])]}</th>`;
		}

		html += "</tr>";
	}

	table.innerHTML += html;
};

Game.forHTML.gamestart = (result, field) => {
	var onkeydown = (e) => {
		var key = e.keyCode;

		if (!Game.forHTML.taped) return;

		var vector = null;

		switch (key) {
		case 81: // q
		case 55: // 7
			vector = [-1, -1];
			break;
		case 87: // w
		case 56: // 8
			vector = [-1,  0];
			break;
		case 69: // e
		case 57: // 9
			vector = [-1, +1];
			break;
		case 68: // d
		case 54: // 6
			vector = [ 0, +1];
			break;
			case 67: // c
		case 51: // 3
			vector = [+1, +1];
			break;
		case 88: // x
		case 50: // 2
			vector = [+1,  0];
			break;
		case 90: // z
		case 49: // 1
			vector = [+1, -1];
			break;
		case 65: // a
		case 52: // 8
			vector = [ 0, -1];
			break;
		}

		if (vector && !gebId("board").className.match(new RegExp('( |^)failed( |$)'))) {
			if (Game.submitAnswer(Game.forHTML.taped, vector)) {
				Game.forHTML.succeed(Game.forHTML.taped, vector);
			} else {
				Game.forHTML.fail();
			}
		}
	};

	var taptile = (h, w) => {
		Game.forHTML.taped = [h, w];
	};

	gebId("settings").style.opacity = 0;
	gebId("game-body").style.visibility = "visible";
	gebId("message").innerHTML = `Find <font color=red>${result.hider}</font>`;

	Game.forHTML.writeTable(...(result.size), field);
	document.onkeydown = onkeydown;
	Game.forHTML.taptile = taptile;
};

function startup() {
	gebId("settings-confirm").onclick = () => {
		var rands = (howmany) => {
			return ' '.repeat(howmany || 16).split('').map(Math.random);
		};

		var checker = () => {
			var boardsizes = [
				[ 8,  8],
				[16, 16],
				[24, 24]
			];

			var checktext = (text, boardsize) => {
				if (!text) {
					return "隠す文字列を入力して下さい";
				} else if (text.split('').every((e) => (e === text[0]))) {
					return "文字は2種類以上なければなりません";
				} else if (boardsize && boardsize.every((e) => {
					return e < text.length;
				})) {
					return "文字列が長すぎます";
				} else {
					return "";
				}
			};

			var errormess = [];
			var select = gesbName("boardsize");
			var gamemode = void 0;

			for (var i = 0; i < select.length; i++) {
				if (select[i].checked) {
					gamemode = i;
					break;
				}
			}

			var boardsize = boardsizes[i];
			if (!boardsize) errormess.push("難易度を選択して下さい");

			var text = gebId("texttofind").value;

			var isinvalid = checktext(text, boardsize);
			if (isinvalid) errormess.push(isinvalid);

			if (errormess.length) {
				alert(errormess.join('\n'));
				return null;
			} else {
				return {size: boardsize, hider: text};
			}
		};

		var shower = (result) => {
			//
			// var field = Game.makeField(result.size, result.hider, rands()); // TODO: 並列してグラフィック
			var worker = new Worker("gamesystem.js");
			worker.onmessage = function(event){
				var field = event.data;
				Game.starttime = new Date();
				Game.fielddata = {field: field, hider: result.hider};
				Game.forHTML.gamestart(result, field);
			};

			worker.postMessage(JSON.parse(JSON.stringify({
				args: [result.size, result.hider, rands()],
				hash: Game.coordinate_to_string.toString(10)
			})));
			// TODO: ゲーム本体
		};

		var result = checker();
		if (!result) return false;
		shower(result);
	};
}

// TODO: コメントつけろ
// TODO: オーダーおとせ

// function view_result (sides, t) {
// 	console.log("sides: ", sides, ", t: ", t);
// 	console.time(   "view_result");
//
// 	var result = Game.makeField(sides, t, (":".repeat(16).split('').map(() => {
// 		return Math.random();
// 	})));
//
// 	console.timeEnd("view_result");
// 	console.log(result.map(function (e){return e.join('')}).join('\n'));
// }

// view_result([16, 16], "flandre");
// view_result([16, 16], "remilia");
// view_result([ 8,  4], "scarlet");
// view_result([ 7, 10], "onion";

// view_result([ 8,  8], "escape"); // Accepted,   239.900ms
// view_result([16, 16], "escape"); // Accepted,  3383.734ms
// view_result([24, 24], "escape"); // Accepted, 14918.606ms

// view_result([30, 30], "escape"); // Failed (too large object)
