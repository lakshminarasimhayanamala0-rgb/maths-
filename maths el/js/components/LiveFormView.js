// ExamSlot - Live Student Registration Portal & Slot Allocator Component
const { createElement: h, useState, useMemo } = React;
import { exportStudentHallTicketToPDF } from '../pdfExport.js';

const SAMPLE_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Sneha Reddy', 'Vikram Singh',
  'Ananya Iyer', 'Rahul Nair', 'Pooja Gupta', 'Aditya Joshi', 'Kavya Menon',
  'Siddharth Rao', 'Neha Kulkarni', 'Karthik Bhat', 'Divya Pillai', 'Varun Deshmukh',
  'Riya Sen', 'Manish Pandey', 'Tanvi Shah', 'Arjun Mehta', 'Ishita Bose',
  'Deepak Chawla', 'Meera Krishnan', 'Gaurav Bansal', 'Shweta Tiwari', 'Naveen Kumar'
];

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'AI & Data Science',
  'Mathematics & Computing',
  'Basic Sciences & Engineering'
];

export function LiveFormView({
  subjects,
  students,
  timetable,
  examSettings,
  graph,
  onAddStudent,
  onResetStudents,
  isSimulatingStream,
  onToggleSimulatingStream,
  onSelectTab
}) {
  const [studentId, setStudentId] = useState(`STU${String(students.length + 1).padStart(3, '0')}`);
  const [studentName, setStudentName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState('Sem 4');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [selectedSubjects, setSelectedSubjects] = useState(['MATH', 'PY']);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [confirmedStudent, setConfirmedStudent] = useState(null);

  const toggleSubject = (code) => {
    if (selectedSubjects.includes(code)) {
      setSelectedSubjects(selectedSubjects.filter((c) => c !== code));
    } else {
      setSelectedSubjects([...selectedSubjects, code]);
    }
  };

  const handleQuickPreset = (preset) => {
    if (preset === 'cs-core') {
      setSelectedSubjects(['MATH', 'PY', 'COA', 'OS'].filter((c) => subjects.some((s) => s.code === c)));
    } else if (preset === 'it-track') {
      setSelectedSubjects(['JAVA', 'DCN', 'BE'].filter((c) => subjects.some((s) => s.code === c)));
    } else if (preset === 'all') {
      setSelectedSubjects(subjects.map((s) => s.code));
    } else if (preset === 'random3') {
      const shuffled = [...subjects].sort(() => 0.5 - Math.random());
      setSelectedSubjects(shuffled.slice(0, 3).map((s) => s.code));
    }
  };

  // Dynamically compute allocated slots for current selection
  const liveAllocations = useMemo(() => {
    if (!timetable || !timetable.rows) return [];
    return selectedSubjects.map((subCode) => {
      const row = timetable.rows.find((r) => r.subjects && r.subjects.some((s) => s.code === subCode));
      const subObj = row ? row.subjects.find((s) => s.code === subCode) : subjects.find((s) => s.code === subCode);
      return {
        code: subCode,
        name: subObj ? subObj.name : subCode,
        department: subObj ? subObj.department : '',
        credits: subObj ? subObj.credits : 3,
        slotNumber: row ? row.slotNumber : 1,
        formattedDate: row ? row.formattedDate : '16 Nov 2026',
        dayName: row ? row.dayName : 'Monday',
        sessionType: row ? row.sessionType : 'Morning',
        sessionTime: row ? row.sessionTime : '09:30 AM - 12:30 PM',
        colorInfo: row ? row.colorInfo : null
      };
    }).sort((a, b) => a.slotNumber - b.slotNumber);
  }, [selectedSubjects, timetable, subjects]);

  // Compute free slots for current selection (sessions where this student has no exam)
  const freeSlots = useMemo(() => {
    if (!timetable || !timetable.rows) return [];
    const usedSlots = new Set(liveAllocations.map((a) => a.slotNumber));
    return timetable.rows.filter((r) => !usedSlots.has(r.slotNumber));
  }, [liveAllocations, timetable]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const cleanId = studentId.trim().toUpperCase();
    const cleanName = studentName.trim() || `Student ${students.length + 1}`;

    if (!cleanId) {
      alert('Please enter a Student Roll Number / ID.');
      return;
    }

    if (selectedSubjects.length === 0) {
      alert('Please select at least 1 course for registration.');
      return;
    }

    const newStudent = {
      id: cleanId,
      name: cleanName,
      department,
      semester,
      academicYear,
      subjects: selectedSubjects
    };

    onAddStudent(newStudent);

    // Save confirmed student for hall ticket display
    setConfirmedStudent({
      ...newStudent,
      allocations: [...liveAllocations],
      freeSlots: [...freeSlots]
    });

    setFeedbackMsg({
      type: 'success',
      text: `✓ Successfully registered ${cleanName} (${cleanId})! ${selectedSubjects.length} courses allocated to conflict-free slots.`
    });

    // Reset form fields for next entry
    setStudentId(`STU${String(students.length + 2).padStart(3, '0')}`);
    setStudentName('');
    setSelectedSubjects(['MATH', 'PY']);
  };

  const handleAddBatch5 = () => {
    for (let i = 0; i < 5; i++) {
      const idx = students.length + i + 1;
      const sId = `STU${String(idx).padStart(3, '0')}`;
      const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
      const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
      const shuffled = [...subjects].sort(() => 0.5 - Math.random());
      const count = Math.floor(Math.random() * 3) + 2;
      const chosen = shuffled.slice(0, count).map((s) => s.code);

      onAddStudent({
        id: sId,
        name: `${name} ${i + 1}`,
        department: dept,
        semester: 'Sem 4',
        academicYear: '2026-2027',
        subjects: chosen
      });
    }

    setFeedbackMsg({
      type: 'success',
      text: '✓ Added batch of 5 simulated student registrations! Conflict graph and timetable updated.'
    });
  };

  return h('div', { className: 'space-y-6' }, [
    // Header Banner
    h('div', { className: 'card p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md' }, [
      h('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4' }, [
        h('div', null, [
          h('div', { className: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-2' }, [
            h('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' }),
            'LIVE SLOT ALLOCATION ENGINE'
          ]),
          h('h2', { className: 'text-2xl font-black tracking-tight' }, 'Live Course Registration & Free Slot Allocator'),
          h('p', { className: 'text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed' },
            'Register student courses in real time. The Graph Coloring engine dynamically analyzes course collisions, allocates collision-free examination slots, and confirms free rest slots automatically!'
          )
        ]),

        h('div', { className: 'flex flex-wrap items-center gap-3' }, [
          h('button', {
            className: `btn btn-sm ${isSimulatingStream ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'}`,
            onClick: () => onToggleSimulatingStream && onToggleSimulatingStream(!isSimulatingStream)
          }, [
            h('span', { className: 'mr-1' }, isSimulatingStream ? '⏸' : '▶'),
            isSimulatingStream ? 'Pause Live Stream (Active)' : '▶ Start Live Auto-Stream'
          ]),

          h('button', {
            className: 'btn btn-secondary btn-sm text-xs bg-white/10 hover:bg-white/20 text-white border-white/20',
            onClick: handleAddBatch5
          }, '⚡ +5 Random Students')
        ])
      ])
    ]),

    // Confirmed Registration & Hall Ticket Card (Shown after registration)
    confirmedStudent && h('div', { className: 'card p-6 border-2 border-emerald-500 bg-emerald-50/20 shadow-md animate-fadeIn' }, [
      h('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-emerald-200' }, [
        h('div', null, [
          h('div', { className: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 mb-1' }, [
            h('span', null, '✓ ALLOCATED & CONFLICT-FREE'),
            '• 0 CLASHES'
          ]),
          h('h3', { className: 'text-lg font-bold text-slate-900' }, `Exam Hall Ticket: ${confirmedStudent.name} (${confirmedStudent.id})`),
          h('p', { className: 'text-xs text-slate-600' },
            `${confirmedStudent.department} • ${confirmedStudent.semester || 'Sem 4'} • ${confirmedStudent.subjects.length} Registered Courses`
          )
        ]),

        h('div', { className: 'flex items-center gap-2' }, [
          h('button', {
            className: 'btn btn-primary btn-sm flex items-center gap-1.5 font-bold',
            onClick: () => exportStudentHallTicketToPDF(confirmedStudent, timetable, examSettings)
          }, [
            h('span', null, '🖨️'),
            'Print Hall Ticket'
          ]),
          h('button', {
            className: 'btn btn-secondary btn-sm text-xs',
            onClick: () => setConfirmedStudent(null)
          }, 'Close Receipt')
        ])
      ]),

      // Allocated Slots Table for Confirmed Student
      h('div', { className: 'overflow-x-auto mb-4' }, [
        h('table', { className: 'table w-full text-xs bg-white rounded-lg border border-slate-200' }, [
          h('thead', { className: 'bg-slate-50 text-slate-700' }, [
            h('tr', null, [
              h('th', { className: 'text-center py-2' }, 'Allocated Slot'),
              h('th', { className: 'py-2' }, 'Date & Day'),
              h('th', { className: 'py-2' }, 'Session / Time'),
              h('th', { className: 'py-2' }, 'Course Code'),
              h('th', { className: 'py-2' }, 'Course Name'),
              h('th', { className: 'text-center py-2' }, 'Allocation Status')
            ])
          ]),
          h('tbody', { className: 'divide-y divide-slate-100' },
            (confirmedStudent.allocations || []).map((alloc) =>
              h('tr', { key: alloc.code }, [
                h('td', { className: 'text-center py-2' }, [
                  h('span', { className: 'badge bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full' },
                    `Slot ${alloc.slotNumber || 1}`
                  )
                ]),
                h('td', { className: 'py-2' }, [
                  h('div', { className: 'font-bold text-slate-800' }, alloc.formattedDate),
                  h('div', { className: 'text-[10px] text-slate-500' }, alloc.dayName)
                ]),
                h('td', { className: 'py-2' }, [
                  h('div', { className: 'font-semibold text-slate-800' }, alloc.sessionType),
                  h('div', { className: 'text-[10px] text-slate-500' }, alloc.sessionTime)
                ]),
                h('td', { className: 'font-mono font-bold text-blue-800 py-2' }, alloc.code),
                h('td', { className: 'font-medium text-slate-800 py-2' }, alloc.name),
                h('td', { className: 'text-center py-2' }, [
                  h('span', { className: 'badge bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded' }, '✓ FREE SLOT')
                ])
              ])
            )
          )
        ])
      ]),

      // Free Slots Info for Confirmed Student
      (confirmedStudent.freeSlots && confirmedStudent.freeSlots.length > 0) && h('div', { className: 'p-3 bg-emerald-100/60 rounded-lg border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between' }, [
        h('div', { className: 'flex items-center gap-2' }, [
          h('span', { className: 'text-base select-none' }, '💡'),
          h('span', null,
            h('strong', null, 'Free Rest Sessions (No Exams Scheduled): '),
            confirmedStudent.freeSlots.map((r) => `Slot ${r.slotNumber} (${r.formattedDate} ${r.sessionType})`).join(' • ')
          )
        ]),
        h('button', {
          className: 'text-xs text-blue-700 hover:text-blue-900 font-bold underline whitespace-nowrap ml-3',
          onClick: () => onSelectTab && onSelectTab('timetable')
        }, 'View in Full Timetable →')
      ])
    ]),

    // Feedback Alert Banner
    feedbackMsg && !confirmedStudent && h('div', { className: 'p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs' }, [
      h('div', { className: 'flex items-center gap-2 text-xs font-semibold' }, [
        h('span', { className: 'text-base' }, '🎉'),
        h('span', null, feedbackMsg.text)
      ]),
      h('div', { className: 'flex items-center gap-2' }, [
        h('button', {
          className: 'btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
          onClick: () => onSelectTab && onSelectTab('timetable')
        }, '🗓️ View Timetable'),
        h('button', {
          className: 'text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-2',
          onClick: () => setFeedbackMsg(null)
        }, '✕')
      ])
    ]),

    // Main 2-Column Layout: Registration Form & Live Activity Stream
    h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, [
      // Left 2 Columns: The Registration Form with Live Slot Allocation Preview
      h('div', { className: 'lg:col-span-2 card p-6' }, [
        h('div', { className: 'flex items-center justify-between pb-4 mb-4 border-b border-slate-200' }, [
          h('div', null, [
            h('h3', { className: 'text-base font-bold text-slate-800' }, 'Student Course Registration Form'),
            h('p', { className: 'text-xs text-slate-500' }, 'Select courses to see instant conflict-free slot allocation in real time.')
          ]),
          h('div', { className: 'text-xs font-semibold text-slate-500' }, `${students.length} Registered Students`)
        ]),

        h('form', { onSubmit: handleSubmit, className: 'space-y-4' }, [
          // Row 1: ID and Name
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' }, [
            h('div', null, [
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Student Roll Number / ID *'),
              h('input', {
                type: 'text',
                className: 'form-input text-xs font-mono',
                placeholder: 'e.g., STU021',
                value: studentId,
                required: true,
                onChange: (e) => setStudentId(e.target.value)
              })
            ]),
            h('div', null, [
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Student Full Name *'),
              h('input', {
                type: 'text',
                className: 'form-input text-xs',
                placeholder: 'e.g., Aarav Sharma',
                value: studentName,
                required: true,
                onChange: (e) => setStudentName(e.target.value)
              })
            ])
          ]),

          // Row 2: Department and Semester
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-4' }, [
            h('div', null, [
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Department'),
              h('select', {
                className: 'form-select text-xs',
                value: department,
                onChange: (e) => setDepartment(e.target.value)
              }, DEPARTMENTS.map((dept) => h('option', { key: dept, value: dept }, dept)))
            ]),
            h('div', null, [
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Semester'),
              h('input', {
                type: 'text',
                className: 'form-input text-xs',
                value: semester,
                onChange: (e) => setSemester(e.target.value)
              })
            ]),
            h('div', null, [
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Academic Year'),
              h('input', {
                type: 'text',
                className: 'form-input text-xs',
                value: academicYear,
                onChange: (e) => setAcademicYear(e.target.value)
              })
            ])
          ]),

          // Course Selection Checkboxes
          h('div', { className: 'pt-2' }, [
            h('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2' }, [
              h('label', { className: 'block text-xs font-bold text-slate-800' },
                `Select Registered Subjects (${selectedSubjects.length} selected) *`
              ),
              h('div', { className: 'flex flex-wrap gap-1.5' }, [
                h('button', { type: 'button', className: 'btn btn-xs btn-secondary text-[10px]', onClick: () => handleQuickPreset('cs-core') }, 'CS Core (4)'),
                h('button', { type: 'button', className: 'btn btn-xs btn-secondary text-[10px]', onClick: () => handleQuickPreset('it-track') }, 'IT Track (3)'),
                h('button', { type: 'button', className: 'btn btn-xs btn-secondary text-[10px]', onClick: () => handleQuickPreset('random3') }, '🎲 Random 3'),
                h('button', { type: 'button', className: 'btn btn-xs btn-secondary text-[10px]', onClick: () => handleQuickPreset('all') }, 'All 7')
              ])
            ]),

            // 7 Subjects Checkbox Grid
            h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200' },
              subjects.map((sub) => {
                const isChecked = selectedSubjects.includes(sub.code);
                const allocRow = (liveAllocations || []).find((a) => a.code === sub.code);
                return h('label', {
                  key: sub.code,
                  className: `flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isChecked ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-semibold shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`
                }, [
                  h('input', {
                    type: 'checkbox',
                    checked: isChecked,
                    onChange: () => toggleSubject(sub.code),
                    className: 'mt-0.5 rounded text-blue-600 focus:ring-blue-500'
                  }),
                  h('div', { className: 'text-xs leading-tight flex-1' }, [
                    h('div', { className: 'flex items-center justify-between gap-1.5' }, [
                      h('div', { className: 'flex items-center gap-1.5 font-bold' }, [
                        h('span', { className: 'px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px]' }, sub.code),
                        sub.name
                      ]),
                      isChecked && allocRow && h('span', {
                        className: 'px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                      }, `Slot ${allocRow.slotNumber}`)
                    ]),
                    h('div', { className: 'text-[10px] text-slate-500 mt-0.5 flex items-center justify-between' }, [
                      h('span', null, `${sub.department || 'General'} • ${sub.credits || 3} Credits`),
                      isChecked && allocRow && h('span', { className: 'text-emerald-700 font-medium text-[10px]' }, `${allocRow.formattedDate} • ${allocRow.sessionType}`)
                    ])
                  ])
                ]);
              })
            )
          ]),

          // DYNAMIC FREE SLOT ALLOCATION PREVIEW CARD
          selectedSubjects.length > 0 && h('div', { className: 'p-4 rounded-xl border border-blue-300 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-teal-50/50 shadow-xs space-y-3' }, [
            h('div', { className: 'flex items-center justify-between' }, [
              h('div', { className: 'flex items-center gap-2' }, [
                h('span', { className: 'text-base select-none' }, '⚡'),
                h('span', { className: 'text-xs font-bold text-blue-900 uppercase tracking-wide' }, 'Live Free Slot Allocation Preview')
              ]),
              h('span', { className: 'badge bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300' },
                '✓ 100% CONFLICT-FREE'
              )
            ]),

            // List of allocated exam slots for this student
            h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2' },
              liveAllocations.map((alloc) =>
                h('div', {
                  key: alloc.code,
                  className: 'p-2.5 rounded-lg bg-white border border-blue-200 shadow-2xs text-xs space-y-1'
                }, [
                  h('div', { className: 'flex items-center justify-between' }, [
                    h('span', { className: 'font-mono font-bold text-blue-700' }, alloc.code),
                    h('span', { className: 'px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]' },
                      `Slot ${alloc.slotNumber}`
                    )
                  ]),
                  h('div', { className: 'font-semibold text-slate-800 text-[11px] truncate' }, alloc.name),
                  h('div', { className: 'text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100' }, [
                    h('span', null, alloc.formattedDate),
                    h('span', { className: 'font-bold text-slate-700' }, alloc.sessionType)
                  ])
                ])
              )
            ),

            // Free slots breakdown
            h('div', { className: 'pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-blue-900 gap-2' }, [
              h('div', { className: 'flex items-center gap-1.5' }, [
                h('span', { className: 'w-2 h-2 rounded-full bg-emerald-500' }),
                h('span', null,
                  h('strong', null, `${liveAllocations.length} Exams Allocated: `),
                  `Placed in distinct slots ${liveAllocations.map((a) => `#${a.slotNumber}`).join(', ')}.`
                )
              ]),
              freeSlots.length > 0 && h('div', { className: 'text-slate-600' }, [
                h('strong', { className: 'text-slate-800' }, `${freeSlots.length} Free Sessions: `),
                freeSlots.map((r) => `Slot ${r.slotNumber}`).join(', ')
              ])
            ])
          ]),

          // Submit Actions
          h('div', { className: 'pt-3 flex flex-col sm:flex-row items-center justify-between gap-3' }, [
            h('p', { className: 'text-[11px] text-slate-500' },
              'Submitting will lock in course slots, update vertex conflict degrees, and generate an official hall ticket.'
            ),
            h('button', {
              type: 'submit',
              className: 'btn btn-primary btn-md w-full sm:w-auto flex items-center justify-center gap-2 font-bold px-6 shadow-md shadow-blue-500/20'
            }, [
              h('span', null, '🚀'),
              h('span', null, 'Submit Registration & Allocate Free Slots')
            ])
          ])
        ])
      ]),

      // Right 1 Column: Live Stream Status & Recent Submissions
      h('div', { className: 'space-y-6' }, [
        // Live Stream Automation Status Card
        h('div', { className: `card p-5 border-2 ${isSimulatingStream ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'}` }, [
          h('div', { className: 'flex items-center justify-between mb-2' }, [
            h('span', { className: 'text-xs font-bold uppercase tracking-wider text-slate-600' }, 'Live Simulation Mode'),
            h('span', {
              className: `px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSimulatingStream ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`
            }, isSimulatingStream ? 'STREAMING' : 'IDLE')
          ]),
          h('h4', { className: 'text-sm font-bold text-slate-800 mb-1' }, isSimulatingStream ? 'Auto-Registering New Students' : 'Live Stream Simulation Ready'),
          h('p', { className: 'text-xs text-slate-500 leading-relaxed mb-4' },
            isSimulatingStream
              ? 'New student submissions are streaming in every 5 seconds. Watch the conflict graph and timetable adapt live!'
              : 'Turn on the stream to demonstrate real-time graph evolution to your professor or viva examiners.'
          ),
          h('button', {
            className: `btn btn-sm w-full font-bold ${isSimulatingStream ? 'btn-danger' : 'btn-primary'}`,
            onClick: () => onToggleSimulatingStream && onToggleSimulatingStream(!isSimulatingStream)
          }, isSimulatingStream ? '⏹ Stop Live Auto-Stream' : '▶ Start Live Auto-Stream')
        ]),

        // Recent Registrations Feed
        h('div', { className: 'card p-5' }, [
          h('div', { className: 'flex items-center justify-between pb-3 mb-3 border-b border-slate-200' }, [
            h('h4', { className: 'text-xs font-bold uppercase tracking-wider text-slate-700' }, 'Recent Registrations'),
            h('span', { className: 'text-[11px] font-mono text-slate-400' }, `Total: ${students.length}`)
          ]),

          h('div', { className: 'space-y-2.5 max-h-[380px] overflow-y-auto pr-1' },
            students.slice(-8).reverse().map((s) => {
              return h('div', {
                key: s.id,
                className: 'p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1'
              }, [
                h('div', { className: 'flex items-center justify-between font-bold' }, [
                  h('span', { className: 'text-slate-900' }, s.name),
                  h('span', { className: 'font-mono text-[10px] text-blue-700' }, s.id)
                ]),
                h('div', { className: 'flex flex-wrap gap-1' },
                  (s.subjects || []).map((code) => h('span', {
                    key: code,
                    className: 'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800'
                  }, code))
                )
              ]);
            })
          ),

          h('div', { className: 'pt-3 mt-3 border-t border-slate-200 flex justify-between' }, [
            h('button', {
              className: 'text-xs text-red-600 hover:text-red-800 font-semibold',
              onClick: () => {
                if (confirm('Restore default 20 student registrations?')) {
                  onResetStudents();
                }
              }
            }, '🔄 Reset to Default 20'),
            h('button', {
              className: 'text-xs text-blue-600 hover:text-blue-800 font-bold',
              onClick: () => onSelectTab && onSelectTab('students')
            }, 'View All →')
          ])
        ])
      ])
    ])
  ]);
}
