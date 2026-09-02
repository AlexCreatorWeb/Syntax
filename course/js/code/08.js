// Урок 8. Циклы: for, while, for...of, break/continue. Запустите (Run) — смотрите консоль.

// TODO 1: sumTo(n) — сумма 1..n (for). console.log(sumTo(10)) // 55

// for...of «демо»:
const items = ["js", "css", "html"];
for (const item of items) {
  console.log("item:", item);
}

// TODO 2: halveSteps(n) — «сколько» «раз» «/2» «до 1» (while). console.log(halveSteps(32)) // 5

// TODO 3: findFirst(arr, min) — «первый» > min (for...of + break), иначе -1
//         Проверьте: findFirst([3, 7, 12, 42, 99], 40) → 42

// TODO 4: oddSum(n) — сумма «нечётных» 1..n (continue «для» «чётных»). oddSum(6) → 1+3+5 = 9

// TODO 5 (бонус): buyWhile(prices, budget) — «берите» «пока» total + price <= budget;
//         return { bought, total }. prices = [120, 300, 80, 500], budget = 1000
