var generateCrumb = require("../handlers/crumb.js"),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock'),
  _ = require('lodash'),
  server;

// var bole = require('bole')
  // var pretty = require('bistre')()

// bole.output({
  //     level: 'error'
  //   , stream: pretty
  // })

// pretty.pipe(process.stdout)

before(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

after(function(done) {
  server.stop(done);
});

var payload = {
  id: 'tok_12345',
  livemode: 'false',
  created: '1426198429',
  used: 'false',
  object: 'token',
  type: 'card',
  card: {},
  email: 'exists@boom.com',
  verification_allowed: 'true',
  client_ip: 'localhost',
  amount: '2500',
  subType: '1',
  quantity: '1',
  customerId: '12345'
};

var stripeCustomer = {
  object: 'customer',
  created: 1426198433,
  id: 'cus_123abc',
  livemode: false,
  description: 'exists@boom.com npm On-Site Starter Pack',
  email: 'exists@boom.com',
  delinquent: false,
  metadata: {},
  subscriptions: {
    object: 'list',
    total_count: 1,
    has_more: false,
    url: '/v1/customers/cus_123abc/subscriptions',
    data: [[Object]]
  },
  discount: null,
  account_balance: 0,
  currency: 'usd',
  cards: {
    object: 'list',
    total_count: 1,
    has_more: false,
    url: '/v1/customers/cus_123abc/cards',
    data: [[Object]]
  },
  default_card: 'card_15feYq4fnGb60djYJsvT2YGG',
  sources: {
    object: 'list',
    total_count: 1,
    has_more: false,
    url: '/v1/customers/cus_123abc/sources',
    data: [[Object]]
  },
  default_source: 'card_15feYq4fnGb60djYJsvT2YGG'
};

describe('Posting to the enterprise license purchase page', function() {
  it('errors out if the email sent is invalid', function(done) {
    generateCrumb(server, function(crumb) {
      var p = _.extend({}, payload, {
        email: 'invalid',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(403);
        var source = resp.request.response.source;
        expect(source).to.equal('validation error');
        done();
      });
    });
  });

  it('renders an error if we get an error from hubspot', function(done) {
    generateCrumb(server, function(crumb) {

      var p = _.extend({}, payload, {
        email: 'error@boom.com',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source).to.equal('error loading customer');
        done();
      });
    });
  });

  it('renders an error if the customer is not found', function(done) {
    generateCrumb(server, function(crumb) {

      var p = _.extend({}, payload, {
        email: 'new@boom.com',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source).to.equal('customer not found');
        done();
      });
    });
  });

  it('renders an error if the customerID does not match the token customerID', function(done) {
    generateCrumb(server, function(crumb) {

      var p = _.extend({}, payload, {
        customerId: '123',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source).to.equal('error validating customer ID');
        done();
      });
    });
  });

  describe('for a monthly enterprise starter pack', function() {
    it('sends an email on success', function(done) {
      var mock = nock('https://api.stripe.com')
        .post('/v1/customers', {
          card: 'tok_12345',
          plan: 'enterprise-starter-pack',
          quantity: 1,
          email: 'exists@boom.com',
          description: 'exists@boom.com npm On-Site Starter Pack'
        })
        .reply(200, stripeCustomer);


      generateCrumb(server, function(crumb) {
        var p = _.extend({}, payload, {
          crumb: crumb
        });

        var opts = {
          url: '/enterprise/buy-license',
          method: 'post',
          payload: p,
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          mock.done();
          expect(resp.statusCode).to.equal(200);
          var source = resp.request.response.source;
          expect(source).to.equal('License purchase successful');
          done();
        });
      });
    });
  });

  describe('for an annual enterprise starter pack', function() {
    it('sends an email on success', function(done) {
      var mock = nock('https://api.stripe.com')
        .post('/v1/customers', {
          card: 'tok_12345',
          plan: 'enterprise-starter-pack-annual',
          quantity: 1,
          email: 'exists@boom.com',
          description: 'exists@boom.com npm On-Site Starter Pack (annual)'
        })
        .reply(200, stripeCustomer);


      generateCrumb(server, function(crumb) {
        var p = _.extend({}, payload, {
          subType: 2,
          crumb: crumb
        });

        var opts = {
          url: '/enterprise/buy-license',
          method: 'post',
          payload: p,
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          mock.done();
          expect(resp.statusCode).to.equal(200);
          var source = resp.request.response.source;
          expect(source).to.equal('License purchase successful');
          done();
        });
      });
    });
  });

  describe('for a multi-seat license', function() {
    it('sends an email on success', function(done) {
      var mock = nock('https://api.stripe.com')
        .post('/v1/customers', {
          card: 'tok_12345',
          plan: 'enterprise-multi-seat',
          quantity: 20,
          email: 'exists@boom.com',
          description: 'exists@boom.com npm On-Site multi-seat license'
        })
        .reply(200, stripeCustomer);


      generateCrumb(server, function(crumb) {
        var p = _.extend({}, payload, {
          subType: 3,
          quantity: 20,
          crumb: crumb
        });

        var opts = {
          url: '/enterprise/buy-license',
          method: 'post',
          payload: p,
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          mock.done();
          expect(resp.statusCode).to.equal(200);
          var source = resp.request.response.source;
          expect(source).to.equal('License purchase successful');
          done();
        });
      });
    });
  });

});
