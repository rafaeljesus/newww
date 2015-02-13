var public = require("./public");
var authenticated = require("./authenticated");
// var all = [];

module.exports = public.concat(authenticated)
