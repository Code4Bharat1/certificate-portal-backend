import { rgb, StandardFonts } from "pdf-lib";

// Convert performanceMonth to short form (e.g., "Jan", "Feb", etc.)
const monthMap = {
    January: "Jan",
    February: "Feb",
    March: "Mar",
    April: "Apr",
    May: "May",
    June: "Jun",
    July: "Jul",
    August: "Aug",
    September: "Sept",
    October: "Oct",
    November: "Nov",
    December: "Dec"
};

/* Helper for PDF text wrapping */
function wrapPdfText(text, maxWidth, font, size) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (let word of words) {
    const test = line + word + " ";
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(line.trim());
      line = word + " ";
    } else line = test;
  }
  if (line) lines.push(line.trim());
  return lines;
}

const getFSDTemplateCode = async (
    ctx,
    width,
    height,
    issueDate,
    course,
    name,
    outwardNo,
    formattedDate,
    tempId,
    description,
    subject,
    role,
    startDate,
    endDate,
    committeeType,
    attendancePercent,
    assignmentName,
    misconductReason,
    attendanceMonth,
    attendanceYear,
    performanceMonth,
    performanceYear,
    testingPhase,
    uncover,
    subjectName,
    projectName,
    auditDate
) => {

    // FSD
    if (course === "Appreciation for Best Attendance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.195, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.236);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.045, height * 0.300);

        const attendanceDate = attendanceMonth + " " + attendanceYear;

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendanceDate, width * 0.45, height * 0.338);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.095, height * 0.372);

        // const shortMonth = monthMap[performanceMonth] || performanceMonth; // fallback if custom
        // const attendanceDate = attendanceMonth + " " + attendanceYear;

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendanceDate, width * 0.316, height * 0.422);

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.26, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.843
        );
    }
    else if (course === "Appreciation for Outstanding Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.178, height * 0.230);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.090, height * 0.2526);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.033, height * 0.325);

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.59, height * 0.370);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.087, height * 0.409);

        const shortMonth = monthMap[performanceMonth] || performanceMonth; // fallback if custom
        const performanceDate = `${shortMonth} ${performanceYear}`;

        // console.log(performanceDate);

        ctx.font = 'bold 28px "Poppins"';
        ctx.fillText(performanceDate, width * 0.566, height * 0.465);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.18, height * 0.787);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.845
        );
    }
    else if (course === "Appreciation for Consistent Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.229);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.245);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.080, height * 0.383);

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.19, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.843
        );
    }
    else if (course === "Internship Experience Certificate") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.185, height * 0.222);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.240);

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.49, height * 0.280);

        // === MAIN DESCRIPTION ===
        const descLines = [
            { text: "This is to certify that ", bold: false },
            { text: name, bold: true },
            { text: " was associated with ", bold: false },
            { text: "Nexcore Alliance LLP", bold: true },
            { text: " under its brand ", bold: false },
            { text: "Code4Bharat", bold: true },
            { text: " as a", bold: false },
            { text: ` ${role} from ${startDate} to ${endDate}.`, bold: true },
        ];

        const descY = height * 0.35;
        const startX = width * 0.041;
        const maxWidth = width * 0.90;
        let currentX = startX;
        let currentY = descY;

        const lineHeight = 32;

        // Draw mixed-style line wrapping
        descLines.forEach((part, idx) => {
            const words = part.text.split(" ");
            for (let i = 0; i < words.length; i++) {
                const word = words[i] + " ";
                ctx.font = `${part.bold ? "bold" : "normal"} 25px "Poppins"`;
                const wordWidth = ctx.measureText(word).width;

                if (currentX + wordWidth > startX + maxWidth) {
                    // wrap line
                    currentX = startX;
                    currentY += lineHeight;
                }

                ctx.fillText(word, currentX, currentY);
                currentX += wordWidth;
            }
        });

        // === DESCRIPTION PARAGRAPHS ===
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Poppins"';

        const paragraphs = (description || "")
            .split(/\n\s*\n/)
            .map(p => p.replace(/\n/g, " ").trim())
            .filter(p => p.length > 0)
            .slice(0, 2);

        let descParagraphY = currentY + 40; // Start after the first section
        const paraLineHeight = 30;
        const paraSpacing = 30;

        paragraphs.forEach((paragraph, idx) => {
            const words = paragraph.split(" ");
            let line = "";

            words.forEach(word => {
                const testLine = line + word + " ";
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > maxWidth) {
                    ctx.fillText(line.trim(), startX, descParagraphY);
                    line = word + " ";
                    descParagraphY += paraLineHeight;
                } else {
                    line = testLine;
                }
            });

            if (line.trim()) {
                ctx.fillText(line.trim(), startX, descParagraphY);
                descParagraphY += paraLineHeight;
            }

            if (idx < paragraphs.length - 1) {
                descParagraphY += paraSpacing;
            }
        });

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.20, height * 0.780);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.850
        );
    }
    else if (course === "Live Project Agreement") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.236);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.290);

        // Subject / Title
        // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.43, height * 0.338);

        // Description (from frontend)
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Georgia", "Garamond", "Times New Roman", serif';
        wrapText(ctx, description, width * 0.13, height * 0.40, width * 0.80, 60);

        // ✅ Add dynamic frontend field values (below description)
        let yDynamic = height * 0.423;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillStyle = "#222";
        dynamicLines.forEach((line) => {
            wrapText(ctx, line, width * 0.30, yDynamic, width * 0.8, 55);
            yDynamic += 60;
        });

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.25, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.843
        );
    }
    else if (course === "Non-Disclosure Agreement") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.236);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.290);

        // Subject / Title
        // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.43, height * 0.338);

        // Description (from frontend)
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Georgia", "Garamond", "Times New Roman", serif';
        wrapText(ctx, description, width * 0.13, height * 0.40, width * 0.80, 60);

        // ✅ Add dynamic frontend field values (below description)
        let yDynamic = height * 0.423;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillStyle = "#222";
        dynamicLines.forEach((line) => {
            wrapText(ctx, line, width * 0.30, yDynamic, width * 0.8, 55);
            yDynamic += 60;
        });

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.25, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.843
        );
    }
    else if (course === "Offer Letter") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.236);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.290);

        // Subject / Title
        // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.43, height * 0.338);

        // Description (from frontend)
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Georgia", "Garamond", "Times New Roman", serif';
        wrapText(ctx, description, width * 0.13, height * 0.40, width * 0.80, 60);

        // ✅ Add dynamic frontend field values (below description)
        let yDynamic = height * 0.423;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillStyle = "#222";
        dynamicLines.forEach((line) => {
            wrapText(ctx, line, width * 0.30, yDynamic, width * 0.8, 55);
            yDynamic += 60;
        });

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.25, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.843
        );
    }
    else if (course === "Warning for Incomplete Assignment/Project Submissions") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 22px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.202, height * 0.221);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 22px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.113, height * 0.238);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.060, height * 0.302);

        // Dear name,
        ctx.font = 'bold 22px "Poppins"';
        ctx.fillText(name + ",", width * 0.110, height * 0.380);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(subjectName, width * 0.110, height * 0.433);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(projectName, width * 0.310, height * 0.433);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.23, height * 0.708);

        // Footer
        ctx.font = '25px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.860
        );
    }
    else if (course === "Warning for Low Attendance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.186, height * 0.225);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.242);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.040, height * 0.310);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.383);

        // Desc percentage
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendancePercent, width * 0.532, height * 0.420);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.18, height * 0.706);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.855
        );
    }
    else if (course === "Warning for Misconduct or Disrespectful Behavior") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.209, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.115, height * 0.236);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.060, height * 0.299);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.110, height * 0.362);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(misconductReason, width * 0.060, height * 0.450);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.23, height * 0.678);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.843
        );
    }
    else if (course === "Warning for Unauthorized Absence from Training Sessions") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.195, height * 0.220);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.234);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.047, height * 0.295);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.358);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.22, height * 0.702);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.851
        );
    }
    else if (course === "Warning Regarding Punctuality and Professional Discipline") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.169, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.080, height * 0.372);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.16, height * 0.730);

        // Footer
        ctx.font = '30px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.865
        );
    }
    else if (course === "Concern Letter-Audit Interview Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.201, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.105, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.053, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.375);

        // console.log(auditDate);

        const auditFormattedDate = new Date(issueDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });


        // console.log(auditFormattedDate);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(auditFormattedDate, width * 0.743, height * 0.408);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.19, height * 0.707);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.857
        );
    }
}

