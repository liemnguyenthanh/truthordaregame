'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './animated-reveal.module.css';

type AnimatedRevealProps = HTMLAttributes<HTMLDivElement> & {
  animationKey: string | number;
  children: ReactNode;
};

/** Replays the reveal motion whenever the supplied key changes. */
export function AnimatedReveal({
  animationKey,
  children,
  className,
  ...props
}: AnimatedRevealProps) {
  return (
    <div
      key={animationKey}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
