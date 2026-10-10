import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/PostCard.css";

export default function MediaCarousel({ media }) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef(null);
  const current = media[index];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.6 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [index]);

  if (!current) return null;

  return (
    <div className="media-carousel">
      {current.type === "video" ? (
        <video
          key={current.url}
          ref={videoRef}
          src={current.url}
          className="post-media"
          controls
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={current.url} className="post-media" alt="" loading="lazy" />
      )}

      {media.length > 1 && (
        <>
          {index > 0 && (
            <button className="carousel-btn prev" onClick={() => setIndex((i) => i - 1)}>
              <FiChevronLeft />
            </button>
          )}
          {index < media.length - 1 && (
            <button className="carousel-btn next" onClick={() => setIndex((i) => i + 1)}>
              <FiChevronRight />
            </button>
          )}
          <div className="carousel-dots">
            {media.map((m, i) => (
              <span key={i} className={`carousel-dot ${i === index ? "active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
