'use client';

import { Download } from 'lucide-react';

const QUESTIONS = [
  {
    num: 1,
    difficulty: 'Easy',
    text: 'Define electroplating. Explain its purpose.',
    marks: 2,
  },
  {
    num: 2,
    difficulty: 'Moderate',
    text: 'What is the role of a conductor in the process of electrolysis?',
    marks: 2,
  },
  {
    num: 3,
    difficulty: 'Easy',
    text: 'Why does a solution of copper sulfate conduct electricity?',
    marks: 2,
  },
  {
    num: 4,
    difficulty: 'Moderate',
    text: 'Describe one example of the chemical effect of electric current in daily life.',
    marks: 2,
  },
  {
    num: 5,
    difficulty: 'Moderate',
    text: 'Explain why electric current is said to have chemical effects.',
    marks: 2,
  },
  {
    num: 6,
    difficulty: 'Challenging',
    text: 'How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.',
    marks: 2,
  },
  {
    num: 7,
    difficulty: 'Challenging',
    text: 'What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.',
    marks: 2,
  },
  {
    num: 8,
    difficulty: 'Easy',
    text: 'Mention the type of current used in electroplating and justify why it is used.',
    marks: 2,
  },
  {
    num: 9,
    difficulty: 'Moderate',
    text: 'What is the importance of electric current in the field of metallurgy?',
    marks: 2,
  },
  {
    num: 10,
    difficulty: 'Challenging',
    text: 'Explain with a chemical equation how copper is deposited during the electroplating of an object.',
    marks: 2,
  },
];

const ANSWERS = [
  {
    num: 1,
    text: 'Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.',
  },
  {
    num: 2,
    text: 'A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.',
  },
  {
    num: 3,
    text: 'Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity.',
  },
  {
    num: 4,
    text: 'An example is the electroplating of silver on jewelry to prevent tarnishing.',
  },
  {
    num: 5,
    text: 'Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.',
  },
  {
    num: 6,
    text: 'Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons:\n2H2O + 2e- → H2 + 2OH-\nNa+ + OH- → NaOH (in solution)',
  },
  {
    num: 7,
    text: 'At the cathode: water is reduced to hydrogen gas and hydroxide ions.\nAt the anode: water is oxidized to oxygen gas and hydrogen ions.',
  },
  {
    num: 8,
    text: 'Direct current (DC) is used because it produces a consistent flow of electrons necessary for controlled deposition of metals.',
  },
  {
    num: 9,
    text: 'Electric current helps extract metals from their ores and purify metals by electrolysis in metallurgy.',
  },
  {
    num: 10,
    text: 'During copper electroplating, copper ions in solution gain electrons at the cathode and deposit as copper metal:\nCu2+ + 2e- → Cu (solid)',
  },
];

export default function RedesignedHomePage() {
  return (
    <div style={{ width: '100%', paddingBottom: '40px' }}>
      {/* Outer Container (responsive styles in globals.css) */}
      <div className="outer-paper-container">
        {/* Dark Banner inside container */}
        <div className="dark-banner-card">
          <p style={{ fontSize: '14.5px', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
            Certainly, Lakshya! Here are customized <u><strong>Question Paper</strong></u> for your <u><strong>CBSE Grade 8 Science</strong></u> classes on the <u><strong>NCERT chapters</strong></u>:
          </p>
          
          {/* Desktop Download Button */}
          <button
            className="desktop-download-btn"
            onClick={() => window.print()}
            style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '100px',
              color: '#111827',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <Download size={15} />
            Download as PDF
          </button>

          {/* Mobile Download Button (icon-only circular) */}
          <button
            className="mobile-download-btn"
            onClick={() => window.print()}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              color: '#FFFFFF',
              width: '40px',
              height: '40px',
              display: 'none', // Toggled by media queries in globals.css
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '16px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
          >
            <Download size={18} />
          </button>
        </div>

        {/* Paper Card inside container */}
        <div
          className="paper-card"
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            color: '#111827',
          }}
        >
          {/* School Header */}
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              textAlign: 'center',
              margin: '0 0 8px 0',
              letterSpacing: '0.2px',
            }}
          >
            Delhi Public School, Sector-4, Bokaro
          </h1>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: '700',
              textAlign: 'center',
              margin: '0 0 4px 0',
            }}
          >
            Subject: English
          </h2>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '700',
              textAlign: 'center',
              margin: '0 0 24px 0',
            }}
          >
            Class: 5th
          </h3>

          {/* Time / Marks Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13.5px',
              fontWeight: '700',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: '12px',
              marginBottom: '16px',
            }}
          >
            <span>Time Allowed: 45 minutes</span>
            <span>Maximum Marks: 20</span>
          </div>

          {/* Instructions */}
          <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 20px 0' }}>
            All questions are compulsory unless stated otherwise.
          </p>

          {/* Student Fields */}
          <div className="student-fields-grid" style={{ marginBottom: '32px', fontSize: '13px', fontWeight: '700' }}>
            <div>
              Name: <span style={{ borderBottom: '1px solid #111827', display: 'inline-block', minWidth: '140px' }}>&nbsp;</span>
            </div>
            <div>
              Roll Number: <span style={{ borderBottom: '1px solid #111827', display: 'inline-block', minWidth: '140px' }}>&nbsp;</span>
            </div>
            <div>
              Class: 5th Section: <span style={{ borderBottom: '1px solid #111827', display: 'inline-block', minWidth: '80px' }}>&nbsp;</span>
            </div>
          </div>

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>Section A</h4>
            <h5 style={{ fontSize: '13.5px', fontWeight: '700', textAlign: 'left', margin: '0 0 4px 0' }}>
              Short Answer Questions
            </h5>
            <p style={{ fontSize: '12.5px', fontStyle: 'italic', color: '#4B5563', textAlign: 'left', margin: 0 }}>
              Attempt all questions. Each question carries 2 marks
            </p>
          </div>

          {/* Questions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
            {QUESTIONS.map((q) => (
              <div key={q.num} className="question-item">
                <span className="question-num" style={{ fontSize: '13.5px', fontWeight: '700', minWidth: '20px', textAlign: 'right' }}>
                  {q.num}.
                </span>
                <div className="question-text-block" style={{ fontSize: '13.5px', fontWeight: '700', lineHeight: '1.6' }}>
                  [{q.difficulty}] {q.text}
                </div>
                <span className="question-marks" style={{ fontSize: '13.5px', fontWeight: '700', whiteSpace: 'nowrap', paddingLeft: '8px' }}>
                  [{q.marks} Marks]
                </span>
              </div>
            ))}
          </div>

          {/* End Note */}
          <p style={{ fontSize: '13.5px', fontWeight: '700', textAlign: 'center', margin: '0 0 32px 0', borderBottom: '1px solid #E5E7EB', paddingBottom: '20px' }}>
            End of Question Paper
          </p>

          {/* Answer Key */}
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: '700', margin: '0 0 16px 0' }}>Answer Key:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ANSWERS.map((a) => (
                <div key={a.num} className="question-item">
                  <span className="question-num" style={{ fontSize: '13.5px', fontWeight: '700', minWidth: '20px', textAlign: 'right' }}>
                    {a.num}.
                  </span>
                  <div className="question-text-block" style={{ color: '#4B5563', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {a.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
