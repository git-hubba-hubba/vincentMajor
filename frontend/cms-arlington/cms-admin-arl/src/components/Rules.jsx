import SiteText from "./SiteText";
function Rules() {
  const communityRules = [
    {
      number: "01",
      symbol: "♡",
      title: "Lead with kindness",
      description:
        "Be kind and courteous online as well as off. We’re in this together to create an inviting and welcoming environment.",
    },
    {
      number: "02",
      symbol: "◇",
      title: "Keep everyone safe",
      description:
        "No hate speech or bullying. Bullying of any kind will not be allowed. Degrading comments about religion, race, sexual orientation, or culture will not be tolerated.",
    },
    {
      number: "03",
      symbol: "⌾",
      title: "Respect privacy",
      description:
        "Being part of our community requires mutual trust. Authentic, expressive discussions make communities great, but always be sensitive to the privacy of others.",
    },
  ];

  return (
    <section className="rulesSection" aria-labelledby="rules-heading">
      <div className="rulesIntro">
        <div className="rulesIntroCopy">
          <p className="rulesKicker"><SiteText contentKey="Rules.54bd5e8bb54c">{"Our community promise"}</SiteText></p>
          <h2 id="rules-heading"><SiteText contentKey="Rules.d786b9e5c8e2">{"A community isn’t a true community without"}</SiteText><span><SiteText contentKey="Rules.c3805cf8d9d4">{" rules, morals & values."}</SiteText></span>
          </h2>
          <p><SiteText contentKey="Rules.c124d841e709">{"Take the time to read our rules for making the world a better place—one neighbor, conversation, and act of kindness at a time."}</SiteText></p>
          <div className="rulesSignature">
            <span aria-hidden="true">✦</span>
            <p><strong><SiteText contentKey="Rules.8b28c004587f">{"Belong. Respect. Uplift."}</SiteText></strong><small><SiteText contentKey="Rules.14226d39d980">{"That’s how Arlington makes an impact."}</SiteText></small></p>
          </div>
        </div>
        <div className="rulesPeople" aria-hidden="true">
          <span className="rulesOrbit rulesOrbitOne"><SiteText contentKey="Rules.2dd91040a484">{"kindness"}</SiteText></span>
          <span className="rulesOrbit rulesOrbitTwo"><SiteText contentKey="Rules.f796e2f28ae5">{"trust"}</SiteText></span>
          <img src="/images/community-rules-avatars.png" alt="" />
        </div>
      </div>

      <div className="rulesGrid">
        {communityRules.map((rule) => (
          <article className="ruleCard" key={rule.number}>
            <div className="ruleCardTop">
              <span className="ruleSymbol" aria-hidden="true">{rule.symbol}</span>
              <span className="ruleNumber">{rule.number}</span>
            </div>
            <h3><SiteText section="Rules">{rule.title}</SiteText></h3>
            <p><SiteText section="Rules">{rule.description}</SiteText></p>
          </article>
        ))}
      </div>

      <p className="rulesFooter"><SiteText contentKey="Rules.3a4327a2008c">{"By participating, every member helps protect the welcoming community we’re building together."}</SiteText></p>
    </section>
  );
}

export default Rules;
