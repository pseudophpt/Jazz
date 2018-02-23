const fs = require('fs');
const error = require('./error');
const lexer = require('./lexer');

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

  /* Remove whitespace */
  directive = directive.trim();

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
    directive = directive.replace(/^([^\s]*)\s/, '').trim();

    if (directives[command] != undefined) {
      return directives[command](directive);
    }
    else {
      throw error.undefinedCommand;
    }

  }
}

function processCommand (directive) {
  /* Get command */
  var lex = lexer.lexWord(directive);
  var command = lex.token;
  directive = lex.expression;

  /* Get argument list */
  lex = lexer.lexParen(directive);
  var args = lex.token;
  directive = lex.expression;

  /* Parse array */
  args = lexer.lexArray(args);

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
  var name = directive.trim();

  if (consts[name] != undefined) {
    return consts[name];
  }
  else {
    throw error.undefinedConst;
  }
}

function defineCommand (directive) {
  /* Is post-pre-processing enabled? */

  var preprocess = false;

  if (directive[0] == '.') {
    directive = directive.substr(1);
    preprocess = true;
  }

  /* Get command */
  var lex = lexer.lexWord(directive);
  var name = lex.token;
  directive = lex.expression;

  /* Get argument list */
  lex = lexer.lexParen(directive);
  var args = lex.token;
  directive = lex.expression;

  /* Parse array */
  args = lexer.lexArray(args);

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
