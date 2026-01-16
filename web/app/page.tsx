"use client";

import { useMemo, useState } from "react";
import type { MasterProfile } from "@/src/lib/profileSchema";
import { mockGenerate, type TailoredResume } from "@/src/lib/mockGenerate";

const starterProfile: MasterProfile = {
  name: "Evan Beck",
  email: "",
  phone: "",
  location: "",
  links: [{ label: "GitHub", url: "https://github.com/BecksterScience" }],
  experience: [
    {
      id: "exp-1",
      company: "Example Co",
      title: "Data Science Intern",
      startDate: "2025-06",
      endDate: "2025-08",
      bullets: [
        { id: "b1", text: "Built data pipelines and analytics workflows for large datasets." },
        { id: "b2", text: "Implemented ranking metrics (Precision@K, Recall@K, nDCG) to evaluate models." },
        { id: "b3", text: "Optimized storage/query performance using columnar formats and partitioning." },
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "AI Resume Tailor (WIP)",
      bullets: [
        { id: "p1", text: "Designed a structured master profile schema to support bullet-level selection." },
        { id: "p2", text: "Built an MVP UI for job description input and resume preview." },
      ],
      tags: ["nextjs", "ai"],
    },
  ],
  skills: {
    languages: ["Python", "SQL", "TypeScript"],
    data: ["Spark", "Parquet"],
    tools: ["Git"],
    other: ["Experimentation"],
  },
  education: [
    {
      id: "edu-1",
      school: "NYU",
      degree: "BS",
      major: "Data Science",
      endDate: "2025",
    },
  ],
};

export default function Home() {
  const [profile, setProfile] = useState<MasterProfile>(starterProfile);
  const [jdText, setJdText] = useState("");
  const [output, setOutput] = useState<TailoredResume | null>(null);

  const skillsText = useMemo(() => {
    const s = profile.skills;
    return [
      ...(s.languages ?? []),
      ...(s.frameworks ?? []),
      ...(s.data ?? []),
      ...(s.cloud ?? []),
      ...(s.tools ?? []),
      ...(s.other ?? []),
    ].join(", ");
  }, [profile]);

  function onGenerate() {
    setOutput(mockGenerate(profile, jdText));
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">AI Resume Tailor</h1>
          <p className="mt-2 text-sm text-gray-600">
            MVP: store a master profile + paste a job description → generate a tailored resume preview.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT: Master Profile */}
          <section className="rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Master Profile (v0)</h2>

            <label className="mt-4 block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
            />

            <label className="mt-4 block text-sm font-medium">Skills (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              value={skillsText}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  skills: { ...profile.skills, other: e.target.value.split(",").map(x => x.trim()).filter(Boolean) },
                })
              }
              placeholder="Python, SQL, Spark, ..."
            />

            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <p className="text-sm font-medium">Experience bullets (placeholder)</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                {profile.experience[0]?.bullets.map((b) => (
                  <li key={b.id}>{b.text}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Next: editable bullet bank UI (add/edit/remove bullets per role).
              </p>
            </div>
          </section>

          {/* RIGHT: JD + Output */}
          <section className="rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Job Description</h2>
            <textarea
              className="mt-3 h-44 w-full rounded-lg border border-gray-300 p-2 text-sm"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here..."
            />

            <button
              className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
              onClick={onGenerate}
            >
              Generate (Mock)
            </button>

            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <h3 className="text-sm font-semibold">Output Preview</h3>

              {!output ? (
                <p className="mt-2 text-sm text-gray-600">
                  Click Generate to see a tailored resume preview.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{profile.name}</p>
                    <p className="text-xs text-gray-600">{output.targetTitle}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">SUMMARY</p>
                    <p className="text-sm">{output.summary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">EXPERIENCE</p>
                    {output.experience.map((e, idx) => (
                      <div key={idx} className="mt-2">
                        <p className="text-sm font-medium">{e.title} — {e.company}</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                          {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
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
                          {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
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

        <footer className="mt-8 text-xs text-gray-500">
          Next: editable bullet bank + real selection + LLM generation.
        </footer>
      </div>
    </main>
  );
}
