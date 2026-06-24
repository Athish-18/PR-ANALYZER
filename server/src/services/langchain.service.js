import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";

export const generateCompletion = async ({ systemPrompt, question, context }) => {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
  });

  const prompt = PromptTemplate.fromTemplate(`{systemPrompt}

Context:
{context}

Question: {question}`);

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    systemPrompt,
    context,
    question
  });

  return response.content;
};
