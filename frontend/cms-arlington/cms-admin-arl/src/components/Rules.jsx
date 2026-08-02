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
          <p className="rulesKicker">Our community promise</p>
          <h2 id="rules-heading">
            A community isn’t a true community without
            <span> rules, morals &amp; values.</span>
          </h2>
          <p>
            Take the time to read our rules for making the world a better
            place—one neighbor, conversation, and act of kindness at a time.
          </p>
          <div className="rulesSignature">
            <span aria-hidden="true">✦</span>
            <p><strong>Belong. Respect. Uplift.</strong><small>That’s how Arlington makes an impact.</small></p>
          </div>
        </div>
        <div className="rulesPeople" aria-hidden="true">
          <span className="rulesOrbit rulesOrbitOne">kindness</span>
          <span className="rulesOrbit rulesOrbitTwo">trust</span>
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
            <h3>{rule.title}</h3>
            <p>{rule.description}</p>
          </article>
        ))}
      </div>

      <p className="rulesFooter">
        By participating, every member helps protect the welcoming community
        we’re building together.
      </p>
    </section>
  );
}

export default Rules;
