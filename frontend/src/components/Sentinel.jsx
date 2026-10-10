import { useEffect, useRef } from "react";
import "../styles/Common.css";

export default function Sentinel({ onVisible, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onVisible();
      },
      { rootMargin: "400px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible, disabled]);

  return <div ref={ref} className="sentinel" />;
}
