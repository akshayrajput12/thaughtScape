interface PoemContentProps {
  content: string;
  isLuxury?: boolean;
}

export const PoemContent = ({ content, isLuxury }: PoemContentProps) => {
  const baseClasses = "text-gray-700 whitespace-pre-line";
  const luxuryClasses = isLuxury ? "leading-relaxed font-serif mb-6" : "mb-4";

  return (
    <div className={`${baseClasses} ${luxuryClasses}`}>
      <p>{content}</p>
    </div>
  );
};