var url = require('url');
var qs = require('qs');
var fetch = require('../lib/external-fetch');
var Cache = require('../lib/background-refresh-cache');

var debug = require('debuglog')('newww:cms');

var pageCache = new Cache('content', fetchPage, process.env.CMS_CACHE_TIME || 30 * 60);
var promotionCache = new Cache('promotions', fetchPromotion, process.env.CMS_CACHE_TIME || 30 * 60);

function fetchPage(slug) {
  var pageRoot = url.resolve(process.env.CMS_API, 'pages/');
  var pageUrl = url.resolve(pageRoot, slug);
  debug("Fetching %j for %j", pageUrl, slug);
  return fetchAndDecode(pageUrl).then(function(page) {
    debug("Got content for %j: %j", slug, page);
    if (!page.id || !page.html || !page.title) {
      throw new Error("Invalid page returned");
    }
    return page;
  });
}

function fetchAndDecode(url) {
  return fetch(url).then(function(res) {
    if (res.status >= 300) {
      var err = new Error("Bad status: " + res.status);
      err.statusCode = res.status;
      throw err;
    }
    return res.json();
  }).then(assertObject).then(function addMarker(json) {
    json.fetchedAt = Date.now();
    return json;
  });
}

function assertObject(val) {
  if (typeof val != 'object') {
    throw new Error("Invalid data received");
  }
  return val;
}

function fetchPromotion(tags) {
  var promotionRoot = url.resolve(process.env.CMS_API, 'promotions');
  var promotionUrl = url.resolve(promotionRoot, '?' + qs.stringify({
      user_vars: tags
    }));
  debug("Fetching promos for tags %j", tags);
  return fetchAndDecode(promotionUrl).then(function(promo) {
    debug("Got promo %j", promo);

    // Because templates make it hard to get to non-javascript-property named variables, we fix those up.
    var out = {};
    Object.keys(promo).forEach(function(k) {
      out[k.replace(/-(.)/g, (m, p1) => p1.toUpperCase())] = promo[k];
    });

    debug("reformatted promo to %j", out);
    return out;
  });
}

module.exports = {
  getPage: function getPage(slug) {
    return pageCache.get(slug);
  },
  getPromotion: function getPromotion(tags) {
    return promotionCache.get([].concat(tags));
  }
};
