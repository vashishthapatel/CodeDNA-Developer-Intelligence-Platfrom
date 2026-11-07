import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Github, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { DNABackground } from '../three/DNABackground';
import { createGitHubOAuthUrl } from '../../lib/githubOAuth';

export function FinalCTA() {
  return (
    <section id="technology" className="relative py-24 sm:py-36 md:py-44 overflow-hidden bg-[#FFFDF2]">
      {/* Background 3D visual */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <Suspense fallback={null}>
          <DNABackground className="w-full h-full" />
        </Suspense>
      </div>

      {/* Top separator line matching Dashboard horizon */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(75,125,33,0.4)] to-transparent" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Eyebrow */}
          <div className="chip mb-6 sm:mb-8 !py-1.5 !px-4 inline-flex">
            <Sparkles className="w-3.5 h-3.5 text-[#4B7D21]" />
            <span className="font-mono text-[0.72rem] tracking-luxe uppercase text-[#385D19] font-bold">
              Engineering Intelligence
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#24301B] leading-[0.98] tracking-tight mb-5 sm:mb-7 font-normal">
            Every developer has<br />
            a fingerprint.<br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#4B7D21] via-[#F6C744] to-[#385D19]">
              Discover yours.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-[#72785D] max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
            Your repositories tell a story. It&apos;s time to understand what makes your
            engineering unique and transform raw commits into verified intelligence.
          </p>

          {/* CTA & Trust note */}
          <div className="flex flex-col items-center justify-center gap-4">
            <Button onClick={() => window.location.assign(createGitHubOAuthUrl())} variant="primary" size="lg" className="w-full sm:w-auto">
              <Github className="w-4 h-4 shrink-0" />
              <span>Generate My CodeDNA</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Button>
            <div className="flex items-center gap-2 text-xs text-[#72785D]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#83A94B]" />
              <span>Read-only GitHub OAuth · Zero repository writes · Free tier</span>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-[rgba(36,48,27,0.08)] max-w-2xl mx-auto">
            <p className="font-display text-lg sm:text-xl md:text-2xl text-[#24301B] italic font-light leading-relaxed">
              &ldquo;The most insightful developer platform I&apos;ve used. It surfaces engineering
              archetypes and consistency rhythms that are invisible in raw GitHub graphs.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#4B7D21] to-[#385D19] flex items-center justify-center text-xs font-bold text-[#FFFDF2] shadow-[0_2px_12px_rgba(75,125,33,0.3)]">
                AK
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-[#24301B]">Alex Kim</div>
                <div className="text-[11px] font-mono text-[#72785D]">Staff Infrastructure Engineer</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
