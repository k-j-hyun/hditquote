// 현대아이티 견적 시스템 - 공통 데이터 & 유틸리티

const DEFAULT_ACCOUNTS = [
  // 관리자
  { id: 'hditadmin',   password: 'hditsmart', name: '양진우',   role: 'admin',    createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
  { id: 'hditadmin01', password: 'hditsmart', name: '전종원',   role: 'admin',    createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
  { id: 'hditadmin02', password: 'hditsmart', name: '박진호',   role: 'admin',    createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
  // 직원
  { id: 'hdit01',       password: '1111',     name: '고정현',   role: 'employee', createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
  { id: 'hdit02',       password: '1111',     name: '김성규',   role: 'employee', createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
  { id: 'hdit03',       password: '1111',     name: '최민우',   role: 'employee', createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
  { id: 'hditimployee', password: '1111',     name: 'CX매니저', role: 'employee', createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' }
];

(function initSystem() {
  // Always upsert DEFAULT_ACCOUNTS so they work on any device
  const users = JSON.parse(localStorage.getItem('hdit_users') || '[]');
  DEFAULT_ACCOUNTS.forEach(function(def) {
    const idx = users.findIndex(function(u) { return u.id === def.id; });
    if (idx === -1) {
      users.push(def);
    } else {
      // Update password/name/role in case defaults changed, but keep createdAt
      users[idx].password = def.password;
      users[idx].name = def.name;
      users[idx].role = def.role;
    }
  });
  localStorage.setItem('hdit_users', JSON.stringify(users));

  if (!localStorage.getItem('hdit_logs')) localStorage.setItem('hdit_logs', JSON.stringify([]));
  if (!localStorage.getItem('hdit_quotes')) localStorage.setItem('hdit_quotes', JSON.stringify([]));
  if (!localStorage.getItem('hdit_q_counter')) localStorage.setItem('hdit_q_counter', '0');
})();

// ==================== AUTH ====================
function getUsers() { return JSON.parse(localStorage.getItem('hdit_users') || '[]'); }
function saveUsers(u) { localStorage.setItem('hdit_users', JSON.stringify(u)); }

function login(userId, password) {
  const user = getUsers().find(u => u.id === userId && u.password === password);
  if (!user) return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  const session = { id: user.id, name: user.name, role: user.role, loginTime: new Date().toISOString() };
  sessionStorage.setItem('hdit_session', JSON.stringify(session));
  addLog({ type: 'login', userId: user.id, userName: user.name, role: user.role, timestamp: session.loginTime, detail: '로그인' });
  return { success: true, role: user.role };
}

function logout() {
  const s = getSession();
  if (s) addLog({ type: 'logout', userId: s.id, userName: s.name, role: s.role, timestamp: new Date().toISOString(), detail: '로그아웃' });
  sessionStorage.removeItem('hdit_session');
  window.location.href = 'index.html';
}

function getSession() {
  const s = sessionStorage.getItem('hdit_session');
  return s ? JSON.parse(s) : null;
}

function requireAuth(requiredRole) {
  const s = getSession();
  if (!s) { window.location.href = 'index.html'; return null; }
  if (requiredRole && s.role !== requiredRole) {
    window.location.href = s.role === 'admin' ? 'admin.html' : 'sales.html';
    return null;
  }
  return s;
}

// ==================== USER MANAGEMENT ====================
function createUser(id, password, name, role, createdBy) {
  const users = getUsers();
  if (users.find(u => u.id === id)) return { success: false, message: '이미 존재하는 아이디입니다.' };
  if (!id || !password || !name) return { success: false, message: '모든 항목을 입력해주세요.' };
  users.push({ id, password, name, role, createdAt: new Date().toISOString(), createdBy });
  saveUsers(users);
  return { success: true };
}

function deleteUser(id) {
  if (id === 'hditadmin') return { success: false, message: '기본 관리자 계정은 삭제할 수 없습니다.' };
  let users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { success: false, message: '사용자를 찾을 수 없습니다.' };
  users.splice(idx, 1);
  saveUsers(users);
  return { success: true };
}

// ==================== LOGGING ====================
function getLogs() { return JSON.parse(localStorage.getItem('hdit_logs') || '[]'); }
function getQuotes() { return JSON.parse(localStorage.getItem('hdit_quotes') || '[]'); }

function addLog(log) {
  const logs = getLogs();
  logs.unshift(log);
  if (logs.length > 2000) logs.splice(2000);
  localStorage.setItem('hdit_logs', JSON.stringify(logs));
}

function saveQuote(data) {
  const quotes = getQuotes();
  let c = parseInt(localStorage.getItem('hdit_q_counter') || '0') + 1;
  localStorage.setItem('hdit_q_counter', c.toString());
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const quoteId = `Q-${dateStr}-${c.toString().padStart(3, '0')}`;
  const quote = { quoteId, timestamp: new Date().toISOString(), ...data };
  quotes.unshift(quote);
  if (quotes.length > 5000) quotes.splice(5000);
  localStorage.setItem('hdit_quotes', JSON.stringify(quotes));
  addLog({ type: 'quote', userId: data.userId, userName: data.userName, role: data.role, timestamp: quote.timestamp, detail: `견적서 발행: ${quoteId} — ${data.productLabel}`, quoteId });
  return quoteId;
}

// ==================== PRICE DATA ====================
const LUMPSUM = {
  'IX': { 'IX98': 12000000, 'IX86': 6800000, 'IX75': 5900000, 'IX65': 4900000 },
  'MX': { 'MX98': 9990000, 'MX86 PRO': 5850000, 'MX86': 5350000, 'MX75': 4350000, 'MX65': 3950000, 'MX55': 2300000 },
  'N시리즈': { 'N A86': 3600000, 'N W86': 4300000 },
  '아카데미': { '아카데미 65+': 2180000 },
  '알파': { '알파 3.0 86': 3100000 }
};

// rental[model][option][deposit] = { months:[], prices:[], totals:[] }
const RENTAL = {
  'IX65': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[453000,249000,182000,149000],    totals:[5436000,5976000,6552000,7152000] },
      1000000: { months:[24,36,48,60],    prices:[166000,123400,108900,100000],    totals:[4984000,5442400,6227200,7000000] },
      2000000: { months:[36,48,60],       prices:[88500,80500,75900],              totals:[5186000,5864000,6554000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[524000,288000,211000,172000],    totals:[6288000,6912000,7596000,8256000] },
      1000000: { months:[24,36,48,60],    prices:[199000,146500,128000,118000],    totals:[5776000,6274000,7144000,8080000] },
      2000000: { months:[36,48,60],       prices:[108800,97700,92000],             totals:[5916800,6689600,7520000] }
    }
  },
  'IX75': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[545000,299000,219000,179000],    totals:[6540000,7176000,7884000,8592000] },
      1000000: { months:[24,36,48,60],    prices:[206000,152900,134400,123000],    totals:[5944000,6504400,7451200,8380000] },
      2000000: { months:[36,48,60],       prices:[114400,103000,96800],            totals:[6118400,6944000,7808000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[616000,339000,248000,202000],    totals:[7392000,8136000,8928000,9696000] },
      1000000: { months:[24,36,48,60],    prices:[238000,176000,153900,142000],    totals:[6712000,7336000,8387200,9520000] },
      2000000: { months:[36,48,60],       prices:[134700,120200,112900],           totals:[6849200,7769600,8774000] }
    }
  },
  'IX86': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[629000,345000,253000,206000],    totals:[7548000,8280000,9108000,9888000] },
      1000000: { months:[24,36,48,60],    prices:[244000,180000,157300,145000],    totals:[6856000,7480000,8550400,9700000] },
      2000000: { months:[36,48,60],       prices:[138200,123200,115600],           totals:[6975200,7913600,8936000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[700000,384000,281000,230000],    totals:[8400000,9216000,10116000,11040000] },
      1000000: { months:[24,36,48,60],    prices:[275000,202000,177700,163000],    totals:[7600000,8272000,9529600,10780000] },
      2000000: { months:[36,48,60],       prices:[157800,141200,131800],           totals:[7680800,8777600,9908000] }
    }
  },
  'IX98': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[1017000,559000,409000,334000],   totals:[12204000,13416000,14724000,16032000] },
      2000000: { months:[24,36,48,60],    prices:[380000,282000,248300,229000],    totals:[11120000,12152000,13918400,15740000] },
      4000000: { months:[36,48,60],       prices:[208500,188000,176900],           totals:[11506000,13024000,14614000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[1088000,598000,438000,358000],   totals:[13056000,14352000,15768000,17184000] },
      2000000: { months:[24,36,48,60],    prices:[411700,305900,268800,247000],    totals:[11880800,13012400,14902400,16820000] },
      4000000: { months:[36,48,60],       prices:[228800,206000,193000],           totals:[12236800,13888000,15580000] }
    }
  },
  'MX55': {
    '벽걸이': {
      0:      { months:[12,24,36,48],     prices:[170000,94000,69000,56000],       totals:[2040000,2256000,2484000,2688000] },
      500000: { months:[24,36,48,60],     prices:[58500,44000,38700,36600],        totals:[1904000,2084000,2357600,2696000] }
    },
    '선반스탠드': {
      0:      { months:[12,24,36,48],     prices:[191000,105000,77000,63000],      totals:[2512000,2740000,2992000,3244000] },
      720000: { months:[24,36,48,60],     prices:[67300,50400,44600,42000],        totals:[2335200,2534400,2860800,3240000] }
    }
  },
  'MX65': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[365000,200000,147000,119000],    totals:[4380000,4800000,5292000,5712000] },
      1000000: { months:[24,36,48,60],    prices:[127000,95000,83000,78000],       totals:[4048000,4420000,4984000,5680000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[436000,239000,175000,143000],    totals:[5232000,5736000,6300000,6864000] },
      1000000: { months:[24,36,48,60],    prices:[158000,118000,104000,97000],     totals:[4792000,5248000,5992000,6820000] }
    }
  },
  'MX75': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[399000,220000,162000,130000],    totals:[4788000,5280000,5832000,6240000] },
      1000000: { months:[24,36,48,60],    prices:[143000,107000,93000,88000],      totals:[4432000,4852000,5464000,6280000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[473000,260000,190000,155000],    totals:[5676000,6240000,6840000,7440000] },
      1000000: { months:[24,36,48,60],    prices:[175000,130000,114000,106000],    totals:[5200000,5680000,6472000,7360000] }
    }
  },
  'MX86': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[490000,271000,199000,160000],    totals:[5880000,6504000,7164000,7680000] },
      1000000: { months:[24,36,48,60],    prices:[183000,137000,118000,111000],    totals:[5392000,5932000,6664000,7660000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[566000,311000,228000,186000],    totals:[6792000,7464000,8208000,8928000] },
      1000000: { months:[24,36,48,60],    prices:[215000,160000,140000,130000],    totals:[6160000,6760000,7720000,8800000] }
    }
  },
  'MX86 PRO': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[540000,297000,220000,178000],    totals:[6480000,7128000,7920000,8544000] },
      1000000: { months:[24,36,48,60],    prices:[204000,154000,134000,125000],    totals:[5896000,6544000,7432000,8500000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[612000,337000,246000,201000],    totals:[7344000,8088000,8856000,9648000] },
      1000000: { months:[24,36,48,60],    prices:[236000,175000,153000,142000],    totals:[6664000,7300000,8344000,9520000] }
    }
  },
  'MX98': {
    '벽걸이': {
      0:       { months:[12,24,36,48],    prices:[924000,508000,372000,304000],    totals:[11088000,12192000,13392000,14592000] },
      2000000: { months:[24,36,48,60],    prices:[339700,253100,222900,207600],    totals:[10152800,11111600,12699200,14456000] }
    },
    '전동스탠드': {
      0:       { months:[12,24,36,48],    prices:[977000,547000,401000,327000],    totals:[11724000,13128000,14436000,15696000] },
      2000000: { months:[24,36,48,60],    prices:[370900,281900,248400,231000],    totals:[10901600,12148400,13923200,15860000] }
    }
  }
};

