import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { profileGallery, profileThemes } from '../lib/profile';
import { ProfileBadges, ProfileIcon } from './ProfileShowcase';
import LinkedText from './LinkedText';

export default function MemberProfileModal({memberId,currentUserId,connected,onClose,onViewMember,onConnect,onMessage}) {
  const dialogRef=useRef(null);
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const dialog=dialogRef.current;
    const previousFocus=document.activeElement;
    const overflow=document.body.style.overflow;
    dialog.showModal();document.body.style.overflow='hidden';
    let active=true;
    api(`/community-members/${memberId}`).then(result=>{if(active)setData(result);}).catch(err=>{if(active)setError(err.message);});
    return()=>{active=false;dialog.close();document.body.style.overflow=overflow;previousFocus?.focus();};
  },[memberId]);
  const member=data?.member;
  const person=member?{...member,ref:`user-${member.id}`,name:`${member.first_name} ${member.last_name}`}:null;
  const theme=profileThemes.includes(member?.profile_theme)?member.profile_theme:'ocean';
  const gallery=profileGallery(member);
  const date=value=>new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  return createPortal(<dialog ref={dialogRef} className={`profileModal profileStudio memberProfileModal profile-theme-${theme}`} aria-labelledby="member-profile-title" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget){const bounds=event.currentTarget.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)onClose();}}}>
    <button type="button" className="modalClose" aria-label="Close member profile" onClick={onClose}>×</button>
    {!member?<><h2 id="member-profile-title">Member profile</h2>{error?<p role="alert">{error}</p>:<p role="status">Opening their community story…</p>}</>:<>
      <header className={`profileHeader profileCover theme-${theme}`}>{member.cover_url&&<img className="profileCoverImage" src={member.cover_url} alt={`${person.name}’s profile cover`}/>}<div className="profileCoverCaption"><span>PART OF YOUR COMMUNITY</span><strong>{member.company || 'Making connections. Creating impact.'}</strong></div></header>
      <div className="profileIdentity"><div className="profileAvatar">{member.avatar_url?<img src={member.avatar_url} alt={person.name}/>:<>{member.first_name?.[0]}{member.last_name?.[0]}</>}</div><div className="profileIdentityCopy"><p className="eyebrow">MEMBER SPOTLIGHT</p><h2 id="member-profile-title">{person.name}</h2><p>{member.occupation || 'Arlington community member'}{Boolean(member.sponsor_badge)&&<span className="sponsorBadge">★ Sponsor</span>}</p></div>{member.id!==currentUserId&&<div className="profileQuickActions"><button type="button" className="primaryButton" onClick={()=>onMessage(person)}><ProfileIcon name="mail"/> Message</button><button type="button" className="secondaryButton" onClick={()=>onConnect(person)}><ProfileIcon name="people"/>{connected?'Connected ✓':'Connect'}</button></div>}</div>
      <p className="memberProfileSince">Member since {date(member.created_at)}</p>
      {member.bio?<p className="profileBio"><LinkedText>{member.bio}</LinkedText></p>:<p className="profileBio">This member is still adding their story.</p>}
      {gallery.length>0&&<div className="profilePhotoStrip">{gallery.map((photo,index)=><a href={photo} target="_blank" rel="noreferrer" key={index}><img src={photo} alt={`${person.name}’s photo ${index+1}`}/></a>)}</div>}
      <ProfileBadges earned={data.earnedPoints}/>
      <div className="memberProfileDetails"><section className="profileEventSection"><div className="profileSectionHeading"><div><p className="eyebrow">OUT IN THE COMMUNITY</p><h3><ProfileIcon name="compass"/> Event highlights</h3></div></div>{data.events.length?data.events.map(event=><article className="memberProfileEvent" key={event.id}><ProfileIcon name="star"/><div><strong>{event.title}</strong><small>{date(event.starts_at)} · {event.location}</small><span>{event.attended?'Attended':'Going'}</span></div></article>):<p className="profileEmptyState">No event highlights to share yet.</p>}</section>
      <section className="profileEventSection"><div className="profileSectionHeading"><div><p className="eyebrow">BUILDING THEIR CIRCLE</p><h3><ProfileIcon name="people"/> Connections</h3></div><span>{data.connectionCount}</span></div><p className="memberNetworkSummary">{data.connectionCount} connections · {data.followerCount} followers</p>{data.connections.length?<div className="memberConnectionGrid">{data.connections.map(connection=><button type="button" key={connection.id} onClick={()=>onViewMember(connection.id)} aria-label={`View ${connection.first_name} ${connection.last_name}’s profile`}><span className="profileNetworkAvatar">{connection.avatar_url?<img src={connection.avatar_url} alt=""/>:connection.first_name?.[0]}</span><span>{connection.first_name} {connection.last_name}</span></button>)}</div>:<p className="profileEmptyState">Their community circle is just getting started.</p>}{data.connectionCount>data.connections.length&&<p className="memberNetworkSummary">A glimpse of their community circle</p>}</section></div>
    </>}
  </dialog>,document.body);
}
