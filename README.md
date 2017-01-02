# server
this is a web app framework

## Install
    npm install hserver --save

## Example
1. Hello World

        'use strict';
        const Server = require('hserver');
        const port = 80;
        var app = new Server();

        app.use(function(next){
            this.body = 'Hello World';
            return next();
        });

        app.use(function(next) {
            this.body += '!';
            return next();
        });

        app.listen(port);
        console.log('Server is running at http://127.0.0.1:' + port + '/');

2. A simple file server
        
        'use strict';
        const Server = require('hserver');
        const path = require('path');
        const fs = require('fs');
        const mime = require('mime-types');
        const port = 8080;

        var app = new Server();

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

## API
#### app.use()
accept a function as argument,It is used as a middleware for loading,
and argunment function bind context as inner this.
the function's argunmet next can load next middleware.

    context.app -the server application
    context.request -the packaging of the request
    context.response -the packaging of the response
    context.req -the node origin request
    context.res -the node origin response
    context.url -the request url
    context.method -the request method
    context.accept -the request accept
    context.status -the response status
    context.body -the response body
    context.headerSent -the response headerSent
    context.writable -the request writable
    context.get -get request header
    context.set -set request header
    
#### app.listen() 
can start a node origin http server.

#### app.callback()
a request handle function,you can use it at origin http server,such as

    const http = require('http');
    const server = http.createServer(this.callback());
    server.listen(8080);