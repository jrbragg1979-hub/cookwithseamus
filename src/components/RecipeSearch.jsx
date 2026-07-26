import React, { useState, useEffect } from 'react';
import './RecipeSearch.css';

// Falls back to localhost in dev, Railway in prod. Override with PUBLIC_API_URL env var if needed.
const API_URL = import.meta.env.PUBLIC_API_URL
  || (import.meta.env.DEV ? 'http://localhost:3002' : 'https://seamus-app-production.up.railway.app');

const PLACEHOLDERS = [
  "a refreshing drink for a hot day...",
  "something with what's in my fridge...",
  "gluten-free birthday cake...",
  "kefir...",
  "vegetarian dinner tonight...",
  "quick lunch under 20 minutes...",
  "impressive dessert for guests...",
  "beer...",
];

const SEAMUS_QUIPS = [
  "Reaching for me apron...",
  "Rolling up me sleeves...",
  "Wiping me hands on the apron...",
  "Sharpening me knives...",
  "Rummaging through the pantry...",
  "Weighing the flour...",
  "Peering into the spice rack...",
  "Chopping onions in me head...",
  "Grabbing the good wooden spoon...",
  "Warming up the ovens...",
  "Whistling as I work...",
  "Muttering to meself...",
  "Simmering on it...",
  "Considering your options...",
  "Tasting a bite in me imagination...",
  "Fussing over the details...",
  "Consulting me nan's recipes...",
  "Squinting at me handwriting...",
  "Gesticulating...",
];

const PILLS_LEFT = [
  { label: 'Try:', text: '"a hearty vegan stew"', query: 'a hearty vegan stew' },
  { label: 'Try:', text: '"I have an eggplant and no idea what to do with it"', query: 'I have an eggplant and have no idea what to do with it' },
  { label: 'Try:', text: '"beer"', query: 'beer' },
];

const PILLS_RIGHT = [
  { label: 'Try:', text: '"chocolate chip cookies without gluten"', query: 'chocolate chip cookies without gluten' },
  { label: 'Try:', text: '"What goes well with ribs?"', query: 'What goes well with ribs?' },
  { label: 'Try:', text: '"burgers"', query: 'burgers' },
];

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.synergyautomations.seamus';

function ChalkboardInput({ query, setQuery, placeholder, onSubmit, disabled }) {
  return (
    <form className="rs-chalkboard" onSubmit={onSubmit}>
      <div className="rs-chalk-frame">
        <h2 className="rs-chalk-heading">What do you want to cook?</h2>
        <input
          type="text"
          className="rs-chalk-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
        <button type="submit" className="rs-chalk-submit" disabled={disabled || !query.trim()}>
          Ask Seamus
        </button>
      </div>
    </form>
  );
}

function LoadingView({ quip }) {
  return (
    <div className="rs-loading">
      <img src="/wink-logo.jpg" alt="" className="rs-loading-chef" aria-hidden="true" />
      <p className="rs-loading-text">Seamus is thinking…</p>
      <p className="rs-loading-sub">{quip}</p>
    </div>
  );
}

