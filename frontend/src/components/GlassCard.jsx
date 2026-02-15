export const GlassCard = ({ children, className = '', hoverEffect = true }) => {
  return (
    <div className={`
      relative bg-slate-800/40 border border-white/[0.06] rounded-xl 
      transition-all duration-200 ease-in-out overflow-hidden
      ${hoverEffect ? 'hover:border-white/[0.1] group' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};
