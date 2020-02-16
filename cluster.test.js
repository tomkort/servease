const servease = require(".");
const fetch = require("node-fetch");

const PORT = 3040;

test("Clustered server.", async () => {
  const server = servease.createServer();
  const cluster = servease.listen({
    server: server,
    port: PORT,
    processCount: 2,
    quiet: true
  });

  if (cluster.worker.isWorker) {
    let indexBody = "";
    await fetch(`http://localhost:${PORT}`)
      .then(async res => {
        indexBody = await res.text();
      })
      .catch(err => {
        console.log(err);
      });

    expect(indexBody.includes("<html>")).toBe(true);
    cluster.close();

    let error;
    await fetch(`http://localhost:${PORT}`)
      .then(async res => {
        indexBody = await res.text();
      })
      .catch(err => {
        error = err;
      });

    return expect(error.code).toBe("ECONNREFUSED");
  }
  return expect(cluster.worker.isMaster).toBe(true);
});
