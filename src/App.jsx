import { useState } from 'react';
import StrudelPlayer from './StrudelPlayer';
import { PIECES } from './pieces';

export default function App() {
  const [selectedId, setSelectedId] = useState(PIECES[0]?.id ?? null);
  const selected = PIECES.find((p) => p.id === selectedId) ?? null;

  return (
    <div>
      <h1>Strudel archive</h1>

      <ul>
        {PIECES.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setSelectedId(p.id)}
              disabled={p.id === selectedId}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div>
          <h2>{selected.name}</h2>
          <StrudelPlayer code={selected.code} />
          <pre style={{ overflowX: 'auto' }}>{selected.code}</pre>
        </div>
      )}
    </div>
  );
}
