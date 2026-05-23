'use client';

const QUESTIONS = [
  { num: 1, difficulty: 'Easy', text: 'Define electroplating. Explain its purpose.', marks: 2 },
  { num: 2, difficulty: 'Moderate', text: 'What is the role of a conductor in the process of electrolysis?', marks: 2 },
  { num: 3, difficulty: 'Easy', text: 'Why does a solution of copper sulfate conduct electricity?', marks: 2 },
  { num: 4, difficulty: 'Moderate', text: 'Describe one example of the chemical effect of electric current in daily life.', marks: 2 },
  { num: 5, difficulty: 'Moderate', text: 'Explain why electric current is said to have chemical effects.', marks: 2 },
  { num: 6, difficulty: 'Challenging', text: 'How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.', marks: 2 },
  { num: 7, difficulty: 'Challenging', text: 'What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.', marks: 2 },
  { num: 8, difficulty: 'Easy', text: 'Mention the type of current used in electroplating and justify why it is used.', marks: 2 },
  { num: 9, difficulty: 'Moderate', text: 'What is the importance of electric current in the field of metallurgy?', marks: 2 },
  { num: 10, difficulty: 'Challenging', text: 'Explain with a chemical equation how copper is deposited during the electroplating of an object.', marks: 2 },
];

const ANSWERS = [
  { num: 1, text: 'Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.' },
  { num: 2, text: 'A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.' },
  { num: 3, text: 'Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity.' },
  { num: 4, text: 'An example is the electroplating of silver on jewelry to prevent tarnishing.' },
  { num: 5, text: 'Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.' },
  { num: 6, text: 'Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons:\n2H2O + 2e- → H2 + 2OH-\nNa+ + OH- → NaOH (in solution)' },
  { num: 7, text: 'At the cathode: water is reduced to hydrogen gas and hydroxide ions.\nAt the anode: water is oxidized to oxygen gas and hydrogen ions.' },
  { num: 8, text: 'Direct current (DC) is used because it produces a consistent flow of electrons necessary for controlled deposition of metals.' },
  { num: 9, text: 'Electric current helps extract metals from their ores and purify metals by electrolysis in metallurgy.' },
  { num: 10, text: 'During copper electroplating, copper ions in solution gain electrons at the cathode and deposit as copper metal:\nCu2+ + 2e- → Cu (solid)' },
];

export default function RedesignedHomePage() {
  return (
    <div style={{ width: '100%', maxWidth: 'min(1100px, 100%)', margin: '0 auto' }}>
      <div className="outer-paper-container">
        <div className="dark-banner-card">
          <p style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', margin: 0, lineHeight: 1.7, fontWeight: 500 }}>
            Certainly, Lakshya! Here are customized <u><strong>Question Paper</strong></u> for your <u><strong>CBSE Grade 8 Science</strong></u> classes on the <u><strong>NCERT chapters</strong></u>:
          </p>
        </div>

        <div className="paper-card" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#111827' }}>
          <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 700, textAlign: 'center', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
            Delhi Public School, Sector-4, Bokaro
          </h1>
          <h2 style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', fontWeight: 700, textAlign: 'center', margin: '0 0 6px 0' }}>
            Subject: Science
          </h2>
          <h3 style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', fontWeight: 700, textAlign: 'center', margin: '0 0 clamp(20px, 3vw, 28px) 0' }}>
            Class: 8th
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, borderBottom: '2px solid #111827', paddingBottom: 'clamp(10px, 1.2vw, 14px)', marginBottom: 'clamp(16px, 2vw, 20px)', gap: 12, flexWrap: 'wrap' }}>
            <span>Time Allowed: 45 minutes</span>
            <span>Maximum Marks: 20</span>
          </div>

          <p style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, margin: '0 0 clamp(20px, 2.5vw, 24px) 0' }}>
            All questions are compulsory unless stated otherwise.
          </p>

          <div className="student-fields-grid" style={{ marginBottom: 'clamp(28px, 3.5vw, 36px)', fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700 }}>
            <div>Name: <span style={{ borderBottom: '2px solid #111827', display: 'inline-block', minWidth: 'clamp(120px, 18vw, 160px)' }}>&nbsp;</span></div>
            <div>Roll Number: <span style={{ borderBottom: '2px solid #111827', display: 'inline-block', minWidth: 'clamp(120px, 18vw, 160px)' }}>&nbsp;</span></div>
            <div>Section: <span style={{ borderBottom: '2px solid #111827', display: 'inline-block', minWidth: 'clamp(80px, 12vw, 100px)' }}>&nbsp;</span></div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 2.5vw, 24px)' }}>
            <h4 style={{ fontSize: 'clamp(17px, 1.6vw, 20px)', fontWeight: 700, margin: '0 0 clamp(14px, 1.8vw, 18px) 0' }}>Section A</h4>
            <h5 style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700, textAlign: 'left', margin: '0 0 6px 0' }}>Short Answer Questions</h5>
            <p style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontStyle: 'italic', color: '#4B5563', textAlign: 'left', margin: 0 }}>Attempt all questions. Each question carries 2 marks</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 1.5vw, 18px)', marginBottom: 'clamp(28px, 4vw, 36px)' }}>
            {QUESTIONS.map((q) => (
              <div key={q.num} className="question-item">
                <span className="question-num" style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700, minWidth: 24, textAlign: 'right', flexShrink: 0 }}>
                  {q.num}.
                </span>
                <div className="question-text-block" style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700, lineHeight: 1.7 }}>
                  [{q.difficulty}] {q.text}
                </div>
                <span className="question-marks" style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700 }}>
                  [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700, textAlign: 'center', margin: '0 0 clamp(28px, 4vw, 36px) 0', borderBottom: '2px solid #111827', paddingBottom: 'clamp(20px, 2.5vw, 24px)' }}>
            End of Question Paper
          </p>

          <div>
            <h4 style={{ fontSize: 'clamp(17px, 1.6vw, 20px)', fontWeight: 700, margin: '0 0 clamp(16px, 2vw, 20px) 0' }}>Answer Key:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 1.8vw, 18px)' }}>
              {ANSWERS.map((a) => (
                <div key={a.num} className="question-item">
                  <span className="question-num" style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', fontWeight: 700, minWidth: 24, textAlign: 'right', flexShrink: 0 }}>
                    {a.num}.
                  </span>
                  <div className="question-text-block" style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
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
