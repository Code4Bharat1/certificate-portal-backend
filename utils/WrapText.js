// =====================================================
// HELPER: Wrap Text with paragraph support
// =====================================================
function wrapText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  paragraphSpacing = 15
) {
  if (!text) return y;

  let currentY = y;

  // Split by double newlines to detect paragraphs
  const paragraphs = text.split("\n\n");

  paragraphs.forEach((paragraph, pIndex) => {
    // Split by single newlines within the paragraph
    const lines = paragraph.split("\n");

    lines.forEach((lineText, lIndex) => {
      if (!lineText.trim()) {
        // Empty line, just add line height
        currentY += lineHeight;
        return;
      }

      const words = lineText.split(" ");
      let line = "";

      words.forEach((word) => {
        const testLine = line + word + " ";
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && line) {
          ctx.fillText(line.trim(), x, currentY);
          line = word + " ";
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      });

      if (line.trim()) {
        ctx.fillText(line.trim(), x, currentY);
        currentY += lineHeight;
      }
    });

    // Add blank line between paragraphs (but not after the last one)
    if (pIndex < paragraphs.length - 1) {
      currentY += lineHeight; // This creates the blank line
    }
  });

  return currentY;
}

export default wrapText;
