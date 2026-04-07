import { BrowserRouter, Routes, Route } from "react-router-dom";
import AssessmentLandingPage from "@/features/assessment/pages/AssessmentLandingPage";
import AdminSectorsPage from "@/features/sectors/pages/AdminSectorsPage";
import AdminDimensionsPage from "@/features/dimensions/pages/AdminDimensionsPage";
import AdminSubdimensionsPage from "@/features/subdimensions/pages/AdminSubdimensionsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AssessmentLandingPage />} />
        <Route path="/admin/sectors" element={<AdminSectorsPage />} />
        <Route path="/admin/dimensions" element={<AdminDimensionsPage />} />
        <Route path="/admin/subdimensions" element={<AdminSubdimensionsPage />} />

      </Routes>
    </BrowserRouter>
  );
}       
