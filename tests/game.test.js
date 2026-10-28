const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../minigame/utils/game');
const initial = (id = 'classic') => ({ version: 1, game: g.createGame(id, '0123'), stats: g.emptyStats() });

test('答案生成、前导零和输入校验', () => {
  for (let i = 0; i < 1000; i++) assert.ok(g.validGuess(g.generateAnswer()));
  assert.equal(g.generateAnswer(() => 0.999), '0123');
  for (const value of ['', '012', '01234', '0012', 'abcd', '-123', ' 123', 1234]) assert.equal(g.validGuess(value), false);
  assert.ok(g.validGuess('0123'));
});
test('A/B 判定', () => {
  for (const [guess, a, b] of [['0123', 4, 0], ['0214', 1, 2], ['3210', 0, 4], ['4567', 0, 0]]) assert.deepEqual(g.score('0123', guess), { a, b });
});
test('各难度限制、无效输入和输局统计', () => {
  for (const { id, limit } of g.DIFFICULTIES) {
    let state = initial(id);
    assert.ok(g.applyGuess(state, '1111').error);
    assert.equal(state.game.guesses.length, 0);
    for (let i = 0; i < limit; i++) {
      state = g.applyGuess(state, '4567').state;
      assert.equal(state.game.status, i === limit - 1 ? 'lost' : 'playing');
    }
    assert.deepEqual(state.stats[id], { completed: 1, wins: 0, best: null });
    assert.ok(g.applyGuess(state, '0123').error);
    assert.ok(g.validState(JSON.parse(JSON.stringify(state))));
  }
});
test('最后一次猜中、战绩去重、最佳成绩和放弃重开', () => {
  for (const { id, limit } of g.DIFFICULTIES) {
    let state = initial(id);
    for (let i = 1; i < limit; i++) state = g.applyGuess(state, '4567').state;
    state = g.applyGuess(state, '0123').state;
    assert.equal(state.game.status, 'won');
    assert.deepEqual(state.stats[id], { completed: 1, wins: 1, best: limit });
    assert.ok(g.applyGuess(state, '0123').error);
    state = { ...state, game: g.createGame(id, '0123') };
    state = g.applyGuess(state, '4567').state;
    state = { ...state, game: g.createGame(id, '0123') };
    assert.equal(state.stats[id].completed, 1);
    state = g.applyGuess(state, '0123').state;
    assert.deepEqual(state.stats[id], { completed: 2, wins: 2, best: 1 });
    assert.ok(g.validState(state));
    state = { ...state, stats: g.emptyStats() };
    assert.ok(g.validState(state));
    assert.ok(g.applyGuess(state, '0123').error);
  }
});
test('恢复时拒绝损坏或不一致的数据', () => {
  assert.equal(g.validState(null), false);
  assert.ok(g.validState(initial()));
  for (const mutate of [s => { s.version = 2; }, s => { s.game.answer = '0000'; }, s => { s.game.status = 'won'; }, s => { s.stats.easy.wins = -1; }, s => { s.game.guesses = [{ guess: '0123', a: 9, b: 0 }]; }]) {
    const state = initial();
    mutate(state);
    assert.equal(g.validState(state), false);
  }
});
test('本机存储恢复、损坏重置和失败提示', () => {
  const storage = require('../minigame/utils/storage');
  let saved;
  const messages = [];
  global.wx = { getStorageSync: () => saved, setStorageSync: (_, value) => { saved = JSON.parse(JSON.stringify(value)); }, showToast: ({ title }) => messages.push(title) };
  try {
    const state = g.applyGuess(initial(), '0214').state;
    assert.ok(storage.save(state));
    assert.deepEqual(storage.load(), state);
    saved = { broken: true };
    assert.ok(g.validState(storage.load()));
    assert.equal(messages.pop(), '本机数据异常，已重置');
    wx.setStorageSync = () => { throw new Error('full'); };
    assert.equal(storage.save(state), false);
    assert.equal(messages.pop(), '保存失败，请检查存储空间');
  } finally { delete global.wx; }
});
