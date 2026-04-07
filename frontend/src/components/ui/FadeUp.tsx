import type { ReactNode } from "react";

type FadeUpProps = {
  children: ReactNode;
  delay?: string;
};

export default function FadeUp({ children, delay = "" }: FadeUpProps) {
  return <div className={`fade-up ${delay}`}>{children}</div>;
}
