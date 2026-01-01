function drawTextWithBold(ctx, parts, x, y, fontSize, maxWidth, lineHeight) {
  let currentX = x;
  let currentY = y;
  let currentLine = "";
  let currentLineWidth = 0;

  parts.forEach((part) => {
    // Handle paragraph breaks (double newlines)
    const paragraphs = part.text.split("\n\n");

    paragraphs.forEach((paragraph, pIndex) => {
      // Handle single line breaks within paragraphs
      const lines = paragraph.split("\n");

      lines.forEach((lineText, lIndex) => {
        if (!lineText.trim()) {
          // Empty line, just add line height
          currentY += lineHeight;
          currentX = x;
          currentLineWidth = 0;
          currentLine = "";
          return;
        }

        const words = lineText.split(" ");

        words.forEach((word, wordIndex) => {
          // Add space before word except for first word
          const wordWithSpace =
            wordIndex > 0 || currentLine ? " " + word : word;

          // Set font based on bold
          ctx.font = part.bold
            ? `bold ${fontSize}px 'Times New Roman'`
            : `${fontSize}px 'Times New Roman'`;
          const wordWidth = ctx.measureText(wordWithSpace).width;

          // Check if we need to wrap
          if (currentLineWidth + wordWidth > maxWidth && currentLine) {
            // Draw current line
            currentY += lineHeight;
            currentX = x;
            currentLineWidth = 0;
            currentLine = "";
          }

          // Draw the word
          ctx.fillText(wordWithSpace.trim(), currentX, currentY);
          currentX += wordWidth;
          currentLineWidth += wordWidth;
          currentLine += wordWithSpace;
        });

        // Move to next line after each line within paragraph
        if (lIndex < lines.length - 1) {
          currentY += lineHeight;
          currentX = x;
          currentLineWidth = 0;
          currentLine = "";
        }
      });

      // Add blank line between paragraphs (but not after the last one)
      if (pIndex < paragraphs.length - 1) {
        currentY += lineHeight * 2; // Move to next line + blank line
        currentX = x;
        currentLineWidth = 0;
        currentLine = "";
      }
    });
  });

  return currentY + lineHeight;
}

export default drawTextWithBold;
