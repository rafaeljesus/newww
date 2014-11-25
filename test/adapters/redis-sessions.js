require("dotenv").load()

var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var redis = require('redis'),
    spawn = require('child_process').spawn,
    config = require('../../config').server.cache;

    config.port = 6379;
    config.password = '';

var redisSessions = require('../../adapters/redis-sessions'),
    redisProcess;

before(function (done) {
  var redisConfig = '--port ' + config.port;
  redisProcess = spawn('redis-server', [redisConfig]);
  done();
});

after(function(done) {
  redisProcess.kill('SIGKILL');
  done();
});

describe('redis-requiring session stuff', function() {
  var client;
  var bob1, bob2, alice1;
  var bobHash, aliceHash;
  var prefix = "hapi-cache:%7Csessions:";

  before(function (done) {
    client = redis.createClient(config.port, config.host);
    client.auth(config.password, function () {});
    client.on("error", function (err) {
      console.log("Error " + err);
    });
    done();
  });

  after('cleans up the db', function (done) {
    client.del([prefix+bob1, prefix+bob2, prefix+alice1], done)
  });

  it('has a SESSION_SALT environment variable', function(done) {
    expect(process.env.SESSION_SALT).to.exist;
    done();
  })

  it('creates a random hash for each user', function (done) {
    bob1 = redisSessions.generateRandomUserHash('bob');
    bob2 = redisSessions.generateRandomUserHash('bob');
    alice1 = redisSessions.generateRandomUserHash('alice');

    bobHash = redisSessions.userPrefixHash('bob');
    aliceHash = redisSessions.userPrefixHash('alice');

    expect(bob1).to.include(bobHash + '---');
    expect(bob2).to.include(bobHash + '---');
    expect(alice1).to.include(aliceHash + '---');
    done();
  });

  it('adds some data', function (done) {
    client.set(prefix + bob1, 'This is Bob on Firefox');
    client.set(prefix + bob2, 'This is Bob on Safari');
    client.set(prefix + alice1, 'This is Alice on Opera');

    client.get(prefix + bob1, function (err, resp) {
      expect(err).to.not.exist;
      expect(resp).to.equal('This is Bob on Firefox');

      client.get(prefix + bob2, function (err, resp) {
        expect(err).to.not.exist;
        expect(resp).to.equal('This is Bob on Safari');

        client.get(prefix + alice1, function (err, resp) {
          expect(err).to.not.exist;
          expect(resp).to.equal('This is Alice on Opera');

          done();
        });
      });
    });
  });

  it('finds all existing keys with a certain prefix', function(done) {
    redisSessions.getKeysWithPrefix('bob', function (err, keys) {
      expect(err).to.not.exist;
      expect(keys).to.be.length(2);
      expect(keys[0]).to.include(bobHash);
      expect(keys[0]).to.not.include(aliceHash);
      expect(keys[1]).to.include(bobHash);
      expect(keys[1]).to.not.include(aliceHash);
      done();
    });
  });

  it('removes all existing keys with a certain prefix', function(done) {
    redisSessions.dropKeysWithPrefix('bob', function (err) {
      expect(err).to.not.exist;

      redisSessions.getKeysWithPrefix('', function (er, keys) {
        expect(keys).to.be.length(1);
        expect(keys[0]).to.include(aliceHash);
        expect(keys[0]).to.not.include(bobHash);
        done();
      });
    });
  });

});
