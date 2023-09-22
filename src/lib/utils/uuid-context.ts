import { v4 as uuidv4 } from 'uuid';

export class UUIDContext {
  existing: Set<string>;
  constructor() {
    this.existing = new Set<string>();
  }
  next(): string {
    let testId = uuidv4();
    while (this.existing.has(testId)) {
      testId = uuidv4();
    }
    this.existing.add(testId);
    return testId;
  }
}
