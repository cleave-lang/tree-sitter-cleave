/**
 * @file Tree-sitter grammar for the Cleave programming language.
 * @author Cleave Labs
 * @license Apache-2.0
 *
 * Cleave is a programming language for building blockchains from scratch.
 * See https://github.com/cleave-lang/cleave for the compiler and language
 * reference. The reference grammar in EBNF lives at
 * https://github.com/cleave-lang/cleave/blob/main/spec/grammar.ebnf;
 * this file is the tree-sitter implementation of that grammar plus the
 * planned module-body productions.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "cleave",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._top_level),

    _top_level: ($) =>
      choice($.chain_declaration, $.module_declaration, $.protocol_declaration),

    /* ============== chain ============== */

    chain_declaration: ($) =>
      seq(
        "chain",
        field("name", $.identifier),
        "{",
        repeat($.subsystem_assignment),
        "}",
      ),

    subsystem_assignment: ($) =>
      seq(
        field("key", $.subsystem_key),
        ":",
        field("value", $._type_expression),
        optional(choice(";", ",")),
      ),

    // Subsystem keys are arbitrary identifiers (cleave-lang/cleave#64).
    // The five stdlib axes (consensus, gas, state, exec, da) are
    // matched here as well; chains can declare any axis they want by
    // inventing a new identifier.
    subsystem_key: ($) => $.identifier,

    /* ============== module ============== */

    module_declaration: ($) =>
      seq(
        "module",
        field("name", $.identifier),
        "{",
        repeat($._module_item),
        "}",
      ),

    _module_item: ($) =>
      choice(
        $.state_declaration,
        $.gas_declaration,
        $.event_declaration,
        $.function_declaration,
        $.effect_declaration,
      ),

    state_declaration: ($) =>
      seq(
        "state",
        field("name", $.identifier),
        ":",
        field("type", $._type_expression),
      ),

    gas_declaration: ($) =>
      seq(
        "gas",
        field("name", $.identifier),
        "=",
        field("value", choice($.record_literal, $._expression)),
      ),

    record_literal: ($) =>
      seq("{", commaSep1Trailing($.record_field), "}"),

    record_field: ($) =>
      seq(field("key", $.identifier), ":", field("value", $._expression)),

    event_declaration: ($) =>
      seq(
        "event",
        field("name", $.identifier),
        "(",
        optional($._param_list),
        ")",
      ),

    /* ============== protocol ============== */

    protocol_declaration: ($) =>
      seq(
        "protocol",
        field("name", $.identifier),
        optional(seq("implements", field("super", $._type_expression))),
        "{",
        repeat($._protocol_item),
        "}",
      ),

    _protocol_item: ($) =>
      choice(
        $.state_declaration,
        $.effect_declaration,
        $.function_declaration,
        $.slash_on_declaration,
      ),

    slash_on_declaration: ($) =>
      seq(
        "slash_on",
        field("evidence", $.identifier),
        "{",
        repeat(seq($.identifier, ":", $._type_expression, optional(","))),
        "}",
        optional(seq("when", field("when", $._expression))),
        optional(seq("penalty", field("penalty", $._expression))),
      ),

    /* ============== effects ============== */

    effect_declaration: ($) =>
      seq(
        "effect",
        field("name", $.identifier),
        "(",
        optional($._param_list),
        ")",
        optional(seq("->", field("return_type", $._type_expression))),
        optional("deferred"),
      ),

    /* ============== functions ============== */

    function_declaration: ($) =>
      seq(
        optional(field("modifier", choice("pure", "view"))),
        "fn",
        field("name", $.identifier),
        "(",
        optional($._param_list),
        ")",
        optional(seq("->", field("return_type", $._type_expression))),
        optional(
          seq(
            "with",
            "[",
            optional(commaSep1($.identifier)),
            "]",
          ),
        ),
        field("body", $.block),
      ),

    _param_list: ($) => commaSep1($.parameter),

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $._type_expression)),

    /* ============== types ============== */

    _type_expression: ($) => choice($.named_type, $.generic_type),

    named_type: ($) => $.identifier,

    generic_type: ($) =>
      prec(
        1,
        seq(
          field("name", $.identifier),
          "<",
          optional(commaSep1Trailing($.type_parameter)),
          ">",
        ),
      ),

    type_parameter: ($) =>
      seq(
        optional(seq(field("key", $.identifier), "=")),
        field("value", $._type_param_value),
      ),

    _type_param_value: ($) =>
      choice(
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.set_literal,
      ),

    set_literal: ($) =>
      seq("{", optional(commaSep1Trailing($._type_param_value)), "}"),

    /* ============== statements ============== */

    /* A block is a sequence of statements wrapped in braces. The
     * "trailing expression is the block's return value" rule is a
     * semantic decision applied at parse / type-check time on the last
     * expression_statement; the grammar does not encode it. This keeps
     * tree-sitter unambiguous. */
    block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.let_statement,
        $.return_statement,
        $.if_statement,
        $.match_statement,
        $.expression_statement,
      ),

    let_statement: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        optional(seq(":", field("type", $._type_expression))),
        "=",
        field("value", $._expression),
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional(field("value", $._expression)))),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        field("consequence", $.block),
        optional(
          seq("else", field("alternative", choice($.block, $.if_statement))),
        ),
      ),

    match_statement: ($) =>
      seq(
        "match",
        field("scrutinee", $._expression),
        "{",
        repeat($.match_arm),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", $._expression),
        "=>",
        field("body", $._expression),
        optional(","),
      ),

    expression_statement: ($) => $._expression,

    /* ============== expressions ============== */

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.call_expression,
        $.index_expression,
        $.member_expression,
        $.path_expression,
        $.percent_expression,
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.char_literal,
        $.boolean_literal,
        $.null_literal,
        $.block,
        seq("(", $._expression, ")"),
      ),

    binary_expression: ($) => {
      const table = [
        [10, choice("*", "/")],
        [9, choice("+", "-")],
        [8, choice("==", "!=", "<", ">", "<=", ">=")],
        [7, "&&"],
        [6, "||"],
        [5, "="],
      ];
      // Note: the dynamic build below is hostile to static type tracking;
      // we use raw priorities instead.
      return choice(
        ...table.map(([prio, op]) =>
          prec.left(
            prio,
            seq(
              field("left", $._expression),
              // @ts-ignore
              field("operator", op),
              field("right", $._expression),
            ),
          ),
        ),
      );
    },

    unary_expression: ($) =>
      prec(11, seq(field("operator", choice("!", "-")), field("operand", $._expression))),

    call_expression: ($) =>
      prec(
        12,
        seq(
          field("callee", $._expression),
          "(",
          optional(commaSep1($._expression)),
          ")",
        ),
      ),

    index_expression: ($) =>
      prec(
        12,
        seq(field("array", $._expression), "[", field("index", $._expression), "]"),
      ),

    member_expression: ($) =>
      prec.left(
        13,
        seq(field("object", $._expression), ".", field("property", $.identifier)),
      ),

    path_expression: ($) =>
      prec.left(
        13,
        seq(field("scope", $.identifier), "::", field("name", $.identifier)),
      ),

    percent_expression: ($) =>
      prec(11, seq(field("value", $.number_literal), "%")),

    /* ============== terminals ============== */

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number_literal: ($) =>
      token(
        choice(
          /0[xX][0-9a-fA-F_]+/,
          /0[bB][01_]+/,
          /[0-9][0-9_]*/,
        ),
      ),

    string_literal: ($) =>
      token(
        seq(
          '"',
          repeat(choice(/[^"\\\n]+/, /\\./)),
          '"',
        ),
      ),

    char_literal: ($) =>
      token(seq("'", choice(/[^'\\]/, /\\./), "'")),

    boolean_literal: ($) => choice("true", "false"),

    null_literal: ($) => "null",

    line_comment: ($) => token(seq("//", /.*/)),

    block_comment: ($) =>
      token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep1Trailing(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
