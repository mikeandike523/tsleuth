import { SpecialAgentHTMLElementDetails } from '@/framework/special-agents/html-element-details';
import { SpecialAgentScrollableHTMLElement } from './framework/special-agents/html-element-scrollable';
import { SpecialAgentTruncatableHTMLElement } from './framework/special-agents/html-element-truncatable';
import { sessionStorageKey } from './framework/agent';

const detailsAgents =
  SpecialAgentHTMLElementDetails.specialAgentfindAllAndPossess(
    'overview-sidebar-details'
  );

const scrollableAgents =
  SpecialAgentScrollableHTMLElement.specialAgentFindAllAndPossess(
    'overview-sidebar-scrollable'
  );

const scrollableAgents2 =
  SpecialAgentScrollableHTMLElement.specialAgentFindAllAndPossess(
    'symbol-list-scrollable'
  );

const scrollableAgents3 =
  SpecialAgentScrollableHTMLElement.specialAgentFindAllAndPossess(
    'directory-index-scrollable'
  );

const truncatableAgents =
  SpecialAgentTruncatableHTMLElement.specialAgentFindAllAndPossess(
    'text-truncatable'
  );

console.log(detailsAgents);

console.log(scrollableAgents);

console.log(scrollableAgents2);

console.log(scrollableAgents3);

console.log(truncatableAgents);

(
  globalThis as {
    showAgentStorage?: () => void;
  }
).showAgentStorage = () => {
  const data = sessionStorage.getItem(sessionStorageKey);
  if (data) {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  }
};
