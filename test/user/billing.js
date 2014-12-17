process.env.FEATURE_R2 = "true";

var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    beforeEach = lab.beforeEach,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect,
    fs = require("fs"),
    nock = require("nock"),
    cheerio = require("cheerio");

var server,
    source,
    cache,
    cookieCrumb,
    fakeuser = require('../fixtures/users').fakeuser;

before(function (done) {
  server = require('../fixtures/setupServer')(done);
  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

it("has a billing host ENV var", function(done) {
  expect(process.env.BILLING_API).to.exist;
  done();
})

describe('GET /settings/billing', function () {
  var options

  before(function(done){
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

  it('renders billing form if user is logged in', function (done) {
    options.credentials = fakeuser

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('user/billing');
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
      expect(source.template).to.equal('user/billing');
      expect(resp.result).to.include('https://js.stripe.com/v2/');
      expect(resp.result).to.include("I am a zebra");
      process.env.STRIPE_PUBLIC_KEY = oldStripeKey
      done();
    });
  });

  describe("paid user", function() {
    var getCustomerMock

    beforeEach(function(done){
      getCustomerMock = nock(process.env.BILLING_API)
        .get('/stripe/'+fakeuser.name)
        .reply(200, fs.readFileSync(__dirname + '/../fixtures/billing/customer.json', 'utf-8'));

      done()
    })

    it("calls the license API", function(done){
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        getCustomerMock.done();
        done();
      });
    })

    it("adds billing data to view context", function(done){
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        getCustomerMock.done();
        expect(source.context).to.exist;
        expect(source.context.customer).to.exist;
        expect(source.context.customer.status).to.equal("active");
        expect(source.context.customer.card.brand).to.equal("Visa");
        done();
      });
    })

    it("displays redacted version of existing billing info", function(done) {
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($(".customer-info").length);
        expect($(".card-last4").text()).to.equal("4242");
        expect($(".card-brand").text()).to.equal("Visa");
        expect($(".card-exp-month").text()).to.equal("12");
        expect($(".card-exp-year").text()).to.equal("2015");
        done();
      });
    });

  })

  describe("unpaid user", function(){
    var getCustomerMock

    beforeEach(function(done){
      getCustomerMock = nock(process.env.BILLING_API)
        .get('/stripe/'+fakeuser.name)
        .reply(404);

      done()
    })

    it("does not display billing info, because it does not exist", function(done) {
      options.credentials
      server.inject(options, function (resp) {
        var $ = cheerio.load(resp.result)
        expect($("body").length);
        expect($(".customer-info").length).to.equal(0);
        expect($(".card-brand").length).to.equal(0);
        expect($(".card-exp-month").length).to.equal(0);
        expect($(".card-exp-year").length).to.equal(0);
        done();
      });
    })


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

        var getCustomerMock = nock(process.env.BILLING_API)
          .get('/stripe/'+fakeuser.name)
          .reply(200);

        var updateCustomerMock = nock(process.env.BILLING_API)
          .post('/stripe/'+fakeuser.name)
          .reply(200);

        server.inject(opts, function (resp) {
          expect(resp.statusCode).to.equal(302);
          getCustomerMock.done();
          updateCustomerMock.done();
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
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

        var getCustomerMockPre = nock(process.env.BILLING_API)
          .get('/stripe/'+fakeuser.name)
          .reply(404);

        var updateCustomerMock = nock(process.env.BILLING_API)
          .put('/stripe', {
            name:fakeuser.name,
            email:fakeuser.email,
            card:"tok_1234567890"
          })
          .reply(200);

        server.inject(opts, function (resp) {
          expect(resp.statusCode).to.equal(302);
          getCustomerMockPre.done();
          updateCustomerMock.done();
          expect(resp.headers.location).to.match(/\/settings\/billing\?updated=1$/);
          done();
        });
      });

    });

  });


});
