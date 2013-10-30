/* nor-restd -- The core app code */

// Setup logging
module.exports = function(opts) {
	opts = opts || {};

	var util = require('util');
	var path = require('path');
	var fs = require('nor-fs');

	if(!opts.file) { throw TypeError("bad arguments"); }

	var log_file = opts.file;

	var log_dir = path.dirname(log_file);

	var logger = {};

	fs.sync.mkdirIfMissing(log_dir);
	logger.stream = require('fs').createWriteStream(log_file, {flags: 'a'});

	/** Get arguments formatted as string */
	function _format_msg(args) {
		function format(a) {
			if(typeof a !== "string") {
				return util.inspect(a);
			}
			return a;
		}
		return args.map(format).join(' ');
	}
	
	/** Write normal log messages */
	logger.log = function() {
		var args = Array.prototype.slice.call(arguments);
		logger.stream.write( _format_msg(args) + "\n");
		return logger;
	};
	
	/** Write errors to both console.error and log file */
	logger.error = function() {
		var args = Array.prototype.slice.call(arguments);
		console.error( _format_msg(args) );
		return logger.log.apply(logger, args);
	};

	return logger;
};

/* EOF */
