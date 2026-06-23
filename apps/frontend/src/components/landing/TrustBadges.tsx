import React from "react";
import { motion } from "framer-motion";

export default function TrustBadges() {
  const logos = [
    { name: "Google for Startups", icon: "⬡ Google for Startups" },
    { name: "AWS Startups", icon: "▲ AWS Startups" },
    { name: "Microsoft for Startups", icon: "❖ Microsoft for Startups" },
    { name: "Academic Partnership", icon: "🏛 Academic Partnerships" },
    { name: "IIM Bangalore Startup Hub", icon: "🎓 IIMB Incubatee" },
  ];

  return (
    <section className="py-12 border-t border-b border-[#f3ede4] bg-[#fcfbf9]/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <p className="text-center text-[10px] sm:text-xs font-mono tracking-widest text-[#e05934] uppercase font-bold">
          Trusted and Backed by
        </p>
      </div>

      {/* Marquee effect wrapper */}
      <div className="relative flex overflow-x-hidden md:max-w-4xl md:mx-auto">
        <div className="animate-marquee whitespace-nowrap flex items-center space-x-12 sm:space-x-16">
          {/* Double list values to prevent gaps in looping animation */}
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={index}
              className="inline-flex items-center space-x-2 text-gray-500 hover:text-black font-display font-medium text-xs sm:text-sm tracking-tight transition-colors cursor-pointer"
            >
              <span className="text-base sm:text-lg block shrink-0">{logo.icon.split(" ")[0]}</span>
              <span className="font-semibold block">{logo.icon.split(" ").slice(1).join(" ")}</span>
            </div>
          ))}
        </div>

        {/* Fades on the screen margins */}
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#fcfbf9] to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#fcfbf9] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
