---
id: py-pandas
track: python
type: guide
section: data-analysis
order: 4
title:
  en: "Data Analysis with Pandas"
  ru: "Анализ данных с Pandas"
excerpt:
  en: "DataFrames, Series, filtering, grouping, and aggregations for manipulating large datasets efficiently."
  ru: "DataFrames, Series, фильтрация, группировки и агрегации для работы с большими наборами данных."
version: "python 3.9+"
updated: 2026-03-22
relatedTask: py-010
---

Pandas turns tabular data into vectors of operations. Learn the five verbs — load, filter, transform, group, aggregate — and most analysis notebooks become a page long.

## Loading & filtering

```python
import pandas as pd

df = pd.read_csv("sales.csv")

# Boolean masking
recent = df[df["date"] >= "2026-01-01"]
big = recent[recent["amount"] > 1000]
```

## Grouping & aggregation

```python
summary = (
    big.groupby("region")["amount"]
       .agg(total="sum", avg="mean", n="count")
       .sort_values("total", ascending=False)
)
print(summary.head())
```

## Transforming columns

```python
# Vectorized math beats any row loop
df["tax"] = df["amount"] * 0.2

df["label"] = df["amount"].map(
    lambda v: "big" if v > 1000 else "small"
)
```

> **TIP**
> If you find yourself writing `for row in df.itertuples()` on a large frame, look for a vectorized equivalent first — it is usually 50× faster.

<!-- RU -->

Pandas превращает табличные данные в векторные операции. Освойте пять глаголов — загрузка, фильтрация, преобразование, группировка, агрегация — и большинство аналитических ноутбуков уместятся на страницу.

## Загрузка и фильтрация

```python
import pandas as pd

df = pd.read_csv("sales.csv")

# Булевы маски
recent = df[df["date"] >= "2026-01-01"]
big = recent[recent["amount"] > 1000]
```

## Группировка и агрегация

```python
summary = (
    big.groupby("region")["amount"]
       .agg(total="sum", avg="mean", n="count")
       .sort_values("total", ascending=False)
)
print(summary.head())
```

## Преобразование колонок

```python
# Векторная математика быстрее любого цикла по строкам
df["tax"] = df["amount"] * 0.2

df["label"] = df["amount"].map(
    lambda v: "big" if v > 1000 else "small"
)
```

> **TIP**
> Если ловите себя на `for row in df.itertuples()` для большого фрейма — сначала поищите векторный вариант, он обычно в 50 раз быстрее.
