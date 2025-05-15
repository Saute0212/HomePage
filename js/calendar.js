//現在表示している年月
let currentYear;
let currentMonth;

//JSONファイルを非同期で読み込む
async function loadJSON(path) {
    const cacheBuster = `?_=${new Date().getTime()}`;
    const response = await fetch(path + cacheBuster);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return await response.json();
  }

//JSONファイルの有無を確認
async function checkJsonExists(year, month) {
  if (month < 1) {
    year -= 1;
    month = 12;
  } else if (month > 12) {
    year += 1;
    month = 1;
  }
  const file = `calendar/${year}_${String(month).padStart(2, '0')}.json`;
  try {
    const response = await fetch(file + `?_=${new Date().getTime()}`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

//日付のフォーマットを YYYY-MM-DD に統一
function formatDate(year, month, day) {
    const pad = num => String(num).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  }

//曜日クラスを返す
function getTextColorClass(jsDay, dateStr, holidayMap) {
  if (holidayMap.has(dateStr)) return 'text-holiday';
  if (jsDay === 0) return 'text-sunday';
  if (jsDay === 6) return 'text-saturday';
  return 'text-weekday';
}

//背景色クラスを返す
function getDayTypeClass(dateStr, dayTypeMap) {
  return dayTypeMap[dateStr] || '';
}

//年月・"＜", "＞"ボタンの生成
function createHeader(year, month, canPrev, canNext) {
  return `
    <div class="calendar-header">
      <button onclick="changeMonth(-1)" ${canPrev ? '' : 'disabled'}>＜</button>
      ${year}年 ${month}月
      <button onclick="changeMonth(1)" ${canNext ? '' : 'disabled'}>＞</button>
    </div>
  `;
}

//曜日ヘッダーの生成
function createTableHeader() {
  return `
    <thead>
      <tr>
        <th>日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th>
      </tr>
    </thead>
  `;
}

//休業日・営業日・イベント日をマップに変換
function buildDayTypeMap(year, month, closed, open, events) {
  const map = {};
  closed.forEach(day => map[formatDate(year, month, day)] = 'closed');
  open.forEach(day => map[formatDate(year, month, day)] = 'open');
  Object.keys(events).forEach(day => map[formatDate(year, month, day)] = 'event');
  return map;
}

//祝日をマップに変換
function buildHolidayMap(year, month, holidays) {
  return new Set(holidays.map(day => formatDate(year, month, day)));
}

//月移動(-1 or +1)
function changeMonth(diff) {
  currentMonth += diff;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear += 1;
  } else if (currentMonth < 1) {
    currentMonth = 12;
    currentYear -= 1;
  }
  renderCalendar();
}

//カレンダー本体生成
function createCalendarBody(year, month, dayTypeMap, events, holidayMap) {
  const tbody = document.createElement('tbody');
  const firstDate = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();

  let row = document.createElement('tr');
  let startDayIndex = firstDate.getDay(); //日曜始まり

  for (let i = 0; i < startDayIndex; i++) {
    row.appendChild(document.createElement('td'));
  }

  for (let date = 1; date <= lastDay; date++) {
    const currentDate = new Date(year, month - 1, date);
    const jsDay = currentDate.getDay(); //0〜6（日〜土）
    const dateStr = formatDate(year, month, date);

    const td = document.createElement('td');
    const textClass = getTextColorClass(jsDay, dateStr, holidayMap);
    if (textClass) td.classList.add(textClass);

    const dayClass = getDayTypeClass(dateStr, dayTypeMap);
    if (dayClass) td.classList.add(dayClass);

    td.innerHTML = `<div>${date}</div>`;

    if (dayTypeMap[dateStr] === 'event') {
      const link = document.createElement('a');
      link.href = events[date];
      link.target = '_blank';
      link.textContent = 'イベント詳細';
      link.className = 'event-button';
      td.appendChild(link);
    }

    row.appendChild(td);

    if (jsDay === 6) {
      tbody.appendChild(row);
      row = document.createElement('tr');
    }
  }

  if (row.children.length > 0) {
    while (row.children.length < 7) {
      row.appendChild(document.createElement('td'));
    }
    tbody.appendChild(row);
  }

  return tbody;
}

//カレンダーの描画
async function renderCalendar() {
  try {
    if (currentYear === undefined || currentMonth === undefined) {
      const defaultData = await loadJSON('calendar/default.json');
      currentYear = defaultData.year;
      currentMonth = defaultData.month;
    }

    const jsonPath = `calendar/${currentYear}_${String(currentMonth).padStart(2, '0')}.json`;
    const data = await loadJSON(jsonPath);

    const { closed = [], open = [], events = {}, holiday = [] } = data;
    const dayTypeMap = buildDayTypeMap(currentYear, currentMonth, closed, open, events);
    const holidayMap = buildHolidayMap(currentYear, currentMonth, holiday);

    //前月と次月のデータが存在するかを非同期チェック
    const [canPrev, canNext] = await Promise.all([
      checkJsonExists(currentYear, currentMonth - 1),
      checkJsonExists(currentYear, currentMonth + 1),
    ]);

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = createHeader(currentYear, currentMonth, canPrev, canNext);

    const table = document.createElement('table');
    table.innerHTML = createTableHeader();
    table.appendChild(createCalendarBody(currentYear, currentMonth, dayTypeMap, events, holidayMap));
    calendar.appendChild(table);

  } catch (error) {
    console.error("カレンダー描画エラー:", error);
  }
}

//初期描画
renderCalendar();
