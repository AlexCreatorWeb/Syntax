import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// Урок 18. Финальный проект: «Заметки» (CRUD + API). Соберите приложение.

// TODO 1: useNotes() — useState([]) + add/remove/toggle через useCallback (иммутабельно)
function useNotes() {
  const [notes, setNotes] = useState([]);
  const add = useCallback((text) => {}, []);
  const remove = useCallback((id) => {}, []);
  const toggle = useCallback((id) => {}, []);
  return { notes, add, remove, toggle };
}

// TODO 2: NoteForm — контролируемый input, onSubmit + preventDefault,
//         автофокус useRef, очистка после добавления
function NoteForm({ onAdd }) {
  return null;
}

// TODO 3: SearchBar — input + useDebounce(400ms), отдаёт debounced значение вверх
function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  // TODO: useEffect с setTimeout + cleanup
  return d;
}
function SearchBar({ onChange }) {
  return null;
}

// TODO 4: NoteList + NoteItem — .map() с key={id}, checkbox(toggle), «×»(remove)
function NoteList({ notes, onRemove, onToggle }) {
  return null;
}

export default function App() {
  const { notes, add, remove, toggle } = useNotes();
  const [query, setQuery] = useState("");
  // TODO 5: visible через useMemo (filter по query)
  //         + условный рендер «Пусто» / «Найдено N»
  // TODO 6 (бонус): useLocalStorage или useFetch для стартовых заметок
  return (
    <div>
      <h1>Заметки</h1>
      <NoteForm onAdd={add} />
      <SearchBar onChange={setQuery} />
      <NoteList notes={notes} onRemove={remove} onToggle={toggle} />
    </div>
  );
}
