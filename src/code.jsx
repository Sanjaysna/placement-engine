// 1. WEB APP ENTRY POINT: Serves the Landing Page
function doGet(e) {
  // If the URL has parameters (like when you click 'Solved'), handle that first
  if (e.parameter.row && e.parameter.status) {
    return handleFeedback(e);
  }

  // Otherwise, show the Landing Page
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TCS Placement Engine')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 2. SUBSCRIBER LOGIC: Adds new users
function addUser(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName("Users");
  
  if (!userSheet) {
    userSheet = ss.insertSheet("Users");
    userSheet.appendRow(["Email", "Signup Date"]);
  }
  
  userSheet.appendRow([email, new Date()]);
  return true;
}

// 3. MULTI-USER MAILER: The Heart of the System
function sendDailyPrepEmail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0]; // Assumes first sheet has questions
  const userSheet = ss.getSheetByName("Users");
  
  if (!userSheet) return Logger.log("No Users sheet found.");
  
  const data = sheet.getDataRange().getValues();
  const users = userSheet.getDataRange().getValues();
  
  // ⚠️ UPDATE THIS WITH YOUR ACTUAL DEPLOYED URL
  const webAppUrl = "https://script.google.com/macros/s/AKfycbwBe8AqXEde8tKvA5djs6Rc-a9vg3z2bHoOrVfq-Ft6A7g1iXzCoyIc8nYCXXURVDM5PA/exec"; 
  
  let dsaQuestions = [];
  let aptiQuestions = [];
  let rowsToMark = [];
  let stats = getPerformanceMetrics(data);

  for (let i = 1; i < data.length; i++) {
    let rowTopic = data[i][0] ? data[i][0].toString().toLowerCase().trim() : "";
    let content = data[i][1] ? data[i][1].toString() : "";
    let dateSent = data[i][2] ? data[i][2].toString().trim() : "";

    if (dateSent === "") {
      if (rowTopic.includes("dsa") && dsaQuestions.length < 2) {
        dsaQuestions.push({text: content, row: i + 1});
        rowsToMark.push(i + 1);
      } else if (rowTopic.includes("apt") && aptiQuestions.length < 2) {
        aptiQuestions.push({text: content, row: i + 1});
        rowsToMark.push(i + 1);
      }
    }
    if (dsaQuestions.length === 2 && aptiQuestions.length === 2) break;
  }

  if (dsaQuestions.length > 0 || aptiQuestions.length > 0) {
    const currentDay = Math.floor(stats.totalSent / 4) + 1;
    const subject = `🚀 Day ${currentDay} | Your TCS Prep is Here!`;
    const htmlContent = generateEmailTemplate(dsaQuestions, aptiQuestions, stats, webAppUrl);

    // Broadcast to all users
    for (let j = 1; j < users.length; j++) {
      let recipientEmail = users[j][0];
      if (recipientEmail && recipientEmail.toString().includes("@")) {
        try {
          MailApp.sendEmail({ to: recipientEmail, subject: subject, htmlBody: htmlContent });
        } catch(e) { Logger.log("Failed to send to: " + recipientEmail); }
      }
    }

    // Mark questions as sent
    const today = new Date();
    rowsToMark.forEach(row => { sheet.getRange(row, 3).setValue(today); });
  }
}

// --- HELPERS ---

function generateEmailTemplate(dsa, apt, stats, url) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 25px;">
      <div style="background: #2c3e50; color: white; padding: 15px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">TCS Prep Day ${Math.floor(stats.totalSent/4)+1}</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Global Accuracy: ${stats.accuracy}%</p>
      </div>
      <h3 style="color: #e67e22;">🧠 DSA Questions</h3>
      ${generateQuestionHtml(dsa, url)}
      <h3 style="color: #2980b9;">📈 Aptitude Training</h3>
      ${generateQuestionHtml(apt, url)}
    </div>`;
}

function generateQuestionHtml(questions, url) {
  if (questions.length === 0) return "<p>All caught up!</p>";
  return questions.map((q, index) => `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #eee;">
      <p><b>${index + 1}.</b> ${q.text}</p>
      <a href="${url}?status=solved&row=${q.row}" style="background: #27ae60; color: white; padding: 8px 16px; text-decoration: none; border-radius: 5px; font-size: 12px; display: inline-block;">SOLVED ✅</a>
      <a href="${url}?status=failed&row=${q.row}" style="background: #e74c3c; color: white; padding: 8px 16px; text-decoration: none; border-radius: 5px; font-size: 12px; margin-left: 10px; display: inline-block;">FAILED ❌</a>
    </div>`).join('');
}

function getPerformanceMetrics(data) {
  let solved = 0, totalSent = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] !== "") totalSent++;
    if (data[i][5] === "SOLVED") solved++;
  }
  let accuracy = totalSent > 0 ? ((solved / totalSent) * 100).toFixed(1) : 0;
  return { solved, totalSent, accuracy };
}

function handleFeedback(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  const row = e.parameter.row;
  const status = e.parameter.status;
  sheet.getRange(row, 6).setValue(status.toUpperCase()); 
  return HtmlService.createHtmlOutput("<h2 style='text-align:center; font-family:sans-serif; color:#27ae60; padding-top:50px;'>🚀 Progress Tracked! Keep going.</h2>");
}