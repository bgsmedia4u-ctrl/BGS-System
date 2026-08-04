import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Trash2, Clock, LogOut } from 'lucide-react';
import { read, utils } from 'xlsx';
import { getAllTeachers } from '../data/profileService';
import { logBiometricUpload, upsertBiometricRecords } from '../api/biometricService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ── Shared style helpers (matching AdminPortalPage) ── */
const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-gradient-top, #FCFBE8)',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--text-main)',
  },
  navbar: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    padding: '0 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 66,
    position: 'sticky', top: 0, zIndex: 200,
    borderBottom: '1px solid var(--border)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  brandIcon: {
    width: 40, height: 40, borderRadius: 'var(--radius-md, 12px)',
    background: '#fff', padding: 3, overflow: 'hidden',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: 800, color: 'var(--text-main)' },
  brandSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },
  body: { padding: '32px 28px', maxWidth: 1280, margin: '0 auto' },
  pageTitle: { fontSize: 26, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: 'var(--text-muted)' },
  card: {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl, 24px)',
    padding: 24,
    marginBottom: 20,
    boxShadow: 'var(--shadow-md)',
  },
  logoutBtn: {
    padding: '8px 18px', borderRadius: 'var(--radius-full, 9999px)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: 'var(--bg-surface-hover)', border: '1px solid var(--border)',
    color: 'var(--text-main)', transition: 'all 0.2s',
  },
};

/* ── Time parsing helpers ── */

// Parse time string like "9:00", "09:10", "4:30 PM", "16:30"
function parseTimeStr(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  if (!str || str === '-' || str === '0' || str === '--') return null;

  // Handle AM/PM
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);
  str = str.replace(/\s*(am|pm)\s*/gi, '').trim();

  const parts = str.split(/\s*:\s*/);
  if (parts.length < 2) return null;

  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);

  if (isNaN(h) || isNaN(m)) return null;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Parse Excel decimal time (0.375 = 09:00)