function ClarifyingView({ intro, questions, onSubmit, onStartOver, submitting }) {
  const [answers, setAnswers] = useState(() => questions.map(() => ({ value: '', custom: '' })));

  const setAnswer = (idx, value, isCustom = false) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = isCustom ? { value: '', custom: value } : { value, custom: '' };
      return next;
    });
  };

  const canSubmit = answers.every((a) => (a.value || a.custom.trim()).length > 0);

  const handleSubmit = () => {
    const clarifications = questions.map((q, i) => ({
      question: q.question,
      answer: answers[i].value || answers[i].custom.trim(),
    }));
    onSubmit(clarifications);
  };

  return (
    <div className="rs-clarify">
      <button
        type="button"
        className="rs-clarify-startover"
        onClick={onStartOver}
        disabled={submitting}
      >
        ← Start over with a new search
      </button>
      <p className="rs-clarify-intro">{intro}</p>
      {questions.map((q, qi) => (
        <div key={qi} className="rs-clarify-question">
          <p className="rs-clarify-prompt">{q.question}</p>
          <div className="rs-clarify-options">
            {(q.options || []).map((opt, oi) => (
              <button
                key={oi}
                type="button"
                className={`rs-clarify-chip ${answers[qi].value === opt ? 'selected' : ''}`}
                onClick={() => setAnswer(qi, opt)}
                disabled={submitting}
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="rs-clarify-custom"
            placeholder="Or something else..."
            value={answers[qi].custom}
            onChange={(e) => setAnswer(qi, e.target.value, true)}
            disabled={submitting}
          />
        </div>
      ))}
      <button
        type="button"
        className="rs-clarify-submit"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        {submitting ? 'Writing your recipe…' : 'Write me the recipe'}
      </button>
    </div>
  );
}

function RecipeView({ recipe, onSearchAgain }) {
  return (
    <article className="rs-recipe-card">
      <h1 className="rs-recipe-title">{recipe.name}</h1>
      {recipe.intro && <p className="rs-recipe-intro">{recipe.intro}</p>}

      {recipe.ingredients?.length > 0 && (
        <section className="rs-recipe-section">
          <h2 className="rs-recipe-section-title">Ingredients</h2>
          <ul className="rs-recipe-ingredients">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps?.length > 0 && (
        <section className="rs-recipe-section">
          <h2 className="rs-recipe-section-title">Method</h2>
          <ol className="rs-recipe-steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {recipe.outro && <p className="rs-recipe-outro">{recipe.outro}</p>}

      <div className="rs-recipe-cta">
        <p className="rs-recipe-cta-text">
          Want to save this, get a shopping list, or have Seamus walk you through cooking it?
        </p>
        <a href={GOOGLE_PLAY_URL} className="rs-recipe-install-btn" target="_blank" rel="noopener noreferrer">
          Install the free app
        </a>
        <button type="button" className="rs-recipe-again-btn" onClick={onSearchAgain}>
          Or try another recipe
        </button>
      </div>
    </article>
  );
}

function ErrorView({ error, onSearchAgain }) {
  return (
    <div className="rs-error">
      <p className="rs-error-title">Something went sideways.</p>
      <p className="rs-error-detail">{error}</p>
      <button type="button" className="rs-error-back" onClick={onSearchAgain}>
        Try again
      </button>
    </div>
  );
}

function PillsColumn({ pills, onPillClick, disabled, side }) {
  return (
    <div className={`rs-pills rs-pills-${side}`}>
      {pills.map((pill, i) => (
        <button
          key={i}
          type="button"
          className="rs-pill"
          onClick={() => onPillClick(pill.query)}
          disabled={disabled}
        >
          <span className="rs-pill-label">{pill.label}</span>
          <span className="rs-pill-text">{pill.text}</span>
        </button>
      ))}
    </div>
  );
}

export default function RecipeSearch() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'loading' | 'clarifying' | 'ready' | 'error'
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [intro, setIntro] = useState('');
  const [questions, setQuestions] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [quip, setQuip] = useState(SEAMUS_QUIPS[0]);

  // Rotate placeholder in idle state
  useEffect(() => {
    if (phase !== 'idle') return;
    let idx = Math.floor(Math.random() * PLACEHOLDERS.length);
    setPlaceholder(PLACEHOLDERS[idx]);
    const interval = setInterval(() => {
      idx = (idx + 1) % PLACEHOLDERS.length;
      setPlaceholder(PLACEHOLDERS[idx]);
    }, 3200);
    return () => clearInterval(interval);
  }, [phase]);

  const runSearch = async (searchQuery, clarifications) => {
    // Pick a fresh quip for every load
    setQuip(SEAMUS_QUIPS[Math.floor(Math.random() * SEAMUS_QUIPS.length)]);
    setPhase('loading');
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/recipe-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, clarifications }),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `Server returned ${resp.status}`);
      }
      const data = await resp.json();
      if (data.needs_clarification) {
        setIntro(data.intro || '');
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setPhase('clarifying');
      } else if (data.recipe) {
        setRecipe(data.recipe);
        setPhase('ready');
      } else {
        throw new Error('Unexpected response from recipe server.');
      }
    } catch (err) {
      console.error('Recipe search failed:', err);
      setError(err.message || 'Something went wrong.');
      setPhase('error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    runSearch(query.trim(), undefined);
  };

  const handlePillClick = (pillQuery) => {
    setQuery(pillQuery);
    runSearch(pillQuery, undefined);
  };

  const handleClarificationSubmit = (clarifications) => {
    runSearch(query.trim(), clarifications);
  };

  const handleSearchAgain = () => {
    setPhase('idle');
    setQuery('');
    setRecipe(null);
    setIntro('');
    setQuestions([]);
    setError(null);
  };

  // Idle: chalkboard with flanking pills (same layout as the previous static version)
  if (phase === 'idle') {
    return (
      <div className="rs-widget rs-widget-idle">
        <div className="rs-chalkboard-wrap">
          <PillsColumn pills={PILLS_LEFT} onPillClick={handlePillClick} disabled={false} side="left" />
          <ChalkboardInput
            query={query}
            setQuery={setQuery}
            placeholder={placeholder}
            onSubmit={handleSubmit}
            disabled={false}
          />
          <PillsColumn pills={PILLS_RIGHT} onPillClick={handlePillClick} disabled={false} side="right" />
        </div>
      </div>
    );
  }

  // Loading / Clarifying / Ready / Error: centered result area (no pills, chalkboard reappears on reset)
  return (
    <div className="rs-widget rs-widget-result">
      {phase === 'loading' && <LoadingView quip={quip} />}
      {phase === 'clarifying' && (
        <ClarifyingView
          intro={intro}
          questions={questions}
          onSubmit={handleClarificationSubmit}
          onStartOver={handleSearchAgain}
          submitting={false}
        />
      )}
      {phase === 'ready' && recipe && (
        <RecipeView recipe={recipe} onSearchAgain={handleSearchAgain} />
      )}
      {phase === 'error' && (
        <ErrorView error={error} onSearchAgain={handleSearchAgain} />
      )}
    </div>
  );
}
