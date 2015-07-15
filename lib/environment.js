var fs = require('fs');
var path = require('path');
var dotenv = require('dotenv');

if (process.env.REMOTE_DEV) {
  dotenv.config({path: '../../.env.dev'});
}

module.exports = function(){

  dotenv.load();

  var missing = fs.readFileSync(path.resolve(__dirname, "..", ".env.example"), "utf-8")
    .match(/^(\w+)/gm)
    .filter(function(varrr){
      return !process.env[varrr];
    });

  if (missing.length) {
    console.error("\nmissing: " + missing.join(", "));
    console.error("please update your .env or service.json");
    process.exit(1);
  }

};
