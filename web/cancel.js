import http from "http";

const server = http.createServer();

const randomWords = ["apple", "banana", "orange", "tree", "happy"];

// Create a custom ReadableStream for random words
function createRandomWordStream() {
  let cancelled = false;
  let timeoutId = null;

  return new ReadableStream({
    start() {
      console.log("start createRandomWordStream");
    },
    pull(controller) {
      console.log("pull createRandomWordStream");

      return new Promise((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }

        timeoutId = setTimeout(() => {
          if (cancelled) {
            resolve();
            return;
          }

          const randomIndex = Math.floor(Math.random() * randomWords.length);
          const randomWord = randomWords[randomIndex];
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`${randomWord}\n`));
          resolve();
        }, 100);
      });
    },
    cancel() {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log("cancel createRandomWordStream");
    },
  });
}

function createWordInverterTransformStream() {
  let cancelled = false;
  return new TransformStream({
    transform(chunk, controller) {
      console.log("transform createWordInverterTransformStream");

      if (cancelled) {
        return;
      }

      const decoder = new TextDecoder();
      const text = decoder.decode(chunk);
      const invertedWord = text.split("").reverse().join("");
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(invertedWord));
    },
    cancel() {
      cancelled = true;
      console.log("cancel createWordInverterTransformStream");
    },
  });
}

function createCombinedStream() {
  const randomWordStream = createRandomWordStream();
  const wordInverterStream = createWordInverterTransformStream();
  return randomWordStream.pipeThrough(wordInverterStream);
}

server.on("request", async (_, res) => {
  // Set appropriate headers for streaming response
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  // Create the combined stream
  const stream = createCombinedStream();

  // Create a WritableStream that writes to the response
  const responseWriter = new WritableStream({
    write(chunk) {
      res.write(chunk);
    },
    close() {
      res.end();
    },
    abort(err) {
      console.error("Stream error:", err);
      res.end();
    },
  });

  // Create an AbortController to handle cancellation
  const abortController = new AbortController();
  const { signal } = abortController;

  // Set a timeout to abort the stream after 1 second
  setTimeout(() => {
    abortController.abort('Timeout reached');
    res.end();
  }, 1000);

  try {
    // Pipe the stream to the response writer with abort signal
    await stream.pipeTo(responseWriter, { signal });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Error piping stream:", error);
    } else {
      console.log("Stream aborted:", error.message);
    }
    if (!res.writableEnded) {
      res.end();
    }
  }
});

server.listen(8081, () => {
  console.log("Server listening on http://localhost:8081");
});
