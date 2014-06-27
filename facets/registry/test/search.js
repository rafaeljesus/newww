var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var Hapi = require('hapi');
var server;
var fakeSearch = require('./fixtures/fake-search.json'),
    registry = require('../');

registry.name = 'registry';
registry.version = '0.0.1';

//set up server
before(function (done) {
  var serverOptions  = {
    views: {
      engines: {hbs: require('handlebars')},
      partialsPath: '../../hbs-partials',
      helpersPath: '../../hbs-helpers'
    }
  };
  server = Hapi.createServer(serverOptions);

  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register(registry, done);
  });
});

describe('Rendering the view', function () {
  var source;
  it('Should use the index template to render the view', function (done) {
  //simulate a search for a given module, results are in fakeSearch
  var options =  {
    url: '/search?q=express',
    method: 'GET'
  };

  server.ext('onPreResponse', function (request, next){
    source = request.response.source;
    next();
  });

  server.inject(options, function (resp) {
    expect(resp.statusCode).to.equal(200);
    expect(source.template).to.equal('search');
    done();
    });
  });
});
