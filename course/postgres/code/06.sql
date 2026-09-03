-- Урок 6: WHERE, LIKE/ILIKE, NULL. Запуск: psql practice
DROP TABLE IF EXISTS employees;

-- TODO: таблица + 6 строк (2 с NULL в salary, 1 с NULL в dept)
CREATE TABLE employees (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    dept TEXT,
    salary INT,
    hired DATE
);

INSERT INTO employees (name, dept, salary, hired) VALUES
    ('Анна', 'IT', 85000, '2022-03-01'),
    ('Игорь', 'IT', NULL, '2023-07-15'),
    ('Мария', 'Sales', 60000, '2021-11-20'),
    ('Олег', 'Sales', 55000, '2024-01-05'),
    ('Дана', NULL, 72000, '2020-06-10'),
    ('Пётр', 'IT', 30000, '2025-02-28');

-- TODO: все, кроме dept = 'IT' (включая NULL в dept)
-- SELECT ... WHERE dept <> 'IT' OR dept IS NULL;

-- TODO: имена, содержащие 'ан' без учёта регистра

-- TODO: salary IS DISTINCT FROM 30000  (сравни с salary <> 30000)
