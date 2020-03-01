# servease
Create Express servers easily.

Servease provides couple helper functions to create and start Express servers. It sets up some of the common things, like logging, automatically.

# Usage
```js
const path = require("path");
const servease = require("servease");

const action = (req, res) => {
    res.send("result");
}

// createServer takes configuration as parameter. Routes are included in the configuration object.
// createServer returns plain Express server object.
let app = servease.createServer({
    useCompression: true,
    routes: [
        {route: "/static", root: path.join(__dirname, "static")},
        {route: "/action", action: action}
    ]
});

// To start the server, call listen.
// If processCount is more than 1, the server is automatically clustered using the "cluster" module.
let server = servease.listen({
    server: app,
    port: 3000,
    processCount: 4
});
```

## Tests
To run tests
```bash
$ yarn test
```

## Licence
[MIT](LICENSE)