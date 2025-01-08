interface PoemContentProps {
  content: string;
  isLuxury?: boolean;
}

export const PoemContent = ({ content, isLuxury }: PoemContentProps) => {
  const baseClasses = "text-gray-700 whitespace-pre-line";
  const luxuryClasses = isLuxury 
    ? "leading-relaxed font-serif text-lg mb-6" 
    : "leading-relaxed mb-4 text-base";

  return (
    <div className={`${baseClasses} ${luxuryClasses}`}>
      <p className="first-letter:text-3xl first-letter:font-serif first-letter:mr-1">
        {content}
      </p>
    </div>
  );
};