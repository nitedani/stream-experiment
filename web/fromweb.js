import http from "http";
import { pipeline, Readable } from "stream";

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
  const nodeStream = Readable.fromWeb(stream);
  const web = Readable.toWeb(nodeStream);
  const nodeStream2 = Readable.fromWeb(web);

  nodeStream2.pipe(res);

  setTimeout(() => {
    res.end();
    // nodeStream2.emit('close')
    nodeStream2.destroy()
  }, 1000);
});

server.listen(8081, () => {
  console.log("Server listening on http://localhost:8081");
});
