// global object with unique identifier for functionality accessable by other scripts

var _JSArcade = {

    helpMessage: '',
    // variables to consistently reference games (sort of like enumerables)
    gameNameCodeRps: 'rps',
    gameNameCodeMat: 'mat',
    gameNameCodeLq: 'lq',

    //variables and functionality for storing and clearing events that would otherwise polute global handlers
    //NOTE- not intended for use on game specfic DOM elements that will be go when the elements are destroyed,
    //      best if used for document level events such as keyboard input
    listening: {
        // array for storing listener data objects
        listeners: [],

        // create an event listener in the designated node, and store a copy of it's unique listener data for later removal
        addStoredListener: function(node, event, handler, capture) {
            node.addEventListener(event, handler, capture);
            var newListener = {
                node: node,
                event: event,
                handler: handler,
                capture: capture
            }
            this.listeners.push(newListener);
        },

        // remove all stored event listeners and listener data objects
        removeStoredListeners: function() {
            this.listeners.forEach(function(element) {
                element.node.removeEventListener(element.event, element.handler, element.capture)
            });
            this.listeners = [];
        }
    },

    // variables and functionality for highscore
    highScores: {
        highScoreRps: 1,
        highScoreMat: 0,
        highScoreLq: 0,

        // load scores and/or create saves for scores
        loadHighScores: function() {
            if (localStorage.getItem("highScoreRps") === null) {
                localStorage.setItem("highScoreRps", this.highScoreRps);
            } else {
                this.highScoreRps = (localStorage.getItem("highScoreRps"));
            }

            if (localStorage.getItem("highScoreMat") === null) {
                localStorage.setItem("highScoreMat", this.highScoreMat);
            } else {
                this.highScoreMat = (localStorage.getItem("highScoreMat"));
            }

            if (localStorage.getItem("highScoreLq") === null) {
                localStorage.setItem("highScoreLq", this.highScoreLq);
            } else {
                this.highScoreLq = (localStorage.getItem("highScoreLq"));
            }
        },

        // evaluate for a highscore and change highscores where appropriate
        checkForHighScore: function(score, gameNameCode) {
            var isNewHighScore = false;
            if (gameNameCode == _JSArcade.gameNameCodeRps) {
                if (score > this.highScoreRps) {
                    this.highScoreRps = score;
                    localStorage.setItem("highScoreRps", score);
                    isNewHighScore = true;
                }
            } else if (gameNameCode == _JSArcade.gameNameCodeMat) {
                if (score > this.highScoreMat) {
                    this.highScoreMat = score;
                    localStorage.setItem("highScoreMat", score);
                    isNewHighScore = true;
                }
            } else if (gameNameCode == _JSArcade.gameNameCodeLq) {
                if (score > this.highScoreLq) {
                    this.highScoreLq = score;
                    localStorage.setItem("highScoreLq", score);
                    isNewHighScore = true;
                }
            }

            return isNewHighScore;
        }
    }

};


