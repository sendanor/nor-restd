/* sysrestd -- The core app code */

var config = {
	'proto': (process.env.PROTO === 'https') ? 'https' : 'http',
	'host': process.env.HOST || '127.0.0.1',
	'port': process.env.PORT || 3000,
	'modules': process.env.MODULES ? JSON.parse(process.env.MODULES) : {}
};

/*
 * config.modules is for example:
 * ----
 * {
 *   'dns': 'nor-sysrestd-dns',
 *   'web': 'nor-sysrestd-web',
 *   'db': 'nor-sysrestd-db'
 * }
 * ----
 */

var util = require('util');
var http = require('http');
var path = require('path');

var prettified = require('prettified');
var express = require('express');
var is = require('nor-is');
var nor_express = require('nor-express');
var HTTPError = nor_express.HTTPError;

var debug = require('./debug.js');

var main = {};
main.app = express();

main.server = http.createServer(main.app);

var app_routes = nor_express.routes.load(__dirname+'/routes');
var app_params = {};

// Setup local routes
main.routes = {
	'GET': function(req, res) {
		var ret = {};
		ret._service = {
			'$ref': req.hostref + '/_service'
		};
		Object.keys(config.modules).forEach(function(key) {
			ret[key] = {'$ref': req.hostref + '/'+key};
		});
		return ret;
	},
	'_service': app_routes
};

// Setup routes from 3rd party modules
Object.keys(config.modules).forEach(function(module_key) {
	var mod = require( config.modules[module_key] );
	var mod_instance, params, obj;
	if(is.func(mod)) {
		// FIXME: Implement support for module options
		mod_instance = mod(/* opts */);
	} else {
		mod_instance = mod;
	}
	
	if(is.obj(mod_instance[':params'])) {
		params = mod_instance[':params'];
	} else {
		params = {};
	}

	Object.keys(params).forEach(function(key) {
		if(app_params[key] !== undefined) {
			// FIXME: Implement support for same keywords inside different modules
			throw new TypeError("param (" + key + ") already defined at module " + app_params[key].module);
		}
		app_params[key] = {
			module: ''+module_key,
			value: params[key]
		};
	});

	obj = {};
	Object.keys(mod_instance).filter(function(k){ return k !== ':params'; }).forEach(function(key) {
		obj[key] = mod_instance[key];
	});

	main.routes[module_key] = obj;
});

// Setup Express settings
main.app.set('proto', config.proto);
main.app.set('host', config.host);
main.app.set('port', config.port);

// Setup express middlewares
main.app.use(express.logger('dev'));
main.app.use(express.methodOverride());

main.app.use(function(req, res, next) {
	req.hostref = config.proto + '://' + ( req.headers && req.headers.host );
	next();
});

main.app.use(main.app.router);

// Setup routes automatically
nor_express.routes.setup(main.app, main.routes);

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
Object.keys(app_params).forEach(function(key) {
	main.app.param(key, app_params[key].value);
});

// Default handler for requests
main.app.use(function(req, res, next) {
	throw new HTTPError(404, "Not Found");
});

// Setup primary error handler
main.app.use(function(err, req, res, next) {
	if(err instanceof HTTPError) {
		Object.keys(err.headers).forEach(function(key) {
			res.header(key, err.headers[key]);
		});
		res.send(err.code, {'error':''+err.message, 'code':err.code} );
	} else {
		prettified.errors.print(err);
		res.send(500, {'error':'Internal Server Error','code':500} );
	}
});

// Setup secondary error handler if other handlers fail
main.app.use(function(err, req, res, next) {
	console.error('Unexpected error: ' + util.inspect(err) );
	res.send(500, {'error':'Unexpected Internal Error', 'code':500} );
});

// Setup server
main.server.listen(main.app.get('port'), main.app.get('host'), function(){
	console.log('[sysrestd] started on ' + main.app.get('host') + ':' + main.app.get('port'));
});

/* EOF */
