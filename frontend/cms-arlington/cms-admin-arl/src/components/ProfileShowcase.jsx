import { profileGallery } from "../lib/profile";
const paths = {
  mail: 'M3 5h18v14H3z M3 5l9 8 9-8',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4',
  edit: 'M12 20H4v-8 M15 4l5 5 M8 16l3-1L21 5l-4-4L7 11z',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  compass: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0 M16 8l-3 5-5 3 3-5z',
  award: 'M17 8a5 5 0 1 0-10 0 5 5 0 0 0 10 0 M8 12l-2 10 6-3 6 3-2-10',
  crown: 'm2 6 5 4 5-7 5 7 5-4-3 14H5z',
  photo: 'M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 6 M16 8h.01',
};
export function ProfileIcon({name, ...props}) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.star}/></svg>; }
const tiers=[{name:'Explorer',points:100,icon:'compass',tone:'bronze'},{name:'Connector',points:500,icon:'people',tone:'silver'},{name:'Changemaker',points:1000,icon:'award',tone:'gold'},{name:'Community champion',points:2500,icon:'crown',tone:'platinum'}];
export default function ProfileShowcase({user,social,onEdit,onPersonalize,onInbox}) {
  const earned=social.earnedPoints || 0;
  const gallery=profileGallery(user);
  return <>
    <header className={`profileHeader profileCover theme-${user.profile_theme || 'ocean'}`}>
      {user.cover_url&&<img className="profileCoverImage" src={user.cover_url} alt="Your profile cover"/>}
      <div className="profileCoverCaption"><span>YOUR COMMUNITY. YOUR STORY.</span><strong>A little more you.</strong></div>
      <button type="button" onClick={onPersonalize}><ProfileIcon name="photo"/> Personalize</button>
    </header>
    <div className="profileIdentity">
      <div className="profileAvatar">{user.avatar_url?<img src={user.avatar_url} alt="Your profile"/>:<>{user.first_name?.[0]}{user.last_name?.[0]}</>}</div>
      <div className="profileIdentityCopy"><p className="eyebrow">MY IMPACT PROFILE</p><h2 id="profile-title">{user.first_name} {user.last_name}</h2><p>{user.occupation || 'Arlington community member'}{Boolean(user.sponsor_badge)&&<span className="sponsorBadge">★ Sponsor</span>}</p></div>
      <div className="profileQuickActions"><button className="primaryButton" onClick={onInbox}><ProfileIcon name="mail"/> Inbox <span>{social.messages.length}</span></button><button className="secondaryButton" onClick={onEdit}><ProfileIcon name="edit"/> Edit profile</button></div>
    </div>
    <p className="profileBio">{user.bio || 'Your story belongs here. Add a bio, choose your colors, and share the moments that matter to you.'}</p>
    <div className="profilePhotoStrip">{gallery.map((photo,index)=><a href={photo} target="_blank" rel="noreferrer" key={index}><img src={photo} alt={`Your profile gallery photo ${index+1}`}/></a>)}{gallery.length<4&&<button type="button" onClick={onEdit}><ProfileIcon name="photo"/><span>{gallery.length?'Add a moment':'Share your moments'}</span><small>Make this space your own</small></button>}</div>
    <ProfileBadges earned={earned}/>
  </>;
}

export function ProfileBadges({earned=0}) {
  const next=tiers.find(tier=>earned<tier.points);
  return (
    <section className="profileBadgeShowcase" aria-label="Badge collection">
      <div className="profileSectionHeading"><div><p className="eyebrow">EVERY STEP MAKES AN IMPACT</p><h3><ProfileIcon name="award"/> Badge collection</h3></div><span>{tiers.filter(tier=>earned>=tier.points).length} / 4 earned</span></div>
      <div className="profileBadgeGrid">{tiers.map((tier,index)=><div className={`profileEarnedBadge ${tier.tone} ${earned>=tier.points?'unlocked':'locked'}`} key={tier.name}><div className="profileBadgeMedal"><ProfileIcon name={tier.icon}/></div><small>TIER 0{index+1}</small><strong>{tier.name}</strong><span>{earned>=tier.points?'✓ Earned':`${tier.points.toLocaleString()} activity pts`}</span></div>)}</div>
      <div className="profileBadgeProgress"><label htmlFor="badge-progress">{next?`${Math.max(0,next.points-earned).toLocaleString()} points to ${next.name}`:'All four tiers unlocked. Keep making an impact!'}<span>{earned.toLocaleString()} earned</span></label><progress id="badge-progress" value={Math.min(earned,next?.points || 2500)} max={next?.points || 2500}/><p>Earn activity points through site incentives and event attendance. Spending reward points keeps your badges intact.</p></div>
    </section>
  );
}
