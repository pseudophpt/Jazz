# Jazz
The x86 Pre-processor

## Usage
`node app <filename>`

## Syntax
All Jazz directives are enclosed by angle-brackets.

### Functions
- Use `<define func(arg1, arg2, ...) statement [arg1] [arg2]; statement2 [arg2]>` to define function `func`
- Use `?func(args)` to call a function
- Prefix the function name with `.` to pre-process the return value of the function.

### Constants
- Use `<const name(value)>` to define constant `name`
- Use `<%name>` to reference constant `name`

### Include
- Use `<include filename>` to include and parse file with name `filename`
