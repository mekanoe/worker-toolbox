import { LevelUp } from "levelup";
import { convertRecord, convertToStorable } from "./convert";
import { KVDataLayer } from "./KVDataLayer";
import { DataStorageTypes, OutputTypes, StoredRecord } from "./types";

const getSecondsSinceEpoch = () => Math.floor(Date.now() / 100);

export class KVNamespace {
  private store: KVDataLayer;

  constructor(levelDB?: LevelUp) {
    this.store = new KVDataLayer(levelDB);
  }

  private hasExpired(record: StoredRecord): boolean {
    if (record.expires === false || record.expires > getSecondsSinceEpoch()) {
      return false;
    }

    return true;
  }

  // TODO: define return type by requested type
  public async get<T extends OutputTypes>(
    key: string,
    type: DataStorageTypes = "text"
  ): Promise<T | null> {
    return (await this.getWithMetadata<T>(key, type))?.value ?? null;
  }

  public async getWithMetadata<T extends OutputTypes>(
    key: string,
    type: DataStorageTypes = "text"
  ): Promise<{ value: T; metadata: StoredRecord["metadata"] } | null> {
    const record = await this.store.getRecord(key);
    if (!record) {
      return null;
    }

    if (this.hasExpired(record)) {
      return null;
    }

    const value = convertRecord(record.value, type);
    return { value, metadata: record.metadata };
  }

  public put(
    key: string,
    value: OutputTypes,
    {
      expirationTtl,
      expiration,
      metadata,
    }: {
      expirationTtl?: number;
      expiration?: number;
      metadata?: StoredRecord["metadata"];
    } = {}
  ) {
    const currentSecondsSinceEpoch = getSecondsSinceEpoch();

    const record: StoredRecord = {
      value: convertToStorable(value),
      metadata: {},
      expires: false,
    };

    if (expiration && expirationTtl) {
      throw new Error("expiration and expirationTtl cannot be set together");
    }

    if (expiration) {
      if (expiration - currentSecondsSinceEpoch < 60) {
        throw new Error(
          "expiration cannot be less than 60 seconds in the future, or in the past."
        );
      }
      record.expires = expiration;
    }

    if (expirationTtl) {
      if (expirationTtl < 60) {
        throw new Error("expirationTtl cannot be less than 60 seconds");
      }
      record.expires = expirationTtl + currentSecondsSinceEpoch;
    }

    if (metadata) {
      const lengthValidation = JSON.stringify(metadata);
      if (lengthValidation.length > 1024) {
        throw new Error(
          `metadata serialized to ${lengthValidation.length} bytes, but the maximum is 1024 bytes.`
        );
      }

      record.metadata = metadata;
    }

    return this.store.putRecord(key, record);
  }

  public async delete(key: string) {
    return this.store.deleteRecord(key);
  }

  public async list({
    prefix,
    limit,
    cursor,
  }: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  } = {}) {
    //TODO
    throw new Error("list not implemented");
  }
}