const getBVOCTemplateCode = async (
    ctx,
    width,
    height,
    issueDate,
    course,
    name,
    outwardNo,
    formattedDate,
    tempId,
    description,
    subject,
    role,
    startDate,
    endDate,
    committeeType,
    attendancePercent,
    assignmentName,
    misconductReason,
    attendanceMonth,
    attendanceYear,
    performanceMonth,
    performanceYear,
    testingPhase,
    uncover,
    subjectName,
    projectName,
    auditDate
) => {

    // BVOC
    if (course === "Appreciation for Best Attendance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.210, height * 0.237);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.257);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.048, height * 0.308);

        const attendanceDate = attendanceMonth + " " + attendanceYear;

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendanceDate, width * 0.45, height * 0.393);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.426);

        // const shortMonth = monthMap[performanceMonth] || performanceMonth; // fallback if custom
        // const attendanceDate = attendanceMonth + " " + attendanceYear;

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendanceDate, width * 0.313, height * 0.477);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.21, height * 0.760);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.850
        );
    }
    else if (course === "Appreciation for Detecting Errors And Debugging") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.205, height * 0.228);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.120, height * 0.246);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.059, height * 0.320);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.115, height * 0.403);

        // testing phase
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(testingPhase, width * 0.570, height * 0.462);

        // uncover
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(uncover, width * 0.655, height * 0.482);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.21, height * 0.743);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.850
        );
    }
    else if (course === "Appreciation for Outstanding Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.190, height * 0.237);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.257);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.040, height * 0.309);

        const fullPerformanceDate = `${performanceMonth} ${performanceYear}`;

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(fullPerformanceDate, width * 0.53, height * 0.375);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.090, height * 0.408);

        const shortMonth = monthMap[performanceMonth] || performanceMonth; // fallback if custom
        const performanceDate = `${shortMonth} ${performanceYear}`;

        // console.log(performanceDate);

        ctx.font = 'bold 28px "Poppins"';
        ctx.fillText(performanceDate, width * 0.330, height * 0.458);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.19, height * 0.762);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.850
        );
    }
    else if (course === "Appreciation for Consistent Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.210, height * 0.225);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.130, height * 0.243);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.070, height * 0.300);

        // Subject name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.570, height * 0.380);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.125, height * 0.419);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.22, height * 0.786);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.850
        );
    }
    else if (course === "Committee Member") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.180, height * 0.227);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.100, height * 0.245);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.035, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.097, height * 0.424);

        // Desc Committe type
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(committeeType, width * 0.81, height * 0.483);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.20, height * 0.772);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.850
        );
    }
    else if (course === "Committee President") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.175, height * 0.227);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.085, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.020, height * 0.295);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.080, height * 0.415);

        // Desc Committe type
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(committeeType, width * 0.82, height * 0.473);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.19, height * 0.783);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.855
        );
    }
    else if (course === "Committee Vice-President") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.180, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.100, height * 0.243);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.035, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.097, height * 0.421);

        // Desc Committe type
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(committeeType, width * 0.88, height * 0.480);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.17, height * 0.805);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.855
        );
    }
    else if (course === "Concern Letter-Audit Interview Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.214, height * 0.217);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.115, height * 0.232);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.065, height * 0.280);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.113, height * 0.376);

        // console.log(auditDate);

        const auditFormattedDate = new Date(auditDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });


        // console.log(auditFormattedDate);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 20px "Poppins"`;
        ctx.fillText(auditFormattedDate, width * 0.735, height * 0.410);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.21, height * 0.729);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.865
        );
    }
    else if (course === "Warning for Incomplete Assignment/Project Submissions") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 22px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.170, height * 0.224);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 22px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.105, height * 0.238);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.050, height * 0.288);

        // Dear name,
        ctx.font = 'bold 22px "Poppins"';
        ctx.fillText(name + ",", width * 0.100, height * 0.390);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(subjectName, width * 0.050, height * 0.440);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(projectName, width * 0.300, height * 0.440);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.20, height * 0.710);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.855
        );
    }
    else if (course === "Warning for Low Attendance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.180, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.090, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.028, height * 0.315);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.085, height * 0.398);

        // Desc percentage
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendancePercent, width * 0.570, height * 0.436);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.18, height * 0.683);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.855
        );
    }
    else if (course === "Warning for Misconduct or Disrespectful Behavior") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.212, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.120, height * 0.238);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.068, height * 0.287);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.125, height * 0.389);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(misconductReason, width * 0.065, height * 0.475);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.23, height * 0.717);

        // Footer
        ctx.font = '33px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.858
        );
    }
    else if (course === "Warning for Punctuality and Discipline") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.169, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.310);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.080, height * 0.384);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.18, height * 0.675);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.865
        );
    }
    else if (course === "Warning for Unauthorized Absence from Sessions") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.198, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.103, height * 0.237);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.047, height * 0.288);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.389);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.20, height * 0.709);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
            "https://portal.nexcorealliance.com/verify-certificate",
            width / 2,
            height * 0.851
        );
    }
}

