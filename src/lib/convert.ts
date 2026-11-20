// Turns an uploaded plain text or Markdown file into the simple HTML the
// editor stores. Supported types are deliberately limited to .txt and .md,
// and the UI says so next to the Upload button.

// Uploads are capped at 100 KB. The home page checks the file size before
// reading the file, and the limit is stated next to the Upload button.
export const MAX_UPLOAD_BYTES = 100 * 1024;
export const MAX_UPLOAD_LABEL = "100 KB";

export function isSupportedUpload(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".txt") || lower.endsWith(".md");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function fileTextToHtml(fileName: string, text: string): string {
  const isMarkdown = fileName.toLowerCase().endsWith(".md");
  const lines = text.split(/\r?\n/);
  const blocks: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isMarkdown && line.startsWith("## ")) {
      blocks.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
    } else if (isMarkdown && line.startsWith("# ")) {
      blocks.push(`<h1>${escapeHtml(line.slice(2).trim())}</h1>`);
    } else {
      blocks.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  return blocks.join("");
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.(txt|md)$/i, "").trim();
  return base || "Untitled document";
}
