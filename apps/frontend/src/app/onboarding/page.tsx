'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  School, 
  BookOpen, 
  Users, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface StudentInput {
  name: string;
  rollNo: string;
  email: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding, isAuthenticated, isLoading } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  
  // Student roster state
  const [students, setStudents] = useState<StudentInput[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingProgressText, setOnboardingProgressText] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setInstitutionName(user.institutionName || '');
      setDepartment(user.departmentName || '');
    }
  }, [user]);

  // Protect route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712', color: 'white' }}>
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const addStudent = () => {
    if (!newStudentName.trim()) {
      toast.error('Student name is required');
      return;
    }
    const roll = newStudentRoll.trim() || `R-${Date.now().toString().slice(-4)}`;
    const email = newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@school.edu`;

    setStudents([
      ...students,
      { name: newStudentName.trim(), rollNo: roll, email }
    ]);

    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentEmail('');
    toast.success(`${newStudentName} added to roster`);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    if (step === 1 && (!firstName.trim() || !lastName.trim())) {
      toast.error('Please enter your first and last name.');
      return;
    }
    if (step === 2 && !institutionName.trim()) {
      toast.error('Please enter your college/university name.');
      return;
    }
    if (step === 3 && !department.trim()) {
      toast.error('Please enter your department name.');
      return;
    }
    if (step === 4 && (!className.trim() || !subject.trim())) {
      toast.error('Please enter your class name and subject.');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    
    // Simulate progression logs
    const logs = [
      'Updating your profile information...',
      'Provisioning new Institution tenant...',
      'Setting up Academic Department structures...',
      'Creating class syllabus group...',
      'Importing student rosters and emails...',
      'Finalizing deployment...'
    ];

    for (let i = 0; i < logs.length; i++) {
      setOnboardingProgressText(logs[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const result = await completeOnboarding({
      firstName,
      lastName,
      institutionName,
      department,
      className,
      subject,
      students
    });

    if (result.success) {
      toast.success('Onboarding complete!');
      setStep(6);
    } else {
      setIsSubmitting(false);
      toast.error(result.error || 'Failed to complete onboarding. Please try again.');
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="onboarding-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .onboarding-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030712;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        .glow-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234, 88, 12, 0.12) 0%, rgba(0, 0, 0, 0) 70%);
          top: -10%;
          left: -10%;
          filter: blur(85px);
          pointer-events: none;
        }

        .glow-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
          bottom: -10%;
          right: -10%;
          filter: blur(100px);
          pointer-events: none;
        }

        .grid-mask {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at 50% 50%, black, transparent 80%);
          pointer-events: none;
        }

        .glass-card {
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 44px 40px;
          width: 100%;
          max-width: 640px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          position: relative;
          z-index: 10;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
        }

        .indicator-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.3s;
          border: 2px solid rgba(255,255,255,0.1);
          color: #9CA3AF;
          background: rgba(255,255,255,0.02);
          z-index: 2;
        }

        .indicator-dot.active {
          border-color: #EA580C;
          color: white;
          background: #EA580C;
          box-shadow: 0 0 12px rgba(234, 88, 12, 0.4);
        }

        .indicator-dot.completed {
          border-color: #10B981;
          color: white;
          background: #10B981;
        }

        .indicator-line {
          position: absolute;
          height: 2px;
          background: rgba(255,255,255,0.06);
          top: 50%;
          left: 16px;
          right: 16px;
          transform: translateY(-50%);
          z-index: 1;
        }

        .onboarding-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .onboarding-input:focus {
          border-color: #EA580C;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.25);
        }

        .student-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .student-initial {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(234, 88, 12, 0.15);
          color: #EA580C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(234, 88, 12, 0.4);
        }

        .btn-outline {
          background: transparent;
          color: #E5E7EB;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.25);
        }

        .step-title {
          font-size: 24px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
      ` }} />

      <div className="glow-1" />
      <div className="glow-2" />
      <div className="grid-mask" />

      <div className="glass-card">
        {step < 6 && (
          <div className="step-indicator">
            <div className="indicator-line" />
            {[1, 2, 3, 4, 5].map((idx) => {
              const active = idx === step;
              const completed = idx < step;
              return (
                <div 
                  key={idx} 
                  className={`indicator-dot ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
                >
                  {completed ? <Check size={14} /> : idx}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '40px 0' }}
            >
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: '3px solid rgba(234, 88, 12, 0.1)',
                  borderTopColor: '#EA580C',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 12,
                  border: '3px solid rgba(99, 102, 241, 0.1)',
                  borderBottomColor: '#6366F1',
                  borderRadius: '50%',
                  animation: 'spin 1.5s linear reverse infinite'
                }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: 12 }}>Configuring Your Workspace</h2>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>{onboardingProgressText}</p>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div style={{ marginBottom: 28 }}>
                <h2 className="step-title">
                  <GraduationCap className="text-orange-500" size={26} />
                  Faculty Profile Details
                </h2>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: 6 }}>Confirm your details as an academic educator.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>First Name</label>
                  <input 
                    type="text" 
                    className="onboarding-input" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Last Name</label>
                  <input 
                    type="text" 
                    className="onboarding-input" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleNextStep} className="btn-primary">
                  Next Step <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div style={{ marginBottom: 28 }}>
                <h2 className="step-title">
                  <School className="text-orange-500" size={26} />
                  Your Institution/College
                </h2>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: 6 }}>Enter the college, school, or university where you teach.</p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Institution Name</label>
                <input 
                  type="text" 
                  className="onboarding-input" 
                  placeholder="e.g. Stanford University, IIT Delhi"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={handlePrevStep} className="btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleNextStep} className="btn-primary">
                  Next Step <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : step === 3 ? (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div style={{ marginBottom: 28 }}>
                <h2 className="step-title">
                  <BookOpen className="text-orange-500" size={26} />
                  Academic Department
                </h2>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: 6 }}>Specify your teaching division or department.</p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Department Name</label>
                <input 
                  type="text" 
                  className="onboarding-input" 
                  placeholder="e.g. Computer Science, Mechanical Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={handlePrevStep} className="btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleNextStep} className="btn-primary">
                  Next Step <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : step === 4 ? (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div style={{ marginBottom: 28 }}>
                <h2 className="step-title">
                  <Users className="text-orange-500" size={26} />
                  Your First Class
                </h2>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: 6 }}>Onboard your first class group of students.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Class Name</label>
                  <input 
                    type="text" 
                    className="onboarding-input" 
                    placeholder="e.g. Class 10-A, B.Tech CSE 2A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Subject</label>
                  <input 
                    type="text" 
                    className="onboarding-input" 
                    placeholder="e.g. Computer Science, Calculus"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={handlePrevStep} className="btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleNextStep} className="btn-primary">
                  Configure Students <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : step === 5 ? (
            <motion.div
              key="step5"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div style={{ marginBottom: 20 }}>
                <h2 className="step-title">
                  <Users className="text-orange-500" size={26} />
                  Add Students (Roster)
                </h2>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: 6 }}>Build your student list for {className || 'the new class'}.</p>
              </div>

              {/* Add Student Inputs */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: 18, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9CA3AF' }}>Student Name</label>
                    <input 
                      type="text" 
                      className="onboarding-input" 
                      style={{ marginTop: 4, padding: '10px 12px' }}
                      placeholder="Alice Johnson"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9CA3AF' }}>Roll Number</label>
                    <input 
                      type="text" 
                      className="onboarding-input" 
                      style={{ marginTop: 4, padding: '10px 12px' }}
                      placeholder="R-101"
                      value={newStudentRoll}
                      onChange={(e) => setNewStudentRoll(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#9CA3AF' }}>Email Address</label>
                    <input 
                      type="email" 
                      className="onboarding-input" 
                      style={{ marginTop: 4, padding: '10px 12px' }}
                      placeholder="alice@school.edu"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={addStudent} className="btn-primary" style={{ padding: '10px 18px', height: 43 }}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Visual roster list */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: 24, paddingRight: 6 }}>
                {students.map((stud, idx) => (
                  <div key={idx} className="student-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="student-initial">
                        {stud.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{stud.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{stud.rollNo} &bull; {stud.email}</div>
                      </div>
                    </div>
                    <button onClick={() => removeStudent(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 6 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {students.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>
                    No students added yet. You can also skip this and add them later.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between' }}>
                <button onClick={handlePrevStep} className="btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={submitOnboarding} className="btn-primary">
                  Complete Setup <Sparkles size={14} fill="white" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', padding: '24px 0' }}
            >
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
              }}>
                <Check size={36} strokeWidth={3} />
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 850, color: 'white', letterSpacing: '-0.8px', marginBottom: 12 }}>
                You&apos;re All Set!
              </h2>
              <p style={{ color: '#9CA3AF', fontSize: '15px', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.6 }}>
                Your institution <strong>{institutionName}</strong> and department has been successfully linked. Class <strong>{className}</strong> with {students.length} students is initialized!
              </p>

              <button 
                onClick={() => router.push('/dashboard')}
                className="btn-primary" 
                style={{ padding: '14px 44px', fontSize: '15px', margin: '0 auto' }}
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
