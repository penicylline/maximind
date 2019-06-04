var GameStatus = {
    INIT: 'INIT',
    INPROGRESS: 'INPROGRESS',
    END: 'END'
};

var GameDirection = {
    VERTICAL: 'VERTICAL',
    HORIZONTAL: 'HORIZONTAL',
}

var GameResult = {
    WIN: 'WIN',
    LOST: 'LOST'
};

var GameLevel = {
    EASY: 5,
    NORMAL: 7,
    HARD: 10,
    INSANE: 15
};

var GameSize = {
    SMALL: [10, 5],
    MEDIUM: [15, 7],
    LARGE: [20, 10]
};

var Settings = {
    gameLevel: GameLevel.EASY,
    gameSize: GameSize.SMALL
};

var Maximind = {

    init: function(board) {
        GameController.board = board;
    },

    start: function() {
        GameController.newGame();
    },

    end: function() {
        GameController.game.status = GameStatus.END;
    },

    setup: function(levels) {
        while (levels.firstChild) {
            levels.removeChild(levels.firstChild);
        }
        for (var l in GameLevel) {
            var level = document.createElement('option');
            level.innerText = l;
            levels.appendChild(level)
        }
        levels.addEventListener('change', function(e) {
            Settings.gameLevel = GameLevel[e.target.value];
            SettingsStorage.setSettings('level', Settings.gameLevel);
            GameController.newGame();
        });
        //
        var savedLevel = SettingsStorage.getSetting('level');
        if (savedLevel) {
            levels.value = savedLevel;
        }
    }
};

var SettingsStorage = {
    all: null,
    readAll: function() {
        this.all = [];
        var cookie = document.cookie;
        for (var s in cookie.split(';')) {
            var parts = s.split('=');
            if (parts.length < 2) {
                continue;
            }
            var key = parts[0].replace(/^\s+|\s+$/gm,'');
            var value = parts[1].replace(/^\s+|\s+$/gm,'');
            this.all[key] = value;
        }
    },
    getSetting: function(key) {
        if (this.all == null) {
            this.readAll();
        }
        return this.all[name];
    },
    setSettings: function(key, value) {
        if (this.all == null) {
            this.readAll();
        }
        this.all[key] = value;
        var s = key + '=' + value + '; expires=Thu, 18 Dec 2100 12:00:00 UTC';
        console.log(s);
        document.cookie = s;
    }
};

var GameController = {
    board: null,
    listCells: null,
    cellWidth: 0, 
    cellHeight: 0, 
    game: null,
    lastVal: 0,
    newGame: function() {
        this.game = new Game();
        //reset
        while (this.board.firstChild) {
            this.board.removeChild(this.board.firstChild);
        }
        // calculate game grid
        if (this.game.direction == GameDirection.VERTICAL) {
            this.cellWidth = Math.floor(this.board.clientHeight / this.game.rows);
            this.cellHeight = Math.floor(this.board.clientWidth / this.game.cols);
        } else {
            this.cellWidth = Math.floor(this.board.clientWidth / this.game.cols);
            this.cellHeight = Math.floor(this.board.clientHeight / this.game.rows);
        }
        //initialize game board
        this.lastVal = 0;
        this.createGameBoard();
        setTimeout(function() {
            GameController.startGame();
        }, 500);
    },

    startGame: function() {
        for(var i = 0; i < this.listCells.length; i++) {
            this.listCells[i].innerText = this.listCells[i].getAttribute('val');
        }
        this.game.status = GameStatus.INIT;
        this.createTime = new Date();
    },

    startPlay: function() {
        //hide cell value
        console.log(this.listCells.length);
        for(var i = 0; i < this.listCells.length; i++) {
            this.listCells[i].innerText = '';
        }
        //change status
        this.game.status = GameStatus.INPROGRESS; 
        this.game.startTime = new Date();
    },

    endGame: function(isWin) {
        this.game.status = GameStatus.END;
        this.game.finishTime = new Date();
        this.game.result = isWin ? GameResult.WIN : GameResult.LOST;
    },

    createGameBoard: function() {
        this.listCells = [];
        var cells = [];
        var col, row;
        for (i = 0; i < this.game.level; i++) {
            do {
                col = Math.floor(Math.random() * this.game.cols);
                row = Math.floor(Math.random() * this.game.rows);
            } while (cells.indexOf(col + '-' + row) >= 0);
            cells.push(col + '-' + row);
            var cell = this.createCell(i+1, row, col);
            this.board.appendChild(cell);
            this.listCells.push(cell);
        }
    },

    createCell: function(value, row, col) {
        var cell = document.createElement('div');
        cell.style.width = this.cellWidth - 2 + 'px';
        cell.style.height = this.cellHeight - 2 + 'px';
        cell.style.lineHeight = this.cellHeight + 'px';
        cell.style.fontSize = this.cellHeight + 'px';
        if (this.game.direction == GameDirection.VERTICAL) {
            cell.style.transformOrigin = "0 0";
            cell.style.transform = "rotate(90deg)";
            cell.style.top = row * this.cellWidth + 'px';
            cell.style.left = this.board.clientWidth - col * this.cellHeight + 'px';
        } else {
            cell.style.top = row * this.cellHeight + 'px';
            cell.style.left = col * this.cellWidth + 'px';
        }
        cell.className = 'game-cell';
        cell.setAttribute('val', value);
        cell.setAttribute('col', col);
        cell.setAttribute('row', row);
        cell.addEventListener('click', function(e) {
            if (GameController.game && GameController.game.status != GameStatus.END) {
                e.stopPropagation();
            }
            GameController.onCellClick(e.target);
        });
        return cell;
    },
    onCellClick: function(cell) {
        if (this.game.status == GameStatus.INIT) {
            this.startPlay();
        }
        if (this.game.status != GameStatus.INPROGRESS) {
            return;
        }
        var val = parseInt(cell.getAttribute('val'));
        var ok = this.checkResult(val);
        if (!ok) {
            //highlight wrong cell
            cell.innerText = val;
            cell.className = 'game-cell wrong';
            // stop game
            this.endGame(false);
            return;
        }
        this.lastVal = val;
        this.board.removeChild(cell);
        if (this.isFinish()) {
            this.endGame(true);
        }
    },
    isFinish: function() {
        return this.lastVal == this.game.level;
    },
    checkResult : function(val) {
        return 1 == val - this.lastVal;
    }
}

var Game = function(){
    this.level = Settings.gameLevel;
    this.status = GameStatus.INIT;
    this.createTime = null;
    this.startTime = null;
    this.finishTime = null;
    this.result = null;
    this.direction = GameDirection.HORIZONTAL;
    //
    if (window.innerWidth > window.innerHeight) {
        this.cols = Settings.gameSize[0];
        this.rows = Settings.gameSize[1];
    } else {
        this.cols = Settings.gameSize[1];
        this.rows = Settings.gameSize[0];
        this.direction = GameDirection.VERTICAL;
    }
};

window.addEventListener('load', function(){
    Maximind.setup(document.getElementById('level'));
    Maximind.init(document.getElementById('game-board'));
    Maximind.start();
});

window.addEventListener('keydown', function(e) {
    if (event.keyCode == 32 && GameController.game != null) {
        if (GameController.game.status == GameStatus.END) {
            GameController.newGame();
            e.preventDefault();
        }
    }
});

window.addEventListener('click', function(e) {
    if (GameController.game != null && GameController.game.status == GameStatus.END) {
        GameController.newGame();
        e.preventDefault();
    }
});

