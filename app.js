const initialData = {
  expenses: [
    { id: 1, icon: '⚡', title: '9 月电费', date: '9月10日', payer: '阿哲', amount: 259.5, owed: 86.5, settled: false },
    { id: 2, icon: '🧻', title: '纸巾补货', date: '9月8日', payer: '然然', amount: 126, owed: 42, settled: false },
    { id: 3, icon: '💧', title: '8 月水费', date: '9月5日', payer: '小林', amount: 81, owed: 0, settled: true },
    { id: 4, icon: '📶', title: '宽带月租', date: '9月1日', payer: '小林', amount: 129, owed: 0, settled: true },
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

const saved = localStorage.getItem('roomie-demo-data');
let state = saved ? JSON.parse(saved) : structuredClone(initialData);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const persist = () => localStorage.setItem('roomie-demo-data', JSON.stringify(state));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function setDate() {
  const now = new Date();
  $('#currentDate').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now);
  const hour = now.getHours();
  $('#pageTitle').textContent = `${hour < 11 ? '早上' : hour < 18 ? '下午' : '晚上'}好，小林`;
}

function renderExpenses() {
  const expenseMarkup = item => `
    <div class="expense-row">
      <span class="expense-emoji">${item.icon}</span>
      <div><h4>${item.title}</h4><p>${item.date} · ${item.payer}先付</p></div>
      <div class="expense-amount"><strong>${money(item.amount)}</strong><small>${item.settled ? '已结清' : `你应付 ${money(item.owed)}`}</small></div>
    </div>`;
  $('#homeExpenseList').innerHTML = state.expenses.slice(0, 3).map(expenseMarkup).join('');
  $('#expenseTable').innerHTML = state.expenses.map(item => `
    <div class="table-expense-row">
      <span class="expense-emoji">${item.icon}</span>
      <div><h4>${item.title}</h4><p>${item.date}</p></div>
      <span>${item.payer}支付</span><strong>${money(item.amount)}</strong>
      <span class="${item.settled ? 'paid-badge' : ''}">${item.settled ? '✓ 已结清' : `应付 ${money(item.owed)}`}</span>
    </div>`).join('');
  const total = state.expenses.reduce((sum, item) => sum + Number(item.amount), 833);
  const balance = state.expenses.filter(item => !item.settled).reduce((sum, item) => sum + Number(item.owed), 0);
  $('#totalExpenses').textContent = money(total);
  $('#expenseBalance').textContent = money(balance);
  $('#myBalance').textContent = money(balance);
  $('#unsettledCount').textContent = state.expenses.filter(item => !item.settled).length;
}

function renderChores() {
  $('#homeChoreList').innerHTML = state.chores.map(item => `
    <div class="chore-line"><span class="avatar ${item.cls}">${item.avatar}</span><div><h4>${item.person} · ${item.area}</h4><p>${item.day}</p></div><span class="chore-state ${item.done ? '' : 'pending'}">${item.done ? '✓ 已完成' : '待进行'}</span></div>
  `).join('');
  $('#choreBoard').innerHTML = state.chores.map((item, index) => `
    <article class="chore-day ${!item.done ? 'current' : ''}">
      <div class="chore-day-top"><span class="avatar ${item.cls}">${item.avatar}</span><span class="week-label">${item.day}</span></div>
      <h3>${item.person} · ${item.area}</h3><p>${item.done ? '这位室友已经漂亮收工' : '下一棒交给你啦'}</p>
      <ul class="task-list">${item.tasks.map(task => `<li>${item.done ? '✓' : '○'} ${task}</li>`).join('')}</ul>
      <button class="complete-button ${item.done ? 'done' : ''}" data-chore="${item.id}">${item.done ? '✓ 已打卡' : '完成并打卡'}</button>
    </article>`).join('');
}

function renderSupplies() {
  const low = state.supplies.filter(item => item.level < 25);
  $('#lowStockCount').textContent = low.length;
  $('#homeSupplyList').innerHTML = low.slice(0, 3).map(item => `
    <div class="supply-mini"><span>${item.emoji}</span><div><h4>${item.name}</h4><p>仅剩 ${item.count}${item.unit}</p></div><div class="stock-bar"><i style="width:${item.level}%"></i></div></div>
  `).join('') || '<p class="eyebrow">库存都很充足，暂时无需补货。</p>';
  $('#supplyGrid').innerHTML = state.supplies.map(item => `
    <article class="supply-card ${item.level < 25 ? 'low' : ''}">
      <div class="supply-card-top"><span class="supply-big-emoji">${item.emoji}</span><span class="status-tag ${item.level < 25 ? 'warning' : 'success'}">${item.level < 25 ? '快用完' : '库存充足'}</span></div>
      <h3>${item.name}</h3><p>剩余 ${item.count}${item.unit} · ${item.owner}上次登记</p>
      <div class="supply-meter"><i style="width:${item.level}%"></i></div><p>库存约 ${item.level}%</p>
      <div class="supply-actions"><button data-use="${item.id}">用了一个</button><button data-restock="${item.id}">补货完成</button></div>
    </article>`).join('');
}

function renderRules() {
  $('#ruleList').innerHTML = state.rules.map((rule, index) => `
    <div class="rule-item"><span class="rule-number">0${index + 1}</span><div><h4>${rule.title}</h4><p>${rule.content}</p></div><span class="rule-status">${rule.confirmed}/3 已确认</span></div>
  `).join('');
}

function renderAll() { renderExpenses(); renderChores(); renderSupplies(); renderRules(); }

function navigate(view) {
  $$('.view').forEach(el => el.classList.toggle('active', el.id === `${view}-view`));
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  const titles = { home: '晚上好，小林', expenses: '费用账本', chores: '清洁排班', supplies: '公共物品', agreement: '室友公约' };
  $('#pageTitle').textContent = titles[view];
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { event.preventDefault(); navigate(viewButton.dataset.view); }
  const modalButton = event.target.closest('[data-open]');
  if (modalButton) $(`#${modalButton.dataset.open}`).showModal();
  const choreButton = event.target.closest('[data-chore]');
  if (choreButton) {
    const chore = state.chores.find(item => item.id === Number(choreButton.dataset.chore));
    chore.done = !chore.done; persist(); renderChores(); showToast(chore.done ? '打卡成功，辛苦啦！' : '已撤销本次打卡');
  }
  const useButton = event.target.closest('[data-use]');
  if (useButton) {
    const item = state.supplies.find(item => item.id === Number(useButton.dataset.use));
    item.count = Math.max(0, item.count - 1); item.level = Math.max(0, item.level - 15); persist(); renderSupplies(); showToast(`已更新 ${item.name} 的库存`);
  }
  const restockButton = event.target.closest('[data-restock]');
  if (restockButton) {
    const item = state.supplies.find(item => item.id === Number(restockButton.dataset.restock));
    item.count += 3; item.level = 100; persist(); renderSupplies(); showToast(`${item.name} 已补满，感谢！`);
  }
});

