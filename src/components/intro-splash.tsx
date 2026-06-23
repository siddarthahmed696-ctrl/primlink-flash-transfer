import { useEffect, useState } from "react";
import { UTransferLogo } from "./vmoveyou-logo";

export function IntroSplash() {
  const [stage, setStage] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    if (sessionStorage.getItem("ut_intro_shown")) {
      setStage("done");
      return;
    }
    if (stage === "done") return;
    const t1 = setTimeout(() => setStage("out"), 1500);
    const t2 = setTimeout(() => {
      setStage("done");
      sessionStorage.setItem("ut_intro_shown", "1");
    }, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [stage]);

  if (stage === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-gradient-to-br from-black via-[#0a0a1a] to-blue-900 transition-opacity duration-700 ${
        stage === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="w-32 max-w-[70vw] sm:w-44 animate-[ut_pop_900ms_cubic-bezier(.2,.9,.3,1.3)_both]">
          <UTransferLogo size={180} className="h-auto w-full" sizes="(max-width: 640px) 128px, 180px" />
        </div>
      </div>
      <style>{`
        @keyframes ut_pop {
          0% { transform: scale(.4) rotate(-15deg); opacity: 0; filter: blur(8px); }
          60% { transform: scale(1.1) rotate(4deg); opacity: 1; filter: blur(0); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes ut_fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
