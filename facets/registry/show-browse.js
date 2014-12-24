var sanitizer = require('sanitizer'),
    merge = require('lodash').merge,
    chunk = require('chunk');

var pageSize = 60;
var possibleTypes = ['all', 'keyword', 'author', 'updated', 'depended', 'star', 'userstar'];

module.exports = function (request, reply) {
  var opts = { };

  var getBrowseData = request.server.methods.registry.getBrowseData;

  // the url will be something like /browse/{type?}/{arg?}/{page}
  var params = request.params.p || '';
  var page, type, arg;

  // grab the page number, if it's in the url
  page = Math.abs(parseInt(request.query.page, 10)) || 1;

  // now let's get the type and arg, if they're in there
  params = params.split('/');
  type = params.shift() || 'updated'; // grab the first one - that will be the type

  if (possibleTypes.indexOf(type) === -1) {
    request.logger.warn('the requested url is invalid');
    reply.view('errors/not-found', opts).code(404);
    return;
  }

  if (type !== 'all' && type !== 'updated') {
    arg = params.shift() || false;
  } else {
    arg = false;
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

  var startTimer = Date.now();
  getBrowseData(type, arg, start, limit, function (err, items) {

    var key = [type, arg, start, limit].join(', ');

    request.timing.page = 'browse ' + key;
    request.metrics.metric({
      name: 'browse',
      value: key
    });
    request.metrics.metric({
      name: 'latency',
      value: Date.now() - startTimer,
      type: 'couch',
      action: type
    });

    if (err) {
      // do nothing, because there should never be an error
      request.logger.error('the impossible has happened when getting browse data!');
      request.logger.error(err);
    }

    merge(opts, {
      items: chunk(items, 3),
      page: page,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: items.length >= pageSize ? page + 1 : null,
      pageSize: pageSize,
      browseby: browseby,
      type: type,
      arg: type === 'keyword' ? JSON.stringify(sarg) : sarg
    });

    opts.prevUrl = opts.prevPage && "/browse/" + opts.browseby + "?page=" + opts.prevPage;
    opts.nextUrl = opts.nextPage && "/browse/" + opts.browseby + "?page=" + opts.nextPage;

    opts.paginate = opts.prevPage || opts.nextPage;

    return reply.view('registry/browse', opts);
  });
};
