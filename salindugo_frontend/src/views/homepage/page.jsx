import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Heart,
  Plus,
  Shield,
  TrendingUp,
  Zap,
  Clock,
  MapPin,
  Bell,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const compatibleDonors = {
  "O+": ["O+", "O-"],
  "O-": ["O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
};

const steps = [
  {
    num: "01",
    icon: MapPin,
    title: "Register & Locate",
    desc: "Sign up in seconds and find the nearest donation center or request blood from your area.",
  },
  {
    num: "02",
    icon: Activity,
    title: "Match & Verify",
    desc: "Our system matches blood types, checks compatibility, and verifies donor eligibility instantly.",
  },
  {
    num: "03",
    icon: Bell,
    title: "Connect & Save",
    desc: "Get notified when there's a match. Coordinate pickup or donation — lives saved, time preserved.",
  },
];

export default function Index() {
  const [activeBloodType, setActiveBloodType] = useState("O+");
  const mainRef = useRef(null);
  const heroLeftRef = useRef(null);
  const heroWidgetRef = useRef(null);
  const rolesHeaderRef = useRef(null);
  const roleCardsRef = useRef(null);
  const featuresHeaderRef = useRef(null);
  const featuresGridRef = useRef(null);
  const ctaRef = useRef(null);
  const navRef = useRef(null);
  const compatRef = useRef(null);
  const stepsHeaderRef = useRef(null);
  const stepsGridRef = useRef(null);
  const pulseRef = useRef(null);
  const forecastHeaderRef = useRef(null);
  const forecastGridRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -80,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      if (heroLeftRef.current) {
        const children = heroLeftRef.current.children;
        gsap.from(children, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.3,
        });
      }

      gsap.from(heroWidgetRef.current, {
        x: 60,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.6,
      });

      // Pulse heartbeat loop
      if (pulseRef.current) {
        gsap.to(pulseRef.current, {
          scale: 1.15,
          opacity: 0.7,
          duration: 0.6,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
          repeatDelay: 0.4,
        });
      }

      // How it works
      gsap.from(stepsHeaderRef.current, {
        scrollTrigger: {
          trigger: stepsHeaderRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      if (stepsGridRef.current) {
        const items = stepsGridRef.current.children;
        gsap.from(items, {
          scrollTrigger: {
            trigger: stepsGridRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          y: 50,
          opacity: 0,
          duration: 0.6,
          stagger: 0.18,
          ease: "power2.out",
        });
      }

      gsap.from(rolesHeaderRef.current, {
        scrollTrigger: {
          trigger: rolesHeaderRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      if (roleCardsRef.current) {
        const cards = roleCardsRef.current.children;
        gsap.from(cards, {
          scrollTrigger: {
            trigger: roleCardsRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          y: 50,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
        });
      }

      gsap.from(featuresHeaderRef.current, {
        scrollTrigger: {
          trigger: featuresHeaderRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      if (featuresGridRef.current) {
        const items = featuresGridRef.current.children;
        gsap.from(items, {
          scrollTrigger: {
            trigger: featuresGridRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          y: 40,
          opacity: 0,
          scale: 0.97,
          duration: 0.5,
          stagger: 0.12,
          ease: "power2.out",
        });
      }

      // Forecast section
      gsap.from(forecastHeaderRef.current, {
        scrollTrigger: {
          trigger: forecastHeaderRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      if (forecastGridRef.current) {
        const items = forecastGridRef.current.children;
        gsap.from(items, {
          scrollTrigger: {
            trigger: forecastGridRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          y: 50,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
        });
      }

      gsap.from(ctaRef.current, {
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        y: 40,
        opacity: 0,
        scale: 0.98,
        duration: 0.7,
        ease: "power2.out",
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (compatRef.current) {
      const badges = compatRef.current.querySelectorAll("[data-compat-badge]");
      gsap.fromTo(
        badges,
        { scale: 0.7, opacity: 0, y: 8 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.05,
          ease: "back.out(1.7)",
        },
      );
    }
  }, [activeBloodType]);

  return (
    <div ref={mainRef} className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 border-b border-divider bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              SalinDugo
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left */}
            <div ref={heroLeftRef} className="max-w-xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Activity className="h-3 w-3" />
                  Intelligent Blood Matching
                </span>
                {/* Heartbeat pulse */}
                <div className="relative flex items-center justify-center">
                  <div
                    ref={pulseRef}
                    className="absolute h-6 w-6 rounded-full bg-primary/20"
                  />
                  <Heart className="relative h-3.5 w-3.5 text-primary fill-primary" />
                </div>
              </div>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Precision blood matching,{" "}
                <span className="text-primary">saving lives</span> faster.
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Connect donors with recipients instantly. AI-powered
                compatibility matching, real-time inventory tracking, and
                intelligent demand forecasting — all in one secure platform.
              </p>

              <div className="mt-10 flex gap-3">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  asChild
                >
                  <Link to="/register">
                    Become a Donor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right — Compatibility Widget */}
            <div ref={heroWidgetRef}>
              <div className="rounded-2xl border border-divider bg-card p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Heart className="h-4 w-4 text-primary" />
                  Blood Type Compatibility Checker
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {bloodTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveBloodType(type)}
                      className={`rounded-lg py-3 font-display text-sm font-semibold transition-all duration-200 ${
                        activeBloodType === type
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-neutral-200 text-foreground hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-muted p-5">
                  <p className="text-sm text-muted-foreground">
                    Compatible donors for{" "}
                    <span className="font-semibold text-foreground">
                      {activeBloodType}
                    </span>
                  </p>
                  <div ref={compatRef} className="mt-3 flex flex-wrap gap-2">
                    {compatibleDonors[activeBloodType]?.map((type) => (
                      <span
                        key={type}
                        data-compat-badge
                        className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 font-display text-sm font-semibold text-primary"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-divider py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div
            ref={stepsHeaderRef}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Clock className="h-3 w-3" />
              Simple Process
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              From sign-up to saving lives
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three steps. That's all it takes to become part of a life-saving
              network.
            </p>
          </div>

          <div ref={stepsGridRef} className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute top-10 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] bg-divider md:block" />
                )}
                <div className="group rounded-2xl border border-divider bg-card p-8 text-center transition-shadow duration-300 hover:shadow-md">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-xs font-bold uppercase tracking-widest text-primary">
                    Step {step.num}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="border-t border-divider bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div
            ref={rolesHeaderRef}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Three pathways to impact
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you donate, receive, or manage — SalinDugo provides the
              tools you need.
            </p>
          </div>

          <div ref={roleCardsRef} className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Donors",
                subtitle: "Give the gift of life",
                items: [
                  "Find nearby donation centers",
                  "Schedule and track donations",
                  "View your impact history",
                ],
                cta: "Start Donating",
                href: "/donor",
              },
              {
                icon: Plus,
                title: "Recipients",
                subtitle: "Find compatible blood quickly",
                items: [
                  "Instant compatibility matching",
                  "Locate centers with available stock",
                  "Secure, verified requests",
                ],
                cta: "Request Blood",
                href: "/register",
              },
              {
                icon: BarChart3,
                title: "Blood Centers",
                subtitle: "Enterprise-grade management",
                items: [
                  "Real-time inventory dashboards",
                  "AI-driven demand forecasting",
                  "Regional analytics and insights",
                ],
                cta: "Register Center",
                href: "/register",
              },
            ].map((role) => (
              <div
                key={role.title}
                className="group rounded-2xl border border-divider bg-card p-8 transition-shadow duration-300 hover:shadow-md"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <role.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold">
                  {role.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role.subtitle}
                </p>
                <ul className="mt-6 space-y-3">
                  {role.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    size="sm"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    asChild
                  >
                    <Link to={role.href}>
                      {role.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div
            ref={featuresHeaderRef}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Built for healthcare precision
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every feature designed with clinical accuracy and operational
              efficiency in mind.
            </p>
          </div>

          <div
            ref={featuresGridRef}
            className="grid gap-px overflow-hidden rounded-2xl border border-divider bg-divider md:grid-cols-3"
          >
            {[
              {
                icon: Zap,
                title: "Instant Matching",
                desc: "A smart matching algorithm identifies blood centers that can efficiently fulfill requests and have a demand for your blood type.",
              },
              {
                icon: TrendingUp,
                title: "Demand Forecasting",
                desc: "Predictive analytics anticipate supply needs before shortages occur.",
              },
              {
                icon: Shield,
                title: "Healthcare-Grade Security",
                desc: "End-to-end encryption data protection protocols.",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-card p-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demand Forecasting Showcase */}
      <section className="border-t border-divider bg-neutral/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div
            ref={forecastHeaderRef}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-primary px-3 py-1 text-xs font-medium text-white">
              <TrendingUp className="h-3 w-3" />
              Predictive Intelligence
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              Demand forecasting for smarter decisions
            </h2>
            <p className="mt-4 text-muted-foreground">
              AI-driven analytics help blood centers anticipate demand, optimize
              inventory, and prevent shortages before they happen.
            </p>
          </div>

          {/* Flow explanation */}
          <div className="mx-auto mb-16 max-w-4xl">
            <div className="grid gap-0 md:grid-cols-4">
              {[
                {
                  step: "01",
                  label: "Collect",
                  detail:
                    "Historical donation records, seasonal trends, and regional health data are continuously ingested into the system.",
                },
                {
                  step: "02",
                  label: "Analyze",
                  detail:
                    "Machine learning models process the data to identify patterns, correlations, and emerging demand signals.",
                },
                {
                  step: "03",
                  label: "Predict",
                  detail:
                    "The system generates demand forecasts per blood type, per region — days or weeks before shortages could occur.",
                },
                {
                  step: "04",
                  label: "Act",
                  detail:
                    "Blood centers receive actionable alerts and recommendations to rebalance inventory and mobilize donors proactively.",
                },
              ].map((item, i) => (
                <div
                  key={item.step}
                  className="relative flex flex-col items-center text-center px-4 py-6"
                >
                  {i < 3 && (
                    <div className="absolute right-0 top-1/2 hidden h-px w-full -translate-y-1/2 md:block">
                      <div className="ml-auto h-px w-1/2 bg-gradient-to-r from-transparent to-primary/30" />
                    </div>
                  )}
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary  font-display text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                    {item.label}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-divider">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div
            ref={ctaRef}
            className="rounded-2xl bg-primary p-12 text-center md:p-16"
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground">
              Ready to make an impact?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/70">
              Join thousands of donors and healthcare centers using SalinDugo to
              connect critical blood supply with those who need it most.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="bg-white text-red-700 hover:bg-gray-100 flex items-center gap-2 font-semibold"
                  asChild
                >
                  <Link to="/register">
                    Start Donating
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider bg-primary py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary border-white">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-lg font-semibold tracking-tight text-primary-foreground">
                  SalinDugo
                </span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-primary-foreground/60">
                Precision blood matching platform connecting donors, recipients,
                and healthcare centers through AI-powered intelligence.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-display text-sm font-semibold text-primary-foreground">
                Platform
              </h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Donor Portal",
                  "Recipient Matching",
                  "Blood Center Dashboard",
                  "Demand Forecasting",
                ].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-display text-sm font-semibold text-primary-foreground">
                Resources
              </h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Documentation",
                  "API Reference",
                  "Blood Type Guide",
                  "Safety Standards",
                ].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-display text-sm font-semibold text-primary-foreground">
                Company
              </h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  "About Us",
                  "Contact",
                  "Privacy Policy",
                  "Terms of Service",
                ].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 md:flex-row">
            <p className="text-xs text-primary-foreground/40">
              © 2025 SalinDugo. All rights reserved. Saving lives through
              intelligent blood matching.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/40">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
