/* sysrestd -- The core app code */

var config = {};

var util = require('util');
var http = require('http');
var path = require('path');

var prettified = require('prettified');
var express = require('express');
var nor_express = require('nor-express');

var debug = require('./debug.js');

var main = {};
main.app = express();
main.server = http.createServer(main.app);
main.routes = {};

main.routes.sysrestd = nor_express.routes.load(__dirname+'/routes');

// Setup Express settings
main.app.set('host', config.host || process.env.HOST || '127.0.0.1');
main.app.set('port', config.port || process.env.PORT || 8443);

// Setup express middlewares
main.app.use(express.logger('dev'));
main.app.use(express.methodOverride());
main.app.use(main.app.router);

// Setup primary error handler
main.app.use(function(err, req, res, next) {
	if(err instanceof HTTPError) {
		Object.keys(err.headers).forEach(function(key) {
			res.header(key, err.headers[key]);
		});
		res.send(err.code, {'error':''+err.message, 'code':err.code} );
	} else {
		console.error('Error at ' + __filename + ':' + debug.__line + ': ');
		res.send(500, {'error':'Internal Server Error','code':500} );
	}
});

// Setup secondary error handler if other handlers fail
main.app.use(function(err, req, res, next) {
	console.error('Unexpected error at ' + __filename + ':' + debug.__line + ': ' + util.inspect(err) );
	res.send(500, {'error':'Unexpected Internal Error', 'code':500} );
});

/* Enable regular expressions for validating params */
main.app.param(function(name, fn){
	if (fn instanceof RegExp) {
		return function(req, res, next, val){
			var captures;
			//console.error('DEBUG: at main.app.param(name=' + JSON.stringify(name)+', fn) val = ' + JSON.stringify(val) );
			if (captures = fn.exec(String(val))) {
				//console.error('DEBUG: at main.app.param(name=' + JSON.stringify(name)+', fn) got captures=' + JSON.stringify(captures) );
				req.params[name] = (captures.length === 1) ? captures.shift() : captures;
				next();
			} else {
				next('route');
			}
		};
	}
});

// Setup named params in routes
//main.app.param('item_id', /^\d+$/);
//main.app.param('bid_id', /^\d+$/);
//main.app.param('token', /^[a-zA-Z0-9]+$/);

// Setup routes automatically
nor_express.routes.setup(main.app, main.routes);

// Setup server
main.server.listen(main.app.get('port'), main.app.get('host'), function(){
	console.log('[sysrestd] started on ' + main.app.get('host') + ':' + main.app.get('port'));
});

/* EOF */
