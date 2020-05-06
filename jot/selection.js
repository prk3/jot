var util = require("util");
var sequences = require("./sequences");
var jot = require("./index.js");

exports.module_name = 'selection';

function validateSelectionsPair(key, range) {
	if (typeof key !== 'string') {
		throw new Error("Key must be a string.");
	}
	validateSelectionsObj({ [key]: range });
}

function validateSelectionsObj(selections) {
	if (!selections || typeof selections !== "object") {
		throw new Error("Selections must be an object.");
	}
	for (var key in selections) {
		var value = selections[key];

		if (typeof key !== "string") {
			throw new Error("Selections key must be a string.");
		}

		if (value === null) {
			return;
		};

		var isStartAndEnd = !!value
			&& typeof value === "object"
			&& ("start" in value)
			&& ("end" in value);

		if (!isStartAndEnd) {
			throw new Error("Selections value must be null or object with start and end.");
		}

		if (typeof value.start !== "number") {
			throw new Error("Start is not a number.");
		}
		if (typeof value.end !== "number") {
			throw new Error("End is not a number.");
		}
		if (value.start < 0 || Math.round(value.start) !== value.start) {
			throw new Error("Start must be a non-negative integer.");
		}
		if (value.end < 0 || Math.round(value.end) !== value.end) {
			throw new Error("End must be a non-negative integer.");
		}
		if (value.end < value.start) {
			throw new Error("Start must be smaller or equal to end.");
		}
	}
}

exports.adjustRange = function (range, index, removed, inserted) {
	var modStart = index;
	var modEnd = index + removed;
	var modBalance = inserted - removed;

	// all changes past range
	if (modStart >= range.end) {
		return range;
	}
	// all changes before range
	if (modEnd <= range.start) {
		return {
			start: range.start + modBalance,
			end: range.end + modBalance,
		};
	}
	// removals and replacements crossing range start
	if (modStart < range.start && modEnd > range.start && modEnd <= range.end) {
		return {
			start: modStart + inserted,
			end: range.end + modBalance,
		};
	}
	// removals and replacements crossing range end
	if (modStart >= range.start && modStart < modEnd && modEnd > range.end) {
		return {
			start: range.start,
			end: modStart,
		};
	}
	// removals and replacements inside range (inc. covering)
	if (modStart >= range.start && modEnd <= range.end) {
		return {
			start: range.start,
			end: range.end + modBalance,
		};
	}
	// removals and replacements covering range +
	if (modStart <= range.start && modEnd >= range.end) {
		return {
			start: modStart,
			end: modStart,
		};
	}
	throw new Error("Unhanded range adjustment.", arguments);
}

exports.SELECT = function () {
	if (arguments.length === 2) {
		var key = arguments[0];
		var range = arguments[1];

		validateSelectionsPair(key, range);
		this.selections = { [key]: range };

	} else if (arguments.length === 1) {
		var selections = arguments[0];

		validateSelectionsObj(selections);
		this.selections = selections;
	} else {

	}

	Object.freeze(this.selections);
	Object.freeze(this);
}

exports.SELECT.prototype = Object.create(jot.BaseOperation.prototype); // inherit
jot.add_op(exports.SELECT, exports, "SELECT");

exports.SELECT.prototype.inspect = function () {
	return util.format(
		"<SELECT [%s]>",
		Object.entries(this.selections).map(function (entry) {
			var range = entry[1] ? (entry[1].start + "-" + entry[1].end) : "NULL";
			return entry[0] + ": " + range;
		}).join(", ")
	);
}

exports.SELECT.prototype.visit = function (visitor) {
	// A simple visitor paradigm. Replace this operation instance itself
	// and any operation within it with the value returned by calling
	// visitor on itself, or if the visitor returns anything falsy
	// (probably undefined) then return the operation unchanged.
	return visitor(this) || this;
}

exports.SELECT.prototype.internalToJSON = function (json, protocol_version) {
	json.selections = this.selections;
}

exports.SELECT.internalFromJSON = function (json, protocol_version, op_map) {
	return new exports.SELECT(json.selections);
}

exports.SELECT.prototype.apply = function (document, metaRef, path = "") {
	if (metaRef) {
		var documentSelections = Object.assign(
			{},
			metaRef.meta && metaRef.meta.selections,
		);
		var fieldSelections = Object.assign(
			{},
			documentSelections[path],
			this.selections,
		);
		for (var id in fieldSelections) {
			if (fieldSelections[id] === null) {
				delete fieldSelections[id];
			}
		}
		documentSelections[path] = fieldSelections;
		if (Object.keys(fieldSelections).length === 0) {
			delete documentSelections[path];
		}
		metaRef.meta = Object.assign(
			{},
			metaRef.meta,
			{ selections: documentSelections },
		);
	}
	return document;
}

exports.SELECT.prototype.simplify = function (aggressive) {
	// Returns a new operation that is a simpler version
	// of this operation.

	if (Object.keys(this.selections).length === 0) {
		return new jot.NO_OP();
	}

	return this;
}

exports.SELECT.prototype.inverse = function (document) {
	// Returns a new atomic operation that is the inverse of this operation.
	// TODO!
	throw new Error("not implemented");

	var new_ops = [];
	this.ops.forEach(function(op) {
		new_ops.push(op.inverse(document));
		document = op.apply(document);
	})
	new_ops.reverse();
	return new exports.LIST(new_ops);
}

exports.SELECT.prototype.atomic_compose = function (other) {
	// Returns an operation that has the same result as this
	// and other applied in sequence (this first, other after).

	if (other instanceof exports.SELECT) {
		var newSelections = Object.assign({}, this.selections, other.selections);
		return new exports.SELECT(newSelections);
	}

	// can't compose with other operations
	return null;
}

exports.SELECT.prototype.rebase_functions = function () {
	// Rebase_functions is a function because we need to delay
	// evaluation of jot.PATCH until PATCH it is actually defined.
	return [
		[exports.SELECT, function (other, conflictless) {
			// Nothing complex here, we assume people control only their selections.
			return [this, other];
		}],
		[jot.PATCH, function (other, conflictless) {
			var newSelections = sequences.adjustSelectionsAgainstPatch(this.selections, other);
			return [new exports.SELECT(newSelections), other];
		}],
	];
}

exports.SELECT.prototype.drilldown = function(index_or_key) {
	return new exports.NO_OP();
}

exports.createRandomOp = function(doc, context) {
	var selections = {};
	for (var i = Math.floor(Math.random() * 3 + 1); i >= 0; i--) {
		var key = String(Math.floor(Math.random() * 10));
		var start;
		var end;
		var isNull = Math.random() > 0.5;

		if (!isNull) {
			start = Math.floor(Math.random() * 20);
			end = start + Math.floor(Math.random() * 20);
		}
		selections[key] = isNull ? null : { start: start, end: end };
	}
	return new exports.SELECT(selections);
}
