import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  ShieldCheck,
  Menu,
  X,
  Radar,
  LayoutGrid,
  CreditCard,
  BarChart3,
  CheckCircle2,
  Mail,
  Phone,
  Send,
  Car
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle.jsx";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About Us", href: "#about" },
  { label: "Contact Us", href: "#contact" },
];

const FEATURES_LIST = [
  {
    icon: Radar,
    title: "Real-Time Parking Availability",
    text: "Live occupancy data from every zone so drivers and operators always know exactly which spaces are free.",
  },
  {
    icon: LayoutGrid,
    title: "Smart Slot Management",
    text: "Assign, reserve, and reorganize slots automatically based on demand, vehicle size, and facility layout.",
  },
  {
    icon: Car,
    title: "Automated Gate & Entry",
    text: "Fast vehicle scanning and automatic check-in eliminate bottlenecks at entry and exit gates.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment Options",
    text: "Accept credit cards, mobile wallets, and contactless auto-pay with instant digital receipts.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    text: "Track occupancy trends, peak hours, and revenue metrics with clean visual dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "24/7 Security & Monitoring",
    text: "Integrated CCTV logging and automated alerts protect facilities and customer vehicles around the clock.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Search & Discover",
    desc: "Open ParkSafe to see real-time available parking spots near your destination with live pricing.",
  },
  {
    num: "02",
    title: "Reserve or Drive-In",
    desc: "Book your preferred slot in advance or simply drive in with automated license plate recognition.",
  },
  {
    num: "03",
    title: "Park & Auto-Pay",
    desc: "Park stress-free with guaranteed slots and complete contactless checkout upon departure.",
  },
];

