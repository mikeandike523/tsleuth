import { SpecialAgentHTMLElementDetails } from '@/framework/special-agents/html-element-details';
import { SpecialAgentScrollableHTMLElement } from './framework/special-agents/html-element-scrollable';
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

console.log(detailsAgents);

console.log(scrollableAgents);

console.log(scrollableAgents2);

console.log(scrollableAgents3);

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
