"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MasterProfile } from "@/src/lib/profileSchema";
import { mockGenerate, type TailoredResume } from "@/src/lib/mockGenerate";

const PROFILE_STORAGE_KEY = "ai_resume_tailor_master_profile_v2";
const JOB_STORAGE_KEY = "ai_resume_tailor_last_job_v1";

type JobInput = {
  jobTitle: string;
  companyWebsite: string;
  jdText: string;
};

const emptyJob: JobInput = {
  jobTitle: "",
  companyWebsite: "",
  jdText: "",
};

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function csvToArr(csv: string): string[] {
  return csv
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrToCsv(arr?: string[]): string {
  return (arr ?? []).join(", ");
}

const emptyProfile: MasterProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  experience: [],
  projects: [],
  skills: { languages: [], frameworks: [], data: [], cloud: [], tools: [], other: [] },
  education: [],
};

// Extensions beyond the base schema (stored in the same JSON in localStorage)
type ProfileExtras = {
  certificates: { id: string; name: string; issuer?: string; year?: string; link?: string }[];
  awards: { id: string; name: string; org?: string; year?: string; notes?: string }[];
  extras: { id: string; label: string; value: string }[]; // e.g. Publications, Leadership, Volunteer, Interests
};

// We store profile + extras together
type StoredProfile = {
  profile: MasterProfile;
  extras: ProfileExtras;
};

const emptyExtras: ProfileExtras = {
  certificates: [],
  awards: [],
  extras: [],
};

const emptyStored: StoredProfile = {
  profile: emptyProfile,
  extras: emptyExtras,
};

