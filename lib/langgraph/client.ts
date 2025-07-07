import { env } from "@/env";
import { Client } from "@langchain/langgraph-sdk";

export const client = new Client({
  apiUrl: env.LANGGRAPH_API_URL,
  apiKey: env.LANGSMITH_API_KEY,
  timeoutMs: 30000,
  defaultHeaders: {
    "User-Agent": "Pullsmith/1.0",
    Connection: "keep-alive",
  },
});

export const createOptimizedClient = () => {
  return new Client({
    apiUrl: env.LANGGRAPH_API_URL,
    apiKey: env.LANGSMITH_API_KEY,
    timeoutMs: 60000,
    defaultHeaders: {
      "User-Agent": "Pullsmith/1.0",
      Connection: "keep-alive",
    },
  });
};
