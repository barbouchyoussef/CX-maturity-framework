import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createAssessment } from "@/features/assessment/api/assessmentApi";
import { getSectors } from "@/features/sectors/api/sectorsApi";
import type { Sector } from "@/features/sectors/types/sector.types";

export default function AssessmentStartForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    respondentName: "",
    respondentEmail: "",
    respondentRoleTitle: "",
    sectorId: "",
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [sectorError, setSectorError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const industryOptions = useMemo(
    () =>
      sectors
        .filter((sector) => sector.is_active)
        .map((sector) => ({
          value: String(sector.id),
          label: sector.name,
        })),
    [sectors]
  );

  useEffect(() => {
    async function loadSectors() {
      try {
        const data = await getSectors();
        setSectors(data);
      } catch (error) {
        console.error("Failed to load sectors", error);
        setSectorError(
          error instanceof Error
            ? error.message
            : "Unable to load configured industries."
        );
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

    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    setSubmitting(true);

    try {
      const selectedIndustry = industryOptions.find(
        (industry) => industry.value === form.sectorId
      );
      const selectedSectorId = /^\d+$/.test(form.sectorId)
        ? Number(form.sectorId)
        : null;

      if (!selectedSectorId || !selectedIndustry) {
        alert("Please select a configured industry before starting.");
        return;
      }

      const data = await createAssessment({
        company_name: form.companyName,
        respondent_name: form.respondentName,
        respondent_email: form.respondentEmail,
        respondent_role_title: form.respondentRoleTitle,
        sector_id: selectedSectorId,
      });

      navigate(
        `/assessment/${data.assessment_id}/generating?next=form&sectorId=${selectedSectorId}`
      );
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
            required
            value={form.companyName}
            onChange={handleChange}
            placeholder="Your company"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C5A04F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(197,160,79,0.10)]"
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
            required
            value={form.respondentName}
            onChange={handleChange}
            placeholder="Your name"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C5A04F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(197,160,79,0.10)]"
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
            required
            value={form.respondentEmail}
            onChange={handleChange}
            placeholder="name@company.com"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C5A04F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(197,160,79,0.10)]"
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
            required
            value={form.respondentRoleTitle}
            onChange={handleChange}
            placeholder="CX Lead, Operations Manager..."
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C5A04F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(197,160,79,0.10)]"
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
          required
          disabled={loadingSectors || industryOptions.length === 0}
          className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none transition focus:border-[#C5A04F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(197,160,79,0.10)]"
        >
          <option value="" disabled>
            {loadingSectors
              ? "Loading sectors..."
              : industryOptions.length === 0
                ? "No configured industries available"
                : "Select your industry"}
          </option>

          {industryOptions.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </select>
        {sectorError ? (
          <p className="mt-2 text-xs text-[#B42318]">{sectorError}</p>
        ) : null}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || loadingSectors || industryOptions.length === 0}
          className="inline-flex min-h-13 items-center justify-center rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        >
          {submitting ? "Submitting..." : "Begin assessment"}
        </button>
      </div>
    </form>
  );
}
