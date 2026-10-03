import SiteText from "./SiteText";
function ActiveUser({ personObj, connected, onConnect, onInvite, onMessage }) {
  return <article className="memberMaster">
    <div className="memberIntro"><img src={personObj.img} alt={`${personObj.name} profile`} className="profileCircle"/><div className="memBox"><h2 className="memName abril-fatface-regular">{personObj.name}</h2>{personObj.occupation&&<p className="memOccupation">{personObj.occupation}</p>}<div className="memBiz">{personObj.company}</div><div className="memPosition">{personObj.position}</div></div></div>
    <div className="memberExtras"><button className={connected?"connected":""} onClick={onConnect} title={connected?"Remove connection":"Add member as a connection"}><span><SiteText section="ActiveUser">{connected?"✓":"＋"}</SiteText></span><SiteText section="ActiveUser">{connected?"Connected":"Connect"}</SiteText></button><button onClick={onInvite} title="Invite member to an event"><span>◫</span><SiteText contentKey="ActiveUser.1fd9ae1607aa">{"Invite"}</SiteText></button><button onClick={onMessage} title="Send a direct message"><span>✉</span><SiteText contentKey="ActiveUser.2f77668a9dfb">{"Message"}</SiteText></button></div>
  </article>;
}

export default ActiveUser;
