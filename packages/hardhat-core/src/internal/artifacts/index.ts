import {
  Artifact,
  Artifacts as IArtifacts,
  ArtifactSource,
  BuildInfo,
  CompilerInput,
  CompilerOutput,
} from "../../types";

import { ARTIFACT_FORMAT_VERSION } from "../constants";
import { HardhatError } from "../core/errors";
import { ERRORS } from "../core/errors-list";

import { ReadOnlyPathMapping } from "./readonly";
import { MutablePathMapping } from "./mutable";
import { CachingPathMapping } from "./caching";

type SupportedArtifactSource =
  | ArtifactSource
  | ReadOnlyPathMapping
  | MutablePathMapping
  | CachingPathMapping;

export class Artifacts implements IArtifacts {
  private readonly _sourcesInPriorityOrder: SupportedArtifactSource[];

  constructor(artifactsPath: string) {
    this._sourcesInPriorityOrder = [new CachingPathMapping(artifactsPath)];
  }

  public async readArtifact(
    contractNameOrFullyQualifiedName: string
  ): Promise<Artifact> {
    const artifact = await this._getFirstValueFromSources(
      "readArtifact",
      contractNameOrFullyQualifiedName
    );
    if (artifact === undefined) {
      throw new HardhatError(ERRORS.ARTIFACTS.NOT_FOUND, {
        contractName: contractNameOrFullyQualifiedName,
        suggestion: "",
      });
    }
    return artifact;
  }

  public readArtifactSync(contractNameOrFullyQualifiedName: string): Artifact {
    const artifact = this._getFirstValueFromSourcesSync(
      "readArtifactSync",
      contractNameOrFullyQualifiedName
    );
    if (artifact === undefined) {
      throw new HardhatError(ERRORS.ARTIFACTS.NOT_FOUND, {
        contractName: contractNameOrFullyQualifiedName,
        suggestion: "",
      });
    }
    return artifact;
  }

  public artifactExists(
    contractNameOrFullyQualifiedName: string
  ): Promise<boolean> {
    return this._getFirstValueFromSources(
      "artifactExists",
      contractNameOrFullyQualifiedName
    );
  }

  public async getAllFullyQualifiedNames(): Promise<string[]> {
    return (
      await Promise.all(
        this._sourcesInPriorityOrder.map((s) => s.getAllFullyQualifiedNames())
      )
    ).flat();
  }

  public getBuildInfo(
    fullyQualifiedName: string
  ): Promise<BuildInfo | undefined> {
    return this._getFirstValueFromSources("getBuildInfo", fullyQualifiedName);
  }

  public async getArtifactPaths(): Promise<string[]> {
    return (
      await Promise.all(
        this._sourcesInPriorityOrder.map((s) => s.getArtifactPaths())
      )
    ).flat();
  }

  public async getDebugFilePaths(): Promise<string[]> {
    return (
      await Promise.all(
        this._sourcesInPriorityOrder.map((s) => s.getDebugFilePaths())
      )
    ).flat();
  }

  public async getBuildInfoPaths(): Promise<string[]> {
    return (
      await Promise.all(
        this._sourcesInPriorityOrder.map((s) => s.getBuildInfoPaths())
      )
    ).flat();
  }

  public clearCache(): void {
    for (const source of this._sourcesInPriorityOrder) {
      source.clearCache();
    }
  }

  public disableCache(): void {
    for (const source of this._sourcesInPriorityOrder) {
      source.disableCache();
    }
  }

  public saveArtifactAndDebugFile(
    artifact: Artifact,
    pathToBuildInfo?: string
  ): Promise<void> {
    for (const source of this._sourcesInPriorityOrder) {
      if ("saveArtifactAndDebugFile" in source) {
        return source.saveArtifactAndDebugFile(artifact, pathToBuildInfo);
      }
    }
    throw new HardhatError(ERRORS.INTERNAL.NO_SUPPORTED_ARTIFACT_SOURCE);
  }

  public saveBuildInfo(
    solcVersion: string,
    solcLongVersion: string,
    input: CompilerInput,
    output: CompilerOutput
  ): Promise<string> {
    for (const source of this._sourcesInPriorityOrder) {
      if ("saveBuildInfo" in source) {
        return source.saveBuildInfo(
          solcVersion,
          solcLongVersion,
          input,
          output
        );
      }
    }
    throw new HardhatError(ERRORS.INTERNAL.NO_SUPPORTED_ARTIFACT_SOURCE);
  }

  public formArtifactPathFromFullyQualifiedName(
    fullyQualifiedName: string
  ): string {
    for (const source of this._sourcesInPriorityOrder) {
      if ("formArtifactPathFromFullyQualifiedName" in source) {
        return source.formArtifactPathFromFullyQualifiedName(
          fullyQualifiedName
        );
      }
    }
    throw new HardhatError(ERRORS.INTERNAL.NO_SUPPORTED_ARTIFACT_SOURCE);
  }

