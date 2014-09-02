// This is the module for starring and unstarring modules in the browser.
// It uses a localStorage cache to maintain a list of recent starrings
// and unstarrings, while the remote registry cache catches up.

var $ = require("jquery");
var uniq = require("array-uniq");
var remove = require("remove-value");

var star = module.exports = function() {
  $(star.init);
  return star;
}

star.init = function() {
  star.form = $('form.star')
  if (!star.form) return

  // Check the local star cache and update the form input *before* attaching the change handler
  var name = star.form.find("input[name=name]").val()
  star.form.find('input[type=checkbox]').prop("checked", star.packageInCache(name));

  star.form.find('input[type=checkbox]').on('change', star.onChange)
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

  // Cache it in locaStorage
  star.updateLocalCache(data);

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

// Add or remove this package from localStorage list of starred packages
star.updateLocalCache = function(data) {
  var stars = star.getCachedStarList()

  if (data.isStarred) {
    stars.push(data.name)
    stars = uniq(stars)
  } else {
    stars = remove(stars, data.name)
  }

  localStorage["stars"] = stars.join(";")
}

star.getCachedStarList = function() {
  var stars = localStorage["stars"] || "";
  return stars.length ? stars.split(";") : []
}

star.packageInCache = function(name) {
  return star.getCachedStarList().indexOf(name) > -1
}

star.onDone = function (resp) {
  // console.log(resp)
}

star.onError = function (xhr, status, error) {
  console.error(xhr, status, error)
}
