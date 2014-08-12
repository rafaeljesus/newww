/*
	Let's get these stars up in here
*/

function addExpiration () {
  var NUM_SECONDS = 60
  var d = new Date()
  d.setTime(d.getTime() + NUM_SECONDS*1000)
  return '; expires='+d.toGMTString()
}

function getPackages (name) {
  var packages = document.cookie.split(";")
                  .map(function(k) {
                    return k.trim().split("=")
                  })
                  .reduce(function (set, kv) {
                    set[kv.shift()] = kv.join("=");
                    return set
                  },{})

  return name ? packages[name] : packages
}

$(document).ready(function () {
  // check if there's already a cookie
  var packageName = $('.star').data('name')

  var starType = getPackages(packageName)

  if (starType) {
    if (starType === 'star') {
      $('.star').addClass('star-starred')
    } else {
      $('.star').removeClass('star-starred')
    }
  }

  // user clicks on the star
  $('.star').click(function (e) {
    // let's turn this into a checkbox eventually...
    e.preventDefault()
    var packages = getPackages()

    var data = {}
    data.name = $(this).data('name')
    data.isStarred = $(this).hasClass('star-starred')
    data.crumb = $('.star').data('crumb')

    $.ajax({
      url: '/star',
      data: data,
      type: 'POST',
      headers: { 'x-csrf-token': data.crumb }
    })
    .done(function (resp) {
      // console.log('success!', resp)

      if (data.isStarred) {
        $('.star').removeClass('star-starred')
        document.cookie = data.name + '=nostar' + addExpiration()
      } else {
        $('.star').addClass('star-starred')
        document.cookie = data.name + '=star' + addExpiration()
      }

    })
    .error(function (xhr, status, error) {
      console.log('whoops!', xhr, xhr.status, xhr.responseText, status)
      if (xhr.status === 403) {
        // we're probably not logged in
        window.location = '/login?done=/package/' + data.name
      } else {
        // couch is being silly...
        console.log(xhr.responseText)
        // eventually add the drop-toast "whoops something went wrong"
      }
    })
  })

})