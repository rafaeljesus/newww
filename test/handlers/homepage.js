var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
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

describe('GET /', function () {

  it('gets there, no problem', function (done) {
    var opts = {
      url: '/'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('homepage');
      done();
    });
  });

  it('puts stats in the context object', function (done) {
    var opts = {
      url: '/'
    };

    server.inject(opts, function (resp) {
      var context = resp.request.response.source.context;
      expect(context.explicit).to.be.an.array();
      expect(context.modified).to.be.an.object();
      expect(context.dependents).to.be.an.object();
      expect(context.downloads).to.be.an.object();
      done();
    });
  });

  it('gracefully handles a downloads API timeout'/*, function (done) {

  }*/);

});
