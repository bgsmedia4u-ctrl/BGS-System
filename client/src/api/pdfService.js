import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMakeObj = pdfMake.default || pdfMake;
const pdfFontsObj = pdfFonts.default || pdfFonts;
pdfMakeObj.vfs = pdfFontsObj.pdfMake ? pdfFontsObj.pdfMake.vfs : pdfFontsObj.vfs;

export const pdfService = {
  generateWeeklyReport: (reports, dateLabel) => {
    
    // Title of the document
    const content = [
      { text: 'BGS Public School & PU College, Shidlaghatta', style: 'header', alignment: 'center' },
      { text: `Weekly Teachers Report - ${dateLabel}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
    ];

    if (!reports || reports.length === 0) {
      content.push({ text: 'No reports submitted for this date.', alignment: 'center', margin: [0, 20, 0, 0] });
    }

    reports.forEach((report, index) => {
      const teacherName = report.profiles?.name || 'Unknown Teacher';
      
      // Teacher Header
      content.push({ text: `Teacher: ${teacherName} | Subject: ${report.subject || 'Not Specified'}`, style: 'teacherHeader', margin: [0, 15, 0, 5] });

      // Last Week
      content.push({ text: '1. Last Week Overview', style: 'sectionHeader' });
      content.push({
        ul: [
          `Topics Covered: ${report.topics_covered || 'None'}`,
          `On Schedule: ${report.is_on_schedule ? 'Yes' : 'No'}`,
          `Challenges: ${report.challenges || 'None'}`,
        ],
        margin: [10, 0, 0, 10]
      });

      // Helper to generate section tables
      const generateSectionTable = (title, book, questions, tests, doubts) => {
        content.push({ text: title, style: 'sectionHeader' });
        content.push({ text: `Book/Source Referred: ${book || 'N/A'}`, margin: [10, 0, 0, 5] });
        
        // Table data
        const tableBody = [
          [{ text: 'Class Name', style: 'tableHeader' }, { text: 'Questions Done', style: 'tableHeader' }, { text: 'Tests Conducted', style: 'tableHeader' }, { text: 'Doubt Classes', style: 'tableHeader' }]
        ];
        
        // Gather all unique classes across questions, tests, and doubts
        const classNames = new Set();
        (questions || []).forEach(q => q.class_name && classNames.add(q.class_name));
        (tests || []).forEach(t => t.class_name && classNames.add(t.class_name));
        (doubts || []).forEach(d => d.class_name && classNames.add(d.class_name));

        if (classNames.size === 0) {
          content.push({ text: 'No data recorded for this section.', margin: [10, 0, 0, 10], color: 'gray' });
          return;
        }

        Array.from(classNames).forEach(cName => {
          const qCount = (questions || []).find(q => q.class_name === cName)?.count || '0';
          const tCount = (tests || []).find(t => t.class_name === cName)?.count || '0';
          const dCount = (doubts || []).find(d => d.class_name === cName)?.count || '0';
          tableBody.push([cName, qCount, tCount, dCount]);
        });

        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: tableBody
          },
          layout: 'lightHorizontalLines',
          margin: [10, 0, 0, 15]
        });
      };

      // Sections
      if (report.skip_cet) {
        content.push({ text: '2. CET Section - Skipped', style: 'sectionHeader' });
      } else {
        generateSectionTable('2. CET Section', report.cet_book, report.cet_questions, report.cet_tests, report.cet_doubt);
      }

      if (report.skip_neet) {
        content.push({ text: '3. NEET Section - Skipped', style: 'sectionHeader' });
      } else {
        generateSectionTable('3. NEET Section', report.neet_book, report.neet_questions, report.neet_tests, report.neet_doubt);
      }

      if (report.skip_jee) {
        content.push({ text: '4. JEE Section - Skipped', style: 'sectionHeader' });
      } else {
        generateSectionTable('4. JEE Section', report.jee_book, report.jee_questions, report.jee_tests, report.jee_doubt);
      }

      // Separator between teachers
      if (index < reports.length - 1) {
        content.push({ text: '', pageBreak: 'after' });
      }
    });

    const docDefinition = {
      content: content,
      styles: {
        header: { fontSize: 18, bold: true, color: '#800000' },
        subheader: { fontSize: 14, bold: true, color: '#444444' },
        teacherHeader: { fontSize: 14, bold: true, color: '#243560', decoration: 'underline' },
        sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5], color: '#800000' },
        tableHeader: { bold: true, fontSize: 11, color: 'black' }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMakeObj.createPdf(docDefinition).download(`BGS_Report_${dateLabel}.pdf`);
  }
};
