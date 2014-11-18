var request = require('request');
var Joi = require('joi');
var marked = require('marked');
var fmt = require('util').format;

module.exports = {
  static: getPage('static-pages'),
  policy: getPage('policies')
};

function getPage (repo) {

  return function (name, next) {

    Joi.validate(name, Joi.string().alphanum(), function (err, validName) {
      if (err) {
        return next(err, null);
      }

      var url = fmt('https://raw.githubusercontent.com/npm/' + repo + '/master/%s.md', validName);

      request(url, function (err, resp, content) {

        if (content === "Not Found") {
          err = content;
          return next(err, null);
        }

        return next(err, marked.parse(content));
      });
    });
  };
}