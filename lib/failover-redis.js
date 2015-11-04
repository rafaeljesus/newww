var EventEmitter = require('events').EventEmitter;
var util = require('util');
var redis = require('redis');
var Queue = require('double-ended-queue');

var FailoverRedis = module.exports = function(options) {
  var self = this;

  options = options || {};

  if (typeof options === 'string') {
    // Default to old settings.
    options = {
      read: options,
      write: options
    };
  }

  this._write = redis.createClient(options.write);
  this._read = redis.createClient(options.read);

  // Not writable or readable until proven otherwise.
  this.writable = false;
  this.readable = false;

  this.writeReady = false;
  this.readReady = false;

  function writableDown() {
    self.writeReady = false;
    self.writable = false;
    self.readable = self.readReady;
    self.emit('reconnecting');
  }

  this._write.on('ready', function () {
    self.writeReady = true;
    self.writable = true;
    self.readable = true;
    self._flushQueue();
    self.emit('ready');
  });

  this._write.on('reconnecting', writableDown);
  this._write.on('error', writableDown);

  function readableDown() {
    self.readReady = false;
    // If the replica fails, but the master is still up, we're still readable.
    self.readable = self.writeReady;
  }

  this._read.on('ready', function () {
    self.readReady = true;
    self.readable = true;
  });

  this._read.on('reconnecting', readableDown);
  this._read.on('error', readableDown);

  this._queue = new Queue();

  EventEmitter.call(this);
};
util.inherits(FailoverRedis, EventEmitter);

Object.keys(redis.RedisClient.prototype).forEach(function(func) {
  FailoverRedis.prototype[func] = function() {
    if (this.writable) {
      return redis.RedisClient.prototype[func].apply(this._write, arguments);
    }
    else if (this.readable) {
      return redis.RedisClient.prototype[func].apply(this._read, arguments);
    }
    else {
      this._queue.push([func, arguments]);
    }
  };
});

FailoverRedis.prototype.quit = function() {
  this._write.quit();
  this._read.quit();
};

FailoverRedis.prototype._flushQueue = function() {
  var command;
  while ((command = this._queue.shift())) {
    this[command[0]].apply(this, command[1]);
  }
};