// functionality not exposed to outside scripts
$(function() {
    // variables for the main menu
    var defaultHelpMessage = 'Click on the game you would like to begin playing.  You can also click the trophy icon to view high score data!';


    function main() {
        _JSArcade.highScores.loadHighScores();
        readyPage();
        addEvents();
    }

    // prepare the main menu page with starting content properly hidden/shown
    function readyPage() {
        // hide DOM elements that should start hidden, switch hiding from CSS to JQUERY
        $("#modal-prompt-btns").hide();
        $(".burger-icon-close").hide();
        $(".burger-menu").hide();
        $("#game-area").removeClass('hide').hide();
        $("#modal").removeClass('hide').hide();
        $(".menu-option-home").removeClass('hide').hide();
        $(".burger-menu-home").removeClass('hide').hide();
        _JSArcade.helpMessage = defaultHelpMessage;
    }

    // Attatch event listeners
    function addEvents() {
        // creates event for closing modal
        $(".modal-close-icon").click(function() {
            $("#modal").hide();
        });

        // event listener for modal quit button to disable modal and modal prompt functionality
        $(".modal-cancel-btn").click(function() {
            $("#modal").hide();
        });

        // implements burger menu open and close functionality
        $(".burger-icon-open").click(function() {
            openBurger();
        });

        $(".burger-icon-close").click(function() {
            closeBurger();
        });

        // event listeners for scores main menu option
        $("#menu-icon-scores, .burger-menu-scores").click(function() {
            closeBurger();
            generateModal(false, 'High Scores', '<h3>MatchUp</h3><h4>' + _JSArcade.highScores.highScoreMat + ' points</h4><br>' +
                '<h3>RPSLS</h3><h4>' + _JSArcade.highScores.highScoreRps + ' wins</h4><br>' +
                '<h3>Line Quest</h3><h4>' + _JSArcade.highScores.highScoreLq + ' points</h4>');
        });

        // event listeners for quit main menu option
        $("#menu-icon-home, .burger-menu-home").click(function() {
            closeBurger();
            $('.modal-confirm-btn').off('click').on('click', function() {
                _JSArcade.listening.removeStoredListeners();
                resetToMainMenu();
                $('#modal').hide(500);
            });
            generateModal(true, 'Quit to Game Select Menu?', 'Return to the game selection menu?');
        });

        // event listeners for help main menu option
        $("#menu-icon-help, .burger-menu-help").click(function() {
            closeBurger();
            generateModal(false, 'Help', _JSArcade.helpMessage);
        });

        // event listener to load game content and script when new game button is clicked
        $(".game-choice").click(function(e) {

            e.preventDefault();
            var htmlPath = this.href;
            var scriptPathName = '';

            // evaluate class names to assign correct script
            if ($(this).hasClass('game-name-mat')) {
                scriptPathName = 'mat';
            } else if ($(this).hasClass('game-name-rps')) {
                scriptPathName = 'rps';
            } else if ($(this).hasClass('game-name-lq')) {
                scriptPathName = 'lq';
            }

            // prepare elements and options for gameplay
            setUpGameArea();

            // load individual game content and script
            loadGame(scriptPathName, htmlPath);
        });
    }

    // open and close burger menu
    function openBurger() {
        $(".burger-menu").slideDown("slow", function() {
            $(".burger-icon-open").hide();
            $(".burger-icon-close").show();
        });
    }

    function closeBurger() {
        $(".burger-menu").slideUp("slow", function() {
            $(".burger-icon-close").hide();
            $(".burger-icon-open").show();
        });
    }

    // hide main menu elements and prepare/show game area element containers and menu options
    function setUpGameArea() {
        $("#footer").fadeOut(200);
        $("#game-content").empty();
        $(".game-selection").slideToggle("slow");
        $("#game-area").slideDown("slow");
        $(".menu-option-home").show();
        $(".burger-menu-home").show();
    }

    // load game content and game script based on passed in html file path
    // and unique game file name designation
    function loadGame(scriptPathName, htmlFilePath) {
        $("#game-content").load(htmlFilePath, function(response, status, xhr) {
            var msg = "Sorry, an error occured when loading resources: ";

            if (status == "error") {
                // throw error and return to menu if the html doesn't load
                resetToMainMenu();
                generateModal(false, 'Loading Error :(', msg + xhr.status + " " + xhr.statusText + ". You've been returned to the main menu.")
            } else {
                // get script or show an error if script fails to load
                $.getScript("../scripts/game-" + scriptPathName + "-script.js")
                    .fail(function() {
                        resetToMainMenu();
                        generateModal(false, 'Loading Error :(', msg + " script failed to load. You've been returned to return to the main menu.");
                    });
            }
        });
    }

    // populate and show a modal with background overlay
    function generateModal(hasPrompt, modalHeaderText, modalBodyText) {
        if (hasPrompt === true) {
            $("#modal-prompt-btns").show();
            $(".modal-close-icon").hide();
        } else {
            $("#modal-prompt-btns").hide();
            $(".modal-close-icon").show();
        }
        $("#modal-header").html(modalHeaderText);
        $("#modal-content").html(modalBodyText);
        $("#modal").show(300);
    }

    // close game area and set up main menu sections
    function resetToMainMenu() {
        $(".game-selection").slideToggle("slow")
        $("#game-area").slideUp("slow");
        $("#footer").fadeIn(300);
        $(".menu-option-home").hide();
        $(".burger-menu-home").hide();
        _JSArcade.helpMessage = defaultHelpMessage;
    }

    main();

});