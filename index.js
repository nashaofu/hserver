'use strict';
const Server = require('./lib/application');
const path = require('path');
const fs = require('fs');
const port = 8080;
var app = new Server();

app.use(function* (next) {
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
});

// response
app.use(function* (next) {
    this.body = fs.createReadStream('F:/Github/node-staticserver/lib/server.js');
    this.response.type = 'text/plain';
    this.response.charset = 'utf-8';
    console.log(this);
});
app.listen(port);