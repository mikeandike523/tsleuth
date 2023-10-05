import { Agent } from '@/framework/agent';
import { SerializableRecord } from '../serialization';

const plusEmoji = '\u2795';
const minusEmoji = '\u2796';

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
  iconSpan: HTMLSpanElement | null;
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
    this.iconSpan = null;
    this.name = 'SpecialAgentHTMLElementDetails';
  }
  prepareForSaving(
    currentDOMState: DomState,
    currentCustomState: CustomState
  ): void {
    if (this.controlledElement) {
      currentDOMState.open = this.controlledElement.open;
      this.domState.open = this.controlledElement.open;
    }
    if (this.iconSpan) {
      this.iconSpan.textContent = this.domState.open ? minusEmoji : plusEmoji;
    }
  }
  restoreFromSaved(
    savedDOMState: DomState,
    savedCustomState: CustomState
  ): void {
    if (this.controlledElement) {
      this.controlledElement.open = savedDOMState.open;
    }
    if (this.iconSpan) {
      this.iconSpan.textContent = this.domState.open ? minusEmoji : plusEmoji;
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
    const summaryElement = element.querySelector('summary');
    if (summaryElement) {
      const children = Array.from(summaryElement.children);
      let foundSpan: HTMLSpanElement | null = null;
      for (const child of children) {
        if (
          child instanceof HTMLSpanElement &&
          child.getAttribute('data-role') === 'icon'
        ) {
          foundSpan = child;
          break;
        }
      }
      this.iconSpan = foundSpan;
    }
    element.addEventListener('toggle', () => {
      this.save();
    });
  }
}
