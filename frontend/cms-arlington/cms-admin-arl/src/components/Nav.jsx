import SiteText from "./SiteText";
function Nav({ currentComponent, setCurrentComponent, user, onProfileClick, onRewardsClick }) {
  const links = [["Homepage", "Home"], ["Community", "Community"], ["Directory", "Directory"], ["Events", "Events"], ["Members", "Members"]];
  return <header className="siteHeader">
    <a className="skipLink" href="#main-content"><SiteText contentKey="Nav.ac576a66d456">{"Skip to content"}</SiteText></a>
    <button className="brand" onClick={() => setCurrentComponent("Homepage")} aria-label="Impact Arlington home"><img className="brandLogo" src="/images/impact-official-logo.png" alt="IMPACT — Walk With Us" width="2062" height="778" /></button>
    <nav className="primaryNav" aria-label="Main navigation">{links.map(([page, label]) => <button key={page} aria-current={currentComponent === page ? "page" : undefined} onClick={() => setCurrentComponent(page)}><SiteText section="Nav">{label}</SiteText></button>)}</nav>
    <div className="headerActions"><button className="rewardsNavButton" onClick={onRewardsClick}><span aria-hidden="true">✧</span><SiteText contentKey="Nav.d97f89486f63">{" Rewards"}</SiteText>{user && <b>{user.points.toLocaleString()}</b>}</button><button className="profileButton" onClick={onProfileClick}>{user ? <><span className="profileButtonAvatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.first_name[0]}</span>{user.first_name}</> : <><SiteText contentKey="Nav.849f21b8ac0a">{"Join / Sign in "}</SiteText><span aria-hidden="true">↗</span></>}</button></div>
  </header>;
}
export default Nav;
