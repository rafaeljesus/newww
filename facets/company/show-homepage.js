var TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // in milliseconds

var commaIt = require('number-grouper'),
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
        day: commaIt(cached.downloads.day, {sep: sep}),
        week: commaIt(cached.downloads.week, {sep: sep}),
        month: commaIt(cached.downloads.month, {sep: sep}),
      },
      totalPackages: commaIt(cached.totalPackages, {sep: sep}),
      hiring: request.server.methods.hiring.getRandomWhosHiring()
    };

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'homepage');

    metrics.addMetric({name: 'homepage'});

    // Return raw context object if `json` query param is present
    if (String(process.env.NODE_ENV).match(/dev|staging/) &&  'json' in request.query) {
      return reply(opts);
    }

    return reply.view('company/index', opts);
  });
}

// ======= functions =======

function load (request, cb) {
  var registry = request.server.methods.registry,
      recentAuthors = registry.getRecentAuthors,
      addMetric = metrics.addMetric,
      downloads = request.server.methods.downloads.getAllDownloads;

  var n = 6,
      cached = {};

  registry.getStarredPackages(null, 0, 10, next('starred'));
  registry.getDependedUpon(null, 0, 10, next('depended'));
  registry.getUpdated(0, 10, next('updated'));
  recentAuthors(TWO_WEEKS, 0, 10, next('authors'));
  downloads(next('downloads'));
  registry.packagesCreated(next('totalPackages'));

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
