const resver = require(".");
const fetch = require("node-fetch");

const PORT = 3030;
test("Default static file server works and closing the server works.", async () => {
  let indexBody = "";
  let error;

  const server = resver.createServer();
  const app = resver.listen({ server: server, port: PORT, quiet: true });

  await fetch(`http://localhost:${PORT}`)
    .then(async res => {
      indexBody = await res.text();
    })
    .catch(err => {
      console.log(err);
    });

  app.close();

  expect(indexBody.includes("<html>")).toBe(true);
  await fetch(`http://localhost:${PORT}`)
    .then(async res => {
      indexBody = await res.text();
    })
    .catch(err => {
      error = err;
    });

  return expect(error.code).toBe("ECONNREFUSED");
});

test("Routes with different methods.", async () => {
  const routes = [
    resver.route("/getTest", "get", async (req, res) => {
      await expect(req.method).toBe("GET");
      res.send("OK");
    }),
    resver.route("/postTest", "post", async (req, res) => {
      await expect(req.method).toBe("POST");
      res.send("OK");
    })
  ];

  const server = resver.createServer({ routes: routes });
  const app = resver.listen({ server: server, port: PORT, quiet: true });

  let getStatus = "";
  await fetch(`http://localhost:${PORT}/getTest`)
    .then(async res => {
      getStatus = await res.text();
    })
    .catch(err => {
      console.log(err);
    });

  let postStatus = "";
  await fetch(`http://localhost:${PORT}/postTest`, {
    method: "POST",
    body: "a=1"
  })
    .then(async res => {
      postStatus = await res.text();
    })
    .catch(err => {
      console.log(err);
    });

  app.close();
  expect(getStatus).toBe("OK");
  expect(postStatus).toBe("OK");
});
