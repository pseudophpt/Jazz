const fs = require('fs');
const error = require('./error');

/* Symbols */
var commands = [];
var variables = [];
var consts = [];

/* Command map */
var directives = {
  define : defineCommand,
  const : defineConst,
  include : includeCommand
}

console.log(parseFile(process.argv[2]))

function parseFile (filename) {
  var file = fs.readFileSync(filename, 'utf8');

  return parse(file);
}

function parse(file) {
  var level = 0;
  var start;
  var end;
  for (var i = 0; i < file.length; i ++) {
    if (file[i] == '<') {
      if (level == 0) {
        start = i;
      }
      level ++;
    }
    if (file[i] == '>') {
      if (level == 1) {
        end = i;
        var directive = file.substring(start, end + 1);
        var prev = file.substring(0, start);
        var next = file.substring(end + 1, file.length);
        var processed = preProcess(directive);

        file = prev.concat(processed, next);
        i += (processed.length - directive.length);
      }
      level --;
    }
  }

  if (level != 0) {
    throw error.bracketMismatch;
  }

  return file;
}



function preProcess (directive) {
  /* Remove opening and closing brackets */
  directive = directive.substring(1, directive.length - 1);

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
  command = commands[command];

  var instructions = command.instructions;

  for (var i = 0; i < instructions.length; i ++) {
    for (var j = 0; j < args.length; j ++) {
      var regex = new RegExp('\\[' + j + '\\]', 'g')
      instructions[i] = instructions[i].replace(regex, args[j]);
    }
  }

  /* Join by newline */
  instructions = instructions.join('\n');

  /* Preprocess if enabled */
  if (command.preprocess) {
    instructions = parse(instructions);
  }

  return instructions;
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
    instructions[i] = instructions[i].trim();
    for (var j = 0; j < args.length; j ++) {
      var regex = new RegExp('\\[' + args[j] + '\\]', 'g');
      instructions[i] = instructions[i].replace(regex, '[' + j + ']');
    }
  }

  var preprocess = false;

  /* Is post-pre-processing enabled? */
  if (name[0] == '.') {
    name = name.substr(1);
    preprocess = true;
  }

  /* Store command */
  commands[name] = {
    instructions : instructions,
    preprocess : preprocess
  };

  return "";
}

function defineConst (directive) {
  /* Get name */
  var name = directive.replace(/\(.*/,'').replace(/\s/g, '').replace(/[^[a-z]]/g, '');

  /* Remove it */
  directive = directive.replace(/[^\(]*/, '');

  /* Remove whitespace */
  var value = directive.trim();

  value = value.substr(1, value.length - 2);

  consts[name] = value;

  return "";
}

function includeCommand(directive) {
  return parseFile(directive);
}