  public addValidArtifacts(
    validArtifacts: Array<{ sourceName: string; artifacts: string[] }>
  ) {
    for (const source of this._sourcesInPriorityOrder) {
      if ("addValidArtifacts" in source) {
        source.addValidArtifacts(validArtifacts);
        return;
      }
    }
    throw new HardhatError(ERRORS.INTERNAL.NO_SUPPORTED_ARTIFACT_SOURCE);
  }

  public async removeObsoleteArtifacts() {
    for (const source of this._sourcesInPriorityOrder) {
      if ("removeObsoleteArtifacts" in source) {
        await source.removeObsoleteArtifacts();
        return;
      }
    }
    throw new HardhatError(ERRORS.INTERNAL.NO_SUPPORTED_ARTIFACT_SOURCE);
  }

  private async _getFirstValueFromSources(
    method: "readArtifact",
    key: string
  ): Promise<Artifact>;

  private async _getFirstValueFromSources(
    method: "artifactExists",
    key: string
  ): Promise<boolean>;

  private async _getFirstValueFromSources(
    method: "getBuildInfo",
    key: string
  ): Promise<BuildInfo | undefined>;

  private async _getFirstValueFromSources(
    method: keyof ArtifactSource,
    key: string
  ): Promise<boolean | Artifact | string[] | BuildInfo | undefined> {
    /* iterate over the sources to resolve the given name. if a source returns
     * undefined or NOT_FOUND, continue on to the next source. preserve the
     * latest thrown error so that its helpful error message can be delivered
     * in the case where latter sources simply return undefined. if all sources
     * are exhausted, and still nothing is found, throw NOT_FOUND. */
    let caughtError: unknown | undefined;
    for (const source of this._sourcesInPriorityOrder) {
      try {
        const value = await source[method](key);
        if (value === undefined) {
          continue;
        }
        return value;
      } catch (error) {
        if (
          error instanceof HardhatError &&
          error.number === ERRORS.ARTIFACTS.NOT_FOUND.number
        ) {
          caughtError = error;
          continue;
        }
        // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
        throw error;
      }
    }
    if (caughtError !== undefined) {
      // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
      throw caughtError;
    }
  }

  private _getFirstValueFromSourcesSync(
    method: "readArtifactSync",
    key: string
  ): Artifact | undefined;

  private _getFirstValueFromSourcesSync(
    method: keyof Pick<ArtifactSource, "readArtifactSync">,
    key: string
  ): Artifact | undefined {
    // intended to be exactly like _getFirstValueFromSources but without the await

    let caughtError: unknown | undefined;
    for (const source of this._sourcesInPriorityOrder) {
      try {
        const value = source[method](key);
        if (value === undefined) {
          continue;
        }
        return value;
      } catch (error) {
        if (
          error instanceof HardhatError &&
          error.number === ERRORS.ARTIFACTS.NOT_FOUND.number
        ) {
          caughtError = error;
          continue;
        }
        // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
        throw error;
      }
    }
    if (caughtError !== undefined) {
      // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
      throw caughtError;
    }
  }
}

/**
 * Retrieves an artifact for the given `contractName` from the compilation output.
 *
 * @param sourceName The contract's source name.
 * @param contractName the contract's name.
 * @param contractOutput the contract's compilation output as emitted by `solc`.
 */
export function getArtifactFromContractOutput(
  sourceName: string,
  contractName: string,
  contractOutput: any
): Artifact {
  const evmBytecode = contractOutput.evm && contractOutput.evm.bytecode;
  let bytecode: string =
    evmBytecode && evmBytecode.object ? evmBytecode.object : "";

  if (bytecode.slice(0, 2).toLowerCase() !== "0x") {
    bytecode = `0x${bytecode}`;
  }

  const evmDeployedBytecode =
    contractOutput.evm && contractOutput.evm.deployedBytecode;
  let deployedBytecode: string =
    evmDeployedBytecode && evmDeployedBytecode.object
      ? evmDeployedBytecode.object
      : "";

  if (deployedBytecode.slice(0, 2).toLowerCase() !== "0x") {
    deployedBytecode = `0x${deployedBytecode}`;
  }

  const linkReferences =
    evmBytecode && evmBytecode.linkReferences ? evmBytecode.linkReferences : {};
  const deployedLinkReferences =
    evmDeployedBytecode && evmDeployedBytecode.linkReferences
      ? evmDeployedBytecode.linkReferences
      : {};

  return {
    _format: ARTIFACT_FORMAT_VERSION,
    contractName,
    sourceName,
    abi: contractOutput.abi,
    bytecode,
    deployedBytecode,
    linkReferences,
    deployedLinkReferences,
  };
}