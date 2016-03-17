var Game = {},
	l = function(s) {
		return document.getElementById(s);
	};

Game.makeField = function(sides, t) {
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
		var initial;
		var is_obj = [Object, Array].some(function (Constructor) {
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
			return initial;
		} else {
			return x;
		}
	};
	var rev_rand = function (S, s, seed) {
		var range = 0;
		var sides = S.slice(0);
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
			var MinIndex = Infinity;
			var redunF = true;
			index.forEach(function (e, i) {
				MinIndex = Math.min(MinIndex, e, S[i] - e - 1);
				if (e < S[i] - s || e >= s) {
					redunF = false;
				}
			});
			if (redunF) {
				return 0;
			} else {
				return ++MinIndex;
			}
		};
		for (var pin = Math.floor(seed * range); pin > 0; incr()) {
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
				if (arguments.length >= 2) {
					var isfunc = (typeof substitune === 'function');
					// if (arguments[3]) {
					// 	console.log("originl: ", array[strindex]);
					// }
					array[strindex] = (isfunc ? substitune(array[strindex]) : substitune);
				}
				// if (arguments[3]) {
				// 	console.log("f[", index, "] << ", array[strindex]);
				// }
				return array[strindex];
			} else {
				return void 0;
			}
		};
		var show_candidates = function (candidate) {
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
					mins.push([[position, can_be_taken], narrow_min]);
					if (narrow_min < wide_min) {
						wide_min = narrow_min;
					}
				});
				if (count < 0) {
					return true;
				}
				mins.sort(function (a, b){
					return a[1] - b[1];
				});
				mins = mins.map(function (e){
					return e[0];
				});
				var parameter = count * wide_min;
				lids.push([mins, parameter]);
				return false;
			});
			if (is_collapse) {
				return null;
			} else {
				lids.sort(function (a, b){
					return a[1] - b[1];
				});
				return lids.map(function (e){
					return e[0];
				});
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
		var update_chars_data = function (f, diff, char){
			var expand_range = function (
				ranges,
				diff,
				drtn,
				movements
			) {
				f = copy_field(f);
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
			axes(f.field, diff, char);
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
			f.cand[1] = show_candidates(f.cand[0]);
			if (f.cand[1]) {
				f.quant--;
				return f;
			} else {
				return null;
			}
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
						// console.log("near: ", near, ", e: ", e);
						console.log("typeof e: ", typeof e);
						if(typeof e === 'undefined'){
							// console.log("cand << ", near);
							candidate.push(near.slice());
							var res = show_locatable_chars(near);
							console.log("give you ", typeof res);
							// console.log("res: ", res);
							return copy_field(res);
						} else {
							return e;
						}
					}, true);
					// console.log("f (out): ", Object.keys(f).join(' '));
					console.log("f[", near, "] >> ", axes(f, near/*, function (e){return e}/*, true*/));
					console.log();
				});
			};
			fill_target();
			// console.log("cookie☆: ", Object.keys(f));
			var i = s;
			while (--i) {
				wrap_tile(coordinate);
				coordinate = add_list(coordinate, v);
			}
			console.log(candidate);
			return [candidate, show_candidates(candidate)];
		};
		var candidate = wrap_first_map();
		var quantity = sides.reduce(function (prev, curr){
			return prev * curr;
		});
		quantity -= s;
		console.log(candidate);
		temporary_fields.unshift({
			field: f,
			cand: candidate,
			quant: quantity
		});
		// loop
		while (temporary_fields[0].quant) {
			var cand = temporary_fields[0].cand[1];
			if (cand.length) {
				var data = cand.shift();
				var next = update_chars_data(temporary_fields[0], data[0], data[1]);
				if (next) {
					temporary_fields.unshift(next);
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
	var ansO = rev_rand(sides, s, Math.random());
	console.log(ansO);
	var pick_vector = function (seed) {
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
			radixs.push(radixs[0] * cand.length);
			return cand;
		});
		var howmany = radixs.pop();
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
		var intseed = Math.floor(seed * (howmany - 1)) + 1;
		var v = vlist.map(function (e, i) {
			return e[Math.floor(intseed / radixs[i]) % e.length];
		});
		console.log(v);
		return v;
	};
	var v = pick_vector(Math.random());
	return create(ansO, v);
};

// TODO: コメントつけろ
// TODO: オーダーおとせ

function view_result (sides, t){
	var result = Game.makeField(sides, t);
	if (result){
		console.log(result.map(function (e){Array.prototype.join.apply(e)}).join('\n'));
	} else {
		console.log("failed to make field!");
	}
}

view_result([16, 16], "flandre"); // debug
view_result([16, 16], "remilia");
view_result([ 8,  4], "scarlet");
view_result([ 7, 10], "onion"  );

