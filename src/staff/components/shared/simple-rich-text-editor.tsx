"use client";

import { Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toProseHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Tailwind min-height utility — only works if present in staff-admin.generated.css. */
  minHeightClassName?: string;
  /** Always-applied min-height for the editor surface (px number or CSS length). */
  minHeight?: number | string;
}

type EditorMode = "preview" | "write" | "html";

/**
 * Shared Write + Preview rhythm for all product page sections
 * (Description, Details, Download & access).
 */
const PROSE_CLASS = cn(
  "product-section-prose px-3 py-3 text-sm leading-relaxed",
  "[&_p]:my-0 [&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-1 [&_strong]:font-semibold",
);

function emptyToBlank(html: string): string {
  return html === "<p></p>" ? "" : html;
}

/** Canonical HTML shared by Write and Preview. */
function canonicalHtml(html: string): string {
  return emptyToBlank(toProseHtml(html)).replace(/(?:<p><\/p>)+$/gi, "");
}

function isEmptyParagraphNode(node: { type: { name: string }; content: { size: number }; textContent: string }) {
  if (node.type.name !== "paragraph") return false;
  return node.content.size === 0 || node.textContent.trim() === "";
}

/** Drop empty paragraphs between content blocks so Write matches Preview. */
const OmitMidEmptyParagraphs = Extension.create({
  name: "omitMidEmptyParagraphs",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("omitMidEmptyParagraphs"),
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const deletions: Array<{ from: number; to: number }> = [];
          const doc = newState.doc;
          doc.forEach((node, pos, index) => {
            if (!isEmptyParagraphNode(node)) return;
            // Keep a trailing empty paragraph for the caret / new line.
            if (index === doc.childCount - 1) return;
            deletions.push({ from: pos, to: pos + node.nodeSize });
          });
          if (!deletions.length) return null;

          const tr = newState.tr;
          for (let i = deletions.length - 1; i >= 0; i -= 1) {
            tr.delete(deletions[i].from, deletions[i].to);
          }
          return tr;
        },
      }),
    ];
  },
});

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-xs"
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

/** Product section TipTap editor — Write / Preview / HTML stay in sync. */
export function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = "Write content…",
  className,
  minHeightClassName = "min-h-32",
  minHeight,
}: SimpleRichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("write");
  const [htmlDraft, setHtmlDraft] = useState(() => canonicalHtml(value));
  const lastEmitted = useRef(canonicalHtml(value));
  const syncingRef = useRef(false);
  const surfaceMinHeight =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight || undefined;
  const surfaceStyle = surfaceMinHeight ? { minHeight: surfaceMinHeight } : undefined;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      OmitMidEmptyParagraphs,
    ],
    content: canonicalHtml(value) || "<p></p>",
    editorProps: {
      attributes: {
        class: cn(
          "tiptap outline-none focus:outline-none",
          minHeightClassName,
          PROSE_CLASS,
        ),
        ...(surfaceMinHeight ? { style: `min-height: ${surfaceMinHeight}` } : {}),
      },
    },
    onUpdate: ({ editor: active }) => {
      if (syncingRef.current) return;
      const html = canonicalHtml(active.getHTML());
      lastEmitted.current = html;
      setHtmlDraft(html);
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = canonicalHtml(value);
    const editorCanon = canonicalHtml(editor.getHTML());
    if (editorCanon === next && next === lastEmitted.current) {
      setHtmlDraft(next);
      return;
    }
    if (next === lastEmitted.current && editorCanon === next) {
      setHtmlDraft(next);
      return;
    }
    if (next === lastEmitted.current) {
      // Value already emitted; still force Write DOM onto Preview HTML.
      if (editorCanon !== next) {
        syncingRef.current = true;
        editor.commands.setContent(next || "<p></p>", { emitUpdate: false });
        syncingRef.current = false;
      }
      setHtmlDraft(next);
      return;
    }
    lastEmitted.current = next;
    setHtmlDraft(next);
    syncingRef.current = true;
    editor.commands.setContent(next || "<p></p>", { emitUpdate: false });
    syncingRef.current = false;
  }, [editor, value]);

  function commitHtml(nextHtml: string) {
    const normalized = canonicalHtml(nextHtml);
    lastEmitted.current = normalized;
    setHtmlDraft(normalized);
    onChange(normalized);
    syncingRef.current = true;
    editor?.commands.setContent(normalized || "<p></p>", { emitUpdate: false });
    syncingRef.current = false;
  }

  function syncWriteFromValue() {
    if (!editor) return;
    const normalized = canonicalHtml(value);
    syncingRef.current = true;
    editor.commands.setContent(normalized || "<p></p>", { emitUpdate: false });
    syncingRef.current = false;
    lastEmitted.current = normalized;
    setHtmlDraft(normalized);
  }

  function onModeChange(next: string | number | null) {
    if (next !== "preview" && next !== "write" && next !== "html") return;
    if (mode === "html" && next !== "html") {
      commitHtml(htmlDraft);
    }
    if (mode === "write" && next === "preview" && editor) {
      const html = canonicalHtml(editor.getHTML());
      lastEmitted.current = html;
      setHtmlDraft(html);
      onChange(html);
    }
    if (next === "html" && editor) {
      setHtmlDraft(canonicalHtml(editor.getHTML()));
    }
    if (next === "write") {
      syncWriteFromValue();
    }
    setMode(next);
  }

  const previewHtml = canonicalHtml(value);
  const emptyPreview = !previewHtml;

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground",
          minHeightClassName,
          className,
        )}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-background", className)}>
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

          {mode === "write" ? (
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
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton
                label="Bullet list"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List />
              </ToolbarButton>
              <ToolbarButton
                label="Numbered list"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered />
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
            <p
              className={cn(
                "text-muted-foreground",
                minHeightClassName,
                "px-3 py-3 text-sm",
              )}
              style={surfaceStyle}
            >
              Nothing to preview yet. Switch to Write to add content.
            </p>
          ) : (
            <div
              className={cn(minHeightClassName, PROSE_CLASS)}
              style={surfaceStyle}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </TabsContent>

        <TabsContent value="write" className="mt-0" keepMounted>
          <div
            className={cn(mode !== "write" && "hidden", minHeightClassName)}
            style={surfaceStyle}
          >
            <EditorContent
              editor={editor}
              className="h-full [&_.ProseMirror]:min-h-[inherit] [&_.tiptap]:min-h-[inherit]"
            />
          </div>
        </TabsContent>

        <TabsContent value="html" className="mt-0">
          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            onBlur={() => commitHtml(htmlDraft)}
            spellCheck={false}
            style={surfaceStyle}
            className={cn(
              "rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0",
              minHeightClassName,
            )}
            placeholder="<p>Write HTML here…</p>"
          />
          <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Raw HTML source. Changes apply when you leave this tab or click away.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
