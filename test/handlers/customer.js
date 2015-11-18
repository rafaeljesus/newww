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

var requireInject = require('require-inject');
var redisMock = require('redis-mock');

before(function(done) {
  process.env.FEATURE_ORG_BILLING = 'true';
  requireInject.installGlobally('../mocks/server', {
    redis: redisMock
  })(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  delete process.env.FEATURE_ORG_BILLING;
  server.stop(done);
});

describe('GET /settings/billing', function() {
  it('redirects to login page if not logged in', function(done) {
    var options = {
      method: "get",
      url: "/settings/billing"
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('directs new customers to POST /settings/billing/subscribe', function(done) {

    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(404)
      .get("/customer/bob/stripe/subscription")
      .reply(404);

    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    }

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      var $ = cheerio.load(resp.result);
      expect($('#payment-form').attr('action')).to.equal('/settings/billing/subscribe');
      done();
    });
  });


  it('directs billing info updates to POST /settings/billing', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.statusCode).to.equal(200);
      var $ = cheerio.load(resp.result);
      expect($('#payment-form').attr('action')).to.equal('/settings/billing');
      done();
    });
  });

  it('displays cancellation notice if `canceled` query param is present', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing?canceled=1",
      credentials: fixtures.users.bob
    };
    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.context.canceled).to.be.true();
      var $ = cheerio.load(resp.result);
      expect($(".cancellation-notice").text()).to.include('cancelled your private npm');
      done();
    });
  });

  it('displays update notice if `updated` query param is present', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing?updated=1",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.context.updated).to.be.true();
      var $ = cheerio.load(resp.result);
      expect($(".update-notice").text()).to.include('successfully updated');
      done();
    });
  });

  it("renders a twitter tracking snippet for 'private modules purchase'", function(done) {

    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing?updated=1",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      var $ = cheerio.load(resp.result);
      expect($("script[src='//platform.twitter.com/oct.js'][data-twitter-pid='l5xyy']").length).to.equal(1);
      expect($("noscript img[src^='//t.co/i/adsct?txn_id=l5xyy']").length).to.equal(1);
      done();
    });
  });

  it("renders a twitter tracking snippet for 'private modules billing signup page'", function(done) {

    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      var $ = cheerio.load(resp.result);
      expect($("script[src='//platform.twitter.com/oct.js'][data-twitter-pid='l5xz2']").length).to.equal(1);
      expect($("noscript img[src^='//t.co/i/adsct?txn_id=l5xz2']").length).to.equal(1);
      done();
    });
  });

  it('does not render notices by default', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.context.canceled).to.be.false();
      expect(resp.request.response.source.context.updated).to.be.false();
      expect(resp.result).to.not.include('cancellation-notice');
      expect(resp.result).to.not.include('update-notice');
      done();
    });
  });

  it('renders billing form if user is logged in', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    };

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('user/billing');
      expect(resp.result).to.include('id="payment-form"');
      done();
    });
  });

  it('injects stripe public key and stripe script into page', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, fixtures.users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe").times(2)
      .reply(200, fixtures.customers.bob)
      .get("/customer/bob/stripe/subscription")
      .reply(200, fixtures.customers.subscriptions.bob);

    var options = {
      method: "get",
      url: "/settings/billing",
      credentials: fixtures.users.bob
    };

    var oldStripeKey = process.env.STRIPE_PUBLIC_KEY;
    process.env.STRIPE_PUBLIC_KEY = "I am a zebra";

    server.inject(options, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('user/billing');
      expect(resp.result).to.include('https://js.stripe.com/v2/');
      expect(resp.result).to.include("I am a zebra");
      process.env.STRIPE_PUBLIC_KEY = oldStripeKey;
      done();
    });
  });

  describe("paid user", function() {
    var userMock;
    var licenseMock;
    var resp;
    var $;

    before(function(done) {
      userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe").times(2)
        .reply(200, fixtures.customers.bob)
        .get("/customer/bob/stripe/subscription")
        .reply(200, fixtures.customers.subscriptions.bob);

      var options = {
        method: "get",
        url: "/settings/billing",
        credentials: fixtures.users.bob
      };

      server.inject(options, function(response) {
        resp = response;
        $ = cheerio.load(resp.result);
        userMock.done();
        licenseMock.done();
        done();
      });

    });

    it("adds billing data to view context", function(done) {
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

    it("displays a submit button with update verbiage", function(done) {
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
    var userMock;
    var licenseMock;
    var resp;
    var $;

    before(function(done) {
      var options = {
        method: "get",
        url: "/settings/billing",
        credentials: fixtures.users.diana_delinquent
      };

      userMock = nock("https://user-api-example.com")
        .get("/user/diana_delinquent")
        .reply(200, fixtures.users.diana_delinquent);

      licenseMock = nock("https://license-api-example.com")
        .get("/customer/diana_delinquent/stripe").times(2)
        .reply(200, fixtures.customers.license_expired)
        .get("/customer/diana_delinquent/stripe/subscription")
        .reply(404);

      server.inject(options, function(response) {
        resp = response;
        $ = cheerio.load(resp.result);
        userMock.done();
        licenseMock.done();
        done();
      });
    });

    it("has an expired license and past_due status", function(done) {
      // console.log('==BOOM==', resp.request.response.source.context)
      expect(resp.request.response.source.context.customer.status).to.equal("past_due");
      expect(resp.request.response.source.context.customer.license_expired).to.equal(true);
      done();
    });

    it("renders information about the expired license", function(done) {
      expect($(".error.license-expired").text()).to.include("license has expired");
      expect($(".error.license-expired").text()).to.include("status is past_due");
      done();
    });

  });

  describe("unpaid user", function() {
    var userMock;
    var licenseMock;
    var resp;
    var $;

    beforeEach(function(done) {
      var options = {
        method: "get",
        url: "/settings/billing",
        credentials: fixtures.users.norbert_newbie
      };

      userMock = nock("https://user-api-example.com")
        .get("/user/norbert_newbie")
        .reply(200, fixtures.users.norbert_newbie);

      licenseMock = nock("https://license-api-example.com")
        .get("/customer/norbert_newbie/stripe")
        .reply(200, fixtures.customers.happy)
        .get("/customer/norbert_newbie/stripe/subscription")
        .reply(200, fixtures.customers.subscriptions.bob)
        .get("/customer/norbert_newbie/stripe")
        .reply(404);

      server.inject(options, function(response) {
        resp = response;
        $ = cheerio.load(resp.result);
        userMock.done();
        licenseMock.done();
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

    it("displays a submit button with creation verbiage", function(done) {
      expect($("#payment-form input[type=submit]").attr("value")).to.equal("save my billing info");
      done();
    });

    it("does not render a cancellation form", function(done) {
      var form = $("#cancel-subscription");
      expect(form.length).to.equal(0);
      done();
    });

  });

  describe("user with unverified email", function() {
    var resp;
    var $;

    beforeEach(function(done) {
      var options = {
        url: "/settings/billing",
        credentials: fixtures.users.uncle_unverified
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/uncle_unverified")
        .reply(200, fixtures.users.uncle_unverified);

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/uncle_unverified/stripe").times(2)
        .reply(404)
        .get("/customer/uncle_unverified/stripe/subscription")
        .reply(404);

      server.inject(options, function(response) {
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

    // it("does not render the payment form", function(done) {
    //   expect($("#payment-form").length).to.equal(0);
    //   done();
    // });

  });

});

describe('subscribing to private modules', function() {
  it('redirects to login page if not logged in', function(done) {
    var options = {
      method: 'post',
      url: '/settings/billing/subscribe'
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  describe("existing paid user", function() {

    it('sends updated billing info to the billing API', function(done) {

      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            planType: 'private_modules',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(200, fixtures.customers.happy)
          .post("/customer/bob/stripe")
          .reply(200, fixtures.customers.happy);

        server.inject(opts, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

    it('bubbles billing issues up to the user', function(done) {

      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            crumb: crumb,
            planType: 'private_modules'
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").twice()
          .reply(200, fixtures.customers.happy)
          .post("/customer/bob/stripe")
          .reply(200, "Your card's security code is incorrect.");

        server.inject(opts, function(resp) {
          userMock.done();
          licenseMock.done();
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

    it('forces coupon code to be lowercase', function(done) {
      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing/subscribe',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            coupon: 'LALALAcoupon',
            planType: 'private_modules',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(404)
          .put("/customer/stripe")
          .reply(200, fixtures.customers.bob)
          .put("/customer/bob/stripe/subscription", {
            "plan": "npm-paid-individual-user-7"
          })
          .reply(200, fixtures.customers.subscriptions.bob);

        var Customer = require('../../agents/customer');
        var oldUpdate = Customer.update;

        Customer.update = function(billingInfo, cb) {
          expect(billingInfo.coupon).to.equal(opts.payload.coupon.toLowerCase());
          return cb(null);
        };

        server.inject(opts, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          Customer.update = oldUpdate;
          done();
        });
      });
    });

    it('allows empty coupon code', function(done) {
      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing/subscribe',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            coupon: '',
            planType: 'private_modules',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(404)
          .put("/customer/stripe")
          .reply(200, fixtures.customers.bob)
          .put("/customer/bob/stripe/subscription", {
            "plan": "npm-paid-individual-user-7"
          })
          .reply(200, fixtures.customers.subscriptions.bob);

        server.inject(opts, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });
    });

    it('sends joi errors from private modules back to the billing page', function(done) {
      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing/subscribe',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            planType: 'private_modules',
            foo: 'bar',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        server.inject(opts, function(resp) {
          userMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?notice=.+/);
          done();
        });
      });
    });

    it('sends new billing info to the billing API', function(done) {

      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing/subscribe',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            planType: 'private_modules',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(404)
          .put("/customer/bob/stripe/subscription", {
            "plan": "npm-paid-individual-user-7"
          })
          .reply(200, fixtures.customers.subscriptions.bob)
          .put("/customer/stripe", {
            "name": "bob",
            "email": "bob@boom.me",
            "card": "tok_1234567890"
          })
          .reply(200);

        server.inject(opts, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

    it('works even when the orgs feature is disabled', function(done) {
      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/settings/billing/subscribe',
          method: 'POST',
          credentials: fixtures.users.bob,
          payload: {
            stripeToken: 'tok_1234567890',
            planType: 'private_modules',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        var userMock = nock("https://user-api-example.com")
          .get("/user/bob")
          .reply(200, fixtures.users.bob);

        var licenseMock = nock("https://license-api-example.com")
          .get("/customer/bob/stripe").times(2)
          .reply(404)
          .put("/customer/bob/stripe/subscription", {
            "plan": "npm-paid-individual-user-7"
          })
          .reply(200, fixtures.customers.subscriptions.bob)
          .put("/customer/stripe", {
            "name": "bob",
            "email": "bob@boom.me",
            "card": "tok_1234567890"
          })
          .reply(200);

        delete process.env.FEATURE_ORG_BILLING;

        server.inject(opts, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          process.env.FEATURE_ORG_BILLING = 'true';
          done();
        });
      });
    });
  });

});

describe("subscribing to an org", function() {
  it("doesn't work at all if the feature is not enabled", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: 'boomer',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      delete process.env.FEATURE_ORG_BILLING;

      server.inject(opts, function(resp) {
        userMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.match(/\/settings\/billing/);
        process.env.FEATURE_ORG_BILLING = 'true';
        done();
      });
    });
  });

  it("creates and charges for a paid organization that does not yet exist", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: 'boomer',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var orgMock = nock("https://user-api-example.com")
        .get("/org/boomer")
        .reply(404, "not found")
        .get("/org/boomer/user")
        .reply(404, "not found")
        .get("/org/boomer/package")
        .reply(404, "not found")
        .put("/org", {
          name: "boomer",
          resource: {}
        })
        .reply(200, {
          "name": "boomer",
          "created": "2015-08-05T20:55:54.759Z",
          "updated": "2015-08-05T20:55:54.759Z",
          "deleted": null,
          "resource": {}
        });

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy)
        .put("/customer/bob/stripe/subscription", {
          plan: "npm-paid-org-7",
          npm_org: "boomer"
        })
        .reply(200, {
          "id": "foo",
          "license_id": 2,
          "current_period_end": 0,
          "current_period_start": 0,
          "quantity": 2,
          "status": "active",
          "interval": "month",
          "amount": 700,
          "npm_org": "boomer",
          "npm_user": "bob",
          "product_id": "npm-paid-org-7"
        })
        .put("/sponsorship/2", {
          "npm_user": "bob"
        })
        .reply(200, {
          "created": "2015-08-05T20:55:54.759Z",
          "deleted": null,
          "id": 15,
          "license_id": 2,
          "npm_user": "bob",
          "updated": "2015-08-05T20:55:54.759Z",
          "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
          "verified": null
        })
        .post("/sponsorship/f56dffef-b136-429a-97dc-57a6ef035829")
        .reply(200, {
          "created": "2015-08-05T20:59:32.707Z",
          "deleted": null,
          "id": 15,
          "license_id": 2,
          "npm_user": "bob",
          "updated": "2015-08-05T20:59:41.538Z",
          "verification_key": "f56dffef-b136-429a-97dc-57a6ef035829",
          "verified": true
        });

      server.inject(opts, function(resp) {
        userMock.done();
        orgMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.match(/\/org\/boomer/);
        done();
      });
    });
  });

  it("returns an error if the organization already exists", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: 'boomer',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var orgMock = nock("https://user-api-example.com")
        .get("/org/boomer")
        .reply(200, {
          "name": "boomer",
          "description": "",
          "resource": {},
          "created": "2015-07-10T20:29:37.816Z",
          "updated": "2015-07-10T21:07:16.799Z",
          "deleted": null
        })
        .get("/org/boomer/user")
        .reply(200, {
          "count": 1,
          "items": [fixtures.users.bob]
        })
        .get("/org/boomer/package")
        .reply(200, {
          "count": 1,
          "items": [fixtures.packages.fake]
        })
        .get("/org/boomer/team")
        .reply(200, {
          count: 1,
          items: [
            {
              "created": "2015-08-28T17:44:03.701Z",
              "deleted": null,
              "description": null,
              "name": "developers",
              "scope_id": 55555,
              "updated": "2015-08-28T17:44:03.701Z"
            }
          ]
        });

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      server.inject(opts, function(resp) {
        userMock.done();
        orgMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(200);
        expect(resp.request.response.source.template).to.equal('org/create');
        var $ = cheerio.load(resp.result);
        expect($('.notice')[0].children.length).to.equal(1);
        expect($('.notice')[0].children[0].data).to.equal("Error: Org already exists");
        done();
      });
    });
  });

  it("returns an error if the organization is missing a name", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: '',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      server.inject(opts, function(resp) {
        userMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(200);
        var context = resp.request.response.source.context;
        expect(context.notices).to.be.an.array();
        expect(context.notices[0]).to.equal('orgScope is not allowed to be empty');
        done();
      });
    });
  });

  it("returns an error if the organization name is invalid", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: '_kaBOOM',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      server.inject(opts, function(resp) {
        userMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(200);
        var context = resp.request.response.source.context;
        expect(context.notices).to.be.an.array();
        expect(context.notices[0]).to.equal('name cannot start with an underscore');
        done();
      });
    });
  });

  it("redirects if it has a new user name and it is invalid", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: 'test-org-9999',
          "new-user": 'aosdfa@@@ll;',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      server.inject(opts, function(resp) {
        userMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(302);
        done();
      });
    });
  });

  it("returns an error if there is a scope collision", function(done) {
    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/settings/billing/subscribe',
        method: 'POST',
        credentials: fixtures.users.bob,
        payload: {
          planType: 'orgs',
          orgScope: 'bob',
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, fixtures.users.bob);

      var orgMock = nock("https://user-api-example.com")
        .get("/org/bob")
        .reply(404, "not found")
        .get("/org/bob/user")
        .reply(404, "not found")
        .get("/org/bob/package")
        .reply(404, "not found")
        .put("/org", {
          name: "bob",
          resource: {}
        })
        .reply(409, "that scope name is already in use");

      var customerMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(200, fixtures.customers.happy);

      server.inject(opts, function(resp) {
        userMock.done();
        customerMock.done();
        expect(resp.statusCode).to.equal(200);
        var context = resp.request.response.source.context;
        expect(context.notices).to.be.an.array();
        expect(context.notices[0].message).to.equal("The provided Org's @scope name is already in use");
        done();
      });
    });
  });
});


describe('POST /settings/billing/cancel', function() {
  var options;

  before(function(done) {
    options = {
      method: 'post',
      url: '/settings/billing/cancel'
    };
    done();
  });

  it('redirects to login page if not logged in', function(done) {
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('deletes the customer record', function(done) {

    generateCrumb(server, function(crumb) {
      var opts = {
        method: 'post',
        url: '/settings/billing/cancel',
        payload: {
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        },
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

      server.inject(opts, function(resp) {
        licenseMock.done();
        userMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.match(/\/settings\/billing\?canceled=1$/);
        done();
      });
    });

  });

});
