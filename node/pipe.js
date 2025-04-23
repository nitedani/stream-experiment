import http from "http";
import { Readable, Transform } from "stream";

const server = http.createServer();

const randomWords = ["apple", "banana", "orange", "tree", "happy"];

// Create a custom Readable stream for random words
function createRandomWordStream() {
  return new Readable({
    read() {
      console.log("read createRandomWordStream");

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * randomWords.length);
        const randomWord = randomWords[randomIndex];
        this.push(`${randomWord}\n`);
      }, 100);
    },
  });
}

function createWordInverterTransformStream() {
  return new Transform({
    transform(chunk, encoding, callback) {
      console.log("transform createWordInverterTransformStream");

      const invertedWord = chunk.toString().split("").reverse().join("");
      this.push(invertedWord);
      callback();
    },
  });
}

server.on("request", (req, res) => {
  // Set appropriate headers for streaming response
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  const randomWordStream = createRandomWordStream();
  const wordInverterStream = createWordInverterTransformStream();
  randomWordStream.pipe(wordInverterStream).pipe(res);

  setTimeout(() => {
    res.end();
  }, 1000);
});

server.listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});
