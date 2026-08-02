import { React, useState } from "react";
import JoinUs from "./JoinUs";

function Nav({ currentComponent, setCurrentComponent, user, onProfileClick }) {
  const allContent = [
    {
      contentImg:
        "https://img.magnific.com/premium-photo/friends-talking-communication-discussion-unity-concept_53876-57049.jpg?semt=ais_hybrid&w=740&q=80",
      contentTitle: "Vision",
      contentDesc:
        "A connected Arlington where members, businesses, churches, nonprofits, and partners all do their part.",
    },
    {
      contentImg:
        "https://t3.ftcdn.net/jpg/17/62/64/30/360_F_1762643051_XcPcGDfclZqVBhIS6F0VHFigblH0Pm8h.jpg",
      contentTitle: "Community Rules",
      contentDesc:
        "No hate, division, or drama. Bring kindness, respect, and a willingness to help",
    },
    {
      contentImg: "https://arlimp.pages.dev/impactteam.png",
      contentTitle: "Make An Impact",
      contentDesc: "Earn Rewards and Business Incentives",
    },
    {
      contentImg:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdCin-7092CNSgwBP6YB8fZjv6FHP69huZ25bsh31oCSOhPaU3ljvsme0&s=10",
      contentTitle: "Community Hub",
      contentDesc: "Explore our CommunityHub and Explore New Members",
    },
  ];
  const [contentObj, setContentObj] = useState(allContent[2]);
  const [currentPage, setCurrentPage] = useState("Homepage");
  const setHome = () => {
    setContentObj(allContent[2]);
    setCurrentComponent("Homepage");
  };
  return (
    <>
      

      <div className="masterNavigation">
        <img
          src="https://arlington.impactingcitiestx.com/wp-content/uploads/2025/09/IMPACT-OFFICIAL-Logo-2048x773.png"
          alt=""
          className="godLogo"
          onClick={() => {
            setHome();
          }}
        />

        <div className="tierOne">
        </div>
        <div className="tierTwo">
          <div className="nav-icons">
            <button className="profileButton" type="button" onClick={onProfileClick} aria-label={user ? "Open user profile" : "Sign in or register"}>
              <span className="profileButtonAvatar">{user ? `${user.first_name[0]}${user.last_name[0]}` : "○"}</span>
              <span>{user ? user.first_name : "Profile"}</span>
            </button>
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/037/468/797/small/user-icon-illustration-for-graphic-design-logo-web-site-social-media-mobile-app-ui-png.png"
              alt=""
              className="nIcons"
              onClick={() => {
                setContentObj(allContent[0]);
              }}
            />
            <img
              src="https://www.iconpacks.net/icons/2/free-opened-book-icon-3163-thumb.png"
              alt=""
              className="nIcons"
              onClick={() => {
                setContentObj(allContent[1]);
              }}
            />
            <img
              src="https://cdn-icons-png.flaticon.com/512/1436/1436694.png"
              alt=""
              className="nIcons"
              onClick={() => {
                setContentObj(allContent[3]);
              }}
            />
          </div>
        </div>
      </div>

      
      <div className="splashTitle">
      <div className="adNav">
              {/* <p>Welcome To</p> */}
              <h1 className="navColor rye-regular">Impact Arlington Texas</h1>
              <p>Where We Come Together As A Community</p>
      </div>

        
        <JoinUs currentObj={contentObj} />
        
      </div>
    </>
  );
}

export default Nav;
