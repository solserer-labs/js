import { PublicKey } from '@solana/web3.js';
import { deserializeUnchecked, serialize, BinaryReader, BinaryWriter } from 'borsh';
import base58 from 'bs58';

export const extendBorsh = () => {
  (BinaryReader.prototype as any).readPubkey = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
  };
  (BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(value.toBuffer());
  };
  (BinaryReader.prototype as any).readPubkeyAsString = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return base58.encode(array); // pubkey string
  };
  (BinaryWriter.prototype as any).writePubkeyAsString = function (
    value: string, // pubkey string
  ) {
    const writer = this as unknown as BinaryWriter;
    writer.writeFixedArray(base58.decode(value));
  };
};

extendBorsh();

export class Struct<T> {
  readonly fields;
  readonly dependencies: Struct<any>[] = [];
  readonly type: (args: T) => T;
  readonly schema: Map<any, any>;

  constructor(fields: any[][], dependencies: Struct<any>[] = [], parse?: (args: T) => T) {
    this.fields = fields;
    this.dependencies = dependencies;
    this.type = function (args: T = {} as T) {
      // Ensure all args exist as undefined.
      for (const [name] of fields) {
        if (!(name in args)) (args as any)[name] = undefined;
      }
      return parse ? parse(args) : args;
    };

    const entries = [
      [
        this.type,
        {
          kind: 'struct',
          fields,
        },
      ],
    ] as any;
    for (const d of this.dependencies) entries.push(...d.schema.entries());
    this.schema = new Map(entries);
  }

  static create<T>(fields: any[][], dependencies: Struct<any>[] = [], parse?: (args: T) => T) {
    return new Struct(fields, dependencies, parse);
  }

  serialize(struct: T) {
    return Buffer.from(serialize(this.schema, struct));
  }

  deserialize(buffer: Buffer) {
    return deserializeUnchecked(this.schema, this.type, buffer) as T;
  }
}

export const struct = Struct.create;
