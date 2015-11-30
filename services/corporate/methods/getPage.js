var request = require('request');
var Joi = require('joi');
var marky = require('marky-markdown');
var fmt = require('util').format;

module.exports = {
  static: getPage('static-pages'),
  policy: getPage('policies')
};

function getPage(repo) {

  return function(name, next) {
    var branch;
    Joi.validate(name, Joi.string().regex(/^[a-zA-Z0-9-_]+$/), function(err, validName) {
      if (err) {
        return next(err, null);
      }

      var org = "npm";
      if (repo === "static-pages") {
        branch = (new Date() > new Date("2015-04-14T03:30:00-07:00")) ? "master" : "prerelease";
      } else {
        branch = "master";
      }

      var url = fmt('https://raw.githubusercontent.com/%s/%s/%s/%s.md', org, repo, branch, validName);

      request(url, function(err, resp, content) {

        if (content === "Not Found") {
          err = content;
          return next(err, null);
        }

        if (typeof content === "string") {
          content = marky(content, {
            sanitize: false
          }).html();
        }

        return next(err, content);

      });
    });
  };
}
