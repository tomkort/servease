const servease = require("./server");

module.exports = {
  route: servease.route,
  createServer: servease.createServer,
  listen: servease.listen
};
