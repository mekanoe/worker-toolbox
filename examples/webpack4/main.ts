addEventListener("fetch", (event) => {
  event.respondWith(new Response(JSON.stringify({ hello: "world!!!" })));
});
