$(function() {


    // setup variables
    var $matchBoxChoices = $('.mat-match-choice');
    var $inGameBoard = $('.mat-ingame-board');
    var $playAgainButton = $('.mat-outcome-play-again-btn');
    var $inGameMessageBox = $('.mat-game-info');
    var $resultsMessageBox = $('.mat-end-game-message');
    var matHelpMessage = 'Uncover and choose matching sets of tiles to clear the board before misses run out.  Bonus points for consecutive matches!';

    // gameplay based variables
    var pointsMultiplier = 1;
    var points = 0;
    var totalMissesAllowed = 12;
    var currentMissesAllowed = currentMissesAllowed;

    // flag variables
    var isSecondChoice = false;
    //var isRightMouseButtonDown = false;

    // user choice values
    var $userChoiceOne = null;
    var $userChoiceTwo = null;
    var matchIconChoices = [
        'fa-birthday-cake',
        'fa-balance-scale',
        'fa-bug',
        'fa-bicycle',
        'fa-beer',
        'fa-bathtub',
        'fa-eye',
        'fa-futbol-o',
        'fa-fort-awesome',
        'fa-html5',
        'fa-resistance',
        'fa-smile-o',
        'fa-anchor',
        'fa-black-tie',
        'fa-barcode',
        'fa-bolt',
        'fa-camera',
        'fa-bomb',
        'fa-coffee',
        'fa-child'
    ];

    // main function
    function main() {
        showTitleScreen();
        resetGame();
        assignEvents();
        assignMatchValues();
    }

    // calculate and assign match values
    function assignMatchValues() {
        // randomize match locations/layout
        randomizeMatchIndices(5);
        // create a list of matching icon pair class names
        var matchIconList = createMatchIconList();
        // add matching pair icon names to match locations class listing,
        // each name goes in two match location 
        var matchBoxChoiceCounter = 0;
        for (var iconPair = 0; iconPair < matchIconList.length; iconPair++) {
            // find the correct child element based on counter and sub element,
            // then change the class name accordingly
            $matchBoxChoices.eq(matchBoxChoiceCounter).children().last().attr('class', 'hide fa fa-inverse ' + (matchIconList[iconPair]));
            matchBoxChoiceCounter++;
            $matchBoxChoices.eq(matchBoxChoiceCounter).children().last().attr('class', 'hide fa fa-inverse ' + (matchIconList[iconPair]));
            matchBoxChoiceCounter++;
        }
    }

    // randomize match indexes to prepare for random placement of match icons
    function randomizeMatchIndices(timesToRunRandomizer) {
        for (var index = 0; index < timesToRunRandomizer; index++) {
            $matchBoxChoices = $matchBoxChoices.sort(function() {
                return 0.5 - Math.random();
            })
        }
    }

    // creates a random list of match icons with half as many entries as game squares
    function createMatchIconList() {
        var matchIconList = [];
        var numberOfMatches = ($matchBoxChoices.length / 2)

        for (var index = 0; index < numberOfMatches; index++) {
            var randomIconChoiceIndex = Math.floor(Math.random() * (matchIconChoices.length))
            matchIconList.push(matchIconChoices[randomIconChoiceIndex]);
        }

        return matchIconList;
    }

    // update in-game message text 
    function updateGameMessages() {
        $inGameMessageBox.children('.mat-score').text('Score: ' + points);
        if (currentMissesAllowed >= 0) { $inGameMessageBox.children('.mat-misses-remaining').text('Misses Left:' + currentMissesAllowed) }
    }

    // evaluate whether the game is completed and if won or lost
    function evaluateGameState() {

        var gameOver = false;
        var newHighScore = false;
        var endGameMessageText = '';
        updateGameMessages();

        if (currentMissesAllowed < 0) {
            endGameMessageText = 'You lost.'
            gameOver = true;
            // check for and record new highscore
            evaluateScore(points);
        } else if ($matchBoxChoices.length == $('.mat-cleared').length) {
            points = points + (currentMissesAllowed * 100 * pointsMultiplier);
            endGameMessageText = 'You WON!!'
            gameOver = true;
            // check for and record new highscore
            evaluateScore(points);
        }

        if (gameOver) {
            displayFinalResults(endGameMessageText);
        }
    }

    // score checking (for high score)
    function evaluateScore(points) {
        newHighScore = _JSArcade.highScores.checkForHighScore(points, _JSArcade.gameNameCodeMat);
        if (newHighScore) {
            $resultsMessageBox.children('.mat-outcome-new-highscore').show();
        }
    }

    // disable the game screen and display the results screen
    function displayFinalResults(endGameMessage) {
        $inGameBoard.addClass('disabled');
        $inGameMessageBox.hide();
        $resultsMessageBox.children('.mat-outcome-outcome-msg').text(endGameMessage);
        $resultsMessageBox.children('.mat-outcome-score-msg').text('Final Score: ' + points);
        $resultsMessageBox.show();
    }

    // evaluate user choice, apply classes and points as applicable
    function evaluateUserChoice($userChoiceJQUERYObject) {
        // user choice is gotten directly at the time of the click,
        // filtered for first or second choices
        $userChoiceJQUERYObject.addClass('mat-selected-match-choice');
        if (!isSecondChoice) {
            // turn off any hints from previous turn, set up variables, and add points
            $('.mat-match-choice').removeClass('mat-hint');
            $userChoiceOne = $userChoiceJQUERYObject;
            points = points + (5 * pointsMultiplier);
            isSecondChoice = true;
        } else {
            $userChoiceTwo = $userChoiceJQUERYObject;
            // check choices for matching class values
            if ($userChoiceOne.children('i').eq(1).attr('class') ==
                $userChoiceTwo.children('i').eq(1).attr('class')) {
                $userChoiceOne.addClass('mat-cleared');
                $userChoiceTwo.addClass('mat-cleared');
                points = points + (25 * pointsMultiplier);
                pointsMultiplier++;
            } else {
                // if not a match, decrement currentMissesAllowed by one,
                // add hint styling, and reset point multiplier
                currentMissesAllowed--;
                pointsMultiplier = 1;
                $userChoiceOne.addClass('mat-hint');
                $userChoiceTwo.addClass('mat-hint');
            }
            // remove match selection styling and reset user choice JQUERY associations
            $userChoiceOne.removeClass('mat-selected-match-choice');
            $userChoiceTwo.removeClass('mat-selected-match-choice');
            $userChoiceOne = null;
            $userChoiceTwo = null;
            // reset second choice
            isSecondChoice = false;
        }
    }

    // assign or wire up events to appropriate elements
    function assignEvents() {
        $matchBoxChoices.on('click', function() {
            evaluateUserChoice($(this));
            evaluateGameState();
        });

        $playAgainButton.on('click', function() {
            resetGame();
            assignMatchValues();
        });
        $(".mat-outcome-quit-btn").on('click', function() {
            quitGame();
        })
        $("#title-start-btn").on('click', function() {
            $("#gameplay-screen").hide().removeClass('hide');
            $("#title-screen").slideUp('slow', function() {
                $("#gameplay-screen").slideDown('slow');
            })
        })
    }

    // reset game screen to default
    function resetGame() {
        // reset score, misses, and flag variables
        points = 0;
        _JSArcade.helpMessage = matHelpMessage;
        isSecondChoice = false;
        currentMissesAllowed = totalMissesAllowed;
        updateGameMessages();
        pointsMultiplier = 1;

        // change css based content hiding to jQuery handling
        // and hide/reset all elements
        $('.mat-match-choice').removeClass('mat-cleared mat-hint');
        $inGameMessageBox.show();
        $resultsMessageBox.hide();
        $resultsMessageBox.children('.mat-outcome-new-highscore').hide();
        $resultsMessageBox.removeClass('hide');
        $inGameBoard.removeClass('disabled');
    }

    // hide the current game and display the title screen
    function showTitleScreen() {
        $("#gameplay-screen").hide();
        $("#title-screen").slideDown("slow");
    }

    // exit game
    function quitGame() {
        resetGame();
        showTitleScreen();
    }

    main();

});