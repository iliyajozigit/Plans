
import './style.css';
import './smart.js';

const $ = (selector) => document.querySelector(selector);
const today = () => new Date().toLocaleDateString('en-CA');

const formatDate = () =>
  new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

const defaultState = {
  date: today(),
  tasks: [],
  habits: [
    { id: 1, title: 'مطالعه و یادگیری', icon: '📚', done: false },
    { id: 2, title: 'ورزش و تحرک', icon: '🏃', done: false },
    { id: 3, title: 'نوشیدن آب', icon: '💧', done: false },
    { id: 4, title: 'برنامه‌ریزی روزانه', icon: '📝', done: false }
  ],
  xp: 0,
  water: 0,
  notes: '',
  earned: [],
  focusSessions: 0
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('myLifeState'));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();

function resetDailyData() {
  state.date = today();
  state.tasks = [];
  state.habits = state.habits.map(h => ({ ...h, done: false }));
  state.water = 0;
}

if (state.date !== today()) resetDailyData();

const badges = [
  { id: 'first-task', title: 'شروع قدرتمند', description: 'اولین وظیفه خود را کامل کن', icon: '🚀', color: 'purple', target: 1, type: 'tasks' },
  { id: 'task-master', title: 'استاد وظایف', description: '۱۰ وظیفه را به پایان برسان', icon: '🎯', color: 'blue', target: 10, type: 'tasks' },
  { id: 'habit-starter', title: 'شروع عادت‌ها', description: 'اولین عادت را انجام بده', icon: '🌱', color: 'green', target: 1, type: 'habits' },
  { id: 'habit-master', title: 'معمار عادت‌ها', description: '۴ عادت را در یک روز کامل کن', icon: '🌳', color: 'emerald', target: 4, type: 'dailyHabits' },
  { id: 'water-lover', title: 'قطره‌های سلامتی', description: '۸ لیوان آب ثبت کن', icon: '💎', color: 'cyan', target: 8, type: 'water' },
  { id: 'focus-master', title: 'استاد تمرکز', description: '۵ جلسه تمرکز انجام بده', icon: '🧠', color: 'orange', target: 5, type: 'focus' },
  { id: 'xp-collector', title: 'شکارچی تجربه', description: '۱۰۰ امتیاز تجربه کسب کن', icon: '⭐', color: 'gold', target: 100, type: 'xp' },
  { id: 'legend', title: 'افسانه My Life', description: 'به ۵۰۰ امتیاز تجربه برس', icon: '👑', color: 'pink', target: 500, type: 'xp' }
];

