'use strict';
const Server = require('../lib/application');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');


const port = 8080;
var app = new Server();

// logger
app.use(function (next) {
    var start = new Date;
    this.res.once('finish', () => {
        console.log(this)
        var ms = new Date - start;
        console.log('%s %s %s - time:%s', this.status, this.method, this.url, ms);
    });
    next();
});
// response
app.use(function (next) {
    let pathname = decodeURI(this.request.pathname);
    if (pathname.slice(-1) === '/') {
        pathname = path.join(pathname, 'index.html');
    }
    pathname = path.join('F:\\Git\\layouter', pathname);
    fs.stat(pathname, (err, stats) => {
        if (err) {
            this.response.status = 404;
        } else {
            if (stats.isFile()) {
                let type = mime.lookup(pathname);
                let charset = mime.charsets.lookup(type);
                this.response.set('Content-Type', type + (charset ? '; charset=' + charset : ''));
                this.body = fs.createReadStream(pathname);
                this.response.charset = 'utf-8';
            } else if (stats.isDirectory()) {
                this.status = 301;
                this.response.set('Location', path + '/');
            } else {
                this.status = 400;
            }
        }
        next();
    });
});
app.listen(port);
console.log('Server is running at http://127.0.0.1:' + port + '/');