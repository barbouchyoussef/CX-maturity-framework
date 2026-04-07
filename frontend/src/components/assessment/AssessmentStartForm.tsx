import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createAssessment } from "@/features/assessment/api/assessmentApi";
import { getSectors } from "@/features/sectors/api/sectorsApi";
import type { Sector } from "@/features/sectors/types/sector.types";

export default function AssessmentStartForm() {
  const [form, setForm] = useState({
    companyName: "",
    respondentName: "",
    respondentEmail: "",
    respondentRoleTitle: "",
    sectorId: "",
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSectors() {
      try {
        const data = await getSectors();
        setSectors(data);
      } catch (error) {
        console.error("Failed to load sectors", error);
      } finally {
        setLoadingSectors(false);
      }
    }

    loadSectors();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = await createAssessment({
        company_name: form.companyName || null,
        respondent_name: form.respondentName || null,
        respondent_email: form.respondentEmail || null,
        respondent_role_title: form.respondentRoleTitle || null,
        sector_id: form.sectorId ? Number(form.sectorId) : null,
      });

      alert(`Assessment created with ID ${data.assessment_id}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="company" className="mb-2.5 block text-sm font-medium text-[#1A1A1A]">
            Company name
          </label>
          <input
            id="company"
            name="companyName"
            type="text"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Your company"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none"
          />
        </div>

        <div>
          <label htmlFor="fullname" className="mb-2.5 block text-sm font-medium text-[#1A1A1A]">
            Full name
          </label>
          <input
            id="fullname"
            name="respondentName"
            type="text"
            value={form.respondentName}
            onChange={handleChange}
            placeholder="Your name"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-2.5 block text-sm font-medium text-[#1A1A1A]">
            Work email
          </label>
          <input
            id="email"
            name="respondentEmail"
            type="email"
            value={form.respondentEmail}
            onChange={handleChange}
            placeholder="name@company.com"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none"
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-2.5 block text-sm font-medium text-[#1A1A1A]">
            Role / title
          </label>
          <input
            id="role"
            name="respondentRoleTitle"
            type="text"
            value={form.respondentRoleTitle}
            onChange={handleChange}
            placeholder="CX Lead, Operations Manager..."
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="industry" className="mb-2.5 block text-sm font-medium text-[#1A1A1A]">
          Industry
        </label>
        <select
          id="industry"
          name="sectorId"
          value={form.sectorId}
          onChange={handleChange}
          disabled={loadingSectors}
          className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none"
        >
          <option value="" disabled>
            {loadingSectors ? "Loading sectors..." : "Select your industry"}
          </option>

          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-13 items-center justify-center rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Begin assessment"}
        </button>
      </div>
    </form>
  );
}
