import SiteText from "../components/SiteText";
import { useCallback, useEffect, useMemo, useState } from "react";
import Namespace from "../components/Namespace";
import businessCategories from "../data/businessCategories";
import { api } from "../lib/api";

const generalBusinessImages = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80"
];

const businessImage = (business) => {
  const hasCustomImage = business.image_url && business.image_url !== "/images/impDirectory.png";
  if (hasCustomImage) return business.image_url;
  const numericId = Number(business.id);
  const index = Number.isFinite(numericId) ? Math.abs(numericId - 1) % generalBusinessImages.length : 0;
  return generalBusinessImages[index];
};

function Directory() {
  const [businesses,setBusinesses]=useState([]); const [category,setCategory]=useState("All"); const [search,setSearch]=useState(""); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const loadDirectory=useCallback(async()=>{try{setBusinesses(await api("/directory"));setError("");}catch(err){setError(err.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{const request=window.setTimeout(loadDirectory,0);return()=>window.clearTimeout(request);},[loadDirectory]);
  const visible=useMemo(()=>businesses.filter(business=>{
    const matchesCategory=category==="All"||business.category===category; const term=search.trim().toLowerCase();
    return matchesCategory&&(!term||[business.name,business.category,business.description,business.address].some(value=>String(value||"").toLowerCase().includes(term)));
  }),[businesses,category,search]);
  const spotlight=useMemo(()=>{
    if(category==="All") return businesses.filter(item=>item.spotlight_position).sort((a,b)=>a.spotlight_position-b.spotlight_position).slice(0,5);
    return Array.from({length:5},(_,index)=>businesses.find(item=>item.category===category&&item.spotlight_position===index+1)||null);
  },[businesses,category]);
  const initials=(name)=>name.split(" ").slice(0,2).map(word=>word[0]).join("");

  return <main className="directoryPage">
    <section className="directoryHero">
      <div><p className="directoryKicker"><SiteText contentKey="Directory.745a3b19d663">{"Shop local • Grow together"}</SiteText></p><h1><SiteText contentKey="Directory.ca59391647a2">{"Meet the businesses behind "}</SiteText><span><SiteText contentKey="Directory.730d40f862a8">{"our community."}</SiteText></span></h1><p><SiteText contentKey="Directory.8574ac75f672">{"Discover trusted services, neighborhood favorites, and community partners approved by Impact Arlington."}</SiteText></p><div className="directoryStats"><div><strong>{businesses.length}</strong><span><SiteText contentKey="Directory.3648201ea147">{"Approved businesses"}</SiteText></span></div><div><strong>{new Set(businesses.map(item=>item.category)).size}</strong><span><SiteText contentKey="Directory.6f7f2581fc7d">{"Categories represented"}</SiteText></span></div><div><strong>5</strong><span><SiteText contentKey="Directory.b4c95aa662f2">{"Spotlight slots per category"}</SiteText></span></div></div></div>
      <div className="directoryHeroArt"><img src="/images/impDirectory.png" alt="Impact Arlington business community"/></div>
    </section>
    <Namespace title="Business Directory"/>
    <section className="directoryTools" aria-label="Directory filters"><label className="directorySearch"><span>⌕</span><input type="search" placeholder="Search businesses, services, or neighborhoods" value={search} onChange={event=>setSearch(event.target.value)}/></label><label className="categorySelect"><span><SiteText contentKey="Directory.40117e0aaa9f">{"Browse category"}</SiteText></span><select value={category} onChange={event=>setCategory(event.target.value)}><option><SiteText contentKey="Directory.a52ace420f21">{"All"}</SiteText></option>{businessCategories.map(item=><option key={item}>{item}</option>)}</select></label></section>
    <section className="spotlightSection"><div className="directorySectionTitle"><div><p className="directoryKicker"><SiteText contentKey="Directory.aafdb49c60a6">{"Editor’s row"}</SiteText></p><h2><SiteText section="Directory">{category==="All"?"Community spotlight":`${category} spotlight`}</SiteText></h2></div><p><SiteText section="Directory">{category==="All"?"A rotating selection of standout community businesses.":"Five premium positions curated and managed by the Impact Arlington admin team."}</SiteText></p></div><div className="spotlightRail">{spotlight.map((business,index)=>business?<article className="spotlightBusiness" key={business.id}><div className="spotlightImage" style={{backgroundImage:`linear-gradient(180deg,rgba(15,48,62,.05),rgba(15,48,62,.72)),url(${businessImage(business)})`}}><span className="spotlightNumber">0{business.spotlight_position||index+1}</span><div className="businessMonogram">{initials(business.name)}</div></div><p>{business.category}{business.verified&&<span className="verifiedBadge"><SiteText contentKey="Directory.79b46a980fb0">{"✓ Verified"}</SiteText></span>}</p><h3>{business.name}</h3><small>{business.description}</small><a href={business.website} target="_blank" rel="noreferrer"><SiteText contentKey="Directory.7935aef2b662">{"Visit business "}</SiteText><span>↗</span></a></article>:<article className="spotlightBusiness emptySpotlight" key={`empty-${index}`}><span className="spotlightNumber">0{index+1}</span><div className="businessMonogram">＋</div><p><SiteText contentKey="Directory.72847df7b942">{"Available position"}</SiteText></p><h3><SiteText contentKey="Directory.c2b7915e5982">{"Spotlight slot"}</SiteText></h3><small><SiteText contentKey="Directory.1b7626af604f">{"An approved business can be featured here by an administrator."}</SiteText></small></article>)}</div></section>
    <section className="allBusinesses"><div className="directorySectionTitle"><div><p className="directoryKicker"><SiteText contentKey="Directory.d33ad9f068b4">{"Explore Arlington"}</SiteText></p><h2><SiteText section="Directory">{category==="All"?"All community businesses":category}</SiteText></h2></div><p>{visible.length} <SiteText section="Directory">{visible.length===1?"business":"businesses"}</SiteText><SiteText contentKey="Directory.710b0411e0e4">{" found"}</SiteText></p></div>{error&&<p className="directoryMessage">{error}</p>}{loading?<p className="directoryMessage"><SiteText contentKey="Directory.4941331477bf">{"Opening the directory…"}</SiteText></p>:visible.length===0?<div className="directoryEmpty"><span>⌕</span><h3><SiteText contentKey="Directory.a9e22d3995b9">{"No businesses found"}</SiteText></h3><p><SiteText contentKey="Directory.45602fc027e8">{"Try another category or a broader search."}</SiteText></p></div>:<div className="businessGrid">{visible.map(business=><article className="businessCard" key={business.id}><div className="businessCardHeader" style={{backgroundImage:`linear-gradient(180deg,rgba(14,45,58,.08),rgba(14,45,58,.76)),url(${businessImage(business)})`}}><div className="businessCardTop"><div className="businessMonogram">{initials(business.name)}</div><span>{business.category}</span></div></div><div className="businessCardContent">{business.verified&&<span className="verifiedResource"><SiteText contentKey="Directory.ba7c0632cbbf">{"✓ Verified community resource"}</SiteText></span>}<h3>{business.name}</h3><p>{business.description}</p><div className="businessContact"><p><span><SiteText contentKey="Directory.15b61974b270">{"Location"}</SiteText></span><SiteText section="Directory">{business.address||"Arlington, Texas"}</SiteText></p><p><span><SiteText contentKey="Directory.2b5c3d26721a">{"Contact"}</SiteText></span><SiteText section="Directory">{business.phone||"Contact through website"}</SiteText></p></div><div className="businessCardActions">{business.phone&&<a href={`tel:${business.phone.replace(/[^+\d]/g,"")}`}><SiteText contentKey="Directory.d6e645b7d2b2">{"Call"}</SiteText></a>}<a className="businessSiteButton" href={business.website} target="_blank" rel="noreferrer"><SiteText contentKey="Directory.33add7857b9b">{"View official site ↗"}</SiteText></a></div></div></article>)}</div>}</section>
    <footer className="directoryFooter"><span>◆</span><div><p><SiteText contentKey="Directory.0f5851aabde1">{"Own a business in our community?"}</SiteText></p><strong><SiteText contentKey="Directory.495a438a4e9d">{"Apply for a premium Business Account to join the directory."}</SiteText></strong></div></footer>
  </main>;
}
export default Directory;
