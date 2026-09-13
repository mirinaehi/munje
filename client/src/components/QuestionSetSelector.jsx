export default function QuestionSetSelector({ questionSets, selectedId, onSelect }) {
  if (questionSets.length === 0) return null;

  return (
    <div className="set-selector" aria-label="문제 세트">
      {questionSets.map((questionSet) => (
        <button
          className={`set-chip ${selectedId === questionSet.id ? 'active' : ''}`}
          key={questionSet.id}
          onClick={() => onSelect(questionSet.id)}
          type="button"
        >
          <strong>{questionSet.title}</strong>
          <span>{questionSet.questionCount}문제</span>
        </button>
      ))}
    </div>
  );
}
