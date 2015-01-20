var User = module.exports = new(require("../../../models/user"))();

var fixtures = {
  user: {
    name: "forrest",
    email: "forrest@example.com",
    meta: {
      github: "forrest",
      twitter: "forrest"
    }
  },
  packages: [
    {name: "foo", description: "It's a foo!"},
    {name: "bar", description: "It's a bar!"}
  ],
  stars: [
    'minimist',
    'hapi'
  ]
}

User.get = function(name, options, callback) {
  var res = fixtures.user

  if (!callback) {
    callback = options
    options = {}
  }

  if (name === "mr-perdido") {
    var err = Error("User not found")
    err.statusCode = 404
    return callback(err)
  }

  if (options.stars) res.stars = fixtures.stars;

  if (options.packages) res.packages = fixtures.packages;

  return callback(null, res);
};

User.getStars = function(name, callback) {
  return callback(null, fixtures.stars);
};

User.getPackages = function(name, callback) {
  return callback(null, fixtures.packages);
};
