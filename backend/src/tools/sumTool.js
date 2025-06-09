import { DynamicTool } from "langchain/tools";

const sumTool = new DynamicTool({
  name: "sumar",
  description: "Suma dos números.",
  func: async (input) => {
    const numbers = (input.match(/\d+/g) || []).map(Number);
    return numbers.length >= 2
      ? `${numbers[0] + numbers[1]}`
      : "No entendí los números a sumar.";
  },
});

export default sumTool;
