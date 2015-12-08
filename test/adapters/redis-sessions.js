var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  requireInject = require('require-inject'),
  redis = require('redis-mock'),
  redisSessions = requireInject.installGlobally('../../adapters/redis-sessions', {
    redis: redis
  }),
  redisProcess;

describe('redis-requiring session stuff', function() {
  var redisClient;
  var bob1, bob2, alice1;
  var bobHash, aliceHash;
  var prefix = "hapi-cache:%7Csessions:";

  before(function(done) {
    redisClient = redis.createClient();
    redisClient.flushdb();
    redisClient.on("error", function(err) {
      console.log("Error " + err);
    });
    done();
  });

  after('cleans up the db', function(done) {
    redisClient.flushdb(done);
  });

  it('creates a random hash for each user', function(done) {
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

  it('adds some data', function(done) {
    redisClient.set(prefix + bob1, 'This is Bob on Firefox');
    redisClient.set(prefix + bob2, 'This is Bob on Safari');
    redisClient.set(prefix + alice1, 'This is Alice on Opera');

    redisClient.get(prefix + bob1, function(err, resp) {
      expect(err).to.not.exist();
      expect(resp).to.equal('This is Bob on Firefox');

      redisClient.get(prefix + bob2, function(err, resp) {
        expect(err).to.not.exist();
        expect(resp).to.equal('This is Bob on Safari');

        redisClient.get(prefix + alice1, function(err, resp) {
          expect(err).to.not.exist();
          expect(resp).to.equal('This is Alice on Opera');

          done();
        });
      });
    });
  });

  it('finds all existing keys with a certain prefix', function(done) {
    redisSessions.getKeysWithPrefix('bob', function(err, keys) {
      expect(err).to.not.exist();
      expect(keys).to.be.length(2);
      expect(keys[0]).to.include(bobHash);
      expect(keys[0]).to.not.include(aliceHash);
      expect(keys[1]).to.include(bobHash);
      expect(keys[1]).to.not.include(aliceHash);
      done();
    });
  });

  it('removes all existing keys with a certain prefix', function(done) {
    redisSessions.dropKeysWithPrefix('bob', function(err) {
      expect(err).to.not.exist();

      redisSessions.getKeysWithPrefix('', function(er, keys) {

        expect(er).to.not.exist();

        expect(keys).to.be.length(1);
        expect(keys[0]).to.include(aliceHash);
        expect(keys[0]).to.not.include(bobHash);
        done();
      });
    });
  });

});
