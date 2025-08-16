'use client';

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Proje verisinin tipini tanımlayalım
interface Project {
  id: number;
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
        const response = await fetch(`${backendUrl}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data: Project[] = await response.json();
        setProjects(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [getToken]);

  if (loading) return <div className="text-center p-10">Projeler Yükleniyor...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Hata: {error}</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Projelerim</h1>
      {projects.length > 0 ? (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id} className="bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-gray-400">{project.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Henüz bir projeniz yok.</p>
      )}
    </div>
  );
}