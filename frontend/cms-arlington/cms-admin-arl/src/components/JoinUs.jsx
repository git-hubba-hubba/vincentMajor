import Rules from "./Rules";
import Vision from "./Vision";
import CarouselHP from "./CarouselHP";
import CommunityFeed from "./CommunityFeed";

function JoinUs({ currentObj, user, onProfileClick }) {
  return (
    <>
      <div className="joinContainer">
        <div className={`joinMajor${["Community Rules", "Vision", "Make An Impact", "Community Hub"].includes(currentObj.contentTitle) ? " contentActive" : ""}${currentObj.contentTitle === "Community Hub" ? " communityHubActive" : ""}`}>
          {currentObj.contentTitle === "Vision" ? <Vision /> : null}
          {currentObj.contentTitle === "Community Rules" ? <Rules /> : null}
          {currentObj.contentTitle === "Make An Impact" ? <CarouselHP /> : null}
          {currentObj.contentTitle === "Community Hub" ? <CommunityFeed user={user} onProfileClick={onProfileClick}/> : null}
        </div>
      </div>
    </>
  );
}

export default JoinUs;
