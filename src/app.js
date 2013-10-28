/* nor-restd -- The core app code */

var fs = require('nor-fs');

function parse_env(key, def) {
	key = ''+key;
	if(typeof process.env[key] === 'undefined') {
		return def;
	}
	var value = process.env[key];
	if(value[0] === '@') {
		value = fs.sync.readFile(value.substr(1), {"encoding":"utf8"});
	}
	return value;
}

function parse_json_env(key, def) {
	return JSON.parse(parse_env(key, def));
}

// Defaults
var config = require('./config.js')();

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
		Object.keys(config.resources).forEach(function(key) {
			ret[key] = {'$ref': req.hostref + '/'+key};
		});
		return ret;
	},
	'_service': app_routes
};

// Setup routes from 3rd party resources
Object.keys(config.resources).forEach(function(module_key) {
	var mod = require( config.resources[module_key] );

	var mod_config = config.opts[module_key] || {};
	if(!mod_config.url) {
		// FIXME: url should have protocol, host, port, etc
		mod_config.url = '/' + module_key;
	}

	var mod_instance, params, obj;
	if(is.func(mod)) {
		mod_instance = mod(mod_config);
	} else {
		mod_instance = mod;
	}
	
	if(is.func(mod_instance)) {
		mod_instance = {'USE': mod_instance};
	}

	if(is.obj(mod_instance[':params'])) {
		params = mod_instance[':params'];
	} else {
		params = {};
	}

	Object.keys(params).forEach(function(key) {
		if(app_params[key] !== undefined) {
			// FIXME: Implement support for same keywords inside different resources
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

Object.keys(config.use).forEach(function(key) {
	var module_name = config.use[key];
	var module = require(module_name);
	main.app.use(module(config.opts[key]));
});

/** Enable support for HTML viewer */
main.app.use(function(req, res, next) {
	if(!(
	  config && config.resources && config.resources.viewer
	  && main && main.routes && main.routes.viewer && main.routes.viewer.USE
	  && (req.accepts('html', 'json') === 'html')
	  )) {
		return next();
	}

	return main.routes.viewer.USE(req, res, next);
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
	console.log('[nor-restd#'+process.pid+'] started on ' + main.app.get('host') + ':' + main.app.get('port'));
});

/* EOF */
