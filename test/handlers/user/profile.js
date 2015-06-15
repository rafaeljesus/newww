var Code     = require('code'),
    Lab      = require('lab'),
    lab      = exports.lab = Lab.script(),
    describe = lab.experiment,
    before   = lab.before,
    after    = lab.after,
    it       = lab.test,
    expect   = Code.expect,
    nock     = require("nock"),
    cheerio  = require("cheerio"),
    users    = require('../../fixtures').users,
    customers= require('../../fixtures').customers;

var server;

before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('GET /~bob for a user other than bob', function () {
  var $;
  var resp;
  var context;

  before(function(done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/bob')
      .reply(200, users.bob)
      .get('/user/bob/package?format=mini&per_page=100&page=0')
      .reply(200, users.packages)
      .get('/user/bob/stars?format=detailed')
      .reply(200, users.stars) ;

    var licenseMock = nock('https://license-api-example.com')
      .get('/customer/bob/stripe')
      .reply(404);

    server.inject('/~bob', function (response) {
      userMock.done();
      licenseMock.done();
      resp = response;
      $ = cheerio.load(resp.result);
      context = resp.request.response.source.context;
      done();
    });
  });

  it("renders a list of bob's packages", function(done){
    expect($("ul.collaborated-packages > li").length).to.equal(20);
    expect($("ul.collaborated-packages > li > a[href='/package/googalytics']").length).to.equal(1);
    done();
  });

  it("truncates package names longer than 50 characters", function(done){
    expect($("a[href='/package/abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz']").text())
      .to.equal("abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx...");
    done();
  });

  it("renders a list of packages starred by bob", function(done){
    expect($("ul.starred-packages > li").length).to.equal(4);
    expect($("ul.starred-packages > li > a[href='/package/jade']").length).to.equal(1);
    done();
  });

  it("renders a link to bob's github profile", function(done){
    expect($("a[href='https://github.com/bob']").length).to.equal(1);
    done();
  });

  it("renders a link to bob's twitter profile", function(done){
    expect($("a[href='https://twitter.com/twob']").length).to.equal(1);
    done();
  });

  it("renders bob's full name", function(done){
    expect($("h2.fullname").text()).to.equal("Bob Henderson");
    done();
  });

  it("renders bob's obfuscated email address", function(done){
    expect($("li.email a[data-email]").length).to.equal(1);
    done();
  });

});

describe('GET /~bob for logged-in bob', function () {
  var $;
  var resp;
  var context;

  before(function(done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/bob').twice()
      .reply(200, users.bob)
      .get('/user/bob/package?format=mini&per_page=100&page=0')
      .reply(200, users.packages)
      .get('/user/bob/stars?format=detailed')
      .reply(200, users.stars);

    var licenseMock = nock('https://license-api-example.com')
      .get('/customer/bob/stripe').twice()
      .reply(404);

    server.inject({url:'/~bob', credentials: users.bob}, function (response) {
      userMock.done();
      licenseMock.done();
      resp = response;
      $ = cheerio.load(resp.result);
      context = resp.request.response.source.context;
      expect(resp.statusCode).to.equal(200);
      done();
    });
  });

  it("renders a link to billing page", function(done){
    expect($(".profile-edit-links a[href='/settings/billing']").length).to.equal(1);
    expect($(".profile-edit-links a[href='/settings/billing']").text()).to.equal("sign up for private modules");
    expect($('#user-info a').data('is-paid')).to.be.empty();
    done();
  });

  it("renders a link to profile edit page", function(done){
    expect($(".profile-edit-links a[href='/profile-edit']").length).to.equal(1);
    done();
  });

  it("renders a link to change password page", function(done){
    expect($(".profile-edit-links a[href='/password']").length).to.equal(1);
    done();
  });

  it("renders a link to change gravatar", function(done){
    expect($(".profile-edit-links a[href='http://gravatar.com/emails/']").length).to.equal(1);
    done();
  });

  it("renders a little lock icon next to private packages", function(done) {
    expect($(".icon-lock ~ a").text()).to.equal("@bob/shhh");
    done();
  });

  it("shows a different billing page link for paid users", function(done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/bob').twice()
      .reply(200, users.bob)
      .get('/user/bob/package?format=mini&per_page=100&page=0')
      .reply(200, users.packages)
      .get('/user/bob/stars?format=detailed')
      .reply(200, users.stars);

    var licenseMock = nock('https://license-api-example.com')
      .get('/customer/bob/stripe').twice()
      .reply(200, customers.bob);

    server.inject({url:'/~bob', credentials: users.bob}, function (response) {
      userMock.done();
      licenseMock.done();
      resp = response;
      $ = cheerio.load(resp.result);
      context = resp.request.response.source.context;
      expect(resp.statusCode).to.equal(200);
      expect($(".profile-edit-links a[href='/settings/billing']").length).to.equal(1);
      expect($(".profile-edit-links a[href='/settings/billing']").text()).to.equal("manage billing");
      expect($('#user-info a').data('is-paid')).to.be.true();
      done();
    });
  });

});

describe("GET /~nonexistent-user", function() {
  it("renders a 404 page", function (done) {
    var userMock = nock("https://user-api-example.com")
      .get('/user/nonexistent-user')
      .reply(404)
      .get('/user/nonexistent-user/package?format=mini&per_page=100&page=0')
      .reply(404)
      .get('/user/nonexistent-user/stars?format=detailed')
      .reply(404);

    var licenseMock = nock('https://license-api-example.com')
      .get('/customer/nonexistent-user/stripe')
      .reply(404);

    server.inject('/~nonexistent-user', function (resp) {
      userMock.done();
      licenseMock.done();
      var source = resp.request.response.source;
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/user-not-found');
      done();
    });
  });

});
