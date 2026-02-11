import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Undo,
  Redo,
  Code,
  Minus,
  Maximize2,
  Minimize2,
  Code2,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className, maxHeight }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [localHtml, setLocalHtml] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg my-4 mx-auto',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only update localHtml from editor if we are NOT in source mode
      // to avoid clobbering what the user is typing in the textarea
      setLocalHtml((prev) => {
        if (!isSourceMode) return html;
        return prev;
      });
      onChange(html);
    },
  });

  // Keep internal state in sync with external content prop
  // But ONLY if we are in visual mode and it's a genuine external update
  useEffect(() => {
    if (editor && !isSourceMode && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setLocalHtml(content);
    }
  }, [content, editor, isSourceMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  };

  const addYoutubeVideo = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
    }
  };

  const editorLayout = (
    <div className={cn(
      "border rounded-lg overflow-hidden bg-background flex flex-col transition-all duration-200",
      isFullscreen ? "fixed inset-0 z-[100] rounded-none h-full w-full pointer-events-auto" : cn("min-h-[300px]", className)
    )}>
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 flex flex-wrap gap-1 sticky top-0 z-20">
        {/* History */}
        <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
          <Toggle
            size="sm"
            pressed={isSourceMode}
            onPressedChange={() => {
              if (isSourceMode) {
                // Moving back to visual mode
                // We must set the content to what's currently in localHtml
                editor.chain().focus().setContent(localHtml).run();
              } else {
                // Moving to source mode
                const currentHtml = editor.getHTML();
                setLocalHtml(currentHtml);
              }
              setIsSourceMode(!isSourceMode);
            }}
            title="Ver Código Fonte"
          >
            <Code2 className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            disabled={isSourceMode}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            disabled={isSourceMode}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            disabled={isSourceMode}
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            disabled={isSourceMode}
          >
            <Code className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={isSourceMode}
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={isSourceMode}
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={isSourceMode}
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isSourceMode}
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isSourceMode}
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={isSourceMode}
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={isSourceMode}
          >
            <Minus className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Media */}
        <div className="flex items-center gap-0.5">
          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Toggle size="sm" pressed={editor.isActive('link')} disabled={isSourceMode}>
                <LinkIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">Inserir Link</p>
                <Input
                  placeholder="https://exemplo.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <Button size="sm" onClick={addLink}>Inserir</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover>
            <PopoverTrigger asChild>
              <Toggle size="sm" pressed={false} disabled={isSourceMode}>
                <ImageIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">Inserir Imagem</p>
                <Input
                  placeholder="URL da imagem"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button size="sm" onClick={addImage}>Inserir</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* YouTube */}
          <Popover>
            <PopoverTrigger asChild>
              <Toggle size="sm" pressed={false} disabled={isSourceMode}>
                <YoutubeIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">Inserir Vídeo do YouTube</p>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <Button size="sm" onClick={addYoutubeVideo}>Inserir</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Fullscreen Toggle */}
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Minimizar" : "Maximizar"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Editor Content with Scrollbar */}
      <div
        className={cn(
          "flex-1 overflow-y-auto bg-background custom-scrollbar",
          isFullscreen ? "p-4 md:p-10" : ""
        )}
        style={!isFullscreen ? { maxHeight: maxHeight || "500px" } : undefined}
        onWheel={(e) => {
          if (isFullscreen) e.stopPropagation();
        }}
      >
        <div className={cn("h-full", isFullscreen ? "max-w-4xl mx-auto" : "")}>
          {/* Source Mode Textarea */}
          <div className={cn("h-full", isSourceMode ? "block" : "hidden")}>
            <Textarea
              className="min-h-[300px] h-full w-full font-mono text-sm p-4 border-none focus-visible:ring-0 resize-none bg-muted/20"
              value={localHtml}
              onChange={(e) => {
                const val = e.target.value;
                setLocalHtml(val);
                onChange(val);
              }}
              placeholder="Digite seu HTML aqui..."
            />
          </div>

          {/* Visual Editor */}
          <div className={cn("h-full", !isSourceMode ? "block" : "hidden")}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Character Count */}
      <div className="border-t px-3 py-1.5 text-xs text-muted-foreground bg-muted/30 flex justify-between items-center">
        <span>{editor.storage.characterCount?.characters?.() || editor.getText().length} caracteres</span>
        {isFullscreen && <span className="text-[10px] opacity-70">Pressione ESC para sair do modo tela cheia</span>}
      </div>
    </div>
  );

  return isFullscreen ? createPortal(editorLayout, document.body) : editorLayout;
}
