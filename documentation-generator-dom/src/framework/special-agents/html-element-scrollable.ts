import { Agent } from '@/framework/agent';

export interface ScrollableHTMLElement extends HTMLElement {
  scrollTop: number;
  scrollTo: {
    (x: number, y: number): void;
    (options?: ScrollToOptions): void;
  };
  addEventListener(
    type: 'scroll',
    listener: (this: HTMLElement, ev: Event) => unknown | void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

export type DomState = {
  scrollTop: number;
};

export type CustomState = {
  locationHash: string | null;
};

export class SpecialAgentScrollableHTMLElement extends Agent<
  DomState,
  CustomState,
  ScrollableHTMLElement
> {
  hashDetectionEnabled: boolean;

  constructor(hashDetectionEnabled: boolean = false) {
    super(
      (elem: ScrollableHTMLElement) => {
        return {
          scrollTop: elem.scrollTop,
        };
      },
      () => {
        return {
          locationHash: window.location.hash || null,
        };
      }
    );
    this.name = 'SpecialAgentScrollableHTMLElement';
    this.hashDetectionEnabled = hashDetectionEnabled;
  }
  static specialAgentFindAllAndPossess(
    uuidDomain: string,
    hashDetectionEnabled: boolean = false
  ): SpecialAgentScrollableHTMLElement[] {
    return super.findAllAndPossess<
      DomState,
      CustomState,
      ScrollableHTMLElement
    >(
      uuidDomain,
      () => new SpecialAgentScrollableHTMLElement(hashDetectionEnabled)
    ) as SpecialAgentScrollableHTMLElement[];
  }
  prepareForSaving(
    currentDOMState: DomState,
    currentCustomState: CustomState
  ): void {
    if (this.controlledElement) {
      currentDOMState.scrollTop = this.controlledElement.scrollTop;
    }
    const currentHash = window.location.hash || null;
    if (currentHash !== null) {
      currentCustomState.locationHash = currentHash;
    }
  }
  restoreFromSaved(
    savedDOMState: DomState,
    savedCustomState: CustomState
  ): void {
    if (this.controlledElement) {
      if (this.hashDetectionEnabled) {
        const currentHash = window.location.hash || null;
        const lastHash = savedCustomState.locationHash;
        if (
          (lastHash !== null &&
            currentHash !== null &&
            currentHash === lastHash) ||
          currentHash === null
        ) {
          this.controlledElement.scrollTop = savedDOMState.scrollTop;
        }
      } else {
        this.controlledElement.scrollTop = savedDOMState.scrollTop;
      }
    }
  }
  onPossess(): void {
    console.log('SpecialAgentScrollableHTMLElement onPossess');
    this.load();
    const element = this.controlledElement as ScrollableHTMLElement;
    element.addEventListener('scroll', () => {
      this.domState.scrollTop = element.scrollTop;
      this.save();
    });
    window.addEventListener('hashchange', () => {
      this.domState.scrollTop = element.scrollTop;
      this.customState.locationHash = window.location.hash || null;
      this.save();
    });
  }
}
