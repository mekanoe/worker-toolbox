export type DataStorageTypes = "text" | "json" | "arrayBuffer" | "stream";
export type OutputTypes = string | object | ArrayBufferLike | Buffer;

export type StoredRecord = {
  value: string;
  metadata: { [x: string]: string };
  /** seconds since epoch. e.g. Date.now() / 1000 */
  expires: false | number;
};
