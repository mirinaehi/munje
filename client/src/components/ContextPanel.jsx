import CodeBlock from './CodeBlock.jsx';

export default function ContextPanel({ context }) {
  if (!context) return null;

  return (
    <section className="context-panel" aria-label="공통 지문">
      <div className="context-header">
        <p className="eyebrow">{getContextTypeLabel(context.type)}</p>
        <h2>{context.title}</h2>
      </div>
      <ContextBody context={context} />
    </section>
  );
}

function ContextBody({ context }) {
  if (context.type === 'code') {
    return <CodeBlock className="context-code" language={context.language}>{context.content}</CodeBlock>;
  }

  if (context.type === 'database-schema') {
    return (
      <div className="schema-grid">
        {context.tables.map((table) => (
          <div className="schema-table" key={table.name}>
            <strong>{table.name}</strong>
            <ul>
              {table.columns.map((column) => <li key={column}>{column}</li>)}
            </ul>
          </div>
        ))}
        <div className="relationships">
          <strong>관계</strong>
          {context.relationships.map((relationship) => <span key={relationship}>{relationship}</span>)}
        </div>
      </div>
    );
  }

  return <p className="context-text">{context.content}</p>;
}

function getContextTypeLabel(type) {
  const labels = {
    code: 'CODE CONTEXT',
    'database-schema': 'DATABASE CONTEXT',
    text: 'TEXT CONTEXT',
  };

  return labels[type] ?? 'CONTEXT';
}
