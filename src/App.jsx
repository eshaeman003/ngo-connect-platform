import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./Layouts/MainLayout";

import Home from "./Pages/Home";
import NGOs from "./Pages/NGOs";
import Opportunities from "./Pages/Opportunities";
import Applications from "./Pages/Applications";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ngos" element={<NGOs />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/applications" element={<Applications />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;