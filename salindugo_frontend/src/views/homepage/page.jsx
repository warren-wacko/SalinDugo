"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Heart,
  TrendingUp,
  BarChart3,
  Shield,
  ArrowRight,
  Zap,
  Activity,
} from "lucide-react";

export default function HomePage() {
  const [activeBloodType, setActiveBloodType] = useState("O+");
  const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

  const bloodFacts = [
    {
      id: 1,
      title: "Universal Donor",
      description:
        "O- blood is the universal donor type, can be given to anyone in emergencies",
      gradient: "from-red-600 via-red-500 to-rose-500",
      icon: "🩸",
    },
    {
      id: 2,
      title: "Life-Saving Gift",
      description: "One blood donation can save up to 3 lives",
      gradient: "from-pink-600 via-pink-500 to-red-500",
      icon: "💝",
    },
    {
      id: 3,
      title: "Rapid Matching",
      description:
        "AI matching finds compatible donors and recipients in seconds",
      gradient: "from-orange-600 via-orange-500 to-red-500",
      icon: "⚡",
    },
    {
      id: 4,
      title: "Blood Supply Demand",
      description:
        "Blood donations are needed every 2 seconds somewhere in the world",
      gradient: "from-red-600 via-rose-500 to-pink-600",
      icon: "🌍",
    },
    {
      id: 5,
      title: "Regular Donors",
      description:
        "Regular donors help maintain critical blood supply for emergencies",
      gradient: "from-rose-600 via-red-500 to-orange-500",
      icon: "🔄",
    },
  ];

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg">
              <Heart className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">SalinDugo</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              asChild
            >
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 border-b border-border/50 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-balance bg-gradient-to-r from-primary via-red-600 to-rose-600 bg-clip-text text-transparent">
                  Save Lives
                  <br />
                  with Smart
                  <br />
                  Blood Matching
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Connect donors with recipients instantly. AI-powered matching,
                  real-time inventory tracking, and intelligent forecasting—all
                  in one secure platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  asChild
                >
                  <Link
                    to="/register?role=donor"
                    className="flex items-center gap-2"
                  >
                    Become a Donor
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 font-semibold bg-transparent hover:scale-105 hover:shadow-lg transition-all"
                  asChild
                >
                  <Link
                    to="/register?role=hospital"
                    className="flex items-center gap-2"
                  >
                    Register Center
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 group">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Blood Type Compatibility
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {bloodTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setActiveBloodType(type)}
                        className={`py-3 px-2 rounded-lg font-bold text-sm transition-all duration-300 ${
                          activeBloodType === type
                            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110"
                            : "bg-muted text-foreground hover:bg-muted/80 hover:scale-110 border border-transparent hover:border-primary/50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    Compatible donors for{" "}
                    <span className="font-bold text-primary">
                      {activeBloodType}
                    </span>
                    :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {compatibleDonors[activeBloodType]?.map((type) => (
                      <div
                        key={type}
                        className="px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded-full text-sm font-bold hover:from-primary/30 hover:to-primary/20 transition-all cursor-pointer border border-primary/30 hover:border-primary/60"
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 border-b border-border/50 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
              Blood Donation Impact
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover fascinating facts about blood donation and saving lives
            </p>
          </div>

          <Carousel className="w-full">
            <CarouselContent>
              {bloodFacts.map((fact) => (
                <CarouselItem key={fact.id}>
                  <div
                    className={`bg-gradient-to-br ${fact.gradient} rounded-2xl p-12 md:p-16 text-white min-h-96 flex flex-col justify-center items-center text-center shadow-2xl hover:shadow-2xl transition-all hover:scale-105`}
                  >
                    <div className="text-7xl mb-6 animate-bounce">
                      {fact.icon}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4">
                      {fact.title}
                    </h3>
                    <p className="text-lg md:text-xl opacity-95 max-w-2xl leading-relaxed">
                      {fact.description}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/80 text-primary-foreground border-0 hover:scale-110 transition-all" />
            <CarouselNext className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/80 text-primary-foreground border-0 hover:scale-110 transition-all" />
          </Carousel>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-24 px-4 border-b border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Three Ways to Participate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're saving lives as a donor, finding critical blood, or
              managing inventory—SalinDugo connects you all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Donor Card */}
            <Card className="border-2 hover:border-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Donors</CardTitle>
                <CardDescription>Make a life-saving impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-sm">
                  {[
                    "Find nearby centers",
                    "Schedule donations",
                    "Track donation history",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 items-start hover:translate-x-1 transition-transform"
                    >
                      <span className="text-primary font-bold">✓</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg transition-all"
                  asChild
                >
                  <Link to="/register?role=donor">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recipient Card */}
            <Card className="border-2 hover:border-secondary/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>Find compatible blood quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-sm">
                  {[
                    "Instant blood matching",
                    "Locate centers with stock",
                    "Secure requests",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 items-start hover:translate-x-1 transition-transform"
                    >
                      <span className="text-secondary font-bold">✓</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground hover:shadow-lg transition-all"
                  asChild
                >
                  <Link to="/register?role=recipient">Request Blood</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Blood Center Card */}
            <Card className="border-2 hover:border-accent/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Blood Centers</CardTitle>
                <CardDescription>Enterprise management suite</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-sm">
                  {[
                    "Real-time inventory tracking",
                    "AI demand forecasting",
                    "Regional insights",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 items-start hover:translate-x-1 transition-transform"
                    >
                      <span className="text-accent font-bold">✓</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground hover:shadow-lg transition-all"
                  asChild
                >
                  <Link to="/register?role=hospital">Register Center</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 border-b border-border/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Matching",
                desc: "AI connects compatible donors and recipients in seconds",
              },
              {
                icon: TrendingUp,
                title: "Smart Forecasting",
                desc: "Predict demand patterns and optimize blood inventory",
              },
              {
                icon: Shield,
                title: "Secure & Verified",
                desc: "Healthcare-grade security with complete data protection",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-8 hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Save Lives?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of donors and healthcare centers using SalinDugo to
            connect blood with those who need it most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold hover:shadow-lg hover:scale-105 transition-all"
              asChild
            >
              <Link to="/register?role=donor">Start Donating</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 font-semibold bg-transparent hover:scale-105 hover:shadow-lg transition-all"
              asChild
            >
              <Link to="/register?role=hospital">Register Your Center</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-12 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 SalinDugo. Saving lives through smart blood matching.</p>
        </div>
      </footer>
    </div>
  );
}
