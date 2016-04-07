
var Game = {},
	l = function(s) {
		return document.getElementById(s);
	};

// var forDebug = {};

// var charReplace = function (str, index, char){
// 	return str.replace(new RegExp('(^.{' + index + '}).'), '$1' + char);
// };

// forDebug.showAnythingFromObject = function (object){
// 	var str = Object.keys(object).filter(function (e){
// 		return typeof object[e] !== 'undefined';
// 	});
// 	console.log(str.join(', '));
// };

// forDebug.show2Dmap = function (map, h, w){
// 	var str = Array(h).join('_').split('_').map(function (){
// 		return Array(w).join('_').split('_').map(function (){return '-'});
// 	});
// 	map.forEach(function (e){
// 		str[e[0]][e[1]] = '#';
// 	});
// 	console.log(str.map(function (e){return e.join('')}).join('\n'));
// 	console.log();
// };

// forDebug.show2DrealMapStr = function (result, sides){
// 	console.log();
// 	if (!result) {
// 		console.log("=== impossible ===");
// 	} else {
// 		if (sides.length !== 2) {
// 			console.log("=== cannot ouput ===");
// 		} else {
// 			for (var i = 0; i < sides[0]; i++){
// 				var str = '';
// 				for (var j = 0; j < sides[1]; j++){
// 					str += result[i + '_' + j];
// 				}
// 				console.log(str);
// 			}
// 		}
// 	}
// 	console.log();
// };

// forDebug.show2DrealMap = function (f, h, w){
// 	var ctos = function (c) {
// 		return c.join('_');
// 	};
// 	for (var i = 0; i < h; i++){
// 		var str = '';
// 		for (var j = 0; j < w; j++){
// 			switch (typeof f[ctos([i,j])]){
// 			case 'undefined':
// 				str += '.';
// 				break;
// 			case 'string':
// 				str += '#';
// 				break;
// 			case 'object':
// 				str += '=';
// 				break;
// 			}
// 		}
// 		console.log(str);
// 	}
// 	console.log();
// };

