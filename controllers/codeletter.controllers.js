import Letter from "../models/letter.models.js";

import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { validationResult } from "express-validator";
import People from "../models/people.models.js";
import ActivityLog from "../models/activitylog.models.js";
import {
  sendWhatsAppMessage,
  getLetterMessageTemplate,
} from "../services/whatsappService.js";
import emailService from "../services/emailService.js";
import { generateUnifiedOutwardNo } from "../utils/outwardNumberGenerator.js";
import drawAppreciationTemplate from "../utils/AppreciationTemplate.js";
// IT-Nexcore templates
import drawJoiningLetterPaid from "../utils/C4B/JoiningLetter/JoiningLetterPaid.js";
import drawJoiningLetterUnpaid from "../utils/C4B/JoiningLetter/JoiningLetterUnpaid.js";
// Marketing Junction templates
import drawMJJoiningLetterPaid from "../utils/MJ/JoiningLetter/JoiningLetterPaid.js";
import drawMJJoiningLetterUnpaid from "../utils/MJ/JoiningLetter/JoiningLetterUnpaid.js";
import drawC4BExperienceLetter from "../utils/C4B/ExperienceLetter.js";
import drawODExperienceLetter from "../utils/OD/ExperienceLetter.js";
import drawC4BNDA from "../utils/C4B/NDA.js";
import drawODNDA from "../utils/OD/NDA.js";
// Add to existing imports
import drawC4BUnpaidToPaid from "../utils/C4B/PromotionLetter/C4BUnpaidToPaid.js";
import drawC4BStipendRevision from "../utils/C4B/PromotionLetter/C4BStipendRev.js";
import drawODUnpaidToPaid from "../utils/OD/PromotionLetter/ODUnpaidToPaid.js";
import drawODStipendRevision from "../utils/OD/PromotionLetter/ODStipendRev.js";
import drawHRUnpaidToPaid from "../utils/HR/PromotionLetter/HRUnpaidToPaid.js";
import drawHRStipendRevision from "../utils/HR/PromotionLetter/HRStipendRev.js";
import drawMJUnpaidToPaid from "../utils/MJ/PromotionLetter/MJUnpaidToPaid.js";
import drawMJStipendRevision from "../utils/MJ/PromotionLetter/MJStipendRev.js";
import drawTimelineLetter from "../utils/C4B/TimelineLetter.js";
import drawHRTimelineLetter from "../utils/HR/TimelineLetter.js";
import drawMJTimelineLetter from "../utils/MJ/TimelineLetter.js";
import drawODTimelineLetter from "../utils/OD/TimelineLetter.js";
import drawFSDGeneralAppreciation from "../utils/FSD/AppreciationLetter/FSDGeneral.js";
import drawFSDConsistentPerformance from "../utils/FSD/AppreciationLetter/FSDConsistentPerformance.js";
import drawFSDOutstandingPerformance from "../utils/FSD/AppreciationLetter/FSDOutstandingPerformance.js";
import drawFSDBestAttendance from "../utils/FSD/AppreciationLetter/FSDBestAttendance.js";
import drawFSDGeneralWarning from "../utils/FSD/WarningLetter/FSDGeneralWarningLetter.js";
import drawFSDIncompleteAssignment from "../utils/FSD/WarningLetter/FSDInc.js";
import drawFSDLowAttendance from "../utils/FSD/WarningLetter/FSDLowAttendance.js";
import drawFSDMisconduct from "../utils/FSD/WarningLetter/FSDMisconduct.js";
import drawFSDUnauthorizedAbsence from "../utils/FSD/WarningLetter/FSDUnauth.js";
import drawFSDPunctuality from "../utils/FSD/WarningLetter/FSDPunctuality.js";
import drawFSDConcernLetter from "../utils/FSD/ConcernLetter.js";
import drawDMOfferLetter from "../utils/DM/OfferLetter.js";
import drawFSDLiveProjectAgreement from "../utils/FSD/LiveProjAgreement.js";
import drawBVOCCommitteeMember from "../utils/BVOC/CommitteeLetter/Member.js";
import drawBVOCCommitteeVicePresident from "../utils/BVOC/CommitteeLetter/VicePresident.js";
import drawBVOCCommitteePresident from "../utils/BVOC/CommitteeLetter/President.js";
import drawMJExperienceLetter from "../utils/MJ/ExperienceLetter.js";
import drawMJNDA from "../utils/MJ/NDA.js";
import drawHRJoiningLetterPaid from "../utils/HR/JoiningLetter/JoiningLetterPaid.js";
import drawHRJoiningLetterUnpaid from "../utils/HR/JoiningLetter/JoiningLetterUnpaid.js";
import drawHRNDA from "../utils/HR/NDA.js";
import drawODJoiningLetterPaid from "../utils/OD/JoiningLetter/JoiningLetterPaid.js";
import drawODJoiningLetterUnpaid from "../utils/OD/JoiningLetter/JoiningLetterUnpaid.js";
import drawDMAppreciationTemplate from "../utils/DM/AppreciationLetter/DMGeneral.js";
import drawDMConsistentPerformance from "../utils/DM/AppreciationLetter/DMConsistentPerformer.js";
import drawDMBestAttendance from "../utils/DM/AppreciationLetter/DMBestAttendance.js";
import drawDMOutstandingPerformance from "../utils/DM/AppreciationLetter/DMOutstandingPerformer.js";
import drawDMConcernLetter from "../utils/DM/ConcernLetter.js";
import drawDMExperienceLetter from "../utils/DM/ExperienceLetter.js";
import drawDMGeneralWarning from "../utils/DM/WarningLetter/DMGeneralWarningLetter.js";
import drawDMIncompleteAssignment from "../utils/DM/WarningLetter/DMInc.js";
import drawDMLowAttendance from "../utils/DM/WarningLetter/DMLowAttendance.js";
import drawDMMisconduct from "../utils/DM/WarningLetter/DMMisconduct.js";
import drawDMUnauthorizedAbsence from "../utils/DM/WarningLetter/DMUnauth.js";
import drawDMPunctuality from "../utils/DM/WarningLetter/DMPunctuality.js";
import drawFSDExperienceLetter from "../utils/FSD/ExperienceLetter.js";
import drawFSDOfferLetter from "../utils/FSD/OfferLetter.js";
import drawBVOCBestAttendance from "../utils/BVOC/AppreciationLetter/BVOCBestAttendance.js";
import drawBVOCOutstandingPerformance from "../utils/BVOC/AppreciationLetter/BVOCOutstandingPerformer.js";
import drawBVOCConsistentPerformance from "../utils/BVOC/AppreciationLetter/BVOCConsistentPerformer.js";
import drawBVOCGeneralAppreciation from "../utils/BVOC/AppreciationLetter/BVOCGeneral.js";
import drawBVOCDebugging from "../utils/BVOC/AppreciationLetter/BVOCErroraandDebugging.js";
import drawBVOCConcernLetter from "../utils/BVOC/ConcernLetter.js";
import drawBVOCPunctuality from "../utils/BVOC/WarningLetter/BVOCPunctuality.js";
import drawBVOCUnauthorizedAbsence from "../utils/BVOC/WarningLetter/BVOCUnauth.js";
import drawBVOCMisconduct from "../utils/BVOC/WarningLetter/BVOCMisconduct.js";
import drawBVOCLowAttendance from "../utils/BVOC/WarningLetter/BVOCLowAttendance.js";
import drawBVOCGeneralWarning from "../utils/BVOC/WarningLetter/BVOCGeneralWarningLetter.js";
import drawBVOCIncompleteAssignment from "../utils/BVOC/WarningLetter/BVOCInc.js";
import drawITMemo from "../utils/C4B/MEMO.js";
import drawMJMemo from "../utils/MJ/MEMO.js";
import drawODMemo from "../utils/OD/MEMO.js";
import drawHRMemo from "../utils/HR/MEMO.js";
import drawFSDMemo from "../utils/FSD/MEMO.js";
import drawDMMemo from "../utils/DM/MEMO.js";
import drawBVOCMemo from "../utils/BVOC/MEMO.js";
import drawITOnboardingNDA from "../utils/C4B/OnNDA.js";
import drawMJOnboardingNDA from "../utils/MJ/OnNDA.js";
import drawODOnboardingNDA from "../utils/OD/OnNDA.js";
import drawHROnboardingNDA from "../utils/HR/OnNDA.js";
import drawRFIDLetter from "../utils/C4B/RFID.js";
import drawFSDMonthly from "../utils/FSD/WarningLetter/FSDMonthly.js";
import drawBVOCMonthly from "../utils/BVOC/WarningLetter/BVOCMonthly.js";
import drawDMMonthly from "../utils/DM/WarningLetter/DMMonthly.js";
import drawHRPunctuality from "../utils/HR/WarningLetter/HRPunctuality.js";
import drawHRUnauthorizedAbsence from "../utils/HR/WarningLetter/HRUnauth.js";
import drawHRMisconduct from "../utils/HR/WarningLetter/HRMisconduct.js";
import drawHRMonthly from "../utils/HR/WarningLetter/HRMonthly.js";
import drawHRLowAttendance from "../utils/HR/WarningLetter/HRLowAttendance.js";
import drawHRGeneralWarning from "../utils/HR/WarningLetter/HRGeneralWarningLetter.js";
import drawODPunctuality from "../utils/OD/WarningLetter/ODPunctuality.js";
import drawODUnauthorizedAbsence from "../utils/OD/WarningLetter/ODUnauth.js";
import drawODMisconduct from "../utils/OD/WarningLetter/ODMisconduct.js";
import drawODMonthly from "../utils/OD/WarningLetter/ODMonthly.js";
import drawODLowAttendance from "../utils/OD/WarningLetter/ODLowAttendance.js";
import drawODGeneralWarning from "../utils/OD/WarningLetter/ODGeneralWarningLetter.js";
import drawITPunctuality from "../utils/C4B/WarningLetter/ITPunctuality.js";
import drawITUnauthorizedAbsence from "../utils/C4B/WarningLetter/ITUnauth.js";
import drawITMisconduct from "../utils/C4B/WarningLetter/ITMisconduct.js";
import drawITMonthly from "../utils/C4B/WarningLetter/ITMonthly.js";
import drawITLowAttendance from "../utils/C4B/WarningLetter/ITLowAttendance.js";
import drawITGeneralWarning from "../utils/C4B/WarningLetter/ITGeneralWarningLetter.js";
import drawMJPunctuality from "../utils/MJ/WarningLetter/MJPunctuality.js";
import drawMJUnauthorizedAbsence from "../utils/MJ/WarningLetter/MJUnauth.js";
import drawMJMisconduct from "../utils/MJ/WarningLetter/MJMisconduct.js";
import drawMJMonthly from "../utils/MJ/WarningLetter/MJMonthly.js";
import drawMJLowAttendance from "../utils/MJ/WarningLetter/MJLowAttendance.js";
import drawMJGeneralWarning from "../utils/MJ/WarningLetter/MJGeneralWarningLetter.js";
import drawITEL from "../utils/C4B/EL.js";
import drawHREL from "../utils/HR/EL.js";
import drawMJEL from "../utils/MJ/EL.js";
import drawODEL from "../utils/OD/EL.js";


