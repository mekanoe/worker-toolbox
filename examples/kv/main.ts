import { Router } from "@worker-toolbox/router";

addEventListener("fetch", (event) => {
  const router = new Router();
  const allFoxes = ["red", "grey", "white", "fennec"];

  const respond = (obj: any, init?: ResponseInit) =>
    new Response(JSON.stringify(obj), init);

  router.add("GET", "favorite-foxes", async () => {
    const foxCounts: Record<string, number> = {};
    for (let fox of allFoxes) {
      const value = Number((await FOXES.get(fox)) || 0);
      foxCounts[fox] = value;
    }
    return respond(foxCounts);
  });

  router.add("PUT", "favorite-fox", async (request: Request) => {
    const { fox } = await request.json();
    if (!fox || !allFoxes.includes(fox)) {
      return respond({ err: "not a valid fox" }, { status: 400 });
    }

    const currentFoxCount = Number((await FOXES.get(fox)) || 0);

    const nextFoxCount = currentFoxCount + 1;
    FOXES.put(fox, String(nextFoxCount));

    return respond({ ok: true });
  });

  event.respondWith(router.handle(event));
});
