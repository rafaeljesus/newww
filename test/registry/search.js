var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    sinon = require('sinon'),
    elasticsearch = require('elasticsearch');

var fakeSearch = require('../fixtures/search.json'),
    server;


before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

sinon.stub(elasticsearch, 'Client', function(){
  return {
    search: function(query, cb){
      cb(null, {hits: fakeSearch})
    }
  };
});

describe('Rendering the view', function () {
  it('Should use the index template to render the view', function (done) {
    var options =  {
      url: '/search?q=express',
      method: 'GET'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('registry/search');
      done();
    });
  });

  it('redirects /search/foo to /search?q=foo', function (done) {
    var options =  {
      url: '/search/food-trucks',
      method: 'GET'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include("/search?q=food-trucks");
      done();
    });
  });

  describe('pagination', function () {
    it('understands the page query and uses it properly', function (done) {
      var pageNum = 2;
      var opts = {
        url: '/search/?q=express&page=' + pageNum
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('registry/search');
        expect(source.context.page).to.equal(pageNum);
        expect(source.context.nextPage).to.equal(pageNum + 1);
        expect(source.context.prevPage).to.equal(pageNum - 1);
        done();
      });
    });

    it('coerces negative page numbers to 1', function (done) {
      var pageNum = -1;
      var opts = {
        url: '/search/?q=express&page=' + pageNum
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('registry/search');
        expect(source.context.page).to.equal(1);
        expect(source.context.nextPage).to.equal(2);
        expect(source.context.prevPage).to.not.exist();
        done();
      });
    });

    it('coerces decimal page numbers to 1', function (done) {
      var pageNum = 0.1;
      var opts = {
        url: '/search/?q=express&page=' + pageNum
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('registry/search');
        expect(source.context.page).to.equal(1);
        expect(source.context.nextPage).to.equal(2);
        expect(source.context.prevPage).to.not.exist();
        done();
      });
    });
  });
});
