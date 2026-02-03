/**
 * GLOBAL CONFIGURATION
 */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwBe8AqXEde8tKvA5djs6Rc-a9vg3z2bHoOrVfq-Ft6A7g1iXzCoyIc8nYCXXURVDM5PA/exec";
const QUESTIONS_PER_EMAIL = 4;

function doGet(e) {
  // If e or parameter is undefined (manual run in editor), serve landing page
  if (!e || !e.parameter) {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('TCS Placement Engine')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Handle Solved/Failed button clicks from email
  if (e.parameter.row && e.parameter.status) {
    return handleFeedback(e);
  }

  // Otherwise, serve the Landing Page
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TCS Placement Engine')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function addUser(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(["Email", "Signup Date"]);
  }
  
  userSheet.appendRow([email, new Date()]);
  return true;
}

function sendDailyPrepEmail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const qSheet = ss.getSheets()[0]; 
  const userSheet = ss.getSheetByName("Users");
  
  if (!userSheet) return Logger.log("Error: 'Users' sheet not found.");
  
  const qData = qSheet.getDataRange().getValues();
  const users = userSheet.getDataRange().getValues();
  
  let dsaQuestions = [];
  let aptiQuestions = [];
  let rowsToMark = [];
  let stats = getPerformanceMetrics(qData);

  // Filter for 2 DSA and 2 Aptitude questions not yet sent
  for (let i = 1; i < qData.length; i++) {
    let topic = qData[i][0] ? qData[i][0].toString().toLowerCase() : "";
    let content = qData[i][1] ? qData[i][1].toString() : "";
    let dateSent = qData[i][2] ? qData[i][2].toString().trim() : "";

    if (dateSent === "") {
      if (topic.includes("dsa") && dsaQuestions.length < 2) {
        dsaQuestions.push({text: content, row: i + 1});
        rowsToMark.push(i + 1);
      } else if (topic.includes("apt") && aptiQuestions.length < 2) {
        aptiQuestions.push({text: content, row: i + 1});
        rowsToMark.push(i + 1);
      }
    }
    if (dsaQuestions.length === 2 && aptiQuestions.length === 2) break;
  }

  if (dsaQuestions.length > 0 || aptiQuestions.length > 0) {
    const currentDay = Math.floor(stats.totalSent / QUESTIONS_PER_EMAIL) + 1;
    const subject = `🚀 Day ${currentDay} | Placement Prep Accuracy: ${stats.accuracy}%`;
    const htmlBody = generateEmailTemplate(dsaQuestions, aptiQuestions, stats, currentDay);

    // Broadcast to all subscribers
    users.slice(1).forEach(row => {
      if (row[0] && row[0].includes("@")) {
        try {
          MailApp.sendEmail({ to: row[0], subject: subject, htmlBody: htmlBody });
        } catch(err) { Logger.log("Skip invalid email: " + row[0]); }
      }
    });

    // Update 'Date Sent' in Column C
    const now = new Date();
    rowsToMark.forEach(rowIdx => qSheet.getRange(rowIdx, 3).setValue(now));
  }
}

/**
 * NEW: CYBER-DASHBOARD TEMPLATE
 * Optimized for email client compatibility
 */
