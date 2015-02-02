var Lab = require('lab'),
    Code = require('code'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    fs = require("fs"),
    nock = require("nock"),
    cheerio = require("cheerio");

var server,
    source,
    cache,
    cookieCrumb,
    fakeuser = require('../fixtures/users').fakeuser,
    diana_delinquent = require('../fixtures/users').diana_delinquent,
    norbert_newbie = require('../fixtures/users').norbert_newbie;

before(function (done) {
  require('../fixtures/setupServer')(function (obj) {
    server = obj;
    done();
  });
});

describe('GET /settings/billing', function () {
  var options

  beforeEach(function(done){
    options = {
      method: "get",
      url: "/settings/billing"
    }
    done()
  })

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
      credentials: fakeuser
    }
    server.inject(options, function (resp) {
      expect(resp.request.response.source.context.canceled).to.be.true();
      var $ = cheerio.load(resp.result)
      expect($(".cancellation-notice").text()).to.include('cancelled your private npm');
      done();
    });
  });

  it('displays update notice if `updated` query param is present', function (done) {
    options = {
      method: "get",
      url: "/settings/billing?updated=1",
      credentials: fakeuser
    }
    server.inject(options, function (resp) {
      expect(resp.request.response.source.context.updated).to.be.true();
      var $ = cheerio.load(resp.result)
      expect($(".update-notice").text()).to.include('successfully updated');
      done();
    });
  });

  it('does not render notices by default', function (done) {
    options.credentials = fakeuser
    server.inject(options, function (resp) {
      expect(resp.request.response.source.context.canceled).to.be.false();
      expect(resp.request.response.source.context.updated).to.be.false();
      expect(resp.result).to.not.include('cancellation-notice');
      expect(resp.result).to.not.include('update-notice');
      done();
    });
  });

  it('renders billing form if user is logged in', function (done) {
    options.credentials = fakeuser

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('user/billing');
      expect(resp.result).to.include('id="payment-form"');
      done();
    });
  });

  it('injects stripe public key and stripe script into page', function (done) {
    options.credentials = fakeuser

    var oldStripeKey = process.env.STRIPE_PUBLIC_KEY
    process.env.STRIPE_PUBLIC_KEY = "I am a zebra"

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.request.response.source.template).to.equal('user/billing');
      expect(resp.result).to.include('https://js.stripe.com/v2/');
      expect(resp.result).to.include("I am a zebra");
      process.env.STRIPE_PUBLIC_KEY = oldStripeKey
      done();
    });
  });

  describe("paid user", function() {
    var oldLicenseAPI

    before(function(done){
      process.env.LICENSE_API = "http://fake-license-api.com"
      done()
    })

    after(function(done){
      process.env.LICENSE_API = oldLicenseAPI
      done()
    })

    it("adds billing data to view context", function(done){
      options.credentials = fakeuser

      server.inject(options, function (resp) {
        var context = resp.request.response.source.context
        expect(context).to.exist();
        var customer = context.customer
        expect(customer).to.exist();
        expect(customer.status).to.equal("active");
        expect(customer.license_expired).to.equal(false);
        expect(customer.next_billing_amount).to.equal(700);
        expect(customer.card.brand).to.equal("Visa");
        done();
      });
    })

    it("renders redacted version of existing billing info", function(done) {
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($(".card-info").length).to.equal(1);
        expect($(".card-last4").text()).to.equal("4242");
        expect($(".card-brand").text()).to.equal("Visa");
        expect($(".card-exp-month").text()).to.equal("December");
        expect($(".card-exp-year").text()).to.equal("2020");
        done();
      });
    });

    it("displays a submit button with update verbiage", function(done){
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($("#payment-form input[type=submit]").attr("value")).to.equal("update billing info");
        done();
      });
    })

    it("renders a hidden cancellation form", function(done) {
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        var form = $("#cancel-subscription");
        expect(form.length).to.equal(1);
        expect(form.attr("method")).to.equal("post");
        expect(form.attr("action")).to.equal("/settings/billing/cancel");
        expect(form.css('display')).to.equal("none");

        expect($("#cancel-subscription-toggler").length).to.equal(1);
        done();
      });
    });

    it("displays account expiration date in cancellation form", function(done) {
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        var form = $("#cancel-subscription");
        expect(form.length).to.equal(1);
        expect(form.attr("method")).to.equal("post");
        expect(form.attr("action")).to.equal("/settings/billing/cancel");
        expect(form.css('display')).to.equal("none");
        done();
      });
    });

    it("does NOT render expired license info", function(done) {
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($(".error.license-expired").length).to.equal(0);
        done();
      });
    });

  })

  describe("paid user with expired license", function() {
    var oldLicenseAPI

    before(function(done){
      process.env.LICENSE_API = "http://fake-license-api.com"
      done()
    })

    after(function(done){
      process.env.LICENSE_API = oldLicenseAPI
      done()
    })

    it("has an expired license and past_due status", function(done){
      options.credentials = diana_delinquent

      server.inject(options, function (resp) {
        expect(resp.request.response.source.context.customer.status).to.equal("past_due");
        expect(resp.request.response.source.context.customer.license_expired).to.equal(true);
        done();
      });
    })

    it("renders information about the expired license", function(done) {
      options.credentials = diana_delinquent
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect(resp.request.response.source.context.customer.license_expired).to.equal(true);
        expect($(".error.license-expired").text()).to.include("license has expired");
        expect($(".error.license-expired").text()).to.include("status is past_due");
        done();
      });
    });

  })

  describe("unpaid user", function(){
    var oldLicenseAPI

    before(function(done){
      process.env.LICENSE_API = "http://fake-license-api.com"
      done()
    })

    after(function(done){
      process.env.LICENSE_API = oldLicenseAPI
      done()
    })

    it("does not display billing info, because it does not exist", function(done) {
      options.credentials = norbert_newbie
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($("body").length).to.equal(1);
        expect($(".card-info").length).to.equal(0);
        expect($(".card-brand").length).to.equal(0);
        expect($(".card-exp-month").length).to.equal(0);
        expect($(".card-exp-year").length).to.equal(0);
        done();
      });
    })

    it("displays a submit button with creation verbiage", function(done){
      options.credentials = norbert_newbie
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($("#payment-form input[type=submit]").attr("value")).to.equal("sign me up");
        done();
      });
    })

    it("does not render a cancellation form", function(done) {
      options.credentials = norbert_newbie
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result);
        var form = $("#cancel-subscription");
        expect(form.length).to.equal(0);
        done();
      });
    });

  })

});

