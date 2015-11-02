var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  sinon = require('sinon');

var Hapi = require('hapi'),
  userService = require('../../services/user');
var server;

before(function(done) {

  server = new Hapi.Server();
  server.connection({
    host: 'localhost',
    port: '6110'
  });
  server.register(userService, function() {
    server.start(done);
  });
});

describe('setting and deleting sessions', function() {
  var client, mockedRequest;
  var userSessionId;

  before(function(done) {
    client = require('redis').createClient();
    client.flushdb();
    client.on('error', function(err) {
      console.log('Error ' + err);
    });
    done();

    mockedRequest = {
      auth: {
        session: {
          set: sinon.spy(),
          clear: sinon.spy()
        }
      },
      server: {
        app: {
          cache: {
            set: function(id, user, ttl, next) {
              client.set(id, JSON.stringify(user), next);
            },
            drop: sinon.spy(
              function(id, next) {
                client.del(id, next);
              }
            )
          }
        }
      }
    };
  });

  after('cleans up the db', function(done) {
    client.flushdb(done);
  });

  it('sets a session', function(done) {
    server.methods.user.setSession(mockedRequest)({
      name: 'boom'
    }, function(er) {
      expect(er).to.be.null();
      expect(mockedRequest.auth.session.set.called).to.be.true();

      client.keys('*', function(err, keys) {
        expect(err).to.be.null();

        client.get(keys[0], function(err, item) {
          expect(err).to.be.null();
          item = JSON.parse(item);

          expect(item.name).to.equal('boom');
          userSessionId = item.sid;
          done();
        });
      });
    });
  });

  describe('deleting a session', function() {
    it('clears out sessions without a user session id', function(done) {
      server.methods.user.delSession(mockedRequest)({
        name: 'boom'
      }, function(er) {
        expect(er).to.be.null();
        expect(mockedRequest.auth.session.clear.called).to.be.true();
        expect(mockedRequest.server.app.cache.drop.called).to.be.false();
        done();
      });
    });

    it('clears out an existing session', function(done) {
      var user = {
        name: 'boom',
        sid: userSessionId
      };

      server.methods.user.delSession(mockedRequest)(user, function(er) {
        expect(er).to.be.null();
        expect(mockedRequest.auth.session.clear.called).to.be.true();
        expect(mockedRequest.server.app.cache.drop.called).to.be.true();
        client.keys('*', function(err, keys) {
          expect(keys).to.be.empty();
          done();
        });
      });
    });
  });
});
