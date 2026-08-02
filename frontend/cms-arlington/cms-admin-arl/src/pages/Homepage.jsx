import React from "react";
import Namespace from "../components/Namespace";
import BusinessQuad from "../components/BusinessQuad";

function Homepage() {
  return (
    <>
      <Namespace title={"Homepage"} />
      <div className="homepageContainer"></div>
      <BusinessQuad />
      
    </>
  );
}

export default Homepage;