const RENTAL_SERIES = {
  'IX': ['IX65', 'IX75', 'IX86', 'IX98'],
  'MX': ['MX55', 'MX65', 'MX75', 'MX86', 'MX86 PRO', 'MX98']
};

const LUMPSUM_ONLY_SERIES = ['N시리즈', '아카데미', '알파'];
const LUMPSUM_STAND_PRICES = { 'none': 0, '선반스탠드': 440000, '전동스탠드': 770000 };
const PROMOTIONS = ['2026 렌탈런칭 프로모션', '가정의달 프로모션', '2026 코바박람회 프로모션', '웨딩 프로모션', '기업 프로모션', '학원 프로모션'];
const FREEBIES = ['설치비', '운반비', '프로그램비 (판서)', '프로그램비 (미러링)', '프로그램비 (윈도우판서)', 'VAT'];

// ==================== PRODUCT SPECS ====================
const SPECS = {
  'MX55':     { size: '1270.8 × 791.2 mm',          weight: '28 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 16GB', ssd: 'NVMe M.2 256GB', display: '3,840 × 2,160 (4K UHD)' },
  'MX65':     { size: '1490 × 915.3 × 83.7 mm',     weight: '40 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 32GB', ssd: 'NVMe M.2 512GB', display: '3,840 × 2,160 (4K UHD)' },
  'MX75':     { size: '1714.4 × 1042.6 × 83.7 mm',  weight: '50 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 32GB', ssd: 'NVMe M.2 512GB', display: '3,840 × 2,160 (4K UHD)' },
  'MX86':     { size: '1959 × 1180 × 84 mm',         weight: '63 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 32GB', ssd: 'NVMe M.2 512GB', display: '3,840 × 2,160 (4K UHD)' },
  'IX65':     { size: '1490 × 915.3 × 83.7 mm',     weight: '40 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 32GB', ssd: 'NVMe M.2 512GB', display: '3,840 × 2,160 (4K QLED HDR)' },
  'IX75':     { size: '1714.4 × 1042.6 × 83.7 mm',  weight: '50 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 32GB', ssd: 'NVMe M.2 512GB', display: '3,840 × 2,160 (4K QLED HDR)' },
  'IX86':     { size: '1959 × 1180 × 84 mm',         weight: '63 kg', cpu: 'RK3588', gpu: 'Mali-G610 (Mali650)', ram: 'DDR4 32GB', ssd: 'NVMe M.2 512GB', display: '3,840 × 2,160 (4K QLED HDR)' },
};

// ==================== UTILITIES ====================
function fmtPrice(n) {
  return n.toLocaleString('ko-KR') + '원';
}

function fmtDeposit(d) {
  if (d === 0) return '선납금 없음';
  if (d === 500000) return '50만원';
  if (d === 720000) return '72만원';
  if (d === 1000000) return '100만원';
  if (d === 2000000) return '200만원';
  if (d === 4000000) return '400만원';
  return fmtPrice(d);
}

function fmtDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getStandLabel(model) {
  return model === 'MX55' ? '선반스탠드' : '전동스탠드';
}

function getAvailableDeposits(model, optionLabel) {
  const d = RENTAL[model];
  if (!d || !d[optionLabel]) return [];
  return Object.keys(d[optionLabel]).map(Number).sort((a, b) => a - b);
}

function getRentalEntry(model, optionLabel, deposit) {
  try { return RENTAL[model][optionLabel][deposit]; } catch { return null; }
}
