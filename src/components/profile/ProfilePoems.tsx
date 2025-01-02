import type { Poem } from "@/types";

interface ProfilePoemsProps {
  poems: Poem[];
}

export const ProfilePoems = ({ poems }: ProfilePoemsProps) => {
  return (
    <div className="space-y-6">
      {poems.map((poem) => (
        <div key={poem.id} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-serif font-semibold mb-2">{poem.title}</h3>
          <p className="text-gray-700 whitespace-pre-line">{poem.content}</p>
          <div className="mt-4 text-sm text-gray-500">
            {new Date(poem.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};