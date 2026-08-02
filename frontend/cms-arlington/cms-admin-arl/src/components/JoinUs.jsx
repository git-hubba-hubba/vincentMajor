import { React, useState } from "react";
import Rules from "./Rules";
import Vision from "./Vision";
import CarouselHP from "./CarouselHP";

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

        <div className={`joinMajor${["Community Rules", "Vision", "Make An Impact"].includes(currentObj.contentTitle) ? " contentActive" : ""}`}>
          {currentObj.contentTitle === "Vision" ? <Vision /> : null}
          {currentObj.contentTitle === "Community Rules" ? <Rules /> : null}
          {currentObj.contentTitle === "Make An Impact" ? <CarouselHP /> : null}
          {currentObj.contentTitle === "Community Hub" ? <></> : null}
        </div>
      </div>
    </>
  );
}

export default JoinUs;
