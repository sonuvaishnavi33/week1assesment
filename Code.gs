/**
 * Backend for the ML Concepts Assessment.
 * Deploy this as a Web App (Extensions > Apps Script, in a Google Sheet).
 * See README.md for full setup steps.
 *
 * What it does:
 *  1. Receives a JSON submission from the assessment page (student info + answers + proctoring log).
 *  2. Grades it server-side against the answer key below (the key never reaches the browser).
 *  3. Appends one row per submission to the "Submissions" sheet.
 *  4. Blocks a second submission from the same USN.
 *  5. Returns only the score summary to the browser — never the correct answers.
 */

// ---------- ANSWER KEY (edit here if you change the questions) ----------

const MCQ_KEY = {
  q1: "b", q2: "a", q3: "a", q4: "a", q5: "b", q6: "b", q7: "b", q8: "b",
  q9: "b", q10: "b", q11: "b", q12: "a", q13: "b", q14: "b", q15: "b",
  q16: "b", q17: "a", q18: "b", q19: "b", q20: "b"
};

// Coding questions: [expected value, tolerance]
const CODING_KEY = {
  c1: [72.96, 0.5],
  c2: [0.20, 0.05],
  c3: [12.72, 1.0],
  c4: [139.82, 2.0],
  c5: [64, 3],
  c6: [53.85, 1.0],
  c7: [13276.69, 200],
  c8: [96.30, 1.0],
  c9: [95.80, 1.5],
  c10: [96.50, 1.5]
};

const MCQ_POINTS = 2;     // points per MCQ question
const CODING_POINTS = 6;  // points per coding question
// Max score = 20*2 + 10*6 = 100

// --------------------------------------------------------------------

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Submissions")
              || createSubmissionsSheet();

  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Invalid submission format." });
  }

  const usn = (data.usn || "").trim().toUpperCase();
  if (!usn) return jsonResponse({ ok: false, error: "USN is required." });

  // Block duplicate submissions by USN
  const existing = sheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (String(existing[i][2]).trim().toUpperCase() === usn) {
      return jsonResponse({ ok: false, error: "A submission already exists for this USN." });
    }
  }

  // Grade MCQs
  let mcqScore = 0, mcqCorrect = 0;
  const mcqAnswers = data.mcq || {};
  Object.keys(MCQ_KEY).forEach(function (qid) {
    if (mcqAnswers[qid] && mcqAnswers[qid] === MCQ_KEY[qid]) {
      mcqScore += MCQ_POINTS;
      mcqCorrect += 1;
    }
  });

  // Grade coding questions
  let codingScore = 0, codingCorrect = 0;
  const codingAnswers = data.coding || {};
  Object.keys(CODING_KEY).forEach(function (qid) {
    const raw = codingAnswers[qid];
    const val = parseFloat(raw);
    const expected = CODING_KEY[qid][0];
    const tol = CODING_KEY[qid][1];
    if (!isNaN(val) && Math.abs(val - expected) <= tol) {
      codingScore += CODING_POINTS;
      codingCorrect += 1;
    }
  });

  const totalScore = mcqScore + codingScore;
  const maxScore = Object.keys(MCQ_KEY).length * MCQ_POINTS + Object.keys(CODING_KEY).length * CODING_POINTS;

  sheet.appendRow([
    new Date(),                       // Timestamp
    data.name || "",                  // Name
    usn,                              // USN
    data.email || "",                 // Email
    data.startTime || "",             // Start time (client)
    data.endTime || "",               // End time (client)
    data.durationSeconds || "",       // Duration (s)
    data.tabSwitches || 0,            // Tab switch count
    data.fullscreenExits || 0,        // Fullscreen exit count
    mcqCorrect + " / " + Object.keys(MCQ_KEY).length,
    codingCorrect + " / " + Object.keys(CODING_KEY).length,
    totalScore + " / " + maxScore,
    JSON.stringify(mcqAnswers),       // Raw MCQ answers
    JSON.stringify(codingAnswers)     // Raw coding answers
  ]);

  return jsonResponse({
    ok: true,
    mcqCorrect: mcqCorrect,
    mcqTotal: Object.keys(MCQ_KEY).length,
    codingCorrect: codingCorrect,
    codingTotal: Object.keys(CODING_KEY).length,
    totalScore: totalScore,
    maxScore: maxScore
  });
}

function createSubmissionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet("Submissions");
  sheet.appendRow([
    "Timestamp", "Name", "USN", "Email", "Start Time", "End Time",
    "Duration (s)", "Tab Switches", "Fullscreen Exits",
    "MCQ Score", "Coding Score", "Total Score", "MCQ Answers (raw)", "Coding Answers (raw)"
  ]);
  sheet.setFrozenRows(1);
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Allow a simple GET for a health check when you open the Web App URL directly.
function doGet(e) {
  return jsonResponse({ ok: true, message: "Assessment backend is live." });
}
