import { React, useState } from "react";

function JoinUs({ currentObj }) {
  return (
    <>
      <div className="joinContainer">
        <div className="halfJc">
          <img src={currentObj.contentImg} alt="" className="mainJoin" />
          <h1 className="navContent rye-regular">
            {currentObj.contentTitle}
          </h1>
        </div>
        <div className="staggerCaro">
          {/* <h1 className="caroTitle abril-fatface-regular">{currentObj.contentTitle}</h1> */}
          <div className="staggerDesc">{currentObj.contentDesc}</div>
        </div>

        <div className="joinMajor">
          {currentObj.title === "Vision" ? <></> : null}
          {currentObj.title === "Community Rules" ? <></> : null}
          {currentObj.title === "Make an Impact" ? <></> : null}
          {currentObj.title === "Community Hub" ? <></> : null}
        </div>
      </div>
    </>
  );
}

export default JoinUs;
