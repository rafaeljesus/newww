var $ = require("jquery")
var cargo = require("cargo")

var star = module.exports = function() {
  // Load when the DOM is ready
  $(star.init)
}

// Registry data is cached and may be out of date.
// Look in localStorage for recent (un)starrage of the current package.
star.init = function() {
  star.form = $('form.star')
  if (!star.form) return
  star.form.find('input[type=checkbox]').on('change', star.update)
}

star.update = function() {
  var data = {}

  // Gather data from the form inputs
  // If checkbox is *unchecked*, it won't be included in this array.
  star.form.serializeArray().forEach(function(input){
    data[input.name] = input.value;
  })

  // JavaScript is loosely typed...
  data.isStarred = Boolean(data.isStarred)

  // console.log(data);

  $.ajax({
    url: '/star',
    data: data,
    type: 'POST',
    headers: {'x-csrf-token': data.crumb}
  })
    .done(star.done)
    .error(star.error)
}

star.done = function (resp) {
  console.log(resp)
}

star.error = function (xhr, status, error) {
  console.error(xhr, status, error)
}
