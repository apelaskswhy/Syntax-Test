(function () {
  "use strict";

  const targets = {
    Python: 210,
    JavaScript: 190,
    HTML: 160,
    C: 100,
    "C++": 110,
    Java: 115,
    PHP: 115
  };

  const lists = {
    Python: [
      "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
      "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is",
      "lambda", "match", "case", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with",
      "yield", "abs", "aiter", "all", "anext", "any", "ascii", "bin", "bool", "breakpoint", "bytearray",
      "bytes", "callable", "chr", "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod",
      "enumerate", "eval", "exec", "filter", "float", "format", "frozenset", "getattr", "globals", "hasattr",
      "hash", "help", "hex", "id", "input", "int", "isinstance", "issubclass", "iter", "len", "list",
      "locals", "map", "max", "memoryview", "min", "next", "object", "oct", "open", "ord", "pow", "print",
      "property", "range", "repr", "reversed", "round", "set", "setattr", "slice", "sorted", "staticmethod",
      "str", "sum", "super", "tuple", "type", "vars", "zip", "append", "extend", "insert", "remove", "pop",
      "clear", "index", "count", "sort", "reverse", "copy", "get", "items", "keys", "values", "update",
      "setdefault", "add", "discard", "difference", "intersection", "union", "issubset", "issuperset",
      "capitalize", "casefold", "center", "encode", "endswith", "expandtabs", "find", "isalnum", "isalpha",
      "isascii", "isdecimal", "isdigit", "isidentifier", "islower", "isnumeric", "isprintable", "isspace",
      "istitle", "isupper", "join", "ljust", "lower", "lstrip", "partition", "replace", "rfind", "rindex",
      "rjust", "rpartition", "rsplit", "rstrip", "split", "splitlines", "startswith", "strip", "swapcase",
      "title", "translate", "upper", "zfill", "read", "readline", "readlines", "write", "writelines", "seek",
      "tell", "flush", "close", "loads", "dumps", "load", "dump", "compile", "search", "findall", "finditer",
      "sub", "escape", "ceil", "floor", "sqrt", "sin", "cos", "tan", "log", "log10", "factorial", "gcd",
      "randint", "randrange", "choice", "choices", "shuffle", "sample", "seed", "exists", "mkdir", "unlink",
      "rename", "glob", "date", "time", "datetime", "timedelta", "timezone", "now", "today", "count", "cycle",
      "repeat", "chain", "combinations", "permutations", "product", "reduce", "partial", "Counter", "deque",
      "defaultdict", "namedtuple", "Queue", "Thread", "Process", "Path", "Exception", "ValueError", "TypeError",
      "IndexError", "KeyError", "NameError", "SyntaxError", "ZeroDivisionError"
    ],

    JavaScript: [
      "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else",
      "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new",
      "return", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield",
      "async", "await", "static", "of", "get", "set", "null", "true", "false", "undefined", "NaN", "Infinity",
      "console", "log", "warn", "error", "table", "prompt", "alert", "confirm", "parseInt", "parseFloat",
      "Number", "String", "Boolean", "Array", "Object", "Date", "Math", "JSON", "Promise", "Map", "Set",
      "Symbol", "BigInt", "RegExp", "Error", "TypeError", "fetch", "setTimeout", "clearTimeout", "setInterval",
      "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "isNaN", "isFinite", "encodeURI",
      "decodeURI", "append", "push", "pop", "shift", "unshift", "slice", "splice", "join", "includes", "map",
      "filter", "find", "findIndex", "forEach", "reduce", "sort", "reverse", "concat", "flat", "fill", "some",
      "every", "at", "keys", "values", "entries", "length", "toLowerCase", "toUpperCase", "trim", "split",
      "replace", "replaceAll", "startsWith", "endsWith", "substring", "charAt", "repeat", "padStart", "padEnd",
      "assign", "create", "freeze", "fromEntries", "hasOwn", "abs", "ceil", "floor", "round", "max", "min",
      "random", "sqrt", "pow", "trunc", "sign", "parse", "stringify", "resolve", "reject", "race", "all",
      "querySelector", "querySelectorAll", "getElementById", "createElement", "addEventListener", "removeEventListener",
      "preventDefault", "stopPropagation", "target", "value", "textContent", "innerHTML", "classList", "dataset",
      "style", "appendChild", "removeChild", "replaceChildren", "closest", "parentElement", "children", "localStorage",
      "sessionStorage", "setItem", "getItem", "removeItem", "click", "submit", "input", "change", "keydown",
      "keyup", "load", "DOMContentLoaded", "window", "document", "navigator", "location", "history", "body",
      "head", "prototype", "constructor", "module", "require", "exports", "WeakMap", "WeakSet", "Proxy",
      "Reflect", "Intl", "URL", "URLSearchParams", "Blob", "File", "FormData", "Headers", "Request",
      "Response", "AbortController", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "NodeList",
      "HTMLElement"
    ],

    HTML: [
      "doctype", "html", "head", "body", "title", "meta", "link", "style", "script", "base", "noscript",
      "template", "slot", "header", "nav", "main", "section", "article", "aside", "footer", "div", "span",
      "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "picture", "source", "figure",
      "figcaption", "strong", "em", "b", "i", "u", "mark", "small", "code", "pre", "blockquote", "q", "cite",
      "abbr", "time", "data", "kbd", "samp", "var", "sub", "sup", "ul", "ol", "li", "dl", "dt", "dd", "table",
      "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col", "form", "label", "input",
      "button", "select", "option", "optgroup", "textarea", "fieldset", "legend", "output", "progress", "meter",
      "details", "summary", "dialog", "audio", "video", "track", "iframe", "embed", "object", "param", "canvas",
      "svg", "math", "id", "class", "style", "lang", "dir", "hidden", "tabindex", "data", "role", "href",
      "target", "rel", "download", "src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding",
      "action", "method", "name", "value", "type", "placeholder", "required", "disabled", "readonly", "checked",
      "selected", "multiple", "min", "max", "step", "maxlength", "minlength", "pattern", "for", "autocomplete",
      "autofocus", "controls", "autoplay", "loop", "muted", "poster", "preload", "colspan", "rowspan", "scope",
      "headers", "charset", "viewport", "content", "http", "defer", "async", "text", "email", "password",
      "number", "date", "time", "file", "checkbox", "radio", "submit", "reset", "range", "search", "url",
      "tel", "color", "hidden", "aria", "label", "expanded", "pressed", "describedby", "current", "controls"
    ],

    C: [
      "auto", "break", "case", "char", "const", "continue", "default", "do", "double", "else", "enum",
      "extern", "float", "for", "goto", "if", "inline", "int", "long", "register", "restrict", "return",
      "short", "signed", "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned", "void",
      "volatile", "while", "include", "define", "undef", "ifdef", "ifndef", "endif", "printf", "scanf",
      "fprintf", "fscanf", "sprintf", "snprintf", "puts", "putchar", "getchar", "fopen", "fclose", "fread",
      "fwrite", "fgets", "fputs", "fseek", "ftell", "rewind", "fflush", "malloc", "calloc", "realloc", "free",
      "exit", "abort", "qsort", "bsearch", "atoi", "atol", "strtol", "strtod", "rand", "srand", "memcpy",
      "memmove", "memset", "memcmp", "strlen", "strcpy", "strncpy", "strcat", "strcmp", "strncmp", "strchr",
      "strstr", "strtok", "sqrt", "pow", "sin", "cos", "tan", "ceil", "floor", "abs", "tolower", "toupper"
      , "isalpha", "isdigit", "isalnum", "isspace", "isupper", "islower", "time", "clock", "FILE", "NULL",
      "EOF", "main"
    ],

    "C++": [
      "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand", "bitor", "bool", "break", "case",
      "catch", "char", "char16_t", "char32_t", "class", "compl", "concept", "const", "constexpr", "continue",
      "decltype", "default", "delete", "do", "double", "dynamic_cast", "else", "enum", "explicit", "export",
      "extern", "false", "float", "for", "friend", "goto", "if", "inline", "int", "long", "mutable",
      "namespace", "new", "noexcept", "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
      "protected", "public", "register", "reinterpret_cast", "requires", "return", "short", "signed", "sizeof",
      "static", "static_assert", "static_cast", "struct", "switch", "template", "this", "throw", "true", "try",
      "typedef", "typeid", "typename", "union", "unsigned", "using", "virtual", "void", "volatile", "wchar_t",
      "while", "xor", "xor_eq", "cout", "cin", "cerr", "endl", "string", "vector", "array", "deque", "list",
      "map", "set", "stack", "queue", "pair", "tuple", "optional", "variant", "unique_ptr", "shared_ptr",
      "push_back", "pop_back", "size", "empty", "clear", "insert", "erase", "begin", "end", "front", "back",
      "sort", "find", "reverse", "swap"
    ],

    Java: [
      "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue",
      "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if",
      "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "package", "private",
      "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this",
      "throw", "throws", "transient", "try", "void", "volatile", "while", "true", "false", "null", "var",
      "record", "sealed", "permits", "System", "out", "println", "print", "Scanner", "String", "Integer",
      "Double", "Math", "ArrayList", "HashMap", "Arrays", "Collections", "length", "charAt", "substring",
      "toLowerCase", "toUpperCase", "trim", "contains", "startsWith", "endsWith", "replace", "split", "equals",
      "indexOf", "add", "get", "set", "remove", "size", "isEmpty", "clear", "sort", "toString", "valueOf",
      "parseInt", "parseDouble", "random", "round", "max", "min", "sqrt", "put", "keySet", "values", "main",
      "args", "Override", "Deprecated", "FunctionalInterface", "Object", "Exception", "RuntimeException",
      "IOException", "File", "Reader", "Writer", "BufferedReader", "List", "Map", "Set"
    ],

    PHP: [
      "abstract", "and", "array", "as", "break", "callable", "case", "catch", "class", "clone", "const",
      "continue", "declare", "default", "die", "do", "echo", "else", "elseif", "empty", "endfor", "endforeach",
      "endif", "endswitch", "endwhile", "eval", "exit", "extends", "final", "finally", "fn", "for", "foreach",
      "function", "global", "goto", "if", "implements", "include", "include_once", "instanceof", "interface",
      "isset", "list", "match", "namespace", "new", "or", "print", "private", "protected", "public", "require",
      "require_once", "return", "static", "switch", "throw", "trait", "try", "unset", "use", "var", "while",
      "xor", "yield", "true", "false", "null", "GET", "POST", "REQUEST", "SERVER", "SESSION", "COOKIE",
      "FILES", "GLOBALS", "strlen", "strpos", "substr", "str_replace", "strtolower", "strtoupper", "trim",
      "explode", "implode", "sprintf", "printf", "htmlspecialchars", "strip_tags", "password_hash",
      "password_verify", "preg_match", "preg_replace", "json_encode", "json_decode", "array_key_exists",
      "array_keys", "array_values", "array_map", "array_filter", "array_merge", "array_push", "array_pop",
      "sort", "rsort", "in_array", "count", "is_array", "is_string", "var_dump", "print_r", "file_get_contents"
      , "file_put_contents", "fopen", "fclose", "fread", "fwrite", "session_start", "setcookie", "header"
    ]
  };

  const bank = [];

  Object.entries(targets).forEach(([language, target]) => {
    const keywords = Array.from(new Set(lists[language]));

    if (keywords.length < target) {
      throw new Error(`${language} hanya memiliki ${keywords.length} keyword, target ${target}`);
    }

    keywords.slice(0, target).forEach((keyword, index) => {
      bank.push({
        id: `${language.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(index + 1).padStart(3, "0")}`,
        language,
        keyword
      });
    });
  });

  if (bank.length !== 1000) {
    throw new Error(`Bank keyword harus 1000 item, sekarang ${bank.length}`);
  }

  window.SYNTAX_BANK = bank;
})();