$('#expenseForm').addEventListener('submit', event => {
  event.preventDefault(); const data = new FormData(event.currentTarget); const amount = Number(data.get('amount'));
  state.expenses.unshift({ id: Date.now(), icon: '🧾', title: data.get('title'), date: '刚刚', payer: data.get('payer'), amount, owed: data.get('payer') === '小林' ? 0 : amount / 3, settled: data.get('payer') === '小林' });
  persist(); renderExpenses(); event.currentTarget.reset(); $('#expenseModal').close(); showToast(`已记录，${money(amount / 3)} / 人`);
});

$('#supplyForm').addEventListener('submit', event => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  state.supplies.unshift({ id: Date.now(), emoji: '📦', name: data.get('name'), count: Number(data.get('count')), unit: data.get('unit'), level: 100, owner: '小林' });
  persist(); renderSupplies(); event.currentTarget.reset(); $('#supplyModal').close(); showToast('公共物品已登记');
});

$('#ruleForm').addEventListener('submit', event => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  state.rules.push({ title: '新提议', content: data.get('content'), confirmed: 1 });
  persist(); renderRules(); event.currentTarget.reset(); $('#ruleModal').close(); showToast('已发给室友共同确认');
});

$('#settleAll').addEventListener('click', () => { state.expenses.forEach(item => item.settled = true); persist(); renderExpenses(); showToast('全部费用已结清，账目清爽！'); });
$('#rotateChores').addEventListener('click', () => { const people = state.chores.map(item => ({ person: item.person, avatar: item.avatar, cls: item.cls })); state.chores.forEach((item, index) => Object.assign(item, people[(index + 1) % people.length], { done: false })); persist(); renderChores(); showToast('下周排班已轮换'); });
$('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#resetDemo').addEventListener('click', () => { state = structuredClone(initialData); persist(); renderAll(); showToast('演示数据已重置'); });

setDate();
renderAll();
