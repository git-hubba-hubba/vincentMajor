import React from "react";
import Namespace from "../components/Namespace";
import ActiveUser from "../components/ActiveUser";
import members from "../data/members";
function Members() {
  return (
    <>
      <img
        src="../../public/images/memberimpact.png"
        alt=""
        className="memImp"
      />
      <Namespace title={"Impact Members"} />
      <div className="memOrganizer">
        {members.map((person) => {
          return (
            <>
              <ActiveUser personObj={person} />
            </>
          );
        })}
      </div>
    </>
  );
}

export default Members;
