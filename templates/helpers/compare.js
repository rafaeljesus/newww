module.exports = function(lvalue, operator, rvalue, options) {
  if (arguments.length < 3)
    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

  if (typeof options === 'undefined') {
    options = rvalue;
    rvalue = operator;
    operator = "===";
  }


  operator = operator || "===";
  var operators = {
    '==': function(l, r) {
      return l == r;
    },
    '===': function(l, r) {
      return l === r;
    },
    '!=': function(l, r) {
      return l != r;
    },
    '<': function(l, r) {
      return l < r;
    },
    '>': function(l, r) {
      return (l > r);
    },
    '<=': function(l, r) {
      return l <= r;
    },
    '>=': function(l, r) {
      return l >= r;
    },
    'typeof': function(l, r) {
      return typeof l === r;
    }
  }

  if (!operators[operator])
    throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);

  var result = operators[operator](lvalue, rvalue);
  if (result) {

    return options.fn(this);
  } else {
    return options.inverse(this);
  }

}