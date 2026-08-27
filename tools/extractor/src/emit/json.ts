import type { Contract } from "../contract.ts"
import { atomicWriteFile, sortKeysDeep, stableJsonStringify } from "../normalize.ts"

/** gen/contracts/<name>.json の出力。キーは再帰的にソートされ、combinations は列挙順に固定。 */
export async function emitContractJson(contract: Contract, genDir: string): Promise<string> {
  const filePath = `${genDir}/${contract.name}.json`
  await atomicWriteFile(filePath, stableJsonStringify(sortKeysDeep(contract)))
  return filePath
}
