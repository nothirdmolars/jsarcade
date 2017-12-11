*******************************************************
* 						      *
*  JSArcade, By Josiah Pippin, 12/5/2017  *
* 						      *
*******************************************************
>Basic Rundown
This is a rough and simple 'app like' game framework with three basic games :)  You can select a game option from the homepage and run it to your heart's content:)  Individual games can be pulled out and run on thier own, but currently only with a bit of cut and paste.


>Special Notes on the Code and Functionality-

Use the included _JSArcade global object and associated properties/methods to access or manipulate site wide functionality 
(i.e. menu's, modals, etc.) from within a game.  You can use the included listeners object to assign, record and delete event listeners
that aren't removed automatically when DOM elements are destroyed (keyboard presses, etc.)


>Potential Problem Areas-

There shouldn't be any big issues in the code, but there are a couple of details of the implementain worth noting:
Firstly, because all games are run from the same page and ajax calls are made to integrate new resources, the site/app doesn't currently
function locally.  It was built to call the root directory in MAMP at the moment (htdocs).
Secondly, you may notice an occasional 'missing' enemy in the Line Quest game - this is a result of the current speed algorithm values.
Increasing the speed, particularly the throttled minimum for random speed multiplier(search for minRand) will 'correct' this.
