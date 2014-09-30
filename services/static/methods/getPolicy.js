var request = require('request');
var marked = require('marked');
var fmt = require('util').format;

module.exports = function getPolicy (name, next) {
  var url = fmt('https://raw.githubusercontent.com/npm/policies/master/%s.md', name);

  request(url, function (err, resp, content) {

    return next(err, marked.parse(content));
  });
}