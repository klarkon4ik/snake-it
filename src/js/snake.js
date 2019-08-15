let KeyManager = function() {
    const LEFT_KEY = 37;
    const UP_KEY = 38;
    const RIGHT_KEY = 39;
    const DOWN_KEY = 40;

    let xVal = 0;
    let yVal = 0;
    let lastKeyPress;

    let setDirection = (event) => {
        switch (event.keyCode) {
            case LEFT_KEY :
                calculateCoordinates(-1, 0, LEFT_KEY, RIGHT_KEY);
                break;
            case UP_KEY:
                calculateCoordinates(0, -1, UP_KEY, DOWN_KEY);
                break;
            case RIGHT_KEY:
                calculateCoordinates(1, 0, RIGHT_KEY, LEFT_KEY);
                break;
            case DOWN_KEY:
                calculateCoordinates(0, 1, DOWN_KEY, UP_KEY);
                break;
        }
    };

    let calculateCoordinates = (x, y, key, oppositeKey) => {
        if (lastKeyPress !== oppositeKey) {
            xVal = x;
            yVal = y;
            lastKeyPress = key;
        }  
    };

    let initialize = (gameManager) => {
        document.addEventListener("keydown", (event) => {
            let keys = [LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY];
            var state = gameManager.getState();
            state === 'menu'
                ? keys.includes(event.keyCode) && gameManager.setState('game')
                : state === 'gameOver'
                    ? keys.includes(event.keyCode) && gameManager.setState('menu')
                    : keys.includes(event.keyCode) && setDirection(event)
        });
    }

    return {
        initialize: initialize,
        getKeyCoordinates: () => {
            return {
                xVal: xVal,
                yVal: yVal
            };
        }
    };
};

let CanvasManager = function(gridSize) {
    const GAME_CANVAS = document.getElementById("canvas");
    let ctx = GAME_CANVAS.getContext("2d");

    let initCanvas = () => {
        ctx.fillStyle = 'cadetblue';
        ctx.strokestyle = 'black';
        ctx.fillRect(0, 0, GAME_CANVAS.width, GAME_CANVAS.height);
        ctx.strokeRect(0, 0, GAME_CANVAS.width, GAME_CANVAS.height);
    };

    let startView = () => {
        initCanvas();
        addText("30px", "Snake", "100");
        addText("10px", "Press any arrow key to start", GAME_CANVAS.height / 2);
    }

    let gameOverView = () => {
        initCanvas();
        addText("30px", "Game Over", "100");
        addText("10px", "Press any arrow key to continue", GAME_CANVAS.height/2);
    };

    let addText = (font, message, height, width = GAME_CANVAS.width / 2, align = 'center') => {
        ctx.font = font;
        ctx.fillStyle = 'black';
        ctx.textAlign = align;
        ctx.fillText(message, width, height);
    };

    let updateScore = (score) => {
        ctx.strokeRect(0, 0, GAME_CANVAS.width, 20);
        addText("10px", "Score: " + score, 15, 10, 'left');
    };

    let drowApple = (coordinates) => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(coordinates.appleX * gridSize, coordinates.appleY * gridSize - 2, gridSize - 2 , gridSize - 2);
    };

    let drowTrail = (trail) => {
        ctx.fillStyle = "black";
        for (var i = 0; i < trail.length; i++) {
            ctx.fillRect(trail[i].x * gridSize, trail[i].y * gridSize, gridSize - 2, gridSize - 2);
        }
    };

    return {
        initCanvas: initCanvas,
        startView: startView,
        gameOverView: gameOverView,
        updateScore: updateScore,
        drowApple: drowApple,
        drowTrail: drowTrail
    }
};

