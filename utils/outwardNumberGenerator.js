import Letter from "../models/letter.models.js";
import ClientLetter from "../models/clientdata.models.js";

/**
 * Generate a unified outward number across Letters and Client Letters
 *
 * Format: NEX/YYYY/MM/DD/SerialNumber
 * Serial starts from 5 and increments globally
 */
export async function generateUnifiedOutwardNo(issueDate) {
  const issue = issueDate ? new Date(issueDate) : new Date();

  const yyyy = issue.getFullYear();
  const mm = String(issue.getMonth() + 1).padStart(2, "0");
  const dd = String(issue.getDate()).padStart(2, "0");
  const datePart = `${yyyy}/${mm}/${dd}`;

  // ✅ Find the highest outwardSerial across BOTH collections
  const [lastLetter, lastClientLetter] = await Promise.all([
    Letter.findOne({}).sort({ outwardSerial: -1, createdAt: -1 }).lean(),
    ClientLetter.findOne({}).sort({ outwardSerial: -1, createdAt: -1 }).lean(),
  ]);

  let maxSerial = 0;

  // Check Letter collection
  if (lastLetter && lastLetter.outwardSerial) {
    maxSerial = Math.max(maxSerial, lastLetter.outwardSerial);
  }

  // Check ClientLetter collection
  if (lastClientLetter && lastClientLetter.outwardSerial) {
    maxSerial = Math.max(maxSerial, lastClientLetter.outwardSerial);
  }

  // ✅ Increment and ensure minimum is 5
  let nextSerial = maxSerial + 1;
  if (nextSerial < 5) {
    nextSerial = 5;
  }

  const outwardNo = `NEX/${datePart}/${nextSerial}`;

  return { outwardNo, outwardSerial: nextSerial };
}
