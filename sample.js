const resver = require(".");

const args = process.argv.slice(2);

const app =
  args.length > 0
    ? resver.createServer({ staticPath: { path: args[0], prefix: "/" } })
    : resver.createServer({
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

let server = resver.listen({
  server: app,
  port: 3000,
  processCount: 2
});
