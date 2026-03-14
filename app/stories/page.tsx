"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Plus, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { CreateStoryModal } from "./_components/CreateStoryModal";
import { formatDistanceToNow } from "date-fns";
import Navbar from "../components/landing/Navbar";
import { toast } from "sonner";

interface Story {
  _id: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  title: string;
  description?: string;
  images: string[];
  likedBy: string[];
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function StoriesPage() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Authentication check: Only registered users can interact (not anonymous)
  const isAuthUser = session?.user && !(session.user as any).isAnonymous;
  const currentUserId = session?.user?.id;

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/stories?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      const data = await res.json();
      setStories(data.stories);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load stories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleLike = async (storyId: string) => {
    if (!isAuthUser) {
      toast.error("Please sign in to like stories!");
      return;
    }

    // Optimistic UI update
    setStories((prev) =>
      prev.map((s) => {
        if (s._id === storyId) {
          const isLiked = s.likedBy.includes(currentUserId!);
          return {
            ...s,
            likedBy: isLiked
              ? s.likedBy.filter((id) => id !== currentUserId)
              : [...s.likedBy, currentUserId!],
          };
        }
        return s;
      })
    );

    try {
      const res = await fetch(`${API_URL}/api/stories/${storyId}/like`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      
      const updated = await res.json();
      // Sync strictly with server response if needed (optional since optimistic usually holds)
      setStories((prev) =>
        prev.map((s) => (s._id === storyId ? { ...s, likedBy: updated.likedBy } : s))
      );
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while liking the post.");
      // Revert would go here if needed
    }
  };

  return (
    <main className="min-h-screen bg-background text-white pb-24">
      <Navbar />
      
      <div className="pt-28 max-w-2xl mx-auto px-4 md:px-0">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest">
              Stories<span className="text-primary">.</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">What's happening at Rendezvous</p>
          </div>
          <button
            onClick={() => {
              if (isAuthUser) {
                setIsCreateModalOpen(true);
              } else {
                toast.error("Please sign in to share a story.");
              }
            }}
            className="w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 bg-primary text-background rounded-full font-bold text-sm tracking-widest uppercase hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="hidden md:block">Share Story</span>
          </button>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex flex-col gap-10 opacity-50">
            {/* Skeleton Loaders */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4 pt-4">
                <div className="flex items-center gap-3 px-4 md:px-0">
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="h-4 w-32 bg-white/10 rounded" />
                </div>
                <div className="w-full aspect-square md:rounded-lg bg-white/5" />
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <p className="text-lg font-medium">No stories yet.</p>
            <p className="text-sm">Be the first to share one!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12 sm:gap-16">
            {stories.map((story) => (
              <StoryCard 
                key={story._id} 
                story={story} 
                onLike={() => handleLike(story._id)} 
                currentUserId={currentUserId} 
              />
            ))}
          </div>
        )}

      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStoryCreated={() => {
          setIsCreateModalOpen(false);
          fetchStories();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        session={session}
        apiUrl={API_URL}
      />
    </main>
  );
}

// Subcomponent for mapping the stories cleanly
function StoryCard({
  story,
  onLike,
  currentUserId,
}: {
  story: Story;
  onLike: () => void;
  currentUserId?: string;
}) {
  const isLiked = currentUserId ? story.likedBy.includes(currentUserId) : false;
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  return (
    <article className="border-b border-white/5 pb-10 sm:border sm:border-white/10 sm:rounded-xl sm:bg-white/5 sm:pb-0 overflow-hidden">
      {/* Author Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-primary mr-1 bg-white/10">
            {story.authorImage ? (
              <Image src={story.authorImage} alt={story.authorName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-primary/20 text-primary">
                {story.authorName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[14px]">{story.authorName}</span>
            <span className="text-[11px] text-white/50">
              {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <button className="text-white/40 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image Carousel */}
      <div className="relative w-full aspect-square bg-black border-y border-white/5 sm:border-none">
        {story.images.map((img, idx) => (
          <Image
            key={idx}
            src={img}
            alt={story.title}
            fill
            className={`object-cover transition-opacity duration-500 ${
              idx === currentImgIndex ? "opacity-100" : "opacity-0"
            }`}
            priority={idx === 0}
          />
        ))}

        {/* Carousel Controls */}
        {story.images.length > 1 && (
          <div className="absolute inset-x-0 h-full flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setCurrentImgIndex((prev) => Math.max(0, prev - 1))}
              className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur shadow disabled:opacity-0"
              disabled={currentImgIndex === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => setCurrentImgIndex((prev) => Math.min(story.images.length - 1, prev + 1))}
              className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur shadow disabled:opacity-0"
              disabled={currentImgIndex === story.images.length - 1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}

        {/* Carousel Dots */}
        {story.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {story.images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentImgIndex ? "bg-primary w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-4">
          <button
            onClick={onLike}
            className={`transition-all active:scale-75 ${
              isLiked ? "text-red-500" : "text-white hover:text-white/70"
            }`}
          >
            <Heart size={26} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 1 : 1.5} />
          </button>
          <button className="text-white hover:text-white/70 transition-colors">
            <MessageCircle size={26} strokeWidth={1.5} />
          </button>
        </div>
        <div className="font-bold text-[14px] mt-2.5">
          {story.likedBy.length} {story.likedBy.length === 1 ? "like" : "likes"}
        </div>
      </div>

      {/* Captions */}
      <div className="px-4 pb-5 sm:pb-6 text-[14px] leading-relaxed">
        <span className="font-bold mr-2">{story.authorName}</span>
        <span>{story.title}</span> {/* Aesthetic Title */}

        {story.description && (
          <p className="mt-2 text-white/70 italic text-[13.5px] font-sans">
            "{story.description}"
          </p>
        )}
      </div>
    </article>
  );
}
