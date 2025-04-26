import dotenv from "dotenv";

export function mcpText(text: string, suggestion?: string) {
    let fullText = text;
    if (suggestion) {
      fullText += `\n\nSuggestion: ${suggestion}`;
    }
    return {
      content: [{ type: "text" as const, text: fullText }],
    };
  }
  
  export function mcpError(message: string, suggestion?: string) {
    let text = message;
    if (suggestion) {
      text += `\n\nSuggestion: ${suggestion}`;
    }
    return {
      content: [{ type: "text" as const, text }],
      isError: true,
    };
  }


