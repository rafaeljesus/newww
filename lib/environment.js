var fs = require('fs');
var path = require('path');

module.exports = function(){

  require("dotenv").load();

  var missing = fs.readFileSync(path.resolve(__dirname, "..", ".env.example"), "utf-8")
    .match(/^(\w+)/gm)
    .filter(function(varrr){
      return !process.env[varrr];
    });

  if (missing.length) {
    console.error("\nThe following required environment variables are missing: " + missing.join(", "));
    console.error("Plese add them to your .env file or service.json!");
    process.exit(1);
  }

};
