import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, PlusCircle, BookText, Trash2 } from "./Icons";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import CardTitle from "./CardTitle";

const ProjectSelectionPage = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    // Firestore에서 프로젝트 목록 불러오기
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  const handleCreateProject = async () => {
    if (newProjectName.trim() === "") {
      alert("프로젝트 이름을 입력해주세요.");
      return;
    }
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName.trim() }),
    });
    const newProject = await res.json();
    setProjects((prev) => [...prev, newProject]);
    setNewProjectName("");
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      // Firestore에서 삭제 API 호출
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      } else {
        alert("프로젝트 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-8">
      <h1 className="text-4xl font-bold text-gray-100 mb-8 text-center flex items-center justify-center gap-4">
        <Clapperboard className="w-10 h-10 text-indigo-400" />
        AI 스토리 애니메이션 스튜디오
      </h1>

      <div className="max-w-xl mx-auto space-y-8">
        <Card>
          <CardTitle Icon={PlusCircle} title="새 프로젝트 생성" />
          <div className="flex gap-4 mb-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="새 프로젝트 이름"
              className="flex-grow"
            />
            <Button onClick={handleCreateProject}>
              <PlusCircle className="w-5 h-5" /> 생성
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle Icon={BookText} title="기존 프로젝트" />
          {projects.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              아직 생성된 프로젝트가 없습니다.
            </p>
          ) : (
            <ul className="space-y-4">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="bg-gray-700 p-4 rounded-lg flex items-center justify-between"
                >
                  <Link
                    to={`/project/${project.id}`}
                    className="flex-grow font-semibold text-gray-200 hover:text-indigo-400 transition-colors duration-200"
                  >
                    {project.name}
                  </Link>
                  <Button
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-red-600 hover:bg-red-700 p-2 ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProjectSelectionPage;
