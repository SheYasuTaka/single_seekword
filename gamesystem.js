var makeField = function (sides, t, seeds, hash, isworker) {
	// The core function
	"use strict";

	var s = t.length;
	var dimention = sides.length;

	var rand_with_seeds = function (range_size) {
		var seed = seeds.shift();
		var seed_to_use = seed * (range_size || (1 - seed) * 4);
		var result = Math.floor(seed_to_use);
		seeds.push(seed_to_use - result/* || 0.9*/);
		return [seed, result];
	};

	var shuffle_rand = function (seed, categories) {
		// if (seeds[0]) console.log(seed, categories, seeds[0]);
		 
		var data = rand_with_seeds(categories);
		
		var result = (data[1] + data[0]) / categories;
		
		// console.log(result);

		return result;
	};

	var isexist = function (array) {
		return array.every((e, i) => {
			return (0 <= e) && (e < sides[i]);
		});
	};

	var copy_field = function (x) {
		// for an Object, an Array, or a PrimitiveValue.
		var result;

		try {
			var strfied = JSON.stringify(x);
			result = JSON.parse(strfied);
		} catch(e) {
			var initial;
			var is_obj = [Array, Object].some((Constructor) => {
				if (x instanceof Constructor) {
					initial = new Constructor();
					return true;
				} else {
					return false;
				}
			});

			if (is_obj) {
				Object.keys(x).forEach((key) => {
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
			var whole = sides.reduce((sum, e) => sum * e);
			var redun = 1;

			sides.forEach((e, i) => {
				redun *= Math.min(Math.max(0, s * 2 - S[i]), e);
			});
			range += whole - redun;

			sides = sides.map((e) => e - 2);

			if (sides.some(e => e <= 0)) break;
		}

		var index = S.map(() => 0);

		var incr = () => {
			var i = dimention;
			while (i--) {
				if (++index[i] < S[i]) break;
				index[i] = 0;
			}
		};

		var steam = () => {
			var minIndex = Infinity;
			var redunFlag = true;

			index.forEach((e, i) => {
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

		for (var pin = rand_with_seeds(range)[1]; pin > 0; incr()) pin -= steam();
		return index;
	};

	var add_list = (l, r) => {
		return l.map((e, i) => {
			return e + r[i];
		});
	};

	var sub_list = (l, r) => {
		return l.map((e, i) => {
			return e - r[i];
		});
	};

	var create = function (ansO, v) {
		var choice = (len => {
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

				ans.push(v.map((e) => list[e]));
			}
		})(dimention);

		var f = {};
		var splitext = t.split('');
		var temporary_fields = [];

		var axes = function (array, index, substitune) {
			if (isexist(index)) {
				var strindex = hash(index);

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

			var is_collapse = candidate.some((position) => {
				var count = -1, mins = [];
				var data = axes(f, position);

				var wide_min = "Infinity";

				Object.keys(data).forEach((can_be_taken) => {
					var eachar = data[can_be_taken];

					// console.log(can_be_taken);
					// console.log("eachar:\n", eachar, "\n=======");

					if (!eachar) return;

					// console.log(can_be_taken);

					count++;

					var narrow_min = "Infinity";
					Object.keys(eachar).forEach((e) => {
						var each_drtn = eachar[e];
						each_drtn.forEach((e) => {
							var holes = e[1];

							// console.log(narrow_min);

							if (holes < narrow_min) narrow_min = holes;
						});
					});

					mins.push([can_be_taken, narrow_min]);

					if (narrow_min < wide_min) wide_min = narrow_min;
				});

				// if (count < s - 1) {
					// console.log(Object.keys(data).filter((e) => data[e]));
					// console.log(position, count);
				// }

				if (count < 0) return true;

				mins.sort((a, b) => 
					((a[1] - b[1]) || rand_with_seeds()[0] - 1/2)
				);

				var parameter = count * wide_min;
				if (!parameter) parameter = 0;

				// console.log(count, wide_min);
				// console.log("param:", parameter);

				lids.push([[position.slice(), mins], parameter]);

				return false;
			});

			if (is_collapse) {
				return null;
			} else {
				lids.sort((a, b) => 
					((a[0][1] - b[0][1]) || rand_with_seeds()[0] - 1/2)
				);
				return lids;
			}
		};

		var show_locatable_chars = function (c) { // [char][dtrn][n]
			var longest_substr = function (which, origin, direction) {
				var l = which, r = which;
				var holes = 0;
				var position, elem;

				// console.log(temporary_fields.length);
				// console.log("w", which);

				var fld = temporary_fields.length ? temporary_fields[0].field : f;

				position = origin.slice();
				while (--l >= 0) {
					position = sub_list(position, direction);

					elem = axes(fld, position);

					// console.log("l,", l, position, typeof elem, holes, (typeof elem === 'string' ? elem : ''));

					if (!isexist(position) ||
						  typeof elem === 'string' && elem !== splitext[l] ||
						  typeof elem === 'object' && !elem[splitext[l]]) {
						holes = "Infinity";

						l++;

						break;
					} else if (holes !== 'Infinity' && typeof elem !== 'string') {
						holes++;
					}

					// console.log(holes);
				}

				position = origin.slice();
				while (++r < s) {
					position = add_list(position, direction);

					elem = axes(fld, position);

					// console.log("r,", r, position, typeof elem, holes, (typeof elem === 'string' ? elem : ''));

					if (!isexist(position) ||
						  typeof elem === 'string' && elem !== splitext[r] ||
						  typeof elem === 'object' && !elem[splitext[r]]) {
						holes = "Infinity";

						r--;

						break;
					} else if (holes !== 'Infinity' && typeof elem !== 'string') {
						holes++;
					}

					// console.log(holes);
				}

				// console.log("lss", origin, holes);
				// if (!holes) console.log(origin, where);
				// console.log();

				if (holes) {
					return ([which, holes]);
				} else {
					return null;
				}
			};

			var result = {};
			splitext.forEach((char, index) => {
				if (typeof result[char] === 'undefined') result[char] = {};
				if (!result[char]) return 0;

				choice.every((dtrn) => {
					var x = longest_substr(index, c, dtrn);
					if(!x) {
						result[char] = null;
					} else {
						var key = hash(dtrn);

						if (!result[char][key]) {
							result[char][key] = [];
						}

						// console.log(c, x);

						result[char][key].push(x);

						console.log(result[char][key].length);

					}

					return x;
				});

			});

			// if (result) console.log(c, ...Object.keys(result).map(e => result[e] && Object.keys(result[e]).map(d => result[e][d])));

			return result;
		};

		var update_chars_data = function (diff, char) {
			var expand_range = function (ranges, diff, drtn, movements) {
				var positive = hash(drtn);
				var negative = hash(drtn.map(e => -e));

				// console.log(positive, negative);

				Object.keys(ranges).forEach((can_be_taken) => {
					var is_collapse;

					var status = ranges[can_be_taken];

					if (!status) {
						return;
					}

					is_collapse = Object.keys(status[positive]).some((e) => {

						e = status[positive][e];

						// console.log();

						if (!isFinite(e[1])) return false;

						if (t[e[0] - movements] !== char) {
							// console.log("E-", e, char, e[0], movements);
							e[1] = "Infinity";
							return false;
						}

						e[1]--;

						if (e[1]) return false;

						// console.log("Oops", diff, can_be_taken);

						return true;
					});

					// if (status[positive].length > 1) console.log(status[positive]);

					// console.log(is_collapse);

					if (is_collapse) {
						ranges[can_be_taken] = null;
						return;
					}

					is_collapse = Object.keys(status[negative]).some((e) => {

						e = status[negative][e];

						// console.log(diff, can_be_taken, e[1]);

						if (!isFinite(e[1])) return false;

						if (t[e[0] + movements] !== char) {
							// console.log("E+", e, char, e[0], movements);
							e[1] = "Infinity";
							return false;
						}

						e[1]--;

						if (e[1]) return false;

						// console.log("Oops", diff, can_be_taken);

						return true;
					});

					// if (status[negative].length > 1) console.log(status[negative]);

					// console.log(is_collapse);

					if (is_collapse) {
						ranges[can_be_taken] = null;
						return;
					}
				});

				// console.log("?", diff, Object.keys(ranges).filter(e => ranges[e]));

				return ranges;
			};

			var f = temporary_fields[0];

			choice.forEach((drtn) => {
				var changed = diff.slice();
				var movements = 0;

				while (++movements < s) {
					changed = add_list(changed, drtn);

					var lochars = axes(f.field, changed, function (e) {
						switch(typeof e) {
						case 'string':
							return e;
						case 'undefined':
							f.cand[0].push(changed);
							return show_locatable_chars(changed);
						case 'object':
							return expand_range(e, diff, drtn, movements);
						}
					});
					// console.log(...Object.keys(lochars).map((e)=>Object.keys(lochars[e]).map(d=>lochars[e][d])));
				}
			});

			f.cand[1] = show_candidates(f.field, f.cand[0]);
			f.quant--;
			temporary_fields[0] = f;
			return f.cand[1];
		};

		var wrap_first_map = function () {
			var coordinate = ansO.slice();
			var candidate = [];

			var fill_target = () => {
				var a = ansO.slice();

				var i = s;
				while (i--) {
					axes(f, a, t[i]);
					a = add_list(a, v);
				}
			};

			var wrap_tile = function (point) {
				choice.forEach((e) => {
					var near = add_list(point, e);
					axes(f, near, (e) => {
						if (typeof e === 'undefined') {
							candidate.push(near.slice());
							var res = show_locatable_chars(near);
							return copy_field(res);
						} else {
							return e;
						}
					});
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

		var set_next_field = () => {
			var reject_once = (arr, coor) => {
				var inspector = x => hash(x) === hash(coor);

				return arr.some((e, i) => (inspector(e) && arr.splice(i,1)));
			};

			var seed = 1.0 - Math.sqrt(rand_with_seeds()[0]);
			var iselector = temporary_fields[0].cand[1];
			var len = iselector.length;

			// console.log("Line 443");

			var i = 0;
			for (;;) {
				// console.log(selector[i][1], seed);

				seed -= shuffle_rand(1 / iselector[i][1], len + 1) * (len + 1);

				// console.log("Line 451");

				if (seed <= 0) break;

				i++;
				if (i === len) i = 0;
			}

			var isonly = !iselector[i][1];

			seed = 1.0 - Math.sqrt(rand_with_seeds()[0]);
			var jselector = iselector[i][0];
			var data;
			len = jselector[1].length;

			var j = 0;

			// console.log("Line 464")

			for (;;) {
				seed -= shuffle_rand(1 / jselector[1][j][1], len + 1) * (len + 1);

				if (seed <= 0) break;

				j++;
				if (j === len) j = 0;
			}

			// console.log("Line 475");

			// console.log("dsel:", jselector[1]);

			data = [jselector[0].slice(), jselector[1].splice(j, 1)[0][0]];
			if (!jselector[1].length) iselector.splice(i, 1);

			// console.log("data:", data);

			var field = {
				field: copy_field(temporary_fields[0].field),
				cand:  copy_field(temporary_fields[0].cand),
				quant: copy_field(temporary_fields[0].quant)
			};

			reject_once(field.cand[0], data[0]);
			axes(field.field, data[0], data[1]);

			if (isonly) {
				temporary_fields[0] = field;
			} else {
				temporary_fields.unshift(field);
			}

			return data;
		};

		var candidate = wrap_first_map();
		var quantity = sides.reduce((prev, curr) => (prev * curr));
		quantity -= s;

		temporary_fields.unshift({
			field: f,
			cand:  candidate,
			quant: quantity
		});

		// loop
		while (temporary_fields[0].quant) {

			// console.log(temporary_fields.map((e) => e.cand));

			var cand = temporary_fields[0].cand[1];

			// console.log(cand);

			if (isworker) postMessage({
				mode: 'log',
				result: temporary_fields[0].quant
			});
			else
				console.log(temporary_fields[0].quant);

			if (cand.length) {
				// console.log("Line 516");
				var data = set_next_field();
				// console.log(data);
				var next = update_chars_data(data[0], data[1]);
				// console.log("Line 520");
				if (!next) {
					// console.log("shit shift");
					temporary_fields.shift();
				}
			} else {
				temporary_fields.shift();
			}
			if (!temporary_fields.length) return null;
		}

		return temporary_fields[0].field;
	};

	var pick_vector = function (ansO, sides, s) {
		var radixs = [1];
		var vlist = ansO.map((e, i) => {
			var cand = [0];

			if (e + 1 >= s) cand.push(-1);
			if (sides[i] - e >= s) cand.push(+1);

			radixs.unshift(radixs[0] * cand.length);

			return cand;
		});

		var howmany = radixs.shift();

		radixs.reverse();

		var intseed = rand_with_seeds(howmany - 1)[1] + 1;
		var v = vlist.map((e, i) => e[Math.floor(intseed / radixs[i]) % e.length]);

		return v;
	};

	var ansO = rev_rand(sides, s);
	var v = pick_vector(ansO, sides, s);
	return create(ansO, v);
};

onmessage = function (event) {
	"use strict";

	var res = event.data;
	postMessage({
		mode: 'result',
		result: makeField(...res.args, eval(`(${res.hash})`), true)});
};

function f(...rest) {
	var result = makeField(...rest);
	for (var i = 0; i < rest[0][0]; i++) {
		var s = '';
		for (var j = 0; j < rest[0][1]; j++) {
			s += result[rest[3]([i, j])];
		}
		console.log(s);
	}
}


// if (typeof deb !== 'undefined') {
	f([16, 16], "the", '"'.repeat(16).split('').map(Math.random), (x)=>x.join(' '));
// }
