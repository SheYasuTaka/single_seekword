"use strict";

var Game = {};
var gebId     = document.getElementById.bind(document),
    gesbName  = document.getElementsByName.bind(document),
    gesbClass = document.getElementsByClassName.bind(document);

var taptile = (...rest) => {
	(Game.forHTML.taptile || (()=>{}))(...rest);
};

Game.coordinate_to_string = (c) => {
	return c.join('_');
};

Game.forHTML = {};

Game.forHTML.taped = null;

Game.forHTML.setTimeLimit = (h, w) => {
	return Math.floor(h * w / 4);
};

Game.forHTML.showResult = (timeMS) => {
	Game.forHTML.taptile = null;
	clearInterval(Game.forHTML.intervalID);
	document.onkeydown = null;
	gebId("game-body").style.opacity = /*1/8*/ 1/6;
	gebId("game-result").style.opacity = 1;
	gebId("result-level").innerText = `${Game.levelname} (${Game.level.join('x')})`;
	gebId("result-timer").innerText = timeMS / 1000;
	gebId("result-mistakes").innerText = Game.failed;
};

Game.forHTML.clearEffect = (orig, vect) => {
	var n = Game.fielddata.hider.split('').length;
	while (n--) {
		gebId("board").rows[orig[0]].cells[orig[1]].classList.add('correct');
		orig = orig.map((e, i) => (e + vect[i]));
	}
	gebId("board").classList.add('gameset');
};

Game.forHTML.timeup = () => {
	gebId("board").classList.add('timeup');
	var answer = Game.cheet(Game.level, Game.fielddata.field, Game.coordinate_to_string, Game.fielddata.hider);
	Game.forHTML.clearEffect(...answer);
	Game.forHTML.showResult(Game.forHTML.timelim[1] * 1000);
};

Game.forHTML.succeed = (orig, vect) => {
	var resulttimeMS = (new Date() - Game.starttime);

	Game.forHTML.clearEffect(orig, vect);
	Game.forHTML.showResult(resulttimeMS);
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
		var oldtaped = Game.forHTML.taped;
		if (oldtaped) gebId("board").rows[oldtaped[0]].cells[oldtaped[1]].classList.remove('selected');
		Game.forHTML.taped = [h, w];
		gebId("board").rows[h].cells[w].classList.add('selected');
	};

	gebId("progress").style.width = 0;
	gebId("settings").style.opacity = 0;
	Array.prototype.slice.call(gebId("game-body").children).forEach((e) => e.style.opacity = 1);
	gebId("message").innerHTML = `Find <span class="target"></span><br>マスをクリックで1文字目を選択、[QWEDCXZA](Sの周囲8キー)で方向を選択`;
	gesbClass("target")[0].innerText = result.hider;
	Game.failed = 0;

	Game.forHTML.writeTable(...(result.size[0]), field);
	document.onkeydown = onkeydown;
	Game.forHTML.taptile = taptile;
	Game.forHTML.timelim = [114, 514].fill(Game.forHTML.setTimeLimit(...result.size[0]));
	Game.forHTML.intervalID = setInterval(function (){
		gebId("timelim").innerText = --Game.forHTML.timelim[0];
		if (!Game.forHTML.timelim[0]) {
			Game.forHTML.timeup();
		}
	}, 1000);
};

function startup() {
	gebId("settings-confirm").onclick = () => {
		var rands = (howmany) => {
			return ' '.repeat(howmany || 16).split('').map(Math.random);
		};

		var checker = () => {
			var boardsizes = [
				[[ 8,  8], "easy"],
				[[16, 16], "normal"],
				[[24, 24], "hard"]
			];

			var checktext = (text, lev) => {
				if (!text) {
					return "隠す文字列を入力して下さい";
				} else if (text.length <= 2) {
					return "文字列が短すぎます";
				} else if (text.split('').every(e => (e === text[0]))) {
					return "文字は2種類以上なければなりません";
				} else if (boardsizes[lev] && boardsizes[lev][0].every(e => (e < text.length))) {
					return "文字列が長すぎます";
				} else if (lev >= 2 && text.length > 5) {
					return "hardは5字以上の文字列に対応できていません\nレベルか文字列を変えて再度お試しください";
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

			var isinvalid = checktext(text, i);
			if (isinvalid) errormess.push(isinvalid);

			if (errormess.length) {
				console.log(errormess.join('\n'));
				alert(errormess.join('\n'));
				return null;
			} else {
				return {size: boardsize, hider: text};
			}
		};

		var shower = (result) => {
			gebId("settings-confirm").onclick = null;
			var worker = new Worker("gamesystem.js");
			Game.level = result.size[0];
			Game.levelname = result.size[1];
			worker.onmessage = function (event) {
				switch (event.data.mode) {
				case 'result':
					var field = event.data.result;
					Game.fielddata = {field: field, hider: result.hider};
					Game.starttime = new Date();
					Game.forHTML.gamestart(result, field);
					break;
				
				case 'log':
					console.log("log:", event.data.result);
					gebId("message").innerText = event.data.result;
					gebId("progress").style.width = `${100 * (1 - event.data.result / (result.size[0][0] * result.size[0][1]))}%`;
					break;
				}
			};

			worker.postMessage(JSON.parse(JSON.stringify({
				args: [result.size[0], result.hider, rands()],
				hash: Game.coordinate_to_string.toString(10)
			})));
			// TODO: ゲーム本体
		};

		var result = checker();
		if (!result) return false;
		shower(result);
	};
}

Game.cheet = function (sides, field, hash, text) {
	var choice = ((l)=>{var i=0,e=Math.pow(3,l),r=[];while(++i<e)r.push(((n)=>((s)=>('0'.repeat(l-s.length)+s))(n.toString(3)).split('').map((e)=>({'0': 0,'1': -1,'2': +1})[e]))(i));return r})(sides.length);
	var answer = sides.map(()=>0);
	var incf = () => {
		var i = sides.length;
		while (i--) {
			if (++answer[i] < sides[i])
				return;
			else
				answer[i] = 0;
		}
	};
	var addL = (l,r)=>l.map((e,i)=>e+r[i]);
	var correct = function (s, d) {
		var i = 0;
		var c = s.slice('');
		while (++i < text.length) {
			c = addL(c, d);
			if (field[hash(c)] !== text[i])
				return false;
		}
		return true;
	};
	console.log(choice.join(' '));
	// return;
	for (;;) {
		console.log(answer, field[hash(answer)]);
		if (field[hash(answer)] === text[0]) {
			var res = choice.find(function (e) {if (correct(answer, e)) return [answer,e]});
			if (res) return [answer, res];
		}
		incf("Doll judge");
	}
};
