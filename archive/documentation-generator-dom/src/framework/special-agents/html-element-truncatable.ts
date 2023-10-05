import { Agent } from '@/framework/agent';

export interface ScrollableHTMLElement extends HTMLElement {
  scrollWidth: number;
  clientWidth: number;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export type DomState = {
  textContent: string | null;
};

export type CustomState = {};

export class SpecialAgentTruncatableHTMLElement extends Agent<
  DomState,
  CustomState,
  ScrollableHTMLElement
> {
  constructor() {
    super(
      (elem: ScrollableHTMLElement) => {
        return {
          textContent: elem.textContent,
        };
      },
      () => {
        return {};
      }
    );
    this.name = 'SpecialAgentTruncatableHTMLElement';
  }
  static specialAgentFindAllAndPossess(
    uuidDomain: string
  ): SpecialAgentTruncatableHTMLElement[] {
    return super.findAllAndPossess<
      DomState,
      CustomState,
      ScrollableHTMLElement
    >(
      uuidDomain,
      () => new SpecialAgentTruncatableHTMLElement()
    ) as SpecialAgentTruncatableHTMLElement[];
  }
  checkTruncation(): void {
    if (this.controlledElement) {
      if (
        this.controlledElement.scrollWidth > this.controlledElement.clientWidth
      ) {
        this.controlledElement.setAttribute(
          'title',
          this.domState.textContent ?? ''
        );
      } else {
        this.controlledElement.removeAttribute('title');
      }
    }
  }
  onPossess(): void {
    console.log('SpecialAgentTruncatableHTMLElement onPossess');
    if (this.controlledElement) {
      this.domState.textContent = this.controlledElement.textContent;
    }
    this.checkTruncation();
    window.addEventListener('resize', () => {
      this.checkTruncation();
    });
  }
}
