import { useContext } from "react";
import { SiteTextContext } from "../lib/siteTextContext";
import defaults from "../data/siteText.json";

const lookup = new Map(defaults.map(entry=>[`${entry.section}\0${entry.text}`,entry.key]));

// Return text without an extra DOM element so existing typography and layout stay intact.
export default function SiteText({ contentKey, section, children }) {
  const {overrides} = useContext(SiteTextContext);
  const key = contentKey || (typeof children==='string'?lookup.get(`${section}\0${children}`):undefined);
  return key && Object.hasOwn(overrides,key) ? overrides[key] : children;
}
