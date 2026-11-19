const SMART_PREFS_KEY = 'myLifeSmartPrefs';

const readPrefs = () => {
  try { return { city: 'Tehran', ...(JSON.parse(localStorage.getItem(SMART_PREFS_KEY)) || {}) }; }
  catch { return { city: 'Tehran' }; }
};

const weatherText = code => {
  if (code === 0) return 'آسمان صاف';
  if ([1, 2].includes(code)) return 'کمی ابری';
  if (code === 3) return 'ابری';
  if ([45, 48].includes(code)) return 'مه‌آلود';
  if ([51, 53, 55, 56, 57].includes(code)) return 'نم‌نم باران';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'بارانی';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'برفی';
  if ([95, 96, 99].includes(code)) return 'رعدوبرق';
  return 'وضعیت متغیر';
};

const weatherIcon = code => {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌤️';
};

const safeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function getSmartState() {
  try { return JSON.parse(localStorage.getItem('myLifeState')) || {}; }
  catch { return {}; }
}

function buildCoachInsight(data) {
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const habits = Array.isArray(data.habits) ? data.habits : [];
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const pending = tasks.filter(task => !task.done);
  const completed = tasks.filter(task => task.done);
  const completedHabits = habits.filter(habit => habit.done);
  const pendingGoals = goals.filter(goal => !goal.done);
  const hour = new Date().getHours();

  if (!tasks.length && !habits.length) {
    return { title: 'با یک قدم کوچک شروع کن', body: 'اول یک وظیفه مهم یا یک عادت ساده ثبت کن. بعد از ثبت فعالیت‌ها، پیشنهادها دقیق‌تر می‌شوند.', tag: 'شروع مسیر' };
  }
  if (pending.length >= 4) {
    return { title: 'اولویت را کمتر کن', body: `از بین ${pending.length} کار باقی‌مانده، فقط مهم‌ترین کار را انتخاب کن و ۲۰ دقیقه روی همان تمرکز کن. لازم نیست همه‌چیز را یک‌جا انجام بدهی.`, tag: 'مدیریت وظایف' };
  }
  if (pending.length > 0) {
    return { title: 'یک کار را به پایان برسان', body: `«${pending[0].title}» می‌تواند قدم بعدی تو باشد. آن را به یک بازه کوتاه تقسیم کن و بعد سراغ کار بعدی برو.`, tag: 'پیشنهاد بعدی' };
  }
  if (habits.length && completedHabits.length < habits.length) {
    const nextHabit = habits.find(habit => !habit.done);
    return { title: 'زمان رسیدگی به عادت‌هاست', body: `بخش زیادی از کارها را مدیریت کردی. اگر شرایطش را داری، عادت «${nextHabit?.title || 'بعدی'}» را هم به‌آرامی انجام بده.`, tag: 'ساخت عادت' };
  }
  if (pendingGoals.length) {
    return { title: 'برای هدفت یک قدم بردار', body: `یکی از هدف‌هایت را انتخاب کن و کوچک‌ترین اقدام قابل انجام برای آن را مشخص کن. هدف: «${pendingGoals[0].title}».`, tag: 'رشد شخصی' };
  }
  if (completed.length || completedHabits.length) {
    return { title: 'امروز پیشرفت داشتی', body: `تا اینجا ${completed.length} وظیفه و ${completedHabits.length} عادت را ثبت کرده‌ای. کمی استراحت کن و اگر انرژی داشتی، یک قدم کوچک دیگر بردار.`, tag: 'مرور پیشرفت' };
  }
  return { title: hour < 12 ? 'صبح را آرام شروع کن' : 'با یک قدم کوچک ادامه بده', body: 'یک کار مشخص انتخاب کن، زمان کوتاهی برایش کنار بگذار و بعد نتیجه را بررسی کن.', tag: 'پیشنهاد روز' };
}

function answerCoach(question, data) {
  const q = question.toLowerCase();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const habits = Array.isArray(data.habits) ? data.habits : [];
  const pending = tasks.filter(task => !task.done);
  const done = tasks.filter(task => task.done).length;
  const habitsDone = habits.filter(habit => habit.done).length;
  const insight = buildCoachInsight(data);

  if (/گزارش|عملکرد|پیشرفت|آمار/.test(q)) {
    return `تا الان ${done} وظیفه تمام شده و ${pending.length} وظیفه باقی مانده. ${habitsDone} عادت از ${habits.length} عادت امروز انجام شده. ${insight.body}`;
  }
  if (/اولویت|شروع|از کجا|چی کار|چه کار/.test(q)) {
    return insight.body;
  }
  if (/عادت/.test(q)) {
    const next = habits.find(habit => !habit.done);
    return next ? `پیشنهاد من این است که عادت «${next.title}» را انتخاب کنی و آن را به ساده‌ترین شکل ممکن انجام بدهی. تا الان ${habitsDone} عادت از ${habits.length} عادت ثبت شده.` : 'عادت ثبت‌نشده‌ای باقی نمانده؛ اگر دوست داری می‌توانی برای فردا یک عادت تازه تعریف کنی.';
  }
  if (/هدف/.test(q)) {
    const goal = (data.goals || []).find(item => !item.done);
    return goal ? `برای هدف «${goal.title}» فقط یک اقدام کوچک و قابل انجام برای امروز مشخص کن.` : 'هنوز هدف فعالی ثبت نشده. یک هدف روشن و واقع‌بینانه اضافه کن تا بتوانیم قدم بعدی را مشخص کنیم.';
  }
  return insight.body + ' می‌توانی درباره اولویت‌ها، عادت‌ها، هدف‌ها یا گزارش پیشرفتت سؤال کنی.';
}

