import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Executive from "./pages/Executive";
import Sales from "./pages/Sales";
import ClientHealth from "./pages/ClientHealth";
import ClientScorecard from "./pages/ClientScorecard";
import MRRCalculator from "./pages/MRRCalculator";
import Operations from "./pages/Operations";
import Accounting from "./pages/Accounting";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Executive />} />
            <Route path="sales" element={<Sales />} />
            <Route path="client-health" element={<ClientHealth />} />
            <Route path="scorecard" element={<ClientScorecard />} />
            <Route path="mrr-calculator" element={<MRRCalculator />} />
            <Route path="operations" element={<Operations />} />
            <Route path="accounting" element={<Accounting />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