let AppleManager = function(canvasManager, tileCount) {
    let appleX;
    let appleY;

    let runApple = (playerCoordinates) => {
        canvasManager.drowApple({
            appleX: appleX,
            appleY: appleY
        });

        // check if snake ate apple
        let newApple = appleX === playerCoordinates.playerX && appleY === playerCoordinates.playerY;
        if (newApple) {
            appleX = Math.floor(Math.random() * (tileCount - 1));
            appleY = Math.floor(Math.random() * (tileCount - 1) + 1);
        };

        return {
            appleX: appleX,
            appleY: appleY,
            ateApple: newApple
        };
    };

    return {
        initialize: () => {
            appleY = 5;
            appleX = 5;
        },
        runApple: runApple
    }
};

let TrailManager = function(canvasManager) {
    let gameStarted;
    let trail;
    let tail;

    let init = () => {
        gameStarted = false;
        trail = [];
        tail = 5;
    };

    let runTrail = (playerCoordinates) => {
        canvasManager.drowTrail(trail);

        //check if the head touches border
        let trailSize = trail.length - 1;
        let toucheBorder = false;
        if (trailSize >= 0) {
            if (trail[trailSize].x === playerCoordinates.playerX 
                    && trail[trailSize].y === playerCoordinates.playerY && !gameStarted) {
                tail = 5;
            }
            else if (trail[trailSize].x === playerCoordinates.playerX 
                && trail[trailSize].y === playerCoordinates.playerY) {
                toucheBorder = true;
            }
        }

        if (!toucheBorder) {
            trail.push({
                x: playerCoordinates.playerX, 
                y: playerCoordinates.playerY
            });

            while (trail.length > tail) {
                trail.shift();
            }
        }
        return toucheBorder;
    };

    return {
        initialize: init,
        runTrail: runTrail,
        // apple has been eaten
        updateTail: () => {
            tail++;
        },
        runGame: () => {
            gameStarted = true;
        }
    };
};

let gameManager = (function() {
    let gridSize = 20;
    let tileCount = 20;
    let state = 'menu';

    let gameInterval;
    let score;
    let speed;

    let playerX;
    let playerY;

    let canvasManager = new CanvasManager(gridSize);
    let keyManager = new KeyManager();
    let appleManager = new AppleManager(canvasManager, tileCount);
    let trailManager = new TrailManager(canvasManager);

    let runGame = () => {
        updatePlayerCoordinates();
        canvasManager.initCanvas();
        canvasManager.updateScore(score);
        if (playerX < 0 || playerX > tileCount - 1  || playerY < 1 || playerY > tileCount) {
            setState('gameOver');
        }
        gameLogic();
    }

    let gameLogic = () => {
        let playerCoordinates = {
            playerX: playerX,
            playerY: playerY
        };

        var toucheBorder = trailManager.runTrail(playerCoordinates);
        if (toucheBorder) {
            return setState('gameOver');
        }

        var appleCoordinates = appleManager.runApple(playerCoordinates);
        if (appleCoordinates.ateApple) {
            trailManager.updateTail();
            score++;
            // speed up
            speed -= 100;
            clearInterval(gameInterval);
            gameInterval = setInterval(runGame, speed / 15);
        }
    };

    let updatePlayerCoordinates = () => {
        var coordinates = keyManager.getKeyCoordinates();
        playerX += coordinates.xVal;
        playerY += coordinates.yVal;
    };

    let gameInitialize = ()=> {
        speed = 2000;
        score = 0;
        playerX = 10;
        playerY = 10;

        canvasManager.startView();
        appleManager.initialize();
        trailManager.initialize();
    };

    let stateManager = () => {
        switch (state) {
            case 'menu': 
                gameInitialize();
                break;
            case 'game':
                gameInterval = setInterval(runGame, speed/15);
                setTimeout(trailManager.runGame, 1000);
                break;
            case 'gameOver':
                clearInterval(gameInterval);
                setTimeout(canvasManager.gameOverView, 1500);
                break;
        }
    };

    let setState = (newState) => {
        state = newState;
        stateManager();
    };

    return {
        initialize: function() {
            keyManager.initialize(this);
            stateManager();
        },
        setState: setState,
        getState: () => {
            return state;
        }
    };
}());


window.onload = function() {
    gameManager.initialize();
};
