import { KVNamespace } from "../../kv/src/KVNamespace";
import { WorkerRuntimeServer } from "../../worker-runtime/src/server";

const loader = async () => {
  return `
  const incrementCounter = async () => {
    const counter = (await COUNTER.get("counter", "text")) || 0;
    const newCounterValue = Number(counter) + 1;
    await COUNTER.put("counter", String(newCounterValue));
  
    return new Response(
      JSON.stringify({ oldValue: counter, newValue: newCounterValue })
    );
  };
  
  const getCounter = async () => {
    const counter = (await COUNTER.get("counter", "text")) || 0;
  
    return new Response(JSON.stringify({ value: counter }));
  };
  
  addEventListener("fetch", async (event) => {
    if (event.request.url.includes("increment-counter")) {
      return event.respondWith(incrementCounter());
    }
  
    if (event.request.url.includes("get-counter")) {
      return event.respondWith(getCounter());
    }
  
    if (event.request.url.includes("whats-in-env")) {
      return event.respondWith(new Response(JSON.stringify({ HEY_COOL_WORKER })));
    }
  
    event.respondWith(new Response("not found", { status: 404 }));
  });
  
  `;
};

export const startDevServer = async () => {
  const counterKV = new KVNamespace();

  const server = new WorkerRuntimeServer({
    port: 8000,
    kvNamespaces: { COUNTER: counterKV },
    environment: { HEY_COOL_WORKER: "where'd you get it" },
  });

  server.start();

  const code = await loader();
  server.mountWorker(code);
  console.log(`Listening on http://localhost:8000`);
};
