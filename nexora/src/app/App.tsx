import { useTheme } from '../hooks/useTheme';
import { Library } from '../components/library/Library';
import { CommandCenter } from '../components/command-center/CommandCenter';
import { Canvas } from '../components/canvas/Canvas';

function App() {
  // Wire theme: syncs `dark` class on <html> on mount and on every theme change.
  useTheme();

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{ gridTemplateColumns: 'var(--library-width) 1fr var(--canvas-width)' }}
    >
      {/* Library collapses on mobile (< 768px) */}
      <div className="hidden md:flex">
        <Library />
      </div>

      {/* CommandCenter is always visible; on mobile it fills the full width */}
      <CommandCenter />

      {/* Canvas collapses on mobile (< 768px) */}
      <div className="hidden md:flex">
        <Canvas />
      </div>
    </div>
  );
}

export default App;
