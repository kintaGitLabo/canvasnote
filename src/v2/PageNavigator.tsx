import { Plus } from "lucide-react";
import { PageThumbnail } from "../components/PageRail";
import type { CanvasProject } from "../types";

interface Props {
  project: CanvasProject;
  active: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export function PageNavigator({ project, active, onSelect, onAdd }: Props) {
  return (
    <aside className="pages-v2 page-navigator-v2">
      <div className="page-nav-heading">
        <h2>ページ</h2>
        <span>{project.pages.length}枚</span>
      </div>
      <div className="page-nav-list">
        {project.pages.map((page, index) => (
          <button
            className={`page-preview-button ${index === active ? "active" : ""}`}
            key={page.id}
            onClick={() => onSelect(index)}
            aria-label={`${index + 1}ページを開く`}
            aria-current={index === active ? "page" : undefined}
          >
            <span className="page-index">{index + 1}</span>
            {index === active && <span className="editing-badge">編集中</span>}
            <span className="page-preview-canvas">
              <PageThumbnail page={page} project={project} large />
            </span>
            <span className="page-preview-label">
              {page.name || `ページ ${index + 1}`}
            </span>
          </button>
        ))}
      </div>
      <button className="add-page-v2" onClick={onAdd}>
        <Plus />ページを追加
      </button>
    </aside>
  );
}
