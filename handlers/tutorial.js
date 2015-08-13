var npa = require('npm-package-arg');
var PackageModel = require("../models/package");

module.exports = function(request, reply) {
	console.log(request.params)
    var name = request.packageName;
    console.log(JSON.stringify(name));
    console.log(name)
    var Package = PackageModel.new(request);
    console.log("here1");

    Package.get(name)
    .then(function(pkg) {
    	console.log("here2");
        var context = { package: pkg };
        reply.view('package/tutorial',context);
    }).catch(function(err) {
        console.log(err);
    });
};