import { PARENT_DOT, PARENT_DOT_ON_LIGHT, TOOL_COLOR, type ToolId } from "@/lib/tools";

type Props = { size: number; tool?: ToolId; light?: boolean; letterSpacing?: string };

export function Wordmark({ size, tool, light = false, letterSpacing = "-0.05em" }: Props) {
  const dot = tool ? TOOL_COLOR[tool] : light ? PARENT_DOT_ON_LIGHT : PARENT_DOT;
  return (
    <span
      role="img"
      aria-label={tool ? `fantasy ${tool}` : "fantasy"}
      className="inline-flex items-baseline font-semibold leading-none"
      style={{ fontSize: size, letterSpacing }}
    >
      <span aria-hidden>fantasy</span>
      <span
        aria-hidden
        data-dot
        className="inline-block rounded-full"
        style={{
          width: "0.2em", height: "0.2em", backgroundColor: dot,
          margin: tool ? "0 0.14em 0 0.04em" : "0 0 0 0.04em",
        }}
      />
      {tool && <span aria-hidden className={light ? "text-chalk-muted" : "text-chalk-dim"}>{tool}</span>}
    </span>
  );
}
