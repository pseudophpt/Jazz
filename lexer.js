const error = require('./error');

module.exports.lexWord = function (expression) {
  expression = expression.trim();
  var token;

  for (var i = 0; i < expression.length; i ++) {
    if (!/[a-zA-Z0-9]/.test(expression[i])) {
      token = expression.substring(0, i);
      expression = expression.substring(i, expression.length).trimLeft();
      break;
    }
  }

  return {
    expression : expression,
    token : token
  };
}

module.exports.lexParen = function (expression) {
  expression = expression.trim();
  var token;

  if (expression[0] != '(') {
    throw error.expectedParentheses;
  }

  for (var i = 0; i < expression.length; i ++) {
    if (expression[i] == ')') {
      token = expression.substring(1, i);
      expression = expression.substring(i + 1, expression.length).trimLeft();
      break;
    }
  }

  return {
    expression : expression,
    token : token
  };
}

module.exports.lexArray = function (expression) {
  expression = expression.replace(/ /g, '');
  return expression.split(',')
}
