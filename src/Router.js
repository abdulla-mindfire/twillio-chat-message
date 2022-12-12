import React from "react";
import { 
  BrowserRouter,
  Routes,
  Route,} from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen";
import ChatScreen from "./ChatScreen";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
