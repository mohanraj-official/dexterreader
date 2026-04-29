import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Book {
  id: string;
  title: string;
  author: string;
}
interface Page {
  page_number: number;
  content: string;
}

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [current, setCurrent] = useState(1);
  const [bookmarked, setBookmarked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // redirect unauthenticated users so bookmarks work
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [{ data: bookData }, { data: pageData }] = await Promise.all([
        supabase.from("books").select("id, title, author").eq("id", id).maybeSingle(),
        supabase.from("book_pages").select("page_number, content").eq("book_id", id).order("page_number"),
      ]);
      if (cancelled) return;
      setBook(bookData as Book | null);
      setPages((pageData as Page[]) ?? []);
      if (bookData) document.title = `${bookData.title} — Foliant`;
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load bookmark and resume
  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from("bookmarks")
      .select("page")
      .eq("user_id", user.id)
      .eq("book_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.page) {
          setBookmarked(data.page);
          setCurrent(data.page);
        }
      });
  }, [id, user]);

  const total = pages?.length ?? 0;
  const page = pages?.find((p) => p.page_number === current);

  const goPrev = useCallback(() => setCurrent((c) => Math.max(1, c - 1)), []);
  const goNext = useCallback(() => setCurrent((c) => Math.min(total || 1, c + 1)), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [current]);

  const saveBookmark = async () => {
    if (!user || !id) return;
    setSaving(true);
    const { error } = await supabase
      .from("bookmarks")
      .upsert(
        { user_id: user.id, book_id: id, page: current, updated_at: new Date().toISOString() },
        { onConflict: "user_id,book_id" }
      );
    setSaving(false);
    if (error) {
      toast.error("Could not save bookmark");
      return;
    }
    setBookmarked(current);
    toast.success(`Bookmarked page ${current}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <main className="container py-10">
        <div className="mx-auto max-w-2xl">
          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
            <Link to="/library">
              <ArrowLeft className="mr-1 h-4 w-4" /> Library
            </Link>
          </Button>

          {!book ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <div className="space-y-2 pt-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <header className="border-b border-border pb-6">
                <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">{book.title}</h1>
                <p className="mt-1 text-muted-foreground">{book.author}</p>
              </header>

              <article className="font-serif py-10 text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {page?.content ?? (pages && pages.length === 0 ? "This book has no content yet." : "")}
              </article>

              <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-full border border-border bg-card/95 p-2 pl-4 shadow-elegant backdrop-blur">
                <div className="text-sm text-muted-foreground">
                  Page {current} of {total || "—"}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={goPrev} disabled={current <= 1} aria-label="Previous page">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={bookmarked === current ? "default" : "outline"}
                    size="sm"
                    onClick={saveBookmark}
                    disabled={saving}
                    className={bookmarked === current ? "bg-gradient-hero text-primary-foreground" : ""}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : bookmarked === current ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    <span className="ml-1.5 hidden sm:inline">
                      {bookmarked === current ? "Bookmarked" : "Bookmark"}
                    </span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goNext} disabled={current >= total} aria-label="Next page">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reader;
