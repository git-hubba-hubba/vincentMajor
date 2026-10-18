import { useState } from 'react';
import { api } from '../lib/api';
import LinkedText from './LinkedText';

export default function CommunityComment({comment,user,parentType,parentId,onChange}) {
  const [editing,setEditing]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [draft,setDraft]=useState(comment.body);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const ownsComment=Boolean(user)&&user.id===comment.user_id;
  const inputId=`comment-edit-${parentType}-${parentId}-${comment.id}`;
  const mutate=async method=>{
    if(busy)return;
    setBusy(true);setError('');
    try{
      const result=await api(`/${parentType}/${parentId}/comments/${comment.id}`,{method,...(method==='PATCH'?{body:JSON.stringify({body:draft.trim()})}:{})});
      onChange(comment.id,method==='DELETE'?null:result.body);
      setEditing(false);setConfirmDelete(false);
    }catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <article className="communityComment">
    <span className="commentAvatar" aria-hidden="true">{comment.avatar_url?<img src={comment.avatar_url} alt=""/>:<>{comment.first_name?.[0]}{comment.last_name?.[0]}</>}</span>
    <div className="commentContent"><strong className="commentAuthor">{comment.first_name} {comment.last_name}</strong>
      {editing&&ownsComment?<form className="commentEditForm" onSubmit={event=>{event.preventDefault();mutate('PATCH');}}><label htmlFor={inputId}>Edit your comment</label><textarea id={inputId} autoFocus required maxLength={500} rows={3} value={draft} disabled={busy} onChange={event=>setDraft(event.target.value)}/><small>{draft.length}/500</small><div className="commentControls"><button type="submit" disabled={busy||!draft.trim()}>{busy?'Saving…':'Save changes'}</button><button type="button" disabled={busy} onClick={()=>{setEditing(false);setError('');}}>Cancel</button></div></form>:<p className="commentBody"><LinkedText>{comment.body}</LinkedText></p>}
      {ownsComment&&!editing&&(confirmDelete?<div className="commentDeletePrompt"><p>Delete this comment? This can’t be undone.</p><div className="commentControls"><button type="button" className="commentDelete" disabled={busy} onClick={()=>mutate('DELETE')}>{busy?'Deleting…':'Yes, delete'}</button><button type="button" disabled={busy} onClick={()=>{setConfirmDelete(false);setError('');}}>Keep comment</button></div></div>:<div className="commentControls"><button type="button" onClick={()=>{setDraft(comment.body);setEditing(true);setError('');}}>Edit</button><button type="button" className="commentDelete" onClick={()=>{setConfirmDelete(true);setError('');}}>Delete</button></div>)}
      {error&&<p className="commentError" role="alert">{error}</p>}
    </div>
  </article>;
}
