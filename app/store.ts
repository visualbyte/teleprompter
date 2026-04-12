// Module-level store to share script text between screens
// Avoids URL param length limitations that cause text cutoff in player

const DEFAULT_SCRIPT =
  "Good evening, world. Tonight we rewrite history—or at least, tonight's dinner order. Stay with me";

let _scriptText = DEFAULT_SCRIPT;
let _speed = 1;

export const store = {
  getScript: () => _scriptText,
  setScript: (text: string) => {
    _scriptText = text;
  },
  getSpeed: () => _speed,
  setSpeed: (speed: number) => {
    _speed = speed;
  },
  DEFAULT_SCRIPT,
};
