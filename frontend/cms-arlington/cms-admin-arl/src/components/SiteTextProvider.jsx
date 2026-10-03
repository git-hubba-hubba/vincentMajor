import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SiteTextContext } from "../lib/siteTextContext";

export default function SiteTextProvider({ children }) {
  const [overrides,setOverrides] = useState({});
  useEffect(() => {
    let active = true;
    const load = () => api("/site-text").then(values => {if(active)setOverrides(values);}).catch(()=>{});
    load();
    window.addEventListener("focus",load);
    return () => {active=false;window.removeEventListener("focus",load);};
  }, []);
  return <SiteTextContext.Provider value={{overrides,setOverrides}}>{children}</SiteTextContext.Provider>;
}
