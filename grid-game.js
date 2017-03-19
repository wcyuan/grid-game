//
// This works, but isn't very user friendly yet
// As an example, try this:
//
// g = gridgame.SudokuGame.create().init_with_string("...........4..5....63..1.7..15..32.8..9.........6..4...4.....9.3.7.4...25..9..7..")
// g.propagate_once()
// g.board_as_string()
//
// This will print the initial board
//
// g.solve_with_implications()
// g.board.as_string()
//
// That will show solutions that you can achieve with simple rules (just propagating updates)
//
// s = g.solve_with_guessing(null, 1)
// s[0].as_string()
//
// This will show solutions from trial and error (which should always work)
//
// g = gridgame.CapsulesGame.create(7, 7, [[0, 7], [1, 2, 3, 4, 9], [5, 6, 11, 12, 18], [8, 14, 15, 16, 23], [10, 17, 24, 31, 38], [13, 20], [19, 25, 26, 27, 32], [21, 22, 28, 29, 35], [30, 36, 37, 42, 43], [33, 34, 40, 41, 48], [39, 44, 45, 46, 47]])
// g.init_with_string("..4.5.41....3.......1..321..4.......5....33.4.3..")
//

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

gridgame.array_extend = function(arr1, arr2) {
    for (var ii = 0; ii < arr2.length; ii++) {
        arr1.push(arr2[ii]);
    }
    return arr1;
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
        if (!rows) { rows = 9; }
        if (!cols) { cols = 9; }
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
    copy: function() {
        var self = this;
        var board = gridgame.Board.create(self.rows, self.cols, self.func_valid_idx, self.func_possible_values);
        for (var ii = 0; ii < self.possible_values.length; ii++) {
            board.possible_values[ii] = gridgame.array_extend([], self.possible_values[ii]);
        }
        board.valid = self.valid;
        return board;
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
    // Propagate takes an update, and the board after that update
    // has been applied, and figures out whether because of that
    // that update there are other changes we need to make to the
    // board based on this constraint.  It returns a list of updates.
    // If the given update is not provided, then just try to find
    // updates based on the state of the board.
    //
    // propagate holds essentially all of the logic of the Constraint
    // For an example of its use, suppose the update is to set the
    // first slot to X and there are constraints that say that each
    // number can only appear in each row and column once.  In that
    // case, there will be a constraint for each row and a constraint
    // for each column.  When you call propagate on the row constraint
    // for the first row, it should suggest updates to remove X from
    // each of the other slots in that row.
    propagate: function(board, update) { return []; },
};

// The idea behind this class is that each game is a board with constraints, and each
// time you change something on the board, you can run through all the 
// constraints to see if that update generates other updates.
//
// For example, if you know the first spot in a sudoku is a "1", then you
// can find all the contraints that the first spot belongs to (a row constraint,
// a column constraint, and a square constraint), and from each of those, you can
// remove "1" from all the other spots.  Removing "1" from those spots
// might trigger another update, like maybe now one of those spots can only have
// one possible value, so you should set that as its value.
//
// So the logic for figuring out new updates is all in the constraints, in
// the "propagate" function.
//
// The nice thing about this is that you can code up new games of this form relatively
// easily (Sudoku, KenKen, and Capsules all work).
//
// The downside is that you can only have logic that involves a single constraint.
// You can't have logic that looks across multiple constraints at once.
gridgame.Game = {
    create: function(rows, cols, constraints, func_possible_values, func_valid_idx) {
        var self = Object.create(this);
        self.board = gridgame.Board.create(rows, cols, func_valid_idx, func_possible_values);
        if (!constraints) {
            constraints = [];
        }
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
    propagate_once: function(board, updates) {
        if (!board) {
            board = this.board;
        }
        if (!updates) {
            updates = this.updates;
        }
        var had_changes = [];
        for (var ii = 0; ii < updates.length; ii++) {
            if (this.apply_update(updates[ii], board)) {
                if (!board.valid) {
                    return [];
                }
                had_changes.push(updates[ii]);
            }
        }
        updates.splice(0);
        for (var ii = 0; ii < had_changes.length; ii++) {
            this.add_updates(updates, this.get_implied_updates(had_changes[ii], board));
        }
        return updates;
    },
    generate_updates: function(board) {
        var updates = [];
        // If there are no pending updates, loop through all constraints and
        // see if there are any recommended updates that were missed before
        //
        // this should only find updates if some slots were manually filled
        // without propagating the updates afterwards.
        for (var ii = 0; ii < this.constraints.length; ii++) {
            this.add_updates(updates, this.constraints[ii].propagate(board));
        }
        return updates;
    },
    solve_with_implications: function(generate_updates, board, updates) {
        if (!board) {
            board = this.board;
        }
        if (!updates) {
            updates = this.updates;
        }
        if (updates.length == 0 && generate_updates) {
            updates = this.generate_updates(board);
        }
        while (updates.length > 0) {
            updates = this.propagate_once(board, updates);
        }
        return board;
    },
    solve_with_guessing: function(board, num_solutions) {
        if (!board) {
            board = this.board;
        }
        //console.log(board.as_string());
        if (!board.valid) {
            return []; 
        }
        if (board.is_solved()) {
            return [board];
        }
        this.solve_with_implications(true, board);
        if (!board.valid) {
            return [];
        }
        if (board.is_solved()) {
            return [board];
        }
        var solutions = [];
        for (var ii = 0; ii < board.possible_values.length; ii++) {
            if (board.possible_values[ii].length <= 1) {
                continue;
            }
            for (var jj = 0; jj < board.possible_values[ii].length; jj++) {
                var value = board.possible_values[ii][jj];
                var temp_board = board.copy();
                var updates = [gridgame.Update.create(ii, "set", value)];
                this.solve_with_implications(true, temp_board, updates);
                if (!temp_board.valid) {
                    continue;
                } else if (temp_board.is_solved()) {
                    solutions.push(temp_board);
                } else {
                    var remaining_solutions;
                    if (num_solutions) {
                        remaining_solutions = num_solutions - solutions.length;
                    }
                    gridgame.array_extend(solutions, this.solve_with_guessing(temp_board, remaining_solutions));
                }
                if (num_solutions && solutions.length >= num_solutions) {
                    break;
                }
            }
            break;
        }
        return solutions;
    },
};

gridgame.OneEachConstraint = gridgame.Constraint.extend({
    create: function(idxs) {
        var self = gridgame.Constraint.create.call(this);
        self.idxs = idxs;
        return self;
    },
    propagate: function(board, update) {
        var updates = [];
        var idxs_to_check;
        if (update) {
            if (!this.idxs.includes(update.idx)) {
                return updates;
            }
            idxs_to_check = [update.idx];
        } else {
            idxs_to_check = this.idxs;
        }

        // 0. All spots can only have the values 1 to idxs.length
        for (var ii = 0; ii < this.idxs.length; ii++) {
            for (var value = 0; value < board.possible_values[this.idxs[ii]].length; value++) {
                var val = board.possible_values[this.idxs[ii]][value];
                if (val < 1 || val > this.idxs.length) {
                    updates.push(gridgame.Update.create(this.idxs[ii], "remove", val));
                }
            }
        }

        // 1. if any spot has only one value, then remove
        // that value from all the other spots
        for (var ii = 0; ii < idxs_to_check.length; ii++) {
            if (board.possible_values[idxs_to_check[ii]].length == 1) {
                var value = board.possible_values[idxs_to_check[ii]][0];
                for (var jj = 0; jj < this.idxs.length; jj++) {
                    if (this.idxs[jj] == idxs_to_check[ii]) {
                        continue;
                    }
                    if (board.possible_values[this.idxs[jj]].includes(value)) {
                        updates.push(gridgame.Update.create(this.idxs[jj], "remove", value));
                    }
                }
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

        // 3. As a generalization of rule #2, if there are N places that each
        // can hold the same N values, then those values must go in those places
        // so you can remove them from all other places in this constraint.
        // For example, if the first two places in a row each must contain 3 and 5,
        // then, even though you don't know where the 3 goes or where the 5 goes,
        // you know that they must go in the first two places, you so can remove
        // them from all the other places.
        // Unimplemented.
        return updates;
    },
});

gridgame.SudokuGame = gridgame.Game.extend({
    create: function(rows, cols) {
        if (!rows) { rows = 9; }
        if (!cols) { cols = 9; }
        var self = gridgame.Game.create.call(this, rows, cols);
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
});

gridgame.NoTouchingConstraint = gridgame.Constraint.extend({
    create: function(center_idx) {
        var self = gridgame.Constraint.create.call(this);
        self.center_idx = center_idx;
        return self;
    },
    propagate: function(board, update) {
        var updates = [];
        var row_col = board.idx_to_row_col(this.center_idx);
        var row = row_col[0];
        var col = row_col[1];
        if (update) {
            var update_row_col = board.idx_to_row_col(update.idx);
            if (update_row_col[0] != row || update_row_col[1] != col) {
                return updates;
            }
        }
        if (board.possible_values[this.center_idx].length != 1) {
            return updates;
        }
        var value = board.possible_values[this.center_idx][0];
        for (var rr = Math.max(0, row-1); rr < Math.min(board.rows, row+2); rr++) {
            for (var cc = Math.max(0, col-1); cc < Math.min(board.cols, col+2); cc++) {
                if (rr == row && cc == col) {
                    continue;
                }
                var possibles = board.get_by_row_col(rr, cc);
                //console.log("row: " + rr + ", col: " + cc + ", possibles = " + possibles);
                if (possibles.includes(value)) {
                    updates.push(gridgame.Update.create(board.row_col_to_idx(rr, cc), "remove", value));
                }
            }
        }
        return updates;
    },
});

gridgame.CapsulesGame = gridgame.Game.extend({
    create: function(rows, cols, groups) {
        var self = gridgame.Game.create.call(this, rows, cols);
        for (var group = 0; group < groups.length; group++) {
            self.constraints.push(gridgame.OneEachConstraint.create(groups[group]));
        }
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                self.constraints.push(gridgame.NoTouchingConstraint.create(self.board.row_col_to_idx(row, col)));
            }
        }
        return self;
    },
});

