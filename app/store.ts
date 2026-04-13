// Module-level store to share script text between screens
// Avoids URL param length limitations that cause text cutoff in player

const DEFAULT_SCRIPT =
  "Good evening, world. Tonight we rewrite history—or at least, tonight's dinner order. Stay with me";

let _scriptText = DEFAULT_SCRIPT;
let _speed = 1;
let _completedRun = false;
let _darkMode = false;
let _autoRotate = false;

export const store = {
  getScript: () => _scriptText,
  setScript: (text: string) => { _scriptText = text; },
  getSpeed: () => _speed,
  setSpeed: (speed: number) => { _speed = speed; },
  // Called by player on natural end (not manual return).
  // takeCompletedRun reads and clears in one shot so the editor only fires once.
  setCompletedRun: () => { _completedRun = true; },
  takeCompletedRun: () => { const v = _completedRun; _completedRun = false; return v; },
  getDarkMode: () => _darkMode,
  setDarkMode: (v: boolean) => { _darkMode = v; },
  getAutoRotate: () => _autoRotate,
  setAutoRotate: (v: boolean) => { _autoRotate = v; },
  DEFAULT_SCRIPT,
};
