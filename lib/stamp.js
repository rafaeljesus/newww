var os = require('os'),
    fs = require("fs");

module.exports = function stamp() {
  return [
    'pid='+process.pid,
    gitHead(),
    process.env.CANONICAL_HOST,
    os.hostname(),
    process.env.SMF_ZONENAME,
  ].join(" ")
}

function gitHead() {
  var head
  try {
    head = fs.readFileSync('.git/HEAD', 'utf8').trim()
    if (head.match(/^ref: /)) {
      head = head.replace(/^ref: /, '').trim()
      head = fs.readFileSync('.git/' + head, 'utf8').trim()
    }
  } catch (_) {
    head = '(not a git repo) ' + _.message
  }
  return head
}
