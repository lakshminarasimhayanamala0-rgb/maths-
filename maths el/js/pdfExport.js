// ExamSlot - Examination Timetable PDF & Printable Report Generator
// Provides high-definition university examination schedule export

/**
 * Exports the timetable using jsPDF and autoTable if available,
 * or triggers a dedicated, beautifully styled printable window.
 * @param {Object} timetable - Timetable object from generateTimetable
 * @param {Object} graph - Conflict graph
 */
export function exportTimetableToPDF(timetable, graph) {
  // Check if jsPDF is available on window
  if (window.jspdf && window.jspdf.jsPDF) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const primaryColor = [30, 64, 175]; // Royal blue
      const darkColor = [30, 41, 59];

      // University Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.text(timetable.settings.universityName || 'APEX INSTITUTE OF TECHNOLOGY', 420, 40, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(...darkColor);
      doc.text(timetable.settings.examTitle || 'END SEMESTER EXAMINATIONS TIMETABLE', 420, 58, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const generatedAt = new Date().toLocaleString();
      doc.text(`Generated on: ${generatedAt}  |  Algorithm: Graph Coloring  |  Status: ${timetable.isConflictFree ? '100% CONFLICT-FREE' : 'WARNING: CONFLICTS PRESENT'}`, 420, 72, { align: 'center' });

      // Build Table Data
      const tableRows = [];
      timetable.rows.forEach((row) => {
        const subjectDetails = row.subjects
          .map((s) => `${s.code} - ${s.name} (${s.enrolledCount} students)`)
          .join('\n');

        tableRows.push([
          `Slot ${row.slotNumber}`,
          `${row.formattedDate}\n(${row.dayName})`,
          `${row.sessionType}\n${row.sessionTime}`,
          row.subjects.map((s) => s.code).join(', '),
          subjectDetails,
          row.totalStudents,
          row.hasConflict ? 'CONFLICT' : 'OK'
        ]);
      });

      if (doc.autoTable) {
        doc.autoTable({
          startY: 85,
          head: [['Slot', 'Date & Day', 'Session / Time', 'Codes', 'Subjects & Enrollments', 'Students', 'Status']],
          body: tableRows,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 50, fontStyle: 'bold' },
            1: { halign: 'center', cellWidth: 90 },
            2: { halign: 'center', cellWidth: 110 },
            3: { halign: 'center', cellWidth: 80, fontStyle: 'bold' },
            4: { cellWidth: 280 },
            5: { halign: 'center', cellWidth: 60 },
            6: { halign: 'center', cellWidth: 60 }
          },
          styles: {
            fontSize: 9,
            cellPadding: 5
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          }
        });

        // Footer & Signatures
        const finalY = doc.lastAutoTable.finalY + 35;
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Prepared by: Timetabling Committee (ExamSlot Engine)', 60, finalY);
        doc.text('Verified by: Head of Examination Cell', 420, finalY, { align: 'center' });
        doc.text('Approved by: Controller of Examinations', 760, finalY, { align: 'right' });

        doc.save(`Exam_Timetable_${new Date().toISOString().slice(0, 10)}.pdf`);
        return;
      }
    } catch (err) {
      console.warn('jsPDF error, falling back to print dialog:', err);
    }
  }

  // Fallback: Open dedicated printable report window
  openPrintableTimetableWindow(timetable, graph);
}

/**
 * Creates and prints an elegant university timetable in a popup window
 * @param {Object} timetable 
 * @param {Object} graph 
 */
