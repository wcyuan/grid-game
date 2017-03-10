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

gridgame.range = function(min, max) {
    var retval = [];
    for (var ii = min; ii < max; ii++) {
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
        self.valid = true;
        self.rows = rows;
        self.cols = cols;
        if (!func_possible_values) {
            func_possible_values = function(idx) { return gridgame.range(1, rows + 1); };
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
            if (this.possible_values[idx].includes(values[ii])) {
                this.possible_values[idx] = this.possible_values[idx].filter(
                    function (val) { return !values.includes(val); });
                if (this.possible_values[idx].length == 0) {
                    this.valid = false;
                }
                return true;
            }
        }
        return false;
    },
    compute_valid: function() {
        for (var ii = 0; ii < this.possible_values.length; ii++) {
            if (this.possible_values[ii].length == 0) {
                return false;
            }
        }
        return true;
    },
    is_solved: function() {
        for (var ii = 0; ii < this.possible_values.length; ii++) {
            if (this.possible_values[ii].length != 1) {
                return false;
            }
        }
        return true;
    },
    as_string: function(empty_val) {
        if (!empty_val) {
            empty_val = "-";
        }
        var chars = [];
        for (var row = 0; row < this.rows; row++) {
            for (var col = 0; col < this.cols; col++) {
                if (this.possible_values[this.row_col_to_idx(row, col)].length == 1) {
                    chars.push(this.possible_values[this.row_col_to_idx(row, col)][0]);
                } else {
                    chars.push(empty_val);
                }
            }
            chars.push("\n");
        }
        return chars.join("");
    },
};

gridgame.Update = {
    create: function(idx, action, value) {
        var self = Object.create(this);
        self.idx = idx;
        self.action = action;
        self.value = value;
        return self;
    },
    equals: function(update) {
        return (update.idx == this.idx && update.action == this.action && update.value == this.value);
    },
};

gridgame.Constraint = {
    create: function(args) { return Object.create(this); },
    check: function(board, update) { return true; },
    propagate: function(board, update) { return []; },
};

gridgame.Game = {
    create: function(rows, cols, constraints, func_valid_idx) {
        var self = Object.create(this);
        self.board = gridgame.Board.create(rows, cols, func_valid_idx);
        self.constraints = constraints;
        self.updates = [];
        return self;
    },
    set_value: function(row, col, value, board) {
        if (!board) {
            board = this.board;
        }
        this.updates.push(
            gridgame.Update.create(
                board.row_col_to_idx(row, col), "set", value));
    },
    apply_update: function(update, board) {
        if (!board) {
            board = this.board;
        }
        if (update.action == "set") {
            return board.set_possible_value(update.idx, update.value);
        } else if (update.action == "remove") {
            return board.remove_possible_values(update.idx, [update.value]);
        }
    },
    add_updates: function(arr1, arr2) {
        for (var ii = 0; ii < arr2.length; ii++) {
            var matches = arr1.filter(function (val) {
                return val.equals(arr2[ii]);
            });
            if (matches.length == 0) {
                arr1.push(arr2[ii]);
            }
        }
    },
    get_implied_updates: function(update, board) {
        if (!board) {
            board = this.board;
        }
        var updates = [];
        for (var ii = 0; ii < this.constraints.length; ii++) {
            this.add_updates(updates, this.constraints[ii].propagate(board, update));
        }
        return updates;
    },
    solve_step: function(board, updates) {
        if (!board) {
            board = this.board;
        }
        if (!updates) {
            updates = this.updates;
        }
        var had_changes = []
        for (var ii = 0; ii < updates.length; ii++) {
            if (this.apply_update(updates[ii], board)) {
                had_changes.push(updates[ii]);
            }
        }
        updates = [];
        for (var ii = 0; ii < had_changes.length; ii++) {
            this.add_updates(updates, this.get_implied_updates(had_changes[ii], board));
        }
        return updates;
    },
    solve_with_implications: function(board, updates) {
        if (!board) {
            board = this.board;
        }
        if (!updates) {
            updates = this.updates;
        }
        while (updates.length > 0) {
            updates = this.solve_step(board, updates);
        }
        return board;
    },
    solve_with_guessing: function() {
    },
};

gridgame.OneEachConstraint = gridgame.Constraint.extend({
    create: function(idxs) {
        var self = Object.create(this);
        self.idxs = idxs;
        return self;
    },
    check: function(board, update) {
        return true;
    },
    propagate: function(board, update) {
        var updates = [];
        if (!this.idxs.includes(update.idx)) {
            return updates;
        }
        // 1. if any spot has only one value, then remove
        // that value from all the other spots
        if (board.possible_values[update.idx].length == 1) {
            var value = board.possible_values[update.idx][0];
            for (var ii = 0; ii < this.idxs.length; ii++) {
                if (this.idxs[ii] == update.idx) {
                    continue;
                }
                updates.push(gridgame.Update.create(this.idxs[ii], "remove", value));
            } 
        }
        // 2. if there is only one possible place for a value to go
        // that's where it must go.
        for (var value = 1; value <= this.idxs.length; value++) {
            var spots = [];
            for (var ii = 0; ii < this.idxs.length; ii++) {
                if (board.possible_values[this.idxs[ii]].includes(value)) {
                    spots.push(this.idxs[ii]);
                }
            }
            if (spots.length == 1 && board.possible_values[spots[0]].length > 1) {
                updates.push(gridgame.Update.create(spots[0], "set", value));
            }
        }
        return updates;
    },
});

gridgame.SudokuGame = gridgame.Game.extend({
    create: function(rows, cols) {
        var self = Object.create(this);
        if (!rows) { rows = 9; }
        if (!cols) { cols = 9; }
        self.board = gridgame.Board.create(rows, cols);
        self.constraints = [];
        // each row
        for (var row = 0; row < rows; row++) {
            var idxs = [];
            for (var col = 0; col < cols; col++) {
                idxs.push(self.board.row_col_to_idx(row, col));
            }
            self.constraints.push(gridgame.OneEachConstraint.create(idxs));
        }
        // each col
        for (var col = 0; col < cols; col++) {
            var idxs = [];
            for (var row = 0; row < rows; row++) {
                idxs.push(self.board.row_col_to_idx(row, col));
            }
            self.constraints.push(gridgame.OneEachConstraint.create(idxs));
        }
        // squares
        var sqrt = Math.sqrt(rows);
        for (var row = 0; row < rows; row += sqrt) {
            // this only works if rows == cols
            for (var col = 0; col < cols; col += sqrt) {
                var idxs = [];
                for (var ii = 0; ii < sqrt; ii++) {
                    for (var jj = 0; jj < sqrt; jj++) {
                        idxs.push(self.board.row_col_to_idx(row + ii, col + jj));
                    }
                }
                self.constraints.push(gridgame.OneEachConstraint.create(idxs));
            }
        }
        self.updates = [];
        return self;
    },
    init_with_string: function(string) {
        for (var ii = 0; ii < string.length; ii++) {
            var value = Math.round(string.charAt(ii));
            if (!isNaN(value)) {
                var row_col = this.board.idx_to_row_col(ii);
                this.set_value(row_col[0], row_col[1], value);
            }
        }
        return this;
    },
});

