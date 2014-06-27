var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server;
var fakeSearch = require('./fixtures/fake-search.json');

//set up server
before(function (done) {
  server = require('./fixtures/setupServer')(done);
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
