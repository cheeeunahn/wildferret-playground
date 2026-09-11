// <strudel-repl> only reads its code once, in connectedCallback, so keying on
// the code forces a fresh element whenever the piece changes.
export default function StrudelPlayer({ code }) {
  return <strudel-repl key={code} code={code} />;
}
