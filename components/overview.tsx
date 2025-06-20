import { motion } from "framer-motion";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="w-full flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.3 }}
    >
      <div className="mb-8 w-[320px]">
        <img
          src="/images/logo.png"
          alt="Leadership Coach"
          className="w-full h-auto object-contain rounded-2xl shadow-lg shadow-black/10 border border-gray-100/50"
        />
      </div>
    </motion.div>
  );
};
