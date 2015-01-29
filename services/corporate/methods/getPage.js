var request = require('request');
var Joi = require('joi');
var marky = require('marky-markdown');
var fmt = require('util').format;

module.exports = {
  static: getPage('static-pages'),
  policy: getPage('policies')
};

function getPage (repo) {

  return function (name, next) {

    Joi.validate(name, Joi.string().regex(/^[a-zA-Z0-9-_]+$/), function (err, validName) {
      if (err) {
        return next(err, null);
      }

      var url = fmt('https://raw.githubusercontent.com/npm/' + repo + '/master/%s.md', validName);

      request(url, function (err, resp, content) {

        if (content === "Not Found") {
          err = content;
          return next(err, null);
        }

        if (typeof content === "string") {
          content = marky(content, {sanitize: false}).html();
        }

        return next(err, content);

      });
    });
  };
}
