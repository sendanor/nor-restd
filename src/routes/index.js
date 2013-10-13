/* */
var util = require('util');
var fs = require('nor-fs');
module.exports = function(req, res) {
	function parse_data(data) {
		return JSON.parse(data);
	}
	function send_data(data) {
		var ret = {
			'name': data.name,
			'description': data.description,
			'version': data.version,
			'bugs': data.bugs
		};
		return ret;
	}
	return fs.readFile(__dirname + '/../../package.json').then(parse_data).then(send_data);
};
/* EOF */
