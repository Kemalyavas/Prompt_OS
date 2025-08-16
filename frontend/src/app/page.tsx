'use client';

import { useAuth } from "@clerk/nextjs";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

// shadcn/ui bileşenlerini import ediyoruz
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react"; // İkon kütüphanesi

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

  // Modal durumu için tek bir state yeterli
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Mevcut projeleri getiren fonksiyon
  const fetchProjects = async () => {
    // ... (Bu fonksiyonun içeriği aynı kalabilir, ama tekrar ekliyorum)
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
    if (!newProjectName.trim()) return;
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

      if (!response.ok) throw new Error("Proje oluşturulamadı.");

      setIsModalOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      await fetchProjects();

    } catch (err: any) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="text-center p-10">Projeler Yükleniyor...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Hata: {error}</div>;

  return (
    <div className="container mx-auto py-8 px-4 md:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Projelerim</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Proje Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Proje Oluştur</DialogTitle>
              <DialogDescription>
                Projenize bir isim verin ve başlayın.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Proje Adı
                  </Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Açıklama
                  </Label>
                  <Textarea
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Projenizin amacı nedir?"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">İptal</Button>
                </DialogClose>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description || "Açıklama yok."}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* İleride buraya prompt sayısı, son düzenleme tarihi gibi bilgiler gelebilir */}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/project/${project.id}`}>Projeyi Aç</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 border-2 border-dashed border-gray-700 rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">İlk projenizi oluşturun!</h2>
          <p className="text-gray-400 mb-4">Başlamak için 'Yeni Proje Oluştur' butonuna tıklayın.</p>
        </div>
      )}
    </div>
  );
}
