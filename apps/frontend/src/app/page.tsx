'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, Plus, Check, Play, Brain, Shield, Sparkles, BookOpen, Clock, Calendar, BarChart2, MessageSquare, Users, Mail } from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="landing-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .landing-root {
          min-height: 100vh;
          background-color: #FAFAFA;
          color: #111111;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        
        /* Navbar */
        .landing-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 40px;
          max-width: 1200px;
          margin: 0 auto;
          background: transparent;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 800;
          color: #111111;
          text-decoration: none;
        }
        .logo-box {
          width: 24px;
          height: 24px;
          background: #2563EB;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 14px;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          font-size: 15px;
          color: #555555;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #111111;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-signin {
          font-size: 15px;
          color: #111111;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          padding: 10px 20px;
          border-radius: 100px;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .btn-signin:hover {
          background: #F9FAFB;
        }
        .btn-primary-blue {
          font-size: 15px;
          color: #FFFFFF;
          background: #111111;
          padding: 10px 24px;
          border-radius: 100px;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.2s, transform 0.2s;
        }
        .btn-primary-blue:hover {
          background: #222222;
          transform: translateY(-1px);
        }

        /* Hero */
        .hero-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px 100px;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 60px;
          align-items: center;
        }
        @media (max-width: 960px) {
          .hero-section {
            grid-template-columns: 1fr;
            padding: 40px 20px;
            gap: 40px;
          }
        }
        
        .badge-new {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #EFF6FF;
          border-radius: 100px;
          padding: 6px 14px 6px 6px;
          font-size: 13px;
          margin-bottom: 24px;
          border: 1px solid #DBEAFE;
        }
        .badge-new-pill {
          background: #2563EB;
          color: white;
          font-weight: 700;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 100px;
          text-transform: uppercase;
        }
        .badge-new-text {
          color: #2563EB;
          font-weight: 600;
        }

        .hero-title {
          font-size: clamp(38px, 4.5vw, 56px);
          font-weight: 800;
          line-height: 1.15;
          color: #111111;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
        }
        .hero-desc {
          font-size: 16px;
          color: #555555;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 480px;
        }
        
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .btn-large-blue {
          font-size: 16px;
          color: #FFFFFF;
          background: #2563EB;
          padding: 16px 32px;
          border-radius: 100px;
          text-decoration: none;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s, background-color 0.2s;
        }
        .btn-large-blue:hover {
          transform: translateY(-2px);
          background: #1D4ED8;
        }
        .btn-large-outline {
          font-size: 16px;
          color: #111111;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          padding: 16px 32px;
          border-radius: 100px;
          text-decoration: none;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          transition: background-color 0.2s;
        }
        .btn-large-outline:hover {
          background: #F9FAFB;
        }

        .reviews-summary {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .review-avatars {
          display: flex;
          align-items: center;
        }
        .review-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          margin-left: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }
        .review-avatar:first-child {
          margin-left: 0;
        }

        /* Mockup Pane */
        .mockup-pane {
          position: relative;
          width: 100%;
          height: 440px;
        }
        @media (max-width: 960px) {
          .mockup-pane {
            height: 380px;
          }
        }
        .mock-card-main {
          position: absolute;
          left: 12%;
          top: 5%;
          width: 75%;
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid #E5E7EB;
          padding: 24px;
          z-index: 2;
        }
        .mock-card-floating-1 {
          position: absolute;
          left: -2%;
          bottom: 5%;
          width: 48%;
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          border: 1px solid #E5E7EB;
          padding: 20px;
          z-index: 3;
        }
        .mock-card-floating-2 {
          position: absolute;
          right: 2%;
          bottom: 12%;
          width: 42%;
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          border: 1px solid #E5E7EB;
          padding: 16px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Trusted section */
        .trusted-section {
          padding: 60px 40px;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .trusted-title {
          font-size: 13px;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
        }
        .trusted-logos {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 60px;
        }
        .trusted-logo {
          font-size: 17px;
          font-weight: 700;
          color: #9CA3AF;
          transition: color 0.2s;
        }
        .trusted-logo:hover {
          color: #111111;
        }

        /* Experience Learning */
        .experience-section {
          background-color: #FFFFFF;
          padding: 100px 40px;
          border-top: 1px solid #E5E7EB;
        }
        .experience-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .experience-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          align-items: center;
          margin-top: 48px;
        }
        @media (max-width: 900px) {
          .experience-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .mock-dashboard {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #F3F4F6;
          padding-bottom: 16px;
        }
        .dashboard-pill-row {
          display: flex;
          gap: 8px;
        }
        .dashboard-pill {
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          background: #F3F4F6;
          color: #6B7280;
          cursor: pointer;
        }
        .dashboard-pill.active {
          background: #2563EB;
          color: #FFFFFF;
        }
        .metric-box-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .metric-card {
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px;
        }
        .metric-val {
          font-size: 24px;
          font-weight: 800;
          color: #111111;
        }
        .metric-lbl {
          font-size: 12px;
          color: #6B7280;
          margin-top: 4px;
        }

        .features-2x2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 480px) {
          .features-2x2 {
            grid-template-columns: 1fr;
          }
        }
        .feature-card-item {
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 24px;
        }
        .feature-card-item h4 {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Smart Features */
        .smart-features-section {
          padding: 100px 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid #E5E7EB;
        }
        .smart-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          margin-top: 48px;
        }
        @media (max-width: 900px) {
          .smart-grid {
            grid-template-columns: 1fr;
          }
        }
        .smart-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .smart-card-full {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.01);
        }
        .smart-sub-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
        }
        @media (max-width: 600px) {
          .smart-sub-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Steps Section */
        .steps-section {
          padding: 100px 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid #E5E7EB;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 32px;
          margin-top: 48px;
          margin-bottom: 48px;
        }
        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
        .step-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 32px;
          position: relative;
        }
        .step-num {
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 13px;
          font-weight: 700;
          color: #2563EB;
          background: #EFF6FF;
          padding: 4px 10px;
          border-radius: 100px;
        }

        /* Testimonials */
        .testimonials-section {
          background-color: #FFFFFF;
          padding: 100px 40px;
          border-top: 1px solid #E5E7EB;
        }
        .testimonial-carousel {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          padding-bottom: 24px;
          max-width: 1200px;
          margin: 48px auto 0;
          scroll-snap-type: x mandatory;
        }
        .testimonial-card-item {
          flex: 0 0 350px;
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 28px;
          scroll-snap-align: start;
        }
        
        /* Stats strip */
        .stats-strip {
          background: #111111;
          color: #FFFFFF;
          padding: 60px 40px;
        }
        .stats-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          text-align: center;
        }
        @media (max-width: 768px) {
          .stats-container {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .stats-container {
            grid-template-columns: 1fr;
          }
        }
        .stat-number {
          font-size: 40px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 13px;
          opacity: 0.85;
        }

        /* Pricing Section */
        .pricing-section {
          padding: 100px 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid #E5E7EB;
        }
        .pricing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 48px;
        }
        .pricing-toggle-bg {
          background: #F3F4F6;
          border-radius: 100px;
          padding: 4px;
          display: flex;
        }
        .pricing-toggle-btn {
          padding: 8px 18px;
          border-radius: 100px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: #6B7280;
        }
        .pricing-toggle-btn.active {
          background: #FFFFFF;
          color: #111111;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 32px;
        }
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
        .pricing-card-col {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
        }
        .pricing-card-col.featured {
          border-color: #111111;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }
        .price-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .price-sub {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 24px;
        }
        .price-value {
          font-size: 36px;
          font-weight: 900;
          margin-bottom: 24px;
        }
        .price-value span {
          font-size: 14px;
          color: #6B7280;
          font-weight: 500;
        }
        .btn-pricing {
          width: 100%;
          padding: 12px;
          border-radius: 100px;
          text-align: center;
          font-weight: 700;
          text-decoration: none;
          margin-bottom: 32px;
          display: block;
          transition: background-color 0.2s;
        }
        .btn-pricing-outline {
          background: #FAFAFA;
          color: #111111;
          border: 1px solid #E5E7EB;
        }
        .btn-pricing-outline:hover {
          background: #F3F4F6;
        }
        .btn-pricing-blue {
          background: #111111;
          color: #FFFFFF;
        }
        .btn-pricing-blue:hover {
          background: #222222;
        }
        .pricing-features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 14px;
          color: #555555;
        }
        .pricing-feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Newsletter Banner */
        .newsletter-section {
          padding: 60px 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid #E5E7EB;
        }
        .newsletter-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 60px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
        }
        @media (max-width: 768px) {
          .newsletter-card {
            flex-direction: column;
            text-align: center;
            padding: 40px 20px;
          }
        }
        .newsletter-form {
          display: flex;
          gap: 12px;
          width: 100%;
          max-width: 440px;
        }
        .newsletter-input {
          flex: 1;
          border: 1px solid #E5E7EB;
          border-radius: 100px;
          padding: 14px 24px;
          font-size: 15px;
          outline: none;
          background: #FFFFFF;
        }
        .btn-subscribe {
          background: #111111;
          color: white;
          border: none;
          border-radius: 100px;
          padding: 14px 28px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-subscribe:hover {
          background: #222222;
        }

        /* Footer */
        .footer-main {
          border-top: 1px solid #E5E7EB;
          padding: 80px 40px 40px;
          background: #FAFAFA;
        }
        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 48px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
        .footer-col-title {
          font-weight: 700;
          font-size: 14px;
          color: #111111;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-links-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-link {
          color: #6B7280;
          text-decoration: none;
          font-size: 14px;
        }
        .footer-link:hover {
          color: #111111;
        }
        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: #EFF6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563EB;
          margin-bottom: 24px;
        }
        .section-tag {
          color: #2563EB;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          display: block;
        }
      ` }} />

      {/* Navigation */}
      <nav className="landing-nav">
        <Link href="/" className="nav-logo">
          <div className="logo-box">S</div>
          <span>Shiksha AI</span>
        </Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="/login" className="nav-link">LMS Portal</a>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="btn-signin">Sign In</Link>
          <Link href="/register" className="btn-primary-blue">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Left Side: Brand Text & Actions */}
        <div>
          <div className="badge-new">
            <span className="badge-new-pill">New</span>
            <span className="badge-new-text">Advanced AI Grader & Bloom's Taxonomy Integration &gt;</span>
          </div>

          <h1 className="hero-title">
            Track Your Learning Progress
          </h1>
          <p className="hero-desc">
            Stay on top of curriculum mapping, automatic essay grading, and cognitive depth analytics with our intelligent assessment creation platform.
          </p>

          <div className="hero-actions">
            <Link href="/register" className="btn-large-blue">
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn-large-outline">
              Learn More
            </Link>
          </div>

          <div className="reviews-summary">
            <div className="review-avatars">
              <div className="review-avatar" style={{ backgroundColor: '#4F46E5' }}>A</div>
              <div className="review-avatar" style={{ backgroundColor: '#2563EB' }}>P</div>
              <div className="review-avatar" style={{ backgroundColor: '#10B981' }}>R</div>
              <div className="review-avatar" style={{ backgroundColor: '#6B7280' }}>S</div>
            </div>
            <span style={{ fontSize: '14px', color: '#555' }}>
              <strong>4.9 ★</strong> trusted by 10k+ educators worldwide
            </span>
          </div>
        </div>

        {/* Right Side: Overlapping UI Mockups */}
        <div className="mockup-pane">
          {/* Main Card - List of Generated Question Papers */}
          <div className="mock-card-main">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Active Question Papers</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF', cursor: 'pointer' }}>View All</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Algebra Fundamentals', lessons: '12 questions', level: 'CBSE Stage 3', color: '#EFF6FF', tagColor: '#2563EB' },
                { name: 'Organic Chemistry II', lessons: '24 questions', level: 'CBSE Stage 4', color: '#EEF2FF', tagColor: '#4F46E5' },
                { name: 'Sanskrit Grammar Basic', lessons: '15 questions', level: 'CBSE Stage 2', color: '#ECFDF5', tagColor: '#10B981' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx < 2 ? '1px solid #F3F4F6' : 'none' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{item.lessons}</p>
                  </div>
                  <span style={{ backgroundColor: item.color, color: item.tagColor, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px' }}>
                    {item.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Card 1: Quick Generate Widget */}
          <div className="mock-card-floating-1">
            <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: 800, margin: '0 0 4px 0' }}>GENERATE</p>
            <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>Create Interactive Quiz</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Topic, e.g. Fractions"
                defaultValue="Fractions"
                readOnly
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <button style={{ width: '100%', background: '#111111', color: 'white', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Generate Quiz
            </button>
          </div>

          {/* Floating Card 2: Analytics Stats */}
          <div className="mock-card-floating-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#ECFDF5', color: '#10B981', padding: '4px', borderRadius: '6px' }}>
                <Check size={16} />
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>AI Grading Output</span>
            </div>
            <p style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>15 / 20 <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>correct answers</span></p>
          </div>
        </div>
      </section>

      {/* Trusted Partners */}
      <section className="trusted-section">
        <p className="trusted-title">We are trusted by leading academies</p>
        <div className="trusted-logos">
          <span className="trusted-logo">Delhi Public School</span>
          <span className="trusted-logo">CBSE Board</span>
          <span className="trusted-logo">Green Valley</span>
          <span className="trusted-logo">National Academy</span>
          <span className="trusted-logo">Pearson Edu</span>
        </div>
      </section>

      {/* Section: Experience Learning Like Never Before */}
      <section id="about" className="experience-section">
        <div className="experience-container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <span className="section-tag">Overview</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>Experience Learning Like Never Before</h2>
            <p style={{ color: '#6B7280', marginTop: '12px' }}>
              Stay motivated, track your progress, and connect with a community—all in one seamless platform.
            </p>
          </div>

          <div className="experience-grid">
            {/* Mock Dashboard */}
            <div className="mock-dashboard">
              <div className="dashboard-header">
                <span style={{ fontWeight: 800, fontSize: '16px' }}>Course Performance Tracker</span>
                <div className="dashboard-pill-row">
                  <span className="dashboard-pill active">Maths</span>
                  <span className="dashboard-pill">Science</span>
                  <span className="dashboard-pill">English</span>
                </div>
              </div>

              <div className="metric-box-row">
                <div className="metric-card">
                  <div className="metric-val">94%</div>
                  <div className="metric-lbl">Average Score</div>
                </div>
                <div className="metric-card">
                  <div className="metric-val">24 hrs</div>
                  <div className="metric-lbl">Time Saved</div>
                </div>
                <div className="metric-card">
                  <div className="metric-val">12</div>
                  <div className="metric-lbl">Exams Generated</div>
                </div>
              </div>

              <div style={{ height: 160, background: '#FAFAFA', border: '1px dashed #E5E7EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                [ Performance Analytics View ]
              </div>
            </div>

            {/* 2x2 Info Grid */}
            <div className="features-2x2">
              <div className="feature-card-item">
                <h4>
                  <Sparkles size={18} color="#2563EB" />
                  We're helpful
                </h4>
                <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.5 }}>
                  Get real-time feedback & tips to improve your grades and classroom efficiency.
                </p>
              </div>

              <div className="feature-card-item">
                <h4>
                  <Play size={18} color="#2563EB" />
                  We're engaging
                </h4>
                <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.5 }}>
                  Interactive quizzes, challenges & lessons built matching your student needs.
                </p>
              </div>

              <div className="feature-card-item">
                <h4>
                  <Users size={18} color="#2563EB" />
                  We're collaborative
                </h4>
                <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.5 }}>
                  Collaborate with classmates and teachers on group assignments easily.
                </p>
              </div>

              <div className="feature-card-item">
                <h4>
                  <Shield size={18} color="#2563EB" />
                  We're organized
                </h4>
                <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.5 }}>
                  Track deadlines, view syllabus mapping, and access resources in one secure dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Smart Features for Better Learning */}
      <section id="features" className="smart-features-section">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
          <span className="section-tag">Core Features</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>Smart Features for Better Learning</h2>
          <p style={{ color: '#6B7280', marginTop: '12px' }}>
            Trusted tools designed to streamline syllabus parsing, exam generation, and automatic grading metrics.
          </p>
        </div>

        <div className="smart-grid">
          {/* Column 1: Dashboard Calendar & Performance metrics */}
          <div className="smart-column">
            <div className="smart-card-full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>Track Performance Tracking</h3>
                <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Real-time updates</span>
              </div>
              <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
                Analyze monthly assessment curves and evaluate cognitive metrics using CBSET/State board criteria.
              </p>

              <div className="smart-sub-grid">
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>Weekly Stats</span>
                    <BarChart2 size={16} color="#2563EB" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>Sanskrit Quiz</span>
                      <strong>88% score</strong>
                    </div>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '88%', height: '100%', background: '#10B981' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 4 }}>
                      <span>Algebra Quiz</span>
                      <strong>92% score</strong>
                    </div>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '92%', height: '100%', background: '#2563EB' }} />
                    </div>
                  </div>
                </div>

                <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Total Saved Hours</span>
                  <p style={{ fontSize: '32px', fontWeight: 900, color: '#111111', margin: '8px 0' }}>148 hrs</p>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>↑ 12% from last month</span>
                </div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="smart-card-full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>Course Syllabus Mapping</h3>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Syllabus-Aligned</span>
              </div>
              <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
                Verify complete alignment with CBSE, ICSE, and various state boards on every generated paper.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0' }}>Grade 10 Maths</p>
                  <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#10B981', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>96% mapped</span>
                </div>
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0' }}>Grade 11 Chemistry</p>
                  <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#10B981', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>100% mapped</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Community and Interactive Quizzes */}
          <div className="smart-column">
            <div className="smart-card-full" style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>Strength in Community</h3>
              <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
                Connect, share question banks, and collaborate on rubric settings with teachers worldwide.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {[
                  { name: 'Apple Designer Group', members: '48 members', active: true },
                  { name: 'Facebook Developer Group', members: '154 members', active: false },
                  { name: 'Mod Web Design Group', members: '40 members', active: false }
                ].map((group, idx) => (
                  <div key={idx} style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{group.name}</p>
                      <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0 0' }}>{group.members}</p>
                    </div>
                    {group.active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', alignSelf: 'center' }} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="smart-card-full">
              <h3 style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>Interactive Quizzes</h3>
              <p style={{ color: '#555555', fontSize: '14px', margin: 0 }}>
                Test skills, earn points, and invite classmates to study sessions.
              </p>
              <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0' }}>Q: What is the derivative of x²?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button style={{ border: '1px solid #2563EB', color: '#2563EB', background: '#EFF6FF', borderRadius: '6px', padding: '8px', fontSize: '11px', fontWeight: 700 }}>2x (Correct)</button>
                  <button style={{ border: '1px solid #E5E7EB', background: 'none', borderRadius: '6px', padding: '8px', fontSize: '11px' }}>x</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Effortless Learning Experience */}
      <section className="steps-section">
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <span className="section-tag">Process</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>Effortless Learning Experience</h2>
          <p style={{ color: '#6B7280', marginTop: '12px' }}>
            Get started in just three quick steps. Create your profile, align your curriculum, and launch assessments.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">Step 1</span>
            <div className="feature-icon-wrapper">
              <Users size={20} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: 12 }}>Create Your Profile</h3>
            <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.5 }}>
              Register using your email or social accounts and customize your institutional preferences.
            </p>
          </div>

          <div className="step-card">
            <span className="step-num">Step 2</span>
            <div className="feature-icon-wrapper">
              <BookOpen size={20} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: 12 }}>Choose Your Class</h3>
            <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.5 }}>
              Select the appropriate board standards, subject criteria, and depth targets.
            </p>
          </div>

          <div className="step-card">
            <span className="step-num">Step 3</span>
            <div className="feature-icon-wrapper">
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: 12 }}>Join the Community</h3>
            <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.5 }}>
              Invite faculty members or students to complete evaluations and analyze results together.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/register" className="btn-primary-blue" style={{ padding: '14px 32px' }}>
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Section: What Our Experts Say */}
      <section className="testimonials-section">
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <span className="section-tag">Reviews</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>What Our Experts Say</h2>
          <p style={{ color: '#6B7280', marginTop: '12px' }}>
            Read feedback from leading teachers, principals, and department heads using Shiksha AI.
          </p>
        </div>

        <div className="testimonial-carousel">
          {[
            { quote: "Shiksha AI saves me hours of exam creation every single week.", author: "Dr. Ananya Sharma", role: "Professor, DPS Delhi" },
            { quote: "The curriculum mapping tool guarantees CBSE alignment on every paper.", author: "Rajesh Kumar", role: "Principal, Green Valley" },
            { quote: "Our teachers love the easy-to-use rubrics and instant PDF exports.", author: "Sneha Patel", role: "Department Head, CBSE" },
            { quote: "Automatic grading for essays has dramatically reduced our feedback cycle.", author: "Aron Smith", role: "Lecturer, Organic Chemistry" }
          ].map((test, idx) => (
            <div key={idx} className="testimonial-card-item">
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#2563EB" color="#2563EB" />
                ))}
              </div>
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#555555', lineHeight: 1.6, marginBottom: 20 }}>
                "{test.quote}"
              </p>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>{test.author}</strong>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{test.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Banner */}
      <section className="stats-strip">
        <div className="stats-container">
          <div>
            <div className="stat-number">15,000+</div>
            <div className="stat-label">Active Educators</div>
          </div>
          <div>
            <div className="stat-number">500+</div>
            <div className="stat-label">Schools Onboarded</div>
          </div>
          <div>
            <div className="stat-number">24/7</div>
            <div className="stat-label">AI Generation Available</div>
          </div>
          <div>
            <div className="stat-number">99.2%</div>
            <div className="stat-label">Teacher Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
          <span className="section-tag">Pricing</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>Choose Your Plan</h2>
          <p style={{ color: '#6B7280', marginTop: '12px' }}>
            Flexible subscription pricing curated for teachers, admins, and full educational institutions.
          </p>
        </div>

        <div className="pricing-toggle">
          <div className="pricing-toggle-bg">
            <button className={`pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`} onClick={() => setBillingCycle('monthly')}>Monthly</button>
            <button className={`pricing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`} onClick={() => setBillingCycle('yearly')}>Yearly (Save 20%)</button>
          </div>
        </div>

        <div className="pricing-grid">
          {/* Basic */}
          <div className="pricing-card-col">
            <h3 className="price-title">Free Plan</h3>
            <p className="price-sub">Perfect for trial testing and evaluation.</p>
            <div className="price-value">$0 <span>/ month</span></div>
            <Link href="/register" className="btn-pricing btn-pricing-outline">Get Started</Link>
            <div className="pricing-features-list">
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> 5 Generated Papers / mo</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Standard AI Engine</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> PDF Export Format</div>
            </div>
          </div>

          {/* Pro */}
          <div className="pricing-card-col featured">
            <h3 className="price-title">Pro Plan</h3>
            <p className="price-sub">Perfect for individual teachers and faculties.</p>
            <div className="price-value">{billingCycle === 'monthly' ? '$19' : '$15'} <span>/ month</span></div>
            <Link href="/register" className="btn-pricing btn-pricing-blue">Get Started</Link>
            <div className="pricing-features-list">
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Unlimited Papers</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Advanced Bloom's AI Engine</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> State Board Mapping</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> CSV & Docx Export</div>
            </div>
          </div>

          {/* Premium */}
          <div className="pricing-card-col">
            <h3 className="price-title">Premium Plan</h3>
            <p className="price-sub">Perfect for full schools & administrative groups.</p>
            <div className="price-value">{billingCycle === 'monthly' ? '$49' : '$39'} <span>/ month</span></div>
            <Link href="/register" className="btn-pricing btn-pricing-outline">Get Started</Link>
            <div className="pricing-features-list">
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Unlimited Everything</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Dedicated Grader API Access</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Multiple Org Admin Controls</div>
              <div className="pricing-feature-item"><Check size={16} color="#2563EB"/> Priority 24/7 Slack Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Join 5000+ Learners */}
      <section className="newsletter-section">
        <div className="newsletter-card">
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: '#111' }}>Join 5000+ Educators</h2>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>Stay updated with features, templates, and exam tips.</p>
          </div>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" className="newsletter-input" />
            <button className="btn-subscribe">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-main">
        <div className="footer-grid">
          <div>
            <div className="nav-logo" style={{ marginBottom: 16 }}>
              <div className="logo-box">S</div>
              <span style={{ color: '#111111', fontSize: '18px' }}>Shiksha AI</span>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
              Intelligent assessment creation and automatic grading platform for CBSE, ICSE, and state boards.
            </p>
          </div>
          
          <div>
            <h4 className="footer-col-title">Company</h4>
            <div className="footer-links-list">
              <Link href="#" className="footer-link">Home</Link>
              <Link href="#" className="footer-link">About</Link>
              <Link href="#" className="footer-link">Pricing</Link>
              <Link href="#" className="footer-link">Blog</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Support</h4>
            <div className="footer-links-list">
              <Link href="#" className="footer-link">Help Center</Link>
              <Link href="#" className="footer-link">FAQ</Link>
              <Link href="#" className="footer-link">Terms</Link>
              <Link href="#" className="footer-link">Privacy Policy</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Contact</h4>
            <div className="footer-links-list">
              <a href="mailto:support@shiksha.ai" className="footer-link">support@shiksha.ai</a>
              <span className="footer-link">Delhi, India</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 48, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#9CA3AF', maxWidth: '1200px', margin: '48px auto 0' }}>
          <span>&copy; 2026 Shiksha AI. All rights reserved.</span>
          <span style={{ color: '#111111', fontWeight: 600 }}>curated by Mobbin</span>
        </div>
      </footer>
    </div>
  );
}
