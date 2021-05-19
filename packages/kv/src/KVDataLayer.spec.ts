//@ts-ignore
import level from "level-mem";
import { KVDataLayer } from "./KVDataLayer";
import { StoredRecord } from "./types";

const recordFixture: StoredRecord = {
  value: "hello world",
  expires: false,
  metadata: {},
};

it("supports persistence via a levelup instance", async () => {
  const db = level();
  const dataLayer = new KVDataLayer(db);

  await dataLayer.putRecord("hello-world", recordFixture);

  const record = await db.get("hello-world");
  expect(record).toStrictEqual(JSON.stringify(recordFixture));
});
