(function () {
  'use strict';

  const MARKER = '[[GAL_OPENING]]';
  const SLOT = '__GALWORLD_TAVERN__';
  const SCRIPT_VERSION = '3.35.0';
  const WORK_TAGS = {
    fly: '[飞翔心]',
    sakura: '[樱之诗]',
    kaoru: '[芬芳]',
    canvas: '[画布]',
    waltz: '[轮舞曲]',
    theo: '[少女理论]',
    tsuki: '[近月]',
    tsumi: '[罪与罚]',
    lemon: '[柠水]',
    hanako: '[花子]',
    nine: '[9-nine]',
    domain: '[少女领域]',
    summerpockets: '[SummerPockets]',
    tiannv2: '[甜蜜女友2]',
    tiannv25: '[甜蜜女友2.5]',
    tiannv3: '[甜蜜女友3]',
    yuanqi: '[缘起]',
    chunbai: '[纯白]',
    shuizang: '[水葬]',
    linggan: '[甜蜜创想]',
    zhishang: '[纸上]',
    lianai: '[恋借]',
  };
  const WORK_TAG_ALIASES = {
    tsumi: ['[万华镜]'],
    summerpockets: ['[夏日口袋]'],
    tiannv2: ['[甜友2]'],
    tiannv25: ['[甜友25]'],
    tiannv3: ['[甜友3]'],
    linggan: ['[灵感满溢]'],
    lianai: ['[恋爱借走]']
  };
  function workTagsFor(id) {
    return [WORK_TAGS[id]].concat(WORK_TAG_ALIASES[id] || []).filter(Boolean);
  }

  /* ── host bridge ───────────────────────────────────────────── */
  function getHostWin() {
    try { if (window.parent && window.parent !== window) return window.parent; } catch (_) {}
    return window;
  }
  function getHostDoc() {
    try { if (window.parent && window.parent !== window && window.parent.document) return window.parent.document; } catch (_) {}
    return document;
  }
  const HW = getHostWin();
  let HD = getHostDoc();

  function fn(name) {
    const scopes = [window, window.TavernHelper, HW, HW.TavernHelper];
    for (let i = 0; i < scopes.length; i++) {
      const scope = scopes[i];
      try { if (scope && typeof scope[name] === 'function') return scope[name].bind(scope); } catch (_) {}
    }
    return null;
  }

  function hostToast(message, kind) {
    const type = kind || 'info';
    try {
      if (HW.toastr && typeof HW.toastr[type] === 'function') {
        HW.toastr[type](String(message));
        return;
      }
    } catch (_) {}
    try { console[type === 'error' ? 'error' : 'info']('[GALWORLD]', message); } catch (_) {}
  }

  /* ── MVU / variable bridge (same contract as the previous world-book script) ── */
  function grabMvu() {
    try { if (typeof Mvu !== 'undefined' && Mvu) return Mvu; } catch (_) {}
    const list = [HW, window, HW.TavernHelper, window.TavernHelper];
    for (let i = 0; i < list.length; i++) {
      try { if (list[i] && list[i].Mvu) return list[i].Mvu; } catch (_) {}
    }
    return null;
  }
  function waitMvu(maxMs) {
    const limit = maxMs || 1600;
    return new Promise((resolve) => {
      const start = Date.now();
      let done = false;
      const finish = (m) => { if (!done) { done = true; resolve(m); } };
      const attempt = () => {
        const m = grabMvu();
        if (m) return finish(m);
        if (Date.now() - start > limit) return finish(null);
        setTimeout(attempt, 150);
      };
      const waitFn = fn('waitGlobalInitialized');
      if (typeof waitFn === 'function') {
        Promise.resolve(waitFn('Mvu')).then(() => attempt()).catch(() => attempt());
      } else attempt();
    });
  }
  function setPath(obj, path, value) {
    const keys = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
    return obj;
  }
  function pickId(created) {
    try {
      if (typeof created === 'number') return created;
      if (Array.isArray(created) && created.length) {
        for (let i = created.length - 1; i >= 0; i--) {
          const c = created[i];
          if (typeof c === 'number') return c;
          if (c && typeof c === 'object') {
            if (typeof c.message_id === 'number') return c.message_id;
            if (typeof c.id === 'number') return c.id;
          }
        }
      }
    } catch (_) {}
    return null;
  }
  async function writeVariables(messageId, seed) {
    const api = await waitMvu(1600);
    if (api && typeof api.getMvuData === 'function' && typeof api.replaceMvuData === 'function') {
      try {
        let vars = await Promise.resolve(api.getMvuData({ type: 'message', message_id: messageId }));
        if (!vars || typeof vars !== 'object') vars = {};
        if (!vars.stat_data || typeof vars.stat_data !== 'object') vars.stat_data = {};
        Object.keys(seed).forEach((p) => setPath(vars.stat_data, p, seed[p]));
        await api.replaceMvuData(vars, { type: 'message', message_id: messageId });
        return 'mvu';
      } catch (error) {
        console.warn('[GALWORLD] MVU 写入失败，尝试助手变量接口：', error);
      }
    }
    const upd = fn('updateVariablesWith');
    if (typeof upd === 'function') {
      try {
        await upd((vars) => {
          const v = (vars && typeof vars === 'object') ? vars : {};
          if (!v.stat_data || typeof v.stat_data !== 'object') v.stat_data = {};
          Object.keys(seed).forEach((p) => setPath(v.stat_data, p, seed[p]));
          return v;
        }, { type: 'message', message_id: messageId });
        return 'helper';
      } catch (error) {
        console.warn('[GALWORLD] 助手变量写入失败：', error);
      }
    }
    return null;
  }

  /* Read / write the current chat's MVU stat_data (for page 03 story routing). */
  function readStatData() {
    const api = grabMvu();
    if (api && typeof api.getMvuData === 'function') {
      try {
        const latest = api.getMvuData({ type: 'message', message_id: 'latest' });
        if (latest && latest.stat_data) return latest.stat_data;
        if (latest && (latest['世界'] || latest['user'])) return latest;
      } catch (_) {}
    }
    const getAll = fn('getAllVariables');
    if (typeof getAll === 'function') {
      try {
        const data = getAll();
        if (data && data.stat_data) return data.stat_data;
        if (data && (data['世界'] || data['user'])) return data;
      } catch (_) {}
    }
    const getVar = fn('getvar');
    if (typeof getVar === 'function') {
      try {
        const sd = getVar('stat_data');
        if (sd && typeof sd === 'object') return sd;
      } catch (_) {}
    }
    return null;
  }
  async function writeStatData(mutator) {
    const api = await waitMvu(1600);
    if (api && typeof api.getMvuData === 'function' && typeof api.replaceMvuData === 'function') {
      try {
        const opts = { type: 'message', message_id: 'latest' };
        let vars = await Promise.resolve(api.getMvuData(opts));
        if (!vars || typeof vars !== 'object') vars = {};
        if (!vars.stat_data || typeof vars.stat_data !== 'object') vars.stat_data = {};
        mutator(vars.stat_data);
        await api.replaceMvuData(vars, opts);
        return 'mvu';
      } catch (error) {
        console.warn('[GALWORLD] 剧情变量写入失败，尝试助手接口：', error);
      }
    }
    const upd = fn('updateVariablesWith');
    if (typeof upd === 'function') {
      try {
        await upd((vars) => {
          const v = (vars && typeof vars === 'object') ? vars : {};
          if (!v.stat_data || typeof v.stat_data !== 'object') v.stat_data = {};
          mutator(v.stat_data);
          return v;
        }, { type: 'message', message_id: 'latest' });
        return 'helper';
      } catch (error) {
        console.warn('[GALWORLD] 剧情变量助手写入失败：', error);
      }
    }
    return null;
  }

  /* ── world book bridge ─────────────────────────────────────── */
  function entryLabel(entry) {
    return String((entry && (entry.comment || entry.name)) || '').trim();
  }
  function normalizeBookEntries(entries) {
    if (Array.isArray(entries)) return entries;
    if (entries && Array.isArray(entries.entries)) return entries.entries;
    if (entries && typeof entries === 'object') return Object.values(entries);
    return [];
  }
  function entryIsOn(entry) {
    if (!entry) return false;
    if (entry.enabled !== undefined) return !!entry.enabled;
    if (entry.disable !== undefined) return !entry.disable;
    return true;
  }
  function entryWithEnabled(entry, on) {
    return Object.assign({}, entry, { enabled: on, disable: !on });
  }

  async function locateBook() {
    const getChar = fn('getCharWorldbookNames');
    const getChat = fn('getChatWorldbookName');
    const getAll = fn('getWorldbookNames');
    const getBook = fn('getWorldbook');
    let name = '';
    try {
      if (typeof getChat === 'function') {
        const chat = await Promise.resolve(getChat('current'));
        name = String(chat || '');
      }
    } catch (_) {}
    try {
      if (!name && typeof getChar === 'function') {
        const result = await Promise.resolve(getChar('current'));
        name = String((result && (result.primary || result.name)) || '');
      }
    } catch (_) {}
    const hasCardEntries = async (candidate) => {
      if (!candidate || typeof getBook !== 'function') return !!candidate;
      try {
        const entries = normalizeBookEntries(await Promise.resolve(getBook(candidate)));
        return entries.some((entry) => /^\[[^\]]+\]\[(?:角色|主角|世界|地图|大纲|剧情细纲)\]/.test(entryLabel(entry)));
      } catch (_) { return false; }
    };
    if (name && await hasCardEntries(name)) return name;
    if (typeof getAll === 'function') {
      try {
        const all = await Promise.resolve(getAll());
        if (Array.isArray(all)) {
          for (const candidate of all) {
            if (await hasCardEntries(candidate)) return String(candidate);
          }
          name = String(all.find((item) => /Gal|大世界|现代日本/.test(String(item))) || all[0] || '');
        }
      } catch (_) {}
    }
    return name;
  }

  function page2NormalizeEntries(entries) {
    if (Array.isArray(entries)) return entries;
    if (entries && Array.isArray(entries.entries)) return entries.entries;
    if (entries && typeof entries === 'object') return Object.values(entries);
    return [];
  }
  function page2EntryIsOn(entry) {
    if (!entry) return false;
    if (entry.enabled !== undefined) return !!entry.enabled;
    if (entry.disable !== undefined) return !entry.disable;
    return true;
  }
  function page2EntryWithEnabled(entry, on) {
    return Object.assign({}, entry, { enabled: on, disable: !on });
  }

  /* Page 02 worldbook switchboard runs outside the app mount scope; keep its own variant table. */
  const PAGE2_SWAP_VARIANTS = {
    nine: { old: ['[9-nine][角色]🌈新海翔 · 档案', '[9-nine][角色]🌈新海翔 · 语料'], next: ['[9-nine][角色]🌈新海霞 · 档案', '[9-nine][角色]🌈新海霞 · 语料'] },
    sakura: { old: ['[樱之诗][角色]🌸草薙直哉'], next: ['[樱之诗][角色]🌸草薙直绪 · 档案', '[樱之诗][角色]🌸草薙直绪 · 语料'] }
  };
  const PAGE2_PROTAGONIST_CHAR_NAMES = {
    lemon: ['冲浪雪鹰'], sakura: ['草薙直哉'], nine: ['新海翔'], domain: ['飞鸟凑'], fly: ['葛木晶'],
    kaoru: ['千原直人'], canvas: ['瑞木信'], waltz: ['真原葵'], theo: ['大藏游星', '小仓朝日'], tsumi: ['觋夕摩'],
    summerpockets: ['鹰原羽依里'],
    lianai: ['新海幸'],
    shuizang: ['茅崎英士'],
    linggan: ['和泉智宏'],
    tiannv2: ['和仓贤一'],
    tiannv25: ['志贺浩辅'],
    tiannv3: ['乡野义大'],
    chunbai: ['瓜生新吾'],
    zhishang: ['四条琉璃'],
    yuanqi: ['八乙女哲也']
  };
  const PAGE2_PROTAGONIST_BY_WORK = { sakura: 'sakura', nine: 'nine', domain: 'domain', lemon: 'lemon', fly: 'fly', kaoru: 'kaoru', canvas: 'canvas', waltz: 'waltz', theo: 'theo', tsumi: 'tsumi', summerpockets: 'summerpockets', lianai: 'lianai', shuizang: 'shuizang', linggan: 'linggan', tiannv2: 'tiannv2', tiannv25: 'tiannv25', tiannv3: 'tiannv3', chunbai: 'chunbai', zhishang: 'zhishang', yuanqi: 'yuanqi' };
  function page2SwapVariantForLabel(label) {
    for (const key of Object.keys(PAGE2_SWAP_VARIANTS)) {
      const item = PAGE2_SWAP_VARIANTS[key];
      if (item.old.indexOf(label) >= 0) return { key, isNew: false };
      if (item.next.indexOf(label) >= 0) return { key, isNew: true };
    }
    return null;
  }

  /* Toggle every entry of one work at runtime (page 02 switchboard / page 03 mixer).
     state may be a boolean or { enabled, plot }. */
  async function setWorkWorldbook(workId, state) {
    const tags = workTagsFor(workId);
    if (!tags.length) return { ok: false, errors: ['未知作品：' + workId], changed: 0, matched: 0 };
    const update = fn('updateWorldbookWith');
    if (typeof update !== 'function') return { ok: false, errors: ['这个环境没有 updateWorldbookWith 接口'], changed: 0, matched: 0 };
    const bookName = await locateBook();
    if (!bookName) return { ok: false, errors: ['没能定位到本卡绑定的世界书'], changed: 0, matched: 0 };
    const cfg = (state && typeof state === 'object') ? state : { enabled: state !== false };
    const modes = (cfg && cfg.protagonistModes && typeof cfg.protagonistModes === 'object') ? cfg.protagonistModes : {};
    const wantOn = cfg.enabled !== false;
    const wantPlot = cfg.plot !== false;
    let changed = 0;
    let matched = 0;
    const errors = [];
    const mutate = (entries) => (Array.isArray(entries) ? entries : []).map((entry) => {
      const label = entryLabel(entry);
      if (!tags.some((tag) => label.indexOf(tag) >= 0)) return entry;
      matched += 1;
      let want = wantOn;
      if (want && !wantPlot && /\[(事件|大纲|剧情细纲)\]/.test(label)) want = false;
      const variant = page2SwapVariantForLabel(label);
      if (variant && want) {
        const mode = modes[variant.key] || '';
        if (mode === 'swap') want = variant.isNew;
        else if (mode === 'replace' || mode === 'absent') want = false;
        else want = !variant.isNew;
      }
      const ownerKey = PAGE2_PROTAGONIST_BY_WORK[workId];
      if (!variant && ownerKey && label.indexOf('[主角]') < 0) {
        const ownerMode = modes[ownerKey] || '';
        const names = PAGE2_PROTAGONIST_CHAR_NAMES[ownerKey] || [];
        if ((ownerMode === 'replace' || ownerMode === 'absent') && names.some((name) => label.indexOf(name) >= 0)) want = false;
      }
      if (page2EntryIsOn(entry) === want) return entry;
      changed += 1;
      return page2EntryWithEnabled(entry, want);
    });
    try {
      await update(bookName, mutate, { render: 'immediate' });
    } catch (error) {
      errors.push(String((error && error.message) || error));
      const getBook = fn('getWorldbook');
      const replaceBook = fn('replaceWorldbook');
      if (typeof getBook === 'function' && typeof replaceBook === 'function') {
        try {
          const current = page2NormalizeEntries(await Promise.resolve(getBook(bookName)));
          await replaceBook(bookName, mutate(current), { render: 'immediate' });
          errors.length = 0;
        } catch (fallbackError) {
          errors.push(String((fallbackError && fallbackError.message) || fallbackError));
        }
      }
    }
    if (changed) console.info('[GALWORLD] 世界书开关 →', workId, tags.join(','), wantOn ? '开启' : '关闭', changed + '/' + matched);
    const result = { ok: errors.length === 0, book: bookName, changed, matched, errors };
    return result;
  }

  /* Enable/disable every [联合都市] entry (page 03 mode switch). */
  async function setCityMode(enabled) {
    const update = fn('updateWorldbookWith');
    if (typeof update !== 'function') return { ok: false, errors: ['这个环境没有 updateWorldbookWith 接口'], changed: 0, matched: 0 };
    const bookName = await locateBook();
    if (!bookName) return { ok: false, errors: ['没能定位到本卡绑定的世界书'], changed: 0, matched: 0 };
    const want = enabled !== false;
    let changed = 0;
    let matched = 0;
    const errors = [];
    try {
      await update(bookName, (entries) => (Array.isArray(entries) ? entries : []).map((entry) => {
        const label = entryLabel(entry);
        if (label.indexOf('[联合都市]') < 0) return entry;
        matched += 1;
        if (entryIsOn(entry) === want) return entry;
        changed += 1;
        return entryWithEnabled(entry, want);
      }), { render: 'immediate' });
    } catch (error) {
      errors.push(String((error && error.message) || error));
    }
    if (changed) console.info('[GALWORLD] 联合都市条目 →', want ? '开启' : '关闭', changed + '/' + matched);
    return { ok: errors.length === 0, book: bookName, changed, matched, errors };
  }

  async function applyWorldbook(meta) {
    const update = fn('updateWorldbookWith');
    if (typeof update !== 'function') return { ok: false, errors: ['这个环境没有 updateWorldbookWith 接口'], changed: 0, matched: {} };
    const bookName = await locateBook();
    if (!bookName) return { ok: false, errors: ['没能定位到本卡绑定的世界书'], changed: 0, matched: {} };
    const matched = {};
    const changed = { count: 0 };
    const errors = [];
    const settings = (meta && meta.settings) || {};
    try {
      await update(bookName, (entries) => (Array.isArray(entries) ? entries : []).map((entry) => {
        const label = entryLabel(entry);
        if (label.charAt(0) !== '[') return entry;
        const id = Object.keys(WORK_TAGS).find((key) => workTagsFor(key).some((tag) => label.indexOf(tag) === 0));
        if (!id) return entry;
        matched[id] = (matched[id] || 0) + 1;
        const config = settings[id] || {};
        let want = config.enabled !== false;
        if (want && config.plot === false && /\[(事件|大纲|剧情细纲)\]/.test(label)) want = false;
        if (entryIsOn(entry) === want) return entry;
        changed.count += 1;
        return entryWithEnabled(entry, want);
      }), { render: 'immediate' });
    } catch (error) {
      errors.push(String((error && error.message) || error));
    }
    return { ok: errors.length === 0, book: bookName, changed: changed.count, matched, errors };
  }

  /* ── opening message ───────────────────────────────────────── */
  function buildSeed(meta) {
    const persona = (meta && meta.persona) || {};
    const raw = [meta.sceneTime, meta.sceneTitle, meta.scenePlace, meta.workTitle].join(' ');
    let date = '2018年4月9日 星期一';
    let time = '08时00分';
    if (/九月/.test(raw)) date = '2018年9月24日 星期一';
    else if (/二月/.test(raw)) date = '2018年2月12日 星期一';
    else if (/三月/.test(raw)) date = '2018年3月19日 星期一';
    else if (/四月|春/.test(raw)) date = '2018年4月9日 星期一';
    else if (/夏|七月|八月/.test(raw)) date = '2018年7月16日 星期一';
    if (/黄昏|傍晚/.test(raw)) time = '17时30分';
    else if (/午后|下午/.test(raw)) time = '14时00分';
    else if (/夜晚|深夜|夜里|凌晨/.test(raw)) time = '22时00分';
    else if (/放学/.test(raw)) time = '16时30分';
    else if (/清晨|早晨/.test(raw)) time = '07时30分';
    const seed = {};
    seed['世界.日期'] = date;
    seed['世界.时间'] = time;
    seed['世界.天气'] = /雨/.test(raw) ? '小雨' : '晴';
    if (meta.scenePlace) seed['世界.地点'] = meta.scenePlace;
    seed['user.称呼'] = persona.name || '{{user}}';
    if (persona.identity) seed['user.身份'] = persona.identity;
    if (persona.age) seed['user.年龄'] = persona.age;
    return seed;
  }

  let activeMounts = new Set();
  let activeListeners = [];

  const BGM_URLS = [
    'https://fastly.jsdelivr.net/gh/jianchi89/galworld-hot@main/opening/gequ1.mp3',
    'https://cdn.jsdelivr.net/gh/jianchi89/galworld-hot@main/opening/gequ1.mp3',
    'https://raw.githubusercontent.com/jianchi89/galworld-hot/main/opening/gequ1.mp3'
  ];
  const BGM_MUTE_KEY = 'galworld.tavern.bgmMuted.v1';
  const bgm = {
    audio: null,
    mount: null,
    urlIndex: 0,
    closed: false,
    mutedByUser: false,
    blocked: false,
    gestureBound: false,
    onUiSync: null
  };

  function readBgmMutedPref() {
    try { return (HW.localStorage || window.localStorage).getItem(BGM_MUTE_KEY) === '1'; } catch (_) { return false; }
  }

  function writeBgmMutedPref(muted) {
    try {
      const s = HW.localStorage || window.localStorage;
      if (muted) s.setItem(BGM_MUTE_KEY, '1');
      else s.removeItem(BGM_MUTE_KEY);
    } catch (_) {}
  }

  function clearHostBgmGuard() {
    try {
      if (typeof HW.__GALWORLD_BGM_STOP__ === 'function') HW.__GALWORLD_BGM_STOP__();
    } catch (_) {}
  }

  function registerHostBgmGuard(audio, mountNode) {
    clearHostBgmGuard();
    const stopHostAudio = () => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
      } catch (_) {}
    };
    let timerId = 0;
    const cleanup = () => {
      if (timerId) {
        try { (HW.clearInterval || clearInterval)(timerId); } catch (_) {}
        timerId = 0;
      }
      stopHostAudio();
      try { if (HW.__GALWORLD_BGM_STOP__ === cleanup) delete HW.__GALWORLD_BGM_STOP__; } catch (_) {}
    };
    // 即使关闭聊天时脚本 iframe 被直接销毁，父窗口定时器也能在 300ms 内发现挂载点已移除并立刻停歌
    if (mountNode) {
      try {
        timerId = (HW.setInterval || setInterval)(() => {
          if (!mountNode.isConnected) cleanup();
        }, 300);
      } catch (_) {}
    }
    try { HW.__GALWORLD_BGM_STOP__ = cleanup; } catch (_) {}
  }

  function syncBgmUi() {
    if (typeof bgm.onUiSync === 'function') {
      try { bgm.onUiSync(); } catch (_) {}
    }
  }

  function clearBgmGestureFallback() {
    if (!bgm.gestureBound) return;
    bgm.gestureBound = false;
    try { HD.removeEventListener('pointerdown', resumeBgmFromGesture, true); } catch (_) {}
    try { HD.removeEventListener('keydown', resumeBgmFromGesture, true); } catch (_) {}
  }

  function resumeBgmFromGesture(event) {
    if (event && typeof event.composedPath === 'function') {
      if (event.composedPath().some((el) => el && el.id === 'bgmToggle')) return;
    }
    clearBgmGestureFallback();
    if (!bgm.closed && !bgm.mutedByUser) tryPlayOpeningBgm();
  }

  function bindBgmGestureFallback() {
    if (bgm.gestureBound || bgm.closed || bgm.mutedByUser) return;
    bgm.gestureBound = true;
    try { HD.addEventListener('pointerdown', resumeBgmFromGesture, true); } catch (_) {}
    try { HD.addEventListener('keydown', resumeBgmFromGesture, true); } catch (_) {}
  }

  function tryPlayOpeningBgm() {
    if (bgm.closed || bgm.mutedByUser) return;
    const AudioCtor = HW.Audio || window.Audio;
    if (typeof AudioCtor !== 'function') return;
    if (!bgm.audio) {
      const audio = new AudioCtor(BGM_URLS[bgm.urlIndex]);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.35;
      audio.addEventListener('error', () => {
        if (bgm.closed || bgm.audio !== audio) return;
        if (bgm.urlIndex + 1 < BGM_URLS.length) {
          bgm.urlIndex += 1;
          audio.src = BGM_URLS[bgm.urlIndex];
          audio.load();
          if (!bgm.mutedByUser) tryPlayOpeningBgm();
        } else {
          bgm.blocked = true;
          syncBgmUi();
        }
      });
      audio.addEventListener('playing', () => {
        bgm.blocked = false;
        syncBgmUi();
      });
      bgm.audio = audio;
      registerHostBgmGuard(audio, bgm.mount);
    }
    try {
      const p = bgm.audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          bgm.blocked = false;
          clearBgmGestureFallback();
          syncBgmUi();
        }).catch((err) => {
          if (bgm.closed) return;
          bgm.blocked = true;
          if (!err || err.name === 'NotAllowedError') bindBgmGestureFallback();
          syncBgmUi();
        });
      }
    } catch (_) {
      bgm.blocked = true;
      bindBgmGestureFallback();
      syncBgmUi();
    }
  }

  function startOpeningBgm() {
    bgm.closed = false;
    bgm.mutedByUser = readBgmMutedPref();
    bgm.blocked = false;
    bgm.urlIndex = 0;
    if (!bgm.mutedByUser) tryPlayOpeningBgm();
    else syncBgmUi();
  }

  function toggleOpeningBgm() {
    if (bgm.closed) return;
    if (bgm.audio && !bgm.audio.paused && !bgm.mutedByUser) {
      bgm.mutedByUser = true;
      writeBgmMutedPref(true);
      try { bgm.audio.pause(); } catch (_) {}
      clearBgmGestureFallback();
    } else {
      bgm.mutedByUser = false;
      bgm.blocked = false;
      writeBgmMutedPref(false);
      clearBgmGestureFallback();
      tryPlayOpeningBgm();
    }
    syncBgmUi();
  }

  function stopOpeningBgm() {
    bgm.closed = true;
    bgm.blocked = false;
    clearBgmGestureFallback();
    clearHostBgmGuard();
    if (!bgm.audio) { syncBgmUi(); return; }
    try {
      bgm.audio.pause();
      bgm.audio.currentTime = 0;
      bgm.audio.removeAttribute('src');
      bgm.audio.load();
    } catch (_) {}
    bgm.audio = null;
    syncBgmUi();
  }

  function cleanupMounts() {
    stopOpeningBgm();
    try { HW.document.body.style.overflow = ''; } catch (_) {}
    activeMounts.forEach((node) => { try { node.remove(); } catch (_) {} });
    activeMounts.clear();
  }

  async function handleSubmit(prompt, meta, mesId) {
    if (!prompt || !String(prompt).trim()) throw new Error('开局文本为空。');
    let warn = '';
    let wire = null;
    try {
      wire = await applyWorldbook(meta);
      if (!wire.ok) {
        warn = '世界书条目开关写入失败：' + ((wire.errors && wire.errors[0]) || '未知原因') + '。开局仍会继续，请手动检查世界书。';
      }
    } catch (error) {
      warn = '世界书条目开关写入异常：' + ((error && error.message) || error) + '。开局仍会继续，请手动检查世界书。';
    }

    const create = fn('createChatMessages');
    const set = fn('setChatMessages');
    const trigger = fn('triggerSlash');
    if (typeof create !== 'function' || typeof trigger !== 'function') {
      throw new Error('未检测到酒馆助手的 createChatMessages / triggerSlash 接口，请确认 TavernHelper 扩展已开启。');
    }

    const mid = (mesId === null || mesId === undefined) ? 0 : mesId;
    const seed = buildSeed(meta);
    const statData = {};
    Object.keys(seed).forEach((path) => setPath(statData, path, seed[path]));

    let created = null;
    try {
      created = await create([{
        role: 'user',
        message: prompt,
        data: { gal_opening: meta, galworld_opening: meta, gal_wire: wire, stat_data: statData }
      }]);
    } catch (error) {
      created = await create([{ role: 'user', message: prompt, data: { gal_opening: meta, galworld_opening: meta } }]);
    }

    let newId = pickId(created);
    if (newId === null || newId === undefined) {
      const getLast = fn('getLastMessageId');
      if (typeof getLast === 'function') { try { newId = await Promise.resolve(getLast()); } catch (_) {} }
    }
    if (newId === null || newId === undefined) newId = mid;

    try { await writeVariables(newId, seed); } catch (error) { console.warn('[GALWORLD] 变量写入失败：', error); }

    if (typeof set === 'function') {
      try { await set([{ message_id: mid, message: '『世界之书』已合上。' }], { refresh: 'affected' }); }
      catch (_) { try { await set([{ message_id: mid, message: '『世界之书』已合上。' }]); } catch (_) {} }
    }
    // Visual fallback in case setChatMessages is unavailable: never leave the
    // marker in the DOM to be re-mounted by our own scanner.
    activeMounts.forEach((node) => {
      try {
        const textBox = node.parentElement;
        if (textBox) textBox.textContent = '『世界之书』已合上。';
      } catch (_) {}
    });
    cleanupMounts();
    try { await trigger('/trigger'); } catch (error) {
      console.warn('[GALWORLD] /trigger 调用失败：', error);
      hostToast('开局消息已写入，但自动生成没有启动；请手动点一次生成。', 'warning');
    }
    if (warn) hostToast(warn, 'warning');
    return { warn: warn, wire: wire };
  }

  /* ── mounted application ──────────────────────────────────── */
  const APP_HTML = "\n  \n\n  <svg class=\"svg-sprite\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n    <symbol id=\"i-arrow\" viewBox=\"0 0 24 24\"><path d=\"M5 12h13M13 6l6 6-6 6\"/></symbol>\n    <symbol id=\"i-arrow-left\" viewBox=\"0 0 24 24\"><path d=\"M19 12H6M11 18l-6-6 6-6\"/></symbol>\n    <symbol id=\"i-chevron\" viewBox=\"0 0 24 24\"><path d=\"m8 10 4 4 4-4\"/></symbol>\n    <symbol id=\"i-search\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m16 16 4 4\"/></symbol>\n    <symbol id=\"i-play\" viewBox=\"0 0 24 24\"><path d=\"M8 5.5v13l10-6.5z\" fill=\"currentColor\" stroke=\"none\"/></symbol>\n    <symbol id=\"i-pause\" viewBox=\"0 0 24 24\"><path d=\"M8 6v12M16 6v12\"/></symbol>\n    <symbol id=\"i-spark\" viewBox=\"0 0 24 24\"><path d=\"M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1\"/><circle cx=\"12\" cy=\"12\" r=\"2.4\"/></symbol>\n    <symbol id=\"i-book\" viewBox=\"0 0 24 24\"><path d=\"M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3z\"/><path d=\"M4 19V5.5M8 7h8M8 11h6\"/></symbol>\n    <symbol id=\"i-user\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"8\" r=\"3.2\"/><path d=\"M5.5 20c.7-3.3 3-5 6.5-5s5.8 1.7 6.5 5\"/></symbol>\n    <symbol id=\"i-sliders\" viewBox=\"0 0 24 24\"><path d=\"M4 7h7M15 7h5M4 17h4M12 17h8M11 4v6M8 14v6\"/><circle cx=\"11\" cy=\"7\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"8\" cy=\"17\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/></symbol>\n    <symbol id=\"i-cards\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"6\" width=\"12\" height=\"15\" rx=\"2\"/><path d=\"M9 3h9a2 2 0 0 1 2 2v11\"/></symbol>\n    <symbol id=\"i-close\" viewBox=\"0 0 24 24\"><path d=\"m6 6 12 12M18 6 6 18\"/></symbol>\n    <symbol id=\"i-check\" viewBox=\"0 0 24 24\"><path d=\"m5 12 4.5 4.5L19 7\"/></symbol>\n    <symbol id=\"i-quote\" viewBox=\"0 0 24 24\"><path d=\"M6 9h4v4c0 2.2-1.3 3.6-3.5 4M14 9h4v4c0 2.2-1.3 3.6-3.5 4\" fill=\"none\"/></symbol>\n    <symbol id=\"i-edit\" viewBox=\"0 0 24 24\"><path d=\"m4 20 4.2-1 10.3-10.3a2.2 2.2 0 0 0-3.1-3.1L5.1 15.9 4 20Z\"/><path d=\"m13.8 7.2 3 3\"/></symbol>\n    <symbol id=\"i-download\" viewBox=\"0 0 24 24\"><path d=\"M12 3v12M7 10l5 5 5-5M4 19h16\"/></symbol>\n    <symbol id=\"i-copy\" viewBox=\"0 0 24 24\"><rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3\"/></symbol>\n    <symbol id=\"i-dice\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"4\"/><circle cx=\"9\" cy=\"9\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"15\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"9\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"9\" cy=\"15\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/></symbol>\n    <symbol id=\"i-lock\" viewBox=\"0 0 24 24\"><rect x=\"5\" y=\"10\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"/></symbol>\n    <symbol id=\"i-power\" viewBox=\"0 0 24 24\"><path d=\"M12 3v8\"/><path d=\"M6.4 6.5a8 8 0 1 0 11.2 0\"/></symbol>\n    <symbol id=\"i-orbit\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><ellipse cx=\"12\" cy=\"12\" rx=\"9\" ry=\"4.8\" transform=\"rotate(-28 12 12)\"/></symbol>\n    <symbol id=\"i-location\" viewBox=\"0 0 24 24\"><path d=\"M12 21s6.5-5.2 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.8 6.5 11 6.5 11Z\"/><circle cx=\"12\" cy=\"10\" r=\"2\"/></symbol>\n    <symbol id=\"i-clock\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7v5.2l3.2 2\"/></symbol>\n    <symbol id=\"i-film\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4\"/></symbol>\n    <symbol id=\"i-save\" viewBox=\"0 0 24 24\"><path d=\"M5 4h11l3 3v13H5z\"/><path d=\"M8 4v6h8V4M8 20v-6h8v6\"/></symbol>\n    <symbol id=\"i-refresh\" viewBox=\"0 0 24 24\"><path d=\"M20 8a8.4 8.4 0 1 0 .3 7.5M20 3v5h-5\"/></symbol>\n    <symbol id=\"i-heart\" viewBox=\"0 0 24 24\"><path d=\"M12 20S4 15.4 4 9.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8 3.3C20 15.4 12 20 12 20Z\"/></symbol>\n  </svg>\n\n  <div class=\"ambient\" aria-hidden=\"true\">\n    <div class=\"ambient-orb ambient-orb-a\"></div>\n    <div class=\"ambient-orb ambient-orb-b\"></div>\n    <div class=\"ambient-orb ambient-orb-c\"></div>\n    <div class=\"ambient-grid\"></div>\n    \n    <div class=\"grain\"></div>\n  </div>\n  \n\n  <header class=\"site-header\" id=\"siteHeader\">\n    <div class=\"nav-shell\">\n      <a class=\"brand\" href=\"#home\" data-goto=\"home\" aria-label=\"GALWORLD 世界之书首页\">\n        <span class=\"brand-mark\" aria-hidden=\"true\">\n          <svg viewBox=\"0 0 42 42\"><circle cx=\"21\" cy=\"21\" r=\"13.5\"/><ellipse cx=\"21\" cy=\"21\" rx=\"19\" ry=\"7\" transform=\"rotate(-31 21 21)\"/><circle cx=\"34.5\" cy=\"13\" r=\"2.3\" class=\"mark-star\"/></svg>\n        </span>\n        <span class=\"brand-type\">\n          <span class=\"brand-en\">GALWORLD</span>\n          <span class=\"brand-cn\">世界之书</span>\n        </span>\n      </a>\n\n      <nav class=\"site-nav\" aria-label=\"主导航\">\n        <span class=\"nav-glider\" id=\"navGlider\" aria-hidden=\"true\"></span>\n        <button class=\"nav-link is-active\" type=\"button\" data-goto=\"home\" aria-current=\"page\">\n          <span class=\"nav-num\">01</span><span class=\"nav-cn\">总览</span><span class=\"nav-en\">OVERVIEW</span>\n        </button>\n        <button class=\"nav-link\" type=\"button\" data-goto=\"archive\">\n          <span class=\"nav-num\">02</span><span class=\"nav-cn\">作品</span><span class=\"nav-en\">ARCHIVE</span>\n        </button>\n        <button class=\"nav-link\" type=\"button\" data-goto=\"console\">\n          <span class=\"nav-num\">03</span><span class=\"nav-cn\">世界</span><span class=\"nav-en\">MIXER</span>\n        </button>\n        <button class=\"nav-link\" type=\"button\" data-goto=\"persona\">\n          <span class=\"nav-num\">04</span><span class=\"nav-cn\">我</span><span class=\"nav-en\">PERSONA</span>\n        </button>\n        <button class=\"nav-link\" type=\"button\" data-goto=\"opening\">\n          <span class=\"nav-num\">05</span><span class=\"nav-cn\">开局</span><span class=\"nav-en\">OPENING</span>\n        </button>\n        <button class=\"nav-link\" type=\"button\" data-goto=\"final\">\n          <span class=\"nav-num\">06</span><span class=\"nav-cn\">开始</span><span class=\"nav-en\">BEGIN</span>\n        </button>\n      </nav>\n\n      <button class=\"bgm-btn\" id=\"bgmToggle\" type=\"button\" aria-pressed=\"false\" title=\"切换开场音乐\"><i>♪</i><span>音乐</span></button><div class=\"nav-meta\">\n        <span class=\"save-dot\" aria-hidden=\"true\"></span>\n        <span id=\"navSaveText\">本地存档</span>\n      </div>\n    </div>\n    <div class=\"nav-progress\" aria-hidden=\"true\"><span id=\"navProgress\"></span></div>\n  </header>\n\n  <main id=\"main\" class=\"app-main\">\n\n    <!-- ══════════════ 01 · 总览 ══════════════ -->\n    <section class=\"page page-home is-active\" id=\"page-home\" data-page=\"home\" aria-labelledby=\"homeTitle\">\n      <div class=\"home-dashboard\">\n        <div class=\"home-scroll\">\n          <section class=\"home-wall\" id=\"homeWall\" aria-labelledby=\"homeWallTitle\">\n            <header class=\"home-wall-head\">\n              <div class=\"home-wall-title-row\">\n                <div>\n                  <p class=\"micro-label\">ALL WORKS / 作品陈列</p>\n                  <h2 id=\"homeWallTitle\">从哪一扇门开始？</h2>\n                </div>\n                <div class=\"home-wall-tools\">\n                  <span class=\"home-work-count\" id=\"homeWorkCountLabel\">22 部作品</span>\n                  <span class=\"home-collapsed-hint\">左右滑动</span>\n                  <span class=\"home-wall-hint\">点击封面 · 下方查看介绍 <svg><use href=\"#i-arrow\"/></svg></span>\n                  <button class=\"home-wall-toggle\" id=\"homeWallToggle\" type=\"button\" aria-expanded=\"true\" aria-controls=\"homeWorkGrid\"><span>收起</span><svg><use href=\"#i-arrow\"/></svg></button>\n                </div>\n              </div>\n              <div class=\"home-filter-bar\" id=\"homeFilterBar\" role=\"group\" aria-label=\"作品筛选\"></div>\n            </header>\n            <div class=\"home-work-grid\" id=\"homeWorkGrid\"></div>\n            <div class=\"home-rail-scroll\" id=\"homeRailScroll\" hidden aria-label=\"作品横向滚动条\"><span class=\"home-rail-thumb\" id=\"homeRailThumb\"></span></div>\n          </section>\n\n          <section class=\"home-detail\" id=\"homeWorkDetail\" aria-live=\"polite\" aria-label=\"选中作品的介绍\"></section>\n        </div>\n\n      </div>\n      <div class=\"home-gate\" id=\"homeGate\" role=\"dialog\" aria-labelledby=\"homeGateText\" tabindex=\"0\">\n        <div class=\"home-gate-card\">\n          <span class=\"home-gate-kicker\">NOTICE / 阅读提示</span>\n          <p id=\"homeGateText\">本处只为作品与角色介绍，可点击上方导览条迅速开局</p>\n          <span class=\"home-gate-hint\">点击任意处关闭</span>\n        </div>\n      </div>\n    </section>\n\n    <!-- ══════════════ 02 · 作品档案 ══════════════ -->\n    <section class=\"page page-archive\" id=\"page-archive\" data-page=\"archive\" aria-label=\"作品档案\" hidden>\n      <div class=\"archive\" id=\"archive\">\n        <aside class=\"library\" id=\"library\" aria-label=\"作品架\">\n          <div class=\"library-main\" id=\"libraryMain\">\n            <div class=\"library-toolbar\">\n              <label class=\"search-box\">\n                <svg><use href=\"#i-search\"/></svg>\n                <input type=\"search\" id=\"workSearch\" placeholder=\"搜索作品、地点或关键词\" autocomplete=\"off\" aria-label=\"搜索作品\">\n                <kbd>Ctrl K</kbd>\n              </label>\n            </div>\n            <div class=\"filter-bar\" id=\"filterBar\" role=\"group\" aria-label=\"按标签筛选作品\">\n              <button class=\"filter-chip is-active\" type=\"button\" data-filter=\"ALL\">ALL <span>12</span></button>\n            </div>\n            <div class=\"library-title\">\n              <span><i></i>作品陈列架(高注意力模型外尽量只开自己想玩的扩展)</span>\n              <span id=\"workCountLabel\" aria-live=\"polite\">12 / 12</span>\n            </div>\n            <div class=\"work-grid\" id=\"workGrid\"></div>\n            <div class=\"library-empty\" id=\"libraryEmpty\" hidden>\n              <span class=\"empty-orbit\"><svg><use href=\"#i-orbit\"/></svg></span>\n              <p>没有找到这部作品。</p>\n              <button class=\"text-btn\" type=\"button\" id=\"clearSearch\">清空筛选</button>\n            </div>\n          </div>\n\n        </aside>\n\n      </div>\n    </section>\n\n    <!-- ══════════════ 03 · 世界模式 ══════════════ -->\n    <section class=\"page page-console page-console-v2\" id=\"page-console\" data-page=\"console\" aria-label=\"世界模式\" hidden>\n      <div class=\"console-v2-scroll\">\n        <header class=\"console-mode-bar\">\n          <div class=\"console-mode-copy\">\n            <p class=\"micro-label\">WORLD ROUTING / 世界模式</p>\n            <h2>先决定世界如何并行。</h2>\n          </div>\n          <div class=\"console-modes\" id=\"consoleModes\" role=\"group\" aria-label=\"世界模式\">\n            <button class=\"console-mode is-active\" type=\"button\" data-city-mode=\"city\" aria-pressed=\"true\">\n              <span class=\"console-mode-name\">联合都市</span>\n              <span class=\"console-mode-sub\">[联合都市] 条目</span>\n            </button>\n          </div>\n        </header>\n\n        <p class=\"console-mode-note\" id=\"consoleModeNote\">联合都市：启用带 [联合都市] 的条目；剧情选择会开启对应作品主线。</p>\n\n        <div class=\"console-boxes\">\n          <section class=\"console-box console-box-protagonist\" aria-labelledby=\"swapBoxTitle\">\n            <header class=\"console-box-head\">\n              <div>\n                <p class=\"micro-label\">ORIGINAL PROTAGONIST / 原主角调整</p>\n                <h2 id=\"swapBoxTitle\">原主角如何存在</h2>\n              </div>\n              <span class=\"console-box-hint\">只显示各作实际存在的选项</span>\n              <button class=\"console-collapse-btn\" id=\"protagonistToggle\" type=\"button\" aria-expanded=\"true\"><span>收起</span><svg><use href=\"#i-arrow\"/></svg></button>\n            </header>\n            <div class=\"console-box-grid\" id=\"swapWorkGrid\"></div>\n          </section>\n\n          <section class=\"console-box console-box-story\" aria-labelledby=\"plotBoxTitle\">\n            <header class=\"console-box-head\">\n              <div>\n                <p class=\"micro-label\">STORY MODE / 剧情模式</p>\n                <h2 id=\"plotBoxTitle\">开哪些主线</h2>\n              </div>\n              <span class=\"console-box-hint\">点选即开启对应主线大纲</span>\n            </header>\n            <p class=\"console-warning\"><span>⚠</span>推荐不开剧情游玩，所有剧情细纲皆为风味同人，不保证完全还原</p>\n            <div class=\"console-box-grid\" id=\"plotWorkGrid\"></div>\n          </section>\n        </div>\n\n        <p class=\"console-foot-note\">\n          <svg><use href=\"#i-spark\"/></svg>\n          <span>剧情区只列出有 [大纲] 条目的作品；点选会写入 世界.事件[作品-主线].状态 = 进行中，触发对应 EJS 大纲。原主角调整会实时改写对应 [主角] 条目的蓝灯 / 绿灯。</span>\n        </p>\n      </div>\n    </section>\n\n    <!-- ══════════════ 04 · 我的人物 ══════════════ -->\n    <section class=\"page page-persona page-persona-v2\" id=\"page-persona\" data-page=\"persona\" aria-label=\"我的人物\" hidden>\n      <div class=\"persona-v2-scroll\">\n        <header class=\"persona-v2-head\">\n          <div>\n            <p class=\"micro-label\">CHAPTER 04 · PERSONA</p>\n            <h2>先决定，你是谁。<span class=\"persona-v2-note-inline\">（可全不填由 AI 看 user 笑脸设定补完）</span></h2>\n            <p class=\"persona-v2-desc\">扮演自己，或接过原著里某个人的名字。</p>\n          </div>\n          <span class=\"autosave-pill\"><span class=\"save-dot\"></span><span id=\"personaSaveText\">本地自动保存</span></span>\n        </header>\n\n        <div class=\"persona-tabs\" id=\"personaTabs\" role=\"tablist\" aria-label=\"人物模式\">\n          <button class=\"persona-tab is-active\" type=\"button\" data-persona-mode=\"self\" role=\"tab\" aria-selected=\"true\"><span>自我</span><small>SELF</small></button>\n          <button class=\"persona-tab\" type=\"button\" data-persona-mode=\"bond\" role=\"tab\" aria-selected=\"false\"><span>羁绊</span><small>BOND</small></button>\n          <button class=\"persona-tab\" type=\"button\" data-persona-mode=\"role\" role=\"tab\" aria-selected=\"false\"><span>扮演原著角色</span><small>ROLE</small></button>\n        </div>\n\n        <div class=\"persona-v2-layout\">\n          <div class=\"persona-v2-panel\">\n            <div class=\"persona-v2-pane\" id=\"personaPanelSelf\">\n              <button class=\"persona-companion-bar\" id=\"chooseCompanion\" type=\"button\">选择开局同伴</button>\n              <div class=\"companion-box\" id=\"selfCompanionBox\"></div>\n              <div class=\"persona-fields\">\n                <label class=\"pfield\">\n                  <span class=\"pfield-label\"><i>①</i>姓名</span>\n                  <input id=\"pName\" type=\"text\" maxlength=\"24\" placeholder=\"例：佐藤 悠真\" autocomplete=\"off\">\n                </label>\n                <label class=\"pfield\">\n                  <span class=\"pfield-label\"><i>②</i>年龄</span>\n                  <input id=\"pAge\" type=\"text\" maxlength=\"12\" placeholder=\"17\" autocomplete=\"off\">\n                </label>\n                <label class=\"pfield pfield-full\">\n                  <span class=\"pfield-label\"><i>③</i>身份</span>\n                  <input id=\"pIdentity\" type=\"text\" maxlength=\"40\" placeholder=\"例：转学生 / 见习糕点师 / 旧书店店员\" autocomplete=\"off\">\n                </label>\n                <label class=\"pfield pfield-full\">\n                  <span class=\"pfield-label\"><i>④</i>背景</span>\n                  <textarea id=\"pBackground\" rows=\"4\" maxlength=\"600\" placeholder=\"你从哪里来，为什么在这座城市。\"></textarea>\n                </label>\n                <label class=\"pfield pfield-full\">\n                  <span class=\"pfield-label\"><i>⑤</i>外貌</span>\n                  <input id=\"pAppearance\" type=\"text\" maxlength=\"200\" placeholder=\"例：黑色短发，左眼下有一颗小痣，习惯穿宽松的旧衬衫。\">\n                </label>\n                <div class=\"pfield pfield-full pfield-toggle\">\n                  <div>\n                    <span class=\"pfield-label\"><i>⑥</i>男扮女装</span>\n                    <p>勾选代表你以女装身份入学。</p>\n                  </div>\n                  <button class=\"p-switch\" id=\"pCrossdress\" type=\"button\" aria-pressed=\"false\"><span class=\"p-switch-track\"><i></i></span><b>未勾选</b></button>\n                </div>\n              </div>\n            </div>\n\n            <div class=\"persona-v2-pane\" id=\"personaPanelBond\" hidden>\n              <div class=\"bond-intro\">\n                <b>开局同伴</b>\n                <p>选择开局时陪在你身边的角色。关系与开场内容都可以改；默认只写最简单的几句。</p>\n              </div>\n              <div class=\"companion-box\" id=\"bondCompanionBox\"></div>\n              <div class=\"companion-box\" id=\"bondCompanionBox\"></div>\n              <div class=\"bond-cats\" id=\"bondCats\"></div>\n              <div class=\"bond-list\" id=\"bondList\"></div>\n            </div>\n\n            <div class=\"persona-v2-pane\" id=\"personaPanelRole\" hidden>\n              <div class=\"role-tabs\" id=\"roleTabs\" role=\"tablist\" aria-label=\"扮演方式\">\n                <button class=\"role-tab is-active\" type=\"button\" data-role-tab=\"select\" role=\"tab\" aria-selected=\"true\">可选原作角色</button>\n                <button class=\"role-tab\" type=\"button\" data-role-tab=\"custom\" role=\"tab\" aria-selected=\"false\">自己填</button>\n              </div>\n              <div class=\"role-pane\" id=\"rolePanelSelect\">\n                <p class=\"role-note\">只显示第二页已启用的作品。点一个角色，就扮演她。</p>\n                <div class=\"role-grid\" id=\"roleGrid\"></div>\n                <div class=\"role-picked\" id=\"rolePicked\"></div>\n              </div>\n              <div class=\"role-pane\" id=\"rolePanelCustom\" hidden>\n                <label class=\"pfield\">\n                  <span class=\"pfield-label\">角色名</span>\n                  <input id=\"pRoleCustom\" type=\"text\" maxlength=\"24\" placeholder=\"输入一个原著主要角色之外的名字\" autocomplete=\"off\">\n                </label>\n                <p class=\"role-note\">输入原著主要角色之外的名字，作为你在故事里的身份。</p>\n              </div>\n            </div>\n\n            <div class=\"persona-v2-actions\">\n              <button class=\"text-btn\" type=\"button\" id=\"clearPersona\">清空档案</button>\n              <button class=\"btn btn-primary btn-save\" type=\"button\" id=\"savePersona\"><span>保存档案</span><svg><use href=\"#i-save\"/></svg></button>\n            </div>\n          </div>\n\n          <aside class=\"persona-v2-preview\" aria-label=\"人物档案预览\">\n            <div class=\"persona-preview-card\" id=\"personaCard\">\n              <span class=\"pp-kicker\">GALWORLD / CHARACTER REGISTRY</span>\n              <div class=\"pp-avatar\" id=\"personaInitial\">?</div>\n              <span class=\"pp-mode\" id=\"personaPreviewMode\">SELF · 自我</span>\n              <h3 id=\"personaPreviewName\">无名旅人</h3>\n              <p class=\"pp-meta\"><span id=\"personaPreviewAge\">年龄未定</span><i></i><span id=\"personaPreviewIdentity\">身份未定</span></p>\n              <p class=\"pp-bio\" id=\"personaPreviewBackground\">你还没有写下背景。世界正在等你留下第一句话。</p>\n              <div class=\"pp-tags\" id=\"personaPreviewTags\"><span>未定</span></div>\n              <div class=\"pp-cross\" id=\"personaPreviewCross\" hidden>男扮女装 · 女装入学</div>\n              <div class=\"pp-completion\">\n                <span class=\"completion-ring\" id=\"completionRing\" style=\"--value:0\"><i></i></span>\n                <span><b id=\"completionValue\">0</b>% <small>完成度</small></span>\n              </div>\n            </div>\n            <p class=\"pp-note\">档案只保存在本地浏览器，不会上传。</p>\n          </aside>\n        </div>\n      </div>\n    </section>\n\n    <!-- ══════════════ 05 · 开局 ══════════════ -->\n    <section class=\"page page-opening page-opening-v2\" id=\"page-opening\" data-page=\"opening\" aria-label=\"开局\" hidden>\n      <div class=\"opening-v2-scroll\">\n        <header class=\"opening-v2-head\">\n          <div>\n            <p class=\"micro-label\">CHAPTER 05 · THE OPENING</p>\n            <h2>第一幕，<em>由你选。</em></h2>\n          </div>\n          <span class=\"opening-v2-persona\"><span class=\"mini-avatar\" id=\"openingMiniAvatar\">?</span><span>当前人物<br><b id=\"openingPersonaName\">尚未创建</b></span></span>\n        </header>\n\n        <section class=\"free-first\">\n          <div class=\"free-first-head\">\n            <span class=\"micro-label\">OPENING TEXT / 开场正文</span>\n            <span class=\"free-first-count\" id=\"freeCount\">0 / 800</span>\n          </div>\n          <p class=\"free-first-mode\" id=\"openingBoxMode\">来源：完全自由</p>\n          <textarea id=\"freeOpeningText\" rows=\"3\" maxlength=\"800\" placeholder=\"写清楚「你在哪里、正在做什么、第一个看见的是谁」。选预设或写个人主线时，这里会自动填上。\"></textarea>\n          <div class=\"free-first-foot\">\n            <span>这里是最终会发出去的第一幕，随时可以改。</span>\n            <button class=\"mini-btn\" type=\"button\" id=\"useFreeOpening\">用这段开场</button>\n          </div>\n        </section>\n\n        <div class=\"opening-v2-tabs\" id=\"openingV2Tabs\" role=\"tablist\" aria-label=\"开场来源\">\n          <button class=\"ov2-tab\" type=\"button\" role=\"tab\" data-open-mode=\"city\" aria-selected=\"false\"><i>①</i><span>都市模式</span></button>\n          <button class=\"ov2-tab\" type=\"button\" role=\"tab\" data-open-mode=\"person\" aria-selected=\"false\"><i>②</i><span>个人主线</span></button>\n          \n          <button class=\"ov2-tab\" type=\"button\" role=\"tab\" data-open-mode=\"plot\" aria-selected=\"false\"><i>③</i><span>剧情主线</span></button>\n          <button class=\"ov2-tab\" type=\"button\" role=\"tab\" data-open-mode=\"free\" aria-selected=\"false\"><i>④</i><span>完全自由</span></button>\n        </div>\n\n        <div class=\"opening-v2-body\">\n          <div class=\"ov2-panel\" id=\"panelCity\" hidden>\n            <p class=\"ov2-hint\">都市模式：所有作品发生在同一座城市里，地点融合成「联合都市」。先选区，再定身份、目标与第一步。</p>\n\n            <div class=\"city-zone-tabs\" id=\"cityZoneTabs\" role=\"tablist\" aria-label=\"都市区域\"></div>\n\n            <div class=\"city-steps\" id=\"citySteps\">\n<section class=\"city-first-step firststep-shell\" id=\"cityFirstStep\">\n  <div class=\"firststep-head\">\n    <div><b>你的第一步</b><small>从预设开局里选一段，或者自己写第一幕</small></div>\n    <span id=\"cityStepCount\">0 / 300</span>\n  </div>\n  <div class=\"firststep-layout\">\n    <aside class=\"firststep-side\">\n      <span class=\"firststep-side-label\">开局分类</span>\n      <div class=\"firststep-cats\" id=\"firststepCats\"></div>\n    </aside>\n    <div class=\"firststep-main\">\n      <div class=\"firststep-toolbar\"><b id=\"firststepCatTitle\">全部预设</b><span id=\"firststepPresetCount\">0 条</span><button class=\"mini-btn\" type=\"button\" id=\"firststepNew\">＋ 新建</button><button class=\"mini-btn\" type=\"button\" id=\"firststepSave\">存为预设</button></div>\n      <div class=\"firststep-presets\" id=\"firststepPresets\"></div>\n      <div class=\"firststep-editor\">\n        <textarea id=\"cityStepText\" rows=\"3\" maxlength=\"300\" placeholder=\"看着校园内人流走动，你也迈出了自己的第一步\"></textarea>\n        <div class=\"firststep-actions\">\n          <span class=\"ov2-inline-note\" id=\"cityStatusNote\">填好后点「决定完毕！」，这段会成为开场正文。</span>\n          <button class=\"mini-btn city-decide\" type=\"button\" id=\"cityDecide\">决定完毕！</button>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>\n              \n\n              \n\n              <section class=\"city-step\" data-city-step=\"area\">\n                <button class=\"city-step-head\" type=\"button\" data-city-toggle=\"area\" aria-expanded=\"false\">\n                  <span class=\"city-step-no\">①</span>\n                  <span class=\"city-step-copy\"><b>入学区域</b><small id=\"cityAreaNow\">还没选</small></span>\n                  <span class=\"city-step-arrow\"><svg><use href=\"#i-arrow\"/></svg></span>\n                </button>\n                <div class=\"city-step-body\" id=\"cityAreaBody\" hidden>\n                  <p class=\"city-area-hint\">左右两个区域，点一张卡片选择你要入学的片区。卡片上是该片区的主要角色。</p>\n                  <div class=\"city-area-grid\" id=\"cityAreaOptions\"></div>\n                </div>\n              </section>\n            </div>\n\n            \n          </div>\n\n          <div class=\"ov2-panel\" id=\"panelFree\">\n            <div class=\"ov2-preset-head\">\n              <div>\n                <b>预设开场白</b>\n                <p>点一张卡片直接使用；也可以自己写一条新的，存进预设库。</p>\n              </div>\n              <button class=\"mini-btn\" type=\"button\" id=\"savePresetBtn\">＋ 新建自定义开局</button>\n            </div>\n            <div class=\"ov2-inline-editor\" id=\"presetEditor\" hidden>\n              <label class=\"ov2-inline-field\">\n                <span>预设名</span>\n                <input id=\"presetName\" type=\"text\" maxlength=\"24\" placeholder=\"例：雨停之前的旧书店\">\n              </label>\n              <label class=\"ov2-inline-field\">\n                <span>开场正文 <i id=\"presetCount\">0 / 800</i></span>\n                <textarea id=\"presetText\" rows=\"4\" maxlength=\"800\" placeholder=\"写到第一句对话出现之前。剩下的，交给世界。\"></textarea>\n              </label>\n              <div class=\"ov2-inline-actions\">\n                <button class=\"text-btn\" type=\"button\" id=\"cancelPreset\">取消</button>\n                <button class=\"mini-btn\" type=\"button\" id=\"savePreset\">存进预设库</button>\n              </div>\n            </div>\n            <div class=\"ov2-preset-group\">\n              <span class=\"ov2-preset-label\">通用场景</span>\n              <div class=\"ov2-presets\" id=\"genericPresets\"></div>\n            </div>\n            <div class=\"ov2-preset-group\">\n              <span class=\"ov2-preset-label\">我的预设库 <i id=\"customPresetCount\">0</i></span>\n              <div class=\"ov2-presets\" id=\"customPresets\"></div>\n            </div>\n          </div>\n\n          <div class=\"ov2-panel\" id=\"panelPerson\" hidden>\n            <p class=\"ov2-hint\">按作品分组列出主要角色。点一个小头像，上面会展开这条个人主线的设定。只显示第二页已启用的作品。</p>\n            <div class=\"ov2-route\" id=\"personRoute\" hidden>\n              <div class=\"ov2-route-head\">\n                <span class=\"ov2-route-face\" id=\"personRouteFace\">?</span>\n                <div class=\"ov2-route-copy\">\n                  <b id=\"personRouteName\">个人主线</b>\n                  <span id=\"personRouteSub\"></span>\n                </div>\n                <button class=\"icon-btn ov2-route-close\" type=\"button\" id=\"closePersonRoute\" aria-label=\"收起\">×</button>\n              </div>\n              <label class=\"ov2-inline-field\">\n                <span>你与她/他的关系</span>\n                <input id=\"personRelation\" type=\"text\" maxlength=\"80\" placeholder=\"例：同班同学，坐在她后面；她记得我六年前的名字\">\n              </label>\n              <label class=\"ov2-inline-field\">\n                <span>开场白 <i id=\"personOpeningCount\">0 / 500</i></span>\n                <textarea id=\"personOpeningText\" rows=\"3\" maxlength=\"500\" placeholder=\"留空就按角色设定自动生成；也可以直接写第一幕：时间、地点、第一句话。\"></textarea>\n              </label>\n              <div class=\"ov2-inline-actions\">\n                <span class=\"ov2-inline-note\">改动会自动保存，并实时写入第六页的提示词记录。</span>\n                <button class=\"mini-btn\" type=\"button\" id=\"savePersonRoute\">用这条个人主线</button>\n              </div>\n            </div>\n            <div class=\"ov2-groups\" id=\"personOpeningList\"></div>\n          </div>\n\n          <div class=\"ov2-panel\" id=\"panelPlot\" hidden>\n            <p class=\"ov2-hint\">剧情主线按章节推进，这里先放占位章节，条目接好后会替换。</p>\n            <div class=\"ov2-groups\" id=\"plotOpeningList\"></div>\n          </div>\n        </div>\n\n        <footer class=\"opening-v2-foot\">\n          <div class=\"ov2-picked\" id=\"openingPicked\">当前选择：还没选。</div>\n          <button class=\"btn btn-primary btn-begin ov2-next\" type=\"button\" id=\"goFinal\" data-goto=\"final\">\n            <span class=\"btn-begin-label\"><small>DECIDE</small><b>决定完毕！</b></span>\n            <span class=\"btn-icon\"><svg><use href=\"#i-arrow\"/></svg></span>\n          </button>\n        </footer>\n      </div>\n    </section>\n\n    <!-- ══════════════ 06 · 开始 ══════════════ -->\n    <section class=\"page page-final\" id=\"page-final\" data-page=\"final\" aria-label=\"开始这个世界\" hidden>\n      <div class=\"final-scroll\">\n        <header class=\"final-hero\">\n          <p class=\"micro-label\">CHAPTER 06 · THE BEGINNING</p>\n          <h1>所有选择，<em>都写在这一页。</em></h1>\n          <p class=\"final-lede\">确认无误后，点击下面的按钮。世界会从这里开始回应你。</p>\n          <button class=\"btn btn-primary btn-begin final-begin\" type=\"button\" id=\"launchWorld\">\n            <span class=\"btn-begin-label\"><small>BEGIN THE STORY</small><b>开始这个世界</b></span>\n            <span class=\"btn-icon\"><svg><use href=\"#i-play\"/></svg></span>\n          </button>\n          <p class=\"final-status\" id=\"finalStatus\">正在整理你的选择…</p>\n        </header>\n\n        <section class=\"final-record\" aria-labelledby=\"finalRecordTitle\">\n          <header class=\"final-record-head\">\n            <div>\n              <p class=\"micro-label\">PROMPT RECORD / 提示词记录</p>\n              <h2 id=\"finalRecordTitle\">发给酒馆的内容</h2>\n            </div>\n            <button class=\"text-btn text-btn-bright\" type=\"button\" id=\"copyFinalPrompt\"><svg><use href=\"#i-copy\"/></svg>复制提示词</button>\n          </header>\n          <div class=\"final-meta\" id=\"finalMeta\"></div>\n          <pre class=\"final-prompt\" id=\"promptRecord\">还没有选择世界与开场。</pre>\n        </section>\n      </div>\n    </section>\n\n    \n      <div class=\"app-marquee\" aria-hidden=\"true\">\n        <div class=\"marquee-track\">\n          <span>二十二所学园</span><i>✦</i><span>二十二种相遇</span><i>✦</i><span>一百一十一个名字</span><i>✦</i><span>一本由你落笔的 2018</span><i>✦</i>\n          <span>二十二所学园</span><i>✦</i><span>二十二种相遇</span><i>✦</i><span>一百一十一个名字</span><i>✦</i><span>一本由你落笔的 2018</span><i>✦</i>\n        </div>\n      </div>\n    </main>\n\n\n  <div class=\"toast-region\" id=\"toastRegion\" aria-live=\"polite\" aria-atomic=\"true\"></div>\n\n  <!-- 启动过场 + 结果 -->\n  <div class=\"launch-layer\" id=\"launchLayer\" role=\"dialog\" aria-modal=\"true\" aria-label=\"开局过场\" hidden aria-hidden=\"true\">\n    <div class=\"launch-bg\" id=\"launchBg\"></div>\n    <div class=\"launch-grain\"></div>\n    <div class=\"launch-stage\">\n      <div class=\"launch-sigil\" id=\"launchSigil\"><span></span><span></span><span></span><svg><use href=\"#i-orbit\"/></svg></div>\n      <p class=\"launch-eyebrow\">NOW ENTERING</p>\n      <h2 class=\"launch-title\" id=\"launchTitle\">樱之诗</h2>\n      <p class=\"launch-sub\" id=\"launchSub\">正在为你装订第一幕</p>\n      <div class=\"launch-progress\"><span id=\"launchProgressBar\"></span></div>\n      <p class=\"launch-log\" id=\"launchLog\">连接世界书 · 校验人物档案 · 安放时间锚点</p>\n    </div>\n    <div class=\"launch-result\" id=\"launchResult\" hidden>\n      <div class=\"launch-result-top\">\n        <span class=\"micro-label\">OPENING DOSSIER / 开局档案</span>\n        <button class=\"icon-btn\" type=\"button\" id=\"closeLaunch\" aria-label=\"关闭\"><svg><use href=\"#i-close\"/></svg></button>\n      </div>\n      <div class=\"result-seal\"><span>序</span></div>\n      <p class=\"result-kicker\" id=\"resultKicker\">SAKURA NO UTA · 2018</p>\n      <h2 id=\"resultTitle\">第一幕，已经装订。</h2>\n      <div class=\"result-dossier\">\n        <div class=\"result-meta\" id=\"resultMeta\"></div>\n        <p id=\"resultText\"></p>\n      </div>\n      <div class=\"result-actions\"><button class=\"btn btn-primary\" type=\"button\" id=\"sendToTavern\"><span>送入酒馆并开始</span><svg><use href=\"#i-arrow\"/></svg></button><button class=\"btn btn-ghost\" type=\"button\" id=\"copyOpening\"><svg><use href=\"#i-copy\"/></svg><span>复制开局文本</span></button><button class=\"btn btn-ghost\" type=\"button\" id=\"downloadOpening\"><svg><use href=\"#i-download\"/></svg><span>下载 .txt</span></button><button class=\"text-btn\" type=\"button\" id=\"editAfterLaunch\">再挑一次</button></div></div></div>\n\n  \n  \n";
  const APP_CSS = "/* ==========================================================================\n   GALWORLD · 世界之书\n   A hand-built visual novel world hub\n   ========================================================================== */\n\n/* ---------- Tokens ---------- */\n:host, .gw-app {\n  --ink-0: #06080e;\n  --ink-1: #090d16;\n  --ink-2: #0d1320;\n  --ink-3: #121a29;\n  --paper: #f4f0e7;\n  --paper-soft: #e8e2d8;\n  --muted: rgba(239, 234, 224, .57);\n  --muted-2: rgba(239, 234, 224, .37);\n  --line: rgba(241, 235, 223, .12);\n  --line-strong: rgba(241, 235, 223, .22);\n  --rose: #ff92a8;\n  --rose-deep: #d76080;\n  --violet: #a89bff;\n  --cyan: #7ce7da;\n  --gold: #e7c48b;\n  --blue: #87a8ff;\n  --danger: #ff7f86;\n  --font-display: \"Noto Serif SC\", \"Source Han Serif SC\", \"Songti SC\", \"STSong\", \"SimSun\", Georgia, serif;\n  --font-sans: \"Noto Sans SC\", \"Source Han Sans CN\", \"PingFang SC\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif;\n  --font-latin: \"Avenir Next\", \"Futura\", \"Helvetica Neue\", \"Segoe UI\", sans-serif;\n  --font-mono: \"SFMono-Regular\", \"Cascadia Code\", \"Consolas\", monospace;\n  --ease-out: cubic-bezier(.16, 1, .3, 1);\n  --ease-soft: cubic-bezier(.4, 0, .2, 1);\n  --radius-xs: 8px;\n  --radius-sm: 12px;\n  --radius-md: 18px;\n  --radius-lg: 26px;\n  --radius-xl: 34px;\n  --shell: 1480px;\n  --gutter: clamp(18px, 3.2vw, 48px);\n  --header-h: 92px;\n}\n\n/* ---------- Reset ---------- */\n*, *::before, *::after { box-sizing: border-box; }\n\n.gw-app {\n  margin: 0;\n  min-width: 320px;\n  color: var(--paper);\n  background: var(--ink-0);\n  font-family: var(--font-sans);\n  font-size: 15px;\n  line-height: 1.7;\n  -webkit-font-smoothing: antialiased;\n  text-rendering: optimizeLegibility;\n  overflow-x: hidden;\n}\n.gw-app::before {\n  content: \"\";\n  position: fixed;\n  inset: 0;\n  z-index: -5;\n  background:\n    radial-gradient(ellipse at 10% 0%, rgba(93, 76, 138, .24), transparent 42%),\n    radial-gradient(ellipse at 84% 12%, rgba(180, 76, 104, .13), transparent 40%),\n    linear-gradient(145deg, #080b12 0%, #0a0f19 48%, #06080f 100%);\n}\nbutton, input, textarea, select { font: inherit; color: inherit; }\nbutton { border: 0; background: none; cursor: pointer; }\na { color: inherit; text-decoration: none; }\nh1, h2, h3, h4, p { margin: 0; }\nimg, svg { display: block; }\n::selection { background: rgba(255, 146, 168, .28); color: #fff; }\n:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }\n[hidden] { display: none !important; }\n.svg-sprite { position: absolute; width: 0; height: 0; overflow: hidden; }\n.svg-sprite symbol { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }\n\n.skip-link {\n  position: fixed; top: 12px; left: 12px; z-index: 1000;\n  padding: 10px 18px; border-radius: 999px;\n  background: var(--paper); color: var(--ink-1); font-weight: 700;\n  transform: translateY(-180%); transition: transform .2s;\n}\n.skip-link:focus { transform: none; }\n\n/* ---------- Ambient stage ---------- */\n.ambient { position: fixed; inset: 0; z-index: -4; overflow: hidden; pointer-events: none; }\n.ambient-orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .52; mix-blend-mode: screen; }\n.ambient-orb-a { width: 54vw; height: 54vw; top: -22vw; left: -12vw; background: radial-gradient(circle, rgba(80, 91, 172, .38), transparent 65%); animation: orbFloat 22s ease-in-out infinite alternate; }\n.ambient-orb-b { width: 44vw; height: 44vw; bottom: -18vw; right: -12vw; background: radial-gradient(circle, rgba(176, 82, 108, .25), transparent 66%); animation: orbFloat 28s -8s ease-in-out infinite alternate-reverse; }\n.ambient-orb-c { width: 26vw; height: 26vw; top: 38%; left: 55%; background: radial-gradient(circle, rgba(80, 155, 163, .16), transparent 70%); animation: orbFloat 35s -14s ease-in-out infinite alternate; }\n@keyframes orbFloat { 0% { transform: translate3d(-2%, -1%, 0) scale(.94); } 100% { transform: translate3d(4%, 3%, 0) scale(1.08); } }\n.ambient-grid {\n  position: absolute; inset: 0; opacity: .11;\n  background-image:\n    linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),\n    linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);\n  background-size: 120px 120px;\n  mask-image: radial-gradient(ellipse at center, #000 10%, transparent 72%);\n  -webkit-mask-image: radial-gradient(ellipse at center, #000 10%, transparent 72%);\n  transform: perspective(900px) rotateX(52deg) scale(1.4) translateY(22%);\n  transform-origin: center bottom;\n}\n#dustCanvas { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .65; }\n.grain {\n  position: absolute; inset: -50%;\n  opacity: .045;\n  background-image: url(\"data:image/svg+xml;utf8,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\");\n  animation: grainShift .9s steps(3) infinite;\n}\n@keyframes grainShift {\n  0% { transform: translate(0,0); } 33% { transform: translate(-2%,1%); } 66% { transform: translate(1%,-1%); } 100% { transform: translate(0,0); }\n}\n.cursor-glow {\n  position: fixed; z-index: 0; width: 520px; height: 520px; margin: -260px 0 0 -260px;\n  border-radius: 50%; pointer-events: none;\n  background: radial-gradient(circle, rgba(216, 132, 160, .075), transparent 68%);\n  opacity: 0; transition: opacity .5s;\n  will-change: transform;\n}\n@media (pointer: fine) { .cursor-glow { opacity: 1; } }\n\n/* ---------- Shared type ---------- */\n.eyebrow {\n  display: flex; align-items: center; gap: 10px;\n  color: var(--muted); font-family: var(--font-latin); font-size: 10px;\n  font-weight: 700; letter-spacing: .22em; text-transform: uppercase;\n}\n.eyebrow-dot { width: 5px; height: 5px; flex: 0 0 auto; border-radius: 50%; background: var(--rose); box-shadow: 0 0 12px var(--rose); }\n.micro-label { display: block; color: var(--muted-2); font-family: var(--font-latin); font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }\n.page-head { max-width: var(--shell); margin: 0 auto; padding: clamp(44px, 6vw, 94px) var(--gutter) clamp(30px, 4vw, 52px); display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; }\n.page-head-copy { max-width: 780px; }\n.page-title {\n  margin-top: 18px; color: var(--paper);\n  font-family: var(--font-display); font-size: clamp(38px, 5.2vw, 72px);\n  font-weight: 600; line-height: 1.18; letter-spacing: -.035em;\n}\n.page-title em { color: var(--rose); font-style: normal; position: relative; white-space: nowrap; }\n.page-title em::after { content: \"\"; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: linear-gradient(90deg, transparent, var(--rose), transparent); opacity: .55; }\n.page-desc { max-width: 610px; margin-top: 17px; color: var(--muted); font-size: 13px; line-height: 1.95; letter-spacing: .025em; }\n.page-head-aside { flex: 0 0 auto; min-height: 64px; display: flex; align-items: center; gap: 22px; padding-bottom: 6px; }\n.page-head-rule { width: 1px; height: 48px; background: linear-gradient(transparent, var(--line-strong), transparent); }\n.page-head-note { color: var(--muted-2); font-size: 10px; line-height: 1.75; letter-spacing: .08em; }\n.page-head-note i { color: var(--rose); font-style: normal; }\n.page { position: relative; z-index: 1; min-height: calc(100vh - var(--header-h)); }\n.page.is-active { animation: pageEnter .7s var(--ease-out) both; }\n@keyframes pageEnter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }\n.page-fade { position: fixed; inset: 0; z-index: 80; pointer-events: none; background: var(--ink-0); opacity: 0; }\n.page-fade.is-on { animation: fadeThrough .55s var(--ease-soft) both; }\n@keyframes fadeThrough { 0% { opacity: 0; } 45% { opacity: .9; } 100% { opacity: 0; } }\n.reveal { opacity: 0; transform: translateY(22px); transition: opacity .85s var(--ease-out), transform .85s var(--ease-out); }\n.reveal.in { opacity: 1; transform: none; }\n@media (prefers-reduced-motion: reduce) {\n  \n  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }\n  .reveal { opacity: 1; transform: none; }\n  #dustCanvas, .grain { display: none; }\n}\n\n/* ---------- Header ---------- */\n.site-header {\n  position: sticky; top: 0; z-index: 70;\n  background: linear-gradient(180deg, rgba(6,8,14,.9), rgba(6,8,14,.68) 72%, transparent);\n  -webkit-backdrop-filter: blur(18px) saturate(1.2);\n  backdrop-filter: blur(18px) saturate(1.2);\n}\n.nav-shell {\n  max-width: 1580px; height: var(--header-h); margin: 0 auto; padding: 0 clamp(16px, 2.6vw, 44px);\n  display: flex; align-items: center; gap: 28px;\n}\n.brand { display: flex; align-items: center; gap: 11px; flex: 0 0 auto; min-width: 184px; }\n.brand-mark { width: 38px; height: 38px; color: var(--paper); }\n.brand-mark svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: .85; opacity: .85; }\n.brand-mark .mark-star { fill: var(--rose); stroke: none; filter: drop-shadow(0 0 4px rgba(255,146,168,.8)); }\n.brand-type { display: flex; flex-direction: column; line-height: 1; }\n.brand-en { font-family: var(--font-latin); font-size: 14px; font-weight: 800; letter-spacing: .26em; }\n.brand-cn { margin-top: 7px; color: var(--muted); font-family: var(--font-display); font-size: 10px; letter-spacing: .34em; }\n.site-nav { position: relative; display: flex; align-self: stretch; align-items: center; justify-content: center; flex: 1 1 auto; gap: 2px; min-width: 0; }\n.nav-glider {\n  position: absolute; z-index: 0; top: 12px; bottom: 12px; left: 0; width: 92px;\n  border-radius: 999px; border: 1px solid rgba(255,255,255,.08);\n  background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025));\n  box-shadow: 0 0 0 1px rgba(255,255,255,.02) inset, 0 8px 26px rgba(0,0,0,.22);\n  transition: transform .55s var(--ease-out), width .55s var(--ease-out);\n  pointer-events: none;\n}\n.nav-glider::after { content: \"\"; position: absolute; left: 50%; bottom: -1px; width: 18px; height: 1px; transform: translateX(-50%); background: var(--rose); box-shadow: 0 0 10px var(--rose); }\n.nav-link {\n  position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 6px;\n  min-width: 92px; align-self: stretch; padding: 2px 15px 0; color: var(--muted-2); white-space: nowrap;\n  transition: color .25s;\n}\n.nav-link:hover { color: var(--paper); }\n.nav-link.is-active { color: var(--paper); }\n.nav-num { color: var(--muted-2); font-family: var(--font-mono); font-size: 8.5px; letter-spacing: .03em; align-self: center; transition: color .25s; }\n.nav-link.is-active .nav-num { color: var(--rose); }\n.nav-cn { font-family: var(--font-display); font-size: 15px; letter-spacing: .14em; }\n.nav-en { display: none; }\n.nav-meta { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; color: var(--muted-2); font-family: var(--font-latin); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; }\n.save-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 9px rgba(124,231,218,.8); }\n.nav-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--line); }\n.nav-progress span { display: block; width: 0; height: 100%; background: linear-gradient(90deg, transparent, var(--rose), var(--violet), transparent); transition: width .8s var(--ease-out); }\n\n/* ---------- Buttons ---------- */\n.btn {\n  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 16px;\n  min-height: 52px; padding: 4px 6px 4px 24px; border-radius: 999px;\n  font-family: var(--font-sans); font-size: 12px; font-weight: 700; letter-spacing: .08em;\n  transition: transform .3s var(--ease-out), background .3s, border-color .3s, color .3s, box-shadow .3s;\n}\n.btn:hover { transform: translateY(-2px); }\n.btn:active { transform: translateY(0); }\n.btn-primary {\n  border: 1px solid rgba(255,255,255,.14);\n  background: linear-gradient(120deg, #f3d9d2, #ffb4c1 45%, #c2b2ff);\n  color: #221822;\n  box-shadow: 0 10px 38px rgba(232, 126, 151, .16), 0 1px 0 rgba(255,255,255,.55) inset;\n}\n.btn-primary:hover { box-shadow: 0 14px 46px rgba(232, 126, 151, .26), 0 1px 0 rgba(255,255,255,.7) inset; }\n.btn-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: rgba(16,11,17,.9); color: var(--paper); transition: transform .35s var(--ease-out); }\n.btn:hover .btn-icon { transform: rotate(-18deg); }\n.btn-icon svg, .btn > svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }\n.btn-ghost { padding: 0 22px; border: 1px solid var(--line-strong); color: var(--paper); background: rgba(255,255,255,.025); overflow: hidden; }\n.btn-ghost:hover { border-color: rgba(255,255,255,.36); background: rgba(255,255,255,.055); }\n.btn-ghost .btn-inline-icon { width: 14px; height: 14px; fill: currentColor; }\n.btn-glow { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); transform: translateX(-100%); transition: transform .6s var(--ease-out); }\n.btn-ghost:hover .btn-glow { transform: translateX(100%); }\n.btn-small { min-height: 38px; padding: 0 14px; font-size: 10.5px; gap: 8px; }\n.btn-small svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.text-btn { display: inline-flex; align-items: center; gap: 6px; padding: 2px 0; color: var(--muted); font-size: 11px; letter-spacing: .06em; border-bottom: 1px solid var(--line); transition: color .2s, border-color .2s; }\n.text-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.text-btn svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.6; }\n.text-btn-bright { color: var(--paper); border-color: var(--line-strong); }\n.round-arrow { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 50%; display: grid; place-items: center; transition: transform .4s var(--ease-out), background .3s, border-color .3s; }\n.round-arrow svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.index-card:hover .round-arrow { transform: rotate(-35deg); background: var(--paper); color: var(--ink-1); border-color: var(--paper); }\n.icon-btn { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--line); color: var(--muted); transition: color .2s, border-color .2s, background .2s; }\n.icon-btn:hover { color: var(--paper); border-color: var(--line-strong); background: rgba(255,255,255,.05); }\n.icon-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n\n/* ==========================================================================\n   01 · HOME\n   ========================================================================== */\n.page-home { padding: 0 var(--gutter); }\n.home-hero { max-width: var(--shell); margin: 0 auto; min-height: calc(100vh - var(--header-h) - 30px); display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(380px, .98fr); align-items: center; gap: clamp(30px, 5vw, 90px); padding: clamp(40px, 6vh, 80px) 0 clamp(60px, 8vh, 100px); }\n.home-copy { position: relative; z-index: 2; max-width: 710px; }\n.hero-title { margin-top: clamp(22px, 3.5vh, 34px); font-family: var(--font-display); font-weight: 600; font-size: clamp(52px, 6.5vw, 102px); line-height: 1.08; letter-spacing: -.052em; }\n.title-line { display: block; }\n.title-soft { margin-left: clamp(20px, 4.8vw, 78px); color: transparent; background: linear-gradient(100deg, #f4f0e7 8%, #d8c9c6 48%, #a9a3c5 100%); -webkit-background-clip: text; background-clip: text; }\n.title-accent { color: var(--rose); position: relative; }\n.title-accent::before { content: \"\"; position: absolute; left: -18px; top: .32em; width: 7px; height: 7px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 16px var(--cyan); }\n.title-dot { color: var(--cyan); }\n.hero-lede { max-width: 470px; margin-top: clamp(24px, 3.4vh, 38px); color: var(--muted); font-family: var(--font-display); font-size: clamp(13px, 1.15vw, 15px); line-height: 2.1; letter-spacing: .03em; }\n.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; }\n.hero-stats { display: flex; align-items: center; gap: 20px; margin-top: clamp(34px, 5vh, 58px); }\n.stat { display: flex; align-items: baseline; gap: 8px; }\n.stat b { color: var(--paper); font-family: var(--font-display); font-size: 24px; font-weight: 500; line-height: 1; }\n.stat span { color: var(--muted-2); font-size: 9.5px; letter-spacing: .1em; }\n.stat-sep { width: 1px; height: 18px; background: var(--line); }\n\n.home-visual { position: relative; min-height: 620px; display: flex; align-items: center; justify-content: center; }\n.hero-frame { position: relative; width: min(100%, 500px); aspect-ratio: 4/5; border: 1px solid rgba(231,196,139,.32); border-radius: 52% 52% 10px 10px / 32% 32% 10px 10px; padding: 11px; transform: rotate(1.2deg); background: linear-gradient(150deg, rgba(255,255,255,.09), rgba(255,255,255,.01) 48%, rgba(255,146,168,.08)); box-shadow: 0 50px 100px rgba(0,0,0,.45), 0 0 80px rgba(135,110,180,.12); }\n.hero-frame::before { content: \"\"; position: absolute; inset: 5px; border: 1px solid rgba(255,255,255,.09); border-radius: inherit; pointer-events: none; z-index: 3; }\n.hero-frame-inner { position: relative; height: 100%; overflow: hidden; border-radius: 50% 50% 7px 7px / 30% 30% 7px 7px; background: #111725; }\n.hero-art { width: 100%; height: 100%; object-fit: cover; opacity: .95; transform: scale(1.015); transition: transform 1.8s var(--ease-out); }\n.hero-frame:hover .hero-art { transform: scale(1.06); }\n.hero-art-fallback { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(circle at 62% 28%, rgba(255,218,207,.48), transparent 17%), linear-gradient(160deg, #3a3148, #1b2233 46%, #0c111d); }\n.fallback-moon { position: absolute; width: 38%; aspect-ratio: 1; border-radius: 50%; top: 14%; right: 12%; background: radial-gradient(circle at 35% 35%, #fff7e6, #e8c7b9 58%, #8c778e); box-shadow: 0 0 60px rgba(255,227,215,.25); opacity: .86; }\n.fallback-arch { position: absolute; left: 16%; right: 16%; bottom: 0; height: 48%; border: 1px solid rgba(255,255,255,.18); border-bottom: none; border-radius: 45% 45% 0 0; box-shadow: 0 0 80px rgba(255,255,255,.07) inset; }\n.fallback-petal { position: absolute; width: 10px; height: 16px; border-radius: 70% 30% 70% 30%; background: rgba(255,186,198,.6); }\n.fallback-petal.p1 { top: 34%; left: 28%; transform: rotate(35deg); }\n.fallback-petal.p2 { top: 60%; right: 20%; transform: rotate(-14deg) scale(.7); }\n.fallback-petal.p3 { top: 18%; left: 48%; transform: rotate(70deg) scale(.5); }\n.hero-frame-wash { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,9,15,.02) 30%, rgba(7,9,15,.32) 70%, rgba(7,9,15,.85)); }\n.hero-frame-copy { position: absolute; left: 26px; right: 26px; bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }\n.vertical-jp { writing-mode: vertical-rl; color: rgba(244,240,231,.65); font-family: var(--font-display); font-size: 10px; letter-spacing: .28em; }\n.hero-frame-index { color: rgba(244,240,231,.4); font-family: var(--font-mono); font-size: 8px; letter-spacing: .16em; }\n.hero-frame-corner { position: absolute; width: 30px; height: 30px; z-index: 4; opacity: .7; }\n.hero-frame-corner.tl { top: 22px; left: 22px; border-top: 1px solid var(--gold); border-left: 1px solid var(--gold); border-radius: 12px 0 0 0; }\n.hero-frame-corner.br { bottom: 22px; right: 22px; border-bottom: 1px solid var(--gold); border-right: 1px solid var(--gold); border-radius: 0 0 12px 0; }\n.float-card { position: absolute; z-index: 5; -webkit-backdrop-filter: blur(18px) saturate(1.2); backdrop-filter: blur(18px) saturate(1.2); border: 1px solid rgba(255,255,255,.13); background: rgba(19,23,34,.62); box-shadow: 0 25px 60px rgba(0,0,0,.3); }\n.float-card-a { left: -20px; bottom: 17%; width: 170px; padding: 15px 16px 13px; border-radius: 3px 18px 18px 18px; animation: floatCard 7s ease-in-out infinite; }\n.float-card-index { display: block; color: var(--rose); font-family: var(--font-mono); font-size: 9px; letter-spacing: .12em; }\n.float-card-name { display: block; margin-top: 12px; font-family: var(--font-display); font-size: 21px; letter-spacing: .14em; }\n.float-card-sub { display: block; margin-top: 4px; color: var(--muted-2); font-family: var(--font-latin); font-size: 7.5px; letter-spacing: .2em; }\n.float-card-line { display: block; width: 28px; height: 1px; margin-top: 14px; background: var(--gold); }\n.float-card-b { right: -32px; top: 13%; width: 208px; padding: 14px 16px 15px; border-radius: 16px 3px 16px 16px; animation: floatCard 8s -2s ease-in-out infinite; }\n.float-card-label { color: var(--muted-2); font-family: var(--font-latin); font-size: 7.5px; font-weight: 700; letter-spacing: .18em; }\n.float-card-quote { display: block; margin-top: 8px; color: rgba(244,240,231,.84); font-family: var(--font-display); font-size: 12px; line-height: 1.8; transition: opacity .28s ease; }\n@keyframes floatCard { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-9px) rotate(.4deg); } }\n.hero-orbit { position: absolute; border: 1px solid rgba(255,255,255,.08); border-radius: 50%; pointer-events: none; }\n.hero-orbit-a { width: 640px; height: 190px; transform: rotate(-34deg); }\n.hero-orbit-b { width: 620px; height: 110px; transform: rotate(42deg); border-color: rgba(255,146,168,.12); }\n.hero-coord { position: absolute; left: 10px; bottom: 2%; color: var(--muted-2); font-family: var(--font-mono); font-size: 7.5px; letter-spacing: .12em; writing-mode: vertical-rl; }\n.home-marquee { max-width: none; margin: 0 calc(var(--gutter) * -1); overflow: hidden; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }\n.marquee-track { display: flex; align-items: center; gap: 28px; width: max-content; padding: 15px 0; animation: marquee 32s linear infinite; }\n.marquee-track span { color: var(--muted-2); font-family: var(--font-display); font-size: 11px; letter-spacing: .24em; white-space: nowrap; }\n.marquee-track i { color: var(--rose); font-size: 8px; font-style: normal; opacity: .65; }\n@keyframes marquee { to { transform: translateX(-50%); } }\n.home-index { max-width: var(--shell); margin: 0 auto; padding: clamp(70px, 9vh, 120px) 0 0; }\n.home-index-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; margin-bottom: 32px; }\n.home-index-head h2 { margin-top: 12px; font-family: var(--font-display); font-size: clamp(30px, 3.2vw, 46px); font-weight: 500; letter-spacing: -.03em; }\n.home-index-desc { color: var(--muted); font-size: 11.5px; line-height: 1.9; text-align: right; }\n.index-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }\n.index-card {\n  position: relative; grid-column: span 3; min-height: 355px; padding: 24px 26px 22px; overflow: hidden;\n  display: flex; flex-direction: column; text-align: left; align-items: flex-start;\n  border: 1px solid var(--line); border-radius: var(--radius-md);\n  background: linear-gradient(145deg, rgba(255,255,255,.052), rgba(255,255,255,.015));\n  transition: transform .55s var(--ease-out), border-color .35s, background .35s;\n}\n.index-card:nth-child(2) { grid-column: span 2; }\n.index-card:nth-child(3) { grid-column: span 2; }\n.index-card:nth-child(4) { grid-column: span 3; }\n.index-card:hover { transform: translateY(-6px); border-color: rgba(255,255,255,.24); background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.02)); }\n.index-card::after { content: \"\"; position: absolute; inset: 0; background: radial-gradient(circle at 86% 100%, color-mix(in srgb, var(--card-accent, var(--rose)) 15%, transparent), transparent 48%); pointer-events: none; opacity: .8; }\n.index-card-wide { background: linear-gradient(145deg, rgba(255,146,168,.08), rgba(255,255,255,.018) 56%, rgba(168,155,255,.06)); }\n.index-card-bg { position: absolute; inset: 0; opacity: .18; background: radial-gradient(circle at 100% 0%, rgba(255,255,255,.18), transparent 44%); }\n.index-card-top { position: relative; z-index: 2; display: flex; justify-content: space-between; width: 100%; color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .17em; }\n.index-card-body { position: relative; z-index: 2; display: flex; flex-direction: column; margin-top: auto; max-width: 55%; }\n.index-icon { position: absolute; z-index: 2; top: 24px; right: 25px; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--line); color: var(--muted); }\n.index-icon svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.4; }\n.index-kicker { color: var(--rose); font-size: 10px; letter-spacing: .18em; }\n.index-title { margin-top: 9px; font-family: var(--font-display); font-size: clamp(27px, 2.4vw, 37px); font-weight: 500; line-height: 1.28; letter-spacing: -.025em; }\n.index-desc { max-width: 310px; margin-top: 13px; color: var(--muted); font-size: 10.5px; line-height: 1.85; }\n.index-card-foot { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 25px; color: var(--muted-2); font-family: var(--font-latin); font-size: 7.5px; letter-spacing: .16em; }\n.index-cover-stack { position: absolute; z-index: 1; width: 230px; height: 275px; right: 8%; bottom: 4%; }\n.mini-cover { position: absolute; width: 146px; aspect-ratio: 3/4; background-size: cover; background-position: center; background-color: #1c2030; border: 1px solid rgba(255,255,255,.17); border-radius: 4px; box-shadow: 0 24px 42px rgba(0,0,0,.34); transition: transform .7s var(--ease-out); }\n.mc1 { left: 0; top: 50px; transform: rotate(-12deg); }\n.mc2 { left: 49px; top: 20px; transform: rotate(1deg); z-index: 2; }\n.mc3 { left: 98px; top: 70px; transform: rotate(13deg); }\n.index-card:hover .mc1 { transform: rotate(-17deg) translate(-5px, -3px); }\n.index-card:hover .mc2 { transform: rotate(0) translateY(-7px); }\n.index-card:hover .mc3 { transform: rotate(18deg) translate(5px, -3px); }\n.home-footer { max-width: var(--shell); margin: 0 auto; padding: 58px 0 34px; display: flex; justify-content: space-between; border-top: 1px solid var(--line); margin-top: 80px; color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; letter-spacing: .16em; }\n\n/* ==========================================================================\n   02 · ARCHIVE\n   ========================================================================== */\n.page-archive { padding-bottom: 80px; }\n.archive-total { display: flex; align-items: center; gap: 11px; }\n.archive-total b { color: var(--paper); font-family: var(--font-display); font-size: 46px; font-weight: 500; line-height: 1; }\n.archive-total span { color: var(--muted-2); font-family: var(--font-latin); font-size: 7.5px; font-weight: 700; line-height: 1.55; letter-spacing: .16em; }\n.archive {\n  max-width: var(--shell); margin: 0 auto; padding: 0 var(--gutter);\n  display: flex; align-items: stretch; gap: 14px;\n  transition: gap .5s var(--ease-out);\n  scroll-margin-top: calc(var(--header-h) + 16px);\n}\n.library {\n  position: relative; flex: 0 0 42%; min-width: 0; min-height: 790px;\n  padding: 20px 20px 0; overflow: hidden;\n  border: 1px solid var(--line); border-radius: var(--radius-lg);\n  background: linear-gradient(160deg, rgba(255,255,255,.045), rgba(255,255,255,.012) 60%);\n  transition: flex-basis .75s var(--ease-out), background .4s;\n}\n.library::before { content: \"\"; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 20% 0%, rgba(168,155,255,.08), transparent 40%); }\n.library-main { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; transition: opacity .25s ease; }\n.library-toolbar { display: flex; gap: 10px; }\n.search-box { flex: 1; display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 0 15px; border: 1px solid var(--line); border-radius: 12px; background: rgba(3,6,12,.28); transition: border-color .2s, background .2s; }\n.search-box:focus-within { border-color: rgba(255,146,168,.55); background: rgba(3,6,12,.46); }\n.search-box svg { width: 15px; height: 15px; flex: 0 0 auto; fill: none; stroke: var(--muted); stroke-width: 1.5; }\n.search-box input { width: 100%; min-width: 0; border: 0; outline: none; background: transparent; color: var(--paper); font-size: 12px; }\n.search-box input::placeholder { color: var(--muted-2); }\n.search-box kbd { flex: 0 0 auto; padding: 2px 5px; border: 1px solid var(--line); border-radius: 4px; color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; }\n.filter-bar { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 14px; }\n.filter-chip { display: inline-flex; align-items: center; gap: 5px; min-height: 27px; padding: 0 10px; border: 1px solid transparent; border-radius: 999px; color: var(--muted-2); font-family: var(--font-latin); font-size: 9px; font-weight: 700; letter-spacing: .09em; transition: all .22s; }\n.filter-chip span { opacity: .5; font-family: var(--font-mono); font-size: 7px; }\n.filter-chip:hover { color: var(--paper); background: rgba(255,255,255,.04); }\n.filter-chip.is-active { border-color: rgba(255,255,255,.17); background: rgba(255,255,255,.085); color: var(--paper); }\n.filter-chip.is-active span { opacity: .85; color: var(--rose); }\n.library-title { display: flex; justify-content: space-between; align-items: center; margin: 24px 1px 12px; color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }\n.library-title span:first-child { display: flex; align-items: center; gap: 8px; color: var(--muted); }\n.library-title i { width: 16px; height: 1px; background: var(--rose); }\n.work-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }\n.work-card {\n  position: relative; aspect-ratio: .72; overflow: hidden; border-radius: 11px;\n  border: 1px solid rgba(255,255,255,.12); text-align: left; isolation: isolate;\n  transition: transform .45s var(--ease-out), border-color .3s, box-shadow .35s;\n}\n.work-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.3); box-shadow: 0 18px 32px rgba(0,0,0,.3); }\n.work-card.is-selected { border-color: var(--rose); box-shadow: 0 0 0 1px var(--rose), 0 16px 36px rgba(0,0,0,.35); }\n.work-card-bg { position: absolute; inset: 0; background-size: cover; background-position: center; transform: scale(1.01); transition: transform .7s var(--ease-out), filter .35s; }\n.work-card:hover .work-card-bg { transform: scale(1.06); }\n.work-card::after { content: \"\"; position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(3,5,10,.06) 24%, rgba(3,5,10,.4) 58%, rgba(3,5,10,.9) 100%); }\n.work-card.is-dim { opacity: .32; filter: grayscale(.35); }\n.work-card-top { position: absolute; z-index: 2; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: flex-start; }\n.work-card-index { color: rgba(255,255,255,.76); font-family: var(--font-mono); font-size: 9px; letter-spacing: .08em; text-shadow: 0 1px 8px rgba(0,0,0,.45); }\n.work-card-state { display: inline-flex; align-items: center; gap: 4px; padding: 3px 6px; border-radius: 4px; background: rgba(3,6,12,.5); color: rgba(255,255,255,.6); font-family: var(--font-latin); font-size: 6.5px; font-weight: 700; letter-spacing: .1em; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }\n.work-card-state::before { content: \"\"; width: 3px; height: 3px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 6px var(--cyan); }\n.work-card-bottom { position: absolute; z-index: 2; left: 12px; right: 12px; bottom: 11px; }\n.work-card-title { display: block; color: #fff; font-family: var(--font-display); font-size: 13px; font-weight: 500; line-height: 1.35; letter-spacing: .02em; text-shadow: 0 2px 10px rgba(0,0,0,.55); }\n.work-card-sub { display: block; margin-top: 3px; color: rgba(255,255,255,.55); font-family: var(--font-latin); font-size: 6px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.work-card-tags { display: flex; gap: 3px; margin-top: 7px; }\n.work-card-tags span { padding: 2px 4px; border: 1px solid rgba(255,255,255,.16); border-radius: 2px; color: rgba(255,255,255,.58); font-size: 6px; letter-spacing: .03em; }\n.library-empty { padding: 38px 10px; text-align: center; color: var(--muted); }\n.empty-orbit { display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto 14px; border: 1px solid var(--line); border-radius: 50%; color: var(--rose); }\n.empty-orbit svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.3; }\n.library-empty p { margin-bottom: 10px; font-size: 12px; }\n.library-foot { display: flex; align-items: flex-end; gap: 12px; margin: auto -20px 0; padding: 22px 20px 18px; border-top: 1px solid var(--line); }\n.library-foot-line { flex: 0 0 20px; height: 1px; margin-bottom: 8px; background: var(--gold); }\n.library-foot p { color: var(--muted-2); font-family: var(--font-display); font-size: 9.5px; line-height: 1.8; letter-spacing: .08em; }\n.library-foot-index { margin-left: auto; color: var(--muted-2); font-family: var(--font-mono); font-size: 6.5px; letter-spacing: .12em; writing-mode: vertical-rl; }\n.library-spine { position: absolute; inset: 0; z-index: 2; padding: 14px 9px 16px; display: flex; flex-direction: column; align-items: center; opacity: 0; pointer-events: none; transition: opacity .25s .12s ease; }\n.spine-back { width: 37px; height: 37px; display: grid; place-items: center; margin-bottom: 13px; border: 1px solid var(--line-strong); border-radius: 50%; color: var(--paper); transition: background .2s, transform .25s; }\n.spine-back:hover { background: var(--paper); color: var(--ink-1); transform: translateX(-2px); }\n.spine-back svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.spine-list { display: flex; flex-direction: column; gap: 8px; width: 100%; overflow-y: auto; scrollbar-width: none; }\n.spine-list::-webkit-scrollbar { display: none; }\n.spine-thumb { position: relative; width: 100%; aspect-ratio: .58; padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 5px; background-size: cover; background-position: center; opacity: .42; filter: grayscale(.5); transition: opacity .25s, filter .25s, transform .25s, border-color .25s; }\n.spine-thumb:hover { opacity: .85; filter: grayscale(0); transform: scale(1.03); }\n.spine-thumb.is-selected { opacity: 1; filter: none; border-color: var(--rose); box-shadow: 0 0 0 1px var(--rose); }\n.spine-caption { margin-top: auto; padding-top: 12px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .2em; writing-mode: vertical-rl; }\n.spine-count { margin-top: 8px; color: var(--rose); font-family: var(--font-mono); font-size: 7px; }\n.archive.is-focused .library { flex-basis: 86px; background: rgba(255,255,255,.025); }\n.archive.is-focused .library-main { opacity: 0; pointer-events: none; position: absolute; inset: 0; }\n.archive.is-focused .library-spine { opacity: 1; pointer-events: auto; }\n.archive.is-focused .work-detail { flex-basis: calc(100% - 100px); }\n.work-detail {\n  position: relative; flex: 1 1 auto; min-width: 0; min-height: 790px; overflow: hidden;\n  border: 1px solid var(--line); border-radius: var(--radius-lg);\n  background: #0b0f19;\n  transition: flex-basis .75s var(--ease-out);\n  scroll-margin-top: calc(var(--header-h) + 14px);\n}\n.work-detail-loading { height: 100%; min-height: 790px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; color: var(--muted-2); font-size: 11px; letter-spacing: .12em; }\n.loading-sigil { width: 52px; height: 52px; color: var(--rose); animation: spin 8s linear infinite; }\n.loading-sigil svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1; }\n@keyframes spin { to { transform: rotate(360deg); } }\n\n/* Work detail */\n.detail-surface { position: relative; z-index: 1; min-height: 790px; display: flex; flex-direction: column; }\n.detail-backdrop { position: absolute; inset: 0; z-index: -2; overflow: hidden; }\n.detail-backdrop-img { position: absolute; inset: -8%; background-size: cover; background-position: center 30%; filter: blur(28px) saturate(1.1); opacity: .33; transform: scale(1.1); }\n.detail-backdrop::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(9,12,20,.45), #0a0e17 45%, #090d15 100%); }\n.detail-topbar { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding: 17px 22px; border-bottom: 1px solid rgba(255,255,255,.09); background: rgba(8,11,18,.18); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }\n.detail-breadcrumb { display: flex; align-items: center; gap: 9px; color: var(--muted-2); font-family: var(--font-latin); font-size: 7.5px; font-weight: 700; letter-spacing: .15em; }\n.detail-breadcrumb i { width: 3px; height: 3px; border-radius: 50%; background: var(--muted-2); }\n.detail-breadcrumb b { color: var(--muted); font-weight: 700; }\n.detail-toolbar { display: flex; align-items: center; gap: 7px; }\n.detail-shelf-btn { display: inline-flex; align-items: center; gap: 7px; min-height: 34px; padding: 0 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 9.5px; letter-spacing: .05em; transition: color .2s, border-color .2s, background .2s; }\n.detail-shelf-btn:hover { color: var(--paper); border-color: var(--line-strong); background: rgba(255,255,255,.05); }\n.detail-shelf-btn svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.detail-hero { position: relative; display: grid; grid-template-columns: 192px minmax(0, 1fr); gap: clamp(22px, 3vw, 40px); padding: clamp(26px, 4vw, 45px) clamp(22px, 3.5vw, 44px) 27px; }\n.detail-cover-wrap { position: relative; align-self: start; }\n.detail-cover { position: relative; width: 100%; aspect-ratio: 3/4; overflow: hidden; border: 1px solid rgba(255,255,255,.2); border-radius: 3px 3px 14px 3px; background-color: #161d2b; background-size: cover; background-position: center; box-shadow: 0 24px 46px rgba(0,0,0,.42), 0 0 0 7px rgba(255,255,255,.025); }\n.detail-cover::after { content: \"\"; position: absolute; inset: 0; box-shadow: inset 0 0 40px rgba(0,0,0,.26); }\n.detail-cover-no { position: absolute; top: -8px; left: -8px; z-index: 2; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--paper); color: #20151c; font-family: var(--font-mono); font-size: 9px; font-weight: 700; box-shadow: 0 5px 12px rgba(0,0,0,.25); }\n.detail-cover-caption { margin-top: 14px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; line-height: 1.8; letter-spacing: .12em; }\n.detail-hero-copy { display: flex; flex-direction: column; justify-content: center; min-width: 0; }\n.detail-kicker { display: flex; align-items: center; gap: 9px; color: var(--rose); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .2em; }\n.detail-kicker i { width: 20px; height: 1px; background: var(--rose); }\n.detail-title { margin-top: 12px; font-family: var(--font-display); font-size: clamp(31px, 3.5vw, 50px); font-weight: 500; line-height: 1.2; letter-spacing: -.035em; }\n.detail-jp { margin-top: 6px; color: var(--muted-2); font-family: var(--font-latin); font-size: 9px; letter-spacing: .2em; text-transform: uppercase; }\n.detail-tagline { max-width: 560px; margin-top: 16px; color: var(--rose); font-family: var(--font-display); font-size: 13px; line-height: 1.8; letter-spacing: .04em; }\n.detail-intro { max-width: 620px; margin-top: 14px; color: rgba(239,234,224,.66); font-size: 11.5px; line-height: 1.95; }\n.detail-meta-row { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 18px; }\n.detail-meta { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 9.5px; letter-spacing: .03em; }\n.detail-meta svg { width: 12px; height: 12px; fill: none; stroke: var(--muted-2); stroke-width: 1.5; }\n.detail-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 18px; }\n.detail-tags span { padding: 3px 8px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--muted); font-size: 8.5px; letter-spacing: .04em; }\n.detail-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 23px; }\n.detail-actions .btn { min-height: 43px; padding-left: 19px; font-size: 10.5px; gap: 11px; }\n.detail-actions .btn-icon { width: 33px; height: 33px; }\n.detail-actions .btn-icon svg { width: 14px; height: 14px; }\n.save-work-btn { display: inline-flex; align-items: center; gap: 7px; height: 43px; padding: 0 14px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 10px; transition: all .2s; }\n.save-work-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.save-work-btn.is-saved { color: var(--rose); border-color: rgba(255,146,168,.4); background: rgba(255,146,168,.06); }\n.save-work-btn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.detail-tabs { display: flex; gap: 25px; margin: 0 clamp(22px, 3.5vw, 44px); border-bottom: 1px solid rgba(255,255,255,.1); }\n.detail-tab { position: relative; padding: 13px 0 14px; color: var(--muted-2); font-family: var(--font-display); font-size: 13px; letter-spacing: .1em; transition: color .2s; }\n.detail-tab::after { content: \"\"; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px; background: var(--rose); transform: scaleX(0); transform-origin: left; transition: transform .4s var(--ease-out); box-shadow: 0 0 12px var(--rose); }\n.detail-tab:hover { color: var(--paper); }\n.detail-tab.is-active { color: var(--paper); }\n.detail-tab.is-active::after { transform: scaleX(1); }\n.detail-tab small { margin-left: 5px; color: var(--rose); font-family: var(--font-latin); font-size: 7px; letter-spacing: .06em; }\n.detail-panels { flex: 1; padding: 22px clamp(22px, 3.5vw, 44px) 30px; }\n.detail-panel { display: none; animation: panelIn .45s var(--ease-out) both; }\n.detail-panel.is-active { display: block; }\n@keyframes panelIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }\n.overview-grid { display: grid; grid-template-columns: minmax(0, 1.26fr) minmax(0, .74fr); gap: 16px; }\n.overview-block { border: 1px solid rgba(255,255,255,.09); border-radius: var(--radius-sm); background: rgba(255,255,255,.025); padding: 18px 19px; }\n.overview-block-label { display: flex; align-items: center; justify-content: space-between; color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }\n.overview-block-label span:last-child { color: var(--rose); }\n.overview-block p { margin-top: 11px; color: rgba(239,234,224,.68); font-family: var(--font-display); font-size: 11.5px; line-height: 1.95; }\n.overview-block p + p { margin-top: 8px; }\n.theme-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 13px; }\n.theme-chips span { padding: 5px 9px; border: 1px solid var(--line); border-radius: 3px; color: var(--muted); font-size: 8.5px; }\n.timeline-mini { display: flex; flex-direction: column; gap: 0; margin-top: 14px; }\n.timeline-mini-item { position: relative; display: grid; grid-template-columns: 22px 1fr; gap: 7px; padding-bottom: 13px; }\n.timeline-mini-item:last-child { padding-bottom: 0; }\n.timeline-mini-item::before { content: \"\"; position: absolute; left: 6px; top: 15px; bottom: 0; width: 1px; background: var(--line); }\n.timeline-mini-item:last-child::before { display: none; }\n.timeline-dot { position: relative; z-index: 1; width: 13px; height: 13px; margin-top: 3px; border: 1px solid var(--rose); border-radius: 50%; background: #0b0f18; display: grid; place-items: center; }\n.timeline-dot::after { content: \"\"; width: 3px; height: 3px; border-radius: 50%; background: var(--rose); }\n.timeline-mini-item b { display: block; color: var(--paper); font-size: 9.5px; font-weight: 600; }\n.timeline-mini-item p { margin-top: 2px; color: var(--muted-2); font-size: 9px; line-height: 1.7; }\n.detail-note { display: flex; align-items: flex-start; gap: 10px; margin-top: 16px; padding: 12px 13px; border-left: 1px solid rgba(255,146,168,.5); background: rgba(255,146,168,.045); }\n.detail-note svg { width: 14px; height: 14px; flex: 0 0 auto; margin-top: 3px; color: var(--rose); fill: none; stroke: currentColor; stroke-width: 1.4; }\n.detail-note p { color: var(--muted); font-size: 9.5px; line-height: 1.8; }\n\n/* Cast */\n.cast-layout { display: grid; grid-template-columns: minmax(240px, 310px) minmax(0, 1fr); gap: clamp(20px, 3vw, 34px); }\n.cast-stage { position: relative; min-height: 470px; overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 4px 28px 4px 4px; background: linear-gradient(160deg, #1b1f2f, #0b0e16); }\n.cast-stage-bg { position: absolute; inset: 0; background: radial-gradient(circle at 70% 24%, rgba(255,255,255,.2), transparent 24%), linear-gradient(155deg, rgba(255,146,168,.16), transparent 46%, rgba(124,231,218,.08)); }\n.cast-art { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; }\n.cast-art svg { width: 100%; height: 100%; overflow: visible; }\n.cast-stage::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 52%, rgba(3,5,10,.45) 72%, rgba(3,5,10,.88)); pointer-events: none; }\n.cast-stage.is-bust .cast-art img.cast-photo, .cast-stage.is-center .cast-art img.cast-photo { transform: translateX(-50%); }\n.cast-stage-meta { position: absolute; z-index: 2; left: 16px; right: 16px; bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }\n.cast-stage-meta span:first-child { color: rgba(255,255,255,.8); font-family: var(--font-display); font-size: 16px; letter-spacing: .08em; }\n.cast-stage-meta span:last-child { color: var(--rose); font-family: var(--font-mono); font-size: 7px; letter-spacing: .1em; }\n.cast-stage::before { content: \"\"; position: absolute; z-index: 2; inset: 12px; border: 1px solid rgba(255,255,255,.11); pointer-events: none; }\n.cast-info { display: flex; flex-direction: column; padding-top: 8px; }\n.cast-kicker { color: var(--rose); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }\n.cast-name { margin-top: 8px; font-family: var(--font-display); font-size: clamp(28px, 3vw, 44px); font-weight: 500; letter-spacing: .01em; line-height: 1.2; }\n.cast-role { margin-top: 5px; color: var(--muted); font-size: 10px; letter-spacing: .08em; }\n.cast-quote { position: relative; margin-top: 19px; padding: 13px 0 13px 18px; border-left: 1px solid rgba(255,146,168,.6); color: rgba(255,209,216,.82); font-family: var(--font-display); font-size: clamp(13px, 1.3vw, 16px); line-height: 1.9; }\n.cast-quote::before { content: \"“\"; position: absolute; left: 8px; top: -3px; color: var(--rose); font-family: Georgia, serif; font-size: 26px; opacity: .4; }\n.cast-bio { margin-top: 18px; color: rgba(239,234,224,.65); font-size: 11px; line-height: 2.05; }\n.cast-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 16px; }\n.cast-tags span { padding: 3px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 8.5px; }\n.cast-rail { display: flex; gap: 8px; margin-top: 18px; padding-top: 13px; border-top: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; }\n.cast-rail::-webkit-scrollbar { display: none; }\n.cast-chip { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; min-width: 98px; padding: 6px 10px 6px 6px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); text-align: left; transition: border-color .2s, color .2s, background .2s; }\n.cast-chip:hover { color: var(--paper); border-color: var(--line-strong); }\n.cast-chip.is-active { color: var(--paper); border-color: rgba(255,146,168,.5); background: rgba(255,146,168,.08); }\n.cast-chip-portrait { width: 31px; height: 31px; flex: 0 0 auto; overflow: hidden; border-radius: 50%; background: linear-gradient(145deg, #3a354d, #171c29); }\n.cast-chip-portrait svg { width: 100%; height: 100%; }\n.cast-chip span { font-size: 10px; white-space: nowrap; }\n\n/* Story */\n.story-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(180px, .55fr); gap: 30px; }\n.story-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 15px; }\n.story-head-left { display: flex; align-items: center; gap: 10px; color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }\n.story-head-left i { width: 15px; height: 1px; background: var(--rose); }\n.story-edit-btn { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 9.5px; border-bottom: 1px solid var(--line); padding-bottom: 2px; }\n.story-edit-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.story-edit-btn svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.story-text { color: rgba(239,234,224,.7); font-family: var(--font-display); font-size: 11.5px; line-height: 2.15; letter-spacing: .02em; }\n.story-text p + p { margin-top: 14px; }\n.story-text .first-letter { float: left; margin: 6px 7px 0 0; color: var(--rose); font-size: 36px; line-height: .8; }\n.story-editor { display: none; }\n.story-editor.is-open { display: block; }\n.story-text.is-hidden { display: none; }\n.story-editor textarea { width: 100%; min-height: 320px; padding: 15px; border: 1px solid var(--line-strong); border-radius: 10px; outline: none; resize: vertical; background: rgba(0,0,0,.2); color: var(--paper); font-family: var(--font-display); font-size: 11.5px; line-height: 2; }\n.story-editor textarea:focus { border-color: var(--rose); box-shadow: 0 0 0 3px rgba(255,146,168,.08); }\n.story-editor-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }\n.story-editor-actions .hint { color: var(--muted-2); font-size: 9px; }\n.story-editor-actions div { display: flex; gap: 14px; align-items: center; }\n.story-side { border-left: 1px solid var(--line); padding-left: 23px; }\n.story-side .micro-label { margin-bottom: 15px; }\n.story-route { display: flex; flex-direction: column; gap: 19px; }\n.route-item { position: relative; padding-left: 17px; }\n.route-item::before { content: \"\"; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border: 1px solid var(--gold); border-radius: 50%; }\n.route-item::after { content: \"\"; position: absolute; left: 3px; top: 17px; bottom: -20px; width: 1px; background: var(--line); }\n.route-item:last-child::after { display: none; }\n.route-label { color: var(--gold); font-family: var(--font-latin); font-size: 7.5px; font-weight: 700; letter-spacing: .13em; }\n.route-item p { margin-top: 4px; color: var(--muted); font-size: 9.5px; line-height: 1.8; }\n.story-warning { display: flex; gap: 8px; margin-top: 22px; color: var(--muted-2); font-size: 8.5px; line-height: 1.8; }\n.story-warning svg { width: 12px; height: 12px; flex: 0 0 auto; margin-top: 2px; color: var(--gold); fill: none; stroke: currentColor; stroke-width: 1.4; }\n\n/* ==========================================================================\n   03 · CONSOLE\n   ========================================================================== */\n.page-console { padding-bottom: 90px; }\n.autosave-pill { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 0 13px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted-2); font-size: 9px; letter-spacing: .05em; }\n.autosave-pill .save-dot { width: 4px; height: 4px; }\n.console-board { max-width: var(--shell); margin: 0 auto; padding: 0 var(--gutter); }\n.console-overview { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(255,255,255,.045), rgba(255,255,255,.012) 50%, rgba(168,155,255,.035)); }\n.console-overview::before { content: \"\"; position: absolute; width: 520px; height: 520px; top: -320px; right: 6%; border-radius: 50%; background: radial-gradient(circle, rgba(255,146,168,.12), transparent 66%); pointer-events: none; }\n.overview-head { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding: 27px 28px 0; }\n.overview-head h2 { margin-top: 7px; color: var(--paper); font-family: var(--font-display); font-size: clamp(26px, 2.5vw, 39px); font-weight: 500; letter-spacing: -.025em; }\n.overview-head h2 span { color: var(--rose); }\n.overview-timestamp { color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; letter-spacing: .14em; }\n.overview-grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, .7fr); gap: 24px; padding: 23px 28px 22px; }\n.overview-meters { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; }\n.meter-card { padding: 14px 15px 13px; border: 1px solid var(--line); border-radius: 10px; background: rgba(3,6,12,.18); }\n.meter-label { display: block; color: var(--muted-2); font-size: 8.5px; letter-spacing: .06em; }\n.meter-card strong { display: inline-block; margin-top: 8px; color: var(--paper); font-family: var(--font-display); font-size: 29px; font-weight: 500; line-height: 1; }\n.meter-unit { margin-left: 4px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7.5px; }\n.meter-track { display: block; height: 2px; margin-top: 12px; background: rgba(255,255,255,.1); overflow: hidden; }\n.meter-track i { display: block; width: 0; height: 100%; background: linear-gradient(90deg, var(--rose), var(--violet)); box-shadow: 0 0 7px rgba(255,146,168,.7); transition: width .7s var(--ease-out); }\n.meter-card:nth-child(2) .meter-track i { background: linear-gradient(90deg, var(--cyan), var(--blue)); box-shadow: 0 0 7px rgba(124,231,218,.6); }\n.meter-card:nth-child(3) .meter-track i { background: linear-gradient(90deg, var(--gold), var(--rose)); box-shadow: 0 0 7px rgba(231,196,139,.5); }\n.coherence-card { display: flex; align-items: center; gap: 18px; padding: 13px 17px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.022); }\n.coherence-ring { --value: 86; position: relative; flex: 0 0 auto; width: 84px; height: 84px; border-radius: 50%; background: conic-gradient(from 215deg, var(--rose) calc(var(--value) * 1%), rgba(255,255,255,.08) 0); display: grid; place-items: center; transition: --value .6s; }\n.coherence-ring::before { content: \"\"; position: absolute; inset: 4px; border-radius: 50%; background: #111622; }\n.coherence-ring > div { position: relative; z-index: 1; display: flex; align-items: baseline; gap: 1px; }\n.coherence-ring strong { font-family: var(--font-display); font-size: 24px; font-weight: 500; line-height: 1; }\n.coherence-ring span { color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; }\n.coherence-copy h3 { margin-top: 5px; font-family: var(--font-display); font-size: 15px; font-weight: 500; }\n.coherence-copy p { max-width: 220px; margin-top: 4px; color: var(--muted-2); font-size: 8.5px; line-height: 1.75; }\n.master-row { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 17px 28px; border-top: 1px solid var(--line); background: rgba(5,8,14,.2); }\n.master-switches { display: flex; flex-wrap: wrap; gap: 8px; }\n.master-switch { display: flex; align-items: center; gap: 9px; min-height: 48px; padding: 6px 10px 6px 7px; border: 1px solid transparent; border-radius: 8px; text-align: left; transition: background .2s, border-color .2s; }\n.master-switch:hover { background: rgba(255,255,255,.035); border-color: var(--line); }\n.master-icon { display: grid; place-items: center; flex: 0 0 auto; width: 30px; height: 30px; border-radius: 7px; background: rgba(255,255,255,.055); color: var(--muted); }\n.master-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.master-switch[aria-pressed=\"true\"] .master-icon { color: var(--rose); background: rgba(255,146,168,.1); }\n.master-switch b { display: block; color: var(--paper); font-size: 10px; font-weight: 500; line-height: 1.4; }\n.master-switch small { display: block; color: var(--muted-2); font-size: 8px; line-height: 1.4; }\n.switch { position: relative; flex: 0 0 auto; width: 30px; height: 17px; margin-left: 5px; border-radius: 999px; background: rgba(255,255,255,.12); transition: background .25s; }\n.switch i { position: absolute; width: 11px; height: 11px; top: 3px; left: 3px; border-radius: 50%; background: var(--paper-soft); transition: transform .3s var(--ease-out), background .25s; }\n.master-switch[aria-pressed=\"true\"] .switch { background: var(--rose); }\n.master-switch[aria-pressed=\"true\"] .switch i { transform: translateX(13px); background: #fff; }\n.master-actions { display: flex; align-items: center; gap: 10px; }\n.console-list-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin: 46px 2px 17px; }\n.console-list-head h2 { margin-top: 6px; font-family: var(--font-display); font-size: clamp(26px, 2.5vw, 36px); font-weight: 500; }\n.channel-legend { display: flex; align-items: center; gap: 13px; color: var(--muted-2); font-size: 8.5px; }\n.channel-legend > span { display: flex; align-items: center; gap: 5px; }\n.legend-dot { width: 4px; height: 4px; border-radius: 50%; }\n.dot-on { background: var(--cyan); box-shadow: 0 0 7px var(--cyan); }\n.dot-off { background: var(--muted-2); }\n.legend-hint { padding-left: 10px; border-left: 1px solid var(--line); }\n.channel-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; }\n.channel { --channel-accent: var(--rose); position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-md); background: linear-gradient(155deg, rgba(255,255,255,.045), rgba(255,255,255,.012) 68%); transition: border-color .3s, background .3s, opacity .3s; }\n.channel::before { content: \"\"; position: absolute; inset: 0; z-index: 0; background: radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--channel-accent) 11%, transparent), transparent 52%); opacity: .6; pointer-events: none; }\n.channel:hover { border-color: rgba(255,255,255,.23); }\n.channel.is-off { opacity: .55; background: linear-gradient(155deg, rgba(255,255,255,.022), rgba(255,255,255,.006) 68%); }\n.channel.is-off::before { opacity: .2; }\n.channel-main { position: relative; z-index: 1; padding: 15px 16px 13px; }\n.channel-head { display: flex; align-items: center; gap: 10px; }\n.channel-cover { position: relative; flex: 0 0 auto; width: 40px; aspect-ratio: 3/4; overflow: hidden; border-radius: 3px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,.16); }\n.channel-title-wrap { min-width: 0; flex: 1; }\n.channel-index { display: block; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .1em; }\n.channel-title { display: block; margin-top: 2px; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 14px; font-weight: 500; white-space: nowrap; text-overflow: ellipsis; }\n.channel-sub { display: block; margin-top: 2px; overflow: hidden; color: var(--muted-2); font-size: 7.5px; white-space: nowrap; text-overflow: ellipsis; }\n.power-btn { flex: 0 0 auto; width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 50%; display: grid; place-items: center; color: var(--muted-2); transition: all .25s; }\n.power-btn svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.power-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.channel:not(.is-off) .power-btn { color: var(--cyan); border-color: rgba(124,231,218,.3); background: rgba(124,231,218,.06); box-shadow: 0 0 12px rgba(124,231,218,.08); }\n.channel-signal { display: flex; align-items: center; gap: 7px; margin-top: 13px; padding: 7px 0 10px; border-bottom: 1px solid var(--line); }\n.signal-bars { display: flex; align-items: flex-end; gap: 2px; height: 9px; flex: 0 0 auto; }\n.signal-bars i { width: 2px; height: 3px; background: var(--channel-accent); opacity: .42; border-radius: 1px; }\n.signal-bars i:nth-child(2) { height: 5px; opacity: .58; }\n.signal-bars i:nth-child(3) { height: 7px; opacity: .74; }\n.signal-bars i:nth-child(4) { height: 9px; opacity: .9; }\n.channel.is-on .signal-bars i { animation: signal 1.8s ease-in-out infinite alternate; }\n.channel.is-on .signal-bars i:nth-child(2) { animation-delay: .22s; }\n.channel.is-on .signal-bars i:nth-child(3) { animation-delay: .47s; }\n.channel.is-on .signal-bars i:nth-child(4) { animation-delay: .71s; }\n@keyframes signal { to { transform: scaleY(.45); opacity: .4; } }\n.channel-signal span { color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .08em; }\n.channel-signal em { margin-left: auto; color: var(--channel-accent); font-family: var(--font-mono); font-size: 7px; font-style: normal; letter-spacing: .06em; }\n.channel-controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-top: 11px; }\n.channel-toggle { min-height: 44px; padding: 6px 5px; border: 1px solid var(--line); border-radius: 6px; color: var(--muted-2); text-align: left; transition: all .2s; }\n.channel-toggle:hover { border-color: var(--line-strong); color: var(--paper); }\n.channel-toggle span { display: block; font-size: 8px; letter-spacing: .03em; }\n.channel-toggle b { display: block; margin-top: 2px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; font-weight: 500; letter-spacing: .04em; }\n.channel-toggle.is-on { color: var(--paper); border-color: rgba(255,255,255,.17); background: rgba(255,255,255,.055); }\n.channel-toggle.is-on b { color: var(--channel-accent); }\n.channel-toggle.is-on::before { content: \"\"; display: inline-block; width: 3px; height: 3px; margin-right: 4px; border-radius: 50%; background: var(--channel-accent); box-shadow: 0 0 6px var(--channel-accent); vertical-align: 1px; }\n.channel-slider-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }\n.channel-slider-row label { flex: 0 0 auto; color: var(--muted-2); font-size: 8px; }\n.channel-slider-wrap { position: relative; flex: 1; height: 14px; display: flex; align-items: center; }\n.range-input { --range-val: 65%; width: 100%; height: 14px; margin: 0; -webkit-appearance: none; appearance: none; background: transparent; outline: none; cursor: pointer; }\n.range-input::-webkit-slider-runnable-track { height: 2px; border-radius: 999px; background: linear-gradient(90deg, var(--channel-accent) 0 var(--range-val), rgba(255,255,255,.12) var(--range-val) 100%); }\n.range-input::-moz-range-track { height: 2px; border-radius: 999px; background: rgba(255,255,255,.12); }\n.range-input::-moz-range-progress { height: 2px; background: var(--channel-accent); }\n.range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 9px; height: 9px; margin-top: -3.5px; border-radius: 50%; border: 1px solid #fff; background: var(--channel-accent); box-shadow: 0 0 9px var(--channel-accent); }\n.range-input::-moz-range-thumb { width: 8px; height: 8px; border: 1px solid #fff; border-radius: 50%; background: var(--channel-accent); }\n.channel-slider-val { flex: 0 0 26px; text-align: right; color: var(--channel-accent); font-family: var(--font-mono); font-size: 7px; }\n.channel-cast { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px; }\n.channel-cast summary { display: flex; align-items: center; gap: 5px; color: var(--muted-2); font-size: 8px; cursor: pointer; list-style: none; }\n.channel-cast summary::-webkit-details-marker { display: none; }\n.channel-cast summary::before { content: \"+\"; color: var(--channel-accent); font-family: var(--font-mono); font-size: 11px; }\n.channel-cast[open] summary::before { content: \"−\"; }\n.channel-cast summary span { margin-left: auto; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; }\n.cast-tune-list { display: flex; flex-direction: column; gap: 3px; margin-top: 9px; }\n.cast-tune { display: flex; align-items: center; gap: 7px; min-height: 30px; padding: 3px 5px; border-radius: 4px; background: rgba(255,255,255,.02); }\n.cast-tune-name { flex: 1; min-width: 0; color: var(--muted); font-size: 8.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.cast-tune-role { color: var(--muted-2); font-size: 7px; }\n.cast-gender-toggle { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted-2); font-size: 7px; transition: all .2s; }\n.cast-gender-toggle.is-swapped { color: var(--rose); border-color: rgba(255,146,168,.38); background: rgba(255,146,168,.08); }\n.cast-gender-toggle i { width: 3px; height: 3px; border-radius: 50%; background: currentColor; }\n.console-foot-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 27px; color: var(--muted-2); font-size: 8.5px; }\n.console-foot-note svg { width: 13px; height: 13px; fill: none; stroke: var(--gold); stroke-width: 1.4; }\n\n/* ==========================================================================\n   04 · PERSONA\n   ========================================================================== */\n.page-persona { padding-bottom: 90px; }\n.persona-layout { max-width: var(--shell); margin: 0 auto; padding: 0 var(--gutter); display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(350px, .9fr); gap: clamp(24px, 3.5vw, 52px); align-items: start; }\n.persona-form { padding: clamp(22px, 3vw, 36px); border: 1px solid rgba(255,255,255,.14); border-radius: var(--radius-lg); background: linear-gradient(150deg, rgba(255,255,255,.062), rgba(255,255,255,.022) 58%, rgba(168,155,255,.035)), rgba(10,14,23,.35); box-shadow: 0 22px 60px rgba(0,0,0,.22), 0 1px 0 rgba(255,255,255,.06) inset; }\n.form-section-head { display: flex; align-items: flex-start; gap: 13px; }\n.form-section-no { display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px; border: 1px solid rgba(255,146,168,.34); border-radius: 50%; color: var(--rose); font-family: var(--font-mono); font-size: 8px; }\n.form-section-head h2 { font-family: var(--font-display); font-size: 24px; font-weight: 500; letter-spacing: -.02em; line-height: 1.3; }\n.form-section-head p { margin-top: 4px; color: var(--muted-2); font-size: 9px; }\n.inspiration-btn { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; padding: 7px 10px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 8.5px; white-space: nowrap; transition: all .2s; }\n.inspiration-btn:hover { color: var(--rose); border-color: rgba(255,146,168,.4); background: rgba(255,146,168,.05); }\n.inspiration-btn svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.form-grid { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(110px,.4fr); gap: 19px 17px; margin-top: 30px; }\n.field { display: block; min-width: 0; }\n.field-full { grid-column: 1 / -1; }\n.field-label { display: flex; align-items: baseline; gap: 8px; margin-bottom: 7px; color: var(--paper); font-size: 11px; letter-spacing: .05em; }\n.field-label i { color: var(--muted-2); font-family: var(--font-latin); font-size: 7.5px; font-style: normal; letter-spacing: .14em; }\n.field-label .required { margin-left: auto; color: var(--rose); font-size: 7.5px; letter-spacing: .08em; }\n.field-hint { margin-left: auto; color: var(--muted-2); font-family: var(--font-display); font-size: 8.5px; letter-spacing: .02em; }\n.input-wrap { position: relative; display: block; }\n.input-wrap input, .input-wrap textarea { display: block; width: 100%; border: 1px solid rgba(255,255,255,.145); border-radius: 8px; outline: none; background: rgba(255,255,255,.032); color: var(--paper); font-size: 12px; transition: border-color .22s, background .22s, box-shadow .22s; }\n.input-wrap input { height: 47px; padding: 0 14px; }\n.input-wrap textarea { min-height: 112px; padding: 12px 14px 25px; resize: vertical; line-height: 1.9; font-family: var(--font-sans); }\n.input-wrap input::placeholder, .input-wrap textarea::placeholder { color: rgba(239,234,224,.38); }\n.input-wrap input:focus, .input-wrap textarea:focus { border-color: rgba(255,146,168,.55); background: rgba(9,13,21,.62); box-shadow: 0 0 0 3px rgba(255,146,168,.055); }\n.input-line { position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--rose), transparent); opacity: 0; transform: scaleX(.6); transition: opacity .3s, transform .4s var(--ease-out); pointer-events: none; }\n.input-wrap:focus-within .input-line { opacity: .8; transform: scaleX(1); }\n.char-count { position: absolute; right: 11px; bottom: 7px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; pointer-events: none; }\n.chip-suggestions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }\n.suggestion-chip { padding: 4px 8px; border: 1px solid var(--line); border-radius: 3px; color: var(--muted-2); font-size: 8px; transition: all .2s; }\n.suggestion-chip:hover { color: var(--paper); border-color: var(--line-strong); background: rgba(255,255,255,.04); }\n.form-section-head-sub { margin-top: 34px; padding-top: 26px; border-top: 1px solid var(--line); }\n.aesthetic-picker { display: flex; flex-wrap: wrap; gap: 27px; margin-top: 20px; }\n.aesthetic-label { display: block; margin-bottom: 10px; color: var(--muted); font-size: 9px; letter-spacing: .05em; }\n.swatch-row { display: flex; gap: 9px; }\n.swatch { position: relative; width: 24px; height: 24px; border-radius: 50%; background: var(--swatch); opacity: .6; transition: opacity .2s, transform .25s; }\n.swatch::after { content: \"\"; position: absolute; inset: 4px; border: 1px solid rgba(0,0,0,.15); border-radius: 50%; }\n.swatch:hover { opacity: .9; transform: translateY(-2px); }\n.swatch.is-active { opacity: 1; box-shadow: 0 0 0 2px var(--ink-1), 0 0 0 3px var(--swatch), 0 0 15px color-mix(in srgb, var(--swatch) 60%, transparent); }\n.variant-row { display: flex; gap: 7px; }\n.variant-btn { width: 38px; height: 33px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 5px; color: var(--muted-2); transition: all .2s; }\n.variant-btn.is-active { border-color: var(--rose); background: rgba(255,146,168,.08); color: var(--rose); }\n.mini-silhouette { position: relative; display: block; width: 17px; height: 17px; }\n.mini-silhouette::before { content: \"\"; position: absolute; left: 5px; top: 1px; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }\n.mini-silhouette::after { content: \"\"; position: absolute; left: 2px; bottom: 0; width: 13px; height: 8px; border-radius: 7px 7px 2px 2px; background: currentColor; }\n.mini-silhouette.v1::before { width: 7px; height: 8px; border-radius: 45% 45% 50% 50%; }\n.mini-silhouette.v1::after { width: 15px; height: 9px; left: 1px; border-radius: 50% 50% 2px 2px; }\n.mini-silhouette.v2::before { width: 6px; height: 7px; left: 5px; }\n.mini-silhouette.v2::after { width: 11px; height: 9px; left: 3px; border-radius: 4px 4px 2px 2px; }\n.form-footer { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--line); }\n.form-note { display: flex; align-items: center; gap: 6px; color: var(--muted-2); font-size: 8.5px; }\n.form-note svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; }\n.form-actions { display: flex; align-items: center; gap: 17px; }\n.btn-save { min-height: 45px; padding-left: 20px; gap: 12px; font-size: 10.5px; }\n.btn-save svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.persona-preview { position: sticky; top: calc(var(--header-h) + 15px); padding-top: 25px; }\n.preview-caption { display: flex; justify-content: space-between; margin-bottom: 12px; color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; letter-spacing: .15em; }\n.persona-card { position: relative; min-height: 600px; overflow: hidden; border: 1px solid rgba(255,255,255,.2); border-radius: 7px 34px 7px 7px; background: #12131b; box-shadow: 0 40px 80px rgba(0,0,0,.36); isolation: isolate; }\n.persona-card[data-color=\"rose\"] { --card-accent: #ff93ab; --card-accent-2: #e07b91; --card-wash: rgba(255,147,171,.17); }\n.persona-card[data-color=\"violet\"] { --card-accent: #a89aff; --card-accent-2: #7a70d0; --card-wash: rgba(168,154,255,.17); }\n.persona-card[data-color=\"cyan\"] { --card-accent: #7be3d5; --card-accent-2: #56bdb3; --card-wash: rgba(123,227,213,.15); }\n.persona-card[data-color=\"gold\"] { --card-accent: #e9c47f; --card-accent-2: #c49b55; --card-wash: rgba(233,196,127,.15); }\n.persona-card[data-color=\"blue\"] { --card-accent: #86a8ff; --card-accent-2: #5f81d9; --card-wash: rgba(134,168,255,.16); }\n.persona-card-glow { position: absolute; z-index: -1; width: 360px; height: 360px; top: -170px; right: -120px; border-radius: 50%; background: radial-gradient(circle, var(--card-wash), transparent 68%); }\n.persona-card-noise { position: absolute; inset: 0; z-index: 4; pointer-events: none; opacity: .06; background-image: url(\"data:image/svg+xml;utf8,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\"); }\n.persona-card::before { content: \"\"; position: absolute; inset: 10px; z-index: 3; border: 1px solid rgba(255,255,255,.11); border-radius: 3px 27px 3px 3px; pointer-events: none; }\n.persona-card-top { position: absolute; z-index: 5; top: 24px; left: 25px; right: 25px; display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,.43); font-family: var(--font-latin); font-size: 7px; letter-spacing: .13em; }\n.persona-status { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-mono); }\n.persona-status i { width: 4px; height: 4px; border-radius: 50%; background: var(--card-accent); box-shadow: 0 0 6px var(--card-accent); }\n.persona-portrait { position: relative; height: 325px; overflow: hidden; background:\n  radial-gradient(ellipse at 50% 44%, color-mix(in srgb, var(--card-accent) 19%, transparent), transparent 42%),\n  linear-gradient(160deg, rgba(255,255,255,.075), transparent 54%, rgba(0,0,0,.22)); }\n.persona-portrait::before { content: \"\"; position: absolute; z-index: 0; width: 240px; height: 240px; top: 36px; left: 50%; transform: translateX(-50%); border-radius: 50%; border: 1px solid color-mix(in srgb, var(--card-accent) 24%, transparent); box-shadow: 0 0 80px color-mix(in srgb, var(--card-accent) 14%, transparent) inset; opacity: .8; }\n.persona-portrait::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 38%, rgba(18,19,27,.04) 58%, #12131b 100%); }\n.portrait-sigil { position: absolute; z-index: 0; width: 170px; height: 170px; top: 52px; left: 50%; color: var(--card-accent); opacity: .14; transform: translateX(-50%) rotate(-20deg); }\n.portrait-sigil svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: .7; }\n.persona-silhouette { position: absolute; z-index: 1; bottom: 0; left: 50%; width: 230px; height: 300px; transform: translateX(-50%); }\n.sil-head { position: absolute; left: 50%; top: 40px; width: 92px; height: 116px; transform: translateX(-50%); border-radius: 47% 47% 48% 48% / 44% 44% 56% 56%; background: linear-gradient(155deg, #e1c1b6, #ae8589 65%, #7b5964); box-shadow: 17px 3px 30px rgba(0,0,0,.14); }\n.sil-head::before { content: \"\"; position: absolute; left: 13px; top: 54px; width: 13px; height: 2px; border-radius: 50%; background: rgba(42,26,34,.45); box-shadow: 54px 0 0 rgba(42,26,34,.45); }\n.sil-head::after { content: \"\"; position: absolute; left: 50%; bottom: 25px; width: 8px; height: 1px; transform: translateX(-50%); background: rgba(87,47,54,.5); }\n.sil-hair { position: absolute; z-index: 2; left: 50%; top: 16px; width: 155px; height: 210px; transform: translateX(-50%); border-radius: 48% 50% 36% 36% / 42% 44% 22% 22%; background: linear-gradient(150deg, color-mix(in srgb, var(--card-accent) 30%, #3a2d3e), #241e2a 42%, #47394f 72%, #2a222f); clip-path: polygon(0 0, 100% 0, 95% 87%, 86% 72%, 82% 95%, 72% 68%, 28% 68%, 18% 95%, 14% 72%, 5% 87%); opacity: .97; box-shadow: 0 0 30px color-mix(in srgb, var(--card-accent) 16%, transparent); }\n.sil-neck { position: absolute; z-index: 0; left: 50%; top: 134px; width: 34px; height: 64px; transform: translateX(-50%); background: linear-gradient(160deg, #bd9791, #8c6871); }\n.sil-body { position: absolute; z-index: 0; left: 50%; bottom: 0; width: 220px; height: 148px; transform: translateX(-50%); border-radius: 44% 44% 14% 14% / 34% 34% 8% 8%; background: linear-gradient(155deg, color-mix(in srgb, var(--card-accent) 13%, #3d374c), #24212e 50%, #17151f); box-shadow: 0 -4px 34px rgba(0,0,0,.2), 0 0 0 1px color-mix(in srgb, var(--card-accent) 18%, transparent) inset; }\n.sil-.gw-app::before { content: \"\"; position: absolute; left: 50%; top: 0; width: 68px; height: 35px; transform: translateX(-50%); border-radius: 0 0 50% 50%; background: #0e0f15; }\n.sil-body::after { content: \"\"; position: absolute; left: 50%; top: 44px; width: 1px; height: 104px; background: linear-gradient(var(--card-accent), transparent); opacity: .45; }\n.sil-ribbon { position: absolute; z-index: 3; top: 180px; left: 50%; width: 40px; height: 17px; transform: translateX(-50%) rotate(-2deg); background: var(--card-accent); clip-path: polygon(0 0, 50% 38%, 100% 0, 82% 100%, 50% 62%, 18% 100%); opacity: .7; transition: background .3s; }\n.persona-card[data-variant=\"1\"] .sil-hair { width: 175px; height: 255px; clip-path: polygon(0 0, 100% 0, 100% 94%, 80% 76%, 74% 100%, 26% 100%, 20% 76%, 0 94%); }\n.persona-card[data-variant=\"2\"] .sil-hair { width: 150px; height: 195px; border-radius: 50% 50% 44% 44%; clip-path: none; }\n.persona-card[data-variant=\"2\"] .sil-hair::after { content: \"\"; position: absolute; right: -30px; top: 72px; width: 44px; height: 84px; border-radius: 50%; background: #221c27; transform: rotate(-18deg); }\n.persona-card[data-variant=\"2\"] .sil-head { top: 50px; }\n.portrait-initial { position: absolute; z-index: 0; left: 50%; top: 107px; transform: translateX(-50%); color: rgba(255,255,255,.08); font-family: var(--font-display); font-size: 154px; line-height: 1; letter-spacing: -.05em; pointer-events: none; }\n.portrait-frame-line { position: absolute; z-index: 2; border: 1px solid rgba(255,255,255,.07); pointer-events: none; }\n.portrait-frame-line.line-a { top: 47px; left: 31px; right: 31px; height: 1px; border-width: 1px 0 0; }\n.portrait-frame-line.line-b { top: 37px; right: 42px; width: 1px; height: 124px; border-width: 0 1px 0 0; }\n.portrait-caption { position: absolute; z-index: 5; left: 25px; bottom: 16px; color: rgba(255,255,255,.28); font-family: var(--font-latin); font-size: 6.5px; letter-spacing: .16em; }\n.persona-card-body { position: relative; z-index: 5; padding: 0 27px 23px; }\n.persona-name-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }\n.persona-overline { display: block; color: var(--card-accent); font-family: var(--font-latin); font-size: 7px; font-weight: 700; letter-spacing: .17em; }\n.persona-name-row h2 { margin-top: 4px; min-height: 37px; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: clamp(28px, 3vw, 36px); font-weight: 500; line-height: 1.2; letter-spacing: -.01em; text-overflow: ellipsis; white-space: nowrap; }\n.persona-seal { display: grid; place-items: center; flex: 0 0 auto; width: 44px; height: 44px; border: 1px solid var(--card-accent); border-radius: 3px; color: var(--card-accent); font-family: var(--font-display); font-size: 11px; line-height: 1.25; letter-spacing: .1em; opacity: .55; transform: rotate(6deg); transition: all .4s var(--ease-out); }\n.persona-seal.is-stamped { opacity: 1; background: var(--card-accent); color: #241820; transform: rotate(-4deg); box-shadow: 0 0 22px color-mix(in srgb, var(--card-accent) 35%, transparent); }\n.persona-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; color: rgba(255,255,255,.46); font-size: 8.5px; letter-spacing: .04em; }\n.persona-meta i { width: 2px; height: 2px; border-radius: 50%; background: var(--card-accent); }\n.persona-quote { display: -webkit-box; min-height: 58px; margin-top: 17px; overflow: hidden; color: rgba(255,255,255,.63); font-family: var(--font-display); font-size: 11.5px; line-height: 1.9; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }\n.persona-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: 21px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.1); }\n.persona-tags { display: flex; flex-wrap: wrap; gap: 5px; }\n.persona-tags span { padding: 3px 7px; border: 1px solid rgba(255,255,255,.14); border-radius: 2px; color: rgba(255,255,255,.52); font-size: 7.5px; }\n.completion { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,.45); font-family: var(--font-mono); font-size: 8px; }\n.completion b { color: var(--card-accent); font-size: 12px; font-weight: 500; }\n.completion small { display: block; font-family: var(--font-sans); font-size: 6.5px; letter-spacing: .05em; }\n.completion-ring { position: relative; width: 28px; height: 28px; border-radius: 50%; background: conic-gradient(var(--card-accent) calc(var(--value) * 1%), rgba(255,255,255,.1) 0); display: grid; place-items: center; }\n.completion-ring::before { content: \"\"; position: absolute; inset: 3px; border-radius: 50%; background: #12131b; }\n.persona-card-bottom { position: absolute; z-index: 5; left: 27px; right: 27px; bottom: 9px; display: flex; justify-content: space-between; color: rgba(255,255,255,.25); font-family: var(--font-mono); font-size: 6px; letter-spacing: .12em; }\n.preview-side-note { display: flex; align-items: flex-start; gap: 12px; margin-top: 22px; color: var(--muted-2); font-family: var(--font-display); font-size: 9px; line-height: 1.9; letter-spacing: .05em; }\n.preview-side-line { flex: 0 0 23px; height: 1px; margin-top: 8px; background: var(--rose); opacity: .55; }\n\n/* ==========================================================================\n   05 · OPENING\n   ========================================================================== */\n.page-opening { padding-bottom: 100px; }\n.portrait-hint { display: flex; align-items: center; gap: 10px; color: var(--muted-2); font-size: 8.5px; line-height: 1.6; }\n.portrait-hint b { color: var(--paper); font-weight: 500; font-size: 10px; }\n.mini-avatar { display: grid; place-items: center; flex: 0 0 auto; width: 37px; height: 37px; border: 1px solid rgba(255,146,168,.35); border-radius: 50%; background: radial-gradient(circle at 35% 28%, rgba(255,255,255,.18), transparent 54%), #1c1a26; color: var(--rose); font-family: var(--font-display); font-size: 14px; }\n.opening-layout { max-width: var(--shell); margin: 0 auto; padding: 0 var(--gutter); display: grid; grid-template-columns: minmax(360px, .83fr) minmax(0, 1.17fr); gap: clamp(22px, 3.5vw, 48px); align-items: start; }\n.opening-options { min-width: 0; }\n.opening-step { padding-bottom: 25px; }\n.opening-step + .opening-step { padding-top: 24px; border-top: 1px solid var(--line); }\n.step-head { display: flex; align-items: flex-start; gap: 12px; }\n.step-no { display: grid; place-items: center; flex: 0 0 auto; width: 27px; height: 27px; border: 1px solid rgba(255,146,168,.4); border-radius: 50%; color: var(--rose); font-family: var(--font-mono); font-size: 8px; }\n.step-head h2 { font-family: var(--font-display); font-size: 23px; font-weight: 500; letter-spacing: -.02em; line-height: 1.3; }\n.step-head p { margin-top: 3px; color: var(--muted-2); font-size: 8.5px; }\n.step-count { margin-left: auto; color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; }\n.opening-work-picker { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 17px; }\n.opening-work { position: relative; display: flex; align-items: center; gap: 8px; min-height: 55px; padding: 7px 8px; overflow: hidden; border: 1px solid var(--line); border-radius: 7px; text-align: left; transition: all .25s; }\n.opening-work::before { content: \"\"; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,.06), transparent); opacity: 0; transition: opacity .2s; }\n.opening-work:hover { border-color: var(--line-strong); background: rgba(255,255,255,.035); }\n.opening-work.is-active { border-color: var(--rose); background: rgba(255,146,168,.07); box-shadow: 0 0 0 1px rgba(255,146,168,.12); }\n.opening-work-cover { position: relative; z-index: 1; width: 25px; aspect-ratio: 3/4; flex: 0 0 auto; border-radius: 2px; background-size: cover; background-position: center; }\n.opening-work-copy { position: relative; z-index: 1; min-width: 0; }\n.opening-work-name { display: block; overflow: hidden; color: var(--muted); font-family: var(--font-display); font-size: 10px; white-space: nowrap; text-overflow: ellipsis; }\n.opening-work.is-active .opening-work-name { color: var(--paper); }\n.opening-work-num { display: block; margin-top: 1px; color: var(--muted-2); font-family: var(--font-mono); font-size: 6px; }\n.opening-tabs { display: flex; gap: 17px; margin-top: 17px; border-bottom: 1px solid var(--line); }\n.opening-tab { position: relative; padding: 0 0 10px; color: var(--muted-2); font-size: 9px; letter-spacing: .05em; }\n.opening-tab::after { content: \"\"; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: var(--rose); transform: scaleX(0); transform-origin: left; transition: transform .35s var(--ease-out); }\n.opening-tab:hover { color: var(--paper); }\n.opening-tab.is-active { color: var(--paper); }\n.opening-tab.is-active::after { transform: scaleX(1); }\n.scene-list { display: flex; flex-direction: column; gap: 7px; margin-top: 13px; }\n.scene-card { position: relative; display: flex; align-items: flex-start; gap: 12px; min-height: 72px; padding: 11px 13px; border: 1px solid var(--line); border-radius: 8px; text-align: left; transition: all .24s; }\n.scene-card:hover { border-color: var(--line-strong); background: rgba(255,255,255,.025); }\n.scene-card.is-active { border-color: rgba(255,146,168,.52); background: rgba(255,146,168,.055); }\n.scene-index { flex: 0 0 auto; padding-top: 2px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .08em; }\n.scene-card.is-active .scene-index { color: var(--rose); }\n.scene-copy { min-width: 0; }\n.scene-title { display: block; color: var(--paper); font-family: var(--font-display); font-size: 13px; letter-spacing: .02em; }\n.scene-sub { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; color: var(--muted-2); font-size: 8px; }\n.scene-sub i { width: 2px; height: 2px; border-radius: 50%; background: var(--muted-2); }\n.scene-card-arrow { flex: 0 0 auto; margin-left: auto; color: var(--muted-2); font-size: 15px; line-height: 1; padding-top: 2px; transition: transform .25s, color .25s; }\n.scene-card:hover .scene-card-arrow, .scene-card.is-active .scene-card-arrow { color: var(--rose); transform: translateX(2px); }\n.scene-empty { padding: 19px 13px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--muted-2); font-size: 9.5px; line-height: 1.8; text-align: center; }\n.custom-scene-btn { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 42px; margin-top: 8px; border: 1px dashed var(--line-strong); border-radius: 7px; color: var(--muted); font-size: 9px; transition: all .2s; }\n.custom-scene-btn:hover { color: var(--rose); border-color: rgba(255,146,168,.5); background: rgba(255,146,168,.04); }\n.custom-scene-btn svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.opening-tip { display: flex; gap: 9px; margin-top: 21px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted-2); font-size: 8.5px; line-height: 1.8; }\n.opening-tip svg { width: 13px; height: 13px; flex: 0 0 auto; margin-top: 2px; color: var(--gold); fill: none; stroke: currentColor; stroke-width: 1.4; }\n.opening-preview-panel { position: sticky; top: calc(var(--header-h) + 15px); min-width: 0; padding-top: 4px; }\n.cinema-card { position: relative; min-height: 575px; overflow: hidden; border: 1px solid rgba(255,255,255,.18); border-radius: 7px 31px 7px 7px; background: #10141f; box-shadow: 0 36px 90px rgba(0,0,0,.35); isolation: isolate; }\n.cinema-bg { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center; filter: saturate(.85); transform: scale(1.02); transition: background-image .5s, transform .8s var(--ease-out); }\n.cinema-card:hover .cinema-bg { transform: scale(1.05); }\n.cinema-vignette { position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(4,7,12,.22) 0%, rgba(4,7,12,.1) 34%, rgba(4,7,12,.62) 64%, rgba(4,7,12,.97) 100%); }\n.cinema-card::after { content: \"\"; position: absolute; inset: 11px; border: 1px solid rgba(255,255,255,.15); border-radius: 2px 23px 2px 2px; pointer-events: none; z-index: 3; }\n.cinema-top { position: relative; z-index: 4; display: flex; justify-content: space-between; align-items: center; padding: 21px 24px 0; }\n.cinema-index { color: rgba(255,255,255,.65); font-family: var(--font-mono); font-size: 7.5px; letter-spacing: .13em; }\n.cinema-status { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,.55); font-family: var(--font-latin); font-size: 7px; letter-spacing: .14em; }\n.cinema-status i { width: 4px; height: 4px; border-radius: 50%; background: var(--rose); box-shadow: 0 0 8px var(--rose); }\n.cinema-copy { position: relative; z-index: 4; display: flex; flex-direction: column; justify-content: flex-end; min-height: 480px; padding: 120px 30px 80px; }\n.cinema-kicker { color: var(--rose); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .2em; }\n.cinema-copy h2 { max-width: 560px; margin-top: 12px; color: #fff; font-family: var(--font-display); font-size: clamp(26px, 3vw, 40px); font-weight: 500; line-height: 1.38; letter-spacing: -.02em; text-shadow: 0 2px 30px rgba(0,0,0,.3); }\n.cinema-scene-meta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 17px; color: rgba(255,255,255,.61); font-size: 8.5px; }\n.cinema-scene-meta span { display: flex; align-items: center; gap: 5px; }\n.cinema-scene-meta svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.4; }\n.cinema-scene-meta b { font-weight: 400; }\n.cinema-text { max-width: 575px; margin-top: 17px; color: rgba(255,255,255,.75); font-family: var(--font-display); font-size: 11px; line-height: 2; letter-spacing: .02em; display: -webkit-box; overflow: hidden; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }\n.cinema-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 17px; }\n.cinema-tags span { padding: 3px 8px; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; color: rgba(255,255,255,.58); font-size: 7.5px; }\n.cinema-bottom { position: absolute; z-index: 4; left: 30px; right: 30px; bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }\n.cinema-persona { display: flex; align-items: center; gap: 9px; }\n.cinema-persona .mini-avatar { width: 29px; height: 29px; font-size: 10px; }\n.cinema-persona span:last-child { display: flex; flex-direction: column; }\n.cinema-persona small { color: rgba(255,255,255,.35); font-family: var(--font-latin); font-size: 6px; letter-spacing: .13em; }\n.cinema-persona b { margin-top: 2px; color: rgba(255,255,255,.8); font-family: var(--font-display); font-size: 11px; font-weight: 400; letter-spacing: .06em; }\n.cinema-scroll-hint { display: flex; align-items: center; gap: 9px; color: rgba(255,255,255,.36); font-family: var(--font-latin); font-size: 6.5px; letter-spacing: .12em; }\n.cinema-scroll-hint i { display: block; width: 27px; height: 1px; background: rgba(255,255,255,.4); }\n.opening-summary { margin-top: 20px; }\n.summary-row { display: flex; justify-content: space-between; gap: 20px; padding: 0 3px; }\n.summary-block .micro-label { margin-bottom: 4px; }\n.summary-block p { color: var(--muted-2); font-size: 9px; }\n.summary-block p b { color: var(--paper); font-family: var(--font-display); font-size: 16px; font-weight: 500; }\n.summary-block p i { display: inline-block; width: 2px; height: 2px; margin: 0 5px 3px; border-radius: 50%; background: var(--muted-2); }\n.summary-block-right { text-align: right; }\n.summary-block-right .text-btn { margin-top: 4px; font-size: 9px; }\n.btn-begin { display: flex; width: 100%; min-height: 65px; margin-top: 17px; padding: 7px 9px 7px 24px; border-radius: 8px; justify-content: space-between; }\n.btn-begin-label { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2; }\n.btn-begin-label small { color: rgba(34,24,34,.53); font-family: var(--font-latin); font-size: 7px; letter-spacing: .15em; }\n.btn-begin-label b { margin-top: 5px; font-family: var(--font-display); font-size: 19px; font-weight: 600; letter-spacing: .06em; }\n.btn-begin .btn-icon { width: 49px; height: 49px; }\n.btn-begin .btn-icon svg { width: 19px; height: 19px; }\n.opening-disclaimer { margin-top: 11px; color: var(--muted-2); font-size: 8px; text-align: center; letter-spacing: .03em; }\n\n/* ==========================================================================\n   MODALS / LAUNCH / TOAST\n   ========================================================================== */\n.modal-layer { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 20px; }\n.modal-backdrop { position: absolute; inset: 0; background: rgba(3,5,10,.76); -webkit-backdrop-filter: blur(13px); backdrop-filter: blur(13px); }\n.modal-card { position: relative; z-index: 1; width: min(100%, 570px); max-height: 88vh; overflow-y: auto; padding: clamp(22px, 3vw, 34px); border: 1px solid rgba(255,255,255,.18); border-radius: 22px; background: linear-gradient(150deg, #161b28, #0b0f18); box-shadow: 0 40px 100px rgba(0,0,0,.5); animation: modalIn .45s var(--ease-out) both; }\n@keyframes modalIn { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }\n.modal-top { display: flex; justify-content: space-between; align-items: center; }\n.modal-card h2 { margin-top: 18px; font-family: var(--font-display); font-size: clamp(28px, 3.8vw, 38px); font-weight: 500; letter-spacing: -.03em; }\n.modal-desc { max-width: 460px; margin-top: 10px; color: var(--muted); font-size: 10.5px; line-height: 1.9; }\n.custom-modal .field { margin-top: 20px; }\n.modal-actions { display: flex; justify-content: flex-end; align-items: center; gap: 19px; margin-top: 25px; }\n.launch-layer { position: fixed; inset: 0; z-index: 300; display: grid; place-items: center; overflow: hidden; background: #05070c; }\n.launch-bg { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: .35; filter: blur(15px) saturate(.7); transform: scale(1.08); animation: launchBg 12s ease-in-out infinite alternate; }\n@keyframes launchBg { to { transform: scale(1.16) translateY(-1.5%); } }\n.launch-grain { position: absolute; inset: 0; opacity: .07; pointer-events: none; background-image: url(\"data:image/svg+xml;utf8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\"); animation: grainShift .8s steps(2) infinite; }\n.launch-layer::after { content: \"\"; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 5%, rgba(3,5,10,.42) 55%, rgba(3,5,10,.92) 100%); }\n.launch-stage { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; width: min(90vw, 600px); text-align: center; transition: opacity .5s, transform .5s; }\n.launch-stage.is-hidden { opacity: 0; transform: translateY(-16px); pointer-events: none; }\n.launch-sigil { position: relative; width: 96px; height: 96px; margin-bottom: 27px; color: var(--rose); }\n.launch-sigil svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: .8; animation: spin 16s linear infinite; }\n.launch-sigil span { position: absolute; border: 1px solid rgba(255,255,255,.15); border-radius: 50%; }\n.launch-sigil span:nth-child(1) { inset: 8px; animation: pulseRing 2.8s ease-in-out infinite; }\n.launch-sigil span:nth-child(2) { inset: -10px; border-color: rgba(255,146,168,.17); animation: pulseRing 2.8s -1s ease-in-out infinite; }\n.launch-sigil span:nth-child(3) { inset: -28px; border-color: rgba(255,255,255,.06); animation: pulseRing 2.8s -2s ease-in-out infinite; }\n@keyframes pulseRing { 0%, 100% { transform: scale(.94); opacity: .4; } 50% { transform: scale(1.04); opacity: 1; } }\n.launch-eyebrow { color: var(--muted-2); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .3em; }\n.launch-title { margin-top: 15px; color: var(--paper); font-family: var(--font-display); font-size: clamp(40px, 6vw, 68px); font-weight: 500; letter-spacing: .05em; line-height: 1.25; }\n.launch-sub { margin-top: 13px; color: var(--muted); font-size: 10px; letter-spacing: .13em; }\n.launch-progress { width: min(62vw, 315px); height: 1px; margin-top: 35px; background: rgba(255,255,255,.15); overflow: hidden; }\n.launch-progress span { display: block; width: 0%; height: 100%; background: linear-gradient(90deg, var(--rose), var(--violet), var(--cyan)); box-shadow: 0 0 10px var(--rose); transition: width .4s linear; }\n.launch-log { margin-top: 15px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7.5px; letter-spacing: .08em; }\n.launch-result { position: relative; z-index: 5; width: min(92vw, 680px); max-height: 90vh; overflow-y: auto; padding: 31px 35px 29px; border: 1px solid rgba(255,255,255,.18); border-radius: 7px 28px 7px 7px; background: rgba(11,15,24,.85); box-shadow: 0 40px 100px rgba(0,0,0,.45); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); animation: resultIn .7s var(--ease-out) both; }\n@keyframes resultIn { from { opacity: 0; transform: translateY(30px) scale(.98); } to { opacity: 1; transform: none; } }\n.launch-result-top { display: flex; justify-content: space-between; align-items: center; }\n.result-seal { display: grid; place-items: center; width: 51px; height: 51px; margin: 22px 0 15px; border: 1px solid rgba(255,146,168,.55); border-radius: 50%; color: var(--rose); font-family: var(--font-display); font-size: 22px; transform: rotate(-8deg); }\n.result-kicker { color: var(--rose); font-family: var(--font-latin); font-size: 8px; font-weight: 700; letter-spacing: .19em; }\n.launch-result h2 { margin-top: 8px; font-family: var(--font-display); font-size: clamp(28px, 3.6vw, 40px); font-weight: 500; letter-spacing: -.02em; }\n.result-dossier { margin-top: 21px; padding: 17px 18px; border-left: 1px solid rgba(255,146,168,.45); background: rgba(255,255,255,.025); }\n.result-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 13px; color: var(--muted-2); font-size: 8.5px; }\n.result-meta span { display: inline-flex; align-items: center; gap: 4px; }\n.result-meta b { color: var(--muted); font-weight: 500; }\n.result-dossier p { color: rgba(239,234,224,.7); font-family: var(--font-display); font-size: 11px; line-height: 2.15; white-space: pre-wrap; }\n.result-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 23px; }\n.result-actions .btn { min-height: 44px; padding-left: 16px; font-size: 9.5px; gap: 8px; }\n.result-actions .btn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.result-actions .text-btn { margin-left: auto; }\n.toast-region { position: fixed; z-index: 400; left: 50%; bottom: 28px; transform: translateX(-50%); display: flex; flex-direction: column; gap: 7px; pointer-events: none; }\n.toast { display: flex; align-items: center; gap: 9px; min-height: 40px; padding: 8px 15px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: rgba(16,21,31,.9); color: var(--paper); font-size: 10px; box-shadow: 0 12px 35px rgba(0,0,0,.3); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); animation: toastIn .35s var(--ease-out) both; }\n.toast svg { width: 13px; height: 13px; fill: none; stroke: var(--cyan); stroke-width: 1.6; }\n.toast.is-out { animation: toastOut .3s ease both; }\n@keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }\n@keyframes toastOut { to { opacity: 0; transform: translateY(8px); } }\n\n/* ==========================================================================\n   RESPONSIVE\n   ========================================================================== */\n@container galworld (max-width: 1240px) {\n  .home-hero { grid-template-columns: minmax(0, 1fr) minmax(340px, .86fr); gap: 30px; }\n  .home-visual { min-height: 550px; }\n  .hero-frame { width: min(100%, 440px); }\n  .float-card-a { left: -10px; }\n  .float-card-b { right: -10px; }\n  .nav-link { min-width: 78px; padding: 0 10px; }\n  .nav-glider { width: 78px; }\n  .archive { gap: 11px; }\n  .library { flex-basis: 43%; }\n  .detail-hero { grid-template-columns: 165px minmax(0,1fr); }\n  .cast-layout { grid-template-columns: minmax(210px, 270px) minmax(0,1fr); }\n  .channel-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }\n  .channel:last-child { grid-column: span 2; }\n  .channel:last-child .channel-main { display: grid; grid-template-columns: 1.5fr 1fr; gap: 0 25px; }\n  .channel:last-child .channel-head { grid-column: 1 / -1; }\n  .channel:last-child .channel-signal { grid-column: 1; }\n  .channel:last-child .channel-controls { grid-column: 2; grid-row: 2 / span 2; margin-top: 13px; }\n  .channel:last-child .channel-slider-row { grid-column: 1; }\n  .channel:last-child .channel-cast { grid-column: 1 / -1; }\n}\n\n@container galworld (max-width: 1040px) {\n  .nav-shell { gap: 14px; }\n  .brand { min-width: 150px; }\n  .brand-en { font-size: 12px; }\n  .nav-meta { display: none; }\n  .home-hero { grid-template-columns: minmax(0, 1fr) minmax(310px, .8fr); }\n  .home-visual { min-height: 500px; }\n  .float-card-b { display: none; }\n  .home-index-desc { display: none; }\n  .index-card { min-height: 330px; }\n  .index-cover-stack { transform: scale(.82); transform-origin: bottom right; }\n  .overview-grid { grid-template-columns: 1fr; }\n  .coherence-card { width: 100%; }\n  .persona-layout { grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr); gap: 22px; }\n  .persona-form { padding: 24px 20px; }\n  .persona-preview { position: static; padding-top: 0; }\n  .opening-layout { grid-template-columns: minmax(335px, .9fr) minmax(0, 1.1fr); gap: 22px; }\n  .cinema-copy { padding-left: 23px; padding-right: 23px; }\n  .cinema-bottom { left: 23px; right: 23px; }\n}\n\n@container galworld (max-width: 980px) {\n  :host, .gw-app { --header-h: 78px; }\n  .nav-shell { gap: 10px; padding-inline: 17px; }\n  .brand { min-width: 0; }\n  .brand-mark { width: 31px; height: 31px; }\n  .brand-en { font-size: 11px; letter-spacing: .18em; }\n  .brand-cn { font-size: 8px; letter-spacing: .22em; margin-top: 5px; }\n  .site-nav { gap: 0; }\n  .nav-link { min-width: 55px; padding: 0 7px; flex-direction: column; justify-content: center; align-items: center; gap: 1px; }\n  .nav-num { font-size: 7px; }\n  .nav-cn { font-size: 12px; letter-spacing: .05em; }\n  .nav-glider { top: 10px; bottom: 10px; }\n  .page-head { align-items: flex-start; }\n  .page-head-aside { display: none; }\n  .home-hero { display: block; padding-top: 30px; }\n  .home-copy { max-width: 640px; }\n  .hero-title { font-size: clamp(48px, 10.2vw, 84px); }\n  .title-soft { margin-left: 12%; }\n  .hero-lede { max-width: 540px; }\n  .home-visual { width: min(100%, 470px); min-height: auto; margin: 42px auto 0; overflow: hidden; padding: 12px 0 8px; }\n  .hero-frame { width: 100%; }\n  .hero-orbit-a { width: 100%; height: 170px; }\n  .hero-orbit-b { width: 94%; height: 100px; }\n  .float-card-a { left: 4px; bottom: 15%; }\n  .home-index { padding-top: 64px; }\n  .index-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }\n  .index-card, .index-card:nth-child(2), .index-card:nth-child(3), .index-card:nth-child(4) { grid-column: span 1; }\n  .index-card-wide { grid-column: span 2 !important; min-height: 350px; }\n  .index-cover-stack { right: 6%; transform: scale(.9); }\n  .home-footer { margin-top: 55px; }\n  .archive { display: block; }\n  .library { min-height: 0; padding-bottom: 0; }\n  .library:not(.is-mobile-hidden) { margin-bottom: 13px; }\n  .library-main { height: auto; }\n  .work-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }\n  .library-foot { margin-top: 22px; }\n  .library-spine { position: absolute; inset: 0; }\n  .archive.is-focused .library { display: none; }\n  .archive.is-focused .work-detail { flex-basis: auto; }\n  .work-detail { min-height: 670px; }\n  .detail-surface { min-height: 670px; }\n  .detail-hero { grid-template-columns: 155px minmax(0,1fr); gap: 23px; padding: 24px 21px 20px; }\n  .detail-title { font-size: clamp(27px, 5vw, 40px); }\n  .detail-intro { font-size: 10.5px; }\n  .detail-tabs { margin: 0 21px; }\n  .detail-panels { padding: 19px 21px 24px; }\n  .overview-grid { grid-template-columns: 1fr; }\n  .cast-layout { grid-template-columns: 240px minmax(0,1fr); gap: 21px; }\n  .cast-stage { min-height: 430px; }\n  .story-layout { grid-template-columns: 1fr; gap: 24px; }\n  .story-side { border-left: 0; border-top: 1px solid var(--line); padding-left: 0; padding-top: 18px; }\n  .story-route { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px 20px; }\n  .route-item::after { display: none; }\n  .overview-head { padding: 22px 20px 0; }\n  .overview-grid { padding: 18px 20px 18px; }\n  .overview-meters { gap: 7px; }\n  .meter-card { padding: 11px 12px; }\n  .meter-card strong { font-size: 25px; }\n  .master-row { padding: 13px 20px; flex-wrap: wrap; }\n  .master-switch { min-height: 44px; }\n  .console-list-head { margin-top: 34px; }\n  .channel-grid { grid-template-columns: 1fr; }\n  .channel:last-child { grid-column: auto; }\n  .channel:last-child .channel-main { display: block; }\n  .channel:last-child .channel-controls { margin-top: 11px; }\n  .persona-layout { display: block; max-width: 720px; }\n  .persona-preview { margin-top: 28px; max-width: 470px; }\n  .persona-card { min-height: 570px; }\n  .opening-layout { display: block; }\n  .opening-preview-panel { position: static; margin-top: 27px; }\n  .cinema-card { min-height: 530px; }\n  .cinema-copy { min-height: 440px; }\n  .opening-work-picker { grid-template-columns: repeat(3, minmax(0,1fr)); }\n  .opening-step-scenes { padding-top: 20px; }\n}\n\n@container galworld (max-width: 620px) {\n  :host, .gw-app { --gutter: 16px; --header-h: 72px; }\n  body { font-size: 14px; }\n  .nav-shell { padding-inline: 13px; gap: 8px; }\n  .brand { gap: 7px; }\n  .brand-mark { width: 27px; height: 27px; }\n  .brand-en { font-size: 9.5px; letter-spacing: .14em; }\n  .brand-cn { display: none; }\n  .nav-link { min-width: 48px; padding: 0 3px; }\n  .nav-cn { font-size: 11px; }\n  .nav-num { display: none; }\n  .nav-glider { top: 8px; bottom: 8px; }\n  .page-head { padding-top: 35px; padding-bottom: 25px; }\n  .page-title { margin-top: 13px; font-size: clamp(35px, 10vw, 52px); }\n  .page-desc { margin-top: 12px; font-size: 11px; line-height: 1.8; }\n  .eyebrow { font-size: 8px; letter-spacing: .15em; }\n  .home-hero { padding-top: 20px; padding-bottom: 46px; }\n  .hero-title { margin-top: 19px; font-size: clamp(42px, 13.5vw, 66px); line-height: 1.1; }\n  .title-soft { margin-left: 7%; }\n  .hero-lede { margin-top: 20px; font-size: 12px; line-height: 2; }\n  .hero-actions { margin-top: 25px; gap: 9px; }\n  .hero-actions .btn { min-height: 47px; padding-left: 17px; font-size: 10.5px; gap: 10px; }\n  .hero-actions .btn-icon { width: 37px; height: 37px; }\n  .btn-ghost { padding: 0 16px; }\n  .hero-stats { gap: 12px; margin-top: 30px; }\n  .stat { gap: 5px; }\n  .stat b { font-size: 20px; }\n  .stat span { font-size: 8px; }\n  .home-visual { margin-top: 31px; }\n  .float-card-a { left: -7px; bottom: 13%; transform: scale(.86); transform-origin: left bottom; }\n  .hero-coord { display: none; }\n  .hero-frame-copy { left: 19px; right: 19px; bottom: 17px; }\n  .home-marquee { margin-inline: calc(var(--gutter) * -1); }\n  .marquee-track { padding: 11px 0; }\n  .marquee-track span { font-size: 9px; }\n  .home-index { padding-top: 54px; }\n  .home-index-head { margin-bottom: 22px; }\n  .home-index-head h2 { font-size: 29px; }\n  .index-grid { display: flex; flex-direction: column; gap: 9px; }\n  .index-card, .index-card:nth-child(2), .index-card:nth-child(3), .index-card:nth-child(4), .index-card-wide { width: 100%; min-height: 290px; padding: 20px 20px 18px; }\n  .index-cover-stack { width: 190px; height: 230px; right: 4%; bottom: 7%; transform: scale(.7); transform-origin: bottom right; }\n  .index-card-body { max-width: 65%; }\n  .index-card:not(.index-card-wide) .index-card-body { max-width: 75%; }\n  .index-title { font-size: 27px; }\n  .index-desc { font-size: 9.5px; }\n  .index-icon { top: 19px; right: 19px; width: 38px; height: 38px; }\n  .index-card-foot { margin-top: 19px; }\n  .home-footer { padding: 30px 0 24px; margin-top: 48px; flex-direction: column; gap: 7px; font-size: 7px; }\n  .library { padding: 14px 13px 0; border-radius: 17px; }\n  .search-box { min-height: 43px; padding: 0 12px; }\n  .search-box kbd { display: none; }\n  .filter-bar { gap: 2px; margin-top: 11px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }\n  .filter-bar::-webkit-scrollbar { display: none; }\n  .filter-chip { flex: 0 0 auto; font-size: 8px; }\n  .library-title { margin-top: 18px; }\n  .work-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 7px; }\n  .work-card-title { font-size: 14px; }\n  .work-card-tags { display: none; }\n  .library-foot { margin-inline: -13px; padding: 15px 13px 13px; }\n  .library-foot p { font-size: 8.5px; }\n  .library-foot-index { display: none; }\n  .detail-topbar { padding: 13px 15px; }\n  .detail-breadcrumb { font-size: 6.5px; }\n  .detail-shelf-btn { min-height: 31px; padding: 0 9px; font-size: 8px; }\n  .detail-shelf-btn span { display: none; }\n  .detail-toolbar .icon-btn { width: 31px; height: 31px; }\n  .detail-hero { display: block; padding: 20px 16px 18px; }\n  .detail-cover-wrap { float: left; width: 104px; margin: 0 15px 10px 0; }\n  .detail-cover-no { width: 25px; height: 25px; font-size: 7px; top: -6px; left: -6px; }\n  .detail-cover-caption { display: none; }\n  .detail-hero-copy { display: block; min-width: 0; }\n  .detail-kicker { font-size: 7px; }\n  .detail-title { margin-top: 8px; font-size: 27px; }\n  .detail-jp { font-size: 7px; }\n  .detail-tagline { margin-top: 8px; font-size: 10.5px; }\n  .detail-intro { margin-top: 7px; font-size: 9.5px; line-height: 1.8; }\n  .detail-meta-row { margin-top: 9px; gap: 4px 11px; clear: both; }\n  .detail-meta { font-size: 8px; }\n  .detail-tags { margin-top: 10px; clear: both; }\n  .detail-tags span { font-size: 7.5px; padding: 2px 6px; }\n  .detail-actions { margin-top: 13px; clear: both; }\n  .detail-actions .btn { min-height: 39px; font-size: 9px; }\n  .detail-actions .btn-icon { width: 29px; height: 29px; }\n  .save-work-btn { height: 39px; font-size: 9px; }\n  .detail-tabs { margin: 0 16px; gap: 20px; }\n  .detail-tab { font-size: 12px; padding: 10px 0 11px; }\n  .detail-panels { padding: 15px 16px 20px; }\n  .overview-grid { gap: 10px; }\n  .overview-block { padding: 13px 14px; }\n  .overview-block p { font-size: 10px; }\n  .overview-block-label { font-size: 7px; }\n  .cast-layout { display: flex; flex-direction: column; gap: 18px; }\n  .cast-stage { min-height: 340px; max-height: 380px; border-radius: 3px 22px 3px 3px; }\n  .cast-info { padding-top: 0; }\n  .cast-name { font-size: 29px; }\n  .cast-quote { margin-top: 13px; font-size: 12px; padding-top: 9px; padding-bottom: 9px; }\n  .cast-bio { font-size: 10px; line-height: 1.95; }\n  .cast-rail { margin-top: 14px; }\n  .story-text { font-size: 10.5px; line-height: 2.05; }\n  .story-head-left { font-size: 7px; }\n  .story-edit-btn { font-size: 8.5px; }\n  .story-route { display: block; }\n  .story-side { padding-top: 16px; }\n  .overview-head { padding: 19px 15px 0; }\n  .overview-head h2 { font-size: 25px; }\n  .overview-timestamp { display: none; }\n  .overview-grid { padding: 16px 15px; }\n  .overview-meters { grid-template-columns: 1fr 1fr 1fr; gap: 5px; }\n  .meter-card { padding: 9px 9px 8px; }\n  .meter-label { font-size: 7px; }\n  .meter-card strong { font-size: 22px; margin-top: 6px; }\n  .coherence-card { padding: 10px 12px; }\n  .coherence-ring { width: 67px; height: 67px; }\n  .coherence-ring strong { font-size: 20px; }\n  .coherence-copy h3 { font-size: 13px; }\n  .coherence-copy p { font-size: 7.5px; }\n  .master-row { padding: 11px 14px 13px; }\n  .master-switches { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; gap: 5px; overflow: visible; }\n  .master-switch { display: grid; grid-template-columns: 1fr auto; align-items: center; min-width: 0; min-height: 38px; padding: 5px 7px; gap: 5px; border: 1px solid var(--line); }\n  .master-switch:hover { border-color: var(--line); }\n  .master-switch small { display: none; }\n  .master-switch b { font-size: 8px; white-space: nowrap; letter-spacing: 0; }\n  .master-icon { display: none; }\n  .switch { width: 24px; height: 14px; margin-left: 0; }\n  .switch i { width: 8px; height: 8px; }\n  .master-switch[aria-pressed=\"true\"] .switch i { transform: translateX(10px); }\n  .master-actions { margin-left: auto; margin-top: 3px; }\n  .master-actions .btn { min-height: 32px; font-size: 8.5px; }\n  .console-list-head { display: block; margin-top: 28px; }\n  .console-list-head h2 { font-size: 25px; }\n  .channel-legend { margin-top: 10px; gap: 10px; font-size: 7.5px; }\n  .legend-hint { display: none !important; }\n  .channel-main { padding: 12px 13px 11px; }\n  .channel-title { font-size: 13px; }\n  .channel-controls { gap: 4px; }\n  .channel-toggle { min-height: 41px; padding: 5px 4px; }\n  .channel-toggle span { font-size: 7.5px; }\n  .channel-toggle b { font-size: 6.5px; }\n  .channel-slider-row { margin-top: 10px; }\n  .channel-cast { margin-top: 7px; }\n  .console-foot-note { font-size: 7.5px; line-height: 1.8; text-align: center; }\n  .persona-form { padding: 18px 14px; border-radius: 18px; }\n  .form-section-head { gap: 9px; }\n  .form-section-head h2 { font-size: 21px; }\n  .form-section-head p { font-size: 8px; }\n  .inspiration-btn { padding: 5px 7px; font-size: 7.5px; }\n  .inspiration-btn span { display: none; }\n  .form-grid { grid-template-columns: 1fr; gap: 15px; margin-top: 23px; }\n  .field-full { grid-column: auto; }\n  .field-label { font-size: 10px; }\n  .field-hint { font-size: 7.5px; }\n  .input-wrap input { height: 45px; }\n  .form-section-head-sub { margin-top: 26px; padding-top: 21px; }\n  .aesthetic-picker { gap: 21px; margin-top: 17px; }\n  .form-footer { display: block; margin-top: 22px; }\n  .form-actions { justify-content: space-between; margin-top: 15px; }\n  .form-note { font-size: 7.5px; }\n  .btn-save { min-height: 44px; font-size: 10px; }\n  .persona-preview { margin-top: 23px; }\n  .persona-card { min-height: 535px; border-radius: 5px 25px 5px 5px; }\n  .persona-portrait { height: 280px; }\n  .persona-silhouette { transform: translateX(-50%) scale(.87); transform-origin: bottom center; }\n  .persona-card-body { padding: 0 20px 20px; }\n  .persona-name-row h2 { font-size: 30px; }\n  .persona-seal { width: 38px; height: 38px; font-size: 10px; }\n  .persona-quote { font-size: 10.5px; }\n  .persona-card-bottom { left: 20px; right: 20px; }\n  .portrait-caption { left: 20px; }\n  .persona-card-top { left: 20px; right: 20px; font-size: 6px; }\n  .opening-layout { padding-top: 0; }\n  .opening-step { padding-bottom: 21px; }\n  .step-head h2 { font-size: 21px; }\n  .opening-work-picker { grid-template-columns: repeat(3, minmax(0,1fr)); gap: 5px; margin-top: 14px; }\n  .opening-work { min-height: 49px; padding: 6px; gap: 5px; }\n  .opening-work-cover { width: 20px; }\n  .opening-work-name { font-size: 8.5px; }\n  .opening-tabs { gap: 15px; margin-top: 14px; }\n  .opening-tab { font-size: 8.5px; }\n  .scene-card { padding: 10px; gap: 9px; }\n  .scene-title { font-size: 12px; }\n  .scene-sub { font-size: 7.5px; }\n  .cinema-card { min-height: 490px; border-radius: 5px 23px 5px 5px; }\n  .cinema-copy { min-height: 410px; padding: 100px 20px 65px; }\n  .cinema-copy h2 { font-size: 25px; }\n  .cinema-text { font-size: 10px; }\n  .cinema-top { padding: 16px 18px 0; }\n  .cinema-bottom { left: 20px; right: 20px; bottom: 18px; }\n  .cinema-scroll-hint { display: none; }\n  .cinema-persona b { font-size: 10px; }\n  .summary-row { display: block; }\n  .summary-block-right { text-align: left; margin-top: 9px; }\n  .summary-block-right .text-btn { font-size: 8.5px; }\n  .btn-begin { min-height: 60px; }\n  .btn-begin-label b { font-size: 17px; }\n  .page-opening { padding-bottom: 65px; }\n  .modal-layer { padding: 12px; }\n  .modal-card { padding: 19px 16px; border-radius: 17px; }\n  .modal-actions { gap: 12px; }\n  .launch-result { padding: 22px 18px; border-radius: 5px 20px 5px 5px; max-height: 90vh; }\n  .result-dossier { padding: 13px 14px; }\n  .result-actions .text-btn { margin-left: 0; }\n  .toast-region { bottom: 18px; width: calc(100% - 32px); align-items: center; }\n  .toast { font-size: 9px; }\n}\n\n@container galworld (max-width: 380px) {\n  .nav-link { min-width: 43px; }\n  .nav-cn { font-size: 10px; }\n  .hero-title { font-size: 39px; }\n  .hero-stats { gap: 9px; }\n  .stat span { font-size: 7.5px; }\n  .detail-cover-wrap { width: 92px; }\n  .detail-title { font-size: 23px; }\n  .overview-meters { grid-template-columns: 1fr 1fr; }\n  .meter-card:last-child { grid-column: span 2; }\n}\n\n/* runtime additions */\n@property --value { syntax: '<number>'; inherits: false; initial-value: 0; }\n.cinema-title-soft { display: block; margin-top: 10px; color: rgba(255,255,255,.56); font-family: var(--font-display); font-size: .43em; font-weight: 400; line-height: 1.7; letter-spacing: .02em; }\n.detail-shelf-btn.is-expanded svg { transform: rotate(180deg); }\n\n/* ==========================================================================\n   READABILITY PASS — readable content gets a floor, microtype stays micro\n   ========================================================================== */\n.filter-chip { font-size: 10px; }\n.library-title { font-size: 8.5px; }\n.work-card-sub { font-size: 7px; letter-spacing: .08em; }\n.work-card-tags span { font-size: 7px; }\n.detail-jp { font-size: 9.5px; }\n.detail-meta { font-size: 10px; }\n.detail-tags span { font-size: 9.5px; }\n.detail-intro { font-size: 12px; }\n.overview-block p { font-size: 12px; }\n.overview-block-label { font-size: 8px; }\n.cast-kicker { font-size: 8.5px; }\n.cast-bio { font-size: 11.5px; }\n.cast-tags span { font-size: 9.5px; }\n.story-text { font-size: 12.5px; }\n.story-head-left { font-size: 8px; }\n.route-item p { font-size: 10px; }\n.route-label { font-size: 8px; }\n.channel-sub { font-size: 8px; }\n.channel-toggle span { font-size: 8.7px; }\n.channel-toggle b { font-size: 7.5px; }\n.channel-signal span, .channel-signal em { font-size: 7.5px; }\n.cast-tune-name { font-size: 9px; }\n.cast-tune-role { font-size: 7.5px; }\n.cast-gender-toggle { font-size: 7.5px; }\n.opening-tab { font-size: 9.5px; }\n.opening-work-name { font-size: 10.5px; }\n.opening-work-num { font-size: 7px; }\n.scene-sub { font-size: 8.5px; }\n.summary-block p { font-size: 9.5px; }\n.cinema-text { font-size: 11.5px; }\n.cinema-tags span { font-size: 8px; }\n.persona-quote { font-size: 11.8px; }\n.suggestion-chip { font-size: 9px; }\n\n@container galworld (max-width: 620px) {\n  .filter-chip { font-size: 9px; }\n  .work-card-sub { font-size: 7px; }\n  .detail-intro { font-size: 10px; }\n  .detail-meta { font-size: 8.5px; }\n  .overview-block p { font-size: 10.5px; }\n  .channel-toggle span { font-size: 8px; }\n  .channel-toggle b { font-size: 6.9px; }\n  .scene-sub { font-size: 8px; }\n  .cinema-text { font-size: 10.5px; }\n  .opening-work-name { font-size: 8.6px; }\n  .opening-tab { font-size: 9px; }\n  .master-switch b { font-size: 8.3px; }\n}\n\n/* home bento ornament */\n.index-card[data-chapter]::before {\n  content: attr(data-chapter);\n  position: absolute;\n  right: 18px;\n  bottom: -26px;\n  z-index: 0;\n  color: rgba(255, 255, 255, .035);\n  font-family: var(--font-display);\n  font-size: clamp(126px, 12vw, 190px);\n  font-weight: 500;\n  line-height: 1;\n  letter-spacing: -.08em;\n  pointer-events: none;\n}\n.index-card:nth-child(2) { --card-accent: var(--violet); }\n.index-card:nth-child(3) { --card-accent: var(--cyan); }\n.index-card:nth-child(4) { --card-accent: var(--gold); }\n\n@container galworld (max-width: 380px) {\n  .nav-shell { padding-inline: 10px; gap: 6px; }\n  .nav-link { min-width: 40px; padding-inline: 2px; }\n  .opening-work-picker { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .detail-breadcrumb span:first-child,\n  .detail-breadcrumb i { display: none; }\n  .detail-breadcrumb b { max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  .detail-toolbar .save-work-btn { width: 34px; height: 34px; padding: 0; justify-content: center; }\n  .detail-toolbar .save-work-btn span { display: none; }\n  .detail-toolbar .save-work-btn svg { width: 15px; height: 15px; }\n  .detail-toolbar .detail-shelf-btn { width: 34px; justify-content: center; padding: 0; }\n  .detail-toolbar .detail-shelf-btn svg { width: 14px; height: 14px; }\n}\n\n/* keep decorative hero orbits inside mid-size viewports */\n@container galworld (max-width: 1270px) {\n  .home-visual { overflow: hidden; }\n  .float-card-a { left: 0; }\n  .float-card-b { right: 0; }\n}\n\n/* ==========================================================================\n   GALWORLD · 世界之书 — LIGHT THEME OVERRIDES\n   \"Morning paper × champagne rose\"\n   Load AFTER base.css. This file only re-colours / re-surfaces the existing\n   layout; it does not change structure, content or behaviour.\n   ========================================================================== */\n\n/* --------------------------------------------------------------------------\n   01 · Tokens\n   -------------------------------------------------------------------------- */\n:host, .gw-app {\n  /* Paper surfaces: from page base to raised card */\n  --ink-0: #f2e8da;\n  --ink-1: #fbf5eb;\n  --ink-2: #f6ecdf;\n  --ink-3: #e7d8c5;\n\n  /* Ink: deep warm brown, never pure black */\n  --paper: #2b211c;\n  --paper-soft: #47382f;\n\n  /* Secondary text: legible on warm paper */\n  --muted: rgba(43, 33, 28, .74);\n  --muted-2: rgba(43, 33, 28, .64);\n\n  --line: rgba(91, 65, 49, .14);\n  --line-strong: rgba(91, 65, 49, .26);\n\n  /* Iridescent inks, deepened for light ground */\n  --rose: #a64f68;\n  --rose-deep: #8c3e55;\n  --violet: #75619c;\n  --cyan: #386f64;\n  --gold: #8c6630;\n  --blue: #4f6d9c;\n  --danger: #b34545;\n\n  /* Light glass recipes */\n  --paper-glass: rgba(255, 250, 242, .60);\n  --paper-glass-strong: rgba(255, 252, 247, .84);\n  --paper-sunken: rgba(238, 226, 210, .52);\n  --warm-shadow: 0 24px 60px rgba(98, 72, 55, .13);\n  --warm-shadow-soft: 0 10px 26px rgba(98, 72, 55, .09);\n}\n\n\n.gw-app {\n  color: var(--paper);\n  background:\n    radial-gradient(ellipse 62% 52% at 9% -4%, rgba(194, 132, 148, .19), transparent 62%),\n    radial-gradient(ellipse 52% 46% at 91% 9%, rgba(141, 164, 143, .14), transparent 60%),\n    radial-gradient(ellipse 48% 42% at 58% 104%, rgba(196, 164, 123, .12), transparent 64%),\n    linear-gradient(145deg, #fbf5ec 0%, #f4ebdf 48%, #eee2d2 100%);\n  background-attachment: fixed;\n}\n\n::selection {\n  background: rgba(166, 79, 104, .20);\n  color: var(--paper);\n}\n\n::-webkit-scrollbar { width: 9px; height: 9px; }\n::-webkit-scrollbar-track { background: #f4ebdf; }\n::-webkit-scrollbar-thumb {\n  background: rgba(91, 65, 49, .24);\n  border: 2px solid #f4ebdf;\n  border-radius: 99px;\n}\n::-webkit-scrollbar-thumb:hover { background: rgba(91, 65, 49, .38); }\n\n/* --------------------------------------------------------------------------\n   02 · Ambient / paper atmosphere\n   -------------------------------------------------------------------------- */\n.gw-app::before {\n  background:\n    radial-gradient(ellipse at 10% 0%, rgba(186, 116, 136, .14), transparent 44%),\n    radial-gradient(ellipse at 86% 12%, rgba(136, 158, 138, .11), transparent 42%),\n    linear-gradient(145deg, rgba(252, 247, 239, .55), rgba(240, 229, 214, .35));\n}\n\n.ambient-orb {\n  filter: blur(90px);\n  opacity: .52;\n  mix-blend-mode: multiply;\n}\n.ambient-orb-a { background: radial-gradient(circle, rgba(196, 130, 148, .26), transparent 66%); }\n.ambient-orb-b { background: radial-gradient(circle, rgba(144, 168, 145, .22), transparent 66%); }\n.ambient-orb-c { background: radial-gradient(circle, rgba(196, 160, 110, .18), transparent 70%); }\n.ambient-grid {\n  opacity: .13;\n  background-image:\n    linear-gradient(rgba(91, 65, 49, .13) 1px, transparent 1px),\n    linear-gradient(90deg, rgba(91, 65, 49, .13) 1px, transparent 1px);\n}\n#dustCanvas { opacity: .22; }\n.grain { opacity: .032; }\n.cursor-glow { background: radial-gradient(circle, rgba(166, 79, 104, .065), transparent 68%); }\n\n/* Focus: always visible on paper, and on the remaining dark cinema panels */\n:focus-visible {\n  outline: 2px solid var(--rose-deep);\n  outline-offset: 3px;\n}\n.cinema-card :focus-visible,\n.launch-layer :focus-visible,\n.cast-stage :focus-visible {\n  outline-color: #f5e7d8;\n}\n\n/* --------------------------------------------------------------------------\n   03 · Header / navigation\n   -------------------------------------------------------------------------- */\n.site-header {\n  background: linear-gradient(180deg, rgba(251, 246, 238, .96) 0%, rgba(251, 246, 238, .78) 68%, rgba(251, 246, 238, 0) 100%);\n  -webkit-backdrop-filter: blur(20px) saturate(1.15);\n  backdrop-filter: blur(20px) saturate(1.15);\n  box-shadow: 0 1px 0 rgba(91, 65, 49, .10);\n}\n.brand-mark { color: var(--paper); }\n.brand-mark svg { opacity: .82; }\n.brand-mark .mark-star {\n  fill: var(--rose);\n  filter: drop-shadow(0 1px 3px rgba(166, 79, 104, .28));\n}\n.brand-en { color: var(--paper); }\n.brand-cn { color: var(--muted); }\n\n.nav-glider {\n  border-color: rgba(91, 65, 49, .16);\n  background: linear-gradient(135deg, rgba(255, 253, 249, .94), rgba(241, 227, 211, .70));\n  box-shadow: 0 7px 18px rgba(98, 72, 55, .10), inset 0 1px 0 rgba(255, 255, 255, .75);\n}\n.nav-glider::after {\n  background: var(--rose);\n  box-shadow: 0 1px 5px rgba(166, 79, 104, .24);\n}\n.nav-link { color: var(--muted-2); }\n.nav-link:hover { color: var(--paper); }\n.nav-link.is-active { color: var(--paper); }\n.nav-num { color: var(--muted-2); }\n.nav-link.is-active .nav-num { color: var(--rose-deep); }\n.nav-meta { color: var(--muted-2); }\n.save-dot {\n  background: var(--cyan);\n  box-shadow: 0 0 0 3px rgba(56, 111, 100, .11);\n}\n.nav-progress { background: var(--line); }\n.nav-progress span { background: linear-gradient(90deg, transparent, var(--rose), var(--violet), transparent); }\n\n/* --------------------------------------------------------------------------\n   04 · Shared type & controls\n   -------------------------------------------------------------------------- */\n.eyebrow { color: var(--muted); }\n.eyebrow-dot {\n  background: var(--rose);\n  box-shadow: 0 0 0 3px rgba(166, 79, 104, .10);\n}\n.micro-label { color: var(--muted-2); }\n.page-title { color: var(--paper); }\n.page-title em { color: var(--rose-deep); }\n.page-title em::after { background: linear-gradient(90deg, transparent, var(--rose), transparent); }\n.page-desc { color: var(--muted); }\n.page-head-rule { background: linear-gradient(transparent, var(--line-strong), transparent); }\n.page-head-note { color: var(--muted-2); }\n.page-head-note i { color: var(--rose-deep); }\n.page-fade { background: #f4ebdf; }\n\n.skip-link {\n  background: var(--paper);\n  color: #fbf5ea;\n  box-shadow: 0 10px 26px rgba(91, 65, 49, .24);\n}\n\n.btn-primary {\n  border-color: rgba(112, 72, 54, .16);\n  background: linear-gradient(120deg, #f0d8d2 0%, #e5adb7 48%, #d9c69e 100%);\n  color: #33231e;\n  box-shadow: 0 10px 30px rgba(158, 87, 103, .18), inset 0 1px 0 rgba(255, 255, 255, .70);\n}\n.btn-primary:hover {\n  box-shadow: 0 14px 38px rgba(158, 87, 103, .24), inset 0 1px 0 rgba(255, 255, 255, .82);\n}\n.btn-icon {\n  background: #3b2b24;\n  color: #fbf5ea;\n}\n.btn-ghost {\n  border-color: var(--line-strong);\n  color: var(--paper);\n  background: rgba(255, 251, 245, .46);\n}\n.btn-ghost:hover {\n  border-color: rgba(91, 65, 49, .38);\n  background: rgba(255, 253, 249, .82);\n}\n.btn-glow { background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .55), transparent); }\n.text-btn { color: var(--muted); border-color: var(--line); }\n.text-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.text-btn-bright { color: var(--paper); border-color: var(--line-strong); }\n.round-arrow {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .34);\n}\n.icon-btn {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .34);\n}\n.icon-btn:hover {\n  color: var(--paper);\n  border-color: var(--line-strong);\n  background: rgba(255, 253, 249, .8);\n}\n\n/* --------------------------------------------------------------------------\n   05 · HOME · editorial cover\n   -------------------------------------------------------------------------- */\n.hero-title { color: var(--paper); }\n.title-soft {\n  background: linear-gradient(100deg, #2b211c 8%, #6b5547 48%, #947e6d 100%);\n  -webkit-background-clip: text;\n  background-clip: text;\n}\n.title-accent { color: var(--rose-deep); }\n.title-accent::before {\n  background: var(--cyan);\n  box-shadow: 0 0 0 3px rgba(56, 111, 100, .12);\n}\n.title-dot { color: var(--cyan); }\n.hero-lede { color: var(--muted); }\n.stat b { color: var(--paper); }\n.stat span { color: var(--muted-2); }\n.stat-sep { background: var(--line); }\n\n.hero-frame {\n  border-color: rgba(154, 113, 79, .34);\n  background: linear-gradient(150deg, rgba(255, 253, 248, .84), rgba(246, 234, 219, .58) 48%, rgba(222, 177, 187, .28));\n  box-shadow: 0 38px 80px rgba(101, 73, 55, .20), 0 0 70px rgba(191, 145, 156, .14);\n}\n.hero-frame::before { border-color: rgba(91, 65, 49, .16); }\n.hero-frame-inner { background: #efe3d3; }\n.hero-frame-corner.tl,\n.hero-frame-corner.br { border-color: var(--gold); }\n.hero-orbit { border-color: rgba(91, 65, 49, .12); }\n.hero-orbit-b { border-color: rgba(166, 79, 104, .16); }\n.hero-coord { color: var(--muted-2); }\n\n.float-card {\n  border-color: rgba(115, 82, 63, .20);\n  background: rgba(255, 251, 244, .91);\n  box-shadow: 0 22px 48px rgba(94, 66, 51, .16), inset 0 1px 0 rgba(255, 255, 255, .78);\n  -webkit-backdrop-filter: blur(20px) saturate(1.12);\n  backdrop-filter: blur(20px) saturate(1.12);\n}\n.float-card-index { color: var(--rose-deep); }\n.float-card-name { color: var(--paper); }\n.float-card-sub,\n.float-card-label { color: var(--muted-2); }\n.float-card-quote { color: rgba(43, 33, 28, .82); }\n.float-card-line { background: var(--gold); }\n\n.home-marquee {\n  border-color: var(--line);\n  background: rgba(255, 251, 244, .30);\n}\n.marquee-track span { color: var(--muted-2); }\n.marquee-track i { color: var(--rose); }\n\n.home-index-head h2 { color: var(--paper); }\n.home-index-desc { color: var(--muted); }\n.index-card {\n  border-color: var(--line);\n  background: linear-gradient(145deg, rgba(255, 252, 247, .86), rgba(248, 238, 226, .58));\n  box-shadow: 0 16px 38px rgba(98, 72, 55, .07), inset 0 1px 0 rgba(255, 255, 255, .70);\n}\n.index-card:hover {\n  border-color: rgba(91, 65, 49, .28);\n  background: linear-gradient(145deg, rgba(255, 253, 249, .96), rgba(249, 239, 227, .72));\n  box-shadow: 0 26px 56px rgba(98, 72, 55, .14), inset 0 1px 0 rgba(255, 255, 255, .82);\n}\n.index-card-wide {\n  background: linear-gradient(145deg, rgba(215, 161, 173, .20), rgba(255, 252, 247, .78) 54%, rgba(151, 174, 155, .13));\n}\n.index-card::after { opacity: .5; }\n.index-card::before { color: rgba(43, 33, 28, .045); }\n.index-card-top { color: var(--muted-2); }\n.index-kicker { color: var(--rose-deep); }\n.index-title { color: var(--paper); }\n.index-desc { color: var(--muted); }\n.index-icon {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .40);\n}\n.index-card-foot { color: var(--muted-2); }\n.mini-cover {\n  border-color: rgba(255, 252, 247, .82);\n  background-color: var(--ink-2);\n  box-shadow: 0 22px 38px rgba(92, 67, 51, .22);\n}\n.home-footer { border-color: var(--line); color: var(--muted-2); }\n\n/* --------------------------------------------------------------------------\n   06 · ARCHIVE · shelf & detail\n   -------------------------------------------------------------------------- */\n.archive-total b { color: var(--paper); }\n.archive-total span { color: var(--muted-2); }\n\n.library {\n  border-color: var(--line);\n  background: linear-gradient(160deg, rgba(255, 252, 247, .82), rgba(247, 237, 225, .54));\n  box-shadow: var(--warm-shadow-soft), inset 0 1px 0 rgba(255, 255, 255, .76);\n}\n.library::before { background: radial-gradient(circle at 20% 0%, rgba(183, 120, 138, .10), transparent 42%); }\n.archive.is-focused .library {\n  background: linear-gradient(180deg, rgba(255, 252, 247, .65), rgba(246, 236, 223, .40));\n}\n.search-box {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .76);\n}\n.search-box:focus-within {\n  border-color: rgba(166, 79, 104, .55);\n  background: #fffdf9;\n}\n.search-box input { color: var(--paper); }\n.search-box input::placeholder { color: var(--muted-2); }\n.search-box kbd { border-color: var(--line); color: var(--muted-2); background: rgba(238, 226, 210, .42); }\n.filter-chip { color: var(--muted); }\n.filter-chip:hover { color: var(--paper); background: rgba(166, 79, 104, .07); }\n.filter-chip.is-active {\n  border-color: var(--paper);\n  background: var(--paper);\n  color: #fcf6ec;\n  box-shadow: 0 4px 12px rgba(91, 65, 49, .18);\n}\n.filter-chip.is-active span { color: #e8c7b8; opacity: .95; }\n.library-title { color: var(--muted-2); }\n.library-title span:first-child { color: var(--muted); }\n.library-title i { background: var(--rose); }\n\n/* Cards are image-first: keep their dark legibility scrim, warm the frame. */\n.work-card {\n  border-color: rgba(255, 250, 242, .66);\n  box-shadow: 0 8px 20px rgba(98, 72, 55, .12);\n}\n.work-card:hover {\n  border-color: rgba(255, 253, 248, .95);\n  box-shadow: 0 20px 32px rgba(98, 72, 55, .20);\n}\n.work-card.is-selected {\n  border-color: var(--rose);\n  box-shadow: 0 0 0 1px var(--rose), 0 0 0 5px rgba(166, 79, 104, .13), 0 18px 34px rgba(98, 72, 55, .20);\n}\n.work-card-index { color: rgba(255, 250, 243, .88); }\n.work-card-state {\n  background: rgba(255, 250, 242, .88);\n  color: #47362e;\n  box-shadow: 0 2px 8px rgba(35, 24, 19, .12);\n}\n.work-card-state::before { background: var(--rose); box-shadow: none; }\n.work-card-title { color: #fffaf3; }\n.work-card-sub { color: rgba(255, 250, 243, .82); }\n.work-card-tags span {\n  border-color: rgba(255, 250, 243, .34);\n  color: rgba(255, 250, 243, .90);\n  background: rgba(35, 25, 20, .18);\n}\n\n.library-empty { color: var(--muted); }\n.empty-orbit { border-color: var(--line); color: var(--rose-deep); background: rgba(255, 252, 247, .36); }\n.library-foot { border-color: var(--line); }\n.library-foot-line { background: var(--gold); }\n.library-foot p,\n.library-foot-index { color: var(--muted-2); }\n.spine-back {\n  border-color: var(--line-strong);\n  color: var(--paper);\n  background: rgba(255, 252, 247, .38);\n}\n.spine-back:hover { background: var(--paper); color: #fbf5ea; }\n.spine-thumb {\n  border-color: rgba(91, 65, 49, .18);\n  opacity: .68;\n  filter: grayscale(.18) saturate(.9);\n}\n.spine-thumb:hover { opacity: .92; filter: none; }\n.spine-thumb.is-selected {\n  border-color: var(--rose);\n  box-shadow: 0 0 0 1px var(--rose), 0 8px 18px rgba(91, 65, 49, .16);\n}\n.spine-caption,\n.spine-count { color: var(--muted-2); }\n.spine-count { color: var(--rose-deep); }\n\n.work-detail {\n  border-color: var(--line);\n  background: #fbf5eb;\n  box-shadow: var(--warm-shadow);\n}\n.detail-backdrop-img {\n  opacity: .12;\n  filter: blur(30px) saturate(.9);\n}\n.detail-backdrop::after {\n  background: linear-gradient(180deg, rgba(253, 248, 240, .84) 0%, rgba(250, 243, 233, .93) 45%, #f9f2e8 100%);\n}\n.detail-topbar {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .68);\n  -webkit-backdrop-filter: blur(16px) saturate(1.1);\n  backdrop-filter: blur(16px) saturate(1.1);\n}\n.detail-breadcrumb { color: var(--muted-2); }\n.detail-breadcrumb i { background: var(--muted-2); }\n.detail-breadcrumb b { color: var(--muted); }\n.detail-shelf-btn {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .32);\n}\n.detail-shelf-btn:hover {\n  color: var(--paper);\n  border-color: var(--line-strong);\n  background: rgba(255, 253, 249, .80);\n}\n.detail-cover {\n  border-color: rgba(255, 252, 247, .86);\n  box-shadow: 0 22px 44px rgba(95, 68, 52, .22), 0 0 0 7px rgba(255, 252, 247, .50);\n}\n.detail-cover::after { box-shadow: inset 0 0 40px rgba(35, 24, 19, .16); }\n.detail-cover-no {\n  background: var(--paper);\n  color: #fdf7ee;\n  box-shadow: 0 6px 14px rgba(63, 43, 33, .18);\n}\n.detail-cover-caption { color: var(--muted-2); }\n.detail-kicker { color: var(--rose-deep); }\n.detail-kicker i { background: var(--rose); }\n.detail-title { color: var(--paper); }\n.detail-jp { color: var(--muted-2); }\n.detail-tagline { color: var(--rose-deep); }\n.detail-intro { color: rgba(43, 33, 28, .74); }\n.detail-meta { color: var(--muted); }\n.detail-meta svg { stroke: var(--muted-2); }\n.detail-tags span {\n  border-color: var(--line-strong);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .40);\n}\n.save-work-btn {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .30);\n}\n.save-work-btn:hover { color: var(--paper); border-color: var(--line-strong); background: rgba(255, 253, 249, .75); }\n.save-work-btn.is-saved {\n  color: var(--rose-deep);\n  border-color: rgba(166, 79, 104, .38);\n  background: rgba(166, 79, 104, .07);\n}\n.detail-tabs { border-color: var(--line); }\n.detail-tab { color: var(--muted-2); }\n.detail-tab:hover,\n.detail-tab.is-active { color: var(--paper); }\n.detail-tab::after { background: var(--rose); box-shadow: 0 1px 6px rgba(166, 79, 104, .22); }\n.detail-tab small { color: var(--rose-deep); }\n\n.overview-block {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .62);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .55);\n}\n.overview-block-label { color: var(--muted-2); }\n.overview-block-label span:last-child { color: var(--rose-deep); }\n.overview-block p { color: rgba(43, 33, 28, .75); }\n.theme-chips span {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .42);\n}\n.detail-note {\n  border-left-color: rgba(166, 79, 104, .50);\n  background: rgba(166, 79, 104, .06);\n}\n.detail-note svg { color: var(--rose-deep); }\n.detail-note p { color: var(--muted); }\n.timeline-mini-item::before { background: var(--line); }\n.timeline-dot { border-color: var(--rose); background: #fbf5eb; }\n.timeline-dot::after { background: var(--rose); }\n.timeline-mini-item b { color: var(--paper); }\n.timeline-mini-item p { color: var(--muted-2); }\n\n/* Character stage is one of the intentionally dark image areas. */\n.cast-stage {\n  border-color: rgba(255, 250, 242, .52);\n  background: linear-gradient(160deg, #2a2530, #15141a);\n  box-shadow: 0 22px 46px rgba(95, 68, 52, .18);\n}\n.cast-stage-bg {\n  background:\n    radial-gradient(circle at 70% 24%, rgba(255, 255, 255, .20), transparent 24%),\n    linear-gradient(155deg, rgba(198, 137, 153, .22), transparent 46%, rgba(116, 154, 143, .12));\n}\n.cast-kicker { color: var(--rose-deep); }\n.cast-name { color: var(--paper); }\n.cast-role { color: var(--muted); }\n.cast-quote {\n  border-left-color: rgba(166, 79, 104, .58);\n  color: #7b3f50;\n}\n.cast-quote::before { color: var(--rose); }\n.cast-bio { color: rgba(43, 33, 28, .72); }\n.cast-tags span {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .34);\n}\n.cast-rail { border-color: var(--line); }\n.cast-chip {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .38);\n}\n.cast-chip:hover { color: var(--paper); border-color: var(--line-strong); background: rgba(255, 253, 249, .74); }\n.cast-chip.is-active {\n  color: var(--paper);\n  border-color: rgba(166, 79, 104, .48);\n  background: rgba(166, 79, 104, .08);\n}\n.cast-chip-portrait { background: #efe2d2; }\n\n.story-head-left { color: var(--muted-2); }\n.story-head-left i { background: var(--rose); }\n.story-edit-btn { color: var(--muted); border-color: var(--line); }\n.story-edit-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.story-text { color: rgba(43, 33, 28, .76); }\n.story-text .first-letter { color: var(--rose-deep); }\n.story-editor textarea {\n  border-color: var(--line-strong);\n  background: rgba(255, 253, 248, .82);\n  color: var(--paper);\n}\n.story-editor textarea:focus {\n  border-color: rgba(166, 79, 104, .55);\n  box-shadow: 0 0 0 3px rgba(166, 79, 104, .09);\n}\n.story-editor-actions .hint { color: var(--muted-2); }\n.story-side { border-color: var(--line); }\n.route-item::before { border-color: var(--gold); }\n.route-item::after { background: var(--line); }\n.route-label { color: var(--gold); }\n.route-item p { color: var(--muted); }\n.story-warning { color: var(--muted-2); }\n.story-warning svg { color: var(--gold); }\n.work-detail-loading { color: var(--muted); }\n.loading-sigil { color: var(--rose-deep); }\n\n/* --------------------------------------------------------------------------\n   07 · CONSOLE · world mixer\n   -------------------------------------------------------------------------- */\n.autosave-pill {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .38);\n}\n.console-overview {\n  border-color: var(--line);\n  background: linear-gradient(135deg, rgba(255, 252, 247, .84), rgba(248, 238, 226, .58) 50%, rgba(211, 179, 168, .10));\n  box-shadow: var(--warm-shadow-soft), inset 0 1px 0 rgba(255, 255, 255, .62);\n}\n.console-overview::before { background: radial-gradient(circle, rgba(182, 120, 138, .12), transparent 66%); }\n.overview-head h2 { color: var(--paper); }\n.overview-head h2 span { color: var(--rose-deep); }\n.overview-timestamp { color: var(--muted-2); }\n.meter-card {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .64);\n}\n.meter-label { color: var(--muted-2); }\n.meter-card strong { color: var(--paper); }\n.meter-unit { color: var(--muted-2); }\n.meter-track { background: rgba(91, 65, 49, .12); }\n.meter-track i { box-shadow: none; }\n.coherence-card {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .58);\n}\n.coherence-ring {\n  background: conic-gradient(from 215deg, var(--rose) calc(var(--value) * 1%), rgba(91, 65, 49, .12) 0);\n}\n.coherence-ring::before { background: #fbf5eb; }\n.coherence-ring strong { color: var(--paper); }\n.coherence-ring span { color: var(--muted-2); }\n.coherence-copy h3 { color: var(--paper); }\n.coherence-copy p { color: var(--muted); }\n\n.master-row {\n  border-color: var(--line);\n  background: rgba(238, 226, 210, .46);\n}\n.master-switch:hover { background: rgba(255, 252, 247, .58); border-color: var(--line); }\n.master-icon {\n  background: rgba(255, 252, 247, .56);\n  color: var(--muted);\n}\n.master-switch[aria-pressed=\"true\"] .master-icon {\n  color: var(--rose-deep);\n  background: rgba(166, 79, 104, .08);\n}\n.master-switch b { color: var(--paper); }\n.master-switch small { color: var(--muted-2); }\n.switch { background: rgba(91, 65, 49, .20); }\n.switch i { background: #fffaf2; }\n.master-switch[aria-pressed=\"true\"] .switch { background: var(--rose); }\n.master-switch[aria-pressed=\"true\"] .switch i { background: #fffdf8; }\n\n.console-list-head h2 { color: var(--paper); }\n.channel-legend { color: var(--muted-2); }\n.dot-on { background: var(--cyan); box-shadow: none; }\n.dot-off { background: var(--muted-2); }\n.legend-hint { border-color: var(--line); }\n\n.channel {\n  border-color: var(--line);\n  background: linear-gradient(155deg, rgba(255, 252, 247, .82), rgba(248, 238, 226, .56) 68%);\n  box-shadow: 0 10px 26px rgba(98, 72, 55, .06);\n}\n.channel::before { opacity: .42; }\n.channel:hover { border-color: rgba(91, 65, 49, .28); }\n.channel.is-off {\n  background: linear-gradient(155deg, rgba(248, 241, 232, .72), rgba(244, 236, 226, .52));\n  opacity: .64;\n}\n.channel.is-off::before { opacity: .16; }\n.channel-cover { border-color: rgba(255, 250, 242, .82); box-shadow: 0 4px 10px rgba(98, 72, 55, .14); }\n.channel-index { color: var(--muted-2); }\n.channel-title { color: var(--paper); }\n.channel-sub { color: var(--muted); }\n.power-btn {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .36);\n}\n.power-btn:hover { color: var(--paper); border-color: var(--line-strong); }\n.channel:not(.is-off) .power-btn {\n  color: var(--cyan);\n  border-color: rgba(56, 111, 100, .28);\n  background: rgba(56, 111, 100, .06);\n  box-shadow: none;\n}\n.channel-signal { border-color: var(--line); }\n.channel-signal span { color: var(--muted-2); }\n.channel-signal em { color: var(--rose-deep); }\n.channel-toggle {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .30);\n}\n.channel-toggle:hover { border-color: var(--line-strong); color: var(--paper); background: rgba(255, 253, 249, .68); }\n.channel-toggle.is-on {\n  color: var(--paper);\n  border-color: var(--line-strong);\n  background: rgba(166, 79, 104, .055);\n}\n.channel-toggle.is-on b { color: var(--rose-deep); }\n.channel-toggle.is-on::before { background: var(--rose); box-shadow: none; }\n.channel-slider-row label { color: var(--muted-2); }\n.range-input::-webkit-slider-runnable-track {\n  background: linear-gradient(90deg, var(--channel-accent) 0 var(--range-val), rgba(91, 65, 49, .13) var(--range-val) 100%);\n}\n.range-input::-moz-range-track { background: rgba(91, 65, 49, .13); }\n.range-input::-webkit-slider-thumb {\n  border-color: #fffaf2;\n  box-shadow: 0 0 0 1px rgba(91, 65, 49, .18);\n}\n.range-input::-moz-range-thumb { border-color: #fffaf2; }\n.channel-slider-val { color: var(--rose-deep); }\n.channel-cast { border-color: var(--line); }\n.channel-cast summary { color: var(--muted-2); }\n.channel-cast summary::before { color: var(--rose-deep); }\n.cast-tune { background: rgba(255, 252, 247, .38); }\n.cast-tune-name { color: var(--paper-soft); }\n.cast-tune-role { color: var(--muted-2); }\n.cast-gender-toggle {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .28);\n}\n.cast-gender-toggle.is-swapped {\n  color: var(--rose-deep);\n  border-color: rgba(166, 79, 104, .36);\n  background: rgba(166, 79, 104, .07);\n}\n.console-foot-note { color: var(--muted-2); }\n.console-foot-note svg { stroke: var(--gold); }\n\n/* --------------------------------------------------------------------------\n   08 · PERSONA · form & character registry card\n   -------------------------------------------------------------------------- */\n.persona-form {\n  border-color: rgba(91, 65, 49, .18);\n  background: linear-gradient(150deg, rgba(255, 252, 247, .82), rgba(247, 237, 225, .56));\n  box-shadow: 0 22px 56px rgba(98, 72, 55, .10), inset 0 1px 0 rgba(255, 255, 255, .72);\n}\n.form-section-no {\n  border-color: rgba(166, 79, 104, .34);\n  color: var(--rose-deep);\n  background: rgba(255, 252, 247, .30);\n}\n.form-section-head h2 { color: var(--paper); }\n.form-section-head p { color: var(--muted); }\n.inspiration-btn {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .34);\n}\n.inspiration-btn:hover {\n  color: var(--rose-deep);\n  border-color: rgba(166, 79, 104, .38);\n  background: rgba(166, 79, 104, .06);\n}\n.field-label { color: var(--paper); }\n.field-label i { color: var(--muted-2); }\n.field-label .required { color: var(--rose-deep); }\n.field-hint { color: var(--muted-2); }\n.input-wrap input,\n.input-wrap textarea {\n  border-color: rgba(91, 65, 49, .18);\n  background: rgba(255, 253, 248, .76);\n  color: var(--paper);\n}\n.input-wrap input::placeholder,\n.input-wrap textarea::placeholder { color: rgba(43, 33, 28, .46); }\n.input-wrap input:focus,\n.input-wrap textarea:focus {\n  border-color: rgba(166, 79, 104, .55);\n  background: #fffdf9;\n  box-shadow: 0 0 0 3px rgba(166, 79, 104, .07);\n}\n.input-line { background: linear-gradient(90deg, transparent, var(--rose), transparent); }\n.char-count { color: var(--muted-2); }\n.suggestion-chip {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .34);\n}\n.suggestion-chip:hover {\n  color: var(--paper);\n  border-color: var(--line-strong);\n  background: rgba(255, 253, 249, .78);\n}\n.form-section-head-sub { border-color: var(--line); }\n.aesthetic-label { color: var(--muted); }\n.swatch.is-active {\n  box-shadow: 0 0 0 2px #fbf6ee, 0 0 0 3px var(--swatch), 0 0 0 6px rgba(91, 65, 49, .08);\n}\n.variant-btn {\n  border-color: var(--line);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .30);\n}\n.variant-btn.is-active {\n  border-color: var(--rose);\n  background: rgba(166, 79, 104, .08);\n  color: var(--rose-deep);\n}\n.form-footer { border-color: var(--line); }\n.form-note { color: var(--muted); }\n.form-note svg { stroke: var(--muted); }\n\n.preview-caption { color: var(--muted-2); }\n.persona-card {\n  border-color: rgba(112, 78, 58, .22);\n  background: linear-gradient(165deg, #fdf8f0 0%, #f7ecdf 58%, #f1e3d2 100%);\n  box-shadow: 0 34px 72px rgba(93, 67, 52, .17);\n}\n.persona-card::before { border-color: rgba(112, 78, 58, .14); }\n.persona-card-glow { opacity: .72; }\n.persona-card-noise { opacity: .035; mix-blend-mode: multiply; }\n.persona-card-top { color: rgba(43, 33, 28, .62); font-size: 8.5px; }\n.persona-status i { box-shadow: 0 0 0 3px color-mix(in srgb, var(--card-accent) 12%, transparent); }\n.persona-portrait {\n  background:\n    radial-gradient(ellipse at 50% 44%, color-mix(in srgb, var(--card-accent) 18%, transparent), transparent 42%),\n    linear-gradient(160deg, rgba(255, 255, 255, .48), transparent 54%, rgba(155, 116, 96, .06));\n}\n.persona-portrait::before { border-color: color-mix(in srgb, var(--card-accent) 28%, transparent); }\n.persona-portrait::after { background: linear-gradient(180deg, transparent 38%, rgba(248, 240, 230, .08) 58%, #f7ecdf 100%); }\n.portrait-sigil { opacity: .16; }\n.portrait-initial { color: rgba(43, 33, 28, .07); }\n.portrait-caption {\n  color: rgba(255, 250, 243, .64);\n  font-size: 8.5px;\n  text-shadow: 0 1px 5px rgba(35, 25, 20, .38);\n}\n.portrait-frame-line { border-color: rgba(43, 33, 28, .10); }\n.persona-overline { color: var(--card-accent); }\n.persona-name-row h2 { color: var(--paper); }\n.persona-seal {\n  border-color: var(--card-accent);\n  color: var(--card-accent);\n  background: rgba(255, 252, 247, .32);\n}\n.persona-seal.is-stamped {\n  background: var(--card-accent);\n  color: #fff9f0;\n  box-shadow: 0 0 0 4px color-mix(in srgb, var(--card-accent) 12%, transparent);\n}\n.persona-meta { color: rgba(43, 33, 28, .64); }\n.persona-meta i { background: var(--card-accent); }\n.persona-quote { color: rgba(43, 33, 28, .76); }\n.persona-bottom { border-color: rgba(43, 33, 28, .14); }\n.persona-tags span {\n  border-color: rgba(91, 65, 49, .20);\n  color: rgba(43, 33, 28, .66);\n  background: rgba(255, 252, 247, .30);\n}\n.completion { color: rgba(43, 33, 28, .68); }\n.completion b { color: var(--card-accent); }\n.completion-ring { background: conic-gradient(var(--card-accent) calc(var(--value) * 1%), rgba(91, 65, 49, .12) 0); }\n.completion-ring::before { background: #f7ecdf; }\n.persona-card-bottom { color: rgba(43, 33, 28, .52); font-size: 8.5px; }\n.preview-side-note { color: var(--muted-2); }\n.preview-side-line { background: var(--rose); opacity: .45; }\n\n/* Warm the CSS silhouette so the card reads as a sepia portrait, not a black block. */\n.sil-hair {\n  background: linear-gradient(150deg, color-mix(in srgb, var(--card-accent) 26%, #6b4b5b), #4b3442 42%, #6a4a57 72%, #3e2b35);\n  box-shadow: 0 0 26px color-mix(in srgb, var(--card-accent) 13%, transparent);\n}\n.sil-body {\n  background: linear-gradient(155deg, color-mix(in srgb, var(--card-accent) 12%, #7a5a4b), #5c4035 50%, #3f2d27);\n}\n.sil-.gw-app::before { background: #46312b; }\n.persona-card[data-variant=\"2\"] .sil-hair::after { background: #4b3442; }\n\n/* Deepen the five card accents so labels stay readable on paper */\n.persona-card[data-color=\"rose\"] { --card-accent: #a9536b; --card-accent-2: #8c3e55; --card-wash: rgba(169, 83, 107, .18); }\n.persona-card[data-color=\"violet\"] { --card-accent: #75619c; --card-accent-2: #5f4e83; --card-wash: rgba(117, 97, 156, .16); }\n.persona-card[data-color=\"cyan\"] { --card-accent: #386f64; --card-accent-2: #2d5b53; --card-wash: rgba(56, 111, 100, .16); }\n.persona-card[data-color=\"gold\"] { --card-accent: #8c6630; --card-accent-2: #745225; --card-wash: rgba(140, 102, 48, .16); }\n.persona-card[data-color=\"blue\"] { --card-accent: #4f6d9c; --card-accent-2: #3f5882; --card-wash: rgba(79, 109, 156, .16); }\n\n/* --------------------------------------------------------------------------\n   09 · OPENING · paper options, dark cinema preview stays cinematic\n   -------------------------------------------------------------------------- */\n.portrait-hint { color: var(--muted); }\n.portrait-hint b { color: var(--paper); }\n.mini-avatar {\n  border-color: rgba(166, 79, 104, .34);\n  background:\n    radial-gradient(circle at 35% 28%, rgba(255, 255, 255, .80), transparent 54%),\n    #f1e0cf;\n  color: var(--rose-deep);\n}\n.step-no {\n  border-color: rgba(166, 79, 104, .36);\n  color: var(--rose-deep);\n  background: rgba(255, 252, 247, .30);\n}\n.step-head h2 { color: var(--paper); }\n.step-head p { color: var(--muted); }\n.step-count { color: var(--muted-2); }\n.opening-step + .opening-step { border-color: var(--line); }\n\n.opening-work {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .30);\n}\n.opening-work::before { background: linear-gradient(90deg, rgba(255, 255, 255, .35), transparent); }\n.opening-work:hover {\n  border-color: var(--line-strong);\n  background: rgba(255, 253, 249, .78);\n}\n.opening-work.is-active {\n  border-color: var(--rose);\n  background: rgba(166, 79, 104, .07);\n  box-shadow: 0 0 0 1px rgba(166, 79, 104, .10);\n}\n.opening-work-name { color: var(--muted); }\n.opening-work.is-active .opening-work-name { color: var(--paper); }\n.opening-work-num { color: var(--muted-2); }\n.opening-work-cover { box-shadow: 0 3px 8px rgba(98, 72, 55, .14); }\n\n.opening-tabs { border-color: var(--line); }\n.opening-tab { color: var(--muted-2); }\n.opening-tab:hover,\n.opening-tab.is-active { color: var(--paper); }\n.opening-tab::after { background: var(--rose); }\n\n.scene-card {\n  border-color: var(--line);\n  background: rgba(255, 252, 247, .32);\n}\n.scene-card:hover {\n  border-color: var(--line-strong);\n  background: rgba(255, 253, 249, .76);\n}\n.scene-card.is-active {\n  border-color: rgba(166, 79, 104, .46);\n  background: rgba(166, 79, 104, .06);\n}\n.scene-index { color: var(--muted-2); }\n.scene-card.is-active .scene-index { color: var(--rose-deep); }\n.scene-title { color: var(--paper); }\n.scene-sub { color: var(--muted); }\n.scene-sub i { background: var(--muted-2); }\n.scene-card-arrow { color: var(--muted-2); }\n.scene-card:hover .scene-card-arrow,\n.scene-card.is-active .scene-card-arrow { color: var(--rose-deep); }\n.scene-empty {\n  border-color: var(--line-strong);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .22);\n}\n.custom-scene-btn {\n  border-color: var(--line-strong);\n  color: var(--muted);\n  background: rgba(255, 252, 247, .18);\n}\n.custom-scene-btn:hover {\n  color: var(--rose-deep);\n  border-color: rgba(166, 79, 104, .42);\n  background: rgba(166, 79, 104, .05);\n}\n.opening-tip { border-color: var(--line); color: var(--muted); }\n.opening-tip svg { color: var(--gold); }\n\n.cinema-card {\n  border-color: rgba(255, 250, 242, .42);\n  box-shadow: 0 32px 72px rgba(92, 67, 51, .24);\n}\n.cinema-kicker { color: #e0a2b0; }\n.cinema-status i { background: #e0a2b0; box-shadow: 0 0 0 3px rgba(224, 162, 176, .14); }\n.cinema-copy h2 { color: #fffaf3; }\n.cinema-scene-meta { color: rgba(255, 250, 243, .66); }\n.cinema-text { color: rgba(255, 250, 243, .78); }\n.cinema-tags span {\n  border-color: rgba(255, 250, 243, .30);\n  color: rgba(255, 250, 243, .72);\n  background: rgba(35, 25, 20, .15);\n}\n.cinema-persona small { color: rgba(255, 250, 243, .45); }\n.cinema-persona b { color: rgba(255, 250, 243, .86); }\n.cinema-scroll-hint { color: rgba(255, 250, 243, .42); }\n.cinema-scroll-hint i { background: rgba(255, 250, 243, .46); }\n\n.summary-block .micro-label { color: var(--muted-2); }\n.summary-block p { color: var(--muted); }\n.summary-block p b { color: var(--paper); }\n.summary-block p i { background: var(--muted-2); }\n.opening-disclaimer { color: var(--muted-2); }\n.btn-begin-label small { color: rgba(51, 35, 30, .55); }\n.opening-preview-panel { scrollbar-color: rgba(91, 65, 49, .24) transparent; }\n\n/* --------------------------------------------------------------------------\n   10 · MODALS / LAUNCH / TOAST\n   -------------------------------------------------------------------------- */\n.modal-backdrop {\n  background: rgba(77, 57, 45, .34);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n.modal-card {\n  border-color: rgba(91, 65, 49, .20);\n  background: linear-gradient(150deg, #fdf8f1 0%, #f5eadc 100%);\n  box-shadow: 0 40px 90px rgba(72, 51, 39, .28);\n  color: var(--paper);\n}\n.modal-card h2 { color: var(--paper); }\n.modal-desc { color: var(--muted); }\n.modal-actions .text-btn { color: var(--muted); }\n#customCount {\n  position: static;\n  margin-left: auto;\n  color: var(--muted-2);\n  font-family: var(--font-mono);\n  font-size: 9px;\n  line-height: 1.5;\n}\n\n.launch-layer { background: #18120f; }\n.launch-layer::after {\n  background: radial-gradient(ellipse at center, transparent 5%, rgba(24, 18, 15, .42) 55%, rgba(20, 14, 11, .92) 100%);\n}\n.launch-bg { opacity: .30; }\n.launch-sigil { color: #e3a3b1; }\n.launch-sigil span { border-color: rgba(255, 246, 235, .18); }\n.launch-sigil span:nth-child(2) { border-color: rgba(227, 163, 177, .22); }\n.launch-sigil span:nth-child(3) { border-color: rgba(255, 246, 235, .09); }\n.launch-eyebrow { color: rgba(255, 246, 235, .70); font-size: 9px; }\n.launch-title { color: #fff8ee; }\n.launch-sub { color: rgba(255, 246, 235, .82); font-size: 11px; }\n.launch-progress { background: rgba(255, 246, 235, .26); }\n.launch-progress span {\n  background: linear-gradient(90deg, #dfa2b0, #cdb98f, #8fae9d);\n  box-shadow: none;\n}\n.launch-log { color: rgba(255, 246, 235, .66); font-size: 9px; }\n\n.launch-result {\n  border-color: rgba(255, 250, 242, .55);\n  background: rgba(252, 246, 237, .96);\n  box-shadow: 0 40px 90px rgba(20, 14, 11, .42);\n  color: var(--paper);\n  -webkit-backdrop-filter: blur(18px);\n  backdrop-filter: blur(18px);\n}\n.launch-result h2 { color: var(--paper); }\n.result-seal {\n  border-color: rgba(166, 79, 104, .52);\n  color: var(--rose-deep);\n  background: rgba(166, 79, 104, .05);\n}\n.result-kicker { color: var(--rose-deep); }\n.result-dossier {\n  border-left-color: rgba(166, 79, 104, .48);\n  background: rgba(166, 79, 104, .055);\n}\n.result-meta { color: var(--muted-2); font-size: 9.5px; }\n.result-meta b { color: var(--muted); }\n.result-dossier p { color: rgba(43, 33, 28, .76); font-size: 12.5px; line-height: 2; }\n.result-actions .btn { font-size: 10.5px; }\n.result-actions .btn-ghost {\n  color: var(--paper);\n  border-color: var(--line-strong);\n  background: rgba(255, 252, 247, .38);\n}\n\n.toast {\n  border-color: rgba(91, 65, 49, .18);\n  background: rgba(255, 251, 244, .96);\n  color: var(--paper);\n  box-shadow: 0 14px 34px rgba(82, 59, 45, .18);\n  -webkit-backdrop-filter: blur(14px);\n  backdrop-filter: blur(14px);\n}\n.toast svg { stroke: var(--cyan); }\n\n/* --------------------------------------------------------------------------\n   11 · Readability floor for the light theme\n   Small type stays micro, but no content-critical label below ~9.5px.\n   -------------------------------------------------------------------------- */\n.micro-label { font-size: 10px; }\n.nav-num { font-size: 9px; }\n.nav-meta { font-size: 9.5px; }\n.index-card-top { font-size: 8.5px; }\n.index-desc { font-size: 11.5px; }\n.index-card-foot { font-size: 8.5px; }\n.float-card-sub,\n.float-card-label { font-size: 8px; }\n.float-card-quote { font-size: 12.5px; }\n.hero-coord { font-size: 8px; }\n.archive-total span { font-size: 8.5px; }\n.library-title { font-size: 9px; }\n.search-box kbd { font-size: 9px; }\n.work-card-index { font-size: 9.5px; }\n.work-card-state { font-size: 8px; }\n.work-card-sub { font-size: 8px; }\n.work-card-tags span { font-size: 8px; }\n.library-foot p { font-size: 10px; }\n.library-foot-index { font-size: 7.5px; }\n.detail-breadcrumb { font-size: 8.5px; }\n.detail-cover-caption { font-size: 8px; }\n.detail-kicker { font-size: 9px; }\n.detail-jp { font-size: 10px; }\n.detail-intro { font-size: 12.5px; }\n.detail-meta { font-size: 10px; }\n.detail-tags span { font-size: 9.5px; }\n.detail-tab small { font-size: 8px; }\n.overview-block-label { font-size: 9px; }\n.overview-block p { font-size: 12px; }\n.theme-chips span { font-size: 9.5px; }\n.detail-note p { font-size: 10px; }\n.timeline-mini-item b { font-size: 10px; }\n.timeline-mini-item p { font-size: 9.5px; }\n.cast-kicker { font-size: 9px; }\n.cast-role { font-size: 10.5px; }\n.cast-bio { font-size: 12px; }\n.cast-tags span { font-size: 9.5px; }\n.cast-chip span { font-size: 10.5px; }\n.story-head-left { font-size: 9px; }\n.story-edit-btn { font-size: 10px; }\n.story-text { font-size: 13px; }\n.story-editor textarea { font-size: 13px; }\n.story-editor-actions .hint { font-size: 10px; }\n.route-label { font-size: 9px; }\n.route-item p { font-size: 10.5px; }\n.story-warning { font-size: 9.5px; }\n.autosave-pill { font-size: 10px; }\n.overview-timestamp { font-size: 9px; }\n.meter-label { font-size: 9.5px; }\n.meter-unit { font-size: 8.5px; }\n.coherence-copy p { font-size: 9.5px; }\n.master-switch small { font-size: 9px; }\n.channel-index { font-size: 8px; }\n.channel-sub { font-size: 9px; }\n.channel-signal span,\n.channel-signal em { font-size: 8.5px; }\n.channel-toggle span { font-size: 9px; }\n.channel-toggle b { font-size: 8px; }\n.channel-slider-row label { font-size: 9px; }\n.channel-slider-val { font-size: 8.5px; }\n.channel-cast summary { font-size: 9px; }\n.cast-tune-name { font-size: 9.5px; }\n.cast-tune-role { font-size: 8.5px; }\n.cast-gender-toggle { font-size: 8.5px; }\n.console-foot-note { font-size: 9.5px; }\n.form-section-head p { font-size: 10px; }\n.field-label { font-size: 11.5px; }\n.field-label i { font-size: 8.5px; }\n.field-hint { font-size: 9px; }\n.char-count { font-size: 8px; }\n.form-note { font-size: 9.5px; }\n.preview-caption { font-size: 9px; }\n.persona-card-top { font-size: 8px; }\n.persona-overline { font-size: 8px; }\n.persona-meta { font-size: 9.5px; }\n.persona-quote { font-size: 12.5px; }\n.persona-tags span { font-size: 8.5px; }\n.completion { font-size: 9px; }\n.completion small { font-size: 7.5px; }\n.portrait-caption { font-size: 8px; }\n.persona-card-bottom { font-size: 7.5px; }\n.preview-side-note { font-size: 10px; }\n.portrait-hint { font-size: 9.5px; }\n.opening-work-name { font-size: 10.5px; }\n.opening-work-num { font-size: 7.5px; }\n.opening-tab { font-size: 10px; }\n.scene-index { font-size: 8px; }\n.scene-sub { font-size: 9px; }\n.opening-tip { font-size: 9.5px; }\n.summary-block p { font-size: 10px; }\n.opening-disclaimer { font-size: 9px; }\n.modal-desc { font-size: 11.5px; }\n.toast { font-size: 11px; }\n\n/* --------------------------------------------------------------------------\n   12 · Mobile-specific light tuning\n   -------------------------------------------------------------------------- */\n@container galworld (max-width: 620px) {\n  body {\n    background:\n      radial-gradient(ellipse 82% 44% at 4% -2%, rgba(194, 132, 148, .18), transparent 62%),\n      radial-gradient(ellipse 66% 40% at 100% 8%, rgba(141, 164, 143, .12), transparent 62%),\n      linear-gradient(155deg, #fbf5ec 0%, #f3e9dc 52%, #eee1d0 100%);\n    background-attachment: scroll;\n  }\n  .site-header { background: linear-gradient(180deg, rgba(251, 246, 238, .98), rgba(251, 246, 238, .88)); }\n  .work-card-sub { font-size: 8px; }\n  .detail-intro { font-size: 11px; }\n  .detail-meta { font-size: 9px; }\n  .channel-toggle span { font-size: 8.5px; }\n  .channel-toggle b { font-size: 7.5px; }\n  .scene-sub { font-size: 8.5px; }\n  .cinema-text { font-size: 11px; }\n  .opening-work-name { font-size: 9.5px; }\n  .opening-tab { font-size: 9.5px; }\n  .filter-chip { font-size: 9.5px; }\n  .master-switch b { font-size: 9px; }\n  .field-label { font-size: 11px; }\n  .field-hint { font-size: 8.5px; }\n  .btn-begin-label small { color: rgba(51, 35, 30, .58); }\n}\n\n/* Light-theme readability polish: lift the remaining 7–8px labels that carry\n   information (counts, stage metadata, channel values) into 8.5–9.5px. */\n.filter-chip span { font-size: 8.5px; opacity: .82; }\n.work-card-state { font-size: 8.5px; }\n.work-card-sub { font-size: 9px; }\n.work-card-tags span { font-size: 8.5px; }\n.library-foot-index { font-size: 8.5px; }\n.spine-caption,\n.spine-count { font-size: 8.5px; }\n.detail-breadcrumb { font-size: 9px; }\n.detail-cover-caption { font-size: 9px; }\n.detail-tab small { font-size: 8.5px; }\n.overview-block-label { font-size: 9.5px; }\n.theme-chips span { font-size: 10px; }\n.timeline-mini-item p { font-size: 10px; }\n.cast-tags span { font-size: 10px; }\n.channel-index { font-size: 9px; }\n.meter-unit { font-size: 9px; }\n.coherence-ring span { font-size: 8.5px; }\n.legend-hint { font-size: 9.5px; }\n.channel-signal span,\n.channel-signal em { font-size: 9px; }\n.channel-toggle b { font-size: 9px; }\n.channel-cast summary span { font-size: 8.5px; }\n.cast-tune-role { font-size: 9px; }\n.cast-gender-toggle { font-size: 9px; }\n.opening-work-num { font-size: 9px; }\n.step-count { font-size: 9px; }\n.step-head p { font-size: 9.5px; }\n.form-section-no { font-size: 9px; }\n.field-label i { font-size: 9px; }\n.field-label .required { font-size: 8.5px; }\n.char-count { font-size: 9px; }\n.suggestion-chip { font-size: 9.5px; }\n.preview-caption { font-size: 9.5px; }\n.persona-registry,\n.persona-status { font-size: 8.5px; }\n.completion small { font-size: 8.5px; }\n.scene-index { font-size: 9px; }\n.scene-sub { font-size: 9.5px; }\n.opening-tip { font-size: 10px; }\n.opening-disclaimer { font-size: 9.5px; }\n.cinema-index { font-size: 8.5px; }\n.cinema-status { font-size: 8px; }\n.cinema-kicker { font-size: 9px; }\n.cinema-scene-meta { font-size: 9px; }\n.cinema-tags span { font-size: 9px; }\n.cinema-persona small { font-size: 8.5px; }\n.cinema-persona b { font-size: 11px; }\n.cinema-scroll-hint { font-size: 8px; }\n\n@container galworld (max-width: 620px) {\n  /* small screens keep the same floor without breaking the 2/3-column grids */\n  .work-card-sub,\n  .work-card-tags span { font-size: 8.5px; }\n  .opening-work-num { font-size: 8.5px; }\n  .opening-work-name { font-size: 9.8px; }\n  .channel-toggle b { font-size: 8.5px; }\n  .persona-registry,\n  .persona-status { font-size: 8px; }\n  .cinema-text { font-size: 11px; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .ambient-orb { animation: none; }\n  .grain { display: none; }\n  #dustCanvas { display: none; }\n}\n\n/* ==========================================================================\n   PAGE 01 · COLLECTION OVERVIEW (v1.1)\n   A contained, editorial cover wall. Lives inside the light Tavern build.\n   ========================================================================== */\n\n.page-home {\n  position: relative;\n  height: clamp(540px, calc(100dvh - 180px), 700px);\n  min-height: 0;\n  padding: 0;\n  overflow: hidden;\n}\n.home-dashboard {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n}\n.home-scroll {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  padding: clamp(18px, 2.4cqw, 28px) var(--gutter) 12px;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.home-scroll::-webkit-scrollbar { width: 5px; }\n.home-scroll::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n.home-scroll::-webkit-scrollbar-track { background: transparent; }\n\n.home-masthead {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 28px;\n  padding-bottom: 15px;\n  border-bottom: 1px solid var(--line);\n}\n.home-masthead-copy { min-width: 0; }\n.home-title {\n  margin-top: 11px;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(34px, 3.5cqw, 47px);\n  font-weight: 500;\n  line-height: 1.18;\n  letter-spacing: -.045em;\n}\n.home-title em {\n  color: var(--rose-deep);\n  font-style: normal;\n  white-space: nowrap;\n}\n.home-lede {\n  max-width: 720px;\n  margin-top: 9px;\n  color: var(--muted);\n  font-family: var(--font-display);\n  font-size: 10.8px;\n  line-height: 1.8;\n  letter-spacing: .015em;\n}\n.home-tally {\n  flex: 0 0 auto;\n  min-width: 126px;\n  padding-left: 20px;\n  border-left: 1px solid var(--line-strong);\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n}\n.home-tally-kicker {\n  color: var(--muted-2);\n  font-family: var(--font-latin);\n  font-size: 7.5px;\n  font-weight: 700;\n  letter-spacing: .18em;\n}\n.home-tally strong {\n  margin-top: 4px;\n  color: var(--rose-deep);\n  font-family: var(--font-display);\n  font-size: clamp(56px, 6cqw, 82px);\n  font-weight: 500;\n  line-height: .95;\n  letter-spacing: -.06em;\n}\n.home-tally-label { margin-top: 2px; color: var(--paper-soft); font-size: 9px; letter-spacing: .08em; }\n.home-tally-line { width: 32px; height: 1px; margin: 10px 0 8px; background: var(--gold); }\n.home-tally-note { color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .06em; }\n.home-statsline {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 7px 15px;\n  margin-top: 13px;\n  color: var(--muted-2);\n  font-family: var(--font-mono);\n  font-size: 7.5px;\n  letter-spacing: .04em;\n}\n.home-statsline span { display: inline-flex; align-items: center; gap: 4px; }\n.home-statsline b { color: var(--paper); font-family: var(--font-display); font-size: 15px; font-weight: 500; letter-spacing: -.02em; }\n.home-statsline .home-live { margin-left: 3px; font-family: var(--font-mono); font-size: 7.5px; }\n\n.home-body {\n  display: grid;\n  grid-template-columns: minmax(220px, .31fr) minmax(0, 1fr);\n  gap: clamp(18px, 2.4cqw, 30px);\n  align-items: stretch;\n  margin-top: 14px;\n}\n.home-summary {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  padding: 16px 16px 14px;\n  border: 1px solid var(--line);\n  border-radius: 13px;\n  background:\n    radial-gradient(circle at 92% 0%, rgba(166, 79, 104, .07), transparent 48%),\n    linear-gradient(155deg, rgba(255, 252, 246, .72), rgba(244, 233, 218, .28));\n  box-shadow: 0 10px 26px rgba(98, 72, 55, .045), inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n.home-summary-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding-bottom: 12px;\n  border-bottom: 1px solid var(--line);\n}\n.home-live {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  color: var(--muted-2);\n  font-family: var(--font-mono);\n  font-size: 7px;\n  letter-spacing: .02em;\n  white-space: nowrap;\n}\n.home-live i {\n  width: 4px;\n  height: 4px;\n  border-radius: 50%;\n  background: var(--cyan);\n  box-shadow: 0 0 7px rgba(56, 111, 100, .7);\n}\n.home-live b { color: var(--cyan); font-weight: 700; }\n.home-mini-stats {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 4px;\n  padding: 13px 0 12px;\n  border-bottom: 1px solid var(--line);\n}\n.home-mini-stats > div { min-width: 0; }\n.home-mini-stats b {\n  display: block;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(20px, 2.1cqw, 27px);\n  font-weight: 500;\n  line-height: 1;\n}\n.home-mini-stats span {\n  display: block;\n  margin-top: 4px;\n  color: var(--muted-2);\n  font-size: 7.5px;\n  letter-spacing: .05em;\n  white-space: nowrap;\n}\n.home-summary-copy {\n  margin-top: 13px;\n  color: var(--muted);\n  font-family: var(--font-display);\n  font-size: 10.5px;\n  line-height: 1.9;\n  letter-spacing: .01em;\n}\n.home-summary-quote {\n  display: flex;\n  align-items: flex-start;\n  gap: 6px;\n  margin-top: 16px;\n  padding-top: 13px;\n  border-top: 1px solid var(--line);\n}\n.home-summary-quote > span {\n  color: var(--rose);\n  font-family: Georgia, serif;\n  font-size: 24px;\n  line-height: .8;\n  opacity: .5;\n}\n.home-summary-quote p {\n  color: var(--muted-2);\n  font-family: var(--font-display);\n  font-size: 9.5px;\n  line-height: 1.8;\n  letter-spacing: .06em;\n}\n.home-summary-actions {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 9px;\n  margin-top: auto;\n  padding-top: 16px;\n}\n.home-summary-actions .btn {\n  width: 100%;\n  justify-content: space-between;\n  min-height: 42px;\n  padding-left: 16px;\n  font-size: 10px;\n  gap: 9px;\n}\n.home-summary-actions .btn-icon { width: 30px; height: 30px; }\n.home-summary-actions .btn-icon svg { width: 13px; height: 13px; }\n.home-summary-actions .text-btn { font-size: 9px; }\n.home-summary-actions .text-btn svg { width: 11px; height: 11px; }\n.home-note {\n  display: flex;\n  align-items: flex-start;\n  gap: 5px;\n  margin-top: 12px;\n  padding-top: 10px;\n  border-top: 1px solid var(--line);\n  color: var(--muted-2);\n  font-size: 8px;\n  line-height: 1.65;\n}\n.home-note svg { width: 11px; height: 11px; flex: 0 0 auto; margin-top: 1px; color: var(--gold); fill: none; stroke: currentColor; stroke-width: 1.4; }\n\n.home-wall { min-width: 0; display: flex; flex-direction: column; margin-top: 0; }\n.home-wall-head { display: block; margin-bottom: 9px; }\n.home-wall-title-row {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 14px;\n}\n.home-wall-tools {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  flex-wrap: wrap;\n  gap: 8px 16px;\n  padding-bottom: 1px;\n}\n.home-work-count {\n  color: var(--rose-deep);\n  font-family: var(--font-mono);\n  font-size: 8px;\n  letter-spacing: .08em;\n  white-space: nowrap;\n}\n.home-collapsed-hint {\n  display: none;\n  color: var(--muted-2);\n  font-family: var(--font-mono);\n  font-size: 7px;\n  letter-spacing: .03em;\n  white-space: nowrap;\n}\n.home-wall.is-collapsed .home-collapsed-hint { display: inline; }\n.home-filter-bar {\n  display: flex;\n  gap: 5px;\n  margin-top: 10px;\n  padding-bottom: 1px;\n  overflow-x: auto;\n  scrollbar-width: none;\n}\n.home-filter-bar::-webkit-scrollbar { display: none; }\n.home-filter-bar .filter-chip { flex: 0 0 auto; min-height: 25px; padding-inline: 9px; font-size: 8.5px; }\n.home-filter-bar .filter-chip span { font-size: 7px; }\n.home-empty {\n  grid-column: 1 / -1;\n  padding: 36px 20px;\n  border: 1px dashed var(--line-strong);\n  border-radius: 9px;\n  color: var(--muted-2);\n  font-family: var(--font-display);\n  font-size: 12px;\n  text-align: center;\n}\n.home-wall-head h2 {\n  margin-top: 4px;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(19px, 2.1cqw, 25px);\n  font-weight: 500;\n  letter-spacing: -.025em;\n  line-height: 1.3;\n}\n.home-wall-hint {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--muted-2);\n  font-size: 8px;\n  letter-spacing: .03em;\n  white-space: nowrap;\n}\n.home-wall-hint svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.4; transform: rotate(90deg); }\n.home-wall-toggle {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  min-height: 24px;\n  padding: 0 8px;\n  border: 1px solid var(--line);\n  border-radius: 999px;\n  color: var(--muted);\n  background: rgba(255, 252, 247, .42);\n  font-family: var(--font-mono);\n  font-size: 7px;\n  letter-spacing: .04em;\n  transition: color .2s, border-color .2s, background .2s;\n}\n.home-wall-toggle:hover { color: var(--rose-deep); border-color: rgba(166, 79, 104, .35); background: rgba(255, 249, 243, .8); }\n.home-wall-toggle svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.5; transform: rotate(-90deg); transition: transform .3s var(--ease-out); }\n.home-wall.is-collapsed .home-wall-toggle svg { transform: rotate(90deg); }\n\n/* selected-work mode: the wall folds into one horizontal, scrollable strip */\n.home-wall.is-collapsed .home-wall-head { margin-bottom: 5px; }\n.home-wall.is-collapsed .home-wall-title-row { align-items: center; }\n.home-wall.is-collapsed .home-wall-title-row h2 { display: none; }\n.home-wall.is-collapsed .home-wall-hint { display: none; }\n.home-wall.is-collapsed .home-filter-bar { display: none; }\n.home-wall.is-collapsed .home-work-count { font-size: 7px; }\n.home-wall.is-collapsed .home-work-grid {\n  display: flex;\n  gap: 7px;\n  margin-top: 5px;\n  padding: 2px 0 2px;\n  overflow-x: scroll;\n  overflow-y: hidden;\n  scroll-snap-type: x proximity;\n  scrollbar-width: none;\n}\n.home-wall.is-collapsed .home-work-grid::-webkit-scrollbar { display: none; }\n.home-wall.is-collapsed .home-work-grid { animation: homeRailIn .32s var(--ease-out) both; }\n@keyframes homeRailIn {\n  from { opacity: .4; transform: translateY(-5px); }\n  to { opacity: 1; transform: none; }\n}\n.home-wall.is-collapsed .home-work-card {\n  flex: 0 0 108px;\n  width: 108px;\n  height: 72px;\n  min-height: 0;\n  aspect-ratio: auto;\n  border-radius: 6px;\n  scroll-snap-align: start;\n}\n.home-wall.is-collapsed .home-work-card:hover { transform: translateY(-2px); }\n.home-wall.is-collapsed .home-work-top { left: 6px; right: 6px; top: 5px; }\n.home-wall.is-collapsed .home-work-index { font-size: 6px; }\n.home-wall.is-collapsed .home-work-state { display: none; }\n.home-wall.is-collapsed .home-work-bottom { left: 7px; right: 7px; bottom: 5px; }\n.home-wall.is-collapsed .home-work-title { font-size: 9.5px; }\n.home-wall.is-collapsed .home-work-meta,\n.home-wall.is-collapsed .home-work-arrow { display: none; }\n.home-rail-scroll {\n  position: relative;\n  display: none;\n  height: 6px;\n  margin: 5px 0 0;\n  border-radius: 99px;\n  background: rgba(115, 82, 63, .14);\n  cursor: grab;\n  touch-action: none;\n}\n.home-rail-scroll:active { cursor: grabbing; }\n.home-wall.is-collapsed .home-rail-scroll:not([hidden]) { display: block; }\n.home-rail-thumb {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 18%;\n  height: 100%;\n  border-radius: 99px;\n  background: var(--rose-deep);\n  box-shadow: 0 0 0 1px rgba(255, 255, 255, .25);\n  pointer-events: none;\n}\n\n.home-work-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n  flex: 1 1 auto;\n  min-height: 0;\n}\n.home-work-card {\n  position: relative;\n  min-height: 92px;\n  aspect-ratio: 2.7;\n  overflow: hidden;\n  border: 1px solid rgba(255, 255, 255, .18);\n  border-radius: 8px;\n  background: #1b1d24;\n  text-align: left;\n  isolation: isolate;\n  box-shadow: 0 7px 18px rgba(74, 49, 37, .09);\n  transition: transform .35s var(--ease-out), border-color .25s, box-shadow .3s;\n}\n.home-work-card:hover {\n  transform: translateY(-3px);\n  border-color: rgba(166, 79, 104, .6);\n  box-shadow: 0 14px 24px rgba(74, 49, 37, .18);\n}\n.home-work-card.is-active {\n  border-color: var(--rose);\n  box-shadow: 0 0 0 2px rgba(166, 79, 104, .24), 0 10px 24px rgba(74, 49, 37, .16);\n}\n.home-work-card.is-active .home-work-state {\n  color: #fffaf4;\n  border-color: rgba(255, 233, 238, .44);\n  background: rgba(166, 79, 104, .82);\n}\n.home-work-card.is-active .home-work-state::before { background: #fff2f5; box-shadow: 0 0 7px rgba(255, 236, 240, .8); }\n.home-work-card:focus-visible { outline-offset: 2px; }\n.home-work-bg {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  background-size: cover;\n  background-position: center 44%;\n  transition: transform .8s var(--ease-out), filter .3s;\n}\n.home-work-card:hover .home-work-bg { transform: scale(1.07); }\n.home-work-card::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  z-index: 1;\n  background:\n    linear-gradient(180deg, rgba(7, 9, 14, .28) 0%, transparent 30%, rgba(7, 9, 14, .86) 100%),\n    linear-gradient(90deg, rgba(7, 9, 14, .34), transparent 54%);\n}\n.home-work-top {\n  position: absolute;\n  z-index: 3;\n  left: 9px;\n  right: 9px;\n  top: 8px;\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n}\n.home-work-index {\n  color: rgba(255, 255, 255, .78);\n  font-family: var(--font-mono);\n  font-size: 7px;\n  letter-spacing: .08em;\n  text-shadow: 0 1px 6px rgba(0, 0, 0, .5);\n}\n.home-work-state {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 5px;\n  border: 1px solid rgba(255, 255, 255, .18);\n  border-radius: 2px;\n  color: rgba(255, 255, 255, .7);\n  font-family: var(--font-mono);\n  font-size: 6px;\n  letter-spacing: .06em;\n  background: rgba(9, 11, 16, .34);\n  -webkit-backdrop-filter: blur(6px);\n  backdrop-filter: blur(6px);\n}\n.home-work-state::before {\n  content: \"\";\n  width: 3px;\n  height: 3px;\n  border-radius: 50%;\n  background: var(--cyan);\n  box-shadow: 0 0 5px rgba(124, 231, 218, .8);\n}\n.home-work-card.is-off .home-work-bg { filter: grayscale(.65) brightness(.66); }\n.home-work-card.is-off .home-work-state::before { background: var(--muted-2); box-shadow: none; }\n.home-work-bottom {\n  position: absolute;\n  z-index: 3;\n  left: 10px;\n  right: 10px;\n  bottom: 8px;\n}\n.home-work-title {\n  display: block;\n  overflow: hidden;\n  color: #fffaf4;\n  font-family: var(--font-display);\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.25;\n  letter-spacing: .01em;\n  text-shadow: 0 2px 9px rgba(0, 0, 0, .62);\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n.home-work-meta {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  margin-top: 3px;\n  color: rgba(255, 250, 244, .57);\n  font-size: 6.5px;\n  letter-spacing: .03em;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.home-work-meta i { width: 2px; height: 2px; border-radius: 50%; background: rgba(255,255,255,.35); flex: 0 0 auto; }\n.home-work-arrow {\n  position: absolute;\n  right: 8px;\n  bottom: 8px;\n  z-index: 4;\n  display: grid;\n  place-items: center;\n  width: 21px;\n  height: 21px;\n  border: 1px solid rgba(255, 255, 255, .24);\n  border-radius: 50%;\n  color: rgba(255, 255, 255, .8);\n  background: rgba(8, 10, 14, .25);\n  opacity: 0;\n  transform: translateX(-3px);\n  transition: opacity .25s, transform .3s;\n}\n.home-work-arrow svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.6; transform: rotate(90deg); }\n.home-work-card:hover .home-work-arrow { opacity: 1; transform: none; }\n\n/* Shared footer bar: the same auto-scrolling strip on every page. */\n.app-marquee {\n  position: relative;\n  z-index: 2;\n  margin: clamp(14px, 2cqw, 22px) 0 0;\n  border-top: 1px solid var(--line);\n  border-bottom: 1px solid var(--line);\n  background: rgba(255, 251, 244, .34);\n  overflow: hidden;\n}\n.app-marquee .marquee-track { padding: 10px 0; gap: 25px; animation-duration: 29s; }\n.app-marquee .marquee-track span { font-size: 9.5px; letter-spacing: .2em; }\n.app-marquee .marquee-track i { font-size: 7px; }\n\n.page-home .home-marquee {\n  flex: 0 0 auto;\n  margin: 0;\n  border-top: 1px solid var(--line);\n  border-bottom: 1px solid var(--line);\n  background: rgba(255, 251, 244, .34);\n}\n.page-home .home-marquee .marquee-track { padding: 10px 0; gap: 25px; animation-duration: 29s; }\n.page-home .home-marquee .marquee-track span { font-size: 9.5px; letter-spacing: .2em; }\n.page-home .home-marquee .marquee-track i { font-size: 7px; }\n\n/* ---------- selected work, inline below the wall ---------- */\n.home-detail {\n  margin-top: 24px;\n  padding-top: 17px;\n  border-top: 1px solid var(--line);\n  scroll-margin-top: 88px;\n}\n.home-detail-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 14px;\n  margin-bottom: 13px;\n}\n.home-detail-head-left { display: flex; align-items: baseline; gap: 10px; }\n.home-detail-index { color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; letter-spacing: .12em; }\n.home-detail-back {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  color: var(--muted-2);\n  font-family: var(--font-mono);\n  font-size: 7.5px;\n  letter-spacing: .04em;\n  white-space: nowrap;\n}\n.home-detail-back:hover { color: var(--rose-deep); }\n.home-detail-back svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.5; transform: rotate(-90deg); }\n.home-detail .detail-hero {\n  display: grid;\n  grid-template-columns: 158px minmax(0, 1fr);\n  gap: clamp(19px, 2.5cqw, 32px);\n  padding: 0;\n}\n.home-detail .detail-cover-wrap { min-width: 0; }\n.home-detail .detail-cover { max-width: 158px; box-shadow: 0 16px 32px rgba(74, 49, 37, .2), 0 0 0 5px rgba(255, 255, 255, .22); }\n.home-detail .detail-cover-caption { margin-top: 11px; font-size: 7px; }\n.home-detail .detail-title { margin-top: 8px; font-size: clamp(27px, 3.2cqw, 39px); }\n.home-detail .detail-jp { margin-top: 4px; }\n.home-detail .detail-tagline { margin-top: 11px; font-size: 12px; }\n.home-detail .detail-intro { margin-top: 11px; max-width: none; font-size: 11px; line-height: 1.9; }\n.home-detail .detail-meta-row { margin-top: 13px; gap: 7px 16px; }\n.home-detail .detail-tags { margin-top: 13px; }\n.home-detail .detail-actions { margin-top: 16px; }\n.home-detail .detail-actions .btn { min-height: 39px; font-size: 9.5px; }\n.home-detail .detail-actions .btn-icon { width: 29px; height: 29px; }\n.home-cast-block {\n  margin-top: 20px;\n  padding-top: 15px;\n  border-top: 1px solid var(--line);\n  scroll-margin-top: 88px;\n}\n.home-cast-block-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 12px;\n}\n.home-cast-block-head > span:last-child {\n  color: var(--muted-2);\n  font-family: var(--font-mono);\n  font-size: 7.5px;\n  letter-spacing: .04em;\n}\n/* Real art sits above the SVG placeholder; the per-work crop frame keeps every\n   work's art at a consistent head size without embedding or re-cropping files. */\n.cast-art { overflow: hidden; }\n.cast-art img.cast-photo {\n  position: absolute;\n  top: var(--cast-top, 0%);\n  left: var(--cast-left, 0%);\n  height: var(--cast-h, 100%);\n  width: auto;\n  max-width: none;\n  z-index: 1;\n  display: block;\n  filter: drop-shadow(0 12px 26px rgba(20, 12, 8, .28));\n}\n.cast-chip-portrait { position: relative; }\n.cast-chip-portrait img.cast-photo {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center 16%;\n  z-index: 1;\n  display: block;\n  filter: none;\n}\n.home-cast-block .cast-layout {\n  grid-template-columns: minmax(205px, 252px) minmax(0, 1fr);\n  gap: clamp(18px, 2.4cqw, 28px);\n}\n.home-cast-block .cast-stage { min-height: 360px; }\n.home-cast-block .cast-info { padding-top: 2px; }\n.home-cast-block .cast-rail {\n  order: -1;\n  margin-top: 0;\n  margin-bottom: 16px;\n  padding-top: 0;\n  padding-bottom: 12px;\n  border-top: 0;\n  border-bottom: 1px solid var(--line);\n  /* Wrap instead of hiding characters off the end of a rail without a bar. */\n  flex-wrap: wrap;\n  overflow: visible;\n  row-gap: 7px;\n}\n.home-cast-block .cast-chip { min-width: 0; }\n\n@container galworld (max-width: 980px) {\n  .page-home { height: clamp(540px, calc(100dvh - 165px), 700px); }\n  .home-masthead { align-items: flex-start; }\n  .home-title { font-size: clamp(31px, 4.4cqw, 46px); }\n  .home-tally strong { font-size: clamp(46px, 6.3cqw, 64px); }\n  .home-work-card { aspect-ratio: 2.45; }\n  .home-work-title { font-size: 12px; }\n  .home-detail .detail-hero { grid-template-columns: 145px minmax(0, 1fr); }\n  .home-detail .detail-cover { max-width: 145px; }\n}\n\n@container galworld (max-width: 700px) {\n  .home-masthead { display: block; padding-bottom: 10px; }\n  .home-title { margin-top: 8px; font-size: 31px; line-height: 1.12; }\n  .home-title em { white-space: normal; }\n  .home-lede { display: none; }\n  .home-tally {\n    flex-direction: row;\n    align-items: baseline;\n    flex-wrap: wrap;\n    gap: 4px 8px;\n    width: 100%;\n    margin-top: 8px;\n    padding: 8px 0 0;\n    border-left: 0;\n    border-top: 1px solid var(--line);\n  }\n  .home-tally-kicker { width: 100%; margin-bottom: 0; }\n  .home-tally strong { font-size: 38px; }\n  .home-tally-line { display: none; }\n  .home-tally-note { margin-left: auto; }\n  .home-wall { margin-top: 0; }\n  .home-wall-title-row { align-items: flex-start; }\n  .home-wall-tools { gap: 5px 10px; padding-top: 2px; }\n  .home-work-count { font-size: 7px; }\n  .home-filter-bar { margin-top: 8px; }\n  .home-filter-bar .filter-chip { min-height: 24px; font-size: 8px; }\n  .home-work-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }\n  .home-work-card { aspect-ratio: 1.3; min-height: 88px; }\n  .home-work-bottom { left: 6px; right: 6px; bottom: 6px; }\n  .home-work-title { font-size: 10px; line-height: 1.2; }\n  .home-work-meta { font-size: 5.5px; }\n  .home-wall-hint { display: none; }\n  .home-wall-head { margin-bottom: 9px; }\n  .home-wall-head h2 { font-size: 21px; }\n  .home-detail { margin-top: 19px; padding-top: 14px; }\n  .home-detail-head { align-items: flex-start; gap: 7px; }\n  .home-detail-head-left { display: block; }\n  .home-detail-head .micro-label { font-size: 7px; letter-spacing: .1em; }\n  .home-detail-index { display: block; margin-top: 3px; font-size: 7px; }\n  .home-detail-back { font-size: 7px; margin-top: 1px; }\n  .home-detail .detail-hero { grid-template-columns: 112px minmax(0, 1fr); gap: 15px; }\n  .home-detail .detail-cover { max-width: 112px; }\n  .home-detail .detail-cover-caption { display: none; }\n  .home-detail .detail-title { font-size: 25px; }\n  .home-detail .detail-tagline { margin-top: 8px; font-size: 10.5px; }\n  .home-detail .detail-intro { margin-top: 8px; font-size: 10px; line-height: 1.8; }\n  .home-detail .detail-meta-row { gap: 5px 10px; margin-top: 10px; }\n  .home-detail .detail-tags { margin-top: 10px; }\n  .home-detail .detail-tags span { font-size: 8px; }\n  .home-detail .detail-actions { margin-top: 12px; gap: 6px; }\n  .home-detail .detail-actions .btn { min-height: 35px; font-size: 8.5px; padding-left: 11px; gap: 7px; }\n  .home-detail .detail-actions .btn-icon { width: 25px; height: 25px; }\n  .home-cast-block { margin-top: 16px; padding-top: 12px; }\n  .home-cast-block-head { margin-bottom: 10px; }\n  .home-cast-block .cast-layout { grid-template-columns: 1fr; gap: 15px; }\n  .home-cast-block .cast-stage { min-height: 300px; }\n  .home-cast-block .cast-info { padding-top: 0; }\n  .home-cast-block .cast-rail { margin-top: 14px; }\n  .page-home .home-marquee .marquee-track { padding: 9px 0; }\n}\n\n@container galworld (max-width: 380px) {\n  .home-title { font-size: 29px; }\n  .home-lede { font-size: 10.5px; line-height: 1.85; }\n  .home-summary-actions .btn { font-size: 9px; }\n  .home-work-title { font-size: 11px; }\n  .home-work-meta { font-size: 6px; }\n}\n\n\n/* ==========================================================================\n   PAGE 02 · ARCHIVE (v2)\n   Same contained frame as page 01: shelf switchboard on top, detail below.\n   ========================================================================== */\n\n.page-archive {\n  height: clamp(540px, calc(100dvh - 180px), 700px);\n  min-height: 0;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: stretch;\n  overflow: hidden;\n}\n\n.page-archive .archive {\n  flex: 1 1 auto;\n  width: 100%;\n  align-self: stretch;\n  min-height: 0;\n  display: block;\n  max-width: none;\n  padding: clamp(16px, 2.2cqw, 26px) var(--gutter) 18px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.page-archive .archive::-webkit-scrollbar { width: 5px; }\n.page-archive .archive::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n.page-archive .archive::-webkit-scrollbar-track { background: transparent; }\n\n/* The shelf takes the full width; page 02 is a pure switchboard. */\n.page-archive .library {\n  flex: none;\n  width: 100%;\n  min-height: 0;\n  padding: 0;\n  border: 0;\n  border-radius: 0;\n  background: none;\n  overflow: visible;\n}\n.page-archive .library::before { display: none; }\n.page-archive .library-main { height: auto; }\n.page-archive .library-spine,\n.page-archive .library-foot { display: none; }\n.page-archive .work-detail { display: none; }\n\n/* Compact toolbar */\n.page-archive .library-toolbar { gap: 8px; }\n.page-archive .search-box { min-height: 34px; border-radius: 9px; padding: 0 11px; }\n.page-archive .search-box input { font-size: 10.5px; }\n.page-archive .search-box svg { width: 12px; height: 12px; }\n.page-archive .search-box kbd { display: none; }\n.page-archive .filter-bar { gap: 5px; margin-top: 9px; }\n.page-archive .filter-chip { min-height: 24px; padding: 0 9px; font-size: 9px; }\n.page-archive .filter-chip span { font-size: 7px; }\n.page-archive .library-title { margin: 12px 1px 8px; font-size: 7.5px; }\n\n/* Four bigger covers per row */\n.page-archive .work-grid {\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 10px;\n}\n.page-archive .work-card {\n  aspect-ratio: .78;\n  border-radius: 10px;\n  border-color: rgba(255, 255, 255, .14);\n  transition: transform .35s var(--ease-out), border-color .25s, box-shadow .3s, filter .3s;\n}\n.page-archive .work-card:hover { transform: translateY(-3px); }\n\n/* Enabled: full colour, rose frame, check mark */\n.page-archive .work-card.is-on { border-color: rgba(166, 79, 104, .55); }\n.page-archive .work-card.is-on:hover { border-color: var(--rose); box-shadow: 0 12px 24px rgba(74, 49, 37, .22); }\n.page-archive .work-card.is-on .work-card-bg { filter: none; }\n.page-archive .work-card.is-on .work-card-check {\n  opacity: 1;\n  transform: none;\n  background: var(--rose);\n  border-color: rgba(255, 236, 240, .5);\n  color: #fffaf4;\n}\n\n/* Disabled: dim, desaturated, no check */\n.page-archive .work-card.is-off { border-color: rgba(255, 255, 255, .1); }\n.page-archive .work-card.is-off .work-card-bg { filter: grayscale(.85) brightness(.5); }\n.page-archive .work-card.is-off .work-card-title { color: rgba(255, 250, 244, .62); }\n.page-archive .work-card.is-off .work-card-sub,\n.page-archive .work-card.is-off .work-card-tags { opacity: .5; }\n.page-archive .work-card.is-off .work-card-check { opacity: 0; transform: scale(.7); }\n.page-archive .work-card.is-off::after {\n  background: linear-gradient(180deg, rgba(6, 8, 12, .45) 0%, rgba(6, 8, 12, .62) 60%, rgba(6, 8, 12, .92) 100%);\n}\n\n.page-archive .work-card-check {\n  display: grid;\n  place-items: center;\n  width: 17px;\n  height: 17px;\n  border: 1px solid rgba(255, 255, 255, .28);\n  border-radius: 50%;\n  color: transparent;\n  background: rgba(9, 11, 16, .42);\n  -webkit-backdrop-filter: blur(6px);\n  backdrop-filter: blur(6px);\n  opacity: 0;\n  transform: scale(.7);\n  transition: opacity .22s, transform .25s var(--ease-out), background .22s, border-color .22s;\n}\n.page-archive .work-card-check svg { width: 9px; height: 9px; fill: none; stroke: currentColor; stroke-width: 2.4; }\n\n.page-archive .work-card-index { font-size: 7.5px; }\n.page-archive .work-card-flags {\n  position: absolute;\n  z-index: 4;\n  right: 7px;\n  bottom: 7px;\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n\n\n.page-archive .work-card-title { font-size: 10.5px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.page-archive .work-card-sub { font-size: 6px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.page-archive .work-card-tags { display: none; }\n.page-archive .work-card-bottom { left: 8px; right: 8px; bottom: 7px; padding-right: 74px; }\n/* Main-character faces, right on the switch button. */\n.page-archive .work-card-faces {\n  display: flex;\n  align-items: center;\n  margin-top: 6px;\n}\n.page-archive .work-card-faces img.cast-face {\n  width: 21px;\n  height: 21px;\n  border-radius: 50%;\n  object-fit: cover;\n  object-position: center 18%;\n  border: 1px solid rgba(255, 250, 244, .7);\n  background: #241d1a;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, .4);\n  margin-left: -7px;\n}\n.page-archive .work-card-faces img.cast-face:first-child { margin-left: 0; }\n.page-archive .work-card.is-off .work-card-faces img.cast-face {\n  filter: grayscale(.9) brightness(.62);\n  border-color: rgba(255, 255, 255, .28);\n}\n\n.page-archive .work-card-top { top: 7px; left: 7px; right: 7px; }\n\n/* \"可开剧情\" flag: this work ships 剧情 entries in the worldbook. */\n.page-archive .work-card-plot {\n  padding: 1px 5px;\n  border: 1px solid rgba(255, 233, 238, .34);\n  border-radius: 4px;\n  background: rgba(166, 79, 104, .88);\n  color: #fff8f4;\n  font-family: var(--font-mono);\n  font-size: 6.5px;\n  letter-spacing: .04em;\n  line-height: 1.5;\n  white-space: nowrap;\n  box-shadow: 0 2px 8px rgba(60, 32, 24, .3);\n}\n.page-archive .work-card.is-off .work-card-plot {\n  background: rgba(60, 48, 44, .82);\n  border-color: rgba(255, 255, 255, .14);\n  color: rgba(255, 250, 244, .58);\n  box-shadow: none;\n}\n\n.page-archive .detail-shelf-btn { display: none; }\n\n@container galworld (max-width: 980px) {\n  .page-archive { height: clamp(540px, calc(100dvh - 165px), 700px); }\n  .page-archive .work-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }\n}\n\n@container galworld (max-width: 760px) {\n  .page-archive .work-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n}\n\n@container galworld (max-width: 620px) {\n  .page-archive .work-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }\n  .page-archive .work-card { aspect-ratio: .78; border-radius: 9px; }\n  .page-archive .work-card-bottom { left: 7px; right: 7px; bottom: 7px; }\n  .page-archive .work-card-title { font-size: 10px; line-height: 1.25; }\n  .page-archive .work-card-sub { display: none; }\n  .page-archive .work-card-index { font-size: 8px; }\n  .page-archive .work-card-faces { margin-top: 4px; gap: 0; }\n  .page-archive .work-card-faces img.cast-face { width: 15px; height: 15px; margin-left: -3px; }\n  .page-archive .work-card-flags { right: 5px; bottom: 5px; gap: 3px; transform: scale(.86); transform-origin: bottom right; }\n  .page-archive .work-card-plot { font-size: 7px; padding: 0 4px; border-radius: 3px; }\n}\n\n@container galworld (max-width: 430px) {\n  .page-archive .work-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }\n  .page-archive .work-card-title { font-size: 9px; }\n  .page-archive .work-card-faces img.cast-face { width: 13px; height: 13px; }\n}\n\n/* ==========================================================================\n   PAGE 03 · WORLD ROUTING (v2.3)\n   Two mode buttons + two placeholder lanes filled from page 02's switches.\n   ========================================================================== */\n\n.page-console-v2 {\n  height: clamp(540px, calc(100dvh - 180px), 700px);\n  min-height: 0;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.console-v2-scroll {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: clamp(18px, 2.4cqw, 28px) var(--gutter) 18px;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.console-v2-scroll::-webkit-scrollbar { width: 5px; }\n.console-v2-scroll::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n.console-v2-scroll::-webkit-scrollbar-track { background: transparent; }\n\n.console-mode-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  padding-bottom: 16px;\n  border-bottom: 1px solid var(--line);\n}\n.console-mode-copy h2 {\n  margin-top: 6px;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(22px, 2.5cqw, 31px);\n  font-weight: 500;\n  letter-spacing: -.02em;\n}\n.console-modes { display: flex; gap: 8px; flex: 0 0 auto; }\n.console-mode {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 2px;\n  min-width: 118px;\n  padding: 10px 14px;\n  border: 1px solid var(--line);\n  border-radius: 10px;\n  background: rgba(255, 252, 247, .45);\n  text-align: left;\n  transition: border-color .22s, background .22s, box-shadow .25s, transform .22s;\n}\n.console-mode:hover { transform: translateY(-1px); border-color: rgba(166, 79, 104, .4); }\n.console-mode.is-active {\n  border-color: rgba(166, 79, 104, .62);\n  background: linear-gradient(155deg, rgba(255, 248, 244, .95), rgba(244, 225, 227, .6));\n  box-shadow: 0 10px 22px rgba(95, 62, 48, .1), inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n.console-mode-name { color: var(--paper); font-family: var(--font-display); font-size: 13px; font-weight: 500; letter-spacing: .02em; }\n.console-mode.is-active .console-mode-name { color: var(--rose-deep); }\n.console-mode-sub { color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .04em; }\n.console-mode-note { margin-top: 10px; color: var(--muted-2); font-size: 8.5px; letter-spacing: .02em; }\n\n.console-boxes {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  margin-top: 14px;\n}\n.console-box {\n  min-width: 0;\n  padding: 13px 14px 14px;\n  border: 1px solid var(--line);\n  border-radius: 13px;\n  background: linear-gradient(160deg, rgba(255, 252, 247, .7), rgba(244, 233, 218, .25));\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7);\n}\n.console-box-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-bottom: 9px; }\n.console-box-head h2 { margin-top: 3px; color: var(--paper); font-family: var(--font-display); font-size: 17px; font-weight: 500; }\n.console-box-hint { color: var(--muted-2); font-size: 7px; white-space: nowrap; }\n.console-collapse-btn { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; padding: 4px 8px; border: 1px solid rgba(166,79,104,.25); border-radius: 6px; background: rgba(255,255,255,.55); color: var(--muted); font-family: inherit; font-size: 8px; cursor: pointer; }\n.console-collapse-btn svg { width: 10px; height: 10px; transition: transform .2s; }\n.console-box.is-collapsed .console-collapse-btn svg { transform: rotate(-90deg); }\n.console-box.is-collapsed { height: auto; }\n.console-box.is-collapsed .console-box-grid { display: none; }\n.console-box-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }\n.console-box-protagonist { display: flex; flex-direction: column; height: 398px; }\n.console-box-protagonist .console-box-grid { flex: 1; min-height: 0; overflow-y: auto; align-content: start; padding-right: 4px; grid-template-columns: repeat(3, minmax(0, 1fr)); }\n.console-box-story .console-box-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n@media (max-width: 700px) { .console-box-protagonist { height: 360px; } .console-box-protagonist .console-box-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .console-box-story .console-box-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n\n.console-work {\n  position: relative;\n  aspect-ratio: 1.24;\n  overflow: hidden;\n  border: 1px solid rgba(255, 255, 255, .18);\n  border-radius: 7px;\n  background: #1b1d24;\n  text-align: left;\n  isolation: isolate;\n  transition: transform .25s var(--ease-out), border-color .22s;\n}\n.console-work:hover { transform: translateY(-2px); border-color: rgba(166, 79, 104, .55); }\n.console-work.is-off { opacity: .58; }\n.console-work.is-on { border-color: rgba(56,111,100,.65); box-shadow: 0 0 0 1px rgba(56,111,100,.35), 0 8px 22px rgba(56,111,100,.12); }\n.console-work.is-on .console-work-tag { background: rgba(56,111,100,.88); border-color: rgba(255,255,255,.45); color: #fff; }\n.console-work-bg {\n  position: absolute;\n  inset: 0;\n  display: block;\n  background-size: cover;\n  background-position: center 38%;\n  background-repeat: no-repeat;\n  transition: transform .5s var(--ease-out);\n}\n.console-work:hover .console-work-bg { transform: scale(1.05); }\n.console-work::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(180deg, rgba(7, 9, 14, .05) 20%, rgba(7, 9, 14, .35) 55%, rgba(7, 9, 14, .88) 100%);\n}\n.console-work-title {\n  position: absolute;\n  z-index: 2;\n  left: 7px;\n  right: 7px;\n  bottom: 7px;\n  overflow: hidden;\n  color: #fffaf4;\n  font-family: var(--font-display);\n  font-size: 9.5px;\n  line-height: 1.3;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  text-shadow: 0 2px 8px rgba(0, 0, 0, .6);\n}\n.console-work-tag {\n  position: absolute;\n  z-index: 2;\n  top: 6px;\n  right: 6px;\n  padding: 1px 5px;\n  border: 1px solid rgba(255, 255, 255, .24);\n  border-radius: 3px;\n  background: rgba(9, 11, 16, .5);\n  color: rgba(255, 250, 244, .75);\n  font-family: var(--font-mono);\n  font-size: 6px;\n  letter-spacing: .04em;\n}\n.console-work-index {\n  position: absolute;\n  z-index: 2;\n  left: 6px;\n  top: 6px;\n  color: rgba(255, 255, 255, .7);\n  font-family: var(--font-mono);\n  font-size: 6.5px;\n}\n\n.console-empty {\n  grid-column: 1 / -1;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  min-height: 150px;\n  border: 1px dashed var(--line-strong);\n  border-radius: 8px;\n  color: var(--muted-2);\n  font-size: 9px;\n  text-align: center;\n}\n.console-empty b { color: var(--muted); font-family: var(--font-display); font-size: 11px; font-weight: 500; }\n\n.console-foot-note {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-top: 12px;\n  color: var(--muted-2);\n  font-size: 7.5px;\n}\n.console-foot-note svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.4; }\n\n@container galworld (max-width: 980px) {\n  .page-console-v2 { height: clamp(540px, calc(100dvh - 165px), 700px); }\n  .console-mode-bar { gap: 14px; }\n  .console-modes { gap: 6px; }\n  .console-mode { min-width: 100px; padding: 9px 11px; }\n}\n\n@container galworld (max-width: 700px) {\n  .console-mode-bar { display: block; }\n  .console-modes { margin-top: 10px; }\n  .console-mode { flex: 1 1 0; min-width: 0; }\n  .console-boxes { grid-template-columns: 1fr; }\n  .console-box-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .console-box-hint { display: none; }\n}\n\n@container galworld (max-width: 420px) {\n  .console-box-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n}\n/* 剧情模式红色提醒 */\n.console-warning {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin: 0 0 9px;\n  padding: 5px 8px;\n  border: 1px solid rgba(176, 58, 58, .28);\n  border-radius: 6px;\n  background: rgba(176, 58, 58, .08);\n  color: #a33b3b;\n  font-size: 8.5px;\n  line-height: 1.55;\n}\n.console-warning span { flex: 0 0 auto; color: #d39a2e; font-size: 11px; }\n\n/* ==========================================================================\n   HOME GATE + ORIGINAL PROTAGONIST (v3.8)\n   ========================================================================== */\n.home-gate {\n  position: absolute; inset: 0; z-index: 40; display: grid; place-items: center; padding: 24px;\n  background: rgba(50, 32, 36, .26); backdrop-filter: blur(3px); cursor: pointer;\n  transition: opacity .24s ease, visibility .24s ease;\n}\n.home-gate[hidden] { display: none; }\n.home-gate.is-leaving { opacity: 0; visibility: hidden; }\n.home-gate-card {\n  width: min(560px, 88%); padding: 24px 26px 20px; border: 2px solid #b03a3a; border-radius: 14px;\n  background: linear-gradient(160deg, rgba(255,252,247,.98), rgba(247,232,226,.96));\n  box-shadow: 0 26px 60px rgba(64,34,38,.24), inset 0 1px 0 rgba(255,255,255,.9); text-align: center;\n}\n.home-gate-kicker { color: #b03a3a; font-family: var(--font-mono); font-size: 7.5px; font-weight: 700; letter-spacing: .2em; }\n.home-gate-card p { margin-top: 12px; color: var(--paper); font-family: var(--font-display); font-size: 15px; line-height: 1.9; letter-spacing: .02em; }\n.home-gate-hint { display: block; margin-top: 13px; color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }\n\n#swapWorkGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }\n.proto-card {\n  display: flex; gap: 8px; min-width: 0; padding: 8px;\n  border: 1px solid rgba(166,79,104,.18); border-radius: 12px;\n  background: linear-gradient(160deg, rgba(255,252,247,.9), rgba(244,233,218,.4));\n  box-shadow: inset 0 1px 0 rgba(255,255,255,.8);\n  transition: border-color .2s, box-shadow .2s, transform .2s;\n}\n.proto-card.has-mode { border-color: var(--proto-accent); box-shadow: 0 7px 18px rgba(95,62,48,.1), inset 0 0 0 1px rgba(255,255,255,.7); }\n.proto-card.is-off { opacity: .55; }\n.proto-portrait {\n  position: relative;\n  display: grid; place-items: center; width: 74px; height: 96px; flex: 0 0 auto; overflow: hidden;\n  border: 1px solid var(--proto-accent); border-radius: 10px;\n  background: radial-gradient(circle at 34% 24%, rgba(255,255,255,.9), transparent 58%), var(--proto-accent2);\n  box-shadow: 0 4px 12px rgba(95,62,48,.14);\n}\n.proto-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; }\n.proto-overlay { position: absolute; inset: 0; display: grid; place-items: center; padding: 8px; background: rgba(35,20,28,.68); color: #fff; font-family: var(--font-display); font-size: 11px; font-weight: 700; line-height: 1.5; text-align: center; letter-spacing: .02em; }\n.proto-portrait b { color: #fff; font-family: var(--font-display); font-size: 32px; font-weight: 600; text-shadow: 0 2px 5px rgba(0,0,0,.28); }\n.proto-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1 1 auto; }\n.proto-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; min-width: 0; }\n.proto-work { overflow: hidden; color: var(--muted-2); font-family: var(--font-mono); font-size: 7.5px; letter-spacing: .02em; white-space: nowrap; text-overflow: ellipsis; }\n.proto-state { flex: 0 0 auto; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .03em; white-space: nowrap; }\n.proto-card.has-mode .proto-state { color: var(--proto-accent); font-weight: 700; }\n.proto-name { overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 13px; font-weight: 600; line-height: 1.25; white-space: nowrap; text-overflow: ellipsis; }\n.proto-modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; margin-top: auto; padding-top: 3px; }\n.proto-mode {\n  display: inline-flex; align-items: center; justify-content: center; gap: 3px; min-width: 0; padding: 4px 2px;\n  border: 1px solid rgba(166,79,104,.24); border-radius: 6px; background: rgba(255,255,255,.55);\n  color: var(--muted); font-family: inherit; font-size: 8.5px; line-height: 1.2; cursor: pointer;\n  transition: background .18s, border-color .18s, color .18s;\n}\n.proto-mode i { width: 4px; height: 4px; flex: 0 0 auto; border-radius: 50%; background: rgba(166,79,104,.35); }\n.proto-mode:hover:not(:disabled) { border-color: var(--proto-accent); color: var(--proto-accent); }\n.proto-mode.is-active { border-color: var(--proto-accent); background: var(--proto-accent); color: #fff; box-shadow: 0 2px 7px rgba(95,62,48,.18); }\n.proto-mode.is-active i { background: #fff; box-shadow: 0 0 6px rgba(255,255,255,.8); }\n.proto-mode:disabled { opacity: .45; cursor: not-allowed; }\n.proto-mode.is-empty { visibility: hidden; pointer-events: none; }\n@container galworld (max-width: 700px) {\n  #swapWorkGrid { grid-template-columns: 1fr; }\n}\n\n/* ==========================================================================\n   PAGE 04 · PERSONA (v2)\n   Two modes: play yourself, or play a main character from an enabled work.\n   ========================================================================== */\n\n.page-persona-v2 {\n  height: clamp(560px, calc(100dvh - 180px), 700px);\n  min-height: 0;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.persona-v2-scroll {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: clamp(18px, 2.4cqw, 28px) var(--gutter) 18px;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.persona-v2-scroll::-webkit-scrollbar { width: 5px; }\n.persona-v2-scroll::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n.persona-v2-scroll::-webkit-scrollbar-track { background: transparent; }\n\n.persona-v2-head {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 16px;\n  padding-bottom: 12px;\n  border-bottom: 1px solid var(--line);\n}\n.persona-v2-head h2 {\n  margin-top: 5px;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(23px, 2.5cqw, 31px);\n  font-weight: 500;\n  letter-spacing: -.02em;\n}\n.persona-v2-desc { margin-top: 4px; color: var(--muted-2); font-size: 11px; }\n.persona-head-actions { display: flex; align-items: center; gap: 9px; flex: 0 0 auto; }\n.persona-companion-btn { padding: 7px 13px; font-size: 9px; white-space: nowrap; }\n.bond-intro { margin-bottom: 9px; padding: 10px 12px; border: 1px solid rgba(166,79,104,.16); border-radius: 9px; background: rgba(255,252,247,.5); }\n.bond-intro b { color: var(--rose-deep); font-family: var(--font-display); font-size: 14px; }\n.bond-intro p { margin-top: 3px; color: var(--muted-2); font-size: 9px; line-height: 1.6; }\n.bond-table-head, .bond-row { display: grid; grid-template-columns: minmax(120px, .95fr) minmax(80px, .55fr) minmax(120px, 1.15fr) 52px; gap: 7px; align-items: center; }\n.bond-table-head { padding: 0 8px 5px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .05em; }\n.bond-list { display: flex; flex-direction: column; gap: 5px; max-height: 470px; overflow-y: auto; padding-right: 3px; }\n.bond-row { padding: 6px 8px; border: 1px solid rgba(166,79,104,.12); border-radius: 8px; background: rgba(255,252,247,.45); }\n.bond-row.is-active { border-color: rgba(166,79,104,.42); background: rgba(255,244,240,.88); }\n.bond-person { display: flex; align-items: center; gap: 7px; min-width: 0; }\n.bond-face { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 auto; overflow: hidden; border-radius: 50%; background: rgba(166,79,104,.1); color: var(--rose-deep); font-size: 10px; font-weight: 700; }\n.bond-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; }\n.bond-copy { min-width: 0; }\n.bond-copy b { display: block; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 11px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }\n.bond-copy small { display: block; overflow: hidden; margin-top: 1px; color: var(--muted-2); font-size: 7px; white-space: nowrap; text-overflow: ellipsis; }\n.bond-input { width: 100%; min-width: 0; padding: 5px 6px; border: 1px solid rgba(166,79,104,.16); border-radius: 6px; outline: none; background: rgba(255,255,255,.55); color: var(--paper); font-family: inherit; font-size: 9px; }\n.bond-input:disabled { opacity: .45; }\n.bond-input:focus { border-color: rgba(166,79,104,.45); }\n.bond-pick { padding: 5px 3px; border: 1px solid rgba(166,79,104,.25); border-radius: 6px; background: rgba(255,255,255,.5); color: var(--muted); font-family: inherit; font-size: 8px; cursor: pointer; }\n.bond-pick.is-on { border-color: var(--rose); background: var(--rose); color: #fff; }\n.persona-companion-bar { display: block; width: 100%; margin: 0 0 12px; padding: 9px 14px; border: 1px solid rgba(166,79,104,.35); border-radius: 9px; background: linear-gradient(180deg, #c76b80, #b45269); box-shadow: 0 2px 0 rgba(120,45,65,.12); color: #fff; font-family: var(--font-display); font-size: 12px; font-weight: 600; letter-spacing: .04em; cursor: pointer; text-align: center; }\n.persona-companion-bar:hover { background: linear-gradient(180deg, #d2778c, #bd5b73); }\n.bond-cats { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }\n.bond-cat { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid rgba(166,79,104,.18); border-radius: 7px; background: rgba(255,252,247,.45); color: var(--muted); font-family: inherit; font-size: 9px; cursor: pointer; }\n.bond-cat em { font-family: var(--font-mono); font-size: 7px; font-style: normal; opacity: .65; }\n.bond-cat.is-active { border-color: var(--rose); background: var(--rose); color: #fff; }\n.bond-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; max-height: none; overflow: visible; padding-right: 0; }\n.bond-card { display: flex; align-items: stretch; gap: 8px; min-height: 112px; padding: 8px; border: 1px solid rgba(166,79,104,.12); border-radius: 9px; background: rgba(255,252,247,.45); }\n.bond-card.is-active { border-color: rgba(166,79,104,.45); background: rgba(255,244,240,.9); box-shadow: 0 1px 0 rgba(166,79,104,.08); }\n.bond-card-portrait { display: flex; align-items: flex-start; flex: 0 0 auto; }\n.bond-card-portrait .bond-face { width: 54px; height: 74px; border-radius: 7px; }\n.bond-card-body { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; }\n.bond-card-work { display: block; overflow: hidden; color: var(--muted-2); font-family: var(--font-mono); font-size: 6px; white-space: nowrap; text-overflow: ellipsis; }\n.bond-card-name { display: block; overflow: hidden; margin-top: 2px; color: var(--paper); font-family: var(--font-display); font-size: 12px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }\n.bond-card-fields { display: flex; flex-direction: column; gap: 3px; margin-top: 5px; }\n.bond-card-fields .bond-input { padding: 3px 5px; font-size: 8px; }\n.bond-card .bond-pick { align-self: flex-end; margin-top: auto; padding: 3px 7px; }\n@media (max-width: 700px) { .bond-list { grid-template-columns: 1fr; } .bond-card { min-height: 96px; } }\n\n@media (max-width: 700px) { .persona-head-actions { flex-direction: column; align-items: flex-end; } .bond-table-head { display: none; } .bond-row { grid-template-columns: 1fr 52px; } .bond-row .bond-input { grid-column: 1 / -1; } }\n.persona-v2-note-inline { display: inline-block; margin-left: 10px; color: var(--rose-deep); font-family: var(--font-body); font-size: 11.5px; font-weight: 400; letter-spacing: 0; line-height: 1.5; }\n.page-persona .persona-v2-head h2 { font-size: clamp(28px, 3cqw, 38px); }\n.page-persona .pfield-label { font-size: 12px; }\n.page-persona .pfield-label i { font-size: 10px; }\n.page-persona .pfield input, .page-persona .pfield textarea { font-size: 14px; }\n.page-persona .persona-tab span { font-size: 14px; }\n.page-persona .persona-tab small { font-size: 7px; }\n\n.persona-tabs { display: flex; gap: 6px; margin-top: 12px; }\n.persona-tab {\n  display: flex;\n  align-items: baseline;\n  gap: 7px;\n  padding: 8px 14px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 252, 247, .42);\n  color: var(--muted);\n  transition: border-color .22s, background .22s, color .22s, box-shadow .22s;\n}\n.persona-tab span { font-family: var(--font-display); font-size: 12.5px; }\n.persona-tab small { color: var(--muted-2); font-family: var(--font-mono); font-size: 6.5px; letter-spacing: .08em; }\n.persona-tab:hover { border-color: rgba(166, 79, 104, .38); color: var(--paper); }\n.persona-tab.is-active {\n  border-color: rgba(166, 79, 104, .58);\n  background: linear-gradient(155deg, rgba(255, 248, 244, .95), rgba(244, 225, 227, .58));\n  color: var(--rose-deep);\n  box-shadow: 0 8px 18px rgba(95, 62, 48, .09), inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n\n.persona-v2-layout {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 258px;\n  gap: 14px;\n  margin-top: 12px;\n  align-items: start;\n}\n.persona-v2-panel { min-width: 0; }\n.persona-v2-pane[hidden] { display: none; }\n.persona-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.pfield {\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n  min-width: 0;\n  padding: 8px 10px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 252, 247, .4);\n}\n.pfield-full { grid-column: 1 / -1; }\n.pfield-label { display: flex; align-items: center; gap: 5px; color: var(--muted); font-size: 9px; font-weight: 600; letter-spacing: .02em; }\n.pfield-label i { color: var(--rose); font-family: var(--font-mono); font-size: 8px; font-style: normal; }\n.pfield input,\n.pfield textarea {\n  width: 100%;\n  min-width: 0;\n  padding: 3px 0;\n  border: 0;\n  border-bottom: 1px solid transparent;\n  outline: none;\n  background: transparent;\n  color: var(--paper);\n  font-family: var(--font-body);\n  font-size: 11px;\n  line-height: 1.65;\n  resize: vertical;\n  transition: border-color .2s;\n}\n.pfield input:focus,\n.pfield textarea:focus { border-bottom-color: rgba(166, 79, 104, .45); }\n.pfield input::placeholder,\n.pfield textarea::placeholder { color: var(--muted-2); }\n.pfield textarea { min-height: 58px; }\n\n.pfield-toggle { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }\n.pfield-toggle p { margin-top: 3px; color: var(--muted-2); font-size: 8px; }\n.p-switch { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; border: 0; background: transparent; color: var(--muted-2); }\n.p-switch-track { position: relative; display: block; width: 34px; height: 18px; border: 1px solid var(--line-strong); border-radius: 99px; background: rgba(120, 105, 94, .18); transition: background .2s, border-color .2s; }\n.p-switch-track i { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fffaf4; box-shadow: 0 1px 3px rgba(0, 0, 0, .2); transition: transform .2s; }\n.p-switch b { font-family: var(--font-mono); font-size: 8px; font-weight: 500; }\n.p-switch[aria-pressed=\"true\"] { color: var(--rose-deep); }\n.p-switch[aria-pressed=\"true\"] .p-switch-track { background: var(--rose); border-color: var(--rose); }\n.p-switch[aria-pressed=\"true\"] .p-switch-track i { transform: translateX(16px); }\n\n.role-tabs { display: flex; gap: 5px; margin-bottom: 9px; }\n.role-tab { padding: 5px 10px; border: 1px solid var(--line); border-radius: 99px; background: rgba(255, 252, 247, .4); color: var(--muted-2); font-size: 8.5px; transition: all .2s; }\n.role-tab.is-active { border-color: rgba(166, 79, 104, .5); background: rgba(244, 225, 227, .65); color: var(--rose-deep); }\n.role-note { margin: 4px 0 8px; color: var(--muted-2); font-size: 8px; line-height: 1.6; }\n.role-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 7px; }\n.role-pick { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; padding: 4px 2px 5px; border: 1px solid transparent; border-radius: 8px; background: transparent; transition: border-color .2s, background .2s, transform .2s; }\n.role-pick:hover { transform: translateY(-1px); background: rgba(255, 252, 247, .55); }\n.role-pick.is-active { border-color: rgba(166, 79, 104, .55); background: rgba(244, 225, 227, .5); }\n.role-face { display: grid; place-items: center; width: 46px; height: 46px; overflow: hidden; border: 1px solid rgba(255, 250, 244, .7); border-radius: 50%; background: #241d1a; box-shadow: 0 2px 7px rgba(52, 35, 27, .18); }\n.role-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }\n.role-face b { color: #fff8f2; font-family: var(--font-display); font-size: 14px; font-weight: 500; }\n.role-name { max-width: 100%; overflow: hidden; color: var(--muted); font-size: 8px; line-height: 1.3; text-align: center; white-space: nowrap; text-overflow: ellipsis; }\n.role-work { max-width: 100%; overflow: hidden; color: var(--muted-2); font-size: 6.5px; white-space: nowrap; text-overflow: ellipsis; }\n.role-pick.is-active .role-name { color: var(--rose-deep); }\n.role-picked { margin-top: 9px; padding: 8px 10px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--muted-2); font-size: 8.5px; line-height: 1.65; }\n.role-picked b { color: var(--rose-deep); font-weight: 600; }\n.role-empty { grid-column: 1 / -1; padding: 18px 8px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--muted-2); font-size: 8.5px; text-align: center; }\n\n.persona-v2-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 11px; }\n.persona-v2-actions .text-btn { color: var(--muted-2); }\n.persona-v2-actions .btn-save { min-height: 30px; padding: 0 14px; font-size: 9px; }\n\n.persona-v2-preview { position: sticky; top: 0; }\n.persona-preview-card {\n  padding: 14px;\n  border: 1px solid var(--line);\n  border-radius: 13px;\n  background: linear-gradient(158deg, rgba(255, 252, 247, .86), rgba(244, 225, 227, .45));\n  box-shadow: 0 14px 34px rgba(78, 53, 40, .1), inset 0 1px 0 rgba(255, 255, 255, .85);\n}\n.pp-kicker { color: var(--muted-2); font-family: var(--font-mono); font-size: 6.5px; letter-spacing: .08em; }\n.pp-avatar { display: grid; place-items: center; width: 62px; height: 62px; margin-top: 11px; border: 1px solid rgba(166, 79, 104, .32); border-radius: 50%; background: radial-gradient(circle at 34% 28%, #fff8f2, #ead6d4 62%, #d9b9b9); color: var(--rose-deep); font-family: var(--font-display); font-size: 26px; }\n.pp-mode { display: inline-block; margin-top: 10px; padding: 1px 6px; border: 1px solid rgba(166, 79, 104, .28); border-radius: 3px; color: var(--rose-deep); font-family: var(--font-mono); font-size: 6.5px; }\n.persona-preview-card h3 { margin-top: 5px; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 22px; font-weight: 500; line-height: 1.25; white-space: nowrap; text-overflow: ellipsis; }\n.pp-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 5px; color: var(--muted); font-size: 8px; }\n.pp-meta i { width: 3px; height: 3px; border-radius: 50%; background: var(--rose); opacity: .55; }\n.pp-bio { display: -webkit-box; overflow: hidden; margin-top: 9px; color: var(--muted); font-size: 9px; line-height: 1.75; -webkit-box-orient: vertical; -webkit-line-clamp: 5; }\n.pp-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }\n.pp-tags span { padding: 2px 6px; border: 1px solid var(--line); border-radius: 99px; color: var(--muted-2); font-size: 7px; }\n.pp-cross { margin-top: 9px; padding: 5px 7px; border: 1px solid rgba(166, 79, 104, .25); border-radius: 5px; background: rgba(244, 225, 227, .45); color: var(--rose-deep); font-size: 7.5px; }\n.pp-completion { display: flex; align-items: center; gap: 7px; margin-top: 12px; padding-top: 9px; border-top: 1px solid var(--line); color: var(--muted-2); font-size: 7.5px; }\n.pp-completion b { color: var(--rose-deep); font-family: var(--font-display); font-size: 15px; font-weight: 500; }\n.pp-completion .completion-ring { width: 30px; height: 30px; }\n.pp-note { margin-top: 8px; color: var(--muted-2); font-size: 7px; text-align: center; }\n\n@container galworld (max-width: 980px) {\n  .page-persona-v2 { height: clamp(560px, calc(100dvh - 165px), 700px); }\n  .persona-v2-layout { grid-template-columns: minmax(0, 1fr) 220px; }\n  .role-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }\n}\n@container galworld (max-width: 700px) {\n  .persona-v2-layout { grid-template-columns: 1fr; }\n  .persona-v2-preview { display: none; }\n  .persona-fields { grid-template-columns: 1fr; }\n  .role-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n}\n@container galworld (max-width: 430px) {\n  .persona-tab { flex: 1 1 0; justify-content: center; }\n  .role-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .role-face { width: 42px; height: 42px; }\n}\n.persona-v2-note { margin-top: 3px; color: var(--muted-2); font-size: 8.5px; line-height: 1.6; }\n\n/* ==========================================================================\n   PAGE 06 · THE BEGINNING\n   One launch button, one readable prompt record.\n   ========================================================================== */\n\n.page-final {\n  height: clamp(560px, calc(100dvh - 180px), 700px);\n  min-height: 0;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.final-scroll {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: clamp(20px, 2.6cqw, 32px) var(--gutter) 20px;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.final-scroll::-webkit-scrollbar { width: 5px; }\n.final-scroll::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n.final-scroll::-webkit-scrollbar-track { background: transparent; }\n\n.final-hero { text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--line); }\n.final-hero h1 {\n  margin-top: 7px;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(28px, 3.5cqw, 43px);\n  font-weight: 500;\n  letter-spacing: -.03em;\n  line-height: 1.2;\n}\n.final-hero h1 em { color: var(--rose-deep); font-style: italic; }\n.final-lede { max-width: 470px; margin: 9px auto 0; color: var(--muted); font-size: 9.5px; line-height: 1.75; }\n.final-begin {\n  display: inline-flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  width: min(100%, 340px);\n  min-height: 58px;\n  margin-top: 18px;\n  padding: 0 18px 0 20px;\n  border: 0;\n  border-radius: 12px;\n  background: linear-gradient(135deg, #a64f68, #7e3348);\n  color: #fffaf4;\n  box-shadow: 0 16px 32px rgba(126, 51, 72, .28), inset 0 1px 0 rgba(255, 255, 255, .25);\n  text-align: left;\n  transition: transform .22s, box-shadow .22s, opacity .2s;\n}\n.final-begin:hover { transform: translateY(-2px); box-shadow: 0 20px 38px rgba(126, 51, 72, .34), inset 0 1px 0 rgba(255, 255, 255, .3); }\n.final-begin:disabled { opacity: .65; transform: none; cursor: progress; }\n.final-begin .btn-begin-label { display: flex; flex-direction: column; gap: 3px; }\n.final-begin small { color: rgba(255, 236, 240, .7); font-family: var(--font-mono); font-size: 6.5px; letter-spacing: .14em; }\n.final-begin b { font-family: var(--font-display); font-size: 19px; font-weight: 500; letter-spacing: .04em; }\n.final-begin .btn-icon { display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid rgba(255, 250, 244, .4); border-radius: 50%; }\n.final-begin .btn-icon svg { width: 11px; height: 11px; fill: currentColor; }\n.final-status { margin-top: 9px; color: var(--muted-2); font-size: 8px; }\n\n.final-record { margin-top: 16px; padding: 14px 16px 16px; border: 1px solid var(--line); border-radius: 13px; background: linear-gradient(160deg, rgba(255, 252, 247, .76), rgba(244, 233, 218, .3)); }\n.final-record-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }\n.final-record-head h2 { margin-top: 4px; color: var(--paper); font-family: var(--font-display); font-size: 19px; font-weight: 500; }\n.final-record-head .text-btn { display: inline-flex; align-items: center; gap: 5px; }\n.final-record-head .text-btn svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.5; }\n.final-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }\n.final-meta span { padding: 3px 7px; border: 1px solid var(--line); border-radius: 99px; color: var(--muted); font-size: 7.5px; }\n.final-meta span b { color: var(--rose-deep); font-weight: 600; }\n.final-prompt {\n  max-height: 290px;\n  margin-top: 10px;\n  padding: 11px 12px;\n  overflow: auto;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 253, 249, .7);\n  color: #5a4a43;\n  font-family: var(--font-mono), \"Microsoft YaHei\", monospace;\n  font-size: 8.5px;\n  line-height: 1.75;\n  white-space: pre-wrap;\n  word-break: break-word;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.final-prompt::-webkit-scrollbar { width: 4px; }\n.final-prompt::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n\n@container galworld (max-width: 980px) {\n  .page-final { height: clamp(560px, calc(100dvh - 165px), 700px); }\n}\n@container galworld (max-width: 700px) {\n  .final-hero h1 { font-size: 27px; }\n  .final-prompt { max-height: 240px; font-size: 8px; }\n  .final-record { padding: 12px; }\n}\n\n/* ==========================================================================\n   PAGE 05 · THE OPENING (v2)\n   Free input on top, four tabbed sources below.\n   ========================================================================== */\n\n.page-opening-v2 {\n  height: clamp(560px, calc(100dvh - 180px), 700px);\n  min-height: 0;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.opening-v2-scroll {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: clamp(16px, 2.2cqw, 26px) var(--gutter) 18px;\n  scrollbar-width: thin;\n  scrollbar-color: var(--line-strong) transparent;\n}\n.opening-v2-scroll::-webkit-scrollbar { width: 5px; }\n.opening-v2-scroll::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 99px; }\n.opening-v2-scroll::-webkit-scrollbar-track { background: transparent; }\n\n.opening-v2-head {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 16px;\n}\n.opening-v2-head h2 {\n  margin-top: 5px;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: clamp(24px, 2.7cqw, 33px);\n  font-weight: 500;\n  letter-spacing: -.02em;\n}\n.opening-v2-head h2 em { color: var(--rose-deep); font-style: italic; }\n.opening-v2-persona { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; color: var(--muted-2); font-size: 9px; line-height: 1.5; text-align: right; }\n.opening-v2-persona b { color: var(--paper); font-family: var(--font-display); font-size: 11.5px; font-weight: 500; }\n.opening-v2-persona .mini-avatar { width: 26px; height: 26px; font-size: 11px; }\n\n/* Free input first */\n.free-first {\n  margin-top: 12px;\n  padding: 10px 12px 9px;\n  border: 1px solid var(--line);\n  border-radius: 10px;\n  background: linear-gradient(160deg, rgba(255, 252, 247, .8), rgba(244, 233, 218, .28));\n}\n.free-first-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.free-first-count { color: var(--muted-2); font-family: var(--font-mono); font-size: 8.5px; }\n.free-first textarea {\n  width: 100%;\n  min-height: 54px;\n  margin-top: 6px;\n  padding: 6px 8px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  outline: none;\n  background: rgba(255, 253, 249, .8);\n  color: var(--paper);\n  font-family: var(--font-body);\n  font-size: 12px;\n  line-height: 1.75;\n  resize: vertical;\n  transition: border-color .2s;\n}\n.free-first textarea:focus { border-color: rgba(166, 79, 104, .45); }\n.free-first textarea::placeholder { color: var(--muted-2); }\n.free-first-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 7px; color: var(--muted-2); font-size: 9px; }\n.mini-btn { flex: 0 0 auto; padding: 4px 11px; border: 1px solid rgba(166, 79, 104, .38); border-radius: 99px; background: rgba(244, 225, 227, .5); color: var(--rose-deep); font-size: 9.5px; transition: background .2s, border-color .2s; }\n.mini-btn:hover { background: rgba(244, 225, 227, .9); border-color: var(--rose); }\n\n/* Tabs */\n.opening-v2-tabs { display: flex; gap: 6px; margin-top: 12px; }\n.ov2-tab {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: 1 1 0;\n  min-width: 0;\n  padding: 7px 10px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 252, 247, .42);\n  color: var(--muted);\n  transition: border-color .22s, background .22s, color .22s, box-shadow .22s;\n}\n.ov2-tab i { color: var(--muted-2); font-family: var(--font-mono); font-size: 9.5px; font-style: normal; }\n.ov2-tab span { overflow: hidden; font-family: var(--font-display); font-size: 13px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-tab:hover { border-color: rgba(166, 79, 104, .38); color: var(--paper); }\n.ov2-tab.is-active {\n  border-color: rgba(166, 79, 104, .58);\n  background: linear-gradient(155deg, rgba(255, 248, 244, .95), rgba(244, 225, 227, .58));\n  color: var(--rose-deep);\n  box-shadow: 0 8px 18px rgba(95, 62, 48, .09), inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n.ov2-tab.is-active i { color: var(--rose); }\n\n.opening-v2-body { margin-top: 11px; }\n.ov2-panel[hidden] { display: none; }\n.ov2-hint { margin-bottom: 10px; color: var(--muted-2); font-size: 9.5px; line-height: 1.7; }\n.ov2-free-note { padding: 12px; border: 1px dashed var(--line-strong); border-radius: 9px; }\n.ov2-free-note b { color: var(--rose-deep); font-family: var(--font-display); font-size: 13px; font-weight: 500; }\n.ov2-free-note p { margin-top: 5px; color: var(--muted); font-size: 8.5px; line-height: 1.7; }\n.ov2-free-preview { margin-top: 9px; padding: 9px 10px; border-radius: 7px; background: rgba(255, 253, 249, .75); color: var(--muted); font-size: 9px; line-height: 1.8; white-space: pre-wrap; }\n\n/* Work groups */\n.ov2-groups { display: flex; flex-direction: column; gap: 9px; }\n.ov2-group { border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 252, 247, .42); overflow: hidden; }\n.ov2-group-head {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  width: 100%;\n  padding: 7px 10px;\n  border: 0;\n  background: transparent;\n  text-align: left;\n  transition: background .2s;\n}\n.ov2-group-head:hover { background: rgba(255, 252, 247, .7); }\n.ov2-group-cover { flex: 0 0 auto; width: 26px; height: 34px; border-radius: 4px; background-size: cover; background-position: center; box-shadow: 0 2px 7px rgba(60, 40, 30, .18); }\n.ov2-group-copy { min-width: 0; flex: 1 1 auto; }\n.ov2-group-title { display: block; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 13.5px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-group-sub { display: block; overflow: hidden; color: var(--muted-2); font-size: 8.5px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-group-count { flex: 0 0 auto; color: var(--muted-2); font-family: var(--font-mono); font-size: 8.5px; }\n.ov2-group-arrow { flex: 0 0 auto; color: var(--muted-2); transition: transform .25s; }\n.ov2-group.is-open .ov2-group-arrow { transform: rotate(180deg); }\n.ov2-group-arrow svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.6; }\n.ov2-group-body { padding: 0 10px 9px; }\n.ov2-group-body[hidden] { display: none; }\n\n/* Character rows (个人主线) */\n.ov2-chars { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }\n.ov2-char {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  min-width: 0;\n  padding: 5px 7px;\n  border: 1px solid transparent;\n  border-radius: 8px;\n  background: rgba(255, 253, 249, .6);\n  text-align: left;\n  transition: border-color .2s, background .2s, transform .2s;\n}\n.ov2-char:hover { transform: translateY(-1px); border-color: rgba(166, 79, 104, .35); }\n.ov2-char.is-active { border-color: rgba(166, 79, 104, .6); background: rgba(244, 225, 227, .55); }\n.ov2-char-face { flex: 0 0 auto; display: grid; place-items: center; width: 34px; height: 34px; overflow: hidden; border-radius: 50%; background: #241d1a; }\n.ov2-char-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }\n.ov2-char-face b { color: #fff8f2; font-family: var(--font-display); font-size: 12px; }\n.ov2-char-copy { min-width: 0; }\n.ov2-char-name { display: block; overflow: hidden; color: var(--paper); font-size: 11.5px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-char-role { display: block; overflow: hidden; color: var(--muted-2); font-size: 8.5px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-char.is-active .ov2-char-name { color: var(--rose-deep); }\n\n/* Scene cards */\n.ov2-scenes { display: flex; flex-direction: column; gap: 6px; }\n.ov2-scene {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 7px 9px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 253, 249, .62);\n  text-align: left;\n  transition: border-color .2s, background .2s;\n}\n.ov2-scene:hover { border-color: rgba(166, 79, 104, .35); }\n.ov2-scene.is-active { border-color: rgba(166, 79, 104, .6); background: rgba(244, 225, 227, .5); }\n.ov2-scene-index { flex: 0 0 auto; color: var(--rose); font-family: var(--font-mono); font-size: 8.5px; }\n.ov2-scene-copy { min-width: 0; flex: 1 1 auto; }\n.ov2-scene-title { display: block; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 12.5px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-scene-sub { display: block; overflow: hidden; color: var(--muted-2); font-size: 8.5px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-scene.is-active .ov2-scene-title { color: var(--rose-deep); }\n.ov2-scene-tag { flex: 0 0 auto; padding: 1px 6px; border: 1px dashed var(--line-strong); border-radius: 3px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7.5px; }\n\n.ov2-empty { padding: 16px 10px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--muted-2); font-size: 10px; text-align: center; }\n\n.opening-v2-foot {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-top: 12px;\n  padding-top: 11px;\n  border-top: 1px solid var(--line);\n}\n.ov2-picked { min-width: 0; flex: 1 1 auto; overflow: hidden; color: var(--muted-2); font-size: 10px; line-height: 1.6; text-overflow: ellipsis; }\n.ov2-picked b { color: var(--rose-deep); font-weight: 600; }\n.ov2-next { flex: 0 0 auto; min-height: 40px; padding: 0 16px; }\n.ov2-next .btn-begin-label b { font-size: 13px; }\n.ov2-next small { font-size: 5.5px; }\n\n@container galworld (max-width: 980px) {\n  .page-opening-v2 { height: clamp(560px, calc(100dvh - 165px), 700px); }\n  .ov2-chars { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n}\n@container galworld (max-width: 700px) {\n  .opening-v2-head h2 { font-size: 23px; }\n  .opening-v2-tabs { flex-wrap: wrap; }\n  .ov2-tab { flex: 1 1 44%; }\n  .ov2-chars { grid-template-columns: 1fr; }\n  .opening-v2-foot { flex-direction: column; align-items: stretch; }\n  .ov2-next { width: 100%; }\n}\n\n/* Preset library (完全自由) */\n.ov2-preset-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }\n.ov2-preset-head b { color: var(--paper); font-family: var(--font-display); font-size: 13.5px; font-weight: 500; }\n.ov2-preset-head p { margin-top: 3px; color: var(--muted-2); font-size: 9px; line-height: 1.6; }\n.ov2-preset-group { margin-bottom: 10px; }\n.ov2-preset-label { display: block; margin-bottom: 6px; color: var(--muted-2); font-family: var(--font-latin); font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }\n.ov2-preset-label i { color: var(--rose); font-family: var(--font-mono); font-style: normal; }\n.ov2-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }\n.ov2-preset {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  min-width: 0;\n  padding: 8px 10px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 253, 249, .62);\n  text-align: left;\n  transition: border-color .2s, background .2s, transform .2s;\n}\n.ov2-preset:hover { transform: translateY(-1px); border-color: rgba(166, 79, 104, .4); }\n.ov2-preset.is-active { border-color: rgba(166, 79, 104, .6); background: rgba(244, 225, 227, .55); }\n.ov2-preset-name { overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-preset-sub { display: -webkit-box; overflow: hidden; color: var(--muted-2); font-size: 8.5px; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }\n.ov2-preset.is-active .ov2-preset-name { color: var(--rose-deep); }\n.ov2-preset-del {\n  position: absolute;\n  top: 5px;\n  right: 5px;\n  display: grid;\n  place-items: center;\n  width: 15px;\n  height: 15px;\n  border: 0;\n  border-radius: 50%;\n  background: rgba(60, 48, 44, .12);\n  color: var(--muted);\n  font-size: 10px;\n  line-height: 1;\n  opacity: 0;\n  transition: opacity .2s, background .2s;\n}\n.ov2-preset:hover .ov2-preset-del { opacity: 1; }\n.ov2-preset-del:hover { background: rgba(166, 79, 104, .25); color: var(--rose-deep); }\n.ov2-presets-empty { grid-column: 1 / -1; padding: 12px 10px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--muted-2); font-size: 9.5px; text-align: center; }\n\n/* Person route modal */\n.person-modal-head { display: flex; align-items: center; gap: 11px; margin: 10px 0 12px; }\n.person-modal-face {\n  flex: 0 0 auto;\n  display: grid;\n  place-items: center;\n  width: 52px;\n  height: 52px;\n  overflow: hidden;\n  border: 1px solid rgba(166, 79, 104, .35);\n  border-radius: 50%;\n  background: #241d1a;\n  color: #fff8f2;\n  font-family: var(--font-display);\n  font-size: 19px;\n}\n.person-modal-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }\n.person-modal-head h2 { font-size: 20px; }\n.person-modal-sub { margin-top: 3px; color: var(--muted-2); font-size: 9.5px; line-height: 1.6; }\n\n/* Inline editors (完全自由 / 个人主线) */\n.ov2-inline-editor,\n.ov2-route {\n  margin-bottom: 10px;\n  padding: 10px 11px 9px;\n  border: 1px solid rgba(166, 79, 104, .35);\n  border-radius: 9px;\n  background: linear-gradient(160deg, rgba(255, 250, 246, .92), rgba(244, 225, 227, .45));\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n.ov2-inline-editor[hidden],\n.ov2-route[hidden] { display: none; }\n.ov2-inline-field { display: block; margin-bottom: 7px; }\n.ov2-inline-field > span { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; color: var(--muted); font-size: 9.5px; }\n.ov2-inline-field > span i { color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; font-style: normal; }\n.ov2-inline-field input,\n.ov2-inline-field textarea {\n  width: 100%;\n  padding: 6px 8px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  outline: none;\n  background: rgba(255, 253, 249, .9);\n  color: var(--paper);\n  font-family: var(--font-body);\n  font-size: 11px;\n  line-height: 1.7;\n  resize: vertical;\n  transition: border-color .2s;\n}\n.ov2-inline-field input:focus,\n.ov2-inline-field textarea:focus { border-color: rgba(166, 79, 104, .5); }\n.ov2-inline-field input::placeholder,\n.ov2-inline-field textarea::placeholder { color: var(--muted-2); }\n.ov2-inline-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.ov2-inline-note { color: var(--muted-2); font-size: 8.5px; line-height: 1.5; }\n.ov2-inline-actions .text-btn { color: var(--muted-2); }\n\n.ov2-route-head { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }\n.ov2-route-face {\n  flex: 0 0 auto;\n  display: grid;\n  place-items: center;\n  width: 40px;\n  height: 40px;\n  overflow: hidden;\n  border: 1px solid rgba(166, 79, 104, .4);\n  border-radius: 50%;\n  background: #241d1a;\n  color: #fff8f2;\n  font-family: var(--font-display);\n  font-size: 15px;\n}\n.ov2-route-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }\n.ov2-route-copy { min-width: 0; flex: 1 1 auto; }\n.ov2-route-copy b { display: block; color: var(--rose-deep); font-family: var(--font-display); font-size: 14px; font-weight: 500; }\n.ov2-route-copy span { display: block; overflow: hidden; color: var(--muted-2); font-size: 9px; white-space: nowrap; text-overflow: ellipsis; }\n.ov2-route-close { flex: 0 0 auto; width: 20px; height: 20px; border: 0; border-radius: 50%; background: rgba(60, 48, 44, .1); color: var(--muted); font-size: 13px; line-height: 1; }\n.ov2-route-close:hover { background: rgba(166, 79, 104, .22); color: var(--rose-deep); }\n\n/* Opening text box: shows the composed first scene for the current mode */\n.free-first-mode { margin-top: 4px; color: var(--muted-2); font-size: 9px; }\n.free-first-mode b { color: var(--rose-deep); font-weight: 600; }\n\n/* 都市模式 · 都市开局选项 (three stacked rows, collapsible) */\n.city-setup {\n  border: 1px solid var(--line);\n  border-radius: 11px;\n  background: linear-gradient(160deg, rgba(255, 252, 247, .82), rgba(244, 233, 218, .26));\n  overflow: hidden;\n}\n.city-setup-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  width: 100%;\n  padding: 9px 12px;\n  border: 0;\n  background: transparent;\n  text-align: left;\n  transition: background .2s;\n}\n.city-setup-head:hover { background: rgba(255, 253, 249, .7); }\n.city-setup-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.city-setup-title b {\n  overflow: hidden;\n  color: var(--paper);\n  font-family: var(--font-display);\n  font-size: 13px;\n  font-weight: 500;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n.city-setup-chevron { flex: 0 0 auto; color: var(--muted-2); transition: transform .25s; }\n.city-setup-chevron svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.7; }\n.city-setup.is-open .city-setup-chevron { transform: rotate(180deg); }\n.city-setup-body { padding: 0 12px 11px; }\n.city-setup-body[hidden] { display: none; }\n\n/* Work picker (都市模式 ① 选择作品) */\n.free-work-picker { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }\n.free-work {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  min-width: 0;\n  padding: 5px 7px;\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  background: rgba(255, 253, 249, .62);\n  text-align: left;\n  transition: border-color .2s, background .2s, transform .2s;\n}\n.free-work:hover { transform: translateY(-1px); border-color: rgba(166, 79, 104, .38); }\n.free-work.is-active { border-color: rgba(166, 79, 104, .6); background: rgba(244, 225, 227, .5); }\n.free-work-cover { flex: 0 0 auto; width: 20px; height: 26px; border-radius: 3px; background-size: cover; background-position: center; box-shadow: 0 2px 6px rgba(60, 40, 30, .18); }\n.free-work-name { overflow: hidden; color: var(--muted); font-size: 10px; white-space: nowrap; text-overflow: ellipsis; }\n.free-work.is-active .free-work-name { color: var(--rose-deep); }\n\n@container galworld (max-width: 700px) {\n  .free-work-picker { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n}\n\n/* ── 都市模式 (v2.9) ─────────────────────────────────────────── */\n/* The shared top box is hidden while the city mode composes its own opening. */\n.page-opening-v2.is-city .free-first { display: none; }\n\n.city-zone-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.city-zone-tab {\n  position: relative;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  padding: 9px 11px;\n  border: 1px solid var(--line);\n  border-radius: 10px;\n  background: rgba(255, 252, 247, .45);\n  text-align: left;\n  transition: border-color .2s, background .2s, box-shadow .25s, transform .2s;\n}\n.city-zone-tab b { position: relative; z-index: 2; color: var(--paper); font-family: var(--font-display); font-size: 13px; font-weight: 500; }\n.city-zone-tab small { position: relative; z-index: 2; color: var(--muted-2); font-size: 8.5px; line-height: 1.5; }\n.city-zone-tab:hover { transform: translateY(-1px); border-color: rgba(166, 79, 104, .38); }\n.city-zone-tab.is-active {\n  border-color: rgba(166, 79, 104, .6);\n  background: linear-gradient(155deg, rgba(255, 248, 244, .95), rgba(244, 225, 227, .58));\n  box-shadow: 0 10px 22px rgba(95, 62, 48, .1), inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n.city-zone-tab.is-active b { color: var(--rose-deep); }\n\n.city-steps { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }\n.city-step { border: 1px solid var(--line); border-radius: 9px; background: rgba(255, 252, 247, .5); overflow: hidden; }\n.city-step-head {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  width: 100%;\n  padding: 8px 10px;\n  border: 0;\n  background: transparent;\n  text-align: left;\n  transition: background .2s;\n}\n.city-step-head:hover { background: rgba(255, 253, 249, .8); }\n.city-step-no { flex: 0 0 auto; color: var(--rose); font-family: var(--font-mono); font-size: 10px; }\n.city-step-copy { min-width: 0; flex: 1 1 auto; display: flex; flex-direction: column; gap: 1px; }\n.city-step-copy b { color: var(--paper); font-family: var(--font-display); font-size: 12.5px; font-weight: 500; }\n.city-step-copy small { overflow: hidden; color: var(--muted-2); font-size: 9px; white-space: nowrap; text-overflow: ellipsis; }\n.city-step-arrow { flex: 0 0 auto; color: var(--muted-2); transition: transform .25s; }\n.city-step-arrow svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.7; }\n.city-step.is-open .city-step-arrow { transform: rotate(180deg); }\n.city-step-body { padding: 0 10px 9px; }\n.city-step-body[hidden] { display: none; }\n\n.city-chips { display: flex; flex-wrap: wrap; gap: 5px; }\n.city-chip {\n  padding: 4px 9px;\n  border: 1px solid var(--line);\n  border-radius: 99px;\n  background: rgba(255, 253, 249, .8);\n  color: var(--muted);\n  font-size: 9.5px;\n  line-height: 1.5;\n  text-align: left;\n  transition: border-color .18s, background .18s, color .18s;\n}\n.city-chip:hover { border-color: rgba(166, 79, 104, .4); color: var(--paper); }\n.city-chip.is-active { border-color: rgba(166, 79, 104, .62); background: rgba(244, 225, 227, .62); color: var(--rose-deep); }\n.city-free-input { display: block; margin-top: 7px; }\n.city-free-input span { display: block; margin-bottom: 3px; color: var(--muted-2); font-size: 8.5px; }\n.city-free-input input {\n  width: 100%;\n  padding: 5px 8px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  outline: none;\n  background: rgba(255, 253, 249, .9);\n  color: var(--paper);\n  font-family: var(--font-body);\n  font-size: 11px;\n  transition: border-color .2s;\n}\n.city-free-input input:focus { border-color: rgba(166, 79, 104, .45); }\n.city-free-input input::placeholder { color: var(--muted-2); }\n\n.city-first-step {\n  margin-top: 10px;\n  padding: 10px 11px;\n  border: 1px solid rgba(166, 79, 104, .3);\n  border-radius: 10px;\n  background: linear-gradient(160deg, rgba(255, 250, 246, .92), rgba(244, 225, 227, .4));\n}\n.firststep-shell { padding: 14px; }\n.firststep-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-bottom: 10px; }\n.firststep-head b { color: var(--rose-deep); font-family: var(--font-display); font-size: 17px; font-weight: 600; }\n.firststep-head small { display: block; margin-top: 3px; color: var(--muted-2); font-size: 8.5px; }\n.firststep-head #cityStepCount { color: var(--muted-2); font-family: var(--font-mono); font-size: 8px; }\n.firststep-layout { display: grid; grid-template-columns: 155px minmax(0, 1fr); gap: 12px; min-height: 320px; }\n.firststep-side { padding-right: 10px; border-right: 1px solid rgba(166,79,104,.16); }\n.firststep-side-label { display: block; margin-bottom: 6px; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; letter-spacing: .08em; }\n.firststep-cats { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }\n.firststep-cat { display: flex; align-items: center; justify-content: space-between; gap: 5px; padding: 6px 8px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--muted); font-family: inherit; font-size: 9px; text-align: left; cursor: pointer; }\n.firststep-cat em { color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; font-style: normal; }\n.firststep-cat:hover { background: rgba(255,255,255,.55); }\n.firststep-cat.is-active { border-color: rgba(166,79,104,.35); background: rgba(255,248,244,.9); color: var(--rose-deep); font-weight: 700; }\n.firststep-main { min-width: 0; }\n.firststep-toolbar { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; }\n.firststep-toolbar b { color: var(--paper); font-family: var(--font-display); font-size: 13px; }\n.firststep-toolbar #firststepPresetCount { margin-right: auto; color: var(--muted-2); font-family: var(--font-mono); font-size: 7px; }\n.firststep-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; max-height: 168px; overflow-y: auto; padding-right: 3px; }\n.firststep-presets.is-grouped { display: block; max-height: 300px; }\n.firststep-presets.is-grouped .ov2-group + .ov2-group { margin-top: 6px; }\n.firststep-presets .ov2-scene-face { width: 24px; height: 24px; flex: 0 0 auto; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(166,79,104,.08); font-size: 12px; color: var(--rose-deep); }\n.firststep-presets .ov2-scene-face img { width: 100%; height: 100%; object-fit: cover; }\n.firststep-preset { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 7px 8px; border: 1px solid rgba(166,79,104,.14); border-radius: 8px; background: rgba(255,252,247,.55); color: var(--muted); text-align: left; cursor: pointer; }\n.firststep-preset:hover { border-color: rgba(166,79,104,.35); background: rgba(255,248,244,.9); }\n.firststep-preset.is-active { border-color: var(--rose); background: rgba(255,244,240,.95); }\n.firststep-preset-copy { min-width: 0; flex: 1 1 auto; }\n.firststep-preset b { display: block; overflow: hidden; color: var(--paper); font-family: var(--font-display); font-size: 10.5px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }\n.firststep-preset-face { display: grid; place-items: center; width: 26px; height: 26px; flex: 0 0 auto; overflow: hidden; border-radius: 50%; background: rgba(166,79,104,.1); color: var(--rose-deep); font-size: 10px; font-weight: 700; }\n.firststep-preset-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 22%; }\n.firststep-editor { margin-top: 8px; padding: 8px; border: 1px solid rgba(166,79,104,.16); border-radius: 9px; background: rgba(255,255,255,.35); }\n.firststep-shell .firststep-editor textarea { width: 100%; min-height: 132px; padding: 5px 2px; border: 0; border-bottom: 1px solid transparent; outline: none; background: transparent; color: var(--paper); font-family: var(--font-body); font-size: 12px; line-height: 1.7; resize: vertical; }\n.firststep-editor textarea:focus { border-bottom-color: rgba(166,79,104,.4); }\n.firststep-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 5px; }\n@media (max-width: 700px) { .firststep-layout { grid-template-columns: 1fr; } .firststep-side { padding-right: 0; border-right: 0; border-bottom: 1px solid rgba(166,79,104,.16); padding-bottom: 8px; } .firststep-cats { flex-direction: row; overflow-x: auto; max-height: none; } .firststep-presets { grid-template-columns: 1fr; max-height: 160px; } }\n.city-first-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }\n.city-first-head b { color: var(--rose-deep); font-family: var(--font-display); font-size: 13px; font-weight: 500; }\n.city-first-head span { color: var(--muted-2); font-family: var(--font-mono); font-size: 8.5px; }\n.city-first-step textarea {\n  width: 100%;\n  min-height: 52px;\n  padding: 6px 8px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  outline: none;\n  background: rgba(255, 253, 249, .92);\n  color: var(--paper);\n  font-family: var(--font-body);\n  font-size: 12px;\n  line-height: 1.75;\n  resize: vertical;\n  transition: border-color .2s;\n}\n.city-first-step textarea:focus { border-color: rgba(166, 79, 104, .5); }\n.city-first-step textarea::placeholder { color: var(--muted-2); }\n.city-first-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 7px; }\n\n@container galworld (max-width: 700px) {\n  .city-zone-tabs { grid-template-columns: 1fr; }\n}\n\n/* 都市模式 v3：区卡封面、入学区域角色卡、底部按钮迁移 */\n.page-opening-v2.is-city .opening-v2-foot .ov2-next { display: none; }\n.page-opening-v2.is-city .opening-v2-foot { justify-content: center; }\n\n\n\n.city-area-hint { margin-bottom: 8px; color: var(--muted-2); font-size: 9px; line-height: 1.6; }\n.city-area-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.city-area-card {\n  display: flex;\n  flex-direction: column;\n  gap: 7px;\n  min-width: 0;\n  padding: 9px 10px;\n  border: 1px solid var(--line);\n  border-radius: 10px;\n  background: rgba(255, 252, 247, .58);\n  text-align: left;\n  transition: border-color .2s, background .2s, box-shadow .25s, transform .2s;\n}\n.city-area-card:hover { transform: translateY(-1px); border-color: rgba(166, 79, 104, .4); }\n.city-area-card.is-active {\n  border-color: rgba(166, 79, 104, .62);\n  background: linear-gradient(160deg, rgba(255, 248, 244, .95), rgba(244, 225, 227, .55));\n  box-shadow: 0 10px 22px rgba(95, 62, 48, .1), inset 0 1px 0 rgba(255, 255, 255, .8);\n}\n.city-area-card-head { display: flex; flex-direction: column; gap: 2px; }\n.city-area-card-head b { color: var(--paper); font-family: var(--font-display); font-size: 13px; font-weight: 500; }\n.city-area-card-head small { color: var(--muted-2); font-size: 8px; line-height: 1.5; }\n.city-area-card.is-active .city-area-card-head b { color: var(--rose-deep); }\n.city-area-works { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }\n.city-area-work {\n  display: grid;\n  grid-template-columns: 20px minmax(0, 1fr);\n  gap: 5px;\n  align-items: center;\n  padding: 5px 6px;\n  border: 1px solid var(--line);\n  border-radius: 7px;\n  background: rgba(255, 253, 249, .65);\n}\n.city-area-cover { width: 20px; height: 27px; border-radius: 3px; background-size: cover; background-position: center; box-shadow: 0 2px 5px rgba(60, 40, 30, .15); }\n.city-area-work-copy { min-width: 0; }\n.city-area-work-copy b { display: block; overflow: hidden; color: var(--muted); font-size: 8.5px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }\n.city-area-work-copy small { display: block; color: var(--muted-2); font-size: 7px; }\n.city-area-avatars { grid-column: 1 / -1; display: flex; align-items: center; margin-top: 2px; }\n.city-area-avatar {\n  display: grid;\n  place-items: center;\n  width: 20px;\n  height: 20px;\n  overflow: hidden;\n  border: 1px solid rgba(255, 250, 244, .8);\n  border-radius: 50%;\n  background: #241d1a;\n  color: #fff8f2;\n  font-family: var(--font-display);\n  font-size: 8px;\n  margin-left: -5px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, .16);\n}\n.city-area-avatar:first-child { margin-left: 0; }\n.city-area-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }\n.city-area-card.is-active .city-area-avatar { border-color: rgba(166, 79, 104, .55); }\n.city-area-empty { grid-column: 1 / -1; padding: 10px; border: 1px dashed var(--line-strong); border-radius: 7px; color: var(--muted-2); font-size: 8.5px; text-align: center; }\n.city-decide { flex: 0 0 auto; }\n\n@container galworld (max-width: 700px) {\n  .city-area-grid { grid-template-columns: 1fr; }\n  .city-area-works { grid-template-columns: 1fr; }\n}\n\n/* 大校园区：多部作品封面渐隐轮播 */\n.city-zone-slides { position: absolute; inset: 0; z-index: 0; overflow: hidden; }\n.city-zone-slide {\n  position: absolute;\n  inset: 0;\n  background-size: cover;\n  background-position: center;\n  opacity: 0;\n  animation: cityZoneFade 36s linear infinite;\n  will-change: opacity;\n}\n.city-zone-tab[data-city-zone=\"campus\"]::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  z-index: 1;\n  background: linear-gradient(100deg, rgba(255, 251, 244, .94) 0%, rgba(255, 248, 244, .62) 45%, rgba(255, 248, 244, .22) 100%);\n}\n.city-zone-tab[data-city-zone=\"campus\"].is-active::after {\n  background: linear-gradient(100deg, rgba(255, 248, 244, .94) 0%, rgba(252, 235, 235, .6) 45%, rgba(244, 225, 227, .2) 100%);\n}\n@keyframes cityZoneFade {\n  0% { opacity: 0; }\n  2% { opacity: .6; }\n  9% { opacity: .6; }\n  11% { opacity: 0; }\n  100% { opacity: 0; }\n}\n\n/* 身份不再折叠 */\n.city-step-static .city-step-head { cursor: default; }\n.city-step-static .city-step-arrow { display: none; }\n.city-step-static .city-step-head:hover { background: transparent; }\n\n/* ==========================================================================\n   TAVERN EMBED LAYER\n   ========================================================================== */\n:host {\n  display: block;\n  width: 100%;\n  max-width: 100%;\n  margin: 0;\n  padding: 0;\n  text-align: left;\n  color-scheme: light;\n}\n.gw-app {\n  position: relative;\n  width: 100%;\n  max-width: 100%;\n  margin: 0 auto;\n  overflow: clip;\n  border-radius: 26px;\n  container-type: inline-size;\n  container-name: galworld;\n  isolation: isolate;\n  scroll-margin-top: 84px;\n  background-color: var(--ink-0);\n  box-shadow: 0 28px 70px rgba(77, 51, 37, .16);\n}\n.gw-app::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  pointer-events: none;\n}\n.gw-app .ambient {\n  position: absolute;\n  inset: 0;\n  z-index: 1;\n  overflow: hidden;\n  border-radius: inherit;\n}\n.gw-app .site-header,\n.gw-app .app-main {\n  position: relative;\n  z-index: 2;\n}\n.gw-app .site-header {\n  position: sticky;\n  top: 0;\n  z-index: 70;\n}\n.gw-app { background-attachment: scroll; }\n.gw-app .page { min-height: 0; }\n.gw-app .home-hero {\n  min-height: 630px;\n  gap: clamp(24px, 3.6cqw, 54px);\n  padding-top: clamp(34px, 5vw, 70px);\n  padding-bottom: clamp(44px, 7vw, 92px);\n}\n.gw-app .home-index { padding-top: clamp(48px, 7vw, 90px); }\n.gw-app .hero-title { font-size: clamp(48px, 6.4cqw, 76px); }\n.gw-app .title-soft { margin-left: clamp(12px, 3.2cqw, 48px); }\n.gw-app .page-title { font-size: clamp(34px, 4.8cqw, 64px); }\n.gw-app .launch-result { display: flex; flex-direction: column; }\n.gw-app .launch-result-top { order: 0; }\n.gw-app .result-seal { order: 1; }\n.gw-app .result-kicker { order: 2; }\n.gw-app .launch-result h2 { order: 3; }\n.gw-app .result-actions { order: 4; margin-top: 18px; }\n.gw-app .result-dossier { order: 5; margin-top: 19px; }\n.gw-app .site-header { background: var(--gw-header, rgba(247, 242, 234, .82)); }\n.gw-app .modal-layer { z-index: 9998; }\n.gw-app .launch-layer { z-index: 9999; }\n.gw-app .toast-region { z-index: 10000; }\n.gw-boot-error {\n  margin: 20px;\n  padding: 22px;\n  border: 1px solid #d7b8bd;\n  border-radius: 14px;\n  background: #fffaf3;\n  color: #392a28;\n  font-family: \"Noto Sans SC\", \"Microsoft YaHei\", sans-serif;\n}\n.gw-boot-error b { font-size: 16px; }\n.gw-boot-error p { margin: 8px 0 0; font-size: 12px; line-height: 1.8; }\n\n@container galworld (max-width: 980px) {\n  .gw-app .home-hero { min-height: 0; }\n}\n@container galworld (max-width: 380px) {\n  .gw-app .hero-title { font-size: 39px; }\n}\n@container galworld (max-width: 360px) {\n  .gw-app .nav-shell { padding-inline: 8px; gap: 4px; }\n  .gw-app .brand-type { display: none; }\n  .gw-app .brand-mark { width: 25px; height: 25px; }\n  .gw-app .nav-link { flex: 1 1 0; min-width: 0; padding-inline: 1px; }\n  .gw-app .nav-cn { font-size: 10px; }\n  .gw-app .eyebrow { letter-spacing: .1em; }\n}\n\n/* === 字号放大与交互补丁 === */\n.gw-app .micro-label { font-size: 11px; }\n.gw-app .nav-num { font-size: 10px; }\n.gw-app .nav-meta { font-size: 11px; }\n.gw-app .autosave-pill { font-size: 11.5px; }\n.gw-app .text-btn { font-size: 12px; }\n.gw-app .toast { font-size: 13px; }\n.gw-app .app-marquee .marquee-track span, .gw-app .page-home .home-marquee .marquee-track span { font-size: 11.5px; }\n\n.gw-app .home-work-count { font-size: 11px; }\n.gw-app .home-wall.is-collapsed .home-work-count { font-size: 10.5px; }\n.gw-app .home-collapsed-hint, .gw-app .home-wall-hint, .gw-app .home-wall-toggle { font-size: 11px; }\n.gw-app .home-filter-bar .filter-chip { font-size: 11px; min-height: 28px; }\n.gw-app .home-filter-bar .filter-chip span { font-size: 10px; }\n.gw-app .home-work-index { font-size: 10px; }\n.gw-app .home-work-state { font-size: 9.5px; }\n.gw-app .home-work-title { font-size: 14px; }\n.gw-app .home-work-meta { font-size: 10px; }\n.gw-app .home-wall.is-collapsed .home-work-title { font-size: 11px; }\n.gw-app .home-detail-index, .gw-app .home-detail-back { font-size: 11px; }\n.gw-app .home-detail .detail-cover-caption { font-size: 10px; }\n.gw-app .home-detail .detail-tagline { font-size: 13.5px; }\n.gw-app .home-detail .detail-intro { font-size: 13px; }\n.gw-app .home-detail .detail-meta { font-size: 11.5px; }\n.gw-app .home-detail .detail-tags span { font-size: 11px; }\n.gw-app .home-cast-block-head > span:last-child { font-size: 11px; }\n.gw-app .cast-kicker { font-size: 11px; }\n.gw-app .cast-role { font-size: 12px; }\n.gw-app .cast-bio { font-size: 13.5px; }\n.gw-app .cast-tags span { font-size: 11px; }\n.gw-app .cast-chip span { font-size: 12px; }\n.gw-app .home-gate-kicker, .gw-app .home-gate-hint { font-size: 11px; }\n\n.gw-app .page-archive .search-box input { font-size: 13px; }\n.gw-app .page-archive .filter-chip { font-size: 11.5px; }\n.gw-app .page-archive .filter-chip span { font-size: 10px; }\n.gw-app .page-archive .library-title { font-size: 11px; }\n.gw-app .page-archive .work-card-index { font-size: 10px; }\n.gw-app .page-archive .work-card-title { font-size: 13px; }\n.gw-app .page-archive .work-card-sub { font-size: 10px; }\n.gw-app .page-archive .work-card-plot { font-size: 10px; }\n.gw-app .page-archive .work-card-bottom { padding-right: 88px; }\n\n.gw-app .console-mode-sub { font-size: 10.5px; }\n.gw-app .console-mode-note { font-size: 12px; }\n.gw-app .console-box-hint, .gw-app .console-collapse-btn { font-size: 11px; }\n.gw-app .console-warning { font-size: 12px; }\n.gw-app .console-work-title { font-size: 12.5px; }\n.gw-app .console-work-tag, .gw-app .console-work-index { font-size: 10px; }\n.gw-app .console-empty { font-size: 12px; }\n.gw-app .console-empty b { font-size: 14px; }\n.gw-app .console-foot-note { font-size: 11px; }\n.gw-app .proto-work { font-size: 11px; }\n.gw-app .proto-state { font-size: 10.5px; }\n.gw-app .proto-name { font-size: 14px; }\n.gw-app .proto-mode { font-size: 11.5px; }\n\n.gw-app .persona-v2-desc { font-size: 13px; }\n.gw-app .persona-v2-note-inline { font-size: 13px; }\n.gw-app .persona-companion-bar { font-size: 13.5px; }\n.gw-app .page-persona .persona-tab span { font-size: 15px; }\n.gw-app .page-persona .persona-tab small { font-size: 10px; }\n.gw-app .page-persona .pfield-label { font-size: 13.5px; }\n.gw-app .page-persona .pfield-label i { font-size: 11.5px; }\n.gw-app .pfield-toggle p, .gw-app .p-switch b { font-size: 11.5px; }\n.gw-app .role-tab, .gw-app .role-note, .gw-app .role-name, .gw-app .role-picked { font-size: 11.5px; }\n.gw-app .role-work { font-size: 10px; }\n.gw-app .persona-v2-actions .btn-save { font-size: 12px; min-height: 34px; }\n.gw-app .pp-kicker, .gw-app .pp-mode, .gw-app .pp-tags span, .gw-app .pp-note { font-size: 10.5px; }\n.gw-app .pp-meta, .gw-app .pp-cross, .gw-app .pp-completion { font-size: 11.5px; }\n.gw-app .pp-bio { font-size: 12px; }\n.gw-app .bond-intro b { font-size: 16px; }\n.gw-app .bond-intro p, .gw-app .bond-empty { font-size: 13px; color: var(--muted); line-height: 1.65; }\n.gw-app .bond-cat { font-size: 13px; padding: 6px 12px; }\n.gw-app .bond-cat em { font-size: 11px; }\n.gw-app .bond-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }\n.gw-app .bond-card { min-height: 120px; padding: 10px; gap: 10px; cursor: pointer; transition: border-color .2s, background .2s, transform .18s; }\n.gw-app .bond-card:hover { border-color: rgba(166,79,104,.38); }\n.gw-app .bond-card-portrait .bond-face { width: 62px; height: 84px; border-radius: 8px; }\n.gw-app .bond-card-work { font-size: 11px; }\n.gw-app .bond-card-name { font-size: 15px; }\n.gw-app .bond-card-fields { gap: 5px; margin-top: 6px; }\n.gw-app .bond-card-fields .bond-input { font-size: 13px; padding: 4px 7px; }\n.gw-app .bond-input:disabled { opacity: .78; }\n.gw-app .bond-card:not(.is-active) .bond-input { pointer-events: none; }\n.gw-app .bond-card .bond-pick { font-size: 11px; padding: 3px 9px; margin-top: 6px; border-radius: 6px; }\n\n.gw-app .opening-v2-persona { font-size: 11.5px; }\n.gw-app .opening-v2-persona b { font-size: 13.5px; }\n.gw-app .free-first-count, .gw-app .free-first-mode, .gw-app .free-first-foot { font-size: 12px; }\n.gw-app .free-first textarea { font-size: 13.5px; }\n.gw-app .mini-btn { font-size: 12px; padding: 5px 12px; }\n.gw-app .ov2-tab i { font-size: 11.5px; }\n.gw-app .ov2-tab span { font-size: 14px; }\n.gw-app .ov2-hint { font-size: 12px; }\n.gw-app .ov2-group-sub, .gw-app .ov2-group-count, .gw-app .ov2-char-role, .gw-app .ov2-scene-sub, .gw-app .ov2-preset-sub { font-size: 11.5px; }\n.gw-app .ov2-char-name, .gw-app .ov2-scene-title, .gw-app .ov2-preset-name { font-size: 13.5px; }\n.gw-app .ov2-scene-tag { font-size: 10.5px; }\n.gw-app .ov2-picked { font-size: 12.5px; }\n.gw-app .ov2-inline-field > span, .gw-app .ov2-inline-note, .gw-app .ov2-route-copy span { font-size: 11.5px; }\n.gw-app .ov2-inline-field input, .gw-app .ov2-inline-field textarea { font-size: 13px; }\n.gw-app .city-zone-tab small, .gw-app .city-step-copy small, .gw-app .city-area-hint, .gw-app .city-area-card-head small { font-size: 11px; }\n.gw-app .city-chip { font-size: 12px; }\n.gw-app .city-free-input span { font-size: 11px; }\n.gw-app .city-free-input input { font-size: 13px; }\n.gw-app .city-area-work-copy b { font-size: 11px; }\n.gw-app .city-area-work-copy small { font-size: 10px; }\n.gw-app .firststep-head b { font-size: 18px; }\n.gw-app .firststep-head small { font-size: 12px; }\n.gw-app .firststep-head #cityStepCount { font-size: 11.5px; }\n.gw-app .firststep-side-label { font-size: 11px; }\n.gw-app .firststep-cat { font-size: 12.5px; }\n.gw-app .firststep-cat em { font-size: 11px; }\n.gw-app .firststep-toolbar b { font-size: 15px; }\n.gw-app .firststep-toolbar #firststepPresetCount { font-size: 11.5px; }\n.gw-app .firststep-presets { max-height: 210px; }\n.gw-app .firststep-presets.is-grouped { max-height: 380px; }\n.gw-app .firststep-preset b { font-size: 13px; white-space: normal; line-height: 1.35; }\n.gw-app .firststep-preset-faces { display: flex; align-items: center; flex: 0 0 auto; }\n.gw-app .firststep-preset-faces .firststep-preset-face { width: 22px; height: 22px; margin-left: -7px; border: 1.5px solid #fffaf4; box-shadow: 0 1px 4px rgba(0,0,0,.18); }\n.gw-app .firststep-preset-faces .firststep-preset-face:first-child { margin-left: 0; }\n.gw-app .firststep-shell .firststep-editor textarea { font-size: 14px; }\n.gw-app .firststep-actions .ov2-inline-note { font-size: 11.5px; }\n\n.gw-app .final-lede { font-size: 13px; }\n.gw-app .final-status { font-size: 12px; }\n.gw-app .final-meta span { font-size: 11.5px; }\n.gw-app .final-prompt { font-size: 13px; }\n.gw-app .final-begin small { font-size: 10px; }\n\n@container galworld (max-width: 700px) {\n  .gw-app .bond-list { grid-template-columns: 1fr; }\n}\n.gw-app .companion-box { margin: 0 0 12px; padding: 10px 12px; border: 1px solid rgba(166,79,104,.22); border-radius: 9px; background: linear-gradient(160deg, rgba(255,252,247,.78), rgba(244,225,227,.32)); }\n.gw-app .companion-box-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.gw-app .companion-box-title { display: inline-flex; align-items: center; gap: 7px; color: var(--paper); font-family: var(--font-display); font-size: 13.5px; font-weight: 600; }\n.gw-app .companion-box-count { padding: 1px 8px; border: 1px solid rgba(166,79,104,.3); border-radius: 99px; background: rgba(166,79,104,.1); color: var(--rose-deep); font-family: var(--font-mono); font-size: 11px; font-weight: 600; }\n.gw-app .companion-box-actions { display: inline-flex; align-items: center; gap: 6px; }\n.gw-app .companion-clear-btn { padding: 2px 9px; border: 1px solid rgba(166,79,104,.24); border-radius: 99px; background: rgba(255,255,255,.65); color: var(--muted); font-size: 11px; cursor: pointer; transition: border-color .2s, color .2s, background .2s; }\n.gw-app .companion-clear-btn:hover { border-color: var(--rose); color: var(--rose-deep); background: rgba(255,244,240,.95); }\n.gw-app .companion-empty { margin-top: 6px; color: var(--muted-2); font-size: 12px; line-height: 1.5; }\n.gw-app .companion-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }\n.gw-app .companion-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; padding: 3px 6px 3px 3px; border: 1px solid rgba(166,79,104,.32); border-radius: 99px; background: rgba(255,252,247,.92); box-shadow: 0 2px 6px rgba(95,62,48,.06); }\n.gw-app .companion-chip-main { display: inline-flex; align-items: center; gap: 6px; min-width: 0; padding: 0; text-align: left; cursor: pointer; }\n.gw-app .companion-chip-face { display: grid; place-items: center; width: 24px; height: 24px; flex: 0 0 auto; overflow: hidden; border-radius: 50%; background: rgba(166,79,104,.14); color: var(--rose-deep); font-size: 11px; font-weight: 700; }\n.gw-app .companion-chip-face img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; }\n.gw-app .companion-chip-copy { display: inline-flex; align-items: baseline; gap: 5px; min-width: 0; }\n.gw-app .companion-chip-copy b { color: var(--paper); font-family: var(--font-display); font-size: 12.5px; font-weight: 600; white-space: nowrap; }\n.gw-app .companion-chip-copy small { overflow: hidden; max-width: 110px; color: var(--rose-deep); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }\n.gw-app .companion-chip-del { display: grid; place-items: center; width: 18px; height: 18px; flex: 0 0 auto; border-radius: 50%; background: rgba(166,79,104,.12); color: var(--muted); font-size: 12px; line-height: 1; cursor: pointer; transition: background .18s, color .18s; }\n.gw-app .companion-chip-del:hover { background: var(--rose); color: #fff; }\n.gw-app .grain { display: none !important; animation: none !important; }\n.gw-app .ambient-orb { animation: none !important; filter: none !important; mix-blend-mode: normal !important; opacity: .7; }\n.gw-app .site-header { background: #faf4ea !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }\n.gw-app .work-card-state, .gw-app .home-work-state, .gw-app .page-archive .work-card-check, .gw-app .toast, .gw-app .float-card { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }\n.gw-app .home-work-state { background: rgba(9, 11, 16, .65); }\n.gw-app .page-archive .work-card-check { background: rgba(9, 11, 16, .68); }\n@container galworld (max-width: 700px) {\n  .gw-app { border-radius: 16px; }\n  .gw-app .ambient-grid, .gw-app .ambient-orb { display: none; }\n  .gw-app .page-home, .gw-app .page-archive, .gw-app .page-console-v2, .gw-app .page-persona-v2, .gw-app .page-opening-v2, .gw-app .page-final { height: auto; overflow: visible; }\n  .gw-app .home-scroll, .gw-app .page-archive .archive, .gw-app .console-v2-scroll, .gw-app .persona-v2-scroll, .gw-app .opening-v2-scroll, .gw-app .final-scroll { overflow: visible; padding-inline: 12px; }\n  .gw-app .home-gate { align-items: start; padding-top: 72px; backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(50, 32, 36, .42); }\n  .gw-app .home-wall-title-row { flex-direction: column; align-items: stretch; gap: 6px; }\n  .gw-app .home-wall-tools { justify-content: space-between; }\n  .gw-app .console-box-head { flex-wrap: wrap; align-items: center; }\n  .gw-app .console-box-protagonist { height: auto; }\n  .gw-app .console-box-protagonist .console-box-grid { overflow: visible; grid-template-columns: minmax(0, 1fr); }\n  .gw-app .console-box-story .console-box-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .gw-app .proto-portrait { width: 58px; height: 78px; }\n  .gw-app .proto-mode { font-size: 10.5px; padding: 5px 2px; }\n  .gw-app .persona-v2-head { flex-direction: column; align-items: flex-start; gap: 8px; }\n  .gw-app .persona-tabs { flex-wrap: wrap; }\n  .gw-app .opening-v2-head { flex-wrap: wrap; gap: 8px; }\n  .gw-app .city-zone-slides { display: none; }\n  .gw-app .firststep-shell { padding: 10px; overflow: hidden; }\n  .gw-app .firststep-head { flex-wrap: wrap; gap: 6px; }\n  .gw-app .firststep-head #cityStepCount { flex: 0 0 auto; white-space: nowrap; }\n  .gw-app .firststep-layout { grid-template-columns: minmax(0, 1fr); min-height: 0; gap: 10px; }\n  .gw-app .firststep-side { min-width: 0; padding: 0 0 8px; border-right: 0; border-bottom: 1px solid rgba(166,79,104,.16); }\n  .gw-app .firststep-cats { flex-direction: row; flex-wrap: nowrap; overflow-x: auto; max-height: none; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }\n  .gw-app .firststep-cat { flex: 0 0 auto; white-space: nowrap; padding: 5px 10px; }\n  .gw-app .firststep-main { min-width: 0; }\n  .gw-app .firststep-toolbar { flex-wrap: wrap; gap: 6px; }\n  .gw-app .firststep-presets { grid-template-columns: minmax(0, 1fr); max-height: 240px; padding-right: 0; }\n  .gw-app .firststep-preset { overflow: hidden; gap: 8px; }\n  .gw-app .firststep-preset-copy { min-width: 0; flex: 1 1 auto; }\n  .gw-app .firststep-preset-faces { flex: 0 0 auto; max-width: 84px; }\n  .gw-app .firststep-preset-faces .firststep-preset-face { width: 20px; height: 20px; margin-left: -8px; }\n  .gw-app .firststep-actions { flex-wrap: wrap; gap: 8px; }\n  .gw-app .ov2-presets { grid-template-columns: minmax(0, 1fr); }\n  .gw-app .final-record-head { flex-wrap: wrap; }\n}\n@container galworld (max-width: 620px) {\n  :host, .gw-app { --header-h: 60px; }\n  .gw-app .nav-shell { padding-inline: 8px; gap: 4px; height: 60px; }\n  .gw-app .brand-mark { width: 24px; height: 24px; }\n  .gw-app .nav-link { flex: 1 1 0; min-width: 0; padding: 0 2px; }\n  .gw-app .nav-cn { font-size: 11.5px; letter-spacing: 0; }\n  .gw-app .nav-glider { top: 8px; bottom: 8px; }\n  .gw-app .page-archive .work-card-bottom { padding-right: 0; }\n  .gw-app .page-archive .work-card-flags { top: 7px; right: 7px; bottom: auto; }\n  .gw-app .home-detail .detail-hero { grid-template-columns: 96px minmax(0, 1fr); gap: 12px; }\n  .gw-app .home-detail .detail-cover { max-width: 96px; }\n  .gw-app .persona-tab { padding: 6px 8px; }\n  .gw-app .persona-tab small { display: none; }\n}\n" + `
.gw-app .bgm-btn {
  display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto;
  height: 28px; padding: 0 11px;
  border: 1px solid var(--line); border-radius: 999px;
  background: rgba(255, 252, 247, .65); color: var(--muted);
  font-size: 11px; white-space: nowrap;
  transition: border-color .2s, color .2s, background .2s;
}
.gw-app .bgm-btn:hover { border-color: var(--rose); color: var(--rose-deep); }
.gw-app .bgm-btn i { font-style: normal; font-size: 12px; }
.gw-app .bgm-btn[aria-pressed="true"] {
  border-color: rgba(166, 79, 104, .5);
  background: rgba(244, 225, 227, .75);
  color: var(--rose-deep);
}
.gw-app .bgm-btn.is-blocked { border-color: var(--rose); color: var(--rose-deep); }
`;
  const GAL_DATA = {
  "stats": {
    "works": 22,
    "heroines": 110,
    "academies": 22,
    "year": 2018
  },
  "homeQuotes": [
    "二十二部作品，一夜灯；故事从你推门开始。",
    "先别急着选择。听一听这座城在说什么。",
    "没说完的话，都留到下一次见面。",
    "二〇一八年，春天来得慢，但确实来了。"
  ],
  "identitySuggestions": [
    "刚转来的旁听生",
    "寄宿宿舍的新住客",
    "学园祭执行委员",
    "地方报纸的见习记者",
    "临时顶班的后厨帮工",
    "被指名的新干事",
    "走错校门的校外生",
    "来城里找人的旅人"
  ],
  "traits": [
    "克制",
    "慢热",
    "嘴硬心软",
    "观察者",
    "行动派",
    "爱操心",
    "不合群",
    "好奇心重",
    "记仇",
    "容易脸红",
    "夜行性",
    "擅长倾听"
  ],
  "genericOpenings": [
    {
      "id": "gen-transfer",
      "title": "转学第一天",
      "place": "新学校 · 教室",
      "time": "四月 · 清晨",
      "mood": "陌生、轻微的心跳",
      "text": "教室的门在你面前打开，几十双眼睛一起抬起来。班主任在黑板上写下你的名字，粉笔灰落在袖口。你被安排在靠窗的最后一个座位，桌面上有一道旧刻痕，像是上一个人留下的。前排的女生回头，小声告诉你课本在第几页；窗外的樱花刚开，风一吹，整间教室都是花的味道。你坐下，把书包放进桌肚，听见自己的心跳。",
      "group": "学园"
    },
    {
      "id": "gen-rooftop",
      "title": "雨天的天台",
      "place": "教学楼 · 天台",
      "time": "六月 · 午后",
      "mood": "潮湿、安静",
      "text": "雨从午休开始下，到放学也没停。你推开天台的门，铁门轴响了一声。屋檐下已经站了一个人，校服外套搭在栏杆上，手里拿着一罐没开的咖啡。她看见你，往旁边挪了半步，空出一块干的地方。雨点打在积水里，一圈一圈。你们谁都没说话，直到上课铃响，她才把咖啡递过来：「下次记得带伞。」雨声把楼下的操场填满了。",
      "group": "日常"
    },
    {
      "id": "gen-store",
      "title": "便利店夜班",
      "place": "街角 · 便利店",
      "time": "深夜 · 两点",
      "mood": "冷白灯光、困倦",
      "text": "凌晨两点的便利店只剩冷柜的嗡嗡声。你站在收银台后面，把货架上的饭团一排排摆正。自动门开了一次，进来的是个穿校服的女生，头发湿着，买了一罐热咖啡和一包烟——烟放在柜台上，她又推回去：「算了。」结账时她抬头看你，眼睛很红，说：「你也是这个学校的吧。」你把找零递过去，她没有接稳，硬币滚到地上。",
      "group": "都市"
    },
    {
      "id": "gen-club",
      "title": "社团招新",
      "place": "校庭 · 招新摊位",
      "time": "四月 · 午后",
      "mood": "喧闹、纸牌与饼干",
      "text": "校庭两侧摆满了桌子，纸牌上写着社团名字，风一吹就倒。有人塞给你一张传单，有人直接往你手里塞饼干。你从人群里挤过去，看见角落有一张桌子，只有一个人坐在后面，桌上摆着一本翻旧了的册子。她不招呼人，只在你停下的时候抬头：「要看看吗？人不多，但还在。」风吹过来，册子翻到一页空白，她伸手按住。",
      "group": "学园"
    },
    {
      "id": "gen-morning",
      "title": "合租公寓的早晨",
      "place": "公寓 · 厨房",
      "time": "清晨 · 七点",
      "mood": "面包、咖啡与拖鞋声",
      "group": "日常",
      "text": "烤箱发出「叮」的一声，你从沙发上坐起来，身上还盖着昨晚的薄毯。厨房里有人把吐司翻面，黄油在平底锅里化开；另一个人踩着拖鞋从走廊尽头探出头，头发还没梳。窗外的城市刚亮，桌上的杯子冒着白气。今天的第一句话，从谁开始？"
    },
    {
      "id": "gen-library",
      "title": "闭馆前的图书馆",
      "place": "学校 · 图书馆",
      "time": "傍晚 · 闭馆前",
      "mood": "纸页、夕阳、压低的声音",
      "group": "学园",
      "text": "广播已经开始提醒闭馆，书架之间只剩零星几个人。你把最后一本书推回原位，回头看见靠窗的桌子旁还坐着一个人，笔尖停在纸上，夕阳把她的侧脸压成一条金边。她发现你在看，合上书：「这本，你要先借吗？」"
    },
    {
      "id": "gen-station",
      "title": "雨夜的站台",
      "place": "车站 · 站台",
      "time": "夜里 · 末班车前",
      "mood": "雨、霓虹、湿掉的鞋",
      "group": "都市",
      "text": "雨从傍晚下到现在，站台的顶棚挡不住斜进来的水。末班车还有十分钟，电子屏上的时间一跳一跳。你旁边的人把包抱在胸前，校服袖口湿了一截；她抬头看了看雨，又看了看你：「你也没带伞？」"
    },
    {
      "id": "gen-festival",
      "title": "校园祭的摊位",
      "place": "校园 · 中庭",
      "time": "秋日 · 校园祭",
      "mood": "纸灯、糖味、热闹",
      "group": "学园",
      "text": "中庭的摊位一间挨着一间，纸灯在风里晃，空气里全是糖和酱汁的味道。你守着自家社团的摊子，纸牌被风吹得翻过去。一个女生停在摊前，手指在桌面上敲了两下：「这个，怎么卖？」她身后还有人喊她，她没回头。"
    },
    {
      "id": "gen-cafe",
      "title": "咖啡馆的靠窗座",
      "place": "街角 · 咖啡馆",
      "time": "午后 · 三点",
      "mood": "咖啡、雨声、旧唱片",
      "group": "都市",
      "text": "雨把玻璃窗糊成一片灰，咖啡馆里放着旧的爵士唱片。你坐在靠窗的位置，杯子里的拉花已经散了一半。门口的风铃响了一声，一个人收伞进来，在离你不远的地方坐下；她点单时声音很轻，像怕打扰谁。"
    },
    {
      "id": "gen-seaside",
      "title": "放学后的海边",
      "place": "海岸 · 防波堤",
      "time": "傍晚 · 退潮",
      "mood": "海风、盐味、远处的灯",
      "group": "日常",
      "text": "放学后你绕到海边，风把校服外套吹得鼓起来。防波堤上已经坐了一个人，鞋并排放在旁边，脚悬在堤沿。她没有回头，只往旁边挪了挪，空出一块被太阳晒暖的水泥：「坐吗？今天的海很安静。」"
    },
    {
      "id": "gen-oldbook",
      "title": "旧书店的阁楼",
      "place": "旧书店 · 阁楼",
      "time": "周末 · 午后",
      "mood": "灰尘、旧纸、木楼梯",
      "group": "奇幻",
      "text": "旧书店的老板让你上阁楼找一本没有书脊的册子。木楼梯在脚下响，灰尘在光柱里慢慢飘。阁楼尽头有一扇小窗，窗边堆着旧地图和没有封面的书；你抽出一本，里面夹着一张手写的便签：「如果你看到这里，说明你也迷路了。」"
    },
    {
      "id": "gen-shrine",
      "title": "神社的初诣",
      "place": "神社 · 石阶",
      "time": "新年 · 清晨",
      "mood": "钟声、霜、红色的绘马",
      "group": "奇幻",
      "text": "新年的第一班电车把你送到神社脚下。石阶上结着薄霜，前面的人呼出的白气一团团散开。你走到拜殿前，摇铃的声音在冷空气里传得很远。旁边一个女生把绘马挂上去，回头看见你，笑了一下：「你也许了什么愿？」"
    },
    {
      "id": "gen-roofnight",
      "title": "天台上的夜风",
      "place": "学校 · 天台",
      "time": "夜里 · 熄灯前",
      "mood": "风、远处车流、星星",
      "group": "日常",
      "text": "天台的铁门没有锁，你推开时它还是响了一声。夜风比楼下凉，远处的车流像一条慢慢移动的光带。有人已经坐在水塔旁边，背靠着墙，手里握着一罐还温着的饮料。她听见脚步声，偏过头：「你也睡不着？」"
    },
    {
      "id": "gen-train",
      "title": "末班车",
      "place": "电车 · 车厢",
      "time": "深夜 · 末班车",
      "mood": "空车厢、广播、晃动的灯",
      "group": "都市",
      "text": "末班车的车厢只剩几个人。你坐在靠门的位置，看着窗外的灯一盏盏退后。对面的女生把书包放在膝盖上，额头顶着车窗，像是睡着了；车过弯时她的头轻轻一歪，又自己醒过来，和你的视线撞在一起。"
    }
  ],
  "works": [
    {
      "id": "lemon",
      "index": 1,
      "title": "橘光柠水随想曲",
      "jp": "LimeLight Lemonade Jam",
      "tagline": "在英山站前的灯下，把酸涩的柠檬做成能卖票的声音。",
      "place": "河锅市区 · 英山",
      "era": "2018 · 二月",
      "tags": [
        "音乐",
        "都市",
        "学园"
      ],
      "accent": "#E0B33C",
      "accent2": "#5FA8A0",
      "kicker": "PLAY IT LOUD, ANYWAY",
      "intro": "河锅市区是一座把夜晚交给 Livehouse 的小城：票要一张张卖，档期握在店主手里，技术好的乐手只替人撑场。冲浪雪鹰在英山站前的居酒屋打工，背着贝斯替人补位，却始终不肯加入任何一支固定乐队。直到一支缺主唱、缺鼓手、也缺一个名字的乐队，在春假的街头把他拦了下来。",
      "synopsis": "河锅市区是那种「有一点大商城、剩下全是餐馆和时装店」的地方城市。市中心叫英山，一切以英山站为圆心：站前商业街、住宅区、Livehouse、居酒屋、录音棚。这里的夜晚由能演出的地方决定，票要一张张卖，档期是硬通货；乐队想上台，先得有人肯把那一晚让出来。\n\n冲浪雪鹰是贝斯手，高二，长期替人撑场。技术好的人不加入固定乐队，按场次补位，拿钱走人——他活在这条线上，拒掉所有「条件不错」的邀请。理由他说不清，只有一句：总觉得有地方不太对。他追的是一道很久以前的光，一次再也比不上的 Live；每次上台都比一次，每次都比不上。\n\n三月末，他在英山街头遇见阳见惠凪。她从鸾镜女学院转来，体弱，带着一把住院时得到的木吉他，在冷风里把嗓子唱到哑，被醉鬼喝倒彩也不肯下台。后来是隐杏珠——太鼓判的同事，主音吉他，嘴上会看气氛，心里筑着墙；岛越月望——弹了十几年钢琴的大小姐，键盘手；二见原莉莉子——隔壁的青梅竹马，管 SNS、拍视频、跟 Livehouse 谈档期。五个人加一个鼓手，凑成柠檬水工厂。\n\n四月招新，六月第一次正式上台，九月文化祭，次年二月最后一场，三月毕业。这座城市里，玩乐队的人最后大多会留下来，只是换了个身份。快乐比实力更接近正确答案；在没用的事情上拼尽全力，也算数。",
      "theme": "浪费生命也算数",
      "cover": "",
      "cast": [
        {
          "id": "lemon-yuka",
          "name": "茶园那优花",
          "role": "茶园家次女 · 乐队的耳朵",
          "quote": "你弹得不错，就是不敢弹自己的。",
          "bio": "茶园家的次女，听一遍就能哼出旋律。她说话时习惯半眯着眼，像在调音。对别人的才华她从不吝啬夸奖，对自己的却一句不提。",
          "tags": [
            "耳朵灵",
            "直白",
            "次女"
          ]
        },
        {
          "id": "lemon-tsukimi",
          "name": "岛越月望",
          "role": "柠水工坊 · 键盘手",
          "quote": "键盘不会说谎。你按下去几分力，它就还你几分声音。",
          "bio": "柠水工坊的键盘手，鸾镜女学院二年级，从小学琴的大小姐。金黄长发齐刘海，蓝紫双色瞳，160 厘米，体态端庄。她学琴的起点是讨母亲欢心，后来变成不服输：连输三年也没停手。她讨厌的事当场说清，亲密话题上知识量超标，自己被碰到肩膀却念叨淋巴。合奏时她要的是「踏实」的手感。她坐姿很直，弹到投入时才会微微前倾。",
          "tags": [
            "键盘",
            "不服输",
            "大小姐"
          ],
          "hair": "#E8C56A",
          "eyes": "#7F8CC9",
          "outfit": "#E8E4DC",
          "variant": 2
        },
        {
          "id": "lemon-ririko",
          "name": "二见原莉莉子",
          "role": "柠水工坊 · SNS 宣传",
          "quote": "票卖不出去就自己去街上喊。丢脸总比空场好。",
          "bio": "柠水工坊的 SNS 宣传，雪鹰的青梅竹马兼邻居，神仙学院二年级。玫瑰红中长发，琥珀金眼睛，159 厘米，右侧一排三支细金发夹。她管频道、拍视频、写文案、跟 Livehouse 谈档期，不演奏乐器。房间乱得下不去脚，空罐和纸箱堆得老高；嘴上损人，排练日却总在场，理由只是「我喜欢柠水工坊」。她笑起来会喘不上气，笑完又去改下一版文案。",
          "tags": [
            "宣传",
            "青梅竹马",
            "邋遢"
          ],
          "hair": "#B04A5C",
          "eyes": "#C99A3C",
          "outfit": "#8FB04A",
          "variant": 1
        },
        {
          "id": "lemon-miku",
          "name": "砾川美玖",
          "role": "砾川家次女 · 键盘手",
          "quote": "我把和声写好了，你只要敢唱。",
          "bio": "砾川家的次女，谱子写得比谁都满。她习惯替别人铺好台阶，自己却站在台后。被夸奖时会否认，转身却把那张纸收进最里层的口袋。",
          "tags": [
            "键盘",
            "细心",
            "退半步"
          ]
        },
        {
          "id": "lemon-ena",
          "name": "阳见惠凪",
          "role": "柠水工坊 · 吉他主唱",
          "quote": "我唱得不好。但今天，我不想再小声了。",
          "bio": "柠水工坊的吉他主唱，神仙学院二年级。淡粉色长卷发，紫红眼睛，高度近视，158 厘米，四肢细长。她从小体弱，一年有大半年躺在病床上；住院时一个病人把木吉他和一句「在没用的事情上拼尽全力」丢给她。三月末的夜里，她在英山街头把嗓子唱到哑，被醉鬼喝倒彩也不肯下台。她嘴上一天要念几次倒霉，真上台时反而最稳。",
          "tags": [
            "主唱",
            "体弱",
            "不肯认输"
          ],
          "hair": "#E8A8BC",
          "eyes": "#A83A5C",
          "outfit": "#D9B33C",
          "variant": 2
        },
        {
          "id": "lemon-anju",
          "name": "隐杏珠",
          "role": "柠水工坊 · 主音吉他",
          "quote": "别夸我。你一夸，我就不知道下一句该怎么弹了。",
          "bio": "柠水工坊的主音吉他，鸾镜女学院学生，太鼓判的打工店员。深紫黑短发挑染亮紫，翠绿眼睛，153 厘米，小个子。她父亲从前在乐队弹吉他，她从小摸琴，却在学校里一个朋友都没有；成绩好，会看气氛，会区别「在家的自己」「在学院的自己」「打工时的自己」。被夸就慌，慌完又偷偷高兴。她紧张时会搞砸，哭完照样把吉他背起来。",
          "tags": [
            "吉他",
            "会看气氛",
            "筑墙"
          ],
          "hair": "#3A2E4A",
          "eyes": "#6FA85E",
          "outfit": "#8C2F3F",
          "variant": 1
        }
      ],
      "timeline": [
        {
          "label": "二月 · 撑场",
          "text": "太鼓判的最后一桌，雪鹰还在替人补位。"
        },
        {
          "label": "三月末 · 街头",
          "text": "一把木吉他、一个把嗓子唱哑的女孩。"
        },
        {
          "label": "四月 · 结成",
          "text": "招新、排练室、白色 T 恤上的柠檬切片。"
        },
        {
          "label": "次年二月 · 最后一场",
          "text": "票一张张卖完，毕业在三月等着。"
        }
      ],
      "openings": [
        {
          "id": "lemon-open-taiko",
          "title": "太鼓判的最后一桌",
          "place": "居酒屋 · 太鼓判",
          "time": "深夜 · 打烊前",
          "mood": "油烟、笑、贝斯线",
          "text": "太鼓判的最后一桌客人走的时候，已经过了十二点。你收拾杯子，冲浪雪鹰在角落里收贝斯线，背带还挂在肩上。仲原大梦从厨房探出头：「明天 DOOZY 有场，缺个贝斯。去不去？」雪鹰没抬头：「几点？」「七点彩排。」他把线绕好，想了一会儿：「行。」你在旁边听着，忽然觉得他答应得太快，像是怕慢一秒，就会想起别的事。大梦把毛巾搭在肩上，看了他一眼：「别又只帮一场。」雪鹰笑了一下，没答。门外有人在收伞，水滴滴答答。"
        },
        {
          "id": "lemon-open-doozy",
          "title": "DOOZY 的地下室",
          "place": "Livehouse DOOZY",
          "time": "演出夜 · 七点",
          "mood": "低频、暗、汗",
          "text": "DOOZY 的地下室没有窗，低音一响，地板先震。你站在调音台旁边，手里攥着一张别人塞给你的票。台上，撑场的乐队只排了三首，贝斯手站在最边上，灯光几乎照不到他。可每一个转音都稳得像钉在墙里。散场后人群往外走，你逆着人流挤到前排，看见他正在收线，手指上有一道新磨出来的红痕。你把票根攥皱，忽然想知道他叫什么名字。台上已经有人在收麦克风。灯光一盏盏灭下去。"
        },
        {
          "id": "lemon-open-street",
          "title": "站前街头",
          "place": "英山站前",
          "time": "三月末 · 夜",
          "mood": "冷风、跑调、掌声",
          "text": "三月末的英山站前，风还冷。街头舞台是一块用胶带划出来的空地，路过的人多半不停。你抱着木吉他站在边上，手指冻得发僵。一个女孩正在唱，淡粉长发被风吹到脸上，嗓子已经哑了，调也偏了；醉鬼在下面喊「难听」，她回了一句什么，又继续唱。唱到最后一句，她抬头，正好看见你。她没有停，只是把声音又提高了一点。你本来只是路过，脚却停在了胶带线外。她唱完，喘着气笑了。"
        }
      ]
    },
    {
      "id": "sakura",
      "index": 2,
      "title": "樱之诗",
      "jp": "サクラノ詩",
      "tagline": "坡道尽头是樱，樱的尽头是画。",
      "place": "弓张市区 · 樱与坡与海",
      "era": "2018 · 二月",
      "tags": [
        "学园",
        "艺术",
        "悬疑"
      ],
      "accent": "#D76C82",
      "accent2": "#8FA9C4",
      "kicker": "A POEM IN SEVEN PANELS",
      "intro": "弓张市区由坡与樱构成：浮梦坡通向弓张学院，坡顶是伯奇神社，樱原的车站与画材店养活了一整条艺术街。草薙直哉回到这座城时，父亲留下的《樱七相图》只剩传闻，中村制药握着另外六幅，摩尔公募展的「铂金·虎鲸」仍在决定谁算当代的坐标。画可以卖，才能可以被裁定，只有未完成的千年樱不肯开花。",
      "synopsis": "二〇一八年春，草薙健一郎的葬礼在樱之森的火葬场办，樱正满开。他是日本人里极少数拿过穆尔公募展最高奖「普拉蒂努·埃波拉尔」的人，代表作只有一个题材：樱。世人以为那张「横躺的樱」是一幅，其实是七部作，一部分长期压在中村制药的仓库里。\n\n他的儿子草薙直哉六年没有画画。弓张市区的人提起他，先提父亲，再提那只废掉的右手，最后才想起他本人。御樱稟在同一个春天转学回来，坐在三年级教室里，像把一段被剪掉的胶片重新接上；她记得樱花，记得小时候的院子，却不记得那个夏夜在伯奇神社发生过什么。\n\n这座城把艺术当产业：布鲁巴吉靠突发的表演把作品推上台面，鉴赏会当场裁定真伪，赝作是有人赖以为生的手艺，债务常拿画抵。弓张学园的美术部在顶楼，天窗漏光，部费年年被砍；喫茶奇美拉的柜台后面，鸟谷真琴一边算账一边骂人。夏目雫住在小音羽的旧宅里，安静得像一件收好的器物——她是伯奇，吞得下别人的梦。\n\n春天走到下一个春天，中间夹着文化祭、壁画、官司和一场葬礼之后的遗嘱。直哉要不要再拿起笔，稟要不要找回那段被吞掉的才能，雫要不要承认自己也有心。这座城等的从来不只是画，是画后面那个还愿意留下来的人。",
      "theme": "才能是一种诅咒，也是一种遗嘱",
      "cover": "",
      "cast": [
        {
          "id": "sakura-rina",
          "name": "冰川里奈",
          "role": "一年级 · 直哉的弟子",
          "quote": "我画的是夜。白天太亮了，什么都藏不住。",
          "bio": "一年级，美术部部员，直哉的弟子。银白偏淡紫的麻花辫，靛蓝眼睛，黑发箍，皮肤见不得直射的日光，夏天要撑白伞、穿遮得更多的衣服。她从小在伯奇神社坡下画画，能把整片夜画成燃烧的丝杉。她自称是直哉「精神上的妹妹」，说得理直气壮；被人当成一碰就碎的娃娃时，她会笑着把话顶回去。她讲起旧闻与童话来有头有尾，唯独不提自己的夏天。",
          "tags": [
            "弟子",
            "夜行",
            "倔"
          ],
          "hair": "#E4DCEA",
          "eyes": "#3E5A8C",
          "outfit": "#2E3440",
          "variant": 2
        },
        {
          "id": "sakura-yumi",
          "name": "川内野优美",
          "role": "冰川家的女仆 · 同行者",
          "quote": "她走到哪里，我就跟到哪里。",
          "bio": "跟在里奈身边的女仆，做事利落，话却少得可怜。她替里奈挡下所有琐事，也替她记住那些不愿记的日子。对世界的要求很低，对一个人的要求很高。",
          "tags": [
            "女仆",
            "忠诚",
            "沉默"
          ]
        },
        {
          "id": "sakura-makoto",
          "name": "鸟谷真琴",
          "role": "美术部部长 · 喫茶奇美拉代理店长",
          "quote": "账要算清。人情也一样，算不清就别欠。",
          "bio": "美术部部长，喫茶奇美拉的代理店长，校外以「白州兎子」之名烧陶烧玻璃。藕荷色短翘双马尾，深酒红眼睛，讲话快，骂人不留余地。她把一切换算成借与还：别人给她一分好，她要还成看得见的东西。父母几乎不看她和弟弟圭，她就自己把课表、排班、窑温全记在本子上；账算得越清，越不肯欠人。她骂完人，转头把饭装好，把凉掉的茶重新热一遍。",
          "tags": [
            "部长",
            "刀子嘴",
            "手艺人"
          ],
          "hair": "#B49BC4",
          "eyes": "#7A2233",
          "outfit": "#6B4C5A",
          "variant": 1
        },
        {
          "id": "sakura-ai",
          "name": "夏目蓝",
          "role": "夏目家次女 · 图书馆常客",
          "quote": "有些书，我只想借给你一个人。",
          "bio": "夏目家的次女，说话轻，脚步也轻。她在图书馆待的时间比在教室长，能在最安静的地方找到最锋利的话。对姐姐的事从不追问，却记得每一个细节。",
          "tags": [
            "寡言",
            "图书馆",
            "妹妹"
          ]
        },
        {
          "id": "sakura-shizuku",
          "name": "夏目雫",
          "role": "夏目家 · 伯奇",
          "quote": "梦是别人的。可醒来以后，留下来的那个是我。",
          "bio": "夏目家的女儿，与圭、蓝同住在小音羽的旧宅。淡粉短发，X 形红发夹，藤紫眼睛，安静得像一件收好的器物。她是伯奇，吞得下别人的梦；也是那个在琴子婆婆死后，自己把心放下的孩子。她不懂就问，不装懂；对自己极狠，对别人极松。第一次吃到直哉做的饭，她掉了眼泪，理由自己也说不清。她判断事情先拆条件与因果，情绪上来时反而更安静。",
          "tags": [
            "伯奇",
            "安静",
            "直白"
          ],
          "hair": "#F0C9CE",
          "eyes": "#9A7BB8",
          "outfit": "#D8D3CC",
          "variant": 1
        },
        {
          "id": "sakura-rin",
          "name": "御樱稟",
          "role": "三年级转学生 · 美术部",
          "quote": "我不是回来找回画的。我是回来看看，这里还认不认得我。",
          "bio": "御樱家的女儿，父亲做画商，母亲在她十七岁那年病逝。灰粉长发系深洋红缎带，琥珀棕的眼睛，笑起来先弯眼。她离开弓张六年，又在三年级开学那天转回来，把「回来」说成「回家」。她记得这条街的每一棵樱，却不记得那个夏夜在伯奇神社失去过什么；她画樱的时候，颜色总比别人的淡一点。她讲话总先替对方留退路，再把自己的意思轻轻塞进去。",
          "tags": [
            "转学生",
            "温柔",
            "有旧伤"
          ],
          "hair": "#D9A9B4",
          "eyes": "#B07A3C",
          "outfit": "#8E2F4F",
          "variant": 2
        }
      ],
      "timeline": [
        {
          "label": "春 · 葬礼",
          "text": "樱之森的火葬场，樱正满开；六年不画画的儿子站在人群最后。"
        },
        {
          "label": "春 · 转学",
          "text": "御樱稟回到三年级教室，美术部顶楼的天窗落下一层灰。"
        },
        {
          "label": "夏 · 梦",
          "text": "伯奇神社的石阶、千年樱、被吞掉的那段才能。"
        },
        {
          "label": "下一个春",
          "text": "文化祭、壁画、官司；这座城还在等一张画。"
        }
      ],
      "openings": [
        {
          "id": "sakura-open-funeral",
          "title": "樱之森的葬礼",
          "place": "樱之森 · 火葬场外",
          "time": "春日 · 午后",
          "mood": "花与灰",
          "text": "樱之森的火葬场外，樱花开得没有分寸。你站在人群最后，黑衣服上落了一层花瓣。前面的人在低声说话，说草薙健一郎，说穆尔公募展，说那张「横躺的樱」。一个灰粉长发的女孩从你身边走过去，在灵前站定，合掌，很久没有动。她转身时看见你，眼睛红着，却先笑了一下：「你也来了。」你想不起她是谁，可她的语气像你们已经认识很多年。风把她的裙摆吹到小腿上，她没有去按，只是把手里那枝樱放下来。"
        },
        {
          "id": "sakura-open-atelier",
          "title": "顶楼画室",
          "place": "弓张学园 · 美术部画室",
          "time": "放学后 · 斜光",
          "mood": "松节油、灰尘",
          "text": "美术部在顶楼。天窗漏下来的光里浮着灰，松节油的味道比走廊重。你推门进去，鸟谷真琴正蹲在地上数一叠收据，头也不抬：「脚边那罐别踢，颜料贵。」画架一排排立着，有一张只画了一半的樱，花瓣停在半空。冰川里奈从画架后面探出头，手里还捏着笔：「前辈，你来得正好。帮我看看，这里的夜是不是太亮了？」窗外是梦浮坂的坡，樱一层层往下落，像有人在慢慢倒一盒颜料。真琴说，今年的部费又少了。"
        },
        {
          "id": "sakura-open-shrine",
          "title": "梦浮坂的雨",
          "place": "梦浮坂 · 伯奇神社石阶",
          "time": "傍晚 · 落雨",
          "mood": "湿冷、沉默",
          "text": "雨落在梦浮坂的石阶上，一级一级往下流。伯奇神社的灯已经亮了，社前的绳子被风吹得轻轻响。你撑伞往上走，看见夏目雫站在鸟居下，没有打伞，淡粉的短发贴在脸侧。她听见脚步，转过头来：「你来做什么？」你说不上来。她看了你一会儿，往旁边让了半步，够一个人站进去。「雨要下很久。」她说，「站这儿吧。」她往你伞下靠了靠，自己半边肩膀还露在雨里；你说进来一点，她只「嗯」了一声。雨顺着伞骨往下滴。"
        }
      ]
    },
    {
      "id": "nine",
      "index": 3,
      "title": "9-nine- 天色天歌天籁音",
      "jp": "9-nine- そらいろそらのね",
      "tagline": "地震震坏了神社的神器，也把异世界的道具放了进来。",
      "place": "白巳津川 · 白泉学园 / 玖方女校",
      "era": "2018 · 二月",
      "tags": [
        "异能",
        "悬疑",
        "都市"
      ],
      "accent": "#5E6FD1",
      "accent2": "#E3C15C",
      "kicker": "THE NINTH ARTIFACT",
      "intro": "白巳津川是一座被动画写进全国耳朵的地方小城。春季莫比乌斯节的地震震坏了白蛇九十九神社的神器，异世界的 Artifact 从此流入；被选中的人得到能力，也一点点被能力逼疯。玖方女校的石化事件还没有犯人，白泉学园的火灾只剩传说——新海翔的妹妹天在火场里醒来，同班同学九条都则用「掠夺」夺走了整片火。",
      "synopsis": "白巳津川是一座被动画《轮回转生的莫比乌斯环》写进全国耳朵的地方小城。为振兴地方而强行续办的「春季莫比乌斯节」在今年遭遇大地震，会场白蛇九十九神社供奉的神器被震坏——从那天起，这座城市与异世界相连，异世界的「Artifact」开始流入。\n\n得到 Artifact 的人会获得五花八门的能力，也会被能力一点点逼疯。玖方女校一名女生被石化成石像，犯人至今未捕；白泉学园的火灾烧掉了一整层校舍，事后连焦痕都消失得干干净净。新海翔的妹妹新海天在火场里被救出，随后觉醒了「消除气息」；同班同学九条都则用「掠夺」夺走了整片火。两个人把翔拖进了追查石化犯人的小队。\n\n小队里还有自称观测者的苏菲缇雅、被称作「乐园的女王」的香坂春风、瓦尔哈拉社的结城希亚，以及班主任成濑沙月。线索指向「魔眼」与梨俱吠陀；而翔自己，是唯一没有觉醒能力的「特异点」。他要在保护妹妹、回收 Artifact 和守住这座城市之间，做出一个又一个不能反悔的选择。",
      "theme": "特异点",
      "cover": "",
      "cast": [
        {
          "id": "nine-sora",
          "name": "新海天",
          "role": "白泉学园一年级 · 翔的妹妹",
          "quote": "都说了，就是「消除气息」啦。",
          "bio": "银白长发、紫水晶眼睛的妹妹，自称本小姐。火灾之后觉醒了「消除气息」，能把存在感降到近乎透明；对哥哥完全无效，这件事她一直不服。她把现实当成游戏来解说，越害怕越要逞强，真正认真时句子会突然变短。",
          "tags": [
            "妹妹",
            "异能",
            "逞强"
          ],
          "hair": "#E8E8F2",
          "eyes": "#9B7ED9",
          "outfit": "#DFE8F5",
          "variant": 0
        },
        {
          "id": "nine-miyako",
          "name": "九条都",
          "role": "白泉学园二年级 · NINE BALL 店员",
          "quote": "『加油吧。为了守护这座城市。』",
          "bio": "亚麻色长发、深蓝紫眼睛的同班同学，可乐娜集团千金，却在 NINE BALL 打工。她的 Artifact 是「掠夺」，能夺走别人的所有物、封印能力；她厌恶这项像偷盗的能力，却比谁都先站到危险前面。她说话软，动手时句子会变得很短。",
          "tags": [
            "同班",
            "正义感",
            "掠夺"
          ],
          "hair": "#C9B68C",
          "eyes": "#4A4A9E",
          "outfit": "#E8EAF2",
          "variant": 2
        },
        {
          "id": "nine-sophie",
          "name": "苏菲缇雅",
          "role": "生命之树 · 观测者",
          "quote": "嗨，看来你们很快就找到 Artifact 了呢。",
          "bio": "浮在半空的小型玩偶，白底、荷叶状耳翼、紫色螺旋眼睛；本体是白发金瞳的少女。她来自「生命之树」，是组织里唯一能跨世界移动的人，负责观测与传话。她说话像说明书，嫌麻烦但会把事办完，对翔这个「特异点」始终保持警惕。",
          "tags": [
            "异世界",
            "观测者",
            "玩偶"
          ],
          "hair": "#F0F0FF",
          "eyes": "#7B5BC4",
          "outfit": "#DCE6F5",
          "variant": 3
        },
        {
          "id": "nine-haruka",
          "name": "香坂春风",
          "role": "白泉学园二年级 · 「乐园的女王」",
          "quote": "哎呀，真是不识规矩。",
          "bio": "学校里被众人捧着的「女王」，手机里却是说话温柔、一个朋友也没有的女生。她是石化事件的魔眼使用者，与梨俱吠陀有牵连；被孤立与被围着这两种处境在她身上来回切换。她抬着下巴说话，真被逼到墙角时会露出另一副声音。",
          "tags": [
            "女王",
            "双面",
            "魔眼"
          ],
          "hair": "#3A2A3E",
          "eyes": "#8E6BB5",
          "outfit": "#5A2A3E",
          "variant": 2
        },
        {
          "id": "nine-noa",
          "name": "结城希亚",
          "role": "玖方高中 · 瓦尔哈拉社社长",
          "quote": "我只是一介平凡的人类。热爱正义而又渺小脆弱的人类。",
          "bio": "玖方高中的学生，NINE BALL 常客，八岁自创「瓦尔哈拉社」，自称女武神。她被「圣遗物」选中，使用「古之埃达事典」战斗；讲程序、讲条件，不喊口号，也不替自己辩解。她和翔一行时而合作、时而各自行动。",
          "tags": [
            "女武神",
            "正义",
            "程序"
          ],
          "hair": "#C9C2D9",
          "eyes": "#6E7BD9",
          "outfit": "#2E3F5C",
          "variant": 1
        }
      ],
      "timeline": [
        {
          "label": "二月 · 地震",
          "text": "春季莫比乌斯节中断，神社神器损坏，城市与异世界相连。"
        },
        {
          "label": "二月 · 石化",
          "text": "玖方女校女生化成石像，白泉学园火灾，犯人未捕。"
        },
        {
          "label": "二月 · 小队",
          "text": "天觉醒「消除气息」，九条都讲清 Artifact，翔被拖入调查。"
        },
        {
          "label": "三月 · 魔眼",
          "text": "梨俱吠陀、魔眼与「被抹掉的人」，选择开始反噬。"
        }
      ],
      "openings": [
        {
          "id": "nine-open-door",
          "title": "门缝里的透明人",
          "place": "新海翔的公寓",
          "time": "放学后 · 天黑前",
          "mood": "钥匙、门缝、屏住呼吸",
          "text": "钥匙刚插进锁孔，门缝里就有一道影子缩了一下。你推门进去，屋里没人，玄关的鞋却多了一双。你叫了一声「天」，没有回答；冰箱上的便利贴轻轻晃了晃。你伸手去开灯，手腕先被人从旁边抓住——银白发的妹妹从空气里显出来，鼓着脸：「为什么老哥你总是能发现我啊……！」她说完自己先笑了，笑到一半又别过脸。"
        },
        {
          "id": "nine-open-cafe",
          "title": "NINE BALL 的碰头",
          "place": "NINE BALL 咖啡馆",
          "time": "傍晚 · 打烊前",
          "mood": "咖啡、玻璃窗、三份资料",
          "text": "NINE BALL 的玻璃窗映着站前的灯。九条都把三杯咖啡端过来，杯柄朝着每个人，自己坐在靠门的位置。她把一张打印纸推到桌子中央：「石化事件的犯人，还有其他的 Artifact——我们想请你一起查。」苏菲缇雅浮在吊灯旁边，用那种不紧不慢的声音补了一句：「当然，你也可以拒绝。只是拒绝之后，别后悔。」天在旁边小声说：「老哥，答应啦。」"
        },
        {
          "id": "nine-open-shrine",
          "title": "白蛇九十九神社",
          "place": "白蛇九十九神社 · 石阶",
          "time": "黄昏 · 参道",
          "mood": "石阶、纸垂、旧书",
          "text": "白蛇九十九神社的石阶被黄昏染成暗红色。成濑沙月抱着一摞打印资料从社务所出来，看到你们，先叹了口气：「你们怎么又来了。」她把资料往你怀里一塞，最上面那本是现代语译本，页边写满她的批注。「拿去看。看不懂再来问我——不过，别把我写的东西弄丢了。」她说完转身去收纸垂，木屐在石阶上敲出很轻的声响。"
        }
      ]
    },
    {
      "id": "domain",
      "index": 4,
      "title": "少女领域",
      "jp": "オトメ＊ドメイン",
      "tagline": "被大小姐捡回女校宿舍，却成了全校最想娶回家的「少女」。",
      "place": "白铃町 · 白铃女子学园",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "学园",
        "都市"
      ],
      "accent": "#E88FA6",
      "accent2": "#74A8D8",
      "kicker": "THE FIRST BRIDE OF SHIRASUZU",
      "intro": "唯一相依为命的祖母过世后，无处可去的飞鸟凑被同龄的大小姐西园寺风莉收留，以女装转校生的身份入读名门女校「白铃女子学园」，并住进了第二宿舍。原本以为要寄人篱下，推开门才发现，这里的理事长生活不能自理、大和抚子专精黑暗料理、学妹每天忙着跟魔王军传讯——反倒是凑包办了全部家务，顺手拿下了校内票选「最适合当新娘 NO.1」。",
      "synopsis": "唯一相依为命的祖母去世后，飞鸟凑成了真正的孤身一人。葬礼那天找上门来的，是祖母生前曾服侍过的大小姐西园寺风莉——同时也是贵族女校白铃女子学园的理事长。在「照顾好大小姐」的遗言与对方半哄半劝的安排下，凑换上了女校制服，住进学园深处的第二宿舍，成了全校最不起眼也最忙碌的二年级转校生。\n\n本以为名门女校的宿舍里全是端庄优雅的大小姐，一起生活后才发现第二宿舍简直是问题儿童的收容所：风莉在外是完璧的优等生理事长，回房间连洗衣机都不会用，甚至懒得起夜而在屋里备着空塑料瓶；同班的贵船柚子看起来像理想的大和抚子，房间却乱得无处下脚，做出来的料理足以让宿舍进入紧急戒备；低一年级的大垣日向则是重度中二病患者，自称「东方将军查拉图斯特拉」，其实是个连黑咖啡都要咬牙硬喝的小迷妹；负责宿舍的班主任那波七海更是整天懒散得像不良教师。\n\n为了不让这间屋子彻底塌掉，擅长料理与清扫的凑默默接管了第二宿舍的所有家务，不知不觉在新闻部票选里夺下了「全校最适合当新娘的人选」第一名。日常越热闹，凑藏在制服下的秘密与无依无靠的旧伤就越显眼——而收留他的风莉，也一直在找机会把这份「收留」变成真正的家。",
      "theme": "家比规矩先到",
      "cover": "",
      "cast": [
        {
          "id": "domain-kazari",
          "name": "西园寺风莉",
          "role": "白铃女子学园理事长 · 同班兼同室",
          "quote": "只要在我身边就好。外面的事，我自己会想办法——大概吧。",
          "bio": "财阀千金兼白铃女子学园理事长，凑的同班同学兼第二宿舍同室舍友。亚麻长发、翠绿眼眸，在外人面前是端庄完美的优等生，回到宿舍就现出废柴大小姐的原形——生活自理能力几乎为零，连空塑料瓶都往床边塞。她因幼时受过凑的祖母照拂，在祖母离世后成为凑的监护人；嘴上总摆着理事长的架子，实际比谁都怕凑离开。",
          "tags": [
            "理事长",
            "废柴大小姐",
            "同室"
          ],
          "hair": "#D8C6B4",
          "eyes": "#5FA374",
          "outfit": "#2C2830",
          "variant": 2
        },
        {
          "id": "domain-yuzu",
          "name": "贵船柚子",
          "role": "同班同学 · 第二宿舍住户",
          "quote": "没问题的，这次我可是严格按食谱放了整整一瓶调味料哦！",
          "bio": "名门贵船家的大小姐，与凑和风莉同班并同住第二宿舍。黑长直发、温婉笑颜，外表怎么看都是标准的大和抚子，实际却是个行动力过剩、房间乱成一团的野丫头。她唯独对料理充满热情，做出来的却全是超弩级黑暗料理；除开家务以外，她比谁都坦率重情，永远站在朋友前面。",
          "tags": [
            "黑长直",
            "大小姐",
            "黑暗料理"
          ],
          "hair": "#252128",
          "eyes": "#7C649E",
          "outfit": "#2C2830",
          "variant": 2
        },
        {
          "id": "domain-hinata",
          "name": "大垣日向",
          "role": "一年级学妹 · 图书委员",
          "quote": "区区这种程度的封印，对我东方将军查拉图斯特拉来说……呜、咖啡好苦！",
          "bio": "比凑低一年级的学妹，第二宿舍住户兼图书委员。老家是新兴企业集团的暴发户，本人却毫无铜臭味，只是一心沉浸在重度中二病里——左眼戴着蓝色美瞳演出异色瞳，自称「东方将军查拉图斯特拉」，魔王军设定三天一换。她偷偷爱吃甜食、强忍着喝黑咖啡，被骂时立刻泪眼汪汪地道歉，是对凑无比依赖的小迷妹。",
          "tags": [
            "学妹",
            "中二病",
            "异色瞳"
          ],
          "hair": "#E4C89E",
          "eyes": "#7A5BA8",
          "outfit": "#2C2830",
          "variant": 1
        },
        {
          "id": "domain-miyu",
          "name": "皆见美结",
          "role": "邻座同班同学 · 元气女孩",
          "quote": "小凑太厉害啦！下次小测能不能稍微借我抄……不对，教教我？",
          "bio": "坐在凑邻座的同班同学，性格爽朗爱笑，成绩常年处于危险线边缘。她家里并非顶级豪门，却凭着毫无架子的亲和力与全班打成一片，最爱小卖部的炒面面包与炸猪排三明治。对凑而言，她是第一个让人觉得「在这所大小姐学园里也能做普通朋友」的人。",
          "tags": [
            "邻座",
            "元气",
            "亲和"
          ],
          "hair": "#B87A5C",
          "eyes": "#C97E4B",
          "outfit": "#2C2830",
          "variant": 1
        },
        {
          "id": "domain-nanami",
          "name": "那波七海",
          "role": "班主任 · 第二宿舍管理员",
          "quote": "啊——好麻烦。不过你们几个要是闯祸了，我还是会出面兜底的啦。",
          "bio": "凑班上的班主任，兼任第二宿舍的管理员，名和姓都读作「Nanami」。金发长卷、总是没睡醒似的懒散神情，乍看是不干正事的不良教师，实际上把宿舍里每个学生的心事和分寸都看得一清二楚，紧要关头比谁都靠得住。",
          "tags": [
            "教师",
            "舍监",
            "外冷内暖"
          ],
          "hair": "#E2BF78",
          "eyes": "#5B86AD",
          "outfit": "#D9D6D2",
          "variant": 2
        },
        {
          "id": "domain-minato",
          "name": "飞鸟凑",
          "role": "二年级转校生 · 「最适合当新娘 NO.1」",
          "quote": "别、别用那种眼神看我啦……我只是照着奶奶以前教的做法收拾而已。",
          "bio": "祖母过世后被风莉收留、换上女生制服进入白铃女子学园的少年。淡蓝短发与比女孩更清秀端正的长相，配上文武双全、家务料理满点的本领，让他刚转来不久就在新闻部问卷里拿下了「全校最适合当新娘 NO.1」。在一群令人遗憾的大小姐中间，他每天嘴上无奈吐槽，手里却从没停下过照顾人的动作。",
          "tags": [
            "女装",
            "家务万能",
            "温柔"
          ],
          "hair": "#9ABCE2",
          "eyes": "#5C89BF",
          "outfit": "#2C2830",
          "variant": 0
        }
      ],
      "timeline": [
        {
          "label": "二月 · 收留",
          "text": "祖母葬礼之后，风莉递来白铃女子学园的女生制服与第二宿舍钥匙。"
        },
        {
          "label": "日常 · 第二宿舍",
          "text": "收拾空塑料瓶、阻止黑暗料理、给中二病学妹泡加糖咖啡。"
        },
        {
          "label": "春 · 票选 NO.1",
          "text": "校内新闻部问卷公布，「最适合当新娘的人选」榜首成了全校话题。"
        },
        {
          "label": "选择 · 家与秘密",
          "text": "是被收留的「她」，还是留下来陪她们过完每一顿晚饭的「他」。"
        }
      ],
      "openings": [
        {
          "id": "domain-open-dorm",
          "title": "第二宿舍的玄关",
          "place": "白铃女子学园 · 第二宿舍",
          "time": "二月 · 黄昏",
          "mood": "旧木门、空水瓶、晚餐香",
          "text": "第二宿舍的门比想象中重，推开时门槛发出吱呀一声。玄关堆着没拆封的快递盒，客厅茶几上放着两只还没洗的马克杯。西园寺风莉披着制服外套坐在沙发一角，亚麻色的长发散在肩上，看见你拎着行李进来，先松了一口气，才想起把腰坐直：「终于到了？那波老师说钥匙在桌上。对了——今晚的饭，你也会顺便做吧？」说完她自己耳朵先红了一点，把桌角那只空塑料瓶悄悄踢到了沙发底下。"
        },
        {
          "id": "domain-open-kitchen",
          "title": "危险区域 · 厨房",
          "place": "第二宿舍 · 厨房",
          "time": "周末 · 上午",
          "mood": "焦味、围裙、惊呼",
          "text": "你刚走出房间，就闻到厨房里飘出一种绝不该属于早饭的味道。门半掩着，贵船柚子正站在灶台前，黑长直发用发带草草绑在脑后，手里举着不知第几瓶调味料往锅里倒：「嗯……颜色变成紫色了，但书上说炖久一点就会融合吧！」站在门口的大垣日向拉住你的袖口，小声提醒：「东方将军的直觉在报警……里面的魔物已经觉醒了。」柚子回头看见你，眼睛亮了起来，举起勺子就要你试吃。"
        },
        {
          "id": "domain-open-library",
          "title": "闭馆前的图书室",
          "place": "白铃女子学园 · 图书室",
          "time": "放学后 · 夕阳",
          "mood": "灰尘、黑咖啡、小声道歉",
          "text": "放学后的图书室只剩夕阳落在长桌上。大垣日向抱着一摞刚还回来的精装书站在借阅台后面，右眼遮在刘海边，手里却握着一罐没有加糖的黑咖啡。「哼……这点黑暗的苦涩，正是魔王军四天王的试炼……」她话没说完，抿了一口就皱起整张脸，整个人僵在椅子上。看见你走过来，她慌忙把罐子藏到书后面，眼睛瞬间有点发红：「才、才没有觉得苦……前辈刚才没有看见对吧？」"
        }
      ]
    },
    {
      "id": "tsuki",
      "index": 9,
      "title": "近月少女的礼仪",
      "jp": "月に寄りそう乙女の作法",
      "tagline": "东京青山的一间樱公馆，住着一位不能被发现的女仆。",
      "place": "东京青山 · 菲利亚女子学院",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "服装",
        "都市"
      ],
      "accent": "#B7A5D8",
      "accent2": "#E7D9C4",
      "kicker": "MOONLIT MANNERS",
      "intro": "东京青山与涩谷之间，菲利亚女子学院只收女生；樱公馆在住宅区一侧，走路五分钟就能到校。大藏游星男扮女装成「小仓朝日」，住进樱小路露娜的公馆当住家女仆：家务、制图、试缝与主人不肯说出口的孤独，全都压在他一个人身上。只要身份被点破，代价不是处分，是整个人生。",
      "synopsis": "东京青山，山手线内侧一小片贵得离谱的地界。港区一侧是樱公馆，涩谷区一侧是菲利亚女子学院与表参道的商店街，走路只要五分钟，房租却是另一个世界。学院是服装设计的专修女校，三年制，创办者是世界级设计师让·皮埃尔·史丹利；立校前提只有一条：只有女性才能入学。\n\n大藏游星是庶子。母亲在公馆里立场微妙，他被分到酒窖地下室吃饭睡觉，没有同行者就得不到外出许可。为了学设计，他借了一个新的名字与一套女仆装，以「小仓朝日」的身份住进樱公馆，成了樱小路露娜的贴身女仆。露娜是天才设计师，银白长发、红瞳、身高一米四五，脾气比针脚还细；朝日是版型师，能把她的图变成能穿的衣服。\n\n公馆里还住着柳之濑凑、尤希尔与花之宫瑞穗，各自带着女仆与家世。规矩写在日常里：女仆最后洗澡，睡前锁门、向主人请安，主人的房间不经允许不进。学院里，女仆擅自使用沙龙是违反校规；菲利展没有名次，只有「被看见」；Quartz 奖的副奖是去巴黎留学。\n\n身份暴露的风险随季节增加。代理校长大藏衣远握着退学权限，他是游星的长兄，也是这个家里最会用才能称人的人。一件衣服是两个人做出来的，可站上舞台的只有一个。朝日要在被看见之前，先决定自己愿意让谁看见。",
      "theme": "被看见的那一半",
      "cover": "",
      "cast": [
        {
          "id": "tsuki-mizuho",
          "name": "花之宫瑞穗",
          "role": "花之宫分家独生女 · 和服设计",
          "quote": "请把腰挺直。穿上我做的衣服，不能低头。",
          "bio": "花之宫分家的独生女，菲利亚服装学部学生，樱公馆住户。黑色长直发，左侧一条粉色细缎带，紫瞳，160 厘米，走路时肩背极正，那是长年练日本舞蹈与弓道练出来的。她拿过和服设计大赛青少年组的奖，是四位大小姐里唯一有官方奖项的人。表面上是大和抚子，边界被踩到时会变得极主动、极固执。她递名片时双手托着，像递一件刚做好的衣服。",
          "tags": [
            "和服",
            "大和抚子",
            "固执"
          ],
          "hair": "#1E1A1E",
          "eyes": "#8E6BB5",
          "outfit": "#D9A6B8",
          "variant": 2
        },
        {
          "id": "tsuki-minato",
          "name": "柳之濑凑",
          "role": "游星的青梅竹马 · 菲利亚一年级",
          "quote": "我嗓门大，不代表我心里不细。",
          "bio": "柳之濑运输社长的三女儿，游星的青梅竹马，菲利亚一年级。粉色长直发，头顶大黑蝴蝶结，琥珀色眼睛，154 厘米，嗓门大、力气大，能从琵琶湖岸游到竹生岛再游回来。她为了游星一句「有女孩子味会更可爱」，开始留头发、学打扮，又请家庭教师学设计，考进菲利亚。真碰上事，她比谁都硬。她见到贵的东西会先喊出声，转头又装作没看见。",
          "tags": [
            "青梅竹马",
            "力气大",
            "直率"
          ],
          "hair": "#E8A8BC",
          "eyes": "#C98A3C",
          "outfit": "#C94F6D",
          "variant": 0
        },
        {
          "id": "tsuki-asahi",
          "name": "小仓朝日",
          "role": "樱公馆女仆 · 主角的伪装身份",
          "quote": "今天也请多指教，主人。",
          "bio": "主角在樱公馆使用的身份，一件女仆装、一套完整的礼数。她走路轻、说话软，被夸奖时会低头。越是做得自然，越说明背后练了多久。",
          "tags": [
            "女仆",
            "伪装",
            "认真"
          ]
        },
        {
          "id": "tsuki-luna",
          "name": "樱小路露娜",
          "role": "樱公馆主人 · 天才设计师",
          "quote": "可爱的东西我要。你也是——有意见吗？",
          "bio": "樱小路家的次女，樱公馆的主人，菲利亚服装设计科学生。银白及腰长直发，红瞳，皮肤透明得近乎病态，145 厘米，头两侧各一枚黑色缎面大蝴蝶结。她生来就是别人家里没有的颜色，被父亲关在港区的宅子里养大；喜欢的东西自己去挣，别人给的一律不算。她毒舌、怕晒，唯一拿得出手的料理是蛋包饭。她笑的时候压着嗓子，笑开了会一口气拖到底。",
          "tags": [
            "设计师",
            "毒舌",
            "怕晒"
          ],
          "hair": "#EDEAE4",
          "eyes": "#B03A3A",
          "outfit": "#3E4652",
          "variant": 2
        },
        {
          "id": "tsuki-yurs",
          "name": "尤希尔·弗露露·让梅尔",
          "role": "让梅尔伯爵家三女儿 · 露娜的宿敌",
          "quote": "承认吧，你刚才看我的设计看呆了。",
          "bio": "让梅尔伯爵家三女儿，菲利亚服装设计科一年级，露娜的宿敌。金色钻头卷，白色缎带，水蓝眼睛，157 厘米，站姿是芭蕾练出来的直线。她什么都要分出对错，输一次记一年，赢一次笑三段；傲慢是真的，礼貌也是真的。对才能极诚实：露娜的设计好，她当场承认；朝日的手艺好，她立刻加价挖人。她送人礼物时，会先把价签撕掉，再装作随手买的。",
          "tags": [
            "伯爵家",
            "自尊心",
            "芭蕾"
          ],
          "hair": "#E8D08A",
          "eyes": "#7FA8C4",
          "outfit": "#7A2F3F",
          "variant": 3
        }
      ],
      "timeline": [
        {
          "label": "二月 · 入馆",
          "text": "樱公馆的贴身女仆、灰蓝制服、第一张设计图。"
        },
        {
          "label": "春 · 菲利展",
          "text": "没有名次，只有被看见；后台的别针比掌声响。"
        },
        {
          "label": "秋 · 文化祭",
          "text": "化装咖啡店、主从界线、越来越薄的伪装。"
        },
        {
          "label": "来年 · 毕业",
          "text": "一件衣服是两个人做的，舞台只有一个。"
        }
      ],
      "openings": [
        {
          "id": "tsuki-open-doorbell",
          "title": "樱公馆的门铃",
          "place": "樱公馆 · 玄关",
          "time": "清晨 · 地板刚擦过",
          "mood": "紧张、樟脑与红茶",
          "text": "樱公馆的门铃比想象中轻。你站在玄关，手里拎着一只旧箱子，女仆装外面还套着外套。山吹八千代来开门，先看你的鞋，再看你的脸：「小仓朝日，对吧。进来吧，地板刚擦过。」屋里很暖，楼梯上传来脚步声。银白长发的少女停在半途，红瞳从扶手上方看下来，声音不高：「你就是新来的？抬起头，让我看看。」你把箱子换了只手，鞋底在地板上蹭了一下，发出很轻的声响。她没有催你。楼梯上的光落在她的发梢。"
        },
        {
          "id": "tsuki-open-cloth",
          "title": "布料店的重逢",
          "place": "表参道 · 布料店",
          "time": "午后 · 风铃响",
          "mood": "熟悉、暖色",
          "text": "表参道的布料店在午后没什么客人。你蹲在架子前挑里衬，指尖一排排摸过去。门口的风铃响了一声，有人在你旁边蹲下来，粉色长发垂到地上：「这个颜色，配露娜的图会不会太暖了？」你抬头，看见柳之濑凑正歪着头看你，琥珀色的眼睛亮得过分。她不等你答，又拿起另一卷：「算了，两卷都买。反正小游会付钱。」她把两卷布抱在怀里，站起来时差点撞到架子，笑声先出来了。店里的人都看过来。"
        },
        {
          "id": "tsuki-open-backstage",
          "title": "菲利展后台",
          "place": "菲利亚女子学院 · 后台",
          "time": "菲利展当天",
          "mood": "蒸汽、灯、倒计时",
          "text": "菲利展的后台，灯一排排亮着，空气里全是熨斗的蒸汽味。你替露娜整理裙摆，手指在腰线上停了一瞬——差半厘米，整件衣服的重心就会偏。她低头看你，红瞳里映着灯：「手别抖。」你说没有。她笑了一下，很短：「那就好。等会儿上台，你站在侧幕，不许走远。」帘子外面，业界的记者已经坐满了第一排。你应了一声，把最后一根别针藏进裙摆内侧。外面开始报幕。你退到侧幕，手心全是汗。你听见自己的呼吸。"
        }
      ]
    },
    {
      "id": "fly",
      "index": 4,
      "title": "Flyable Heart",
      "jp": "フライアブルハート",
      "tagline": "一座与外界只靠长桥相连的学园城市，和一台能跳过时间的装置。",
      "place": "凤缭兰学园 · 孤岛全住宿学园",
      "era": "2018 · 二月",
      "tags": [
        "学园",
        "孤岛",
        "科幻"
      ],
      "accent": "#FFB07A",
      "accent2": "#7FD9D2",
      "kicker": "ISLE OF THE FLYER",
      "intro": "凤缭兰学园占住整座岛：校舍、医院、食堂、购物中心与研究所都在桥的另一头，学生证就是身份，手机被携带终端取代。学生会与缭兰会分掌活动与资金，理事会与理事长在上面看着一切。葛木晶挂在学生会的「特别援助委员会」名下，住进缭兰会的女生宿舍；他身上的特殊基因、岛上的 Flyer，以及两套执行部的旧账，正把他推向同一场秋假。",
      "synopsis": "凤缭兰学园占住整座岛。校舍、讲堂、食堂、购物中心、医院都在围墙里，与外界只有一条笔直的长桥；岛上禁手机，学生证背面印着「食堂免费」。九月下旬，焰火大会的余波把葛木晶送到这里，他成了缭兰会接待的转校生——行李不多，记忆里却缺了一块。\n\n接待他的是缭兰会会长皇天音，和先他一周转来的稻羽结衣。结衣带他办手续、认路、去食堂，像把一只走失的猫领回窝。学生会管活动，缭兰会管钱和设施；缭兰祭前，全岛都在搭台、备货、排班。晶渐渐发现，这里的每个人都对他太熟：老师知道他的座位，食堂记得他的口味，连走廊尽头那扇门都像在等他。\n\n裂缝从一张空桌子开始。水无濑樱子的座位落了灰，宿舍里她的明信片、药袋、樱花贝全都不见了；只有晶还记得她。九条玖琉璃在研究科造一台叫 Flyer 的机器，能去五分钟后的未来，也能把苹果变成白砂；雪代铃乃则是一个只有少数人看得见的女孩，她说自己从未来来，是为了救他。\n\n岛上的日子越完整，晶越明白：这是一个「无限接近」的世界，有人被补进来，也有人被划出去。门后是另一侧，有父亲、有旧生活；这一侧有刚认识的人、有还没吃完的饭。他要做的不是分辨哪边是真的，而是决定，自己要被谁记住。",
      "theme": "被世界记住的方式",
      "cover": "",
      "cast": [
        {
          "id": "fly-yui",
          "name": "稻羽结衣",
          "role": "转校生 · 第一个朋友",
          "quote": "一个人吃饭，再好吃也会少一点味道哦。",
          "bio": "先晶一周转来的转校生，浅栗色齐肩发，白色雏菊发夹，身后一条浣熊尾巴装饰。她带晶办入学、认食堂、找宿舍，第二天一早又跑去叫人起床，两个人一起迟到，被罚扫会议室。她饭量惊人，却把这件事当成必须藏起来的缺陷；在食堂多要一碗之前，会先看一圈周围的脸。她记性极好，谁随口说过喜欢什么，她隔很久还能拿出来。",
          "tags": [
            "大胃王",
            "自来熟",
            "怕孤单"
          ],
          "hair": "#C9A88A",
          "eyes": "#8C2F3F",
          "outfit": "#D9A94E",
          "variant": 1
        },
        {
          "id": "fly-kururi",
          "name": "九条玖琉璃",
          "role": "研究科研究员 · MAXX 制作者",
          "quote": "给我一截头发。我需要证据，证明你是真的。",
          "bio": "研究科的研究员，缭兰会成员，也是 MAXX 的制作者。浅蓝双马尾，金瞳，头侧两枚会转动的机械发饰，白大褂口袋里塞着螺丝刀和折起来的图纸。她把人当研究对象：先量距离，再采头发，最后才决定要不要在意。饭按卡路里算，觉可以往后挪；说起自己造的机器，语气比说起人熟得多。她说话常在半空停住，像在等一个更准确的词。",
          "tags": [
            "天才",
            "机械",
            "不善表达"
          ],
          "hair": "#A8CBE0",
          "eyes": "#D9A93C",
          "outfit": "#E8E4DA",
          "variant": 3
        },
        {
          "id": "fly-suzuno",
          "name": "雪代铃乃",
          "role": "保健委员 · 沉默的观察者",
          "quote": "你不说，我也看得出来。",
          "bio": "话不多，视线却总落在别人没注意的地方。她随身带着创可贴和一小盒薄荷糖，替人处理伤口时手很稳。谁都说她温柔，只有她自己知道那是不擅长拒绝的另一种说法。",
          "tags": [
            "温柔",
            "寡言",
            "保健委员"
          ]
        },
        {
          "id": "fly-mayuri",
          "name": "白鹭茉百合",
          "role": "白鹭家独女 · 岛上的旧识",
          "quote": "这座岛太小了，小到藏不住任何事。",
          "bio": "白鹭家的独女，从小在这座岛上长大，知道哪条堤岸在退潮时会露出石头。她笑得体面，语气却总留半句。对她来说，岛不是牢笼，是一份必须守住的清单。",
          "tags": [
            "大小姐",
            "岛民",
            "留半句"
          ]
        },
        {
          "id": "fly-amane",
          "name": "皇天音",
          "role": "缭兰会会长",
          "quote": "别急着道谢。先把今天过完，剩下的明天再说。",
          "bio": "缭兰会会长，皇家的女儿，也是学生会长奏龙同父异母的妹妹。金发单马尾，笑起来像把整条走廊的灯都开亮。她管钱、管设施、管转校生，预算会议上一句「不行」就能让整张桌子安静。私底下却爱在宿舍厨房煮过甜的汤，把失败品推给玖琉璃试吃。她记得每个新生的名字，也记得谁昨天没来吃饭。她自己的那份便当，常常留到最后才吃。",
          "tags": [
            "会长",
            "明亮",
            "会照顾人"
          ],
          "hair": "#E8C56A",
          "eyes": "#C98A3C",
          "outfit": "#C94F6D",
          "variant": 0
        },
        {
          "id": "fly-sakurako",
          "name": "水无濑樱子",
          "role": "缭兰会 · 长期住院",
          "quote": "我在梦里见过你——所以，可以当作我们已经认识了吗？",
          "bio": "缭兰会第三个人，长期住院的病人。淡粉银长发，蓝眼，背后一只紫色大蝴蝶结；走路慢，走久了会喘，药袋里装着饭后要吞的胶囊。她在学园里被当成偶像围着看，本人毫无自觉。她做过一个很长的梦：病好了，出院了，进了缭兰会，遇见一个转校生。她第一次见到晶，问的是「我们在哪里遇到过吗」。她最怕的不是疼，是病房里一整天没人来的安静。",
          "tags": [
            "病人",
            "坦率",
            "好奇"
          ],
          "hair": "#E6CBD8",
          "eyes": "#6E9BC9",
          "outfit": "#B9A7D6",
          "variant": 2
        }
      ],
      "timeline": [
        {
          "label": "九月 · 入岛",
          "text": "长桥、无人巴士、一张没有照片的学生证。凤缭兰的秋假从十月二日开始。"
        },
        {
          "label": "十月 · 缭兰祭前",
          "text": "学生会与缭兰会各忙各的，limelight 的分店在商店街支起招牌。"
        },
        {
          "label": "十一月 · 裂缝",
          "text": "空掉的座位、被抹去的名字，以及研究科那台只去五分钟的机器。"
        },
        {
          "label": "门 · 另一侧",
          "text": "焰火、白砂、一个只有少数人看得见的女孩。留下或回去，都要自己开口。"
        }
      ],
      "openings": [
        {
          "id": "fly-open-bridge",
          "title": "长桥的尽头",
          "place": "凤缭兰学园 · 跨海长桥",
          "time": "九月下旬 · 黄昏",
          "mood": "海风、迟疑",
          "text": "无人巴士在桥中央停了一下，海风从车门缝里灌进来。你拎着行李，口袋里没有手机——学园发的携带终端还没有激活。桥那头的校门亮着两盏白灯，一个金发女生站在站牌下，手里转着一张学生证，像已经等了很久。她看见你，先笑，再把学生证递过来：「葛木晶，对吧？缭兰会的人都在等你。」你接过卡片，背面印着「学校食堂免费」，照片一栏却是空的。她把「欢迎」说得像一件早就安排好的事，你却不记得自己什么时候报过名。"
        },
        {
          "id": "fly-open-hallway",
          "title": "走廊里的半透明",
          "place": "缭兰会女生宿舍 · 走廊",
          "time": "夜里 · 熄灯前",
          "mood": "安静、微凉",
          "text": "宿舍走廊的灯只开了一半。你抱着换洗衣服往回走，看见墙角坐着一个人：银白长发，白得过分的校服，膝盖抱在胸前。她抬头看你，眼睛是浅金色的，像玻璃。「……你能看见我？」她问得很轻，先低头，又抬眼确认一次。你点头。她想了很久，才把名字一个字一个字拼出来：「铃乃……雪代，铃乃。」走廊尽头有扇窗没关，风把她的发梢吹起来，又放下。她站起来，跟在你身后半步，鞋底没有声音，像怕自己走快了就会散掉。"
        },
        {
          "id": "fly-open-flyer",
          "title": "五分钟后的报纸",
          "place": "研究科 · 展览区",
          "time": "缭兰祭前夜",
          "mood": "机器的低鸣",
          "text": "研究科的展览区只亮着一盏工作灯。九条玖琉璃站在机器旁边，白大褂袖子长出一截，手里拎着扳手。「手放上来。」她说，「只是五分钟。」机器的门打开，里面是暖的，像刚有人站过。你把手按上去，灯灭了一瞬，再亮起来时，她递给你一张报纸——日期是五天后，边角有一行小字，写着你的名字。她看着你的脸，补了一句：「不要问。问了，我也只能说是失败。」机器合上时，你在金属的反光里看见自己的脸，比记忆里旧了一点。"
        }
      ]
    },
    {
      "id": "kaoru",
      "index": 5,
      "title": "有少女涂彩的爱之芬芳",
      "jp": "乙女が彩る恋のエッセンス",
      "tagline": "两个月的期限，一口锅，一场必须扮成女孩子的料理修行。",
      "place": "舞城 · 舞城女学园",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "学园",
        "料理"
      ],
      "accent": "#E8A08E",
      "accent2": "#D9B45C",
      "kicker": "THE TASTE OF TWO MONTHS",
      "intro": "舞城是一座由天城财阀深深影响的繁华都市，舞城女学园则是城中那座门槛极高的名门女校。千原直人——也就是「朝仓千弘」——在料理学校读到三年级，却被天城家借去顶两个月的班：制服换成女装，身份改成女校的调理师，被识破就退学。厨房是他的战场，女仆长与大小姐们的餐桌则是另一套规矩。",
      "synopsis": "舞城女学园以料理与待客立校。调理室、食堂、女生宿舍的厨房，是这所学校真正的心脏；天城财阀的名字写在法人名册上，也写在每一场宴会的菜单里。二月十日，天城家的女调理师木下小姐因双胞胎临产休假，副厨千原直人受命去顶两个月的班。\n\n因为舞城是女校，他得先换一个名字。「朝仓千弘」，转校生，二年级，宿舍调理师——手续上早已作为女生编入，连制服都改好了。夫人另有一件私事托给他：女儿咲夜总找理由不回家，电话也不怎么接，请他暗中照看。他答应得很干脆，回宿舍的路上才想起来，自己连女装的尺码都还没量。\n\n学园的秩序比菜谱更细。学生会由朱里、咲夜、芹香、舞织撑着，前公主皋月卸任后仍在背后递话；秋天的舞蹈祭要选出新一年的「公主」，每人一朵大波斯菊假花，投给自认为最合适的人。厨房里，千弘从清晨备料站到熄灯，学会在裙摆边转身、在女孩子的笑声里不被看穿；食堂里，两百个胃口正好的学生每天准点涌进来。\n\n两个月的期限很短。舞蹈祭的灯亮起来，欢迎会的来宾从姐妹校抵达，初冬的风把落叶吹进校门。千弘要决定的是：两个月后，脱下这身制服，还是让「千弘」作为一个真实的人留下来。",
      "theme": "用一顿饭留住一个人",
      "cover": "",
      "cast": [
        {
          "id": "kaoru-sakuya",
          "name": "天城咲夜",
          "role": "学生会副会长 · 天城家独生女",
          "quote": "淑女不是不会慌张，只是慌张的时候也要把茶倒稳。",
          "bio": "天城财阀的独生女，舞城女学园二年级，学生会副会长。淡银白长发垂过腰际，黑发箍，蓝眼，举止端正，茶倒得比谁都稳。父亲常年在外，她学会了把表情管理成不添麻烦的样子；母亲托人照看她，她却只说「我没事」。她擅长在会议上一句话把跑偏的议题拉回来，唯独面对自己的心事，永远慢半拍。她背书极快，背完就把书合上，像怕被人看见用力。",
          "tags": [
            "副会长",
            "完美主义",
            "不坦率"
          ],
          "hair": "#E8E4DC",
          "eyes": "#5B8FBF",
          "outfit": "#8B6FA8",
          "variant": 2
        },
        {
          "id": "kaoru-chihiro",
          "name": "朝仓千弘",
          "role": "千原家的长女 · 料理人",
          "quote": "一顿饭而已，我做得出来。",
          "bio": "千原家的长女，把厨房当成自己的房间。她做菜时几乎不说话，端上桌却会盯着人吃第一口。温和、耐性极好，只有被人抢了锅铲时才会真正生气。",
          "tags": [
            "料理",
            "长女",
            "沉稳"
          ]
        },
        {
          "id": "kaoru-serika",
          "name": "冰堂芹香",
          "role": "学生会书记 · 「纯白公主的妹妹」",
          "quote": "我想被看见的，不是姐姐的影子，是我自己。",
          "bio": "一年级，学生会书记，舞城女学园的「纯白公主的妹妹」。浅棕超长双马尾，黑色蝴蝶结，橙棕眼睛，认真到把笔记做成字典。姐姐是传奇毕业生，她走到哪里都被叫作「纯白公主的妹妹」；为了追上那个影子，她报满茶道、书法、插花与日式舞蹈，最后累倒在宿舍。被皋月捡起来之后，她开始学着只做自己。她说话前会先深吸一口气，像给自己数三下。",
          "tags": [
            "书记",
            "认真",
            "容易害羞"
          ],
          "hair": "#C9B49A",
          "eyes": "#B5763C",
          "outfit": "#3A3330",
          "variant": 3
        },
        {
          "id": "kaoru-satsuki",
          "name": "牧濑皋月",
          "role": "前学生会长 · 去年的公主",
          "quote": "别站那么直。偶尔靠过来一点，我不会笑话你。",
          "bio": "三年级，前学生会长，去年的公主「伊莉丝」。深蓝长发垂到腰际，发间一朵红花，蓝眼，走路慢半拍，房间乱得理直气壮。她擅长把容易被误会的孩子捡回自己的羽翼下——朱里、芹香、乃亚都是这样被她捡走的。卸任前她指名朱里继任，理由是「我想看看不像舞城风格的舞城」。她爱吃蜂蜜，睡前也要舔一勺。她记得每个人身上不同的气味，也记得谁在硬撑。",
          "tags": [
            "前会长",
            "慵懒",
            "会看人"
          ],
          "hair": "#2E3F63",
          "eyes": "#5B8FBF",
          "outfit": "#7A2F3F",
          "variant": 2
        },
        {
          "id": "kaoru-noa",
          "name": "千原乃亚",
          "role": "千原家次女 · 味觉灵敏",
          "quote": "这个味道……是我姐姐的吧。",
          "bio": "千原家的次女，舌头比谁都灵，能尝出“做菜的人当时在想什么”这种说不清的东西。她说话轻，提问却常常直击要害。对姐姐的料理，她既想靠近又想超过。",
          "tags": [
            "味觉",
            "妹妹",
            "敏感"
          ]
        },
        {
          "id": "kaoru-akari",
          "name": "夏目朱里",
          "role": "学生会长 · 新任公主",
          "quote": "人越多我越安心。所以，把桌子拼起来一起吃吧！",
          "bio": "二年级，学生会长，新任公主「蒲公英」。玫红色高马尾，黄色发带，蓝眼，嗓门大得隔壁学生会室都听得见。她在一大家子里长大，做饭要按锅算，所以走到哪里都先把桌子拼起来。她不是能力最强的那个，却总能把人聚在身边；一紧张就笑，一笑就停不下来，眼泪来得比谁都快，哭完立刻爬起来想下一个办法。她抱人之前从不打招呼，手臂先到。",
          "tags": [
            "会长",
            "自来熟",
            "爱哭"
          ],
          "hair": "#C94F6D",
          "eyes": "#5B8FBF",
          "outfit": "#E0B33C",
          "variant": 0
        }
      ],
      "timeline": [
        {
          "label": "二月 · 顶班",
          "text": "木下小姐临产，天城家的副厨换了一个名字。"
        },
        {
          "label": "春 · 转学",
          "text": "二年级教室、女生宿舍、调理室的第一份菜单。"
        },
        {
          "label": "秋 · 舞蹈祭",
          "text": "大波斯菊假花、公主的爱称、全校的舞步。"
        },
        {
          "label": "初冬 · 期限",
          "text": "两个月的班快要结束，制服还回去之前，总得说清楚。"
        }
      ],
      "openings": [
        {
          "id": "kaoru-open-kitchen",
          "title": "厨房的第一天",
          "place": "舞城女学园 · 调理室",
          "time": "清晨 · 天未亮",
          "mood": "黄油与火",
          "text": "调理室的天还没亮透，黄油在锅里化开的声音已经很清楚了。你系上围裙，把头发塞进帽子里，手指在背后打了个结——这是「朝仓千弘」的第一天。八云把一筐洋葱推过来，眼神像在称你的分量：「切得匀一点。学生们十一点下课。」窗外，宿舍的灯一层层亮起来；你听见有女孩在走廊上笑，声音越来越近，又拐进了食堂。八云不再说话，把一把刀放在你面前，刀柄朝着你。你握住，手心出了汗。"
        },
        {
          "id": "kaoru-open-council",
          "title": "学生会室的茶",
          "place": "舞城女学园 · 学生会室",
          "time": "午后 · 窗开着",
          "mood": "试探、红茶",
          "text": "学生会室的窗开着，红茶的热气一直往窗外飘。夏目朱里把一叠文件摊在桌上，先给你倒茶，再问：「千弘同学，你觉得舞蹈祭的菜单，应该先照顾谁？」你还没答，天城咲夜已经从旁边抽走一张预算表，用铅笔在某一行画了个圈：「先算钱。算完再谈照顾。」她抬头看你，目光很稳，「转校生，你站哪边？」朱里把茶推到你面前，杯底在桌面上轻轻一响，像给这个问题盖了个章。咲夜没有笑，只等你开口。"
        },
        {
          "id": "kaoru-open-festival",
          "title": "大波斯菊投票",
          "place": "舞城女学园 · 校庭",
          "time": "秋日 · 黄昏",
          "mood": "花、灯、掌声",
          "text": "舞蹈祭的灯从校庭那头一盏盏亮起来，大波斯菊的假花堆在入口，红的、粉的、白的。学生们排着队，把花递给自认为最合适的人。你站在调理室的窗口，手上还沾着糖粉。夏目朱里从人群里挤过来，发带歪了，脸也红了，把最后一朵花塞进你手里：「别问。拿着就好。」远处，牧濑皋月靠在柱子上笑，像是早就知道会这样。你低头看那朵花，花瓣是纸做的，边缘被谁捏得有点皱。人群那头有人喊她的名字，她没回头。"
        }
      ]
    },
    {
      "id": "waltz",
      "index": 7,
      "title": "樱舞少女的轮舞曲",
      "jp": "桜舞う乙女のロンド",
      "tagline": "一年只开一次的樱花祭，一支舞的时间够藏下多少秘密。",
      "place": "樱花女学园 / 菊花学园",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "学园",
        "都市"
      ],
      "accent": "#B23A4E",
      "accent2": "#D9B36C",
      "kicker": "ONE DANCE, ONE SPRING",
      "intro": "樱花女学园与菊花学园隔街相望，只在每年轮换的学园祭上互相开门。樱花祭的舞会在樱花大厅举行，男方邀请女方，拒绝自由却算失礼；樱花馆前的冬樱树还留着「一起跳过舞的两人会缔连」的传说。真原葵随父亲回国，妹妹祐里受不住赤道的紫外线，伯母便提出那个改变一切的主意：哥哥女装，陪妹妹一起进女校。",
      "synopsis": "樱花女学园与菊花学园是姐妹校，一所女校，一所男校，只在每年轮换举办的学园祭上互相往来。樱花祭那晚，樱花大厅里办舞会，男方邀请女方跳舞，拒绝虽是自由，却算失礼；樱花馆前那棵冬天开花的冬樱树下，传说一起跳过舞的两个人会缔连。\n\n真原葵随父亲的工作调动回国。妹妹祐里体弱，受不住赤道附近的紫外线，他以「祐里不能去」为由，把两个人的落脚点改回了日本。伯母是樱花女学园的学园长，接手转学手续那天，提出了那个改变一切的主意：哥哥女装，陪妹妹一起进女校。\n\n樱花会不经选举，由现役干事指名继任。新一届名单出来时，全校都震了一下：小峰真奈美任会长，真原葵任副会长，祐里任书记，江利原美月任会计，门胁樱任会长助理——姐妹俩同时就任，是校史上第一次。前辈天司凉香把会长之位交出去，留下的只有堆积如山的纸质文件和一句「别让我失望」。\n\n樱花祭前，搭讪事件接连发生，签名运动从二年级开始，「禁止菊花学生参加」的声音越滚越大。樱花会要在一周内决定，是缩起来办一场安全的祭典，还是让全校亲耳听见一个理由。舞会那晚，冬樱开不开，没有人能保证；但音乐响起来的时候，总有人要先伸出手。",
      "theme": "被指名的人",
      "cover": "",
      "cast": [
        {
          "id": "waltz-mizuki",
          "name": "江利原美月",
          "role": "舞蹈部 · 首席",
          "quote": "舞步错了可以重来，人不行。",
          "bio": "舞蹈部的首席，脚步比说话利落。她把每一次排练都当成正式演出，也把每一次失误记得很久。对主角的指导很严，收工后却会留下来替人揉脚踝。",
          "tags": [
            "首席",
            "严格",
            "舞者"
          ]
        },
        {
          "id": "waltz-sakura",
          "name": "门胁樱",
          "role": "樱花会会长助理",
          "quote": "茶要趁热。话可以慢慢说，但茶不会等人。",
          "bio": "樱花会会长助理，由会长亲自指名。金栗色长发，发梢泛粉紫，红簪与金色花饰，暗红眼睛，气质端庄。她管事务室的钥匙、文件和红茶；自带小巧便当，泡茶是她的定番。她不是最耀眼的那个，却把每一件小事都收得妥帖——文件按日期排好，茶杯永远朝向拿的人。便当盒里每样菜都码得整整齐齐，像一份小小的公文。",
          "tags": [
            "助理",
            "端庄",
            "细致"
          ],
          "hair": "#C9A05C",
          "eyes": "#8C2F3F",
          "outfit": "#6B2A38",
          "variant": 2
        },
        {
          "id": "waltz-suzuka",
          "name": "天司凉香",
          "role": "前樱花会会长 · 「魅影玫瑰」",
          "quote": "别把我的客气当成许可。也别把许可当成客气。",
          "bio": "前樱花会会长，被低年级学生称作「魅影玫瑰」。深紫蓝及腰长直发，蓝眼，眼形细长，气场凛然；酒红短外套配黑丝带，讨厌男人。她把樱花会交给真奈美，留下的只有堆积如山的纸质文件和一句「别让我失望」。她走路很直，说话很短，偶尔在事务室门口停一下，确认灯还亮着。她不太解释自己，也不喜欢别人替她解释。",
          "tags": [
            "前会长",
            "凛然",
            "嘴硬"
          ],
          "hair": "#3A3A5C",
          "eyes": "#5B8FBF",
          "outfit": "#5A1F2E",
          "variant": 2
        },
        {
          "id": "waltz-manami",
          "name": "小峰真奈美",
          "role": "樱花会会长",
          "quote": "这不是命令。是我这辈子第一次，想请一个人留下来。",
          "bio": "樱花会会长，前任会长天司凉香亲自推荐的继任者。粉色长发束成侧马尾，黄红小花发饰，紫水晶眼睛，走路带风，独处时会伸懒腰打哈欠。她小时候被邻居家的哥哥用颠倒的樱花结系过气球，记了很多年。她能在几百人面前演讲，却要在纸条上写聊天地址时红着脸说「告辞了」。她认得人靠细节：一个结、一步舞、一句话的尾音。",
          "tags": [
            "会长",
            "凛然",
            "藏不住"
          ],
          "hair": "#E8A8BC",
          "eyes": "#8E6BB5",
          "outfit": "#7A2F3F",
          "variant": 0
        },
        {
          "id": "waltz-wakana",
          "name": "新垣若菜",
          "role": "新垣家独女 · 舞会赞助人",
          "quote": "钱能买到的，我都不稀罕。",
          "bio": "新垣家的独女，说话时习惯抬着下巴。她出钱办舞会，却从不跳舞。真正让她在意的，是有人敢不按她的安排走。",
          "tags": [
            "独女",
            "高傲",
            "赞助人"
          ]
        },
        {
          "id": "waltz-aoi",
          "name": "真原葵",
          "role": "真原家次女 · 姐姐的影子",
          "quote": "姐姐跳得比我好，可我不服。",
          "bio": "真原家的次女，从小到大被人拿去和姐姐比较。她把不甘心藏在笑容里，练舞时练到最后一个走。她要的不是赢过谁，是有人先看见她。",
          "tags": [
            "次女",
            "好胜",
            "不服输"
          ]
        },
        {
          "id": "waltz-yuri",
          "name": "真原祐里",
          "role": "樱花会书记 · 葵的妹妹",
          "quote": "姐姐，别回头。你一回头，我就演不下去了。",
          "bio": "真原葵的妹妹，樱花会书记。浅金褐齐肩短发，发梢泛淡粉，白色蕾丝缎带，紫水晶眼睛，体弱，怕紫外线。转学那天她见到哥哥，第一句话是「对不起」——因为女装入学的「姐姐」，是为了陪她才回日本的。她安静、乖巧，却能在哥哥失态时一针见血；她想为大家做事，不只是被照顾。她喝热牛奶要小口小口地抿，杯沿总留一圈白。",
          "tags": [
            "妹妹",
            "体弱",
            "体贴"
          ],
          "hair": "#D9C9A8",
          "eyes": "#8E6BB5",
          "outfit": "#7A2F3F",
          "variant": 1
        }
      ],
      "timeline": [
        {
          "label": "九月 · 归国",
          "text": "樱花寮的晚餐、转学手续、伯母的主意。"
        },
        {
          "label": "秋 · 指名",
          "text": "樱花会换届，姐妹同时就任，校史上第一次。"
        },
        {
          "label": "樱花祭前 · 签名",
          "text": "搭讪事件、联名信、「禁止菊花学生参加」。"
        },
        {
          "label": "冬樱 · 舞会",
          "text": "一支舞的时间，够不够把话说清楚。"
        }
      ],
      "openings": [
        {
          "id": "waltz-open-dinner",
          "title": "樱花寮的晚餐",
          "place": "樱花寮 · 食堂",
          "time": "傍晚 · 开饭前",
          "mood": "热闹、炖菜的热气",
          "text": "樱花寮的食堂在傍晚最热闹。长桌上摆着亮子小姐的炖菜，热气把窗玻璃糊白。真原祐里坐在你对面，捧着一杯热牛奶，小口小口地喝；真原葵在旁边替她拆面包，动作熟得像做过一千次。「今天有新生来。」祐里说，眼睛却看着门口，「姐姐，你紧张吗？」葵把面包递过去，笑得有点勉强：「不紧张。只是裙子有点短。」桌下，有人轻轻踢了他一脚。祐里把牛奶杯放下，杯底在桌上转了一小圈才停。葵低头笑了一下，耳朵有点红。"
        },
        {
          "id": "waltz-open-office",
          "title": "樱花馆的文件山",
          "place": "樱花馆 · 事务室",
          "time": "放学后 · 灯亮着",
          "mood": "纸、红茶、截止日",
          "text": "樱花馆的事务室堆满了纸。预算表、场地申请、邀请函名单，一摞摞码到窗台。门胁樱把红茶放在你手边，杯柄朝着你，自己坐回文件后面：「先看这一份。菊花学园的入场名单，今年比去年多了三十人。」江利原美月从书后露出半张脸，指尖抵着下巴：「多出来的人，谁批的？」窗外，樱花祭的脚手架已经搭到大厅门口。美月把书合上，露出整张脸：「我去问。反正今天也不想看书。」樱说，茶要凉了。"
        },
        {
          "id": "waltz-open-tree",
          "title": "冬樱树下",
          "place": "樱花馆前 · 冬樱",
          "time": "樱花祭夜 · 散场前",
          "mood": "雪、远处的铜管",
          "text": "冬樱树下没有灯，只有大厅窗户漏出来的一点光。舞会进行到第三支曲子，铜管的声音隔着墙，闷闷的。你站在树下，雪落在肩上，不化。有人从台阶上走下来，礼服的下摆扫过石阶：「你在这里。」是门胁樱，手里还拿着两杯没送出去的红茶。她把其中一杯递给你，抬头看那棵树：「今年也没开。不过，传说又没说，一定要开。」她把杯子往你手里又送了送：「拿着吧。反正也送不出去了。」雪落在杯沿，很快化了。"
        }
      ]
    },
    {
      "id": "tsumi",
      "index": 10,
      "title": "美少女万华镜4",
      "jp": "美少女万華鏡 -罪と罰の少女-",
      "tagline": "同一张脸的双胞胎，和一座不肯放过他们的旧宅。",
      "place": "田园调布 · 圣卡塔丽娜女子学园",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "悬疑",
        "学园"
      ],
      "accent": "#C2162C",
      "accent2": "#C19A56",
      "kicker": "THE MIRROR REMEMBERS",
      "intro": "东京田园调布的觋家旧宅去年烧掉一半，母亲夕香里在火里死去；兄妹搬到下町的公寓，夕摩被当作夕莉的双胞胎妹妹送进圣卡塔丽娜女子学园。父亲礼次郎把家当领地，姐姐夕莉把「只属于我」当护身符，而夕摩醒来时总缺一块记忆。罪与罚不是一场审判，是这家人每天吃饭、上学、关门的方式。",
      "synopsis": "深山温泉旅馆的走廊尽头，有一间人称「人偶之屋」的客房。灵异作家深见夏彦第四次走上那条山路，在摆满日本人偶的房间里遇见莲华——一个只穿和服、只有他看得见的少女。她把一只万华镜递过来，说不会有事的，因为有她在。\n\n镜子里是另一段人生。田园调布，觋家的洋馆；去年一场火烧掉一楼，母亲在火里自焚，父亲礼次郎每天醉着回家。双胞胎夕莉与夕摩搬进下町一间普通的 3LDK，客厅干净得像样品屋，从那里坐地铁到圣卡塔丽娜女子学园只要十分钟，电车中途会开回地面。\n\n夕摩以「妹妹」的身份转学进去。这所天主教女校只收女生，校服是白色水手服，食堂像高级酒店的自助餐；夕莉是学年第一，走到哪里都有人喊「夕莉大人」，她曾经是偶像小尤莉娅。文艺部只剩御殿场镜子一个人，她用四条怪谈守着一间快废部的部室；铃森伊千果在游乐园的长椅前贫血倒下，后来成了夕摩第一个敢开口交朋友的人。\n\n罪有三层：近亲、弑亲、操纵。罚由两个孩子自己认领。鸟笼是这个故事的核心意象——母亲被父亲困住，夕摩被母亲困住，谁都没有成功。镜子合上时，深见在「人偶之屋」醒来，什么都不记得；莲华还站在原地，说，说不定你果然是这边的人。",
      "theme": "笼子是自己造的",
      "cover": "",
      "cast": [
        {
          "id": "tsumi-ichika",
          "name": "铃森伊千果",
          "role": "同班同学 · 文艺部",
          "quote": "我可以坐在这里吗？就一会儿，不说话也可以。",
          "bio": "圣卡塔丽娜高二学生，文艺部部员，原网球部。亚麻金短发到下颌，一侧低马尾，蓝眼，150 厘米，小圆脸，刘海别一枚黑色 X 形发夹。她想写童话，喜欢连环画，说得出一个根本不存在的芥川奖书名。被网球部的朋友疏远后，她先检讨自己，再当面去问；在游乐园贫血倒下时，她把夕摩叫作「神明大人」。她道歉比解释先出口，被起绰号会先抗议再接受。",
          "tags": [
            "文艺部",
            "怯生生",
            "认真"
          ],
          "hair": "#C9B49A",
          "eyes": "#5B8FBF",
          "outfit": "#E8DCC8",
          "variant": 1
        },
        {
          "id": "tsumi-yuri",
          "name": "觋夕莉",
          "role": "双胞胎姐姐 · 学年第一",
          "quote": "姐姐这个称呼，比任何名字都更牢固。",
          "bio": "觋家的女儿，夕摩的双胞胎姐姐，圣卡塔丽娜高二学年第一。淡金近白的长直发垂到腰际，翠绿大眼，160 厘米，笑起来眼弯成浅弧，盯人时那双眼会冷下来。她曾经是偶像「小尤莉娅」，退出的原因不解释。她把「姐姐」这个身份用得极稳：命令用疼爱包着给，惩罚用关心包着给，破功点是被当面道谢。她做菜时哼歌，刀落在砧板上的声音很轻。",
          "tags": [
            "姐姐",
            "优等生",
            "支配"
          ],
          "hair": "#EFE6D2",
          "eyes": "#4F8C5E",
          "outfit": "#E8E4DC",
          "variant": 2
        },
        {
          "id": "tsumi-yuma",
          "name": "觋夕摩",
          "role": "觋家养子 · 主角",
          "quote": "我不记得那天晚上发生了什么。",
          "bio": "觋家的养子，醒来时总缺一块记忆。他说话谨慎，习惯先观察再开口。别人说他运气好，只有他自己知道，有些事被记住了才叫惩罚。",
          "tags": [
            "养子",
            "失忆",
            "谨慎"
          ]
        },
        {
          "id": "tsumi-mirror",
          "name": "御殿场镜子",
          "role": "文艺部部长 · 保健委员",
          "quote": "我看见了哦。你们刚才那一下，很百合。",
          "bio": "圣卡塔丽娜高二学生，文艺部唯一的旧部员兼部长，保健委员。过腰黑长发，长刘海横盖半张脸，只露一只浅褐半睁眼，157 厘米。她用四条怪谈守着一间快废部的部室：半夜的怪声、不灭的灯、黑幕布、冷飕飕——全是她自己搞的。她给夕莉起名「百合公主」，被夸可爱就把感激说到「连饭都能吃上三倍量」。她说话常以省略号起头，话题说脱线也不急着拉回。",
          "tags": [
            "部长",
            "电波",
            "怕孤单"
          ],
          "hair": "#1E1A22",
          "eyes": "#A88C6A",
          "outfit": "#3A2E3E",
          "variant": 2
        }
      ],
      "timeline": [
        {
          "label": "二月 · 转学",
          "text": "白色水手服、草绿领巾、以妹妹的名字走进女校。"
        },
        {
          "label": "春 · 文艺部",
          "text": "四条怪谈、一个部长、两个新部员。"
        },
        {
          "label": "秋 · 文化祭",
          "text": "旧宅、医院、父亲与舅舅，事情开始对不上。"
        },
        {
          "label": "镜 · 合上",
          "text": "鸟笼、罚、以及醒来后什么都不记得的人。"
        }
      ],
      "openings": [
        {
          "id": "tsumi-open-dolls",
          "title": "人偶之屋",
          "place": "深山温泉旅馆 · 人偶之屋",
          "time": "深夜 · 雨",
          "mood": "镜、纸门、凉",
          "text": "人偶之屋的纸门半开着。走廊上没有风，灯却晃了一下。你坐在榻榻米上，面前摆着一只万华镜，筒身缠着旧布，花纹已经磨得看不清。莲华跪坐在对面，黑发铺在膝上，翠绿的眼睛一眨不眨：「看之前，我要先说好。不管看见什么，都不要怪自己。」她把手放在镜筒上，指尖很凉，「因为那里面的事，不进这边。」她把镜子推到你面前，自己往后退了半步，像给你让出一条路。纸门外，雨声很密。"
        },
        {
          "id": "tsumi-open-apartment",
          "title": "下町的公寓",
          "place": "下町 · 3LDK",
          "time": "清晨 · 太干净",
          "mood": "空、钥匙、衣领",
          "text": "下町的公寓在清晨显得太干净。客厅里没有一张多余的纸，厨房的台面擦得发亮，像没有人住过。你站在玄关，钥匙还插在锁孔里；夕莉从里面出来，白金色的长发已经梳好，校服领巾打得一丝不乱：「早饭在桌上。吃完就走，第一节不能迟。」她经过你身边时停了一下，替你把衣领翻正，手指在你脖子上停了半秒。你看着她的背影，忽然想起这间屋子以前不是这样干净的。冰箱上贴着一张便签，字迹很工整。"
        },
        {
          "id": "tsumi-open-club",
          "title": "文艺部的灯",
          "place": "圣卡塔丽娜 · 文艺部室",
          "time": "放学后 · 灯管闪",
          "mood": "怪谈、吊坠",
          "text": "文艺部的部室在放学后最安静。窗帘拉着，灯管闪了两下才稳住。御殿场镜子坐在长桌尽头，黑发遮住半张脸，手里转着一只吊坠：「你听说了吗？半夜的怪声，不灭的灯，还有那块黑幕布。」她顿了顿，露出来的那只眼睛弯了一下，「其实都是我。」铃森伊千果在旁边小声补了一句：「镜子同学，这次能不能不要吓人……」她把书包抱在胸前，往你这边挪了挪，像在找一个人挡住风。镜子把吊坠收进掌心。"
        }
      ]
    },
    {
      "id": "hanako",
      "index": 11,
      "title": "有点嚣张的厕所花子小姐",
      "jp": "ちょっとナマイキなトイレの花子さん",
      "tagline": "三楼女厕所的第三个隔间，住着一个会跟你算账的幽灵。",
      "place": "日本 · 乡间学园町",
      "era": "2018 · 二月",
      "tags": [
        "幽灵",
        "学园",
        "乡土"
      ],
      "accent": "#B03A4A",
      "accent2": "#D9B36C",
      "kicker": "THE THIRD STALL",
      "intro": "这所学园建在远离都市的乡下，学生少到每一张脸都记得住。三楼女厕所的第三个隔间里住着「厕所里的花子」：她靠吸取活人的「生气」攒转生的份额，用幽手机和幽灵图经营自己的社会，也把拿住一个男老师的把柄做成了带名字的「刑罚」。她最初走不出那一格厕所，却一直在算，怎么把脚步挪到整座学园，再挪到镇上。",
      "synopsis": "这所学园建在远离都市的乡下，学生少到每一张脸都记得住。三楼女厕所的第三个隔间里，住着「厕所里的花子」——一个外表十七八岁、深黑褐色长发、红瞳的幽灵。她最初走不出那一格厕所，只能靠多年打扫换来的活动范围，一点点把脚步挪到走廊、教室和操场。\n\n幽灵维持存在、最终「转生」，靠的是从活人身上吸取「生气」。花子把这套规则做成了自己的生意：幽灵专用的「幽手机」、幽灵之间流行的 SNS「幽灵图」、还有南瓜公司制造的幽灵商品。她拿住一个被调来这所学园的男老师，把把柄做成了带名字的「刑罚」——生气银行之刑。她不杀人，只要一点点；她要的不是一次性的掠夺，而是能持续很久的关系。\n\n她一边说幽灵不需要遵守人类的伦理，一边认真教学生怎么把教室打扫干净；一边拿照片威胁人，一边把「能遇见你真是太好了」说得真心。故事从一间厕所开始，走到整座学园，再走到傍晚的镇上。",
      "theme": "从一格厕所走到整座学园",
      "cover": "",
      "cast": [
        {
          "id": "hanako-hanako",
          "name": "花子",
          "role": "厕所里的花子 · 三楼女厕所第三个隔间",
          "quote": "嗯，我是花子。在世间被称为厕所里的花子。",
          "bio": "附在这所乡下学园女厕所隔间的幽灵，外表十七八岁，深黑褐色长发、红瞳、肤色近乎没有血色。她靠吸取活人的「生气」攒转生的份额，把整套流程做成了带名字的「刑罚」；拿住一个被调来的男老师之后，她要的不是一次性的掠夺，而是能持续很久的关系。她说话调子懒、句尾拖长，损人极狠，真在意的人反而只把最实在的话说出来。",
          "tags": [
            "幽灵",
            "雌小鬼",
            "算计"
          ],
          "hair": "#2A1A1C",
          "eyes": "#C23A3A",
          "outfit": "#7A1F2A",
          "variant": 0
        }
      ],
      "timeline": [
        {
          "label": "二月 · 第三个隔间",
          "text": "推门进去，她就在里面。"
        },
        {
          "label": "日常 · 生气银行",
          "text": "幽手机、幽灵图、带名字的刑罚。"
        },
        {
          "label": "攒够 · 学园内",
          "text": "从一格厕所，走到整座学园。"
        },
        {
          "label": "傍晚 · 镇上",
          "text": "第一次被带出去，回来的路上聊了很多。"
        }
      ],
      "openings": [
        {
          "id": "hanako-open-stall",
          "title": "第三个隔间",
          "place": "学园 · 三楼女厕所",
          "time": "放学后 · 走廊空了",
          "mood": "消毒水、旧门板、操场哨声",
          "text": "三楼女厕所的第三个隔间，门板比别的隔间旧一层。放学后的走廊已经空了，窗外的操场还有哨声。你推开门，隔间里没有水声，只有一个黑发红瞳的少女坐在水箱上，垂着眼看你。她笑了一下，嘴角先动，眼睛后弯：「嗯，我是花子。在世间被称为厕所里的花子。」她跳下来，鞋底落地几乎没有声音，「你来得正好。我有件事，想跟你算一算。」"
        },
        {
          "id": "hanako-open-office",
          "title": "职员室的传票",
          "place": "学园 · 职员室",
          "time": "午休 · 打印机在响",
          "mood": "打印纸、手机震动、走廊",
          "text": "午休的职员室只剩打印机在响。你的手机震了一下，屏幕上跳出一条没有号码的消息：「来三楼。现在。」后面跟着一张照片——你昨天进女厕所时被拍下的背影。你抬头，窗外的走廊空无一人。第二条消息很快又来了：「我在第三个隔间等你哦。别让学生看见。」"
        },
        {
          "id": "hanako-open-town",
          "title": "傍晚的镇道",
          "place": "学园后门 · 镇道",
          "time": "傍晚 · 路灯刚亮",
          "mood": "晚风、贩卖机、很慢的脚步",
          "text": "傍晚的镇道，路灯一盏一盏亮起来。花子走在你前面半步，深黑褐色的长发被晚风吹得贴在脸侧。她走得很慢，像在确认每一块路砖都是真的。走到镇口的自动贩卖机前，她停下，回头看你：「今天谢谢你带我出来。能遇见你真是太好了。」她说完又别过脸，补了一句，「别误会，我只是在算，下次还能不能让你请客。」"
        }
      ]
    },
    {
      "id": "canvas",
      "index": 6,
      "title": "少女编织爱的画布",
      "jp": "乙女が紡ぐ恋のキャンバス",
      "tagline": "海港城市的画，一半挂在画廊，一半流进夜间竞标会。",
      "place": "凤市区 · 海港艺术城市",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "艺术",
        "都市"
      ],
      "accent": "#2F7E9E",
      "accent2": "#E3A857",
      "kicker": "CITY OF LINES AND LIGHT",
      "intro": "凤市区是一座临海的艺术学院都市：画廊街、工坊地区、办公大楼街与港口各自运转，凤画廊与乌丸集团分守传统与现代两端。瑞木信替姐姐杷虎画了成名的早期作品，又把自己藏进「深山瑞希」这个名字里；乌丸紫月的夜间竞标会不公布目录，只接受现场出价。一幅画要不要署名，一个人要不要站出来，都会在这座城里被标价。",
      "synopsis": "凤市区是一座以画为业的城市。画廊街沿街排着画具店与传统画廊，工坊区聚着小工作室，办公大楼街的灯为金融机构亮到深夜；每年十月末的艺术博览会，全城画廊都要参展，压轴是那场不公布目录的夜间竞标会。\n\n凤后艺术学园只收女生，分画商与艺术家两个学区，学籍里还有「女仆奖学金学生」这种名目——让无法以普通身份入学的人，以宿舍女仆兼在校生的方式留下来。瑞木信就是其中一个。他顶着女仆的围裙，替小姐们开门、熨衣、泡茶；没人知道日本画坛最强的瑞木杷虎，早期全部绘画作品都出自她弟弟之手。\n\n凤怜奈是代理校长，也是凤画廊的经营者。母亲死于十多年前的客机事故之后，她有两年分不清颜色，连声音也听不见；把她拉回来的，是幼年时一个短发女孩泼在校舍墙上的那片青蓝。狮子堂千晴是她的贴身护卫，四色型色觉让她看见别人看不见的颜色，也让她从小被叫作怪物。乌丸紫月主持竞标会，能在几秒内给一幅画定价，也能在几秒内把一个人贬到尘埃里；她唯一不肯用价钱衡量的，是信很多年前为她画的那片天空。\n\n十月，窃案、竞标、博览会与收购战接连爆开。信可以继续做一个没有名字的人，也可以站出来，让画署上自己的名字。这座城给每幅画标价，只有他还没决定，自己值多少。",
      "theme": "署名",
      "cover": "",
      "cast": [
        {
          "id": "canvas-anastasia",
          "name": "安娜塔西亚",
          "role": "伊迪那罗古美术馆馆长",
          "quote": "美术馆的门开着。你随时可以进来，也随时可以什么都不看。",
          "bio": "伊迪那罗古美术馆馆长，艺术博览会主任，凤后班主任约翰的家人。银白及腰长卷发，紫眼，粉色发箍，气质温和，身段高挑。她家是黑手党的名门，也经营美术馆；她把这两件事分得很开——馆里只谈画，馆外才谈别的。她记得每一件藏品的来路，也记得哪个学生第一次走进展厅时，在哪幅画前停得最久。她说话慢，走路也慢，像在等一幅画自己开口。",
          "tags": [
            "馆长",
            "温和",
            "有来路"
          ],
          "hair": "#E4E1D8",
          "eyes": "#8E6BB5",
          "outfit": "#D9A6B8",
          "variant": 2
        },
        {
          "id": "canvas-rena",
          "name": "凤怜奈",
          "role": "凤后艺术学园代理校长",
          "quote": "这幅画不卖。它让我想起天空原本是什么颜色。",
          "bio": "凤家的独生女，凤后艺术学园代理校长，凤画廊的经营者。红褐长发，青金石色的眼睛，仪态像王者，私底下却连手机电话簿都不会用。母亲死于客机事故后，她有两年分不清颜色，连声音也听不见；把她拉回来的，是校舍墙上一片不断扩展的青蓝。她看到好画就走不动路，对现代艺术完全没辙。她记不住电话号码，却记得每一幅画挂在墙上的位置。",
          "tags": [
            "代理校长",
            "不坦率",
            "爱画"
          ],
          "hair": "#A8543C",
          "eyes": "#2E5C8A",
          "outfit": "#7A2E3A",
          "variant": 2
        },
        {
          "id": "canvas-akie",
          "name": "猫西昭江",
          "role": "画室管理员",
          "quote": "颜料我替你收好了，人也一起收着。",
          "bio": "画室的管理员，知道每个抽屉里放着谁的旧画笔。她话不多，却总在有人熬夜时留一盏灯。她看着一批批学生进来又离开，自己始终站在门口。",
          "tags": [
            "管理员",
            "细心",
            "守着"
          ]
        },
        {
          "id": "canvas-ko",
          "name": "乾幸",
          "role": "同班同学 · 街头画家",
          "quote": "画得不像也没关系，像了反而不值钱。",
          "bio": "在街角摆摊画肖像的同班同学，收钱时总要多送一张速写。他嘴上说艺术不值钱，画到兴起时会忘了收摊。对主角的画，他嘴上挑刺，回头却偷偷临摹。",
          "tags": [
            "街头画家",
            "随性",
            "嘴硬"
          ]
        },
        {
          "id": "canvas-mizuki",
          "name": "瑞木信",
          "role": "瑞木家的继承人 · 另一个身份",
          "quote": "你看见的是我，还是我画出来的我？",
          "bio": "瑞木家的继承人，习惯在不同的场合换一副面孔。他把真实的名字藏在抽屉里，把作品挂在最显眼的地方。对他来说，署名比画本身更难落笔。",
          "tags": [
            "继承人",
            "双重身份",
            "藏着"
          ]
        },
        {
          "id": "canvas-chiharu",
          "name": "狮子堂千晴",
          "role": "怜奈的贴身护卫",
          "quote": "站到我身后。接下来的事，不适合让你看见。",
          "bio": "狮子堂家的幺女，凤怜奈的贴身护卫，凤后画商学区的学生。小麦金长发束成高马尾，右眼银蓝、左眼茶褐；四色型色觉让她看得见第四原色，也让她从小被叫作「怪物」。她五点起床巡逻，把怜奈的日程抄进笔记本，把可疑人物拦在正门外。被夸一句就当场石化，说到在意的人，耳朵先红。她不太会说喜欢，只会把伞往别人那边偏一点。",
          "tags": [
            "护卫",
            "异色瞳",
            "笨拙"
          ],
          "hair": "#D9B36C",
          "eyes": "#7FA8B8",
          "outfit": "#2E3A4A",
          "variant": 0
        },
        {
          "id": "canvas-shizuku",
          "name": "乌丸紫月",
          "role": "乌丸集团千金 · 竞标会主持",
          "quote": "价格是别人给的。值多少，我自己说了算。",
          "bio": "乌丸集团的千金，竞标会的主持人，凤后画商学区学生。黑色及腰长发，朱红眼睛，冷艳、毒舌，能在几秒内估出一幅画的价值。她小时候在古董市集被父亲蓄意抛弃，是信把她从黑暗里拉出来，在墙上画了一片天空。她唯一不肯用价钱衡量的东西，就是那片天空；唯一不肯放手的人，也是信。她笑起来很浅，像在给下一句报价留余地。",
          "tags": [
            "竞标会",
            "冷艳",
            "执念"
          ],
          "hair": "#1E1E24",
          "eyes": "#B03A3A",
          "outfit": "#4A1F2E",
          "variant": 2
        }
      ],
      "timeline": [
        {
          "label": "二月 · 入馆",
          "text": "女仆奖学金、宿舍的钥匙、画具街的第一场雨。"
        },
        {
          "label": "十月 · 窃案",
          "text": "「1913 的苹果」不见了，夜间竞标会照开不误。"
        },
        {
          "label": "十月末 · 博览会",
          "text": "全城的画廊亮灯，收购战在灯下谈。"
        },
        {
          "label": "署名",
          "text": "一幅画要不要写名字，一个人要不要站出来。"
        }
      ],
      "openings": [
        {
          "id": "canvas-open-auction",
          "title": "夜间的竞标会",
          "place": "乌丸竞标会场",
          "time": "夜里 · 无窗",
          "mood": "聚光灯、数字",
          "text": "竞标会的场子没有窗。聚光灯从头顶打下来，照着一幅蒙着布的画出价牌。乌丸紫月站在台前，黑发盘成高髻，声音不高，却让每一排都安静：「起价，三千万。」你坐在最后一排，手里捏着一张没有号码的入场牌。布揭开的时候，你听见旁边有人倒抽一口气——那幅画的笔触，你太熟了。紫月的目光越过人群，正好落在你脸上，停了半秒。你认出那笔触，是因为你替它调过颜色，也在背面写过一行很小的字。"
        },
        {
          "id": "canvas-open-laundry",
          "title": "宿舍的洗衣房",
          "place": "凤后艺术学园 · 宿舍",
          "time": "清晨 · 机器转着",
          "mood": "皂香、警觉",
          "text": "宿舍的洗衣房在清晨最安静。滚筒转着，皂香混着烘干机的热气。你抱着一篮床单进来，看见狮子堂千晴已经站在里面，制服外套叠得整整齐齐，袖子挽到肘上。她听见门响，手先按到腰间，看清是你才松开：「这么早。」你把床单放进另一台机器，她盯着你的手看了两秒，忽然说：「你昨天在画廊街站了很久。那幅画，你看得见颜色吗？」她问得很轻，目光却没有离开你的手。她没有再问，只把烘干的床单叠好。"
        },
        {
          "id": "canvas-open-museum",
          "title": "海边的美术馆",
          "place": "伊迪那罗古美术馆前",
          "time": "黄昏 · 退潮",
          "mood": "潮声、白墙",
          "text": "伊迪那罗古美术馆的白色外墙被夕阳染成浅金，港口的潮声一阵一阵。安娜塔西亚站在台阶上，银白长发被风掀起，手里拿着一串钥匙。「闭馆了。」她说，却侧身让开门，「不过，馆长可以带人看最后一圈。」你跟着她走进展厅，灯一排排亮起来，画从暗处浮出。她在一幅小小的天空前停下，没有解释，只说：「这幅不卖。你看久一点。」她说完就往前走，鞋跟在石地上敲出很慢的节拍。你没有问她为什么。"
        }
      ]
    },
    {
      "id": "theo",
      "index": 8,
      "title": "少女理论及其周边",
      "jp": "乙女理論とその周辺",
      "tagline": "从东京出逃到巴黎，把身份、家世和三年后的坦白一起押上。",
      "place": "巴黎 · 菲利亚女子学院本校",
      "era": "2018 · 二月",
      "tags": [
        "女装",
        "服装",
        "都市"
      ],
      "accent": "#C98D93",
      "accent2": "#8FA5C8",
      "kicker": "ATELIER OF EXILES",
      "intro": "巴黎市区的一栋女子公寓里，朝日与妹妹里想奈共用一间地下工房；菲利亚女子学院巴黎本校的年度顶点，是五月的「Collection·de·la·philia」。朝日是被女仆长识破、赶出樱公馆一个月的小仓朝日，也是大藏游星；他把自己摆上家主第一候补人的位置，只为让妹妹喘一口气。大藏家的追兵不用暴力，用的是「安排」。",
      "synopsis": "巴黎。朝日与里想奈落脚的地方不是宅邸，是市区一栋女子公寓：房东是个开朗的老太太，楼下有公共浴室，三楼住着几个女孩，地下室有一间对住户开放的缝纫工房。谁家的缝纫机坏了，都可以下楼借一台；谁晚了没回，房东会留一盏灯。\n\n他们是从东京逃出来的。追来的不是警察，是大藏家——家主之位的两名候补骏我与安东尼，一套从不使用暴力、只用「安排」的收编方式。朝日把自己摆上第一候补的位置，好让妹妹喘一口气；家里还替他准备过另一条路，娶茨威格特家的女儿。\n\n菲利亚女子学院巴黎本校是东京分校的上级校，五月要办一年一度的 Collection de la Phila，主题公开，作品与模特都围着它做。布琉艾特·妮科莱特·普朗凯特是旧贵族的长女，也是展评上的模特；她从修道院把梅丽尔带出来，那个从小替人缝补旧衣的女孩，手上有整个巴黎都少见的分寸。迪特琳德说话直、力气大，是朝日的联姻候选，也是这栋公寓里最不肯绕弯的人。\n\n春天抵达，五月上台，暑假打工，秋天家族风波，冬天摊牌。朝日要护住妹妹，里想奈要学会出门，梅丽尔要让人看见自己的设计。巴黎给他们的是材料、街道和一间隔音很差的工房；能不能留下来，得看他们自己缝出什么。",
      "theme": "逃，是一种共同创作",
      "cover": "",
      "cast": [
        {
          "id": "theo-bleuet",
          "name": "布琉艾特·妮科莱特·普朗凯特",
          "role": "普朗凯特家长女 · 展评模特",
          "quote": "贵族的第一件义务，是把自己想护的人护到底。",
          "bio": "普朗凯特家长女，菲利亚巴黎本校的班长，展评上的模特。橙色中长发，蓝眼，160 厘米，嗓门亮，笑起来露齿，贵族的架子一点不剩。她从小被按大家闺秀调教，骨子里却随心所欲；为了把梅丽尔带进同一所学校，她在父母面前争过、也低声下气求过。她伸两根手指弹人额头，弹完再把人头发揉乱。她照顾人时，贵族的善意与算计常常混在一起。",
          "tags": [
            "旧贵族",
            "豪爽",
            "护短"
          ],
          "hair": "#D98A4A",
          "eyes": "#5B8FBF",
          "outfit": "#E8E4DC",
          "variant": 1
        },
        {
          "id": "theo-risona",
          "name": "大藏里想奈",
          "role": "大藏家嫡女 · 朝日的主人",
          "quote": "外面太吵了。你进来就好，门我来关。",
          "bio": "大藏家嫡女，游星同父异母的妹妹，菲利亚巴黎本校学生。紫发紫瞳，149 厘米，头顶一撮压不下去的呆毛，红交叉发夹几乎不离身。在外人面前是坐姿端正的大小姐，门一关就缩回房间，网游里有一整支军队等她上线。她把哥哥带到巴黎，也替他把门挡住；嘴上刻薄，真出事时第一个把资源全押上。她走路步子碎而快，站久了就把重心挪到一只脚上。",
          "tags": [
            "大小姐",
            "家里蹲",
            "兄控"
          ],
          "hair": "#8E6BB5",
          "eyes": "#8E6BB5",
          "outfit": "#1E1E24",
          "variant": 2
        },
        {
          "id": "theo-meryl",
          "name": "梅丽尔·琳琪",
          "role": "修道院出身的裁缝 · 布琉艾特的女仆",
          "quote": "衣服会记住人的形状。所以，别随便把自己交给别人。",
          "bio": "修道院出身的裁缝，布琉艾特的女仆，也是被她从村子里带进菲利亚的设计师。亚麻金长发编两条细辫，红瞳，148 厘米，瘦得过分。她从小替院里缝补旧衣，一件衣服拆散再缝好，重复过几千次。她五点起床，值日、缝制、上课排满一天；听见夸奖先怀疑是在吓唬她，真遇上事却比谁都硬。她说话声音很小，一提到设计就更小，像怕吵到布料。",
          "tags": [
            "裁缝",
            "勤勉",
            "自卑"
          ],
          "hair": "#D9C08A",
          "eyes": "#B04A4A",
          "outfit": "#2E3F5C",
          "variant": 3
        }
      ],
      "timeline": [
        {
          "label": "二月 · 抵达",
          "text": "女子公寓、地下工房、还没去报到的两个人。"
        },
        {
          "label": "五月 · 展评",
          "text": "Collection de la Phila，主题公开，模特与作品一起上台。"
        },
        {
          "label": "秋 · 追兵",
          "text": "家主候补、联姻、从不使用暴力的「安排」。"
        },
        {
          "label": "冬 · 摊牌",
          "text": "留下还是回去，得由他们自己缝出答案。"
        }
      ],
      "openings": [
        {
          "id": "theo-open-atelier",
          "title": "巴黎的阁楼",
          "place": "女子公寓 · 地下工作室",
          "time": "深夜 · 缝纫机响",
          "mood": "线头、干面包",
          "text": "地下工作室的灯亮到很晚。缝纫机的声音从门缝里漏出来，一下一下，像有人在数拍子。你推门进去，梅丽尔正伏在案上拆一件旧外套，线头堆在脚边。她抬头，先看你的手，再看你的脸：「你也没睡？」桌角放着一块干硬的面包和一杯凉掉的咖啡。她把外套翻过来，指给你看里衬的针脚：「这里，缝了三次。每次都比上一次好一点。」她把线咬断，抬头看你：「你要是睡不着，就帮我穿针。」灯下的影子靠得很近。"
        },
        {
          "id": "theo-open-market",
          "title": "跳蚤市场",
          "place": "车站前广场",
          "time": "周六 · 上午",
          "mood": "旧布、咖啡、风",
          "text": "周六上午的跳蚤市场摆在车站前的广场上。旧布、铜扣、缺了口的瓷盘，摊主把价格写在纸板上。布琉艾特蹲在一个卖蕾丝的摊子前，橙发被风吹得乱，回头喊你：「过来看这个。十九世纪的，边是手缝的。」梅丽尔站在她身后，手指在布面上轻轻蹭了一下，又收回去。布琉艾特看见了，直接把整卷买下来，塞进她怀里：「拿着。做点什么。」梅丽尔抱着那卷蕾丝，半天没说话，最后只说了句「太贵了」。"
        },
        {
          "id": "theo-open-backstage",
          "title": "五月的展评",
          "place": "菲利亚巴黎本校 · 后台",
          "time": "展评前夜",
          "mood": "别针、呼吸、灯",
          "text": "展评前夜的后台，别针比掌声多。模特在帘子后面换装，缝纫机还在补最后一道边。你捧着里想奈的礼服，站在灯下，针脚密得几乎看不见。她坐在椅子上，紫发挽起来，露出后颈，忽然说：「要是明天输了，你会不会后悔来巴黎？」你没答。她也没追问，只把裙摆理平：「算了。先把我弄上台。」灯光从帘缝里漏进来。你把别针一根根别好，指尖被扎了一下，没有出声。里想奈从镜子里看你：「疼吗？」「不疼。」你说。她没再问。"
        }
      ]
    },
    {
      "id": "summerpockets",
      "index": "",
      "title": "夏日口袋",
      "jp": "Summer Pockets REFLECTION BLUE",
      "tagline": "在鸟白岛的蝉声里，把不敢下水的夏天过完。",
      "place": "鸟白岛 · 加藤家老宅",
      "era": "2018 · 七月",
      "tags": [
        "离岛夏日",
        "蝶与记忆",
        "祭典与泳池"
      ],
      "accent": "#4E8C86",
      "accent2": "#E0B33C",
      "kicker": "THE ISLAND REMEMBERS",
      "intro": "鸟白岛是一座用上几天就能走遍的小岛：一班船进出，没有便利店，天黑以后路上没有一盏灯。你以整理外婆遗物的名义住进加藤家老宅，白天被炒饭和蝉声填满，夜里在小学的泳池边，撞见一个独自练游泳的银发少女。",
      "synopsis": "七月的鸟白岛只有四样吃的、一所小学和一间诊疗所，剩下的是坡道、铁塔和夜里没人敢进的山。你从家里跑出来，停学处分正好和暑假撞在一起，没有人问你为什么再下不了水；岛上的广播从铁塔顶上喊人，食堂的菜单每天都是那四样，天黑以后只剩摩托和蝉声。\n岛上的年轻人各有各的怪：半裸的三谷良一、住在废屋里的加纳天善、举着水枪的野村美希。只有鸣濑白羽见你就退，说还是不要和她扯上关系比较好。她替这座岛扮夏鸟，也替所有人挡着那些她以为是自己招来的坏事。八月的祭典要把灯笼放流到海的那边，在那之前，你得先站到她身边。",
      "theme": "夏天与记忆",
      "cover": "",
      "cast": [
        {
          "id": "summerpockets-tsumugi",
          "name": "䌷·文德斯",
          "role": "鸟白岛废灯塔的住客",
          "quote": "因为我想要个阳台啊",
          "bio": "「女神」。鸟白岛废灯塔的住客，兼这一带的拾荒者与向导。",
          "tags": [
            "女神"
          ]
        },
        {
          "id": "summerpockets-kamome",
          "name": "久岛鸥",
          "role": "鸟白岛夏季的访客",
          "quote": "用来作为在将来的某一天里，我们再次在这里相聚时的标识",
          "bio": "胡子猫团的队长、自封的「乔纳森」。鸟白岛夏季的访客，自封的「胡子猫团」队长。",
          "tags": [
            "胡子猫团的队长、自封的「"
          ]
        },
        {
          "id": "summerpockets-umi",
          "name": "加藤羽未",
          "role": "鹰原羽依里的堂妹（双亲为堂姐妹",
          "quote": "所谓的岛可梦大乱斗，就是指通过捕捉生活在这座岛上生活的生物，来互相进行战斗的比赛",
          "bio": "「斗士」兼炒饭负责人。鹰原羽依里的堂妹（双亲为堂姐妹，算二代表亲），暑假被一封信叫到鸟白岛帮忙整理遗物；实际上她把这家人的伙食与家务全揽下来，是夏天这张餐桌的唯一负责人。",
          "tags": [
            "斗士"
          ]
        },
        {
          "id": "summerpockets-shizuku",
          "name": "水织静久",
          "role": "本土那所高中的三年级学生兼学生会长——三谷良一、加纳",
          "quote": "确切地说，应该是我用来逃避的地方吧",
          "bio": "「奶子」。本土那所高中的三年级学生兼学生会长——三谷良一、加纳天善、空门苍、野村美希读的都是那所，通学坐联络船。",
          "tags": [
            "奶子"
          ]
        },
        {
          "id": "summerpockets-shiki",
          "name": "神山识",
          "role": "一百五十年前鸟白岛神山神社的姬巫女",
          "quote": "想要向别人讨要蔬菜，就必须要去帮别人干活不是吗！",
          "bio": "「鬼」——她走到哪儿都自报「其实我也是鬼」，理由是「因为我是鬼啊！」。一百五十年前鸟白岛神山神社的姬巫女，被全岛共同养大的孤儿；这个夏天里，她是走遍岛上打听鬼传说的寻鬼者。",
          "tags": [
            "「鬼"
          ]
        },
        {
          "id": "summerpockets-ao",
          "name": "空门苍",
          "role": "鸟白岛高中二年级学生",
          "quote": "但是蓝却说，因为那个是我做的，所以她能得到那个就已经很开心了",
          "bio": "粗点心屋的看板娘、空门家的巫女、岛上的蝴蝶猎手，外号「冒牌鉴定师」。鸟白岛高中二年级学生；粗点心屋的打工看板娘，加炼乳十日元，算钱进货都归她；空门家的传人兼巫女，管山中的祭祀、提灯引蝶、看守夜里不得进山的规矩。",
          "tags": [
            "粗点心屋的看板娘、空门家",
            "眼部：赤紫大眼；皮肤",
            "鞋袜：黑色过膝长袜"
          ]
        }
      ],
      "timeline": [
        {
          "label": "七月末 · 上岛",
          "text": "渡轮靠岸，仓库的钥匙到手；夜里泳池边，她问「你是谁」。"
        },
        {
          "label": "八月上旬 · 追着躲",
          "text": "港口逃课、蓄水池的灵弹、岩场的烤鱼；她躲，你追。"
        },
        {
          "label": "八月中旬 · 柜子",
          "text": "中暑、被爷爷堵进柜子；她说出「我能看见」，两人支炒面摊还债。"
        },
        {
          "label": "八月末 · 放灯",
          "text": "神堂的两扇门一起推开；祭典夜你跳进海里，抓住她的手。"
        }
      ],
      "openings": [
        {
          "id": "summerpockets-open-1",
          "title": "满身疮痍的候鸟",
          "place": "鸟白町渔港 · 加藤家老宅",
          "time": "七月二十五日 · 傍晚",
          "mood": "汽笛、鱼腥、麦茶",
          "text": "渡轮靠岸前的广播在甲板上重复了两遍。你站在栏杆边看那座岛：绿得发闷的山连成一片，沙滩旁零星立着几栋小房，码头上有穿白校服的少女仰头看天。上岸后鱼腥和鱼饵的味道一起涌过来，你拖着行李走了近三十分钟，才在居民区正中找到那栋没锁门的房子。中庭的仓库里堆满外婆的东西，岬镜子从里面探出头来，连声道歉，领你回屋倒了一杯麦茶。她说楼上的房间已经铺好榻榻米，从今天起就是你的。房间的窗一推开，热气和海味一起灌进来——天还没黑，你还没想好今晚去哪儿吃饭。"
        },
        {
          "id": "summerpockets-open-2",
          "title": "冰棒与灵弹",
          "place": "粗点心屋门口 · 通往蓄水池的坡道",
          "time": "八月上旬 · 午后两点",
          "mood": "蝉声、冰柜、晒烫的水泥",
          "text": "粗点心屋的冰柜盖上结着一层白霜。鸣濑白羽站在门口，把硬币放进你手心，说买两根，一根给你，算上次烤鱼的谢礼——说完就退到屋檐的阴影里，好像多站一秒都会被太阳晒化。回去的路上她忽然抬手比成手枪，对着空无一人的蓄水池喊了一声「灵弹」，然后自己先红了耳朵。冰棒化得比走得快，糖水顺着她的指缝往下淌，她低头舔了一下，没看你。前面是岔路，一边回居民区，一边通向神社的石台阶。"
        },
        {
          "id": "summerpockets-open-3",
          "title": "空掉的泳池",
          "place": "小学 · 泳池",
          "time": "八月十九日 · 夜里十点",
          "mood": "氯味、虫鸣、没亮的灯塔",
          "text": "你把摩托停在小学的围墙外，铁门照旧虚掩着。泳池的水面平得像一块黑玻璃，没有水花，也没有那个从水里浮起来的白色身影。你在池边站了很久，直到氯味把喉咙泡得发苦。浅水区的台阶上放着她忘在这儿的毛巾，叠得整整齐齐，边上压着一枚一百日元硬币——像是把什么还清了。回程的路一盏灯也没有，灯塔在坡下黑着。你可以就这样骑回去，也可以掉头去神社，问一问那些没人肯跟你说的老规矩。"
        }
      ]
    },
    {
      "id": "tiannv2",
      "index": "",
      "title": "甜蜜女友2",
      "jp": "アマカノ2",
      "tagline": "新干线邻座的女孩，和一张一直空着的课桌。",
      "place": "白鹭市 · 流川茶屋街",
      "era": "20XX · 十月",
      "tags": [
        "北陆秋色",
        "和菓子与茶屋",
        "邻座的距离"
      ],
      "accent": "#8F4B3E",
      "accent2": "#C7A15A",
      "kicker": "THE SEAT BESIDE YOU",
      "intro": "白鹭市是北陆的一座旅游小城，前几年才通新干线：城迹、茶屋街、和式点心，本地人的日子和给客人看的那一半分得很开。你独自住在流川茶屋街一栋祖上开过茶屋的老宅里，放学后在隔壁的绯衣亭打零工。这个秋天，家里多了一个表妹，教室里多了一张一直空着的课桌。",
      "synopsis": "十月的白鹭市，山先红，然后才轮到街。你在新干线上替一个马尾少女放好行李，她睡在你的肩上，醒来请你喝了一杯黑咖啡，说自己离家出走去寻宝；到站时你们连名字都没有报。\n回到家，表妹冰见山玲已经用钥匙开门住进了你的房间，理由只有「上学方便」和「灰尘过敏」。同一间教室里，邻座的转校生整天缺席，直到你在黄昏的空教室发现趴着睡着的她，正是那个少女。这条街的清扫轮到谁家，谁家就得扫，客人站在旁边看着也一样；城白祭就在下个月，班里的分工、家政部的食谱、茑町千岁端来的晚饭，全都挤在这条老街上。黑姬结灯说她什么都没有，你不打算就这么信。",
      "theme": "邻座与宝物",
      "cover": "",
      "cast": [
        {
          "id": "tiannv2-rei",
          "name": "冰见山玲",
          "role": "白鹭学园一年级学生（2018年开春升二年级）",
          "quote": "我就是孤身一人，有什么问题吗？",
          "bio": "**合理性的少女**，同班女生叫她「小冰见」。白鹭学园一年级学生（2018年开春升二年级）；和仓贤一的表妹、寄住在他家的借住人；咖啡店「绯衣亭」的打工服务生，管吧台与外场。",
          "tags": [
            "**合理性的少女**，同",
            "鞋袜：黑色过膝长袜；",
            "下身：黑色紧身牛仔长"
          ]
        },
        {
          "id": "tiannv2-chitose",
          "name": "茑町千岁",
          "role": "白鹭学园三年级学生",
          "quote": "不要，一个人……",
          "bio": "「姐姐」，校内通称「茑町学姐」，绯衣亭的看板娘。白鹭学园三年级学生；家政部部长（文化祭后引退）；自家咖啡店「绯衣亭」的看板娘兼服务生；和仓贤一的青梅竹马、隔壁邻居。",
          "tags": [
            "姐姐",
            "鞋袜：黑色连裤袜；黑",
            "鞋袜：棕色短靴，靴口"
          ]
        },
        {
          "id": "tiannv2-yuhi",
          "name": "黑姬结灯",
          "role": "白鹭学园二年级转校生",
          "quote": "问则一时之耻，不问则一生之耻嘛",
          "bio": "「黑姬家的大小姐」。白鹭学园二年级转校生，和仓贤一的同班同学兼邻座。",
          "tags": [
            "黑姬家的大小姐",
            "眼部：绯红色眼睛，眼",
            "鞋袜：黑色丝袜；黑色"
          ]
        }
      ],
      "timeline": [
        {
          "label": "十月上旬 · 邻座",
          "text": "新干线的肩膀、玄关里的陌生鞋；玲当天就住进你的房间。"
        },
        {
          "label": "十月中旬 · 空课桌",
          "text": "班会上被推成涉外；黄昏的教室里，转校生趴着睡着。"
        },
        {
          "label": "十一月中旬 · 城白祭",
          "text": "可丽饼练习、黑濑温泉的神社；后夜祭的屋顶上，玲哭了。"
        },
        {
          "label": "十一月末—一月 · 冬天",
          "text": "教室里的那句话、雪里的初吻；平安夜成了两个人的约会日。"
        }
      ],
      "openings": [
        {
          "id": "tiannv2-open-1",
          "title": "邻座的行李",
          "place": "新干线 · 开往白鹭站的车厢",
          "time": "十月上旬 · 午后",
          "mood": "山影、黑咖啡、轻微的晃动",
          "text": "车厢里的暖气开得有点过头。你替邻座的女孩把行李箱横着塞进架子，列车正好开动，她晃了一下，郑重地鞠了一躬，之后再没说话。窗外的山是红黄橙三色，据说今年上色比往年早。等你发觉肩膀发沉，她已经睡熟了，呼吸就在耳边，书上的字一个也追不进去。她醒来时慌忙擦了擦嘴角，买来两杯黑咖啡，硬塞给你一杯，说是添了麻烦。杯子很烫，苦味后面有一点甜。她说她要去寻宝——到白鹭站还有二十分钟，你还没想好该怎么接这句话。"
        },
        {
          "id": "tiannv2-open-2",
          "title": "绯衣亭的晚饭",
          "place": "流川茶屋街 · 绯衣亭",
          "time": "十月下旬 · 打烊前",
          "mood": "出汁、抹布、格子窗外的灯",
          "text": "绯衣亭的灯在六点以后变得很软。你把最后一桌的杯子收进托盘，茑町千岁在吧台后面擦一只已经擦干净的玻璃杯，问你今晚想吃什么，说昆布缔的鲷鱼早就买好了。靠窗的位子坐着冰见山玲，她把生姜仙贝排成一条直线，一边写作业，一边纠正你「谢谢」说得不够合理。门上的铃响了一声，黑姬结灯站在门口，没有进来，只说路过。千岁把多出来的一副筷子摆在桌上，谁也没有问。你端着托盘，站在两张桌子中间。"
        },
        {
          "id": "tiannv2-open-3",
          "title": "明天见",
          "place": "白鹭学园 · 教室",
          "time": "十一月下旬 · 放学后",
          "mood": "夕照、粉笔灰、空走廊",
          "text": "值日的黑板还没擦，夕阳把桌椅的影子拉得很长。黑姬结灯把书一本一本放进包里，动作比平时慢。你问她要不要一起走到车站，她说不用，声音很平；走到门口又停下来，回头看了你一眼，像要把什么说出口，最后只留下一句「明天见」。走廊上已经没什么人了，鞋柜那边传来合上门的声音。走廊尽头的窗还开着，风把值日表吹得翻了一页。她的马尾在拐角晃了一下就不见了。你可以追上去，也可以就让她这样走。"
        }
      ]
    },
    {
      "id": "tiannv25",
      "index": "",
      "title": "甜蜜女友2.5",
      "jp": "アマカノ2.5",
      "tagline": "雪把镇子封住，候车室里那个女孩还在等。",
      "place": "夜间濑町 · 缘嬉",
      "era": "20XX · 十二月",
      "tags": [
        "雪国温泉",
        "候车室",
        "除雪与暖炉"
      ],
      "accent": "#4A6B85",
      "accent2": "#B9695C",
      "kicker": "WAITING ROOM IN SNOW",
      "intro": "夜间濑町是被大雪封住的温泉小镇：两条几乎平行的街，一所木造校舍，六间房的老旅馆，除雪是每天早上第一件事。你从隔壁镇转学过来，住进温泉街的缘嬉，用打扫、铲雪和夜里锁门抵房租。镇上的年轻人不多，而候车室里那个抱着膝盖的女孩，每天都在。",
      "synopsis": "这里的雪和隔壁镇不是一个量级：屋檐堆到齐腰，路面滑得像溜冰场，镇上没有秘密，谁跟谁走得近，三天就传遍。你在结冰的路上拉住一辆滑出去的轮椅，认识了旅馆的孙女沓野奏；图书馆的柜台后，高社雪静把一摞滑雪书推给你；学生会长砚川·优芙拉希·泪香把冬季运动大会当成自己的项目。\n而你总在夜间濑站看见一之濑穗波。她把候车室当成自家的客厅，暖炉没油了就抱着膝盖挨冻，问过你一句「南边是哪个方向」，然后在雪里站了很久。她一个人住在山之内庄，等的人一次也没说出口。这个冬天你要做的，不过是把暖炉加满、把雪铲开，然后在她旁边坐下。",
      "theme": "雪国与等待",
      "cover": "",
      "cast": [
        {
          "id": "tiannv25-honami",
          "name": "一之濑穗波",
          "role": "夜间濑学园一年级学生",
          "quote": "请问……南边是哪个方向？",
          "bio": "蒙面滑雪者。夜间濑学园一年级学生，旧学生宿舍『山之内庄』唯一的寄宿生。",
          "tags": [
            "蒙面滑雪者",
            "下身：棕褐色格纹百褶",
            "鞋袜：黑色过膝长袜；"
          ]
        },
        {
          "id": "tiannv25-kanade",
          "name": "沓野奏",
          "role": "夜间濑学园一年级学生",
          "quote": "我是这家旅馆老板娘和厨师的孙女，沓野奏。",
          "bio": "雪童子。夜间濑学园一年级学生，缘嬉旅馆老板娘与厨师的孙女，住管理员室那一侧。",
          "tags": [
            "雪童子",
            "眼部：碧蓝色大圆眼，",
            "下身：棕色格纹百褶短"
          ]
        },
        {
          "id": "tiannv25-ruika",
          "name": "砚川·优芙拉希·泪香",
          "role": "夜间濑学园三年级学生、学生会长（一月底卸任）",
          "quote": "社会、政治以及学生层面的意义",
          "bio": "「能干的归国子女学生会长」。夜间濑学园三年级学生、学生会长（一月底卸任）；转学手续的经办人，所以最开始是志贺浩辅的「上司」。",
          "tags": [
            "能干的归国子女学生会长",
            "下身：棕色格纹百褶短",
            "鞋袜：黑色丝袜；焦糖"
          ]
        },
        {
          "id": "tiannv25-yukishizu",
          "name": "高社雪静",
          "role": "夜间濑学园二年级学生",
          "quote": "要是被紧紧抱住……还在耳边对我说喜欢的话……",
          "bio": "「图书馆的座敷童子」。夜间濑学园二年级学生，图书委员；高社神社宫司家的次女。",
          "tags": [
            "图书馆的座敷童子",
            "衣身：外套收腰，前襟",
            "鞋袜：白色罗纹及膝袜"
          ]
        }
      ],
      "timeline": [
        {
          "label": "十二月上旬 · 转学",
          "text": "候车室、滑出去的轮椅、神社的黄昏；你住进缘嬉二楼。"
        },
        {
          "label": "十二月中旬 · 暴雪",
          "text": "雪屋里的电话、一颗草莓大福、废弃滑雪场的小木屋。"
        },
        {
          "label": "十二月下旬 · 晚霞",
          "text": "高社神社那条路上的告白；平安夜她亲口告诉了奏。"
        },
        {
          "label": "一月—二月 · 说出口",
          "text": "午休的广播、重做的二年参；情人节前她要把话说给所有人听。"
        }
      ],
      "openings": [
        {
          "id": "tiannv25-open-1",
          "title": "暖炉没油了",
          "place": "夜间濑站 · 候车室",
          "time": "十二月上旬 · 午后",
          "mood": "煤油、雪光、冷掉的铁椅",
          "text": "候车室里的暖炉灭了，空气里有一股煤油冷掉的味道。你办完转学手续回来，那个女孩还坐在原位，抱着膝盖，盯着检票口，像在等一班不会来的车。她的鼻尖冻得发红，打了个喷嚏，把手在袖口里搓了搓。你去问站务员能不能自己加油，对方爽快地递来塑料桶；你拎回来灌满，又在自动售货机买了一罐热奶茶，塞进她手里。她一脸戒备地问你想干什么。玻璃门外，雪把铁轨埋了一半，天色正在暗下去。"
        },
        {
          "id": "tiannv25-open-2",
          "title": "图书馆的座敷童子",
          "place": "夜间濑学园 · 图书室",
          "time": "十二月中旬 · 放课后",
          "mood": "暖气、旧纸、窗外的雪",
          "text": "图书室的暖气片一直在响。高社雪静把一摞滑雪入门的书推到你面前，书脊都朝着同一个方向。她说话时又咬到了舌头，索性翻开笔记本写给你看：与其替人发愁，不如先给他一件开心的事。写完她把本子合上，耳朵红着，假装去整理书架。书页里有淡淡的旧纸味，被暖气烘得浮起来。窗外是操场上的越野滑雪赛道，雪被压出两条平行的痕。你翻着那摞书，忽然想到候车室里那个总也不肯说在等谁的人。"
        },
        {
          "id": "tiannv25-open-3",
          "title": "风雪里的小木屋",
          "place": "废弃滑雪场 · 小木屋",
          "time": "十二月中旬 · 入夜",
          "mood": "风、手电、结霜的窗",
          "text": "风雪从小木屋的窗缝里灌进来，手电的光圈落在结霜的木板上，缩成一小团。你们没能赶在封路前下山。一之濑穗波把围巾分了一半给你，自己缩在角落里，说不冷，牙齿却在打颤。外面的风把树压得很低，偶尔有雪块从屋檐上砸下来。她的手机在口袋里震了一下，屏幕亮起来，照出她脸上的犹豫——她没有接，也没有挂断，只是把手机翻过去扣在膝盖上。这点光只够照亮两个人之间那一点地方，雪一时半会儿停不了。"
        }
      ]
    },
    {
      "id": "tiannv3",
      "index": "",
      "title": "甜蜜女友3",
      "jp": "アマカノ3",
      "tagline": "整条温泉街是一间旅馆，而你住进了女生宿舍。",
      "place": "日和山温泉 · 乐乐浦寮",
      "era": "20XX · 八月",
      "tags": [
        "海边温泉街",
        "海豹与烟花",
        "宿舍的饭"
      ],
      "accent": "#2F7D8C",
      "accent2": "#E0A13E",
      "kicker": "SEALS AND FIREWORKS",
      "intro": "日和山温泉是海边的一条温泉街，街本身被当成一栋巨大的旅馆：道路是走廊，各家旅馆是房间，公共浴场是大浴场。御所院学园就盖在街心，出校门就是浴衣和烟火。奶奶伤腰住院，把女生宿舍乐乐浦寮交给你管伙食，你搬进对面别馆，成了这栋楼里唯一的男人。",
      "synopsis": "这条街靠四样东西转：温泉、海豹、一整个夏天的祭典，还有把这三样卖出去的观光。海豹烧三百日元一个，只收现金；海豹财阀的继承人一出生就是海豹幼崽的颜色；每天夜里九点，烟花放五分钟，摊位只在七月底前和八月下旬以后各摆一段，其余日子街上只剩日常。\n宿舍里住着五个人：叫你「主人大人」的斯卡蕾特·斑鸠·维斯塔莉娅、班级委员鸿纱由美、把妹妹放在第一位的柳木诗梦、见谁都喊「你好dolce」的柳木叶梦，还有开学才转来的御所院冬桦——纯白的头发，满袋五百日元硬币，不知道买东西要付钱。叶梦是这条街的温泉小町，整条街都看着她的美甲。你要做的只是每天五点半起床，把五个人的早饭做好。",
      "theme": "祭典与宿舍",
      "cover": "",
      "cast": [
        {
          "id": "tiannv3-touka",
          "name": "御所院冬桦",
          "role": "御所院学园二年级学生",
          "quote": "原、原来如此……是这么回事啊。也就是说，我缺乏羞耻心，是这个意思对吧",
          "bio": "「海豹财阀的大小姐」。御所院学园二年级学生，班上的修学旅行班长；海豹财阀的继承人，捐款一类的事以「海豹财团理事」名义出面；前竞技游泳选手，破过日本纪录，已退役。",
          "tags": [
            "海豹财阀的大小姐",
            "鞋袜：白色及膝长袜",
            "下身：白色长裙及地，"
          ]
        },
        {
          "id": "tiannv3-scarlet",
          "name": "斯卡蕾特·斑鸠·维斯塔莉娅",
          "role": "御所院学园三年级学生",
          "quote": "只是，我不太懂什么是『好吃』。我觉得吃什么都差不多",
          "bio": "乐乐浦寮的女仆小姐。御所院学园三年级学生，兼乐乐浦寮（祖母买下旧旅馆改成的女生宿舍）的驻寮女仆，祖母住院期间代理整栋楼的运营——「现在宿舍的运营工作都交给我了」；生物部唯一的部员，在圆山水族馆海狗区做志愿者。",
          "tags": [
            "乐乐浦寮的女仆小姐",
            "原文记述：以红色为基",
            "鞋袜：黑色透肉连裤袜"
          ]
        },
        {
          "id": "tiannv3-hazuki",
          "name": "柳木叶梦",
          "role": "御所院学园一年级学生",
          "quote": "嗯，因为我想和这个小镇有更多更多的交集",
          "bio": "「温泉小町」，同学嘴里的她是一身辣妹打扮、一句话三个「～♪」的温柔辣妹。御所院学园一年级学生，柳木诗梦的妹妹，乐乐浦寮的住宿生；日和山温泉观光协会认证的「温泉小町」；SELSAL 杂志的读者模特。",
          "tags": [
            "温泉小町",
            "鞋袜：赤足，脚趾涂蓝"
          ]
        },
        {
          "id": "tiannv3-shimu",
          "name": "柳木诗梦",
          "role": "御所院学园二年级学生",
          "quote": "然而，我……却把叶梦弄丢了。我找了她，但最后还是靠别人的帮助才和叶梦汇合",
          "bio": "「冰山」——义大在心里给她起的外号，一顿饭的工夫就能把人顶回三层外。御所院学园二年级学生，柳木叶梦的姐姐，乐乐浦寮的住宿生；日生下神社的巫女（打工）；二年级的修学旅行实行委员。",
          "tags": [
            "冰山",
            "眼部：琥珀色大眼，眼",
            "下身：灰卡其宽松短裤"
          ]
        },
        {
          "id": "tiannv3-sayumi",
          "name": "鸿纱由美",
          "role": "御所院学园二年级学生、班级委员",
          "quote": "如果你敢把我是由语的事，还有我的本性告诉周围的人，我就会哭着把这录音散播出去，你可要做好觉悟",
          "bio": "班里的「正论拳」、AZ 上的「妖狐V」。御所院学园二年级学生、班级委员；乐乐浦庄（亦作「乐浦庄」，由旧旅馆改建的女生宿舍）的第一个住宿生兼实际管家；网络主播「夏乃由语」，个人势，自己开了公司。",
          "tags": [
            "班里的「正论拳",
            "眼部：蓝色大眼，眼白",
            "鞋袜：黑色及膝长袜，"
          ]
        }
      ],
      "timeline": [
        {
          "label": "八月末 · 防波堤",
          "text": "一根钓竿、一个不会买海豹烧的大小姐；你搬进别馆。"
        },
        {
          "label": "九月 · 转校生",
          "text": "冬桦坐到你旁边；宿舍五个人第一次全员到齐，一起泡温泉。"
        },
        {
          "label": "九月下旬 · 直播",
          "text": "傍晚的中庭、显示器上的立绘；你确认由语就住在身边。"
        },
        {
          "label": "十月—十一月 · 祭典",
          "text": "名人税、姐妹的争吵；期末考后的海边，你说出喜欢。"
        }
      ],
      "openings": [
        {
          "id": "tiannv3-open-1",
          "title": "海豹烧与公主",
          "place": "温泉街主干道 · 海豹烧摊前",
          "time": "八月下旬 · 放学后",
          "mood": "酱汁、木屐、海风",
          "text": "海豹烧的摊子前冒着白气，酱汁的味道混在游客的木屐声里。那个纯白头发的女孩站在摊前，眉头紧锁，盯着一排刚出炉的海豹烧，像在研究一件看不懂的展品。她掏出一张你没见过的卡，店员说只收现金；她又认真地问该在哪里吃、有没有盘子和叉子。你替她买了两个，递过去时她声明作为海豹的一员不能接受施舍，视线却一直往纸袋里飘。她咬下第一口，眼睛整个亮起来。街上有人在拍宣传片，人群一让，镜头正好朝这边转过来。"
        },
        {
          "id": "tiannv3-open-2",
          "title": "五点半的厨房",
          "place": "乐乐浦寮 · 厨房",
          "time": "九月上旬 · 清晨五点半",
          "mood": "米、味噌、还没醒的走廊",
          "text": "清晨五点半，乐乐浦寮的厨房还没有完全醒。你把米下锅，味噌化开，试着在二十分钟里安排完五个人的早饭。走廊那头传来拖鞋声，斯卡蕾特·斑鸠·维斯塔莉娅提着裙摆进来，说「主人大人，早安」，然后自然地从你手里接过锅铲。六点十分，柳木叶梦闻着味道下楼，头发还翘着，先盛了一碗，站在灶台边吃完，又把碗递回来。窗外是温泉街的屋顶，雾正从排水沟里升起来。冰箱上贴着今天的值日表，最后一个名字还没填。"
        },
        {
          "id": "tiannv3-open-3",
          "title": "炒面摊的傍晚",
          "place": "温泉街 · 地藏家的炒面摊",
          "time": "十一月下旬 · 祭典第一天",
          "mood": "铁板、酱、烟花前的薄暮",
          "text": "祭典第一天的傍晚，地藏家的炒面摊前排了很长的队。你翻着铁板上的面，油和酱在火上响。柳木叶梦穿着浴衣从人群里过来，手里拿着观光协会的麦克风，正在念下一场活动的时间；她经过摊前，顺口替你报了一句「这边也很好吃」，队伍立刻又长了一截。柳木诗梦站在对面的屋檐下，没有过来，只是看着。叶梦念完最后一句，回头找你，隔着烟火升起前的薄暮朝你挥了挥手。铁板上还有两份面，你得决定先装哪一份。"
        }
      ]
    },
    {
      "id": "yuanqi",
      "index": "",
      "title": "缘起甜韵趣恋丛生！",
      "jp": "Yuanqi",
      "tagline": "家烧了以后，你住进了女生宿舍的厨房。",
      "place": "东陆区 · 星九头学生宿舍",
      "era": "2021 · 四月",
      "tags": [
        "坡道",
        "可丽饼",
        "宿舍的饭"
      ],
      "accent": "#C25B76",
      "accent2": "#EFB35C",
      "kicker": "A DORM CALLED HOME",
      "intro": "东陆区的全部地盘压在一条坡道上：坡下是车站和步行街，坡上是星九头学生宿舍，宿舍外侧有一间叫甜韵的可丽饼咖啡厅，再往上就是学园。宿舍、店、学校归同一个人管。四月的火灾之后，妹妹住进了宿舍，你拎着一只箱子站在楼下，来谈的是住宿费。",
      "synopsis": "公寓烧了，两间房熏焦，整栋要推倒重建。你没有稳定收入，也拿不出租房要的担保人，唯一能安顿的是刚住进星九头学生宿舍的妹妹八乙女凉花。房东星九头斯皮卡听完来意，反手提议：你来当这栋女生宿舍的楼妈，条件是全楼住宿生点头。坡道上的铺子位置一年年不变，新来的只能被挤到边上。\n于是你五点半起床做近二十人份的早餐，白天在甜韵的烤盘前站柜台，夜里给偷吃的近江希未做一碗杂烩饭。宿舍长寿珠祈拿凉花的学年主席优待当人质替你担保；衣川美卯在街角跟你结过怨，当晚宣布也要搬进来。这栋楼不许办死亡游戏，澡堂要错开时间，晚饭过了点就没有热的。",
      "theme": "坡道上的家",
      "cover": "",
      "cast": [
        {
          "id": "yuanqi-ryouka",
          "name": "八乙女凉花",
          "role": "星九头学园一年级生",
          "quote": "在兄长下班回来前为他准备好洗澡水是我的本职工作",
          "bio": "全校认的「学年主席」（亦作年级最优生），哥哥口中的「小凉」，宿舍里叫开的「凉凉」。星九头学园一年级生，星九头学园的学年主席，星九头学生宿舍住宿生，楼下甜韵可丽饼咖啡厅的兼职店员。",
          "tags": [
            "全校认的「学年主席",
            "身姿体态：身形纤细，",
            "下身：灰紫色下装，图"
          ]
        },
        {
          "id": "yuanqi-tanpopo",
          "name": "冈井蒲公英",
          "role": "星九头学园二年级生",
          "quote": "人家想和姨姨一起玩",
          "bio": "「蒲蒲酱」（亦作「蒲蒲姐姐」），乡下从小叫到大。星九头学园二年级生，星九头学生宿舍的住宿生，甜韵的兼职店员。",
          "tags": [
            "蒲蒲酱",
            "身姿体态：身形娇小、",
            "下身：深藏青短下装，"
          ]
        },
        {
          "id": "yuanqi-tamaki",
          "name": "寿珠祈",
          "role": "星九头学生宿舍的宿舍长",
          "quote": "所以，为了凉花同学，男性宿管而已，大家应该可以接受",
          "bio": "宿舍长，兼校内纪律委员。星九头学生宿舍的宿舍长，星九头学园三年级生，校内整肃风纪的中坚，兼甜韵的兼职店员。",
          "tags": [
            "宿舍长，兼校内纪律委员",
            "眼部：蓝绿大眼；皮肤"
          ]
        },
        {
          "id": "yuanqi-ayako",
          "name": "漆原绫子",
          "role": "熊甜蜜韵（店名「熊甜&蜜韵」）咖啡厅的大堂经理",
          "quote": "这家店创立的目的是让住宿生接触社会体验社会，吸引太多外部人员前来可能会有违初衷",
          "bio": "甜韵的「绫子姐」——全店最靠得住的那个人。熊甜蜜韵（店名「熊甜&蜜韵」）咖啡厅的大堂经理，店隶属星九头学生宿舍。",
          "tags": [
            "甜韵的「绫子姐",
            "眼部：琥珀色大眼；皮",
            "身姿体态：身形高挑、"
          ]
        },
        {
          "id": "yuanqi-miu",
          "name": "衣川美卯",
          "role": "星九头学园二年级生",
          "quote": "我要让你重新领略到，我可不是单纯的女流之辈",
          "bio": "账号上的「卯卯」，圈里给的头衔是「次世代网红」，她自己吹的是「天才网红卯卯酱」。星九头学园二年级生；SNS 活动者「卯卯」，十万粉级别的网红；星九头学生宿舍的住宿生；甜韵可丽饼咖啡厅的兼职店员，出勤时戴一副舞会假面扮「迷之假面店员」；白天还是学生，她把这层身份叫作「学生派网红」。",
          "tags": [
            "账号上的「卯卯",
            "身姿体态：身形纤细、"
          ]
        },
        {
          "id": "yuanqi-nozomi",
          "name": "近江希未",
          "role": "星九头学园三年级生",
          "quote": "那个，我选择相信他，原因可能没办法说得太清楚",
          "bio": "哲也随口封的「大胃王」，和她自封的「女豹」——照网上攻略练色诱，还写成「女豹笔记」。星九头学园三年级生，三年A班有她一张课桌；也是星九头学生宿舍的住宿生、可丽饼&咖啡厅「Honey&Beary（熊甜&蜜韵）」——本地人只叫甜韵——的兼职店员。",
          "tags": [
            "哲也随口封的「大胃王",
            "身姿体态：身形纤细、"
          ]
        }
      ],
      "timeline": [
        {
          "label": "四月上旬 · 面试",
          "text": "公寓的火、街角的海报、走错的那扇门；全楼点头，你成了楼妈。"
        },
        {
          "label": "四月中旬 · 第一天",
          "text": "五点半的二十人份早餐；美卯戴上面具站上大堂。"
        },
        {
          "label": "七月 · 运动大会",
          "text": "最后一棒冲过终点；奖品是夏日庆典的一个摊位。"
        },
        {
          "label": "八月—十二月 · 说出口",
          "text": "餐车、还清的债、水上乐园；退宿前她把话挑明，之后每天都见。"
        }
      ],
      "openings": [
        {
          "id": "yuanqi-open-1",
          "title": "楼妈的面试",
          "place": "星九头学生宿舍 · 大厅",
          "time": "四月上旬 · 傍晚",
          "mood": "旧木地板、晚饭的味道、消毒水",
          "text": "宿舍的大厅比你想象的安静。玄关的鞋摆得整整齐齐，木地板擦得发亮，晚饭的味道从二楼飘下来。你本来是来谈妹妹的住宿费的，星九头斯皮卡听完，只说了一句「那你就来当这栋楼的楼妈」，然后把全体住宿生叫到了大厅。寿珠祈抱着手臂站在最前面，问你凭什么；近江希未躲在沙发后面，只露出半张脸；衣川美卯靠在楼梯扶手上，从头到脚把你打量了一遍。所有人的目光都落在你身上，等着你开口。"
        },
        {
          "id": "yuanqi-open-2",
          "title": "妹妹的可丽饼",
          "place": "甜韵 · 靠窗的座位",
          "time": "四月下旬 · 休息日午后",
          "mood": "奶油、烤盘、晒进来的光",
          "text": "休息日的甜韵比平时慢。烤盘预着热，奶油在盆里发着光，靠窗的位子被太阳晒得发白。八乙女凉花穿着制服，把面糊舀到圆盘上，手腕一转，摊成一张薄薄的圆；她做得很认真，做完却先推到你面前，说是练手，不算钱。可丽饼的边缘有点焦，奶油抹得歪，你咬下去的时候她盯着你的脸，等你说话。门外坡道上有学生走过，风铃响了一下。柜台后面的菜单还空着一栏，等着写今天的限定。"
        },
        {
          "id": "yuanqi-open-3",
          "title": "闭园前的泳池",
          "place": "水上乐园 · 池边的遮阳伞下",
          "time": "九月 · 闭园前",
          "mood": "氯水、湿毛巾、广播的回声",
          "text": "闭园前的广播响过一遍，泳池边的人散得差不多了。衣川美卯把毛巾搭在肩上，帽檐压得很低，坐在遮阳伞下不肯动。刚才有人在浅水区认出她，举着手机喊她的名字，她笑着应付了两句，转身就把自己藏进了水里。现在她只说晒伤了，不想走。水面反着最后一层光，救生员开始收浮标，远处的水上滑梯还在滴水。你把冰镇的饮料递过去，她接住，没有喝，问你是不是也觉得，被人一直看着这件事很麻烦。"
        }
      ]
    },
    {
      "id": "chunbai",
      "index": "",
      "title": "纯白交响曲",
      "jp": "Mashiroiro Symphony",
      "tagline": "一条铁路隔开两所学校，十月起，你们共用一间教室。",
      "place": "各务台 · 结姬女子学园",
      "era": "2020 · 十月",
      "tags": [
        "学园",
        "合并",
        "冬"
      ],
      "accent": "#7C93C9",
      "accent2": "#E8D5B7",
      "kicker": "TWO SIDES, ONE RAIL",
      "intro": "各务台被一条铁路分成两半：这一边是新市区和崭新的男校，那一边是旧市区、森林与结姬女子学园。少子化把两所学校推到一起，十月一日起试行合并，二年级的 2－T 成了唯一的试验班。你作为测试生穿过站台，制服换成冬装，走进一间连沉默都排好队的教室。",
      "synopsis": "各务台的高级住宅街在山丘那一边，校门、礼堂、食堂都奢华得让外校生说不出话；铁路这一边的男校连底蕴都谈不上。两校为少子化谈了一整年合并，最后落成一间教室：学籍各归各校，人却要一起上课。测试生从一二年级里挑，男生只有几个，走进去的时候，整条走廊都在看。\n\n濑名爱理是这间教室的开关。她是学年首席，是校长濑名兰华的独生女，也是唯一一个在礼堂里当众说过「我不欢迎你们」的人；她一个人住在新市区的旧公寓，靠打工和半价熟食过日子，这些事她不想让任何人知道。校门口有个拿扫帚的女仆安洁莉娜·菜夏·史威尔，后花园的预制房里养着松鼠和一只说不清是什么的动物。正式合并在四月，还缺钱、缺签名。你要学会的事很简单：先看懂空气，再决定要不要开口。",
      "theme": "穿过铁路的冬天",
      "cover": "",
      "cast": [
        {
          "id": "chunbai-sana",
          "name": "乾纱凪",
          "role": "结姬女子学园（结女）二年级、测试班级的学生",
          "quote": "我一直憧憬着她，希望自己有一天能像她一样……",
          "bio": "「纱纱小姐」与「小乾」。结姬女子学园（结女）二年级、测试班级的学生；喵喵部（保护伤病动物的同好会，尚未被承认为正式社团）的部员，部长是天羽美羽。",
          "tags": [
            "纱纱小姐",
            "眼部：紫色大眼，眼尾",
            "鞋袜：深紫黑色及膝长"
          ]
        },
        {
          "id": "chunbai-miu",
          "name": "天羽美羽",
          "role": "结姬女子学园三年级学生",
          "quote": "如果没有人发出呐喊，一切也就无从开始的哦",
          "bio": "天使学姐。结姬女子学园三年级学生，喵喵部部长——社团没有正式名称，登记的身份是野生动物救护志愿者。",
          "tags": [
            "天使学姐",
            "眼部：深紫色大眼，眼",
            "鞋袜：白色过膝长袜，"
          ]
        },
        {
          "id": "chunbai-angelina",
          "name": "安洁莉娜·菜夏·史威尔",
          "role": "结姬女子学园二年级测试生（2－Ｔ）",
          "quote": "安洁既不是天然也不是人工。是野生女仆",
          "bio": "野生女仆（亦作「流浪女仆」「自导自演女仆」）。结姬女子学园二年级测试生（2－Ｔ），全校唯一的住校女仆。",
          "tags": [
            "野生女仆（亦作「流浪女仆",
            "眼部：紫色大眼",
            "鞋袜：深紫黑色连裤袜"
          ]
        },
        {
          "id": "chunbai-airi",
          "name": "濑名爱理",
          "role": "结姬女子学园二年级 2－Ｔ（两校选拔生混编的试验班）",
          "quote": "无论在谁的眼里，我都是无可动摇的优等生",
          "bio": "「学年首席」。结姬女子学园二年级 2－Ｔ（两校选拔生混编的试验班）学生，兼结女侧班级委员与学年首席，校长濑名兰华的女儿。",
          "tags": [
            "学年首席",
            "眼部：宝蓝色大眼",
            "衣身：前襟一列暗色小"
          ]
        },
        {
          "id": "chunbai-sakuno",
          "name": "瓜生樱乃",
          "role": "各务台学园一年级生",
          "quote": "哥哥和我小时候在这里玩过，还记得吗？",
          "bio": "小樱乃，亦作「天然妹妹」。各务台学园一年级生，瓜生新吾的义妹（约十年前因父母再婚成了兄妹）；试合并开始后被选为测试生，十月起在结姬女子学园随班上课，学籍仍挂在各务台。",
          "tags": [
            "小樱乃，亦作「天然妹妹",
            "眼部：紫色大眼",
            "鞋袜：黑色连裤袜"
          ]
        }
      ],
      "timeline": [
        {
          "label": "十月 · 试合并",
          "text": "冬装、站台、2－T 的第一堂课；没人先开口。"
        },
        {
          "label": "十月末 · 半价",
          "text": "点名册堆到深夜，久米超市的熟食贴上了半价条。"
        },
        {
          "label": "十一月 · 雨",
          "text": "一把折叠伞被风吹翻，外套披在她肩上。"
        },
        {
          "label": "十二月 · 签名",
          "text": "签名送到校长桌上；圣诞的雪落在空校园。"
        }
      ],
      "openings": [
        {
          "id": "chunbai-open-1",
          "title": "校门口的扫帚",
          "place": "结姬女子学园 · 校门",
          "time": "十月一日 · 早晨",
          "mood": "铁路、扫帚、女仆装",
          "text": "穿过铁路之后，街道忽然安静下来，连空气都像换了一套。你和妹妹瓜生樱乃沿着坡道走到结姬女子学园的校门前，先看见的是铁门，再看见门边一个穿女仆装的女孩子，正拿着扫帚一下一下地扫。她抬起头，很自然地说了一句「欢迎回来」，然后才想起什么似的，补上一句「请问有什么可以效劳的吗」。樱乃小声问你，这算不算走错了地方。礼堂里各务台的学生已经坐满，校长还没有来，八冢万智在台边一遍遍看表。门被推开的时候，所有人一起回头。"
        },
        {
          "id": "chunbai-open-2",
          "title": "半价熟食",
          "place": "久米超市 · 熟食区",
          "time": "十月十六日 · 夜里九点",
          "mood": "冷柜、折扣贴、塑料盒",
          "text": "点名册的工作拖到九点。你从学校出来，绕进久米超市买明天的早饭，冷柜前的灯白得发冷。熟食区那边有人在等店员贴折扣条，银灰短外套，胭脂红的短裙，蜜金的长卷发扎得很高。是濑名爱理。她看见你，手先按在购物篮上，像要把里面的东西盖住；两个人都没有先说话。店员把半价条贴上去，她伸手去拿，又停住，侧过脸：「……你什么都没看见，可以吗。」语气还是硬的，耳根却红了。"
        },
        {
          "id": "chunbai-open-3",
          "title": "翻过去的伞",
          "place": "结姬女子学园 · 校门外的坡道",
          "time": "十一月十九日 · 傍晚",
          "mood": "大雨、折伞、湿掉的袖口",
          "text": "雨是从放学前开始下的。你们在校门口站了一会儿，等它小一点，结果越等越大。爱理撑开一把折叠伞，风从坡下卷上来，伞面「啪」地翻过去，骨架歪在一边。她把伞收了，站着没动，头发贴在脸侧。你把外套脱下来，搭在她肩上；她抬头看你，想说什么，最后只说了一句「会冷」。两个人挤在一把坏掉的伞下往车站走，她的步子比平时慢。走到坡底，她忽然停下来：「再站一会儿，可以吗。」"
        }
      ]
    },
    {
      "id": "shuizang",
      "index": "",
      "title": "水葬银币的伊斯特里亚",
      "jp": "Suizou Ginka no Istria",
      "tagline": "这座岛的人不会哭，所以眼泪才值钱。",
      "place": "艾美马德伊 · 水上都城",
      "era": "2024 · 十月",
      "tags": [
        "赌场",
        "水城",
        "暗"
      ],
      "accent": "#2E6E7E",
      "accent2": "#C9C3B4",
      "kicker": "ALL IN, NO TEARS",
      "intro": "艾美马德伊是一座用钱堆出来的人工岛：河水冠学园、凯旋门赌场、久末医院，全立在同一条水路上。岛上的人哭不出来，名产是供奉死者的水葬银货。你住在岛的东侧，和妹妹茅崎夕樱两个人；白天穿制服去上课，夜里戴上墨镜，坐到牌桌的另一头。",
      "synopsis": "岛上的老故事说，从前有个少女，眼泪能治好一切伤痛；她拒绝再哭之后，岛民还是逼她哭到死。少女被水葬，把身体还给海，全岛的人从此失去了眼泪。于是这里有了名产水葬银货——一种银白、多汁、甜得发闷的苹果，本来是丢进海里供奉她的。诅咒变成了特产，特产变成了日常。\n\n白天的岛是观光地，入夜换成另一张脸。东北方的凯旋门赌场通宵亮着霓虹，赌桌上有一种押上性命的局，叫 All-in；久末医院是全岛唯一的医疗机构，院长被叫作现代的黑杰克，传闻里那些奇迹的背面是违法实验与失踪。收养你兄妹的煤谷宗名，三年前在一场赌局里输掉，再没有回家；你在牌桌上替小夜赚回她的借款，八椚红叶是你的「主人」。妹妹夕樱在家里把窗一直开着，说这样不幸会逃走。",
      "theme": "没有眼泪的岛",
      "cover": "",
      "cast": [
        {
          "id": "shuizang-kiri",
          "name": "井土谷祈吏",
          "role": "井土谷家独女",
          "quote": "你为什么、放过C·A",
          "bio": "玖玖里口中「那个迷恋着你的，像小动物一样的女孩」——病恹恹、见谁都笑，一坐上赌桌却露出另一张脸；最会读人的女仆都承认是这个「成长速度简直异常」的小姑娘杀得老赌客不敢上桌。井土谷家独女，久末医院的老病号；后成紫子出资豢养的赌徒，惨败后被一笔勾销、遭抛弃；再凭实力翻身，接替败北的C·A，做了红叶的下仆、。",
          "tags": [
            "玖玖里口中「那个迷恋着你"
          ]
        },
        {
          "id": "shuizang-yura",
          "name": "小不动摇",
          "role": "河水冠学园的一年级学生",
          "quote": "我凑齐的扑克牌中、一张Q以上的扑克牌都没有！　Q以上的扑克牌、全都在你的手里",
          "bio": "自称「小摇」，全名里嵌着「不动摇」三个字——既是信条，也是她最大的破绽。河水冠学园的一年级学生，礼花部（亦作烟花部）部员兼策划。",
          "tags": [
            "自称「小摇",
            "眼部：青蓝色大眼",
            "身姿体态：身量娇小，"
          ]
        },
        {
          "id": "shuizang-kukuri",
          "name": "汐入玖玖里",
          "role": "久末家「人造人鱼公主计划」的2号受试体",
          "quote": "我们俩、都是骗子呢",
          "bio": "人鱼公主（亦作「美人鱼」）。久末家「人造人鱼公主计划」的2号受试体，责任者汐入纯的次女；出逃后成为茅崎家的同居人，随后转进学园的二年级，与茅崎英士同班。",
          "tags": [
            "人鱼公主（亦作「美人鱼",
            "眼部：青蓝色眼睛"
          ]
        },
        {
          "id": "shuizang-sayo",
          "name": "煤谷小夜",
          "role": "艾美马德伊的学园三年级学生",
          "quote": "是我将扑克牌进行调整后再发牌的。为了让夕樱获胜，我发给了她容易取胜的牌。当然，我并不是每一次都那样做……",
          "bio": "小夜妹妹／人偶。艾美马德伊的学园三年级学生，同时是凯旋门赌场的荷官（发牌员）。",
          "tags": [
            "小夜妹妹／人偶",
            "眼部：酒红色眼睛",
            "鞋袜：黑色连裤袜；白"
          ]
        },
        {
          "id": "shuizang-yuuka",
          "name": "茅崎夕樱",
          "role": "河水冠学园一年级学生",
          "quote": "是优先顺序的问题。是职责的问题。只是对夕樱来说，那个最重要",
          "bio": "人鱼姬（亦作美人鱼、人鱼公主）。河水冠学园一年级学生，茅崎英士的亲妹妹。",
          "tags": [
            "人鱼姬（亦作美人鱼、人鱼",
            "眼部：琥珀金色眼睛",
            "身姿体态：体格娇小，"
          ]
        }
      ],
      "timeline": [
        {
          "label": "十月 · 半天课",
          "text": "屋顶楼梯口一副没收来的扑克牌，沙坑里一个女孩演两个角色。"
        },
        {
          "label": "十月 · 神经衰弱",
          "text": "五百万押上牌桌，八次鸽尾洗牌，把记号牌洗回去。"
        },
        {
          "label": "十月末 · 水葬银货",
          "text": "垃圾场的水桶里，捡到从久末医院逃出来的汐入玖玖里。"
        },
        {
          "label": "十二月 · 鸟笼",
          "text": "地下室的规则回来了，筹码一路加到七百五十美元。"
        }
      ],
      "openings": [
        {
          "id": "shuizang-open-1",
          "title": "兔子苹果",
          "place": "茅崎家 · 客厅",
          "time": "十月上旬 · 清晨",
          "mood": "苹果、梦、厨房的水声",
          "text": "梦里又是那张牌桌。对面的男人戴着墨镜，筹码堆得像一堵墙，你一次次伸手，够不到他的要害；醒来时你先去摸眼镜，指尖碰到镜腿，才把呼吸放慢。厨房里有水声。煤谷小夜围着围裙站在灶台前，说听见你肚子叫就过来了。她把水葬银货削成小兔子的形状，一片一片递到你嘴边，银白的果肉在晨光里发亮。你讨厌这种苹果，她还是照旧喂。收拾完，她站在门口问：「我还可以再来吗。」"
        },
        {
          "id": "shuizang-open-2",
          "title": "忌日的抽王八",
          "place": "煤谷家 · 客厅",
          "time": "十月下旬 · 傍晚",
          "mood": "旧扑克、忌日、霓虹街",
          "text": "忌日的傍晚，煤谷家的客厅里摆着一副旧扑克。小夜把牌洗好，说今年也照旧抽王八；夕樱坐在你对面，一边嫌牌旧，一边把输掉的牌藏到膝盖底下。窗外的天暗得很快，桌上供着一盘水葬银货，没有人去动。三局过后，小夜起身去换衣服，说霓虹街那边今晚缺人。你送她到路口，她把围巾往上拉了拉，回头说，明年这一天也要来。你应了一声，站在原地看着她走进灯里。"
        },
        {
          "id": "shuizang-open-3",
          "title": "牌桌的另一头",
          "place": "凯旋门赌场 · 二楼牌桌",
          "time": "十一月末 · 深夜",
          "mood": "霓虹、筹码、墨镜",
          "text": "凯旋门的霓虹从落地窗照进来，牌桌上的绿绒被照得发蓝。你把墨镜推上去，坐到庄家的位置；对面是久末医院派来的井土谷祈吏，笑得很客气，手却一直按在牌上。八椚红叶在二楼的看台上看着，神峰灯把一杯水放在你手边，低声说：「今晚别输。」筹码推过来的时候，你的指尖有一点抖——不是怕，是药开始退了。你数了数台面上的数，把它和妹妹到毕业为止的生活费对了一遍。"
        }
      ]
    },
    {
      "id": "linggan",
      "index": "",
      "title": "灵感满溢的甜蜜创想",
      "jp": "Sweet Creation",
      "tagline": "抽签抽来的会长，和一群不上学的同伙。",
      "place": "千玉市 · 千玉学园",
      "era": "2024 · 六月",
      "tags": [
        "学园",
        "学生会",
        "创作"
      ],
      "accent": "#E07C93",
      "accent2": "#6FA9C0",
      "kicker": "DRAWN BY LOT",
      "intro": "千玉市是都会边缘的一座城：站前是全城最好的地段，店铺换得极快，只有章鱼烧摊前永远排着十个人以上。千玉学园是这一带最容易考进来、也最容易不去的学校——保住最低出席率、缴够赞助费，座位空着也没人管。六月的全校集会上，一束礼花从你手里炸开，你成了「抽签将军」。",
      "synopsis": "前任学生会长镰仓诗樱把副会长和干事全部赶走，自己跑去四国为下一部作品取材，学生会只剩一间没人用的房间和一堆没人记得的事务。三天后，这一片区的学生会研讨会要在千玉学园开，不能取消；表姐和泉里把妃爱的学分摆上桌，条件是你在三天内凑齐一个学生会。\n\n名单上两个人都不上学：常磐华乃只来了一天就再没出现，真身是给畅销手游画官方图的「野野花」；锦明日海从海外回来，怕生，来这所学校的理由只是校服可爱。加上人气声优和泉妃爱、读者模特龙闲天梨，五个人的任期只到十一月底。这座城不出名，文化祭传不出千玉市；想把「不上学的学生也能做事」证明给别校看，只能自己造出话题。章鱼烧、便利店肉包、深夜的学生会室，就是全部的本钱。",
      "theme": "抽签抽来的夏天",
      "cover": "",
      "cast": [
        {
          "id": "linggan-hina",
          "name": "和泉妃爱",
          "role": "千玉学园一年级、学生会副会长、人气声优",
          "quote": "我开始憧憬声音带有的魅力，开始变得喜欢自己的声音",
          "bio": "「妃爱亲」「哥哥的宠爱队队长」「拥抱魔王」。千玉学园一年级、学生会副会长、人气声优。",
          "tags": [
            "妃爱亲",
            "资正：家里的狗，「资"
          ]
        },
        {
          "id": "linggan-kano",
          "name": "常磐华乃",
          "role": "千玉学园二年级学生",
          "quote": "就是因为你在，害得我的转校生活全白费了……虽然你可能不知道……",
          "bio": "「野野花」——笔名是把「华乃（かの）」倒着念，圈里人称「神画师」。千玉学园二年级学生，与和泉智宏同班；学生会宣传委员，管推特与脸书、会报与宣传册的插画排版，必要时上台；不迎宾接待、不做记录、不露脸、不唱歌。",
          "tags": [
            "野野花",
            "身姿体态：身材纤细、"
          ]
        },
        {
          "id": "linggan-asumi",
          "name": "锦明日海",
          "role": "千玉学园一年级学生",
          "quote": "我想跟妃爱一起，在大舞台上唱歌",
          "bio": "天使，和泉智宏起的。千玉学园一年级学生，学生会书记（第25届）。",
          "tags": [
            "天使，和泉智宏起的",
            "鞋袜：黑色丝袜；深棕"
          ]
        },
        {
          "id": "linggan-shion",
          "name": "镰仓诗樱",
          "role": "千玉学园三年级学生",
          "quote": "我对仅有一人运营的学生会变得空无一人后其他在校生会如何反应，很感兴趣。简而言之就是，看上去很有趣所以不干了",
          "bio": "将军。千玉学园三年级学生，第25届学生会会长，现已卸任，全校叫她「前会长」；同时是职业作家，笔名「星诗樱」，仅去年就卖出十五万册。",
          "tags": [
            "将军"
          ]
        }
      ],
      "timeline": [
        {
          "label": "六月 · 抽签",
          "text": "体育馆的礼花落在头顶，三天后就是片区研讨会。"
        },
        {
          "label": "六月末 · 研讨会",
          "text": "台词本、开场白、别校会长的一记鼻息。"
        },
        {
          "label": "七月 · 时薪",
          "text": "五盒章鱼烧换回一个宣传，肉包换回一个书记。"
        },
        {
          "label": "七月末 · 花展",
          "text": "应援指南装订到深夜，红线上挂着一科不及格。"
        }
      ],
      "openings": [
        {
          "id": "linggan-open-1",
          "title": "礼花落在头上",
          "place": "千玉学园 · 体育馆",
          "time": "六月中旬 · 上午",
          "mood": "礼花、麦克风、全校的视线",
          "text": "体育馆的讲台上，和泉里握着麦克风先叹了一口气，然后宣布学生会长跑路了，三天后片区研讨会照开，所以今天现场选会长。没有人举手。她发下筒状的东西，让所有人一起拔开盖子。你手上炸出一束礼花，降落伞在头顶慢慢落下来，前排的人先笑，笑声一路传到后排。里在台上鼓掌，说恭喜当选。散会以后，她被一群老师围住，回头朝你比了个「午休来学生会室」的手势。你手里还捏着那截空纸筒。"
        },
        {
          "id": "linggan-open-2",
          "title": "半个肉包",
          "place": "便利店 · 门口的公园长椅",
          "time": "六月 · 傍晚",
          "mood": "肉包、冰奶昔、长椅",
          "text": "便利店的蒸柜里只剩最后一个肉包。店员当着你们的面把它判给了你，你看了看旁边那个女孩失落的表情，换成了一杯冰奶昔。走到公园，长椅上刚翻开名单，她就追了上来，双手捧着肉包，说为了道谢特意跑了一趟；又说想到让给她的人可能也想吃，把包子掰成两半，要一人一半。你给了她五十日元，说单方面受惠像是被施舍。她愣了一下，收下了。两个人坐在长椅上吃完半个包子，她自我介绍，说自己叫锦明日海。"
        },
        {
          "id": "linggan-open-3",
          "title": "解扣子的数学",
          "place": "千玉学园 · 学生会室",
          "time": "七月下旬 · 夜里",
          "mood": "台灯、习题、扣子",
          "text": "学生会室的灯开到很晚。桌上摊着数学卷子、应援指南的样张和一盒凉掉的章鱼烧。镰仓诗樱坐在你对面，笔尖点着最后一道题，说做对一题解一颗扣子——她自己的。你算错了两次，她把外套的扣子解开一颗，又一颗，然后笑得像在看一场很远的戏。窗外操场的灯已经灭了。她说，明天再不把装订弄完，全校人手一份的指南就发不出去；说完把卷子推回来，让你重算。"
        }
      ]
    },
    {
      "id": "zhishang",
      "index": "",
      "title": "纸上魔法使",
      "jp": "Paper Wizard",
      "tagline": "森林深处的图书馆里，书会把写下的故事变成真的。",
      "place": "游行寺家离岛 · 幻想图书馆",
      "era": "20XX · 四月",
      "tags": [
        "图书馆",
        "魔法",
        "悬疑"
      ],
      "accent": "#5E548E",
      "accent2": "#D8CBB4",
      "kicker": "TURN THE LAST PAGE",
      "intro": "岛的森林深处有一座宅邸兼图书馆，走海岸线往内陆去，先闻到的是油墨。馆里收着一种书：书脊嵌着宝石，打开的人心里想什么，它就让什么在现实里开演。馆长游行寺暗子守着这些书；二楼的房间里，白发红眼的夜子不肯出门。这个春天，你回到岛上，按预定住进这里。",
      "synopsis": "游行寺家代代收集并保管魔法之书。书以宝石冠名——《翡翠的排挤原理》《缟玛瑙的不在证明》，每一本都写着一个故事，故事一旦开演就不能中途停下，登场人物会被派上角色，性格与记忆向角色靠拢，演到结局才合上。合上以后，相关的人会失去与书有关的记忆，早已知情的人除外。写书削命，也可代笔；以人名冠名的书更狠，加一句话就能改掉一个人的爱情。\n\n岛上传言森林深处的宅院住着魔法使，岛民对游行寺家讳莫如深。你在本岛读了两年书，这个春天回来，住进图书馆，转进藤壶学园，成了夜子的同桌。女仆伏见理央把照顾夜子当成本分；哥哥游行寺汀为了和夜子同班留了一级；妹妹月社妃在鹰山学园，人前是优等生，人后毒舌随便；同班的日向彼方被全班隐形地排挤，谣言说她是带来不幸的魔法使。",
      "theme": "纸上的人也会疼",
      "cover": "",
      "cast": [
        {
          "id": "zhishang-rio",
          "name": "伏见理央",
          "role": "幻想图书馆的女仆：做饭、洗衣、打扫、待客",
          "quote": "到夜子不再需要我为止，理央都一直属于夜子。",
          "bio": "纸上的女仆（她自己说「理央是夜子的随从啦」）——全馆笑得最勤的那一个，偏偏是被写成说不出真相、也不准爱上谁的那一个。幻想图书馆的女仆：做饭、洗衣、打扫、待客，侍候闭门不出的夜子。",
          "tags": [
            "纸上的女仆（她自己说「理",
            "眼部：茶色大眼"
          ]
        },
        {
          "id": "zhishang-kanata",
          "name": "日向彼方",
          "role": "藤壶学园二年级生、侦探部部长（社团最早由月社妃创立",
          "quote": "我要让幻想图书馆充满笑容。这是名侦探彼方的使命！",
          "bio": "「名侦探彼方」，岛上还有人背后叫她破局者。藤壶学园二年级生、侦探部部长（社团最早由月社妃创立，她接手，并把它撑成了自己的城堡）。",
          "tags": [
            "名侦探彼方",
            "眼部：蓝色大眼"
          ]
        },
        {
          "id": "zhishang-kisaki",
          "name": "月社妃",
          "role": "鹰山学园的学生",
          "quote": "现在的我是从世界独立出来的存在。一个做什么都能原谅，像系统漏洞一样的东西。",
          "bio": "一辈子的恶梦（她自己封的）——嘴上说最讨厌哥哥、要折磨他一辈子，实际上是全馆唯一一个拿命给这份爱结账的人。鹰山学园的学生，幻想图书馆的住客；对外是四条琉璃活着的妹妹，同时又是被一本书安排成他恋人的那个人。",
          "tags": [
            "一辈子的恶梦（她自己封的",
            "眼部：绿色大眼",
            "常着：连裤袜，配校服"
          ]
        },
        {
          "id": "zhishang-yoruko",
          "name": "游行寺夜子",
          "role": "游行寺家独女、幻想图书馆馆长游行寺暗子的女儿、游行寺",
          "quote": "反正是开玩笑吧？怎么可能会有向你告白的女孩子？",
          "bio": "「笼中的小白鸟」，也是全岛嘴里的「受诅咒的少女」。游行寺家独女、幻想图书馆馆长游行寺暗子的女儿、游行寺家魔法之书负责人的继承人。",
          "tags": [
            "笼中的小白鸟",
            "眼部：紫红色大眼"
          ]
        }
      ],
      "timeline": [
        {
          "label": "四月 · 回岛",
          "text": "海岸的樱花、妹妹的坏话、图书馆的油墨味。"
        },
        {
          "label": "四月 · 翡翠",
          "text": "课本里的恐吓信，楼梯口的一只手。"
        },
        {
          "label": "五月 · 红宝石",
          "text": "夜子走进教室，又自己走回书房。"
        },
        {
          "label": "六月 · 缟玛瑙",
          "text": "十天的梦，醒来只剩书页和一年。"
        }
      ],
      "openings": [
        {
          "id": "zhishang-open-1",
          "title": "海岸上的妹妹",
          "place": "岛 · 海岸小路",
          "time": "四月上旬 · 午后",
          "mood": "海风、樱花、行李",
          "text": "船靠岸的时候，海风和樱花一起扑过来。你拎着行李走上小路，长发的女孩已经等在岸边，单手压着被风吹乱的发梢，一脸不高兴地说讨厌大海。是月社妃。她接过你一只袋子，嘴上说你该把头发剪短，又说这两年你的心早被她的头发夺去了；走到森林深处，油墨和旧木头的味道先于门扉抵达。她问你夜子现在还是不是书迷，你说这问题不必回答。她笑了一声，走在前面，脚步很轻。"
        },
        {
          "id": "zhishang-open-2",
          "title": "课桌上的刻痕",
          "place": "藤壶学园 · 一年一班教室",
          "time": "四月 · 放学后",
          "mood": "课桌、刻痕、走廊的笑声",
          "text": "放学后的教室只剩值日生。你收拾书包时，前座的日向彼方还趴在桌上，用铅笔在课本的空白处画小小的翅膀。她抬起头，笑得很快：「你先走吧，我把这个擦掉。」你走过去才看见，她的桌面上被人用圆规刻了字，刻得很深，木屑还留在缝里。她用袖子去盖，没盖住，索性把整本课本合上，说这没什么，反正她习惯了。走廊尽头有人在笑，声音不大，刚好能听见。"
        },
        {
          "id": "zhishang-open-3",
          "title": "枕头站在门口",
          "place": "幻想图书馆 · 二楼走廊",
          "time": "六月 · 深夜",
          "mood": "月光、旧木地板、枕头",
          "text": "六月的夜里，走廊的窗没有关，月光把旧木地板照成一条浅浅的河。你听见门外有很轻的脚步声，开门时，月社妃抱着枕头站在那里，长发披在肩上，脸上没有平时的刻薄。她说睡不着，说这栋房子一到夜里就太安静，安静得像有人在翻书。她没有问能不能进来，只是往门里走了一步，又停住。楼下传来理央关灯的声音，一格一格地暗下去。她抬头看你：「哥，明天开始，我要好好疼你，也好好虐待你。」"
        }
      ]
    },
    {
      "id": "lianai",
      "index": "",
      "title": "恋爱？我就借走了哦！",
      "jp": "Koi Kari",
      "tagline": "时薪高得吓人的兼职：扮演别人的男朋友。",
      "place": "东京 · 清凛学园 / 站前",
      "era": "2024 · 七月",
      "tags": [
        "都市",
        "打工",
        "契约"
      ],
      "accent": "#D98F3F",
      "accent2": "#6FA9BF",
      "kicker": "RENTED BY THE HOUR",
      "intro": "东京把住宅区、补习班、车站和繁华街全塞进步行圈，二十四小时营业的地方多得是。你在清凛学园上学，校规禁止打工，家里只有一间公寓和妹妹新海月。招聘网站上那条「人才租赁派遣」还开着：扮演恋人、朋友、兄弟，报酬现金直付。你梳起刘海，换一张脸，就算上班。",
      "synopsis": "人才租赁派遣在电视上打过广告：从恋人到朋友，连兄弟姐妹关系都 OK。规矩薄得离谱，只要不收到投诉，怎么都行；报酬不经公司的手，公司多可疑都不影响拿钱。契约一断，扮演立刻作废——「刚才全是演技，是你付的报酬换来的内容」。你需要的只是一个出口：钱能让妹妹幸福。\n\n第一单委托人是同班同学濑川绘未。她为了在朋友面前撑住「交往一年的男友」，花钱雇人；那天你把刘海梳成大背头，她没认出来。两小时撑住了，合照也拍了，结算时你一句「工作之外不跟你扯上关系」把气氛砸碎。夏天从这里开始：她成了你打工那家餐厅的后辈，天满八纯用十万日元买你当「夜晚的朋友」，讲师空路椿要你在校内保密，妹妹把升学和你绑在一起。这座城市里，面子比事实好用，秘密有价，恋爱按小时租。",
      "theme": "恋爱按时计费",
      "cover": "",
      "cast": [
        {
          "id": "lianai-hasumi",
          "name": "天满八纯",
          "role": "清凛学园三年级学生、备考生",
          "quote": "所以，今晚就是我和你——作为朋友的最后一晚了",
          "bio": "绰号「哟呼呼女」（新海幸背地里起的，照她那声标志性的笑取的），她的招牌是「小坏天满」。清凛学园三年级学生、备考生，暑期补习班在籍；同年级的名人「优等生天满」；人才租赁派遣平台的委托人——她租的是**朋友**这一档；天满家的独生女，父母环游世界期间一个人守着有保姆的房子。",
          "tags": [
            "绰号「哟呼呼女",
            "鞋袜：白色短袜；深褐",
            "发型：两侧用黑色小蝴"
          ]
        },
        {
          "id": "lianai-momoko",
          "name": "小关桃子",
          "role": "三年级学生",
          "quote": "因为真心喜欢你的只有我呀！",
          "bio": "网游里叫「桃花」，号「Peach Flash」，自报是「网游之光——Peach Flash」；同班女生张口就是「桃桃」。三年级学生，备考中，与绘未、咲希同班；网游玩家；暑假起在打工。",
          "tags": [
            "网游里叫「桃花",
            "眼部：紫罗兰色大眼，",
            "官方资料：三年级学生"
          ]
        },
        {
          "id": "lianai-tsuki",
          "name": "新海月",
          "role": "中学生",
          "quote": "是的，毕竟兄长不会做饭",
          "bio": "子夏封她「真妹妹」，亦作「亲妹妹」。中学生，新海家的小女儿，也是这个家实际的当家人。",
          "tags": [
            "子夏封她「真妹妹",
            "眼部：琥珀金色大圆眼",
            "官方资料：14 岁（"
          ]
        },
        {
          "id": "lianai-chinatsu",
          "name": "泉千夏",
          "role": "悠丘学园一年级2班、泉家的姐姐、双胞胎里的姐姐",
          "quote": "那个……暑假的时候，那个委托还能拜托你吗？",
          "bio": "外号「害羞鬼千夏」（雏山梦乃起的）。悠丘学园一年级2班、泉家的姐姐、双胞胎里的姐姐，升学补习班学生；人才租赁派遣平台的委托人，与子夏联名买下整套「哥哥」服务。",
          "tags": [
            "外号「害羞鬼千夏",
            "眼部：金色眼睛，眼形",
            "下身：黑色紧身短裤，"
          ]
        },
        {
          "id": "lianai-konatsu",
          "name": "泉子夏",
          "role": "悠丘学园一年级2班、泉家的双胞胎妹妹、高中一年级生",
          "quote": "我要用续约套餐点哥哥",
          "bio": "外号「变态妹妹」（新海幸在心里这么记她）。悠丘学园一年级2班、泉家的双胞胎妹妹、高中一年级生；人才租赁派遣平台的共同委托人，与姐姐联名买下「哥哥」的续约套餐；Sunny ＆ Lettuce 的服务生，与濑川绘未同店打工。",
          "tags": [
            "外号「变态妹妹"
          ]
        },
        {
          "id": "lianai-emi",
          "name": "濑川绘未",
          "role": "Sunny ＆ Lettuce 家庭餐厅的服务员",
          "quote": "我知道你喜欢幸。但幸可是……我的男朋友。我绝不会让给你，谁都不让",
          "bio": "绰号「濑皮」（美滨咲希起的名），班里私下的定位是「爱面子」。Sunny ＆ Lettuce 家庭餐厅的服务员，新人，带她的前辈正是新海幸；同时是人才租赁派遣平台的委托人——她租的是**恋人**这一档，雇幸假扮男朋友；本职是清凛学园三年级C班学生、正在备考。",
          "tags": [
            "绰号「濑皮",
            "眼部：品红大眼",
            "鞋袜：白色中筒袜；深"
          ]
        }
      ],
      "timeline": [
        {
          "label": "七月 · 第一单",
          "text": "车站前两小时的男友，合照、报酬、一句不必再见。"
        },
        {
          "label": "七月 · 契约",
          "text": "一千日元买一小时，然后握手，绕开平台。"
        },
        {
          "label": "八月 · 泳池",
          "text": "两份委托同一天，谁都没有先摊牌。"
        },
        {
          "label": "八月末 · 河岸",
          "text": "一叠现金和一本存折，同一天摆在河岸边。"
        }
      ],
      "openings": [
        {
          "id": "lianai-open-1",
          "title": "深夜的招聘页",
          "place": "新海家 · 客厅",
          "time": "七月上旬 · 深夜",
          "mood": "荧光、账本、妹妹的追问",
          "text": "客厅的灯只开了一盏。妹妹月已经回房，桌上留着她热过的饭和一叠账单。你把计算器按到没电，又把招聘网站翻出来：人才租赁派遣，学生可，报酬现金直付。时薪那一栏的数字看久了有点不真实。月的房门忽然开了一条缝，她抱着枕头站在那里，问你明年到底打不打算升学；你说先把饭吃完。她没有走，说你每天打工到深夜，连一个朋友都没有，这样的人生哪里健全。屏幕的光照在你脸上，投递键就在那里。"
        },
        {
          "id": "lianai-open-2",
          "title": "打烊后的后辈",
          "place": "家庭餐厅 Sunny ＆ Lettuce · 后厨",
          "time": "七月中旬 · 打烊后",
          "mood": "洗洁精、收银机、湿掉的袖口",
          "text": "打烊后的后厨只剩排风扇在响。你把这周的排班表贴上墙，濑川绘未蹲在地上擦最后一格地砖，制服袖子卷到手肘。她说今天的客人真难缠，又说这家店的时薪其实不算低；说到一半，她把抹布拧干，抬头问你，为什么那天在车站前要说那种话。收银机那边弹出一声轻响，新店长远山爱季在数零钱，头也不抬地说，别在店里吵架。绘未低下头，把抹布丢进水桶，水花溅了一点在你鞋上。"
        },
        {
          "id": "lianai-open-3",
          "title": "大头贴的闪光",
          "place": "繁华街 · 游戏厅",
          "time": "八月中旬 · 深夜",
          "mood": "霓虹、抓娃娃机、快门",
          "text": "深夜的游戏厅里，抓娃娃机的灯一盏挨一盏，音效吵得人说话要提高声音。天满八纯把最后一百日元投进去，爪子晃了两下，什么也没抓到；她转过身来，说要去拍大头贴，还说要拍得「像小坏女一点」。机器的小隔间只容得下两个人，屏幕倒数的数字跳得很快。快门按下去的前一瞬，她忽然凑过来，嘴唇擦过你的脸颊。照片吐出来的时候，她抢过去看，笑得很大声。你听见自己心跳的声音，比机器的音效还响。"
        }
      ]
    }
  ]
};
  
  const GAL_ASSETS = {"covers": {"tsuki": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/tsuki.webp?v=3", "theo": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/theo.webp?v=3", "waltz": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/waltz.webp?v=3", "canvas": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/canvas.webp?v=3", "kaoru": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/kaoru.webp?v=3", "sakura": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/sakura.webp?v=3", "tsumi": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/tsumi.webp?v=3", "fly": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/fly.webp?v=3", "lemon": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/covers/lemon.webp?v=3", "nine": "https://origin.picgo.net/2026/11/18/6dabf5ca-d536-4033-9ed0-c84ffbb93b5585b66d22ec320059.png", "hanako": "https://origin.picgo.net/2026/11/18/b959bcc3-7048-45a6-aa9e-751a046019ef9d5af7af2f2c7da6.png", "domain": "https://origin.picgo.net/2026/11/14/b744be6b-1105-4860-969e-3b3623254b3a16fbe2f6df938e54.png", "summerpockets": "https://origin.picgo.net/2026/11/18/2932bd86c77f1fda93ae0303a02cb6526a5bfb37e3e8089b.png", "tiannv2": "https://origin.picgo.net/2026/11/18/c081d7ca6a566a3c585c43f05f5c6e9ce31e98f5bf929bde.png", "tiannv25": "https://origin.picgo.net/2026/11/18/3cf1b4296a5c84e50c7129ad5b613254b8bd7d45a4703c5f.png", "tiannv3": "https://origin.picgo.net/2026/11/18/8af4b0a6fd6fac485a8d4a906508f15a36583c35fdd40f78.png", "yuanqi": "https://origin.picgo.net/2026/11/18/f84565d8ab7c7ad276f490ea5bffca3def6e2b895136d9fe.png", "chunbai": "https://origin.picgo.net/2026/11/18/e9c54d42152857c19821f182bde149bf02c8ad5de8f74b9d.png", "shuizang": "https://origin.picgo.net/2026/11/18/28a58ae2609e1d5bd8e3c50ef92a2c6e2ae33c2036c9a30f.png", "linggan": "https://origin.picgo.net/2026/11/18/4615f918f5035f57f010ef7bc2283effdd6dc1ef08032975.png", "zhishang": "https://origin.picgo.net/2026/11/18/5050e54dd2133fffd2a80b41de1a96eed8f37f324dcf8b11.png", "lianai": "https://origin.picgo.net/2026/11/18/18e01c495f01b01960a793d5d6071ee707086541dbef8231.png"}, "cast": {"稻羽结衣": {"normal": "https://origin.picgo.net/2026/11/10/--6c5493a013652a6f.png", "stage": "https://origin.picgo.net/2026/11/10/--4fcc1c039adffec9.png"}, "九条玖琉璃": {"normal": "https://origin.picgo.net/2026/11/10/--69f500047ee50659.png", "stage": "https://origin.picgo.net/2026/11/10/--010c4e51c894e031.png"}, "雪代铃乃": {"normal": "https://origin.picgo.net/2026/11/10/--d9f51c9b83025311.png", "stage": "https://origin.picgo.net/2026/11/10/--22341338598a048f.png"}, "白鹭茉百合": {"normal": "https://origin.picgo.net/2026/11/10/--a27b92f0a5bd4aba.png", "stage": "https://origin.picgo.net/2026/11/10/--14b337cfc4a7dca9.png"}, "皇天音": {"normal": "https://origin.picgo.net/2026/11/10/--aae5980bde7c50d1.png", "stage": "https://origin.picgo.net/2026/11/10/--1154d53ba280985f.png"}, "水无濑樱子": {"normal": "https://origin.picgo.net/2026/11/10/--cbe9719abaee30c4.png", "stage": "https://origin.picgo.net/2026/11/10/--4650c012d35106af.png"}, "冰川里奈": {"normal": "https://origin.picgo.net/2026/11/10/--ffe908a4554c8903.png", "stage": "https://origin.picgo.net/2026/11/10/--f2255e79670b6e6f.png"}, "川内野优美": {"normal": "https://origin.picgo.net/2026/11/10/--3397e5253ea4d089.png", "stage": "https://origin.picgo.net/2026/11/10/--0c7225b1d6d3f2b3.png"}, "鸟谷真琴": {"normal": "https://origin.picgo.net/2026/11/10/--8d8c8db832d09cc9.png", "stage": "https://origin.picgo.net/2026/11/10/--209e975a8c3b2499.png"}, "夏目蓝": {"normal": "https://origin.picgo.net/2026/11/10/--71bdf6952ba35608.png", "stage": "https://origin.picgo.net/2026/11/10/--f2dde0704970c7fe.png"}, "夏目雫": {"normal": "https://origin.picgo.net/2026/11/10/--81ea234c315fe848.png", "stage": "https://origin.picgo.net/2026/11/10/--53e06023349a686b.png"}, "御樱稟": {"normal": "https://origin.picgo.net/2026/11/10/--54f5072aaf8eb4cd.png", "stage": "https://origin.picgo.net/2026/11/10/--8f5763e09606369a.png"}, "冰堂芹香": {"normal": "https://origin.picgo.net/2026/11/10/--df4f5b7f9d43180d.png", "stage": "https://origin.picgo.net/2026/11/10/--95178cbf5b25349f.png"}, "牧濑皋月": {"normal": "https://origin.picgo.net/2026/11/10/--8012393a4d343e0f.png", "stage": "https://origin.picgo.net/2026/11/10/--e95e68291330ae72.png"}, "千原乃亚": {"normal": "https://origin.picgo.net/2026/11/10/--4da5388be869ddcb.png", "stage": "https://origin.picgo.net/2026/11/10/--eb2795948548570a.png"}, "朝仓千弘": {"normal": "https://origin.picgo.net/2026/11/10/--7dd11b16024f5f30.png", "stage": "https://origin.picgo.net/2026/11/10/--bf36df2a3f822f44.png"}, "天城咲夜": {"normal": "https://origin.picgo.net/2026/11/10/--8a27d536a7089457.png", "stage": "https://origin.picgo.net/2026/11/10/--501c662b8d22b3ca.png"}, "夏目朱里": {"normal": "https://origin.picgo.net/2026/11/10/--895e3e04c5b496f9.png", "stage": "https://origin.picgo.net/2026/11/10/--a3a5ba6d03a90837.png"}, "安娜塔西亚": {"normal": "https://origin.picgo.net/2026/11/10/--9cec81ebcb330f91.png", "stage": "https://origin.picgo.net/2026/11/10/--a43e8e086e84ee4f.png"}, "凤怜奈": {"normal": "https://origin.picgo.net/2026/11/10/--8cfd64c920a42a7e.png", "stage": "https://origin.picgo.net/2026/11/10/--e5848274209dafb8.png"}, "猫西昭江": {"normal": "https://origin.picgo.net/2026/11/10/--1ae124b758a26580.png", "stage": "https://origin.picgo.net/2026/11/10/--f13a7437b6e83ae7.png"}, "乾幸": {"normal": "https://origin.picgo.net/2026/11/10/--2e61f764be0e941a.png", "stage": "https://origin.picgo.net/2026/11/10/--b1f2c005b7e1ed52.png"}, "瑞木信": {"normal": "https://origin.picgo.net/2026/11/10/--021a34721bcb1f68.png", "stage": "https://origin.picgo.net/2026/11/10/--b5fa2f5f33909cde.png"}, "狮子堂千晴": {"normal": "https://origin.picgo.net/2026/11/10/--73f1c8e7892a743e.png", "stage": "https://origin.picgo.net/2026/11/10/--09a96134a2092c21.png"}, "乌丸紫月": {"normal": "https://origin.picgo.net/2026/11/10/--d10b82a7e44a3bea.png", "stage": "https://origin.picgo.net/2026/11/10/--f28b96fa50fbfbed.png"}, "江利原美月": {"normal": "https://origin.picgo.net/2026/11/10/--1e2c3f9a49cfad5d.png", "stage": "https://origin.picgo.net/2026/11/10/--cef2aad6499ca465.png"}, "门胁樱": {"normal": "https://origin.picgo.net/2026/11/10/--ce417cd3bac90f54.png", "stage": "https://origin.picgo.net/2026/11/10/--d004b44dfc873f71.png"}, "天司凉香": {"normal": "https://origin.picgo.net/2026/11/10/--2ca24b939ce3147b.png", "stage": "https://origin.picgo.net/2026/11/10/--726f125dd09ba1a8.png"}, "小峰真奈美": {"normal": "https://origin.picgo.net/2026/11/10/--24d0cb08475393f3.png", "stage": "https://origin.picgo.net/2026/11/10/--e6f94ce1ee49f326.png"}, "新垣若菜": {"normal": "https://origin.picgo.net/2026/11/10/--bdd4578cca495812.png", "stage": "https://origin.picgo.net/2026/11/10/--68708fd4bb5cf3df.png"}, "真原葵": {"normal": "https://origin.picgo.net/2026/11/10/--492a55e82a412ae9.png", "stage": "https://origin.picgo.net/2026/11/10/--e9db54583a5d023d.png"}, "真原祐里": {"normal": "https://origin.picgo.net/2026/11/10/--23ec968a2eabbdfd.png", "stage": "https://origin.picgo.net/2026/11/10/--ae667f59f3f3dcb2.png"}, "布琉艾特·妮科莱特·普朗凯特": {"normal": "https://origin.picgo.net/2026/11/10/--ca927c2e7784f7f4.png", "stage": "https://origin.picgo.net/2026/11/10/--3af331839ab2ffd5.png"}, "大藏里想奈": {"normal": "https://origin.picgo.net/2026/11/10/--4c47fbb3c9254fa5.png", "stage": "https://origin.picgo.net/2026/11/10/--534b9c191a34b8e4.png"}, "梅丽尔·琳琪": {"normal": "https://origin.picgo.net/2026/11/10/--2f090a5934dc1242.png", "stage": "https://origin.picgo.net/2026/11/10/--48c5466aff37cfa5.png"}, "花之宫瑞穗": {"normal": "https://origin.picgo.net/2026/11/10/--098fd0f2c7b14b24.png", "stage": "https://origin.picgo.net/2026/11/10/--efe9cce668b2f59b.png"}, "柳之濑凑": {"normal": "https://origin.picgo.net/2026/11/10/--2fb6c225e40826d6.png", "stage": "https://origin.picgo.net/2026/11/10/--a9b97af1ce89c818.png"}, "小仓朝日": {"normal": "https://origin.picgo.net/2026/11/10/--85d3177552e21c35.png", "stage": "https://origin.picgo.net/2026/11/10/--8afce5d44077b05f.png"}, "樱小路露娜": {"normal": "https://origin.picgo.net/2026/11/10/--f33b36910183ef0a.png", "stage": "https://origin.picgo.net/2026/11/10/--7368fa3bcf2fa32a.png"}, "尤希尔·弗露露·让梅尔": {"normal": "https://origin.picgo.net/2026/11/10/--d2a805366492526b.png", "stage": "https://origin.picgo.net/2026/11/10/--0aecfc4d88982244.png"}, "铃森伊千果": {"normal": "https://origin.picgo.net/2026/11/10/--bbefaa813a59241f.png", "stage": "https://origin.picgo.net/2026/11/10/--a28b799007f5a35a.png"}, "觋夕莉": {"normal": "https://origin.picgo.net/2026/11/10/--cfcbd58db3f96a60.png", "stage": "https://origin.picgo.net/2026/11/10/--80b8216824a9f5d4.png"}, "觋夕摩": {"normal": "https://origin.picgo.net/2026/11/10/--d8e9f756dab64ef1.png", "stage": "https://origin.picgo.net/2026/11/10/--8df830180d6dbfd3.png"}, "御殿场镜子": {"normal": "https://origin.picgo.net/2026/11/10/--3659841d09174d71.png", "stage": "https://origin.picgo.net/2026/11/10/--a8adb2d4acf8c140.png"}, "茶园那优花": {"normal": "https://origin.picgo.net/2026/11/10/--e1e92048c9563987.png", "stage": "https://origin.picgo.net/2026/11/10/--5ccfa48cd9d4d3ab.png"}, "岛越月望": {"normal": "https://origin.picgo.net/2026/11/10/--66cd1a7b49851997.png", "stage": "https://origin.picgo.net/2026/11/10/--dc0cc720524462d5.png"}, "二见原莉莉子": {"normal": "https://origin.picgo.net/2026/11/10/--a4dcefed03ba40b5.png", "stage": "https://origin.picgo.net/2026/11/10/--45d6b7af98087092.png"}, "砾川美玖": {"normal": "https://origin.picgo.net/2026/11/10/--286edf32e8db6a61.png", "stage": "https://origin.picgo.net/2026/11/10/--5dbf9001228f02bf.png"}, "阳见惠凪": {"normal": "https://origin.picgo.net/2026/11/10/--f18a3bc312267368.png", "stage": "https://origin.picgo.net/2026/11/10/--9b3ec8837691c1cd.png"}, "隐杏珠": {"normal": "https://origin.picgo.net/2026/11/10/--d1d88f3507010700.png", "stage": "https://origin.picgo.net/2026/11/10/--b3e3a4d156248c91.png"}, "新海天": {"normal": "https://origin.picgo.net/2026/11/13/9nine--3631f76f77f67946.png", "stage": "https://origin.picgo.net/2026/11/13/9nine--a78b4a39491377d8.png"}, "九条都": {"normal": "https://origin.picgo.net/2026/11/13/9nine--dd04dc09ffa93abe.png", "stage": "https://origin.picgo.net/2026/11/13/9nine--b551af98d82b8785.png"}, "苏菲缇雅": {"normal": "https://origin.picgo.net/2026/11/13/9nine--7c5bfe1e8b17138c.png", "stage": "https://origin.picgo.net/2026/11/13/9nine--7c5bfe1e8b17138c.png"}, "香坂春风": {"normal": "https://origin.picgo.net/2026/11/13/9nine--2b4f0417d2413490.png", "stage": "https://origin.picgo.net/2026/11/13/9nine--edd8d0987197930d.png"}, "结城希亚": {"normal": "https://origin.picgo.net/2026/11/13/9nine--5b04b43746bb590f.png", "stage": "https://origin.picgo.net/2026/11/13/9nine--89445fcc32a2743c.png"}, "成濑沙月": {"normal": "https://origin.picgo.net/2026/11/13/9nine--1c09ee8d9d4135f9.png", "stage": "https://origin.picgo.net/2026/11/13/9nine--1c09ee8d9d4135f9.png"}, "花子": {"normal": "https://origin.picgo.net/2026/11/13/--f37feb32b757c189.png", "stage": "https://origin.picgo.net/2026/11/13/--3400219468506b6a.png"}, "西园寺风莉": {"normal": "https://origin.picgo.net/2026/11/14/--e1042745e3c0a593.png", "stage": "https://origin.picgo.net/2026/11/14/--42cfd74bd9ebf68e.png"}, "贵船柚子": {"normal": "https://origin.picgo.net/2026/11/14/--58ba66fa6ab85b67.png", "stage": "https://origin.picgo.net/2026/11/14/--74f43ccf68584ebc.png"}, "大垣日向": {"normal": "https://origin.picgo.net/2026/11/14/--96aa4e71003773d2.png", "stage": "https://origin.picgo.net/2026/11/14/--6d02b26185dd69fe.png"}, "皆见美结": {"normal": "https://origin.picgo.net/2026/11/14/--5e649b16d21a802a.png", "stage": "https://origin.picgo.net/2026/11/14/--aa49c63f8b4a3229.png"}, "那波七海": {"normal": "https://origin.picgo.net/2026/11/14/--0f7b23716f746540.png", "stage": "https://origin.picgo.net/2026/11/14/--07b695b0c3d54b3a.png"}, "飞鸟凑": {"normal": "https://origin.picgo.net/2026/11/14/--4b669db2bc7ccd64.png", "stage": "https://origin.picgo.net/2026/11/14/--53434e0e7fb2e28d.png"}, "䌷·文德斯": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/outfit3.webp"}}, "久岛鸥": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/outfit2.webp"}}, "加藤羽未": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/outfit2.webp"}}, "水织静久": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/outfit3.webp"}}, "神山识": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/outfit1.webp"}}, "空门苍": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/outfit2.webp"}}, "冰见山玲": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/outfit3.webp"}}, "茑町千岁": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/outfit4.webp"}}, "黑姬结灯": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/outfit4.webp"}}, "一之濑穗波": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/outfit3.webp"}}, "沓野奏": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/outfit4.webp"}}, "砚川·优芙拉希·泪香": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/outfit4.webp"}}, "高社雪静": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/outfit3.webp"}}, "御所院冬桦": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/outfit3.webp"}}, "斯卡蕾特·斑鸠·维斯塔莉娅": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/outfit3.webp"}}, "柳木叶梦": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/outfit3.webp"}}, "柳木诗梦": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/outfit3.webp"}}, "鸿纱由美": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/outfit4.webp"}}, "八乙女凉花": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/outfit3.webp"}}, "冈井蒲公英": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/outfit4.webp"}}, "寿珠祈": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/outfit3.webp"}}, "漆原绫子": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/outfit4.webp"}}, "衣川美卯": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/outfit3.webp"}}, "近江希未": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/outfit2.webp"}}, "乾纱凪": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/outfit3.webp"}}, "天羽美羽": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/outfit3.webp"}}, "安洁莉娜·菜夏·史威尔": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/outfit3.webp"}}, "濑名爱理": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/outfit3.webp"}}, "瓜生樱乃": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/outfit4.webp"}}, "井土谷祈吏": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kiri/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kiri/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kiri/outfit1.webp"}}, "小不动摇": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/outfit3.webp"}}, "汐入玖玖里": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/outfit3.webp"}}, "煤谷小夜": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/outfit2.webp"}}, "茅崎夕樱": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/outfit2.webp"}}, "和泉妃爱": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/outfit2.webp"}}, "常磐华乃": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/outfit2.webp"}}, "锦明日海": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/outfit2.webp"}}, "镰仓诗樱": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/outfit3.webp"}}, "伏见理央": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/outfit1.webp"}}, "日向彼方": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/outfit1.webp"}}, "月社妃": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/outfit1.webp"}}, "游行寺夜子": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/outfit1.webp"}}, "天满八纯": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/outfit3.webp"}}, "小关桃子": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/outfit2.webp"}}, "新海月": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/outfit1.webp", "outfits": {"衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/outfit2.webp"}}, "泉千夏": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/outfit2.webp"}}, "泉子夏": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/outfit3.webp"}}, "濑川绘未": {"normal": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/normal.webp", "stage": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/uniform.webp", "outfits": {"校园制服": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/uniform.webp", "衣装①": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/outfit1.webp", "衣装②": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/outfit2.webp", "衣装③": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/outfit3.webp", "衣装④": "https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/outfit4.webp"}}}, "frames": {"fly": {"canvas": [656, 1000], "crop": [0, 16, 656, 984], "h": 101.63, "left": 0, "top": -1.63}, "sakura": {"canvas": [948, 1734], "crop": [0, 0, 948, 1422], "h": 121.94, "left": 0, "top": 0}, "kaoru": {"canvas": [556, 764], "crop": [34.3, 0, 509.3, 764], "h": 100, "left": -6.73, "top": 0}, "canvas": {"canvas": [352, 980], "crop": [0, 0, 352, 528], "h": 185.61, "left": 0, "top": 0}, "waltz": {"canvas": [365, 789], "crop": [0, 7.8, 365, 547.5], "h": 144.11, "left": 0, "top": -1.43}, "theo": {"canvas": [1280, 720], "crop": [403, 0, 480, 720], "h": 100, "left": -83.96, "top": 0}, "tsuki": {"canvas": [1280, 720], "crop": [403, 0, 480, 720], "h": 100, "left": -83.96, "top": 0}, "tsumi": {"canvas": [1280, 720], "crop": [400.5, 0, 480, 720], "h": 100, "left": -83.44, "top": 0}, "lemon": {"canvas": [1024, 3674], "crop": [0, 0, 1024, 1536], "h": 239.19, "left": 0, "top": 0}, "nine": {"h": 138, "left": 50, "top": 0, "center": true, "cast": {"新海天": {"h": 138, "left": 50, "top": 0, "center": true}, "九条都": {"h": 157, "left": 50, "top": 0, "center": true}, "苏菲缇雅": {"h": 72, "left": 50, "top": 8, "bust": true}, "香坂春风": {"h": 145, "left": 50, "top": 0, "center": true}, "结城希亚": {"h": 213, "left": 50, "top": 0, "center": true}}}, "hanako": {"h": 100, "left": 50, "top": 0, "center": true}, "domain": {"h": 115, "left": 50, "top": 0, "center": true}}, "hero": "data:image/webp;base64,UklGRqxXAABXRUJQVlA4IKBXAACwKwKdASroA3ECPmEulEgkIiknotGpSSAMCWlux1MdyZUL6R48vVr4DOKI1Q6L3mb2gARjvQBck8fnVCztvSM8/6nvZenHnF+rLnsPPf9P/q0Oig9ZH/K7//0s/bH/n+oLqpzMG1Th7ra/nzOn/gd8/7B/S+gR7W8IXa67n5gvtP+K88D8jzl/mfUA/wXpV4CH4/1CP5h/m/SK0gPZnsQdLz0W/3nFpouu2haKsm+bfx3een5IclJBjpd3+adaALmyOKi/xiBvDLXLuRsJuRsJuK5gzNu+qeOuhEV9K2RaS9fKmziwAk/wlhGisgjMLnk5E0Bji90ZzLGBn1mIP5hdv25IskbCWUbP3nfVXi9NriqKx2MbErV8WDdPtz/Ccw8ZdHaGVszsgFFakfc4UQwL8t0Wvh/BuAnrIZhHSIEgnshuBztGu+xwVShmvhx3hD9T5GejVTjXZ5kO5/wAI1SgKUPgb+kBigh5caJJjqsAgFMP4+oSfOblhCnwZ1PisLUZeoMhlpfNJz6PRZKNNOhFSTM7Mz38fqLIdGVYTeswPvkLbwzcab502kUSzjZhKHxPxDDk34+WrOc+/TxaifUR2FiIoX8ywkZIX5T8o/GZqB45n7/GIG+w06yHJbQPvL24gIIkn+VZbjFG13qH/WDai1lOwMfu+Kx3pNmZxnZn6CfK2ZpvRhTx99mQ4fydhnDTXD7tMn8/6oUVhlm9KQwKIpIOi03Cj/WktP/qYA6qWP3edmZWqCnnY7S1dIsLL7UnrrHmBit5eRxXDJYNW0u/12tv5Rqhsi+PomnZU89GGJ/zy0jnBLA1jN1qh03XDJAxmYKQY5bLE+ECmLdXrDpyhYen4VA1XLS3qBoFRJw+Hzzx/JhfPnRBkQfq1Sqz9m7K8oGzV8rPyGLp/2GhYuS3Al689X22z0FOwB76U3TjPT8pgCtpdONV4MqSoTfLINNA+6azrlUtaJks+d4UcNv2KldYFongLKQxtEmgqJER9M3D58MicYgacGNIpjXbiZUEMQXu+gQjej5qkA7oZLYsvU67SpVqvjWCGwf71Dbie20ekObv0Euk+MdT/3CFlzKGRaWUmX4oNrVm+VL+lCCZLKMQgu7z08c+cPRW9staJaD8wKJ1pjRBvw1r2zJY7HPUpJxmBfpczfuASa+yl5vK5+4DBqtygIjkD3Atbhkx1y5dfqYso4LfepEBAcJY92ZtQ6qYmOFosLekzye73ouM0ccM5Q6MUMjLqfyQn2Z94x5skRR6iw0cPGN6rE0ORxhBHXRm0QO8g/1tV/uXkFm0W4/42csAyFcpvrobuTZFin0mnCNZA0+axInr0K7iiZ4AVfVppl/nZZmV/47mLqlN8js2ViW3M0rpQJ2ypLjW6sjQBCwZkkhAX69j/m2EN51cjApAQx2UdGzWfC6+iAnY0QsZ+DpFaBFfRycglv/PCzrNpjqOSIWy++7hzaWi3ISIgmv28SF5Uq20Y48p7nRJReKSazzXYqc1RUaJJxqfcvFXsVh/SvMaSzdXkZE6hMSHmSrGB/7YRr/NpMOSCac1rlAT3mkGVKU0u0P2vZbEUfqTbUTduepzVNXOzONNHoKcIGFy8cjb37pmg1zt/g3zswxvWclm7WI/imnJY6L09Jkjf57GPZ7eUI69Je/DS899Jf7Ddus9TLTsSIRUfqLIfhuDN/xW0M4JFhhY0MP7agnqOxSHnV9SVzwbHxpivsJIx2TNp+LjTW+GB/Dh+m9QQFMCmAxaYvr9oASqw3UaJZFiP8oCQww356SNkeJ3Yn1j7KtwgVBTasjBeYagOo2M3ZbchfxWi6fAKM3IPV2PWralDjVndyivYeW6FwycE2cbHCs7F8qkyBQlA5HjQWGVP5hIOWoY2JkD9D1nDkCX3pd/geCboF2TE/g+O89PyjWut2fNy7Gxrd3/LxFIvDwIJ8Qo1/hESthFm/WG6Pw0dEGDVbmw5FqsaOD70tDqxq+M80HH7xq1I03h4f+iVQeUryFrw+JVJYLblfrNgrWCexJrBS+n1Xk+CDWR8mfl5jqpwZBCWXzZIMNkZ0vBXcLtnq8H3agge9AcZSfswHzk7ateEb8ES1TxNWjaBDgLR1SIDT95kGsO/KqPXS39xwO3fhJwLX3Rgs5//q14080nV8c04MW0YO9IrV3EAyuTJ2/+f4X5yinJxdBiVXRMUAnu3xtA0uuTB1OnukLfgd2TIf2VX2UM5HQmp4n/zwVf1i679XKCmaRWX+QpqlkOWL3bgxn5oK/QIreECOpKL1Er/9CSQG6HvD+MLnj/+kFa8fzw46GRj+IS36PCIKsdJQIHXHnLI/hM7Z5GphQbVeEWA7blEGofi4hc3UYbTo/ZavREwjFRZCoeqUIb+vW75czkyhYJ8+sDNJxIpQvaxRXiG4Dc5v4i7QCZ/2NEGj9SKp//+yERDdoBi7zXegWGnEdw+V/Zit5Db9d6NKkRawsbvh+Z+aKusjMfioLVjoE6UtWqkom499EGaM091l0C5egeIHse0xG39IozY/p7pOtPEMeBIGzHfF0EG2ZgD617JvX08if//8IOuu9xMG5lgBP/7pIuQ42LagQuDcytdGaV5D19qKkinxaf8cY+8K3d2PyD5j4yL5NGaMt8kDmj7BKXxYxe25WyVzLTL+gD8owxO98kx1+RTxhRGrnGxqOfYslBMSNyLqAVMEEaNJ9To06g6Dxn7Jd7mbjKPOQn0VFy+bzgmj/axKyHD/5f+Px9ybtg8gCTwUICjB3OrblQofzsZof35pw80VT6GRYlo0XHk5PTtllJSsEpb3XBJApkVGPWfuJiG4ocpHE3/knuAnvtEFbZcR5CkJx2dJSEdJ8ABqCTzY8jbTktIK4SQSpynmGdDtrkpvCAk4ra4m4S96LxzWjJ1Su/7RbHuVrLn///iwx//4Wfiz41H5RaGlOmSwAIu0PukwhO3h44FL2+q454aXdiv/TN/rv+cdyBinnW1/xnpIU9WeJeE2CUCxNgjAsA5r8W2JaGexlkjdnp2YEOHjRntGCd/aUoPd1yRGvyfDlJJjsQGN8vO5Tj77kAWUYkQ2n8zJw+84Mfoj6NqLU5nr0qoP5YCtdgQC6yD+Y7U4Y//6kYLtMF/abA6Pi7Rt9gK6lOTPLjP+136sk+7hWFmqxh9d7T86T7m4aawwgVfVd74IsiP6AeVZdogdmynSMdNP9eJAsPEb81WkTKPf3HBGVtt4pTMb10GAPI1KDsZZi27ahqZ1KGXG2HieZ3znaBZnHVTzMwX+TK0/tjHXQmzVIgQ568NWpmh6yt0rFiR//ACy/ftOvyohp84v3+4x+mwDDNbKjtMLPaDa4lJKcmW8fXLYVDG19oKkI5XXqsZ7eiWd5U1xn3pKAaGMT0cXq3DIgHsZdP2SZ5eWV3gw9PUxOVoYoNpgtoTayHfmGr0GTl7MQPbh2XK7VFe/IsLzYUClSJKTKBoIFc3hCH8v9ZbC0gdSvo1h5L/ORfmK5XnTN3f3/BdUtR5rE7eeh8YPQ4tw01/6HWv4deSrT/96oXI6aqv5dbdmNK9fvkEbTvVfn/SZ2P3n4srBX9saJhC3vX3WrZNuzw3I6vCeKWTCzjOabxTGACFg+uQDNZw02I88RMgSSE9DgBkxkQiVtgrQEMe6rprLMarOHBFSscpA4LDNFYa6DDAbnb16Aq45VjeuAxbJKXdYbV+62goc/quE9InWzUR5389cOGciRbeHfR6FBNdyboFbaf+zaQDxTlufEIb/+BxegdGDA5mY52PfNwdN/rXIOVyk1d8PXEkJO70fRRbZ1ObJNrX/FGOIlGUYP/ZffB3Hhzp4a9tMtDbYMaBYpFzvDroJAIzsFKL/thiTqUIoeD1Tk/BHywB6cvxhAUkxSHk12jbiEwGrAlJcJMWh6NkN3vP288uOjl7/Cn9tTlxzhmKydgaCyafL0sxnWRZwtclcXHmVXclV3dc3ut910pjzEylamBebV4c0nP+p0kjBN5tR92RcyBN6A/zZl1z0VzVyxr5tjJzPjLA/cSnx3FQH+zG2n/jFkZT1ViNX9075q9TRnapxekzTmJO7at1VKYQRkpO/yfmTcV8QbAbO01XJqyt3ogzgIRmncmSpeti/I7N+Tlgy354nYm6CfwGm1vicgqXG/hI9o4iQWh1sxXnUkpWk1oyhhLCXdW/xRIuf1TpcjYJ/7ClORtOzbHhrY0dYp8R+asXa8X7+xraV1CwerJRA8pqPbWMpoOVnUj9UZ/qSvTpDdr+ii1FX3a3Hqm/38RThggMz/s0j0oPXooygGx8KAmEILVwFs9vJUDQ7IlDn8NVnslYfSe44/eAVDJ8xTbKolC7kWSpIDsbQvVMG40bVEGZ5UEy2j2kuIQzg+tjqvV7/256sLlg5KL9KmQLMK4aM4LRcdyprhDkeGaAoItuONOR7xdeEHBQyu8oub5Sp93/mzqAonNfwNKJZR6Sz89yvht3nogYOmKkvY7A8kR9bCeysGLmZxqCmPJMVzdQoQ/KvrZovwYIwOoL/W//9+iuX3UmBGFAwcTjJE5H9VMG++XVHUciZ3thbEzOZsxazu1n1hvUVBVAd3pw8oHhbXl76OPahP/2PWfK+pVVwFNP08VcIm3oDEZtwK0ooi8pNoamhufJe+V/Dwee956R/D7rYSsTGsiToFFrwAHyGBYlYR0ImHsFxfdc8NlGBPDwwSInmT/T7ySpuIpO3dZGXoFFRq4bNt0i5MsZ46tf1w9rxSC1JWSPt5oZ9nw6t6Bz81K+xUGn/20Uz//Gn5/NzLtdFohY5N+7XPDSj2+xYxg5ogtlr0DaRkYvTqDdo66JF6r4cVCMt25SjUZgER7gVsZeugcsdeTsZpamzUbF1WawfpR0Dd4aQFd+/XfWJQDruIazTnqBH26SSx1n9NFLN1YFDL/sTf0T5yF8LQD2tJV0nfWqpLrqzTnfePESgNp3X3NfGQ8bnfZ7d7lpVg/3gIgPzamNPLNpo/RVkXlOc9mb6kMG5qVGRPQ9hXANy/91UB///utl//WdzngT1/pkHHjrUiYphzziNLARCbZIbnShvCh3PduEsLv3eqQK7L8hr1FFI0QORKLF+SHIFb+3/rgx9z6+6nI0R/q7mPsmtqlFAymSr97BfcpjLV6fBPAgVpq93mDqEdOkd+NiDiJOMp3CnLYMXhsFwUBRl/DLeKU10y3vhjLFHbJAqMQF5pPBCF8YixQ9x2Wq0IIl4mHqzpIvod/5CGZjou8vuIMnH77//3kQ72fK0G0w7bf7Qcd4d9NBlYqpvj0P5WSCc2H3w6zcDx3KTpZ7phuTH5HGpp+asiOfpIA7A8MlaKBv03euyfGPTTOqIA3/KWtu+Pole21vsk0hyrQaanmP90MfjFODO9dD3YdSU2v/gTizSqBsiwIH8m83rM5880Xg+0PecXL38WO0v1hFlP/t6Ncd/eRd5B7ymV66C7/rl8nntn25VNE2TaZGegrMFJ4Z3x0V+pwKZ8BAABX/0N/0txat/5dokKe0EBL2lwyzqsj7JBWraTeVSYFtiilhhmBnUZ1+0fGYhlBPjzOAk9wWU+11pyy1PrrxIkLRZ/YPwTfoVLP/Jj0hKIWjKHCy9g8l9eL/z7h6w/aGV00JymCPLlz5kLVVf7TsqeR2F++cyVIHhgDx+yBH3ZT4+cwrl/MuenQPMERFWCHAZJVZ2y6Kvdldr/QySaL1oWZ7sdkmTNMqiaV12Tuu9Z6fmDvrEPu2saKYHV9SNBNEzOYY5XpF41ttzTW0ogSBb8tIS+K9XSXXisg8c+k9DonyF4rIimhlDNKtt6rdRsJuRsJuRo/ed9VeaTQ9X6CGfV0plgiTqrzvnklSJTGvdf8bEP/Rtw9Fw9Fw9Xhw24ODm+XndOiB52w+2LerFAaV1RFlbM+JwZf4uu6VszNRUX+MQOBUX+LqyyUgAD+/KP+7vaGwl28RYNjrMErTB+zNWk+6082ZsQXuv6MdDidTBlgqXtz2LRcNmAvgyEf/vJJkJiV5AF4618dlEsJFBSQvnCDO979rGivSiWdoOMiri7fRk/DaxR3FFX98bwE3gFsSQlB+bB0UhcRZSJtRmfjIjDttE4G4+Vx0FKqZpPTz9ank0mObFjL41a5ZRRGAAa5nEHKjpS4UgJgL8azbCEmhSeuzivwIDuwPwfMBqrexeC40ySU2sDZJRrhvaJ3bkMWOfIJ0qkbQK8U/53xXit29HTAmDIGy0vqMB7d9tZ/2YM3qHsLG0sCSgYTpChert+ImJgTXMSUwrbGl6Q3uXsA8OW0TjPSwUqCG7hCpUw0uA0mgAVQBH7FzErMpsrWZ3L4WyKAsQAKkms4IEbG6PtCVpU5MLzLvs1TweHiJNM9iwhAkdigUikDaw+HG2/F24Kgz687HV8cKJlDpKrBTL6ojEtrwErMrJnPMu0CQTBZMpCha6CY5mEBzllvOirrnJpYhsSz65QBBASt+BgE6xuLmu1RynUTPzdrI79wcoSGzxYxlM004T81PnsxWiKHtnlw3iH32PpWzamWZH8no2xumMCkBkQJu5QNzRJlkoq57XetU+J8sSRcMPeqT+TQ2ouCXHFii0N7+qSGPjL1qPLxl5qlncbis1iKHUXqwgqoUjAJCBFoKA9Dhu8pWP2cnG1LU8UZUWznEuSVNXO0LYWxYXA+QmTJLykPhQ7cZtbVlr/rjbOvZYAm2SX29h9cAE9ssBB4+AZwfN2rJ1e+0ZDu1QSrwDOfCXSPowjBJ8xQVQfVoVzi0p3zRgTK+j2J3iusAa3v/uOHgpfqsGVQPdPTwfrqlf7SF0+7VepnbGLn0wK+Fder8P7kFD/1vA4R+NN0BcR7UBpy9lPU2txUNZ9pxiwhd5+I7IVyH9xiZ0CaO8Fd1vo0yuKwBPDofAfvCNCuiiaJ5dXaDyZyfgtlx+L+Po7h2f7y3bwXOwEq71B5dYMJAAcexBNFU6wIAtkXsL0837BY51wqZwP+ChIOMH3wJYDDfwPGTF0VBFMcYFI8dMwxBCLCRhIFx7+7zReKEmhEJBATkYYB6fQrrMDIL/R9Ev/fMXKIvBwDWaBZIaWVfsBlNN4v+T/2lTPv+g5d3gtjeiinHK41n+TO3EmMpAHq9+qyza6FrZubMpsDJBqpR3YkeEXZ7zbNuYvywUdVOGGX4YfxAM1tZWhM8P39OlCqhpK9J54AAM+VHMjwhKq3kAzsl3PziS2SOgrg9+GKiQJ5G4vRS69gKvoR+RMcOhbPP2AAAKc0IEWx0TEzMWhypCaH2qQkSHKQ9Xb6dq9OXIyhoCMU0iWbD4lX+f+5/HJswxNXK5bjog0njzhNFLGT6kZHmwnMCdzHLubWH2HFtZu6VfC+kETw9fE5KDTPH2a+1bzILWOPKwryl4hVHqc9NNeXHCItdlNPeraxR6KRezUrjTmQsofpDEpMG4iKnzryWU4rahxtutwTr325xQ7wlK4OXf73ot9EpQXKAzUF/IjrKUTUX1YM9+VALRAcWKf1j/9XFHymyUv3xWiLP1/FJvUnoI9CVSUpN7Wi9+MXLKYry0oOloHW0nee04iezCwNJ/zhLYBK6keXslAcNOHKa9z8AK5hZ3STRH5msgvntRKQxyDkAX4ewQ5428rYgV5dNjAwNfSmdlwlaD8oZlobELHHxLOSyscb7ipjA4qA2Ddto8zrwDg5VMiGX2bessZ5jilVlGldZFM/+sj11Z0DFQZDNbKnJcXcpSfL39wCYltqYr09qINGzjajaew1ZtdV3wTJQ58poblruL2t/9m38ZcIe0bibCI3HG9BNG3F6ciNLOnmCCTzAF2GOfEsIAAAAPemLPXkL0ePOSzo4DgA1EPw6Ndh5RqZ33tTYlyC4plBK7vz6teVTxryzNZ826jc1xDibHA3yAh/eTD0eBm5wn9OCqAqd+SuxGx33j5HAuk0z+a/mz9vfvD6VJmY8mw5zMFZQqSncCx3CN1L/uGIZdcA/AAoHsHZcg+W1eAqJThTuwmZOxqw8S6wWZOmYtuDZOZxqNwVK5JV3zAAAAU9yjtV4EfCbH2bM2BiVCXW20x0O7jBVqXazQKpy9+Gs1Y0/9jq59g3A5ZdXJMwA2wvQW1HhlSCuhJPLajj+68drBRo376gbM3daUFeJQnDag7PH31rNk0cf7QpfMP/ImsgTHVjOz2hE9UFscPErU9D8iBL85nzA58sPkSLPK0XzTAYIKYo1tPT40N7KmnPUM9YR1vPHjKt6m6fP0dFHOIehfhrBCKWq8bnlkoE60t2LagWukiaYwRBpXiAwtR2/sFjmR5xv8zNZFmGtV6ROUepvmNmrrLBDTKKb/E7WP8wAN2rnugEmOXuV5dRRapFxVB+/dB49HJRyyyeHHy9FJSTgAF3JTddKXyFCSQ/MVVJLymgZ2bZzJ/FCxCg/ueBj4H1h2BqS9wUHtBkegkjRL7eilz3nwYvALUvWaKFQuZE6E6+LwKjz5ZJaTnkuvSnhvVKzyn9RylwZlRaE8ndL9A+/fI8jdHrbOo6ywW1CFre1/dgu5NjmuWRGmgrW2vSHptoSLL6BZVld0ecSfZuCtTuG4YmCq8LFNmACPgVIZbaaV5aaLS6QPLmzr00XolLzBYamGlsYHUpcSIuYAk2DE+Q3M7k9fbwPOnmRu2VGZ3UF9MAFGN+AltTTGhShyiaN4Gj56TkKm50ry4tb16r8CIpXoI0z8MSYnVV1AJQjYGoKchEnAWoEYz4hpLww5RkpaF5c5dII6FKMkRua9li7OV61AYic5wsxhdkXl6Pc8uOKjJSAypztE7yZaeuj2rIHD/3IXZ7RvLp7pmJqS2jwdwHBOrmyw6TjakR14FXK0gIYpovQAy1kY1xoCzr0p6M1WLWmdzoVQpKyEa2sRS+Z1/4+Z/K4hu1PSkKyuwHAK8mbNRRthGAOFya75npQlx3YDoUQxbD/x5nqk61JWAjkeSPZLfAVymgoZXEVqGaJnDYMMWt6A0wid6eZHtra4jNeR2R8PSIjAXXTca3LURC6kUTQEhZIR6i/TviA+J7YTj1mEZ9a20aR+lPWRbAk6Hu5rsMOYaLQx5GuwuV/MOt5A0ypv6q4c6IxMOr1SDLyilJMT0iHn+qxEYOW5Utus2sz3DQx8v9mmj644wZ47Km9s1i5o6o2u17BfpXHYFUO5zW8exMNDir0ohgJzdm8fcdqN2oTH/85c+XxtVoHsb0CvrGDrHNnnFk4zmfC4F+c8FE9nVz4AkjyD/8suDn204nO9cQYlUOsmxlGxJpoKUI6NrZdLvIupWA+4ABNt7EuFOeT9b7Jm6KmCxAW98EJI9ET6JuANO2Ki/U+1W4tqc3IXwyFy2rotbqxLD24M3Rzw6qsKoAqVD+OX8rex577sP5YbbxMcnIvIx79HpnW+/p8COhRlaG4GGF04zURXEkxvC1PTumLFNfNiYZK3fy1GSta3IX+vLsvrdRvlCvUflt12zv9EtrcpZ7grq4tY3sCUZmv6p1rU5s+6CxNeK79n8r3w66AraYDNIXmc5hlbvM4WaL9qc+D5rM56ipFH/fScdYHY0fSrUNjc8QP7/PPPweNo+3fo/kKzoyDqfatdf/ZdDFvk2wXTPcdK27Z7vGl4/sJEmK9kGqbU6U6XkDdh3mDhquqbbjqqo4OTh9PCpaaUz80JLf/JwQ9u998TLXGLnyqWaYGouf/k9EXRIPHuaMVPSr3iAuJdKu6N8ilJmAlMHceFX/u2R9UHiJjYl6RsmK0oMuGIMMeeu6vvcVawt1MsXELgaeuEUWkvkLzqj2FcYWqASFnQi8Wcuss8Mo0GD95rVnpokZQ2N5jV2b0erJjm+ye7p/inIOSk5Qckok+sgz0fJ22G2a5JFLp3mZ0qsD7OoiPYhRiPV7BcPeBSZmHnyoZq3B8/uEhFq0bvEtz1xgKlRmGM/5pNDBIT1w4tn5nDoG/YoM3OfyI6CoyfeoXZ0suychZn/qnAxk2CkrOn5sTQcmDUYFooDcLkNMpQoKiJ9nBBdCHjGIJ7REp0uwcBJo9Wb9EM7hZygEK4VA2SPxpIJcxxWh1uZhhx/6BFU973V9t3R8CAXklA0uJAz3Hp7vKse8SJOIHdaEMCHfzLf2cY/flGpxWGsuExEekvXfpcllqEtfPKx0OPXFS3aGE6atArwYizhq9I4SjXeB6MYqrh3awM+CtEZYxsP/E9BbkAB9zecqkBiOoud2YG0EKwTxQ6YL/xd2kRLCiHR1CgAVy7RG/k0IOW5rv6xgGrd7325LA1bsmK/A3KkiLKX1qkjfU8ps8ZhlfF5rz766p/vuhY1ASUyOin+0rrOB1mNEBasWSI2XHteuwCHoRqkJbGNCsvFbMA9k+akkSzm6XmyMgnVlSt5hgUi7JCs0QK7gNNG6FRkLz7uT50oOqdbCFhlZh8hjsPf/tMRc5nqGH9sYTrdMZv19MnROz0/FETwqEsIx3iTMFp8OFaFMUq2tEX+P9ibKGEMNfreP3NzUtKkruqpPHtoJyR7Srhr+H9u6OLZoI7svtIwQQXBQ+TgokdNOehK8ThxXhSciqj0T7NqfXRpTI17vdvKFvHyL88f+D2f99UpMpL7kcoOw51VWrG/j1+Kr4C66mlw2i6LDTFAOca8Xut3H3NVFut8ptwKdRelu98Yvfb8nsDKKCDA3AA8wVrQAAAkLZ9jQI78hzEAGfFnLtkGTqaYEBLmOJXsbaQK2AmKEg2SG2iLSwuoxJZyVNrQppil4+K72wMaPbZ5uai/G4l6LEffsvoNxKC8rLhOFbx5IKUEdDNst2sJJ+YPxyKj52I40he2lyNQIsx/83Wz8vX6nsHDHNMzBa61RWsc7I32cRZpqZJbo50g8W3WPfcQAEkT+hXho/nvVfeuYY9xsFMU7ivomZpyN2+G9/8xncGFriGQTsio1E7abh3Hsi0oebjAgMV/FThfOp72SWFq38ZRwqvWEffwU0QUedtJhD5zyZPfQj/l2jO5+KGVCPbh6rYdfgOSOJJBF07h990momUp240p+O7EgX3udH4HGqdLy2SrVMIWaFXzgcME4O8Jm9r6X7W/2CgFlpMIWfuH/JxtVTlrj9qC/EZvAACEtHcVdNt7D03H8dx4oAEvoTJ9pbM10TrhQsFw7LCx7INsyGK5um+M+q9yPvMkDoZIJE2K/LZZkZSO+ETqzQ9N9iqDD+ohtBVpwKMEg9Z0lHGrwaglAgKKST/wPDDzK/dcfxzG1KV5Aj0PbPBIXybbcGRFagDoIpEqGn1ThGqTGZTWGC//OwAuGfwcX+cnPHsR6qQvwFkmIFmuUnvUGQpxFnErdyhh7rgA2rZN3z+8iMJZQgWWx9lwWv8abvOHyWU8P1vOLr+MAEatY5YBuVqmvnw3jx0hMupDBqdpzzN+fyBwFsg5WSc/SnpJS5KkExohMvrAzduSjpKyK7oqSyV8driFTpc7Tcka8RgXnF1Z5NsncXfRvduqhWehlOd4/gFobffAQMb6LyG5JHkhCGvf383K0UCycBNb3sUw1gEIiiUbelKQXI24Nh3e0iXJeyv2oDFyjcFDi5Rkno0vPkf9O/zbLVnAUAAGdnTXzBVpxIsrZOHwxE2g07FKKxpSmTbXCcUxGozDi3R64sQdP78Der3I+9o/40vNgI/DbcWtcaQibIh3GnqQcDelTjF+jZeWg6EIY8yDazvSlZXqNuqLV/SOo34Wdt44folZ+kQfTMz08oAQmaneLOsPbX7A6vwaGm1jTg91rgEzoaNzfrZmWTFmmeV99N5Sm1RFhevRTP7VBcmWbTH4dNofi8Q/WOCwdfuerZYZbqWjKf4wtClzMhR1KAZhawLdF3XLrw5YCdrTn8wrcDBokEaQ8ewSAn3fkLwVMIuw+f/0c85ot89gXZQs4SrNv52emoUtQYMaecNt3GkMVsbcCtzfEQbr/Z9yYNHeqLHqFUTuVYY+hfdsu6hKC/5JUIA/3Swu5LYXMUohKzTAF17sAh6OU5VglRw7QAJOvD6OpxvIHVREiJ4dP6FjMwgfqAE3qzvECx0vAJpgr2yHPPwlxSrJ9nWI3VpuB7Z96y0tn5GEEHFCtGBxXZM/nOgXIyaXnxzgM2KWnwywatpcp00gnsHY4CQsceCLz7z9emG/Plb2xOPeJ6+I9LQI/HYqBYcOa7UoF6xmGaCqDOlEUx1LzmTKnVdvpIPjIpDHekOEhbPpwQWM/xPRYuVpLkJdJEY8GM50sSwnTwrMP7HtsI6noDi8rmecwNBGgU3eIC0xnbfrKUnG0LvhbpYvWfkrWQwPrj7RzZIJbwCKAxbrePiKIcr/cx2tqdVWOJlvV0F0pDXk3XLQnKbB/ncwbNGp49RluN6BSofglv4bc9wvvmJX/gO+rf1QJAFFW9ZCcZfsjT3nWLjEktD/U7LhjqOaBy22JOGG9ZHByM6hvlmyX7rWcXBfBPk6GKNejAhX9z5fuNI8Zzko7oPZItrvSdY2vcpIiK7LfaGF7wcN21vRXKzbV/xctNTiIunHNnuRRjxdldNioFyT1ff1AsSmo5ZKGJ7BlTuMWy3vi0ZUvS+aFRcFh8BgxowpGE5o7N5gV52BBBSmYyym+XbU/y9+Ccrvzs0fXKTDjtcUYHYiytYW5lXaJw2xZ1UdUfV24Rmkdf1GsBpFilgFdPk/Q6wKGYEub5jpx6S4/RvqOv8CBLUGWPg2PZy7lzmEnfMSK0mJWqdEEnTkmWl05z0Y4bsVsXH7o/h453LoxUW+y60tPnx3tvb0aen9RBIF2Q0eye3FZxI9AjA7jjk5mEAgoAeZrLo9CslBDU7L8FqtCHJRdeZbveDdGP47OYmmjR1+IptqqttoZmaVgHpVapYWt7/eU1Q+zIe7K9IqQv3t/6T88vrxTNrz9EzBa8W2WFt7ItK8lPOitbNx0POxgcZNB8cvXiQAnzgCXHLl4xRWHFBU+U3WSaSASIFezFPL6J6u7pXUKYFOsmktbrTxMxwhMuetUHh1gP4X9+2lA96zKgu/MH3fVCAvD7CgbbPps7b6/ouADt0MULoJgfPiklN79mb2SoSxR+O7jIkhHG9l8Q9+P+NN1RQtPMasa+68p04GqTDZ2qihWh9d9kQ8LC9csEaHerYNA0L2VtANi2qv2a+Gk3d17N3+WyHkKu/Yk7mq/ZhEx/VIYzoXCZ9ETTP4+vbp0KlzSJfdk4YW6l3rlmDkEEiiAYQYu7jve100+q2t3tNcAxCc6ucqDb6H3HBOQi1ovyDBMjDmL3WEhyY4bBa9Xw7fQrhuJVtbmiEbPy3U9O+UcsDbajMMXv9jd6DQyPwSXikIdBO6BsoOQpjPTedkjt1/bPQ5qZMysAP7g8567g371whiqYTpfXP945gt1cDk0gK9OLpID96p/Jz/gqo9ma8lWLlfRVFUIrLSRjxBEHIInMjOcBSj0R3wEZP+vMgt1wIFidD3pd7IZLkAjdrFA+rQq9hAtlRAblzlYTrHwdbICFk7sDSgJNzpK0HdDHmmGqmEzr/krzYxa3zo/sqQBNC3j6ql7gAVzuTGlZb1ijHAasfswjnlL/xc8bAegoNUqBIIiaUWfB8a/7Jaf5OVn8J6j5feFf3HdZHCgGk/XJrmJz96CF/7W9SnXcHm0z5/ECqWI/hcggS6SdXKtBAJmec8CZGoDUKNUYMXwfuvYmC7xMAURyGeV14KjLb8066K8nifr25TofyuE3Q/3U6mEidI8QuT9MxeJec1gIklgf5DqlMpWSu06dkoa6ArRUYFsXhZrXvDboW5G7suPHvj/0tHUkGHNtIdmMprOtDZkYr74wy1raqnYKMAqJhbc6nr9rC7F+Nb0ynj6nuuC+7U0qO0eHIdhsFF/kudgguXuhYAyhElIFxOV6RrAamIeiyfS3X/N2b6LNjKRk7hDRUPWU1TrQbfPSCueS5+ddplao2s/9yn13dxObX/Ouk047pT8blqEibwGsKQuJXaYwarY5MM2IuVY+LIlAJp8h5SjRlHpDsj6JoyDNAFJnhgDWHypd0qBKCSygUzh9DwdALo41nDjMpaWjKNSCDVZTwuwy04kictd1L+9CNuapB/MSP6uLSc0JDsMS6cLA0YWaKW2q2AS0HAnxjrffwiO48me4Apo+aNr/u3UocThybXyXRQGRYxMiKon58cJuMjEa1qQjADSP/2TJMPTDQ74RDSSCbDyBfHfa1IDwFio4sM7QSFnckXtkwN/hCPRJIW68WPkkFCgBvodWzsAZfX6tUByowAdBLP0Vk660PBIEUGuiciSSftKDwWbnDSuiYHJ0Bp7kFL4R7l75ChionZQHe+4DzonvH0c9RlKdoi1LB9b2hAZ0upCxFQpVuA1WvHEASAbpT18u1CiI0jd8zwX1zC+RvPqyFNsU9q/s8uBvQmM6u5yp/d7JAq1Iv+WU0VLlH9V3XxZbb6PqsNrqICPcbYS1wGO2uqPj/m5T12ah5TwrCrvMVAyRfAk/kkpPsAhTuaLxQV+zJb97gDZqvv2SWufpoH6kWRgs9I+0QozK+CRFjFpq/JjeABsbf2Oa+zSCtRJEI+q2IyCdZsJqJIhH1cPEGa30zZ50yIUeYnyx46rdTUV5F77+1bnf9Z2Rx58bUHU+mOYVyd9rBShj10d9SLaMQUQnTwxPXg2bntsKarIgFN2sJgaPMUtV5hIyAiiOfp24DnJ9jx1ClspoM/bZA3JN5NjBW/R4fmZiAYl1DPAlE6cLBxn80Yy1/0W6/pyJAhLjHBAAT8b269CYJKnnm8lwPlXeLcGLOdqZqnDa9DSyaz4mLDF2/ZP97EMQRraQYxVJKN5axmcfbagHgW9NrDyf77D7SqOZR0lbWlIdAlk3hTw9KGrIiyOysKvexSzXIXk9oq6nZokR+IbD6CeaULqm62SV78do5ky6syGr+fEnmmnzvpjCEmiGAK6lHB3zAskk0EYxYjuw/WxEixxenRuhV7rV2pIK2fiAi/y6kazu1bqjNLbYqn7s4GmtVGham7UOz+uHwVhfeC6XVOIyfaXUY1+L3HGoUTgcofi6/3rk/23ra7XtVb2TFNJAPXJjXWSnBk84NNvUiIrnPkhrvClcPTzqhRVJc1rasgdIF0XbNXZRTKFTeQX1nnFzkM0gUHdf2HZ/aaXgMeeIbqRpvO1Gi7sNplKLdNzeV4cq0P4Xyjm55ZyO4AK4BRet8dVSFSrUH0a49FjjUQy6/5qWiVLqfpQjGg5UV7guwbYUnCO6I88tXZftbB9JBVgBwYGlMqY3DiLUjbaNHUUZC5Ol5Z9XcsYzN4txh6l/F6Ncmg7xfbReF9ppKusHzY2wsjNLqiAd6FYSoB8Eu8mCR8uYgT1FBTptH3u47sAzrrJ98Ssv5Sm36O4BIG4wBncgaeYYhF3frj92qq9KdvsavDmIxghS+NIKppbMgJiOkugsHALsvFci+hsQnl8fa9dnsbC+oaWGp3D7NPoMxFR9lsS2mhdAtn9kXAWftuuR/sB/VmnwnOEKXC1f8a9FhQqgDGr547UekkTgDhVJTrHm8TSAVyHCVJ2zWlmR3z58uNlOg/uC8PIYXluMOEF/Pa0MaE3apGCFDzkftz6Fd6w3Vw/MPBFE2dPk/W0NWnudxcUXap2Fq9ISvkO+Uok4CyV87sBrZoRWWyku1RX+Vutl31DfYLv/Ke90gTBSojPN+clQEONwIWS3V0RiVeDVy6GW0xiYLiB2HIV5b0Ur7HGS409lbCiP7h9SA2xpRUrImbTpLGqg51gStyKv4j2ADHWKsvjVsepiu9nEm6cJxEiez++ex/ZRr+5opz6A+LHbm71Eb2KqsfboR0hqVAaCRHGCeqRlcsSfZ9LdWnthJK64CmoUtrKwilMFIgZwmvn4KgqOF6gFqIZ+chufEPnNgJK39O9+8e2ffJbZo2/rRKOQ8XJZx8DSnjoM0DNbicNwcKNqziCOCfp2ViiFkztmUX7XNYJy3bXZd+YLODRLqXqTW7oGIEGM7BzylZCjJveTEkd3rRdxbxEk74FqYuQvAIr2D7LcDreoNdVvixkVM436f388CVXg3svP9ximU6dnfnbQTdRInDstReDGa0k7NEGwynxcrUm8W2fmvusWAs+ScMlYHw/57bCLPLQ2JjJJRsJTV9EAIWQt81t/KAuX0ZdJlYHiyvX7OF/6uNmFvTgdByzx8G8C9ulyWP7zelqlOtgoFeBukJUrb3FcFDXJZEoOV+PGBhFkLQ6pYMwm4YF9JdgVLWDa9aCm+zthVBQqR5HJP+T4A+7NSO4XkLpPxSGhyVwN37+nsriej6pbdSYmsXPGSiMNoJ5/yXmjt2VROsp8A27t1XEM08XZdjrTObZcWZdGeFSwNFfeeZBqltqlfYeEcCNFsxr8FSApgnZEdzsUPpFm3TbUOyFwqtcVknMktTbseUR3DCnMLwa52ea5USx/1pKtC/TSb1o/pv5UKFy5/G41pTiIfn2iOjZjSNDWJfgQORfKuTAnKZGRWTrKLj8H0kX//MhUUL/5Z3vU74ZK0Ke6/IeDs2mAOmgeV9pjZFq3Wh+AhT3+vyW3KMuY5dTyuJvcPOkXor772lIz5VqOgdDUjVcPhx32tAgMjomLif/cJYVt+DK2tZoxWfnqyoq/8H4hY7nMCZ5H8jhG+YyiIERAY3fV6hidLSmuyVi7qTVjiEpRnn9uDHqoXAW9LUTHpJc61pbBvMvzatLkDiwPaD1KyYrrN1LJStXT/dWBwf3//0japGe2RcTomwZKFYzIIR64PFr496vj5c2vMkVVTCgk1bIMUDdZ785DiZsXHIXGG/PKDiJjtwFQTNidsHfAgb/aSyDpgTGkscbbvOsBfwf964GuH91IqmpNngfehtXKuiE82Nx7yXB1b9phejabV8S+gCQ+9/RyxIIuLqfUyh5oViKjfjCr9d2ysR4J24BciwEF9ZJx4LDj65wuzzxjrJKH6QciMdAZlh6rJ0C4tjTlgKHh8JMLqD7bP+82KEles+QJEg+6vkJZaegNFWNbdHF73BL6Ft/74RVk3LdKQKTW2IsP6mb9AYSwsRCM0hXNOkyDaO4vzZjuouAi7aDS9zC4D+DApzzux0BprgFfSsLvtRO7fR9ughX5sZKKPtTW+oyD0JdfSCo9oID8UspWFzR5IHOMSL/NcXZc4U91ihkjn/PMGyNDTfyQw/HgWipp3hwOleJ71OsQEU3clD6H21YfTZR5VSdJMrI53gChbIMbzNnuhM/4PPWDbFZfuiCYyjem/ZwNNCXe9s04kQwgQ17hJuz9BtPDBnORD0eG17icGTG8GcfNeqEp2TQZUWZpOzUwNF1ooJ3opWQNktlqrEPU1JFN1Fdt9poio0zVHiem7ph272sb4t79arx3U3LejW2vUWvGPlVvTaOBP/TwdX6c6iUyexjXdsuhVFy+WtkzqEbIcSWEmAYXXsrdI+tzyLRrPGCfwMIQdextjxYswwd7/FL99NYbuSF6s0NZFx20g5yn/s70xWyS/SJZ36KWjEMEo2MeEOqzyTTiy6OudfAPWM+euLsmR+keF/UvNYAuspFXnq36nZ2pJbbsIZBMEPueAYE0cA2sf1yRmG2w+IYaJJ31L51JQP8xTOQJc5npmsl0Eu9gc4tEaeZR9Aenl9eySrLggo/o+ktVP2RspGapvkMqHqYnb6vb4YdyJovCwxlYg2jUV8RpS2YC/Srnq0o1TSVuA2LIpygJ0AZQF4i4KO9WauUgk92TCfBumqFLUIlY+WI2i+b8amtlYQL7+1grbAPh1sfmeE8cOcG6EUiWxrWA1PNv/xjyWQSYHI7U6umRvNowCi8EoJirlWyZuk1+zdtFli7bWGlJ8+Alx2EBdbmiM1+6wR47csxPM4SkbjOMqGmYgagQ974tagXtKp5cw+1CTjUDd5UfBKwAGWa6eKZJkDPwiIA6Rm8/UC7CE/Yz7cZMZ36+nPUYhpqRdX3J7yx255CX1vhzEZ4iS+763OaxV17YZFDYxFv/IWica1EJk/tzk7yZRzRnIf1+0drZx+NprB3NtsqJXEomLMgVigFLbdIUvaOd2eehOYJOrTWNbPUU8an44PqD7HRPdPO2qqAeEZDyf42+gRGtO8Hn4NMwezPlxDHp7nddkixBWuATc9F7nuHff99z25UcXTIMYCw3tPDzR/5H0IveqOkB+9DNOetRFkVlEH5c4/qupFbof+fKZ+1+56vnUvrJOjXYKUzYajM82+V/tTi0lLRb2HdJHvQvodTbswVgAEfsMjynCfoQYy/JO3s5wlT8RMQeSUwKS6Jw0Sd52YXsoy3t0sF1maSh/k4+q3+tX0UeMHtM8VEnm/la9IuGlKosrDyoC/kR7AJjRwC60dJRGThbdH7C5oqP5hDtmDawPo7PjJ8pCdoXNZBqvGwzjVXlueiCdiGNce2cNvrnokr6b9sTPEB6zQQPdVBLvxdXxgYsTHxecbjOJzKa9ayac95Kj7XkbV1AkUn6okJnk2Na561aTxGIC27uwWeXYcniPM65ZXN3hzHm0TuwKzHy+mYXPMLuXdnWU1cn/SruLUdpcu+II80G24w7Bx0HuqUx9+Metv58iTN3zc50wW/5k6CoHiwqmYTNAjzsS48+rTjVp3iclvR1wrVpWJZBMm4i4cBgYQf5kG1rffRp4QcPMe9/0D7R7rsJYOFTupi4gleTC/I6acazQdPONao29ooAW89lHfKNkuuMtTyFWQLQtgWsQIuBPJzRtmHMkMR50e3d9qtIc1DkPuCyWtezltOB9ADm/QV19ix1IKK4hglYR4GYqvDoDYHlwHLRl8pl9c2Ec1pZK7NjVZduamfqZ1q1PDc2lqnXEcWA68UUD3arG60yXuWiLbNQqyrlrF3dWOMrTXqb3+yJ5zjGImyWW3jmC3aGSchEohZiWDs1lOduoUJKKEC3DbmDtEFpQgAHxV6wl3Gx5Gwwo/7Y9XCY952/zTgIexogpbpFe3laTvPZJPaZon3JF/4qotn3ju9Hm+HC0L/mzhQBy/RSGUJE+1FRmyG9ARlaP5gMSgKoGt1xRhphiSwU0EGubrvfsZE6VfyRXMkXPzlL9sbOTuJwitcV6jT+ytk7T65QBiO2I8KJKBTP5puhKCb4x7AIS0C0zCR/JhW3NT9x0/TsofVhSCejP6op7wqyUjoREWqv/jy1AieR+fldl2zskGysAgQ8i6Cf3kYiJKjL0L6BOiKoTNhAJ8S2BRY8ZyexvgoyVqtCjl7oHLirAf4jeNuRF7b1AikxmVE/Qnz3jpyNBWYnWXTsY972TxSgv6f3KTKeca77C5oXH/Vl6gX+gGSO441honZ42M37Ji6/jqyym+XL8KjqgSN/gOONZOrCOCW2Ipz51t861foUB1MmEy4hYuzGkJYNndaa9SMc/xH1CaPjJiB8pgbqrNNmj0RHy9CosVOZ4Ni1OgP6/hSZ8FrV0qD1Pf/EsZWM2AA4ed/7wLutC9EhAB6pCWajmjdkm5kF+VM4RR7AB7jt6Z5Yk+KalL5M5tj1Iz/C4KHSmb3/dhMgYlRnd+rGo7yGl5UXebf1Z5CPTyrWKwa0b8zeHEaMQv7tmYpOl/UQTDGOPYtxMuTFSvuWqlxcOJZiNrhg6x54m7SoWmlFZGh+0k1VgCEZf5jvEiwjPeaYXDwCfaIlA9kVJknjzIjOyLfWA5jEvW1CgT4egsD5ATox3ahnxso7hnOh7cB7+SUCThiaCxJdZavjrGK1YML5fH0ZJGOOaKLnax23ygKByV3oKhqB/0P8Jv7r6+mNpMwj2W5oPEkBRhf8kFuQHkeD4oDlU+gyBWUFL+MKFyA+pHM8fmMD9NOiTXTOEH/cCg4DjQXFRrMSx0/VuviVn/SlIbJuWJpK0I7Ihk+VhIgffQme4/QE5ks+MtLtn5XPwAnfDqfiv/wwFdAvvh5TA0R8KvkhetOmP3623bX+Cy/eoHRZioCB85VxnPiL2kyKKFvqD0ZijuNaIZxIPGy7CMO3RL5ExCtVlhGxbKffVB5wZAlTb/+vlgqV2Eo1VmDJCV/n6p5SqY2hSDeDoz17cAghjrUsnfCv5sihXf73FGAUJBpQb/24QkE7dz1U8RmpwkhX9SSY+i996a/LiCDLn150MNhJn5ykMJ3/Te8dYNpq27v/cqaS4N/JtvyvO3xIo64Dlf5nYWBcf+EnTr5NwezoJnqkCi0K4Wijjj+tnyvXGxwsRigthqw2e3TZJrGL/ZF8IdTHkK4ez7m9CTieIie3D32ngEeo3BVl77l4eCWpJ/tpGmW/YtgvCEcjeOTxQD/Ki6hkGCimALGOhTk775D7G8rWFfDsULD/RWobDX4cgvNywYryPyU4CwaQ74f8nUYX9DSi3VIyyEBwr6UAQHSEzvo8FsRG4BPKZ/UwO6SFNF2vs5b6CnkUNe1ZeYwhJWEvaipc90aUxKV99DMBNQy5LZpYMfHAD5+zQRz4ghYx58ZzhcdfzEGrjyTAoD6m1bp9PNOVtsNlfJYzzX5tejZMO4iJBOSj2TvZglVo3kWld8jWuaqopbdvab3SEADuON+xocpolXApXZtjIL93LXE2G8fyXowksN5pt1RWVTZej28C+TSRNswi6SYYxK99tq+XJpi6ErwEzLE/1JQkm8KsGYrXqPe4xHSnviVK1EkQbpwU8pPecmnBGPPulBfGljaLwDavkQMgrRSTAU1c9QR4B9oJqcPmcwMmYXLBAQ4gvg+PT9LnlS502KrKpILUpygycFQQrEwBwuxHy/gTFLvEvgPdd2IsGYWPdsNfbeUTKKkGvhc44aJIsPB2LjtiYZyS0En1ymf8v0EPuTg2BXfVIobWR9dEn8fmIXM9VryuQ34J4uVU4+JPI3wPGBJWG86HigpdK8AU1lpIvpVsPG7zZ9r3ZpRD9amF/zaqCWuXBjveL/a288pSIBm6dH8H+mYYksi0KdjiPgpxaxENzpZSGijqjUBdGX4seAMFHrrZyDHrXUDTvEW6rAaYR3Nmiy7KbAfaA5AKYsmMQTb3rnUWVfhZjVkz2jKwHR1v67LOUA/+dtLKFnJec4qaON8lemFUjtKdnTFzp4/CFTPkEm70MkX149iGCZsG6fruq8xF1i/AzSRm/rOj9B9iuLsXI5H6FduRj0NRvf5q8aiyfyRzrXVGbar5Z86XTFxJlIDnF9RZbeQwffo0CuFt/GtWMJqosf43ZMm1rrk7DUJaAChRiyMWYXn3fdR5TomNm5E5/TeVUV0q6UzqCSv9gJFZzFMzI7yQFko6wTPRO6nVOucJzPQD7ZI7Zm6/t2wJ4fZX6prTZ47ebjBGTJ2abqe1L5LmZn2bGvyG9H3/L5uZgoUWBtGwZczZBszm1oiliyM565QDbO7lsn6CaoHIuJmAYmQvfg2eXsc2RN1DEIxG9uVHLUaKzYJYa8fipp+zi54uWP8VRYE13tDHjRDxn63efa0j4HjJ/0Y1gY7mEDPU8iBSYsjTOFkfzp908/klpa93bilZerCa4RPIXSil+Ie+ZvsN7FlwxLrPJNw+fwPMHit8te9Qd9tfvpdMMu1w7/kl2kEOlk5lwzsVusTxHNiIHjayLPyn+2McsGPAWxo+j9pPHzqLAeJlWVjAy18ReX2+mtL6OuULA8RpOiWmzEMsm6erGeoStEMJwnfYKfue3zGzPxQq14l/0taOGOK+ANx1lPn38CQlnTOx5tuR2vpGYvw7l70sSZNM4IcONIhTDzXj1Ck5pNLIDPVe220tKMMKUrjMpq8ZVwAKSfUSNyco8Z+Fm6V9OY07QPe0Dxfx6MvewodxGOsygsaWa7B8U4SSbrMTyH+DlyqPvZmovjNMwamkYSj5Y/BQHPpQOX596XfvT+xF/T1xd3RtPXPhCI6rmmEHpOeIqmX9XWnPF2Ktkk+47MtRLkrrlFLKr9sosPp7xRmJUo4n9lr01fDptCeV6bGpe0adHVY2XYvceD2ADMxKVIJ6zM2GBaoCNdo7PZrbXDQKj4C9qTUc1ifcPSUuebimKUmwl1PK51qdPvU67AT/1AFvDNVpAwAIn5gbzK+VoVulsqETfG59cE6Sk0C8Deqsf02/SKBj+9s703AGP64PAfDLLYBE62X9LPtTqhU+Ber0yHqGJFPJ71jd9Q6dTnn3l2aL2F+mx0Mx2HaXeUSEQ2ap7G0mTFRNvRZGElX8cQ2PwqXg7wTvpMLyFdXiyUuOSDDJYFLVNYt9pIfyFcI/nlIXP2zGQacCf7u8pO+lBwjdr00utVDaIoQybb3aQt8vUJuPthvWn3OSS2uXbi36hbhsD2coi/N0pp3q6g3HXa9XU/RBEuJUhYhFfqUefhtw6BwJVGqtwyxxfRIv5ASmbchAJJxieXUGe7xnOcXwmEo2wysA3yIXNb+W5V4jw7g021V0rBPGfrb5eiCLhSHdAc6+nV56qd30FUKHujckeBfj3WoJ3VGS+dVGfaB/brZHKjIEo/18vmbh+u608zoYXuD9g6Dy3SE66xhU8y4LgNzOZAyuXx8kDSOP7UzKCps6ZcbgsKj1yg6JtzphL6Cyy7FD+zMsDMOJwwqRp/hDCMOem5EXuSHpyRPWIJtmECuuD2LIIRZiwvlKLYSL8PEjXCKNubGixIPx3iTfkOANnAdgNvFND0/RU0a9d5P++ZBlvNLIij5MT7YfZOSxKMscFXx1QYRAFDWzvZcX0LTCtoBznwpWkSW+go8tpvBWcoDK0OYKPRBpGLM4m/Dj0h5iT3DW/rCcI0fsigsEwuwGN1+Bu/87gBwP5HRgvdYz7mT6j2ug1hNzm4pDfLsPBmIEZGETQYbM6GY4uDtUJvJ8HT2Yoy4NoEJqXTzKZpV5cncPO94M252K7KkilNJNfw698YB66RnsBYT30tqN0ycazJwkTGa90Hl8NdSm/KIWYOsSGRDbgDevaE9ytKUFh3KIzaouRWwd0b5hud22EicoRpicOcommzzcmaj7C+lrWApu8on4q1ZVV9elK1ED6F+BZgVYYKvPEr/Ape9wffSaA2tiFxuToF/xjuDbF9YKhbL0OBNCwNsWQnZNzWQNoItQJr0vCVfTdWXdO0RldpeB4UNaRhN7PHIhdpHh3FMaEOqiDmLT38h1dDLgA616zS+vZ27IyPldHKO3SgqtoMN+V6vRiwncYStOAQ7933rTLngCN7Jt5e+uI4fzV1IzqR5En2sN8lICdHmcNDobth2tlLz3jrFJK32OBupbSFbLhEJ+9xnK5oZg8vS429q2LL9CpwcBzuLyNvrxQ5MhIovAqkj7VhS7eAMi715BKnfVMbqVfQu9XQrVwz8P2w3GAAxzJ4MbkbrbWJyMPUSsI1Rem4A/xfE4MPR35Ct+K0snKkkVcqmWfJ0ZsHk2o/dJN/IwTeiidT8IK7o6aOblwH8GsweUmcha2ed2wsZrjXohpfng6hxrXkN/50WKRCfKGgGUcnpeoFlBA8c4gulJnA9vuQBOFR5TWHYgGuPLuzMZquPRcuZfL1L7jtj0jf3VfaW7a/FGaFxjjvPoHrlxWEVJfdez8wvKpVg6PQ2NxrXL80UkzgQlxnXDj3sHZ0NFwZm27GAJTmxTpUZw/M7JLt0wgBoGIKov73C1r2Z2LmOgx0EMaGStfrjsDDAKokdsB8Tur68xeGdEU6JiShTnj2U/QAkj6b/qblblcGdwE41O0YKYJiUiOIYpBFwQ1/uiDRyL4E1B201WnZRaRQHBbYhQjMwGiFM5yzwIQ/V4IIwyTYUp+wE7f4i6YK+WU/LL3T6i0dFeYsvzlEl1lahX/ktMOQUSbDab4Re0WQSarn7csQaC+VU+efNEqXC1n/xAJMhr5/drpqg78EmvelTFcBzG+aTJx8ogA0oPP9v+vf3WZ1JdKYHPavG/C8bhOB6Aznf+sLyVLCwmzRpTH4JwFtSI8f9w3mgM/rPT+JRnP66Z40mYCQqVyv6Cnm68zvgzSu+/AwIj7bN9r3M8J3i6PbruuqSYjJdYgOPAY2HrLfqYleRPV9bmqVGRgis2iFr/8mbRBMgMZ3dA3acc5eOf8W6tT2APnFvFJCtLQZLXD/VJyiD86OgcL8eshEJptC76K8s7xW1Mv0sni/VnIYD7bp+mX6rVLUB32DNCtkbcWE2GjHRIgvgSSwg+6khxed38kBWZAC8iMbjQZpIRdFBXuEENgkRNnUqwnTH/Tl5YZ21QCc5xNSBz9jMogwrTGbHFuOj9Zm6FAsOYqTYbEus/tM6DGkACccWvoZDiFlKdA8ahjUVgDJxXvAQ6QcOKKiJH3cyfrUhQGKkC0gQyn1+GlpMqJcgTUIeEtEpuAONye4ggMoOAKM4Zw1384cCD95x4aTvVQtAVMhkER3u2eJC1YgyxEBZC3tEhROAfOMM6z0hpNtRe1wNbBmDWQCll6dKZgNDjkVepywoiko/KLIeyPvIsEFD9aNtvi2CGcSERu8AQkC7zKyDlPDy/9cApWlZsP2LLMlZld3c7t55RBhHTuNeO0+phpEHae5VfRzkXmWCQnkSB/DrE4HBP1WD5l8xeCbThNvEG/nLhKFQZSF4xxNdawuC+4cDy17viNz39hlX86d5K+zMvLenrP/NWt1vCcQl/DTW8Av4/Y9HL44B311GBOGNb9diYHLaal1jx3RLITY3KgNSPYSjtRtF5/7mv2eFG8Lp7v25cM136HwUoudmbZdH5F3wYInBbLmAt72fJmh/7Huc/vepM1MgkUShtJbiPb7lKKOdBUrcDStWo63b53m71AjJe8JjjocuAidYyepFQZusXysf7tZOUv+ZdD2DUOU7TunwBj5gB5fXnNk/7VsFAZyjPt3rOXF/xeq6dmbAqf8tCT40n9Qdf2UKjCmQgz0wxiMqy61am/nF4qZZyYgrq7A+AqsSiVMDJfw91KucWWPX5TqdwZcPs7orA/PLzymZ4e71e7kBsLvudxQ18zYWvgJacNNUCaBeB2vn5huOeTt+hldDPVgyT1QZbj6rZESKF1+fp4N4uFo+0rFMJ7N2CPUboVdBPC14+vBcJOmqnBbSsSj5UOCrH5DdRpqY5F8O424Bie/hVtsh9yaY24ixJNU4GoTAfIrSzDvs9uXqINk+zZx22qRbhEDS9Rk9rDAEANWa2B+SUVIphmPRzw8YPrutPZkmlQeDrlZdebYTA9I4gEOoyzIXXquHl9LIr8h5BD/sYfWq9vtsJzsYXjp52KpDh6flwb8igemV8emFQD8oGRgsJKX3AP9sK1b4zhI7QA8p037ipnxxXZuL9bcAvltKPLS+jAgBD4mgDv14AVODQ61ZcI7hYW57WrXj5ztz+QEYAKx9BVpDskt0EQmuhhSalXuGt0E08bLrGiH7ofQnDL8U4eN3Ecmeww9Y9Coq3S3Mki8bCI31Hem+OnVVqSP2VNXOqAk0jkcR5MAEmem93OaZf2PW471JVEjBmejnbY8M6YXVR997n/8NMqF+HTntPmnyxeWicQ9HdaS3ecRaHH3XDaB+wOG7Oi95JniooVtOFm9j3OW8eJxMclwCOgQJAizbu3DzSHTyyC6gIuAtjgdz3sXGYSWF3GRpn5GoP/b9CnZ5SvXGztqgFh/Q+R97e/aiwaQh6bYafbdxD/h1LctYIlZGvEA+R/Tlfwcl9JnM/Kbdf6x+XZMksojvISOB7I2K14hMc0OeZCpTbnQ2jkdMw2V8oSqQFD63QW0O0o1Xuwek/8KZtgDVXOTt0pmD5Y5f695F6XVqZgq8Aoc8yysIP/LLDux3Q8FCLONPdsabYViGZnSkaTGjSpV/PaiO9IHf0Zw0oesdQB0BbnSmCSdNJ4g8EYjHm7lNh3OA/XlwCtdoIvQqx0XC7sZFXQL7WGQgdCwM2en3wIi+Xwm3Yh5IMV+sEAR4196pg4Wwb5AOG5JRlUl8g/ru4CJ8SNXi+RdCH3YDb4pMLZQ3epcQQ2KmN1rGL48owQTEhkKkj/kv/WK/6UOdP75JixkokeOlnN29aql+bs16XBvG3zdzzIZe8DBHTwa9OpMjMqaxa6AyVxl4PX9dLqTYQQqkib1s5qwgRHsy5nuwaLtiUnmTcv9eEsq5Utn7C+WK5p8F5XU3ADe8UdLi63Op5pNSL8CoWRD9hNQavDp3xwddy8P33G0H2zBqrkiiodk4IUiUi5AIq7sGMZhN8uD22T8XrkUPizdLCwl4t8O8TLbu0aIDaMEktHX6TQ3MJWcLemtMZc/E0mETGYr0qhRq+5zLtpF0FqeWz2Jfa51sdzpQ+w73xeOapku+/byzcwxNPdaQhqzmEzSp75aXquNZ9tDrVP5e0UaMrQ46xLj7ea8Gx27COC9U5IjXgBW2nHYcU9HPVhpTnHks0BarNxhMzi/VsflWSkPiT6hImcow8f277jjBmsb5OxW6wAyjgya/xhzp2g0rIVZh49tl82aXHMAsyNNyQH8ZPozbHXe6YBWpXjnIOf0/M7QS1PXz0Sn3Iy6udf/EPadlkvSfMdfIBaYelEX03JY3EEXVhmHYLFByv2NMU+EKlLOI9wH9+npZb2DFbjWevSo7NZkR5N78hvNCXqL+3SylAq7MGBvLh1Ceb6LhEueHnbQKpVhkZw9FhObcQuVUXHpOU4LpeI9wfmwBPIMhPJWGF4pWsFfHwKx0TN+u5VcMHJDtcCWfXYZcq6ggXUM/pJJ8OwgnLC7p/Jbv5ERNztrJ2uP7/0mq7Lopn5yoXyfwQJgqPG1HdQcuUaNl3l8asfW2gRj+dYUp4jP/PMBRbjHodcohlTzsfM5lvf2yCtupy89WVjtB4/Qp5l3wGJvT4Fgeb22N/avH9XtT9lSZmghEASBysDz0wyOCsKlhqjKurMllNH/CD75vvKFWZ76gA9b+jJx8XWvgvM56NVjkPlq+fae2yNckeL5U57rIdxKbNfFrBwpOg6zK75Ua6pL+QyuezGzHU6/RLoVUkNk811SvCgSJKWcyA6tMb9rpzk1r7k+WV9IsHGI5mnvlZBvZEk2ctSUkA8iH1o1XKyKevqwu+7G0de9mua64fR1EmQAqTauc/x5NmGjJwx5anzgyVyYg7ooTsTsrOyX4qsAX6FxJgsbxZ6WOByNnfA6o8sHp+cjyoDw5Pg9IAuaJRi8I5/Uka6GyNx7hXcKi76K7aQpo8PFIpybqTpwqTgyFPtWh07RtjEpT5yFzwTiwDnREvyOkM46WxW5hRF3OIODda549ODGvCjKt6YAI5CnIqwhGoG5WXynNmZZFO57gpHJ0HruWkFn468wNdr66vPM9Zib2mt0ME4U0sSs+vF+6W8xonFCxQZ0Ci+XBWEw771dcXonw/QqKL/n1Ky9JUxpH1LCwLB+YeX0UsT+1DJ+l5nZ4rmvXdrmgWYBK0z5AyO0WfNquA95cwdfB2QyC0xZv2SVcCMT4hAa3LGxi4w3zT4moIjK5ELSpabqSf8YVbMi+kQhybwcQaG5NMXt72XZVxmCts4ZeSvOmbsJ6GzyQBgTxpKLORhSn7eZ7IwpxXMnSmVkhD2uT5E4CnkmgSMeY3JFVJ01ebxYdqFy+eWwt/czFnub+xa2fasVl7oVbRdYkBRpXVXvBJkIHAmHzwjARUnvCTVHEn0+zBETNcUgfrofQG0lRpVN7lfWVmOs2pd9mrIAiiHNXEhukWmYog9mk2lya9AbKc4Jlfd6yRXbt2rwuoBHbEjKWK3CC5UJ2FRLcNtzCa9O5wSPO+LibLbAAohtdc7cWc8og3GTpTEHDM8voiGJHAjogvq2hD/wMeqBU8hZHFv2mrd7SOsoDE96SLHkx3HavvEGXeeRBWNqWZLHcF2N4tkp6qDJ3+5FS/Fa4+X4uOIZjNRJSGmR+Ur1suULLzhcOnm7j/hlBR/7kMGgj7S7VkNf1CvmQVE+qXOFgu7yIpWpTmbGXbWu544IXaEkGaSXsaeYjQrOOCvOc37s2uK9cjjFQgVQlRhJRhvSdL9ADB5yMfVH1nIFcaasF8Syx00dlfC3wz7Xh4eGXF09jPgUUG9vVD7EoKLsxpM8hcXsKN2mNIFmChnHpoeCRD0HUo1zYXlV8sn+pwtuUdGyQHPMj0rZvEFNg7iRAsw29AaRFrzQiekASgJhEnYZU3CAIehX/loUhzZhE/MdtL+aT5qVqAP6sTVs4/HrHpbZAo0fTZoq30JS1yY19wev32DFyhF/DnQgOoHzPBWD5l57kSCBsmgEsJ/pnRff1S0RwG61JiIZJYzwaUAc2ddUVc6cekgrHiuDvf89jU7IRPQwGoL3QbMlUb9uFVJ80U1m/YhO0vXV+swP1dn2AyfwwLcWC8uiu8ZJQJ1Rai96i0OOxWT+qekibdAM/5rpGUir0IIzLWkUm+MkRlFsySbd/p2I1A4Ywr+/YkaVfMLIY/yu74n4Xpy8tuM0SIpfW4hQRqSajcIJ+py9yT9ref8VTw7BsUVsh7tgVVPwpofL6bvKqtaK+5CN4dFmgwmAVIgXHBASa/mIOy+fiBktDfUnLluhy0FA8s5GjoAvQentRKbcc/WmjrgiSSikuJHkl4vs0w38OWEKYWysXsPalmn7S5vPQiEJt1V2b2bebAi91IkoonlDiNZg5jl+WeOjubVkKAXbygrCHy3p4Y6sPgdBuzpfejOVylR7liRT9fw9cyEnb7MrNknHp7HOI/fKeFBHslT2ajhyjn7bkiOrZfMSGHKGCcKPzlaUEOk2AYb41B+Aaswh2+tbe8fcyCB4jgAAB0PH8Iu6HulsU0pnunKsRmL7uOlcN4uTSfPvsguHStUbuY+DRp2Q/B8QIPPImccNEZMi4J9yqPJvltsDvNKf9nTrmHd76OvnzKLLoGF/7OwIMY86de0JNKv20kDEbcCakPpqUDqXdA6EyafgVO35jqnPl2vBlcnnl5TGM7ND0gY6y0ShGVmAOuErdBQEdRTXwoUwm8vT03R8TxLaxSueJTz1IM9U6e1zvut2F7QNu1Y6JH0j2TnTaEf+n7RsSHMqsme5YFXq1AdR9olaEL+YtzGf0+PUDEkN0RDi82JnWxtPgUjYsBbM5Ovma6aQTQFunmnC24pAmyt7tXY3GWah7zmNrLVq7WxV8FfEr2JCvC3F5/6AagRIzsmDKjoCAT7VXCDhN6A7HDLtPxnHetZ+zcLNNiIqg5JqnYRsjAmcjVo9zRqmXYj/mJtryZdLq5bro6GzQzz/rwbZBWmZxFvN0xA4iXuTDM4rv4od9Mttcq7eDeeiqvQAcUYzcsyzKPpcF7eo83w66zUcCYXMFJK8r0TJ6Ssxv0uAXtdY7WyxSTYCS8ckEtge18pJyncs05P4oAphDxrmeo3+JwrHzDlrIBlg9QOa5nDxrrsmZ4n4iHr3jMKaL2W3KF4hag2z+g1gAATgAAEdtkD/dnBhxbWAf9PxhbTUorgfrXPOzUEEqB0N1hPD2Z8bQE0JJAAefTvxeSDKXt9PMGmJIxI0rUHlW4FldINfqNoMy//MpIwzFtmdGqXXdLGOw1iYq56ebcoOYGvIDt1yq4K4O1KNNUj8ZxHEJcZmKAxmJgMux29IUtXth/pOn8hl5NX1+tkwqvaA2U4DCpRdgNg7CJROmsky6zLh0BONYi5xFb86rVX/rvATUmwoaYemfYu/phIVhIY7CYSYTXV6+ZAIM8tS7bru+1dyN/6V6w4KTGbmR2dwO4dcsLkA5N/1l+BSrgydbAAAwIAAAAxQlqrOBAAFjojlK3xy9XkfrSvWC4PHVMcwdjud04phL4qOnINPZD0/1HchMBUVzdfBI5+8O+L7OyxMN4yho8kCtQdUhhQxO9RRMCZpiVHE1JWL7AAGm3/1O6TjOyI+Npe1OLLuBvDZYRCqbM7YMWWFvuyfcBHCgyZaqSqLwxBPEtTXitoqr3+Ono65eF76g1Bqgd/aBBiaOAAATCamzABSFQAfBpcBEos4hQOBPpARuIdBcA9weB6Bme3gHBtbkUZKb/b1AEXNqnt0l0eNqTkcHjNIAAAAVBaA44BADiEoQT7FAACmFeF4BAAAA", "protagonists": {"fly": "", "sakura": "https://origin.picgo.net/2026/11/13/c3180da89e62f2278b1dd0ff5912e3742aa694adaf5a4ab4.png", "kaoru": "https://origin.picgo.net/2026/11/10/--7dd11b16024f5f30.png", "canvas": "https://origin.picgo.net/2026/11/10/--021a34721bcb1f68.png", "waltz": "https://origin.picgo.net/2026/11/10/--492a55e82a412ae9.png", "theo": "https://origin.picgo.net/2026/11/10/--85d3177552e21c35.png", "tsumi": "https://origin.picgo.net/2026/11/10/--d8e9f756dab64ef1.png", "lemon": "", "hanako": "", "nine": "https://origin.picgo.net/2026/11/13/9nine--2345425a242b24c6.png", "domain": "https://origin.picgo.net/2026/11/14/--4b669db2bc7ccd64.png"}};

  function bootGALWORLD(appRoot, shadow, config) {
  'use strict';
  const HOST_DOC = shadow.ownerDocument || window.document;
  const HOST_WIN = HOST_DOC.defaultView || window;
  const STORE_BACKEND = HOST_WIN.localStorage;
  const localStorage = STORE_BACKEND;
  const $ = (selector, root = appRoot) => root.querySelector(selector);
  const $$ = (selector, root = appRoot) => Array.from(root.querySelectorAll(selector));
  const ASSETS = (config && config.assets) || {};
  function scrollWidgetTop(behavior) {
    try {
      appRoot.scrollIntoView({ behavior: behavior || 'smooth', block: 'start' });
    } catch (_) {}
  }


  const DATA = config.data || { works: [] };
  const WORKS = Array.isArray(DATA.works) ? DATA.works : [];
  WORKS.forEach((work, i) => {
    work.index = String(i + 1).padStart(2, '0');
    work.accent = /^#[0-9a-f]{3,8}$/i.test(String(work.accent || '')) ? work.accent : '#ff92a8';
    work.accent2 = /^#[0-9a-f]{3,8}$/i.test(String(work.accent2 || '')) ? work.accent2 : '#a89bff';
    work.tags = Array.isArray(work.tags) ? work.tags : [];
    work.cast = Array.isArray(work.cast) ? work.cast : [];
    work.openings = Array.isArray(work.openings) ? work.openings : [];
    work.timeline = Array.isArray(work.timeline) ? work.timeline : [];
    work.cover = (config.assets && config.assets.covers && config.assets.covers[work.id]) || work.cover || '';
  });
  const WORK_MAP = new Map(WORKS.map((work) => [work.id, work]));
  const CAST_ART = (typeof ASSETS !== 'undefined' && ASSETS && ASSETS.cast) || {};
  const PROTAGONIST_ART = (typeof ASSETS !== 'undefined' && ASSETS && ASSETS.protagonists) || {};
  /* 原主角调整：每条对应世界书里同 tag 的三条 [主角] 条目。 */
  const PROTAGONISTS = [
    { key: 'sakura', workId: 'sakura', tag: '[樱之诗]', name: '草薙直哉', swapName: '草薙直绪', swapArt: 'https://origin.picgo.net/2026/11/13/-593ffa9a7cd24bb7.png', workTitle: '樱之诗', modes: ['swap', 'replace', 'absent'] },
    { key: 'nine', workId: 'nine', tag: '[9-nine]', name: '新海翔', swapName: '新海霞', swapArt: 'https://origin.picgo.net/2026/11/13/-bf18ec2611d45652.png', workTitle: '9-nine- 天色天歌天籁音', modes: ['swap', 'replace', 'absent'] },
 { key: 'domain', workId: 'domain', tag: '[少女领域]', name: '飞鸟凑', workTitle: '少女领域', modes: ['swap', 'replace', 'absent'] },
    { key: 'kaoru', workId: 'kaoru', tag: '[芬芳]', name: '千原直人 / 朝仓千弘', workTitle: '有少女涂彩的爱之芬芳', modes: ['swap', 'replace', 'absent'] },
    { key: 'canvas', workId: 'canvas', tag: '[画布]', name: '瑞木信 / 深山瑞希', workTitle: '少女编织爱的画布', modes: ['swap', 'replace', 'absent'] },
    { key: 'waltz', workId: 'waltz', tag: '[轮舞曲]', name: '真原葵', workTitle: '樱舞少女的轮舞曲', modes: ['swap', 'replace', 'absent'] },
    { key: 'theo', workId: 'theo', workIds: ['theo', 'tsuki'], tag: '[近月/少女理论]', name: '大藏游星 / 小仓朝日', workTitle: '近月少女的礼仪 / 少女理论及其周边', modes: ['swap', 'replace', 'absent'] },
    { key: 'tsumi', workId: 'tsumi', tag: '[罪与罚]', name: '觋夕摩', workTitle: '美少女万华镜4', modes: ['swap', 'replace', 'absent'] },
    { key: 'lemon', workId: 'lemon', tag: '[柠水]', name: '冲浪雪鹰', workTitle: '橘光柠水随想曲', modes: ['replace', 'absent'] },
    { key: 'fly', workId: 'fly', tag: '[飞翔心]', name: '葛木晶', workTitle: 'Flyable Heart', modes: ['replace', 'absent'] },
    { key: 'summerpockets', workId: 'summerpockets', tag: '[夏日口袋]', name: '鹰原羽依里', workTitle: '夏日口袋', modes: ['replace', 'absent'] },
    { key: 'lianai', workId: 'lianai', tag: '[恋爱借走]', name: '新海幸', workTitle: '恋爱？我就借走了哦！', modes: ['replace', 'absent'] },
    { key: 'shuizang', workId: 'shuizang', tag: '[水葬]', name: '茅崎英士', workTitle: '水葬银币的伊斯特里亚', modes: ['replace', 'absent'] },
    { key: 'linggan', workId: 'linggan', tag: '[灵感满溢]', name: '和泉智宏', workTitle: '灵感满溢的甜蜜创想', modes: ['replace', 'absent'] },
    { key: 'tiannv2', workId: 'tiannv2', tag: '[甜友2]', name: '和仓贤一', workTitle: '甜蜜女友2', modes: ['replace', 'absent'] },
    { key: 'tiannv25', workId: 'tiannv25', tag: '[甜友25]', name: '志贺浩辅', workTitle: '甜蜜女友2.5', modes: ['replace', 'absent'] },
    { key: 'tiannv3', workId: 'tiannv3', tag: '[甜友3]', name: '乡野义大', workTitle: '甜蜜女友3', modes: ['replace', 'absent'] },
    { key: 'chunbai', workId: 'chunbai', tag: '[纯白]', name: '瓜生新吾', workTitle: '纯白交响曲', modes: ['replace', 'absent'] },
    { key: 'zhishang', workId: 'zhishang', tag: '[纸上]', name: '四条琉璃', workTitle: '纸上魔法使', modes: ['replace', 'absent'] },
    { key: 'yuanqi', workId: 'yuanqi', tag: '[缘起]', name: '八乙女哲也', workTitle: '缘起甜韵趣恋丛生！', modes: ['replace', 'absent'] }
  ];
  const DEFAULT_PROTAGONIST_MODES = { sakura: 'swap', nine: 'swap', lemon: 'absent', fly: 'absent', summerpockets: 'absent', lianai: 'absent', shuizang: 'absent', linggan: 'absent', tiannv2: 'absent', tiannv25: 'absent', tiannv3: 'absent', chunbai: 'absent', zhishang: 'absent', yuanqi: 'absent' };
  const SWAP_KEYS = {
    '[9-nine][角色]🌈新海霞 · 档案': ['新海', '霞'],
    '[9-nine][角色]🌈新海霞 · 语料': ['新海', '霞'],
    '[樱之诗][角色]🌸草薙直绪 · 档案': ['草薙', '直绪'],
    '[樱之诗][角色]🌸草薙直绪 · 语料': ['草薙', '直绪']
  };
  const PROTAGONIST_CHAR_NAMES = {
    lemon: ['冲浪雪鹰'],
    sakura: ['草薙直哉'],
    nine: ['新海翔'],
    domain: ['飞鸟凑'],
    fly: ['葛木晶'],
    kaoru: ['千原直人'],
    canvas: ['瑞木信'],
    waltz: ['真原葵'],
    theo: ['大藏游星', '小仓朝日'],
    tsumi: ['觋夕摩'],
    summerpockets: ['鹰原羽依里'],
    lianai: ['新海幸'],
    shuizang: ['茅崎英士'],
    linggan: ['和泉智宏'],
    tiannv2: ['和仓贤一'],
    tiannv25: ['志贺浩辅'],
    tiannv3: ['乡野义大'],
    chunbai: ['瓜生新吾'],
    zhishang: ['四条琉璃'],
    yuanqi: ['八乙女哲也']
  };
  function swapVariantForLabel(label) {
    for (const key of Object.keys(SWAP_VARIANTS)) {
      const item = SWAP_VARIANTS[key];
      if (item.old.indexOf(label) >= 0) return { key, isNew: false };
      if (item.next.indexOf(label) >= 0) return { key, isNew: true };
    }
    return null;
  }

  const SWAP_ENTRY_DATA = {
  "[9-nine][角色]🌈新海霞 · 档案": "<新海霞_Character_Loader>\n姓名：新海霞（にいみ かすみ）。新海天的姐姐；九条都叫她「新海小姐」，苏菲缇雅叫她「霞」，结城希亚叫她「新海」。\n称号：白泉学园里那个「让人难以接近」的同班女生；小队里唯一没有能力的人。\n身份：白泉学园二年级学生，新海天的姐姐；石化事件追查小队里负责联络、查资料与拍板的那个人。\n年龄：2018年 17 岁\n\n## 外貌\n- 女性。黑发在光下透出墨绿，长发及腰，发梢自然卷；刘海短而碎，侧发垂在脸侧。\n- 黑瞳，眼型细长，眼尾略垂；眉眼比翔更柔和，神情仍带一点懒得解释的倦。\n- 脸型清瘦，肤色偏白；肩线窄，腰细，身形修长。身高 168cm。\n- 声音偏低而清亮，语速不快，反问时把话尾压平；被逼急了才会抬高音量。\n\n## 性格与定位\n- 表面冷淡、怕麻烦，实际先把事情做完；小队里唯一没有 Artifact 的人，负责情报、联络与拍板。\n- 对妹妹天用损话表达关心；对九条都、结城希亚保持距离但可靠。\n- 性转后的新海霞保留翔的判断力与责任感，但不再用男性自称，也不再说「老哥」。\n</新海霞_Character_Loader>",
  "[9-nine][角色]🌈新海霞 · 语料": "<新海霞 · 语料>\n\n【语气要点】\n- 自称「我」；语速偏快，句子短，吐槽时爱用「喔。」「哈？」「你烦咧。」，尾音比翔轻。\n- 叫妹妹「天」，被天叫「姐姐」；叫九条都「九条」，叫苏菲缇雅「索菲」，叫结城希亚「结城」。\n- 先泼冷水再办事，嘴上嫌麻烦，手上从没停过。\n- 被问到私事立刻否认，否认得又急又啰嗦；用女性口吻，不装粗嗓。\n- 对妹妹用损话表达关心，正经的话反而说得最短。\n\n【示例台词】\n- 「不许说尾行啊。我去『NINE BALL』吃饭纯属偶然，是偶然的。和九条她没关系。」\n- 「我们现在，打算阻止石化事件的犯人。」\n- 「天，别闹。……过来，我看看你有没有受伤。」\n</新海霞 · 语料>",
  "[樱之诗][角色]🌸草薙直绪 · 档案": "<草薙直绪_Character_Loader>\n姓名：草薙直绪（くさなぎ なお）。草薙直哉的女性版本；同学、后辈叫她「草薙」，川内野优美叫「直绪学姐」，稟、雫、圭叫她「直绪」，蓝在学校里叫「草薙」、动了真情才改口「直绪」。\n年龄：2018年 18 岁（三年级）\n\n## 外貌\n- 女性。棕色长发及肩，发梢乱，刘海长到遮眼；黑瞳，眼下有一层淡青黑，像长期睡不好。\n- 身高 168cm，肩窄腰细，站姿松，习惯一只手插在裙袋或裤袋里。\n- 右手有旧伤，握笔和拿画笔时仍会停顿；左手更稳。\n- 声音偏低，语速不快，谈艺术时会忽然换一副清亮的嗓子。\n\n## 定位\n- 草薙健一郎唯一的女儿；母亲是夏目水菜，因此与夏目家算亲戚。\n- 弓张学院三年级，美术社名册上有名字；不主动画画，却替别人看画、修画、扶画架。\n- 性转后的草薙直绪保留直哉的眼力、愧疚与自我低估，但不再用男性自称，也不再说「老子」。\n</草薙直绪_Character_Loader>",
  "[樱之诗][角色]🌸草薙直绪 · 语料": "<草薙直绪 · 语料>\n\n【语气要点】\n- 自称「我」；说话爱拿「真是的」「总之」「唉」起头，被戳中时词头打结。\n- 急了就是「笨蛋」「白痴」「你这混蛋」一起上，但用女性口吻，不压粗嗓子。\n- 谈艺术时忽然换一副嗓子，引诗、引画、引哲学，一句接一句。\n- 对稟、雫、圭叫名字；对蓝先叫「蓝」，动了真情才改口「直绪」。\n- 不画，却能把别人的画差在哪一步说破；被问到为什么不画，答案总是手上正在替别人做的事。\n\n【示例台词】\n- 「真是的……我知道了。把画放那儿吧，我先看看。」\n- 「我不会再画了。准确来说，是我不能再画了。」\n- 「让绘画诞生的也不是我的才能。」\n</草薙直绪 · 语料>"
};
  /* 性转专用角色条目：开启性转时关闭旧条目，打开女性版条目。 */
  const SWAP_VARIANTS = {
    nine: {
      old: ['[9-nine][角色]🌈新海翔 · 档案', '[9-nine][角色]🌈新海翔 · 语料'],
      next: ['[9-nine][角色]🌈新海霞 · 档案', '[9-nine][角色]🌈新海霞 · 语料']
    },
    sakura: {
      old: ['[樱之诗][角色]🌸草薙直哉'],
      next: ['[樱之诗][角色]🌸草薙直绪 · 档案', '[樱之诗][角色]🌸草薙直绪 · 语料']
    }
  };
  /* Page 02 groups the shelf into four fixed shelves. */
  const ARCHIVE_CATEGORIES = ['女装', '校园', '社会', '悬疑'];
  const WORK_CATEGORY = {
    fly: ['校园'],
    sakura: ['校园', '悬疑'],
    kaoru: ['女装', '校园'],
    canvas: ['女装', '社会'],
    domain: ['女装', '校园'],
    waltz: ['女装', '校园'],
    theo: ['女装', '社会'],
    tsuki: ['女装', '社会'],
    tsumi: ['悬疑', '校园'],
    lemon: ['校园', '社会'],
    nine: ['悬疑', '校园'],
    hanako: ['悬疑', '校园'],
    summerpockets: ['校园'],
    tiannv2: ['校园'],
    tiannv25: ['校园'],
    tiannv3: ['校园'],
    yuanqi: ['校园', '社会'],
    chunbai: ['校园'],
    shuizang: ['悬疑', '社会'],
    linggan: ['校园', '社会'],
    zhishang: ['悬疑', '校园'],
    lianai: ['校园', '社会'],
  };
  /* Works that already ship 剧情 entries in the worldbook. */
  const PLOT_WORKS = new Set(['fly', 'kaoru', 'theo', 'tsuki', 'tsumi', 'lemon', 'nine', 'sakura',, 'summerpockets', 'tiannv2', 'tiannv25', 'tiannv3', 'yuanqi', 'chunbai', 'shuizang', 'linggan', 'zhishang', 'lianai']);
  /* 剧情世界书的变量容器名；选中剧情时写入 世界.事件[key].状态 = 进行中。 */
  const PLOT_ROUTES = {
    fly: '飞翔心-主线',
    kaoru: '芬芳-主线',
    theo: '少女理论-主线',
    tsuki: '近月-主线',
    tsumi: '万华镜-主线',
    lemon: '柠水-主线',
    nine: '9-nine-主线',
    sakura: '樱之诗-主线',
    summerpockets: 'SummerPockets-主线',
    tiannv2: '甜蜜女友2-主线',
    tiannv25: '甜蜜女友2.5-主线',
    tiannv3: '甜蜜女友3-主线',
    yuanqi: '缘起-主线',
    chunbai: '纯白-主线',
    shuizang: '水葬-主线',
    linggan: '甜蜜创想-主线',
    zhishang: '纸上-主线',
    lianai: '恋借-主线',
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const STORE = {
    settings: 'galworld.tavern.settings.v2',
    persona: 'galworld.tavern.persona.v2',
    saved: 'galworld.tavern.savedWorks.v1',
    stories: 'galworld.tavern.storyOverrides.v1',
    customOpening: 'galworld.tavern.customOpening.v1',
    opening: 'galworld.tavern.openingSelection.v1',
    cityMode: 'galworld.tavern.cityMode.v1',
    customOpenings: 'galworld.tavern.customOpenings.v1',
    protagonistModes: 'galworld.tavern.protagonistModes.v1',
    personRoutes: 'galworld.tavern.personRoutes.v1'
  };

  const PAGE_INDEX = { home: 0, archive: 1, console: 2, persona: 3, opening: 4, final: 5 };
  const PAGE_ELEMENT = {
    home: $('#page-home'),
    archive: $('#page-archive'),
    console: $('#page-console'),
    persona: $('#page-persona'),
    opening: $('#page-opening'),
    final: $('#page-final')
  };

  const IDENTITY_SAMPLES = [
    { name: '佐藤 悠真', age: '17', identity: '转学生 · 图书委员', color: 'rose', variant: '0',
      background: '因为父亲工作调动，从北边的港城转来。行李箱里一半是旧书，一半是没送出去的信。你对这座城市的了解，只有一张折过很多次的通学路线图。',
      past: '中学时曾在图书馆闭馆前替一个陌生女孩留过一盏灯。第二天她转学了。你一直记得那盏灯，却忘了问她的名字。' },
    { name: '白石 澪', age: '19', identity: '旧书店店员 · 夜间音乐人', color: 'cyan', variant: '2',
      background: '白天在河边一家旧书店看店，晚上替 Livehouse 调音。你没有什么远大的计划，只想把这座小城的噪音调成一首能听完的歌。',
      past: '曾经组过一支乐队。解散那天，主唱把吉他留给了你，说等你想明白为什么要唱，再还给他。' },
    { name: '久远寺 灯', age: '18', identity: '茶道部员 · 甜点研究社编外', color: 'gold', variant: '1',
      background: '在外婆留下的老宅里独自生活，院子里有一棵不肯开花的八重樱。你擅长把冰箱里剩下的东西做成像样的晚餐，也擅长在别人问起家人时笑一笑。',
      past: '外婆去世前说，樱树不开花，是因为有人把春天借走了。你始终不知道，那是她在说笑，还是在说一件很久以前的事。' },
    { name: '桐谷 朔', age: '17', identity: '转学生 · 摄影部', color: 'violet', variant: '0',
      background: '母亲是自由摄影师。你跟着她搬过很多城市，已经习惯在陌生教室的最后一排找一个能看到窗的位置。脖子上那台旧相机，比任何一件校服都像你。',
      past: '你拍过一张没有洗出来的照片。取景框里有人回过头，但你始终没按下第二次快门。' }
  ];

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }

  /* Stored data may be corrupt or from an older build: never trust its shape. */
  function normalizeCustomOpenings(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .slice(0, 40)
      .map((item) => ({
        id: String(item.id || `custom-${Date.now()}-${Math.floor(Math.random() * 1e4)}`),
        name: String(item.name || '未命名').slice(0, 24),
        text: String(item.text || ''),
      }))
      .filter((item) => item.text);
  }

  function normalizePersonRoutes(value) {
    const out = {};
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach((key) => {
        const item = value[key];
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          out[key] = { relation: String(item.relation || ''), opening: String(item.opening || '') };
        }
      });
    }
    return out;
  }

  function normalizeOpeningSaved(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value;
  }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function icon(name, cls = '') {
    return `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function clock() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function motionReduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function safeColor(value, fallback) {
    return /^#[0-9a-f]{3,8}$/i.test(String(value || '')) ? value : fallback;
  }
  function unique(list) { return Array.from(new Set(list)); }
  function paragraphs(text) {
    return String(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  }
  function workById(id) { return WORK_MAP.get(id) || WORKS[0]; }
  function selectedWork() { return workById(state.selectedWork); }

  function findRoleById(roleId) {
    if (!roleId) return null;
    for (const work of WORKS) {
      const person = (work.cast || []).find((item) => item.id === roleId);
      if (person) return { work, person };
    }
    return null;
  }

  function personaDisplayName() {
    const p = state.persona;
    if (p.mode === 'role') {
      const found = findRoleById(p.roleId);
      return (p.roleName || p.customRoleName || (found ? found.person.name : '')).trim();
    }
    return (p.name || '').trim();
  }

  /* Everything the prompt builder needs about who the player is. */
  function personaPromptInfo() {
    const p = state.persona;
    const crossdress = !!p.crossdress;
    if (p.mode === 'role') {
      const found = findRoleById(p.roleId);
      const name = (p.roleName || (found ? found.person.name : '')).trim();
      return {
        mode: 'role',
        name: name || '原著角色',
        identity: found ? found.person.role : '原著角色（自定义）',
        background: found ? found.person.bio : '',
        work: found ? found.work : null,
        character: found ? found.person : null,
        crossdress,
        appearance: String(p.appearance || '').trim(),
      };
    }
    return {
      mode: 'self',
      name: (p.name || '').trim() || '{{user}}',
      identity: (p.identity || '').trim() || '学生',
      background: (p.background || '').trim(),
      work: null,
      character: null,
      crossdress,
      appearance: String(p.appearance || '').trim(),
    };
  }

  /* ---------- State ---------- */
  function defaultSettings() {
    const result = {};
    WORKS.forEach((work) => {
      result[work.id] = {
        enabled: work.id !== 'canvas' && work.id !== 'theo',
        plot: true,
        swap: false,
        intensity: 62 + (Number(work.index) || 0) % 4 * 9,
        castSwap: {}
      };
      (work.cast || []).forEach((person) => { result[work.id].castSwap[person.id] = false; });
    });
    return result;
  }
  function normalizeSettings(stored) {
    const base = defaultSettings();
    if (!stored || typeof stored !== 'object') return base;
    Object.keys(base).forEach((id) => {
      if (!stored[id] || typeof stored[id] !== 'object') return;
      const src = stored[id];
      base[id].enabled = src.enabled !== false;
      base[id].plot = src.plot !== false;
      base[id].swap = src.swap === true;
      base[id].intensity = clamp(Number(src.intensity) || base[id].intensity, 0, 100);
      Object.keys(base[id].castSwap).forEach((personId) => {
        base[id].castSwap[personId] = !!(src.castSwap && src.castSwap[personId]);
      });
    });
    return base;
  }
  function defaultPersona() {
    return {
      mode: 'self',
      name: '', age: '', identity: '', background: '', past: '',
      crossdress: false,
      companions: {},
      bondCategory: '姐妹',
      roleId: '', roleWork: '', roleName: '', roleTab: 'select', appearance: '',
      color: 'rose', variant: '0'
    };
  }
  function normalizePersona(stored) {
    const p = Object.assign(defaultPersona(), stored || {});
    if (!['self', 'role', 'bond'].includes(p.mode)) p.mode = 'self';
    if (!['select', 'custom'].includes(p.roleTab)) p.roleTab = 'select';
    p.crossdress = !!p.crossdress;
    p.companions = (p.companions && typeof p.companions === 'object' && !Array.isArray(p.companions)) ? p.companions : {};
    p.bondCategory = ['姐妹', '青梅竹马', '大小姐', '其他'].includes(p.bondCategory) ? p.bondCategory : '姐妹';
    ['name', 'age', 'identity', 'background', 'past', 'appearance', 'roleId', 'roleWork', 'roleName'].forEach((key) => {
      p[key] = String(p[key] || '');
    });
    if (!['rose', 'violet', 'cyan', 'gold', 'blue'].includes(p.color)) p.color = 'rose';
    if (!['0', '1', '2'].includes(String(p.variant))) p.variant = '0';
    p.variant = String(p.variant);
    return p;
  }

  const savedOpening = normalizeOpeningSaved(loadJSON(STORE.opening, null));
  const savedSettings = loadJSON(STORE.settings, null);
  const migratedSettings = (savedSettings && typeof savedSettings === 'object') ? Object.assign({}, savedSettings) : savedSettings;
  if (migratedSettings && (!migratedSettings.nine || !migratedSettings.hanako)) {
    migratedSettings.canvas = Object.assign({}, migratedSettings.canvas || {}, { enabled: false });
    migratedSettings.theo = Object.assign({}, migratedSettings.theo || {}, { enabled: false });
  }
  const state = {
    currentPage: 'home',
    homeFilter: 'ALL',
    homeCollapsed: false,
    archiveToggles: {},
    archiveFilter: 'ALL',
    archiveSearch: '',
    cityMode: 'city',
    selectedWork: (savedOpening && WORK_MAP.has(savedOpening.workId)) ? savedOpening.workId : (WORKS[0] || {}).id,
    protagonistModes: {},
    protagonistScanAt: 0,
    protagonistCollapsed: HOST_WIN.innerWidth <= 700,
    plotRoutes: {},
    plotScanAt: 0,
    homeGateSeen: false,
    archiveFocused: false,
    detailTab: 'overview',
    selectedCast: 0,
    storyEditing: false,
    settings: normalizeSettings(migratedSettings),
    persona: normalizePersona(loadJSON(STORE.persona, null)),
    savedWorks: new Set(loadJSON(STORE.saved, []) || []),
    storyOverrides: loadJSON(STORE.stories, {}) || {},
    openingWork: (savedOpening && WORK_MAP.has(savedOpening.workId)) ? savedOpening.workId : (WORKS[0] || {}).id,
    sceneTab: (savedOpening && ['work', 'generic', 'custom'].includes(savedOpening.sceneTab)) ? savedOpening.sceneTab : 'work',
    sceneId: (savedOpening && savedOpening.sceneId) || '',
    openingMode: (savedOpening && ['city', 'free', 'person', 'plot'].includes(savedOpening.mode)) ? savedOpening.mode : 'city',
    freeOpening: (savedOpening && savedOpening.free) || '',
    openingPerson: (savedOpening && savedOpening.person) || '',
    openingChapter: (savedOpening && savedOpening.chapter) || '',
    cityZone: (savedOpening && savedOpening.cityZone) || 'campus',
    cityIdentity: (savedOpening && savedOpening.cityIdentity) || '',
    cityIdentityAuto: !(savedOpening && savedOpening.cityIdentity),
    cityGoal: (savedOpening && savedOpening.cityGoal) || '',
    cityArea: (savedOpening && savedOpening.cityArea) || '混校区',
    cityStep: (savedOpening && savedOpening.cityStep) || '',
    cityOpening: (savedOpening && savedOpening.cityOpening) || '',
    cityConfirmed: !!(savedOpening && savedOpening.cityConfirmed),
    cityOpenStep: 'area',
    firstStepCat: '全部',
    openPersonWork: '',
    openWorkGroup: '',
    openPlotGroup: '',
    finalPrompt: '',
    customOpenings: normalizeCustomOpenings(loadJSON(STORE.customOpenings, null)),
    personRoutes: normalizePersonRoutes(loadJSON(STORE.personRoutes, null)),
    editingPerson: '',
    customOpening: loadJSON(STORE.customOpening, null),
    openChannels: new Set(),
    launchTimers: [],
    currentLaunchText: '',
    resetArmed: false,
    clearArmed: false,
    customArmed: false,
    lastFocus: null,
    navLock: false
  };

  /* ---------- Toast ---------- */
  const toastRegion = $('#toastRegion');
  function toast(message, iconName = 'check') {
    if (!toastRegion) return;
    const node = HOST_DOC.createElement('div');
    node.className = 'toast';
    node.innerHTML = `${icon(iconName)}<span>${esc(message)}</span>`;
    toastRegion.appendChild(node);
    setTimeout(() => {
      node.classList.add('is-out');
      setTimeout(() => node.remove(), 330);
    }, 2800);
  }

  /* ---------- Ambient / cursor ---------- */
  function initDust() {
    const canvas = $('#dustCanvas');
    if (!canvas || motionReduced()) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = 1, raf = 0;
    let particles = [];
    const palette = ['255,146,168', '168,155,255', '124,231,218', '231,196,139'];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = window.innerWidth < 720 ? 24 : 52;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.7 + .35,
        speed: Math.random() * .18 + .04,
        drift: (Math.random() - .5) * .15,
        alpha: Math.random() * .42 + .08,
        color: palette[Math.floor(Math.random() * palette.length)],
        phase: Math.random() * Math.PI * 2
      }));
    }
    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(t * .0003 + p.phase) * .06 + p.drift;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    resize();
    raf = requestAnimationFrame(draw);
    HOST_WIN.addEventListener('resize', resize, { passive: true });
    HOST_DOC.addEventListener('visibilitychange', () => {
      if (HOST_DOC.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    });
  }

  function initCursorGlow() {
    const glow = $('#cursorGlow');
    if (!glow || !window.matchMedia('(pointer:fine)').matches) return;
    let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
    let x = targetX, y = targetY, raf = 0;
    window.addEventListener('pointermove', (e) => { targetX = e.clientX; targetY = e.clientY; }, { passive: true });
    function tick() {
      x += (targetX - x) * .12; y += (targetY - y) * .12;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    HOST_DOC.addEventListener('visibilitychange', () => {
      if (HOST_DOC.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- Navigation ---------- */
  function setupNavigation() {
    shadow.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-goto]');
      if (!trigger) return;
      event.preventDefault();
      const page = trigger.getAttribute('data-goto');
      if (page) navigate(page);
    });

    HOST_WIN.addEventListener('resize', moveNavGlider, { passive: true });
    setTimeout(moveNavGlider, 80);
  }

  function navigate(pageName, options = {}) {
    if (!PAGE_INDEX.hasOwnProperty(pageName) || !PAGE_ELEMENT[pageName]) return;
    if (state.navLock) return;
    if (pageName !== 'home') {
      const gate = $('#homeGate');
      if (gate && !gate.hidden) { state.homeGateSeen = true; gate.hidden = true; }
    }
    const isSame = state.currentPage === pageName;
    if (isSame) {
      scrollWidgetTop(motionReduced() ? 'auto' : 'smooth');
      if (pageName === 'home') {
        renderHomeGallery();
        renderHomeDetail();
        const homeScroll = appRoot.querySelector('.home-scroll');
        if (homeScroll) homeScroll.scrollTo({ top: 0, behavior: motionReduced() ? 'auto' : 'smooth' });
      }
      if (pageName === 'opening') refreshOpeningPage();
      return;
    }
    state.navLock = true;
    state.currentPage = pageName;
    Object.keys(PAGE_ELEMENT).forEach((name) => {
      const element = PAGE_ELEMENT[name];
      if (!element) return;
      const active = name === pageName;
      element.hidden = !active;
      element.classList.toggle('is-active', active);
      if (active) element.setAttribute('aria-hidden', 'false');
      else element.setAttribute('aria-hidden', 'true');
    });
    $$('.nav-link').forEach((link) => {
      const active = link.getAttribute('data-goto') === pageName;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const progress = $('#navProgress');
    if (progress) progress.style.width = `${((PAGE_INDEX[pageName] + 1) / Object.keys(PAGE_INDEX).length) * 100}%`;
    if (pageName === 'home') {
      renderHomeGallery();
      renderHomeDetail();
      const homeScroll = appRoot.querySelector('.home-scroll');
      if (homeScroll) homeScroll.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      moveNavGlider();
      revealVisible(PAGE_ELEMENT[pageName]);
      scrollWidgetTop('auto');
    });
    if (pageName === 'opening') refreshOpeningPage();
    if (pageName === 'persona') updatePersonaPreview();
    if (pageName === 'console') renderConsoleV2();
    if (pageName === 'final') renderFinalRecord();
    if (pageName === 'archive') {
      if (!$( '#workGrid .work-card')) renderWorkGrid();
    }
    setTimeout(() => { state.navLock = false; }, 120);
  }

  function moveNavGlider() {
    const active = $('.nav-link.is-active');
    const glider = $('#navGlider');
    if (!active || !glider) return;
    glider.style.width = `${active.offsetWidth}px`;
    glider.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  const revealObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: .08, rootMargin: '0px 0px -6% 0px' })
    : null;
  function revealVisible(page) {
    if (!page) return;
    $$('.reveal', page).forEach((element) => {
      if (element.classList.contains('in')) return;
      if (revealObserver) revealObserver.observe(element);
      else element.classList.add('in');
    });
  }
  function initReveal() {
    Object.values(PAGE_ELEMENT).forEach((page) => revealVisible(page));
    if (!revealObserver) $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  function setupArchive() {
    const search = $('#workSearch');
    if (search) {
      search.addEventListener('input', () => {
        state.archiveSearch = search.value.trim();
        renderWorkGrid();
      });
    }
    const clear = $('#clearSearch');
    if (clear) clear.addEventListener('click', () => {
      state.archiveSearch = '';
      state.archiveFilter = 'ALL';
      if (search) search.value = '';
      renderFilters();
      renderWorkGrid();
    });
    const filterBar = $('#filterBar');
    if (filterBar) filterBar.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state.archiveFilter = button.getAttribute('data-filter');
      renderFilters();
      renderWorkGrid();
    });
    const grid = $('#workGrid');
    if (grid) grid.addEventListener('click', async (event) => {
      const card = event.target.closest('[data-work-id]');
      if (!card) return;
      const id = card.getAttribute('data-work-id');
      const next = !archiveWorkOn(id);
      state.archiveToggles[id] = next;
      if (state.settings[id]) state.settings[id].enabled = next;
      saveSettings();
      renderWorkGrid();
      renderChannels();
      refreshSummary();
      renderHomeGallery();
      renderRoleGrid();
      if (state.currentPage === 'final') renderFinalRecord();
      const work = WORK_MAP.get(id);
      const title = work ? work.title : id;
      const result = await pushWorkWorldbook(id, next);
      if (result && result.ok) {
        const count = result.changed ? `${result.changed} 条` : '已是最新';
        toast(next ? `《${title}》已启用 · 世界书 ${count}` : `《${title}》已停用 · 世界书 ${count}`, next ? 'check' : 'power');
      } else {
        toast(`《${title}》${next ? '启用' : '停用'}已记录，但世界书没有同步成功。`, 'spark');
        console.warn('[GALWORLD] 世界书同步失败', result);
      }
    });
    const spine = $('#spineList');
    if (spine) spine.addEventListener('click', (event) => {
      const thumb = event.target.closest('[data-spine-id]');
      if (!thumb) return;
      openWork(thumb.getAttribute('data-spine-id'), false);
    });
    const back = $('#spineBack');
    if (back) back.addEventListener('click', expandShelf);
    const detail = $('#workDetail');
    if (detail) {
      detail.addEventListener('click', handleDetailClick);
      detail.addEventListener('keydown', handleDetailKeydown);
    }
    if (!appRoot.dataset.castErrBound) {
      appRoot.dataset.castErrBound = '1';
      appRoot.addEventListener('error', (event) => {
        const img = event.target;
        if (!img || !img.dataset || !(img.dataset.castArt || img.dataset.roleArt)) return;
        if (!img.dataset.rawTried) {
          img.dataset.rawTried = '1';
          img.src = String(img.src || '').replace(
            'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets',
            'https://raw.githubusercontent.com/jianchi89/galworld-assets/main/assets'
          );
          return;
        }
        img.style.display = 'none';
      }, true);
    }
    syncShelfState();
    HOST_DOC.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (state.currentPage !== 'archive') navigate('archive');
        setTimeout(() => { const input = $('#workSearch'); if (input) input.focus(); }, 170);
      }
    });
  }

  function openWork(id, collapse) {
    if (!WORK_MAP.has(id)) return;
    state.selectedWork = id;
    state.selectedCast = 0;
    state.detailTab = 'overview';
    state.storyEditing = false;
    if (collapse) state.archiveFocused = true;
    syncShelfState();
    renderWorkGrid();
    renderSpine();
    renderDetail();
    if (collapse) {
      if ((appRoot.clientWidth <= 980)) {
        const detail = $('#workDetail');
        if (detail) detail.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => $('.detail-shelf-btn')?.focus(), 420);
      } else {
        setTimeout(() => $('.spine-thumb.is-selected')?.focus(), 260);
      }
    }
  }

  function syncShelfState() {
    const archive = $('#archive');
    const main = $('#libraryMain');
    const spine = $('#librarySpine');
    archive?.classList.toggle('is-focused', state.archiveFocused);
    if (main) {
      main.inert = state.archiveFocused;
      main.setAttribute('aria-hidden', String(state.archiveFocused));
    }
    if (spine) {
      spine.inert = !state.archiveFocused;
      spine.setAttribute('aria-hidden', String(!state.archiveFocused));
    }
    $$('[data-shelf-toggle]').forEach((button) => {
      button.setAttribute('aria-expanded', String(!state.archiveFocused));
      button.setAttribute('aria-label', state.archiveFocused ? '展开作品架' : '收起作品架');
    });
  }

  function expandShelf() {
    state.archiveFocused = false;
    syncShelfState();
    setTimeout(moveNavGlider, 100);
    if ((appRoot.clientWidth <= 980)) {
      setTimeout(() => $('#archive')?.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'start' }), 30);
    }
    setTimeout(() => $('.work-card.is-selected')?.focus(), 320);
  }

  function workCategories(work) {
    return WORK_CATEGORY[work.id] || [];
  }

  /* Visual on/off state for the shelf switchboard. */
  function archiveWorkOn(id) {
    if (state.archiveToggles[id] != null) return !!state.archiveToggles[id];
    const settings = state.settings[id];
    return settings ? settings.enabled !== false : true;
  }

  /* Push one work's on/off state into the bound worldbook (all its entries). */
  function pushWorkWorldbook(id, enabled) {
    const bridge = (typeof config !== 'undefined' && config && config.onToggleWork) || null;
    if (typeof bridge !== 'function') {
      return Promise.resolve({ ok: false, errors: ['当前环境没有世界书接口'], changed: 0, matched: 0 });
    }
    const settings = state.settings[id] || {};
    const payload = { enabled: enabled !== false, plot: settings.plot !== false, protagonistModes: state.protagonistModes || {} };
    return Promise.resolve(bridge(id, payload)).catch((error) => ({
      ok: false,
      errors: [String((error && error.message) || error)],
      changed: 0,
      matched: 0,
    }));
  }

  function filteredWorks() {
    const query = state.archiveSearch.toLowerCase();
    return WORKS.filter((work) => {
      const matchesFilter = state.archiveFilter === 'ALL' || workCategories(work).includes(state.archiveFilter);
      if (!matchesFilter) return false;
      if (!query) return true;
      const haystack = [work.title, work.jp, work.place, work.tagline, work.intro, ...(work.tags || [])].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  function renderFilters() {
    const tags = ['ALL', ...ARCHIVE_CATEGORIES];
    const bar = $('#filterBar');
    if (!bar) return;
    bar.innerHTML = tags.map((tag) => {
      const count = tag === 'ALL' ? WORKS.length : WORKS.filter((work) => workCategories(work).includes(tag)).length;
      return `<button class="filter-chip ${state.archiveFilter === tag ? 'is-active' : ''}" type="button" data-filter="${esc(tag)}" aria-pressed="${state.archiveFilter === tag}">${esc(tag === 'ALL' ? '全部' : tag)} <span>${pad(count)}</span></button>`;
    }).join('');
  }

  function renderWorkGrid() {
    const grid = $('#workGrid');
    if (!grid) return;
    const works = filteredWorks();
    const empty = $('#libraryEmpty');
    grid.innerHTML = works.map((work) => {
      const selected = work.id === state.selectedWork;
      const on = archiveWorkOn(work.id);
      const mains = (work.cast || []).map((person) => person.name);
      const faces = (work.cast || []).slice(0, 6).map((person) => castFace(person)).join('');
      return `<button class="work-card ${selected ? 'is-selected' : ''} ${on ? 'is-on' : 'is-off'}" type="button" data-work-id="${esc(work.id)}" aria-label="${on ? '停用' : '启用'}《${esc(work.title)}》" aria-pressed="${on}">
        <span class="work-card-bg" style="background-image:url('${esc(work.cover)}')"></span>
        <span class="work-card-top">
          <span class="work-card-index">${esc(work.index || '00')}</span>
        </span>
        <span class="work-card-bottom">
          <span class="work-card-title">${esc(work.title)}</span>
          <span class="work-card-sub">${esc(work.jp || work.place || '')}</span>
          ${faces ? `<span class="work-card-faces" title="${esc(mains.join('、'))}">${faces}</span>` : ''}
        </span>
        <span class="work-card-flags">
          <span class="work-card-check" aria-hidden="true">${icon('check')}</span>
          ${PLOT_WORKS.has(work.id) ? '<span class="work-card-plot">可开剧情</span>' : ''}
        </span>
      </button>`;
    }).join('');
    if (empty) empty.hidden = works.length > 0;
    const countLabel = $('#workCountLabel');
    if (countLabel) countLabel.textContent = `${pad(works.length)} / ${pad(WORKS.length)}`;
    const archiveCount = $('#archiveCount');
    if (archiveCount) archiveCount.textContent = pad(WORKS.length);
    renderSpine();
  }

  function renderSpine() {
    const box = $('#spineList');
    if (!box) return;
    box.innerHTML = WORKS.map((work) => `<button class="spine-thumb ${work.id === state.selectedWork ? 'is-selected' : ''}" type="button" data-spine-id="${esc(work.id)}" title="${esc(work.title)}" aria-label="切换到《${esc(work.title)}》" style="background-image:url('${esc(work.cover)}')"></button>`).join('');
  }

  function getSynopsis(work) {
    return state.storyOverrides[work.id] || work.synopsis || '';
  }

  function renderOverviewPanel(work) {
    return `<div class="overview-grid">
      <div class="overview-block">
        <div class="overview-block-label"><span>WORLD ENTRY / 世界入口</span><span>${esc(work.era || '2018')}</span></div>
        ${paragraphs(work.intro).map((p) => `<p>${esc(p)}</p>`).join('')}
        <div class="theme-chips">${unique([...(work.tags || []), '现代日本', '2018', work.theme].filter(Boolean)).slice(0, 6).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="detail-note">${icon('spark')}<p>${esc(work.tagline || work.intro)}</p></div>
      </div>
      <div class="overview-block">
        <div class="overview-block-label"><span>STORY MOVEMENTS / 故事动线</span><span>0${(work.timeline || []).length}</span></div>
        <div class="timeline-mini">
          ${(work.timeline || []).map((item) => `<div class="timeline-mini-item"><span class="timeline-dot"></span><div><b>${esc(item.label)}</b><p>${esc(item.text)}</p></div></div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  /* ---------- Character art ---------- */
  /* Real art is the only portrait source now; if a CDN image fails we simply
     render nothing rather than an illustrated placeholder. */
  /* Real art is layered on top of the SVG placeholder, so a failed CDN request
     simply reveals the drawn fallback instead of a broken image. */
  function castPhoto(person, compact = false) {
    if (!person) return '';
    const art = CAST_ART[person.name];
    if (!art) return '';
    const src = compact ? (art.normal || art.stage) : (art.stage || art.normal);
    if (!src) return '';
    return `<img class="cast-photo ${compact ? 'is-compact' : 'is-stage'}" src="${esc(src)}" alt="${esc(person.name)}" ${compact ? 'loading="lazy" ' : ''}decoding="async" data-cast-art="1">`;
  }

  /* Small square portrait used on the page-02 switch cards. */
  function castFace(person) {
    if (!person) return '';
    const art = CAST_ART[person.name];
    const src = art && (art.normal || art.stage);
    if (!src) return '';
    return `<img class="cast-face" src="${esc(src)}" alt="${esc(person.name)}" title="${esc(person.name)}" loading="lazy" decoding="async" data-cast-art="1">`;
  }

  function castStageFrame(work, person) {
    const frames = (typeof ASSETS !== 'undefined' && ASSETS && ASSETS.frames) || {};
    const frame = work && frames[work.id];
    if (!frame) return null;
    return (frame.cast && person && frame.cast[person.name]) || frame;
  }
  function castStageStyle(work, person) {
    const frame = castStageFrame(work, person);
    if (!frame) return '';
    return ` style="--cast-h:${frame.h}%;--cast-left:${frame.left}%;--cast-top:${frame.top}%"`;
  }
  function castStageClass(work, person) {
    const frame = castStageFrame(work, person);
    if (!frame) return '';
    return frame.bust ? ' is-bust' : (frame.center ? ' is-center' : '');
  }

  function renderCastPanel(work) {
    const cast = work.cast || [];
    const person = cast[state.selectedCast] || cast[0];
    if (!person) return '<div class="scene-empty">人物档案还在装订。</div>';
    return `<div class="cast-layout">
      <div class="cast-stage${castStageClass(work, person)}"${castStageStyle(work, person)}>
        <div class="cast-stage-bg"></div>
        <div class="cast-art">${castPhoto(person)}</div>
        <div class="cast-stage-meta"><span>${esc(person.name)}</span><span>CAST / ${pad(state.selectedCast + 1)}</span></div>
      </div>
      <div class="cast-info">
        <span class="cast-kicker">${esc(person.role || 'CHARACTER')}</span>
        <h3 class="cast-name">${esc(person.name)}</h3>
        <p class="cast-role">${esc(work.title)} · ${esc(work.place || '')}</p>
        <blockquote class="cast-quote">${esc(person.quote || '……')}</blockquote>
        <p class="cast-bio">${esc(person.bio)}</p>
        <div class="cast-tags">${(person.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="cast-rail">
          ${cast.map((item, index) => `<button class="cast-chip ${index === state.selectedCast ? 'is-active' : ''}" type="button" data-cast="${index}" aria-pressed="${index === state.selectedCast}">
            <span class="cast-chip-portrait">${castPhoto(item, true)}</span><span>${esc(item.name)}</span>
          </button>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderStoryPanel(work) {
    const text = getSynopsis(work);
    const paras = paragraphs(text);
    const storyHTML = paras.map((p, index) => index === 0
      ? `<p><span class="first-letter">${esc(Array.from(p)[0] || '')}</span>${esc(p.slice(1))}</p>`
      : `<p>${esc(p)}</p>`).join('');
    return `<div class="story-layout">
      <div class="story-main">
        <div class="story-head">
          <div class="story-head-left"><i></i>FULL SYNOPSIS / 剧情全文</div>
          ${state.storyEditing ? '' : `<button class="story-edit-btn" type="button" data-story-edit>${icon('edit', '')}编辑剧情</button>`}
        </div>
        <div class="story-text ${state.storyEditing ? 'is-hidden' : ''}" id="storyText">${storyHTML}</div>
        <div class="story-editor ${state.storyEditing ? 'is-open' : ''}">
          <textarea id="storyEditor" aria-label="编辑剧情梗概" maxlength="2600">${esc(text)}</textarea>
          <div class="story-editor-actions"><span class="hint">修改只保存在你的本地档案，不会覆盖原作。</span><div><button class="text-btn" type="button" data-story-cancel>取消</button><button class="btn btn-primary btn-small" type="button" data-story-save><span>保存剧情</span>${icon('check')}</button></div></div>
        </div>
      </div>
      <aside class="story-side">
        <span class="micro-label">ROUTE NOTES / 线索</span>
        <div class="story-route">${(work.timeline || []).map((item) => `<div class="route-item"><span class="route-label">${esc(item.label)}</span><p>${esc(item.text)}</p></div>`).join('')}</div>
        <div class="story-warning">${icon('lock')}<span>本页为世界书叙事摘要，并非原作文本。你可以按自己的世界线改写它。</span></div>
      </aside>
    </div>`;
  }

  function renderDetail() {
    const container = $('#workDetail');
    if (!container) return;
    const work = selectedWork();
    if (!work) {
      container.innerHTML = '<div class="work-detail-loading"><p>作品数据没有载入。</p></div>';
      return;
    }
    const saved = state.savedWorks.has(work.id);
    const activeTab = state.detailTab;
    container.innerHTML = `<div class="detail-surface">
      <div class="detail-backdrop">
        <div class="detail-backdrop-img" style="background-image:url('${esc(work.cover)}')"></div>
      </div>
      <div class="detail-topbar">
        <div class="detail-breadcrumb"><span>THE ARCHIVE</span><i></i><span>${esc(work.index || '00')}</span><i></i><b>${esc(work.title)}</b></div>
        <div class="detail-toolbar">
          <button class="save-work-btn ${saved ? 'is-saved' : ''}" type="button" data-save-work="${esc(work.id)}" aria-pressed="${saved}" aria-label="${saved ? '移除书签' : '加入书签'}">${icon('heart')}<span>${saved ? '已加入书签' : '加入书签'}</span></button>
          <button class="detail-shelf-btn" type="button" data-shelf-toggle aria-label="${state.archiveFocused ? '展开作品架' : '收起作品架'}" aria-expanded="${!state.archiveFocused}" aria-controls="library">${icon('arrow-left')}<span>作品架</span></button>
        </div>
      </div>
      <div class="detail-hero">
        <div class="detail-cover-wrap">
          <div class="detail-cover" style="background-image:url('${esc(work.cover)}')"><span class="detail-cover-no">${esc(work.index || '00')}</span></div>
          <div class="detail-cover-caption">${esc(work.jp || '')}<br>GALWORLD ARCHIVE</div>
        </div>
        <div class="detail-hero-copy">
          <span class="detail-kicker"><i></i>${esc(work.kicker || 'A WORLD TO REMEMBER')}</span>
          <h2 class="detail-title">${esc(work.title)}</h2>
          <p class="detail-jp">${esc(work.jp || work.place || '')}</p>
          <p class="detail-tagline">${esc(work.tagline || '')}</p>
          <p class="detail-intro">${esc(work.intro || '')}</p>
          <div class="detail-meta-row">
            <span class="detail-meta">${icon('location')}${esc(work.place || '未定地点')}</span>
            <span class="detail-meta">${icon('clock')}${esc(work.era || '2018')}</span>
            <span class="detail-meta">${icon('user')}${(work.cast || []).length} 位人物档案</span>
          </div>
          <div class="detail-tags">${(work.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
          <div class="detail-actions">
            <button class="btn btn-primary" type="button" data-start-work="${esc(work.id)}"><span>从这里开局</span><span class="btn-icon">${icon('play')}</span></button>
            <button class="save-work-btn ${saved ? 'is-saved' : ''}" type="button" data-save-work="${esc(work.id)}" aria-pressed="${saved}">${icon('heart')}<span>${saved ? '已收藏' : '收藏此世界'}</span></button>
          </div>
        </div>
      </div>
      <div class="detail-tabs" role="tablist" aria-label="作品详情导航">
        <button class="detail-tab ${activeTab === 'overview' ? 'is-active' : ''}" type="button" role="tab" id="detail-tab-overview" aria-controls="detail-panel-overview" tabindex="${activeTab === 'overview' ? '0' : '-1'}" aria-selected="${activeTab === 'overview'}" data-detail-tab="overview">作品导览</button>
        <button class="detail-tab ${activeTab === 'cast' ? 'is-active' : ''}" type="button" role="tab" id="detail-tab-cast" aria-controls="detail-panel-cast" tabindex="${activeTab === 'cast' ? '0' : '-1'}" aria-selected="${activeTab === 'cast'}" data-detail-tab="cast">人物 <small>${pad((work.cast || []).length)}</small></button>
        <button class="detail-tab ${activeTab === 'story' ? 'is-active' : ''}" type="button" role="tab" id="detail-tab-story" aria-controls="detail-panel-story" tabindex="${activeTab === 'story' ? '0' : '-1'}" aria-selected="${activeTab === 'story'}" data-detail-tab="story">剧情 <small>FULL</small></button>
      </div>
      <div class="detail-panels">
        <div class="detail-panel ${activeTab === 'overview' ? 'is-active' : ''}" id="detail-panel-overview" role="tabpanel" aria-labelledby="detail-tab-overview">${renderOverviewPanel(work)}</div>
        <div class="detail-panel ${activeTab === 'cast' ? 'is-active' : ''}" id="detail-panel-cast" role="tabpanel" aria-labelledby="detail-tab-cast">${renderCastPanel(work)}</div>
        <div class="detail-panel ${activeTab === 'story' ? 'is-active' : ''}" id="detail-panel-story" role="tabpanel" aria-labelledby="detail-tab-story">${renderStoryPanel(work)}</div>
      </div>
    </div>`;
  }

  function handleDetailClick(event) {
    const tab = event.target.closest('[data-detail-tab]');
    if (tab) {
      state.detailTab = tab.getAttribute('data-detail-tab');
      state.storyEditing = false;
      renderDetail();
      return;
    }
    const cast = event.target.closest('[data-cast]');
    if (cast) {
      state.selectedCast = Number(cast.getAttribute('data-cast')) || 0;
      renderDetail();
      return;
    }
    const shelf = event.target.closest('[data-shelf-toggle]');
    if (shelf) {
      if (state.archiveFocused) {
        expandShelf();
        renderDetail();
        setTimeout(() => $('.work-card.is-selected')?.focus(), 360);
      } else {
        state.archiveFocused = true;
        syncShelfState();
        renderDetail();
        setTimeout(() => $('.spine-thumb.is-selected')?.focus(), 300);
      }
      return;
    }
    const save = event.target.closest('[data-save-work]');
    if (save) {
      const id = save.getAttribute('data-save-work');
      if (state.savedWorks.has(id)) {
        state.savedWorks.delete(id);
        toast('已从书签中移除。', 'heart');
      } else {
        state.savedWorks.add(id);
        toast('已收入你的私人书签。', 'heart');
      }
      saveJSON(STORE.saved, [...state.savedWorks]);
      renderDetail();
      return;
    }
    const start = event.target.closest('[data-start-work]');
    if (start) {
      startFromWork(start.getAttribute('data-start-work'));
      return;
    }
    if (event.target.closest('[data-story-edit]')) {
      state.storyEditing = true;
      renderDetail();
      setTimeout(() => $('#storyEditor')?.focus(), 40);
      return;
    }
    if (event.target.closest('[data-story-cancel]')) {
      state.storyEditing = false;
      renderDetail();
      return;
    }
    if (event.target.closest('[data-story-save]')) {
      const work = selectedWork();
      const editor = $('#storyEditor');
      if (!work || !editor) return;
      const text = editor.value.trim();
      if (!text) { toast('剧情梗概不能留空。', 'spark'); return; }
      state.storyOverrides[work.id] = text;
      saveJSON(STORE.stories, state.storyOverrides);
      state.storyEditing = false;
      renderDetail();
      toast('剧情梗概已保存到本地。', 'check');
      return;
    }
  }

  function handleDetailKeydown(event) {
    const activeTab = event.target.closest('.detail-tab');
    if (activeTab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const tabs = $$('.detail-tab');
      let index = tabs.indexOf(activeTab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = tabs.length - 1;
      const next = tabs[index];
      if (next) {
        state.detailTab = next.getAttribute('data-detail-tab');
        state.storyEditing = false;
        renderDetail();
        setTimeout(() => {
          const target = $$('.detail-tab').find((tab) => tab.getAttribute('data-detail-tab') === state.detailTab);
          target?.focus();
        }, 30);
      }
      return;
    }
    if (event.target.id === 'storyEditor') {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        $('[data-story-save]')?.click();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        state.storyEditing = false;
        renderDetail();
        setTimeout(() => $('[data-story-edit]')?.focus(), 30);
      }
    }
  }

  function startFromWork(id) {
    state.openingWork = id;
    state.sceneTab = 'work';
    const work = workById(id);
    state.sceneId = (work.openings && work.openings[0] && work.openings[0].id) || '';
    saveJSON(STORE.opening, { workId: id, sceneTab: state.sceneTab, sceneId: state.sceneId });
    navigate('opening');
  }

  /* ---------- World console ---------- */
  function setupConsole() {
    const grid = $('#channelGrid');
    if (grid) {
      grid.addEventListener('click', handleChannelClick);
      grid.addEventListener('input', handleChannelInput);
      grid.addEventListener('change', (event) => {
        if (event.target.matches('.range-input')) saveSettings();
      });
      grid.addEventListener('toggle', (event) => {
        const details = event.target;
        if (!details.matches || !details.matches('.channel-cast')) return;
        const channel = details.closest('[data-channel]');
        if (!channel) return;
        const id = channel.getAttribute('data-channel');
        if (details.open) state.openChannels.add(id);
        else state.openChannels.delete(id);
      }, true);
    }
    $$('[data-master]').forEach((button) => button.addEventListener('click', handleMaster));
    const reset = $('#resetConsole');
    if (reset) {
      reset.addEventListener('click', () => {
        if (!state.resetArmed) {
          state.resetArmed = true;
          reset.innerHTML = `${icon('refresh')}<span>再点一次确认</span>`;
          toast('再点一次，就会恢复初始世界设置。', 'spark');
          setTimeout(() => {
            state.resetArmed = false;
            reset.innerHTML = `${icon('refresh')}<span>恢复初始</span>`;
          }, 3500);
          return;
        }
        state.resetArmed = false;
        state.settings = defaultSettings();
        saveSettings();
        renderChannels();
        refreshSummary();
        reset.innerHTML = `${icon('refresh')}<span>恢复初始</span>`;
        toast('世界已回到初始频率。', 'check');
      });
    }
  }

  function handleMaster(event) {
    const button = event.currentTarget;
    const key = button.getAttribute('data-master');
    if (!key) return;
    const ids = WORKS.map((work) => work.id);
    let allOn;
    if (key === 'enabled') allOn = ids.every((id) => state.settings[id].enabled);
    else if (key === 'plot') allOn = ids.every((id) => state.settings[id].plot);
    else allOn = ids.every((id) => state.settings[id].swap);
    ids.forEach((id) => {
      if (key === 'enabled') state.settings[id].enabled = !allOn;
      else if (key === 'plot') state.settings[id].plot = !allOn;
      else state.settings[id].swap = !allOn;
    });
    saveSettings();
    renderChannels();
    refreshSummary();
    toast(key === 'swap' ? (allOn ? '性转宇宙已关闭。' : '性转宇宙已开启。') : (allOn ? '已暂时关闭全部通道。' : '已接通全部通道。'), 'check');
  }

  function getSwappedCount(work) {
    const settings = state.settings[work.id];
    if (!settings) return 0;
    if (settings.swap) return (work.cast || []).length;
    return Object.values(settings.castSwap || {}).filter(Boolean).length;
  }

  function refreshSummary() {
    const worksOn = WORKS.filter((work) => state.settings[work.id]?.enabled).length;
    const plotsOn = WORKS.filter((work) => state.settings[work.id]?.enabled && state.settings[work.id]?.plot && PLOT_WORKS.has(work.id)).length;
    const swaps = WORKS.reduce((sum, work) => sum + getSwappedCount(work), 0);
    const totalCast = WORKS.reduce((sum, work) => sum + (work.cast || []).length, 0);
    const coherence = clamp(Math.round(48 + worksOn * 2.5 + plotsOn * 1.5 - swaps * .3), 31, 97);
    const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
    setText('#meterWorks', pad(worksOn));
    setText('#meterPlots', pad(plotsOn));
    setText('#meterSwaps', pad(swaps));
    const wBar = $('#meterWorksBar'), pBar = $('#meterPlotsBar'), sBar = $('#meterSwapsBar');
    if (wBar) wBar.style.width = `${WORKS.length ? (worksOn / WORKS.length) * 100 : 0}%`;
    if (pBar) pBar.style.width = `${WORKS.length ? (plotsOn / WORKS.length) * 100 : 0}%`;
    if (sBar) sBar.style.width = `${totalCast ? Math.min(100, (swaps / totalCast) * 100) : 0}%`;
    const ring = $('#coherenceRing');
    if (ring) ring.style.setProperty('--value', coherence);
    setText('#coherenceValue', String(coherence));
    const hints = coherence >= 88
      ? '世界线非常清晰。十一部作品的气压刚好平衡，故事会朝着你选择的方向慢慢聚拢。'
      : coherence >= 68
      ? '世界正在稳定运转。还有几条支线没有被点亮，也许该给它们一次机会。'
      : coherence >= 48
      ? '世界有些拥挤，也有些暧昧。这正是故事开始变得有趣的地方。'
      : '太多门同时开着，风会从所有方向吹进来。要不要先关掉几扇？';
    setText('#coherenceHint', hints);
    setText('#overviewMood', worksOn === 0 ? '世界安静得有些过分。' : worksOn >= 9 ? '门都开着。' : worksOn >= 4 ? '几盏灯，为你留着。' : '只留下最重要的入口。');
    const swapLabel = worksOn === 0 ? '所有通道静音' : `${worksOn} 个世界正在呼吸`;
    setText('#overviewTimestamp', swapLabel);
    $$('[data-master]').forEach((button) => {
      const key = button.getAttribute('data-master');
      const ids = WORKS.map((work) => work.id);
      const allOn = ids.length && ids.every((id) => {
        if (key === 'enabled') return state.settings[id].enabled;
        if (key === 'plot') return state.settings[id].plot;
        return state.settings[id].swap;
      });
      button.setAttribute('aria-pressed', String(!!allOn));
    });
    const openingWorks = $('#openingActiveWorks');
    const openingPlots = $('#openingActivePlots');
    if (openingWorks) openingWorks.textContent = String(worksOn);
    if (openingPlots) openingPlots.textContent = String(plotsOn);
    updateHomeCardStates();
    renderConsoleV2();
  }

  /* ── page 03 · world routing ───────────────────────────────── */
  function pushCityMode(enabled) {
    const bridge = (typeof config !== 'undefined' && config && config.onCityMode) || null;
    if (typeof bridge !== 'function') {
      return Promise.resolve({ ok: false, errors: ['当前环境没有世界书接口'], changed: 0, matched: 0 });
    }
    return Promise.resolve(bridge(!!enabled)).catch((error) => ({
      ok: false,
      errors: [String((error && error.message) || error)],
      changed: 0,
      matched: 0,
    }));
  }

  function consoleWorkCard(work, lane) {
    const tag = lane === 'plot' ? '剧情条目' : '原主角';
    return `<button class="console-work" type="button" data-console-work="${esc(work.id)}" data-lane="${esc(lane)}" aria-label="${esc(work.title)} · ${tag}">
      <span class="console-work-bg" style="background-image:url('${esc(work.cover)}')"></span>
      <span class="console-work-index">${esc(work.index || '00')}</span>
      <span class="console-work-tag">${tag}</span>
      <span class="console-work-title">${esc(work.title)}</span>
    </button>`;
  }

  function fillConsoleLane(selector, works, lane) {
    const grid = $(selector);
    if (!grid) return;
    if (!works.length) {
      grid.innerHTML = `<div class="console-empty"><b>还没有可用的作品</b><span>先到「作品」页启用作品，这里会自动出现对应封面。</span></div>`;
      return;
    }
    grid.innerHTML = works.map((work) => consoleWorkCard(work, lane)).join('');
  }

  /* ── 原主角调整（世界书三条 [主角] 条目的蓝灯 / 绿灯） ── */
  function normalizeBookEntries(raw) {
    let entries = raw;
    if (typeof entries === 'string') { try { entries = JSON.parse(entries); } catch (_) { return []; } }
    if (entries && !Array.isArray(entries) && entries.entries) entries = entries.entries;
    if (entries && !Array.isArray(entries) && typeof entries === 'object') entries = Object.values(entries);
    return Array.isArray(entries) ? entries : [];
  }
  function entryIsOn(entry) { if (!entry) return false; if (entry.disable === true) return false; if (entry.enabled === false) return false; return true; }
  function entryWithEnabled(entry, on) {
    return Object.assign({}, entry, { enabled: on, disable: !on });
  }
  function entryIsConstant(entry) {
    if (!entry) return false;
    if (entry.strategy && typeof entry.strategy.type === 'string') return entry.strategy.type === 'constant';
    return entry.constant === true;
  }
  function entryWithConstant(entry, on) {
    const out = Object.assign({}, entry);
    const st = (entry && entry.strategy && typeof entry.strategy === 'object') ? Object.assign({}, entry.strategy) : {};
    const wasVectorized = st.type === 'vectorized';
    st.type = on ? 'constant' : (wasVectorized ? 'vectorized' : 'selective');
    out.strategy = st;
    out.constant = on;
    out.enabled = true;
    out.disable = false;
    return out;
  }
  function entryWithSelective(entry, on, keys) {
    const out = Object.assign({}, entry);
    const st = (entry && entry.strategy && typeof entry.strategy === 'object') ? Object.assign({}, entry.strategy) : {};
    st.type = 'selective';
    if (keys) st.keys = keys.slice();
    out.strategy = st;
    out.constant = false;
    out.enabled = on;
    out.disable = !on;
    return out;
  }
  function protagonistModeOf(label) {
    if (/性转/.test(label)) return 'swap';
    if (/替换/.test(label)) return 'replace';
    if (/不存在/.test(label)) return 'absent';
    return '';
  }
  function protagonistMetaOfLabel(label) {
    const text = String(label || '');
    if (text.indexOf('[主角]') < 0) return null;
    for (let i = 0; i < PROTAGONISTS.length; i++) {
      if (text.indexOf(PROTAGONISTS[i].tag) >= 0) return PROTAGONISTS[i];
    }
    return null;
  }
  function protagonistModeLabel(mode) {
    return ({ swap: '性转为女生', replace: '<user>替换男主', absent: '本世界已不存在' })[mode] || '原设';
  }
  async function scanProtagonistModes() {
    const get = fn('getWorldbook');
    if (typeof get !== 'function') return null;
    let book = '';
    try { book = await locateBook(); } catch (_) {}
    if (!book) return null;
    let raw = null;
    try { raw = await Promise.resolve(get(book)); } catch (_) { return null; }
    const map = {};
    normalizeBookEntries(raw).forEach((entry) => {
      const label = entryLabel(entry);
      const meta = protagonistMetaOfLabel(label);
      const mode = protagonistModeOf(label);
      if (!meta || !mode) return;
      if (!entryIsOn(entry) || !entryIsConstant(entry)) return;
      map[meta.key] = mode;
    });
    return map;
  }
  async function refreshProtagonistStates(force) {
    const now = Date.now();
    if (!force && now - (state.protagonistScanAt || 0) < 1200) return;
    try {
      const map = await scanProtagonistModes();
      if (map) {
        const saved = loadJSON(STORE.protagonistModes, null);
        state.protagonistModes = Object.assign({}, DEFAULT_PROTAGONIST_MODES, (saved && typeof saved === 'object') ? saved : {}, map);
        state.protagonistScanAt = now;
        renderProtagonistLane();
      } else {
        state.protagonistScanAt = 0;
      }
    } catch (error) {
      state.protagonistScanAt = 0;
      console.warn('[GALWORLD] 读取原主角状态失败：', error);
    }
  }
  async function setProtagonistMode(key, mode) {
    const meta = PROTAGONISTS.find((item) => item.key === key);
    if (!meta) return;
    const update = fn('updateWorldbookWith');
    if (typeof update !== 'function') { console.warn('[GALWORLD] 原主角调整：没有世界书接口'); return; }
    const book = await locateBook();
    if (!book) { console.warn('[GALWORLD] 原主角调整：没能定位到世界书'); return; }
    const previousMode = state.protagonistModes[key] || '';
    state.protagonistModes[key] = mode;
    saveJSON(STORE.protagonistModes, state.protagonistModes);
    renderProtagonistLane();
    let matched = 0;
    let changed = 0;
    const mutate = (entries) => {
        const list = page2NormalizeEntries(entries);
        let uid = list.reduce((max, entry) => Math.max(max, Number(entry.uid) || 0), 0);
        let displayIndex = list.reduce((max, entry) => Math.max(max, Number(entry.displayIndex) || Number(entry.extensions && entry.extensions.display_index) || 0), 0);
        const variant = SWAP_VARIANTS[key];
        if (variant) {
          variant.next.forEach((comment) => {
            if (list.some((entry) => entryLabel(entry) === comment)) return;
            const content = SWAP_ENTRY_DATA[comment] || '';
            if (!content) return;
            uid += 1;
            displayIndex += 1;
            list.push({
              uid, name: comment, comment, content, enabled: false, disable: true,
              key: (SWAP_KEYS[comment] || []).slice(), keysecondary: [],
              strategy: { type: 'selective', keys: (SWAP_KEYS[comment] || []).slice(), keys_secondary: { keys: [], logic: 'and_any' }, scan_depth: null },
              position: { type: 'after_character_definition', role: 'system', depth: 4, order: 20 },
              order: 20, depth: 4, selective: true, constant: false,
              recursion: { prevent_incoming: true, prevent_outgoing: true },
              probability: 100, displayIndex
            });
          });
        }
        return list.map((entry) => {
          if (variant) {
            const label = entryLabel(entry);
            const isOld = variant.old.indexOf(label) >= 0;
            const isNew = variant.next.indexOf(label) >= 0;
            if (isOld || isNew) {
              matched += 1;
              const wantEnabled = mode === 'swap' ? isNew : (!mode ? isOld : false);
              const wantConstant = mode === 'swap' && isNew;
              const isEnabled = entryIsOn(entry);
              if (isEnabled !== wantEnabled || (isNew && entryIsConstant(entry) !== wantConstant)) {
                changed += 1;
                if (isNew) {
                  return entryWithSelective(entry, wantEnabled, SWAP_KEYS[entryLabel(entry)] || []);
                }
                return entryWithEnabled(entry, wantEnabled);
              }
              return entry;
            }
          }
          const label = entryLabel(entry);
       const found = protagonistMetaOfLabel(label);
       const foundMode = found ? protagonistModeOf(label) : '';
       if (found && found.key === key && foundMode) {
         matched += 1;
         const want = foundMode === mode;
         if (entryIsConstant(entry) === want && entryIsOn(entry)) return entry;
         changed += 1;
         return entryWithConstant(entry, want);
       }
       const charNames = PROTAGONIST_CHAR_NAMES[key] || [];
       if (charNames.some((name) => label.indexOf(name) >= 0)) {
         matched += 1;
         if (mode === 'replace' || mode === 'absent') {
           if (!entryIsOn(entry)) return entry;
           changed += 1;
           return entryWithEnabled(entry, false);
         }
         if ((!mode || mode === 'swap') && !entryIsOn(entry)) {
           changed += 1;
           return entryWithEnabled(entry, true);
         }
         return entry;
       }
       return entry;
        });
    };
    try {
      await update(book, mutate, { render: 'immediate' });
    } catch (error) {
      console.warn('[GALWORLD] 原主角调整写入失败，尝试整本替换：', error);
      const getBook = fn('getWorldbook');
      const replaceBook = fn('replaceWorldbook');
      if (typeof getBook !== 'function' || typeof replaceBook !== 'function') { state.protagonistModes[key] = previousMode; saveJSON(STORE.protagonistModes, state.protagonistModes); renderProtagonistLane(); return; }
      try {
        const current = normalizeBookEntries(await Promise.resolve(getBook(book)));
        await replaceBook(book, mutate(current), { render: 'immediate' });
      } catch (fallbackError) {
        console.warn('[GALWORLD] 原主角调整整本替换失败：', fallbackError);
        state.protagonistModes[key] = previousMode;
        saveJSON(STORE.protagonistModes, state.protagonistModes);
        renderProtagonistLane();
        return;
      }
    }
    if (!matched) {
      state.protagonistModes[key] = previousMode;
      saveJSON(STORE.protagonistModes, state.protagonistModes);
      renderProtagonistLane();
      console.warn('[GALWORLD] 原主角调整：没有找到对应的 [主角] 条目');
      return;
    }
    state.protagonistModes[key] = mode;
    saveJSON(STORE.protagonistModes, state.protagonistModes);
    state.protagonistScanAt = Date.now();
    renderProtagonistLane();
    console.info('[GALWORLD] 原主角调整', key, mode || 'original', changed + '/' + matched);
  }
  async function applyDefaultProtagonistModes() {
    const saved = loadJSON(STORE.protagonistModes, null);
    if (saved && typeof saved === 'object') return;
    for (const key of Object.keys(DEFAULT_PROTAGONIST_MODES)) {
      await setProtagonistMode(key, DEFAULT_PROTAGONIST_MODES[key]);
    }
  }

  function renderProtagonistLane() {
    const grid = $('#swapWorkGrid');
    if (!grid) return;
    const list = PROTAGONISTS.filter((meta) => (meta.workIds || [meta.workId]).some((id) => state.settings[id]?.enabled !== false));
    grid.innerHTML = list.map((meta) => {
      const work = WORK_MAP.get(meta.workId) || {};
      const ids = meta.workIds || [meta.workId];
      const enabled = ids.some((id) => state.settings[id] && state.settings[id].enabled !== false);
      const active = state.protagonistModes[meta.key] || '';
      const displayName = (active === 'swap' && meta.swapName) ? meta.swapName : meta.name;
      const art = (active === 'swap' && meta.swapArt) ? meta.swapArt : (PROTAGONIST_ART[meta.key] || '');
      const initial = Array.from(displayName || '?')[0] || '?';
      const face = art
        ? '<img src="' + esc(art) + '" alt="' + esc(displayName) + '" loading="lazy" decoding="async">'
        : '<b>' + esc(initial) + '</b>';
      const overlay = active === 'replace' ? '<span class="proto-overlay">' + esc('<user>设定替换主角') + '</span>' : '';
      const modeLabels = { swap: '性转', replace: '替换', absent: '不存在' };
      const buttons = ['swap', 'replace', 'absent'].map((mode) => {
        if (!meta.modes || meta.modes.indexOf(mode) < 0) return '<span class="proto-mode is-empty" aria-hidden="true"></span>';
        const label = modeLabels[mode];
        return '<button class="proto-mode ' + (active === mode ? 'is-active' : '') + '" type="button" data-proto-work="' + esc(meta.key) + '" data-proto-mode="' + mode + '" aria-pressed="' + (active === mode) + '" ' + (enabled ? '' : 'disabled') + '><i></i><span>' + label + '</span></button>';
      }).join('');
      return '<article class="proto-card ' + (enabled ? '' : 'is-off ') + (active ? 'has-mode' : '') + '" style="--proto-accent:' + esc(work.accent || '#B03A4A') + ';--proto-accent2:' + esc(work.accent2 || work.accent || '#D9B36C') + '">'
        + '<div class="proto-portrait">' + face + overlay + '</div>'
        + '<div class="proto-body">'
        + '<div class="proto-head"><span class="proto-work">' + esc(meta.workTitle) + '</span><span class="proto-state">' + esc(protagonistModeLabel(active)) + '</span></div>'
        + '<div class="proto-name">' + esc(displayName) + '</div>'
        + '<div class="proto-modes" role="group" aria-label="' + esc(displayName) + ' 的原主角调整">' + buttons + '</div>'
        + '</div></article>';
    }).join('');
  }

  function allPlotWorks() {
    return WORKS.filter((work) => state.settings[work.id]?.enabled !== false && PLOT_WORKS.has(work.id));
  }

  function renderPlotLane(works) {
    const grid = $('#plotWorkGrid');
    if (!grid) return;
    const list = works || allPlotWorks();
    if (!list.length) {
      grid.innerHTML = '<div class="console-empty"><b>还没有可用的剧情线</b><span>先到「作品」页启用带 [大纲] 条目的作品。</span></div>';
      return;
    }
    grid.innerHTML = list.map((work) => {
      const on = !!state.plotRoutes[work.id];
      const workOn = state.settings[work.id]?.enabled !== false;
      return '<button class="console-work plot-work ' + (on ? 'is-on' : '') + (workOn ? '' : ' is-off ') + '" type="button" data-plot-work="' + esc(work.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? '关闭' : '开启') + '《' + esc(work.title) + '》的主线大纲">'
        + '<span class="console-work-bg" style="background-image:url(\'' + esc(work.cover) + '\')"></span>'
        + '<span class="console-work-index">' + esc(work.index || '00') + '</span>'
        + '<span class="console-work-tag">' + (on ? '主线进行中' : (workOn ? '未开启' : '作品未启用')) + '</span>'
        + '<span class="console-work-title">' + esc(work.title) + '</span>'
        + '</button>';
    }).join('');
  }

  async function refreshPlotRoutes(force) {
    const now = Date.now();
    if (!force && now - (state.plotScanAt || 0) < 1200) return;
    try {
      const sd = readStatData();
      if (!sd) { state.plotScanAt = 0; return; }
      const events = (sd['世界'] && sd['世界']['事件']) || {};
      const map = {};
      Object.keys(PLOT_ROUTES).forEach((id) => {
        const rec = events[PLOT_ROUTES[id]];
        map[id] = !!(rec && String(rec['状态'] || '') === '进行中');
      });
      const stale = Object.keys(PLOT_ROUTES).some((id) => {
        const rec = events[PLOT_ROUTES[id]];
        return !!(rec && String(rec['状态'] || '') !== '进行中');
      });
      if (stale) {
        await writeStatData((target) => {
          if (!target['世界'] || !target['世界']['事件']) return;
          const box = target['世界']['事件'];
          Object.keys(PLOT_ROUTES).forEach((id) => {
            const key = PLOT_ROUTES[id];
            if (box[key] && String(box[key]['状态'] || '') !== '进行中') delete box[key];
          });
          if (!Object.keys(box).length) delete target['世界']['事件'];
        });
      }
      state.plotRoutes = map;
      state.plotScanAt = now;
      renderPlotLane(allPlotWorks());
    } catch (error) {
      state.plotScanAt = 0;
      console.warn('[GALWORLD] 读取剧情路线失败：', error);
    }
  }

  async function setPlotRoute(workId, on) {
    const route = PLOT_ROUTES[workId];
    if (!route) return;
    state.plotRoutes[workId] = on;
    state.plotScanAt = Date.now();
    renderPlotLane(allPlotWorks());
    const result = await writeStatData((sd) => {
      if (!sd['世界']) sd['世界'] = {};
      if (!sd['世界']['事件']) sd['世界']['事件'] = {};
      const events = sd['世界']['事件'];
      if (on) {
        if (!events[route]) events[route] = {};
        events[route]['状态'] = '进行中';
      } else {
        delete events[route];
        if (!Object.keys(events).length) delete sd['世界']['事件'];
      }
    });
    if (!result) {
      state.plotRoutes[workId] = !on;
      renderPlotLane(allPlotWorks());
      console.warn('[GALWORLD] 剧情变量没有写入');
    } else {
      console.info('[GALWORLD] 剧情路线', workId, route, on ? '进行中' : '已删除');
    }
  }

async function selectPlotChapter(workId, chapterId) {
    const route = PLOT_ROUTES[workId];
    if (!route) return;
    state.plotRoutes[workId] = true;
    const result = await writeStatData((sd) => {
      if (!sd['世界']) sd['世界'] = {};
      if (!sd['世界']['事件']) sd['世界']['事件'] = {};
      const events = sd['世界']['事件'];
      /* 同一时间只允许一条主线带「阶段」：换作品时把它作作品的阶段清掉，
         状态仍然是「进行中」，只是不再指认章节。 */
      Object.keys(events).forEach((key) => {
        if (key === route) return;
        const rec = events[key];
        if (rec && typeof rec === 'object' && '阶段' in rec) delete rec['阶段'];
      });
      if (!events[route]) events[route] = {};
      events[route]['状态'] = '进行中';
      events[route]['阶段'] = chapterId;
    });
    if (!result) console.warn('[GALWORLD] 剧情章节变量没有写入');
    renderPlotLane(allPlotWorks());
    refreshPlotRoutes(true);
  }

function renderConsoleV2() {
    const modes = $('#consoleModes');
    if (modes) {
      Array.from(modes.querySelectorAll('[data-city-mode]')).forEach((button) => {
        const active = button.getAttribute('data-city-mode') === state.cityMode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    const note = $('#consoleModeNote');
    if (note) {
      note.textContent = state.cityMode === 'city'
        ? '联合都市：启用带 [联合都市] 的条目；剧情选择会开启对应作品主线。'
        : '作品模式：剧情选择会开启对应作品主线；原主角调整只作用于有原主角的作品。';
    }
    const protoSection = $('.console-box-protagonist');
    const protoGrid = $('#swapWorkGrid');
    const protoToggle = $('#protagonistToggle');
    if (protoSection) protoSection.classList.toggle('is-collapsed', !!state.protagonistCollapsed);
    if (protoGrid) protoGrid.hidden = !!state.protagonistCollapsed;
    if (protoToggle) {
      protoToggle.setAttribute('aria-expanded', String(!state.protagonistCollapsed));
      const label = protoToggle.querySelector('span');
      if (label) label.textContent = state.protagonistCollapsed ? '展开' : '收起';
    }
    renderPlotLane(allPlotWorks());
    renderProtagonistLane();
    refreshPlotRoutes();
    refreshProtagonistStates();
  }

  function setupConsoleV2() {
    const modes = $('#consoleModes');
    if (modes && !modes.dataset.bound) {
      modes.dataset.bound = '1';
      modes.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-city-mode]');
        if (!button) return;
        const mode = button.getAttribute('data-city-mode');
        if (mode === state.cityMode) return;
        state.cityMode = mode;
        saveJSON(STORE.cityMode, mode);
        renderConsoleV2();
        if (state.currentPage === 'final') renderFinalRecord();
        const enabled = mode === 'city';
        const result = await pushCityMode(enabled);
        if (!result || !result.ok) console.warn('[GALWORLD] 联合都市同步失败', result);
      });
    }
    const page = $('#page-console');
    if (page && page.dataset.galworldBound !== SCRIPT_VERSION) {
      page.dataset.galworldBound = SCRIPT_VERSION;
      page.addEventListener('click', (event) => {
        if (event.target.closest('#protagonistToggle')) {
          state.protagonistCollapsed = !state.protagonistCollapsed;
          renderConsoleV2();
          return;
        }
        const plot = event.target.closest('[data-plot-work]');
        if (plot) {
          const id = plot.getAttribute('data-plot-work');
          setPlotRoute(id, !state.plotRoutes[id]);
          return;
        }
        const proto = event.target.closest('[data-proto-mode]');
        if (proto) {
          const key = proto.getAttribute('data-proto-work');
          const mode = proto.getAttribute('data-proto-mode');
          const current = state.protagonistModes[key] || '';
          setProtagonistMode(key, current === mode ? '' : mode);
        }
      });
    }
  }

  function saveSettings() {
    saveJSON(STORE.settings, state.settings);
    const label = $('#consoleSaveText');
    if (label) label.textContent = `已保存 · ${clock()}`;
    const navLabel = $('#navSaveText');
    if (navLabel && state.currentPage === 'console') navLabel.textContent = '世界设置已保存';
    const stamp = $('.autosave-pill .save-dot');
    if (stamp) {
      stamp.style.background = 'var(--cyan)';
      stamp.style.boxShadow = '0 0 14px var(--cyan)';
    }
  }

  function renderChannels() {
    const grid = $('#channelGrid');
    if (!grid) return;
    grid.innerHTML = WORKS.map((work) => {
      const settings = state.settings[work.id] || defaultSettings()[work.id];
      const isOff = !settings.enabled;
      const swapped = getSwappedCount(work);
      return `<article class="channel ${isOff ? 'is-off' : 'is-on'}" data-channel="${esc(work.id)}" style="--channel-accent:${esc(work.accent)};--channel-accent2:${esc(work.accent2 || work.accent)}">
        <div class="channel-main">
          <div class="channel-head">
            <span class="channel-cover" style="background-image:url('${esc(work.cover)}')" aria-hidden="true"></span>
            <div class="channel-title-wrap">
              <span class="channel-index">CHANNEL ${esc(work.index || '00')} / ${pad(WORKS.length)}</span>
              <span class="channel-title">${esc(work.title)}</span>
              <span class="channel-sub">${esc(work.place || '')}</span>
            </div>
            <button class="power-btn" type="button" data-channel-power="${esc(work.id)}" aria-label="${isOff ? '接通' : '静音'}《${esc(work.title)}》" aria-pressed="${!isOff}">${icon('power')}</button>
          </div>
          <div class="channel-signal">
            <span class="signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span>${isOff ? 'SIGNAL LOST' : 'WORLD SIGNAL'}</span>
            <em>${isOff ? 'OFFLINE' : `${settings.intensity}%`}</em>
          </div>
          <div class="channel-controls">
            <button class="channel-toggle ${!isOff ? 'is-on' : ''}" type="button" data-toggle="enabled" data-id="${esc(work.id)}" aria-pressed="${!isOff}"><span>作品</span><b>${!isOff ? 'ON' : 'OFF'}</b></button>
            <button class="channel-toggle ${settings.plot ? 'is-on' : ''}" type="button" data-toggle="plot" data-id="${esc(work.id)}" aria-pressed="${!!settings.plot}"><span>剧情</span><b>${settings.plot ? 'FLOW' : 'HOLD'}</b></button>
            <button class="channel-toggle ${settings.swap ? 'is-on' : ''}" type="button" data-toggle="swap" data-id="${esc(work.id)}" aria-pressed="${!!settings.swap}"><span>性转</span><b>${settings.swap ? 'ALL' : 'OFF'}</b></button>
          </div>
          <div class="channel-slider-row">
            <label for="range-${esc(work.id)}">介入度</label>
            <span class="channel-slider-wrap"><input class="range-input" id="range-${esc(work.id)}" type="range" min="0" max="100" step="1" value="${settings.intensity}" data-range="${esc(work.id)}" style="--range-val:${settings.intensity}%" aria-label="《${esc(work.title)}》介入度"></span>
            <span class="channel-slider-val" id="range-val-${esc(work.id)}">${settings.intensity}</span>
          </div>
          <details class="channel-cast" ${state.openChannels.has(work.id) ? 'open' : ''}>
            <summary>角色性别调校 <span>${pad(swapped)} / ${pad((work.cast || []).length)} 性转</span></summary>
            <div class="cast-tune-list">
              ${(work.cast || []).map((person) => {
                const swappedOne = !!settings.swap || !!settings.castSwap?.[person.id];
                return `<div class="cast-tune"><span class="cast-tune-name">${esc(person.name)}</span><span class="cast-tune-role">${esc(person.role || '')}</span><button class="cast-gender-toggle ${swappedOne ? 'is-swapped' : ''}" type="button" data-cast-swap="${esc(person.id)}" data-id="${esc(work.id)}" aria-pressed="${swappedOne}"><i></i>${swappedOne ? '性转' : '原设'}</button></div>`;
              }).join('')}
            </div>
          </details>
        </div>
      </article>`;
    }).join('');
  }

  function handleChannelClick(event) {
    const power = event.target.closest('[data-channel-power]');
    if (power) {
      const id = power.getAttribute('data-channel-power');
      const settings = state.settings[id];
      settings.enabled = !settings.enabled;
      if (!settings.enabled) settings.plot = false;
      saveSettings();
      renderChannels();
      refreshSummary();
      renderWorkGrid();
      toast(settings.enabled ? '通道已接通。' : '通道已静音。', 'power');
      pushWorkWorldbook(id, settings.enabled);
      return;
    }
    const toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      const id = toggle.getAttribute('data-id');
      const key = toggle.getAttribute('data-toggle');
      const settings = state.settings[id];
      settings[key] = !settings[key];
      if (key === 'swap' && settings.swap) {
        // "全员性转" is a shortcut: clear individual overrides so the UI is consistent.
        Object.keys(settings.castSwap || {}).forEach((personId) => { settings.castSwap[personId] = false; });
      }
      if (key === 'enabled' && settings.enabled) settings.plot = true;
      if (key === 'plot' && settings.plot) settings.enabled = true;
      if (key === 'enabled' && !settings.enabled) settings.plot = false;
      saveSettings();
      renderChannels();
      refreshSummary();
      renderWorkGrid();
      if (key === 'enabled' || key === 'plot') {
        pushWorkWorldbook(id, settings.enabled).then((result) => {
          if (!result || !result.ok) console.warn('[GALWORLD] 世界书同步失败', result);
        });
      }
      return;
    }
    const castSwap = event.target.closest('[data-cast-swap]');
    if (castSwap) {
      const id = castSwap.getAttribute('data-id');
      const personId = castSwap.getAttribute('data-cast-swap');
      const settings = state.settings[id];
      if (settings.swap) {
        // Convert the all-cast state into per-character overrides, then flip the chosen one.
        settings.swap = false;
        Object.keys(settings.castSwap || {}).forEach((key) => { settings.castSwap[key] = true; });
      }
      settings.castSwap[personId] = !settings.castSwap[personId];
      saveSettings();
      renderChannels();
      refreshSummary();
      return;
    }
  }

  function handleChannelInput(event) {
    const range = event.target.closest('[data-range]');
    if (!range) return;
    const id = range.getAttribute('data-range');
    const value = clamp(Number(range.value) || 0, 0, 100);
    state.settings[id].intensity = value;
    range.style.setProperty('--range-val', `${value}%`);
    const val = $(`#range-val-${id}`);
    if (val) val.textContent = String(value);
    const channel = range.closest('[data-channel]');
    const signal = channel ? channel.querySelector('.channel-signal em') : null;
    if (signal) signal.textContent = `${value}%`;
  }

  /* ---------- Persona ---------- */
  function fillPersonaInputs() {
    const p = state.persona;
    const set = (selector, value) => { const node = $(selector); if (node) node.value = value || ''; };
    set('#pName', p.name);
    set('#pAge', p.age);
    set('#pIdentity', p.identity);
    set('#pBackground', p.background);
    set('#pAppearance', p.appearance);
    set('#pRoleCustom', p.roleTab === 'custom' ? p.roleName : '');
    syncPersonaToggle();
    renderPersonaTabs();
    renderPersonaRoleTabs();
    renderRoleGrid();
    updateCounts();
  }

  function syncPersonaToggle() {
    const button = $('#pCrossdress');
    if (!button) return;
    const on = !!state.persona.crossdress;
    button.setAttribute('aria-pressed', String(on));
    const label = button.querySelector('b');
    if (label) label.textContent = on ? '已勾选 · 女装入学' : '未勾选';
  }

  const BOND_SISTER_ROLE = {
    '新海天': '妹妹',
    '大藏里想奈': '妹妹',
    '真原祐里': '妹妹',
    '千原乃亚': '妹妹',
    '觋夕莉': '姐姐',
    '夏目蓝': '姐姐',
    '夏目雫': '妹妹',
    '空门苍': '姐姐',
    '冰见山玲': '妹妹',
    '茑町千岁': '姐姐',
    '柳木诗梦': '姐姐',
    '泉千夏': '姐姐',
    '泉子夏': '妹妹',
    '瓜生樱乃': '妹妹',
    '茅崎夕樱': '妹妹',
    '茶园那优花': '姐姐',
    '八乙女凉花': '妹妹'
  };
  function defaultCompanionFor(person) {
    const name = (person && person.name) || '';
    if (BOND_SISTER_ROLE[name]) return { relation: BOND_SISTER_ROLE[name], opening: '开局时在你身边' };
    if (BOND_CHILDHOOD.has(name)) return { relation: '青梅竹马', opening: '开局时在你身边' };
    return { relation: '同班同学', opening: '开局时在你身边' };
  }

    const BOND_GROUP_ORDER = ['姐妹', '青梅竹马', '大小姐', '其他'];
  const BOND_SISTERS = new Set(Object.keys(BOND_SISTER_ROLE));
  const BOND_CHILDHOOD = new Set(['二见原莉莉子', '御樱稟', '稻羽结衣', '夏目蓝', '川内野优美', '柳之濑凑']);
  const BOND_RICH = new Set(['岛越月望', '樱小路露娜', '天城咲夜', '九条都', '布琉艾特·妮科莱特·普朗凯特', '凤怜奈', '乌丸紫月', '苏菲缇雅', '西园寺风莉', '贵船柚子']);

  function bondGroupFor(person) {
    const name = person && person.name || '';
    if (BOND_SISTERS.has(name)) return '姐妹';
    if (BOND_CHILDHOOD.has(name)) return '青梅竹马';
    if (BOND_RICH.has(name)) return '大小姐';
    if (name !== '冰堂芹香' && /大小姐|千金|社长|会长|家主|公主|女仆长/.test(String(person.role || ''))) return '大小姐';
    return '其他';
  }

  function bondPeople() {
    return WORKS.filter((work) => state.settings[work.id]?.enabled !== false)
      .flatMap((work) => (work.cast || []).map((person) => ({ work, person })));
  }

  function selectedCompanions() {
    const chosen = state.persona.companions || {};
    return Object.keys(chosen).map((id) => {
      const found = findPersonById(id);
      if (!found || !workIsEnabled(found.work.id)) return null;
      const item = chosen[id] || defaultCompanionFor(found.person);
      return { work: found.work, person: found.person, item };
    }).filter(Boolean);
  }

  function renderCompanionSummary() {
    const list = selectedCompanions();
    const btn = $('#chooseCompanion');
    if (btn) btn.textContent = list.length ? `选择开局同伴（已选 ${list.length} 人）` : '选择开局同伴';
    const chipsHtml = list.length
      ? `<div class="companion-chips">${list.map(({ work, person, item }) => {
          const art = typeof CAST_ART !== 'undefined' ? CAST_ART[person.name] : null;
          const src = art && (art.normal || art.stage);
          const face = src ? `<img src="${esc(src)}" alt="" loading="lazy">` : esc(Array.from(person.name || '?')[0]);
          const rel = String(item.relation || '同伴').trim();
          const tip = `《${work.title}》 · ${item.opening || '开局时在你身边'}`;
          return `<span class="companion-chip" title="${esc(tip)}">
            <button class="companion-chip-main" type="button" data-companion-jump="${esc(person.id)}">
              <span class="companion-chip-face">${face}</span>
              <span class="companion-chip-copy"><b>${esc(person.name)}</b><small>${esc(rel)}</small></span>
            </button>
            <button class="companion-chip-del" type="button" data-companion-remove="${esc(person.id)}" aria-label="移出 ${esc(person.name)}" title="移出">×</button>
          </span>`;
        }).join('')}</div>`
      : '<p class="companion-empty">暂未选择开局同伴，点击上方按钮或切换至「羁绊」页添加。</p>';
    const html = `<div class="companion-box-head">
        <span class="companion-box-title"><span>已选开局同伴</span><span class="companion-box-count">共 ${list.length} 人</span></span>
        <span class="companion-box-actions">${list.length ? '<button class="companion-clear-btn" type="button" data-companion-clear>清空</button>' : ''}</span>
      </div>${chipsHtml}`;
    const selfBox = $('#selfCompanionBox');
    const bondBox = $('#bondCompanionBox');
    if (selfBox) selfBox.innerHTML = html;
    if (bondBox) bondBox.innerHTML = html;
  }

  function renderBondList() {
    renderCompanionSummary();
    const box = $('#bondList');
    if (!box) return;
    const catBox = $('#bondCats');
    const chosen = state.persona.companions || {};
    const all = bondPeople();
    if (!all.length) {
      if (catBox) catBox.innerHTML = '';
      box.innerHTML = '<div class="bond-empty">第二页还没有启用作品，先开启作品再选择同伴。</div>';
      return;
    }
    const current = BOND_GROUP_ORDER.includes(state.persona.bondCategory) ? state.persona.bondCategory : '姐妹';
    state.persona.bondCategory = current;
    if (catBox) {
      catBox.innerHTML = BOND_GROUP_ORDER.map((group) => {
        const count = all.filter(({ person }) => bondGroupFor(person) === group).length;
        return '<button class="bond-cat ' + (group === current ? 'is-active' : '') + '" type="button" data-bond-cat="' + esc(group) + '"><span>' + esc(group) + '</span><em>' + count + '</em></button>';
      }).join('');
    }
    const list = all.filter(({ person }) => bondGroupFor(person) === current).sort((a, b) => {
      if (current === '姐妹' && a.person.name === '新海天') return -1;
      if (current === '姐妹' && b.person.name === '新海天') return 1;
      return 0;
    });
    if (!list.length) {
      box.innerHTML = '<div class="bond-empty">这个分类下还没有角色。</div>';
      return;
    }
    box.innerHTML = list.map(({ work, person }) => {
      const active = !!chosen[person.id];
      const item = active ? chosen[person.id] : defaultCompanionFor(person);
      const art = typeof CAST_ART !== 'undefined' ? CAST_ART[person.name] : null;
      const src = art && (art.normal || art.stage);
      const face = src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : esc(Array.from(person.name || '?')[0]);
      return '<article class="bond-card ' + (active ? 'is-active' : '') + '" data-bond-row="' + esc(person.id) + '">' +
        '<div class="bond-card-portrait"><span class="bond-face">' + face + '</span></div>' +
        '<div class="bond-card-body"><span class="bond-card-work">' + esc(work.title) + '</span><b class="bond-card-name">' + esc(person.name) + '</b>' +
        '<div class="bond-card-fields"><input class="bond-input" type="text" maxlength="20" data-bond-relation="' + esc(person.id) + '" value="' + esc(item.relation) + '" placeholder="关系" ' + (active ? '' : 'disabled') + '><input class="bond-input" type="text" maxlength="60" data-bond-opening="' + esc(person.id) + '" value="' + esc(item.opening) + '" placeholder="开局内容" ' + (active ? '' : 'disabled') + '></div>' +
        (active ? '<span class="bond-pick is-on">已选中</span>' : '') + '</div>' +
      '</article>';
    }).join('');
  }

  function renderPersonaTabs() {
    const mode = ['self', 'bond', 'role'].includes(state.persona.mode) ? state.persona.mode : 'self';
    $$('#personaTabs [data-persona-mode]').forEach((button) => {
      const active = button.getAttribute('data-persona-mode') === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const self = $('#personaPanelSelf');
    const role = $('#personaPanelRole');
    const bond = $('#personaPanelBond');
    if (self) self.hidden = mode !== 'self';
    if (role) role.hidden = mode !== 'role';
    if (bond) bond.hidden = mode !== 'bond';
    const badge = $('#personaPreviewMode');
    if (badge) badge.textContent = mode === 'role' ? 'ROLE · 原著角色' : mode === 'bond' ? 'BOND · 开局同伴' : 'SELF · 自我';
    renderBondList();
  }

  function renderPersonaRoleTabs() {
    const tab = state.persona.roleTab === 'custom' ? 'custom' : 'select';
    $$('#roleTabs [data-role-tab]').forEach((button) => {
      const active = button.getAttribute('data-role-tab') === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const select = $('#rolePanelSelect');
    const custom = $('#rolePanelCustom');
    if (select) select.hidden = tab !== 'select';
    if (custom) custom.hidden = tab !== 'custom';
  }

  function renderRoleGrid() {
    const grid = $('#roleGrid');
    if (!grid) return;
    const works = WORKS.filter((work) => state.settings[work.id]?.enabled !== false);
    const rows = works.flatMap((work) => (work.cast || []).map((person) => ({ work, person })));
    const p = state.persona;
    if (!rows.length) {
      grid.innerHTML = '<div class="role-empty">第二页还没有启用作品。先去「作品」页打开至少一部，这里才会出现可选角色。</div>';
    } else {
      grid.innerHTML = rows.map(({ work, person }) => {
        const active = p.mode === 'role' && p.roleId === person.id;
        const art = CAST_ART[person.name];
        const src = art && (art.normal || art.stage);
        const initial = Array.from(person.name || '?')[0] || '?';
        return `<button class="role-pick ${active ? 'is-active' : ''}" type="button" data-role-id="${esc(person.id)}" data-role-work="${esc(work.id)}" aria-pressed="${active}" aria-label="扮演 ${esc(person.name)}，出自《${esc(work.title)}》">
          <span class="role-face">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" data-role-art="1">` : `<b>${esc(initial)}</b>`}</span>
          <span class="role-name">${esc(person.name)}</span>
          <span class="role-work">${esc(work.title)}</span>
        </button>`;
      }).join('');
    }
    const picked = $('#rolePicked');
    if (picked) {
      if (p.mode === 'role' && p.roleId) {
        const found = findRoleById(p.roleId);
        picked.innerHTML = found
          ? `当前扮演：<b>${esc(found.person.name)}</b> · 《${esc(found.work.title)}》<br>${esc(found.person.role || '')}`
          : '当前扮演：<b>自定义角色</b>';
      } else if (p.mode === 'role' && p.roleName.trim()) {
        picked.innerHTML = `当前扮演：<b>${esc(p.roleName.trim())}</b> · 原著主要角色之外的角色`;
      } else {
        picked.textContent = '还没有选择角色。点一个头像，或者在「自己填」里写一个名字。';
      }
    }
  }

  function setupPersona() {
    const page = $('#page-persona');
    if (!page) return;
    fillPersonaInputs();
    updatePersonaPreview();
    $('#personaTabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-persona-mode]');
      if (!button) return;
      const nextMode = button.getAttribute('data-persona-mode');
      state.persona.mode = ['self', 'bond', 'role'].includes(nextMode) ? nextMode : 'self';
      renderPersonaTabs();
      renderRoleGrid();
      updatePersonaPreview();
      schedulePersonaSave();
    });
    $('#roleTabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-role-tab]');
      if (!button) return;
      const tab = button.getAttribute('data-role-tab') === 'custom' ? 'custom' : 'select';
      state.persona.roleTab = tab;
      if (tab === 'custom') {
        state.persona.mode = 'role';
        state.persona.roleId = '';
        state.persona.roleWork = '';
        state.persona.roleName = ($('#pRoleCustom')?.value || '').trim();
      } else if (!state.persona.roleId) {
        state.persona.roleName = '';
      }
      renderPersonaRoleTabs();
      renderRoleGrid();
      updatePersonaPreview();
      schedulePersonaSave();
    });
    $('#roleGrid')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-role-id]');
      if (!button) return;
      const found = findRoleById(button.getAttribute('data-role-id'));
      if (!found) return;
      state.persona.mode = 'role';
      state.persona.roleTab = 'select';
      state.persona.roleId = found.person.id;
      state.persona.roleWork = found.work.id;
      state.persona.roleName = found.person.name;
      renderPersonaTabs();
      renderPersonaRoleTabs();
      renderRoleGrid();
      updatePersonaPreview();
      schedulePersonaSave();
      toast(`已选择扮演《${found.work.title}》的 ${found.person.name}。`, 'check');
    });
    $('#pRoleCustom')?.addEventListener('input', (event) => {
      state.persona.mode = 'role';
      state.persona.roleTab = 'custom';
      state.persona.roleId = '';
      state.persona.roleWork = '';
      state.persona.roleName = event.target.value;
      renderRoleGrid();
      updatePersonaPreview();
      schedulePersonaSave();
    });
    const bindSelfInput = (selector, key) => {
      const input = $(selector);
      if (!input) return;
      input.addEventListener('input', (event) => {
        state.persona[key] = event.target.value;
        markPersonaDraft();
        updateCounts();
        updatePersonaPreview();
        schedulePersonaSave();
      });
    };
    bindSelfInput('#pName', 'name');
    bindSelfInput('#pAge', 'age');
    bindSelfInput('#pIdentity', 'identity');
    bindSelfInput('#pBackground', 'background');
    bindSelfInput('#pAppearance', 'appearance');
    $('#pCrossdress')?.addEventListener('click', () => {
      state.persona.crossdress = !state.persona.crossdress;
      syncPersonaToggle();
      updatePersonaPreview();
      schedulePersonaSave();
    });
    $('#chooseCompanion')?.addEventListener('click', () => {
      state.persona.mode = 'bond';
      renderPersonaTabs();
      renderBondList();
      const scroller = $('.persona-v2-scroll');
      if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('#bondCats')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-bond-cat]');
      if (!button) return;
      state.persona.bondCategory = button.getAttribute('data-bond-cat');
      renderBondList();
      schedulePersonaSave();
    });
    $('#bondList')?.addEventListener('click', (event) => {
      if (event.target.closest('.bond-input')) return;
      const row = event.target.closest('[data-bond-row]');
      if (!row) return;
      const id = row.getAttribute('data-bond-row');
      const found = findPersonById(id);
      if (!found) return;
      state.persona.companions = state.persona.companions || {};
      if (state.persona.companions[id]) delete state.persona.companions[id];
      else state.persona.companions[id] = defaultCompanionFor(found.person);
      renderBondList();
      updatePersonaPreview();
      schedulePersonaSave();
    });
    page.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-companion-remove]');
      if (remove) {
        const id = remove.getAttribute('data-companion-remove');
        if (state.persona.companions && state.persona.companions[id]) {
          delete state.persona.companions[id];
          renderBondList();
          updatePersonaPreview();
          schedulePersonaSave();
        }
        return;
      }
      if (event.target.closest('[data-companion-clear]')) {
        state.persona.companions = {};
        renderBondList();
        updatePersonaPreview();
        schedulePersonaSave();
        return;
      }
      const jump = event.target.closest('[data-companion-jump]');
      if (jump) {
        const id = jump.getAttribute('data-companion-jump');
        const found = findPersonById(id);
        if (!found) return;
        state.persona.mode = 'bond';
        state.persona.bondCategory = bondGroupFor(found.person);
        renderPersonaTabs();
        const card = $$('#bondList [data-bond-row]').find((el) => el.getAttribute('data-bond-row') === id);
        if (card) card.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'center' });
      }
    });
    $('#bondList')?.addEventListener('input', (event) => {
      const relation = event.target.closest('[data-bond-relation]');
      const opening = event.target.closest('[data-bond-opening]');
      const node = relation || opening;
      if (!node) return;
      const id = node.getAttribute(relation ? 'data-bond-relation' : 'data-bond-opening');
      if (!state.persona.companions || !state.persona.companions[id]) return;
      state.persona.companions[id][relation ? 'relation' : 'opening'] = String(node.value || '');
      renderCompanionSummary();
      schedulePersonaSave();
    });
    $('#savePersona')?.addEventListener('click', () => {
      savePersonaNow();
      toast('人物档案已保存。', 'save');
    });
    $('#clearPersona')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      if (!state.clearArmed) {
        state.clearArmed = true;
        button.textContent = '再点一次清空';
        setTimeout(() => { state.clearArmed = false; button.textContent = '清空档案'; }, 3200);
        return;
      }
      state.clearArmed = false;
      button.textContent = '清空档案';
      state.persona = defaultPersona();
      fillPersonaInputs();
      updatePersonaPreview();
      savePersonaNow();
      toast('人物档案已清空。', 'refresh');
    });
  }

  function bindChoiceGroup(selector, key, onChange) {
    const group = $(selector);
    if (!group) return;
    group.addEventListener('click', (event) => {
      const button = event.target.closest('[data-' + key + ']');
      if (!button) return;
      const value = button.getAttribute('data-' + key);
      onChange(value);
      $$('[data-' + key + ']', group).forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-checked', String(active));
      });
    });
  }

  function syncChoices() {
    $$('#swatchRow [data-color]').forEach((button) => {
      const active = button.getAttribute('data-color') === state.persona.color;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    $$('#variantRow [data-variant]').forEach((button) => {
      const active = button.getAttribute('data-variant') === String(state.persona.variant);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
  }

  function renderIdentitySuggestions() {
    const box = $('#identitySuggestions');
    if (!box) return;
    const list = (DATA.identitySuggestions || ['学生', '转学生', '见习生', '图书委员', '打工者', '自由职业']).slice(0, 8);
    box.innerHTML = list.map((item) => `<button class="suggestion-chip" type="button" data-identity="${esc(item)}">${esc(item)}</button>`).join('');
  }

  let personaSaveTimer = 0;
  function schedulePersonaSave() {
    const label = $('#personaSaveText');
    if (label) label.textContent = '正在保存…';
    clearTimeout(personaSaveTimer);
    personaSaveTimer = setTimeout(() => savePersonaNow(true), 520);
  }
  function savePersonaNow(silent = false) {
    saveJSON(STORE.persona, state.persona);
    const label = $('#personaSaveText');
    if (label) label.textContent = `已保存 · ${clock()}`;
    const nav = $('#navSaveText');
    if (nav) nav.textContent = '人物档案已保存';
    if (!silent) {
      const seal = $('#personaSeal');
      if (seal) { seal.classList.add('is-stamped'); seal.innerHTML = '已<br>盖印'; }
      const status = $('#personaStatusText');
      if (status) status.textContent = 'SEALED';
    }
  }

  function markPersonaDraft() {
    const seal = $('#personaSeal');
    if (seal) { seal.classList.remove('is-stamped'); seal.innerHTML = '未<br>盖印'; }
    const status = $('#personaStatusText');
    if (status) status.textContent = 'DRAFT';
  }

  function updateCounts() {
    $$('[data-count-for]').forEach((node) => {
      const input = shadow.getElementById(node.getAttribute('data-count-for'));
      if (!input) return;
      const max = input.getAttribute('maxlength') || 0;
      node.textContent = `${input.value.length} / ${max}`;
    });
  }

  function updatePersonaPreview() {
    const p = state.persona;
    const info = personaPromptInfo();
    const card = $('#personaCard');
    if (card) { card.setAttribute('data-color', p.color); card.setAttribute('data-variant', p.variant); }
    const name = info.mode === 'role' ? (info.name || '原著角色') : (personaDisplayName() || '无名旅人');
    const initial = Array.from(name)[0] || '?';
    const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
    setText('#personaPreviewName', name);
    setText('#personaPreviewAge', p.mode === 'role' ? (info.work ? info.work.title : '原著角色') : (p.age.trim() || '年龄未定'));
    setText('#personaPreviewIdentity', info.identity || '身份未定');
    setText('#personaPreviewBackground', info.background || '你还没有写下背景。世界正在等你留下第一句话。');
    setText('#personaPreviewMode', p.mode === 'role' ? 'ROLE · 原著角色' : 'SELF · 自我');
    const initialNode = $('#personaInitial');
    if (initialNode) initialNode.textContent = initial.toUpperCase();
    const tags = [];
    if (p.mode === 'role') {
      if (info.work) tags.push(info.work.title);
      tags.push('原著角色');
    } else {
      if (p.identity.trim()) tags.push(p.identity.trim().split(/[·/／，,\s]/)[0].slice(0, 8));
      if (p.age.trim()) tags.push(`${p.age.trim()} 岁`);
      tags.push(p.name.trim() ? '等待入场' : '新面孔');
    }
    const tagBox = $('#personaPreviewTags');
    if (tagBox) tagBox.innerHTML = tags.slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join('');
    const cross = $('#personaPreviewCross');
    if (cross) cross.hidden = !p.crossdress;
    let percent = 0;
    if (p.mode === 'role') {
      percent = (p.roleId || p.roleName.trim()) ? 100 : 0;
    } else {
      const fields = [p.name, p.age, p.identity, p.background, p.appearance];
      const filled = fields.filter((value) => String(value || '').trim()).length;
      percent = Math.round((filled / fields.length) * 100);
    }
    setText('#completionValue', String(percent));
    const ring = $('#completionRing');
    if (ring) ring.style.setProperty('--value', percent);
    const miniAvatar = $('#openingMiniAvatar');
    if (miniAvatar) miniAvatar.textContent = initial.toUpperCase();
    setText('#openingPersonaName', name || '尚未创建');
    setText('#cinemaAvatar', initial.toUpperCase());
    setText('#cinemaPersonaName', name);
    updateOpeningMeta();
    if (state.currentPage === 'final') renderFinalRecord();
  }

  /* ---------- Opening ---------- */
  /* ── page 05 · opening sources ─────────────────────────────── */
  const PLOT_CHAPTERS = {
  "tsuki": [
    {
      "id": "序章",
      "title": "序章：樱公馆的面试"
    },
    {
      "id": "第一章",
      "title": "第一章：女仆的第一周"
    },
    {
      "id": "第二章",
      "title": "第二章：菲利亚的开学典礼"
    },
    {
      "id": "第三章",
      "title": "第三章：版型师"
    },
    {
      "id": "第四章",
      "title": "第四章：校长室的那一天"
    },
    {
      "id": "第五章",
      "title": "第五章：夏天泳池与菲利展"
    },
    {
      "id": "第六章",
      "title": "第六章：三个点子"
    },
    {
      "id": "第七章",
      "title": "第七章：缝制的日与夜"
    },
    {
      "id": "第八章",
      "title": "第八章：教室里的那场投诉"
    },
    {
      "id": "第九章",
      "title": "第九章：文化祭之后"
    },
    {
      "id": "第十章",
      "title": "第十章：校长室的对峙"
    },
    {
      "id": "第十一章",
      "title": "第十一章：菲利展"
    }
  ],
  "kaoru": [
    {
      "id": "序章",
      "title": "序章：天城家的委托"
    },
    {
      "id": "第一章",
      "title": "第一章：舞城的变装"
    },
    {
      "id": "第二章",
      "title": "第二章：淑女们的餐桌"
    },
    {
      "id": "第三章",
      "title": "第三章：副会长的午饭"
    },
    {
      "id": "第四章",
      "title": "第四章：同一天的两个祭典"
    },
    {
      "id": "第五章",
      "title": "第五章：欢迎会与舞蹈祭"
    },
    {
      "id": "第六章",
      "title": "第六章：祭典前的每一天"
    },
    {
      "id": "第七章",
      "title": "第七章：副会长的申请书"
    },
    {
      "id": "第八章",
      "title": "第八章：保持距离的三天"
    },
    {
      "id": "第九章",
      "title": "第九章：学生会室的夜晚"
    },
    {
      "id": "第十章",
      "title": "第十章：欢迎会与舞踏祭"
    }
  ],
  "fly": [
    {
      "id": "序章",
      "title": "序章：值日的早晨"
    },
    {
      "id": "第一章",
      "title": "第一章：冬假的第一封邮件"
    },
    {
      "id": "第二章",
      "title": "第二章：蛋糕与体重计"
    },
    {
      "id": "第三章",
      "title": "第三章：宾果的奖品"
    },
    {
      "id": "第四章",
      "title": "第四章：MAXX说出的真相"
    },
    {
      "id": "第五章",
      "title": "第五章：回到四天前"
    },
    {
      "id": "第六章",
      "title": "第六章：四个人的记忆"
    },
    {
      "id": "第七章",
      "title": "第七章：最后一块碎片"
    }
  ],
  "lemon": [
    {
      "id": "序章",
      "title": "序章：让出的那场街头Live"
    },
    {
      "id": "第一章",
      "title": "第一章：招新会上的突击Live"
    },
    {
      "id": "第二章",
      "title": "第二章：一句「不差」的曲子"
    },
    {
      "id": "第三章",
      "title": "第三章：最后一舞"
    },
    {
      "id": "第四章",
      "title": "第四章：立秋茶会"
    },
    {
      "id": "第五章",
      "title": "第五章：打扰了"
    },
    {
      "id": "第六章",
      "title": "第六章：双团Live"
    },
    {
      "id": "第七章",
      "title": "第七章：约会的约定"
    },
    {
      "id": "第八章",
      "title": "第八章：刻下来的印"
    },
    {
      "id": "第九章",
      "title": "第九章：失声"
    },
    {
      "id": "第十章",
      "title": "第十章：柠檬水之后"
    }
  ],
  "theo": [
    {
      "id": "序章",
      "title": "序章：二月的东京"
    },
    {
      "id": "第一章",
      "title": "第一章：向着巴黎"
    },
    {
      "id": "第二章",
      "title": "第二章：Maison·du·papillon"
    },
    {
      "id": "第三章",
      "title": "第三章：普朗凯特家的大小姐"
    },
    {
      "id": "第四章",
      "title": "第四章：本家的晚餐会"
    },
    {
      "id": "第五章",
      "title": "第五章：没有开学典礼的第一天"
    },
    {
      "id": "第六章",
      "title": "第六章：迪特琳德的邀请"
    },
    {
      "id": "第七章",
      "title": "第七章：一件衬衫的领子"
    },
    {
      "id": "第八章",
      "title": "第八章：看戏的那一天"
    },
    {
      "id": "第九章",
      "title": "第九章：平安夜"
    },
    {
      "id": "第十章",
      "title": "第十章：新年与本家的餐桌"
    },
    {
      "id": "第十一章",
      "title": "第十一章：被采用的纸样"
    },
    {
      "id": "第十二章",
      "title": "第十二章：冬假"
    },
    {
      "id": "第十三章",
      "title": "第十三章：夫人的车"
    },
    {
      "id": "第十四章",
      "title": "第十四章：露娜来到巴黎"
    },
    {
      "id": "第十五章",
      "title": "第十五章：曼彻斯特"
    },
    {
      "id": "第十六章",
      "title": "第十六章：被拿走的礼服"
    },
    {
      "id": "第十七章",
      "title": "第十七章：春假的缝制"
    },
    {
      "id": "第十八章",
      "title": "第十八章：菲利展"
    }
  ],
  "tsumi": [
    {
      "id": "序章",
      "title": "序章：退院的那一天"
    },
    {
      "id": "第一章",
      "title": "第一章：姐姐的规矩"
    },
    {
      "id": "第二章",
      "title": "第二章：游乐园的翘课生"
    },
    {
      "id": "第三章",
      "title": "第三章：圣卡塔丽娜的转学生"
    },
    {
      "id": "第四章",
      "title": "第四章：保健室的那个下午"
    },
    {
      "id": "第五章",
      "title": "第五章：闭门不出的冬天"
    },
    {
      "id": "第六章",
      "title": "第六章：文艺部的文化祭"
    },
    {
      "id": "第七章",
      "title": "第七章：镜子手里的注射器"
    },
    {
      "id": "第八章",
      "title": "第八章：两个人的圣诞"
    },
    {
      "id": "第九章",
      "title": "第九章：罪与罚"
    }
  ],
  "nine": [
    {
      "id": "序章",
      "title": "序章：门缝里的透明人"
    },
    {
      "id": "第一章",
      "title": "第一章：投山仙人之叶"
    },
    {
      "id": "第二章",
      "title": "第二章：梨俱吠陀的邀请"
    },
    {
      "id": "第三章",
      "title": "第三章：写在信上的名字"
    },
    {
      "id": "第四章",
      "title": "第四章：晚饭桌上的女帝"
    },
    {
      "id": "第五章",
      "title": "第五章：特异点"
    },
    {
      "id": "第六章",
      "title": "第六章：公园的夜"
    },
    {
      "id": "第七章",
      "title": "第七章：解不开的石头"
    },
    {
      "id": "第八章",
      "title": "第八章：成濑沙月来了"
    },
    {
      "id": "第九章",
      "title": "第九章：被忘记的人"
    },
    {
      "id": "第十章",
      "title": "第十章：面具与枪"
    },
    {
      "id": "第十一章",
      "title": "第十一章：初吻"
    },
    {
      "id": "第十二章",
      "title": "第十二章：明天也一起走"
    }
  ],
  "sakura": [
    {
      "id": "序章",
      "title": "序章：樱之森的葬礼"
    },
    {
      "id": "第一章",
      "title": "第一章：我回来了"
    },
    {
      "id": "第二章",
      "title": "第二章：秋千与第一张画"
    },
    {
      "id": "第三章",
      "title": "第三章：奇美拉的女仆"
    },
    {
      "id": "第四章",
      "title": "第四章：暑假的烩饭"
    },
    {
      "id": "第五章",
      "title": "第五章：教堂里的草稿"
    },
    {
      "id": "第六章",
      "title": "第六章：ZYPRESSEN之夜"
    },
    {
      "id": "第七章",
      "title": "第七章：上墙"
    },
    {
      "id": "第八章",
      "title": "第八章：樱花们的足迹"
    },
    {
      "id": "第九章",
      "title": "第九章：迷路"
    },
    {
      "id": "第十章",
      "title": "第十章：群像·秋天里的别人"
    },
    {
      "id": "第十一章",
      "title": "第十一章：群像·同样的秋天"
    },
    {
      "id": "第十二章",
      "title": "第十二章：奥林匹亚"
    },
    {
      "id": "第十三章",
      "title": "第十三章：火"
    },
    {
      "id": "第十四章",
      "title": "第十四章：不会消失的樱"
    },
    {
      "id": "第十五章",
      "title": "第十五章：千年樱"
    },
    {
      "id": "第十六章",
      "title": "第十六章：心是什么"
    },
    {
      "id": "第十七章",
      "title": "第十七章：摩尔公募展"
    },
    {
      "id": "第十八章",
      "title": "第十八章：香奈"
    },
    {
      "id": "第十九章",
      "title": "第十九章：幸福王子"
    },
    {
      "id": "第二十章",
      "title": "第二十章：四年后的教室"
    },
    {
      "id": "第二十一章",
      "title": "第二十一章：涂鸦"
    },
    {
      "id": "第二十二章",
      "title": "第二十二章：我们正好好地前行"
    }
  ],
  "summerpockets": [
    {
      "id": "序章",
      "title": "序章：渡轮与泳池"
    },
    {
      "id": "第一章",
      "title": "第一章：冰棒与灵弹"
    },
    {
      "id": "第二章",
      "title": "第二章：鸣濑家的柜子"
    },
    {
      "id": "第三章",
      "title": "第三章：神堂的两扇门"
    },
    {
      "id": "第四章",
      "title": "第四章：没有妈妈的孩子"
    },
    {
      "id": "第五章",
      "title": "第五章：带她回家"
    },
    {
      "id": "第六章",
      "title": "第六章：蝴蝶与记忆"
    }
  ],
  "tiannv2": [
    {
      "id": "序章",
      "title": "序章：新干线上的邻座"
    },
    {
      "id": "第一章",
      "title": "第一章：空着的课桌"
    },
    {
      "id": "第二章",
      "title": "第二章：没有宝物的少女"
    },
    {
      "id": "第三章",
      "title": "第三章：城白祭之前"
    },
    {
      "id": "第四章",
      "title": "第四章：城白祭"
    },
    {
      "id": "第五章",
      "title": "第五章：放学后的教室"
    },
    {
      "id": "第六章",
      "title": "第六章：恋人"
    },
    {
      "id": "第七章",
      "title": "第七章：雪与第一次"
    },
    {
      "id": "第八章",
      "title": "第八章：两个人的冬天"
    },
    {
      "id": "第九章",
      "title": "第九章：平安夜与圣诞节"
    },
    {
      "id": "第十章",
      "title": "第十章：鼓门前的父亲"
    },
    {
      "id": "第十一章",
      "title": "第十一章：生日、节分与樱花"
    }
  ],
  "tiannv25": [
    {
      "id": "序章",
      "title": "序章：雪国的候车室"
    },
    {
      "id": "第一章",
      "title": "第一章：轮椅与雪"
    },
    {
      "id": "第二章",
      "title": "第二章：雪屋里的电话"
    },
    {
      "id": "第三章",
      "title": "第三章：暴风雪中的小木屋"
    },
    {
      "id": "第四章",
      "title": "第四章：晚霞下的告白"
    },
    {
      "id": "第五章",
      "title": "第五章：跨年夜的一吻"
    },
    {
      "id": "第六章",
      "title": "第六章：午休的广播告白"
    },
    {
      "id": "第七章",
      "title": "第七章：重做的二年参"
    },
    {
      "id": "第八章",
      "title": "第八章：同一屋檐下"
    },
    {
      "id": "第九章",
      "title": "第九章：说出恋人的那天"
    }
  ],
  "tiannv3": [
    {
      "id": "序章",
      "title": "序章：乐乐浦寮的委托"
    },
    {
      "id": "第一章",
      "title": "第一章：海豹公主转学来了"
    },
    {
      "id": "第二章",
      "title": "第二章：主人大人与冰山姐姐"
    },
    {
      "id": "第三章",
      "title": "第三章：傍晚的直播"
    },
    {
      "id": "第四章",
      "title": "第四章：两个秘密与名人税"
    },
    {
      "id": "第五章",
      "title": "第五章：姐妹之间"
    },
    {
      "id": "第六章",
      "title": "第六章：由语与大福"
    },
    {
      "id": "第七章",
      "title": "第七章：期末考与违和感"
    },
    {
      "id": "第八章",
      "title": "第八章：只属于两人的祭典"
    },
    {
      "id": "第九章",
      "title": "第九章：第一次约会"
    },
    {
      "id": "第十章",
      "title": "第十章：摄影会"
    },
    {
      "id": "第十一章",
      "title": "第十一章：夏日课题"
    },
    {
      "id": "第十二章",
      "title": "第十二章：十年前的那场祭典"
    },
    {
      "id": "第十三章",
      "title": "第十三章：宇宙第一"
    }
  ],
  "yuanqi": [
    {
      "id": "序章",
      "title": "序章：宿舍的面试"
    },
    {
      "id": "第一章",
      "title": "第一章：楼妈的第一天"
    },
    {
      "id": "第二章",
      "title": "第二章：休息日与长颈鹿布偶"
    },
    {
      "id": "第三章",
      "title": "第三章：期末考试周"
    },
    {
      "id": "第四章",
      "title": "第四章：街道运动大会"
    },
    {
      "id": "第五章",
      "title": "第五章：夏日庆典的餐车"
    },
    {
      "id": "第六章",
      "title": "第六章：庆典当天的餐车"
    },
    {
      "id": "第七章",
      "title": "第七章：还清的债务"
    },
    {
      "id": "第八章",
      "title": "第八章：水上乐园"
    },
    {
      "id": "第九章",
      "title": "第九章：假面与告白"
    },
    {
      "id": "第十章",
      "title": "第十章：当着十万人的宣告"
    },
    {
      "id": "第十一章",
      "title": "第十一章：周末的约会"
    },
    {
      "id": "第十二章",
      "title": "第十二章：每天都要见"
    },
    {
      "id": "第十三章",
      "title": "第十三章：删不掉的视频"
    },
    {
      "id": "第十四章",
      "title": "第十四章：哥特萝莉与二人世界"
    },
    {
      "id": "第十五章",
      "title": "第十五章：流星雨与那个名字"
    }
  ],
  "chunbai": [
    {
      "id": "序章",
      "title": "序章：结女的第一周"
    },
    {
      "id": "第一章",
      "title": "第一章：两个人的班长"
    },
    {
      "id": "第二章",
      "title": "第二章：直呼其名"
    },
    {
      "id": "第三章",
      "title": "第三章：相合伞"
    },
    {
      "id": "第四章",
      "title": "第四章：请和我交往"
    },
    {
      "id": "第五章",
      "title": "第五章：请愿签名"
    },
    {
      "id": "第六章",
      "title": "第六章：雪白的前方"
    }
  ],
  "shuizang": [
    {
      "id": "序章",
      "title": "序章：赌场的梦与沙坑的少女"
    },
    {
      "id": "第一章",
      "title": "第一章：神经衰弱"
    },
    {
      "id": "第二章",
      "title": "第二章：垃圾场里的少女"
    },
    {
      "id": "第三章",
      "title": "第三章：人鱼的水葬银货"
    },
    {
      "id": "第四章",
      "title": "第四章：未明与烟火"
    },
    {
      "id": "第五章",
      "title": "第五章：大富豪"
    },
    {
      "id": "第六章",
      "title": "第六章：鸟笼"
    },
    {
      "id": "第七章",
      "title": "第七章：留宿会"
    },
    {
      "id": "第八章",
      "title": "第八章：快递员"
    },
    {
      "id": "第九章",
      "title": "第九章：眼泪与生日"
    },
    {
      "id": "第十章",
      "title": "第十章：夕樱的舞台"
    },
    {
      "id": "第十一章",
      "title": "第十一章：临死前的款待"
    },
    {
      "id": "第十二章",
      "title": "第十二章：毒苹果"
    },
    {
      "id": "第十三章",
      "title": "第十三章：选择夕樱"
    },
    {
      "id": "第十四章",
      "title": "第十四章：情人节"
    },
    {
      "id": "第十五章",
      "title": "第十五章：最后一局"
    }
  ],
  "linggan": [
    {
      "id": "序章",
      "title": "序章：抽签将军"
    },
    {
      "id": "第一章",
      "title": "第一章：天使降临"
    },
    {
      "id": "第二章",
      "title": "第二章：小田原评定"
    },
    {
      "id": "第三章",
      "title": "第三章：时薪一千日元"
    },
    {
      "id": "第四章",
      "title": "第四章：天使的休息"
    },
    {
      "id": "第五章",
      "title": "第五章：风纪委员"
    },
    {
      "id": "第六章",
      "title": "第六章：挑战者现身"
    },
    {
      "id": "第七章",
      "title": "第七章：温泉关战役"
    },
    {
      "id": "第八章",
      "title": "第八章：活动也是有起有落"
    },
    {
      "id": "第九章",
      "title": "第九章：约定之海"
    },
    {
      "id": "第十章",
      "title": "第十章：大地之子"
    },
    {
      "id": "第十一章",
      "title": "第十一章：睡颜"
    },
    {
      "id": "第十二章",
      "title": "第十二章：初次活动是什么时候"
    },
    {
      "id": "第十三章",
      "title": "第十三章：皮焦柔嫩"
    },
    {
      "id": "第十四章",
      "title": "第十四章：恋爱童贞综合症"
    },
    {
      "id": "第十五章",
      "title": "第十五章：家庭游戏"
    },
    {
      "id": "第十六章",
      "title": "第十六章：擅长绘画的人简直是妙手丹青"
    },
    {
      "id": "第十七章",
      "title": "第十七章：还不至于留下心理创伤"
    },
    {
      "id": "第十八章",
      "title": "第十八章：艰难困苦的御宅恋爱"
    },
    {
      "id": "第十九章",
      "title": "第十九章：第2学期出道大作战"
    },
    {
      "id": "第二十章",
      "title": "第二十章：千玉学园学生会企划会议"
    },
    {
      "id": "第二十一章",
      "title": "第二十一章：准备起飞"
    },
    {
      "id": "第二十二章",
      "title": "第二十二章：灵感满溢者的诗篇"
    },
    {
      "id": "第二十三章",
      "title": "第二十三章：怎么可能不喜欢你啊"
    }
  ],
  "zhishang": [
    {
      "id": "序章",
      "title": "序章：图书馆的第一夜"
    },
    {
      "id": "第一章",
      "title": "第一章：翡翠的排挤原理"
    },
    {
      "id": "第二章",
      "title": "第二章：天使的红线"
    },
    {
      "id": "第三章",
      "title": "第三章：白纸与蓝宝石"
    },
    {
      "id": "第四章",
      "title": "第四章：被世界遗忘的那十天"
    },
    {
      "id": "第五章",
      "title": "第五章：观星少女的幽灵"
    },
    {
      "id": "第六章",
      "title": "第六章：磷灰石的怠惰现象"
    },
    {
      "id": "第七章",
      "title": "第七章：黑榴石的死神花样"
    },
    {
      "id": "第八章",
      "title": "第八章：芙蓉石的长年隔绝"
    },
    {
      "id": "第九章",
      "title": "第九章：黑珍珠的求爱信号"
    },
    {
      "id": "第十章",
      "title": "第十章：回来的妹妹"
    },
    {
      "id": "第十一章",
      "title": "第十一章：白珍珠的泡沫爱慕"
    },
    {
      "id": "第十二章",
      "title": "第十二章：编造的幸福"
    },
    {
      "id": "第十三章",
      "title": "第十三章：黑曜石的因果目录"
    },
    {
      "id": "第十四章",
      "title": "第十四章：青金石的幻想图书馆"
    },
    {
      "id": "第十五章",
      "title": "第十五章：可喜可贺"
    }
  ],
  "lianai": [
    {
      "id": "序章",
      "title": "序章：假男友的第一单"
    },
    {
      "id": "第一章",
      "title": "第一章：恋人契约"
    },
    {
      "id": "第二章",
      "title": "第二章：第一次过夜"
    },
    {
      "id": "第三章",
      "title": "第三章：学习会与爱面子"
    },
    {
      "id": "第四章",
      "title": "第四章：两位同班同学"
    },
    {
      "id": "第五章",
      "title": "第五章：夏天的分岔口"
    },
    {
      "id": "第六章",
      "title": "第六章：小坏的约会"
    },
    {
      "id": "第七章",
      "title": "第七章：休战与发烧"
    },
    {
      "id": "第八章",
      "title": "第八章：进击的哟呼呼"
    },
    {
      "id": "第九章",
      "title": "第九章：坦诚这件事"
    },
    {
      "id": "第十章",
      "title": "第十章：河岸边的答复"
    },
    {
      "id": "第十一章",
      "title": "第十一章：第二次初次约会"
    },
    {
      "id": "第十二章",
      "title": "第十二章：爱面子的过去"
    },
    {
      "id": "第十三章",
      "title": "第十三章：与绘未的未来"
    },
    {
      "id": "第十四章",
      "title": "第十四章：约定之夏与海"
    }
  ]
};
  function openingMode() {
    return ['city', 'free', 'person', 'work', 'plot'].includes(state.openingMode) ? state.openingMode : 'city';
  }

  /* 剧情主线：每章的开场＝该章「事件01」的第二人称场景。 */
  const PLOT_CHAPTER_OPENINGS = {
    "chunbai": {
      "序章": "九月的最后一夜，街上的风已经带凉。你按着电话里断断续续的描述推算位置，让那边形容眼前能看到的东西。电话忽然换了个人：樱乃身边有一个同样迷路的女生，两人在半路碰上，之后互相搀着走了很久。对方接过电话自报姓名——濑名爱理，措词认真，声音里有一种威风凛凛的力道，和她那副还带着歉意的口气完全不搭。你让她们沿着灯一直走，自己停在公园的台阶旁不动。金桂的香味混在夜风里，路灯下有人在收摊。",
      "第一章": "长班会上要选班长。隼太先举手弃权，说自己学生会长的工作还没交接完，各务台那边时不时要回去打理，顺手就把你推了出去，理由说得冠冕堂皇。结女那边更快，安洁宣布已经全票通过，人选是濑名爱理。两个人几乎同时抗议。爱理喊得更大声：「为什么要和这种家伙一起行动啊……！」教室里的窗开着，风吹得讲台上的名册翻了两页。抗议无效，她自己也知道推举她的理由，最后只能认下来：「我知道了啦！我做就好了吧，对吧！！」",
      "第三章": "这一天压下来的是女子更衣室：备用品补充的手续、跟其他班分配上的协商、备用品的实际设置、还要听取全班女生的意见。课间的走廊里全是人，她抱着文件从教职员办公室跑回来，只来得及在门口说一句「我先走一步」，又转身出去，制服的下摆被风带起一下。你提出帮她，她说这一件从名字开始就不属于你能插手的范围，只把男生能做的部分分给你。上课铃响了两遍。她抱着那叠文件往楼梯口走，脚步很稳，一次也没有回头。",
      "第二章": "补习从那一晚开始就没停过。爱理家那间六叠的房间挤成了一间集会所，几个人围着矮桌，本子铺到榻榻米边上，灯是暖黄色的。十月二十四日，天羽学姐带来一个箱子，打开是蛋糕，上面插着蜡烛。所有人都愣住了。爱理猛地背过身去——那天是她的生日，而她一个字都没说过。她说这种事不值得庆祝，何况考试前不是干这种事的场合，声音和刚才完全不一样。你数了三下，大家一起开口。她背对着蜡烛，肩膀绷得很紧。",
      "第五章": "街上的圣诞装饰已经亮起来，彩灯绕在店门口的树上，一闪一闪。你说好十点结束，提前半小时就到了，站在店门外的墙边等，手插在口袋里。情侣一对一对地走过去，有人笑着从你旁边挤过。十点过五分，她从门里出来，围巾还没围好，说谢谢你肯陪她。她挽住你的手臂，说很快就到圣诞节了，有很多情侣在所以没关系——像是在给自己找一个正当的理由。玻璃门上的铃又响了一次。",
      "第六章": "早上醒来，你照旧走向窗户，手抬到半路，停在窗框上方。你站在那儿吸了一口气又吐出去，然后决定今天不开了。玻璃上有一层薄白，外面天还没全亮，院子里的空气是冷的那种蓝。樱乃正好推门进来，看见这一幕愣了一下，随即笑了，什么也没问，只把书包放在桌边，说早饭好了。你回过身，把那扇窗留在背后，走过去坐下。桌上那碗汤还在冒气，勺子搁在碟沿上，摆得很正。",
      "第四章": "天冷了，你早上照旧开窗换气，冷得发抖也不肯关。去教室的路上遇见爱理，她低着头，眼里带着忧愁。你身体先动了，一句「昨天对不起了」脱口而出，然后停不下来，连珠炮似的道歉。她越听脸越僵，手在书包带上收紧，最后转身走开。课间你一次次上去搭话，得到的都是沉默；午休你追在她身后，还在道歉。走廊上有人抱着板报侧身让了一下。她猛地回头：「别管我了！好好看看气氛啊！！」喊完就跑。"
    },
    "fly": {
      "序章": "梦里两只端着料理的兔子把食物送到你面前，说今天的菜和以往都不一样，你伸手的时候它们一起消失了。「起床了！　起床了！　早上了我的朋友！！」声音从床边桌上炸开，房间里却没有 MAXX 的影子——叫着的不是机器人，是那个闹钟，明明昨天还是普通的叮铃铃铃。你把开关按掉，房间重新安静下来，梦里那点没吃到嘴里的甜味也跟着散了。",
      "第一章": "叫醒你的不是闹钟。有人在戳你的脸，一边在耳边喊「你还好吗ー？莫西莫ー西」，近得能感觉到呼吸。你半睡半醒还拖着梦里最后那一段：嘴唇只是轻轻相叠，然后你说自己喜欢结衣喜欢到能飞越天空的程度。你伸手去摸闹钟，接着整个人弹起来——时间看上去完全迟到了。等把制服抓到手里你才想起，学校已经进入春假，于是又塌回床上。",
      "第七章": "「确实那天，是不是说做了些奇怪的梦？」结衣这一问，你脑子里咯的一声响——那天早上你确实做了个梦：你和结衣是双胞胎，父亲死了，连自己是从哪来的都分不清。「是我！我里面也有碎片！」「真的吗？」铃乃当场决定现在就去缭兰会宿舍。「我也去！我对自己的行动最有把握！」窗锁打开，「拜托了！抓住手！」她背后的羽翼全力扩大，风灌进耳朵里。",
      "第三章": "上午，学生会室角落的长桌上堆着一摞摞奖品纸箱，封条上写着编号，最上面那个已经被谁拆开了，露出一层报纸。「晶君，八重野前辈发来了宾果大会的奖品目录哟～」结衣拿着自己那份跑过来，把终端夹在腋下，一边对单子一边往箱子里看。「招牌奖品就是这个便携游戏机？」「虽然是同一种，不过却是刚刚发售的最新款模具。」你把记错的编号划掉，重写一遍。",
      "第二章": "午后，你在房间里滚来滚去，滚到有点困，索性闭了一会儿眼。走廊上传来一声几乎变调的悲鸣。你推开门，看见结衣坐在地上，穿的是兔女郎装——黑色的一件式，胸前还夹着一块蛋糕，从头发到腰都是生奶油和巧克力酱。两个托盘翻在旁边，一个奶油蛋糕一个巧克力蛋糕都摔得不成样子。「果然…双持蛋糕实在是过于无谋了吗……呜呜」",
      "第五章": "被人轻轻摇着身体，听见那个声音是铃乃的时候，你一口气就醒了。「啊，啊啊。那个，时间跳跃成功了吗？」「是的，现在，我们是在 3 月 20 日的早上。」结衣倒在旁边，被叫了两声才迷迷糊糊地站起来，问你们两人为什么在这里。屋顶上并没有其他人，往下看，校舍里连一个学生的影子也没有。你抓着结衣的手站起来：「首先先去离这里近的缭兰会室去吧。」",
      "第六章": "出了学生会室，你一个人在走廊里边跑边喊名字，天音、玖琉璃、茉百合，一个一个叫过去，回音比回答多。转过拐角撞上了人，抬头才看清是玖琉璃——脸唰白，眼睛里滚着眼泪。「……！不行……别追过来……！」她转身跑掉。你追进教室，她站在正中央，回头冲你喊了一声「晶」。「是我啊，玖琉璃！冷静一下，看着我！」你一遍一遍地重复。",
      "第四章": "清晨，叫醒你的是一种从低处传上来的、呜呜的怪声。和平常醒来的方式不一样，你只是模模糊糊地就那么睁开了眼，声音一直在响。这个时间 MAXX 应该早就在厨房里忙那台特大的春假蛋糕了，房间里不该有别人。你起身确认，它站在房间角落一动不动，叫它也没有反应，那声音是从它身体里面出来的。你转身就要冲出去把九条叫来，脚刚跨到门口，身后那声「等等！」尖锐地把你钉在原地。"
    },
    "kaoru": {
      "序章": "星期天的中午，天城家的厨房却乱成一团——原定十五位客人，早上临时变成二十位。你压着伊比利亚猪的火候，另一只手把平底锅转了个角度，普鲁旺斯鱼汤在锅里翻滚，龙虾壳在盘子上响。烤好的挞皮端上来，你把奇异果、菠萝、橙子一块一块摆上去，绿、红、橙，最后撒一层糖粉。「哇、在闪闪发光啊！」有人举着手机凑过来。",
      "第一章": "星期天的午后，你从巴士上下来，沿着两侧长满银杏的林荫道往校门走。校舍比想象中更古老，比起学校更像迎宾馆。约好碰面的天道八云不见人影，路上遇到的女生看你一眼就快步跑开。林荫道深处，一个被金色光辉裹着的少女站在树下：「您是哪位呢？　男性进入这里的话是需要许可的。您有许可么？」远处有人喊起来：「啊啊！　果然是刚才的！　咲夜大人，快离开。」你还没来得及解释，就有女生弯腰捡起一根银杏枝，朝你这边扔过来。",
      "第七章": "上午，音乐室的窗台上谱架歪着，地板打过蜡，走路要留神。几个人围着桌子摊开纸，朱里说装饰想过藤蔓花环、花卉装饰、手写海报，却定不下来。「要有舞城的特色，但又不拘泥于过去的形式。」你说完，乃亚忽然想起一件事：「我记得咲夜大人的父亲对设计方面很清楚呢，不能询问一下获得一些建议么？」咲夜把笔放下：「……这个很难做到呢。」",
      "第三章": "移动教室的课一结束，你就回到二年级教室，准备请咲夜一起吃饭。抬头才看见那张椅子的椅子被好好地收进去了，人不在。你提着便当袋绕到她的座位边，桌面干净得过分，连一点粉笔灰都没有。「啊咧……咲夜同学、没有回来么？」你回过头，夏目朱里正站在门口，看了看那张空椅子：「这段时间关系不是很好啊。」",
      "第九章": "约定的第三天，晚饭后。你在学生会室门前深呼吸了两次，才敲下去，报上名字。里面只回了一句「……门没锁，请进」。房间只开了靠窗那一侧的灯，白板上还写着开幕的倒计时，茶具都在原来的地方，连你惯用的那只杯子也空着放在桌边。她转过椅子，让出旁边的位置：「贵、贵安。」「是的、贵安。」你把门在身后轻轻带上。",
      "第二章": "入校第二天的早晨，你做完早饭，换上学生装出门，对着镜子把披肩的位置按了又按。路上，天城咲夜一个人走在前头，背挺得笔直，光是这样就已经像画一样。「咲夜同学，你、你好。莫非、接下来就要去学校？」她犹豫了一下，还是点了头。并肩走时你才发觉她比你矮一些，日光下头发像银丝，视线不知不觉落到她的鞋上：「真细呢。」",
      "第五章": "夜里，八云的房间只开了一盏灯。你说有事要讲，把带来的盒子放到矮桌上，小猫已经在里面睡着了，呼吸细得像纸在动。你把经过从拣到猫开始讲，讲到一半才发觉全不对：为什么是你先来说、为什么是现在。八云盘腿坐着，先看了看盒子，又抬眼看你：「不行，将它送回去。」咲夜站在你侧后方半步，一直没有出声。",
      "第八章": "放课后的调理室，你在教咲夜做料理。大号油瓶从她手里滑下去，撞到盛着黏稠蛋液的平底锅，又落到地板上；滴落的油窜起几十公分高的火。她退了半步，脚下一滑摔倒，你冲过去扶，两个人都倒在地上。「咲、咲夜大人！！」「啊，咲、咲夜同……学、没关系么？」灭火装置喷出的细雾浮在空气里，她的视线穿过你，停在你头顶。",
      "第六章": "会议散场后，你和咲夜一同往宿舍走，夕阳正落在校舍背后。「关于猫的那件事也是，千弘同学真的一直在支援我呢，谢谢你。」她说完，脚步轻了些。吃完饭、收拾完，你们一起去休息室找皋月。你把请求说得很谨慎——两个大活动同时办，能指挥的人招不到——话还没说完，皋月就答了：「嗯、可以哦。」你和咲夜对看了一眼，谁也没能接上下一句。",
      "第十章": "欢迎会当天的下午，庭院的桌布和引路牌都按单子核过两遍，客人们陆续进来。你端着一托盘果汁在人群里穿行，绕开正在铺桌布的女生。走到会场另一头才听见消息：天城家的家主到了，直接从机场赶过来，此刻正在找女儿。你找到咲夜，她拨着发尖：「我、我现在不能离开这里，还有作为副会长的工作要做。」",
      "第四章": "放学后，你端着分装好的慕斯进了学生会室，最中间摆的是盐味的油酥蛋糕。「真是何等的何等的何等的—，突然降临舞城女学园的我们的美少女调理师朝仓千弘，带着慰问品过来了～！」「希望您不要念这样的台词啊。」话音没落，议题就压到桌上：舞蹈祭和学校第一次办的欢迎会，偏偏撞在同一天。你把托盘换到另一只手，胳膊已经发酸。"
    },
    "lemon": {
      "序章": "闹钟还没响你就醒了。摸过手机，屏幕上写着十点十二分——你吓了一跳，好半天才想起自己在放春假，重新躺回去，可回笼觉已经睡不成了。老爹上班去了，做兼职的老妈也出了门，客厅里只剩你灌下去的那口水。出门前你把贝斯、备用琴弦、线材、换洗衣服清了一遍，然后去按隔壁的门铃。美里阿姨开门：「莉莉子还没出房间，你自己去敲吧。」",
      "第一章": "开学第一周的午后，走廊尽头站着惠凪和一个你不认识的学长。他一路殷勤，说自己对乐队也很有兴趣，当初没找到轻音部才去了篮球部，还提出加好友。惠凪的眼神已经散了。你拦住要去接话的莉莉子，让她出面上前。两人刚走，走廊另一头就传来一声明显带着恶意的咂嘴：「刚转过来就急着组社团，就是想在新社团开后宫而已嘛。」你把手里的钥匙串捏紧，没有回头。",
      "第七章": "期末考最后一天，卷子摊在桌上，你的注意力却始终不在纸上。昨夜到现在，占着脑子的全是另一件事，复习时间被啃得干干净净——好在早就自己过过一轮。「——考试结束。请停笔，最后一排的同学帮忙收一下答题卡。」教室里先是一片死寂，随后是此起彼伏的叹气。你交卷时感觉良好，把笔袋塞进书包，快步往楼梯口去。",
      "第三章": "晨光从窗户淌进来，淌过房间里那一堆没收拾的杂物。你刚醒，习惯性地等着隔壁那个男生来敲门——冲浪雪鹰，同龄、住隔壁、从小一起长大，每天早上来叫你起床，然后两人顺道一起上学。床头闹钟响过两遍，你按掉一次，第二次干脆不按了。被子往下拉了一点，你又觉得这样躺着好像不太体面。楼下那道门还没有响。",
      "第九章": "元旦这天，你只做了一件事：打电话。跨年之后你就再没能直接见到她，连拜年也只能隔着手机。「妈妈好像真的在住院，还有，不跟人联系也是真的……」她把听来的话一句一句说给你，声音从听筒里过来，薄得像纸。「而且……还想参加乐队练习。下次去录音棚练习是……什么时候啊？」「三号。」挂断之后你把手机放在桌上，琴袋的拉链还开着。",
      "第二章": "清晨的校门口，你和另外三个人拿着竹扫帚站成一排，把落下来的花瓣和烟头一起扫进簸箕。扫到最后谁也不说话，只剩竹枝刮过水泥地的声音。惠凪挑这个时机开口：「我可是，都录下来了哦……？」她把扫帚往水桶边一插，又补一句：「请加入我们，一起组乐队吧……！」卫哉在旁边笑了一声，莉莉子把簸箕里的烟头倒进袋子，说这活儿比练琴还累。",
      "第五章": "文化祭调休结束后的第一天早上，你照旧去敲隔壁的门。莉莉子顶着被子坐起来：「小鹰鹰，好冷漠——」「我可是特意来叫你起床的，你就这么对我？」教室还保持着「立秋茶会」的模样，上午要先做收尾。惠凪来得晚一点，说休息得不错，还想继续办茶会；她把话往下接：「还有……如果可以的话，我想让我们乐队上场。」你把抹布叠了一下，搭在桌沿。",
      "第八章": "你出门出得急，到地方一看，比约好的时间早了十分钟。去别处打发时间太短，站在原地又只能坐立不安，你只能老实待着，时不时瞥一眼手机，数字一动不动。十二月中旬的街上已经是年底的味道，有人拖着行李箱，有人拎着年货袋。手插进外套口袋，又拿出来看了看——还有八分钟。这时她从车站外那头小跑过来，头发有点乱。",
      "第六章": "排练结束，录音棚里只剩收线材的声音。你把贝斯放进琴袋，拉链拉到一半停住——合练的时候鼓点稳住节奏、吉他和键盘相继切入，一到副歌你还是会起一次鸡皮疙瘩。谱子上有一段空白，是惠凪那句「现在想优先完成 Live」，你抄在那里，字写得比平时用力。她把水杯放到桌上：「？？？那个……有什么事吗？」你低下头去调弦。",
      "第十章": "七月的太阳毒得没什么道理，听说今天会超过三十五度，光是听一句就要汗流浃背。集训就在这样的天气里收了尾，那优花开着车来接，架子鼓要送往不二家，车还得还回去。几个人挨个道谢，接着分派谁跟车走。「啊，那——可以载我一程吗？这样也更省事。」卫哉被她顺手拉去当搬鼓的人手。车开走后，原地只剩你和惠凪，还有一堆没散的行李。",
      "第四章": "八月的周末，Livehouse「DOOZY」的后台只有一条窄走道，器材箱靠着墙排开。你把那张通知又看了一遍——报名表是你自己填的，交上去时还觉得十拿九稳，回执上只有一行字：来的人可能太多，安保会出问题。隔壁传来试音的鼓点，惠凪在门外问歌单要不要再对一遍。你把纸折了两折塞进琴袋侧袋，应了一声「对一遍吧」。"
    },
    "lianai": {
      "序章": "第四节下课铃一响，你端着妹妹做的便当回到教室，自己的座位已经围满了女生。她们聊的是男朋友，笑声一阵阵压过来，你站在过道里等。给你让座的是个连名字都对不上号的女生，有人喊她「濑皮」，她笑着把椅子挪开半边。你坐下揭开便当，双手合十——八純就在这时捧着腮凑到桌边，看着饭盒发出「哟呼呼」一声。",
      "第一章": "周一午休，你刚把便当盒打开，絵未就一屁股坐上你的课桌，宣布「我从今天起要开始去打工了」，下巴抬得老高。桃子把话题拐到照片上，说小纯把那张双人合照设成了手机壁纸。八純笑着承认，理由是实在太可爱了；絵未拍着桌子威胁要告她侵犯肖像权。你低头扒饭，忽然觉得有视线落在额头上，抬起头。",
      "第七章": "末班车到底是错过了，你们只能坐进絵未打工的那家家庭餐厅。凌晨的店里只剩三两桌，灯光白得刺眼，餐巾纸叠在桌上的塑料架里。八純从洗手间回来，脸上已经恢复成平时那样，一坐下就问絵未有没有跟家里报备。絵未说今晚在小纯家过夜。八純把水杯往她那边推了推，说下次再拿人家当借口就要告诉阿姨。",
      "第三章": "七月的午后，站前的柏油被晒得发软。絵未已经等在那儿，脸色比平时灰一层。你问她今天真的没问题吗，她答得干脆，说昨晚也没睡着，接着张开嘴打了个大哈欠，完全不管旁边的人在看什么。她说着说着声音慢下来，人还站着，眼睛已经闭上了，肩膀一点点往前倾。你伸手去掐她侧腰，站口那头有人喊了一声。",
      "第九章": "八月中旬末的中午，站前的电子牌一格一格跳着下一班车。你在人群里一眼就找到絵未，她今天没笑，抱着手机站在柱子旁边。你迟了五分钟。她当场发难，说迟到的话能不能打个电话过来。你说抱歉，起晚了。她把脸凑得很近，仰头盯着你的眼睛，说你以前从不迟到，太可疑了。你往后挪了半步，说靠太近了。",
      "第二章": "检票口的人流散得差不多了，末班车开走时，站台上只剩风。八純站在黄线边上，书包抱在胸前。你问她，最后一班电车已经没了，为什么要对我说这个。她答得理直气壮：我们不是已经成为朋友了吗，大半夜一个人被丢下，人家肯定会觉得很心慌啊。你说让她打车回去，她把口袋翻给你看，只剩几个硬币。",
      "第五章": "夜里的客厅只开了一盏落地灯。月在你旁边坐了很久，才拘谨地拽了拽你的衣角，把一张折过两道的传单递过来——河滩上要办一场纳凉烟花大会，纸角被她的手指捏得发软。她说之前和兄长约好要一起去看，所以如果你不忙的话。说完就低头看自己的手。你正要开口，她又小声补一句：现在的兄长，已经有了絵未姐姐。",
      "第八章": "暑期补习的返校日，教室的窗全推开着，风扇转到最大也只是搅热风。你的座位上坐着絵未，她趴着，头发垂下来盖住半个桌面。换作平时你早一句让她让开，今天你在过道里站了几秒，还是没想好怎么开口。门口有脚步轻轻移过来，八純弯着腰贴近你背后，压着声音问：哟呼呼，你该不会是在发愁吧。",
      "第六章": "周日清早的门铃响得毫无道理。你顶着睡乱的头发去开门，手还按在额头上，差点就这么把刘海放下来。门外是絵未，挎着小包，一脸理所当然，先把你从头看到脚，说早啊，瞧你这副没睡醒的德行。你警告她别随便跑来。她不理，越过你的肩膀往屋里看，客厅的电视正放着周日早上的战队节目，音量开得很大。",
      "第十一章": "八月的商场早早就把冷气开到最足，入口挤满带孩子来的家庭客。你等到絵未，她一见这个地方，第一句话是惊讶于你居然会选个正经地方。你说不出选址的理由。她绕到你身后，从后口袋里把你的手机抽走，边走边低头摆弄，说差不多该自己注册个账号了吧，以后打算一直让小月替她传话。你伸手要拿回来，她把手举高。",
      "第十三章": "这一天店里收得比平时晚，最后一桌客人磨到快打烊才走。你把最后一箱饮料推进冷库，回头看见絵未把围裙挂回钩子上，人就靠着墙滑下去。她起身时才发现裙角沾了一片酱汁，蹲下去擦，越擦越花，索性放弃。通道尽头的应急灯把两条影子拉得很长。你摸出钥匙，走到拐角，前面那扇门被人从外面推开了。",
      "第十二章": "暑假快结束的车站前，你比约好的时间早到很久，靠着护栏数过去几趟车。八純跑过来时已经迟了，难得没穿那身变装服，换成普通的连衣裙，头发规矩地别在耳后。她一边喘一边问等很久了吗；你说久到都在犹豫要不要去附近咖啡店坐坐了。她立刻抱怨，说这种时候该帅气地回一句「没事，我也刚到」。你看了看她手里的空袋子。",
      "第十四章": "八月三十一号的正午，太阳从头顶直直砸下来，沙面反着白光，空气都在抖。你们赶在人潮之前占到一把遮阳伞。你把毛巾铺开，整个人缩进伞影里，一步都不肯往外挪。絵未在伞外喊你的名字，声音被浪切成一截一截。你回她，这么毒的天，防晒霜不过是图个心理安慰。她跑回来蹲在伞沿外，指着你那条手臂。",
      "第十章": "门铃还没响，门就被推开了。絵未站在玄关说自己快了一步；八純从路边的出租车上下来，还喘着气，说路上堵车。月从走廊深处走过来，平平静静地指出可疑人物增加到两个了。你提议出去说，怕吵到邻居。月推开你摸她头的手，走到两个女生面前鞠了一躬，说真是抱歉，我这个哥哥太没用了，请务必好好照顾我哥哥。",
      "第四章": "八月的蝉声在站前棚顶下响成一团。絵未一路小跑过来，你随口一句「汗味」，她当场僵住，从包里掏出止汗喷雾对着自己上下喷了两下，喷完把腰杆挺回去，说今天可是我难得大显身手的日子。她一路讲着泳衣带齐了，走到室内泳池门口，队伍已经排到街上，水声从玻璃门缝里漏出来。你拎着包跟在后头。"
    },
    "linggan": {
      "序章": "体育馆里全是鞋底摩擦地板的声音，几百个人按班级排开，讲话的回音在屋顶下面滚。里姐握着麦克风，先叹了一口气，才说学生会长跑路了，几个星期没有联络，昨天总算回信，人正在四国。三天后这一片区的学生会要集中到千玉学园开研讨会，不能取消，所以今天就要现场决定下一任。没有人举手，也没有人推荐。筒状的东西一个个发下来，你捏住盖子，和旁边的人一起拔开——一束礼花从你手里炸出来，降落伞在你头顶慢慢落下来。",
      "第一章": "傍晚的公园，滑梯的影子已经拖到草地那头，路灯还没亮。三个人穿过公园的时候，你还没想好怎么解释昨天的事；结果人就站在正前方。锦亚澄提着便利店的袋子，看见你的第一反应是一声「啊」，然后把视线暧昧地移开，手指把袋口捏紧。你激动到把「昨天」说成了一声猴子叫，華乃在旁边吐槽，妃爱立刻追问哥哥为什么盯着不认识的女生。塑料袋里的东西轻轻碰了一下，发出很轻的响。",
      "第七章": "考试前一周的放学后，学生会室里只剩你和诗樱。她把书往桌上一放，先把丑话说在前面：要是学不进去，就一起去道场练空手道，那项运动可以攻击面部，受点伤也在正常范围内。你当场保证会认真学习。翻开练习册不到十分钟，你就卡在第一步，连「这个图形和这个公式到底在求什么」都问不出口。她把手抵着下巴看了你很久，你等着那句无药可救，等来的却是「你也很辛苦啊」。窗外的天已经暗到只剩一条边。",
      "第三章": "研讨会的第二天放学后，学生会室里只有你一个人。窗外的运动场上还有社团在跑，喊声隔着玻璃传进来，闷闷的。门被推开，诗樱学姐准时出现，把包一放就坐下打手游，一边打一边问北条氏康是不是人权卡，另一张要不要抽朝仓义景。你一边答一边把活动关掉，排位已经追不上了。她抽到龙造寺隆信，说这个熊先生的玩偶很可爱，被你一句「重复四天王」打回原形。她把手机翻过来扣在桌上，问：「常磐和锦呢？」",
      "第九章": "第一学期的最后一个早晨，直播里巨蟹座运势绝佳，你偷偷笑到被人撞见。新川比平时来得早，这一周有四分之三的早晨都是你们两个人独处。他把椅子转过来，说夏季同人展去不去，又说自己正在做新衣服，这次要 cos 北条氏康。你差点把嘴里的东西喷出来，还得在心里反复告诉自己不能对眼前的男同学起色心。他说到「可以来看我试衣」的时候，天梨推门冲进来，他立刻借口买饮料走了。",
      "第二十一章": "这一周你几乎没在食堂吃过一顿完整的饭，午休全用来跑各个部团，两个人一天里能说上话的只剩下早上一起走进校门的几分钟。这天傍晚你照旧送她回家，路灯已经亮了，电线在头顶横过去，便利店的门在街角响了一声又合上。她在门口先问你体力够不够，毕竟这周才刚开始。你说轻轻松松。她抱着书包带子站着，说有一件事让她困扰，不是插画，是演出当天的舞台安排。说到一半她停下来，看着地面。",
      "第二十三章": "文化祭之后某天的放学后，学生会室里来了选举管理委员会的人，说因为候选人只有一名，下期会长由二年D班的虹野同学担任。你把半年攒下的账本、会议记录和学生会室的钥匙一样样交出去，装订好的文件摞在桌上，比你想象的厚。最后一页翻过去，上面是你自己写的「文化祭当天」，字迹被汗水洇开了一点。新会长站在门口有点拘谨。你把备用钥匙递过去，才发现那串钥匙上还挂着去年文化祭的挂绳。",
      "第二十二章": "文化祭前几天的夜里，学生会室的灯全开着，桌上摊满了纸和笔。里姐拎着两盒章鱼烧进来，说一起吃晚饭。华乃嘴上说忙得不可开交、没空吃，还说这香味简直是拷问，人却已经张开了嘴。妃爱说那就让我喂你，一声「啊」把章鱼烧送了过去；锦也跟着来，天梨也凑上来。酱汁的味道一下子盖过了纸张的味道。你站在桌边，把废掉的草稿收成一摞，再把空盒子一个个摞好。",
      "第二十章": "开学之后华乃就坐在你旁边。上课的内容一个字都没进到你脑子里，你每隔几十秒就往右边偏一下头。她倒是泰然自若地听着课，笔在笔记本上走得很稳。趁你看向黑板的时候，她转过来比了个Ｖ字手势，你差点把笔掉在地上。后桌的広夢把这一幕看得清清楚楚，一句「关系很好呢？」让她的脸红到耳根，整个人趴在了桌上。黑板上的粉笔字还在往下写，太阳把窗台照得发白。",
      "第二章": "四点半你就醒了，天已经亮，窗帘缝里透进一条发白的光。你到院子里做了一套广播体操，回来时脚上沾了露水。妃爱飞奔上楼，鞋在楼梯上连响四声，说「糟了」——你最喜欢的那个占卜主播，中之人暴露了。你只应了一声嗯，继续擦手。她说这样才像粉丝，又补一句中之人好像是个超级可爱的女孩子。你把毛巾放下，掏出手机，开始搜一些不该搜的词。桌上味噌汤的热气还在往上冒。",
      "第五章": "午休的教室，空调开得过头，窗玻璃上蒙着一层水汽。常磐在你旁边坐下，把笔记本放下，第一句就问你是不是在教室里睡得太多了、有没有复习。你说文科交给你，日本史是靠战誓练出来的，她立刻反驳：入学考试里战国时代的问题顶多一两道，谁跟谁打过这种题根本不会考。她说话的时候把耳机线绕在手指上，一圈一圈。她压低声音说，有话不能在教室里说，别人会追问她为什么跟一个不上学的同学这么熟。",
      "第八章": "期末考试上午就结束了，整栋楼安静得没人气，只有学生会室很热闹——没人召集，几个人陆陆续续就到齐了。你靠在桌边，看锦和妃爱对完答案，两人全科都在六十分以上，锦一边哭一边抱住了妃爱。天梨把手机横过来举到你面前：「诶？这是，亚澄亲？　性格差距是不是有点大？」房间里安静了半秒。锦的手指停在半空，脸慢慢红到耳朵根。",
      "第六章": "午休的走廊上有人在搬桌子，铁脚刮着地，一声长一声短。天梨从门边回来戳你肩膀，说走廊有客人，是个特别漂亮的学姐。你以为来的是诗樱，摆出架势让她传话：有事就自己过来，顺手带个炒面面包。门被推开，进来的是一张陌生的脸——黑长直，身形纤细，说话很轻，报上名字是三年D班的渡月，又说炒面面包没时间去买，没关系吧。你把「不用」说成了尖音。诗樱这时才从她身后慢悠悠地走进来。",
      "第十一章": "从机场坐里姐开的车一个小时，海就在眼前——不是海水浴场那种海，颜色清得过分，大大小小的岛浮在对面。诗樱手里拿着一根竹轮在啃，说是路过的一个老太太塞给她的；里姐立刻提醒，从陌生人那里收东西要先推辞，至少只拿一半。镇子里的推拉玻璃门、复古瓷砖的理发店、白墙的大仓库一一过去，最后是那间三层木结构、瓦片屋顶的旅馆。你站在旅馆门口，走廊的地板一踩就响，空气里全是晒热的木头味。",
      "第十七章": "企划会议散会之后，你把常磐和锦留下来，说想一起吃个午饭。家庭餐厅的空调很足，靠窗的位子能看到外面被晒得发白的马路，玻璃上留着一层手印。常磐把菜单翻了两遍才下定决心，点完还认真地跟店员确认了一遍份量。锦小声说这家店好像没有肉包，说完自己先有点失落。你问她们午饭一般怎么解决，常磐答得毫不犹豫：章鱼烧；锦的回答是肉包子。店员拿着点单板站在旁边，笔停在纸面上等。",
      "第十三章": "会场九点开门，八点刚过，后台那条通道里已经挤满了推着行李箱的人，空气里全是假发和发胶的味道。天梨换完衣服出来，先是一声长长的「华乃，好—可—爱—啊—！」，想起要小声时已经来不及了。常磐反复强调自己并不想穿，是被人拜托了没法拒绝，耳朵却越来越红。通道里有人在喊编号，有人在找胶带，行李箱的轮子从水磨石地面上碾过去。你被问到觉得怎么样，条件反射地答了一句「我认为很受顾客欢迎」。天梨立刻接上：「不是顾客，说说会长是怎么想的！」",
      "第十九章": "暑假的最后一天，常磐家的窗帘拉开一半，光落在原稿桌上。稿子已经收起来了，桌上只剩两只空杯子和一叠回收用的单据。她坐在椅子上，把脚缩到椅子上去，下巴搁在膝盖上，看着窗外叹了一口气：今天暑假就结束了。她转过头说，你每天来这间房间，她其实还挺高兴的。你顺手抱怨，说哪怕是周末也一次都没见过她父母，到底在做什么工作。空杯子的杯底在桌面上留下一圈水渍。",
      "第十二章": "同人展前一天下午，你把自己房间的窗帘拉了一半，手机横过来搁在桌上。主页上的商品目录已经溢出一周了，你从关注列表的头翻到尾，把打算买的书一本本记进备忘录，连封面上印的画师名字都抄下来。窗外几点暗下来都没注意，房间里的光慢慢变成橘色。你翻到第十二本，给每一本标上优先顺序，又回头看了一遍。房间很静，只有手指划过屏幕的声音。刚点开常磐的图标，手机就响了，屏幕上跳出来的正是她的号码。",
      "第十五章": "你回到家的时候天已经黑了，玄关没开大灯，客厅那边亮着。妃爱蹲在地板上，手里捏着一段胶带，把什么东西一点一点粘起来。电视开着，音量很小，屏幕的光在她侧脸上晃。她把最后一段胶带按平，捏在指尖看了看，才抬头说，今天是不是有客人来过，这里掉了些头发，不是哥哥的也不是我的。你把外套挂在椅背上，鞋脱到一半停在那里。空气里有一点不属于这个家的味道。",
      "第十八章": "常磐家的房间里只开着原稿桌上那盏灯，窗外已经暗下去，空调的风把桌上的单据吹得轻轻响。她从浴室出来，头发还半湿，用毛巾压着发梢，说你也去冲个澡再走。你想都没想就拒绝了，理由说出口自己也觉得有点可怜：身上沾上一点别人家的肥皂味，回去都可能被妃爱察觉。她没有露出意外的表情，只是拿你没辙地看着你，苦笑了一下：「你啊……真喜欢妃爱呢。」绘图板的电源线还插着，屏幕是黑的。",
      "第十六章": "召集的通知只提前了半天，你几乎是被里姐从家里拽出来的，一路都在想能不能装病。会议室里空调开得很足，长桌那头坐着常磐，穿平常的便服，头发扎得比平时整齐一点，正无意识地整理胸前的缎带。妃爱嘴里叼着半个三明治，一边嚼一边说自己是从工作现场赶来的，饭都没吃完。锦靠窗坐着，笔记本摊开，笔尖悬在纸上。里姐说突然把大家叫来不好意思，然后把话推进去：距离文化祭只有一个月了。你把手放在膝盖上，擦了擦手心。",
      "第十四章": "门铃响的时候是中午十一点四十，你被从床上拽起来，头发乱得没法看，睡衣上还有昨晚压出来的褶子。手机屏幕亮着，七八条没回的消息，最后一条只有两个字，问你在不在。你拖着身体去开门。常磐站在门口，穿着平常的便服，怀里抱着一个纸袋，看见你这副样子先愣住，然后眯起眼睛：「好，好慢啊！」楼道里有回音，隔壁门缝里传出电视的声音。她的目光从你的头发扫到赤着的脚。",
      "第十章": "千玉站前的那条巷子很窄，招牌是手写的，字迹被雨冲淡了一半。店里只有几张桌子，一台老风扇在墙角转，吹出来的风是温的。上了年纪的店主端来两杯，都是橙色。诗樱说这家店风评不太好，可对方在她旅行时照顾过她，她想还这个人情，带一个客人来也算贡献。你喝了一口，说确实不错，她愣了一下，很轻地笑了一下。她放下杯子，忽然问：「刚才为什么看了我大腿一眼？」",
      "第四章": "七月的夜里，便利店的灯白得发亮，蒸笼还在冒着热气，肉包的香味一直飘到店外。你买了两个，走到公园长椅上坐下，塑料袋在手里发出细响。路灯还没亮，草里有虫在叫。你还没决定第一句话是「哟」还是「对不起」，人就出现了。锦亚澄空着手站在那里，说刚去过同一家店，肉包卖光了。你把两个词混成了一句「哟不起」，自己都想原地消失。她还是在你旁边坐下了，裙子在木条上蹭了一下。"
    },
    "nine": {
      "序章": "班会散场，成濑沙月抱着日志走出教室，你被与一拉到角落去拿扫帚。「翔～啊、回～去吧～」「要打扫卫生吧。」走廊上说的全是这座城市半个月来的怪事：有人被石化成石像，紧接着同校的学生用不可思议的火焰把校舍烧成火海，消防赶到时火痕却消失得干干净净。「只有你们两个被老师传唤过去啦。被骂了？」你握着扫帚柄，把话咽了回去。",
      "第一章": "两个人睡到接近中午才起床，穿着睡衣拖拖沓沓地刷牙洗脸。桌上剩着九条昨晚多做的那份，热一热就是一顿像样的早餐。吃完也不换衣服，直接开观赏会——那部被你们当作情报源、又谁都不肯承认好看的动画，全集放送。第一集的专有名词就把你顶了回去。「这充电真持久，真亏你能坚持到中午。」天瘫在床上，眼睛还盯着屏幕。「完全记不住这些专业用语啊……」",
      "第七章": "整夜都没睡好。手脚不对劲，翻不了身，好不容易睡着又马上醒回来，总共只睡了三小时左右。九点多你爬起来，天早就起了，戴着耳机看视频，一边喝牛奶，看见你醒了才把目光从屏幕上挪开。「早上好。」她把马克杯推过来，倒上牛奶，「石化开始解除了。」你低头看自己的手，胳膊能弯了，膝盖也是，那层灰色退了一大块。",
      "第三章": "天一大早就黏上来，从玄关系鞋带开始就拉着你的手臂往外拖。绕进便利店抓了两个面包和饮料，走到半路她忽然停下脚——前面站着香坂春风，今天身边罕见地没有那群跟班。你不想多看，径直走过去；她追上来站在前方，第三次追上时干脆站住盯着你们。「有何贵干？」她只挤出半声「啊，呜」，往后退了两步，随即猛地把身子冲过来，往天怀里塞了什么东西就跑开。",
      "第九章": "天照常背着书包出门，你照旧送到玄关，随口问她有没有在勉强自己，被一句「没有啦」糊弄过去。屋子里静下来，你才发现石化退得比预想中快，手腕脚腕都转得动了，只剩鞋子还硬邦邦的。你拨了老家的号码。「妈，是我。翔。」母亲先把「别说名字」的梗玩了一遍，第二句问他身体还不舒服吗，随后忽然拐了个弯：「为什么找到了女朋友都不跟我说？」",
      "第二章": "早上你催着慢吞吞的妹妹出门，她先为找手机磨蹭半天，出了门又兴奋地说这是头一回从家里和你一起上学。路上绕进便利店买午饭。「嘿嘿～头一回和老哥一起上学～」「不是头一回吧？」走到通往车站的那个路口，又撞见最近天天上演的那一幕：十几个男生围着同一个女生，她支支吾吾地说「那，个……包包，那个…………我能拿的……」。",
      "第五章": "周末的白天没事可做，你把成濑老师给的两份资料对读到底，揉着发酸的眼睛推到桌角。一抬头，天正一脸纠结地盯着一只马克杯。她把手机和杯子摆在一起，又把你的手机和杯子也拉过来，抱臂念叨：果然多到四个就很难发挥。她把桌上东西收拢成一堆，忽然一个鲤鱼打挺背过身去：「快看快看，刻印。」「是不是变大了？」",
      "第八章": "天照常背着书包出门，临走前回头问你一个人在家没事吗，随即想起要跟学校请假。「好好。啊，得跟学校打个电话请个假吧。」「我拜托下老妈好了。」玄关一静下来，你坐在床上，右手反射性地去摸手机，又慢慢缩了回来。你用左手拨了家里的号码。「喂，妈？　是我。」听筒那头第一句是：「我不会给你打钱的。」",
      "第六章": "放学时成濑老师念完注意事项就走了，教室里的桌椅被推到一边准备打扫。「好了，以上。值班生～」「小翔～、咱们回去嘛～」「噢。」整整一周你们都按索菲的指示按兵不动，梨俱吠陀照原定办了线下网友见面会，香坂学姐的报告只有一句——幽灵没来。九条被朋友围着说笑，你握着书包带从她座位旁绕过去，没有停下开口。走到楼梯口，你回头看了一眼教室。",
      "第十一章": "神社回来的这一夜还没有过去。她单膝跪在桌上，抓着你的双肩，把同一句话又问了一遍。「我明白了。」你答得很干脆，「谢谢你的心意，我很开心。从现在起，我们就是恋人了。」她笑得眼睛都眯起来，热气从嘴里溢出来，随即闭上双眼。房间里的暖气响了一声。你停在那里，手悬在半空，台灯把两个人的影子压在墙上。",
      "第十二章": "安布罗西亚把契约解掉了，天的刻印消失，她重新变回一个普通的女孩。然后她坐下，把两只手放在膝盖上，用很平静的音色开口：「请给我……这份既是最初也是最后的，回忆。」「拜托、你了……」冰箱在角落里嗡嗡地响。她低着的头上，头发垂下来遮住半边脸，肩膀一动也没有动。你张着嘴，桌上的两个杯子谁也没有动过。",
      "第十章": "早饭吃到一半，你放下吐司拨家里的号码，天在旁边笑说老妈每回都要演那出冒充熟人诈骗的电话戏。可这一次语气不对。「喂，您好。」「我是你儿子，儿子啊。」「请问是哪位？」一遍遍追问下来，最后一句「我们家没有儿子」，电话就挂了。你盯着手机发怔，还没想明白，天的声音从旁边传来，很轻：「我该怎么办……哥哥……」你回头，她那只手正一点点变透明。",
      "第四章": "午休铃一响，天就拽着九条去挖人。你站在走廊上看她把香坂学姐从教室门口叫出来，三个人在中庭的长椅上坐下，各自打开便当。香坂很紧张，连「我开动了」都说成三段。「……我……开动，了。」「哼哼～早就想在外面吃一次便当了～」天把话题往日常上引，谁做便当、爱吃什么。风把树影移到她膝头，她的筷子一直悬在盒子上方没落下去。"
    },
    "sakura": {
      "序章": "四月的午后，风里还留着寒意，樱之森的花开得满到没有空隙。你站在林间小路的边上，看四个人抬着那口深色棺木往林子深处走，鞋底压过落花，发出湿软的一声。防腐剂的气味混在花香里，从棺木那侧一阵一阵散过来。来的人不多，撑黑伞的只有两位，仪式短得像一句客套话。夏目圭站在你旁边，那张常被误认成女生的脸此刻绷得很平，他轻声问：「怎么了嘛？」你没有答，只把视线留在白得过分的那片花上。",
      "第一章": "天还没亮，夏目宅邸的走廊冷得像井底。你一夜没睡好，摸黑下楼，脚踩在木地板上，每一阶都响。客厅只开着一盏小灯，雫抱着膝盖坐在沙发一角，头发压得乱七八糟。她抬头说自己也睡不着，理由和你一样——没什么理由。你说饿了，翻开冰箱，一格肉都没有，只好把高粱和中餐汤料搓成几个丸子下锅煎。油在锅底噼啪响，青烟往上飘。她凑过来看锅里的东西，眼睛一眨不眨。",
      "第七章": "天还没亮，教堂前的庭院里全是露水。人一个一个地来了，鞋底踩过草地，声音很轻。优美一边说最讨厌你们、总把很多人卷进来，一边掏出喷雾瓶朝你和明石的脸上喷，说先把温度降下来。圭打着哈欠，说这是完成草薙健一郎作品的大工程，怎么可能不来。真琴已经在墙边数坐标，念数字的声音比平时低。教堂的白墙在灯下显得很薄，像一张还没上色的纸。有人把一架人字梯拖过来，铁脚在石板上刮出一声长响。",
      "第三章": "天亮前最响的一声不是闹钟，是一记金属砸落的巨响，接一声女人的悲鸣。你冲上二楼推开房门：蓝抱着头坐在被子上，眼泪汪汪，脚边滚着一只深深凹陷的金属盆，凹下去的那块正好装得下她的脑袋。天花板上装着钩子，绳子系在盆上，闹钟两面贴着胶带。她抽着鼻子说，夏目家的人天生起不来，没这个醒不了，还抗议你别用那种眼神看她。地板上散着几片胶带，粘着毛。",
      "第九章": "稟和真琴她们走的时候，天还没黑透。你站在路边目送，抬手挥了两下，等最后一把伞拐过街角才回身，推开玄关的门。门后站着雫。她显然从一开始就躲在那儿，被撞破时只发出一声短促的惊呼，随即开始找借口，手指抓着门框边。走廊的灯有点暗，客厅那头电视的蓝光透过来。你没有揭穿她，只把话摊开：「你很在乎她们，所以偷偷看着，对吗？」她嘴上说才没有，声音却软了下去。",
      "第二十一章": "下午的光斜着落在教堂那面墙上，颜料还在往下淌，花瓣的边缘挂着一滴亮的。你站在墙前，把长山的话听完。她说这次的作品确实由他们完成，把草薙描绘的地震前的日常和如今身边的日常做了差异化呈现。村山理事在旁边替她撑场面，说学校打算朝认可这件作品的方向协调。空气里有新颜料和溶剂的气味。你手里还捏着车钥匙，指腹在齿上磨了两下，低头说了声是的。",
      "第二十二章": "发布会在上午，教堂前挤满了媒体，蓝色防护布把整面墙从上到下罩住，四角用绳索绷得很紧，风一过就鼓起来。话筒递到摩尔财团的弗里德曼手上，他说接下来由草薙健一郎先生的财产管理人作说明。台下本是为案件赶来的记者，一听这句，骚动更大。真琴以美术杂志编辑的身份举手，问那层布为什么遮遮掩掩，看上去简直像出了什么事故。你站在人群边上，手里捏着一张写了几行的纸。有人把话筒递向你。",
      "第二十章": "二月的放学后，屋顶的风还是冷的，铁门被人一推就响。你靠在栏杆边上，烟夹在指间，灰积了半截，被风一吹就散。咲崎樱子抱着文件夹从门口过来，站在你面前，先看了一眼你手里的东西：「真是的，到底是哪个世界的老师会被风纪委员训斥啊……」你把烟按在栏杆的铁皮上摁灭，说声抱歉。她没有走，翻开文件夹，说听其他老师聊天时听到一件事——你的待遇从下一学年起好像会有什么变化。",
      "第二章": "清晨的夏目宅邸，厨房的窗上还蒙着一层白气。你站在灶前煎竹荚鱼干，油星子溅到手背上。雫半睡半醒地立在旁边，用播音的腔调报菜名，把吐司和煎蛋念得像广告词，念完还认真问桌上哪一样才是幻觉。你说别在一个正在烤鱼干的人旁边念旁白。蓝从走廊那边过来，声音越来越小，说昨天的事真的对不起；你说自己也有错，别再提。玄关那边已经吵起来了，圭的声音先炸开：「我的摩托车比她的快十倍！」",
      "第五章": "下午的教堂比看上去轻得多，你只一推，那扇门就开了。里面的东西跟外头那身哥特复兴的旧壳子完全对不上：整面墙的彩绘玻璃亮得过分，地板擦得像新的一样，走一步，脚步声在石头之间弹回来。空气里有抛光和蜡的味道。你绕到侧廊尽头，刚抬起脚要跨过门槛，身后有人开口：「那里禁止穿外鞋进入哦。」小牧拎着一双小小的室内鞋站在鞋柜边，柜子里排着一大堆儿童尺码的鞋。",
      "第八章": "泳池底还积着一层水，氯气的味道压在鼻子底下，太阳一照就往上翻。真琴把拖把塞进你手里：「要知道是你们搞得合宿不得不改在学校里进行的！」你推着水往排水沟走，池底的瓷砖在氯水下面泛着浅蓝。稟蹲在池边刷池壁，动作很细，像在画什么东西，刷完一段就抬头看一眼教堂。圭和托马斯抬着水管一路乱喷，被骂了三回。里奈在池边撑着伞说阳光太强，优美把伞往她那边斜了斜。蝉声一阵高一阵低。",
      "第六章": "合宿前夜的傍晚，美术教室里东西已经收得七七八八，画架靠着墙排好，纸箱上用记号笔写了名字。你往里走，想趁最后这点时间把几件事确认清楚——那个大包裹不在。优美靠在准备室门口，说是被明石学长拿走了，现在大概在教堂。走廊的灯只开了一半，光斜斜地切在地上。她抬眼看你：「听过一个词叫爱憎交织吗？你这种人只要做些无关紧要的事就好了，为什么每次都要做些让那么多人在意的事？」里奈在走廊那头喊她的名字。",
      "第十一章": "九点半了，里奈还没来。教室吵得像开了窗的市场，优美坐在靠窗的位子上，书包已经替人放好，那支笔在指间转得飞快：「可是她怎么还没来……」她一个人念着里奈从来不迟到，除非有非迟不可的理由；窗外的坡道一直晒到校门，白得晃眼。你还没来得及接话，她已经站起来，椅子腿在地上刮了一声，穿着室内鞋就冲了出去。你跟到校门口，看见里奈站在那里——校服脏了，脸也红着，手里拎着包。",
      "第十七章": "放学后，稟把画完的画摆到窗边，请你来看。暖气片上晾着洗过的画笔，水一滴一滴落进水槽。你站在画前看了很久，往左偏半步，又退回来，看侧光下的颜色。她攥着抹布站在旁边等，等得太久，忍不住问：「怎、怎么样？」你说还不错，考虑到才开始画半年，未来可期。她反而松了口气，说果然靠画画吃饭还是太难。走廊上有人在锁门，铁钥匙转了两圈。",
      "第十三章": "从摄社的石阶下来，天已经偏西，树影横在石板路上。香奈站在石灯笼旁边，喘得像跑了一路，嘴上说自己是刚好路过。稟先打了招呼，她立刻把称呼改成只叫名字。你拉着稟要走，她追上来两步，说了一句你没料到的话：「你的惯用手变了呢——虽然我从一开始就觉得奇怪——」她怀里抱着一叠从家里翻出来的照片，边翻边说，比耶的时候用的全是右手。稟在你旁边轻轻叫了你一声。",
      "第十九章": "会场暗下来之前，灯一盏盏地调低，空气里全是香水、闪光灯和地毯的味道。你坐到第一排，那是获奖者可以立刻走上台的位置。身边并排坐着几个履历压得人抬不起头的名字。蓝从早上就一直在打电话，那边完全没有要接的样子。记者在通道口被保安拦回去，快门声连成一片。最边上那个位置一直空着，没有人去坐。广播开始念今年的获奖者，会场一下子喧闹起来，你还看着那个空位。",
      "第十二章": "十月的第一个星期一，媒体的入校限制刚解除，围上来的换成了自己学校的学生。你还没走到鞋柜就被三个人堵在花坛边上，其中一个指着你把名字喊了出来，另外两个跟在后头小声尖叫。真琴从后面追上来，张口就是「哟，大明星！」，语气里没有半点敬意。你说心情当然不好，她回一句不坦率，撇开视线。话没说完，身后冒出一声喊——一个矮得像一年级的女生站在那里，宣称自己是附身灵。这时有人从人堆里说：「大家早上好。」",
      "第十五章": "新年假期一过，美术教室靠窗那一面就立起一块半人高的画布，谁劝都不挪。窗玻璃上结着一层薄霜，暖气片烫手，走过去能闻到灰被烤热的气味。稟把三种红颜料排在桌沿，像排一排药瓶，又搬来一张椅子放下。你坐到她身后两米的地方，看她先用炭条起稿，树干一笔到底，再蘸色往布上铺。上到一半她停了手，拿起刮刀，把整片樱色刮掉。刮刀敲在调色盘边上，声音很轻。",
      "第十八章": "清晨，你穿过夏目家的大门，看见香奈站在那里，围巾被风吹得贴在一侧肩上。她说那之后一直在想，《樱七相图》究竟是谁的作品。你提醒她昨天已经看过，你画不出那样的画。她点头，说这点很清楚——你的手臂已经不能用了。可她的结论没变：那是你的作品。你把钥匙在手里转了一下，看了眼表，已经彻底迟到了。她说自己是凡人，正因为是凡人，才相信自己的直觉。",
      "第十六章": "寒假快结束的那个晚上，蓝把你留在客厅，说这件事喝茶讲不完，于是把茶壶放下，换了酒瓶。屋里只开了一盏灯，酒瓶的影子长长地拖在榻榻米上。雪压着屋檐，客厅的暖气片咔哒响了一声。她先把杯子推到你面前，说那座宅子在中村家那边有个名字，叫埋木舍。她伸手把火调小，说这一夜要讲很久，又提醒你把耳朵放干净——圭和雫都不该听见这些。",
      "第十四章": "深夜的医院走廊，长椅是冷的，尽头那台自动贩卖机亮着蓝白的光。你坐在那儿，右手缠着一层白纱布，指头露在外面，动一下就像有人从里面扯了一下筋。稟坐在你旁边，没有哭，只是把那只手捧在自己手里，捧着不动。消毒水的味道从诊室那边飘过来。护士推着车经过，轮子的声音在夜里很响。你把手指张开，又合上，中指慢了半拍。她低头看着那只手，问：「还能画吗？」",
      "第十章": "暑假结束后的早晨，你在上学路上被拦住两次。先是两个背着书包的女生小跑过来，问能不能签名，说在电视上见过你；到了校门口，又有人围成一圈，从人缝里指着你说话。校门的铁栏被摸得发亮，银杏叶吹到脚边。一切都跟校长当初盘算的一样，唯一的好处是外人不许进校。你把书包换了个肩，低着头往花坛那边走。身后忽然冒出一声喊，有人从花坛后面蹦出来，理直气壮地说自己一直在跟踪你。",
      "第四章": "暑假第一天的上午，补习教室里没有冷气。窗全开着，蝉声从操场那边涌进来，一层压着一层。你坐在课桌后面，练习册摊开，铅笔在指间转到第三圈就停住——上面的字一个也没进脑子。圭在你旁边翻书，翻到一半干脆把书盖在脸上，说热得人想死。真琴把扇子往桌上一拍：「能够自得其乐自然是不错，可是……你真是个笨蛋啊。」稟从那头笑着抬头，叫你们先把能做的题做了。风扇转过来，把一张卷子吹到了地上。"
    },
    "shuizang": {
      "序章": "梦里你坐在凯旋门赌场的这一头，对面那个戴墨镜的男人把筹码堆成一座山，你一次次伸手，够不到他的要害。醒来时你先去摸眼镜，指尖碰到镜腿才把气喘匀——今天睡过头了。厨房里有动静，锅盖磕了一下，水龙头开了又关。煤谷小夜围着围裙站在你家的灶台前，回头说：早上好，英士君。因为我听到英士君的肚子叫了，所以跑来咯。",
      "第一章": "傍晚的客厅没开大灯。夕樱整个人压在你背上，胳膊从后面圈住你的脖子，说要玩神经衰弱。她说今天放学后跟朋友玩过，那个朋友记牌记得极准，她一次都没赢，所以来把必胜的方法要过来。你说没有那种东西，她就把下巴抵在你肩头使劲往下压。你只好把牌摊在矮桌上，抽出三张，一张张翻过来又盖回去。",
      "第七章": "多年前的午后，哥特萝莉风的店里挂着满墙蕾丝，你在镜子前站了很久。手里那叠钱是打工攒下的，前一晚数过好几遍。电视里那种战队制服不合你的喜好，你挑了更可爱的一套，让店员包起来。穿上它那天，你沿着霓虹街往暗处走，把人一个一个拎出来交给警察，每交一个，就等着听那一句谢谢。",
      "第三章": "你在客厅里翻一本旧童话，纸页发黄，讲的是岛上有过一个眼泪能治伤的少女，代价只是一枚银币、一个苹果。这一段你读过很多次，每次都在这里停下来。然后你想起八椚红叶把小夜领回家那天的样子——她把一张纸放在桌上，说这是账单。小夜那天没有哭，只说了一句：你一定、会有报应的。窗外有船靠岸，缆绳在桩上磨出声。",
      "第九章": "公园那一夜之后的早晨，家里比平时安静。你从房间出来，看见夕樱坐在床沿，被子堆在脚边，头发乱着，眼睛盯着地板上的一小寸地方，好一会儿没有动。她抬头说：我、会变成笨蛋。然后低下头道歉。隔了几秒，她忽然又换回那个吵闹的腔调，喊着因为夕樱刚起床、低血压啊。你把水杯放到她手边。",
      "第二章": "一年里只有这一天，你会走回煤谷家。屋里没有佛龛，只有一张伪造的家庭照立在柜子上，照片里的人都笑着。小夜早早把菜摆好，说只有今天要忘掉诀别的事，像往昔一样过。夕樱比你后到，一进门就躺进客厅，说这是我家、休息是理所当然的。你走到照片前合上掌。背后有人轻声说：好好、祈祷吧。",
      "第五章": "夜里，玖玖里坐在客厅的地毯上，忽然说起你和井土谷小姐的关系很不可思议，说你明明感慨过自己没有朋友，却有那样一个人在身边。你含糊应了一句。她把身子转过来，一路追到最里面：你、喜欢煤谷同学吗，是把她当做女生、爱着她吗。房间里只有冰箱的压缩机在响。你沉默了很久，手指停在桌沿上。",
      "第八章": "多年前的医院走廊没有开灯，你却记得每一块地砖的凉。姐姐推开病房门，说趁现在逃走，牵着你就往外跑。跑到一半你才发现方向不对——她指的不是出口，是更深处那间没有开灯的病房。你问能不能开灯，没有人回答。走廊尽头有辆推车在滚，轱辘声一下一下。姐姐的手很凉，握得却很紧，把你往那扇门里带。",
      "第六章": "六年前的冬天，煤谷宗名牵着你和夕樱走进那间小小的民宅，说这里就是你的新家，孩子没必要有所顾虑，因为那不是你应该背负的东西。屋里烧着炉子，有一股木头味。小夜蹲在门口仰头问：为什么父亲、要收养哥哥和夕樱妹妹呢。你想了想，说不知道。她嗯了一声，说，因为有哥哥在。",
      "第十一章": "谈判的房间里灯开得很亮，地板是凉的。你趴在那儿说，我不会抛弃任何一个，我会拯救所有人。茅崎征士站在你面前，只回了一句「你真是个无趣的人啊」，然后一脚踢在你的侧腹上，你的呼吸断成两半。久末紫子问他是不是不知道追二兔者一兔不得。你重复了一遍不会抛弃。玄关那边传来夕樱喊你名字的声音。",
      "第十三章": "二月的雨落在巷子里，把霓虹灯的光泡成一片。你跪在积水里，额头抵着地面，说拜托了、紫子小姐，请把夕樱还给我，只要你答应，你要我做牛做马都可以。雨顺着后颈流进衣领。紫子的鞋尖在你面前停了一下，问你，我可以认为你选择舍弃汐入玖玖里吧。征士在旁边笑，伞沿上的水一滴一滴砸下来。",
      "第十二章": "凯旋门的牌桌上只点了一盏吊灯，桌布擦得能照出灯影。煤谷小夜坐在荷官的位置上，手很稳，声音也很稳，报出洗好的牌数。夕樱坐在你对面，把椅子往前挪了半寸，说小夜姐别担心，我不会输的，就算是为了小夜姐我也会赢。小夜停了一下，说我现在只不过是一个荷官，请集中精神在对决上。牌从她手里滑出来，摊在你面前。",
      "第十五章": "情人节之夜的公园里，路灯把树影铺在步道上。摇站在你面前，把手伸了过来，掌心上什么也没有。你的手抬起来，在碰到她之前停住了。你说，抱歉，我不想跟你携手。她愣了一下，把「原来如此」重复了几遍，然后抬眼，脸上的表情一点点变掉。夕樱站在几步外，一句话也没有。风把她围巾的尾巴吹起来又落下。",
      "第十四章": "二月十三日的夜里，你提着袋子敲开茅崎家的门。厨房里已经有一股甜到发苦的味道，锅里的黑色东西咕嘟作响，冒起一个泡又破掉。夕樱回过头，木勺举在半空，说没礼貌，什么叫黑魔法啊，人家特意在哥哥出门的时候把你叫过来欸。你把袋子放到台面上。她说，麻烦帮我买一下兔子的内脏，尽量要新鲜的。",
      "第十章": "生日聚会散场的时候，活动室里还留着蛋糕盒子。夕樱站起来说自己喝得有点醉了，要去外面散散热，还笑着说爱晚风。走到门口她回头喊了一句保重，喊得比谁都夸张，摇笑她戏太多。门在她身后合上。你收拾桌上的纸盘，把蜡烛一根根拔下来，蜡油凝在盘边上。走廊的灯亮了一会儿，又灭了。",
      "第四章": "十一月的下午，你穿着校服走在商店街上，霓虹灯还没亮。久末紫子在街角叫住你，说啊呀、在这种地方碰到，真巧呢，随即自己否掉——现在是上学时间，一个高中生在这种地方晃本来就不巧。她把手套理了理，说真冷淡，对以前的主人稍微亲切一点也没事吧。她抬眼看你，问你在赌场玩过没有。风把她的外套下摆掀起来。"
    },
    "summerpockets": {
      "序章": "渡轮靠岸前的广播在甲板上重复播报，乘客一个个从舱里冒出来。你一直站在栏杆边看那座岛：绿意覆盖的低矮山峦连成一片，沿海沙滩旁零星立着几栋小房，是一座用几天就能走遍的小岛。你在这之前连它的名字都不知道。海风把衣服吹得贴在背上，栏杆被太阳晒得温的。身旁不知何时多了一位拖着行李箱的老奶奶，她一句一句反问：「你说谁是满身疮痍的候鸟？」铁梯被人从码头上放下来，磕在船侧。",
      "第一章": "早饭是螃蟹炒饭。你坐在加藤家的矮桌旁边，先问螃蟹是从哪弄来的，又吐槽为什么早饭一定要是炒饭。海己回得干脆：那是当然。锅还在灶上留着余温，油的味道混着蟹壳的腥鲜。你顺口说鸡胸肉脂肪少、蛋白质多，对塑造体形很好，她的眼神立刻变得微妙，追问一句能不能促进胸部发育，你连忙道歉。她把碗推到你面前，勺子插在饭里，饭面上卧着一小块蟹肉。墙外的广播体操音乐已经响起来了。",
      "第三章": "海己从走廊那头过来，手里还端着杯子，说鸣濑小姐打过电话来，只留下一句「我在游泳池等你」，说完还认真问你们是不是要决斗。你只能让她别用那种危险的说法。午后的加藤家很静，风扇在屋顶上转，客厅的纸门半开着，海的味道从院子里透进来。你把手里的东西放下，站在玄关想了两秒，先找伞还是先找鞋。蝉声在墙外一阵一阵地压下来。",
      "第二章": "白羽又一次守在粗点心屋旁边，膝盖并着，鞋尖对着店门，说刚刚进了货。店门口的帘子被风翻起一角，玻璃柜里排着冰棒，冷气从缝里漏出来一点。你这才明白，这已经不是嘴馋的程度，而是一件她明明想做、却必须偷偷做的事。她说完就看着地面，不再说话。你问要不要替她去取，她抬眼看了你一下，又低下去。树上的蝉在头顶叫得没有空隙。",
      "第五章": "你带着羽未走到鸣濑家门口，宅院比想象中壮观，石墙一路砌到拐角，树影压在门板上。羽未轻声说了一句「爷爷的房子」。你刚伸手要按门铃，门就从里面开了：一个筋骨强健、满身旧伤的老人站在那里，粗声问：「你谁啊？」你报上自己是白羽小姐的朋友，被瞪了一眼，只得到两个字——进来，还有一句「老朽不会再说第二遍」。羽未在你身边抖个不停，抓着你衣角的手指一直用着力。",
      "第六章": "你在森林里睁开眼，脑子里一片空白——不知道自己是谁，也不知道为什么会在这里。身体重得抬不起来，到处都在疼，脚上使不出力气。山路的土是湿的，树叶上还挂着水。你沿着坡往下走，被一场骤雨逼进一间小屋，就那么昏睡过去。再醒来时，身边有鸡在叫；你躺在别人家宅院的鸡舍里，脸旁边是一只挂着名牌「凯瑟琳」的鸡。玄关的门被推开，一个像岩石一样粗壮的男人走出来。",
      "第四章": "夏天开头多了一个人。羽未住在加藤家，跟着你走早操、吃早饭、看只有四个频道的电视。早操时她会跟着那个自称最喜欢广播体操的人一起转圈，动作总是慢半拍。她话很少，怕生，被问想做什么也只摇头。你耐心地问下去，才问出一句：她想和妈妈一起做事情。你说那就去求镜子阿姨把她妈妈叫到岛上来，羽未把头摇了一下：「不在了……妈妈她，已经……不在了。」院子里晒着的网在风里轻轻摆。你蹲下来，一时找不到下一句。"
    },
    "theo": {
      "序章": "你站在悉尼这间公寓的厨房里，晚饭前的时间，窗还亮着。信纸压在台面上，钢笔尖在墨水瓶口磕了两下，你写下「露娜大人」，接着写这里的夏天并不酷热，写你不知道东京的日光有多强。抽屉里已经压着一叠不会寄出去的信。门被推开，大藏衣远站在门口：「游星，有急事了。要在明天之内返回日本，你也给我做好出发的准备」。你顺手把那张纸压到食谱底下。",
      "第一章": "青山这间房的正午很安静，楼下不知谁家的电视在放棒球解说。你把两份午餐摆上折叠桌，妹妹抱着靠垫坐在对面，看都没看那盘菜：「非要说的话，我想吃不是血脉相连的哥哥做的东西，还有请不要再说敬语了」。马场先生的座位今天空着。你捏着抹布停在半空，应了一声「是」，她立刻把靠垫拍在膝上。",
      "第七章": "四月上旬的清晨，橱窗里已经换成冬装，风从塞纳河那边过来，把手背吹起一层细粒。你照例向遛狗的中年女性点头，她戒备着应了一声，牵着狗走开了。地铁口的台阶上有积水。梅丽尔在旁边替她找理由：说不定，她没有发现和她打招呼的是同一人吧。你把围巾的结重新收紧了一点。",
      "第三章": "地下工作室的灯泡黄得发闷，缝纫机一响，水泥地都跟着震。你刚被房东从楼上赶下来，进门就看见两个人蹲在布堆里拆衣服，剪刀顺着缝线一路走。抱着一堆旧衣的女孩抬起头：「这些衣服，你全部拿去用也没关系啦。因为是扔了不要的，随便你怎么拆」。梅丽尔报了名字，说这位就是她的雇主。你把围裙下摆抹平，走进去鞠躬。",
      "第九章": "今年最后一个上课日的早上，里想奈坐在窗边，一开口就拿你打趣：「听说你想要个日本人当男朋友」。你正要说明这话只和布琉艾特提过，视野忽然被人从背后整个盖住，一双胳膊从肩后绕过来，油彩味混着外面的冷气。一个声音大得整条走廊都回头：「这是爱啊爱！这个世界充满了爱！」她的靠垫掉在地上。",
      "第二章": "三月的巴黎午后，香榭丽舍大道的风把你的裙摆吹得贴在小腿上。你拖着一只巨大的行李箱，轮子在石板缝里一跳一跳，橱窗玻璃里映出一个穿女装的亚洲女孩。一个穿黑西装的男人跟你并排走了两步：「走路时肩膀这么紧张僵硬的话，会被当成是好骗的猎物哦」。你说自己很久没来海外，还是紧张。他点点头，扬手就走了。",
      "第五章": "开学前一日的中午，里想奈照旧吃过饭就上楼，横躺在你的床上，脚朝着窗。你趴在桌前画纸样，铅笔在硫酸纸上沙沙响，画到肩线时停住，把笔放下转过身。她抬眼看你：「怎么了？怎么突然停下来了？」你说与其亲手修改，不如从零开始试着制作一件。她张开嘴，半天没合上。",
      "第八章": "休息日的上午，别墅走廊的灰尘攒了两天。你把假发别好，推着吸尘器在里想奈房间的地毯上来回走，机器嗡嗡响。背后传来一句：「为啥我要在自己的房间里，看着穿女仆装的哥哥恶心的样子呢？」你关掉吸尘器，直起腰，说是普朗凯特家的人拜托你收拾。她把窗台上的书挪开，给你让出一条路。",
      "第六章": "开学第二天的清晨，别墅的窗帘只拉了一半，光斜着落在被子上。里想奈整个人埋进枕头，只露出后脑，声音闷在里面：「我，不想去学校了」。你站在床边说，网游的账号不是已经删掉了吗。她翻了个身，把被角揪紧，说只要去到那个世界，谁都会娇惯她。走廊里有人拖着水桶经过，木地板一路响到楼梯口。",
      "第十一章": "长假结束那天的放学后，教室里只剩你们这一圈人，别的桌椅都推到墙边。里想奈把设计图摊在桌上，说从希望最渺茫的自己开始，叫她垫场节目。纸上一只刚羽化的蝴蝶，配一件男装。整圈人都不出声。梅丽尔先开口：「这是适合在服装展上展出的设计」。窗外操场有人在收球网，铁链一节一节地响。",
      "第十七章": "试缝结束、布料也裁剪完的第二天，迪特琳德带着瓦莉站在餐厅里跟房东谈判。她说不要奢侈，只要一个能不惜时间协助缝制的环境：「从今天开始我要在这里叨扰了」。房东抱着手臂一句句往回挡：房子没法扩大、房间里没有电视。你端着一壶茶站在旁边，桌上摊着昨晚剩下的半条面包。",
      "第十三章": "还有三天就到四月。你换下女仆装，穿上男装去赴约。指定的走廊尽头只有一间房门虚掩，屋里没开顶灯。大藏衣远坐在靠窗的椅子上，半句寒暄都没有：「上次见面还是过年的时候，弟弟啊。你今天貌似没穿那令人作呕的变装」。你把手插在口袋里，说今天是来复仇的。他终于抬起眼。",
      "第十二章": "寒假第一天的上午，你把女仆装换上，正一层层擦窗台的灰。这栋楼的房间本来东西就少，收拾起来很快，快中午时门被敲响。里想奈站在门口，第一句话不是寒暄：「为什么穿着女仆装」。你手里还捏着抹布。她绕过你进屋，把冰箱门拉开看了看，说那种带轻飘飘装饰的才叫 cosplay。厨房里的红茶壶开始叫。",
      "第十五章": "起程当日的白天，教室的桌上还摊着半成品的衣片。你把话说得很慢：自家的小仓要回老家一个星期，最长可能一个月，衣服还没做完，非常抱歉。华花回得干脆：「不用饱含诚心也能搞定。既然父母有事，请赶紧回去吧」。露娜和尤希尔要看实物。你把纸样一张一张卷起来，塞进筒里。",
      "第十八章": "十一月十四日深夜，地下工作室的灯全开着，屋里的人只睡了一个小时。你把能拜托的工作一件件收尾，说明天彩排前提交之前自己还要再改。迪特琳德先反应过来，喊出那句结束啦，瓦莉已经在用俄语讨炸包子和罗宋汤。房东端来一大锅炖菜和切好的面包。你把手上的粉笔灰在围裙上拍了拍。",
      "第十六章": "露娜一行回日本的那天早上，送别就摆在公寓门口。行李箱的轮子卡在门槛上，你伸手替她抬了一把。她说这次真的要告别了，希望下次以日本分校优胜者、巴黎总校优胜者的身份再和你们竞争。里想奈回得很硬气。梅丽尔在旁边小声说自己也想去日本看看。风把公寓的招牌吹得晃。",
      "第十四章": "十月初的深夜，公园里只剩一盏路灯。你先认出的是声音，然后才是人。染井吉野的枝条在风里擦出细响，树下站着一个人：「朝日，好久不见」。那句「我很想你」跟着落下来。你手里的塑料袋滑了一下，勒在指节上，往前走了两步，脚下踩着落下来的枯叶。远处住宅区的窗还亮着两格。",
      "第十章": "新年第一天的上午，公寓里安静得能听见水管的声音，灯罩压得很低。你坐在桌前铺开信纸，第一段写的是看了菲利亚圣诞时装展的录像——樱公馆只拿到第二名，瑞穗走上 T 台时你脑袋发热。写到中段，笔就慢了。窗外有人在放鞭炮，很远。你把纸推平，在最后写上「小仓朝日，满怀爱意。于此敬上」，然后折成三折。",
      "第四章": "夜里两点多，二楼这间房的台灯只开了一格。里想奈把外套叠在膝上坐在床沿，语速很快，像在背别人的台词：她学着大哥的调子重复那句「让游星逃掉了？」，然后告诉你她只答了「没有」。街对面的百叶帘被风推得轻轻撞在窗框上。你把桌上那杯凉掉的茶往她手边推了推。"
    },
    "tiannv2": {
      "序章": "白银周结束后的第一个工作日，车厢里却还挤。你靠窗读一本小说，窗外是红黄橙三色的山，据说今年上色比往年都早。一个拉着大号行李箱的同龄少女在你旁边坐下，抬箱子的时候列车正好开动，她晃了一下。你伸手替她把箱子横着放上去。她站直了，郑重地朝你鞠了一躬，然后坐下，之后再没说话。",
      "第一章": "你睁眼的时候，玲已经换好校服站在旁边看着你，问今天需要打扫外面吗。这天本来不是街坊一起扫落叶的日子，可她握着扫帚的样子很有干劲。你只好说，我们打扫一下吧。流茶屋街的早晨有雾，石板缝里积着湿叶子。千岁从隔壁门口出来，把扫帚递给你，说小玲在很积极地帮忙呢。风一吹，叶子又落下来一片。",
      "第七章": "初雪过后，来黑濑温泉看雪景的游客多了起来。川床已经换成冬天的样子：纸伞换了红色的，席上摆着被炉。你顺着台阶走下去时，结灯正坐在入口附近张望，看见人就站起来跑过来，一手还按着围裙，说一位客人，我来为您带路……我一直在等你哦。她把热茶放到你面前，退开半步，偷偷看你。",
      "第三章": "午休铃响过没多久，走廊上就有脚步停在你教室门口。玲站在那里，说了句打扰了，当着满屋前辈的面说，我们吃午饭吧，宝泉和小渊都愣住了。你只能解释一句，表妹。天台的门被她推开，风灌进来。她已经铺好野餐垫，垫子只有一席，两个人只能挨着坐。她把便当盒打开，然后侧过脸一直盯着你看。",
      "第九章": "二十五日天还没亮，你就醒了。结灯还睡着，呼吸很轻。你悄悄钻出被窝，套上外套出门。外面比白鹭市还冷，呼出的气都是白的，路上一个人也没有。车站的投币式储物柜上结着一层薄霜，你把补足的金额一枚枚投进去，取出那个比看起来要轻的大包裹扛在肩上，一路念着你可千万要继续睡着啊。",
      "第二章": "晚饭桌上只有碗筷的声音。千岁买了应季的鲭鱼，端上来时还冒着热气，把盘子往中间推了推。玲把萝卜泥堆在鱼肉上，一小口一小口地吃。你脑子里全是黑姬同学的事。千岁终于放下筷子，说因为今天……你们两个都一言不发。玲抬起头，说很好吃。你补了一句油脂很足、很下饭，她点点头，说我明白。",
      "第五章": "城白祭后的补休日，店里没什么客人。你把同一张桌子擦了两遍，抹布在桌角绕了一圈又绕回来。千岁在吧台后面看着，笑着问你整个人是不是都松懈下来了。你说文化祭忙过头了。她问，我看你一脸开心的样子，你在想谁呢。门口的风铃响了一下，有人推门进来。你手里的抹布还湿着，慌忙往围裙上按了按。",
      "第八章": "十二月的清晨，石板路上还留着前几天的雪痕。结灯站在你家门前，来回走。她把手插进大衣口袋，又拿出来，反复了好几次，嘴里念着该、该怎么办啊，再、再走一个来回再考虑吧。她绕到第二圈的时候，门从里面开了。千岁探出半个身子，说哎呀，小结灯，早上好呀。她整个人弹了起来。",
      "第六章": "早上走进教室，邻座的黑姬同学已经先到了。视线一碰上，她把书包带攥了一下，挤出一句「早……上好」。你也僵硬地回了同样一句。她立刻低下头去翻课本，翻了三页都没翻过去。有人在开窗，有人把椅子拖得响。你在心里找话，说了一句最近天气一下子冷起来了啊，她立刻大声应和。抽屉里还摊着昨天的笔记。",
      "第十一章": "你在白鹭站接到结灯，她一路小跑过来，围巾歪着，声音比平时高半度，说马上就是一大活动了呢。你以为她说的是情人节。她停下脚步纠正：在那之前，不是还有节分吗？而且她在意的不是惠方卷，是撒豆子。她说萤桥那天会办撒豆子活动，还正经取得了行政许可。路边的残雪堆着，她一脚踩上去，回头看你有没有在看。",
      "第十章": "结灯回老家已经三天，一条消息都没发来。你坐在房间的地板上，一遍遍把手机翻过来又翻回去，屏幕亮了又暗。她家家教严，也许在家里不能随便用手机——这个理由连你自己都说服不了。手机突然响起来时你手忙脚乱，还没看清来电显示就喊出了她的名字。屏幕上确实是结灯。她先道歉，然后问现在，有时间吗。",
      "第四章": "放学后的烹饪教室，围裙一条条挂上钩子。千岁站在全班面前宣布：2年C班的文化祭项目，可丽饼制作练习，现在就开始吧。分组是两人一组，宝泉大概是看你和黑姬同学常待在一起，把你们排在同一个台面。她先瞪了你很久，才转回去看食谱。你把鸡蛋敲进碗里，说为了不起块，诀窍就是一点点地混合。"
    },
    "tiannv25": {
      "序章": "你坐电车从隔壁镇过来，下车第一件事是接老爸的电话。他因为高升搬去了别处，往后父子要分开住，你嘴上说着没事，挂了才环顾这个从今天起要照顾你的小镇。铁轨清得干净，车站四周一片银白，仅仅几公里的差距，积雪量却完全不在一个量级。候车室的暖炉前坐着一个年纪比你稍小的女孩，抱着膝盖，冻得发白的脸上写满不满。你多看了两眼，还是把行李袋提起来，先去把转学申请书交掉。",
      "第一章": "放学回家的路上，你看见前面那抹黑色长发，顺口打了招呼。她说自己只是被使唤去买东西，谈不上辛苦，又反问「说讨厌买东西到底是什么意思」，一脸认真地困惑。晚上你去车站接要住宿的客人，候车室里那个熟悉的身影又坐在那儿，抱着膝盖，满脸不满，百无聊赖。这是第四次了。「你在等谁吗？」她立刻顶回来：「我没在等人。」站台的灯先亮了。",
      "第七章": "惩罚进入第二天，你得提前出门去参加志愿活动，让奏酱稍后由祖父送过去。刚要出门，穗波就找上门来了，在大厅里坐立不安地等着。「外面冷不冷？」「毕竟是雪国嘛。」等你拿好外套和书包出来，她整个人贴上来，紧紧抱住你的手臂。路上她一边抱着你的手臂东张西望，一边问美化活动是不是就是打扫卫生。「今天也……很喜欢你……」她把脸抬起来。",
      "第三章": "考试周第一天，你大清早扫完雪，考完试端着托盘去食堂，碰见一之濑，问她考得如何。「都是以前学校学过的范围，并不觉得难。」奏酱被班上一群同学闹哄哄地拉去图书馆补课。一年级教室里空荡荡的，你新奇地打量着别人的教室，戴上耳机边听歌边学，顺手漏出一点旋律。她抬头：「直接听比较快啦。」你把耳机递过去，她只接过一侧。线不够长，她只能探身过来。",
      "第九章": "天光刚亮，被窝里是两个人的体温。往常只有你一个人的身子早就冷得发僵，这个冬天却一次也没有过。穗波还在睡，离起床还有一会儿，你侧躺着看她的睡颜，忍不住轻声说「真的……能和穗波成为恋人……太好了」，又说「我好喜欢你」，然后吻了她。她眼皮懒懒地眨了两下，把脸往枕头里埋了一截，又飞快地在你脸上亲了一下。",
      "第二章": "早上和奏酱一起出门，你把昨天打听到的关于一之濑的消息整理成推断讲给她听：那个女孩也是寄宿生，被寄宿在山之内庄。午休你照例去图书馆还书，借阅台后面没人——图书委员高社雪静坐在更里侧的桌子前，正在给旧书修补加固，工具用得行云流水，动作里没有半点犹豫。你站在书架后看了一会儿。她一抬头，慌慌张张地跑回借阅台，说话又开始结巴。",
      "第五章": "年末的最后几天，旅馆门前只剩积雪和一对门松。你刚挂断和老爸的电话——把交了女朋友的事说了出去，那头吃惊得不行，最后只丢下一句「要好好珍惜人家」。你把昨天摆好的门松调正，重新清扫门前，心里想着昨天没见到穗波。正这么想着，一声「你好」从雪地里传过来，她就站在那儿，围巾上还落着碎雪。「干嘛？　直勾勾地盯着我看。」",
      "第八章": "中午，穗波把奏、雪静和泪香三个人一起叫到了午休的饭桌前——往常这个时间她都和你一起吃。她带来的不只是话，还有包好的便当袋，炸鸡块、玉子烧这些经典的菜色一样不缺，是四个人的份。「这便当，真的可以收下吗……？」「能和我们一起吃午饭……还真是少见呢……」她把便当盒一个个推过去，深吸了一口气：「希望你们边吃边听我说。」",
      "第六章": "被窝里睡了不知多久，天黑下来的时候你先醒，穗波还蜷着，扭着身子不肯看你。「很疼的哦……♪」她说完才转过头问你舒不舒服。你这才注意到自己手指上有深深的咬痕，稍微破了点皮还渗着血，她抓过那根手指又是道歉又是亲吻，说要消毒。你笑说比起她承受的痛楚这根本不算什么。她把被角往上拉了拉：「在男朋友家里过夜……总觉得，」",
      "第四章": "休息日的早上，你一边在外面打扫一边深呼吸，心里反复念着得做个决定了。商店街碰见一之濑，她先盯着你看了半天，才问平常是不是要扫雪，说想买一把自己专属的扫雪工具。两人去了家居建材市场，你把货架上的东西一样样讲给她听：推雪铲轻、柄长、面积大，遇到结冰的雪就不好使；铝制的能应付大部分硬雪，缺点是重。「我就选这个了！！」她扛起那把铲子。"
    },
    "tiannv3": {
      "序章": "暑假只剩最后几天，防波堤上没有风，海面平得像一块铁。你把新换的沙蚕挂上钩，再一次把线垂下去。浮漂一动不动，等你提起来时，鱼饵又被吃掉了。你啧了一声，说这就是现在的我啊。太阳还挂在防波堤上方，天空大得让你有点无处可放。你收线，再从盒子里取出一条沙蚕，掐成两段挂上去。",
      "第一章": "早上六点半，陌生的天花板被朝阳照出一条长缝。你在很温柔的声音里睁眼，看见一张脸就在旁边——斑鸠学姐正俯身看着你，金色的头发被光打得发亮。她说，大人，请您醒来吧，因为是早晨，所以前来叫您起床，叫您起床反倒是我的职责。你撑起半边身子，被子滑下去。窗外中庭里有人在扫地，扫帚刮过砂砾的声音一下一下。",
      "第七章": "期末考逼近，放学后几个人留在教室里开学习会。地藏趴在桌上哀叹天空那么蓝、季节却这么阴郁，还担心挂科会连修学旅行一起泡汤。窗外的蝉已经叫得没力气。你正写着公式，走廊上传来跑步声，门被推开，叶梦哭着冲进来，喊前辈，救救我，一头扑到你身上。你的笔在纸上拖出一道长长的黑线。",
      "第三章": "由语的傍晚直播开始得意外地早，你没时间回宿舍，索性坐在中庭的长椅上，把手机架在膝头。屏幕里那只自称妖狐的女孩挥着袖子说，鱿鱼丝们，你好dolce。你看完还舍不得关，翻起她以前的切片集锦。这时旁边探过来一张脸，叶梦比着手势问你在看什么，近得让你往后仰。她问，真的？你也是鱿鱼丝？",
      "第九章": "你刚走进谈话室就听见里面很吵。叶梦已经打扮好了，一身又可爱又带点艳的衣服，胸口并没有露，款式却把形状衬得更明显，只有耳环还是往常那一只。她转过身问怎么样，你说超棒的，她高兴得当场自拍上传。纱由美小声打趣你看入迷了，你慌忙回房换衣服。出门时全员送到玄关，她把手伸过来，你牵住。",
      "第二章": "导览结束的时候，温泉街的灯一盏盏亮起来。冬桦站在桥边，说住处已经妥善准备好，还得意地报出名字：乐乐浦寮。叶梦喊出我们住的也是那个乐乐浦寮哦，冬桦当场把这归为命运的安排。纱由美压低声音问你是不是早就知道，你摇头。于是带路变成送人回家。巷口，穿女仆装的蕾蒂已经站在那里，弯腰说御所院大人欢迎您大驾光临。",
      "第五章": "午休的中庭里，叶梦正坐在长椅上给一年级的朋友做美甲，小瓶子在膝盖上一字排开，空气里有一股很淡的丙酮味。她一边涂一边说话，围着她的几个女生笑个不停。她看见你在旁边看，就把涂好的指尖伸过来问好不好看。光落在那些亮片上，一闪一闪。她说，前辈，其实我有一件事想拜托你。",
      "第八章": "祭典第二部当夜，温泉街主干道的摊位一摊挨着一摊，烤鱿鱼的烟在灯笼下飘。你跑得满身是汗，叶梦在人群里笑你汗也太夸张了。你说宿舍就在附近，回去快速换身衣服，她也正好想歇一会儿。等你穿着浴衣出来，她站在原地愣了一下，然后走过来，替你把腰带重新整理了一遍，说这样就完美了。",
      "第六章": "叶梦把你约到中庭，坐在长椅上把手机举到两人中间，说之前拍的照片做成报道啦，我们一起来看看吧。屏幕太小，字看不清，她索性把身子贴上来，肩膀抵着你的手臂，说这算是感谢你帮忙的谢礼。报道里夕阳下那座桥拍得很好。你看着屏幕，视线却偏了半寸，被她当场点破，笑着说学长也太喜欢胸部了吧。",
      "第十一章": "七月的清晨，你醒来时屋里已经没人了。走到谈话室，先闻到一股烧焦味。叶梦站在厨房里，围裙系得歪歪的，平底锅里躺着一个黑边荷包蛋，油烟直往上翻。她回过头说，我本想做个煎蛋，结果不知怎么就煎糊了。你走过去问她加水了吗，她一脸茫然地反问，水？锅铲还举在半空。",
      "第十三章": "祭典最后的周末，新款化妆品体验会一开摊就排起了队。叶梦站在最前面招呼，声音穿过整条街；冬桦在旁边认真邀请人进来亲身体验，纱由美负责解说，蕾蒂穿着女仆装递试用装。桌上一排指甲油像小玻璃糖。你被叫去维持秩序，一边喊队尾在这边，一边看见一个一年级女生盯着蕾蒂的手，问自己能不能也变成那样。",
      "第十二章": "你把手机按灭，转身去找姐姐。厨房里还留着早饭的味道，台面上空空荡荡。你问姐姐能不能教你做饭，说查了菜谱但看不太懂、感觉会失败，还是跟她学比较容易成功。姐姐停下手里的活，问你是想做什么。你从钩子上把围裙取下来，绕在腰上，说，我想做饭给喜欢的人吃。",
      "第十章": "为宣传册拍摄的那天早上，叶梦一早换上了校服，站在谈话室的窗边等你。你愣了一下才开口：好久没见你穿校服的样子了，真不错啊。她笑着摆了个姿势，又贴上来，说虽然热，可和前辈贴在一起就好舒服。她戳了戳你的脸，说今天试了带闪粉的唇膏，所以特别闪亮。厨房那边传出味增汤要煮开的声音。",
      "第四章": "今天五个人一起出门，柳木同学隔着一段距离跟在后面。叶梦走在稍前面，一路拍照又自拍，说下个月开始就是祭典季，所以她打算从今天起每天在AZ上投稿温泉街的事。走到桥上，她停下来对着河举起手机。冬桦凑过去看那条刚发出去的动态，问屏幕上那一千个海豹是什么。叶梦把手机递过去，说你也可以发一条试试。"
    },
    "tsuki": {
      "序章": "房间里只开着台灯，你坐在床上翻这月的时装杂志，指尖顺着玛拉杰拉那条裙摆的剪裁走，又翻到温卡罗的螺旋喇叭形，嘴里念着「不会觉得想要看看纸样吗」。里想奈窝在你房间的地上吃薯片，渣掉了一地，回头第一句是：「现在大藏家那些烦死人的家伙又不在，那个『大人』就请不要再叫了。」她说完又伸手进袋子里。",
      "第一章": "上任第一天的上午，你从六本木新城往青山方向走，假发压在额头上，裙摆一下一下扫过小腿。这条街上每个人身上的东西都像精心挑过，你不敢和任何人对视，越往前走脸越烫，汗把粉底泡得发黏。一个留小胡子的男人忽然横到面前：「不好意思！我是『FAT』杂志的记者，希望您能让我们拍一张快照……哎、哎呀？」你张了张嘴，喉咙里冒出来的是男人的说法，手里的包带被攥得发皱。",
      "第七章": "地下工作室的灯亮到后半夜，粗纺棉布摊在工作台上，针脚一行行排开，试缝全是手工缝的。你弯着腰拆一段袖子，线头挑起来的时候指尖发麻。露娜的方针只有一句——「不允许在制作上跟我们客气，为了完成度，朝日你要记住把脸皮放厚」；可改到第三遍，还是你一个人含着泪缝完的。你把针插回针插，锁门，顺着台阶往上走，手机第一次有了信号。",
      "第三章": "客人出门的前一晚，走廊的灯已经熄了大半。你站在樱小路露娜的房门前，把要说的话在心里排了三遍，才抬手敲门。门开了一条缝，她坐在椅子上，笔还夹在指间。「露娜大人，关于明天的事，能让我留在公馆，服侍露娜大人吗。」她看了你一会儿，把笔放下：「我本来一直对你有所期待，觉得你是不会给我出难题的人。」门缝里的光落在她膝头那叠纸上。",
      "第九章": "早饭还没摆齐，八千代就把你和露娜堵在食堂门口，第一句话是「我听到了一些奇怪的传言」。露娜不接，先教你怎么应对，说着伸手戳你的胳肢窝：「不要逃到我手够不到的地方去哦，这是命令。」八千代没有笑：「露娜大人和小仓小姐是朋友吗，我听说你们关系好得超越了主从的界线。」你端着茶盘站在两个人中间，盘底的水渍在掌心洇开。",
      "第二章": "开学典礼前一天的下午，庭院里的樱花开得正好，三位大小姐围着矮桌喝茶。你端着托盘在花树下来回，袖子挽到手肘，正要给凑续茶，另一头有人喊：「朝日——！如果大小姐没有打发你去做什么事的话，就过来帮我搬下庭院里的盆栽吧！」凑抬头看着屋顶：「话说啊，这间公馆，好像欧洲贵族的居所呢！」你把茶壶换了只手。",
      "第五章": "盛夏的上午，庭院的石板反着白光，蝉从早上一直叫到中午，连走廊的地板都是温的。你穿着长袖和紧身衣裤，在花木之间来回搬盆栽，后背的汗把布料贴住了。「啊，朝日？为什么穿冬装？」「诶，大热天穿长袖，而且还是紧身衣裤！？」你把袖子往上卷了一点，又立刻放下来，指尖在袖口上压了一下。",
      "第八章": "新学期第一天的早上，你在镜子前涂了一层粉底，把眼睛下面的青色按住，才去叫露娜起床。食堂里三个人聊得正热闹：凑说制服真不错，尤希尔说暑假瘦了一圈，瑞穗说多吃点肉就好。凑忽然转向你：「朝日也这样认为吧？」你手里的杯子晃了一下，杯沿磕在托盘上，发出很轻的一声响。",
      "第六章": "凌晨四点半，桌上摊着这一周画出来的上百张设计图，台灯烫得能闻见纸味。你从里面挑出最像样的一张，剩下两张的位置空着，笔放下又拿起来。窗外还是灰的，只有鸟在叫。「徒有数量没有意义，设计图就一人三张」——那句话说过之后没有人反对。你把闹钟按掉，翻开新的一张纸，笔尖压上去，纸面陷出一个很小的白点。",
      "第十一章": "被软禁的第三周，你被关在那间房里，门锁着，监视的黑衣人站在走廊里。名波七爱进来时什么也没说，先解外套的扣子：「要做爱了，出去。」门口那位脸都白了，转身跑去打电话。她这才坐到床边，声音低下来：「露娜大人……最近经常关在房间里，和大家在一起的时候也不怎么说话了。」窗外的天光落在她垂着的睫毛上，她一直低着头，一句接一句地往下说。",
      "第十章": "菲利亚的走廊很长，校长室那扇厚木门里传出的话隔着门也听得清。你站在门外，手放在门把上停了很久，另一只手在假发边缘按了一下，指尖顺着发缝摸过去。里面是露娜的声音：「我从一开始就没想过要怀疑里想奈，更重要的是我信赖朝日。背叛什么的，那是不可能的。」门把上的黄铜被手心里的汗捂得发滑。",
      "第四章": "清晨的走廊还留着夜里剩下的凉气。你端着托盘往食堂去，两个前辈一左一右凑上来：「啊，早上好朝日。听说大小姐的衣服快完成了？」话头很快滑到露娜这几年的变化，再滑到她被本家怎样对待。「朝日不知道吗？露娜大人被本家怎么样对待的？」话音没落，尤希尔从转角出来，两个人一个说要去倒垃圾、一个说要去洗衣服，转眼没了影。"
    },
    "tsumi": {
      "序章": "二月中的午后，天上没有太阳，蝉鸣却密得像骤雨，一层压着一层，把耳朵占满。你跟在一个臃肿的中年男人身后，在都内最大的陵园里一排排找墓碑。他汗流浃背，站定后只能张嘴喘气：「啊啊……夕香里……没想到会变成这样……」。你把那束还没拆包装的花往上托了托，说上一束花吗。",
      "第一章": "二月的清晨，窗外的鸟叫先把你从梦里拽出来，然后是耳朵上那一股暖暖的风。夕莉跪在床边，身体探向你，一下又一下地朝你的耳孔里吹气。你还没弄清，被子底下已经起了反应，慌慌张张把毛毯往上拉。她没有追问也没有笑，只问：「……刚刚，舒服吗……？」然后起身出了房间。走廊的地板响了一声。",
      "第七章": "六月中旬的一个清晨，叫醒你的不是夕莉，是父亲的怒吼和一拳。你仰面躺着，后脑没有磕到；嘴唇被自己咬破，嘴里全是血味。你撑起身盯着他，他胸口一起一伏。夕莉穿着睡衣从走廊冲进来，头发乱蓬蓬的，张开手臂把你整个挡在身后。父亲退半步，嘴里冒出来的却是母亲的名字：「……夕，夕香里」。然后甩门走了。",
      "第三章": "四月上旬的一个清晨，你在镜子前把裙腰往外扯了扯，问会不会太奇怪。夕莉站在你身后，从镜子里看你：「没问题的喔」。她说你就像是把人类逼进绝路的美少女。裙摆底下凉飕飕的，你走了两步，手就不自觉去按裙摆。她替你把领口翻好，说腰要直、步子要快。玄关的挂钟已经指向七点。",
      "第九章": "七月上旬的早上，父亲睡在客厅沙发上，身上还是前一晚那身衣服，白衬衫没扎进裤子，胡茬、油汗、一身酒气。夕莉叫他，他只回一句头非常疼，抱着威士忌瓶晃回房间。你们换上衣服瞒着他出门。门口在下雪，你哈出一口白气：「哇啊，下雪了……这样就暖和了吧」，把她的手一起塞进自己的大衣口袋里。",
      "第二章": "三月上旬的清晨，你站在玄关，看夕莉把鞋跟踩实。她回头挥手：「那么，我出发了」。你说路上小心。门一合上，屋里立刻空下来，冰箱的压缩机在厨房里嗡嗡地转。你走到厨房把水壶坐上灶，又不知道该接着做什么。手机屏幕上的时间是七点四十。窗台上那盆没人管的花，叶尖已经黄了。",
      "第五章": "五月下旬，你的房门成了这栋房子里唯一的墙。想和夕莉一起去上学的心情当然是有的，可每次从床上起来、手摸到校服的那一刻，保健室里的画面就会自己跳出来，胃跟着往上顶。夕莉一边抚着你的背一边说没关系的，别勉强自己，于是又请了一天假。手机在枕边震了一下，红色的小点一直挂着。天花板上一块水渍，你数到第三遍。",
      "第八章": "六月下旬的一个清晨，父亲的吼声先到。他对着电话一路骂过去：「闭嘴！！我已经说过了，我不会去的，你个混蛋！！」然后宣布今天要休息，就说到这儿。他还穿着昨晚那身衣服，白衬衫没扎进裤子，胡茬拉碴，抱着威士忌瓶从你们眼前晃回房间。夕莉只轻声问哪里不舒服吗，换来一句头非常疼。你们瞒着他悄悄出门，街上到处是迎接圣诞的灯。",
      "第六章": "六月上旬的放学后，你推开文艺部部室的门，先看见地板上用粉笔画的一圈魔法阵，还有跪在阵中央念念有词的镜子：「恶魔啊恶魔哟……」。你问她到底在做什么，她一本正经地说本来想召梅菲斯托费勒斯，可那位人气太高太忙，只好挑一个级别低一点的。你忍不住吼她，别为了一个小小的文化祭准备就出卖自己的灵魂。她的肩膀一下垮下去。",
      "第四章": "五月上旬的清晨，你打了一个喷嚏，说没事，昨天洗完澡有点受凉，脑袋发沉。夕莉不听，砰地把额头贴上来，贴得近到能数清彼此的呼吸。她说不算太热，但稍微有些发热，要量体温；你说不用，她接着说要从直肠量，把屁股露出来吧。你死死护住被角，说什么也不肯。厨房里的水壶开始响了。"
    },
    "yuanqi": {
      "序章": "四月上旬的傍晚，你和凉花拎着超市的袋子拐过街角，先闻到的是焦味，然后才看见火。你们住的那栋公寓正在烧，火苗从楼上窗户往外舔，热浪隔着一条马路扑到脸上。凉花站在你旁边，很平静地说：「在熊熊燃烧呢」。消防车还没到，围观的人都仰着头。你手里的塑料袋勒得指头发白，里面装着刚买的鸡蛋。",
      "第一章": "五点半多一点，闹钟用一种像踩到什么东西的尖叫把你从床上掀起来。宿舍食堂只开了一排灯，你把大锅坐上灶，切好的洋葱和胡萝卜倒进去，汤还没滚。身后有人开口：「谢谢您这么早为我们准备早饭」。寿珠祈穿着运动服站在门口，额角还有汗。你把汤勺在锅沿上敲了一下。",
      "第七章": "八月的傍晚，宿舍大厅临时摆开两张长桌，只有果汁和点心，一群人围着说恭喜。你和凉花并排坐着，两张脸都绷得像扑克。有人举例子让你们有实感：全家一起去旅行，没感觉；喜欢的玩具可以随便买，凉花连自己喜欢什么都想不起来。这时希未小声问：「请问……您要辞职吗？」大厅静了下来。你手里的纸杯被捏出一道折痕。",
      "第三章": "考试前一周的清晨，闹钟响的时候你脑子里只有一个念头：再睡五分钟。偏偏那支铃是「被妹妹唤醒的幸福哥哥闹钟」的试听音，一声「快醒醒，哥哥～～」把你从床上弹了起来。厨房里你先冲了一杯苦得像中药的浓咖啡。珠祈照例在这个时间出现，说「和您喝一样的」。你把杯子往回一收，说这个你喝不了。",
      "第九章": "这几天甜韵从早满到晚，座位一轮接一轮，绫子和大熊几乎没停过手。你端着一盘可丽饼绕过大堂，听见好几桌客人开口第一句都是「卯卯在吗」。收银台前排着队，人还在往门口看，像在等谁从后厨出来。绫子把手机递到你眼前，屏幕上是那张泳池边的泳装照。你换了只手托盘子，围裙口袋里的点单纸已经写满两面。",
      "第二章": "四月下旬的休息日，商店街的服饰店里响着别人试衣间的帘子声。你挑了件淡粉的衬衫往身上比，凉花看了一眼就判：「粉色是炮王的标配色，罪该万死」。你换回黑色，她又说保守没新意。镜子里的你站在一排衣架中间，还穿着当楼妈以前的旧外套。你转手抽了一件尺寸小一圈的给她。",
      "第五章": "大会结束后数日，暑气把甜韵门口晒得发白。绫子抱着一叠东西找上门，第一句就问你有没有驾照——今年甜韵要出餐车，去夏日庆典摆摊，得有人来开。她说得很直白：「朝思暮想的出摊！不就只能上了么！！」你把菜单从她手里接过来翻了两页，问庆典连开几天。",
      "第八章": "澡堂事故的翌日清晨，食堂的汤锅刚开。希未一边帮忙摆盘子一边追问：昨晚大家被寿同学赶回房间以后，浴室里只剩您和她两个人，那之后该不会「缠缠绵绵翩翩飞」了吧。你把汤勺放下，说寿马上回了自己房间。围着的姑娘们齐声叹气。门被推开，衣川美卯来得晚，一开口就丢下两个字：「色魔」。你把一盘三明治推到她面前。",
      "第六章": "庆典第一天清晨，甜韵门口的玻璃上还蒙着夜里的水汽。餐车只能坐两个人，副驾驶位成了抢手货，几个姑娘堵在门口，有人提议猜拳，有人要摇号。最后是绫子一句话定案：「大熊，麻烦你坐副驾位了」。大熊拎着工具箱从后门出来，裤脚还卷着。你把围裙的系带在背后打了两遍结。",
      "第十一章": "十一月的周末清晨，你煎蛋的动作比平时轻快，还哼了半句。寿和希未一眼就看出来，问您心情不错呀。你还没编好理由，几个姑娘已经凑过来了——不是从 Instagram 上看到的，是衣川本人刚在楼下碰到她们、亲口说的。门口传来一句：「我等不及想早点见到你就来了，仅此而已」。你把锅铲搁在灶沿上。",
      "第十三章": "十二月的某个周末，她有工作委托，没来宿舍。你难得清闲，好好泡了个澡，回来时姑娘们还聚在大厅聊天，有人顺口说没办法把你当异性看待。你抛出一个自认为很劲爆的秘密：衣川美卯其实不是衣川美卯，那是她的活动名。全场毫无反应。有人说连她小测的答案都看过。你手里的易拉罐停在嘴边。",
      "第十二章": "十二月的傍晚，管理员室的暖气开得有点过，你把窗拉开一条缝。门被敲了两下就推开，衣川站在门口，外套还没脱：「啊，工作结束了？」。你说你不是搬出去了吗，当初还说可能会有一阵子见不了面。她走进来，把包放在沙发扶手上，说人家想见你嘛。你把手里的住宿名册合上。",
      "第十五章": "二月的傍晚，她房间里只开了床头灯。她把手机举到你面前，放了一段夜空里一道道流光落下的视频，说新闻报今晚就能看到，她就是看到这条才提起的。你们正商量要不要出去看，她的手机弹出消息，发信人一栏写着「妈妈」。她立刻把消息划掉。你瞟到内容写着我们马上到你那。她把手机反扣在桌上。",
      "第十四章": "休息日的前夜，你去了她的住处。两个人挨在沙发上刷手机，她翻的是女装内容，翻到一件轻飘飘的裙子就转过来：「这种的是不是对你的喜好？」你一看就知道那是哥特萝莉。她说想穿给你看，你说我女朋友穿什么都好看，她当场乐得眯起眼睛。窗外有车经过，灯光从窗帘缝里扫过地板。",
      "第十章": "交往的第二天清晨，你还没把早餐端完，一群刚起床的姑娘就围上来道贺。你端着托盘站在食堂中间，一句都答不上来——自己一个字也没说过，全宿舍却都知道了。答案很快揭晓：衣川把这件事直接发到了 Instagram 上。有人把手机举到你面前，配图是水上乐园的合影。你把托盘放稳，围裙上沾着的面粉白了一片。",
      "第四章": "七月中旬的午后，甜韵还没到营业的时辰，椅子都倒扣在桌上。绫子抱着记事板过来，说今年宿舍准备以「甜韵战队」的名义单独参赛——往年都是混进东陆区联合里，今年是校长不知道什么时候报的名。凉花立刻宣布自己负责后勤。你把抹布搭在肩上，问奖品清单在哪儿。蒲公英已经开始算怎么钻空子。"
    },
    "zhishang": {
      "序章": "四月上旬的午后，渡船的引擎一停，海风和樱花香一起扑过来。你拎着包踏上码头，两年的空白在脚下一沉。妹妹月社妃站在岸上，长发被风吹乱，她单手压着发梢，一脸面无表情：「我讨厌大海，受不了海风吹乱头发。」你把行李换到另一只手，走上那条海岸小路。森林深处飘来书和油墨的味道。",
      "第一章": "暴风雨像骗人一样过去了。四月中旬的早晨，日向彼方走在你旁边，步子轻得反常，说这是她第一次和男孩子一起上学。半路上她说脚痛得走不了，逼你把肩膀借出来。她偎着你往前走，一路说不要留下她一个人。你反应过来时，一辆卡车的车头已经擦到她身侧。你伸手把她拽进怀里，吼声比自己想的还大。",
      "第七章": "十二月的放学后，侦探部活动室的窗对着操场，玻璃上蒙了一层白雾。门被推开一半，游行寺夜子站在门口，没有进来：「——想拜托你们调查游行寺汀的日常生活。」她把脸转向地板，说那个恋妹狂最近几乎看不到人，偶尔碰上，反倒说些让人发毛的话，眼神也像在介意什么。你把椅子往后挪了挪。",
      "第三章": "五月中的一个清晨，叫醒你的方式变了。有人很轻地推你的肩，声音也是不熟悉的温柔细语，蛮横半点都找不到。你睁开眼，游行寺夜子正跪在床边，白发从肩头垂下来。你先怀疑这是幻觉。她见你醒了，反倒困惑地问是不是希望被踩，随即骂了句恶心。窗外的鸟叫得很密，被子的一角还压在她膝下。",
      "第九章": "二月上旬的早晨，食堂的桌上摆着各自凑合的早饭。理央坐过的那把椅子空着，谁都没有坐。游行寺汀一边吃一边唾弃：世界不关心我们，即便谁死了，也没有什么影响。你把筷子放平，说不是这样。他把碗推开，说自己会有段时间不回来，夜子交给你，他要去把魔法之书杀个精光。窗外的森林还挂着霜。",
      "第二章": "四月下旬的傍晚，书房里只开了书桌那一盏灯。出差回来的游行寺暗子坐上夜子平日坐的那张椅子，夜子反倒立在旁边，像被罚站。她把一叠书推到你面前，说冠以宝石名字的魔法之书会响应期待者的愿望，在现实里把故事打开；游行寺家代代私底下以收集、管理这些书为业。你还捏着刚从门厅带进来的钥匙。",
      "第五章": "第二学期第一天的早上，闹钟照旧嚷得刺耳。你在镜子前把校服领口拉正，捂住嘴打掉一个呵欠。走进教室，日向彼方瞥见是你，脸明显扭了一下，随即若无其事地移开目光。你刚坐回自己的位子，她就追到背后贴近来，高声宣布：「你夺走了我的第一次——你要负起责任！」周围同学毫无反应。",
      "第八章": "一月下旬的课后，走廊上人多，一声尖叫把你从原地拽走。你连等在身边的夜子都顾不上，拐过拐角就看见伏见理央按着左肩坐在地上，血顺着胳膊一直滴到鞋边。她一遍遍说不要看。墙边还靠着一个一身古怪打扮的少女，右手握着一把银色小刀，刀尖带血，笑吟吟地叫你「琉璃哥哥」。走廊尽头的窗开着，风灌进来。",
      "第六章": "十一月上旬的傍晚，图书馆的客厅里没有人。早上没见到日向彼方，中午没有，到了傍晚还是没有。壁炉里的火早灭了，桌上那壶红茶凉得发暗。你从走廊尽头走回来，手里还捏着她昨天借走那本书的纸条。楼梯上响起脚步声，游行寺夜子扶着扶手下来，问了一句：「日向彼方去哪了？」",
      "第十一章": "三月上旬的深夜，书房桌上摊着那一页白珍珠。你翻开书页的瞬间，白光铺满整间屋子，脚下的地板像被抽走了——落进去的是另一个人的记忆：游行寺暗子嫁给游行寺家的当家，作为魔法之书的负责人做好了献出性命的准备，旁人却因为她是纸上魔法使的转世而回避她。丈夫护着她，一年之后孩子出生。婴儿的头发是雪白的，眼睛是红的。你的指尖还压在纸边，很久没有翻下去。",
      "第十三章": "五月中旬的深夜，大厅里没有开灯，那本黑色的书自己亮着，把每个人的脸照得都不好看。黑曜石越翻越深，最后几面把最难看的东西全部摊在你眼前：得知这一切的你，一年前在房间里用一条绳子结束了性命，第二天才被夜子发现。读到这一行，你听见自己的呼吸很稳。彼方站在一步之外，怕得不敢靠近。你把手指按在书页上，纸是凉的。",
      "第十二章": "四月上旬的一个深夜，禁书室的门被推开一条缝，走廊的月光切在地板上。夜子抱着膝盖坐在书架之间，脸颊上留着那道自己打出来的红印，手掌反复揉着眼睛，越揉越湿。你站在门口没有出声，她已经伸手从最下层抽出一本像镜面一样反光的书，书页一翻开，屋里的光全被吸了进去。楼梯上有人上楼的声音，又远了。",
      "第十五章": "七月的傍晚，图书馆门前难得有这么大片的阳光。你走回来的时候，门口站着一个布娃娃装束的白发红眼少女，正抬手拨弄头发。不是月光，不是深夜，太阳还没落下去，亮得晃眼。游行寺夜子转过头来，说这样的日子里该读什么小说，答案是「现实，这种当然的故事怎么样？」。彼方在你旁边站住了脚。",
      "第十四章": "六月的一个放学后，你和彼方并肩走回图书馆。理央从前总会在你们回来的时间把门开着，今天门锁着，门铃也像石沉大海。等人终于出现在链条锁后面，那张熟悉的脸却不是平常的理央：「请问哪位？」她隔着门缝说局外人不该与这座图书馆扯上关系，要你即刻回去。你叫了她的名字，她说请不要随便叫我的名字，我不是你的仆人。链条滑了一下，门合上了。",
      "第十章": "三月上旬的深夜，图书馆的大厅里第一次同时挤着六个人，谁都不肯先开口。理央低着头站在你身后，汀罕见地安静，眼睛却在转；夜子快要哭出来，视线躲开你和汀；彼方把最局外人的位置坐得稳稳的；事件的中心月社妃躺在沙发上吃零食看书，跟平常一模一样。最后还是彼方说该确认状况了。你把外套挂到椅背上。",
      "第四章": "六月中旬的那天早上，电话先响起来。父亲从本岛打来，先装出一副关切的样子，随即说出离婚的决定，还在话筒里坚持妃早已原谅他。你就站在走廊转角，听筒里的声音大到不用贴近也能听见。妃从后面过来，一把抢过听筒，冷冷丢下一句永别，把电话扣回座机上。她把手指在裙子上擦了一下。"
    }
  };
  function plotChapterOpening(workId, chapterId) {
    const byWork = PLOT_CHAPTER_OPENINGS[workId];
    if (!byWork) return "";
    return byWork[chapterId] || "";
  }

  function plotChaptersFor(workId) {
    return PLOT_CHAPTERS[workId] || [];
  }
  function plotChapterFor(workId, chapterId) {
    const list = plotChaptersFor(workId);
    return list.find((item) => item.id === chapterId) || list[0] || null;
  }

  function openingWorks() {
    return WORKS.filter((work) => state.settings[work.id]?.enabled !== false);
  }

  /* 作品是否启用：原主角、羁绊、开局三处共用同一套开关 */
  function workIsEnabled(workId) {
    if (!workId) return true;
    const conf = state.settings[workId];
    return !conf || conf.enabled !== false;
  }

  function findPersonById(personId) {
    if (!personId) return null;
    for (const work of WORKS) {
      const person = (work.cast || []).find((item) => item.id === personId);
      if (person) return { work, person };
    }
    return null;
  }

  function personSceneText(found) {
    if (!found) return '';
    const route = personRoute(found.person.id);
    return route.opening || '';
  }

  function currentOpeningScene() {
    const mode = openingMode();
    const work = workById(state.openingWork);
    if (!work) return null;
    if (mode === 'person') {
      const found = findPersonById(state.openingPerson);
      if (!found || !workIsEnabled(found.work.id)) return null;
      return {
        id: `person-${found.person.id}`,
        title: `个人主线 · ${found.person.name}`,
        place: found.work.place || '',
        time: found.work.era || '2018',
        mood: 'PERSON',
        text: personSceneText(found),
      };
    }
    if (mode === 'plot') {
      if (!workIsEnabled(work.id)) return null;
      const chapter = plotChapterFor(work.id, state.openingChapter);
      if (!chapter) return null;
      return {
        id: `plot-${work.id}-${chapter.id}`,
        title: `${work.title} · ${chapter.title}`,
        place: work.place || '',
        time: work.era || '2018',
        mood: 'PLOT',
        text: plotChapterOpening(work.id, chapter.id) || `本局从《${work.title}》的「${chapter.title}」开始。已激活对应章节的剧情细纲，请按该章节的时间、地点与事件流程推进。`,
      };
    }
    if (mode === 'work') {
      if (!workIsEnabled(work.id)) return null;
      const list = work.openings || [];
      const scene = list.find((item) => item.id === state.sceneId) || list[0];
      if (!scene) return null;
      return Object.assign({ mood: scene.mood || 'OPENING' }, scene);
    }
    if (mode === 'city') return cityScene();
    const text = (state.freeOpening || '').trim();
    if (!text) return null;
    return {
      id: 'free',
      title: '我的开场',
      place: work.place || '未定',
      time: work.era || '2018',
      mood: 'FREE',
      text,
    };
  }

  function openingModeLabel(mode) {
    return { city: '都市模式', free: '完全自由', person: '个人主线', plot: '剧情主线' }[mode] || '都市模式';
  }

  function renderOpeningModeTabs() {
    const mode = openingMode();
    $$('#openingV2Tabs [data-open-mode]').forEach((button) => {
      const active = button.getAttribute('data-open-mode') === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const map = { city: '#panelCity', free: '#panelFree', person: '#panelPerson', plot: '#panelPlot' };
    Object.keys(map).forEach((key) => {
      const panel = $(map[key]);
      if (panel) panel.hidden = key !== mode;
    });
  }

  /* 都市模式：一座城（大校园区 / 联合都市区）+ 身份 / 目标 / 区域 + 你的第一步。 */
  const CITY_ZONE_LABEL = { campus: '云下学区', union: '联合都市区' };
  const CITY_IDENTITIES_SCHOOL = ['一年级学生', '二年级学生', '三年级学生', '转学生', '教师', '校务人员', '图书馆管理员'];
  const CITY_IDENTITIES_UNION = ['公司职员', '自由职业者', '咖啡店店员', '旧书店店主', '设计师', '记者', '出租车司机', '夜班工人', '无业'];
  const CITY_GOALS = [
    '社团长，立志要招到第一个成员',
    '穿越者，先稳定成绩活下去！',
    '学生会一员，办好接下来的学园祭！',
    '转学生，先把这座校园摸熟',
    '打工中，攒够下个月的生活费',
  ];
  /* 入学区域：按作品分组，用主要角色的小头像做可视化。 */
  function cityAreaGroups() {
    if (cityZone() === 'campus') {
      return [
        { key: '女子校园区', desc: '女子校为主：少女领域 / 轮舞曲 / 画布 / 芬芳 / 万华镜 / 近月系列 / 纯白（试验班）', works: ['domain', 'waltz', 'canvas', 'kaoru', 'tsumi', 'tsuki', 'theo', 'chunbai'] },
        { key: '混校区', desc: '男女同校与街区混住：飞翔心 / 樱之诗 / 柠水 / 9-nine / 夏日口袋 / 恋爱借走 / 水葬 / 灵感满溢 / 甜蜜女友2·2.5·3 / 缘起 / 纸上 / 花子', works: ['fly', 'sakura', 'lemon', 'nine', 'summerpockets', 'lianai', 'shuizang', 'linggan', 'tiannv2', 'tiannv25', 'tiannv3', 'yuanqi', 'zhishang', 'hanako'] }
      ];
    }
    const groups = new Map();
    openingWorks().forEach((work) => {
      const place = String(work.place || '').trim();
      if (!place) return;
      if (!groups.has(place)) groups.set(place, { key: place, desc: '', works: [] });
      const group = groups.get(place);
      group.works.push(work.id);
    });
    return Array.from(groups.values()).map((group) => Object.assign({}, group, {
      desc: group.works.map((id) => (workById(id) || {}).title || '').filter(Boolean).join(' / ')
    }));
  }

  const CITY_STEP_DEFAULT = '看着校园内人流走动，你也迈出了自己的第一步';

  function cityZone() {
    return state.cityZone === 'union' ? 'union' : 'campus';
  }
  function cityAreaGroup() {
    return cityAreaGroups().find((group) => group.key === state.cityArea) || null;
  }
  function cityIdentityList() {
    return cityZone() === 'union' ? CITY_IDENTITIES_UNION : CITY_IDENTITIES_SCHOOL;
  }
  /* 第四页「自我」填了身份时，都市模式自动带过来。 */
  function syncCityIdentityFromPersona() {
    const p = state.persona;
    const identity = p.mode === 'self' ? String(p.identity || '').trim() : '';
    if (state.cityIdentity && !state.cityIdentityAuto) return;
    if (!identity) {
      state.cityIdentity = '';
      return;
    }
    if (cityZone() === 'union' && /学生|年级|转学/.test(identity)) return;
    state.cityIdentity = identity;
    state.cityIdentityAuto = true;
  }
  /* 这条第一步是不是某个作品预设的原文？是的话返回它的 workId。 */
  function firstStepWorkFor(text) {
    const t = String(text || '').trim();
    if (!t) return '';
    const hit = FIRSTSTEP_WORK_PRESETS.find((preset) => String(preset.text || '').trim() === t);
    return hit ? hit.workId : '';
  }
  function cityStepText() {
    const text = (state.cityStep || '').trim();
    if (!text) return CITY_STEP_DEFAULT;
    const wid = firstStepWorkFor(text);
    if (wid && !workIsEnabled(wid)) return CITY_STEP_DEFAULT;
    return text;
  }

  /* The composed first scene, rebuilt whenever a choice changes. */
  function buildCityOpening() {
    const zone = CITY_ZONE_LABEL[cityZone()];
    const area = (state.cityArea || '').trim();
    const step = cityStepText();
    const group = cityAreaGroup();
    const lines = [];
    lines.push(`【都市模式 · ${zone}】`);
    lines.push('这座城里所有作品同时存在：几所学校、街区与日常彼此相邻，人物会在同一条街上遇见彼此。');
    lines.push('');
    if (cityZone() === 'campus') lines.push('入学区域：' + (area || '未定'));
    lines.push('');
    lines.push('第一幕：');
    lines.push(step);
    return lines.join('\n');
  }

  function cityScene() {
    // Always produce a usable first scene: missing fields fall back to 未定/default.
    const text = (state.cityOpening || '').trim() || buildCityOpening();
    return {
      id: 'city',
      title: `都市开局 · ${CITY_ZONE_LABEL[cityZone()]}`,
      place: (state.cityArea || '').trim() || CITY_ZONE_LABEL[cityZone()],
      time: '2018 · 春',
      mood: 'CITY',
      text,
    };
  }

  function cityChips(list, current, attr) {
    const custom = current && !list.includes(current);
    const chips = list.map((item) => {
      const active = item === current;
      return `<button class="city-chip ${active ? 'is-active' : ''}" type="button" ${attr}="${esc(item)}" aria-pressed="${active}">${esc(item)}</button>`;
    });
    if (custom) chips.push(`<button class="city-chip is-active" type="button" ${attr}="${esc(current)}" aria-pressed="true">${esc(current)}</button>`);
    return chips.join('');
  }

  /* 大校园区按钮：几部作品的封面在背景里渐隐轮播。 */
  function cityCoverSlides(works) {
    const list = works.slice(0, 9);
    return `<span class="city-zone-slides" aria-hidden="true">${list.map((work, index) => `<span class="city-zone-slide" style="background-image:url('${esc(work.cover)}');animation-delay:${index * 4}s"></span>`).join('')}</span>`;
  }

  function cityAreaCard(group, active) {
    const works = openingWorks().filter((work) => group.works.includes(work.id));
    const rows = works.map((work) => {
      const people = (work.cast || []).slice(0, 6);
      const avatars = people.map((person) => {
        const art = CAST_ART[person.name];
        const src = art && (art.normal || art.stage);
        const initial = Array.from(person.name || '?')[0] || '?';
        return `<span class="city-area-avatar" title="${esc(person.name)}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" data-role-art="1">` : esc(initial)}</span>`;
      }).join('');
      return `<span class="city-area-work">
        <span class="city-area-cover" style="background-image:url('${esc(work.cover)}')" aria-hidden="true"></span>
        <span class="city-area-work-copy"><b>${esc(work.title)}</b><small>${people.length} 名主要角色</small></span>
        <span class="city-area-avatars">${avatars}</span>
      </span>`;
    }).join('');
    return `<button class="city-area-card ${active ? 'is-active' : ''}" type="button" data-city-area="${esc(group.key)}" aria-pressed="${active}">
      <span class="city-area-card-head"><b>${esc(group.key)}</b><small>${esc(group.desc)}</small></span>
      <span class="city-area-works">${rows || '<span class="city-area-empty">第二页还没有启用这些作品。</span>'}</span>
    </button>`;
  }

  function renderCityPanel() {
    const zone = cityZone();
    const zones = [
      { id: 'campus', label: '云下学区', sub: '几所学校连成一片的学区' },
      { id: 'union', label: '联合都市区', sub: '二十二部作品的地点融成一座城' },
    ];
    const zoneBox = $('#cityZoneTabs');
    if (zoneBox) {
      const signature = openingWorks().map((work) => work.id).join(',');
      if (zoneBox.dataset.signature !== signature) {
        zoneBox.innerHTML = zones.map((item) => {
          const active = item.id === zone;
          const slides = item.id === 'campus' ? cityCoverSlides(openingWorks()) : '';
          return `<button class="city-zone-tab ${active ? 'is-active' : ''}" type="button" role="tab" data-city-zone="${item.id}" aria-selected="${active}">
            ${slides}
            <b>${item.label}</b><small>${item.sub}</small>
          </button>`;
        }).join('');
        zoneBox.dataset.signature = signature;
      } else {
        $$('#cityZoneTabs .city-zone-tab').forEach((button) => {
          const active = button.getAttribute('data-city-zone') === zone;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-selected', String(active));
        });
      }
    }

    syncCityIdentityFromPersona();
    const identityBox = $('#cityIdentityOptions');
    if (identityBox) identityBox.innerHTML = cityChips(cityIdentityList(), state.cityIdentity, 'data-city-identity');
    const goalBox = $('#cityGoalOptions');
    if (goalBox) goalBox.innerHTML = cityChips(CITY_GOALS, state.cityGoal, 'data-city-goal');

    const areaBox = $('#cityAreaOptions');
    if (areaBox) {
      const groups = cityAreaGroups();
      const known = groups.some((group) => group.key === state.cityArea);
      if (!known) state.cityArea = groups.some((group) => group.key === '混校区') ? '混校区' : (groups[0] ? groups[0].key : '');
      areaBox.innerHTML = groups.map((group) => cityAreaCard(group, group.key === state.cityArea)).join('');
    }

    const identityInput = $('#cityIdentityInput');
    if (identityInput && (shadow.activeElement || HOST_DOC.activeElement) !== identityInput) identityInput.value = state.cityIdentity || '';
    const goalInput = $('#cityGoalInput');
    if (goalInput && (shadow.activeElement || HOST_DOC.activeElement) !== goalInput) goalInput.value = state.cityGoal || '';

    const setNow = (selector, value) => {
      const node = $(selector);
      if (node) node.textContent = value ? value : '还没选';
    };
    setNow('#cityIdentityNow', state.cityIdentity);
    setNow('#cityGoalNow', state.cityGoal);
    setNow('#cityAreaNow', state.cityArea);

    $$('#citySteps .city-step').forEach((step) => {
      const key = step.getAttribute('data-city-step');
      const open = state.cityOpenStep === key;
      step.classList.toggle('is-open', open);
      const body = step.querySelector('.city-step-body');
      if (body) body.hidden = !open;
      const head = step.querySelector('[data-city-toggle]');
      if (head) head.setAttribute('aria-expanded', String(open));
    });

    const stepArea = $('#cityStepText');
    if (stepArea && (shadow.activeElement || HOST_DOC.activeElement) !== stepArea) stepArea.value = cityStepText();
    const stepCount = $('#cityStepCount');
    if (stepCount) stepCount.textContent = `${cityStepText().length} / 300`;

    const note = $('#cityStatusNote');
    if (note) {
      note.textContent = state.cityConfirmed
        ? '已决定：这段已作为开场正文，可以在第六页查看。'
        : '填好后点「决定完毕！」，这段会成为开场正文。';
    }

    const shell = $('#page-opening');
    if (shell) shell.classList.toggle('is-city', openingMode() === 'city');
  }

  const FIRSTSTEP_SPECIAL_PRESETS = [
    { id: 'special-reincarnation', title: '转生来到校园门口', person: '', group: '日常', priority: 999, text: '你前世通宵玩 GALGAME，猝死之后眼睛一闭一睁，居然站在学校门口。晨风把樱花瓣吹到鞋边，上课铃还没响，你手里攥着一张写着陌生名字的学生证。' },
    { id: 'special-feb-school', title: '二月新生，自由挑选学校', person: '', group: '学园', text: '你是二月初入学的新生，拥有自由择校的权力，四处去看看吧！不过首先是部活推销会呢' },
    { id: 'special-crossdress-meet', title: '女装主人公联动，云下校园交流会！', people: ['飞鸟凑', '朝仓千弘', '瑞木信', '真原葵', '小仓朝日', '觋夕摩'], group: '学园', text: '云下校园组织了一场跨校学生代表交流会，各校派出的代表陆续走进会场——白铃女子学园的飞鸟凑、舞城女学园的朝仓千弘（千原直人）、凤后艺术学园的深山瑞希（瑞木信）、樱花女学园的真原葵、菲利亚女子学院的小仓朝日（大藏游星），还有圣卡塔丽娜女子学园的觋夕摩。几道同样纤细的身影在长桌旁落座，交换着看似端庄却暗自留神的目光。你们需要一起进行为期七天的市内考察与合宿出行，而今天负责接待他们的，正是你。' }
  ];

          const FIRSTSTEP_WORK_PRESETS = [
    { id: 'work-yuanqi-0', workId: 'yuanqi', title: '熊熊燃烧呢', person: '八乙女凉花', group: '作品', text: '八乙女凉花站在烧成焦炭的家门口，扭头对你说：「哥哥，我们的家在熊熊燃烧呢。」' },
    { id: 'work-lemon-1', workId: 'lemon', title: '空地上打招呼', group: '作品', text: '你抱着音箱站上那块空地，才想起要先跟管理的人打招呼，惠凪从背后揪住你的衣领往回拖。' },
    { id: 'work-lemon-2', workId: 'lemon', title: '迟到没份', group: '作品', text: '你挤进站前的摩斯，还没坐下，莉莉子就把你那袋薯条抢过去拆了，说迟到的人没有份。' },
    { id: 'work-lemon-3', workId: 'lemon', title: '粥必须吃完', person: '茶园那优花', group: '作品', text: '茶园那优花把锅铲塞进你手里，说姐姐煮的粥必须由你吃完，转头自己先偷尝了一勺。' },
    { id: 'work-lemon-4', workId: 'lemon', title: '猜错不许走', person: '岛越月望', group: '作品', text: '岛越月望把谱子举到你眼前，说猜不出哪一段是她写的就不许走，自己先笑出声。' },
    { id: 'work-lemon-5', workId: 'lemon', title: '封面就用你', person: '二见原莉莉子', group: '作品', text: '二见原莉莉子把手机举到你脸前，说这段素材够发三条，问你标题能不能就用嘴笨王。' },
    { id: 'work-lemon-6', workId: 'lemon', title: '第三小节弹错', person: '砾川美玖', group: '作品', text: '砾川美玖抢过你的谱子，指着第三小节说这里错了三遍，转身自己弹了一遍给你听。' },
    { id: 'work-lemon-7', workId: 'lemon', title: '听完给真话', person: '阳见惠凪', group: '作品', text: '阳见惠凪把耳机扣到你头上，说听完必须给个真话，然后自己捂着耳朵躲到一边。' },
    { id: 'work-lemon-8', workId: 'lemon', title: '查你收藏', person: '隐杏珠', group: '作品', text: '隐杏珠抢过你的手机，说要查你有没有偷偷收藏她的视频，被你抓住手腕就喊变态。' },
    { id: 'work-sakura-1', workId: 'sakura', title: '坡道风大', group: '作品', text: '你爬到浮梦坡半路就喘，里奈从后头追上来，把围巾往你脖子上一绕，说走快点。' },
    { id: 'work-sakura-2', workId: 'sakura', title: '先系围裙', group: '作品', text: '你推开奇美拉的门，铃还没停，真琴隔着柜台喊你先把围裙系上，说今天缺人手。' },
    { id: 'work-sakura-3', workId: 'sakura', title: '本子上添兔子', person: '冰川里奈', group: '作品', text: '冰川里奈趁你不注意，在你速写本上添了一只兔子，说这样才像样，然后笑得笔都拿不住。' },
    { id: 'work-sakura-4', workId: 'sakura', title: '鞋摆成一条线', person: '川内野优美', group: '作品', text: '川内野优美蹲下把你的鞋摆成一条直线，说连鞋都放不好的人，往后连鞋柜也一律归她管。' },
    { id: 'work-sakura-5', workId: 'sakura', title: '只准盖浇饭', person: '鸟谷真琴', group: '作品', text: '鸟谷真琴把菜单拍在你面前，说你只准点牛肉盖浇饭，顺手把五百日元学费的账记上。' },
    { id: 'work-sakura-6', workId: 'sakura', title: '扶稳梯子', person: '夏目蓝', group: '作品', text: '夏目蓝从书架后抽走你手里的书，说这排得先整理好，然后让你扶稳梯子别乱动。' },
    { id: 'work-sakura-7', workId: 'sakura', title: '掐一下脸', person: '夏目雫', group: '作品', text: '夏目雫盯了你半天，说这种时候掐你的脸确实不太合理，说完还是伸手掐了一下。' },
    { id: 'work-sakura-8', workId: 'sakura', title: '顺手多做一份', person: '御樱稟', group: '作品', text: '御樱稟把便当盒推到你面前，说是顺手多做的一份，你一追问，她就叠着字说不出话。' },
    { id: 'work-nine-1', workId: 'nine', title: '石阶上喊你', group: '作品', text: '你爬到白蛇神社石阶一半，上头有人喊你名字，天从栏杆上探出半个身子催你快点。' },
    { id: 'work-nine-2', workId: 'nine', title: '老位子', group: '作品', text: '你推开咖啡馆的门，都从柜台里喊你坐靠窗那桌，说苏打水已经替你点好了，别磨蹭。' },
    { id: 'work-nine-3', workId: 'nine', title: '存档被盖', person: '新海天', group: '作品', text: '新海天把你的存档覆盖了，还理直气壮说这叫新章节，回头就把你房间的门反锁上。' },
    { id: 'work-nine-4', workId: 'nine', title: '便利店不行', person: '九条都', group: '作品', text: '九条都把便当盒从你手里抽走，说你天天吃便利店的不行，转身端来一份自己做的咖喱。' },
    { id: 'work-nine-5', workId: 'nine', title: '三句话', person: '苏菲缇雅', group: '作品', text: '苏菲缇雅在你面前现身，说只给你三句话的时间，说完就抱臂等着，一副随时要走的样子。' },
    { id: 'work-nine-6', workId: 'nine', title: '拎包不许说', person: '香坂春风', group: '作品', text: '香坂春风抬着下巴要你替她拎包，走出两步又小声求你别说出去，说不许笑话她。' },
    { id: 'work-nine-7', workId: 'nine', title: '芭菲你付', person: '结城希亚', group: '作品', text: '结城希亚把芭菲的单子推到你面前，说这顿该你付，理由是她今天制裁过三个坏人。' },
    { id: 'work-domain-1', workId: 'domain', title: '拖鞋先到', group: '作品', text: '你拖着箱子踏进第二宿舍的玄关，一只拖鞋先飞过来砸在门板上，屋里有人喊你快进来。' },
    { id: 'work-domain-2', workId: 'domain', title: '位置留着', group: '作品', text: '你走进教室，椅子还带着暖气，桌上摊着一张写满字的便条，前排的人回头朝你喊，说位置早就留好了。' },
    { id: 'work-domain-3', workId: 'domain', title: '不让位', person: '西园寺风莉', group: '作品', text: '西园寺风莉霸占着沙发不让位，说自己好歹是理事长，你只好把外套铺在地上，她先笑出声。' },
    { id: 'work-domain-4', workId: 'domain', title: '头条定了', person: '贵船柚子', group: '作品', text: '贵船柚子举着相机绕你转了三圈，拍到你打哈欠就跳起来欢呼，说头条定了～♪' },
    { id: 'work-domain-5', workId: 'domain', title: '魔王的命令', person: '大垣日向', group: '作品', text: '大垣日向用扫帚柄戳你后背，库库大笑，说这是魔王的命令，扫完才准回宿舍睡觉。' },
    { id: 'work-domain-6', workId: 'domain', title: '最会处理', person: '皆见美结', group: '作品', text: '皆见美结抱来一叠咨询信放在你桌上，说这些拜托你了，然后替你敲开隔壁的门，人就不见了。' },
    { id: 'work-domain-7', workId: 'domain', title: '代点个名', person: '那波七海', group: '作品', text: '那波七海踩着拖鞋进教室，点名册往你桌上一丢，说今天老娘不点名了，你来，然后趴上讲台补觉。' },
    { id: 'work-tsuki-1', workId: 'tsuki', title: '门自己开了', group: '作品', text: '你顺着长引道走到门口，铁门自己开了，玄关里有人喊你的名字，说今天回来得正好。' },
    { id: 'work-tsuki-2', workId: 'tsuki', title: '缝纫机还热', group: '作品', text: '你推开地下工房的门，缝纫机还热着，有人从布堆后面探头喊你，说快来帮一把手。' },
    { id: 'work-tsuki-3', workId: 'tsuki', title: '挑一块嘛', person: '花之宫瑞穗', group: '作品', text: '花之宫瑞穗把一叠和服布料摊在你膝上，说挑一块嘛，然后先替你定了，说这块最衬你。' },
    { id: 'work-tsuki-4', workId: 'tsuki', title: '才三个钟头', person: '柳之濑凑', group: '作品', text: '柳之濑凑扑上来抱住你的胳膊，喊好久不见了——明明才过三个钟头，然后拽着你去食堂。' },
    { id: 'work-tsuki-5', workId: 'tsuki', title: '还没请安', person: '樱小路露娜', group: '作品', text: '樱小路露娜靠在楼梯口叫你过去，说你今天还没请安，说完自己先笑了，抬手要你低下头。' },
    { id: 'work-tsuki-6', workId: 'tsuki', title: '验毒的说', person: '尤希尔·弗露露·让梅尔', group: '作品', text: '尤希尔·弗露露·让梅尔抢过你的蛋糕先咬一口，说这算是替你验毒的说，然后理直气壮地把盘子端走了。' },
    { id: 'work-fly-1', workId: 'fly', title: '桥头还亮着', group: '作品', text: '你走下无人巴士，桥头的识别装置还亮着，坡上有人朝你挥手喊，说再磨蹭食堂就没菜了。' },
    { id: 'work-fly-2', workId: 'fly', title: '箱子丢下', group: '作品', text: '你抱着箱子站进宿舍一楼的谈话室，沙发上的人一齐回头，有人朝你招手，说箱子丢下就好。' },
    { id: 'work-fly-3', workId: 'fly', title: '饭卡没了', person: '稻羽结衣', group: '作品', text: '稻羽结衣一把抢走你手里的饭卡，说食堂今天有新菜，然后自己先跑了，跑到一半回头催你快点～' },
    { id: 'work-fly-4', workId: 'fly', title: '先拧紧', person: '九条玖琉璃', group: '作品', text: '九条玖琉璃举起扳手抵住你的下巴，说拧紧，理解不能就先拧，然后蹲下去看你的手。' },
    { id: 'work-fly-5', workId: 'fly', title: '请等一下', person: '雪代铃乃', group: '作品', text: '雪代铃乃拽住你的袖子，小声说那个……请等一下，然后躲到墙后，只露出半张脸看你。' },
    { id: 'work-fly-6', workId: 'fly', title: '拜托你了', person: '白鹭茉百合', group: '作品', text: '白鹭茉百合在你旁边坐下，把作业本推到你面前，说这个就拜托你了呢，起身时轻拍了你一下。' },
    { id: 'work-fly-7', workId: 'fly', title: '今晚之前', person: '皇天音', group: '作品', text: '皇天音追在你后面念预算，念到楼梯口才拦住你，说今晚之前核好，然后拖张椅子坐下。' },
    { id: 'work-fly-8', workId: 'fly', title: '别告诉他们', person: '水无濑樱子', group: '作品', text: '水无濑樱子把药盒悄悄塞进你口袋，小声说别告诉他们，然后抬手替你理了理衣领。' },
    { id: 'work-kaoru-1', workId: 'kaoru', title: '洋葱归你', group: '作品', text: '你刚走进宅邸厨房，围裙还没系上就被塞了把菜刀，乃亚在门口喊今天的洋葱归你。' },
    { id: 'work-kaoru-2', workId: 'kaoru', title: '吃完才准走', group: '作品', text: '你到甜品展会帮忙，在商店街摊前刚站定，朱里就塞来一盘试吃，说吃完才准走。' },
    { id: 'work-kaoru-3', workId: 'kaoru', title: '尝一口就说咸', person: '天城咲夜', group: '作品', text: '天城咲夜舀了一勺汤吹凉递到你嘴边，你刚尝一口她就问咸不咸，勺子还悬在半空没收。' },
    { id: 'work-kaoru-4', workId: 'kaoru', title: '打蛋器归你', person: '冰堂芹香', group: '作品', text: '冰堂芹香把打蛋器塞进你手里，说这次你自己来，话没说完人就退到墙角小声给你打气。' },
    { id: 'work-kaoru-5', workId: 'kaoru', title: '围裙带子松了', person: '牧濑皋月', group: '作品', text: '牧濑皋月从背后把下巴搁到你头顶，说今天也香香的，顺手就解了你的围裙带子。' },
    { id: 'work-kaoru-6', workId: 'kaoru', title: '整筐都给你', person: '千原乃亚', group: '作品', text: '千原乃亚抱着一筐青椒冲进厨房，说今天要吃光它们，然后把整筐都推进了你怀里。' },
    { id: 'work-kaoru-7', workId: 'kaoru', title: '会长特批', person: '夏目朱里', group: '作品', text: '夏目朱里勾住你的脖子说会长特批你陪她买面包，话没落地就把你拖出了学生会室。' },
    { id: 'work-waltz-1', workId: 'waltz', title: '最后洗完的人', group: '作品', text: '你拖着行李箱走进樱花寮，鞋还没换就被塞了块抹布，祐里说最后洗完碗的人倒垃圾。' },
    { id: 'work-waltz-2', workId: 'waltz', title: '可丽饼摊前', group: '作品', text: '你在幸福终点车站绕错了出口，转出来时灯饰已经亮了，若菜在可丽饼摊前朝你招手。' },
    { id: 'work-waltz-3', workId: 'waltz', title: '这一页非看不可', person: '江利原美月', group: '作品', text: '江利原美月一言不发把文库本顶到你鼻尖，说这页非看不可，你退一步她就跟着挪一步。' },
    { id: 'work-waltz-4', workId: 'waltz', title: '先吃蔬菜', person: '门胁樱', group: '作品', text: '门胁樱把红茶塞给你又抽走，说先吃蔬菜，等你伸筷子了她才哼一声把杯子推回来。' },
    { id: 'work-waltz-5', workId: 'waltz', title: '罚跳一支', person: '天司凉香', group: '作品', text: '天司凉香用扇子挑起你的下巴，说迟到的人得罚跳一支舞，说完自己先进了舞池中央。' },
    { id: 'work-waltz-6', workId: 'waltz', title: '会长命令', person: '小峰真奈美', group: '作品', text: '小峰真奈美一手拎着茶壶一手拽住你的手腕，说会长命令你陪她走一趟，然后就往大厅去。' },
    { id: 'work-waltz-7', workId: 'waltz', title: '咦嘻嘻地跑', person: '新垣若菜', group: '作品', text: '新垣若菜从柱子后跳出来抢走你的书包，咦嘻嘻地跑开又停下，回头催你快来追她。' },
    { id: 'work-waltz-8', workId: 'waltz', title: '才没有在等', person: '真原祐里', group: '作品', text: '真原祐里一直盯着你和别人说话，等你回头，她就别过脸说才没在等，脚步却跟得很紧。' },
    { id: 'work-tsumi-1', workId: 'tsumi', title: '河岸风大', group: '作品', text: '你从地铁站走回河岸，草地还湿着，夕莉站在前头回头催你，说走得慢就别想吃晚饭。' },
    { id: 'work-tsumi-2', workId: 'tsumi', title: '院里念咒', group: '作品', text: '你推开旧宅的院门，草丛里有人正念着咒，镜子抬起头说这仪式还差你一个，快点过来。' },
    { id: 'work-tsumi-3', workId: 'tsumi', title: '整个苹果派', person: '铃森伊千果', group: '作品', text: '铃森伊千果把一整个苹果派塞进你手里，说家里那几只吃不完，话没说完又开始道歉。' },
    { id: 'work-tsumi-4', workId: 'tsumi', title: '不叫姐姐别喝', person: '觋夕莉', group: '作品', text: '觋夕莉端着早饭守在门口，说今天不叫一声姐姐，这碗味噌汤你一口也别想喝。' },
    { id: 'work-tsumi-5', workId: 'tsumi', title: '抽一张签', person: '御殿场镜子', group: '作品', text: '御殿场镜子拦住你，说今天的运势得由她占卜，抽完签还得当众把签诗大声念出来，不许笑。' },
    { id: 'work-hanako-1', workId: 'hanako', title: '门板动了下', group: '作品', text: '你推开三楼女厕所的门，第三个隔间的门板动了一下，里面的人喊你进来，把门关好。' },
    { id: 'work-hanako-2', workId: 'hanako', title: '路灯刚亮', group: '作品', text: '你傍晚走进镇上的商店街，路灯刚亮，她整个脸贴在面包店玻璃上，说原来外面是这样的啊。' },
    { id: 'work-hanako-3', workId: 'hanako', title: '迟到了咧', person: '花子', group: '作品', text: '花子把下巴搁在门板上，说你今天迟到了咧，然后伸手要你交出生气的份额。' },
    { id: 'work-canvas-1', workId: 'canvas', title: '竞标会场的钟', group: '作品', text: '你被画廊街的人潮推着往前走，抬头时乌丸竞标会场的钟正响，紫月在上头朝你招手。' },
    { id: 'work-canvas-2', workId: 'canvas', title: '望得见港口', group: '作品', text: '你爬上望得见港口的长坡道，被鱼店老板塞了条小鱼干，拐角撞见幸蹲着给野猫画速写。' },
    { id: 'work-canvas-3', workId: 'canvas', title: '娶回去', person: '安娜塔西亚', group: '作品', text: '安娜塔西亚从背后贴上来捏你的脸，说手感好得想把你娶回去，顺手把画册全塞给你。' },
    { id: 'work-canvas-4', workId: 'canvas', title: '笨蛋笨蛋', person: '凤怜奈', group: '作品', text: '凤怜奈把调色盘拍在桌上喊笨蛋笨蛋，转身又把自己那份布丁推到你手边，别过头不说话。' },
    { id: 'work-canvas-5', workId: 'canvas', title: '请注意你的人称', person: '猫西昭江', group: '作品', text: '猫西昭江把茶盘递到你手上，说请注意你的人称，然后不动声色地把你的点心全收走了。' },
    { id: 'work-canvas-6', workId: 'canvas', title: '这也算一幅画', person: '乾幸', group: '作品', text: '乾幸抱着画板撞到你身上，道歉到一半就蹲下来往你手背上涂颜料，说这也算一幅画。' },
    { id: 'work-canvas-7', workId: 'canvas', title: '耳朵红了一片', person: '狮子堂千晴', group: '作品', text: '狮子堂千晴板着脸把你的围裙带子系紧，说这样才像样，说完转头咳嗽，耳朵红了一片。' },
    { id: 'work-canvas-8', workId: 'canvas', title: '今天由你喊价', person: '乌丸紫月', group: '作品', text: '乌丸紫月把竞标会的木槌塞给你，说今天就由你来喊价，然后退到角落准备看你出丑。' },
    { id: 'work-theo-1', workId: 'theo', title: '钥匙在手心', group: '作品', text: '你刚踏进女子公寓的玄关，房东老太太就把钥匙拍在你手里，顺手把一只箱子也塞过来。' },
    { id: 'work-theo-2', workId: 'theo', title: '试披肩', group: '作品', text: '你在车站前广场被跳蚤市场的大婶拉住试披肩，一回头，里想奈正抱着胳膊瞪你。' },
    { id: 'work-theo-3', workId: 'theo', title: '本宫的随从', person: '布琉艾特·妮科莱特·普朗凯特', group: '作品', text: '布琉艾特·妮科莱特·普朗凯特把一条荷叶边的裙子塞到你怀里，说本宫的随从就穿这个，笑到自己先趴下。' },
    { id: 'work-theo-4', workId: 'theo', title: '妹妹的哥哥', person: '大藏里想奈', group: '作品', text: '大藏里想奈揪着你的领子把你拽进走廊，说妹妹的哥哥不许翘课，然后自己先混过去了。' },
    { id: 'work-theo-5', workId: 'theo', title: '肩宽又变了', person: '梅丽尔·琳琪', group: '作品', text: '梅丽尔·琳琪举着卷尺追你绕缝纫机转了三圈，说你肩宽又变了，道歉的话比尺子还长。' },
    { id: 'work-summerpockets-1', workId: 'summerpockets', title: '先送上坡', group: '作品', text: '渡轮靠岸时你被猫绊了一跤，渔港的大叔把鱼篓塞给你，说先送到坡上的加藤家。' },
    { id: 'work-summerpockets-2', workId: 'summerpockets', title: '位置留着', group: '作品', text: '你踩着蝉声爬上那条没灯的坡道，食堂门口的少年团一看见你就喊，位置早留好了。' },
    { id: 'work-summerpockets-3', workId: 'summerpockets', title: '姆啾一声', person: '䌷·文德斯', group: '作品', text: '䌷·文德斯把捡废品的麻袋往你手上一挂，姆啾一声说今天归你扛，自己抱着西瓜先跑了。' },
    { id: 'work-summerpockets-4', workId: 'summerpockets', title: '秘密不告诉你', person: '久岛鸥', group: '作品', text: '久岛鸥拽着你去爬小学的铁门，说团长的命令不许问为什么，自己先爬上去卡在门口。' },
    { id: 'work-summerpockets-5', workId: 'summerpockets', title: '先打一局', person: '加藤羽未', group: '作品', text: '加藤羽未举着网兜堵在门口，说陪你打一局岛可梦，输的人负责炒饭，说完先朝你挥网兜。' },
    { id: 'work-summerpockets-6', workId: 'summerpockets', title: '分头看信', person: '水织静久', group: '作品', text: '水织静久抱着一摞咨询信撞上你，把一半塞给你说分头看，说完自己先尖叫着去追虫子了。' },
    { id: 'work-summerpockets-7', workId: 'summerpockets', title: '这是报恩', person: '神山识', group: '作品', text: '神山识抢走你手里的饭团咬了一大口，说这算报恩，被她自己讲得理直气壮，还伸出手。' },
    { id: 'work-summerpockets-8', workId: 'summerpockets', title: '偷吃要赔', person: '空门苍', group: '作品', text: '空门苍在粗点心屋门口冲你一嗓子，说你偷吃冰棒要赔，说完自己先笑到扶着门框。' },
    { id: 'work-tiannv2-1', workId: 'tiannv2', title: '终点站', group: '作品', text: '新干线到终点时你还睡着，邻座的女孩推醒你，拖着你的箱包先跳下车，回头喊快点。' },
    { id: 'work-tiannv2-2', workId: 'tiannv2', title: '被塞了地图', group: '作品', text: '你顺着竖町的商业街乱走，被观光导览处的大婶拽住，塞了张地图就推你去看白门。' },
    { id: 'work-tiannv2-3', workId: 'tiannv2', title: '不合理', person: '冰见山玲', group: '作品', text: '冰见山玲挡在灶台前，说做饭不合合理性，却已经把围裙系在你腰上，然后退开看你。' },
    { id: 'work-tiannv2-4', workId: 'tiannv2', title: '交给姐姐', person: '茑町千岁', group: '作品', text: '茑町千岁揉着你的头连声说乖孩子，另一只手已经把你手上的伞抽走，说交给姐姐就行。' },
    { id: 'work-tiannv2-5', workId: 'tiannv2', title: '挡路了', person: '黑姬结灯', group: '作品', text: '黑姬结灯端着托盘从你身边挤过去，用敬语说你挡路了，走远了才小声补一句笨蛋。' },
    { id: 'work-tiannv25-1', workId: 'tiannv25', title: '这里归她', group: '作品', text: '你在候车室的暖炉边坐下，旁边那个女孩把油罐往你脚边一挪，说这块地方归她。' },
    { id: 'work-tiannv25-2', workId: 'tiannv25', title: '又是摔进来的', group: '作品', text: '你踩着结冰的路面滑进缘嬉的玄关，前台的人笑着递来热毛巾，说你又是摔进来的。' },
    { id: 'work-tiannv25-3', workId: 'tiannv25', title: '前——辈', person: '一之濑穗波', group: '作品', text: '一之濑穗波从山之内庄追出来喊前——辈，一把抢过你的雪铲，说这活归她，铲得歪歪扭扭。' },
    { id: 'work-tiannv25-4', workId: 'tiannv25', title: '前辈特权', person: '沓野奏', group: '作品', text: '沓野奏把暖炉边最好的位置让给你，笑着说这是前辈的特权，转头把冰手贴在你脖颈上。' },
    { id: 'work-tiannv25-5', workId: 'tiannv25', title: '会长来啦', person: '砚川·优芙拉希·泪香', group: '作品', text: '砚川·优芙拉希·泪香在走廊里大喊ＨＥＬＬＯ，把学生会的一叠文件塞给你，说后辈就该从这学起。' },
    { id: 'work-tiannv25-6', workId: 'tiannv25', title: '请、请让一下', person: '高社雪静', group: '作品', text: '高社雪静抱着一摞书挡在书架前，小声说请让一下，退得太急，书全塞到你手上了。' },
    { id: 'work-tiannv3-1', workId: 'tiannv3', title: '街口的可乐饼', group: '作品', text: '你刚踏进温泉街，就被端着托盘的大婶塞了两块可乐饼，说是迎新，还顺手把你往店里推。' },
    { id: 'work-tiannv3-2', workId: 'tiannv3', title: '海豹玩偶墙', group: '作品', text: '你被推进纪念品店，一整墙海豹玩偶朝你翻肚皮，冬桦抱着一只不撒手，还要你替她付钱。' },
    { id: 'work-tiannv3-3', workId: 'tiannv3', title: '头一回下厨', person: '御所院冬桦', group: '作品', text: '御所院冬桦把味噌汤端到你鼻子底下，说这是她头一回下厨；你刚要躲，她把碗往你手里一塞。' },
    { id: 'work-tiannv3-4', workId: 'tiannv3', title: '女仆的炖菜', person: '斯卡蕾特·斑鸠·维斯塔莉娅', group: '作品', text: '斯卡蕾特·斑鸠·维斯塔莉娅端着一盘甜到发苦的炖菜追你，鞠一躬请你尝一口；你扭头就跑，她提裙紧追。' },
    { id: 'work-tiannv3-5', workId: 'tiannv3', title: '反光板举歪了', person: '柳木叶梦', group: '作品', text: '柳木叶梦把反光板往你怀里一塞，自己转着圈摆姿势，还嫌你举歪了，喊着学长再拍一张♪' },
    { id: 'work-tiannv3-6', workId: 'tiannv3', title: '诗梦的图钉', person: '柳木诗梦', group: '作品', text: '柳木诗梦把一盒图钉拍在你手心里，让你扶稳椅子别乱动，末了丢下一句「做得很好，变态先生」。' },
    { id: 'work-tiannv3-7', workId: 'tiannv3', title: '纱由的账本', person: '鸿纱由美', group: '作品', text: '鸿纱由美把账本拍在你面前，说这月又亏了全怪你吃太多，说完还伸手掐了一把你的脸，哼着歌走人。' },
    { id: 'work-yuanqi-1', workId: 'yuanqi', title: '拖鞋飞过来', group: '作品', text: '你刚踏进宿舍大厅，一只拖鞋就飞过来砸在行李箱上，蒲公英在二楼喊男生不许上来。' },
    { id: 'work-yuanqi-2', workId: 'yuanqi', title: '围裙套脖子', group: '作品', text: '你从厨房后门钻进甜韵，围裙先一步套上你脖子，绫子把奶油枪塞给你：今天就靠你了。' },
    { id: 'work-yuanqi-3', workId: 'yuanqi', title: '铲子塞给你', person: '八乙女凉花', group: '作品', text: '八乙女凉花一把拽住你的袖子，说你一身汗味不许进厨房；话音没落，煎蛋卷的铲子已经塞给你了。' },
    { id: 'work-yuanqi-4', workId: 'yuanqi', title: '姨姨加排一列', person: '冈井蒲公英', group: '作品', text: '冈井蒲公英抱着花球冲过来，喊着姨姨来加排一列，还没等你答应，彩带就绕了你一身。' },
    { id: 'work-yuanqi-5', workId: 'yuanqi', title: '宿舍长查房', person: '寿珠祈', group: '作品', text: '寿珠祈把记录板横在走廊上拦住你，宣布你今晚违规，你一顶嘴，她就结巴着把手边的抹布丢过来。' },
    { id: 'work-yuanqi-6', workId: 'yuanqi', title: '叫你来顶班', person: '漆原绫子', group: '作品', text: '漆原绫子把还冒着热气的面糊盆塞进你手里，喊你来顶班，转身就去追那只翻倒的奶油罐。' },
    { id: 'work-yuanqi-7', workId: 'yuanqi', title: '开箱视频', person: '衣川美卯', group: '作品', text: '衣川美卯举着手机挡在你面前，说要拍开箱视频，你伸手一挡，她立刻「你、你你你」地骂过来。' },
    { id: 'work-yuanqi-8', workId: 'yuanqi', title: '冰箱门口', person: '近江希未', group: '作品', text: '近江希未蹲在冰箱前被你抓个正着，结结巴巴说只尝一口，转头就把整盒布丁推到你面前。' },
    { id: 'work-chunbai-1', workId: 'chunbai', title: '推开活动室', group: '作品', text: '你推开喵喵部活动室的门，纸箱和猫砂先一步滚到脚边，纱凪喊你赶紧关门别放跑熊喵。' },
    { id: 'work-chunbai-2', workId: 'chunbai', title: '一捆绳子', group: '作品', text: '你刚走进明镜商店街，天窗把光铺了一地，纱凪从店里探出头，把一捆绳子砸到你怀里。' },
    { id: 'work-chunbai-3', workId: 'chunbai', title: '入部申请', person: '乾纱凪', group: '作品', text: '乾纱凪把一沓入部申请拍在你桌上，说交不齐就等着被打个半死，说完自己先笑到呛住。' },
    { id: 'work-chunbai-4', workId: 'chunbai', title: '熊喵的肉球', person: '天羽美羽', group: '作品', text: '天羽美羽说熊喵今天心情不好，把猫往你怀里一塞，趁你手忙脚乱，又伸手捏住你的脸不放。' },
    { id: 'work-chunbai-5', workId: 'chunbai', title: '野生女仆', person: '安洁莉娜·菜夏·史威尔', group: '作品', text: '安洁莉娜·菜夏·史威尔端茶追上来，说这是特意为主人泡的，你还没答话，杯子已抵到嘴边。' },
    { id: 'work-chunbai-6', workId: 'chunbai', title: '点名册', person: '濑名爱理', group: '作品', text: '濑名爱理把点名册摔在你面前，命令你去收齐请假条，你刚张嘴，她一支笔就抵到你鼻尖上。' },
    { id: 'work-chunbai-7', workId: 'chunbai', title: '哥哥的布丁', person: '瓜生樱乃', group: '作品', text: '瓜生樱乃刚把布丁摆上桌，你伸手就抢，她端着盘子躲到门后，探出半个头说哥哥是笨蛋。' },
    { id: 'work-shuizang-1', workId: 'shuizang', title: '醒在筹码堆', group: '作品', text: '你在凯旋门赌场的地毯上醒来，脸颊上还黏着几枚筹码，荷官笑着问你要不要再来一局。' },
    { id: 'work-shuizang-2', workId: 'shuizang', title: '冻死你算了', group: '作品', text: '你顺着防波堤一直走到尽头，海浪盖住所有声音，夕樱追上来把外套甩在你头上说冻死你算了。' },
    { id: 'work-shuizang-3', workId: 'shuizang', title: '输了就喝药', person: '井土谷祈吏', group: '作品', text: '井土谷祈吏把一副扑克拍在病床边，说你输一局就替她喝一次药，说完自己先笑软了。' },
    { id: 'work-shuizang-4', workId: 'shuizang', title: '正义的伙伴', person: '小不动摇', group: '作品', text: '小不动摇把书包甩给你抱着，喊着正义的伙伴出发，跑到楼梯口才想起钥匙还在里面。' },
    { id: 'work-shuizang-5', workId: 'shuizang', title: '鞋穿反了', person: '汐入玖玖里', group: '作品', text: '汐入玖玖里被你和夕樱一边一个拽去买苹果，回来路上两只鞋穿反了都没发觉。' },
    { id: 'work-shuizang-6', workId: 'shuizang', title: '三缺一', person: '煤谷小夜', group: '作品', text: '煤谷小夜在赌场后门截住你，把荷官的手套塞过来，说三缺一，输了就替她洗牌到天亮。' },
    { id: 'work-shuizang-7', workId: 'shuizang', title: '热量分担', person: '茅崎夕樱', group: '作品', text: '茅崎夕樱抢走你的面包咬了一大口，说这算替你分担热量，然后跑得比走廊里谁都快。' },
    { id: 'work-linggan-1', workId: 'linggan', title: '概不退换', group: '作品', text: '你在夏叶原被人流推进游戏店，出来手里多了台二手掌机，收据上写着概不退换。' },
    { id: 'work-linggan-2', workId: 'linggan', title: '一串团子', group: '作品', text: '你被章鱼烧摊的队尾裹着走，抬头时已经站在神社鸟居下，手里多了串团子。' },
    { id: 'work-linggan-3', workId: 'linggan', title: '都听我的券', person: '和泉妃爱', group: '作品', text: '和泉妃爱举着一张什么都听我的券冲你晃，说今天哥哥归她使唤，顺手把煎蛋全夹走了。' },
    { id: 'work-linggan-4', workId: 'linggan', title: '只剩两个', person: '常磐华乃', group: '作品', text: '常磐华乃拽着你的袖子冲进便利店，说肉包子只剩两个了，抢不到就全是你的错喵。' },
    { id: 'work-linggan-5', workId: 'linggan', title: '肉包分你', person: '锦明日海', group: '作品', text: '锦明日海抱着肉包躲在自动贩卖机后面，被你逮住就把半个包子红着脸塞给你。' },
    { id: 'work-linggan-6', workId: 'linggan', title: '写不出来', person: '镰仓诗樱', group: '作品', text: '镰仓诗樱把稿纸推到你面前，说这段写不出来就由你负责，顺手喝掉你半瓶可乐。' },
    { id: 'work-zhishang-1', workId: 'zhishang', title: '油墨味', group: '作品', text: '你推开幻想图书馆的大门，油墨味扑过来，大厅里的吵闹声替你说了一句回来啦。' },
    { id: 'work-zhishang-2', workId: 'zhishang', title: '蜡烛拿来', group: '作品', text: '你在小山上的教堂门前站定，门缝里伸出一只手把你拽进去，说买蜡烛怎么这么久。' },
    { id: 'work-zhishang-3', workId: 'zhishang', title: '被子盖头', person: '伏见理央', group: '作品', text: '伏见理央拽你去院子晒被子，说两个人抬才快，结果把被子整个盖在你头上笑着不撒手。' },
    { id: 'work-zhishang-4', workId: 'zhishang', title: '名侦探', person: '日向彼方', group: '作品', text: '日向彼方把委托书拍在你胸口，说名侦探彼方已经解开三分之二，剩下的就交给你了。' },
    { id: 'work-zhishang-5', workId: 'zhishang', title: '翻错一页', person: '月社妃', group: '作品', text: '月社妃把书敲在你头上，说路过就替她翻谱页，翻错一页就得听她挖苦到傍晚。' },
    { id: 'work-zhishang-6', workId: 'zhishang', title: '丢了别吃饭', person: '游行寺夜子', group: '作品', text: '游行寺夜子把禁书室的钥匙摔进你手心，说丢了就不许吃饭，转身又回头瞄了你一眼。' },
    { id: 'work-lianai-1', workId: 'lianai', title: '差一点点', group: '作品', text: '你在站前的游戏厅把零钱输光了，绘未从背后伸手替你投了一枚币，说这回准能中。' },
    { id: 'work-lianai-2', workId: 'lianai', title: '苹果糖', group: '作品', text: '你被夏日祭的人潮挤到河滩，烟火升起时子夏把一颗苹果糖塞进你手里，说站这儿看。' },
    { id: 'work-lianai-3', workId: 'lianai', title: '今天不学', person: '天满八纯', group: '作品', text: '天满八纯把你的参考书抽走举过头顶，说今天不学了去吃芝士，考砸了也全算她的。' },
    { id: 'work-lianai-4', workId: 'lianai', title: '猜猜是谁', person: '小关桃子', group: '作品', text: '小关桃子从背后捂住你的眼睛，说猜猜我是谁，猜错了今晚的打工就归你替她上。' },
    { id: 'work-lianai-5', workId: 'lianai', title: '兄长超支了', person: '新海月', group: '作品', text: '新海月把收据一张张摊在桌上，说兄长这个月又超支了，说完把茶泡饭推到你面前。' },
    { id: 'work-lianai-6', workId: 'lianai', title: '不许迟到', person: '泉千夏', group: '作品', text: '泉千夏抓着你的手腕一路小跑，说今天绝对不许迟到，跑出两步自己先喘不上气。' },
    { id: 'work-lianai-7', workId: 'lianai', title: '续约套餐', person: '泉子夏', group: '作品', text: '泉子夏拦住你要谈条件，说陪她买衣服算续约，价钱谈完又小声补了一句拜托。' },
    { id: 'work-lianai-8', workId: 'lianai', title: '点最贵的', person: '濑川绘未', group: '作品', text: '濑川绘未把菜单拍在桌上，说今天点最贵的，反正你得陪她把这场假男友演完。' }
  ];;;;;

  function firstStepPresetList() {
    const people = {
      'gen-transfer': '御樱稟', 'gen-rooftop': '御樱稟', 'gen-store': '阳见惠凪', 'gen-club': '天城咲夜',
      'gen-morning': '二见原莉莉子', 'gen-library': '冰川里奈', 'gen-station': '新海天', 'gen-festival': '朝仓千弘',
      'gen-cafe': '岛越月望', 'gen-seaside': '阳见惠凪', 'gen-oldbook': '凤怜奈', 'gen-shrine': '觋夕莉',
      'gen-roofnight': '御樱稟', 'gen-train': '新海天'
    };
    const generic = (DATA.genericOpenings || []).map((scene) => ({
      id: scene.id, title: scene.title, text: scene.text, group: scene.group || '日常', person: people[scene.id] || ''
    }));
    const works = FIRSTSTEP_WORK_PRESETS.filter((preset) => openingWorks().some((work) => work.id === preset.workId));
    const custom = normalizeCustomOpenings(state.customOpenings).map((scene) => ({
      id: scene.id, title: scene.name, text: scene.text, group: '自定义', person: ''
    }));
    return FIRSTSTEP_SPECIAL_PRESETS.concat(works, generic, custom);
  }

  function renderFirstStepPanel() {
    const catsBox = $('#firststepCats');
    if (!catsBox) return;
    const all = firstStepPresetList();
    const cats = ['全部', '作品', '日常', '学园', '都市', '奇幻', '自定义'];
    const current = cats.indexOf(state.firstStepCat) >= 0 ? state.firstStepCat : '全部';
    state.firstStepCat = current;
    const list = current === '全部' ? all : all.filter((item) => item.group === current);
    catsBox.innerHTML = cats.map((cat) => {
      const count = cat === '全部' ? all.length : all.filter((item) => item.group === cat).length;
      return '<button class="firststep-cat ' + (cat === current ? 'is-active' : '') + '" type="button" data-firststep-cat="' + esc(cat) + '"><span>' + esc(cat) + '</span><em>' + count + '</em></button>';
    }).join('');
    const title = $('#firststepCatTitle');
    if (title) title.textContent = current === '全部' ? '全部预设' : current + '预设';
    const count = $('#firststepPresetCount');
    if (count) count.textContent = list.length + ' 条';
    const box = $('#firststepPresets');
    if (!box) return;
    if (!list.length) {
      box.innerHTML = '<div class="firststep-empty">这个分类还没有预设，点「＋ 新建」写一段。</div>';
      return;
    }
    const currentText = String(state.cityStep || '').trim();
    if (current === '作品') {
      const works = openingWorks().filter((work) => list.some((item) => item.workId === work.id));
      const openId = state.firstStepGroup || '';
      box.classList.add('is-grouped');
      box.innerHTML = works.map((work) => {
        const items = list.filter((item) => item.workId === work.id);
        return groupShell(work, { open: openId === work.id, attr: 'data-open-group="step"' },
          `step-${work.id}`, `${pad(items.length)} 条`, '开局预设');
      }).join('');
      works.forEach((work) => {
        const body = $(`#step-${work.id}`);
        if (!body) return;
        const items = list.filter((item) => item.workId === work.id);
        body.innerHTML = '<div class="ov2-scenes">' + items.map((item, index) => {
          const active = !!currentText && currentText === String(item.text || '').trim();
          const person = String(item.person || '');
          const art = person && typeof CAST_ART !== 'undefined' ? CAST_ART[person] : null;
          const src = art && (art.normal || art.stage);
          const face = person ? (src ? `<img src="${esc(src)}" alt="" loading="lazy">` : esc(Array.from(person)[0])) : '';
          return `<button class="ov2-scene ${active ? 'is-active' : ''}" type="button" data-firststep-preset="${esc(item.id)}">
            <span class="ov2-scene-index">${pad(index + 1)}</span>
            <span class="ov2-scene-copy"><span class="ov2-scene-title">${esc(item.title)}</span><span class="ov2-scene-sub">${esc(person || work.title + ' · 总体')}</span></span>
            ${face ? `<span class="ov2-scene-face" title="${esc(person)}">${face}</span>` : ''}
            <span class="ov2-scene-tag">${active ? '已选' : '插入'}</span>
          </button>`;
        }).join('') + '</div>';
      });
      return;
    }
    box.classList.remove('is-grouped');
    box.innerHTML = list.map((item) => {
      const active = currentText && currentText === String(item.text || '').trim();
      const names = Array.isArray(item.people) && item.people.length ? item.people : (item.person ? [item.person] : []);
      let faceHtml = '';
      if (names.length > 1) {
        faceHtml = '<span class="firststep-preset-faces">' + names.map((name) => {
          const art = typeof CAST_ART !== 'undefined' ? CAST_ART[name] : null;
          const src = art && (art.normal || art.stage);
          const face = src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : esc(Array.from(name)[0]);
          return '<span class="firststep-preset-face" title="' + esc(name) + '">' + face + '</span>';
        }).join('') + '</span>';
      } else if (names.length === 1) {
        const name = names[0];
        const art = typeof CAST_ART !== 'undefined' ? CAST_ART[name] : null;
        const src = art && (art.normal || art.stage);
        const face = src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : esc(Array.from(name)[0]);
        faceHtml = '<span class="firststep-preset-face" title="' + esc(name) + '">' + face + '</span>';
      }
      return '<button class="firststep-preset ' + (active ? 'is-active' : '') + '" type="button" data-firststep-preset="' + esc(item.id) + '"><span class="firststep-preset-copy"><b>' + esc(item.title) + '</b></span>' + faceHtml + '</button>';
    }).join('');
  }

  function chooseFirstStepPreset(id) {
    const preset = firstStepPresetList().find((item) => item.id === id);
    if (!preset) return;
    state.cityStep = String(preset.text || '');
    state.cityConfirmed = false;
    state.cityOpening = '';
    const area = $('#cityStepText');
    if (area) area.value = state.cityStep;
    const count = $('#cityStepCount');
    if (count) count.textContent = state.cityStep.length + ' / 300';
    if (typeof persistOpeningSelection === 'function') persistOpeningSelection();
    renderFirstStepPanel();
    renderOpeningPicked();
  }

  function renderFreePanel() {
    const mode = openingMode();
    const scene = currentOpeningScene();
    const text = scene ? String(scene.text || '') : '';
    const label = $('#openingBoxMode');
    if (label) {
      label.innerHTML = `来源：<b>${esc(openingModeLabel(mode))}</b>${scene ? ' · ' + esc(scene.title || '') : ' · 还没选好'}`;
    }
    const count = $('#freeCount');
    if (count) count.textContent = `${text.length} / 800`;
    const preview = $('#freePreview');
    if (preview) preview.textContent = text ? text.slice(0, 160) : '还没有选择切入设定。';
    const area = $('#freeOpeningText');
    if (area && (shadow.activeElement || HOST_DOC.activeElement) !== area) area.value = text;
  }

  function groupShell(work, openAttr, bodyId, count, extra) {
    return `<section class="ov2-group ${openAttr.open ? 'is-open' : ''}" data-group-work="${esc(work.id)}">
      <button class="ov2-group-head" type="button" ${openAttr.attr} aria-expanded="${openAttr.open}">
        <span class="ov2-group-cover" style="background-image:url('${esc(work.cover)}')" aria-hidden="true"></span>
        <span class="ov2-group-copy">
          <span class="ov2-group-title">${esc(work.title)}</span>
          <span class="ov2-group-sub">${esc(work.place || '')}${extra ? ' · ' + esc(extra) : ''}</span>
        </span>
        <span class="ov2-group-count">${count}</span>
        <span class="ov2-group-arrow">${icon('arrow')}</span>
      </button>
      <div class="ov2-group-body" id="${bodyId}" ${openAttr.open ? '' : 'hidden'}></div>
    </section>`;
  }

  function renderPersonOpening() {
    const box = $('#personOpeningList');
    if (!box) return;
    const works = openingWorks();
    if (!works.length) {
      box.innerHTML = '<div class="ov2-empty">第二页还没有启用作品。先去「作品」页打开至少一部。</div>';
      return;
    }
    box.innerHTML = works.map((work) => {
      const open = state.openPersonWork === work.id;
      return groupShell(work, { open, attr: 'data-open-group="person"' }, `person-${work.id}`, `${pad((work.cast || []).length)} 人`, '个人主线')
        .replace('<div class="ov2-group-body"', `<div class="ov2-group-body" data-filled="1"`);
    }).join('');
    // Fill bodies after the shells exist so the markup stays simple.
    works.forEach((work) => {
      const body = $(`#person-${work.id}`);
      if (!body) return;
      body.innerHTML = `<div class="ov2-chars">${(work.cast || []).map((person) => {
        const art = CAST_ART[person.name];
        const src = art && (art.normal || art.stage);
        const active = state.openingPerson === person.id;
        const initial = Array.from(person.name || '?')[0] || '?';
        return `<button class="ov2-char ${active ? 'is-active' : ''}" type="button" data-open-person="${esc(person.id)}" aria-pressed="${active}">
          <span class="ov2-char-face">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" data-role-art="1">` : `<b>${esc(initial)}</b>`}</span>
          <span class="ov2-char-copy"><span class="ov2-char-name">${esc(person.name)}</span><span class="ov2-char-role">${esc(person.role || '')}</span></span>
        </button>`;
      }).join('')}</div>`;
    });
  }

  function renderWorkOpening() {
    const box = $('#workOpeningList');
    if (!box) return;
    const works = openingWorks();
    if (!works.length) {
      box.innerHTML = '<div class="ov2-empty">第二页还没有启用作品。</div>';
      return;
    }
    box.innerHTML = works.map((work) => {
      const open = state.openWorkGroup === work.id;
      return groupShell(work, { open, attr: 'data-open-group="work"' }, `work-${work.id}`, `${pad((work.openings || []).length)} 幕`, '作品开局');
    }).join('');
    works.forEach((work) => {
      const body = $(`#work-${work.id}`);
      if (!body) return;
      const scenes = work.openings || [];
      body.innerHTML = scenes.length ? `<div class="ov2-scenes">${scenes.map((scene, index) => {
        const active = state.openingWork === work.id && state.sceneId === scene.id;
        return `<button class="ov2-scene ${active ? 'is-active' : ''}" type="button" data-open-scene="${esc(scene.id)}" data-open-scene-work="${esc(work.id)}">
          <span class="ov2-scene-index">${pad(index + 1)}</span>
          <span class="ov2-scene-copy"><span class="ov2-scene-title">${esc(scene.title || '第一幕')}</span><span class="ov2-scene-sub">${esc(scene.place || '')} · ${esc(scene.time || '')}</span></span>
        </button>`;
      }).join('')}</div>` : '<div class="ov2-empty">这部作品还没有专属开场。</div>';
    });
  }

  function renderPlotOpening() {
    const box = $('#plotOpeningList');
    if (!box) return;
    const works = openingWorks().filter((work) => PLOT_WORKS.has(work.id) && state.plotRoutes[work.id]);
    if (!works.length) {
      box.innerHTML = '<div class="ov2-empty">先在第三页开启至少一条剧情主线，这里才会出现对应作品的章节。</div>';
      return;
    }
    box.innerHTML = works.map((work) => {
      const open = state.openPlotGroup === work.id;
      const chapters = plotChaptersFor(work.id);
      return groupShell(work, { open, attr: 'data-open-group="plot"' }, `plot-${work.id}`, `${pad(chapters.length)} 章`, '剧情主线');
    }).join('');
    works.forEach((work) => {
      const body = $(`#plot-${work.id}`);
      if (!body) return;
      const chapters = plotChaptersFor(work.id);
      body.innerHTML = `<div class="ov2-scenes">${chapters.map((chapter, index) => {
        const active = state.openingWork === work.id && state.openingChapter === chapter.id;
        return `<button class="ov2-scene ${active ? 'is-active' : ''}" type="button" data-open-plot="${esc(chapter.id)}" data-open-plot-work="${esc(work.id)}">
          <span class="ov2-scene-index">${pad(index + 1)}</span>
          <span class="ov2-scene-copy"><span class="ov2-scene-title">${esc(chapter.title)}</span><span class="ov2-scene-sub">${esc(work.title)} · 剧情主线</span></span>
          <span class="ov2-scene-tag">${active ? '已选' : '插入'}</span>
        </button>`;
      }).join('')}</div>`;
    });
  }

  function renderOpeningPicked() {
    const node = $('#openingPicked');
    if (!node) return;
    const mode = openingMode();
    const scene = currentOpeningScene();
    const work = workById(state.openingWork);
    if (!scene) {
      node.innerHTML = mode === 'free'
        ? `当前选择：<b>完全自由</b> · 还没有写下开场，会先用《${esc(work.title)}》的第一幕。`
        : mode === 'person'
        ? `当前选择：<b>个人主线</b> · 还没选角色，会先用《${esc(work.title)}》的第一幕。`
        : '当前选择：还没有选。';
      return;
    }
    const detail = mode === 'person'
      ? `《${esc(work.title)}》· ${esc(scene.title)}`
      : mode === 'plot'
      ? `${esc(scene.title)}`
      : `《${esc(work.title)}》· ${esc(scene.title)}`;
    node.innerHTML = `当前选择：<b>${esc(openingModeLabel(mode))}</b> · ${detail}`;
  }

  function renderOpeningV2() {
    renderCityPanel();
    renderFirstStepPanel();
    renderFreePanel();
    renderFreePresets();
    const routeBox = $('#personRoute');
    if (routeBox) {
      const hasPerson = !!(state.openingPerson && findPersonById(state.openingPerson));
      routeBox.hidden = !hasPerson;
      if (hasPerson) {
        const found = findPersonById(state.openingPerson);
        const face = $('#personRouteFace');
        const art = CAST_ART[found.person.name];
        const src = art && (art.normal || art.stage);
        const initial = Array.from(found.person.name || '?')[0] || '?';
        if (face && !face.innerHTML.trim()) face.innerHTML = src ? `<img src="${esc(src)}" alt="" data-role-art="1">` : esc(initial);
        const name = $('#personRouteName');
        if (name) name.textContent = found.person.name;
        const sub = $('#personRouteSub');
        if (sub) sub.textContent = `《${found.work.title}》· ${found.person.role || ''}`;
        const route = personRoute(found.person.id);
        const relation = $('#personRelation');
        if (relation && (shadow.activeElement || HOST_DOC.activeElement) !== relation) relation.value = route.relation || '';
        const opening = $('#personOpeningText');
        if (opening && (shadow.activeElement || HOST_DOC.activeElement) !== opening) opening.value = route.opening || '';
        const count = $('#personOpeningCount');
        if (count) count.textContent = `${(route.opening || '').length} / 500`;
      }
    }
    renderOpeningModeTabs();
    renderPersonOpening();
    renderWorkOpening();
    renderPlotOpening();
    renderOpeningPicked();
    updateCinema();
    updateOpeningMeta();
  }

  function genericPresets() {
    return (DATA.genericOpenings || []).map((scene) => ({ id: scene.id, name: scene.title, text: scene.text, place: scene.place, time: scene.time }));
  }

  function saveCustomOpenings() {
    saveJSON(STORE.customOpenings, state.customOpenings);
  }
  function savePersonRoutes() {
    saveJSON(STORE.personRoutes, state.personRoutes);
  }

  function renderFreePresets() {
    const genericList = genericPresets();
    const customList = normalizeCustomOpenings(state.customOpenings);
    const current = (state.freeOpening || '').trim();

    const genericBox = $('#genericPresets');
    if (genericBox) {
      genericBox.innerHTML = genericList.map((preset) => {
        const active = current && current === (preset.text || '').trim();
        return `<button class="ov2-preset ${active ? 'is-active' : ''}" type="button" data-preset-generic="${esc(preset.id)}">
          <span class="ov2-preset-name">${esc(preset.name || '通用场景')}</span>
          <span class="ov2-preset-sub">${esc(preset.place || '')}${preset.time ? ' · ' + esc(preset.time) : ''}</span>
        </button>`;
      }).join('') || '<div class="ov2-presets-empty">还没有通用场景。</div>';
    }

    const count = $('#customPresetCount');
    if (count) count.textContent = String(customList.length);

    const customBox = $('#customPresets');
    if (customBox) {
      customBox.innerHTML = customList.map((preset) => {
        const active = current && current === (preset.text || '').trim();
        return `<button class="ov2-preset ${active ? 'is-active' : ''}" type="button" data-preset-custom="${esc(preset.id)}">
          <span class="ov2-preset-name">${esc(preset.name || '未命名')}</span>
          <span class="ov2-preset-sub">${esc((preset.text || '').slice(0, 60))}</span>
          <span class="ov2-preset-del" role="button" data-preset-del="${esc(preset.id)}" title="删除这个预设">×</span>
        </button>`;
      }).join('') || '<div class="ov2-presets-empty">还没有自定义预设。写一段开场，再点「＋ 新建自定义开局」。</div>';
    }
  }

  function personRoute(personId) {
    return (state.personRoutes && state.personRoutes[personId]) || { relation: '', opening: '' };
  }

  function selectPersonRoute(personId) {
    const found = findPersonById(personId);
    const box = $('#personRoute');
    if (!found || !box) return;
    state.openingPerson = personId;
    state.openingWork = found.work.id;
    state.openingMode = 'person';
    const route = personRoute(personId);
    const face = $('#personRouteFace');
    const art = CAST_ART[found.person.name];
    const src = art && (art.normal || art.stage);
    const initial = Array.from(found.person.name || '?')[0] || '?';
    if (face) face.innerHTML = src ? `<img src="${esc(src)}" alt="" data-role-art="1">` : esc(initial);
    const name = $('#personRouteName');
    if (name) name.textContent = found.person.name;
    const sub = $('#personRouteSub');
    if (sub) sub.textContent = `《${found.work.title}》· ${found.person.role || ''}`;
    const relation = $('#personRelation');
    if (relation) relation.value = route.relation || '';
    const opening = $('#personOpeningText');
    if (opening) opening.value = route.opening || '';
    const count = $('#personOpeningCount');
    if (count) count.textContent = `${(route.opening || '').length} / 500`;
    box.hidden = false;
    renderPersonOpening();
    renderFreePanel();
    renderOpeningPicked();
    updateCinema();
    persistOpeningSelection();
  }

  function closePersonRoute() {
    const box = $('#personRoute');
    if (box) box.hidden = true;
    state.openingPerson = '';
    persistOpeningSelection();
    renderPersonOpening();
    renderOpeningPicked();
    updateCinema();
  }

  function applyPersonRoute(silent) {
    const personId = state.openingPerson;
    const found = findPersonById(personId);
    if (!found) return;
    state.personRoutes[personId] = {
      relation: ($('#personRelation')?.value || '').trim(),
      opening: ($('#personOpeningText')?.value || '').trim(),
    };
    savePersonRoutes();
    persistOpeningSelection();
    if (!silent) renderPersonOpening();
    renderFreePanel();
    renderOpeningPicked();
    updateCinema();
    if (!silent) toast(`个人主线已设定：${found.person.name}。`, 'check');
  }

  function openPresetEditor() {
    const box = $('#presetEditor');
    if (!box) return;
    const name = $('#presetName');
    if (name) name.value = '';
    const text = $('#presetText');
    if (text) text.value = state.freeOpening || '';
    const count = $('#presetCount');
    if (count) count.textContent = `${(state.freeOpening || '').length} / 800`;
    box.hidden = false;
    setTimeout(() => name?.focus(), 40);
  }

  function closePresetEditor() {
    const box = $('#presetEditor');
    if (box) box.hidden = true;
  }

  function savePreset() {
    const text = ($('#presetText')?.value || '').trim();
    const name = ($('#presetName')?.value || '').trim() || `我的开场 ${normalizeCustomOpenings(state.customOpenings).length + 1}`;
    if (!text) { toast('先写一点正文，再存进预设库。', 'spark'); $('#presetText')?.focus(); return; }
    const id = `custom-${Date.now()}`;
    state.customOpenings = [{ id, name, text }, ...normalizeCustomOpenings(state.customOpenings)].slice(0, 40);
    saveCustomOpenings();
    state.freeOpening = text;
    state.openingMode = 'free';
    persistOpeningSelection();
    closePresetEditor();
    renderOpeningV2();
    toast(`预设「${name}」已保存，并已用作当前开场。`, 'check');
  }

  function setupOpening() {
    const page = $('#page-opening');
    if (!page) return;
    page.addEventListener('click', (event) => {
      const modeButton = event.target.closest('[data-open-mode]');
      if (!modeButton) return;
      state.openingMode = modeButton.getAttribute('data-open-mode');
      persistOpeningSelection();
      renderOpeningV2();
    });
    const area = $('#freeOpeningText');
    if (area) {
      area.addEventListener('input', (event) => {
        const value = event.target.value;
        const mode = openingMode();
        if (mode === 'person' && state.openingPerson) {
          state.personRoutes[state.openingPerson] = Object.assign({}, personRoute(state.openingPerson), { opening: value });
          savePersonRoutes();
        } else if (mode === 'city') {
          state.cityText = value;
          state.cityEntry = 'custom';
        } else {
          state.freeOpening = value;
          if (mode !== 'free') state.openingMode = 'free';
        }
        const count = $('#freeCount');
        if (count) count.textContent = `${value.length} / 800`;
        persistOpeningSelection();
        renderOpeningPicked();
        renderCityPanel();
        updateCinema();
      });
    }
    $('#useFreeOpening')?.addEventListener('click', () => {
      if (!(state.freeOpening || '').trim()) {
        toast('先写一点开场，再用它。', 'spark');
        area?.focus();
        return;
      }
      state.openingMode = 'free';
      persistOpeningSelection();
      renderOpeningV2();
      toast('已改用自由开场。', 'check');
    });
    // 都市模式 controls.
    $('#cityZoneTabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-city-zone]');
      if (!button) return;
      const nextZone = button.getAttribute('data-city-zone') === 'union' ? 'union' : 'campus';
      if (nextZone !== state.cityZone) {
        state.cityZone = nextZone;
        const allowed = cityIdentityList();
        if (state.cityIdentity && !allowed.includes(state.cityIdentity) && !/^自定义/.test(state.cityIdentity)) {
          state.cityIdentity = '';
        }
        state.cityIdentityAuto = false;
      }
      state.openingMode = 'city';
      state.cityOpenStep = 'area';
      state.cityConfirmed = false;
      state.cityOpening = '';
      persistOpeningSelection();
      renderOpeningV2();
      setTimeout(() => {
        const area = $('#cityAreaBody');
        if (area) area.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 80);
    });
    $('#citySteps')?.addEventListener('click', (event) => {
      const head = event.target.closest('[data-city-toggle]');
      if (head) {
        const key = head.getAttribute('data-city-toggle');
        state.cityOpenStep = state.cityOpenStep === key ? '' : key;
        renderCityPanel();
        return;
      }
      const identity = event.target.closest('[data-city-identity]');
      if (identity) {
        state.cityIdentity = identity.getAttribute('data-city-identity');
        state.cityIdentityAuto = false;
        state.openingMode = 'city';
        state.cityConfirmed = false;
        state.cityOpening = '';
        persistOpeningSelection();
        renderCityPanel();
        renderOpeningPicked();
        return;
      }
      const goal = event.target.closest('[data-city-goal]');
      if (goal) {
        state.cityGoal = goal.getAttribute('data-city-goal');
        state.openingMode = 'city';
        state.cityConfirmed = false;
        state.cityOpening = '';
        persistOpeningSelection();
        renderCityPanel();
        renderOpeningPicked();
        return;
      }
      const area = event.target.closest('[data-city-area]');
      if (area) {
        state.cityArea = area.getAttribute('data-city-area');
        state.openingMode = 'city';
        state.cityConfirmed = false;
        state.cityOpening = '';
        persistOpeningSelection();
        renderCityPanel();
        renderOpeningPicked();
      }
    });
    const bindCityInput = (selector, key) => {
      const input = $(selector);
      if (!input) return;
      input.addEventListener('input', (event) => {
        state[key] = event.target.value;
        if (key === 'cityIdentity') state.cityIdentityAuto = false;
        state.openingMode = 'city';
        state.cityConfirmed = false;
        state.cityOpening = '';
        persistOpeningSelection();
        renderCityPanel();
        renderOpeningPicked();
      });
    };
    bindCityInput('#cityIdentityInput', 'cityIdentity');
    bindCityInput('#cityGoalInput', 'cityGoal');
    $('#firststepCats')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-firststep-cat]');
      if (!button) return;
      state.firstStepCat = button.getAttribute('data-firststep-cat');
      renderFirstStepPanel();
    });
    $('#firststepPresets')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-firststep-preset]');
      if (!button) return;
      chooseFirstStepPreset(button.getAttribute('data-firststep-preset'));
    });
    $('#firststepNew')?.addEventListener('click', () => {
      state.cityStep = '';
      state.cityConfirmed = false;
      state.cityOpening = '';
      const area = $('#cityStepText');
      if (area) { area.value = ''; area.focus(); }
      const count = $('#cityStepCount');
      if (count) count.textContent = '0 / 300';
      renderFirstStepPanel();
    });
    $('#firststepSave')?.addEventListener('click', () => {
      const text = String(state.cityStep || '').trim();
      if (!text) return;
      const list = normalizeCustomOpenings(state.customOpenings);
      list.push({
        id: 'custom-' + Date.now(),
        name: '自定义开局 ' + (list.length + 1),
        text: text.slice(0, 300)
      });
      state.customOpenings = list;
      saveCustomOpenings();
      state.firstStepCat = '自定义';
      renderFirstStepPanel();
    });
    $('#cityStepText')?.addEventListener('input', (event) => {
      state.cityStep = event.target.value;
      state.openingMode = 'city';
      state.cityConfirmed = false;
      state.cityOpening = '';
      const count = $('#cityStepCount');
      if (count) count.textContent = `${event.target.value.length} / 300`;
      persistOpeningSelection();
      renderOpeningPicked();
    });
    $('#cityDecide')?.addEventListener('click', () => {
      // Never block, and never leave the final page without a scene:
      // unfilled fields simply become 未定 / 默认值 in the composed opening.
      state.openingMode = 'city';
      state.cityConfirmed = true;
      state.cityOpening = buildCityOpening();
      persistOpeningSelection();
      renderCityPanel();
      renderOpeningPicked();
      updateCinema();
      navigate('final');
    });
    $('#openingV2Tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-open-mode]');
      if (!button) return;
      state.openingMode = button.getAttribute('data-open-mode');
      persistOpeningSelection();
      renderOpeningV2();
    });
    page.addEventListener('click', (event) => {
      const groupHead = event.target.closest('[data-open-group]');
      if (groupHead) {
        const kind = groupHead.getAttribute('data-open-group');
        const workId = groupHead.closest('[data-group-work]')?.getAttribute('data-group-work');
        if (!workId) return;
        if (kind === 'person') state.openPersonWork = state.openPersonWork === workId ? '' : workId;
        if (kind === 'work') state.openWorkGroup = state.openWorkGroup === workId ? '' : workId;
        if (kind === 'plot') state.openPlotGroup = state.openPlotGroup === workId ? '' : workId;
        if (kind === 'step') state.firstStepGroup = state.firstStepGroup === workId ? '' : workId;
        renderOpeningV2();
        return;
      }
      const person = event.target.closest('[data-open-person]');
      if (person) {
        selectPersonRoute(person.getAttribute('data-open-person'));
        return;
      }
      const scene = event.target.closest('[data-open-scene]');
      if (scene) {
        state.sceneId = scene.getAttribute('data-open-scene');
        state.openingWork = scene.getAttribute('data-open-scene-work') || state.openingWork;
        state.openingMode = 'work';
        persistOpeningSelection();
        renderOpeningV2();
        return;
      }
      const plot = event.target.closest('[data-open-plot]');
      if (plot) {
        state.openingChapter = plot.getAttribute('data-open-plot');
        state.openingWork = plot.getAttribute('data-open-plot-work') || state.openingWork;
        state.openingMode = 'plot';
        persistOpeningSelection();
        selectPlotChapter(state.openingWork, state.openingChapter);
        renderOpeningV2();
        return;
      }
    });
    // Free-mode presets (inline editor).
    $('#savePresetBtn')?.addEventListener('click', openPresetEditor);
    $('#cancelPreset')?.addEventListener('click', closePresetEditor);
    $('#savePreset')?.addEventListener('click', savePreset);
    $('#presetText')?.addEventListener('input', (event) => {
      const count = $('#presetCount');
      if (count) count.textContent = `${event.target.value.length} / 800`;
    });
    page.addEventListener('click', (event) => {
      const del = event.target.closest('[data-preset-del]');
      if (del) {
        event.stopPropagation();
        const id = del.getAttribute('data-preset-del');
        state.customOpenings = normalizeCustomOpenings(state.customOpenings).filter((item) => item.id !== id);
        saveCustomOpenings();
        renderFreePresets();
        toast('预设已删除。', 'refresh');
        return;
      }
      const generic = event.target.closest('[data-preset-generic]');
      if (generic) {
        const preset = genericPresets().find((item) => item.id === generic.getAttribute('data-preset-generic'));
        if (!preset) return;
        state.freeOpening = preset.text || '';
        state.openingMode = 'free';
        persistOpeningSelection();
        renderOpeningV2();
        return;
      }
      const custom = event.target.closest('[data-preset-custom]');
      if (custom) {
        const preset = normalizeCustomOpenings(state.customOpenings).find((item) => item.id === custom.getAttribute('data-preset-custom'));
        if (!preset) return;
        state.freeOpening = preset.text || '';
        state.openingMode = 'free';
        persistOpeningSelection();
        renderOpeningV2();
      }
    });

    // Person-route inline editor: changes save as you type.
    $('#savePersonRoute')?.addEventListener('click', () => applyPersonRoute(false));
    $('#closePersonRoute')?.addEventListener('click', closePersonRoute);
    $('#personRelation')?.addEventListener('input', () => applyPersonRoute(true));
    $('#personOpeningText')?.addEventListener('input', (event) => {
      const count = $('#personOpeningCount');
      if (count) count.textContent = `${event.target.value.length} / 500`;
      applyPersonRoute(true);
    });

    $('#launchWorld')?.addEventListener('click', startWorld);
    $('#copyFinalPrompt')?.addEventListener('click', copyFinalPromptText);
  }

  /* Legacy shims kept so the rest of the app keeps working. */
  function renderOpeningWorkPicker() {}
  function syncSceneTabs() {}
  function renderScenes() {}

  function currentScene() {
    const scene = currentOpeningScene();
    if (scene) return scene;
    // 都市模式没填完时不借用作品开场：宁可不出提示词，也不冒充都市开局。
    if (openingMode() === 'city') return null;
    // Nothing chosen yet: fall back to the current work's first opening so the
    // dossier and the prompt are never empty.
    const work = workById(state.openingWork);
    if (!workIsEnabled(work && work.id)) return null;
    const list = (work && work.openings) || [];
    return list[0] || null;
  }

  function updateOpeningMeta() {
    const work = workById(state.openingWork);
    if (!work) return;
    const active = WORKS.filter((item) => state.settings[item.id]?.enabled !== false).length;
    const plots = WORKS.filter((item) => state.settings[item.id]?.enabled && state.settings[item.id]?.plot).length;
    const aw = $('#openingActiveWorks');
    const ap = $('#openingActivePlots');
    if (aw) aw.textContent = String(active);
    if (ap) ap.textContent = String(plots);
  }

  function updateCinema() {
    const work = workById(state.openingWork);
    if (!work) return;
    const scene = currentOpeningScene() || {
      title: '还没有选好第一幕',
      place: work.place || '未知地点',
      time: work.era || '2018',
      mood: 'WAITING',
      text: '还没有选好开场。写一段自由开场，或者从下面挑一个预设。',
    };
    const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
    const bg = $('#cinemaBg');
    if (bg) bg.style.backgroundImage = `url('${work.cover}')`;
    setText('#cinemaIndex', `NO. ${work.index || '01'} / ${pad(WORKS.length)}`);
    setText('#cinemaKicker', (`${work.jp || work.title} · ${scene.mood || 'OPENING'}`).toUpperCase());
    const titleNode = $('#cinemaTitle');
    if (titleNode) {
      titleNode.innerHTML = `${esc(scene.title || '第一幕')}<span class="cinema-title-soft">${esc(work.tagline || '')}</span>`;
    }
    setText('#cinemaPlace', scene.place || work.place || '未知地点');
    setText('#cinemaTime', scene.time || work.era || '2018');
    setText('#cinemaText', scene.text || '');
    const tags = $('#cinemaTags');
    if (tags) {
      const list = unique([...(work.tags || []), openingModeLabel(openingMode())]).slice(0, 5);
      tags.innerHTML = list.map((tag) => `<span>${esc(tag)}</span>`).join('');
    }
    const initial = Array.from((personaDisplayName() || '').trim())[0] || '?';
    setText('#cinemaAvatar', initial.toUpperCase());
    setText('#cinemaPersonaName', personaDisplayName() || '无名旅人');
    updateOpeningMeta();
    if (state.currentPage === 'final') renderFinalRecord();
  }

  function refreshOpeningPage() {
    renderOpeningV2();
    updatePersonaPreview();
  }

  function persistOpeningSelection() {
    saveJSON(STORE.opening, {
      workId: state.openingWork,
      sceneTab: state.sceneTab,
      sceneId: state.sceneId,
      mode: openingMode(),
      free: state.freeOpening || '',
      cityZone: state.cityZone || 'campus',
      cityIdentity: state.cityIdentity || '',
      cityGoal: state.cityGoal || '',
      cityArea: state.cityArea || '',
      cityStep: state.cityStep || '',
      cityOpening: state.cityOpening || '',
      cityConfirmed: !!state.cityConfirmed,
      person: state.openingPerson || '',
      chapter: state.openingChapter || '',
    });
  }

  function setupCustomModal() {
    const modal = $('#customModal');
    if (!modal) return;
    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-modal]')) closeCustomModal();
    });
    $('#customText')?.addEventListener('input', (event) => {
      const counter = $('#customCount');
      if (counter) counter.textContent = `${event.target.value.length} / 500`;
    });
    $('#saveCustomOpening')?.addEventListener('click', saveCustomOpening);
    HOST_DOC.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || modal.hidden) return;
      wrapFocus(event, modal);
    });
  }

  function openCustomModal() {
    const modal = $('#customModal');
    if (!modal) return;
    state.lastFocus = (shadow.activeElement || HOST_DOC.activeElement);
    const title = $('#customTitle');
    const text = $('#customText');
    if (title) title.value = state.customOpening?.title || '';
    if (text) text.value = state.customOpening?.text || '';
    const counter = $('#customCount');
    if (counter) counter.textContent = `${text ? text.value.length : 0} / 500`;
    modal.hidden = false;
    HOST_DOC.body.style.overflow = 'hidden';
    setTimeout(() => title?.focus(), 50);
  }

  function closeCustomModal() {
    const modal = $('#customModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    HOST_DOC.body.style.overflow = '';
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
  }

  function saveCustomOpening() {
    const title = ($('#customTitle')?.value || '').trim() || '我的开场';
    const text = ($('#customText')?.value || '').trim();
    if (!text) { toast('写下一句话，再把它收起来。', 'spark'); $('#customText')?.focus(); return; }
    state.customOpening = { title, text };
    saveJSON(STORE.customOpening, state.customOpening);
    state.sceneTab = 'custom';
    state.sceneId = 'custom';
    persistOpeningSelection();
    closeCustomModal();
    syncSceneTabs();
    renderScenes();
    updateCinema();
    toast('你的开场已收进档案。', 'check');
  }

  function beginStory() {
    const work = workById(state.openingWork);
    const scene = currentScene();
    if (!enabledWorkList().length) {
      toast('至少接通一部作品，才能开始。', 'sliders');
      navigate('console');
      return;
    }
    if (state.sceneTab === 'custom' && !state.customOpening) {
      toast('先写一段属于你的开场吧。', 'spark');
      openCustomModal();
      return;
    }
    if (!work || !scene) return;
    const launch = $('#launchLayer');
    const stage = $('.launch-stage');
    const result = $('#launchResult');
    if (!launch) return;
    clearLaunchTimers();
    $('#launchBg').style.backgroundImage = `url('${work.cover}')`;
    $('#launchTitle').textContent = work.title;
    $('#launchSub').textContent = `${scene.title} · 正在为你装订第一幕`;
    $('#launchLog').textContent = '连接世界书 · 校验人物档案 · 安放时间锚点';
    $('#launchProgressBar').style.width = '0%';
    stage?.classList.remove('is-hidden');
    if (result) result.hidden = true;
    launch.hidden = false;
    launch.setAttribute('aria-hidden', 'false');
    HOST_DOC.body.style.overflow = 'hidden';
    const steps = [
      { at: 380, value: 18, text: '连接世界书 · 校验人物档案 · 安放时间锚点' },
      { at: 900, value: 42, text: '为世界调平气压 · 让第一阵风经过坡道' },
      { at: 1500, value: 69, text: '把名字写进名册 · 把今天的天气写在页眉' },
      { at: 2100, value: 91, text: '第一幕正在成形 · 请保持安静' },
      { at: 2600, value: 100, text: '序章已装订。' }
    ];
    steps.forEach((step) => {
      state.launchTimers.push(setTimeout(() => {
        const bar = $('#launchProgressBar');
        if (bar) bar.style.width = `${step.value}%`;
        const log = $('#launchLog');
        if (log) log.textContent = step.text;
      }, step.at));
    });
    state.launchTimers.push(setTimeout(() => {
      renderLaunchResult(work, scene);
      const tavernPrompt = buildTavernPrompt(work, scene);
      state.currentLaunchText = tavernPrompt;
      const resultText = $('#resultText');
      if (resultText) resultText.textContent = tavernPrompt;
      stage?.classList.add('is-hidden');
      if (result) {
        result.hidden = false;
        result.setAttribute('tabindex', '-1');
        setTimeout(() => result.focus(), 50);
      }
    }, 3050));
  }


  function enabledWorkList() {
    return WORKS.filter((item) => state.settings[item.id] && state.settings[item.id].enabled);
  }

  function swapTextFor(work) {
    const config = state.settings[work.id] || {};
    if (config.swap) return '全员性转';
    const names = (work.cast || []).filter((person) => config.castSwap && config.castSwap[person.id]).map((person) => person.name);
    return names.length ? names.join('、') + ' 性转' : '无';
  }

  function buildTavernMeta(work, scene) {
    return {
      version: '1.0',
      workId: work.id,
      workTitle: work.title,
      sceneType: state.sceneTab,
      sceneId: scene.id || '',
      sceneTitle: scene.title || '第一幕',
      scenePlace: scene.place || work.place || '',
      sceneTime: scene.time || work.era || '2018',
      persona: JSON.parse(JSON.stringify(state.persona)),
      settings: JSON.parse(JSON.stringify(state.settings)),
      enabled: enabledWorkList().map((item) => item.id),
      createdAt: new Date().toISOString()
    };
  }

  function companionPromptLines() {
    const chosen = state.persona.companions || {};
    return Object.keys(chosen).map((id) => findPersonById(id))
      .filter((found) => found && workIsEnabled(found.work.id))
      .map(({ person }) => {
      const item = chosen[person.id] || defaultCompanionFor(person);
      return `开局同伴：[${person.name}：${item.relation || '同伴'}、${item.opening || '开局时在你身边'}]`;
    });
  }

  function buildTavernPrompt(work, scene) {
    const info = personaPromptInfo();
    const p = state.persona;
    const identity = String(info.identity || p.identity || '学生').trim() || '学生';
    const age = String(p.age || '').trim() || '根据人设合理补完';
    const cross = p.crossdress ? '是（以女装身份入学）。' : '否。';
    const mode = openingMode();
    const lines = [];
    lines.push('【GALWORLD · 世界之书｜开局设定】');
    lines.push('本局由「世界之书」生成。请直接从第一幕正文开始，不要复述设定，也不要解释规则。');
    lines.push('');
    lines.push('【主角】');
    lines.push('称呼：{{user}}');
    lines.push('身份：' + identity);
    lines.push('年龄：' + age);
    lines.push('男扮女装：' + cross);
    if (info.background) lines.push('背景：' + info.background);
    if (info.appearance) lines.push('外貌：' + info.appearance);
    lines.push('');
    const companionLines = companionPromptLines();
    if (companionLines.length) {
      lines.push('【开局同伴】');
      companionLines.forEach((line) => lines.push(line));
      lines.push('');
    }

    if (mode === 'city') {
      const zone = CITY_ZONE_LABEL[cityZone()];
      lines.push(`【都市模式 · ${zone}】`);
      lines.push(zone === '云下学区'
        ? '这座城里所有作品同时存在：几所学校、街区与日常彼此相邻，人物会在同一条街上遇见彼此。'
        : '联合都市：二十二部作品的地点融成一座城，人物会在同一条街上遇见彼此。');
      lines.push('{{user}}身份：' + (state.cityIdentity || identity || '学生'));
      lines.push('{{user}}生涯目标：' + (state.cityGoal || '未定'));
      lines.push('{{user}}入学区域：' + (state.cityArea || '未定'));
      lines.push('');
      lines.push('【开局设定】');
      lines.push(cityStepText());
    } else {
      lines.push(`【${openingModeLabel(mode)} · ${scene.title || '第一幕'}】`);
      lines.push('');
      lines.push('【开局设定】');
      lines.push(scene.text || '');
      if (mode === 'person') {
        const found = findPersonById(state.openingPerson);
        const route = found ? personRoute(found.person.id) : null;
        if (route && route.relation) lines.push('', `[和${found.person.name}的关系是:${route.relation}]`);
      }
    }

    lines.push('');
    lines.push('【写作要求】');
    lines.push('· 不要复述这张设定表；严格按照<角色对话格式>直接写正文。');
    if (state.persona.mode === 'role') {
      const roleName = String(info.name || state.persona.roleName || '原著角色').trim() || '原著角色';
      lines.push(`· 视点为「${roleName}」：{{user}}即是${roleName}本人，按照${roleName}的性格写她的台词、动作、决定或内心独白；把选择摆到ta面前然后停住。`);
    }
    lines.push('');
    lines.push('【本轮输出格式要求】');
    lines.push('只输出纯文本小说正文，直接开始描写场景和对话。');
    lines.push('严禁在回复中出现任何设定表、补丁代码、JSON 代码块、系统说明或系统指令。');
    return lines.join('\n');
  }

  async function submitToTavern() {
    const work = workById(state.openingWork);
    const scene = currentScene();
    if (!work || !scene) { toast('还没有选好第一幕。', 'spark'); return; }
    if (!enabledWorkList().length) {
      toast('至少接通一部作品，才能开始。', 'sliders');
      navigate('console');
      return;
    }
    if (typeof config.onSubmit !== 'function') {
      toast('当前不在酒馆环境中，无法发送开局。', 'spark');
      return;
    }
    const button = $('#sendToTavern');
    if (button) { button.disabled = true; const label = button.querySelector('span'); if (label) label.textContent = '正在送入酒馆…'; }
    try {
      await config.onSubmit(buildTavernPrompt(work, scene), buildTavernMeta(work, scene));
    } catch (error) {
      if (button) { button.disabled = false; const label = button.querySelector('span'); if (label) label.textContent = '送入酒馆并开始'; }
      toast('送入酒馆失败：' + ((error && error.message) || error), 'spark');
    }
  }

  function renderLaunchResult(work, scene) {
    const persona = state.persona;
    const activeWorks = WORKS.filter((item) => state.settings[item.id]?.enabled).length;
    const plots = WORKS.filter((item) => state.settings[item.id]?.enabled && state.settings[item.id]?.plot).length;
    const name = personaDisplayName() || '无名旅人';
    const meta = [
      `世界：${work.title}`,
      `场景：${scene.title || '第一幕'}`,
      `地点：${scene.place || work.place || '未定'}`,
      `时间：${scene.time || work.era || '2018'}`,
      `主角：${name}${persona.age ? ' · ' + persona.age + ' 岁' : ''}`,
      `身份：${persona.identity || '未定'}`,
      `世界线：${activeWorks} 部接通 / ${plots} 条剧情`
    ];
    $('#resultKicker').textContent = `${work.jp || work.title} · 2018`;
    $('#resultTitle').textContent = '第一幕，已经装订。';
    const metaBox = $('#resultMeta');
    if (metaBox) metaBox.innerHTML = meta.map((line) => {
      const parts = line.split('：');
      return `<span>${esc(parts[0])}：<b>${esc(parts.slice(1).join('：'))}</b></span>`;
    }).join('');
    const pieces = [
      `《${work.title}》· 开局档案`,
      '',
      `场景：${scene.title || '第一幕'}`,
      `时间：${scene.time || work.era || '2018'}`,
      `地点：${scene.place || work.place || '未定'}`,
      `主角：${name}${persona.age ? `（${persona.age} 岁）` : ''}`,
      `身份：${persona.identity || '未定'}`,
      '',
      '—— 第一幕 ——',
      '',
      scene.text || '',
      '',
      persona.background ? `【你的背景】${persona.background}` : '',
      persona.past ? `【你的过往】${persona.past}` : '',
      '',
      '这一页还没有被写完。',
      '下一句话，等你落笔。'
    ].filter((line) => line !== '');
    state.currentLaunchText = pieces.join('\n');
    $('#resultText').textContent = pieces.join('\n');
  }

  function renderFinalRecord() {
    const work = workById(state.openingWork);
    const scene = currentScene();
    const promptNode = $('#promptRecord');
    const meta = $('#finalMeta');
    const status = $('#finalStatus');
    if (!work || !scene) {
      if (promptNode) promptNode.textContent = '还没有选择世界与开场。先回到「开局」页挑一个入口。';
      if (meta) meta.innerHTML = '';
      if (status) status.textContent = '还没有可开始的世界。';
      return;
    }
    const info = personaPromptInfo();
    const shownName = info.mode === 'role' ? (info.name || '原著角色') : (personaDisplayName() || '未命名');
    const active = WORKS.filter((item) => state.settings[item.id]?.enabled !== false);
    const prompt = buildTavernPrompt(work, scene);
    state.finalPrompt = prompt;
    if (promptNode) promptNode.textContent = prompt;
    if (meta) {
      const chips = [
        `模式：<b>${state.cityMode === 'city' ? '联合都市' : '作品模式'}</b>`,
        `世界：<b>${esc(work.title)}</b>`,
        `场景：<b>${esc(scene.title || '第一幕')}</b>`,
        `身份：<b>${esc(info.mode === 'role' ? '扮演原著角色' : '自我')}</b>`,
        `主角：<b>${esc(shownName)}</b>`,
        `已启用：<b>${active.length}</b> 部作品`,
        info.crossdress ? '男扮女装：<b>是</b>' : '',
      ].filter(Boolean);
      meta.innerHTML = chips.map((chip) => `<span>${chip}</span>`).join('');
    }
    if (status) status.textContent = `将启用 ${active.length} 部作品 · ${scene.title || '第一幕'} · 主角：${shownName}`;
  }

  async function copyFinalPromptText() {
    const text = state.finalPrompt || '';
    if (!text) return;
    let ok = false;
    try {
      await HOST_WIN.navigator.clipboard.writeText(text);
      ok = true;
    } catch (_) {
      try {
        const area = HOST_DOC.createElement('textarea');
        area.value = text;
        area.style.cssText = 'position:fixed;opacity:0;left:-9999px;top:0';
        HOST_DOC.body.appendChild(area);
        area.focus(); area.select();
        ok = HOST_DOC.execCommand('copy');
        area.remove();
      } catch (_) { ok = false; }
    }
    toast(ok ? '提示词已复制。' : '复制失败，请手动选择文本。', ok ? 'copy' : 'spark');
  }

  async function startWorld() {
    const button = $('#launchWorld');
    const label = button ? button.querySelector('b') : null;
    if (button) button.disabled = true;
    if (label) label.textContent = '正在送入酒馆…';
    try {
      await submitToTavern();
    } finally {
      if (button) button.disabled = false;
      if (label) label.textContent = '开始这个世界';
    }
  }

  function clearLaunchTimers() {
    state.launchTimers.forEach((timer) => clearTimeout(timer));
    state.launchTimers = [];
  }

  function closeLaunch() {
    const launch = $('#launchLayer');
    if (!launch || launch.hidden) return;
    clearLaunchTimers();
    launch.hidden = true;
    launch.setAttribute('aria-hidden', 'true');
    HOST_DOC.body.style.overflow = '';
    const stage = $('.launch-stage');
    stage?.classList.remove('is-hidden');
    const result = $('#launchResult');
    if (result) result.hidden = true;
    const begin = $('#beginStory');
    if (begin) begin.focus();
  }

  async function copyOpeningText() {
    const text = state.currentLaunchText;
    if (!text) return;
    let ok = false;
    try {
      await HOST_WIN.navigator.clipboard.writeText(text);
      ok = true;
    } catch (_) {
      try {
        const area = HOST_DOC.createElement('textarea');
        area.value = text;
        area.style.cssText = 'position:fixed;opacity:0;left:-9999px;top:0';
        HOST_DOC.body.appendChild(area);
        area.focus(); area.select();
        ok = HOST_DOC.execCommand('copy');
        area.remove();
      } catch (_) { ok = false; }
    }
    toast(ok ? '开局文本已复制。' : '复制失败，请手动选择文本。', ok ? 'copy' : 'spark');
  }

  function downloadOpeningText() {
    if (!state.currentLaunchText) return;
    const work = workById(state.openingWork);
    const blob = new Blob([state.currentLaunchText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = HOST_DOC.createElement('a');
    anchor.href = url;
    anchor.download = `GALWORLD_${work.title}_开局.txt`;
    HOST_DOC.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('开局文本已下载。', 'download');
  }

  function wrapFocus(event, container) {
    const focusable = $$('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (shadow.activeElement || HOST_DOC.activeElement) === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (shadow.activeElement || HOST_DOC.activeElement) === last) { event.preventDefault(); first.focus(); }
  }

  /* ---------- Home / collection overview ---------- */
  function setupHomeGate() {
    const gate = $('#homeGate');
    if (!gate || gate.dataset.bound) return;
    gate.dataset.bound = '1';
    const dismiss = () => {
      if (state.homeGateSeen) return;
      state.homeGateSeen = true;
      gate.classList.add('is-leaving');
      setTimeout(() => { gate.hidden = true; }, 260);
    };
    gate.addEventListener('click', dismiss);
    gate.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') { event.preventDefault(); dismiss(); }
    });
    try { gate.focus({ preventScroll: true }); } catch (_) {}
  }

  function setupHome() {
    setupHomeGate();    const grid = $('#homeWorkGrid');
    const detail = $('#homeWorkDetail');
    const filters = $('#homeFilterBar');
    const toggle = $('#homeWallToggle');
    const rail = $('#homeWorkGrid');
    const railScroll = $('#homeRailScroll');
    if (rail && !rail.dataset.scrollBound) {
      rail.dataset.scrollBound = '1';
      rail.addEventListener('scroll', updateHomeRailScrollbar);
    }
    if (railScroll && !railScroll.dataset.bound) {
      railScroll.dataset.bound = '1';
      let dragging = false;
      const moveRail = (event) => {
        if (!rail || !railScroll || railScroll.hidden) return;
        const rect = railScroll.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const max = rail.scrollWidth - rail.clientWidth;
        rail.scrollLeft = ratio * max;
        updateHomeRailScrollbar();
      };
      railScroll.addEventListener('pointerdown', (event) => {
        if (!rail || railScroll.hidden) return;
        dragging = true;
        railScroll.setPointerCapture(event.pointerId);
        moveRail(event);
        event.preventDefault();
      });
      railScroll.addEventListener('pointermove', (event) => { if (dragging) moveRail(event); });
      railScroll.addEventListener('pointerup', () => { dragging = false; });
      railScroll.addEventListener('pointercancel', () => { dragging = false; });
    }
    if (toggle && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', () => {
        state.homeCollapsed = !state.homeCollapsed;
        renderHomeGallery();
        requestAnimationFrame(() => scrollHomeTo('.home-wall'));
      });
    }
    if (!window.__galHomeResizeBound) {
      window.__galHomeResizeBound = true;
      HOST_WIN.addEventListener('resize', updateHomeRailScrollbar);
    }
    if (filters && !filters.dataset.bound) {
      filters.dataset.bound = '1';
      filters.addEventListener('click', (event) => {
        const button = event.target.closest('[data-home-filter]');
        if (!button) return;
        state.homeFilter = button.getAttribute('data-home-filter');
        renderHomeFilters();
        const visible = filteredHomeWorks();
        if (visible.length && !visible.some((work) => work.id === state.selectedWork)) {
          state.selectedWork = visible[0].id;
          state.selectedCast = 0;
          state.detailTab = 'overview';
          renderHomeDetail();
          renderWorkGrid();
          renderSpine();
          renderDetail();
        }
        renderHomeGallery();
      });
    }
    if (grid && !grid.dataset.bound) {
      grid.dataset.bound = '1';
      grid.addEventListener('click', (event) => {
        const card = event.target.closest('[data-home-work]');
        if (!card) return;
        selectHomeWork(card.getAttribute('data-home-work'));
      });
    }
    if (detail && !detail.dataset.bound) {
      detail.dataset.bound = '1';
      detail.addEventListener('click', (event) => {
        const cast = event.target.closest('[data-cast]');
        if (cast) {
          state.selectedCast = Number(cast.getAttribute('data-cast')) || 0;
          renderHomeDetail();
          requestAnimationFrame(() => scrollHomeTo('.home-cast-block'));
          return;
        }
        if (event.target.closest('[data-home-top]')) {
          state.homeCollapsed = false;
          renderHomeGallery();
          requestAnimationFrame(() => scrollHomeTo('.home-wall'));
        }
      });
    }
    renderHomeFilters();
    renderHomeGallery();
    renderHomeDetail();
  }

  function filteredHomeWorks() {
    const filter = state.homeFilter || 'ALL';
    return WORKS.filter((work) => filter === 'ALL' || (work.tags || []).includes(filter));
  }

  function renderHomeFilters() {
    const bar = $('#homeFilterBar');
    if (!bar) return;
    const tags = ['ALL', ...unique(WORKS.flatMap((work) => work.tags || []))];
    bar.innerHTML = tags.map((tag) => {
      const count = tag === 'ALL' ? WORKS.length : WORKS.filter((work) => (work.tags || []).includes(tag)).length;
      const active = (state.homeFilter || 'ALL') === tag;
      return `<button class="filter-chip ${active ? 'is-active' : ''}" type="button" data-home-filter="${esc(tag)}" aria-pressed="${active}">${esc(tag === 'ALL' ? '全部' : tag)} <span>${pad(count)}</span></button>`;
    }).join('');
  }

  function syncHomeWallState() {
    const wall = $('#homeWall');
    const toggle = $('#homeWallToggle');
    if (wall) wall.classList.toggle('is-collapsed', !!state.homeCollapsed);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!state.homeCollapsed));
      const label = toggle.querySelector('span');
      if (label) label.textContent = state.homeCollapsed ? '展开' : '收起';
    }
    requestAnimationFrame(updateHomeRailScrollbar);
  }

  function updateHomeRailScrollbar() {
    const rail = $('#homeWorkGrid');
    const track = $('#homeRailScroll');
    const thumb = $('#homeRailThumb');
    if (!rail || !track || !thumb) return;
    const overflow = rail.scrollWidth - rail.clientWidth;
    const visible = !!state.homeCollapsed && overflow > 2;
    track.hidden = !visible;
    if (!visible) return;
    const width = Math.max(11, Math.min(100, (rail.clientWidth / rail.scrollWidth) * 100));
    const left = (rail.scrollLeft / overflow) * (100 - width);
    thumb.style.width = `${width}%`;
    thumb.style.left = `${left}%`;
  }

  function centerHomeActiveCard() {
    const rail = $('#homeWorkGrid');
    const active = $('.home-work-card.is-active');
    if (!rail || !active || !state.homeCollapsed) return;
    const railRect = rail.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const relativeLeft = activeRect.left - railRect.left;
    // Only recenter when the active tile is actually outside the visible rail.
    if (relativeLeft >= 0 && relativeLeft + activeRect.width <= rail.clientWidth) return;
    const left = relativeLeft + rail.scrollLeft - (rail.clientWidth - activeRect.width) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: motionReduced() ? 'auto' : 'smooth' });
  }

  function renderHomeGallery() {
    const grid = $('#homeWorkGrid');
    if (!grid) return;
    const works = filteredHomeWorks();
    grid.innerHTML = works.map((work) => {
      const settings = state.settings[work.id] || {};
      const enabled = settings.enabled !== false;
      const selected = work.id === state.selectedWork;
      return `<button class="home-work-card ${enabled ? '' : 'is-off'} ${selected ? 'is-active' : ''}" type="button" data-home-work="${esc(work.id)}" aria-pressed="${selected}" aria-label="选中《${esc(work.title)}》，在下方查看介绍">
        <span class="home-work-bg" style="background-image:url('${esc(work.cover)}')" aria-hidden="true"></span>
        <span class="home-work-top"><span class="home-work-index">${esc(work.index || '00')}</span><span class="home-work-state" data-home-state>${selected ? 'SELECTED' : enabled ? 'ON' : 'MUTED'}</span></span>
        <span class="home-work-bottom"><span class="home-work-title">${esc(work.title)}</span><span class="home-work-meta">${esc(work.place || '')}<i></i>${esc((work.tags || [])[0] || '')}</span></span>
        <span class="home-work-arrow" aria-hidden="true">${icon('arrow')}</span>
      </button>`;
    }).join('') || '<div class="home-empty">这个标签下暂时没有作品，换个筛选试试。</div>';
    const countLabel = $('#homeWorkCountLabel');
    if (countLabel) {
      countLabel.textContent = (state.homeFilter || 'ALL') === 'ALL'
        ? `${pad(WORKS.length)} 部作品`
        : `${pad(works.length)} / ${pad(WORKS.length)} 部作品`;
    }
    syncHomeWallState();
    updateHomeCardStates();
    if (state.homeCollapsed) {
      requestAnimationFrame(() => {
        centerHomeActiveCard();
        updateHomeRailScrollbar();
      });
    }
  }

  function updateHomeCardStates() {
    $$('.home-work-card').forEach((card) => {
      const settings = state.settings[card.getAttribute('data-home-work')] || {};
      const isOn = settings.enabled !== false;
      card.classList.toggle('is-off', !isOn);
      const badge = card.querySelector('[data-home-state]');
      if (badge) badge.textContent = card.classList.contains('is-active') ? 'SELECTED' : isOn ? 'ON' : 'MUTED';
    });
  }

  function scrollHomeTo(selector) {
    const scroller = $('.home-scroll');
    const target = $(selector);
    if (!scroller || !target) return;
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
    scroller.scrollTo({ top: Math.max(0, top), behavior: motionReduced() ? 'auto' : 'smooth' });
  }

  function selectHomeWork(id) {
    if (!WORK_MAP.has(id)) return;
    state.selectedWork = id;
    state.selectedCast = 0;
    state.detailTab = 'overview';
    state.storyEditing = false;
    state.homeCollapsed = true;
    renderHomeGallery();
    renderHomeDetail();
    // keep the archive page's current selection in sync, without navigating
    renderWorkGrid();
    renderSpine();
    renderDetail();
    requestAnimationFrame(() => scrollHomeTo('.home-wall'));
  }

  function renderHomeDetail() {
    const container = $('#homeWorkDetail');
    if (!container) return;
    const work = selectedWork() || WORKS[0];
    if (!work) { container.innerHTML = ''; return; }
    const cast = work.cast || [];
    container.innerHTML = `<div class="home-detail-head">
      <div class="home-detail-head-left">
        <span class="micro-label">SELECTED / 已选作品</span>
        <span class="home-detail-index">NO. ${esc(work.index || '00')} / ${pad(WORKS.length)}</span>
      </div>
      <button class="home-detail-back" type="button" data-home-top>回到选择 <svg><use href="#i-arrow"/></svg></button>
    </div>
    <div class="detail-hero home-detail-hero">
      <div class="detail-cover-wrap">
        <div class="detail-cover" style="background-image:url('${esc(work.cover)}')"><span class="detail-cover-no">${esc(work.index || '00')}</span></div>
        <div class="detail-cover-caption">${esc(work.jp || '')}<br>GALWORLD ARCHIVE</div>
      </div>
      <div class="detail-hero-copy">
        <span class="detail-kicker"><i></i>${esc(work.kicker || 'A WORLD TO REMEMBER')}</span>
        <h2 class="detail-title">${esc(work.title)}</h2>
        <p class="detail-jp">${esc(work.jp || work.place || '')}</p>
        <p class="detail-tagline">${esc(work.tagline || '')}</p>
        <p class="detail-intro">${esc(work.intro || '')}</p>
        <div class="detail-meta-row">
          <span class="detail-meta">${icon('location')}${esc(work.place || '未定地点')}</span>
          <span class="detail-meta">${icon('clock')}${esc(work.era || '2018')}</span>
          <span class="detail-meta">${icon('user')}${cast.length} 位人物档案</span>
        </div>
        <div class="detail-tags">${(work.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
      </div>
    </div>
    ${cast.length ? `<div class="home-cast-block">
      <div class="home-cast-block-head">
        <span class="micro-label">CHARACTERS / 人物档案</span>
        <span>点击人物切换 · ${pad(cast.length)} 人</span>
      </div>
      ${renderCastPanel(work)}
    </div>` : ''}`;
  }

  /* ---------- Home extras ---------- */
  function initHome() {
    const heroArt = appRoot.querySelector('.hero-art');
    if (heroArt && config.assets && config.assets.hero) heroArt.src = config.assets.hero;
    const quotes = DATA.homeQuotes || [];
    const quoteNode = $('#homeQuote');
    if (quoteNode && quotes.length) {
      let index = 0;
      setInterval(() => {
        index = (index + 1) % quotes.length;
        quoteNode.style.opacity = '0';
        setTimeout(() => { quoteNode.textContent = quotes[index]; quoteNode.style.opacity = '1'; }, 280);
      }, 7000);
    }
    const stackCovers = $$('.mini-cover');
    stackCovers.forEach((node) => {
      const work = WORK_MAP.get(node.getAttribute('data-cover'));
      if (work) node.style.backgroundImage = `url('${work.cover}')`;
    });
    $$('.hero-float-cover').forEach((node) => {
      const work = WORK_MAP.get(node.getAttribute('data-cover'));
      if (work) node.style.backgroundImage = `url('${work.cover}')`;
    });
  }

  /* ---------- Init ---------- */
  /* One broken panel must never take the whole widget down. */
  function safe(label, run) {
    try { run(); } catch (error) { console.warn('[GALWORLD] ' + label + ' 初始化失败：', error); }
  }

  function setupBgm() {
    const btn = $('#bgmToggle');
    const sync = () => {
      if (!btn) return;
      const playing = !!(bgm.audio && !bgm.audio.paused && !bgm.mutedByUser && !bgm.closed);
      btn.setAttribute('aria-pressed', String(playing));
      btn.classList.toggle('is-blocked', !playing && bgm.blocked && !bgm.mutedByUser);
      const label = btn.querySelector('span');
      if (label) {
        label.textContent = playing ? '播放中' : (bgm.blocked && !bgm.mutedByUser ? '点此开音乐' : '已静音');
      }
    };
    bgm.onUiSync = sync;
    btn?.addEventListener('click', toggleOpeningBgm);
    startOpeningBgm();
    sync();
  }

  function init() {
    safe('导航', setupNavigation);
    safe('背景音乐', setupBgm);
    safe('总览', setupHome);
    safe('作品', setupArchive);
    safe('世界', setupConsole);
    safe('世界模式', setupConsoleV2);
    safe('我的人物', setupPersona);
    safe('开局', setupOpening);
    safe('总览渲染', initHome);
    safe('粒子', initDust);
    safe('光标', initCursorGlow);
    safe('入场动画', initReveal);
    safe('筛选', renderFilters);
    safe('作品网格', renderWorkGrid);
    safe('书架', renderSpine);
    safe('作品详情', renderDetail);
    safe('通道', renderChannels);
    safe('状态汇总', refreshSummary);
    safe('世界模式渲染', renderConsoleV2);
    setTimeout(() => { try { refreshPlotRoutes(true); } catch (_) {} }, 1800);
    setTimeout(() => { try { applyDefaultProtagonistModes(); } catch (_) {} }, 2400);
    safe('开局渲染', renderOpeningV2);
    safe('开场预览', updateCinema);
    safe('人物预览', updatePersonaPreview);
    safe('导航滑块', moveNavGlider);
    const progress = $('#navProgress');
    if (progress) progress.style.width = `${((PAGE_INDEX[state.currentPage] + 1) / 5) * 100}%`;
    HOST_WIN.addEventListener('resize', () => { moveNavGlider(); }, { passive: true });
    if (HOST_WIN.ResizeObserver) {
      try { new HOST_WIN.ResizeObserver(() => moveNavGlider()).observe($('.site-nav') || appRoot); } catch (_) {}
    }
  }


  init();
  return {
    root: appRoot,
    navigate: navigate,
    refresh: function () { moveNavGlider(); }
  };
}


  function renderApp(mountPoint, mesId) {
    bgm.mount = mountPoint;
    mountPoint.setAttribute('data-gal-shadow', '1');
    mountPoint.style.cssText = 'width:100%;display:block;margin:0;padding:0;';
    const shadow = mountPoint.attachShadow({ mode: 'open' });
    const style = HD.createElement('style');
    style.textContent = APP_CSS;
    shadow.appendChild(style);
    const root = HD.createElement('div');
    root.className = 'gw-app';
    root.innerHTML = APP_HTML;
    shadow.appendChild(root);
    try {
      bootGALWORLD(root, shadow, {
        data: GAL_DATA,
        assets: GAL_ASSETS,
        onSubmit: (prompt, meta) => handleSubmit(prompt, meta, mesId),
        onToggleWork: (workId, state) => setWorkWorldbook(workId, state),
        onCityMode: (enabled) => setCityMode(enabled)
      });
    } catch (error) {
      console.error('[GALWORLD] 前端启动失败：', error);
      root.innerHTML = '<div class="gw-boot-error"><b>世界之书没有打开。</b><p>' +
        String((error && error.message) || error).replace(/[<>&]/g, '') +
        '</p><p>请确认 TavernHelper 已开启，然后刷新聊天。</p></div>';
    }
  }

  function scanAndMount() {
    for (const m of activeMounts) {
      if (m && m.isConnected) return;
      activeMounts.delete(m);
    }
    if (!activeMounts.size) stopOpeningBgm();
    HD = getHostDoc();
    const nodes = Array.from(HD.querySelectorAll('#chat .mes, .mes, [mesid]'));
    for (const node of nodes) {
      if (node.querySelector('[data-gal-shadow="1"]')) continue;
      const body = node.querySelector('.mes_text') || node;
      const content = String(body.textContent || '');
      if (content.indexOf(MARKER) < 0) continue;
      body.textContent = '';
      const mountPoint = HD.createElement('div');
      mountPoint.className = 'galworld-tavern-mount';
      const rawId = node.getAttribute('mesid');
      const mesId = (rawId !== null && rawId !== undefined && !isNaN(Number(rawId))) ? Number(rawId) : 0;
      renderApp(mountPoint, mesId);
      body.appendChild(mountPoint);
      activeMounts.add(mountPoint);
      break;
    }
  }

  function destroy() {
    activeListeners.forEach((off) => { try { off(); } catch (_) {} });
    activeListeners.length = 0;
    cleanupMounts();
    try { delete HW[SLOT]; } catch (_) { HW[SLOT] = undefined; }
  }

  /* Replace the old world-book widget if it is still active in the same page. */
  try {
    if (HW.__GAL_FATE_BOOK__ && typeof HW.__GAL_FATE_BOOK__.destroy === 'function') {
      HW.__GAL_FATE_BOOK__.destroy();
    }
  } catch (_) {}

  if (HW[SLOT] && typeof HW[SLOT].destroy === 'function') {
    try { HW[SLOT].destroy(); } catch (_) {}
  }
  HW[SLOT] = { destroy: destroy, scan: scanAndMount, version: SCRIPT_VERSION };

  let scanTimer = 0;
  function scheduleScan(delay) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanAndMount, delay || 150);
  }

  const eventOn = fn('eventOn');
  const eventRemove = fn('eventRemove');
  if (typeof eventOn === 'function') {
    const names = ['chat_changed', 'chat_id_changed', 'message_updated', 'message_swiped', 'message_received', 'message_rendered', 'generation_ended'];
    names.forEach((name) => {
      const handler = () => {
        if (name === 'chat_changed' || name === 'chat_id_changed') stopOpeningBgm();
        scheduleScan(80);
      };
      try {
        eventOn(name, handler);
        activeListeners.push(() => { try { eventRemove(name, handler); } catch (_) {} });
      } catch (_) {}
    });
  }

  const MO = HW.MutationObserver || window.MutationObserver;
  if (MO) {
    const observer = new MO(() => {
      for (const m of activeMounts) {
        if (m && !m.isConnected) activeMounts.delete(m);
      }
      if (!activeMounts.size) stopOpeningBgm();
      scheduleScan(180);
    });
    try { observer.observe(HD.getElementById('chat') || HD.body, { childList: true, subtree: true }); } catch (_) {}
    activeListeners.push(() => { clearTimeout(scanTimer); try { observer.disconnect(); } catch (_) {} });
  }

  const wins = window === HW ? [window] : [window, HW];
  wins.forEach((win) => {
    ['pagehide', 'unload', 'beforeunload'].forEach((evt) => {
      try {
        win.addEventListener(evt, destroy);
        activeListeners.push(() => { try { win.removeEventListener(evt, destroy); } catch (_) {} });
      } catch (_) {}
    });
  });

  setTimeout(scanAndMount, 250);
  setTimeout(scanAndMount, 1000);
  console.info('[GALWORLD] 开局前端 v' + SCRIPT_VERSION + ' 已加载；等待 ' + MARKER + '。');
})();
