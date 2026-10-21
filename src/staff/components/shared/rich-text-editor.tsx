"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextSelection } from "@tiptap/pm/state";
import { canSplit } from "@tiptap/pm/transform";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { applyImageSizeStyles } from "@/lib/html-image-sizes";
import { createMedia } from "@/services/media";
import { cn } from "@/lib/utils";
import type { MediaUploadContext } from "@/types";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  uploadContext?: MediaUploadContext;
}

type EditorMode = "preview" | "write" | "html";

const PREVIEW_CLASS =
  "min-h-56 px-3 py-3 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_hr]:my-4 [&_hr]:border-border";

const EDITOR_CLASS = `tiptap ${PREVIEW_CLASS} outline-none focus:outline-none`;

/** Persist resized dimensions as inline styles so Preview / public pages keep the size. */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const attr = element.getAttribute("width");
          if (attr) return Number.parseInt(attr, 10) || null;
          const styleWidth = element.style.width;
          if (styleWidth) return Number.parseInt(styleWidth, 10) || null;
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const width = Number(attributes.width);
          if (!Number.isFinite(width) || width <= 0) return {};
          return {
            width,
            style: `width: ${width}px; height: auto; max-width: 100%;`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const attr = element.getAttribute("height");
          if (attr) return Number.parseInt(attr, 10) || null;
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          const height = Number(attributes.height);
          if (!Number.isFinite(height) || height <= 0) return {};
          return { height };
        },
      },
    };
  },
});

function normalizeHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return applyImageSizeStyles(value);
  return applyImageSizeStyles(
    `<p>${trimmed
      .split(/\n{2,}/)
      .map((block) => block.replace(/\n/g, "<br />"))
      .join("</p><p>")}</p>`,
  );
}

function emptyToBlank(html: string): string {
  return html === "<p></p>" ? "" : html;
}

function emitHtml(html: string): string {
  return applyImageSizeStyles(emptyToBlank(html));
}

/** Split a partial text selection into its own textblock, then run `after`. */
function withIsolatedSelection(editor: Editor, after: () => boolean): boolean {
  const { empty, $from, $to, from, to } = editor.state.selection;

  if (empty || !$from.sameParent($to)) {
    return after();
  }

  const blockStart = $from.start();
  const blockEnd = $from.end();
  if (from <= blockStart && to >= blockEnd) {
    return after();
  }

  return editor
    .chain()
    .focus()
    .command(({ state, tr, dispatch }) => {
      if (!dispatch) return true;

      let selFrom = state.selection.from;
      const selTo = state.selection.to;
      const parentEnd = state.selection.$from.end();

      if (selTo < parentEnd) {
        if (!canSplit(tr.doc, selTo)) return false;
        tr.split(selTo);
      }

      selFrom = tr.mapping.map(selFrom);
      const $splitFrom = tr.doc.resolve(selFrom);
      if (selFrom > $splitFrom.start()) {
        if (!canSplit(tr.doc, selFrom)) return false;
        tr.split(selFrom);
        selFrom = tr.mapping.map(selFrom);
      }

      const $mid = tr.doc.resolve(selFrom);
      const blockPos = $mid.before($mid.depth);
      const node = tr.doc.nodeAt(blockPos);
      if (!node?.isTextblock) return false;

      tr.setSelection(
        TextSelection.create(tr.doc, blockPos + 1, blockPos + node.nodeSize - 1),
      );
      dispatch(tr);
      return true;
    })
    .command(() => after())
    .run();
}

function applyHeading(editor: Editor, level: 2 | 3) {
  withIsolatedSelection(editor, () =>
    editor.chain().focus().toggleHeading({ level }).run(),
  );
}

function applyList(editor: Editor, type: "bulletList" | "orderedList") {
  withIsolatedSelection(editor, () => {
    if (type === "bulletList") {
      return editor.chain().focus().toggleBulletList().run();
    }
    return editor.chain().focus().toggleOrderedList().run();
  });
}

