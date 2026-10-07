"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { HeroAtmosphere } from "@/components/home/HeroAtmosphere";
import { fadeUp, motionSafe, staggerContainer } from "@/components/home/motion";

const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/ShredSecurity", Icon: FaXTwitter },
  { label: "GitHub", href: "https://github.com/Shred-Security/hackviz", Icon: FaGithub },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/shred-security/", Icon: FaLinkedin },
];

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <motion.section
      className="hero-panel relative mb-8 overflow-hidden rounded-xl border border-primary/15 bg-[#05080f] px-4 py-7 sm:mb-10 sm:px-6 sm:py-8 md:px-8 md:py-9"
      initial={reduced ? false : "hidden"}
      animate="show"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      transition={motionSafe(reduced, { duration: 0.5 })}
    >
      <HeroAtmosphere />

      <motion.div
        className="relative flex flex-col items-center text-center"
        variants={staggerContainer}
        initial={reduced ? false : "hidden"}
        animate="show"
      >
        <motion.h1
          variants={fadeUp}
          transition={motionSafe(reduced, { duration: 0.5, delay: 0.05 })}
          className="text-5xl font-bold leading-none tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          <span className="glow-cyan hero-wordmark">Hack</span>
          <span className="text-foreground/90">Viz</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={motionSafe(reduced)}
          className="mt-5 max-w-3xl text-xl font-semibold leading-snug text-foreground sm:text-2xl md:text-3xl"
        >
          Simulate and learn every{" "}
          <span className="relative inline-block text-primary">
            exploit
            <motion.span
              aria-hidden="true"
              className="absolute -bottom-0.5 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={reduced ? false : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.9 }}
              transition={motionSafe(reduced, { delay: 0.45, duration: 0.6 })}
            />
          </span>
          .
        </motion.p>

        <motion.p
          variants={fadeUp}
          transition={motionSafe(reduced)}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg"
        >
          Visualize how real attacks unfold, step by step, then learn how to hunt and secure the
          blockchain.
        </motion.p>

        <motion.p
          variants={fadeUp}
          transition={motionSafe(reduced)}
          className="mt-3 text-xs font-mono text-muted-foreground sm:text-sm"
        >
          A{" "}
          <a
            href="https://shredsecurity.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-red-400 transition-colors hover:text-red-300"
          >
            Shred Security
          </a>{" "}
          product, built for the community
        </motion.p>

        <motion.nav
          variants={fadeUp}
          transition={motionSafe(reduced)}
          aria-label="Shred Security social links"
          className="mt-5"
        >
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Shred Security on ${label}`}
                title={label}
                className="rounded-md p-1.5 text-foreground/75 transition-all hover:-translate-y-0.5 hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </motion.nav>
      </motion.div>
    </motion.section>
  );
}
