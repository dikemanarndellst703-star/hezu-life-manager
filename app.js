const initialData = {
  schemaVersion: 3,
  expenses: [
    { id: 1, icon: '⚡', title: '9 月电费', date: '9月10日', payer: '阿哲', amount: 259.5, owed: 86.5, settled: false },
    { id: 2, icon: '🧻', title: '纸巾补货', date: '9月8日', payer: '然然', amount: 126, owed: 42, settled: false },
    { id: 3, icon: '💧', title: '8 月水费', date: '9月5日', payer: '小林', amount: 81, owed: 0, settled: true },
    { id: 4, icon: '📶', title: '宽带月租', date: '9月1日', payer: '小林', amount: 129, owed: 0, settled: true },
    { id: 5, icon: '🔥', title: '燃气费', date: '8月30日', payer: '然然', amount: 96, owed: 0, settled: true },
    { id: 6, icon: '🚰', title: '净水器滤芯', date: '8月26日', payer: '阿哲', amount: 199, owed: 0, settled: true },
    { id: 7, icon: '🧹', title: '上门保洁', date: '8月22日', payer: '小林', amount: 88, owed: 0, settled: true },
    { id: 8, icon: '🥬', title: '公共食材', date: '8月18日', payer: '小林', amount: 450, owed: 0, settled: true },
  ],
  chores: [
    { id: 1, person: '然然', avatar: '然', cls: 'avatar-ran', day: '周二 · 9月10日', area: '卫生间', tasks: ['台面与镜面', '马桶与地面', '更换垃圾袋'], done: true },
    { id: 2, person: '阿哲', avatar: '哲', cls: 'avatar-zhe', day: '周四 · 9月12日', area: '阳台', tasks: ['晾衣区整理', '地面清洁', '绿植浇水'], done: true },
    { id: 3, person: '小林', avatar: '林', cls: 'avatar-lin', day: '周六 · 9月14日', area: '厨房 + 客厅', tasks: ['灶台去油', '吸尘与拖地', '公共桌面复原'], done: false },
  ],
  supplies: [
    { id: 1, emoji: '🧻', name: '抽纸', count: 2, unit: '提', level: 18, owner: '然然' },
    { id: 2, emoji: '🧴', name: '洗洁精', count: 1, unit: '瓶', level: 12, owner: '阿哲' },
    { id: 3, emoji: '🗑️', name: '垃圾袋', count: 6, unit: '个', level: 22, owner: '小林' },
    { id: 4, emoji: '🧺', name: '洗衣液', count: 2, unit: '瓶', level: 67, owner: '阿哲' },
    { id: 5, emoji: '🧽', name: '海绵擦', count: 4, unit: '个', level: 80, owner: '然然' },
    { id: 6, emoji: '💡', name: '备用灯泡', count: 3, unit: '只', level: 75, owner: '小林' },
  ],
  rules: [
    { title: '安静时间', content: '工作日 23:00 至次日 7:00 保持安静，听音乐、打游戏请佩戴耳机。', confirmed: 3 },
    { title: '公共区域', content: '使用厨房与客厅后随手复原，个人物品不过夜堆放。', confirmed: 3 },
    { title: '访客规则', content: '留宿访客请至少提前一天在群里告知，尊重其他室友安排。', confirmed: 3 },
    { title: '费用结算', content: '公共支出当天登记，每月 15 日与月底前完成一次结算。', confirmed: 3 },
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const escapeAttr = value => escapeHTML(value).replace(/`/g, '&#96;');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('roomie-demo-data'));
    return saved?.schemaVersion === initialData.schemaVersion ? saved : structuredClone(initialData);
  } catch {
    return structuredClone(initialData);
  }
}

let state = loadState();
let currentAIDraft = null;
let lastAISnapshot = null;
const persist = () => localStorage.setItem('roomie-demo-data', JSON.stringify(state));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

const themeCatalog = {
  dawn: { name: '城市晨光', color: '#3978f6' },
  night: { name: '深海夜航', color: '#0d151c' },
  utility: { name: '机械合租站', color: '#111820' },
  garden: { name: '抹茶玫瑰', color: '#6e8267' },
};

function applyTheme(theme, announce = true) {
  const nextTheme = themeCatalog[theme] ? theme : 'dawn';
  document.documentElement.dataset.theme = nextTheme;
  try { localStorage.setItem('roomie-theme', nextTheme); } catch {}
  const metaTheme = $('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = themeCatalog[nextTheme].color;
  $$('[data-theme-option]').forEach(option => {
    option.setAttribute('aria-pressed', String(option.dataset.themeOption === nextTheme));
  });
  $('#themeTrigger').title = `当前画风：${themeCatalog[nextTheme].name}`;
  $('#themeSavedText').textContent = `${themeCatalog[nextTheme].name}已保存，下次打开继续使用`;
  if (announce) showToast(`已切换为「${themeCatalog[nextTheme].name}」`);
}

function setThemePanel(open) {
  const panel = $('#themePanel');
  const scrim = $('#themeScrim');
  panel.hidden = !open;
  scrim.hidden = !open;
  $('.app-shell').inert = open;
  $('#themeTrigger').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('theme-panel-open', open);
  if (open) {
    const selected = $('[data-theme-option][aria-pressed="true"]');
    requestAnimationFrame(() => selected?.focus());
  }
}

function setDate() {
  const now = new Date();
  $('#currentDate').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now);
  setHomeGreeting();
}

function setHomeGreeting() {
  const hour = new Date().getHours();
  $('#pageTitle').textContent = `${hour < 11 ? '早上' : hour < 18 ? '下午' : '晚上'}好，小林`;
}

function renderExpenses() {
  const expenseMarkup = item => `
    <div class="expense-row">
      <span class="expense-emoji">${escapeHTML(item.icon)}</span>
      <div><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.date)} · ${escapeHTML(item.payer)}先付</p></div>
      <div class="expense-amount"><strong>${money(item.amount)}</strong><small>${item.settled ? '已结清' : item.receivable ? `待收 ${money(item.receivable)}` : `你应付 ${money(item.owed)}`}</small></div>
    </div>`;
  $('#homeExpenseList').innerHTML = state.expenses.slice(0, 3).map(expenseMarkup).join('');
  $('#expenseTable').innerHTML = state.expenses.map(item => `
    <div class="table-expense-row">
      <span class="expense-emoji">${escapeHTML(item.icon)}</span>
      <div><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.date)}</p></div>
      <span>${escapeHTML(item.payer)}支付</span><strong>${money(item.amount)}</strong>
      <span class="${item.settled ? 'paid-badge' : ''}">${item.settled ? '✓ 已结清' : item.receivable ? `待收 ${money(item.receivable)}` : `应付 ${money(item.owed)}`}</span>
    </div>`).join('');
  const total = state.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = state.expenses.filter(item => !item.settled).reduce((sum, item) => sum + Number(item.owed), 0);
  $('#totalExpenses').textContent = money(total);
  $('#expenseBalance').textContent = money(balance);
  $('#myBalance').textContent = money(balance);
  const unsettled = state.expenses.filter(item => !item.settled);
  const receivable = unsettled.reduce((sum, item) => sum + Number(item.receivable || 0), 0);
  $('#unsettledCount').textContent = unsettled.length;
  $('#balanceDetail').innerHTML = balance > 0
    ? `<span class="status-tag warning">待支付</span> ${unsettled.filter(item => item.owed > 0).length} 笔费用待处理`
    : receivable > 0
      ? `<span class="status-tag success">待收款</span> 室友还需支付 ${money(receivable)}`
      : '<span class="status-tag success">已结清</span> 暂无待处理费用';
}

function renderChores() {
  $('#homeChoreList').innerHTML = state.chores.map(item => {
    const status = item.done ? '✓ 已完成' : item.pendingApproval ? `待${escapeHTML(item.person)}确认` : '待进行';
    return `<div class="chore-line"><span class="avatar ${item.cls}">${item.avatar}</span><div><h4>${escapeHTML(item.person)} · ${escapeHTML(item.area)}</h4><p>${escapeHTML(item.day)}</p></div><span class="chore-state ${item.done ? '' : 'pending'}">${status}</span></div>`;
  }).join('');
  $('#choreBoard').innerHTML = state.chores.map(item => `
    <article class="chore-day ${!item.done ? 'current' : ''}">
      <div class="chore-day-top"><span class="avatar ${item.cls}">${item.avatar}</span><span class="week-label">${escapeHTML(item.day)}</span></div>
      <h3>${escapeHTML(item.person)} · ${escapeHTML(item.area)}</h3><p>${item.pendingApproval ? '换班请求已送达，等待对方确认' : item.done ? '这位室友已经漂亮收工' : '下一棒交给你啦'}</p>
      <ul class="task-list">${item.tasks.map(task => `<li>${item.done ? '✓' : '○'} ${escapeHTML(task)}</li>`).join('')}</ul>
      <button class="complete-button ${item.done ? 'done' : ''} ${item.pendingApproval ? 'awaiting' : ''}" data-chore="${item.id}" ${item.pendingApproval ? 'disabled' : ''}>${item.pendingApproval ? '等待对方确认' : item.done ? '✓ 已打卡' : '完成并打卡'}</button>
    </article>`).join('');
  const next = state.chores.find(item => !item.done);
  if (next) {
    $('#nextChoreDate').textContent = next.day;
    $('#nextChoreDetail').innerHTML = `<span class="status-tag info">${next.pendingApproval ? '待确认' : next.person === '小林' ? '你的班' : next.person}</span> ${escapeHTML(next.area)}`;
  } else {
    $('#nextChoreDate').textContent = '本周已完成';
    $('#nextChoreDetail').innerHTML = '<span class="status-tag success">已完成</span> 下周继续保持';
  }
}

function renderSupplies() {
  const low = state.supplies.filter(item => item.level < 25);
  $('#lowStockCount').textContent = low.length;
  $('#lowStockSummary').innerHTML = low.length
    ? `<span class="status-tag success">需补货</span> ${low.slice(0, 3).map(item => escapeHTML(item.name)).join('、')}`
    : '<span class="status-tag success">库存充足</span> 暂时无需补货';
  $('#homeSupplyList').innerHTML = low.slice(0, 3).map(item => `
    <div class="supply-mini"><span>${escapeHTML(item.emoji)}</span><div><h4>${escapeHTML(item.name)}</h4><p>仅剩 ${item.count}${escapeHTML(item.unit)}</p></div><div class="stock-bar"><i style="width:${Math.max(0, Math.min(100, item.level))}%"></i></div></div>
  `).join('') || '<p class="eyebrow">库存都很充足，暂时无需补货。</p>';
  $('#supplyGrid').innerHTML = state.supplies.map(item => `
    <article class="supply-card ${item.level < 25 ? 'low' : ''}">
      <div class="supply-card-top"><span class="supply-big-emoji">${escapeHTML(item.emoji)}</span><span class="status-tag ${item.level < 25 ? 'warning' : 'success'}">${item.level < 25 ? '快用完' : '库存充足'}</span></div>
      <h3>${escapeHTML(item.name)}</h3><p>剩余 ${item.count}${escapeHTML(item.unit)} · ${escapeHTML(item.owner)}上次登记</p>
      <div class="supply-meter"><i style="width:${Math.max(0, Math.min(100, item.level))}%"></i></div><p>库存约 ${item.level}%</p>
      <div class="supply-actions"><button data-use="${item.id}">用了一个</button><button data-restock="${item.id}">补货完成</button></div>
    </article>`).join('');
}

function renderRules() {
  $('#ruleList').innerHTML = state.rules.map((rule, index) => `
    <div class="rule-item"><span class="rule-number">${String(index + 1).padStart(2, '0')}</span><div><h4>${escapeHTML(rule.title)}</h4><p>${escapeHTML(rule.content)}</p></div><span class="rule-status ${rule.confirmed < 3 ? 'pending-rule' : ''}">${rule.confirmed}/3 ${rule.confirmed < 3 ? '待确认' : '已确认'}</span></div>
  `).join('');
}

function renderAll() {
  renderExpenses();
  renderChores();
  renderSupplies();
  renderRules();
}

function navigate(view) {
  $$('.view').forEach(element => element.classList.toggle('active', element.id === `${view}-view`));
  $$('.nav-item').forEach(element => element.classList.toggle('active', element.dataset.view === view));
  const titles = { expenses: '费用账本', chores: '清洁排班', supplies: '公共物品', agreement: '室友公约', design: '产品思考' };
  if (view === 'home') setHomeGreeting();
  else $('#pageTitle').textContent = titles[view] || '搭伙儿';
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setAIStage(stage) {
  const order = ['input', 'draft', 'confirm', 'done'];
  const stageIndex = order.indexOf(stage);
  $$('[data-ai-progress]').forEach(element => element.classList.toggle('active', order.indexOf(element.dataset.aiProgress) <= stageIndex));
  $('#aiInputStage').hidden = stage !== 'input';
  $('#aiResultStage').hidden = stage !== 'draft';
  $('#aiDoneStage').hidden = stage !== 'done';
}

function openAI(prefill = '') {
  currentAIDraft = null;
  $('#aiInput').value = prefill;
  setAIStage('input');
  if (!$('#aiModal').open) $('#aiModal').showModal();
  setTimeout(() => $('#aiInput').focus(), 0);
}

function firstMatch(text, choices, fallback) {
  return choices.find(choice => text.includes(choice)) || fallback;
}

function parseAIInput(text) {
  const compact = text.replace(/\s+/g, '');
  const names = ['小林', '阿哲', '然然'];

  if (/值日|清洁|打扫|换班|厨房|卫生间|阳台/.test(compact)) {
    const area = firstMatch(compact, ['厨房 + 客厅', '厨房', '客厅', '卫生间', '阳台'], '厨房 + 客厅');
    const assignee = firstMatch(compact, names, '阿哲');
    return { type: 'chore', label: '清洁排班', confidence: 0.91, area, assignee, day: '周六 · 9月14日', source: text };
  }

  if (/只剩|剩下|库存|补货|用完|提醒.*买/.test(compact)) {
    const name = firstMatch(compact, ['洗洁精', '抽纸', '纸巾', '垃圾袋', '洗衣液', '海绵擦'], '公共物品').replace('纸巾', '抽纸');
    const countMatch = compact.match(/(?:只剩|剩下|剩)(\d+)/);
    const count = countMatch ? Number(countMatch[1]) : 1;
    const unit = firstMatch(compact, ['瓶', '提', '个', '包', '只'], name === '抽纸' ? '提' : '瓶');
    const owner = firstMatch(compact, names, '小林');
    return { type: 'supply', label: '公共物品', confidence: countMatch ? 0.94 : 0.79, name, count, unit, owner, source: text };
  }

  const amountMatch = compact.match(/(?:¥|￥)?(\d+(?:\.\d+)?)(?:元|块)/);
  if (amountMatch || /电费|水费|燃气费|房租|宽带|网费/.test(compact)) {
    const type = firstMatch(compact, ['电费', '水费', '燃气费', '房租', '宽带', '网费', '纸巾', '洗洁精'], '共同支出');
    const monthMatch = compact.match(/(\d{1,2})月/);
    const title = monthMatch ? `${monthMatch[1]} 月${type}` : type === '共同支出' ? type : `9 月${type}`;
    const payer = /阿哲.*(?:付|交|买)|阿哲先/.test(compact) ? '阿哲' : /然然.*(?:付|交|买)|然然先/.test(compact) ? '然然' : '小林';
    return { type: 'expense', label: '共同支出', confidence: amountMatch ? 0.96 : 0.68, title, amount: amountMatch ? Number(amountMatch[1]) : '', payer, participants: 3, source: text };
  }

  if (/公约|约定|以后|请|不能|禁止|耳机|安静|访客/.test(compact)) {
    const title = /耳机|安静|晚上|夜间/.test(compact) ? '安静时间' : /访客|留宿/.test(compact) ? '访客规则' : '新提议';
    return { type: 'rule', label: '室友公约', confidence: 0.87, title, content: text, source: text };
  }

  return { type: 'unknown', label: '需要澄清', confidence: 0.42, source: text };
}

function renderAIDraft(draft) {
  $('#aiIntentBadge').textContent = draft.label;
  $('#aiConfidence').textContent = `置信度 ${Math.round(draft.confidence * 100)}%`;
  $('#aiConfidence').className = `confidence-badge ${draft.confidence < 0.6 ? 'low' : draft.confidence < 0.85 ? 'medium' : ''}`;
  $('#aiResultTitle').textContent = draft.confidence >= 0.85 ? '已整理为行动草案' : draft.confidence >= 0.6 ? '有字段需要你确认' : '暂时无法可靠理解';
  $('#aiConfirm').disabled = draft.type === 'unknown';

  if (draft.type === 'expense') {
    $('#aiDraft').innerHTML = `<div class="ai-draft-grid">
      <label class="wide">费用名称<input data-ai-field="title" value="${escapeAttr(draft.title)}" /></label>
      <label>金额（元）<input data-ai-field="amount" type="number" min="0.01" step="0.01" value="${escapeAttr(draft.amount)}" placeholder="请补充金额" /></label>
      <label>付款人<select data-ai-field="payer">${['小林', '阿哲', '然然'].map(name => `<option ${name === draft.payer ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
      <div class="ai-calculation" id="aiSplitPreview">${draft.amount ? `规则引擎计算：${money(draft.amount)} ÷ 3 = ${money(draft.amount / 3)} / 人` : '金额缺失：补充后由规则引擎计算，AI 不参与算术。'}</div>
    </div>`;
    $('#aiConfirm').textContent = '确认并写入账本';
  } else if (draft.type === 'chore') {
    $('#aiDraft').innerHTML = `<div class="ai-draft-grid">
      <label>值日区域<select data-ai-field="area">${['厨房 + 客厅', '卫生间', '阳台'].map(area => `<option ${area === draft.area ? 'selected' : ''}>${area}</option>`).join('')}</select></label>
      <label>换班对象<select data-ai-field="assignee">${['阿哲', '然然'].map(name => `<option ${name === draft.assignee ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
      <label class="wide">执行日期<input data-ai-field="day" value="${escapeAttr(draft.day)}" /></label>
      <div class="ai-calculation">涉及阿哲或然然的时间安排：执行后只会创建“待确认”的换班请求。</div>
    </div>`;
    $('#aiConfirm').textContent = '发送换班确认';
  } else if (draft.type === 'supply') {
    $('#aiDraft').innerHTML = `<div class="ai-draft-grid">
      <label>物品名称<input data-ai-field="name" value="${escapeAttr(draft.name)}" /></label>
      <label>当前数量<input data-ai-field="count" type="number" min="0" value="${draft.count}" /></label>
      <label>单位<input data-ai-field="unit" value="${escapeAttr(draft.unit)}" /></label>
      <label>提醒对象<select data-ai-field="owner">${['小林', '阿哲', '然然'].map(name => `<option ${name === draft.owner ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
      <div class="ai-calculation">低库存会进入首页提醒，但不会自动下单或产生扣款。</div>
    </div>`;
    $('#aiConfirm').textContent = '确认库存并提醒';
  } else if (draft.type === 'rule') {
    $('#aiDraft').innerHTML = `<div class="ai-draft-grid">
      <label class="wide">公约标题<input data-ai-field="title" value="${escapeAttr(draft.title)}" /></label>
      <label class="wide">提案内容<textarea data-ai-field="content" rows="3">${escapeHTML(draft.content)}</textarea></label>
      <div class="ai-calculation">提交后状态为 1/3 待确认；只有全部室友同意才正式生效。</div>
    </div>`;
    $('#aiConfirm').textContent = '发起共同确认';
  } else {
    $('#aiDraft').innerHTML = `<div class="ai-clarify"><strong>我还不能确定你想处理哪类事情</strong><p>请补充金额、物品名称、值日区域或明确这是一条公约。为避免误操作，本次不提供执行按钮。</p></div>`;
    $('#aiConfirm').textContent = '信息不足';
  }
}

function readAIField(name) {
  return $(`[data-ai-field="${name}"]`, $('#aiDraft'))?.value.trim() || '';
}

function personMeta(name) {
  return name === '阿哲' ? { avatar: '哲', cls: 'avatar-zhe' } : name === '然然' ? { avatar: '然', cls: 'avatar-ran' } : { avatar: '林', cls: 'avatar-lin' };
}

function executeAIDraft() {
  if (!currentAIDraft || currentAIDraft.type === 'unknown') return false;
  lastAISnapshot = structuredClone(state);
  const draft = currentAIDraft;

  if (draft.type === 'expense') {
    const amount = Number(readAIField('amount'));
    if (!amount || amount <= 0) { showToast('请先填写有效金额'); return false; }
    const payer = readAIField('payer');
    const title = readAIField('title') || '共同支出';
    state.expenses.unshift({ id: Date.now(), icon: '🧾', title, date: '刚刚', payer, amount, owed: payer === '小林' ? 0 : amount / 3, receivable: payer === '小林' ? amount * 2 / 3 : 0, settled: false });
    const direction = payer === '小林' ? `你先付，待收 ${money(amount * 2 / 3)}` : `你应付 ${money(amount / 3)}`;
    Object.assign(draft, { view: 'expenses', doneTitle: '已写入共同账本', doneDetail: `${title} ${money(amount)}，每人 ${money(amount / 3)}；${direction}。`, activity: `AI 已记录 ${title}，每人 ${money(amount / 3)}` });
  }

  if (draft.type === 'chore') {
    const assignee = readAIField('assignee');
    const area = readAIField('area');
    const chore = state.chores.find(item => !item.done) || state.chores[0];
    Object.assign(chore, personMeta(assignee), { person: assignee, area, day: readAIField('day'), done: false, pendingApproval: true });
    Object.assign(draft, { view: 'chores', doneTitle: '换班请求已发送', doneDetail: `等待${assignee}确认 ${area} 的本周值日。`, activity: `AI 已向${assignee}发起 ${area} 换班确认` });
  }

  if (draft.type === 'supply') {
    const name = readAIField('name') || '公共物品';
    const count = Math.max(0, Number(readAIField('count')) || 0);
    const unit = readAIField('unit') || '件';
    const owner = readAIField('owner');
    const level = count <= 1 ? 12 : count <= 2 ? 22 : 60;
    const item = state.supplies.find(supply => supply.name === name);
    if (item) Object.assign(item, { count, unit, owner, level });
    else state.supplies.unshift({ id: Date.now(), emoji: '📦', name, count, unit, owner, level });
    Object.assign(draft, { view: 'supplies', doneTitle: '库存与提醒已更新', doneDetail: `${name}剩余 ${count}${unit}，已提醒${owner}。`, activity: `AI 已更新 ${name} 库存并提醒${owner}` });
  }

  if (draft.type === 'rule') {
    const title = readAIField('title') || '新提议';
    const content = readAIField('content');
    if (!content) { showToast('请先填写公约内容'); return false; }
    state.rules.push({ title, content, confirmed: 1 });
    Object.assign(draft, { view: 'agreement', doneTitle: '公约提案已发起', doneDetail: `${title}目前为 1/3 待确认。`, activity: `AI 已整理“${title}”提案，等待室友确认` });
  }

  persist();
  renderAll();
  $('#aiDoneTitle').textContent = draft.doneTitle;
  $('#aiDoneDetail').textContent = draft.doneDetail;
  $('#aiLastAction').textContent = `刚刚 · ${draft.activity}。`;
  setAIStage('done');
  return true;
}

document.addEventListener('click', event => {
  const reviewButton = event.target.closest('[data-review-tab]');
  if (reviewButton) {
    const tab = reviewButton.dataset.reviewTab;
    navigate('design');
    $$('.review-tab').forEach(element => {
      const active = element.dataset.reviewTab === tab;
      element.classList.toggle('active', active);
      element.setAttribute('aria-selected', String(active));
    });
    $$('.review-panel').forEach(element => {
      const active = element.dataset.reviewPanel === tab;
      element.classList.toggle('active', active);
      element.hidden = !active;
    });
    return;
  }

  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { event.preventDefault(); navigate(viewButton.dataset.view); }

  const closeButton = event.target.closest('[data-close]');
  if (closeButton) $(`#${closeButton.dataset.close}`).close();

  const modalButton = event.target.closest('[data-open]');
  if (modalButton) {
    if (modalButton.dataset.open === 'aiModal') openAI(modalButton.dataset.aiPrefill || '');
    else $(`#${modalButton.dataset.open}`).showModal();
  }

  const exampleButton = event.target.closest('[data-ai-example]');
  if (exampleButton) { $('#aiInput').value = exampleButton.dataset.aiExample; $('#aiInput').focus(); }

  const choreButton = event.target.closest('[data-chore]');
  if (choreButton) {
    const chore = state.chores.find(item => item.id === Number(choreButton.dataset.chore));
    if (chore?.pendingApproval) return;
    chore.done = !chore.done; persist(); renderChores(); showToast(chore.done ? '打卡成功，辛苦啦！' : '已撤销本次打卡');
  }

  const useButton = event.target.closest('[data-use]');
  if (useButton) {
    const item = state.supplies.find(supply => supply.id === Number(useButton.dataset.use));
    item.count = Math.max(0, item.count - 1); item.level = Math.max(0, item.level - 15); persist(); renderSupplies(); showToast(`已更新 ${item.name} 的库存`);
  }

  const restockButton = event.target.closest('[data-restock]');
  if (restockButton) {
    const item = state.supplies.find(supply => supply.id === Number(restockButton.dataset.restock));
    item.count += 3; item.level = 100; persist(); renderSupplies(); showToast(`${item.name} 已补满，感谢！`);
  }
});

document.addEventListener('input', event => {
  if (event.target.matches('[data-ai-field="amount"]')) {
    const amount = Number(event.target.value);
    $('#aiSplitPreview').textContent = amount > 0 ? `规则引擎计算：${money(amount)} ÷ 3 = ${money(amount / 3)} / 人` : '金额缺失：补充后由规则引擎计算，AI 不参与算术。';
  }
});

$('#aiAnalyze').addEventListener('click', () => {
  const input = $('#aiInput').value.trim();
  if (!input) { showToast('先描述一件需要处理的合租小事'); return; }
  currentAIDraft = parseAIInput(input);
  renderAIDraft(currentAIDraft);
  setAIStage('draft');
});

$('#aiRevise').addEventListener('click', () => setAIStage('input'));
$('#aiConfirm').addEventListener('click', executeAIDraft);
$('#aiUndo').addEventListener('click', () => {
  if (!lastAISnapshot) return;
  state = structuredClone(lastAISnapshot);
  lastAISnapshot = null;
  persist(); renderAll();
  $('#aiLastAction').textContent = '上一次 AI 操作已撤销；共同数据已恢复到执行前状态。';
  $('#aiModal').close();
  showToast('已撤销本次 AI 操作');
});
$('#aiViewResult').addEventListener('click', () => {
  $('#aiModal').close();
  navigate(currentAIDraft?.view || 'home');
});

$('#expenseForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const amount = Number(data.get('amount'));
  const payer = data.get('payer');
  state.expenses.unshift({ id: Date.now(), icon: '🧾', title: data.get('title'), date: '刚刚', payer, amount, owed: payer === '小林' ? 0 : amount / 3, receivable: payer === '小林' ? amount * 2 / 3 : 0, settled: false });
  persist(); renderExpenses(); event.currentTarget.reset(); $('#expenseModal').close(); showToast(`已记录，${money(amount / 3)} / 人`);
});

$('#supplyForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.supplies.unshift({ id: Date.now(), emoji: '📦', name: data.get('name'), count: Number(data.get('count')), unit: data.get('unit'), level: 100, owner: '小林' });
  persist(); renderSupplies(); event.currentTarget.reset(); $('#supplyModal').close(); showToast('公共物品已登记');
});

$('#ruleForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.rules.push({ title: '新提议', content: data.get('content'), confirmed: 1 });
  persist(); renderRules(); event.currentTarget.reset(); $('#ruleModal').close(); showToast('已发给室友共同确认');
});

