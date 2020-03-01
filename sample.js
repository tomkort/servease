const servease = require(".");
const fs = require("fs");

const args = process.argv.slice(2);

const app =
  args.length > 0
    ? servease.createServer({ routes: [{ route: "/", root: args[0] }] })
    : servease.createServer();

let server = servease.listen({
  server: app,
  port: 3000
});
