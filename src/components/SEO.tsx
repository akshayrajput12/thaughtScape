import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export const SEO = ({
  title = 'CampusCash - Learn, Earn, and Connect on Campus',
  description = 'CampusCash is the ultimate platform for college students to find jobs, freelance opportunities, share thoughts, and connect with peers on campus.',
  keywords = 'campus jobs, college freelancing, student marketplace, campus networking, student gigs, college jobs, campus cash, student opportunities',
}: SEOProps) => {
  const fullTitle = title.includes('CampusCash') ? title : `${title} | CampusCash`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords);

    // Clean up function
    return () => {
      document.title = 'CampusCash';
    };
  }, [fullTitle, description, keywords]);

  // This component doesn't render anything
  return null;
};

export default SEO;
