const fs = require('fs');

/* Symbols */
var commands = [];
var variables = [];
var consts = [];

/* Command map */
var directives = {
  define : defineCommand,
  const : defineConst
}

var file = fs.readFileSync(process.argv[2], 'utf8');

try {
  console.log(file.replace(/\<[^\<^\>]*\>/g, preProcess));
}
catch (error) {
  console.log('Parse error');
}

function preProcess (directive) {
  /* Remove opening and closing brackets */
  directive = directive.substr(1, directive.length - 2);

  /* Remove newlines */
  directive = directive.replace(/\n/g, '');

  /* Command syntax */
  if (directive[0] == '?') {
    return processCommand(directive.substr(1));
  }

  /* Variable syntax */
  else if (directive[0] == '&') {
    return "woah";
  }

  /* Const syntax */
  else if (directive[0] == '%') {
    return processConst(directive.substr(1));
  }

  else {
    var command = directive.replace(/ .*/,'');
    directive = directive.replace(/^([^\s]*)\s/, '');

    return directives[command](directive);
  }
}

function processCommand (directive) {
  /* Get command */
  var command = directive.replace(/\(.*/,'').replace(/[^[a-z]]/g, '');

  /* Remove it */
  directive = directive.replace(/[^\(]*/, '');

  /* Get argument list */
  var args = directive.match(/\(.*\)/)[0];
  args = args.substr(1, args.length - 2);
  args = args.replace(/ /g, '');
  args = args.split(',');

  /* Get corresponding command */
  var instructions = commands[command];

  for (var i = 0; i < instructions.length; i ++) {
    for (var j = 0; j < args.length; j ++) {
      var regex = new RegExp('\\[' + j + '\\]', 'g')
      instructions[i] = instructions[i].replace(regex, args[j]);
    }
  }

  return instructions.join('\n');
}

function processConst (directive) {
  /* Get name */
  var name = directive.replace(/\(.*/,'').replace(/\s/g, '').replace(/[^[a-z]]/g, '');

  return consts[name];
}

function defineCommand (directive) {
  /* Get name */
  var name = directive.replace(/\(.*/,'').replace(/\s/g, '').replace(/[^[a-z]]/g, '');

  /* Remove it */
  directive = directive.replace(/[^\(]*/, '');

  /* Get argument list */
  var args = directive.match(/\(.*\)/)[0];
  args = args.substr(1, args.length - 2);
  args = args.replace(/ /g, '');
  args = args.replace(/[^[a-z]]/g, '');
  args = args.split(',');

  directive = directive.replace(/\(.*\) /, '');

  /* Instructions */
  var instructions = directive.split(';');

  /* Remove leading and trailing whitespace and replace arguments */
  for (var i = 0; i < instructions.length; i ++) {
    instructions[i] = instructions[i].replace(/^\s+|\s+$/, '');
    for (var j = 0; j < args.length; j ++) {
      var regex = new RegExp('\\[' + args[j] + '\\]', 'g');
      instructions[i] = instructions[i].replace(regex, '[' + j + ']');
    }
  }

  /* Store command */
  commands[name] = instructions;

  return "";
}

function defineConst (directive) {
  /* Get name */
  var name = directive.replace(/\(.*/,'').replace(/\s/g, '').replace(/[^[a-z]]/g, '');

  /* Remove it */
  directive = directive.replace(/[^\(]*/, '');

  /* Remove whitespace */
  var value = directive.replace(/^\s+|\s+$/, '');

  value = value.substr(1, value.length - 2);

  consts[name] = value;

  return "";
}
