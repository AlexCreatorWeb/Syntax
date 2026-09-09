// Аватар пользователя: data-URL (jpeg 256×256) в localStorage (оперативный кэш,
// UI без мигания) + profiles.avatarurl в Supabase = источник правды.
// При входе (SIGNED_IN / INITIAL_SESSION) syncAvatarFromDb поднимает фото из БД —
// повторный вход с нового устройства/браузера видит аватарку (баг 2026-09: «слетает»).
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const KEY = "syntax-avatar";
let cache = localStorage.getItem(KEY) || "";
const subs = new Set();
const emit = () => subs.forEach((fn) => fn());

export function getAvatar() {
  return cache;
}

// dataUrl — data-URL (jpeg/png) или null/"" — удалить.
export function setAvatar(dataUrl) {
  cache = dataUrl || "";
  try {
    if (dataUrl) localStorage.setItem(KEY, dataUrl);
    else localStorage.removeItem(KEY);
  } catch {
    /* quota — держим в памяти, UI работает */
  }
  emit();
}

export function subscribeAvatar(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// Хук: [avatarUrl, setAvatar] — подписывается на смену в любом компоненте
// (профиль загрузил фото → хедер обновился без пропсов).
export function useAvatar() {
  const [url, setUrl] = useState(() => getAvatar());
  useEffect(() => subscribeAvatar(() => setUrl(getAvatar())), []);
  return [url, setAvatar];
}

// Файл → data-URL jpeg 256×256 (cover-кроп по центру). Ошибка → reject.
// БД → локальный кэш. Вызывается в App при каждой валидной сессии (вход, reload).
// Правила: в БД не-пустое значение → перезаписать локальное; "" (сделали remove
// на другом устройстве) → почистить локальное; null (строка без фото — legacy или
// write-сбой на том устройстве) → локальное не трогать; нет строки / сети →
// локальное не трогать (офис-деградация).
export async function syncAvatarFromDb(user) {
  if (!supabase || !user) return;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatarurl")
      .eq("id", user.id)
      .maybeSingle();
    if (error || data == null) return;
    const url = typeof data.avatarurl === "string" ? data.avatarurl : null;
    if (url === null) return; // строка есть, фото не синхронизировали нигде
    if (url === "") setAvatar(null);
    else if (url !== getAvatar()) setAvatar(url);
  } catch {
    /* некритично — локальная копия продолжает работать */
  }
}

export function fileToAvatarDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) {
      reject(new Error("not-image"));
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      reject(new Error("too-big"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-error"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode-error"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
