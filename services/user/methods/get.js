var UserModel = require("../../../models/user");
var Customer = require("../../../models/customer");

module.exports = function(name, next) {
  var User = new UserModel({bearer: name});

  User.get(name, {stars: true, packages: true}, function(err, user) {
    if (err) {
      return next(err);
    }

    Customer.new().get(name, function(err, customer) {
      if (err && err.statusCode !== 404) {
        return next(err);
      }

      if (customer) {
        user.isPaid = true;
        user.customer = customer;
      } else {
        user.isPaid = false;
      }

      return next(null, user);
    });

  });
};