function parseExcelDecimalTime(val) {
  if (typeof val !== 'number') return null;
  if (val > 1) return null; // Not a time fraction
  let totalMinutes = Math.round(val * 24 * 60);
  let h = Math.floor(totalMinutes / 60);
  let m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Smart time parser — handles strings, numbers, combined cells
function smartParseTime(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return parseExcelDecimalTime(val);
  return parseTimeStr(String(val));
}

// Parse a cell that may contain BOTH check-in and check-out (e.g. "9:00\n4:30" or "9:00 / 4:30" or "9:00   4:30")
function parseCombinedTimeCell(val) {
  if (val === null || val === undefined) return { checkIn: null, checkOut: null };
  const str = String(val).trim();
  // Try splitting by newline, slash, pipe, or multiple spaces
  const parts = str.split(/[\n\r]+|\/|\||\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length >= 2) {
    return { checkIn: parseTimeStr(parts[0]), checkOut: parseTimeStr(parts[1]) };
  }
  if (parts.length === 1) {
    return { checkIn: parseTimeStr(parts[0]), checkOut: null };
  }
  return { checkIn: null, checkOut: null };
}

// Convert Excel serial date to JS Date
function excelDateToJSDate(serial) {
  if (typeof serial === 'string') return new Date(serial);
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

// Calculate working hours and late status
function calculateMetrics(checkIn, checkOut) {
  if (!checkIn && !checkOut) return { workingHours: 0, lateMinutes: 0, status: 'Absent' };
  if (!checkIn || !checkOut) return { workingHours: 0, lateMinutes: 0, status: checkIn ? 'Present' : 'Absent' };

  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);

  const inTotalM = inH * 60 + inM;
  let outTotalM = outH * 60 + outM;

  // Handle common case: 4:30 entered instead of 16:30 without PM
  if (outTotalM < inTotalM) {
    if (outH < 12) {
      outTotalM += 12 * 60; // Assume PM
    } else {
      outTotalM += 24 * 60; // Overnight shift
    }
  }

  const diffM = outTotalM - inTotalM;
  const workingHours = parseFloat((diffM / 60).toFixed(2));

  // Late threshold: 9:10 AM
  const lateThreshold = 9 * 60 + 10;
  const lateMinutes = inTotalM > lateThreshold ? (inTotalM - lateThreshold) : 0;

  return {
    workingHours,
    lateMinutes,
    status: lateMinutes > 0 ? 'Late' : 'Present'
  };
}

/* ── COMPONENT ── */
export default function OfficeDashboardPage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { fetchTeachers(); }, []);

  async function fetchTeachers() {
    try {
      const data = await getAllTeachers();
      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers', err);
      toast.error('Failed to load teachers for matching.');
    }
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [teachers]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = utils.sheet_to_json(worksheet, { header: 1, raw: true });

        console.log('=== RAW EXCEL ROWS (first 10) ===');
        rawRows.slice(0, 10).forEach((row, i) => console.log(`Row ${i}:`, row));

        // STEP 1: Find the header row — scan first 20 rows for one that looks like a table header
        let headerIdx = -1;
        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
          const rowArr = (rawRows[i] || []).map(c => String(c || '').toLowerCase().trim());
          const rowText = rowArr.join(' ');

          // Check if this row has multiple non-empty cells AND contains known header keywords
          const nonEmpty = rowArr.filter(c => c.length > 0).length;
          const hasNameLike = rowText.includes('name') || rowText.includes('employee') || rowText.includes('emp');
          const hasTimeLike = rowText.includes('time') || rowText.includes('in') || rowText.includes('out') || rowText.includes('punch');
          const hasDateOrCode = rowText.includes('date') || rowText.includes('code') || rowText.includes('id') || rowText.includes('s.no') || rowText.includes('sl');

          if (nonEmpty >= 2 && (hasNameLike || (hasTimeLike && hasDateOrCode))) {
            headerIdx = i;
            break;
          }
        }

        let mappedData;

        if (headerIdx >= 0) {
          // Standard tabular format with headers
          const headers = rawRows[headerIdx].map(h => String(h || '').trim());
          console.log('=== DETECTED HEADERS at row', headerIdx, '===', headers);

          const dataRows = rawRows.slice(headerIdx + 1).filter(r =>
            r && r.length > 0 && r.some(c => c !== undefined && c !== null && c !== '')
          );

          mappedData = dataRows.map((rowArr, index) => {
            // Build object from headers
            const row = {};
            headers.forEach((h, i) => { if (h) row[h] = rowArr[i]; });

            const keys = Object.keys(row);
            const getCol = (possibleNames) => {
              const key = keys.find(k => possibleNames.some(p => k.toLowerCase().includes(p)));
              return key ? row[key] : null;
            };

            // Extract name
            const rawName = getCol(['name', 'employee', 'emp name', 'staff']) || `Row ${index + 1}`;

            // Extract date
            const rawDate = getCol(['date']);
            let dateStr = new Date().toISOString().split('T')[0];
            if (rawDate) {
              try {
                const dateObj = typeof rawDate === 'number' ? excelDateToJSDate(rawDate) : new Date(rawDate);
                if (!isNaN(dateObj.getTime())) dateStr = dateObj.toISOString().split('T')[0];
              } catch (e) { /* use default */ }
            }

            // Extract check-in & check-out
            let checkIn = null, checkOut = null;

            // Try separate columns first
            const rawIn = getCol(['check in', 'in time', 'time in', 'punch in', 'in']);
            const rawOut = getCol(['check out', 'out time', 'time out', 'punch out', 'out']);

            if (rawIn !== null && rawIn !== undefined) {
              if (typeof rawIn === 'string' && /[\n\r\/\|]|\s{2,}/.test(rawIn)) {
                const combined = parseCombinedTimeCell(rawIn);
                checkIn = combined.checkIn;
                checkOut = combined.checkOut;
              } else {
                checkIn = smartParseTime(rawIn);
              }
            }
            if (rawOut !== null && rawOut !== undefined && !checkOut) {
              checkOut = smartParseTime(rawOut);
            }

            // Try combined time column if separate ones didn't work
            if (!checkIn && !checkOut) {
              const rawTime = getCol(['time', 'punch', 'attendance']);
              if (rawTime) {
                const combined = parseCombinedTimeCell(rawTime);
                checkIn = combined.checkIn;
                checkOut = combined.checkOut;
              }
            }

            return buildRow(rawName, dateStr, checkIn, checkOut, index);
          });
        } else {
          // No header found — assume simple list: Column 0 = Name, Column 1 = Time / Check-in
          console.log('=== NO HEADER FOUND, using positional parsing ===');

          // Filter out metadata rows (Company Name, Location, etc.)
          const dataRows = rawRows.filter(r => {
            if (!r || r.length === 0) return false;
            const firstCell = String(r[0] || '').trim().toLowerCase();
            // Skip metadata-like rows
            if (firstCell.startsWith('company') || firstCell.startsWith('location') ||
                firstCell.startsWith('emp code') || firstCell.startsWith('department') ||
                firstCell.startsWith('report') || firstCell.startsWith('date range') ||
                firstCell === '' || firstCell.startsWith('s.no') || firstCell.startsWith('sl')) return false;
            // Skip rows that are just numbers (serial numbers in col 0 with no name)
            if (r.length === 1 && !isNaN(Number(firstCell))) return false;
            return true;
          });

          mappedData = dataRows.map((rowArr, index) => {
            const name = String(rowArr[0] || `Row ${index + 1}`).trim();

            // Try to find times in remaining columns
            let checkIn = null, checkOut = null;
            const dateStr = new Date().toISOString().split('T')[0];

            // Check each remaining cell for time values
            const timeCells = [];
            for (let ci = 1; ci < rowArr.length; ci++) {
              const cellVal = rowArr[ci];
              if (cellVal === null || cellVal === undefined || String(cellVal).trim() === '') continue;

              // Try combined cell
              const combined = parseCombinedTimeCell(cellVal);
              if (combined.checkIn) timeCells.push(combined.checkIn);
              if (combined.checkOut) timeCells.push(combined.checkOut);

              if (timeCells.length === 0) {
                const parsed = smartParseTime(cellVal);
                if (parsed) timeCells.push(parsed);
              }
            }

            if (timeCells.length >= 2) {
              checkIn = timeCells[0];
              checkOut = timeCells[1];
            } else if (timeCells.length === 1) {
              checkIn = timeCells[0];
            }

            return buildRow(name, dateStr, checkIn, checkOut, index);
          });
        }

        // Filter out obviously empty/junk rows
        mappedData = mappedData.filter(r => r.teacher_name && r.teacher_name.length > 1);

        setParsedData(mappedData);
        toast.success(`Parsed ${mappedData.length} records successfully.`);
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('Failed to parse the Excel file. Check console for details.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  function buildRow(rawName, dateStr, checkIn, checkOut, index) {
    // Fuzzy match teacher
    const nameClean = String(rawName).trim();
    const teacher = teachers.find(t => {
      const tName = (t.name || '').toLowerCase();
      const rName = nameClean.toLowerCase();
      return tName.includes(rName) || rName.includes(tName);
    });

    const metrics = calculateMetrics(checkIn, checkOut);

    return {
      teacher_id: teacher ? teacher.id : null,
      teacher_name: teacher ? teacher.name : nameClean,
      match_status: teacher ? 'Success' : 'Warning',
      date: dateStr,
      check_in: checkIn,
      check_out: checkOut,
      status: metrics.status,
      working_hours: metrics.workingHours,
      late_minutes: metrics.lateMinutes,
    };
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);

    const validRecords = parsedData;
    const errorsCount = 0; // We now import everyone

    try {
      const recordsToInsert = validRecords.map(r => ({
        teacher_id: r.teacher_id,
        staff_name: r.teacher_name, // Store the raw name if unmatched
        date: r.date,
        unique_key: `${r.date}_${r.teacher_id || r.teacher_name}`,
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status,
        working_hours: r.working_hours,
        late_minutes: r.late_minutes
      }));

      if (recordsToInsert.length > 0) {
        await upsertBiometricRecords(recordsToInsert);
      }

      await logBiometricUpload({
        filename: file.name,
        imported_count: validRecords.length,
        error_count: errorsCount,
        status: 'Completed'
      });

      toast.success(`Imported ${validRecords.length} records!`);
      setParsedData([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to import records to database.');
    } finally {
      setIsUploading(false);
    }
  };

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Summary stats
  const totalRows = parsedData.length;
  const matchedRows = parsedData.filter(r => r.match_status === 'Success').length;
  const lateRows = parsedData.filter(r => r.status === 'Late').length;
  const absentRows = parsedData.filter(r => r.status === 'Absent').length;

  return (
    <div style={s.page}>
      {/* ── NAVBAR ── */}
      <nav style={s.navbar}>
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <img src="/Logo-removebg-preview.png" alt="BGS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={s.brandText}>BGS Office Portal</div>
            <div style={s.brandSub}>Biometric Attendance Upload</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{profile?.name || 'Office'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Office Staff</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogOut size={14} /> Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={s.body}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={s.pageTitle}>Biometric Attendance Upload</h1>
          <p style={s.pageSubtitle}>Upload the daily biometric Excel file to import attendance records.</p>
        </div>

        {/* ── UPLOAD ZONE ── */}
        {!file && (
          <div
            style={{
              ...s.card,
              border: isDragging ? '2px dashed var(--accent, #F97316)' : '2px dashed var(--border)',
              background: isDragging ? 'rgba(249,115,22,0.05)' : 'var(--bg-card, #fff)',
              textAlign: 'center',
              padding: '60px 40px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s ease',
              transform: isDragging ? 'scale(1.01)' : 'scale(1)',
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UploadCloud size={40} color="var(--accent, #F97316)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
              Drag & Drop Excel File Here
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
              Supports .xlsx and .xls biometric export formats
            </p>
            <div style={{
              display: 'inline-block', padding: '10px 28px',
              background: 'var(--maroon-900, #731313)', color: '#fff',
              borderRadius: 'var(--radius-full, 9999px)', fontWeight: 600, fontSize: 14,
            }}>
              Browse Files
            </div>
          </div>
        )}

        {/* ── FILE LOADED — PREVIEW ── */}
        {file && (
          <>
            {/* File Info Bar */}
            <div style={{
              ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileSpreadsheet size={24} color="#10B981" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB • {parsedData.length} records parsed
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setFile(null); setParsedData([]); }}
                  disabled={isUploading}
                  style={{
                    padding: '10px 20px', borderRadius: 'var(--radius-md, 12px)', cursor: 'pointer',
                    border: '1px solid var(--border)', background: 'var(--bg-surface-hover)',
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Trash2 size={16} /> Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isUploading}
                  style={{
                    padding: '10px 24px', borderRadius: 'var(--radius-md, 12px)', cursor: 'pointer',
                    border: 'none', background: 'var(--maroon-900, #731313)', color: '#fff',
                    fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                    opacity: isUploading ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(115,19,19,0.25)',
                  }}
                >
                  {isUploading ? (
                    <div style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  {isUploading ? 'Importing...' : 'Import to Database'}
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            {parsedData.length > 0 && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                <StatCard label="Total Records" value={totalRows} color="#3B82F6" />
                <StatCard label="Matched Teachers" value={`${matchedRows}/${totalRows}`} color="#10B981" />
                <StatCard label="Late (After 9:10)" value={lateRows} color="#F59E0B" />
                <StatCard label="Absent" value={absentRows} color="#EF4444" />
              </div>
            )}

            {/* Data Table */}
            <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover, #FAFAFA)', borderBottom: '1px solid var(--border)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Check In</th>
                      <th style={thStyle}>Check Out</th>
                      <th style={thStyle}>Total Hours</th>
                      <th style={thStyle}>Late (min)</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr key={i} style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover, #FAFAFA)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.teacher_name}</td>
                        <td style={tdStyle}>{row.date}</td>
                        <td style={tdStyle}>{row.check_in || '-'}</td>
                        <td style={tdStyle}>{row.check_out || '-'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          {row.working_hours > 0 ? `${row.working_hours}h` : '-'}
                        </td>
                        <td style={tdStyle}>
                          {row.late_minutes > 0 ? (
                            <span style={{ color: '#F59E0B', fontWeight: 600 }}>{row.late_minutes} min</span>
                          ) : '-'}
                        </td>
                        <td style={tdStyle}>
                          <span style={
                            row.status === 'Present' ? badgeStyle('#10B981', 'rgba(16,185,129,0.1)') :
                            row.status === 'Late' ? badgeStyle('#F59E0B', 'rgba(245,158,11,0.1)') :
                            badgeStyle('#EF4444', 'rgba(239,68,68,0.1)')
                          }>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {parsedData.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                          No records parsed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Small helper components ── */
function StatCard({ label, value, color }) {
  return (
    <div style={{
      flex: '1 1 160px', minWidth: 160, background: 'var(--bg-card, #fff)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 16px)',
      padding: '20px 18px', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Style constants ── */
const thStyle = {
  padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px', color: 'var(--text-main)', whiteSpace: 'nowrap',
};

function badgeStyle(color, bg) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    color, background: bg,
  };
}
