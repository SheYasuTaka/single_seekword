
var Game = {};
var gebId = document.getElementById.bind(document),
	gesbName = document.getElementsByName.bind(document);

Game.coordinate_to_string = function (c) {
	return c.join('_');
};

Game.makeField = function (sides, t, seeds) {
	// The core function
	var s = t.length;
	var dimention = sides.length;
	var coordinate_to_string = Game.coordinate_to_string;
	var rand_with_seeds = function (range_size){
		var seed = seeds.shift();
		var seed_to_use = seed * (range_size || (1 - seed) * 4);
		var result = Math.floor(seed_to_use);
		seeds.push(seed_to_use - result);
		return [seed, result];
	};
	var isexist = function (array) {
		return array.every(function (e,i){
			return (0 <= e) && (e < sides[i]);
		});
	};
	var copy_field = function (x) {
		// for an Object, an Array, or a PrimitiveValue.
		var result;
		try {
			var strfied = JSON.stringify(x);
			result = JSON.parse(strfied);
		} catch(e){
			var initial;
			var is_obj = [Array, Object].some(function (Constructor) {
				if (x instanceof Constructor) {
					initial = new Constructor();
					return true;
				} else {
					return false;
				}
			});
			if (is_obj) {
				Object.keys(x).forEach(function (key) {
					initial[key] = copy_field(x[key]);
				});
				result = initial;
			} else {
				result = x;
			}
		}
		return result;
	};
	var rev_rand = function (S, s) {
		var range = 0;
		var sides = S.slice();
		for (;;) {
			var whole = sides.reduce(function (sum, e) {
				return sum * e;
			});
			var redun = 1;
			sides.forEach(function (e, i) {
				redun *= Math.min(Math.max(0, s * 2 - S[i]), e);
			});
			range += whole - redun;
			sides = sides.map(function (e) {
				return e - 2;
			});
			if (sides.some(function (e) {
					return !(e > 0);
			})){
				break;
			}
		}
		var index = S.map(function () {
			return 0;
		});
		var incr = function () {
			var i = dimention;
			while (i--) {
				if (++index[i] < S[i]) {
					break;
				}
				index[i] = 0;
			}
		};
		var steam = function () {
			var minIndex = Infinity;
			var redunFlag = true;
			index.forEach(function (e, i) {
				minIndex = Math.min(minIndex, e, S[i] - e - 1);
				if (e < S[i] - s || e >= s) {
					redunFlag = false;
				}
			});
			if (redunFlag) {
				return 0;
			} else {
				return ++minIndex;
			}
		};
		for (var pin = rand_with_seeds(range)[1]; pin > 0; incr()) {
			pin -= steam();
		}
		return index;
	};
	var add_list = function (l, r) {
		return l.map(function (e, i) {
			return e + r[i];
		});
	};
	var sub_list = function (l, r) {
		return l.map(function (e, i) {
			return e - r[i];
		});
	};
	var create = function (ansO, v) {
		var f = {};
		var splitext = t.split('');
		var choice = (function (len) {
			var ans = [];
			var list = [0, -1, +1];
			var v = new Array(len).fill(0);
			for (;;) {
				var i = len;
				while (i--) {
					v[i]++;
					if (v[i] === 3) {
						v[i] = 0;
						if (!i) {
							return ans;
						}
					} else {
						break;
					}
				}
				ans.push(
					v.map(function (e) {
						return list[e];
					})
				);
			}
		})(dimention);
		var temporary_fields = [];
		var axes = function (array, index, substitune) {
			if (isexist(index)) {
				var strindex = coordinate_to_string(index);
				if (arguments.length >= 3) {
					var isfunc = (typeof substitune === 'function');
					array[strindex] = (isfunc ? substitune(array[strindex]) : substitune);
				}
				return array[strindex];
			} else {
				return void 0;
			}
		};
		var show_candidates = function (f, candidate) {
			var lids = [];
			var is_collapse = candidate.some(function (position){
				var count = -1, mins = [];
				var data = axes(f, position);
				var wide_min = Infinity;
				Object.keys(data).forEach(function (can_be_taken){
					var eachar = data[can_be_taken];
					if (!eachar) {
						return;
					}
					count++;
					var narrow_min = Infinity;
					Object.keys(eachar).forEach(function (e){
						var each_drtn = eachar[e];
						each_drtn.forEach(function (e){
							var holes = e[1];
							if (holes < narrow_min) {
								narrow_min = holes;
							}
						});
					});
					mins.push([can_be_taken, narrow_min]);
					if (narrow_min < wide_min) {
						wide_min = narrow_min;
					}
				});
				if (count < 0) {
					return true;
				}
				mins.sort(function (a, b){
					return (a[1] - b[1]) || rand_with_seeds()[0] - 1 / 2;
				});
				var parameter = count * wide_min;
				lids.push([[position.slice(), mins], parameter]);
				return false;
			});
			if (is_collapse) {
				return null;
			} else {
				lids.sort(function (a, b){
					return (a[0][1] - b[0][1]) || rand_with_seeds()[0] - 1 / 2;
				});
				return lids;
			}
		};
		var show_locatable_chars = function (c) { // [char][dtrn][n]
			var longest_substr = function (which, origin, direction) {
				var l, r, holes = 0;
				var canyoucomplete = true;
				var position, elem;
				l = which;
				position = origin.slice();
				while (--l >= 0) {
					position = sub_list(position, direction);
					--l;
					elem = axes(f, position);
					if (typeof elem === 'string') {
						if (elem !== splitext[l]) {
							canyoucomplete = false;
							l++;
							break;
						}
					} else {
						if (typeof elem === 'object') {
							if (!elem[splitext[l]]) {
								canyoucomplete = false;
								l++;
								break;
							}
						}
						holes++;
					}
				}
				r = which;
				position = origin.slice();
				while (r < s) {
					position = add_list(position, direction);
					++r;
					elem = axes(f, position);
					if (typeof elem === 'string') {
						if (elem !== splitext[r]) {
							canyoucomplete = false;
							r--;
							break;
						}
					} else {
						if (typeof elem === 'object') {
							if (!elem[splitext[r]]) {
								canyoucomplete = false;
								r--;
								break;
							}
						}
						holes++;
					}
				}
				if (!canyoucomplete) {
					holes = Infinity;
				}
				return ([which, holes]);
			};
			var result = {};
			splitext.forEach(function (char, index){
				if (typeof result[char] === 'undefined') {
					result[char] = {};
				}
				if (!result[char]) {
					return 0;
				}
				choice.every(function (dtrn){
					var x = longest_substr(index, c, dtrn);
					if(!x){
						result[char] = null;
					} else {
						var key = coordinate_to_string(dtrn);
						if (!result[char][key]) {
							result[char][key] = [];
						}
						result[char][key].push(x);
					}
					return x;
				});
			});
			return result;
		};
		var update_chars_data = function (diff, char){
			var expand_range = function (
				ranges,
				diff,
				drtn,
				movements
			) {
				var positive = coordinate_to_string(drtn);
				var negative = coordinate_to_string(drtn.map(function (e){
					return -e;
				}));
				Object.keys(ranges).forEach(function (can_be_taken){
					var is_collapse;
					is_collapse = Object.keys(ranges[can_be_taken][positive]).some(function (e){
						if (!isFinite(e[1])) {
							return false;
						}
						if (t[e[0] - movements] !== char) {
							e[1] = Infinity;
							return false;
						}
						e[1]--;
						if (e[1]) {
							return false;
						}
						return true;
					});
					if (is_collapse) {
						ranges[can_be_taken] = null;
						return;
					}
					is_collapse = Object.keys(ranges[can_be_taken][negative]).some(function (e){
						if (!isFinite(e[1])) {
							return false;
						}
						if (t[e[0] + movements] !== char) {
							e[1] = Infinity;
							return false;
						}
						e[1]--;
						if (e[1]) {
							return false;
						}
						return true;
					});
					if (is_collapse) {
						ranges[can_be_taken] = null;
					}
				});
				return ranges;
			};
			var f = temporary_fields[0];
			choice.forEach(function (drtn){
				var changed = diff.slice();
				var movements = 0;
				while (++movements < s) {
					changed = add_list(changed, drtn);
					axes(f.field, changed, function (e){
						switch(typeof e){
						case 'string':
							return e;
						case 'undefined':
							f.cand[0].push(changed);
							return show_locatable_chars(changed);
						case 'object':
							return expand_range(
								e,
								diff,
								drtn,
								movements
							);
						}
					});
				}
			});
			if (typeof deb !== 'undefined') {
			}
			f.cand[1] = show_candidates(f.field, f.cand[0]);
			f.quant--;
			return temporary_fields[0] = f;
		};
		var wrap_first_map = function () {
			var coordinate = ansO.slice();
			var candidate = [];
			var fill_target = function () {
				var a = ansO.slice();
				var i = s;
				while (i--) {
					axes(f, a, t[i]);
					a = add_list(a, v);
				}
			};
			var wrap_tile = function (point) {
				choice.forEach(function (e) {
					var near = add_list(point, e);
					axes(f, near, function (e) {
						if(typeof e === 'undefined'){
							candidate.push(near.slice());
							var res = show_locatable_chars(near);
							return copy_field(res);
						} else {
							return e;
						}
					});
					if (typeof deb !== 'undefined') {
						forDebug.showAnythingFromObject(f);
					}
				});
			};
			fill_target();
			var i = s;
			while (i--) {
				wrap_tile(coordinate);
				coordinate = add_list(coordinate, v);
			}
			return [candidate, show_candidates(f, candidate)];
		};
		var set_next_field = function (){
			var reject_once = function (arr, coor){
				var inspector = function (x){
					return x.every(function (elem, index){
						return elem === coor[index];
					});
				};
				return arr.some(function (e,i){
					return inspector(e) && arr.splice(i,1);
				});
			};
			var seed = 1.0 - Math.sqrt(rand_with_seeds()[0]);
			var selector = temporary_fields[0].cand[1];
			var len = selector.length;
			var i = 0;
			for (;;) {
				seed -= (1 / selector[i][1]);
				if (seed <= 0) {
					break;
				}
				i++;
				if (i === len) {
					i = 0;
				}
			}
			seed = 1.0 - Math.sqrt(rand_with_seeds()[0]);
			var dselector = selector[i][0];
			var data;
			len = dselector[1].length;
			i = 0;
			for (;;) {
				seed -= (1 / dselector[1][i][1]);
				if (seed <= 0) {
					break;
				}
				i++;
				if (i === len) {
					i = 0;
				}
			}
			data = [dselector[0].slice(), dselector[1].splice(i, 1)[0][0]];
			if (!dselector.length) {
				selector.splice(i, 1);
			}
			var field = {
				field: copy_field(temporary_fields[0].field),
				cand: copy_field(temporary_fields[0].cand),
				quant: copy_field(temporary_fields[0].quant)
			};
			reject_once(field.cand[0], data[0]);
			axes(field.field, data[0], data[1]);
			if (data[1]) {
				temporary_fields.unshift(field);
			} else {
				temporary_fields[0] = field;
			}
			return data;
		};
		var candidate = wrap_first_map();
		var quantity = sides.reduce(function (prev, curr){
			return prev * curr;
		});
		quantity -= s;
		temporary_fields.unshift({
			field: f,
			cand: candidate,
			quant: quantity
		});
		// loop
		while (temporary_fields[0].quant) {
			var cand = temporary_fields[0].cand[1];
			if (cand.length) {
				var data = set_next_field();
				var next = update_chars_data(data[0], data[1]);
				if (!next) {
					temporary_fields.shift();
				}
			} else {
				temporary_fields.shift();
				if (!temporary_fields.length) {
					return null;
				}
			}
		}
		return temporary_fields[0].field;
	};
	var ansO = rev_rand(sides, s);
	// console.log(ansO);
	var pick_vector = function (ansO, sides, s) {
		//
		var radixs = [1];
		var vlist = ansO.map(function (e, i){
			var cand = [0];
			if (e + 1 >= s) {
				cand.push(-1);
			}
			if (sides[i] - e >= s) {
				cand.push(+1);
			}
			radixs.unshift(radixs[0] * cand.length);
			return cand;
		});
		var howmany = radixs.shift();
		radixs.reverse();
		var intseed = rand_with_seeds(howmany - 1)[0] + 1;
		var v = vlist.map(function (e, i) {
			return e[Math.floor(intseed / radixs[i]) % e.length];
		});
		return v;
	};
	var v = pick_vector(ansO, sides, s);
	return create(ansO, v);
};

