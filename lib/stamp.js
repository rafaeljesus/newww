var os = require('os'),
  fs = require("fs");

module.exports = function stamp() {
  return [
    'pid=' + process.pid,
    require("./git-head")(),
    process.env.CANONICAL_HOST,
    os.hostname(),
    process.env.SMF_ZONENAME,
  ].join(" ");
}
