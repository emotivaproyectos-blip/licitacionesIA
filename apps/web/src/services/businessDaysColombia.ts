/**
 * Algoritmo Oficial de Días Hábiles y Festivos de Colombia (Ley 51 de 1983 - Ley Emiliani)
 * Utilizado por contratistas del Estado para calcular con exactitud jurídica los términos
 * de subsanación de pliegos, presentación de observaciones y fechas de cierre en SECOP.
 */

export interface ColombianHoliday {
  dateString: string; // YYYY-MM-DD
  name: string;
  type: 'FIJO' | 'EMILIANI_LUNES' | 'PASCUA';
}

export interface BusinessDaysCalculationResult {
  startDate: string;
  targetDate: string;
  businessDaysCount: number;
  calendarDaysCount: number;
  holidaysEncountered: ColombianHoliday[];
  weekendDaysEncountered: number;
}

/**
 * Algoritmo de Butcher / Computus para calcular el Domingo de Pascua
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed (2 = March, 3 = April)
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

/**
 * Traslada una fecha al siguiente lunes si no cae ya en lunes (Regla Ley Emiliani)
 */
function moveToNextMonday(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0: Sunday, 1: Monday, ...
  if (dayOfWeek === 1) return date;
  const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const res = new Date(date);
  res.setDate(res.getDate() + daysToAdd);
  return res;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene todos los festivos oficiales de Colombia para un año determinado
 */
export function getColombianHolidays(year: number): ColombianHoliday[] {
  const holidays: ColombianHoliday[] = [];

  // 1. Festivos Fijos (No se trasladan)
  const fixed = [
    { month: 0, day: 1, name: 'Año Nuevo' },
    { month: 4, day: 1, name: 'Día del Trabajo' },
    { month: 6, day: 20, name: 'Día de la Independencia de Colombia' },
    { month: 7, day: 7, name: 'Batalla de Boyacá' },
    { month: 11, day: 8, name: 'Inmaculada Concepción' },
    { month: 11, day: 25, name: 'Navidad' },
  ];

  fixed.forEach(f => {
    holidays.push({
      dateString: formatDate(new Date(year, f.month, f.day)),
      name: f.name,
      type: 'FIJO'
    });
  });

  // 2. Festivos Ley Emiliani (Se trasladan al siguiente lunes)
  const emiliani = [
    { month: 0, day: 6, name: 'Día de los Reyes Magos' },
    { month: 2, day: 19, name: 'Día de San José' },
    { month: 5, day: 29, name: 'San Pedro y San Pablo' },
    { month: 7, day: 15, name: 'Asunción de la Virgen' },
    { month: 9, day: 12, name: 'Día de la Raza' },
    { month: 10, day: 1, name: 'Todos los Santos' },
    { month: 10, day: 11, name: 'Independencia de Cartagena' },
  ];

  emiliani.forEach(e => {
    const originalDate = new Date(year, e.month, e.day);
    const movedDate = moveToNextMonday(originalDate);
    holidays.push({
      dateString: formatDate(movedDate),
      name: e.name,
      type: 'EMILIANI_LUNES'
    });
  });

  // 3. Festivos dependientes de la Pascua
  const easter = getEasterSunday(year);

  // Jueves Santo: Pascua - 3 días
  const juevesSanto = new Date(easter);
  juevesSanto.setDate(juevesSanto.getDate() - 3);
  holidays.push({ dateString: formatDate(juevesSanto), name: 'Jueves Santo', type: 'PASCUA' });

  // Viernes Santo: Pascua - 2 días
  const viernesSanto = new Date(easter);
  viernesSanto.setDate(viernesSanto.getDate() - 2);
  holidays.push({ dateString: formatDate(viernesSanto), name: 'Viernes Santo', type: 'PASCUA' });

  // Ascensión del Señor: Pascua + 43 días trasladado al lunes
  const ascension = new Date(easter);
  ascension.setDate(ascension.getDate() + 43);
  holidays.push({ dateString: formatDate(moveToNextMonday(ascension)), name: 'Ascensión del Señor', type: 'PASCUA' });

  // Corpus Christi: Pascua + 64 días trasladado al lunes
  const corpus = new Date(easter);
  corpus.setDate(corpus.getDate() + 64);
  holidays.push({ dateString: formatDate(moveToNextMonday(corpus)), name: 'Corpus Christi', type: 'PASCUA' });

  // Sagrado Corazón de Jesús: Pascua + 71 días trasladado al lunes
  const sagradoCorazon = new Date(easter);
  sagradoCorazon.setDate(sagradoCorazon.getDate() + 71);
  holidays.push({ dateString: formatDate(moveToNextMonday(sagradoCorazon)), name: 'Sagrado Corazón de Jesús', type: 'PASCUA' });

  return holidays.sort((a, b) => a.dateString.localeCompare(b.dateString));
}

/**
 * Verifica si una fecha es día hábil en Colombia (no es sábado, domingo ni festivo)
 */
export function isColombianBusinessDay(date: Date): { isBusinessDay: boolean; holiday?: ColombianHoliday } {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isBusinessDay: false };
  }

  const holidays = getColombianHolidays(date.getFullYear());
  const dateStr = formatDate(date);
  const found = holidays.find(h => h.dateString === dateStr);

  if (found) {
    return { isBusinessDay: false, holiday: found };
  }

  return { isBusinessDay: true };
}

