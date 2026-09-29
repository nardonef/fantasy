export type ToolId = "wrapped" | "rankings" | "hedge";

export const TOOL_COLOR: Record<ToolId, string> = {
  wrapped: "#5B8CFF",
  rankings: "#4CD48F",
  hedge: "#F2B441",
};

export const PARENT_DOT = "#5B8CFF";
export const PARENT_DOT_ON_LIGHT = "#2148D8";

export const TOOL_URL: Record<"wrapped" | "rankings", string> = {
  wrapped: "https://fantasywrapped.net",
  rankings: "https://fantasy-rankings-beige.vercel.app",
};
