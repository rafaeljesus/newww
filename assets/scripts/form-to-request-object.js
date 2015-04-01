var steeltoe = require("steeltoe")

// generate a request object from form data
//
// method -> method
// action -> url
// inputs -> data

module.exports = function formToRequestObject($el) {
  var opts = {
    method: $el.attr("method"),
    url: $el.attr("action"),
    json: true,
    data: {}
  }

  // support setting deep properties like 'package.name'
  $el.serializeArray().forEach(function(input){
    steeltoe(opts.data).set(input.name, input.value);
  })

  if (window && window.crumb) {
    opts.data.crumb = window.crumb;
    opts.headers = {'x-csrf-token': window.crumb};
  }

  return opts;
}