const { getLetterEmailTemplate, sendEmail } = emailService;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// HELPER: Generate Letter ID
// =====================================================
async function generateCodeLetterId(category) {
  const catMap = {
    "IT-Nexcore": "NEX",
    "marketing-junction": "MJ",
    fsd: "FSD",
    hr: "HR",
    bvoc: "BVOC",
  };

  const catAbbr = catMap[category] || category.toUpperCase().slice(0, 4);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const regex = new RegExp(`^${catAbbr}-${dateStr}-(\\d+)$`);

  const last = await Letter.find({
    letterId: { $regex: `^${catAbbr}-${dateStr}-` },
  })
    .select("letterId")
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  let nextNum = 1;

  if (last.length) {
    const match = last[0].letterId.match(regex);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(2, "0");
  return `${catAbbr}-${dateStr}-${padded}`;
}

// =====================================================
// HELPER: Format Date
// =====================================================
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// =====================================================
// HELPER: Get Template Paths
// =====================================================
function getTemplatePaths(category) {
  let templatesPath;

  if (category === "marketing-junction") {
    templatesPath = path.join(__dirname, "../templates/CL");
  } else {
    templatesPath = path.join(__dirname, "../templates/CL");
  }

  return {
    headerPath: path.join(templatesPath, "Header.jpg"),
    footerPath: path.join(templatesPath, "Footer.jpg"),
    signaturePath: path.join(templatesPath, "Signature.jpg"),
    stampPath: path.join(templatesPath, "Stamp.jpg"),
  };
}

// =====================================================
// HELPER: Get Drawing Function
// =====================================================
function getDrawingFunction(category, course) {
  if (category === "marketing-junction") {
    if (course === "Internship Joining Letter - Paid") {
      return drawMJJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawMJJoiningLetterUnpaid;
    } else if (course === "Internship Experience Certificate") {
      return drawMJExperienceLetter;
    } else if (course === "Experience Certificate") {
      return drawMJEL;
    } else if (course === "Non Paid to Paid") {
      return drawMJUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawMJStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawMJTimelineLetter;
    } else if (course === "Non-Disclosure Agreement") {
      return drawMJNDA;
    } else if (course === "Memo") {
      return drawMJMemo;
    } else if (course === "Onboarding Non-Disclosure Agreement") {
      return drawMJOnboardingNDA;
    } else if (course === "General Warning Letter") {
      return drawMJGeneralWarning;
    } else if (course === "Warning for Low Attendance") {
      return drawMJLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)") {
      return drawMJMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawMJMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence from Training Sessions"
    ) {
      return drawMJUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawMJPunctuality;
    }
  } else if (category === "IT-Nexcore") {
    if (course === "Internship Joining Letter - Paid") {
      return drawJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawJoiningLetterUnpaid;
    } else if (course === "Internship Experience Certificate") {
      return drawC4BExperienceLetter;
    } else if (course === "Experience Certificate") {
      return drawITEL;
    } else if (course === "Non-Disclosure Agreement") {
      return drawC4BNDA;
    } else if (course === "Non Paid to Paid") {
      return drawC4BUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawC4BStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawTimelineLetter;
    } else if (course === "Memo") {
      return drawITMemo;
    } else if (course === "Onboarding Non-Disclosure Agreement") {
      return drawITOnboardingNDA;
    } else if (course === "RFID Appreciation Letter") {
      return drawRFIDLetter;
    } else if (course === "General Warning Letter") {
      return drawITGeneralWarning;
    }  else if (course === "Warning for Low Attendance") {
      return drawITLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)") {
      return drawITMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawITMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence"
    ) {
      return drawITUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawITPunctuality;
    }
  } else if (category === "Operations Department") {
    if (course === "Internship Joining Letter - Paid") {
      return drawODJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawODJoiningLetterUnpaid;
    } else if (course === "Internship Experience Certificate") {
      return drawODExperienceLetter;
    } else if (course === "Experience Certificate") {
      return drawODEL;
    } else if (course === "Non-Disclosure Agreement") {
      return drawODNDA;
    } else if (course === "Non Paid to Paid") {
      return drawODUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawODStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawODTimelineLetter;
    } else if (course === "Memo") {
      return drawODMemo;
    } else if (course === "Onboarding Non-Disclosure Agreement") {
      return drawODOnboardingNDA;
    } else if (course === "General Warning Letter") {
      return drawODGeneralWarning;
    } else if (course === "Warning for Low Attendance") {
      return drawODLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)") {
      return drawODMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawODMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence from Training Sessions"
    ) {
      return drawODUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawODPunctuality;
    }
  } else if (category === "HR") {
    if (course === "Internship Joining Letter - Paid") {
      return drawHRJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawHRJoiningLetterUnpaid;
    } else if (course === "Internship Experience Certificate") {
      return drawC4BExperienceLetter;
    } else if (course === "Experience Certificate") {
      return drawHREL;
    } else if (course === "Non Paid to Paid") {
      return drawHRUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawHRStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawHRTimelineLetter;
    } else if (course === "Non-Disclosure Agreement") {
      return drawHRNDA;
    } else if (course === "Memo") {
      return drawHRMemo;
    } else if (course === "Onboarding Non-Disclosure Agreement") {
      return drawHROnboardingNDA;
    } else if (course === "General Warning Letter") {
      return drawHRGeneralWarning;
    } else if (course === "Warning for Low Attendance") {
      return drawHRLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)") {
      return drawHRMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawHRMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence from Training Sessions"
    ) {
      return drawHRUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawHRPunctuality;
    }
  } else if (category === "FSD") {
    if (course === "General Appreciation Letter") {
      return drawFSDGeneralAppreciation;
    } else if (course === "Appreciation for Consistent Performance") {
      return drawFSDConsistentPerformance;
    } else if (course === "Appreciation for Outstanding Performance") {
      return drawFSDOutstandingPerformance;
    } else if (course === "Appreciation for Best Attendance") {
      return drawFSDBestAttendance;
    } else if (course === "General Warning Letter") {
      return drawFSDGeneralWarning;
    } else if (
      course === "Warning for Incomplete Assignment/Project Submissions"
    ) {
      return drawFSDIncompleteAssignment;
    } else if (course === "Warning for Low Attendance") {
      return drawFSDLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)"){
      return drawFSDMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawFSDMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence from Training Sessions"
    ) {
      return drawFSDUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawFSDPunctuality;
    } else if (course === "Concern Letter-Audit Interview Performance") {
      return drawFSDConcernLetter;
    } else if (course === "Live Project Agreement") {
      return drawFSDLiveProjectAgreement;
    } else if (course === "Internship Experience Certificate") {
      return drawFSDExperienceLetter;
    } else if (course === "Offer Letter") {
      return drawFSDOfferLetter;
    } else if (course === "Memo") {
      return drawFSDMemo;
    }
  } else if (category === "DM") {
    // ✅ DM CATEGORY - ONLY DM-SPECIFIC TEMPLATES
    if (course === "Offer Letter") {
      return drawDMOfferLetter;
    } else if (course === "General Appreciation Letter") {
      return drawDMAppreciationTemplate;
    } else if (course === "Appreciation for Consistent Performance") {
      return drawDMConsistentPerformance;
    } else if (course === "Appreciation for Outstanding Performance") {
      return drawDMOutstandingPerformance;
    } else if (course === "Appreciation for Best Attendance") {
      return drawDMBestAttendance;
    } else if (course === "Concern Letter-Audit Interview Performance") {
      return drawDMConcernLetter;
    } else if (course === "Internship Experience Certificate") {
      return drawDMExperienceLetter;
    } else if (course === "General Warning Letter") {
      return drawDMGeneralWarning;
    } else if (
      course === "Warning for Incomplete Assignment/Project Submissions"
    ) {
      return drawDMIncompleteAssignment;
    } else if (course === "Warning for Low Attendance") {
      return drawDMLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)") {
      return drawDMMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawDMMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence from Training Sessions"
    ) {
      return drawDMUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawDMPunctuality;
    } else if (course === "Memo") {
      return drawDMMemo;
    }
    // Add other DM-specific templates here as needed
  } else if (category === "BVOC") {
    if (course === "Committee Member") {
      return drawBVOCCommitteeMember;
    } else if (course === "Committee Vice-President") {
      return drawBVOCCommitteeVicePresident;
    } else if (course === "Committee President") {
      return drawBVOCCommitteePresident;
    } else if (course === "General Appreciation Letter") {
      return drawBVOCGeneralAppreciation;
    } else if (course === "Appreciation for Consistent Performance") {
      return drawBVOCConsistentPerformance;
    } else if (course === "Appreciation for Outstanding Performance") {
      return drawBVOCOutstandingPerformance;
    } else if (course === "Appreciation for Best Attendance") {
      return drawBVOCBestAttendance;
    } else if (course === "Appreciation for Detecting Errors And Debugging") {
      return drawBVOCDebugging; // ✅ ADD THIS
    } else if (course === "Concern Letter-Audit Interview Performance") {
      return drawBVOCConcernLetter;
    } else if (course === "General Warning Letter") {
      return drawBVOCGeneralWarning;
    } else if (
      course === "Warning for Incomplete Assignment/Project Submissions"
    ) {
      return drawBVOCIncompleteAssignment;
    } else if (course === "Warning for Low Attendance") {
      return drawBVOCLowAttendance;
    } else if (course === "Warning for Low Attendance (Monthly)") {
      return drawBVOCMonthly;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawBVOCMisconduct;
    } else if (course === "Warning for Unauthorized Absence from Sessions") {
      return drawBVOCUnauthorizedAbsence;
    } else if (course === "Warning for Punctuality and Discipline") {
      return drawBVOCPunctuality;
    } else if (course === "Memo") {
      return drawBVOCMemo;
    }
}

  // Default for other letter types
  if (course === "Appreciation Letter") {
    return drawAppreciationTemplate;
  }

  return null;
}

