import { SerializableRecord } from './serialization';

/**
 * Adds functionality to an item that was server rendered
 */
export class Agent<
  TDomState extends SerializableRecord = SerializableRecord,
  TCustomState extends SerializableRecord = SerializableRecord,
  TElement extends Element = Element,
> implements AgentSerializationProtocol<TDomState, TCustomState>
{
  controlledElement: TElement | null;
  uuidDomain: string | null;
  uuid: string | null;

  domState: TDomState;
  customState: TCustomState;

  name: string;

  domStateInitializer: (element: TElement) => TDomState;
  customStateInitializer: () => TCustomState;

  constructor(
    domStateInitializer: (element: TElement) => TDomState,
    customStateInitializer: () => TCustomState
  ) {
    this.controlledElement = null;
    this.uuidDomain = null;
    this.uuid = null;
    this.domState = {} as TDomState;
    this.customState = {} as TCustomState;
    this.name = 'Agent';
    this.domStateInitializer = domStateInitializer;
    this.customStateInitializer = customStateInitializer;
  }
  restoreFromSaved(
    savedDOMState: SerializableRecord,
    savedCustomState: SerializableRecord
  ): void {
    throw new Error('Method not implemented.');
  }
  prepareForSaving(
    currentDOMState: TDomState,
    currentCustomState: TCustomState
  ): void {}
  isReady() {
    return (
      this.controlledElement !== null &&
      this.uuidDomain !== null &&
      this.uuid !== null
    );
  }
  possess(element: TElement) {
    this.controlledElement = element;
    AgentStateStorageManager.ensureAgentStorageExists(
      this.uuidDomain as string,
      this.uuid as string,
      {
        customState: this.customStateInitializer(),
        domState: this.domStateInitializer(this.controlledElement as TElement),
      }
    );
    this.onPossess();
  }
  findAndPossess(uuidDomain: string, uuid: string) {
    // Find an element that has data-uuid-domain and data-uuid attributes matching the given uuidDomain and uuid
    const element = document.querySelector(
      `[data-uuid-domain="${uuidDomain}"][data-uuid="${uuid}"]`
    );
    if (element) {
      this.uuidDomain = uuidDomain;
      this.uuid = uuid;
      this.possess(element as TElement);
    }
  }
  static findAllAndPossess<
    TDomState extends SerializableRecord = SerializableRecord,
    TCustomState extends SerializableRecord = SerializableRecord,
    TElement extends Element = Element,
    TAgent extends Agent<TDomState, TCustomState, TElement> = Agent<
      TDomState,
      TCustomState,
      TElement
    >,
  >(uuidDomain: string, ctor: () => TAgent): TAgent[] {
    const elements = document.querySelectorAll(
      `[data-uuid-domain="${uuidDomain}"]`
    );
    const agents = [];
    for (let i = 0; i < elements.length; i++) {
      const agent = ctor() as TAgent;
      agent.uuidDomain = uuidDomain;
      agent.uuid = elements[i].getAttribute('data-uuid');
      agent.possess(elements[i] as TElement);
      agents.push(agent);
    }
    return agents as TAgent[];
  }
  onPossess() {
    console.log('Agent.onPossess');
  }
  save(): void {
    if (this.isReady()) {
      const agentState = AgentStateStorageManager.getAgentStorage(
        this.uuidDomain as string,
        this.uuid as string
      );

      if (agentState) {
        this.prepareForSaving(this.domState, this.customState);
        AgentStateStorageManager.setAgentStorage(
          this.uuidDomain as string,
          this.uuid as string,
          {
            domState: this.domState,
            customState: this.customState,
          }
        );
      }
    }
  }
  load(): void {
    if (this.isReady()) {
      const agentState = AgentStateStorageManager.getAgentStorage(
        this.uuidDomain as string,
        this.uuid as string
      );
      if (agentState) {
        this.domState = agentState.domState as TDomState;
        this.customState = agentState.customState as TCustomState;
        this.restoreFromSaved(this.domState, this.customState);
      }
    }
  }
}

