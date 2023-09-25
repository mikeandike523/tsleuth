import { Agent } from '@/framework/agent';
import { SerializableRecord } from '../serialization';

export type DomState = {
  open: boolean;
};

export type CustomState = {};

/**
 * A subclass of the `Agent` class that manages properties of a `<details>` element
 */
export class SpecialAgentHTMLElementDetails extends Agent<
  DomState,
  CustomState,
  HTMLDetailsElement
> {
  constructor() {
    super(
      (elem) => {
        return {
          open: elem.open,
        };
      },
      () => {
        return {};
      }
    );
    this.name = 'SpecialAgentHTMLElementDetails';
  }
  prepareForSaving(
    currentDOMState: DomState,
    currentCustomState: CustomState
  ): void {
    if (this.controlledElement) {
      currentDOMState.open = this.controlledElement.open;
    }
  }
  restoreFromSaved(
    savedDOMState: DomState,
    savedCustomState: CustomState
  ): void {
    if (this.controlledElement) {
      this.controlledElement.open = savedDOMState.open;
    }
  }
  static specialAgentfindAllAndPossess(
    uuidDomain: string
  ): SpecialAgentHTMLElementDetails[] {
    return super.findAllAndPossess<
      DomState,
      CustomState,
      HTMLDetailsElement,
      SpecialAgentHTMLElementDetails
    >(uuidDomain, () => new SpecialAgentHTMLElementDetails());
  }

  onPossess(): void {
    console.log('SpecialAgentHTMLElementDetails onPossess');
    this.load();
    const element = this.controlledElement as HTMLDetailsElement;
    element.addEventListener('toggle', () => {
      this.save();
    });
  }
}
