const { newState, validState } = require('./game');
const KEY = 'numberGuess.v1';

function load() {
  try {
    const stored = wx.getStorageSync(KEY);
    if (!stored) return newState();
    if (validState(stored)) return stored;
    wx.showToast({ title: '本机数据异常，已重置', icon: 'none' });
  } catch (_) {
    wx.showToast({ title: '无法读取本机进度', icon: 'none' });
  }
  return newState();
}

function save(state) {
  try {
    wx.setStorageSync(KEY, state);
    return true;
  } catch (_) {
    wx.showToast({ title: '保存失败，请检查存储空间', icon: 'none' });
    return false;
  }
}

module.exports = { load, save };
