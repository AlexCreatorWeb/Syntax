-- Урок 18: views, материализованные, generated. Запуск: psql practice
DROP MATERIALIZED VIEW IF EXISTS hiring_by_month;
DROP VIEW IF EXISTS dept_avg;
DROP TABLE IF EXISTS emp;

CREATE TABLE emp (
    id INT PRIMARY KEY,
    dept TEXT NOT NULL,
    salary INT NOT NULL,
    hired DATE NOT NULL
);
INSERT INTO emp VALUES (1, 'IT', 90000, '2022-01-15'), (2, 'IT', 70000, '2023-02-20'),
                       (3, 'Sales', 55000, '2021-03-25'), (4, 'Sales', 60000, '2022-04-10');

-- TODO: view dept_avg (dept, avg, count) — «живой»
CREATE VIEW dept_avg AS
SELECT dept, avg(salary) AS avg_sal, count(*) AS n FROM emp GROUP BY dept;
SELECT * FROM dept_avg;

-- TODO: матview hiring_by_month + REFRESH (до/после вставки id=5)
CREATE MATERIALIZED VIEW hiring_by_month AS
SELECT date_trunc('month', hired) AS m, dept, count(*) FROM emp GROUP BY 1, 2;

-- TODO: UNIQUE-индекс + REFRESH CONCURRENTLY
-- CREATE UNIQUE INDEX ON hiring_by_month (m, dept);
-- REFRESH MATERIALIZED VIEW CONCURRENTLY hiring_by_month;

-- TODO: generated salary_band (CASE) STORED
-- ALTER TABLE emp ADD COLUMN salary_band TEXT GENERATED ALWAYS AS (
--   CASE WHEN salary >= 80000 THEN 'high' WHEN salary >= 60000 THEN 'mid' ELSE 'low' END
-- ) STORED;

SELECT * FROM emp ORDER BY id;
