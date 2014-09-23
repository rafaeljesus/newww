// This is the module for starring and unstarring modules in the browser.

var $ = require("jquery");

var star = module.exports = function() {
  $(star.init);
  return star;
}

star.init = function() {
  star.form = $('form.star')
  if (!star.form) return
  star.form.checkbox = star.form.find('input[type=checkbox]')

  star.form.checkbox.on('change', star.onChange)

  // Check the checkbox if we arrived from the login page
  // and there's a #star fragment in the URL
  if (String(document.referrer).match("/login") && String(location.hash).match("#star")) {
    console.log("post-login starring...")
    star.form.checkbox.prop("checked", true);
  }
}

star.onChange = function() {
  var data = {}

  // Gather data from the form inputs
  // jQuery gotcha: If checkbox is unchecked, it won't be included in this array.
  star.form.serializeArray().forEach(function(input){
    data[input.name] = input.value;
  })

  // JavaScript is loosely typed...
  data.isStarred = Boolean(data.isStarred)

  // Update count in label
  var count = Number(star.form.find("label").text())
  data.isStarred ? ++count : --count
  star.form.find("label").text(count)

  $.ajax({
    url: '/star',
    data: data,
    type: 'POST',
    headers: {'x-csrf-token': data.crumb}
  })
    .done(star.onDone)
    .error(star.onError)
}

star.onDone = function (data) {
  // console.log(data)
}

star.onError = function (xhr, status, error) {
  // Redirect to login page if we got a 403
  if (xhr && xhr.status && Number(xhr.status) === 403) {
    window.location = "/login?done="+location.pathname+"#star"
    return
  }

  console.error(xhr)
}
