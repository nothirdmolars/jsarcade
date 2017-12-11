//////much of the actual game based logic and code was guided and inspired by a pair 
//////of lesson on creating 2d platformers created by Jake Gordon @Code inComplete.
//////The lessons can be found at: https://codeincomplete.com/posts/tiny-platformer/

$(function() {

    //// JSArcade UI variables
    var $playAgainButton = $('.lq-outcome-play-again-btn'),
        $score = $('#lq-score-counter'),
        $lives = $('#lq-lives-icons'),
        $resultsMessageBox = $('.lq-end-game-message'),
        animatingPause = false,
        lqHelpMessage = 'Shipwrecked somewhere in the remote islands of segmentia, you\'ve been set upon by pirates, mer-critters and enraged spunges. Strike them with your sword and keep them from whacking you when your back is turned!  MOVE using the LEFT and RIGHT ARROW keys), and PAUSE the game with SPACEBAR.  Be BRAVE adventurer, and may generations to come speak of your one dimensional valor!',
        lifeIcon = '<span class="fa-stack lq-life">' +
        '<i class="fa fa-shield fa-stack-2x lq-silver"></i>' +
        '<i class="fa fa-heart fa-stack-1x lq-red"></i></span>';

    //// game world and view variables
    var yStart = 0, // vertical reference/starting point for all elements
        height = 120, // height is always a static amount for all drawn objects on the canvas

        tileWidth = 90, // width of each individual tile (canvas scales DOWN to match css vw/vh on most monitors, creating crisp lines)
        // tile map of the level, composed of 25 equally sized tiles
        level1 = [1, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1],
        // functions for calculating tiles to view pixel coordinates and vice versa
        t2v = function(tiles) { return tiles * tileWidth },
        v2t = function(viewBasedAmount) { return Math.floor(viewBasedAmount / tileWidth) };

    //// canvas variables
    var canvas = document.getElementById("lq-canvas"), // grab the canvas element
        ctx = canvas.getContext("2d"), // create the rendering context
        levelWidth;

    //// timing and rendering variables
    var fps = 60,
        step = 1 / fps,
        last,
        now,
        delayTime = 0;

    //// gameplay variables
    var score = 0,
        scoreMultiplier = 0,
        baseEnemiesAllowed = 3,
        enemyTypes = ['Mer-llama', 'Evil Sponge', 'Bull-Crab', 'Pirate', 'Ninja'],
        enemyColors = ['#cd5500', '#ffe337', '#ea2323', '#980093', '#1d1d1b'],
        slain = {
            slainCategories: [0, 0, 0, 0, 0],
            calculateSlain: function() {
                var totalSlain = 0;
                this.slainCategories.forEach(function(enemyCategoryTotal) {
                    totalSlain = totalSlain + enemyCategoryTotal;
                });
                return totalSlain;
            },
            resetSlain: function() {
                for (var index = 0; index < this.slainCategories.length; index++) {
                    this.slainCategories[index] = 0;
                }
            }
        },
        playingGame = false;

    //// constructors & inheritance
    // GameObject constructor
    var GameObject = function(color, width, startingLocation) {
        this.color = color;
        this.startingLocation = startingLocation; //use a view based starting location
        this.width = width;
        this.location = startingLocation;
        this.render = function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.location, yStart, this.width, height);

        };
    };
    // Tile constructor
    var Tile = function(isForeground, isImpassable, colorC, widthC, startingLocationC) {
        GameObject.call(this, colorC, widthC, startingLocationC);
        this.isImpassable = isImpassable;
        this.isForeground = isForeground;
    };
    // Character constructor
    var Character = function(startingLives, speed, colorC, widthC, startingLocationC) {
        GameObject.call(this, colorC, widthC, startingLocationC);
        this.startingLives = startingLives;
        this.lives = this.startingLives;
        this.speed = speed;
        this.currentSpeed = 0;
        this.movingLeft = false;
        this.movingRight = false;
    };
    // make Character inherit from GameObject
    Character.prototype = Object.create(GameObject.prototype);

    //// game object variables
    var player,
        gameTiles = [],
        enemies = [],
        bodies = [];

    //// game functionality
    // creating game objects
    function createStartingGameObjects() {
        createTiles(level1);
        createPlayer();
    }

    // set/reset all starting variable values
    function setStartingVariables() {
        last = createTimeStamp();
        enemies = [];
        scoreMultiplier = 0;
        updateScore(score * -1, true);
        slain.resetSlain();
        $('#lq-slain-counter').text(slain.calculateSlain());
        updatePlayerLives((player.lives * -1) + 3)
        levelWidth = canvas.width = gameTiles.length * tileWidth;
        playingGame = true;
    }

    // update game score variable and DOM object (use this for any change to player score)
    function updateScore(scoreToAdd, ignoreMultiplier) {

        if (!ignoreMultiplier) {
            if (slain.calculateSlain() > 60) {
                scoreMultiplier = 4;
            } else {
                scoreMultiplier = Math.floor((slain.calculateSlain() + 1) / 15);
            }
            score = score + scoreToAdd + (scoreToAdd * scoreMultiplier);
        } else {
            score = score + scoreToAdd;
        }
        $score.text(score);
    }

    // update slain variable and DOM object (use this for any change to player score)
    function updateSlain(slainToAdd, enemyCategoryIndex) {
        slain.slainCategories[enemyCategoryIndex] += slainToAdd;
        $('#lq-slain-counter').text(slain.calculateSlain());
    }

    // update player lives variable and DOM object (use this for any change to player lives)
    function updatePlayerLives(changeOfLives) {
        player.lives = player.lives + changeOfLives;

        var livesHTML = '';
        for (var count = 0; count < player.lives; count++) {
            livesHTML = livesHTML + lifeIcon;
        }

        $lives.html(livesHTML);
    }

    // set up game area
    function setUpGameArea() {
        $('.lq-game-area').removeClass('disabled');
        $('.lq-game-info').removeClass('disabled');
        $resultsMessageBox.hide();
        $resultsMessageBox.children('.lq-outcome-new-highscore').hide();
    }

    // start new game
    function beginNewGame() {
        createStartingGameObjects();
        setStartingVariables();
        setUpGameArea();
        gameLoop();
    }

    // create game tiles
    function createTiles(levelArray) {
        gameTiles = [];
        var tileColor, tileImpassable, tileForeground, tileStartingLocation;
        // create a game tile for every value in the level array
        for (var levelIndex = 0; levelIndex < levelArray.length; levelIndex++) {
            //
            tileStartingLocation = t2v(levelIndex)
            switch (levelArray[levelIndex]) {
                case 0:
                    tileColor = '#26a524';
                    tileImpassable = false;
                    tileForeground = false;
                    break;
                case 1:
                    tileColor = '#0f2fa5b8';
                    tileImpassable = true;
                    tileForeground = true;
                    break;
                case 2:
                    tileColor = '#0fa597';
                    tileImpassable = false;
                    tileForeground = false;
                    break;
                case 3:
                    tileColor = '#e9a43b';
                    tileImpassable = false;
                    tileForeground = false;
                    break;
            }
            //create new tile based on parameters and push to gameTiles array
            newGameTile = new Tile(tileForeground, tileImpassable, tileColor, tileWidth, tileStartingLocation);
            gameTiles.push(newGameTile);
        }
    }

    // create player
    function createPlayer() {
        player = new Character(3, 500, '#5d5b4c', tileWidth, t2v(12));
        player.isFacingRight = true;
        player.dashing = false;
        player.dashSpeed = .3;
        player.sword = new GameObject('#ffffff', (tileWidth / 2), player.location + player.width);
        player.locateSword = function() {
            var swordLocation = 0;
            if (this.isFacingRight) {
                swordLocation = this.location + this.width;
            } else {
                swordLocation = this.location - this.sword.width;
            }
            this.sword.location = swordLocation;
        }
    }

    // create body to move backwards and fade from current enemy position
    function createBody(bSpeed, bColor, bLocation) {

        var body = new Character(0, bSpeed, bColor, tileWidth, bLocation);
        body.movementPattern = function() {
            // move in set direction without deviation
            this.currentSpeed = this.speed;
        }
        body.fadeAmount = 0;
        body.fadeIncrement = .03;
        body.render = function render() {
            var netFade = 0;
            netFade = 1 - this.fadeAmount;
            if (netFade < 0) {
                ctx.globalAlpha = 0;
                this.fadeAmount = 1
            } else {
                ctx.globalAlpha = 1 - this.fadeAmount;
                this.fadeAmount += this.fadeIncrement;
            }
            ctx.fillStyle = this.color;
            ctx.fillRect(this.location, yStart, this.width, height);
            console.log('global alpha: ' + ctx.globalAlpha);
            ctx.globalAlpha = 1;
        }

        bodies.push(body);
    }

    // creates a random enemy with scaling speed based on current score
    function createEnemy() {
        var startLoc = 0,
            points = 0,
            color = '',
            minRand = .15,
            maxRand = .99,
            speed = (player.speed / 1.8 + (player.speed * (scoreMultiplier / 8))) * (Math.random() * (maxRand - minRand) + minRand);

        var enemyTypeIndex = 0,
            direction = 1;

        // determine direction and starting position
        if (Math.floor(Math.random() * 2)) {
            //go right
            startLoc = startLoc - tileWidth;
        } else {
            //go left
            startLoc = gameTiles.length * tileWidth;
            speed = speed * -1;
        }

        // determine color and movement pattern (score based enemy type limit)
        enemyTypeIndex = Math.round(Math.random() * (scoreMultiplier));
        switch (enemyTypes[enemyTypeIndex]) {
            case 'Mer-llama':
                var enemy = new Character(0, speed, enemyColors[enemyTypeIndex], tileWidth, startLoc);
                enemy.movementPattern = function() {
                    // move in set direction without deviation
                    this.currentSpeed = this.speed;
                }
                enemy.points = 15;
                break;

            case 'Evil Sponge':
                var enemy = new Character(0, speed, enemyColors[enemyTypeIndex], tileWidth / 2, startLoc);
                enemy.movementPattern = function() {
                    // if player and enemy are facing each other cease movement, otherwise proceed without incident
                    if (((player.location > this.location) && (this.speed > 0) && !player.isFacingRight) ||
                        ((player.location < this.location) && (this.speed < 0) && player.isFacingRight)) {
                        this.currentSpeed = 0;
                    } else {
                        this.currentSpeed = this.speed;
                    }
                }
                enemy.points = 10;
                break;

            case 'Bull-Crab':
                var enemy = new Character(0, speed, enemyColors[enemyTypeIndex], tileWidth * 1.5, startLoc);
                enemy.movementPattern = function() {
                    // speed increases as enemy gets closer to player
                    var distanceToPlayer = Math.abs((this.location - this.width) - (player.location - player.width));
                    var totalPlayArea = gameTiles.length * tileWidth;
                    var speedBoost = (totalPlayArea - distanceToPlayer) / totalPlayArea;
                    this.currentSpeed = this.speed * (1 + speedBoost);
                }
                enemy.points = 30;
                break;

            case 'Pirate':
                var enemy = new Character(0, speed, enemyColors[enemyTypeIndex], tileWidth, startLoc);
                enemy.movementPattern = function() {
                    // speed changes randomly
                    this.currentSpeed = this.speed * 1.25 * Math.random();
                }
                enemy.points = 40;
                break;

            case 'Ninja':
                var enemy = new Character(0, speed, enemyColors[enemyTypeIndex], (tileWidth / 3), startLoc);
                enemy.movementPattern = function() {
                    this.currentSpeed = this.speed * 1.5;
                    // if player and enemy are facing each other and player is close, retreat, otherwise proceed without incident
                    if (((player.location > this.location) && (this.speed > 0) && !player.isFacingRight) ||
                        ((player.location < this.location) && (this.speed < 0) && player.isFacingRight)) {
                        if (Math.abs(this.location - player.location) < t2v(3)) {
                            this.currentSpeed = player.speed * 1.5 * -1;
                        }
                    }
                };
                enemy.points = 65;
                break;
        }
        enemy.typeIndex = enemyTypeIndex;
        enemies.push(enemy);
    }

    // assign all events
    function assignEvents() {
        // add removable listeners that are cleared when returning to main menu
        // keyboard events for for all key ups and key downs
        _JSArcade.listening.addStoredListener(document, 'keydown', function(eventData) {
            return evaluateKey(eventData, eventData.key, true);
        }, false);
        _JSArcade.listening.addStoredListener(document, 'keyup', function(eventData) {
            return evaluateKey(eventData, eventData.key, false);
        }, false);

        // jquery based DOM event assignment
        $playAgainButton.on('click', function() {
            beginNewGame();
        });
        $(".lq-outcome-quit-btn").on('click', function() {
            quitGame();
        })
        $("#title-start-btn").on('click', function() {
            $("#title-screen").slideUp('slow', function() {
                $("#gameplay-screen").slideDown('slow');
            })
            beginNewGame();
        })
    }

    // evaluating keyboard press data
    var evaluateKey = function(event, keyInfo, isDown) {
        switch (keyInfo) {
            case 'ArrowLeft':
                player.movingLeft = isDown;
                event.preventDefault();
                return false;
            case 'ArrowRight':
                player.movingRight = isDown;
                event.preventDefault();
                return false;
            case ' ':
                // pause or unpause the game if space bar is released
                if (!isDown) {
                    if (playingGame) { gamePause(true) } else { gamePause(false) };
                }
                event.preventDefault();
                return false;
        }
    }

    // create a reliable timestamp time for accurate game loop rendering
    function createTimeStamp() {
        // check for the existance of modern browser high resolution timing
        if (window.performance && window.performance.now) {
            return window.performance.now();
            // otherwise use less reliable/precise Date.getTime
        } else {
            return new Date().getTime();
        }
    }

    // main gameplay loop
    function gameLoop() {
        if (playingGame && player.lives >= 0) {
            now = createTimeStamp();
            //calculate delayTime in milliseconds
            delayTime = delayTime + Math.min(1, (now - last) / 1000);
            //update game objects, one step at a time
            while (delayTime > step) {
                delayTime = delayTime - step;
                updateGameObjects(step);
            }
            //render the game to the canvas based on requestAnimationFrame, record new last time
            renderObjects(ctx, delayTime);
            last = now;

            requestAnimationFrame(gameLoop, canvas);
        } else if (player.lives < 0) {
            gameOver();
        }
    }

    // update game objects (player, enemies)
    function updateGameObjects(stepAmount) {
        updatePlayer(stepAmount);
        updateEnemies(stepAmount);
        updateBodies(stepAmount);
    }

    // update player object
    function updatePlayer(stepAmount) {
        //move player since last update
        player.location = Math.floor(player.location + (stepAmount * player.currentSpeed));

        //update player speed (allows for additional speed modifications in future updates)
        var distanceAdj = 0;
        if (player.movingLeft) {
            player.isFacingRight = false;
            distanceAdj = distanceAdj - player.speed;
        } else if (player.movingRight) {
            player.isFacingRight = true;
            distanceAdj = distanceAdj + player.speed;
        } else {
            distanceAdj = 0;
        }
        player.currentSpeed = distanceAdj;

        //check for player level boundary and wall collisions
        //get current player tile based on top left corner of player box
        playerTile = v2t(player.location);

        //evaluate for collisions or level boundaries
        //evaluate left
        if (player.currentSpeed < 0) {
            if ((playerTile < 0) || gameTiles[playerTile].isImpassable) {
                //if collision detected, move player to start of right adjacent tile and stop player motion
                player.location = t2v(playerTile + 1);
                player.currentSpeed = 0;
            }
        }
        //evaluate right
        else if (player.currentSpeed > 0) {
            if ((playerTile >= gameTiles.length - 1) || gameTiles[playerTile + 1].isImpassable) {
                //if collision detected, move player to left edge of current tile and stop player motion
                player.location = t2v(playerTile);
                player.currentSpeed = 0;
            }
        }
        //update sword location
        player.locateSword();
    }

    // update enemies object
    function updateEnemies(stepAmount) {
        for (var enemiesIndex = 0; enemiesIndex < enemies.length; enemiesIndex++) {
            var en = enemies[enemiesIndex];
            //if enemy is still alive
            if (en.lives >= 0) {
                // apply enemy movement pattern 'ai'
                en.movementPattern();
                // move enemy since last update
                en.location = Math.floor(en.location + (stepAmount * en.currentSpeed));

                //check for enemy collision with player or player sword
                //get current enemy & player tiles based on top left corner of character boxs
                var enemyStart = en.location;
                var enemyEnd = enemyStart + en.width;
                var swordStart = player.sword.location;
                var swordEnd = swordStart + player.sword.width;

                //evaluate for sword collision
                if (enemyStart < swordEnd && enemyEnd > swordStart) {
                    en.lives--;
                    if (en.lives <= 0) {
                        updateSlain(1, en.typeIndex);
                        updateScore(en.points, false);
                        createBody(player.currentSpeed * 1.25, en.color, en.location);
                        console.log(bodies);
                    }
                }

                //evaluate for player collision
                if (enemyStart < player.location + player.width && enemyEnd > player.location) {
                    en.lives--;
                    updatePlayerLives(-1);
                }
            }
        }

        //update enemy listing with latest data
        updateEnemyList();
    }

    // update enemies object
    function updateBodies(stepAmount) {
        for (var bodiesIndex = 0; bodiesIndex < bodies.length; bodiesIndex++) {
            var bdy = bodies[bodiesIndex];
            // apply body movement impulse
            bdy.movementPattern();
            // move body since last update
            bdy.location = Math.floor(bdy.location + (stepAmount * bdy.currentSpeed));
        }
        //update and curate body listing
        updateBodyList();
    }


    // update enemy listing and clear out dead enemies
    function updateEnemyList() {

        // remove all dead enemies from enemies list
        // create a list of dead enemies as index references to enemies
        var deadEnemyIndexes = [];
        for (var index = 0; index < enemies.length; index++) {
            if (enemies[index].lives < 0) { deadEnemyIndexes.push(index) }
        }
        // remove enemies via splice in reverse order to preserve indexing
        for (var index = deadEnemyIndexes.length - 1; index >= 0; index--) {
            enemies.splice(deadEnemyIndexes[index], 1);
        }

        var currentAllowedEnemies = (baseEnemiesAllowed + (baseEnemiesAllowed * scoreMultiplier));
        // randomly generate enemy if possible
        if (enemies.length < currentAllowedEnemies) {
            createEnemy();
        }
    }

    // update enemy listing and clear out dead enemies
    function updateBodyList() {

        // remove all bodies that are fully transparent
        // similar functionality to updateEnemyList
        var hiddenBodyIndexes = [];
        for (var index = 0; index < bodies.length; index++) {
            if (bodies[index].fadeAmount == 1) { hiddenBodyIndexes.push(index) }
        }

        for (var index = hiddenBodyIndexes.length - 1; index >= 0; index--) {
            bodies.splice(hiddenBodyIndexes[index], 1);
        }
    }

    // render existing objects to the canvas element
    function renderObjects(canvasContext, dt) {
        // render game background tiles
        gameTiles.forEach(function(tile) {
            if (!tile.isForeground) {
                tile.render();
            }
        });

        // render player
        player.render();
        player.sword.render();

        // render bodies
        bodies.forEach(function(body) {
            body.render();
        });

        // render enemies
        enemies.forEach(function(enemy) {
            if (enemy.lives >= 0) {
                enemy.render();
            }
        });

        // render game foreground tiles
        gameTiles.forEach(function(tile) {
            if (tile.isForeground) {
                tile.render();
            }
        });
    }


    // hide the current game and display the title screen
    function showTitleScreen() {
        $("#gameplay-screen").hide();
        $("#title-screen").slideDown("slow");
    }

    // run game over functionality
    function gameOver() {
        evaluateScore();
        displayFinalResults();
    }

    // score checking (for high score)
    function evaluateScore() {
        var newHighScore = _JSArcade.highScores.checkForHighScore(score, _JSArcade.gameNameCodeLq);
        if (newHighScore) {
            $resultsMessageBox.children('.lq-outcome-new-highscore').show();
        }
    }

    // disable the game screen and display the results screen
    function displayFinalResults() {
        outcomeMessage = '';
        for (var index = 0; index < enemyTypes.length; index++) {
            outcomeMessage = outcomeMessage + '<p style="color: ' + enemyColors[index] + '">' + enemyTypes[index] + 's Slain: ' + slain.slainCategories[index] + '</p>';
        }

        $('.lq-game-area').addClass('disabled');
        $('.lq-game-info').addClass('disabled');
        $resultsMessageBox.children('.lq-outcome-outcome-msg').html('Your quest has come to an end.' + outcomeMessage);
        $resultsMessageBox.children('.lq-outcome-score-msg').text('Final Score: ' + score);
        $resultsMessageBox.show();
    }

    // pauses and unpauses game with pause message
    function gamePause(enablePause) {
        // check to make sure a session of the game is in play, pausing is not currently animated, and the player is still alive
        if (player.lives >= 0 && $('#gameplay-screen').is(":visible") && !animatingPause) {
            if (enablePause) {
                animatingPause = true;
                playingGame = false;
                $('.lq-overlay-header').text('--PAUSED--');
                $('.lq-overlay-subheader').text('Press SPACE to continue');
                $('.lq-game-info-overlay').slideDown('slow', function() {
                    animatingPause = false;
                });
            } else {
                animatingPause = true;
                $('.lq-game-info-overlay').slideUp('fast');
                animatingPause = false;
                player.currentSpeed = 0;
                last = createTimeStamp();
                playingGame = true;
                gameLoop();
            }
        }
    }

    // exit game
    function quitGame() {
        showTitleScreen();
    }

    // smoothly change css display control to jquery based
    function prepareGameAreas() {
        $resultsMessageBox.removeClass('hide').hide();
        $("#gameplay-screen").removeClass('hide').hide();
        $('.lq-game-info-overlay').removeClass('hide').hide();
    }

    function main() {
        _JSArcade.helpMessage = lqHelpMessage;
        assignEvents();
        prepareGameAreas();
        showTitleScreen();
    }

    main();

});