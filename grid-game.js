Object.prototype.extend = function (extension) {
    var hasOwnProperty = Object.hasOwnProperty;
    var object = Object.create(this);

    for (var property in extension)
        if (hasOwnProperty.call(extension, property) ||
            typeof object[property] === "undefined")
                object[property] = extension[property];

    return object;
};

var gridgame = {};

gridgame.add_event_listener = function(el, type, fn) { 
    if (el.addEventListener) { 
        el.addEventListener(type, fn, false); 
        return true; 
    } else if (el.attachEvent) { 
        var r = el.attachEvent("on" + type, fn); 
        return r; 
    } else { 
        return false; 
    } 
};

gridgame.Board = {
	create: function(rows, cols, func_valid_idx, constraints) {
		var self = Object.create(this);
	},
	constraints: [],
    possible_values: [],
    get_idx: function(row, col) {
    },
    get_row_col: function(idx) {
    },
};

gridgame.Constraint = {
	create: function(args) {
		var self = Object.create(this);
    },
};
