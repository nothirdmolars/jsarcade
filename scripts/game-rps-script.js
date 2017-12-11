$(function() {
    // setup variables
    var $gameChoiceButtons = $('.rps-ingame-menu a');
    var $playAgainButton = $('#rps-outcome-play-again-btn');
    var $tieMessageBox = $('.rps-tie-message');
    var $resultsMessageBox = $('.rps-end-game-message');
    var $inGameMenu = $('.rps-ingame-menu');
    var rpsHelpMessage = 'Pick an option to beat the computer.  <br><br>Scissors cuts paper,' +
        '<br>paper covers rock,' +
        '<br>rock crushes lizard,' +
        '<br>lizard poisons Spock,' +
        '<br>Spock smashes scissors,' +
        '<br>scissors decapitates lizard,' +
        '<br>lizard eats paper,' +
        '<br>paper disproves Spock,' +
        '<br>Spock vaporizes rock,' +
        '<br>rock crushes scissors!';
    var consecutiveWins = 0;
    var userChoice;
    var compChoice;
    var gameChoices = [
        'rps-choice-rock',
        'rps-choice-paper',
        'rps-choice-scissors',
        'rps-choice-lizard',
        'rps-choice-spock'
    ];

    // main function
    function main() {
        showTitleScreen();
        resetGame();
        assignEvents();
    }

    // assign or wire up events to appropriate elements
    function assignEvents() {
        $gameChoiceButtons.each(function() {
            $(this).on('click', function() {
                // user choice is gotten directly at the time of the click, no specific
                // method is neccesary and the selection is passed as a class name to evalWinner()
                userChoice = this.className;
                assignCompChoice();
                evalWinner();
            });
        });
        $playAgainButton.on('click', function() {
            resetGame();
        });
        $("#rps-outcome-quit-btn").on('click', function() {
            quitGame();
        });
        $("#title-start-btn").on('click', function() {
            $("#gameplay-screen").hide().removeClass('hide');
            $("#title-screen").slideUp('slow', function() {
                $("#gameplay-screen").slideDown('slow');
            });
        });
    }

    // get random computer choice for use as array index
    function assignCompChoice() {
        var compChoiceNumber = Math.floor(Math.random() * ($gameChoiceButtons.length));
        compChoice = gameChoices[compChoiceNumber];
    }

    // evaluate winner
    function evalWinner() {
        // determine if a tie has occured
        if (compChoice === userChoice) {
            // show tie message
            $tieMessageBox.show(300);
        } else {
            $tieMessageBox.hide();
            //if not a tie, switch for comparison and winner
            var winMessage;
            var userChoiceWord = evalChoiceWord(userChoice);
            var compChoiceWord = evalChoiceWord(compChoice);

            // evaluate user choice
            switch (userChoice) {
                case gameChoices[0]:
                    winMessage = evalChoicesWinner(4, 1);
                    break;

                case gameChoices[1]:
                    winMessage = evalChoicesWinner(2, 3);
                    break;

                case gameChoices[2]:
                    winMessage = evalChoicesWinner(0, 4);
                    break;

                case gameChoices[3]:
                    winMessage = evalChoicesWinner(0, 2);
                    break;

                case gameChoices[4]:
                    winMessage = evalChoicesWinner(1, 3);
                    break;

                default:
                    break;
            }

            // update results message text as appropriate
            $resultsMessageBox.children('#rps-outcome-choices-msg').text('You chose ' + userChoiceWord + ', CPU chose ' + compChoiceWord);
            $resultsMessageBox.children('#rps-outcome-winner-msg').text(winMessage);
            var isHighScore = _JSArcade.highScores.checkForHighScore(consecutiveWins, _JSArcade.gameNameCodeRps);
            displayResults(isHighScore);
        }
    }

    // display game results after game is finished
    function displayResults(isHighScore) {
        // disable choice selection
        $inGameMenu.addClass('disabled');
        if (consecutiveWins > 1) {
            // show number of consecutive wins if over 1
            var recordsMessage = consecutiveWins + ' wins in a row!';
            // adjust message for new high score
            if (isHighScore) { recordsMessage = recordsMessage + ' NEW HIGHSCORE!' }
            // change message html and display
            $resultsMessageBox.children('#rps-outcome-records-msg').text(recordsMessage);
            $resultsMessageBox.children('#rps-outcome-records-msg').show();
        }
        // display results message box
        $resultsMessageBox.show(300);
        // move focus automatically to play again button
        $playAgainButton.focus();
    }

    // reset game screen and info to defaults
    function resetGame() {
        //change css based content hiding to jQuery handling
        //and hide elements
        $tieMessageBox.hide();
        $resultsMessageBox.hide();
        $resultsMessageBox.children('#rps-outcome-records-msg').hide();
        $tieMessageBox.removeClass('hide');
        $resultsMessageBox.removeClass('hide');
        $inGameMenu.removeClass('disabled');

        // change help message for help modal
        _JSArcade.helpMessage = rpsHelpMessage;
    }

    // evaluate whether a player wins or loses based on two potential
    // winning computer choices
    function evalChoicesWinner(compWinningChoiceOne, compWinningChoiceTwo) {
        var outcome
        if (compChoice === gameChoices[compWinningChoiceOne] ||
            compChoice === gameChoices[compWinningChoiceTwo]) {
            outcome = 'You lost.';
            consecutiveWins = 0;
        } else {
            outcome = 'You WON!';
            consecutiveWins++;
        }
        return outcome;
    }

    // evaluate a given choice class based name into a word for display
    function evalChoiceWord(choiceClass) {
        var choiceWord;
        switch (choiceClass) {
            case gameChoices[0]:
                choiceWord = 'Rock';
                break;

            case gameChoices[1]:
                choiceWord = 'Paper';
                break;

            case gameChoices[2]:
                choiceWord = 'Scissors';
                break;

            case gameChoices[3]:
                choiceWord = 'Lizzard';
                break;

            case gameChoices[4]:
                choiceWord = 'Spock';
                break;

            default:
                break;
        }
        return choiceWord;
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
})