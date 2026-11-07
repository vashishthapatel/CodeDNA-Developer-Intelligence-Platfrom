import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Cpu, Dna, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

const steps = [
  {
    number: '01',
    title: 'Connect GitHub',
    description:
      'Securely link your GitHub profile with read-only OAuth. Zero write permissions requested.',
    detail:
      'We parse public repository metadata, commit logs, PR reviews, and language telemetry via the GitHub REST API. Secrets and keys are never stored.',
    icon: Github,
  },
  {
    number: '02',
    title: 'Analyze Your Code',
    description:
      'The engine synthesizes commit velocity, branch complexity, PR cadence, and architectural patterns.',
    detail:
      'Multi-dimensional AI models correlate your coding patterns against thousands of open-source standards to compute consistency, quality, and velocity.',
    icon: Cpu,
  },
  {
    number: '03',
    title: 'Discover Your DNA',
    description:
      'Generate a unique developer intelligence profile and verified engineering archetype.',
    detail:
      'Receive your 4-axis radar chart, composite DNA score, language affinity shares, and personalized growth recommendations in under 30 seconds.',
    icon: Dna,
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 md:py-36 bg-[#FFFDF2]">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          label="03 — Methodology"
          title="Three steps to your developer fingerprint."
          subtitle="From raw GitHub connection to an executive-ready intelligence dossier in under 60 seconds."
          align="center"
          className="mb-12 sm:mb-16"
        />

        {/* Step Selector - Responsive Tab / Stepper */}
        <div className="flex items-center justify-center mb-10 sm:mb-14">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 p-1.5 rounded-full bg-[#F4F6D7] border border-[rgba(36,48,27,0.08)] max-w-xl w-full">
            {steps.map((step, i) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 select-none ${
                  i === activeStep
                    ? 'bg-gradient-to-r from-[#4B7D21] to-[#385D19] text-[#FFFDF2] shadow-[0_2px_12px_rgba(75,125,33,0.35)]'
                    : 'text-[#72785D] hover:text-[#24301B] hover:bg-[#FFFFFF]'
                }`}
              >
                <span className="font-mono text-[10px] sm:text-xs">{step.number}</span>
                <span className="truncate hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 Step Cards - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            return (
              <motion.div
                key={step.number}
                onClick={() => setActiveStep(i)}
                className={`rounded-2xl border p-6 sm:p-7 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isActive
                    ? 'border-[#4B7D21]/50 bg-[#FFFFFF] shadow-[0_16px_40px_-12px_rgba(51,63,25,0.14),0_0_24px_-4px_rgba(75,125,33,0.2)] scale-[1.01]'
                    : 'border-[rgba(36,48,27,0.08)] bg-[#F4F6D7]/70 hover:border-[rgba(36,48,27,0.16)] hover:bg-[#FFFFFF]'
                }`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`font-mono text-xs font-bold tracking-luxe transition-colors ${
                        isActive ? 'text-[#385D19]' : 'text-[#72785D]'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span
                      className={`w-10 h-10 rounded-[10px] grid place-items-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-[#4B7D21] to-[#385D19] text-[#FFFDF2] shadow-[0_2px_12px_rgba(75,125,33,0.35)]'
                          : 'bg-[#F4F6D7] border border-[rgba(36,48,27,0.10)] text-[#72785D]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                  </div>

                  <h3
                    className={`font-display text-xl sm:text-2xl mb-2.5 font-normal transition-colors ${
                      isActive ? 'text-[#24301B]' : 'text-[#24301B]/80'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#72785D] leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[rgba(36,48,27,0.06)]">
                  <p
                    className={`text-xs leading-relaxed transition-opacity ${
                      isActive ? 'text-[#385D19]' : 'text-[#72785D]/60'
                    }`}
                  >
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
