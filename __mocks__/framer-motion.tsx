/**
 * Lightweight framer-motion stub for Jest/jsdom.
 * motion.* components render as plain HTML tags so structural and
 * accessibility queries work without browser animation APIs.
 */
import React from "react";

type MotionProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  "data-testid"?: string;
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
  href?: string;
  // framer props we absorb and ignore
  animate?: unknown;
  initial?: unknown;
  exit?: unknown;
  transition?: unknown;
  variants?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  whileFocus?: unknown;
  whileInView?: unknown;
  [key: string]: unknown;
};

function createMotionComponent(tag: string) {
  const Component = React.forwardRef<HTMLElement, MotionProps>(
    (
      {
        children,
        animate,
        initial,
        exit,
        transition,
        variants,
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        ...rest
      },
      ref
    ) => {
      const Tag = tag as React.ElementType;
      return (
        <Tag ref={ref} {...rest}>
          {children}
        </Tag>
      );
    }
  );
  Component.displayName = `motion.${tag}`;
  return Component;
}

const HTML_TAGS = [
  "a", "article", "aside", "button", "div", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "img", "input",
  "label", "li", "main", "nav", "ol", "p", "section", "span",
  "svg", "ul",
];

export const motion = Object.fromEntries(
  HTML_TAGS.map((tag) => [tag, createMotionComponent(tag)])
) as Record<string, ReturnType<typeof createMotionComponent>>;

export const AnimatePresence = ({
  children,
}: {
  children?: React.ReactNode;
}) => <>{children}</>;

export const useAnimation = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn(),
});

export const useMotionValue = (initial: unknown) => ({
  get: () => initial,
  set: jest.fn(),
  onChange: jest.fn(),
});

export const useTransform = (
  _value: unknown,
  _inputRange: unknown,
  outputRange: unknown[]
) => ({ get: () => outputRange[0] });

export const useReducedMotion = () => false;
export const useInView = () => false;
export const LazyMotion = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
export const domAnimation = {};
export const m = motion;
