'use strict';
/**
 * 独立应用的 AI 设置窗口：在进程内打开本机设置页，不把地址交给系统默认浏览器。
 *
 * 打包后的 exe 在别的电脑上常因系统代理、默认浏览器缺失或丢掉 #token= 而打不开设置。
 * 应用内窗口直接加载已鉴权的本机地址，令牌仍在地址栏片段里，由设置页自己读出。
 * @module taoxi-pet/runtime/electron-helper/main/settings-window
 */

const path = require('node:path');
const { BrowserWindow } = require('electron');

/** 当前打开的设置窗；再次点菜单时复用，避免叠一堆。 */
let settingsWin = null;

/**
 * 打开或前置 AI 设置窗。
 *
 * @param {string} url - 已带令牌的本机设置页地址（含 #token=）。
 */
function openSettingsWindow(url) {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.loadURL(url).catch((error) => {
      console.error('[taoxi-pet-desktop-helper] settings reload failed:', error);
    });
    if (settingsWin.isMinimized()) settingsWin.restore();
    settingsWin.show();
    settingsWin.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#fbf4ef',
    title: '桃汐 · AI 设置',
    icon: path.join(__dirname, '..', '..', '..', 'assets', 'logo.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  settingsWin = win;

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) win.show();
  });
  win.on('closed', () => {
    if (settingsWin === win) settingsWin = null;
  });

  // 只允许本机回环；外链交给系统浏览器，避免设置窗变成通用浏览器。
  win.webContents.setWindowOpenHandler(({ url: next }) => {
    try {
      const target = new URL(next);
      if (target.hostname === '127.0.0.1' || target.hostname === 'localhost') {
        return { action: 'allow' };
      }
    } catch {
      /* ignore */
    }
    const { shell } = require('electron');
    shell.openExternal(next).catch((error) => {
      console.error('[taoxi-pet-desktop-helper] settings external link failed:', error);
    });
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, next) => {
    try {
      const target = new URL(next);
      if (target.hostname === '127.0.0.1' || target.hostname === 'localhost') return;
    } catch {
      /* fall through */
    }
    event.preventDefault();
  });

  win.loadURL(url).catch((error) => {
    console.error('[taoxi-pet-desktop-helper] settings load failed:', error);
  });
}

module.exports = { openSettingsWindow };
