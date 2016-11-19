'use strict';
const Server = require('./lib/application');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');


const port = 80;
var app = new Server();

// logger
app.use(function*(next) {
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s %s - time:%s', this.status, this.method, this.url, ms);
});

// response
app.use(function*(next) {
    let pathname = decodeURI(this.request.pathname);
    if (pathname.slice(-1) === '/') {
        pathname = path.join(pathname, 'index.html');
    }
    pathname = path.join('F:/Git/layouter/', pathname);
    this.options = {};
    this.options['pathname'] = pathname;
    yield next;
    if (!this.response.headerSent || this.response.writable) {
        this.body = fs.createReadStream(pathname);
        this.response.charset = 'utf-8';
    }
});
app.use(function*(next) {
    let path = this.request.pathname;
    let pathname = this.options['pathname'];
    let response = this.response;
    let res = this.res;
    yield new Promise(function(resolve, reject) {
        fs.stat(pathname, function(err, stats) {
            if (err) {
                response.status = 404;
                reject(new Error(404));
            } else {
                if (stats.isFile()) {
                    let type = mime.lookup(pathname);
                    let charset = mime.charsets.lookup(type);
                    response.set('Content-Type', type + (charset ? '; charset=' + charset : ''));
                } else if (stats.isDirectory()) {
                    response.status = 301;
                    response.set('Location', path + '/');
                    reject(new Error(301));
                } else {
                    response.status = 400;
                    reject(new Error(400));
                }
            }
            resolve();
        });
    });
});
app.listen(port);
console.log('Server is running at http://127.0.0.1:' + port + '/');