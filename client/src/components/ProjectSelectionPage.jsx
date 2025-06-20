import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, PlusCircle, BookText, Trash2, Loader2 } from "./Icons";
import Button from "./Button";
import Input from "./Input";
import Card from "./Card";
import CardTitle from "./CardTitle";
import * as projectApi from "../services/projectApi";
import toast from "../utils/toast";

const ProjectSelectionPage = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.fetchProjects();

      const projectList = Array.isArray(data) ? data : data?.projects || [];
      setProjects(projectList);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("프로젝트 목록을 불러오는데 실패했습니다.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.warning("프로젝트 이름을 입력해주세요.");
      return;
    }

    try {
      setCreating(true);

      const newProject = await projectApi.createProject({
        name: newProjectName.trim(),
        description: "",
      });

      const project = newProject?.project || newProject;

      setProjects((prev) => [...prev, project]);
      setNewProjectName("");
      toast.success("프로젝트가 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.message || "프로젝트 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (project) => {
    const confirmed = window.confirm(
      `정말로 "${project.name}" 프로젝트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeleting(project.id);

      await projectApi.deleteProject(project.id);

      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success("프로젝트가 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error.message || "프로젝트 삭제에 실패했습니다.");
    } finally {
      setDeleting(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !creating) {
      handleCreateProject();
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-100 mb-4 flex items-center justify-center gap-4">
            <Clapperboard className="w-12 h-12 text-indigo-400" />
            AI 스토리 애니메이션 스튜디오
          </h1>
          <p className="text-xl text-gray-400">
            AI 기술로 스토리를 시각적 애니메이션으로 변환하세요
          </p>
        </header>

        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardTitle Icon={PlusCircle} title="새 프로젝트 생성" />
            <div className="flex gap-4 mb-4">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="프로젝트 이름을 입력하세요..."
                className="flex-grow"
                disabled={creating}
              />
              <Button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                className="min-w-[100px]"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    생성
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle Icon={BookText} title="기존 프로젝트" />

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="ml-3 text-gray-400">
                  프로젝트 목록을 불러오는 중...
                </span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <BookText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  아직 생성된 프로젝트가 없습니다
                </p>
                <p className="text-gray-500 text-sm">
                  위에서 새 프로젝트를 생성해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gray-700 hover:bg-gray-650 p-4 rounded-lg flex items-center justify-between transition-colors duration-200"
                  >
                    <Link
                      to={`/project/${project.id}`}
                      className="flex-grow group"
                    >
                      <div className="flex items-center space-x-3">
                        <Clapperboard className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h3 className="font-semibold text-gray-200 group-hover:text-indigo-400 transition-colors duration-200">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-sm text-gray-400 mt-1">
                              {project.description}
                            </p>
                          )}
                          {project.createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              생성일:{" "}
                              {new Date(project.createdAt).toLocaleDateString(
                                "ko-KR"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>

                    <Button
                      onClick={() => handleDeleteProject(project)}
                      disabled={deleting === project.id}
                      className="bg-red-600 hover:bg-red-700 p-2 ml-4 min-w-[44px]"
                      title="프로젝트 삭제"
                    >
                      {deleting === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionPage;
