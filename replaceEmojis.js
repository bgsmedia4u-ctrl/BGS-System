const fs = require('fs');
let content = fs.readFileSync('client/src/pages/AdminPortalPage.jsx', 'utf8');

// Add imports
if (!content.includes('lucide-react')) {
  content = content.replace(
    "import toast from 'react-hot-toast';",
    "import toast from 'react-hot-toast';\nimport { Shield, BarChart2, ClipboardList, Users, Megaphone, CheckCircle, FileEdit, XCircle, TrendingUp, Phone, Calendar, BookOpen, AlertTriangle, Trash2, Download, Send, Loader } from 'lucide-react';"
  );
}

// Replace emojis
const replacements = [
  ['🛡️', '<Shield size={20} />'],
  ['📊', '<BarChart2 size={16} style={{marginRight: 6}} />'],
  ['📋', '<ClipboardList size={16} style={{marginRight: 6}} />'],
  ['👩‍🏫 Total Teachers', '<span style={{display:"flex", alignItems:"center", gap:4}}><Users size={14} /> Total Teachers</span>'],
  ['👩‍🏫', '<Users size={16} style={{marginRight: 6}} />'],
  ['📢', '<Megaphone size={16} style={{marginRight: 6}} />'],
  ['✅ Submitted', '<><CheckCircle size={14} /> Submitted</>'],
  ['✅', '<CheckCircle size={14} />'],
  ['📝 Draft', '<><FileEdit size={14} /> Draft</>'],
  ['📝', '<FileEdit size={14} />'],
  ['❌ Not Started', '<><XCircle size={14} /> Not Started</>'],
  ['❌', '<XCircle size={14} />'],
  ['📈', '<TrendingUp size={14} style={{marginRight:4}} />'],
  ['📱', '<Phone size={14} style={{marginRight:4}} />'],
  ['📅', '<Calendar size={16} style={{marginRight:6}} />'],
  ['📖', '<BookOpen size={16} style={{marginRight:6}} />'],
  ['📚', '<BookOpen size={14} style={{marginRight:4}} />'],
  ['⚠️', '<AlertTriangle size={14} />'],
  ['🗑 Delete', '<><Trash2 size={14} style={{marginRight:4}} /> Delete</>'],
  ['⬇ Download PDF', '<><Download size={14} style={{marginRight:6}} /> Download PDF</>'],
  ['📤', '<Send size={16} style={{marginRight:6}} />'],
  ['⏳', '<Loader size={16} style={{marginRight:6}} />']
];

for (const [emoji, icon] of replacements) {
  content = content.split(emoji).join(icon);
}

fs.writeFileSync('client/src/pages/AdminPortalPage.jsx', content);
console.log('Done!');
