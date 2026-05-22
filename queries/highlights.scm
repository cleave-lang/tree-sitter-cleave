; Syntax highlighting for Cleave.
;
; Captures follow the conventional tree-sitter highlight names so existing
; editor themes pick them up without extra mapping. See the tree-sitter
; highlights reference for the standard capture vocabulary.

; ---- keywords ----

[
  "chain"
  "module"
  "protocol"
  "implements"
  "fn"
  "effect"
  "slash_on"
  "when"
  "penalty"
  "state"
  "gas"
  "event"
  "let"
  "if"
  "else"
  "match"
  "return"
  "with"
  "deferred"
  "pure"
  "view"
] @keyword

(subsystem_key) @keyword

; ---- literals ----

(number_literal) @number
(string_literal) @string
(char_literal) @character
(boolean_literal) @boolean
(null_literal) @constant.builtin

; ---- comments ----

(line_comment) @comment
(block_comment) @comment

; ---- types ----

(named_type
  (identifier) @type)

(generic_type
  name: (identifier) @type)

(type_parameter
  key: (identifier) @property)

(record_field
  key: (identifier) @property)

; ---- declarations: emphasize the names being declared ----

(chain_declaration
  name: (identifier) @type)

(module_declaration
  name: (identifier) @type)

(protocol_declaration
  name: (identifier) @type)

(state_declaration
  name: (identifier) @variable.member)

(gas_declaration
  name: (identifier) @variable.member)

(event_declaration
  name: (identifier) @function.method)

(effect_declaration
  name: (identifier) @function.method)

(function_declaration
  name: (identifier) @function)

(parameter
  name: (identifier) @variable.parameter)

(slash_on_declaration
  evidence: (identifier) @type)

; ---- calls + member access ----

(call_expression
  callee: (identifier) @function.call)

(call_expression
  callee: (member_expression
    property: (identifier) @function.method.call))

(call_expression
  callee: (path_expression
    name: (identifier) @function.call))

(member_expression
  property: (identifier) @variable.member)

(path_expression
  scope: (identifier) @namespace)

; ---- operators + punctuation ----

[
  "->"
  "=>"
  "::"
] @operator

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "="
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
] @operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  ":"
  "."
] @punctuation.delimiter
