var Hapi = require('hapi'),
    log = require('bole')('registry-recentauthors'),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')(),
    merge = require('lodash').merge;

var pageSize = 100,
    TWO_WEEKS = 1000 * 60 * 60 * 24 * 14;

// url is something like /recent-authors/:since
module.exports = function RecentAuthors (request, reply) {
  var recentAuthors = request.server.methods.registry.getRecentAuthors,
      showError = request.server.methods.errors.showError(reply),
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric,
      timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    namespace: 'registry-recentauthors'
  }

  // grab the page number, if it's in the url
  var page = Math.abs(parseInt(request.query.page, 10)) || 1;
  var since = request.params.since;

  since = since ? new Date(since) : new Date(Date.now() - TWO_WEEKS);

  if (!since.getTime()) {
    opts.url = request.server.info.uri + request.url.path;
    return showError(opts.url, 404, 'The requested url is invalid', opts);
  }

  var age = Date.now() - since.getTime()
  since = since.toISOString().slice(0, 10)

  var start = (page - 1) * pageSize,
      limit = pageSize;

  recentAuthors(age, start, limit, function (err, authors) {
    if (err) {
      log.warn(uuid.v1() + ' ' + Hapi.error.internal('error retrieving recent authors'), err);
    }

    var items = authors.filter(function (a) { return a.name });

    merge(opts, {
      browseby: since,
      items: items,
      pageSize: pageSize,
      page: page,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: items.length >= pageSize ? page + 1 : null
    });

    opts.prevUrl = opts.prevPage && "/recent-authors/" + opts.browseby + "?page=" + opts.prevPage;
    opts.nextUrl = opts.nextPage && "/recent-authors/" + opts.browseby + "?page=" + opts.nextPage;

    opts.paginate = opts.prevPage || opts.nextPage;

    timer.end = Date.now();
    addLatencyMetric(timer, 'recentauthors');

    addMetric({ name: 'recentauthors' });

    reply.view('registry/recentauthors', opts);
  });
}
