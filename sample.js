const servease = require(".");
const fs = require("fs");

const args = process.argv.slice(2);

const app =
  args.length > 0
    ? servease.createServer({ staticPath: { path: args[0], prefix: "/" } })
    : servease.createServer({
        routes: [
          {
            route: "/post",
            method: "get",
            action: (req, res) => {
              res.send("OK");
            }
          }
        ]
      });

let server = servease.listen({
  server: app,
  port: 3000,
  processCount: 2,
  httpsOptions: {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
  }
});
