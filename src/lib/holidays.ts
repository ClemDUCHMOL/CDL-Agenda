import { HolidayZone } from "./types";

/**
 * Calcule la date de Pâques (dimanche) pour une année donnée,
 * selon l'algorithme de Gauss (calendrier grégorien).
 */
function computeEasterSunday(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Retourne l'ensemble des jours fériés (format YYYY-MM-DD) pour une année donnée,
 * en fonction de la zone géographique choisie. Calcul entièrement algorithmique :
 * fonctionne pour n'importe quelle année passée ou future.
 */
export function getHolidaysForYear(year: number, zone: HolidayZone): Set<string> {
  const easterSunday = computeEasterSunday(year);
  const easterMonday = addDays(easterSunday, 1);
  const ascension = addDays(easterSunday, 39);
  const whitMonday = addDays(easterSunday, 50);

  const holidays: string[] = [
    `${year}-01-01`, // Jour de l'an
    toISODate(easterMonday), // Lundi de Pâques
    `${year}-05-01`, // Fête du travail
    `${year}-05-08`, // Victoire 1945
    toISODate(ascension), // Ascension
    toISODate(whitMonday), // Lundi de Pentecôte
    `${year}-07-14`, // Fête nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
  ];

  if (zone === "alsace_moselle") {
    const goodFriday = addDays(easterSunday, -2);
    holidays.push(toISODate(goodFriday)); // Vendredi saint
    holidays.push(`${year}-12-26`); // Saint-Étienne
  }

  return new Set(holidays);
}

/**
 * Cache simple en mémoire pour éviter de recalculer les jours fériés
 * plusieurs fois pour la même année/zone au cours d'un rendu.
 */
const cache = new Map<string, Set<string>>();

export function isHoliday(dateISO: string, zone: HolidayZone): boolean {
  const year = Number(dateISO.slice(0, 4));
  const cacheKey = `${year}-${zone}`;
  let holidaysSet = cache.get(cacheKey);
  if (!holidaysSet) {
    holidaysSet = getHolidaysForYear(year, zone);
    cache.set(cacheKey, holidaysSet);
  }
  return holidaysSet.has(dateISO);
}
