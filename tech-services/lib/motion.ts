// La tupla `as const` es necesaria: como number[] suelto, Motion lo rechaza
// porque su tipo Easing espera exactamente cuatro numeros.
export const EASE_TECH = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  reveal: 0.6,
  micro: 0.4,
  reduced: 0.15,
};

export const STAGGER_STEP = 0.08;
export const REVEAL_Y = 18;

export const REVEAL_VIEWPORT = {
  once: true,
  margin: '0px 0px -15% 0px',
};

export function revealTransition(reduced: boolean, delay: number = 0) {
  if (reduced) {
    return {
      duration: DURATION.reduced,
      ease: 'linear',
      delay,
    };
  }
  return {
    duration: DURATION.reveal,
    ease: EASE_TECH,
    delay,
  };
}

export function revealVariants(reduced: boolean) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };
  }
  return {
    hidden: { opacity: 0, y: REVEAL_Y },
    visible: { opacity: 1, y: 0 },
  };
}

export function staggerContainer(reduced: boolean) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };
  }
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_STEP,
      },
    },
  };
}

export function pressable(reduced: boolean) {
  if (reduced) {
    return {};
  }
  return {
    whileTap: { scale: 0.98 },
  };
}
