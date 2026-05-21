/**
 * Apple-inspired motion tokens — soft springs, vertical fade, no horizontal page slides.
 */

const appleEase = [0.25, 0.1, 0.25, 1] as const;

export const appleSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 38,
  mass: 0.82,
};

export const appleSpringGentle = {
  type: "spring" as const,
  stiffness: 320,
  damping: 34,
  mass: 0.92,
};

export const appleSpringDrawer = {
  type: "spring" as const,
  stiffness: 340,
  damping: 38,
  mass: 0.9,
};

/** Content enter — slight lift + scale (iOS sheet feel). */
export const fadeUpVariants = {
  initial: { opacity: 0, y: 12, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
};

export const stepVariants = fadeUpVariants;

export const pageVariants = fadeUpVariants;
export const pageTransition = appleSpringGentle;

export const modalVariants = {
  initial: { opacity: 0, y: 18, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.97 },
};

export const modalTransition = appleSpring;

export const backdropTransition = { duration: 0.34, ease: appleEase };

export const cardVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export const cardContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.03 },
  },
};

export const cardTransition = appleSpringGentle;

export const buttonTap = {
  whileTap: { scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 520, damping: 28 },
};

export const fabTap = {
  whileTap: { scale: 0.9 },
  transition: { type: "spring" as const, stiffness: 480, damping: 24 },
};

export const drawerOverlayTransition = { duration: 0.28, ease: appleEase };
