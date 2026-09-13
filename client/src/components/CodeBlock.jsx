const tokenPatterns = [
  { type: 'comment', pattern: /^\/\/.*/ },
  { type: 'string', pattern: /^`(?:\\.|[^`])*`/ },
  { type: 'string', pattern: /^"(?:\\.|[^"])*"/ },
  { type: 'string', pattern: /^'(?:\\.|[^'])*'/ },
  { type: 'number', pattern: /^\b\d+(?:\.\d+)?\b/ },
  {
    type: 'keyword',
    pattern: /^\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|null|undefined|true|false|SELECT|FROM|WHERE|IN|AND|OR|ORDER|BY|GROUP|HAVING|JOIN|INNER|LEFT|RIGHT|ON|AS)\b/i,
  },
  { type: 'operator', pattern: /^(?:=>|\?\?|\|\||&&|===|!==|==|!=|>=|<=|[{}()[\].,;:+\-*/=<>?])/ },
  { type: 'identifier', pattern: /^\b[A-Za-z_$][\w$]*\b/ },
  { type: 'space', pattern: /^\s+/ },
];

export default function CodeBlock({ children, className = '', language }) {
  const code = String(children ?? '');

  return (
    <pre className={`code-surface ${className}`}>
      <code data-language={language}>{tokenize(code).map(renderToken)}</code>
    </pre>
  );
}

function tokenize(code) {
  const tokens = [];
  let remaining = code;

  while (remaining.length > 0) {
    const match = tokenPatterns
      .map((tokenPattern) => ({ ...tokenPattern, match: remaining.match(tokenPattern.pattern) }))
      .find((tokenPattern) => tokenPattern.match);

    if (!match) {
      tokens.push({ type: 'plain', value: remaining[0] });
      remaining = remaining.slice(1);
      continue;
    }

    const value = match.match[0];
    tokens.push({ type: match.type, value });
    remaining = remaining.slice(value.length);
  }

  return tokens;
}

function renderToken(token, index) {
  if (token.type === 'space' || token.type === 'plain') {
    return token.value;
  }

  return (
    <span className={`syntax-${token.type}`} key={`${token.type}-${index}`}>
      {token.value}
    </span>
  );
}