// =====================================================
// CREATE CODE LETTER
// =====================================================
const createCodeLetter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      category,
      issueDate,
      letterType,
      course,
      subject,
      month,
      year,
      description,
      role,
      trainingPeriod,
      trainingStartDate,
      trainingEndDate,
      officialStartDate,
      completionDate,
      responsibilities,
      amount,
      effectiveFrom,
      startDate,
      endDate,
      genderPronoun,
      duration,
      timelineStage,
      timelineProjectName,
      timelineDueDate,
      timelineNewDate,
    } = req.body;


    // Validation
    if (!name || !category || !course || !issueDate || !letterType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Additional validation for Appreciation Letter
   if (course === "RFID Appreciation Letter") {
      // No additional validation needed for RFID letter
    }  else if (course === "Appreciation Letter") {
      if (!subject || !month || !year || !description) {
        return res.status(400).json({
          success: false,
          message:
            "Appreciation Letter requires subject, month, year, and description",
        });
      }
    }

    // Additional validation for Joining Letters
    if (
      course === "Internship Joining Letter - Paid" ||
      course === "Internship Joining Letter - Unpaid"
    ) {
      if (
        !role ||
        !trainingStartDate ||
        !trainingEndDate ||
        !officialStartDate ||
        !completionDate ||
        !responsibilities
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Joining Letter requires role, training dates, internship dates, and responsibilities",
        });
      }

      // Additional validation for paid internship
      if (course === "Internship Joining Letter - Paid") {
        if (!amount || !effectiveFrom) {
          return res.status(400).json({
            success: false,
            message: "Paid Internship requires amount and effective from date",
          });
        }
      }
    }
    if (letterType === "Timeline Letter") {
      if (
        !timelineStage ||
        !timelineProjectName ||
        !timelineDueDate ||
        !timelineNewDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Timeline Letter requires stage, project name, and both dates",
        });
      }
    }

    // Generate unique letter ID
    let letterId;
    let exists;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      letterId = await generateCodeLetterId(category);
      exists = await Letter.findOne({ letterId });
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique letter ID");
      }
    } while (exists);

    // Generate outward number
    const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(
      issueDate
    );


    // Get user data
    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;

    // Prepare letter data
    const letterData = {
      letterId,
      name,
      category,
      batch: "",
      letterType,
      subType: "code-letter",
      course,
      issueDate: new Date(issueDate),
      outwardNo,
      outwardSerial,
      createdBy: req.user?._id || null,
    };

    if (course !== "RFID Appreciation Letter") {
      letterData.amount = amount ? parseFloat(amount) : undefined;
      letterData.effectiveFrom = effectiveFrom
        ? new Date(effectiveFrom)
        : undefined;

      letterData.startDate = startDate ? new Date(startDate) : undefined;
      letterData.endDate = endDate ? new Date(endDate) : undefined;

      letterData.genderPronoun = genderPronoun || "";
      letterData.duration = duration || "";

      // Timeline Letter fields
      if (letterType === "Timeline Letter") {
        letterData.timelineStage = timelineStage;
        letterData.timelineProjectName = timelineProjectName;
        letterData.timelineDueDate = new Date(timelineDueDate);
        letterData.timelineNewDate = new Date(timelineNewDate);
      }

      // Add fields based on letter type
      if (course === "Appreciation Letter") {
        letterData.subject = subject || "";
        letterData.month = month || "";
        letterData.year = year || null;
        letterData.description = description || "";
      } else if (
        course === "Internship Joining Letter - Paid" ||
        course === "Internship Joining Letter - Unpaid"
      ) {
        letterData.role = role;
        letterData.trainingStartDate = new Date(trainingStartDate);
        letterData.trainingEndDate = new Date(trainingEndDate);
        letterData.officialStartDate = new Date(officialStartDate);
        letterData.completionDate = new Date(completionDate);
        letterData.responsibilities = responsibilities;

        if (course === "Internship Joining Letter - Paid") {
          letterData.amount = parseFloat(amount);
          letterData.effectiveFrom = new Date(effectiveFrom);
        }
      }
    }
    // Create letter
    const letter = await Letter.create(letterData);


    // Send notifications
    // if (userPhone) {
    //   try {
    //     const message = getLetterMessageTemplate(
    //       name,
    //       course,
    //       formatDate(issueDate)
    //     );
    //     await sendWhatsAppMessage(userPhone, message);
    //   } catch (error) {
    //     console.error("WhatsApp notification failed:", error);
    //   }
    // }

    // if (userData?.email) {
    //   try {
    //     const emailContent = getLetterEmailTemplate(
    //       name,
    //       course,
    //       formatDate(issueDate)
    //     );
    //     await sendEmail(
    //       userData.email,
    //       `Your ${course} is Ready`,
    //       emailContent
    //     );
    //   } catch (error) {
    //     console.error("Email notification failed:", error);
    //   }
    // }

    // Log activity
    try {
      await ActivityLog.create({
        action: "created",
        letterId: letter.letterId,
        userName: letter.name,
        adminId: req.user?._id,
        details: `Code Letter created for ${letter.name} - ${course}`,
      });
    } catch (error) {
      console.error("Activity log failed:", error);
    }

    return res.status(201).json({
      success: true,
      message: "Code Letter created successfully",
      letter: {
        letterId: letter.letterId,
        name: letter.name,
        category: letter.category,
        course: letter.course,
        outwardNo: letter.outwardNo,
        issueDate: letter.issueDate,
      },
    });
  } catch (error) {
    console.error("❌ Create code letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create code letter",
      error: error.message,
    });
  }
};

