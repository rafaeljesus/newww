
// TODO: Get rid of this file and its explicit-installs.json counterpart!

var pkgs = require("pkgs")
var names = "browserify grunt-cli bower gulp grunt express npm cordova forever less pm2 karma coffee-script statsd yo karma-phantomjs-launcher phonegap mocha jshint ronn express-generator statsd-librato-backend eslint istanbul protractor".split(" ")
var opts = {
  omit: ["readme"]
}

pkgs(names, opts, function(err, packages){
  process.stdout.write(JSON.stringify(packages, null, 2))
})
