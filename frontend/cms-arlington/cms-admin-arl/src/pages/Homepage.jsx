import { React, useState } from "react";
import Namespace from "../components/Namespace";
import BusinessQuad from "../components/BusinessQuad";
import CarouselHP from "../components/CarouselHP";

function Homepage() {
  const impactSteps = [
    {
      adTittle: "About Arlington Impact",
      adDesc:
        "Impact is more than a social platform it’s a community hub. Here we operate like a family/community within a community where people come together to improve their lives and their community. Areas of focus; health, finances, entertainment and the positive things in life.",
      adImg:
        "https://images.unsplash.com/photo-1553961801-e3fae128cda6?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      adTittle: "Participate In Community Events",
      adDesc: "",
      adImg:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3R1ZHlpbmd8ZW58MHx8MHx8fDA%3D",
    },
    {
      adTittle: "Make an Impact",
      adDesc:
        "Want to Advertise with Us? Interested in launching Impact in your city?  Want your corporation to Walk with Us? Have questions or need to understand Impact better. Give us a call: 682-305-1503  Vincent Jenkins CEO/Founder impactingcities101@gmail.com",
      adImg:
        "https://images.unsplash.com/photo-1551845728-6820a30c64e2?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzh8fGNlbGVicmF0ZXxlbnwwfHwwfHx8MA%3D%3D",
    },
  ];
  const [currentChp, setCurrentChp] = useState(impactSteps[0]);

  return (
    <>
      <Namespace title={"Homepage"} />
      <div className="homepageContainer">
        <div className="cinemaHp">
          <div className="cinemaScreen">
            <img src={currentChp.adImg} alt="" className="chpImg" />
            <div className="chpDescription">{currentChp.adDesc}</div>
            <h1 className="chpTitle rye-regular">{currentChp.adTittle}</h1>
          </div>
          <div className="cinemaBtns">
            <div
              className="cinBtn"
              onClick={() => {
                setCurrentChp(impactSteps[0]);
              }}
            >
              About
            </div>
            <div
              className="cinBtn"
              onClick={() => {
                setCurrentChp(impactSteps[1]);
              }}
            >
              FAQ
            </div>
            <div
              className="cinBtn"
              onClick={() => {
                setCurrentChp(impactSteps[2]);
              }}
            >
              Contact
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Homepage;
