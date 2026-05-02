import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  UploadCloud,
  Printer,
  Network,
  Target,
  TrendingUp,
  ArrowRight,
  Droplets,
  Activity,
  Database,
  ChevronRight,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Users,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

export default function Index() {
  // --- States ---
  const [activeEngineTab, setActiveEngineTab] = useState(0);
  const [activeRoleTab, setActiveRoleTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // --- Simulation State & Logic ---
  const [chartData, setChartData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setChartData([]);

    // Generate synthetic time-series data mimicking blood demand
    const baseData = Array.from({ length: 30 }, (_, i) => {
      const noise = Math.random() * 20 - 10;
      const trend = i * 1.2;
      const seasonal = Math.sin((i / (30 / (Math.PI * 2))) * 4) * 15;
      return Math.max(15, Math.min(100, 35 + trend + seasonal + noise));
    });

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < 30) {
        const val = Math.round(baseData[currentStep]);
        setChartData((prev) => [...prev, val]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 40);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // --- Data Arrays ---
  const roles = [
    {
      id: "planner",
      icon: Target,
      title: "Inventory Planners",
      desc: "Move from reactive ordering to proactive planning. Identify 7-day surges before they happen.",
      benefits: [
        "Predictive 30-day horizons",
        "Automated Peak Day alerts",
        "Visual Day-of-Week seasonality",
      ],
    },
    {
      id: "admin",
      icon: Activity,
      title: "Blood Center Administrators",
      desc: "Reduce blood wastage through tighter inventory buffers and track overall procurement efficiency.",
      benefits: [
        "Executive PDF report generation",
        "YoY Demand Comparison KPIs",
        "Wastage reduction metrics",
      ],
    },
  ];

  const faqs = [
    {
      q: "How does the system handle zero-demand days?",
      a: "SalinDugo uses a Two-Stage Soft Gating architecture. A binary classifier first predicts the probability of demand occurring at all. If the probability is high, a regressor predicts the magnitude. This prevents the model from being biased toward zero on highly intermittent blood types (like AB-).",
    },
    {
      q: "What format does my historical data need to be in?",
      a: "The Import Module accepts standard CSV or XLSX files. The required schema is strictly four columns: request_date, blood_type, units_needed, and status. The system automatically handles Excel serial date conversions and strips out cancelled requests.",
    },
    {
      q: "How are the Confidence Intervals calculated?",
      a: "We use residual-based confidence intervals. The system calculates the standard deviation of out-of-sample residuals for each specific blood type during backtesting. It then applies these to future predictions to generate transparent 80% and 95% certainty bands.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-100 selection:text-red-900 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-red-50 text-red-700 transition-transform group-hover:scale-105">
              <Droplets className="h-5 w-5 absolute z-10" />
              <div className="absolute inset-0 bg-red-100 rounded-lg scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              SalinDugo
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#modules"
              className="hover:text-red-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-red-700 hover:after:w-full after:transition-all after:duration-300 pb-1"
            >
              Core Modules
            </a>
            <a
              href="#engine"
              className="hover:text-red-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-red-700 hover:after:w-full after:transition-all after:duration-300 pb-1"
            >
              Forecasting Engine
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              className="bg-red-700 hover:bg-red-800 text-white font-medium shadow-md shadow-red-700/20 transition-all hover:-translate-y-0.5"
              asChild
            >
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-white to-slate-50 pt-20 pb-32 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1.5 mb-6 text-sm font-semibold text-red-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              SalinDugo - XGBoost Demand Forecasting
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Predict demand. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-red-500">
                Optimize inventory.
              </span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              SalinDugo bridges the gap between historical data and future
              operational needs. Utilizing a two-stage XGBoost architecture, it
              generates 30-day demand forecasts and quantifies uncertainty for
              blood center inventory planning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <Button
                size="lg"
                className="group bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-700/20 transition-all hover:-translate-y-0.5"
                asChild
              >
                <Link to="/login">
                  Open Prediction Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                asChild
              >
                <Link to="/login">
                  <Database className="mr-2 h-4 w-4 text-slate-500" />
                  Import Historical Data
                </Link>
              </Button>
            </div>
          </div>

          {/* SIMULATION VISUAL */}
          <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-red-100 to-white blur-2xl opacity-50"></div>
            <div className="relative rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl p-6 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Cpu
                    className={`h-5 w-5 ${isSimulating ? "text-red-500 animate-pulse" : "text-slate-500"}`}
                  />
                  <span className="font-semibold text-sm text-slate-700">
                    Live Demo Forecast Simulation
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-8 px-3 text-xs bg-white ${isSimulating ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 hover:text-red-700 hover:border-red-200"}`}
                  onClick={runSimulation}
                  disabled={isSimulating}
                >
                  <RefreshCw
                    className={`mr-2 h-3 w-3 ${isSimulating ? "animate-spin" : ""}`}
                  />
                  {isSimulating ? "Processing..." : "Run Simulation"}
                </Button>
              </div>

              <div className="h-64 flex items-end justify-between gap-1 px-2 relative bg-slate-50/50 rounded-lg pt-4 pb-0 border border-slate-100 overflow-hidden">
                <div
                  className={`absolute inset-0 flex items-end transition-opacity duration-1000 ${chartData.length === 30 ? "opacity-100" : "opacity-0"}`}
                >
                  <svg
                    className="w-full h-full preserve-3d"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,80 Q25,60 50,70 T100,20 L100,100 L0,100 Z"
                      fill="url(#ci-gradient)"
                      opacity="0.4"
                    />
                    <defs>
                      <linearGradient
                        id="ci-gradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#fee2e2" />
                        <stop
                          offset="100%"
                          stopColor="#ffffff"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                  <div className="w-full h-px bg-slate-300"></div>
                  <div className="w-full h-px bg-slate-300"></div>
                  <div className="w-full h-px bg-slate-300"></div>
                  <div className="w-full h-px bg-slate-300"></div>
                </div>

                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative flex-1 group flex justify-center h-full items-end z-10"
                  >
                    {chartData[i] !== undefined ? (
                      <div
                        className="w-full bg-red-100 rounded-t-sm transition-all duration-300 hover:bg-red-200 relative group-hover:z-20"
                        style={{ height: `${chartData[i]}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-red-600 rounded-t-sm transition-all duration-300 group-hover:bg-red-700 shadow-sm"
                          style={{ height: `${chartData[i] * 0.7}%` }}
                        />
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-30">
                          Day {i + 1}: {chartData[i]} units
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-0"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Model: Simulation_Only.model</span>
                <span className="flex items-center gap-1.5">
                  Status:
                  {isSimulating ? (
                    <span className="text-amber-600 animate-pulse">
                      Running step {chartData.length}/30
                    </span>
                  ) : (
                    <span className="text-green-600">Idle (Ready)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules Section */}
      <section id="modules" className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Three-Tiered System Architecture
            </h2>
            <p className="text-slate-600 text-lg">
              A streamlined workflow transforming raw CSV/XLSX historical logs
              into executive-ready PDF summaries.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: UploadCloud,
                title: "1. Bulk Data Import",
                desc: "The single entry point for historical data. Validates required schema, handles Excel serial conversions, and performs atomic bulk-inserts via PostgreSQL transactions.",
                color: "bg-blue-50 text-blue-700",
                hoverBorder: "hover:border-blue-200 hover:shadow-blue-900/5",
              },
              {
                icon: BarChart3,
                title: "2. Prediction Dashboard",
                desc: "The operational core. Connects to the FastAPI forecasting service to visualize 30-day predictive horizons. Features real-time KPIs including YoY Demand Comparison.",
                color: "bg-red-50 text-red-700",
                hoverBorder: "hover:border-red-200 hover:shadow-red-900/5",
              },
              {
                icon: Printer,
                title: "3. Print Report Engine",
                desc: "Compiles the raw forecast data into an A4 PDF-ready executive summary. Automatically generates natural-language synopses and cleanly formatted tables.",
                color: "bg-emerald-50 text-emerald-700",
                hoverBorder:
                  "hover:border-emerald-200 hover:shadow-emerald-900/5",
              },
            ].map((mod, i) => (
              <div
                key={i}
                className={`group bg-white border border-slate-200 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${mod.hoverBorder} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                <div
                  className={`h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${mod.color}`}
                >
                  <mod.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {mod.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {mod.desc}
                </p>
                <div className="flex items-center text-sm font-semibold text-slate-900 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Explore module <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Tabs */}
      {/* Role-Based Cards (Optimized for 2 Roles) */}
      <section className="py-24 bg-slate-50 relative border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 text-red-700 font-semibold text-sm tracking-wide uppercase">
              <Users className="h-4 w-4" /> Built For Teams
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Empowering Every Decision Maker
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Different roles require different intelligence. SalinDugo
              structures complex machine learning outputs into actionable
              insights for the whole team.
            </p>
          </div>

          {/* 2-Column Grid Layout */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col group"
                >
                  <div className="h-14 w-14 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {role.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                    {role.desc}
                  </p>

                  <ul className="space-y-4 mt-auto pt-6 border-t border-slate-100">
                    {role.benefits.map((benefit, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-slate-800"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Forecasting Engine Detail */}
      <section
        id="engine"
        className="py-24 bg-white border-b border-slate-200 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left Content */}
            <div className="lg:w-1/2 relative z-10">
              <div className="inline-flex items-center gap-2 mb-4 text-red-700 font-semibold text-sm tracking-wide uppercase">
                <Network className="h-4 w-4" /> Powered by XGBoost
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                The Forecasting Engine
              </h2>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                SalinDugo utilizes a custom implementation of XGBoost tailored
                for the zero-inflated nature of healthcare time-series data. The
                model computes 24 rolling and lag features to project 30 days
                into the future.
              </p>

              <div className="space-y-3">
                {[
                  {
                    icon: Target,
                    title: "Two-Stage Soft Gating",
                    desc: "A binary classifier prevents bias toward zero on intermittent blood types by gating the regressor.",
                  },
                  {
                    icon: Activity,
                    title: "Residual-Based Confidence Intervals",
                    desc: "Outputs 80% and 95% CI bands by computing the standard deviation of out-of-sample residuals.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Recursive Multi-Step Forecasting",
                    desc: "Predictions feed back into the feature set, recalibrating lag patterns step-by-step.",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 flex gap-4 ${activeEngineTab === i ? "bg-slate-50 border-red-200 shadow-md shadow-red-900/5" : "bg-transparent border-transparent hover:bg-slate-50/50"}`}
                    onMouseEnter={() => setActiveEngineTab(i)}
                  >
                    <div
                      className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${activeEngineTab === i ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-500"}`}
                    >
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold transition-colors ${activeEngineTab === i ? "text-slate-900" : "text-slate-700"}`}
                      >
                        {feature.title}
                      </h4>
                      <p
                        className={`text-sm mt-1 transition-colors ${activeEngineTab === i ? "text-slate-600" : "text-slate-500"}`}
                      >
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Academic Backtest Metrics Visual */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50 relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-700 rounded-t-2xl"></div>

                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">
                      Scientific Validation
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Systematic Backtest Evaluation
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                    <Activity className="h-3 w-3" />
                    Evaluates vs Lag-1 Baseline
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  To prove the model is genuinely learning operational patterns,
                  the backtest engine dynamically calculates these core error
                  metrics across all blood types.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "RMSE (Root Mean Squared Error)",
                      desc: "Heavily penalizes large variance to ensure the system strictly avoids predicting dangerous stockouts.",
                    },
                    {
                      label: "MAE (Mean Absolute Error)",
                      desc: "Provides the average magnitude of the forecast error in raw, interpretable blood units (bags).",
                    },
                    {
                      label: "MAPE (Mean Absolute % Error)",
                      desc: "Offers a scale-free percentage evaluation, allowing fair accuracy comparisons across both rare and common blood types.",
                    },
                  ].map((metric, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-red-600"></div>
                        <span className="text-sm font-bold text-slate-800">
                          {metric.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 ml-5 leading-relaxed">
                        {metric.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Technical FAQ */}
      <section className="py-24 bg-slate-50 relative">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Technical Documentation FAQ
            </h2>
            <p className="text-slate-600">
              Answers to common methodological questions from the thesis
              defense.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`border rounded-xl transition-all duration-300 overflow-hidden ${openFaq === i ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <button
                  className="w-full text-left px-6 py-4 flex justify-between items-center font-semibold text-slate-900 focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-red-600" : ""}`}
                  />
                </button>
                <div
                  className={`px-6 text-slate-600 text-sm leading-relaxed transition-all duration-300 ease-in-out ${openFaq === i ? "max-h-48 pb-5 opacity-100" : "max-h-0 opacity-0 py-0"}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-8 bg-red-100 rounded flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <Droplets className="h-5 w-5 text-red-700" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">
              SalinDugo
            </span>
          </div>
          <p className="text-sm text-slate-500 text-center md:text-left">
            Blood Demand Forecasting and Inventory Planning Platform.{" "}
            <br className="md:hidden" />
          </p>
          <div className="flex gap-4 text-sm font-medium text-slate-500">
            <a
              href="https://github.com/warren-wacko/SalinDugo"
              className="hover:text-red-700 transition-colors"
            >
              Github
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