Game.forHTML = {};

Game.forHTML.writeTable = function (h, w, field){
	var table = gebId("board");
	var html = "";
	for (var i = 0; i < h; i++) {
		html += "<tr>";
		for(var j = 0; j < w; j++) {
			html += `<th>${field[Game.coordinate_to_string([i,j])]}</th>`;
		}
		html += "</tr>";
	}
	table.innerHTML += html;
};

Game.forHTML.gamestart = function (result, field){
	gebId("game-body").style.visibility = "visible";
	gebId("message").innerHTML = `Find <font color=red>${result.hider}</font>`;
	Game.forHTML.writeTable(...result.size[0], field);
};

function startup(){
	gebId("settings-confirm").onclick = function (){
		var rands = function (howmany){
			return ' '.repeat(howmany || 16).split('').map(Math.random);
		};
		var checker = function (){
			var boardsizes = [
				[[ 8,  8], 1],
				[[16, 16], 10],
				[[24, 24], 60]
			];
			var checktext = function (text, boardsize) {
				if (!text) {
					return "隠す文字列を入力して下さい";
				} else if (text.split('').every(function (e){return e === text[0]})) {
					return "文字は2種類以上なければなりません";
				} else if (boardsize && boardsize.every(function (e){
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
			if (!boardsize) {
				errormess.push("難易度を選択して下さい");
			}
			var text = gebId("texttofind").value;
			var isinvalid = checktext(text, boardsize[0]);
			if (isinvalid) {
				errormess.push(isinvalid);
			}
			if (errormess.length) {
				alert(errormess.join('\n'));
				return null;
			} else {
				return {size: boardsize, hider: text};
			}
		};
		var shower = function (result){
			//
			gebId("settings").style.opacity = 0;
			var field = Game.makeField(result.size[0], result.hider, rands()); // TODO: 並列してグラフィック
			Game.forHTML.gamestart(result, field);
			// TODO: ゲーム本体
		};
		var result = checker();
		if (!result) {
			return false;
		}
		shower(result);
	};
}

// TODO: コメントつけろ
// TODO: オーダーおとせ

// function view_result (sides, t){
// 	console.log("sides: ", sides, ", t: ", t);
// 	console.time(   "view_result");
// 	var result = Game.makeField(sides, t,
// 		(":".repeat(16).split('').map(function (){
// 			return Math.random();
// 		})));
// 	console.timeEnd("view_result");
// 	console.log(result.map(function (e){return e.join('')}).join('\n'));
// }

// view_result([16, 16], "flandre");
// view_result([16, 16], "remilia");
// view_result([ 8,  4], "scarlet");
// view_result([ 7, 10], "onion"  );

// view_result([ 8,  8], "escape"); // Accepted,   239.900ms
// view_result([16, 16], "escape"); // Accepted,  3383.734ms
// view_result([24, 24], "escape"); // Accepted, 14918.606ms

// view_result([30, 30], "escape"); // Failed (too large object)