Game.makeField = function (sides, t, seeds) {
	// The core function
	var s = t.length;
	var dimention = sides.length;
	// var f = (function (s) {
	// 	var setArray = function(a) {
	// 		var p = a.shift();
	// 		if (a.length) {
	// 			var x = [];
	// 			for (var i = 0; i < p; i++) {
	// 				x.push(setArray(a.slice(0)));
	// 			}
	// 			return x;
	// 		} else {
	// 			return new Array(p);
	// 		}
	// 	};
	// 	return setArray(s.slice(0));
	// })(sides);
	var rand_with_seeds = function (range_size){
		// console.log("seeds: ", seeds.map(function (e){
		// 	return(isFinite(e))?'#':'-';
		// }).join(' '), range_size);
		var seed = seeds.shift();
		// console.log("seed: ", seed);
		var seed_to_use = seed * (range_size || (1 - seed) * 4);
		// console.log("stu: ", seed_to_use);
		var result = Math.floor(seed_to_use);
		// console.log("result: ", result);
		seeds.push(seed_to_use - result);
		return [seed, result];
	};
	var coordinate_to_string = function (c) {
		return c.join('_');
	};
	var string_to_coordinate = function (s) {
		return s.split('_').map(function (e){return parseInt(e, 10)});
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
			// console.log("length:");
			var strfied = JSON.stringify(x);
			// console.log(strfied.length);
			// console.log(strfied);
			result = JSON.parse(strfied);
			// console.log("=======");
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
			// if (arguments[3]) {
				// console.log("in axes: ", Object.keys(array).join(' '));
				// console.log("f (in) : ", Object.keys(f).join(' '));
			// }
			if (isexist(index)) {
				var strindex = coordinate_to_string(index);
				// console.log("strindex: ", strindex);
				if (arguments.length >= 3) {
					var isfunc = (typeof substitune === 'function');
					// if (arguments[3]) {
					// 	console.log("originl: ", array[strindex]);
					// }
					array[strindex] = (isfunc ? substitune(array[strindex]) : substitune);
				}
				// if (arguments[3]) {
				// 	console.log("f[", index, "] << ", typeof array[strindex]);
				// 	console.log("Bool: ", !!array[strindex]);
				// }
				// if (arguments[3]) {
				// 	console.log("inax");
				// 	forDebug.showAnythingFromObject(array);
				// }
				return array[strindex];
			} else {
				return void 0;
			}
		};
		var show_candidates = function (f, candidate) {
			// console.time("show_candidates");
			var lids = [];
			// console.log("cand: ", typeof candidate);
			var is_collapse = candidate.some(function (position){
				var count = -1, mins = [];
				var data = axes(f, position);
				// console.log("pos: ", position, "data: ", typeof data);
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
				// console.log(" min[1]s: ", mins.map(function (e){
				// 	return e[1];
				// }).join(' '));
				// mins = mins.map(function (e){
				// 	return e[0];
				// });
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
				// console.log("lids: ", typeof lids);
				// return lids.map(function (e){
				// 	return e[0];
				// });
				// console.log(lids[0] === lids[1]);
				// console.log("lids, ");
				// console.log(
					// (lids[0] && [lids[0][1], lids[0][0]]),
					// (lids[1] && [lids[1][1], lids[1][0]]));
				// console.log("lids[0][0]: ", lids[0][0]);
				// console.timeEnd("show_candidates");
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
			// f = copy_field(f);
			// f.cand[1].shift()[1];
			// reject_once(f.cand[0], diff);
			// axes(f.field, diff, char);
			// console.log("diff: ", diff);
			choice.forEach(function (drtn){
				var changed = diff.slice();
				var movements = 0;
				// console.log("first: ", changed);
				while (++movements < s) {
					// console.log("mov: ", movements, s);
					// console.log("drtn: ", drtn);
					changed = add_list(changed, drtn);
					// console.log("coor: ", changed);
					axes(f.field, changed, function (e){
						// console.log("e: ", e);
						switch(typeof e){
						case 'string':
							return e;
						case 'undefined':
							f.cand[0].push(changed);
							// console.log("f.cand[0] << ", changed);
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
				// console.log();
			});
			// console.log("cand[0]: ", f.cand[0].join(' '));
			if (typeof deb !== 'undefined') {
				forDebug.show2Dmap(f.cand[0], sides[0], sides[1]);
				forDebug.show2DrealMap(f.field, sides[0], sides[1]);
			}
			// console.log("f.cand[0]: ", typeof f.cand[0]);
			// console.log("f.cand: ", f.cand);
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
					// console.log("point: ", point, ", e:", e,
					// ", near: ",near);
					axes(f, near, function (e) {
						// console.log("near: ", near, ", e: ", e);
						// console.log("typeof e: ", typeof e);
						if(typeof e === 'undefined'){
							// console.log("cand << ", near);
							candidate.push(near.slice());
							if (typeof deb !== 'undefined'){
								forDebug.show2Dmap(candidate, sides[0], sides[1]);
								forDebug.show2DrealMap(f, sides[0], sides[1]);
							}
							// console.log();
							// return show_locatable_chars(near);
							var res = show_locatable_chars(near);
							// console.log("give you ", typeof res);
							// console.log("res: ", res);
							// console.log("cf: wrap_tile (543)");
							return copy_field(res);
						} else {
							return e;
						}
					}, true);
					// console.log("returned: " ,ret);
					// console.log("f (out): ", Object.keys(f).join(' '));
					// console.log("outax");
					if (typeof deb !== 'undefined') {
						forDebug.showAnythingFromObject(f);
					}
					// console.log();
				});
			};
			fill_target();
			var i = s;
			while (i--) {
				wrap_tile(coordinate);
				coordinate = add_list(coordinate, v);
			}
			// console.log("cand: ", candidate.join(' '));
			if (typeof deb !== 'undefined') {
				forDebug.show2Dmap(candidate, sides[0], sides[1]);
				forDebug.show2DrealMap(f, sides[0], sides[1]);
			}
			// console.log("ansO: ", ansO, ", v: ", v);
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
			// console.time("bef-cf");
			var seed = 1.0 - Math.sqrt(rand_with_seeds()[0]);
			var selector = temporary_fields[0].cand[1];
			var len = selector.length;
			var i = 0;
			for (;;) {
				// console.log("seeder:", selector[i][1]);
				seed -= (1 / selector[i][1]);
				// console.log(seed);
				if (seed <= 0) {
					break;
				}
				i++;
				if (i === len) {
					i = 0;
				}
			}
			// var data = selector[i][0].shift(); // *
			seed = 1.0 - Math.sqrt(rand_with_seeds()[0]);
			var dselector = selector[i][0];
			var data;
			len = dselector[1].length;
			i = 0;
			for (;;) {
				// console.log(seed, i);
				seed -= (1 / dselector[1][i][1]);
				if (seed <= 0) {
					break;
				}
				i++;
				if (i === len) {
					i = 0;
				}
			}
			// console.log(dselector);
			// console.log(dselector[i][0]);
			data = [dselector[0].slice(), dselector[1].splice(i, 1)[0][0]];
			// console.log(data);
			if (!dselector.length) {
				selector.splice(i, 1);
			}
			// console.timeEnd("bef-cf");
			// console.time("cf");
			// console.log("cf: snf(626)");
			var field = {
				field: copy_field(temporary_fields[0].field),
				cand: copy_field(temporary_fields[0].cand),
				quant: copy_field(temporary_fields[0].quant)
			};
			// console.timeEnd("cf");
			// console.time("rj");
			reject_once(field.cand[0], data[0]);
			// console.timeEnd("rj");
			// console.log(data);
			// console.time("aft-rj");
			axes(field.field, data[0], data[1]);
			if (data[1]) {
				temporary_fields.unshift(field);
			} else {
				temporary_fields[0] = field;
			}
			// console.timeEnd("aft-rj");
			return data;
		};
		var candidate = wrap_first_map();
		var quantity = sides.reduce(function (prev, curr){
			return prev * curr;
		});
		quantity -= s;
		// console.log("Q.E.D. ", quantity);
		temporary_fields.unshift({
			field: f,
			cand: candidate,
			quant: quantity
		});
		// loop
		while (temporary_fields[0].quant) {
			// console.log(temporary_fields);
			// console.log("top: ", temporary_fields[0].quant);
			var cand = temporary_fields[0].cand[1];
			if (cand.length) {
				// var data = cand[0][0].shift();
				// if (!data) {
				// 	cand.shift();
				// } else {
					// console.log("data: ", data);
					// var is_more_than1 = cand[0][1];
					// console.time("snf");
					var data = set_next_field();
					// console.timeEnd("snf");
					// console.time("ucd");
					var next = update_chars_data(data[0], data[1]);
					// console.timeEnd("ucd");
					if (!next) {
						temporary_fields.shift();
					}
				// }
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
		// var denomins = [];
		// var denomin = 1;
		// var vlist = (function () {
		// 	var a = [];
		// 	for (var i = dimention; i--;) {
		// 		var p = [0];
		// 		if (ansO[i] + 1 >= s) {
		// 			p.push(-1);
		// 		}
		// 		if (sides[i] - ansO[i] >= s) {
		// 			p.push(+1);
		// 		}
		// 		a.unshift(p);
		// 		denomins.unshift(denomin);
		// 		denomin *= p.length;
		// 	}
		// 	return a;
		// })();
		var intseed = rand_with_seeds(howmany - 1)[0] + 1;
		var v = vlist.map(function (e, i) {
			return e[Math.floor(intseed / radixs[i]) % e.length];
		});
		// console.log(v);
		return v;
	};
	var v = pick_vector(ansO, sides, s);
	return create(ansO, v);
};

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
// 	forDebug.show2DrealMapStr(result, sides);
// }

// view_result([16, 16], "flandre");
// view_result([16, 16], "remilia");
// view_result([ 8,  4], "scarlet");
// view_result([ 7, 10], "onion"  );

// view_result([16, 16], "escape"); // Accepted,  3383.734ms
// view_result([24, 24], "escape"); // Accepted, 14918.606ms

// view_result([30, 30], "escape"); // Failed (too large object)
