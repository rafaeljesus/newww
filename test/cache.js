var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    crypto = require('crypto'),
    sinon = require('sinon'),
    nock = require('nock');

var cache;

describe('lib/cache.js', function()
{

    beforeEach(function(done)
    {
        cache = require('../lib/cache');
        done();
    });

    it('requires that configure be called before use', function(done)
    {
        function shouldThrow() { return cache.get('foo'); }
        expect(shouldThrow).to.throw(/configure/);
        done();
    });

    it('configure() requires an options object', function(done)
    {
        function shouldThrow() { cache.configure(); }
        expect(shouldThrow).to.throw(/options/);
        done();
    });

    it('configure() requires a redis url option', function(done)
    {
        function shouldThrow() { cache.configure({}); }
        expect(shouldThrow).to.throw(/redis/);
        done();
    });

    it('configure() creates a redis client', function(done)
    {
        expect(cache.redis).to.not.exist();
        cache.configure({ redis: 'redis://localhost:6379'});
        expect(cache.redis).to.be.an.object();
        done();
    });

    it('configure() respects the `ttl` option', function(done)
    {
        expect(cache.DEFAULT_TTL).to.equal(300);
        cache.configure({ redis: 'redis://localhost:6379', ttl: 600 });
        expect(cache.DEFAULT_TTL).to.equal(600);
        done();
    });

    it('configure() respects the `prefix` option', function(done)
    {
        expect(cache.KEY_PREFIX).to.equal('cache:');
        cache.configure({ redis: 'redis://localhost:6379', prefix: 'fred:' });
        expect(cache.KEY_PREFIX).to.equal('fred:');
        done();
    });


    it('_fingerprint() returns an md5 hash prefixed by the key prefix', function(done)
    {
        var testKey = { foo: 'bar' };
        var expected = crypto.createHash('md5').update(JSON.stringify(testKey)).digest('hex');
        var generated = cache._fingerprint(testKey);

        expect(generated.indexOf(expected)).to.equal(5);
        expect(generated.indexOf('fred:')).to.equal(0);
        done();
    });

    it('_fingerprint() returns the same value for the same input', function(done)
    {
        var key1 = { foo: 'bar', baz: 'qux' };
        var key2 = { baz: 'qux', foo: 'bar' };
        var gen1 = cache._fingerprint(key1);
        var gen2 = cache._fingerprint(key2);

        expect(gen1).to.equal(gen2);
        done();
    });

    it('get() requires an options argument', function(done)
    {
        function shouldThrow() { cache.get(); }
        expect(shouldThrow).to.throw(/Request/);
        done();
    });

    it('get() calls _fingerprint()', function(done)
    {
        sinon.spy(cache, '_fingerprint');

        nock("https://fingerprint.com").get("/").reply(200);
        var opts = {method: "get", url: 'https://fingerprint.com/'};

        cache.get(opts, function(err, data)
        {
            expect(cache._fingerprint.calledOnce).to.be.true();
            expect(cache._fingerprint.calledWith(opts)).to.be.true();
            cache._fingerprint.restore();
            done();
        });
    });

    it('get() checks redis for the presence of the data first', function(done)
    {
        sinon.spy(cache.redis, 'get');
        var opts = {url: 'https://google.com/'};
        var fingerprint = cache._fingerprint(opts);

        cache.get(opts, function(err, data)
        {
            expect(cache.redis.get.calledOnce).to.equal(true);
            expect(cache.redis.get.calledWith(fingerprint)).to.equal(true);
            cache.redis.get.restore();
            done();
        });
    });

    it('get() makes a request using the options argument if redis has no value', function(done)
    {

      sinon.stub(cache.redis, 'get').yields(null);

      var opts = {
        method: "get",
        url: 'https://google.com/searching'
      };

      var mock = nock("https://google.com")
          .get("/searching")
          .reply(200);

      cache.get(opts, function(err, data)
      {
          expect(cache.redis.get.calledOnce).to.equal(true);
          cache.redis.get.restore();
          mock.done();
          done();
      });
    });

    it('get() makes a request to the backing service if the redis value is garbage', function (done)
    {

      sinon.stub(cache.redis, 'get').yields(null, null);

      var opts = {
          method: "get",
          url: 'https://google.com/again'
      };

      var mock = nock("https://google.com")
          .get("/again")
          .reply(200);

      cache.get(opts, function(err, data)
      {
          expect(cache.redis.get.calledOnce).to.equal(true);
          cache.redis.get.restore();
          mock.done();
          done();
      });
    });

    it('get() gracefully handles a missing or error-returning redis', function(done)
    {

      sinon.stub(cache.redis, 'get').yields(Error("hello redis error"));
      sinon.spy(cache, 'logger');

      var opts = {
          url: 'https://logging.com/'
      };

      cache.get(opts, function(err, data)
      {
          expect(cache.logger.calledTwice).to.equal(true);
          expect(cache.logger.calledWithMatch(/problem getting/)).to.equal(true);
          cache.logger.restore();
          done();
      });
    });

    it('get() sets the value in redis after retrieval', function(done)
    {

      sinon.spy(cache.redis, 'set');

      var opts = {
          method: "get",
          url: 'https://cache.com/hello'
      };
      var fingerprint = cache._fingerprint(opts);
      var mock = nock("https://cache.com")
          .get("/hello")
          .reply(200);

      cache.get(opts, function(err, data)
      {
          mock.done();
          expect(cache.logger.calledOnce).to.equal(true);
          expect(cache.redis.set.calledWithMatch(fingerprint)).to.equal(true);
          cache.redis.set.restore();
          done();
      });
    });

    it('get() respects the default TTL', function(done)
    {
      expect(cache.DEFAULT_TTL).to.equal(600);

      sinon.spy(cache.redis, 'set');

      var opts = {
          method: "get",
          url: 'https://cache.com/hello-again'
      };
      var fingerprint = cache._fingerprint(opts);
      var mock = nock("https://cache.com")
          .get("/hello-again")
          .reply(200);

      cache.get(opts, function(err, data)
      {
          mock.done();
          expect(cache.logger.calledOnce).to.equal(true);
          expect(cache.redis.set.calledWithMatch(fingerprint, 600)).to.equal(true);
          cache.redis.set.restore();
          done();
      });
    });

    it('get() responds with a promise if no callback is provided');
});
