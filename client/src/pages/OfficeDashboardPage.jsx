import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Trash2 } from 'lucide-react';
import { read, utils } from 'xlsx';
import { getAllTeachers } from '../data/profileService';
import { logBiometricUpload, upsertBiometricRecords } from '../api/biometricService';
import toast from 'react-hot-toast';

function excelDateToJSDate(serial) {
  if (typeof serial === 'string') return new Date(serial);
  const utc_days = Math.floor(serial - 25569);
  const date_info = new Date(utc_days * 86400 * 1000);
  return date_info;
}

function parseExcelTime(val) {
  if (typeof val === 'string') return val;
  if (!val && val !== 0) return null;
  let totalSeconds = Math.round(val * 24 * 60 * 60);
  let hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateMetrics(checkIn, checkOut) {
  if (!checkIn && !checkOut) return { workingHours: 0, lateMinutes: 0, status: 'Absent' };
  if (!checkIn || !checkOut) return { workingHours: 0, lateMinutes: 0, status: 'Present' }; // If one is missing, consider present but incomplete

  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  
  const inTotalM = inH * 60 + inM;
  const outTotalM = outH * 60 + outM;
  
  const workingHours = ((outTotalM - inTotalM) / 60).toFixed(2);
  const expectedInM = 9 * 60 + 10; // 09:10 AM
  const lateMinutes = inTotalM > expectedInM ? (inTotalM - expectedInM) : 0;
  
  return {
    workingHours: parseFloat(workingHours),
    lateMinutes,
    status: lateMinutes > 0 ? 'Late' : 'Present'
  };
}

export default function OfficeDashboardPage() {
  const [teachers, setTeachers] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (err) {
      console.error('Error fetching teachers', err);
      toast.error('Failed to load teachers for matching.');
    }
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
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

  const processFile = (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = utils.sheet_to_json(worksheet, { header: 1, raw: true });
        
        // Find header row by finding the first row with a known column name
        let headerIdx = 0;
        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
          const rowArr = rawRows[i] || [];
          const validCols = rowArr.filter(c => c && String(c).trim().length > 0).length;
          
          const hasKnownHeader = rowArr.some(cell => {
            if (!cell) return false;
            const c = String(cell).toLowerCase().trim();
            return ['name', 'emp code', 'employee', 'employee name', 'staff', 'id', 'date', 'check in', 'in time', 'time in', 'check-in'].includes(c);
          });
          
          if (validCols >= 3 && hasKnownHeader) {
            headerIdx = i;
            break;
          }
        }

        const headers = rawRows[headerIdx] || [];
        const dataRows = rawRows.slice(headerIdx + 1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== null && c !== ''));

        const json = dataRows.map(rowArr => {
          let obj = {};
          headers.forEach((h, i) => {
            if (h) obj[h.toString().trim()] = rowArr[i];
          });
          return obj;
        });

        // Find matching teachers and map data
        const mappedData = json.map((row, index) => {
          // Attempt to find column names dynamically (e.g. Employee Name, name, check in, etc)
          const keys = Object.keys(row);
          const getCol = (possibleNames) => {
            const key = keys.find(k => possibleNames.some(p => k.toLowerCase().includes(p)));
            return key ? row[key] : null;
          };

          const rawName = getCol(['name', 'employee']) || `Unknown Row ${index}`;
          const rawDate = getCol(['date']);
          const rawCheckIn = getCol(['in', 'start']);
          const rawCheckOut = getCol(['out', 'end']);

          // Find teacher by name (fuzzy match)
          const teacher = teachers.find(t => t.name.toLowerCase().includes(rawName.toLowerCase()) || rawName.toLowerCase().includes(t.name.toLowerCase()));
          
          let dateStr = '';
          if (rawDate) {
            const dateObj = typeof rawDate === 'number' ? excelDateToJSDate(rawDate) : new Date(rawDate);
            dateStr = dateObj.toISOString().split('T')[0];
          } else {
            dateStr = new Date().toISOString().split('T')[0];
          }

          const checkInStr = parseExcelTime(rawCheckIn);
          const checkOutStr = parseExcelTime(rawCheckOut);

          const metrics = calculateMetrics(checkInStr, checkOutStr);

          return {
            teacher_id: teacher ? teacher.id : null,
            teacher_name: teacher ? teacher.name : rawName,
            match_status: teacher ? 'Success' : 'Warning',
            date: dateStr,
            check_in: checkInStr,
            check_out: checkOutStr,
            status: metrics.status,
            working_hours: metrics.workingHours,
            late_minutes: metrics.lateMinutes,
          };
        });

        setParsedData(mappedData);
        toast.success(`Parsed ${mappedData.length} records successfully.`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse the Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);
    
    // Filter out rows that couldn't be matched
    const validRecords = parsedData.filter(d => d.teacher_id);
    const errorsCount = parsedData.length - validRecords.length;
    
    try {
      const recordsToInsert = validRecords.map(r => ({
        teacher_id: r.teacher_id,
        date: r.date,
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
        status: errorsCount > 0 ? 'Completed with errors' : 'Completed'
      });

      toast.success('Attendance records imported successfully!');
      setParsedData([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to import records to database.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Office Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-2">Upload and manage biometric attendance records.</p>
      </div>

      {!file && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center
            transition-all duration-300 ease-in-out cursor-pointer glass-panel
            ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-[var(--border)] hover:border-[var(--primary)]'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <div className="bg-[var(--surface-active)] p-4 rounded-full mb-4">
            <UploadCloud size={48} className="text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Drag & Drop Excel File Here</h3>
          <p className="text-[var(--text-secondary)] text-center mb-6">Supports .xlsx and .xls formats.</p>
          <button className="px-6 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors">
            Browse Files
          </button>
        </motion.div>
      )}

      {file && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FileSpreadsheet size={24} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{file.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{(file.size / 1024).toFixed(2)} KB • {parsedData.length} rows</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => { setFile(null); setParsedData([]); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                disabled={isUploading}
              >
                <Trash2 size={18} /> Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={isUploading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UploadCloud size={18} />
                )}
                {isUploading ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-hover)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Match</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Check In</th>
                  <th className="p-4 font-medium">Check Out</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                <AnimatePresence>
                  {parsedData.slice(0, 50).map((row, i) => (
                    <motion.tr 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-[var(--surface-active)] text-[var(--text-primary)]"
                    >
                      <td className="p-4">{row.teacher_name}</td>
                      <td className="p-4">
                        {row.match_status === 'Success' ? (
                          <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded w-max text-xs font-medium">
                            <CheckCircle size={14} /> Found
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded w-max text-xs font-medium">
                            <AlertTriangle size={14} /> Not Found
                          </span>
                        )}
                      </td>
                      <td className="p-4">{row.date}</td>
                      <td className="p-4">{row.check_in || '-'}</td>
                      <td className="p-4">{row.check_out || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === 'Present' ? 'bg-green-500/10 text-green-500' :
                          row.status === 'Late' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {parsedData.length > 50 && (
            <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
              Showing first 50 rows. {parsedData.length - 50} more rows will be imported.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
