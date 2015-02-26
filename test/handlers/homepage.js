var cheerio = require('cheerio'),
    nock = require("nock"),
    fixtures = require("../fixtures"),
    Code = require('code'),
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
  var resp
  var options = {url: "/"}
  var packageMock = nock("https://user-api-example.com")
    .get('/package?sort=dependents')
    .reply(200, fixtures.aggregates.most_depended_upon_packages)
    .get('/package?sort=modified')
    .reply(200, fixtures.aggregates.recently_updated_packages)
    .get('/package/-/count')
    .reply(200, 12345);
  var downloadsMock = nock("https://downloads-api-example.com")
    .get('/point/last-day')
    .reply(200, fixtures.downloads.all['last-day'])
    .get('/point/last-week')
    .reply(200, fixtures.downloads.all['last-week'])
    .get('/point/last-month')
    .reply(200, fixtures.downloads.all['last-month']);

  before(function(done){
    server.inject(options, function (response) {
      resp = response
      packageMock.done()
      downloadsMock.done()
      done()
    })
  })


  it('gets there, no problem', function (done) {
    expect(resp.statusCode).to.equal(200);
    expect(resp.request.response.source.template).to.equal('homepage');
    done();
  });

  it('puts stats in the context object', function (done) {
    var context = resp.request.response.source.context;
    expect(context.explicit).to.be.an.array();
    expect(context.modified).to.be.an.object();
    expect(context.dependents).to.be.an.object();
    expect(context.downloads).to.be.an.object();
    expect(context.totalPackages).to.be.a.number();
    done();
  });

  it('renders a data-filled template', function (done) {
    var context = resp.request.response.source.context;
    expect(context.totalPackages).to.be.a.number();
    var $ = cheerio.load(resp.result)
    expect($(".total-packages").text()).to.equal(String(context.totalPackages));
    done();
  });

});
