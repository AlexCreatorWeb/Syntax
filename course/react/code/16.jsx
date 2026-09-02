import { useState, createContext, useContext } from "react";

// Урок 16. Context: глобальное состояние без prop drilling. Напишите App.

// TODO 1: UserContext = createContext(null)
// TODO:  UserProvider с useState user + login(name)
// TODO 2: useUser() — useContext(UserContext)
const UserContext = createContext(null);

function UserProvider({ children }) {
  // TODO: const [user, setUser] = useState(null); login = (name) => setUser({ name })
  //       return <UserContext.Provider value={{ user, login }}>{children}</UserContext.Provider>
  return null;
}

function useUser() {
  // TODO: return useContext(UserContext)
  return null;
}

// TODO 3: Avatar — читает user БЕЗ пропсов (глубоко вложенный)
function Avatar() {
  return null;
}

// Промежуточные компоненты (NE передают user — это и есть смысл Context)
function Mid1({ children }) {
  return <section>{children}</section>;
}
function Mid2({ children }) {
  return <div>{children}</div>;
}

export default function App() {
  return (
    <UserProvider>
      <h2>Context</h2>
      {/* TODO 4: кнопка «Войти как Анна» → login("Анна") */}
      <Mid1>
        <Mid2>
          <Avatar />
        </Mid2>
      </Mid1>
    </UserProvider>
  );
}
