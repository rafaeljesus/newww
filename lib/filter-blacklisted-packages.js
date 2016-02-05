var _ = require('lodash');
var blacklist = require('./blacklist');

module.exports = function (packages) {
  var items = _.cloneDeep(packages).items.filter(function (item) {
    return ! blacklist.some(function (term) {
      return term.trim() === item.name;
    });
  });

  return Object.assign(packages, {
    count: items.length,
    items: items
  });
};
