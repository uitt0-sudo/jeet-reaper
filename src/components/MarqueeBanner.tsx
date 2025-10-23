export const MarqueeBanner = () => {
  return (
    <div className="hazard-stripe w-full overflow-hidden py-2">
      <div className="flex animate-marquee whitespace-nowrap">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="mx-8 text-lg font-black tracking-wider">
            ARE YOU A JEET?
          </span>
        ))}
      </div>
    </div>
  );
};
