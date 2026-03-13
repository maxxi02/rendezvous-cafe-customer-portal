import { useState, useRef } from "react";
import Image from "next/image";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
  session: any;
  apiUrl: string;
}

export function CreateStoryModal({
  isOpen,
  onClose,
  onStoryCreated,
  session,
  apiUrl,
}: CreateStoryModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error("You can only upload up to 5 images per story.");
      return;
    }

    files.forEach((file) => {
      // Validate size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} is too large. Max 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || images.length === 0) {
      toast.error("Please provide a title and at least one image.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${apiUrl}/api/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: session?.user?.id,
          authorName: session?.user?.name,
          authorImage: session?.user?.image,
          title,
          description,
          images,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create story");
      }

      toast.success("Story shared successfully!");
      setTitle("");
      setDescription("");
      setImages([]);
      onStoryCreated(); // Triggers refresh and close
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to share story. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-black tracking-widest uppercase text-white">
            New Story<span className="text-primary">.</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Image Uploader */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Photos ({images.length}/5)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                  <Image src={img} alt={`Upload ${idx}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <ImagePlus size={24} />
                  <span className="text-xs font-medium">Add Photo</span>
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a catchy title..."
              maxLength={60}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-white/20"
            />
          </div>

          {/* Aesthetic Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/50">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write something aesthetic..."
              rows={3}
              maxLength={200}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm italic focus:outline-none focus:border-primary transition-colors text-white/80 placeholder:text-white/20 placeholder:not-italic resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-white/5">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || images.length === 0}
            className="w-full py-3.5 rounded-xl bg-primary text-background font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Posting...
              </>
            ) : (
              "Share Story"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