// =====================================================
// PREVIEW CODE LETTER
// =====================================================
// In your letter.controller.js, replace the previewCodeLetter function


const previewCodeLetter = async (req, res) => {
  try {
    const {
      name,
      category,
      issueDate,
      letterType,
      course,
      subject,
      month,
      year,
      description,
      role,
      trainingPeriod, // ✅ GET FROM REQUEST
      trainingStartDate,
      trainingEndDate,
      officialStartDate,
      completionDate,
      responsibilities,
      amount,
      effectiveFrom,
      startDate,
      endDate,
      genderPronoun,
      duration,
      timelineStage,
      timelineProjectName,
      timelineDueDate,
      timelineNewDate,
      // BVOC/FSD specific fields
      committeeType,
      attendancePercent,
      attendanceMonth,
      attendanceYear,
      performanceMonth,
      performanceYear,
      testingPhase,
      uncover,
      subjectName,
      projectName,
      misconductReason,
      auditDate,
    } = req.body;

    // Validation
    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, category, issueDate, course",
      });
    }

    // ✅ RFID Letter validation - only needs name and issueDate
    if (course === "RFID Appreciation Letter") {
      // No additional fields needed
    } else if (course === "Onboarding Non-Disclosure Agreement") {
      if (!role || !duration) {
        return res.status(400).json({
          success: false,
          message: "Onboarding NDA requires: role and duration",
        });
      }
    }

    // Fetch user data
    let userData = null;
    if (name) {
      userData = await People.findOne({ name }).lean();
    }

    // Generate temporary IDs
    const tempId = await generateCodeLetterId(category);
    const { outwardNo } = await generateUnifiedOutwardNo(issueDate);

    // Format dates
    const formattedDate = formatDate(issueDate);
    const formattedTrainingStart = trainingStartDate
      ? formatDate(trainingStartDate)
      : "";
    const formattedTrainingEnd = trainingEndDate
      ? formatDate(trainingEndDate)
      : "";
    const formattedOfficialStart = officialStartDate
      ? formatDate(officialStartDate)
      : "";
    const formattedCompletion = completionDate
      ? formatDate(completionDate)
      : "";
    const formattedEffectiveFrom = effectiveFrom
      ? formatDate(effectiveFrom)
      : "";
    const formattedStartDate = startDate ? formatDate(startDate) : "";
    const formattedEndDate = endDate ? formatDate(endDate) : "";

    // Get template paths
    const { headerPath, footerPath, signaturePath, stampPath } =
      getTemplatePaths(category);

    // Check if files exist
    if (!fs.existsSync(headerPath) || !fs.existsSync(footerPath)) {
      console.error("❌ Template files not found");
      return res.status(500).json({
        success: false,
        message: "Template files not found",
        paths: { headerPath, footerPath },
      });
    }

    // Load images
    const headerImg = await loadImage(headerPath);
    const footerImg = await loadImage(footerPath);
    const signatureImg = fs.existsSync(signaturePath)
      ? await loadImage(signaturePath)
      : null;
    const stampImg = fs.existsSync(stampPath)
      ? await loadImage(stampPath)
      : null;

    // Create canvas
    const width = 794;
    const height = 1123;

    // Check if multi-page
    const isMultiPage =
      course === "Internship Joining Letter - Paid" ||
      course === "Internship Joining Letter - Unpaid" ||
      course === "Non-Disclosure Agreement" ||
      course === "Onboarding Non-Disclosure Agreement" ||
      course === "Offer Letter" ||
      course === "Live Project Agreement";

    if (isMultiPage) {
      // Multi-page PDF handling
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: [width, height], margin: 0 });

      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      const templateData = {
        name,
        role: role || "",
        trainingPeriod: trainingPeriod || "", // ✅ USE FROM REQUEST, NOT letter
        duration: duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: responsibilities || "",
        amount: amount || "",
        effectiveFrom: formattedEffectiveFrom,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        genderPronoun: genderPronoun || "",
        formattedDate,
        outwardNo,
        credentialId: tempId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };

      console.log("📋 Multi-page template data:", templateData);

      const drawFunction = getDrawingFunction(category, course);

      if (!drawFunction) {
        console.error("❌ No drawing function found for:", {
          category,
          course,
        });
        return res.status(400).json({
          success: false,
          message: `Template not implemented for: ${category} - ${course}`,
        });
      }

      const totalPages =
        course === "Non-Disclosure Agreement"
          ? 4
          : course === "Onboarding Non-Disclosure Agreement"
          ? 4
          : course === "Offer Letter"
          ? 2
          : course === "Live Project Agreement"
          ? 4
          : 2;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        await drawFunction(
          ctx,
          width,
          height,
          templateData,
          headerImg,
          footerImg,
          signatureImg,
          stampImg,
          pageNum
        );

        const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
        doc.image(jpegBuffer, 0, 0, { width, height });

        if (pageNum < totalPages) {
          doc.addPage();
        }
      }

      doc.end();
    } else {
      // ✅ SINGLE PAGE LETTERS (including RFID)
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ✅ COMPLETE template data for ALL single-page letters
      const templateData = {
        name,
        // Appreciation Letter fields
        subject: subject || "",
        month: month || "",
        year: year || "",
        description: description || "",
        // Joining/Experience Letter fields
        role: role || "",
        duration: duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: responsibilities || "",
        amount: amount || "",
        effectiveFrom: formattedEffectiveFrom,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        genderPronoun: genderPronoun || "",
        // Timeline fields
        timelineStage: timelineStage || "",
        timelineProjectName: timelineProjectName || "",
        timelineDueDate: timelineDueDate || "",
        timelineNewDate: timelineNewDate || "",
        // BVOC/FSD specific fields
        committeeType: committeeType || "",
        attendancePercent: attendancePercent || "",
        attendanceMonth: attendanceMonth || "",
        attendanceYear: attendanceYear || "",
        performanceMonth: performanceMonth || "",
        performanceYear: performanceYear || "",
        testingPhase: testingPhase || "",
        uncover: uncover || "",
        subjectName: subjectName || "",
        projectName: projectName || "",
        misconductReason: misconductReason || "",
        auditDate: auditDate || "",
        // Standard fields
        formattedDate,
        outwardNo,
        credentialId: tempId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };

      // Get drawing function
      const drawFunction = getDrawingFunction(category, course);

      if (!drawFunction) {
        console.error("❌ No drawing function found for:", {
          category,
          course,
        });
        return res.status(400).json({
          success: false,
          message: `Template not implemented for: ${category} - ${course}`,
        });
      }

      await drawFunction(
        ctx,
        width,
        height,
        templateData,
        headerImg,
        footerImg,
        signatureImg,
        stampImg
      );

      // Convert to buffer
      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

      res.setHeader("Content-Type", "image/jpeg");
      return res.send(buffer);
    }
  } catch (error) {
    console.error("❌ Preview code letter error:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate preview",
        error: error.message,
      });
    }
  }
};
// =====================================================
// GET ALL CODE LETTERS
// =====================================================
const getCodeLetters = async (req, res) => {
  try {
    const letters = await Letter.find({
      subType: "code-letter",
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: letters });
  } catch (error) {
    console.error("Get code letters error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch code letters" });
  }
};

