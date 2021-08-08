import { LevelUp } from "levelup";
import { StoredRecord } from "./types";

export class KVDataLayer {
  private memoryStore: Map<string, StoredRecord> = new Map();

  constructor(private levelDB?: LevelUp) {}

  public async getRecord(key: string): Promise<StoredRecord | null> {
    if (this.levelDB) {
      try {
        const value = await this.levelDB.get(key);
        if (!value) {
          return null;
        }
        return JSON.parse(value);
      } catch (e) {}
    }

    return this.memoryStore.get(key) || null;
  }

  public async putRecord(key: string, record: StoredRecord) {
    if (this.levelDB) {
      await this.levelDB.put(key, JSON.stringify(record));
    }

    return this.memoryStore.set(key, record);
  }

  public async deleteRecord(key: string) {
    (await this.levelDB?.del(key)) ?? this.memoryStore.delete(key);
  }

  public async listRecord() {
    //TODO
  }
}
