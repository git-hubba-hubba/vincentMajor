import { React, useState } from "react";
import QuadSlice from "./QuadSlice";

function BusinessQuad() {
  const [selectedQuad, setSelectedQuad] = useState(null);
  const quadObjs = [
    {
      img: "https://plus.unsplash.com/premium_photo-1661775317533-2163ba4dbc93?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fG5vbiUyMHByb2ZpdHxlbnwwfHwwfHx8MA%3D%3D",
      info: "Keep up the good work. Join us and our community will support your cause anyway we can. Cash donations, volunteers if you need it will try to get it. We’re in this together.",
      title: "Nonprofits",
    },
    {
      img: "https://plus.unsplash.com/premium_photo-1733266933604-555228417755?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YnVzaW5lc3MlMjBvd25lcnN8ZW58MHx8MHx8fDA%3D",
      info: "Do your part and we’ll do ours. Give a $25 product or service to one of our members each month and we’ll do all we can to get them in your doors. Reward QR codes, community events, special offers. Our directory listings spots are limited so don’t wait to join us. If you want you may receive a category full message. This is only the beginning, don’t get stuck on the sideline watching your competition grow.",
      title: "Business Owners",
    },
    {
      img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      info: "Want to do more for the community? Let us do the heavy lifting. Give a little and see how you can change lives. Give us a call and see how we make it happen.",
      title: "Corporations",
    },
    {
      img: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1000&auto=format&fit=crop&q=60",
      info: "Share our vision with your congregations and encourage them to let their light shine on the world. Join our Be First Campaign and let your congregation be first to minister to the community through action. Learn more.",
      title: "Church Leaders",
    },
    {
      img: "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      info: "You are the heart and soul of our community. Live life different. Earn prizes and discounts while learning new things. Work on improving your finances and health while engaging our community. Support local businesses to strengthen the community. The list goes on. Join us and bring your smile and kindness to our community. No hate, division or drama here. WALK WITH US!",
      title: "Members",
    },
    {
      img: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1000&auto=format&fit=crop&q=60",
      info: "We provide the system and platform to bring it all together. When everyone does their part we all win and live better!",
      title: "Impact",
    },
  ];
  return (
    <>
    {/* <img src="https://arlington.impactingcitiestx.com/wp-content/uploads/2025/09/IMPACT-OFFICIAL-Logo-2048x773.png" alt="" className="mpact" /> */}
      <div className="quadContainer">
        <div className="quadGrid">
          {quadObjs.map((quadObj) => (
            <QuadSlice
              key={quadObj.title}
              quadObj={quadObj}
              isSelected={selectedQuad === quadObj.title}
              onSelect={() => setSelectedQuad(quadObj.title)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default BusinessQuad;
