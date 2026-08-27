/**
 * Construit une grille de semaines pour un mois donné, en commençant le lundi.
 * Chaque semaine contient exactement 7 jours (les jours hors du mois affiché
 * sont inclus avec `inCurrentMonth: false` pour compléter la grille visuellement).
 */
export interface GridDay {
  date: Date;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, month: number /* 0-11 */): GridDay[][] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0));

  // Décalage pour commencer la grille un lundi (getUTCDay: 0=dim,1=lun,...6=sam)
  const firstWeekday = firstOfMonth.getUTCDay();
  const leadingOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - leadingOffset);

  const lastWeekday = lastOfMonth.getUTCDay();
  const trailingOffset = lastWeekday === 0 ? 0 : 7 - lastWeekday;

  const gridEnd = new Date(lastOfMonth);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + trailingOffset);

  const days: GridDay[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push({
      date: new Date(cursor),
      inCurrentMonth: cursor.getUTCMonth() === month,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const weeks: GridDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const WEEKDAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
