import { site } from '@/config/site';

export function Marquee() {
  const values = site.values;

  return (
    <section className="bg-slate-50 py-6 overflow-hidden relative fade-sides">
      <div className="flex w-full whitespace-nowrap">
        {/* First Row */}
        <div className="animate-marquee inline-flex items-center gap-8 px-4">
          {values.map((value, i) => (
            <div key={`row1-${i}`} className="inline-flex items-center text-slate-500 font-medium text-lg uppercase tracking-wide">
              {value}
              <span className="mx-8 text-slate-300">•</span>
            </div>
          ))}
        </div>
        
        {/* Second Row for seamless loop */}
        <div className="animate-marquee inline-flex items-center gap-8 px-4" aria-hidden="true">
          {values.map((value, i) => (
            <div key={`row2-${i}`} className="inline-flex items-center text-slate-500 font-medium text-lg uppercase tracking-wide">
              {value}
              <span className="mx-8 text-slate-300">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
