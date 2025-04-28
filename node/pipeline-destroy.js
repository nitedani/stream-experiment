import http from "http";
import { Readable, Transform, pipeline, PassThrough } from "stream";

const server = http.createServer();

const randomWords = ["apple", "banana", "orange", "tree", "happy"];

// Create a custom Readable stream for random words
function createRandomWordStream() {
  let readTimeout = null;
  let isDestroyed = false;

  const readable = new Readable({
    read() {
      if (isDestroyed) {
        console.log("Skipping read on destroyed stream");
        return;
      }

      console.log("read createRandomWordStream");

      // Store the timeout ID so we can clear it during destroy
      readTimeout = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * randomWords.length);
        const randomWord = randomWords[randomIndex];
        this.push(`${randomWord}\n`);
      }, 100);
    },
    destroy(err, callback) {
      console.log("destroy createRandomWordStream - cleaning up resources");

      // Mark the stream as destroyed
      isDestroyed = true;

      // Clear any pending timeout to prevent more data generation
      if (readTimeout) {
        clearTimeout(readTimeout);
        readTimeout = null;
      }

      callback(err);
    },
  });

  return readable;
}

function createWordInverterTransformStream() {
  let isDestroyed = false;

  return new Transform({
    transform(chunk, encoding, callback) {
      if (isDestroyed) {
        console.log("Skipping transform on destroyed stream");
        return callback();
      }

      console.log("transform createWordInverterTransformStream");

      const invertedWord = chunk.toString().split("").reverse().join("");
      console.log("push createWordInverterTransformStream");
      this.push(invertedWord);

      callback();
    },
    destroy(err, callback) {
      console.log(
        "destroy createWordInverterTransformStream - cleaning up resources"
      );
      isDestroyed = true;
      callback(err);
    },
  });
}

/**
 * Creates a combined stream that produces random words and inverts them.
 * @returns {PassThrough} A stream that can be piped to response
 */
function createCombinedStream() {
  // Create our internal streams
  const randomWordStream = createRandomWordStream();
  const wordInverterStream = createWordInverterTransformStream();

  // Set up the internal pipeline
  return pipeline(randomWordStream, wordInverterStream, (err) => {
    if (err) {
      console.log("Internal pipeline error:", err.message);
    } else {
      console.log("Internal pipeline completed normally");
    }
  });
}

server.on("request", (req, res) => {
  if (req.url === "/favicon.ico") {
    res.statusCode = 404;
    res.end();
    return;
  }

  console.log(`New request received: ${req.url}`);
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  const stream = createCombinedStream();

  pipeline(stream, res, (err) => {
    console.error("Pipeline error:", err);
  });

  setTimeout(() => {
    console.log("Timeout reached, ending response");
    res.end();
  }, 1000);
});

server.listen(8081, () => {
  console.log("Server listening on http://localhost:8081");
});
