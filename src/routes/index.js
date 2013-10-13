/* */
var fs = require('nor-fs');
module.exports = function(req, res) {
	return fs.readFile(__dirname + '/../package.json').then(function(data) { return JSON.parse(data); });
};
/* EOF */