function save() {
  localStorage.setItem('myLifeState', JSON.stringify(state));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function getProgress(type) {
  switch (type) {
    case 'tasks':
      return state.tasks.filter(t => t.done).length;
    case 'habits':
    case 'dailyHabits':
      return state.habits.filter(h => h.done).length;
    case 'water':
      return state.water;
    case 'focus':
      return state.focusSessions;
    case 'xp':
      return state.xp;
    default:
      return 0;
  }
}

function checkBadges() {
  badges.forEach(badge => {
    if (!state.earned.includes(badge.id) && getProgress(badge.type) >= badge.target) {
      state.earned.push(badge.id);
      showToast(`🏆 نشان «${badge.title}» را دریافت کردی!`);
    }
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function addXP(amount) {
  state.xp += amount;
  checkBadges();
}

function getLevel() {
  return Math.floor(state.xp / 100) + 1;
}

function getLevelProgress() {
  return state.xp % 100;
}

function getTaskPercent() {
  const total = state.tasks.length;
  if (!total) return 0;
  return Math.round(state.tasks.filter(t => t.done).length / total * 100);
}

function getHabitPercent() {
  return Math.round(
    state.habits.filter(h => h.done).length /
    Math.max(state.habits.length, 1) * 100
  );
}

let activeView = 'dashboard';

function render() {
  const completedTasks = state.tasks.filter(t => t.done).length;
  const completedHabits = state.habits.filter(h => h.done).length;
  const taskPercent = getTaskPercent();
  const habitPercent = getHabitPercent();

  $('#app').innerHTML = `
    <div class="app-shell">
      <div class="nature-scene" aria-hidden="true">
        <span class="nature-glow glow-one"></span>
        <span class="nature-glow glow-two"></span>
        <span class="nature-glow glow-three"></span>
        <span class="nature-leaf leaf-one"></span><span class="nature-leaf leaf-two"></span>
        <span class="nature-leaf leaf-three"></span><span class="nature-leaf leaf-four"></span>
        <span class="nature-leaf leaf-five"></span><span class="nature-leaf leaf-six"></span>
        <span class="nature-leaf leaf-seven"></span><span class="nature-leaf leaf-eight"></span>
        <span class="nature-leaf leaf-nine"></span><span class="nature-leaf leaf-ten"></span>
        <span class="nature-leaf leaf-eleven"></span><span class="nature-leaf leaf-twelve"></span>
        <span class="sakura-tree sakura-left" aria-hidden="true"></span>
        <span class="sakura-tree sakura-right" aria-hidden="true"></span>
        <span class="sakura-tree sakura-far" aria-hidden="true"></span>
      </div>

      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">✦</div>
          <div>
            <h2>My Life</h2>
            <span>YOUR PERSONAL SPACE</span>
          </div>
        </div>

        <nav class="navigation">
          <p class="nav-label">فضای شخصی</p>
          <a class="nav-item ${activeView === 'dashboard' ? 'active' : ''}" href="#dashboard" data-view="dashboard"><span class="nav-symbol">▦</span><span>نمای کلی</span></a>
          <a class="nav-item ${activeView === 'planner' ? 'active' : ''}" href="#planner" data-view="planner"><span class="nav-symbol">☑</span><span>برنامه‌ریزی</span></a>
          <a class="nav-item ${activeView === 'growth' ? 'active' : ''}" href="#growth" data-view="growth"><span class="nav-symbol">✧</span><span>رشد من</span></a>
          <p class="nav-label">ابزارهای من</p>
          <a class="nav-item ${activeView === 'focus' ? 'active' : ''}" href="#focus" data-view="focus"><span class="nav-symbol">◷</span><span>تمرکز</span></a>
          <a class="nav-item ${activeView === 'journal' ? 'active' : ''}" href="#journal" data-view="journal"><span class="nav-symbol">✎</span><span>دفتر شخصی</span></a>
          <a class="nav-item ${activeView === 'settings' ? 'active' : ''}" href="#settings" data-view="settings"><span class="nav-symbol">⚙</span><span>تنظیمات</span></a>
        </nav>

        <div class="sidebar-bottom">
          <div class="mini-level">
            <span>سطح فعلی</span>
            <strong>LV. ${getLevel()}</strong>
            <div class="progress-track">
              <div style="width:${getLevelProgress()}%"></div>
            </div>
            <small>${getLevelProgress()} / 100 XP</small>
          </div>
          <div class="sidebar-footer">Made for a better you ✨</div>
        </div>
      </aside>

      <main class="main-content" id="dashboard">

        <header class="topbar">
          <div>
            <span class="eyebrow">PERSONAL DASHBOARD</span>
            <h1>${({dashboard:'روزت رو بساز',planner:'برنامه‌ریزی هوشمند',growth:'مسیر رشد تو',focus:'فضای تمرکز',journal:'دفتر شخصی',settings:'تنظیمات'})[activeView]} <span class="wave">✦</span></h1>
            <p class="date-text" id="live-date">${formatDate()}</p>
          </div>

          <div class="topbar-right">
            <div class="level-pill">⭐ سطح ${getLevel()}</div>
            <div class="avatar">M</div>
          </div>
        </header>

        <section class="page-view ${activeView === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <section class="hero-card">
          <div class="hero-content">
            <span class="hero-label">A NEW DAY, A NEW CHANCE</span>
            <h2>هر روز، یک قدم<br>بهتر از دیروز باش.</h2>
            <p>پیشرفت‌های کوچک، در طول زمان نتایج بزرگی می‌سازند.</p>
            <a href="#planner" data-view="planner" class="hero-button">
              شروع برنامه امروز <span>←</span>
            </a>
          </div>

          <div class="hero-art">
            <div class="growth-card">
              <div class="growth-card-header">
                <span>YOUR PROGRESS</span>
                <span class="growth-live">● LIVE</span>
              </div>

              <div class="growth-content">
                <div class="growth-chart">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" class="chart-bg"/>
                    <circle cx="60" cy="60" r="48" class="chart-progress"/>
                  </svg>
                  <div class="growth-percent">
                    <strong>${Math.round((taskPercent + habitPercent) / 2)}%</strong>
                    <small>پیشرفت</small>
                  </div>
                </div>

                <div class="growth-details">
                  <div class="growth-detail">
                    <span class="growth-dot purple-dot"></span>
                    <span>وظایف</span>
                    <strong>${completedTasks}/${state.tasks.length}</strong>
                  </div>
                  <div class="growth-detail">
                    <span class="growth-dot green-dot"></span>
                    <span>عادت‌ها</span>
                    <strong>${completedHabits}/${state.habits.length}</strong>
                  </div>
                  <div class="growth-detail">
                    <span class="growth-dot orange-dot"></span>
                    <span>اهداف</span>
                    <strong>${getLevel()} LV</strong>
                  </div>
                </div>
              </div>

              <div class="growth-footer">
                <span>🌱</span>
                <span>هر قدم، یک پیشرفت تازه</span>
              </div>
            </div>

            <div class="floating-leaf">🌿</div>
            <div class="floating-sparkle">✦</div>
          </div>
        </section>

        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">☑</div>
            <span>وظایف تکمیل‌شده</span>
            <strong>${completedTasks}<small> / ${state.tasks.length}</small></strong>
            <div class="stat-progress">
              <div style="width:${taskPercent}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">◈</div>
            <span>عادت‌های امروز</span>
            <strong>${completedHabits}<small> / ${state.habits.length}</small></strong>
            <div class="stat-progress">
              <div style="width:${habitPercent}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">⭐</div>
            <span>امتیاز تجربه</span>
            <strong>${state.xp}<small> XP</small></strong>
            <div class="stat-progress">
              <div style="width:${getLevelProgress()}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon cyan">💧</div>
            <span>آب نوشیده‌شده</span>
            <strong>${state.water}<small> / 8 لیوان</small></strong>
            <div class="stat-progress">
              <div style="width:${Math.min(state.water / 8 * 100, 100)}%"></div>
            </div>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'planner' ? 'active' : ''}" data-page="planner">
          <div class="page-intro"><span class="eyebrow">PLAN YOUR DAY</span><h2>برنامه‌ریزی هوشمند</h2><p>کارها و عادت‌هایت را با آرامش مدیریت کن.</p></div>
        <section class="content-grid">

          <div class="panel tasks-panel" id="tasks">
            <div class="section-heading">
              <div>
                <span class="eyebrow">DAILY PLANNER</span>
                <h2>وظایف امروز</h2>
              </div>
              <span class="counter">${completedTasks}/${state.tasks.length}</span>
            </div>

            <form id="task-form" class="add-form">
              <input
                id="task-input"
                placeholder="چه کاری باید انجام بدی؟"
                maxlength="100"
                required
              >
              <button type="submit">+</button>
            </form>

            <div class="task-list">
              ${state.tasks.length ? state.tasks.map(task => `
                <div class="task-item ${task.done ? 'completed' : ''}">
                  <button
                    class="task-check"
                    data-action="task-toggle"
                    data-id="${task.id}"
                  >${task.done ? '✓' : ''}</button>

                  <span>${escapeHTML(task.title)}</span>

                  <button
                    class="delete-button"
                    data-action="task-delete"
                    data-id="${task.id}"
                  >×</button>
                </div>
              `).join('') : `
                <div class="empty-state">
                  هنوز کاری ثبت نکردی. اولین وظیفه‌ات رو اضافه کن ✨
                </div>
              `}
            </div>
          </div>

          <div class="panel habits-panel" id="habits">
            <div class="section-heading">
              <div>
                <span class="eyebrow">BUILD YOURSELF</span>
                <h2>عادت‌های روزانه</h2>
              </div>
              <span class="counter">${habitPercent}%</span>
            </div>

            <div class="habit-list">
              ${state.habits.map(habit => `
                <button
                  class="habit-item ${habit.done ? 'habit-done' : ''}"
                  data-action="habit-toggle"
                  data-id="${habit.id}"
                >
                  <span class="habit-icon">${habit.icon}</span>
                  <span class="habit-title">${habit.title}</span>
                  <span class="habit-status">${habit.done ? '✓' : '+'}</span>
                </button>
              `).join('')}
            </div>

            <div class="habit-summary">
              <div class="progress-track">
                <div style="width:${habitPercent}%"></div>
              </div>
              <small>
                ${completedHabits} عادت از ${state.habits.length} عادت انجام شده
              </small>
            </div>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'growth' ? 'active' : ''}" data-page="growth">
          <div class="page-intro"><span class="eyebrow">PERSONAL GROWTH</span><h2>مسیر رشد تو</h2><p>دستاوردهایت را ببین و قدم‌های بعدی را بردار.</p></div>
        <section class="panel achievements-panel" id="achievements">
          <div class="badge-hero">
            <div class="badge-hero-copy">
              <span class="eyebrow">YOUR JOURNEY · ACHIEVEMENT GALLERY</span>
              <h2>تالار افتخارات</h2>
              <p>هر نشان، یادگاری از قدم‌هایی است که برای رشدت برداشته‌ای.</p>
              <div class="badge-hero-progress">
                <div class="badge-hero-track"><span style="width:${Math.round(state.earned.length / badges.length * 100)}%"></span></div>
                <strong>${Math.round(state.earned.length / badges.length * 100)}٪ تکمیل‌شده</strong>
              </div>
            </div>
            <div class="badge-trophy" aria-hidden="true"><span>🏆</span><i>✦</i></div>
          </div>
          <div class="badge-overview">
            <div class="badge-overview-item"><span class="badge-overview-icon">🏅</span><div><strong>${state.earned.length}</strong><small>نشان دریافت‌شده</small></div></div>
            <div class="badge-overview-item"><span class="badge-overview-icon">🔒</span><div><strong>${badges.length - state.earned.length}</strong><small>نشان باقی‌مانده</small></div></div>
            <div class="badge-overview-item"><span class="badge-overview-icon">⭐</span><div><strong>${state.xp}</strong><small>امتیاز تجربه</small></div></div>
          </div>

          <div class="badge-filter-heading"><div><strong>مجموعه نشان‌ها</strong><small>مسیر پیشرفتت را دنبال کن</small></div><span>${state.earned.length} از ${badges.length}</span></div>
          <div class="badge-filters">
            <button class="filter-btn active" data-filter="all">همه</button>
            <button class="filter-btn" data-filter="earned">دریافت‌شده</button>
            <button class="filter-btn" data-filter="locked">قفل‌شده</button>
          </div>

          <div class="badge-grid">
            ${badges.map(badge => {
              const earned = state.earned.includes(badge.id);
              const progress = Math.min(getProgress(badge.type), badge.target);
              const percent = Math.round(progress / badge.target * 100);

              return `
                <article
                  class="badge-card ${earned ? 'unlocked' : 'locked'} ${badge.color}"
                  data-badge="${badge.id}"
                  data-status="${earned ? 'earned' : 'locked'}"
                >
                  <div class="badge-card-topline">
                    <span class="badge-rarity-chip ${badge.target >= 500 ? 'rarity-legendary' : badge.target >= 100 || badge.target >= 10 ? 'rarity-epic' : 'rarity-rare'}">${badge.target >= 500 ? 'افسانه‌ای' : badge.target >= 100 || badge.target >= 10 ? 'حماسی' : 'ویژه'}</span>
                    <span class="badge-lock">${earned ? '✓' : '🔒'}</span>
                  </div>
                  <div class="badge-emblem-wrap">
                    <div class="badge-emblem"><span>${badge.icon}</span></div>
                    <span class="badge-emblem-spark">✦</span>
                  </div>
                  <div class="badge-card-copy">
                    <h3>${badge.title}</h3>
                    <p>${badge.description}</p>
                  </div>
                  <div class="badge-progress">
                    <div class="badge-progress-label"><small>${earned ? 'نشان دریافت شد' : 'میزان پیشرفت'}</small><strong>${earned ? '100' : percent}٪</strong></div>
                    <div class="badge-progress-track"><div style="width:${earned ? 100 : percent}%"></div></div>
                    <small class="badge-progress-count">${earned ? '✓ تکمیل‌شده' : `${progress} از ${badge.target}`}</small>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'focus' ? 'active' : ''}" data-page="focus">
          <div class="page-intro"><span class="eyebrow">FOCUS & WELLBEING</span><h2>فضای تمرکز</h2><p>برای کار عمیق و مراقبت از خودت زمان بساز.</p></div>
        <section class="content-grid lower-grid">

          <div class="panel focus-panel" id="focus">
            <div class="section-heading">
              <div>
                <span class="eyebrow">DEEP WORK</span>
                <h2>زمان تمرکز</h2>
              </div>
              <span class="focus-icon">◷</span>
            </div>

            <div class="timer" id="timer">25:00</div>
            <p class="timer-description">
              ۲۵ دقیقه تمرکز برای کارهای مهم
            </p>

            <div class="timer-controls">
              <button id="timer-start" class="primary-button">شروع</button>
              <button id="timer-reset" class="secondary-button">بازنشانی</button>
            </div>

            <small class="focus-count">
              جلسات کامل‌شده: ${state.focusSessions}
            </small>
          </div>

          <div class="panel water-panel">
            <div class="section-heading">
              <div>
                <span class="eyebrow">STAY HYDRATED</span>
                <h2>ردیاب آب</h2>
              </div>
              <span class="water-icon">💧</span>
            </div>

            <div class="water-number">
              ${state.water}<small> / 8</small>
            </div>

            <p>لیوان آب امروز</p>

            <div class="water-glasses">
              ${Array.from({ length: 8 }, (_, i) => `
                <span class="${i < state.water ? 'filled' : ''}">♧</span>
              `).join('')}
            </div>

            <button class="primary-button water-add" id="water-add">
              + ثبت یک لیوان
            </button>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'journal' ? 'active' : ''}" data-page="journal">
          <div class="page-intro"><span class="eyebrow">YOUR PRIVATE SPACE</span><h2>دفتر شخصی</h2><p>فکرها و ایده‌هایت را اینجا ثبت کن؛ فقط برای خودت.</p></div>
        <section class="panel notes-panel" id="notes">
          <div class="section-heading">
            <div>
              <span class="eyebrow">THOUGHTS & IDEAS</span>
              <h2>دفتر یادداشت من</h2>
            </div>
            <span class="notes-icon">✎</span>
          </div>

          <textarea
            id="notes-input"
            placeholder="ایده‌ها، افکار و اتفاقات امروزت رو اینجا بنویس..."
          >${escapeHTML(state.notes)}</textarea>

          <div class="notes-footer">
            <span id="save-status">ذخیره خودکار فعال است</span>
          </div>
        </section>

        </section>

        <section class="page-view ${activeView === 'settings' ? 'active' : ''}" data-page="settings">
          <div class="page-intro"><span class="eyebrow">PREFERENCES</span><h2>تنظیمات فضای تو</h2><p>ظاهر برنامه، هدف‌ها و نسخه پشتیبان اطلاعاتت را مدیریت کن.</p></div>
        </section>

        <footer class="footer">
          <span>MY LIFE ✦</span>
          <p>Small steps. Big changes.</p>
          <span>ساخته‌شده برای نسخه بهتر تو</span>
        </footer>

      </main>
    </div>
  `;

  bindEvents();
  updateTimerDisplay();
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      activeView = link.dataset.view;
      document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === link));
      document.querySelectorAll('[data-page]').forEach(page => page.classList.toggle('active', page.dataset.page === activeView));
      const titles = { dashboard: 'روزت رو بساز', planner: 'برنامه‌ریزی هوشمند', growth: 'مسیر رشد تو', focus: 'فضای تمرکز', journal: 'دفتر شخصی', settings: 'تنظیمات' };
      const heading = $('.topbar h1');
      if (heading) heading.innerHTML = `${titles[activeView]} <span class="wave">✦</span>`;
      history.replaceState(null, '', `#${activeView}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  $('#task-form').addEventListener('submit', e => {
    e.preventDefault();

    const input = $('#task-input');
    const title = input.value.trim();

    if (!title) return;

    state.tasks.push({
      id: Date.now(),
      title,
      done: false
    });

    addXP(5);
    save();
    render();
    showToast('وظیفه جدید اضافه شد ✨');
  });

  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);

      if (button.dataset.action === 'task-toggle') {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        task.done = !task.done;

        if (task.done) addXP(10);
        else state.xp = Math.max(0, state.xp - 10);
      }

      if (button.dataset.action === 'task-delete') {
        state.tasks = state.tasks.filter(t => t.id !== id);
      }

      if (button.dataset.action === 'habit-toggle') {
        const habit = state.habits.find(h => h.id === id);
        if (!habit) return;

        habit.done = !habit.done;

        if (habit.done) addXP(15);
        else state.xp = Math.max(0, state.xp - 15);
      }

      checkBadges();
      save();
      render();
    });
  });

  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
      });

      button.classList.add('active');

      document.querySelectorAll('.badge-card').forEach(card => {
        const filter = button.dataset.filter;
        card.style.display =
          filter === 'all' || card.dataset.status === filter ? '' : 'none';
      });
    });
  });

  $('#water-add').addEventListener('click', () => {
    if (state.water >= 8) {
      showToast('هدف روزانه آب تکمیل شده است 💧');
      return;
    }

    state.water++;
    addXP(2);
    save();
    render();
  });

  $('#notes-input').addEventListener('input', e => {
    state.notes = e.target.value;
    save();
    $('#save-status').textContent = 'ذخیره شد ✓';
  });

  $('#timer-start').addEventListener('click', toggleTimer);
  $('#timer-reset').addEventListener('click', resetTimer);
}

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;

