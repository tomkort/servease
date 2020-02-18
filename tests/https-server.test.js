const servease = require("..");
const fetch = require("node-fetch");
const fs = require("fs");
const https = require("https");

const PORT = 3032;

test("HTTPS support.", async () => {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  let indexBody = "";
  let error;

  const server = servease.createServer();
  const app = servease.listen({
    httpsOptions: {
      key: fs.readFileSync("tests/key.pem"),
      cert: fs.readFileSync("tests/cert.pem")
    },
    server: server,
    port: PORT,
    quiet: true
  });

  await fetch(`https://localhost:${PORT}`, { agent: httpsAgent })
    .then(async res => {
      indexBody = await res.text();
    })
    .catch(err => {
      console.log(err);
    });

  app.close();

  expect(indexBody.includes("<html>")).toBe(true);
  await fetch(`https://localhost:${PORT}`, { agent: httpsAgent })
    .then(async res => {
      indexBody = await res.text();
    })
    .catch(err => {
      error = err;
    });

  return expect(error.code).toBe("ECONNREFUSED");
});