export default function ShnoorParkingLanding({ setView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "how-it-works", "about", "contact"];
      const scrollY = window.scrollY;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop - 120;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileMenuOpen(false);
    const targetId = href.replace("#", "");
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  return (
    <div className="pw-landing-wrap">
      <header className="pw-landing-nav">
        <div className="pw-landing-nav-inner">
          <div className="pw-brand-badge" onClick={() => scrollTo("#home")}>
            <div className="pw-brand-logo-box">
              <span className="pw-p-logo">P</span>
            </div>
            <span className="pw-brand-word">ParkSafe</span>
          </div>

          <nav className={`pw-nav-links ${mobileMenuOpen ? "open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className={`pw-nav-link ${activeSection === link.href.replace("#", "") ? "active" : ""}`}
                onClick={() => scrollTo(link.href)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pw-nav-auth-actions">
            <ThemeToggle />
            <button
              type="button"
              className="pw-btn-nav-login"
              onClick={() => setView("login")}
            >
              Login
            </button>
            <button
              type="button"
              className="pw-btn-nav-signup"
              onClick={() => setView("signup")}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="pw-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <section id="home" className="pw-landing-hero">
        <div className="pw-hero-container">
          <div className="pw-hero-left">
            <h1 className="pw-hero-heading">
              Smarter Parking
              <br />
              for a <span className="pw-teal-text">Better Tomorrow</span>
            </h1>

            <p className="pw-hero-description">
              ParkSafe helps you find, book, and manage parking spaces with ease. Save time, reduce hassle, and enjoy a seamless parking experience.
            </p>

            <div className="pw-hero-buttons-row">
              <button
                type="button"
                className="pw-btn-hero-primary"
                onClick={() => setView("signup")}
              >
                Find Parking
              </button>
              <button
                type="button"
                className="pw-btn-hero-secondary"
                onClick={() => scrollTo("#features")}
              >
                Learn More
              </button>
            </div>

            <div className="pw-features-three-pills">
              <div className="pw-feature-pill" onClick={() => scrollTo("#features")}>
                <div className="pw-pill-icon-circle">
                  <Search size={18} />
                </div>
                <div className="pw-pill-text-block">
                  <h4 className="pw-pill-title">Find Parking</h4>
                  <p className="pw-pill-desc">Search and discover nearby parking spots</p>
                </div>
              </div>

              <div className="pw-feature-pill" onClick={() => scrollTo("#how-it-works")}>
                <div className="pw-pill-icon-circle">
                  <Calendar size={18} />
                </div>
                <div className="pw-pill-text-block">
                  <h4 className="pw-pill-title">Book Instantly</h4>
                  <p className="pw-pill-desc">Reserve your spot in advance</p>
                </div>
              </div>

              <div className="pw-feature-pill" onClick={() => scrollTo("#about")}>
                <div className="pw-pill-icon-circle">
                  <ShieldCheck size={18} />
                </div>
                <div className="pw-pill-text-block">
                  <h4 className="pw-pill-title">Secure & Safe</h4>
                  <p className="pw-pill-desc">Your vehicle is safe with us</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pw-hero-right">
            <div className="pw-city-art-card">
              <svg viewBox="0 0 520 480" className="pw-city-art-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="520" height="480" fill="#f0fdfa" rx="24" />
                <circle cx="440" cy="140" r="160" fill="#ccfbf1" opacity="0.6" />
                <circle cx="380" cy="90" r="70" fill="#99f6e4" opacity="0.4" />
                <rect x="360" y="160" width="40" height="240" rx="4" fill="#e2e8f0" />
                <rect x="410" y="120" width="55" height="280" rx="4" fill="#cbd5e1" />
                <rect x="475" y="190" width="35" height="210" rx="4" fill="#e2e8f0" />
                <rect x="425" y="150" width="8" height="14" fill="#ffffff" />
                <rect x="440" y="150" width="8" height="14" fill="#ffffff" />
                <rect x="425" y="180" width="8" height="14" fill="#ffffff" />
                <rect x="440" y="180" width="8" height="14" fill="#ffffff" />
                <rect x="425" y="210" width="8" height="14" fill="#ffffff" />
                <rect x="440" y="210" width="8" height="14" fill="#ffffff" />
                <rect x="425" y="240" width="8" height="14" fill="#ffffff" />
                <rect x="440" y="240" width="8" height="14" fill="#ffffff" />
                <circle cx="340" cy="340" r="70" fill="#5eead4" opacity="0.75" />
                <circle cx="280" cy="360" r="50" fill="#2dd4bf" opacity="0.85" />
                <circle cx="320" cy="370" r="45" fill="#14b8a6" opacity="0.9" />
                <rect x="0" y="390" width="520" height="90" fill="#134e4a" opacity="0.15" />
                <rect x="0" y="405" width="520" height="75" fill="#f8fafc" />
                <line x1="0" y1="405" x2="520" y2="405" stroke="#0d9488" strokeWidth="3" />
                <line x1="60" y1="440" x2="160" y2="440" stroke="#0d9488" strokeWidth="4" strokeDasharray="14 10" />
                <line x1="220" y1="440" x2="320" y2="440" stroke="#0d9488" strokeWidth="4" strokeDasharray="14 10" />
                <line x1="380" y1="440" x2="480" y2="440" stroke="#0d9488" strokeWidth="4" strokeDasharray="14 10" />
                <rect x="390" y="310" width="6" height="95" fill="#475569" />
                <rect x="375" y="275" width="36" height="38" rx="8" fill="#0d9488" />
                <rect x="378" y="278" width="30" height="32" rx="6" fill="#ffffff" />
                <text x="386" y="302" fill="#0d9488" fontSize="20" fontWeight="900" fontFamily="sans-serif">P</text>
                <circle cx="120" cy="180" r="4" fill="#0d9488" opacity="0.4" />
                <circle cx="160" cy="140" r="6" fill="#0d9488" opacity="0.3" />
                <circle cx="200" cy="200" r="5" fill="#0d9488" opacity="0.35" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="pw-section-wrap pw-bg-alt">
        <div className="pw-section-container">
          <div className="pw-section-header">
            <span className="pw-section-badge">POWERFUL CAPABILITIES</span>
            <h2 className="pw-section-title">Everything You Need for Effortless Parking</h2>
            <p className="pw-section-subtitle">
              Advanced telemetry, real-time availability, and seamless contactless payments built for drivers and facility managers.
            </p>
          </div>

          <div className="pw-features-grid-cards">
            {FEATURES_LIST.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="pw-feature-card">
                  <div className="pw-feature-card-icon">
                    <Icon size={22} />
                  </div>
                  <h3 className="pw-feature-card-title">{feat.title}</h3>
                  <p className="pw-feature-card-text">{feat.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="pw-section-wrap">
        <div className="pw-section-container">
          <div className="pw-section-header">
            <span className="pw-section-badge">SIMPLE 3-STEP PROCESS</span>
            <h2 className="pw-section-title">How ParkSafe Works</h2>
            <p className="pw-section-subtitle">
              From finding a spot to contactless departure, get parked in under 60 seconds.
            </p>
          </div>

          <div className="pw-steps-grid">
            {STEPS.map((step) => (
              <div key={step.num} className="pw-step-card">
                <div className="pw-step-badge">{step.num}</div>
                <h3 className="pw-step-title">{step.title}</h3>
                <p className="pw-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="pw-section-wrap pw-bg-alt">
        <div className="pw-section-container">
          <div className="pw-about-grid">
            <div className="pw-about-text-col">
              <span className="pw-section-badge">ABOUT PARKSAFE</span>
              <h2 className="pw-section-title">Reinventing Urban Mobility & Parking Systems</h2>
              <p className="pw-about-paragraph">
                ParkSafe connects smart IoT sensors, modern mobile experiences, and real-time gate automation to transform urban parking from a frustrating bottleneck into a smooth, instantaneous convenience.
              </p>
              <div className="pw-about-points-list">
                <div className="pw-about-point-item">
                  <CheckCircle2 size={18} className="pw-teal-icon" />
                  <span>Over 25,000+ happy commuters parked daily</span>
                </div>
                <div className="pw-about-point-item">
                  <CheckCircle2 size={18} className="pw-teal-icon" />
                  <span>99.98% hardware uptime and sensor accuracy</span>
                </div>
                <div className="pw-about-point-item">
                  <CheckCircle2 size={18} className="pw-teal-icon" />
                  <span>Zero gate queues with automated license plate recognition</span>
                </div>
              </div>
            </div>

            <div className="pw-about-stats-panel">
              <div className="pw-stats-box">
                <div className="pw-stat-single">
                  <span className="pw-stat-number">98%</span>
                  <span className="pw-stat-label">Faster Parking Search</span>
                </div>
                <div className="pw-stat-single">
                  <span className="pw-stat-number">100+</span>
                  <span className="pw-stat-label">Connected Facilities</span>
                </div>
                <div className="pw-stat-single">
                  <span className="pw-stat-number">40%</span>
                  <span className="pw-stat-label">Traffic Congestion Reduction</span>
                </div>
                <div className="pw-stat-single">
                  <span className="pw-stat-number">24/7</span>
                  <span className="pw-stat-label">Live Support & Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="pw-section-wrap">
        <div className="pw-section-container">
          <div className="pw-contact-grid">
            <div className="pw-contact-info-col">
              <span className="pw-section-badge">GET IN TOUCH</span>
              <h2 className="pw-section-title">Have Questions? We Are Here to Help</h2>
              <p className="pw-contact-desc">
                Contact our support or enterprise team to learn more about facility integration and smart parking solutions.
              </p>

              <div className="pw-contact-details-stack">
                <div className="pw-contact-row">
                  <Mail size={18} className="pw-teal-icon" />
                  <span>support@parksafe.com</span>
                </div>
                <div className="pw-contact-row">
                  <Phone size={18} className="pw-teal-icon" />
                  <span>+91 1234567890</span>
                </div>
              </div>
            </div>

            <div className="pw-contact-form-col">
              <form onSubmit={handleContactSubmit} className="pw-contact-form">
                <h3 className="pw-form-box-title">Send Us a Message</h3>

                <div className="pw-form-field">
                  <label className="pw-form-label">Your Name</label>
                  <input
                    type="text"
                    className="pw-form-input"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="pw-form-field">
                  <label className="pw-form-label">Email Address</label>
                  <input
                    type="email"
                    className="pw-form-input"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="pw-form-field">
                  <label className="pw-form-label">Message</label>
                  <textarea
                    rows={4}
                    className="pw-form-input pw-textarea"
                    placeholder="How can we assist you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="pw-btn-hero-primary pw-btn-full">
                  <Send size={16} />
                  <span>Send Message</span>
                </button>

                {formSubmitted && (
                  <p className="pw-auth-msg success">
                    Thank you! Your message has been sent successfully.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="pw-footer-wrap">
        <div className="pw-footer-inner">
          <div className="pw-footer-brand-col">
            <div className="pw-brand-badge" onClick={() => scrollTo("#home")}>
              <div className="pw-brand-logo-box">
                <span className="pw-p-logo">P</span>
              </div>
              <span className="pw-brand-word text-white">ParkSafe</span>
            </div>
            <p className="pw-footer-tagline">
              Next-generation smart parking infrastructure for drivers, operators, and smart cities.
            </p>
          </div>

          <div className="pw-footer-links-col">
            <h4 className="pw-footer-heading">Navigation</h4>
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="pw-footer-link"
                onClick={() => scrollTo(link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pw-footer-links-col">
            <h4 className="pw-footer-heading">Access Portals</h4>
            <button type="button" className="pw-footer-link" onClick={() => setView("login")}>
              Sign In to Portal
            </button>
            <button type="button" className="pw-footer-link" onClick={() => setView("signup")}>
              Create Customer Account
            </button>
            <button type="button" className="pw-footer-link" onClick={() => setView("login")}>
              Staff Gate Access
            </button>
          </div>
        </div>

        <div className="pw-footer-bottom-bar">
          <p>© 2026 ParkSafe Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