$('#settleAll').addEventListener('click', () => { state.expenses.forEach(item => { item.settled = true; item.owed = 0; item.receivable = 0; }); persist(); renderExpenses(); showToast('全部费用已结清，账目清爽！'); });
$('#rotateChores').addEventListener('click', () => {
  const people = state.chores.map(item => ({ person: item.person, avatar: item.avatar, cls: item.cls }));
  state.chores.forEach((item, index) => Object.assign(item, people[(index + 1) % people.length], { done: false, pendingApproval: false }));
  persist(); renderChores(); showToast('下周排班已轮换');
});
$('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#themeTrigger').addEventListener('click', () => setThemePanel($('#themePanel').hidden));
$('#themeClose').addEventListener('click', () => { setThemePanel(false); $('#themeTrigger').focus(); });
$('#themeScrim').addEventListener('click', () => { setThemePanel(false); $('#themeTrigger').focus(); });
$$('[data-theme-option]').forEach(option => option.addEventListener('click', () => applyTheme(option.dataset.themeOption)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#themePanel').hidden) {
    event.preventDefault();
    setThemePanel(false);
    $('#themeTrigger').focus();
    return;
  }
  if (event.key === 'Tab' && !$('#themePanel').hidden) {
    const focusable = $$('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])', $('#themePanel'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
$('#resetDemo').addEventListener('click', () => { state = structuredClone(initialData); lastAISnapshot = null; persist(); renderAll(); $('#aiLastAction').textContent = '支持费用、值日、物品与公约；AI 不会未经确认直接修改共同数据。'; showToast('演示数据已重置'); });

applyTheme(document.documentElement.dataset.theme, false);
setDate();
renderAll();
