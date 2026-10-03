import SiteText from "./SiteText";
function QuadSlice({ quadObj, isSelected, onSelect }) {
    return (
      <button
        className={`thisQuad${isSelected ? " isSelected" : ""}`}
        type="button"
        onClick={onSelect}
        aria-expanded={isSelected}
      >
        <img src={quadObj.img} alt="" className="qImg" />
        <span className="qContent"><SiteText section="BusinessQuad">{quadObj.title}</SiteText></span>
        {isSelected && <span className="quadDescription"><SiteText section="BusinessQuad">{quadObj.info}</SiteText></span>}
      </button>
    );
  }
  
  export default QuadSlice;
  