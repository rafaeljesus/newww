
var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect,
    Hapi = require('hapi'),
    corporate = require('../../services/corporate'),
    nock = require('nock'),
    config = require('../../config'),
    metrics = require('../../adapters/metrics')(config.metrics),
    server;

before(function (done) {
  server = Hapi.createServer('localhost', '8123');
  server.pack.register(corporate, function () {
    server.start(done);
  });
});

describe('getting pages from GitHub', function () {
  it('successfully grabs a static page', function (done) {
    var md = "*emphasis* on **this** [link](boom.com)",
        html = '<p><em>emphasis</em> on <strong>this</strong> <a href="boom.com">link</a></p>\n';

    var couch = nock("https://raw.githubusercontent.com/")
        .get('/npm/static-pages/master/boom.md')
        .reply(200, md)

    server.methods.corp.getPage('boom', function (er, content) {
      expect(er).to.not.exist;
      expect(content).to.exist;
      expect(content).to.equal(html);
      done();
    });
  });

  it('successfully grabs a policy page', function (done) {
    var md = "*emphasis* on **this** [link](bam.com)",
        html = '<p><em>emphasis</em> on <strong>this</strong> <a href="bam.com">link</a></p>\n';

    var couch = nock("https://raw.githubusercontent.com/")
        .get('/npm/policies/master/bam.md')
        .reply(200, md)

    server.methods.corp.getPolicy('bam', function (er, content) {
      expect(er).to.not.exist;
      expect(content).to.exist;
      expect(content).to.equal(html);
      done();
    });
  });

  it('returns an error if no content is found', function (done) {
    var md = "Not Found";

    var couch = nock("https://raw.githubusercontent.com/")
        .get('/npm/policies/master/error.md')
        .reply(200, md)

    server.methods.corp.getPolicy('error', function (er, content) {
      expect(er).to.exist;
      expect(er).to.equal('Not Found');
      expect(content).to.be.null;
      done();
    });
  });

  it('returns an error if the page name is not alphanumeric', function (done) {
    server.methods.corp.getPolicy('%2f..%2fboom', function (er, content) {
      expect(er).to.exist;
      var message = er.details[0].message;
      expect(message).to.equal('value fails to match the required pattern');
      expect(content).to.be.null;
      done();
    });
  })
});
