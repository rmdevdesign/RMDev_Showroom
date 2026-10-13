import { useEffect, useState } from "react";
import { woodAppearance, woodColorUrl } from "./woodAppearance";
export default function FinishSwatch({
  id,
  color,
  wood = false,
}: {
  id: string;
  color: string;
  wood?: boolean;
}) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!wood) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled)
        setUrl(woodAppearance(image, id).toDataURL("image/jpeg", 0.85));
    };
    image.src = woodColorUrl;
    return () => {
      cancelled = true;
    };
  }, [id, wood]);
  return (
    <i
      style={{
        backgroundColor: color,
        backgroundImage: wood && url ? "url(" + url + ")" : undefined,
        backgroundSize: "180%",
      }}
    />
  );
}
