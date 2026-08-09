import { useMemo, useState } from "react";

function EventCalendar({ events, onAdd }) {
  const [month,setMonth]=useState(()=>{const first=events[0]?.starts_at?new Date(events[0].starts_at):new Date();return new Date(first.getFullYear(),first.getMonth(),1);});
  const cells=useMemo(()=>{const firstDay=month.getDay();const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return [...Array(firstDay).fill(null),...Array.from({length:days},(_,index)=>index+1)];},[month]);
  const inMonth=events.filter(event=>{const date=new Date(event.starts_at);return date.getFullYear()===month.getFullYear()&&date.getMonth()===month.getMonth();});
  return <section className="communityCalendar"><header><div><p className="eventsEyebrow">Plan your month</p><h2>Community calendar</h2></div><div><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} aria-label="Previous month">‹</button><strong>{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</strong><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} aria-label="Next month">›</button></div></header><div className="calendarWeek">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day}>{day}</span>)}</div><div className="calendarGrid">{cells.map((day,index)=>{const dayEvents=day?inMonth.filter(event=>new Date(event.starts_at).getDate()===day):[];return <div className={dayEvents.length?"hasEvents":""} key={`${day||"blank"}-${index}`}>{day&&<><b>{day}</b>{dayEvents.slice(0,2).map(event=><button key={event.id} onClick={()=>onAdd(event)} title={`Add ${event.title} to your calendar`}>{event.title}</button>)}{dayEvents.length>2&&<small>+{dayEvents.length-2} more</small>}</>}</div>;})}</div><p className="calendarHint">Select an event inside the calendar to download it to your personal calendar.</p></section>;
}

export default EventCalendar;
