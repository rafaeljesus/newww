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

describe('GET / for an anonymous user', function () {
  var $;
  var resp;
  var options = {url: "/"};
  var packageMock = nock("https://user-api-example.com")
    .get('/package?sort=dependents')
    .reply(200, fixtures.aggregates.most_depended_upon_packages)
    .get('/package?sort=modified')
    .reply(200, fixtures.aggregates.recently_updated_packages)
    .get('/package/-/count')
    .reply(200, 12345);
  var downloadsMock = nock("https://downloads-api-example.com")
    .get('/point/last-day')
    .reply(200, fixtures.downloads.all.day)
    .get('/point/last-week')
    .reply(200, fixtures.downloads.all.week)
    .get('/point/last-month')
    .reply(200, fixtures.downloads.all.month);

  before(function(done){
    server.inject(options, function (response) {
      resp = response;
      $ = cheerio.load(resp.result);
      packageMock.done();
      downloadsMock.done();
      done();
    });
  });


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
    var $ = cheerio.load(resp.result);
    expect($(".total-packages").text()).to.equal(String(context.totalPackages));
    done();
  });

  it("displays a wombat login link", function (done) {
    expect($("#user-info a[href='/login'] img[src*='wombat']").length).to.equal(1);
    done();
  });

});


describe('GET / for a logged-in user', function () {
  var $;
  var resp;
  var options = {
    url: "/",
    credentials: fixtures.users.mikeal
  };

  before(function(done){
    var userMock = nock('https://user-api-example.com')
      .get('/user/mikeal')
      .reply(200, fixtures.users.mikeal);
    var licenseMock = nock('https://license-api-example.com')
      .get('/customer/mikeal/stripe')
      .reply(404);
    var packageMock = nock("https://user-api-example.com")
      .get('/package?sort=dependents')
      .reply(200, fixtures.aggregates.most_depended_upon_packages)
      .get('/package?sort=modified')
      .reply(200, fixtures.aggregates.recently_updated_packages)
      .get('/package/-/count')
      .reply(200, 12345);
    var downloadsMock = nock("https://downloads-api-example.com")
      .get('/point/last-day')
      .reply(200, fixtures.downloads.all.day)
      .get('/point/last-week')
      .reply(200, fixtures.downloads.all.week)
      .get('/point/last-month')
      .reply(200, fixtures.downloads.all.month);

    server.inject(options, function (response) {
      resp = response;
      $ = cheerio.load(resp.result);
      userMock.done();
      licenseMock.done();
      packageMock.done();
      downloadsMock.done();
      done();
    });
  });

  it("displays an avatar linking to the user's profile page", function (done) {
    expect($("#user-info a[href='/~mikeal'] img[src^='https://secure.gravatar']").length).to.equal(1);
    done();
  });

  it("displays a link to log out", function (done) {
    expect($("#user-info a[href='/logout']").length).to.equal(1);
    done();
  });

  it("adds a data-user-name attribute", function (done) {
    expect($("[data-user-name]").data().userName).to.equal("mikeal");
    done();
  });

});
