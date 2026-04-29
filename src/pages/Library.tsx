import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bookmark } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
}

const Library = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, number>>({});

  useEffect(() => {
    document.title = "Library — Foliant";
    supabase
      .from("books")
      .select("id, title, author, description")
      .order("title")
      .then(({ data }) => setBooks(data ?? []));
  }, []);

  useEffect(() => {
    if (!user) {
      setBookmarks({});
      return;
    }
    supabase
      .from("bookmarks")
      .select("book_id, page")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((b: any) => (map[b.book_id] = b.page));
        setBookmarks(map);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <main className="container py-12">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">Library</h1>
            <p className="mt-2 text-muted-foreground">Five timeless reads, ready when you are.</p>
          </div>
        </div>

        {books === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <p className="text-muted-foreground">No books yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => {
              const page = bookmarks[book.id];
              return (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-hero opacity-60 transition-smooth group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-lg bg-gradient-hero p-2.5 text-primary-foreground shadow-elegant">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    {page ? (
                      <Badge variant="secondary" className="gap-1">
                        <Bookmark className="h-3 w-3" /> p.{page}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-5 font-serif text-xl font-semibold leading-tight">{book.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
                  {book.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{book.description}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;
