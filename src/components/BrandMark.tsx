interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'w-7 h-7' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="storyweave-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="url(#storyweave-grad)"
        fillOpacity="0.16"
        stroke="url(#storyweave-grad)"
        strokeWidth="1.5"
      />
      <path
        d="M9.5 21.5C12.5 19.5 14 15.5 16 10.5C18 15.5 19.5 19.5 22.5 21.5"
        stroke="url(#storyweave-grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 16.5C14 15 18 15 21 16.5"
        stroke="#F8FAFC"
        strokeOpacity="0.9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="9.5" r="1.5" fill="#A78BFA" />
    </svg>
  );
}
