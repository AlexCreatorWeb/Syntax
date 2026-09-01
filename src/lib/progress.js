// Прогресс прохождения курсов: localStorage на трек — массив id уроков из `lessons`.
// Пока без бэкенда (с ним станет sync на аккаунт). Читается на маунте вьюхи.
const key = (tech) => `syntax-progress-${tech}`;

export function getCompleted(tech) {
  if (!tech) return [];
  try {
    const v = JSON.parse(localStorage.getItem(key(tech)) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function markComplete(tech, lessonId) {
  if (!tech || !lessonId) return;
  const cur = getCompleted(tech).filter((x) => x !== lessonId);
  cur.push(lessonId);
  localStorage.setItem(key(tech), JSON.stringify(cur));
}
