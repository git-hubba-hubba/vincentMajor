import { useState } from 'react';
import { api } from '../lib/api';

export default function PasswordRecovery({token,email:initialEmail,onBack,onComplete}) {
  const [email,setEmail]=useState(initialEmail || '');
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const submit=async event=>{
    event.preventDefault();setError('');setMessage('');
    if(token&&password!==confirmation){setError('Your passwords don’t match. Please try again.');return;}
    setBusy(true);
    try{const result=await api(`/auth/${token?'reset-password':'forgot-password'}`,{method:'POST',body:JSON.stringify(token?{token,password}:{email})});if(token){setPassword('');setConfirmation('');onComplete(result.message);}else setMessage(result.message);}
    catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <div className="passwordRecovery"><p>{token?'Choose a new password to get back into your community.':'Enter your account email and we’ll send you a link to reset your password.'}</p><form className="profileForm" onSubmit={submit}>
    {token?<><label>New password<input autoFocus required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} disabled={busy} onChange={event=>setPassword(event.target.value)}/><span className="fieldHint">Use at least 8 characters.</span></label><label>Confirm new password<input required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)}/></label></>:<label>Email address<input autoFocus required type="email" autoComplete="email" maxLength={254} value={email} disabled={busy} onChange={event=>setEmail(event.target.value)}/></label>}
    {error&&<p className="formMessage" role="alert">{error}</p>}{message&&<p className="formMessage" role="status">{message}</p>}
    <button className="primaryButton" disabled={busy}>{busy?'Please wait…':token?'Save new password':message?'Send another reset link':'Send reset link'}</button>
    <button type="button" className="textButton" disabled={busy} onClick={onBack}>{token?'Request a new reset link':'← Back to sign in'}</button>
  </form></div>;
}