function generateEmailTemplate(dsa, apt, stats, day) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#0D0D0D; font-family:'Segoe UI', Tahoma, sans-serif; color:#FAFAFA;">
      <div style="max-width:600px; margin:auto; padding:40px 20px;">
        
        <table cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
          <tr>
            <td style="background-color:#1A1A1A; border:1px solid #2A2A2A; border-left:4px solid #FFD60A; padding:8px 16px; border-radius:4px;">
              <span style="color:#FFD60A; font-weight:bold; font-size:12px; text-transform:uppercase; letter-spacing:1px;">🚀 Day ${day} | Placement Engine</span>
            </td>
          </tr>
        </table>

        <h1 style="font-size:48px; margin:0 0 32px 0; color:#FFFFFF; letter-spacing:-2px; line-height:1;">TCS Prep: Day ${day}</h1>

        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:48px;">
          <tr>
            <td width="50%" style="padding-right:10px;">
              <div style="background:#1A1A1A; border:1px solid #2A2A2A; padding:20px; border-radius:16px;">
                <div style="font-size:11px; color:#606060; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Global Accuracy</div>
                <div style="font-size:36px; font-weight:bold; color:#FFD60A; line-height:1;">${stats.accuracy}%</div>
              </div>
            </td>
            <td width="50%" style="padding-left:10px;">
              <div style="background:#1A1A1A; border:1px solid #2A2A2A; padding:20px; border-radius:16px;">
                <div style="font-size:11px; color:#606060; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Solved Today</div>
                <div style="font-size:36px; font-weight:bold; color:#00FFA3; line-height:1;">${stats.solved}</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="border-left:4px solid #FFD60A; padding-left:16px; margin-bottom:24px;">
          <h2 style="font-size:24px; margin:0; color:#FAFAFA; text-transform:uppercase; letter-spacing:1px;">🧠 DSA Challenges</h2>
        </div>
        ${renderQuestions(dsa)}

        <div style="border-left:4px solid #00FFA3; padding-left:16px; margin-top:40px; margin-bottom:24px;">
          <h2 style="font-size:24px; margin:0; color:#FAFAFA; text-transform:uppercase; letter-spacing:1px;">📊 Aptitude Training</h2>
        </div>
        ${renderQuestions(apt)}

        <div style="text-align:center; margin-top:48px; padding-top:20px; border-top:1px solid #2A2A2A; color:#606060; font-size:11px; text-transform:uppercase; letter-spacing:1px;">
          System Status: Operational • Tracked via ${WEB_APP_URL}
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderQuestions(qs) {
  if (qs.length === 0) return '<p style="color:#606060; font-style:italic;">All challenges completed in this category.</p>';
  return qs.map((q, idx) => `
    <div style="background:#1A1A1A; border:1px solid #2A2A2A; border-radius:20px; padding:32px; margin-bottom:20px;">
      <div style="margin-bottom:16px;">
        <span style="background-color:#FFD60A; color:#0D0D0D; padding:4px 10px; border-radius:6px; font-weight:900; font-size:14px;">${idx + 1}</span>
      </div>
      <p style="font-size:18px; line-height:1.6; color:#FAFAFA; margin-bottom:24px; font-weight:500;">${q.text}</p>
      <table cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <a href="${WEB_APP_URL}?status=solved&row=${q.row}" style="background-color:#FFD60A; color:#0D0D0D; padding:14px 28px; text-decoration:none; border-radius:10px; font-weight:bold; font-size:14px; display:inline-block; margin-right:12px;">SOLVED ✓</a>
          </td>
          <td>
            <a href="${WEB_APP_URL}?status=failed&row=${q.row}" style="background-color:#2A2A2A; color:#FAFAFA; padding:14px 28px; text-decoration:none; border-radius:10px; font-weight:bold; font-size:14px; display:inline-block;">FAILED ✕</a>
          </td>
        </tr>
      </table>
    </div>`).join('');
}

function getPerformanceMetrics(data) {
  let solved = 0, totalSent = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] !== "") totalSent++;
    if (data[i][5] === "SOLVED") solved++;
  }
  return { 
    solved: solved, 
    totalSent: totalSent, 
    accuracy: totalSent > 0 ? ((solved / totalSent) * 100).toFixed(1) : 0 
  };
}

function handleFeedback(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  sheet.getRange(e.parameter.row, 6).setValue(e.parameter.status.toUpperCase());
  return HtmlService.createHtmlOutput("<div style='text-align:center; padding-top:50px; font-family:sans-serif;'><h2>🚀 Progress Tracked!</h2><p>Your dashboard accuracy has been updated.</p></div>");
}