var crypto = require('crypto');
var client = require('redis-url').connect(process.env.REDIS_URL)

client.on("error", function (err) {
  console.log("Error " + err);
});

var createSuffix = function() {
  return String(Math.floor(Math.random()*1000000));
};

var userPrefixHash = function(name) {
  if (!name) { return name; }

  return crypto
  .createHash('sha256')
  .update(name + process.env.SESSION_SALT)
  .digest('hex');
};

module.exports = client;

client.userPrefixHash = userPrefixHash;

client.getKeysWithPrefix = function(prefix, callback) {
  client.keys("hapi-cache:%7Csessions:"+userPrefixHash(prefix)+"*", callback);
};

client.dropKeysWithPrefix = function(prefix, callback) {
  client.getKeysWithPrefix(prefix, function (err, keys) {
    if (err) { return callback(err); }
    client.del(keys, callback);
  });
};

client.generateRandomUserHash = function(name) {
  return [userPrefixHash(name), createSuffix()].join("---");
};
