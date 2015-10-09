$(function() {

  var searchWidth;

  var style = document.createElement('style');
  document.head.appendChild(style);

  $(window).resize(init);

  init();
  $.getScript("//cnstrc.com/js/ac.js", function() {

    $('#site-search').constructorAutocomplete({
      key: 'CD06z4gVeqSXRiDL2ZNK',
      directResults: true,
      maxHeight: 400
    });
  });

  function init() {
    searchWidth = $('#npm-search').outerWidth() - $('#site-search-submit').outerWidth();
    style.innerHTML = ".autocomplete-container, .autocomplete-suggestions, #powered-by-constructor-io { width: " + searchWidth + "px !important }";
  }
});

