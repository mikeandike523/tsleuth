/**
 * Adds functionality to an item that was server rendered
 */
export class Agent {
  controlledElement: Element | null;
  constructor() {
    this.controlledElement = null;
  }
  isReady() {
    return this.controlledElement !== null;
  }
  possess(element: Element) {
    this.controlledElement = element;
  }
  findAndPossess(uuidDomain: string, uuid: string) {
    // Find an element that has data-uuid-domain and data-uuid attributes matching the given uuidDomain and uuid
    const element = document.querySelector(
      `[data-uuid-domain="${uuidDomain}"][data-uuid="${uuid}"]`
    );
    if (element) {
      this.controlledElement = element;
    }
  }
  static findAllAndPossess(uuidDomain: string): Agent[] {
    const elements = document.querySelectorAll(
      `[data-uuid-domain="${uuidDomain}"]`
    );
    const agents = [];
    for (let i = 0; i < elements.length; i++) {
      const agent = new Agent();
      agent.possess(elements[i]);
      agents.push(agent);
    }
    return agents;
  }
}

/**
 * Provides a standard interface that any Agent or subtype of Agent must implement in order to facilitate saving and restoring state.
 */
export interface AgentSerializationProtocol {}
