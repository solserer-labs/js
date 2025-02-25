import { AnyPublicKey, StringPublicKey } from '../../types';
import { borsh } from '../../utils';
import Program, { MetaplexProgram, MetaplexKey } from './MetaplexProgram';
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { WhitelistedCreator } from './WhitelistedCreator';
import { AuctionManager } from './AuctionManager';
import { Account } from '../Account';
import { ERROR_INVALID_ACCOUNT_DATA, ERROR_INVALID_OWNER } from '../../errors';

export interface StoreData {
  key: MetaplexKey;
  public: boolean;
  auctionProgram: StringPublicKey;
  tokenVaultProgram: StringPublicKey;
  tokenMetadataProgram: StringPublicKey;
  tokenProgram: StringPublicKey;
}

const storeStruct = borsh.struct<StoreData>(
  [
    ['key', 'u8'],
    ['public', 'u8'],
    ['auctionProgram', 'pubkeyAsString'],
    ['tokenVaultProgram', 'pubkeyAsString'],
    ['tokenMetadataProgram', 'pubkeyAsString'],
    ['tokenProgram', 'pubkeyAsString'],
  ],
  [],
  (data) => Object.assign({ public: true }, data, { key: MetaplexKey.StoreV1 }),
);

export class Store extends Account<StoreData> {
  constructor(pubkey: AnyPublicKey, info: AccountInfo<Buffer>) {
    super(pubkey, info);

    if (!this.assertOwner(Program.pubkey)) {
      throw ERROR_INVALID_OWNER();
    }

    if (!Store.isStore(this.info.data)) {
      throw ERROR_INVALID_ACCOUNT_DATA();
    }

    this.data = storeStruct.deserialize(this.info.data);
  }

  static isStore(data: Buffer) {
    return data[0] === MetaplexKey.StoreV1;
  }

  static async getPDA(owner: AnyPublicKey) {
    return Program.findProgramAddress([
      Buffer.from(MetaplexProgram.PREFIX),
      MetaplexProgram.PUBKEY.toBuffer(),
      new PublicKey(owner).toBuffer(),
    ]);
  }

  // TODO: we need some filter for current store
  async getWhitelistedCreators(connection: Connection) {
    return (
      await Program.getProgramAccounts(connection, {
        filters: [
          // Filter for WhitelistedCreatorV1 keys
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(Buffer.from([MetaplexKey.WhitelistedCreatorV1])),
            },
          },
        ],
      })
    ).map((account) => WhitelistedCreator.from(account));
  }

  async getAuctionManagers(connection: Connection) {
    return (
      await Program.getProgramAccounts(connection, {
        filters: [
          // Filter for AuctionManagerV2 by key
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(Buffer.from([MetaplexKey.AuctionManagerV2])),
            },
          },
          // Filter for assigned to this store
          {
            memcmp: {
              offset: 1,
              bytes: this.pubkey.toBase58(),
            },
          },
        ],
      })
    ).map((account) => AuctionManager.from(account));
  }
}