/** Align only the current block (never every paragraph/heading in the doc). */
function applyAlign(editor: Editor, alignment: "left" | "center" | "right") {
  withIsolatedSelection(editor, () => {
    const { state } = editor;
    const { $from, from, to, empty } = state.selection;

    return editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        if (!dispatch) return true;

        const targets = new Set<number>();

        if (empty) {
          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth);
            if (node.type.name === "paragraph" || node.type.name === "heading") {
              targets.add($from.before(depth));
              break;
            }
          }
        } else {
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === "paragraph" || node.type.name === "heading") {
              targets.add(pos);
              return false;
            }
            return true;
          });
        }

        if (!targets.size) return false;

        for (const pos of targets) {
          const node = tr.doc.nodeAt(pos);
          if (!node) continue;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            textAlign: alignment,
          });
        }

        dispatch(tr.scrollIntoView());
        return true;
      })
      .run();
  });
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-pressed={active}
      className={cn(active && "bg-muted text-foreground")}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write content…",
  className,
  uploadContext,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("preview");
  const [htmlDraft, setHtmlDraft] = useState(() => emptyToBlank(normalizeHtml(value)));
  const [uploading, setUploading] = useState(false);
  const lastEmitted = useRef(emptyToBlank(normalizeHtml(value)));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  async function uploadAndInsert(file: File, position?: number) {
    const activeEditor = editorRef.current;
    if (!activeEditor) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files can be inserted");
      return;
    }
    setUploading(true);
    try {
      const asset = await createMedia(file, uploadContext);
      const chain = activeEditor.chain().focus();
      if (typeof position === "number") {
        chain.setTextSelection(position);
      }
      chain
        .setImage({
          src: asset.url,
          alt: file.name.replace(/\.[^.]+$/, "") || "Image",
          width: 480,
        })
        .run();
      toast.success("Image added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      ResizableImage.configure({
        allowBase64: false,
        resize: {
          enabled: true,
          directions: [
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ],
          minWidth: 80,
          minHeight: 80,
          alwaysPreserveAspectRatio: true,
        },
        HTMLAttributes: {
          class: "rounded-md h-auto max-w-full",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: null,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeHtml(value),
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = Array.from(event.dataTransfer.files).find((item) =>
          item.type.startsWith("image/"),
        );
        if (!file) return false;
        event.preventDefault();
        void uploadAndInsert(file, view.state.selection.from);
        return true;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((item) =>
          item.type.startsWith("image/"),
        );
        if (!file) return false;
        event.preventDefault();
        void uploadAndInsert(file);
        return true;
      },
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created;
    },
    onUpdate: ({ editor: next }) => {
      const html = emitHtml(next.getHTML());
      lastEmitted.current = html;
      setHtmlDraft(html);
      onChange(html);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const next = emptyToBlank(normalizeHtml(value));
    if (next === lastEmitted.current) return;
    lastEmitted.current = next;
    setHtmlDraft(next);
    if (editor) {
      editor.commands.setContent(next || "", { emitUpdate: false });
    }
  }, [editor, value]);

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  function commitHtml(nextHtml: string) {
    const normalized = emitHtml(normalizeHtml(nextHtml));
    lastEmitted.current = normalized;
    setHtmlDraft(normalized);
    onChange(normalized);
    editor?.commands.setContent(normalized || "", { emitUpdate: false });
  }

  function onModeChange(next: string | number | null) {
    if (next !== "preview" && next !== "write" && next !== "html") return;
    if (mode === "html" && next !== "html") {
      commitHtml(htmlDraft);
    }
    if (next === "html" && editor) {
      setHtmlDraft(emptyToBlank(editor.getHTML()));
    }
    setMode(next);
  }

  const previewHtml = normalizeHtml(value);
  const emptyPreview = !previewHtml;

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Tabs value={mode} onValueChange={onModeChange} className="gap-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
          <TabsList variant="line" className="h-7">
            <TabsTrigger value="preview" className="px-2.5 text-xs">
              Preview
            </TabsTrigger>
            <TabsTrigger value="write" className="px-2.5 text-xs">
              Write
            </TabsTrigger>
            <TabsTrigger value="html" className="px-2.5 text-xs">
              HTML
            </TabsTrigger>
          </TabsList>

          {mode === "write" && editor ? (
            <div className="flex flex-wrap items-center gap-0.5">
              <ToolbarButton
                label="Bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold />
              </ToolbarButton>
              <ToolbarButton
                label="Italic"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic />
              </ToolbarButton>
              <ToolbarButton
                label="Underline"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon />
              </ToolbarButton>
              <ToolbarButton
                label="Strikethrough"
                active={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton
                label="Heading 2"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => applyHeading(editor, 2)}
              >
                <Heading2 />
              </ToolbarButton>
              <ToolbarButton
                label="Heading 3"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => applyHeading(editor, 3)}
              >
                <Heading3 />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton
                label="Bullet list"
                active={editor.isActive("bulletList")}
                onClick={() => applyList(editor, "bulletList")}
              >
                <List />
              </ToolbarButton>
              <ToolbarButton
                label="Numbered list"
                active={editor.isActive("orderedList")}
                onClick={() => applyList(editor, "orderedList")}
              >
                <ListOrdered />
              </ToolbarButton>
              <ToolbarButton
                label="Quote"
                active={editor.isActive("blockquote")}
                onClick={() =>
                  withIsolatedSelection(editor, () =>
                    editor.chain().focus().toggleBlockquote().run(),
                  )
                }
              >
                <Quote />
              </ToolbarButton>
              <ToolbarButton
                label="Inline code"
                active={editor.isActive("code")}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code2 />
              </ToolbarButton>
              <ToolbarButton
                label="Divider"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton
                label="Align left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => applyAlign(editor, "left")}
              >
                <AlignLeft />
              </ToolbarButton>
              <ToolbarButton
                label="Align center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => applyAlign(editor, "center")}
              >
                <AlignCenter />
              </ToolbarButton>
              <ToolbarButton
                label="Align right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => applyAlign(editor, "right")}
              >
                <AlignRight />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
                <Link2 />
              </ToolbarButton>
              <ToolbarButton
                label="Upload image"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton
                label="Undo"
                disabled={!editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo2 />
              </ToolbarButton>
              <ToolbarButton
                label="Redo"
                disabled={!editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo2 />
              </ToolbarButton>
            </div>
          ) : null}
        </div>

        <TabsContent value="preview" className="mt-0">
          {emptyPreview ? (
            <p className="min-h-56 px-3 py-3 text-sm text-muted-foreground">
              Nothing to preview yet. Switch to Write to add content.
            </p>
          ) : (
            <div className={PREVIEW_CLASS} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
        </TabsContent>

        <TabsContent value="write" className="mt-0">
          <EditorContent editor={editor} />
          <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Tip: select text before applying headings, lists, or alignment. Click an image and drag
            the handles to resize.
          </p>
        </TabsContent>

        <TabsContent value="html" className="mt-0">
          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            onBlur={() => commitHtml(htmlDraft)}
            spellCheck={false}
            className="min-h-56 rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0"
            placeholder="<p>Write HTML here…</p>"
          />
          <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Raw HTML source. Changes apply when you leave this tab or click away.
          </p>
        </TabsContent>
      </Tabs>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAndInsert(file);
        }}
      />
    </div>
  );
}

/** @deprecated Use RichTextEditor — kept for existing imports. */
export const RichTextEditorPlaceholder = RichTextEditor;
