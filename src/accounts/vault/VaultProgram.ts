import { PublicKey } from '@solana/web3.js';
import { Program } from '../Program';
import { config } from '../../config';

export enum VaultKey {
  Uninitialized = 0,
  VaultV1 = 3,
  SafetyDepositBoxV1 = 1,
  ExternalPriceAccountV1 = 2,
}

export class VaultProgram extends Program<{}> {
  static readonly PREFIX = 'vault';
  static readonly PUBKEY = new PublicKey(config.programs.vault);

  constructor() {
    super(VaultProgram.PUBKEY);
  }
}

export default new VaultProgram();
