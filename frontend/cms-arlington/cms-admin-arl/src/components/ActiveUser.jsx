function ActiveUser({ personObj, connected, onConnect, onInvite, onMessage }) {
  return <article className="memberMaster">
    <div className="memberIntro"><img src={personObj.img} alt={`${personObj.name} profile`} className="profileCircle"/><div className="memBox"><h2 className="memName abril-fatface-regular">{personObj.name}</h2><div className="memBiz">{personObj.company}</div><div className="memPosition">{personObj.position}</div></div></div>
    <div className="memberExtras"><button className={connected?"connected":""} onClick={onConnect} title={connected?"Remove connection":"Add member as a connection"}><span>{connected?"✓":"＋"}</span>{connected?"Connected":"Connect"}</button><button onClick={onInvite} title="Invite member to an event"><span>◫</span>Invite</button><button onClick={onMessage} title="Send a direct message"><span>✉</span>Message</button></div>
  </article>;
}

export default ActiveUser;