export const sessionStorageKey = 'agent-state-storage';

/**
 * A type that represents how state data is stored in sessionStorage
 */
export type AgentStateStorage = {
  [uuidDomain: string]: {
    [uuid: string]: {
      domState: SerializableRecord;
      customState: SerializableRecord;
    };
  };
};

export class AgentStateStorageManager {
  static initStorage() {
    const storage = sessionStorage.getItem(sessionStorageKey);
    if (!storage) {
      sessionStorage.setItem(sessionStorageKey, JSON.stringify({}));
    }
  }
  static getStorage(): AgentStateStorage {
    AgentStateStorageManager.initStorage();
    return JSON.parse(sessionStorage.getItem(sessionStorageKey) as string);
  }
  static setStorage(storage: AgentStateStorage) {
    AgentStateStorageManager.initStorage();
    sessionStorage.setItem(sessionStorageKey, JSON.stringify(storage));
  }
  static ensureAgentStorageExists(
    uuidDomain: string,
    uuid: string,
    initialValue: {
      domState: SerializableRecord;
      customState: SerializableRecord;
    } = {
      domState: {},
      customState: {},
    }
  ): void {
    const storage = AgentStateStorageManager.getStorage();
    let domainStorage = storage[uuidDomain];
    if (!domainStorage) {
      storage[uuidDomain] = {};
      domainStorage = storage[uuidDomain];
    }
    const uuidStorage = domainStorage[uuid];
    if (!uuidStorage) {
      domainStorage[uuid] = initialValue;
    }
    AgentStateStorageManager.setStorage(storage);
  }
  static getAgentStorage<
    TDomState extends SerializableRecord = SerializableRecord,
    TCustomState extends SerializableRecord = SerializableRecord,
  >(
    uuidDomain: string,
    uuid: string
  ): { domState: TDomState; customState: TCustomState } {
    AgentStateStorageManager.ensureAgentStorageExists(uuidDomain, uuid);
    const storage = AgentStateStorageManager.getStorage();
    const domainStorage = storage[uuidDomain];
    const uuidStorage = domainStorage[uuid];
    return uuidStorage as { domState: TDomState; customState: TCustomState };
  }
  static setAgentStorage(
    uuidDomain: string,
    uuid: string,
    agentData: {
      domState: SerializableRecord;
      customState: SerializableRecord;
    }
  ) {
    AgentStateStorageManager.ensureAgentStorageExists(uuidDomain, uuid);
    const storage = AgentStateStorageManager.getStorage();
    const domainStorage = storage[uuidDomain];
    const uuidStorage = domainStorage[uuid];
    uuidStorage.domState = agentData.domState;
    uuidStorage.customState = agentData.customState;
    AgentStateStorageManager.setStorage(storage);
  }
}

/**
 * Provides a standard interface that any Agent or subtype of Agent must implement in order to facilitate saving and restoring state.
 *
 * @typeParam TDomState - Describes what attributes of the dom element are truly important to the agent
 * @typeParam TCustomState - A simple key-value store for custom state, simpler than constantly using data- attributes
 */
export interface AgentSerializationProtocol<
  TDomState extends SerializableRecord = SerializableRecord,
  TCustomState extends SerializableRecord = SerializableRecord,
> {
  domState: TDomState;
  customState: TCustomState;
  /**
   * Defines how a subtype of Agent loads its data into an intermediate object which will then be saved in session storage
   *
   * To save on memory and overhead, it mutates, and does not use an immutable pattern
   */
  prepareForSaving(
    currentDOMState: TDomState,
    currentCustomState: TCustomState
  ): void;
  /**
   * Defines how a subtype of Agent restores its data from an intermediate object which was previously saved in session storage
   *
   * To save on memory and overhead, it mutates, and does not use an immutable pattern
   */
  restoreFromSaved(
    savedDOMState: TDomState,
    savedCustomState: TCustomState
  ): void;
}
