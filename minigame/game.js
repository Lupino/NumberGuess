const { DIFFICULTIES } = require('./utils/game');
const storage = require('./utils/storage');
const Controller = require('./utils/controller');

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
const width = info.windowWidth;
const height = info.windowHeight;
const ratio = info.pixelRatio || 1;
canvas.width = Math.round(width * ratio);
canvas.height = Math.round(height * ratio);
const scale = width / 375;
const H = height / scale;
const safeTop = info.safeArea ? info.safeArea.top / scale : 24;
const safeBottom = info.safeArea ? Math.max(0, (height - info.safeArea.bottom) / scale) : 16;
// Fit short screens while keeping controls inside the safe area.
const top = Math.max(12, safeTop + 6);
let buttons = [];
let recordArea = null;
const colors = { ink: '#17243b', muted: '#7d8ba2', blue: '#4169e1', bg: '#f5f6fa' };

function box(x, y, w, h, fill, radius = 12) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function text(value, x, y, size = 14, color = colors.ink, align = 'left', bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}
function button(label, x, y, w, h, action, options = {}) {
  box(x, y, w, h, options.fill || '#edf1ff');
  text(label, x + w / 2, y + h / 2, options.size || 14, options.color || colors.blue, 'center', true);
  if (!options.disabled) buttons.push({ x, y, w, h, action });
}

const controller = new Controller(storage, wx, render);

function render() {
  ctx.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
  ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, 375, H);
  buttons = []; recordArea = null;
  if (controller.screen === 'stats') { renderStats(); return; }
  button('战绩 ↗', 278, top + 35, 77, 28, () => { controller.screen = 'stats'; render(); });
  text('经典猜数字游戏', 20, top + 49, 26, colors.ink, 'left', true);
  text('4 个不同数字，用线索接近答案', 20, top + 79, 13, colors.muted);
  const game = controller.state.game;
  const difficulty = DIFFICULTIES.find(item => item.id === game.difficulty);
  DIFFICULTIES.forEach((item, i) => button(`${item.name} · ${item.limit} 次`, 20 + i * 114, top + 101, 107, 37,
    () => { if (item.id !== game.difficulty) controller.restart(item.id); },
    { fill: item.id === game.difficulty ? '#172f62' : '#e8edf5', color: item.id === game.difficulty ? '#ffffff' : colors.muted }));

  const y = top + 151;
  box(20, y, 335, 164, '#ffffff', 16);
  text(game.status === 'won' ? '漂亮，猜中了！' : game.status === 'lost' ? '差一点，下局再战' : '这一局，你来破译', 36, y + 25, 16, colors.ink, 'left', true);
  text(`${difficulty.limit - game.guesses.length} / ${difficulty.limit} 次`, 337, y + 25, 12, colors.blue, 'right');
  const value = game.status === 'playing' ? controller.input : game.answer;
  for (let i = 0; i < 4; i++) {
    box(49 + i * 72, y + 47, 61, 58, '#f1f4fb', 10);
    text(value[i] || '–', 79 + i * 72, y + 77, 32, value[i] ? colors.blue : '#b6c1d4', 'center', true);
  }
  const hint = controller.error || (game.status === 'playing' ? '点击下方数字键 · 首位可以是 0' : game.status === 'won' ? `用了 ${game.guesses.length} 次猜中，答案如上` : '机会已用完，答案如上');
  text(hint, 187.5, y + 124, 12, controller.error ? '#d34b59' : colors.muted, 'center');
  button('玩法说明', 34, y + 137, 85, 23, () => controller.rules(), { fill: '#ffffff', size: 12 });
  button(game.status === 'playing' ? '重新开始' : '再来一局 →', 240, y + 137, 100, 23, () => controller.restart(), { fill: '#ffffff', size: 12 });

  const bottom = H - Math.max(safeBottom, 12);
  const keyH = Math.max(34, Math.min(45, (H - top - 450) / 4));
  const keyGap = 6;
  const keypadY = bottom - (keyH + keyGap) * 4;
  const recordY = y + 175;
  const recordH = Math.max(38, keypadY - recordY - 12);
  box(20, recordY, 335, recordH, '#ffffff', 14);
  text('推理记录', 35, recordY + 21, 14, colors.ink, 'left', true);
  text('A 位置正确 · B 位置不同', 340, recordY + 21, 10, colors.muted, 'right');
  const capacity = Math.max(0, Math.floor((recordH - 40) / 30));
  controller.offset = Math.min(controller.offset, Math.max(0, game.guesses.length - capacity));
  recordArea = { y: recordY, h: recordH, capacity };
  if (!game.guesses.length && recordH >= 66) text('从你的第一个猜测开始吧', 187.5, recordY + 55, 12, colors.muted, 'center');
  const end = game.guesses.length - controller.offset;
  const start = Math.max(0, end - capacity);
  game.guesses.slice(start, end).forEach((row, i) => {
    const ry = recordY + 49 + i * 30;
    text(String(start + i + 1).padStart(2, '0'), 36, ry, 12, colors.muted);
    text(row.guess.split('').join(' '), 83, ry, 19, colors.ink, 'left', true);
    box(239, ry - 11, 43, 23, '#e6f7f0', 6); text(`${row.a}A`, 260, ry + 1, 13, '#239b77', 'center', true);
    box(290, ry - 11, 43, 23, '#fff3df', 6); text(`${row.b}B`, 311, ry + 1, 13, '#b98222', 'center', true);
  });
  if (game.guesses.length > capacity) text('上下滑动查看记录', 187.5, keypadY - 5, 9, colors.muted, 'center');
  for (let i = 0; i < 9; i++) key(String(i + 1), i % 3, Math.floor(i / 3));
  key('删除', 0, 3); key('0', 1, 3); key('提交', 2, 3);
  function key(label, column, row) {
    const active = game.status === 'playing';
    const submit = label === '提交';
    button(label, 20 + column * 114, keypadY + row * (keyH + keyGap), 107, keyH,
      () => label === '删除' ? controller.erase() : submit ? controller.submit() : controller.digit(label),
      { disabled: !active, fill: !active ? '#e8ecf3' : submit ? colors.blue : '#ffffff', color: !active ? '#a6b0c1' : submit ? '#ffffff' : colors.ink, size: label.length === 1 ? 22 : 15 });
  }
}

