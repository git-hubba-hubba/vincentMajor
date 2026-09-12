function Nav({ currentComponent, setCurrentComponent, user, onProfileClick, onRewardsClick }) {
  const links = [["Homepage", "Home"], ["Community", "Community"], ["Directory", "Directory"], ["Events", "Events"], ["Members", "Members"]];
  return <header className="siteHeader">
    <a className="skipLink" href="#main-content">Skip to content</a>
    <button className="brand" onClick={() => setCurrentComponent("Homepage")} aria-label="Impact Arlington home"><span className="brandMark" aria-hidden="true">i<span>✳</span></span><span>impact<span className="brandLocation">ARLINGTON, TEXAS</span></span></button>
    <nav className="primaryNav" aria-label="Main navigation">{links.map(([page, label]) => <button key={page} aria-current={currentComponent === page ? "page" : undefined} onClick={() => setCurrentComponent(page)}>{label}</button>)}</nav>
    <div className="headerActions"><button className="rewardsNavButton" onClick={onRewardsClick}><span aria-hidden="true">✧</span> Rewards{user && <b>{user.points.toLocaleString()}</b>}</button><button className="profileButton" onClick={onProfileClick}>{user ? <><span className="profileButtonAvatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.first_name[0]}</span>{user.first_name}</> : <>Join / Sign in <span aria-hidden="true">↗</span></>}</button></div>
  </header>;
}
export default Nav;
