var P = require('bluebird');
var hq = require('hyperquest');
var url = require('url');
var bl = require('bl');

module.exports = function getPage(slug) {
  var pageRoot = url.resolve(process.env.CMS_API, 'pages/');
  return new P(function(accept, reject) {
    return hq(url.resolve(pageRoot, slug)).pipe(bl(function(err, data) {
      if (err) {
        return reject(err);
      } else {
        data = data.toString();
        console.warn(data);
        return accept(data);
      }
    }))
  });
};

