'use client';

import { useAuth } from "@clerk/nextjs";
import { FormEvent, useEffect, useState } from "react";

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

  // Modal (açılır pencere) durumu için state'ler
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);


  // Mevcut projeleri getiren fonksiyon
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found.");

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      const response = await fetch(`${backendUrl}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to fetch projects: ${response.statusText}`);

      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde projeleri getir
  useEffect(() => {
    fetchProjects();
  }, [getToken]);

  // Yeni proje oluşturma fonksiyonu
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      alert("Proje adı boş olamaz.");
      return;
    }
    setIsCreating(true);
    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

      const response = await fetch(`${backendUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription
        })
      });

      if (!response.ok) {
        throw new Error("Proje oluşturulamadı.");
      }

      // Proje oluşturma başarılı
      setIsModalOpen(false); // Modalı kapat
      setNewProjectName(""); // Formu temizle
      setNewProjectDescription("");
      await fetchProjects(); // Proje listesini yenile

    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };


  if (loading) return <div className="text-center p-10">Projeler Yükleniyor...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Hata: {error}</div>;

  return (
    <>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projelerim</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            + Yeni Proje Oluştur
          </button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-shadow">
                <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                <p className="text-gray-400">{project.description || "Açıklama yok."}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">İlk projenizi oluşturun!</h2>
            <p className="text-gray-400">Başlamak için 'Yeni Proje Oluştur' butonuna tıklayın.</p>
          </div>
        )}
      </div>

      {/* Yeni Proje Oluşturma Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Yeni Proje</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-gray-300 mb-2">Proje Adı</label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="projectDesc" className="block text-gray-300 mb-2">Açıklama (Opsiyonel)</label>
                <textarea
                  id="projectDesc"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                  disabled={isCreating}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-400"
                  disabled={isCreating}
                >
                  {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
