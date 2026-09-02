// Урок 3. Компоненты: композиция и разбивка. Напишите компонент App.

// TODO 1: Section({ title, children }) → <section><h3>{title}</h3>{children}</section>
function Section() {
  return null;
}

// TODO 3: Avatar({ name }) → <div className="avatar">{name[0].toUpperCase()}</div>
function Avatar() {
  return null;
}

// TODO 4: UserCard({ user }) → использует Avatar + имя и роль
function UserCard() {
  return null;
}

export default function App() {
  // TODO 5 (бонус): массив users, отрендерите три UserCard через .map()
  const users = [
    { id: 1, name: "Анна", role: "Frontend" },
    { id: 2, name: "Бoris", role: "Backend" },
    { id: 3, name: "Чарли", role: "DevOps" },
  ];
  return (
    <div>
      {/* TODO 2: два <Section> с разными заголовками и содержимым */}
      <Section title="Команда">
        {/* TODO 5: {users.map((u) => <UserCard key={u.id} user={u} />)} */}
      </Section>
    </div>
  );
}