function updateTimerDisplay() {
  const timer = $('#timer');
  if (!timer) return;

  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');

  timer.textContent = `${minutes}:${seconds}`;
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    $('#timer-start').textContent = 'ادامه';
    return;
  }

  timerRunning = true;
  $('#timer-start').textContent = 'توقف';

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerSeconds = 0;

      state.focusSessions++;
      addXP(25);
      save();

      showToast('جلسه تمرکزت با موفقیت تمام شد! 🧠');
      timerSeconds = 25 * 60;
      render();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 25 * 60;

  updateTimerDisplay();
  $('#timer-start').textContent = 'شروع';
}

function updateClock() {
  const dateElement = $('#live-date');
  if (dateElement) dateElement.textContent = formatDate();
}

setInterval(() => {
  if (today() !== state.date) {
    resetDailyData();
    save();
    render();
    showToast('روز جدیدی آغاز شد! ✨');
  } else {
    updateClock();
  }
}, 30000);

checkBadges();
save();
render();


// My Life Plus — incremental feature layer (keeps existing data and workflows).
const originalRender = render;
const plusDefaults = { goals: [], journal: {}, theme: 'light', waterTarget: 8 };
state.goals = Array.isArray(state.goals) ? state.goals : [];
state.journal = state.journal && typeof state.journal === 'object' ? state.journal : {};
state.settings = { ...plusDefaults, ...(state.settings || {}) };

function plusEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function plusSave() {
  localStorage.setItem('myLifeState', JSON.stringify(state));
}
function plusRender() {
  originalRender();
  document.documentElement.dataset.theme = state.settings.theme;
  const main = document.querySelector('.main-content');
  if (!main || document.getElementById('plus-tools')) return;
  const section = document.createElement('section');
  section.id = 'plus-tools';
  section.className = 'plus-grid';
  section.innerHTML =
    '<div class="panel plus-panel" id="plus-goals">' +
      '<div class="plus-heading"><div><span class="eyebrow">YOUR BIG PICTURE</span><h2>🎯 هدف‌های من</h2><p>هدف‌های مهمت رو ثبت کن و قدم‌به‌قدم جلو برو.</p></div><span class="plus-chip">' + state.goals.filter(g => g.done).length + ' / ' + state.goals.length + ' انجام‌شده</span></div>' +
      '<form id="plus-goal-form" class="plus-form"><input name="title" maxlength="90" placeholder="مثلاً: یادگیری یک مهارت جدید..." required><button>افزودن هدف +</button></form>' +
      '<div class="plus-goal-list">' + (state.goals.length ? state.goals.map(g => '<div class="plus-goal ' + (g.done ? 'done' : '') + '"><button data-plus="goal-toggle" data-id="' + g.id + '">' + (g.done ? '✓' : '○') + '</button><span>' + plusEscape(g.title) + '</span><button class="remove" data-plus="goal-delete" data-id="' + g.id + '">×</button></div>').join('') : '<div class="plus-empty">هنوز هدفی ثبت نکردی؛ اولین هدفت رو اضافه کن ✨</div>') + '</div>' +
    '</div>' +
    '<div class="panel plus-panel" id="plus-journal">' +
      '<div class="plus-heading"><div><span class="eyebrow">DAILY REFLECTION</span><h2>📔 ژورنال روزانه</h2><p>اتفاق‌ها، ایده‌ها و چیزهایی که یاد گرفتی.</p></div><span class="plus-chip">ذخیره خودکار</span></div>' +
      '<textarea id="plus-journal-input" placeholder="امروز چه چیزی برات ارزشمند بود؟">' + plusEscape(state.journal[state.date] || '') + '</textarea>' +
      '<div class="plus-journal-foot"><span id="plus-journal-status">اطلاعات فقط روی همین دستگاه ذخیره می‌شود.</span><span id="plus-journal-count">' + (state.journal[state.date] || '').length + ' کاراکتر</span></div>' +
    '</div>' +
    '<div class="panel plus-panel plus-backup">' +
      '<div class="plus-heading"><div><span class="eyebrow">YOUR DATA, YOUR CONTROL</span><h2>🛡️ مدیریت اطلاعات</h2><p>از اطلاعاتت نسخه پشتیبان بگیر یا آن را بازیابی کن.</p></div></div>' +
      '<div class="plus-actions"><button id="plus-export">↓ دریافت نسخه پشتیبان</button><label class="plus-import">↑ بازیابی نسخه پشتیبان<input id="plus-import-file" type="file" accept="application/json"></label><button id="plus-theme">' + (state.settings.theme === 'dark' ? '☀ حالت روشن' : '☾ حالت تاریک') + '</button></div>' +
      '<small class="plus-note">پیشنهاد: هر چند وقت یک‌بار از اطلاعاتت خروجی بگیر. پاک‌کردن داده‌های مرورگر می‌تواند اطلاعات محلی را حذف کند.</small>' +
    '</div>';
  const goalsPanel = section.querySelector('#plus-goals');
  const journalPanel = section.querySelector('#plus-journal');
  const backupPanel = section.querySelector('.plus-backup');
  const goalsWrap = document.createElement('div');
  const journalWrap = document.createElement('div');
  const backupWrap = document.createElement('div');
  goalsWrap.className = journalWrap.className = backupWrap.className = 'plus-grid';
  goalsWrap.appendChild(goalsPanel);
  journalWrap.appendChild(journalPanel);
  backupWrap.appendChild(backupPanel);
  main.querySelector('[data-page="growth"]').appendChild(goalsWrap);
  main.querySelector('[data-page="journal"]').appendChild(journalWrap);
  main.querySelector('[data-page="settings"]').appendChild(backupWrap);
  main.appendChild(section);
  const form = document.getElementById('plus-goal-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = new FormData(form).get('title').trim();
    if (!title) return;
    state.goals.push({ id: Date.now(), title, done: false });
    plusSave(); plusRender(); showToast('هدف جدید ثبت شد 🎯');
  });
  main.querySelectorAll('[data-plus]').forEach(button => button.addEventListener('click', () => {
    const id = Number(button.dataset.id);
    if (button.dataset.plus === 'goal-toggle') {
      const goal = state.goals.find(g => g.id === id);
      if (goal) goal.done = !goal.done;
    } else {
      state.goals = state.goals.filter(g => g.id !== id);
    }
    plusSave(); plusRender();
  }));
  const journal = document.getElementById('plus-journal-input');
  journal.addEventListener('input', () => {
    state.journal[state.date] = journal.value;
    state.notes = journal.value;
    plusSave();
    document.getElementById('plus-journal-status').textContent = 'ذخیره شد ✓';
    document.getElementById('plus-journal-count').textContent = journal.value.length + ' کاراکتر';
  });
  document.getElementById('plus-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'my-life-backup-' + state.date + '.json';
    link.click(); URL.revokeObjectURL(url);
    showToast('نسخه پشتیبان آماده شد');
  });
  document.getElementById('plus-import-file').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || !Array.isArray(imported.tasks) || !Array.isArray(imported.habits)) throw new Error('invalid');
        if (!confirm('اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟')) return;
        state = { ...state, ...imported, settings: { ...state.settings, ...(imported.settings || {}) } };
        plusSave(); plusRender(); showToast('اطلاعات با موفقیت بازیابی شد');
      } catch { showToast('فایل انتخاب‌شده معتبر نیست'); }
    };
    reader.readAsText(file);
  });
  document.getElementById('plus-theme').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    plusSave(); plusRender();
  });
}
render = function() { plusRender(); };
render();
