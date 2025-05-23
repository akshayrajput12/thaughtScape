
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Briefcase, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PoemCard } from "@/components/PoemCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Thought, Advertisement } from "@/types";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import JobsTab from "@/components/explore/JobsTab";
import { AdvertisementCard } from "@/components/advertisements/AdvertisementCard";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState("thoughts");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch thoughts with React Query
  const { data: thoughts = [], isLoading: thoughtsLoading } = useQuery({
    queryKey: ['thoughts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles!thoughts_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load thoughts",
          variant: "destructive",
        });
        throw error;
      }
      return data || [];
    }
  });

  // Fetch advertisements
  const { data: advertisements = [], isLoading: adsLoading } = useQuery({
    queryKey: ['explore-advertisements'],
    queryFn: async () => {
      // First, fetch advertisements
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .contains('display_location', ['explore'])
        .order('created_at', { ascending: false });

      if (adsError) {
        console.error("Error fetching advertisements:", adsError);
        return [];
      }

      // If we have advertisements, fetch the author profiles
      if (adsData && adsData.length > 0) {
        const authorIds = adsData.map(ad => ad.author_id).filter(Boolean);

        if (authorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', authorIds);

          if (profilesError) {
            console.error("Error fetching advertisement authors:", profilesError);
          } else if (profilesData) {
            // Create a map of profiles by ID for quick lookup
            const profilesMap = profilesData.reduce((map, profile) => {
              map[profile.id] = profile;
              return map;
            }, {} as Record<string, any>);

            // Attach author profiles to advertisements
            return adsData.map(ad => ({
              ...ad,
              author: ad.author_id ? profilesMap[ad.author_id] : null
            })) as Advertisement[];
          }
        }
      }

      return adsData as Advertisement[];
    }
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.trim().length > 0);
  };

  const handleDelete = async (thoughtId: string) => {
    try {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thought deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting thought:', error);
      toast({
        title: "Error",
        description: "Failed to delete thought",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-6 md:py-12">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-16 relative"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
            <div className="inline-block mb-2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Explore
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground px-2">
              Discover Campus Opportunities
            </h1>
            <p className="text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto text-base md:text-lg px-4">
              Learn, earn, and connect with fellow students on your campus
            </p>
            <div className="relative max-w-2xl mx-auto px-2">
              <div className="relative bg-card/80 backdrop-blur-md rounded-xl md:rounded-2xl p-2 shadow-lg md:shadow-xl border border-border">
                <Search className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 md:h-5 w-4 md:w-5" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 md:pl-12 h-12 md:h-14 bg-transparent border-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg md:rounded-xl text-base md:text-lg"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 backdrop-blur-md rounded-xl md:rounded-2xl p-4 shadow-lg border border-border w-full max-w-5xl mx-auto"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="thoughts" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Campus Buzz</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Jobs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="thoughts" className="space-y-6">
              {/* Display explore advertisements at the top of the thoughts tab */}
              {!adsLoading && advertisements.length > 0 && (
                <div className="mb-6">
                  <AdvertisementCard
                    advertisement={advertisements[0]}
                    className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5"
                  />
                </div>
              )}

              {thoughtsLoading ? (
                <div className="space-y-4 md:space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-40 md:h-48 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {thoughts
                    .filter(thought =>
                      !searchQuery ||
                      thought.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      thought.author?.username?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((thought, index) => (
                      <motion.div
                        key={thought.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <PoemCard
                          poem={thought}
                          currentUserId={user?.id || null}
                          onDelete={handleDelete}
                        />

                        {/* Insert an advertisement after every 4 posts if available */}
                        {index > 0 &&
                         index % 4 === 0 &&
                         advertisements.length > 1 &&
                         advertisements[Math.min(Math.floor(index / 4), advertisements.length - 1)] && (
                          <div className="my-6">
                            <AdvertisementCard
                              advertisement={advertisements[Math.min(Math.floor(index / 4), advertisements.length - 1)]}
                              variant="compact"
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs">
              {/* Pass advertisements to JobsTab */}
              <JobsTab advertisements={advertisements} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Explore;