function renderStats() {
  button('返回游戏', 269, top + 37, 86, 28, () => { controller.screen = 'game'; render(); });
  text('经典猜数字游戏', 20, top + 52, 26, colors.ink, 'left', true);
  text('战绩仅保存在本机，放弃对局不计入', 20, top + 84, 12, colors.muted);
  const cardH = Math.min(138, (H - top - safeBottom - 210) / 3);
  DIFFICULTIES.forEach((item, index) => {
    const stats = controller.state.stats[item.id];
    const y = top + 110 + index * (cardH + 12);
    box(20, y, 335, cardH, '#ffffff', 15);
    text(`${item.name} · ${item.limit} 次机会`, 36, y + 23, 15, colors.ink, 'left', true);
    const values = [stats.completed, stats.wins, stats.completed ? `${Math.round(stats.wins / stats.completed * 100)}%` : '—'];
    values.forEach((value, i) => { text(value, 80 + i * 108, y + cardH * .5, 25, colors.blue, 'center', true); text(['完成局数', '获胜局数', '胜率'][i], 80 + i * 108, y + cardH * .5 + 23, 11, colors.muted, 'center'); });
    text(`最佳获胜成绩：${stats.best === null ? '—' : stats.best + ' 次'}`, 36, y + cardH - 15, 11, colors.muted);
  });
  button('清空战绩', 20, H - safeBottom - 60, 335, 40, () => controller.clearStats());
}

let touchStart;
wx.onTouchStart(event => {
  if (!event.touches.length) return;
  const touch = event.touches[0];
  touchStart = { x: touch.clientX / scale, y: touch.clientY / scale };
});
wx.onTouchEnd(event => {
  if (!touchStart || !event.changedTouches.length) return;
  const start = touchStart; touchStart = null;
  const touch = event.changedTouches[0];
  const x = touch.clientX / scale; const y = touch.clientY / scale;
  const dy = y - start.y;
  if (Math.abs(dy) > 25) {
    if (recordArea && start.y >= recordArea.y && start.y <= recordArea.y + recordArea.h) {
      const max = Math.max(0, controller.state.game.guesses.length - recordArea.capacity);
      controller.offset = Math.max(0, Math.min(max, controller.offset + (dy > 0 ? 1 : -1)));
      render();
    }
    return;
  }
  if (Math.abs(x - start.x) > 20) return;
  const target = buttons.find(item => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h && start.x >= item.x && start.x <= item.x + item.w && start.y >= item.y && start.y <= item.y + item.h);
  if (target) target.action();
});
wx.onHide(() => storage.save(controller.state));
wx.onShow(() => render());
render();
