var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    it = lab.test,
    expect = Code.expect,
    sinon = require('sinon');

var Hapi = require('hapi'),
    config = require('../../config'),
    couchDB = require('../../adapters/couchDB'),
    couchConfig = config.couch,
    couch = require('../../services/user'),
    metrics = require('../../adapters/metrics')(config.metrics);

var couchdb = require('../mocks/couch')(couchConfig),
    server;

before(function (done) {
  // configure couch
  couchDB.init(couchConfig);

  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '6110' });
  server.register([
    {
      register: couch,
      options: couchConfig
    }
  ], function () {
    server.start(done);
  });
});

describe('setting and deleting sessions', function () {
  var request = {
    auth: {
      session: {
        set: function () {},
        clear: function () {}
      }
    },
    server: {
      app: {
        cache: {
          set: function (id, user, ttl, next) { return next(null); },
          drop: function (id, next) { return next(null); }
        }
      },
      methods: {
        user: {
          logoutUser: function (token, next) { return next(null); }
        },
        metrics: {
          addMetric: function () {}
        }
      }
    }
  };

  it('sets a session', function (done) {
    server.methods.user.setSession(request)({name: 'boom'}, function (er) {
      expect(er).to.be.null();
      done();
    });
  });

  it('deletes a session', function (done) {
    server.methods.user.delSession(request)({name: 'boom'}, function (er) {
      expect(er).to.be.null();
      done();
    });
  });
});