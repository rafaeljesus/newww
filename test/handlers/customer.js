var generateCrumb = require("../handlers/crumb.js"),
    Lab = require('lab'),
    Code = require('code'),
    nock = require('nock'),
    cheerio = require('cheerio'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    it = lab.test,
    expect = Code.expect,
    server,
    fixtures = require('../fixtures');

var userMock, licenseMock;

before(function (done) {
  process.env.FEATURE_BILLING_PAGE = 'true';
  userMock = nock("https://user-api-example.com")
    .get("/user/bob").times(17)
    .reply(200, fixtures.users.bob)
    .get("/user/diana_delinquent").twice()
    .reply(200, fixtures.users.diana_delinquent)
    .get("/user/norbert_newbie").times(3)
    .reply(200, fixtures.users.norbert_newbie);

  licenseMock = nock("https://license-api-example.com:443")
    .get("/customer/bob/stripe").times(12)
    .reply(200, fixtures.customers.happy)
    .get("/customer/bob/stripe").times(2)
    .reply(404);

  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  delete process.env.FEATURE_BILLING_PAGE;
  userMock.done();
  licenseMock.done();
  server.stop(done);
});

describe('GET /settings/billing', function () {
  var options;

  beforeEach(function(done){
    options = {
      method: "get",
      url: "/settings/billing"
    };
    done();
  });

  it('redirects to login page if not logged in', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('displays cancellation notice if `canceled` query param is present', function (done) {

    options = {
      method: "get",
      url: "/settings/billing?canceled=1",
      credentials: fixtures.users.bob
    };
    server.inject(options, function (resp) {
      expect(resp.request.response.source.context.canceled).to.be.true();
      var $ = cheerio.load(resp.result);
      expect($(".cancellation-notice").text()).to.include('cancelled your private npm');
      done();
    });
  });

  it('displays update notice if `updated` query param is present', function (done) {
    options = {
      method: "get",
      url: "/settings/billing?updated=1",
      credentials: fixtures.users.bob
    };
    server.inject(options, function (resp) {
      expect(resp.request.response.source.context.updated).to.be.true();
      var $ = cheerio.load(resp.result);
      expect($(".update-notice").text()).to.include('successfully updated');
      done();
    });
  });

  it("renders a twitter tracking snippet for 'private modules purchase'", function (done) {
    var options = {
      method: "get",
      url: "/settings/billing?updated=1",
      credentials: fixtures.users.bob
    };

    server.inject(options, function (resp) {
      var $ = cheerio.load(resp.result);
      expect($("script[src='//platform.twitter.com/oct.js'][data-twitter-pid='l5xyy']").length).to.equal(1);
      expect($("noscript img[src^='//t.co/i/adsct?txn_id=l5xyy']").length).to.equal(1);
      done();
    });
  });

  it("renders a twitter tracking snippet for 'private modules billing signup page'", function (done) {
    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    };

    server.inject(options, function (resp) {
      var $ = cheerio.load(resp.result);
      expect($("script[src='//platform.twitter.com/oct.js'][data-twitter-pid='l5xz2']").length).to.equal(1);
      expect($("noscript img[src^='//t.co/i/adsct?txn_id=l5xz2']").length).to.equal(1);
      done();
    });
  });

  it('does not render notices by default', function (done) {
    options.credentials = fixtures.users.bob;
    server.inject(options, function (resp) {
      expect(resp.request.response.source.context.canceled).to.be.false();
      expect(resp.request.response.source.context.updated).to.be.false();
      expect(resp.result).to.not.include('cancellation-notice');
      expect(resp.result).to.not.include('update-notice');
      done();
    });
  });

  it('renders billing form if user is logged in', function (done) {
    options.credentials = fixtures.users.bob;

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('user/billing');
      expect(resp.result).to.include('id="payment-form"');
      done();
    });
  });

  it('injects stripe public key and stripe script into page', function (done) {
    options.credentials = fixtures.users.bob;

    var oldStripeKey = process.env.STRIPE_PUBLIC_KEY;
    process.env.STRIPE_PUBLIC_KEY = "I am a zebra";

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('user/billing');
      expect(resp.result).to.include('https://js.stripe.com/v2/');
      expect(resp.result).to.include("I am a zebra");
      process.env.STRIPE_PUBLIC_KEY = oldStripeKey;
      done();
    });
  });

  describe("paid user", function() {
    var mock;
    var resp;
    var $;

    beforeEach(function(done){
      options.credentials = fixtures.users.bob;

      mock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe").twice(2)
        .reply(200, fixtures.customers.happy);

      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        mock.done();
        done();
      });

    });

    it("adds billing data to view context", function(done){
      var customer = resp.request.response.source.context.customer;
      expect(customer).to.exist();
      expect(customer).to.exist();
      expect(customer.status).to.equal("active");
      expect(customer.license_expired).to.equal(false);
      expect(customer.next_billing_amount).to.equal(700);
      expect(customer.card.brand).to.equal("Visa");
      done();
    });

    it("renders redacted version of existing billing info", function(done) {
      expect($(".card-info").length).to.equal(1);
      expect($(".card-last4").text()).to.equal("4242");
      expect($(".card-brand").text()).to.equal("Visa");
      expect($(".card-exp-month").text()).to.equal("December");
      expect($(".card-exp-year").text()).to.equal("2020");
      done();
    });

    it("displays a submit button with update verbiage", function(done){
      expect($("#payment-form input[type=submit]").attr("value")).to.equal("update billing info");
      done();
    });

    it("renders a hidden cancellation form", function(done) {
      var form = $("#cancel-subscription");
      expect(form.length).to.equal(1);
      expect(form.attr("method")).to.equal("post");
      expect(form.attr("action")).to.equal("/settings/billing/cancel");
      expect(form.css('display')).to.equal("none");
      expect($("#cancel-subscription-toggler").length).to.equal(1);
      done();
    });

    it("displays account expiration date in cancellation form", function(done) {
      var form = $("#cancel-subscription");
      expect(form.length).to.equal(1);
      expect(form.attr("method")).to.equal("post");
      expect(form.attr("action")).to.equal("/settings/billing/cancel");
      expect(form.css('display')).to.equal("none");
      done();
    });

    it("does NOT render expired license info", function(done) {
      expect($(".error.license-expired").length).to.equal(0);
      done();
    });

  });

  describe("paid user with expired license", function() {
    var mock;
    var resp;
    var $;

    beforeEach(function(done){
      options.credentials = fixtures.users.diana_delinquent;
      mock = nock("https://license-api-example.com")
        .get("/customer/diana_delinquent/stripe").times(2)
        .reply(200, fixtures.customers.license_expired);

      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        mock.done();
        done();
      });
    });

    it("has an expired license and past_due status", function(done){
      expect(resp.request.response.source.context.customer.status).to.equal("past_due");
      expect(resp.request.response.source.context.customer.license_expired).to.equal(true);
      done();
    });

    it("renders information about the expired license", function(done) {
      expect(resp.request.response.source.context.customer.license_expired).to.equal(true);
      expect($(".error.license-expired").text()).to.include("license has expired");
      expect($(".error.license-expired").text()).to.include("status is past_due");
      done();
    });

  });

  describe("unpaid user", function(){
    var mock;
    var resp;
    var $;

    beforeEach(function(done){
      options.credentials = fixtures.users.norbert_newbie;
      mock = nock("https://license-api-example.com")
        .get("/customer/norbert_newbie/stripe")
        .reply(200, fixtures.customers.happy)
        .get("/customer/norbert_newbie/stripe")
        .reply(404);

      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        mock.done();
        done();
      });
    });

    it("does not display billing info, because it does not exist", function(done) {
      expect($("body").length).to.equal(1);
      expect($(".card-info").length).to.equal(0);
      expect($(".card-brand").length).to.equal(0);
      expect($(".card-exp-month").length).to.equal(0);
      expect($(".card-exp-year").length).to.equal(0);
      done();
    });

    it("displays a submit button with creation verbiage", function(done){
      expect($("#payment-form input[type=submit]").attr("value")).to.equal("sign me up");
      done();
    });

    it("does not render a cancellation form", function(done) {
      var form = $("#cancel-subscription");
      expect(form.length).to.equal(0);
      done();
    });

  });

  describe("user with unverified email", function(){
    var mock;
    var resp;
    var $;

    beforeEach(function(done){
      var options = {
        url: "/settings/billing",
        credentials: fixtures.users.uncle_unverified
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/uncle_unverified")
        .reply(200, fixtures.users.uncle_unverified);

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/uncle_unverified/stripe").times(2)
        .reply(404);

      server.inject(options, function (response) {
        resp = response;
        $ = cheerio.load(resp.result);
        userMock.done();
        customerMock.done();
        done();
      });
    });

    it("renders a verify-email-notice", function(done) {
      expect($(".verify-email-notice").length).to.equal(1);
      done();
    });

    it("does not render the payment form", function(done) {
      expect($("#payment-form").length).to.equal(0);
      done();
    });

  });

});