describe('POST /settings/billing', function () {
  var options

  before(function(done) {
    options = {
      method: 'post',
      url: '/settings/billing'
    }
    done()
  })

  it('redirects to login page if not logged in', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  describe("existing paid user", function() {

    it('sends updated billing info to the billing API', function (done) {

      server.inject({url: '/settings/billing', credentials: fakeuser}, function (resp) {
        var header = resp.headers['set-cookie'];
        expect(header.length).to.equal(1);
        var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];
        expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fakeuser,
          payload: {
            stripeToken: 'tok_1234567890',
            crumb: cookieCrumb
          },
          headers: { cookie: 'crumb=' + cookieCrumb }
        }

        server.inject(opts, function (resp) {
          expect(resp.statusCode).to.equal(302);
          // expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

  });

  describe("new paid user", function() {

    it('sends new billing info to the billing API', function (done) {

      server.inject({url: '/settings/billing', credentials: fakeuser}, function (resp) {
        var header = resp.headers['set-cookie'];
        expect(header.length).to.equal(1);
        var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];
        expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

        var opts = {
          url: '/settings/billing',
          method: 'POST',
          credentials: fakeuser,
          payload: {
            stripeToken: 'tok_1234567890',
            crumb: cookieCrumb
          },
          headers: { cookie: 'crumb=' + cookieCrumb }
        }

        server.inject(opts, function (resp) {
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

  });


});


describe('POST /settings/billing/cancel', function () {
  var options

  before(function(done) {
    options = {
      method: 'post',
      url: '/settings/billing/cancel'
    }
    done()
  })

  it('redirects to login page if not logged in', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('deletes the customer record', function (done) {

    server.inject({url: '/settings/billing', credentials: fakeuser}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);
      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/settings/billing/cancel',
        credentials: fakeuser,
        payload: {
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      }

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.match(/\/settings\/billing\?canceled=1$/);
        done();
      });
    });

  });

});
