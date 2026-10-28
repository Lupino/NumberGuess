const DIFFICULTIES = [
  { id: 'easy', name: '简单', limit: 12 },
  { id: 'classic', name: '经典', limit: 8 },
  { id: 'hard', name: '困难', limit: 6 }
];

function validGuess(value) {
  return typeof value === 'string' && /^\d{4}$/.test(value) && new Set(value).size === 4;
}

function generateAnswer(random = Math.random) {
  const digits = '0123456789'.split('');
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4).join('');
}

function score(answer, guess) {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 4; i++) {
    if (answer[i] === guess[i]) a++;
    else if (answer.includes(guess[i])) b++;
  }
  return { a, b };
}

function createGame(difficulty = 'classic', answer = generateAnswer()) {
  if (!DIFFICULTIES.some(item => item.id === difficulty) || !validGuess(answer)) {
    throw new Error('无效的对局设置');
  }
  return { difficulty, answer, guesses: [], status: 'playing' };
}

function submit(game, guess) {
  if (game.status !== 'playing') return { error: '本局已结束，请再来一局' };
  if (!validGuess(guess)) return { error: '请输入 4 个不重复的数字' };
  const result = score(game.answer, guess);
  const guesses = game.guesses.concat({ guess, ...result });
  const limit = DIFFICULTIES.find(item => item.id === game.difficulty).limit;
  return { game: { ...game, guesses, status: result.a === 4 ? 'won' : guesses.length >= limit ? 'lost' : 'playing' } };
}

function emptyStats() {
  return Object.fromEntries(DIFFICULTIES.map(item => [item.id, { completed: 0, wins: 0, best: null }]));
}

function newState() {
  return { version: 1, game: createGame(), stats: emptyStats() };
}

// The game and its statistics are saved together: an ended game cannot be counted twice.
function applyGuess(state, guess) {
  const result = submit(state.game, guess);
  if (result.error) return result;
  const stats = { ...state.stats };
  if (result.game.status !== 'playing') {
    const item = { ...stats[result.game.difficulty] };
    item.completed++;
    if (result.game.status === 'won') {
      item.wins++;
      item.best = item.best === null ? result.game.guesses.length : Math.min(item.best, result.game.guesses.length);
    }
    stats[result.game.difficulty] = item;
  }
  return { state: { ...state, game: result.game, stats } };
}

function validState(state) {
  try {
    if (!state || state.version !== 1 || !state.stats) return false;
    const game = state.game;
    if (!Array.isArray(game.guesses)) return false;
    let replay = createGame(game.difficulty, game.answer);
    for (const row of game.guesses) {
      const next = submit(replay, row.guess);
      if (next.error) return false;
      replay = next.game;
      const last = replay.guesses[replay.guesses.length - 1];
      if (last.a !== row.a || last.b !== row.b) return false;
    }
    if (replay.status !== game.status) return false;
    return DIFFICULTIES.every(({ id, limit }) => {
      const item = state.stats[id];
      return item && Number.isSafeInteger(item.completed) && Number.isSafeInteger(item.wins)
        && item.completed >= item.wins && item.wins >= 0
        && (item.wins === 0 ? item.best === null : Number.isInteger(item.best) && item.best >= 1 && item.best <= limit);
    });
  } catch (_) {
    return false;
  }
}

module.exports = { DIFFICULTIES, validGuess, generateAnswer, score, createGame, submit, emptyStats, newState, applyGuess, validState };
