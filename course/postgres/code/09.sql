-- Урок 9: PK/FK, 1:1, 1:N, N:M. Запуск: psql practice
DROP TABLE IF EXISTS enrollments, courses, students CASCADE;

-- TODO: students и courses
CREATE TABLE students (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name TEXT NOT NULL
);

CREATE TABLE courses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL UNIQUE
);

-- TODO: pivot enrollments (N:M) с PK (student_id, course_id)
CREATE TABLE enrollments (
    student_id BIGINT NOT NULL REFERENCES students(id),
    course_id BIGINT NOT NULL REFERENCES courses(id),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, course_id)
);

-- TODO: 3 студента, 3 курса, 4 записи
INSERT INTO students (full_name) VALUES ('Анна С.', 'Игорь П.', 'Мария К.');
INSERT INTO courses (title) VALUES ('SQL', 'PostgreSQL', 'Оптимизация');

-- TODO: удалить студента (RESTRICT) — ошибка; затем ALTER до CASCADE

-- TODO: студенты с 2+ курсами
-- SELECT s.full_name, count(*) FROM enrollments e JOIN students s ON s.id = e.student_id GROUP BY 1 HAVING count(*) >= 2;
