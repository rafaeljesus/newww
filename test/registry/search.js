var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect,
    sinon = require('sinon'),
    elasticsearch = require('elasticsearch');

var fakeSearch = require('../fixtures/fake-search.json'),
    server;

before(function (done) {
  server = require('../fixtures/setupServer')(done);
});

sinon.stub(elasticsearch, 'Client', function(){
  return {
    search: function(query, cb){
      cb(null, fakeSearch)
    }
  };
});

describe('Rendering the view', function () {
  var source;
  it('Should use the index template to render the view', function (done) {
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
    expect(source.template).to.equal('registry/search');
    done();
    });
  });
});
