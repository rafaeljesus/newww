var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

var formatNumber = require('number-grouper'),
    Hapi = require('hapi'),
    log = require('bole')('company-homepage'),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')(),
    parseLanguageHeader = require('accept-language-parser').parse,
    fmt = require("util").format;

module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  load(request, function (err, cached) {

    // Use commas, periods, or spaces depending on user language
    try {
      var lang = parseLanguageHeader(request.headers['accept-language'])[0].code
      if (lang === "en") lang = "en-gb" // numeral.js "bug"
      var sep = require(fmt("numeral/languages/%s", lang)).delimiters.thousands
    } catch(err) {
      var sep = " "
    }

    var opts = {
      user: request.auth.credentials,
      updated: cached.updated || [],
      depended: cached.depended || [],
      starred: cached.starred || [],
      authors: cached.authors || [],
      downloads: {
        day: formatNumber(cached.downloads.day, {sep: sep}),
        week: formatNumber(cached.downloads.week, {sep: sep}),
        month: formatNumber(cached.downloads.month, {sep: sep}),
      },
      totalPackages: formatNumber(cached.totalPackages, {sep: sep}),
      hiring: request.server.methods.hiring.getRandomWhosHiring(),
      explicit: require("../../lib/explicit-installs.json")
    };

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'homepage');

    metrics.addMetric({name: 'homepage'});

    // Return raw context object if `json` query param is present
    if (String(process.env.NODE_ENV).match(/dev|staging/) &&  'json' in request.query) {
      return reply(opts);
    }

    reply.view('company/index', opts);
  });
}

// ======= functions =======

function load (request, cb) {
  var browse = request.server.methods.registry.getBrowseData,
      recentAuthors = request.server.methods.registry.getRecentAuthors,
      addMetric = metrics.addMetric,
      downloads = request.server.methods.downloads.getAllDownloads,
      packagesCreated = request.server.methods.registry.packagesCreated;

  var n = 6,
      cached = {};

  browse('star', null, 0, 10, next('starred'));
  browse('depended', null, 0, 10, next('depended'));
  browse('updated', null, 0, 10, next('updated'));
  recentAuthors(TWO_WEEKS, 0, 10, next('authors'));
  downloads(next('downloads'));
  packagesCreated(next('totalPackages'));

  function next (which) {
    return function (err, data) {

      if (err) {
        log.warn(uuid.v1() + ' ' + Hapi.error.internal('download error for ' + which), err);
      }

      cached[which] = data;
      if (--n === 0) {
        return cb(null, cached);
      }
    }
  }
}
