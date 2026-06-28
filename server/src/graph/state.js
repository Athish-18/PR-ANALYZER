import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  workflow: Annotation(),
  repositoryId: Annotation(),
  payload: Annotation(),
  context: Annotation(),
  metadata: Annotation(),
  result: Annotation(),
});
