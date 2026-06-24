import React, { useEffect } from "react";
import { ArrowLeft, Shield, FileText, CheckCircle, Scale, ScrollText, Users, Lock, HeartHandshake } from "lucide-react";

interface LegalPageProps {
  initialTab: "privacy" | "terms";
  onBackToHome: () => void;
}

export default function LegalPage({ initialTab, onBackToHome }: LegalPageProps) {
  const [activeTab, setActiveTab] = React.useState<"privacy" | "terms">(initialTab);

  // Sync state if initialTab changes from parent
  useEffect(() => {
    setActiveTab(initialTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [initialTab]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e1e1a] font-sans pb-24">
      {/* Header element to align with landing page nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-black transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing Page</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Navigation Tabs Header */}
        <div className="border-b border-[#f3ede4] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#e05934] font-bold">
              Legal Compliance & Trust Framework
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-950 mt-1 tracking-tight">
              {activeTab === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Last updated: June 23, 2026 • Version 2.1.2-PROD
            </p>
          </div>

          <div className="flex bg-[#f3ede4]/40 p-1 rounded-xl border border-[#f3ede4] self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "privacy"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "terms"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12 items-start">
          
          {/* Quick Sidebar Summary Widget */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#f3ede4] rounded-2xl p-6 shadow-xs">
              <h3 className="font-display font-bold text-sm text-gray-900 tracking-tight flex items-center space-x-2 pb-4 border-b border-gray-50">
                <ScrollText className="w-4 h-4 text-[#e05934]" />
                <span>Document Core Summary</span>
              </h3>
              
              <div className="space-y-4 mt-5">
                {activeTab === "privacy" ? (
                  <>
                    <div className="flex gap-3">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Data Security</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          All scanned exams and grades are AES-256 encrypted at rest and TLS 1.3 encrypted in transit.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Student Privacy</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          Fully FERPA and COPPA compliant. We do not sell or monetize student records to third parties.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Your Rights</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          Schools can request complete data purge at any point. Transparent audit logs are generated for all teacher actions.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Teacher Authority</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          AI provides advisory scoring only. All final grades remain under exclusive human control and validation.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <HeartHandshake className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Fair Use & Rubrics</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          Schools own the intellectual property of uploaded tests, rubrics, and feedback texts.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">System Integrity</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          Attempting to reverse-engineer matching models or deploying scraping vectors constitutes block list violation.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[#f3ede4]/20 border border-[#f3ede4]/60 rounded-2xl p-6">
              <p className="text-xs font-bold text-gray-800 leading-normal">Need Direct Clarification?</p>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                If you have queries regarding FERPA compliance, SOC 2 audit sheets, or educational agreements, our compliance desk is ready to answer.
              </p>
              <a 
                href="mailto:compliance@vidyaai.edu"
                className="inline-block text-xs font-bold text-[#e05934] hover:underline mt-3"
              >
                compliance@vidyaai.edu →
              </a>
            </div>
          </div>

          {/* Core Text Section */}
          <div className="lg:col-span-8 bg-white border border-[#f3ede4] rounded-2xl p-6 sm:p-10 shadow-md">
            
            {activeTab === "privacy" ? (
              /* Privacy Policy Text block */
              <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
                
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    1. Commitment to Student Privacy
                  </h2>
                  <p>
                    VidyaAI ("Platform", "we", "us") prioritizes the absolute security and privacy of classroom data. We serve as a direct Data Processor on behalf of educational organizations, adhering to strictly validated international laws governing student data records.
                  </p>
                  <p className="mt-2">
                    In compliance with the <strong>Family Educational Rights and Privacy Act (FERPA)</strong> and the <strong>Children's Online Privacy Protection Act (COPPA)</strong>, we never establish direct monetization profiles or distribute academic records for marketing purposes.
                  </p>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    2. Types of Data We Process
                  </h2>
                  <p>
                    To operate our subjective evaluation assistance tools, we collect and store:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5 font-sans">
                    <li>
                      <strong className="text-gray-800">Scanned Student Answer Papers:</strong> Hand-written sheets or digital documents uploaded directly by verified instructional staff.
                    </li>
                    <li>
                      <strong className="text-gray-800">Teacher Assessments & Rubric Sets:</strong> Benchmark outlines, marks limits, specialized criteria, and custom curriculum parameters.
                    </li>
                    <li>
                      <strong className="text-gray-800">Assigned Student Identifiers:</strong> Names and roll number maps explicitly submitted by administrators to keep registries synchronized. This directory is heavily locked to your institutional partition.
                    </li>
                    <li>
                      <strong className="text-gray-800">Grading Logs and Metrics:</strong> Historic timelines of evaluations generated, latency offsets, and audit parameters to highlight classroom gaps.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    3. AI Processing & Large Language Models
                  </h2>
                  <p>
                    VidyaAI leverages secure, enterprise-grade AI LLM model endpoints. Crucially, <strong>our model configurations explicitly opt-out of data reuse pipelines</strong>:
                  </p>
                  <div className="bg-[#fcfbf9] border border-[#f3ede4] p-3.5 rounded-xl font-mono text-[10px] my-3 text-gray-700 leading-normal">
                    📍 NO STUDENT ASSESSMENTS, SCORED COERCIONS, OR FEEDBACK PARAGRAPHS ARE RETAINED BY PUBLIC TRAINING PIPELINES. DATA PARSING ENDPOINTS EXCLUSIVELY EVALUATE COGNITIVE RUBRICS AND IMMEDIATELY FORGET THE SCANNED CONCRETE VALUES ONCE SENT IN INLINE RESULTS.
                  </div>
                  <p>
                    This guarantees that your school's unique curriculum, evaluation metrics, and student responses remain fully private and unshared.
                  </p>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    4. Cybersecurity Architecture & Retention
                  </h2>
                  <p>
                    Information security maintains several layers of redundancy and proactive encryption measures:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li><strong className="text-gray-800">In Transit:</strong> Secured using End-to-End TLS 1.3 standard tunnels.</li>
                    <li><strong className="text-gray-800">At Rest:</strong> Hardened databases utilize AES-256 system storage blocks.</li>
                    <li><strong className="text-gray-800">Retention:</strong> Scanned paper assets are safely deleted after the designated grading semester term, or immediately upon deletion requests from the respective headmaster partition.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    5. Contact & Audits
                  </h2>
                  <p>
                    Administrators have complete rights to trigger full CSV data exports or schedule programmatic partition cleanups. For secure sandbox compliance reviews, email our Chief Information Security Officer at <a href="mailto:ciso@vidyaai.edu" className="text-[#e05934] hover:underline font-bold">ciso@vidyaai.edu</a>.
                  </p>
                </section>

              </div>
            ) : (
              /* Terms of Conditions Text block */
              <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
                
                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    1. Terms of Agreement Overview
                  </h2>
                  <p>
                    Welcome to VidyaAI. By provisioning institutional seats, activating teacher accounts, or uploading subjective student exams, your organization ("Subscriber", "you", "User") agrees to be programmatically bound by these terms. If you operate on behalf of a public or private school body, you represent that you hold full corporate authority to consent on behalf of your respective district.
                  </p>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    2. AI Copilot Advisory Limits
                  </h2>
                  <p>
                    VidyaAI serves strictly as a **subjective diagnostic assistant (Copilot)** for academic grading tasks:
                  </p>
                  <div className="bg-[#fcfbf9] border border-[#f3ede4] p-3.5 rounded-xl font-mono text-[10px] my-3 text-gray-700 leading-normal">
                    ⚠️ THE SOFTWARE GENERATES ADVISORY SCORE PROFILES AND SUGGESTIVE FEEDBACK PARAGRAPHS BASED ON SELECTED RUBRICS. ALL RESULTS ARE EXPLICITLY CLASSIFIED AS INTERMEDIATE WORK PRODUCTS. INSTRUCTIONAL STAFF ARE MANDATED TO PERSONALLY AUDIT, ACCEPT, OR OVERRIDE ALL SCORES PRIOR TO SYNC JOINING DISTRICT LER/SIS SYSTEM SHEETS.
                  </div>
                  <p>
                    We hold no liability for final course grades, report-card distribution disagreements, or general student/parent performance disputes resulting from grading parameters.
                  </p>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    3. Intellectual Property Rights
                  </h2>
                  <p>
                    We cherish ownership rights and support authentic licensing environments:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>
                      <strong className="text-gray-800">Your Stuff:</strong> The institution retains original ownership over all uploaded test queries, written student exam answers, and tailored local rubrics. We acquire a non-exclusive license only to process this content dynamically.
                    </li>
                    <li>
                      <strong className="text-gray-800">Our Stuff:</strong> VidyaAI owns the proprietary platform layout, core OCR parsing matrices, prompt construction architectures, code blocks, visual assets, and analytics generation mechanics.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    4. Prohibited System Use
                  </h2>
                  <p>
                    Account holders must maintain general code of conduct standards. The following activities will trigger instant account termination:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>Utilizing programmatic scraper scripts to extract other class directories or evaluation layouts.</li>
                    <li>Employing automated bot submissions to overload OCR or grading processing services.</li>
                    <li>Leveraging scoring outputs to intentionally build competing automated assessment software blocks.</li>
                    <li>Circumventing localized user security scopes or credentials interfaces.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2 mb-3">
                    5. Resolution & Liability Limitations
                  </h2>
                  <p>
                    THESE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY EDUCATIONAL STATUTES, IN NO EVENT SHALL VIDYAAI BE LIABLE FOR SPECIAL, CONSEQUENTIAL, OR DIRECT INDEMNITIES ASSOCIATED WITH SERVICES INTERRUPTIONS, GRADES LATENCY, OR SCHOOL INTRANET OUTAGES.
                  </p>
                </section>

              </div>
            )}

            {/* Back action to reinforce navigation */}
            <div className="mt-12 pt-6 border-t border-[#f3ede4] flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                School board compliant documentation.
              </span>
              <button
                onClick={onBackToHome}
                className="px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 text-xs font-semibold tracking-wide transition-all shadow-xs"
              >
                Accept and Close Reader
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
