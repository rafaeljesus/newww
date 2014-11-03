var request = require('request');
var marked = require('marked');
var fmt = require('util').format;

module.exports = {
  static: getPage('static-pages'),
  policy: getPage('policies')
}

function getPage (type) {

  return function (name, next) {

    var url = fmt('https://raw.githubusercontent.com/npm/' + type + '/master/%s.md', name);

    request(url, function (err, resp, content) {

      if (content === "Not Found") {
        err = content;
        return next(err, null);
      }

      return next(err, marked.parse(content));
    });
  }
}