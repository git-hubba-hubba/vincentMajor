function Vision() {
  const focusAreas = [
    { icon: "+", title: "Health", note: "Stronger bodies and minds" },
    { icon: "$", title: "Finances", note: "Tools for a secure future" },
    { icon: "♪", title: "Entertainment", note: "More reasons to come together" },
    { icon: "☀", title: "Positive living", note: "Celebrating the good in life" },
  ];

  const visionPath = [
    {
      label: "What",
      title: "Get more out of life",
      description: "We work together, share resources, and help one another grow.",
    },
    {
      label: "Where",
      title: "Arlington—and beyond",
      description: "We begin in Arlington, Texas and surrounding communities, with a goal of expanding into other cities.",
    },
    {
      label: "When",
      title: "Every chance we get",
      description: "Positive change is not a special occasion. We make room for it every day.",
    },
    {
      label: "How",
      title: "Plan. Connect. Act.",
      description: "We use this platform to bring people together and make meaningful change happen.",
    },
  ];

  return (
    <section className="visionSection" aria-labelledby="vision-heading">
      <header className="visionHero">
        <div className="visionCopy">
          <p className="visionKicker">More than a social platform</p>
          <h2 id="vision-heading">A community within <em>the community.</em></h2>
          <p>
            Impact is a community hub where people operate like family—coming
            together to improve their lives and the place they call home.
          </p>
          <div className="visionCallout">
            <span>Our vision</span>
            <strong>Better lives create stronger communities.</strong>
          </div>
        </div>

        <div className="impactMap" aria-label="Our four areas of focus">
          <div className="impactRings" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div className="impactCenter">
            <span className="impactStar" aria-hidden="true">★</span>
            <strong>Arlington</strong>
            <small>Texas</small>
          </div>
          {focusAreas.map((area, index) => (
            <div className={`focusPoint focusPoint${index + 1}`} key={area.title}>
              <span aria-hidden="true">{area.icon}</span>
              <div><strong>{area.title}</strong><small>{area.note}</small></div>
            </div>
          ))}
        </div>
      </header>

      <div className="visionPath">
        <div className="visionPathLine" aria-hidden="true"></div>
        {visionPath.map((item, index) => (
          <article className="visionStep" key={item.label}>
            <span className="visionStepNumber">0{index + 1}</span>
            <p>{item.label}</p>
            <h3>{item.title}</h3>
            <small>{item.description}</small>
          </article>
        ))}
      </div>

      <footer className="visionFooter">
        <div aria-hidden="true"><span></span><span></span><span></span></div>
        <p>It’s time to</p>
        <strong>live life different.</strong>
        <small>Together, every chance we get.</small>
      </footer>
    </section>
  );
}

export default Vision;
