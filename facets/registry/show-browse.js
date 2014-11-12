var sanitizer = require('sanitizer'),
    Hapi = require('hapi'),
    log = require('bole')('registry-browse'),
    merge = require('lodash').merge,
    chunk = require('chunk'),
    metrics = require('newww-metrics')();

var pageSize = 60;
var possibleTypes = ['all', 'keyword', 'author', 'updated', 'depended', 'star', 'userstar'];

module.exports = function (request, reply) {
  var opts = {
    user: request.auth.credentials,

    namespace: 'registry-browse'
  };

  var getBrowseData = request.server.methods.registry.getBrowseData,
      showError = request.server.methods.errors.showError(reply),
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric,
      timer = { start: Date.now() };

  // the url will be something like /browse/{type?}/{arg?}/{page}
  var params = request.params.p || '',
      page, type, arg;

  // grab the page number, if it's in the url
  page = +request.query.page || 1;

  // now let's get the type and arg, if they're in there
  params = params.split('/');
  type = params.shift() || 'updated'; // grab the first one - that will be the type

  if (possibleTypes.indexOf(type) === -1) {
    return showError([type, possibleTypes], 404, 'The requested url is invalid', opts);
  }

  if (type !== 'all' && type !== 'updated') {
    arg = params.shift() || false;
  }

  var browseby = type;
  if (arg) {
    arg = sanitizer.sanitize(arg).replace(/<[^\>]+>/g, '').trim();
  }
  if (arg) {
    browseby += '/' + encodeURIComponent(arg);
  }

  var sarg;
  if (arg) {
    sarg = encodeURIComponent(arg);
  }

  var start = (page - 1) * pageSize,
      limit = pageSize;

  var timer = { start: Date.now() };
  getBrowseData(type, arg, start, limit, function (err, items) {
    timer.end = Date.now();

    if (err) {
      return showError(err, 500, 'There was an error when getting the browse data', opts);
    }

    var key = [type, arg, start, limit].join(', ');

    timer.end = Date.now();
    addLatencyMetric(timer, 'browse ' + key);

    addMetric({
      name: 'browse',
      value: key
    });

    merge(opts, {
      items: chunk(items, 3),
      page: page,
      prevPage: page > 0 ? page - 1 : null,
      nextPage: items.length >= pageSize ? page + 1 : null,
      pageSize: pageSize,
      browseby: browseby,
      type: type,
      arg: type === 'keyword' ? JSON.stringify(sarg) : sarg
    });

    opts.prevUrl = opts.prevPage && "/browse/" + opts.browseby + "?page=" + opts.prevPage;
    opts.nextUrl = opts.nextPage && "/browse/" + opts.browseby + "?page=" + opts.nextPage;

    opts.paginate = opts.prevPage || opts.nextPage;

    // Return raw context object if `json` query param is present
    if (String(process.env.NODE_ENV).match(/dev|staging/) &&  'json' in request.query) {
      return reply(opts);
    }

    return reply.view('registry/browse', opts);
  });
}