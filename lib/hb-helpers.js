module.exports = function(handlebars) {
  // perform arithmetic inside handlebars templates.
  handlebars.registerHelper("minus", function(lvalue, rvalue) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    return lvalue - rvalue;
  });
};
