import { motion } from "framer-motion";
import Link from "next/link";

import { MessageIcon } from "./icons";
import { LogoPython } from "@/app/icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <LogoPython size={32} />
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        <h1 className="text-2xl font-bold text-primary">Leadership Coach</h1>
        <p>
          Welcome to your personal{" "}
          <span className="font-medium text-primary">Leadership Coach</span>{" "}
          powered by advanced AI. I'm here to provide in-depth guidance on leadership practices,
          professional development, and business intelligence.
        </p>
        <p>
          I can help you with:
        </p>
        <ul className="text-left space-y-2 text-sm">
          <li>• Leadership strategies and best practices</li>
          <li>• Professional development planning</li>
          <li>• Business intelligence insights</li>
          <li>• Team management and communication</li>
          <li>• Strategic decision making</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Ask me anything about leadership, and I'll provide personalized,
          professional guidance tailored to your needs.
        </p>
      </div>
    </motion.div>
  );
};
