node/pipe.js - doesn't propagate stream cancellation, destroy never called, leaks, doesn't throw, doesn't clean up<br>
node/pipeline.js - propagates stream cancellation, but doesn't implement the destroy method, gracefully handles errors and cleans up<br>
node/pipeline-deytroy.js - propagates stream cancellation, implements the destroy method, gracefully handles errors and cleans up, doesn't leak at all<br>

web/cancel.js - propagates stream cancellation, cleans up, no leaks, no errors here<br>
web/nocancel.js - doesn't implement the cancel methods, process exits on error<br>


