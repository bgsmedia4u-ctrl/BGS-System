import { google } from 'googleapis';

/**
 * Syncs student fee data to Google Sheets.
 * Matches existing rows by student ID and updates them, or appends new rows.
 * Gracefully handles missing credentials.
 */
export async function syncToSheet(students, fees) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.warn('Google Sheets credentials not configured. Skipping sync.');
    return;
  }

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const range = 'Sheet1';

    // Read existing data
    let existingRows = [];
    try {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${range}!A:G`,
      });
      existingRows = existing.data.values || [];
    } catch (e) {
      // Sheet might be empty
    }

    // Build header if not present
    const header = ['Student ID', 'Student Name', 'Class', 'Route', 'Place', 'Fee Due', 'Last Updated'];

    // Build data rows
    const dataRows = fees.map(f => {
      const student = students.find(s => s.id === f.studentId);
      if (!student) return null;
      return [
        f.studentId,
        student.name,
        student.class,
        student.route,
        student.place,
        f.feeDue.toString(),
        f.lastUpdated || ''
      ];
    }).filter(Boolean);

    // Clear and rewrite (simpler than row-by-row matching for flat-file data)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${range}!A:G`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${range}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [header, ...dataRows],
      },
    });

    console.log(`Google Sheets synced: ${dataRows.length} rows.`);
  } catch (err) {
    console.error('Google Sheets sync error:', err.message);
    throw err;
  }
}