// =====================================================
// GET CODE LETTER BY ID
// =====================================================
const getCodeLetterById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter;
    if (isObjectId) {
      letter = await Letter.findById(identifier);
    } else {
      letter = await Letter.findOne({ letterId: identifier });
    }

    if (!letter) {
      return res
        .status(404)
        .json({ success: false, message: "Letter not found" });
    }

    res.status(200).json({ success: true, data: letter });
  } catch (error) {
    console.error("Get code letter by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch letter" });
  }
};

// =====================================================
// DOWNLOAD CODE LETTER AS PDF
// =====================================================
// In letter.controller.js - Replace downloadCodeLetterAsPdf function

const downloadCodeLetterAsPdf = async (req, res) => {
  try {
    const identifier = req.params.id;
    let letter;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    if (isObjectId) {
      letter = await Letter.findById(identifier).lean();
    } else {
      letter = await Letter.findOne({ letterId: identifier }).lean();
    }

    if (!letter) {
      return res
        .status(404)
        .json({ success: false, message: "Letter not found" });
    }

    // Fetch user data for address and aadhaar
    const userData = await People.findOne({ name: letter.name }).lean();
 

   

    // Generate outward no if missing
    if (!letter.outwardNo || !letter.outwardSerial) {
      const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(
        letter.issueDate || new Date()
      );
      await Letter.findByIdAndUpdate(letter._id, { outwardNo, outwardSerial });
      letter.outwardNo = outwardNo;
      letter.outwardSerial = outwardSerial;
    }

    // Format dates
    const formattedDate = formatDate(letter.issueDate);
    const formattedTrainingStart = letter.trainingStartDate
      ? formatDate(letter.trainingStartDate)
      : "";
    const formattedTrainingEnd = letter.trainingEndDate
      ? formatDate(letter.trainingEndDate)
      : "";
    const formattedOfficialStart = letter.officialStartDate
      ? formatDate(letter.officialStartDate)
      : "";
    const formattedCompletion = letter.completionDate
      ? formatDate(letter.completionDate)
      : "";
    const formattedEffectiveFrom = letter.effectiveFrom
      ? formatDate(letter.effectiveFrom)
      : "";
    const formattedStartDate = letter.startDate
      ? formatDate(letter.startDate)
      : "";
    const formattedEndDate = letter.endDate ? formatDate(letter.endDate) : "";

    // Get template paths
    const { headerPath, footerPath, signaturePath, stampPath } =
      getTemplatePaths(letter.category);

    const headerImg = await loadImage(headerPath);
    const footerImg = await loadImage(footerPath);
    const signatureImg = fs.existsSync(signaturePath)
      ? await loadImage(signaturePath)
      : null;
    const stampImg = fs.existsSync(stampPath)
      ? await loadImage(stampPath)
      : null;

    // Create canvas
    const width = 794;
    const height = 1123;

    // Check if multi-page
    const isMultiPage =
      letter.course === "Internship Joining Letter - Paid" ||
      letter.course === "Internship Joining Letter - Unpaid" ||
      letter.course === "Non-Disclosure Agreement" ||
      letter.course === "Onboarding Non-Disclosure Agreement" ||
      letter.course === "Offer Letter" ||
      letter.course === "Live Project Agreement";

    const doc = new PDFDocument({ size: [width, height], margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${letter.letterId || "code-letter"}.pdf"`
    );

    doc.pipe(res);

    if (isMultiPage) {
      // Multi-page letters
      const templateData = {
        name: letter.name,
        role: letter.role || "",
        trainingPeriod: letter.trainingPeriod || "", // ✅ ADD THIS

        duration: letter.duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: letter.responsibilities || "",
        amount: letter.amount || "",
        effectiveFrom: formattedEffectiveFrom,
        formattedDate,
        outwardNo: letter.outwardNo,
        credentialId: letter.letterId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };


      const drawFunction = getDrawingFunction(letter.category, letter.course);

      const totalPages =
        letter.course === "Non-Disclosure Agreement"
          ? 4
          : letter.course === "Onboarding Non-Disclosure Agreement"
          ? 4
          : letter.course === "Offer Letter"
          ? 2
          : letter.course === "Live Project Agreement"
          ? 4
          : 2;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        await drawFunction(
          ctx,
          width,
          height,
          templateData,
          headerImg,
          footerImg,
          signatureImg,
          stampImg,
          pageNum
        );

        const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
        doc.image(jpegBuffer, 0, 0, { width, height });

        if (pageNum < totalPages) {
          doc.addPage();
        }
      }
    } else {
      // ✅ SINGLE PAGE LETTERS (including RFID)
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ✅ COMPLETE template data for ALL single-page letters
      const templateData = {
        name: letter.name,
        // Appreciation Letter fields
        subject: letter.subject || "",
        month: letter.month || "",
        year: letter.year || "",
        description: letter.description || "",
        // Joining/Experience Letter fields
        role: letter.role || "",

        duration: letter.duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: letter.responsibilities || "",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        genderPronoun: letter.genderPronoun || "",
        amount: letter.amount || "",
        effectiveFrom: formattedEffectiveFrom,
        // Timeline fields
        timelineStage: letter.timelineStage || "",
        timelineProjectName: letter.timelineProjectName || "",
        timelineDueDate: letter.timelineDueDate || "",
        timelineNewDate: letter.timelineNewDate || "",
        // BVOC/FSD specific fields
        committeeType: letter.committeeType || "",
        attendancePercent: letter.attendancePercent || "",
        attendanceMonth: letter.attendanceMonth || "",
        attendanceYear: letter.attendanceYear || "",
        performanceMonth: letter.performanceMonth || "",
        performanceYear: letter.performanceYear || "",
        testingPhase: letter.testingPhase || "",
        uncover: letter.uncover || "",
        subjectName: letter.subjectName || "",
        projectName: letter.projectName || "",
        misconductReason: letter.misconductReason || "",
        auditDate: letter.auditDate || "",
        // Standard fields
        formattedDate,
        outwardNo: letter.outwardNo,
        credentialId: letter.letterId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };


      const drawFunction = getDrawingFunction(letter.category, letter.course);

      if (drawFunction) {
        await drawFunction(
          ctx,
          width,
          height,
          templateData,
          headerImg,
          footerImg,
          signatureImg,
          stampImg
        );
      }

      const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      doc.image(jpegBuffer, 0, 0, { width, height });
    }

    doc.end();

    // Update download stats
    await Letter.findByIdAndUpdate(letter._id, {
      $inc: { downloadCount: 1 },
      lastDownloaded: new Date(),
      status: "downloaded",
    });
  } catch (error) {
    console.error("Download code letter error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      });
    }
  }
};
export {
  createCodeLetter,
  previewCodeLetter,
  getCodeLetters,
  getCodeLetterById,
  downloadCodeLetterAsPdf,
};
