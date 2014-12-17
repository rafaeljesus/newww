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
    var customerGet

    beforeEach(function(done){
      customerGet = nock(process.env.BILLING_API)
        .get('/stripe/'+fakeuser.name)
        .reply(200, fs.readFileSync(__dirname + '/../fixtures/billing/customer.json', 'utf-8'));

      done()
    })

    it("calls the license API", function(done){
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        customerGet.done();
        done();
      });
    })

    it("adds billing data to view context", function(done){
      options.credentials = fakeuser
      server.inject(options, function (resp) {
        customerGet.done();
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
        console.log(resp.result)
        var $ = cheerio.load(resp.result)
        expect($(".card-last4").text()).to.equal("4242");
        expect($(".card-brand").text()).to.equal("Visa");
        expect($(".card-exp-month").text()).to.equal("12");
        expect($(".card-exp-year").text()).to.equal("2015");
        done();
      });
    });

  })

  // describe("unpaid user", function(){
  //
  //   it("does not display billing info, because it does not exist", function() {
  //
  //   })
  //
  //
  // })

});

// describe('POST /settings/billing', function () {
//   var options
//
//   before(function(done) {
//     options = {
//       method: 'post',
//       url: '/settings/billing'
//     }
//     done()
//   })
//
//   it('redirects to login page if not logged in', function (done) {
//     server.inject(options, function (resp) {
//       expect(resp.statusCode).to.equal(302);
//       expect(resp.headers.location).to.include('login');
//       done();
//     });
//   });
//
//   it('sends billing info to the billing API', function (done) {
//     options.credentials = fakeuser
//
//     server.inject(options, function (resp) {
//       expect(resp.statusCode).to.equal(200);
//       expect(source.template).to.equal('user/billing');
//       expect(resp.result).to.include('id="payment-form"');
//       done();
//     });
//   });
//
// });