export default function Home() {
  const [profile, setProfile] = useState<MasterProfile>(emptyProfile);
  const [extras, setExtras] = useState<ProfileExtras>(emptyExtras);
  const [job, setJob] = useState<JobInput>(emptyJob);
  const [output, setOutput] = useState<TailoredResume | null>(null);

  const importProfileInputRef = useRef<HTMLInputElement | null>(null);
  const importJobInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved profile + extras on mount
  useEffect(() => {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredProfile = JSON.parse(raw);
        setProfile(parsed.profile ?? emptyProfile);
        setExtras(parsed.extras ?? emptyExtras);
      } catch {
        // ignore
      }
    }

    const rawJob = localStorage.getItem(JOB_STORAGE_KEY);
    if (rawJob) {
      try {
        setJob(JSON.parse(rawJob));
      } catch {
        // ignore
      }
    }
  }, []);

  function saveProfile() {
    const payload: StoredProfile = { profile, extras };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload, null, 2));
  }

  function saveJob() {
    localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(job, null, 2));
  }

  function onSaveClick() {
    saveProfile();
    saveJob();
    alert("Saved ✅");
  }

  function resetAll() {
    if (!confirm("Reset everything? This clears saved profile + job input.")) return;
    setProfile(emptyProfile);
    setExtras(emptyExtras);
    setJob(emptyJob);
    setOutput(null);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(JOB_STORAGE_KEY);
  }

  function downloadProfileJson() {
    const payload: StoredProfile = { profile, extras };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai_resume_tailor_master_profile.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJobJson() {
    const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai_resume_tailor_job_input.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function triggerImportProfile() {
    importProfileInputRef.current?.click();
  }

  function triggerImportJob() {
    importJobInputRef.current?.click();
  }

  function onImportProfileFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: StoredProfile = JSON.parse(String(reader.result));
        setProfile(parsed.profile ?? emptyProfile);
        setExtras(parsed.extras ?? emptyExtras);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed, null, 2));
        alert("Imported master profile ✅");
      } catch {
        alert("Import failed: invalid JSON.");
      }
    };
    reader.readAsText(file);
  }

  function onImportJobFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: JobInput = JSON.parse(String(reader.result));
        setJob(parsed ?? emptyJob);
        localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(parsed, null, 2));
        alert("Imported job input ✅");
      } catch {
        alert("Import failed: invalid JSON.");
      }
    };
    reader.readAsText(file);
  }

  function onGenerate() {
    // Persist what we have, then generate
    saveProfile();
    saveJob();
    setOutput(mockGenerate(profile, job.jdText));
  }

  // ---------- Experience helpers ----------
  function addExperience() {
    setProfile({
      ...profile,
      experience: [
        {
          id: newId("exp"),
          company: "",
          title: "",
          location: "",
          startDate: "",
          endDate: "",
          bullets: [{ id: newId("b"), text: "" }],
        },
        ...profile.experience,
      ],
    });
  }

  function updateExperience(expId: string, patch: any) {
    setProfile({
      ...profile,
      experience: profile.experience.map((e) => (e.id === expId ? { ...e, ...patch } : e)),
    });
  }

  function removeExperience(expId: string) {
    setProfile({ ...profile, experience: profile.experience.filter((e) => e.id !== expId) });
  }

  function addExpBullet(expId: string) {
    setProfile({
      ...profile,
      experience: profile.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, { id: newId("b"), text: "" }] } : e
      ),
    });
  }

  function updateExpBullet(expId: string, bulletId: string, text: string) {
    setProfile({
      ...profile,
      experience: profile.experience.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)) }
          : e
      ),
    });
  }

  function removeExpBullet(expId: string, bulletId: string) {
    setProfile({
      ...profile,
      experience: profile.experience.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.filter((b) => b.id !== bulletId) } : e
      ),
    });
  }

  // ---------- Project helpers ----------
  function addProject() {
    setProfile({
      ...profile,
      projects: [
        {
          id: newId("proj"),
          name: "",
          link: "",
          bullets: [{ id: newId("pb"), text: "" }],
          tags: [],
        },
        ...profile.projects,
      ],
    });
  }

  function updateProject(projectId: string, patch: any) {
    setProfile({
      ...profile,
      projects: profile.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
    });
  }

  function removeProject(projectId: string) {
    setProfile({ ...profile, projects: profile.projects.filter((p) => p.id !== projectId) });
  }

  function addProjectBullet(projectId: string) {
    setProfile({
      ...profile,
      projects: profile.projects.map((p) =>
        p.id === projectId ? { ...p, bullets: [...p.bullets, { id: newId("pb"), text: "" }] } : p
      ),
    });
  }

  function updateProjectBullet(projectId: string, bulletId: string, text: string) {
    setProfile({
      ...profile,
      projects: profile.projects.map((p) =>
        p.id === projectId
          ? { ...p, bullets: p.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)) }
          : p
      ),
    });
  }

  function removeProjectBullet(projectId: string, bulletId: string) {
    setProfile({
      ...profile,
      projects: profile.projects.map((p) =>
        p.id === projectId ? { ...p, bullets: p.bullets.filter((b) => b.id !== bulletId) } : p
      ),
    });
  }

  // ---------- Education helpers ----------
  function addEducation() {
    setProfile({
      ...profile,
      education: [
        {
          id: newId("edu"),
          school: "",
          degree: "",
          major: "",
          startDate: "",
          endDate: "",
          gpa: "",
          notes: "",
        },
        ...profile.education,
      ],
    });
  }

  function updateEducation(eduId: string, patch: any) {
    setProfile({
      ...profile,
      education: profile.education.map((e) => (e.id === eduId ? { ...e, ...patch } : e)),
    });
  }

  function removeEducation(eduId: string) {
    setProfile({ ...profile, education: profile.education.filter((e) => e.id !== eduId) });
  }

  // ---------- Certificates / Awards / Extras ----------
  function addCertificate() {
    setExtras({
      ...extras,
      certificates: [
        { id: newId("cert"), name: "", issuer: "", year: "", link: "" },
        ...extras.certificates,
      ],
    });
  }

  function updateCertificate(certId: string, patch: any) {
    setExtras({
      ...extras,
      certificates: extras.certificates.map((c) => (c.id === certId ? { ...c, ...patch } : c)),
    });
  }

  function removeCertificate(certId: string) {
    setExtras({ ...extras, certificates: extras.certificates.filter((c) => c.id !== certId) });
  }

  function addAward() {
    setExtras({
      ...extras,
      awards: [{ id: newId("award"), name: "", org: "", year: "", notes: "" }, ...extras.awards],
    });
  }

  function updateAward(awardId: string, patch: any) {
    setExtras({
      ...extras,
      awards: extras.awards.map((a) => (a.id === awardId ? { ...a, ...patch } : a)),
    });
  }

  function removeAward(awardId: string) {
    setExtras({ ...extras, awards: extras.awards.filter((a) => a.id !== awardId) });
  }

  function addExtra() {
    setExtras({
      ...extras,
      extras: [{ id: newId("extra"), label: "Leadership", value: "" }, ...extras.extras],
    });
  }

  function updateExtra(extraId: string, patch: any) {
    setExtras({
      ...extras,
      extras: extras.extras.map((x) => (x.id === extraId ? { ...x, ...patch } : x)),
    });
  }

  function removeExtra(extraId: string) {
    setExtras({ ...extras, extras: extras.extras.filter((x) => x.id !== extraId) });
  }

  // Skills CSV
  const s = profile.skills;
  const skillsCsv = useMemo(
    () => ({
      languages: arrToCsv(s.languages),
      frameworks: arrToCsv(s.frameworks),
      data: arrToCsv(s.data),
      cloud: arrToCsv(s.cloud),
      tools: arrToCsv(s.tools),
      other: arrToCsv(s.other),
    }),
    [s]
  );

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">AI Resume Tailor</h1>
            <p className="mt-2 text-sm text-gray-600">
              Master profile (saved locally) + job inputs → generate a tailored resume preview.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90"
              onClick={onSaveClick}
            >
              Save
            </button>

            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={downloadProfileJson}
            >
              Download Profile JSON
            </button>

            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={downloadJobJson}
            >
              Download Job JSON
            </button>

            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={triggerImportProfile}
            >
              Import Profile JSON
            </button>

            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={triggerImportJob}
            >
              Import Job JSON
            </button>

            <button
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              onClick={resetAll}
            >
              Reset
            </button>

            <input
              ref={importProfileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportProfileFile(f);
                e.currentTarget.value = "";
              }}
            />

            <input
              ref={importJobInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportJobFile(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT: MASTER PROFILE */}
          <section className="rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Master Profile</h2>

            {/* Basics */}
            <h3 className="mt-5 text-sm font-semibold text-gray-700">Basics</h3>
            <div className="grid gap-3">
              <input
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Name"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  value={profile.email ?? ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Email"
                />
                <input
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  value={profile.phone ?? ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Phone"
                />
              </div>

              <input
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                value={profile.location ?? ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="Location (City, State)"
              />
            </div>

            {/* Skills */}
            <h3 className="mt-6 text-sm font-semibold text-gray-700">Skills</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["languages", "frameworks", "data", "cloud", "tools", "other"] as const).map((k) => (
                <input
                  key={k}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  value={skillsCsv[k]}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      skills: { ...profile.skills, [k]: csvToArr(e.target.value) },
                    })
                  }
                  placeholder={`${k} (comma-separated)`}
                />
              ))}
            </div>

            {/* Experience */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Experience</h3>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50" onClick={addExperience}>
                + Add role
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {profile.experience.length === 0 ? (
                <p className="text-sm text-gray-600">No roles yet. Click “Add role”.</p>
              ) : (
                profile.experience.map((e) => (
                  <div key={e.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Role</p>
                      <button
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                        onClick={() => removeExperience(e.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        className="rounded-lg border border-gray-300 p-2 text-sm"
                        value={e.company}
                        onChange={(ev) => updateExperience(e.id, { company: ev.target.value })}
                        placeholder="Company"
                      />
                      <input
                        className="rounded-lg border border-gray-300 p-2 text-sm"
                        value={e.title}
                        onChange={(ev) => updateExperience(e.id, { title: ev.target.value })}
                        placeholder="Title"
                      />
                      <input
                        className="rounded-lg border border-gray-300 p-2 text-sm"
                        value={e.startDate ?? ""}
                        onChange={(ev) => updateExperience(e.id, { startDate: ev.target.value })}
                        placeholder="Start (e.g., Jun 2024)"
                      />
                      <input
                        className="rounded-lg border border-gray-300 p-2 text-sm"
                        value={e.endDate ?? ""}
                        onChange={(ev) => updateExperience(e.id, { endDate: ev.target.value })}
                        placeholder="End (e.g., Present)"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Bullets</p>
                      <button
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
                        onClick={() => addExpBullet(e.id)}
                      >
                        + Add bullet
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {e.bullets.map((b) => (
                        <div key={b.id} className="flex gap-2">
                          <input
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                            value={b.text}
                            onChange={(ev) => updateExpBullet(e.id, b.id, ev.target.value)}
                            placeholder="Bullet: action + tool + impact (numbers if possible)"
                          />
                          <button
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                            onClick={() => removeExpBullet(e.id, b.id)}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Projects */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Projects</h3>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50" onClick={addProject}>
                + Add project
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {profile.projects.map((p) => (
                <div key={p.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Project</p>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => removeProject(p.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={p.name}
                      onChange={(ev) => updateProject(p.id, { name: ev.target.value })}
                      placeholder="Project name"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={p.link ?? ""}
                      onChange={(ev) => updateProject(p.id, { link: ev.target.value })}
                      placeholder="Link (optional)"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Bullets</p>
                    <button
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
                      onClick={() => addProjectBullet(p.id)}
                    >
                      + Add bullet
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    {p.bullets.map((b) => (
                      <div key={b.id} className="flex gap-2">
                        <input
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                          value={b.text}
                          onChange={(ev) => updateProjectBullet(p.id, b.id, ev.target.value)}
                          placeholder="Bullet: what you built + tech + result"
                        />
                        <button
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => removeProjectBullet(p.id, b.id)}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Education</h3>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50" onClick={addEducation}>
                + Add education
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {profile.education.map((e) => (
                <div key={e.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Education</p>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => removeEducation(e.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={e.school}
                      onChange={(ev) => updateEducation(e.id, { school: ev.target.value })}
                      placeholder="School"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={e.degree ?? ""}
                      onChange={(ev) => updateEducation(e.id, { degree: ev.target.value })}
                      placeholder="Degree"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={e.major ?? ""}
                      onChange={(ev) => updateEducation(e.id, { major: ev.target.value })}
                      placeholder="Major"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={e.endDate ?? ""}
                      onChange={(ev) => updateEducation(e.id, { endDate: ev.target.value })}
                      placeholder="Grad year"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={(e as any).gpa ?? ""}
                      onChange={(ev) => updateEducation(e.id, { gpa: ev.target.value })}
                      placeholder="GPA (optional)"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={(e as any).notes ?? ""}
                      onChange={(ev) => updateEducation(e.id, { notes: ev.target.value })}
                      placeholder="Notes (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Certificates */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Certificates</h3>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50" onClick={addCertificate}>
                + Add certificate
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {extras.certificates.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Certificate</p>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => removeCertificate(c.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={c.name}
                      onChange={(ev) => updateCertificate(c.id, { name: ev.target.value })}
                      placeholder="Certificate name"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={c.issuer ?? ""}
                      onChange={(ev) => updateCertificate(c.id, { issuer: ev.target.value })}
                      placeholder="Issuer (e.g., AWS, Coursera)"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={c.year ?? ""}
                      onChange={(ev) => updateCertificate(c.id, { year: ev.target.value })}
                      placeholder="Year (optional)"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={c.link ?? ""}
                      onChange={(ev) => updateCertificate(c.id, { link: ev.target.value })}
                      placeholder="Link (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Awards */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Awards</h3>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50" onClick={addAward}>
                + Add award
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {extras.awards.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Award</p>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => removeAward(a.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={a.name}
                      onChange={(ev) => updateAward(a.id, { name: ev.target.value })}
                      placeholder="Award name"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={a.org ?? ""}
                      onChange={(ev) => updateAward(a.id, { org: ev.target.value })}
                      placeholder="Organization (optional)"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={a.year ?? ""}
                      onChange={(ev) => updateAward(a.id, { year: ev.target.value })}
                      placeholder="Year (optional)"
                    />
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={a.notes ?? ""}
                      onChange={(ev) => updateAward(a.id, { notes: ev.target.value })}
                      placeholder="Notes (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Extras */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Other Resume Sections</h3>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50" onClick={addExtra}>
                + Add section
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {extras.extras.map((x) => (
                <div key={x.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Section</p>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => removeExtra(x.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2">
                    <input
                      className="rounded-lg border border-gray-300 p-2 text-sm"
                      value={x.label}
                      onChange={(ev) => updateExtra(x.id, { label: ev.target.value })}
                      placeholder="Label (e.g., Leadership, Volunteer, Publications, Interests)"
                    />
                    <textarea
                      className="h-20 rounded-lg border border-gray-300 p-2 text-sm"
                      value={x.value}
                      onChange={(ev) => updateExtra(x.id, { value: ev.target.value })}
                      placeholder="Content (keep it short; can be bullets separated by new lines)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT: JOB INPUT + PREVIEW */}
          <section className="rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Job Input</h2>
            <p className="mt-2 text-sm text-gray-600">
              Paste the job description. Add the company website link if you want (optional).
            </p>

            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                value={job.jobTitle}
                onChange={(e) => setJob({ ...job, jobTitle: e.target.value })}
                placeholder="Job title (optional)"
              />

              <input
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                value={job.companyWebsite}
                onChange={(e) => setJob({ ...job, companyWebsite: e.target.value })}
                placeholder="Company website (optional) e.g. https://company.com"
              />

              <textarea
                className="h-64 w-full rounded-lg border border-gray-300 p-2 text-sm"
                value={job.jdText}
                onChange={(e) => setJob({ ...job, jdText: e.target.value })}
                placeholder="Paste the job description here..."
              />

              <button
                className="w-full rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                onClick={onGenerate}
              >
                Generate (Mock)
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <h3 className="text-sm font-semibold">Output Preview</h3>

              {!output ? (
                <p className="mt-2 text-sm text-gray-600">
                  Click Generate to see a tailored resume preview.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{profile.name || "Your Name"}</p>
                    <p className="text-xs text-gray-600">{job.jobTitle || output.targetTitle}</p>
                    {job.companyWebsite ? (
                      <p className="mt-1 text-xs text-gray-500 break-all">{job.companyWebsite}</p>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">SUMMARY</p>
                    <p className="text-sm">{output.summary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">EXPERIENCE</p>
                    {output.experience.map((e, idx) => (
                      <div key={idx} className="mt-2">
                        <p className="text-sm font-medium">
                          {e.title} — {e.company}
                        </p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                          {e.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">PROJECTS</p>
                    {output.projects.map((p, idx) => (
                      <div key={idx} className="mt-2">
                        <p className="text-sm font-medium">{p.name}</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                          {p.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">SKILLS</p>
                    <p className="text-sm text-gray-700">{output.skills.join(", ")}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
