import { useEffect, useState } from "react";

const slides = [
  { src: "https://arlington.impactingcitiestx.com/wp-content/uploads/2026/03/Postcard-side-1-1-1024x734.jpg", alt: "Impact Arlington community postcard" },
  { src: "https://arlington.impactingcitiestx.com/wp-content/uploads/2025/11/Postcard-side-2-1024x732.jpg", alt: "Impact Arlington community information postcard" },
  { src: "https://arlington.impactingcitiestx.com/wp-content/uploads/2025/10/New-shirt-design2-1187x1536.jpg", alt: "Impact Arlington community shirt design" },
];

function CarouselHP() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const interval = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      5000,
    );
    return () => window.clearInterval(interval);
  }, [paused]);

  const changeSlide = (direction) => {
    setActiveSlide((current) =>
      (current + direction + slides.length) % slides.length,
    );
  };

  return (
    <section
      className="homepageCarousel"
      aria-roledescription="carousel"
      aria-label="Impact Arlington highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="carouselSlides">
        {slides.map((slide, index) => (
          <figure
            className={`carouselSlide${index === activeSlide ? " isActive" : ""}`}
            aria-hidden={index !== activeSlide}
            key={slide.src}
          >
            <img src={slide.src} alt={index === activeSlide ? slide.alt : ""} />
          </figure>
        ))}
        <div className="carouselShade" aria-hidden="true"></div>
        <div className="carouselLabel">
          <span>Impact Arlington</span>
          <strong>Community in motion</strong>
        </div>
      </div>

      <button className="carouselArrow carouselPrevious" type="button" onClick={() => changeSlide(-1)} aria-label="Show previous slide">‹</button>
      <button className="carouselArrow carouselNext" type="button" onClick={() => changeSlide(1)} aria-label="Show next slide">›</button>

      <div className="carouselControls">
        <div className="carouselDots" aria-label="Choose a slide">
          {slides.map((slide, index) => (
            <button
              className={index === activeSlide ? "isActive" : ""}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              key={slide.src}
            ></button>
          ))}
        </div>
        <button className="carouselPause" type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Resume carousel" : "Pause carousel"}>
          {paused ? "Play" : "Pause"}
        </button>
      </div>
    </section>
  );
}

export default CarouselHP;
