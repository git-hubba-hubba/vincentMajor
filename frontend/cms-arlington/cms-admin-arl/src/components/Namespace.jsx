import SiteText from "./SiteText";

function Namespace({title}) {
  return (
    <>
    
    <h1 className="namespaceTitle rye-regular"><SiteText section="Namespace">{title}</SiteText></h1>
    
    </>
  )
}

export default Namespace