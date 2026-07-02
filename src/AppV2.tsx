import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  FileDown,
  FilePlus2,
  FileUp,
  FolderOpen,
  Group,
  Eye,
  EyeOff,
  ImagePlus,
  LayoutDashboard,
  Minus,
  Plus,
  Redo2,
  Shapes,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import type {
  CanvasProject,
  EditorElement,
  ImportProgress,
  PagePreset,
  PdfImportWarning,
} from "./types";
import { PAGE_SIZES } from "./types";
import { EditorCanvas } from "./v2/EditorCanvas";
import {
  align,
  distribute,
  isPdfBackground,
  groupElements,
  removePdfBackground,
  setPdfBackgroundVisible,
} from "./v2/operations";
import { newPage, newProject, resizeProject, uid } from "./v2/project";
import { importPdf } from "./lib/pdfImporter";
import { importRenderedHtml } from "./lib/importer";
import {
  deleteStoredProject,
  listProjects,
  loadProject,
  saveProject,
} from "./lib/storage";
import {
  download,
  exportBrowserPdf,
  exportPagePng,
  projectToHtml,
} from "./lib/exporter";
import { ExportPages } from "./components/ExportPages";
import { PageThumbnail } from "./components/PageRail";
import { PageNavigator } from "./v2/PageNavigator";
import { removeExtractedTextFromBackground } from "./lib/pdfBackgroundCleaner";
import { removeSolidImageBackground } from "./lib/imageBackgroundRemover";
const clone = <T,>(v: T): T => structuredClone(v);
export function AppV2() {
  const initial = useMemo(newProject, []),
    hist = useRef<CanvasProject[]>([initial]),
    redoStack = useRef<CanvasProject[]>([]),
    nodes = useRef<Record<string, HTMLDivElement | null>>({}),
    timer = useRef<number | undefined>(undefined);
  const [project, setRaw] = useState(initial),
    [projects, setProjects] = useState<CanvasProject[]>([]),
    [view, setView] = useState<"dashboard" | "editor">("dashboard"),
    [pi, setPi] = useState(0),
    [selected, setSelected] = useState<string[]>([]),
    [editing, setEditing] = useState<string | null>(null),
    [zoom, setZoom] = useState(0.75),
    [saving, setSaving] = useState(false),
    [modal, setModal] = useState<"import" | "export" | null>(null),
    [progress, setProgress] = useState<ImportProgress | null>(null),
    [warnings, setWarnings] = useState<PdfImportWarning[]>([]),
    [cleaningPdfBackground, setCleaningPdfBackground] = useState(false),
    [removingImageBackground, setRemovingImageBackground] = useState(false),
    [shapeMenu, setShapeMenu] = useState(false),
    [error, setError] = useState("");
  const page = project.pages[pi] || project.pages[0],
    size = PAGE_SIZES[project.preset],
    selection = page?.elements.filter((e) => selected.includes(e.id)) || [];
  const pdfBackgrounds =
      page?.elements.filter(isPdfBackground) || [],
    pdfBackgroundVisible = pdfBackgrounds.some((e) => (e.style.opacity ?? 1) > 0);
  const commit = (n: CanvasProject, record = true) => {
    n = { ...n, meta: { ...n.meta, updatedAt: new Date().toISOString() } };
    if (record) {
      hist.current.push(clone(n));
      redoStack.current = [];
    }
    setRaw(n);
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () =>
        saveProject(n).then(async () => {
          setProjects(await listProjects());
          setSaving(false);
        }),
      400,
    );
  };
  const mutate = (fn: (p: CanvasProject) => void, record = true) => {
    const n = clone(project);
    fn(n);
    commit(n, record);
  };
  useEffect(() => {
    Promise.all([loadProject(), listProjects()]).then(([p, all]) => {
      setProjects(all);
      if (p) {
        setRaw(p);
        hist.current = [p];
      }
    });
  }, []);
  const open = (p: CanvasProject) => {
      setRaw(p);
      hist.current = [clone(p)];
      redoStack.current = [];
      setPi(0);
      setSelected([]);
      setView("editor");
    },
    create = () => open(newProject());
  const undo = () => {
      if (hist.current.length < 2) return;
      redoStack.current.push(hist.current.pop()!);
      setRaw(clone(hist.current.at(-1)!));
    },
    redo = () => {
      const p = redoStack.current.pop();
      if (p) {
        hist.current.push(p);
        setRaw(clone(p));
      }
    };
  const move = (dx: number, dy: number) =>
    mutate(
      (p) =>
        (p.pages[pi].elements = p.pages[pi].elements.map((e) =>
          selected.includes(e.id) && !e.locked
            ? { ...e, x: e.x + dx, y: e.y + dy }
            : e,
        )),
    );
  const remove = () => {
    mutate(
      (p) =>
        (p.pages[pi].elements = p.pages[pi].elements.filter(
          (e) => !selected.includes(e.id),
        )),
    );
    setSelected([]);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)
      )
        return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "a") {
        e.preventDefault();
        setSelected(page.elements.filter((x) => !x.locked).map((x) => x.id));
      } else if (mod && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (mod && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (["Delete", "Backspace"].includes(e.key)) {
        e.preventDefault();
        remove();
      } else if (selected.length && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const n = e.shiftKey ? 10 : 1;
        move(
          e.key === "ArrowLeft" ? -n : e.key === "ArrowRight" ? n : 0,
          e.key === "ArrowUp" ? -n : e.key === "ArrowDown" ? n : 0,
        );
      }
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  const add = (type: "text" | "shape" | "image", src?: string,shapeKind:"rectangle"|"circle"|"line"|"triangle"="rectangle") => {
    const shapeSize=shapeKind==='circle'?{width:180,height:180}:shapeKind==='line'?{width:300,height:8}:shapeKind==='triangle'?{width:220,height:190}:{width:250,height:160}
    const e: EditorElement = {
      id: uid(),
      type,
      x: 120,
      y: 120,
      width: type === "text" ? 430 : type==='shape'?shapeSize.width:250,
      height: type === "text" ? 80 : type==='shape'?shapeSize.height:160,
      rotation: 0,
      zIndex: Math.max(0, ...page.elements.map((x) => x.zIndex)) + 1,
      content: type === "text" ? "新しいテキスト" : undefined,
      src,
      style: {
        fontFamily: "Noto Sans JP, sans-serif",
        fontSize: 34,
        fontWeight: 600,
        color: "#10233f",
        backgroundColor: type === "shape" ? "#1769e0" : "transparent",
        borderRadius: type === "shape" ? shapeKind==='circle'?999:shapeKind==='line'?4:10 : 0,
        clipPath: type==='shape'&&shapeKind==='triangle'?'polygon(50% 0, 100% 100%, 0 100%)':undefined,
        opacity: 1,
      },
    };
    mutate((p) => p.pages[pi].elements.push(e));
    setSelected([e.id]);
  };
  const pick = (accept: string, cb: (f: File) => void) => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = accept;
    i.onchange = () => i.files?.[0] && cb(i.files[0]);
    i.click();
  };
  const readPdf = () =>
    pick(".pdf", async (f) => {
      setModal(null);
      setProgress({
        phase: "loading",
        page: 0,
        total: 0,
        ratio: 0,
        message: "準備中…",
      });
      try {
        const r = await importPdf(f, setProgress),
          n = clone(project);
        n.title = f.name.replace(/\.pdf$/i, "");
        n.pages = r.pages;
        n.preset = r.preset;
        commit(n);
        setWarnings(r.warnings);
        setPi(0);
        setSelected([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "PDFを読み込めませんでした");
      } finally {
        setProgress(null);
      }
    });
  const readHtml = () =>
    pick(".html,.htm", async (f) => {
      try {
        const r = await importRenderedHtml(await f.text());
        mutate((p) => {
          p.title = f.name;
          p.pages = [r.page];
          p.preset = r.preset;
          p.css = r.css;
        });
        setPi(0);
        setModal(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "HTMLを読み込めませんでした");
      }
    });
  const readJson = () =>
    pick(".json", async (f) => {
      try {
        open(JSON.parse(await f.text()));
      } catch {
        setError("編集データを読み込めませんでした");
      }
    });
  const update = (fn: (e: EditorElement) => EditorElement) =>
    mutate(
      (p) =>
        (p.pages[pi].elements = p.pages[pi].elements.map((e) =>
          selected.includes(e.id) ? fn(e) : e,
        )),
    );
  const duplicate = () => {
    const copies = selection.map((e) => ({
      ...clone(e),
      id: uid(),
      x: e.x + 16,
      y: e.y + 16,
    }));
    mutate((p) => p.pages[pi].elements.push(...copies));
    setSelected(copies.map((e) => e.id));
  };
  const removeSavedProject = async (id: string) => {
    setProjects((items) => items.filter((item) => item.id !== id));
    try {
      await deleteStoredProject(id);
      setProjects(await listProjects());
    } catch {
      setProjects(await listProjects());
      setError("資料を削除できませんでした。もう一度お試しください");
    }
  };
  if (view === "dashboard")
    return (
      <div className="dashboard-v2">
        <header>
          <b className="logo-v2">
            CN <span>CanvasNote</span>
          </b>
          <div>
            <button onClick={() => setModal("import")}>
              <FileUp />
              読み込み
            </button>
            <button className="blue" onClick={create}>
              <Plus />
              新しい資料
            </button>
          </div>
        </header>
        <main>
          <h1>保存した資料</h1>
          <p>この端末に自動保存されています。いつでも編集を再開できます。</p>
          <div className="project-grid-v2">
            <button className="new-card" onClick={create}>
              <FilePlus2 />
              <b>新しい資料を作成</b>
            </button>
            {projects.map((p) => (
              <article key={p.id}>
                <button className="preview-v2" onClick={() => open(p)}>
                  <PageThumbnail
                    page={p.pages[0]}
                    project={p}
                    maxWidth={230}
                    maxHeight={250}
                  />
                  <span className="dashboard-preview-page-count">
                    {p.pages.length}ページ
                  </span>
                </button>
                <div>
                  <h2>{p.title}</h2>
                  <p>{new Date(p.meta.updatedAt).toLocaleString("ja-JP")}</p>
                  <button onClick={() => open(p)}>開く</button>
                  <button
                    aria-label={`${p.title}を削除`}
                    title="資料を削除"
                    onClick={() => removeSavedProject(p.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
        {modal === "import" && (
          <ImportModal
            pdf={readPdf}
            html={readHtml}
            json={readJson}
            close={() => setModal(null)}
          />
        )}
      </div>
    );
  const exportPdf = async () => {
    setModal(null);
    setProgress({
      phase: "rendering",
      page: 0,
      total: project.pages.length,
      ratio: 0,
      message: "PDFを生成中…",
    });
    try {
      await exportBrowserPdf(
        project.pages
          .map((p) => nodes.current[p.id])
          .filter(Boolean) as HTMLElement[],
        project,
        (r) =>
          setProgress({
            phase: "rendering",
            page: Math.ceil(r * project.pages.length),
            total: project.pages.length,
            ratio: r,
            message: "PDFを生成中…",
          }),
      );
    } finally {
      setProgress(null);
    }
  };
  return (
    <div className="app-v2">
      <header className="topbar-v2">
        <button onClick={() => setView("dashboard")}>
          <LayoutDashboard />
          ダッシュボード
        </button>
        <b className="logo-v2">
          CN <span>CanvasNote</span>
        </b>
        <input
          value={project.title}
          onChange={(e) =>
            mutate((p) => {
              p.title = e.target.value;
            })
          }
        />
        <span className="saved-v2">✓ {saving ? "保存中…" : "保存済み"}</span>
        <button onClick={undo}>
          <Undo2 />
        </button>
        <button onClick={redo}>
          <Redo2 />
        </button>
        <div className="zoom-v2">
          <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
            <Minus />
          </button>
          {Math.round(zoom * 100)}%
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
            <Plus />
          </button>
        </div>
        <button onClick={() => setModal("import")}>
          <FileUp />
          読み込み
        </button>
        <button className="blue" onClick={() => setModal("export")}>
          <FileDown />
          書き出し
        </button>
      </header>
      <div className="editor-v2">
        <PageNavigator
          project={project}
          active={pi}
          onSelect={(index) => {
            setPi(index);
            setSelected([]);
          }}
          onAdd={() => {
            mutate((p) => p.pages.push(newPage(p.pages.length)));
            setPi(project.pages.length);
          }}
        />
        <main
          className="workspace-v2"
          style={
            {
              "--page-width": `${size.width}px`,
              "--page-height": `${size.height}px`,
            } as React.CSSProperties
          }
        >
          <div className="floating-v2">
            <button onClick={() => add("text")}>
              <Type />
              テキスト
            </button>
            <div className="shape-tool-v2">
              <button onClick={() => setShapeMenu(v=>!v)}><Shapes />図形</button>
              {shapeMenu&&<div className="shape-menu-v2">
                <button onClick={()=>{add('shape',undefined,'rectangle');setShapeMenu(false)}}><span className="shape-icon rectangle"/>長方形</button>
                <button onClick={()=>{add('shape',undefined,'circle');setShapeMenu(false)}}><span className="shape-icon circle"/>円</button>
                <button onClick={()=>{add('shape',undefined,'line');setShapeMenu(false)}}><span className="shape-icon line"/>線</button>
                <button onClick={()=>{add('shape',undefined,'triangle');setShapeMenu(false)}}><span className="shape-icon triangle"/>三角形</button>
              </div>}
            </div>
            <button
              onClick={() =>
                pick("image/*", (f) => {
                  const r = new FileReader();
                  r.onload = () => add("image", String(r.result));
                  r.readAsDataURL(f);
                })
              }
            >
              <ImagePlus />
              画像
            </button>
            <select
              value={project.preset}
              onChange={(e) => {
                const v = e.target.value as PagePreset;
                mutate((p) =>
                  resizeProject(p, v, PAGE_SIZES[p.preset], PAGE_SIZES[v]),
                );
              }}
            >
              {Object.keys(PAGE_SIZES).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <EditorCanvas
            page={page}
            zoom={zoom}
            selected={selected}
            editing={editing}
            onSelected={setSelected}
            onEditing={setEditing}
            onElements={(els, c) =>
              mutate((p) => {
                p.pages[pi].elements = els;
              }, c)
            }
            nodeRef={(n) => {
              nodes.current[page.id] = n;
            }}
          />
        </main>
        <Inspector
          elements={selection}
          background={page.background}
          hasPdfBackground={pdfBackgrounds.length > 0}
          pdfBackgroundVisible={pdfBackgroundVisible}
          cleaningPdfBackground={cleaningPdfBackground}
          removingImageBackground={removingImageBackground}
          pageColor={(c) =>
            mutate((p) => {
              p.pages[pi].background = c;
            })
          }
          togglePdfBackground={() =>
            mutate((p) => {
              p.pages[pi].elements = setPdfBackgroundVisible(
                p.pages[pi].elements,
                !pdfBackgroundVisible,
              );
            })
          }
          cleanPdfBackground={async () => {
            const background = pdfBackgrounds[0];
            const texts = page.elements.filter(
              (e) =>
                e.type === "text" &&
                (e.pdfSource?.kind === "text" || e.pdfSource?.kind === "ocr"),
            );
            if (!background?.src || !texts.length) {
              setError("背景から消せる抽出テキストがありません");
              return;
            }
            setCleaningPdfBackground(true);
            try {
              const cleaned = await removeExtractedTextFromBackground(
                background.src,
                size.width,
                size.height,
                texts,
              );
              mutate((p) => {
                p.pages[pi].elements = p.pages[pi].elements.map((e) =>
                  e.id === background.id ? { ...e, src: cleaned } : e,
                );
              });
            } catch (e) {
              setError(e instanceof Error ? e.message : "背景の文字を消せませんでした");
            } finally {
              setCleaningPdfBackground(false);
            }
          }}
          removePdfBackground={() =>
            mutate((p) => {
              p.pages[pi].elements = removePdfBackground(p.pages[pi].elements);
            })
          }
          removeImageBackground={async()=>{
            const image=selection.length===1&&selection[0].type==='image'?selection[0]:undefined;if(!image?.src)return
            setRemovingImageBackground(true);try{const cleaned=await removeSolidImageBackground(image.src);mutate(p=>{p.pages[pi].elements=p.pages[pi].elements.map(e=>e.id===image.id?{...e,src:cleaned}:e)})}catch(e){setError(e instanceof Error?e.message:'画像背景を削除できませんでした')}finally{setRemovingImageBackground(false)}
          }}
          move={(d) => move(0, d)}
          update={update}
          alignTo={(m) =>
            mutate((p) => {
              p.pages[pi].elements = align(p.pages[pi].elements, selected, m);
            })
          }
          distributeTo={(a) =>
            mutate((p) => {
              p.pages[pi].elements = distribute(
                p.pages[pi].elements,
                selected,
                a,
              );
            })
          }
          group={() => {const groupId=uid();mutate(p=>{p.pages[pi].elements=groupElements(p.pages[pi].elements,selected,groupId)})}}
          duplicate={duplicate}
          remove={remove}
        />
      </div>
      <footer className="status-v2">
        ページ {pi + 1} / {project.pages.length}
        <span>ドラッグで範囲選択　Shift + クリックで追加　矢印キーで移動</span>
        <span>
          {selected.length ? `${selected.length}個を選択中` : project.preset}
        </span>
      </footer>
      {modal === "import" && (
        <ImportModal
          pdf={readPdf}
          html={readHtml}
          json={readJson}
          close={() => setModal(null)}
        />
      )}{" "}
      {modal === "export" && (
        <ExportModal
          pdf={exportPdf}
          html={() =>
            download(
              `${project.title}.html`,
              projectToHtml(project),
              "text/html",
            )
          }
          png={() =>
            nodes.current[page.id] &&
            exportPagePng(nodes.current[page.id]!, project.title)
          }
          json={() =>
            download(
              `${project.title}.canvasnote.json`,
              JSON.stringify(project, null, 2),
              "application/json",
            )
          }
          close={() => setModal(null)}
        />
      )}{" "}
      {progress && <Progress p={progress} />}{" "}
      {(warnings.length > 0 || error) && (
        <Notice
          warnings={warnings}
          error={error}
          close={() => {
            setWarnings([]);
            setError("");
          }}
        />
      )}
      <ExportPages
        project={project}
        onNode={(id, n) => {
          nodes.current[id] = n;
        }}
      />
    </div>
  );
}
const ImportModal = ({ pdf, html, json, close }: any) => (
  <div className="modal-v2" onMouseDown={close}>
    <div onMouseDown={(e) => e.stopPropagation()}>
      <h2>資料を読み込む</h2>
      <p>PDFは文字を編集要素へ分解し、画像PDFは日本語OCRを使用します。</p>
      <button onClick={pdf}>
        <FileUp />
        <span>
          <b>PDFを読み込む</b>
          <small>文字・画像・ページを自動解析</small>
        </span>
      </button>
      <button onClick={html}>
        <FileUp />
        <span>
          <b>HTMLを読み込む</b>
        </span>
      </button>
      <button onClick={json}>
        <FolderOpen />
        <span>
          <b>編集データを開く</b>
        </span>
      </button>
      <button className="cancel" onClick={close}>
        キャンセル
      </button>
    </div>
  </div>
);
const ExportModal = ({ pdf, html, png, json, close }: any) => (
  <div className="modal-v2" onMouseDown={close}>
    <div onMouseDown={(e) => e.stopPropagation()}>
      <h2>書き出し</h2>
      <button onClick={pdf}>PDF</button>
      <button onClick={html}>HTML</button>
      <button onClick={png}>PNG</button>
      <button onClick={json}>編集データ</button>
    </div>
  </div>
);
const Progress = ({ p }: { p: ImportProgress }) => (
  <div className="modal-v2">
    <div className="progress-v2">
      <div className="spinner" />
      <h2>{p.message}</h2>
      <progress value={p.ratio} max={1} />
    </div>
  </div>
);
const Notice = ({
  warnings,
  error,
  close,
}: {
  warnings: PdfImportWarning[];
  error: string;
  close: () => void;
}) => (
  <div className="notice-v2">
    <b>{error ? "エラー" : "PDFを読み込みました"}</b>
    {error && <p>{error}</p>}
    {warnings.slice(0, 5).map((w, i) => (
      <p key={i}>{w.message}</p>
    ))}
    <button onClick={close}>閉じる</button>
  </div>
);
function Inspector({
  elements,
  background,
  hasPdfBackground,
  pdfBackgroundVisible,
  cleaningPdfBackground,
  removingImageBackground,
  pageColor,
  togglePdfBackground,
  cleanPdfBackground,
  removePdfBackground,
  removeImageBackground,
  move,
  update,
  alignTo,
  distributeTo,
  group,
  duplicate,
  remove,
}: any) {
  const e: EditorElement | undefined =
    elements.length === 1 ? elements[0] : undefined;
  return (
    <aside className="inspector-v2">
      <div className="tabs-v2">プロパティ</div>
      {hasPdfBackground && (
        <section className="pdf-background-controls">
          <h3>PDFの元背景</h3>
          <p>
            元PDF全体の固定画像です。隠すと、抽出された文字や追加素材だけを編集できます。
          </p>
          <button
            className="primary-clean"
            onClick={cleanPdfBackground}
            disabled={cleaningPdfBackground}
          >
            <Type />
            {cleaningPdfBackground ? "背景を処理中…" : "背景の文字だけ消す"}
          </button>
          <button onClick={togglePdfBackground}>
            {pdfBackgroundVisible ? <EyeOff /> : <Eye />}
            {pdfBackgroundVisible ? "PDF背景を非表示" : "PDF背景を表示"}
          </button>
          <button className="danger" onClick={removePdfBackground}>
            <Trash2 />PDF背景を削除
          </button>
          <small>単色の背景ほどきれいに消せます。文字と重なる細い線は一部欠ける場合があります。処理後もUndoで戻せます。</small>
        </section>
      )}
      {!elements.length ? (
        <section>
          <h3>ページ</h3>
          <label>
            背景色{" "}
            <input
              type="color"
              value={background}
              onChange={(x) => pageColor(x.target.value)}
            />
          </label>
          <p>
            キャンバス上をドラッグすると、複数の要素をまとめて選択できます。
          </p>
        </section>
      ) : (
        <>
          <section>
            <h3>
              {elements.length > 1
                ? `${elements.length}個の要素を選択中`
                : "位置とサイズ"}
            </h3>
            {e && (
              <div className="grid-v2">
                {(["x", "y", "width", "height"] as const).map((k) => (
                  <label key={k}>
                    {k.toUpperCase()}
                    <input
                      type="number"
                      value={Math.round(e[k])}
                      onChange={(x) =>
                        update((v: EditorElement) => ({
                          ...v,
                          [k]: Number(x.target.value),
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            <button onClick={() => move(-10)}>
              <ArrowUp />
              まとめて上へ
            </button>
            <button className="primary" onClick={() => move(10)}>
              <ArrowDown />
              選択項目をまとめて下へ
            </button>
          </section>
          {e?.type === "text" && (
            <section>
              <h3>テキスト</h3>
              <input
                type="number"
                value={e.style.fontSize}
                onChange={(x) =>
                  update((v: EditorElement) => ({
                    ...v,
                    style: { ...v.style, fontSize: Number(x.target.value) },
                  }))
                }
              />
              <input
                type="color"
                value={e.style.color || "#111827"}
                onChange={(x) =>
                  update((v: EditorElement) => ({
                    ...v,
                    style: { ...v.style, color: x.target.value },
                  }))
                }
              />
              <h3 className="subheading-v2">文字揃え</h3>
              <div className="text-align-v2">
                <button className={e.style.textAlign==='left'||!e.style.textAlign?'active':''} onClick={()=>update((v:EditorElement)=>({...v,style:{...v.style,textAlign:'left'}}))}><AlignLeft/>左寄せ</button>
                <button className={e.style.textAlign==='center'?'active':''} onClick={()=>update((v:EditorElement)=>({...v,style:{...v.style,textAlign:'center'}}))}><AlignCenter/>中央</button>
                <button className={e.style.textAlign==='right'?'active':''} onClick={()=>update((v:EditorElement)=>({...v,style:{...v.style,textAlign:'right'}}))}><AlignRight/>右寄せ</button>
              </div>
            </section>
          )}
          {e?.type==='image'&&<section><h3>画像</h3><button className="primary" disabled={removingImageBackground} onClick={removeImageBackground}>{removingImageBackground?'背景を処理中…':'無地・白背景を削除'}</button><p>画像の外周につながる単色背景を透明にします。Undoで戻せます。</p></section>}
          <section>
            <h3>整列</h3>
            <div className="icons-v2">
              <button onClick={() => alignTo("left")}>
                <AlignLeft />
              </button>
              <button onClick={() => alignTo("center")}>
                <AlignCenter />
              </button>
              <button onClick={() => alignTo("right")}>
                <AlignRight />
              </button>
              <button onClick={() => alignTo("top")}>
                <ArrowUp />
              </button>
              <button onClick={() => alignTo("bottom")}>
                <ArrowDown />
              </button>
              <button onClick={() => distributeTo("x")}>↔</button>
              <button onClick={() => distributeTo("y")}>↕</button>
            </div>
          </section>
          <section>
            <button onClick={group}>
              <Group />
              グループ化
            </button>
            <button onClick={duplicate}>
              <Copy />
              複製
            </button>
            <button className="danger" onClick={remove}>
              <Trash2 />
              削除
            </button>
          </section>
        </>
      )}
    </aside>
  );
}
