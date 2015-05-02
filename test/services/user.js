var expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    it = lab.test,

    sinon = require('sinon');

var Hapi = require('hapi'),
    userService = require('../../services/user'),
    metrics = require('../../adapters/metrics')();

var server;

before(function (done) {

  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '6110' });
  server.register(userService, function () {
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
