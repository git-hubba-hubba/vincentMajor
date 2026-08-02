function QuadSlice({ quadObj, isSelected, onSelect }) {
    return (
      <button
        className={`thisQuad${isSelected ? " isSelected" : ""}`}
        type="button"
        onClick={onSelect}
        aria-expanded={isSelected}
      >
        <img src={quadObj.img} alt="" className="qImg" />
        <span className="qContent">{quadObj.title}</span>
        {isSelected && <span className="quadDescription">{quadObj.info}</span>}
      </button>
    );
  }
  
  export default QuadSlice;
  