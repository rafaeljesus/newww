$(function() {

  var searchWidth = $('#npm-search').outerWidth() - $('#site-search-submit').outerWidth();

  $.getScript("//cnstrc.com/js/ac.js", function() {
    $('#site-search').constructorAutocomplete({
      key: 'CD06z4gVeqSXRiDL2ZNK',
      directResults: true,
      maxHeight: 400,
      width: searchWidth
    });
  });

  $(window).resize(function() {
    searchWidth = $('#npm-search').outerWidth() - $('#site-search-submit').outerWidth();
    $('.autocomplete-suggestions').outerWidth(searchWidth);
  });
});

