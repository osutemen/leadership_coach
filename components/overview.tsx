import { motion } from "framer-motion";
import Link from "next/link";

import { MessageIcon } from "./icons";
import { LogoPython } from "@/app/icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-4xl mx-auto md:mt-20 px-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm backdrop-blur-sm">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Leadership Coach
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your personal{" "}
            <span className="font-semibold text-indigo-600">AI Leadership Coach</span>{" "}
            powered by advanced artificial intelligence. Get expert guidance on leadership practices,
            professional development, and strategic business intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Ready to assist
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            <div className="text-sm text-gray-500">
              Ask me anything about leadership
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
