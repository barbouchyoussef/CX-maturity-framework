import { BrowserRouter, Routes, Route } from "react-router-dom";
import AssessmentLandingPage from "@/features/assessment/pages/AssessmentLandingPage";
import AssessmentFormPage from "@/features/assessment/pages/AssessmentFormPage";
import AssessmentGeneratingPage from "@/features/assessment/pages/AssessmentGeneratingPage";
import AssessmentResultsPage from "@/features/assessment/pages/AssessmentResultsPage";
import AdminSectorsPage from "@/features/sectors/pages/AdminSectorsPage";
import AdminDimensionsPage from "@/features/dimensions/pages/AdminDimensionsPage";
import AdminSubdimensionsPage from "@/features/subdimensions/pages/AdminSubdimensionsPage";
import AdminQuestionsPage from "@/features/questions/pages/AdminQuestionsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AssessmentLandingPage />} />
        <Route path="/assessment/:assessmentId" element={<AssessmentFormPage />} />
        <Route
          path="/assessment/:assessmentId/generating"
          element={<AssessmentGeneratingPage />}
        />
        <Route
          path="/assessment/:assessmentId/results"
          element={<AssessmentResultsPage />}
        />
        <Route path="/admin/sectors" element={<AdminSectorsPage />} />
        <Route path="/admin/dimensions" element={<AdminDimensionsPage />} />
        <Route path="/admin/subdimensions" element={<AdminSubdimensionsPage />} />
        <Route path="/admin/questions" element={<AdminQuestionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
