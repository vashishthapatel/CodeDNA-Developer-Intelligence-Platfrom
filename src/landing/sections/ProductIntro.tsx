import { motion, type Variants } from 'framer-motion';
import { GitBranch, Dna, Sparkles, Code, Cpu, Fingerprint } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

const features = [
  {
    number: '01',
    title: 'Engineering Intelligence',
    description:
      'Understand coding consistency, contribution patterns, and development velocity across your entire repository history.',
    icon: GitBranch,
    tags: ['Commit Cadence', 'Pattern Recognition', 'Consistency Score'],
  },
  {
    number: '02',
    title: 'Code Personality',
    description:
      'Discover your unique engineering characteristics and archetype through repository signals. Every codebase tells a story.',
    icon: Dna,
    tags: ['Language Affinity', 'Architecture Style', 'Review Rhythm'],
  },
  {
    number: '03',
    title: 'Developer Fingerprint',
    description:
      'Build a verified visual identity from your coding history and technical activity. A distinct signature for every engineer.',
    icon: Fingerprint,
    tags: ['DNA Score', 'Verified Archetype', 'Executive Report'],
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const cardAnim: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export function ProductIntro() {
  return (
    <section id="product" className="relative py-20 sm:py-28 md:py-36 bg-[#0B100D]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          label="01 — Atelier Intelligence"
          title="Understand the mind behind the code."
          subtitle="CodeDNA analyzes your GitHub repositories and reveals deep patterns in how you architect, test, and ship software."
          align="center"
          className="mb-14 sm:mb-20"
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.number}
                variants={cardAnim}
                className="group relative rounded-2xl border border-[rgba(241,238,229,0.10)] bg-[#1B2820] p-6 sm:p-8 flex flex-col justify-between
                           hover:border-[#B99A5D]/40 transition-all duration-300 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7),0_0_24px_-4px_rgba(185,154,93,0.18)]"
              >
                <div>
                  {/* Top row: Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-bold text-[#B99A5D] tracking-luxe">
                      {feature.number}
                    </span>
                    <span className="w-10 h-10 rounded-[10px] grid place-items-center bg-gradient-to-br from-[#B99A5D] to-[#8F7545] text-[#0B100D] border border-[#B99A5D]/40 shadow-[0_2px_12px_-2px_rgba(185,154,93,0.35)] group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-5 h-5 text-[#0B100D]" />
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-2xl sm:text-3xl text-[#F1EEE5] mb-3 font-normal tracking-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#A0AA9D] leading-relaxed mb-6 font-sans">
                    {feature.description}
                  </p>
                </div>

                {/* Tags matching Dashboard chips */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[rgba(241,238,229,0.06)]">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono text-[#A0AA9D] px-2.5 py-1 rounded-full border border-[rgba(241,238,229,0.08)] bg-[#121A15]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
