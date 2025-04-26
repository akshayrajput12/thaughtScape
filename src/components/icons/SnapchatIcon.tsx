
import { SVGProps } from "react";

export const SnapchatIcon = (props: SVGProps<SVGSVGElement>) => {
  // Extract size from props if provided, otherwise use width/height attributes
  const { width, height, ...restProps } = props;
  const size = props.width || props.height || 24;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...restProps}
    >
      <path d="M12 2c-2.8 0-5 2.2-5 5v4c0 .2-.2.5-.4.6-1 .5-4.6 2-4.6 2 .3 1.2 1.4 1.5 2 1.7.7.2 1.5.3 1.5.8 0 .3-.5.5-1 1s-.5 1-.5 1 2 .4 4 2c0 .5-.5 1-2.5 1S8 20 12 20s6.5 0 6.5-1-2.5-.5-2.5-1c2-1.6 4-2 4-2s0-.5-.5-1-1-.7-1-1c0-.5.8-.6 1.5-.8.6-.2 1.7-.5 2-1.7 0 0-3.6-1.5-4.6-2-.2-.1-.4-.4-.4-.6V7c0-2.8-2.2-5-5-5Z" />
    </svg>
  );
};
