/* nor-restd -- The core app code */

var config = require('./config.js')();
var LOG_FILE = require('path').join(config.get_home_dir(), '.nor-restd', 'app.log');
var util = require('util');
var http = require('http');
var prettified = require('prettified');
var express = require('express');
var is = require('nor-is');
var nor_express = require('nor-express');
var HTTPError = nor_express.HTTPError;
var debug = require('./debug.js');
var helpers = require('./helpers.js');

var app = express();
var server = http.createServer(app);
var app_params = {};

// Setup routes
var resource_keys = Object.keys(config.resources);

var routes = {
	'GET': helpers.root_resource({'resources': ['_service'].concat(resource_keys)}),
	'_service': nor_express.routes.load(__dirname+'/routes')
};

// Append routes from 3rd party resource modules
resource_keys.map(helpers.load_module(config)).forEach(function(mod) {

	Object.keys(mod.params).forEach(function(key) {
		if(app_params[key] !== undefined) {
			// FIXME: Implement support for same keywords inside different 
			// resources
			throw new TypeError("param (" + key + ") already defined at module " + app_params[key].module);
		}
		app_params[key] = {
			module: ''+mod.key,
			value: mod.params[key]
		};
	});

	routes[mod.key] = mod.routes;

});

// Setup Express settings
app.set('proto', config.proto);
app.set('host', config.host);
app.set('port', config.port);

// Setup express middlewares

var logger = require('./logger.js')({'file':LOG_FILE});

app.use(express.logger({stream: logger.stream}));
app.use(express.methodOverride());
app.use(helpers.hostref({'proto':config.proto}));

Object.keys(config.use).forEach(function(key) {
	var module_name = config.use[key];
	var module = require(module_name);
	app.use(module(config.opts[key]));
});

app.use(app.router);

// Setup routes automatically
nor_express.routes.setup(app, routes, undefined, {
	"sender": helpers.viewer_handler({resources:config.resources, routes:routes})
});

/* Enable regular expressions for validating params */
app.param(helpers.enable_regexp_params());

// Setup named params in routes
Object.keys(app_params).forEach(function(key) {
	app.param(key, app_params[key].value);
});

app.use(helpers.defaultHandler());      // Default handler for requests
app.use(helpers.errorHandler());        // Primary error handlers
app.use(helpers.simpleErrorHandler());  // Secondary backup error handler

// Setup server
server.listen(app.get('port'), app.get('host'), function(){
	logger.log('[nor-restd#'+process.pid+'] started on ' + app.get('host') + ':' + app.get('port'));
});

/* EOF */
