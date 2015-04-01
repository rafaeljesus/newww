var fs = require('fs');
var path = require('path');

module.exports = function gitHead() {
  var head
  try {
    head = fs.readFileSync(path.resolve(__dirname, '..', '.git/HEAD'), 'utf8').trim()
    if (head.match(/^ref: /)) {
      head = head.replace(/^ref: /, '').trim()
      head = fs.readFileSync('.git/' + head, 'utf8').trim()
    }
  } catch (_) {
    head = '(not a git repo) ' + _.message
  }
  return head
}
