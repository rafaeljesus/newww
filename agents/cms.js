var P = require('bluebird');
var url = require('url');
var fetch = require('node-fetch');
fetch.Promise = P;

var Cache = require('../lib/background-refresh-cache');

var debug = require('debuglog')('newww:cms');

var cache = new Cache('content', fetchPage, process.env.CMS_CACHE_TIME || 30 * 60);

function fetchPage(slug) {
  var pageRoot = url.resolve(process.env.CMS_API, 'pages/');
  var pageUrl = url.resolve(pageRoot, slug);
  debug("Fetching %j for %j", pageUrl, slug);
  return fetch(pageUrl).then(function(res) {
    if (res.status >= 300) {
      var err = new Error("Bad status: " + res.status);
      err.statusCode = res.status;
      throw err;
    }
    return res.json()
  }).then(function(page) {
    debug("Got content for %j: %j", slug, page);
    if (typeof page != 'object' || !page.id || !page.html || !page.title) {
      throw new Error("Invalid page returned");
    }
    return page;
  }).then(function addMarker(json) {
    json.fetchedAt = Date.now();
    return json;
  });
}

module.exports = {
  getPage: function getPage(slug) {
    return cache.get(slug);
  }
};
