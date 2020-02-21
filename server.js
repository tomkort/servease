const express = require("express");
const path = require("path");
const morgan = require("morgan");
const rotatingFileStream = require("rotating-file-stream");

class ServerProcess {
  /**
   * Construct instance of ServerProcess.
   * @param {?object} server
   *        Express server object or null if master worker.
   * @param {?object} worker
   *        Cluster worker object or null if single process.
   */
  constructor(server, worker) {
    this.server = server;
    this.worker = worker;
  }
  /**
   * Close the server process.
   */
  close() {
    if (this.server) {
      this.server.close(() => {
        if (this.worker) {
          process.exit(0);
        }
      });
    }
  }
}

/**
 * @typedef {Object} Route
 * @property {string} route - Path that the route matches to.
 * @property {string} method - HTTP method of the request to respond to.
 * @property {function} action - Action to execute.
 */

/**
 * Create route.
 * @param   {string} route
 * @param   {string} method
 * @param   {function} action
 * @returns {Route} Route object.
 */
const route = (route, method, action) => {
  return { route: route, method: method, action: action };
};

/**
 * Create server object
 * @param   {?Object} cfg
 *          Object containing configuration.
 * @param   {bool} [cfg.useCompression=true]
 *          Compress the responses.
 * @param   {bool} [cfg.extendedQueryStrings=false]
 *          Enable extendeded query strings.
 * @param   {string} [cfg.logPath="./log"]
 *          Path to directory where to write logs.
 * @param   {?Object} [cfg.static={prefix:"/",path:path.joint[__dirname,"static"]}]
 *          Object containing path and prefix to static files. null if not used.
 * @param   {Route[]} [cfg.routes=[]]
 *          List of routes.
 * @returns {Object}
 *          Express server object.
 */
const createServer = ({
  useCompression = true,
  useJson = true,
  useCookieParser = true,
  extendedQueryStrings = false,
  logPath = "./log",
  errorsToConsole = true,
  staticPath = { prefix: "/", path: path.join(__dirname, "static") },
  routes = []
} = {}) => {
  const app = express();

  const accessLogStream = rotatingFileStream.createStream("access.log", {
    interval: "1d",
    path: logPath
  });

  app.use(express.urlencoded({ extended: extendedQueryStrings }));

  if (useJson) {
    app.use(express.json());
  }
  if (useCookieParser) {
    app.use(require("cookie-parser")());
  }
  if (useCompression === true) {
    app.use(require("compression")());
  }

  // Log errors to console.
  if (errorsToConsole) {
    app.use(
      morgan("dev", {
        skip: (req, res) => {
          return res.statusCode < 400;
        }
      })
    );
  }

  // Log every access in Apache format to file.
  app.use(morgan("combined", { stream: accessLogStream }));

  if (staticPath !== null) {
    app.use(staticPath.prefix, express.static(staticPath.path));
  }

  routes.forEach(route => {
    route.method !== undefined
      ? app[route.method.toLowerCase()](route.route, route.action)
      : app.get(route.route, route.action);
  });

  return app;
};

/**
 * Start server. Optionally in clustered.
 * @param   {Object} params
 *          Object containing parameters.
 * @param   {Object} params.server
 *          Express.js server object.
 * @param   {number} params.port
 *          Port number to listen.
 * @param   {number} [params.processCount=1]
 *          Number of processes to start in cluster mode. Optimally the number of cpu cores.
 * @param   {bool} [params.quiet=false]
 *          Disable printing on console if true.
 * @param   {?Object} [params.httpsOptions=null]
 *          Object containing atleast key and cert, optionally ca. If null and by default, creates http server.
 *          Example:
 *            {
 *              key: fs.readFileSync("./key.pem"),
 *              cert: fs.readFileSync("./cert.pem")
 *            }
 * @returns {ServerProcess}
 *          Object of type ServerProcess.
 */
const listen = ({
  server,
  port,
  processCount = 1,
  quiet = false,
  httpsOptions = null
}) => {
  const log = quiet ? () => {} : console.log;

  const http = httpsOptions ? require("https") : require("http");
  if (processCount === 1) {
    return new ServerProcess(
      (httpsOptions
        ? http.createServer(httpsOptions, server)
        : http.createServer(server)
      ).listen(port, () => {
        if (!quiet) {
          console.log(`Listening on ${port}`);
        }
      }),
      null
    );
  }

  const cluster = require("cluster");

  if (cluster.isMaster) {
    log(`Master process id ${process.pid}`);

    for (let i = 0; i < processCount; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      log(`Worker ${worker.process.pid} died: code ${code}, signal ${signal}`);

      if (Object.keys(cluster.workers).length <= 0) {
        log(`Master ${process.pid} died: code ${code}, signal ${signal}`);
        process.exit(code);
      }
    });
    return new ServerProcess(null, cluster);
  } else {
    return new ServerProcess(
      (httpsOptions
        ? http.createServer(httpsOptions, server)
        : http.createServer(server)
      ).listen(port, () => {
        log(`Worker process id ${process.pid} listening on ${port}`);
      }),
      cluster
    );
  }
};

module.exports = {
  route: route,
  createServer: createServer,
  listen: listen
};
