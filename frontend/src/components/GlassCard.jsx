export const GlassCard = ({ children, className = '', hoverEffect = true }) => {
  return (
    <div className={`
      relative backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg rounded-2xl 
      transition-all duration-300 ease-in-out overflow-hidden
      ${hoverEffect ? 'hover:scale-[1.02] hover:shadow-2xl hover:border-white/20 group' : ''}
      ${className}
    `}>
      {/* Glossy sheen effect on hover */}
      {hoverEffect && (
        <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-10 group-hover:animate-shine transition-opacity duration-500 pointer-events-none" />
      )}
      {children}
    </div>
  );
};
