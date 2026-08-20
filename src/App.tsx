/**
 * The application shell. Every screen this project adds renders inside it.
 *
 * The shell is right-to-left and in Hebrew from the first screen rather than
 * translated later: `framing.md` settles the interface as Hebrew, and RTL
 * layouts break quietly when they are added at the end.
 */
export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">מעבר דירה</h1>
      </header>
      <main className="app__main">
        <p className="app__placeholder">השלד עומד. אין עדיין מסך.</p>
      </main>
    </div>
  )
}