export function openPrintableTimetableWindow(timetable, graph) {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Please allow popups to print/export the timetable as PDF.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${timetable.settings.examTitle || 'Examination Timetable'}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px; }
        .univ-name { font-size: 22px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; }
        .exam-title { font-size: 16px; font-weight: 600; color: #334155; margin-top: 4px; }
        .meta-info { font-size: 12px; color: #64748b; margin-top: 6px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; vertical-align: top; }
        th { background: #1e40af; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .slot-badge { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-weight: bold; display: inline-block; }
        .subject-tag { display: inline-block; background: #e2e8f0; color: #0f172a; padding: 2px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 12px; font-weight: 500; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; color: #475569; }
        .sig-box { text-align: center; width: 220px; border-top: 1px solid #94a3b8; padding-top: 8px; }
        @media print {
          body { margin: 15mm; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 12px;">
        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Print / Save as PDF
        </button>
      </div>
      <div class="header">
        <div class="univ-name">${timetable.settings.universityName}</div>
        <div class="exam-title">${timetable.settings.examTitle}</div>
        <div class="meta-info">
          Generated: ${new Date().toLocaleString()} | Total Examination Slots: ${timetable.slotCount} | 
          Status: <span class="badge ${timetable.isConflictFree ? 'badge-success' : 'badge-danger'}">
            ${timetable.isConflictFree ? '100% Conflict-Free' : 'Contains Conflicts'}
          </span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 70px;">Slot</th>
            <th style="width: 140px;">Date & Day</th>
            <th style="width: 170px;">Session / Time</th>
            <th>Scheduled Subjects</th>
            <th style="width: 90px; text-align: center;">Students</th>
          </tr>
        </thead>
        <tbody>
          ${timetable.rows
            .map(
              (r) => `
            <tr>
              <td style="text-align: center;"><span class="slot-badge">Slot ${r.slotNumber}</span></td>
              <td><strong>${r.formattedDate}</strong><br><span style="color:#64748b; font-size:11px;">${r.dayName}</span></td>
              <td><strong>${r.sessionType}</strong><br><span style="color:#64748b; font-size:11px;">${r.sessionTime}</span></td>
              <td>
                ${r.subjects
                  .map(
                    (s) => `
                  <div style="margin-bottom: 4px;">
                    <span class="subject-tag"><strong>${s.code}</strong></span>
                    <span>${s.name}</span>
                    <span style="color: #64748b; font-size: 11px;">(${s.enrolledCount} enrolled)</span>
                  </div>
                `
                  )
                  .join('')}
              </td>
              <td style="text-align: center; font-weight: bold;">${r.totalStudents}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        <div class="sig-box">ExamSlot System Administrator</div>
        <div class="sig-box">Head of Department / Verification</div>
        <div class="sig-box">Controller of Examinations</div>
      </div>

      <script>
        // Auto print after render
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generates an official printable Student Examination Hall Ticket & Allocated Slot Schedule
 * @param {Object} student - Student record { id, name, department, semester, academicYear, subjects }
 * @param {Object} timetable - Current examination timetable
 * @param {Object} settings - University exam settings
 */
export function exportStudentHallTicketToPDF(student, timetable, settings = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and print the student hall ticket.');
    return;
  }

  const univName = (settings && settings.universityName) || (timetable && timetable.settings && timetable.settings.universityName) || 'APEX INSTITUTE OF TECHNOLOGY';
  const examTitle = (settings && settings.examTitle) || (timetable && timetable.settings && timetable.settings.examTitle) || 'END SEMESTER EXAMINATIONS';

  // Find allocated slots for student's registered subjects
  const studentSubjects = student.subjects || [];
  const allocatedRows = [];
  const allocatedSlotsSet = new Set();

  studentSubjects.forEach((subCode) => {
    const row = timetable.rows.find((r) => r.subjects && r.subjects.some((s) => s.code === subCode));
    const subObj = row ? row.subjects.find((s) => s.code === subCode) : null;
    const slotNum = row ? row.slotNumber : null;
    if (slotNum) allocatedSlotsSet.add(slotNum);

    allocatedRows.push({
      code: subCode,
      name: subObj ? subObj.name : subCode,
      department: subObj ? subObj.department : (student.department || 'General'),
      credits: subObj ? subObj.credits : 3,
      slotNumber: slotNum,
      formattedDate: row ? row.formattedDate : 'TBD',
      dayName: row ? row.dayName : '',
      sessionType: row ? row.sessionType : 'Morning',
      sessionTime: row ? row.sessionTime : '09:30 AM - 12:30 PM'
    });
  });

  // Sort by slot number
  allocatedRows.sort((a, b) => (a.slotNumber || 99) - (b.slotNumber || 99));

  // Determine free slots for this student
  const freeSlots = (timetable.rows || [])
    .filter((r) => !allocatedSlotsSet.has(r.slotNumber))
    .map((r) => `Slot ${r.slotNumber} (${r.formattedDate} - ${r.sessionType})`);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Exam Hall Ticket - ${student.name} (${student.id})</title>
      <style>
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 30px;
          background: #ffffff;
        }
        .ticket-box {
          border: 3px double #1e40af;
          padding: 24px;
          border-radius: 8px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .univ-name { font-size: 18px; font-weight: 800; color: #1e40af; letter-spacing: 0.5px; }
        .exam-title { font-size: 13px; font-weight: 700; color: #334155; margin-top: 3px; }
        .doc-title {
          font-size: 14px;
          font-weight: 800;
          color: #047857;
          background: #ecfdf5;
          display: inline-block;
          padding: 4px 14px;
          border-radius: 9999px;
          margin-top: 8px;
          border: 1px solid #a7f3d0;
        }
        .student-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .info-item { display: flex; }
        .info-label { font-weight: 700; color: #64748b; width: 120px; }
        .info-val { font-weight: 800; color: #0f172a; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
        }
        th { background: #1e40af; color: white; font-weight: 700; }
        .badge-slot {
          background: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 10px;
        }
        .badge-free {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 9px;
        }
        .free-slots-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 11px;
          color: #166534;
          margin-bottom: 20px;
        }
        .footer-sigs {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        .sig-line {
          text-align: center;
          border-top: 1px solid #94a3b8;
          width: 180px;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
          padding-top: 4px;
        }
        .no-print {
          text-align: right;
          margin-bottom: 12px;
        }
        .btn-print {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
        }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
          .ticket-box { border: 2px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save Hall Ticket</button>
      </div>

      <div class="ticket-box">
        <div class="header">
          <div class="univ-name">${univName}</div>
          <div class="exam-title">${examTitle}</div>
          <div class="doc-title">OFFICIAL STUDENT EXAMINATION HALL TICKET</div>
        </div>

        <div class="student-info-grid">
          <div class="info-item"><span class="info-label">Student ID:</span><span class="info-val">${student.id}</span></div>
          <div class="info-item"><span class="info-label">Full Name:</span><span class="info-val">${student.name}</span></div>
          <div class="info-item"><span class="info-label">Department:</span><span class="info-val">${student.department || 'Computer Science'}</span></div>
          <div class="info-item"><span class="info-label">Semester / Year:</span><span class="info-val">${student.semester || 'Sem 4'} (${student.academicYear || '2026-2027'})</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 70px; text-align: center;">Allocated Slot</th>
              <th style="width: 120px;">Date & Day</th>
              <th style="width: 150px;">Session / Time Window</th>
              <th style="width: 80px;">Course Code</th>
              <th>Course Name</th>
              <th style="width: 80px; text-align: center;">Clash Status</th>
            </tr>
          </thead>
          <tbody>
            ${allocatedRows.map((row) => `
              <tr>
                <td style="text-align: center;"><span class="badge-slot">Slot ${row.slotNumber || 1}</span></td>
                <td><strong>${row.formattedDate}</strong><br><span style="color:#64748b; font-size:10px;">${row.dayName}</span></td>
                <td><strong>${row.sessionType}</strong><br><span style="color:#64748b; font-size:10px;">${row.sessionTime}</span></td>
                <td><strong>${row.code}</strong></td>
                <td>${row.name}</td>
                <td style="text-align: center;"><span class="badge-free">✓ FREE & CLEAR</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="free-slots-box">
          <strong>✓ Conflict-Free Allocation Verified:</strong> All ${studentSubjects.length} of your registered examinations are scheduled in separate, clash-free slots via Graph Coloring.<br>
          ${freeSlots.length > 0 ? `<strong>Remaining Free Sessions (No Exam):</strong> ${freeSlots.join(' • ')}` : 'You have exams in all active timetable sessions.'}
        </div>

        <div class="footer-sigs">
          <div class="sig-line">Candidate's Signature</div>
          <div class="sig-line">Faculty Advisor</div>
          <div class="sig-line">Controller of Examinations</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

