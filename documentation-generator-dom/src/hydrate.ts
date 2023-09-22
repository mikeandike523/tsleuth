import { Agent } from '@/framework/agent';

const overviewSidebarDetailsAgents = Agent.findAllAndPossess(
  'overview-sidebar-details'
);

console.log(overviewSidebarDetailsAgents);
