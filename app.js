const fs = require('fs');
const error = require('./error');
const lexer = require('./lexer');

/* Symbols */
var templates = [];
var variables = [];
var functions = [];
var consts = [];

/* Command map */
var directives = {
  define : defineTemplate,
  const : defineConst,
  include : includeCommand,
  function : defineFunction,
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

  /* Function syntax */
  if (directive[0] == '#') {
    return processTemplate(directive.substr(1));
  }

  /* Function syntax */
  if (directive[0] == '?') {
    return processFunction(directive.substr(1));
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
      console.log(directive);
      throw error.undefinedCommand;
    }
  }
}


function processFunction (directive) {
  directive = directive.trim();

  var preprocess = false;
  if (directive[0] == '.') {
    preprocess = true;
    directive = directive.substring(1);
  }

  /* Get function */
  var lex = lexer.lexWord(directive);
  var func = lex.token;
  directive = lex.expression;

  /* Get argument list */
  lex = lexer.lexParen(directive);
  var args = lex.token;
  directive = lex.expression;

  /* Parse array */
  args = lexer.lexArray(args);

  var instructions = [];
  for (var i = 0; i < args.length; i ++) {
    instructions.push('push ' + args[i]);
  }
  instructions.push('');

  instructions.push('call ' + func);

  return instructions.join('\n');
}

function processTemplate (directive) {
  directive = directive.trim();

  var preprocess = false;
  if (directive[0] == '.') {
    preprocess = true;
    directive = directive.substring(1);
  }

  /* Get function */
  var lex = lexer.lexWord(directive);
  var template = lex.token;
  directive = lex.expression;

  /* Get argument list */
  lex = lexer.lexParen(directive);
  var args = lex.token;
  directive = lex.expression;

  /* Parse array */
  args = lexer.lexArray(args);

  /* Get corresponding template */
  template = templates[template];

  var instructions = template.instructions;

  for (var i = 0; i < instructions.length; i ++) {
    for (var j = 0; j < args.length; j ++) {
      var regex = new RegExp('\\[' + j + '\\]', 'g')
      instructions[i] = instructions[i].replace(regex, args[j]);
    }
  }

  /* Join by newline */
  instructions = instructions.join('\n');

  /* Preprocess if enabled */
  if (template.preprocess || preprocess) {
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

function defineTemplate(directive) {
  /* Is post-pre-processing enabled? */

  var preprocess = false;

  if (directive[0] == '.') {
    directive = directive.substr(1);
    preprocess = true;
  }

  /* Get Function */
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

  /* Store template */
  templates[name] = {
    instructions : instructions,
    preprocess : preprocess
  };

  return "";
}

function defineConst (directive) {
  /* Get name */
  var lex = lexer.lexWord(directive);
  var name = lex.token;
  directive = lex.expression;

  lex = lexer.lexParen(directive);
  var value = lex.token;

  consts[name] = value;

  return "";
}

function defineFunction (directive) {
  /* Is post-pre-processing enabled? */
  var preprocess = false;

  if (directive[0] == '.') {
    directive = directive.substr(1);
    preprocess = true;
  }

  /* Get Function */
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
      instructions[i] = instructions[i].replace(regex, '[ebp-' + ((j + 1) * 4) + ']');
    }
  }

  instructions.unshift('');
  instructions.unshift('mov ebp, esp');
  instructions.unshift('push ebp');
  instructions.unshift(name + ':');

  instructions.push('');
  instructions.push('mov esp, ebp');
  instructions.push('pop ebp');
  instructions.push('ret');

  return instructions.join('\n');
}

function includeCommand(directive) {
  return parseFile(directive);
}
