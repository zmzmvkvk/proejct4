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

  // 예시 스토리와 캐릭터 데이터
  const exampleStory = `SCENE 1
주인공 엘라라가 네온 불빛이 가득한 사이버펑크 도시의 뒷골목으로 들어선다. 비가 내리고 바닥은 젖어있다.

---

SCENE 2
엘라라는 거대한 감시 드론을 발견하고, 재빨리 그림자 속으로 몸을 숨긴다. 긴장감이 흐른다.

---

SCENE 3
드론이 지나간 후, 엘라라는 비밀스러운 문에 다가가 홀로그램 잠금장치를 해제하려고 시도한다.`;

  const exampleCharacters = [
    {
      id: Date.now().toString() + "-elara", // 고유 ID를 위해 문자열 추가
      name: "엘라라",
      referenceImage:
        "https://cdn.leonardo.ai/users/4f696346-f713-4608-9d53-b6d3e82b78de/generations/ecd388e2-e7c4-434f-841e-c6514d616317/3D_Animation_Style_Scene_depicting_the_protagonist_entering_a_0.jpg",
      description:
        "An anthropomorphic raccoon character with a curious expression, known for her cleverness and agility. She has soft, grey-brown fur, a bushy ringed tail, and intelligent dark eyes. She often wears practical, forest-green clothing.",
    },
  ];

  useEffect(() => {
    // 로컬 스토리지에서 프로젝트 로드
    const storedProjects = JSON.parse(
      localStorage.getItem("animation_projects") || "[]"
    );
    setProjects(storedProjects);
  }, []);

  const saveProjects = (updatedProjects) => {
    setProjects(updatedProjects);
    localStorage.setItem("animation_projects", JSON.stringify(updatedProjects));
  };

  const handleCreateProject = () => {
    if (newProjectName.trim() === "") {
      alert("프로젝트 이름을 입력해주세요.");
      return;
    }
    const newProject = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      story: exampleStory, // 예시 스토리로 초기화
      characters: exampleCharacters, // 예시 캐릭터로 초기화
      scenes: [], // 장면은 스토리 기반으로 생성되므로 빈 배열 유지
    };
    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
    setNewProjectName("");
    // 새 프로젝트 생성 후 바로 해당 프로젝트 상세 페이지로 이동
    // 이 부분은 라우팅 설정이 완료되면 Link 컴포넌트 내부에서 처리될 것이므로, 여기서는 단순히 생성만 진행합니다.
  };

  const handleDeleteProject = (id) => {
    if (window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      const updatedProjects = projects.filter((p) => p.id !== id);
      saveProjects(updatedProjects);
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
