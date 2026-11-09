import { IconText } from "./Icon";
import ProfileIcon from "./Icon";
import { profileGallery } from "../lib/profile";
// Retain the existing public name while using the shared site icon family.
export { default as ProfileIcon } from './Icon';
const tiers=[{name:'Explorer',points:100,icon:'compass',tone:'bronze'},{name:'Connector',points:500,icon:'people',tone:'silver'},{name:'Changemaker',points:1000,icon:'award',tone:'gold'},{name:'Community champion',points:2500,icon:'crown',tone:'platinum'}];
export default function ProfileShowcase({user,social,onEdit,onPersonalize,onInbox}) {
  const earned=social.earnedPoints || 0;
  const gallery=profileGallery(user);
  return <>
    <header className={`profileHeader profileCover theme-${user.profile_theme || 'ocean'}`} style={user.cover_url ? {backgroundImage:`url(${JSON.stringify(user.cover_url)})`} : undefined}>
      <div className="profileCoverCaption"><span>YOUR COMMUNITY. YOUR STORY.</span><strong>A little more you.</strong></div>
      <button type="button" onClick={onPersonalize}><ProfileIcon name="photo"/> Personalize</button>
    </header>
    <div className="profileIdentity">
      <div className="profileAvatar">{user.avatar_url?<img src={user.avatar_url} alt="Your profile"/>:<>{user.first_name?.[0]}{user.last_name?.[0]}</>}</div>
      <div className="profileIdentityCopy"><p className="eyebrow">MY IMPACT PROFILE</p><h2 id="profile-title">{user.first_name} {user.last_name}</h2><p>{user.occupation || 'Arlington community member'}{Boolean(user.sponsor_badge)&&<span className="sponsorBadge"><IconText>★ Sponsor</IconText></span>}</p></div>
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
      <div className="profileBadgeGrid">{tiers.map((tier,index)=><div className={`profileEarnedBadge ${tier.tone} ${earned>=tier.points?'unlocked':'locked'}`} key={tier.name}><div className="profileBadgeMedal"><ProfileIcon name={tier.icon}/></div><small>TIER 0{index+1}</small><strong>{tier.name}</strong><span><IconText>{earned>=tier.points?'✓ Earned':`${tier.points.toLocaleString()} activity pts`}</IconText></span></div>)}</div>
      <div className="profileBadgeProgress"><label htmlFor="badge-progress">{next?`${Math.max(0,next.points-earned).toLocaleString()} points to ${next.name}`:'All four tiers unlocked. Keep making an impact!'}<span>{earned.toLocaleString()} earned</span></label><progress id="badge-progress" value={Math.min(earned,next?.points || 2500)} max={next?.points || 2500}/><p>Earn activity points through site incentives and event attendance. Spending reward points keeps your badges intact.</p></div>
    </section>
  );
}
