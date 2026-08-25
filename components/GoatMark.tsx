export default function GoatMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* chifres formam uma seta de crescimento */}
      <path
        d="M10 20 L4 8 M10 20 L14 7"
        stroke="#E8A94C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M38 20 L44 8 M38 20 L34 7"
        stroke="#E8A94C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* cabeça */}
      <path
        d="M24 12c7 0 12 5.5 12 13 0 6.5-4.5 11-9 12.5-1 .5-1.5 1.5-1.5 2.5H22.5c0-1-.5-2-1.5-2.5-4.5-1.5-9-6-9-12.5 0-7.5 5-13 12-13z"
        fill="#C8FF4D"
      />
      <circle cx="19.5" cy="23" r="2" fill="#0F1B14" />
      <circle cx="28.5" cy="23" r="2" fill="#0F1B14" />
      <path d="M22 29c1 1 3 1 4 0" stroke="#0F1B14" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
