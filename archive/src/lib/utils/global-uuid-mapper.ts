import { UUIDContext } from './uuid-context';

export class GlobalUUIDMapper {
  uuidGenerator = new UUIDContext();
  globalUUIDMapping = new Map<string, string>();
  getFor(uuidDomain: string, descriptor: string): string {
    const key = JSON.stringify({ uuidDomain, descriptor });
    if (!this.globalUUIDMapping.has(key)) {
      this.globalUUIDMapping.set(key, this.uuidGenerator.next());
    }
    return this.globalUUIDMapping.get(key)!;
  }
}

type AugmentedProcess = typeof process & {
  singletonGlobalUUIDMapper?: GlobalUUIDMapper;
};

export function getGlobalUUIDMapper(): GlobalUUIDMapper {
  const proc = process as AugmentedProcess;
  if (!proc.singletonGlobalUUIDMapper) {
    proc.singletonGlobalUUIDMapper = new GlobalUUIDMapper();
  }
  return proc.singletonGlobalUUIDMapper;
}