describe('POST /settings/billing', function () {
  var options;

  before(function(done) {
    options = {
      method: 'post',
      url: '/settings/billing'
    };
    done();
  });

  it('redirects to login page if not logged in', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  describe("existing paid user", function() {

    it('sends updated billing info to the billing API', function (done) {

      generateCrumb(server, function (crumb){
        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            crumb: crumb
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        var mock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(200, fixtures.customers.happy)
          .post("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy);

        server.inject(opts, function (resp) {
          mock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

    it('bubbles billing issues up to the user', function (done) {

      generateCrumb(server, function (crumb){
        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            crumb: crumb
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        var mock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").twice()
          .reply(200, fixtures.customers.happy)
          .post("/customer/bob/stripe")
          .reply(200, "Your card's security code is incorrect.");

        server.inject(opts, function (resp) {
          mock.done();
          expect(resp.statusCode).to.equal(200);
          expect(resp.request.response.source.template).to.equal('user/billing');
          var $ = cheerio.load(resp.result);
          expect($('.errors li')[0].children.length).to.equal(1);
          expect($('.errors li')[0].children[0].data).to.equal("Error: Your card's security code is incorrect.");
          done();
        });
      });

    });

  });

  describe("new paid user", function() {

    it('forces coupon code to be lowercase', function (done) {
      generateCrumb(server, function (crumb){
        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            coupon: 'LALALAcoupon',
            crumb: crumb
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        var mock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe")
          .reply(404)
          .put("/customer/stripe")
          .reply(200, fixtures.customers.happy);

        var Customer = require('../../models/customer');
        var oldUpdate = Customer.update;

        Customer.update = function (billingInfo, cb) {
          expect(billingInfo.coupon).to.equal(opts.payload.coupon.toLowerCase());
          return cb(null);
        };

        server.inject(opts, function (resp) {
          mock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          Customer.update = oldUpdate;
          done();
        });
      });
    });

    it('sends new billing info to the billing API', function (done) {

      generateCrumb(server, function (crumb){
        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            crumb: crumb
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        var mock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(200, fixtures.customers.happy)
          .post("/customer/bob/stripe", {"name":"bob","email":"bob@boom.me","card":"tok_1234567890"})
          .reply(200)

        server.inject(opts, function (resp) {
          mock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

  });


});


describe('POST /settings/billing/cancel', function () {
  var options;

  before(function(done) {
    options = {
      method: 'post',
      url: '/settings/billing/cancel'
    };
    done();
  });

  it('redirects to login page if not logged in', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('deletes the customer record', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        method: 'post',
        url: '/settings/billing/cancel',
        payload: {
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb },
        credentials: fixtures.users.bob
      };

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy)
        .delete("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      server.inject(opts, function (resp) {
        licenseMock.done();
        userMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.match(/\/settings\/billing\?canceled=1$/);
        done();
      });
    });

  });

});
