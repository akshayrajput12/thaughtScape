import { Heart, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const featuredPoems = [
    {
      id: 1,
      title: "Whispers of Dawn",
      content: "In morning's gentle embrace,\nDew drops dance on petals fair,\nNature's symphony awakens,\nA new day's promise in the air.",
      author: "Emily Rivers",
      likes: 234,
      bookmarks: 56,
    },
    {
      id: 2,
      title: "Urban Dreams",
      content: "City lights like stars below,\nConcrete canyons stretch and flow,\nDreams take flight on subway wings,\nUrban heart forever sings.",
      author: "Marcus Chen",
      likes: 189,
      bookmarks: 42,
    },
  ];

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
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-lg">
          Start Writing
        </Button>
      </section>

      {/* Featured Poems */}
      <section className="container px-4 py-16">
        <h2 className="text-3xl font-serif font-bold mb-8 text-center">Featured Poems</h2>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {featuredPoems.map((poem) => (
            <Card key={poem.id} className="p-6 hover:shadow-lg transition-shadow animate-fade-up">
              <h3 className="text-2xl font-serif font-semibold mb-2">{poem.title}</h3>
              <p className="text-gray-600 mb-4 whitespace-pre-line">{poem.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="font-medium">{poem.author}</span>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <Heart size={18} />
                    <span>{poem.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                    <Bookmark size={18} />
                    <span>{poem.bookmarks}</span>
                  </button>
                  <button className="hover:text-gray-700 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
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