import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Code } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onSubmit?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  showToolbar?: boolean;
  minHeight?: string;
  className?: string;
}

function isEmptyHtml(html: string): boolean {
  if (typeof document === 'undefined') return !html.trim();
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent ?? '').trim() === '';
}

export function RichTextEditor({
  content = '',
  onChange,
  onSubmit,
  placeholder = '',
  editable = true,
  showToolbar = false,
  minHeight = '80px',
  className,
}: RichTextEditorProps) {
  const [, setTick] = useState(0);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none px-3 py-2 focus:outline-none',
          className
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
      setTick((n) => n + 1);
    },
  });

  useEffect(() => {
    if (!editor || content === undefined) return;
    const cur = editor.getHTML();
    if (content !== cur) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  const runSubmit = useCallback(() => {
    if (!editor || !onSubmitRef.current) return;
    const html = editor.getHTML();
    if (isEmptyHtml(html)) return;
    onSubmitRef.current(html);
    editor.commands.clearContent();
    setTick((n) => n + 1);
  }, [editor]);

  useEffect(() => {
    if (!editor || !onSubmit) return;
    const dom = editor.view.dom;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return;
      if (!dom.contains(document.activeElement)) return;
      e.preventDefault();
      runSubmit();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [editor, onSubmit, runSubmit]);

  const canSubmit =
    editor && onSubmit ? !editor.isEmpty && editor.getText().trim().length > 0 : false;

  if (!editor) {
    return (
      <div
        className={cn('rounded-md border border-input bg-background', className)}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn('rounded-md border border-input bg-background', className)}
      style={{ minHeight }}
    >
      {showToolbar ? (
        <div className="flex flex-wrap gap-0.5 border-b border-border px-1 py-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-pressed={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-pressed={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-pressed={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-pressed={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-pressed={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {onSubmit ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5">
          <span className="text-[11px] text-muted-foreground">
            ⌘ + Enter to submit
          </span>
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={!canSubmit}
            onClick={() => runSubmit()}
          >
            Comment
          </Button>
        </div>
      ) : null}
    </div>
  );
}
