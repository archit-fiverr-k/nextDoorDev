"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  question: string;
  answer: string;
}

export function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200/60 py-4 transition-all duration-200 dark:border-zinc-800/60">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full select-none items-center justify-between py-2 text-left font-display text-base font-semibold text-brand-navy hover:opacity-90 focus:outline-none dark:text-slate-100"
      >
        <span>{question}</span>
        <ChevronDown
          className={`duration-350 ml-4 size-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`duration-350 overflow-hidden transition-all ease-in-out ${
          isOpen ? "mt-2 max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="pb-2 text-xs font-normal leading-relaxed text-muted-foreground sm:text-sm">
          {answer}
        </p>
      </div>
    </div>
  );
}
