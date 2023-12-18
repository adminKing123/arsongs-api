const express = require("express");
const fs = require("fs");
const serverless = require("serverless-http");
const path = require("path");

const app = express();
const router = express.Router();

router.get("/check-status", (req, res) => {
  res.json({"status": "Working"});
})

router.get("/stream-mp3/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(
    __dirname,
    "songs-file",
    filename
  );

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, send a 404 error response
      res.status(404).send('File not found');
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "audio/mpeg",
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
// app.listen(3000, () => {
//   console.log("Server is running on port 3000");
// });
