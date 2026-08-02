import React from "react";

function ActiveUser({ personObj }) {
  return (
    <>
      <div className="memberMaster">
        <div className="memberIntro">
          <img src={personObj.img} alt="" className="profileCircle" />
          <div className="memBox">
            <h2 className="memName abril-fatface-regular">{personObj.name}</h2>
            <div className="memBiz">{personObj.company}</div>
            <div className="memBiz">{personObj.position}</div>
          </div>
        </div>
        <div className="memberExtras">
          <div className="buttonHolster">
            <img src="https://cdn-icons-png.flaticon.com/512/992/992651.png" alt="" className="adder" />
            
          </div>
          <div className="buttonHolster">
            <img src="https://cdn-icons-png.flaticon.com/512/785/785581.png" alt="" className="adder" />
            
          </div>
          <div className="buttonHolster">
            <img src="https://cdn-icons-png.flaticon.com/512/685/685887.png" alt="" className="adder" />
            
          </div>
        </div>
      </div>
    </>
  );
}

export default ActiveUser;
