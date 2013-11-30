/* parse.js */

var fs = require('nor-fs');
var env = module.exports = {};

/** Parse environment variable */
env.parse = function(key, def) {
	key = ''+key;
	if(typeof process.env[key] === 'undefined') {
		return def;
	}
	var value = process.env[key];
	if(value[0] === '@') {
		value = fs.sync.readFile(value.substr(1), {"encoding":"utf8"});
	}
	return value;
};

/** Parse JSON-based environment variable */
env.parseJSON = function(key, def) {
	return JSON.parse(env.parse(key, def));
};

/* EOF */
