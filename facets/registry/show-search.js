var elasticsearch = require('elasticsearch'),
    Hapi = require('hapi'),
    merge = require('lodash').merge,
    perPage = 24;

module.exports = function (request, reply) {

  var client = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_URL
  });

  // Redirect /search/foo to /search/?foo
  if (request.params && request.params.q) {
    return reply.redirect('/search?q='+request.params.q)
  }

  if (!request.query || !request.query.q) {
    return reply.redirect('/');
  }

  var page = Math.abs(parseInt(request.query.page, 10)) || 1;
  var searchQuery = {
    fields : ['name', 'keywords','description','author','version', 'stars', 'dlScore', 'dlDay', 'dlWeek'],
    body: {
      from: (page - 1) * perPage,
      size : perPage,
      "query" : {
        "dis_max": {
          "tie_breaker": 0.7,
          "boost": 1.2,
          "queries": [
            {
              "function_score": {
                "query": {
                  "match": {
                    "name.untouched": request.query.q
                    /*"name.untouched":{
                      "query": request.query.q,
                      "operator": "and"
                    }*/
                  }
                },
                "boost_factor": 100
              }
            },
            {
              "bool": {
                "should": [
                {"match_phrase": {"name": request.query.q} },
                {"match_phrase": {"keywords": request.query.q} },
                {"match_phrase": {"description": request.query.q} },
                {"match_phrase": {"readme": request.query.q} }
                ],
                "minimum_should_match": 1,
                "boost": 50
              }
            },
            {
              "function_score": {
                "query": {
                  "multi_match": {
                    "query": request.query.q,
                    "fields": ["name^4", "keywords", "description", "readme"]
                  }
                },
                "functions": [
                  {
                    "script_score": {
                      "script": "(doc['dlScore'].isEmpty() ? 0 : doc['dlScore'].value)"
                    }
                  },
                  {
                    "script_score": {
                      "script": "doc['stars'].isEmpty() ? 0 : doc['stars'].value"
                    }
                  }
                ],
                "score_mode": "sum",
                "boost_mode": "multiply"
              }
            }
          ]
        }
      }
    }
  };

  var start = Date.now();
  client.search(searchQuery, function (error, response) {
    request.metrics.metric({
      name: 'latency',
      value: Date.now() - start,
      type: 'elasticsearch',
      query: request.query.q
    });

    var opts = { };

    if (error) {
      request.logger.warn('elasticsearch failed searching ' + request.query.q);
      return reply.view('errors/internal', opts).code(500);
    }

    request.timing.page = 'search';
    request.metrics.metric({ name: 'search', search: request.query.q });

    merge(opts, {
      title: 'results for ',
      page: page,
      q: request.query.q,
      results: response.hits.hits,
      totalResults: response.hits.total,
      singleResult: response.hits.total === 1,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: response.hits.total >= (perPage * page) ? page + 1 : null
    });

    if (opts.prevPage || opts.nextPage) {
      opts.pages = {}
      if (opts.prevPage) {
        opts.pages.prev = "/search?q=" + opts.q + "&page=" + opts.prevPage;
      }
      if (opts.nextPage) {
        opts.pages.next = "/search?q=" + opts.q + "&page=" + opts.nextPage;
      }
    }

    return reply.view('registry/search', opts);
  });
}
