import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Check, X, RotateCcw } from 'lucide-react';

export interface InlineEditorProps {
  content: string;
  onSave: (newContent: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  label?: string;
  showEditButton?: boolean;
  autoFocus?: boolean;
}

const InlineEditor: React.FC<InlineEditorProps> = ({
  content,
  onSave,
  onCancel,
  disabled = false,
  placeholder = 'Voer inhoud in...',
  className,
  minRows = 3,
  maxRows = 20,
  label,
  showEditButton = true,
  autoFocus = true,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(content);
  const [hasChanges, setHasChanges] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Update edit content when content prop changes
  React.useEffect(() => {
    setEditContent(content);
    setHasChanges(false);
  }, [content]);

  // Auto-focus when entering edit mode
  React.useEffect(() => {
    if (isEditing && autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Position cursor at end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing, autoFocus]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditContent(content);
    setHasChanges(false);
  };

  const handleSave = () => {
    if (editContent.trim() === content.trim()) {
      // No actual changes, just exit edit mode
      handleCancel();
      return;
    }

    onSave(editContent.trim());
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
    setHasChanges(false);
    onCancel?.();
  };

  const handleReset = () => {
    setEditContent(content);
    setHasChanges(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleContentChange = (newContent: string) => {
    setEditContent(newContent);
    setHasChanges(newContent.trim() !== content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // Calculate dynamic rows based on content
  const calculateRows = (text: string): number => {
    const lines = text.split('\n').length;
    return Math.min(Math.max(lines, minRows), maxRows);
  };

  return (
    <div className={cn('group', className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-hysio-deep-green">
            {label}
          </label>
          {showEditButton && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              disabled={disabled}
              className="opacity-60 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 size={14} className="mr-1" />
              Bewerken
            </Button>
          )}
        </div>
      )}

      {!isEditing ? (
        <div className="relative">
          {content ? (
            <div 
              className={cn(
                'bg-hysio-cream/30 border border-hysio-mint/20 rounded-lg p-4 min-h-[80px]',
                'prose prose-sm max-w-none text-hysio-deep-green-900',
                showEditButton && 'cursor-pointer hover:bg-hysio-cream/50 transition-colors'
              )}
              onClick={showEditButton ? handleEdit : undefined}
            >
              <pre className="whitespace-pre-wrap font-inter text-sm leading-relaxed">
                {content}
              </pre>
              
              {showEditButton && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    disabled={disabled}
                    className="bg-white/80 hover:bg-white shadow-sm"
                  >
                    <Edit3 size={14} />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div 
              className={cn(
                'bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[80px] flex items-center justify-center',
                showEditButton && 'cursor-pointer hover:bg-gray-100 transition-colors'
              )}
              onClick={showEditButton ? handleEdit : undefined}
            >
              <div className="text-center text-gray-500">
                <Edit3 size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{placeholder}</p>
                {showEditButton && (
                  <p className="text-xs mt-1">Klik om te bewerken</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={calculateRows(editContent)}
            disabled={disabled}
            className="resize-none font-mono text-sm leading-relaxed"
          />
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={disabled}
              className="flex-shrink-0"
            >
              <Check size={14} className="mr-1" />
              Opslaan
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={disabled}
              className="flex-shrink-0"
            >
              <X size={14} className="mr-1" />
              Annuleren
            </Button>
            
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={disabled}
                className="flex-shrink-0"
              >
                <RotateCcw size={14} className="mr-1" />
                Herstellen
              </Button>
            )}
            
            <div className="flex-1" />
            
            <div className="text-xs text-gray-500 flex-shrink-0">
              <span>Ctrl+Enter om op te slaan, Esc om te annuleren</span>
              {hasChanges && (
                <span className="ml-2 text-amber-600">• Niet opgeslagen wijzigingen</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { InlineEditor };

// Additional component for editing structured content with sections
export interface SectionEditorProps {
  sections: { [key: string]: string };
  onSectionSave: (sectionKey: string, content: string) => void;
  disabled?: boolean;
  className?: string;
  sectionLabels?: { [key: string]: string };
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  sections,
  onSectionSave,
  disabled = false,
  className,
  sectionLabels = {},
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(sections).map(([key, content]) => (
        <InlineEditor
          key={key}
          content={content}
          onSave={(newContent) => onSectionSave(key, newContent)}
          disabled={disabled}
          label={sectionLabels[key] || key}
          placeholder={`Voer ${sectionLabels[key] || key} in...`}
          minRows={2}
          maxRows={15}
        />
      ))}
    </div>
  );
};

export { SectionEditor };