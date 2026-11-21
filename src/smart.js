const SMART_PREFS_KEY = 'myLifeSmartPrefs';

const readPrefs = () => {
  try { return { city: 'Tehran', ...(JSON.parse(localStorage.getItem(SMART_PREFS_KEY)) || {}) }; }
  catch { return { city: 'Tehran' }; }
};

const weatherText = code => {
  if (code === 0) return 'Clear sky';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snowy';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Changing conditions';
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
    return { title: 'Start with one small step', body: 'Log one important task or a simple habit first. Suggestions get sharper as you log more.', tag: 'Getting started' };
  }
  if (pending.length >= 4) {
    return { title: 'Narrow your focus', body: `Of the ${pending.length} tasks left, pick the most important one and focus on it for 20 minutes. You don't have to do everything at once.`, tag: 'Task management' };
  }
  if (pending.length > 0) {
    return { title: 'Finish one task', body: `«${pending[0].title}» could be your next step. Split it into a short block, then move on.`, tag: 'Next step' };
  }
  if (habits.length && completedHabits.length < habits.length) {
    const nextHabit = habits.find(habit => !habit.done);
    return { title: 'Time for your habits', body: `You've handled a lot already. If you can, gently do the habit «${nextHabit?.title || 'next'}» too.`, tag: 'Build a habit' };
  }
  if (pendingGoals.length) {
    return { title: 'Take one step toward your goal', body: `Pick one goal and define the smallest action you can take for it. Goal: «${pendingGoals[0].title}».`, tag: 'Personal growth' };
  }
  if (completed.length || completedHabits.length) {
    return { title: 'You made progress today', body: `So far you've logged ${completed.length} tasks and ${completedHabits.length} habits. Take a short break, and if you have energy left, take one more small step.`, tag: 'Progress review' };
  }
  return { title: hour < 12 ? 'Start the morning calmly' : 'Keep going with a small step', body: 'Pick one clear task, set aside a short time for it, then check the result.', tag: 'Daily suggestion' };
}

function answerCoach(question, data) {
  const q = question.toLowerCase();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const habits = Array.isArray(data.habits) ? data.habits : [];
  const pending = tasks.filter(task => !task.done);
  const done = tasks.filter(task => task.done).length;
  const habitsDone = habits.filter(habit => habit.done).length;
  const insight = buildCoachInsight(data);

  if (/report|progress|performance|stats|how am i doing|summary|گزارش|پیشرفت|آمار/i.test(q)) {
    return `So far ${done} tasks are done and ${pending.length} are left. ${habitsDone} of ${habits.length} habits are done today. ${insight.body}`;
  }
  if (/priorit|start|where to begin|what should i do|what next|اولویت|شروع|از کجا|چی کار|چه کار/i.test(q)) {
    return insight.body;
  }
  if (/habit|عادت/i.test(q)) {
    const next = habits.find(habit => !habit.done);
    return next ? `I suggest you pick the habit «${next.title}» and do it in the simplest way possible. So far ${habitsDone} of ${habits.length} habits are logged.` : 'No unlogged habits are left; if you like, define a new habit for tomorrow.';
  }
  if (/goal|target|هدف/i.test(q)) {
    const goal = (data.goals || []).find(item => !item.done);
    return goal ? `For the goal «${goal.title}», choose just one small action you can do today.` : 'No active goal yet. Add one clear, realistic goal so we can plan the next step.';
  }
  return insight.body + ' You can ask me about priorities, habits, goals or your progress report.';
}

async function loadWeather(city) {
  const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' });
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
    <summary class="smart-tools-summary"><span>Daily suggestions</span><small>Weather and today's tip</small><b>+</b></summary>
    <div class="smart-grid">
      <article class="smart-card weather-card">
        <div class="smart-card-top"><h3>Today's weather</h3><span class="smart-icon">🌤️</span></div>
        <div class="weather-result" id="smart-weather-result"><span>Open this section to see the weather.</span></div>
        <form id="smart-city-form" class="smart-city-form">
          <input id="smart-city" value="${safeText(prefs.city)}" maxlength="60" aria-label="City name" placeholder="City name">
          <button type="submit">Show</button>
        </form>
      </article>
      <article class="smart-card coach-card">
        <div class="smart-card-top"><h3>Ideas for the rest of the day</h3><span class="smart-icon">↗</span></div>
        <div class="coach-insight"><h4 id="coach-title">${safeText(insight.title)}</h4><p id="coach-body">${safeText(insight.body)}</p></div>
        <form id="smart-coach-form" class="smart-coach-form">
          <input id="smart-coach-question" maxlength="180" placeholder="Ask your question..." aria-label="Ask the coach">
          <button type="submit" aria-label="Send question">←</button>
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
    weatherResult.innerHTML = '<span class="smart-loading"></span><span>Loading...</span>';
    try {
      const data = await loadWeather(city);
      if (requestId !== weatherRequestId) return;
      const c = data.current, d = data.daily;
      weatherResult.innerHTML = `
        <div class="weather-main"><span>${weatherIcon(c.weather_code)}</span><strong>${Math.round(c.temperature_2m)}°</strong><small>${safeText(weatherText(c.weather_code))}</small></div>
        <div class="weather-place">${safeText(data.place.name)}, ${safeText(data.place.country || '')}</div>
        <div class="weather-details"><span>Feels like <b>${Math.round(c.apparent_temperature)}°</b></span><span>High <b>${Math.round(d.temperature_2m_max[0])}°</b></span><span>Low <b>${Math.round(d.temperature_2m_min[0])}°</b></span></div>`;
      smartCache.weatherHTML = weatherResult.innerHTML;
      const saved = readPrefs(); saved.city = city;
      localStorage.setItem(SMART_PREFS_KEY, JSON.stringify(saved));
    } catch {
      if (requestId !== weatherRequestId) return;
      weatherResult.innerHTML = '<span class="weather-error">Could not load the weather. Check your connection or the city name.</span>';
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
