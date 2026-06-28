import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { chatNode } from "./chat.node.js";
import { reviewNode } from "./review.node.js";

const routeRequest = (state) => {
  if (state.workflow === 'chat') return 'chatNode';
  if (state.workflow === 'review') return 'reviewNode';
  throw new Error(`Unknown workflow type: ${state.workflow}`);
};

const builder = new StateGraph(GraphState)
  .addNode("chatNode", chatNode)
  .addNode("reviewNode", reviewNode)
  .addConditionalEdges(START, routeRequest, {
    chatNode: "chatNode",
    reviewNode: "reviewNode"
  })
  .addEdge("chatNode", END)
  .addEdge("reviewNode", END);

export const appGraph = builder.compile();
