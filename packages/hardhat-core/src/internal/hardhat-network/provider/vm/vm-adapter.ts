import { Block } from "@nomicfoundation/ethereumjs-block";
import { Common } from "@nomicfoundation/ethereumjs-common";
import {
  EVMResult,
  InterpreterStep,
  Message,
} from "@nomicfoundation/ethereumjs-evm";
import { StateManager } from "@nomicfoundation/ethereumjs-statemanager";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { Account, Address } from "@nomicfoundation/ethereumjs-util";
import { RunTxResult, VM } from "@nomicfoundation/ethereumjs-vm";
import { ForkStateManager } from "../fork/ForkStateManager";

// FVTODO remove
/* eslint-disable @nomiclabs/hardhat-internal-rules/only-hardhat-error */
/* eslint-disable @typescript-eslint/no-unused-vars */

export interface BlockBuilder {
  getGasUsed(): bigint;
  // FVTODO remove these types
  addTransaction(tx: TypedTransaction): Promise<RunTxResult>;

  // FVTODO remove the Block type
  build(): Promise<Block>;

  revert(): Promise<void>;
}

interface RunTxParams {
  block: Block;
  skipNonce: boolean;
  skipBalance: boolean;
  skipBlockGasLimitValidation: boolean;
}

export interface VMAdapter {
  // FVTODO remove these types
  dryRun(
    tx: TypedTransaction,
    blockNumberOrPending: bigint | "pending",
    forceBaseFeeZero: boolean
  ): Promise<RunTxResult>;
  getCommon(): Common;
  getStateRoot(): Promise<Buffer>;
  getAccount(address: Address): Promise<Account>;
  getContractStorage(address: Address, key: Buffer): Promise<Buffer>;
  getContractCode(address: Address): Promise<Buffer>;
  putAccount(address: Address, account: Account): Promise<void>;
  putContractCode(address: Address, value: Buffer): Promise<void>;
  putContractStorage(
    address: Address,
    key: Buffer,
    value: Buffer
  ): Promise<void>;
  revertToStateRoot(stateRoot: Buffer): Promise<void>;
  restoreBlockContext(stateRoot: Buffer): Promise<void>;
  buildBlock(): Promise<BlockBuilder>; // FVTODO does this need to be async?

  enableTracing(callbacks: {
    beforeMessage: (message: Message, next: any) => Promise<void>;
    step: (step: InterpreterStep, next: any) => Promise<void>;
    afterMessage: (result: EVMResult, next: any) => Promise<void>;
  }): void;

  disableTracing(): void;
}

export class RethnetAdapter implements VMAdapter {
  public async dryRun(): Promise<RunTxResult> {
    throw new Error("not implemented");
  }

  public getCommon(): Common {
    throw new Error("not implemented");
  }

  public async getStateRoot(): Promise<Buffer> {
    throw new Error("not implemented");
  }

  public async getAccount(address: Address): Promise<Account> {
    throw new Error("not implemented");
  }
  public async getContractStorage(
    address: Address,
    key: Buffer
  ): Promise<Buffer> {
    throw new Error("not implemented");
  }
  public async getContractCode(address: Address): Promise<Buffer> {
    throw new Error("not implemented");
  }
  public async putAccount(address: Address, account: Account): Promise<void> {
    throw new Error("not implemented");
  }
  public async putContractCode(address: Address, value: Buffer): Promise<void> {
    throw new Error("not implemented");
  }
  public async putContractStorage(
    address: Address,
    key: Buffer,
    value: Buffer
  ): Promise<void> {
    throw new Error("not implemented");
  }

  public async revertToStateRoot(): Promise<void> {
    throw new Error("not implemented");
  }

  public async restoreBlockContext(stateRoot: Buffer): Promise<void> {
    throw new Error("not implemented");
  }

  public async buildBlock(): Promise<BlockBuilder> {
    throw new Error("not implemented");
  }

  public enableTracing(callbacks: {
    beforeMessage: (message: Message, next: any) => Promise<void>;
    step: () => Promise<void>;
    afterMessage: () => Promise<void>;
  }): void {
    throw new Error("not implemented");
  }

  public disableTracing(): void {
    throw new Error("not implemented");
  }
}

// FVTODO implement
// export class DualModeAdapter implements VMAdapter {
//   private _ethereumJSAdapter: VMAdapter;
//   private _rethnetAdapter: VMAdapter;
//
//   constructor() {
//     this._ethereumJSAdapter = new EthereumJSAdapter();
//     this._rethnetAdapter = new RethnetAdapter();
//   }
//
//   public async dryRun(): Promise<RunTxResult> {
//     throw new Error("not implemented");
//   }
//
//   public getCommon(): Common {
//     throw new Error("not implemented");
//   }
//
//   public async getStateRoot(): Promise<Buffer> {
//     throw new Error("not implemented");
//   }
//
//   public async getAccount(address: Address): Promise<Account> {
//     throw new Error("not implemented");
//   }
//   public async getContractStorage(
//     address: Address,
//     key: Buffer
//   ): Promise<Buffer> {
//     throw new Error("not implemented");
//   }
//   public async getContractCode(address: Address): Promise<Buffer> {
//     throw new Error("not implemented");
//   }
//   public async putAccount(address: Address, account: Account): Promise<void> {
//     throw new Error("not implemented");
//   }
//   public async putContractCode(address: Address, value: Buffer): Promise<void> {
//     throw new Error("not implemented");
//   }
//   public async putContractStorage(
//     address: Address,
//     key: Buffer,
//     value: Buffer
//   ): Promise<void> {
//     throw new Error("not implemented");
//   }
//
//   public async revertToStateRoot(): Promise<void> {
//     throw new Error("not implemented");
//   }
//
//   public async restoreBlockContext(stateRoot: Buffer): Promise<void> {
//     throw new Error("not implemented");
//   }
//
//   public async buildBlock(): Promise<BlockBuilder> {
//     throw new Error("not implemented");
//   }
//
//   public enableTracing(callbacks: {
//     beforeMessage: (message: Message, next: any) => Promise<void>;
//     step: () => Promise<void>;
//     afterMessage: () => Promise<void>;
//   }): void {
//     throw new Error("not implemented");
//   }
//
//   public disableTracing(): void {
//     throw new Error("not implemented");
//   }
// }
