var marked = require('marked');

module.exports = function md (markdown) {
  return marked.parse(markdown);
}