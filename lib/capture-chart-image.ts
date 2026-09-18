import html2canvas from "html2canvas";

/**
 * Rasterizes a live DOM node into a PNG data URL — the bridge between a
 * `recharts` chart (real SVG/DOM output) and `@react-pdf/renderer`, whose
 * own `Svg`/`Path` primitives can't consume it directly. Only the chart
 * itself needs this treatment; the rest of the site report's PDF renders as
 * real vector text through `@react-pdf/renderer`.
 *
 * `scale: 2` renders at roughly retina density so the embedded image stays
 * legible at the size a printed PDF page shows it, not the CSS pixel size
 * the node was mounted at.
 */
export const captureChartImage = async (node: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  return canvas.toDataURL("image/png");
};
