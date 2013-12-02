/** Helpers */
var helpers = module.exports = {};

/** Sets `req.hostref` based on `req.headers.host` and it will read protocol 
 * (`"https"` or `"http"`) from `config.proto` */
helpers.hostref = function(config) {
	var ret = function(req, res, next) {
		req.hostref = config.proto + '://' + ( req.headers && req.headers.host );
		next();
	};
	return ret;
};

/** Generate service root resource handler by linking to each key in an array 
 * `config.resources` */
helpers.root_resource = function(config) {
	// FIXME: assertArray(config.resources)
	var retf = function(req, res) {
		var ret = {};
		config.resources.forEach(function(key) {
			// FIXME: Escape keywords
			ret[key] = { '$ref': req.hostref + '/'+key };
		});
		return ret;
	};
	return retf;
};


/** Returns a filter function that returns `true` if given input is not 
 * `value` */
function not_value(value) {
	return function(k) { return (k !== value) ? true : false; };
}

/** Returns a function which takes module keyword as an argument and returns 
 * an object with the prepared module information. It can be used to load mixed 
 * style restd modules.
 * @param {Object} config The app configuration, which should have properties 
 *                        `resources` and `opts`.
 */
helpers.load_module = function(config) {
	var is = require('nor-is');

	var f = function(module_key) {

		// First we load the generic module object
		var mod = require( config.resources[module_key] );

		// Then get the configuration for our module
		var mod_config = config.opts[module_key] || {};
		if(!mod_config.url) {
			// FIXME: url should have protocol, host, port (if neccessary), etc
			mod_config.url = '/' + module_key;
		}

		// Get the actual instance of a module (which is a standard 
		// `function(req, res)` handler or a route object)
		var mod_instance = is.func(mod) ? mod(mod_config) : mod;
		
		// If the instance if also a function (we assume it's now standard 
		// `function(req,res)`), we'll use Express's `app.use()`
		// instead of `app.get()`, which chroots the `req.url` etc.
		if(is.func(mod_instance)) {
			mod_instance = {'USE': mod_instance};
		}

		// Optional named route params
		var mod_params = is.obj(mod_instance[':params']) ? mod_instance[':params'] : {};

		var mod_routes = {};
		Object.keys(mod_instance).filter(not_value(':params')).forEach(function(key) {
			mod_routes[key] = mod_instance[key];
		});

		var ret = {
			'key'    : module_key,
			'config' : mod_config,
			'params' : mod_params,
			'routes' : mod_routes
		};

		return ret;
	};
	return f;
};

/** Returns a `function(data, req, res, next)` which handles sending data by 
 * using viewer plugin or sending it directly.
 */
helpers.viewer_handler = function(opts) {
	var f = function(data, req, res, next) {

		//util.debug('req.url = ' + util.inspect(req.url) );

		// If there is no viewer or request doesn't accept html, just send the data.
		if(!(
		  opts && opts.resources && opts.resources.viewer
		  && opts && opts.routes.viewer && opts.routes.viewer.USE
		  && (req.url !== '/viewer')
		  && (req.url.substr(0, '/viewer/'.length) !== '/viewer/')
		  && (req.accepts('html', 'json') === 'html')
		  )) {
			res.send(data);
			return;
		}
		
		// Setup req.locals if missing
		if(!req.locals) {
			req.locals = {};
		}
		req.locals.body = data;
		
		// Use the viewer plugin
		return opts.routes.viewer.USE(req, res, next);
	};
	return f;
};

/* EOF */
