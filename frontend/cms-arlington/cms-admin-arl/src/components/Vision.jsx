import SiteText from "./SiteText";
import BusinessQuad from '../components/BusinessQuad'
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
          <p className="visionKicker"><SiteText contentKey="Vision.c439956609b0">{"More than a social platform"}</SiteText></p>
          <h2 id="vision-heading"><SiteText contentKey="Vision.2a7b7c15012c">{"A community within "}</SiteText><em><SiteText contentKey="Vision.9d3a4803ad5c">{"the community."}</SiteText></em></h2>
          <p><SiteText contentKey="Vision.83e6ebcf9db5">{"Impact is a community hub where people operate like family—coming together to improve their lives and the place they call home."}</SiteText></p>
          <div className="visionCallout">
            <span><SiteText contentKey="Vision.2642f93dd297">{"Our vision"}</SiteText></span>
            <strong><SiteText contentKey="Vision.38fa6d906a03">{"Better lives create stronger communities."}</SiteText></strong>
          </div>
        </div>

        <div className="impactMap" aria-label="Our four areas of focus">
          <div className="impactRings" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div className="impactCenter">
            <span className="impactStar" aria-hidden="true">★</span>
            <strong><SiteText contentKey="Vision.f1cb587545a0">{"Arlington"}</SiteText></strong>
            <small><SiteText contentKey="Vision.4b95ce627201">{"Texas"}</SiteText></small>
          </div>
          {focusAreas.map((area, index) => (
            <div className={`focusPoint focusPoint${index + 1}`} key={area.title}>
              <span aria-hidden="true">{area.icon}</span>
              <div><strong><SiteText section="Vision">{area.title}</SiteText></strong><small><SiteText section="Vision">{area.note}</SiteText></small></div>
            </div>
          ))}
        </div>
      </header>

      <div className="visionPath">
        <div className="visionPathLine" aria-hidden="true"></div>
        {visionPath.map((item, index) => (
          <article className="visionStep" key={item.label}>
            <span className="visionStepNumber">0{index + 1}</span>
            <p><SiteText section="Vision">{item.label}</SiteText></p>
            <h3><SiteText section="Vision">{item.title}</SiteText></h3>
            <small><SiteText section="Vision">{item.description}</SiteText></small>
          </article>
        ))}
      </div>
<BusinessQuad />
      <footer className="visionFooter">
        <div aria-hidden="true"><span></span><span></span><span></span></div>
        <p><SiteText contentKey="Vision.109b0f8236f6">{"It’s time to"}</SiteText></p>
        <strong><SiteText contentKey="Vision.c718343e46c2">{"live life different."}</SiteText></strong>
        <small><SiteText contentKey="Vision.4ee86f7abbd1">{"Together, every chance we get."}</SiteText></small>
      </footer>
    </section>
  );
}

export default Vision;