/**
 * Suma N días hábiles a una fecha inicial (útil para: "plazo de 3 días para subsanar")
 */
export function addBusinessDays(startDateStr: string, businessDaysToAdd: number): BusinessDaysCalculationResult {
  const parts = startDateStr.split('-').map(Number);
  const current = new Date(parts[0], parts[1] - 1, parts[2]);
  
  let added = 0;
  let calendarDays = 0;
  let weekendDays = 0;
  const holidaysEncountered: ColombianHoliday[] = [];

  // En derecho administrativo contractual (Ley 80 / CPACA), el término empieza a correr el día hábil siguiente
  while (added < businessDaysToAdd) {
    current.setDate(current.getDate() + 1);
    calendarDays++;

    const check = isColombianBusinessDay(current);
    const day = current.getDay();

    if (day === 0 || day === 6) {
      weekendDays++;
    } else if (check.holiday) {
      holidaysEncountered.push(check.holiday);
    } else {
      added++;
    }
  }

  return {
    startDate: startDateStr,
    targetDate: formatDate(current),
    businessDaysCount: businessDaysToAdd,
    calendarDaysCount: calendarDays,
    holidaysEncountered,
    weekendDaysEncountered: weekendDays
  };
}

/**
 * Cuenta los días hábiles entre dos fechas (útil para: "cuántos días faltan para el cierre de ofertas")
 */
export function countBusinessDaysBetween(startDateStr: string, endDateStr: string): BusinessDaysCalculationResult {
  const p1 = startDateStr.split('-').map(Number);
  const p2 = endDateStr.split('-').map(Number);
  const start = new Date(p1[0], p1[1] - 1, p1[2]);
  const end = new Date(p2[0], p2[1] - 1, p2[2]);

  let businessDays = 0;
  let calendarDays = 0;
  let weekendDays = 0;
  const holidaysEncountered: ColombianHoliday[] = [];

  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    calendarDays++;

    const check = isColombianBusinessDay(current);
    const day = current.getDay();

    if (day === 0 || day === 6) {
      weekendDays++;
    } else if (check.holiday) {
      holidaysEncountered.push(check.holiday);
    } else {
      businessDays++;
    }
  }

  return {
    startDate: startDateStr,
    targetDate: endDateStr,
    businessDaysCount: businessDays,
    calendarDaysCount: calendarDays,
    holidaysEncountered,
    weekendDaysEncountered: weekendDays
  };
}
