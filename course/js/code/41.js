// Урок 41. Fetch: запросы к API. Запустите (Run) — смотрите консоль.
// «API**: https://jsonplaceholder.typicode.com (CORS** «открыт**).

const API = "https://jsonplaceholder.typicode.com";

// TODO 1: getJSON(url) — fetch + «если** !res.ok** «→» throw + res.json()
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// TODO 2: «GET** /posts — «кол-во** «и** «первый** «title**
(async () => {
  try {
    const posts = await getJSON(`${API}/posts`);
    console.log("«постов**:", posts.length);
    console.log("«первый**:", posts[0].title);
  } catch (err) {
    console.error("«сбой**:", err.message);
  }
})();

// TODO 3: «GET** /posts/1 — title «и** userId

// TODO 4: POST /posts «с** JSON «(title/body/userId** —» «вывести** «id** ««созданного**

// TODO 5 (бонус): ««сравните** ««время** «(console.time**) «двух** «GET** «(последовательных** «vs** «Promise.all**)
