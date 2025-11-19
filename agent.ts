import { Ollama } from "@langchain/community/llms/ollama";
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { createReactAgent } from "langchain/agents";
import { ChatPromptTemplate } from "langchain/prompts";


const llm = new Ollama({
  model: "llama3",    
  temperature: 0.2,
});


const calculator = new DynamicStructuredTool({
  name: "calculator",
  description: "Performs basic arithmetic.",
  schema: z.object({
    expression: z.string().describe("Math expression, e.g., '2 + 3 * 5'"),
  }),
  func: async ({ expression }) => {
    try {
      const result = eval(expression);
      return `Result: ${result}`;
    } catch (e) {
      return `Error: Could not calculate expression.`;
    }
  },
});


const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful agent that can use tools when needed."],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = await createReactAgent({
  llm,
  prompt,
  tools: [calculator],
});

//
// 5. Run agent
//
const runAgent = async () => {
  const result = await agent.invoke({
    input: "What is (12 * 17) + 5?",
  });

  console.log("\n--- Agent Final Answer ---");
  console.log(result.output_text);
};

runAgent();
