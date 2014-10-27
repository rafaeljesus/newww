var pkgs = require("pkgs")
var names = "grunt-cli bower gulp grunt express npm cordova forever less pm2 karma coffee-script statsd yo karma-phantomjs-launcher phonegap mocha jshint ronn express-generator statsd-librato-backend eslint istanbul protractor".split(" ")
var opts = {
  omit: ["readme", "versions"]
}

pkgs(names, opts, function(err, packages){
  process.stdout.write(JSON.stringify(packages, null, 2))
})
