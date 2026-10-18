import InboxMessage from './InboxMessage';

export default function InboxConversations({messages,onClear}) {
  const conversations=new Map();
  // The API returns newest first, so insertion order also prioritizes active conversations.
  for(const message of messages){
    const key=message.sender_id;
    if(!conversations.has(key))conversations.set(key,[]);
    conversations.get(key).push(message);
  }
  return <div className="inboxConversations">{Array.from(conversations.entries()).map(([senderId,items],index)=>{
    const latest=items[0];
    const name=`${latest.first_name} ${latest.last_name}`;
    return <details className="inboxConversation" key={senderId} open={index===0}>
      <summary><span className="profileNetworkAvatar" aria-hidden="true">{latest.avatar_url?<img src={latest.avatar_url} alt=""/>:<>{latest.first_name?.[0]}{latest.last_name?.[0]}</>}</span><span className="inboxConversationHeading"><strong>{name}</strong><span>{latest.body}</span></span><span className="inboxConversationCount">{items.length} {items.length===1?'message':'messages'}</span><span className="inboxConversationChevron" aria-hidden="true">⌄</span></summary>
      <div className="inboxConversationMessages" aria-label={`Messages from ${name}`}>{[...items].reverse().map(item=><InboxMessage key={item.id} item={item} showSender={false} canReply={item.id===latest.id} onClear={()=>onClear(item.id)}/>)}</div>
    </details>;
  })}</div>;
}
