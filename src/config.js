/* nor-restd -- Get configurations */
var fs = require('nor-fs');

/** Merge configurations `from` object to `to` object  */
function merge_config(to, from) {
	Object.keys(from).forEach(function(key) {
		if(typeof from[key] === 'object') {
			if(from[key] instanceof Array) {
				if(to[key] === undefined) {
					to[key] = [];
				}
				if(!(to[key] instanceof Array)) { throw new TypeError('Target config is not an array: '+ key); }
				to[key] = to[key].concat(from[key]);
			} else {
				if(to[key] === undefined) {
					to[key] = {};
				}
				to[key] = merge_config(to[key], from[key]);
			}
		} else {
			to[key] = from[key];
		}
	});
	return to;
}

/** Parse ENV values */
function parse_envs(config, env) {

	/** Parse ENV value */
	function parse_env(key, def) {
		key = ''+key;
		if(typeof env[key] === 'undefined') {
			return def;
		}
		var value = env[key];
		if(value[0] === '@') {
			value = fs.sync.readFile(value.substr(1), {"encoding":"utf8"});
		}
		return value;
	}
	
	/** Parse JSON-formated ENV value */
	function parse_json_env(key, def) {
		return JSON.parse(parse_env(key, def));
	}

	/* Parse ENV values */
	if(env.PROTO) {
		config.proto = (env.PROTO === 'https') ? 'https' : config.proto;
	}
	
	if(env.HOST) {
		config.host = parse_env('HOST', config.host);
	}
	
	if(env.PORT) {
		config.port = parse_env('PORT', config.port);
	}
	
	if(env.USE) {
		config.use = merge_config(config.use, parse_json_env('USE', config.use));
	}
	
	if(env.RESOURCES) {
		config.resources = merge_config(config.resources, parse_json_env('RESOURCES', config.resources));
	}

	if(env.OPTS) {
		config.opts = merge_config(config.opts, parse_json_env('OPTS', config.opts));
	}

	/*
	 * config.use example:
	 * ----
	 * {"auth":"nor-restd-auth-apikey"}
	 * ----
	 */
	
	/*
	 * config.resources example:
	 * ----
	 * {
	 *   "dns": "nor-restd-dns",
	 *   "web": "nor-restd-web",
	 *   "db": "nor-restd-db"
	 * }
	 * ----
	 */
}

/** Get user home directory */
function get_user_home() {
	return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

/** Load configs from file */
function load_file(config, path) {
	if(!fs.sync.exists(path)) { return config; }
	var obj = JSON.parse(fs.sync.readFile(path, {'encoding':'utf8'}));
	return merge_config(config, obj);
}

/** Save config to file synchronously */
function save_to_file(config, path) {
	fs.sync.writeFile(path, JSON.stringify(config, null, 2)+"\n", {'encoding':'utf8'});
}

/** Returns the configuration object */
var mod = module.exports = function() {

	// Defaults
	var config = {
		'proto': 'http',
		'host': '127.0.0.1',
		'port': 3000,
	    'use': [],
		'resources': {},
	    'opts': {}
	};
	
	/* Read from persistant RC file */
	var userfile = require('path').join(get_user_home(), '.nor-restd.json');

	load_file(config, userfile);
	
	/* ENVs will override */
	parse_envs(config, process.env);

	/** Get user home directory */
	config.get_home_dir = get_user_home;

	/** Save configurations */
	config.save = function() {
		save_to_file(config, userfile);
	};

	return config;
};

/* EOF */