/**
 * Draw dynamic PDF templates based on course type
 */
const drawPdfTemplate = async (
  pdfDoc,
  course,
  {
    name,
    outwardNo,
    formattedDate,
    tempId,
    description,
    subject,
    startDate,
    endDate,
  }
) => {
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const secondPage = pages[1];
  const { width, height } = firstPage.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const darkColor = rgb(0.067, 0.094, 0.152);
  const verifyText = "https://portal.nexcorealliance.com/verify-certificate";

  /* ============================================================
     🎓 OFFER LETTER (2 Pages)
  ============================================================ */
  if (course === "Offer Letter") {
    firstPage.drawText(`${outwardNo}`, {
      x: width * 0.25,
      y: height * 0.768,
      size: 12,
      font: helveticaBold,
      color: darkColor,
    });

    firstPage.drawText(`${formattedDate}`, {
      x: width * 0.13,
      y: height * 0.745,
      size: 12,
      font: helvetica,
      color: darkColor,
    });

    firstPage.drawText(`${name}`, {
      x: width * 0.072,
      y: height * 0.69,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${name},`, {
      x: width * 0.13,
      y: height * 0.64,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    secondPage.drawText(`${startDate}`, {
      x: width * 0.10,
      y: height * 0.85,
      size: 14,
      font: helvetica,
      color: darkColor,
    });

    secondPage.drawText(`${endDate}`, {
      x: width * 0.10,
      y: height * 0.80,
      size: 14,
      font: helvetica,
      color: darkColor,
    });

    secondPage.drawText(`${tempId}`, {
      x: width * 0.10,
      y: height * 0.75,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    secondPage.drawText(
      `I, ${name}, accept the terms and conditions stated in this Internship cum Training Offer Letter.`,
      {
        x: width * 0.10,
        y: height * 0.65,
        size: 13,
        font: helvetica,
        color: rgb(0, 0, 0),
      }
    );

    secondPage.drawText(`${verifyText}`, {
      x: width * 0.10,
      y: height * 0.60,
      size: 12,
      font: helvetica,
      color: darkColor,
    });
  }

  /* ============================================================
     🚀 LIVE PROJECT AGREEMENT
  ============================================================ */
  else if (course === "Live Project Agreement") {
    const page = firstPage;
    page.drawText(`This Live Project Agreement is entered into by:`, {
      x: width * 0.10,
      y: height * 0.85,
      size: 14,
      font: helvetica,
      color: darkColor,
    });

    page.drawText(`${name}`, {
      x: width * 0.10,
      y: height * 0.80,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Start Date: ${startDate}`, {
      x: width * 0.10,
      y: height * 0.75,
      size: 14,
      font: helvetica,
      color: darkColor,
    });

    page.drawText(`End Date: ${endDate}`, {
      x: width * 0.10,
      y: height * 0.70,
      size: 14,
      font: helvetica,
      color: darkColor,
    });

    page.drawText(`Letter ID: ${tempId}`, {
      x: width * 0.10,
      y: height * 0.65,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Verify at: ${verifyText}`, {
      x: width * 0.10,
      y: height * 0.60,
      size: 12,
      font: helvetica,
      color: darkColor,
    });
  }

  /* ============================================================
     🔒 NON-DISCLOSURE AGREEMENT
  ============================================================ */
  else if (course === "Non-Disclosure Agreement") {
    const page = firstPage;
    page.drawText(`Non-Disclosure Agreement (NDA)`, {
      x: width * 0.30,
      y: height * 0.90,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`This agreement is made on ${formattedDate}`, {
      x: width * 0.10,
      y: height * 0.83,
      size: 14,
      font: helvetica,
      color: darkColor,
    });

    page.drawText(
      `${name} agrees to maintain confidentiality regarding all materials, data, and intellectual property shared during the engagement.`,
      {
        x: width * 0.10,
        y: height * 0.75,
        size: 13,
        font: helvetica,
        color: rgb(0, 0, 0),
      }
    );

    page.drawText(`Letter ID: ${tempId}`, {
      x: width * 0.10,
      y: height * 0.68,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Verify at: ${verifyText}`, {
      x: width * 0.10,
      y: height * 0.63,
      size: 12,
      font: helvetica,
      color: darkColor,
    });
  }

  /* ============================================================
     🧾 DEFAULT TEMPLATE (fallback)
  ============================================================ */
  else {
    const page = firstPage;
    page.drawText(outwardNo, {
      x: width * 0.085,
      y: height * 0.65,
      size: 15,
      font: helveticaBold,
      color: darkColor,
    });

    page.drawText(formattedDate, {
      x: width * 0.083,
      y: height * 0.90,
      size: 15,
      font: helvetica,
      color: darkColor,
    });

    const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
    page.drawText(subjectText, {
      x: width * 0.32,
      y: height * 0.75,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const wrapPdfText = (text, maxWidth, font, size) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";
      const testFont = font;
      words.forEach((word) => {
        const testLine = currentLine + word + " ";
        const width = testFont.widthOfTextAtSize(testLine, size);
        if (width > maxWidth && currentLine) {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine.trim());
      return lines;
    };

    const descLines = wrapPdfText(description, width * 0.8, helvetica, 14);
    let y = height * 0.63;
    descLines.forEach((line) => {
      page.drawText(line, {
        x: width * 0.13,
        y,
        size: 14,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 18;
    });

    page.drawText(tempId, {
      x: width * 0.33,
      y: height * 0.25,
      size: 15,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(verifyText, {
      x: width * 0.2,
      y: height * 0.17,
      size: 12,
      font: helvetica,
      color: rgb(0.12, 0.16, 0.22),
    });
  }

  return pdfDoc;
};


export default {
    getFSDTemplateCode,
    getBVOCTemplateCode,
    drawPdfTemplate,
}
