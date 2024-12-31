import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Poem {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    full_name: string;
  };
  created_at: string;
  _count: {
    likes: number;
    bookmarks: number;
  };
}

const Index = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const fetchPoems = async () => {
      const { data, error } = await supabase
        .from('poems')
        .select(`
          *,
          author:profiles(id, username, full_name),
          _count {
            likes,
            bookmarks
          }
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching poems:', error);
        return;
      }

      setPoems(data || []);
    };

    fetchPoems();
  }, []);

  const handleLike = async (poemId: string) => {
    if (!session) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase
      .from('likes')
      .insert({ user_id: session.user.id, poem_id: poemId });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already liked",
          description: "You've already liked this poem",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not like the poem",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Success",
      description: "Poem liked successfully",
    });
  };

  const handleBookmark = async (poemId: string) => {
    if (!session) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: session.user.id, poem_id: poemId });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already bookmarked",
          description: "You've already bookmarked this poem",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not bookmark the poem",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Success",
      description: "Poem bookmarked successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/10">
      {/* Hero Section */}
      <section className="container px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-serif font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          Where Words Take Flight
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join our community of poets and poetry enthusiasts. Share your verses, discover new voices, and connect through the power of words.
        </p>
        {!session ? (
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-lg"
            onClick={() => navigate('/auth')}
          >
            Join Now
          </Button>
        ) : (
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-lg"
            onClick={() => navigate('/write')}
          >
            Start Writing
          </Button>
        )}
      </section>

      {/* Featured Poems */}
      <section className="container px-4 py-16">
        <h2 className="text-3xl font-serif font-bold mb-8 text-center">Featured Poems</h2>
        <div className="grid gap-8 max-w-4xl mx-auto">
          {poems.map((poem) => (
            <div key={poem.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-serif font-semibold mb-2">{poem.title}</h3>
                  <button
                    onClick={() => navigate(`/profile/${poem.author.id}`)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    by {poem.author.full_name || poem.author.username}
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(poem.created_at).toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-700 mb-4 whitespace-pre-line">{poem.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    onClick={() => handleLike(poem.id)}
                  >
                    <Heart size={18} />
                    <span>{poem._count.likes}</span>
                  </button>
                  <button
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                    onClick={() => handleBookmark(poem.id)}
                  >
                    <Bookmark size={18} />
                    <span>{poem._count.bookmarks}</span>
                  </button>
                  <button className="hover:text-gray-700 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 text-center">
        <h2 className="text-3xl font-serif font-bold mb-12">Express, Connect, Inspire</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-white shadow-md">
            <h3 className="text-xl font-semibold mb-3">Share Your Voice</h3>
            <p className="text-gray-600">Write and publish your poetry in a beautiful, distraction-free environment.</p>
          </div>
          <div className="p-6 rounded-lg bg-white shadow-md">
            <h3 className="text-xl font-semibold mb-3">Connect with Poets</h3>
            <p className="text-gray-600">Follow talented writers and engage with their work through likes and comments.</p>
          </div>
          <div className="p-6 rounded-lg bg-white shadow-md">
            <h3 className="text-xl font-semibold mb-3">Discover Poetry</h3>
            <p className="text-gray-600">Explore a diverse collection of poems from writers around the world.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;