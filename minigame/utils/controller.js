const { DIFFICULTIES, createGame, applyGuess, emptyStats } = require('./game');

class Controller {
  constructor(storage, platform, redraw) {
    this.storage = storage;
    this.platform = platform;
    this.redraw = redraw;
    this.state = storage.load();
    this.input = '';
    this.error = '';
    this.screen = 'game';
    this.offset = 0;
    storage.save(this.state);
  }
  digit(value) {
    if (this.state.game.status !== 'playing' || this.input.length >= 4) return;
    if (this.input.includes(value)) this.error = '数字不能重复';
    else { this.input += value; this.error = ''; }
    this.redraw();
  }
  erase() { this.input = this.input.slice(0, -1); this.error = ''; this.redraw(); }
  submit() {
    const result = applyGuess(this.state, this.input);
    if (result.error) this.error = result.error;
    else {
      this.state = result.state;
      this.storage.save(this.state);
      this.input = '';
      this.error = '';
      this.offset = 0;
    }
    this.redraw();
  }
  restart(difficulty = this.state.game.difficulty) {
    if (!DIFFICULTIES.some(item => item.id === difficulty)) return;
    const start = () => {
      this.state = { ...this.state, game: createGame(difficulty) };
      this.storage.save(this.state);
      this.input = ''; this.error = ''; this.offset = 0;
      this.redraw();
    };
    if (this.state.game.status === 'playing') {
      this.platform.showModal({ title: '开始新的一局？', content: '当前进度将被清除，本局不计入战绩。', confirmText: '开始新局', success: result => { if (result.confirm) start(); } });
    } else start();
  }
  clearStats() {
    this.platform.showModal({ title: '清空所有战绩？', content: '此操作无法撤销，当前对局会保留。', confirmText: '确认清空', success: result => {
      if (!result.confirm) return;
      this.state = { ...this.state, stats: emptyStats() };
      this.storage.save(this.state);
      this.redraw();
    } });
  }
  rules() {
    this.platform.showModal({ title: '怎么玩', content: '猜出 4 个不重复数字，首位可以是 0。\nA：数字和位置都正确。\nB：数字正确，但位置错误。\n例如答案 0123，猜 0214，提示 1A2B。\n简单 12 次，经典 8 次，困难 6 次。无效输入不扣次数。', showCancel: false, confirmText: '知道了' });
  }
}

module.exports = Controller;
