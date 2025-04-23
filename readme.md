node/pipe.js - doesn't propagate stream cancellation, leaks, doesn't throw, doesn't clean up
node/pipeline.js - propagates stream cancellation, gracefully handles errors and cleans up

web/cancel.js - propagates stream cancellation, cleans up, no errors here
web/nocancel.js - doesn't implement the cancel methods, process exits on error


