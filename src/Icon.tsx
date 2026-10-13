type IconName =
  "rotate" | "pause" | "center" | "download" | "reset" | "external";
export default function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    rotate: (
      <>
        <path d="M20 8a8 8 0 1 0 .3 7" />
        <path d="M20 3v5h-5" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    center: (
      <>
        <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4" />
      </>
    ),
    reset: (
      <>
        <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
      </>
    ),
    external: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="icon"
    >
      {paths[name]}
    </svg>
  );
}
