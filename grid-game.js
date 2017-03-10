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

gridgame.range = function(max) {
    var retval = [];
    for (var ii = 0; ii < max; ii++) {
        retval.push(ii);
    }
    return retval;
};

gridgame.array_equals = function(arr1, arr2) {
    if (arr1.length != arr2.length) {
        return false;
    }
    for (var ii = 0; ii < arr1.length; ii++) {
        if (arr1[ii] != arr2[ii]) {
            return false;
        }
    }
    return true;
};

gridgame.Board = {
    create: function(rows, cols, func_valid_idx, func_possible_values) {
        var self = Object.create(this);
        self.rows = rows;
        self.cols = cols;
        if (!func_possible_values) {
            func_possible_values = function(idx) { return gridgame.range(rows); };
        }
        self.func_possible_values = func_possible_values;
        self.possible_values = [];
        for (var ii = 0; ii < rows * cols; ii++) {
            self.possible_values.push(self.func_possible_values(ii));
        }
        if (!func_valid_idx) {
            func_valid_idx = function(idx) { return true; }
        }
        self.func_valid_idx = func_valid_idx;
        return self;
    },
    row_col_to_idx: function(row, col) {
        return row * this.cols + col;
    },
    idx_to_row_col: function(idx) {
        return [Math.floor(idx / this.cols), idx % this.cols];
    },
    get_by_idx: function(idx) {
        return this.possible_values[idx];
    },
    get_by_row_col: function(row, col) {
        return this.get_by_idx(this.row_col_to_idx(row, col));
    },
    set_possible_value: function(idx, value) {
        if (gridgame.array_equals(this.possible_values[idx], [value])) {
            return false;
        }
        if (!this.possible_values[idx].includes(value)) {
            return false;
        }
        this.possible_values[idx] = [value];
        return true;
    },
    remove_possible_values: function(idx, values) {
        for (var ii = 0; ii < values.length; ii++) {
            if (this.possible_values[idx].includes(value)) {
                this.possible_values[idx] = this.possible_values[idx].filter(
                    function (idx, val) { return !(values.includes(val); });
                return true;
            }
        }
        return false;
    },
};

gridgame.Update = {
    create: function(idx, action, value) {
        var self = Object.create(this);
        self.idx = idx;
        self.action = action;
        self.value = value;
    },
};

gridgame.Constraint = {
    create: function(args) { var self = Object.create(this); },
    check: function(board, update) { return true; },
    propagate: function(board, update) { return true; },
};

gridgame.Game = {
    create: function(rows, cols, constraints, func_valid_idx) {
        var self = Object.create(this);
        self.board = gridgame.Board.create(rows, cols, func_valid_idx);
        self.constraints = constraints;
    },
    apply_update: function(update) {
    }
    get_implied_updates: function() {
    },
    
};