async function loadWeather(city) {
  const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.search = new URLSearchParams({ name: city, count: '1', language: 'fa', format: 'json' });
  const geoResponse = await fetch(geoUrl, { signal: AbortSignal.timeout(10000) });
  if (!geoResponse.ok) throw new Error('geocoding');
  const geo = await geoResponse.json();
  const place = geo.results?.[0];
  if (!place) throw new Error('city');

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    timezone: 'auto',
    forecast_days: '1'
  });
  const weatherResponse = await fetch(forecastUrl, { signal: AbortSignal.timeout(10000) });
  if (!weatherResponse.ok) throw new Error('weather');
  const weather = await weatherResponse.json();
  return { place, current: weather.current, daily: weather.daily };
}

let weatherRequestId = 0;
const smartCache = { open: false, weatherHTML: '', coachAnswer: '' };

function mountSmartHub() {
  const dashboard = document.querySelector('[data-page="dashboard"]');
  if (!dashboard || dashboard.querySelector('#smart-hub')) return;

  const prefs = readPrefs();
  const insight = buildCoachInsight(getSmartState());
  const hub = document.createElement('details');
  hub.id = 'smart-hub';
  hub.className = 'smart-hub smart-tools-details';
  hub.innerHTML = `
    <summary class="smart-tools-summary"><span>پیشنهادهای روزانه</span><small>آب‌وهوا و پیشنهاد روزانه</small><b>+</b></summary>
    <div class="smart-grid">
      <article class="smart-card weather-card">
        <div class="smart-card-top"><h3>آب‌وهوای امروز</h3><span class="smart-icon">🌤️</span></div>
        <div class="weather-result" id="smart-weather-result"><span>برای دریافت آب‌وهوا، این بخش را باز کن.</span></div>
        <form id="smart-city-form" class="smart-city-form">
          <input id="smart-city" value="${safeText(prefs.city)}" maxlength="60" aria-label="نام شهر" placeholder="نام شهر">
          <button type="submit">نمایش</button>
        </form>
      </article>
      <article class="smart-card coach-card">
        <div class="smart-card-top"><h3>پیشنهاد برای ادامه روز</h3><span class="smart-icon">↗</span></div>
        <div class="coach-insight"><h4 id="coach-title">${safeText(insight.title)}</h4><p id="coach-body">${safeText(insight.body)}</p></div>
        <form id="smart-coach-form" class="smart-coach-form">
          <input id="smart-coach-question" maxlength="180" placeholder="سؤالت را بنویس..." aria-label="سؤال از مربی">
          <button type="submit" aria-label="ارسال سؤال">←</button>
        </form>
        <p id="smart-coach-answer" class="smart-coach-answer" aria-live="polite"></p>
      </article>
    </div>
  `;

  dashboard.appendChild(hub);
  hub.open = smartCache.open;
  hub.querySelector('#smart-coach-answer').textContent = smartCache.coachAnswer;
  let weatherLoaded = !!smartCache.weatherHTML;
  const weatherResult = hub.querySelector('#smart-weather-result');
  if (smartCache.weatherHTML) weatherResult.innerHTML = smartCache.weatherHTML;
  const refreshWeather = async city => {
    const requestId = ++weatherRequestId;
    weatherResult.innerHTML = '<span class="smart-loading"></span><span>در حال دریافت...</span>';
    try {
      const data = await loadWeather(city);
      if (requestId !== weatherRequestId) return;
      const c = data.current, d = data.daily;
      weatherResult.innerHTML = `
        <div class="weather-main"><span>${weatherIcon(c.weather_code)}</span><strong>${Math.round(c.temperature_2m)}°</strong><small>${safeText(weatherText(c.weather_code))}</small></div>
        <div class="weather-place">${safeText(data.place.name)}، ${safeText(data.place.country || '')}</div>
        <div class="weather-details"><span>حس‌شده <b>${Math.round(c.apparent_temperature)}°</b></span><span>بیشینه <b>${Math.round(d.temperature_2m_max[0])}°</b></span><span>کمینه <b>${Math.round(d.temperature_2m_min[0])}°</b></span></div>`;
      smartCache.weatherHTML = weatherResult.innerHTML;
      const saved = readPrefs(); saved.city = city;
      localStorage.setItem(SMART_PREFS_KEY, JSON.stringify(saved));
    } catch {
      if (requestId !== weatherRequestId) return;
      weatherResult.innerHTML = '<span class="weather-error">آب‌وهوا دریافت نشد؛ اتصال اینترنت یا نام شهر را بررسی کن.</span>';
    }
  };

  hub.addEventListener('toggle', () => {
    smartCache.open = hub.open;
    if (hub.open && !weatherLoaded) {
      weatherLoaded = true;
      refreshWeather(prefs.city);
    }
  });
  hub.querySelector('#smart-city-form').addEventListener('submit', event => {
    event.preventDefault();
    const city = hub.querySelector('#smart-city').value.trim();
    if (city) { weatherLoaded = true; refreshWeather(city); }
  });
  hub.querySelector('#smart-coach-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = hub.querySelector('#smart-coach-question');
    const question = input.value.trim();
    if (!question) return;
    smartCache.coachAnswer = answerCoach(question, getSmartState());
    hub.querySelector('#smart-coach-answer').textContent = smartCache.coachAnswer;
    input.value = '';
  });
}
const smartObserver = new MutationObserver(() => mountSmartHub());
smartObserver.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
mountSmartHub();
