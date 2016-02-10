module.exports = function (packages) {
  var items = packages.items.filter((item) => item.version !== '9999.9999.9999');

  return Object.assign(packages, {
    count: items.length,
    items: items
  });
};
