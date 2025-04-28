import http from "http";
import { Readable, Transform } from "stream";

const server = http.createServer();

const randomWords = ["apple", "banana", "orange", "tree", "happy"];

// Create a custom Readable stream for random words
function createRandomWordStream() {
  return new Readable({
    read() {
      console.log("read createRandomWordStream");
      console.log(process.memoryUsage());
      

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * randomWords.length);
        const randomWord = randomWords[randomIndex];
        this.push(`${randomWord}\n`);
      }, 100);
    },
    destroy() {
      console.log("destroy createRandomWordStream");
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
    destroy() {
      console.log("destroy createWordInverterTransformStream");
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

server.listen(8081, () => {
  console.log("Server listening on http://localhost:8081");
});
