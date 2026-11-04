export const formatDateForDataset = (isoStr) => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)} ${monthName} ${year}`;
};

export const parseDateString = (str) => {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  if (s.toLowerCase() === 'today') {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }
  if (s.toLowerCase() === 'tomorrow') {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }

  // Check ISO format YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }

  // Check DD Month YYYY or Month DD, YYYY
  const parts = s.replace(/,/g, '').split(/\s+/);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  if (parts.length >= 3) {
    let day = parseInt(parts[0], 10);
    let monthIdx = months.indexOf(parts[1].toLowerCase().slice(0, 3));
    let year = parseInt(parts[2], 10);

    if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
      return new Date(year, monthIdx, day);
    }

    monthIdx = months.indexOf(parts[0].toLowerCase().slice(0, 3));
    day = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
    if (monthIdx !== -1 && !isNaN(day) && !isNaN(year)) {
      return new Date(year, monthIdx, day);
    }
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
};

export const getTodayInClinicTimezone = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const [year, month, day] = formatter
      .format(new Date())
      .split('-')
      .map((n) => parseInt(n, 10));
    return new Date(year, month - 1, day);
  } catch (e) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
};

export const matchesDateFilter = (itemDate, dateFilter) => {
  if (!dateFilter || dateFilter === 'All Dates') return true;

  const itemParsed = parseDateString(itemDate);
  if (!itemParsed) return false;

  const today = getTodayInClinicTimezone();

  if (dateFilter === 'Today') {
    return (
      itemParsed.getFullYear() === today.getFullYear() &&
      itemParsed.getMonth() === today.getMonth() &&
      itemParsed.getDate() === today.getDate()
    );
  }

  if (dateFilter === 'Tomorrow') {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return (
      itemParsed.getFullYear() === tomorrow.getFullYear() &&
      itemParsed.getMonth() === tomorrow.getMonth() &&
      itemParsed.getDate() === tomorrow.getDate()
    );
  }

  if (dateFilter === 'This Week') {
    const dayOfWeek = today.getDay(); // 0 = Sunday
    // Start of week (Sunday):
    const sundayStart = new Date(today);
    sundayStart.setDate(today.getDate() - dayOfWeek);
    sundayStart.setHours(0, 0, 0, 0);

    // End of week (Sunday to Sunday covering Mon-Sun & Sun-Sat):
    const weekEnd = new Date(sundayStart);
    weekEnd.setDate(sundayStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    return itemParsed >= sundayStart && itemParsed <= weekEnd;
  }

  if (dateFilter.startsWith('Custom:')) {
    const targetStr = dateFilter.replace('Custom: ', '').trim();
    const targetParsed = parseDateString(targetStr);
    if (targetParsed) {
      return itemParsed.getTime() === targetParsed.getTime();
    }
    return String(itemDate).trim().toLowerCase() === targetStr.toLowerCase();
  }

  const filterParsed = parseDateString(dateFilter);
  if (filterParsed) {
    return itemParsed.getTime() === filterParsed.getTime();
  }

  return String(itemDate).trim().toLowerCase() === String(dateFilter).trim().toLowerCase();
};

