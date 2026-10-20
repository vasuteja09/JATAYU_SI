import React from 'react';
import { Link } from 'react-router-dom';
import { CloudShader } from '@/components/ui/cloud-shader';
import { ArrowRight, Shield, Activity, Plane, Wrench, ChevronDown } from 'lucide-react';

export default function CloudShaderHeroDemo() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-[50rem] w-full overflow-hidden bg-slate-50 font-sans">
      {/* Cloud Shader Canvas Background */}
      <CloudShader
        className="absolute inset-0"
        cloudColor="#FFFFFF"
        skyTopColor="#A8D5F5"
        skyBottomColor="#EAF6FF"
        speed={0.5}
        count={4}
      />

      {/* Top Navbar */}
      <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-aerospace-900 shadow-md border border-aerospace-700">
            <img src="/eagle.svg" alt="JATAYU" className="w-6 h-6 object-contain p-0.5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-aerospace-900 drop-shadow-xs">
              JATAYU
            </span>
            <span className="block text-[10px] text-slate-600 font-semibold uppercase tracking-wider -mt-1">
              Jatayu AI
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-7 text-xs font-semibold text-slate-700 md:flex">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-aerospace-900 transition-colors cursor-pointer">
            How It Works
          </button>
          <button onClick={() => scrollTo('features')} className="hover:text-aerospace-900 transition-colors cursor-pointer">
            Features
          </button>
          <button onClick={() => scrollTo('department-access')} className="hover:text-aerospace-900 transition-colors cursor-pointer">
            Department Portals
          </button>
          <Link to="/app/schedule" className="hover:text-aerospace-900 transition-colors">
            Maintenance Timetable
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login/commander"
            className="hidden text-xs font-semibold text-slate-800 hover:text-aerospace-900 transition-colors sm:block"
          >
            Commander Login
          </Link>
          <button
            onClick={() => scrollTo('department-access')}
            className="rounded-full bg-aerospace-900 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-aerospace-800 transition-all cursor-pointer hover:shadow-lg"
          >
            Access Portal
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-12 text-center md:pt-18">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/80 bg-white/70 backdrop-blur-xs px-3.5 py-1 mb-5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-aerospace-900">
            JATAYU · MISSION READINESS INTELLIGENCE
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-aerospace-900 drop-shadow-xs sm:text-5xl md:text-6xl leading-[1.12]">
          Predictive Intelligence.{' '}
          <span className="text-blue-700 block sm:inline">Mission Readiness.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-700 drop-shadow-2xs md:text-base font-normal">
          An AI-powered platform for aircraft health monitoring, predictive maintenance,
          and fleet availability optimization.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center gap-3.5 sm:flex-row">
          <button
            onClick={() => scrollTo('department-access')}
            className="flex items-center gap-2 rounded-full bg-aerospace-900 px-7 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-aerospace-800 cursor-pointer"
          >
            Explore Fleet Readiness
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollTo('features')}
            className="flex items-center gap-2 rounded-full border border-aerospace-800/30 bg-white/80 px-7 py-3 text-xs font-semibold text-aerospace-900 backdrop-blur-xs transition-all hover:bg-white cursor-pointer shadow-xs"
          >
            Discover Predictive Maintenance
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-500 font-medium">
          Multi-Role Defence Aerospace Platform · Commander · Spare Parts · Technicians
        </p>
      </div>

      {/* Aerospace Telemetry Showcase Card */}
      <div className="relative z-10 mx-auto mt-10 w-full max-w-5xl px-4 pb-8 md:mt-12 md:px-8">
        <div className="rounded-2xl border border-sky-200/80 bg-white/85 p-4 shadow-xl backdrop-blur-md md:rounded-3xl md:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <Plane className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-aerospace-900">
                Airframe Health &amp; Schedule Synchronization
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                SYSTEM ONLINE
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              OR-Tools CP-SAT + XGBoost ML Engine
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Fleet Availability</span>
              <span className="text-lg font-bold text-aerospace-900">78.3%</span>
              <span className="text-[10px] text-emerald-600 block font-semibold">+6.7% with CP-SAT</span>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Top Anomaly Severity</span>
              <span className="text-lg font-bold text-orange-600">HIGH (0.72)</span>
              <span className="text-[10px] text-slate-500 block">Aircraft A101 · Hydraulic</span>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Estimated RUL</span>
              <span className="text-lg font-bold text-blue-700">47 Hours</span>
              <span className="text-[10px] text-slate-500 block">Deadline window +36h</span>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Scheduled Downtime</span>
              <span className="text-lg font-bold text-emerald-700">18.5h saved</span>
              <span className="text-[10px] text-slate-500 block">3 resource conflicts fixed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
